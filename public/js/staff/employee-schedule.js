/**
 * ================================================================
 * 주 4일 근무제 스케줄 페이지 JavaScript
 * ================================================================
 * 
 * 주요 기능:
 * - 서버 API를 통한 스케줄 조회
 * - 캘린더 렌더링 (서버에서 계산한 daily_schedule 사용)
 * - 반차 신청
 * - 일시적 휴무일 변경 신청
 * 
 * 타임존 규칙:
 * - 프론트엔드에서 날짜 계산 금지
 * - 서버에서 계산한 daily_schedule 데이터만 사용
 * 
 * 참고 문서:
 * - docs/staff/주4일-근무제-기획서.md
 * - docs/staff/주4일-API-스펙.md
 * - docs/staff/주4일-프론트엔드-구현-가이드.md
 * 
 * Created: 2025-12-28
 * Version: 1.0.0
 * ================================================================
 */

// 전역 변수
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let currentScheduleData = null;

// 요일명 배열
const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
const dayNamesFull = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// ===========================
// 페이지 초기화
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('주4일 근무제 스케줄 페이지가 로드되었습니다.');
    
    // 현재 날짜로 초기화
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth() + 1;
    
    // 연도 선택 옵션 생성
    initializeYearSelect();
    
    // 월 선택 초기화
    document.getElementById('monthSelect').value = currentMonth;
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 스케줄 로드
    await loadSchedule();
});

// ===========================
// 연도 선택 초기화
// ===========================

function initializeYearSelect() {
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();
    
    // 현재 연도 기준 ±2년 범위
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
}

// ===========================
// 이벤트 리스너 설정
// ===========================

function setupEventListeners() {
    // 이전/다음 월 버튼
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        changeMonth(-1);
    });
    
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        changeMonth(1);
    });
    
    // 오늘 버튼
    document.getElementById('todayBtn').addEventListener('click', () => {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth() + 1;
        document.getElementById('yearSelect').value = currentYear;
        document.getElementById('monthSelect').value = currentMonth;
        loadSchedule();
    });
    
    // 연도/월 선택 변경
    document.getElementById('yearSelect').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value, 10);
        loadSchedule();
    });
    
    document.getElementById('monthSelect').addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value, 10);
        loadSchedule();
    });
    
    // 반차 신청 버튼
    document.getElementById('halfDayBtn').addEventListener('click', () => {
        openHalfDayModal();
    });
    
    // 일시적 변경 버튼
    document.getElementById('temporaryChangeBtn').addEventListener('click', () => {
        openTemporaryChangeModal();
    });
    
    // 반차 신청 제출
    document.getElementById('submitHalfDayBtn').addEventListener('click', () => {
        submitHalfDay();
    });
    
    // 일시적 변경 제출
    document.getElementById('submitTemporaryChangeBtn').addEventListener('click', () => {
        submitTemporaryChange();
    });
}

// ===========================
// 월 변경
// ===========================

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    } else if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    
    document.getElementById('yearSelect').value = currentYear;
    document.getElementById('monthSelect').value = currentMonth;
    loadSchedule();
}

// ===========================
// 스케줄 로드
// ===========================

