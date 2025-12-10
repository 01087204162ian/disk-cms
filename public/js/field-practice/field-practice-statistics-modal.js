// ========== 통계 버튼 클릭 이벤트 ==========
document.addEventListener('DOMContentLoaded', function() {
  const statisticsBtn = document.getElementById('statistics_btn');
  
  if (statisticsBtn) {
    statisticsBtn.addEventListener('click', f_showStatsModal);
  }
});

// ========== 모달 제목 변경 함수 ==========
function updateModalTitle(title) {
  const modalTitle = document.querySelector('#performanceModal .modal-title');
  if (modalTitle) {
    modalTitle.innerHTML = `<i class="fas fa-chart-line"></i> 현장실습보험 ${title}`;
  }
}

// ========== 통계 모달 열기 ==========
function f_showStatsModal() {
  document.getElementById("changeP").innerHTML = "";
  
  // Bootstrap 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('performanceModal'));
  modal.show();
  
  // 실적 조회 함수 실행
  perFormance();
}

// ========== 월별 실적 모드 ==========
function perFormance() {
  console.log("📌 월별 실적 모달 오픈 & 데이터 요청");

  // 모달 제목 변경
  updateModalTitle("월별 실적 조회");

  createYearMonthSelectors();
  fetchPerformanceData(); // 현재일 기준 한 달간 실적 조회
  insertFooterButtons(); // 모달 푸터 버튼 삽입

  // 이벤트 리스너 추가 (연도 & 월 변경 시 데이터 재조회)
  setTimeout(() => {
    const yearSelect = document.getElementById("yearSelect");
    const monthSelect = document.getElementById("monthSelect");
    
    if (yearSelect) {
      yearSelect.addEventListener("change", fetchSelectedPerformanceData);
    }
    if (monthSelect) {
      monthSelect.addEventListener("change", fetchSelectedPerformanceData);
    }
  }, 100);
}

// ========== 연도 및 월 선택 박스 생성 ==========
function createYearMonthSelectors() {
  const yearContainer = document.getElementById("yearSelect_");
  const monthContainer = document.getElementById("monthSelect_");

  // 현재 날짜 가져오기
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // 연도 선택 동적 생성
  let yearDropdown = document.createElement("select");
  yearDropdown.id = "yearSelect";
  yearDropdown.className = "form-control";
  yearDropdown.innerHTML = `<option value="-1">년도 선택</option>`;

  for (let i = 0; i < 5; i++) {
    let year = currentYear - i;
    let option = document.createElement("option");
    option.value = year;
    option.textContent = year + "년";
    if (year === currentYear) {
      option.selected = true;
    }
    yearDropdown.appendChild(option);
  }

  yearContainer.innerHTML = "";
  yearContainer.appendChild(yearDropdown);

  // 월 선택 동적 생성
  let monthDropdown = document.createElement("select");
  monthDropdown.id = "monthSelect";
  monthDropdown.className = "form-control";
  monthDropdown.innerHTML = `<option value="-1">월 선택</option>`;

  for (let i = 1; i <= 12; i++) {
    let option = document.createElement("option");
    let monthValue = i < 10 ? `0${i}` : i;
    option.value = monthValue;
    option.textContent = `${i}월`;
    if (i === currentMonth) {
      option.selected = true;
    }
    monthDropdown.appendChild(option);
  }

  monthContainer.innerHTML = "";
  monthContainer.appendChild(monthDropdown);
}

// ========== 현재일 기준 한 달간 실적 조회 ==========
function fetchPerformanceData() {
  const today = new Date();
  const endDate = today.toISOString().split("T")[0];
  const startDate = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split("T")[0];

  fetch(`https://silbo.kr/2025/api/question/performance_1.php?start=${startDate}&end=${endDate}`)
    .then(response => response.json())
    .then(data => {
      renderTable(data, startDate, endDate);
    })
    .catch(error => {
      console.error("🚨 데이터 로드 오류:", error);
    });
}

