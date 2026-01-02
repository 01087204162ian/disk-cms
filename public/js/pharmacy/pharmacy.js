 // 전역 변수
    let currentPage = 1;
    let currentPageSize = 20;
    let currentSearchTerm = '';
    let currentStatusFilter = '13';
    let currentAccountFilter = ''; // 거래처 필터 추가
    
    // localStorage 키
    const STORAGE_KEY_PAGE = 'pharmacy_current_page';
    const STORAGE_KEY_PAGE_SIZE = 'pharmacy_page_size';
    const STORAGE_KEY_STATUS_FILTER = 'pharmacy_status_filter';
    const STORAGE_KEY_ACCOUNT_FILTER = 'pharmacy_account_filter';
    const STORAGE_KEY_SEARCH_TERM = 'pharmacy_search_term';
    
    // 페이지 상태 저장 함수
    function savePageState() {
      try {
        localStorage.setItem(STORAGE_KEY_PAGE, currentPage.toString());
        localStorage.setItem(STORAGE_KEY_PAGE_SIZE, currentPageSize.toString());
        localStorage.setItem(STORAGE_KEY_STATUS_FILTER, currentStatusFilter);
        localStorage.setItem(STORAGE_KEY_ACCOUNT_FILTER, currentAccountFilter);
        localStorage.setItem(STORAGE_KEY_SEARCH_TERM, currentSearchTerm);
      } catch (e) {
        console.warn('페이지 상태 저장 실패:', e);
      }
    }
    
    // 페이지 상태 복원 함수
    function restorePageState() {
      try {
        const savedPage = localStorage.getItem(STORAGE_KEY_PAGE);
        const savedPageSize = localStorage.getItem(STORAGE_KEY_PAGE_SIZE);
        const savedStatusFilter = localStorage.getItem(STORAGE_KEY_STATUS_FILTER);
        const savedAccountFilter = localStorage.getItem(STORAGE_KEY_ACCOUNT_FILTER);
        const savedSearchTerm = localStorage.getItem(STORAGE_KEY_SEARCH_TERM);
        
        if (savedPage) currentPage = parseInt(savedPage, 10);
        if (savedPageSize) currentPageSize = parseInt(savedPageSize, 10);
        if (savedStatusFilter) currentStatusFilter = savedStatusFilter;
        if (savedAccountFilter) currentAccountFilter = savedAccountFilter;
        if (savedSearchTerm) currentSearchTerm = savedSearchTerm;
      } catch (e) {
        console.warn('페이지 상태 복원 실패:', e);
      }
    }
    
    // 페이지 초기화
    document.addEventListener('DOMContentLoaded', function() {
      console.log('약국배상책임보험 관리 페이지가 로드되었습니다.');
      
      // 페이지 상태 복원
      restorePageState();
      
      // 현재 시간 업데이트
     // updateCurrentTime();
     // setInterval(updateCurrentTime, 1000);
      
      // 이벤트 리스너 등록
      initializeEventListeners();
      
	  // 전화번호 형식 자동 변환 설정 (추가)
	 setupPhoneInputs();
	 
	 // 거래처 필터 초기화 (추가)
		initializeAccountFilter();
      // 초기 데이터 로드
      loadPharmacyData();
    });
    
    // 페이지 언로드 시 상태 저장
    window.addEventListener('beforeunload', function() {
      savePageState();
    });
	
	// ========== 거래처 필터 관련 함수들 (추가) ==========

// 거래처 필터 초기화
async function initializeAccountFilter() {
  try {
    console.log('거래처 필터 초기화 시작...');
    await loadAccountOptions();
    setupAccountFilterEvents();
    console.log('거래처 필터 초기화 완료');
  } catch (error) {
    console.error('거래처 필터 초기화 실패:', error);
  }
}

// 거래처 옵션 로드
async function loadAccountOptions() {
  const accountSelect = document.getElementById('accountFilter');
  if (!accountSelect) {
    console.warn('거래처 필터 요소를 찾을 수 없습니다.');
    return;
  }

  try {
    // 로딩 상태 표시
    accountSelect.innerHTML = '<option value="">로딩 중...</option>';
    accountSelect.disabled = true;

    // 서버에서 거래처 목록 가져오기
    const response = await fetch('/api/pharmacy/accounts', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('거래처 데이터:', data);

    // 기본 옵션 추가
    accountSelect.innerHTML = '<option value="">전체 거래처</option>';

    // 성공적으로 데이터를 받았을 때
    if (data.success && Array.isArray(data.data)) {
      data.data.forEach(account => {
        const option = document.createElement('option');
        option.value = account.num;
        option.textContent = account.directory;
        option.title = account.directory; // 긴 텍스트를 위한 툴팁
        accountSelect.appendChild(option);
      });
      
      console.log(`거래처 옵션 ${data.data.length}개 로드 완료`);
    } else {
      console.warn('거래처 데이터가 비어있거나 형식이 올바르지 않습니다.');
    }

  } catch (error) {
    console.error('거래처 옵션 로드 오류:', error);
    
    // 에러 시 기본 옵션만 표시
    accountSelect.innerHTML = '<option value="">전체 거래처</option>';
    
    // 사용자에게 알림 (선택사항)
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '거래처 목록을 불러오는데 실패했습니다.',
        'warning'
      );
    }
    
  } finally {
    // 항상 활성화
    accountSelect.disabled = false;
  }
}

// 거래처 필터 이벤트 설정
function setupAccountFilterEvents() {
  const accountFilter = document.getElementById('accountFilter');
  if (accountFilter) {
    accountFilter.addEventListener('change', function() {
      currentAccountFilter = this.value;
      currentPage = 1; // 페이지 초기화
      savePageState();
      console.log('거래처 필터 변경:', currentAccountFilter);
      loadPharmacyData();
    });
  }
}

// 거래처 필터 값 가져오기
function getSelectedAccount() {
  const accountFilter = document.getElementById('accountFilter');
  return accountFilter ? accountFilter.value : '';
}

// 거래처 필터 값 설정
function setSelectedAccount(accountNum) {
  const accountFilter = document.getElementById('accountFilter');
  if (accountFilter) {
    accountFilter.value = accountNum;
    currentAccountFilter = accountNum;
  }
}

// 거래처 필터 새로고침
async function refreshAccountFilter() {
  console.log('거래처 필터 새로고침...');
  await loadAccountOptions();
}
  // 전화번호 입력 필드 자동 형식 설정
	function setupPhoneInputs() {
	  const phoneInputs = document.querySelectorAll('input[type="tel"], input[data-phone], .phone-input');
	  
	  phoneInputs.forEach(input => {
		input.addEventListener('input', (e) => {
		  window.sjTemplateLoader.formatPhoneNumber(e.target);
		});
		
		input.addEventListener('blur', (e) => {
		  window.sjTemplateLoader.formatPhoneNumber(e.target);
		});
	  });
	}
    // 현재 시간 업데이트
  function updateCurrentTime() {
      const now = new Date();
      const timeString = now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const timeElement = document.getElementById('currentTime');
      if (timeElement) {
        timeElement.textContent = timeString;
      }
    }

    // 이벤트 리스너 초기화
   function initializeEventListeners() {
		  // 메뉴 토글
		  const menuToggle = document.getElementById('menuToggle');
		  const sidebar = document.getElementById('sidebar');
		  const sidebarOverlay = document.getElementById('sidebarOverlay');
		  
		  if (menuToggle) {
			menuToggle.addEventListener('click', function() {
			  sidebar.classList.toggle('show');
			  sidebarOverlay.classList.toggle('show');
			});
		  }
		  
		  if (sidebarOverlay) {
			sidebarOverlay.addEventListener('click', function() {
			  sidebar.classList.remove('show');
			  sidebarOverlay.classList.remove('show');
			});
		  }

		  // 검색 버튼
		  const searchBtn = document.getElementById('search_btn');
		  if (searchBtn) {
			searchBtn.addEventListener('click', handleSearch);
		  }

		  // 검색어 입력 (Enter 키)
		  const searchWord = document.getElementById('search_word');
		  if (searchWord) {
			searchWord.addEventListener('keypress', function(e) {
			  if (e.key === 'Enter') {
				handleSearch();
			  }
			});
			
			// 입력 중 디바운스 검색 (선택사항)
			searchWord.addEventListener('input', debounce(handleSearch, 500));
		  }

		  // 거래처 필터 변경 (이미 setupAccountFilterEvents에서 처리)
		  
		  // 상태 필터 변경
		  const statusFilter = document.getElementById('statusFilter');
		  if (statusFilter) {
			statusFilter.addEventListener('change', handleSearch);
		  }

		  // 페이지 크기 변경
		  const pageSize = document.getElementById('pageSize');
		  if (pageSize) {
			pageSize.addEventListener('change', function() {
			  currentPageSize = parseInt(this.value);
			  currentPage = 1;
			  savePageState();
			  loadPharmacyData();
			});
		  }

      // 각종 버튼들
      document.getElementById('addCompany')?.addEventListener('click', () => {
			openaddCompanyModal();
			//openModal('업체 추가', '/api/pharmacy/add-form');
      });
	  // 기존 버튼들 아래에 추가
	  document.getElementById('apiManager')?.addEventListener('click', () => {
		  openApiManagerModal(); //api 키 관리페이지
		});
      document.getElementById('dailyReport')?.addEventListener('click', () => {
			 openDailyReportModal()
      });

      document.getElementById('depositBalance')?.addEventListener('click', () => {
		  
		  openDepositBalanceModal(); // 새로운 함수 호출
        //openModal('예치 잔액', '/api/deposits/balance');
      });

  /*    document.getElementById('depositList')?.addEventListener('click', () => {
       openModal('예치 잔액', '/api/deposits/balance');
      });*/

      document.getElementById('dataCleanup')?.addEventListener('click', () => {
        alert('데이터정리 기능을 구현해주세요.');
      });

      document.getElementById('designList')?.addEventListener('click', () => {
        downloadDesignListExcel();
      });

      document.getElementById('cancelList')?.addEventListener('click', () => {
        alert('해지리스트 기능을 구현해주세요.');
      });

      // 카드 접기/펼치기
      const collapseBtn = document.querySelector('[data-card-widget="collapse"]');
      if (collapseBtn) {
        collapseBtn.addEventListener('click', function() {
          const cardBody = this.closest('.card').querySelector('.card-body');
          const icon = this.querySelector('i');
          
          if (cardBody.style.display === 'none') {
            cardBody.style.display = 'block';
            icon.className = 'fas fa-minus';
          } else {
            cardBody.style.display = 'none';
            icon.className = 'fas fa-plus';
          }
        });
      }
    }
    
	
	// 검색 처리 함수 수정 (거래처 필터 추가)
	function handleSearch() {
	  const searchWord = document.getElementById('search_word').value.trim();
	  const statusFilter = document.getElementById('statusFilter').value;
	  const accountFilter = document.getElementById('accountFilter')?.value || '';
	  
	  currentSearchTerm = searchWord;
	  currentStatusFilter = statusFilter;
	  currentAccountFilter = accountFilter;
	  currentPage = 1;
	  
	  console.log('검색 실행:', {
		search: currentSearchTerm,
		status: currentStatusFilter,
		account: currentAccountFilter
	  });
	  
	  loadPharmacyData();
	}
    // 검색 처리
    

    // 약국 데이터 로드
    async function loadPharmacyData() {
		  showLoading(true);
		  
		  try {
			const params = new URLSearchParams({
			  page: currentPage,
			  limit: currentPageSize,
			  search: currentSearchTerm,
			  status: currentStatusFilter
			});
			
			// 거래처 필터 파라미터 추가
			if (currentAccountFilter) {
			  params.append('account', currentAccountFilter);
			}

			console.log('API 요청 파라미터:', Object.fromEntries(params));

			const response = await fetch(`/api/pharmacy/list?${params}`, {
			  method: 'GET',
			  headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			  }
			});

			if (!response.ok) {
			  throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log('API 응답 데이터:', data);
			
			if (data.success) {
			  displayPharmacyData(data.data || []);
			  updatePagination(data.pagination || {});
			} else {
			  throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
			}
		  } catch (error) {
			console.error('약국 데이터 로드 오류:', error);
			showErrorMessage('데이터를 불러오는데 실패했습니다: ' + error.message);
			
			// 에러 시 빈 데이터 표시
			displayPharmacyData([]);
			updatePagination({});
		  } finally {
			showLoading(false);
		  }
		}
		
		
		// 모든 필터 초기화 함수 (유틸리티)
