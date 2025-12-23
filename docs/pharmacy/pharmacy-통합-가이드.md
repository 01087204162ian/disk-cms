# 약국배상책임보험 통합 가이드 (All-in-One)

**작성일**: 2025-01-XX  
**대상**: 약국배상책임보험 관리자/신청/프록시/API 전반

---

## 1. 개요
- 관리 어드민(`disk-cms`) + PHP 백엔드(`imet/api/pharmacy`) + 고객사 어드민(`imet/hi/v2/`) + 신청 시스템(`imet/drugstore/`) + HMAC API v2(`imet/hi/api/*_v2.php`).
- 멀티테넌트: `account`/`directory`로 거래처 분리, 같은 DB 테이블 공유.
- 개발 원칙: 프론트는 Node 프록시 경유, PHP는 Prepared Statement/입력 검증, HMAC 인증은 v2 전용.

---

## 2. 아키텍처 한눈에
- **Frontend (disk-cms)**: `public/pages/pharmacy/`, `public/js/pharmacy/`  
  Node 프록시 → PHP API → MySQL
- **Node 프록시**: `routes/pharmacy.js`, `routes/pharmacy/pharmacy2.js` 등. 역할: PHP 호출 래핑, CORS/로그/에러 표준화, 파일 스트리밍(증권).
- **PHP 백엔드**: `imet/api/pharmacy/*.php` – 목록, 상세, 상태 변경, 보험료 계산, 증권/설계번호, 메모 등.
- **고객사 어드민**: `imet/hi/v2/` – 거래처 전용 뷰, HMAC 인증.
- **신청 시스템**: `imet/drugstore/` – 약사/영업사원 신청, 실시간 보험료 계산.

---

## 3. 인증
- **관리자(신규 어드민)**: 세션(프론트) + Node 프록시에서 추가 검증.
- **고객사 어드민 v2 / 외부 연동**: HMAC-SHA256  
  - 헤더: `Authorization: Bearer {api_key}`, `X-Timestamp`, `X-Signature`  
  - 서명 문자열: `{METHOD}\n{PATH}\n{TIMESTAMP}\n{BODY_HASH}` (BODY_HASH=sha256(JSON 문자열))
  - 타임스탬프 허용 오차: ±5분
- **주요 보안 규칙**: HTTPS, Prepared Statement, 입력 검증, 페이지 크기/본체 크기 제한, 오류 메시지 표준화.

---

## 4. 상태 코드 (공통)
```
1: 신규 | 6: 계약완료 | 7: 보류 | 10: 메일보냄 | 13: 승인
14: 증권발송 | 15: 해지요청중 | 16: 해지완료됨 | 17: 설계중
```

---

## 5. 주요 기능 맵
- 목록/검색/필터/페이지네이션 (관리자·고객사 어드민)
- 상세 보기 + 메모
- 보험료 계산 (전문인/화재, 면적 80㎡ 미만 → 80㎡ 처리)
- 상태 변경: 승인/보류/해지 + 예치금 차감·환급 + 정산 기록
- 설계번호/증권번호 입력 → 상태 자동 반영, 리스트 갱신
- 증권 보기: Node 프록시가 파일 스트림/리다이렉트
- 보험료 검증: DB vs 재계산 비교 API
- 갱신 프로세스(기획): 만료 45일 전 자동 갱신 청약 INSERT 후 승인 플로우 재사용

---

## 6. 파일/폴더 역할 (요약)
- **프론트 (관리자)**: `disk-cms/public/js/pharmacy/pharmacy.js` – 테이블/카드 렌더, 날짜 포맷, 상태 변경, 설계/증권 저장, 페이지 상태 저장(localStorage), 보험료 검증, 증권 열람.
- **Node 프록시**:  
  - `routes/pharmacy.js` – 목록/상세/파일/증권/보험료 검증 등 메인 라우터  
  - `routes/pharmacy/pharmacy2.js` – 메모, 보험료 계산, 설계/증권번호 저장 등
- **PHP (주요)**:  
  - `pharmacy-list.php` – request_date/approval_date 포함 목록  
  - `pharmacy-memo-update.php` – Prepared Statement  
  - `pharmacy-status-update.php` – 승인 재계산, 환급 시 80㎡ 보정, account별 테이블 사용  
  - `pharmacy-premium-calculate*.php` – 면적 80㎡ 최소, ubcare 테이블 분기  
  - `pharmacy-premium-verify.php` – DB vs 재계산 검증, ubcare 테이블 분기  
  - `pharmacy-design-update.php`, `pharmacy-certificate-update.php`
