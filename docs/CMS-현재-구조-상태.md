# disk-cms 현재 구조 상태

**작성일**: 2026-01-XX  
**목적**: 현재 구현된 CMS 구조를 있는 그대로 객관적으로 정리

---

## 1. 현재 존재하는 화면/메뉴 구조

### 1.1 메뉴 설정 파일

**위치**: `disk-cms/public/config/menu-config.json`

**구조**:
```json
{
  "meta": {
    "version": "1.0.0",
    "lastUpdate": "2024-12-19"
  },
  "menus": [
    {
      "id": "insurance",
      "title": "보험상품",
      "icon": "fas fa-shield-alt",
      "order": 3,
      "children": [
        {
          "id": "proxy-driving",
          "title": "대리운전",
          "children": [
            { "id": "kj-proxy", "title": "KJ대리운전", "page": "insurance/kj-proxy" },
            { "id": "das-proxy", "title": "daS대리운전", "page": "insurance/das-proxy" },
            { "id": "personal-proxy", "title": "개인대리운전", "page": "insurance/personal-proxy" }
          ]
        },
        {
          "id": "internship",
          "title": "현장실습보험",
          "children": [
            { "id": "internship-applications", "title": "신청리스트", "page": "insurance/internship-applications" },
            { "id": "internship-claims", "title": "클레임", "page": "insurance/internship-claims" }
          ]
        },
        {
          "id": "pharmacy",
          "title": "약국배상책임보험",
          "children": [
            { "id": "pharmacy-applications", "title": "신청리스트", "page": "insurance/pharmacy-applications" },
            { "id": "pharmacy-claims", "title": "클레임", "page": "insurance/pharmacy-claims" }
          ]
        },
        {
          "id": "hole-in-one",
          "title": "홀인원보험",
          "children": [
            { "id": "hole-in-one-applications", "title": "신청리스트", "page": "insurance/hole-in-one-applications" },
            { "id": "hole-in-one-claims", "title": "클레임", "page": "insurance/hole-in-one-claims" }
          ]
        },
        {
          "id": "travel",
          "title": "여행자보험",
          "page": "insurance/travel"
        }
      ]
    }
  ]
}
```

**특징**:
- 상품은 `menus` 배열의 `insurance` 항목 하위에 계층 구조로 정의됨
- 각 상품은 `id`, `title`, `icon`, `children` 속성을 가짐
- 하위 화면은 `page` 속성으로 HTML 파일 경로 지정

### 1.2 실제 존재하는 페이지 파일

**위치**: `disk-cms/public/pages/`

**구조**:
```
public/pages/
├─ pharmacy/
│   └─ applications.html          (약국배상 신청리스트)
├─ insurance/
│   ├─ kj-driver-code-by-policy.html
│   ├─ kj-driver-company.html
│   ├─ kj-driver-endorse-list.html
│   ├─ kj-driver-policy-search.html
│   └─ kj-driver-search.html
├─ field-practice/
│   ├─ applications.html          (현장실습 신청리스트)
│   ├─ claims.html
│   └─ idList.html
└─ workers-comp/
    ├─ consultation.html
    └─ contracts.html
```

**관찰**:
- `menu-config.json`에 정의된 상품별로 실제 페이지 파일이 존재함
- 상품별로 독립된 디렉토리 구조를 가짐
- 각 상품은 자체 HTML 페이지와 JavaScript 파일을 가짐

### 1.3 메뉴 로더 구현

**파일**: `disk-cms/public/js/menu-loader.js`

**기능**:
- `menu-config.json` 파일을 로드
- JSON 데이터를 JavaScript 객체로 변환
- 메뉴 구조를 동적으로 생성

**관찰**:
- 메뉴 구조는 정적 JSON 파일에서 읽어옴
- 런타임에 데이터베이스에서 메뉴를 조회하지 않음

---

## 2. 상품(Product)이 어떤 화면과 테이블로 구성되어 있는지

### 2.1 데이터베이스 테이블 정의

**위치**: `disk-cms/sql.txt`

#### 2.1.1 products 테이블

