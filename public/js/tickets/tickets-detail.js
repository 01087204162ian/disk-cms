// ==============================
// js/tickets/tickets-detail.js - 티켓 상세 페이지
// ==============================

class TicketDetail {
    constructor() {
        this.ticketId = null;
        this.ticketData = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            // URL에서 ID 가져오기
            const urlParams = new URLSearchParams(window.location.search);
            this.ticketId = urlParams.get('id');

            if (!this.ticketId) {
                this.showError('티켓 ID가 없습니다.');
                return;
            }

            // DOM 요소 참조
            this.initDOMElements();
            
            // 이벤트 리스너 등록
            this.attachEventListeners();
            
            // 사용자 정보 가져오기
            await this.loadUserInfo();
            
            // 티켓 데이터 로드
            await this.loadTicketDetail();
            
            console.log('티켓 상세 페이지 초기화 완료');
        } catch (error) {
            console.error('티켓 상세 페이지 초기화 실패:', error);
            this.showError('페이지 로드 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        // 헤더 요소들
        this.ticketTitle = document.getElementById('ticketTitle');
        this.ticketNumber = document.getElementById('ticketNumber');
        this.ticketStatusBadge = document.getElementById('ticketStatusBadge');
        this.ticketTypeBadge = document.getElementById('ticketTypeBadge');
        this.ticketPriorityBadge = document.getElementById('ticketPriorityBadge');
        
        // 버튼들
        this.editBtn = document.getElementById('editBtn');
        this.statusChangeBtn = document.getElementById('statusChangeBtn');
        
        // 개요 탭
        this.creatorName = document.getElementById('creatorName');
        this.ownerName = document.getElementById('ownerName');
        this.createdAt = document.getElementById('createdAt');
        this.updatedAt = document.getElementById('updatedAt');
        this.amount = document.getElementById('amount');
        this.severity = document.getElementById('severity');
        this.description = document.getElementById('description');
        this.collaboratorsSection = document.getElementById('collaboratorsSection');
        this.collaboratorsList = document.getElementById('collaboratorsList');
        
        // 탭 콘텐츠
        this.checklistContainer = document.getElementById('checklistContainer');
        this.checklistCountBadge = document.getElementById('checklistCountBadge');
        this.approvalsContainer = document.getElementById('approvalsContainer');
        this.approvalsCountBadge = document.getElementById('approvalsCountBadge');
        this.activityLogsContainer = document.getElementById('activityLogsContainer');
        
        // 모달
        this.statusChangeModal = new bootstrap.Modal(document.getElementById('statusChangeModal'));
        this.newStatusSelect = document.getElementById('newStatusSelect');
        this.confirmStatusChangeBtn = document.getElementById('confirmStatusChangeBtn');
    }

    attachEventListeners() {
        // 수정 버튼
        this.editBtn.addEventListener('click', () => {
            window.location.href = `/pages/tickets/form.html?id=${this.ticketId}`;
        });

        // 상태 변경 버튼
        this.statusChangeBtn.addEventListener('click', () => {
            this.newStatusSelect.value = this.ticketData?.status || 'NEW';
            this.statusChangeModal.show();
        });

        // 상태 변경 확인
        this.confirmStatusChangeBtn.addEventListener('click', () => {
            this.changeStatus();
        });
    }

    async loadUserInfo() {
        // sj-template-loader에서 사용자 정보 가져오기
        if (window.sjTemplateLoader && window.sjTemplateLoader.user) {
            this.currentUser = window.sjTemplateLoader.user;
        } else {
            // 세션 정보 직접 가져오기 시도
            try {
                const response = await fetch('/api/auth/session', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.user) {
                        this.currentUser = result.user;
                    }
                }
            } catch (error) {
                console.warn('사용자 정보를 가져올 수 없습니다:', error);
            }
        }
    }

