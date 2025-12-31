# 근재보험 상담신청 API - cafe24 서버 배포 가이드

## cafe24 서버 구조

FTP에서 확인된 디렉토리 구조:
```
/
├── geungae0327/
│   └── www/
│       └── geunjae.kr/     (실제 geunjae.kr 도메인 디렉토리)
│           └── api/
│               └── consultations/
│                   └── list.php  ← 실제 파일 위치
├── www/                    (메인 웹사이트)
├── e2linsure.kr/
└── geunjae.kr/             (다른 geunjae.kr 디렉토리 또는 심볼릭 링크)
```

**실제 파일 위치**: `/geungae0327/www/geunjae.kr/api/consultations/list.php`

## PHP 파일 배치 위치

### 실제 파일 위치 확인됨 ✅

**FTP 경로**:
```
/geungae0327/www/geunjae.kr/api/consultations/list.php
```

**웹 URL** (도메인 설정에 따라):
```
https://geunjae.kr/api/consultations/list.php
```

**설명**:
- cafe24에서 `geunjae.kr` 도메인이 `/geungae0327/www/geunjae.kr/` 디렉토리를 가리킴
- 따라서 `https://geunjae.kr/api/consultations/list.php`로 접근하면
- 실제로는 `/geungae0327/www/geunjae.kr/api/consultations/list.php` 파일이 실행됨

**현재 코드 설정** (올바르게 설정됨):
```javascript
// routes/workers-comp/consultations.js
const API_BASE_URL = process.env.CONSULTATION_API_URL || 'https://geunjae.kr/api';
```

### 옵션 2: www 디렉토리 사용

만약 `geunjae.kr` 도메인이 `www` 디렉토리를 가리킨다면:

**FTP 경로**:
```
/www/api/consultations/list.php
```

**웹 URL**:
```
https://geunjae.kr/api/consultations/list.php
```
(도메인 설정에 따라 www가 geunjae.kr을 가리키는 경우)

## 확인 방법

### 1. FTP에서 디렉토리 확인

**중요**: cafe24 서버 구조상 `geungae0327` 디렉토리가 실제 근재보험 관련 파일이 있을 가능성이 높습니다.

1. **geungae0327 디렉토리 확인** (우선 확인):
   - `/geungae0327/` 폴더 안에 `api` 폴더가 있는지 확인
   - `api` 폴더 안에 `consultations` 폴더가 있는지 확인
   - 또는 `/geungae0327/api/consultations/list.php` 파일이 있는지 확인

2. **geunjae.kr 디렉토리 확인**:
   - `/geunjae.kr/` 폴더 안에 `api` 폴더가 있는지 확인
   - `api` 폴더 안에 `consultations` 폴더가 있는지 확인

3. **www 디렉토리 확인**:
   - `/www/` 폴더 안에 `api` 폴더가 있는지 확인
   - `api` 폴더 안에 `consultations` 폴더가 있는지 확인

### 2. 브라우저에서 직접 접속 테스트

다음 URL들을 브라우저에서 직접 접속해 확인 (순서대로 테스트):

**옵션 1: geungae0327 디렉토리** (가장 가능성 높음)
```
https://geunjae.kr/geungae0327/api/consultations/list.php?page=1&limit=20
```

**옵션 2: geunjae.kr 디렉토리**
```
https://geunjae.kr/api/consultations/list.php?page=1&limit=20
```

**옵션 3: www 디렉토리**
```
https://geunjae.kr/www/api/consultations/list.php?page=1&limit=20
```

**예상 응답**:
- 파일이 있으면: JSON 데이터 또는 PHP 오류 메시지
- 파일이 없으면: 404 Not Found

### 3. 도메인 설정 확인

cafe24 관리자 페이지에서:
1. **도메인 관리** → **geunjae.kr** 확인
2. 어떤 디렉토리를 가리키는지 확인
   - `/geunjae.kr/` 디렉토리를 가리키는지
   - `/www/` 디렉토리를 가리키는지

## PHP 파일 배치 방법

### 1단계: 실제 파일 위치 확인 ✅

**확인된 실제 파일 위치**:
```
/geungae0327/www/geunjae.kr/api/consultations/list.php
```

**웹 접근 URL**:
```
https://geunjae.kr/api/consultations/list.php
```

