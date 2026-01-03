// ==============================
// js/staff/employee-modal.js - 직원 상세 정보 모달 전용 모듈 (편집 가능)
// ==============================

class EmployeeModal {
    constructor(employeeManager) {
        this.employeeManager = employeeManager;
		this.departments = []; // 부서 목록 저장
		this.currentUser = null; // 현재 사용자 정보
    }
	// 부서 목록 로드 메서드 추가
		async loadDepartments() {
			try {
				const response = await fetch('/api/staff/departments', {
					credentials: 'include'
				});
				
				const result = await response.json();
				
				if (result.success) {
					this.departments = result.data;
				} else {
					console.error('부서 목록 로드 실패:', result.message);
					this.departments = [];
				}
			} catch (error) {
				console.error('부서 목록 로드 오류:', error);
				this.departments = [];
			}
		}
		
		// 부서 선택 드롭다운 생성 메서드
		generateDepartmentOptions(selectedDepartmentId) {
			let options = '<option value="">부서 선택</option>';
			
			this.departments.forEach(dept => {
				const isSelected = dept.id == selectedDepartmentId ? 'selected' : '';
				options += `<option value="${dept.id}" ${isSelected}>${dept.name}</option>`;
			});
			
			return options;
		}
	// EmployeeModal 클래스에 추가할 메서드
// 비활성화 메서드 추가
    async deactivateEmployee(email) {
        // 퇴사일 입력 모달 표시
        const resignDate = await this.showResignDateModal();
        if (!resignDate) return; // 취소된 경우
        
        try {
            const response = await fetch(`/api/staff/employees/${encodeURIComponent(email)}/deactivate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    notes: '모달에서 관리자에 의한 계정 비활성화',
                    resign_date: resignDate
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.sjTemplateLoader.showToast('계정이 비활성화되었습니다.', 'warning');
                // 모달 닫기
                bootstrap.Modal.getInstance(document.getElementById('employeeDetailModal')).hide();
                // 목록 새로고침
                if (this.employeeManager.loadEmployees) {
                    this.employeeManager.loadEmployees();
                }
            } else {
                // 403 에러인 경우 권한 관련 메시지로 변경
                let errorMessage = result.message || '계정 비활성화에 실패했습니다.';
                if (response.status === 403 || result.message?.includes('권한') || result.message?.includes('403')) {
                    errorMessage = '계정 비활성화 권한이 없습니다. 최고관리자, 시스템관리자 또는 부서장만 가능합니다.';
                }
                window.sjTemplateLoader.showToast(errorMessage, 'error');
            }
        } catch (error) {
            console.error('계정 비활성화 오류:', error);
            window.sjTemplateLoader.showToast('계정 비활성화 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // 퇴사일 입력 모달 표시
    showResignDateModal() {
        return new Promise((resolve) => {
            // 오늘 날짜를 기본값으로 설정 (YYYY-MM-DD 형식)
            const today = new Date().toISOString().split('T')[0];
            
            // 기존 모달이 있으면 제거
            const existingModal = document.getElementById('resignDateModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // 퇴사일 입력 모달 HTML 생성
            const modalHTML = `
                <div class="modal fade" id="resignDateModal" tabindex="-1" data-bs-backdrop="static">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">퇴사일 지정</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="resignDateInput" class="form-label">퇴사일을 선택하세요:</label>
                                    <input type="date" class="form-control" id="resignDateInput" value="${today}" required>
                                    <div class="form-text">해당 직원의 퇴사일을 지정합니다.</div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                                <button type="button" class="btn btn-warning" id="confirmDeactivateBtn">비활성화</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 모달 HTML을 document에 추가
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Bootstrap 모달 인스턴스 생성
            const modalElement = document.getElementById('resignDateModal');
            const modal = new bootstrap.Modal(modalElement);
            
            // 확인 버튼 클릭 이벤트
            document.getElementById('confirmDeactivateBtn').addEventListener('click', () => {
                const resignDate = document.getElementById('resignDateInput').value;
                if (!resignDate) {
                    window.sjTemplateLoader.showToast('퇴사일을 선택해주세요.', 'error');
                    return;
                }
                modal.hide();
                resolve(resignDate);
            });
            
            // 모달이 닫힐 때 (취소 버튼 또는 X 버튼)
            modalElement.addEventListener('hidden.bs.modal', () => {
                modalElement.remove();
                resolve(null); // 취소된 경우
            }, { once: true });
            
            // 모달 표시
            modal.show();
        });
    }

