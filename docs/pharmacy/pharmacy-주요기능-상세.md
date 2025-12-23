# 약국배상책임보험 주요 기능 상세

**작성일**: 2025-01-XX

---

## 📋 목차

1. [약국 목록 관리](#약국-목록-관리)
2. [약국 상세 정보](#약국-상세-정보)
3. [예치금 관리](#예치금-관리)
4. [실적 관리](#실적-관리)
5. [API 키 관리](#api-키-관리)
6. [파일 관리](#파일-관리)

---

## 약국 목록 관리

### 기능 개요
약국 목록을 조회하고 필터링하는 기능입니다.

### 주요 기능

#### 1. 목록 조회
- **API**: `GET /api/pharmacy/list`
- **페이징**: 페이지당 20/50/100개 선택 가능
- **정렬**: 기본적으로 최신순 정렬

#### 2. 필터링

**거래처 필터**:
- 전체 거래처 또는 특정 거래처 선택
- 거래처 목록은 서버에서 동적으로 로드

**상태 필터**:
- 메일보냄 (10)
- 승인 (13) - 기본값
- 보류 (7)
- 증권발급 (14)
- 해지요청 (15)
- 해지완료 (16)
- 설계중 (17)

**검색**:
- 업체명, 사업자번호, 담당자로 검색
- 부분 일치 검색 지원

#### 3. 테이블 표시 항목
- 번호 (#)
- 업체명 (클릭 시 상세 모달)
- 사업자번호
- 담당자
-대전화 (태블릿 이상)
- 연락처 (데스크톱 이상)
- 전문설계번호 (태블릿 이상)
- 화재설계번호 (태블릿 이상)
- 승인일
- 상태 (배지 표시)
- 메모 (데스크톱 이상)
- 보험료
- 거래처

#### 4. 반응형 디자인
- 데스크톱: 모든 컬럼 표시
- 태블릿: 일부 컬럼 숨김 (`d-none d-lg-table-cell`)
- 모바일: 카드 형태로 표시 (선택사항)

---

## 약국 상세 정보

### 기능 개요
약국 상세 정보를 모달로 표시하고 수정하는 기능입니다.

### 주요 기능

#### 1. 상세 정보 조회
- **트리거**: 테이블의 업체명 클릭
- **API**: `GET /api/pharmacy/id-detail/:num`
- **표시 방식**: Bootstrap 모달

#### 2. 표시 정보
- 기본 정보
  - 약국명
  - 사업자번호
  - 대표자명
  - 연락처
  - 주소
- 보험 정보
  - 전문인수
  - 화재면적
  - 전문설계번호
  - 화재설계번호
  - 보험료
  - 상태
- 기타 정보
  - 메모
  - 거래처
  - 승인일

#### 3. 정보 수정
- **API**: `PUT /api/pharmacy/id-update/:num`
- 수정 가능한 필드:
  - 약국명
  - 사업자번호
  - 대표자명
  - 연락처
  - 주소
  - 전문인수
  - 화재면적
  - 전문설계번호
  - 화재설계번호
  - 메모

#### 4. 모달 구조
```html
<div class="modal fade" id="pharmacyDetailModal">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">약국 상세 정보</h5>
        <button type="button" class="close" data-dismiss="modal">
          <span>&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <!-- 상세 정보 폼 -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">닫기</button>
        <button type="button" class="btn btn-primary" id="savePharmacyInfo">저장</button>
      </div>
    </div>
  </div>
</div>
```

---

## 예치금 관리

### 기능 개요
거래처별 예치금 잔액과 입출금 내역을 관리하는 기능입니다.

### 주요 기능

#### 1. 예치 잔액 조회
- **API**: `GET /api/pharmacy-deposits/balance/:accountNum`
- **표시 정보**:
  - 거래처명
  - 현재 잔액
  - 통화 (KRW)

#### 2. 입금 내역 조회
- **API**: `GET /api/pharmacy-deposits/list/:accountNum`
- **페이징**: 페이지당 항목 수 선택 가능
- **표시 정보**:
  - 입금일
  - 입금액
  - 메모
  - 처리자

#### 3. 예치금 입금
- **API**: `POST /api/pharmacy-deposits/deposit`
- **입력 항목**:
  - 거래처 번호
  - 입금액
  - 메모

#### 4. 사용 내역 조회
- **API**: `GET /api/pharmacy-deposits/usage/:accountNum`
- **필터**:
  - 시작일
  - 종료일
- **표시 정보**:
  - 사용일
  - 사용액
  - 사용 내역
  - 잔액

#### 5. 전체 예치금 현황
- **API**: `GET /api/pharmacy-deposits/summary`
- **권한**: 관리자만 접근 가능
- **표시 정보**:
  - 전체 거래처 수
  - 총 예치금
  - 거래처별 예치금 현황

---

## 실적 관리

### 기능 개요
일별/월별 실적을 조회하고 통계를 확인하는 기능입니다.

### 주요 기능

#### 1. 일별 실적 조회
- **API**: `GET /api/pharmacy-reports/daily`
- **필터**:
  - 거래처 (선택)
  - 년도 (필수)
  - 월 (선택, 빈값이면 최근 30일)
- **표시 정보**:
  - 날짜
  - 가입 건수
  - 총 보험료
  - 평균 보험료

#### 2. 월별 실적 조회
- **API**: `GET /api/pharmacy-reports/monthly`
- **필터**:
  - 거래처 (선택)
  - 년도 (필수)
- **표시 정보**:
  - 월
  - 가입 건수
  - 총 보험료
  - 전월 대비 증감률

#### 3. 통계 조회
- **API**: `GET /api/pharmacy-reports/statistics`
- **필터**:
  - 거래처 (선택)
  - 시작일
  - 종료일
- **표시 정보**:
  - 총 가입 건수
  - 총 보험료
  - 평균 보험료
  - 최고 보험료
  - 최저 보험료

---

## API 키 관리

### 기능 개요
외부 API 연동을 위한 API 키를 생성하고 관리하는 기능입니다.

### 주요 기능

#### 1. API 키 목록 조회
- **API**: `GET /api/pharmacy-admin/api-keys`
- **권한**: 로그인 필요
- **페이징**: 페이지당 항목 수 선택 가능
- **검색**: API 키 이름으로 검색

#### 2. API 키 생성
- **API**: `POST /api/pharmacy-admin/api-keys/generate`
- **입력 항목**:
  - 이름
  - 설명
- **응답**: 생성된 API 키와 Secret Key

#### 3. API 키 활성화/비활성화
- **API**: `PUT /api/pharmacy-admin/api-keys/:id/toggle`
- **기능**: API 키 사용 여부 제어

#### 4. API 키 재생성
- **API**: `POST /api/pharmacy-admin/api-keys/:id/regenerate`
- **기능**: 기존 API 키를 무효화하고 새 키 생성

#### 5. API 사용 로그 조회
- **API**: `GET /api/pharmacy-admin/api-logs/:id`
- **표시 정보**:
  - 사용 시간
  - 요청 URL
  - 응답 상태
  - IP 주소

#### 6. API 통계 조회
- **API**: `GET /api/pharmacy-admin/api-stats`
- **표시 정보**:
  - 총 API 키 수
  - 활성 API 키 수
  - 일일 요청 수
  - 월간 요청 수

---

## 파일 관리

### 기능 개요
약국 관련 파일(증권 파일, 영수증 파일)을 업로드하고 관리하는 기능입니다.

### 주요 기능

#### 1. 파일 업로드
- **API**: `POST /api/pharmacy/upload-files`
- **Content-Type**: `multipart/form-data`
- **파일 타입**:
  - 증권 파일 (certificate_files)
  - 영수증 파일 (receipt_files)
- **제한 사항**:
  - 파일 크기: 최대 5MB
  - 파일 타입: JPG, PNG, GIF, PDF
  - 최대 파일 수: 10개

#### 2. 파일 목록 조회
- **API**: `GET /api/pharmacy/files/:num`
- **표시 정보**:
  - 파일명
  - 원본 파일명
  - 파일 타입
  - 파일 크기
  - 업로드 일시

#### 3. 파일 다운로드
- **API**: `GET /api/pharmacy/download/:filename`
- **응답**: 파일 스트림

#### 4. 파일 삭제
- **API**: `DELETE /api/pharmacy/files/:filename`
- **권한**: 파일 업로드자 또는 관리자

---

## 상태 코드

### 약국 상태

| 코드 | 상태 | 설명 |
|------|------|------|
| 10 | 메일보냄 | 안내 메일 발송 완료 |
| 13 | 승인 | 가입 승인 완료 |
| 7 | 보류 | 검토 중 |
| 14 | 증권발급 | 증권 발급 완료 |
| 15 | 해지요청 | 해지 신청 접수 |
| 16 | 해지완료 | 해지 처리 완료 |
| 17 | 설계중 | 설계 진행 중 |

---

## 주요 버튼 기능

### 일별실적 버튼
- **기능**: 일별 실적 모달 표시
- **API**: `GET /api/pharmacy-reports/daily`

### 예치잔액 버튼
- **기능**: 예치 잔액 모달 표시
- **API**: `GET /api/pharmacy-deposits/balance/:accountNum`

### 설계리스트 엑셀 버튼
- **기능**: 승인건 중 설계리스트 엑셀 다운로드
- **API**: `POST /api/pharmacy2/design-list-excel`

### 업체추가 버튼
- **기능**: 신규 업체 등록 모달 표시
- **API**: `POST /api/pharmacy2/customers`

### API 관리 버튼
- **기능**: API 키 관리 페이지로 이동
- **권한**: 로그인 필요

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