**설명**: cafe24 도메인 설정에 따라 `geunjae.kr` 도메인이 `/geungae0327/www/geunjae.kr/` 디렉토리를 가리키므로, 웹 URL은 `/api/consultations/list.php`로 접근 가능합니다.

### 2단계: 디렉토리 생성 (없는 경우)

FTP에서 확인된 실제 경로에 디렉토리 생성:
```
/geungae0327/www/geunjae.kr/api/consultations/
```

**참고**: 이미 파일이 있다면 이 단계는 건너뛰세요.

### 3단계: PHP 파일 업로드

필요한 PHP 파일들:
- `list.php` - 상담신청 리스트 조회
- `detail.php` - 상담신청 상세 조회
- `update.php` - 상담신청 정보 수정
- `status-update.php` - 상태 변경
- `consultation-date-update.php` - 상담일 변경
- `bulk-status-update.php` - 일괄 상태 변경
- `statistics.php` - 통계 데이터
- `export-excel.php` - 엑셀 내보내기

### 4단계: 파일 권한 설정

cafe24 FTP에서 파일 권한 설정:
- 폴더: `755`
- PHP 파일: `644`

### 5단계: API_BASE_URL 확인

**현재 설정이 올바릅니다** ✅

실제 파일 위치: `/geungae0327/www/geunjae.kr/api/consultations/list.php`
웹 접근 URL: `https://geunjae.kr/api/consultations/list.php`

**현재 코드**:
```javascript
// routes/workers-comp/consultations.js
const API_BASE_URL = process.env.CONSULTATION_API_URL || 'https://geunjae.kr/api';
```

**설명**: 
- cafe24 도메인 설정에 따라 `geunjae.kr`이 `/geungae0327/www/geunjae.kr/`를 가리키므로
- `https://geunjae.kr/api/consultations/list.php`로 접근하면
- 자동으로 `/geungae0327/www/geunjae.kr/api/consultations/list.php` 파일이 실행됩니다.

**수정 불필요**: 현재 설정이 올바르게 되어 있습니다.

### 6단계: 테스트

Node.js 프록시를 통해 테스트:
```bash
curl "https://disk-cms.simg.kr/api/workers-comp/consultations?page=1&limit=20"
```

## 환경변수 설정 (선택사항)

만약 다른 경로를 사용해야 한다면, `.env` 파일에 설정:

```env
CONSULTATION_API_URL=https://geunjae.kr/api
```

또는 다른 경로:
```env
CONSULTATION_API_URL=https://www.geunjae.kr/api
```

## 문제 해결

### 문제 1: 404 Not Found

**원인**: PHP 파일이 잘못된 위치에 있음

**해결**:
1. FTP에서 파일 위치 확인
2. 브라우저에서 직접 URL 접속 테스트
3. 올바른 경로로 파일 이동

### 문제 2: 500 Internal Server Error

**원인**: PHP 파일에 오류가 있거나 데이터베이스 연결 실패

**해결**:
1. PHP 오류 로그 확인 (cafe24 관리자 페이지)
2. 데이터베이스 연결 정보 확인
3. PHP 파일의 오류 수정

### 문제 3: CORS 오류

**원인**: PHP 파일에서 CORS 헤더가 설정되지 않음

**해결**: PHP 파일 상단에 추가:
```php
<?php
header("Access-Control-Allow-Origin: https://disk-cms.simg.kr");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// ... 나머지 코드
```

## 현재 설정 확인

**Node.js 프록시 파일**: `disk-cms/routes/workers-comp/consultations.js`

**현재 API_BASE_URL**:
```javascript
const API_BASE_URL = process.env.CONSULTATION_API_URL || 'https://geunjae.kr/api';
```

**호출되는 PHP 파일**:
- 리스트: `https://geunjae.kr/api/consultations/list.php`
- 상세: `https://geunjae.kr/api/consultations/detail.php`
- 수정: `https://geunjae.kr/api/consultations/update.php`
- 기타: `https://geunjae.kr/api/consultations/*.php`

## 다음 단계

1. ✅ FTP에서 `/geunjae.kr/api/consultations/` 경로 확인
2. ✅ PHP 파일들이 올바른 위치에 있는지 확인
3. ✅ 브라우저에서 직접 URL 접속 테스트
4. ✅ Node.js 프록시를 통한 API 호출 테스트
5. ✅ 필요시 환경변수 또는 코드 수정

