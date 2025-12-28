/**
 * KJ 대리운전 - 증권번호 찾기 페이지
 * 증권번호 변경 기능 포함
 */

(function() {
  'use strict';

  const API_BASE = '/api/insurance';
  let searchResultData = null;

  // 모달 초기화
  function initModal() {
    const modal = document.getElementById('policyChangeModal');
    if (!modal) return;

    // 보험회사 옵션 생성
    const insuranceCompanySelect = document.getElementById('newInsuranceCompany');
    if (insuranceCompanySelect && window.KJConstants) {
      insuranceCompanySelect.innerHTML = window.KJConstants.generateInsurerOptions();
    }

    // 모달이 닫힐 때 초기화
    modal.addEventListener('hidden.bs.modal', function() {
      resetModal();
    });
  }

  // 모달 초기화
  function resetModal() {
    document.getElementById('oldPolicyNum').value = '';
    document.getElementById('oldStartyDay').value = '';
    document.getElementById('newPolicyNum').value = '';
    document.getElementById('newStartyDay').value = '';
    document.getElementById('newInsuranceCompany').value = '';
    document.getElementById('searchResultArea').style.display = 'none';
    document.getElementById('detailListArea').style.display = 'none';
    document.getElementById('executeChangeBtn').style.display = 'none';
    searchResultData = null;
  }

  // 증권번호 변경 모달 열기
  function openPolicyChangeModal() {
    const modal = new bootstrap.Modal(document.getElementById('policyChangeModal'));
    modal.show();
  }

  // 검색 실행
  async function searchPolicyForChange() {
    const oldPolicyNum = document.getElementById('oldPolicyNum').value.trim();
    const oldStartyDay = document.getElementById('oldStartyDay').value;

    // 검증
    if (!oldPolicyNum) {
      alert('기존 증권번호를 입력하세요.');
      return;
    }

    if (!oldStartyDay) {
      alert('기존 시작일을 선택하세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/kj-certi/change-policy-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oldPolicyNum: oldPolicyNum,
          oldStartyDay: oldStartyDay
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        alert(data.message || '검색 중 오류가 발생했습니다.');
        return;
      }

      // 검색 결과 저장
      searchResultData = data.data;

      // 결과 표시
      displaySearchResult(data.data);

    } catch (error) {
      console.error('검색 오류:', error);
      alert('검색 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // 검색 결과 표시
  function displaySearchResult(data) {
    const certiTableCount = data.certiTableRows ? data.certiTableRows.length : 0;
    const memberCount = data.memberCount || 0;

    document.getElementById('certiTableCount').textContent = certiTableCount;
    document.getElementById('memberCount').textContent = memberCount;
    document.getElementById('searchResultArea').style.display = 'block';

    if (certiTableCount > 0) {
      document.getElementById('executeChangeBtn').style.display = 'block';
    } else {
      document.getElementById('executeChangeBtn').style.display = 'none';
      alert('검색된 증권이 없습니다.');
    }
  }

  // 상세 목록 표시/숨김
  function toggleDetailList() {
    const detailArea = document.getElementById('detailListArea');
    const isVisible = detailArea.style.display === 'block';
    
    if (!isVisible && searchResultData && searchResultData.certiTableRows) {
      renderDetailList(searchResultData.certiTableRows);
    }
    
    detailArea.style.display = isVisible ? 'none' : 'block';
  }

  // 상세 목록 렌더링
  function renderDetailList(rows) {
    const tbody = document.getElementById('detailListBody');
    if (!tbody) return;

    tbody.innerHTML = rows.map((row, index) => {
      const insurerName = window.KJConstants?.getInsurerName(row.InsuraneCompany) || row.InsuraneCompany || '';
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${row.policyNum || ''}</td>
          <td>${row.startyDay || ''}</td>
          <td>${insurerName}</td>
          <td>${row.DaeriCompany || ''}</td>
        </tr>
      `;
    }).join('');
  }

  // 변경 실행
  async function executePolicyChange() {
    const oldPolicyNum = document.getElementById('oldPolicyNum').value.trim();
    const oldStartyDay = document.getElementById('oldStartyDay').value;
    const newPolicyNum = document.getElementById('newPolicyNum').value.trim();
    const newStartyDay = document.getElementById('newStartyDay').value;
    const newInsuranceCompany = document.getElementById('newInsuranceCompany').value;

    // 검증
    if (!oldPolicyNum || !oldStartyDay) {
      alert('기존 정보를 모두 입력하세요.');
      return;
    }

    if (!newPolicyNum || !newStartyDay || !newInsuranceCompany) {
      alert('변경 정보를 모두 입력하세요.');
      return;
    }

    if (!searchResultData || !searchResultData.certiTableRows || searchResultData.certiTableRows.length === 0) {
      alert('검색 결과가 없습니다. 먼저 검색을 실행하세요.');
      return;
    }

    // 확인 다이얼로그
    const confirmMessage = `다음과 같이 변경하시겠습니까?\n\n` +
      `기존: ${oldPolicyNum} (${oldStartyDay})\n` +
      `변경: ${newPolicyNum} (${newStartyDay})\n` +
      `보험회사: ${window.KJConstants?.getInsurerName(newInsuranceCompany) || newInsuranceCompany}\n\n` +
      `변경될 증권: ${searchResultData.certiTableRows.length}건\n` +
      `변경될 회원: ${searchResultData.memberCount || 0}건`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/kj-certi/change-policy-execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oldPolicyNum: oldPolicyNum,
          oldStartyDay: oldStartyDay,
          newPolicyNum: newPolicyNum,
          newStartyDay: newStartyDay,
          newInsuranceCompany: newInsuranceCompany,
          cNums: searchResultData.certiTableRows.map(row => row.num)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        alert(data.message || '변경 중 오류가 발생했습니다.');
        return;
      }

      alert(`증권번호 변경이 완료되었습니다.\n\n` +
        `변경된 증권: ${data.data.updatedCertiTableRows}건\n` +
        `변경된 회원: ${data.data.updatedMemberRows}건`);

      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('policyChangeModal'));
      if (modal) {
        modal.hide();
      }

    } catch (error) {
      console.error('변경 실행 오류:', error);
      alert('변경 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 증권번호 변경 버튼
    const policyChangeBtn = document.getElementById('policyChangeBtn');
    if (policyChangeBtn) {
      policyChangeBtn.addEventListener('click', openPolicyChangeModal);
    }

    // 검색 버튼
    const searchPolicyBtn = document.getElementById('searchPolicyBtn');
    if (searchPolicyBtn) {
      searchPolicyBtn.addEventListener('click', searchPolicyForChange);
    }

    // 상세 목록 보기 버튼
    const showDetailBtn = document.getElementById('showDetailBtn');
    if (showDetailBtn) {
      showDetailBtn.addEventListener('click', toggleDetailList);
    }

    // 변경 실행 버튼
    const executeChangeBtn = document.getElementById('executeChangeBtn');
    if (executeChangeBtn) {
      executeChangeBtn.addEventListener('click', executePolicyChange);
    }

    // 엔터키로 검색
    const oldPolicyNumInput = document.getElementById('oldPolicyNum');
    const oldStartyDayInput = document.getElementById('oldStartyDay');
    
    if (oldPolicyNumInput) {
      oldPolicyNumInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchPolicyForChange();
        }
      });
    }

    if (oldStartyDayInput) {
      oldStartyDayInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchPolicyForChange();
        }
      });
    }
  }

  // 초기화
  function init() {
    initModal();
    setupEventListeners();
  }

  // DOM 로드 완료 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 전역에 노출 (필요한 경우)
  window.kjPolicySearchPage = {
    openPolicyChangeModal,
    searchPolicyForChange,
    executePolicyChange
  };

})();

