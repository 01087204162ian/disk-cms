// ==============================
// js/manual/mistake-cases-list.js - 실수 사례 목록 관리
// ==============================

class MistakeCasesManager {
    constructor() {
        this.currentPage = 1;
        this.currentLimit = 10;
        this.currentFilters = {};
        this.mistakeCases = [];
        this.totalCount = 0;
        this.init();
    }

    async init() {
        try {
            // DOM 요소 참조
            this.initDOMElements();
            
            // 이벤트 리스너 등록
            this.attachEventListeners();
            
            // 실수 사례 목록 로드
            await this.loadMistakeCases();
            
            console.log('실수 사례 관리 시스템 초기화 완료');
        } catch (error) {
            console.error('실수 사례 관리 시스템 초기화 실패:', error);
            this.showError('시스템 초기화 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        // 필터 요소들
        this.categoryFilter = document.getElementById('categoryFilter');
        this.severityFilter = document.getElementById('severityFilter');
        this.sortFilter = document.getElementById('sortFilter');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        
        // 정보 요소들
        this.totalInfo = document.getElementById('totalInfo');
        
        // 테이블 요소들
        this.tableBody = document.getElementById('mistakeCasesTableBody');
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
        this.categoryFilter.addEventListener('change', () => this.handleFilterChange());
        this.severityFilter.addEventListener('change', () => this.handleFilterChange());
        this.sortFilter.addEventListener('change', () => this.handleFilterChange());
    }

    async loadMistakeCases(page = 1) {
        try {
            this.currentPage = page;
            this.showLoading(true);
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.currentLimit,
                category: this.categoryFilter.value || '',
                severity: this.severityFilter.value || '',
                search: this.searchInput.value || '',
                sort: this.sortFilter.value || 'created_at'
            });
            
            const response = await fetch(`/api/manual/mistake-cases?${params}`, {
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.mistakeCases = result.data.items;
                this.totalCount = result.data.total;
                this.renderTable();
                this.renderPagination(result.data);
                this.updateTotalInfo();
            } else {
                this.showError(result.error || '실수 사례 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('실수 사례 목록 로드 오류:', error);
            this.showError('실수 사례 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    renderTable() {
        if (this.mistakeCases.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-inbox fa-2x mb-2"></i>
                            <div>등록된 실수 사례가 없습니다.</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.tableBody.innerHTML = this.mistakeCases.map((item, index) => {
            const rowNum = (this.currentPage - 1) * this.currentLimit + index + 1;
            const severityBadge = this.getSeverityBadge(item.severity);
            const categoryBadge = this.getCategoryBadge(item.category);
            const preview = item.preview ? (item.preview.length > 50 ? item.preview.substring(0, 50) + '...' : item.preview) : '';
            const createdAt = this.formatDate(item.created_at);

            return `
                <tr style="cursor: pointer;" onclick="window.location.href='/pages/manual/mistake-case-detail.html?id=${item.id}'">
                    <td>${rowNum}</td>
                    <td>${categoryBadge}</td>
                    <td>${severityBadge}</td>
                    <td>
                        <div class="fw-bold">${this.escapeHtml(item.title)}</div>
                        ${preview ? `<small class="text-muted">${this.escapeHtml(preview)}</small>` : ''}
                    </td>
                    <td>${this.escapeHtml(item.author_name || '익명')}</td>
                    <td><span class="badge bg-secondary">${item.view_count || 0}</span></td>
                    <td><span class="badge bg-info">${item.comment_count || 0}</span></td>
                    <td>${createdAt}</td>
                </tr>
            `;
        }).join('');
    }

    getSeverityBadge(severity) {
        const badges = {
            'low': '<span class="badge bg-success">낮음</span>',
            'medium': '<span class="badge bg-warning">보통</span>',
            'high': '<span class="badge bg-danger">높음</span>'
        };
        return badges[severity] || '<span class="badge bg-secondary">-</span>';
    }

    getCategoryBadge(category) {
        return `<span class="badge bg-primary">${this.escapeHtml(category)}</span>`;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    renderPagination(data) {
        const totalPages = Math.ceil(data.total / data.limit);
        const currentPage = data.page;

        // 페이지 정보
        const start = (currentPage - 1) * data.limit + 1;
        const end = Math.min(currentPage * data.limit, data.total);
        this.paginationInfo.textContent = `총 ${data.total}건 중 ${start}-${end}건 표시`;

        // 페이지네이션 버튼
        let paginationHTML = '';

        // 이전 버튼
        if (currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="mistakeCasesManager.loadMistakeCases(${currentPage - 1}); return false;">
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
                    <a class="page-link" href="#" onclick="mistakeCasesManager.loadMistakeCases(1); return false;">1</a>
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
                        <a class="page-link" href="#" onclick="mistakeCasesManager.loadMistakeCases(${i}); return false;">${i}</a>
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
                    <a class="page-link" href="#" onclick="mistakeCasesManager.loadMistakeCases(${totalPages}); return false;">${totalPages}</a>
                </li>
            `;
        }

        // 다음 버튼
        if (currentPage < totalPages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="mistakeCasesManager.loadMistakeCases(${currentPage + 1}); return false;">
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

    updateTotalInfo() {
        this.totalInfo.textContent = `전체 ${this.totalCount}건`;
    }

    handleSearch() {
        this.currentPage = 1;
        this.loadMistakeCases(1);
    }

    handleFilterChange() {
        this.currentPage = 1;
        this.loadMistakeCases(1);
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
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 전역 인스턴스 생성
let mistakeCasesManager;
document.addEventListener('DOMContentLoaded', () => {
    mistakeCasesManager = new MistakeCasesManager();
    window.mistakeCasesManager = mistakeCasesManager;
});

