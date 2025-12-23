# 약국배상책임보험 PHP 파일 작성 규칙

**작성일**: 2025-01-XX

---

## 📋 PHP 파일 헤더 규칙

### 필수 항목

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

---

## 📝 작성 예시

### 예시 1: 메모 업데이트 API

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

---

### 예시 2: 약국 상세 조회 API

```php
<?php
/**
 * 파일 경로: imet/api/pharmacy/pharmacyApply-num-detail.php
 * 파일명: pharmacyApply-num-detail.php
 * 
 * 약국배상책임보험 상세보기 API (보험료 API 호출 방식 - 유비케어 대응)
 * GET: num (약국 번호)
 * - 기존 DB 조회 방식 → 외부 API 호출 방식으로 변경
 * - account 값에 따라 다른 API URL 사용 (1,7 vs 그 외)
 */

// 직접 접근 허용 플래그
define('API_ACCESS', true);
```

---

### 예시 3: 약국 목록 조회 API

```php
<?php
/**
 * 파일 경로: imet/api/pharmacy/pharmacy-list.php
 * 파일명: pharmacy-list.php
 * 
 * 약국 목록 조회 API
 * GET: page, limit, search, status, account
 * - 페이징 지원
 * - 검색 및 필터링 지원
 */

// 직접 접근 허용 플래그
define('API_ACCESS', true);
```

---

## 📌 규칙 요약

### 1. 파일 경로 표기
- **형식**: `imet/api/pharmacy/파일명.php`
- **로컬 개발 경로**: `d:\development\imet\api\pharmacy\파일명.php`
- **프로덕션 경로**: `https://imet.kr/api/pharmacy/파일명.php`

### 2. 파일명 표기
- **형식**: `파일명.php` (확장자 포함)
- 실제 파일명과 정확히 일치해야 함

### 3. 파일 설명
- 파일의 주요 기능 설명
- API 엔드포인트 정보 (GET, POST, PUT, DELETE)
- 주요 파라미터 설명
- 특이사항 (선택사항)

---

## ✅ 체크리스트

PHP 파일을 수정하거나 생성할 때:

- [ ] 파일 경로가 상단 주석에 포함되어 있는가?
- [ ] 파일명이 상단 주석에 포함되어 있는가?
- [ ] 파일 설명이 명확한가?
- [ ] API 엔드포인트 정보가 포함되어 있는가?
- [ ] 주요 파라미터가 설명되어 있는가?

---

## 🔄 수정 시 주의사항

### 기존 파일 수정 시
1. 파일 상단 주석 확인
2. 경로/파일명 정보가 없으면 추가
3. 변경사항이 있으면 주석 업데이트

### 새 파일 생성 시
1. 파일 생성 전 주석 작성
2. 경로/파일명 정보 포함
3. 파일 설명 작성

---

## 📂 파일 경로 규칙

### 로컬 개발 환경
```
d:\development\imet\api\pharmacy\파일명.php
```

### 프로덕션 환경
```
https://imet.kr/api/pharmacy/파일명.php
```

### 주석에 표기할 경로
```
imet/api/pharmacy/파일명.php
```

**중요**: 주석에는 상대 경로 형식으로 표기 (프로젝트 루트 기준)

---

## 💡 예외 사항

### config 파일
```php
<?php
/**
 * 파일 경로: imet/api/config/db.php
 * 파일명: db.php
 * 
 * 데이터베이스 설정 파일
 */
```

### 공통 헬퍼 파일
```php
<?php
/**
 * 파일 경로: imet/api/common/helper.php
 * 파일명: helper.php
 * 
 * 공통 헬퍼 함수
 */
```

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

