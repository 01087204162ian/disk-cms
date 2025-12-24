# 주4일 근무제 데이터베이스 스키마 분석

**작성일**: 2025-01-XX  
**목적**: 실제 DB 스키마와 운영 원칙 비교 분석

---

## 📊 실제 스키마 vs 설계 요구사항 비교

### 1. users 테이블

#### ✅ 이미 존재하는 필드

| 필드명 | 타입 | 상태 | 비고 |
|--------|------|------|------|
| `hire_date` | DATE | ✅ 존재 | 수습 기간 계산용 (이미 있음!) |
| `work_schedule` | ENUM('4_DAY', ...) | ✅ 존재 | 4일제 여부 확인 |

#### ⚠️ 추가 필요 필드

| 필드명 | 타입 | 필요성 | 비고 |
|--------|------|--------|------|
| `work_days` | JSON | ⚠️ **추가 필요** | 개인 시프트 정보 저장 |

**필요한 ALTER TABLE**:
```sql
ALTER TABLE `users` 
ADD COLUMN `work_days` json DEFAULT NULL 
COMMENT '개인 시프트 정보: {"base_off_day": 2, "cycle_start_date": "2025-01-06", "initial_selection_date": "2025-01-06"}' 
AFTER `work_schedule`;
```

**work_days JSON 구조**:
```json
{
  "base_off_day": 2,                    // 초기 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)
  "cycle_start_date": "2025-01-06",     // 4주 주기 시작일
  "initial_selection_date": "2025-01-06" // 최초 선택일
}
```

---

### 2. work_schedules 테이블

#### ✅ 이미 존재하는 필드

| 필드명 | 타입 | 상태 | 비고 |
|--------|------|------|------|
| `work_days` | JSON | ✅ 존재 | 근무 요일 정보 저장 |
| `shift_week` | INT | ✅ 존재 | [DEPRECATED] 4주 주기로 대체됨 |

#### ⚠️ 추가 필요 필드

| 필드명 | 타입 | 필요성 | 비고 |
|--------|------|--------|------|
| `temporary_change` | JSON | ⚠️ **추가 필요** | 일시적 휴무일 변경 정보 |

**필요한 ALTER TABLE**:
```sql
ALTER TABLE `work_schedules` 
ADD COLUMN `temporary_change` json DEFAULT NULL 
COMMENT '특정 주의 일시적 휴무일 변경 정보' 
AFTER `work_days`;
```

**temporary_change JSON 구조** (해당 주에 일시적 변경이 있는 경우):
```json
{
  "week_start_date": "2025-01-06",
  "original_off_day": 2,
  "temporary_off_day": 5,
  "changed_by": "kim@example.com",
  "approved_by": "manager@example.com",
  "approval_date": "2025-01-05",
  "reason": "개인 사정",
  "substitute_employee": "lee@example.com"
}
```

**work_days JSON 구조** (기존 필드 활용):
```json
{
  "base_off_day": 2,                    // 이번 주기 기본 휴무일
  "days": {
    "1": "full",     // 월: 종일(8h)
    "2": "off",      // 화: 휴무 (기본)
    "3": "full",     // 수: 종일(8h)
    "4": "full",     // 목: 종일(8h)
    "5": "full"      // 금: 종일(8h)
  },
  "total_hours": 32,
  "work_days_count": 4
}
```

#### 📝 참고사항

- `shift_week` 필드는 기존 데이터와의 호환성을 위해 유지하되, 새로운 로직에서는 사용하지 않음
- 4주 주기 계산은 `users.work_days.cycle_start_date` 기준으로 계산

---

### 3. leaves 테이블

#### ✅ 완벽하게 준비됨

| 필드명 | 타입 | 상태 | 비고 |
|--------|------|------|------|
| `leave_type` | ENUM('HALF_AM', 'HALF_PM', ...) | ✅ 존재 | 반차 타입 지원 |
| `substitute_user_id` | VARCHAR(100) | ✅ 존재 | 대체자 지정 가능 |
| `status` | ENUM('PENDING', 'APPROVED', ...) | ✅ 존재 | 승인 상태 관리 |

**추가 개발 필요**: 같은 주(월~일) 내에서만 반차 사용 가능하도록 검증 로직 추가

---

### 4. departments 테이블

#### ✅ 완벽하게 준비됨

모든 필요한 필드가 존재하며 추가 작업 불필요

---

### 5. holidays 테이블

#### ✅ 완벽하게 준비됨

| 필드명 | 타입 | 상태 | 비고 |
|--------|------|------|------|
| `holiday_date` | DATE | ✅ 존재 | 공휴일 날짜 |
| `name` | VARCHAR(100) | ✅ 존재 | 공휴일명 |
| `year` | INT | ✅ 존재 | 연도별 조회 |
| `is_active` | TINYINT | ✅ 존재 | 활성 여부 |

