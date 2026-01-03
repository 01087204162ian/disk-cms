// 첫 번째 테스트 - Playwright 설치 확인 및 로그인 페이지 접근
const { test, expect } = require('@playwright/test');

test.describe('첫 테스트 - 기본 확인', () => {
  test('로그인 페이지 접근', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('https://disk-cms.simg.kr/login.html');
    
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/CMS|로그인/);
    
    // 이메일 입력 필드가 보이는지 확인
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]').first();
    await expect(emailInput).toBeVisible();
    
    // 비밀번호 입력 필드가 보이는지 확인
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id*="password"]').first();
    await expect(passwordInput).toBeVisible();
    
    console.log('✅ 로그인 페이지가 정상적으로 로드되었습니다.');
  });

  test('가이드 페이지 접근 (스킵 - 로그인 필요)', async ({ page }) => {
    test.skip(); // 로그인 없이 접근할 수 없으므로 스킵
    
    // 가이드 페이지로 이동
    await page.goto('https://disk-cms.simg.kr/pages/tickets/guide.html');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 섹션 1이 보이는지 확인
    const section1 = page.locator('#section1');
    await expect(section1).toBeVisible();
    
    // 사이드바가 데스크톱에서 보이는지 확인 (뷰포트 크기에 따라)
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width > 992) {
      const sidebar = page.locator('.guide-sidebar');
      await expect(sidebar).toBeVisible();
      console.log('✅ 사이드바가 정상적으로 표시되었습니다.');
    }
    
    console.log('✅ 가이드 페이지가 정상적으로 로드되었습니다.');
  });
});

