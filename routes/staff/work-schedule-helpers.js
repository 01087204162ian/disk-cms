/**
 * ================================================================
 * 주 4일 근무제 헬퍼 함수 모듈
 * ================================================================
 * 
 * 주요 기능:
 * - 타임존(KST) 기준 날짜 처리
 * - 4주 사이클 계산
 * - 휴무일 계산
 * - 공휴일 포함 주 체크
 * - 반차 검증
 * 
 * 타임존 규칙:
 * - 모든 날짜 계산은 KST (Asia/Seoul, UTC+9) 기준
 * - 서버에서 모든 날짜 계산 수행
 * 
 * Created: 2025-12-28
 * Version: 1.0.0
 * ================================================================
 */

// 타임존 설정 (이 모듈이 먼저 로드될 경우를 대비)
if (!process.env.TZ || process.env.TZ !== 'Asia/Seoul') {
  process.env.TZ = 'Asia/Seoul';
  console.log('✅ work-schedule-helpers: 타임존이 Asia/Seoul로 설정되었습니다.');
}

// ===========================
// 타임존 헬퍼 함수
// ===========================

/**
 * KST 기준 날짜 생성
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 * @param {number} day - 일
 * @param {number} hour - 시 (기본값: 0)
 * @param {number} minute - 분 (기본값: 0)
 * @param {number} second - 초 (기본값: 0)
 * @returns {Date} KST 기준 Date 객체
 */
function createKSTDate(year, month, day, hour = 0, minute = 0, second = 0) {
  // KST는 UTC+9이므로, UTC로 변환하여 저장
  // 하지만 JavaScript Date는 로컬 타임존을 사용하므로
  // 명시적으로 시간을 설정하여 KST 기준으로 처리
  const date = new Date(year, month - 1, day, hour, minute, second);
  return date;
}

/**
 * 날짜 문자열을 KST 기준 Date 객체로 변환
 * @param {string|Date} dateInput - 날짜 문자열 (YYYY-MM-DD) 또는 Date 객체
 * @returns {Date} KST 기준 Date 객체
 */
