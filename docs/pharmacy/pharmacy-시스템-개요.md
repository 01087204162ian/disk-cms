# 약국배상책임보험 시스템 개요

**작성일**: 2025-01-XX  
**시스템**: CMS 기반 약국배상책임보험 관리 시스템

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [아키텍처](#아키텍처)
3. [프론트엔드 구조](#프론트엔드-구조)
4. [백엔드 API 구조](#백엔드-api-구조)
5. [주요 기능](#주요-기능)
6. [파일 구조](#파일-구조)

---

## 시스템 개요

### 아키텍처
- **프론트엔드**: HTML + JavaScript (Vanilla JS) + Bootstrap 5
- **중간 계층**: Node.js/Express 프록시 라우터
- **백엔드**: PHP 7.x+ (PDO, JSON 응답)
- **데이터베이스**: MySQL/MariaDB

### 주요 특징
- RESTful API 기반 JSON 통신
- UTF-8 인코딩
- CORS 지원
- 트랜잭션 기반 데이터 처리
- 로깅 시스템

---

## 아키텍처

### 통신 흐름
```
프론트엔드 (HTML/JS)
    ↓
Node.js 프록시 서버 (Express)
    ↓
PHP 백엔드 API (imet.kr 또는 silbo.kr)
    ↓
MySQL 데이터베이스
```

### 서버 정보
- **프론트엔드**: `https://disk-cms.simg.kr/pages/pharmacy/`
- **Node.js 프록시**: `/api/pharmacy/*` (routes/pharmacy.js)
- **PHP 백엔드**: `https://imet.kr/api/pharmacy/*` 또는 `https://silbo.kr/api/pharmacy/*`
- **데이터베이스**: MySQL

---

## 프론트엔드 구조

### 페이지 목록

| 페이지 | 파일명 | 주요 기능 |
|--------|--------|-----------|
| **약국 목록** | `applications.html` | 약국 목록 조회, 필터링, 상세 모달 |

### JavaScript 파일 (9개)

| 파일명 | 연결 페이지 | 주요 기능 |
|--------|------------|-----------|
| `pharmacy.js` | applications.html | 약국 목록 조회, 필터링, 페이징 |
| `pharmacy_company_modal.js` | 공통 | 약국 상세 정보 모달 |
| `pharmacy_2.js` | 공통 | 해지 관련 기능 |
| `pharmacy_key.js` | 공통 | API 키 관리 |
| `pharmacy_deposit.js` | 공통 | 예치 잔액 관리 |
| `pharmacy_daily_report.js` | 공통 | 일별 실적 조회 |
| `pharmacy_17.js` | 공통 | 설계중 리스트 |
| `pharmacy_num.js` | 공통 | 번호 관리 |
| `pharmacyModal.js` | 공통 | 모달 공통 기능 |

### 템플릿 시스템
- **템플릿 로더**: `/js/sj-template-loader.js`
- **초기화**: `window.sjTemplateLoader.initializePage('pharmacy-applications')`
- **컴포넌트**: 헤더, 사이드바, 푸터 자동 로드

---

## 백엔드 API 구조

### Node.js 프록시 라우터

#### 메인 라우터 (`routes/pharmacy.js`)
- `GET /api/pharmacy/list` - 약국 목록 조회
- `GET /api/pharmacy/accounts` - 거래처 목록 조회
- `GET /api/pharmacy/id-list` - 업체 리스트 조회
- `GET /api/pharmacy/id-detail/:num` - 업체 상세 정보
- `PUT /api/pharmacy/id-update/:num` - 업체 정보 수정
- `POST /api/pharmacy/id-create` - 업체 신규 등록
- `DELETE /api/pharmacy/id-delete/:num` - 업체 삭제
- `GET /api/pharmacy/id-check` - 아이디 중복 확인
- `POST /api/pharmacy/upload-files` - 파일 업로드
- `GET /api/pharmacy/files/:num` - 파일 목록 조회
- `GET /api/pharmacy/download/:filename` - 파일 다운로드
- `DELETE /api/pharmacy/files/:filename` - 파일 삭제

#### 하위 라우터

**1. `routes/pharmacy/admin.js` - 관리자 기능**
- `GET /api/pharmacy-admin/api-keys` - API 키 목록 조회
- `POST /api/pharmacy-admin/api-keys/generate` - API 키 생성
- `GET /api/pharmacy-admin/api-keys/:id` - API 키 상세 조회
- `DELETE /api/pharmacy-admin/api-keys/:id` - API 키 삭제
- `PUT /api/pharmacy-admin/api-keys/:id/toggle` - API 키 활성화/비활성화
- `POST /api/pharmacy-admin/api-keys/:id/regenerate` - API 키 재생성
- `GET /api/pharmacy-admin/api-logs/:id` - API 사용 로그 조회
- `GET /api/pharmacy-admin/api-stats` - API 통계 조회

**2. `routes/pharmacy/deposits.js` - 예치금 관리**
- `GET /api/pharmacy-deposits/balance/:accountNum` - 예치 잔액 조회
- `GET /api/pharmacy-deposits/list/:accountNum` - 예치금 리스트 조회
- `POST /api/pharmacy-deposits/deposit` - 예치금 입금
- `GET /api/pharmacy-deposits/usage/:accountNum` - 사용 내역 조회
- `GET /api/pharmacy-deposits/summary` - 전체 예치금 현황
- `PUT /api/pharmacy-deposits/deposit/:depositId` - 예치금 수정
- `DELETE /api/pharmacy-deposits/deposit/:depositId` - 예치금 삭제

**3. `routes/pharmacy/reports.js` - 실적 관리**
- `GET /api/pharmacy-reports/daily` - 일별 실적 조회
- `GET /api/pharmacy-reports/monthly` - 월별 실적 조회
- `GET /api/pharmacy-reports/statistics` - 통계 조회

**4. `routes/pharmacy/pharmacy2.js` - 업체 관리**
- `GET /api/pharmacy2/customers` - 업체 리스트 조회
- `POST /api/pharmacy2/customers` - 새 업체 추가
- `PUT /api/pharmacy2/customers/:num` - 업체 정보 수정
- `GET /api/pharmacy2/customers/:num` - 특정 업체 조회
- `GET /api/pharmacy2/check-id` - 아이디 중복확인
- `POST /api/pharmacy2/certificate-number` - 증권번호 발행
- `GET /api/pharmacy2/certificate-number/:pharmacyId` - 증권번호 조회
- `POST /api/pharmacy2/calculate-premium` - 보험료 계산
- `POST /api/pharmacy2/update-status` - 상태 업데이트
- `POST /api/pharmacy2/design-number` - 설계번호 업데이트
- `GET /api/pharmacy2/design-number/:pharmacyId` - 설계번호 조회
- `POST /api/pharmacy2/:pharmacyId/memo` - 메모 업데이트
- `POST /api/pharmacy2/calculate-cancellation` - 해지 보험료 계산
- `POST /api/pharmacy2/confirm-cancellation` - 해지 확인
- `GET /api/pharmacy2/cancellation-status/:pharmacyId` - 해지 상태 조회
- `POST /api/pharmacy2/design-list-excel` - 설계리스트 엑셀 다운로드

### PHP 백엔드 API (imet.kr)

주요 PHP API 파일들:
- `pharmacy-list.php` - 약국 목록 조회
- `pharmacy-accounts.php` - 거래처 목록 조회
- `pharmacy-id-list.php` - 업체 리스트 조회
- `pharmacyApply-num-detail.php` - 약국 상세 정보
- `pharmacyApply-num-update.php` - 약국 정보 수정
- `pharmacy-id-check.php` - 아이디 중복 확인
- `pharmacy-api-keys-list.php` - API 키 목록
- `pharmacy-deposit-balance.php` - 예치 잔액 조회
- `pharmacy-deposit-list.php` - 예치금 리스트
- `pharmacy-daily-report.php` - 일별 실적 조회

---

## 주요 기능

### 1. 약국 목록 관리

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

### 2. 예치금 관리

**기능**:
- 예치 잔액 조회
- 예치금 입금 내역 조회
- 예치금 입금 처리
- 사용 내역 조회
- 전체 예치금 현황 조회

### 3. 실적 관리

**기능**:
- 일별 실적 조회
- 월별 실적 조회
- 통계 조회

### 4. API 키 관리

**기능**:
- API 키 목록 조회
- API 키 생성
- API 키 활성화/비활성화
- API 키 재생성
- API 사용 로그 조회
- API 통계 조회

### 5. 파일 관리

**기능**:
- 파일 업로드 (증권 파일, 영수증 파일)
- 파일 목록 조회
- 파일 다운로드
- 파일 삭제

---

## 파일 구조

```
disk-cms/
├── public/
│   ├── pages/
│   │   └── pharmacy/
│   │       └── applications.html          # 약국 목록 페이지
│   └── js/
│       └── pharmacy/
│           ├── pharmacy.js                # 메인 약국 관리
│           ├── pharmacy_company_modal.js  # 약국 상세 모달
│           ├── pharmacy_2.js             # 해지 관련
│           ├── pharmacy_key.js            # API 키 관리
│           ├── pharmacy_deposit.js        # 예치금 관리
│           ├── pharmacy_daily_report.js   # 일별 실적
│           ├── pharmacy_17.js             # 설계중 리스트
│           ├── pharmacy_num.js            # 번호 관리
│           └── pharmacyModal.js           # 모달 공통
│
└── routes/
    ├── pharmacy.js                        # 메인 프록시 라우터
    └── pharmacy/
        ├── admin.js                       # 관리자 기능
        ├── deposits.js                    # 예치금 관리
        ├── reports.js                     # 실적 관리
        └── pharmacy2.js                   # 업체 관리
```

---

## 기술 스택

### 프론트엔드
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3.0
- Font Awesome 6.4.0
- Noto Sans KR (Google Fonts)
- sj-template-loader.js (템플릿 시스템)

### 백엔드
- Node.js/Express
- Axios (HTTP 클라이언트)
- Multer (파일 업로드)

### PHP 백엔드
- PHP 7.x+
- PDO (Prepared Statements)
- JSON 응답 (UTF-8)
- 트랜잭션 지원

### 데이터베이스
- MySQL/MariaDB

---

## 보안

### 인증/권한
- 세션 기반 인증
- 관리자 권한 체크 (requireAuth, requireAdmin 미들웨어)
- API 키 기반 인증 (외부 API 연동용)

### 데이터 보안
- SQL 인젝션 방지 (PDO Prepared Statements)
- 파일 업로드 검증 (파일 타입, 크기 제한)
- 입력값 검증

### 로깅
- 모든 API 요청 로깅
- 에러 추적 및 디버깅 지원

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

