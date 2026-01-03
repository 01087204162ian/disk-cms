// Login Page Object Model
const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
    // 로그인 폼 요소들
    this.emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"], input[id*="Email"]').first();
    this.passwordInput = page.locator('input[type="password"], input[name="password"], input[id*="password"], input[id*="Password"]').first();
    this.loginButton = page.locator('button[type="submit"], button:has-text("로그인"), input[type="submit"]').first();
    this.errorMessage = page.locator('.error, .alert-danger, .error-message');
  }

  /**
   * 로그인 페이지로 이동
   */
  async goto() {
    await this.page.goto('https://disk-cms.simg.kr/login.html');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 로그인 수행
   * @param {string} email - 이메일 주소
   * @param {string} password - 비밀번호
   */
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    
    // 로그인 성공 시 대시보드나 티켓 목록으로 이동하는지 확인
    await this.page.waitForURL(/dashboard|tickets|list|index/, { timeout: 10000 });
  }

  /**
   * 로그인 폼이 표시되는지 확인
   */
  async isLoginFormVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * 에러 메시지가 표시되는지 확인
   */
  async hasErrorMessage() {
    return await this.errorMessage.isVisible();
  }
}

module.exports = { LoginPage };

