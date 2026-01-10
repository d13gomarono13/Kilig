FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for Docling
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

# Install docling-mcp
RUN uv tool install --from=docling-mcp docling-mcp-server

# Keep container running so we can exec into it
CMD ["tail", "-f", "/dev/null"]
