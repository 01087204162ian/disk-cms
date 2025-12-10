// 네임스페이스를 사용하여 변수 충돌 방지
window.PharmacyModal = (function() {
    'use strict';

    // 프라이빗 변수들
    let customerCurrentPage = 1;
    let customerCurrentSearch = '';
    let customerIsIdChecked = false;
    let customerIsNewIdChecked = false;
    const CUSTOMER_API_BASE_URL = '/api/pharmacy2';

    // 메인 함수 - showCompanyListModal()로 변경 (안전성 개선)
    function showCompanyListModal() {
        // 모달 요소 존재 확인
        const modalElement = document.getElementById('customerListModal');
        if (!modalElement) {
            console.error('customerListModal 요소를 찾을 수 없습니다.');
            alert('업체 관리 모달을 찾을 수 없습니다.');
            return;
        }

        // jQuery Bootstrap 4 방식 시도
        if (typeof $ !== 'undefined' && $.fn.modal) {
            $('#customerListModal').modal('show');
        } else if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            // Bootstrap 5 방식
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            // 수동으로 모달 표시
            modalElement.classList.add('show');
            modalElement.style.display = 'block';
            modalElement.setAttribute('aria-hidden', 'false');
            modalElement.setAttribute('aria-modal', 'true');
            
            // 백드롭 추가
            if (!document.querySelector('.modal-backdrop')) {
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
            
            document.body.classList.add('modal-open');
        }
        
        // 모달이 열리면 데이터 로드
        loadCustomerList();
        
        // 검색 이벤트 리스너 (중복 방지)
        const searchInput = document.getElementById('customerSearch');
        if (searchInput && !searchInput.hasEventListener) {
            searchInput.addEventListener('input', function() {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    customerCurrentSearch = this.value.trim();
                    customerCurrentPage = 1;
                    loadCustomerList();
                }, 500);
            });
            searchInput.hasEventListener = true;
        }
    }

    // 업체 리스트 로드
    async function loadCustomerList() {
        const tableBody = document.getElementById('customerTableBody');
        const mobileCards = document.getElementById('customerMobileCards');
        const loading = document.getElementById('customerLoading');
        const empty = document.getElementById('customerEmpty');
        const paginationInfo = document.getElementById('customerPaginationInfo');
        const pagination = document.getElementById('customerPagination');

        // 로딩 표시
        loading.style.display = 'flex';
        empty.style.display = 'none';
        tableBody.innerHTML = '';
        mobileCards.innerHTML = '';

        try {
            const params = new URLSearchParams({
                page: customerCurrentPage,
                limit: 20,
                search: customerCurrentSearch
            });

            const response = await fetch(`${CUSTOMER_API_BASE_URL}/customers?${params}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '데이터를 불러오는데 실패했습니다.');
            }

            const { data, pagination: paginationData } = result;

            if (data.length === 0) {
                loading.style.display = 'none';
                empty.style.display = 'block';
                paginationInfo.textContent = '';
                pagination.innerHTML = '';
                return;
            }

            // 데스크톱 테이블 렌더링
            tableBody.innerHTML = data.map(customer => `
                <tr>
                    <td>${customer.num}</td>
                    <td class="text-left">${customer.name}</td>
                    <td>${customer.mem_id}</td>
                    <td>${customer.hphone1}</td>
                    <td>${customer.wdate}</td>
                    <td>
                        <div class="action-buttons">
                            <button type="button" class="btn btn-outline-info btn-sm" onclick="PharmacyModal.viewCustomerDetail(${customer.num})">
                                <i class="fas fa-eye me-1"></i>상세
                            </button>
                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="PharmacyModal.editCustomerDetail(${customer.num})">
                                <i class="fas fa-edit me-1"></i>수정
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // 모바일 카드 렌더링
            mobileCards.innerHTML = data.map(customer => `
                <div class="customer-mobile-card">
                    <div class="mobile-card-header">
                        <div class="mobile-card-title">${customer.name}</div>
                        <div class="mobile-card-subtitle">업체번호: ${customer.num}</div>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">아이디</span>
                        <span class="mobile-card-value">${customer.mem_id}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">연락처</span>
                        <span class="mobile-card-value">${customer.hphone1}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">등록일</span>
                        <span class="mobile-card-value">${customer.wdate}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">관리</span>
                        <div class="mobile-card-value">
                            <div class="action-buttons">
                                <button type="button" class="btn btn-outline-info btn-sm" onclick="PharmacyModal.viewCustomerDetail(${customer.num})">
                                    <i class="fas fa-eye me-1"></i>상세
                                </button>
                                <button type="button" class="btn btn-outline-primary btn-sm" onclick="PharmacyModal.editCustomerDetail(${customer.num})">
                                    <i class="fas fa-edit me-1"></i>수정
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            // 페이지네이션 정보 업데이트
            const startItem = ((paginationData.current_page - 1) * 20) + 1;
            const endItem = Math.min(startItem + data.length - 1, paginationData.total_count);
            paginationInfo.textContent = `${startItem}-${endItem} / 총 ${paginationData.total_count}개`;

            // 페이지네이션 렌더링
            renderCustomerPagination(paginationData);

        } catch (error) {
            console.error('업체 리스트 로드 오류:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${error.message}
                    </td>
                </tr>
            `;
            mobileCards.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${error.message}
                </div>
            `;
        } finally {
            loading.style.display = 'none';
        }
    }

    // 페이지네이션 렌더링
    function renderCustomerPagination(paginationData) {
        const pagination = document.getElementById('customerPagination');
        const { current_page, total_pages, has_prev, has_next } = paginationData;

        if (total_pages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // 이전 버튼
        if (has_prev) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="PharmacyModal.goToCustomerPage(${current_page - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
            `;
        }

        // 페이지 번호들
        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);

        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="PharmacyModal.goToCustomerPage(1)">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="PharmacyModal.goToCustomerPage(${i})">${i}</a>
                </li>
            `;
        }

        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="PharmacyModal.goToCustomerPage(${total_pages})">${total_pages}</a>
                </li>
            `;
        }

        // 다음 버튼
        if (has_next) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="PharmacyModal.goToCustomerPage(${current_page + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>
            `;
        }

        pagination.innerHTML = paginationHTML;
    }

    // 페이지 이동
    function goToCustomerPage(page) {
        customerCurrentPage = page;
        loadCustomerList();
    }

    // 새로고침
    function refreshCustomerList() {
        customerCurrentPage = 1;
        customerCurrentSearch = '';
        const searchInput = document.getElementById('customerSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        loadCustomerList();
    }

    // 업체 상세 보기 (안전성 개선)
    async function viewCustomerDetail(num) {
        try {
            const response = await fetch(`${CUSTOMER_API_BASE_URL}/customers/${num}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '업체 정보를 불러오는데 실패했습니다.');
            }

            const customer = result.data;
            
            // 폼 요소들 안전하게 설정
            const setFieldValue = (id, value) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value || '';
                }
            };

            setFieldValue('customerNum', customer.num);
            setFieldValue('customerMemId', customer.mem_id);
            setFieldValue('customerName', customer.name);
            setFieldValue('customerHphone', customer.hphone1);
            setFieldValue('customerWdate', customer.wdate);
            setFieldValue('customerPasswd', '');

            // 읽기 모드로 설정
            setCustomerFormReadonly(true);
            
            const editBtn = document.getElementById('editCustomerBtn');
            const saveBtn = document.getElementById('saveCustomerBtn');
            if (editBtn) editBtn.style.display = 'inline-block';
            if (saveBtn) saveBtn.style.display = 'none';

            // 모달 제목 변경
            const modalLabel = document.getElementById('customerDetailModalLabel');
            if (modalLabel) {
                modalLabel.innerHTML = `
                    <i class="fas fa-building me-2"></i>업체 정보 - ${customer.name}
                `;
            }

            // 모달 표시
            const modalElement = document.getElementById('customerDetailModal');
            if (modalElement) {
                if (typeof $ !== 'undefined' && $.fn.modal) {
                    $('#customerDetailModal').modal('show');
                } else if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    modalElement.style.display = 'block';
                    modalElement.classList.add('show');
                }
            }

        } catch (error) {
            console.error('업체 상세 조회 오류:', error);
            alert('업체 정보를 불러오는데 실패했습니다: ' + error.message);
        }
    }

    // 업체 수정 모드
    async function editCustomerDetail(num) {
        await viewCustomerDetail(num); // 먼저 데이터 로드
        
        // 수정 모드로 전환
        setCustomerFormReadonly(false);
        document.getElementById('editCustomerBtn').style.display = 'none';
        document.getElementById('saveCustomerBtn').style.display = 'inline-block';
        
        // 모달 제목 변경
        const customer = {
            name: document.getElementById('customerName').value
        };
        document.getElementById('customerDetailModalLabel').innerHTML = `
            <i class="fas fa-edit me-2"></i>업체 수정 - ${customer.name}
        `;
        
        customerIsIdChecked = true; // 기존 아이디는 검증된 것으로 간주
    }

    // 폼 읽기/쓰기 모드 전환
    function setCustomerFormReadonly(readonly) {
        const fields = ['customerMemId', 'customerName', 'customerHphone', 'customerPasswd'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.readOnly = readonly;
            }
        });
        
        // 아이디 중복확인 버튼 표시/숨김
        const checkBtn = document.getElementById('checkIdBtn');
        if (checkBtn) {
            checkBtn.style.display = readonly ? 'none' : 'inline-block';
        }
    }

    // 수정 모드 토글
    function toggleCustomerEdit() {
        const nameField = document.getElementById('customerName');
        if (!nameField) return;
        
        const isReadonly = nameField.readOnly;
        
        if (isReadonly) {
            // 수정 모드로 전환
            setCustomerFormReadonly(false);
            document.getElementById('editCustomerBtn').style.display = 'none';
            document.getElementById('saveCustomerBtn').style.display = 'inline-block';
            customerIsIdChecked = true; // 기존 아이디는 검증된 것으로 간주
        } else {
            // 읽기 모드로 전환
            setCustomerFormReadonly(true);
            document.getElementById('editCustomerBtn').style.display = 'inline-block';
            document.getElementById('saveCustomerBtn').style.display = 'none';
        }
    }

    // 업체 정보 저장
    async function saveCustomer() {
        const form = document.getElementById('customerDetailForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const num = formData.get('num');
        
        // 유효성 검사
        if (!formData.get('name').trim()) {
            alert('업체명을 입력해주세요.');
            return;
        }
        
        if (!formData.get('hphone1').trim()) {
            alert('연락처를 입력해주세요.');
            return;
        }

        // 연락처 형식 검사
        const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
        if (!phoneRegex.test(formData.get('hphone1'))) {
            alert('연락처는 010-0000-0000 형식으로 입력해주세요.');
            return;
        }

        try {
            const updateData = {
                num: parseInt(num),
                name: formData.get('name').trim(),
                hphone1: formData.get('hphone1').trim()
            };

            // 아이디가 변경된 경우
            const originalId = document.getElementById('customerMemId').dataset.original;
            if (formData.get('mem_id') !== originalId && !customerIsIdChecked) {
                alert('변경된 아이디의 중복확인을 해주세요.');
                return;
            }

            if (formData.get('mem_id').trim()) {
                updateData.mem_id = formData.get('mem_id').trim();
            }

            // 비밀번호가 입력된 경우에만 포함
            if (formData.get('passwd').trim()) {
                updateData.passwd = formData.get('passwd').trim();
            }

            const response = await fetch(`${CUSTOMER_API_BASE_URL}/customers/${num}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '업체 정보 수정에 실패했습니다.');
            }

            alert('업체 정보가 성공적으로 수정되었습니다.');
            
            // 모달 닫기 및 리스트 새로고침
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('customerDetailModal'));
            if (modalInstance) {
                modalInstance.hide();
            }
            loadCustomerList();

        } catch (error) {
            console.error('업체 정보 저장 오류:', error);
            alert('업체 정보 저장에 실패했습니다: ' + error.message);
        }
    }

    // 아이디 중복확인 (수정 모드)
    async function checkCustomerId() {
        const memIdField = document.getElementById('customerMemId');
        if (!memIdField) return;
        
        const memId = memIdField.value.trim();
        
        if (!memId) {
            alert('아이디를 입력해주세요.');
            return;
        }

        // 아이디 형식 검증
        const idRegex = /^[a-zA-Z0-9_.-]{3,50}$/;
        if (!idRegex.test(memId)) {
            alert('아이디는 3-50자의 영문, 숫자, _, -, . 만 사용 가능합니다.');
            return;
        }

        try {
            const response = await fetch(`${CUSTOMER_API_BASE_URL}/check-id?mem_id=${encodeURIComponent(memId)}`);
            const result = await response.json();

            const resultDiv = document.getElementById('idCheckResult');
            if (!resultDiv) return;
            
            if (result.success && result.available) {
                resultDiv.innerHTML = '<span class="text-success"><i class="fas fa-check me-1"></i>사용 가능한 아이디입니다.</span>';
                customerIsIdChecked = true;
            } else {
                resultDiv.innerHTML = '<span class="text-danger"><i class="fas fa-times me-1"></i>이미 사용중인 아이디입니다.</span>';
                customerIsIdChecked = false;
            }

        } catch (error) {
            console.error('아이디 중복확인 오류:', error);
            alert('아이디 중복확인에 실패했습니다: ' + error.message);
        }
    }

    // 새 업체 추가 모달 표시 (안전성 개선)
    function showCustomerCreateModal() {
        // 폼 초기화
        const form = document.getElementById('customerCreateForm');
        if (form) {
            form.reset();
        }
        
        const resultDiv = document.getElementById('newIdCheckResult');
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }
        
        customerIsNewIdChecked = false;

        // 모달 표시
        const modalElement = document.getElementById('customerCreateModal');
        if (modalElement) {
            if (typeof $ !== 'undefined' && $.fn.modal) {
                $('#customerCreateModal').modal('show');
            } else if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
                
                // 백드롭 추가
                if (!document.querySelector('.modal-backdrop')) {
                    const backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade show';
                    document.body.appendChild(backdrop);
                }
                
                document.body.classList.add('modal-open');
            }
        } else {
            console.error('customerCreateModal 요소를 찾을 수 없습니다.');
            alert('업체 추가 모달을 찾을 수 없습니다.');
        }
    }

    // 새 업체 아이디 중복확인
    async function checkNewCustomerId() {
        const memIdField = document.getElementById('newCustomerMemId');
        if (!memIdField) return;
        
        const memId = memIdField.value.trim();
        
        if (!memId) {
            alert('아이디를 입력해주세요.');
            return;
        }

        // 아이디 형식 검증
        const idRegex = /^[a-zA-Z0-9_.-]{3,50}$/;
        if (!idRegex.test(memId)) {
            alert('아이디는 3-50자의 영문, 숫자, _, -, . 만 사용 가능합니다.');
            return;
        }

        try {
            const response = await fetch(`${CUSTOMER_API_BASE_URL}/check-id?mem_id=${encodeURIComponent(memId)}`);
            const result = await response.json();

            const resultDiv = document.getElementById('newIdCheckResult');
            if (!resultDiv) return;
            
            if (result.success && result.available) {
                resultDiv.innerHTML = '<span class="text-success"><i class="fas fa-check me-1"></i>사용 가능한 아이디입니다.</span>';
                customerIsNewIdChecked = true;
            } else {
                resultDiv.innerHTML = '<span class="text-danger"><i class="fas fa-times me-1"></i>이미 사용중인 아이디입니다.</span>';
                customerIsNewIdChecked = false;
            }

        } catch (error) {
            console.error('아이디 중복확인 오류:', error);
            alert('아이디 중복확인에 실패했습니다: ' + error.message);
        }
    }

    // 새 업체 등록
    async function createCustomer() {
        const form = document.getElementById('customerCreateForm');
        if (!form) return;
        
        const formData = new FormData(form);

        // 유효성 검사
        if (!formData.get('mem_id').trim()) {
            alert('아이디를 입력해주세요.');
            return;
        }

        if (!customerIsNewIdChecked) {
            alert('아이디 중복확인을 해주세요.');
            return;
        }

        if (!formData.get('name').trim()) {
            alert('업체명을 입력해주세요.');
            return;
        }

        if (!formData.get('hphone1').trim()) {
            alert('연락처를 입력해주세요.');
            return;
        }

        if (!formData.get('passwd').trim()) {
            alert('비밀번호를 입력해주세요.');
            return;
        }

        // 연락처 형식 검사
        const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
        if (!phoneRegex.test(formData.get('hphone1'))) {
            alert('연락처는 010-0000-0000 형식으로 입력해주세요.');
            return;
        }

        try {
            const customerData = {
                mem_id: formData.get('mem_id').trim(),
                name: formData.get('name').trim(),
                hphone1: formData.get('hphone1').trim(),
                passwd: formData.get('passwd').trim()
            };

            const response = await fetch(`${CUSTOMER_API_BASE_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customerData)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '업체 등록에 실패했습니다.');
            }

            alert('업체가 성공적으로 등록되었습니다.');
            
            // 모달 닫기 및 리스트 새로고침
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('customerCreateModal'));
            if (modalInstance) {
                modalInstance.hide();
            }
            loadCustomerList();

        } catch (error) {
            console.error('업체 등록 오류:', error);
            alert('업체 등록에 실패했습니다: ' + error.message);
        }
    }

    // 연락처 자동 포맷팅
    function formatPhoneNumber(input) {
        const value = input.value.replace(/[^\d]/g, '');
        const formatted = value.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
        if (formatted.length <= 13) {
            input.value = formatted;
        }
    }

    // 모달 닫기 함수 (Bootstrap 4 호환)
    function closeModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.warn(`Modal element with ID '${modalId}' not found`);
            return;
        }

        try {
            // jQuery Bootstrap 4 방식 먼저 시도
            if (typeof $ !== 'undefined' && $.fn.modal) {
                $('#' + modalId).modal('hide');
                return;
            }

            // Bootstrap 5 방식 시도
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                if (typeof bootstrap.Modal.getInstance === 'function') {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    } else {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.hide();
                    }
                } else {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.hide();
                }
                return;
            }

            // 수동 처리 (폴백)
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
            
            // 백드롭 제거
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            // body 클래스 제거
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

        } catch (error) {
            console.error('Modal close error:', error);
            
            // 강제 폴백
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
            
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    }

    // 초기화 함수
    function init() {
        // DOM이 로드된 후 이벤트 리스너 추가
        document.addEventListener('DOMContentLoaded', function() {
            // 기존 업체 연락처
            const customerHphone = document.getElementById('customerHphone');
            if (customerHphone && !customerHphone.hasEventListener) {
                customerHphone.addEventListener('input', function() {
                    formatPhoneNumber(this);
                });
                customerHphone.hasEventListener = true;
            }

            // 새 업체 연락처
            const newCustomerHphone = document.getElementById('newCustomerHphone');
            if (newCustomerHphone && !newCustomerHphone.hasEventListener) {
                newCustomerHphone.addEventListener('input', function() {
                    formatPhoneNumber(this);
                });
                newCustomerHphone.hasEventListener = true;
            }

            // 아이디 입력시 중복확인 상태 초기화
            const customerMemId = document.getElementById('customerMemId');
            if (customerMemId && !customerMemId.hasEventListener) {
                customerMemId.addEventListener('input', function() {
                    customerIsIdChecked = false;
                    const resultDiv = document.getElementById('idCheckResult');
                    if (resultDiv) {
                        resultDiv.innerHTML = '';
                    }
                });
                customerMemId.hasEventListener = true;
            }

            const newCustomerMemId = document.getElementById('newCustomerMemId');
            if (newCustomerMemId && !newCustomerMemId.hasEventListener) {
                newCustomerMemId.addEventListener('input', function() {
                    customerIsNewIdChecked = false;
                    const resultDiv = document.getElementById('newIdCheckResult');
                    if (resultDiv) {
                        resultDiv.innerHTML = '';
                    }
                });
                newCustomerMemId.hasEventListener = true;
            }
        });
    }

    // 즉시 초기화 실행
    init();

    // Public API 반환
    return {
        // 메인 함수
        showCompanyListModal: showCompanyListModal,
        
        // 공개 함수들
        viewCustomerDetail: viewCustomerDetail,
        editCustomerDetail: editCustomerDetail,
        toggleCustomerEdit: toggleCustomerEdit,
        saveCustomer: saveCustomer,
        checkCustomerId: checkCustomerId,
        showCustomerCreateModal: showCustomerCreateModal,
        checkNewCustomerId: checkNewCustomerId,
        createCustomer: createCustomer,
        goToCustomerPage: goToCustomerPage,
        refreshCustomerList: refreshCustomerList,
        closeModal: closeModal
    };

})();

// 전역 함수로 노출 (기존 코드와의 호환성)
window.showCompanyListModal = window.PharmacyModal.showCompanyListModal;
window.viewCustomerDetail = window.PharmacyModal.viewCustomerDetail;
window.editCustomerDetail = window.PharmacyModal.editCustomerDetail;
window.toggleCustomerEdit = window.PharmacyModal.toggleCustomerEdit;
window.saveCustomer = window.PharmacyModal.saveCustomer;
window.checkCustomerId = window.PharmacyModal.checkCustomerId;
window.showCustomerCreateModal = window.PharmacyModal.showCustomerCreateModal;
window.checkNewCustomerId = window.PharmacyModal.checkNewCustomerId;
window.createCustomer = window.PharmacyModal.createCustomer;