/**
 * 주4일 근무제 시스템 헬퍼 함수 모음
 * 
 * @module work-schedule-helpers
 * @description 4주 주기 반대 방향 순환 시스템 관련 유틸리티 함수들
 */

/**
 * 주 시작일(월요일) 계산
 * @param {Date|string} date - 날짜
 * @returns {Date} 해당 주의 월요일
 */
function getWeekStartDate(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=일, 1=월, ..., 6=토
  // 월요일로 조정: 월요일(1)이면 0일 전, 화요일(2)이면 1일 전, ..., 일요일(0)이면 6일 전
  const diff = day === 0 ? -6 : 1 - day;
  // 년, 월, 일을 직접 계산하여 타임존 문제 방지
  const year = d.getFullYear();
  const month = d.getMonth();
  const dayOfMonth = d.getDate();
  const monday = new Date(year, month, dayOfMonth + diff, 0, 0, 0, 0);
  return monday;
}

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
  
  // 주 시작일(월요일) 기준으로 계산
  const startWeek = getWeekStartDate(start);
  const targetWeek = getWeekStartDate(target);
  
  // 경과 일수 계산 (주 시작일 기준)
  const daysDiff = Math.floor((targetWeek - startWeek) / (1000 * 60 * 60 * 24));
  
  // 주 단위로 계산 (7일 단위)
  const weeksDiff = Math.floor(daysDiff / 7);
  
  // 4주(28일) 단위로 주기 계산
  const cycles = Math.floor(weeksDiff / 4);
  
  // 타겟 날짜가 주기 시작일보다 이전인 경우 처리
  if (daysDiff < 0) {
    // 주기 시작일 이전이면 정방향으로 순환 (반대 방향의 역방향)
    // 예: 주기 시작일이 금요일이고, 4주 전이면 목요일, 8주 전이면 수요일
    const absCycles = Math.abs(cycles);
    let currentOffDay = initialOffDay + absCycles;
    
    // 5 초과가 되면 5로 나눈 나머지로 조정
    while (currentOffDay > 5) {
      currentOffDay -= 5;
    }
    
    return currentOffDay;
  }
  
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
  if (!hireDate) return false;
  
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

/**
 * 특정 주에 공휴일이 포함되어 있는지 확인
 * @param {Date|string} weekStartDate - 주 시작일(월요일)
 * @param {Array} holidays - 공휴일 배열 [{date: 'YYYY-MM-DD', name: '공휴일명'}]
 * @returns {boolean} 공휴일 포함 여부
 */
function hasHolidayInWeek(weekStartDate, holidays) {
  if (!holidays || holidays.length === 0) return false;
  
  const weekStart = typeof weekStartDate === 'string' ? new Date(weekStartDate) : weekStartDate;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4); // 금요일까지
  
  return holidays.some(h => {
    const holidayDate = new Date(h.date || h.holiday_date);
    holidayDate.setHours(0, 0, 0, 0);
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(weekEnd);
    end.setHours(0, 0, 0, 0);
    return holidayDate >= start && holidayDate <= end;
  });
}

/**
 * 반차가 같은 주 내에서 사용되는지 검증
 * @param {Date|string} halfDayDate - 반차 날짜
 * @param {Date|string} cycleStartDate - 주기 시작일
 * @param {number} baseOffDay - 기본 휴무일 (1-5)
 * @returns {Object} {valid: boolean, message: string}
 */
function validateHalfDayInSameWeek(halfDayDate, cycleStartDate, baseOffDay) {
  const halfDay = typeof halfDayDate === 'string' ? new Date(halfDayDate) : halfDayDate;
  const cycleStart = typeof cycleStartDate === 'string' ? new Date(cycleStartDate) : cycleStartDate;
  
  // 해당 주의 휴무일 계산
  const weekStart = getWeekStartDate(halfDay);
  const offDay = calculateOffDayByWeekCycle(cycleStart, weekStart, baseOffDay);
  
  // 휴무일 날짜 계산
  const offDayDate = new Date(weekStart);
  offDayDate.setDate(offDayDate.getDate() + (offDay - 1));
  
  // 같은 주인지 확인
  if (!isSameWeek(halfDay, offDayDate)) {
    return {
      valid: false,
      message: '반차는 같은 주(월~일) 내에서만 사용 가능합니다.'
    };
  }
  
  return {
    valid: true,
    message: '검증 통과'
  };
}