**공휴일 포함 주 감지 로직 구현 가능**

---

### 6. schedule_changes 테이블

#### ❌ 신규 생성 필요

일시적 휴무일 변경 이력을 관리하기 위한 신규 테이블

**CREATE TABLE**:
```sql
CREATE TABLE `schedule_changes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int NOT NULL,
  `user_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `week_start_date` date NOT NULL COMMENT '해당 주 시작일 (월요일)',
  `original_off_day` int NOT NULL COMMENT '원래 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)',
  `temporary_off_day` int NOT NULL COMMENT '임시 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)',
  `reason` text COLLATE utf8mb4_unicode_ci COMMENT '변경 사유',
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `requested_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approved_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approval_date` datetime DEFAULT NULL,
  `substitute_employee` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '업무 대체자',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_week` (`user_id`,`week_start_date`),
  KEY `idx_status` (`status`),
  KEY `idx_schedule_id` (`schedule_id`),
  CONSTRAINT `schedule_changes_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `work_schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedule_changes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`email`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `schedule_changes_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `users` (`email`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `schedule_changes_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`email`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `schedule_changes_ibfk_5` FOREIGN KEY (`substitute_employee`) REFERENCES `users` (`email`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='휴무일 일시적 변경 이력';
```

---

## 📋 마이그레이션 요약

### 필요한 작업

1. **users 테이블 수정** (1개 필드 추가)
   - `work_days` JSON 필드 추가

2. **work_schedules 테이블 수정** (1개 필드 추가)
   - `temporary_change` JSON 필드 추가

3. **schedule_changes 테이블 생성** (신규)
   - 일시적 변경 이력 관리

### 마이그레이션 SQL 스크립트

```sql
-- ============================================================
-- 주4일 근무제 시스템 마이그레이션
-- ============================================================

-- 1. users 테이블에 work_days 필드 추가
ALTER TABLE `users` 
ADD COLUMN `work_days` json DEFAULT NULL 
COMMENT '개인 시프트 정보: {"base_off_day": 2, "cycle_start_date": "2025-01-06", "initial_selection_date": "2025-01-06"}' 
AFTER `work_schedule`;

-- 2. work_schedules 테이블에 temporary_change 필드 추가
ALTER TABLE `work_schedules` 
ADD COLUMN `temporary_change` json DEFAULT NULL 
COMMENT '특정 주의 일시적 휴무일 변경 정보' 
AFTER `work_days`;

-- 3. schedule_changes 테이블 생성
CREATE TABLE `schedule_changes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int NOT NULL,
  `user_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `week_start_date` date NOT NULL COMMENT '해당 주 시작일 (월요일)',
  `original_off_day` int NOT NULL COMMENT '원래 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)',
  `temporary_off_day` int NOT NULL COMMENT '임시 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)',
  `reason` text COLLATE utf8mb4_unicode_ci COMMENT '변경 사유',
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `requested_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approved_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approval_date` datetime DEFAULT NULL,
  `substitute_employee` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '업무 대체자',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_week` (`user_id`,`week_start_date`),
  KEY `idx_status` (`status`),
  KEY `idx_schedule_id` (`schedule_id`),
  KEY `idx_requested_by` (`requested_by`),
  KEY `idx_approved_by` (`approved_by`),
  KEY `idx_substitute` (`substitute_employee`),
  CONSTRAINT `schedule_changes_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `work_schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedule_changes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`email`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `schedule_changes_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `users` (`email`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `schedule_changes_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`email`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `schedule_changes_ibfk_5` FOREIGN KEY (`substitute_employee`) REFERENCES `users` (`email`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='휴무일 일시적 변경 이력';
```

---

## ✅ 호환성 분석 결과

### 완벽하게 준비된 부분

1. ✅ **holidays 테이블** - 공휴일 처리 완벽 지원
2. ✅ **leaves 테이블** - 반차 시스템 완벽 지원
3. ✅ **departments 테이블** - 부서 관리 완벽 지원
4. ✅ **users.hire_date** - 수습 기간 계산 가능

### 추가 개발 필요 부분

1. ⚠️ **users.work_days** - JSON 필드 추가 필요
2. ⚠️ **work_schedules.temporary_change** - JSON 필드 추가 필요
3. ❌ **schedule_changes 테이블** - 신규 생성 필요

### 사용하지 않을 부분

- `work_schedules.shift_week` - 4주 주기로 대체되어 더 이상 사용하지 않음 (데이터 보존을 위해 DROP하지 않음)

---

## 🎯 결론

현재 스키마는 새로운 운영 원칙을 지원하기 위해 **최소한의 변경**만 필요합니다:

1. **2개 필드 추가** (users.work_days, work_schedules.temporary_change)
2. **1개 테이블 생성** (schedule_changes)

대부분의 인프라는 이미 준비되어 있어, 빠르게 마이그레이션 가능합니다.

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

