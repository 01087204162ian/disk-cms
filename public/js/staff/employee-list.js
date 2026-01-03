// ==============================
// js/staff/employee-list.js - 직원 관리 페이지 JavaScript
// ==============================

class EmployeeManager {
    constructor() {
        this.currentPage = 1;
        this.currentLimit = 20;
        this.currentFilters = {};
        this.employees = [];
        this.departments = [];
        this.employeeModal = new EmployeeModal(this); //직원 상세보기 
		window.employeeModal = this.employeeModal;
		
		this.departmentManager = new DepartmentManager(this); //부서관리
		window.departmentManager = this.departmentManager; // 전역 접근용
		
		this.workScheduleManager = new WorkScheduleManager(this); // 휴가
		window.workScheduleManager = this.workScheduleManager; // 전역 접근용
        this.init();
    }

    async init() {
        try {
            // DOM 요소 참조
            this.initDOMElements();
            
            // 이벤트 리스너 등록
            this.attachEventListeners();
            
            // 부서 목록 로드
            await this.loadDepartments();
            
            // 직원 목록 로드
            await this.loadEmployees();
            
            console.log('직원 관리 시스템 초기화 완료');
        } catch (error) {
            console.error('직원 관리 시스템 초기화 실패:', error);
            this.showError('시스템 초기화 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        // 필터 요소들
        this.departmentFilter = document.getElementById('departmentFilter');
        this.statusFilter = document.getElementById('statusFilter');
        this.roleFilter = document.getElementById('roleFilter');
        this.pageSize = document.getElementById('pageSize');
        this.searchWord = document.getElementById('search_word');
        this.searchBtn = document.getElementById('search_btn');
        
        // 통계 요소들
        this.totalCount = document.getElementById('totalCount');
        this.activeCount = document.getElementById('activeCount');
        this.pendingCount = document.getElementById('pendingCount');
        this.refreshTime = document.getElementById('refreshTime');
        
        // 버튼 요소들
		this.manageDepartmentsBtn = document.getElementById('manageDepartments'); // editEmployeeBtn 대신
		this.manageWorkScheduleBtn = document.getElementById('manageWorkSchedule'); // 휴가
        this.exportExcelBtn = document.getElementById('exportExcel');
        this.refreshListBtn = document.getElementById('refreshList');
        
        // 테이블 요소들
        this.tableBody = document.getElementById('employees_table_body');
        this.mobileCards = document.getElementById('employees_mobile_cards');
        this.paginationInfo = document.getElementById('pagination_info');
        this.paginationControls = document.getElementById('pagination_controls');
    }

    attachEventListeners() {
        // 검색 버튼
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchWord.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // 필터 변경
        this.statusFilter.addEventListener('change', () => this.handleFilterChange());
        this.departmentFilter.addEventListener('change', () => this.handleFilterChange());
        this.roleFilter.addEventListener('change', () => this.handleFilterChange());
        this.pageSize.addEventListener('change', () => this.handleFilterChange());
        
        // 버튼 클릭
        if (this.manageDepartmentsBtn) {
            this.manageDepartmentsBtn.addEventListener('click', () => {
                if (this.departmentManager) {
                    this.departmentManager.showDepartmentModal();
                } else {
                    console.error('DepartmentManager가 초기화되지 않았습니다.');
                    window.sjTemplateLoader?.showToast('부서 관리 기능을 사용할 수 없습니다.', 'error');
                }
            });
        }
        if (this.manageWorkScheduleBtn) {
            this.manageWorkScheduleBtn.addEventListener('click', () => {
                if (this.workScheduleManager) {
                    this.workScheduleManager.showWorkScheduleModal();
                } else {
                    console.error('WorkScheduleManager가 초기화되지 않았습니다.');
                    window.sjTemplateLoader?.showToast('근무 일정 관리 기능을 사용할 수 없습니다.', 'error');
                }
            });
        }
        if (this.refreshListBtn) {
            this.refreshListBtn.addEventListener('click', () => this.loadEmployees());
        }
        if (this.exportExcelBtn) {
            this.exportExcelBtn.addEventListener('click', () => this.handleExportExcel());
        }
    }

    async loadDepartments() {
        try {
            const response = await fetch('/api/staff/departments', {
                credentials: 'include'
            });
            
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

    renderDepartmentFilter() {
        const currentValue = this.departmentFilter.value;
        this.departmentFilter.innerHTML = '<option value="">전체 부서</option>';
        
        this.departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = `${dept.name} (${dept.employee_count}명)`;
            this.departmentFilter.appendChild(option);
        });
        
        // 이전 선택값 복원
        if (currentValue) {
            this.departmentFilter.value = currentValue;
        }
    }

    async loadEmployees(page = 1) {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams({
                page,
                limit: this.currentLimit,
                status: this.statusFilter.value,
                department: this.departmentFilter.value,
                role: this.roleFilter.value,
                search: this.searchWord.value,
                sortBy: 'created_at',
                sortOrder: 'desc'
            });
            
            const response = await fetch(`/api/staff/employees?${params}`, {
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.employees = result.data.employees;
                this.currentPage = result.data.pagination.current_page;
                
                this.renderEmployeesTable();
                this.renderMobileCards();
                this.renderPagination(result.data.pagination);
                this.updateStatistics(result.data.statistics);
                this.updateRefreshTime();
                
                // 선택 상태 초기화
                console.log('직원 목록 로드 완료:', this.employees.length, '명');
                
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('직원 목록 로드 오류:', error);
            this.showError('직원 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // 2. renderEmployeesTable 함수 수정 - 관리 버튼 컬럼 추가
renderEmployeesTable() {
    if (this.employees.length === 0) {
        this.tableBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">검색 결과가 없습니다.</td></tr>';
        return;
    }
    
    const startIndex = (this.currentPage - 1) * this.currentLimit;
    
    this.tableBody.innerHTML = this.employees.map((employee, index) => {
        const rowNumber = startIndex + index + 1;
        const statusBadge = this.getStatusBadge(employee.is_active); // status 대신 is_active 사용
        const roleBadge = this.getRoleBadge(employee.role);
        
        // 상태별 관리 버튼 구성
        
        return `
            <tr data-email="${employee.email}">
                <td class="col-number">
                    <button class="btn btn-info btn-sm mobile-card-number-btn" 
                            onclick="employeeManager.showEmployeeDetail('${employee.email}')">
                        ${rowNumber}
                    </button>
                </td>
                <td class="col-company-name">${employee.name}</td>
                <td class="col-business-number">${employee.email}</td>
                <td class="col-phone d-none d-lg-table-cell">${employee.phone || '-'}</td>
                <td class="col-design-number d-none d-lg-table-cell">${employee.employee_id || '-'}</td>
                <td class="col-manager">${employee.department.name || '-'}</td>
                <td class="col-manager d-none d-xl-table-cell">${employee.position || '-'}</td>
                <td class="col-account">${roleBadge}</td>
                <td class="col-date">${this.formatDate(employee.created_at)}</td>
                <td class="col-date d-none d-lg-table-cell">${employee.last_login_at ? this.formatDate(employee.last_login_at) : '-'}</td>
                <td class="col-status">${statusBadge}</td>
                
            </tr>
        `;
    }).join('');
}

// 3. renderMobileCards 함수 수정
renderMobileCards() {
    if (this.employees.length === 0) {
        this.mobileCards.innerHTML = '<div class="text-center py-4">검색 결과가 없습니다.</div>';
        return;
    }
    
    const startIndex = (this.currentPage - 1) * this.currentLimit;
    
    this.mobileCards.innerHTML = this.employees.map((employee, index) => {
        const rowNumber = startIndex + index + 1;
        const statusBadge = this.getStatusBadge(employee.is_active); // status 대신 is_active 사용
        const roleBadge = this.getRoleBadge(employee.role);
        
        
        
        return `
            <div class="mobile-card" data-email="${employee.email}">
                <div class="mobile-card-header">
                    <div class="d-flex align-items-center">
                        <button class="mobile-card-number-btn me-2" onclick="employeeManager.showEmployeeDetail('${employee.email}')">
                            ${rowNumber}
                        </button>
                        <span class="mobile-card-title">${employee.name}</span>
                    </div>
                    <div>${statusBadge}</div>
                </div>
                <div class="mobile-card-body">
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">이메일:</span>
                        <span class="mobile-card-value">${employee.email}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">연락처:</span>
                        <span class="mobile-card-value">${employee.phone || '-'}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">사번:</span>
                        <span class="mobile-card-value">${employee.employee_id || '-'}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">부서:</span>
                        <span class="mobile-card-value">${employee.department.name || '-'}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">직급:</span>
                        <span class="mobile-card-value">${employee.position || '-'}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">권한:</span>
                        <span class="mobile-card-value">${roleBadge}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">가입일:</span>
                        <span class="mobile-card-value">${this.formatDate(employee.created_at)}</span>
                    </div>
                    
                </div>
            </div>
        `;
    }).join('');
}

    renderPagination(pagination) {
        // 페이지 정보 업데이트
        this.paginationInfo.textContent = 
            `${pagination.total_count}명 중 ${((pagination.current_page - 1) * pagination.limit) + 1}-${Math.min(pagination.current_page * pagination.limit, pagination.total_count)}명 표시`;
        
        // 페이지네이션 버튼 생성
        let paginationHTML = '';
        
        // 이전 페이지 버튼
        paginationHTML += `
            <li class="page-item ${!pagination.has_prev ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="employeeManager.loadEmployees(${pagination.current_page - 1}); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // 페이지 번호 버튼들
        const startPage = Math.max(1, pagination.current_page - 2);
        const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);
        
        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="employeeManager.loadEmployees(1); return false;">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === pagination.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="employeeManager.loadEmployees(${i}); return false;">${i}</a>
                </li>
            `;
        }
        
        if (endPage < pagination.total_pages) {
            if (endPage < pagination.total_pages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="employeeManager.loadEmployees(${pagination.total_pages}); return false;">${pagination.total_pages}</a>
                </li>
            `;
        }
        
        // 다음 페이지 버튼
        paginationHTML += `
            <li class="page-item ${!pagination.has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="employeeManager.loadEmployees(${pagination.current_page + 1}); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        this.paginationControls.innerHTML = paginationHTML;
    }

   // 4. updateStatistics 함수 수정 - 비활성 상태 추가
	updateStatistics(stats) {
		this.totalCount.textContent = stats.total || 0;
		this.pendingCount.textContent = stats.pending || 0;  // 승인대기
		this.activeCount.textContent = stats.active || 0;    // 활성
		
		// 비활성 통계 추가 (HTML에 inactiveCount 요소가 있다면)
		const inactiveCount = document.getElementById('inactiveCount');
		if (inactiveCount) {
			inactiveCount.textContent = stats.inactive || 0;
		}
	}



    updateRefreshTime() {
        const now = new Date();
        this.refreshTime.textContent = `마지막 갱신: ${now.toLocaleString('ko-KR')}`;
    }

    getStatusBadge(status) {
		switch (status) {
			case 0:
				return '<span class="status-badge status-pending">승인대기</span>';
			case 1:
				return '<span class="status-badge status-active">활성</span>';
			case 2:
				return '<span class="status-badge status-inactive">비활성</span>';
			default:
				return '<span class="status-badge status-other">알 수 없음</span>';
		}
	}

    getRoleBadge(role) {
        const roleNames = {
            'SUPER_ADMIN': '최고관리자',
            'DEPT_MANAGER': '부서장',
            'SYSTEM_ADMIN': '시스템관리자',
            'EMPLOYEE': '직원'
        };
        
        const colors = {
            'SUPER_ADMIN': 'danger',
            'DEPT_MANAGER': 'warning',
            'SYSTEM_ADMIN': 'info',
            'EMPLOYEE': 'secondary'
        };
        
        return `<span class="badge bg-${colors[role] || 'secondary'}">${roleNames[role] || role}</span>`;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    }

    handleSearch() {
        this.currentPage = 1;
        this.loadEmployees(1);
    }

    handleFilterChange() {
        this.currentLimit = parseInt(this.pageSize.value);
        this.currentPage = 1;
        this.loadEmployees(1);
    }

    async approveEmployee(email) {
        if (!confirm('해당 직원을 승인하시겠습니까?')) return;
        
        try {
            const response = await fetch('/api/auth/approve-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    action: 'approve'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.sjTemplateLoader.showToast('직원이 승인되었습니다.', 'success');
                this.loadEmployees(this.currentPage);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('직원 승인 오류:', error);
            this.showError('직원 승인 중 오류가 발생했습니다.');
        }
    }

    async rejectEmployee(email) {
        if (!confirm('해당 직원을 거부하시겠습니까? 계정이 삭제됩니다.')) return;
        
        try {
            const response = await fetch('/api/auth/approve-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    action: 'reject'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.sjTemplateLoader.showToast('직원이 거부되었습니다.', 'warning');
                this.loadEmployees(this.currentPage);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('직원 거부 오류:', error);
            this.showError('직원 거부 중 오류가 발생했습니다.');
        }
    }

    // showEmployeeDetail 함수 수정
	showEmployeeDetail(email) {
		this.employeeModal.showEmployeeDetail(email);
	}

    editEmployee(email) {
        // TODO: 직원 정보 수정 모달 구현
        console.log('직원 정보 수정:', email);
    }

    handleExportExcel() {
        // TODO: 엑셀 다운로드 기능 구현
        console.log('엑셀 다운로드');
        window.sjTemplateLoader.showToast('엑셀 다운로드 기능은 준비 중입니다.', 'info');
    }

    async handleRejectSelected() {
        if (this.selectedEmployees.size === 0) return;
        
        if (!confirm(`선택한 ${this.selectedEmployees.size}명의 직원을 거부하시겠습니까? 계정이 삭제됩니다.`)) return;
        
        try {
            let successCount = 0;
            let errorCount = 0;
            
            for (const email of this.selectedEmployees) {
                try {
                    const response = await fetch('/api/auth/approve-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            email,
                            action: 'reject'
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }
            }
            
            if (successCount > 0) {
                window.sjTemplateLoader.showToast(`${successCount}명의 직원이 거부되었습니다.`, 'warning');
            }
            
            if (errorCount > 0) {
                this.showError(`${errorCount}명의 직원 거부에 실패했습니다.`);
            }
            
            this.loadEmployees(this.currentPage);
        } catch (error) {
            console.error('일괄 거부 오류:', error);
            this.showError('일괄 거부 중 오류가 발생했습니다.');
        }
    }

   

    editEmployee(email) {
        // TODO: 직원 정보 수정 모달 구현
        console.log('직원 정보 수정:', email);
    }

    handleExportExcel() {
        // TODO: 엑셀 다운로드 기능 구현
        console.log('엑셀 다운로드');
        window.sjTemplateLoader.showToast('엑셀 다운로드 기능은 준비 중입니다.', 'info');
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        window.sjTemplateLoader.showError(message);
    }
}

// 전역 인스턴스 생성
let employeeManager;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    employeeManager = new EmployeeManager();
});

// 전역 함수로 노출 (HTML에서 사용)
window.employeeManager = employeeManager;