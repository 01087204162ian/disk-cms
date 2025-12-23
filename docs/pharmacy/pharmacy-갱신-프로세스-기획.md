# 약국배상책임보험 갱신 프로세스 기획서

**작성일**: 2025-01-XX  
**버전**: 1.0

---

## 📋 목차

1. [갱신 프로세스 개요](#갱신-프로세스-개요)
2. [갱신 프로세스 흐름](#갱신-프로세스-흐름)
3. [데이터베이스 설계](#데이터베이스-설계)
4. [API 엔드포인트 설계](#api-엔드포인트-설계)
5. [프론트엔드 화면 설계](#프론트엔드-화면-설계)
6. [구현 단계](#구현-단계)

---

## 갱신 프로세스 개요

### 목적
약국배상책임보험 계약 만료 전 갱신을 통해 계약을 연장하고, 기존 계약 정보를 기반으로 신규 계약을 생성합니다.

### 갱신 대상
- **상태**: 증권발급(14), 계약완료(6) 상태의 계약
- **만료 예정일**: 보험 종기(`jeonggi`) 기준 **45일 전** 조회
- **자동 처리**: 갱신 대상 조회 시 자동으로 갱신 청약 생성 (INSERT)

### 갱신 프로세스 단계
1. **갱신 대상 조회**: 만료 예정 계약 목록 조회 (45일 전)
   - 조회하는 순간 자동으로 갱신 청약 INSERT (신규 신청과 동일한 구조)
2. **갱신 계약 승인**: 업체가 승인하면 신규와 동일한 프로세스로 진행
   - 보험료 계산 및 승인
   - 예치금 차감
   - 정산 기록 생성
   - 증권 발급
3. **기존 계약 연결**: 기존 계약과 갱신 계약 연결 정보 저장

---

## 갱신 프로세스 흐름

### 1. 갱신 대상 조회 & 자동 갱신 청약 생성 (45일 전)

```
[갱신 대상 조회]
    ↓
조건:
- ch IN ('6', '14')  // 계약완료, 증권발급
- jeonggi BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 45 DAY)  // 45일 이내 만료
- renewal IS NULL OR renewal = '0'  // 아직 갱신 안내 안 함
    ↓
[갱신 대상 목록 반환]
    ↓
[조회 시점에 갱신 청약 자동 INSERT]
- 조건을 만족하는 건은 조회 즉시 갱신 청약을 신규 INSERT (신규 신청과 동일한 구조)
- 신규 레코드 기본값:
  - ch='1'(접수) 기본, 필요 시 바로 ch='13'(승인)까지 가능
  - renewal='2'(갱신 계약)
  - previousCertiNum = 원본 num
  - sigi = 기존 jeonggi + 1일
  - jeonggi = 신규 sigi + 1년
- 생성된 갱신 청약 num을 원본 계약의 nextRenewalNum에 기록
    ↓
[거래처 확인 단계]
- 거래처가 갱신 거부: 보험사 청약 미진행, 갱신 청약은 보류/취소 처리
- 거래처가 갱신 진행: 이후 단계(보험료 계산/승인/증권) 신규와 동일하게 진행
```

### 2. 갱신 계약 승인 (신규와 동일한 프로세스)

```
[갱신 청약 선택]
    ↓
[업체 승인 처리]
- 기존 승인 프로세스와 동일하게 진행
- 보험료 계산 (pharmacy-premium-calculate.php 또는 pharmacy-premium-calculate-ubcare.php)
- 예치금 충분성 확인
- 예치금 차감
- 정산 기록 생성 (pharmacy_settlementList)
- 상태 업데이트 (ch = '13' 승인)
    ↓
[증권 발급]
- 증권번호 입력 시 증권 발급 프로세스 진행
- 상태 업데이트 (ch = '14' 증권발급)
    ↓
[갱신 완료]
```

**중요**: 갱신 계약 승인은 기존 `pharmacy-status-update.php`의 승인(13) 처리 로직을 그대로 사용합니다.

---

## 데이터베이스 설계

### pharmacyApply 테이블 추가 필드

```sql
-- 갱신 관련 필드 추가 (ALTER TABLE)
ALTER TABLE pharmacyApply 
ADD COLUMN renewal CHAR(1) DEFAULT '0' COMMENT '갱신 상태: 0=미갱신, 2=갱신청약생성완료',
ADD COLUMN previousCertiNum INT(11) DEFAULT NULL COMMENT '갱신 전 계약 번호',
ADD COLUMN nextRenewalNum INT(11) DEFAULT NULL COMMENT '갱신 후 계약 번호',
ADD INDEX idx_renewal (renewal),
ADD INDEX idx_previousCertiNum (previousCertiNum),
ADD INDEX idx_nextRenewalNum (nextRenewalNum),
ADD INDEX idx_jeonggi_renewal (jeonggi, renewal);
```

### 필드 설명

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `renewal` | CHAR(1) | 갱신 상태<br>- '0': 미갱신<br>- '2': 갱신 청약 생성 완료 |
| `previousCertiNum` | INT(11) | 갱신 전 계약 번호 (갱신 계약인 경우) |
| `nextRenewalNum` | INT(11) | 갱신 후 계약 번호 (기존 계약인 경우) |

### 갱신 이력 테이블 (선택사항)

```sql
CREATE TABLE pharmacy_renewal_history (
    num INT(11) NOT NULL AUTO_INCREMENT,
    original_contract_num INT(11) NOT NULL COMMENT '원본 계약 번호',
    renewal_contract_num INT(11) NOT NULL COMMENT '갱신 계약 번호',
    renewal_date DATETIME NOT NULL COMMENT '갱신일',
    renewal_type CHAR(1) DEFAULT '1' COMMENT '갱신 유형: 1=정기갱신, 2=조기갱신',
    wdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (num),
    INDEX idx_original (original_contract_num),
    INDEX idx_renewal (renewal_contract_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='갱신 이력 테이블';
```

---

## API 엔드포인트 설계

### 1. 갱신 대상 조회 및 자동 청약 생성

```
GET /api/pharmacy/renewal/list
```

**Query Parameters**:
- `days`: 만료 예정일 기준 일수 (기본값: 45)
- `status`: 상태 필터 (기본값: '6,14' - 계약완료, 증권발급)
- `renewal_status`: 갱신 상태 필터 ('0'=미갱신, '2'=갱신청약생성완료)
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수
- `auto_create`: 자동 청약 생성 여부 (기본값: true)

**동작 방식**:
- 조회하는 순간 자동으로 갱신 청약 생성 (INSERT)
- 이미 갱신 청약이 생성된 경우는 생성하지 않음

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "original_num": 123,
      "renewal_num": 456,  // 자동 생성된 갱신 청약 번호
      "company": "약국명",
      "school2": "123-45-67890",
      "original_sigi": "2024-01-01",
      "original_jeonggi": "2025-01-01",
      "renewal_sigi": "2025-01-02",  // 자동 생성된 갱신 계약 시기
      "renewal_jeonggi": "2026-01-02",  // 자동 생성된 갱신 계약 종기
      "days_until_expiry": 15,
      "renewal": "2",
      "preminum": "150000",
      "status": "증권발급",
      "renewal_status": "접수",  // 갱신 청약 상태 (ch = '1')
      "created_at": "2025-01-15 10:30:00"  // 갱신 청약 생성일
    }
  ],
  "pagination": {
    "total_count": 50,
    "current_page": 1,
    "total_pages": 5
  },
  "auto_created_count": 10  // 이번 조회에서 자동 생성된 갱신 청약 수
}
```

### 2. 갱신 계약 승인 (신규와 동일한 프로세스)

**기존 API 사용**: `POST /api/pharmacy/status-update`

**Request Body**:
```json
{
  "pharmacy_id": 456,  // 갱신 청약 번호
  "status": "13"  // 승인
}
```

**처리 프로세스**:
- 기존 `pharmacy-status-update.php`의 승인(13) 처리 로직과 동일
- 보험료 계산 (pharmacy-premium-calculate.php 또는 pharmacy-premium-calculate-ubcare.php)
- 예치금 차감
- 정산 기록 생성
- 이메일 발송

**응답 예시**:
```json
{
  "success": true,
  "message": "갱신 계약이 승인되었습니다.",
  "data": {
    "pharmacy_id": 456,
    "new_status": "13",
    "company": "약국명",
    "preminum": "150000",
    "previous_deposit": "1000000",
    "current_deposit": "850000",
    "email_sent": true,
    "approval_time": "2025-01-15 10:30:00"
  }
}
```

### 3. 갱신 이력 조회

```
GET /api/pharmacy/renewal/history/:pharmacyId
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "current_contract": {
      "num": 456,
      "sigi": "2025-01-02",
      "jeonggi": "2026-01-02"
    },
    "renewal_history": [
      {
        "original_num": 123,
        "renewal_num": 456,
        "renewal_date": "2025-01-15",
        "renewal_type": "정기갱신"
      }
    ]
  }
}
```

---

## 프론트엔드 화면 설계

### 1. 갱신 대상 목록 화면

**경로**: `/pages/pharmacy/renewal-list.html`

**주요 기능**:
- 갱신 대상 계약 목록 표시 (45일 전 만료 예정)
- 조회 시 자동으로 갱신 청약 생성
- 갱신 청약 상태 표시 및 승인 처리
- 기존 계약과 갱신 청약 연결 정보 표시

**화면 구성**:
```
┌─────────────────────────────────────────────────────────────┐
│ 갱신 대상 목록 (45일 전 만료 예정)                           │
├─────────────────────────────────────────────────────────────┤
│ [필터]                                                      │
│ 만료 예정일: [45일 이내 ▼] [30일 이내] [15일 이내] [7일 이내]│
│ 갱신 상태: [전체 ▼] [미갱신] [갱신청약생성완료]              │
│ [검색] [갱신 대상 조회] (조회 시 자동 청약 생성)            │
├─────────────────────────────────────────────────────────────┤
│ 원본 │ 갱신청약 │ 약국명 │ 만료일 │ 남은일수 │ 상태 │ [승인]│
│ 123  │ 456      │ 약국A  │ 2025-02-01 │ 15일 │ 증권발급 │ [승인]│
│ 789  │ 101      │ 약국B  │ 2025-02-15 │ 29일 │ 계약완료 │ [승인]│
└─────────────────────────────────────────────────────────────┘
```

**동작 방식**:
- "갱신 대상 조회" 버튼 클릭 시 자동으로 갱신 청약 생성
- 이미 갱신 청약이 생성된 경우는 생성하지 않음
- 갱신 청약 상태가 "접수(1)"인 경우 "승인" 버튼 표시
- "승인" 버튼 클릭 시 기존 승인 프로세스와 동일하게 진행

### 3. 갱신 이력 화면

**경로**: 약국 상세 모달 내 "갱신 이력" 탭

**화면 구성**:
```
┌─────────────────────────────────────────────┐
│ 갱신 이력                                    │
├─────────────────────────────────────────────┤
│ 현재 계약                                     │
│ 계약번호: 456                                │
│ 계약기간: 2025-01-02 ~ 2026-01-02           │
│ 상태: 증권발급                               │
├─────────────────────────────────────────────┤
│ 갱신 이력                                    │
│ 2025-01-15 │ 계약번호 123 → 456 │ 정기갱신 │
│ 2024-01-10 │ 계약번호 100 → 123 │ 정기갱신 │
└─────────────────────────────────────────────┘
```

---

## 구현 단계

### Phase 1: 데이터베이스 설계
1. ✅ `pharmacyApply` 테이블에 갱신 관련 필드 추가
   - `renewal`: 갱신 상태
   - `previousCertiNum`: 갱신 전 계약 번호
   - `nextRenewalNum`: 갱신 후 계약 번호

### Phase 2: 갱신 대상 조회 및 자동 청약 생성 API
1. ✅ 갱신 대상 조회 API 구현 (`pharmacy-renewal-list.php`)
   - 45일 전 만료 예정 계약 조회
   - 조회 시 자동으로 갱신 청약 생성 (INSERT)
   - 기존 계약과 갱신 청약 연결 정보 저장

### Phase 3: 프론트엔드 구현
1. ✅ 갱신 대상 목록 화면 구현 (`renewal-list.html`)
   - 갱신 대상 조회 및 자동 청약 생성
   - 갱신 청약 목록 표시
   - 갱신 청약 승인 버튼

### Phase 4: 갱신 승인 프로세스
1. ✅ 기존 승인 API 재사용 (`pharmacy-status-update.php`)
   - 갱신 청약도 일반 신청과 동일하게 승인 처리
   - 보험료 계산, 예치금 차감, 정산 기록 생성
   - 증권 발급 프로세스 동일하게 진행

---

## 주요 고려사항

### 1. 갱신 청약 자동 생성 규칙
- **조회 시점**: 갱신 대상 조회 API 호출 시 자동 생성
- **생성 조건**: 
  - 기존 계약 상태가 증권발급(14) 또는 계약완료(6)
  - 만료 예정일이 45일 이내
  - 아직 갱신 청약이 생성되지 않음 (`renewal IS NULL OR renewal = '0'`)
- **중복 방지**: 이미 갱신 청약이 생성된 경우 (`renewal = '2'`) 재생성하지 않음

### 2. 갱신 청약 데이터 생성 규칙
- **기존 계약 정보 복사**: 모든 필드 복사
- **보험기간 설정**:
  - `sigi` = 기존 계약 `jeonggi` + 1일
  - `jeonggi` = 신규 `sigi` + 1년
- **상태 설정**: `ch = '1'` (접수) - 신규 신청과 동일
- **갱신 표시**: `renewal = '2'` (갱신 청약)
- **연결 정보**: `previousCertiNum = 기존 계약 num`
- **생성일**: `wdate = NOW()`

### 3. 기존 계약 업데이트
- `renewal = '2'` (갱신 청약 생성 완료)
- `nextRenewalNum = 신규 갱신 청약 num`

### 4. 갱신 청약 승인 프로세스
- **기존 API 재사용**: `POST /api/pharmacy/status-update`
- **처리 방식**: 신규 신청 승인과 완전히 동일
- **보험료 계산**: `pharmacy-premium-calculate.php` 또는 `pharmacy-premium-calculate-ubcare.php` 사용
- **예치금 차감**: 기존 승인 프로세스와 동일
- **정산 기록**: `pharmacy_settlementList`에 기록
- **증권 발급**: 기존 증권 발급 프로세스와 동일

### 5. 거래처별 처리
- **갱신 거부**: 거래처에서 갱신하지 않는 경우
  - 갱신 청약 상태를 보류(7) 또는 해지(16)로 변경
  - 보험회사 청약 미진행
- **갱신 진행**: 거래처에서 갱신 승인하는 경우
  - 신규와 동일한 프로세스로 진행
  - 보험료 계산 → 승인 → 증권 발급

### 6. 보험료 계산
- 갱신 청약 승인 시 현재 시점의 보험료 테이블 기준으로 재계산
- account 값에 따라 적절한 보험료 테이블 사용 (크레소티/유비케어)
- 기존 계약 조건을 기본값으로 사용하되, 승인 전 수정 가능

---

## API 구현 파일

### PHP 백엔드
- `imet/api/pharmacy/pharmacy-renewal-list.php` - 갱신 대상 조회 및 자동 청약 생성
- `imet/api/pharmacy/pharmacy-renewal-history.php` - 갱신 이력 조회
- `imet/api/pharmacy/pharmacy-status-update.php` - 갱신 청약 승인 (기존 API 재사용)

### Node.js 프록시
- `disk-cms/routes/pharmacy.js`에 갱신 관련 라우트 추가
  - `GET /api/pharmacy/renewal/list` - 갱신 대상 조회 및 자동 청약 생성
  - `GET /api/pharmacy/renewal/history/:pharmacyId` - 갱신 이력 조회
  - `POST /api/pharmacy/status-update` - 갱신 청약 승인 (기존 API 재사용)

### 프론트엔드
- `disk-cms/public/pages/pharmacy/renewal-list.html` - 갱신 대상 목록 화면
- `disk-cms/public/js/pharmacy/pharmacy-renewal.js` - 갱신 관련 JavaScript

---

## 다음 단계

1. 데이터베이스 스키마 변경사항 검토 및 승인
2. 갱신 프로세스 상세 설계 문서 작성
3. 갱신 API 구현 시작
4. 프론트엔드 화면 구현 시작

