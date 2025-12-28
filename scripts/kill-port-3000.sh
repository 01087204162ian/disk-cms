#!/bin/bash
# 포트 3000을 사용하는 프로세스 종료 스크립트

echo "포트 3000을 사용하는 프로세스 확인 중..."

# Linux/Mac
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:3000)
    if [ -n "$PID" ]; then
        echo "포트 3000을 사용하는 프로세스 발견: $PID"
        kill -9 $PID
        echo "✅ 프로세스 종료 완료"
    else
        echo "포트 3000을 사용하는 프로세스가 없습니다."
    fi
elif command -v netstat &> /dev/null; then
    PID=$(netstat -tulpn 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ -n "$PID" ]; then
        echo "포트 3000을 사용하는 프로세스 발견: $PID"
        kill -9 $PID
        echo "✅ 프로세스 종료 완료"
    else
        echo "포트 3000을 사용하는 프로세스가 없습니다."
    fi
else
    echo "❌ lsof 또는 netstat 명령어를 찾을 수 없습니다."
    echo "수동으로 프로세스를 종료해주세요."
fi

