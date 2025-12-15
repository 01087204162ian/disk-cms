# KJ 대리운전 공통 코드 중복 분석 및 개선 방안

## 📋 분석 개요

`disk-cms/` 폴더의 JavaScript 파일들과 `pci0327/api/insurance/` 폴더의 PHP 파일들을 분석하여 보험회사, 증권성격 등 공통으로 사용되는 코드의 중복 여부를 확인하고 개선했습니다.

**작업 범위:**
- ✅ `disk-cms/` 폴더의 JavaScript 파일만 고려
- ✅ `pci0327/api/insurance/` 폴더의 PHP 파일만 고려
- ❌ `pci0327/` 폴더의 JavaScript 파일은 제외

## 🔍 발견된 중복 코드 및 수정 완료

### 1. 보험회사 매핑 (Insurance Company Mapping)

**수정 완료된 파일:**

#### Frontend (disk-cms/)
- ✅ `disk-cms/public/js/insurance/kj-constants.js` (신규 생성 - 공통 모듈)
- ✅ `disk-cms/public/js/insurance/kj-company-modal.js`
- ✅ `disk-cms/public/js/insurance/kj-driver-search.js`

#### Backend (pci0327/api/insurance/)
- ✅ `pci0327/api/insurance/kj-company-detail.php`
- ✅ `pci0327/api/insurance/kj-driver-list.php`
- ✅ `pci0327/api/insurance/kj-certi-update-nabang.php` (주석 수정)

**수정 내용:**
- 4: 현대 (확인)
- 5: 롯데 (확인)
- 6: 더케이 → **하나**로 변경
- 7: MG → **한화**로 변경

**최종 보험회사 매핑:**
```javascript
// kj-constants.js
const INSURER_OPTIONS = [
  { value: 0, label: '=선택=' },
  { value: 1, label: '흥국' },
  { value: 2, label: 'DB' },
  { value: 3, label: 'KB' },
  { value: 4, label: '현대' },
  { value: 5, label: '롯데' },
  { value: 6, label: '하나' },  // 더케이 → 하나로 변경
  { value: 7, label: '한화' },  // MG → 한화로 변경
  { value: 8, label: '삼성' },
  { value: 9, label: '메리츠' },
];
```

```php
// PHP 파일들
$comNames = [1 => '흥국', 2 => 'DB', 3 => 'KB', 4 => '현대', 5 => '롯데', 6 => '하나', 7 => '한화', 10 => '보험료'];
```

### 2. 증권성격 옵션 (Gita Options)

**수정 완료된 파일:**

#### Frontend (disk-cms/)
- ✅ `disk-cms/public/js/insurance/kj-constants.js` (신규 생성 - 공통 모듈)
- ✅ `disk-cms/public/js/insurance/kj-company-modal.js`
- ✅ `disk-cms/public/js/insurance/kj-driver-search.js`

#### Backend (pci0327/api/insurance/)
- ✅ `pci0327/api/insurance/kj-company-detail.php`

**수정 내용:**
- 5: 전차량 → **확대탁송**으로 통일

**최종 증권성격 매핑:**
```javascript
// kj-constants.js
const GITA_OPTIONS = [
  { value: 1, label: '일반' },
  { value: 2, label: '탁송' },
  { value: 3, label: '일반/렌트' },
  { value: 4, label: '탁송/렌트' },
  { value: 5, label: '확대탁송' },  // 전차량 → 확대탁송으로 통일
];
```

```php
// PHP 파일들
$gitaNames = [1 => '일반', 2 => '탁송', 3 => '일반/렌트', 4 => '탁송/렌트', 5 => '확대탁송'];
```

## ✅ 공통 모듈 구조

### Frontend 공통 모듈: `kj-constants.js`

**위치:** `disk-cms/public/js/insurance/kj-constants.js`

**제공 기능:**
- `INSURER_OPTIONS`: 보험회사 옵션 배열
- `GITA_OPTIONS`: 증권성격 옵션 배열
- `DIVI_OPTIONS`: 결제방식 옵션 배열
- `INSURER_MAP`: 보험회사 코드 → 이름 매핑 객체
- `GITA_MAP`: 증권성격 코드 → 이름 매핑 객체
- `DIVI_MAP`: 결제방식 코드 → 이름 매핑 객체
- `getInsurerName(code)`: 보험회사 코드로 이름 가져오기
- `getGitaName(code)`: 증권성격 코드로 이름 가져오기
- `getDiviName(code)`: 결제방식 코드로 이름 가져오기
- `generateInsurerOptions(selectedValue, defaultValue)`: 보험회사 Select 옵션 HTML 생성
- `generateGitaOptions(selectedValue, defaultValue)`: 증권성격 Select 옵션 HTML 생성
- `generateDiviOptions(selectedValue, defaultValue)`: 결제방식 Select 옵션 HTML 생성

