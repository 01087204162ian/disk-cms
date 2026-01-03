// ==============================
// js/staff/organization-chart.js - 조직도 시각화 모듈
// ==============================

class OrganizationChart {
    constructor() {
        this.departments = [];
        this.employees = [];
        this.filteredEmployees = [];
        this.selectedDepartment = '';
        this.searchKeyword = '';
        this.init();
    }

    async init() {
        try {
            // DOM 요소 참조
            this.initDOMElements();
            
            // 이벤트 리스너 등록
            this.attachEventListeners();
            
            // 데이터 로드
            await this.loadData();
            
            // 조직도 렌더링
            this.renderOrgChart();
            
            console.log('조직도 시스템 초기화 완료');
        } catch (error) {
            console.error('조직도 시스템 초기화 실패:', error);
            this.showError('시스템 초기화 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        this.container = document.getElementById('orgChartContainer');
        this.departmentFilter = document.getElementById('departmentFilter');
        this.searchWord = document.getElementById('search_word');
        this.searchBtn = document.getElementById('search_btn');
        this.refreshListBtn = document.getElementById('refreshList');
        this.totalDepartments = document.getElementById('totalDepartments');
        this.totalEmployees = document.getElementById('totalEmployees');
        this.refreshTime = document.getElementById('refreshTime');
    }

    attachEventListeners() {
        // 검색 버튼
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchWord.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // 필터 변경
        this.departmentFilter.addEventListener('change', () => this.handleFilterChange());
        
        // 새로고침
        this.refreshListBtn.addEventListener('click', () => this.loadData());
    }

    async loadData() {
        try {
            // 부서 목록 로드
            const deptResponse = await fetch('/api/staff/departments', {
                credentials: 'include'
            });
            const deptResult = await deptResponse.json();
            
            if (deptResult.success) {
                this.departments = deptResult.data.filter(dept => dept.is_active);
                this.renderDepartmentFilter();
            }

            // 직원 목록 로드
            const empResponse = await fetch('/api/staff/employees?limit=1000', {
                credentials: 'include'
            });
            const empResult = await empResponse.json();
            
            if (empResult.success) {
                this.employees = empResult.data.employees.filter(emp => emp.is_active === 1);
                this.filteredEmployees = [...this.employees];
            }

            // 통계 업데이트
            this.updateStatistics();
            
            // 갱신 시간 업데이트
            this.refreshTime.textContent = `마지막 갱신: ${new Date().toLocaleString('ko-KR')}`;
            
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            this.showError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    renderDepartmentFilter() {
        this.departmentFilter.innerHTML = '<option value="">전체 부서</option>';
        
        this.departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = `${dept.name} (${dept.code || ''})`;
            this.departmentFilter.appendChild(option);
        });
    }

    handleFilterChange() {
        this.selectedDepartment = this.departmentFilter.value;
        this.applyFilters();
        this.renderOrgChart();
    }

    handleSearch() {
        this.searchKeyword = this.searchWord.value.trim();
        this.applyFilters();
        this.renderOrgChart();
    }

    applyFilters() {
        this.filteredEmployees = this.employees.filter(emp => {
            // 부서 필터
            if (this.selectedDepartment && emp.department?.id !== parseInt(this.selectedDepartment)) {
                return false;
            }
            
            // 검색 필터
            if (this.searchKeyword) {
                const keyword = this.searchKeyword.toLowerCase();
                const nameMatch = emp.name?.toLowerCase().includes(keyword);
                const emailMatch = emp.email?.toLowerCase().includes(keyword);
                if (!nameMatch && !emailMatch) {
                    return false;
                }
            }
            
            return true;
        });
    }

    updateStatistics() {
        this.totalDepartments.textContent = this.departments.length;
        this.totalEmployees.textContent = this.filteredEmployees.length;
    }

    renderOrgChart() {
        // 통계 업데이트
        this.updateStatistics();

        // 부서별로 직원 그룹화
        const employeesByDept = {};
        this.filteredEmployees.forEach(emp => {
            const deptId = emp.department?.id || 'no-dept';
            if (!employeesByDept[deptId]) {
                employeesByDept[deptId] = [];
            }
            employeesByDept[deptId].push(emp);
        });

        // HTML 생성
        let html = '<div class="org-chart-wrapper">';
        
        // 부서별로 렌더링
        this.departments.forEach(dept => {
            const deptEmployees = employeesByDept[dept.id] || [];
            if (this.selectedDepartment && dept.id !== parseInt(this.selectedDepartment)) {
                return; // 선택된 부서만 표시
            }
            
            html += this.renderDepartment(dept, deptEmployees);
        });

        // 부서가 없는 직원들
        if (employeesByDept['no-dept'] && employeesByDept['no-dept'].length > 0) {
            html += this.renderNoDepartmentEmployees(employeesByDept['no-dept']);
        }

        html += '</div>';
        
        this.container.innerHTML = html;
    }

    renderDepartment(dept, employees) {
        const manager = employees.find(emp => emp.role === 'DEPT_MANAGER' || emp.email === dept.manager_id);
        const regularEmployees = employees.filter(emp => emp.email !== (manager?.email));

        let html = `
            <div class="org-dept-card mb-4">
                <div class="org-dept-header">
                    <h5 class="mb-1">
                        <i class="fas fa-building me-2"></i>${dept.name}
                        ${dept.code ? `<small class="text-muted">(${dept.code})</small>` : ''}
                    </h5>
                    <div class="text-muted small">
                        <span class="badge bg-info">${employees.length}명</span>
                        ${dept.description ? `<span class="ms-2">${dept.description}</span>` : ''}
                    </div>
                </div>
                
                <div class="org-dept-body">
        `;

        // 부서장 표시
        if (manager) {
            html += this.renderEmployeeCard(manager, true);
        }

        // 일반 직원들 표시
        if (regularEmployees.length > 0) {
            html += '<div class="org-employees-grid">';
            regularEmployees.forEach(emp => {
                html += this.renderEmployeeCard(emp, false);
            });
            html += '</div>';
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    renderNoDepartmentEmployees(employees) {
        let html = `
            <div class="org-dept-card mb-4">
                <div class="org-dept-header">
                    <h5 class="mb-1">
                        <i class="fas fa-users me-2"></i>부서 미지정
                    </h5>
                    <div class="text-muted small">
                        <span class="badge bg-secondary">${employees.length}명</span>
                    </div>
                </div>
                
                <div class="org-dept-body">
                    <div class="org-employees-grid">
        `;

        employees.forEach(emp => {
            html += this.renderEmployeeCard(emp, false);
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    renderEmployeeCard(employee, isManager) {
        const roleBadge = this.getRoleBadge(employee.role);
        const managerClass = isManager ? 'org-employee-manager' : '';
        
        return `
            <div class="org-employee-card ${managerClass}" onclick="organizationChart.showEmployeeDetail('${employee.email}')">
                <div class="org-employee-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="org-employee-info">
                    <div class="org-employee-name">
                        ${employee.name}
                        ${isManager ? '<i class="fas fa-crown text-warning ms-1" title="부서장"></i>' : ''}
                    </div>
                    <div class="org-employee-email text-muted small">${employee.email}</div>
                    <div class="org-employee-role">${roleBadge}</div>
                    ${employee.position ? `<div class="org-employee-position text-muted small">${employee.position}</div>` : ''}
                </div>
            </div>
        `;
    }

    getRoleBadge(role) {
        const badges = {
            'SUPER_ADMIN': '<span class="badge bg-danger">최고관리자</span>',
            'SYSTEM_ADMIN': '<span class="badge bg-warning text-dark">시스템관리자</span>',
            'DEPT_MANAGER': '<span class="badge bg-primary">부서장</span>',
            'EMPLOYEE': '<span class="badge bg-secondary">직원</span>'
        };
        return badges[role] || `<span class="badge bg-secondary">${role}</span>`;
    }

    showEmployeeDetail(email) {
        // employee-list.js의 EmployeeModal 사용 (전역으로 접근 가능한 경우)
        if (window.employeeModal && window.employeeModal.showEmployeeDetail) {
            window.employeeModal.showEmployeeDetail(email);
        } else {
            // 모달이 없는 경우 새 창으로 열거나 알림
            alert(`직원 상세 정보: ${email}\n직원 관리 페이지에서 확인해주세요.`);
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>${message}
            </div>
        `;
    }
}

// 전역 인스턴스 생성
let organizationChart;

// DOMContentLoaded 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    organizationChart = new OrganizationChart();
    window.organizationChart = organizationChart; // 전역 접근용
});

