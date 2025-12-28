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
    const statisticsArea = document.getElementById('statisticsArea');
    const tbody = document.getElementById('policySearchTableBody');
    statisticsArea.style.display = 'none';
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
        statisticsArea.style.display = 'none';
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">검색 중 오류가 발생했습니다.</td></tr>';
        return;
      }

      // 현황 표시 후 결과 표시
      displayStatistics(data.data);
      displaySearchResults(data.data);

    } catch (error) {
      console.error('검색 오류:', error);
      alert('검색 중 오류가 발생했습니다: ' + error.message);
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">검색 중 오류가 발생했습니다.</td></tr>';
    }
  }

  // 현황 표시
  function displayStatistics(data) {
    const statisticsArea = document.getElementById('statisticsArea');
    
    if (!data) {
      statisticsArea.style.display = 'none';
      return;
    }

    // 현황 데이터 설정
    document.getElementById('statTotalRows').textContent = data.totalRows || 0;
    document.getElementById('statFilteredRows').textContent = data.filteredRows || 0;
    document.getElementById('statTotalMember').textContent = (data.memberCount || 0).toLocaleString();
    document.getElementById('statFilteredMember').textContent = (data.filteredMemberCount || 0).toLocaleString();
    
    // 현황 영역 표시
    statisticsArea.style.display = 'block';
  }

  // 검색 결과 표시 (인원 1명 이상인 항목만)
  function displaySearchResults(data) {
    const tbody = document.getElementById('policySearchTableBody');
    
    if (!data || !data.certiTableRows || data.certiTableRows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">인원 1명 이상인 증권이 없습니다.</td></tr>';
      return;
    }

    const rows = data.certiTableRows; // 이미 필터링된 데이터 (인원 1명 이상)
    
    // 인원 수를 포함한 행 생성
    tbody.innerHTML = rows.map((row, index) => {
      const currentInwon = row.currentInwon || 0;
      
      return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${row.DaeriCompany || ''}</td>
          <td>${row.policyNum || ''}</td>
          <td class="text-center">${currentInwon.toLocaleString()}</td>
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
