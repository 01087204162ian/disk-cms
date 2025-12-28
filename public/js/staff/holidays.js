/**
 * ================================================================
 * 공휴일 관리 JavaScript
 * ================================================================
 */

class HolidayManager {
    constructor() {
        this.holidays = [];
        this.currentYear = new Date().getFullYear();
        this.modal = null;
        this.init();
    }
    
    init() {
        this.initDOMElements();
        this.attachEventListeners();
        this.initYearFilter();
        this.loadHolidays();
    }
    
    initDOMElements() {
        this.yearFilter = document.getElementById('yearFilter');
        this.startDateFilter = document.getElementById('startDateFilter');
        this.endDateFilter = document.getElementById('endDateFilter');
        this.applyFilterBtn = document.getElementById('applyFilterBtn');
        this.addHolidayBtn = document.getElementById('addHolidayBtn');
        this.generateSubstituteBtn = document.getElementById('generateSubstituteBtn');
        this.validateHolidaysBtn = document.getElementById('validateHolidaysBtn');
        this.refreshListBtn = document.getElementById('refreshListBtn');
        this.tableBody = document.getElementById('holidays_table_body');
        this.mobileCards = document.getElementById('holidays_mobile_cards');
        this.paginationInfo = document.getElementById('pagination_info');
        this.holidayModal = new bootstrap.Modal(document.getElementById('holidayModal'));
        this.validateModal = new bootstrap.Modal(document.getElementById('validateModal'));
        this.validateResults = document.getElementById('validateResults');
        this.holidayForm = document.getElementById('holidayForm');
        this.holidayId = document.getElementById('holidayId');
        this.holidayDate = document.getElementById('holidayDate');
        this.holidayName = document.getElementById('holidayName');
        this.holidayYear = document.getElementById('holidayYear');
        this.holidayIsActive = document.getElementById('holidayIsActive');
        this.saveHolidayBtn = document.getElementById('saveHolidayBtn');
        this.holidayModalTitle = document.getElementById('holidayModalTitle');
    }
    
    attachEventListeners() {
        this.applyFilterBtn.addEventListener('click', () => this.loadHolidays());
        this.addHolidayBtn.addEventListener('click', () => this.showAddModal());
        this.generateSubstituteBtn.addEventListener('click', () => this.generateSubstitute());
        this.validateHolidaysBtn.addEventListener('click', () => this.validateHolidays());
        this.refreshListBtn.addEventListener('click', () => this.loadHolidays());
        this.saveHolidayBtn.addEventListener('click', () => this.saveHoliday());
        this.holidayDate.addEventListener('change', () => this.updateYearFromDate());
    }
    