- **고객사 어드민**: `imet/hi/v2/` (HMAC 인증, 리스트/상세/예치/일별·월별 실적 뷰)
- **신청 시스템**: `imet/drugstore/` (pharmacy/ubcare 폴더, 보험료 계산 API `api/calculate.php`, 신청 `api/submit.php`, `ubcareSubmit.php`)

---

## 7. API v2 (HMAC) 핵심 엔드포인트
Base: `https://imet.kr`

| 용도 | 엔드포인트 | 방식 | 비고 |
|------|------------|------|------|
| 리스트 | `/hi/api/list_v2.php` | POST | 상태/검색/기간/페이징 |
| 상세 | `/hi/api/detail_v2.php` | POST | item_num |
| 상태변경 | `/hi/api/pharmacy-status-update_v2.php` | POST | 승인·보류·해지 로직 포함 |
| 정보수정 | `/hi/api/pharmacyApply-num-update_v2.php` | POST | 승인 상태는 email/phone/memo 위주 |
| 보험료 계산 | `/hi/api/pharmacy-premium-calculate_v2.php` | POST | 승인 상태면 배서 처리 |
| 잔고 | `/hi/api/balance_v2.php` | POST | 예치금 잔액 |
| 예치금 내역 | `/hi/api/deposit_balance_v2.php` | POST | 페이징 |
| 일별 실적 | `/hi/api/daily_stats_v2.php` | POST | 월별/최근30일 |
| 월별 실적 | `/hi/api/monthly_stats_v2.php` | POST | 3개년 역순 |

요청 공통 헤더: HMAC 헤더 3종 + `Content-Type: application/json`  
응답 공통: `{ success, message, data, error?, details?, timestamp }`

---

## 8. 프론트엔드 핵심 포인트 (disk-cms)
- 날짜 포맷: `YYYY-MM-DD HH:mm:ss` (이미 포맷된 문자열은 그대로 표시)
- 페이지 상태 유지: `localStorage` (page, size, search, status, account)
- 설계/증권 입력 후: 상태 변동 시 행 제거 또는 리스트 리프레시
- 보험료 검증 버튼: DB vs 계산값 비교 (디버그용)
- 증권 보기: `/api/pharmacy/certificate/:pharmacyId/:certificateType` 프록시 호출

---

## 9. 로컬/배포 파일 생성 가이드 (요약)
- **PHP**: `imet/api/pharmacy/` 에 생성, 배포 시 동일 경로 업로드. 파일 상단에 경로/파일명 주석.
- **Node 프록시**: `disk-cms/routes/pharmacy/` 또는 `routes/pharmacy.js`
- **프론트**: `disk-cms/public/pages/pharmacy/`, JS는 `public/js/pharmacy/`
- 프로덕션 호출은 항상 `https://imet.kr/api/pharmacy/...` (프록시 내부에서)

---

## 10. 갱신 프로세스(기획 요약)
1) 만료 45일 전 조회 → 조회 시 자동 갱신 청약 INSERT (renewal='2', previousCertiNum 링크)  
2) 거래처가 승인하면 기존 승인 플로우 재사용(보험료 계산, 예치금 차감, 증권)  
3) 기존 계약과 갱신 계약 연결 필드 유지  
불필요 단계(안내 메일/신청 수집)는 제외.

---

## 11. 테스트/계정 정보
- 테스트 API 키·계정은 보안상 별도 관리 문서를 참조하거나 운영자에게 요청하세요. (기존 `apikey.md`에 저장)

---

## 12. 참고 문서 (원본)
- `pharmacy-시스템-개요.md`
- `pharmacy-아키텍처-프록시구조.md`
- `pharmacy-API-엔드포인트.md`
- `pharmacy-프론트엔드-개발가이드.md`
- `pharmacy-주요기능-상세.md`
- `pharmacy-파일-생성-가이드.md`
- `pharmacy-고객사-어드민-시스템.md`
- `pharmacy-신청-시스템.md`
- `pharmacy-갱신-프로세스-기획.md`
- `pharmacy-API-연동-가이드.md`

이 문서는 위 문서들의 핵심만 통합한 요약본입니다. 세부 필드/파라미터는 각 원본을 참고하세요.

