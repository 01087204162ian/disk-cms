// ==============================
// js/tickets/tickets-approvals.js - 승인 대기 페이지
// ==============================

class TicketApprovals {
    constructor() {
        this.currentUser = null;
        this.approvals = [];
        this.currentApprovalId = null;
        this.currentTicketId = null;
        this.isApproving = false;
        this.init();
    }

    async init() {
        try {
            // DOM 요소 참조
            this.initDOMElements();
            
            // 이벤트 리스너 등록
            this.attachEventListeners();
            
            // 사용자 정보 로드
            await this.loadUserInfo();
            
            // 승인 목록 로드
            await this.loadApprovals();
            
            console.log('승인 대기 페이지 초기화 완료');
        } catch (error) {
            console.error('승인 대기 페이지 초기화 실패:', error);
            this.showError('페이지 로드 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        this.approvalsContainer = document.getElementById('approvalsContainer');
        this.emptyState = document.getElementById('emptyState');
        this.totalInfo = document.getElementById('totalInfo');
        this.statusFilter = document.getElementById('statusFilter');
        this.ticketTypeFilter = document.getElementById('ticketTypeFilter');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // 모달
        this.approvalModal = new bootstrap.Modal(document.getElementById('approvalModal'));
        this.approvalModalTitle = document.getElementById('approvalModalTitle');
        this.approvalModalInfo = document.getElementById('approvalModalInfo');
        this.approvalComment = document.getElementById('approvalComment');
        this.approveBtn = document.getElementById('approveBtn');
        this.rejectBtn = document.getElementById('rejectBtn');
    }

    attachEventListeners() {
        // 새로고침
        this.refreshBtn.addEventListener('click', () => {
            this.loadApprovals();
        });

        // 검색
        this.searchBtn.addEventListener('click', () => {
            this.loadApprovals();
        });

        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadApprovals();
            }
        });

        // 필터 변경
        this.statusFilter.addEventListener('change', () => {
            this.loadApprovals();
        });

        this.ticketTypeFilter.addEventListener('change', () => {
            this.loadApprovals();
        });

        // 승인/거부 버튼
        this.approveBtn.addEventListener('click', () => {
            this.processApproval(true);
        });

