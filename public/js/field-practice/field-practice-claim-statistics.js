/**
 * 현장실습보험 클레임 통계 JavaScript
 * 파일명: field-practice-statistics.js
 */

// 전역 변수
let currentView = 'monthly'; // 'monthly', 'yearly', 'contractor'
let statsModal = null;

/**
 * 통계 모달 열기 (메인 진입점)
 */
function showStatistics() {
  console.log('📊 통계 모달 열기');
  
  // Bootstrap 모달 인스턴스 생성
  const modalElement = document.getElementById('performanceModal');
  if (!modalElement) {
    console.error('performanceModal을 찾을 수 없습니다!');
    return;
  }
  
  statsModal = new bootstrap.Modal(modalElement);
  statsModal.show();
  
  // 기본 뷰: 월별 실적
  loadMonthlyPerformance();
}

/**
 * 월별 실적 로드
 */
function loadMonthlyPerformance() {
  console.log('📊 월별 실적 로드');
  currentView = 'monthly';
  
  // 제목 업데이트
  document.getElementById('performanceModalLabel').innerHTML = 
    '<i class="fas fa-chart-line"></i> 월별 클레임 통계';
  
  // 연도 선택 드롭다운 생성
  createYearSelector();
  
  // 월 선택 영역 숨김
  document.getElementById('monthSelect_').innerHTML = '';
  
  // 푸터 버튼 생성
  createFooterButtons(['contractor', 'yearly']);
  
  // 데이터 가져오기
  fetchMonthlyData();
}

/**
 * 연도별 실적 로드
 */
function loadYearlyPerformance() {
  console.log('📊 연도별 실적 로드');
  currentView = 'yearly';
  
  // 제목 업데이트
  document.getElementById('performanceModalLabel').innerHTML = 
    '<i class="fas fa-chart-bar"></i> 연도별 클레임 통계';
  
  // 연도 선택 드롭다운 생성
  createYearSelector();
  
  // 월 선택 영역 숨김
  document.getElementById('monthSelect_').innerHTML = '';
  
  // 푸터 버튼 생성
  createFooterButtons(['contractor', 'monthly']);
  
  // 데이터 가져오기
  fetchYearlyData();
}

/**
 * 계약자별 실적 로드
 */
function loadContractorPerformance() {
  console.log('📊 계약자별 실적 로드');
  currentView = 'contractor';
  
  // 제목 업데이트
  document.getElementById('performanceModalLabel').innerHTML = 
    '<i class="fas fa-building"></i> 계약자별 클레임 통계';
  
  // 연도 선택 드롭다운 생성
  createYearSelector();
  
  // 월 선택 영역 숨김
  document.getElementById('monthSelect_').innerHTML = '';
  
  // 푸터 버튼 생성
  createFooterButtons(['yearly', 'monthly']);
  
  // 데이터 가져오기
  fetchContractorData();
}

/**
 * 연도 선택 드롭다운 생성
 */
function createYearSelector() {
  const container = document.getElementById('yearSelect_');
  container.innerHTML = '';
  
  const currentYear = new Date().getFullYear();
  
  const select = document.createElement('select');
  select.id = 'statsYearSelect';
  select.className = 'form-select';
  select.onchange = function() {
    // 현재 뷰에 따라 데이터 다시 로드
    if (currentView === 'monthly') {
      fetchMonthlyData();
    } else if (currentView === 'yearly') {
      fetchYearlyData();
    } else if (currentView === 'contractor') {
      fetchContractorData();
    }
  };
  
  // 최근 5년 옵션 추가
  for (let i = currentYear; i >= currentYear - 4; i--) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i + '년';
    select.appendChild(option);
  }
  
  container.appendChild(select);
}

/**
 * 푸터 버튼 생성
 */
function createFooterButtons(buttonTypes) {
  const container = document.getElementById('changeP');
  container.innerHTML = '';
  
  const buttonConfigs = {
    'monthly': {
      text: '월별 실적',
      icon: 'fa-calendar',
      class: 'btn-outline-primary',
      handler: loadMonthlyPerformance
    },
    'yearly': {
      text: '연도별 실적',
      icon: 'fa-chart-bar',
      class: 'btn-outline-success',
      handler: loadYearlyPerformance
    },
    'contractor': {
      text: '계약자별 실적',
      icon: 'fa-building',
      class: 'btn-outline-info',
      handler: loadContractorPerformance
    }
  };
  
  buttonTypes.forEach(type => {
    const config = buttonConfigs[type];
    const button = document.createElement('button');
    button.className = `btn ${config.class} btn-sm me-2`;
    button.innerHTML = `<i class="fas ${config.icon}"></i> ${config.text}`;
    button.onclick = config.handler;
    container.appendChild(button);
  });
}

