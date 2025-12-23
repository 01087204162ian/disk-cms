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
- **만료 예정일**: 보험 종기(`jeonggi`) 기준 45일 이내 만료
- **갱신 안내 시점**: 기본 45일 전 (필요 시 30/15/7일 추가 알림 옵션)

### 갱신 프로세스 단계
1. **갱신 대상 조회**: 만료 예정 계약 목록 조회
2. **갱신 안내 메일 발송**: 갱신 대상자에게 안내 메일 발송
3. **갱신 신청 처리**: 갱신 신청 정보 수집 및 검증
4. **갱신 계약 생성**: 기존 계약 정보를 기반으로 신규 계약 생성
5. **기존 계약 연결**: 기존 계약과 갱신 계약 연결 정보 저장

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

### 2. 갱신 안내 메일 발송

```
[갱신 대상 선택]
    ↓
[갱신 안내 메일 발송]
    ↓
[pharmacyApply.renewal = '1' 업데이트]  // 갱신 안내 완료 표시
[pharmacyApply.wdate_4 = NOW() 업데이트]  // 갱신 안내 발송일 기록
    ↓
[메일 발송 로그 저장]
```

### 3. 갱신 신청 처리

```
[갱신 신청 정보 입력]
- 기존 계약 정보 자동 복사
- 보험료 재계산 (조건 변경 가능)
- 보험기간 설정 (기존 종기 + 1년)
    ↓
[갱신 신청 검증]
- 필수 정보 확인
- 보험료 계산 검증
    ↓
[갱신 신청 저장]
```

### 4. 갱신 계약 생성

```
[기존 계약 정보 조회]
    ↓
[신규 계약 데이터 생성]
- 기존 계약 정보 복사
- sigi = 기존 jeonggi + 1일
- jeonggi = sigi + 1년
- ch = '1' (접수) 또는 '13' (승인)
- renewal = '2' (갱신 계약)
- previousCertiNum = 기존 계약 num
- wdate = NOW()
    ↓
[신규 계약 INSERT]
    ↓
[기존 계약 renewal = '2' 업데이트]  // 갱신 완료 표시
[기존 계약 nextRenewalNum = 신규 계약 num 업데이트]
    ↓
[갱신 연결 정보 저장]
```

### 5. 갱신 계약 승인

```
[갱신 계약 승인 처리]
- 기존 승인 프로세스와 동일
- 예치금 차감
- 정산 기록 생성
- 증권 발급
```

---

## 데이터베이스 설계

### pharmacyApply 테이블 추가 필드

```sql
-- 갱신 관련 필드 추가 (ALTER TABLE)
ALTER TABLE pharmacyApply 
ADD COLUMN renewal CHAR(1) DEFAULT '0' COMMENT '갱신 상태: 0=미갱신, 1=갱신안내완료, 2=갱신완료',
ADD COLUMN previousCertiNum INT(11) DEFAULT NULL COMMENT '갱신 전 계약 번호',
ADD COLUMN nextRenewalNum INT(11) DEFAULT NULL COMMENT '갱신 후 계약 번호',
ADD COLUMN wdate_4 DATETIME DEFAULT NULL COMMENT '갱신 안내 발송일',
ADD INDEX idx_renewal (renewal),
ADD INDEX idx_previousCertiNum (previousCertiNum),
ADD INDEX idx_nextRenewalNum (nextRenewalNum),
ADD INDEX idx_jeonggi_renewal (jeonggi, renewal);
```

### 필드 설명

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `renewal` | CHAR(1) | 갱신 상태<br>- '0': 미갱신<br>- '1': 갱신 안내 완료<br>- '2': 갱신 완료 |
| `previousCertiNum` | INT(11) | 갱신 전 계약 번호 (갱신 계약인 경우) |
| `nextRenewalNum` | INT(11) | 갱신 후 계약 번호 (기존 계약인 경우) |
| `wdate_4` | DATETIME | 갱신 안내 발송일 |

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

### 1. 갱신 대상 조회

```
GET /api/pharmacy/renewal/list
```

