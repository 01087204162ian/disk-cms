// ==============================
// js/staff/organization-chart.js - 조직도 시각화 모듈 (고도화 버전)
// ==============================

class OrganizationChart {
    constructor() {
        this.departments = [];
        this.employees = [];
        this.filteredEmployees = [];
        this.executives = []; // 경영진(CEO, CFO 등)
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
                this.departments = deptResult.data;
            }

            // 직원 목록 로드 (조직도 전용 API)
            const empResponse = await fetch('/api/staff/employees/org-chart', {
                credentials: 'include'
            });
            const empResult = await empResponse.json();
            
            if (empResult.success) {
                this.employees = empResult.data;
                // 경영진(CEO, CFO 등) 분리 - SUPER_ADMIN 중 position이 CEO 또는 CFO인 사람들
                this.executives = this.employees.filter(emp => 
                    emp.role === 'SUPER_ADMIN' && 
                    (emp.position === 'CEO' || emp.position === 'CFO')
                ).sort((a, b) => {
                    // CEO가 먼저, 그 다음 CFO
                    if (a.position === 'CEO') return -1;
                    if (b.position === 'CEO') return 1;
                    if (a.position === 'CFO') return -1;
                    if (b.position === 'CFO') return 1;
                    return 0;
                });
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
            option.textContent = `${dept.name}${dept.code ? ` (${dept.code})` : ''}`;
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
            // 경영진(CEO, CFO)은 필터에서 제외 (항상 표시)
            if (emp.role === 'SUPER_ADMIN' && (emp.position === 'CEO' || emp.position === 'CFO')) {
                return true;
            }
            
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
        this.totalEmployees.textContent = this.employees.length;
    }

    renderOrgChart() {
        // 통계 업데이트
        this.updateStatistics();

        let html = '<div class="org-chart-wrapper">';
        
        // 1. 경영진(CEO, CFO) 최상단에 표시
        if (this.executives.length > 0 && (!this.selectedDepartment || this.searchKeyword)) {
            html += this.renderExecutives();
        }

        // 2. 부서별로 계층 구조 렌더링
        const departmentsWithEmployees = this.departments.map(dept => {
            const deptEmployees = this.filteredEmployees.filter(emp => 
                emp.department?.id === dept.id && 
                !(emp.role === 'SUPER_ADMIN' && (emp.position === 'CEO' || emp.position === 'CFO'))
            );
            return { department: dept, employees: deptEmployees };
        }).filter(item => item.employees.length > 0 || !this.selectedDepartment);

        if (departmentsWithEmployees.length > 0) {
            html += '<div class="org-departments-container">';
            departmentsWithEmployees.forEach(({ department, employees }) => {
                html += this.renderDepartmentHierarchy(department, employees);
            });
            html += '</div>';
        }

        // 3. 부서가 없는 직원들
        const noDeptEmployees = this.filteredEmployees.filter(emp => 
            !emp.department && 
            !(emp.role === 'SUPER_ADMIN' && (emp.position === 'CEO' || emp.position === 'CFO'))
        );
        if (noDeptEmployees.length > 0 && !this.selectedDepartment) {
            html += this.renderNoDepartmentEmployees(noDeptEmployees);
        }

        html += '</div>';
        this.container.innerHTML = html;
    }

    renderExecutives() {
        if (this.executives.length === 0) return '';
        
        let html = '<div class="org-executives-section">';
        
        this.executives.forEach((executive, index) => {
            const isCEO = executive.position === 'CEO';
            const positionClass = isCEO ? 'org-ceo-card' : 'org-cfo-card';
            const positionLabel = isCEO ? 'CEO' : 'CFO';
            const positionIcon = isCEO ? 'fa-crown' : 'fa-chart-line';
            
            html += `
                <div class="org-executive-card ${positionClass}">
                    <div class="org-executive-avatar">
                        <i class="fas ${isCEO ? 'fa-user-tie' : 'fa-user-tie'}"></i>
                    </div>
                    <div class="org-executive-info">
                        <div class="org-executive-name">
                            ${executive.name}
                            <i class="fas ${positionIcon} text-warning ms-2" title="${positionLabel}"></i>
                        </div>
                        <div class="org-executive-position">
                            <span class="badge ${isCEO ? 'bg-danger' : 'bg-info'}">${positionLabel}</span>
                        </div>
                        <div class="org-executive-email">${executive.email}</div>
                    </div>
                </div>
            `;
            
            // 마지막 항목이 아니면 연결선 추가
            if (index < this.executives.length - 1) {
                html += '<div class="org-executive-connector"></div>';
            }
        });
        
        html += '<div class="org-executives-connector"></div></div>';
        
        return html;
    }

