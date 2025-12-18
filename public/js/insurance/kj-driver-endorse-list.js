// KJ 대리운전 배서 리스트 - 프론트 스크립트
// API: GET /api/insurance/kj-endorse/list?page=&limit=&push=&endorseDay=&policyNum=&companyNum=&endorseType=

(function () {
  'use strict';

  // DOM 요소
  const tableBody = document.getElementById('endorseListTableBody');
  const mobileCards = document.getElementById('endorseListMobileCards');
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationControls = document.getElementById('paginationControls');

  // 필터 요소
  const endorseDayFilter = document.getElementById('endorseDayFilter');
  const statusFilter = document.getElementById('statusFilter');
  const insuranceComFilter = document.getElementById('insuranceComFilter');
  const policyNumFilter = document.getElementById('policyNumFilter');
  const companyFilter = document.getElementById('companyFilter');
  const pageSizeSelect = document.getElementById('pageSize');

  // 통계 정보
  const statsSubscription = document.getElementById('statsSubscription');
  const statsCancellation = document.getElementById('statsCancellation');
  const statsTotal = document.getElementById('statsTotal');

  // 상태 변수
  let currentPage = 1;
  let currentLimit = 20;
  let currentPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

  // 금액 표시 포맷터 (숫자면 콤마, 0도 표시)
  const formatAmount = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (Number.isNaN(num)) return val;
    return num.toLocaleString();
  };

  // 요율 옵션 (공통 모듈 사용)
  const RATE_OPTIONS = window.KJConstants ? window.KJConstants.RATE_OPTIONS : [
    { value: '-1', label: '선택' },
    { value: '1', label: '1' },
    { value: '2', label: '0.9' },
    { value: '3', label: '0.925' },
    { value: '4', label: '0.898' },
    { value: '5', label: '0.889' },
    { value: '6', label: '1.074' },
    { value: '7', label: '1.085' },
    { value: '8', label: '1.242' },
    { value: '9', label: '1.253' },
    { value: '10', label: '1.314' },
    { value: '11', label: '1.428' },
    { value: '12', label: '1.435' },
    { value: '13', label: '1.447' },
    { value: '14', label: '1.459' },
  ];

  // ==================== 초기화 ====================

  // 보험회사 필터 옵션 초기화
  const initInsuranceComFilter = () => {
    if (!insuranceComFilter) return;
    
    insuranceComFilter.innerHTML = '<option value="">-- 보험회사 선택 --</option>';
    
    // 공통 모듈에서 보험회사 옵션 가져오기
    if (window.KJConstants && window.KJConstants.INSURER_OPTIONS) {
      window.KJConstants.INSURER_OPTIONS.forEach(opt => {
        if (opt.value !== 0) { // '=선택=' 제외
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          insuranceComFilter.appendChild(option);
        }
      });
    } else {
      // Fallback: 공통 모듈이 없을 경우
      const fallbackOptions = [
        { value: 1, label: '흥국' },
        { value: 2, label: 'DB' },
        { value: 3, label: 'KB' },
        { value: 4, label: '현대' },
        { value: 5, label: '롯데' },
        { value: 6, label: '하나' },
        { value: 7, label: '한화' },
        { value: 8, label: '삼성' },
        { value: 9, label: '메리츠' },
      ];
      fallbackOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        insuranceComFilter.appendChild(option);
      });
    }
  };

  // 증권번호 목록 로드 (초기 로드)
  const loadPolicyNumList = async () => {
    try {
      policyNumFilter.disabled = true;
      policyNumFilter.innerHTML = '<option value="">로딩 중...</option>';

      // API 호출: 증권번호 목록 조회
      const response = await fetch(`/api/insurance/kj-endorse/policy-list`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || '증권번호 목록 조회 실패');
      }

      policyNumFilter.innerHTML = '<option value="">-- 증권 선택 --</option>';
      
      if (json.data && json.data.length > 0) {
        json.data.forEach(item => {
          const option = document.createElement('option');
          option.value = item.policyNum || item.policy_num || '';
          
          // 보험회사 코드를 이름으로 변환 (공통 모듈 사용)
          const insuranceComCode = parseInt(item.insuranceCom || item.insurance_com || 0);
          const insuranceComName = window.KJConstants 
            ? window.KJConstants.getInsurerName(insuranceComCode) 
            : (item.insuranceCom || item.insurance_com || '');
          
          option.textContent = `${item.policyNum || item.policy_num || ''} (${insuranceComName})`;
          policyNumFilter.appendChild(option);
        });
        policyNumFilter.disabled = false;
      } else {
        policyNumFilter.innerHTML = '<option value="">-- 증권 없음 --</option>';
        policyNumFilter.disabled = true;
      }
    } catch (error) {
      console.error('증권번호 목록 로드 오류:', error);
      policyNumFilter.innerHTML = '<option value="">-- 오류 발생 --</option>';
      policyNumFilter.disabled = true;
    }
  };

  // 대리운전회사 목록 로드 (증권번호 선택적)
  const loadCompanyList = async (policyNum = null) => {
    try {
      companyFilter.disabled = true;
      companyFilter.innerHTML = '<option value="">로딩 중...</option>';

      // API 호출: 증권번호가 있으면 필터링, 없으면 전체 목록 조회
      const url = policyNum 
        ? `/api/insurance/kj-endorse/company-list?policyNum=${policyNum}`
        : `/api/insurance/kj-endorse/company-list`;
      const response = await fetch(url);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || '대리운전회사 목록 조회 실패');
      }

      companyFilter.innerHTML = '<option value="">-- 대리운전회사 선택 --</option>';
      
      if (json.data && json.data.length > 0) {
        // 현재 선택된 값 저장
        const currentValue = companyFilter.value;
        
        json.data.forEach(item => {
          const option = document.createElement('option');
          option.value = item.companyNum || item.company_num || item.dNum || '';
          option.textContent = item.companyName || item.company_name || item.dName || '';
          // 현재 선택된 값이 있으면 유지
          if (currentValue && option.value === currentValue) {
            option.selected = true;
          }
          companyFilter.appendChild(option);
        });
        companyFilter.disabled = false;
      } else {
        companyFilter.innerHTML = '<option value="">-- 대리운전회사 없음 --</option>';
        companyFilter.disabled = true;
      }
    } catch (error) {
      console.error('대리운전회사 목록 로드 오류:', error);
      companyFilter.innerHTML = '<option value="">-- 오류 발생 --</option>';
      companyFilter.disabled = true;
    }
  };

  // ==================== 데이터 로딩 ====================

  const fetchList = async () => {
    const push = statusFilter.value || '';
    const insuranceCom = insuranceComFilter.value || '';
    const policyNum = policyNumFilter.value || '';
    const companyNum = companyFilter.value || '';
    const endorseDay = endorseDayFilter ? endorseDayFilter.value || '' : '';

    // 로딩 상태 표시
    tableBody.innerHTML = `
      <tr>
        <td colspan="19" class="text-center py-4">
          <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">로딩 중...</span>
          </div>
          데이터를 불러오는 중...
        </td>
      </tr>
    `;
    mobileCards.innerHTML = `<div class="text-center py-4">데이터를 불러오는 중...</div>`;

    // API 파라미터 구성
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', currentLimit);
    if (push) params.append('push', push);
    if (insuranceCom) params.append('insuranceCom', insuranceCom);
    if (policyNum) params.append('policyNum', policyNum);
    if (companyNum) params.append('companyNum', companyNum);
    if (endorseDay) params.append('endorseDay', endorseDay);

    // 디버깅: 파라미터 로그
    console.log('API 호출 파라미터:', {
      push,
      insuranceCom,
      policyNum,
      companyNum,
      url: `/api/insurance/kj-endorse/list?${params.toString()}`
    });

    try {
      const res = await fetch(`/api/insurance/kj-endorse/list?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'API 오류');
      }

      const rows = json.data || [];
      currentPagination = json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
      
      // 통계 정보 업데이트
      updateStats(json.stats || { subscription: 0, cancellation: 0, total: 0 });
      
      renderTable(rows, currentPagination);
      renderMobile(rows);
      renderPagination(
        currentPagination.page || 1,
        currentPagination.totalPages || 1,
        currentPagination.total || 0
      );
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="19" class="text-center text-danger py-4">오류가 발생했습니다: ${err.message}</td>
        </tr>`;
      mobileCards.innerHTML = `<div class="text-center text-danger py-4">오류가 발생했습니다: ${err.message}</div>`;
      paginationInfo.textContent = '';
      paginationControls.innerHTML = '';
    }
  };

  // 통계 정보 업데이트
  const updateStats = (stats) => {
    statsSubscription.textContent = stats.subscription || 0;
    statsCancellation.textContent = stats.cancellation || 0;
    statsTotal.textContent = stats.total || 0;
  };

  // ==================== 렌더링 ====================

  const renderTable = (rows, pagination) => {
    if (rows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="19" class="text-center py-4">조회된 데이터가 없습니다.</td>
        </tr>
      `;
      return;
    }

    let html = '';
    const startNum = (pagination.page - 1) * pagination.limit + 1;

    rows.forEach((row, index) => {
      const rowNum = startNum + index;
      const push = parseInt(row.push) || 0;
      // progress 필드 값 처리 (빈 문자열이면 -1, 숫자면 해당 값)
      const progressValue = row.progressStep === '' || row.progressStep === null || row.progressStep === undefined 
        ? -1 
        : parseInt(row.progressStep) || -1;
      const sangtae = parseInt(row.sangtae) || 0; // sangtae는 배서 신청 상태로 유지
      const cancel = parseInt(row.cancel) || 0;
      
      // 보험사 표시 (공통 모듈 사용)
      const insuranceComCode = parseInt(row.insuranceCom) || 0;
      const insuranceComName = window.KJConstants ? window.KJConstants.getInsurerName(insuranceComCode) : (row.insuranceCom || '');
      
      // 증권성격 표시 (공통 모듈 사용)
      const certiTypeCode = parseInt(row.certiType) || 0;
      const certiTypeName = window.KJConstants ? window.KJConstants.getGitaName(certiTypeCode) : (row.certiType || '');

      // 대리운전회사 정보 (공통 모달용)
      const companyNum = row.companyNum || row.company_num || row.dNum || '';
      const companyName = row.companyName || '';
      
      // 상태 select 생성 (worklog 145-147 참고)
      // 청약 상태 (push=1, sangtae=1): "청약", "취소", "거절" 옵션
      // 해지 상태 (push=4, sangtae=1, cancel=42): "해지", "취소" 옵션
      let statusSelect = '';
      const isSubscription = (push === 1 && sangtae === 1);
      const isCancellation = (push === 4 && sangtae === 1 && cancel === 42);
      
      if (isSubscription) {
        // 청약: 청약, 취소, 거절
        const currentValue = row.endorseProcess || '청약';
        statusSelect = `
          <select class="form-select form-select-sm endorse-status-select" 
                  data-num="${row.num}" 
                  data-push="${push}" 
                  data-sangtae="${sangtae}"
                  style="border: none; background-color: white; font-size: 0.6875rem;">
            <option value="청약" ${currentValue === '청약' ? 'selected' : ''}>청약</option>
            <option value="취소" ${currentValue === '취소' ? 'selected' : ''}>취소</option>
            <option value="거절" ${currentValue === '거절' ? 'selected' : ''}>거절</option>
          </select>
        `;
      } else if (isCancellation) {
        // 해지: 해지, 취소
        const currentValue = row.endorseProcess || '해지';
        statusSelect = `
          <select class="form-select form-select-sm endorse-status-select" 
                  data-num="${row.num}" 
                  data-push="${push}" 
                  data-sangtae="${sangtae}" 
                  data-cancel="${cancel}"
                  style="border: none; background-color: white; font-size: 0.6875rem;">
            <option value="해지" ${currentValue === '해지' ? 'selected' : ''}>해지</option>
            <option value="취소" ${currentValue === '취소' ? 'selected' : ''}>취소</option>
          </select>
        `;
      } else {
        // 기타: 빈 값 또는 현재 값 표시
        statusSelect = `<span>${row.endorseProcess || ''}</span>`;
      }
      
      // 배서처리 상태 select 생성 (sangtae: 1=미처리, 2=처리)
      const currentSangtae = sangtae || 1;
      const processSelect = `
        <select class="form-select form-select-sm endorse-process-select" 
                data-num="${row.num}" 
                data-current-sangtae="${currentSangtae}"
                style="border: none; background-color: white; font-size: 0.6875rem;">
          <option value="1" ${currentSangtae == 1 ? 'selected' : ''}>미처리</option>
          <option value="2" ${currentSangtae == 2 ? 'selected' : ''}>처리</option>
        </select>
      `;

      // 요율 select 생성
      const currentRate = (row.rate ?? '').toString();
      const jumin = row.jumin || '';
      const policyNum = row.policyNum || '';
      const rateDisabled = !jumin || !policyNum;
      const rateOptionsHtml = RATE_OPTIONS.map(opt => {
        const sel = opt.value === currentRate ? 'selected' : '';
        return `<option value="${opt.value}" ${sel}>${opt.label}</option>`;
      }).join('');
      const premiumFormatted = formatAmount(row.premium);
      const cPremiumFormatted = formatAmount(row.cPremium);
      const rateSelect = `
        <div class="d-flex align-items-center gap-1">
          <select class="form-select form-select-sm endorse-rate-select"
                  data-num="${row.num}"
                  data-jumin="${jumin}"
                  data-policy="${policyNum}"
                  data-current-rate="${currentRate}"
                  ${rateDisabled ? 'disabled' : ''}
                  style="border: none; background-color: white; font-size: 0.6875rem;">
            ${rateOptionsHtml}
          </select>
          <div class="spinner-border spinner-border-sm text-primary d-none" role="status" data-role="rate-loading">
            <span class="visually-hidden">로딩 중...</span>
          </div>
        </div>
      `;

      // 진행단계 select 생성 (progress 필드 값 사용, 빈 문자열이거나 없으면 -1로 표시)
      const currentProgressStep = (progressValue && progressValue > 0) ? progressValue : -1;
      const progressSelect = `
        <select class="form-select form-select-sm endorse-progress-select"
                data-num="${row.num}"
                data-current-progress="${currentProgressStep}"
                style="border: none; background-color: white; font-size: 0.6875rem;">
          <option value="-1" ${currentProgressStep === -1 || currentProgressStep === 0 ? 'selected' : ''}>선택</option>
          <option value="1" ${currentProgressStep === 1 ? 'selected' : ''}>프린트</option>
          <option value="2" ${currentProgressStep === 2 ? 'selected' : ''}>스캔</option>
          <option value="3" ${currentProgressStep === 3 ? 'selected' : ''}>고객등록</option>
          <option value="4" ${currentProgressStep === 4 ? 'selected' : ''}>심사중</option>
          <option value="5" ${currentProgressStep === 5 ? 'selected' : ''}>입금대기</option>
          <option value="6" ${currentProgressStep === 6 ? 'selected' : ''}>카드승인</option>
          <option value="7" ${currentProgressStep === 7 ? 'selected' : ''}>수납중</option>
          <option value="8" ${currentProgressStep === 8 ? 'selected' : ''}>확정중</option>
        </select>
      `;

      // 성명 인풋박스 (테두리선 없음, 배경 흰색, 폰트 크기 헤더와 동일 0.6875rem, 가운데 정렬)
      const nameInput = `
        <div class="d-flex align-items-center gap-1">
          <input type="text" 
                 class="form-control form-control-sm endorse-name-input"
                 value="${row.name || ''}"
                 data-num="${row.num}"
                 data-current-name="${row.name || ''}"
                 placeholder="성명"
                 style="border: none; background-color: white; font-size: 0.6875rem; text-align: center;">
          <div class="spinner-border spinner-border-sm text-primary d-none" role="status" data-role="name-loading">
            <span class="visually-hidden">로딩 중...</span>
          </div>
        </div>
      `;

      // 핸드폰 인풋박스 (하이픈 포함, 테두리선 없음, 배경 흰색, 폰트 크기 헤더와 동일 0.6875rem)
      const phoneInput = `
        <div class="d-flex align-items-center gap-1">
          <input type="text" 
                 class="form-control form-control-sm endorse-phone-input"
                 value="${row.phone || ''}"
                 data-num="${row.num}"
                 data-current-phone="${row.phone || ''}"
                 placeholder="010-0000-0000"
                 maxlength="13"
                 style="border: none; background-color: white; font-size: 0.6875rem;">
          <div class="spinner-border spinner-border-sm text-primary d-none" role="status" data-role="phone-loading">
            <span class="visually-hidden">로딩 중...</span>
          </div>
        </div>
      `;

      // 배서기준일 클릭 가능하게
      const standardDateCell = `
        <a href="#" 
           class="text-primary endorse-date-link"
           data-num="${row.num}"
           data-current-date="${row.standardDate || ''}"
           data-company-name="${row.companyName || ''}"
           data-company-num="${row.companyNum || ''}"
           data-policy-num="${row.policyNum || ''}"
           data-insurance-com="${row.insuranceCom || ''}"
           style="cursor: pointer; text-decoration: underline;">
          ${row.standardDate || ''}
        </a>
      `;

      html += `
        <tr>
          <td class="text-center" style="white-space: nowrap;">${rowNum}</td>
          <td style="white-space: nowrap;">${row.damdanja || row.manager || ''}</td>
          <td style="white-space: nowrap;">
            ${
              companyNum && companyName
                ? `<a href="#" class="text-primary" data-role="open-company-modal" data-company-num="${companyNum}" data-company-name="${companyName}">${companyName}</a>`
                : (companyName || '')
            }
          </td>
          <td style="width: 6%; white-space: nowrap; padding: 0;">${nameInput}</td>
          <td style="white-space: nowrap;">${row.jumin || ''}${row.age ? ` (${row.age}세)` : ''}</td>
          <td style="width: 6%; white-space: nowrap; padding: 0;">${phoneInput}</td>
          <td style="white-space: nowrap;">${progressSelect}</td>
          <td style="white-space: nowrap;">${row.manager || ''}</td>
          <td style="white-space: nowrap;">${standardDateCell}</td>
          <td style="white-space: nowrap;">${row.applicationDate || ''}</td>
          <td style="white-space: nowrap;">${row.policyNum || ''}</td>
          <td style="white-space: nowrap;">${certiTypeName}</td>
          <td style="white-space: nowrap;">${rateSelect}</td>
          <td style="white-space: nowrap;">${statusSelect}</td>
          <td style="white-space: nowrap;">${processSelect}</td>
          <td style="white-space: nowrap;">${insuranceComName}</td>
          <td class="text-end" style="white-space: nowrap;">${premiumFormatted}</td>
          <td class="text-end" style="white-space: nowrap;">${cPremiumFormatted}</td>
          <td style="white-space: nowrap;">${row.duplicate || ''}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    
    // 상태 select 박스 change 이벤트 리스너 추가
      const statusSelects = tableBody.querySelectorAll('select.endorse-status-select');
      statusSelects.forEach(select => {
        select.addEventListener('change', (e) => {
          const num = e.target.getAttribute('data-num');
          const value = e.target.value;
          const push = e.target.getAttribute('data-push');
          const sangtae = e.target.getAttribute('data-sangtae');
          const cancel = e.target.getAttribute('data-cancel');
          
          console.log('상태 변경:', { num, value, push, sangtae, cancel });
          // TODO: API 호출하여 상태 업데이트 (현재는 표시용)
          // updateEndorseStatus(num, value, push, sangtae, cancel);
        });
      });
    
    // 배서처리 상태 select 박스 change 이벤트 리스너 추가
    const processSelects = tableBody.querySelectorAll('select.endorse-process-select');
    processSelects.forEach(select => {
      select.addEventListener('change', async (e) => {
        const num = e.target.getAttribute('data-num');
        const newSangtae = parseInt(e.target.value);
        const currentSangtae = parseInt(e.target.getAttribute('data-current-sangtae'));
        
        // 값이 변경되지 않았으면 무시
        if (newSangtae === currentSangtae) {
          return;
        }
        
        // 로딩 상태 표시
        const originalValue = e.target.value;
        e.target.disabled = true;
        
        try {
          await updateEndorseStatus(num, newSangtae);
          // 성공 시 현재 값 업데이트
          e.target.setAttribute('data-current-sangtae', newSangtae);
          // 리스트 새로고침
          fetchList();
        } catch (error) {
          console.error('배서처리 상태 업데이트 오류:', error);
          alert('배서처리 상태 업데이트에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
          // 실패 시 원래 값으로 복원
          e.target.value = currentSangtae;
          e.target.disabled = false;
        }
      });
    });

    // 성명 인풋박스 엔터/블러 이벤트 리스너 추가
    const nameInputs = tableBody.querySelectorAll('input.endorse-name-input');
    nameInputs.forEach(input => {
      input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const num = parseInt(input.getAttribute('data-num'));
          const currentName = input.getAttribute('data-current-name') || '';
          const newName = input.value.trim();
          
          // 값이 변경되지 않았으면 무시
          if (newName === currentName) {
            return;
          }
          
          const rowEl = input.closest('tr');
          const spinner = rowEl?.querySelector('[data-role="name-loading"]');
          
          input.disabled = true;
          if (spinner) {
            spinner.classList.remove('d-none');
          }
          try {
            await updateMemberInfo(num, newName);
            input.setAttribute('data-current-name', newName);
            // 리스트 새로고침
            await fetchList();
          } catch (error) {
            console.error('성명 업데이트 오류:', error);
            alert('성명 업데이트에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
            input.value = currentName;
          } finally {
            input.disabled = false;
            if (spinner) {
              spinner.classList.add('d-none');
            }
          }
        }
      });
    });

    // 핸드폰 인풋박스 하이픈 처리 및 엔터 이벤트 리스너 추가
    const phoneInputs = tableBody.querySelectorAll('input.endorse-phone-input');
    phoneInputs.forEach(input => {
      // 클릭 시 하이픈 제거
      input.addEventListener('focus', (e) => {
        e.target.value = removePhoneHyphen(e.target.value);
      });
      
      // 입력 시 하이픈 자동 추가
      input.addEventListener('input', (e) => {
        const cursorPosition = e.target.selectionStart;
        const oldValue = e.target.value;
        const newValue = formatPhoneNumber(oldValue);
        e.target.value = newValue;
        
        // 커서 위치 조정 (하이픈이 추가되면 커서 위치 변경)
        const diff = newValue.length - oldValue.length;
        if (diff > 0) {
          e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
        } else {
          e.target.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
      
      // 포커스 아웃 시 하이픈 다시 추가
      input.addEventListener('blur', (e) => {
        e.target.value = formatPhoneNumber(e.target.value);
      });
      
      // 엔터 키 이벤트
      input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const num = parseInt(input.getAttribute('data-num'));
          const currentPhone = input.getAttribute('data-current-phone') || '';
          const trimmedValue = input.value.trim();
          const newPhone = formatPhoneNumber(trimmedValue);
          
          // 값이 변경되지 않았으면 무시
          if (newPhone === currentPhone) {
            return;
          }
          
          // 빈 값인 경우 null로 전달 (서버에서 처리)
          const phoneToUpdate = trimmedValue ? newPhone : null;
          
          const rowEl = input.closest('tr');
          const spinner = rowEl?.querySelector('[data-role="phone-loading"]');
          
          input.disabled = true;
          if (spinner) {
            spinner.classList.remove('d-none');
          }
          try {
            await updateMemberInfo(num, null, phoneToUpdate);
            input.setAttribute('data-current-phone', newPhone || '');
            // 리스트 새로고침
            await fetchList();
          } catch (error) {
            console.error('핸드폰 번호 업데이트 오류:', error);
            alert('핸드폰 번호 업데이트에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
            input.value = currentPhone;
          } finally {
            input.disabled = false;
            if (spinner) {
              spinner.classList.add('d-none');
            }
          }
        }
      });
    });

    // 진행단계 select change 이벤트 리스너 추가
    const progressSelects = tableBody.querySelectorAll('select.endorse-progress-select');
    progressSelects.forEach(select => {
      select.addEventListener('change', async (e) => {
        const num = parseInt(e.target.getAttribute('data-num'));
        const currentProgress = parseInt(e.target.getAttribute('data-current-progress')) || -1;
        const newProgress = parseInt(e.target.value) || -1;
        
        // 값이 변경되지 않았으면 무시
        if (newProgress === currentProgress) {
          return;
        }
        
        e.target.disabled = true;
        try {
          await updateMemberInfo(num, null, null, newProgress);
          e.target.setAttribute('data-current-progress', newProgress);
          // 리스트 새로고침
          fetchList();
        } catch (error) {
          console.error('진행단계 업데이트 오류:', error);
          alert('진행단계 업데이트에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
          e.target.value = currentProgress;
          e.target.disabled = false;
        }
      });
    });

    // 배서기준일 클릭 이벤트 리스너 추가
    const endorseDateLinks = tableBody.querySelectorAll('a.endorse-date-link');
    endorseDateLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const num = parseInt(link.getAttribute('data-num'));
        const currentDate = link.getAttribute('data-current-date') || '';
        const companyName = link.getAttribute('data-company-name') || '';
        const companyNum = link.getAttribute('data-company-num') || '';
        const policyNum = link.getAttribute('data-policy-num') || '';
        const insuranceCom = link.getAttribute('data-insurance-com') || '';
        openEndorseDayModal(num, currentDate, companyName, companyNum, policyNum, insuranceCom);
      });
    });

    // 요율 select change 이벤트 리스너 추가
    const rateSelects = tableBody.querySelectorAll('select.endorse-rate-select');
    rateSelects.forEach(select => {
      select.addEventListener('change', async (e) => {
        const num = e.target.getAttribute('data-num');
        const jumin = e.target.getAttribute('data-jumin');
        const policyNum = e.target.getAttribute('data-policy');
        const currentRate = e.target.getAttribute('data-current-rate');
        const newRate = e.target.value;

        if (newRate === currentRate || newRate === '-1') {
          e.target.value = currentRate || '-1';
          return;
        }

        const rowEl = e.target.closest('tr');
        const spinner = rowEl?.querySelector('[data-role="rate-loading"]');

        e.target.disabled = true;
        if (spinner) {
          spinner.classList.remove('d-none');
        }
        try {
          await updateRate(num, jumin, policyNum, newRate);
          e.target.setAttribute('data-current-rate', newRate);

          // 어떤 행의 요율이 변경되었는지 간단히 안내
          if (rowEl) {
            const name = rowEl.querySelector('td:nth-child(4)')?.textContent.trim() || '';
            const policyText = rowEl.querySelector('td:nth-child(11)')?.textContent.trim() || policyNum || '';

            alert(
              `요율이 변경되었습니다.\n` +
              (policyText ? `증권번호: ${policyText}\n` : '') +
              (name ? `성명: ${name}\n` : '') +
              `요율 코드: ${newRate}`
            );
          } else {
            alert('요율이 변경되었습니다.');
          }

          // 새로운 요율을 기준으로 월보험료/회사보험료를 다시 계산하기 위해 리스트 재조회
          await fetchList();
        } catch (error) {
          console.error('요율 업데이트 오류:', error);
          alert('요율 업데이트에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
          e.target.value = currentRate || '-1';
        } finally {
          e.target.disabled = false;
          if (spinner) {
            spinner.classList.add('d-none');
          }
        }
      });
    });
  };

  const renderMobile = (rows) => {
    if (rows.length === 0) {
      mobileCards.innerHTML = `<div class="text-center py-4">조회된 데이터가 없습니다.</div>`;
      return;
    }

    let html = '';
    rows.forEach((row) => {
      const premiumFormatted = formatAmount(row.premium);
      const cPremiumFormatted = formatAmount(row.cPremium);
      const statusText = row.push == 1 ? '청약' : (row.push == 4 ? '해지' : '');
      const statusClass = row.push == 1 ? 'badge bg-primary' : (row.push == 4 ? 'badge bg-danger' : 'badge bg-secondary');

      // 대리운전회사 정보 (공통 모달용)
      const companyNum = row.companyNum || row.company_num || row.dNum || '';
      const companyName = row.companyName || '';

      html += `
        <div class="card mb-2">
          <div class="card-body">
            <h6 class="card-title">
              ${row.name || ''}
              <span class="${statusClass} ms-2">${statusText}</span>
            </h6>
            <p class="card-text small mb-1">
              <strong>증권번호:</strong> ${row.policyNum || ''}<br>
              <strong>배서번호:</strong> ${row.endorseNum || ''}<br>
              <strong>보험사:</strong> ${row.insuranceCom || ''}<br>
              <strong>배서일자:</strong> ${row.standardDate || ''}<br>
              <strong>대리운전회사:</strong> ${
                companyNum && companyName
                  ? `<a href="#" class="text-primary" data-role="open-company-modal" data-company-num="${companyNum}" data-company-name="${companyName}">${companyName}</a>`
                  : (companyName || '')
              }<br>
              <strong>작성자:</strong> ${row.manager || ''}<br>
              <strong>보험료:</strong> ${premiumFormatted || '-'}<br>
              <strong>C보험료:</strong> ${cPremiumFormatted || '-'}
            </p>
          </div>
        </div>
      `;
    });

    mobileCards.innerHTML = html;
  };

  const renderPagination = (pageNum, totalPages, total) => {
    // 페이지 정보
    const start = total === 0 ? 0 : (pageNum - 1) * currentLimit + 1;
    const end = Math.min(pageNum * currentLimit, total);
    paginationInfo.textContent = `총 ${total.toLocaleString()}건 중 ${start.toLocaleString()}-${end.toLocaleString()}건 표시`;

    // 페이지네이션 컨트롤
    if (totalPages <= 1) {
      paginationControls.innerHTML = '';
      return;
    }

    let html = '';

    // 이전 버튼
    if (pageNum > 1) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${pageNum - 1}">이전</a>
        </li>
      `;
    }

    // 페이지 번호
    const startPage = Math.max(1, pageNum - 2);
    const endPage = Math.min(totalPages, pageNum + 2);

    if (startPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
      if (startPage > 2) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <li class="page-item ${i === pageNum ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    // 다음 버튼
    if (pageNum < totalPages) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${pageNum + 1}">다음</a>
        </li>
      `;
    }

    paginationControls.innerHTML = html;

    // 페이지네이션 이벤트 바인딩
    paginationControls.querySelectorAll('a.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(link.dataset.page);
        // 전역 변수 currentPage와 비교 (함수 파라미터 이름 충돌 방지)
        if (page && page !== currentPage && page > 0) {
          currentPage = page;
          fetchList();
        }
      });
    });
  };

  // ==================== 유틸리티 함수 ====================
  
  // 핸드폰 번호 하이픈 처리 (하이픈 추가)
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // 하이픈 제거
    const cleaned = phone.replace(/-/g, '');
    // 숫자만 남기기
    const numbers = cleaned.replace(/\D/g, '');
    // 하이픈 추가 (010-1234-5678 형식)
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return numbers.slice(0, 3) + '-' + numbers.slice(3);
    } else {
      return numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
    }
  };

  // 핸드폰 번호에서 하이픈 제거
  const removePhoneHyphen = (phone) => {
    return phone ? phone.replace(/-/g, '') : '';
  };

  // ==================== 업데이트 함수 ====================

  // 회원 정보 업데이트 (이름, 핸드폰, 진행단계)
  const updateMemberInfo = async (num, name = null, phone = null, progressStep = null) => {
    try {
      const payload = { num };
      if (name !== null && name !== '') payload.name = name;
      if (phone !== null && phone !== '') {
        // 하이픈 포함 형식으로 전송 (010-3514-3262)
        const formattedPhone = formatPhoneNumber(phone);
        if (formattedPhone && formattedPhone.trim()) {
          payload.phone = formattedPhone.trim();
        }
      }
      if (progressStep !== null) payload.progressStep = progressStep;

      // 업데이트할 필드가 없으면 에러
      if (Object.keys(payload).length === 1) { // num만 있는 경우
        throw new Error('업데이트할 필드가 없습니다.');
      }

      console.log('업데이트 요청 payload:', payload);

      const response = await fetch('/api/insurance/kj-endorse/update-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 응답 오류:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || `HTTP ${response.status} 오류` };
        }
        throw new Error(errorData.error || errorData.details?.error || '회원 정보 업데이트 실패');
      }
      
      const json = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || json.details?.error || '회원 정보 업데이트 실패');
      }
      
      return json;
    } catch (error) {
      console.error('회원 정보 업데이트 API 오류:', error);
      throw error;
    }
  };

  // 배서기준일 업데이트
  const updateEndorseDay = async (num, endorseDay, updateAll = false, policyNum = null, companyNum = null, currentEndorseDay = null) => {
    try {
      const payload = {
        num: num,
        endorseDay: endorseDay,
        updateAll: updateAll
      };
      
      if (updateAll) {
        if (policyNum) payload.policyNum = policyNum;
        if (companyNum) payload.companyNum = companyNum;
        if (currentEndorseDay) payload.currentEndorseDay = currentEndorseDay;
      }
      
      const response = await fetch('/api/insurance/kj-endorse/update-endorse-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const json = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || '배서기준일 업데이트 실패');
      }
      
      return json;
    } catch (error) {
      console.error('배서기준일 업데이트 API 오류:', error);
      throw error;
    }
  };

  // ==================== 배서처리 상태 업데이트 ====================
  
  const updateEndorseStatus = async (num, sangtae) => {
    try {
      const response = await fetch('/api/insurance/kj-endorse/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          num: num,
          sangtae: sangtae
        })
      });
      
      const json = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || '상태 업데이트 실패');
      }
      
      return json;
    } catch (error) {
      console.error('배서처리 상태 업데이트 API 오류:', error);
      throw error;
    }
  };

  // ==================== 요율 업데이트 ====================
  const updateRate = async (num, jumin, policyNum, rate) => {
    if (!jumin || !policyNum) {
      throw new Error('주민번호 또는 증권번호가 없습니다.');
    }
    const res = await fetch('/api/insurance/kj-endorse/rate-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Jumin: jumin,
        rate: rate,
        policyNum: policyNum,
        num: num,
      }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || '요율 업데이트 실패');
    }
    return json;
  };

  // ==================== 배서기준일 모달 ====================
  
  let currentEndorseDayData = null;
  const endorseDayModal = new bootstrap.Modal(document.getElementById('endorseDayModal'));
  const endorseDayInput = document.getElementById('endorseDayInput');
  const endorseDayCurrentDate = document.getElementById('endorseDayCurrentDate');
  const endorseDayHeaderInfo = document.getElementById('endorseDayHeaderInfo');
  const updateAllSamePolicy = document.getElementById('updateAllSamePolicy');
  const saveEndorseDayBtn = document.getElementById('saveEndorseDayBtn');

  // 다음날 계산 함수
  const getNextDay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 배서기준일 모달 열기
  const openEndorseDayModal = (num, currentDate, companyName, companyNum, policyNum, insuranceCom) => {
    currentEndorseDayData = {
      num: num,
      currentDate: currentDate || '',
      companyName: companyName || '',
      companyNum: companyNum || '',
      policyNum: policyNum || '',
      insuranceCom: insuranceCom || ''
    };
    
    // 헤더 정보 설정: "한솔콜센타 :2025-S286883 (현대)" 형식
    const insuranceComName = insuranceCom && window.KJConstants 
      ? window.KJConstants.getInsurerName(insuranceCom) 
      : '';
    const headerInfo = companyName && policyNum
      ? `${companyName} :${policyNum}${insuranceComName ? ` (${insuranceComName})` : ''}`
      : (companyName || policyNum || '-');
    endorseDayHeaderInfo.textContent = headerInfo;
    
    // 변경전 기준일 설정
    endorseDayCurrentDate.value = currentDate || '';
    
    // 변경후 기준일: 다음날로 기본값 설정
    const nextDay = getNextDay(currentDate);
    endorseDayInput.value = nextDay || '';
    
    // 체크박스 기본값: 체크 상태
    updateAllSamePolicy.checked = true;
    
    endorseDayModal.show();
  };

  // 배서기준일 저장 버튼 클릭
  saveEndorseDayBtn.addEventListener('click', async () => {
    if (!currentEndorseDayData || !currentEndorseDayData.num) {
      alert('오류가 발생했습니다.');
      return;
    }

    const newDate = endorseDayInput.value.trim();
    if (!newDate) {
      alert('변경후 기준일을 입력해주세요.');
      return;
    }

    const updateAll = updateAllSamePolicy.checked;

    saveEndorseDayBtn.disabled = true;
    try {
      await updateEndorseDay(
        currentEndorseDayData.num, 
        newDate, 
        updateAll, 
        currentEndorseDayData.policyNum,
        currentEndorseDayData.companyNum,
        currentEndorseDayData.currentDate
      );
      endorseDayModal.hide();
      // 리스트 새로고침
      await fetchList();
    } catch (error) {
      console.error('배서기준일 업데이트 오류:', error);
      alert('배서기준일 업데이트에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      saveEndorseDayBtn.disabled = false;
    }
  });

  // ==================== 이벤트 바인딩 ====================

  // 상태 필터 변경 시 다른 필터 초기화 및 자동 검색
  statusFilter?.addEventListener('change', () => {
    // 배서기준일 필터 초기화
    if (endorseDayFilter) endorseDayFilter.value = '';
    // 보험회사 필터 초기화
    insuranceComFilter.value = '';
    // 증권번호 필터 초기화
    policyNumFilter.value = '';
    // 대리운전회사 필터 초기화 및 전체 목록 로드
    companyFilter.value = '';
    loadCompanyList(); // 증권번호 없이 전체 목록 로드
    
    currentPage = 1;
    fetchList();
  });

  // 배서기준일 필터 변경 시 다른 필터 초기화 및 자동 검색
  endorseDayFilter?.addEventListener('change', () => {
    // 선택 필터 초기화
    statusFilter.value = '';
    // 보험회사 필터 초기화
    insuranceComFilter.value = '';
    // 증권번호 필터 초기화
    policyNumFilter.value = '';
    // 대리운전회사 필터 초기화 및 전체 목록 로드
    companyFilter.value = '';
    loadCompanyList(); // 증권번호 없이 전체 목록 로드
    
    currentPage = 1;
    fetchList();
  });

  // 보험회사 필터 변경 시 다른 필터 초기화 및 자동 검색
  insuranceComFilter?.addEventListener('change', () => {
    // 선택 필터 초기화
    statusFilter.value = '';
    // 배서기준일 필터 초기화
    if (endorseDayFilter) endorseDayFilter.value = '';
    // 증권번호 필터 초기화
    policyNumFilter.value = '';
    // 대리운전회사 필터 초기화 및 전체 목록 로드
    companyFilter.value = '';
    loadCompanyList(); // 증권번호 없이 전체 목록 로드
    
    currentPage = 1;
    fetchList();
  });

  // 증권번호 변경 시 대리운전회사 목록 업데이트 및 다른 필터 초기화
  policyNumFilter?.addEventListener('change', () => {
    // 선택 필터 초기화
    statusFilter.value = '';
    // 배서기준일 필터 초기화
    if (endorseDayFilter) endorseDayFilter.value = '';
    // 보험회사 필터 초기화
    insuranceComFilter.value = '';
    // 대리운전회사 필터 초기화 및 목록 업데이트
    companyFilter.value = '';
    const policyNum = policyNumFilter.value || null;
    loadCompanyList(policyNum);
    
    currentPage = 1;
    fetchList();
  });

  // 대리운전회사 변경 시 다른 필터 초기화 및 자동 검색
  companyFilter?.addEventListener('change', () => {
    // 선택 필터 초기화
    statusFilter.value = '';
    // 배서기준일 필터 초기화
    if (endorseDayFilter) endorseDayFilter.value = '';
    // 보험회사 필터 초기화
    insuranceComFilter.value = '';
    // 증권번호 필터 초기화
    policyNumFilter.value = '';
    
    currentPage = 1;
    fetchList();
  });

  // 페이지 크기 변경
  pageSizeSelect?.addEventListener('change', () => {
    currentPage = 1;
    currentLimit = parseInt(pageSizeSelect.value);
    fetchList();
  });

  // 초기화: 보험회사 필터, 증권번호 목록 및 대리운전회사 목록 로드 후 데이터 조회
  const initialize = async () => {
    // 보험회사 필터 옵션 초기화
    initInsuranceComFilter();
    
    await loadPolicyNumList();
    // 초기 로드 시 전체 대리운전회사 목록 로드 (증권번호 없이)
    await loadCompanyList();
    // 초기 로드 시 필터 없이 전체 데이터 조회하여 통계 표시
    fetchList();
  };
  
  initialize();
})();