async function loadSchedule() {
    try {
        showLoading();
        
        // API 호출
        const response = await fetch(`/api/staff/work-schedules/my-schedule/${currentYear}/${currentMonth}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || '스케줄 조회에 실패했습니다.');
        }
        
        currentScheduleData = result.data;
        
        // UI 업데이트
        updateScheduleDisplay();
        generateCalendar();
        
        hideLoading();
        
    } catch (error) {
        console.error('스케줄 로드 오류:', error);
        alert('스케줄을 불러오는 중 오류가 발생했습니다: ' + error.message);
        hideLoading();
    }
}

// ===========================
// 스케줄 정보 표시 업데이트
// ===========================

function updateScheduleDisplay() {
    if (!currentScheduleData) return;
    
    const data = currentScheduleData;
    const workDays = data.user.work_days;
    const cycle = data.current_cycle;
    
    // 기본 휴무일 표시
    const baseOffDayElement = document.getElementById('baseOffDayDisplay');
    if (baseOffDayElement) {
        const baseOffDayName = getDayNameFromNumber(workDays.base_off_day);
        baseOffDayElement.textContent = baseOffDayName;
    }
    
    // 사이클 정보 배지
    const cycleInfoBadgeElement = document.getElementById('cycleInfoBadge');
    if (cycleInfoBadgeElement) {
        const cycleInfoText = `${cycle.week_range} | ${cycle.off_day_name} 휴무`;
        cycleInfoBadgeElement.textContent = cycleInfoText;
    }
    
    // 이번 달 근무 패턴
    const currentPatternElement = document.getElementById('currentPatternDisplay');
    if (currentPatternElement) {
        currentPatternElement.textContent = `휴무일: ${cycle.off_day_name}`;
    }
    
    // 다음 사이클 정보
    const nextCycleElement = document.getElementById('nextCycleDisplay');
    if (nextCycleElement) {
        nextCycleElement.textContent = 
            `${formatDateDisplay(cycle.next_cycle_date)}부터 ${cycle.next_off_day_name} 휴무`;
    }
    
    // 월 표시
    const currentMonthElement = document.getElementById('currentMonthDisplay');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${currentYear}년 ${currentMonth}월`;
    }
    
    // 수습 기간 알림
    const probationNotice = document.getElementById('probationNotice');
    if (probationNotice) {
        if (data.is_probation) {
            probationNotice.style.display = 'block';
        } else {
            probationNotice.style.display = 'none';
        }
    }
    
    // 공휴일 포함 주 알림
    const holidayNotice = document.getElementById('holidayNotice');
    if (holidayNotice) {
        if (data.has_holiday_in_week) {
            holidayNotice.style.display = 'block';
        } else {
            holidayNotice.style.display = 'none';
        }
    }
}

// ===========================
// 캘린더 생성
// ===========================

function generateCalendar() {
    if (!currentScheduleData || !currentScheduleData.daily_schedule) {
        console.warn('daily_schedule 데이터가 없습니다.');
        return;
    }
    
    const container = document.getElementById('calendarContainer');
    container.innerHTML = '';
    
    // daily_schedule을 Map으로 변환 (빠른 조회)
    const scheduleMap = new Map(
        currentScheduleData.daily_schedule.map(item => [item.date, item])
    );
    
    // 요일 헤더 생성
    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-grid';
    dayNames.forEach(dayName => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = dayName;
        headerRow.appendChild(header);
    });
    container.appendChild(headerRow);
    
    // 첫 날의 요일 계산
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    // 마지막 날
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    
    // 캘린더 그리드 생성
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // 첫 주의 빈 칸
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendarGrid.appendChild(emptyDay);
    }
    
    // 각 날짜 생성
    const today = new Date();
    const todayStr = formatDateString(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    for (let day = 1; day <= lastDay; day++) {
        const dateStr = formatDateString(currentYear, currentMonth, day);
        const daySchedule = scheduleMap.get(dateStr);
        
        const dayElement = createDayElement(day, dateStr, daySchedule, todayStr);
        calendarGrid.appendChild(dayElement);
    }
    
    container.appendChild(calendarGrid);
}

// ===========================
// 날짜 요소 생성
// ===========================

function createDayElement(day, dateStr, daySchedule, todayStr) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // 날짜 번호
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // 오늘인지 확인
    if (dateStr === todayStr) {
        dayElement.classList.add('today');
    }
    
    // 스케줄 정보가 없으면 주말 처리
    if (!daySchedule) {
        const date = new Date(currentYear, currentMonth - 1, day);
        const dayOfWeek = date.getDay();
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayElement.classList.add('weekend');
        }
        return dayElement;
    }
    
    // 서버에서 계산한 스케줄 정보 사용
    if (daySchedule.is_holiday) {
        // 공휴일
        dayElement.classList.add('holiday');
        const status = document.createElement('div');
        status.className = 'day-status holiday';
        status.textContent = '공휴일';
        dayElement.appendChild(status);
        
        // 공휴일명 표시
        const holiday = currentScheduleData.holidays.find(h => h.date === dateStr);
        if (holiday) {
            const info = document.createElement('div');
            info.className = 'day-info';
            info.textContent = holiday.name;
            dayElement.appendChild(info);
        }
    } else if (daySchedule.has_half_day) {
        // 반차
        if (daySchedule.half_day_type === 'HALF_AM') {
            dayElement.classList.add('half-morning');
            const status = document.createElement('div');
            status.className = 'day-status half';
            status.textContent = '오전반차';
            dayElement.appendChild(status);
        } else {
            dayElement.classList.add('half-afternoon');
            const status = document.createElement('div');
            status.className = 'day-status half';
            status.textContent = '오후반차';
            dayElement.appendChild(status);
        }
    } else if (daySchedule.is_off_day) {
        // 휴무일
        dayElement.classList.add('off');
        const status = document.createElement('div');
        status.className = 'day-status off';
        status.textContent = '휴무일';
        dayElement.appendChild(status);
    } else {
        // 근무일
        dayElement.classList.add('work');
        const status = document.createElement('div');
        status.className = 'day-status work';
        status.textContent = '근무일';
        dayElement.appendChild(status);
    }
    
    return dayElement;
}

// ===========================
// 반차 신청 모달 열기
// ===========================

