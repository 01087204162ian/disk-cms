// ==============================
// js/staff/work-schedule-manager.js - 근무 일정 관리
// ==============================

class WorkScheduleManager {
    constructor(employeeManager) {
        this.employeeManager = employeeManager;
        this.currentSchedule = null;
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1;
        this.init();
    }

    init() {
        this.createModal();
        console.log('WorkScheduleManager 초기화 완료');
    }

    // 모달 HTML 생성
    createModal() {
        const modalHTML = `
        <div class="modal fade" id="workScheduleModal" tabindex="-1" aria-labelledby="workScheduleModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                       <h5 class="modal-title text-white d-flex align-items-center text-nowrap" id="workScheduleModalLabel">
							<span id="userInfoName">로딩중...</span>님&nbsp;
							<small>(<span id="userInfoEmail">이메일 로딩중...</span>)</small>
							&nbsp;<i class="fas fa-calendar-check ms-2"></i>&nbsp;근무 일정 관리
						</h5>
                        <button type="button" class="btn-close-custom" data-bs-dismiss="modal">×</button>
                    </div>
                    <div class="modal-body">
                        <!-- 현재 월 정보 -->
                        <div class="alert alert-info mb-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">
                                        <i class="fas fa-calendar-alt"></i>
                                        <span id="scheduleMonth">${this.currentYear}년 ${this.currentMonth}월</span> 근무 일정
                                    </h6>
                                    <small class="text-muted">휴무 요일을 선택하세요 (주 4일 근무제)</small>
                                </div>
                                <div class="text-end">
                                    <button type="button" class="btn btn-outline-primary btn-sm" id="prevMonthBtn">
                                        <i class="fas fa-chevron-left"></i> 이전달
                                    </button>
                                    <button type="button" class="btn btn-outline-primary btn-sm" id="nextMonthBtn">
                                        다음달 <i class="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>



                        <!-- 휴무 요일 선택 -->
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="fas fa-user-clock"></i>
                                    휴무 요일 선택
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="d-flex flex-wrap gap-3 justify-content-center">
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="offDay" id="offDay1" value="1">
                                                <label class="form-check-label day-label" for="offDay1">
                                                    <div class="day-card">
                                                        <div class="day-name">월요일</div>
                                                        <div class="day-status">근무 4일</div>
                                                    </div>
                                                </label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="offDay" id="offDay2" value="2">
                                                <label class="form-check-label day-label" for="offDay2">
                                                    <div class="day-card">
                                                        <div class="day-name">화요일</div>
                                                        <div class="day-status">근무 4일</div>
                                                    </div>
                                                </label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="offDay" id="offDay3" value="3">
                                                <label class="form-check-label day-label" for="offDay3">
                                                    <div class="day-card">
                                                        <div class="day-name">수요일</div>
                                                        <div class="day-status">근무 4일</div>
                                                    </div>
                                                </label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="offDay" id="offDay4" value="4">
                                                <label class="form-check-label day-label" for="offDay4">
                                                    <div class="day-card">
                                                        <div class="day-name">목요일</div>
                                                        <div class="day-status">근무 4일</div>
                                                    </div>
                                                </label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="offDay" id="offDay5" value="5">
                                                <label class="form-check-label day-label" for="offDay5">
                                                    <div class="day-card">
                                                        <div class="day-name">금요일</div>
                                                        <div class="day-status">근무 4일</div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                        <div class="mt-3 text-center">
                                            <small class="text-muted">
                                                <i class="fas fa-info-circle"></i>
                                                선택한 요일은 해당 월 전체에 휴무로 적용됩니다
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 공휴일 안내 -->
                        <div id="holidayNotice" class="mt-3" style="display: none;">
                            <div class="alert alert-warning">
                                <h6><i class="fas fa-exclamation-triangle"></i> 공휴일 안내</h6>
                                <div id="holidayList">
                                    <!-- 공휴일 목록이 여기에 표시됩니다 -->
                                </div>
                                <small class="text-muted">공휴일이 있는 주는 4일근무가 해제될 수 있습니다.</small>
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

        <!-- 스타일 추가 -->
        <style>
            .day-card {
                border: 2px solid #e9ecef;
                border-radius: 8px;
                padding: 12px 16px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
                min-width: 90px;
            }
            
            .day-card:hover {
                border-color: #007bff;
                background-color: #f8f9fa;
            }
            
            .form-check-input:checked + .form-check-label .day-card {
                border-color: #dc3545;
                background-color: #dc3545;
                color: white;
            }
            
            .day-name {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            .day-status {
                font-size: 11px;
                opacity: 0.8;
            }
            
            .form-check-input:checked + .form-check-label .day-status {
                color: rgba(255,255,255,0.9);
            }
            
            .form-check-input {
                display: none;
            }
        </style>
        `;

        // 기존 모달이 있으면 제거
        const existingModal = document.getElementById('workScheduleModal');
        if (existingModal) {
            existingModal.remove();
        }

        // body에 모달 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 이벤트 리스너 등록
        this.attachModalEventListeners();
    }

