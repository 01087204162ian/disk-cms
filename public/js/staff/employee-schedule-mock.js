/**
 * 주4일 근무제 시스템 - 모킹 데이터 및 헬퍼 함수
 * 
 * 개발 단계에서 사용할 모킹 데이터와 유틸리티 함수들
 */

// ===========================
// 모킹 데이터
// ===========================

/**
 * 모킹 스케줄 데이터
 */
const mockScheduleData = {
  success: true,
  data: {
    year: 2025,
    month: 1,
    user: {
      email: "user@example.com",
      name: "김철수",
      hire_date: "2024-10-01", // 수습 기간 계산용 (3개월 미만이면 수습 기간)
      work_schedule: "4_DAY",
      work_days: {
        base_off_day: 5, // 금요일
        cycle_start_date: "2025-01-06", // 4주 주기 시작일
        initial_selection_date: "2025-01-06"
      }
    },
    current_cycle: {
      week_range: "1-4주차",
      off_day: 5, // 금요일
      cycle_start_date: "2025-01-06",
      next_cycle_date: "2025-02-03", // 다음 주기 시작일 (4주 후)
      next_off_day: 4 // 목요일 (반대 방향)
    },
    schedule: {
      work_days: {
        "1": "full", // 월: 종일
        "2": "full", // 화: 종일
        "3": "full", // 수: 종일
        "4": "full", // 목: 종일
        "5": "off"   // 금: 휴무
      },
      total_hours: 32,
      work_days_count: 4
    },
    temporary_changes: [], // 일시적 변경 목록
    holidays: [
      { date: "2025-01-01", name: "신정" }
    ],
    is_probation: false, // 수습 기간 여부
    has_holiday_in_week: false // 이번 주 공휴일 포함 여부
  }
};

/**
 * 모킹 일시적 변경 요청 응답
 */
const mockTemporaryChangeResponse = {
  success: true,
  data: {
    id: 1,
    user_id: "user@example.com",
    week_start_date: "2025-01-13",
    original_off_day: 5,
    temporary_off_day: 2,
    reason: "개인 사정",
    status: "PENDING",
    requested_at: "2025-01-10T10:00:00Z"
  }
};

/**
 * 모킹 승인 대기 목록
 */
const mockPendingChanges = {
  success: true,
  data: [
    {
      id: 1,
      user_name: "김철수",
      week_start_date: "2025-01-13",
      original_off_day: 5,
      original_off_day_name: "금요일",
      temporary_off_day: 2,
      temporary_off_day_name: "화요일",
      reason: "개인 사정",
      requested_at: "2025-01-10T10:00:00Z"
    }
  ]
};

// ===========================
// 헬퍼 함수들
// ===========================

/**
 * 4주 주기로 반대 방향 순환하는 휴무일 계산
 * @param {Date|string} cycleStartDate - 4주 주기 시작일
 * @param {Date|string} targetDate - 계산 대상 날짜
 * @param {number} initialOffDay - 초기 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)
 * @returns {number} 해당 날짜의 휴무일 (1-5)
 */
function calculateOffDayByWeekCycle(cycleStartDate, targetDate, initialOffDay) {
  const start = typeof cycleStartDate === 'string' ? new Date(cycleStartDate) : cycleStartDate;
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  
  // 경과 일수 계산
  const daysDiff = Math.floor((target - start) / (1000 * 60 * 60 * 24));
  
  // 4주(28일) 단위로 주기 계산
  const cycles = Math.floor(daysDiff / 28);
  
  // 반대 방향 순환: 5(금) → 4(목) → 3(수) → 2(화) → 1(월) → 5(금)
  // 주기가 1 증가할 때마다 1 감소, 0 이하가 되면 5로 순환
  let currentOffDay = initialOffDay - cycles;
  
  // 0 이하가 되면 5로 순환
  while (currentOffDay <= 0) {
    currentOffDay += 5;
  }
  
  // 5 초과가 되면 5로 나눈 나머지로 조정
  while (currentOffDay > 5) {
    currentOffDay -= 5;
  }
  
  return currentOffDay;
}

/**
 * 주 시작일(월요일) 계산
 * @param {Date|string} date - 날짜
 * @returns {Date} 해당 주의 월요일
 */
function getWeekStartDate(date) {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = d.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * 요일 번호를 이름으로 변환
 * @param {number} dayNumber - 요일 번호 (1=월, 2=화, ..., 5=금)
 * @returns {string} 요일 이름
 */
function getDayName(dayNumber) {
  const dayNames = {1: '월요일', 2: '화요일', 3: '수요일', 4: '목요일', 5: '금요일'};
  return dayNames[dayNumber] || '';
}

/**
 * 현재 주기가 몇 주차인지 계산 (1-4)
 * @param {Date|string} cycleStartDate - 주기 시작일
 * @param {Date|string} targetDate - 대상 날짜
 * @returns {number} 주차 (1-4)
 */
function getCycleWeek(cycleStartDate, targetDate) {
  const start = typeof cycleStartDate === 'string' ? new Date(cycleStartDate) : cycleStartDate;
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  
  const daysDiff = Math.floor((target - start) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(daysDiff / 7) + 1;
  
  // 4주 주기 내에서의 주차 (1-4)
  return ((weekNumber - 1) % 4) + 1;
}

/**
 * 수습 기간인지 확인
 * @param {Date|string} hireDate - 입사일
 * @param {Date|string} targetDate - 확인 대상 날짜
 * @returns {boolean} 수습 기간 여부
 */
function isProbationPeriod(hireDate, targetDate) {
  const hire = typeof hireDate === 'string' ? new Date(hireDate) : hireDate;
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  
  const monthsDiff = (target.getFullYear() - hire.getFullYear()) * 12 + 
                   (target.getMonth() - hire.getMonth());
  
  return monthsDiff < 3;
}

/**
 * 같은 주인지 확인
 * @param {Date|string} date1 - 날짜 1
 * @param {Date|string} date2 - 날짜 2
 * @returns {boolean} 같은 주 여부
 */
function isSameWeek(date1, date2) {
  const week1 = getWeekStartDate(date1);
  const week2 = getWeekStartDate(date2);
  
  return week1.getTime() === week2.getTime();
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 * @param {Date|string} date - 날짜
 * @returns {string} 포맷된 날짜
 */
function formatDate(date) {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 모킹 데이터 사용 여부 플래그
window.USE_MOCK_DATA = true; // 개발 중에는 true, 실제 API 연동 시 false

