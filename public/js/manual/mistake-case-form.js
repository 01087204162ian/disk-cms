// ==============================
// js/manual/mistake-case-form.js - 실수 사례 등록/수정 폼
// ==============================

class MistakeCaseForm {
    constructor() {
        this.caseId = null;
        this.checklistCount = 1;
        this.files = [];
        this.init();
    }

    async init() {
        try {
            // URL에서 ID 가져오기 (수정 모드)
            const urlParams = new URLSearchParams(window.location.search);
            this.caseId = urlParams.get('id');

            // DOM 요소 참조
            this.initDOMElements();
            
            // 이벤트 리스너 등록
            this.attachEventListeners();
            
            // 수정 모드인 경우 데이터 로드
            if (this.caseId) {
                await this.loadCaseData();
                document.getElementById('formTitle').textContent = '실수 사례 수정';
                document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-check"></i> 수정';
            }
            
            console.log('실수 사례 폼 초기화 완료');
        } catch (error) {
            console.error('실수 사례 폼 초기화 실패:', error);
            this.showError('페이지 로드 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        this.form = document.getElementById('mistakeCaseForm');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.checklistContainer = document.getElementById('checklistContainer');
        this.saveDraftBtn = document.getElementById('saveDraftBtn');
    }

    attachEventListeners() {
        // 폼 제출
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });

        // 파일 선택
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // 임시 저장
        this.saveDraftBtn.addEventListener('click', () => {
            this.saveDraft();
        });
    }