        this.rejectBtn.addEventListener('click', () => {
            this.processApproval(false);
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

    async loadApprovals() {
        try {
            this.showLoading(true);

            // 현재 사용자의 승인 대기 목록 조회
            // API가 없으면 티켓 목록에서 승인 정보를 포함하여 조회
            const userId = this.currentUser?.email || this.currentUser?.id;
            
            if (!userId) {
                this.showError('사용자 정보를 불러올 수 없습니다.');
                return;
            }

            // 티켓 목록 조회 (REVIEW 상태의 티켓만)
            const params = new URLSearchParams({
                status: 'REVIEW',
                limit: 100
            });

            if (this.ticketTypeFilter.value) {
                params.append('ticket_type', this.ticketTypeFilter.value);
            }

            const response = await fetch(`/api/tickets?${params}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                const tickets = result.data || [];
                
                // 각 티켓의 승인 정보 조회
                const approvalsList = [];
                for (const ticket of tickets) {
                    const ticketDetail = await this.getTicketDetail(ticket.id);
                    if (ticketDetail && ticketDetail.approvals) {
                        for (const approval of ticketDetail.approvals) {
                            // 현재 사용자가 승인해야 할 항목만 필터링
                            if (approval.approver_id === userId) {
                                // 상태 필터 적용
                                const statusFilter = this.statusFilter.value;
                                if (!statusFilter || approval.status === statusFilter) {
                                    // 검색 필터 적용
                                    const searchTerm = this.searchInput.value.trim().toLowerCase();
                                    if (!searchTerm || 
                                        ticket.ticket_number.toLowerCase().includes(searchTerm) ||
                                        ticket.title.toLowerCase().includes(searchTerm)) {
                                        approvalsList.push({
                                            ...approval,
                                            ticket: ticket,
                                            ticket_detail: ticketDetail
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                this.approvals = approvalsList;
                this.renderApprovals();
            } else {
                this.showError(result.message || '승인 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('승인 목록 로드 오류:', error);
            this.showError('승인 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    async getTicketDetail(ticketId) {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                credentials: 'include'
            });

            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('티켓 상세 조회 오류:', error);
            return null;
        }
    }

    renderApprovals() {
        if (this.approvals.length === 0) {
            this.approvalsContainer.style.display = 'none';
            this.emptyState.style.display = 'block';
            this.totalInfo.textContent = '승인 대기 중인 티켓이 없습니다.';
            return;
        }

        this.approvalsContainer.style.display = 'block';
        this.emptyState.style.display = 'none';
        
        const pendingCount = this.approvals.filter(a => a.status === 'PENDING').length;
        this.totalInfo.textContent = `총 ${this.approvals.length}건 (대기중: ${pendingCount}건)`;

        const html = this.approvals.map(approval => {
            const ticket = approval.ticket;
            const statusClass = this.getApprovalStatusClass(approval.status);
            const statusLabel = this.getApprovalStatusLabel(approval.status);
            const statusBadge = this.getApprovalBadge(approval.status);

            return `
                <div class="approval-card ${statusClass}">
                    <div class="ticket-info">
                        <div class="ticket-title">
                            <a href="/pages/tickets/detail.html?id=${ticket.id}" class="text-decoration-none">
                                ${this.escapeHtml(ticket.title)}
                            </a>
                        </div>
                        <div class="ticket-meta">
                            <span class="badge bg-primary me-2">${this.getTypeLabel(ticket.ticket_type_code)}</span>
                            <code class="text-primary">${this.escapeHtml(ticket.ticket_number)}</code>
                            <span class="ms-2">생성일: ${this.formatDate(ticket.created_at)}</span>
                        </div>
                        ${ticket.amount ? `
                            <div class="ticket-meta mt-1">
                                <strong>금액:</strong> ${this.formatCurrency(ticket.amount)}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="approval-info">
                        <div>
                            <div class="mb-2">
                                <strong>승인자 역할:</strong> ${this.escapeHtml(approval.approver_role || '-')}
                            </div>
                            <div class="mb-2">
                                <strong>승인 레벨:</strong> ${approval.approval_level || '-'}
                            </div>
                            ${approval.comment ? `
                                <div class="mb-2">
                                    <strong>의견:</strong> ${this.escapeHtml(approval.comment)}
                                </div>
                            ` : ''}
                            ${approval.approved_at ? `
                                <div class="text-muted small">
                                    <i class="fas fa-clock"></i> ${this.formatDateTime(approval.approved_at)}
                                </div>
                            ` : approval.due_date ? `
                                <div class="text-muted small">
                                    <i class="fas fa-calendar"></i> 마감일: ${this.formatDate(approval.due_date)}
                                </div>
                            ` : ''}
                        </div>
                        <div class="text-end">
                            ${statusBadge}
                            ${approval.status === 'PENDING' ? `
                                <div class="mt-3">
                                    <button class="btn btn-sm btn-success me-2" 
                                            onclick="ticketApprovals.showApprovalModal(${approval.id}, ${ticket.id}, true)">
                                        <i class="fas fa-check"></i> 승인
                                    </button>
                                    <button class="btn btn-sm btn-danger" 
                                            onclick="ticketApprovals.showApprovalModal(${approval.id}, ${ticket.id}, false)">
                                        <i class="fas fa-times"></i> 거부
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.approvalsContainer.innerHTML = html;
    }

    showApprovalModal(approvalId, ticketId, isApproving) {
        this.currentApprovalId = approvalId;
        this.currentTicketId = ticketId;
        this.isApproving = isApproving;
        
        this.approvalModalTitle.textContent = isApproving ? '승인 처리' : '거부 처리';
        this.approvalModalInfo.textContent = isApproving 
            ? '승인 처리 후 취소할 수 없습니다.' 
            : '거부 처리 후 취소할 수 없습니다. 거부 사유를 입력해주세요.';
        this.approvalComment.value = '';
        this.approveBtn.style.display = isApproving ? 'inline-block' : 'none';
        this.rejectBtn.style.display = isApproving ? 'none' : 'inline-block';
        
        this.approvalModal.show();
    }

    async processApproval(approved) {
        if (!approved && !this.approvalComment.value.trim()) {
            alert('거부 사유를 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(`/api/tickets/${this.currentTicketId}/approvals/${this.currentApprovalId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: approved ? 'APPROVED' : 'REJECTED',
                    comment: this.approvalComment.value.trim() || null
                })
            });

            const result = await response.json();

            if (result.success) {
                this.approvalModal.hide();
                alert(approved ? '승인 처리되었습니다.' : '거부 처리되었습니다.');
                await this.loadApprovals();
            } else {
                alert(result.message || '승인 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('승인 처리 오류:', error);
            alert('승인 처리 중 오류가 발생했습니다.');
        }
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

    getApprovalBadge(status) {
        const badges = {
            'PENDING': '<span class="badge bg-warning">대기중</span>',
            'APPROVED': '<span class="badge bg-success">승인됨</span>',
            'REJECTED': '<span class="badge bg-danger">거부됨</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">-</span>';
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

    showLoading(show) {
        if (show) {
            this.approvalsContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
        }
    }

    showError(message) {
        this.approvalsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> ${this.escapeHtml(message)}
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 전역 인스턴스 생성
let ticketApprovals;
document.addEventListener('DOMContentLoaded', () => {
    ticketApprovals = new TicketApprovals();
    window.ticketApprovals = ticketApprovals;
});

