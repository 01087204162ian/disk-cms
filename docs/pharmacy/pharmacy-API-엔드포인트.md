# 약국배상책임보험 API 엔드포인트 목록

**작성일**: 2025-01-XX

---

## 📋 목차

1. [메인 라우터 (pharmacy.js)](#메인-라우터-pharmacyjs)
2. [관리자 기능 (admin.js)](#관리자-기능-adminjs)
3. [예치금 관리 (deposits.js)](#예치금-관리-depositsjs)
4. [실적 관리 (reports.js)](#실적-관리-reportsjs)
5. [업체 관리 (pharmacy2.js)](#업체-관리-pharmacy2js)

---

## 메인 라우터 (pharmacy.js)

### 약국 목록 조회
```
GET /api/pharmacy/list
```

**Query Parameters**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `search`: 검색어 (업체명, 사업자번호, 담당자)
- `status`: 상태 필터 (10, 13, 7, 14, 15, 16, 17)
- `account`: 거래처 필터

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "num": 123,
      "company": "약국명",
      "chemist": "전문인수",
      "area": "화재면적",
      "account": "거래처번호",
      "account_company": "거래처명"
    }
  ],
  "pagination": {
    "total_count": 100,
    "current_page": 1,
    "total_pages": 5
  }
}
```

---

### 거래처 목록 조회
```
GET /api/pharmacy/accounts
```

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "num": 1,
      "directory": "거래처명"
    }
  ]
}
```

---

### 업체 리스트 조회
```
GET /api/pharmacy/id-list
```

**Query Parameters**:
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수
- `search`: 검색어

---

### 업체 상세 정보 조회
```
GET /api/pharmacy/id-detail/:num
```

**Path Parameters**:
- `num`: 약국 번호

---

### 업체 정보 수정
```
PUT /api/pharmacy/id-update/:num
```

**Path Parameters**:
- `num`: 약국 번호

**Request Body**:
```json
{
  "company": "약국명",
  "chemist": "전문인수",
  "area": "화재면적"
}
```

---

### 업체 신규 등록
```
POST /api/pharmacy/id-create
```

**Request Body**:
```json
{
  "mem_id": "아이디",
  "passwd": "비밀번호",
  "name": "이름",
  "hphone1": "전화번호"
}
```

---

### 업체 삭제
```
DELETE /api/pharmacy/id-delete/:num
```

**Path Parameters**:
- `num`: 약국 번호

---

### 아이디 중복 확인
```
GET /api/pharmacy/id-check?mem_id=아이디
```

**Query Parameters**:
- `mem_id`: 확인할 아이디

**응답 예시**:
```json
{
  "available": true
}
```

---

### 파일 업로드
```
POST /api/pharmacy/upload-files
```

**Content-Type**: `multipart/form-data`

**Form Data**:
- `num`: 약국 번호
- `certificate_files[]`: 증권 파일들 (최대 5개)
- `receipt_files[]`: 영수증 파일들 (최대 5개)

**파일 제한**:
- 파일 크기: 최대 5MB
- 파일 타입: JPG, PNG, GIF, PDF
- 최대 파일 수: 10개

---

### 파일 목록 조회
```
GET /api/pharmacy/files/:num
```

**Path Parameters**:
- `num`: 약국 번호

---

### 파일 다운로드
```
GET /api/pharmacy/download/:filename
```

**Path Parameters**:
- `filename`: 파일명

---

### 파일 삭제
```
DELETE /api/pharmacy/files/:filename
```

**Path Parameters**:
- `filename`: 파일명

---

## 관리자 기능 (admin.js)

### API 키 목록 조회
```
GET /api/pharmacy-admin/api-keys
```

**Query Parameters**:
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수
- `search`: 검색어

**인증**: 로그인 필요 (requireAuth)

---

### API 키 생성
```
POST /api/pharmacy-admin/api-keys/generate
```

**Request Body**:
```json
{
  "name": "API 키 이름",
  "description": "설명"
}
```

**인증**: 로그인 필요 (requireAuth)

---

### API 키 상세 조회
```
GET /api/pharmacy-admin/api-keys/:id
```

**Path Parameters**:
- `id`: API 키 ID

**인증**: 로그인 필요 (requireAuth)

---

### API 키 삭제
```
DELETE /api/pharmacy-admin/api-keys/:id
```

**Path Parameters**:
- `id`: API 키 ID

**인증**: 로그인 필요 (requireAuth)

---

### API 키 활성화/비활성화
```
PUT /api/pharmacy-admin/api-keys/:id/toggle
```

**Path Parameters**:
- `id`: API 키 ID

**인증**: 로그인 필요 (requireAuth)

---

### API 키 재생성
```
POST /api/pharmacy-admin/api-keys/:id/regenerate
```

**Path Parameters**:
- `id`: API 키 ID

**인증**: 로그인 필요 (requireAuth)

---

### API 사용 로그 조회
```
GET /api/pharmacy-admin/api-logs/:id
```

**Path Parameters**:
- `id`: API 키 ID

**인증**: 로그인 필요 (requireAuth)

---

### API 통계 조회
```
GET /api/pharmacy-admin/api-stats
```

**인증**: 로그인 필요 (requireAuth)

---

## 예치금 관리 (deposits.js)

### 예치 잔액 조회
```
GET /api/pharmacy-deposits/balance/:accountNum
```

**Path Parameters**:
- `accountNum`: 거래처 번호

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "account_num": 1,
    "balance": 1000000,
    "currency": "KRW"
  }
}
```

---

### 예치금 리스트 조회
```
GET /api/pharmacy-deposits/list/:accountNum
```

**Path Parameters**:
- `accountNum`: 거래처 번호

**Query Parameters**:
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

---

### 예치금 입금
```
POST /api/pharmacy-deposits/deposit
```

**Request Body**:
```json
{
  "account_num": 1,
  "amount": 100000,
  "memo": "입금 메모"
}
```

---

### 사용 내역 조회
```
GET /api/pharmacy-deposits/usage/:accountNum
```

**Path Parameters**:
- `accountNum`: 거래처 번호

**Query Parameters**:
- `start_date`: 시작일 (YYYY-MM-DD)
- `end_date`: 종료일 (YYYY-MM-DD)

---

### 전체 예치금 현황
```
GET /api/pharmacy-deposits/summary
```

**인증**: 관리자 권한 필요

---

### 예치금 수정
```
PUT /api/pharmacy-deposits/deposit/:depositId
```

**Path Parameters**:
- `depositId`: 예치금 ID

**Request Body**:
```json
{
  "amount": 200000,
  "memo": "수정 메모"
}
```

---

### 예치금 삭제
```
DELETE /api/pharmacy-deposits/deposit/:depositId
```

**Path Parameters**:
- `depositId`: 예치금 ID

---

## 실적 관리 (reports.js)

### 일별 실적 조회
```
GET /api/pharmacy-reports/daily
```

**Query Parameters**:
- `account`: 거래처 번호 (선택)
- `year`: 년도 (필수)
- `month`: 월 (선택, 빈값이면 최근 30일)

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-01",
      "count": 10,
      "premium": 1000000
    }
  ]
}
```

