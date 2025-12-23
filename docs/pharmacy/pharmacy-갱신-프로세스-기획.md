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
7. [주요 고려사항](#주요-고려사항)

---

## 갱신 프로세스 개요

### 목적
약국배상책임보험 계약 만료 전 갱신을 통해 계약을 연장하고, 기존 계약 정보를 기반으로 신규 계약을 생성한다.

### 갱신 대상
- **상태**: 증권발급(14), 계약완료(6)
- **만료 예정일**: 보험 종기(`jeonggi`) 기준 45일 이내
- **자동 처리**: 조회 시점에 갱신 청약을 신규 INSERT

### 갱신 프로세스 단계
1. **갱신 대상 조회**: 만료 예정 계약 목록 조회 (45일 전)  
   - 조회하는 순간 자동으로 갱신 청약 INSERT (신규 신청과 동일 구조)
2. **갱신 계약 승인**: 거래처가 승인하면 신규와 동일한 프로세스로 진행  
   - 보험료 계산, 예치금 차감, 정산 기록 생성, 증권 발급
3. **기존 계약 연결**: 기존 계약과 갱신 계약 연결 정보 저장

---

## 갱신 프로세스 흐름

### 1. 갱신 대상 조회 & 자동 갱신 청약 생성 (45일 전)

```
[갱신 대상 조회]
    ↓
조건:
- ch IN ('6', '14')  // 계약완료, 증권발급
- jeonggi BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 45 DAY)
- renewal IS NULL OR renewal = '0'
    ↓
[갱신 대상 목록 반환]
    ↓
[조회 시점에 갱신 청약 자동 INSERT]
- 신규 레코드 기본값:
  - ch='1'(접수) 기본, 필요 시 ch='13'(승인)까지 가능
  - renewal='2'(갱신 계약)
  - previousCertiNum = 원본 num
  - sigi = 기존 jeonggi + 1일
  - jeonggi = 신규 sigi + 1년
- 생성된 갱신 청약 num을 원본 계약의 nextRenewalNum에 기록
    ↓
[거래처 확인 단계]
- 갱신 거부: 보험사 청약 미진행, 갱신 청약은 보류/취소 처리
- 갱신 진행: 이후 단계(보험료 계산/승인/증권) 신규와 동일
```

### 2. 갱신 계약 승인 (신규와 동일한 프로세스)

```
[갱신 청약 선택]
    ↓
[업체 승인 처리]
- 보험료 계산 (일반/유비케어 로직 공통)
- 예치금 충분성 확인 및 차감
- 정산 기록 생성
- 상태 업데이트 (ch = '13' 승인)
    ↓
[증권 발급]
- 증권번호 입력 시 증권 발급
- 상태 업데이트 (ch = '14' 증권발급)
    ↓
[갱신 완료]
```

**중요**: 승인 로직은 기존 `pharmacy-status-update.php`의 승인(13) 처리 플로우를 재사용한다.

---

## 데이터베이스 설계

### pharmacyApply 테이블 필드 추가

```sql
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
- `renewal`: 갱신 상태 (`0` 미갱신, `2` 갱신청약 생성 완료)
- `previousCertiNum`: 갱신 전 계약 번호
- `nextRenewalNum`: 갱신 후 계약 번호

### 갱신 이력 테이블 (선택)

```sql
CREATE TABLE pharmacy_renewal_history (
    num INT(11) NOT NULL AUTO_INCREMENT,
    original_contract_num INT(11) NOT NULL,
    renewal_contract_num INT(11) NOT NULL,
    renewal_date DATETIME NOT NULL,
    renewal_type CHAR(1) DEFAULT '1' COMMENT '1=정기갱신, 2=조기갱신',
    wdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (num),
    INDEX idx_original (original_contract_num),
    INDEX idx_renewal (renewal_contract_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## API 엔드포인트 설계

### 1) 갱신 대상 조회 및 자동 청약 생성
```
GET /api/pharmacy/renewal/list
```
- Query: `days`(기본 45), `status`(기본 6,14), `renewal_status`(0/2), `page`, `limit`, `auto_create`(기본 true)
- 조회 시점에 갱신 청약을 자동 생성 (중복 생성 방지)
- 응답: 원본 계약/신규 갱신 청약 번호, 시기/종기, days_until_expiry, auto_created_count

### 2) 갱신 계약 승인
- 기존 승인 API 재사용: `POST /api/pharmacy/status-update`
- Request: `{ pharmacy_id: <갱신 청약 num>, status: '13' }`

---

## 프론트엔드 화면 설계

### 관리 UI (disk-cms)
- **갱신 대상 목록**: 만료 D-45 이내 리스트, 자동 생성된 갱신 청약 번호 표시
- **액션**: 승인(기존 승인 플로우 재사용), 보류/취소
- **연결 정보**: 원본 계약 ↔ 갱신 계약 링크/아이콘

### 고객사 어드민 (hi/v2)
- 갱신 건 구분 배지/필터(선택)
- 읽기 전용 조회 위주, 승인/보류는 운영 측에서 처리

---

## 구현 단계

1. **DB 스키마 반영**: `renewal`, `previousCertiNum`, `nextRenewalNum` 필드 추가 및 인덱스 생성
2. **API 개발**: `GET /api/pharmacy/renewal/list` (자동 INSERT 포함), 기존 승인 API 재사용
3. **프론트 개발**: 갱신 대상 리스트/필터, 승인 액션, 연결 정보 표시
4. **운영 가이드**: 만료 45일 주기 배치/수동 트리거, 갱신 거부 시 처리 규칙

---

## 주요 고려사항

- **자동 생성 중복 방지**: 동일 원본 계약에 대해 갱신 청약이 이미 존재하면 재생성 금지
- **상태 코드 일관성**: 생성 시 ch 기본값 `1`, 필요 시 바로 `13`까지 허용
- **시기/종기 산정**: 신규 `sigi = 기존 jeonggi + 1일`, `jeonggi = sigi + 1년`
- **정산/예치금**: 승인 단계에서 기존 승인 로직(예치금 차감, 정산 기록)을 그대로 사용
- **로그/모니터링**: 자동 생성 건수, 실패 원인 로깅
- **향후 확장**: 갱신 이력 테이블, 다중 알림(30/15/7일) 옵션 추가 가능

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

