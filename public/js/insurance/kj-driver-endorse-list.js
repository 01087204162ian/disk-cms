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
  const progressFilter = document.getElementById('progressFilter');
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
    const progress = progressFilter ? progressFilter.value || '' : '';
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
    if (progress) params.append('progress', progress);
    if (insuranceCom) params.append('insuranceCom', insuranceCom);
    if (policyNum) params.append('policyNum', policyNum);
    if (companyNum) params.append('companyNum', companyNum);
    if (endorseDay) params.append('endorseDay', endorseDay);

    // 디버깅: 파라미터 로그
    console.log('API 호출 파라미터:', {
      push,
      progress,
      insuranceCom,
      policyNum,
      companyNum,
      url: `/api/insurance/kj-endorse/list?${params.toString()}`
    });

    try {
      const res = await fetch(`/api/insurance/kj-endorse/list?${params.toString()}`);
      
      // 응답이 JSON인지 확인
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error(`서버 오류 (HTTP ${res.status}): ${text.substring(0, 200)}`);
      }
      
      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json.error || `서버 오류 (HTTP ${res.status})`;
        console.error('API 오류:', errorMsg, json);
        throw new Error(errorMsg);
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
      
      // 상태 select 생성 (push 값에 따라 배서 상태 표시)
      // 청약 상태 (push=1): "청약", "취소", "거절" 옵션
      // 해지 상태 (push=4): "해지", "취소" 옵션
      let statusSelect = '';
      
      if (push === 1) {
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
      } else if (push === 4) {
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
        <tr data-num="${row.num}">
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
          <td class="manager-cell" style="white-space: nowrap;">${row.manager || ''}</td>
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
        
        // 같은 행의 배서 상태 select에서 선택된 값 가져오기
        const row = e.target.closest('tr[data-num]');
        const statusSelect = row?.querySelector('select.endorse-status-select');
        const endorseProcess = statusSelect?.value || '청약'; // 기본값: 청약
        
        // 청약 처리 시 할인할증(rate) 확인
        if (newSangtae === 2 && endorseProcess === '청약') {
          // 같은 행의 rate select에서 현재 값 가져오기
          const rateSelect = row?.querySelector('select.endorse-rate-select');
          const currentRate = rateSelect?.value || rateSelect?.getAttribute('data-current-rate') || '';
          
          // rate가 선택되지 않았거나 '-1' (선택)이면 에러
          if (!currentRate || currentRate === '' || currentRate === '-1' || currentRate === '0') {
            alert('청약 처리 시 할인할증(요율)이 입력되어야 합니다. 먼저 할인할증을 선택해주세요.');
            e.target.value = currentSangtae;
            e.target.disabled = false;
            return;
          }
        }
        
        // 로딩 상태 표시
        const originalValue = e.target.value;
        e.target.disabled = true;
        
        try {
          // 처리자 이름 가져오기
          const manager = getLoginUserName();
          if (!manager && newSangtae === 2) {
            alert('처리자 정보를 찾을 수 없습니다. 로그인 상태를 확인해주세요.');
            e.target.value = currentSangtae;
            e.target.disabled = false;
            return;
          }
          
          await updateEndorseStatus(num, newSangtae, endorseProcess, manager);
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
          // 진행단계 업데이트 시 manager(처리자)도 함께 업데이트
          const result = await updateMemberInfo(num, null, null, newProgress);
          e.target.setAttribute('data-current-progress', newProgress);
          
          // 해당 행의 manager 셀만 업데이트 (페이지 새로고침 없이)
          const row = e.target.closest('tr[data-num]');
          if (row) {
            const managerCell = row.querySelector('td.manager-cell');
            if (managerCell) {
              const userName = getLoginUserName();
              if (userName) {
                managerCell.textContent = userName;
              }
            }
          }
          
          e.target.disabled = false;
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

  // 로그인 사용자 이름 가져오기 (공통 함수)
  const getLoginUserName = () => {
    // sj-template-loader 사용 시
    if (window.sjTemplateLoader && window.sjTemplateLoader.user && window.sjTemplateLoader.user.name) {
      return window.sjTemplateLoader.user.name;
    }
    // 세션 스토리지 확인
    const sessionName = sessionStorage.getItem('userName');
    if (sessionName) return sessionName;
    // 로컬 스토리지 확인
    const localName = localStorage.getItem('userName');
    if (localName) return localName;
    // 기본값
    return '';
  };

  // 회원 정보 업데이트 (이름, 핸드폰, 진행단계, manager)
  const updateMemberInfo = async (num, name = null, phone = null, progressStep = null, manager = null) => {
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
      if (progressStep !== null) {
        payload.progressStep = progressStep;
        // 진행단계 업데이트 시 manager도 함께 업데이트 (전달되지 않은 경우 로그인 사용자 이름 사용)
        if (manager === null) {
          manager = getLoginUserName();
        }
        if (manager) {
          payload.manager = manager;
        }
      }

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
  
  const updateEndorseStatus = async (num, sangtae, endorseProcess = '청약', manager = null, reasion = null) => {
    try {
      // 처리 시(sangtae=2) manager 필수
      if (sangtae === 2 && !manager) {
        manager = getLoginUserName();
        if (!manager) {
          throw new Error('처리자(manager) 정보가 필요합니다.');
        }
      }
      
      const payload = {
        num: num,
        sangtae: sangtae,
        endorseProcess: endorseProcess
      };
      
      if (manager) {
        payload.manager = manager;
      }
      
      if (reasion) {
        payload.reasion = reasion;
      }
      
      console.log('배서처리 상태 업데이트 요청:', payload);
      
      const response = await fetch('/api/insurance/kj-endorse/update-status', {
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
        throw new Error(errorData.error || errorData.details?.error || '배서처리 상태 업데이트 실패');
      }
      
      const json = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || '배서처리 상태 업데이트 실패');
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

  // 진행단계 필터 변경 시 독립적으로 작동 (다른 필터 초기화 안 함)
  if (progressFilter) {
    progressFilter.addEventListener('change', () => {
      console.log('진행단계 필터 변경:', progressFilter.value);
      currentPage = 1;
      fetchList();
    });
  } else {
    console.error('progressFilter 요소를 찾을 수 없습니다.');
  }

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

// ==================== 배서현황, 일일배서리스트, 문자리스트 모달 관련 ====================

// 모달 버튼 이벤트 핸들러
document.addEventListener('DOMContentLoaded', function() {
  // 배서현황 버튼
  const btnEndorseStatus = document.getElementById('btnEndorseStatus');
  if (btnEndorseStatus) {
    btnEndorseStatus.addEventListener('click', function() {
      const modal = new bootstrap.Modal(document.getElementById('endorseStatusModal'));
      modal.show();
      // 오늘 날짜를 기본값으로 설정
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const dateInput = document.getElementById('endorseStatus_date');
      if (dateInput && !dateInput.value) {
        dateInput.value = todayStr;
      }
    });
  }

  // 일일배서리스트 버튼
  const btnDailyEndorseList = document.getElementById('btnDailyEndorseList');
  if (btnDailyEndorseList) {
    btnDailyEndorseList.addEventListener('click', function() {
      const modal = new bootstrap.Modal(document.getElementById('dailyEndorseListModal'));
      modal.show();
      // 오늘 날짜를 기본값으로 설정
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const dateInput = document.getElementById('dailyDate');
      if (dateInput) {
        dateInput.value = todayStr;
        // 모달 열 때 당일 데이터 자동 조회
        dailyEndorseRequest(1, todayStr, '', '', 1);
      }
    });
  }

  // 문자리스트 버튼
  const btnSmsList = document.getElementById('btnSmsList');
  if (btnSmsList) {
    btnSmsList.addEventListener('click', function() {
      const modal = new bootstrap.Modal(document.getElementById('smsListModal'));
      modal.show();
    });
  }
});

// 배서현황 조회 버튼 이벤트
document.addEventListener('DOMContentLoaded', function() {
  const btnEndorseStatusCheck = document.getElementById('btnEndorseStatusCheck');
  if (btnEndorseStatusCheck) {
    btnEndorseStatusCheck.addEventListener('click', function() {
      dailyCheck();
    });
  }

  // 일일배서리스트 날짜 필터 변경 시 자동 조회
  const dailyDateInput = document.getElementById('dailyDate');
  if (dailyDateInput) {
    dailyDateInput.addEventListener('change', function() {
      const selectedDate = this.value;
      if (selectedDate) {
        const dNum = document.getElementById('daily_endorse_dNumList')?.value || '';
        const policyNum = document.getElementById('daily_endorse_certiList')?.value || '';
        
        let sort = 1;
        if (dNum && policyNum) sort = 3;
        else if (dNum) sort = 2;
        
        dailyEndorseRequest(1, selectedDate, dNum, policyNum, sort);
      }
    });
  }

  // 일일배서리스트 검토 버튼
  const btnDailyEndorseCheck = document.getElementById('btnDailyEndorseCheck');
  if (btnDailyEndorseCheck) {
    btnDailyEndorseCheck.addEventListener('click', function() {
      dailyCheckForDailyList();
    });
  }
});

// 일일배서리스트 조회 함수
async function dailyEndorseRequest(page = 1, selectedDate = null, dNum = '', policyNum = '', sort = 1) {
  console.log('dailyEndorseRequest 호출:', { page, selectedDate, dNum, policyNum, sort });
  
  const m_dailyEndoseElement = document.getElementById("m_dailyEndose");
  if (!m_dailyEndoseElement) {
    console.error("m_dailyEndose 요소를 찾을 수 없습니다.");
    return;
  }
  
  m_dailyEndoseElement.innerHTML = `
    <tr>
      <td colspan='15' style="text-align: center; padding: 20px;">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">로딩 중...</span>
        </div>
        <p class="mt-2">데이터를 불러오는 중입니다...</p>
      </td>
    </tr>
  `;
  
  try {
    const today = new Date();
    
    // 날짜 처리
    let selectedDay;
    let todayIs;
    
    if (selectedDate) {
      selectedDay = selectedDate;
    } else {
      const dailyDateElement = document.getElementById("dailyDate");
      if (dailyDateElement && dailyDateElement.value) {
        selectedDay = dailyDateElement.value;
      } else {
        selectedDay = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      }
    }
    
    // 오늘 날짜
    todayIs = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    // 오늘이 아닌 배서리스트 조회하는 경우 대리운전회사별, 일자별 증권번호 조회
    if (selectedDay !== todayIs && sort == 1) {
      todayEndorsedNumloadSearchTable(selectedDay);  // 대리운전회사별 
      todayEndorseloadSearchTable(selectedDay, '', '', 1);  // 일자별 증권번호
    }
    
    // API 요청 파라미터 설정 (JSON으로 전송)
    const requestData = {
      todayStr: selectedDay,
      page: page,
      sort: sort,
      dNum: dNum || '',
      policyNum: policyNum || ''
    };
    
    // API 요청 전송 (Node.js 프록시를 통해)
    const response = await fetch(`/api/insurance/kj-daily-endorse/search`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }
    
    const result = await response.json();
    
    let m_smsList = '';
    
    if (result.success && result.data && result.data.length > 0) {
      console.log('데이터:', result);
      
      // 페이지네이션 설정
      const itemsPerPage = 15;
      const totalItems = result.data.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const currentPage = Math.max(1, Math.min(page, totalPages));
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
      const currentPageItems = result.data.slice(startIndex, endIndex);
      
      // 통계 계산 (실제 리스트 데이터 기반)
      const pushCounts = {
        subscription: 0,
        subscriptionCancel: 0,
        subscriptionReject: 0,
        termination: 0,
        terminationCancel: 0,
        total: result.data.length
      };
      
      result.data.forEach(item => {
        const push = String(item.push);
        if (push === '1') {
          // 청약 상태인 경우 cancel 값 확인
          const cancel = String(item.cancel || '');
          if (cancel === '12') {
            pushCounts.subscriptionCancel++;
          } else if (cancel === '13') {
            pushCounts.subscriptionReject++;
          } else {
            pushCounts.subscription++;
          }
        } else if (push === '2') {
          pushCounts.termination++;
        } else if (push === '4') {
          const cancel = String(item.cancel || '');
          if (cancel === '45') {
            pushCounts.terminationCancel++;
          } else {
            pushCounts.subscription++;
          }
        }
      });
      
      // 통계 정보 업데이트
      const currentSituation = document.getElementById('daily_currentSituation');
      if (currentSituation) {
        let situationHTML = '';
        if (pushCounts.subscription) situationHTML += `청약:${pushCounts.subscription} `;
        if (pushCounts.subscriptionCancel) situationHTML += `청약취소:${pushCounts.subscriptionCancel} `;
        if (pushCounts.subscriptionReject) situationHTML += `청약거절:${pushCounts.subscriptionReject} `;
        if (pushCounts.termination) situationHTML += `해지:${pushCounts.termination} `;
        if (pushCounts.terminationCancel) situationHTML += `해지취소:${pushCounts.terminationCancel} `;
        if (pushCounts.total) situationHTML += `계:${pushCounts.total}`;
        currentSituation.innerHTML = situationHTML;
      }
      
      // 현재 페이지 데이터 행 추가
      currentPageItems.forEach((item, index) => {
        const lastTime = item.LastTime || '';
        let formattedDate = '';
        
        if (lastTime.length === 14) {
          formattedDate = `${lastTime.substring(0, 4)}-${lastTime.substring(4, 6)}-${lastTime.substring(6, 8)} ${lastTime.substring(8, 10)}:${lastTime.substring(10, 12)}:${lastTime.substring(12, 14)}`;
        } else {
          formattedDate = lastTime;
        }
        
        const formattedPreminum = item.preminum ? parseFloat(item.preminum).toLocaleString("en-US") : "0";
        const formattedC_preminum = item.c_preminum ? parseFloat(item.c_preminum).toLocaleString("en-US") : "0";
        
        const iType = {"1": "대리", "2": "탁송", "3": "대리렌트", "4": "탁송렌트"};
        const certiType = iType[item.etag] || "알 수 없음";
        
        // 공통 모듈 사용하여 보험회사 이름 가져오기
        const insuranceComCode = parseInt(item.insuranceCom) || 0;
        const InsuranceCompany = window.KJConstants 
          ? window.KJConstants.getInsurerName(insuranceComCode) 
          : (item.insuranceCom || '알 수 없음');
        
        const pushType = {"1": "청약", "2": "해지", "3": "청약거절", "4": "정상", "5": "해지취소", "6": "청약취소"};
        
        let statusStyle = '';
        if (item.push === '2') {
          statusStyle = 'color: red; font-weight: bold;';
        } else if (item.push === '4') {
          statusStyle = 'color: green; font-weight: bold;';
        }
        
        const pushName = pushType[item.push] || '';
        
        m_smsList += `
          <tr>
            <td>${startIndex + index + 1}</td>
            <td>${item.name || ''}</td>
            <td>${item.Jumin || ''}</td>
            <td>${item.hphone || ''}</td>
            <td style="${statusStyle}">${pushName}</td>
            <td>${item.policyNum || ''}</td>
            <td>${certiType}</td>
            <td>${InsuranceCompany}</td>
            <td>${item.company || ''}</td>
            <td>${item.Rphone1 || ''}-${item.Rphone2 || ''}-${item.Rphone3 || ''}</td>
            <td>
              <a href="#" class="rate-detail-link text-primary" 
                 data-rate="${item.rate || '1'}" 
                 style="cursor: pointer; text-decoration: underline;">
                ${item.rate || '1'}
              </a>
            </td>
            <td class="kje-preiminum" style="padding: 0;"><input type='text' id='mothly-${item.SeqNo}' value="${formattedPreminum}" class='premium-input'   
              onkeypress="if(event.key === 'Enter') { mothlyPremiumUpdate(this, ${item.SeqNo}); return false; }" autocomplete="off"></td>
            <td class="kje-preiminum" style="padding: 0;"><input type='text' id='mothlyC-${item.SeqNo}' value="${formattedC_preminum}" class='premium-input'   
              onkeypress="if(event.key === 'Enter') { mothlyC_PremiumUpdate(this, ${item.SeqNo}); return false; }" autocomplete="off"></td>
            <td>${item.manager || ''}</td>
            <td>${formattedDate}</td>
          </tr>
        `;
      });
      
      m_dailyEndoseElement.innerHTML = m_smsList;
      
      // 요율 상세 설명 모달 이벤트 리스너 추가
      const rateDetailLinks = m_dailyEndoseElement.querySelectorAll('a.rate-detail-link');
      rateDetailLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const rateCode = link.getAttribute('data-rate');
          openRateDetailModal(rateCode);
        });
      });
      
      // 페이징 UI 생성 및 추가
      createEPagination(totalPages, currentPage, selectedDay);
    } else {
      m_smsList = `
        <tr>
          <td colspan='15' style="text-align: center; padding: 20px;">
            조회 결과가 없습니다.
          </td>
        </tr>
      `;
      
      const existingPagination = document.getElementById("sms-pagination");
      if (existingPagination) {
        existingPagination.remove();
      }
      
      m_dailyEndoseElement.innerHTML = m_smsList;
    }
  } catch (error) {
    console.error("데이터 로딩 실패:", error);
    
    m_dailyEndoseElement.innerHTML = `
      <tr>
        <td colspan='15'>
          <div style="text-align: center; padding: 20px; color: #d9534f;">
            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
            <p>데이터 로딩 실패: ${error.message}</p>
          </div>
        </td>
      </tr>
    `;
    
    const existingPagination = document.getElementById("sms-pagination");
    if (existingPagination) {
      existingPagination.remove();
    }
    
    if (error.name === 'AbortError') {
      alert('요청 시간이 초과되었습니다. 나중에 다시 시도해주세요.');
    } else {
      alert(`데이터 로딩 실패: ${error.message}`);
    }
  }
}

// 페이지네이션 UI 생성 함수
function createEPagination(totalPages, currentPage, selectedDay) {
  const existingPagination = document.getElementById("sms-pagination");
  if (existingPagination) {
    existingPagination.remove();
  }
  
  const paginationContainer = document.createElement("div");
  paginationContainer.id = "sms-pagination";
  paginationContainer.className = "pagination justify-content-center pagination-spacing";
  paginationContainer.style.marginTop = "3.33rem";
  paginationContainer.style.marginBottom = "1rem";
  
  // 처음 페이지 버튼
  const firstPageBtn = document.createElement("button");
  firstPageBtn.className = "btn btn-sm btn-outline-secondary";
  firstPageBtn.innerHTML = "&laquo;";
  firstPageBtn.disabled = currentPage === 1;
  firstPageBtn.onclick = () => {
    const dNum = document.getElementById('daily_endorse_dNumList')?.value || '';
    const policyNum = document.getElementById('daily_endorse_certiList')?.value || '';
    let sort = 1;
    if (dNum && policyNum) sort = 3;
    else if (dNum) sort = 2;
    dailyEndorseRequest(1, selectedDay, dNum, policyNum, sort);
  };
  paginationContainer.appendChild(firstPageBtn);
  
  // 이전 페이지 버튼
  const prevPageBtn = document.createElement("button");
  prevPageBtn.className = "btn btn-sm btn-outline-secondary";
  prevPageBtn.innerHTML = "&lsaquo;";
  prevPageBtn.disabled = currentPage === 1;
  prevPageBtn.onclick = () => {
    const dNum = document.getElementById('daily_endorse_dNumList')?.value || '';
    const policyNum = document.getElementById('daily_endorse_certiList')?.value || '';
    let sort = 1;
    if (dNum && policyNum) sort = 3;
    else if (dNum) sort = 2;
    dailyEndorseRequest(currentPage - 1, selectedDay, dNum, policyNum, sort);
  };
  paginationContainer.appendChild(prevPageBtn);
  
  // 페이지 번호 버튼
  const maxPageButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  
  if (endPage - startPage + 1 < maxPageButtons && startPage > 1) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-secondary'}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      const dNum = document.getElementById('daily_endorse_dNumList')?.value || '';
      const policyNum = document.getElementById('daily_endorse_certiList')?.value || '';
      let sort = 1;
      if (dNum && policyNum) sort = 3;
      else if (dNum) sort = 2;
      dailyEndorseRequest(i, selectedDay, dNum, policyNum, sort);
    };
    paginationContainer.appendChild(pageBtn);
  }
  
  // 다음 페이지 버튼
  const nextPageBtn = document.createElement("button");
  nextPageBtn.className = "btn btn-sm btn-outline-secondary";
  nextPageBtn.innerHTML = "&rsaquo;";
  nextPageBtn.disabled = currentPage === totalPages;
  nextPageBtn.onclick = () => {
    const dNum = document.getElementById('daily_endorse_dNumList')?.value || '';
    const policyNum = document.getElementById('daily_endorse_certiList')?.value || '';
    let sort = 1;
    if (dNum && policyNum) sort = 3;
    else if (dNum) sort = 2;
    dailyEndorseRequest(currentPage + 1, selectedDay, dNum, policyNum, sort);
  };
  paginationContainer.appendChild(nextPageBtn);
  
  // 마지막 페이지 버튼
  const lastPageBtn = document.createElement("button");
  lastPageBtn.className = "btn btn-sm btn-outline-secondary";
  lastPageBtn.innerHTML = "&raquo;";
  lastPageBtn.disabled = currentPage === totalPages;
  lastPageBtn.onclick = () => {
    const dNum = document.getElementById('daily_endorse_dNumList')?.value || '';
    const policyNum = document.getElementById('daily_endorse_certiList')?.value || '';
    let sort = 1;
    if (dNum && policyNum) sort = 3;
    else if (dNum) sort = 2;
    dailyEndorseRequest(totalPages, selectedDay, dNum, policyNum, sort);
  };
  paginationContainer.appendChild(lastPageBtn);
  
  // 페이지네이션을 모달 내부의 적절한 위치에 추가
  const modalBody = document.querySelector('#dailyEndorseListModal .modal-body');
  if (modalBody) {
    modalBody.appendChild(paginationContainer);
  }
}

