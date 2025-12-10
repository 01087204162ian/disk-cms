/********************************************/
/*엡체 추가 모달
/********************************************/
/**
 * 디바운스 유틸리티 함수
 */
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
async function openaddCompanyModal(){
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

  try {
    // 서버에서 데이터 가져오기
    const response = await fetch(`/api/pharmacy2/customers`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    displayAddCompany(data);

  } catch (err) {
    document.getElementById('modalBody').innerHTML = `
      <div class="alert alert-danger">
        데이터를 불러올 수 없습니다: ${err.message}
      </div>
    `;
  }
}

/**
 * 거래처(업체) 추가 목록을 반응형 모달로 표시
 * @param {object} resp 서버 응답 객체 (success, data[], pagination …)
 */
function displayAddCompany(resp){
  // 안전 유틸
  const _esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const _nv = (v, fb='') => (v==null || v==='') ? fb : v;

  // 데이터 정리
  const ok   = !!resp?.success;
  const list = Array.isArray(resp?.data) ? resp.data : [];
  const pag  = resp?.pagination || {};
  const count = list.length;

  // 타이틀 업데이트
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) titleEl.textContent = `거래처 관리 (${count.toLocaleString()}건)`;

  // 반응형 모달 바디
  const bodyEl = document.getElementById('modalBody');
  if (bodyEl){
    bodyEl.innerHTML = `
      <!-- 데스크톱 버전 (768px 이상) -->
      <div class="desktop-company-modal d-none d-md-block">
	   <form id="company-form"> <!-- form 태그 추가 --> 
        <div class="table-responsive">
          <table class="table table-bordered table-hover table-sm align-middle">
            <thead class="thead-light">
              <tr>
                <th class="col-number_1">#</th>
                <th class="col-company-name_1">업체명</th>
                <th class="col-business-number_1">아이디</th>
                <th class="col-phone_1">휴대전화</th>
                <th class="col-password_1">비밀번호</th>
                <th class="col-date_1">등록일</th>
                <th class="col-status_1">관리</th>
              </tr>
            </thead>
            <tbody id="addCompany_table_body">
              <tr>
                <td colspan="7" class="text-center py-4">데이터를 불러오는 중...</td>
              </tr>
            </tbody>
          </table>
        </div>
	   </form>
      </div>

      <!-- 모바일 버전 (768px 미만) -->
      <div class="mobile-company-modal d-block d-md-none">
	   <form id="company-form-mobile"> <
        <div class="mobile-company-container" id="addCompany_mobile_cards">
          <div class="text-center py-4">데이터를 불러오는 중...</div>
        </div>
	   </form>
      </div>
    `;
  }

  const tBody  = document.getElementById('addCompany_table_body');
  const mCards = document.getElementById('addCompany_mobile_cards');

  // 데이터 없음 처리
  if (!ok || list.length === 0){
    if (tBody) {
      tBody.innerHTML = `
        <tr><td colspan="7" class="text-center py-4">검색된 데이터가 없습니다.</td></tr>
        ${createNewRowHtml()}
      `;
    }
    if (mCards) {
      mCards.innerHTML = `
        <div class="text-center py-4">검색된 데이터가 없습니다.</div>
        ${createNewMobileCardHtml()}
      `;
    }
  } else {
    // 데스크톱 테이블 렌더링 (기존 데이터 + 신규 행)
    if (tBody){
      const existingRows = list.map((c, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <input type="text" id="name_${c.num}" class="form-control" 
                   value="${_esc(_nv(c.name))}" data-id="${c.num}" placeholder="업체명">
          </td>
          <td>
            <input type="text" id="mem_id_${c.num}" class="form-control" 
                   value="${_esc(_nv(c.mem_id))}" data-id="${c.num}" placeholder="아이디">
          </td>
          <td>
            <input type="tel" id="hphone1_${c.num}" class="form-control" 
                   value="${_esc(_nv(c.hphone1))}" data-id="${c.num}" placeholder="휴대전화">
          </td>
          <td>
            <input type="password" id="password_${c.num}" class="form-control" 
                   placeholder="비밀번호" data-id="${c.num}">
          </td>
          <td>${_esc(_nv(c.wdate))}</td>
          <td>
            <button type="button" class="btn btn-warning btn-sm"
              onclick="updateCustomer(${Number(c.num)})">
              <i class="fas fa-save me-1"></i>수정
            </button>
          </td>
        </tr>
      `).join('');
      
      tBody.innerHTML = existingRows + createNewRowHtml();
    }

    // 모바일 카드 렌더링 (기존 데이터 + 신규 카드)
    if (mCards){
      const existingCards = list.map((c, idx) => `
        <div class="mobile-company-card">
          <div class="mobile-company-header">
            <div class="mobile-company-number">${idx + 1}</div>
            <div class="mobile-company-name-display">${_esc(_nv(c.name))}</div>
            <button type="button" class="btn btn-warning btn-sm mobile-edit-btn"
              onclick="updateCustomer(${Number(c.num)})">
              <i class="fas fa-save"></i>
            </button>
          </div>
          <div class="mobile-company-body">
            <div class="mobile-company-field">
              <span class="mobile-company-label">업체명</span>
              <input type="text" id="name_mobile_${c.num}" class="mobile-input" 
                     value="${_esc(_nv(c.name))}" data-id="${c.num}" placeholder="업체명">
            </div>
            <div class="mobile-company-field">
              <span class="mobile-company-label">아이디</span>
              <input type="text" id="mem_id_mobile_${c.num}" class="mobile-input" 
                     value="${_esc(_nv(c.mem_id))}" data-id="${c.num}" placeholder="아이디">
            </div>
            <div class="mobile-company-field">
              <span class="mobile-company-label">휴대전화</span>
              <input type="tel" id="hphone1_mobile_${c.num}" class="mobile-input" 
                     value="${_esc(_nv(c.hphone1))}" data-id="${c.num}" placeholder="휴대전화">
            </div>
            <div class="mobile-company-field">
              <span class="mobile-company-label">비밀번호</span>
              <input type="password" id="password_mobile_${c.num}" class="mobile-input" 
                     placeholder="비밀번호" data-id="${c.num}">
            </div>
            <div class="mobile-company-field">
              <span class="mobile-company-label">등록일</span>
              <span class="mobile-company-value">${_esc(_nv(c.wdate))}</span>
            </div>
          </div>
        </div>
      `).join('');
      
      mCards.innerHTML = existingCards + createNewMobileCardHtml();
    }
	
	 setTimeout(() => {
		setupPhoneInputs();
		
		// 데스크톱과 모바일 모두 처리
		const setupDuplicateCheck = (suffix) => {
		  const memIdInput = document.getElementById(`mem_id${suffix}`);
		  if (memIdInput) {
			memIdInput.addEventListener('input', 
			  debounce(async (e) => {
				const memId = e.target.value.trim();
				if (memId.length >= 3) {
				  await checkIdDuplicate(memId, e.target);
				}
			  }, 500)
			);
		  }
		};
		
		// 신규 입력 필드에 이벤트 리스너 추가
		setupDuplicateCheck('_new');
		setupDuplicateCheck('_mobile_new');
	  }, 100);
  }

  // 반응형 푸터
  const footEl = document.getElementById('modalFoot');
  if (footEl){
    footEl.innerHTML = `
      <div class="d-flex justify-content-between align-items-center w-100">
        <small class="text-muted company-modal-info">
          <span class="d-none d-sm-inline">총 ${Number(pag.total_count ?? list.length).toLocaleString()}건</span>
          <span class="d-sm-none">${Number(pag.total_count ?? list.length).toLocaleString()}건</span>
          <span class="d-none d-md-inline"> • ${Number(pag.current_page || 1)} / ${Number(pag.total_pages || 1)}페이지</span>
        </small>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <span class="d-none d-sm-inline">닫기</span>
          <span class="d-sm-none"><i class="fas fa-times"></i></span>
        </button>
      </div>
    `;
	  
	  
  }
  setTimeout(() => {
    setupPhoneInputs();
  }, 100);
  // 모달이 이미 열려있다면 다시 열지 않음
  try{
    const modalEl = document.getElementById('dynamicModal');
    if (modalEl && !modalEl.classList.contains('show')){
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    }
  }catch(e){
    console.debug('Bootstrap Modal error:', e?.message);
  }
}

// 신규 행 HTML 생성 (데스크톱) - form-control로 통일
function createNewRowHtml() {
  return `
    <tr class="new-company-row">
      <td>
        <span class="badge bg-success">신규</span>
      </td>
      <td>
        <input type="text" id="name_new" class="form-control" placeholder="업체명 입력">
      </td>
      <td>
        <input type="text" id="mem_id_new" class="form-control" placeholder="아이디 입력">
      </td>
      <td>
        <input type="tel" id="hphone1_new" class="form-control" placeholder="휴대전화 입력">
      </td>
      <td>
        <input type="password" id="password_new" class="form-control" placeholder="비밀번호 입력">
      </td>
      <td>
        <small class="text-muted">신규</small>
      </td>
      <td>
        <button type="button" class="btn btn-success btn-sm" onclick="saveNewCustomer()">
          <i class="fas fa-plus me-1"></i>저장
        </button>
      </td>
    </tr>
  `;
}

// 신규 카드 HTML 생성 (모바일) - 변경 없음 (모바일은 mobile-input 클래스 유지)
function createNewMobileCardHtml() {
  return `
    <div class="mobile-company-card new-company-card">
      <div class="mobile-company-header">
        <div class="mobile-company-number bg-success">
          <i class="fas fa-plus"></i>
        </div>
        <div class="mobile-company-name-display">신규 고객 추가</div>
        <button type="button" class="btn btn-success btn-sm mobile-edit-btn" onclick="saveNewCustomer()">
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <div class="mobile-company-body">
        <div class="mobile-company-field">
          <span class="mobile-company-label">업체명</span>
          <input type="text" id="name_mobile_new" class="mobile-input" placeholder="업체명 입력">
        </div>
        <div class="mobile-company-field">
          <span class="mobile-company-label">아이디</span>
          <input type="text" id="mem_id_mobile_new" class="mobile-input" placeholder="아이디 입력">
        </div>
        <div class="mobile-company-field">
          <span class="mobile-company-label">휴대전화</span>
          <input type="text" id="hphone1_mobile_new" class="mobile-input" placeholder="휴대전화 입력">
        </div>
        <div class="mobile-company-field">
          <span class="mobile-company-label">비밀번호</span>
          <input type="password" id="password_mobile_new" class="mobile-input" placeholder="비밀번호 입력">
        </div>
      </div>
    </div>
  `;
}

// 신규 카드 HTML 생성 (모바일)
function createNewMobileCardHtml() {
  return `
    <div class="mobile-company-card new-company-card">
      <div class="mobile-company-header">
        <div class="mobile-company-number bg-success">
          <i class="fas fa-plus"></i>
        </div>
        <div class="mobile-company-name-display">신규 고객 추가</div>
        <button type="button" class="btn btn-success btn-sm mobile-edit-btn" onclick="saveNewCustomer()">
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <div class="mobile-company-body">
        <div class="mobile-company-field">
          <span class="mobile-company-label">업체명</span>
          <input type="text" id="name_mobile_new" class="mobile-input" placeholder="업체명 입력">
        </div>
        <div class="mobile-company-field">
          <span class="mobile-company-label">아이디</span>
          <input type="text" id="mem_id_mobile_new" class="mobile-input" placeholder="아이디 입력">
        </div>
        <div class="mobile-company-field">
          <span class="mobile-company-label">휴대전화</span>
          <input type="text" id="hphone1_mobile_new" class="mobile-input" placeholder="휴대전화 입력">
        </div>
        <div class="mobile-company-field">
          <span class="mobile-company-label">비밀번호</span>
          <input type="password" id="password_mobile_new" class="mobile-input" placeholder="비밀번호 입력">
        </div>
      </div>
    </div>
  `;
}

// 기존 고객 수정 함수
async function updateCustomer(customerNum) {
  // 현재 화면 크기에 따라 데스크톱 또는 모바일 버전의 입력값을 가져오기
  const isMobile = window.innerWidth < 768;
  const suffix = isMobile ? `_mobile_${customerNum}` : `_${customerNum}`;

  const formData = {
    name: document.getElementById(`name${suffix}`)?.value.trim(),
    mem_id: document.getElementById(`mem_id${suffix}`)?.value.trim(),
    hphone1: document.getElementById(`hphone1${suffix}`)?.value.trim(),
    passwd: document.getElementById(`password${suffix}`)?.value.trim()
  };

  // 빈 값 체크
  if (!formData.name || !formData.mem_id) {
    alert('업체명과 아이디는 필수 입력 항목입니다.');
    return;
  }

  try {
    console.log(`고객 ${customerNum} 수정:`, formData);
    
    // API 호출 예시 (실제 구현 필요)
    
    const response = await fetch(`/api/pharmacy2/customers/${customerNum}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    if (result.success) {
      alert('수정이 완료되었습니다.');
    } else {
      alert('수정 실패: ' + result.message);
    }
   
    
    //alert(`고객 ${customerNum} 정보가 수정되었습니다.`);
    
  } catch (error) {
    console.error('고객 수정 오류:', error);
    alert('수정 중 오류가 발생했습니다.');
  }
}

async function saveNewCustomer() {
  const isMobile = window.innerWidth < 768;
  const suffix = isMobile ? '_mobile_new' : '_new';

  const formData = {
    name: document.getElementById(`name${suffix}`)?.value.trim(),
    mem_id: document.getElementById(`mem_id${suffix}`)?.value.trim(),
    hphone1: document.getElementById(`hphone1${suffix}`)?.value.trim(),
    passwd: document.getElementById(`password${suffix}`)?.value.trim()
  };

  if (!formData.name || !formData.mem_id || !formData.passwd) {
    alert('업체명, 아이디, 비밀번호는 필수 입력 항목입니다.');
    return;
  }

  try {
    const response = await fetch('/api/pharmacy2/customers', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    
    if (result.success) {
      window.sjTemplateLoader.showToast('신규 고객이 추가되었습니다.', 'success');
      openaddCompanyModal();
    } else if (result.error === 'ID_DUPLICATE') {
      window.sjTemplateLoader.showToast('이미 사용 중인 아이디입니다.', 'error');
    } else {
      window.sjTemplateLoader.showToast('저장 실패: ' + result.message, 'error');
    }
    
  } catch (error) {
    console.error('신규 고객 저장 오류:', error);
    window.sjTemplateLoader.showToast('저장 중 오류가 발생했습니다.', 'error');
  }
}



async function checkIdDuplicate(memId, inputElement) {
  try {
    const response = await fetch('/api/pharmacy2/check-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mem_id: memId })
    });
    
    const result = await response.json();
    
    // 기존 메시지 제거
    const existingMessage = inputElement.nextElementSibling;
    if (existingMessage && existingMessage.classList.contains('id-message')) {
      existingMessage.remove();
    }
    
    // 메시지 div 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = 'id-message';
    
    if (result.available === false) {
      // 중복됨
      inputElement.classList.remove('is-valid');
      inputElement.classList.add('is-invalid');
      messageDiv.innerHTML = `<small class="text-danger">${result.message}</small>`;
    } else if (result.available === true) {
      // 사용가능
      inputElement.classList.remove('is-invalid');
      inputElement.classList.add('is-valid');
      messageDiv.innerHTML = `<small class="text-success">${result.message}</small>`;
    } else {
      // 오류
      inputElement.classList.add('is-invalid');
      messageDiv.innerHTML = `<small class="text-danger">확인 중 오류가 발생했습니다.</small>`;
    }
    
    inputElement.parentElement.appendChild(messageDiv);
    
  } catch (error) {
    console.error('ID 중복검사 오류:', error);
    inputElement.classList.add('is-invalid');
  }
}