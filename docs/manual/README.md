# 실수 사례 공유 시스템 문서

**작성일**: 2025-12-31  
**목적**: 실수 사례를 기록, 수정, 논의할 수 있는 웹 시스템

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [API 엔드포인트](#api-엔드포인트)
4. [페이지 구조](#페이지-구조)
5. [사용 방법](#사용-방법)
6. [개발 가이드](#개발-가이드)

---

## 시스템 개요

### 목적
- 실수 사례를 체계적으로 기록하고 관리
- 조직 구성원 간 실수 사례 공유
- 실수에 대한 구조적 원인 분석 및 개선 방안 도출
- 재발 방지를 위한 체크리스트 및 프로세스 문서화

### 핵심 가치
- **처벌이 아닌 학습**: 실수는 조직 학습의 자산
- **구조적 접근**: 개인 탓이 아닌 시스템 문제 해결
- **지속적 개선**: 사례별 개선 방안 도출 및 적용

---

## 데이터베이스 스키마

데이터베이스 스키마는 `docs/manual/database-schema.sql` 파일을 참조하세요.

### 주요 테이블
- `mistake_cases`: 실수 사례 메인 테이블
- `mistake_case_comments`: 댓글 테이블
- `mistake_case_files`: 첨부 파일 테이블
- `mistake_case_history`: 수정 이력 테이블
- `checklists`: 체크리스트 테이블

---

## API 엔드포인트

### 실수 사례 관리

#### 목록 조회
```
GET /api/manual/mistake-cases
Query Parameters:
  - page: 페이지 번호 (기본값: 1)
  - limit: 페이지당 항목 수 (기본값: 10)
  - category: 업무 영역 필터
  - severity: 심각도 필터 (low, medium, high)
  - search: 검색어
  - sort: 정렬 기준 (created_at, view_count, comment_count, title)
```

#### 상세 조회
```
GET /api/manual/mistake-cases/:id
```

#### 등록
```
POST /api/manual/mistake-cases
Content-Type: application/json 또는 multipart/form-data (파일 첨부 시)

Body:
{
  "title": "제목",
  "category": "업무영역",
  "severity": "medium",
  "tags": ["태그1", "태그2"],
  "work_content": "업무 내용",
  "mistake_description": "발생한 실수",
  "result_description": "결과",
  "surface_causes": "표면적 원인",
  "root_causes": "근본 원인",
  "structural_issues": "구조적 문제",
  "improvement_measures": "개선 방안",
  "checklist_items": [...]
}
```

#### 수정
```
PUT /api/manual/mistake-cases/:id
```

#### 삭제
```
DELETE /api/manual/mistake-cases/:id
```

### 댓글 관리

#### 목록 조회
```
GET /api/manual/mistake-cases/:id/comments
```

#### 작성
```
POST /api/manual/mistake-cases/:id/comments
Body: { "content": "댓글 내용" }
```

#### 수정
```
PUT /api/manual/mistake-cases/:id/comments/:commentId
Body: { "content": "수정된 댓글 내용" }
```

#### 삭제
```
DELETE /api/manual/mistake-cases/:id/comments/:commentId
```

### 파일 관리

#### 다운로드
```
GET /api/manual/mistake-cases/:id/files/:fileId/download
```

---

## 페이지 구조

### 목록 페이지
**경로**: `/pages/manual/mistake-cases.html`  
**JavaScript**: `/js/manual/mistake-cases-list.js`

**기능**:
- 실수 사례 목록 조회
- 필터링 (업무영역, 심각도)
- 검색 (제목, 내용)
- 정렬 (최신순, 조회수, 댓글수, 제목순)
- 페이징

### 상세 페이지
**경로**: `/pages/manual/mistake-case-detail.html`  
**JavaScript**: `/js/manual/mistake-case-detail.js`

**기능**:
- 실수 사례 상세 내용 표시 (탭 기반)
- 댓글 작성/수정/삭제
- 첨부 파일 다운로드
- 수정/삭제 (권한별)

### 등록/수정 폼 페이지
**경로**: `/pages/manual/mistake-case-form.html`  
**JavaScript**: `/js/manual/mistake-case-form.js`

**기능**:
- 실수 사례 등록/수정
- 체크리스트 동적 추가/삭제
- 파일 업로드
- 유효성 검사

---

## 사용 방법

### 1. 실수 사례 등록

1. 메뉴: **지식 공유 > 실수 사례 > 사례 등록** 클릭
2. 필수 항목 입력:
   - 제목
   - 업무 영역
   - 발생한 실수
   - 근본 원인
3. 선택 항목 입력:
   - 업무 내용
   - 결과 및 영향
   - 표면적 원인
   - 구조적 문제
   - 개선 방안
   - 체크리스트
   - 첨부 파일
4. **등록** 버튼 클릭

### 2. 실수 사례 조회

1. 메뉴: **지식 공유 > 실수 사례 > 전체 목록** 클릭
2. 필터 또는 검색으로 원하는 사례 찾기
3. 목록에서 사례 클릭하여 상세 페이지로 이동

### 3. 댓글 작성

1. 상세 페이지에서 댓글 입력 영역에 내용 입력
2. **댓글 작성** 버튼 클릭 또는 `Ctrl + Enter` 단축키 사용

### 4. 댓글 수정/삭제

- 본인이 작성한 댓글 또는 관리자인 경우 수정/삭제 버튼 표시
- 수정: 수정 버튼 클릭 후 내용 수정
- 삭제: 삭제 버튼 클릭 후 확인

---

## 개발 가이드

### 파일 구조

```
disk-cms/
├── routes/manual/
│   └── mistake-cases.js          # API 라우터
├── public/
│   ├── pages/manual/
│   │   ├── mistake-cases.html           # 목록 페이지
│   │   ├── mistake-case-detail.html     # 상세 페이지
│   │   └── mistake-case-form.html       # 등록/수정 폼
│   ├── js/manual/
│   │   ├── mistake-cases-list.js        # 목록 관리
│   │   ├── mistake-case-detail.js       # 상세 페이지
│   │   └── mistake-case-form.js         # 폼 관리
│   └── uploads/manual/                  # 파일 업로드 디렉토리
└── docs/manual/
    ├── database-schema.sql              # 데이터베이스 스키마
    └── README.md                        # 이 문서
```

### 권한 관리

#### 일반 사용자
- 모든 실수 사례 조회 가능
- 실수 사례 등록 가능
- 자신이 작성한 실수 사례 수정/삭제 가능
- 댓글 작성 가능
- 자신이 작성한 댓글 수정/삭제 가능

#### 관리자 (SUPER_ADMIN, SYSTEM_ADMIN, DEPT_MANAGER)
- 모든 실수 사례 수정/삭제 가능
- 모든 댓글 수정/삭제 가능

### 업무 영역 카테고리

- 정산
- 보험료
- 계약
- 데이터 관리
- 문서
- 고객 서비스
- 시스템
- 기타

### 심각도 레벨

- **low**: 낮음 (녹색 배지)
- **medium**: 보통 (노란색 배지) - 기본값
- **high**: 높음 (빨간색 배지)

---

## 주요 기능 설명

### 체크리스트

체크리스트는 두 가지 형태로 저장됩니다:

1. **단순 배열**: 문자열 배열로 저장
   ```json
   ["항목1", "항목2", "항목3"]
   ```

2. **제목 + 항목**: 객체 배열로 저장
   ```json
   [
     {
       "title": "기본 정보 확인",
       "items": ["항목1", "항목2"]
     }
   ]
   ```

### 파일 업로드

- **지원 형식**: 이미지 (jpeg, jpg, png, gif), PDF, 문서 (doc, docx, xls, xlsx)
- **최대 크기**: 10MB
- **저장 경로**: `public/uploads/manual/`
- **최대 개수**: 10개

### 수정 이력

실수 사례를 수정할 때마다 `mistake_case_history` 테이블에 수정 이력이 자동으로 저장됩니다.

- 변경된 필드 정보
- 변경 전 값
- 변경 후 값
- 수정자 정보
- 수정 시간

---

## 문제 해결

### 파일 업로드 실패

- 파일 크기가 10MB를 초과하지 않는지 확인
- 지원하는 파일 형식인지 확인
- 서버의 `public/uploads/manual/` 디렉토리 권한 확인

### 권한 오류

- 로그인이 되어 있는지 확인
- 작성자 본인이거나 관리자 권한이 있는지 확인

### 데이터베이스 오류

- `docs/manual/database-schema.sql` 파일로 테이블이 생성되어 있는지 확인
- 외래 키 제약 조건 확인

---

**작성일**: 2025-12-31  
**최종 업데이트**: 2025-12-31

