/**
 * SJ 템플릿 로더 - 기존 디자인 유지 + 컴포넌트 분리 + 메뉴 상태 관리 개선
 * Bootstrap 5.3 + FontAwesome 기반
 */
class SJTemplateLoader {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.timeInterval = null;
    this.sidebar = null;
    this.sidebarOverlay = null;
    this.menuToggle = null;
  }

  // 1. 인증 체크
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
      const response = await fetch(`../../components/${componentName}.html`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`${componentName} 로드 실패:`, error);
      return `<div class="alert alert-danger">${componentName} 컴포넌트를 불러올 수 없습니다.</div>`;
    }
  }

  // 4. 템플릿 컴포넌트들 로드
  async loadTemplateComponents() {
    const [headerHtml, sidebarHtml] = await Promise.all([
      this.loadComponent('sj-header'),
      this.loadComponent('sj-sidebar')
    ]);

    // DOM에 삽입
    const headerContainer = document.getElementById('header-container');
    const sidebarContainer = document.getElementById('sidebar-container');

    if (headerContainer) headerContainer.innerHTML = headerHtml;
    if (sidebarContainer) sidebarContainer.innerHTML = sidebarHtml;


	// 모달 HTML 추가 (새로 추가)
	this.createDynamicModal();
    // 컴포넌트 로드 후 초기화
    this.initializeComponents();
  }

  // 동적 모달 생성 메서드 추가