// 일자별 배서 대리운전회사 찾기
function todayEndorsedNumloadSearchTable(endorseDay) {
  fetch(`/api/insurance/kj-daily-endorse/company-list?endorseDay=${endorseDay}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      todayPopulatedNumList(data);
    })
    .catch((error) => {
      console.error("Error details:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
    });
}

// 일자별 배서 증권 찾기
function todayEndorseloadSearchTable(endorseDay, dNum, policyNum, sort) {
  const currentSituation = document.getElementById('daily_currentSituation');
  if (currentSituation) {
    currentSituation.innerHTML = '';
  }
  
  fetch(`/api/insurance/kj-daily-endorse/certi-list?endorseDay=${endorseDay}&dNum=${dNum || ''}&policyNum=${policyNum || ''}&sort=${sort}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      todayPopulateCertiList(data);
    })
    .catch((error) => {
      console.error("Error details:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
    });
}

// 대리운전회사 목록 채우기
function todayPopulatedNumList(data) {
  const selectElement = document.getElementById('daily_endorse_dNumList');
  if (!selectElement) {
    console.error("Element with ID 'daily_endorse_dNumList' not found");
    return;
  }
  
  selectElement.innerHTML = '';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- 대리운전회사 선택 --';
  selectElement.appendChild(defaultOption);
  
  if (data.data && data.data.length > 0) {
    data.data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.dNum;
      option.textContent = item.company;
      selectElement.appendChild(option);
    });
    
    // change 이벤트 리스너 추가
    selectElement.onchange = function() {
      const selectedValue = this.value;
      const todayStr = document.getElementById('dailyDate')?.value || '';
      
      // 검토 버튼 활성화/비활성화
      const btnCheck = document.getElementById('btnDailyEndorseCheck');
      if (btnCheck) {
        btnCheck.disabled = !selectedValue;
      }
      
      if (selectedValue === '') {
        dailyEndorseRequest(1, todayStr, '', '', 1);
      } else {
        dailyEndorseRequest(1, todayStr, selectedValue, '', 2);
        todayEndorseloadSearchTable(todayStr, selectedValue, '', 2);
      }
    };
  }
}

