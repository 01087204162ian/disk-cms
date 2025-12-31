// ==============================
// js/staff/work-schedule-manager.js - 근무 스케줄 관리 전용 모듈
// ==============================

class WorkScheduleManager {
    constructor(employeeManager) {
        this.employeeManager = employeeManager;
        this.employees = [];
    }

    // 근무 스케줄 관리 모달 표시
    showWorkScheduleModal() {
        // 모달이 이미 존재하는지 확인
        let modal = document.getElementById('workScheduleManagementModal');
        
        if (!modal) {
            // 모달이 없으면 생성
            this.createModal();
            modal = document.getElementById('workScheduleManagementModal');
        }
        
        // 모달 표시
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // 데이터 로드
        this.loadWorkSchedules();
    }

    // 모달 HTML 생성
    createModal() {
        const modalHTML = `
            <div class="modal fade" id="workScheduleManagementModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-calendar-alt me-2"></i>근무 스케줄 관리
                                <small class="d-block mt-1">직원별 근무 스케줄 조회 및 관리</small>
                            </h5>
                            <button type="button" class="btn-close-custom" data-bs-dismiss="modal">×</button>
                        </div>
                        
                        <div class="modal-body">
                            <div class="card">
                                <div class="card-body">
                                    <div class="row mb-3">
                                        <div class="col-md-4">
                                            <label class="form-label">연도</label>
                                            <select class="form-control form-control-sm" id="scheduleYear">
                                                ${this.generateYearOptions()}
                                            </select>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">월</label>
                                            <select class="form-control form-control-sm" id="scheduleMonth">
                                                ${this.generateMonthOptions()}
                                            </select>
                                        </div>
                                        <div class="col-md-4 d-flex align-items-end">
                                            <button type="button" class="btn btn-primary btn-sm w-100" id="loadScheduleBtn">
                                                <i class="fas fa-search"></i> 조회
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="table-responsive">
                                        <table class="table table-bordered table-hover table-sm">
                                            <thead class="thead-light">
                                                <tr>
                                                    <th>직원명</th>
                                                    <th>부서</th>
                                                    <th>근무일수</th>
                                                    <th>상태</th>
                                                    <th>관리</th>
                                                </tr>
                                            </thead>
                                            <tbody id="workScheduleTableBody">
                                                <tr>
                                                    <td colspan="5" class="text-center py-4">
                                                        조회 버튼을 클릭하여 근무 스케줄을 불러오세요.
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 모달을 body에 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 이벤트 리스너 등록
        document.getElementById('loadScheduleBtn').addEventListener('click', () => this.loadWorkSchedules());
    }

    // 연도 옵션 생성
    generateYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = '';
        for (let i = currentYear - 1; i <= currentYear + 1; i++) {
            const selected = i === currentYear ? 'selected' : '';
            options += `<option value="${i}" ${selected}>${i}년</option>`;
        }
        return options;
    }

    // 월 옵션 생성
    generateMonthOptions() {
        const currentMonth = new Date().getMonth() + 1;
        let options = '';
        for (let i = 1; i <= 12; i++) {
            const selected = i === currentMonth ? 'selected' : '';
            options += `<option value="${i}" ${selected}>${i}월</option>`;
        }
        return options;
    }

    // 근무 스케줄 로드
    async loadWorkSchedules() {
        try {
            const year = document.getElementById('scheduleYear').value;
            const month = document.getElementById('scheduleMonth').value;
            const tableBody = document.getElementById('workScheduleTableBody');
            
            // 로딩 표시
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fas fa-spinner fa-spin"></i> 데이터를 불러오는 중...
                    </td>
                </tr>
            `;
            
            // API 호출 (실제 API 경로에 맞게 수정 필요)
            const response = await fetch(`/api/staff/work-schedules/team/${year}/${month}`);
            
            if (!response.ok) {
                throw new Error('근무 스케줄을 불러오는데 실패했습니다.');
            }
            
            const data = await response.json();
            
            if (data.success && data.data) {
                this.renderWorkSchedules(data.data);
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4 text-muted">
                            데이터가 없습니다.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('근무 스케줄 로드 오류:', error);
            const tableBody = document.getElementById('workScheduleTableBody');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-danger">
                        <i class="fas fa-exclamation-triangle"></i> 오류가 발생했습니다: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    // 근무 스케줄 렌더링
    renderWorkSchedules(schedules) {
        const tableBody = document.getElementById('workScheduleTableBody');
        
        if (!schedules || schedules.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        데이터가 없습니다.
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = schedules.map(schedule => {
            const statusBadge = this.getStatusBadge(schedule.status);
            const workDaysCount = schedule.work_days?.work_days_count || 0;
            
            return `
                <tr>
                    <td>${this.escapeHtml(schedule.employee_name || 'N/A')}</td>
                    <td>${this.escapeHtml(schedule.department_name || 'N/A')}</td>
                    <td>${workDaysCount}일</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="workScheduleManager.viewScheduleDetail(${schedule.user_id}, ${schedule.year}, ${schedule.month})">
                            <i class="fas fa-eye"></i> 상세
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 상태 배지 생성
    getStatusBadge(status) {
        const badges = {
            'PENDING': '<span class="badge bg-warning">대기</span>',
            'APPROVED': '<span class="badge bg-success">승인</span>',
            'REJECTED': '<span class="badge bg-danger">거부</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">미정</span>';
    }

    // 스케줄 상세 보기
    viewScheduleDetail(userId, year, month) {
        // 상세 보기 로직 구현 (필요 시)
        console.log('스케줄 상세 보기:', userId, year, month);
        alert(`직원 ID: ${userId}\n${year}년 ${month}월 스케줄 상세 정보`);
    }

    // HTML 이스케이프
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

