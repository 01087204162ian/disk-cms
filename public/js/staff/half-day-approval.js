/**
 * ================================================================
 * 반차 승인 관리 JavaScript
 * ================================================================
 */

class HalfDayApprovalManager {
    constructor() {
        this.pendingHalfDays = [];
        this.currentApprovalId = null;
        this.init();
    }
    
    init() {
        this.initDOMElements();
        this.attachEventListeners();
        this.loadPendingHalfDays();
    }
    
    initDOMElements() {
        this.container = document.getElementById('pendingHalfDaysContainer');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.approvalModal = new bootstrap.Modal(document.getElementById('approvalModal'));
        this.approvalModalTitle = document.getElementById('approvalModalTitle');
        this.approvalModalBody = document.getElementById('approvalModalBody');
        this.rejectionReasonDiv = document.getElementById('rejectionReasonDiv');
        this.rejectionReason = document.getElementById('rejectionReason');
        this.approveBtn = document.getElementById('approveBtn');
        this.rejectBtn = document.getElementById('rejectBtn');
    }
    
    attachEventListeners() {
        this.refreshBtn.addEventListener('click', () => this.loadPendingHalfDays());
        this.approveBtn.addEventListener('click', () => this.approveHalfDay());
        this.rejectBtn.addEventListener('click', () => this.showRejectionReason());
    }
    
    async loadPendingHalfDays() {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/staff/work-schedules/pending-half-days', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('반차 승인 대기 목록을 불러오는데 실패했습니다.');
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.pendingHalfDays = result.data || [];
                this.renderPendingHalfDays();
            } else {
                throw new Error(result.message || '반차 승인 대기 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('반차 승인 대기 목록 조회 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    renderPendingHalfDays() {
        if (this.pendingHalfDays.length === 0) {
            this.container.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    승인 대기 중인 반차 신청이 없습니다.
                </div>
            `;
            return;
        }
        
        this.container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 15%;">신청자</th>
                            <th style="width: 15%;">날짜</th>
                            <th style="width: 15%;">반차 타입</th>
                            <th style="width: 30%;">사유</th>
                            <th style="width: 15%;">신청일</th>
                            <th style="width: 10%;">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.pendingHalfDays.map(halfDay => {
                            const date = new Date(halfDay.date);
                            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                            const dayOfWeek = dayNames[date.getDay()];
                            const dateStr = `${halfDay.date} (${dayOfWeek})`;
                            
                            return `
                                <tr>
                                    <td>${halfDay.user_name}</td>
                                    <td>${dateStr}</td>
                                    <td>
                                        <span class="badge ${halfDay.leave_type === 'HALF_AM' ? 'bg-info' : 'bg-warning'}">
                                            ${halfDay.leave_type_name}
                                        </span>
                                    </td>
                                    <td>${halfDay.reason || '(사유 없음)'}</td>
                                    <td class="small text-muted">${this.formatDateTime(halfDay.requested_at)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="halfDayApprovalManager.openApprovalModal(${halfDay.id})">
                                            <i class="fas fa-check"></i> 처리
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    openApprovalModal(halfDayId) {
        const halfDay = this.pendingHalfDays.find(h => h.id === halfDayId);
        if (!halfDay) {
            this.showError('반차 신청을 찾을 수 없습니다.');
            return;
        }
        
        this.currentApprovalId = halfDayId;
        
        const date = new Date(halfDay.date);
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayOfWeek = dayNames[date.getDay()];
        const dateStr = `${halfDay.date} (${dayOfWeek})`;
        
        this.approvalModalTitle.textContent = '반차 승인/거부';
        this.approvalModalBody.innerHTML = `
            <div class="mb-3">
                <strong>신청자:</strong> ${halfDay.user_name}
            </div>
            <div class="mb-3">
                <strong>날짜:</strong> ${dateStr}
            </div>
            <div class="mb-3">
                <strong>반차 타입:</strong> 
                <span class="badge ${halfDay.leave_type === 'HALF_AM' ? 'bg-info' : 'bg-warning'}">
                    ${halfDay.leave_type_name}
                </span>
            </div>
            <div class="mb-3">
                <strong>사유:</strong> ${halfDay.reason || '(사유 없음)'}
            </div>
        `;
        
        this.rejectionReasonDiv.style.display = 'none';
        this.rejectionReason.value = '';
        this.approveBtn.style.display = 'inline-block';
        this.rejectBtn.style.display = 'inline-block';
        
        this.approvalModal.show();
    }
    
    showRejectionReason() {
        this.rejectionReasonDiv.style.display = 'block';
        this.approveBtn.style.display = 'none';
        this.rejectBtn.textContent = '거부 확인';
        this.rejectBtn.onclick = () => this.rejectHalfDay();
    }
    
    async approveHalfDay() {
        if (!this.currentApprovalId) return;
        
        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/staff/work-schedules/approve-half-day/${this.currentApprovalId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'approve'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('반차 신청이 승인되었습니다.');
                this.approvalModal.hide();
                await this.loadPendingHalfDays();
            } else {
                throw new Error(result.message || '반차 승인에 실패했습니다.');
            }
        } catch (error) {
            console.error('반차 승인 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async rejectHalfDay() {
        if (!this.currentApprovalId) return;
        
        const reason = this.rejectionReason.value.trim();
        if (!reason) {
            alert('거부 사유를 입력해주세요.');
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/staff/work-schedules/approve-half-day/${this.currentApprovalId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'reject',
                    rejection_reason: reason
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('반차 신청이 거부되었습니다.');
                this.approvalModal.hide();
                await this.loadPendingHalfDays();
            } else {
                throw new Error(result.message || '반차 거부에 실패했습니다.');
            }
        } catch (error) {
            console.error('반차 거부 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return '-';
        const date = new Date(dateTimeStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    
    showLoading(show) {
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
    
    showError(message) {
        if (window.sjTemplateLoader) {
            window.sjTemplateLoader.showToast(message, 'error');
        } else {
            alert('오류: ' + message);
        }
    }
}

