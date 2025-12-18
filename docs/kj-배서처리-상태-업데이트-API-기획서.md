# KJ 대리운전 배서처리 상태 업데이트 API 기획서

## 1. 개요

### 1.1 목적
배서 리스트 페이지에서 "배서처리" select 박스를 변경했을 때, 배서 상태를 업데이트하고 필요한 후속 작업(보험료 계산, SMS 발송 등)을 수행하는 API를 개발합니다.

### 1.2 배경
- 현재 프론트엔드에서 `updateEndorseStatus(num, newSangtae)` 함수가 호출되지만, 실제 API가 제대로 구현되지 않았음
- 이전 버전 코드는 복잡한 로직을 포함하고 있어 현대적인 JSON API로 재구성 필요

## 2. 요구사항 분석

### 2.1 현재 상태 분석
- **프론트엔드**: `kj-driver-endorse-list.js`에서 배서처리 select 변경 시 `updateEndorseStatus()` 호출
- **현재 API**: `kj-endorse-update-status.php` 존재하나 복잡한 로직 포함
- **데이터베이스**: `2012DaeriMember` 테이블의 `sangtae` 필드 (1=미처리, 2=처리)

### 2.2 기능 요구사항

#### 2.2.1 기본 기능
1. **sangtae 상태 변경**
   - 미처리(1) → 처리(2)로 변경
   - 이미 처리된 건(sangtae=2)은 에러 반환

2. **push 값에 따른 후속 처리**
   - push=1 (청약): 정상 처리로 변경 (push=4, cancel=null)
   - push=4 (해지): 해지 처리 (push=2, cancel=42)
   - 기타 경우는 현재 push 값 유지

3. **manager 필드 업데이트**
   - 처리한 사용자 이름 저장

#### 2.2.2 고급 기능 (2차 개발)
1. **보험료 계산**
   - 월 보험료 계산 (calculateProRatedFee)
   - 보험회사 보험료 계산 (calculateEndorsePremium)

2. **SMS 발송**
   - 가입완료/해지완료 SMS
   - 청약취소/거절 SMS

3. **기타 업데이트**
   - 배서건수 정리 (2012EndorseList 테이블)
   - cancel 필드 업데이트

### 2.3 비기능 요구사항
- JSON 형식의 RESTful API
- UTF-8 인코딩
- 상세한 로깅
- 에러 처리 및 검증

## 3. API 설계

### 3.1 API 엔드포인트
- **URL**: `POST /api/insurance/kj-endorse/update-status`
- **경로**: `/pci0327/api/insurance/kj-endorse-update-status.php`
- **Node.js 프록시**: `routes/insurance/kj-driver-company.js`

### 3.2 요청 파라미터

#### Request Body (JSON)
```json
{
  "num": 12345,              // 필수: 2012DaeriMember 테이블의 num
  "sangtae": 2,              // 필수: 배서처리 상태 (1=미처리, 2=처리)
  "manager": "홍길동"        // 필수: 처리자 이름 (로그인 사용자)
}
```

#### 선택 파라미터 (2차 개발)
```json
{
  "reasion": "처리 사유",     // 처리 사유 (선택)
  "smsContents": "SMS 내용"   // SMS 내용 (선택)
}
```

### 3.3 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "message": "배서처리 상태가 업데이트되었습니다.",
  "data": {
    "num": 12345,
    "sangtae": 2,
    "push": 4,
    "cancel": null,
    "manager": "홍길동"
  }
}
```

#### 실패 응답
```json
{
  "success": false,
  "error": "이미 처리된 건입니다."
}
```

## 4. 데이터베이스 변경사항

### 4.1 업데이트 대상 테이블
- **2012DaeriMember**: `sangtae`, `push`, `cancel`, `manager`, `reasion` 필드

### 4.2 업데이트 로직

#### 기본 업데이트 (1차 개발)
```sql
UPDATE 2012DaeriMember 
SET 
  sangtae = :sangtae,
  manager = :manager,
  reasion = :reasion
