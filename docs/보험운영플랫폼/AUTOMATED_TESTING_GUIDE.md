# 보험 운영 플랫폼 - 자동화 테스트 가이드

**작성일**: 2026-01-XX  
**대상**: E2E (End-to-End) 자동화 테스트  
**목적**: 사용자 테스트 가이드를 자동화하여 반복 테스트 및 회귀 테스트 자동화

---

## 📋 목차

1. [자동화 테스트 도구 소개](#자동화-테스트-도구-소개)
2. [추천 도구: Playwright](#추천-도구-playwright)
3. [테스트 구조 설계](#테스트-구조-설계)
4. [설치 및 설정](#설치-및-설정)
5. [테스트 케이스 작성 예시](#테스트-케이스-작성-예시)
6. [실행 및 CI/CD 통합](#실행-및-cicd-통합)
7. [주의사항 및 제한사항](#주의사항-및-제한사항)

---

## 1. 자동화 테스트 도구 소개

### 주요 E2E 테스트 도구 비교

| 도구 | 장점 | 단점 | 추천도 |
|------|------|------|--------|
| **Playwright** | - 최신 도구, 빠름<br>- 크로스 브라우저 자동 지원<br>- 강력한 디버깅 도구<br>- TypeScript 기본 지원 | - 상대적으로 새로운 도구 | ⭐⭐⭐⭐⭐ |
| **Cypress** | - 인기 높음<br>- 좋은 문서화<br>- 실시간 실행 화면 확인 | - 크로스 브라우저 제한<br>- 복잡한 시나리오 어려움 | ⭐⭐⭐⭐ |
| **Selenium** | - 오래된 도구, 안정적<br>- 다양한 언어 지원 | - 느림<br>- 설정 복잡 | ⭐⭐⭐ |
| **Puppeteer** | - Chrome 전용, 빠름<br>- API 단순 | - Chrome만 지원 | ⭐⭐⭐ |

### 추천: Playwright

**이유**:
- ✅ 크로스 브라우저 자동 지원 (Chrome, Firefox, Safari, Edge)
- ✅ 빠른 실행 속도
- ✅ 강력한 디버깅 도구 (Codegen, Trace Viewer)
- ✅ Node.js 프로젝트와 자연스러운 통합
- ✅ TypeScript 기본 지원
- ✅ 네트워크 인터셉션, 모바일 에뮬레이션 등 고급 기능

---

## 2. 추천 도구: Playwright

### Playwright란?

Microsoft에서 개발한 최신 E2E 테스트 프레임워크입니다. 실제 브라우저를 자동으로 조작하여 사용자 시나리오를 테스트합니다.

### 주요 특징

1. **실제 브라우저 실행**: Headless/Headful 모드 모두 지원
2. **자동 대기**: 요소가 나타날 때까지 자동 대기 (별도 sleep 불필요)
3. **스크린샷/비디오**: 테스트 실패 시 자동으로 캡처
4. **디버깅 도구**: Codegen으로 테스트 코드 자동 생성
5. **네트워크 제어**: API 요청 가로채기, 모의 응답 등

---

## 3. 테스트 구조 설계

### 디렉토리 구조

```
disk-cms/
├── tests/
│   ├── e2e/
│   │   ├── fixtures/          # 테스트 데이터, 설정
│   │   │   └── users.json     # 테스트 계정 정보
│   │   ├── pages/             # Page Object Model
│   │   │   ├── login.page.js
│   │   │   ├── ticket-list.page.js
│   │   │   ├── ticket-detail.page.js
│   │   │   └── guide.page.js
│   │   ├── scenarios/         # 사용자 시나리오 테스트
│   │   │   ├── 01-guide-page.spec.js
│   │   │   ├── 02-ticket-list.spec.js
│   │   │   ├── 03-ticket-create.spec.js
│   │   │   ├── 04-ticket-status.spec.js
│   │   │   ├── 05-checklist.spec.js
│   │   │   ├── 06-approval.spec.js
│   │   │   └── 07-error-cases.spec.js
│   │   └── utils/             # 유틸리티 함수
│   │       ├── helpers.js
│   │       └── setup.js
│   └── playwright.config.js   # Playwright 설정
└── package.json
```

---

## 4. 설치 및 설정

### 4.1 Playwright 설치

```bash
cd disk-cms
npm install -D @playwright/test
npx playwright install
```

### 4.2 playwright.config.js 설정

```javascript
// tests/playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e/scenarios',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://disk-cms.simg.kr',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### 4.3 package.json 스크립트 추가

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:codegen": "playwright codegen https://disk-cms.simg.kr"
  }
}
```

---

## 5. 테스트 케이스 작성 예시

### 5.1 Page Object Model: Login Page

```javascript
// tests/e2e/pages/login.page.js
const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/login.html');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL(/dashboard|tickets/);
  }
}

module.exports = { LoginPage };
```

### 5.2 Page Object Model: Guide Page

```javascript
// tests/e2e/pages/guide.page.js
const { expect } = require('@playwright/test');

class GuidePage {
  constructor(page) {
    this.page = page;
    this.sidebar = page.locator('.guide-sidebar');
    this.tocItems = page.locator('.guide-toc .toc-item');
    this.section1 = page.locator('#section1');
    this.section2 = page.locator('#section2');
    this.section3 = page.locator('#section3');
    this.backToTopButton = page.locator('#btnBackToTop');
  }

  async goto() {
    await this.page.goto('/pages/tickets/guide.html');
  }

  async clickSection(sectionNumber) {
    await this.tocItems.nth(sectionNumber - 1).click();
  }

  async clickSubItem(sectionNumber, itemText) {
    const section = this.tocItems.nth(sectionNumber - 1);
    await section.locator(`.toc-subitems a:has-text("${itemText}")`).click();
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async isBackToTopVisible() {
    return await this.backToTopButton.isVisible();
  }
}

module.exports = { GuidePage };
```

### 5.3 테스트 케이스: 시나리오 1 - 가이드 페이지

```javascript
// tests/e2e/scenarios/01-guide-page.spec.js
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/login.page');
const { GuidePage } = require('../pages/guide.page');
const testUsers = require('../fixtures/users.json');

test.describe('시나리오 1: 가이드 페이지 확인', () => {
  let loginPage;
  let guidePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    guidePage = new GuidePage(page);
    
    // 로그인
    await loginPage.goto();
    await loginPage.login(testUsers.normal.email, testUsers.normal.password);
  });

  test('사이드바에서 가이드 접근', async ({ page }) => {
    // 사이드바 → 보험 운영 플랫폼 → 티켓 시스템 가이드 클릭
    await page.click('text=보험 운영 플랫폼');
    await page.click('text=티켓 시스템 가이드');
    
    // 가이드 페이지 로드 확인
    await expect(page).toHaveURL(/guide\.html/);
    await expect(guidePage.section1).toBeVisible();
  });

  test('데스크톱: 사이드바 네비게이션 작동', async ({ page }) => {
    await guidePage.goto();
    
    // 사이드바가 표시되는지 확인
    await expect(guidePage.sidebar).toBeVisible();
    
    // 3개 섹션이 모두 보이는지 확인
    await expect(guidePage.tocItems).toHaveCount(3);
    
    // 섹션 1 클릭
    await guidePage.clickSection(1);
    
    // 섹션 1로 스크롤 이동 확인
    await expect(guidePage.section1).toBeInViewport();
    
    // 활성 항목 하이라이트 확인
    const section1Item = guidePage.tocItems.nth(0);
    await expect(section1Item).toHaveClass(/active/);
  });

  test('데스크톱: 하위 항목 클릭', async ({ page }) => {
    await guidePage.goto();
    
    // 하위 항목 클릭
    await guidePage.clickSubItem(1, '1. 이 문서를 만드는 이유');
    
    // 해당 항목으로 이동 확인
    const targetElement = page.locator('#s1-1');
    await expect(targetElement).toBeInViewport();
  });

  test('모바일: 반응형 디자인', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await guidePage.goto();
    
    // 사이드바가 숨겨지고 상단 탭 메뉴가 표시되는지 확인
    await expect(guidePage.sidebar).not.toBeVisible();
    await expect(page.locator('.guide-nav')).toBeVisible();
  });

  test('스크롤 감지 및 하이라이트', async ({ page }) => {
    await guidePage.goto();
    
    // 섹션 2로 스크롤
    await guidePage.section2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // 스크롤 감지 대기
    
    // 섹션 2가 활성화되었는지 확인
    const section2Item = guidePage.tocItems.nth(1);
    await expect(section2Item).toHaveClass(/active/);
  });

  test('맨 위로 버튼', async ({ page }) => {
    await guidePage.goto();
    
    // 페이지 하단으로 스크롤
    await guidePage.scrollToBottom();
    await page.waitForTimeout(500);
    
    // 맨 위로 버튼이 나타나는지 확인
    await expect(guidePage.backToTopButton).toBeVisible();
    
    // 버튼 클릭
    await guidePage.backToTopButton.click();
    
    // 맨 위로 이동 확인
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});
```

### 5.4 테스트 케이스: 시나리오 3 - 티켓 생성

```javascript
// tests/e2e/scenarios/03-ticket-create.spec.js
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/login.page');
const testUsers = require('../fixtures/users.json');

test.describe('시나리오 3: 새 티켓 생성', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.normal.email, testUsers.normal.password);
  });

  test('티켓 생성 폼 접근', async ({ page }) => {
    await page.click('text=새 케이스 생성');
    await expect(page).toHaveURL(/form\.html/);
    await expect(page.locator('#ticketTypeCode')).toBeVisible();
  });

  test('필수 필드로 티켓 생성', async ({ page }) => {
    await page.goto('/pages/tickets/form.html');
    
    // 필수 필드 입력
    await page.selectOption('#ticketTypeCode', 'SETTLE');
    await page.fill('#title', '테스트 티켓 - ' + Date.now());
    await page.selectOption('#priority', 'high');
    
    // 저장 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 성공 메시지 또는 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/detail\.html/);
    
    // 티켓 번호가 생성되었는지 확인
    const ticketNumber = await page.locator('.ticket-number').textContent();
    expect(ticketNumber).toMatch(/SETTLE-\d{8}-\d{4}/);
  });

  test('필수 필드 누락 시 에러 메시지', async ({ page }) => {
    await page.goto('/pages/tickets/form.html');
    
    // 제목 없이 저장 시도
    await page.selectOption('#ticketTypeCode', 'SETTLE');
    await page.click('button[type="submit"]');
    
    // 유효성 검사 메시지 확인
    await expect(page.locator('input:invalid, .error-message')).toBeVisible();
  });
});
```

### 5.5 테스트 데이터: users.json

```json
// tests/e2e/fixtures/users.json
{
  "normal": {
    "email": "test@example.com",
    "password": "testpassword"
  },
  "approver": {
    "email": "approver@example.com",
    "password": "testpassword",
    "role": "DEPT_MANAGER"
  },
  "admin": {
    "email": "admin@example.com",
    "password": "testpassword",
    "role": "ADMIN"
  }
}
```

---

## 6. 실행 및 CI/CD 통합

### 6.1 로컬 실행

```bash
# 모든 테스트 실행
npm run test:e2e

# UI 모드로 실행 (시각적으로 확인)
npm run test:e2e:ui

# 디버그 모드
npm run test:e2e:debug

# 특정 테스트만 실행
npx playwright test 01-guide-page.spec.js

# 특정 브라우저만 실행
npx playwright test --project=chromium
```

### 6.2 Codegen으로 테스트 코드 자동 생성

```bash
# 브라우저를 열고 동작을 기록하여 테스트 코드 자동 생성
npm run test:e2e:codegen
```

### 6.3 CI/CD 통합 (GitHub Actions 예시)

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 7. 주의사항 및 제한사항

### 7.1 자동화하기 어려운 항목

1. **시각적 검증**
   - 색상, 레이아웃, 디자인은 자동화로 완전히 검증하기 어려움
   - 스크린샷 비교로 부분적으로 가능

2. **복잡한 사용자 인터랙션**
   - 드래그 앤 드롭
   - 복잡한 애니메이션
   - 특정 타이밍이 중요한 인터랙션

3. **외부 시스템 연동**
   - 이메일 발송
   - SMS 발송
   - 외부 API 호출

### 7.2 자동화 테스트 전략

**추천 접근법**:
- ✅ **E2E 테스트**: 핵심 사용자 플로우만 자동화 (10-20개)
- ✅ **통합 테스트**: API 레벨에서 더 많은 시나리오 테스트
- ✅ **단위 테스트**: 개별 함수/컴포넌트 테스트
- ✅ **수동 테스트**: 시각적 검증, UX 평가

### 7.3 테스트 데이터 관리

- 테스트 전용 계정 사용
- 테스트 데이터 자동 정리 (beforeEach/afterEach)
- 테스트 격리 (각 테스트가 독립적으로 실행)

### 7.4 성능 고려사항

- E2E 테스트는 느리므로 핵심 시나리오만 선택
- 병렬 실행으로 시간 단축
- CI/CD에서는 헤드리스 모드 사용

---

## 8. 추가 리소스

### 공식 문서
- **Playwright**: https://playwright.dev/
- **Cypress**: https://docs.cypress.io/
- **Selenium**: https://www.selenium.dev/

### 학습 자료
- Playwright 튜토리얼: https://playwright.dev/docs/intro
- Best Practices: https://playwright.dev/docs/best-practices

---

## 9. 다음 단계

1. **Playwright 설치 및 설정**
2. **핵심 시나리오 3-5개로 시작**
3. **점진적으로 테스트 추가**
4. **CI/CD 통합**
5. **팀과 공유 및 협업**

---

**작성일**: 2026-01-XX  
**작성자**: AI Assistant  
**버전**: 1.0