/**
 * 일시적 변경 요청 검증
 * @param {Date|string} weekStartDate - 변경할 주의 월요일
 * @param {number} temporaryOffDay - 변경할 휴무일 (1-5)
 * @param {Date|string} cycleStartDate - 주기 시작일
 * @param {number} baseOffDay - 기본 휴무일 (1-5)
 * @param {Array} holidays - 공휴일 배열
 * @param {Date|string} hireDate - 입사일
 * @returns {Object} {valid: boolean, message: string, code: string}
 */
function validateTemporaryChange(weekStartDate, temporaryOffDay, cycleStartDate, baseOffDay, holidays, hireDate) {
  const weekStart = typeof weekStartDate === 'string' ? new Date(weekStartDate) : weekStartDate;
  const today = new Date();
  
  // 1. 수습 기간 체크
  if (isProbationPeriod(hireDate, today)) {
    return {
      valid: false,
      message: '수습 기간 중에는 일시적 변경이 불가합니다.',
      code: 'PROBATION_PERIOD'
    };
  }
  
  // 2. 공휴일 포함 주 체크
  if (hasHolidayInWeek(weekStart, holidays)) {
    return {
      valid: false,
      message: '공휴일 포함 주에는 일시적 변경이 불가합니다.',
      code: 'HOLIDAY_WEEK'
    };
  }
  
  // 3. 원래 휴무일과 동일한지 확인
  const cycleStart = typeof cycleStartDate === 'string' ? new Date(cycleStartDate) : cycleStartDate;
  const originalOffDay = calculateOffDayByWeekCycle(cycleStart, weekStart, baseOffDay);
  
  if (originalOffDay === temporaryOffDay) {
    return {
      valid: false,
      message: '원래 휴무일과 동일합니다.',
      code: 'VALIDATION_ERROR'
    };
  }
  
  return {
    valid: true,
    message: '검증 통과'
  };
}

/**
 * 주기 정보 계산
 * @param {Date|string} cycleStartDate - 주기 시작일
 * @param {Date|string} targetDate - 대상 날짜
 * @param {number} baseOffDay - 기본 휴무일 (1-5)
 * @returns {Object} 주기 정보
 */
function calculateCycleInfo(cycleStartDate, targetDate, baseOffDay) {
  const cycleStart = typeof cycleStartDate === 'string' ? new Date(cycleStartDate) : cycleStartDate;
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  
  const currentOffDay = calculateOffDayByWeekCycle(cycleStart, target, baseOffDay);
  const cycleWeek = getCycleWeek(cycleStart, target);
  
  // 주차 범위 계산
  const daysDiff = Math.floor((target - cycleStart) / (1000 * 60 * 60 * 24));
  
  // 타겟 날짜가 주기 시작일보다 이전인 경우 처리
  if (daysDiff < 0) {
    // 주기 시작일 이전이면 첫 번째 주기로 처리
    const weekRange = "1-4주차";
    
    // 다음 주기 계산 (4주 후)
    const nextCycleStart = new Date(cycleStart);
    nextCycleStart.setDate(nextCycleStart.getDate() + 28);
    const nextOffDay = calculateOffDayByWeekCycle(cycleStart, nextCycleStart, baseOffDay);
    
    return {
      currentOffDay,
      currentOffDayName: getDayName(currentOffDay),
      cycleWeek: 1,
      weekRange: weekRange,
      nextCycleDate: formatDate(nextCycleStart),
      nextOffDay,
      nextOffDayName: getDayName(nextOffDay)
    };
  }
  
  const totalWeeks = Math.floor(daysDiff / 7) + 1;
  const cycleNumber = Math.floor((totalWeeks - 1) / 4);
  const weekStart = (cycleNumber * 4) + 1;
  const weekEnd = (cycleNumber + 1) * 4;
  const weekRange = `${weekStart}-${weekEnd}주차`;
  
  // 다음 주기 계산
  const nextCycleStart = new Date(cycleStart);
  nextCycleStart.setDate(nextCycleStart.getDate() + 28);
  const nextOffDay = calculateOffDayByWeekCycle(cycleStart, nextCycleStart, baseOffDay);
  
  return {
    currentOffDay,
    currentOffDayName: getDayName(currentOffDay),
    cycleWeek,
    weekRange,
    nextCycleDate: formatDate(nextCycleStart),
    nextOffDay,
    nextOffDayName: getDayName(nextOffDay)
  };
}

module.exports = {
  getWeekStartDate,
  calculateOffDayByWeekCycle,
  getDayName,
  getCycleWeek,
  isProbationPeriod,
  isSameWeek,
  formatDate,
  hasHolidayInWeek,
  validateHalfDayInSameWeek,
  validateTemporaryChange,
  calculateCycleInfo
};

