/**
 * 템플릿 로더 - 인증 + 메뉴 관리 시스템
 * 기존 dashboard.js와 호환되도록 설계
 */
class TemplateLoader {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.timeInterval = null;
  }

  // 1. 인증 체크 (login.html과 동일한 API 사용)
  async checkAuth() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.success && data.data) {
          this.user = data.data;
          this.isAuthenticated = true;
          return true;
        }
      }

      // 401 또는 기타 오류 시 로그인 페이지로 이동
      this.redirectToLogin();
      return false;

    } catch (error) {
      console.error('인증 확인 실패:', error);
      this.redirectToLogin();
      return false;
    }
  }

  // 2. 로그인 페이지로 리다이렉트
  redirectToLogin() {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('login.html')) {
      window.location.href = '/login.html';
    }
  }

  // 3. 컴포넌트 로드
  async loadComponent(componentName) {
    try {
      const response = await fetch(`../components/${componentName}.html`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`${componentName} 로드 실패:`, error);
      return `<div class="alert alert-danger">${componentName} 컴포넌트를 불러올 수 없습니다.</div>`;
    }
  }

  // 4. 템플릿 컴포넌트들 병렬 로드
  async loadTemplateComponents() {
    const [headerHtml, sidebarHtml, footerHtml] = await Promise.all([
      this.loadComponent('header'),
      this.loadComponent('sidebar'),
      this.loadComponent('footer')
    ]);

    // DOM에 삽입
    const headerContainer = document.getElementById('header-container');
    const sidebarContainer = document.getElementById('sidebar-container');
    const footerContainer = document.getElementById('footer-container');

    if (headerContainer) headerContainer.innerHTML = headerHtml;
    if (sidebarContainer) sidebarContainer.innerHTML = sidebarHtml;
    if (footerContainer) footerContainer.innerHTML = footerHtml;

    // 사이드바 로드 후 메뉴 기능 초기화
    this.initializeSidebarMenu();
  }

  // 사이드바 메뉴 기능 초기화
  initializeSidebarMenu() {
    // AdminLTE Treeview 수동 초기화
    $(document).ready(() => {
      $('[data-widget="treeview"]').find('.has-treeview > .nav-link').off('click').on('click', function(e) {
        e.preventDefault();
        
        const $parent = $(this).parent();
        const $treeview = $parent.find('.nav-treeview');
        
        // 현재 메뉴 토글
        if ($parent.hasClass('menu-open')) {
          $parent.removeClass('menu-open');
          $treeview.slideUp(300);
        } else {
          // 다른 열린 메뉴들 닫기
          $('.has-treeview').not($parent).removeClass('menu-open');
          $('.nav-treeview').not($treeview).slideUp(300);
          
          // 현재 메뉴 열기
          $parent.addClass('menu-open');
          $treeview.slideDown(300);
        }
      });
    });
  }

  // 5. 사용자 정보 업데이트
  updateUserInfo() {
    if (!this.user) return;

    // 기본 사용자 이미지 (Base64 인코딩된 간단한 아바타)
    const defaultUserImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNlOWVjZWYiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIgZmlsbD0iIzZjNzU3ZCIvPgo8cGF0aCBkPSJNNyAyMGE1IDUgMCAwIDEgMTAgMCIgZmlsbD0iIzZjNzU3ZCIvPgo8L3N2Zz4K';

    // 사용자 이름 표시 (헤더에만)
    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = this.user.name || '사용자';
    });

    // 사용자 역할 표시 (헤더에만)
    document.querySelectorAll('[data-user-role]').forEach(el => {
      el.textContent = this.getRoleText(this.user.role);
    });

    // 프로필 이미지 (헤더에만 - 사이드바 제외)
    document.querySelectorAll('[data-user-image]').forEach(el => {
      // 사이드바 내부의 이미지는 제외 (사이드바 사용자 패널 제거됨)
      if (!el.closest('.sidebar')) {
        if (this.user.profile_image) {
          // 서버 이미지가 있으면 시도하고, 오류 시 기본 이미지로 fallback
          el.src = this.user.profile_image;
          el.onerror = () => {
            el.src = defaultUserImage;
            el.onerror = null; // 무한 루프 방지
          };
        } else {
          // 서버 이미지가 없으면 바로 기본 이미지 사용
          el.src = defaultUserImage;
        }
      }
    });

    // 사용자 이메일 표시 (헤더에만)
    document.querySelectorAll('[data-user-email]').forEach(el => {
      el.textContent = this.user.email;
    });
  }

  // 6. 역할 텍스트 변환
  getRoleText(role) {
    const roleTexts = {
      'SUPER_ADMIN': '최고관리자',
      'DEPT_MANAGER': '부서장',
      'SYSTEM_ADMIN': '시스템관리자',
      'EMPLOYEE': '직원'
    };
    return roleTexts[role] || '직원';
  }

  // 7. 메뉴 활성화 (ID 기반)
  setActiveMenu(pageId) {
    if (!pageId) return;

    // 모든 메뉴 비활성화
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      const parentItem = link.closest('.nav-item');
      if (parentItem) {
        parentItem.classList.remove('menu-open');
      }
    });

    // 지정된 메뉴 활성화
    const activeLink = document.querySelector(`[data-menu="${pageId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');

      // 부모 메뉴도 열기 (서브메뉴인 경우)
      const parentTreeview = activeLink.closest('.has-treeview');
      if (parentTreeview) {
        parentTreeview.classList.add('menu-open');
        const parentLink = parentTreeview.querySelector('.nav-link');
        if (parentLink) {
          parentLink.classList.add('active');
        }
      }
    }
	
    // 브레드크럼 업데이트
    this.updateBreadcrumb(pageId);
  }

  // 8. 사이드바에서 메뉴 구조 동적 분석
  getMenuStructureFromSidebar() {
    const menuStructure = {};
    
    // 사이드바의 모든 메뉴 아이템 분석
    const sidebarNavItems = document.querySelectorAll('.nav-sidebar .nav-item');
    
    sidebarNavItems.forEach(navItem => {
      // 서브메뉴가 있는 경우 (has-treeview) 먼저 처리
      if (navItem.classList.contains('has-treeview')) {
        const mainLink = navItem.querySelector('.nav-link[data-menu]');
        if (!mainLink) return;
        
        const menuText = this.extractMenuText(mainLink);
        const subItems = navItem.querySelectorAll('.nav-treeview .nav-link[data-menu]');
        
        subItems.forEach(subLink => {
          const subMenuId = subLink.getAttribute('data-menu');
          const subMenuText = this.extractMenuText(subLink);
          
          // 서브메뉴는 부모 정보와 함께 저장 (덮어쓰기 방지)
          menuStructure[subMenuId] = {
            title: subMenuText,
            parent: menuText
          };
        });
      } else {
        // 단일 메뉴 아이템은 이미 처리되지 않은 경우만 처리
        const mainLink = navItem.querySelector('.nav-link[data-menu]');
        if (!mainLink) return;
        
        const menuId = mainLink.getAttribute('data-menu');
        
        // 이미 서브메뉴로 처리된 경우 건너뛰기
        if (menuStructure[menuId]) {
          return;
        }
        
        const menuText = this.extractMenuText(mainLink);
        menuStructure[menuId] = {
          title: menuText,
          parent: null
        };
      }
    });
    
    return menuStructure;
  }

  // 9. 메뉴 텍스트 추출 (아이콘 제외)
  extractMenuText(linkElement) {
    const pElement = linkElement.querySelector('p');
    if (pElement) {
      // <p> 태그 안의 첫 번째 텍스트 노드만 추출 (화살표 아이콘 제외)
      let text = '';
      for (let node of pElement.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          text = node.textContent.trim();
          if (text) break;
        }
      }
      return text || pElement.textContent.replace(/\s*$/g, '').trim();
    }
    return linkElement.textContent.trim();
  }

  // 10. 브레드크럼 업데이트 (동적 버전)
  updateBreadcrumb(pageId) {
    if (!pageId) return;

    // 사이드바에서 동적으로 메뉴 구조 가져오기
    const menuStructure = this.getMenuStructureFromSidebar();
    const breadcrumbInfo = menuStructure[pageId];
    
    if (!breadcrumbInfo) {
      console.warn(`페이지 ID '${pageId}'에 대한 메뉴 정보를 찾을 수 없습니다.`);
      return;
    }

    // 동적 브레드크럼 요소 찾기 (헤더의 ID 사용)
    const breadcrumbContainer = document.getElementById('dynamicBreadcrumb');
    if (!breadcrumbContainer) return;

    // 브레드크럼 HTML 생성 - 높이 맞춤을 위해 스타일 조정
    let breadcrumbHtml = '';
    
    // 홈 페이지가 아닌 경우에만 브레드크럼 표시
    if (pageId !== 'dashboard') {
      // 부모 카테고리가 있는 경우: "부모 / 현재페이지" 형태
      if (breadcrumbInfo.parent) {
        breadcrumbHtml = `
          <li class="breadcrumb-item d-flex align-items-center" style="margin-bottom: 0; padding: 0.5rem 0;">
            <span style="color: #6c757d !important; font-size: 0.875rem;">${breadcrumbInfo.parent}</span>
          </li>
          <li class="breadcrumb-item active d-flex align-items-center" style="margin-bottom: 0; padding: 0.5rem 0;">
            <span style="color: #495057 !important; font-weight: bold; font-size: 0.875rem;">${breadcrumbInfo.title}</span>
          </li>
        `;
      } else {
        // 부모가 없는 경우: "현재페이지"만 표시
        breadcrumbHtml = `
          <li class="breadcrumb-item active d-flex align-items-center" style="margin-bottom: 0; padding: 0.5rem 0;">
            <span style="color: #495057 !important; font-weight: bold; font-size: 0.875rem;">${breadcrumbInfo.title}</span>
          </li>
        `;
      }
    } else {
      // 대시보드인 경우 브레드크럼 숨김
      breadcrumbHtml = '';
    }

    // 브레드크럼 업데이트 - 컨테이너 스타일도 조정
    breadcrumbContainer.innerHTML = breadcrumbHtml;
    
    // 브레드크럼 컨테이너 자체 스타일 조정
    const breadcrumbOl = breadcrumbContainer;
    if (breadcrumbOl) {
      breadcrumbOl.style.cssText = `
        margin-bottom: 0 !important; 
        padding: 0 !important; 
        background: none !important;
        display: flex;
        align-items: center;
        height: 100%;
      `;
    }

    // 페이지 제목도 업데이트 (content-header가 있는 경우)
    const pageTitle = document.querySelector('.content-header h1');
    if (pageTitle) {
      pageTitle.textContent = breadcrumbInfo.title;
    }
  }

  // 9. 관리자 권한 확인
  isAdmin() {
    return this.user && ['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'].includes(this.user.role);
  }

  // 10. 권한별 UI 제어
  checkAdminPermissions() {
    const adminElements = document.querySelectorAll('.admin-only');
    const isAdmin = this.isAdmin();

    adminElements.forEach(el => {
      el.style.display = isAdmin ? 'block' : 'none';
    });

    // 관리자 전용 섹션 표시
    const adminSection = document.getElementById('adminStatsSection');
    if (adminSection && isAdmin) {
      adminSection.style.display = 'block';
    }
  }

  // 11. 현재 시간 업데이트
  startTimeUpdate() {
    // 기존 인터벌 정리
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    // 현재 시간 업데이트 함수
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // 헤더의 현재 시간 표시
      const timeElements = document.querySelectorAll('#cardCurrentTime, [data-current-time]');
      timeElements.forEach(el => {
        el.textContent = timeString;
      });
    };

    // 즉시 실행
    updateTime();

    // 1초마다 업데이트
    this.timeInterval = setInterval(updateTime, 1000);
  }

  // 12. 토스트 알림 시스템 (dashboard.js에서 사용)
  showToast(message, type = 'success') {
    const toastContainer = this.getOrCreateToastContainer();
    
    const toastId = 'toast-' + Date.now();
    const iconClass = type === 'success' ? 'check-circle' : 
                     type === 'error' ? 'exclamation-triangle' : 
                     type === 'warning' ? 'exclamation-circle' : 'info-circle';
    
    const bgClass = type === 'success' ? 'toast-success' : 
                   type === 'error' ? 'toast-error' : 
                   type === 'warning' ? 'toast-warning' : 'toast-info';

    const toastHtml = `
      <div id="${toastId}" class="toast ${bgClass}" role="alert" style="min-width: 300px;">
        <div class="toast-header">
          <i class="fas fa-${iconClass} mr-2"></i>
          <strong class="mr-auto">${this.getToastTitle(type)}</strong>
          <small class="text-muted">방금</small>
          <button type="button" class="ml-2 mb-1 close" data-dismiss="toast">
            <span>&times;</span>
          </button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    // Bootstrap 토스트 초기화 및 표시
    const toastElement = document.getElementById(toastId);
    $(toastElement).toast({ delay: 4000 });
    $(toastElement).toast('show');

    // 토스트 제거 후 DOM에서 삭제
    $(toastElement).on('hidden.bs.toast', function() {
      toastElement.remove();
    });
  }

  // 13. 토스트 컨테이너 생성
  getOrCreateToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1050;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  // 14. 토스트 제목
  getToastTitle(type) {
    const titles = {
      'success': '성공',
      'error': '오류',
      'warning': '경고',
      'info': '정보'
    };
    return titles[type] || '알림';
  }

  // 15. 로딩 상태 관리
  showPageLoading() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      preloader.style.display = 'flex';
    }
  }

  hidePageLoading() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      preloader.style.display = 'none';
    }
  }

  // 16. 에러 표시
  showError(message) {
    this.showToast(message, 'error');
  }

  // 17. 메인 초기화 함수 (dashboard.html에서 호출)
  async initializePage(pageId) {
    try {
      console.log(`페이지 초기화 시작: ${pageId}`);
      
      // 로딩 표시
      this.showPageLoading();

      // 1단계: 인증 확인
      const isAuth = await this.checkAuth();
      if (!isAuth) {
        console.log('인증 실패 - 로그인 페이지로 이동');
        return;
      }

      // 2단계: 템플릿 컴포넌트 로드
      await this.loadTemplateComponents();

      // 3단계: 사용자 정보 업데이트
      this.updateUserInfo();

      // 4단계: 메뉴 활성화
      this.setActiveMenu(pageId);

      // 5단계: 권한별 UI 설정
      this.checkAdminPermissions();

      // 6단계: 현재 시간 업데이트 시작
      this.startTimeUpdate();

      // 7단계: 로딩 숨김
      this.hidePageLoading();

      console.log(`페이지 초기화 완료: ${pageId}`);

    } catch (error) {
      console.error('페이지 초기화 실패:', error);
      this.hidePageLoading();
      this.showError('페이지를 불러오는 중 오류가 발생했습니다.');
    }
  }

  // 18. 로그아웃 함수 (헤더 컴포넌트에서 호출)
  async logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (response.ok) {
          window.location.href = '/login.html';
        } else {
          console.error('로그아웃 실패');
          window.location.href = '/login.html'; // 어차피 로그인 페이지로
        }
      } catch (error) {
        console.error('로그아웃 오류:', error);
        window.location.href = '/login.html';
      }
    }
  }

  // 19. 정리 함수 (페이지 이동 시 호출)
  cleanup() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
    }
  }
}

// 전역 인스턴스 생성
window.templateLoader = new TemplateLoader();

// 전역 로그아웃 함수 (헤더에서 onclick으로 호출)
window.logout = async function() {
  await window.templateLoader.logout();
};

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  if (window.templateLoader) {
    window.templateLoader.cleanup();
  }
});