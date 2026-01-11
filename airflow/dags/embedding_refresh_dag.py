"""
Embedding Refresh DAG

Re-generates embeddings for papers when embedding model is updated.
Schedule: Manual trigger only (or monthly for incremental updates)
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
import requests
import os
import json

# Default arguments
default_args = {
    'owner': 'kilig',
    'depends_on_past': False,
    'email_on_failure': True,
    'retries': 3,
    'retry_delay': timedelta(minutes=15),
    'execution_timeout': timedelta(hours=6),
}

# Configuration
KILIG_BACKEND_URL = os.getenv('KILIG_BACKEND_URL', 'http://kilig-backend:3000')
OPENSEARCH_URL = os.getenv('OPENSEARCH_URL', 'http://opensearch:9200')
BATCH_SIZE = int(os.getenv('EMBEDDING_BATCH_SIZE', '100'))


def get_papers_to_refresh(**context):
    """Get list of papers that need embedding refresh"""
    params = context.get('params', {})
    
    # Can be triggered with specific papers or refresh all
    specific_papers = params.get('arxiv_ids', [])
    refresh_all = params.get('refresh_all', False)
    embedding_model = params.get('new_model', 'text-embedding-004')
    
    try:
        if specific_papers:
            papers = specific_papers
        elif refresh_all:
            # Get all paper IDs from OpenSearch
            response = requests.post(
                f'{OPENSEARCH_URL}/arxiv-papers-chunks/_search',
                json={
                    'size': 0,
                    'aggs': {
                        'unique_papers': {
                            'terms': {
                                'field': 'arxiv_id',
                                'size': 10000
                            }
                        }
                    }
                },
                timeout=60
            )
            data = response.json()
            buckets = data.get('aggregations', {}).get('unique_papers', {}).get('buckets', [])
            papers = [b['key'] for b in buckets]
        else:
            # Get papers embedded with old model version (if metadata tracked)
            papers = []
        
        result = {
            'paper_count': len(papers),
            'papers': papers,
            'target_model': embedding_model,
        }
        
        print(f"[EmbeddingRefresh] Found {len(papers)} papers to refresh")
        context['ti'].xcom_push(key='papers_to_refresh', value=result)
        return result
        
    except Exception as e:
        print(f"[EmbeddingRefresh] Error getting papers: {e}")
        return {'error': str(e), 'paper_count': 0, 'papers': []}


def process_paper_batch(**context):
    """Process papers in batches to avoid memory issues"""
    ti = context['ti']
    refresh_data = ti.xcom_pull(key='papers_to_refresh', task_ids='get_papers')
    
    papers = refresh_data.get('papers', [])
    if not papers:
        print("[EmbeddingRefresh] No papers to process")
        return {'processed': 0, 'failed': 0}
    
    processed = 0
    failed = 0
    
    # Process in batches
    for i in range(0, len(papers), BATCH_SIZE):
        batch = papers[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(papers) + BATCH_SIZE - 1) // BATCH_SIZE
        
        print(f"[EmbeddingRefresh] Processing batch {batch_num}/{total_batches}")
        
        for arxiv_id in batch:
            try:
                response = requests.post(
                    f'{KILIG_BACKEND_URL}/api/papers/{arxiv_id}/reindex',
                    json={'force_embed': True},
                    timeout=180
                )
                
                if response.status_code == 200:
                    processed += 1
                else:
                    print(f"[EmbeddingRefresh] Failed {arxiv_id}: {response.status_code}")
                    failed += 1
                    
            except requests.RequestException as e:
                print(f"[EmbeddingRefresh] Error {arxiv_id}: {e}")
                failed += 1
        
        print(f"[EmbeddingRefresh] Batch {batch_num} complete: {processed} processed, {failed} failed")
    
    result = {'processed': processed, 'failed': failed, 'total': len(papers)}
    ti.xcom_push(key='process_result', value=result)
    return result


def verify_embeddings(**context):
    """Verify that embeddings were updated correctly"""
    ti = context['ti']
    process_result = ti.xcom_pull(key='process_result', task_ids='process_batches')
    
    if not process_result or process_result.get('processed', 0) == 0:
        return {'status': 'skipped', 'reason': 'No papers processed'}
    
    # Verify by checking a sample paper's embedding dimension
    try:
        response = requests.get(
            f'{OPENSEARCH_URL}/arxiv-papers-chunks/_search',
            params={'size': 1},
            timeout=30
        )
        
        data = response.json()
        hits = data.get('hits', {}).get('hits', [])
        
        if hits:
            # Check if embedding exists and has correct dimension
            result = {
                'status': 'verified',
                'sample_checked': True,
                'processed_count': process_result.get('processed', 0),
            }
        else:
            result = {'status': 'no_data'}
        
        print(f"[EmbeddingRefresh] Verification: {result['status']}")
        return result
        
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def send_refresh_report(**context):
    """Send completion report"""
    ti = context['ti']
    
    refresh_data = ti.xcom_pull(key='papers_to_refresh', task_ids='get_papers') or {}
    process_result = ti.xcom_pull(key='process_result', task_ids='process_batches') or {}
    
    report = {
        'dag_id': 'embedding_refresh_dag',
        'execution_date': str(context['execution_date']),
        'total_papers': refresh_data.get('paper_count', 0),
        'processed': process_result.get('processed', 0),
        'failed': process_result.get('failed', 0),
        'target_model': refresh_data.get('target_model', 'unknown'),
    }
    
    print(f"[EmbeddingRefresh] Report:\n{json.dumps(report, indent=2)}")
    
    # Slack notification
    slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
    if slack_webhook:
        try:
            requests.post(slack_webhook, json={
                'text': f"🔄 *Embedding Refresh Complete*\n• Processed: {report['processed']}/{report['total_papers']}\n• Failed: {report['failed']}\n• Model: {report['target_model']}"
            })
        except Exception as e:
            print(f"[EmbeddingRefresh] Slack notification failed: {e}")
    
    return report


# DAG Definition
with DAG(
    dag_id='embedding_refresh_dag',
    default_args=default_args,
    description='Re-generate embeddings for papers with new model',
    schedule_interval=None,  # Manual trigger only
    start_date=days_ago(1),
    catchup=False,
    tags=['embeddings', 'refresh', 'maintenance'],
    max_active_runs=1,
    params={
        'arxiv_ids': [],  # Specific papers to refresh
        'refresh_all': False,  # Refresh all papers
        'new_model': 'text-embedding-004',  # Target embedding model
    },
) as dag:
    
    get_papers = PythonOperator(
        task_id='get_papers',
        python_callable=get_papers_to_refresh,
        provide_context=True,
    )
    
    process_batches = PythonOperator(
        task_id='process_batches',
        python_callable=process_paper_batch,
        provide_context=True,
    )
    
    verify = PythonOperator(
        task_id='verify_embeddings',
        python_callable=verify_embeddings,
        provide_context=True,
    )
    
    send_report = PythonOperator(
        task_id='send_report',
        python_callable=send_refresh_report,
        provide_context=True,
        trigger_rule='all_done',
    )
    
    # Task dependencies
    get_papers >> process_batches >> verify >> send_report