function resetAllFilters() {
  currentSearchTerm = '';
  currentStatusFilter = '13';
  currentAccountFilter = '';
  currentPage = 1;
  
  // UI 요소들도 초기화
  const searchWord = document.getElementById('search_word');
  const statusFilter = document.getElementById('statusFilter');
  const accountFilter = document.getElementById('accountFilter');
  
  if (searchWord) searchWord.value = '';
  if (statusFilter) statusFilter.value = '13';
  if (accountFilter) accountFilter.value = '';
  
  // 데이터 다시 로드
  loadPharmacyData();
}

// 디바운스 함수 (검색어 입력 지연 처리용)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

    // displayPharmacyData 함수에 이벤트 리스너 추가 코드 수정
function displayPharmacyData(data) {
  const tableBody = document.getElementById('pharmacy_table_body');
  const mobileCards = document.getElementById('pharmacy_mobile_cards');
  
  // 테이블 초기화
  if (tableBody) {
    tableBody.innerHTML = '';
  }
  if (mobileCards) {
    mobileCards.innerHTML = '';
  }

  if (!data || data.length === 0) {
    const noDataMessage = '<tr><td colspan="13" class="text-center py-4">검색된 데이터가 없습니다.</td></tr>';
    if (tableBody) {
      tableBody.innerHTML = noDataMessage;
    }
    if (mobileCards) {
      mobileCards.innerHTML = '<div class="text-center py-4">검색된 데이터가 없습니다.</div>';
    }
    return;
  }

  // 디버깅: 첫 번째 항목의 데이터 확인
  if (data.length > 0) {
    console.log('첫 번째 항목 데이터:', data[0]);
    console.log('request_date:', data[0].request_date);
    console.log('approval_date:', data[0].approval_date);
  }

  // 데스크톱 테이블 생성
  if (tableBody) {
    data.forEach((item, index) => {
      const row = createTableRow(item, index);
      tableBody.appendChild(row);
    });
  }

  // 모바일 카드 생성
  if (mobileCards) {
    data.forEach((item, index) => {
      const card = createMobileCard(item, index);
      mobileCards.appendChild(card);
    });
  }

  // 상태 변경 이벤트 리스너 등록 (추가)
  attachStatusChangeEvents();
}

// 약국을 목록에서 제거하는 함수
function removePharmacyFromList(pharmacyId) {
  // 테이블 행 제거
  const row = document.querySelector(`tr[data-id="${pharmacyId}"]`);
  if (row) {
    row.remove();
  }
  
  // 모바일 카드 제거
  const card = document.querySelector(`.mobile-card[data-id="${pharmacyId}"]`);
  if (card) {
    card.remove();
  }
  
  // 목록이 비어있으면 데이터 다시 로드
  const tableBody = document.getElementById('pharmacy_table_body');
  const mobileContainer = document.getElementById('pharmacy_mobile_cards');
  
  const remainingRows = tableBody ? tableBody.querySelectorAll('tr').length : 0;
  const remainingCards = mobileContainer ? mobileContainer.querySelectorAll('.mobile-card').length : 0;
  
  if (remainingRows === 0 && remainingCards === 0) {
    // 현재 페이지가 1보다 크면 이전 페이지로 이동
    if (currentPage > 1) {
      currentPage--;
      savePageState();
    }
    // 데이터 다시 로드
    loadPharmacyData();
  } else {
    // 페이지네이션 업데이트
    // (실제로는 서버에서 다시 조회해야 정확한 페이지네이션을 얻을 수 있음)
    // 여기서는 간단히 현재 페이지 유지
  }
}

// createTableRow 함수에서 original-status 속성 추가
function createTableRow(item, index) {
  const row = document.createElement('tr');
  
  const statusClass = getStatusClass(item.status);
  const statusText = getStatusText(item.status);
  
  // 상태별 옵션 생성
  const statusOptions = getStatusOptions(item.status);
  
  row.innerHTML = `
    <td class="col-number">
      <button type="button" class="btn btn-info btn-sm" onclick="openDetailModal('${item.num}')">
        ${(currentPage - 1) * currentPageSize + index + 1}
      </button>
      <input type='hidden' id='num${item.num}' value="${item.num}">
    </td>
    <td class="col-company-name">
      <a href="#" data-toggle="tooltip" title="${formatDate(item.approval_date)}">${item.company || '-'}</a>
    </td>
    <td class="col-business-number">${item.school2 || '-'}</td>
    <td class="col-manager">${item.damdangja || '-'}</td>
    <td class="col-phone d-none d-lg-table-cell">${item.hphone || '-'}</td>
    <td class="col-phone d-none d-xl-table-cell">${item.hphone2 || '-'}</td>
    <td class="col-design-number d-none d-lg-table-cell">
      ${item.chemist >= 1 ? 
        `<input type='text' id="chemist_${item.num}" class="form-control form-control-sm input-design-number" 
         value='${item.chemist_design_number || ''}' placeholder="전문인설계번호" data-id="${item.num}">` : 
        '&nbsp;'
      }
    </td>
    <td class="col-design-number d-none d-lg-table-cell">
      ${item.area >= 1 ? 
        `<input type='text' id="area_${item.num}" class="form-control form-control-sm input-design-number" 
         value='${item.area_design_number || ''}' placeholder="화재설계번호" data-id="${item.num}">` : 
        '&nbsp;'
      }
    </td>
    <td class="col-date d-none d-xl-table-cell">${item.request_date ? formatDate(item.request_date) : '-'}</td>
    <td class="col-date">${item.approval_date ? formatDate(item.approval_date) : '-'}</td>
    <td class="col-status">
      <select id="status_${item.num}" class="form-control form-control-sm select-status" 
        data-id="${item.num}" data-original-status="${getStatusCode(item.status)}">
		  ${statusOptions}
		</select>
    </td>
    <td class="col-memo d-none d-xl-table-cell">
      <input type='text' id="memo_${item.num}" class="form-control form-control-sm input-memo" 
             value='${item.memo || ''}' placeholder="메모" data-id="${item.num}">
    </td>
    <td class="col-premium">
      ${item.premium || (item.premium_raw ? formatCurrency(item.premium_raw) : '-')}
      <button type="button" class="btn btn-sm btn-link p-0 ms-1" 
              onclick="verifyPremium(${item.num})" 
              title="보험료 검증" 
              style="font-size: 0.75rem;">
        <i class="fas fa-check-circle text-info"></i>
      </button>
    </td>
    <td class="col-account">${item.account_directory}</td>
  `;
  
  return row;
}

