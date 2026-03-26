# ../BACKEND_API/Dockerfile

FROM python:3.10-slim

WORKDIR /app

RUN ls
COPY . .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