    async loadTicketDetail() {
        try {
            const response = await fetch(`/api/tickets/${this.ticketId}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.ticketData = result.data;
                this.renderTicketDetail();
                this.checkPermissions();
            } else {
                this.showError(result.message || '티켓을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('티켓 상세 로드 오류:', error);
            this.showError('티켓을 불러오는 중 오류가 발생했습니다.');
        }
    }

    renderTicketDetail() {
        const data = this.ticketData;
        if (!data) return;

        // 헤더 정보
        this.ticketTitle.textContent = data.title || '-';
        this.ticketNumber.textContent = data.ticket_number || '-';
        
        // 상태 배지
        this.ticketStatusBadge.className = 'status-badge ' + this.getStatusBadgeClass(data.status);
        this.ticketStatusBadge.textContent = this.getStatusLabel(data.status);
        
        // 유형 배지
        this.ticketTypeBadge.textContent = this.getTypeLabel(data.ticket_type_code);
        
        // 우선순위 배지
        this.ticketPriorityBadge.className = 'badge ' + this.getPriorityBadgeClass(data.priority);
        this.ticketPriorityBadge.textContent = this.getPriorityLabel(data.priority);

        // 개요 탭
        this.creatorName.textContent = data.creator_name || '-';
        this.ownerName.textContent = data.owner_name || '미배정';
        this.createdAt.textContent = this.formatDateTime(data.created_at);
        this.updatedAt.textContent = this.formatDateTime(data.updated_at);
        this.amount.textContent = data.amount ? this.formatCurrency(data.amount) : '-';
        this.severity.textContent = data.severity || '-';
        this.description.textContent = data.description || '설명이 없습니다.';

        // 협업자
        if (data.collaborators && data.collaborators.length > 0) {
            this.collaboratorsSection.style.display = 'block';
            this.collaboratorsList.innerHTML = data.collaborators.map(collab => 
                `<span class="collaborator-badge">
                    <i class="fas fa-user"></i>
                    ${this.escapeHtml(collab.collaborator_name || collab.collaborator_id)}
                </span>`
            ).join('');
        } else {
            this.collaboratorsSection.style.display = 'none';
        }

        // 체크리스트
        this.renderChecklist(data.checklists || []);
        
        // 승인
        this.renderApprovals(data.approvals || []);
        
        // 활동 로그
        this.renderActivityLogs(data.activity_logs || []);
    }

    renderChecklist(checklists) {
        if (checklists.length === 0) {
            this.checklistContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-tasks fa-2x mb-2"></i>
                    <div>체크리스트가 없습니다.</div>
                </div>
            `;
            this.checklistCountBadge.textContent = '0';
            return;
        }

        this.checklistCountBadge.textContent = checklists.length;
        
        const requiredCount = checklists.filter(c => c.required === 1).length;
        const checkedCount = checklists.filter(c => c.is_checked === 1).length;
        const checkedRequiredCount = checklists.filter(c => c.required === 1 && c.is_checked === 1).length;

        let html = `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">체크리스트 진행 상황</h6>
                    <span class="badge bg-info">${checkedCount}/${checklists.length} 완료</span>
                </div>
                <div class="progress mb-3" style="height: 25px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${(checkedCount / checklists.length) * 100}%"
                         aria-valuenow="${checkedCount}" 
                         aria-valuemin="0" 
                         aria-valuemax="${checklists.length}">
                        ${Math.round((checkedCount / checklists.length) * 100)}%
                    </div>
                </div>
                ${requiredCount > 0 ? `
                    <div class="alert alert-warning">
                        필수 항목: ${checkedRequiredCount}/${requiredCount} 완료
                    </div>
                ` : ''}
            </div>
        `;

        html += checklists.map((item, index) => {
            const checked = item.is_checked === 1;
            const required = item.required === 1;
            const checkedBy = item.checked_by_name || item.checked_by || '';
            const checkedAt = item.checked_at ? this.formatDateTime(item.checked_at) : '';
            
            return `
                <div class="checklist-item ${checked ? 'checked' : ''} ${required ? 'required' : ''}" 
                     data-item-id="${item.id}">
                    <input type="checkbox" 
                           class="form-check-input" 
                           ${checked ? 'checked' : ''} 
                           ${this.canEditChecklist() ? '' : 'disabled'}
                           onchange="ticketDetail.toggleChecklist(${item.id}, this.checked)">
                    <div class="flex-grow-1">
                        <div class="fw-semibold">${this.escapeHtml(item.item_text)}</div>
                        ${checked && checkedBy ? `
                            <small class="text-muted">
                                <i class="fas fa-user-check"></i> ${this.escapeHtml(checkedBy)}
                                ${checkedAt ? ` · ${checkedAt}` : ''}
                            </small>
                        ` : ''}
                        ${required ? '<span class="badge bg-danger ms-2">필수</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.checklistContainer.innerHTML = html;
    }

    async toggleChecklist(itemId, isChecked) {
        try {
            const response = await fetch(`/api/tickets/${this.ticketId}/checklists/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ is_checked: isChecked })
            });

            const result = await response.json();

