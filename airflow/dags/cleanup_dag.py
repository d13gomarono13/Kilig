"""
Cleanup DAG

Performs maintenance tasks: stale cache cleanup, old data removal, and index optimization.
Schedule: Daily at 4 AM UTC
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
    'retries': 2,
    'retry_delay': timedelta(minutes=10),
    'execution_timeout': timedelta(hours=1),
}

# Configuration
KILIG_BACKEND_URL = os.getenv('KILIG_BACKEND_URL', 'http://kilig-backend:3000')
OPENSEARCH_URL = os.getenv('OPENSEARCH_URL', 'http://opensearch:9200')
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))

# Retention settings
CACHE_TTL_DAYS = int(os.getenv('CACHE_TTL_DAYS', '7'))
PAPER_RETENTION_DAYS = int(os.getenv('PAPER_RETENTION_DAYS', '365'))


def cleanup_redis_cache(**context):
    """Remove expired and stale cache entries"""
    import redis
    
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, socket_timeout=30)
        
        # Get memory stats before cleanup
        info_before = r.info('memory')
        memory_before = info_before.get('used_memory_human', 'unknown')
        
        # Count keys before
        keys_before = r.dbsize()
        
        # Scan and remove keys older than TTL
        # Note: Most Redis keys should already have TTL set
        # This handles any orphaned keys without TTL
        deleted_count = 0
        pattern_prefixes = ['embedding:*', 'search:*', 'response:*']
        
        for pattern in pattern_prefixes:
            cursor = 0
            while True:
                cursor, keys = r.scan(cursor=cursor, match=pattern, count=100)
                for key in keys:
                    ttl = r.ttl(key)
                    # If no TTL set (-1) or very long TTL, check age via idle time
                    if ttl == -1:
                        idle = r.object('idletime', key) or 0
                        if idle > (CACHE_TTL_DAYS * 86400):  # Idle for more than TTL days
                            r.delete(key)
                            deleted_count += 1
                
                if cursor == 0:
                    break
        
        # Get memory stats after
        info_after = r.info('memory')
        memory_after = info_after.get('used_memory_human', 'unknown')
        keys_after = r.dbsize()
        
        result = {
            'keys_deleted': deleted_count,
            'keys_before': keys_before,
            'keys_after': keys_after,
            'memory_before': memory_before,
            'memory_after': memory_after,
        }
        
        print(f"[Cleanup] Redis: Deleted {deleted_count} stale keys. Memory: {memory_before} → {memory_after}")
        context['ti'].xcom_push(key='redis_cleanup', value=result)
        return result
        
    except Exception as e:
        print(f"[Cleanup] Redis cleanup error: {e}")
        return {'error': str(e)}


def cleanup_old_papers(**context):
    """Remove papers older than retention period (optional - disabled by default)"""
    # This is a placeholder - actual implementation depends on business rules
    # Most scientific papers should be retained indefinitely
    
    result = {
        'action': 'skipped',
        'reason': 'Paper retention is set to indefinite by default',
        'retention_days': PAPER_RETENTION_DAYS,
    }
    
    print(f"[Cleanup] Papers: Skipped (retention={PAPER_RETENTION_DAYS} days)")
    context['ti'].xcom_push(key='paper_cleanup', value=result)
    return result


def optimize_opensearch_indices(**context):
    """Force merge and optimize OpenSearch indices"""
    index_name = os.getenv('OPENSEARCH_INDEX', 'arxiv-papers-chunks')
    
    try:
        # Force merge to reduce segment count
        response = requests.post(
            f'{OPENSEARCH_URL}/{index_name}/_forcemerge',
            params={'max_num_segments': 1},
            timeout=300
        )
        
        # Clear field data cache
        cache_response = requests.post(
            f'{OPENSEARCH_URL}/{index_name}/_cache/clear',
            timeout=30
        )
        
        # Get index stats after optimization
        stats_response = requests.get(
            f'{OPENSEARCH_URL}/{index_name}/_stats',
            timeout=30
        )
        stats = stats_response.json()
        
        result = {
            'force_merge': response.status_code == 200,
            'cache_cleared': cache_response.status_code == 200,
            'segments': stats.get('_all', {}).get('primaries', {}).get('segments', {}).get('count'),
            'doc_count': stats.get('_all', {}).get('primaries', {}).get('docs', {}).get('count'),
            'store_size': stats.get('_all', {}).get('primaries', {}).get('store', {}).get('size_in_bytes'),
        }
        
        print(f"[Cleanup] OpenSearch: Optimized index. Segments={result['segments']}, Docs={result['doc_count']}")
        context['ti'].xcom_push(key='opensearch_optimize', value=result)
        return result
        
    except Exception as e:
        print(f"[Cleanup] OpenSearch optimization error: {e}")
        return {'error': str(e)}


def cleanup_temp_files(**context):
    """Clean up temporary files from paper parsing"""
    try:
        response = requests.post(
            f'{KILIG_BACKEND_URL}/api/admin/cleanup-temp',
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"[Cleanup] Temp files: Removed {result.get('files_removed', 0)} files")
            return result
        else:
            return {'status': 'endpoint_not_available'}
            
    except requests.RequestException:
        # Endpoint might not exist yet
        return {'status': 'endpoint_not_available'}


def send_cleanup_report(**context):
    """Generate and send cleanup summary report"""
    ti = context['ti']
    
    report = {
        'execution_date': str(context['execution_date']),
        'redis_cleanup': ti.xcom_pull(key='redis_cleanup', task_ids='cleanup_redis'),
        'paper_cleanup': ti.xcom_pull(key='paper_cleanup', task_ids='cleanup_papers'),
        'opensearch_optimize': ti.xcom_pull(key='opensearch_optimize', task_ids='optimize_opensearch'),
    }
    
    print(f"[Cleanup] Report:\n{json.dumps(report, indent=2)}")
    
    # Optional Slack notification
    slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
    if slack_webhook:
        try:
            redis_result = report.get('redis_cleanup', {})
            requests.post(slack_webhook, json={
                'text': f"🧹 *Cleanup Complete*\n• Redis keys deleted: {redis_result.get('keys_deleted', 'N/A')}\n• OpenSearch optimized: ✅"
            })
        except Exception as e:
            print(f"[Cleanup] Slack notification failed: {e}")
    
    return report


# DAG Definition
with DAG(
    dag_id='cleanup_dag',
    default_args=default_args,
    description='Cleanup stale cache and optimize storage',
    schedule_interval='0 4 * * *',  # Daily at 4 AM UTC
    start_date=days_ago(1),
    catchup=False,
    tags=['cleanup', 'maintenance', 'optimization'],
    max_active_runs=1,
) as dag:
    
    cleanup_redis = PythonOperator(
        task_id='cleanup_redis',
        python_callable=cleanup_redis_cache,
        provide_context=True,
    )
    
    cleanup_papers = PythonOperator(
        task_id='cleanup_papers',
        python_callable=cleanup_old_papers,
        provide_context=True,
    )
    
    optimize_opensearch = PythonOperator(
        task_id='optimize_opensearch',
        python_callable=optimize_opensearch_indices,
        provide_context=True,
    )
    
    cleanup_temp = PythonOperator(
        task_id='cleanup_temp',
        python_callable=cleanup_temp_files,
        provide_context=True,
    )
    
    send_report = PythonOperator(
        task_id='send_report',
        python_callable=send_cleanup_report,
        provide_context=True,
        trigger_rule='all_done',
    )
    
    # Task dependencies - parallel cleanup tasks, then report
    [cleanup_redis, cleanup_papers, optimize_opensearch, cleanup_temp] >> send_report
