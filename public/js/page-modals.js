class PageModals {
  constructor(pageType, apiUrl) {
    this.pageType = pageType;
    this.apiUrl = apiUrl;
    // 모달 시스템이 없으면 생성
    if (!window.modalSystem) {
      window.modalSystem = new ModalSystem();
    }
    this.modalSystem = window.modalSystem;
    this.setupStandardModals();
  }

  setupStandardModals() {
    // 1. 추가 모달
    this.modalSystem.create('add-modal', {
      title: `새 ${this.pageType} 추가`,
      size: 'lg',
      onShow: (modal, data) => this.loadAddForm(modal, data),
      onConfirm: (modal, data) => this.handleAdd(modal, data)
    });

    // 2. 수정 모달  
    this.modalSystem.create('edit-modal', {
      title: `${this.pageType} 수정`,
      size: 'lg', 
      onShow: (modal, data) => this.loadEditForm(modal, data),
      onConfirm: (modal, data) => this.handleEdit(modal, data)
    });

    // 3. 상세보기 모달
    this.modalSystem.create('detail-modal', {
      title: `${this.pageType} 상세정보`,
      size: 'xl',
      buttons: [
        { id: 'close', text: '닫기', class: 'btn-secondary', dismiss: true }
      ],
      onShow: (modal, data) => this.loadDetailView(modal, data)
    });

    // 4. 삭제확인 모달
    this.modalSystem.create('delete-modal', {
      title: '삭제 확인',
      size: 'sm',
      buttons: [
        { id: 'cancel', text: '취소', class: 'btn-secondary', dismiss: true },
        { id: 'confirm', text: '삭제', class: 'btn-danger' }
      ],
      onShow: (modal, data) => this.loadDeleteConfirm(modal, data),
      onConfirm: (modal, data) => this.handleDelete(modal, data)
    });

    // 5. 검색/필터 모달
    this.modalSystem.create('search-modal', {
      title: '고급 검색',
      size: 'lg',
      buttons: [
        { id: 'reset', text: '초기화', class: 'btn-outline-secondary' },
        { id: 'cancel', text: '취소', class: 'btn-secondary', dismiss: true },
        { id: 'confirm', text: '검색', class: 'btn-primary' }
      ],
      onShow: (modal, data) => this.loadSearchForm(modal, data),
      onConfirm: (modal, data) => this.handleSearch(modal, data),
      onReset: (modal, data) => this.handleSearchReset(modal, data)
    });
  }

  // ========== 추가 모달 ==========
  loadAddForm(modal, data) {
    const formConfig = this.getFormConfig('add');
    const formHtml = `
      <form id="add-form" class="needs-validation" novalidate>
        <div class="row">
          ${this.generateFormFields(formConfig)}
        </div>
      </form>
    `;
    modal.setContent(formHtml);
    this.initFormValidation('add-form');
  }

  async handleAdd(modal, data) {
    const form = document.getElementById('add-form');
    if (!this.validateForm(form)) return;

    const formData = new FormData(form);
    const submitData = Object.fromEntries(formData.entries());

    try {
      modal.setLoading(true);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        modal.hide();
        this.showToast(`${this.pageType}이(가) 성공적으로 추가되었습니다.`, 'success');
        this.refreshPage();
      } else {
        throw new Error(result.message || '추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('추가 실패:', error);
      this.showToast(error.message || '추가 중 오류가 발생했습니다.', 'error');
    } finally {
      modal.setLoading(false);
    }
  }

  // ========== 수정 모달 ==========
  loadEditForm(modal, data) {
    const formConfig = this.getFormConfig('edit');
    const formHtml = `
      <form id="edit-form" class="needs-validation" novalidate>
        <input type="hidden" id="edit-id" name="id" value="${data.id || ''}">
        <div class="row">
          ${this.generateFormFields(formConfig, data)}
        </div>
      </form>
    `;
    modal.setContent(formHtml);
    this.initFormValidation('edit-form');
  }

  async handleEdit(modal, data) {
    const form = document.getElementById('edit-form');
    if (!this.validateForm(form)) return;

    const formData = new FormData(form);
    const submitData = Object.fromEntries(formData.entries());
    const id = submitData.id;

    try {
      modal.setLoading(true);
      
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        modal.hide();
        this.showToast(`${this.pageType}이(가) 성공적으로 수정되었습니다.`, 'success');
        this.refreshPage();
      } else {
        throw new Error(result.message || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('수정 실패:', error);
      this.showToast(error.message || '수정 중 오류가 발생했습니다.', 'error');
    } finally {
      modal.setLoading(false);
    }
  }

  // ========== 상세보기 모달 ==========
  loadDetailView(modal, data) {
    const detailConfig = this.getDetailConfig();
    const detailHtml = `
      <div class="detail-view">
        ${this.generateDetailFields(detailConfig, data)}
      </div>
    `;
    modal.setContent(detailHtml);
  }

  // ========== 삭제확인 모달 ==========
  loadDeleteConfirm(modal, data) {
    modal.setContent(`
      <div class="text-center py-4">
        <div class="mb-3">
          <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
        </div>
        <h5 class="mb-3">정말 삭제하시겠습니까?</h5>
        <p class="text-muted mb-0">
          ${data.name || data.title || '이 항목'}을(를) 삭제하면 복구할 수 없습니다.
        </p>
        <input type="hidden" id="delete-id" value="${data.id}">
      </div>
    `);
  }

  async handleDelete(modal, data) {
    const id = document.getElementById('delete-id').value;

    try {
      modal.setLoading(true);
      
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        modal.hide();
        this.showToast(`${this.pageType}이(가) 성공적으로 삭제되었습니다.`, 'success');
        this.refreshPage();
      } else {
        throw new Error(result.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      this.showToast(error.message || '삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      modal.setLoading(false);
    }
  }

  // ========== 검색 모달 ==========
  loadSearchForm(modal, data) {
    const searchConfig = this.getSearchConfig();
    const formHtml = `
      <form id="search-form">
        <div class="row">
          ${this.generateFormFields(searchConfig, data)}
        </div>
      </form>
    `;
    modal.setContent(formHtml);
  }

  handleSearch(modal, data) {
    const form = document.getElementById('search-form');
    const formData = new FormData(form);
    const searchParams = Object.fromEntries(formData.entries());
    
    modal.hide();
    this.applySearch(searchParams);
  }

  handleSearchReset(modal, data) {
    const form = document.getElementById('search-form');
    form.reset();
    this.applySearch({});
  }

  // ========== 폼 생성 및 유틸리티 ==========
  generateFormFields(config, data = {}) {
    if (!config || config.length === 0) {
      return '<div class="col-12"><p class="text-muted">설정된 필드가 없습니다.</p></div>';
    }

    return config.map(field => {
      const value = data[field.name] || field.default || '';
      const required = field.required ? 'required' : '';
      const colClass = `col-md-${field.width || 6}`;
      
      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'number':
          return `
            <div class="${colClass} mb-3">
              <label class="form-label">${field.label}</label>
              <input type="${field.type}" 
                     class="form-control" 
                     name="${field.name}" 
                     value="${value}" 
                     ${required}
                     placeholder="${field.placeholder || ''}">
              <div class="invalid-feedback">
                ${field.errorMessage || field.label + '을(를) 입력해주세요.'}
              </div>
            </div>
          `;
          
        case 'select':
          const options = field.options || [];
          return `
            <div class="${colClass} mb-3">
              <label class="form-label">${field.label}</label>
              <select class="form-select" name="${field.name}" ${required}>
                <option value="">선택하세요</option>
                ${options.map(opt => 
                  `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
                ).join('')}
              </select>
              <div class="invalid-feedback">
                ${field.errorMessage || field.label + '을(를) 선택해주세요.'}
              </div>
            </div>
          `;
          
        case 'textarea':
          return `
            <div class="${colClass} mb-3">
              <label class="form-label">${field.label}</label>
              <textarea class="form-control" 
                        name="${field.name}" 
                        rows="${field.rows || 3}" 
                        ${required}
                        placeholder="${field.placeholder || ''}">${value}</textarea>
              <div class="invalid-feedback">
                ${field.errorMessage || field.label + '을(를) 입력해주세요.'}
              </div>
            </div>
          `;
          
        case 'date':
        case 'datetime-local':
          return `
            <div class="${colClass} mb-3">
              <label class="form-label">${field.label}</label>
              <input type="${field.type}" 
                     class="form-control" 
                     name="${field.name}" 
                     value="${value}" 
                     ${required}>
              <div class="invalid-feedback">
                ${field.errorMessage || field.label + '을(를) 선택해주세요.'}
              </div>
            </div>
          `;
          
        case 'checkbox':
          return `
            <div class="${colClass} mb-3">
              <div class="form-check">
                <input class="form-check-input" 
                       type="checkbox" 
                       name="${field.name}" 
                       value="${field.value || '1'}"
                       ${value ? 'checked' : ''}>
                <label class="form-check-label">${field.label}</label>
              </div>
            </div>
          `;
          
        default:
          return `<div class="${colClass} mb-3"><p class="text-muted">지원하지 않는 필드 타입: ${field.type}</p></div>`;
      }
    }).join('');
  }

  generateDetailFields(config, data) {
    if (!config || config.length === 0) {
      return '<p class="text-muted">표시할 정보가 없습니다.</p>';
    }

    return `
      <div class="row">
        ${config.map(field => {
          const value = data[field.name] || '-';
          const colClass = `col-md-${field.width || 6}`;
          
          return `
            <div class="${colClass} mb-3">
              <strong class="d-block text-muted small">${field.label}</strong>
              <span class="detail-value">${this.formatDetailValue(value, field.type)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  formatDetailValue(value, type) {
    if (!value || value === '-') return '-';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('ko-KR');
      case 'datetime':
        return new Date(value).toLocaleString('ko-KR');
      case 'currency':
        return new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW'
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('ko-KR').format(value);
      default:
        return value;
    }
  }

  initFormValidation(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }
  }

  validateForm(form) {
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return false;
    }
    return true;
  }

  showToast(message, type = 'info') {
    // 간단한 토스트 알림
    const toastId = 'toast-' + Date.now();
    const typeClass = {
      success: 'bg-success',
      error: 'bg-danger', 
      warning: 'bg-warning',
      info: 'bg-info'
    }[type] || 'bg-info';

    const toastHTML = `
      <div class="toast align-items-center text-white ${typeClass} border-0" 
           id="${toastId}" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                  onclick="document.getElementById('${toastId}').remove()"></button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', toastHTML);
    
    // 3초 후 자동 제거
    setTimeout(() => {
      const toast = document.getElementById(toastId);
      if (toast) toast.remove();
    }, 3000);
  }

  // ========== 상속받은 클래스에서 구현해야 할 메서드들 ==========
  getFormConfig(type) {
    // 각 페이지에서 오버라이드
    console.warn('getFormConfig 메서드를 구현해주세요');
    return [];
  }

  getDetailConfig() {
    // 각 페이지에서 오버라이드
    console.warn('getDetailConfig 메서드를 구현해주세요');
    return [];
  }

  getSearchConfig() {
    // 각 페이지에서 오버라이드
    console.warn('getSearchConfig 메서드를 구현해주세요');
    return [];
  }

  refreshPage() {
    // 각 페이지에서 오버라이드 (데이터 다시 로드)
    console.warn('refreshPage 메서드를 구현해주세요');
  }

  applySearch(searchParams) {
    // 각 페이지에서 오버라이드 (검색 적용)
    console.warn('applySearch 메서드를 구현해주세요');
  }
}