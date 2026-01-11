"""
Health Check DAG

Monitors health of all Kilig services and alerts on failures.
Schedule: Every 15 minutes
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.utils.dates import days_ago
import requests
import os
import json

# Default arguments
default_args = {
    'owner': 'kilig',
    'depends_on_past': False,
    'email_on_failure': True,
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
    'execution_timeout': timedelta(minutes=5),
}

# Configuration
KILIG_BACKEND_URL = os.getenv('KILIG_BACKEND_URL', 'http://kilig-backend:3000')
OPENSEARCH_URL = os.getenv('OPENSEARCH_URL', 'http://opensearch:9200')
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))


def check_backend_health(**context):
    """Check Kilig backend API health"""
    try:
        response = requests.get(f'{KILIG_BACKEND_URL}/health', timeout=10)
        is_healthy = response.status_code == 200
        
        result = {
            'service': 'backend',
            'healthy': is_healthy,
            'status_code': response.status_code,
            'response': response.json() if response.ok else None,
        }
        
        print(f"[HealthCheck] Backend: {'✅ Healthy' if is_healthy else '❌ Unhealthy'}")
        context['ti'].xcom_push(key='backend_health', value=result)
        return result
        
    except Exception as e:
        result = {'service': 'backend', 'healthy': False, 'error': str(e)}
        print(f"[HealthCheck] Backend: ❌ Error - {e}")
        context['ti'].xcom_push(key='backend_health', value=result)
        return result


def check_opensearch_health(**context):
    """Check OpenSearch cluster health"""
    try:
        response = requests.get(f'{OPENSEARCH_URL}/_cluster/health', timeout=10)
        data = response.json()
        
        # Consider yellow (single node) or green as healthy
        is_healthy = data.get('status') in ['green', 'yellow']
        
        result = {
            'service': 'opensearch',
            'healthy': is_healthy,
            'cluster_status': data.get('status'),
            'number_of_nodes': data.get('number_of_nodes'),
            'active_shards': data.get('active_shards'),
        }
        
        print(f"[HealthCheck] OpenSearch: {'✅' if is_healthy else '❌'} Status={data.get('status')}")
        context['ti'].xcom_push(key='opensearch_health', value=result)
        return result
        
    except Exception as e:
        result = {'service': 'opensearch', 'healthy': False, 'error': str(e)}
        print(f"[HealthCheck] OpenSearch: ❌ Error - {e}")
        context['ti'].xcom_push(key='opensearch_health', value=result)
        return result


def check_redis_health(**context):
    """Check Redis connection"""
    import redis
    
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, socket_timeout=5)
        pong = r.ping()
        is_healthy = pong is True
        
        # Get some stats
        info = r.info('memory')
        
        result = {
            'service': 'redis',
            'healthy': is_healthy,
            'used_memory_human': info.get('used_memory_human'),
            'connected_clients': r.info('clients').get('connected_clients'),
        }
        
        print(f"[HealthCheck] Redis: {'✅ Healthy' if is_healthy else '❌ Unhealthy'}")
        context['ti'].xcom_push(key='redis_health', value=result)
        return result
        
    except Exception as e:
        result = {'service': 'redis', 'healthy': False, 'error': str(e)}
        print(f"[HealthCheck] Redis: ❌ Error - {e}")
        context['ti'].xcom_push(key='redis_health', value=result)
        return result


def check_langfuse_health(**context):
    """Check Langfuse observability service"""
    langfuse_url = os.getenv('LANGFUSE_URL', 'http://langfuse:3000')
    
    try:
        response = requests.get(f'{langfuse_url}/api/public/health', timeout=10)
        is_healthy = response.status_code == 200
        
        result = {
            'service': 'langfuse',
            'healthy': is_healthy,
            'status_code': response.status_code,
        }
        
        print(f"[HealthCheck] Langfuse: {'✅ Healthy' if is_healthy else '❌ Unhealthy'}")
        context['ti'].xcom_push(key='langfuse_health', value=result)
        return result
        
    except Exception as e:
        result = {'service': 'langfuse', 'healthy': False, 'error': str(e)}
        print(f"[HealthCheck] Langfuse: ❌ Error - {e}")
        context['ti'].xcom_push(key='langfuse_health', value=result)
        return result


def aggregate_health_status(**context):
    """Aggregate all health check results and decide on alerting"""
    ti = context['ti']
    
    results = {
        'backend': ti.xcom_pull(key='backend_health', task_ids='check_backend'),
        'opensearch': ti.xcom_pull(key='opensearch_health', task_ids='check_opensearch'),
        'redis': ti.xcom_pull(key='redis_health', task_ids='check_redis'),
        'langfuse': ti.xcom_pull(key='langfuse_health', task_ids='check_langfuse'),
    }
    
    unhealthy_services = [
        name for name, result in results.items() 
        if result and not result.get('healthy', False)
    ]
    
    all_healthy = len(unhealthy_services) == 0
    
    summary = {
        'timestamp': datetime.utcnow().isoformat(),
        'all_healthy': all_healthy,
        'unhealthy_services': unhealthy_services,
        'details': results,
    }
    
    print(f"[HealthCheck] Summary: {'✅ All systems healthy' if all_healthy else f'❌ Unhealthy: {unhealthy_services}'}")
    
    ti.xcom_push(key='health_summary', value=summary)
    
    # Return branch decision
    return 'all_healthy' if all_healthy else 'send_alert'


def send_health_alert(**context):
    """Send alert for unhealthy services"""
    ti = context['ti']
    summary = ti.xcom_pull(key='health_summary', task_ids='aggregate_health')
    
    alert_message = {
        'severity': 'critical',
        'title': '🚨 Kilig Service Health Alert',
        'unhealthy_services': summary.get('unhealthy_services', []),
        'timestamp': summary.get('timestamp'),
        'details': summary.get('details'),
    }
    
    print(f"[HealthCheck] ALERT: {json.dumps(alert_message, indent=2)}")
    
    # Send to Slack
    slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
    if slack_webhook:
        try:
            unhealthy = ', '.join(summary.get('unhealthy_services', []))
            requests.post(slack_webhook, json={
                'text': f"🚨 *Health Alert*: Unhealthy services: {unhealthy}",
                'attachments': [{
                    'color': 'danger',
                    'fields': [
                        {'title': s, 'value': str(summary['details'].get(s, {}).get('error', 'Unknown')), 'short': True}
                        for s in summary.get('unhealthy_services', [])
                    ]
                }]
            })
        except Exception as e:
            print(f"[HealthCheck] Slack alert failed: {e}")
    
    # Could also send to PagerDuty, OpsGenie, etc.
    return alert_message


# DAG Definition
with DAG(
    dag_id='health_check_dag',
    default_args=default_args,
    description='Monitor health of all Kilig services',
    schedule_interval='*/15 * * * *',  # Every 15 minutes
    start_date=days_ago(1),
    catchup=False,
    tags=['health', 'monitoring', 'alerts'],
    max_active_runs=1,
) as dag:
    
    check_backend = PythonOperator(
        task_id='check_backend',
        python_callable=check_backend_health,
        provide_context=True,
    )
    
    check_opensearch = PythonOperator(
        task_id='check_opensearch',
        python_callable=check_opensearch_health,
        provide_context=True,
    )
    
    check_redis = PythonOperator(
        task_id='check_redis',
        python_callable=check_redis_health,
        provide_context=True,
    )
    
    check_langfuse = PythonOperator(
        task_id='check_langfuse',
        python_callable=check_langfuse_health,
        provide_context=True,
    )
    
    aggregate_health = BranchPythonOperator(
        task_id='aggregate_health',
        python_callable=aggregate_health_status,
        provide_context=True,
    )
    
    all_healthy = EmptyOperator(task_id='all_healthy')
    
    send_alert = PythonOperator(
        task_id='send_alert',
        python_callable=send_health_alert,
        provide_context=True,
    )
    
    done = EmptyOperator(task_id='done', trigger_rule='none_failed_min_one_success')
    
    # Task dependencies - parallel health checks, then aggregate
    [check_backend, check_opensearch, check_redis, check_langfuse] >> aggregate_health
    aggregate_health >> [all_healthy, send_alert] >> done
