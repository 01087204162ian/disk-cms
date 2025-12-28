# 포트 3000을 사용하는 프로세스 종료 스크립트 (Windows PowerShell)

Write-Host "포트 3000을 사용하는 프로세스 확인 중..." -ForegroundColor Yellow

try {
    $connection = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($connection) {
        $pid = $connection.OwningProcess
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "포트 3000을 사용하는 프로세스 발견: $pid ($($process.ProcessName))" -ForegroundColor Red
            Stop-Process -Id $pid -Force
            Write-Host "✅ 프로세스 종료 완료" -ForegroundColor Green
        } else {
            Write-Host "프로세스를 찾을 수 없습니다." -ForegroundColor Yellow
        }
    } else {
        Write-Host "포트 3000을 사용하는 프로세스가 없습니다." -ForegroundColor Green
    }
} catch {
    Write-Host "오류 발생: $_" -ForegroundColor Red
    Write-Host "수동으로 프로세스를 종료해주세요." -ForegroundColor Yellow
}

