# KJ 대리운전 프론트엔드 현황 및 정리 방안

**작성일**: 2025-12-20  
**대상 디렉토리**: `public/pages/insurance/` (KJ 관련 파일)

---

## 📊 현재 개발 상태

### 1. 프론트엔드 HTML 파일 (5개)

| 파일명 | 기능 | 개발 상태 | 우선순위 | 비고 |
|--------|------|-----------|----------|------|
| `kj-driver-company.html` | 대리업체 목록 조회 및 관리 | ✅ **완료** | 높음 | 업체 검색, 필터링, 상세 모달 |
| `kj-driver-endorse-list.html` | 배서 리스트 조회 및 상태 업데이트 | ✅ **완료** | 높음 | 최근 1차/2차 개발 완료 |
| `kj-driver-search.html` | 기사 찾기 | ✅ **완료** | 중간 | 이름/주민번호 검색 |
| `kj-driver-policy-search.html` | 증권번호 찾기 | ✅ **완료** | 중간 | 계약자명/차량번호 검색 |
| `kj-driver-code-by-policy.html` | 증권별 코드 조회 | ✅ **완료** | 중간 | 증권 상세 정보 |

### 2. JavaScript 파일 (6개)

| 파일명 | 연결된 HTML | 개발 상태 | 주요 기능 |
|--------|-------------|-----------|-----------|
| `kj-driver-company.js` | kj-driver-company.html | ✅ **완료** | 업체 목록 조회, 필터링, 모달 |
| `kj-driver-endorse-list.js` | kj-driver-endorse-list.js | ✅ **완료** | 배서 리스트, 상태 업데이트, 보험료 계산 |
| `kj-driver-search.js` | kj-driver-search.html | ✅ **완료** | 기사 검색 |
| `kj-driver-code-by-policy.js` | kj-driver-code-by-policy.html | ✅ **완료** | 증권별 코드 조회 |
| `kj-company-modal.js` | 공통 (모달) | ✅ **완료** | 업체 상세 정보 모달 |
| `kj-constants.js` | 공통 (상수) | ✅ **완료** | 보험사 코드, 상태 코드 등 |

### 3. Node.js API 프록시 라우트 (2개)

| 파일명 | 주요 라우트 | 개발 상태 | 비고 |
|--------|------------|-----------|------|
| `kj-driver-company.js` | `/kj-company/*`, `/kj-code/*`, `/kj-endorse/*`, `/kj-certi/*` | ✅ **완료** | 대부분의 API 프록시 포함 |
| `kj-driver-search.js` | `/kj-driver/*` | ✅ **완료** | 기사 검색 관련 |

### 4. 백엔드 PHP API 파일 (27개)

**주요 API 파일:**
- ✅ `kj-endorse-list.php` - 배서 리스트 조회
- ✅ `kj-endorse-update-status.php` - 배서 상태 업데이트 (1차/2차 완료)
- ✅ `kj-company-list.php` - 업체 목록
- ✅ `kj-policy-stats.php` - 증권별 통계
- ✅ `kj-certi-detail.php` - 증권 상세
- ✅ `kj-driver-list.php` - 기사 목록
- 기타 21개 API 파일

---

## 📋 개발 완료도 분석

### ✅ 완전히 개발 완료된 기능
1. **배서처리 기능** (kj-driver-endorse-list)
   - 배서 리스트 조회 ✅
   - 상태 업데이트 (청약/해지/취소/거절) ✅
   - 보험료 계산 ✅
   - SMS 발송 ✅
   - 현대해상 API 연동 ✅
   - 할인할증 검증 ✅

2. **대리업체 관리** (kj-driver-company)
   - 업체 목록 조회 ✅
   - 업체 상세 정보 ✅
   - 담당자 관리 ✅

3. **검색 기능**
   - 기사 검색 ✅
   - 증권번호 검색 ✅

### 🔄 기획/진행 중인 기능
1. **보험료 입력 페이지 고도화**
   - 상태: 기획 단계
   - 파일: `docs/kj/보험료-입력-페이지-고도화-기획안.md`
   - Phase 1 (백엔드 API 확장) 진행 중

### ⚠️ 향후 개발 예정
1. **DB 손보(insuranceCompany=2) 추가 필드 업데이트**
   - `dongbuSelNumber`, `dongbusigi`, `dongbujeongi`, `nabang_1`
   - 우선순위: 낮음 (선택적)

---

## 🎯 정리 방안 제안

### 방안 1: 기능별 그룹화 (권장) ⭐

현재 파일들이 기능적으로 잘 분리되어 있으므로, **기능별로 하위 폴더 구조를 생성**하는 것을 제안합니다.