// createMobileCard 함수 수정 - 상태 select 추가
function createMobileCard(item, index) {
  const card = document.createElement('div');
  card.className = 'mobile-card';
  
  const statusClass = getStatusClass(item.status);
  const statusText = getStatusText(item.status);
  const statusOptions = getStatusOptions(item.status);
  
  card.innerHTML = `
    <div class="mobile-card-header">
      <button type="button" class="mobile-card-number-btn" onclick="openDetailModal('${item.num}')">
        ${(currentPage - 1) * currentPageSize + index + 1}
      </button>
      <div class="mobile-card-title">${item.company || '업체명 없음'}</div>
	  <span class="status-badge">${item.account_directory}</span>
     
    </div>
    <div class="mobile-card-body">
      <div class="mobile-card-row">
        <span class="mobile-card-label">사업자번호:</span>
        <span class="mobile-card-value">${item.school2 || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">담당자:</span>
        <span class="mobile-card-value">${item.damdangja || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">휴대전화:</span>
        <span class="mobile-card-value">${item.hphone || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">가입요청일:</span>
        <span class="mobile-card-value">${item.request_date ? formatDate(item.request_date) : '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">승인일:</span>
        <span class="mobile-card-value">${item.approval_date ? formatDate(item.approval_date) : '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">보험료:</span>
        <span class="mobile-card-value">${item.premium || formatCurrency(item.premium_raw) || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">상태:</span>
        <select id="status_mobile_${item.num}" class="form-control form-control-sm select-status mobile-status-select" 
        data-id="${item.num}" data-original-status="${getStatusCode(item.status)}">
		  ${statusOptions}
		</select>
      </div>
      
    </div>
  `;
  
  return card;
}

    // 상태별 옵션 생성
		 function getStatusOptions(currentStatus) {
		  const statusMap = {
			'1': '접수',
			'12': '해피콜',
			'10': '메일 보냄',
			'13': '승인',
			'6': '계약완료',
			'7': '보류',
			'14': '증권발급',
			'15': '해지요청',
			'16': '해지완료',
			'17': '설계중',
			'11': '질문서받음',
			'9': '단순산출',
			'2': '보험료',
			'3': '청약서안내',
			'4': '자필서류',
			'8': '카드승인',
			'5': '입금확인'
		  };

		  let options = '';
		  
		  // 텍스트를 코드로 변환하는 로직 (완전 버전)
		  let currentStatusCode = currentStatus;
		  
		  // 모든 텍스트를 코드로 변환
		  Object.entries(statusMap).forEach(([code, text]) => {
			if (currentStatus === text) {
			  currentStatusCode = code;
			}
		  });
		  
		  // 나머지는 그대로...
		  if (currentStatusCode == '13') {
			const approvedOptions = ['1', '10', '7', '13'];
			approvedOptions.forEach(code => {
			  const selected = code == currentStatusCode ? 'selected' : '';
			  options += `<option value="${code}" ${selected}>${statusMap[code]}</option>`;
			});
		  } else if (currentStatusCode == '15') {
			const cancelOptions = ['15', '16', '6', '14'];
			cancelOptions.forEach(code => {
			  const selected = code == currentStatusCode ? 'selected' : '';
			  options += `<option value="${code}" ${selected}>${statusMap[code]}</option>`;
			});
		  } else {
			Object.entries(statusMap).forEach(([code, text]) => {
			  const selected = code == currentStatusCode ? 'selected' : '';
			  options += `<option value="${code}" ${selected}>${text}</option>`;
			});
		  }
		  
		  return options;
		}
      
	  
	  // 텍스트를 코드로 변환하는 함수 (새로 추가)
	function getStatusCode(status) {
	  const statusMap = {
		'1': '접수',
		'12': '해피콜',
		'10': '메일 보냄',
		'13': '승인',
		'6': '계약완료',
		'7': '보류',
		'14': '증권발급',
		'15': '해지요청',
		'16': '해지완료',
		'17': '설계중',
		'11': '질문서받음',
		'9': '단순산출',
		'2': '보험료',
		'3': '청약서안내',
		'4': '자필서류',
		'8': '카드승인',
		'5': '입금확인'
	  };
	  
	  // 이미 코드인 경우 그대로 반환
	  if (Object.keys(statusMap).includes(String(status))) {
		return String(status);
	  }
	  
	  // 텍스트인 경우 코드 찾기
	  for (let [code, text] of Object.entries(statusMap)) {
		if (text === status) {
		  return code;
		}
	  }
	  
	  return status; // 찾지 못한 경우 원본 반환
	}
    // 상태별 CSS 클래스 반환 (업데이트)
    function getStatusClass(status) {
      switch(status) {
        case '승인':
        case '13':
          return 'status-approved';
        case '해지요청':
        case '15':
          return 'status-cancel-request';
        case '해지완료':
        case '16':
          return 'status-cancelled';
        default:
          return 'status-other';
      }
    }

    // 상태별 텍스트 반환 (업데이트)
    function getStatusText(status) {
      const statusMap = {
        '1': '접수',
        '12': '해피콜',
        '10': '메일 보냄',
        '13': '승인',
        '6': '계약완료',
        '7': '보류',
        '14': '증권발급',
        '15': '해지요청',
        '16': '해지완료',
        '17': '설계중',
        '11': '질문서받음',
        '9': '단순산출',
        '2': '보험료',
        '3': '청약서안내',
        '4': '자필서류',
        '8': '카드승인',
        '5': '입금확인'
      };
      
      return statusMap[status] || status || '기타';
    }

    // 날짜 및 시간 포맷팅 (YYYY-MM-DD HH:mm:ss 형식)
    function formatDate(dateString) {
      if (!dateString || dateString === '-' || dateString === '') {
        return '-';
      }
      
      try {
        // 이미 "YYYY-MM-DD HH:mm:ss" 형식인 경우 그대로 반환
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString.trim())) {
          return dateString.trim();
        }
        
        // "YYYY-MM-DD HH:mm:ss" 형식이지만 공백이 있는 경우 정리
        const trimmed = String(dateString).trim();
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
          return trimmed;
        }
        
        // Date 객체로 파싱 시도
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn('날짜 파싱 실패:', dateString);
          return dateString; // 파싱 실패 시 원본 반환
        }
        
        // YYYY-MM-DD HH:mm:ss 형식으로 포맷팅
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } catch (error) {
        console.error('formatDate 오류:', error, '입력값:', dateString);
        return dateString || '-';
      }
    }

    // 통화 포맷팅
    function formatCurrency(amount) {
      if (!amount) return '';
      
      try {
        const num = parseInt(amount.toString().replace(/[^0-9]/g, ''));
        if (isNaN(num)) return amount;
        
        return num.toLocaleString('ko-KR') + '원';
      } catch (error) {
        return amount;
      }
    }

    // 페이지네이션 업데이트
    function updatePagination(pagination) {
      const paginationInfo = document.getElementById('pagination_info');
      const paginationControls = document.getElementById('pagination_controls');
      
      if (!pagination || typeof pagination.total_count === 'undefined') {
        if (paginationInfo) {
          paginationInfo.innerHTML = '';
        }
        if (paginationControls) {
          paginationControls.innerHTML = '';
        }
        return;
      }

      const { total_count, current_page, limit, total_pages } = pagination;
      const startItem = total_count > 0 ? Math.min((current_page - 1) * limit + 1, total_count) : 0;
      const endItem = Math.min(current_page * limit, total_count);

      // 페이지 정보 업데이트
      if (paginationInfo) {
        if (total_count > 0) {
          paginationInfo.innerHTML = `총 ${total_count.toLocaleString()}건 중 ${startItem.toLocaleString()}-${endItem.toLocaleString()}건 표시`;
        } else {
          paginationInfo.innerHTML = '검색된 데이터가 없습니다';
        }
      }

      // 페이지 컨트롤 업데이트
      if (paginationControls) {
        paginationControls.innerHTML = '';
        
        if (total_pages <= 1) {
          return;
        }
        
        // 이전 버튼
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${current_page <= 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `
          <a class="page-link" href="#" data-page="${current_page - 1}">
            <i class="fas fa-chevron-left"></i>
          </a>
        `;
        if (current_page > 1) {
          prevLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(current_page - 1);
          });
        }
        paginationControls.appendChild(prevLi);

        // 페이지 번호들
        const maxVisible = 5;
        let startPage = Math.max(1, current_page - Math.floor(maxVisible / 2));
        let endPage = Math.min(total_pages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
          startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
          const firstLi = document.createElement('li');
          firstLi.className = 'page-item';
          firstLi.innerHTML = '<a class="page-link" href="#" data-page="1">1</a>';
          firstLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(1);
          });
          paginationControls.appendChild(firstLi);

          if (startPage > 2) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = '<span class="page-link">...</span>';
            paginationControls.appendChild(dotsLi);
          }
        }

        for (let i = startPage; i <= endPage; i++) {
          const li = document.createElement('li');
          li.className = `page-item ${i === current_page ? 'active' : ''}`;
          li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
          
          if (i !== current_page) {
            li.querySelector('a').addEventListener('click', (e) => {
              e.preventDefault();
              goToPage(i);
            });
          }
          
          paginationControls.appendChild(li);
        }

        if (endPage < total_pages) {
          if (endPage < total_pages - 1) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = '<span class="page-link">...</span>';
            paginationControls.appendChild(dotsLi);
          }

          const lastLi = document.createElement('li');
          lastLi.className = 'page-item';
          lastLi.innerHTML = `<a class="page-link" href="#" data-page="${total_pages}">${total_pages}</a>`;
          lastLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(total_pages);
          });
          paginationControls.appendChild(lastLi);
        }

        // 다음 버튼
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${current_page >= total_pages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
          <a class="page-link" href="#" data-page="${current_page + 1}">
            <i class="fas fa-chevron-right"></i>
          </a>
        `;
        if (current_page < total_pages) {
          nextLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(current_page + 1);
          });
        }
        paginationControls.appendChild(nextLi);
      }
    }

    // 페이지 이동
    function goToPage(page) {
      currentPage = page;
      savePageState(); // 페이지 변경 시 저장
      loadPharmacyData();
      
      // 스크롤 최상단으로 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 로딩 상태 표시
    function showLoading(show) {
      const loadingOverlay = document.getElementById('loadingOverlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
      }
    }

    // 에러 메시지 표시
    function showErrorMessage(message) {
      alert(message); // 실제 프로젝트에서는 더 나은 알림 시스템을 사용하세요
      console.error(message);
    }


/***********************************/
/*ch  변경                                                */
/* 상태 변경 이벤트 리스너를 테이블 행에 추가하는 함수
/***********************************/

function attachStatusChangeEvents() {
  // 모든 상태 select 요소에 이벤트 리스너 추가
  document.querySelectorAll('.select-status').forEach(select => {
    select.addEventListener('change', handleStatusChange);
  });
}

// 상태 변경 처리 함수
// 상태 변경 처리 함수 (기존 기능 유지 + 해지 처리 추가)
async function handleStatusChange(event) {
  const selectElement = event.target;
  const pharmacyId = selectElement.getAttribute('data-id');
  const newStatus = selectElement.value;
  const oldStatus = selectElement.getAttribute('data-original-status') || '';
  
  // 변경사항이 없으면 중단
  if (newStatus === oldStatus) {
    return;
  }

  // ★ 해지요청(15) → 해지완료(16) 변경 시 특별 처리
  if (newStatus === '16' && oldStatus === '15') {
    console.log(`해지 처리 모달 호출: 약국ID ${pharmacyId}`);
    
    try {
      // 해지 모달 열기 (새로운 함수 호출)
      await openCancellationModal(pharmacyId);
    } catch (error) {
      console.error('해지 모달 열기 실패:', error);
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast('해지 처리 중 오류가 발생했습니다.', 'error');
      }
    }
    
    // 상태를 원래대로 복원 (모달에서 최종 처리)
    selectElement.value = oldStatus;
    selectElement.disabled = false;
    selectElement.style.opacity = '1';
    return;
  }

  // ★ 기존 기능 그대로 유지 - 모든 다른 상태 변경 처리
  try {
    // 버튼 비활성화 및 로딩 표시
    selectElement.disabled = true;
    selectElement.style.opacity = '0.6';
    
    // 확인 메시지 표시 (옵션)
    const statusText = getStatusText(newStatus);
    if (!confirm(`상태를 "${statusText}"로 변경하시겠습니까?`)) {
      // 취소 시 원래 값으로 복원
      selectElement.value = oldStatus;
      selectElement.disabled = false;
      selectElement.style.opacity = '1';
      return;
    }

    // 서버에 상태 변경 요청 (기존 로직)
    const response = await fetch('/api/pharmacy2/update-status', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        pharmacy_id: pharmacyId,
        status: newStatus,
        old_status: oldStatus
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 시 원래 상태값 업데이트
      selectElement.setAttribute('data-original-status', newStatus);
      
      // 성공 메시지 표시 (토스트나 간단한 알림)
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          result.message || `상태가 "${statusText}"로 변경되었습니다.`,
          'success'
        );
      } else {
        console.log(`상태 변경 성공: ${statusText}`);
      }

      // UI 업데이트: 테이블 행 또는 모바일 카드
      const tableRow = selectElement.closest('tr');
      const mobileCard = selectElement.closest('.mobile-card');
      
      if (tableRow) {
        updateRowAppearance(tableRow, newStatus);
      } else if (mobileCard) {
        updateMobileCardStatus(selectElement, newStatus);
      }
      
    } else {
      throw new Error(result.message || '상태 변경에 실패했습니다.');
    }

  } catch (error) {
    console.error('상태 변경 오류:', error);
    
    // 오류 시 원래 값으로 복원
    selectElement.value = oldStatus;
    
    // 오류 메시지 표시
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '상태 변경 중 오류가 발생했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('상태 변경 중 오류가 발생했습니다: ' + error.message);
    }
    
  } finally {
    // 버튼 활성화
    selectElement.disabled = false;
    selectElement.style.opacity = '1';
  }
}

// 행의 외관을 상태에 따라 업데이트하는 함수
function updateRowAppearance(row, status) {
  if (!row) return;
  
  // 기존 상태 클래스 제거
  row.classList.remove('status-approved', 'status-cancel-request', 'status-cancelled', 'status-other');
  
  // 새 상태 클래스 추가
  const statusClass = getStatusClass(status);
  row.classList.add(statusClass);
}

// 모바일 카드의 상태 배지를 업데이트하는 함수
function updateMobileCardStatus(selectElement, status) {
  const card = selectElement.closest('.mobile-card');
  if (!card) return;
  
  const statusBadge = card.querySelector('.status-badge');
  if (statusBadge) {
    // 기존 상태 클래스 제거
    statusBadge.classList.remove('status-approved', 'status-cancel-request', 'status-cancelled', 'status-other');
    
    // 새 상태 클래스와 텍스트 추가
    const statusClass = getStatusClass(status);
    const statusText = getStatusText(status);
    
    statusBadge.classList.add(statusClass);
    statusBadge.textContent = statusText;
  }
}
/* ch 변경 끝											 */
/**********************************/
    // 전체 선택/해제 기능 (체크박스)
    function toggleAllCheckboxes(checked) {
      const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
      checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
      });
    }

    // 선택된 항목들 가져오기
    function getSelectedItems() {
      const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]:checked');
      return Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-id'));
    }
/*****************************************************/	
/*  모달 열기 함수
/* 모달 구조: Bootstrap 모달(dynamicModal)이 있고, 헤더(modalTitle), 본문(modalBody), 푸터로 구성되어 있습니다.
/* 주요 함수들:
/* openDetailModal(pharmacyId): 약국 상세정보 모달을 여는 함수
/*displayPharmcay(pharmacyId, payload): 약국 데이터를 폼 형태로 표시하는 함수
/*동작 흐름:
/*모달 열기 → 로딩 UI 표시 → API 호출(/api/pharmacy/id-detail/${pharmacyId}) → 데이터 받아서 displayPharmcay 함수로 폼 렌더링
/*표시되는 데이터: 약국의 상호, 사업자번호, 주소, 전화번호, 이메일, 신청자 정보, 전문인수, 재고자산, 보험료, 증권번호, 메모, 보험기간 등
/*기능: 수정 버튼(updatePharmacy), 증권번호 입력 버튼 등이 포함되어 있습니다.
/*****************************************************/
async function openDetailModal(pharmacyId) {
  // 모달 제목 변경
  //document.getElementById('modalTitle').textContent = '약국 상세정보';

  // 로딩 UI 먼저 보여주기
  document.getElementById('modalBody').innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">로딩 중...</span>
      </div>
      <div class="mt-2">데이터를 불러오는 중...</div>
    </div>
  `;

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
  modal.show();
   console.log('🚀 API 호출 시작');
  console.time('API 요청 시간');  // ← 추가
  try {
    // 서버에서 데이터 가져오기 (예시 API)
    const response = await fetch(`/api/pharmacy/id-detail/${pharmacyId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }


	console.timeEnd('API 요청 시간');  // ← 추가
  console.log('📊 Response:', response);  // ← 추가
    const data = await response.json();
	
	
	displayPharmcay(pharmacyId,data);

  

  } catch (err) {
    document.getElementById('modalBody').innerHTML = `
      <div class="alert alert-danger">
        데이터를 불러올 수 없습니다: ${err.message}
      </div>
    `;
  }
}
function checkCertificateFiles(images) {
  const hasExpertCert = images && images.some(img => img.kind === "1");
  const hasFireCert = images && images.some(img => img.kind === "2");
  return { hasExpertCert, hasFireCert };
}

// 증권 조회 및 열람 함수
async function viewCertificateByNum(pharmacyId, certificateType, filePath) {
  if (!pharmacyId) {
    alert('약국 정보가 없습니다.');
    return;
  }
  
  if (!certificateType) {
    // 기존 호출 방식 호환성 유지 (filePath만 있는 경우)
    if (filePath) {
      // 기존 방식: filePath가 description2 값인 경우
      const fullUrl = filePath.startsWith('http') ? filePath : `https://imet.kr${filePath}`;
      window.open(fullUrl, '_blank');
      return;
    } else {
      alert('증권 정보가 없습니다.');
      return;
    }
  }
  
  try {
    // 프록시를 통해 증권 파일 열기
    const certificateUrl = `/api/pharmacy/certificate/${pharmacyId}/${certificateType}`;
    window.open(certificateUrl, '_blank');
  } catch (error) {
    console.error('증권 열람 오류:', error);
    alert('증권을 불러오는데 실패했습니다.');
  }
}


