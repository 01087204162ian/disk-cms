// 수정된 계산 로직 테스트
function getWeekStartDate(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function calculateOffDayByWeekCycle(cycleStartDate, targetDate, initialOffDay) {
  const start = new Date(cycleStartDate);
  const target = new Date(targetDate);
  
  // 주 시작일(월요일) 기준으로 계산
  const startWeek = getWeekStartDate(start);
  const targetWeek = getWeekStartDate(target);
  
  // 경과 일수 계산 (주 시작일 기준)
  const daysDiff = Math.floor((targetWeek - startWeek) / (1000 * 60 * 60 * 24));
  
  // 주 단위로 계산 (7일 단위)
  const weeksDiff = Math.floor(daysDiff / 7);
  
  // 4주(28일) 단위로 주기 계산
  const cycles = Math.floor(weeksDiff / 4);
  
  // 반대 방향 순환: 5(금) → 4(목) → 3(수) → 2(화) → 1(월) → 5(금)
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

// 테스트
const d1 = '2025-01-06';
const d2 = '2025-12-01';
const d3 = '2025-12-04';

const off1 = calculateOffDayByWeekCycle(d1, d2, 5);
const off2 = calculateOffDayByWeekCycle(d1, d3, 5);

console.log('12월 1일 off day:', off1, off1 === 3 ? '수요일 ✓' : off1 === 4 ? '목요일' : '기타');
console.log('12월 4일 off day:', off2, off2 === 3 ? '수요일 ✓' : off2 === 4 ? '목요일' : '기타');

