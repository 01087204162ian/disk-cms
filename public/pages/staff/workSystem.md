# 4일 근무제 시스템 기획서 (최종)

## 1. 개요

### 1.1 목적
- **직원**: 주 4일 근무로 워크라이프밸런스 향상
- **회사**: 월~금 연속 서비스 제공 및 운영 효율성 확보
- **공정성**: 모든 직원이 각 요일 휴무를 순환하며 경험

### 1.2 핵심 원칙
- **회사 운영**: 월~금 5일 정상 운영
- **개인 근무**: 주 4일 근무 (32시간)
- **시프트 순환**: 첫 번째 월요일 기준으로 매월 자동 휴무 요일 변경
- **공휴일 예외**: 공휴일이 있는 주도 실질적으로 32시간 유지

## 2. 시프트 로테이션 시스템

### 2.1 하이브리드 시스템
- **시스템 도입 시**: 모든 직원이 원하는 휴무일 1회 선택
- **도입 이후**: 매월 자동 시프트 순환 (공정성 보장)
- **반차 사용**: 계획된 경우와 긴급한 경우로 구분 처리

### 2.2 최초 선택 후 시프트 패턴
```
예시) 김철수가 최초에 '금요일 휴무' 선택했다면:

1월: 금요일 휴무 (본인 선택, shift_week 1)
2월: 월요일 휴무 (시프트, shift_week 2)
3월: 화요일 휴무 (시프트, shift_week 3)  
4월: 수요일 휴무 (시프트, shift_week 4)
5월: 목요일 휴무 (시프트, shift_week 5)
6월: 금요일 휴무 (순환 복귀, shift_week 1)
```

### 2.3 반차 사용 정책

#### 기본 개념: 휴무요일 쪼개서 사용
- **반차 = 휴무일을 반으로 나누어 사용하는 개념**
- **오전 반차**: 14시 출근 (오후 4시간 근무)
- **오후 반차**: 14시 퇴근 (오전 4시간 근무)
- **주 32시간 원칙**: 절대적으로 유지

#### 상황별 처리 방법

**1) 계획된 반차 (사전 신청)**
- 해당 주 휴무일을 4시간 근무로 변경하여 32시간 유지
- 예시: 화요일 휴무자가 목요일 오후 반차 신청
  - 목요일: 4시간 근무 (14시 퇴근)
  - 화요일: 4시간 근무 (원래 휴무 → 반일 근무)
  - 총 32시간 유지

**2) 긴급 반차 (당일 또는 급작스런 상황)**
- 차주 보충 방식으로 처리
- 예시: 화요일 휴무자가 금요일 긴급 반차
  - 이번 주: 28시간 (4시간 부족)
  - 다음 주: 다음 주 휴무일에 4시간 출근하여 36시간
  - 2주 평균 32시간 유지

## 3. 기존 테이블 활용 방안

### 3.1 사용 가능한 기존 테이블
- ✅ `users` - work_schedule 필드에 '4_DAY' 활용, work_days JSON 추가
- ✅ `work_schedules` - shift_week, work_days(JSON) 완벽 활용
- ✅ `holidays` - 공휴일 확인용
- ✅ `leaves` - HALF_AM, HALF_PM 반차 기록 연동
- ✅ `attendance` - 실제 근무시간 추적
- ✅ `departments` - 팀별 인력 관리

### 3.2 테이블 확장
```sql
-- users 테이블에 개인 시프트 정보 추가
ALTER TABLE users 
ADD COLUMN work_days JSON COMMENT '개인 시프트 정보 및 초기 선택 데이터';

-- work_schedules 상태 단순화
ALTER TABLE work_schedules 
MODIFY COLUMN status ENUM(
    'APPROVED',          -- 승인 완료 (정상 운영)
    'INITIAL_PENDING',   -- 초기 선택 대기 (도입 시에만)
    'ADJUSTMENT_PENDING' -- 반차 등 개인 조정 대기
) DEFAULT 'APPROVED';

-- 추가 테이블: 스케줄 변경 이력
CREATE TABLE schedule_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT,
    user_id VARCHAR(100) NOT NULL,
    action_type ENUM('CREATE','UPDATE','APPROVE','REJECT','AUTO_GENERATE'),
    old_data JSON,
    new_data JSON,
    changed_by VARCHAR(100),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (schedule_id) REFERENCES work_schedules(id),
    FOREIGN KEY (user_id) REFERENCES users(email),
    FOREIGN KEY (changed_by) REFERENCES users(email)
);
```

## 4. JSON 데이터 구조