// 증권 목록 채우기
function todayPopulateCertiList(data) {
  const selectElement = document.getElementById('daily_endorse_certiList');
  if (!selectElement) {
    console.error("Element with ID 'daily_endorse_certiList' not found");
    return;
  }
  
  selectElement.innerHTML = '';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- 증권 선택 --';
  selectElement.appendChild(defaultOption);
  
  const defaultOption2 = document.createElement('option');
  defaultOption2.value = '1';
  defaultOption2.textContent = '-- 모든 증권 --';
  selectElement.appendChild(defaultOption2);
  
  if (data.data && data.data.length > 0) {
    data.data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.policyNum;
      // 공통 모듈 사용하여 보험회사 이름 가져오기
      const insuranceComCode = parseInt(item.insuranceCom) || 0;
      const InsuranceCompany = window.KJConstants 
        ? window.KJConstants.getInsurerName(insuranceComCode) 
        : (item.insuranceCom || '알 수 없음');
      option.textContent = `${InsuranceCompany}[${item.policyNum}]`;
      selectElement.appendChild(option);
    });
  }
  
  // 통계 업데이트는 dailyEndorseRequest 함수에서 실제 리스트 데이터를 기반으로 계산하므로
  // 여기서는 업데이트하지 않음 (certi-list API의 pushCounts는 전체 증권 기준이므로 불일치 발생)
  
  // change 이벤트 리스너 추가
  selectElement.onchange = function() {
    const selectedValue = this.value;
    const todayStr = document.getElementById('dailyDate')?.value || '';
    const dNum = document.getElementById('daily_endorse_dNumList')?.value || '';
    
    if (selectedValue === '') {
      dailyEndorseRequest(1, todayStr, dNum, '', 2);
    } else if (selectedValue === '1') {
      dailyEndorseRequest(1, todayStr, dNum, selectedValue, 3);
    } else {
      dailyEndorseRequest(1, todayStr, dNum, selectedValue, 3);
    }
  };
}

