# Airflow Docker Environment
FROM apache/airflow:2.8.0-python3.11

USER root

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER airflow

# Install Python dependencies for DAGs
COPY requirements.txt /opt/airflow/requirements.txt
RUN pip install --no-cache-dir -r /opt/airflow/requirements.txt

# Copy DAGs
COPY dags/ /opt/airflow/dags/