// ========== 선택한 연도 및 월 기준 실적 조회 ==========
function fetchSelectedPerformanceData() {
  const selectedYear = document.getElementById("yearSelect").value;
  const selectedMonth = document.getElementById("monthSelect").value;

  if (selectedYear === "-1" || selectedMonth === "-1") {
    return;
  }

  // 선택한 연도 및 월의 시작일
  const startDate = `${selectedYear}-${selectedMonth}-01`;
  
  // 선택한 월의 마지막 날짜 계산 (다음 달 0일 = 이번 달 마지막 날)
  const year = parseInt(selectedYear);
  const month = parseInt(selectedMonth);
  const lastDay = new Date(year, month, 0).getDate(); // 월은 0부터 시작하므로 month 그대로 사용
  const endDate = `${selectedYear}-${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;

  console.log(`📅 조회 기간: ${startDate} ~ ${endDate}`);

  fetch(`https://silbo.kr/2025/api/question/performance_1.php?start=${startDate}&end=${endDate}`)
    .then(response => response.json())
    .then(data => {
      renderTable(data, startDate, endDate);
    })
    .catch(error => {
      console.error("🚨 데이터 로드 오류:", error);
    });
}

// ========== 월별 데이터 테이블 렌더링 ==========
function renderTable(data, startDate, endDate) {
  const tableBody = document.querySelector("#performanceTable tbody");
  const summaryContainer = document.querySelector("#performanceSummary");
  tableBody.innerHTML = "";

  let html = "<tr>";
  let totalSum = 0;

  data.forEach((item, index) => {
    const dayOfWeek = new Date(item.day_).getDay();
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

    let color = "";
    if (dayOfWeek === 0) color = "style='color:red;'";
    if (dayOfWeek === 6) color = "style='color:blue;'";

    const daySum = Number(item.day_sum) === 0 ? "" : item.day_sum;
    const gunSu = Number(item.gunsu) === 0 ? "" : `(${item.gunsu}건)`;

    if (Number(item.day_sum) !== 0) {
      totalSum += parseInt(String(item.day_sum).replace(/,/g, ""), 10);
    }

    html += `
      <td ${color}>
        <div>${item.day_} (${weekDays[dayOfWeek]})</div>
        <div>${daySum} ${gunSu}</div>
      </td>
    `;

    if ((index + 1) % 7 === 0) {
      html += "</tr><tr>";
    }
  });

  const remainingCells = data.length % 7;
  if (remainingCells > 0) {
    for (let i = 0; i < 7 - remainingCells; i++) {
      html += "<td></td>";
    }
  }

  html += "</tr>";
  tableBody.innerHTML = html;

  summaryContainer.innerHTML = `
    기간: ${startDate} ~ ${endDate} | 
    총 보험료: ${totalSum.toLocaleString()} 원
  `;
}

// ========== 월별 실적 푸터 버튼 ==========
function insertFooterButtons() {
  const footerContainer = document.getElementById("changeP");
  footerContainer.innerHTML = "";

  let ptr = "";
  ptr += `<button id="downloadExcel" class="p-btn"><i class="fas fa-download"></i> 최근 1년 실적 다운로드</button>`;
  ptr += `<button id="yearPerformanceBtn" class="p-btn"><i class="fas fa-calendar-alt"></i> 년별 실적</button>`;

  footerContainer.innerHTML = ptr;

  setTimeout(() => {
    const downloadExcelBtn = document.getElementById("downloadExcel");
    const yearPerformanceBtn = document.getElementById("yearPerformanceBtn");
    
    if (downloadExcelBtn) {
      downloadExcelBtn.addEventListener("click", downloadYearlyExcel);
      console.log("📌 '최근 1년 실적 다운로드' 버튼 이벤트 바인딩 완료!");
    }
    
    if (yearPerformanceBtn) {
      yearPerformanceBtn.addEventListener("click", yearPerFormance_);
      console.log("📌 '년별 실적' 버튼 이벤트 바인딩 완료!");
    }
  }, 50);
}

