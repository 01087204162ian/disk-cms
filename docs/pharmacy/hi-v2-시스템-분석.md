# 약국안심보험 고객사 어드민 시스템 v2 분석

**작성일**: 2025-01-XX  
**위치**: `imet/hi/v2/`

---

## 📋 목차

1. [시스템 개요](#1-시스템-개요)
2. [폴더 구조](#2-폴더-구조)
3. [주요 파일 분석](#3-주요-파일-분석)
4. [API 연동 구조](#4-api-연동-구조)
5. [인증 시스템](#5-인증-시스템)
6. [주요 기능](#6-주요-기능)
7. [데이터 흐름](#7-데이터-흐름)

---

## 1. 시스템 개요

### 1.1 정의

약국배상책임보험 고객사(거래처)를 위한 관리자 시스템 v2입니다. 고객사는 이 시스템을 통해 자신의 약국 신청 목록을 조회하고, 상태를 확인하며, 일별 실적과 예치보험료를 관리할 수 있습니다.

### 1.2 주요 특징

- **HMAC 인증**: API v2는 HMAC-SHA256 기반 인증 사용
- **반응형 웹**: 모바일, 태블릿, 데스크탑 모두 지원
- **세션 기반 로그인**: 초기 로그인은 세션 기반, 이후 API 호출은 HMAC 인증
- **API 키 관리**: 각 고객사마다 고유한 API 키/시크릿 발급

### 1.3 기술 스택

- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **백엔드**: PHP 7.x+ (PDO)
- **인증**: HMAC-SHA256
- **데이터베이스**: MySQL/MariaDB
- **스타일**: Font Awesome 6.0.0 아이콘 사용

---

## 2. 폴더 구조

```
imet/hi/v2/
├── api/
│   └── login_v2.php              # 로그인 API (HMAC 인증)
├── css/
│   ├── basic.css                 # 기본 스타일
│   ├── dailyModal.css            # 일별실적 모달 스타일
│   └── depositModal.css          # 예치보험료 모달 스타일
├── js/
│   ├── apiClient.js              # API 클라이언트 (HMAC 인증)
│   ├── apiClientBack.js          # API 클라이언트 백업 파일
│   ├── basic.js                  # 메인 애플리케이션 로직
│   ├── basicBack.js              # 메인 로직 백업 파일
│   ├── basic_modal.js            # 상세 정보 모달
│   ├── basic_modal2.js           # 일별실적 모달
│   └── basic_modal3.js           # 예치보험료 모달
├── dashboard.html                # 대시보드 메인 페이지
└── login.html                    # 로그인 페이지
```

---

## 3. 주요 파일 분석

### 3.1 로그인 페이지 (`login.html`)

**위치**: `imet/hi/v2/login.html`

**주요 기능**:
- 아이디/비밀번호 로그인 폼
- HMAC 인증 준비 (클라이언트 측 서명 생성 함수 포함)
- 로그인 성공 시 `sessionStorage`에 사용자 정보 저장
- API 키/시크릿 저장 (HMAC 인증용)

**동작 흐름**:
1. 사용자가 아이디/비밀번호 입력
2. `./api/login_v2.php`로 POST 요청
3. 로그인 성공 시 `user_info_v2`에 사용자 정보 저장 (API 키 포함)
4. `dashboard.html`로 리다이렉트

**저장되는 정보**:
```javascript
{
  user_num: 123,
  user_name: "거래처명",
  user_id: "mem_id",
  phone: "연락처",
  ch: "상태코드",
  directory: "폴더명",
  login_time: "로그인시간",
  api_key: "pk_...",
  api_secret: "sk_..."
}
```

### 3.2 대시보드 페이지 (`dashboard.html`)

**위치**: `imet/hi/v2/dashboard.html`

**주요 섹션**:
1. **대시보드 (intro)**: 시스템 정보, 보험 상품 정보, 재고자산 신청 페이지 링크
2. **신청자 리스트 (list)**: 약국 신청 목록 조회, 상태별 필터링, 검색 기능

**레이아웃**:
- 헤더: 사용자 정보, 로그아웃 버튼
- 사이드바: 메뉴 네비게이션
- 콘텐츠 영역: 각 섹션별 내용
- 푸터: 저작권 정보

### 3.3 API 클라이언트 (`apiClient.js`)

**위치**: `imet/hi/v2/js/apiClient.js`

**주요 기능**:
1. **HMAC 서명 생성**: `generateHMAC()` 함수로 HMAC-SHA256 서명 생성
2. **API 호출**: `callApiV2()` 함수로 모든 API v2 엔드포인트 호출
3. **세션 관리**: `getUserInfo()` 함수로 sessionStorage에서 사용자 정보 조회

**API 엔드포인트 매핑**:
```javascript
const API_ENDPOINTS = {
  'list': 'list_v2.php',
  'detail': 'detail_v2.php',
  'balance': 'balance_v2.php',
  'status': 'pharmacy-status-update_v2.php',
  'calculate': 'pharmacy-premium-calculate_v2.php',
  'update': 'pharmacyApply-num-update_v2.php',
  'daily_stats': 'daily_stats_v2.php',
  'monthly_stats': 'monthly_stats_v2.php',
  'deposit_balance': 'deposit_balance_v2.php',
  'monthly_detail': 'monthly_detail_v2.php'
};
```

**HMAC 서명 생성 과정**:
1. 요청 본문(body)을 SHA256 해시로 변환
2. 서명 메시지 생성: `METHOD\nURI\nTIMESTAMP\nBODY_HASH`
3. HMAC-SHA256으로 서명 생성
4. HTTP 헤더에 포함: `Authorization`, `X-Timestamp`, `X-Signature`

### 3.4 메인 애플리케이션 로직 (`basic.js`)

**위치**: `imet/hi/v2/js/basic.js`

**주요 기능**:
1. **애플리케이션 초기화**: 세션 체크, 필터 기본값 설정
2. **신청자 리스트 조회**: 상태 필터, 검색 기능
3. **페이지네이션**: 페이지별 데이터 조회
4. **Quick Links 생성**: directory 값에 따른 재고자산 신청 페이지 링크 동적 생성

**초기화 흐름**:
```javascript
1. checkSession() - 세션 유효성 확인
2. setDefaultStatusFilter() - 사용자 ch 값으로 필터 기본값 설정
3. generateQuickLinks() - 재고자산 신청 페이지 링크 생성
4. updateCurrentTime() - 현재 시간 표시
5. fetchBalance() - 예치금 잔액 조회
```

### 3.5 모달 관련 스크립트

#### `basic_modal.js` - 상세 정보 모달
- 약국 신청자 상세 정보 표시
- 정보 수정 기능
- 반응형 디자인 (데스크톱/모바일)

#### `basic_modal2.js` - 일별실적 모달
- 일별 신청 현황 조회
- 통계 데이터 표시

#### `basic_modal3.js` - 예치보험료 모달
- 예치금 잔액 조회
- 사용 내역 확인

### 3.6 로그인 API (`login_v2.php`)

**위치**: `imet/hi/v2/api/login_v2.php`

**주요 기능**:
1. 아이디/비밀번호 검증 (MD5 해시)
2. `pharmacy_idList` 테이블에서 사용자 조회
3. API 키/시크릿 반환
4. 세션 설정
5. 마지막 API 호출 시간 업데이트

**응답 형식**:
```json
{
  "success": true,
  "message": "로그인에 성공했습니다.",
  "data": {
    "user_num": 123,
    "user_name": "거래처명",
    "user_id": "mem_id",
    "phone": "연락처",
    "ch": "상태코드",
    "directory": "pharmacy",
    "login_time": "2025-01-XX XX:XX:XX",
    "api_key": "pk_...",
    "api_secret": "sk_..."
  }
}
```

---

## 4. API 연동 구조

### 4.1 API 엔드포인트 위치

모든 API v2 엔드포인트는 `imet/hi/api/` 폴더에 위치합니다.

**주요 API 목록**:
- `list_v2.php` - 약국 리스트 조회
- `detail_v2.php` - 약국 상세 조회
- `balance_v2.php` - 잔고 조회
- `deposit_balance_v2.php` - 예치금 잔액 조회
- `daily_stats_v2.php` - 일별 실적 조회
- `monthly_stats_v2.php` - 월별 실적 조회
- `monthly_detail_v2.php` - 월별 실적 엑셀 다운로드
- `pharmacy-status-update_v2.php` - 상태 변경
- `pharmacy-premium-calculate_v2.php` - 보험료 계산
- `pharmacyApply-num-update_v2.php` - 기본정보 수정

### 4.2 HMAC 인증 헤더

모든 API v2 요청에는 다음 헤더가 포함됩니다:

```
Authorization: Bearer {api_key}
X-Timestamp: {unix_timestamp}
X-Signature: {hmac_signature}
Content-Type: application/json
X-API-Version: v2
```

### 4.3 서명 생성 규칙

1. **요청 본문 해시**: 요청 본문(body)을 SHA256 해시로 변환
2. **서명 메시지**: `METHOD\nURI\nTIMESTAMP\nBODY_HASH` 형식
3. **HMAC 서명**: 서명 메시지를 HMAC-SHA256으로 서명 (secret key 사용)
4. **헤더 전달**: 서명을 16진수 문자열로 변환하여 `X-Signature` 헤더에 포함

**예시**:
```javascript
// 요청
POST /hi/api/list_v2.php
Body: {"section":"user_num","page":1}

// 서명 생성
const bodyHash = sha256(JSON.stringify(body));
const message = "POST\n/hi/api/list_v2.php\n1234567890\n" + bodyHash;
const signature = hmac_sha256(message, api_secret);
```

---

## 5. 인증 시스템

### 5.1 로그인 프로세스

1. **사용자 로그인** (`login.html`)
   - 아이디/비밀번호 입력
   - `login_v2.php`로 POST 요청
   - MD5 해시로 비밀번호 검증

2. **세션 설정**
   - PHP 세션에 사용자 정보 저장
   - `user_num`, `user_name`, `user_id` 등

3. **API 키 반환**
   - `pharmacy_idList` 테이블에서 `api_key`, `api_secret` 조회
   - 클라이언트에 JSON 응답으로 전달

4. **클라이언트 저장**
   - `sessionStorage`에 `user_info_v2`로 저장
   - 이후 모든 API 호출에 사용

### 5.2 API 호출 인증

모든 API v2 호출은 HMAC 인증을 사용합니다:

1. `sessionStorage`에서 API 키/시크릿 조회
2. 요청 본문 해시 생성 (SHA256)
3. 서명 메시지 생성
4. HMAC 서명 생성
5. HTTP 헤더에 포함하여 요청

### 5.3 타임스탬프 검증

서버 측에서 타임스탬프를 검증합니다:
- 현재 시간 기준 ±5분 이내여야 함
- 타임스탬프가 범위를 벗어나면 401 에러 반환

---

## 6. 주요 기능

### 6.1 대시보드

**시스템 정보 카드**:
- 로그인 시간
- 사용자 번호
- 현재 시간 (실시간 업데이트)
- 시스템 상태

**보험 상품 정보**:
- 전문인배상책임보험 상세 담보
- 화재종합보험 상세 담보
- 보상한도 및 자기부담금 정보

**재고자산 신청 페이지 링크**:
- directory 값에 따라 동적으로 생성
- 5천만원, 1억원, 2억원, 3억원, 5억원 페이지 링크

**주요 관리 프로세스**:
- 청약 프로세스
- 가입 내용 변경
- 계약 해지 처리

### 6.2 신청자 리스트

**필터링 기능**:
- 상태 필터: 전체, 메일보냄, 승인, 설계중, 계약완료, 증권발송, 해지요청중, 해지완료됨, 보류
- 검색 유형: 약국명, 사업자번호, 기간조회
- 검색어 입력

**액션 버튼**:
- 검색 버튼
- 일별실적 버튼 (모달)
- 예치보험료 버튼 (모달)

**표시 정보**:
- item_num (신청 번호)
- 업체명
- 사업자번호
- 담당자
- 휴대전화
- 연락처
- e-mail
- 보험기간
- 상태
- 메모
- 보험료

**반응형 디자인**:
- 데스크톱: 테이블 형식
- 모바일: 카드 형식

### 6.3 상세 정보 모달

**표시 정보**:
- 기본 정보: 상호, 사업자번호, 주소, 이메일, 전화번호
- 신청자 정보: 신청자명, 주민번호
- 보험 정보: 전문인수, 재고자산, 담보한도, 사업장면적
- 보험료 정보: 전문인 보험료, 화재 보험료, 총 보험료
- 증권 정보: 전문인 증권번호, 화재 증권번호
- 보험기간: 시작일, 종료일
- 상태 및 메모

**수정 기능**:
- 승인 전 상태에서만 수정 가능
- 정보 수정 시 보험료 자동 재계산
- 수정 후 저장

### 6.4 일별실적 모달

**기능**:
- 일별 신청 현황 조회
- 통계 데이터 표시
- 기간별 필터링

### 6.5 예치보험료 모달

**기능**:
- 예치금 잔액 조회
- 사용 내역 확인
- 입금 내역 조회

---

## 7. 데이터 흐름

### 7.1 로그인 흐름

```
[사용자]
    ↓ (아이디/비밀번호)
[login.html]
    ↓ POST /hi/v2/api/login_v2.php
[login_v2.php]
    ↓ (MD5 검증, API 키 조회)
[pharmacy_idList 테이블]
    ↓ (API 키/시크릿 반환)
[login.html]
    ↓ (sessionStorage 저장)
[dashboard.html]
```

### 7.2 API 호출 흐름

```
[basic.js / modal]
    ↓ (API 호출 요청)
[apiClient.js - callApiV2()]
    ↓ (HMAC 서명 생성)
    ↓ POST /hi/api/{endpoint}_v2.php
    ↓ (Authorization, X-Timestamp, X-Signature 헤더)
[PHP API v2]
    ↓ (HMAC 검증)
    ↓ (비즈니스 로직 처리)
[데이터베이스]
    ↓ (결과 반환)
[apiClient.js]
    ↓ (JSON 응답)
[basic.js / modal]
    ↓ (UI 업데이트)
```

### 7.3 상태 변경 흐름

```
[신청자 리스트]
    ↓ (번호 클릭)
[상세 정보 모달]
    ↓ (정보 수정)
[basic_modal.js]
    ↓ callApiV2('update', {...})
[pharmacyApply-num-update_v2.php]
    ↓ (정보 업데이트)
    ↓ callApiV2('calculate', {...})
[pharmacy-premium-calculate_v2.php]
    ↓ (보험료 재계산)
[pharmacyApply 테이블 업데이트]
    ↓ (결과 반환)
[모달 UI 업데이트]
```

---

## 8. 주요 특징

### 8.1 보안

- **HMAC 인증**: 모든 API 호출에 HMAC-SHA256 서명 필수
- **타임스탬프 검증**: 재전송 공격 방지
- **세션 관리**: 초기 로그인은 세션 기반, 이후 API는 HMAC 기반

### 8.2 사용자 경험

- **반응형 디자인**: 모바일, 태블릿, 데스크탑 모두 지원
- **실시간 업데이트**: 현재 시간 표시
- **직관적인 UI**: Font Awesome 아이콘 사용
- **빠른 링크**: 재고자산 신청 페이지 바로가기

### 8.3 데이터 관리

- **필터링**: 상태별, 검색어별 필터링
- **페이지네이션**: 대량 데이터 효율적 조회
- **상태 추적**: 신청부터 해지까지 전체 프로세스 추적

---

## 9. 관련 문서

- [약국배상책임보험 시스템 통합 문서](./pharmacy-통합-문서.md)
- [API v2 개발자 가이드](../hi/api/doc/약국안심보험%20API%20v2%20개발자%20가이드.md)

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