    initYearFilter() {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 2; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}년`;
            if (year === currentYear) {
                option.selected = true;
            }
            this.yearFilter.appendChild(option);
        }
    }
    
    updateYearFromDate() {
        const date = new Date(this.holidayDate.value);
        if (!isNaN(date.getTime())) {
            this.holidayYear.value = date.getFullYear();
        }
    }
    
    async loadHolidays() {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams();
            if (this.yearFilter.value) {
                params.append('year', this.yearFilter.value);
            }
            if (this.startDateFilter.value) {
                params.append('startDate', this.startDateFilter.value);
            }
            if (this.endDateFilter.value) {
                params.append('endDate', this.endDateFilter.value);
            }
            
            const response = await fetch(`/api/staff/holidays?${params.toString()}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('공휴일 목록을 불러오는데 실패했습니다.');
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.holidays = result.data;
                this.renderHolidays();
            } else {
                throw new Error(result.message || '공휴일 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('공휴일 목록 조회 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    renderHolidays() {
        this.renderDesktopTable();
        this.renderMobileCards();
        this.updatePaginationInfo();
    }
    
    renderDesktopTable() {
        if (this.holidays.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">공휴일이 없습니다.</td></tr>';
            return;
        }
        
        this.tableBody.innerHTML = this.holidays.map(holiday => {
            const date = new Date(holiday.date);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isSubstitute = holiday.name.includes('대체공휴일');
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            const statusBadge = holiday.isActive 
                ? '<span class="badge bg-success">활성</span>' 
                : '<span class="badge bg-secondary">비활성</span>';
            
            let dateBadges = '';
            if (isWeekend) dateBadges += '<span class="badge bg-warning text-dark ms-1">주말</span>';
            if (isSubstitute) dateBadges += '<span class="badge bg-info ms-1">대체</span>';
            
            return `
                <tr>
                    <td class="col-date">
                        ${this.formatFullDate(holiday.date)} (${dayNames[dayOfWeek]})
                        ${dateBadges}
                    </td>
                    <td class="col-company-name">${holiday.name}</td>
                    <td class="col-manager">${holiday.year}</td>
                    <td class="col-status">${statusBadge}</td>
                    <td class="col-status">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="holidayManager.editHoliday(${holiday.id})" title="수정">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="holidayManager.deleteHoliday(${holiday.id})" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    renderMobileCards() {
        if (this.holidays.length === 0) {
            this.mobileCards.innerHTML = '<div class="text-center py-4">공휴일이 없습니다.</div>';
            return;
        }
        
        this.mobileCards.innerHTML = this.holidays.map(holiday => {
            const date = new Date(holiday.date);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isSubstitute = holiday.name.includes('대체공휴일');
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            const statusBadge = holiday.isActive 
                ? '<span class="badge bg-success">활성</span>' 
                : '<span class="badge bg-secondary">비활성</span>';
            
            let dateBadges = '';
            if (isWeekend) dateBadges += '<span class="badge bg-warning text-dark ms-1">주말</span>';
            if (isSubstitute) dateBadges += '<span class="badge bg-info ms-1">대체</span>';
            
            return `
                <div class="mobile-card">
                    <div class="mobile-card-header">
                        <div class="d-flex align-items-center">
                            <span class="mobile-card-title">${holiday.name}</span>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    <div class="mobile-card-body">
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">날짜:</span>
                            <span class="mobile-card-value">
                                ${this.formatFullDate(holiday.date)} (${dayNames[dayOfWeek]})
                                ${dateBadges}
                            </span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">연도:</span>
                            <span class="mobile-card-value">${holiday.year}년</span>
                        </div>
                        <div class="mobile-card-row">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="holidayManager.editHoliday(${holiday.id})">
                                <i class="fas fa-edit"></i> 수정
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="holidayManager.deleteHoliday(${holiday.id})">
                                <i class="fas fa-trash"></i> 삭제
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updatePaginationInfo() {
        if (this.paginationInfo) {
            this.paginationInfo.textContent = `총 ${this.holidays.length}개의 공휴일이 있습니다.`;
        }
    }
    
    formatFullDate(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    showAddModal() {
        this.holidayModalTitle.textContent = '공휴일 추가';
        this.holidayForm.reset();
        this.holidayId.value = '';
        this.holidayYear.value = new Date().getFullYear();
        this.holidayIsActive.checked = true;
        this.holidayModal.show();
    }
    
    async editHoliday(id) {
        try {
            const holiday = this.holidays.find(h => h.id === id);
            if (!holiday) {
                throw new Error('공휴일을 찾을 수 없습니다.');
            }
            
            this.holidayModalTitle.textContent = '공휴일 수정';
            this.holidayId.value = holiday.id;
            this.holidayDate.value = holiday.date;
            this.holidayName.value = holiday.name;
            this.holidayYear.value = holiday.year;
            this.holidayIsActive.checked = holiday.isActive;
            
            this.holidayModal.show();
        } catch (error) {
            console.error('공휴일 수정 모달 오류:', error);
            this.showError(error.message);
        }
    }
    
    async saveHoliday() {
        try {
            if (!this.holidayForm.checkValidity()) {
                this.holidayForm.reportValidity();
                return;
            }
            
            const id = this.holidayId.value;
            const date = this.holidayDate.value;
            const name = this.holidayName.value;
            const year = parseInt(this.holidayYear.value);
            
            // 날짜와 연도 일치 확인
            const dateObj = new Date(date);
            if (dateObj.getFullYear() !== year) {
                this.showError('날짜와 연도가 일치하지 않습니다.');
                return;
            }
            
            this.showLoading(true);
            
            let response;
            if (id) {
                // 수정
                response = await fetch(`/api/staff/holidays/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        name,
                        isActive: this.holidayIsActive.checked
                    })
                });
            } else {
                // 추가
                response = await fetch('/api/staff/holidays', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        date,
                        name,
                        year
                    })
                });
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result.message);
                this.holidayModal.hide();
                this.loadHolidays();
            } else {
                throw new Error(result.message || '공휴일 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('공휴일 저장 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async deleteHoliday(id) {
        if (!confirm('공휴일을 삭제(비활성화)하시겠습니까?')) {
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/staff/holidays/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result.message);
                this.loadHolidays();
            } else {
                throw new Error(result.message || '공휴일 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('공휴일 삭제 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async generateSubstitute() {
        const year = this.yearFilter.value || new Date().getFullYear();
        
        if (!confirm(`${year}년 주말 공휴일의 대체 공휴일을 자동 생성하시겠습니까?\n(1년 이내 날짜만 생성됩니다)`)) {
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/staff/holidays/generate-substitute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ year: parseInt(year) })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const count = result.data.generated.length;
                this.showSuccess(`${count}개의 대체 공휴일이 생성되었습니다.`);
                this.loadHolidays();
            } else {
                throw new Error(result.message || '대체 공휴일 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('대체 공휴일 생성 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    showLoading(show) {
        // sj-template-loader의 로딩 오버레이 사용
        if (window.sjTemplateLoader) {
            if (show) {
                window.sjTemplateLoader.showPageLoading();
            } else {
                window.sjTemplateLoader.hidePageLoading();
            }
        }
    }
    
    showSuccess(message) {
        if (window.sjTemplateLoader) {
            window.sjTemplateLoader.showToast(message, 'success');
        } else {
            alert(message);
        }
    }
    
    async validateHolidays() {
        const year = this.yearFilter.value || new Date().getFullYear();
        
        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/staff/holidays/validate?year=${year}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('공휴일 검증에 실패했습니다.');
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showValidateResults(result.data);
            } else {
                throw new Error(result.message || '공휴일 검증에 실패했습니다.');
            }
        } catch (error) {
            console.error('공휴일 검증 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    showValidateResults(data) {
        let html = `
            <div class="mb-3">
                <h6>검증 연도: ${data.year}년</h6>
                <p>총 공휴일 수: ${data.totalHolidays}개</p>
            </div>
        `;
        
        if (data.isValid) {
            html += `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    모든 공휴일 데이터가 정상입니다.
                </div>
            `;
        } else {
            if (data.errors && data.errors.length > 0) {
                html += `
                    <div class="alert alert-danger">
                        <h6><i class="fas fa-exclamation-circle me-2"></i>오류 (${data.errors.length}개)</h6>
                        <ul class="mb-0">
                            ${data.errors.map(error => `
                                <li>
                                    <strong>${error.date || error.name}</strong>: ${error.issue}
                                    ${error.expected ? ` (예상: ${error.expected})` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (data.warnings && data.warnings.length > 0) {
                html += `
                    <div class="alert alert-warning">
                        <h6><i class="fas fa-exclamation-triangle me-2"></i>경고 (${data.warnings.length}개)</h6>
                        <ul class="mb-0">
                            ${data.warnings.map(warning => `
                                <li>
                                    <strong>${warning.date}</strong> - ${warning.name}: ${warning.issue}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
        }
        
        this.validateResults.innerHTML = html;
        this.validateModal.show();
    }
    
    showError(message) {
        if (window.sjTemplateLoader) {
            window.sjTemplateLoader.showToast(message, 'error');
        } else {
            alert('오류: ' + message);
        }
    }
}

