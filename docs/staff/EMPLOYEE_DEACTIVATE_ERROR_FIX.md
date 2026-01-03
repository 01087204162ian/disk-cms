# 직원 비활성화 403 에러 해결 가이드

**작성일**: 2026-01-XX  
**문제**: 직원 상세정보 모달에서 비활성화 버튼 클릭 시 403 Forbidden 에러 발생

---

## 🔍 문제 분석

### 에러 메시지
```
PATCH https://disk-cms.simg.kr/api/staff/employees/hm@simg.kr/deactivate 403 (Forbidden)
```

### 원인

비활성화 API는 **SUPER_ADMIN** 또는 **SYSTEM_ADMIN** 권한만 허용합니다.

```javascript:routes/staff/employees.js
// 계정 비활성화 API
router.patch('/employees/:email/deactivate', requireAuth, requireAdmin, async (req, res) => {
    // 권한 확인 (SUPER_ADMIN, SYSTEM_ADMIN만 가능)
    if (!['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(req.session.user.role)) {
        return res.status(403).json({
            success: false,
            message: '계정 비활성화 권한이 없습니다.'
        });
    }
    // ...
});
```

---

## ✅ 해결 방법

### 방법 1: 권한 확인 (권장)

현재 로그인한 사용자의 권한을 확인하세요:

1. **현재 사용자 권한 확인**
   - 브라우저 개발자 도구(F12) → Console
   - 다음 코드 실행:
     ```javascript
     fetch('/api/auth/me', { credentials: 'include' })
       .then(r => r.json())
       .then(data => console.log('현재 권한:', data.data?.role))
     ```

2. **권한이 SUPER_ADMIN 또는 SYSTEM_ADMIN인지 확인**
   - 권한이 다른 경우(예: DEPT_MANAGER, EMPLOYEE) 비활성화 기능을 사용할 수 없습니다.

### 방법 2: SUPER_ADMIN 계정으로 로그인

비활성화가 필요한 경우:

1. **SUPER_ADMIN 권한을 가진 계정으로 로그인**
2. **직원 리스트 페이지 접근**
3. **비활성화할 직원의 상세보기 모달 열기**
4. **비활성화 버튼 클릭**

---

## 🔐 권한 체계

### 비활성화 권한

| 권한 | 비활성화 가능 |
|------|---------------|
| SUPER_ADMIN | ✅ 가능 |
| SYSTEM_ADMIN | ✅ 가능 |
| DEPT_MANAGER | ❌ 불가능 |
| EMPLOYEE | ❌ 불가능 |

### 기타 권한별 기능

| 기능 | SUPER_ADMIN | SYSTEM_ADMIN | DEPT_MANAGER |
|------|-------------|--------------|--------------|
| 직원 목록 조회 | ✅ | ✅ | ✅ (본인 부서만) |
| 직원 상세 조회 | ✅ | ✅ | ✅ (본인 부서만) |
| 직원 승인 | ✅ | ✅ | ✅ (본인 부서만) |
| 직원 비활성화 | ✅ | ✅ | ❌ |
| 직원 재활성화 | ✅ | ❌ | ❌ |

---

## 💡 권한 개선 제안 (선택사항)

만약 DEPT_MANAGER도 본인 부서 직원을 비활성화할 수 있도록 하고 싶다면:

### 코드 수정 예시

```javascript:routes/staff/employees.js
// 권한 확인 수정
if (req.session.user.role === 'DEPT_MANAGER') {
    // DEPT_MANAGER는 본인 부서 직원만 비활성화 가능
    const [targetUser] = await pool.execute(
        'SELECT department_id FROM users WHERE email = ?',
        [email]
    );
    
    if (targetUser[0].department_id !== req.session.user.department_id) {
        return res.status(403).json({
            success: false,
            message: '본인 부서 직원만 비활성화할 수 있습니다.'
        });
    }
} else if (!['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(req.session.user.role)) {
    return res.status(403).json({
        success: false,
        message: '계정 비활성화 권한이 없습니다.'
    });
}
```

---

## 📝 참고사항

### 자기 자신 비활성화 불가

API는 자기 자신의 계정을 비활성화하는 것을 방지합니다:

```javascript
// 자기 자신은 비활성화할 수 없음
if (email === req.session.user.email) {
    return res.status(400).json({
        success: false,
        message: '자신의 계정은 비활성화할 수 없습니다.'
    });
}
```

### 활성 상태 확인

비활성화는 활성 상태(`is_active = 1`)인 계정만 가능합니다:

- 승인대기(`is_active = 0`): 비활성화 불가
- 활성(`is_active = 1`): 비활성화 가능 ✅
- 비활성(`is_active = 2`): 이미 비활성화됨

---

## 🔄 관련 파일

- **API**: `routes/staff/employees.js` (557-646줄)
- **프론트엔드**: `public/js/staff/employee-modal.js` (44-76줄)

---

**작성일**: 2026-01-XX  
**작성자**: AI Assistant  
**버전**: 1.0

