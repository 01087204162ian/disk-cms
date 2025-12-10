/**
 * routes/field-practice/applications.js - 현장실습보험 신청 관리 라우터
 * PHP API 프록시 (silbo.kr)
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();

const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 기본 설정
const PHP_API_BASE_URL = 'https://silbo.kr/2025/api/question';
const DEFAULT_TIMEOUT = 30000;

// 공통 헤더 설정
const getDefaultHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

// 에러 핸들링 함수
const handleApiError = (error, res, defaultMessage) => {
  console.error('API 오류:', error);
  
  if (error.response) {
    res.status(error.response.status).json(error.response.data);
  } else if (error.code === 'ECONNABORTED') {
    res.status(408).json({
      success: false,
      error: '요청 시간이 초과되었습니다.'
    });
  } else {
    res.status(500).json({
      success: false,
      error: defaultMessage
    });
  }
};

// 로그인 확인 미들웨어
const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      error: '로그인이 필요합니다.'
    });
  }
  next();
};
// Multer 설정 (임시 저장)
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('허용되지 않은 파일 형식입니다.'));
    }
  }
});
// 모든 라우트에 인증 체크 적용
router.use(requireAuth);

// camelCase를 snake_case로 변환하는 함수
const convertPaginationToSnakeCase = (pagination) => {
  if (!pagination) return null;
  
  return {
    total_count: pagination.total || 0,
    total_pages: pagination.totalPages || 0,
    current_page: pagination.currentPage || 1,
    limit: pagination.limit || 15,
    has_next: pagination.hasNext || false,
    has_prev: pagination.hasPrev || false
  };
};

/**
 * GET /api/field-practice/list
 * 현장실습보험 신청 목록 조회
 */
router.get('/list', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 15, 
      search = '', 
      searchType = 'contains',
      searchField = 'school1',  // ⭐ 추가
      status = ''
    } = req.query;
    
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 15));
    const validSearchTypes = ['contains', 'exact', 'policy'];
    const validatedSearchType = validSearchTypes.includes(searchType) ? searchType : 'contains';
    
    const params = new URLSearchParams({
      page: validatedPage,
      limit: validatedLimit,
      search: search.toString().trim(),
      searchType: validatedSearchType,
      searchField: searchField,  // ⭐ 추가
      status: status
    });
    
    console.log(`[GET /api/field-practice/list] 신청 목록 조회`, Object.fromEntries(params));
    
    const response = await axios.get(`${PHP_API_BASE_URL}/fetch_questionnaire.php?${params}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });
    
    // ⭐ 변환 없이 그대로 반환 (PHP 응답을 신뢰)
    console.log(`[GET /api/field-practice/list] 성공 - 총 ${response.data.pagination?.total || 0}건`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '현장실습보험 신청 목록 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/field-practice/detail/:id
 * 현장실습보험 신청 상세 조회
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    console.log(`[GET /api/field-practice/detail/${questionnaireId}] 상세 정보 조회`);

    const response = await axios.get(
      `${PHP_API_BASE_URL}/get_questionnaire_details.php?id=${questionnaireId}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /api/field-practice/detail/${questionnaireId}] 성공`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '상세 정보 조회 중 오류가 발생했습니다.');
  }
});

/**
 * PUT /api/field-practice/update/:id
 * 현장실습보험 신청 정보 수정
 */
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    console.log(`[PUT /api/field-practice/update/${questionnaireId}] 정보 수정`);

    const response = await axios.put(
      `${PHP_API_BASE_URL}/update_questionnaire.php?id=${questionnaireId}`,
      req.body,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[PUT /api/field-practice/update/${questionnaireId}] 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '정보 수정 중 오류가 발생했습니다.');
  }
});
// 관리자 목록 조회
router.get('/managers', async (req, res) => {
  try {
    const response = await axios.get(
      `${PHP_API_BASE_URL}/get_idList.php`,
      { 
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    res.json({ 
      success: true, 
      data: response.data 
    });

  } catch (error) {
    console.error('관리자 목록 조회 실패:', error.message);
    res.status(500).json({ 
      success: false, 
      message: '관리자 목록을 불러올 수 없습니다',
      error: error.message 
    });
  }
});
/**
 * POST /api/field-practice/update-gabunho/:id
 * 청약번호 업데이트
 */
router.post('/update-gabunho/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { gabunho, userName } = req.body;
    
    if (!gabunho || !gabunho.trim()) {
      return res.status(400).json({
        success: false,
        error: '청약번호를 입력해주세요.'
      });
    }

    console.log(`[POST /api/field-practice/update-gabunho/${questionnaireId}] 청약번호 업데이트 - 담당자: ${userName}`);

    // URLSearchParams로 form-data 형식 생성
    const formData = new URLSearchParams();
    formData.append('num', questionnaireId);
    formData.append('gabunho', gabunho.trim());
    formData.append('userName', userName || 'Unknown');

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_gabunho.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`[POST /api/field-practice/update-gabunho/${questionnaireId}] 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '청약번호 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/update-certi/:id
 * 증권번호 업데이트
 */
