프로젝트 현황 종합 정리
환경 및 현재 상태

서버: Node.js 기반 보험 CMS
작업 위치: /home/simg/disk-cms/public/
기존 기술: AdminLTE + jQuery + Bootstrap 4

현재 파일 구조
public/
├── template/
│   └── page-template.html      # 기본 템플릿
├── components/
│   ├── header.html             # 헤더 컴포넌트
│   ├── sidebar.html            # 사이드바 컴포넌트  
│   └── footer.html             # 푸터 컴포넌트
├── js/
│   ├── template-loader.js      # 컴포넌트 로딩 담당
│   └── [카테고리별 폴더 예정]
├── pages/
│   └── [카테고리별 폴더 예정]
└── 기타 파일들
향후 파일 구조 계획
pages/pharmacy/              # 약국배상책임보험 페이지들
js/pharmacy/                 # 약국배상책임보험 JS 파일들
현대화 목표

UI 프레임워크: Tabler (Bootstrap 5 기반) 적용
JavaScript: jQuery 완전 제거, 바닐라 JS만 사용
템플릿 시스템: page-template.html + template-loader.js 활용
메뉴 관리: 별도 설정 파일로 중앙 관리
페이지 의존성: 새 페이지가 메뉴 구조와 자동 연동
컴포넌트: 기존 3개 파일(header, sidebar, footer) 유지하되 현대화

다음 작업 단계
현재 5개 핵심 파일 내용 분석 필요:

template/page-template.html
js/template-loader.js
components/header.html
components/sidebar.html
components/footer.html

이 파일들을 제공받아 Tabler 기반으로 현대화 진행 예정입니다.

