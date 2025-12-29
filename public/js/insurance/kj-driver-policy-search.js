/**
 * KJ 대리운전 - 증권번호 찾기 페이지
 * 증권번호와 시작일로 검색하여 대상 리스트 표시
 */

(function() {
  'use strict';

  const API_BASE = '/api/insurance';
  let currentSearchData = null; // 현재 검색 결과 데이터 저장
  let certiList = []; // 증권번호 목록 저장

  // 검색 실행
  async function searchPolicy() {
    const oldPolicyNumSelect = document.getElementById('oldPolicyNum');
    const oldPolicyNumInput = document.getElementById('oldPolicyNumInput');
    const oldStartyDay = document.getElementById('oldStartyDay').value;
    
    // 증권번호 가져오기 (select 또는 input에서)
    let oldPolicyNum = '';
    if (oldPolicyNumSelect && oldPolicyNumSelect.value === '__DIRECT_INPUT__') {
      // 직접 입력 모드
      oldPolicyNum = oldPolicyNumInput ? oldPolicyNumInput.value.trim() : '';
    } else {
      // select에서 선택
      oldPolicyNum = oldPolicyNumSelect ? oldPolicyNumSelect.value.trim() : '';
    }

    // 검증
    if (!oldPolicyNum) {
      alert('증권번호를 선택하거나 입력하세요.');
      if (oldPolicyNumSelect && oldPolicyNumSelect.value === '__DIRECT_INPUT__' && oldPolicyNumInput) {
        oldPolicyNumInput.focus();
      } else if (oldPolicyNumSelect) {
        oldPolicyNumSelect.focus();
      }
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

      // 검색 결과 저장
      currentSearchData = data.data;
      
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

  // 변경 모달 열기
  function openChangeModal() {
    if (!currentSearchData || !currentSearchData.certiTableRows || currentSearchData.certiTableRows.length === 0) {
      alert('먼저 검색을 실행하세요.');
      return;
    }

    // 변경 전 정보 설정 (검색한 값)
    const oldPolicyNumSelect = document.getElementById('oldPolicyNum');
    const oldPolicyNumInput = document.getElementById('oldPolicyNumInput');
    
    let oldPolicyNum = '';
    if (oldPolicyNumSelect && oldPolicyNumSelect.value === '__DIRECT_INPUT__') {
      oldPolicyNum = oldPolicyNumInput ? oldPolicyNumInput.value.trim() : '';
    } else {
      oldPolicyNum = oldPolicyNumSelect ? oldPolicyNumSelect.value.trim() : '';
    }
    
    const oldStartyDay = document.getElementById('oldStartyDay').value;

    document.getElementById('modalOldPolicyNum').value = oldPolicyNum;
    document.getElementById('modalOldStartyDay').value = oldStartyDay;

    // 보험회사 옵션 생성
    const insuranceCompanySelect = document.getElementById('modalNewInsuranceCompany');
    if (insuranceCompanySelect && window.KJConstants) {
      insuranceCompanySelect.innerHTML = window.KJConstants.generateInsurerOptions();
    }

    // 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('policyChangeModal'));
    modal.show();
  }

  // 변경 실행
  async function executePolicyChange() {
    const oldPolicyNumSelect = document.getElementById('oldPolicyNum');
    const oldPolicyNumInput = document.getElementById('oldPolicyNumInput');
    
    let oldPolicyNum = '';
    if (oldPolicyNumSelect && oldPolicyNumSelect.value === '__DIRECT_INPUT__') {
      oldPolicyNum = oldPolicyNumInput ? oldPolicyNumInput.value.trim() : '';
    } else {
      oldPolicyNum = oldPolicyNumSelect ? oldPolicyNumSelect.value.trim() : '';
    }
    
    const oldStartyDay = document.getElementById('oldStartyDay').value;
    const newPolicyNum = document.getElementById('modalNewPolicyNum').value.trim();
    const newStartyDay = document.getElementById('modalNewStartyDay').value;
    const newInsuranceCompany = document.getElementById('modalNewInsuranceCompany').value;

    // 검증
    if (!oldPolicyNum || !oldStartyDay) {
      alert('변경 전 정보가 없습니다. 먼저 검색을 실행하세요.');
      return;
    }

    if (!newPolicyNum || !newStartyDay || !newInsuranceCompany) {
      alert('변경 후 정보를 모두 입력하세요.');
      return;
    }

    if (!currentSearchData || !currentSearchData.certiTableRows || currentSearchData.certiTableRows.length === 0) {
      alert('변경할 증권이 없습니다.');
      return;
    }

    // 확인 다이얼로그
    const confirmMessage = `다음과 같이 변경하시겠습니까?\n\n` +
      `변경 전: ${oldPolicyNum} (${oldStartyDay})\n` +
      `변경 후: ${newPolicyNum} (${newStartyDay})\n` +
      `보험회사: ${window.KJConstants?.getInsurerName(newInsuranceCompany) || newInsuranceCompany}\n\n` +
      `변경될 증권: ${currentSearchData.certiTableRows.length}건\n` +
      `변경될 회원: ${currentSearchData.filteredMemberCount || 0}건`;

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
          cNums: currentSearchData.certiTableRows.map(row => row.num)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        alert(data.error || '변경 중 오류가 발생했습니다.');
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

      // 검색 결과 다시 조회
      await searchPolicy();

    } catch (error) {
      console.error('변경 실행 오류:', error);
      alert('변경 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // 엑셀 다운로드 (SheetJS 사용)
  async function downloadExcel() {
    if (!currentSearchData || !currentSearchData.certiTableRows || currentSearchData.certiTableRows.length === 0) {
      alert('다운로드할 데이터가 없습니다. 먼저 검색을 실행하세요.');
      return;
    }

    const oldPolicyNumSelect = document.getElementById('oldPolicyNum');
    const oldPolicyNumInput = document.getElementById('oldPolicyNumInput');
    
    let oldPolicyNum = '';
    if (oldPolicyNumSelect && oldPolicyNumSelect.value === '__DIRECT_INPUT__') {
      oldPolicyNum = oldPolicyNumInput ? oldPolicyNumInput.value.trim() : '';
    } else {
      oldPolicyNum = oldPolicyNumSelect ? oldPolicyNumSelect.value.trim() : '';
    }
    
    const oldStartyDay = document.getElementById('oldStartyDay').value;

    if (!oldPolicyNum || !oldStartyDay) {
      alert('검색 정보가 없습니다.');
      return;
    }

    // SheetJS 로드 확인
    if (typeof XLSX === 'undefined') {
      alert('엑셀 라이브러리가 로드되지 않았습니다.\n페이지를 새로고침 해주세요.');
      return;
    }

    // 다운로드 버튼 비활성화
    const excelDownloadBtn = document.getElementById('excelDownloadBtn');
    const originalHtml = excelDownloadBtn.innerHTML;
    excelDownloadBtn.disabled = true;
    excelDownloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 다운로드 중...';

    try {
      // 회원 데이터 조회 API 호출
      const response = await fetch(`${API_BASE}/kj-certi/change-policy-excel`, {
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
        throw new Error(data.error || '데이터 조회 실패');
      }

      // SheetJS로 엑셀 생성 및 다운로드
      generateMemberExcel(data.data);

    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 버튼 복원
      excelDownloadBtn.disabled = false;
      excelDownloadBtn.innerHTML = originalHtml;
    }
  }

  // SheetJS로 엑셀 파일 생성
  function generateMemberExcel(data) {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    // 제목 영역
    wsData.push([`증권번호: ${data.oldPolicyNum || ''} - 회원리스트`]);
    wsData.push([`시작일: ${data.oldStartyDay || ''}`]);
    wsData.push([`다운로드 일시: ${new Date().toLocaleString('ko-KR')}`]);
    wsData.push([]);

    // 헤더
    wsData.push([
      '번호',
      '대리운전회사',
      '성명',
      '나이',
      '주민번호',
      '전화번호',
      '증권번호'
    ]);

    // 데이터 행
    let index = 1;
    data.members.forEach((member) => {
      wsData.push([
        index++,
        member.DaeriCompany || '',
        member.Name || '',
        member.nai || '',
        member.Jumin || '',
        member.Hphone || '',
        member.dongbuCerti || ''
      ]);
    });

    // 시트 생성
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 6 },   // 번호
      { wch: 20 },  // 대리운전회사
      { wch: 10 },  // 성명
      { wch: 6 },   // 나이
      { wch: 15 },  // 주민번호
      { wch: 15 },  // 전화번호
      { wch: 20 }   // 증권번호
    ];

    // 제목 행 병합 및 스타일
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // 제목 행
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // 시작일 행
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }  // 다운로드 일시 행
    ];

    // 헤더 스타일 (헤더는 4번째 행, 인덱스 3)
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = 0; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'E6E6E6' } }
      };
    }

    // 워크북에 시트 추가
    XLSX.utils.book_append_sheet(wb, ws, '회원리스트');

    // 파일명 생성
    const fileName = `증권번호_${data.oldPolicyNum}_${data.oldStartyDay.replace(/-/g, '')}_회원리스트.xlsx`;

    // 엑셀 파일 다운로드
    XLSX.writeFile(wb, fileName);
  }

  // 증권번호 목록 로드
  async function loadCertiList() {
    try {
      const response = await fetch(`${API_BASE}/kj-certi/list`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('증권번호 목록 조회 실패:', data.error);
        return;
      }
      
      certiList = data.data || [];
      const select = document.getElementById('oldPolicyNum');
      
      if (!select) return;
      
      // 기존 옵션 제거 (첫 번째 "=선택=" 옵션 제외)
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // 증권번호 목록 추가
      certiList.forEach(item => {
        const option = document.createElement('option');
        option.value = item.certi || '';
        option.textContent = item.certi || '';
        option.dataset.sigi = item.sigi || ''; // sigi 값을 data 속성에 저장
        select.appendChild(option);
      });
      
      // "직접 입력" 옵션 추가
      const directInputOption = document.createElement('option');
      directInputOption.value = '__DIRECT_INPUT__';
      directInputOption.textContent = '직접 입력';
      select.appendChild(directInputOption);
      
    } catch (error) {
      console.error('증권번호 목록 로드 오류:', error);
    }
  }

  // 증권번호 선택 시 시작일 자동 설정 및 직접 입력 필드 표시/숨김
  function onCertiSelectChange() {
    const select = document.getElementById('oldPolicyNum');
    const input = document.getElementById('oldPolicyNumInput');
    const startyDayInput = document.getElementById('oldStartyDay');
    
    if (!select || !startyDayInput) return;
    
    const selectedValue = select.value;
    
    // "직접 입력" 선택 시
    if (selectedValue === '__DIRECT_INPUT__') {
      // input 필드 표시 및 활성화
      if (input) {
        input.style.display = 'block';
        input.value = '';
        input.focus();
      }
      // 시작일 초기화
      startyDayInput.value = '';
    } else {
      // input 필드 숨김
      if (input) {
        input.style.display = 'none';
        input.value = '';
      }
      
      // 선택한 증권번호의 sigi 값으로 시작일 설정
      const selectedOption = select.options[select.selectedIndex];
      const sigi = selectedOption.dataset.sigi || '';
      
      if (sigi) {
        startyDayInput.value = sigi;
      } else {
        startyDayInput.value = '';
      }
    }
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 증권번호 select 변경 이벤트
    const oldPolicyNumSelect = document.getElementById('oldPolicyNum');
    if (oldPolicyNumSelect) {
      oldPolicyNumSelect.addEventListener('change', onCertiSelectChange);
    }
    
    // 검색 버튼
    const searchPolicyBtn = document.getElementById('searchPolicyBtn');
    if (searchPolicyBtn) {
      searchPolicyBtn.addEventListener('click', searchPolicy);
    }

    // 변경 버튼
    const changePolicyBtn = document.getElementById('changePolicyBtn');
    if (changePolicyBtn) {
      changePolicyBtn.addEventListener('click', openChangeModal);
    }

    // 엑셀 다운로드 버튼
    const excelDownloadBtn = document.getElementById('excelDownloadBtn');
    if (excelDownloadBtn) {
      excelDownloadBtn.addEventListener('click', downloadExcel);
    }

    // 변경 실행 버튼
    const executeChangeBtn = document.getElementById('executeChangeBtn');
    if (executeChangeBtn) {
      executeChangeBtn.addEventListener('click', executePolicyChange);
    }

    // 시작일 엔터키로 검색
    const oldStartyDayInput = document.getElementById('oldStartyDay');
    
    if (oldStartyDayInput) {
      oldStartyDayInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchPolicy();
        }
      });
    }
    
    // 직접 입력 필드 엔터키로 검색
    const oldPolicyNumInput = document.getElementById('oldPolicyNumInput');
    if (oldPolicyNumInput) {
      oldPolicyNumInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchPolicy();
        }
      });
    }
  }

  // 초기화
  async function init() {
    setupEventListeners();
    // 증권번호 목록 로드
    await loadCertiList();
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
