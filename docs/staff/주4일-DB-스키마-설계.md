# 주 4일 근무제 데이터베이스 스키마 설계

**작성일**: 2025-12-28  
**버전**: 1.0  
**목적**: 4주 단위 운영 + 타임존 기준 명확화

---

## 1. 기존 스키마 확인

### 1.1 users 테이블
```sql
CREATE TABLE users (
  email varchar(100) PRIMARY KEY,
  name varchar(50) NOT NULL,
  password varchar(255) NOT NULL,
  phone varchar(20),
  employee_id varchar(20) UNIQUE,
  department_id int,
  position varchar(50),
  hire_date date,
  role enum('SUPER_ADMIN','DEPT_MANAGER','SYSTEM_ADMIN','EMPLOYEE') DEFAULT 'EMPLOYEE',
  work_type enum('FULL_TIME','PART_TIME','CONTRACT') DEFAULT 'FULL_TIME',
  work_schedule enum('4_DAY','FLEXIBLE','STANDARD') DEFAULT '4_DAY',
  work_days json DEFAULT NULL COMMENT '주4일 근무제 정보',
  last_login_at timestamp NULL,
  is_active tinyint DEFAULT '1',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

**work_days JSON 구조**:
```json
{
  "base_off_day": 5,  // 1=월, 2=화, 3=수, 4=목, 5=금
  "cycle_start_date": "2025-01-06",  // KST 기준 (DATE 형식)
  "initial_selection_date": "2025-01-06"  // 최초 선택일 (DATE 형식)
}
```

### 1.2 work_schedules 테이블
```sql
CREATE TABLE work_schedules (
  id int AUTO_INCREMENT PRIMARY KEY,
  user_id varchar(100) NOT NULL,
  year int NOT NULL,
  month int NOT NULL,
  work_days json DEFAULT NULL COMMENT '근무 요일 정보',
  temporary_change json DEFAULT NULL COMMENT '일시적 휴무일 변경 정보',
  status enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  requested_at timestamp DEFAULT CURRENT_TIMESTAMP,
  approved_by varchar(100),
  approved_at timestamp NULL,
  rejection_reason text,
  shift_week int COMMENT '시프트 주차 (DEPRECATED - 4주 주기로 대체)',
  is_shift_month tinyint(1) DEFAULT '0',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_month (user_id, year, month),
  FOREIGN KEY (user_id) REFERENCES users(email) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(email) ON DELETE SET NULL
);
```

**temporary_change JSON 구조**:
```json
{
  "week_start_date": "2025-12-15",  // KST 기준 (DATE 형식)
  "original_off_day": 5,  // 원래 휴무일 (1-5)
  "temporary_off_day": 3,  // 임시 휴무일 (1-5)
  "reason": "개인 사정",
  "substitute_employee": "substitute@example.com",
  "changed_by": "user@example.com",
  "approved_by": "manager@example.com",
  "approval_date": "2025-12-14"  // KST 기준
}
```

### 1.3 schedule_changes 테이블
```sql
CREATE TABLE schedule_changes (
  id int AUTO_INCREMENT PRIMARY KEY,
  schedule_id int NOT NULL,
  user_id varchar(100) NOT NULL,
  week_start_date date NOT NULL COMMENT '해당 주 시작일 (월요일, KST)',
  original_off_day int NOT NULL COMMENT '원래 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)',
  temporary_off_day int NOT NULL COMMENT '임시 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)',
  reason text COMMENT '변경 사유',
  status enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  requested_by varchar(100) NOT NULL,
  approved_by varchar(100),
  approval_date datetime DEFAULT NULL COMMENT '승인일시 (KST)',
  substitute_employee varchar(100) COMMENT '업무 대체자',
  rejection_reason text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES work_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(email) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(email) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(email) ON DELETE SET NULL,
  FOREIGN KEY (substitute_employee) REFERENCES users(email) ON DELETE SET NULL,
  KEY idx_user_week (user_id, week_start_date),
  KEY idx_status (status)
);
```

### 1.4 leaves 테이블
```sql
CREATE TABLE leaves (
  id int AUTO_INCREMENT PRIMARY KEY,
  user_id varchar(100),
  leave_type enum('ANNUAL','HALF_AM','HALF_PM','SICK','SPECIAL') NOT NULL,
  start_date date NOT NULL COMMENT '시작일 (KST)',
  end_date date NOT NULL COMMENT '종료일 (KST)',
  days_count decimal(3,1) NOT NULL COMMENT '휴가 일수 (0.5일 단위)',
  reason text NOT NULL COMMENT '휴가 사유',
  status enum('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  approved_by varchar(100),
  approved_at timestamp NULL COMMENT '승인일시 (KST)',
  rejection_reason text,
  substitute_user_id varchar(100),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(email) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(email) ON DELETE SET NULL,
  FOREIGN KEY (substitute_user_id) REFERENCES users(email) ON DELETE SET NULL,
  KEY idx_user_dates (user_id, start_date, end_date),
  KEY idx_status (status),
  KEY idx_leave_type (leave_type)
);
```

### 1.5 holidays 테이블
```sql
CREATE TABLE holidays (
  id int AUTO_INCREMENT PRIMARY KEY,
  holiday_date date NOT NULL COMMENT '공휴일 (KST)',
  name varchar(100) NOT NULL COMMENT '공휴일명',
  year int NOT NULL,
  is_active tinyint DEFAULT '1',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date (holiday_date),
  KEY idx_year (year)
);
```

---

## 2. 스키마 수정 사항

### 2.1 users 테이블
**확인 사항**: `work_days` JSON 필드가 이미 존재하는지 확인 필요

**필요 시 추가**:
```sql
-- work_days 필드가 없을 경우에만 실행
ALTER TABLE users 
ADD COLUMN work_days JSON DEFAULT NULL 
COMMENT '주4일 근무제 정보: {base_off_day, cycle_start_date, initial_selection_date}';
```

### 2.2 work_schedules 테이블
**확인 사항**: `temporary_change` JSON 필드가 이미 존재하는지 확인 필요

**필요 시 추가**:
```sql
-- temporary_change 필드가 없을 경우에만 실행
ALTER TABLE work_schedules 
ADD COLUMN temporary_change JSON DEFAULT NULL 
COMMENT '일시적 휴무일 변경 정보';
```

### 2.3 schedule_changes 테이블
**확인 사항**: 테이블이 이미 존재하는지 확인 필요

**필요 시 생성**:
```sql
-- 테이블이 없을 경우에만 실행
CREATE TABLE IF NOT EXISTS schedule_changes (
  -- 위의 CREATE TABLE 문 참조
);
```

---

## 3. 타임존 처리 규칙

### 3.1 데이터베이스 타임존 설정
```sql
-- MySQL/MariaDB 타임존 설정 확인
SELECT @@global.time_zone, @@session.time_zone;

-- 필요 시 KST로 설정
SET GLOBAL time_zone = '+09:00';
SET SESSION time_zone = '+09:00';
```

### 3.2 날짜 저장 규칙
- **DATE 타입**: KST 기준 날짜만 저장 (예: `2025-01-06`)
- **DATETIME/TIMESTAMP 타입**: UTC로 저장하되, 애플리케이션에서 KST로 변환하여 사용
- **JSON 필드의 날짜**: 문자열로 저장 (예: `"2025-01-06"`)

### 3.3 날짜 비교 규칙
- 모든 날짜 비교는 **KST 기준**으로 수행
- 서버에서 날짜를 계산할 때 명시적으로 KST 시간대 사용

---

## 4. 인덱스 최적화

### 4.1 users 테이블
```sql
-- work_days JSON 필드 인덱스 (MySQL 5.7+)
ALTER TABLE users 
ADD INDEX idx_work_days ((CAST(work_days->'$.base_off_day' AS UNSIGNED)));
```

### 4.2 work_schedules 테이블
```sql
-- year, month 조합 인덱스 (이미 존재할 수 있음)
CREATE INDEX IF NOT EXISTS idx_year_month ON work_schedules(year, month);
```

### 4.3 schedule_changes 테이블
```sql
-- user_id, week_start_date 조합 인덱스 (이미 존재할 수 있음)
CREATE INDEX IF NOT EXISTS idx_user_week ON schedule_changes(user_id, week_start_date);
```

### 4.4 leaves 테이블
```sql
-- user_id, start_date, end_date 조합 인덱스 (이미 존재할 수 있음)
CREATE INDEX IF NOT EXISTS idx_user_dates ON leaves(user_id, start_date, end_date);
```

### 4.5 holidays 테이블
```sql
-- year 인덱스 (이미 존재할 수 있음)
CREATE INDEX IF NOT EXISTS idx_year ON holidays(year);
```

---

## 5. 데이터 무결성 규칙

### 5.1 users.work_days
- `base_off_day`: 1-5 범위 내 값만 허용
- `cycle_start_date`: 유효한 날짜 형식 (YYYY-MM-DD)
- `initial_selection_date`: 유효한 날짜 형식 (YYYY-MM-DD)

### 5.2 schedule_changes
- `original_off_day`, `temporary_off_day`: 1-5 범위 내 값만 허용
- `week_start_date`: 항상 월요일이어야 함

### 5.3 leaves
- `start_date` <= `end_date`
- `days_count` >= 0.5 (반차 최소 단위)

---

## 6. 마이그레이션 체크리스트

### 6.1 기존 데이터 확인
```sql
-- users 테이블에 work_days 필드가 있는지 확인
SHOW COLUMNS FROM users LIKE 'work_days';

-- work_schedules 테이블에 temporary_change 필드가 있는지 확인
SHOW COLUMNS FROM work_schedules LIKE 'temporary_change';

-- schedule_changes 테이블이 존재하는지 확인
SHOW TABLES LIKE 'schedule_changes';
```

### 6.2 필요한 필드/테이블 추가
- [ ] `users.work_days` 필드 추가 (없을 경우)
- [ ] `work_schedules.temporary_change` 필드 추가 (없을 경우)
- [ ] `schedule_changes` 테이블 생성 (없을 경우)

### 6.3 인덱스 추가
- [ ] `users.work_days` JSON 인덱스 추가
- [ ] `work_schedules.year, month` 인덱스 확인
- [ ] `schedule_changes.user_id, week_start_date` 인덱스 확인
- [ ] `leaves.user_id, start_date, end_date` 인덱스 확인
- [ ] `holidays.year` 인덱스 확인

---

## 7. 샘플 데이터

### 7.1 users.work_days 샘플
```json
{
  "base_off_day": 5,
  "cycle_start_date": "2025-01-06",
  "initial_selection_date": "2025-01-06"
}
```

### 7.2 work_schedules.temporary_change 샘플
```json
{
  "week_start_date": "2025-12-15",
  "original_off_day": 5,
  "temporary_off_day": 3,
  "reason": "개인 사정으로 인한 일시적 변경",
  "substitute_employee": "substitute@example.com",
  "changed_by": "user@example.com",
  "approved_by": "manager@example.com",
  "approval_date": "2025-12-14"
}
```

### 7.3 holidays 샘플
```sql
INSERT INTO holidays (holiday_date, name, year, is_active) VALUES
('2025-01-01', '신정', 2025, 1),
('2025-12-25', '크리스마스', 2025, 1),
('2026-01-01', '신정', 2026, 1);
```

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-12-28

