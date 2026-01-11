"""
Analytics DAG

Collects usage statistics, performance metrics, and generates reports.
Schedule: Daily at 6 AM UTC
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
    'email_on_failure': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=1),
}

# Configuration
KILIG_BACKEND_URL = os.getenv('KILIG_BACKEND_URL', 'http://kilig-backend:3000')
OPENSEARCH_URL = os.getenv('OPENSEARCH_URL', 'http://opensearch:9200')
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
LANGFUSE_URL = os.getenv('LANGFUSE_URL', 'http://langfuse:3000')


def collect_search_metrics(**context):
    """Collect search performance metrics from OpenSearch"""
    try:
        # Get index stats
        response = requests.get(
            f'{OPENSEARCH_URL}/_stats',
            timeout=30
        )
        stats = response.json()
        
        all_stats = stats.get('_all', {}).get('total', {})
        
        metrics = {
            'search': {
                'query_total': all_stats.get('search', {}).get('query_total', 0),
                'query_time_ms': all_stats.get('search', {}).get('query_time_in_millis', 0),
                'fetch_total': all_stats.get('search', {}).get('fetch_total', 0),
            },
            'indexing': {
                'index_total': all_stats.get('indexing', {}).get('index_total', 0),
                'index_time_ms': all_stats.get('indexing', {}).get('index_time_in_millis', 0),
            },
            'docs': {
                'count': all_stats.get('docs', {}).get('count', 0),
                'deleted': all_stats.get('docs', {}).get('deleted', 0),
            },
            'store': {
                'size_bytes': all_stats.get('store', {}).get('size_in_bytes', 0),
            },
        }
        
        # Calculate average query time
        query_total = metrics['search']['query_total']
        if query_total > 0:
            metrics['search']['avg_query_time_ms'] = metrics['search']['query_time_ms'] / query_total
        
        print(f"[Analytics] Search metrics: {metrics['search']['query_total']} queries, {metrics['docs']['count']} docs")
        context['ti'].xcom_push(key='search_metrics', value=metrics)
        return metrics
        
    except Exception as e:
        print(f"[Analytics] Search metrics error: {e}")
        return {'error': str(e)}


def collect_cache_metrics(**context):
    """Collect cache hit/miss statistics from Redis"""
    import redis
    
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, socket_timeout=10)
        
        info = r.info()
        
        metrics = {
            'hits': info.get('keyspace_hits', 0),
            'misses': info.get('keyspace_misses', 0),
            'connected_clients': info.get('connected_clients', 0),
            'used_memory_human': info.get('used_memory_human', 'N/A'),
            'used_memory_peak_human': info.get('used_memory_peak_human', 'N/A'),
            'total_keys': r.dbsize(),
            'evicted_keys': info.get('evicted_keys', 0),
        }
        
        # Calculate hit rate
        total = metrics['hits'] + metrics['misses']
        if total > 0:
            metrics['hit_rate'] = round((metrics['hits'] / total) * 100, 2)
        else:
            metrics['hit_rate'] = 0
        
        print(f"[Analytics] Cache metrics: {metrics['hit_rate']}% hit rate, {metrics['total_keys']} keys")
        context['ti'].xcom_push(key='cache_metrics', value=metrics)
        return metrics
        
    except Exception as e:
        print(f"[Analytics] Cache metrics error: {e}")
        return {'error': str(e)}


def collect_api_metrics(**context):
    """Collect API usage metrics from backend"""
    try:
        response = requests.get(
            f'{KILIG_BACKEND_URL}/api/admin/metrics',
            timeout=30
        )
        
        if response.status_code == 200:
            metrics = response.json()
            print(f"[Analytics] API metrics collected")
            context['ti'].xcom_push(key='api_metrics', value=metrics)
            return metrics
        else:
            # Endpoint might not exist yet
            metrics = {'status': 'endpoint_not_available'}
            context['ti'].xcom_push(key='api_metrics', value=metrics)
            return metrics
            
    except requests.RequestException as e:
        metrics = {'status': 'endpoint_not_available', 'note': str(e)}
        context['ti'].xcom_push(key='api_metrics', value=metrics)
        return metrics


def collect_agent_metrics(**context):
    """Collect agent execution metrics from Langfuse"""
    try:
        # This would query Langfuse API for agent traces
        # For now, return placeholder metrics
        
        metrics = {
            'status': 'langfuse_integration_pending',
            'note': 'Implement Langfuse API queries for detailed agent metrics',
            'placeholder': {
                'total_traces': 0,
                'avg_latency_ms': 0,
                'success_rate': 100,
            }
        }
        
        print(f"[Analytics] Agent metrics: Integration pending")
        context['ti'].xcom_push(key='agent_metrics', value=metrics)
        return metrics
        
    except Exception as e:
        print(f"[Analytics] Agent metrics error: {e}")
        return {'error': str(e)}


def collect_paper_stats(**context):
    """Collect statistics about indexed papers"""
    try:
        # Get paper count by category
        response = requests.post(
            f'{OPENSEARCH_URL}/arxiv-papers-chunks/_search',
            json={
                'size': 0,
                'aggs': {
                    'by_category': {
                        'terms': {
                            'field': 'categories',
                            'size': 20
                        }
                    },
                    'unique_papers': {
                        'cardinality': {
                            'field': 'arxiv_id'
                        }
                    },
                    'total_chunks': {
                        'value_count': {
                            'field': 'chunk_index'
                        }
                    }
                }
            },
            timeout=30
        )
        
        data = response.json()
        aggs = data.get('aggregations', {})
        
        category_counts = {
            b['key']: b['doc_count'] 
            for b in aggs.get('by_category', {}).get('buckets', [])
        }
        
        metrics = {
            'unique_papers': aggs.get('unique_papers', {}).get('value', 0),
            'total_chunks': aggs.get('total_chunks', {}).get('value', 0),
            'by_category': category_counts,
        }
        
        print(f"[Analytics] Paper stats: {metrics['unique_papers']} papers, {metrics['total_chunks']} chunks")
        context['ti'].xcom_push(key='paper_stats', value=metrics)
        return metrics
        
    except Exception as e:
        print(f"[Analytics] Paper stats error: {e}")
        return {'error': str(e)}


def generate_daily_report(**context):
    """Generate comprehensive daily analytics report"""
    ti = context['ti']
    execution_date = context['execution_date']
    
    report = {
        'report_date': str(execution_date.date()),
        'generated_at': datetime.utcnow().isoformat(),
        'search': ti.xcom_pull(key='search_metrics', task_ids='collect_search_metrics'),
        'cache': ti.xcom_pull(key='cache_metrics', task_ids='collect_cache_metrics'),
        'api': ti.xcom_pull(key='api_metrics', task_ids='collect_api_metrics'),
        'agents': ti.xcom_pull(key='agent_metrics', task_ids='collect_agent_metrics'),
        'papers': ti.xcom_pull(key='paper_stats', task_ids='collect_paper_stats'),
    }
    
    print(f"[Analytics] Daily Report:\n{json.dumps(report, indent=2)}")
    
    # Store report (could be sent to Supabase, S3, etc.)
    context['ti'].xcom_push(key='daily_report', value=report)
    
    # Send summary to Slack
    slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
    if slack_webhook:
        try:
            cache = report.get('cache', {})
            papers = report.get('papers', {})
            
            summary_text = (
                f"📊 *Daily Analytics - {report['report_date']}*\n"
                f"• Papers indexed: {papers.get('unique_papers', 'N/A')}\n"
                f"• Total chunks: {papers.get('total_chunks', 'N/A')}\n"
                f"• Cache hit rate: {cache.get('hit_rate', 'N/A')}%\n"
                f"• Redis memory: {cache.get('used_memory_human', 'N/A')}"
            )
            
            requests.post(slack_webhook, json={'text': summary_text})
        except Exception as e:
            print(f"[Analytics] Slack notification failed: {e}")
    
    return report


# DAG Definition
with DAG(
    dag_id='analytics_dag',
    default_args=default_args,
    description='Collect usage statistics and generate reports',
    schedule_interval='0 6 * * *',  # Daily at 6 AM UTC
    start_date=days_ago(1),
    catchup=False,
    tags=['analytics', 'metrics', 'reporting'],
    max_active_runs=1,
) as dag:
    
    search_metrics = PythonOperator(
        task_id='collect_search_metrics',
        python_callable=collect_search_metrics,
        provide_context=True,
    )
    
    cache_metrics = PythonOperator(
        task_id='collect_cache_metrics',
        python_callable=collect_cache_metrics,
        provide_context=True,
    )
    
    api_metrics = PythonOperator(
        task_id='collect_api_metrics',
        python_callable=collect_api_metrics,
        provide_context=True,
    )
    
    agent_metrics = PythonOperator(
        task_id='collect_agent_metrics',
        python_callable=collect_agent_metrics,
        provide_context=True,
    )
    
    paper_stats = PythonOperator(
        task_id='collect_paper_stats',
        python_callable=collect_paper_stats,
        provide_context=True,
    )
    
    daily_report = PythonOperator(
        task_id='generate_report',
        python_callable=generate_daily_report,
        provide_context=True,
    )
    
    # Parallel metric collection, then report generation
    [search_metrics, cache_metrics, api_metrics, agent_metrics, paper_stats] >> daily_report
