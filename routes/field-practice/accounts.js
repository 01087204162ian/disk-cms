/**
 * routes/field-practice/accounts.js - 현장실습보험 계정 관리 라우터
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();

// PHP API 기본 URL
const PHP_API_BASE_URL = 'https://silbo.kr/2025/api/account';
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

// 모든 라우트에 인증 체크 적용
router.use(requireAuth);

/**
 * GET /api/field-practice/accounts
 * 계정 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 15, 
      searchType = 'schoolName',
      searchWord = '',
      directory = ''
    } = req.query;
    
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 15));
    
    // 검색 타입 검증
    const validSearchTypes = ['schoolName', 'mem_id', 'damdanga', 'damdangat'];
    const validatedSearchType = validSearchTypes.includes(searchType) ? searchType : 'schoolName';
    
    const params = new URLSearchParams({
      page: validatedPage,
      pageSize: validatedPageSize,
      searchType: validatedSearchType,
      searchWord: searchWord.toString().trim()
    });
    
    // 학교 구분 필터
    if (directory && (directory === '1' || directory === '2')) {
      params.append('directory', directory);
    }
    
    console.log(`[GET /api/field-practice/accounts] 계정 목록 조회 - page: ${validatedPage}, pageSize: ${validatedPageSize}`);
    
    const response = await axios.get(`${PHP_API_BASE_URL}/fetch_accounts.php?${params}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });
    
    console.log(`[GET /api/field-practice/accounts] 성공 - 총 ${response.data.pagination?.totalCount || 0}건`);
    
    res.json({
      success: true,
      accounts: response.data.accounts || [],
      pagination: response.data.pagination || {}
    });
    
  } catch (error) {
    handleApiError(error, res, '계정 목록 조회 중 오류가 발생했습니다.');
  }
});

module.exports = router;