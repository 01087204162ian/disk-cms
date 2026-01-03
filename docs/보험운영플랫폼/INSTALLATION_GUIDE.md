# 자동화 테스트 도구 설치 가이드

**작성일**: 2026-01-XX  
**대상**: 로컬 PC에 자동화 테스트 도구 설치  
**도구**: Playwright (추천)

---

## 📋 설치 전 확인사항

### 시스템 요구사항

- **Node.js**: 16.0.0 이상 (현재 프로젝트 요구사항과 동일)
- **npm**: Node.js와 함께 설치됨
- **디스크 공간**: 약 500MB (브라우저 포함)
- **OS**: Windows, macOS, Linux 모두 지원

### 현재 환경 확인

```bash
# Node.js 버전 확인
node --version
# v16.0.0 이상이어야 함

# npm 버전 확인
npm --version
```

---

## 🔧 설치 방법

### 방법 1: 프로젝트에 직접 설치 (추천)

프로젝트 디렉토리에 개발 의존성으로 설치합니다.

```bash
# 1. 프로젝트 디렉토리로 이동
cd disk-cms

# 2. Playwright 설치 (개발 의존성)
npm install -D @playwright/test

# 3. 브라우저 설치 (필수)
npx playwright install

# 또는 특정 브라우저만 설치
npx playwright install chromium    # Chrome만
npx playwright install firefox     # Firefox만
npx playwright install webkit      # Safari만
```

**설치 위치**:
- `node_modules/@playwright/` - Playwright 라이브러리
- `node_modules/.cache/ms-playwright/` - 브라우저 바이너리

### 방법 2: 전역 설치 (선택사항)

시스템 전체에서 사용하려면 전역 설치도 가능하지만, 프로젝트별로 설치하는 것을 권장합니다.

```bash
npm install -g @playwright/test
npx playwright install
```

---

## ✅ 설치 확인

### 설치 확인 명령어

```bash
# Playwright 버전 확인
npx playwright --version

# 설치된 브라우저 확인
npx playwright install --dry-run
```

### 간단한 테스트 실행

```bash
# Playwright가 정상 설치되었는지 확인
npx playwright test --version
```

---

## 📁 프로젝트 구조

설치 후 프로젝트 구조는 다음과 같이 됩니다:

```
disk-cms/
├── node_modules/
│   ├── @playwright/
│   │   └── test/              # Playwright 라이브러리
│   └── .cache/
│       └── ms-playwright/     # 브라우저 바이너리
│           ├── chromium-xxxxx/
│           ├── firefox-xxxxx/
│           └── webkit-xxxxx/
├── tests/                     # 테스트 파일 (새로 생성)
│   └── e2e/
│       └── scenarios/
├── playwright.config.js       # 설정 파일 (새로 생성)
└── package.json               # dependencies 업데이트됨
```

---

## 🚀 첫 테스트 실행

### 1. 테스트 코드 자동 생성 (Codegen)

브라우저에서 동작을 기록하면 테스트 코드가 자동 생성됩니다.

```bash
# 서버가 실행 중이어야 함
# 새 터미널에서
cd disk-cms
npm run dev

# 다른 터미널에서 Codegen 실행
npx playwright codegen https://disk-cms.simg.kr
```

**동작**:
1. 브라우저가 자동으로 열림
2. 브라우저에서 동작 수행 (클릭, 입력 등)
3. 오른쪽 패널에 테스트 코드가 실시간으로 생성됨
4. 코드를 복사하여 테스트 파일에 저장

### 2. 간단한 테스트 작성 및 실행

```javascript
// tests/e2e/first-test.spec.js
const { test, expect } = require('@playwright/test');

test('첫 테스트 - 로그인 페이지 접근', async ({ page }) => {
  await page.goto('https://disk-cms.simg.kr/login.html');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
```

```bash
# 테스트 실행
npx playwright test tests/e2e/first-test.spec.js

# 브라우저에서 보면서 실행 (headful 모드)
npx playwright test tests/e2e/first-test.spec.js --headed

# 특정 브라우저로 실행
npx playwright test tests/e2e/first-test.spec.js --project=chromium
```

---

## 📦 package.json 업데이트

설치 후 `package.json`에 자동으로 추가됩니다:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.1",
    "supertest": "^6.3.4"
  },
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:codegen": "playwright codegen https://disk-cms.simg.kr"
  }
}
```

---

## 🔍 설치 문제 해결

### 문제 1: 브라우저 설치 실패

**증상**: `npx playwright install` 실행 시 에러

**해결 방법**:
```bash
# 캐시 삭제 후 재설치
npx playwright install --force
```

### 문제 2: 권한 에러 (Windows)

**증상**: "Permission denied" 또는 "액세스 거부"

**해결 방법**:
- 관리자 권한으로 터미널 실행
- 또는 사용자 디렉토리에 설치 (기본 설정)

### 문제 3: 디스크 공간 부족

**증상**: 설치 중 디스크 공간 부족 에러

**해결 방법**:
- 불필요한 브라우저 제거: `npx playwright install chromium` (Chrome만)
- 디스크 공간 확보 후 재시도

### 문제 4: 네트워크 문제

**증상**: 브라우저 다운로드 실패

**해결 방법**:
- 프록시 설정이 필요한 경우: `set HTTPS_PROXY=...` (Windows) 또는 `export HTTPS_PROXY=...` (Linux/Mac)
- 방화벽 확인

---

## 💡 주의사항

### 1. Git에 포함할 것 / 제외할 것

**.gitignore에 추가해야 할 항목**:
```
# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
```

**Git에 포함해야 할 항목**:
- `playwright.config.js` - 설정 파일
- `tests/` - 테스트 코드
- `package.json` - 의존성 정보

### 2. 팀원과 공유

다른 개발자가 설치할 때:
```bash
# package.json이 이미 업데이트되어 있으면
npm install
npx playwright install
```

### 3. CI/CD 환경

CI/CD 환경에서는 별도 설치가 필요합니다:
```yaml
# GitHub Actions 예시
- name: Install Playwright browsers
  run: npx playwright install --with-deps
```

---

## 📊 설치 크기

| 항목 | 크기 | 설명 |
|------|------|------|
| @playwright/test | ~50MB | Node.js 라이브러리 |
| Chromium | ~170MB | Chrome 브라우저 |
| Firefox | ~70MB | Firefox 브라우저 |
| WebKit | ~150MB | Safari 브라우저 |
| **총합** | **~440MB** | 모든 브라우저 포함 |

**Chrome만 설치하는 경우**: ~220MB

---

## 🎯 다음 단계

설치가 완료되면:

1. ✅ **Codegen으로 테스트 코드 생성**: `npx playwright codegen`
2. ✅ **간단한 테스트 작성**: 첫 테스트 파일 작성
3. ✅ **테스트 실행**: `npx playwright test`
4. ✅ **테스트 구조 설계**: Page Object Model 등
5. ✅ **CI/CD 통합**: GitHub Actions 등

---

## 📚 참고 자료

- **Playwright 공식 문서**: https://playwright.dev/docs/intro
- **설치 가이드**: https://playwright.dev/docs/intro#installation
- **자동화 테스트 가이드**: `docs/보험운영플랫폼/AUTOMATED_TESTING_GUIDE.md`

---

**작성일**: 2026-01-XX  
**작성자**: AI Assistant  
**버전**: 1.0