    renderDepartmentHierarchy(dept, employees) {
        const manager = employees.find(emp => 
            emp.role === 'DEPT_MANAGER' || emp.email === dept.manager_id
        );
        const teamMembers = employees.filter(emp => emp.email !== (manager?.email));

        let html = `
            <div class="org-dept-section">
                <div class="org-dept-header-card">
                    <div class="org-dept-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="org-dept-info">
                        <h5 class="org-dept-name">${dept.name}</h5>
                        ${dept.code ? `<div class="org-dept-code">${dept.code}</div>` : ''}
                        <div class="org-dept-count">
                            <span class="badge bg-primary">${employees.length}명</span>
                        </div>
                    </div>
                </div>
                
                <div class="org-dept-body">
        `;

        // 부서장 표시
        if (manager) {
            html += this.renderManagerCard(manager);
        }

        // 팀원들 표시
        if (teamMembers.length > 0) {
            html += '<div class="org-team-members">';
            teamMembers.forEach(member => {
                html += this.renderTeamMemberCard(member);
            });
            html += '</div>';
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    renderManagerCard(manager) {
        const roleBadge = this.getRoleBadge(manager.role);
        
        return `
            <div class="org-manager-card" onclick="organizationChart.showEmployeeDetail('${manager.email}')">
                <div class="org-manager-avatar">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div class="org-manager-info">
                    <div class="org-manager-name">
                        ${manager.name}
                        <i class="fas fa-star text-warning ms-1" title="부서장"></i>
                    </div>
                    <div class="org-manager-email">${manager.email}</div>
                    <div class="org-manager-role">${roleBadge}</div>
                    ${manager.position ? `<div class="org-manager-position">${manager.position}</div>` : ''}
                </div>
            </div>
        `;
    }

    renderTeamMemberCard(member) {
        const roleBadge = this.getRoleBadge(member.role);
        
        return `
            <div class="org-member-card" onclick="organizationChart.showEmployeeDetail('${member.email}')">
                <div class="org-member-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="org-member-info">
                    <div class="org-member-name">${member.name}</div>
                    <div class="org-member-email">${member.email}</div>
                    <div class="org-member-role">${roleBadge}</div>
                    ${member.position ? `<div class="org-member-position">${member.position}</div>` : ''}
                </div>
            </div>
        `;
    }

    renderNoDepartmentEmployees(employees) {
        let html = `
            <div class="org-dept-section">
                <div class="org-dept-header-card">
                    <div class="org-dept-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="org-dept-info">
                        <h5 class="org-dept-name">부서 미지정</h5>
                        <div class="org-dept-count">
                            <span class="badge bg-secondary">${employees.length}명</span>
                        </div>
                    </div>
                </div>
                
                <div class="org-dept-body">
                    <div class="org-team-members">
        `;

        employees.forEach(emp => {
            html += this.renderTeamMemberCard(emp);
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
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

    async showEmployeeDetail(email) {
        try {
            // EmployeeModal 클래스를 직접 사용 (employee-modal.js에서 로드됨)
            if (typeof EmployeeModal !== 'undefined') {
                // EmployeeModal은 employeeManager를 필요로 하므로 간단한 래퍼 객체 생성
                const mockEmployeeManager = {
                    showError: (msg) => {
                        console.error(msg);
                        if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
                            window.sjTemplateLoader.showToast(msg, 'error');
                        }
                    },
                    getStatusBadge: (status) => {
                        const badges = {
                            'active': '<span class="badge bg-success">활성</span>',
                            'pending': '<span class="badge bg-warning">승인대기</span>',
                            'inactive': '<span class="badge bg-secondary">비활성</span>'
                        };
                        return badges[status] || '<span class="badge bg-secondary">알 수 없음</span>';
                    },
                    getRoleBadge: (role) => {
                        const badges = {
                            'SUPER_ADMIN': '<span class="badge bg-danger">최고관리자</span>',
                            'SYSTEM_ADMIN': '<span class="badge bg-warning text-dark">시스템관리자</span>',
                            'DEPT_MANAGER': '<span class="badge bg-primary">부서장</span>',
                            'EMPLOYEE': '<span class="badge bg-secondary">직원</span>'
                        };
                        return badges[role] || `<span class="badge bg-secondary">${role}</span>`;
                    },
                    loadEmployees: () => {}
                };
                
                const employeeModal = new EmployeeModal(mockEmployeeManager);
                await employeeModal.showEmployeeDetail(email);
            } else if (window.employeeModal && window.employeeModal.showEmployeeDetail) {
                // 전역 employeeModal이 있는 경우 (employees.html에서 로드된 경우)
                await window.employeeModal.showEmployeeDetail(email);
            } else {
                // 모달이 없는 경우 알림
                alert(`직원 상세 정보: ${email}\n직원 관리 페이지에서 확인해주세요.`);
            }
        } catch (error) {
            console.error('직원 상세 정보 표시 오류:', error);
            alert('직원 상세 정보를 불러올 수 없습니다.');
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
