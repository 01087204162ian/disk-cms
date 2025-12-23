# 약국배상책임보험 아키텍처 - 프록시 구조 상세

**작성일**: 2025-01-XX

---

## 📋 목차

1. [프록시 구조 개요](#프록시-구조-개요)
2. [통신 흐름](#통신-흐름)
3. [프록시의 역할](#프록시의-역할)
4. [실제 코드 예시](#실제-코드-예시)
5. [프록시를 사용하는 이유](#프록시를-사용하는-이유)

---

## 프록시 구조 개요

### 3계층 아키텍처

```
┌─────────────────┐
│  프론트엔드      │
│  (HTML/JS)      │
│  disk-cms.simg.kr│
└────────┬────────┘
         │ HTTP 요청
         │ /api/pharmacy/list
         ↓
┌─────────────────┐
│  Node.js 프록시  │
│  (Express)      │
│  routes/pharmacy.js│
└────────┬────────┘
         │ Axios HTTP 요청
         │ https://imet.kr/api/pharmacy/pharmacy-list.php
         ↓
┌─────────────────┐
│  PHP 백엔드 API  │
│  (PDO/MySQL)    │
│  imet.kr        │
└────────┬────────┘
         │ SQL 쿼리
         ↓
┌─────────────────┐
│  MySQL DB       │
└─────────────────┘
```

---

## 통신 흐름

### 1. 프론트엔드 → Node.js 프록시

**프론트엔드 코드** (`pharmacy.js`):
```javascript
// 프론트엔드에서 Node.js 프록시 호출
const response = await fetch('/api/pharmacy/list?page=1&limit=20', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  credentials: 'include'  // 세션 쿠키 포함
});
```

**요청 URL**: `https://disk-cms.simg.kr/api/pharmacy/list`

---

### 2. Node.js 프록시 → PHP 백엔드

**Node.js 프록시 코드** (`routes/pharmacy.js`):
```javascript
router.get('/list', async (req, res) => {
    try {
        // PHP 백엔드 API URL
        const apiUrl = 'https://imet.kr/api/pharmacy/pharmacy-list.php';
        const params = req.query;  // 프론트엔드에서 받은 쿼리 파라미터
        
        // Axios로 PHP API 호출
        const response = await axios.get(apiUrl, {
            params: params,  // page=1&limit=20 전달
            timeout: 15000,
            headers: {
                'User-Agent': 'disk-cms-proxy/1.0',
                'Accept': 'application/json',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });
        
        // PHP 응답을 그대로 프론트엔드에 전달
        res.json(response.data);
        
    } catch (error) {
        // 에러 처리
        console.error('Pharmacy API 프록시 오류:', error.message);
        res.status(500).json({
            success: false,
            error: 'API 서버 오류',
            details: error.message
        });
    }
});
```

**실제 호출되는 PHP URL**: 
```
https://imet.kr/api/pharmacy/pharmacy-list.php?page=1&limit=20
```

---

### 3. PHP 백엔드 → MySQL

**PHP 코드** (`pharmacy-list.php`):
```php
<?php
header('Content-Type: application/json; charset=utf-8');

// 데이터베이스 연결
$pdo = new PDO("mysql:host=localhost;dbname=pharmacy_db", $user, $pass);

// 쿼리 파라미터 받기
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

// SQL 쿼리 실행
$stmt = $pdo->prepare("SELECT * FROM pharmacy_table LIMIT :limit OFFSET :offset");
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', ($page - 1) * $limit, PDO::PARAM_INT);
$stmt->execute();

$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// JSON 응답
echo json_encode([
    'success' => true,
    'data' => $data,
    'pagination' => [
        'total_count' => 100,
        'current_page' => $page,
        'total_pages' => 5
    ]
]);
?>
```

---

## 프록시의 역할

### 1. 요청 전달 (Request Forwarding)

**역할**: 프론트엔드 요청을 PHP 백엔드로 전달

```javascript
// 프론트엔드 요청 파라미터를 그대로 PHP로 전달
const params = req.query;  // { page: 1, limit: 20, search: '약국명' }
const response = await axios.get(phpApiUrl, { params });
```

---

### 2. 응답 전달 (Response Forwarding)

**역할**: PHP 응답을 그대로 프론트엔드에 전달

```javascript
// PHP 응답을 그대로 프론트엔드에 전달
res.json(response.data);
```

---

### 3. 에러 처리 (Error Handling)

**역할**: PHP API 오류를 적절히 처리하고 프론트엔드에 전달

```javascript
catch (error) {
    if (error.response) {
        // PHP에서 오류 응답을 받은 경우
        res.status(error.response.status).json({
            success: false,
            error: 'API 서버 오류',
            details: error.response.data
        });
    } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        res.status(503).json({
            success: false,
            error: 'API 서버에 연결할 수 없습니다'
        });
    } else {
        // 기타 오류
        res.status(500).json({
            success: false,
            error: '프록시 서버 내부 오류'
        });
    }
}
```

---

### 4. 로깅 (Logging)

**역할**: 모든 API 요청을 로깅

```javascript
console.log('Pharmacy API 호출:', apiUrl);
console.log('파라미터:', params);
console.log(`약국 데이터 조회 성공: ${dataCount}건`);
```

---

### 5. 인증/권한 체크 (Authentication/Authorization)

**역할**: 세션 기반 인증 체크 (선택적)

```javascript
// 관리자 기능의 경우
const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      error: '로그인이 필요합니다.'
    });
  }
  next();
};

router.get('/api-keys', requireAuth, async (req, res) => {
  // 인증된 사용자만 접근 가능
});
```

---

### 6. 데이터 변환/가공 (Data Transformation)

**역할**: 필요시 데이터 변환 (현재는 거의 사용하지 않음)

```javascript
// 예시: PHP 응답 데이터를 프론트엔드 형식에 맞게 변환
const transformedData = response.data.map(item => ({
  id: item.num,
  name: item.company,
  status: getStatusText(item.status)
}));
```

---

## 실제 코드 예시

### 예시 1: 약국 목록 조회

**프론트엔드**:
```javascript
// pharmacy.js
fetch('/api/pharmacy/list?page=1&limit=20&status=13')
```

**Node.js 프록시**:
```javascript
// routes/pharmacy.js
router.get('/list', async (req, res) => {
    const apiUrl = 'https://imet.kr/api/pharmacy/pharmacy-list.php';
    const response = await axios.get(apiUrl, { params: req.query });
    res.json(response.data);
});
```

**PHP 백엔드**:
```php
// 프로덕션: imet.kr/api/pharmacy/pharmacy-list.php
// 로컬 개발: imet/api/pharmacy/pharmacy-list.php
$page = $_GET['page'];
$limit = $_GET['limit'];
$status = $_GET['status'];
// ... SQL 쿼리 실행
echo json_encode($result);
```

---

### 예시 2: 약국 상세 정보 조회

**프론트엔드**:
```javascript
// pharmacy_company_modal.js
fetch(`/api/pharmacy/id-detail/${pharmacyNum}`)
```

**Node.js 프록시**:
```javascript
// routes/pharmacy.js
router.get('/id-detail/:num', async (req, res) => {
    const { num } = req.params;
    const response = await axios.get(
        `https://imet.kr/api/pharmacy/pharmacyApply-num-detail.php`,
        { params: { num } }
    );
    res.json(response.data);
});
```

**PHP 백엔드**:
```php
// 프로덕션: imet.kr/api/pharmacy/pharmacyApply-num-detail.php
// 로컬 개발: imet/api/pharmacy/pharmacyApply-num-detail.php
$num = $_GET['num'];
// ... SQL 쿼리 실행
echo json_encode($result);
```

---

### 예시 3: 약국 정보 수정

**프론트엔드**:
```javascript
// pharmacy_company_modal.js
fetch(`/api/pharmacy/id-update/${pharmacyNum}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company: '새 약국명', chemist: 5 })
})
```

**Node.js 프록시**:
```javascript
// routes/pharmacy.js
router.put('/id-update/:num', async (req, res) => {
    const { num } = req.params;
    const response = await axios.put(
        `https://imet.kr/api/pharmacy/pharmacyApply-num-update.php?num=${num}`,
        req.body
    );
    res.json(response.data);
});
```

**PHP 백엔드**:
```php
// 프로덕션: imet.kr/api/pharmacy/pharmacyApply-num-update.php
// 로컬 개발: imet/api/pharmacy/pharmacyApply-num-update.php
$num = $_GET['num'];
$data = json_decode(file_get_contents('php://input'), true);
// ... SQL UPDATE 쿼리 실행
echo json_encode(['success' => true]);
```

---

## 프록시를 사용하는 이유

### 1. CORS 문제 해결

**문제**: 프론트엔드에서 직접 PHP API를 호출하면 CORS 오류 발생

**해결**: Node.js 프록시를 통해 같은 도메인에서 요청하므로 CORS 문제 없음

```
❌ 프론트엔드 (disk-cms.simg.kr) → PHP (imet.kr)  // CORS 오류!
✅ 프론트엔드 (disk-cms.simg.kr) → Node.js (disk-cms.simg.kr) → PHP (imet.kr)  // OK!
```

---

### 2. 세션 관리

**이점**: Node.js에서 세션 기반 인증을 관리하고, PHP API 호출 시 필요한 인증 정보를 추가

```javascript
// Node.js에서 세션 확인 후 PHP API 호출
if (!req.session?.user) {
    return res.status(401).json({ error: '로그인 필요' });
}