```sql
CREATE TABLE products (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '상품명',
  code varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '상품코드',
  category varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상품 카테고리',
  description text COLLATE utf8mb4_unicode_ci COMMENT '상품 설명',
  is_active tinyint(1) DEFAULT '1',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY code (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

**필드 정의**:
- `id`: 기본키 (AUTO_INCREMENT)
- `name`: 상품명 (VARCHAR(100), NOT NULL)
- `code`: 상품코드 (VARCHAR(50), NOT NULL, UNIQUE)
- `category`: 상품 카테고리 (VARCHAR(50), NULL 허용)
- `description`: 상품 설명 (TEXT, NULL 허용)
- `is_active`: 활성화 여부 (TINYINT(1), 기본값 1)
- `created_at`: 생성일시 (TIMESTAMP)
- `updated_at`: 수정일시 (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)

#### 2.1.2 product_managers 테이블

```sql
CREATE TABLE product_managers (
  id int NOT NULL AUTO_INCREMENT,
  product_id int NOT NULL,
  user_id varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  manager_type enum('PRIMARY','SECONDARY') COLLATE utf8mb4_unicode_ci DEFAULT 'PRIMARY' COMMENT '정/부 담당자',
  assigned_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  is_active tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY unique_product_user_type (`product_id`,`user_id`,`manager_type`),
  KEY idx_product_active (`product_id`,`is_active`),
  KEY product_managers_ibfk_2 (`user_id`),
  CONSTRAINT product_managers_ibfk_1 FOREIGN KEY (`product_id`) REFERENCES products (`id`) ON DELETE CASCADE,
  CONSTRAINT product_managers_ibfk_2 FOREIGN KEY (`user_id`) REFERENCES users (`email`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

**관계**:
- `product_id` → `products.id` (FOREIGN KEY, CASCADE)
- `user_id` → `users.email` (FOREIGN KEY, CASCADE)

#### 2.1.3 products 테이블을 참조하는 테이블

**kpi_records 테이블**:
```sql
CREATE TABLE kpi_records (
  ...
  product_id int DEFAULT NULL,
  ...
  KEY product_id (`product_id`),
  KEY idx_kpi_user_product_date (`user_id`,`product_id`,`work_date`),
  CONSTRAINT kpi_records_ibfk_2 FOREIGN KEY (`product_id`) REFERENCES products (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

**kpi_summary 테이블**:
```sql
CREATE TABLE kpi_summary (
  ...
  product_id int DEFAULT NULL,
  ...
  UNIQUE KEY unique_summary (`user_id`,`product_id`,`summary_type`,`summary_date`),
  KEY product_id (`product_id`),
  CONSTRAINT kpi_summary_ibfk_3 FOREIGN KEY (`product_id`) REFERENCES products (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

**관찰**:
- `products` 테이블은 데이터베이스에 정의되어 있음
- `product_managers`, `kpi_records`, `kpi_summary` 테이블이 `products`를 참조함
- 외래키 제약조건이 설정되어 있음

### 2.2 프론트엔드 화면

**상품 관리 전용 페이지**: 없음

**관찰**:
- `public/pages/` 디렉토리에 `products/` 폴더가 없음
- `public/pages/` 디렉토리에 `products.html` 파일이 없음
- 상품을 직접 관리하는 화면이 구현되어 있지 않음

**페이지 설정 파일에서의 상품 참조**:

**파일**: `disk-cms/public/js/sj-template-loader.js`

```javascript
'products': {
  title: '상품 관리', 
  description: '보험 상품을 관리합니다'
}
```

**관찰**:
- `sj-template-loader.js`에 `products` 페이지 설정이 정의되어 있음
- 하지만 실제 페이지 파일은 존재하지 않음

### 2.3 API 라우터

**상품 관리 전용 라우터**: 없음

**관찰**:
- `routes/` 디렉토리에 `products.js` 파일이 없음
- `server.js`에서 상품 관련 라우터를 등록하는 코드가 없음
- 상품을 직접 관리하는 API가 구현되어 있지 않음

### 2.4 서비스 레이어

**상품 관리 전용 서비스**: 없음

**관찰**:
- `services/` 디렉토리에 `productService.js` 파일이 없음
- 상품을 직접 관리하는 서비스가 구현되어 있지 않음

---

## 3. 상품이 어떤 데이터로 정의되어 있는지

### 3.1 메뉴 설정 파일의 상품 정의

**위치**: `disk-cms/public/config/menu-config.json`

**데이터 구조**:
- 각 상품은 JSON 객체로 정의됨
- 속성: `id`, `title`, `icon`, `order`, `children`, `page`
- 계층 구조: 최상위 `insurance` → 중간 카테고리 → 개별 상품 → 하위 화면

**예시 (약국배상책임보험)**:
```json
{
  "id": "pharmacy",
  "title": "약국배상책임보험",
  "icon": "fas fa-pills",
  "order": 3,
  "children": [
    {
      "id": "pharmacy-applications",
      "title": "신청리스트",
      "page": "insurance/pharmacy-applications",
      "order": 1
    },
    {
      "id": "pharmacy-claims",
      "title": "클레임",
      "page": "insurance/pharmacy-claims",
      "order": 2
    }
  ]
}
```

**관찰**:
- 상품 정보는 정적 JSON 파일에 저장됨
- 상품명, 아이콘, 순서, 하위 화면 정보 포함
- 상품 코드, 카테고리, 설명 등은 포함되지 않음

### 3.2 데이터베이스 테이블 정의

**products 테이블 필드**:
- `id`: 정수형 기본키
- `name`: 상품명 (VARCHAR(100))
- `code`: 상품코드 (VARCHAR(50), UNIQUE)
- `category`: 상품 카테고리 (VARCHAR(50))
- `description`: 상품 설명 (TEXT)
- `is_active`: 활성화 여부 (TINYINT(1))
- `created_at`: 생성일시 (TIMESTAMP)
- `updated_at`: 수정일시 (TIMESTAMP)

**관찰**:
- 데이터베이스 테이블은 정의되어 있으나, 실제 데이터 저장 여부는 확인 불가
- 테이블 구조는 메뉴 설정 파일보다 더 많은 정보를 담을 수 있도록 설계됨

---

## 4. 상품이 현재 어떤 기능에서 참조되고 있는지

### 4.1 메뉴 로더에서의 참조

**파일**: `disk-cms/public/js/menu-loader.js`

**기능**:
- `menu-config.json` 파일을 로드하여 메뉴 구조 생성
- 상품 정보는 메뉴 표시용으로만 사용됨

**관찰**:
- 상품은 메뉴 렌더링에만 사용됨
- 데이터베이스와의 연동 없음

### 4.2 대시보드 서비스에서의 참조

**파일**: `disk-cms/services/dashboardService.js`

**함수**: `getRecentActivities`

**코드**:
```javascript
const [result] = await pool.execute(`
    SELECT 
        kr.task_type,
        kr.processed_count,
        kr.processing_time,
        kr.work_date,
        kr.quality_grade,
        p.name as product_name,
        p.category as product_category
    FROM kpi_records kr
    LEFT JOIN products p ON kr.product_id = p.id
    WHERE kr.user_id = ?
    ORDER BY kr.work_date DESC, kr.created_at DESC
    LIMIT ${limitNum}
`, [userId]);
```

**관찰**:
- `kpi_records` 테이블과 `products` 테이블을 LEFT JOIN하여 조회
- `kpi_records.product_id`가 NULL일 수 있음 (LEFT JOIN)
- 대시보드의 최근 활동 표시에 사용됨

### 4.3 KPI 관련 테이블에서의 참조

**kpi_records 테이블**:
- `product_id` 컬럼이 `products.id`를 참조
- 사용자별 업무 기록에 상품 정보를 연결

**kpi_summary 테이블**:
- `product_id` 컬럼이 `products.id`를 참조
- 사용자별 업무 집계에 상품 정보를 포함

**관찰**:
- KPI 관련 기능에서만 `products` 테이블이 참조됨
- 다른 기능(계약, 정산, 증권 등)에서는 참조되지 않음

### 4.4 계약, 증권, 정산과의 연결

**관찰**:
- 계약 관련 테이블(`contracts`)에는 `product_id` 컬럼이 없음
- 증권 관련 테이블에서 `products` 테이블을 참조하는 코드가 없음
- 정산 관련 테이블에서 `products` 테이블을 참조하는 코드가 없음
- 각 상품별로 독립된 테이블 구조를 가짐 (예: `pharmacyApply`, `SMSData` 등)

---

## 5. 상품의 구조적 위치

### 5.1 메뉴 설정 파일의 위치

**위치**: `disk-cms/public/config/menu-config.json`

**특징**:
- 정적 JSON 파일
- 애플리케이션 코드와 함께 배포됨
- 런타임에 수정 불가 (코드 재배포 필요)

**구조적 위치**:
- 메뉴 네비게이션을 위한 설정 파일
- 화면 구조 정의용
- 데이터 저장소가 아님

### 5.2 데이터베이스 테이블의 위치

**위치**: `disk-cms/sql.txt`에 정의

**특징**:
- 데이터베이스 스키마 정의 파일에 포함
- 실제 데이터베이스에 테이블이 생성되어 있는지는 확인 불가
- 외래키 관계로 다른 테이블과 연결됨

**구조적 위치**:
- 데이터베이스 레벨의 테이블 정의
- `kpi_records`, `kpi_summary`, `product_managers` 테이블이 참조
- 기준 데이터(Reference Data)로 설계됨

### 5.3 실제 사용 현황

**메뉴 시스템**:
- 메뉴 설정 파일의 상품 정보가 실제로 사용됨
- 사이드바 메뉴 생성에 사용
- 페이지 라우팅에 사용

**KPI 시스템**:
- `products` 테이블이 `kpi_records`, `kpi_summary`에서 참조됨
- 대시보드의 최근 활동 표시에 사용됨
- 데이터베이스 조인이 실제로 수행됨

**관찰**:
- 상품 정보는 두 곳에 정의되어 있음
  1. 메뉴 설정 파일 (`menu-config.json`): 실제 사용 중
  2. 데이터베이스 테이블 (`products`): 일부 기능에서만 참조
- 두 정의는 서로 독립적이며 동기화 메커니즘 없음

### 5.4 기준 데이터 vs 관리 데이터

**메뉴 설정 파일**:
- 구조: 정적 설정 파일
- 수정 방법: 코드 수정 및 재배포
- 이력 관리: Git 버전 관리
- 위치: 애플리케이션 설정 레벨

**데이터베이스 테이블**:
- 구조: 관계형 데이터베이스 테이블
- 수정 방법: SQL 쿼리 또는 관리 화면 (없음)
- 이력 관리: `created_at`, `updated_at` 필드 존재
- 위치: 데이터 레벨

**관찰**:
- 메뉴 설정 파일의 상품: **설정 데이터** (Configuration Data)
  - 애플리케이션 설정의 일부
  - 코드와 함께 관리됨
  - 런타임 변경 불가

- 데이터베이스 테이블의 상품: **기준 데이터** (Reference Data)
  - 다른 테이블의 외래키로 참조됨
  - 데이터베이스에 저장됨
  - 런타임 변경 가능 (관리 화면이 없는 상태)

**현재 상태**:
- 상품은 메뉴 설정 파일에서 **설정 데이터**로 관리됨
- 상품은 데이터베이스 테이블에서 **기준 데이터**로 정의되어 있으나, 대부분의 기능에서는 사용되지 않음
- KPI 관련 기능에서만 데이터베이스의 `products` 테이블이 참조됨

---

## 요약

### 상품의 현재 위치

1. **메뉴 설정 파일** (`menu-config.json`)
   - 실제로 사용되는 상품 정의
   - 메뉴 네비게이션에 사용
   - 설정 데이터로 관리

2. **데이터베이스 테이블** (`products`)
   - 정의는 되어 있으나 대부분의 기능에서 미사용
   - KPI 관련 기능에서만 참조됨
   - 기준 데이터로 설계되었으나 활용도 낮음

3. **화면/API**
   - 상품 관리 전용 화면 없음
   - 상품 관리 전용 API 없음
   - 상품 정보는 메뉴 표시 및 KPI 기능에서만 사용

### 상품과 다른 기능의 연결

- **계약**: 연결 없음
- **증권**: 연결 없음
- **정산**: 연결 없음
- **KPI**: `kpi_records`, `kpi_summary` 테이블을 통해 연결됨
- **메뉴**: 메뉴 설정 파일을 통해 연결됨

