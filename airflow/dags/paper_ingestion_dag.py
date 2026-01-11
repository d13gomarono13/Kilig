"""
Paper Ingestion DAG

Automated pipeline for fetching, parsing, and indexing scientific papers from ArXiv.
Schedule: Daily at 2 AM UTC
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.utils.dates import days_ago
from airflow.models import Variable
import requests
import arxiv
import json
import os

# Default arguments
default_args = {
    'owner': 'kilig',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2),
}

# Configuration
KILIG_BACKEND_URL = os.getenv('KILIG_BACKEND_URL', 'http://kilig-backend:3000')
ARXIV_CATEGORIES = ['cs.AI', 'cs.CL', 'cs.LG', 'cs.CV', 'cs.NE']
MAX_PAPERS_PER_RUN = int(os.getenv('MAX_PAPERS_PER_RUN', '50'))


def fetch_new_papers(**context):
    """Fetch recent papers from ArXiv API"""
    client = arxiv.Client()
    
    # Build search query for multiple categories
    query = ' OR '.join([f'cat:{cat}' for cat in ARXIV_CATEGORIES])
    
    search = arxiv.Search(
        query=query,
        max_results=MAX_PAPERS_PER_RUN,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending
    )
    
    papers = []
    for result in client.results(search):
        paper = {
            'arxiv_id': result.entry_id.split('/')[-1],
            'title': result.title,
            'abstract': result.summary,
            'authors': [author.name for author in result.authors],
            'categories': result.categories,
            'published_date': result.published.isoformat(),
            'pdf_url': result.pdf_url,
            'primary_category': result.primary_category,
        }
        papers.append(paper)
    
    print(f"[Airflow] Fetched {len(papers)} papers from ArXiv")
    
    # Push to XCom for downstream tasks
    context['ti'].xcom_push(key='fetched_papers', value=papers)
    return len(papers)


def filter_new_papers(**context):
    """Filter out papers that are already indexed"""
    ti = context['ti']
    papers = ti.xcom_pull(key='fetched_papers', task_ids='fetch_papers')
    
    if not papers:
        print("[Airflow] No papers to filter")
        return 0
    
    # Check which papers already exist in OpenSearch via backend API
    try:
        response = requests.post(
            f'{KILIG_BACKEND_URL}/api/papers/check-existing',
            json={'arxiv_ids': [p['arxiv_id'] for p in papers]},
            timeout=30
        )
        existing_ids = response.json().get('existing_ids', [])
    except requests.RequestException as e:
        print(f"[Airflow] Backend check failed, processing all: {e}")
        existing_ids = []
    
    new_papers = [p for p in papers if p['arxiv_id'] not in existing_ids]
    
    print(f"[Airflow] {len(new_papers)} new papers to index (filtered {len(existing_ids)} existing)")
    
    ti.xcom_push(key='new_papers', value=new_papers)
    return len(new_papers)


def download_and_parse_papers(**context):
    """Download PDFs and extract full text"""
    ti = context['ti']
    papers = ti.xcom_pull(key='new_papers', task_ids='filter_papers')
    
    if not papers:
        print("[Airflow] No papers to parse")
        return 0
    
    parsed_papers = []
    for paper in papers:
        try:
            # Call backend parsing endpoint (uses Docling MCP)
            response = requests.post(
                f'{KILIG_BACKEND_URL}/api/papers/parse',
                json={'arxiv_id': paper['arxiv_id'], 'pdf_url': paper['pdf_url']},
                timeout=120
            )
            
            if response.status_code == 200:
                parsed = response.json()
                paper['full_text'] = parsed.get('full_text', '')
                paper['sections'] = parsed.get('sections', [])
                parsed_papers.append(paper)
                print(f"[Airflow] Parsed: {paper['arxiv_id']}")
            else:
                print(f"[Airflow] Failed to parse {paper['arxiv_id']}: {response.status_code}")
                
        except requests.RequestException as e:
            print(f"[Airflow] Parse error for {paper['arxiv_id']}: {e}")
    
    ti.xcom_push(key='parsed_papers', value=parsed_papers)
    return len(parsed_papers)


def index_papers(**context):
    """Chunk, embed, and index papers to OpenSearch"""
    ti = context['ti']
    papers = ti.xcom_pull(key='parsed_papers', task_ids='parse_papers')
    
    if not papers:
        print("[Airflow] No papers to index")
        return {'success': 0, 'failed': 0}
    
    success_count = 0
    failed_count = 0
    
    for paper in papers:
        try:
            response = requests.post(
                f'{KILIG_BACKEND_URL}/api/papers/index',
                json=paper,
                timeout=180
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"[Airflow] Indexed {paper['arxiv_id']}: {result.get('chunks_indexed', 0)} chunks")
                success_count += 1
            else:
                print(f"[Airflow] Index failed for {paper['arxiv_id']}: {response.status_code}")
                failed_count += 1
                
        except requests.RequestException as e:
            print(f"[Airflow] Index error for {paper['arxiv_id']}: {e}")
            failed_count += 1
    
    result = {'success': success_count, 'failed': failed_count}
    ti.xcom_push(key='index_result', value=result)
    return result


def send_completion_notification(**context):
    """Send notification on completion"""
    ti = context['ti']
    
    fetched = ti.xcom_pull(task_ids='fetch_papers') or 0
    filtered = ti.xcom_pull(task_ids='filter_papers') or 0
    parsed = ti.xcom_pull(task_ids='parse_papers') or 0
    index_result = ti.xcom_pull(key='index_result', task_ids='index_papers') or {}
    
    summary = {
        'dag_id': 'paper_ingestion_dag',
        'execution_date': str(context['execution_date']),
        'papers_fetched': fetched,
        'papers_new': filtered,
        'papers_parsed': parsed,
        'papers_indexed': index_result.get('success', 0),
        'papers_failed': index_result.get('failed', 0),
    }
    
    print(f"[Airflow] Ingestion complete: {json.dumps(summary, indent=2)}")
    
    # Optional: Send to Slack
    slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
    if slack_webhook:
        try:
            requests.post(slack_webhook, json={
                'text': f"📚 Paper Ingestion Complete\n```{json.dumps(summary, indent=2)}```"
            })
        except Exception as e:
            print(f"[Airflow] Slack notification failed: {e}")
    
    return summary


# DAG Definition
with DAG(
    dag_id='paper_ingestion_dag',
    default_args=default_args,
    description='Automated paper ingestion from ArXiv',
    schedule_interval='0 2 * * *',  # Daily at 2 AM UTC
    start_date=days_ago(1),
    catchup=False,
    tags=['ingestion', 'arxiv', 'papers'],
    max_active_runs=1,
) as dag:
    
    fetch_task = PythonOperator(
        task_id='fetch_papers',
        python_callable=fetch_new_papers,
        provide_context=True,
    )
    
    filter_task = PythonOperator(
        task_id='filter_papers',
        python_callable=filter_new_papers,
        provide_context=True,
    )
    
    parse_task = PythonOperator(
        task_id='parse_papers',
        python_callable=download_and_parse_papers,
        provide_context=True,
    )
    
    index_task = PythonOperator(
        task_id='index_papers',
        python_callable=index_papers,
        provide_context=True,
    )
    
    notify_task = PythonOperator(
        task_id='send_notification',
        python_callable=send_completion_notification,
        provide_context=True,
        trigger_rule='all_done',  # Run even if upstream fails
    )
    
    # Task dependencies
    fetch_task >> filter_task >> parse_task >> index_task >> notify_task
