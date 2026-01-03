// 가이드 페이지 테스트 (로그인 후)
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/login.page');
const { GuidePage } = require('../pages/guide.page');

test.describe('가이드 페이지 테스트', () => {
  let loginPage;
  let guidePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    guidePage = new GuidePage(page);
    
    // 로그인 (테스트 계정이 있는 경우)
    // await loginPage.goto();
    // await loginPage.login('test@example.com', 'password');
  });

  test('가이드 페이지 접근', async ({ page }) => {
    await guidePage.goto();
    
    // 페이지가 로드되었는지 확인
    await expect(page).toHaveURL(/guide\.html/);
    
    // 섹션 1이 보이는지 확인
    await expect(guidePage.section1).toBeVisible({ timeout: 10000 });
    
    console.log('✅ 가이드 페이지가 정상적으로 로드되었습니다.');
  });

  test('데스크톱: 사이드바 네비게이션 표시', async ({ page }) => {
    // 데스크톱 뷰포트 설정
    await page.setViewportSize({ width: 1280, height: 720 });
    await guidePage.goto();
    
    // 사이드바가 표시되는지 확인
    await expect(guidePage.sidebar).toBeVisible();
    
    // 3개 섹션이 모두 보이는지 확인
    await expect(guidePage.tocItems).toHaveCount(3);
    
    console.log('✅ 사이드바 네비게이션이 정상적으로 표시되었습니다.');
  });

  test('데스크톱: 섹션 클릭하여 이동', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await guidePage.goto();
    
    // 섹션 2 클릭
    await guidePage.clickSection(2);
    
    // 섹션 2가 뷰포트에 있는지 확인
    const isInViewport = await guidePage.isSectionInViewport('#section2');
    expect(isInViewport).toBeTruthy();
    
    console.log('✅ 섹션 클릭으로 이동이 정상 작동합니다.');
  });

  test('데스크톱: 하위 항목 클릭하여 이동', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await guidePage.goto();
    
    // 섹션 1의 하위 항목 "1. 이 문서를 만드는 이유" 클릭
    await guidePage.clickSubItem(1, '이 문서를 만드는 이유');
    
    // 해당 항목이 뷰포트에 있는지 확인
    await expect(guidePage.s1_1).toBeInViewport();
    
    console.log('✅ 하위 항목 클릭으로 이동이 정상 작동합니다.');
  });

  test('모바일: 반응형 디자인', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await guidePage.goto();
    
    // 사이드바가 숨겨지고 상단 탭 메뉴가 표시되는지 확인
    await expect(guidePage.sidebar).not.toBeVisible();
    await expect(guidePage.mobileNav).toBeVisible();
    
    console.log('✅ 모바일 반응형 디자인이 정상 작동합니다.');
  });

  test('맨 위로 버튼', async ({ page }) => {
    await guidePage.goto();
    
    // 페이지 하단으로 스크롤
    await guidePage.scrollToBottom();
    
    // 맨 위로 버튼이 나타나는지 확인 (스크롤 300px 이상)
    const scrollPos = await guidePage.getScrollPosition();
    if (scrollPos > 300) {
      await expect(guidePage.backToTopButton).toBeVisible({ timeout: 2000 });
      
      // 버튼 클릭
      await guidePage.clickBackToTop();
      
      // 맨 위로 이동했는지 확인
      const newScrollPos = await guidePage.getScrollPosition();
      expect(newScrollPos).toBeLessThan(100);
      
      console.log('✅ 맨 위로 버튼이 정상 작동합니다.');
    }
  });

  test('스크롤 감지 및 하이라이트', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await guidePage.goto();
    
    // 섹션 2로 스크롤
    await guidePage.section2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000); // 스크롤 감지 대기
    
    // 섹션 2가 활성화되었는지 확인
    const isActive = await guidePage.isSectionActive(2);
    expect(isActive).toBeTruthy();
    
    console.log('✅ 스크롤 감지 및 하이라이트가 정상 작동합니다.');
  });
});