```
public/pages/insurance/
├── kj/                          # KJ 대리운전 전용 폴더 생성
│   ├── company/
│   │   └── kj-driver-company.html
│   ├── endorse/
│   │   └── kj-driver-endorse-list.html
│   ├── search/
│   │   ├── kj-driver-search.html
│   │   └── kj-driver-policy-search.html
│   └── policy/
│       └── kj-driver-code-by-policy.html
│
public/js/insurance/
├── kj/                          # JavaScript도 동일 구조
│   ├── company/
│   │   ├── kj-driver-company.js
│   │   └── kj-company-modal.js
│   ├── endorse/
│   │   └── kj-driver-endorse-list.js
│   ├── search/
│   │   └── kj-driver-search.js
│   ├── policy/
│   │   └── kj-driver-code-by-policy.js
│   └── kj-constants.js          # 공통 파일
```

**장점:**
- 기능별로 명확히 분리
- 향후 확장 시 관리 용이
- 관련 파일을 쉽게 찾을 수 있음

**단점:**
- 기존 경로 참조 수정 필요 (라우팅 설정 확인)

---

### 방안 2: 현재 구조 유지 + 문서화 (간단) 

현재 구조를 유지하되, **명확한 문서와 네이밍 규칙을 정립**합니다.

**현재 구조 (유지):**
```
public/pages/insurance/
├── kj-driver-company.html
├── kj-driver-endorse-list.html
├── kj-driver-search.html
├── kj-driver-policy-search.html
└── kj-driver-code-by-policy.html
```

**추가 작업:**
1. 파일명 앞에 `kj-driver-` 접두사 일관성 유지 ✅ (이미 완료)
2. 각 파일 상단에 주석으로 기능 설명 추가
3. README 파일 생성하여 기능별 설명

**장점:**
- 즉시 적용 가능 (파일 이동 불필요)
- 기존 참조 경로 변경 불필요

**단점:**
- 파일이 많아지면 관리 어려움

---

### 방안 3: 하이브리드 방식 (권장하지 않음)

핵심 기능만 폴더로 분리하고 나머지는 유지

---

## 📝 권장 정리 방안: **방안 1 (기능별 그룹화)**

### 구현 단계

#### Phase 1: 폴더 구조 생성
1. `public/pages/insurance/kj/` 폴더 생성
2. 하위 폴더 생성:
   - `company/`
   - `endorse/`
   - `search/`
   - `policy/`

#### Phase 2: 파일 이동
1. HTML 파일 이동:
   ```
   kj-driver-company.html → kj/company/kj-driver-company.html
   kj-driver-endorse-list.html → kj/endorse/kj-driver-endorse-list.html
   kj-driver-search.html → kj/search/kj-driver-search.html
   kj-driver-policy-search.html → kj/search/kj-driver-policy-search.html
   kj-driver-code-by-policy.html → kj/policy/kj-driver-code-by-policy.html
   ```

2. JavaScript 파일 이동 (선택사항):
   - JavaScript는 공통으로 사용되는 경우가 많으므로, 이동하지 않고 경로만 수정해도 됨

#### Phase 3: 경로 참조 확인 및 수정
1. 라우팅 설정 확인 (`routes/` 폴더)
2. 메뉴/사이드바에서 해당 페이지 링크 확인
3. 필요 시 경로 수정

#### Phase 4: 문서 업데이트
1. README 파일 생성 (`kj/README.md`)
2. 각 폴더별 설명 추가

---

## 🔍 추가 확인 사항

### 1. 라우팅 확인 필요
- 메뉴/사이드바에서 페이지 경로 참조 확인
- 직접 URL 접근이 아닌 경우 경로 수정 필요

### 2. JavaScript 경로 확인
- HTML 파일 내 `<script src="/js/insurance/kj-*.js">` 경로 확인
- 현재 구조 유지 시 경로 변경 불필요

### 3. API 프록시 라우트 확인
- `routes/insurance/kj-driver-company.js`는 그대로 유지
- HTML 파일 경로와 무관하므로 변경 불필요

---

## ✅ 다음 단계 제안

1. **즉시 진행 가능:**
   - 방안 2 적용 (현재 구조 유지 + 문서화)
   - README 파일 생성

2. **향후 진행:**
   - 방안 1 적용 (폴더 구조화)
   - 라우팅 및 메뉴 경로 확인 후 진행

3. **개발 우선순위:**
   - 보험료 입력 페이지 고도화 (Phase 1 진행 중)
   - DB 손보 추가 필드 업데이트 (낮은 우선순위)

---

## 📌 결론

**현재 상태:**
- ✅ 주요 기능은 모두 개발 완료
- ✅ 파일 구조는 명확하고 일관성 있음
- ✅ API 프록시도 잘 정리되어 있음

**권장 사항:**
- 단기: 방안 2 (현재 구조 유지 + README 문서화)
- 장기: 방안 1 (기능별 폴더 구조화) - 파일이 더 늘어날 경우

**우선순위:**
1. 보험료 입력 페이지 고도화 진행
2. 현재 구조 정리 (문서화 또는 폴더화)
3. 향후 추가 기능 개발

