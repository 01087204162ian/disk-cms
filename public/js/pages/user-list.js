/**
 * 직원목록 페이지 JavaScript
 * 파일: public/js/pages/user-list.js
 */

class UserListManager {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 0;
    this.users = [];
    this.departments = [];
    this.currentFilters = {
      search: '',
      department: '',
      role: ''
    };
  }

  /**
   * 페이지 초기화
   */
  async initialize() {
    try {
      // 현재 사용자 정보 확인
      await this.checkUserPermissions();
      
      // 부서 목록 로드
      await this.loadDepartments();
      
      // 직원 목록 로드
      await this.loadUsers();
      
      // 이벤트 리스너 설정
      this.setupEventListeners();
      
      console.log('직원목록 페이지 초기화 완료');
    } catch (error) {
      console.error('페이지 초기화 실패:', error);
      this.showToast('페이지 로드 중 오류가 발생했습니다.', 'error');
    }
  }

  /**
   * 사용자 권한 확인
   */
  async checkUserPermissions() {
    try {
      const response = await fetch('/api/users/me', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const result = await response.json();
      if (result.success) {
        this.currentUser = result.user;
        this.setupPermissionBasedUI();
      }
    } catch (error) {
      console.error('권한 확인 오류:', error);
    }
  }

  /**
   * 권한별 UI 설정
   */
  setupPermissionBasedUI() {
    const addUserBtn = document.getElementById('addUserBtn');
    const departmentFilter = document.getElementById('departmentFilter');
    
    // 부서장인 경우 직원 추가 버튼 숨기기
    if (this.currentUser.role === 'DEPT_MANAGER') {
      if (addUserBtn) {
        addUserBtn.style.display = 'none';
      }
      
      // 부서 필터 비활성화 (자신의 부서만 보이므로)
      if (departmentFilter) {
        departmentFilter.disabled = true;
        departmentFilter.value = this.currentUser.department_id;
      }
    }

    // 직원인 경우 페이지 접근 차단
    if (this.currentUser.role === 'EMPLOYEE') {
      document.body.innerHTML = `
        <div class="container-fluid mt-5">
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="alert alert-warning text-center">
                <h4><i class="fas fa-exclamation-triangle"></i> 접근 권한 없음</h4>
                <p>이 페이지에 접근할 권한이 없습니다.</p>
                <a href="/dashboard.html" class="btn btn-primary">대시보드로 돌아가기</a>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }
  }

  /**
   * 부서 목록 로드
   */
  async loadDepartments() {
    try {
      const response = await fetch('/api/users/departments', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.departments = result.data;
        this.renderDepartmentFilter();
      } else {
        console.error('부서 목록 로드 실패:', result.message);
      }
    } catch (error) {
      console.error('부서 목록 로드 오류:', error);
    }
  }

  /**
   * 직원 목록 로드
   */
  async loadUsers() {
    try {
      this.showLoading(true);
      
      // 쿼리 파라미터 구성
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.pageSize,
        ...this.currentFilters
      });

      const response = await fetch(`/api/users?${params}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
		  this.users = result.data.users;
		  this.totalPages = result.data.totalPages;
		  
		  // 🔥 이 두 줄 추가 (기존: this.renderUserTable(); 만 있었음)
		  this.renderUserTable();      // 기존 테이블 렌더링
		  this.renderEmployeeCards();   // 새로 추가할 카드 렌더링
		  
		  this.renderPagination();
		  this.updateTotalCount(result.data.totalCount);
		} else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('직원 목록 로드 오류:', error);
      this.showToast('직원 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  /**
   * 부서 필터 렌더링
   */
  renderDepartmentFilter() {
    const select = document.getElementById('departmentFilter');
    if (!select) return;

    select.innerHTML = '<option value="">전체 부서</option>';
    
    this.departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept.id;
      option.textContent = dept.name;
      select.appendChild(option);
    });
  }

  /**
   * 직원 테이블 렌더링
   */
  renderUserTable() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    if (this.users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-muted">
            <i class="fas fa-user-slash fa-2x mb-2"></i>
            <br>등록된 직원이 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.users.map(user => `
      <tr>
        <td>${user.employee_id || '-'}</td>
        <td>
          <div class="d-flex align-items-center">
            <div class="user-avatar mr-2">
              <i class="fas fa-user-circle fa-lg text-secondary"></i>
            </div>
            <div>
              <div class="font-weight-bold">${user.name}</div>
            </div>
          </div>
        </td>
        <td>${user.email}</td>
        <td>
          <span class="badge badge-secondary">
            ${this.getDepartmentName(user.department_id)}
          </span>
        </td>
        <td>
          <span class="badge ${this.getRoleBadgeClass(user.role)}">
            ${this.getRoleDisplayName(user.role)}
          </span>
        </td>
        <td>
          <span class="badge ${this.getWorkTypeBadgeClass(user.work_type)}">
            ${this.getWorkTypeDisplayName(user.work_type)}
          </span>
        </td>
        <td>
          <span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">
            ${user.is_active ? '활성' : '비활성'}
          </span>
        </td>
        <td>${this.formatDate(user.created_at)}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-info btn-sm" 
                    onclick="userListManager.viewUser('${user.email}')"
                    title="상세보기">
              <i class="fas fa-eye"></i>
            </button>
            ${this.canEditUser() ? `
            <button type="button" class="btn btn-warning btn-sm" 
                    onclick="userListManager.editUser('${user.email}')"
                    title="수정">
              <i class="fas fa-edit"></i>
            </button>
            ` : ''}
            ${this.canDeleteUser() ? `
            <button type="button" class="btn btn-danger btn-sm" 
                    onclick="userListManager.deleteUser('${user.email}')"
                    title="삭제">
              <i class="fas fa-trash"></i>
            </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * 페이지네이션 렌더링
   */
  renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination || this.totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    const pages = [];
    const maxVisiblePages = 5;
    
    // 이전 버튼
    pages.push(`
      <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${this.currentPage - 1}">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    `);

    // 페이지 번호들
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(`
        <li class="page-item ${i === this.currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `);
    }

    // 다음 버튼
    pages.push(`
      <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${this.currentPage + 1}">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    `);

    pagination.innerHTML = pages.join('');
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 검색 기능
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearch());
    }

    // 부서 필터
    const departmentFilter = document.getElementById('departmentFilter');
    if (departmentFilter) {
      departmentFilter.addEventListener('change', () => this.handleFilter());
    }

    // 직원 추가 버튼
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => this.addUser());
    }

    // 페이지네이션 클릭
    const pagination = document.getElementById('pagination');
    if (pagination) {
      pagination.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(e.target.closest('[data-page]')?.dataset.page);
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.loadUsers();
        }
      });
    }
  }

  /**
   * 검색 처리
   */
  handleSearch() {
    const searchInput = document.getElementById('searchInput');
    this.currentFilters.search = searchInput?.value.trim() || '';
    this.currentPage = 1;
    this.loadUsers();
  }

  /**
   * 필터 처리
   */
  handleFilter() {
    const departmentFilter = document.getElementById('departmentFilter');
    this.currentFilters.department = departmentFilter?.value || '';
    this.currentPage = 1;
    this.loadUsers();
  }

  /**
   * 직원 상세보기
   */
  async viewUser(email) {
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.showUserModal(result.data, 'view');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      this.showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
    }
  }

  /**
   * 직원 수정
   */
  async editUser(email) {
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.showUserModal(result.data, 'edit');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      this.showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
    }
  }

  /**
   * 직원 삭제
   */
  async deleteUser(email) {
    if (!confirm('정말로 이 직원을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.showToast('직원이 삭제되었습니다.', 'success');
        this.loadUsers(); // 목록 새로고침
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      this.showToast('직원 삭제에 실패했습니다.', 'error');
    }
  }

  /**
   * 직원 추가
   */
  addUser() {
    this.showUserModal(null, 'add');
  }

  /**
   * 사용자 모달 표시 (상세보기/수정/추가)
   */
  /**
 * 사용자 모달 표시 (상세보기/수정/추가)
 */
showUserModal(userData, mode) {
  const modal = $('#userModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('userModalContent');
  const modalActions = document.getElementById('modalActions');

  // 모달 제목 설정
  const titles = {
    'view': '직원 상세보기',
    'edit': '직원 정보 수정',
    'add': '새 직원 추가'
  };
  modalTitle.textContent = titles[mode] || '직원 정보';

  // 모달 내용 생성
  if (mode === 'view') {
    modalContent.innerHTML = this.createViewContent(userData);
    modalActions.innerHTML = `
      <button type="button" class="btn btn-secondary" data-dismiss="modal">
        <i class="fas fa-times mr-1"></i>닫기
      </button>
      ${this.canEditUser() ? `
      <button type="button" class="btn btn-warning" onclick="userListManager.editUser('${userData.email}')">
        <i class="fas fa-edit mr-1"></i>수정
      </button>
      ` : ''}
    `;
  } else if (mode === 'edit') {
    modalContent.innerHTML = this.createEditContent(userData);
    modalActions.innerHTML = `
      <button type="button" class="btn btn-secondary" data-dismiss="modal">
        <i class="fas fa-times mr-1"></i>취소
      </button>
      <button type="button" class="btn btn-primary" onclick="userListManager.saveUser('edit')">
        <i class="fas fa-save mr-1"></i>저장
      </button>
    `;
  } else if (mode === 'add') {
    modalContent.innerHTML = this.createAddContent();
    modalActions.innerHTML = `
      <button type="button" class="btn btn-secondary" data-dismiss="modal">
        <i class="fas fa-times mr-1"></i>취소
      </button>
      <button type="button" class="btn btn-success" onclick="userListManager.saveUser('add')">
        <i class="fas fa-plus mr-1"></i>추가
      </button>
    `;
  }

  // 모달 표시
  modal.modal('show');
}

/**
 * 상세보기 모달 내용 생성
 */
createViewContent(user) {
  return `
    <div class="text-center mb-4">
      <div class="user-avatar mx-auto mb-3" style="width: 80px; height: 80px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">
        ${user.name.charAt(0).toUpperCase()}
      </div>
      <h4>${user.name}</h4>
      <p class="text-muted">${user.email}</p>
    </div>
    
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0"><i class="fas fa-user mr-2"></i>기본 정보</h6>
          </div>
          <div class="card-body">
            <div class="info-item">
              <span class="info-label">사번:</span>
              <span class="info-value">${user.employee_id || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">이름:</span>
              <span class="info-value">${user.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">이메일:</span>
              <span class="info-value">${user.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">전화번호:</span>
              <span class="info-value">${user.phone || '-'}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0"><i class="fas fa-briefcase mr-2"></i>근무 정보</h6>
          </div>
          <div class="card-body">
            <div class="info-item">
              <span class="info-label">부서:</span>
              <span class="info-value">
                <span class="badge badge-secondary">
                  ${this.getDepartmentName(user.department_id)}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">직급:</span>
              <span class="info-value">
                <span class="badge ${this.getRoleBadgeClass(user.role)}">
                  ${this.getRoleDisplayName(user.role)}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">근무형태:</span>
              <span class="info-value">
                <span class="badge ${this.getWorkTypeBadgeClass(user.work_type)}">
                  ${this.getWorkTypeDisplayName(user.work_type)}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">상태:</span>
              <span class="info-value">
                <span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">
                  ${user.is_active ? '활성' : '비활성'}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">가입일:</span>
              <span class="info-value">${this.formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 수정 모달 내용 생성
 */
createEditContent(user) {
  return `
    <form id="editUserForm">
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="edit_employee_id">사번</label>
            <input type="text" class="form-control" id="edit_employee_id" value="${user.employee_id || ''}">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="edit_name">이름 <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="edit_name" value="${user.name}" required>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="edit_email">이메일 <span class="text-danger">*</span></label>
            <input type="email" class="form-control" id="edit_email" value="${user.email}" required>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="edit_phone">전화번호</label>
            <input type="text" class="form-control" id="edit_phone" value="${user.phone || ''}">
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="edit_department_id">부서</label>
            <select class="form-control" id="edit_department_id">
              <option value="">부서 선택</option>
              ${this.departments.map(dept => 
                `<option value="${dept.id}" ${dept.id === user.department_id ? 'selected' : ''}>${dept.name}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="edit_role">직급</label>
            <select class="form-control" id="edit_role">
              <option value="EMPLOYEE" ${user.role === 'EMPLOYEE' ? 'selected' : ''}>직원</option>
              <option value="DEPT_MANAGER" ${user.role === 'DEPT_MANAGER' ? 'selected' : ''}>부서장</option>
              <option value="SYSTEM_ADMIN" ${user.role === 'SYSTEM_ADMIN' ? 'selected' : ''}>시스템관리자</option>
              <option value="SUPER_ADMIN" ${user.role === 'SUPER_ADMIN' ? 'selected' : ''}>최고관리자</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="edit_work_type">근무형태</label>
            <select class="form-control" id="edit_work_type">
              <option value="FULL_TIME" ${user.work_type === 'FULL_TIME' ? 'selected' : ''}>정규직</option>
              <option value="PART_TIME" ${user.work_type === 'PART_TIME' ? 'selected' : ''}>파트타임</option>
              <option value="CONTRACT" ${user.work_type === 'CONTRACT' ? 'selected' : ''}>계약직</option>
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="edit_is_active">상태</label>
            <select class="form-control" id="edit_is_active">
              <option value="true" ${user.is_active ? 'selected' : ''}>활성</option>
              <option value="false" ${!user.is_active ? 'selected' : ''}>비활성</option>
            </select>
          </div>
        </div>
      </div>
      
      <input type="hidden" id="edit_original_email" value="${user.email}">
    </form>
  `;
}

/**
 * 추가 모달 내용 생성
 */
createAddContent() {
  return `
    <form id="addUserForm">
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="add_employee_id">사번</label>
            <input type="text" class="form-control" id="add_employee_id" placeholder="사번 입력">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="add_name">이름 <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="add_name" placeholder="이름 입력" required>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="add_email">이메일 <span class="text-danger">*</span></label>
            <input type="email" class="form-control" id="add_email" placeholder="이메일 입력" required>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="add_phone">전화번호</label>
            <input type="text" class="form-control" id="add_phone" placeholder="전화번호 입력">
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="add_department_id">부서</label>
            <select class="form-control" id="add_department_id">
              <option value="">부서 선택</option>
              ${this.departments.map(dept => 
                `<option value="${dept.id}">${dept.name}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="add_role">직급</label>
            <select class="form-control" id="add_role">
              <option value="EMPLOYEE">직원</option>
              <option value="DEPT_MANAGER">부서장</option>
              <option value="SYSTEM_ADMIN">시스템관리자</option>
              <option value="SUPER_ADMIN">최고관리자</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="add_work_type">근무형태</label>
            <select class="form-control" id="add_work_type">
              <option value="FULL_TIME">정규직</option>
              <option value="PART_TIME">파트타임</option>
              <option value="CONTRACT">계약직</option>
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="add_password">임시 비밀번호 <span class="text-danger">*</span></label>
            <input type="password" class="form-control" id="add_password" placeholder="임시 비밀번호 입력" required>
          </div>
        </div>
      </div>
    </form>
  `;
}

/**
 * 사용자 저장 (수정/추가)
 */
async saveUser(mode) {
  try {
    const formData = this.getFormData(mode);
    
    if (!this.validateFormData(formData, mode)) {
      return;
    }

    if (mode === 'edit') {
      await this.updateUser(formData);
    } else if (mode === 'add') {
      await this.createUser(formData);
    }

    $('#userModal').modal('hide');
    this.loadUsers(); // 목록 새로고침
    
  } catch (error) {
    console.error('사용자 저장 오류:', error);
    this.showToast('저장 중 오류가 발생했습니다.', 'error');
  }
}

/**
 * 폼 데이터 가져오기
 */
getFormData(mode) {
  const prefix = mode === 'edit' ? 'edit_' : 'add_';
  
  return {
    employee_id: document.getElementById(prefix + 'employee_id')?.value || null,
    name: document.getElementById(prefix + 'name')?.value,
    email: document.getElementById(prefix + 'email')?.value,
    phone: document.getElementById(prefix + 'phone')?.value || null,
    department_id: document.getElementById(prefix + 'department_id')?.value || null,
    role: document.getElementById(prefix + 'role')?.value,
    work_type: document.getElementById(prefix + 'work_type')?.value,
    is_active: mode === 'edit' ? 
      document.getElementById(prefix + 'is_active')?.value === 'true' : true,
    password: mode === 'add' ? document.getElementById(prefix + 'password')?.value : undefined,
    original_email: mode === 'edit' ? document.getElementById('edit_original_email')?.value : undefined
  };
}

/**
 * 폼 데이터 유효성 검사
 */
validateFormData(formData, mode) {
  if (!formData.name?.trim()) {
    this.showToast('이름을 입력해주세요.', 'error');
    return false;
  }
  
  if (!formData.email?.trim()) {
    this.showToast('이메일을 입력해주세요.', 'error');
    return false;
  }
  
  if (mode === 'add' && !formData.password?.trim()) {
    this.showToast('임시 비밀번호를 입력해주세요.', 'error');
    return false;
  }
  
  return true;
}

/**
 * 사용자 수정 (시뮬레이션)
 */
async updateUser(formData) {
  // 실제 API 호출 대신 로컬 데이터 업데이트
  const userIndex = this.users.findIndex(u => u.email === formData.original_email);
  if (userIndex !== -1) {
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...formData,
      updated_at: new Date().toISOString()
    };
	 // 🔥 이 두 줄 추가
    this.renderUserTable();      // 테이블 새로고침
    this.renderEmployeeCards();   // 카드 새로고침
	
    this.showToast('직원 정보가 수정되었습니다.', 'success');
  }
}

/**
 * 사용자 추가 (시뮬레이션)
 */
async createUser(formData) {
  // 실제 API 호출 대신 로컬 데이터에 추가
  const newUser = {
    ...formData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  this.users.push(newUser);
  // 🔥 이 두 줄 추가
  this.renderUserTable();      // 테이블 새로고침
  this.renderEmployeeCards();   // 카드 새로고침
  
  this.showToast('새 직원이 추가되었습니다.', 'success');
}

  /**
   * 유틸리티 메서드들
   */
  /**
 * 직원 카드 렌더링 (모바일 전용)
 */
renderEmployeeCards() {
  const cardContainer = document.getElementById('employeeCards');
  if (!cardContainer) return;

  if (this.users.length === 0) {
    cardContainer.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="fas fa-user-slash fa-3x mb-3"></i>
        <h5>등록된 직원이 없습니다</h5>
        <p>새로운 직원을 추가해보세요.</p>
      </div>
    `;
    return;
  }

  cardContainer.innerHTML = this.users.map(user => `
    <div class="employee-card">
      <!-- 1행: 이름과 상태 -->
      <div class="employee-card-header">
        <h6 class="employee-name">${user.name}</h6>
        <span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'} employee-status">
          ${user.is_active ? '활성' : '비활성'}
        </span>
      </div>
      
      <!-- 2행: 주요 정보 (2행) -->
		<div class="employee-card-body">
		  <div class="employee-info-row">
			<span class="employee-info-label">부서:</span>
			<span class="employee-info-value">${this.getDepartmentName(user.department_id)}</span>
			<span class="employee-info-separator">|</span>
			<span class="employee-info-label">직급:</span>
			<span class="employee-info-value">${this.getRoleDisplayName(user.role)}</span>
		  </div>
		  <div class="employee-info-row">
			<span class="employee-info-label">사번:</span>
			<span class="employee-info-value">${user.employee_id || '-'}</span>
			<span class="employee-info-separator">|</span>
			<span class="employee-info-label">이메일:</span>
			<span class="employee-info-value">${this.truncateEmail(user.email)}</span>
		  </div>
		</div>
      
      <!-- 3행: 메타 정보와 액션 버튼 -->
      <div class="employee-card-footer">
        <span class="employee-meta">
          <i class="fas fa-calendar-alt mr-1"></i>
          ${this.formatDate(user.created_at)} 가입
        </span>
        <div class="employee-actions">
          <button class="btn btn-sm btn-info" 
                  onclick="userListManager.viewUser('${user.email}')" 
                  title="상세보기">
            <i class="fas fa-eye"></i>
          </button>
          ${this.canEditUser() ? `
          <button class="btn btn-sm btn-warning" 
                  onclick="userListManager.editUser('${user.email}')" 
                  title="수정">
            <i class="fas fa-edit"></i>
          </button>
          ` : ''}
          ${this.canDeleteUser() ? `
          <button class="btn btn-sm btn-danger" 
                  onclick="userListManager.deleteUser('${user.email}')" 
                  title="삭제">
            <i class="fas fa-trash"></i>
          </button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * 이메일 말줄임 처리 (모바일용)
 */
truncateEmail(email) {
  if (email.length > 20) {
    return email.substring(0, 17) + '...';
  }
  return email;
} 
   
   
  getDepartmentName(departmentId) {
    const dept = this.departments.find(d => d.id === departmentId);
    return dept ? dept.name : '미지정';
  }

  getRoleBadgeClass(role) {
    const classes = {
      'SUPER_ADMIN': 'badge-danger',
      'SYSTEM_ADMIN': 'badge-warning', 
      'DEPT_MANAGER': 'badge-info',
      'EMPLOYEE': 'badge-primary'
    };
    return classes[role] || 'badge-secondary';
  }

  getRoleDisplayName(role) {
    const names = {
      'SUPER_ADMIN': '최고관리자',
      'SYSTEM_ADMIN': '시스템관리자',
      'DEPT_MANAGER': '부서장',
      'EMPLOYEE': '직원'
    };
    return names[role] || role;
  }

  getWorkTypeBadgeClass(workType) {
    const classes = {
      'FULL_TIME': 'badge-success',
      'PART_TIME': 'badge-info',
      'CONTRACT': 'badge-warning'
    };
    return classes[workType] || 'badge-secondary';
  }

  getWorkTypeDisplayName(workType) {
    const names = {
      'FULL_TIME': '정규직',
      'PART_TIME': '파트타임', 
      'CONTRACT': '계약직'
    };
    return names[workType] || workType;
  }

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  }

  showLoading(show) {
	  const spinner = document.getElementById('loadingSpinner');
	  const table = document.getElementById('userTable');
	  const cards = document.getElementById('employeeCards');  // 🔥 이 줄 추가
	  
	  if (spinner) {
		spinner.style.display = show ? 'block' : 'none';
	  }
	  if (table) {
		table.style.opacity = show ? '0.5' : '1';
	  }
	  if (cards) {  // 🔥 이 블록 추가
		cards.style.opacity = show ? '0.5' : '1';
	  }
	}

  updateTotalCount(count) {
    const totalCount = document.getElementById('totalCount');
    if (totalCount) {
      totalCount.textContent = `총 ${count}명`;
    }
  }

  showToast(message, type = 'info') {
    if (window.templateLoader && window.templateLoader.showToast) {
      window.templateLoader.showToast(message, type);
    } else {
      alert(message);
    }
  }

  /**
   * 권한 체크 메서드들
   */
  canEditUser() {
    return this.currentUser && ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(this.currentUser.role);
  }

  canDeleteUser() {
    return this.currentUser && ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(this.currentUser.role);
  }

  canAddUser() {
    return this.currentUser && ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(this.currentUser.role);
  }
}

// 전역 인스턴스 생성
window.userListManager = new UserListManager();