---

### 월별 실적 조회
```
GET /api/pharmacy-reports/monthly
```

**Query Parameters**:
- `account`: 거래처 번호 (선택)
- `year`: 년도 (필수)

---

### 통계 조회
```
GET /api/pharmacy-reports/statistics
```

**Query Parameters**:
- `account`: 거래처 번호 (선택)
- `start_date`: 시작일
- `end_date`: 종료일

---

## 업체 관리 (pharmacy2.js)

### 업체 리스트 조회
```
GET /api/pharmacy2/customers
```

**Query Parameters**:
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수
- `search`: 검색어

---

### 새 업체 추가
```
POST /api/pharmacy2/customers
```

**Request Body**:
```json
{
  "mem_id": "아이디",
  "passwd": "비밀번호",
  "name": "이름",
  "hphone1": "전화번호",
  "directory": "거래처"
}
```

---

### 업체 정보 수정
```
PUT /api/pharmacy2/customers/:num
```

**Path Parameters**:
- `num`: 업체 번호

---

### 특정 업체 조회
```
GET /api/pharmacy2/customers/:num
```

**Path Parameters**:
- `num`: 업체 번호

---

### 아이디 중복확인
```
GET /api/pharmacy2/check-id?mem_id=아이디
```

**Query Parameters**:
- `mem_id`: 확인할 아이디

---

### 증권번호 발행
```
POST /api/pharmacy2/certificate-number
```

**Request Body**:
```json
{
  "pharmacy_id": 123,
  "certificate_number": "증권번호"
}
```

---

### 증권번호 조회
```
GET /api/pharmacy2/certificate-number/:pharmacyId
```

**Path Parameters**:
- `pharmacyId`: 약국 ID

---

### 보험료 계산
```
POST /api/pharmacy2/calculate-premium
```

**Request Body**:
```json
{
  "pharmacy_id": 123,
  "chemist": 5,
  "area": 100
}
```

---

### 상태 업데이트
```
POST /api/pharmacy2/update-status
```

**Request Body**:
```json
{
  "pharmacy_id": 123,
  "status": 13
}
```

---

### 설계번호 업데이트
```
POST /api/pharmacy2/design-number
```

**Request Body**:
```json
{
  "pharmacy_id": 123,
  "chemist_design": "설계번호1",
  "area_design": "설계번호2"
}
```

---

### 설계번호 조회
```
GET /api/pharmacy2/design-number/:pharmacyId
```

**Path Parameters**:
- `pharmacyId`: 약국 ID

---

### 메모 업데이트
```
POST /api/pharmacy2/:pharmacyId/memo
```

**Path Parameters**:
- `pharmacyId`: 약국 ID

**Request Body**:
```json
{
  "memo": "메모 내용"
}
```

---

### 해지 보험료 계산
```
POST /api/pharmacy2/calculate-cancellation
```

**Request Body**:
```json
{
  "pharmacy_id": 123,
  "cancellation_date": "2025-01-01"
}
```

---

### 해지 확인
```
POST /api/pharmacy2/confirm-cancellation
```

**Request Body**:
```json
{
  "pharmacy_id": 123,
  "cancellation_date": "2025-01-01"
}
```

---

### 해지 상태 조회
```
GET /api/pharmacy2/cancellation-status/:pharmacyId
```

**Path Parameters**:
- `pharmacyId`: 약국 ID

---

### 설계리스트 엑셀 다운로드
```
POST /api/pharmacy2/design-list-excel
```

**Request Body**:
```json
{
  "account": 1,
  "status": 13
}
```

**응답**: Excel 파일 (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": {},
  "message": "성공 메시지"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "에러 메시지",
  "details": "상세 에러 정보"
}
```

---

## 에러 코드

| HTTP 상태 코드 | 설명 |
|---------------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (파라미터 오류) |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스를 찾을 수 없음 |
| 408 | 요청 시간 초과 |
| 500 | 서버 내부 오류 |
| 503 | 서비스 사용 불가 |

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

