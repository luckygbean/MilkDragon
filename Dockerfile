FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ ./backend/

# 复制前端静态文件
COPY task-slayer/ ./task-slayer/

WORKDIR /app/backend

EXPOSE 5000

CMD ["python", "-u", "app.py"]