// ========== 년별 실적 모드 ==========
function yearPerFormance_() {
  console.log("📌 연간 실적 모드 실행");

  // 모달 제목 변경
  updateModalTitle("년별 실적 조회");

  document.getElementById("changeP").innerHTML = "";
  document.querySelector("#performanceTable tbody").innerHTML = "";
  document.querySelector("#performanceSummary").innerHTML = "";

  const yearContainer = document.getElementById("yearSelect_");
  const monthContainer = document.getElementById("monthSelect_");
  if (yearContainer) yearContainer.innerHTML = "";
  if (monthContainer) monthContainer.innerHTML = "";

  const today = new Date();
  const currentYear = today.getFullYear();

  let yearDropdown = document.createElement("select");
  yearDropdown.id = "yearSelect";
  yearDropdown.className = "form-control";

  // ✅ "최근 1년" 옵션 추가
  let recentOption = document.createElement("option");
  recentOption.value = "recent";
  recentOption.textContent = "최근 1년";
  recentOption.selected = true; // 기본 선택
  yearDropdown.appendChild(recentOption);

  // 연도 옵션 추가
  for (let i = 0; i < 5; i++) {
    let year = currentYear - i;
    let option = document.createElement("option");
    option.value = year;
    option.textContent = `${year}년`;
    yearDropdown.appendChild(option);
  }

  if (yearContainer) yearContainer.appendChild(yearDropdown);

  yearDropdown.addEventListener("change", function() {
    const selectedValue = this.value;
    if (selectedValue === "recent") {
      fetchRecentYearPerformance(); // 최근 1년 데이터
    } else {
      fetchYearlyPerformance(); // 특정 년도 데이터
    }
  });

  // ✅ 처음에는 최근 1년 데이터 표시
  fetchRecentYearPerformance();
}

// ========== 년별 실적 데이터 조회 ==========
function fetchYearlyPerformance() {
  const selectedYear = document.getElementById("yearSelect").value;
  
  if (selectedYear === "recent" || selectedYear === "-1") {
    return;
  }
  
  console.log(`📌 ${selectedYear}년 & ${selectedYear - 1}년 데이터 조회`);

  fetch(`https://silbo.kr/2025/api/question/performance_yearly.php?year=${selectedYear}`)
    .then(response => response.json())
    .then(data => {
      renderYearlyTable(data, selectedYear);
    })
    .catch(error => {
      console.error("🚨 연간 데이터 로드 오류:", error);
    });
}

// ========== 최근 1년(12개월) 실적 조회 ==========
function fetchRecentYearPerformance() {
  console.log("📌 최근 1년(12개월) 데이터 조회");

  const today = new Date();
  const currentYear = today.getFullYear();
  const prevYear = currentYear - 1;
  const twoYearsAgo = currentYear - 2;

  // 최근 3년 데이터를 모두 가져오기 (2023, 2024, 2025)
  Promise.all([
    fetch(`https://silbo.kr/2025/api/question/performance_yearly.php?year=${currentYear}`).then(r => r.json()),
    fetch(`https://silbo.kr/2025/api/question/performance_yearly.php?year=${prevYear}`).then(r => r.json()),
    fetch(`https://silbo.kr/2025/api/question/performance_yearly.php?year=${twoYearsAgo}`).then(r => r.json())
  ])
    .then(([data1, data2, data3]) => {
      const allData = [...data1, ...data2, ...data3];
      console.log("📊 병합된 데이터:", allData);
      renderRecentYearTable(allData);
    })
    .catch(error => {
      console.error("🚨 최근 1년 데이터 로드 오류:", error);
    });
}

