@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo [MilkDragon] 检查并安装依赖...
python -m pip install -r "%~dp0backend\requirements.txt" -q
if errorlevel 1 (
    echo 依赖安装失败，请确认已安装 Python 并已加入 PATH。
    pause
    exit /b 1
)

echo [MilkDragon] 启动后端（独立窗口）...
start "MilkDragon 后端" /D "%~dp0backend" cmd /k python app.py

echo [MilkDragon] 等待服务启动...
timeout /t 3 /nobreak >nul

start "" "http://127.0.0.1:5000"
echo 已尝试打开前端。停止服务请关闭标题为「MilkDragon 后端」的命令行窗口。