// PHP API 호출 시 인증 토큰 추가
const response = await axios.get(phpApiUrl, {
    headers: {
        'Authorization': `Bearer ${req.session.user.token}`
    }
});
```

---

### 3. 에러 처리 통일

**이점**: PHP API의 다양한 에러를 Node.js에서 통일된 형식으로 변환

```javascript
catch (error) {
    // PHP 에러를 통일된 형식으로 변환
    res.status(500).json({
        success: false,
        error: '서버 오류',
        details: error.message
    });
}
```

---

### 4. 로깅 및 모니터링

**이점**: 모든 API 요청을 중앙에서 로깅

```javascript
console.log('Pharmacy API 호출:', apiUrl);
console.log('파라미터:', params);
console.log('응답 시간:', Date.now() - startTime);
```

---

### 5. 요청/응답 변환

**이점**: 필요시 데이터 형식 변환

```javascript
// PHP 응답을 프론트엔드 형식에 맞게 변환
const transformedData = {
    items: response.data,
    total: response.pagination.total_count,
    page: response.pagination.current_page
};
```

---

### 6. 캐싱 (향후 구현 가능)

**이점**: 자주 조회되는 데이터를 Node.js에서 캐싱

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5분

if (cache.has(cacheKey) && Date.now() - cache.get(cacheKey).timestamp < CACHE_TTL) {
    return res.json(cache.get(cacheKey).data);
}
```

