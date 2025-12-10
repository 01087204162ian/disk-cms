# 보험대리점 직원 관리 CMS 프로젝트 가이드
#PROJECT_GUIDE.md
## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [데이터베이스 스키마](#데이터베이스-스키마)
5. [API 엔드포인트](#api-엔드포인트)
6. [프론트엔드 구조](#프론트엔드-구조)
7. [템플릿 시스템](#템플릿-시스템)
8. [개발 가이드라인](#개발-가이드라인)
9. [코드 리뷰 포인트](#코드-리뷰-포인트)
10. [개선 계획](#개선-계획)

---

## 🎯 프로젝트 개요

**프로젝트명**: disk-cms (보험대리점 직원 관리 CMS)  
**목적**: 보험대리점의 직원 출퇴근, 업무 성과, 스케줄 관리  
**특징**: 4일 근무제 지원, 위치 기반 출퇴근, KPI 추적

### 주요 기능
- ✅ **인증 시스템**: 세션 기반 로그인/로그아웃
- ✅ **출퇴근 관리**: 위치 기반 체크인/체크아웃
- ✅ **대시보드**: 개인/관리자 통계, 실시간 현황
- 🔄 **KPI 관리**: 업무 실적 추적 및 분석
- 🔄 **휴가 관리**: 휴가 신청/승인 워크플로우
- 🔄 **스케줄 관리**: 4일 근무제 스케줄링
- 📋 **보고서**: 성과 분석 및 리포트 생성


---

## 🛠️ 기술 스택

### Backend
- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js ^4.18.2
- **Database**: MySQL 8.0 (`insurance_cms`)
- **인증**: bcryptjs + express-session
- **검증**: express-validator + joi
- **로깅**: winston
- **시간**: moment.js + moment-timezone

### Frontend
- **UI Framework**: AdminLTE 3.2.0
- **CSS Framework**: Bootstrap 4.6.2
- **Icons**: Font Awesome 6.4.0
- **JavaScript**: Vanilla JS (ES6+) + jQuery

### Infrastructure
- **서버**: disk-cms.simg.kr
- **세션 저장**: MySQL (express-mysql-session)
- **로그 파일**: logs/app.log

---

## 📁 프로젝트 구조

```
disk-cms/
├── config/
│   ├── database.js          # 데이터베이스 설정
│   └── session.js           # 세션 설정
├── middleware/
│   ├── auth.js              # 인증 미들웨어
│   └── validation.js        # 검증 미들웨어
├── routes/
│   ├── auth.js              # 인증 라우트
│   ├── users.js             # 사용자 관리
│   ├── attendance.js        # 출퇴근 관리
│   └── dashboard.js         # 대시보드
├── services/
│   ├── authService.js       # 인증 비즈니스 로직
│   ├── userService.js       # 사용자 관리 로직
│   ├── attendanceService.js # 출퇴근 로직
│   └── dashboardService.js  # 대시보드 로직
├── utils/
│   ├── helpers.js           # 유틸리티 함수
│   └── logger.js            # 로깅 설정
├── public/
│   ├── templates/           # 공통 템플릿
│   │   ├── navbar.html
│   │   ├── sidebar.html
│   │   └── footer.html
│   ├── pages/               # 개별 페이지
│   │   ├── dashboard.html
│   │   ├── employee-list.html
│   │   └── attendance.html
│   ├── css/
│   │   ├── common.css       # 공통 스타일
│   │   └── pages/           # 페이지별 스타일
│   └── js/
│       ├── common/          # 공통 기능
│       │   ├── base.js      # 기본 템플릿
│       │   └── utils.js     # 유틸리티
│       └── pages/           # 페이지별 스크립트
├── logs/
├── server.js
└── package.json
```

---

## 🗄️ 데이터베이스 스키마

### 사용자 관리
**users** - 직원 정보 (이메일 PK)
```sql
- email (VARCHAR, PK): 이메일 주소
- password (VARCHAR): 암호화된 비밀번호
- name (VARCHAR): 이름
- employee_id (VARCHAR): 사번
- department_id (INT): 부서 ID
- role (ENUM): SUPER_ADMIN, DEPT_MANAGER, SYSTEM_ADMIN, EMPLOYEE
- work_type (ENUM): FULL_TIME, PART_TIME, CONTRACT
- work_schedule (ENUM): 4_DAY, FLEXIBLE, STANDARD
```

**departments** - 부서 관리
```sql
- id (INT, PK): 부서 ID
- name (VARCHAR): 부서명
- code (VARCHAR): 부서코드
- manager_id (INT): 팀장 ID
```

### 근태 관리
**attendance** - 출퇴근 기록
```sql
- id (INT, PK): 출근 기록 ID
- user_id (VARCHAR, FK): 사용자 이메일
- work_date (DATE): 근무일
- check_in_time (TIMESTAMP): 출근 시간
- check_out_time (TIMESTAMP): 퇴근 시간
- work_hours (DECIMAL): 실제 근무 시간
- status (ENUM): PRESENT, ABSENT, LATE, EARLY_LEAVE, HOLIDAY
- check_in_location (VARCHAR): 출근 위치
```

**leaves** - 휴가 관리
```sql
- id (INT, PK): 휴가 ID
- user_id (VARCHAR, FK): 신청자 이메일
- leave_type (ENUM): ANNUAL, HALF_AM, HALF_PM, SICK, SPECIAL
- start_date (DATE): 휴가 시작일
- end_date (DATE): 휴가 종료일
- status (ENUM): PENDING, APPROVED, REJECTED, CANCELLED
- approved_by (VARCHAR, FK): 승인자 이메일
```

**work_schedules** - 근무 스케줄
```sql
- id (INT, PK): 스케줄 ID
- user_id (INT, FK): 사용자 ID
- year (INT): 연도
- month (INT): 월
- work_days (JSON): 근무 요일 [1,2,3,4]
- shift_week (INT): 시프트 주차
- status (ENUM): PENDING, APPROVED, REJECTED
```

### 업무 성과
**kpi_records** - 업무 실적
```sql
- id (INT, PK): 실적 ID
- user_id (VARCHAR, FK): 사용자 이메일
- product_id (INT, FK): 상품 ID
- task_type (ENUM): ENDORSEMENT, NEW_CONTRACT, CLAIM, CONSULTATION
- processed_count (INT): 처리 건수
- processing_time (INT): 처리 시간(분)
- accuracy_score (DECIMAL): 정확도 점수
- quality_grade (ENUM): EXCELLENT, GOOD, AVERAGE, POOR
```

**kpi_summary** - 성과 요약
```sql
- id (INT, PK): 요약 ID
- user_id (VARCHAR, FK): 사용자 이메일
- summary_type (ENUM): DAILY, WEEKLY, MONTHLY, YEARLY
- summary_date (DATE): 요약 날짜
- total_tasks (INT): 총 처리 건수
- avg_processing_time (DECIMAL): 평균 처리 시간
- avg_accuracy_score (DECIMAL): 평균 정확도
```

### 상품 관리
**products** - 보험 상품
```sql
- id (INT, PK): 상품 ID
- name (VARCHAR): 상품명
- code (VARCHAR): 상품코드
- category (VARCHAR): 카테고리
- description (TEXT): 설명
```

**product_managers** - 상품 담당자
```sql
- id (INT, PK): 담당자 ID
- product_id (INT, FK): 상품 ID
- user_id (VARCHAR, FK): 담당자 이메일
- manager_type (ENUM): PRIMARY, SECONDARY
```

---

## 🌐 API 엔드포인트

### 인증 (routes/auth.js)
```
POST   /api/auth/login      - 로그인
POST   /api/auth/register   - 회원가입
POST   /api/auth/logout     - 로그아웃
GET    /api/auth/me         - 현재 사용자 정보
```

### 사용자 관리 (routes/users.js)
```
GET    /api/users           - 사용자 목록
GET    /api/users/:email    - 사용자 상세
PUT    /api/users/:email    - 사용자 정보 수정
DELETE /api/users/:email    - 사용자 삭제
```

### 출퇴근 관리 (routes/attendance.js)
```
POST   /api/attendance/checkin     - 출근 체크
POST   /api/attendance/checkout    - 퇴근 체크
GET    /api/attendance/status      - 현재 출근 상태
GET    /api/attendance/records     - 출근 기록 조회
GET    /api/attendance/monthly     - 월별 출근 통계
```

### 대시보드 (routes/dashboard.js)
```
GET    /api/dashboard                      - 대시보드 데이터
GET    /api/dashboard/stats               - 개인 통계
GET    /api/dashboard/admin-stats         - 관리자 통계
GET    /api/dashboard/notifications/count - 알림 개수
GET    /api/dashboard/notifications/recent- 최근 알림
```

---

## 🎨 프론트엔드 구조

### 현재 구현된 페이지
- **login.html**: 로그인 페이지
- **register.html**: 회원가입 페이지
- **dashboard.html**: 메인 대시보드
- **attendance-status.html**: 출근 현황

### CSS 설계 원칙
```css
/* CSS 변수 활용 */
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --success-gradient: linear-gradient(135deg, #48bb78, #38a169);
  --error-gradient: linear-gradient(135deg, #f56565, #e53e3e);
  --border-radius-sm: 10px;
  --border-radius-md: 15px;
  --border-radius-lg: 50px;
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}

/* 글래스모피즘 효과 */
.attendance-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

/* 마이크로 인터랙션 */
.small-box:hover {
  transform: translateY(-5px);
}
```

### JavaScript 아키텍처
```javascript
// 클래스 기반 구조
class Dashboard {
  constructor() {
    this.user = null;
    this.attendanceData = null;
  }

  async initialize() {
    await this.checkAuth();
    await this.loadDashboardData();
    this.setupEventListeners();
  }
}

// 에러 핸들링 패턴
try {
  const response = await fetch('/api/endpoint');
  const result = await response.json();
  
  if (result.success) {
    this.updateUI(result.data);
  } else {
    this.showToast(result.message, 'error');
  }
} catch (error) {
  console.error('구체적 오류:', error);
  this.showToast('사용자 친화적 메시지', 'error');
}
```

---

## 🔧 템플릿 시스템

### 공통 템플릿 구조
```
templates/
├── navbar.html     - 상단 네비게이션
├── sidebar.html    - 사이드바 메뉴
└── footer.html     - 푸터
```

### 템플릿 로더 (base.js)
```javascript
class BaseTemplate {
  async initialize(pageName) {
    await this.loadTemplates();
    await this.checkAuth();
    this.renderPage(pageName);
    this.setupCommonEvents();
  }
  
  async loadTemplates() {
    const templates = ['navbar', 'sidebar', 'footer'];
    for (const template of templates) {
      const response = await fetch(`/templates/${template}.html`);
      this.templates[template] = await response.text();
    }
  }
}
```

### 새 페이지 생성 패턴
1. **HTML 템플릿** 복사
2. **컨테이너 요소** 추가: `navbar-container`, `sidebar-container`, `footer-container`
3. **페이지별 스크립트** 작성
4. **base.js 초기화** 호출

---

## 📝 개발 가이드라인

### 1. 코딩 컨벤션
```javascript
// 네이밍 규칙
- 클래스: PascalCase (Dashboard, AttendanceManager)
- 함수/변수: camelCase (updateUserInfo, attendanceData)
- 상수: UPPER_SNAKE_CASE (API_ENDPOINTS, USER_ROLES)
- 파일명: kebab-case (attendance-service.js, employee-list.html)

// 비동기 처리
- async/await 사용 (Promise.then 지양)
- 에러 핸들링 필수
- 로딩 상태 UI 제공

// API 응답 형식 통일
{
  success: boolean,
  message: string,
  data: object|array,
  error?: string
}
```

### 2. 보안 가이드라인
```javascript
// 클라이언트 사이드 권한 체크 (UI용)
if (['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(user.role)) {
  showAdminMenu();
}

// 서버 사이드 검증 필수
app.get('/api/admin/*', requireAuth, requireAdminRole, handler);

// 입력값 검증
const { body, validationResult } = require('express-validator');
app.post('/api/users', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 })
], handler);
```

### 3. 성능 최적화
```javascript
// 데이터 캐싱
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 디바운싱
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// 메모리 정리
componentWillUnmount() {
  clearInterval(this.timeInterval);
  clearTimeout(this.notificationTimeout);
}
```

---

## 🔍 코드 리뷰 포인트

### Backend 체크리스트
- [ ] **에러 핸들링**: try-catch 블록과 적절한 에러 메시지
- [ ] **입력값 검증**: joi/express-validator 사용
- [ ] **SQL 인젝션 방지**: 파라미터화된 쿼리
- [ ] **인증/권한**: 미들웨어를 통한 검증
- [ ] **로깅**: 적절한 로그 레벨과 메시지
- [ ] **성능**: N+1 쿼리 방지, 인덱스 활용

### Frontend 체크리스트
- [ ] **사용자 경험**: 로딩 상태, 에러 메시지
- [ ] **접근성**: 키보드 네비게이션, 스크린 리더
- [ ] **반응형**: 모바일/태블릿 대응
- [ ] **성능**: 불필요한 DOM 조작 최소화
- [ ] **메모리 누수**: 이벤트 리스너 정리
- [ ] **보안**: XSS 방지, 민감정보 노출 방지

### CSS 체크리스트
- [ ] **일관성**: 디자인 시스템 준수
- [ ] **성능**: 불필요한 리플로우 최소화
- [ ] **유지보수**: CSS 변수 활용
- [ ] **브라우저 호환성**: 벤더 프리픽스
- [ ] **접근성**: 충분한 대비, 포커스 표시

---

## 🚀 개선 계획

### Phase 1: 기능 완성 (1-2주)
- [ ] **KPI 관리 시스템**
  - KPI 기록 등록/수정/삭제
  - 일/주/월 단위 요약 자동 생성
  - 성과 분석 대시보드
  
- [ ] **휴가 관리 시스템**
  - 휴가 신청/승인 워크플로우
  - 휴가 잔여일수 관리
  - 캘린더 기반 UI

- [ ] **스케줄 관리**
  - 4일 근무제 스케줄 등록
  - 시프트 자동 배정
  - 스케줄 충돌 검사

### Phase 2: UX 개선 (1주)
- [ ] **반응형 디자인**
  - 모바일 최적화
  - 태블릿 레이아웃
  - PWA 기능 추가

- [ ] **실시간 기능**
  - WebSocket 연동
  - 실시간 알림
  - 동시 접속자 표시

### Phase 3: 고도화 (2-3주)
- [ ] **보고서 시스템**
  - PDF 생성
  - Excel 다운로드
  - 차트/그래프 시각화

- [ ] **알림 시스템**
  - 이메일 알림
  - 브라우저 푸시 알림
  - SMS 연동 (선택)

- [ ] **백업/복구**
  - 자동 백업 스케줄
  - 데이터 복구 기능
  - 로그 순환 정책

### Phase 4: 운영 최적화 (지속)
- [ ] **모니터링**
  - 성능 모니터링
  - 에러 추적
  - 사용자 행동 분석

- [ ] **보안 강화**
  - 2단계 인증
  - 비밀번호 정책
  - 세션 보안 강화

---

## 📞 개발 시 참조사항

### 현재 질문/작업 내용
```
(여기에 현재 작업하는 내용이나 질문을 적어주세요)
```

### 빠른 참조
- **서버**: disk-cms.simg.kr
- **DB**: insurance_cms
- **관리자**: sj@simg.kr (SUPER_ADMIN)
- **개발 환경**: Node.js 16+, MySQL 8.0

### 문제 해결 체크리스트
1. **API 오류**: logs/app.log 확인
2. **DB 연결**: config/database.js 설정 확인
3. **세션 문제**: sessions 테이블 확인
4. **권한 오류**: user.role 값 확인
5. **프론트엔드**: 브라우저 개발자 도구 콘솔

---

*이 문서는 프로젝트 진행에 따라 지속적으로 업데이트됩니다.*  
*마지막 업데이트: 2025년 8월 15일*