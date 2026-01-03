// 로그인 테스트
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/login.page');

test.describe('로그인 테스트', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('로그인 페이지 접근 및 폼 확인', async ({ page }) => {
    await loginPage.goto();
    
    // 로그인 폼이 표시되는지 확인
    await loginPage.isLoginFormVisible();
    
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/CMS|로그인/);
    
    console.log('✅ 로그인 페이지가 정상적으로 로드되었습니다.');
  });

  test('잘못된 자격증명으로 로그인 시도', async ({ page }) => {
    await loginPage.goto();
    
    // 잘못된 자격증명으로 로그인 시도
    await loginPage.emailInput.fill('wrong@example.com');
    await loginPage.passwordInput.fill('wrongpassword');
    await loginPage.loginButton.click();
    
    // 에러 메시지가 표시되거나 로그인 페이지에 머물러 있는지 확인
    // (에러 메시지가 있으면 확인, 없으면 URL이 변경되지 않았는지 확인)
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const hasError = await loginPage.hasErrorMessage();
    
    // 에러 메시지가 있거나, 여전히 로그인 페이지에 있어야 함
    expect(hasError || currentUrl.includes('login')).toBeTruthy();
    
    console.log('✅ 잘못된 자격증명으로 로그인 시도 - 정상 처리됨');
  });

  test('올바른 자격증명으로 로그인', async ({ page }) => {
    await loginPage.goto();
    
    // 테스트 계정 정보를 users.json에서 가져오기
    const testUsers = require('../fixtures/users.json');
    
    // 계정 정보가 입력되어 있는지 확인
    if (!testUsers.normal.email || !testUsers.normal.password) {
      test.skip();
      console.log('⚠️ users.json에 테스트 계정 정보를 입력해주세요.');
      return;
    }
    
    await loginPage.login(testUsers.normal.email, testUsers.normal.password);
    
    // 로그인 성공 확인 (대시보드나 티켓 목록으로 이동)
    await expect(page).toHaveURL(/dashboard|tickets|list/, { timeout: 10000 });
    
    console.log('✅ 로그인 성공');
  });
});

