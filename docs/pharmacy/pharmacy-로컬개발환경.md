# 약국배상책임보험 파일 생성 가이드

**작성일**: 2025-01-XX

---

## 📋 목차

1. [파일 경로 매핑](#파일-경로-매핑)
2. [폴더 구조](#폴더-구조)
3. [PHP 파일 작성 위치](#php-파일-작성-위치)
4. [Node.js 프록시 작성 위치](#nodejs-프록시-작성-위치)
5. [프론트엔드 파일 작성 위치](#프론트엔드-파일-작성-위치)

---

## 폴더 구조

### 프로젝트 루트 구조

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
            ├── pharmacyApply-num-detail.php
            └── ... (40개 이상의 PHP 파일)
```

---

## 파일 경로 매핑

### 프로덕션 vs 로컬 개발

| 구분 | 프로덕션 URL | 로컬 개발 경로 |
|------|------------|--------------|
| **PHP API** | `https://imet.kr/api/pharmacy/*` | `d:\development\imet\api\pharmacy\*` |
| **프론트엔드** | `https://disk-cms.simg.kr/pages/pharmacy/*` | `d:\development\disk-cms\public\pages\pharmacy\*` |
| **Node.js 프록시** | `https://disk-cms.simg.kr/api/pharmacy/*` | `http://localhost:3000/api/pharmacy/*` |

### 경로 매핑 규칙

**중요**: 
- **프로덕션 URL** `imet.kr` = **로컬 폴더** `imet`
- **프로덕션 URL** `silbo.kr` = **로컬 폴더** `silbo` (추정)

**예시**:
```
프로덕션: https://imet.kr/api/pharmacy/pharmacy-list.php
로컬:     d:\development\imet\api\pharmacy\pharmacy-list.php

프로덕션: https://imet.kr/api/pharmacy/pharmacy-accounts.php
로컬:     d:\development\imet\api\pharmacy\pharmacy-accounts.php
```

---

## 파일 생성 규칙

### 1. PHP 파일 생성 위치

**로컬 개발 경로**:
```
d:\development\imet\api\pharmacy\파일명.php
```

**프로덕션 배포 경로** (배포 시):
```
https://imet.kr/api/pharmacy/파일명.php
```

**중요**: 
- 로컬에서 PHP 파일을 작성할 때는 `imet/api/pharmacy/` 폴더에 생성
- 프로덕션 배포 시 `imet.kr/api/pharmacy/` 경로로 업로드

---

### 2. Node.js 프록시 파일 생성 위치

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

**중요**: 
- Node.js 프록시는 항상 프로덕션 URL(`https://imet.kr/api/pharmacy/*`)을 호출
- 로컬 개발 URL을 사용하지 않음

---

### 3. 프론트엔드 파일 생성 위치

**HTML 페이지**:
```
d:\development\disk-cms\public\pages\pharmacy\파일명.html
```

**JavaScript 파일**:
```
d:\development\disk-cms\public\js\pharmacy\파일명.js
```

**CSS 파일** (필요 시):
```
d:\development\disk-cms\public\css\pharmacy\파일명.css
```

---

## PHP 파일 작성 위치

### 새 PHP API 파일 생성 시

**1. 로컬 개발 경로에 파일 생성**:
```
d:\development\imet\api\pharmacy\pharmacy-new-api.php
```

**파일명 규칙**:
- `pharmacy-` 접두사 사용 (예: `pharmacy-new-api.php`)
- `pharmacyApply-` 접두사 사용 (예: `pharmacyApply-num-detail.php`)
- kebab-case 사용 (하이픈으로 단어 구분)

**2. Node.js 프록시 라우터에 추가**:
```javascript
// routes/pharmacy.js 또는 routes/pharmacy/하위파일.js
router.get('/new-api', async (req, res) => {
    try {
        const apiUrl = 'https://imet.kr/api/pharmacy/pharmacy-new-api.php';
        const response = await axios.get(apiUrl, { params: req.query });
        res.json(response.data);
    } catch (error) {
        console.error('API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
```

**3. 프로덕션 서버에 배포**:
- FTP 또는 SSH를 통해 `imet.kr/api/pharmacy/` 경로로 업로드
- 파일명과 경로 구조 유지

---

### 주요 PHP API 파일 위치

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
pharmacy-api-keys-generate.php       # API 키 생성
pharmacy-api-keys-detail.php         # API 키 상세
pharmacy-api-keys-toggle.php         # API 키 활성화/비활성화
pharmacy-api-keys-regenerate.php    # API 키 재생성
pharmacy-api-logs.php                # API 사용 로그
pharmacy-deposit-add.php             # 예치금 입금
pharmacy-deposit-usage.php           # 사용 내역
pharmacy-deposit-summary.php         # 전체 예치금 현황
pharmacy-monthly-report.php          # 월별 실적 조회
pharmacy-cancellation-calculate.php  # 해지 보험료 계산
pharmacy-cancellation-confirm.php    # 해지 확인
pharmacy-design-list-excel.php       # 설계리스트 엑셀
pharmacy-premium-calculate.php      # 보험료 계산
pharmacy-certificate-update.php     # 증권번호 업데이트
pharmacy-design-update.php          # 설계번호 업데이트
pharmacy-status-update.php          # 상태 업데이트
pharmacy-memo-update.php            # 메모 업데이트
... (총 40개 이상의 PHP 파일)
```

**프로덕션 배포 경로** (`https://imet.kr/api/pharmacy/`):
- 로컬 파일과 동일한 파일명과 경로 구조로 업로드

---

## Node.js 프록시 작성 위치

### 메인 라우터 (`routes/pharmacy.js`)

**파일 위치**: `d:\development\disk-cms\routes\pharmacy.js`

**주요 엔드포인트**:
- `GET /api/pharmacy/list` - 약국 목록 조회
- `GET /api/pharmacy/accounts` - 거래처 목록 조회
- `GET /api/pharmacy/id-detail/:num` - 약국 상세 정보
- `PUT /api/pharmacy/id-update/:num` - 약국 정보 수정
- `POST /api/pharmacy/id-create` - 약국 신규 등록
- `DELETE /api/pharmacy/id-delete/:num` - 약국 삭제
- `GET /api/pharmacy/id-check` - 아이디 중복 확인
- 파일 업로드/다운로드 관련 엔드포인트

---

### 하위 라우터 (`routes/pharmacy/`)

**폴더 위치**: `d:\development\disk-cms\routes\pharmacy\`

**파일별 역할**:

**1. `admin.js`** - 관리자 기능
- `GET /api/pharmacy-admin/api-keys` - API 키 목록
- `POST /api/pharmacy-admin/api-keys/generate` - API 키 생성
- `GET /api/pharmacy-admin/api-keys/:id` - API 키 상세
- `DELETE /api/pharmacy-admin/api-keys/:id` - API 키 삭제
- `PUT /api/pharmacy-admin/api-keys/:id/toggle` - 활성화/비활성화
- `POST /api/pharmacy-admin/api-keys/:id/regenerate` - 재생성
- `GET /api/pharmacy-admin/api-logs/:id` - 사용 로그
- `GET /api/pharmacy-admin/api-stats` - 통계

**2. `deposits.js`** - 예치금 관리
- `GET /api/pharmacy-deposits/balance/:accountNum` - 예치 잔액
- `GET /api/pharmacy-deposits/list/:accountNum` - 예치금 리스트
- `POST /api/pharmacy-deposits/deposit` - 예치금 입금
- `GET /api/pharmacy-deposits/usage/:accountNum` - 사용 내역
- `GET /api/pharmacy-deposits/summary` - 전체 현황
- `PUT /api/pharmacy-deposits/deposit/:depositId` - 수정
- `DELETE /api/pharmacy-deposits/deposit/:depositId` - 삭제

**3. `reports.js`** - 실적 관리
- `GET /api/pharmacy-reports/daily` - 일별 실적
- `GET /api/pharmacy-reports/monthly` - 월별 실적
- `GET /api/pharmacy-reports/statistics` - 통계

**4. `pharmacy2.js`** - 업체 관리
- `GET /api/pharmacy2/customers` - 업체 리스트
- `POST /api/pharmacy2/customers` - 새 업체 추가
- `PUT /api/pharmacy2/customers/:num` - 업체 정보 수정
- `GET /api/pharmacy2/customers/:num` - 특정 업체 조회
- `GET /api/pharmacy2/check-id` - 아이디 중복확인
- 증권번호, 보험료 계산, 상태 업데이트 등

---

## 프론트엔드 파일 작성 위치

### HTML 페이지

**폴더 위치**: `d:\development\disk-cms\public\pages\pharmacy\`

**현재 파일**:
- `applications.html` - 약국 목록 페이지

**새 페이지 생성 시**:
```
d:\development\disk-cms\public\pages\pharmacy\새페이지명.html
```

---

### JavaScript 파일

**폴더 위치**: `d:\development\disk-cms\public\js\pharmacy\`

**현재 파일들**:
- `pharmacy.js` - 메인 약국 관리
- `pharmacy_company_modal.js` - 약국 상세 모달
- `pharmacy_2.js` - 해지 관련
- `pharmacy_key.js` - API 키 관리
- `pharmacy_deposit.js` - 예치금 관리
- `pharmacy_daily_report.js` - 일별 실적
- `pharmacy_17.js` - 설계중 리스트
- `pharmacy_num.js` - 번호 관리
- `pharmacyModal.js` - 모달 공통

**새 JavaScript 파일 생성 시**:
```
d:\development\disk-cms\public\js\pharmacy\새파일명.js
```

**파일명 규칙**:
- `pharmacy_` 접두사 사용 (예: `pharmacy_new_feature.js`)
- 언더스코어로 단어 구분
- 기능별로 파일 분리

---

### CSS 파일 (필요 시)

**폴더 위치**: `d:\development\disk-cms\public\css\pharmacy\`

**참고**: 대부분의 스타일은 공통 CSS(`/css/sj-styles.css`) 사용
- 페이지별 특수 스타일이 필요한 경우에만 생성

**새 CSS 파일 생성 시**:
```
d:\development\disk-cms\public\css\pharmacy\새파일명.css
```

---

## 파일 생성 체크리스트

### 새 PHP API 추가 시

- [ ] 로컬 경로에 PHP 파일 생성: `d:\development\imet\api\pharmacy\파일명.php`
- [ ] 파일명 규칙 준수: `pharmacy-` 또는 `pharmacyApply-` 접두사
- [ ] Node.js 프록시 라우터에 엔드포인트 추가
- [ ] 프로덕션 서버에 배포: `imet.kr/api/pharmacy/파일명.php`

---

### 새 Node.js 프록시 엔드포인트 추가 시

- [ ] 적절한 라우터 파일 선택 (`pharmacy.js` 또는 하위 라우터)
- [ ] 프로덕션 PHP URL 사용: `https://imet.kr/api/pharmacy/파일명.php`
- [ ] 에러 처리 구현
- [ ] `server.js`에 라우터 등록 확인 (이미 등록되어 있으면 생략)

---

### 새 프론트엔드 페이지 추가 시

- [ ] HTML 파일 생성: `d:\development\disk-cms\public\pages\pharmacy\파일명.html`
- [ ] JavaScript 파일 생성: `d:\development\disk-cms\public\js\pharmacy\파일명.js`
- [ ] 템플릿 시스템 사용: `sj-template-loader.js` 초기화
- [ ] 사이드바에 메뉴 추가: `public/components/sj-sidebar.html`
- [ ] HTML에 JavaScript 파일 링크 추가

---

## 빠른 참조

### 경로 매핑 요약

| 항목 | 프로덕션 URL | 로컬 개발 경로 |
|------|------------|--------------|
| **PHP API** | `https://imet.kr/api/pharmacy/*` | `d:\development\imet\api\pharmacy\*` |
| **프론트엔드 HTML** | `https://disk-cms.simg.kr/pages/pharmacy/*` | `d:\development\disk-cms\public\pages\pharmacy\*` |
| **프론트엔드 JS** | `https://disk-cms.simg.kr/js/pharmacy/*` | `d:\development\disk-cms\public\js\pharmacy\*` |
| **Node.js 프록시** | `https://disk-cms.simg.kr/api/pharmacy/*` | `d:\development\disk-cms\routes\pharmacy.js` |

### 파일 생성 위치 요약

**PHP 파일**:
```
로컬:  d:\development\imet\api\pharmacy\파일명.php
배포:  imet.kr/api/pharmacy/파일명.php
```

**Node.js 프록시**:
```
메인:  d:\development\disk-cms\routes\pharmacy.js
하위:  d:\development\disk-cms\routes\pharmacy\파일명.js
```

**프론트엔드**:
```
HTML:  d:\development\disk-cms\public\pages\pharmacy\파일명.html
JS:    d:\development\disk-cms\public\js\pharmacy\파일명.js
CSS:   d:\development\disk-cms\public\css\pharmacy\파일명.css (필요 시)
```

---

## 중요 사항

### ⚠️ 파일 생성 규칙

1. **PHP 파일은 항상 `imet/api/pharmacy/` 폴더에 생성**
   - 프로덕션 배포 시 `imet.kr/api/pharmacy/` 경로로 업로드

2. **Node.js 프록시는 항상 프로덕션 URL 호출**
   - 로컬 개발 URL을 사용하지 않음
   - `https://imet.kr/api/pharmacy/*` 형식 사용

3. **파일명 규칙 준수**
   - PHP: `pharmacy-` 또는 `pharmacyApply-` 접두사
   - JavaScript: `pharmacy_` 접두사, 언더스코어 구분
   - HTML: kebab-case 사용

4. **폴더 구조 유지**
   - 기존 폴더 구조를 따라 파일 생성
   - 새로운 폴더 생성 시 문서에 반영

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