**Query Parameters**:
- `days`: 만료 예정일 기준 일수 (기본값: 30)
- `status`: 상태 필터 (기본값: '6,14' - 계약완료, 증권발급)
- `renewal_status`: 갱신 상태 필터 ('0'=미갱신, '1'=안내완료, '2'=갱신완료)
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "num": 123,
      "company": "약국명",
      "school2": "123-45-67890",
      "sigi": "2024-01-01",
      "jeonggi": "2025-01-01",
      "days_until_expiry": 15,
      "renewal": "0",
      "preminum": "150000",
      "status": "증권발급"
    }
  ],
  "pagination": {
    "total_count": 50,
    "current_page": 1,
    "total_pages": 5
  }
}
```

### 2. 갱신 안내 메일 발송

```
POST /api/pharmacy/renewal/send-notice
```

**Request Body**:
```json
{
  "pharmacy_ids": [123, 456, 789],
  "notice_type": "30days"  // "30days", "15days", "7days"
}
```

**응답 예시**:
```json
{
  "success": true,
  "message": "갱신 안내 메일이 발송되었습니다.",
  "data": {
    "sent_count": 3,
    "failed_count": 0,
    "sent_pharmacies": [
      {
        "pharmacy_id": 123,
        "email": "pharmacy@example.com",
        "sent_at": "2025-01-15 10:30:00"
      }
    ]
  }
}
```

### 3. 갱신 신청 정보 조회

```
GET /api/pharmacy/renewal/apply/:pharmacyId
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "original_contract": {
      "num": 123,
      "company": "약국명",
      "chemist": 3,
      "area": 120,
      "jaegojasan": 2,
      "preminum": "150000",
      "sigi": "2024-01-01",
      "jeonggi": "2025-01-01"
    },
    "renewal_contract": {
      "sigi": "2025-01-02",  // 기존 종기 + 1일
      "jeonggi": "2026-01-02",  // 신규 시기 + 1년
      "chemist": 3,  // 기존 값 복사
      "area": 120,  // 기존 값 복사
      "jaegojasan": 2  // 기존 값 복사
    },
    "calculated_premium": {
      "total": "150000",
      "pro": "100000",
      "area": "50000"
    }
  }
}
```

### 4. 갱신 신청 처리

```
POST /api/pharmacy/renewal/apply
```

**Request Body**:
```json
{
  "original_pharmacy_id": 123,
  "renewal_data": {
    "chemist": 3,
    "chemistLimit": 1,
    "area": 120,
    "jaegojasan": 2,
    "sigi": "2025-01-02",
    "jeonggi": "2026-01-02",
    "status": "13"  // "1"=접수, "13"=승인
  }
}
```

**응답 예시**:
```json
{
  "success": true,
  "message": "갱신 신청이 완료되었습니다.",
  "data": {
    "original_contract_num": 123,
    "renewal_contract_num": 456,
    "renewal_date": "2025-01-15 10:30:00"
  }
}
```

### 5. 갱신 계약 승인

```
POST /api/pharmacy/renewal/approve
```

**Request Body**:
```json
{
  "renewal_pharmacy_id": 456
}
```

**응답 예시**:
```json
{
  "success": true,
  "message": "갱신 계약이 승인되었습니다.",
  "data": {
    "renewal_contract_num": 456,
    "approved_at": "2025-01-15 10:30:00",
    "premium": "150000"
  }
}
```

### 6. 갱신 이력 조회

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
- 갱신 대상 계약 목록 표시
- 만료 예정일 기준 정렬 및 필터링
- 갱신 안내 메일 일괄 발송
- 개별 갱신 신청 처리

**화면 구성**:
```
┌─────────────────────────────────────────────────┐
│ 갱신 대상 목록                                  │
├─────────────────────────────────────────────────┤
│ [필터]                                          │
│ 만료 예정일: [30일 이내 ▼] [15일 이내] [7일 이내]│
│ 갱신 상태: [전체 ▼] [미갱신] [안내완료] [갱신완료]│
│ [검색] [일괄 안내 발송]                         │
├─────────────────────────────────────────────────┤
│ 번호 │ 약국명 │ 만료일 │ 남은일수 │ 상태 │ [갱신]│
│ 123  │ 약국A  │ 2025-02-01 │ 15일 │ 증권발급 │ [신청]│
│ 456  │ 약국B  │ 2025-02-15 │ 29일 │ 계약완료 │ [신청]│
└─────────────────────────────────────────────────┘
```

### 2. 갱신 신청 화면 (모달)

**트리거**: 갱신 대상 목록에서 "갱신 신청" 버튼 클릭

**화면 구성**:
```
┌─────────────────────────────────────────────┐
│ 갱신 신청                                    │
├─────────────────────────────────────────────┤
│ 기존 계약 정보                               │
│ 약국명: 약국A                                │
│ 계약기간: 2024-01-01 ~ 2025-01-01           │
│ 전문인수: 3명                                │
│ 화재면적: 120㎡                              │
│ 재고자산: 1억원                              │
│ 보험료: 150,000원                            │
├─────────────────────────────────────────────┤
│ 갱신 계약 정보                               │
│ 계약기간: [2025-01-02] ~ [2026-01-02]       │
│ 전문인수: [3] 명                             │
│ 화재면적: [120] ㎡                           │
│ 재고자산: [1억원 ▼]                          │
│ 보험료: [150,000원] (자동계산)               │
├─────────────────────────────────────────────┤
│ [취소] [보험료 계산] [갱신 신청]              │
└─────────────────────────────────────────────┘
```

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

### Phase 1: 데이터베이스 설계 및 기본 API
1. ✅ `pharmacyApply` 테이블에 갱신 관련 필드 추가
2. ✅ 갱신 대상 조회 API 구현
3. ✅ 갱신 신청 정보 조회 API 구현

### Phase 2: 갱신 신청 프로세스
1. ✅ 갱신 신청 API 구현
2. ✅ 갱신 계약 생성 로직 구현
3. ✅ 기존 계약과 갱신 계약 연결 처리

### Phase 3: 갱신 안내 메일
1. ✅ 갱신 안내 메일 발송 API 구현
2. ✅ 갱신 안내 메일 템플릿 작성
3. ✅ 메일 발송 로그 저장

### Phase 4: 프론트엔드 구현
1. ✅ 갱신 대상 목록 화면 구현
2. ✅ 갱신 신청 모달 구현
3. ✅ 갱신 이력 화면 구현

### Phase 5: 갱신 승인 프로세스
1. ✅ 갱신 계약 승인 API 구현
2. ✅ 갱신 계약 승인 시 예치금 차감 처리
3. ✅ 갱신 계약 승인 시 정산 기록 생성

---

## 주요 고려사항

### 1. 보험료 계산
- 갱신 시 기존 조건을 기본값으로 사용하되, 변경 가능
- 보험료는 현재 시점의 보험료 테이블 기준으로 재계산
- account 값에 따라 적절한 보험료 테이블 사용 (크레소티/유비케어)

### 2. 보험기간 설정
- **시기(sigi)**: 기존 계약 종기(`jeonggi`) + 1일
- **종기(jeonggi)**: 신규 시기 + 1년
- 예: 기존 계약이 2024-01-01 ~ 2025-01-01이면, 갱신 계약은 2025-01-02 ~ 2026-01-02

### 3. 상태 관리
- 갱신 신청 시: `ch = '1'` (접수) 또는 `ch = '13'` (승인)
- 갱신 완료 시: `renewal = '2'` (갱신 완료)
- 기존 계약: `renewal = '2'`, `nextRenewalNum = 신규 계약 번호`

### 4. 예치금 처리
- 갱신 계약 승인 시 기존 승인 프로세스와 동일하게 예치금 차감
- 갱신 계약 해지 시 기존 해지 프로세스와 동일하게 환급 처리

### 5. 증권 발급
- 갱신 계약도 기존 계약과 동일하게 증권 발급 가능
- 증권번호는 새로 발급 (기존 증권번호와 연결 정보는 별도 관리)

---

## API 구현 파일

### PHP 백엔드
- `imet/api/pharmacy/pharmacy-renewal-list.php` - 갱신 대상 조회
- `imet/api/pharmacy/pharmacy-renewal-apply.php` - 갱신 신청 처리
- `imet/api/pharmacy/pharmacy-renewal-notice.php` - 갱신 안내 메일 발송
- `imet/api/pharmacy/pharmacy-renewal-history.php` - 갱신 이력 조회

### Node.js 프록시
- `disk-cms/routes/pharmacy.js`에 갱신 관련 라우트 추가
  - `GET /api/pharmacy/renewal/list`
  - `POST /api/pharmacy/renewal/apply`
  - `POST /api/pharmacy/renewal/send-notice`
  - `GET /api/pharmacy/renewal/history/:pharmacyId`

### 프론트엔드
- `disk-cms/public/pages/pharmacy/renewal-list.html` - 갱신 대상 목록 화면
- `disk-cms/public/js/pharmacy/pharmacy-renewal.js` - 갱신 관련 JavaScript

---

## 다음 단계

1. 데이터베이스 스키마 변경사항 검토 및 승인
2. 갱신 프로세스 상세 설계 문서 작성
3. 갱신 API 구현 시작
4. 프론트엔드 화면 구현 시작

