# E2E 테스트 디렉토리

이 디렉토리는 Playwright를 사용한 End-to-End 테스트를 포함합니다.

## 디렉토리 구조

```
tests/e2e/
├── fixtures/          # 테스트 데이터 (사용자 계정 등)
│   └── users.json
├── pages/             # Page Object Model (페이지 클래스)
│   ├── login.page.js
│   └── guide.page.js
└── scenarios/         # 테스트 시나리오
    ├── 01-first-test.spec.js
    ├── 02-login-test.spec.js
    ├── 03-guide-page-test.spec.js
    └── 04-ticket-list-test.spec.js
```

## 테스트 실행

### 모든 테스트 실행
```bash
npm run test:e2e
```

### 특정 테스트만 실행
```bash
npx playwright test tests/e2e/scenarios/02-login-test.spec.js
```

### 브라우저를 보면서 실행 (headed 모드)
```bash
npm run test:e2e:headed
```

### UI 모드로 실행 (시각적으로 확인)
```bash
npm run test:e2e:ui
```

### 디버그 모드
```bash
npm run test:e2e:debug
```

## 테스트 케이스

### 01-first-test.spec.js
- 로그인 페이지 접근 확인
- 기본적인 페이지 로드 테스트

### 02-login-test.spec.js
- 로그인 페이지 폼 확인
- 잘못된 자격증명으로 로그인 시도
- (실제 로그인 테스트는 테스트 계정 필요)

### 03-guide-page-test.spec.js
- 가이드 페이지 접근
- 사이드바 네비게이션 테스트
- 섹션 클릭 및 하위 항목 클릭
- 반응형 디자인 테스트 (모바일)
- 맨 위로 버튼 테스트
- 스크롤 감지 및 하이라이트 테스트

### 04-ticket-list-test.spec.js
- 티켓 목록 페이지 접근
- 테이블/리스트 표시 확인
- 필터링 옵션 확인
- 검색 기능 확인

## Page Object Model

페이지별로 재사용 가능한 클래스를 만들어 코드 중복을 줄입니다.

### LoginPage
- `goto()` - 로그인 페이지로 이동
- `login(email, password)` - 로그인 수행
- `isLoginFormVisible()` - 로그인 폼 표시 확인
- `hasErrorMessage()` - 에러 메시지 확인

### GuidePage
- `goto()` - 가이드 페이지로 이동
- `clickSection(number)` - 섹션 클릭
- `clickSubItem(sectionNumber, itemText)` - 하위 항목 클릭
- `scrollToBottom()` - 페이지 하단으로 스크롤
- `isBackToTopVisible()` - 맨 위로 버튼 표시 확인
- `isSectionActive(number)` - 섹션 활성화 확인

## 테스트 데이터

### 계정 정보 설정

테스트를 실행하기 전에 `fixtures/users.json` 파일에 테스트 계정 정보를 입력해야 합니다.

1. `fixtures/users.json.template` 파일을 참고하거나
2. `fixtures/users.json` 파일을 직접 수정하여 이메일과 비밀번호를 입력하세요

**주의**: 
- `users.json` 파일은 Git에 커밋하지 마세요 (개인 정보 보호)
- 테스트 전용 계정을 사용하세요
- 실제 운영 계정 정보를 사용하지 마세요

자세한 설정 방법은 [TEST_ACCOUNT_SETUP.md](./TEST_ACCOUNT_SETUP.md)를 참고하세요.

## 추가 테스트 케이스 작성 가이드

1. Page Object Model 패턴 사용
2. 테스트는 독립적으로 실행 가능해야 함
3. beforeEach/afterEach로 공통 설정/정리
4. 명확한 테스트 이름 사용
5. console.log로 테스트 진행 상황 표시

## 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [자동화 테스트 가이드](../docs/보험운영플랫폼/AUTOMATED_TESTING_GUIDE.md)
- [사용자 테스트 가이드](../docs/보험운영플랫폼/USER_TEST_GUIDE.md)