// ========== 년별 데이터 테이블 렌더링 ==========
function renderYearlyTable(data, year) {
  const tableBody = document.querySelector("#performanceTable tbody");
  const summaryContainer = document.querySelector("#performanceSummary");
  tableBody.innerHTML = "";

  let totalGunsuYear = 0;
  let totalSumYear = 0;
  let totalGunsuPrevYear = 0;
  let totalSumPrevYear = 0;

  let yearData = data.filter(item => item.year && item.month && parseInt(item.year) === parseInt(year));
  let prevYearData = data.filter(item => item.year && item.month && parseInt(item.year) === parseInt(year) - 1);

  let mergedData = [];

  for (let month = 1; month <= 12; month++) {
    let monthFormatted = month < 10 ? `0${month}` : `${month}`;

    let yearItem = yearData.find(item => parseInt(item.month) === parseInt(monthFormatted)) || { gunsu: 0, total_sum: 0 };
    let prevYearItem = prevYearData.find(item => parseInt(item.month) === parseInt(monthFormatted)) || { gunsu: 0, total_sum: 0 };

    mergedData.push({
      month: monthFormatted,
      yearMonth: `${year}-${monthFormatted}`,
      prevYearMonth: `${year - 1}-${monthFormatted}`,
      yearGunsu: Number(yearItem.gunsu) === 0 ? "" : yearItem.gunsu,
      prevYearGunsu: Number(prevYearItem.gunsu) === 0 ? "" : prevYearItem.gunsu,
      yearTotal: Number(yearItem.total_sum) > 0 ? Number(yearItem.total_sum).toLocaleString() + " 원" : "",
      prevYearTotal: Number(prevYearItem.total_sum) > 0 ? Number(prevYearItem.total_sum).toLocaleString() + " 원" : ""
    });

    totalGunsuYear += parseInt(yearItem.gunsu) || 0;
    totalSumYear += parseInt(yearItem.total_sum) || 0;
    totalGunsuPrevYear += parseInt(prevYearItem.gunsu) || 0;
    totalSumPrevYear += parseInt(prevYearItem.total_sum) || 0;
  }

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th>년월</th>
    <th>보험료(건수)</th>
    <th>년월</th>
    <th>보험료(건수)</th>
  `;
  tableBody.appendChild(headerRow);

  mergedData.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <th>${item.yearMonth}</th>
      <td>${item.yearTotal} ${item.yearGunsu ? '(' + item.yearGunsu + '건)' : ''}</td>
      <th>${item.prevYearMonth}</th>
      <td>${item.prevYearTotal} ${item.prevYearGunsu ? '(' + item.prevYearGunsu + '건)' : ''}</td>
    `;
    tableBody.appendChild(row);
  });

  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
    <th><strong>📊 ${year}년 총합계</strong></th>
    <td><strong>${totalSumYear ? totalSumYear.toLocaleString() + " 원" : ""} (${totalGunsuYear}건)</strong></td>
    <th><strong>📊 ${year - 1}년 총합계</strong></th>
    <td><strong>${totalSumPrevYear ? totalSumPrevYear.toLocaleString() + " 원" : ""} (${totalGunsuPrevYear}건)</strong></td>
  `;
  tableBody.appendChild(totalRow);

  insertFooterButtons2();

  summaryContainer.innerHTML = `
    ${year}년: ${totalSumYear ? totalSumYear.toLocaleString() + " 원" : ""} (${totalGunsuYear}건) | 
    ${year - 1}년: ${totalSumPrevYear ? totalSumPrevYear.toLocaleString() + " 원" : ""} (${totalGunsuPrevYear}건)
  `;
}

// ========== 최근 1년(12개월) 테이블 렌더링 ==========
function renderRecentYearTable(data) {
  const tableBody = document.querySelector("#performanceTable tbody");
  const summaryContainer = document.querySelector("#performanceSummary");
  tableBody.innerHTML = "";

  const today = new Date();
  console.log(`📅 현재: ${today.getFullYear()}년 ${today.getMonth() + 1}월`);

  let totalGunsuRecent = 0;
  let totalSumRecent = 0;
  let totalGunsuPrev = 0;
  let totalSumPrev = 0;

  // 최근 12개월 및 그 전 12개월 데이터 생성 (역순: 최신 월부터)
  let recentData = [];
  
  for (let i = 0; i <= 11; i++) {  // ✅ 0부터 11까지 (역순)
    // 최근 1년
    let recentDate = new Date(today);
    recentDate.setMonth(recentDate.getMonth() - i);
    let recentYear = recentDate.getFullYear();
    let recentMonth = recentDate.getMonth() + 1;
    let recentMonthFormatted = recentMonth < 10 ? `0${recentMonth}` : `${recentMonth}`;

    // 그 전 1년 (12개월 전)
    let prevDate = new Date(today);
    prevDate.setMonth(prevDate.getMonth() - i - 12);
    let prevYear = prevDate.getFullYear();
    let prevMonth = prevDate.getMonth() + 1;
    let prevMonthFormatted = prevMonth < 10 ? `0${prevMonth}` : `${prevMonth}`;

    console.log(`비교: ${recentYear}-${recentMonthFormatted} vs ${prevYear}-${prevMonthFormatted}`);

    // 최근 1년 데이터 찾기
    let recentMonthData = data.find(item => 
      parseInt(item.year) === recentYear && 
      parseInt(item.month) === recentMonth
    ) || { gunsu: 0, total_sum: 0 };

    // 그 전 1년 데이터 찾기
    let prevMonthData = data.find(item => 
      parseInt(item.year) === prevYear && 
      parseInt(item.month) === prevMonth
    ) || { gunsu: 0, total_sum: 0 };

    recentData.push({
      recentYearMonth: `${recentYear}-${recentMonthFormatted}`,
      recentGunsu: Number(recentMonthData.gunsu) === 0 ? "" : recentMonthData.gunsu,
      recentTotal: Number(recentMonthData.total_sum) > 0 ? Number(recentMonthData.total_sum).toLocaleString() + " 원" : "",
      
      prevYearMonth: `${prevYear}-${prevMonthFormatted}`,
      prevGunsu: Number(prevMonthData.gunsu) === 0 ? "" : prevMonthData.gunsu,
      prevTotal: Number(prevMonthData.total_sum) > 0 ? Number(prevMonthData.total_sum).toLocaleString() + " 원" : ""
    });

    totalGunsuRecent += parseInt(recentMonthData.gunsu) || 0;
    totalSumRecent += parseInt(recentMonthData.total_sum) || 0;
    totalGunsuPrev += parseInt(prevMonthData.gunsu) || 0;
    totalSumPrev += parseInt(prevMonthData.total_sum) || 0;
  }

  // 테이블 헤더
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th>년월 (최근)</th>
    <th>보험료(건수)</th>
    <th>년월 (전년)</th>
    <th>보험료(건수)</th>
  `;
  tableBody.appendChild(headerRow);

  // 데이터 행 추가
  recentData.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <th>${item.recentYearMonth}</th>
      <td>${item.recentTotal} ${item.recentGunsu ? '(' + item.recentGunsu + '건)' : ''}</td>
      <th>${item.prevYearMonth}</th>
      <td>${item.prevTotal} ${item.prevGunsu ? '(' + item.prevGunsu + '건)' : ''}</td>
    `;
    tableBody.appendChild(row);
  });

  // 합계 행
  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
    <th><strong>📊 최근 1년 총합계</strong></th>
    <td><strong>${totalSumRecent ? totalSumRecent.toLocaleString() + " 원" : ""} (${totalGunsuRecent}건)</strong></td>
    <th><strong>📊 전년 1년 총합계</strong></th>
    <td><strong>${totalSumPrev ? totalSumPrev.toLocaleString() + " 원" : ""} (${totalGunsuPrev}건)</strong></td>
  `;
  tableBody.appendChild(totalRow);

  insertFooterButtons2();

  // 요약 정보
  const recentStart = recentData[recentData.length - 1].recentYearMonth;  // ✅ 역순이므로 마지막이 시작
  const recentEnd = recentData[0].recentYearMonth;  // ✅ 첫 번째가 끝
  const prevStart = recentData[recentData.length - 1].prevYearMonth;
  const prevEnd = recentData[0].prevYearMonth;
  
  summaryContainer.innerHTML = `
    최근: ${recentStart} ~ ${recentEnd} (${totalSumRecent ? totalSumRecent.toLocaleString() + " 원" : ""}, ${totalGunsuRecent}건) | 
    전년: ${prevStart} ~ ${prevEnd} (${totalSumPrev ? totalSumPrev.toLocaleString() + " 원" : ""}, ${totalGunsuPrev}건)
  `;
}

