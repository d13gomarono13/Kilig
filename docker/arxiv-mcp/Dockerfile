FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Install arxiv-mcp-server
RUN uv tool install arxiv-mcp-server

# Create storage directory
RUN mkdir -p /app/data/papers

# Keep container running so we can exec into it
# We use tail -f /dev/null to keep it alive since it's an on-demand tool
CMD ["tail", "-f", "/dev/null"]
