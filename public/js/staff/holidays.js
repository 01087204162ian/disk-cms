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
        this.tableBody2025 = document.getElementById('holidays_table_body_2025');
        this.tableBody2026 = document.getElementById('holidays_table_body_2026');
        this.tableBody2027 = document.getElementById('holidays_table_body_2027');
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
            
            // 2025, 2026, 2027년 3년치 데이터를 한번에 조회
            const params = new URLSearchParams();
            params.append('startDate', '2025-01-01');
            params.append('endDate', '2027-12-31');
            
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
        // 연도별로 공휴일 분류
        const holidays2025 = this.holidays.filter(h => h.year === 2025).sort((a, b) => new Date(a.date) - new Date(b.date));
        const holidays2026 = this.holidays.filter(h => h.year === 2026).sort((a, b) => new Date(a.date) - new Date(b.date));
        const holidays2027 = this.holidays.filter(h => h.year === 2027).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // 각 연도별 테이블 렌더링
        this.renderYearTable(2025, holidays2025, this.tableBody2025);
        this.renderYearTable(2026, holidays2026, this.tableBody2026);
        this.renderYearTable(2027, holidays2027, this.tableBody2027);
    }
    
    renderYearTable(year, holidays, tableBody) {
        if (!tableBody) return;
        
        if (holidays.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">공휴일이 없습니다.</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = holidays.map(holiday => {
            const date = new Date(holiday.date);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isSubstitute = holiday.name.includes('대체공휴일');
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            
            let dateBadges = '';
            if (isWeekend) dateBadges += '<span class="badge bg-warning text-dark ms-1" style="font-size: 0.7rem;">주말</span>';
            if (isSubstitute) dateBadges += '<span class="badge bg-info ms-1" style="font-size: 0.7rem;">대체</span>';
            if (!holiday.isActive) dateBadges += '<span class="badge bg-secondary ms-1" style="font-size: 0.7rem;">비활성</span>';
            
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${month}/${day} (${dayNames[dayOfWeek]})`;
            
            return `
                <tr>
                    <td style="font-size: 0.85rem;">
                        ${dateStr}
                        ${dateBadges}
                    </td>
                    <td style="font-size: 0.85rem;">${holiday.name}</td>
                    <td>
                        <button class="btn btn-xs btn-outline-primary me-1" onclick="holidayManager.editHoliday(${holiday.id})" title="수정" style="padding: 0.15rem 0.3rem; font-size: 0.75rem;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-xs btn-outline-danger" onclick="holidayManager.deleteHoliday(${holiday.id})" title="삭제" style="padding: 0.15rem 0.3rem; font-size: 0.75rem;">
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
        
        // 연도별로 공휴일 분류
        const holidays2025 = this.holidays.filter(h => h.year === 2025).sort((a, b) => new Date(a.date) - new Date(b.date));
        const holidays2026 = this.holidays.filter(h => h.year === 2026).sort((a, b) => new Date(a.date) - new Date(b.date));
        const holidays2027 = this.holidays.filter(h => h.year === 2027).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let html = '';
        
        // 2025년
        html += '<div class="mb-4"><h5 class="text-primary mb-3"><i class="fas fa-calendar me-2"></i>2025년</h5>';
        html += this.renderYearMobileCards(holidays2025);
        html += '</div>';
        
        // 2026년
        html += '<div class="mb-4"><h5 class="text-success mb-3"><i class="fas fa-calendar me-2"></i>2026년</h5>';
        html += this.renderYearMobileCards(holidays2026);
        html += '</div>';
        
        // 2027년
        html += '<div class="mb-4"><h5 class="text-info mb-3"><i class="fas fa-calendar me-2"></i>2027년</h5>';
        html += this.renderYearMobileCards(holidays2027);
        html += '</div>';
        
        this.mobileCards.innerHTML = html;
    }
    
    renderYearMobileCards(holidays) {
        if (holidays.length === 0) {
            return '<div class="text-center py-2 text-muted">공휴일이 없습니다.</div>';
        }
        
        return holidays.map(holiday => {
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
                <div class="mobile-card mb-2">
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
            const count2025 = this.holidays.filter(h => h.year === 2025).length;
            const count2026 = this.holidays.filter(h => h.year === 2026).length;
            const count2027 = this.holidays.filter(h => h.year === 2027).length;
            this.paginationInfo.textContent = `총 ${this.holidays.length}개 (2025: ${count2025}개, 2026: ${count2026}개, 2027: ${count2027}개)`;
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
        // 3년 모두에 대해 대체 공휴일 생성
        if (!confirm('2025, 2026, 2027년 주말 공휴일의 대체 공휴일을 자동 생성하시겠습니까?\n(1년 이내 날짜만 생성됩니다)')) {
            return;
        }
        
        try {
            this.showLoading(true);
            let totalGenerated = 0;
            
            // 각 연도별로 대체 공휴일 생성
            for (const year of [2025, 2026, 2027]) {
                try {
                    const response = await fetch('/api/staff/holidays/generate-substitute', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ year: year })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        totalGenerated += result.data.generated.length;
                    }
                } catch (error) {
                    console.error(`${year}년 대체 공휴일 생성 오류:`, error);
                }
            }
            
            this.showSuccess(`총 ${totalGenerated}개의 대체 공휴일이 생성되었습니다.`);
            this.loadHolidays();
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
        // 3년 모두 검증
        try {
            this.showLoading(true);
            
            const validatePromises = [2025, 2026, 2027].map(year => 
                fetch(`/api/staff/holidays/validate?year=${year}`, {
                    credentials: 'include'
                }).then(res => res.json())
            );
            
            const results = await Promise.all(validatePromises);
            
            // 모든 연도의 검증 결과를 통합하여 표시
            this.showValidateResultsAll(results);
        } catch (error) {
            console.error('공휴일 검증 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    showValidateResultsAll(results) {
        let html = '<div class="mb-3"><h6>검증 연도: 2025년, 2026년, 2027년</h6></div>';
        
        let allValid = true;
        let totalErrors = [];
        let totalWarnings = [];
        
        results.forEach((result, index) => {
            const year = 2025 + index;
            if (result.success && result.data) {
                if (!result.data.isValid) {
                    allValid = false;
                    if (result.data.errors) totalErrors.push(...result.data.errors.map(e => ({...e, year})));
                    if (result.data.warnings) totalWarnings.push(...result.data.warnings.map(w => ({...w, year})));
                }
            }
        });
        
        if (allValid && totalErrors.length === 0 && totalWarnings.length === 0) {
            html += `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    모든 연도의 공휴일 데이터가 정상입니다.
                </div>
            `;
        } else {
            if (totalErrors.length > 0) {
                html += `
                    <div class="alert alert-danger">
                        <h6><i class="fas fa-exclamation-circle me-2"></i>오류 (${totalErrors.length}개)</h6>
                        <ul class="mb-0">
                            ${totalErrors.map(error => `
                                <li>
                                    <strong>${error.year}년 ${error.date || error.name}</strong>: ${error.issue}
                                    ${error.expected ? ` (예상: ${error.expected})` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (totalWarnings.length > 0) {
                html += `
                    <div class="alert alert-warning">
                        <h6><i class="fas fa-exclamation-triangle me-2"></i>경고 (${totalWarnings.length}개)</h6>
                        <ul class="mb-0">
                            ${totalWarnings.map(warning => `
                                <li>
                                    <strong>${warning.year}년 ${warning.date}</strong> - ${warning.name}: ${warning.issue}
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