// ========== 최근 1년 실적 Excel 다운로드 ==========
function downloadYearlyExcel() {
  console.log("📥 최근 1년 실적 다운로드 시작");

  const today = new Date();
  const endDate = today.toISOString().split("T")[0];
  const startDate = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split("T")[0];

  fetch(`https://silbo.kr/2025/api/question/performance_1.php?start=${startDate}&end=${endDate}`)
    .then(response => response.json())
    .then(data => {
      generateExcelFile(data, startDate, endDate);
    })
    .catch(error => {
      console.error("🚨 다운로드 오류:", error);
      alert("다운로드 중 오류가 발생했습니다.");
    });
}

// ========== Excel 파일 생성 ==========
function generateExcelFile(data, startDate, endDate) {
  // CSV 형식으로 데이터 생성
  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += "날짜,요일,건수,보험료\n";

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  let totalSum = 0;
  let totalCount = 0;

  data.forEach(item => {
    const dayOfWeek = new Date(item.day_).getDay();
    const gunsu = Number(item.gunsu) || 0;
    const daySum = Number(String(item.day_sum).replace(/,/g, "")) || 0;

    if (gunsu > 0) {
      totalCount += gunsu;
      totalSum += daySum;
    }

    csvContent += `${item.day_},${weekDays[dayOfWeek]},${gunsu},${daySum}\n`;
  });

  // 합계 행 추가
  csvContent += `\n총합계,,${totalCount},${totalSum}\n`;
  csvContent += `기간,${startDate} ~ ${endDate},,\n`;

  // Blob 생성 및 다운로드
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const fileName = `현장실습보험_실적_${startDate}_${endDate}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`✅ 다운로드 완료: ${fileName}`);
  alert(`파일이 다운로드되었습니다.\n파일명: ${fileName}`);
}

// ========== 년별 실적 푸터 버튼 ==========
function insertFooterButtons2() {
  const footerContainer = document.getElementById("changeP");
  footerContainer.innerHTML = "";

  let ptr = "";
  ptr += `<button id="downloadExcel" class="p-btn"><i class="fas fa-download"></i> 최근 1년 실적 다운로드</button>`;
  ptr += `<button id="monthsBtn" class="p-btn"><i class="fas fa-calendar"></i> 월별 실적</button>`;

  footerContainer.innerHTML = ptr;

  setTimeout(() => {
    const downloadExcelBtn = document.getElementById("downloadExcel");
    const monthsBtn = document.getElementById("monthsBtn");
    
    if (downloadExcelBtn) {
      downloadExcelBtn.addEventListener("click", downloadYearlyExcel);
      console.log("📌 '최근 1년 실적 다운로드' 버튼 이벤트 바인딩 완료!");
    }
    
    if (monthsBtn) {
      monthsBtn.addEventListener("click", perFormance);
      console.log("📌 '월별 실적' 버튼 이벤트 바인딩 완료!");
    }
  }, 50);
}