// 일일배서리스트용 배서현황 조회 함수
async function dailyCheckForDailyList() {
  const dailyDate = document.getElementById('dailyDate')?.value;
  const dNumElement = document.getElementById('daily_endorse_dNumList');
  const dNum = dNumElement?.value;
  
  if (!dNum) {
    alert('대리운전회사 선택부터 하세요!!');
    if (dNumElement) dNumElement.focus();
    return;
  }
  
  if (!dailyDate) {
    alert('날짜를 선택해주세요.');
    return;
  }
  
  // 배서현황 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('endorseStatusModal'));
  modal.show();
  
  // 배서현황 모달의 날짜와 대리운전회사 설정
  const endorseStatusDate = document.getElementById('endorseStatus_date');
  const endorseStatusCompany = document.getElementById('endorseStatus_companySelect');
  if (endorseStatusDate) endorseStatusDate.value = dailyDate;
  if (endorseStatusCompany) {
    // 대리운전회사 목록에 없으면 추가
    if (!endorseStatusCompany.querySelector(`option[value="${dNum}"]`)) {
      const option = document.createElement('option');
      option.value = dNum;
      option.textContent = dNumElement.options[dNumElement.selectedIndex]?.textContent || dNum;
      endorseStatusCompany.appendChild(option);
    }
    endorseStatusCompany.value = dNum;
  }
  
  // 배서현황 조회 실행
  await dailyCheck();
}