function displayPharmcay(pharmacyId, payload) {
  const d = (payload && payload.data) ? payload.data : payload || {};
  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);

  // ========== 1. 기본 데이터 추출 ==========
  
  // 증권 파일 정보
  const expertCertFile = d.images?.find(img => img.kind === "1");
  const fireCertFile = d.images?.find(img => img.kind === "2");
  
  // 증권번호가 있으면 버튼 활성화 (파일이 없어도 증권번호가 있으면 활성화)
  const hasExpertCert = !!(expertCertFile || (d.expert_certificate_number || d.chemistCerti));
  const hasFireCert = !!(fireCertFile || (d.fire_certificate_number || d.areaCerti));
  
  // 상태 정보
  const currentStatus = getStatusCode(d.status);
  const isLockedStatus = ['13', '15', '16', '6', '14'].includes(currentStatus);
  const disabledAttr = isLockedStatus ? 'disabled' : '';
  const disabledClass = isLockedStatus ? 'bg-light' : '';
  
  // ✅ 거래처 정보 (account 코드 + directory 이름)
 
  const accountNum = String(d.account || '1');
  const accountName = val(d.directory || d.account_directory, '거래처 정보 없음');
  
  // ✅ 거래처별 보상한도 설정
  const hasMultipleLimits = ['6', '8'].includes(accountNum);  // 1억/2억 선택 가능
  const hasSingleLimit = ['1', '7'].includes(accountNum);     // 1억 고정
  
  // ✅ 현재 보상한도 값
  const currentLimit = val(d.expert_limit, '1');
  
  // ✅ account 정보 저장 (전역 변수 + 모달 data 속성)
  window.currentPharmacyAccount = accountNum;
  
  
  console.log('account raw:', d.account, 'type:', typeof d.account);
  console.log('accountNum:', accountNum);
  console.log('hasSingleLimit:', hasSingleLimit, 'hasMultipleLimits:', hasMultipleLimits);

  const modal = document.getElementById('dynamicModal');
  if (modal) {
    modal.dataset.account = accountNum;
    modal.dataset.pharmacyId = pharmacyId;
  }
  
  // ========== 2. 보상한도 옵션 HTML 생성 ==========
  
  let coverageLimitOptions = '';
  if (hasSingleLimit) {
    // account 1, 7: 1억만 표시 (disabled)
    coverageLimitOptions = `<option value="1" selected>1억</option>`;
  } else if (hasMultipleLimits) {
    // account 6, 8: 1억, 2억 선택 가능
    coverageLimitOptions = `
      <option value="1" ${currentLimit === '1' ? 'selected' : ''}>1억</option>
      <option value="2" ${currentLimit === '2' ? 'selected' : ''}>2억</option>
    `;
  } else {
    // 기타: 기본값 1억
    coverageLimitOptions = `<option value="1" selected>1억</option>`;
  }
  
  // 보상한도 필드 비활성화 조건
  const isCoverageLimitDisabled = isLockedStatus || hasSingleLimit;
  const coverageDisabledAttr = isCoverageLimitDisabled ? 'disabled' : '';
  const coverageDisabledClass = isCoverageLimitDisabled ? 'bg-light' : '';
  
  // ========== 3. 모달 타이틀 설정 ==========
  
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    const accountBadge = hasSingleLimit 
      ? '<span class="badge bg-primary ms-2">표준형(1억)</span>'
      : '<span class="badge bg-success ms-2">선택형(1억/2억)</span>';
    
    titleEl.innerHTML = `
      <span>${val(d.company)}</span>
      ${accountBadge}
      <button type="button" class="btn btn-sm btn-light" onclick="uploadFile(${pharmacyId})">
        <i class="fas fa-upload"></i> 업로드
      </button>
    `;
  }

  // ========== 4. 모달 본문 HTML 생성 ==========
  
  const html = `
    <!-- 데스크톱 버전 (768px 이상) -->
    <div class="desktop-modal d-none d-md-block">
      <form class="form-grid">
        
        <!-- 상호 / 사업자번호 -->
        <label for="company" class="col-form-label">상호</label>
        <input type="text" class="form-control" id="company" name="company" value="${val(d.company)}">
        
        <label for="business_number" class="col-form-label">사업자번호</label>
        <input type="text" class="form-control" id="business_number" name="business_number" 
               placeholder="하이픈 없이 번호만" value="${val(d.business_number || d.school2)}">

        <!-- 일반전화 / 휴대전화 -->
        <label for="general_phone" class="col-form-label">일반전화</label>
        <input type="tel" class="form-control" id="general_phone" name="general_phone" 
               value="${val(d.general_phone || d.hphone2)}">
        
        <label for="mobile_phone" class="col-form-label">휴대전화</label>
        <input type="tel" class="form-control" id="mobile_phone" name="mobile_phone" 
               value="${val(d.mobile_phone || d.hphone)}">

        <!-- 주소 (전체 폭) -->
        <div class="full-width">
          <label for="address" class="col-form-label">주소</label>
          <input type="text" class="form-control" id="address" name="address" 
                 value="${val(d.address || d.juso)}">
        </div>

        <!-- 이메일 (전체 폭) -->
        <div class="full-width">
          <label for="email" class="col-form-label">이메일</label>
          <input type="email" class="form-control" id="email" name="email" 
                 value="${val(d.email)}">
        </div>

        <!-- 신청자명 / 주민번호 -->
        <label for="applicant_name" class="col-form-label">신청자명</label>
        <input type="text" class="form-control" id="applicant_name" name="applicant_name" 
               value="${val(d.applicant_name || d.damdangja)}">
        
        <label for="resident_number" class="col-form-label">주민번호</label>
        <input type="text" class="form-control" id="resident_number" name="resident_number"
               maxlength="13" placeholder="'-' 없이 숫자만 입력" 
               value="${val(d.resident_number || d.jumin)}">

        <!-- ✅ 전문인수 -->
        <label for="expert_count" class="col-form-label">
          전문인수 
          ${isLockedStatus ? '<span class="badge bg-secondary ms-2">변경불가</span>' : ''}
        </label>
        <select id="expert_count" name="expert_count" class="form-control ${disabledClass}" ${disabledAttr}>
          <option value="-1">전문인수 선택</option>
          ${[1,2,3,4,5,6,7].map(n => `
            <option value="${n}" ${String(d.expert_count || d.chemist) === String(n) ? 'selected' : ''}>${n}명</option>
          `).join('')}
        </select>
        
        <!-- ✅ 보상한도 -->
        <label for="coverage_limit" class="col-form-label">
          보상한도 
          ${isLockedStatus ? '<span class="badge bg-secondary ms-2">변경불가</span>' : ''}
          ${hasSingleLimit ? '<span class="badge bg-info ms-2">1억 고정</span>' : ''}
          ${hasMultipleLimits && !isLockedStatus ? '<span class="badge bg-success ms-2">선택가능</span>' : ''}
        </label>
        <select id="coverage_limit" name="coverage_limit" 
                class="form-control ${coverageDisabledClass}" ${coverageDisabledAttr}>
          ${coverageLimitOptions}
        </select>
        
        <!-- ✅ 재고자산 -->
        <label for="inventory_value" class="col-form-label">
          재고자산 
          ${isLockedStatus ? '<span class="badge bg-secondary ms-2">변경불가</span>' : ''}
        </label>
        <select id="inventory_value" name="inventory_value" 
                class="form-control ${disabledClass}" ${disabledAttr}>
          <option value="-1" ${String(d.jaegojasan || d.inventory_value) === "-1" ? "selected" : ""}>화재보험미가입</option>
          <option value="1" ${String(d.jaegojasan || d.inventory_value) === "1" ? "selected" : ""}>5천만 원</option>
          <option value="2" ${String(d.jaegojasan || d.inventory_value) === "2" ? "selected" : ""}>1억 원</option>
          <option value="3" ${String(d.jaegojasan || d.inventory_value) === "3" ? "selected" : ""}>2억 원</option>
          <option value="4" ${String(d.jaegojasan || d.inventory_value) === "4" ? "selected" : ""}>3억 원</option>
          <option value="5" ${String(d.jaegojasan || d.inventory_value) === "5" ? "selected" : ""}>5억 원</option>
        </select>

        
        
        <!-- ✅ 사업장면적 -->
        <label for="business_area" class="col-form-label">
          사업장면적 
          ${isLockedStatus ? '<span class="badge bg-secondary ms-2">변경불가</span>' : ''}
        </label>
        <input type="text" class="form-control ${disabledClass}" 
               id="business_area" name="business_area" 
               value="${val(d.business_area || d.area)}" 
               placeholder="면적을 입력하세요" ${disabledAttr}>
				   
		<!-- 보험료 / 사업장면적 -->
			
		<div class="full-width">
			<label class="col-form-label">
			  보험료(기본)
			  <button type="button" class="btn btn-sm btn-link p-0 ms-1" 
			          onclick="verifyPremium(${pharmacyId})" 
			          title="보험료 검증" 
			          style="font-size: 0.75rem;">
			    <i class="fas fa-check-circle text-info"></i>
			  </button>
			</label>
			<p class="form-control-plaintext fw-bold text-primary mb-0" id="premium">
			  ${val(d.premium_formatted || d.preminum)} 원
			</p>
			<small class="text-muted" id="premium_verification_result"></small>
		</div>

        <!-- 전문인설계번호 -->
        <label for="expert_design_number" class="col-form-label">전문인설계번호</label>
        <div class="input-group input-group-compact">
          <input type="text" class="form-control form-control-compact" 
                 id="expert_design_number" name="expert_design_number" 
                 value="${val(d.expert_design_number || d.chemistDesignNumer)}" 
                 placeholder="설계번호 입력">
          <button class="btn btn-outline-info btn-compact" type="button" 
                  onclick="saveDesignNumber(${pharmacyId}, false, 'expert')">
            설계번호입력
          </button>
        </div>
        
        <!-- 전문인증권번호 -->
        <label for="expert_certificate_number" class="col-form-label">전문인증권번호</label>
        <div class="input-group input-group-triple">
          <input type="text" class="form-control form-control-compact" 
                 id="expert_certificate_number" name="expert_certificate_number" 
                 value="${val(d.expert_certificate_number || d.chemistCerti)}" 
                 placeholder="증권번호 입력">
          <button class="btn btn-outline-success btn-compact" type="button" 
                  onclick="saveCertificateNumber(${pharmacyId}, false, 'expert')">
            입력
          </button>
          <button class="btn btn-cert-view btn-compact" type="button"  
                  onclick="viewCertificateByNum(${pharmacyId}, 'expert', '${expertCertFile?.description2 || ''}')" 
                  ${!hasExpertCert ? 'disabled' : ''}>
            보기
          </button>
        </div>

        <!-- 화재설계번호 -->
        <label for="fire_design_number" class="col-form-label">화재설계번호</label>
        <div class="input-group input-group-compact">
          <input type="text" class="form-control form-control-compact" 
                 id="fire_design_number" name="fire_design_number" 
                 value="${val(d.fire_design_number || d.areaDesignNumer)}" 
                 placeholder="설계번호 입력">
          <button class="btn btn-outline-info btn-compact" type="button" 
                  onclick="saveDesignNumber(${pharmacyId}, false, 'fire')">
            설계번호입력
          </button>
        </div>
        
        <!-- 화재증권번호 -->
        <label for="fire_certificate_number" class="col-form-label">화재증권번호</label>
        <div class="input-group input-group-triple">
          <input type="text" class="form-control form-control-compact" 
                 id="fire_certificate_number" name="fire_certificate_number" 
                 value="${val(d.fire_certificate_number || d.areaCerti)}" 
                 placeholder="증권번호 입력">
          <button class="btn btn-outline-success btn-compact" type="button" 
                  onclick="saveCertificateNumber(${pharmacyId}, false, 'fire')">
            입력
          </button>
          <button class="btn btn-cert-view btn-compact" type="button" 
                  onclick="viewCertificateByNum(${pharmacyId}, 'fire', '${fireCertFile?.description2 || ''}')" 
                  ${!hasFireCert ? 'disabled' : ''}>
            보기
          </button>
        </div>

        <!-- 메시지 (전체 폭) -->
        <div class="full-width">
          <label for="message" class="col-form-label">메시지</label>
          ${val(d.message)}
        </div>

        <!-- 메모 (전체 폭) -->
        <div class="full-width">
          <label for="memo" class="col-form-label">메모</label>
          <textarea class="form-control" id="memo" name="memo" rows="2">${val(d.memo)}</textarea>
        </div>

        <!-- 보험기간 (전체 폭) -->
        <div class="full-width">
          <label for="insurance_start_date" class="col-form-label">보험기간</label>
          <div class="date-range-container">
            <input type="date" class="form-control" 
                   id="insurance_start_date" name="insurance_start_date"
                   value="${val(d.insurance_start_date || d.sigi)}">
            <span class="date-separator">~</span>
            <input type="date" class="form-control" 
                   id="insurance_end_date" name="insurance_end_date"
                   value="${val(d.insurance_end_date || d.jeonggi)}">
          </div>
        </div>

      </form>
    </div>

    <!-- 모바일 버전 (768px 미만) -->
    <div class="mobile-modal d-block d-md-none">
      <div class="mobile-form-container">
        
        <!-- 상호 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">상호</label>
          <input type="text" class="form-control mobile-input" 
                 id="company_mobile" value="${val(d.company)}">
        </div>
        
        <!-- 사업자번호 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">사업자번호</label>
          <input type="text" class="form-control mobile-input" 
                 id="business_number_mobile" 
                 placeholder="하이픈 없이 번호만" 
                 value="${val(d.business_number || d.school2)}">
        </div>
        
        <!-- 주소 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">주소</label>
          <input type="text" class="form-control mobile-input" 
                 id="address_mobile" value="${val(d.address || d.juso)}">
        </div>
        
        <!-- 이메일 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">이메일</label>
          <input type="email" class="form-control mobile-input" 
                 id="email_mobile" value="${val(d.email)}">
        </div>
        
        <!-- 일반전화 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">일반전화</label>
          <input type="tel" class="form-control mobile-input" 
                 id="general_phone_mobile" 
                 value="${val(d.general_phone || d.hphone2)}">
        </div>
      
        <!-- 휴대전화 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">휴대전화</label>
          <input type="tel" class="form-control mobile-input" 
                 id="mobile_phone_mobile" 
                 value="${val(d.mobile_phone || d.hphone)}">
        </div>
        
        <!-- 신청자명 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">신청자명</label>
          <input type="text" class="form-control mobile-input" 
                 id="applicant_name_mobile" 
                 value="${val(d.applicant_name || d.damdangja)}">
        </div>
        
        <!-- 주민번호 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">주민번호</label>
          <input type="text" class="form-control mobile-input" 
                 id="resident_number_mobile"
                 maxlength="13" placeholder="'-' 없이 숫자만 입력" 
                 value="${val(d.resident_number || d.jumin)}">
        </div>
        
        <!-- ✅ 전문인수 모바일 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">
            전문인수 
            ${isLockedStatus ? '<span class="badge bg-secondary ms-2">변경불가</span>' : ''}
          </label>
          <select id="expert_count_mobile" 
                  class="form-control mobile-input ${disabledClass}" ${disabledAttr}>
            <option value="-1">선택</option>
            ${[1,2,3,4,5,6,7].map(n => `
              <option value="${n}" ${String(d.expert_count || d.chemist) === String(n) ? 'selected' : ''}>${n}명</option>
            `).join('')}
          </select>
        </div>
        
        <!-- ✅ 보상한도 모바일 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">
            보상한도
            ${isLockedStatus ? '<span class="badge bg-secondary ms-2">변경불가</span>' : ''}
            ${hasSingleLimit ? '<span class="badge bg-info ms-2">1억 고정</span>' : ''}
            ${hasMultipleLimits && !isLockedStatus ? '<span class="badge bg-success ms-2">선택가능</span>' : ''}
          </label>
          <select id="coverage_limit_mobile" 
                  class="form-control mobile-input ${coverageDisabledClass}" ${coverageDisabledAttr}>
            ${coverageLimitOptions}
          </select>
        </div>
      
        <!-- ✅ 재고자산 모바일 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">
            재고자산 
            ${isLockedStatus ? '<span class="badge bg-secondary ms-2">변경불가</span>' : ''}
          </label>
          <select id="inventory_value_mobile" 
                  class="form-control mobile-input ${disabledClass}" ${disabledAttr}>
            <option value="-1" ${String(d.jaegojasan || d.inventory_value) === "-1" ? "selected" : ""}>미가입</option>
            <option value="1" ${String(d.jaegojasan || d.inventory_value) === "1" ? "selected" : ""}>5천만원</option>
            <option value="2" ${String(d.jaegojasan || d.inventory_value) === "2" ? "selected" : ""}>1억원</option>
            <option value="3" ${String(d.jaegojasan || d.inventory_value) === "3" ? "selected" : ""}>2억원</option>
            <option value="4" ${String(d.jaegojasan || d.inventory_value) === "4" ? "selected" : ""}>3억원</option>
            <option value="5" ${String(d.jaegojasan || d.inventory_value) === "5" ? "selected" : ""}>5억원</option>
          </select>
        </div>
        
        <!-- 보험료 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">보험료(기본)</label>
          <div class="mobile-premium-display" id="premium_mobile">
            ${val(d.premium_formatted || d.preminum)} 원
          </div>
        </div>

        <!-- ✅ 사업장면적 모바일 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">
            사업장면적 
            ${isLockedStatus ? '<span class="badge bg-secondary ms-2">변경불가</span>' : ''}
          </label>
          <input type="text" class="form-control mobile-input ${disabledClass}" 
                 id="business_area_mobile" 
                 value="${val(d.business_area || d.area)}" 
                 placeholder="면적을 입력하세요" ${disabledAttr}>
        </div>
        
        <!-- 전문인설계번호 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">전문인설계번호</label>
          <div class="input-group">
            <input type="text" class="form-control mobile-input" 
                   id="expert_design_number_mobile" 
                   value="${val(d.expert_design_number || d.chemistDesignNumer)}">
            <button class="btn btn-outline-primary btn-sm" type="button" 
                    onclick="saveDesignNumber(${pharmacyId}, true, 'expert')">
              입력
            </button>
          </div>
        </div>
        
        <!-- 전문인증권발행 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">전문인증권발행</label>
          <div class="mobile-triple-btn">
            <input type="text" class="form-control mobile-input" 
                   id="expert_certificate_number_mobile" 
                   value="${val(d.expert_certificate_number || d.chemistCerti)}">
            <button class="btn btn-outline-primary btn-sm" type="button" 
                    onclick="saveCertificateNumber(${pharmacyId}, true, 'expert')">
              입력
            </button>
            <button class="btn btn-cert-view btn-sm" type="button" 
                    onclick="viewCertificateByNum(${pharmacyId}, 'expert', '${expertCertFile?.description2 || ''}')" 
                    ${!hasExpertCert ? 'disabled' : ''}>
              보기
            </button>
          </div>
        </div>

        <!-- 화재설계번호 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">화재설계번호</label>
          <div class="input-group">
            <input type="text" class="form-control mobile-input" 
                   id="fire_design_number_mobile" 
                   value="${val(d.fire_design_number || d.areaDesignNumer)}">
            <button class="btn btn-outline-success btn-sm" type="button" 
                    onclick="saveDesignNumber(${pharmacyId}, true, 'fire')">
              입력
            </button>
          </div>
        </div>
        
        <!-- 화재증권발행 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">화재증권발행</label>
          <div class="mobile-triple-btn">
            <input type="text" class="form-control mobile-input" 
                   id="fire_certificate_number_mobile" 
                   value="${val(d.fire_certificate_number || d.areaCerti)}">
            <button class="btn btn-outline-success btn-sm" type="button" 
                    onclick="saveCertificateNumber(${pharmacyId}, true, 'fire')">
              입력
            </button>
            <button class="btn btn-cert-view btn-sm" type="button" 
                    onclick="viewCertificateByNum(${pharmacyId}, 'fire', '${fireCertFile?.description2 || ''}')" 
                  ${!hasFireCert ? 'disabled' : ''}>
              보기
            </button>
          </div>
        </div>
        
        <!-- 보험기간 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">보험기간</label>
          <div class="row">
            <div class="col-6">
              <input type="date" class="form-control mobile-input" 
                     id="insurance_start_date_mobile"
                     value="${val(d.insurance_start_date || d.sigi)}">
            </div>
            <div class="col-6">
              <input type="date" class="form-control mobile-input" 
                     id="insurance_end_date_mobile"
                     value="${val(d.insurance_end_date || d.jeonggi)}">
            </div>
          </div>
        </div>
        
        <!-- 메시지 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">메시지</label>
          <textarea class="form-control mobile-input" id="message_mobile" 
                    rows="3" readonly style="background-color: #f8f9fa;">${val(d.message)}</textarea>
        </div>
        
        <!-- 메모 -->
        <div class="mobile-field-group">
          <label class="mobile-field-label">메모</label>
          <textarea class="form-control mobile-input" id="memo_mobile" 
                    rows="3" placeholder="메모를 입력하세요...">${val(d.memo)}</textarea>
        </div>

      </div>
    </div>
  `;

  // ========== 5. HTML을 모달 본문에 삽입 ==========
  
  document.getElementById('modalBody').innerHTML = html;
  
  // ========== 6. 이벤트 리스너 등록 ==========
  
  setTimeout(() => {
    // 전화번호 자동 포맷팅
    setupPhoneInputs();
    
    // ✅ 담보 변경 불가 상태가 아닐 때만 이벤트 리스너 추가
    if (!isLockedStatus) {
      // 전문인수 변경
      document.getElementById('expert_count').addEventListener('change', () => calculatePremium(pharmacyId));
      document.getElementById('expert_count_mobile').addEventListener('change', () => calculatePremium(pharmacyId));
      
      // ✅ 보상한도 변경 (선택 가능한 거래처만)
      if (hasMultipleLimits) {
        document.getElementById('coverage_limit').addEventListener('change', () => calculatePremium(pharmacyId));
        document.getElementById('coverage_limit_mobile').addEventListener('change', () => calculatePremium(pharmacyId));
      }
      
      // 재고자산 변경
      document.getElementById('inventory_value').addEventListener('change', () => calculatePremium(pharmacyId));
      document.getElementById('inventory_value_mobile').addEventListener('change', () => calculatePremium(pharmacyId));
      
      // 사업장면적 변경 (디바운스)
      document.getElementById('business_area').addEventListener('input', debounce(() => calculatePremium(pharmacyId), 500));
      document.getElementById('business_area_mobile').addEventListener('input', debounce(() => calculatePremium(pharmacyId), 500));
    }
    
    // ✅ 메모 Enter 저장 바인딩
    setupEnterToSubmit(pharmacyId);
  }, 100);
  
  // ========== 7. 모달 푸터 설정 ==========
  
  document.getElementById('modalFoot').innerHTML = `
    <div class="d-flex justify-content-between align-items-center w-100">
      <div>
        <span class="d-none d-md-inline">${accountName}</span>
        <span class="d-md-none text-muted small">${accountName}</span>
        <span class="badge ${hasSingleLimit ? 'bg-primary' : 'bg-success'} ms-2">
          ${hasSingleLimit ? '표준형' : '선택형'}
        </span>
      </div>
      <button type="button" class="btn btn-warning" onclick="updatePharmacyResponsive(${pharmacyId})">
        <i class="fas fa-save"></i> 
        <span class="d-none d-sm-inline">수정</span>
      </button>
    </div>
  `;
}
// 메모에서 Enter 누르면 서버와 통신 (토스트 메시지 사용)
function setupEnterToSubmit(pharmacyId) {
  const bind = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('keydown', (e) => {
      if (e.isComposing) return; // 한글 조합 중이면 무시
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        const memoValue = el.value.trim();

        // 서버로 메모만 전송
        fetch(`/api/pharmacy2/${pharmacyId}/memo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ memo: memoValue })
        })
        .then(res => {
          // ✅ HTTP 상태 코드 확인
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(resp => {
          if (resp.success) {
            // ✅ 기존에 있던 토스트 메시지 함수 호출
            window.sjTemplateLoader.showToast("메모가 저장되었습니다.", "success");
            console.log("메모 저장 성공:", resp);
          } else {
            const errorMsg = resp.error || "메모 저장 실패";
            console.error("메모 저장 실패:", resp);
            window.sjTemplateLoader.showToast(errorMsg, "error");
          }
        })
        .catch(err => {
          console.error("메모 저장 오류:", err);
          window.sjTemplateLoader.showToast("서버 통신 오류: " + err.message, "error");
        });
      }
    });
  };

  // 데스크톱 / 모바일 메모 모두 바인딩
  bind('memo');
  bind('memo_mobile');
}

/* 담보 수정에 따라 보험료 수정*/

async function calculatePremium(pharmacyId) {
    // 현재 거래처(account) 값 가져오기
    const accountNum = getCurrentAccount();
    
    const data = {
        pharmacy_id: pharmacyId,
        expert_count: getValue('expert_count'),
        expert_limit: getValue('coverage_limit'),    // chemist_limit로 전송
        inventory_value: getValue('inventory_value'), 
        business_area: getValue('business_area'),
        account: accountNum  // ✅ account 값 포함
    };
    
    console.log(`[calculatePremium] 보험료 계산 요청 - account: ${accountNum}, expert_limit: ${data.expert_limit}`);
    
    try {
        // ✅ 단일 엔드포인트만 호출 (라우터가 분기 처리)
        const response = await fetch('/api/pharmacy2/calculate-premium', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            updatePremiumDisplay(result.data.premium_formatted);
            if (result.message) {
                window.sjTemplateLoader.showToast(result.message);
            }
        } else {
            window.sjTemplateLoader.showToast(result.error || '보험료 계산에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('보험료 계산 오류:', error);
        window.sjTemplateLoader.showToast('서버 통신 중 오류가 발생했습니다.');
    }
}

// ✅ 현재 거래처 정보 가져오는 헬퍼 함수
function getCurrentAccount() {
    // 모달 data 속성에서 가져오기
    const modal = document.getElementById('dynamicModal');
    if (modal && modal.dataset.account) {
        return modal.dataset.account;
    }
    
    // 전역 변수 사용
    if (window.currentPharmacyAccount) {
        return window.currentPharmacyAccount;
    }
    
    console.warn('account 값을 찾을 수 없습니다. 기본값 1 사용');
    return '1'; // 기본값
}

// 1. debounce 함수 - 입력 지연 처리용
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 2. getValue 헬퍼 함수 - 데스크톱/모바일 값 가져오기
function getValue(fieldName) {
    // 데스크톱 버전 먼저 확인
    const desktopElement = document.getElementById(fieldName);
    if (desktopElement && desktopElement.style.display !== 'none') {
        return desktopElement.value;
    }
    
    // 모바일 버전 확인
    const mobileElement = document.getElementById(fieldName + '_mobile');
    if (mobileElement) {
        return mobileElement.value;
    }
    
    return '';
}

// 3. updatePremiumDisplay 함수 - 보험료 화면 업데이트
function updatePremiumDisplay(premiumFormatted) {
    // 데스크톱 버전 업데이트
    const desktopPremium = document.getElementById('premium');
    if (desktopPremium) {
        desktopPremium.textContent = premiumFormatted + ' 원';
    }
    
    // 모바일 버전 업데이트
    const mobilePremium = document.getElementById('premium_mobile');
    if (mobilePremium) {
        mobilePremium.textContent = premiumFormatted + ' 원';
    }
}

/************************************/
/* 보험료 검증 함수
/************************************/
async function verifyPremium(pharmacyId) {
  try {
    const response = await fetch(`/api/pharmacy/premium-verify?pharmacy_id=${pharmacyId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      if (data.is_match) {
        window.sjTemplateLoader.showToast('보험료가 일치합니다.', 'success');
        console.log('보험료 검증 성공:', data);
        
        // 상세 화면에 결과 표시
        const resultElement = document.getElementById('premium_verification_result');
        if (resultElement) {
          resultElement.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> 일치</span>';
        }
      } else {
        const message = `보험료 불일치 발견!\n\nDB 저장값: ${number_format(data.db_premium)}원\n계산값: ${number_format(data.calculated_premium)}원\n차이: ${number_format(data.difference)}원\n\n전문인 보험료: ${number_format(data.calculated_expert_premium)}원\n화재 보험료: ${number_format(data.calculated_fire_premium)}원`;
        alert(message);
        console.warn('보험료 불일치:', data);
        
        // 상세 화면에 결과 표시
        const resultElement = document.getElementById('premium_verification_result');
        if (resultElement) {
          resultElement.innerHTML = `
            <span class="text-danger">
              <i class="fas fa-exclamation-triangle"></i> 
              불일치: DB ${number_format(data.db_premium)}원 vs 계산 ${number_format(data.calculated_premium)}원 
              (차이: ${number_format(data.difference)}원)
            </span>
          `;
        }
      }
    } else {
      throw new Error(data.error || '검증 실패');
    }
  } catch (error) {
    console.error('보험료 검증 오류:', error);
    window.sjTemplateLoader.showToast('보험료 검증 중 오류가 발생했습니다.', 'error');
  }
}

// 숫자 포맷팅 헬퍼 함수
function number_format(num) {
  if (!num && num !== 0) return '0';
  return parseFloat(num).toLocaleString('ko-KR');
}

/************************************/
/* 담보 변경 끝 보험료 계산
/************************************/
async function updatePharmacyResponsive(pharmacyId) {
  const isMobile = window.innerWidth < 768;
  const suffix = isMobile ? '_mobile' : '';

  const formData = {
    company: document.getElementById(`company${suffix}`)?.value.trim(),
    business_number: document.getElementById(`business_number${suffix}`)?.value.trim(),
    address: document.getElementById(`address${suffix}`)?.value.trim(),
    general_phone: document.getElementById(`general_phone${suffix}`)?.value.trim(),
    mobile_phone: document.getElementById(`mobile_phone${suffix}`)?.value.trim(),
    email: document.getElementById(`email${suffix}`)?.value.trim(),
    applicant_name: document.getElementById(`applicant_name${suffix}`)?.value.trim(),
    resident_number: document.getElementById(`resident_number${suffix}`)?.value.trim(),
    chemist_limit: document.getElementById(`coverage_limit${suffix}`)?.value,  // ✅ chemistLimit 추가
  };

  try {
    const response = await fetch(`/api/pharmacy/id-update/${pharmacyId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();

    if (result.success) {
      window.sjTemplateLoader.showToast(result.message || "수정이 완료되었습니다.");

      // 보험료 영역 업데이트
      if (result.data && result.data.premium) {
        const formattedPremium = Number(result.data.premium).toLocaleString('ko-KR');
        
        const desktopPremium = document.getElementById("premium");
        if (desktopPremium) {
          desktopPremium.textContent = `${formattedPremium} 원`;
        }
        
        const mobilePremium = document.getElementById("premium_mobile");
        if (mobilePremium) {
          mobilePremium.textContent = `${formattedPremium} 원`;
        }
      }

    } else {
      alert("수정 실패: " + (result.message || "알 수 없는 오류"));
    }

  } catch (err) {
    alert("수정 중 오류 발생: " + err.message);
  }
}

// 화면 크기 변경 감지 및 동기화
function syncFormData() {
  const isMobile = window.innerWidth < 768;
  
  // 현재 표시되는 버전에서 숨겨진 버전으로 데이터 동기화
  const fields = [
    'company', 'business_number', 'address', 'general_phone', 'mobile_phone',
    'email', 'applicant_name', 'resident_number', 'certificate_number', 
    'memo', 'insurance_start_date', 'insurance_end_date', 'expert_count', 'inventory_value'
  ];

  fields.forEach(fieldName => {
    const desktopField = document.getElementById(fieldName);
    const mobileField = document.getElementById(`${fieldName}_mobile`);
    
    if (desktopField && mobileField) {
      if (isMobile) {
        // 모바일로 전환 시: 데스크톱 → 모바일로 복사
        mobileField.value = desktopField.value;
      } else {
        // 데스크톱으로 전환 시: 모바일 → 데스크톱으로 복사
        desktopField.value = mobileField.value;
      }
    }
  });
}

// 리사이즈 이벤트 리스너 추가
let resizeTimeout;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(syncFormData, 250);
});

// 모달이 열릴 때 초기 동기화
document.addEventListener('DOMContentLoaded', function() {
  // 모달 열기 이벤트가 있을 때 실행
  const modalElement = document.getElementById('dynamicModal');
  if (modalElement) {
    modalElement.addEventListener('shown.bs.modal', function() {
      syncFormData();
    });
  }
});

/*증권번호 저장 */
// 증권번호 저장 함수

async function saveCertificateNumber(pharmacyId, isMobile = false, certificateType = 'expert') {
  const suffix = isMobile ? '_mobile' : '';
  const fieldId = `${certificateType}_certificate_number${suffix}`;
  const certificateInput = document.getElementById(fieldId);
  
  if (!certificateInput) {
    alert('증권번호 입력 필드를 찾을 수 없습니다.');
    return;
  }
  
  const certificateNumber = certificateInput.value.trim();
  
  if (!certificateNumber) {
    alert('증권번호를 입력해주세요.');
    certificateInput.focus();
    return;
  }
  
  // 확인 메시지
  const typeText = certificateType === 'expert' ? '전문인' : '화재';
  if (!confirm(`${typeText} 증권번호 "${certificateNumber}"를 저장하시겠습니까?`)) {
    return;
  }
  
  try {
    // 버튼 찾기 (certificateType에 따라 구분)
    const btnId = `btn${certificateType.charAt(0).toUpperCase() + certificateType.slice(1)}CertiInput${isMobile ? 'Mobile' : ''}`;
    const btn = certificateInput.parentElement.querySelector('button');
    
    if (btn) {
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장중...';
    }
    
    // 서버로 데이터 전송
    const response = await fetch('/api/pharmacy2/certificate-number', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        pharmacyId: pharmacyId,
        certificateNumber: certificateNumber,
        certificateType: certificateType  // 'expert' 또는 'fire'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // 성공 메시지
      window.sjTemplateLoader.showToast(result.message || `${typeText} 증권번호가 저장되었습니다.`, 'success');
      
      // 다른 버전의 입력 필드도 동기화 (데스크톱 ↔ 모바일)
      const otherSuffix = isMobile ? '' : '_mobile';
      const otherFieldId = `${certificateType}_certificate_number${otherSuffix}`;
      const otherInput = document.getElementById(otherFieldId);
      if (otherInput) {
        otherInput.value = certificateNumber;
      }
       // 보험기간 필드 업데이트 (추가)
			  if (result.data && result.data.insurance_start_date && result.data.insurance_end_date) {
				// 데스크톱 버전 업데이트
				const startDateDesktop = document.getElementById('insurance_start_date');
				const endDateDesktop = document.getElementById('insurance_end_date');
				
				if (startDateDesktop) startDateDesktop.value = result.data.insurance_start_date;
				if (endDateDesktop) endDateDesktop.value = result.data.insurance_end_date;
				
				// 모바일 버전 업데이트
				const startDateMobile = document.getElementById('insurance_start_date_mobile');
				const endDateMobile = document.getElementById('insurance_end_date_mobile');
				
				if (startDateMobile) startDateMobile.value = result.data.insurance_start_date;
				if (endDateMobile) endDateMobile.value = result.data.insurance_end_date;
			  }
      
      // 증권번호 저장 시 상태가 변경될 수 있으므로 목록 갱신
      // 현재 필터 상태에 따라 목록에서 제거 또는 갱신
      if (result.data && result.data.new_status) {
        const newStatus = result.data.new_status.toString();
        // 현재 필터와 다른 상태로 변경되면 목록에서 제거
        if (currentStatusFilter && newStatus !== currentStatusFilter) {
          removePharmacyFromList(pharmacyId);
        } else {
          // 현재 페이지 유지하며 데이터만 갱신
          loadPharmacyData();
        }
      } else {
        // 상태 정보가 없으면 그냥 갱신
        loadPharmacyData();
      }
    } else {
      throw new Error(result.message || '저장에 실패했습니다.');
    }
    
  } catch (error) {
    console.error('증권번호 저장 오류:', error);
    alert('증권번호 저장 중 오류가 발생했습니다: ' + error.message);
    
  } finally {
    // 버튼 원상복구
    const btn = certificateInput.parentElement.querySelector('button');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.textContent.includes('전문인') ? '증권번호입력' : '증권번호입력';
    }
  }
}


/*증권번호 저장 끝*/

/**설계번호**/
async function saveDesignNumber(pharmacyId, isMobile = false, designType = 'expert') {
  const suffix = isMobile ? '_mobile' : '';
  const fieldId = `${designType}_design_number${suffix}`;
  const designInput = document.getElementById(fieldId);
  
  if (!designInput) {
    alert('설계번호 입력 필드를 찾을 수 없습니다.');
    return;
  }
  
  const designNumber = designInput.value.trim();
  
  if (!designNumber) {
    alert('설계번호를 입력해주세요.');
    designInput.focus();
    return;
  }
  
  // 확인 메시지
  const typeText = designType === 'expert' ? '전문인' : '화재';
  if (!confirm(`${typeText} 설계번호 "${designNumber}"를 저장하시겠습니까?`)) {
    return;
  }
  
  try {
    // 버튼 찾기
    const btn = designInput.parentElement.querySelector('button');
    
    if (btn) {
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장중...';
    }
    
    // 서버로 데이터 전송
    const response = await fetch('/api/pharmacy2/design-number', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        pharmacyId: pharmacyId,
        designNumber: designNumber,
        designType: designType  // 'expert' 또는 'fire'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // 성공 메시지
      window.sjTemplateLoader.showToast(result.message || `${typeText} 설계번호가 저장되었습니다.`, 'success');
      
      // 다른 버전의 입력 필드도 동기화 (데스크톱 ↔ 모바일)
      const otherSuffix = isMobile ? '' : '_mobile';
      const otherFieldId = `${designType}_design_number${otherSuffix}`;
      const otherInput = document.getElementById(otherFieldId);
      if (otherInput) {
        otherInput.value = designNumber;
      }
      
      // 리스트 화면의 설계번호 입력 필드도 업데이트
      const listFieldId = designType === 'expert' ? `chemist_${pharmacyId}` : `area_${pharmacyId}`;
      const listField = document.getElementById(listFieldId);
      if (listField) {
        listField.value = designNumber;
      }
      
      // 설계번호 저장 시 상태가 17(설계중)로 변경되므로 목록에서 제거
      // 현재 필터가 '13'(승인)이고 상태가 변경되면 목록에서 제거
      if (currentStatusFilter === '13') {
        removePharmacyFromList(pharmacyId);
      } else {
        // 현재 페이지 유지하며 데이터만 갱신
        loadPharmacyData();
      }
    } else {
      throw new Error(result.message || '저장에 실패했습니다.');
    }
    
  } catch (error) {
    console.error('설계번호 저장 오류:', error);
    alert('설계번호 저장 중 오류가 발생했습니다: ' + error.message);
    
  } finally {
    // 버튼 원상복구
    const btn = designInput.parentElement.querySelector('button');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '입력';
    }
  }
}
/**설계번호끝**/
/*****************************************************/	
/*  모달 열기 함수 끝
/*****************************************************/


