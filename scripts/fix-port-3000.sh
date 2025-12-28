#!/bin/bash
# 포트 3000 충돌 해결 스크립트

echo "=== 포트 3000 충돌 해결 ==="
echo ""

# 포트 3000을 사용하는 프로세스 찾기
echo "1. 포트 3000을 사용하는 프로세스 확인 중..."
PID=$(lsof -ti:3000 2>/dev/null)

if [ -z "$PID" ]; then
    # netstat으로 재시도
    PID=$(netstat -tulpn 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1)
fi

if [ -n "$PID" ]; then
    echo "   발견된 프로세스 PID: $PID"
    
    # 프로세스 정보 확인
    if command -v ps &> /dev/null; then
        ps -p $PID -o pid,cmd 2>/dev/null || echo "   프로세스 정보를 가져올 수 없습니다."
    fi
    
    echo ""
    echo "2. 프로세스 종료 중..."
    kill -9 $PID 2>/dev/null
    
    # 종료 확인
    sleep 1
    if ! kill -0 $PID 2>/dev/null; then
        echo "   ✅ 프로세스 종료 완료"
    else
        echo "   ⚠️  프로세스 종료 실패 (권한이 필요할 수 있습니다)"
        echo "   수동으로 종료: sudo kill -9 $PID"
    fi
else
    echo "   ℹ️  포트 3000을 사용하는 프로세스가 없습니다."
fi

echo ""
echo "3. PM2 프로세스 확인 중..."
if command -v pm2 &> /dev/null; then
    PM2_PROCESSES=$(pm2 list | grep -E "online|stopped" | wc -l)
    if [ "$PM2_PROCESSES" -gt 0 ]; then
        echo "   PM2 프로세스 발견:"
        pm2 list
        echo ""
        read -p "   PM2 프로세스를 종료하시겠습니까? (y/n): " answer
        if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
            pm2 stop all
            echo "   ✅ PM2 프로세스 종료 완료"
        fi
    else
        echo "   ℹ️  실행 중인 PM2 프로세스가 없습니다."
    fi
else
    echo "   ℹ️  PM2가 설치되어 있지 않습니다."
fi

echo ""
echo "=== 완료 ==="
echo "이제 'npm run dev'를 실행할 수 있습니다."

