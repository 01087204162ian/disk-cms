/**
 * 일별 실적 관리 (달력 형식 + 월별 실적 추가)
 * pharmacy_daily_report.js
 */

// ========== 전역 변수 추가 ==========
let currentReportMode = 'daily'; // 'daily' or 'monthly'

/**
 * 일별 실적 모달 열기 (메인 함수)
 */
async function openDailyReportModal() {
  // 모드 초기화
  currentReportMode = 'daily';
  
  // 모달 제목 설정
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-chart-line text-success me-2"></i>
      일별 실적 (달력)
    `;
  }

  // 로딩 UI 먼저 표시
  const modalBody = document.getElementById('modalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">데이터를 불러오는 중...</span>
        </div>
        <div class="mt-2">데이터를 불러오는 중...</div>
      </div>
    `;
  }

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
  modal.show();

  // 거래처 목록 및 필터 UI 로드
  await loadDailyReportFilter();
}

/**
 * 필터 UI 로드 (거래처, 년도, 월)
 */
async function loadDailyReportFilter() {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  try {
    // 거래처 목록 가져오기
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

    const result = await response.json();

    if (result.success) {
      displayDailyReportFilter(result.data || []);
    } else {
      throw new Error(result.message || '거래처 목록을 불러오는데 실패했습니다.');
    }

  } catch (error) {
    console.error('필터 로드 오류:', error);
    
    modalBody.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        데이터를 불러오는 중 오류가 발생했습니다: ${error.message}
      </div>
      <div class="text-center">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          닫기
        </button>
      </div>
    `;
  }
}

/**
 * 필터 UI 표시
 * @param {Array} accounts 거래처 목록
 */
function displayDailyReportFilter(accounts = []) {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // 년도 옵션 생성 (최근 3년)
  const yearOptions = [];
  for (let i = 0; i < 3; i++) {
    const year = currentYear - i;
    yearOptions.push(`<option value="${year}" ${i === 0 ? 'selected' : ''}>${year}년</option>`);
  }

  // 월 옵션 생성
  const monthOptions = [];
  for (let i = 1; i <= 12; i++) {
    monthOptions.push(`<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${i}월</option>`);
  }

  modalBody.innerHTML = `
    <!-- 필터 영역 -->
    <div class="row mb-4">
      <!-- 거래처 선택 -->
      <div class="col-md-4 col-12 mb-3">
        <label for="report_account_filter" class="form-label fw-bold">
          <i class="fas fa-building me-1 text-primary"></i>거래처
        </label>
        <select id="report_account_filter" class="form-select">
          <option value="">전체 거래처</option>
          ${accounts.map(acc => `
            <option value="${acc.num}">${acc.directory}</option>
          `).join('')}
        </select>
      </div>

      <!-- 년도 선택 -->
      <div class="col-md-3 col-6 mb-3">
        <label for="report_year_filter" class="form-label fw-bold">
          <i class="fas fa-calendar me-1 text-primary"></i>년도
        </label>
        <select id="report_year_filter" class="form-select">
          ${yearOptions.join('')}
        </select>
      </div>

      <!-- 월 선택 -->
      <div class="col-md-3 col-6 mb-3" id="month_filter_container">
        <label for="report_month_filter" class="form-label fw-bold">
          <i class="fas fa-calendar-day me-1 text-primary"></i>월
        </label>
        <select id="report_month_filter" class="form-select">
          ${monthOptions.join('')}
        </select>
      </div>

      <!-- 조회 버튼 -->
      <div class="col-md-2 col-12 mb-3">
        <label class="form-label d-none d-md-block">&nbsp;</label>
        <button type="button" class="btn btn-primary w-100" onclick="loadDailyReportData()">
          <i class="fas fa-search me-1"></i>조회
        </button>
      </div>
    </div>

    <!-- 결과 영역 -->
    <div id="daily_report_result">
      <div class="text-center py-5 text-muted">
        <i class="fas fa-calendar-alt fa-3x mb-3" style="opacity: 0.3;"></i>
        <div>조회 버튼을 클릭하여 실적을 확인하세요.</div>
      </div>
    </div>
  `;

  // 푸터 설정
  updateReportFooter();

  // 초기 데이터 로드 (선택사항 - 주석 처리)
  // setTimeout(() => loadDailyReportData(), 100);
}

/**
 * 푸터 업데이트 (일별/월별 전환 버튼)
 */
function updateReportFooter() {
  const modalFoot = document.getElementById('modalFoot');
  if (!modalFoot) return;

  if (currentReportMode === 'daily') {
    modalFoot.innerHTML = `
      <div class="d-flex justify-content-between align-items-center w-100">
        <div>
          <button type="button" class="btn btn-info btn-sm" onclick="switchToMonthlyReport()">
            <i class="fas fa-chart-bar me-1"></i>월별 실적
          </button>
        </div>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="fas fa-times me-1"></i>닫기
        </button>
      </div>
    `;
  } else {
    modalFoot.innerHTML = `
      <div class="d-flex justify-content-between align-items-center w-100">
        <div>
          <button type="button" class="btn btn-info btn-sm" onclick="switchToDailyReport()">
            <i class="fas fa-calendar-alt me-1"></i>일별 실적
          </button>
        </div>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="fas fa-times me-1"></i>닫기
        </button>
      </div>
    `;
  }
}

/**
 * 일별 실적 데이터 로드
 */
async function loadDailyReportData() {
  if (currentReportMode === 'daily') {
    await loadDailyCalendarData();
  } else {
    await loadMonthlyReportData();
  }
}

/**
 * ========== 일별 달력 모드 ==========
 */
async function loadDailyCalendarData() {
  const resultDiv = document.getElementById('daily_report_result');
  if (!resultDiv) return;

  // 필터 값 가져오기
  const accountNum = document.getElementById('report_account_filter')?.value || '';
  const year = document.getElementById('report_year_filter')?.value || '';
  const month = document.getElementById('report_month_filter')?.value || '';

  // 로딩 표시
  resultDiv.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">조회 중...</span>
      </div>
      <div class="mt-2">실적을 조회하는 중...</div>
    </div>
  `;

  try {
    // API 호출
    const params = new URLSearchParams({
      account: accountNum,
      year: year,
      month: month
    });

    const response = await fetch(`/api/pharmacy-reports/daily?${params}`, {
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

    const result = await response.json();

    if (result.success) {
      displayDailyCalendar(result.data || [], result.summary || {}, year, month);
    } else {
      throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
    }

  } catch (error) {
    console.error('실적 조회 오류:', error);
    
    resultDiv.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        데이터를 불러오는 중 오류가 발생했습니다: ${error.message}
      </div>
    `;
  }
}

/**
 * 일별 실적 데이터 표시 (달력 형식으로 변경!)
 * @param {Array} dailyData 일별 데이터
 * @param {Object} summary 합계 정보
 * @param {string} year 년도
 * @param {string} month 월
 */
function displayDailyCalendar(dailyData = [], summary = {}, year, month) {
  const resultDiv = document.getElementById('daily_report_result');
  if (!resultDiv) return;

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '';
    return parseInt(amount).toLocaleString('ko-KR');
  };

  if (dailyData.length === 0) {
    resultDiv.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="fas fa-inbox fa-3x mb-3" style="opacity: 0.3;"></i>
        <div>조회된 데이터가 없습니다.</div>
      </div>
    `;
    return;
  }

  // 달력 구조 생성
  const calendarData = buildCalendarStructure(dailyData, parseInt(year), parseInt(month));

  // 합계 계산
  const netAmount = (summary.total_approval_amount || 0) - (summary.total_cancel_amount || 0);
  const netCount = (summary.total_approval_count || 0) - (summary.total_cancel_count || 0);

  // 통계 카드 (3개)
  const statsHtml = `
    <div class="row mb-3">
      <div class="col-md-4 col-12 mb-2">
        <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <div class="card-body text-white text-center py-2">
            <div class="small mb-1 opacity-75">승인</div>
            <h6 class="mb-0 fw-bold">${formatCurrency(summary.total_approval_amount || 0)}(${formatCurrency(summary.total_approval_count || 0)})</h6>
          </div>
        </div>
      </div>
      <div class="col-md-4 col-12 mb-2">
        <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="card-body text-white text-center py-2">
            <div class="small mb-1 opacity-75">해지</div>
            <h6 class="mb-0 fw-bold">${formatCurrency(summary.total_cancel_amount || 0)}(${formatCurrency(summary.total_cancel_count || 0)})</h6>
          </div>
        </div>
      </div>
      <div class="col-md-4 col-12 mb-2">
        <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <div class="card-body text-white text-center py-2">
            <div class="small mb-1 opacity-75">합계</div>
            <h6 class="mb-0 fw-bold">${formatCurrency(netAmount)}(${formatCurrency(netCount)})</h6>
          </div>
        </div>
      </div>
    </div>
  `;

  // 달력 테이블
  const calendarHtml = `
    <div class="table-responsive">
      <table class="table table-bordered text-center align-middle" style="table-layout: fixed;">
        <thead style="background-color: #f8f9fa;">
          <tr>
            <th class="text-dark py-2" style="width: 14.28%;">일</th>
            <th class="text-dark py-2" style="width: 14.28%;">월</th>
            <th class="text-dark py-2" style="width: 14.28%;">화</th>
            <th class="text-dark py-2" style="width: 14.28%;">수</th>
            <th class="text-dark py-2" style="width: 14.28%;">목</th>
            <th class="text-dark py-2" style="width: 14.28%;">금</th>
            <th class="text-dark py-2" style="width: 14.28%;">토</th>
          </tr>
        </thead>
        <tbody>
          ${calendarData.weeks.map(week => `
            <tr>
              ${week.map((day, idx) => {
                if (!day.date || !day.isCurrentMonth) {
                  return '<td class="bg-light" style="height: 120px;"></td>';
                }
                
                const isToday = 
                  new Date().getFullYear() === parseInt(year) && 
                  new Date().getMonth() + 1 === parseInt(month) && 
                  new Date().getDate() === day.date;
                
                const dayColor = idx === 0 ? 'text-danger' : (idx === 6 ? 'text-primary' : '');
                const borderClass = isToday ? 'border border-3 border-warning' : '';
                
                const hasData = day.approval_count > 0 || day.cancel_count > 0;
                const netAmount = day.approval_amount - day.cancel_amount;
                const netCount = day.approval_count - day.cancel_count;
                
                return `
                  <td class="${borderClass} p-2" style="height: 120px; vertical-align: top;">
                    <div class="${dayColor} fw-bold mb-2">${day.date}</div>
                    ${hasData ? `
                      <div class="small text-end">
                        ${day.approval_count > 0 ? `
                          <div class="text-primary">
                            승인 ${formatCurrency(day.approval_amount)} (${day.approval_count})
                          </div>
                        ` : ''}
                        ${day.cancel_count > 0 ? `
                          <div class="text-danger">
                            해지 ${formatCurrency(day.cancel_amount)} (${day.cancel_count})
                          </div>
                        ` : ''}
                        <div class="fw-bold mt-1" style="border-top: 1px solid #ddd; padding-top: 2px;">
                          계 ${formatCurrency(netAmount)} (${netCount})
                        </div>
                      </div>
                    ` : ''}
                  </td>
                `;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  resultDiv.innerHTML = statsHtml + calendarHtml;
}

/**
 * 달력 구조 생성
 */
function buildCalendarStructure(dailyData, year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const firstDayOfWeek = firstDay.getDay();
  const lastDate = lastDay.getDate();

  // 데이터를 날짜별 맵으로 변환
  const dataMap = {};
  dailyData.forEach(item => {
    const date = new Date(item.date);
    const day = date.getDate();
    dataMap[day] = item;
  });

  const weeks = [];
  let week = [];

  // 첫 주의 빈 칸 (이전 달 날짜 표시 안 함)
  for (let i = 0; i < firstDayOfWeek; i++) {
    week.push({
      date: null,
      isCurrentMonth: false,
      approval_count: 0,
      approval_amount: 0,
      cancel_count: 0,
      cancel_amount: 0
    });
  }

  // 현재 달의 날짜들
  for (let date = 1; date <= lastDate; date++) {
    const dayData = dataMap[date] || {};
    
    week.push({
      date: date,
      isCurrentMonth: true,
      approval_count: parseInt(dayData.approval_count) || 0,
      approval_amount: parseInt(dayData.approval_amount) || 0,
      cancel_count: parseInt(dayData.cancel_count) || 0,
      cancel_amount: parseInt(dayData.cancel_amount) || 0
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // 마지막 주의 빈 칸 (다음 달 날짜 표시 안 함)
  if (week.length > 0) {
    while (week.length < 7) {
      week.push({
        date: null,
        isCurrentMonth: false,
        approval_count: 0,
        approval_amount: 0,
        cancel_count: 0,
        cancel_amount: 0
      });
    }
    weeks.push(week);
  }

  return { weeks };
}

/**
 * ========== 월별 실적 모드 ==========
 */
function switchToMonthlyReport() {
  console.log('📊 월별 실적 모드 전환');
  currentReportMode = 'monthly';
  
  // 제목 변경
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-chart-bar text-success me-2"></i>
      월별 실적 (년간)
    `;
  }
  
  // 월 선택 숨김
  const monthContainer = document.getElementById('month_filter_container');
  if (monthContainer) monthContainer.style.display = 'none';
  
  // 푸터 업데이트
  updateReportFooter();
  
  // 데이터 로드
  loadMonthlyReportData();
}

function switchToDailyReport() {
  console.log('📅 일별 달력 모드 전환');
  currentReportMode = 'daily';
  
  // 제목 변경
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-chart-line text-success me-2"></i>
      일별 실적 (달력)
    `;
  }
  
  // 월 선택 표시
  const monthContainer = document.getElementById('month_filter_container');
  if (monthContainer) monthContainer.style.display = 'block';
  
  // 푸터 업데이트
  updateReportFooter();
  
  // 데이터 로드
  loadDailyCalendarData();
}

/**
 * 월별 실적 데이터 로드
 */
async function loadMonthlyReportData() {
  const resultDiv = document.getElementById('daily_report_result');
  if (!resultDiv) return;

  const accountNum = document.getElementById('report_account_filter')?.value || '';
  const year = document.getElementById('report_year_filter')?.value || '';

  resultDiv.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">조회 중...</span>
      </div>
      <div class="mt-2">월별 실적을 조회하는 중...</div>
    </div>
  `;

  try {
    const params = new URLSearchParams({
      account: accountNum,
      year: year
    });

    const response = await fetch(`/api/pharmacy-reports/monthly?${params}`, {
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

    const result = await response.json();

    if (result.success) {
      displayMonthlyReport(result.data || [], year);
    } else {
      throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
    }

  } catch (error) {
    console.error('월별 실적 조회 오류:', error);
    
    resultDiv.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        데이터를 불러오는 중 오류가 발생했습니다: ${error.message}
      </div>
    `;
  }
}

/**
 * 월별 실적 표시
 */
function displayMonthlyReport(data = [], year) {
  const resultDiv = document.getElementById('daily_report_result');
  if (!resultDiv) return;

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '';
    return parseInt(amount).toLocaleString('ko-KR');
  };

  const currentYear = parseInt(year);
  const lastYear = currentYear - 1;

  // 올해/작년 데이터 분리
  const thisYearData = data.filter(item => parseInt(item.year) === currentYear);
  const lastYearData = data.filter(item => parseInt(item.year) === lastYear);

  // 월별 맵 생성
  const thisYearMap = {};
  const lastYearMap = {};

  thisYearData.forEach(item => {
    const month = parseInt(item.month);
    thisYearMap[month] = item;
  });

  lastYearData.forEach(item => {
    const month = parseInt(item.month);
    lastYearMap[month] = item;
  });

  // 12개월 데이터 및 합계
  const monthlyRows = [];
  let totalThisYear = { approval_count: 0, approval_amount: 0, cancel_count: 0, cancel_amount: 0 };
  let totalLastYear = { approval_count: 0, approval_amount: 0, cancel_count: 0, cancel_amount: 0 };

  for (let month = 1; month <= 12; month++) {
    const thisMonth = thisYearMap[month] || {};
    const lastMonth = lastYearMap[month] || {};

    const thisYearApprovalCount = parseInt(thisMonth.approval_count) || 0;
    const thisYearApprovalAmount = parseInt(thisMonth.approval_amount) || 0;
    const thisYearCancelCount = parseInt(thisMonth.cancel_count) || 0;
    const thisYearCancelAmount = parseInt(thisMonth.cancel_amount) || 0;

    const lastYearApprovalCount = parseInt(lastMonth.approval_count) || 0;
    const lastYearApprovalAmount = parseInt(lastMonth.approval_amount) || 0;
    const lastYearCancelCount = parseInt(lastMonth.cancel_count) || 0;
    const lastYearCancelAmount = parseInt(lastMonth.cancel_amount) || 0;

    monthlyRows.push({
      month: month,
      thisYear: {
        approval_count: thisYearApprovalCount,
        approval_amount: thisYearApprovalAmount,
        cancel_count: thisYearCancelCount,
        cancel_amount: thisYearCancelAmount,
        net_count: thisYearApprovalCount - thisYearCancelCount,
        net_amount: thisYearApprovalAmount - thisYearCancelAmount
      },
      lastYear: {
        approval_count: lastYearApprovalCount,
        approval_amount: lastYearApprovalAmount,
        cancel_count: lastYearCancelCount,
        cancel_amount: lastYearCancelAmount,
        net_count: lastYearApprovalCount - lastYearCancelCount,
        net_amount: lastYearApprovalAmount - lastYearCancelAmount
      }
    });

    totalThisYear.approval_count += thisYearApprovalCount;
    totalThisYear.approval_amount += thisYearApprovalAmount;
    totalThisYear.cancel_count += thisYearCancelCount;
    totalThisYear.cancel_amount += thisYearCancelAmount;

    totalLastYear.approval_count += lastYearApprovalCount;
    totalLastYear.approval_amount += lastYearApprovalAmount;
    totalLastYear.cancel_count += lastYearCancelCount;
    totalLastYear.cancel_amount += lastYearCancelAmount;
  }

  const statsHtml = `
    <div class="row mb-2">
      <div class="col-6">
        <div class="position-relative">
          <div class="position-absolute top-0 end-0 text-muted fw-bold" style="font-size: 0.85rem; z-index: 10; margin-top: -1.5rem;">${currentYear}년</div>
          <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="card-body py-2" style="color: white !important;">
              <div class="row text-center">
                <div class="col-4">
                  <div class="small mb-1" style="color: white;">승인</div>
                  <div class="fw-bold" style="color: white; font-size: 0.9rem;">${formatCurrency(totalThisYear.approval_amount)}</div>
                  <div class="small" style="color: white; opacity: 0.8;">${totalThisYear.approval_count}</div>
                </div>
                <div class="col-4">
                  <div class="small mb-1" style="color: white;">해지</div>
                  <div class="fw-bold" style="color: white; font-size: 0.9rem;">${formatCurrency(totalThisYear.cancel_amount)}</div>
                  <div class="small" style="color: white; opacity: 0.8;">${totalThisYear.cancel_count}</div>
                </div>
                <div class="col-4">
                  <div class="small mb-1" style="color: white;">합계</div>
                  <div class="fw-bold" style="color: white; font-size: 0.9rem;">${formatCurrency(totalThisYear.approval_amount - totalThisYear.cancel_amount)}</div>
                  <div class="small" style="color: white; opacity: 0.8;">${totalThisYear.approval_count - totalThisYear.cancel_count}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-6">
        <div class="position-relative">
          <div class="position-absolute top-0 end-0 text-muted fw-bold" style="font-size: 0.85rem; z-index: 10; margin-top: -1.5rem;">${lastYear}년</div>
          <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <div class="card-body py-2" style="color: white !important;">
              <div class="row text-center">
                <div class="col-4">
                  <div class="small mb-1" style="color: white;">승인</div>
                  <div class="fw-bold" style="color: white; font-size: 0.9rem;">${formatCurrency(totalLastYear.approval_amount)}</div>
                  <div class="small" style="color: white; opacity: 0.8;">${totalLastYear.approval_count}</div>
                </div>
                <div class="col-4">
                  <div class="small mb-1" style="color: white;">해지</div>
                  <div class="fw-bold" style="color: white; font-size: 0.9rem;">${formatCurrency(totalLastYear.cancel_amount)}</div>
                  <div class="small" style="color: white; opacity: 0.8;">${totalLastYear.cancel_count}</div>
                </div>
                <div class="col-4">
                  <div class="small mb-1" style="color: white;">합계</div>
                  <div class="fw-bold" style="color: white; font-size: 0.9rem;">${formatCurrency(totalLastYear.approval_amount - totalLastYear.cancel_amount)}</div>
                  <div class="small" style="color: white; opacity: 0.8;">${totalLastYear.approval_count - totalLastYear.cancel_count}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  // 테이블 HTML
  const tableHtml = `
    <div class="table-responsive">
      <table class="table table-bordered table-hover align-middle">
        <thead style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <tr class="text-white">
    <th class="text-center" rowspan="2" style="min-width: 100px; vertical-align: middle; white-space: nowrap;">월</th>
    <th class="text-center" colspan="3">${currentYear}년</th>
    <th class="text-center" colspan="3">${lastYear}년</th>
  </tr>
          <tr class="text-white">
            <th class="text-center" style="width: 18%;">승인</th>
            <th class="text-center" style="width: 18%;">해지</th>
            <th class="text-center" style="width: 18%;">계</th>
            <th class="text-center" style="width: 18%;">승인</th>
            <th class="text-center" style="width: 18%;">해지</th>
            <th class="text-center" style="width: 18%;">계</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyRows.map(row => `
            <tr>
              <th class="text-center">${row.month}월</th>
              <td class="text-end text-primary">
                ${row.thisYear.approval_amount > 0 ? 
                  formatCurrency(row.thisYear.approval_amount) + ' (' + row.thisYear.approval_count + ')' 
                  : ''}
              </td>
              <td class="text-end text-danger">
                ${row.thisYear.cancel_amount > 0 ? 
                  formatCurrency(row.thisYear.cancel_amount) + ' (' + row.thisYear.cancel_count + ')' 
                  : ''}
              </td>
              <td class="text-end fw-bold">
                ${row.thisYear.net_amount !== 0 ? 
                  formatCurrency(row.thisYear.net_amount) + ' (' + row.thisYear.net_count + ')' 
                  : ''}
              </td>
              <td class="text-end text-primary">
                ${row.lastYear.approval_amount > 0 ? 
                  formatCurrency(row.lastYear.approval_amount) + ' (' + row.lastYear.approval_count + ')' 
                  : ''}
              </td>
              <td class="text-end text-danger">
                ${row.lastYear.cancel_amount > 0 ? 
                  formatCurrency(row.lastYear.cancel_amount) + ' (' + row.lastYear.cancel_count + ')' 
                  : ''}
              </td>
              <td class="text-end fw-bold">
                ${row.lastYear.net_amount !== 0 ? 
                  formatCurrency(row.lastYear.net_amount) + ' (' + row.lastYear.net_count + ')' 
                  : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot style="background-color: #f8f9fa;">
          <tr class="fw-bold">
            <th class="text-center">총합계</th>
            <td class="text-end text-primary">
              ${formatCurrency(totalThisYear.approval_amount)} (${totalThisYear.approval_count})
            </td>
            <td class="text-end text-danger">
              ${formatCurrency(totalThisYear.cancel_amount)} (${totalThisYear.cancel_count})
            </td>
            <td class="text-end fs-6">
              ${formatCurrency(totalThisYear.approval_amount - totalThisYear.cancel_amount)} 
              (${totalThisYear.approval_count - totalThisYear.cancel_count})
            </td>
            <td class="text-end text-primary">
              ${formatCurrency(totalLastYear.approval_amount)} (${totalLastYear.approval_count})
            </td>
            <td class="text-end text-danger">
              ${formatCurrency(totalLastYear.cancel_amount)} (${totalLastYear.cancel_count})
            </td>
            <td class="text-end fs-6">
              ${formatCurrency(totalLastYear.approval_amount - totalLastYear.cancel_amount)} 
              (${totalLastYear.approval_count - totalLastYear.cancel_count})
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  resultDiv.innerHTML = statsHtml + tableHtml;
}