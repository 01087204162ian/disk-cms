@echo off
REM 주 4일 근무제 테스트 실행 스크립트 (Windows)

echo ==========================================
echo 주 4일 근무제 자동 테스트 시작
echo ==========================================

REM 타임존 설정 (Windows에서는 환경 변수로 설정)
set TZ=Asia/Seoul

REM 단위 테스트 실행
echo.
echo 1. 단위 테스트 실행 중...
call npm run test:unit

REM 통합 테스트 실행 (선택사항)
REM echo.
REM echo 2. 통합 테스트 실행 중...
REM call npm run test:integration

REM 전체 테스트 실행
REM echo.
REM echo 3. 전체 테스트 실행 중...
REM call npm test

echo.
echo ==========================================
echo 테스트 완료
echo ==========================================
pause

