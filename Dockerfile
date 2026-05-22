FROM python:3.11-slim\n\n# Set working directory\nWORKDIR /app\n\n# Install system dependencies (if any)\nRUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*\n\n# Copy requirement file and install python packages\nCOPY requirements.txt ./\nRUN pip install --no-cache-dir -r requirements.txt\n\n# Copy project files\nCOPY . ./\n\n# Expose dashboard port\nEXPOSE 8000\n\n# Default command to run the dashboard server\nCMD ["python", "dashboard_server.py"]