createDynamicModal() {
  const modalHtml = `
    <div class="modal fade" id="dynamicModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalTitle"></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="modalBody">
            <!-- 동적 콘텐츠 -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

  // 5. 컴포넌트 초기화
  initializeComponents() {
    // DOM 요소 참조
    this.sidebar = document.getElementById('sidebar');
    this.sidebarOverlay = document.getElementById('sidebarOverlay');
    this.menuToggle = document.getElementById('menuToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const currentTimeElement = document.getElementById('currentTime');

    // 이벤트 리스너 등록
    if (this.menuToggle) {
      this.menuToggle.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }

    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener('click', () => {
        this.closeSidebar();
      });
    }

    // 메뉴 아코디언 이벤트 (개선된 버전)
    document.querySelectorAll('.menu-title[data-target]').forEach(title => {
      title.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSubmenu(e.target.closest('.menu-title'));
      });
    });

    // 메뉴 링크 클릭 이벤트 (헤더 업데이트를 위해)
    document.querySelectorAll('.submenu-item[data-menu], .menu-title[data-menu]').forEach(link => {
      link.addEventListener('click', (e) => {
        const menuId = link.getAttribute('data-menu');
        if (menuId) {
          // 페이지 이동 전에 헤더 업데이트
          // 약간의 지연을 두어 페이지 로드 후에도 업데이트되도록 함
          setTimeout(() => {
            this.updatePageInfo(menuId);
          }, 100);
        }
      });
    });

    // 로그아웃 이벤트
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    // 창 크기 변경 감지
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // ESC 키로 사이드바 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });

    // 메뉴 상태 처리 (개선된 버전)
    this.handleMenuState();
  }

  // 6. 사이드바 토글
  toggleSidebar() {
    if (this.sidebar && this.sidebarOverlay) {
      this.sidebar.classList.toggle('show');
      this.sidebarOverlay.classList.toggle('show');
      document.body.style.overflow = this.sidebar.classList.contains('show') ? 'hidden' : '';
    }
  }

  // 7. 사이드바 닫기
  closeSidebar() {
    if (this.sidebar && this.sidebarOverlay) {
      this.sidebar.classList.remove('show');
      this.sidebarOverlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  // 8. 서브메뉴 토글 (개선된 버전)
  toggleSubmenu(menuTitle) {
    const targetId = menuTitle.getAttribute('data-target');
    const submenu = document.getElementById(targetId);
    const arrow = menuTitle.querySelector('.menu-arrow');
    
    if (submenu && arrow) {
      const isOpen = submenu.classList.contains('show');
      
      if (isOpen) {
        // 메뉴 닫기
        submenu.classList.remove('show');
        arrow.classList.remove('rotated');
        menuTitle.classList.remove('active');
        
        // 하위 메뉴들도 모두 닫기
        this.closeAllSubmenus(submenu);
      } else {
        // 메뉴 열기
        submenu.classList.add('show');
        arrow.classList.add('rotated');
        menuTitle.classList.add('active');
      }
    }
  }

  // 9. 모든 하위 메뉴 닫기 (새로운 메서드)
  closeAllSubmenus(parentElement) {
    const submenus = parentElement.querySelectorAll('.submenu');
    const menuTitles = parentElement.querySelectorAll('.menu-title');
    const arrows = parentElement.querySelectorAll('.menu-arrow');
    
    submenus.forEach(submenu => {
      submenu.classList.remove('show');
    });
    
    menuTitles.forEach(title => {
      title.classList.remove('active');
    });
    
    arrows.forEach(arrow => {
      arrow.classList.remove('rotated');
    });
  }

  // 10. 반응형 처리
  handleResize() {
    if (window.innerWidth > 992) {
      this.closeSidebar();
    }
  }

  // 11. 메뉴 상태 관리 (대폭 개선된 버전)
  handleMenuState() {
    // 모든 메뉴 상태 초기화
    this.resetAllMenuStates();
    
    const currentPath = window.location.pathname;
    console.log('현재 경로:', currentPath);
    
    // 모든 메뉴 링크 검사 (a 태그와 data-menu 속성 모두 확인)
    const allLinks = document.querySelectorAll('a[href], [data-menu]');
    let activeFound = false;
    let activeMenuId = null;
    
    allLinks.forEach(link => {
      const href = link.getAttribute('href');
      const menu = link.getAttribute('data-menu');
      
      // href가 현재 경로와 정확히 일치하는 경우
      if (href && href === currentPath) {
        this.activateMenuItem(link);
        activeMenuId = menu || this.extractPageIdFromPath();
        activeFound = true;
        console.log('활성 메뉴 찾음 (href):', href);
        return;
      }
      
      // 경로 기반 매칭 (더 정확한 매칭을 위해)
      if (href && this.isPathMatch(currentPath, href)) {
        this.activateMenuItem(link);
        activeMenuId = menu || this.extractPageIdFromPath();
        activeFound = true;
        console.log('활성 메뉴 찾음 (경로 매칭):', href);
        return;
      }
    });
    
    // 활성 메뉴를 찾지 못한 경우 대시보드 활성화
    if (!activeFound) {
      console.log('활성 메뉴를 찾을 수 없어 대시보드를 활성화합니다.');
      const dashboardLink = document.querySelector('[data-menu="dashboard"], a[href="/dashboard.html"]');
      if (dashboardLink) {
        this.activateMenuItem(dashboardLink);
        activeMenuId = 'dashboard';
      }
    }
    
    // 헤더 페이지 정보 업데이트
    if (activeMenuId) {
      this.updatePageInfo(activeMenuId);
    }
  }

  // 12. 경로 매칭 확인 (새로운 메서드)
  isPathMatch(currentPath, linkPath) {
    // 정확한 일치
    if (currentPath === linkPath) return true;
    
    // 경로 세그먼트로 나누어 매칭
    const currentSegments = currentPath.split('/').filter(s => s);
    const linkSegments = linkPath.split('/').filter(s => s);
    
    // 기본적인 경로 포함 검사
    if (currentSegments.length >= linkSegments.length) {
      return linkSegments.every((segment, index) => {
        return currentSegments[index] === segment;
      });
    }
    
    return false;
  }

  // 13. 모든 메뉴 상태 초기화 (새로운 메서드)
  resetAllMenuStates() {
    // 모든 active 클래스 제거
    document.querySelectorAll('.menu-title, .submenu-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // 모든 서브메뉴 닫기 (초기 상태에서는)
    document.querySelectorAll('.submenu').forEach(submenu => {
      submenu.classList.remove('show');
    });
    
    // 모든 화살표 초기화
    document.querySelectorAll('.menu-arrow').forEach(arrow => {
      arrow.classList.remove('rotated');
    });
  }

  // 14. 메뉴 아이템 활성화 (새로운 메서드)
  activateMenuItem(element) {
    // 현재 요소 활성화
    element.classList.add('active');
    
    // 부모 메뉴들을 찾아서 활성화
    let currentElement = element;
    
    while (currentElement) {
      // 가장 가까운 .submenu 찾기
      const parentSubmenu = currentElement.closest('.submenu');
      
      if (parentSubmenu) {
        // 서브메뉴 열기
        parentSubmenu.classList.add('show');
        
        // 해당 서브메뉴를 여는 menu-title 찾기
        const parentTitle = document.querySelector(`[data-target="${parentSubmenu.id}"]`);
        
        if (parentTitle) {
          // 부모 메뉴 타이틀 활성화
          parentTitle.classList.add('active');
          
          // 화살표 회전
          const arrow = parentTitle.querySelector('.menu-arrow');
          if (arrow) {
            arrow.classList.add('rotated');
          }
          
          console.log('부모 메뉴 활성화:', parentTitle.textContent.trim());
        }
        
        // 다음 상위 요소로 이동
        currentElement = parentTitle;
      } else {
        // 더 이상 부모가 없으면 종료
        break;
      }
    }
  }

  // 15. 사용자 정보 업데이트
  updateUserInfo() {
    if (!this.user) return;

    // 사용자 이름 업데이트
    const userNameElements = document.querySelectorAll('[data-user-name], #userName');
    userNameElements.forEach(el => {
      el.textContent = this.user.name || '사용자';
    });

    // 사용자 역할 업데이트
    const userRoleElements = document.querySelectorAll('[data-user-role], #userRole');
    userRoleElements.forEach(el => {
      el.textContent = this.getRoleText(this.user.role);
    });

    // 아바타 텍스트 업데이트
    const avatarElements = document.querySelectorAll('[data-user-avatar], #userAvatar');
    avatarElements.forEach(el => {
      const name = this.user.name || '사용자';
      el.textContent = name.charAt(0).toUpperCase();
    });

    // 이메일 업데이트
    const emailElements = document.querySelectorAll('[data-user-email]');
    emailElements.forEach(el => {
      el.textContent = this.user.email;
    });
  }

  // 16. 역할 텍스트 변환
  getRoleText(role) {
    const roleTexts = {
      'SUPER_ADMIN': '최고관리자',
      'DEPT_MANAGER': '부서장',
      'SYSTEM_ADMIN': '시스템관리자',
      'EMPLOYEE': '직원'
    };
    return roleTexts[role] || '직원';
  }

  // 17. 관리자 권한 확인
  isAdmin() {
    return this.user && ['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'].includes(this.user.role);
  }

  // 18. 권한별 UI 제어
  checkAdminPermissions() {
    const adminElements = document.querySelectorAll('.admin-only');
    const isAdmin = this.isAdmin();

    adminElements.forEach(el => {
      // data-roles 속성이 있는 경우 해당 권한 체크
      const requiredRoles = el.getAttribute('data-roles');
      if (requiredRoles) {
        const roles = requiredRoles.split(',').map(r => r.trim());
        const hasRole = this.user && roles.includes(this.user.role);
        el.style.display = hasRole ? 'block' : 'none';
      } else {
        // data-roles가 없으면 기본 admin 체크
        el.style.display = isAdmin ? 'block' : 'none';
      }
    });
  }

  // 19. 시간 업데이트
 // 초 단위 업데이트 대신 분 단위로 변경
	startTimeUpdate() {
	  const updateTime = () => {
		const now = new Date();
		const timeString = now.toLocaleString('ko-KR', {
		  year: 'numeric',
		  month: '2-digit', 
		  day: '2-digit',
		  hour: '2-digit',
		  minute: '2-digit'
		  // second 제거로 업데이트 빈도 줄임
		});

		document.getElementById('currentTime').textContent = timeString;
	  };

	  updateTime();
	  this.timeInterval = setInterval(updateTime, 60000); // 1분마다
	}

  // 20. 토스트 알림
  showToast(message, type = 'success') {
    const toastContainer = this.getOrCreateToastContainer();
    
    const toastId = 'toast-' + Date.now();
    const iconClass = type === 'success' ? 'check-circle' : 
                     type === 'error' ? 'exclamation-triangle' : 
                     type === 'warning' ? 'exclamation-circle' : 'info-circle';
    
    const bgClass = type === 'success' ? 'text-bg-success' : 
                   type === 'error' ? 'text-bg-danger' : 
                   type === 'warning' ? 'text-bg-warning' : 'text-bg-info';

    const toastHtml = `
      <div id="${toastId}" class="toast ${bgClass}" role="alert" data-bs-autohide="true" data-bs-delay="4000">
        <div class="toast-header">
          <i class="fas fa-${iconClass} me-2"></i>
          <strong class="me-auto">${this.getToastTitle(type)}</strong>
          <small class="text-muted">방금</small>
          <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    // Bootstrap 토스트 표시
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // 토스트 제거
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  // 21. 토스트 컨테이너 생성
  getOrCreateToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container position-fixed p-3';
      container.style.cssText = `
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1055;
        width: auto;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  // 22. 토스트 제목
  getToastTitle(type) {
    const titles = {
      'success': '성공',
      'error': '오류', 
      'warning': '경고',
      'info': '정보'
    };
    return titles[type] || '알림';
  }

  // 23. 로딩 상태 관리
  showPageLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
  }

  hidePageLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  // 24. 에러 표시
  showError(message) {
    this.showToast(message, 'error');
  }

  // 25. 로그아웃 처리
  async handleLogout() {
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
          window.location.href = '/login.html';
        }
      } catch (error) {
        console.error('로그아웃 오류:', error);
        window.location.href = '/login.html';
      }
    }
  }

  // 26. 메인 초기화 함수
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

      // 4단계: 권한별 UI 설정
      this.checkAdminPermissions();

      // 5단계: 시간 업데이트 시작
      this.startTimeUpdate();

      // 6단계: 메뉴 상태 관리 (활성 메뉴 찾기 및 헤더 업데이트)
      this.handleMenuState();
      
      // 7단계: 페이지 정보 업데이트 (pageId가 제공된 경우)
      if (pageId) {
        this.updatePageInfo(pageId);
      }
	   
      // 7단계: 로딩 숨김
      this.hidePageLoading();
	  
	  // 7단계: 전화번호 입력 필드 설정
	this.setupPhoneInputs();

	// 8단계: 로딩 숨김
	this.hidePageLoading();

      console.log(`페이지 초기화 완료: ${pageId}`);

    } catch (error) {
      console.error('페이지 초기화 실패:', error);
      this.hidePageLoading();
      this.showError('페이지를 불러오는 중 오류가 발생했습니다.');
    }
  }

  // 27. 정리 함수
  cleanup() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
    }
  }
  //28 페이지 정보 업데이트 메서드 추가
	// 28. 페이지 정보 업데이트 메서드 (개선 버전)
		updatePageInfo(pageId) {
		  // pageId가 없으면 현재 경로에서 자동 추출
		  if (!pageId) {
			pageId = this.extractPageIdFromPath();
		  }

		  const pageConfig = {
			'dashboard': {
			  title: '대시보드',
			  description: '전체 현황을 한눈에 확인하세요'
			},
			'customers': {
			  title: '고객 관리',
			  description: '고객 정보를 등록하고 관리합니다'
			},
			'products': {
			  title: '상품 관리', 
			  description: '보험 상품을 관리합니다'
			},
			'contracts': {
			  title: '계약 관리',
			  description: '보험 계약 현황을 관리합니다'
			},
			
			// 1차 메뉴
			'staff': {
			  title: '직원전용',
			  description: '직원 관리 시스템'
			},
			'insurance': {
			  title: '보험상품',
			  description: '보험 상품 관리'
			},
			'knowledge': {
			  title: '지식 공유',
			  description: '지식 공유 시스템'
			},
			
			// 2차 메뉴 - 보험상품 하위
			'proxy-driving': {
			  title: '보험상품',
			  description: '대리운전'
			},
			'workers-comp': {
			  title: '보험상품',
			  description: '근재보험'
			},
			'internship': {
			  title: '보험상품',
			  description: '현장실습보험'
			},
			'pharmacy': {
			  title: '보험상품',
			  description: '약국배상책임보험'
			},
			'golf': {
			  title: '보험상품',
			  description: '홀인원보험'
			},
			
			// 2차 메뉴 - 지식 공유 하위
			'mistake-cases': {
			  title: '지식 공유',
			  description: '실수 사례'
			},
			
			// 직원 메뉴
			'staff-employees': {
			  title: '직원 관리',
			  description: '직원 리스트'
			},
			'staff-notices': {
			  title: '공지사항',
			  description: '직원 공지사항'
			},
			'employee-schedule': {
			  title: '근무일정',
			  description: '주 4일 근무제 스케줄 조회 및 관리'
			},
			'holidays': {
			  title: '직원 관리',
			  description: '공휴일 관리'
			},
			'half-day-approval': {
			  title: '직원 관리',
			  description: '반차 승인'
			},
			'staff-reports': {
			  title: '고지사항',
			  description: '직원 고지사항'
			},
			
			// 약국배상책임보험
			'pharmacy-applications': {
			  title: '약국배상책임보험',
			  description: '신청서 리스트'
			},
			'pharmacy-claims': {
			  title: '약국배상책임보험',
			  description: '클레임 리스트'
			},
			
			// 근재보험
			'workers-comp-contracts': {
			  title: '근재보험',
			  description: '가입신청 리스트'
			},
			'workers-comp-consultation': {
			  title: '근재보험',
			  description: '상담신청 리스트'
			},
			
			// 현장실습보험
			'field-practice-applications': {
			  title: '현장실습보험',
			  description: '신청 리스트'
			},
			'field-practice-id': {
			  title: '현장실습보험',
			  description: 'I.D 리스트'
			},
			'field-practice-claims': {
			  title: '현장실습보험',
			  description: '클레임 리스트'
			},
			
			// 3차 메뉴 - 대리운전 하위
			'proxy-kj': {
			  title: '보험상품',
			  description: 'KJ 대리운전'
			},
			// KJ 대리운전 하위 메뉴
			'kj-driver-search': {
			  title: 'KJ 대리운전',
			  description: '기사찾기'
			},
			'kj-driver-company': {
			  title: 'KJ 대리운전',
			  description: '대리업체'
			},
			'kj-driver-endorse-list': {
			  title: 'KJ 대리운전',
			  description: '배서리스트'
			},
			'kj-driver-code-by-policy': {
			  title: 'KJ 대리운전',
			  description: '증권별코드'
			},
			'kj-driver-policy-search': {
			  title: 'KJ 대리운전',
			  description: '갱신'
			},
			'proxy-das': {
			  title: 'daS 대리운전',
			  description: '대리운전 보험 관리'
			},
			'proxy-personal': {
			  title: '개인 대리운전',
			  description: '대리운전 보험 관리'
			},
			
			// 홀인원보험
			'golf-applications': {
			  title: '홀인원보험',
			  description: '신청 리스트'
			},
			'golf-claims': {
			  title: '홀인원보험',
			  description: '클레임 리스트'
			},
			
			// 여행자보험
			'travel': {
			  title: '여행자보험',
			  description: '여행자보험 관리'
			},
			
			// 지식 공유 - 실수 사례
			'mistake-cases-list': {
			  title: '실수 사례',
			  description: '전체 목록'
			},
			'mistake-case-form': {
			  title: '실수 사례',
			  description: '사례 등록'
			},
			'checklists': {
			  title: '실수 사례',
			  description: '체크리스트 관리'
			},
			'work-guide': {
			  title: '지식 공유',
			  description: '업무 가이드'
			},
			'process-docs': {
			  title: '지식 공유',
			  description: '프로세스 문서'
			},
			
			// 관리자
			'admin': {
			  title: '관리자',
			  description: '시스템 관리'
			},
			
			// 보험 운영 플랫폼 - 티켓 시스템
			'tickets-list': {
			  title: '보험 운영 플랫폼',
			  description: '티켓 목록'
			},
			'tickets-detail': {
			  title: '보험 운영 플랫폼',
			  description: '티켓 상세'
			},
			'tickets-form': {
			  title: '보험 운영 플랫폼',
			  description: '티켓 생성/수정'
			},
			'tickets-approvals': {
			  title: '보험 운영 플랫폼',
			  description: '승인 대기'
			},
			'tickets-about': {
			  title: '보험 운영 플랫폼',
			  description: '티켓 시스템이란?'
			},
			'tickets-types-guide': {
			  title: '보험 운영 플랫폼',
			  description: '티켓 유형 가이드'
			}
		  };

		  const config = pageConfig[pageId] || { 
			title: '페이지', 
			description: '' 
		  };
		  
		  console.log(`페이지 정보 업데이트: ${pageId}`, config);
		  
		  // 제목 업데이트
		  const titleElements = document.querySelectorAll('#pageTitle, .page-title');
		  titleElements.forEach(el => {
			el.textContent = config.title;
		  });

		  // 설명 업데이트  
		  const descElements = document.querySelectorAll('#pageDescription, .page-subtitle');
		  descElements.forEach(el => {
			el.textContent = config.description;
		  });

		  // 브라우저 제목도 업데이트
		  document.title = `보험 CMS | ${config.title}`;
		}

		// 29. 경로에서 pageId 추출하는 헬퍼 메서드 (새로 추가)
		extractPageIdFromPath() {
		  const path = window.location.pathname;
		  
		  // 경로 패턴 매핑
		  const pathMapping = {
			'/pages/dashboard.html': 'dashboard',
			'/pages/staff/employees.html': 'staff-employees',
			'/pages/staff/notices.html': 'staff-notices',
			'/pages/staff/employee-schedule.html': 'employee-schedule',
			'/pages/staff/reports.html': 'staff-reports',
			'/pages/pharmacy/applications.html': 'pharmacy-applications',
			'/pages/pharmacy/claims.html': 'pharmacy-claims',
			'/pages/workers-comp/contracts.html': 'workers-comp-contracts',
			'/pages/workers-comp/consultation.html': 'workers-comp-consultation',
			'/pages/field-practice/applications.html': 'field-practice-applications',
			'/pages/field-practice/idList.html': 'field-practice-id',
			'/pages/field-practice/claims.html': 'field-practice-claims',
			'/insurance/proxy-driving/kj.html': 'proxy-kj',
			'/insurance/proxy-driving/das.html': 'proxy-das',
			'/insurance/proxy-driving/personal.html': 'proxy-personal',
			'/insurance/hole-in-one/applications.html': 'golf-applications',
			'/insurance/hole-in-one/claims.html': 'golf-claims',
			'/insurance/travel.html': 'travel',
			'/admin/dashboard.html': 'admin'
		  };
		  
		  // 정확한 매칭
		  if (pathMapping[path]) {
			return pathMapping[path];
		  }
		  
		  // 파일명에서 추출 (폴백)
		  const fileName = path.split('/').pop().replace('.html', '');
		  console.log('경로에서 추출한 pageId:', fileName);
		  return fileName;
		}
	// 30. 전화번호 형식 자동 변환
	formatPhoneNumber(input) {
	  // 숫자만 추출
	  let phoneNumber = input.value.replace(/[^0-9]/g, '');
	  
	  // 하이픈 추가
	  if (phoneNumber.length >= 3 && phoneNumber.length <= 7) {
		// 010-1234
		phoneNumber = phoneNumber.substring(0, 3) + '-' + phoneNumber.substring(3);
	  } else if (phoneNumber.length > 7) {
		// 010-1234-5678
		phoneNumber = phoneNumber.substring(0, 3) + '-' + 
					  phoneNumber.substring(3, 7) + '-' + 
					  phoneNumber.substring(7, 11);
	  }
	  
	  // 값 업데이트
	  input.value = phoneNumber;
	}

	// 31. 전화번호 입력 필드에 자동 형식 적용
	setupPhoneInputs() {
	  // 전화번호 입력 필드를 찾아서 이벤트 리스너 추가
	  const phoneInputs = document.querySelectorAll('input[type="tel"], input[data-phone], .phone-input');
	  
	  phoneInputs.forEach(input => {
		// input 이벤트로 실시간 형식 변환
		input.addEventListener('input', (e) => {
		  this.formatPhoneNumber(e.target);
		});
		
		// 포커스 잃을 때도 한 번 더 체크
		input.addEventListener('blur', (e) => {
		  this.formatPhoneNumber(e.target);
		});
	  });
	}
  
}

// 전역 인스턴스 생성
window.sjTemplateLoader = new SJTemplateLoader();

// 전역 로그아웃 함수
window.sjLogout = async function() {
  await window.sjTemplateLoader.handleLogout();
};
// 전역 모달 함수

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  if (window.sjTemplateLoader) {
    window.sjTemplateLoader.cleanup();
  }
});