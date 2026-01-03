# 테스트 계정 설정 가이드

E2E 테스트를 실행하기 전에 테스트 계정 정보를 설정해야 합니다.

## 방법 1: users.json 파일 수정 (권장)

`tests/e2e/fixtures/users.json` 파일을 열어서 테스트 계정 정보를 입력하세요.

```json
{
  "normal": {
    "email": "your-test-email@example.com",
    "password": "your-test-password",
    "role": "USER",
    "name": "일반 사용자"
  },
  "approver": {
    "email": "approver-email@example.com",
    "password": "approver-password",
    "role": "DEPT_MANAGER",
    "name": "승인자"
  }
}
```

## 방법 2: 환경 변수 사용 (선택사항)

환경 변수를 설정하여 계정 정보를 입력할 수도 있습니다:

```bash
# Windows PowerShell
$env:TEST_EMAIL="your-email@example.com"
$env:TEST_PASSWORD="your-password"

# Windows CMD
set TEST_EMAIL=your-email@example.com
set TEST_PASSWORD=your-password

# Linux/Mac
export TEST_EMAIL="your-email@example.com"
export TEST_PASSWORD="your-password"
```

## 보안 주의사항

⚠️ **중요**: 
- `tests/e2e/fixtures/users.json` 파일은 Git에 커밋하지 마세요
- 테스트 전용 계정을 사용하세요
- 실제 운영 계정 정보를 사용하지 마세요

### .gitignore에 추가

`.gitignore` 파일에 다음을 추가하세요:

```
tests/e2e/fixtures/users.json
tests/e2e/fixtures/users.local.json
```

또는 템플릿 파일만 커밋하고, 실제 계정 정보는 별도 파일에 저장:

```
tests/e2e/fixtures/users.json.template  (Git에 커밋)
tests/e2e/fixtures/users.json          (로컬만 사용, Git 제외)
```

## 테스트 계정 권장사항

테스트에 사용할 계정은 다음 권한을 가진 것이 좋습니다:

1. **일반 사용자 (normal)**
   - 티켓 생성, 수정 가능
   - 상태 변경 가능
   - 체크리스트 관리 가능

2. **승인자 (approver)**
   - DEPT_MANAGER 역할
   - 승인 대기 목록 확인
   - 승인/거부 처리 가능

3. **관리자 (admin)** (선택사항)
   - 모든 권한
   - 시스템 설정 변경 가능

## 설정 확인

설정이 완료되었는지 확인하려면:

```bash
# 로그인 테스트 실행
npx playwright test tests/e2e/scenarios/02-login-test.spec.js
```

계정 정보가 입력되어 있지 않으면 해당 테스트는 자동으로 스킵됩니다.