    // 재활성화 메서드 추가
    async activateEmployee(email) {
        if (!confirm('해당 직원을 재활성화하시겠습니까?')) return;
        
        try {
            const response = await fetch(`/api/staff/employees/${encodeURIComponent(email)}/activate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    notes: '모달에서 관리자에 의한 계정 재활성화'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.sjTemplateLoader.showToast('계정이 재활성화되었습니다.', 'success');
                // 모달 닫기
                bootstrap.Modal.getInstance(document.getElementById('employeeDetailModal')).hide();
                // 목록 새로고침
                if (this.employeeManager.loadEmployees) {
                    this.employeeManager.loadEmployees();
                }
            } else {
                // 403 에러인 경우 권한 관련 메시지로 변경
                let errorMessage = result.message || '계정 재활성화에 실패했습니다.';
                if (response.status === 403) {
                    errorMessage = '계정 재활성화 권한이 없습니다. 최고관리자만 가능합니다.';
                }
                window.sjTemplateLoader.showToast(errorMessage, 'error');
            }
        } catch (error) {
            console.error('계정 재활성화 오류:', error);
            window.sjTemplateLoader.showToast('계정 재활성화 중 오류가 발생했습니다.', 'error');
        }
    }

    async showEmployeeDetail(email) {
		try {
			// 부서 목록 먼저 로드
			await this.loadDepartments();
			
			// 현재 사용자 정보 로드 (권한 체크용)
			try {
				const userResponse = await fetch('/api/auth/me', {
					credentials: 'include'
				});
				if (userResponse.ok) {
					const userResult = await userResponse.json();
					if (userResult.success && userResult.data) {
						this.currentUser = userResult.data;
					}
				}
			} catch (error) {
				console.error('현재 사용자 정보 로드 오류:', error);
			}
			
			// 그 다음 직원 상세 정보 로드
			const response = await fetch(`/api/staff/employees/${encodeURIComponent(email)}`, {
				credentials: 'include'
			});
			
			const result = await response.json();
			
			if (result.success) {
				this.renderEmployeeModal(result.data);
			} else {
				this.employeeManager.showError(result.message || '직원 정보를 불러올 수 없습니다.');
			}
		} catch (error) {
			console.error('직원 상세 정보 로드 오류:', error);
			this.employeeManager.showError('직원 정보를 불러오는 중 오류가 발생했습니다.');
		}
	}
   
    renderEmployeeModal(employee) {
        // 모달이 이미 존재하면 제거
        const existingModal = document.getElementById('employeeDetailModal');
        if (existingModal) {
            existingModal.remove();
        }

        const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);
        
        // 날짜를 YYYY-MM-DD 형식으로 변환 (date input용)
        const formatDateForInput = (dateValue) => {
            if (!dateValue) return '';
            try {
                // ISO 8601 형식 (2023-03-31T15:00:00.000Z) 또는 YYYY-MM-DD 형식 처리
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return '';
                // YYYY-MM-DD 형식으로 변환
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            } catch (error) {
                console.error('날짜 형식 변환 오류:', error);
                return '';
            }
        };
        const statusBadge = this.employeeManager.getStatusBadge(employee.is_active ? 'active' : 'pending');
        const roleBadge = this.employeeManager.getRoleBadge(employee.role);
		
		const departmentOptions = this.generateDepartmentOptions(employee.department?.id);
		
        const workTypeName = this.getWorkTypeName(employee.work_type);
        const workScheduleName = this.getWorkScheduleName(employee.work_schedule);

        const modalHTML = `
            <div class="modal fade" id="employeeDetailModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalTitle">
                                <small class="d-block mt-1">${employee.name} (${employee.email})</small>
                            </h5>
                            <button type="button" class="btn-close-custom" data-bs-dismiss="modal">×</button>
                        </div>
                        
                        <!-- 데스크톱용 모달 바디 -->
                        <div class="modal-body desktop-modal">
                            <div class="form-grid">
                                <!-- 기본 정보 -->
                                <label class="col-form-label">이름:</label>
                                <input type="text" class="form-control" id="name" name="name" value="${val(employee.name)}">
                                
                                <label class="col-form-label">이메일:</label>
                                <input type="email" class="form-control" id="email" name="email" value="${val(employee.email)}" readonly>
                                
                                <label class="col-form-label">연락처:</label>
                                <input type="tel" class="form-control" id="phone" name="phone" value="${val(employee.phone)}">
                                
                                <label class="col-form-label">사번:</label>
                                <input type="text" class="form-control" id="employee_id" name="employee_id" value="${val(employee.employee_id)}">
                                
                                <!-- 회사 정보 -->
                                <label class="col-form-label">부서:</label>
								<select id="department_id" name="department_id" class="form-control">
									${departmentOptions}
								</select>
                                
                                <label class="col-form-label">직급:</label>
                                <input type="text" class="form-control" id="position" name="position" value="${val(employee.position)}">
                                
                                <label class="col-form-label">입사일:</label>
                                <input type="date" class="form-control" id="hire_date" name="hire_date" value="${formatDateForInput(employee.hire_date)}">
                                
                                <label class="col-form-label">권한:</label>
                                <select id="role" name="role" class="form-control">
									<option value="SUPER_ADMIN" ${employee.role === 'SUPER_ADMIN' ? 'selected' : ''}>최고관리자</option>
									<option value="DEPT_MANAGER" ${employee.role === 'DEPT_MANAGER' ? 'selected' : ''}>부서장</option>
									<option value="SYSTEM_ADMIN" ${employee.role === 'SYSTEM_ADMIN' ? 'selected' : ''}>시스템관리자</option>
									<option value="EMPLOYEE" ${employee.role === 'EMPLOYEE' ? 'selected' : ''}>직원</option>
								</select>
                                
                                <!-- 근무 정보 -->
                                <label class="col-form-label">근무형태:</label>
                                <select id="work_type" name="work_type" class="form-control">
                                    <option value="">선택</option>
                                    <option value="FULL_TIME" ${employee.work_type === 'FULL_TIME' ? 'selected' : ''}>정규직</option>
                                    <option value="PART_TIME" ${employee.work_type === 'PART_TIME' ? 'selected' : ''}>파트타임</option>
                                    <option value="CONTRACT" ${employee.work_type === 'CONTRACT' ? 'selected' : ''}>계약직</option>
                                </select>
                                
                                <label class="col-form-label">근무일정:</label>
                                <select id="work_schedule" name="work_schedule" class="form-control">
                                    <option value="">선택</option>
                                    <option value="STANDARD" ${employee.work_schedule === 'STANDARD' ? 'selected' : ''}>표준근무</option>
                                    <option value="4_DAY" ${employee.work_schedule === '4_DAY' ? 'selected' : ''}>4일제</option>
                                    <option value="FLEXIBLE" ${employee.work_schedule === 'FLEXIBLE' ? 'selected' : ''}>탄력근무</option>
                                </select>
                                
                                <!-- 계정 상태 -->
                                <label class="col-form-label">계정상태:</label>
                                <select id="is_active" name="is_active" class="form-control">
                                    <option value="1" ${employee.is_active ? 'selected' : ''}>활성</option>
                                    <option value="0" ${!employee.is_active ? 'selected' : ''}>대기중</option>
                                </select>
                                
                                <label class="col-form-label">가입일:</label>
                                <input type="text" class="form-control" id="created_at" name="created_at" value="${this.formatDateTime(employee.created_at)}" readonly>
                                
                                <label class="col-form-label">퇴사일:</label>
                                <input type="text" class="form-control" id="resign_date" name="resign_date" value="${employee.resign_date ? employee.resign_date : '퇴사하지 않음'}" readonly>
                                
                                <!-- 활동 정보 -->
                                <div class="full-width">
                                    <label class="col-form-label">마지막 로그인:</label>
                                    <input type="text" class="form-control" id="last_login_at" name="last_login_at" value="${employee.last_login_at ? this.formatDateTime(employee.last_login_at) : '로그인 기록 없음'}" readonly>
                                </div>
                                
                                <div class="full-width">
                                    <label class="col-form-label">최종 수정일:</label>
                                    <input type="text" class="form-control" id="updated_at" name="updated_at" value="${this.formatDateTime(employee.updated_at)}" readonly>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 모바일용 모달 바디 -->
                        <div class="modal-body mobile-modal">
                            <div class="mobile-form-container">
                                <!-- 기본 정보 -->
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">이름</label>
                                    <input type="text" class="form-control mobile-input" id="name_mobile" name="name_mobile" value="${val(employee.name)}">
                                </div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">이메일</label>
                                    <input type="email" class="form-control mobile-input" id="email_mobile" name="email_mobile" value="${val(employee.email)}" readonly>
                                </div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">연락처</label>
                                    <input type="tel" class="form-control mobile-input" id="phone_mobile" name="phone_mobile" value="${val(employee.phone)}">
                                </div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">사번</label>
                                    <input type="text" class="form-control mobile-input" id="employee_id_mobile" name="employee_id_mobile" value="${val(employee.employee_id)}">
                                </div>
                                
                                <!-- 회사 정보 -->
                                <div class="mobile-field-group">
									<label class="mobile-field-label">부서</label>
									<select id="department_id_mobile" name="department_id_mobile" class="form-control mobile-input">
										${departmentOptions}
									</select>
								</div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">직급</label>
                                    <input type="text" class="form-control mobile-input" id="position_mobile" name="position_mobile" value="${val(employee.position)}">
                                </div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">입사일</label>
                                    <input type="date" class="form-control mobile-input" id="hire_date_mobile" name="hire_date_mobile" value="${formatDateForInput(employee.hire_date)}">
                                </div>
                                
                                <div class="mobile-field-group">
									<label class="mobile-field-label">권한</label>
									<select id="role_mobile" name="role_mobile" class="form-control mobile-input">
										<option value="SUPER_ADMIN" ${employee.role === 'SUPER_ADMIN' ? 'selected' : ''}>최고관리자</option>
										<option value="DEPT_MANAGER" ${employee.role === 'DEPT_MANAGER' ? 'selected' : ''}>부서장</option>
										<option value="SYSTEM_ADMIN" ${employee.role === 'SYSTEM_ADMIN' ? 'selected' : ''}>시스템관리자</option>
										<option value="EMPLOYEE" ${employee.role === 'EMPLOYEE' ? 'selected' : ''}>직원</option>
									</select>
								</div>

								<div class="mobile-field-group">
									<label class="mobile-field-label">근무형태</label>
									<select id="work_type_mobile" name="work_type_mobile" class="form-control mobile-input">
										<option value="">선택</option>
										<option value="FULL_TIME" ${employee.work_type === 'FULL_TIME' ? 'selected' : ''}>정규직</option>
										<option value="PART_TIME" ${employee.work_type === 'PART_TIME' ? 'selected' : ''}>파트타임</option>
										<option value="CONTRACT" ${employee.work_type === 'CONTRACT' ? 'selected' : ''}>계약직</option>
									</select>
								</div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">근무일정</label>
                                    <select id="work_schedule_mobile" name="work_schedule_mobile" class="form-control mobile-input">
                                        <option value="">선택</option>
                                        <option value="STANDARD" ${employee.work_schedule === 'STANDARD' ? 'selected' : ''}>표준근무</option>
                                        <option value="4_DAY" ${employee.work_schedule === '4_DAY' ? 'selected' : ''}>4일제</option>
                                        <option value="FLEXIBLE" ${employee.work_schedule === 'FLEXIBLE' ? 'selected' : ''}>탄력근무</option>
                                    </select>
                                </div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">계정상태</label>
                                    <select id="is_active_mobile" name="is_active_mobile" class="form-control mobile-input">
                                        <option value="1" ${employee.is_active ? 'selected' : ''}>활성</option>
                                        <option value="0" ${!employee.is_active ? 'selected' : ''}>대기중</option>
                                    </select>
                                </div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">가입일</label>
                                    <input type="text" class="form-control mobile-input" id="created_at_mobile" name="created_at_mobile" value="${this.formatDateTime(employee.created_at)}" readonly>
                                </div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">퇴사일</label>
                                    <input type="text" class="form-control mobile-input" id="resign_date_mobile" name="resign_date_mobile" value="${employee.resign_date ? employee.resign_date : '퇴사하지 않음'}" readonly>
                                </div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">마지막 로그인</label>
                                    <input type="text" class="form-control mobile-input" id="last_login_at_mobile" name="last_login_at_mobile" value="${employee.last_login_at ? this.formatDateTime(employee.last_login_at) : '로그인 기록 없음'}" readonly>
                                </div>
                                
                                <div class="mobile-field-group">
                                    <label class="mobile-field-label">최종 수정일</label>
                                    <input type="text" class="form-control mobile-input" id="updated_at_mobile" name="updated_at_mobile" value="${this.formatDateTime(employee.updated_at)}" readonly>
                                </div>
                            </div>
                        </div>
                        
                       <div class="modal-footer">
							<button type="button" class="btn btn-primary" onclick="employeeModal.saveEmployeeChanges('${employee.email}')">
								<i class="fas fa-save"></i> 수정
							</button>
							
							${employee.is_active === 0 ? `
								<!-- 승인대기 상태: 승인/거절 버튼 -->
								<button type="button" class="btn btn-success" onclick="employeeManager.approveEmployee('${employee.email}'); bootstrap.Modal.getInstance(document.getElementById('employeeDetailModal')).hide();">
									<i class="fas fa-check"></i> 승인
								</button>
								<button type="button" class="btn btn-danger" onclick="employeeManager.rejectEmployee('${employee.email}'); bootstrap.Modal.getInstance(document.getElementById('employeeDetailModal')).hide();">
									<i class="fas fa-times"></i> 거절
								</button>
							` : employee.is_active === 1 ? `
								<!-- 활성 상태: 비활성화 버튼 -->
								<button type="button" class="btn btn-warning" onclick="employeeModal.deactivateEmployee('${employee.email}')">
									<i class="fas fa-ban"></i> 비활성화
								</button>
							` : employee.is_active === 2 ? `
								<!-- 비활성 상태: 재활성화 버튼 -->
								<button type="button" class="btn btn-success" onclick="employeeModal.activateEmployee('${employee.email}')">
									<i class="fas fa-check-circle"></i> 재활성화
								</button>
							` : ''}
						</div>
                    </div>
                </div>
            </div>
        `;

        // 모달 HTML을 document에 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Bootstrap 모달 표시
        const modal = new bootstrap.Modal(document.getElementById('employeeDetailModal'));
        modal.show();

		// 여기에 추가
		setTimeout(() => {
			setupPhoneInputs();
		}, 100)
        // 모달이 닫힐 때 DOM에서 제거
        document.getElementById('employeeDetailModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('employeeDetailModal').remove();
        });
    }

    // 직원 정보 저장 메서드 추가
    async saveEmployeeChanges(email) {
        try {
            // 현재 화면 크기에 따라 적절한 필드 선택
            const isMobile = window.innerWidth <= 768;
            const suffix = isMobile ? '_mobile' : '';

            // 폼 데이터 수집
            const formData = {
                name: document.getElementById(`name${suffix}`).value,
                email: document.getElementById(`email${suffix}`).value,
                phone: document.getElementById(`phone${suffix}`).value,
                employee_id: document.getElementById(`employee_id${suffix}`).value,
                department_id: parseInt(document.getElementById(`department_id${suffix}`).value) || null, // 변경된 부분
                position: document.getElementById(`position${suffix}`).value,
                hire_date: document.getElementById(`hire_date${suffix}`).value,
                role: document.getElementById(`role${suffix}`).value,
                work_type: document.getElementById(`work_type${suffix}`).value,
                work_schedule: document.getElementById(`work_schedule${suffix}`).value,
                is_active: parseInt(document.getElementById(`is_active${suffix}`).value)
            };

            // API 요청
            const response = await fetch(`/api/staff/employees/${encodeURIComponent(email)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                window.sjTemplateLoader.showToast('직원 정보가 성공적으로 수정되었습니다.', 'success');
                // 모달 닫기
                //bootstrap.Modal.getInstance(document.getElementById('employeeDetailModal')).hide();
                // 목록 새로고침
                if (this.employeeManager.loadEmployees) {
                    this.employeeManager.loadEmployees();
                }
            } else {
                window.sjTemplateLoader.showToast(result.message || '직원 정보 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('직원 정보 저장 오류:', error);
            window.sjTemplateLoader.showToast('직원 정보를 저장하는 중 오류가 발생했습니다.', 'error');
        }
    }

    getWorkTypeName(workType) {
        const workTypes = {
            'FULL_TIME': '정규직',
            'PART_TIME': '파트타임',
            'CONTRACT': '계약직'
        };
        return workTypes[workType] || workType || '-';
    }

    getWorkScheduleName(workSchedule) {
        const workSchedules = {
            '4_DAY': '4일제',
            'FLEXIBLE': '탄력근무',
            'STANDARD': '표준근무'
        };
        return workSchedules[workSchedule] || workSchedule || '-';
    }

    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
// 전화번호 입력 필드 자동 형식 설정
	function setupPhoneInputs() {
	  const phoneInputs = document.querySelectorAll('input[type="tel"], input[data-phone], .phone-input,phone');
	  
	  phoneInputs.forEach(input => {
		input.addEventListener('input', (e) => {
		  window.sjTemplateLoader.formatPhoneNumber(e.target);
		});
		
		input.addEventListener('blur', (e) => {
		  window.sjTemplateLoader.formatPhoneNumber(e.target);
		});
	  });
	}
	
	
// 모듈로 내보내기 (ES6 모듈 방식)
// export default EmployeeModal;