 // 현재 년, 월을 저장하는 변수
// 현재 년, 월을 저장하는 변수 (동적으로 설정)
const now = new Date();
let currentYear = now.getFullYear();
let currentMonth = now.getMonth() + 1; // getMonth()는 0부터 시작해서 +1 해줌


// 사용자 4일제 설정 상태 확인 (서버 통신)
async function checkUserScheduleStatus() {
  // 모킹 데이터 사용 시
  if (window.USE_MOCK_DATA) {
    console.log('모킹 데이터로 스케줄 로드');
    // 모킹 데이터는 이미 초기 선택 완료 상태로 가정
    loadPersonalSchedule();
    return;
  }
  
  try {
    const response = await fetch('/api/staff/work-schedules/my-status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('서버 응답:', data);
    
    if (response.ok && data.success) {
      if (data.data && data.data.initial_choice_completed) {
        // 이미 선택 완료 → 개인 스케줄 표시
        // my-status API는 기본 정보만 제공하므로, my-schedule API를 호출해야 함
        await loadPersonalSchedule();
      } else {
        // 아직 미선택 → 초기 선택 안내
        showInitialChoiceNeeded(data.data?.user);
      }
    } else {
      console.error('API 응답 오류:', data.message);
      window.sjTemplateLoader?.showToast(`오류: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('서버 통신 실패:', error);
    // 서버 오류 시 기본 동작
    loadPersonalSchedule();
  }
}

// 초기 선택 필요 안내
// 초기 선택 필요 안내 (수정)
function showInitialChoiceNeeded(userInfo = null) {
  const userName = userInfo?.name || window.sjTemplateLoader?.user?.name || '사용자';
  
  // 기존 컨텐츠 숨기기
  hideMainContent();
  
  // 초기 선택 화면 표시
  showInitialChoiceScreen(userName);
}

// 메인 컨텐츠 숨기기
function hideMainContent() {
  const scheduleHeader = document.querySelector('.schedule-header');
  const calendarSection = document.querySelector('.calendar-section');
  const shiftInfo = document.querySelector('.shift-info');
  
  if (scheduleHeader) scheduleHeader.style.display = 'none';
  if (calendarSection) calendarSection.style.display = 'none';
  if (shiftInfo) shiftInfo.style.display = 'none';
}

// 초기 선택 화면 표시
function showInitialChoiceScreen(userName) {
  const mainContent = document.querySelector('.main-content');
  
  const initialChoiceHTML = `
    <div class="initial-choice-container">
      <div class="choice-header">
        <h2>4일제 근무 시작을 위한 초기 설정</h2>
        <p class="choice-subtitle">안녕하세요 <strong>${userName}</strong>님! 원하시는 휴무일을 선택해주세요.</p>
        <div class="choice-info">
          <div class="info-item">
            <i class="fas fa-calendar-check"></i>
            <span>주 4일 근무 (32시간)</span>
          </div>
          <div class="info-item">
            <i class="fas fa-sync-alt"></i>
            <span>매월 시프트 순환</span>
          </div>
        </div>
      </div>
      
      <div class="day-selection">
        <div class="selection-title">희망 휴무일 선택</div>
        <div class="day-buttons">
          <button class="day-btn" data-day="1">
            <div class="day-name">월요일</div>
            <div class="day-desc">MON</div>
          </button>
          <button class="day-btn" data-day="2">
            <div class="day-name">화요일</div>
            <div class="day-desc">TUE</div>
          </button>
          <button class="day-btn" data-day="3">
            <div class="day-name">수요일</div>
            <div class="day-desc">WED</div>
          </button>
          <button class="day-btn" data-day="4">
            <div class="day-name">목요일</div>
            <div class="day-desc">THU</div>
          </button>
          <button class="day-btn" data-day="5">
            <div class="day-name">금요일</div>
            <div class="day-desc">FRI</div>
          </button>
        </div>
      </div>
      
      <div class="choice-actions">
        <button class="btn btn-primary btn-lg" id="confirmChoiceBtn" onclick="confirmInitialChoice()" disabled>
          <i class="fas fa-check"></i> 선택 완료
        </button>
      </div>
    </div>
  `;
  
  mainContent.innerHTML = initialChoiceHTML;
  
  // 선택 이벤트 바인딩
  bindDaySelection();
}

// 요일 선택 이벤트 바인딩
function bindDaySelection() {
  const dayButtons = document.querySelectorAll('.day-btn');
  const confirmBtn = document.getElementById('confirmChoiceBtn');
  
  dayButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // 기존 선택 해제
      dayButtons.forEach(b => b.classList.remove('selected'));
      
      // 현재 버튼 선택
      this.classList.add('selected');
      
      // 선택한 요일 저장
      window.selectedOffDay = this.dataset.day;
      
      // 확인 버튼 활성화
      confirmBtn.disabled = false;
    });
  });
}

// 초기 선택 확인
function confirmInitialChoice() {
  if (!window.selectedOffDay) {
    window.sjTemplateLoader.showToast('휴무일을 선택해주세요.', 'warning');
    return;
  }
  
  const dayNames = {1: '월요일', 2: '화요일', 3: '수요일', 4: '목요일', 5: '금요일'};
  const selectedDayName = dayNames[window.selectedOffDay];
  
  if (confirm(`${selectedDayName}을 휴무일로 설정하시겠습니까?\n\n설정 후에는 매월 시프트가 순환됩니다.`)) {
    // API 호출로 초기 설정 저장
    saveInitialChoice(window.selectedOffDay);
  }
}

// 초기 설정 저장 (API 호출)
async function saveInitialChoice(offDay) {
  try {
    // 로딩 상태 표시
    const confirmBtn = document.getElementById('confirmChoiceBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 설정 중...';
    confirmBtn.disabled = true;
    
    // work_days 객체 생성 (선택한 요일만 off, 나머지는 full)
    const workDays = {
      "1": offDay === 1 ? "off" : "full",
      "2": offDay === 2 ? "off" : "full", 
      "3": offDay === 3 ? "off" : "full",
      "4": offDay === 4 ? "off" : "full",
      "5": offDay === 5 ? "off" : "full"
    };
    
    const requestData = {
      off_day: parseInt(offDay),
      work_days: workDays
    };
    
    // 서버에 초기 설정 저장
    const response = await fetch('/api/staff/work-schedules/save-initial-choice', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      window.sjTemplateLoader?.showToast('초기 설정이 완료되었습니다!', 'success');
      
      // 메인 화면으로 돌아가기
      setTimeout(() => location.reload(), 1500);
      
    } else {
      const errorMessage = result.message || '설정 저장에 실패했습니다.';
      const errorCode = result.code || 'UNKNOWN_ERROR';
      
      // 에러 코드별 처리
      if (errorCode === 'PROBATION_PERIOD') {
        window.sjTemplateLoader?.showToast('수습 기간 중에는 4일제를 선택할 수 없습니다.', 'error');
      } else if (errorCode === 'DUPLICATE_REQUEST') {
        window.sjTemplateLoader?.showToast('이미 초기 선택이 완료되었습니다.', 'warning');
        setTimeout(() => location.reload(), 2000);
      } else {
        window.sjTemplateLoader?.showToast(`설정 저장 실패: ${errorMessage}`, 'error');
      }
      
      // 버튼 상태 복원
      confirmBtn.innerHTML = originalText;
      confirmBtn.disabled = false;
    }
    
  } catch (error) {
    console.error('초기 설정 저장 실패:', error);
    window.sjTemplateLoader?.showToast(`네트워크 오류: ${error.message}`, 'error');
    
    // 버튼 상태 복원
    const confirmBtn = document.getElementById('confirmChoiceBtn');
    if (confirmBtn) {
      confirmBtn.innerHTML = originalText;
      confirmBtn.disabled = false;
    }
  }
}

// 개인 스케줄 로드
// 모킹 데이터 또는 실제 데이터 사용
async function loadPersonalSchedule(scheduleData = null) {
  console.log('개인 스케줄 로드:', scheduleData);
  
  // 모킹 데이터 사용 여부 확인
  if (window.USE_MOCK_DATA && !scheduleData) {
    scheduleData = mockScheduleData.data;
    console.log('모킹 데이터 사용:', scheduleData);
  } else if (!scheduleData) {
    // 실제 API 호출
    try {
      const response = await fetch(`/api/staff/work-schedules/my-schedule/${currentYear}/${currentMonth}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        scheduleData = result.data;
        console.log('API에서 스케줄 로드:', scheduleData);
      } else {
        console.error('스케줄 조회 실패:', result.message);
        window.sjTemplateLoader?.showToast(`스케줄 조회 실패: ${result.message}`, 'error');
        return;
      }
    } catch (error) {
      console.error('스케줄 조회 중 오류:', error);
      window.sjTemplateLoader?.showToast('네트워크 오류가 발생했습니다.', 'error');
      return;
    }
  }
  
  if (scheduleData) {
    // 전역 변수에 스케줄 데이터 저장
    window.currentScheduleData = scheduleData;
    
    // 현재 날짜 기준으로 계산 (헤더 표시용)
    const today = new Date();
    const cycleInfo = calculateCycleInfo(scheduleData.user.work_days, today);
    
    // 현재 월의 휴무일로 패턴 업데이트
    if (cycleInfo && scheduleData.user.work_days) {
      const workDaysPattern = {};
      for (let i = 1; i <= 5; i++) {
        workDaysPattern[i] = (i === cycleInfo.currentOffDay) ? 'off' : 'full';
      }
      updateShiftPattern(workDaysPattern);
    } else {
      updateShiftPattern(scheduleData.schedule.work_days);
    }
    
    // UI 업데이트
    updateShiftDescription4Week(scheduleData, cycleInfo);
    updateScheduleHeader4Week(scheduleData, cycleInfo);
    
    // current_cycle 정보가 있으면 사용, 없으면 계산된 cycleInfo 사용
    const displayCycleInfo = scheduleData.current_cycle || cycleInfo;
    updateCycleInfo(displayCycleInfo);
    
    // 오늘 날짜 기준으로 수습 기간/공휴일 체크
    checkProbationPeriod(scheduleData.user.hire_date);
    checkHolidayInWeek(scheduleData.holidays, today);
    
    // 일시적 변경 버튼 활성화/비활성화
    updateTemporaryChangeButton(scheduleData);
  }
  
  // 스케줄 데이터가 있으면 캘린더 생성
  generateCalendar();
}

/**
 * 4주 주기 정보 계산
 */
function calculateCycleInfo(workDays, targetDate) {
  if (!workDays || !workDays.cycle_start_date || !workDays.base_off_day) {
    console.warn('calculateCycleInfo: workDays 정보가 없습니다.', workDays);
    return null;
  }
  
  const cycleStart = new Date(workDays.cycle_start_date);
  const currentOffDay = calculateOffDayByWeekCycle(cycleStart, targetDate, workDays.base_off_day);
  const cycleWeek = getCycleWeek(cycleStart, targetDate);
  
  // 주차 범위 계산 (예: "1-4주차", "5-8주차")
  // 전체 주기에서 몇 번째 4주 주기인지 계산
  const daysDiff = Math.floor((targetDate - cycleStart) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(daysDiff / 7) + 1;
  const cycleNumber = Math.floor((totalWeeks - 1) / 4); // 0부터 시작
  const weekStart = (cycleNumber * 4) + 1;
  const weekEnd = (cycleNumber + 1) * 4;
  const weekRange = `${weekStart}-${weekEnd}주차`;
  
  // 디버깅용 로그
  console.log('calculateCycleInfo:', {
    cycleStart: formatDate(cycleStart),
    targetDate: formatDate(targetDate),
    daysDiff,
    totalWeeks,
    cycleNumber,
    weekRange,
    currentOffDay,
    currentOffDayName: getDayName(currentOffDay)
  });
  
  // 다음 주기 계산 (4주 후)
  const nextCycleStart = new Date(cycleStart);
  nextCycleStart.setDate(nextCycleStart.getDate() + 28);
  const nextOffDay = calculateOffDayByWeekCycle(cycleStart, nextCycleStart, workDays.base_off_day);
  
  return {
    currentOffDay,
    currentOffDayName: getDayName(currentOffDay),
    cycleWeek,
    weekRange: weekRange,
    nextCycleDate: formatDate(nextCycleStart),
    nextOffDay,
    nextOffDayName: getDayName(nextOffDay)
  };
}
// 월 표시 업데이트 함수
async function updateMonthDisplay() {
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                     '7월', '8월', '9월', '10월', '11월', '12월'];
  
  const displayText = `${currentYear}년 ${monthNames[currentMonth - 1]}`;
  const monthElement = document.getElementById('currentMonth');
  if (monthElement) {
    monthElement.textContent = displayText;
  }
  
  // 해당 월의 스케줄 다시 로드
  if (!window.USE_MOCK_DATA) {
    await loadPersonalSchedule();
  } else {
    // 모킹 데이터 사용 시에는 캘린더만 다시 생성
    generateCalendar();
  }
}
 
 // 캘린더 생성 함수
// 캘린더 생성 함수 (수정)
// 캘린더 생성 함수 (실제 스케줄 반영)
function generateCalendar() {
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const startDayOfWeek = firstDay.getDay();
  const lastDay = new Date(currentYear, currentMonth, 0);
  const daysInMonth = lastDay.getDate();
  
  const calendarGrid = document.querySelector('.calendar-grid');
  const dayHeaders = calendarGrid.querySelectorAll('.calendar-day-header');
  calendarGrid.innerHTML = '';
  
  dayHeaders.forEach(header => {
    calendarGrid.appendChild(header);
  });
  
  // 첫 주 빈칸 채우기
  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day other-month';
    emptyDay.innerHTML = '<div class="day-number"></div>';
    calendarGrid.appendChild(emptyDay);
  }
  
  // 이번 달 날짜들 채우기 (실제 스케줄 적용)
  const today = new Date();
  const isCurrentMonth = (currentYear === today.getFullYear() && currentMonth === (today.getMonth() + 1));
  const todayDate = today.getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth - 1, day);
    const dayOfWeek = date.getDay(); // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
    
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // 오늘 날짜 하이라이트
    if (isCurrentMonth && day === todayDate) {
      dayElement.className += ' today';
    }
    
    // 스케줄 상태 결정
    let scheduleStatus = '';
    let scheduleText = '';
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 주말
      scheduleStatus = 'weekend';
      scheduleText = '';
    } else if (window.currentScheduleData && window.currentScheduleData.schedule) {
      // 평일 - 4주 주기로 휴무일 계산
      const workDays = window.currentScheduleData.user?.work_days;
      if (workDays) {
          const cycleStart = new Date(workDays.cycle_start_date);
          // 각 날짜마다 해당 날짜의 휴무일 계산
          const currentOffDay = calculateOffDayByWeekCycle(cycleStart, date, workDays.base_off_day);
          
          // 디버깅용 (특정 날짜만)
          if (day === 1 || day === 4 || day === 10) {
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            console.log(`캘린더 생성 - ${day}일(${dayNames[dayOfWeek]}):`, {
              date: formatDate(date),
              dayOfWeek,
              currentOffDay,
              dayName: getDayName(currentOffDay),
              cycleStart: formatDate(cycleStart)
            });
          }
          
          // 해당 날짜에 반차가 있는지 확인 (추후 구현)
          const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const halfDayData = window.currentScheduleData.half_day_list?.find(item => {
            const itemDate = item.start_date?.split('T')[0];
            return itemDate === dateString;
          });
          
          if (halfDayData) {
            // 반차가 있는 경우
            if (halfDayData.leave_type === 'HALF_AM') {
              scheduleStatus = 'half-morning';
              scheduleText = '<div class="day-status half"></div><div class="day-info half-info">오전반차</div>';
            } else {
              scheduleStatus = 'half-afternoon';
              scheduleText = '<div class="day-status half"></div><div class="day-info half-info">오후반차</div>';
            }
          } else {
            // 기본 스케줄 적용
            // dayOfWeek: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
            // currentOffDay: 1=월, 2=화, 3=수, 4=목, 5=금
            // 평일(월~금)인 경우 dayOfWeek는 1~5이므로 currentOffDay와 직접 비교 가능
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              // 디버깅: 함수가 제대로 호출되는지 확인
              if (typeof calculateOffDayByWeekCycle === 'undefined') {
                console.error('calculateOffDayByWeekCycle 함수를 찾을 수 없습니다!');
                scheduleStatus = 'work';
                scheduleText = '<div class="day-status work"></div><div class="day-info work-info">근무일</div>';
              } else {
                // 공휴일 포함 주 체크
                const weekStart = getWeekStartDate(date);
                const holidays = window.currentScheduleData?.holidays || [];
                const hasHoliday = hasHolidayInWeek(weekStart, holidays);
                
                // 공휴일이 포함된 주라면 휴무일을 표시하지 않음
                if (hasHoliday && dayOfWeek === currentOffDay) {
                  // 공휴일 포함 주의 휴무일은 근무일로 표시
                  scheduleStatus = 'work';
                  scheduleText = '<div class="day-status work"></div><div class="day-info work-info">근무일</div>';
                } else if (dayOfWeek === currentOffDay) {
                  scheduleStatus = 'off';
                  scheduleText = '<div class="day-status off"></div><div class="day-info off-info">휴무일</div>';
                } else {
                  scheduleStatus = 'work';
                  scheduleText = '<div class="day-status work"></div><div class="day-info work-info">근무일</div>';
                }
              }
            }
          }
      } else {
        // work_days 정보가 없으면 기본 근무일로 표시
        scheduleStatus = 'work';
        scheduleText = '<div class="day-status work"></div><div class="day-info work-info">근무일</div>';
      }
    } else {
      // 스케줄 데이터가 없으면 기본 근무일로 표시
      scheduleStatus = 'work';
      scheduleText = '<div class="day-status work"></div><div class="day-info work-info">근무일</div>';
    }
    
    dayElement.className += ` ${scheduleStatus}`;
    dayElement.innerHTML = `
      <div class="day-number">${day}</div>
      ${scheduleText}
    `;
    
    calendarGrid.appendChild(dayElement);
  }
  
  console.log(`캘린더 생성 완료: ${daysInMonth}개 날짜, 스케줄 적용됨`);
}
 
 
 // 반차 신청 모달 열기
    function openHalfDayModal() {
      const modal = new bootstrap.Modal(document.getElementById('halfDayModal'));
      modal.show();
    }
    
    // 반차 신청 처리
    // 반차 신청 처리 (API 연동)
		async function submitHalfDay() {
		  const form = document.getElementById('halfDayForm');
		  if (!form.checkValidity()) {
			form.reportValidity();
			return;
		  }
		  
		  const halfDayDate = document.getElementById('halfDayDate').value;
		  
		  // 같은 주 검증
		  if (!window.currentScheduleData || !window.currentScheduleData.user) {
			window.sjTemplateLoader.showToast('스케줄 정보를 불러올 수 없습니다.', 'error');
			return;
		  }
		  
		  const workDays = window.currentScheduleData.user.work_days;
		  const selectedDate = new Date(halfDayDate);
		  
		  // 해당 주의 휴무일 계산
		  const weekStart = getWeekStartDate(selectedDate);
		  const offDay = calculateOffDayByWeekCycle(
			new Date(workDays.cycle_start_date),
			weekStart,
			workDays.base_off_day
		  );
		  
		  // 휴무일 날짜 계산
		  const offDayDate = new Date(weekStart);
		  offDayDate.setDate(offDayDate.getDate() + (offDay - 1));
		  
		  // 같은 주인지 확인
		  if (!isSameWeek(selectedDate, offDayDate)) {
			const validationDiv = document.getElementById('halfDayValidation');
			if (validationDiv) {
			  validationDiv.style.display = 'block';
			}
			window.sjTemplateLoader.showToast('반차는 같은 주(월~일) 내에서만 사용 가능합니다.', 'warning');
			return;
		  } else {
			const validationDiv = document.getElementById('halfDayValidation');
			if (validationDiv) {
			  validationDiv.style.display = 'none';
			}
		  }
		  
		  const data = {
			half_day_date: halfDayDate,
			half_day_type: document.getElementById('halfDayType').value,
			reason: document.getElementById('halfDayReason').value
		  };
			const submitBtn = document.querySelector('#halfDayModal .btn-primary');
			const originalText = submitBtn.textContent;
		  try {
			// 로딩 상태 표시
			
			submitBtn.textContent = '처리 중...';
			submitBtn.disabled = true;
			
			// API 호출
			const response = await fetch('/api/staff/work-schedules/apply-half-day', {
			  method: 'POST',
			  credentials: 'include',
			  headers: {
				'Content-Type': 'application/json'
			  },
			  body: JSON.stringify(data)
			});
			
			const result = await response.json();
			
			if (response.ok && result.success) {
			  // 성공 시
			  bootstrap.Modal.getInstance(document.getElementById('halfDayModal')).hide();
			  window.sjTemplateLoader?.showToast('반차 신청이 완료되었습니다.', 'success');
			  
			  // 폼 초기화
			  form.reset();
			  const tomorrow = new Date();
			  tomorrow.setDate(tomorrow.getDate() + 1);
			  const halfDayDateInput = document.getElementById('halfDayDate');
			  if (halfDayDateInput) {
				halfDayDateInput.value = tomorrow.toISOString().split('T')[0];
			  }
			  
			  // 페이지 리로드해서 반차 사용 현황 업데이트
			  setTimeout(() => {
				location.reload();
			  }, 2000);
			} else {
			  // 실패 시 - 에러 코드별 처리
			  const errorCode = result.code || 'UNKNOWN_ERROR';
			  let errorMessage = result.message || '반차 신청에 실패했습니다.';
			  
			  if (errorCode === 'SAME_WEEK_REQUIRED') {
				const validationDiv = document.getElementById('halfDayValidation');
				if (validationDiv) {
				  validationDiv.style.display = 'block';
				}
			  } else if (errorCode === 'HOLIDAY_WEEK') {
				errorMessage = '공휴일 포함 주에는 반차를 분할할 수 없습니다.';
			  } else if (errorCode === 'PROBATION_PERIOD') {
				errorMessage = '수습 기간 중에는 반차를 신청할 수 없습니다.';
			  } else if (errorCode === 'DUPLICATE_REQUEST') {
				errorMessage = '이미 반차가 신청된 날짜입니다.';
			  }
			  
			  window.sjTemplateLoader?.showToast(`반차 신청 실패: ${errorMessage}`, 'error');
			}
			
		  } catch (error) {
			console.error('반차 신청 중 오류:', error);
			window.sjTemplateLoader.showToast('네트워크 오류가 발생했습니다.', 'error');
		  } finally {
			// 버튼 상태 복원
			const submitBtn = document.querySelector('#halfDayModal .btn-primary');
			submitBtn.textContent = originalText;
			submitBtn.disabled = false;
		  }
		}
    
    // 시프트 안내 표시 (4주 주기 버전)
    function showScheduleInfo() {
      if (!window.currentScheduleData || !window.currentScheduleData.user) {
        alert('스케줄 정보를 불러올 수 없습니다.');
        return;
      }
      
      const workDays = window.currentScheduleData.user.work_days;
      const today = new Date();
      const cycleInfo = calculateCycleInfo(workDays, today);
      
      if (!cycleInfo) {
        alert('주기 정보를 계산할 수 없습니다.');
        return;
      }
      
      alert(`
🗓️ 나의 시프트 정보 (4주 주기 반대 방향 순환)

📅 현재 주기: ${cycleInfo.weekRange} (${cycleInfo.currentOffDayName} 휴무)
📅 다음 주기: ${cycleInfo.nextCycleDate}부터 ${cycleInfo.nextOffDayName} 휴무

🔄 순환 방향: 금 → 목 → 수 → 화 → 월 → 금 (반대 방향)
⏰ 주 32시간 근무 원칙
📆 4주(28일)마다 한 요일씩 역방향으로 이동
      `);
    }
    
    // 일시적 변경 모달 열기
    function openTemporaryChangeModal() {
      const modal = new bootstrap.Modal(document.getElementById('temporaryChangeModal'));
      
      // 현재 주의 월요일을 기본값으로 설정
      const today = new Date();
      const weekStart = getWeekStartDate(today);
      document.getElementById('changeWeekStart').value = formatDate(weekStart);
      
      // 원래 휴무일 표시
      if (window.currentScheduleData && window.currentScheduleData.user) {
        const workDays = window.currentScheduleData.user.work_days;
        const cycleInfo = calculateCycleInfo(workDays, today);
        if (cycleInfo) {
          document.getElementById('originalOffDay').value = cycleInfo.currentOffDayName;
        }
      }
      
      modal.show();
    }
    
    // 일시적 변경 신청 처리
    async function submitTemporaryChange() {
      const form = document.getElementById('temporaryChangeForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
      const weekStartDate = document.getElementById('changeWeekStart').value;
      const temporaryOffDay = parseInt(document.getElementById('temporaryOffDay').value);
      const substituteEmployee = document.getElementById('substituteEmployee').value;
      const reason = document.getElementById('changeReason').value;
      
      // 원래 휴무일 계산
      if (!window.currentScheduleData || !window.currentScheduleData.user) {
        window.sjTemplateLoader.showToast('스케줄 정보를 불러올 수 없습니다.', 'error');
        return;
      }
      
      const workDays = window.currentScheduleData.user.work_days;
      const weekStart = new Date(weekStartDate);
      const originalOffDay = calculateOffDayByWeekCycle(
        new Date(workDays.cycle_start_date),
        weekStart,
        workDays.base_off_day
      );
      
      if (originalOffDay === temporaryOffDay) {
        window.sjTemplateLoader.showToast('원래 휴무일과 동일합니다. 다른 요일을 선택해주세요.', 'warning');
        return;
      }
      
      const data = {
        week_start_date: weekStartDate,
        temporary_off_day: temporaryOffDay,
        reason: reason,
        substitute_employee: substituteEmployee || null
      };
      
      const submitBtn = document.querySelector('#temporaryChangeModal .btn-primary');
      const originalText = submitBtn.textContent;
      
      try {
        submitBtn.textContent = '처리 중...';
        submitBtn.disabled = true;
        
        // 모킹 데이터 사용 시
        if (window.USE_MOCK_DATA) {
          console.log('일시적 변경 신청 (모킹):', data);
          setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('temporaryChangeModal')).hide();
            window.sjTemplateLoader?.showToast('일시적 변경 신청이 완료되었습니다. (모킹)', 'success');
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }, 1000);
        } else {
          // 실제 API 호출
          const response = await fetch('/api/staff/work-schedules/temporary-change', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          const result = await response.json();
          
          if (response.ok && result.success) {
            bootstrap.Modal.getInstance(document.getElementById('temporaryChangeModal')).hide();
            window.sjTemplateLoader?.showToast('일시적 변경 신청이 완료되었습니다.', 'success');
            form.reset();
            setTimeout(() => location.reload(), 2000);
          } else {
            // 에러 코드별 처리
            const errorCode = result.code || 'UNKNOWN_ERROR';
            let errorMessage = result.message || '신청에 실패했습니다.';
            
            if (errorCode === 'PROBATION_PERIOD') {
              errorMessage = '수습 기간 중에는 일시적 변경이 불가합니다.';
            } else if (errorCode === 'HOLIDAY_WEEK') {
              errorMessage = '공휴일 포함 주에는 일시적 변경이 불가합니다.';
            } else if (errorCode === 'VALIDATION_ERROR') {
              errorMessage = '원래 휴무일과 동일합니다. 다른 요일을 선택해주세요.';
            } else if (errorCode === 'DUPLICATE_REQUEST') {
              errorMessage = '이미 해당 주에 변경 요청이 있습니다.';
            }
            
            window.sjTemplateLoader?.showToast(`신청 실패: ${errorMessage}`, 'error');
          }
        }
      } catch (error) {
        console.error('일시적 변경 신청 중 오류:', error);
        window.sjTemplateLoader?.showToast('네트워크 오류가 발생했습니다.', 'error');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }
    
    // 캘린더 네비게이션 (기본 구현)
   // 이렇게 바꾸기
	document.getElementById('prevMonth').addEventListener('click', async () => {
	  currentMonth = currentMonth - 1;
	  if (currentMonth < 1) {
		currentMonth = 12;
		currentYear = currentYear - 1;
	  }
	  await updateMonthDisplay();
	});
    
    document.getElementById('nextMonth').addEventListener('click', async () => {
		  currentMonth = currentMonth + 1;
		  if (currentMonth > 12) {
			currentMonth = 1;
			currentYear = currentYear + 1;
		  }
		  await updateMonthDisplay();
		});
    
    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', function() {
      console.log('4일제 스케줄 페이지가 로드되었습니다.');
      
	  checkUserScheduleStatus();
	  
      // 오늘 날짜를 반차 신청의 기본값으로 설정
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      const halfDayDateInput = document.getElementById('halfDayDate');
      if (halfDayDateInput) {
        halfDayDateInput.value = tomorrowString;
        
        // 날짜 변경 시 같은 주 검증
        halfDayDateInput.addEventListener('change', function() {
          const validationDiv = document.getElementById('halfDayValidation');
          if (validationDiv) {
            validationDiv.style.display = 'none';
          }
        });
      }
      
      // 모킹 데이터로 초기 로드 (개발 중)
      if (window.USE_MOCK_DATA) {
        loadPersonalSchedule();
      }
    });
	
	// 시프트 패턴 업데이트 함수 
	function updateShiftPattern(workDays) {
	  const days = ['월요일', '화요일', '수요일', '목요일', '금요일'];
	  
	  days.forEach((dayName, index) => {
		const dayNumber = index + 1;
		const dayPattern = document.querySelector(`.day-pattern:nth-child(${dayNumber})`);
		
		if (workDays[dayNumber] === 'off') {
		  dayPattern.className = 'day-pattern off';
		  dayPattern.querySelector('.day-schedule').textContent = '휴무';
		} else {
		  dayPattern.className = 'day-pattern work';
		  dayPattern.querySelector('.day-schedule').textContent = '9:00-18:00';
		}
	  });
	}
	
	
	// 시프트 설명 텍스트 업데이트 함수 (4주 주기 버전)
	function updateShiftDescription4Week(scheduleData, cycleInfo) {
	  if (!cycleInfo) return;
	  
	  const descElement = document.querySelector('.shift-info-content p');
	  if (descElement) {
		descElement.innerHTML = `
		  <strong>4주 주기 반대 방향 순환 시스템</strong><br>
		  • 현재: <span id="currentCycleInfo">${cycleInfo.weekRange} (${cycleInfo.currentOffDayName} 휴무)</span><br>
		  • 다음: <span id="nextCycleInfo">${cycleInfo.nextOffDayName} 휴무</span> - <span id="nextCycleDate">${cycleInfo.nextCycleDate}</span>부터<br>
		  • 순환 방향: 금 → 목 → 수 → 화 → 월 → 금 (반대 방향)
		`;
	  }
	}
	
	// 주기 정보 배지 업데이트
	function updateCycleInfo(cycleInfo) {
	  if (!cycleInfo) return;
	  
	  const badge = document.getElementById('cycleInfoBadge');
	  const weekRange = document.getElementById('cycleWeekRange');
	  const currentOffDayName = document.getElementById('currentOffDayName');
	  
	  if (badge && weekRange) {
		badge.style.display = 'inline-block';
		weekRange.textContent = cycleInfo.weekRange;
	  }
	  
	  if (currentOffDayName) {
		currentOffDayName.textContent = cycleInfo.currentOffDayName;
	  }
	}
	
	// 수습 기간 체크 및 안내 표시
	function checkProbationPeriod(hireDate) {
	  if (!hireDate) {
		const notice = document.getElementById('probationNotice');
		if (notice) notice.style.display = 'none';
		return;
	  }
	  
	  const today = new Date();
	  // 모킹 파일의 isProbationPeriod 함수 사용 (전역 함수)
	  let isProbation = false;
	  if (typeof isProbationPeriod === 'function') {
		isProbation = isProbationPeriod(hireDate, today);
	  } else {
		console.warn('isProbationPeriod 함수를 찾을 수 없습니다.');
	  }
	  
	  const notice = document.getElementById('probationNotice');
	  const tempChangeBtn = document.getElementById('temporaryChangeBtn');
	  
	  if (isProbation) {
		if (notice) notice.style.display = 'block';
		if (tempChangeBtn) {
		  tempChangeBtn.disabled = true;
		  tempChangeBtn.title = '수습 기간 중에는 일시적 변경이 불가합니다';
		}
	  } else {
		if (notice) notice.style.display = 'none';
		// 다른 조건(공휴일 등)으로 비활성화된 경우가 아니면 활성화
		if (tempChangeBtn) {
		  const hasHoliday = window.currentScheduleData?.has_holiday_in_week;
		  if (!hasHoliday) {
			tempChangeBtn.disabled = false;
			tempChangeBtn.title = '';
		  }
		}
	  }
	}
	
	// 공휴일 포함 주 체크 및 안내 표시
	function checkHolidayInWeek(holidays, targetDate) {
	  if (!holidays || holidays.length === 0) {
		const notice = document.getElementById('holidayNotice');
		if (notice) notice.style.display = 'none';
		return;
	  }
	  
	  const weekStart = getWeekStartDate(targetDate);
	  const weekEnd = new Date(weekStart);
	  weekEnd.setDate(weekEnd.getDate() + 4); // 금요일까지
	  
	  const hasHoliday = holidays.some(h => {
		const holidayDate = new Date(h.date);
		return holidayDate >= weekStart && holidayDate <= weekEnd;
	  });
	  
	  const notice = document.getElementById('holidayNotice');
	  if (hasHoliday) {
		if (notice) notice.style.display = 'block';
	  } else {
		if (notice) notice.style.display = 'none';
	  }
	}
	
	// 일시적 변경 버튼 업데이트
	function updateTemporaryChangeButton(scheduleData) {
	  const btn = document.getElementById('temporaryChangeBtn');
	  if (!btn) return;
	  
	  // 수습 기간이거나 공휴일 포함 주면 비활성화
	  const isProbation = scheduleData.is_probation;
	  const hasHoliday = scheduleData.has_holiday_in_week;
	  
	  if (isProbation || hasHoliday) {
		btn.disabled = true;
		btn.title = isProbation ? '수습 기간 중에는 일시적 변경이 불가합니다' : '공휴일 포함 주에는 일시적 변경이 불가합니다';
	  } else {
		btn.disabled = false;
		btn.title = '';
	  }
	}
	
	// 스케줄 헤더 업데이트 함수 (4주 주기 버전)
	function updateScheduleHeader4Week(scheduleData, cycleInfo) {
		  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
							 '7월', '8월', '9월', '10월', '11월', '12월'];
		  
		  // 1. 년월 표시 업데이트
		  const headerTitle = document.getElementById('scheduleMonthTitle');
		  if (headerTitle) {
			headerTitle.textContent = `${scheduleData.year}년 ${monthNames[scheduleData.month - 1]} 스케줄`;
		  }
		  
		  // 2. 요약 카드들 업데이트
		  const summaryCards = document.querySelectorAll('.summary-card .summary-number');
		  if (summaryCards.length >= 4) {
			summaryCards[0].textContent = scheduleData.schedule.work_days_count * 4;  // 근무일 (대략)
			summaryCards[1].textContent = '32';  // 주당 근무시간 (고정)
			summaryCards[2].textContent = '0';  // 반차 사용 (추후 API 연동)
			summaryCards[3].textContent = cycleInfo ? cycleInfo.currentOffDayName : '금요일';  // 휴무일
		  }
		}