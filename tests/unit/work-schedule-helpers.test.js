/**
 * 주 4일 근무제 헬퍼 함수 단위 테스트
 * 
 * 테스트 항목:
 * - 타임존 처리 함수
 * - 4주 사이클 계산 함수
 * - 휴무일 계산 함수
 * - 공휴일 포함 주 체크 함수
 * - 반차 검증 함수
 * - 일시적 변경 검증 함수
 */

const {
  formatDate,
  getWeekStartDate,
  getCycleNumber,
  getCycleWeek,
  calculateOffDayByWeekCycle,
  getDayName,
  hasHolidayInWeek,
  isHoliday,
  isSameWeek,
  isProbationPeriod,
  validateHalfDay,
  validateTemporaryChange,
  calculateCycleInfo
} = require('../../routes/staff/work-schedule-helpers');

describe('주 4일 근무제 헬퍼 함수 테스트', () => {
  
  // ===========================
  // 타임존 헬퍼 함수 테스트
  // ===========================
  
  describe('formatDate', () => {
    test('Date 객체를 YYYY-MM-DD 형식으로 변환', () => {
      const date = new Date(2025, 11, 25); // 2025년 12월 25일
      expect(formatDate(date)).toBe('2025-12-25');
    });
    
    test('날짜 문자열을 YYYY-MM-DD 형식으로 변환', () => {
      expect(formatDate('2025-12-25')).toBe('2025-12-25');
    });
  });
  
  describe('getWeekStartDate', () => {
    test('월요일이 주 시작일인지 확인', () => {
      const monday = new Date(2025, 11, 1); // 2025년 12월 1일 (월요일)
      const weekStart = getWeekStartDate(monday);
      expect(weekStart.getDay()).toBe(1); // 월요일
    });
    
    test('일요일에서 월요일로 변환', () => {
      const sunday = new Date(2025, 11, 7); // 2025년 12월 7일 (일요일)
      const weekStart = getWeekStartDate(sunday);
      expect(weekStart.getDay()).toBe(1); // 월요일
    });
    
    test('금요일에서 같은 주 월요일로 변환', () => {
      const friday = new Date(2025, 11, 5); // 2025년 12월 5일 (금요일)
      const weekStart = getWeekStartDate(friday);
      expect(weekStart.getDay()).toBe(1); // 월요일
      expect(formatDate(weekStart)).toBe('2025-12-01'); // 같은 주 월요일
    });
  });
  
  // ===========================
  // 4주 사이클 계산 테스트
  // ===========================
  
  describe('getCycleNumber', () => {
    test('사이클 시작일과 같은 날은 사이클 0', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-01-06';
      expect(getCycleNumber(cycleStart, targetDate)).toBe(0);
    });
    
    test('28일 후는 사이클 1', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-02-03'; // 28일 후
      expect(getCycleNumber(cycleStart, targetDate)).toBe(1);
    });
    
    test('56일 후는 사이클 2', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-03-03'; // 56일 후
      expect(getCycleNumber(cycleStart, targetDate)).toBe(2);
    });
  });
  
  describe('getCycleWeek', () => {
    test('사이클 시작일은 1주차', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-01-06';
      expect(getCycleWeek(cycleStart, targetDate)).toBe(1);
    });
    
    test('7일 후는 2주차', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-01-13'; // 7일 후
      expect(getCycleWeek(cycleStart, targetDate)).toBe(2);
    });
    
    test('21일 후는 4주차', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-01-27'; // 21일 후
      expect(getCycleWeek(cycleStart, targetDate)).toBe(4);
    });
  });
  
  describe('calculateOffDayByWeekCycle', () => {
    test('사이클 0 (1-4주): 금요일 휴무', () => {
      const cycleStart = '2025-01-06'; // 월요일
      const targetDate = '2025-01-06'; // 같은 날
      const baseOffDay = 5; // 금요일
      const weekStart = getWeekStartDate(targetDate);
      const offDay = calculateOffDayByWeekCycle(cycleStart, weekStart, baseOffDay);
      expect(offDay).toBe(5); // 금요일
    });
    
    test('사이클 1 (5-8주): 목요일 휴무', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-02-03'; // 28일 후 (사이클 1)
      const baseOffDay = 5; // 금요일
      const weekStart = getWeekStartDate(targetDate);
      const offDay = calculateOffDayByWeekCycle(cycleStart, weekStart, baseOffDay);
      expect(offDay).toBe(4); // 목요일
    });
    
    test('사이클 2 (9-12주): 수요일 휴무', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-03-03'; // 56일 후 (사이클 2)
      const baseOffDay = 5; // 금요일
      const weekStart = getWeekStartDate(targetDate);
      const offDay = calculateOffDayByWeekCycle(cycleStart, weekStart, baseOffDay);
      expect(offDay).toBe(3); // 수요일
    });
    
    test('사이클 3 (13-16주): 화요일 휴무', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-03-31'; // 84일 후 (사이클 3)
      const baseOffDay = 5; // 금요일
      const weekStart = getWeekStartDate(targetDate);
      const offDay = calculateOffDayByWeekCycle(cycleStart, weekStart, baseOffDay);
      expect(offDay).toBe(2); // 화요일
    });
    
    test('사이클 4 (17-20주): 월요일 휴무', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-04-28'; // 112일 후 (사이클 4)
      const baseOffDay = 5; // 금요일
      const weekStart = getWeekStartDate(targetDate);
      const offDay = calculateOffDayByWeekCycle(cycleStart, weekStart, baseOffDay);
      expect(offDay).toBe(1); // 월요일
    });
    
    test('사이클 5 (21-24주): 금요일 휴무 (순환 복귀)', () => {
      const cycleStart = '2025-01-06';
      const targetDate = '2025-05-26'; // 140일 후 (사이클 5)
      const baseOffDay = 5; // 금요일
      const weekStart = getWeekStartDate(targetDate);
      const offDay = calculateOffDayByWeekCycle(cycleStart, weekStart, baseOffDay);
      expect(offDay).toBe(5); // 금요일 (순환 복귀)
    });
  });
  
  describe('getDayName', () => {
    test('요일 번호를 한글 요일명으로 변환', () => {
      expect(getDayName(1)).toBe('월요일');
      expect(getDayName(2)).toBe('화요일');
      expect(getDayName(3)).toBe('수요일');
      expect(getDayName(4)).toBe('목요일');
      expect(getDayName(5)).toBe('금요일');
    });
  });
  
  // ===========================
  // 공휴일 처리 테스트
  // ===========================
  
  describe('hasHolidayInWeek', () => {
    test('공휴일이 포함된 주 확인', () => {
      const weekStart = '2025-12-22'; // 2025년 12월 22일 (월요일)
      const holidays = [
        { date: '2025-12-25', name: '크리스마스' }
      ];
      expect(hasHolidayInWeek(weekStart, holidays)).toBe(true);
    });
    
    test('공휴일이 없는 주 확인', () => {
      const weekStart = '2025-12-01'; // 2025년 12월 1일 (월요일)
      const holidays = [
        { date: '2025-12-25', name: '크리스마스' }
      ];
      expect(hasHolidayInWeek(weekStart, holidays)).toBe(false);
    });
  });
  
  describe('isHoliday', () => {
    test('공휴일인 날짜 확인', () => {
      const date = '2025-12-25';
      const holidays = [
        { date: '2025-12-25', name: '크리스마스' }
      ];
      expect(isHoliday(date, holidays)).toBe(true);
    });
    
    test('공휴일이 아닌 날짜 확인', () => {
      const date = '2025-12-24';
      const holidays = [
        { date: '2025-12-25', name: '크리스마스' }
      ];
      expect(isHoliday(date, holidays)).toBe(false);
    });
  });
  
  // ===========================
  // 날짜 비교 테스트
  // ===========================
  
  describe('isSameWeek', () => {
    test('같은 주의 날짜 확인', () => {
      const date1 = '2025-12-22'; // 월요일
      const date2 = '2025-12-25'; // 목요일 (같은 주)
      expect(isSameWeek(date1, date2)).toBe(true);
    });
    
    test('다른 주의 날짜 확인', () => {
      const date1 = '2025-12-22'; // 월요일
      const date2 = '2025-12-29'; // 다음 주 월요일
      expect(isSameWeek(date1, date2)).toBe(false);
    });
  });
  
  describe('isProbationPeriod', () => {
    test('수습 기간 중 확인 (입사 후 2개월)', () => {
      const hireDate = '2025-10-15';
      const targetDate = '2025-12-15'; // 입사 후 2개월
      expect(isProbationPeriod(hireDate, targetDate)).toBe(true);
    });
    
    test('수습 기간 종료 확인 (입사 후 4개월)', () => {
      const hireDate = '2025-08-15';
      const targetDate = '2025-12-15'; // 입사 후 4개월
      expect(isProbationPeriod(hireDate, targetDate)).toBe(false);
    });
  });
  
  // ===========================
  // 반차 검증 테스트
  // ===========================
  
  describe('validateHalfDay', () => {
    const userWorkDays = {
      base_off_day: 5, // 금요일
      cycle_start_date: '2025-01-06'
    };
    
    test('공휴일에 반차 신청 불가', () => {
      const applyDate = '2025-12-25'; // 크리스마스
      const holidays = [
        { date: '2025-12-25', name: '크리스마스' }
      ];
      const result = validateHalfDay(applyDate, userWorkDays, holidays);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('HOLIDAY_NOT_ALLOWED');
    });
    
    test('휴무일에 반차 신청 불가', () => {
      const applyDate = '2025-12-05'; // 금요일 (휴무일)
      const holidays = [];
      const result = validateHalfDay(applyDate, userWorkDays, holidays);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('OFF_DAY_NOT_ALLOWED');
    });
    
    test('공휴일 포함 주에 반차 신청 불가', () => {
      const applyDate = '2025-12-23'; // 화요일
      const holidays = [
        { date: '2025-12-25', name: '크리스마스' } // 같은 주에 공휴일
      ];
      const result = validateHalfDay(applyDate, userWorkDays, holidays);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('HOLIDAY_WEEK_NOT_ALLOWED');
    });
    
    test('같은 주 내 반차 신청 가능', () => {
      const applyDate = '2025-12-02'; // 화요일
      const holidays = [];
      const result = validateHalfDay(applyDate, userWorkDays, holidays);
      expect(result.valid).toBe(true);
    });
  });
  
  // ===========================
  // 일시적 변경 검증 테스트
  // ===========================
  
  describe('validateTemporaryChange', () => {
    const userWorkDays = {
      base_off_day: 5, // 금요일
      cycle_start_date: '2025-01-06'
    };
    
    test('원래 휴무일과 동일한 날짜로 변경 불가', () => {
      const weekStartDate = '2025-12-01'; // 월요일
      const temporaryOffDay = 5; // 금요일 (원래 휴무일)
      const holidays = [];
      const result = validateTemporaryChange(weekStartDate, temporaryOffDay, userWorkDays, holidays);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('SAME_OFF_DAY');
    });
    
    test('공휴일 포함 주에 변경 불가', () => {
      const weekStartDate = '2025-12-22'; // 월요일
      const temporaryOffDay = 3; // 수요일
      const holidays = [
        { date: '2025-12-25', name: '크리스마스' } // 같은 주에 공휴일
      ];
      const result = validateTemporaryChange(weekStartDate, temporaryOffDay, userWorkDays, holidays);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('HOLIDAY_WEEK_NOT_ALLOWED');
    });
    
    test('정상적인 일시적 변경 가능', () => {
      const weekStartDate = '2025-12-01'; // 월요일
      const temporaryOffDay = 3; // 수요일
      const holidays = [];
      const result = validateTemporaryChange(weekStartDate, temporaryOffDay, userWorkDays, holidays);
      expect(result.valid).toBe(true);
    });
  });
  
  // ===========================
  // 사이클 정보 계산 테스트
  // ===========================
  
  describe('calculateCycleInfo', () => {
    test('사이클 정보 정확성 확인', () => {
      const workDays = {
        base_off_day: 5, // 금요일
        cycle_start_date: '2025-01-06'
      };
      const targetDate = '2025-12-01';
      
      const cycleInfo = calculateCycleInfo(workDays, targetDate);
      
      expect(cycleInfo).not.toBeNull();
      expect(cycleInfo.currentOffDay).toBeGreaterThanOrEqual(1);
      expect(cycleInfo.currentOffDay).toBeLessThanOrEqual(5);
      expect(cycleInfo.currentOffDayName).toBeTruthy();
      expect(cycleInfo.weekRange).toMatch(/\d+-\d+주차/);
    });
  });
});

