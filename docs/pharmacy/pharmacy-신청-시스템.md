# 약국배상책임보험 신청 시스템 (imet/drugstore/)

**작성일**: 2025-01-XX  
**버전**: 1.0

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [디렉토리 구조](#디렉토리-구조)
3. [주요 기능](#주요-기능)
4. [회사별 구분](#회사별-구분)
5. [API 엔드포인트](#api-엔드포인트)
6. [프론트엔드 구조](#프론트엔드-구조)
7. [데이터 흐름](#데이터-흐름)

---

## 시스템 개요

### 목적
약사 또는 거래처 영업사원이 약국배상책임보험을 온라인으로 신청할 수 있는 시스템입니다. 반응형 웹 기반으로 모바일, 태블릿, 데스크탑에서 모두 사용 가능합니다.

### 사용자
- **약사**: 직접 보험 가입 신청
- **거래처 영업사원**: 고객 약국 대신 신청 처리

### 주요 특징
- **회사별 구분**: pharmacy_idList 기반으로 회사별 신청 페이지 제공
- **실시간 보험료 계산**: 입력 정보에 따라 즉시 보험료 계산
- **반응형 디자인**: 모바일/태블릿/데스크탑 지원
- **자동 상태 처리**: pharmacy_idList의 `ch` 값에 따라 자동 승인 또는 메일 발송

---

## 디렉토리 구조

```
imet/drugstore/
├── api/
│   ├── config/
│   │   └── db.php              # DB 연결 설정
│   ├── includes/
│   │   └── validation.php     # 유효성 검증 함수
│   ├── calculate.php           # 보험료 계산 API
│   ├── submit.php              # 가입신청 처리 API (팜페이스마트)
│   ├── ubcareSubmit.php        # 가입신청 처리 API (유비케어)
│   └── submit_log.txt          # 제출 로그 파일
├── common/
│   ├── css/
│   │   ├── base.css            # 기본 스타일
│   │   ├── form.css            # 폼 스타일
│   │   └── responsive.css      # 반응형 스타일
│   └── js/
│       ├── ui.js               # UI 제어
│       ├── validation.js       # 유효성 검증
│       └── form-handler.js     # 폼 처리 및 API 통신
├── css/
│   ├── basic.css               # 기본 스타일
│   └── ubcareBasic.css         # 유비케어 전용 스타일
├── js/
│   ├── main.js                 # 메인 로직
│   ├── submit.js               # 제출 처리 (팜페이스마트)
│   ├── ubacareMain.js          # 유비케어 메인 로직
│   └── ubcareSubmit.js         # 유비케어 제출 처리
├── pharmacy/                    # 팜페이스마트 신청 페이지
│   ├── index.html              # 재고자산 5천만원
│   ├── index2.html             # 재고자산 1억원
│   ├── index3.html             # 재고자산 2억원
│   ├── index4.html             # 재고자산 3억원
│   └── index5.html             # 재고자산 5억원
├── ubcare/                      # 유비케어 신청 페이지
│   ├── index.html
│   ├── index2.html
│   ├── index3.html
│   ├── index4.html
│   └── index5.html
├── pharmacyTest/                # 팜페이스마트 테스트 페이지
└── ubcareTest/                  # 유비케어 테스트 페이지
```

---

## 주요 기능

### 1. 보험 상품 선택

**파일**: 각 회사별 `index.html`

**기능**:
- 전문인배상책임보험 선택/해제
- 화재종합보험 선택/해제
- 체크박스 연동으로 입력 필드 활성화/비활성화

**전문인배상책임보험**:
- 약사전문인 수 선택 (1명~7명)
- 보상한도 선택 (유비케어만: 1억원/2억원)

**화재종합보험**:
- 사업장 면적 입력 (㎡)
- 재고자산 선택 (5천만원, 1억원, 2억원, 3억원, 5억원)

### 2. 실시간 보험료 계산

**파일**: `api/calculate.php`, `js/main.js`

**기능**:
- 보험 상품 선택 시 즉시 보험료 계산
- 전문인보험료 + 화재보험료 = 총 보험료
- 상세 내역 표시

**프로세스**:
```
[사용자 입력]
    ↓
[보험 상품 선택 확인]
    ↓
[API 호출: calculate.php]
    ↓
[DB에서 보험료 조회]
    ↓
[총 보험료 계산]
    ↓
[화면에 표시]
```

### 3. 가입신청 처리

**파일**: `api/submit.php`, `api/ubcareSubmit.php`

**기능**:
- 신청 정보 유효성 검증
- DB 저장
- 보험료 자동 계산
- 이메일 발송
- 상태 자동 설정 (pharmacy_idList.ch 값에 따라)

**프로세스**:
```
[폼 제출]
    ↓
[클라이언트 유효성 검증]
    ↓
[서버 유효성 검증]
    ↓
[pharmacy_idList 조회]
    ↓
[DB 저장 (pharmacyApply)]
    ↓
[보험료 계산 API 호출]
    ↓
[이메일 발송]
    ↓
[상태 설정]
    - ch='10': 메일보냄 (기본)
    - ch='13': 자동 승인 (pharmacy_idList.ch='13'인 경우)
    ↓
[응답 반환]
```

### 4. 유효성 검증

**파일**: `api/includes/validation.php`, `common/js/validation.js`

**검증 항목**:
- 사업자등록번호 (체크섬 검증)
- 주민등록번호 (체크섬 검증)
- 전화번호 형식
- 이메일 형식
- 필수 필드 확인
- 개인정보 동의 확인

### 5. 개인정보 동의

**파일**: 각 회사별 `index.html`

**동의 항목**:
- 개인정보 수집 및 이용동의 (필수)
- 고유식별정보 처리 동의 (필수)
- 제3자 정보제공 동의 (필수)
- 마케팅 활용 동의 (선택)

---

## 회사별 구분

### pharmacy_idList 테이블

**역할**: 회사별 설정 및 구분

**주요 필드**:
- `num`: 회사 ID (account로 사용)
- `directory`: 폴더명 (pharmacy, ubcare 등)
- `name`: 회사명
- `ch`: 기본 상태 설정
  - `'10'`: 메일보냄 (기본)
  - `'13'`: 자동 승인
- `api_key`, `api_secret`: HMAC 인증용 (자동 승인 시 사용)

### 회사별 차이점

#### 팜페이스마트 (pharmacy)
- **API**: `submit.php`
- **보험료 계산**: `pharmacy-premium-calculate.php`
- **전문인 보험료**: `pharmacyProPreminum` 테이블
- **화재 보험료**: `pharmacyPreminum` 테이블
- **보상한도**: 고정 (1억원)

#### 유비케어 (ubcare)
- **API**: `ubcareSubmit.php`
- **보험료 계산**: `pharmacy-premium-calculate-ubcare.php`
- **전문인 보험료**: `ubcareProPreminum` 테이블 (보상한도 포함)
- **화재 보험료**: `ubcarePreminum` 테이블
- **보상한도**: 선택 가능 (1억원/2억원)

---

## API 엔드포인트

### 1. 보험료 계산

**엔드포인트**: `POST /drugstore/api/calculate.php`

**요청**:
```json
{
  "technicalInsurance": true,
  "chemist": "3",
  "fireInsurance": true,
  "area": "120",
  "jaegojasan": "2"
}
```

**응답**:
```json
{
  "success": true,
  "message": "보험료 계산이 완료되었습니다.",
  "data": {
    "totalPremium": "150,000원",
    "totalPremiumRaw": 150000,
    "breakdown": {
      "technical": {
        "name": "약사전문인배상책임보험",
        "amount": "3원",
        "premium": "100,000원"
      },
      "fire": {
        "name": "약국화재종합보험",
        "area": "120㎡",
        "premium": "50,000원"
      }
    }
  }
}
```

### 2. 가입신청 처리

**엔드포인트**: 
- 팜페이스마트: `POST /drugstore/api/submit.php`
- 유비케어: `POST /drugstore/api/ubcareSubmit.php`

**요청**:
```json
{
  "directory": "pharmacy",
  "businessName": "약국명",
  "businessNumber": "1234567890",
  "businessAddress": "서울시 강남구...",
  "representativeName": "홍길동",
  "ssn": "6603271069017",
  "phone": "025587383",
  "mobile": "01012345678",
  "email": "example@email.com",
  "technicalInsurance": true,
  "chemist": "3",
  "technicalLimit": "1",
  "fireInsurance": true,
  "area": "120",
  "jaegojasan": "2",
  "message": "문의사항",
  "agreeInfo": true,
  "agreeMarketing": false
}
```

**응답**:
```json
{
  "success": true,
  "message": "가입신청이 완료되었습니다.",
  "data": {
    "applicationId": 123,
    "premium": 150000,
    "premium_formatted": "150,000원"
  }
}
```

**자동 처리**:
- `pharmacy_idList.ch='10'`: 상태를 '10' (메일보냄)으로 설정
- `pharmacy_idList.ch='13'`: 상태를 '13' (승인)으로 설정하고 승인 API 호출

---

## 프론트엔드 구조

### 페이지 구조

**공통 구조**:
- Header: 로고, 유의사항, 알아두실 사항 링크
- Hero Banner: "가입신청" 타이틀
- 상품 안내 섹션
- 담보 및 보상한도 선택 테이블
- 개인정보 동의 섹션
- 가입신청 정보 폼
- Footer

### JavaScript 모듈

#### `main.js` / `ubacareMain.js`
- 페이지 초기화
- 체크박스 연동
- 보험료 계산 트리거
- 폼 데이터 수집

#### `submit.js` / `ubcareSubmit.js`
- 폼 유효성 검증
- 제출 처리
- 에러 처리
- 성공 처리

#### `common/js/form-handler.js`
- API 통신 처리
- 보험료 계산 API 호출
- 가입신청 API 호출

#### `common/js/validation.js`
- 클라이언트 유효성 검증
- 실시간 검증 피드백

#### `common/js/ui.js`
- 로딩 스피너
- 토스트 메시지
- 자동 포맷팅

---

## 데이터 흐름

### 보험료 계산 흐름

```
사용자 입력
    ↓
[체크박스 선택 확인]
    ↓
[입력 필드 활성화]
    ↓
[main.js: 데이터 수집]
    ↓
[form-handler.js: API 호출]
    ↓
[calculate.php: 보험료 조회]
    ↓
[DB 조회 (pharmacyProPreminum/pharmacyPreminum)]
    ↓
[JSON 응답]
    ↓
[main.js: 화면 표시]
```

### 가입신청 흐름

```
사용자 입력
    ↓
[submit.js: 클라이언트 검증]
    ↓
[submit.php/ubcareSubmit.php: 서버 검증]
    ↓
[pharmacy_idList 조회]
    ↓
[DB 저장 (pharmacyApply)]
    ↓
[보험료 계산 API 호출]
    ↓
[이메일 발송]
    ↓
[상태 설정]
    - ch='10': 메일보냄
    - ch='13': 자동 승인 + 승인 API 호출
    ↓
[성공 응답]
```

---

## 데이터베이스 연동

### 사용 테이블

1. **pharmacy_idList**
   - 회사 정보
   - 기본 상태 설정 (`ch`)
   - API 키/시크릿 (자동 승인용)

2. **pharmacyApply**
   - 가입신청 정보 저장
   - 모든 입력 필드 저장

3. **pharmacyProPreminum** / **ubcareProPreminum**
   - 전문인배상책임보험 보험료
   - 보상한도별 보험료

4. **pharmacyPreminum** / **ubcarePreminum**
   - 화재종합보험 보험료
   - 면적별 보험료

5. **202Damdang**
   - 담당자 이메일 정보
   - 회사별 담당자 설정

---

## 주요 차이점 (회사별)

| 항목 | 팜페이스마트 | 유비케어 |
|------|------------|---------|
| 제출 API | submit.php | ubcareSubmit.php |
| 보험료 계산 API | pharmacy-premium-calculate.php | pharmacy-premium-calculate-ubcare.php |
| 전문인 보험료 테이블 | pharmacyProPreminum | ubcareProPreminum |
| 화재 보험료 테이블 | pharmacyPreminum | ubcarePreminum |
| 보상한도 | 고정 (1억원) | 선택 (1억원/2억원) |
| 보상한도 필드 | 없음 | chemistLimit |

---

## 보안 고려사항

1. **SQL Injection 방지**: Prepared Statement 사용
2. **XSS 방지**: HTML 특수문자 필터링
3. **개인정보 보호**: 주민번호 마스킹
4. **유효성 검증**: 클라이언트 + 서버 이중 검증
5. **CORS 설정**: 필요시 특정 도메인만 허용

---

## 다음 단계

1. API 엔드포인트 상세 문서화
2. 에러 처리 가이드 작성
3. 사용자 매뉴얼 작성
4. 새 회사 추가 가이드 작성