    // 모달 이벤트 리스너 등록
    attachModalEventListeners() {
        // 이전/다음 달 버튼
        document.getElementById('prevMonthBtn').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonthBtn').addEventListener('click', () => this.changeMonth(1));

        // 휴무 요일 선택 - 즉시 저장
        document.querySelectorAll('input[name="offDay"]').forEach(radio => {
            radio.addEventListener('change', () => this.saveOffDaySelection());
        });
    }

    // 근무 일정 모달 표시
    async showWorkScheduleModal() {
        try {
            // 로그인 상태 확인
            if (!window.sjTemplateLoader.isAuthenticated || !window.sjTemplateLoader.user) {
                window.sjTemplateLoader.showToast('로그인이 필요한 기능입니다.');
                return;
            }

            // 현재 월로 초기화
            this.currentYear = new Date().getFullYear();
            this.currentMonth = new Date().getMonth() + 1;
            
            // 모달 표시
            const modal = new bootstrap.Modal(document.getElementById('workScheduleModal'));
            modal.show();

            // 데이터 로드
            await this.loadCurrentSchedule();
            await this.loadHolidays();

        } catch (error) {
            console.error('근무 일정 모달 표시 오류:', error);
            window.sjTemplateLoader.showToast('근무 일정을 불러오는 중 오류가 발생했습니다.');
        }
    }

    // 월 변경
    async changeMonth(direction) {
        this.currentMonth += direction;
        
        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear++;
        } else if (this.currentMonth < 1) {
            this.currentMonth = 12;
            this.currentYear--;
        }

        // 월 정보 업데이트
        document.getElementById('scheduleMonth').textContent = `${this.currentYear}년 ${this.currentMonth}월`;
        