---

## 서버 등록 구조

### server.js에서 라우터 등록

```javascript
// server.js
const pharmacyRoutes = require('./routes/pharmacy');
const pharmacy2Routes = require('./routes/pharmacy/pharmacy2');
const pharmacyAdminRoutes = require('./routes/pharmacy/admin');
const pharmacyDepositsRoutes = require('./routes/pharmacy/deposits');
const pharmacyReportsRoutes = require('./routes/pharmacy/reports');

// 라우터 등록
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/pharmacy2', pharmacy2Routes);
app.use('/api/pharmacy-admin', pharmacyAdminRoutes);
app.use('/api/pharmacy-deposits', pharmacyDepositsRoutes);
app.use('/api/pharmacy-reports', pharmacyReportsRoutes);
```

---

## PHP 백엔드 서버

### 서버 정보

| 서버 | 프로덕션 URL | 로컬 개발 경로 | 용도 |
|------|------------|--------------|------|
| **imet.kr** | `https://imet.kr/api/pharmacy/*` | `imet/api/pharmacy/*` | 약국배상책임보험 API |
| **silbo.kr** | `https://silbo.kr/api/pharmacy/*` | `silbo/api/pharmacy/*` (추정) | 대체 서버 (백업) |

### PHP API 파일 위치

**프로덕션 서버**:
```
https://imet.kr/api/pharmacy/pharmacy-list.php
https://imet.kr/api/pharmacy/pharmacy-accounts.php
https://imet.kr/api/pharmacy/pharmacyApply-num-detail.php
https://imet.kr/api/pharmacy/pharmacy-id-list.php
https://imet.kr/api/pharmacy/pharmacy-deposit-balance.php
```

**로컬 개발 환경**:
```
d:\development\imet\api\pharmacy\pharmacy-list.php
d:\development\imet\api\pharmacy\pharmacy-accounts.php
d:\development\imet\api\pharmacy\pharmacyApply-num-detail.php
d:\development\imet\api\pharmacy\pharmacy-id-list.php
d:\development\imet\api\pharmacy\pharmacy-deposit-balance.php
```

**중요**: 
- 로컬 개발 시 PHP 파일은 `imet/api/pharmacy/` 폴더에 작성합니다
- 프로덕션 배포 시 `imet.kr/api/pharmacy/` 경로로 업로드합니다
- Node.js 프록시는 항상 프로덕션 URL(`https://imet.kr/api/pharmacy/*`)을 호출합니다

---

## 요약

### 프록시 구조의 핵심

1. **프론트엔드**는 Node.js 프록시만 호출 (`/api/pharmacy/*`)
2. **Node.js 프록시**는 PHP 백엔드를 호출 (`https://imet.kr/api/pharmacy/*`)
3. **PHP 백엔드**는 MySQL 데이터베이스에 접근
4. **응답**은 역순으로 전달 (MySQL → PHP → Node.js → 프론트엔드)

### 프록시의 주요 역할

- ✅ 요청/응답 전달
- ✅ 에러 처리
- ✅ 로깅
- ✅ 인증/권한 체크
- ✅ CORS 문제 해결
- ✅ 데이터 변환 (필요시)

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