router.post('/update-certi/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { certi, userName } = req.body;
    
    if (!certi || !certi.trim()) {
      return res.status(400).json({
        success: false,
        error: '증권번호를 입력해주세요.'
      });
    }

    console.log(`[POST /api/field-practice/update-certi/${questionnaireId}] 증권번호 업데이트 - 담당자: ${userName}`);

    const formData = new URLSearchParams();
    formData.append('num', questionnaireId);
    formData.append('certi_', certi.trim());  // ⭐ certi가 아니라 certi_
    formData.append('userName', userName || 'Unknown');

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_certi_.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`[POST /api/field-practice/update-certi/${questionnaireId}] 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '증권번호 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/update-cardnum/:id
 * 카드번호 업데이트
 */
router.post('/update-cardnum/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { cardnum } = req.body;  // userName 제거 (PHP가 사용 안 함)
    
    if (!cardnum || !cardnum.trim()) {
      return res.status(400).json({
        success: false,
        error: '카드번호를 입력해주세요.'
      });
    }

    console.log(`[POST /api/field-practice/update-cardnum/${questionnaireId}] 카드번호 업데이트`);

    const formData = new URLSearchParams();
    formData.append('num', questionnaireId);
    formData.append('cardnum', cardnum.trim());
    // userName 전송 안 함 (PHP에서 처리 안 함)

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_cardnum.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    // PHP가 텍스트 응답을 반환하므로 JSON으로 변환
    const isSuccess = typeof response.data === 'string' && response.data.includes('성공');
    
    console.log(`[POST /api/field-practice/update-cardnum/${questionnaireId}] 완료`);
    res.json({
      success: isSuccess,
      message: response.data
    });
    
  } catch (error) {
    handleApiError(error, res, '카드번호 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/update-yymm/:id
 * 유효기간 업데이트
 */
router.post('/update-yymm/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { yymm } = req.body;
    
    if (!yymm || !yymm.trim()) {
      return res.status(400).json({
        success: false,
        error: '유효기간을 입력해주세요.'
      });
    }

    console.log(`[POST /api/field-practice/update-yymm/${questionnaireId}] 유효기간 업데이트`);

    const formData = new URLSearchParams();
    formData.append('num', questionnaireId);
    formData.append('yymm', yymm.trim());

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_yymm.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const isSuccess = typeof response.data === 'string' && response.data.includes('성공');
    
    console.log(`[POST /api/field-practice/update-yymm/${questionnaireId}] 완료`);
    res.json({
      success: isSuccess,
      message: response.data
    });
    
  } catch (error) {
    handleApiError(error, res, '유효기간 업데이트 중 오류가 발생했습니다.');
  }
});
/**
 * POST /api/field-practice/update-bankname/:id
 * 은행명 업데이트
 */
router.post('/update-bankname/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { bankname } = req.body;
    
    if (!bankname || !bankname.trim()) {
      return res.status(400).json({
        success: false,
        error: '은행명을 입력해주세요.'
      });
    }

    console.log(`[POST /api/field-practice/update-bank_name/${questionnaireId}] 은행명 업데이트`);

    const formData = new URLSearchParams();
    formData.append('num', questionnaireId);
    formData.append('bankName', bankname.trim());  // ⭐ PHP는 bankName (대문자 N)

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_bank_name.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const isSuccess = typeof response.data === 'string' && response.data.includes('성공');
    
    console.log(`[POST /api/field-practice/update-bankname/${questionnaireId}] 완료`);
    res.json({
      success: isSuccess,
      message: response.data
    });
    
  } catch (error) {
    handleApiError(error, res, '은행명 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/update-bank/:id
 * 은행계좌 업데이트
 */
router.post('/update-bank/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { bank } = req.body;
    
    if (!bank || !bank.trim()) {
      return res.status(400).json({
        success: false,
        error: '계좌번호를 입력해주세요.'
      });
    }

    console.log(`[POST /api/field-practice/update-bank/${questionnaireId}] 계좌번호 업데이트`);

    const formData = new URLSearchParams();
    formData.append('num', questionnaireId);
    formData.append('bank', bank.trim());

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_bank_account.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const isSuccess = typeof response.data === 'string' && response.data.includes('성공');
    
    console.log(`[POST /api/field-practice/update-bank/${questionnaireId}] 완료`);
    res.json({
      success: isSuccess,
      message: response.data
    });
    
  } catch (error) {
    handleApiError(error, res, '계좌번호 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/update-damdanga/:id
 * 담당자 업데이트
 */
router.post('/update-damdanga/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { damdanga } = req.body;
    
    if (!damdanga || !damdanga.trim()) {
      return res.status(400).json({
        success: false,
        error: '담당자 이름을 입력해주세요.'
      });
    }

    console.log(`[POST /api/field-practice/update-damdanga/${questionnaireId}] 담당자 업데이트`);

    const formData = new URLSearchParams();
    formData.append('num', questionnaireId);
    formData.append('damdanga', damdanga.trim());

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_damdanga.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const isSuccess = typeof response.data === 'string' && response.data.includes('성공');
    
    console.log(`[POST /api/field-practice/update-damdanga/${questionnaireId}] 완료`);
    res.json({
      success: isSuccess,
      message: response.data
    });
    
  } catch (error) {
    handleApiError(error, res, '담당자 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/update-damdangat/:id
 * 담당자 연락처 업데이트
 */
router.post('/update-damdangat/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { damdangat } = req.body;
    
    if (!damdangat || !damdangat.trim()) {
      return res.status(400).json({
        success: false,
        error: '담당자 연락처를 입력해주세요.'
      });
    }

    // PHP에서 20자 제한이 있으므로 검증
    if (damdangat.trim().length > 20) {
      return res.status(400).json({
        success: false,
        error: '담당자 연락처는 20자 이하로 입력해주세요.'
      });
    }

    console.log(`[POST /api/field-practice/update-damdangat/${questionnaireId}] 담당자 연락처 업데이트`);

    const formData = new URLSearchParams();
    formData.append('num', questionnaireId);
    formData.append('damdangat', damdangat.trim());

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_damdangat.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    // PHP가 JSON 응답을 반환
    if (response.data.status === 'success' || response.data.status === 'warning') {
      console.log(`[POST /api/field-practice/update-damdangat/${questionnaireId}] 완료`);
      res.json({
        success: true,
        message: response.data.message
      });
    } else {
      throw new Error(response.data.message || '업데이트 실패');
    }
    
  } catch (error) {
    handleApiError(error, res, '담당자 연락처 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/update-detail
 * 현장실습보험 신청 정보 수정 (상세)
 */
router.post('/update-detail', async (req, res) => {
  try {
    const { num, school1, school2, school3, school4, school5, school6, school7, school8, plan, totalP, inscompany } = req.body;
    
    if (!num || num <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    console.log(`[POST /api/field-practice/update-detail] 상세 정보 수정 - ID: ${num}`);

    // URLSearchParams로 form-data 형식 생성
    const formData = new URLSearchParams();
    formData.append('id', num);
    formData.append('school1', school1 || '');
    formData.append('school2', school2 || '');
    formData.append('school3', school3 || '');
    formData.append('school4', school4 || '');
    formData.append('school5', school5 || '');
    formData.append('school6', school6 || '');
    formData.append('school7', school7 || '');
    formData.append('school8', school8 || '');
    formData.append('plan', plan || '');
    formData.append('totalP', totalP || '0');
    formData.append('inscompany', inscompany || '0');
    
    // 주차별 인원 데이터 추가
    for (let i = 4; i <= 26; i++) {
      const weekValue = req.body[`week${i}`] || 0;
      formData.append(`week${i}`, weekValue);
    }

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_questionnaire.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`[POST /api/field-practice/update-detail] 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '상세 정보 수정 중 오류가 발생했습니다.');
  }
});
/**
 * POST /api/field-practice/update-status
 * 상태 변경
 */
