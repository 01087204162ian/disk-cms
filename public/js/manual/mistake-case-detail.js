// ==============================
// js/manual/mistake-case-detail.js - 실수 사례 상세 페이지
// ==============================

class MistakeCaseDetail {
    constructor() {
        this.caseId = null;
        this.caseData = null;
        this.comments = [];
        this.init();
    }

    async init() {
        try {
            // URL에서 ID 가져오기
            const urlParams = new URLSearchParams(window.location.search);
            this.caseId = urlParams.get('id');

            if (!this.caseId) {
                this.showError('사례 ID가 없습니다.');
                return;
            }

            // DOM 요소 참조
            this.initDOMElements();
            
            // 이벤트 리스너 등록
            this.attachEventListeners();
            
            // 데이터 로드
            await this.loadCaseDetail();
            await this.loadComments();
            
            // 권한 체크 (약간의 지연 후 실행 - 세션 정보 로드 대기)
            setTimeout(() => {
                this.checkPermissions();
            }, 500);
            
            console.log('실수 사례 상세 페이지 초기화 완료');
        } catch (error) {
            console.error('실수 사례 상세 페이지 초기화 실패:', error);
            this.showError('페이지 로드 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        // 헤더 요소들
        this.caseTitle = document.getElementById('caseTitle');
        this.caseMeta = document.getElementById('caseMeta');
        this.viewCount = document.getElementById('viewCount');
        this.commentCount = document.getElementById('commentCount');
        this.categoryBadge = document.getElementById('categoryBadge');
        this.severityBadge = document.getElementById('severityBadge');
        this.tagsContainer = document.getElementById('tagsContainer');
        
        // 버튼들
        this.editBtn = document.getElementById('editBtn');
        this.deleteBtn = document.getElementById('deleteBtn');
        
        // 탭 콘텐츠
        this.workContent = document.getElementById('workContent');
        this.mistakeDescription = document.getElementById('mistakeDescription');
        this.resultDescription = document.getElementById('resultDescription');
        this.surfaceCauses = document.getElementById('surfaceCauses');
        this.rootCauses = document.getElementById('rootCauses');
        this.structuralIssues = document.getElementById('structuralIssues');
        this.improvementMeasures = document.getElementById('improvementMeasures');
        this.checklistContainer = document.getElementById('checklistContainer');
        this.checklistSection = document.getElementById('checklistSection');
        this.filesContainer = document.getElementById('filesContainer');
        this.fileCountBadge = document.getElementById('fileCountBadge');
        
        // 댓글 관련
        this.commentInput = document.getElementById('commentInput');
        this.submitCommentBtn = document.getElementById('submitCommentBtn');
        this.commentsContainer = document.getElementById('commentsContainer');
        this.commentCountHeader = document.getElementById('commentCountHeader');
    }

    attachEventListeners() {
        // 수정 버튼
        this.editBtn.addEventListener('click', () => {
            window.location.href = `/pages/manual/mistake-case-form.html?id=${this.caseId}`;
        });

        // 삭제 버튼
        this.deleteBtn.addEventListener('click', () => {
            if (confirm('정말 이 실수 사례를 삭제하시겠습니까?')) {
                this.deleteCase();
            }
        });

        // 댓글 작성
        this.submitCommentBtn.addEventListener('click', () => {
            this.submitComment();
        });

        this.commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.submitComment();
            }
        });
    }

    async loadCaseDetail() {
        try {
            const response = await fetch(`/api/manual/mistake-cases/${this.caseId}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.caseData = result.data;
                this.renderCaseDetail();
            } else {
                this.showError(result.error || '실수 사례를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('실수 사례 상세 로드 오류:', error);
            this.showError('실수 사례를 불러오는 중 오류가 발생했습니다.');
        }
    }

    renderCaseDetail() {
        const data = this.caseData;

        // 제목
        this.caseTitle.textContent = data.title;

        // 메타 정보
        const createdAt = this.formatDateTime(data.created_at);
        this.caseMeta.textContent = `등록자: ${data.author_name || '익명'} | 등록일: ${createdAt}`;
        this.viewCount.textContent = data.view_count || 0;
        this.commentCount.textContent = data.comment_count || 0;

        // 카테고리 및 심각도 배지
        this.categoryBadge.textContent = data.category;
        this.severityBadge.className = 'badge ' + this.getSeverityBadgeClass(data.severity);
        this.severityBadge.textContent = this.getSeverityLabel(data.severity);

        // 태그
        if (data.tags && data.tags.length > 0) {
            this.tagsContainer.innerHTML = data.tags.map(tag => 
                `<span class="badge bg-secondary me-1">${this.escapeHtml(tag)}</span>`
            ).join('');
        }

        // 개요 탭
        this.renderMarkdown(this.workContent, data.work_content);
        this.renderMarkdown(this.mistakeDescription, data.mistake_description);
        this.renderMarkdown(this.resultDescription, data.result_description);

        // 원인 분석 탭
        this.renderMarkdown(this.surfaceCauses, data.surface_causes);
        this.renderMarkdown(this.rootCauses, data.root_causes);
        this.renderMarkdown(this.structuralIssues, data.structural_issues);

        // 개선 방안 탭
        this.renderMarkdown(this.improvementMeasures, data.improvement_measures);

        // 체크리스트
        if (data.checklist_items && data.checklist_items.length > 0) {
            this.checklistSection.style.display = 'block';
            this.renderChecklist(data.checklist_items);
        }

        // 첨부 파일
        if (data.files && data.files.length > 0) {
            this.fileCountBadge.textContent = data.files.length;
            this.renderFiles(data.files);
        } else {
            this.fileCountBadge.textContent = '0';
        }
    }

    renderMarkdown(element, content) {
        if (!content || content.trim() === '') {
            element.innerHTML = '<div class="text-muted">내용이 없습니다.</div>';
            return;
        }

        // 마크다운 파싱 (marked 라이브러리 사용)
        if (typeof marked !== 'undefined') {
            element.innerHTML = marked.parse(content);
        } else {
            // 마크다운 파서가 없으면 그대로 표시 (줄바꿈 처리)
            element.innerHTML = this.escapeHtml(content).replace(/\n/g, '<br>');
        }
    }

    renderChecklist(checklistItems) {
        if (!checklistItems || checklistItems.length === 0) {
            this.checklistContainer.innerHTML = '<div class="text-muted">체크리스트가 없습니다.</div>';
            return;
        }

        let html = '';
        checklistItems.forEach((item, index) => {
            if (typeof item === 'string') {
                html += `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="checklist-${index}" disabled>
                        <label class="form-check-label" for="checklist-${index}">
                            ${this.escapeHtml(item)}
                        </label>
                    </div>
                `;
            } else if (item.title && item.items) {
                html += `
                    <div class="mb-3">
                        <h6>${this.escapeHtml(item.title)}</h6>
                        ${item.items.map((subItem, subIndex) => `
                            <div class="form-check ms-3 mb-2">
                                <input class="form-check-input" type="checkbox" id="checklist-${index}-${subIndex}" disabled>
                                <label class="form-check-label" for="checklist-${index}-${subIndex}">
                                    ${this.escapeHtml(subItem)}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        });

        this.checklistContainer.innerHTML = html || '<div class="text-muted">체크리스트가 없습니다.</div>';
    }

    renderFiles(files) {
        if (!files || files.length === 0) {
            this.filesContainer.innerHTML = '<div class="text-muted">첨부된 파일이 없습니다.</div>';
            return;
        }

        const filesHTML = files.map(file => {
            const fileSize = this.formatFileSize(file.file_size);
            return `
                <div class="card mb-2">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-file me-2"></i>
                                <strong>${this.escapeHtml(file.file_name)}</strong>
                                <small class="text-muted ms-2">${fileSize}</small>
                            </div>
                            <a href="/api/manual/mistake-cases/${this.caseId}/files/${file.id}/download" 
                               class="btn btn-sm btn-primary" download>
                                <i class="fas fa-download"></i> 다운로드
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.filesContainer.innerHTML = filesHTML;
    }

    async loadComments() {
        try {
            const response = await fetch(`/api/manual/mistake-cases/${this.caseId}/comments`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.comments = result.data || [];
                this.renderComments();
            } else {
                this.commentsContainer.innerHTML = '<div class="text-muted">댓글을 불러오는데 실패했습니다.</div>';
            }
        } catch (error) {
            console.error('댓글 로드 오류:', error);
            this.commentsContainer.innerHTML = '<div class="text-danger">댓글을 불러오는 중 오류가 발생했습니다.</div>';
        }
    }

    renderComments() {
        if (this.comments.length === 0) {
            this.commentsContainer.innerHTML = '<div class="text-muted text-center py-4">댓글이 없습니다.</div>';
            return;
        }

        // 현재 사용자 정보 (권한 체크용)
        const currentUser = window.sjTemplateLoader?.user || null;
        const currentUserId = currentUser?.id || null;
        const currentUserRole = currentUser?.role || null;

        const commentsHTML = this.comments.map((comment, index) => {
            const createdAt = this.formatDateTime(comment.created_at);
            const isAuthor = comment.author_id === currentUserId;
            const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(currentUserRole);
            const canEdit = isAuthor || isAdmin;
            
            return `
                <div class="card mb-3" id="comment-${comment.id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <strong>${this.escapeHtml(comment.author_name || '익명')}</strong>
                                <small class="text-muted ms-2">${createdAt}</small>
                            </div>
                            <div class="btn-group btn-group-sm">
                                ${canEdit ? `
                                    <button class="btn btn-link text-primary p-0 me-2" onclick="mistakeCaseDetail.editComment(${comment.id}, ${index})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-link text-danger p-0 me-2" onclick="mistakeCaseDetail.deleteComment(${comment.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="comment-content" id="comment-content-${comment.id}">
                            ${this.escapeHtml(comment.content).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.commentsContainer.innerHTML = commentsHTML;
        this.commentCountHeader.textContent = this.comments.length;
    }

    async editComment(commentId, index) {
        const comment = this.comments[index];
        if (!comment) return;

        const newContent = prompt('댓글을 수정하세요:', comment.content);
        if (newContent === null || newContent.trim() === comment.content) {
            return;
        }

        try {
            const response = await fetch(`/api/manual/mistake-cases/${this.caseId}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ content: newContent.trim() })
            });

            const result = await response.json();

            if (result.success) {
                await this.loadComments();
            } else {
                alert(result.error || '댓글 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 수정 오류:', error);
            alert('댓글 수정 중 오류가 발생했습니다.');
        }
    }

    async deleteComment(commentId) {
        if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`/api/manual/mistake-cases/${this.caseId}/comments/${commentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                await this.loadComments();
                await this.loadCaseDetail(); // 댓글 수 업데이트
            } else {
                alert(result.error || '댓글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 삭제 오류:', error);
            alert('댓글 삭제 중 오류가 발생했습니다.');
        }
    }


    async submitComment() {
        const content = this.commentInput.value.trim();

        if (!content) {
            alert('댓글 내용을 입력하세요.');
            return;
        }

        try {
            const response = await fetch(`/api/manual/mistake-cases/${this.caseId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ content })
            });

            const result = await response.json();

            if (result.success) {
                this.commentInput.value = '';
                await this.loadComments();
                // 댓글 수 업데이트
                await this.loadCaseDetail();
            } else {
                alert(result.error || '댓글 작성에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 작성 오류:', error);
            alert('댓글 작성 중 오류가 발생했습니다.');
        }
    }

    async deleteCase() {
        try {
            const response = await fetch(`/api/manual/mistake-cases/${this.caseId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                alert('실수 사례가 삭제되었습니다.');
                window.location.href = '/pages/manual/mistake-cases.html';
            } else {
                alert(result.error || '삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    }

    async checkPermissions() {
        try {
            // 세션 정보 가져오기 (sj-template-loader에서 로드된 경우)
            const user = window.sjTemplateLoader?.user || null;
            
            if (!user || !this.caseData) {
                return;
            }

            const userId = user.id;
            const userRole = user.role;
            const authorId = this.caseData.author_id;

            // 작성자이거나 관리자인 경우 버튼 표시
            if (authorId === userId || ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole)) {
                this.editBtn.style.display = 'inline-block';
                this.deleteBtn.style.display = 'inline-block';
            }
        } catch (error) {
            console.error('권한 확인 오류:', error);
        }
    }

    getSeverityBadgeClass(severity) {
        const classes = {
            'low': 'bg-success',
            'medium': 'bg-warning',
            'high': 'bg-danger'
        };
        return classes[severity] || 'bg-secondary';
    }

    getSeverityLabel(severity) {
        const labels = {
            'low': '낮음',
            'medium': '보통',
            'high': '높음'
        };
        return labels[severity] || '-';
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

    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${this.escapeHtml(message)}
                    <div class="mt-2">
                        <a href="/pages/manual/mistake-cases.html" class="btn btn-sm btn-outline-secondary">목록으로 돌아가기</a>
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
let mistakeCaseDetail;
document.addEventListener('DOMContentLoaded', () => {
    mistakeCaseDetail = new MistakeCaseDetail();
    window.mistakeCaseDetail = mistakeCaseDetail;
});


