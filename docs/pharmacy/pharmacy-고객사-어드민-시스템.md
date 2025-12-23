# 약국배상책임보험 고객사 어드민 시스템 (imet/hi/v2/)

**작성일**: 2025-01-XX  
**버전**: 2.0

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [디렉토리 구조](#디렉토리-구조)
3. [주요 기능](#주요-기능)
4. [인증 시스템](#인증-시스템)
5. [API 엔드포인트](#api-엔드포인트)
6. [프론트엔드 구조](#프론트엔드-구조)

---

## 시스템 개요

### 목적
약국배상책임보험 고객사(거래처)를 위한 관리자 시스템입니다. 고객사는 이 시스템을 통해 자신의 약국 신청 목록을 조회하고, 상태를 확인하며, 일별 실적과 예치보험료를 관리할 수 있습니다.

### 사용자
- **고객사 관리자**: 각 거래처(pharmacy_idList)의 관리자
- **권한**: 자신의 거래처에 속한 약국 신청만 조회 및 관리 가능

### 주요 특징
- **HMAC 인증**: API 키/시크릿 기반 보안 인증
- **회사별 필터링**: pharmacy_idList의 `ch` 값에 따라 기본 필터 설정
- **실시간 상태 관리**: 신청 상태 조회 및 확인
- **일별 실적 조회**: 일별 신청 현황 확인
- **예치보험료 관리**: 예치금 조회 및 관리

---

## 디렉토리 구조

```
imet/hi/v2/
├── api/
│   └── login_v2.php          # 로그인 API (HMAC 인증)
├── css/
│   ├── basic.css             # 기본 스타일
│   ├── dailyModal.css        # 일별실적 모달 스타일
│   └── depositModal.css      # 예치보험료 모달 스타일
├── js/
│   ├── apiClient.js          # API 클라이언트 (HMAC 인증)
│   ├── apiClientBack.js      # 백엔드 API 클라이언트
│   ├── basic.js              # 메인 애플리케이션 로직
│   ├── basicBack.js          # 백엔드 API 호출 로직
│   ├── basic_modal.js        # 상세 정보 모달
│   ├── basic_modal2.js        # 일별실적 모달
│   └── basic_modal3.js       # 예치보험료 모달
├── dashboard.html            # 대시보드 메인 페이지
└── login.html                # 로그인 페이지
```

---

## 주요 기능

### 1. 로그인 시스템

**파일**: `login.html`, `api/login_v2.php`

**기능**:
- 아이디/비밀번호 기반 로그인
- MD5 비밀번호 검증
- API 키/시크릿 발급
- 세션 기반 인증
- HMAC 인증을 위한 API 키 저장

**프로세스**:
```
[로그인 요청]
    ↓
[pharmacy_idList에서 사용자 조회]
    ↓
[MD5 비밀번호 검증]
    ↓
[API 키/시크릿 반환]
    ↓
[sessionStorage에 사용자 정보 저장]
    ↓
[대시보드로 이동]
```

**응답 데이터**:
```json
{
  "success": true,
  "data": {
    "user_num": 123,
    "user_name": "고객사명",
    "user_id": "admin",
    "ch": "10",
    "directory": "pharmacy",
    "api_key": "pk_...",
    "api_secret": "sk_..."
  }
}
```

### 2. 대시보드

**파일**: `dashboard.html`, `js/basic.js`

**주요 섹션**:

#### 2.1 시스템 정보 카드
- 로그인 시간
- 사용자 번호
- 현재 시간
- 시스템 상태

#### 2.2 보험 상품 정보
- 전문인배상책임보험 상세 정보
- 화재종합보험 상세 정보
- 담보 내용 및 보상한도 표시

#### 2.3 재고자산 신청 페이지 링크
- 동적으로 생성되는 신청 페이지 링크
- 재고자산별 (5천만원, 1억원, 2억원, 3억원, 5억원) 링크 제공
- `directory` 값에 따라 경로 자동 설정

#### 2.4 주요 관리 프로세스 안내
- 청약 프로세스
- 가입 내용 변경
- 계약 해지 처리

### 3. 신청자 리스트

**파일**: `dashboard.html` (list 섹션), `js/basic.js`

**기능**:
- 신청자 목록 조회 및 표시
- 상태별 필터링 (메일보냄, 승인, 설계중, 계약완료, 증권발송, 해지요청중, 해지완료됨, 보류)
- 검색 기능 (약국명, 사업자번호, 기간조회)
- 페이지네이션
- 반응형 디자인 (데스크탑 테이블 / 모바일 카드)

**기본 필터 설정**:
- 사용자의 `ch` 값에 따라 기본 상태 필터 자동 설정
- 예: `ch='10'`이면 "메일보냄" 상태가 기본 필터

**표시 항목**:
- 번호 (item_num)
- 업체명
- 사업자번호
- 담당자
- 휴대전화
- 연락처
- 이메일
- 보험기간
- 상태
- 메모
- 보험료

### 4. 상세 정보 모달

**파일**: `js/basic_modal.js`

**기능**:
- 신청자 번호 클릭 시 상세 정보 표시
- 약국 정보, 보험 정보, 연락처 정보 표시
- 상태 변경 불가 (읽기 전용)
- 모바일 반응형 디자인

### 5. 일별 실적

**파일**: `js/basic_modal2.js`, `css/dailyModal.css`

**기능**:
- 일별 신청 현황 조회
- 날짜별 필터링
- 통계 정보 표시
- 모달 형태로 표시

### 6. 예치보험료 관리

**파일**: `js/basic_modal3.js`, `css/depositModal.css`

**기능**:
- 예치금 잔액 조회
- 예치금 사용 내역 확인
- 모달 형태로 표시

---

## 인증 시스템

### HMAC 인증

**파일**: `js/apiClient.js`

**인증 방식**:
1. API 키를 `Authorization: Bearer {api_key}` 헤더에 포함
2. 타임스탬프를 `X-Timestamp` 헤더에 포함
3. 요청 본문의 SHA-256 해시 계산
4. 서명 문자열 생성: `{method}\n{uri}\n{timestamp}\n{body_hash}`
5. HMAC-SHA256으로 서명 생성
6. 서명을 `X-Signature` 헤더에 포함

**예시**:
```javascript
const signature = generateHmacSignature(
    method,      // 'POST'
    uri,         // '/hi/api/pharmacy-status-update_v2.php'
    timestamp,   // 1234567890
    body,        // JSON 문자열
    apiSecret    // 'sk_...'
);
```

### 세션 관리

**저장 위치**: `sessionStorage`

**키**: `user_info_v2`

**저장 데이터**:
```javascript
{
  user_num: 123,
  user_name: "고객사명",
  user_id: "admin",
  ch: "10",
  directory: "pharmacy",
  api_key: "pk_...",
  api_secret: "sk_...",
  login_time: "2025-01-15 10:30:00",
  api_version: "v2"
}
```

---

## API 엔드포인트

### 1. 로그인

**엔드포인트**: `POST /hi/v2/api/login_v2.php`

**요청**:
```json
{
  "mem_id": "admin",
  "passwd": "password"
}
```

**응답**:
```json
{
  "success": true,
  "message": "로그인에 성공했습니다.",
  "data": {
    "user_num": 123,
    "user_name": "고객사명",
    "user_id": "admin",
    "ch": "10",
    "directory": "pharmacy",
    "api_key": "pk_...",
    "api_secret": "sk_..."
  }
}
```

### 2. 신청자 리스트 조회

**엔드포인트**: `GET /hi/api/pharmacy-list.php` (백엔드 API)

**Query Parameters**:
- `account`: pharmacy_idList.num (자동 설정)
- `ch`: 상태 필터
- `search_type`: 검색 유형 (name, bizno, period)
- `search_query`: 검색어
- `date_from`: 시작일 (기간조회)
- `date_to`: 종료일 (기간조회)
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

**응답**: `disk-cms`의 `pharmacy-list.php`와 동일한 형식

### 3. 상세 정보 조회

**엔드포인트**: `GET /hi/api/pharmacy-detail.php` (백엔드 API)

**Query Parameters**:
- `num`: 신청자 번호

**응답**: 약국 상세 정보 JSON

---

## 프론트엔드 구조

### 페이지 구조

**대시보드** (`dashboard.html`):
- Header: 사용자 정보, 로그아웃 버튼
- Sidebar: 메뉴 네비게이션
- Content Area:
  - 대시보드 섹션 (intro)
  - 신청자 리스트 섹션 (list)
- Footer: 저작권 정보

### JavaScript 모듈

#### `apiClient.js`
- HMAC 인증 처리
- API 요청 래퍼 함수
- 에러 처리

#### `basic.js`
- 애플리케이션 초기화
- 이벤트 리스너 설정
- 신청자 리스트 로드
- 페이지네이션 처리
- Quick Links 생성

#### `basic_modal.js`
- 상세 정보 모달 표시
- 데이터 포맷팅
- 모달 열기/닫기

#### `basic_modal2.js`
- 일별 실적 모달
- 날짜 필터링
- 통계 계산

#### `basic_modal3.js`
- 예치보험료 모달
- 예치금 조회
- 사용 내역 표시

---

## 데이터베이스 연동

### 사용 테이블

1. **pharmacy_idList**
   - 사용자 인증 정보
   - API 키/시크릿 저장
   - `ch` 값으로 기본 필터 설정

2. **pharmacyApply**
   - 약국 신청 정보
   - `account` 필드로 고객사별 필터링

3. **pharmacy_settlementList** (예상)
   - 예치금 거래 내역

---

## 보안 고려사항

1. **HMAC 인증**: 모든 API 요청에 HMAC 서명 필수
2. **세션 관리**: sessionStorage 사용 (브라우저 종료 시 자동 삭제)
3. **API 키 보호**: API 시크릿은 클라이언트에 저장되지만, 서버에서 검증
4. **CORS 설정**: 백엔드 API에서 CORS 허용 도메인 제한 필요

---

## 주요 차이점 (disk-cms와 비교)

| 항목 | disk-cms (신규 어드민) | imet/hi/v2 (고객사 어드민) |
|------|----------------------|--------------------------|
| 사용자 | 전체 관리자 | 고객사별 관리자 |
| 권한 | 모든 약국 조회/관리 | 자신의 거래처만 조회 |
| 인증 | 세션 기반 | HMAC + 세션 |
| 필터 | 전체 상태 | 사용자 ch 값 기반 기본 필터 |
| 기능 | 전체 관리 기능 | 조회 및 확인 중심 |

---

## 다음 단계

1. API 엔드포인트 상세 문서화
2. 에러 처리 가이드 작성
3. 사용자 매뉴얼 작성
4. 보안 강화 방안 검토