약국 상세 모달 전체 흐름 정리
1. 트리거 단계
테이블/카드의 번호 버튼 클릭 
→ data-num 속성에서 약국 번호 추출 
→ showDetailModal(num) 함수 호출
2. 모달 표시 및 데이터 로드
showDetailModal(num) 실행:
1. 모달 창 열기 (#pharmacyDetailModal)
2. 로딩 화면 표시, 폼/에러 숨김
3. API 호출: GET /api/pharmacy/id-detail/${num}
4. 응답 성공 시 → populateDetailForm(data) 호출
5. 응답 실패 시 → 에러 메시지 표시
3. 폼 데이터 바인딩
populateDetailForm(data) 실행:
- 기본 정보: company, business_number, application_date, general_phone
- 신청자 정보: applicant_name, resident_number, email, mobile_phone  
- 사업장 정보: address, expert_count, business_area, inventory_value
- 보험 정보: premium, certificate_number, message
- 현재 약국 번호를 폼에 저장 (data-current-num)
4. 사용자 상호작용 기능
폼 내 기능들:
- 저장: savePharmacyDetail() → PUT /api/pharmacy/id-update/${num}
- 증권발행: issueCertificate() → POST /api/pharmacy/issue-certificate  
- 파일업로드: uploadFiles() → POST /api/pharmacy/upload-files
- 입력 형식화: 주민번호, 전화번호, 숫자 천단위 콤마
5. 모달 닫기 및 정리
모달 닫힐 때:
- 폼 데이터 초기화
- 파일 선택 상태 초기화  
- 저장된 약국 번호 제거
6. 메인 테이블과 연동
저장 성공 후:
- 성공 메시지 표시
- 모달 닫기
- loadPharmacyData() 호출로 메인 테이블 새로고침
핵심은 번호 클릭 → API 데이터 로드 → 폼 바인딩 → 편집/저장 → 테이블 새로고침 의 순환 구조입니다.


서버 환경 요약
아키텍처

프론트엔드: https://disk-cms.simg.kr/pages/pharmacy-liability.html
프록시 서버: Node.js Express (routes/pharmacy.js)
백엔드 API: https://imet.kr/api/pharmacy/ (PHP)
데이터베이스: MySQL

호출 흐름
프론트엔드 → Node.js 프록시 → PHP API → MySQL
주요 파일들

Node.js 라우터: /routes/pharmacy.js - imet.kr API 프록시 역할
PHP API: /api/pharmacy/pharmacyApply-num-detail.php - 약국 상세정보 + 보험료 계산
DB 설정: /config/db.php - mysqli 기반 연결함수들

핵심 기능
약국 보험료 자동계산 API:

pharmacyApply 데이터 조회
해지상태(ch=15,16) 확인 → 해지면 계산 건너뜀
신청년도 확인 → 현재년 아니면 계산 건너뜀
조건 통과시 보험료 계산 (전문인 + 화재보험료)
데이터 업데이트 후 상세정보 반환

데이터 보정

약사수 -1 → 0 처리
날짜 0000-00-00 → 빈문자열 처리

테이블 구조

pharmacyApply - 약국 신청 데이터
pharmacyProPreminum - 전문인 보험료 테이블
pharmacyPreminum - 화재보험료 테이블


약국 정보 엡데이트 


프론트엔드: https://disk-cms.simg.kr/pages/pharmacy-liability.html
/api/pharmacy/id-update/${currentNum}
프록시 서버: Node.js Express (routes/pharmacy.js)
백엔드 API: https://imet.kr/api/pharmacy/ (PHP)
데이터베이스: MySQL

호출 흐름
프론트엔드 → Node.js 프록시 → PHP API → MySQL
주요 파일들

Node.js 라우터: /routes/pharmacy.js - imet.kr API 프록시 역할
PHP API: https://imet.kr/api/pharmacy/pharmacyApply-num-update.php?num - 약국 상세정보아 업데이트  + 보험료 계산
DB 설정: /config/db.php - mysqli 기반 연결함수들

핵심 기능
약국 보험료 자동계산 API:

pharmacyApply 데이터 조회
해지상태(ch=15,16) 확인 → 해지면 계산 건너뜀
신청년도 확인 → 현재년 아니면 계산 건너뜀
조건 통과시 보험료 계산 (전문인 + 화재보험료)
데이터 업데이트 후 상세정보 반환

데이터 보정

약사수 -1 → 0 처리
날짜 0000-00-00 → 빈문자열 처리

테이블 구조

pharmacyApply - 약국 신청 데이터
pharmacyProPreminum - 전문인 보험료 테이블
pharmacyPreminum - 화재보험료 테이블


showCustomerListModal() 구현

프론트엔드: https://disk-cms.simg.kr/pages/pharmacy-liability.html

프록시 서버: Node.js Express (routes/pharmacy.js)/api/pharmacy/id-list

// 업체 리스트 조회
router.get('/id-list', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const params = new URLSearchParams({
      page,
      limit,
      search
    });

    const response = await axios.get(`https://imet.kr/api/pharmacy/pharmacy-id-list.php?${params}`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
    
  } catch (error) {
    console.error('업체 리스트 조회 오류:', error);
    
    if (error.response) {
      // PHP API에서 에러 응답이 온 경우
      res.status(error.response.status).json(error.response.data);
    } else {
      // 네트워크 오류 등
      res.status(500).json({
        success: false,
        error: '업체 리스트 조회 중 오류가 발생했습니다.'
      });
    }
  }
});
백엔드 API: https://imet.kr/api/pharmacy/ (PHP)
데이터베이스: MySQL

호출 흐름
프론트엔드 → Node.js 프록시 → PHP API → MySQL
주요 파일들

Node.js 라우터: /routes/pharmacy.js - imet.kr API 프록시 역할
PHP API: https://imet.kr/api/pharmacy/pharmacy-id-list.php - 약국 상세정보아 업데이트  + 보험료 계산

<?php
/**
 * 약국 업체 리스트 API
 * imet.kr/api/pharmacy/pharmacy-id-list.php
 * pharmacy_idList 테이블 관리
 */

// 직접 접근 허용 플래그
define('API_ACCESS', true);

// 데이터베이스 설정 파일 포함
require_once __DIR__ . '/../config/db.php';

