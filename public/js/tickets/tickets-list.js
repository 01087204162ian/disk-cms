// ==============================
// js/tickets/tickets-list.js - 티켓 목록 관리
// ==============================

class TicketsManager {
    constructor() {
        this.currentPage = 1;
        this.currentLimit = 20;
        this.currentFilters = {};
        this.tickets = [];
        this.totalCount = 0;
        this.init();
    }

    async init() {
        try {
            // DOM 요소 참조
            this.initDOMElements();
            
            // 이벤트 리스너 등록
            this.attachEventListeners();
            
            // 티켓 목록 로드
            await this.loadTickets();
            
            console.log('티켓 관리 시스템 초기화 완료');
        } catch (error) {
            console.error('티켓 관리 시스템 초기화 실패:', error);
            this.showError('시스템 초기화 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        // 필터 요소들
        this.statusFilter = document.getElementById('statusFilter');
        this.ticketTypeFilter = document.getElementById('ticketTypeFilter');
        this.priorityFilter = document.getElementById('priorityFilter');
        this.pageSizeFilter = document.getElementById('pageSizeFilter');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        
        // 테이블 요소들
        this.tableBody = document.getElementById('ticketsTableBody');
        this.cardView = document.getElementById('ticketsCardView');
        this.paginationInfo = document.getElementById('paginationInfo');
        this.paginationControls = document.getElementById('paginationControls');
    }

    attachEventListeners() {
        // 검색 버튼
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // 필터 변경
        this.statusFilter.addEventListener('change', () => this.handleFilterChange());
        this.ticketTypeFilter.addEventListener('change', () => this.handleFilterChange());
        this.priorityFilter.addEventListener('change', () => this.handleFilterChange());
        this.pageSizeFilter.addEventListener('change', () => this.handleFilterChange());
    }

    async loadTickets(page = 1) {
        try {
            this.currentPage = page;
            this.showLoading(true);
            
            const params = new URLSearchParams({
                status: this.statusFilter.value || '',
                ticket_type: this.ticketTypeFilter.value || '',
                priority: this.priorityFilter.value || '',
                limit: this.currentLimit,
                offset: (this.currentPage - 1) * this.currentLimit
            });
            
            // 검색어가 있으면 추가 (API에서 search 파라미터 지원 시)
            const searchTerm = this.searchInput.value.trim();
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            
            const response = await fetch(`/api/tickets?${params}`, {
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.tickets = result.data || [];
                this.totalCount = result.count || 0;
                this.renderTable();
                this.renderPagination();
            } else {
                this.showError(result.message || '티켓 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('티켓 목록 로드 오류:', error);
            this.showError('티켓 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    renderTable() {
        const emptyState = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <div class="mt-2">등록된 티켓이 없습니다.</div>
                    </div>
                </td>
            </tr>
        `;
        
        if (this.tickets.length === 0) {
            if (this.tableBody) {
                this.tableBody.innerHTML = emptyState;
            }
            if (this.cardView) {
                this.cardView.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <div class="mt-2">등록된 티켓이 없습니다.</div>
                    </div>
                `;
            }
            return;
        }

        // 데스크톱 테이블 뷰
        if (this.tableBody) {
            this.tableBody.innerHTML = this.tickets.map((ticket, index) => {
                const rowNum = (this.currentPage - 1) * this.currentLimit + index + 1;
                const statusBadge = this.getStatusBadge(ticket.status);
                const typeBadge = this.getTypeBadge(ticket.ticket_type_code);
                const priorityBadge = this.getPriorityBadge(ticket.priority);
                const createdAt = this.formatDate(ticket.created_at);

                return `
                    <tr style="cursor: pointer;" onclick="window.location.href='/pages/tickets/detail.html?id=${ticket.id}'">
                        <td class="text-center">${rowNum}</td>
                        <td class="fw-semibold">${this.escapeHtml(ticket.title)}</td>
                        <td><small>${this.escapeHtml(ticket.owner_name || ticket.creator_name || '-')}</small></td>
                        <td>${typeBadge}</td>
                        <td><small class="text-muted">${createdAt}</small></td>
                        <td class="text-center">${priorityBadge}</td>
                        <td>${statusBadge}</td>
                        <td class="text-center">
                            <a href="/pages/tickets/detail.html?id=${ticket.id}" class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation();">
                                <i class="fas fa-eye"></i>
                            </a>
                        </td>
                        <td style="display: none;"><code class="text-primary">${this.escapeHtml(ticket.ticket_number)}</code></td>
                    </tr>
                `;
            }).join('');
        }
        
        // 모바일 카드 뷰
        if (this.cardView) {
            this.cardView.innerHTML = this.tickets.map((ticket, index) => {
                const rowNum = (this.currentPage - 1) * this.currentLimit + index + 1;
                const statusBadge = this.getStatusBadge(ticket.status);
                const typeBadge = this.getTypeBadge(ticket.ticket_type_code);
                const priorityBadge = this.getPriorityBadge(ticket.priority);
                const createdAt = this.formatDate(ticket.created_at);

                return `
                    <div class="ticket-card" onclick="window.location.href='/pages/tickets/detail.html?id=${ticket.id}'">
                        <div class="ticket-card-header">
                            <h6 class="ticket-card-title">${this.escapeHtml(ticket.title)}</h6>
                        </div>
                        <div class="ticket-card-body">
                            <div class="ticket-card-row">
                                <div class="ticket-card-label">담당자</div>
                                <div class="ticket-card-value">${this.escapeHtml(ticket.owner_name || ticket.creator_name || '-')}</div>
                            </div>
                            <div class="ticket-card-row">
                                <div class="ticket-card-label">유형</div>
                                <div class="ticket-card-value">${typeBadge}</div>
                            </div>
                            <div class="ticket-card-row">
                                <div class="ticket-card-label">생성일</div>
                                <div class="ticket-card-value">${createdAt}</div>
                            </div>
                            <div class="ticket-card-row">
                                <div class="ticket-card-label">우선순위</div>
                                <div class="ticket-card-value">${priorityBadge}</div>
                            </div>
                            <div class="ticket-card-row">
                                <div class="ticket-card-label">상태</div>
                                <div class="ticket-card-value">${statusBadge}</div>
                            </div>
                        </div>
                        <div class="ticket-card-footer">
                            <span class="text-muted small">#${rowNum}</span>
                            <a href="/pages/tickets/detail.html?id=${ticket.id}" class="btn btn-sm btn-primary" onclick="event.stopPropagation();">
                                <i class="fas fa-eye"></i> 보기
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    getStatusBadge(status) {
        const badges = {
            'NEW': '<span class="badge bg-secondary">신규</span>',
            'ASSIGNED': '<span class="badge bg-info">배정됨</span>',
            'IN_PROGRESS': '<span class="badge bg-primary">진행중</span>',
            'REVIEW': '<span class="badge bg-warning">검토중</span>',
            'DONE': '<span class="badge bg-success">완료</span>',
            'ARCHIVED': '<span class="badge bg-dark">보관</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">-</span>';
    }

    getTypeBadge(type) {
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
        return `<span class="badge bg-primary">${types[type] || type}</span>`;
    }

    getPriorityBadge(priority) {
        const badges = {
            'low': '<span class="badge bg-success">낮음</span>',
            'medium': '<span class="badge bg-warning">보통</span>',
            'high': '<span class="badge bg-danger">높음</span>',
            'urgent': '<span class="badge bg-danger">긴급</span>'
        };
        return badges[priority] || '<span class="badge bg-secondary">-</span>';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.totalCount / this.currentLimit);
        const currentPage = this.currentPage;

        // 페이지 정보
        const start = (currentPage - 1) * this.currentLimit + 1;
        const end = Math.min(currentPage * this.currentLimit, this.totalCount);
        this.paginationInfo.textContent = `총 ${this.totalCount}건 중 ${start}-${end}건 표시`;

        // 페이지네이션 버튼
        let paginationHTML = '';

        // 이전 버튼
        if (currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="ticketsManager.loadTickets(${currentPage - 1}); return false;">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link"><i class="fas fa-chevron-left"></i></span>
                </li>
            `;
        }

        // 페이지 번호 버튼
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="ticketsManager.loadTickets(1); return false;">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                paginationHTML += `
                    <li class="page-item active">
                        <span class="page-link">${i}</span>
                    </li>
                `;
            } else {
                paginationHTML += `
                    <li class="page-item">
                        <a class="page-link" href="#" onclick="ticketsManager.loadTickets(${i}); return false;">${i}</a>
                    </li>
                `;
            }
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="ticketsManager.loadTickets(${totalPages}); return false;">${totalPages}</a>
                </li>
            `;
        }

        // 다음 버튼
        if (currentPage < totalPages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="ticketsManager.loadTickets(${currentPage + 1}); return false;">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link"><i class="fas fa-chevron-right"></i></span>
                </li>
            `;
        }

        this.paginationControls.innerHTML = paginationHTML;
    }

    handleSearch() {
        this.currentPage = 1;
        this.loadTickets(1);
    }

    handleFilterChange() {
        this.currentPage = 1;
        this.currentLimit = parseInt(this.pageSizeFilter.value);
        this.loadTickets(1);
    }

    showLoading(show) {
        if (show) {
            if (this.tableBody) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
            if (this.cardView) {
                this.cardView.innerHTML = `
                    <div class="spinner-border text-primary d-block mx-auto my-4" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                `;
            }
        }
    }

    showError(message) {
        if (this.tableBody) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="alert alert-danger mb-0">
                            <i class="fas fa-exclamation-circle"></i> ${this.escapeHtml(message)}
                        </div>
                    </td>
                </tr>
            `;
        }
        if (this.cardView) {
            this.cardView.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${this.escapeHtml(message)}
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
let ticketsManager;
document.addEventListener('DOMContentLoaded', () => {
    ticketsManager = new TicketsManager();
    window.ticketsManager = ticketsManager;
});