function openHalfDayModal() {
    if (!currentScheduleData) {
        alert('스케줄 정보를 먼저 불러와주세요.');
        return;
    }
    
    // 수습 기간 확인
    if (currentScheduleData.is_probation) {
        alert('수습 기간 중에는 반차를 사용할 수 없습니다.');
        return;
    }
    
    // 모달 초기화
    document.getElementById('halfDayDate').value = '';
    document.getElementById('halfDayType').value = '';
    document.getElementById('halfDayReason').value = '';
    document.getElementById('halfDayValidation').style.display = 'none';
    
    // 모달 열기
    const modal = new bootstrap.Modal(document.getElementById('halfDayModal'));
    modal.show();
}

// ===========================
// 반차 신청 제출
// ===========================

async function submitHalfDay() {
    const date = document.getElementById('halfDayDate').value;
    const leaveType = document.getElementById('halfDayType').value;
    const reason = document.getElementById('halfDayReason').value.trim();
    
    // 기본 검증
    if (!date || !leaveType || !reason) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch('/api/staff/work-schedules/apply-half-day', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: date,
                leave_type: leaveType,
                reason: reason
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            // 검증 오류 메시지 표시
            const validationDiv = document.getElementById('halfDayValidation');
            const validationMessage = document.getElementById('halfDayValidationMessage');
            validationMessage.textContent = result.message;
            validationDiv.style.display = 'block';
            hideLoading();
            return;
        }
        
        // 성공
        alert('반차 신청이 완료되었습니다.');
        bootstrap.Modal.getInstance(document.getElementById('halfDayModal')).hide();
        
        // 스케줄 다시 로드
        await loadSchedule();
        
        hideLoading();
        
    } catch (error) {
        console.error('반차 신청 오류:', error);
        alert('반차 신청 중 오류가 발생했습니다: ' + error.message);
        hideLoading();
    }
}

// ===========================
// 일시적 변경 모달 열기
// ===========================

function openTemporaryChangeModal() {
    if (!currentScheduleData) {
        alert('스케줄 정보를 먼저 불러와주세요.');
        return;
    }
    
    // 수습 기간 확인
    if (currentScheduleData.is_probation) {
        alert('수습 기간 중에는 일시적 변경을 할 수 없습니다.');
        return;
    }
    
    // 현재 주의 월요일 계산 (오늘 기준)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    
    // 모달 초기화
    document.getElementById('weekStartDate').value = formatDateString(
        monday.getFullYear(),
        monday.getMonth() + 1,
        monday.getDate()
    );
    
    // 원래 휴무일 표시
    const cycle = currentScheduleData.current_cycle;
    document.getElementById('originalOffDay').value = cycle.off_day_name;
    
    document.getElementById('temporaryOffDay').value = '';
    document.getElementById('substituteEmployee').value = '';
    document.getElementById('temporaryChangeReason').value = '';
    
    // 모달 열기
    const modal = new bootstrap.Modal(document.getElementById('temporaryChangeModal'));
    modal.show();
}

// ===========================
// 일시적 변경 제출
// ===========================

async function submitTemporaryChange() {
    const weekStartDate = document.getElementById('weekStartDate').value;
    const temporaryOffDay = parseInt(document.getElementById('temporaryOffDay').value, 10);
    const substituteEmployee = document.getElementById('substituteEmployee').value.trim();
    const reason = document.getElementById('temporaryChangeReason').value.trim();
    
    // 기본 검증
    if (!weekStartDate || !temporaryOffDay || !reason) {
        alert('필수 필드를 모두 입력해주세요.');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch('/api/staff/work-schedules/temporary-change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                week_start_date: weekStartDate,
                temporary_off_day: temporaryOffDay,
                reason: reason,
                substitute_employee: substituteEmployee || null
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            alert(result.message || '일시적 변경 신청에 실패했습니다.');
            hideLoading();
            return;
        }
        
        // 성공
        alert('일시적 휴무일 변경 신청이 완료되었습니다.');
        bootstrap.Modal.getInstance(document.getElementById('temporaryChangeModal')).hide();
        
        // 스케줄 다시 로드
        await loadSchedule();
        
        hideLoading();
        
    } catch (error) {
        console.error('일시적 변경 신청 오류:', error);
        alert('일시적 변경 신청 중 오류가 발생했습니다: ' + error.message);
        hideLoading();
    }
}

// ===========================
// 유틸리티 함수
// ===========================

function formatDateString(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${year}년 ${parseInt(month, 10)}월 ${parseInt(day, 10)}일`;
}

function getDayNameFromNumber(dayNumber) {
    const dayNames = {
        1: '월요일',
        2: '화요일',
        3: '수요일',
        4: '목요일',
        5: '금요일'
    };
    return dayNames[dayNumber] || '알 수 없음';
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