### 4.1 users.work_days (개인 시프트 정보)
```json
{
    "initial_off_day": 5,
    "initial_selection_date": "2024-01-15",
    "current_shift_week": 1
}
```

### 4.2 work_schedules.work_days (월별 스케줄)
```json
{
    "first_monday": "2025-01-06",
    "personal_shift_week": 1,
    "base_off_day": 5,
    "days": {
        "1": "full",     // 월: 종일(8h)
        "2": "full",     // 화: 종일(8h)  
        "3": "full",     // 수: 종일(8h)
        "4": "full",     // 목: 종일(8h)
        "5": "off"       // 금: 휴무
    },
    "total_hours": 32,
    "work_days_count": 4,
    "half_day_details": {
        "3": {
            "date": "2025-01-15",
            "type": "AFTERNOON",
            "reason": "병원 방문",
            "compensation_date": "2025-01-17"
        }
    }
}
```

### 4.3 근무 타입 정의
- `full`: 종일근무 (8시간)
- `morning`: 오전근무 (4시간) 
- `afternoon`: 오후근무 (4시간)
- `off`: 휴무

## 5. 핵심 비즈니스 로직

### 5.1 첫 번째 월요일 계산
```sql
DELIMITER //
CREATE FUNCTION GetFirstMondayOfMonth(target_year INT, target_month INT)
RETURNS DATE
DETERMINISTIC
BEGIN
    DECLARE first_day DATE;
    DECLARE first_monday DATE;
    DECLARE day_of_week INT;
    
    SET first_day = STR_TO_DATE(CONCAT(target_year, '-', target_month, '-01'), '%Y-%m-%d');
    SET day_of_week = DAYOFWEEK(first_day);
    
    SET first_monday = CASE 
        WHEN day_of_week = 2 THEN first_day  
        WHEN day_of_week = 1 THEN DATE_ADD(first_day, INTERVAL 1 DAY)
        ELSE DATE_ADD(first_day, INTERVAL (9 - day_of_week) DAY)
    END;
    
    RETURN first_monday;
END //
DELIMITER ;
```

### 5.2 개인별 시프트 계산
```sql
DELIMITER //
CREATE FUNCTION CalculatePersonalShiftWeek(
    user_email VARCHAR(100),
    target_year INT, 
    target_month INT
) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE initial_shift_week INT;
    DECLARE initial_selection_date DATE;
    DECLARE months_since_initial INT;
    DECLARE current_shift_week INT;
    
    -- 사용자의 초기 선택 정보 조회
    SELECT 
        JSON_EXTRACT(work_days, '$.current_shift_week'),
        DATE(JSON_UNQUOTE(JSON_EXTRACT(work_days, '$.initial_selection_date')))
    INTO initial_shift_week, initial_selection_date
    FROM users 
    WHERE email = user_email;
    
    -- 초기 선택 이후 경과 개월 수 계산
    SET months_since_initial = (target_year - YEAR(initial_selection_date)) * 12 + 
                              (target_month - MONTH(initial_selection_date));
    
    -- 개인별 시프트 주차 계산 (5개월 순환)
    SET current_shift_week = ((initial_shift_week - 1 + months_since_initial) % 5) + 1;
    
    RETURN current_shift_week;
END //
DELIMITER ;
```

