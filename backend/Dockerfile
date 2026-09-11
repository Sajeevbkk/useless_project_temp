FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PORT=5098 \
    HOST=0.0.0.0

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5098

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5098"]