// CORS 헤더 설정
header("Access-Control-Allow-Origin: https://disk-cms.simg.kr");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization, Accept, Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400");

if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    header("Content-Type: application/json; charset=utf-8");
}

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 에러 보고 설정
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // 데이터베이스 연결
    $connection = getDBConnection();
    
    if (!$connection) {
        throw new Exception('데이터베이스 연결 실패');
    }
    
    // GET 요청 - 업체 리스트 조회
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        
        // 페이징 파라미터 처리
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
        $offset = ($page - 1) * $limit;
        
        // 검색 파라미터 처리
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        
        // WHERE 조건 구성 - directory 조건 제거하여 모든 데이터 조회
        $whereConditions = array();
        
        if (!empty($search)) {
            $search = escapeData($search);
            $whereConditions[] = "(mem_id LIKE '%$search%' OR name LIKE '%$search%' OR hphone1 LIKE '%$search%')";
        }
        
        // WHERE 절 구성
        $searchWhere = "";
        if (!empty($whereConditions)) {
            $searchWhere = " WHERE " . implode(" AND ", $whereConditions);
        }
        
        // 전체 개수 조회
        $countQuery = "SELECT COUNT(*) as total FROM pharmacy_idList $searchWhere";
        $countResult = executeQuery($countQuery);
        
        if (!$countResult) {
            throw new Exception('개수 조회 실패');
        }
        
        $totalCount = mysqli_fetch_assoc($countResult)['total'];
        $totalPages = ceil($totalCount / $limit);
        
        // 메인 데이터 조회
        $query = "SELECT 
            num,
            mem_id,
            name,
            hphone1,
            DATE_FORMAT(wdate, '%Y-%m-%d %H:%i') as wdate
        FROM pharmacy_idList 
        $searchWhere 
        ORDER BY num DESC 
        LIMIT $limit OFFSET $offset";
        
        $result = executeQuery($query);
        
        if (!$result) {
            throw new Exception('데이터 조회 실패');
        }
        
        // 결과를 배열로 변환
        $data = array();
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = array(
                'num' => intval($row['num']),
                'mem_id' => !empty($row['mem_id']) ? $row['mem_id'] : '-',
                'name' => !empty($row['name']) ? $row['name'] : '-',
                'hphone1' => !empty($row['hphone1']) ? $row['hphone1'] : '-',
                'wdate' => !empty($row['wdate']) ? $row['wdate'] : '-'
            );
        }
        
        // 성공 응답
        $response = array(
            'success' => true,
            'data' => $data,
            'pagination' => array(
                'current_page' => $page,
                'total_pages' => $totalPages,
                'total_count' => intval($totalCount),
                'limit' => $limit,
                'has_next' => $page < $totalPages,
                'has_prev' => $page > 1
            ),
            'search' => $search
        );
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    }
    else {
        throw new Exception('지원하지 않는 요청 방식입니다.');
    }
    
} catch (Exception $e) {
    // 에러 응답
    $response = array(
        'success' => false,
        'error' => $e->getMessage(),
        'data' => array()
    );
    
    http_response_code(500);
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} finally {
    // 데이터베이스 연결 종료
    closeDBConnection();
}
?>
DB 설정: /config/db.php - mysqli 기반 연결함수들


CREATE TABLE IF NOT EXISTS `pharmacy_idList` (
  `num` int(12) NOT NULL AUTO_INCREMENT,
  `directory` varchar(30) NOT NULL COMMENT 'pharmacyApplydirectory',
  `mem_id` varchar(50) NOT NULL COMMENT '아이디',
  `passwd` varchar(100) NOT NULL COMMENT '비번md5',
  `name` varchar(20) NOT NULL COMMENT '고객명',
  `hphone1` varchar(13) NOT NULL COMMENT '구매자연락처',
  `wdate` datetime NOT NULL COMMENT '등록일',
  PRIMARY KEY (`num`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=8 ;

아이디 리스트 보여주고 , 아이디 추가, 수정할 수 있는 기능 구현이다. 