// 배서현황 조회 함수
async function dailyCheck() {
  const dailyDate = document.getElementById('endorseStatus_date')?.value || document.getElementById('dailyDate')?.value;
  const dNumElement = document.getElementById('endorseStatus_companySelect') || document.getElementById('daily_endorse_dNumList');
  const dNum = dNumElement?.value;
  
  if (!dNum) {
    alert('대리운전회사 선택부터 하세요!!');
    if (dNumElement) dNumElement.focus();
    return;
  }
  
  if (!dailyDate) {
    alert('날짜를 선택해주세요.');
    return;
  }
  
  const m_endorseCheck = document.getElementById('m_endorseCheck');
  if (m_endorseCheck) {
    m_endorseCheck.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p class="mt-2">데이터를 불러오는 중...</p></div>';
  }
  
  // URLSearchParams로 FormData 형식 전송
  const params = new URLSearchParams();
  params.append('todayStr', dailyDate);
  params.append('dNum', dNum);
  
  try {
    const response = await fetch(`/api/insurance/kj-daily-endorse/status`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('배서현황 result', result);
    
    processEndorseData(result, dailyDate);
    
  } catch (error) {
    console.error('데이터 조회 오류:', error);
    alert('데이터 조회 중 오류가 발생했습니다: ' + error.message);
    if (m_endorseCheck) {
      m_endorseCheck.innerHTML = '<div class="alert alert-danger">데이터 조회 중 오류가 발생했습니다.</div>';
    }
  }
}

// 배서현황 데이터 처리 및 보고서 생성 함수
function processEndorseData(result, dateStr) {
  console.log("받은 데이터:", result);
  
  const reportElement = document.getElementById("m_endorseCheck");
  if (!reportElement) {
    console.error("m_endorseCheck 요소를 찾을 수 없습니다.");
    return;
  }
  
  if (!result.success || !result.data || result.data.length === 0) {
    reportElement.innerHTML = "조회된 데이터가 없습니다.";
    return;
  }
  
  // 회사명 표시
  if (result.data[0] && result.data[0].company) {
    const companyElement = document.getElementById("endorseCheck_daeriCompany");
    if (companyElement) {
      companyElement.innerHTML = result.data[0].company;
    }
  }
  
  // 데이터 분류
  const daeriRegistrations = [];
  const daeriTerminations = [];
  const taksongRegistrations = [];
  const taksongTerminations = [];
  
  let daeriRegPremium = 0;
  let daeriTermPremium = 0;
  let taksongRegPremium = 0;
  let taksongTermPremium = 0;
  let haldungCount = 0;
  
  result.data.forEach(item => {
    const premium = parseInt(item.c_preminum || item.preminum || 0);
    const etagStr = String(item.etag);
    const isDaeri = (etagStr === "1" || etagStr === "3");
    const isTaksong = !isDaeri;
    const pushStr = String(item.push);
    const isRegistration = (pushStr === "4");
    const isTermination = (pushStr === "2");
    
    if (isDaeri && isRegistration) {
      daeriRegistrations.push(item);
      daeriRegPremium += premium;
    } else if (isDaeri && isTermination) {
      daeriTerminations.push(item);
      daeriTermPremium -= premium;
    } else if (isTaksong && isRegistration) {
      taksongRegistrations.push(item);
      taksongRegPremium += premium;
    } else if (isTaksong && isTermination) {
      taksongTerminations.push(item);
      taksongTermPremium -= premium;
    }
    
    if (isRegistration && item.rate && parseInt(item.rate) > 1) {
      haldungCount++;
    }
  });
  
  function formatCurrency(number) {
    return new Intl.NumberFormat('ko-KR').format(Math.abs(number));
  }
  
  const reportDate = new Date(dateStr || result.todayStr);
  const formattedDate = `${reportDate.getFullYear()}.${String(reportDate.getMonth() + 1).padStart(2, '0')}.${String(reportDate.getDate()).padStart(2, '0')}`;
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][reportDate.getDay()];
  
  const daeriTotal = daeriRegPremium + daeriTermPremium;
  const taksongTotal = taksongRegPremium + taksongTermPremium;
  const overallTotal = daeriTotal + taksongTotal;
  
  let reportHTML = `<div class="report-container">
    <h3>${formattedDate} (${dayOfWeek}) 배서현황</h3>
    <div class="report-section">
      <h4>*대리 가입자</h4>
      <ul>`;
  
  daeriRegistrations.forEach(item => {
    reportHTML += `<li>${item.name}</li>`;
  });
  
  reportHTML += `</ul>
      <p>총 ${daeriRegistrations.length}명</p>
    </div>
    
    <div class="report-section">
      <h4>*대리 해지자</h4>
      <ul>`;
  
  daeriTerminations.forEach(item => {
    reportHTML += `<li>${item.name}</li>`;
  });
  
  reportHTML += `</ul>
      <p>총 ${daeriTerminations.length}명</p>
    </div>
    
    <div class="report-section">
      <h4>*탁송 가입자</h4>
      <ul>`;
  
  taksongRegistrations.forEach(item => {
    reportHTML += `<li>${item.name}</li>`;
  });
  
  reportHTML += `</ul>
      <p>총 ${taksongRegistrations.length}명</p>
    </div>
    
    <div class="report-section">
      <h4>*탁송 해지자</h4>
      <ul>`;
  
  taksongTerminations.forEach(item => {
    reportHTML += `<li>${item.name}</li>`;
  });
  
  reportHTML += `</ul>
      <p>총 ${taksongTerminations.length}명</p>
    </div>
    
    <div class="report-section">
      <h4>영수보험료 (+추징/-환급)</h4>
      <p>대리: ${formatCurrency(daeriTotal)}원 ${daeriTotal >= 0 ? '추징' : '환급'}</p>
      <p>탁송: ${formatCurrency(taksongTotal)}원 ${taksongTotal >= 0 ? '추징' : '환급'}</p>
      <p>합계: ${formatCurrency(overallTotal)}원 ${overallTotal >= 0 ? '추징' : '환급'}</p>
    </div>
    
    <div class="report-section">
      <p>금일 가입자 중 할증자는 ${haldungCount} 명입니다.</p>
      <p>보험료 파일은 정리하여 메일로 발송하겠습니다.</p>
    </div>
  </div>`;
  
  reportElement.innerHTML = reportHTML;
}

