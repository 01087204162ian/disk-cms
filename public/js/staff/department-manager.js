// ==============================
// js/staff/department-manager.js - 부서 관리 전용 모듈
// ==============================

class DepartmentManager {
    constructor(employeeManager) {
        this.employeeManager = employeeManager;
        this.departments = [];
        this.employees = [];
    }

    // 부서 관리 모달 HTML 생성
    generateModalHTML() {
        return `
            <div class="modal fade" id="departmentManagementModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-building me-2"></i>부서 관리
                                <small class="d-block mt-1">부서 추가, 수정, 삭제 관리</small>
                            </h5>
                            <button type="button" class="btn-close-custom" data-bs-dismiss="modal">×</button>
                        </div>
                        
                        <!-- 데스크톱용 모달 바디 -->
                        <div class="modal-body desktop-modal">
                            <!-- 새 부서 추가 영역 -->
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h6 class="card-title mb-3">
                                        <i class="fas fa-plus-circle text-primary me-2"></i>새 부서 추가
                                    </h6>
                                    <form id="addDepartmentForm">
                                        <div class="row">
                                            <div class="col-md-2">
                                                <label class="form-label">부서코드</label>
                                                <input type="text" class="form-control form-control-sm" 
                                                       id="newDeptCode" placeholder="예: DEV" maxlength="20" required>
                                            </div>
                                            <div class="col-md-3">
                                                <label class="form-label">부서명</label>
                                                <input type="text" class="form-control form-control-sm" 
                                                       id="newDeptName" placeholder="예: 개발팀" maxlength="50" required>
                                            </div>
                                            <div class="col-md-3">
                                                <label class="form-label">부서장</label>
                                                <select class="form-control form-control-sm" id="newDeptManager">
                                                    <option value="">부서장 선택 (선택사항)</option>
                                                </select>
                                            </div>
                                            <div class="col-md-2">
                                                <label class="form-label">상태</label>
                                                <select class="form-control form-control-sm" id="newDeptStatus">
                                                    <option value="1">활성</option>
                                                    <option value="0">비활성</option>
                                                </select>
                                            </div>
                                            <div class="col-md-2 d-flex align-items-end">
                                                <button type="submit" class="btn btn-primary btn-sm w-100">
                                                    <i class="fas fa-plus"></i> 추가
                                                </button>
                                            </div>
                                        </div>
                                        <div class="row mt-2">
                                            <div class="col-12">
                                                <label class="form-label">부서 설명</label>
                                                <textarea class="form-control form-control-sm" id="newDeptDescription" 
                                                         placeholder="부서 설명을 입력하세요 (선택사항)" rows="2" maxlength="500"></textarea>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <!-- 기존 부서 목록 -->
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="card-title mb-3">
                                        <i class="fas fa-list text-info me-2"></i>기존 부서 목록
                                        <span class="badge bg-secondary ms-2" id="departmentCount">0개</span>
                                    </h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-bordered table-hover">
                                            <thead class="table-light">
                                                <tr>
                                                    <th width="10%">코드</th>
                                                    <th width="20%">부서명</th>
                                                    <th width="20%">부서장</th>
                                                    <th width="25%">설명</th>
                                                    <th width="8%">인원</th>
                                                    <th width="10%">상태</th>
                                                    <th width="7%">관리</th>
                                                </tr>
                                            </thead>
                                            <tbody id="departmentTableBody">
                                                <tr>
                                                    <td colspan="7" class="text-center py-4">
                                                        <div class="spinner-border spinner-border-sm me-2"></div>
                                                        부서 목록을 불러오는 중...
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 모바일용 모달 바디 -->
                        <div class="modal-body mobile-modal">
                            <!-- 새 부서 추가 (모바일) -->
                            <div class="mobile-section mb-4">
                                <h6 class="mb-3">새 부서 추가</h6>
                                <form id="addDepartmentFormMobile">
                                    <div class="mobile-field-group">
                                        <label class="mobile-field-label">코드</label>
                                        <input type="text" class="mobile-input" id="newDeptCodeMobile" 
                                               placeholder="부서코드" maxlength="20" required>
                                    </div>
                                    <div class="mobile-field-group">
                                        <label class="mobile-field-label">부서명</label>
                                        <input type="text" class="mobile-input" id="newDeptNameMobile" 
                                               placeholder="부서명" maxlength="50" required>
                                    </div>
                                    <div class="mobile-field-group">
                                        <label class="mobile-field-label">부서장</label>
                                        <select class="mobile-input" id="newDeptManagerMobile">
                                            <option value="">선택 안함</option>
                                        </select>
                                    </div>
                                    <div class="mobile-field-group">
                                        <label class="mobile-field-label">상태</label>
                                        <select class="mobile-input" id="newDeptStatusMobile">
                                            <option value="1">활성</option>
                                            <option value="0">비활성</option>
                                        </select>
                                    </div>
                                    <div class="mobile-field-group">
                                        <label class="mobile-field-label">설명</label>
                                        <textarea class="mobile-input" id="newDeptDescriptionMobile" 
                                                 placeholder="부서 설명" rows="2" maxlength="500"></textarea>
                                    </div>
                                    <div class="text-center mt-3">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-plus"></i> 부서 추가
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <!-- 부서 목록 (모바일 카드) -->
                            <div class="mobile-section">
                                <h6 class="mb-3">기존 부서 목록</h6>
                                <div id="departmentMobileCards">
                                    <div class="text-center py-4">
                                        <div class="spinner-border spinner-border-sm me-2"></div>
                                        부서 목록을 불러오는 중...
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i> 닫기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 부서 관리 모달 표시
    async showDepartmentModal() {
        try {
            // 기존 모달 제거
            this.removeExistingModal();
            
            // 모달 HTML 추가
            document.body.insertAdjacentHTML('beforeend', this.generateModalHTML());
            
            // 데이터 로드
            await this.loadDepartments();
            await this.loadEmployees();
            
            // UI 렌더링
            this.renderDepartmentTable();
            this.renderDepartmentMobileCards();
            this.renderManagerOptions();
            
            // 이벤트 리스너 등록
            this.attachModalEventListeners();
            
            // 모달 표시
            const modal = new bootstrap.Modal(document.getElementById('departmentManagementModal'));
            modal.show();
            
            // 모달 제거 이벤트
            document.getElementById('departmentManagementModal').addEventListener('hidden.bs.modal', () => {
                this.removeExistingModal();
            });
            
            console.log('부서 관리 모달이 열렸습니다.');
            
        } catch (error) {
            console.error('부서 관리 모달 로드 실패:', error);
            window.sjTemplateLoader.showToast('부서 관리 모달을 열 수 없습니다.', 'error');
        }
    }

    // 기존 모달 제거
    removeExistingModal() {
        const existingModal = document.getElementById('departmentManagementModal');
        if (existingModal) {
            existingModal.remove();
        }
    }

    // 부서 목록 로드
    async loadDepartments() {
        try {
            const response = await fetch('/api/staff/departments/manage', {
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.departments = result.data;
            } else {
                throw new Error(result.message || '부서 목록 로드 실패');
            }
        } catch (error) {
            console.error('부서 목록 로드 오류:', error);
            throw error;
        }
    }

    // 부서장 후보 직원 목록 로드
    async loadEmployees() {
        try {
            const response = await fetch('/api/staff/employees?status=1&limit=1000', {
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 부서장이 될 수 있는 직원들만 필터링 (권한 레벨 고려)
                this.employees = result.data.employees.filter(emp => 
                    ['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'].includes(emp.role)
                );
            } else {
                throw new Error(result.message || '직원 목록 로드 실패');
            }
        } catch (error) {
            console.error('직원 목록 로드 오류:', error);
            this.employees = []; // 빈 배열로 초기화하여 오류 방지
        }
    }

    // 부서장 선택 옵션 렌더링
    renderManagerOptions() {
        const managerSelects = [
            document.getElementById('newDeptManager'),
            document.getElementById('newDeptManagerMobile')
        ];
        
        managerSelects.forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">부서장 선택 (선택사항)</option>';
                
                this.employees.forEach(emp => {
                    const option = document.createElement('option');
                    option.value = emp.email;
                    option.textContent = `${emp.name} (${emp.department.name || '미지정'})`;
                    select.appendChild(option);
                });
                
                // 이전 선택값 복원
                if (currentValue) {
                    select.value = currentValue;
                }
            }
        });
    }

    // 데스크톱 부서 테이블 렌더링
    renderDepartmentTable() {
        const tbody = document.getElementById('departmentTableBody');
        const countBadge = document.getElementById('departmentCount');
        
        if (countBadge) {
            countBadge.textContent = `${this.departments.length}개`;
        }
        
        if (this.departments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        <i class="fas fa-info-circle me-2"></i>등록된 부서가 없습니다.
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.departments.map(dept => {
            const manager = this.employees.find(emp => emp.email === dept.manager_id);
            const statusBadge = dept.is_active 
                ? '<span class="badge bg-success">활성</span>'
                : '<span class="badge bg-secondary">비활성</span>';
            
            return `
                <tr data-dept-id="${dept.id}" class="${dept.is_active ? '' : 'table-warning'}">
                    <td>
                        <input type="text" class="form-control form-control-sm dept-code" 
                               value="${dept.code}" data-original="${dept.code}" maxlength="20">
                    </td>
                    <td>
                        <input type="text" class="form-control form-control-sm dept-name" 
                               value="${dept.name}" data-original="${dept.name}" maxlength="50">
                    </td>
                    <td>
                        <select class="form-control form-control-sm dept-manager" data-original="${dept.manager_id || ''}">
                            <option value="">선택 안함</option>
                            ${this.employees.map(emp => 
                                `<option value="${emp.email}" ${emp.email === dept.manager_id ? 'selected' : ''}>
                                    ${emp.name}
                                </option>`
                            ).join('')}
                        </select>
                    </td>
                    <td>
                        <textarea class="form-control form-control-sm dept-description" rows="1" maxlength="500"
                                  data-original="${dept.description || ''}">${dept.description || ''}</textarea>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-info">${dept.employee_count || 0}명</span>
                    </td>
                    <td class="text-center">
                        <select class="form-control form-control-sm dept-status" data-original="${dept.is_active ? 1 : 0}">
                            <option value="1" ${dept.is_active ? 'selected' : ''}>활성</option>
                            <option value="0" ${!dept.is_active ? 'selected' : ''}>비활성</option>
                        </select>
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-success save-dept" onclick="departmentManager.saveDepartment(${dept.id})" 
                                    style="display:none;" title="저장">
                                <i class="fas fa-save"></i>
                            </button>
                            <button class="btn btn-warning reset-dept" onclick="departmentManager.resetDepartment(${dept.id})" 
                                    style="display:none;" title="취소">
                                <i class="fas fa-undo"></i>
                            </button>
                            <button class="btn btn-danger delete-dept" onclick="departmentManager.deleteDepartment(${dept.id})"
                                    title="삭제" ${(dept.employee_count || 0) > 0 ? 'disabled' : ''}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 모바일 부서 카드 렌더링
    renderDepartmentMobileCards() {
        const container = document.getElementById('departmentMobileCards');
        
        if (this.departments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-info-circle me-2"></i>등록된 부서가 없습니다.
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.departments.map(dept => {
            const manager = this.employees.find(emp => emp.email === dept.manager_id);
            const statusBadge = dept.is_active 
                ? '<span class="badge bg-success">활성</span>'
                : '<span class="badge bg-secondary">비활성</span>';
            
            return `
                <div class="mobile-card" data-dept-id="${dept.id}">
                    <div class="mobile-card-header">
                        <div class="d-flex align-items-center">
                            <span class="mobile-card-title">${dept.name} (${dept.code})</span>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    <div class="mobile-card-body">
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">부서장:</span>
                            <span class="mobile-card-value">${manager ? manager.name : '미지정'}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">인원:</span>
                            <span class="mobile-card-value">${dept.employee_count || 0}명</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">설명:</span>
                            <span class="mobile-card-value">${dept.description || '없음'}</span>
                        </div>
                        <div class="mobile-card-row mt-2">
                            <div class="btn-group btn-group-sm w-100">
                                <button class="btn btn-outline-primary" onclick="departmentManager.editDepartmentMobile(${dept.id})">
                                    <i class="fas fa-edit"></i> 수정
                                </button>
                                <button class="btn btn-outline-danger" onclick="departmentManager.deleteDepartment(${dept.id})"
                                        ${(dept.employee_count || 0) > 0 ? 'disabled' : ''}>
                                    <i class="fas fa-trash"></i> 삭제
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 이벤트 리스너 등록
    attachModalEventListeners() {
        // 데스크톱 새 부서 추가 폼
        const deskForm = document.getElementById('addDepartmentForm');
        if (deskForm) {
            deskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewDepartment();
            });
        }
        
        // 모바일 새 부서 추가 폼
        const mobileForm = document.getElementById('addDepartmentFormMobile');
        if (mobileForm) {
            mobileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewDepartmentMobile();
            });
        }

        // 부서 정보 변경 감지 (데스크톱)
        const inputs = document.querySelectorAll('.dept-code, .dept-name, .dept-manager, .dept-status, .dept-description');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const row = input.closest('tr');
                if (row) {
                    this.showSaveButtons(row);
                }
            });
        });
        
        console.log('부서 관리 모달 이벤트 리스너가 등록되었습니다.');
    }

    // 저장/취소 버튼 표시
    showSaveButtons(row) {
        const saveBtn = row.querySelector('.save-dept');
        const resetBtn = row.querySelector('.reset-dept');
        
        if (saveBtn && resetBtn) {
            saveBtn.style.display = 'inline-block';
            resetBtn.style.display = 'inline-block';
        }
    }

    // 새 부서 추가 (데스크톱)
    async addNewDepartment() {
        const formData = {
            code: document.getElementById('newDeptCode').value.trim().toUpperCase(),
            name: document.getElementById('newDeptName').value.trim(),
            manager_id: document.getElementById('newDeptManager').value || null,
            description: document.getElementById('newDeptDescription').value.trim() || null,
            is_active: parseInt(document.getElementById('newDeptStatus').value)
        };

        await this.submitNewDepartment(formData, 'addDepartmentForm');
    }

    // 새 부서 추가 (모바일)
    async addNewDepartmentMobile() {
        const formData = {
            code: document.getElementById('newDeptCodeMobile').value.trim().toUpperCase(),
            name: document.getElementById('newDeptNameMobile').value.trim(),
            manager_id: document.getElementById('newDeptManagerMobile').value || null,
            description: document.getElementById('newDeptDescriptionMobile').value.trim() || null,
            is_active: parseInt(document.getElementById('newDeptStatusMobile').value)
        };

        await this.submitNewDepartment(formData, 'addDepartmentFormMobile');
    }

    // 부서 추가 공통 로직
    async submitNewDepartment(formData, formId) {
        // 입력 검증
        if (!formData.code || !formData.name) {
            window.sjTemplateLoader.showToast('부서코드와 부서명은 필수입니다.', 'error');
            return;
        }

        if (formData.code.length > 20) {
            window.sjTemplateLoader.showToast('부서코드는 20자 이내로 입력하세요.', 'error');
            return;
        }

        if (formData.name.length > 50) {
            window.sjTemplateLoader.showToast('부서명은 50자 이내로 입력하세요.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/staff/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                window.sjTemplateLoader.showToast('부서가 추가되었습니다.', 'success');
                
                // 폼 초기화
                document.getElementById(formId).reset();
                
                // 데이터 새로고침
                await this.refreshDepartmentData();
                
            } else {
                window.sjTemplateLoader.showToast(result.message || '부서 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('부서 추가 오류:', error);
            window.sjTemplateLoader.showToast('부서 추가 중 오류가 발생했습니다.', 'error');
        }
    }

    // 부서 정보 저장
    async saveDepartment(deptId) {
        const row = document.querySelector(`tr[data-dept-id="${deptId}"]`);
        if (!row) return;
        
        const formData = {
            code: row.querySelector('.dept-code').value.trim().toUpperCase(),
            name: row.querySelector('.dept-name').value.trim(),
            manager_id: row.querySelector('.dept-manager').value || null,
            description: row.querySelector('.dept-description').value.trim() || null,
            is_active: parseInt(row.querySelector('.dept-status').value)
        };

        // 입력 검증
        if (!formData.code || !formData.name) {
            window.sjTemplateLoader.showToast('부서코드와 부서명은 필수입니다.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/staff/departments/${deptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                window.sjTemplateLoader.showToast('부서 정보가 수정되었습니다.', 'success');
                
                // 저장/취소 버튼 숨기기
                row.querySelector('.save-dept').style.display = 'none';
                row.querySelector('.reset-dept').style.display = 'none';
                
                // 원본 데이터 업데이트
                this.updateOriginalData(row, formData);
                
                // 메인 페이지 부서 필터 새로고침
                await this.employeeManager.loadDepartments();
                
            } else {
                window.sjTemplateLoader.showToast(result.message || '부서 정보 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('부서 정보 저장 오류:', error);
            window.sjTemplateLoader.showToast('부서 정보를 저장하는 중 오류가 발생했습니다.', 'error');
        }
    }

    // 원본 데이터 업데이트 (저장 후)
    updateOriginalData(row, formData) {
        row.querySelector('.dept-code').setAttribute('data-original', formData.code);
        row.querySelector('.dept-name').setAttribute('data-original', formData.name);
        row.querySelector('.dept-manager').setAttribute('data-original', formData.manager_id || '');
        row.querySelector('.dept-description').setAttribute('data-original', formData.description || '');
        row.querySelector('.dept-status').setAttribute('data-original', formData.is_active);
    }

    // 부서 정보 되돌리기
    resetDepartment(deptId) {
        const row = document.querySelector(`tr[data-dept-id="${deptId}"]`);
        if (!row) return;
        
        row.querySelector('.dept-code').value = row.querySelector('.dept-code').getAttribute('data-original');
        row.querySelector('.dept-name').value = row.querySelector('.dept-name').getAttribute('data-original');
        row.querySelector('.dept-manager').value = row.querySelector('.dept-manager').getAttribute('data-original');
        row.querySelector('.dept-description').value = row.querySelector('.dept-description').getAttribute('data-original');
        row.querySelector('.dept-status').value = row.querySelector('.dept-status').getAttribute('data-original');
        
        // 버튼 숨기기
        row.querySelector('.save-dept').style.display = 'none';
        row.querySelector('.reset-dept').style.display = 'none';
    }

    // 부서 삭제
    async deleteDepartment(deptId) {
        const dept = this.departments.find(d => d.id === deptId);
        if (!dept) return;

        // 소속 직원이 있는지 확인
        if ((dept.employee_count || 0) > 0) {
            window.sjTemplateLoader.showToast('소속 직원이 있는 부서는 삭제할 수 없습니다.', 'warning');
            return;
        }

        if (!confirm(`'${dept.name}' 부서를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;

        try {
            const response = await fetch(`/api/staff/departments/${deptId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();
            
            if (result.success) {
                window.sjTemplateLoader.showToast('부서가 삭제되었습니다.', 'success');
                
                // 데이터 새로고침
                await this.refreshDepartmentData();
                
            } else {
                window.sjTemplateLoader.showToast(result.message || '부서 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('부서 삭제 오류:', error);
            window.sjTemplateLoader.showToast('부서 삭제 중 오류가 발생했습니다.', 'error');
        }
    }

    // 모바일 부서 수정 (간단한 프롬프트 방식)
    editDepartmentMobile(deptId) {
        const dept = this.departments.find(d => d.id === deptId);
        if (!dept) return;

        const newName = prompt('부서명을 입력하세요:', dept.name);
        if (newName && newName.trim() && newName.trim() !== dept.name) {
            this.updateDepartmentField(deptId, 'name', newName.trim());
        }
    }

    // 부서 개별 필드 업데이트
    async updateDepartmentField(deptId, field, value) {
        const dept = this.departments.find(d => d.id === deptId);
        if (!dept) return;

        const formData = {
            code: dept.code,
            name: dept.name,
            manager_id: dept.manager_id,
            description: dept.description,
            is_active: dept.is_active,
            [field]: value
        };

        try {
            const response = await fetch(`/api/staff/departments/${deptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                window.sjTemplateLoader.showToast('부서 정보가 수정되었습니다.', 'success');
                await this.refreshDepartmentData();
            } else {
                window.sjTemplateLoader.showToast(result.message || '부서 정보 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('부서 정보 업데이트 오류:', error);
            window.sjTemplateLoader.showToast('부서 정보를 수정하는 중 오류가 발생했습니다.', 'error');
        }
    }

    // 부서 데이터 새로고침 (공통)
    async refreshDepartmentData() {
        try {
            // 부서 목록 새로고침
            await this.loadDepartments();
            
            // UI 새로고침
            this.renderDepartmentTable();
            this.renderDepartmentMobileCards();
            this.renderManagerOptions();
            
            // 메인 페이지 부서 필터도 새로고침
            if (this.employeeManager && this.employeeManager.loadDepartments) {
                await this.employeeManager.loadDepartments();
            }
            
        } catch (error) {
            console.error('부서 데이터 새로고침 오류:', error);
        }
    }

    // 유틸리티: 날짜 포맷팅
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    }

    // 유틸리티: 부서 상태 배지 생성
    getStatusBadge(isActive) {
        return isActive 
            ? '<span class="badge bg-success">활성</span>'
            : '<span class="badge bg-secondary">비활성</span>';
    }

    // 모달 닫기 전 변경사항 확인
    checkUnsavedChanges() {
        const changedInputs = document.querySelectorAll('.save-dept[style*="inline-block"]');
        if (changedInputs.length > 0) {
            return confirm('저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?');
        }
        return true;
    }
}

// 전역 인스턴스로 노출 (HTML onclick에서 사용)
window.departmentManager = null;