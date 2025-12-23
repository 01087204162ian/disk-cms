# 약국배상책임보험 메모 저장 문제 분석

**작성일**: 2025-01-XX  
**문제**: 메모 입력 후 새로고침 시 메모 내용이 저장되지 않고 사라짐

---

## 📋 문제 상황

### 증상
1. 모달에서 메모 입력
2. Enter 키로 저장 (토스트 메시지 표시됨)
3. 새로고침 후 모달 다시 열기
4. **메모 내용이 사라짐** ❌

---

## 🔍 코드 분석

### 1. 메모 저장 API (`pharmacy-memo-update.php`)

**현재 구현**:
```php
// SQL 빌드
$safeMemo = escapeData($memo); // db.php 내 escapeData 가정
$setParts = ["memo = '{$safeMemo}'"];

$sql = "UPDATE pharmacyApply SET " . implode(', ', $setParts) . " WHERE num = {$pharmacyId}";

$result = executeQuery($sql); // db.php 내 executeQuery 가정
if (!$result) {
    throw new Exception('업데이트 실패');
}
```

**문제점**:
1. ❌ **SQL 인젝션 취약점**: `$pharmacyId`를 직접 사용 (intval로 변환하지만 안전하지 않음)
2. ❌ **에러 처리 부족**: `executeQuery` 실패 시 상세 에러 정보 없음
3. ❌ **트랜잭션 없음**: DB 업데이트 실패 시 롤백 없음

---

### 2. 메모 조회 API (`pharmacyApply-num-detail.php`)

**현재 구현**:
```php
$sql = "SELECT 
    ...
    pa.memo,
    ...
FROM pharmacyApply pa
WHERE pa.num = " . $num;
```

**확인 사항**:
- ✅ `memo` 필드가 SELECT 쿼리에 포함되어 있음
- ✅ 조회 시 memo 데이터가 포함되어야 함

---

## 🐛 가능한 원인

### 원인 1: SQL 이스케이프 문제

**문제 코드**:
```php
$safeMemo = escapeData($memo);
$setParts = ["memo = '{$safeMemo}'"];
```

**문제점**:
- `escapeData` 함수가 제대로 작동하지 않을 수 있음
- 특수 문자(작은따옴표, 백슬래시 등) 처리 문제
- 멀티바이트 문자 인코딩 문제

**해결 방법**:
- Prepared Statement 사용 (권장)
- 또는 `mysqli_real_escape_string` 직접 사용

---

### 원인 2: DB 업데이트 실패

**문제 코드**:
```php
$result = executeQuery($sql);
if (!$result) {
    throw new Exception('업데이트 실패');
}
```

**문제점**:
- `executeQuery` 실패 시 상세 에러 정보 없음
- 실제 DB 에러 메시지를 확인할 수 없음

**해결 방법**:
- `mysqli_error()` 사용하여 상세 에러 확인
- 에러 로깅 추가

---

### 원인 3: 프론트엔드 API 호출 실패

**문제 코드**:
```javascript
fetch(`/api/pharmacy2/${pharmacyId}/memo`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ memo: memoValue })
})
.then(res => res.json())
.then(resp => {
  if (resp.success) {
    window.sjTemplateLoader.showToast("메모가 저장되었습니다.", "success");
  }
})
```

**문제점**:
- API 호출 실패 시에도 토스트 메시지가 표시될 수 있음
- 네트워크 오류 시 처리 부족

**해결 방법**:
- `response.ok` 체크 추가
- 에러 처리 강화

---

## 🔧 해결 방법

### 방법 1: Prepared Statement 사용 (권장)

**수정 코드** (`pharmacy-memo-update.php`):
```php
// Prepared Statement 사용
$connection = getDBConnection();
$stmt = mysqli_prepare($connection, "UPDATE pharmacyApply SET memo = ? WHERE num = ?");

if (!$stmt) {
    throw new Exception('Prepared statement 실패: ' . mysqli_error($connection));
}

mysqli_stmt_bind_param($stmt, "si", $memo, $pharmacyId);
$result = mysqli_stmt_execute($stmt);

if (!$result) {
    throw new Exception('업데이트 실패: ' . mysqli_stmt_error($stmt));
}

mysqli_stmt_close($stmt);
```

---

### 방법 2: 에러 로깅 추가

**수정 코드**:
```php
$result = executeQuery($sql);
if (!$result) {
    $connection = getDBConnection();
    $error = mysqli_error($connection);
    error_log("메모 업데이트 실패 - SQL: {$sql}, Error: {$error}");
    throw new Exception('업데이트 실패: ' . $error);
}
```

---

### 방법 3: 프론트엔드 에러 처리 강화

**수정 코드** (`pharmacy.js`):
```javascript
fetch(`/api/pharmacy2/${pharmacyId}/memo`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ memo: memoValue })
})
.then(res => {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
})
.then(resp => {
  if (resp.success) {
    window.sjTemplateLoader.showToast("메모가 저장되었습니다.", "success");
  } else {
    window.sjTemplateLoader.showToast(resp.error || "메모 저장 실패", "error");
  }
})
.catch(err => {
  console.error("메모 저장 오류:", err);
  window.sjTemplateLoader.showToast("서버 통신 오류: " + err.message, "error");
});
```

---

## 🧪 테스트 방법

### 1. DB 직접 확인
```sql
-- 메모 저장 전
SELECT num, memo FROM pharmacyApply WHERE num = [약국번호];

-- 메모 저장 후 (프론트엔드에서 저장 실행)
SELECT num, memo FROM pharmacyApply WHERE num = [약국번호];
```

### 2. PHP 에러 로그 확인
```bash
# imet/api/pharmacy/error.log 파일 확인
tail -f imet/api/pharmacy/error.log
```

### 3. 브라우저 개발자 도구 확인
- Network 탭에서 `/api/pharmacy2/:pharmacyId/memo` 요청 확인
- Response 확인
- Console 탭에서 에러 메시지 확인

---

## 📝 체크리스트

### 저장 확인
- [ ] API 호출이 성공하는가? (Network 탭 확인)
- [ ] 응답에 `success: true`가 포함되는가?
- [ ] DB에 실제로 저장되는가? (SQL 직접 확인)

### 조회 확인
- [ ] 모달 열 때 API 호출이 성공하는가?
- [ ] 응답에 `memo` 필드가 포함되는가?
- [ ] `memo` 필드 값이 올바른가?

### 에러 확인
- [ ] PHP 에러 로그에 에러가 있는가?
- [ ] 브라우저 Console에 에러가 있는가?
- [ ] Network 탭에서 4xx/5xx 에러가 있는가?

---

## 🚨 즉시 확인 사항

### 1. DB 테이블 구조 확인
```sql
DESCRIBE pharmacyApply;
-- memo 컬럼이 존재하는지 확인
-- memo 컬럼 타입 확인 (VARCHAR, TEXT 등)
```

### 2. 실제 저장 여부 확인
```sql
-- 메모 저장 전후 비교
SELECT num, memo, wdate FROM pharmacyApply WHERE num = [약국번호];
```

### 3. PHP 에러 로그 확인
```bash
# 최근 에러 확인
tail -n 50 imet/api/pharmacy/error.log
```

---

## 💡 권장 수정 사항

### 1. Prepared Statement 사용
- SQL 인젝션 방지
- 특수 문자 처리 안전

### 2. 에러 로깅 강화
- 상세 에러 메시지 기록
- 디버깅 용이

### 3. 트랜잭션 사용
- 데이터 일관성 보장
- 롤백 가능

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX

