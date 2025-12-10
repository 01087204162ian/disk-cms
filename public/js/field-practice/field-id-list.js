// ========== 전역 변수 ==========
    let currentPage = 1;
    let totalPages = 1;
    let pageSize = 15;
    let isEditMode = false;

    // ========== 페이지 초기화 ==========
    document.addEventListener('DOMContentLoaded', async function() {
      console.log('선생님 계정 관리 페이지가 로드되었습니다.');
      await window.sjTemplateLoader.initializePage('field-practice-id');
      
      // 이벤트 리스너 등록
      initEventListeners();
      
      // 초기 데이터 로드
      loadAccounts();
    });

    // ========== 이벤트 리스너 초기화 ==========
    function initEventListeners() {
      // 검색 버튼
      document.getElementById('search_btn')?.addEventListener('click', function() {
        currentPage = 1;
        loadAccounts();
      });

      // 엔터키 검색
      document.getElementById('search_word')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          currentPage = 1;
          loadAccounts();
        }
      });

      // 페이지 크기 변경
      document.getElementById('pageSize')?.addEventListener('change', function(e) {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        loadAccounts();
      });

      // 필터 변경
      document.getElementById('directoryFilter')?.addEventListener('change', function() {
        currentPage = 1;
        loadAccounts();
      });

      // 신규 등록 버튼
      document.getElementById('add_account_btn')?.addEventListener('click', openAddModal);

      // 저장 버튼
      document.getElementById('save_account_btn')?.addEventListener('click', saveAccount);

      // 담당자 변경 버튼
      document.getElementById('transfer_btn')?.addEventListener('click', processTransfer);
    }

    // ========== 계정 목록 로드 ==========
    async function loadAccounts() {
      try {
        showLoading();
        
        const searchType = document.getElementById('searchType').value;
        const searchWord = document.getElementById('search_word').value.trim();
        const directory = document.getElementById('directoryFilter').value;

        const params = new URLSearchParams({
          page: currentPage,
          pageSize: pageSize,
          searchType: searchType,
          searchWord: searchWord,
          directory: directory
        });

        const response = await fetch(`/api/field-practice/accounts?${params}`);
        
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        
        if (data.success) {
          renderAccountTable(data.accounts);
          renderAccountMobileCards(data.accounts);
          updatePagination(data.pagination);
        } else {
          showError(data.message || '데이터 로드 실패');
        }
      } catch (error) {
        console.error('계정 목록 로드 오류:', error);
        showError('서버와의 통신 중 오류가 발생했습니다.');
        
        // 에러 시 빈 테이블 표시
        document.getElementById('account_table_body').innerHTML = `
          <tr>
            <td colspan="8" class="text-center py-4 text-danger">
              <i class="fas fa-exclamation-triangle"></i> 데이터를 불러올 수 없습니다.
            </td>
          </tr>
        `;
      } finally {
        hideLoading();
      }
    }

    // ========== 테이블 렌더링 (데스크톱) ==========
    function renderAccountTable(accounts) {
      const tbody = document.getElementById('account_table_body');
      
      if (!accounts || accounts.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center py-4">
              <i class="fas fa-info-circle"></i> 검색 결과가 없습니다.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = accounts.map((account, index) => `
        <tr>
          <td class="text-center">
            <button class="mobile-card-number-btn" onclick="viewAccount(${account.num})">
              ${(currentPage - 1) * pageSize + index + 1}
            </button>
          </td>
          <td class="col-school-name">${escapeHtml(account.schoolName)}</td>
          <td class="text-center">${escapeHtml(account.mem_id)}</td>
          <td class="text-center">${escapeHtml(account.damdanga)}</td>
          <td class="text-center">${formatPhone(account.damdangat)}</td>
          <td class="text-center">${formatDate(account.wdate)}</td>
         
          <td class="text-center">
            <span class="badge bg-primary">${account.application_count || 0}</span>
          </td>
          <td class="text-center">
            <button class="btn btn-info btn-sm" onclick="viewAccount(${account.num})" title="상세보기">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-warning btn-sm" onclick="openTransferModal(${account.num})" title="담당자 변경">
              <i class="fas fa-exchange-alt"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    // ========== 모바일 카드 렌더링 ==========
    function renderAccountMobileCards(accounts) {
      const container = document.getElementById('account_mobile_cards');
      
      if (!accounts || accounts.length === 0) {
        container.innerHTML = `
          <div class="text-center py-4">
            <i class="fas fa-info-circle"></i> 검색 결과가 없습니다.
          </div>
        `;
        return;
      }

      container.innerHTML = accounts.map((account, index) => `
        <div class="mobile-card">
          <div class="mobile-card-header">
            <button class="mobile-card-number-btn" onclick="viewAccount(${account.num})">
              ${(currentPage - 1) * pageSize + index + 1}
            </button>
            <div class="mobile-card-title">${escapeHtml(account.schoolName)}</div>
          </div>
          <div class="mobile-card-body">
            <div class="mobile-card-row">
              <span class="mobile-card-label">아이디</span>
              <span class="mobile-card-value">${escapeHtml(account.mem_id)}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">담당자</span>
              <span class="mobile-card-value">${escapeHtml(account.damdanga)}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">연락처</span>
              <span class="mobile-card-value">${formatPhone(account.damdangat)}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">등록일</span>
              <span class="mobile-card-value">${formatDate(account.wdate)}</span>
            </div>
            
            <div class="mobile-card-row">
              <span class="mobile-card-label">신청건수</span>
              <span class="mobile-card-value">
                <span class="badge bg-primary">${account.application_count || 0}</span>
              </span>
            </div>
            <div class="mobile-card-row">
              <div class="btn-row">
                <button class="btn btn-info btn-sm" onclick="viewAccount(${account.num})">
                  <i class="fas fa-eye"></i> 상세보기
                </button>
                <button class="btn btn-warning btn-sm" onclick="openTransferModal(${account.num})">
                  <i class="fas fa-exchange-alt"></i> 변경
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }

    // ========== 페이지네이션 업데이트 ==========
    function updatePagination(pagination) {
      currentPage = pagination.currentPage;
      totalPages = pagination.totalPages;
      
      // 페이지 정보 표시
      document.getElementById('pagination_info').textContent = 
        `전체 ${pagination.totalCount}건 중 ${pagination.startIndex + 1}-${pagination.endIndex}번째`;

      // 페이지네이션 컨트롤 렌더링
      const controls = document.getElementById('pagination_controls');
      let html = '';

      // 이전 버튼
      html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
            <i class="fas fa-chevron-left"></i>
          </a>
        </li>
      `;

      // 페이지 번호
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1); return false;">1</a></li>`;
        if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }

      for (let i = startPage; i <= endPage; i++) {
        html += `
          <li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
          </li>
        `;
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
      }

      // 다음 버튼
      html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
            <i class="fas fa-chevron-right"></i>
          </a>
        </li>
      `;

      controls.innerHTML = html;
    }

    // ========== 페이지 이동 ==========
    function goToPage(page) {
      if (page < 1 || page > totalPages || page === currentPage) return;
      currentPage = page;
      loadAccounts();
    }

    // ========== 신규 등록 모달 열기 ==========
    function openAddModal() {
      isEditMode = false;
      document.getElementById('modal-title-text').textContent = '신규 계정 등록';
      document.getElementById('accountForm').reset();
      document.getElementById('account_num').value = '';
      document.getElementById('passwd').placeholder = '비밀번호를 입력하세요';
      document.getElementById('passwd').required = true;
      
      const modal = new bootstrap.Modal(document.getElementById('accountDetailModal'));
      modal.show();
    }

    // ========== 계정 상세보기/수정 ==========
    async function viewAccount(num) {
      try {
        showLoading();
        
        const response = await fetch(`/api/field-practice/accounts/${num}`);
        
        if (!response.ok) {
          throw new Error('계정 정보를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        
        if (data.success) {
          isEditMode = true;
          document.getElementById('modal-title-text').textContent = '계정 정보 수정';
          
          // 폼에 데이터 채우기
          document.getElementById('account_num').value = data.account.num;
          document.getElementById('schoolName').value = data.account.schoolName;
          document.getElementById('mem_id').value = data.account.mem_id;
          document.getElementById('damdanga').value = data.account.damdanga;
          document.getElementById('damdangat').value = data.account.damdangat;
          document.getElementById('idmail').value = data.account.idmail || '';
          document.getElementById('directory').value = data.account.directory;
          document.getElementById('bank').value = data.account.bank || '';
          document.getElementById('bankname').value = data.account.bankname || '';
          
          document.getElementById('passwd').value = '';
          document.getElementById('passwd').placeholder = '변경 시에만 입력';
          document.getElementById('passwd').required = false;
          
          const modal = new bootstrap.Modal(document.getElementById('accountDetailModal'));
          modal.show();
        } else {
          showError(data.message || '계정 정보 로드 실패');
        }
      } catch (error) {
        console.error('계정 정보 로드 오류:', error);
        showError('서버와의 통신 중 오류가 발생했습니다.');
      } finally {
        hideLoading();
      }
    }

    // ========== 계정 저장 (등록/수정) ==========
    async function saveAccount() {
      const form = document.getElementById('accountForm');
      
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      try {
        showLoading();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // 비밀번호가 비어있으면 제거 (수정 시)
        if (isEditMode && !data.passwd) {
          delete data.passwd;
        }

        const url = isEditMode ? `/api/field-practice/accounts/${data.num}` : '/api/field-practice/accounts';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
          showSuccess(isEditMode ? '계정 정보가 수정되었습니다.' : '새 계정이 등록되었습니다.');
          bootstrap.Modal.getInstance(document.getElementById('accountDetailModal')).hide();
          loadAccounts();
        } else {
          showError(result.message || '저장에 실패했습니다.');
        }
      } catch (error) {
        console.error('계정 저장 오류:', error);
        showError('서버와의 통신 중 오류가 발생했습니다.');
      } finally {
        hideLoading();
      }
    }

    // ========== 담당자 변경 모달 열기 ==========
    async function openTransferModal(oldNum) {
      try {
        showLoading();
        
        const response = await fetch(`/api/field-practice/accounts/${oldNum}`);
        
        if (!response.ok) {
          throw new Error('계정 정보를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        
        if (data.success) {
          document.getElementById('old_account_num').value = oldNum;
          document.getElementById('old_schoolName').textContent = data.account.schoolName;
          document.getElementById('old_mem_id').textContent = data.account.mem_id;
          document.getElementById('old_damdanga').textContent = data.account.damdanga;
          document.getElementById('old_count').textContent = data.account.application_count || 0;
          
          // 새 담당자 폼 초기화
          document.getElementById('transferForm').reset();
          
          const modal = new bootstrap.Modal(document.getElementById('transferModal'));
          modal.show();
        } else {
          showError(data.message || '계정 정보 로드 실패');
        }
      } catch (error) {
        console.error('계정 정보 로드 오류:', error);
        showError('서버와의 통신 중 오류가 발생했습니다.');
      } finally {
        hideLoading();
      }
    }

    // ========== 담당자 변경 처리 ==========
    async function processTransfer() {
      const form = document.getElementById('transferForm');
      
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (!confirm('담당자를 변경하시겠습니까?\n이전 담당자의 모든 신청 리스트가 새 담당자로 이관됩니다.')) {
        return;
      }

      try {
        showLoading();
        
        const data = {
          oldNum: document.getElementById('old_account_num').value,
          newMemId: document.getElementById('new_mem_id').value,
          newPasswd: document.getElementById('new_passwd').value,
          newDamdanga: document.getElementById('new_damdanga').value,
          newDamdangat: document.getElementById('new_damdangat').value,
          keepOldAccount: document.getElementById('keepOldAccount').checked
        };

        const response = await fetch('/api/field-practice/accounts/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
          showSuccess('담당자 변경이 완료되었습니다.');
          bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
          loadAccounts();
        } else {
          showError(result.message || '담당자 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('담당자 변경 오류:', error);
        showError('서버와의 통신 중 오류가 발생했습니다.');
      } finally {
        hideLoading();
      }
    }

    // ========== 유틸리티 함수 ==========
    function escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function formatPhone(phone) {
      if (!phone) return '';
      return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }

    function formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\. /g, '-').replace('.', '');
    }

    function showLoading() {
      document.getElementById('loadingOverlay').style.display = 'flex';
    }

    function hideLoading() {
      document.getElementById('loadingOverlay').style.display = 'none';
    }

    function showSuccess(message) {
      alert(message); // 실제로는 toast나 더 나은 알림 사용
    }

    function showError(message) {
      alert('오류: ' + message); // 실제로는 toast나 더 나은 알림 사용
    }