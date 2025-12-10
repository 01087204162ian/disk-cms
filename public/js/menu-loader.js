class MenuLoader {
  constructor() {
    this.menuConfig = null;
  }

  async loadMenuConfig() {
    try {
      const response = await fetch('./config/menu-config.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.menuConfig = await response.json();
      console.log('✅ 메뉴 설정 로드 완료');
      return this.menuConfig;
    } catch (error) {
      console.error('메뉴 설정 로드 실패:', error);
      return null;
    }
  }

  generateMenuHTML() {
    if (!this.menuConfig || !this.menuConfig.menus) {
      return '<div class="menu-error">메뉴를 불러올 수 없습니다.</div>';
    }

    return this.menuConfig.menus
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(menu => this.renderMenuItem(menu))
      .join('');
  }

  renderMenuItem(item, depth = 0) {
    const hasChildren = item.children && item.children.length > 0;
    const paddingLeft = depth * 1 + 1;

    if (hasChildren) {
      // 하위 메뉴가 있는 경우
      const childrenHTML = item.children
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(child => this.renderMenuItem(child, depth + 1))
        .join('');

      return `
        <div class="menu-item">
          <div class="menu-title" data-target="${item.id}-menu" style="padding-left: ${paddingLeft}rem;">
            <div>
              ${item.icon ? `<i class="${item.icon} menu-icon"></i>` : ''}
              ${item.title}
            </div>
            <i class="fas fa-chevron-right menu-arrow"></i>
          </div>
          <div class="submenu" id="${item.id}-menu">
            ${childrenHTML}
          </div>
        </div>
      `;
    } else {
      // 최종 메뉴 항목 (페이지 링크)
      const isTopLevel = depth === 0;
      const cssClass = isTopLevel ? 'menu-title' : 'submenu-item';
      const style = isTopLevel ? `padding-left: ${paddingLeft}rem;` : `padding-left: ${paddingLeft + 2}rem;`;
      
      return `
        <div class="${cssClass}" onclick="loadPage('${item.page}')" style="${style}" data-page="${item.page}">
          ${item.icon ? `<i class="${item.icon} menu-icon"></i>` : ''}
          ${item.title}
        </div>
      `;
    }
  }

  setActiveMenu(currentPage) {
    // 모든 메뉴 아이템의 active 클래스 제거
    document.querySelectorAll('.menu-title.active, .submenu-item.active').forEach(el => {
      el.classList.remove('active');
    });

    // 현재 페이지와 일치하는 메뉴 찾기
    const currentMenuItem = document.querySelector(`[data-page="${currentPage}"]`);
    if (currentMenuItem) {
      currentMenuItem.classList.add('active');
      
      // 부모 메뉴들도 열기
      this.openParentMenus(currentMenuItem);
    }
  }

  openParentMenus(menuItem) {
    let parent = menuItem.closest('.submenu');
    
    while (parent) {
      // 서브메뉴 열기
      parent.classList.add('show');
      
      // 해당 메뉴 타이틀 활성화 및 화살표 회전
      const menuTitle = document.querySelector(`[data-target="${parent.id}"]`);
      if (menuTitle) {
        menuTitle.classList.add('active');
        const arrow = menuTitle.querySelector('.menu-arrow');
        if (arrow) {
          arrow.classList.add('rotated');
        }
      }
      
      // 상위 서브메뉴가 있는지 확인
      parent = parent.parentElement.closest('.submenu');
    }
  }

  bindMenuEvents() {
    // 메뉴 아코디언 이벤트
    document.querySelectorAll('.menu-title[data-target]').forEach(title => {
      title.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSubmenu(title);
      });
    });
  }

  toggleSubmenu(menuTitle) {
    const targetId = menuTitle.getAttribute('data-target');
    const submenu = document.getElementById(targetId);
    const arrow = menuTitle.querySelector('.menu-arrow');
    
    if (submenu) {
      const isOpen = submenu.classList.contains('show');
      
      if (isOpen) {
        submenu.classList.remove('show');
        arrow?.classList.remove('rotated');
        menuTitle.classList.remove('active');
      } else {
        submenu.classList.add('show');
        arrow?.classList.add('rotated');
        menuTitle.classList.add('active');
      }
    }
  }
}

// MenuLoader는 template-loader에서 인스턴스를 생성합니다