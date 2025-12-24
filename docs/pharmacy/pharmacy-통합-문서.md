# 약국배상책임보험 시스템 통합 문서

**작성일**: 2025-01-XX  
**버전**: 1.0  
**최종 업데이트**: 2025-01-XX

---

## 📋 목차

1. [시스템 개요](#1-시스템-개요)
2. [아키텍처](#2-아키텍처)
3. [파일 구조 및 생성 가이드](#3-파일-구조-및-생성-가이드)
4. [프론트엔드 개발 가이드](#4-프론트엔드-개발-가이드)
5. [백엔드 API (PHP)](#5-백엔드-api-php)
6. [Node.js 프록시 API](#6-nodejs-프록시-api)
7. [주요 기능 상세](#7-주요-기능-상세)
8. [API 연동 가이드 (HMAC 인증)](#8-api-연동-가이드-hmac-인증)
9. [고객사 어드민 시스템](#9-고객사-어드민-시스템)
10. [신청 시스템](#10-신청-시스템)
11. [갱신 프로세스](#11-갱신-프로세스)
12. [PHP 파일 작성 규칙](#12-php-파일-작성-규칙)
13. [보험료 검증](#13-보험료-검증)
14. [메모 기능](#14-메모-기능)
15. [부록](#15-부록)

---dd


## 1. 시스템 개요

### 1.1 아키텍처

- **프론트엔드**: HTML + JavaScript (Vanilla JS) + Bootstrap 5
- **중간 계층**: Node.js/Express 프록시 라우터
- **백엔드**: PHP 7.x+ (PDO, JSON 응답)
- **데이터베이스**: MySQL/MariaDB

### 1.2 주요 특징

- RESTful API 기반 JSON 통신
- UTF-8 인코딩
- CORS 지원
- 트랜잭션 기반 데이터 처리
- 로깅 시스템

### 1.3 서버 정보

- **프론트엔드**: `https://disk-cms.simg.kr/pages/pharmacy/`
- **Node.js 프록시**: `/api/pharmacy/*` (routes/pharmacy.js)
- **PHP 백엔드 (프로덕션)**: `https://imet.kr/api/pharmacy/*` 또는 `https://silbo.kr/api/pharmacy/*`
- **PHP 백엔드 (로컬 개발)**: `imet/api/pharmacy/*` (로컬 파일 시스템)
- **데이터베이스**: MySQL

**중요**: 
- 로컬 개발 시 PHP 파일은 `imet/api/pharmacy/` 폴더에 위치합니다
- Node.js 프록시는 항상 프로덕션 URL을 호출하므로, 로컬에서 PHP를 테스트하려면 별도의 PHP 서버가 필요합니다

---

## 2. 아키텍처

### 2.1 3계층 아키텍처

```
┌─────────────────┐
│  프론트엔드      │
│  (HTML/JS)      │
│  disk-cms.simg.kr│
└────────┬────────┘
         │ HTTP 요청
         │ /api/pharmacy/list
         ↓
┌─────────────────┐
│  Node.js 프록시  │
│  (Express)      │
│  routes/pharmacy.js│
└────────┬────────┘
         │ Axios HTTP 요청
         │ https://imet.kr/api/pharmacy/pharmacy-list.php
         ↓
┌─────────────────┐
│  PHP 백엔드 API  │
│  (PDO/MySQL)    │
│  imet.kr        │
└────────┬────────┘
         │ SQL 쿼리
         ↓
┌─────────────────┐
│  MySQL DB       │
└─────────────────┘
```

### 2.2 통신 흐름

#### 프론트엔드 → Node.js 프록시

**프론트엔드 코드** (`pharmacy.js`):
```javascript
const response = await fetch('/api/pharmacy/list?page=1&limit=20', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  credentials: 'include'
});
```

#### Node.js 프록시 → PHP 백엔드

**Node.js 프록시 코드** (`routes/pharmacy.js`):
```javascript
router.get('/list', async (req, res) => {
    try {
        const apiUrl = 'https://imet.kr/api/pharmacy/pharmacy-list.php';
        const params = req.query;
        
        const response = await axios.get(apiUrl, {
            params: params,
            timeout: 15000,
            headers: {
                'User-Agent': 'disk-cms-proxy/1.0',
                'Accept': 'application/json'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Pharmacy API 프록시 오류:', error.message);
        res.status(500).json({
            success: false,
            error: 'API 서버 오류',
            details: error.message
        });
    }
});
```

### 2.3 프록시의 역할

1. **요청 전달**: 프론트엔드 요청을 PHP 백엔드로 전달
2. **응답 전달**: PHP 응답을 그대로 프론트엔드에 전달
3. **에러 처리**: PHP API 오류를 적절히 처리하고 프론트엔드에 전달
4. **로깅**: 모든 API 요청을 로깅
5. **인증/권한 체크**: 세션 기반 인증 체크 (선택적)
6. **CORS 문제 해결**: 같은 도메인에서 요청하므로 CORS 문제 없음

### 2.4 PHP 백엔드 서버

| 서버 | 프로덕션 URL | 로컬 개발 경로 | 용도 |
|------|------------|--------------|------|
| **imet.kr** | `https://imet.kr/api/pharmacy/*` | `imet/api/pharmacy/*` | 약국배상책임보험 API |
| **silbo.kr** | `https://silbo.kr/api/pharmacy/*` | `silbo/api/pharmacy/*` (추정) | 대체 서버 (백업) |

---

## 3. 파일 구조 및 생성 가이드

### 3.1 프로젝트 루트 구조

```
d:\development\
├── disk-cms/                    # Node.js 프론트엔드 서버
│   ├── public/
│   │   ├── pages/pharmacy/      # 프론트엔드 HTML 페이지
│   │   └── js/pharmacy/         # JavaScript 파일
│   └── routes/
│       ├── pharmacy.js          # Node.js 프록시 메인 라우터
│       └── pharmacy/            # Node.js 프록시 하위 라우터
│           ├── admin.js
│           ├── deposits.js
│           ├── reports.js
│           └── pharmacy2.js
│
└── imet/                        # PHP 백엔드 (로컬 개발)
    └── api/
        └── pharmacy/            # PHP API 파일들
            ├── pharmacy-list.php
            ├── pharmacy-accounts.php
            └── ... (40개 이상의 PHP 파일)
```

### 3.2 파일 경로 매핑

| 구분 | 프로덕션 URL | 로컬 개발 경로 |
|------|------------|--------------|
| **PHP API** | `https://imet.kr/api/pharmacy/*` | `d:\development\imet\api\pharmacy\*` |
| **프론트엔드** | `https://disk-cms.simg.kr/pages/pharmacy/*` | `d:\development\disk-cms\public\pages\pharmacy\*` |
| **Node.js 프록시** | `https://disk-cms.simg.kr/api/pharmacy/*` | `http://localhost:3000/api/pharmacy/*` |

**중요**: 
- **프로덕션 URL** `imet.kr` = **로컬 폴더** `imet`
- **프로덕션 URL** `silbo.kr` = **로컬 폴더** `silbo` (추정)

### 3.3 파일 생성 규칙

#### PHP 파일 생성 위치

**로컬 개발 경로**:
```
d:\development\imet\api\pharmacy\파일명.php
```

**프로덕션 배포 경로** (배포 시):
```
https://imet.kr/api/pharmacy/파일명.php
```

**파일명 규칙**:
- `pharmacy-` 접두사 사용 (예: `pharmacy-new-api.php`)
- `pharmacyApply-` 접두사 사용 (예: `pharmacyApply-num-detail.php`)
- kebab-case 사용 (하이픈으로 단어 구분)

#### Node.js 프록시 파일 생성 위치

**메인 라우터**:
```
d:\development\disk-cms\routes\pharmacy.js
```

**하위 라우터**:
```
d:\development\disk-cms\routes\pharmacy\
├── admin.js          # 관리자 기능
├── deposits.js       # 예치금 관리
├── reports.js        # 실적 관리
└── pharmacy2.js      # 업체 관리
```

**중요**: Node.js 프록시는 항상 프로덕션 URL(`https://imet.kr/api/pharmacy/*`)을 호출

#### 프론트엔드 파일 생성 위치

**HTML 페이지**:
```
d:\development\disk-cms\public\pages\pharmacy\파일명.html
```

**JavaScript 파일**:
```
d:\development\disk-cms\public\js\pharmacy\파일명.js
```

**파일명 규칙**:
- JavaScript: `pharmacy_` 접두사, 언더스코어 구분
- HTML: kebab-case 사용

---

## 4. 프론트엔드 개발 가이드

### 4.1 페이지 구조

**기본 HTML 구조**:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>보험 CMS | 약국배상책임보험</title>
  
  <!-- 공통 리소스 -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="/css/sj-styles.css" rel="stylesheet">
</head>
<body>
  <!-- 헤더 컨테이너 -->
  <div id="header-container"></div>
  
  <!-- 사이드바 컨테이너 -->
  <div id="sidebar-container"></div>
  
  <!-- 메인 컨텐츠 -->
  <main class="main-content">
    <!-- 페이지별 내용 -->
  </main>
  
  <!-- 스크립트 -->
  <script src="/js/sj-template-loader.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async function() {
      await window.sjTemplateLoader.initializePage('pharmacy-applications');
    });
  </script>
</body>
</html>
```

### 4.2 템플릿 시스템

**sj-template-loader.js**:
- 헤더/사이드바/푸터 자동 로드
- 인증 체크
- 메뉴 활성화
- 권한별 UI 제어

**초기화**:
```javascript
await window.sjTemplateLoader.initializePage('pharmacy-applications');
```

**pageId 규칙**: 사이드바의 `data-menu` 속성과 일치해야 함

### 4.3 JavaScript 구조

**전역 변수**:
```javascript
let currentPage = 1;
let currentPageSize = 20;
let currentSearchTerm = '';
let currentStatusFilter = '13';
let currentAccountFilter = '';
```

**데이터 로드 함수**:
```javascript
async function loadPharmacyData() {
  try {
    showLoading();
    
    const params = new URLSearchParams({
      page: currentPage,
      limit: currentPageSize,
      search: currentSearchTerm,
      status: currentStatusFilter,
      account: currentAccountFilter
    });
    
    const response = await fetch(`/api/pharmacy/list?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      renderPharmacyTable(data.data);
      renderPagination(data.pagination);
    } else {
      showError(data.error || '데이터를 불러오는데 실패했습니다.');
    }
    
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    showError('데이터를 불러오는데 실패했습니다.');
  } finally {
    hideLoading();
  }
}
```

### 4.4 페이지 상태 관리

**localStorage를 사용한 페이지 상태 저장**:
```javascript
function savePageState() {
  localStorage.setItem('pharmacy_currentPage', currentPage);
  localStorage.setItem('pharmacy_currentPageSize', currentPageSize);
  localStorage.setItem('pharmacy_currentSearchTerm', currentSearchTerm);
  localStorage.setItem('pharmacy_currentStatusFilter', currentStatusFilter);
  localStorage.setItem('pharmacy_currentAccountFilter', currentAccountFilter);
}

function restorePageState() {
  currentPage = parseInt(localStorage.getItem('pharmacy_currentPage')) || 1;
  currentPageSize = parseInt(localStorage.getItem('pharmacy_currentPageSize')) || 20;
  currentSearchTerm = localStorage.getItem('pharmacy_currentSearchTerm') || '';
  currentStatusFilter = localStorage.getItem('pharmacy_currentStatusFilter') || '13';
  currentAccountFilter = localStorage.getItem('pharmacy_currentAccountFilter') || '';
}
```

---

## 5. 백엔드 API (PHP)

### 5.1 주요 PHP API 파일

**로컬 개발 경로** (`d:\development\imet\api\pharmacy\`):
```
pharmacy-list.php                    # 약국 목록 조회
pharmacy-accounts.php                # 거래처 목록 조회
pharmacyApply-num-detail.php         # 약국 상세 정보
pharmacyApply-num-update.php         # 약국 정보 수정
pharmacy-id-list.php                 # 업체 리스트
pharmacy-id-check.php                # 아이디 중복 확인
pharmacy-deposit-balance.php         # 예치 잔액 조회
pharmacy-deposit-list.php            # 예치금 리스트
pharmacy-daily-report.php            # 일별 실적 조회
pharmacy-api-keys-list.php           # API 키 목록
pharmacy-premium-calculate.php       # 보험료 계산
pharmacy-certificate-update.php      # 증권번호 업데이트
pharmacy-design-update.php           # 설계번호 업데이트
pharmacy-status-update.php           # 상태 업데이트
pharmacy-memo-update.php             # 메모 업데이트
... (총 40개 이상의 PHP 파일)
```

### 5.2 보험료 계산

**일반 보험료 계산** (`pharmacy-premium-calculate.php`):
- 전문인 배상책임보험료: `pharmacyProPreminum` 테이블
- 화재보험료: `pharmacyPreminum` 테이블
- 면적 80㎡ 미만 처리: 자동으로 80㎡로 계산

**유비케어 보험료 계산** (`pharmacy-premium-calculate-ubcare.php`):
- 전문인 배상책임보험료: `ubcareProPreminum` 테이블 (보상한도 포함)
- 화재보험료: `ubcarePreminum` 테이블
- 면적 80㎡ 미만 처리: 자동으로 80㎡로 계산

### 5.3 상태 업데이트

**pharmacy-status-update.php**:
- 승인(13): 예치금 차감, 정산 기록 생성, 이메일 발송
- 보류(7): 예치금 환급, 정산 기록 변경
- 해지완료(16): 일할 계산 환급
- 메일보냄(10) → 승인(13): 보험료 자동 재계산

**pharmacy-certificate-update.php** (증권번호 업데이트):
- 증권번호 입력 시: 상태가 **증권발급(14)**로 변경
- 전문인/화재 증권번호 구분 저장
- PDF 자동 생성 및 메일/SMS 발송 지원

---

## 6. Node.js 프록시 API

### 6.1 메인 라우터 (`routes/pharmacy.js`)

**주요 엔드포인트**:
- `GET /api/pharmacy/list` - 약국 목록 조회
- `GET /api/pharmacy/accounts` - 거래처 목록 조회
- `GET /api/pharmacy/id-detail/:num` - 약국 상세 정보
- `PUT /api/pharmacy/id-update/:num` - 약국 정보 수정
- `POST /api/pharmacy/id-create` - 약국 신규 등록
- `DELETE /api/pharmacy/id-delete/:num` - 약국 삭제
- `GET /api/pharmacy/id-check` - 아이디 중복 확인
- `POST /api/pharmacy/upload-files` - 파일 업로드
- `GET /api/pharmacy/files/:num` - 파일 목록 조회
- `GET /api/pharmacy/download/:filename` - 파일 다운로드
- `DELETE /api/pharmacy/files/:filename` - 파일 삭제
- `GET /api/pharmacy/premium-verify` - 보험료 검증
- `GET /api/pharmacy/certificate/:pharmacyId/:certificateType` - 증권 조회

### 6.2 하위 라우터

**admin.js** - 관리자 기능:
- `GET /api/pharmacy-admin/api-keys` - API 키 목록
- `POST /api/pharmacy-admin/api-keys/generate` - API 키 생성
- `DELETE /api/pharmacy-admin/api-keys/:id` - API 키 삭제

**deposits.js** - 예치금 관리:
- `GET /api/pharmacy-deposits/balance/:accountNum` - 예치 잔액
- `GET /api/pharmacy-deposits/list/:accountNum` - 예치금 리스트
- `POST /api/pharmacy-deposits/deposit` - 예치금 입금

**reports.js** - 실적 관리:
- `GET /api/pharmacy-reports/daily` - 일별 실적
- `GET /api/pharmacy-reports/monthly` - 월별 실적

**pharmacy2.js** - 업체 관리:
- `POST /api/pharmacy2/calculate-premium` - 보험료 계산
- `POST /api/pharmacy2/update-status` - 상태 업데이트
- `POST /api/pharmacy2/design-number` - 설계번호 업데이트
- `POST /api/pharmacy2/certificate-number` - 증권번호 업데이트
- `POST /api/pharmacy2/:pharmacyId/memo` - 메모 업데이트

---

## 7. 주요 기능 상세

### 7.1 약국 목록 관리

**기능**:
- 약국 목록 조회 (페이징 지원)
- 필터링 (거래처, 상태, 검색어)
- 약국 상세 정보 조회 (모달)
- 약국 정보 수정
- 약국 신규 등록
- 약국 삭제

**주요 필터**:
- **거래처 필터**: 거래처별 약국 목록 조회
- **상태 필터**: 메일보냄(10), 승인(13), 보류(7), 증권발급(14), 해지요청(15), 해지완료(16), 설계중(17)
- **검색**: 업체명, 사업자번호, 담당자로 검색

### 7.2 예치금 관리

**기능**:
- 예치 잔액 조회
- 예치금 입금 내역 조회
- 예치금 입금 처리
- 사용 내역 조회
- 전체 예치금 현황 조회

### 7.3 실적 관리

**기능**:
- 일별 실적 조회
- 월별 실적 조회
- 통계 조회

### 7.4 API 키 관리

**기능**:
- API 키 목록 조회
- API 키 생성
- API 키 활성화/비활성화
- API 키 재생성
- API 사용 로그 조회
- API 통계 조회

### 7.5 파일 관리

**기능**:
- 파일 업로드 (증권 파일, 영수증 파일)
- 파일 목록 조회
- 파일 다운로드
- 파일 삭제

---

## 8. API 연동 가이드 (HMAC 인증)

### 8.1 API 개요

약국배상책임보험 시스템의 API v2는 HMAC 인증 기반의 RESTful API로, 거래처(고객사)가 자신의 약국 신청 데이터를 안전하게 조회하고 관리할 수 있는 기능을 제공합니다.

### 8.2 인증 시스템

**HMAC 인증 방식**:

모든 API 요청은 다음 헤더가 필요합니다:
```http
Authorization: Bearer {api_key}
X-Timestamp: {unix_timestamp}
X-Signature: {hmac_signature}
Content-Type: application/json
```

**서명 생성 방법** (JavaScript/Node.js):
```javascript
const crypto = require('crypto');

// 1. 요청 본문을 JSON 문자열로 변환
const requestBody = JSON.stringify(payload);

// 2. 서명용 문자열 생성
const stringToSign = `${method}\n${path}\n${timestamp}\n${requestBody}`;

// 3. HMAC-SHA256 서명 생성
const signature = crypto
  .createHmac('sha256', secretKey)
  .update(stringToSign, 'utf8')
  .digest('hex');
```

**서명 생성 규칙**:
1. HTTP 메서드: 대문자 (예: `POST`)
2. 요청 경로: `/hi/api/list_v2.php` (도메인 제외)
3. 타임스탬프: Unix timestamp (초 단위)
4. 요청 본문: JSON 문자열 (공백 포함)
5. 서명: HMAC-SHA256으로 생성된 16진수 문자열

**타임스탬프 검증**: 현재 시간 기준 ±5분 이내여야 함

### 8.3 주요 API 엔드포인트

**기본 URL**: `https://imet.kr`

#### 1. 약국 리스트 조회

**엔드포인트**: `POST /hi/api/list_v2.php`

**요청 본문**:
```json
{
  "section": "user_num",
  "chchange": "13",
  "filter_type": "name",
  "filter_query": "서울약국",
  "page": 1,
  "pageSize": 20
}
```

#### 2. 약국 상세 조회

**엔드포인트**: `POST /hi/api/detail_v2.php`

**요청 본문**:
```json
{
  "section": "detail",
  "item_num": 12345
}
```

#### 3. 상태 변경

**엔드포인트**: `POST /hi/api/pharmacy-status-update_v2.php`

**요청 본문**:
```json
{
  "item_num": 12345,
  "new_status": "13"
}
```

**특별 처리 로직**:
- 승인(13): 예치금 차감, 정산 기록 생성, 이메일 발송
- 보류(7): 예치금 환급, 정산 기록 변경
- 해지완료(16): 일할 계산 환급

#### 4. 기본정보 수정

**엔드포인트**: `POST /hi/api/pharmacyApply-num-update_v2.php`

#### 5. 보험료 계산

**엔드포인트**: `POST /hi/api/pharmacy-premium-calculate_v2.php`

#### 6. 잔고 조회

**엔드포인트**: `POST /hi/api/balance_v2.php`

#### 7. 예치금 잔액 조회

**엔드포인트**: `POST /hi/api/deposit_balance_v2.php`

#### 8. 일별 실적 조회

**엔드포인트**: `POST /hi/api/daily_stats_v2.php`

#### 9. 월별 실적 조회

**엔드포인트**: `POST /hi/api/monthly_stats_v2.php`

---

## 9. 고객사 어드민 시스템

### 9.1 시스템 개요

약국배상책임보험 고객사(거래처)를 위한 관리자 시스템입니다. 고객사는 이 시스템을 통해 자신의 약국 신청 목록을 조회하고, 상태를 확인하며, 일별 실적과 예치보험료를 관리할 수 있습니다.

**위치**: `imet/hi/v2/`

### 9.2 디렉토리 구조

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
│   ├── basic.js              # 메인 애플리케이션 로직
│   ├── basic_modal.js        # 상세 정보 모달
│   ├── basic_modal2.js       # 일별실적 모달
│   └── basic_modal3.js       # 예치보험료 모달
├── dashboard.html            # 대시보드 메인 페이지
└── login.html                # 로그인 페이지
```

### 9.3 주요 기능

1. **로그인 시스템**: 아이디/비밀번호 기반 로그인, API 키/시크릿 발급
2. **대시보드**: 시스템 정보, 보험 상품 정보, 재고자산 신청 페이지 링크
3. **신청자 리스트**: 신청자 목록 조회, 상태별 필터링, 검색 기능
4. **상세 정보 모달**: 신청자 번호 클릭 시 상세 정보 표시
5. **일별 실적**: 일별 신청 현황 조회
6. **예치보험료 관리**: 예치금 잔액 조회, 사용 내역 확인

---

## 10. 신청 시스템

### 10.1 시스템 개요

약사 또는 거래처 영업사원이 약국배상책임보험을 온라인으로 신청할 수 있는 시스템입니다. 반응형 웹 기반으로 모바일, 태블릿, 데스크탑에서 모두 사용 가능합니다.

**위치**: `imet/drugstore/`

### 10.2 디렉토리 구조

```
imet/drugstore/
├── api/
│   ├── config/
│   │   └── db.php              # DB 연결 설정
│   ├── includes/
│   │   └── validation.php     # 유효성 검증 함수
│   ├── calculate.php           # 보험료 계산 API
│   ├── submit.php              # 가입신청 처리 API (팜페이스마트)
│   └── ubcareSubmit.php       # 가입신청 처리 API (유비케어)
├── common/
│   ├── css/                    # 공통 스타일
│   └── js/                     # 공통 JavaScript
├── pharmacy/                   # 팜페이스마트 신청 페이지
│   ├── index.html              # 재고자산 5천만원
│   ├── index2.html             # 재고자산 1억원
│   └── ...
└── ubcare/                     # 유비케어 신청 페이지
    ├── index.html
    └── ...
```

### 10.3 주요 기능

1. **보험 상품 선택**: 전문인배상책임보험, 화재종합보험 선택/해제
2. **실시간 보험료 계산**: 입력 정보에 따라 즉시 보험료 계산
3. **가입신청 처리**: 신청 정보 유효성 검증, DB 저장, 이메일 발송
4. **유효성 검증**: 사업자등록번호, 주민등록번호, 전화번호, 이메일 형식 검증
5. **개인정보 동의**: 개인정보 수집 및 이용동의, 고유식별정보 처리 동의

### 10.4 회사별 구분

**pharmacy_idList 테이블**:
- `directory`: 폴더명 (pharmacy, ubcare 등)
- `ch`: 기본 상태 설정
  - `'10'`: 메일보냄 (기본)
  - `'13'`: 자동 승인

---

## 11. 갱신 프로세스

### 11.1 갱신 프로세스 개요

약국배상책임보험 계약 만료 전 갱신을 통해 계약을 연장하고, 기존 계약 정보를 기반으로 신규 계약을 생성합니다.

### 11.2 갱신 대상

- **상태**: 증권발급(14), 계약완료(6) 상태의 계약
- **만료 예정일**: 보험 종기(`jeonggi`) 기준 **45일 전** 조회
- **자동 처리**: 갱신 대상 조회 시 자동으로 갱신 청약 생성 (INSERT)

### 11.3 갱신 프로세스 단계

1. **갱신 대상 조회**: 만료 예정 계약 목록 조회 (45일 전)
   - 조회하는 순간 자동으로 갱신 청약 INSERT (신규 신청과 동일한 구조)
2. **갱신 계약 승인**: 업체가 승인하면 신규와 동일한 프로세스로 진행
   - 보험료 계산 및 승인
   - 예치금 차감
   - 정산 기록 생성
   - 증권 발급
3. **기존 계약 연결**: 기존 계약과 갱신 계약 연결 정보 저장

### 11.4 데이터베이스 설계

**pharmacyApply 테이블 추가 필드**:
```sql
ALTER TABLE pharmacyApply 
ADD COLUMN renewal CHAR(1) DEFAULT '0' COMMENT '갱신 상태: 0=미갱신, 2=갱신청약생성완료',
ADD COLUMN previousCertiNum INT(11) DEFAULT NULL COMMENT '갱신 전 계약 번호',
ADD COLUMN nextRenewalNum INT(11) DEFAULT NULL COMMENT '갱신 후 계약 번호';
```

### 11.5 API 엔드포인트

**갱신 대상 조회 및 자동 청약 생성**:
```
GET /api/pharmacy/renewal/list
```

**갱신 계약 승인**: 기존 `POST /api/pharmacy/status-update` 사용

---

## 12. PHP 파일 작성 규칙

### 12.1 파일 헤더 규칙

PHP 파일을 수정하거나 생성할 때는 **파일 상단에 다음 정보를 반드시 포함**해야 합니다:

```php
<?php
/**
 * 파일 경로: imet/api/pharmacy/파일명.php
 * 파일명: 파일명.php
 * 
 * [파일 설명]
 * [주요 기능]
 * [API 엔드포인트 정보]
 */
```

### 12.2 작성 예시

```php
<?php
/**
 * 파일 경로: imet/api/pharmacy/pharmacy-memo-update.php
 * 파일명: pharmacy-memo-update.php
 * 
 * 메모 업데이트 API
 * POST: pharmacy_id, memo
 * - 메모만 부분 업데이트 (상태 ch 변경 없음)
 * - 필요 시 ch 변경은 optional 파라미터로 지원(ch_optional)
 */

// 직접 접근 허용 플래그
define('API_ACCESS', true);
```

### 12.3 규칙 요약

1. **파일 경로 표기**: `imet/api/pharmacy/파일명.php`
2. **파일명 표기**: `파일명.php` (확장자 포함)
3. **파일 설명**: 파일의 주요 기능 설명, API 엔드포인트 정보, 주요 파라미터 설명

---

## 13. 보험료 검증

### 13.1 문제 상황

리스트 화면에 표시되는 보험료와 약국 상세 화면에서 확인되는 보험료가 서로 상이함

### 13.2 검증 방법

#### UI에서 검증 버튼 사용

**리스트 화면**:
1. 약국 목록 테이블의 **보험료 컬럼** 옆에 있는 **검증 아이콘** 클릭
2. 검증 결과 확인

**상세 화면**:
1. 약국 상세 모달에서 **보험료(기본)** 라벨 옆의 **검증 아이콘** 클릭
2. 검증 결과 확인
3. 불일치 시 상세 정보 표시

#### API 직접 호출

**특정 약국 검증**:
```bash
GET /api/pharmacy/premium-verify?pharmacy_id=123
```

**전체 약국 검증**:
```bash
GET /api/pharmacy/premium-verify?all=1
```

### 13.3 검증 결과 해석

- **일치하는 경우** (`is_match: true`): DB에 저장된 보험료와 계산된 보험료가 일치
- **불일치하는 경우** (`is_match: false`): DB에 저장된 보험료와 계산된 보험료가 다름

**가능한 원인**:
1. 보험료 계산 로직 변경 후 DB 업데이트 안 됨
2. 면적 수정 후 보험료 재계산 안 됨
3. 상태 변경 시 보험료 재계산 로직 문제
4. 80㎡ 미만 처리 문제

---

## 14. 메모 기능

### 14.1 기능 개요

약국 상세 모달에서 메모를 입력하고 저장할 수 있는 기능입니다.

### 14.2 메모 저장

**프론트엔드** (`pharmacy.js`):
```javascript
function setupEnterToSubmit(pharmacyId) {
  const bind = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('keydown', (e) => {
      if (e.isComposing) return; // 한글 조합 중이면 무시
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        const memoValue = el.value.trim();

        fetch(`/api/pharmacy2/${pharmacyId}/memo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ memo: memoValue })
        })
        .then(res => res.json())
        .then(resp => {
          if (resp.success) {
            window.sjTemplateLoader.showToast("메모가 저장되었습니다.", "success");
          } else {
            window.sjTemplateLoader.showToast(resp.error || "메모 저장 실패", "error");
          }
        })
        .catch(err => {
          console.error("메모 저장 오류:", err);
          window.sjTemplateLoader.showToast("서버 통신 오류", "error");
        });
      }
    });
  };

  bind('memo');
  bind('memo_mobile');
}
```

**PHP 백엔드** (`pharmacy-memo-update.php`):
```php
$stmt = mysqli_prepare($connection, "UPDATE pharmacyApply SET memo = ? WHERE num = ?");
mysqli_stmt_bind_param($stmt, "si", $memo, $pharmacyId);
mysqli_stmt_execute($stmt);
```

### 14.3 메모 조회

모달 열 때 `/api/pharmacy/id-detail/${pharmacyId}` 호출하여 메모 데이터 조회

---

## 15. 부록

### 15.1 기술 스택

**프론트엔드**:
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3.0
- Font Awesome 6.4.0
- Noto Sans KR (Google Fonts)
- sj-template-loader.js (템플릿 시스템)

**백엔드**:
- Node.js/Express
- Axios (HTTP 클라이언트)
- Multer (파일 업로드)

**PHP 백엔드**:
- PHP 7.x+
- PDO (Prepared Statements)
- JSON 응답 (UTF-8)
- 트랜잭션 지원

**데이터베이스**:
- MySQL/MariaDB

### 15.2 보안

**인증/권한**:
- 세션 기반 인증
- 관리자 권한 체크 (requireAuth, requireAdmin 미들웨어)
- API 키 기반 인증 (외부 API 연동용)

**데이터 보안**:
- SQL 인젝션 방지 (PDO Prepared Statements)
- 파일 업로드 검증 (파일 타입, 크기 제한)
- 입력값 검증

**로깅**:
- 모든 API 요청 로깅
- 에러 추적 및 디버깅 지원

### 15.3 상태 코드

| 코드 | 설명 |
|------|------|
| 1 | 접수 |
| 6 | 계약완료 |
| 7 | 보류 |
| 10 | 메일보냄 |
| 13 | 승인 |
| 14 | 증권발급 |
| 15 | 해지요청 |
| 16 | 해지완료 |
| 17 | 설계중 |

### 15.4 파일 생성 체크리스트

**새 PHP API 추가 시**:
- [ ] 로컬 경로에 PHP 파일 생성: `d:\development\imet\api\pharmacy\파일명.php`
- [ ] 파일명 규칙 준수: `pharmacy-` 또는 `pharmacyApply-` 접두사
- [ ] 파일 헤더 작성 규칙 준수
- [ ] Node.js 프록시 라우터에 엔드포인트 추가
- [ ] 프로덕션 서버에 배포: `imet.kr/api/pharmacy/파일명.php`

**새 Node.js 프록시 엔드포인트 추가 시**:
- [ ] 적절한 라우터 파일 선택 (`pharmacy.js` 또는 하위 라우터)
- [ ] 프로덕션 PHP URL 사용: `https://imet.kr/api/pharmacy/파일명.php`
- [ ] 에러 처리 구현
- [ ] `server.js`에 라우터 등록 확인

**새 프론트엔드 페이지 추가 시**:
- [ ] HTML 파일 생성: `d:\development\disk-cms\public\pages\pharmacy\파일명.html`
- [ ] JavaScript 파일 생성: `d:\development\disk-cms\public\js\pharmacy\파일명.js`
- [ ] 템플릿 시스템 사용: `sj-template-loader.js` 초기화
- [ ] 사이드바에 메뉴 추가: `public/components/sj-sidebar.html`
- [ ] HTML에 JavaScript 파일 링크 추가

### 15.5 문제 해결

**메모 저장 문제**:
- Prepared Statement 사용
- 에러 로깅 강화
- 프론트엔드 에러 처리 강화

**보험료 불일치 문제**:
- 보험료 검증 기능 사용
- account 값에 따른 테이블 선택 확인 (일반 vs 유비케어)
- 80㎡ 미만 처리 확인

**페이지 상태 유지 문제**:
- localStorage 사용하여 페이지 상태 저장
- 새로고침 시 상태 복원

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