WHERE num = :num
```

#### push 값 변경 로직
- push=1 (청약)이고 sangtae=2 (처리)로 변경 시:
  - push = 4 (정상 처리)
  - cancel = null

- push=4 (해지)이고 sangtae=2 (처리)로 변경 시:
  - push = 2 (해지 완료)
  - cancel = 42

## 5. 개발 단계

### 5.1 1차 개발 (기본 기능)
1. **API 엔드포인트 생성**
   - `kj-endorse-update-status.php` 파일 생성
   - 기본 검증 로직 구현

2. **기본 업데이트 로직**
   - sangtae 상태 변경
   - manager 필드 업데이트
   - push 값에 따른 기본 처리

3. **에러 처리**
   - 이미 처리된 건 검증
   - 필수 필드 검증
   - 데이터베이스 오류 처리

4. **프론트엔드 연동**
   - `updateEndorseStatus` 함수 구현 확인
   - Node.js 프록시 라우터 확인

### 5.2 2차 개발 (고급 기능)
1. **보험료 계산**
   - calculateProRatedFee 함수 연동
   - calculateEndorsePremium 함수 연동
   - kj_premium_data, kj_insurance_premium_data 테이블 조회

2. **SMS 발송**
   - smsAligo API 연동
   - 보험회사별 메시지 템플릿
   - push 값에 따른 SMS 발송 로직

3. **기타 업데이트**
   - 2012EndorseList 테이블 업데이트
   - 배서건수 정리 로직

## 6. 구현 상세

### 6.1 파일 구조
```
pci0327/api/insurance/
├── kj-endorse-update-status.php (신규 생성)
└── utils/
    └── kj-endorse-utils.php (보험료 계산 함수 포함)

disk-cms/
├── routes/insurance/
│   └── kj-driver-company.js (프록시 라우터 수정)
└── public/js/insurance/
    └── kj-driver-endorse-list.js (이미 구현됨)
```

### 6.2 주요 함수

#### 6.2.1 kj-endorse-update-status.php
```php
// 1. 입력 파라미터 검증
// 2. 기존 데이터 조회
// 3. 이미 처리된 건 검증
// 4. push 값에 따른 처리 로직
// 5. 데이터베이스 업데이트
// 6. 응답 반환
```

### 6.3 로깅
- 요청 파라미터 로깅
- 처리 전 데이터 상태 로깅
- 처리 후 데이터 상태 로깅
- 에러 발생 시 상세 로깅
- 로그 파일: `kj-endorse-update-status-YYYY-MM-DD.log`

## 7. 테스트 계획

### 7.1 단위 테스트
1. 정상 케이스: 미처리 → 처리
2. 에러 케이스: 이미 처리된 건
3. 에러 케이스: 필수 필드 누락
4. 에러 케이스: 존재하지 않는 num

### 7.2 통합 테스트
1. 프론트엔드 → Node.js 프록시 → PHP API 연동
2. 데이터베이스 업데이트 확인
3. 응답 형식 확인

## 8. 주의사항

### 8.1 보안
- SQL 인젝션 방지 (PDO Prepared Statement 사용)
- 입력 값 검증
- 권한 검증 (필요 시)

### 8.2 성능
- 불필요한 조회 최소화
- 트랜잭션 사용 검토 (2차 개발 시)

### 8.3 호환성
- 기존 이전 버전 코드와의 호환성 유지
- 데이터베이스 스키마 변경 최소화

## 9. 향후 개선 사항

1. 트랜잭션 처리 추가 (보험료 계산, SMS 발송 포함)
2. 비동기 처리 (SMS 발송 등 시간이 걸리는 작업)
3. 배치 처리 (대량 업데이트)
4. 처리 이력 관리 (별도 테이블에 로그 저장)

## 10. 참고 자료

- 이전 버전 코드: 사용자가 제공한 PHP 코드
- 관련 API: `kj-endorse-update-member.php`, `kj-endorse-update-endorse-day.php`
- 유틸리티 함수: `kj-endorse-utils.php` (보험료 계산 함수 포함)
