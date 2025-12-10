class ModalSystem {
  constructor() {
    this.modals = new Map();
    this.createModalContainer();
  }

  createModalContainer() {
    if (!document.getElementById('modal-container')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="modal-container"></div>
        <div class="modal-backdrop fade" id="modal-backdrop" style="display: none;"></div>
      `);
    }
  }

  create(modalId, options = {}) {
    const modal = new Modal(modalId, options);
    this.modals.set(modalId, modal);
    return modal;
  }

  show(modalId, data = {}) {
    const modal = this.modals.get(modalId);
    if (modal) {
      modal.show(data);
    }
  }

  hide(modalId) {
    const modal = this.modals.get(modalId);
    if (modal) {
      modal.hide();
    }
  }

  hideAll() {
    this.modals.forEach(modal => modal.hide());
  }

  destroy(modalId) {
    const modal = this.modals.get(modalId);
    if (modal) {
      modal.destroy();
      this.modals.delete(modalId);
    }
  }
}

class Modal {
  constructor(id, options) {
    this.id = id;
    this.options = {
      title: '',
      size: 'lg', // sm, md, lg, xl
      closable: true,
      backdrop: true,
      keyboard: true,
      buttons: [
        { id: 'cancel', text: '취소', class: 'btn-secondary', dismiss: true },
        { id: 'confirm', text: '확인', class: 'btn-primary' }
      ],
      ...options
    };
    this.element = null;
    this.isVisible = false;
    this.data = {};
    this.createModal();
  }

  createModal() {
    const buttonsHTML = this.options.buttons.map(btn => {
      return `<button type="button" class="btn ${btn.class}" id="${this.id}-${btn.id}" 
                ${btn.dismiss ? 'data-bs-dismiss="modal"' : ''}>${btn.text}</button>`;
    }).join('');

    const modalHTML = `
      <div class="modal fade" id="${this.id}" tabindex="-1" aria-hidden="true" style="display: none;">
        <div class="modal-dialog modal-${this.options.size}">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${this.options.title}</h5>
              ${this.options.closable ? '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' : ''}
            </div>
            <div class="modal-body">
              <!-- 동적 컨텐츠 영역 -->
            </div>
            <div class="modal-footer">
              ${buttonsHTML}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modal-container').insertAdjacentHTML('beforeend', modalHTML);
    this.element = document.getElementById(this.id);
    this.bindEvents();
  }

  bindEvents() {
    // 닫기 이벤트들
    this.element.querySelectorAll('[data-bs-dismiss="modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.hide());
    });

    // 백드롭 클릭
    if (this.options.backdrop) {
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) this.hide();
      });
    }

    // ESC 키
    if (this.options.keyboard) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isVisible) this.hide();
      });
    }

    // 버튼 이벤트
    this.options.buttons.forEach(btn => {
      if (!btn.dismiss) {
        const buttonElement = document.getElementById(`${this.id}-${btn.id}`);
        if (buttonElement) {
          buttonElement.addEventListener('click', () => {
            if (this.options[`on${btn.id.charAt(0).toUpperCase() + btn.id.slice(1)}`]) {
              this.options[`on${btn.id.charAt(0).toUpperCase() + btn.id.slice(1)}`](this, this.data);
            }
          });
        }
      }
    });
  }

  show(data = {}) {
    this.data = data;
    this.isVisible = true;
    
    // 모달 표시
    this.element.style.display = 'block';
    setTimeout(() => {
      this.element.classList.add('show');
      document.getElementById('modal-backdrop').style.display = 'block';
      setTimeout(() => {
        document.getElementById('modal-backdrop').classList.add('show');
      }, 10);
    }, 10);
    
    // 스크롤 방지
    document.body.classList.add('modal-open');
    document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
    
    // onShow 콜백 실행
    if (this.options.onShow) {
      this.options.onShow(this, data);
    }
  }

  hide() {
    this.isVisible = false;
    
    // 애니메이션과 함께 숨기기
    this.element.classList.remove('show');
    document.getElementById('modal-backdrop').classList.remove('show');
    
    setTimeout(() => {
      this.element.style.display = 'none';
      document.getElementById('modal-backdrop').style.display = 'none';
      
      // 스크롤 복원
      document.body.classList.remove('modal-open');
      document.body.style.paddingRight = '';
    }, 300);
    
    // onHide 콜백 실행
    if (this.options.onHide) {
      this.options.onHide(this);
    }
  }

  setContent(html) {
    this.element.querySelector('.modal-body').innerHTML = html;
  }

  setTitle(title) {
    this.element.querySelector('.modal-title').textContent = title;
  }

  setLoading(loading = true) {
    const body = this.element.querySelector('.modal-body');
    const footer = this.element.querySelector('.modal-footer');
    
    if (loading) {
      body.style.opacity = '0.5';
      footer.style.pointerEvents = 'none';
      
      // 로딩 스피너 추가
      if (!body.querySelector('.modal-loading')) {
        body.insertAdjacentHTML('afterbegin', `
          <div class="modal-loading">
            <div class="spinner-border spinner-border-sm" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        `);
      }
    } else {
      body.style.opacity = '';
      footer.style.pointerEvents = '';
      
      // 로딩 스피너 제거
      const spinner = body.querySelector('.modal-loading');
      if (spinner) spinner.remove();
    }
  }

  getScrollbarWidth() {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    outer.style.msOverflowStyle = 'scrollbar';
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    outer.appendChild(inner);

    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
  }

  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}

// ModalSystem은 필요할 때 생성됩니다