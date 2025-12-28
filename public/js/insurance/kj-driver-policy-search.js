/**
 * KJ 대리운전 - 증권번호 찾기 페이지
 * 증권번호와 시작일로 검색하여 대상 리스트 표시
 */

(function() {
  'use strict';

  const API_BASE = '/api/insurance';

  // 검색 실행
  async function searchPolicy() {
    const oldPolicyNum = document.getElementById('oldPolicyNum').value.trim();
    const oldStartyDay = document.getElementById('oldStartyDay').value;

    // 검증
    if (!oldPolicyNum) {
      alert('증권번호를 입력하세요.');
      document.getElementById('oldPolicyNum').focus();
      return;
    }

    if (!oldStartyDay) {
      alert('시작일을 선택하세요.');
      document.getElementById('oldStartyDay').focus();
      return;
    }

    // 로딩 표시
    const tbody = document.getElementById('policySearchTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> 검색 중...</td></tr>';

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
        alert(data.error || '검색 중 오류가 발생했습니다.');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">검색 중 오류가 발생했습니다.</td></tr>';
        return;
      }

      // 결과 표시
      displaySearchResults(data.data);

    } catch (error) {
      console.error('검색 오류:', error);
      alert('검색 중 오류가 발생했습니다: ' + error.message);
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">검색 중 오류가 발생했습니다.</td></tr>';
    }
  }

  // 검색 결과 표시
  function displaySearchResults(data) {
    const tbody = document.getElementById('policySearchTableBody');
    
    if (!data || !data.certiTableRows || data.certiTableRows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">검색 결과가 없습니다.</td></tr>';
      return;
    }

    const rows = data.certiTableRows;
    
    // 인원 수를 포함한 행 생성
    tbody.innerHTML = rows.map((row, index) => {
      const currentInwon = row.currentInwon || 0;
      
      return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${row.DaeriCompany || ''}</td>
          <td>${row.policyNum || ''}</td>
          <td class="text-center">${currentInwon}</td>
          <td class="text-center">${row.startyDay || ''}</td>
        </tr>
      `;
    }).join('');
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 검색 버튼
    const searchPolicyBtn = document.getElementById('searchPolicyBtn');
    if (searchPolicyBtn) {
      searchPolicyBtn.addEventListener('click', searchPolicy);
    }

    // 엔터키로 검색
    const oldPolicyNumInput = document.getElementById('oldPolicyNum');
    const oldStartyDayInput = document.getElementById('oldStartyDay');
    
    if (oldPolicyNumInput) {
      oldPolicyNumInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchPolicy();
        }
      });
    }

    if (oldStartyDayInput) {
      oldStartyDayInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchPolicy();
        }
      });
    }
  }

  // 초기화
  function init() {
    setupEventListeners();
  }

  // DOM 로드 완료 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 전역에 노출
  window.kjPolicySearchPage = {
    searchPolicy
  };

})();