### 5.3 반차 신청 처리
```sql
DELIMITER //
CREATE PROCEDURE ApplyHalfDayLeave(
    IN user_email VARCHAR(100),
    IN target_year INT,
    IN target_month INT,
    IN half_day_date DATE,
    IN half_day_type ENUM('MORNING', 'AFTERNOON'),
    IN is_emergency BOOLEAN,
    IN reason TEXT
)
BEGIN
    DECLARE schedule_id INT;
    DECLARE current_work_days JSON;
    DECLARE target_day_of_week INT;
    DECLARE base_off_day INT;
    DECLARE updated_work_days JSON;
    
    -- 스케줄 정보 조회
    SELECT id, work_days INTO schedule_id, current_work_days
    FROM work_schedules 
    WHERE user_id = user_email 
      AND year = target_year 
      AND month = target_month;
    
    -- 요일 계산
    SET target_day_of_week = CASE DAYOFWEEK(half_day_date)
        WHEN 2 THEN 1 WHEN 3 THEN 2 WHEN 4 THEN 3 
        WHEN 5 THEN 4 WHEN 6 THEN 5 ELSE NULL
    END;
    
    IF target_day_of_week IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '반차는 평일에만 신청할 수 있습니다.';
    END IF;
    
    SET base_off_day = JSON_EXTRACT(current_work_days, '$.base_off_day');
    
    -- 휴무일에 반차 신청 불가
    IF target_day_of_week = base_off_day THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '기본 휴무일에는 반차를 신청할 수 없습니다.';
    END IF;
    
    -- 반차 처리
    SET updated_work_days = JSON_SET(
        current_work_days,
        CONCAT('$.days.', target_day_of_week), 
        CASE half_day_type 
            WHEN 'MORNING' THEN 'afternoon'
            WHEN 'AFTERNOON' THEN 'morning'
        END
    );
    
    -- 계획된 반차: 휴무일도 반일 근무로 변경
    -- 긴급 반차: 차주 보충으로 처리
    IF NOT is_emergency THEN
        SET updated_work_days = JSON_SET(
            updated_work_days,
            CONCAT('$.days.', base_off_day), 
            CASE half_day_type 
                WHEN 'MORNING' THEN 'morning'
                WHEN 'AFTERNOON' THEN 'afternoon'
            END
        );
    ELSE
        SET updated_work_days = JSON_SET(
            updated_work_days,
            '$.requires_next_week_compensation', true
        );
    END IF;
    
    -- 반차 상세 정보 추가
    SET updated_work_days = JSON_SET(
        updated_work_days,
        CONCAT('$.half_day_details.', target_day_of_week),
        JSON_OBJECT(
            'date', half_day_date,
            'type', half_day_type,
            'reason', reason,
            'is_emergency', is_emergency,
            'applied_at', NOW()
        )
    );
    
    -- 스케줄 업데이트
    UPDATE work_schedules 
    SET work_days = updated_work_days,
        status = 'ADJUSTMENT_PENDING'
    WHERE id = schedule_id;
    
    -- leaves 테이블에 반차 기록
    INSERT INTO leaves (
        user_id, leave_type, start_date, end_date, 
        days_count, reason, status
    ) VALUES (
        user_email, 
        CASE half_day_type WHEN 'MORNING' THEN 'HALF_AM' ELSE 'HALF_PM' END,
        half_day_date, half_day_date,
        0.5, reason, 'PENDING'
    );
    
    SELECT JSON_OBJECT(
        'success', true,
        'message', '반차 신청이 완료되었습니다.',
        'compensation_method', CASE 
            WHEN is_emergency THEN '차주 휴무일 보충' 
            ELSE '당주 휴무일 조정' 
        END
    ) as result;
    
END //
DELIMITER ;
```

## 6. 시스템 운영 프로세스

### 6.1 시스템 도입 시 (최초 1회만)
1. **초기 선택 공지**: 모든 4일제 직원에게 선호 휴무일 선택 요청
2. **개인별 선택**: 각자 원하는 휴무일 1개 선택 (월~금 중)
3. **밸런스 체크**: 시스템이 부서별 인력 균형 자동 확인
4. **관리자 조정**: 심각한 불균형 시에만 일부 직원과 협의
5. **기준점 설정**: 선택 완료 후 개인별 시프트 기준점 확정

### 6.2 정상 운영 시 (도입 후 매월)
1. **자동 스케줄 생성**: 매월 20일에 개인별 시프트에 따른 스케줄 자동 생성
2. **즉시 승인**: 별도 검토 없이 자동 승인 (공정성 이미 보장)
3. **반차 신청**: 계획된/긴급 상황별로 처리
4. **최종 확정**: 첫 번째 월요일 전까지 모든 스케줄 확정

## 7. API 설계 (work-schedules 라우터 통합)

### 7.1 라우터 구조
```
기존 server.js에 추가:
app.use('/api/staff', require('./routes/staff/work-schedules'));

모든 4일제 시스템 API는 /api/staff/work-schedules/* 하위에 구성
```

### 7.2 API 엔드포인트 전체

#### 🔧 시스템 도입 관련 (관리자 전용)
```
POST   /api/staff/work-schedules/initial-setup          // 초기 선택 모드 활성화
GET    /api/staff/work-schedules/initial-status         // 초기 선택 진행 현황
POST   /api/staff/work-schedules/adjust-initial-balance // 초기 밸런스 조정
```

#### 👤 직원용 API
```
POST   /api/staff/work-schedules/select-initial-off-day // 최초 휴무일 선택
GET    /api/staff/work-schedules/my-schedule/:year/:month // 내 월별 스케줄 조회
GET    /api/staff/work-schedules/my-rotation             // 내 시프트 순환 패턴 조회
POST   /api/staff/work-schedules/half-day                // 반차 신청
GET    /api/staff/work-schedules/my-half-days/:year/:month // 내 반차 사용 현황
```