            if (result.success) {
                // 체크리스트 다시 로드
                await this.loadTicketDetail();
            } else {
                alert(result.message || '체크리스트 업데이트에 실패했습니다.');
                // 체크리스트 다시 로드하여 원래 상태로 복원
                await this.loadTicketDetail();
            }
        } catch (error) {
            console.error('체크리스트 토글 오류:', error);
            alert('체크리스트 업데이트 중 오류가 발생했습니다.');
            await this.loadTicketDetail();
        }
    }

    renderApprovals(approvals) {
        if (approvals.length === 0) {
            this.approvalsContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-check-circle fa-2x mb-2"></i>
                    <div>승인 정보가 없습니다.</div>
                </div>
            `;
            this.approvalsCountBadge.textContent = '0';
            return;
        }

        this.approvalsCountBadge.textContent = approvals.length;

        const html = approvals.map(approval => {
            const statusClass = this.getApprovalStatusClass(approval.status);
            const statusLabel = this.getApprovalStatusLabel(approval.status);
            
            return `
                <div class="approval-card ${statusClass}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1">${this.escapeHtml(approval.approver_name || approval.approver_id)}</h6>
                            <small class="text-muted">${approval.approver_role || '-'}</small>
                        </div>
                        <span class="badge ${this.getApprovalBadgeClass(approval.status)}">${statusLabel}</span>
                    </div>
                    ${approval.comment ? `
                        <div class="mt-2">
                            <strong>의견:</strong> ${this.escapeHtml(approval.comment)}
                        </div>
                    ` : ''}
                    ${approval.approved_at ? `
                        <div class="mt-2 text-muted small">
                            <i class="fas fa-clock"></i> ${this.formatDateTime(approval.approved_at)}
                        </div>
                    ` : approval.due_date ? `
                        <div class="mt-2 text-muted small">
                            <i class="fas fa-calendar"></i> 마감일: ${this.formatDate(approval.due_date)}
                        </div>
                    ` : ''}
                    ${approval.status === 'PENDING' && this.canApprove(approval) ? `
                        <div class="mt-3">
                            <button class="btn btn-sm btn-success me-2" onclick="ticketDetail.approve(${approval.id}, true)">
                                <i class="fas fa-check"></i> 승인
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="ticketDetail.approve(${approval.id}, false)">
                                <i class="fas fa-times"></i> 거부
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        this.approvalsContainer.innerHTML = html;
    }

    async approve(approvalId, approved) {
        const comment = prompt(approved ? '승인 의견을 입력하세요 (선택사항):' : '거부 사유를 입력하세요:');
        if (comment === null && !approved) {
            return; // 거부 시에는 사유 필수
        }

        try {
            const response = await fetch(`/api/tickets/${this.ticketId}/approvals/${approvalId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: approved ? 'APPROVED' : 'REJECTED',
                    comment: comment || null
                })
            });

            const result = await response.json();

            if (result.success) {
                await this.loadTicketDetail();
            } else {
                alert(result.message || '승인 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('승인 처리 오류:', error);
            alert('승인 처리 중 오류가 발생했습니다.');
        }
    }

    renderActivityLogs(activityLogs) {
        if (activityLogs.length === 0) {
            this.activityLogsContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-history fa-2x mb-2"></i>
                    <div>활동 로그가 없습니다.</div>
                </div>
            `;
            return;
        }

        const html = activityLogs.map(log => {
            const icon = this.getActivityIcon(log.activity_type);
            return `
                <div class="activity-log-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <i class="fas ${icon}"></i>
                                <strong>${this.escapeHtml(log.user_name || log.user_id)}</strong>
                                <span class="text-muted small">${this.formatDateTime(log.created_at)}</span>
                            </div>
                            <div class="ms-4">
                                ${this.escapeHtml(log.description || '-')}
                            </div>
                            ${log.old_value || log.new_value ? `
                                <div class="ms-4 mt-2 small text-muted">
                                    ${log.old_value ? `이전: ${this.escapeHtml(log.old_value)}` : ''}
                                    ${log.old_value && log.new_value ? ' → ' : ''}
                                    ${log.new_value ? `변경: ${this.escapeHtml(log.new_value)}` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.activityLogsContainer.innerHTML = html;
    }

    async changeStatus() {
        const newStatus = this.newStatusSelect.value;
        
        if (!newStatus) {
            alert('상태를 선택하세요.');
            return;
        }

        try {
            const response = await fetch(`/api/tickets/${this.ticketId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });

            const result = await response.json();

            if (result.success) {
                this.statusChangeModal.hide();
                await this.loadTicketDetail();
            } else {
                alert(result.message || '상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('상태 변경 오류:', error);
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    }

    checkPermissions() {
        if (!this.ticketData || !this.currentUser) {
            // 사용자 정보가 아직 로드되지 않았으면 재시도
            setTimeout(() => this.checkPermissions(), 500);
            return;
        }

        const userId = this.currentUser.email || this.currentUser.id;
        const userRole = this.currentUser.role;
        const isCreator = this.ticketData.creator_id === userId;
        const isOwner = this.ticketData.owner_id === userId;
        const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole);

        // 수정 권한: 작성자, 담당자, 관리자
        if (isCreator || isOwner || isAdmin) {
            this.editBtn.style.display = 'inline-block';
        }

        // 상태 변경 권한: 담당자, 관리자 (IN_PROGRESS 상태일 때는 담당자만)
        if (isOwner || isAdmin) {
            if (this.ticketData.status === 'IN_PROGRESS' && !isOwner && !isAdmin) {
                // IN_PROGRESS 상태에서는 담당자만 변경 가능
            } else {
                this.statusChangeBtn.style.display = 'inline-block';
            }
        }
    }

    canEditChecklist() {
        if (!this.ticketData || !this.currentUser) return false;
        
        const userId = this.currentUser.email || this.currentUser.id;
        const userRole = this.currentUser.role;
        const isOwner = this.ticketData.owner_id === userId;
        const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole);
        
        // 체크리스트는 담당자 또는 관리자만 수정 가능
        return isOwner || isAdmin;
    }

    canApprove(approval) {
        if (!this.currentUser) return false;
        
        const userId = this.currentUser.email || this.currentUser.id;
        return approval.approver_id === userId;
    }

    // 유틸리티 함수들
    getStatusBadgeClass(status) {
        const classes = {
            'NEW': 'bg-secondary',
            'ASSIGNED': 'bg-info',
            'IN_PROGRESS': 'bg-primary',
            'REVIEW': 'bg-warning',
            'DONE': 'bg-success',
            'ARCHIVED': 'bg-dark'
        };
        return classes[status] || 'bg-secondary';
    }

    getStatusLabel(status) {
        const labels = {
            'NEW': '신규',
            'ASSIGNED': '배정됨',
            'IN_PROGRESS': '진행중',
            'REVIEW': '검토중',
            'DONE': '완료',
            'ARCHIVED': '보관'
        };
        return labels[status] || status;
    }

    getTypeLabel(type) {
        const types = {
            'RESEARCH': '리서치',
            'PROJECT': '프로젝트',
            'CONTRACT': '계약',
            'SETTLEMENT': '정산',
            'PERFORMANCE': '실적',
            'CLAIM': '클레임',
            'DEV': '개발',
            'PLAN': '기획',
            'OTHER': '기타',
            // 기존 데이터 호환성
            'SETTLE': '정산',
            'ACCIDENT': '사고',
            'PARTNER': '파트너'
        };
        return types[type] || type;
    }

    getPriorityBadgeClass(priority) {
        const classes = {
            'low': 'bg-success',
            'medium': 'bg-warning',
            'high': 'bg-danger',
            'urgent': 'bg-danger'
        };
        return classes[priority] || 'bg-secondary';
    }

    getPriorityLabel(priority) {
        const labels = {
            'low': '낮음',
            'medium': '보통',
            'high': '높음',
            'urgent': '긴급'
        };
        return labels[priority] || priority;
    }

    getApprovalStatusClass(status) {
        const classes = {
            'PENDING': 'pending',
            'APPROVED': 'approved',
            'REJECTED': 'rejected'
        };
        return classes[status] || '';
    }

    getApprovalStatusLabel(status) {
        const labels = {
            'PENDING': '대기중',
            'APPROVED': '승인됨',
            'REJECTED': '거부됨'
        };
        return labels[status] || status;
    }

    getApprovalBadgeClass(status) {
        const classes = {
            'PENDING': 'bg-warning',
            'APPROVED': 'bg-success',
            'REJECTED': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    getActivityIcon(activityType) {
        const icons = {
            'STATUS_CHANGE': 'fa-exchange-alt',
            'CHECKLIST_CHECK': 'fa-check-square',
            'COLLABORATOR_ADD': 'fa-user-plus',
            'COLLABORATOR_REMOVE': 'fa-user-minus',
            'APPROVAL': 'fa-check-circle',
            'COMMENT': 'fa-comment',
            'FILE_UPLOAD': 'fa-file-upload',
            'FILE_DELETE': 'fa-file-times'
        };
        return icons[activityType] || 'fa-circle';
    }

    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatCurrency(amount) {
        if (!amount) return '-';
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    }

    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${this.escapeHtml(message)}
                    <div class="mt-2">
                        <a href="/pages/tickets/list.html" class="btn btn-sm btn-outline-secondary">목록으로 돌아가기</a>
                    </div>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 전역 인스턴스 생성
let ticketDetail;
document.addEventListener('DOMContentLoaded', () => {
    ticketDetail = new TicketDetail();
    window.ticketDetail = ticketDetail;
});

