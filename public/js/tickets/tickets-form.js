// ==============================
// js/tickets/tickets-form.js - 티켓 생성/수정 폼
// ==============================

class TicketForm {
    constructor() {
        this.ticketId = null;
        this.collaborators = [];
        this.init();
    }

    async init() {
        try {
            // URL에서 ID 가져오기 (수정 모드)
            const urlParams = new URLSearchParams(window.location.search);
            this.ticketId = urlParams.get('id');

            // DOM 요소 참조
            this.initDOMElements();
            
            // 이벤트 리스너 등록
            this.attachEventListeners();
            
            // 수정 모드인 경우 데이터 로드
            if (this.ticketId) {
                await this.loadTicketData();
                document.getElementById('formTitle').textContent = '티켓 수정';
                document.getElementById('submitBtn').innerHTML = '<i class="fas fa-check"></i> 수정';
            }
            
            console.log('티켓 폼 초기화 완료');
        } catch (error) {
            console.error('티켓 폼 초기화 실패:', error);
            this.showError('페이지 로드 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        this.form = document.getElementById('ticketForm');
        this.collaboratorInput = document.getElementById('collaboratorInput');
        this.addCollaboratorBtn = document.getElementById('addCollaboratorBtn');
        this.collaboratorsList = document.getElementById('collaboratorsList');
    }

    attachEventListeners() {
        // 폼 제출
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });

        // 협업자 추가
        this.addCollaboratorBtn.addEventListener('click', () => {
            this.addCollaborator();
        });

        // 협업자 입력 필드에서 Enter 키 처리
        this.collaboratorInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addCollaborator();
            }
        });
    }

    async loadTicketData() {
        try {
            const response = await fetch(`/api/tickets/${this.ticketId}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                const data = result.data;
                
                // 기본 정보
                document.getElementById('ticketType').value = data.ticket_type_code || '';
                document.getElementById('title').value = data.title || '';
                document.getElementById('priority').value = data.priority || 'medium';
                document.getElementById('ownerId').value = data.owner_id || '';
                
                // 마감일
                if (data.due_date) {
                    const dueDate = new Date(data.due_date);
                    const localDate = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000);
                    document.getElementById('dueDate').value = localDate.toISOString().slice(0, 16);
                }

                // 상세 정보
                document.getElementById('description').value = data.description || '';
                document.getElementById('amount').value = data.amount || '';
                document.getElementById('severity').value = data.severity || 'P2';
                document.getElementById('sensitivityLevel').value = data.sensitivity_level || 'NORMAL';

                // 협업자
                if (data.collaborators && data.collaborators.length > 0) {
                    this.collaborators = data.collaborators.map(c => ({
                        id: c.collaborator_id,
                        name: c.collaborator_name || c.collaborator_id
                    }));
                    this.renderCollaborators();
                }
            } else {
                alert(result.message || '티켓 데이터를 불러오는데 실패했습니다.');
                window.location.href = '/pages/tickets/list.html';
            }
        } catch (error) {
            console.error('티켓 데이터 로드 오류:', error);
            alert('티켓 데이터를 불러오는 중 오류가 발생했습니다.');
            window.location.href = '/pages/tickets/list.html';
        }
    }

    addCollaborator() {
        const email = this.collaboratorInput.value.trim();
        
        if (!email) {
            alert('이메일을 입력하세요.');
            return;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('올바른 이메일 형식이 아닙니다.');
            return;
        }

        // 중복 확인
        if (this.collaborators.some(c => c.id === email || c.name === email)) {
            alert('이미 추가된 협업자입니다.');
            return;
        }

        // 협업자 추가
        this.collaborators.push({
            id: email,
            name: email
        });

        this.collaboratorInput.value = '';
        this.renderCollaborators();
    }

    removeCollaborator(index) {
        this.collaborators.splice(index, 1);
        this.renderCollaborators();
    }

    renderCollaborators() {
        if (this.collaborators.length === 0) {
            this.collaboratorsList.innerHTML = '<div class="text-muted small">추가된 협업자가 없습니다.</div>';
            return;
        }

        this.collaboratorsList.innerHTML = this.collaborators.map((collab, index) => `
            <span class="collaborator-tag">
                <i class="fas fa-user"></i>
                <span>${this.escapeHtml(collab.name || collab.id)}</span>
                <span class="remove-btn" onclick="ticketForm.removeCollaborator(${index})">
                    <i class="fas fa-times"></i>
                </span>
            </span>
        `).join('');
    }

    async submitForm() {
        try {
            // 폼 유효성 검사
            if (!this.validateForm()) {
                return;
            }

            // 폼 데이터 수집
            const formData = this.collectFormData();

            // 로딩 표시
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';

            try {
                const url = this.ticketId 
                    ? `/api/tickets/${this.ticketId}` 
                    : '/api/tickets';
                
                const method = this.ticketId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    alert(this.ticketId ? '티켓이 수정되었습니다.' : '티켓이 생성되었습니다.');
                    window.location.href = `/pages/tickets/detail.html?id=${result.data.id || this.ticketId}`;
                } else {
                    alert(result.message || '티켓 저장에 실패했습니다.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (error) {
                console.error('티켓 저장 오류:', error);
                alert('티켓 저장 중 오류가 발생했습니다.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('폼 제출 오류:', error);
            alert('폼 제출 중 오류가 발생했습니다.');
        }
    }

    validateForm() {
        // 필수 필드 검증
        const ticketType = document.getElementById('ticketType').value;
        const title = document.getElementById('title').value.trim();

        if (!ticketType) {
            alert('티켓 유형을 선택하세요.');
            document.getElementById('ticketType').focus();
            return false;
        }

        if (!title) {
            alert('제목을 입력하세요.');
            document.getElementById('title').focus();
            return false;
        }

        return true;
    }

    collectFormData() {
        const formData = {
            ticket_type_code: document.getElementById('ticketType').value,
            title: document.getElementById('title').value.trim(),
            priority: document.getElementById('priority').value,
            description: document.getElementById('description').value.trim() || null,
            amount: document.getElementById('amount').value ? parseFloat(document.getElementById('amount').value) : null,
            severity: document.getElementById('severity').value,
            sensitivity_level: document.getElementById('sensitivityLevel').value
        };

        // 담당자
        const ownerId = document.getElementById('ownerId').value.trim();
        if (ownerId) {
            formData.owner_id = ownerId;
        }

        // 마감일
        const dueDate = document.getElementById('dueDate').value;
        if (dueDate) {
            formData.due_date = new Date(dueDate).toISOString();
        }

        // 협업자 (수정 모드에서만)
        if (this.ticketId && this.collaborators.length > 0) {
            formData.collaborators = this.collaborators.map(c => c.id);
        }

        return formData;
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
let ticketForm;
document.addEventListener('DOMContentLoaded', () => {
    ticketForm = new TicketForm();
    window.ticketForm = ticketForm;
});