#### 👨‍💼 관리자용 API
```
GET    /api/staff/work-schedules/team/:year/:month       // 팀 월별 스케줄 현황
GET    /api/staff/work-schedules/pending-approvals      // 반차 승인 대기 목록
POST   /api/staff/work-schedules/approve/:leaveId       // 반차 승인/거부
GET    /api/staff/work-schedules/department-balance     // 부서별 인력 균형 현황
GET    /api/staff/work-schedules/compensation-needed    // 차주 보충 필요 현황
```

#### ⚙️ 시스템 관리용 API
```
POST   /api/staff/work-schedules/generate/:year/:month   // 월별 스케줄 자동 생성
GET    /api/staff/work-schedules/system-stats           // 시스템 운영 통계
POST   /api/staff/work-schedules/bulk-approve           // 일괄 승인
GET    /api/staff/work-schedules/logs                   // 스케줄 변경 이력
```

### 7.3 권한 체계

#### 미들웨어 구조
```javascript
// 기본 인증
requireAuth()

// 역할별 권한
requireRole(['EMPLOYEE'])           // 직원
requireRole(['DEPT_MANAGER'])       // 부서 관리자  
requireRole(['SYSTEM_ADMIN'])       // 시스템 관리자
requireRole(['SUPER_ADMIN'])        // 최고 관리자

// 본인 데이터만 접근
requireOwnership()                  // 본인 스케줄만 조회/수정

// 부서 권한
requireDepartmentAccess()           // 본인 부서만 접근
```

#### 권한별 접근 범위
- **EMPLOYEE**: 본인 스케줄 조회/반차신청만
- **DEPT_MANAGER**: 본인 부서 스케줄 관리 + 반차 승인
- **SYSTEM_ADMIN**: 전체 스케줄 관리 + 시스템 설정  
- **SUPER_ADMIN**: 모든 권한 + 초기 설정

### 7.4 주요 API 상세

#### 반차 신청 API
```http
POST /api/staff/work-schedules/half-day
Authorization: Bearer {token}
Content-Type: application/json

{
    "year": 2025,
    "month": 1,
    "half_day_date": "2025-01-15",
    "half_day_type": "AFTERNOON",
    "is_emergency": false,
    "reason": "병원 방문"
}

Response:
{
    "success": true,
    "message": "반차 신청이 완료되었습니다.",
    "data": {
        "compensation_method": "당주 휴무일 조정",
        "affected_days": {
            "half_day": "2025-01-15 (수요일 오후)",
            "compensation": "2025-01-17 (금요일 오후)"
        },
        "total_hours": 32
    }
}
```

#### 팀 스케줄 조회 API
```http
GET /api/staff/work-schedules/team/2025/1
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "year": 2025,
        "month": 1,
        "first_monday": "2025-01-06",
        "team_info": {
            "department_name": "개발팀",
            "total_employees": 10,
            "four_day_employees": 8
        },
        "daily_coverage": {
            "Monday": { "count": 7, "rate": 87.5 },
            "Tuesday": { "count": 6, "rate": 75.0 },
            "Wednesday": { "count": 8, "rate": 100.0 },
            "Thursday": { "count": 7, "rate": 87.5 },
            "Friday": { "count": 6, "rate": 75.0 }
        },
        "employees": [
            {
                "name": "김철수",
                "email": "kim@company.com",
                "base_off_day": "Friday",
                "schedule": {
                    "1": "full", "2": "full", "3": "full", 
                    "4": "full", "5": "off"
                },
                "half_days": [
                    {
                        "date": "2025-01-15",
                        "type": "afternoon",
                        "status": "approved"
                    }
                ]
            }
        ]
    }
}
```

### 7.5 에러 코드 정의
```javascript
const ERROR_CODES = {
    // 인증/권한 오류
    UNAUTHORIZED: { code: 401, message: '로그인이 필요합니다.' },
    FORBIDDEN: { code: 403, message: '권한이 없습니다.' },
    
    // 스케줄 관련 오류
    SCHEDULE_NOT_FOUND: { code: 404, message: '스케줄을 찾을 수 없습니다.' },
    INITIAL_CHOICE_DUPLICATE: { code: 400, message: '이미 초기 선택을 완료했습니다.' },
    INVALID_OFF_DAY: { code: 400, message: '유효하지 않은 휴무일입니다.' },
    WEEKEND_HALF_DAY: { code: 400, message: '반차는 평일에만 신청할 수 있습니다.' },
    OFF_DAY_HALF_DAY: { code: 400, message: '기본 휴무일에는 반차를 신청할 수 없습니다.' },
    
    // 시스템 오류
    DATABASE_ERROR: { code: 500, message: '데이터베이스 오류가 발생했습니다.' },
    CALCULATION_ERROR: { code: 500, message: '시프트 계산 중 오류가 발생했습니다.' }
};
```