// 보험료 업데이트 함수 (임시 구현)
function mothlyPremiumUpdate(inputElement, smsDataNum) {
  console.log('보험료 업데이트:', inputElement.value, smsDataNum);
  // TODO: API 호출 구현
  alert('보험료 업데이트 기능은 구현 중입니다.');
}

function mothlyC_PremiumUpdate(inputElement, smsDataNum) {
  console.log('C보험료 업데이트:', inputElement.value, smsDataNum);
  // TODO: API 호출 구현
  alert('C보험료 업데이트 기능은 구현 중입니다.');
}

// 요율 상세 설명 모달 열기
function openRateDetailModal(rateCode) {
  const rateCodeNum = parseInt(rateCode) || 1;
  
  // 공통 모듈에서 요율 정보 가져오기
  const rateValue = window.KJConstants 
    ? window.KJConstants.getRateValue(rateCodeNum)
    : 1.000;
  const rateName = window.KJConstants
    ? window.KJConstants.getRateName(rateCodeNum)
    : '기본';
  
  const modalBody = document.getElementById('rateDetailModalBody');
  if (!modalBody) return;
  
  // 모달 내용 생성
  let content = `
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <h5 class="card-title mb-4">
          <span class="badge bg-primary me-2">요율 코드: ${rateCodeNum}</span>
          <span class="badge bg-info">요율: ${rateValue.toFixed(3)}</span>
        </h5>
        <div class="alert alert-light border-start border-primary border-4" role="alert">
          <h6 class="alert-heading mb-2">
            <i class="fas fa-info-circle me-2 text-primary"></i>요율 설명
          </h6>
          <p class="mb-0" style="font-size: 1rem; line-height: 1.6;">
            ${rateName}
          </p>
        </div>
        
        <div class="mt-4">
          <h6 class="mb-3">할인할증 요율 전체 목록</h6>
          <div class="table-responsive">
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th style="width: 80px;">코드</th>
                  <th style="width: 100px;">요율</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
  `;
  
  // 모든 요율 목록 추가
  if (window.KJConstants && window.KJConstants.RATE_OPTIONS) {
    window.KJConstants.RATE_OPTIONS.forEach(opt => {
      if (opt.value !== '-1') {
        const code = parseInt(opt.value);
        const value = window.KJConstants.getRateValue(code);
        const name = window.KJConstants.getRateName(code);
        const isSelected = code === rateCodeNum;
        
        content += `
          <tr ${isSelected ? 'class="table-primary"' : ''}>
            <td class="text-center">${code}</td>
            <td class="text-center"><strong>${value.toFixed(3)}</strong></td>
            <td>${name}</td>
          </tr>
        `;
      }
    });
  }
  
  content += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  
  modalBody.innerHTML = content;
  
  // 모달 표시
  const modal = new bootstrap.Modal(document.getElementById('rateDetailModal'));
  modal.show();
}