function parseKSTDate(dateInput) {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  // YYYY-MM-DD 형식 파싱
  const parts = dateInput.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateInput}. Expected YYYY-MM-DD`);
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  return createKSTDate(year, month, day);
}

/**
 * 날짜를 YYYY-MM-DD 형식 문자열로 변환
 * @param {Date|string} date - Date 객체 또는 날짜 문자열
 * @returns {string} YYYY-MM-DD 형식 문자열
 */
function formatDate(date) {
  if (!date) return null;
  
  const d = date instanceof Date ? date : parseKSTDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 주 시작일 계산 (월요일 00:00:00 KST)
 * @param {Date|string} date - 기준 날짜
 * @returns {Date} 주 시작일 (월요일 00:00:00 KST)
 */
function getWeekStartDate(date) {
  const d = date instanceof Date ? new Date(date) : parseKSTDate(date);
  
  // 요일 확인 (0=일, 1=월, ..., 6=토)
  const dayOfWeek = d.getDay();
  
  // 월요일까지의 일수 계산
  // 일요일(0)인 경우 6일 전, 월요일(1)인 경우 0일 전
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // 월요일로 이동
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  return weekStart;
}

/**
 * 주 종료일 계산 (일요일 23:59:59 KST)
 * @param {Date|string} date - 기준 날짜
 * @returns {Date} 주 종료일 (일요일 23:59:59 KST)
 */
function getWeekEndDate(date) {
  const weekStart = getWeekStartDate(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return weekEnd;
}

// ===========================
// 4주 사이클 계산 함수
// ===========================

/**
 * 4주 사이클 번호 계산 (공휴일 주 제외)
 * @param {Date|string} cycleStartDate - 사이클 시작일 (KST)
 * @param {Date|string} targetDate - 계산 대상 날짜 (KST)
 * @param {Array} holidays - 공휴일 배열 [{date: string|Date, name: string}] (선택)
 * @returns {number} 사이클 번호 (0부터 시작)
 */
function getCycleNumber(cycleStartDate, targetDate, holidays = []) {
  const start = parseKSTDate(cycleStartDate);
  const target = parseKSTDate(targetDate);
  
  // 주 시작일 기준으로 계산
  const startWeekStart = getWeekStartDate(start);
  const targetWeekStart = getWeekStartDate(target);
  
  // 사이클 실제 시작 주 찾기: 사이클 시작일의 주가 공휴일 주면 다음 공휴일이 아닌 주부터 시작
  let actualCycleStart = new Date(startWeekStart);
  if (hasHolidayInWeek(actualCycleStart, holidays)) {
    // 공휴일 주를 건너뛰고 다음 공휴일이 아닌 주 찾기
    do {
      actualCycleStart = new Date(actualCycleStart);
      actualCycleStart.setDate(actualCycleStart.getDate() + 7);
    } while (hasHolidayInWeek(actualCycleStart, holidays));
  }
  
  // 실제 사이클 시작일부터 목표 날짜까지 주를 순회하면서 공휴일 주를 제외하고 카운트
  let currentWeekStart = new Date(actualCycleStart);
  let weekCount = 0; // 공휴일이 없는 주의 개수
  let cycleNumber = 0;
  
  while (currentWeekStart <= targetWeekStart) {
    // 공휴일 주가 아닌 경우에만 카운트
    if (!hasHolidayInWeek(currentWeekStart, holidays)) {
      weekCount++;
      
      // 사이클 0은 정확히 4주, 사이클 1부터는 4주 단위
      // weekCount가 4를 넘으면 다음 사이클로
      // weekCount === 5일 때 사이클 1, weekCount === 9일 때 사이클 2, ...
      if (weekCount > 4) {
        cycleNumber = Math.floor((weekCount - 1) / 4);
      }
    }
    
    // 다음 주로 이동
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  // 디버깅: 사이클 번호 계산 확인
  console.log(`[getCycleNumber] cycleStart: ${formatDate(startWeekStart)}, actualCycleStart: ${formatDate(actualCycleStart)}, target: ${formatDate(targetWeekStart)}, weekCount: ${weekCount}, cycleNumber: ${cycleNumber}`);
  
  return cycleNumber;
}

/**
 * 4주 사이클 내 주차 계산 (1-4, 공휴일 주 제외)
 * @param {Date|string} cycleStartDate - 사이클 시작일 (KST)
 * @param {Date|string} targetDate - 계산 대상 날짜 (KST)
 * @param {Array} holidays - 공휴일 배열 [{date: string|Date, name: string}] (선택)
 * @returns {number} 주차 (1-4)
 */
function getCycleWeek(cycleStartDate, targetDate, holidays = []) {
  const start = parseKSTDate(cycleStartDate);
  const target = parseKSTDate(targetDate);
  
  // 주 시작일 기준으로 계산
  const startWeekStart = getWeekStartDate(start);
  const targetWeekStart = getWeekStartDate(target);
  
  // 사이클 실제 시작 주 찾기: 사이클 시작일의 주가 공휴일 주면 다음 공휴일이 아닌 주부터 시작
  let actualCycleStart = new Date(startWeekStart);
  if (hasHolidayInWeek(actualCycleStart, holidays)) {
    // 공휴일 주를 건너뛰고 다음 공휴일이 아닌 주 찾기
    do {
      actualCycleStart = new Date(actualCycleStart);
      actualCycleStart.setDate(actualCycleStart.getDate() + 7);
    } while (hasHolidayInWeek(actualCycleStart, holidays));
  }
  
  // 실제 사이클 시작일부터 목표 날짜까지 주를 순회하면서 공휴일 주를 제외하고 카운트
  let currentWeekStart = new Date(actualCycleStart);
  let weekCount = 0; // 공휴일이 없는 주의 개수
  let cycleNumber = 0;
  
  while (currentWeekStart <= targetWeekStart) {
    // 공휴일 주가 아닌 경우에만 카운트
    if (!hasHolidayInWeek(currentWeekStart, holidays)) {
      weekCount++;
      
      // 사이클 0은 정확히 4주, 사이클 1부터는 4주 단위
      // weekCount가 4를 넘으면 다음 사이클로
      // weekCount === 5일 때 사이클 1, weekCount === 9일 때 사이클 2, ...
      if (weekCount > 4) {
        cycleNumber = Math.floor((weekCount - 1) / 4);
      }
    }
    
    // 다음 주로 이동
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  // 사이클 내 주차 계산 (1-4)
  // 사이클 0은 weekCount 그대로 사용 (1-4)
  // 사이클 1 이상은 (weekCount - cycleNumber * 4) 사용
  const week = cycleNumber === 0 ? weekCount : (weekCount - cycleNumber * 4);
  
  return week;
}

/**
 * 4주 사이클 기준 휴무일 계산 (공휴일 주 제외)
 * @param {Date|string} cycleStartDate - 사이클 시작일 (KST)
 * @param {Date|string} targetDate - 계산 대상 날짜 (KST)
 * @param {number} baseOffDay - 기본 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)
 * @param {Array} holidays - 공휴일 배열 [{date: string|Date, name: string}] (선택)
 * @returns {number} 해당 주의 휴무일 (1-5)
 */
function calculateOffDayByWeekCycle(cycleStartDate, targetDate, baseOffDay, holidays = []) {
  const start = parseKSTDate(cycleStartDate);
  const target = parseKSTDate(targetDate);
  
  // 주 시작일(월요일) 기준으로 계산
  const weekStart = getWeekStartDate(target);
  
  // 공휴일 주인 경우 휴무일 계산 불필요 (주 4일 근무 해제)
  // 하지만 사이클 번호는 계산해야 함 (공휴일 주는 사이클에서 제외되므로)
  const isHolidayWeek = hasHolidayInWeek(weekStart, holidays);
  
  // 사이클 번호 계산 (공휴일 주 제외)
  // 공휴일 주는 getCycleNumber에서 제외되므로, 공휴일 주의 사이클 번호는
  // 이전 주의 사이클 번호와 동일하거나, 다음 공휴일이 아닌 주의 사이클 번호를 사용해야 함
  let cycleNumber;
  if (isHolidayWeek) {
    // 공휴일 주인 경우, 이전 주의 사이클 번호를 사용
    // 이전 주로 이동하여 사이클 번호 계산
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    cycleNumber = getCycleNumber(start, prevWeekStart, holidays);
  } else {
    cycleNumber = getCycleNumber(start, weekStart, holidays);
  }
  
  // 디버깅: 휴무일 계산 확인
  console.log(`[calculateOffDayByWeekCycle] weekStart: ${formatDate(weekStart)}, isHolidayWeek: ${isHolidayWeek}, cycleNumber: ${cycleNumber}, baseOffDay: ${baseOffDay}`);
  
  // 디버깅: 2026-02-23 주 확인
  if (formatDate(weekStart) === '2026-02-23') {
    console.log(`[calculateOffDayByWeekCycle] 2026-02-23 주 디버깅: isHolidayWeek=${isHolidayWeek}, cycleNumber=${cycleNumber}, baseOffDay=${baseOffDay}`);
  }
  
  // 공휴일 주인 경우 기본 휴무일 반환 (표시용, 실제로는 주 4일 근무 해제)
  if (isHolidayWeek) {
    return baseOffDay;
  }
  
  // 사이클 0 (1-4주차)인 경우 base_off_day 사용
  if (cycleNumber === 0) {
    return baseOffDay;
  }
  
  // 사이클 1 이상부터 시프트 순환
  // 시프트 순서: 금(5) → 목(4) → 수(3) → 화(2) → 월(1) → 금(5)
  const shiftOrder = [5, 4, 3, 2, 1]; // 금, 목, 수, 화, 월
  
  // base_off_day의 시프트 순서 내 인덱스 찾기
  const baseIndex = shiftOrder.indexOf(baseOffDay);
  
  // 사이클 번호에 따른 시프트 인덱스 계산
  // 각 사이클마다 시프트 순서에서 4칸 앞으로 이동 (금→목→수→화→월)
  // 사이클 1: baseIndex - 4, 사이클 2: baseIndex - 8, ...
  const shiftIndex = ((baseIndex - cycleNumber * 4) % 5 + 5) % 5;
  
  // 현재 사이클의 휴무일
  const currentOffDay = shiftOrder[shiftIndex];
  
  return currentOffDay;
}

/**
 * 요일 번호를 한글 요일명으로 변환
 * @param {number} dayNumber - 요일 번호 (1=월, 2=화, 3=수, 4=목, 5=금)
 * @returns {string} 한글 요일명
 */
function getDayName(dayNumber) {
  const dayNames = {
    1: '월요일',
    2: '화요일',
    3: '수요일',
    4: '목요일',
    5: '금요일'
  };
  
  return dayNames[dayNumber] || '알 수 없음';
}

// ===========================
// 공휴일 처리 함수
// ===========================

/**
 * 주에 공휴일이 포함되어 있는지 확인
 * @param {Date|string} weekStartDate - 주 시작일 (월요일, KST)
 * @param {Array} holidays - 공휴일 배열 [{date: string|Date, name: string}]
 * @returns {boolean} 공휴일 포함 여부
 */
function hasHolidayInWeek(weekStartDate, holidays) {
  if (!holidays || holidays.length === 0) return false;
  
  const weekStart = weekStartDate instanceof Date ? weekStartDate : parseKSTDate(weekStartDate);
  const weekEnd = getWeekEndDate(weekStart);
  
  // 주 시작일과 종료일을 00:00:00으로 설정하여 비교
  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);
  
  return holidays.some(h => {
    // h.date가 문자열인 경우 parseKSTDate 사용
    const holidayDate = typeof h.date === 'string' ? parseKSTDate(h.date) : (h.date instanceof Date ? new Date(h.date) : parseKSTDate(h.date));
    holidayDate.setHours(12, 0, 0, 0); // 정오로 설정하여 날짜 비교 정확도 향상
    
    // 주말(토요일=6, 일요일=0)에 있는 공휴일은 제외
    // 주 4일 근무제에서는 평일(월~금)에 있는 공휴일만 고려
    const dayOfWeek = holidayDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false; // 주말 공휴일은 무시
    }
    
    // 날짜 비교 (시간 제외)
    const holidayDateStr = formatDate(holidayDate);
    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(weekEnd);
    
    // 문자열 비교로 날짜 범위 확인 (평일만)
    return holidayDateStr >= weekStartStr && holidayDateStr <= weekEndStr;
  });
}

/**
 * 특정 날짜가 공휴일인지 확인
 * @param {Date|string} date - 확인할 날짜 (KST)
 * @param {Array} holidays - 공휴일 배열 [{date: string|Date, name: string}]
 * @returns {boolean} 공휴일 여부
 */
function isHoliday(date, holidays) {
  if (!holidays || holidays.length === 0) return false;
  
  const targetDate = date instanceof Date ? date : parseKSTDate(date);
  const targetDateStr = formatDate(targetDate);
  
  return holidays.some(h => {
    const holidayDate = h.date instanceof Date ? h.date : parseKSTDate(h.date);
    const holidayDateStr = formatDate(holidayDate);
    return holidayDateStr === targetDateStr;
  });
}

// ===========================
// 날짜 비교 함수
// ===========================

/**
 * 두 날짜가 같은 주인지 확인
 * @param {Date|string} date1 - 첫 번째 날짜 (KST)
 * @param {Date|string} date2 - 두 번째 날짜 (KST)
 * @returns {boolean} 같은 주 여부
 */
function isSameWeek(date1, date2) {
  const weekStart1 = getWeekStartDate(date1);
  const weekStart2 = getWeekStartDate(date2);
  
  return formatDate(weekStart1) === formatDate(weekStart2);
}

/**
 * 수습 기간 여부 확인
 * @param {Date|string} hireDate - 입사일 (KST)
 * @param {Date|string} targetDate - 확인할 날짜 (KST, 기본값: 오늘)
 * @returns {boolean} 수습 기간 여부 (입사 후 3개월 미만)
 */
function isProbationPeriod(hireDate, targetDate = new Date()) {
  if (!hireDate) return false;
  
  const hire = parseKSTDate(hireDate);
  const target = targetDate instanceof Date ? targetDate : parseKSTDate(targetDate);
  
  // 3개월 후 날짜 계산
  const threeMonthsLater = new Date(hire);
  threeMonthsLater.setMonth(hire.getMonth() + 3);
  
  return target < threeMonthsLater;
}

// ===========================
// 사이클 정보 계산 함수
// ===========================

/**
 * 사이클 정보 계산 (공휴일 주 제외)
 * @param {Object} workDays - work_days JSON 객체
 * @param {Date|string} targetDate - 계산 대상 날짜 (KST, 기본값: 오늘)
 * @param {Array} holidays - 공휴일 배열 [{date: string|Date, name: string}] (선택)
 * @returns {Object} 사이클 정보
 */
function calculateCycleInfo(workDays, targetDate = new Date(), holidays = []) {
  if (!workDays || !workDays.cycle_start_date || !workDays.base_off_day) {
    return null;
  }
  
  const cycleStart = parseKSTDate(workDays.cycle_start_date);
  const target = targetDate instanceof Date ? targetDate : parseKSTDate(targetDate);
  
  // 주 시작일 기준으로 계산
  const weekStart = getWeekStartDate(target);
  
  // 사이클 번호 및 주차 계산 (공휴일 주 제외)
  const cycleNumber = getCycleNumber(cycleStart, weekStart, holidays);
  const cycleWeek = getCycleWeek(cycleStart, weekStart, holidays);
  
  // 현재 휴무일 계산 (공휴일 주 제외)
  const currentOffDay = calculateOffDayByWeekCycle(cycleStart, weekStart, workDays.base_off_day, holidays);
  
  // 다음 사이클 시작일 계산
  // 다음 사이클은 (cycleNumber + 1) 사이클의 1주차가 되는 주
  // 현재 주에서 시작해서 주를 하나씩 증가시키면서 다음 사이클 번호의 1주차를 찾기
  let nextCycleStart = new Date(weekStart);
  let currentWeekForNext = new Date(weekStart);
  const targetCycleNumber = cycleNumber + 1;
  
  // 최대 20주까지만 검색 (무한 루프 방지)
  let searchCount = 0;
  while (searchCount < 20) {
    // 다음 주로 이동
    currentWeekForNext = new Date(currentWeekForNext);
    currentWeekForNext.setDate(currentWeekForNext.getDate() + 7);
    
    // 다음 사이클 번호와 주차 계산
    const nextCycleNum = getCycleNumber(cycleStart, currentWeekForNext, holidays);
    const nextCycleWk = getCycleWeek(cycleStart, currentWeekForNext, holidays);
    
    // 다음 사이클 번호의 1주차를 찾으면 종료
    if (nextCycleNum === targetCycleNumber && nextCycleWk === 1) {
      nextCycleStart = new Date(currentWeekForNext);
      break;
    }
    
    searchCount++;
  }
  
  // 디버깅: 다음 사이클 시작일 확인
  console.log(`[calculateCycleInfo] 현재 사이클: ${cycleNumber}, 주차: ${cycleWeek}`);
  console.log(`[calculateCycleInfo] 다음 사이클 시작일: ${formatDate(nextCycleStart)}`);
  
  // 다음 사이클의 휴무일 계산
  const nextOffDay = calculateOffDayByWeekCycle(cycleStart, nextCycleStart, workDays.base_off_day, holidays);
  
  // 디버깅: 다음 사이클 휴무일 확인
  const nextCycleNumber = getCycleNumber(cycleStart, nextCycleStart, holidays);
  console.log(`[calculateCycleInfo] 다음 사이클 번호: ${nextCycleNumber}, 휴무일: ${nextOffDay} (${getDayName(nextOffDay)})`);
  
  // 주차 범위 계산
  const weekRange = `${(cycleWeek - 1) * 7 + 1}-${cycleWeek * 7}주차`;
  
  return {
    cycleNumber,
    cycleWeek,
    weekRange,
    currentOffDay,
    currentOffDayName: getDayName(currentOffDay),
    cycleStartDate: formatDate(cycleStart),
    nextCycleDate: formatDate(nextCycleStart),
    nextOffDay,
    nextOffDayName: getDayName(nextOffDay)
  };
}

// ===========================
// 반차 검증 함수
// ===========================

/**
 * 반차 신청 검증
 * @param {Date|string} applyDate - 신청 날짜 (KST)
 * @param {Object} userWorkDays - 사용자 work_days 정보
 * @param {Array} holidays - 공휴일 배열
 * @returns {Object} {valid: boolean, message: string, code: string}
 */
function validateHalfDay(applyDate, userWorkDays, holidays) {
  const apply = parseKSTDate(applyDate);
  
  // 1. 공휴일인지 확인
  if (isHoliday(apply, holidays)) {
    return {
      valid: false,
      message: '공휴일에는 반차를 사용할 수 없습니다.',
      code: 'HOLIDAY_NOT_ALLOWED'
    };
  }
  
  // 2. 주 시작일 기준으로 휴무일 계산 (공휴일 주 제외)
  const weekStart = getWeekStartDate(apply);
  const offDay = calculateOffDayByWeekCycle(
    userWorkDays.cycle_start_date,
    weekStart,
    userWorkDays.base_off_day,
    holidays
  );
  
  // 3. 휴무일 확인 (휴무일에 반차 사용 허용)
  // 휴무일에 반차를 사용하는 것은 허용됩니다.
  // 예: 화요일 휴무자가 화요일에 반차 사용 = 화요일 4시간 근무
  // 같은 주 다른 날에도 반차를 사용하여 총 32시간을 맞춥니다.
  const applyDayOfWeek = apply.getDay();
  const isOffDay = applyDayOfWeek >= 1 && applyDayOfWeek <= 5 && applyDayOfWeek === offDay;
  
  // 4. 공휴일 포함 주 확인 (공휴일 포함 주에도 반차 사용 허용)
  // 공휴일 포함 주는 주 4일 근무가 해제되지만, 반차 사용은 가능합니다.
  const isHolidayWeek = hasHolidayInWeek(weekStart, holidays);
  
  // 5. 같은 주인지 확인 (휴무일과 같은 주에만 사용 가능)
  // 휴무일과 같은 주에만 반차 사용 가능
  // apply는 이미 weekStart와 같은 주에 있으므로, 추가 체크 불필요
  // 단, 반차는 휴무일을 분할 사용하는 개념이므로 같은 주 내에서만 사용 가능
  
  // 안내 메시지 생성
  let message = '검증 통과';
  const messages = [];
  
  if (isOffDay) {
    messages.push('휴무일에 반차를 사용합니다.');
  }
  
  if (isHolidayWeek) {
    messages.push('공휴일 포함 주입니다. 주 4일 근무가 해제되지만 반차 사용은 가능합니다.');
  }
  
  if (isOffDay && !isHolidayWeek) {
    messages.push('같은 주 다른 날에도 반차를 사용하여 총 32시간을 맞춰주세요.');
  }
  
  if (messages.length > 0) {
    message = messages.join(' ');
  }
  
  return {
    valid: true,
    message: message,
    code: 'VALID',
    isOffDay: isOffDay, // 휴무일 반차 사용 여부
    isHolidayWeek: isHolidayWeek // 공휴일 포함 주 여부
  };
}

// ===========================
// 일시적 변경 검증 함수
// ===========================

/**
 * 일시적 휴무일 변경 검증
 * @param {Date|string} weekStartDate - 변경할 주의 시작일 (월요일, KST)
 * @param {number} temporaryOffDay - 임시 휴무일 (1-5)
 * @param {Object} userWorkDays - 사용자 work_days 정보
 * @param {Array} holidays - 공휴일 배열
 * @returns {Object} {valid: boolean, message: string, code: string}
 */
function validateTemporaryChange(weekStartDate, temporaryOffDay, userWorkDays, holidays) {
  const weekStart = parseKSTDate(weekStartDate);
  
  // 1. 공휴일 포함 주인지 확인 (먼저 체크)
  if (hasHolidayInWeek(weekStart, holidays)) {
    return {
      valid: false,
      message: '공휴일이 포함된 주에는 일시적 변경을 할 수 없습니다.',
      code: 'HOLIDAY_WEEK_NOT_ALLOWED'
    };
  }
  
  // 2. 원래 휴무일 계산 (공휴일 주 제외)
  const originalOffDay = calculateOffDayByWeekCycle(
    userWorkDays.cycle_start_date,
    weekStart,
    userWorkDays.base_off_day,
    holidays
  );
  
  // 3. 원래 휴무일과 동일한지 확인
  if (temporaryOffDay === originalOffDay) {
    return {
      valid: false,
      message: '원래 휴무일과 동일한 날짜로 변경할 수 없습니다.',
      code: 'SAME_OFF_DAY'
    };
  }
  
  // 4. 임시 휴무일이 유효한 범위인지 확인
  if (temporaryOffDay < 1 || temporaryOffDay > 5) {
    return {
      valid: false,
      message: '유효하지 않은 휴무일입니다. (1=월, 2=화, 3=수, 4=목, 5=금)',
      code: 'INVALID_OFF_DAY'
    };
  }
  
  return {
    valid: true,
    message: '검증 통과',
    code: 'VALID'
  };
}

// ===========================
// 모듈 내보내기
// ===========================

module.exports = {
  // 타임존 헬퍼
  createKSTDate,
  parseKSTDate,
  formatDate,
  getWeekStartDate,
  getWeekEndDate,
  
  // 사이클 계산
  getCycleNumber,
  getCycleWeek,
  calculateOffDayByWeekCycle,
  getDayName,
  calculateCycleInfo,
  
  // 공휴일 처리
  hasHolidayInWeek,
  isHoliday,
  
  // 날짜 비교
  isSameWeek,
  isProbationPeriod,
  
  // 검증
  validateHalfDay,
  validateTemporaryChange
};