### 7.6 응답 포맷 표준화
```javascript
// 성공 응답
{
    "success": true,
    "data": { ... },
    "message": "작업이 완료되었습니다."
}

// 실패 응답  
{
    "success": false,
    "error": {
        "code": "INVALID_OFF_DAY",
        "message": "유효하지 않은 휴무일입니다.",
        "details": { ... }
    }
}

// 페이징 응답
{
    "success": true,
    "data": [...],
    "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_items": 50,
        "items_per_page": 10
    }
}
```

## 8. 화면 설계

### 8.1 직원용 화면
- **내 스케줄**: 자동 생성된 월간 스케줄 조회
- **시프트 패턴**: 내 개인 순환 패턴 확인 (5개월 미리보기)  
- **반차 신청**: 계획/긴급 구분하여 신청

### 8.2 관리자용 화면
- **팀 스케줄**: 자동 균형 잡힌 팀 현황 조회
- **반차 승인**: 직원 반차 요청 승인/거부
- **보충 관리**: 긴급 반차로 인한 차주 보충 현황

## 9. 구현 계획

### Phase 1: 초기 선택 시스템 (2주)
- 초기 휴무일 선택 기능
- 부서별 밸런스 체크 로직
- 개인별 시프트 기준점 설정

### Phase 2: 자동 시프트 시스템 (2주)  
- 개인별 시프트 계산 로직
- 월별 자동 스케줄 생성
- 반차 신청 및 처리 기능

### Phase 3: 화면 및 완성도 (2주)
- 직원/관리자 대시보드
- 모바일 반응형 적용
- 테스트 및 안정화

**총 6주 개발 완료**

## 10. 기대 효과

### 10.1 직원 관점
- **워크라이프밸런스**: 주 4일 32시간 근무로 개인 시간 확보
- **공정성**: 장기적으로 모든 요일 휴무를 동등하게 경험
- **유연성**: 반차 제도로 개인 상황에 맞는 조정
- **예측 가능성**: 몇 개월 앞까지 미리 계획 수립 가능

### 10.2 회사 관점  
- **서비스 연속성**: 월~금 정상 운영 100% 유지
- **인력 효율성**: 자동화된 시프트로 최적 배치
- **관리 효율성**: 도입 후 거의 모든 것이 자동화
- **직원 만족도**: 혁신적 근무제로 인재 확보

---

**다음 단계: 실제 구현을 위한 상세 기술 스펙 작성 또는 프로토타입 개발**
프론트엔드 → 백엔드 → DB 순서가 훨씬 효율적인 이유:
1. 사용자 중심 개발

실제 사용할 화면을 먼저 보면서 개발
사용성 문제를 조기에 발견 가능
직관적인 UI/UX 설계

2. 요구사항 명확화

화면을 만들면서 필요한 데이터가 명확해짐
API 스펙이 자연스럽게 정해짐
불필요한 기능 개발 방지

3. 빠른 프로토타이핑

목업 데이터로 화면 먼저 완성
실제 동작하는 것처럼 시연 가능
피드백 수렴이 빠름

4. 개발 효율성

백엔드는 프론트에서 정의된 스펙대로만 구현
DB는 백엔드에서 필요한 데이터만 설계
과도한 설계나 불필요한 최적화 방지


직원용 메인: 내 스케줄 캘린더 + 반차 신청 버튼
관리자용 대시보드: 팀 현황 매트릭스 + 승인 대기 목록
초기 선택 화면: 휴무일 선택 인터페이스 (도입 시만)

어떤 화면부터 먼저 작업하시겠어요?
개인적으로는 1번 직원용 메인 화면부터 시작하는 게 좋을 것 같습니다.

가장 자주 사용되는 화면
다른 화면들의 기본이 되는 구조
캘린더 컴포넌트 먼저 만들면 다른 곳에서도 재사용 가능
Option 1: API 연동부터 완성 (백엔드가 준비되면)
Option 2: 관리자 화면 먼저 만들기 (프론트엔드 완성)
Option 3: 동적 캘린더 로직 구현 (클라이언트 로직)
manager-dashboard.html - 관리자용 (새로 만들 화면)