        // 데이터 다시 로드
        await this.loadCurrentSchedule();
        await this.loadHolidays();
    }

    // 현재 일정 로드
    async loadCurrentSchedule() {
        try {
            // 로그인 사용자 확인
            if (!window.sjTemplateLoader.user) {
                window.sjTemplateLoader.showToast('사용자 정보를 확인할 수 없습니다.');
                return;
            }

            const response = await fetch(`/api/staff/my-work-schedule/${this.currentYear}/${this.currentMonth}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.currentSchedule = result.data;
                this.displayCurrentSchedule();
            } else {
                // 기존 일정이 없는 경우
                this.currentSchedule = null;
                this.clearScheduleDisplay();
            }

            // 사용자 정보 업데이트
            this.updateUserInfo();

        } catch (error) {
            console.error('일정 로드 오류:', error);
            this.currentSchedule = null;
            this.clearScheduleDisplay();
        }
    }

    // 현재 일정 표시
    displayCurrentSchedule() {
        if (this.currentSchedule) {
            const workDays = this.currentSchedule.work_days;
            const offDay = this.getOffDay(workDays);
            
            // 휴무 요일 선택
            if (offDay) {
                document.getElementById(`offDay${offDay}`).checked = true;
            }

        } else {
            this.clearScheduleForm();
        }
    }

    // 일정 표시 초기화
    clearScheduleDisplay() {
        this.clearScheduleForm();
    }

    // 폼 초기화
    clearScheduleForm() {
        document.querySelectorAll('input[name="offDay"]').forEach(radio => {
            radio.checked = false;
        });
    }

    // 휴무 요일 계산 (work_days에서 없는 요일 찾기)
    getOffDay(workDays) {
        if (!workDays || !Array.isArray(workDays)) return null;
        
        const allDays = [1, 2, 3, 4, 5]; // 월~금
        return allDays.find(day => !workDays.includes(day));
    }

    // 근무 요일 계산 (휴무 요일 제외)
    getWorkDays(offDay) {
        const allDays = [1, 2, 3, 4, 5]; // 월~금
        return allDays.filter(day => day !== parseInt(offDay));
    }



    // 공휴일 로드
    async loadHolidays() {
        try {
            const response = await fetch(`/api/staff/holidays/${this.currentYear}/${this.currentMonth}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success && result.data.length > 0) {
                this.displayHolidays(result.data);
            } else {
                document.getElementById('holidayNotice').style.display = 'none';
            }

        } catch (error) {
            console.error('공휴일 로드 오류:', error);
            document.getElementById('holidayNotice').style.display = 'none';
        }
    }

    // 사용자 정보 업데이트
    updateUserInfo() {
        if (!window.sjTemplateLoader.user) return;
        
        const user = window.sjTemplateLoader.user;
        
        // 사용자 이름 업데이트
        const nameElement = document.getElementById('userInfoName');
        if (nameElement) {
            nameElement.textContent = user.name || '사용자';
        }
        
        // 사용자 이메일 업데이트
        const emailElement = document.getElementById('userInfoEmail');
        if (emailElement) {
            emailElement.textContent = user.email || '';
        }
    }

    // 공휴일 표시
    displayHolidays(holidays) {
        const holidayNotice = document.getElementById('holidayNotice');
        const holidayList = document.getElementById('holidayList');

        if (holidays.length > 0) {
            const holidayHTML = holidays.map(holiday => {
                const date = new Date(holiday.holiday_date);
                const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                return `<span class="badge bg-warning me-1">${date.getDate()}일(${dayName}) ${holiday.name}</span>`;
            }).join(' ');

            holidayList.innerHTML = holidayHTML;
            holidayNotice.style.display = 'block';
        } else {
            holidayNotice.style.display = 'none';
        }
    }

    // 요일 선택 시 즉시 저장
    async saveOffDaySelection() {
        try {
            const selectedOffDay = document.querySelector('input[name="offDay"]:checked');
            
            if (!selectedOffDay) {
                return;
            }

            const offDay = parseInt(selectedOffDay.value);
            const workDays = this.getWorkDays(offDay);
            
            const requestData = {
                year: this.currentYear,
                month: this.currentMonth,
                work_days: workDays
            };

            const response = await fetch('/api/staff/work-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.success) {
                window.sjTemplateLoader.showToast('근무 일정이 적용되었습니다.', 'success');
                
                // 현재 일정 다시 로드
                await this.loadCurrentSchedule();
                
            } else {
                window.sjTemplateLoader.showToast(result.message || '저장 중 오류가 발생했습니다.');
                // 실패 시 라디오 버튼 해제
                selectedOffDay.checked = false;
            }

        } catch (error) {
            console.error('일정 저장 오류:', error);
            window.sjTemplateLoader.showToast('저장 중 오류가 발생했습니다.');
            // 실패 시 라디오 버튼 해제
            const selectedOffDay = document.querySelector('input[name="offDay"]:checked');
            if (selectedOffDay) {
                selectedOffDay.checked = false;
            }
        }
    }

    // 에러 메시지 표시
    showError(message) {
        if (window.sjTemplateLoader && typeof window.sjTemplateLoader.showError === 'function') {
            window.sjTemplateLoader.showError(message);
        } else {
            alert(message);
        }
    }
}

// 전역 접근을 위한 export
window.WorkScheduleManager = WorkScheduleManager;