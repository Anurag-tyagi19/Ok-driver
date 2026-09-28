# ============================================================
# FastAPI Backend Dockerfile
# ============================================================

FROM python:3.11-slim

# Working directory
WORKDIR /app

# Dependencies install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code copy karo
COPY . .

# Port expose karo
EXPOSE 8000

# Server start karo
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