    async loadCaseData() {
        try {
            const response = await fetch(`/api/manual/mistake-cases/${this.caseId}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                const data = result.data;
                
                // 기본 정보
                document.getElementById('title').value = data.title || '';
                document.getElementById('category').value = data.category || '';
                document.getElementById('severity').value = data.severity || 'medium';
                
                // 태그
                if (data.tags && data.tags.length > 0) {
                    document.getElementById('tags').value = data.tags.join(', ');
                }

                // 개요
                document.getElementById('workContent').value = data.work_content || '';
                document.getElementById('mistakeDescription').value = data.mistake_description || '';
                document.getElementById('resultDescription').value = data.result_description || '';

                // 원인 분석
                document.getElementById('surfaceCauses').value = data.surface_causes || '';
                document.getElementById('rootCauses').value = data.root_causes || '';
                document.getElementById('structuralIssues').value = data.structural_issues || '';

                // 개선 방안
                document.getElementById('improvementMeasures').value = data.improvement_measures || '';

                // 체크리스트
                if (data.checklist_items && data.checklist_items.length > 0) {
                    this.renderChecklist(data.checklist_items);
                }

                // 첨부 파일
                if (data.files && data.files.length > 0) {
                    this.files = data.files;
                    this.renderFileList();
                }
            } else {
                alert(result.error || '데이터를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    async submitForm() {
        try {
            // 폼 유효성 검사
            if (!this.validateForm()) {
                return;
            }

            // 폼 데이터 수집
            const formData = this.collectFormData();

            // 파일이 있으면 FormData 사용, 없으면 JSON 사용
            let response;
            if (this.files.length > 0 && this.files.some(f => f instanceof File)) {
                const formDataObj = new FormData();
                formDataObj.append('data', JSON.stringify(formData));
                
                this.files.forEach((file, index) => {
                    if (file instanceof File) {
                        formDataObj.append(`files`, file);
                    }
                });

                response = await fetch(
                    this.caseId 
                        ? `/api/manual/mistake-cases/${this.caseId}` 
                        : '/api/manual/mistake-cases',
                    {
                        method: this.caseId ? 'PUT' : 'POST',
                        credentials: 'include',
                        body: formDataObj
                    }
                );
            } else {
                response = await fetch(
                    this.caseId 
                        ? `/api/manual/mistake-cases/${this.caseId}` 
                        : '/api/manual/mistake-cases',
                    {
                        method: this.caseId ? 'PUT' : 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify(formData)
                    }
                );
            }

            const result = await response.json();

            if (result.success) {
                alert(this.caseId ? '실수 사례가 수정되었습니다.' : '실수 사례가 등록되었습니다.');
                window.location.href = `/pages/manual/mistake-case-detail.html?id=${result.data.id || this.caseId}`;
            } else {
                alert(result.error || '저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('폼 제출 오류:', error);
            alert('저장 중 오류가 발생했습니다.');
        }
    }

    collectFormData() {
        // 태그 파싱
        const tagsInput = document.getElementById('tags').value;
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        // 체크리스트 수집
        const checklistItems = this.collectChecklist();

        return {
            title: document.getElementById('title').value.trim(),
            category: document.getElementById('category').value,
            severity: document.getElementById('severity').value,
            tags: tags,
            work_content: document.getElementById('workContent').value.trim(),
            mistake_description: document.getElementById('mistakeDescription').value.trim(),
            result_description: document.getElementById('resultDescription').value.trim(),
            surface_causes: document.getElementById('surfaceCauses').value.trim(),
            root_causes: document.getElementById('rootCauses').value.trim(),
            structural_issues: document.getElementById('structuralIssues').value.trim(),
            improvement_measures: document.getElementById('improvementMeasures').value.trim(),
            checklist_items: checklistItems
        };
    }

    collectChecklist() {
        const checklists = [];
        const checklistCards = this.checklistContainer.querySelectorAll('.card');

        checklistCards.forEach(card => {
            const titleInput = card.querySelector('input[placeholder*="제목"]');
            const items = card.querySelectorAll('input[placeholder*="체크리스트 항목"]');
            
            const title = titleInput ? titleInput.value.trim() : '';
            const itemValues = Array.from(items)
                .map(input => input.value.trim())
                .filter(value => value);

            if (itemValues.length > 0) {
                if (title) {
                    checklists.push({
                        title: title,
                        items: itemValues
                    });
                } else {
                    checklists.push(...itemValues);
                }
            }
        });

        return checklists;
    }

    validateForm() {
        const title = document.getElementById('title').value.trim();
        const category = document.getElementById('category').value;
        const mistakeDescription = document.getElementById('mistakeDescription').value.trim();
        const rootCauses = document.getElementById('rootCauses').value.trim();

        if (!title) {
            alert('제목을 입력하세요.');
            document.getElementById('title').focus();
            return false;
        }

        if (!category) {
            alert('업무 영역을 선택하세요.');
            document.getElementById('category').focus();
            return false;
        }

        if (!mistakeDescription) {
            alert('발생한 실수를 입력하세요.');
            document.getElementById('mistakeDescription').focus();
            return false;
        }

        if (!rootCauses) {
            alert('근본 원인을 입력하세요.');
            document.getElementById('rootCauses').focus();
            return false;
        }

        return true;
    }

    addChecklist() {
        const checklistHTML = `
            <div class="card mb-2" id="checklist_${this.checklistCount}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <input type="text" class="form-control form-control-sm" placeholder="체크리스트 제목 (선택사항)" id="checklistTitle_${this.checklistCount}">
                        <button type="button" class="btn btn-sm btn-danger ms-2" onclick="mistakeCaseForm.removeChecklist(${this.checklistCount})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div id="checklistItems_${this.checklistCount}">
                        <div class="input-group mb-2">
                            <input type="text" class="form-control form-control-sm" placeholder="체크리스트 항목">
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="mistakeCaseForm.removeChecklistItem(${this.checklistCount}, 0)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="mistakeCaseForm.addChecklistItem(${this.checklistCount})">
                        <i class="fas fa-plus"></i> 항목 추가
                    </button>
                </div>
            </div>
        `;

        this.checklistContainer.insertAdjacentHTML('beforeend', checklistHTML);
        this.checklistCount++;
    }

    addChecklistItem(checklistId) {
        const itemsContainer = document.getElementById(`checklistItems_${checklistId}`);
        const itemCount = itemsContainer.children.length;
        
        const itemHTML = `
            <div class="input-group mb-2">
                <input type="text" class="form-control form-control-sm" placeholder="체크리스트 항목">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="mistakeCaseForm.removeChecklistItem(${checklistId}, ${itemCount})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        itemsContainer.insertAdjacentHTML('beforeend', itemHTML);
    }

    removeChecklist(checklistId) {
        const checklist = document.getElementById(`checklist_${checklistId}`);
        if (checklist) {
            checklist.remove();
        }
    }

    removeChecklistItem(checklistId, itemIndex) {
        const itemsContainer = document.getElementById(`checklistItems_${checklistId}`);
        const items = itemsContainer.children;
        if (items[itemIndex]) {
            items[itemIndex].remove();
        }
    }

    renderChecklist(checklistItems) {
        this.checklistContainer.innerHTML = '';
        this.checklistCount = 0;

        checklistItems.forEach((item, index) => {
            if (typeof item === 'string') {
                // 단순 문자열 항목
                this.addChecklist();
                const itemsContainer = document.getElementById(`checklistItems_${this.checklistCount - 1}`);
                const input = itemsContainer.querySelector('input');
                if (input) input.value = item;
            } else if (item.title && item.items) {
                // 제목과 항목이 있는 경우
                this.addChecklist();
                const titleInput = document.getElementById(`checklistTitle_${this.checklistCount - 1}`);
                if (titleInput) titleInput.value = item.title;

                const itemsContainer = document.getElementById(`checklistItems_${this.checklistCount - 1}`);
                itemsContainer.innerHTML = '';
                
                item.items.forEach((subItem, subIndex) => {
                    this.addChecklistItem(this.checklistCount - 1);
                    const inputs = itemsContainer.querySelectorAll('input');
                    if (inputs[subIndex]) inputs[subIndex].value = subItem;
                });
            }
        });
    }

    handleFileSelect(fileList) {
        Array.from(fileList).forEach(file => {
            this.files.push(file);
        });
        this.renderFileList();
    }

    renderFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = '<div class="text-muted">첨부된 파일이 없습니다.</div>';
            return;
        }

        const filesHTML = this.files.map((file, index) => {
            const fileName = file.name || file.file_name || '파일';
            const fileSize = file.size || file.file_size || 0;
            return `
                <div class="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
                    <div>
                        <i class="fas fa-file me-2"></i>
                        <span>${this.escapeHtml(fileName)}</span>
                        <small class="text-muted ms-2">${this.formatFileSize(fileSize)}</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger" onclick="mistakeCaseForm.removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');

        this.fileList.innerHTML = filesHTML;
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.renderFileList();
    }

    saveDraft() {
        // 로컬 스토리지에 임시 저장
        const formData = this.collectFormData();
        localStorage.setItem('mistakeCaseDraft', JSON.stringify(formData));
        alert('임시 저장되었습니다.');
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
let mistakeCaseForm;
document.addEventListener('DOMContentLoaded', () => {
    mistakeCaseForm = new MistakeCaseForm();
    window.mistakeCaseForm = mistakeCaseForm;
});