router.post('/update-status', async (req, res) => {
  try {
    const { id, status, old_status } = req.body;
    
    const questionnaireId = parseInt(id);
    const newStatus = parseInt(status);
    
    // 유효성 검사
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    if (!newStatus || isNaN(newStatus)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 상태 값입니다.'
      });
    }

    // 허용된 상태 값 검증
    const validStatuses = [1, 2, 3, 4, 5, 6, 7, 12, 38, 39, 40];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: '허용되지 않은 상태 값입니다.'
      });
    }

    console.log(`[POST /api/field-practice/update-status] ID: ${questionnaireId}, 상태: ${old_status} → ${newStatus}`);

    // URLSearchParams로 form-data 형식 생성
    const formData = new URLSearchParams();
    formData.append('id', questionnaireId);
    formData.append('ch', newStatus);

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_status.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`[POST /api/field-practice/update-status] 완료 - 응답:`, response.data);
    
    // PHP 응답이 JSON 형식이므로 그대로 반환
    res.json(response.data);
    
  } catch (error) {
    console.error('[POST /api/field-practice/update-status] 오류:', error);
    handleApiError(error, res, '상태 변경 중 오류가 발생했습니다.');
  }
});
/**
 * POST /api/field-practice/upload-file
 * 파일 업로드 (PHP API 프록시)
 */
