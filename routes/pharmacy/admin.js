/**
 * routes/pharmacy-admin/admin.js - 약국 관리자 전용 프록시 라우터
 * API 키 관리 시스템 (imet.kr PHP API 프록시)
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// 기본 설정
const PHP_API_BASE_URL = 'https://imet.kr/api/pharmacy';
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

// ⭐ 로그인 확인 미들웨어 (직원도 가능)
const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      error: '로그인이 필요합니다.'
    });
  }
  next();
};

// 관리자 권한 확인 미들웨어 (필요시 사용 - 현재는 미사용)
const requireAdmin = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      error: '로그인이 필요합니다.'
    });
  }

  const adminRoles = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'];
  if (!adminRoles.includes(req.session.user.role)) {
    return res.status(403).json({
      success: false,
      error: '관리자 권한이 필요합니다.'
    });
  }

  next();
};

/**
 * GET /api/admin/api-keys
 * API 키 목록 조회 - 직원 가능
 */
router.get('/api-keys', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '' } = req.query;
    
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(200, Math.max(1, parseInt(limit) || 100));
    
    const params = new URLSearchParams({
      page: validatedPage,
      limit: validatedLimit,
      search: search.toString().trim()
    });

    console.log(`[GET /api/admin/api-keys] API 키 목록 조회 요청 - page: ${validatedPage}, limit: ${validatedLimit}, search: "${search}"`);

    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-api-keys-list.php?${params}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /api/admin/api-keys] 성공 - 총 ${response.data?.pagination?.total_count || 0}개 API 키 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, 'API 키 목록 조회 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/admin/api-keys/generate
 * API 키 생성 - 직원 가능 ⭐
 */
router.post('/api-keys/generate', requireAuth, async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }

    const validUserId = parseInt(user_id);
    if (!validUserId || validUserId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 사용자 ID를 입력해주세요.'
      });
    }

    const requestData = {
      user_id: validUserId,
      action: 'generate_api_key',
      admin_id: req.session.user.id || req.session.user.num
    };

    console.log(`[POST /api/admin/api-keys/generate] API 키 생성 요청 - 사용자ID: ${validUserId}, 담당자: ${requestData.admin_id}`);

    const response = await axios.post(`${PHP_API_BASE_URL}/pharmacy-api-keys-generate.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /api/admin/api-keys/generate] 성공 - API 키 생성 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, 'API 키 생성 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/admin/api-keys/:id
 * 특정 API 키 조회 - 직원 가능
 */
router.get('/api-keys/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const userId = parseInt(id);
    if (!userId || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 사용자 ID를 입력해주세요.'
      });
    }

    console.log(`[GET /api/admin/api-keys/${id}] API 키 조회 요청 - 사용자ID: ${userId}`);

    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-api-keys-detail.php?user_id=${userId}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /api/admin/api-keys/${id}] 성공 - API 키 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, 'API 키 조회 중 오류가 발생했습니다.');
  }
});

/**
 * DELETE /api/admin/api-keys/:id
 * API 키 삭제 - 직원 가능 ⭐
 */
router.delete('/api-keys/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const userId = parseInt(id);
    if (!userId || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 사용자 ID를 입력해주세요.'
      });
    }

    const requestData = {
      user_id: userId,
      action: 'delete_api_key',
      admin_id: req.session.user.id || req.session.user.num
    };

    console.log(`[DELETE /api/admin/api-keys/${id}] API 키 삭제 요청 - 사용자ID: ${userId}, 담당자: ${requestData.admin_id}`);

    const response = await axios.delete(`${PHP_API_BASE_URL}/pharmacy-api-keys-delete.php`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
      data: requestData
    });

    console.log(`[DELETE /api/admin/api-keys/${id}] 성공 - API 키 삭제 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, 'API 키 삭제 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/admin/api-logs/:id
 * API 호출 로그 조회 - 직원 가능
 */
router.get('/api-logs/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, date_from = '', date_to = '' } = req.query;
    
    const userId = parseInt(id);
    if (!userId || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 사용자 ID를 입력해주세요.'
      });
    }

    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));

    const params = new URLSearchParams({
      user_id: userId,
      page: validatedPage,
      limit: validatedLimit
    });

    if (date_from && date_from.trim()) {
      params.append('date_from', date_from.trim());
    }
    if (date_to && date_to.trim()) {
      params.append('date_to', date_to.trim());
    }

    console.log(`[GET /api/admin/api-logs/${id}] API 로그 조회 요청 - 사용자ID: ${userId}, 페이지: ${validatedPage}, 제한: ${validatedLimit}`);

    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-api-logs.php?${params}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /api/admin/api-logs/${id}] 성공 - API 로그 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, 'API 로그 조회 중 오류가 발생했습니다.');
  }
});

/**
 * PUT /api/admin/api-keys/:id/toggle
 * API 키 활성화/비활성화 토글 - 직원 가능 ⭐
 */
router.put('/api-keys/:id/toggle', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const userId = parseInt(id);
    if (!userId || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 사용자 ID를 입력해주세요.'
      });
    }

    const requestData = {
      user_id: userId,
      action: 'toggle_api_key',
      admin_id: req.session.user.id || req.session.user.num
    };

    console.log(`[PUT /api/admin/api-keys/${id}/toggle] API 키 상태 토글 요청 - 사용자ID: ${userId}, 담당자: ${requestData.admin_id}`);

    const response = await axios.put(`${PHP_API_BASE_URL}/pharmacy-api-keys-toggle.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[PUT /api/admin/api-keys/${id}/toggle] 성공 - API 키 상태 토글 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, 'API 키 상태 변경 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/admin/api-keys/:id/regenerate
 * API 키 재생성 - 직원 가능 ⭐
 */
router.post('/api-keys/:id/regenerate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const userId = parseInt(id);
    if (!userId || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 사용자 ID를 입력해주세요.'
      });
    }

    const requestData = {
      user_id: userId,
      action: 'regenerate_api_key',
      admin_id: req.session.user.id || req.session.user.num
    };

    console.log(`[POST /api/admin/api-keys/${id}/regenerate] API 키 재생성 요청 - 사용자ID: ${userId}, 담당자: ${requestData.admin_id}`);

    const response = await axios.post(`${PHP_API_BASE_URL}/pharmacy-api-keys-regenerate.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /api/admin/api-keys/${id}/regenerate] 성공 - API 키 재생성 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, 'API 키 재생성 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/admin/api-stats
 * API 사용 통계 조회 - 직원 가능
 */
router.get('/api-stats', requireAuth, async (req, res) => {
  try {
    const { period = 'week', user_id = '' } = req.query;
    
    const validPeriods = ['day', 'week', 'month', 'quarter', 'year'];
    const validatedPeriod = validPeriods.includes(period) ? period : 'week';

    const params = new URLSearchParams({
      period: validatedPeriod
    });

    if (user_id && user_id.trim()) {
      const validUserId = parseInt(user_id);
      if (validUserId && validUserId > 0) {
        params.append('user_id', validUserId);
      }
    }

    console.log(`[GET /api/admin/api-stats] API 통계 조회 요청 - 기간: ${validatedPeriod}, 사용자ID: ${user_id || '전체'}`);

    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-api-stats.php?${params}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /api/admin/api-stats] 성공 - API 통계 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, 'API 통계 조회 중 오류가 발생했습니다.');
  }
});

module.exports = router;