**사용 방법:**
```javascript
// HTML에서 스크립트 로드 순서 중요!
<script src="/js/insurance/kj-constants.js"></script>
<script src="/js/insurance/kj-company-modal.js"></script>
<script src="/js/insurance/kj-driver-search.js"></script>

// 사용 예시
const insurerName = window.KJConstants.getInsurerName(5); // '롯데'
const gitaName = window.KJConstants.getGitaName(5); // '확대탁송'
const options = window.KJConstants.generateInsurerOptions(5); // HTML 옵션 문자열
```

### Backend 공통 정의

**위치:** `pci0327/api/insurance/` 폴더의 각 PHP 파일

**표준 매핑:**
```php
// 보험회사 매핑
$comNames = [
    1 => '흥국',
    2 => 'DB',
    3 => 'KB',
    4 => '현대',
    5 => '롯데',
    6 => '하나',  // 더케이 → 하나로 변경
    7 => '한화',  // MG → 한화로 변경
    8 => '삼성',
    9 => '메리츠',
];

// 증권성격 매핑
$gitaNames = [
    1 => '일반',
    2 => '탁송',
    3 => '일반/렌트',
    4 => '탁송/렌트',
    5 => '확대탁송',  // 전차량 → 확대탁송으로 통일
];
```

## 📝 수정 완료된 파일 목록

### Frontend (disk-cms/)
1. ✅ `disk-cms/public/js/insurance/kj-constants.js` (신규 생성)
2. ✅ `disk-cms/public/js/insurance/kj-company-modal.js`
3. ✅ `disk-cms/public/js/insurance/kj-driver-search.js`

### Backend (pci0327/api/insurance/)
1. ✅ `pci0327/api/insurance/kj-company-detail.php`
2. ✅ `pci0327/api/insurance/kj-driver-list.php`
3. ✅ `pci0327/api/insurance/kj-certi-update-nabang.php` (주석 수정)

## 🎯 개선 효과

1. **중복 제거**: 보험회사와 증권성격 정의가 단일 소스로 통일됨
2. **유지보수성 향상**: 한 곳에서 수정하면 모든 곳에 반영됨
3. **일관성 확보**: Frontend와 Backend 모두 동일한 매핑 사용
4. **확장성**: 새로운 보험회사나 증권성격 추가 시 한 곳만 수정

## 📌 사용 가이드

### Frontend에서 공통 모듈 사용하기

1. **스크립트 로드 순서:**
```html
<!-- 공통 모듈을 먼저 로드 -->
<script src="/js/insurance/kj-constants.js"></script>
<!-- 그 다음 다른 모듈 로드 -->
<script src="/js/insurance/kj-company-modal.js"></script>
```

2. **보험회사 이름 가져오기:**
```javascript
const name = window.KJConstants.getInsurerName(5); // '롯데'
```

3. **Select 옵션 생성:**
```javascript
const options = window.KJConstants.generateInsurerOptions(5); // 선택값 5
// 또는
const options = window.KJConstants.generateInsurerOptions(null, 0); // 기본값 0
```

### Backend에서 표준 매핑 사용하기

```php
// 보험회사 매핑
$comNames = [
    1 => '흥국',
    2 => 'DB',
    3 => 'KB',
    4 => '현대',
    5 => '롯데',
    6 => '하나',
    7 => '한화',
    8 => '삼성',
    9 => '메리츠',
];
$comName = $comNames[$code] ?? '알 수 없음';

// 증권성격 매핑
$gitaNames = [
    1 => '일반',
    2 => '탁송',
    3 => '일반/렌트',
    4 => '탁송/렌트',
    5 => '확대탁송',
];
$gitaName = $gitaNames[$gita] ?? '알 수 없음';
```

## 🔄 향후 개선 방안

1. **PHP 공통 모듈 생성**: PHP 파일들도 공통 상수 파일로 분리 고려
2. **데이터베이스화**: 보험회사와 증권성격을 DB 테이블로 관리 고려
3. **API 엔드포인트**: 공통 코드 조회 API 제공 고려

## 📅 작업 일자

- **2025-12-14**: 초기 분석 및 공통 모듈 생성
- **2025-12-14**: 수정사항 반영 (더케이→하나, MG→한화, 전차량→확대탁송)