/**
 * 월별 데이터 가져오기
 */
async function fetchMonthlyData() {
  const selectedYear = document.getElementById('statsYearSelect').value;
  
  try {
    showStatsLoading();
    
    const response = await fetch(`/api/field-practice/claims/statistics/monthly?year=${selectedYear}`);
    
    if (!response.ok) {
      throw new Error('데이터 조회 실패');
    }
    
    const result = await response.json();
    
    if (result.success) {
      updateMonthlyTable(result.data);
    } else {
      throw new Error(result.error || '데이터 조회 실패');
    }
    
  } catch (error) {
    console.error('월별 데이터 조회 오류:', error);
    showStatsError('월별 데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 연도별 데이터 가져오기
 */
async function fetchYearlyData() {
  const selectedYear = document.getElementById('statsYearSelect').value;
  
  try {
    showStatsLoading();
    
    const response = await fetch(`/api/field-practice/claims/statistics/yearly?year=${selectedYear}`);
    
    if (!response.ok) {
      throw new Error('데이터 조회 실패');
    }
    
    const result = await response.json();
    
    if (result.success) {
      updateYearlyTable(result.data);
    } else {
      throw new Error(result.error || '데이터 조회 실패');
    }
    
  } catch (error) {
    console.error('연도별 데이터 조회 오류:', error);
    showStatsError('연도별 데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 계약자별 데이터 가져오기
 */
async function fetchContractorData() {
  const selectedYear = document.getElementById('statsYearSelect').value;
  
  try {
    showStatsLoading();
    
    const response = await fetch(`/api/field-practice/claims/statistics/contractor?year=${selectedYear}`);
    
    if (!response.ok) {
      throw new Error('데이터 조회 실패');
    }
    
    const result = await response.json();
    
    if (result.success) {
      updateContractorTable(result.data);
    } else {
      throw new Error(result.error || '데이터 조회 실패');
    }
    
  } catch (error) {
    console.error('계약자별 데이터 조회 오류:', error);
    showStatsError('계약자별 데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 월별 테이블 업데이트 (스타일 수정 버전)
 */
function updateMonthlyTable(jsonData) {
  const selectedYear = document.getElementById('statsYearSelect').value;
  let claimData = {};
  
  // 12개월 기본 구조 생성
  for (let i = 1; i <= 12; i++) {
    const month = `${selectedYear}-${String(i).padStart(2, '0')}`;
    claimData[month] = {
      received: 0, pending: 0, completed: 0, exempted: 0, canceled: 0,
      total: 0, claimAmount: 0, totalPremium: 0, lossRatio: 0
    };
  }
  
  // claims 데이터 처리
  if (jsonData.claims) {
    jsonData.claims.forEach(item => {
      const month = item.yearMonth;
      if (!claimData[month]) return;
      
      switch (parseInt(item.ch)) {
        case 1: claimData[month].received += parseInt(item.count); break;
        case 2: claimData[month].pending += parseInt(item.count); break;
        case 3:
          claimData[month].completed += parseInt(item.count);
          claimData[month].claimAmount += parseInt(item.total_claim_amount || 0);
          break;
        case 4: claimData[month].exempted += parseInt(item.count); break;
        case 5: claimData[month].canceled += parseInt(item.count); break;
      }
      claimData[month].total += parseInt(item.count);
    });
  }
  
  // premiums 데이터 처리
  if (jsonData.premiums) {
    jsonData.premiums.forEach(item => {
      const month = item.yearMonth;
      if (!claimData[month]) return;
      claimData[month].totalPremium += parseInt(item.total_premium || 0);
    });
  }
  
  // 손해율 계산
  Object.keys(claimData).forEach(month => {
    const row = claimData[month];
    row.lossRatio = row.totalPremium > 0
      ? ((row.claimAmount / row.totalPremium) * 100).toFixed(2)
      : 0;
  });
  
  // 테이블 렌더링
  const tbody = document.querySelector('#performanceTable tbody');
  tbody.innerHTML = '';
  
  let totalReceived = 0, totalPending = 0, totalCompleted = 0, totalExempted = 0,
      totalCanceled = 0, totalAll = 0, totalClaimAmount = 0, totalPremiumAmount = 0;
  
  // 헤더 (회색 배경, 가운데 정렬)
  tbody.innerHTML += `
    <thead>
      <tr class="table-secondary">
        <th class="text-center">년월</th>
        <th class="text-center">접수</th>
        <th class="text-center">미결</th>
        <th class="text-center">종결</th>
        <th class="text-center">면책</th>
        <th class="text-center">취소</th>
        <th class="text-center">계</th>
        <th class="text-center">종결 보험금 합계</th>
        <th class="text-center">보험료 합계</th>
        <th class="text-center">손해율</th>
      </tr>
    </thead>
  `;
  
  // 데이터 행 (th는 가운데 정렬, td는 오른쪽 정렬)
  Object.keys(claimData).forEach(month => {
    const row = claimData[month];
    
    tbody.innerHTML += `
      <tr>
        <th class="text-center">${month}</th>
        <td class="text-end">${row.received > 0 ? row.received : ''}</td>
        <td class="text-end">${row.pending > 0 ? row.pending : ''}</td>
        <td class="text-end">${row.completed > 0 ? row.completed : ''}</td>
        <td class="text-end">${row.exempted > 0 ? row.exempted : ''}</td>
        <td class="text-end">${row.canceled > 0 ? row.canceled : ''}</td>
        <td class="text-end">${row.total > 0 ? row.total : ''}</td>
        <td class="text-end">${row.claimAmount > 0 ? row.claimAmount.toLocaleString() : ''}</td>
        <td class="text-end">${row.totalPremium > 0 ? row.totalPremium.toLocaleString() : ''}</td>
        <td class="text-end">${row.lossRatio > 0 ? row.lossRatio + '%' : ''}</td>
      </tr>
    `;
    
    totalReceived += row.received;
    totalPending += row.pending;
    totalCompleted += row.completed;
    totalExempted += row.exempted;
    totalCanceled += row.canceled;
    totalAll += row.total;
    totalClaimAmount += row.claimAmount;
    totalPremiumAmount += row.totalPremium;
  });
  
  // 소계 (회색 배경, th는 가운데, td는 오른쪽 정렬)
  const totalLossRatio = totalPremiumAmount > 0
    ? ((totalClaimAmount / totalPremiumAmount) * 100).toFixed(2)
    : 0;
  
  tbody.innerHTML += `
    <tfoot>
      <tr class="table-secondary fw-bold">
        <th class="text-center">소계</th>
        <td class="text-end">${totalReceived > 0 ? totalReceived : ''}</td>
        <td class="text-end">${totalPending > 0 ? totalPending : ''}</td>
        <td class="text-end">${totalCompleted > 0 ? totalCompleted : ''}</td>
        <td class="text-end">${totalExempted > 0 ? totalExempted : ''}</td>
        <td class="text-end">${totalCanceled > 0 ? totalCanceled : ''}</td>
        <td class="text-end">${totalAll > 0 ? totalAll : ''}</td>
        <td class="text-end">${totalClaimAmount > 0 ? totalClaimAmount.toLocaleString() : ''}</td>
        <td class="text-end">${totalPremiumAmount > 0 ? totalPremiumAmount.toLocaleString() : ''}</td>
        <td class="text-end">${totalLossRatio > 0 ? totalLossRatio + '%' : ''}</td>
      </tr>
    </tfoot>
  `;
}
/**
 * 연도별 테이블 업데이트 (스타일 수정 버전)
 */
function updateYearlyTable(jsonData) {
  const selectedYear = parseInt(document.getElementById('statsYearSelect').value);
  const startYear = selectedYear - 9;
  let yearData = {};
  
  // 최근 10년 기본 구조 생성
  for (let i = startYear; i <= selectedYear; i++) {
    yearData[i] = {
      received: 0, pending: 0, completed: 0, exempted: 0, canceled: 0,
      claimAmount: 0, totalPremium: 0, lossRatio: 0
    };
  }
  
  // claims 데이터 처리
  if (jsonData.claims) {
    jsonData.claims.forEach(item => {
      const year = item.claimYear;
      if (!yearData[year]) return;
      
      switch (parseInt(item.ch)) {
        case 1: yearData[year].received += parseInt(item.count); break;
        case 2: yearData[year].pending += parseInt(item.count); break;
        case 3:
          yearData[year].completed += parseInt(item.count);
          yearData[year].claimAmount += parseInt(item.total_claim_amount || 0);
          break;
        case 4: yearData[year].exempted += parseInt(item.count); break;
        case 5: yearData[year].canceled += parseInt(item.count); break;
      }
    });
  }
  
  // premiums 데이터 처리
  if (jsonData.premiums) {
    jsonData.premiums.forEach(item => {
      const year = item.premiumYear;
      if (!yearData[year]) return;
      yearData[year].totalPremium += parseInt(item.total_premium || 0);
    });
  }
  
  // 손해율 계산
  Object.keys(yearData).forEach(year => {
    const row = yearData[year];
    row.lossRatio = row.totalPremium > 0
      ? ((row.claimAmount / row.totalPremium) * 100).toFixed(2)
      : 0;
  });
  
  // 테이블 렌더링
  const tbody = document.querySelector('#performanceTable tbody');
  tbody.innerHTML = '';
  
  let totalReceived = 0, totalPending = 0, totalCompleted = 0, totalExempted = 0,
      totalCanceled = 0, totalAll = 0, totalClaimAmount = 0, totalPremiumAmount = 0;
  
  // 헤더 (회색 배경, 가운데 정렬)
  tbody.innerHTML += `
    <thead>
      <tr class="table-secondary">
        <th class="text-center">연도</th>
        <th class="text-center">접수</th>
        <th class="text-center">미결</th>
        <th class="text-center">종결</th>
        <th class="text-center">면책</th>
        <th class="text-center">취소</th>
        <th class="text-center">계</th>
        <th class="text-center">종결 보험금 합계</th>
        <th class="text-center">보험료 합계</th>
        <th class="text-center">손해율</th>
      </tr>
    </thead>
  `;
  
  // 데이터 행 (th는 가운데 정렬, td는 오른쪽 정렬)
  Object.keys(yearData).forEach(year => {
    const row = yearData[year];
    const total = row.received + row.pending + row.completed + row.exempted + row.canceled;
    
    tbody.innerHTML += `
      <tr>
        <th class="text-center">${year}</th>
        <td class="text-end">${row.received > 0 ? row.received : ''}</td>
        <td class="text-end">${row.pending > 0 ? row.pending : ''}</td>
        <td class="text-end">${row.completed > 0 ? row.completed : ''}</td>
        <td class="text-end">${row.exempted > 0 ? row.exempted : ''}</td>
        <td class="text-end">${row.canceled > 0 ? row.canceled : ''}</td>
        <td class="text-end">${total > 0 ? total : ''}</td>
        <td class="text-end">${row.claimAmount > 0 ? row.claimAmount.toLocaleString() : ''}</td>
        <td class="text-end">${row.totalPremium > 0 ? row.totalPremium.toLocaleString() : ''}</td>
        <td class="text-end">${row.lossRatio > 0 ? row.lossRatio + '%' : ''}</td>
      </tr>
    `;
    
    totalReceived += row.received;
    totalPending += row.pending;
    totalCompleted += row.completed;
    totalExempted += row.exempted;
    totalCanceled += row.canceled;
    totalAll += total;
    totalClaimAmount += row.claimAmount;
    totalPremiumAmount += row.totalPremium;
  });
  
  // 소계 (회색 배경, th는 가운데, td는 오른쪽 정렬)
  const totalLossRatio = totalPremiumAmount > 0
    ? ((totalClaimAmount / totalPremiumAmount) * 100).toFixed(2)
    : 0;
  
  tbody.innerHTML += `
    <tfoot>
      <tr class="table-secondary fw-bold">
        <th class="text-center">소계</th>
        <td class="text-end">${totalReceived > 0 ? totalReceived : ''}</td>
        <td class="text-end">${totalPending > 0 ? totalPending : ''}</td>
        <td class="text-end">${totalCompleted > 0 ? totalCompleted : ''}</td>
        <td class="text-end">${totalExempted > 0 ? totalExempted : ''}</td>
        <td class="text-end">${totalCanceled > 0 ? totalCanceled : ''}</td>
        <td class="text-end">${totalAll > 0 ? totalAll : ''}</td>
        <td class="text-end">${totalClaimAmount > 0 ? totalClaimAmount.toLocaleString() : ''}</td>
        <td class="text-end">${totalPremiumAmount > 0 ? totalPremiumAmount.toLocaleString() : ''}</td>
        <td class="text-end">${totalLossRatio > 0 ? totalLossRatio + '%' : ''}</td>
      </tr>
    </tfoot>
  `;
}
/**
 * 계약자별 테이블 업데이트 (스타일 수정 버전)
 */
function updateContractorTable(data) {
  if (!Array.isArray(data)) {
    data = [];
  }
  
  const tbody = document.querySelector('#performanceTable tbody');
  tbody.innerHTML = '';
  
  let totalReceived = 0, totalPending = 0, totalCompleted = 0, totalExempted = 0,
      totalCanceled = 0, totalAll = 0, totalClaimAmount = 0, totalPremiumAmount = 0;
  
  // 헤더 (회색 배경, 가운데 정렬)
  tbody.innerHTML += `
    <thead>
      <tr class="table-secondary">
        <th class="text-center">계약자</th>
        <th class="text-center">접수</th>
        <th class="text-center">미결</th>
        <th class="text-center">종결</th>
        <th class="text-center">면책</th>
        <th class="text-center">취소</th>
        <th class="text-center">계</th>
        <th class="text-center">종결 보험금 합계</th>
        <th class="text-center">보험료 합계</th>
        <th class="text-center">손해율</th>
      </tr>
    </thead>
  `;
  
  // 데이터 행 (계약자명은 왼쪽 정렬, 숫자는 오른쪽 정렬)
  data.forEach(item => {
    const schoolName = item.school1 && item.school1.trim() !== '' ? item.school1 : 'N/A';
    const received = parseInt(item.received) || 0;
    const pending = parseInt(item.pending) || 0;
    const completed = parseInt(item.completed) || 0;
    const exempted = parseInt(item.exempted) || 0;
    const canceled = parseInt(item.canceled) || 0;
    const claimAmount = parseInt(item.total_claim_amount) || 0;
    const premium = parseInt(item.total_premium) || 0;
    const total = received + pending + completed + exempted + canceled;
    
    const lossRatio = premium > 0 ? ((claimAmount / premium) * 100).toFixed(2) : 0;
    
    tbody.innerHTML += `
      <tr>
        <td>${schoolName}</td>
        <td class="text-end">${received > 0 ? received : ''}</td>
        <td class="text-end">${pending > 0 ? pending : ''}</td>
        <td class="text-end">${completed > 0 ? completed : ''}</td>
        <td class="text-end">${exempted > 0 ? exempted : ''}</td>
        <td class="text-end">${canceled > 0 ? canceled : ''}</td>
        <td class="text-end">${total > 0 ? total : ''}</td>
        <td class="text-end">${claimAmount > 0 ? claimAmount.toLocaleString() : ''}</td>
        <td class="text-end">${premium > 0 ? premium.toLocaleString() : ''}</td>
        <td class="text-end">${lossRatio > 0 ? lossRatio + '%' : ''}</td>
      </tr>
    `;
    
    totalReceived += received;
    totalPending += pending;
    totalCompleted += completed;
    totalExempted += exempted;
    totalCanceled += canceled;
    totalAll += total;
    totalClaimAmount += claimAmount;
    totalPremiumAmount += premium;
  });
  
  // 소계 (회색 배경, th는 가운데, td는 오른쪽 정렬)
  const totalLossRatio = totalPremiumAmount > 0
    ? ((totalClaimAmount / totalPremiumAmount) * 100).toFixed(2)
    : 0;
  
  tbody.innerHTML += `
    <tfoot>
      <tr class="table-secondary fw-bold">
        <th class="text-center">소계</th>
        <td class="text-end">${totalReceived > 0 ? totalReceived : ''}</td>
        <td class="text-end">${totalPending > 0 ? totalPending : ''}</td>
        <td class="text-end">${totalCompleted > 0 ? totalCompleted : ''}</td>
        <td class="text-end">${totalExempted > 0 ? totalExempted : ''}</td>
        <td class="text-end">${totalCanceled > 0 ? totalCanceled : ''}</td>
        <td class="text-end">${totalAll > 0 ? totalAll : ''}</td>
        <td class="text-end">${totalClaimAmount > 0 ? totalClaimAmount.toLocaleString() : ''}</td>
        <td class="text-end">${totalPremiumAmount > 0 ? totalPremiumAmount.toLocaleString() : ''}</td>
        <td class="text-end">${totalLossRatio > 0 ? totalLossRatio + '%' : ''}</td>
      </tr>
    </tfoot>
  `;
}

/**
 * 로딩 표시
 */
function showStatsLoading() {
  const tbody = document.querySelector('#performanceTable tbody');
  tbody.innerHTML = `
    <tr>
      <td colspan="10" class="text-center py-4">
        <i class="fas fa-spinner fa-spin"></i> 데이터를 불러오는 중...
      </td>
    </tr>
  `;
}

/**
 * 에러 표시
 */
function showStatsError(message) {
  const tbody = document.querySelector('#performanceTable tbody');
  tbody.innerHTML = `
    <tr>
      <td colspan="10" class="text-center py-4 text-danger">
        <i class="fas fa-exclamation-circle"></i> ${message}
      </td>
    </tr>
  `;
}