router.post('/upload-file', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    const { qNum, fileType, designNumber, certificateNumber, userName } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: '파일을 선택해주세요.'
      });
    }
    
    if (!qNum) {
      return res.status(400).json({
        success: false,
        error: '신청 ID가 필요합니다.'
      });
    }
    
    if (!fileType) {
      return res.status(400).json({
        success: false,
        error: '파일 타입을 선택해주세요.'
      });
    }
    
    if (fileType === '4' && !designNumber) {
      return res.status(400).json({
        success: false,
        error: '설계번호를 입력해주세요.'
      });
    }
    
    if (fileType === '7' && !certificateNumber) {
      return res.status(400).json({
        success: false,
        error: '증권번호를 입력해주세요.'
      });
    }

    tempFilePath = file.path;
    
    console.log(`[POST /api/field-practice/upload-file] 업로드 시작 - ID: ${qNum}, 타입: ${fileType}`);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath), {
      filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      contentType: file.mimetype
    });
    formData.append('qNum', qNum);
    formData.append('fileType', fileType);
    formData.append('userName', userName || 'Unknown');
    
    if (fileType === '4' && designNumber) {
      formData.append('designNumber', designNumber.trim());
    }
    if (fileType === '7' && certificateNumber) {
      formData.append('certificateNumber', certificateNumber.trim());
    }

    const response = await axios.post(
      `${PHP_API_BASE_URL}/upload.php`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log(`[POST /api/field-practice/upload-file] 완료`);
    
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    if (typeof response.data === 'string') {
      const isSuccess = response.data.includes('성공');
      res.json({
        success: isSuccess,
        message: response.data
      });
    } else {
      res.json(response.data);
    }
    
  } catch (error) {
    console.error('[POST /api/field-practice/upload-file] 오류:', error);
    
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('임시 파일 삭제 실패:', cleanupError);
      }
    }
    
    handleApiError(error, res, '파일 업로드 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/field-practice/files/:id
 * 파일 목록 조회
 */
router.get('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    console.log(`[GET /api/field-practice/files/${questionnaireId}] 파일 목록 조회`);

    const response = await axios.get(
      `${PHP_API_BASE_URL}/get_filelist.php?id=${questionnaireId}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /api/field-practice/files/${questionnaireId}] 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '파일 목록 조회 중 오류가 발생했습니다.');
  }
});

/**
 * DELETE /api/field-practice/files/:id
 * 파일 삭제
 */
router.delete('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fileId = parseInt(id);
    
    if (!fileId || fileId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 파일 ID입니다.'
      });
    }

    console.log(`[DELETE /api/field-practice/files/${fileId}] 파일 삭제`);

    const response = await axios.get(
      `${PHP_API_BASE_URL}/delete_file.php?id=${fileId}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[DELETE /api/field-practice/files/${fileId}] 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '파일 삭제 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/claim/save
 * 클레임 저장 (신규 및 수정)
 */
router.post('/claim/save', async (req, res) => {
  try {
    // FormData를 multipart/form-data로 받아야 하므로 multer 사용
    // 하지만 파일이 없으므로 직접 처리
    
    console.log('[POST /api/field-practice/claim/save] 클레임 저장 요청');

    // FormData를 PHP가 인식할 수 있는 형식으로 변환
    const formData = new URLSearchParams();
    formData.append('school1', req.body.school1 || '');
    formData.append('qNum', req.body.qNum || '');
    formData.append('cNum', req.body.cNum || '');
    formData.append('claimNum__', req.body.claimNum__ || ''); // 수정 시 사용
    formData.append('certi', req.body.certi || '');
    formData.append('claimNumber', req.body.claimNumber || '');
    formData.append('wdate_2', req.body.wdate_2 || '');
    formData.append('wdate_3', req.body.wdate_3 || '');
    formData.append('claimAmout', req.body.claimAmout || '');
    formData.append('student', req.body.student || '');
    formData.append('accidentDescription', req.body.accidentDescription || '');
    formData.append('manager', req.body.manager || req.session?.user?.name || 'Unknown');
    formData.append('damdanga', req.body.damdanga || '');
    formData.append('damdangat', req.body.damdangat || '');

    const response = await axios.post(
      'https://silbo.kr/2025/api/claim/claim_store.php',
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    console.log('[POST /api/field-practice/claim/save] 완료');
    res.json(response.data);
    
  } catch (error) {
    console.error('[POST /api/field-practice/claim/save] 오류:', error);
    handleApiError(error, res, '클레임 저장 중 오류가 발생했습니다.');
  }
});


/**
 * POST /api/field-practice/update-memo/:id
 * 메모 업데이트
 */
router.post('/update-memo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaireId = parseInt(id);
    
    if (!questionnaireId || questionnaireId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { memo } = req.body;
    
    // 메모가 비어있어도 허용 (빈 문자열로 저장)
    if (memo === undefined || memo === null) {
      return res.status(400).json({
        success: false,
        error: '메모 내용이 필요합니다.'
      });
    }

    console.log(`[POST /api/field-practice/update-memo/${questionnaireId}] 메모 업데이트`);

    const formData = new URLSearchParams();
    formData.append('num', questionnaireId);
    formData.append('memo', memo);

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_memo.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`[POST /api/field-practice/update-memo/${questionnaireId}] 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '메모 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/field-practice/cnum-compare
 * 여러 cNum 비교 데이터 조회
 */
router.get('/cnum-compare', async (req, res) => {
  try {
    const { cNums } = req.query;
    
    // cNums 유효성 검사
    if (!cNums) {
      return res.status(400).json({
        success: false,
        error: 'cNums 파라미터가 필요합니다. (예: cNums=2431,2203,2160)'
      });
    }
    
    // cNums를 배열로 변환하고 유효성 검사
    const cNumArray = cNums.split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n > 0);
    
    if (cNumArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: '유효한 cNum이 없습니다.'
      });
    }
    
    // 최대 10개까지만 비교 허용
    if (cNumArray.length > 10) {
      return res.status(400).json({
        success: false,
        error: '한 번에 최대 10개까지만 비교할 수 있습니다.'
      });
    }
    
    console.log(`[GET /api/field-practice/cnum-compare] cNum 비교 조회:`, cNumArray);
    
    // PHP API 호출
    const response = await axios.get(
      `${PHP_API_BASE_URL}/cnum_compare.php?cNums=${cNums}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );
    
    console.log(`[GET /api/field-practice/cnum-compare] 성공 - ${cNumArray.length}개 cNum 비교`);
    res.json(response.data);
    
  } catch (error) {
    console.error('[GET /api/field-practice/cnum-compare] 오류:', error);
    handleApiError(error, res, 'cNum 비교 데이터 조회 중 오류가 발생했습니다.');
  }
});
module.exports = router;