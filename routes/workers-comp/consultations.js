/**
 * routes/workers-comp/consultations.js - 상담신청 관리 프록시 라우터
 * 경로: routes/workers-comp/consultations.js
 * 
 * GET /api/workers-comp/consultations - 상담신청 리스트 조회
 * GET /api/workers-comp/consultations/:id - 특정 상담신청 상세 조회
 * PUT /api/workers-comp/consultations/:id - 상담신청 정보 수정
 * POST /api/workers-comp/consultations/:id/status - 상태 변경
 * POST /api/workers-comp/consultations/:id/consultation-date - 상담일 변경
 * POST /api/workers-comp/consultations/bulk-status - 일괄 상태변경
 * GET /api/workers-comp/consultations/statistics - 통계 데이터
 * GET /api/workers-comp/consultations/export-excel - 엑셀 내보내기
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// 기본 설정
const API_BASE_URL = process.env.CONSULTATION_API_URL || 'https://geunjae.kr/api';
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
    // 외부 API에서 에러 응답이 온 경우
    const status = error.response.status;
    const data = error.response.data;
    
    res.status(status).json({
      success: false,
      error: data.message || data.error || defaultMessage,
      details: data.details || null
    });
  } else if (error.code === 'ECONNABORTED') {
    // 타임아웃 에러
    res.status(408).json({
      success: false,
      error: '요청 시간이 초과되었습니다.'
    });
  } else if (error.code === 'ECONNREFUSED') {
    // 연결 거부
    res.status(503).json({
      success: false,
      error: '서버에 연결할 수 없습니다.'
    });
  } else {
    // 기타 네트워크 오류
    res.status(500).json({
      success: false,
      error: defaultMessage
    });
  }
};

// 입력 검증 함수들
const validatePagination = (page, limit) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return { page: validatedPage, limit: validatedLimit };
};

const validateId = (id) => {
  const numId = parseInt(id);
  if (!numId || numId <= 0) {
    throw new Error('올바른 ID를 입력해주세요.');
  }
  return numId;
};

const validateStatus = (status) => {
  const validStatuses = ['pending', 'contacted', 'completed'];
  if (status && !validStatuses.includes(status)) {
    throw new Error('올바른 상태값을 입력해주세요.');
  }
  return status;
};

const validateIndustry = (industry) => {
  const validIndustries = ['건설업', '제조업', '서비스업', '운수업', '기타'];
  if (industry && !validIndustries.includes(industry)) {
    throw new Error('올바른 업종을 입력해주세요.');
  }
  return industry;
};

const validateEmployees = (employees) => {
  const validEmployees = ['5명 미만', '5-10명', '11-30명', '31-50명', '50명 이상'];
  if (employees && !validEmployees.includes(employees)) {
    throw new Error('올바른 직원수를 입력해주세요.');
  }
  return employees;
};

/**
 * GET /api/workers-comp/consultations
 * 상담신청 리스트 조회 (페이징, 검색, 필터 지원)
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '', 
      industry = '', 
      employees = ''
    } = req.query;
    
    // 입력값 검증
    const { page: validatedPage, limit: validatedLimit } = validatePagination(page, limit);
    const validatedStatus = validateStatus(status);
    const validatedIndustry = validateIndustry(industry);
    const validatedEmployees = validateEmployees(employees);
    
    // API 요청 파라미터 구성
    const params = new URLSearchParams({
      page: validatedPage,
      limit: validatedLimit,
      search: search.toString().trim(),
      ...(validatedStatus && { status: validatedStatus }),
      ...(validatedIndustry && { industry: validatedIndustry }),
      ...(validatedEmployees && { employees: validatedEmployees })
    });

    console.log(`[GET /consultations] 요청 - page: ${validatedPage}, limit: ${validatedLimit}, search: "${search}", status: "${validatedStatus}"`);

    // 외부 API 호출
    const response = await axios.get(`${API_BASE_URL}/consultations/list.php?${params}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /consultations] 성공 - 총 ${response.data?.pagination?.total_count || 0}개 데이터`);
    
    // 응답 데이터 구조화
    const responseData = {
      success: true,
      data: response.data?.data || [],
      pagination: {
        total_count: response.data?.pagination?.total_count || 0,
        current_page: validatedPage,
        limit: validatedLimit,
        total_pages: Math.ceil((response.data?.pagination?.total_count || 0) / validatedLimit)
      }
    };
    
    res.json(responseData);
    
  } catch (error) {
    handleApiError(error, res, '상담신청 리스트 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/workers-comp/consultations/:id
 * 특정 상담신청 상세 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const consultationId = validateId(req.params.id);

    console.log(`[GET /consultations/${consultationId}] 상세 조회 - 상담신청ID: ${consultationId}`);

    // 외부 API 호출
    const response = await axios.get(`${API_BASE_URL}/consultations/detail.php`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
      params: {
        id: consultationId
      }
    });

    console.log(`[GET /consultations/${consultationId}] 성공 - 상세정보 조회 완료`);
    
    // 응답 데이터 구조화
    const responseData = {
      success: true,
      data: response.data?.data || response.data
    };
    
    res.json(responseData);
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상담신청 상세 조회 중 오류가 발생했습니다.');
    }
  }
});

/**
 * PUT /api/workers-comp/consultations/:id
 * 상담신청 정보 수정
 */
router.put('/:id', async (req, res) => {
  try {
    const consultationId = validateId(req.params.id);
    const { status, consultation_date } = req.body;
    
    // 수정 가능한 필드만 구성
    const updateData = { 
      id: consultationId 
    };
    
    if (status !== undefined) {
      const validatedStatus = validateStatus(status);
      updateData.status = validatedStatus;
    }
    
    if (consultation_date !== undefined) {
      if (consultation_date && !/^\d{4}-\d{2}-\d{2}$/.test(consultation_date)) {
        return res.status(400).json({
          success: false,
          error: '상담일은 YYYY-MM-DD 형식으로 입력해주세요.'
        });
      }
      updateData.consultation_date = consultation_date || null;
    }

    console.log(`[PUT /consultations/${consultationId}] 정보 수정 요청 - 상담신청ID: ${consultationId}`);

    // 외부 API 호출
    const response = await axios.put(`${API_BASE_URL}/consultations/update.php`, updateData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[PUT /consultations/${consultationId}] 성공 - 정보 수정 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || '상담신청 정보가 수정되었습니다.',
      data: response.data?.data || null
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상담신청 정보 수정 중 오류가 발생했습니다.');
    }
  }
});

/**
 * POST /api/workers-comp/consultations/:id/status
 * 상담신청 상태 변경
 */
router.post('/:id/status', async (req, res) => {
  try {
    const consultationId = validateId(req.params.id);
    const { status, old_status } = req.body;
    
    if (!status || !status.trim()) {
      return res.status(400).json({
        success: false,
        error: '변경할 상태를 입력해주세요.'
      });
    }

    const validatedStatus = validateStatus(status.trim());
    if (!validatedStatus) {
      return res.status(400).json({
        success: false,
        error: '올바른 상태값을 입력해주세요. (pending, contacted, completed)'
      });
    }

    const requestData = {
      consultation_id: consultationId,
      status: validatedStatus,
      ...(old_status && { old_status: old_status.trim() }),
      action: 'update_status'
    };

    console.log(`[POST /consultations/${consultationId}/status] 상태 변경 요청 - 상담신청ID: ${consultationId}, 상태: "${validatedStatus}"`);

    // 외부 API 호출
    const response = await axios.post(`${API_BASE_URL}/consultations/status-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /consultations/${consultationId}/status] 성공 - 상태 변경 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || `상태가 변경되었습니다.`,
      data: response.data?.data || null
    });
    
  } catch (error) {
    if (error.message.includes('올바른')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상태 변경 중 오류가 발생했습니다.');
    }
  }
});

/**
 * POST /api/workers-comp/consultations/:id/consultation-date
 * 상담일 변경
 */
router.post('/:id/consultation-date', async (req, res) => {
  try {
    const consultationId = validateId(req.params.id);
    const { consultation_date } = req.body;
    
    if (consultation_date && !/^\d{4}-\d{2}-\d{2}$/.test(consultation_date)) {
      return res.status(400).json({
        success: false,
        error: '상담일은 YYYY-MM-DD 형식으로 입력해주세요.'
      });
    }

    const requestData = {
      consultation_id: consultationId,
      consultation_date: consultation_date || null,
      action: 'update_consultation_date'
    };

    console.log(`[POST /consultations/${consultationId}/consultation-date] 상담일 변경 요청 - 상담신청ID: ${consultationId}`);

    // 외부 API 호출
    const response = await axios.post(`${API_BASE_URL}/consultations/consultation-date-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /consultations/${consultationId}/consultation-date] 성공 - 상담일 변경 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || '상담일이 변경되었습니다.',
      data: response.data?.data || null
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상담일 변경 중 오류가 발생했습니다.');
    }
  }
});

/**
 * GET /api/workers-comp/consultations/statistics
 * 상담신청 통계 데이터 조회
 */
router.get('/statistics', async (req, res) => {
  try {
    console.log('[GET /consultations/statistics] 통계 데이터 조회 요청');

    // 외부 API 호출
    const response = await axios.get(`${API_BASE_URL}/consultations/statistics.php`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /consultations/statistics] 성공 - 통계 데이터 조회 완료`);
    
    res.json({
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || '통계 데이터를 조회했습니다.'
    });
    
  } catch (error) {
    handleApiError(error, res, '통계 데이터 조회 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/workers-comp/consultations/bulk-status
 * 상담신청 일괄 상태 변경
 */
router.post('/bulk-status', async (req, res) => {
  try {
    const { consultation_ids, status, memo } = req.body;
    
    // 입력 검증
    if (!Array.isArray(consultation_ids) || consultation_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '변경할 상담신청 ID 목록을 입력해주세요.'
      });
    }

    if (consultation_ids.length > 100) {
      return res.status(400).json({
        success: false,
        error: '한 번에 최대 100건까지 처리할 수 있습니다.'
      });
    }

    if (!status || !status.trim()) {
      return res.status(400).json({
        success: false,
        error: '변경할 상태를 입력해주세요.'
      });
    }

    const validatedStatus = validateStatus(status.trim());
    if (!validatedStatus) {
      return res.status(400).json({
        success: false,
        error: '올바른 상태값을 입력해주세요.'
      });
    }

    // ID 목록 검증
    const validatedIds = [];
    for (const id of consultation_ids) {
      try {
        const validId = validateId(id);
        validatedIds.push(validId);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `잘못된 상담신청 ID가 포함되어 있습니다: ${id}`
        });
      }
    }

    const requestData = {
      consultation_ids: validatedIds,
      status: validatedStatus,
      ...(memo && { memo: memo.toString().trim() }),
      action: 'bulk_update_status'
    };

    console.log(`[POST /consultations/bulk-status] 일괄 상태 변경 요청 - ${validatedIds.length}건, 상태: "${validatedStatus}"`);

    // 외부 API 호출
    const response = await axios.post(`${API_BASE_URL}/consultations/bulk-status-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT * 2, // 일괄 처리는 더 긴 타임아웃
      headers: getDefaultHeaders()
    });

    console.log(`[POST /consultations/bulk-status] 성공 - 일괄 상태 변경 완료`);
    
    const updatedCount = response.data?.updated_count || validatedIds.length;
    
    res.json({
      success: true,
      message: response.data?.message || `${updatedCount}건의 상태가 변경되었습니다.`,
      data: {
        updated_count: updatedCount,
        requested_count: validatedIds.length,
        status: validatedStatus
      }
    });
    
  } catch (error) {
    handleApiError(error, res, '일괄 상태 변경 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/workers-comp/consultations/export-excel
 * 상담신청 엑셀 내보내기
 */
router.get('/export-excel', async (req, res) => {
  try {
    const { 
      search = '', 
      status = '', 
      industry = '', 
      employees = ''
    } = req.query;
    
    // 입력값 검증
    const validatedStatus = validateStatus(status);
    const validatedIndustry = validateIndustry(industry);
    const validatedEmployees = validateEmployees(employees);
    
    const params = new URLSearchParams({
      search: search.toString().trim(),
      ...(validatedStatus && { status: validatedStatus }),
      ...(validatedIndustry && { industry: validatedIndustry }),
      ...(validatedEmployees && { employees: validatedEmployees }),
      format: 'excel'
    });

    console.log('엑셀 다운로드 요청:', Object.fromEntries(params));

    const response = await axios.get(`${API_BASE_URL}/consultations/export-excel.php?${params}`, {
      method: 'GET',
      timeout: DEFAULT_TIMEOUT * 2,
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      responseType: 'stream'
    });

    if (!response.ok && response.status) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 파일명 설정
    const fileName = `상담신청_${new Date().toISOString().slice(0,10)}.xlsx`;
    
    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // 스트림으로 파일 전송
    response.data.pipe(res);

  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    handleApiError(error, res, '엑셀 다운로드 중 오류가 발생했습니다.');
  }
});
// routes/workers-comp/consultations.js 파일에 추가할 라우터

/**
 * PUT /api/workers-comp/consultations/:id/agreement
 * 상담신청 약관동의 상태 변경
 */
router.put('/:id/agreement', async (req, res) => {
  try {
    const consultationId = validateId(req.params.id);
    const { agreement_type, agreement_value } = req.body;
    
    // 약관 유형 검증
    const validAgreementTypes = ['agree_collect', 'agree_third', 'agree_mkt'];
    if (!agreement_type || !validAgreementTypes.includes(agreement_type)) {
      return res.status(400).json({
        success: false,
        error: '올바른 약관 유형을 입력해주세요. (agree_collect, agree_third, agree_mkt)'
      });
    }

    // 동의 상태 검증
    const validAgreedValues = ['Y', 'N'];
    if (!agreement_value || !validAgreedValues.includes(agreement_value)) {
      return res.status(400).json({
        success: false,
        error: '올바른 동의 상태를 입력해주세요. (Y, N)'
      });
    }

    const requestData = {
      consultation_id: consultationId,
      agreement_type: agreement_type,
      agreement_value: agreement_value,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      changed_by: req.session?.user?.name || 'admin' // 세션에서 사용자 정보 가져오기
    };

    console.log(`[PUT /consultations/${consultationId}/agreement] 약관동의 변경 요청 - 상담ID: ${consultationId}, 유형: ${agreement_type}, 동의: ${agreement_value}`);

    // 외부 API 호출
    const response = await axios.put(`${API_BASE_URL}/consultations/consultation-agreement-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[PUT /consultations/${consultationId}/agreement] 성공 - 약관동의 변경 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || '약관동의가 업데이트되었습니다.',
      data: response.data?.data || null
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '약관동의 변경 중 오류가 발생했습니다.');
    }
  }
});

/**
 * GET /api/workers-comp/consultations/:id/agreement-history
 * 상담신청 약관동의 변경이력 조회
 */
router.get('/:id/agreement-history', async (req, res) => {
  try {
    const consultationId = validateId(req.params.id);

    console.log(`[GET /consultations/${consultationId}/agreement-history] 약관동의 이력 조회`);

    const response = await axios.get(`${API_BASE_URL}/consultations/consultation-agreement-history.php`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
      params: { consultation_id: consultationId }
    });

    console.log(`[GET /consultations/${consultationId}/agreement-history] 성공`);
    
    res.json({
      success: true,
      data: response.data?.data || [],
      message: response.data?.message || '약관동의 이력을 조회했습니다.'
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '약관동의 이력 조회 중 오류가 발생했습니다.');
    }
  }
});

// routes/workers-comp/consultations.js 파일 맨 끝 module.exports = router; 바로 앞에 추가

/**
 * GET /api/workers-comp/consultations/:id/history
 * 상담이력 조회
 */
router.get('/:id/history', async (req, res) => {
  try {
    const consultationId = validateId(req.params.id);

    console.log(`[GET /consultations/${consultationId}/history] 상담이력 조회`);

    const response = await axios.get(`${API_BASE_URL}/consultations/consultation-history.php`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
      params: { consultation_id: consultationId }
    });

    console.log(`[GET /consultations/${consultationId}/history] 성공`);
    
    res.json({
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || '상담이력을 조회했습니다.'
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상담이력 조회 중 오류가 발생했습니다.');
    }
  }
});

/**
 * POST /api/workers-comp/consultations/:id/history
 * 상담이력 추가
 */
router.post('/:id/history', async (req, res) => {
  try {
    const consultationId = validateId(req.params.id);
    const { 
      history_date, 
      history_time, 
      contact_method, 
      contact_person, 
      content, 
      result, 
      next_action, 
      next_date, 
      memo 
    } = req.body;

    // 필수 필드 검증
    if (!history_date) {
      return res.status(400).json({
        success: false,
        error: '상담일자를 입력해주세요.'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '상담내용을 입력해주세요.'
      });
    }

    // 날짜 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(history_date)) {
      return res.status(400).json({
        success: false,
        error: '상담일자는 YYYY-MM-DD 형식으로 입력해주세요.'
      });
    }

    // 시간 형식 검증 (선택사항)
    if (history_time && !/^\d{2}:\d{2}$/.test(history_time)) {
      return res.status(400).json({
        success: false,
        error: '상담시간은 HH:MM 형식으로 입력해주세요.'
      });
    }

    // 연락방법 검증
    const validContactMethods = ['phone', 'email', 'visit', 'video', 'other'];
    if (contact_method && !validContactMethods.includes(contact_method)) {
      return res.status(400).json({
        success: false,
        error: '올바른 연락방법을 선택해주세요.'
      });
    }

    // 상담결과 검증
    const validResults = ['completed', 'follow_up', 'no_answer', 'appointment', 'rejected'];
    if (result && !validResults.includes(result)) {
      return res.status(400).json({
        success: false,
        error: '올바른 상담결과를 선택해주세요.'
      });
    }

    // 다음 연락 예정일 형식 검증 (선택사항)
    if (next_date && !/^\d{4}-\d{2}-\d{2}$/.test(next_date)) {
      return res.status(400).json({
        success: false,
        error: '다음 연락 예정일은 YYYY-MM-DD 형식으로 입력해주세요.'
      });
    }

    const requestData = {
      consultation_id: consultationId,
      history_date: history_date,
      history_time: history_time || null,
      contact_method: contact_method || 'phone',
      contact_person: contact_person ? contact_person.trim() : null,
      content: content.trim(),
      result: result || 'completed',
      next_action: next_action ? next_action.trim() : null,
      next_date: next_date || null,
      memo: memo ? memo.trim() : null,
      created_by: req.session?.user?.name || 'admin'
    };

    console.log(`[POST /consultations/${consultationId}/history] 상담이력 추가 요청`);

    const response = await axios.post(`${API_BASE_URL}/consultations/consultation-history-add.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /consultations/${consultationId}/history] 성공 - 상담이력 추가 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || '상담이력이 추가되었습니다.',
      data: response.data?.data || null
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상담이력 추가 중 오류가 발생했습니다.');
    }
  }
});

/**
 * PUT /api/workers-comp/consultations/history/:historyId
 * 상담이력 수정
 */
router.put('/history/:historyId', async (req, res) => {
  try {
    const historyId = validateId(req.params.historyId);
    const { 
      history_date, 
      history_time, 
      contact_method, 
      contact_person, 
      content, 
      result, 
      next_action, 
      next_date, 
      memo 
    } = req.body;

    // 필수 필드 검증
    if (!history_date) {
      return res.status(400).json({
        success: false,
        error: '상담일자를 입력해주세요.'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '상담내용을 입력해주세요.'
      });
    }

    const requestData = {
      history_id: historyId,
      history_date: history_date,
      history_time: history_time || null,
      contact_method: contact_method || 'phone',
      contact_person: contact_person ? contact_person.trim() : null,
      content: content.trim(),
      result: result || 'completed',
      next_action: next_action ? next_action.trim() : null,
      next_date: next_date || null,
      memo: memo ? memo.trim() : null,
      updated_by: req.session?.user?.name || 'admin'
    };

    console.log(`[PUT /consultations/history/${historyId}] 상담이력 수정 요청`);

    const response = await axios.put(`${API_BASE_URL}/consultations/consultation-history-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[PUT /consultations/history/${historyId}] 성공 - 상담이력 수정 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || '상담이력이 수정되었습니다.',
      data: response.data?.data || null
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상담이력 수정 중 오류가 발생했습니다.');
    }
  }
});

/**
 * DELETE /api/workers-comp/consultations/history/:historyId
 * 상담이력 삭제
 */
router.delete('/history/:historyId', async (req, res) => {
  try {
    const historyId = validateId(req.params.historyId);

    console.log(`[DELETE /consultations/history/${historyId}] 상담이력 삭제 요청`);

    const response = await axios.delete(`${API_BASE_URL}/consultations/consultation-history-delete.php`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
      data: { history_id: historyId }
    });

    console.log(`[DELETE /consultations/history/${historyId}] 성공 - 상담이력 삭제 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || '상담이력이 삭제되었습니다.'
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상담이력 삭제 중 오류가 발생했습니다.');
    }
  }
});


/**
 * GET /api/workers-comp/consultations/history/:historyId
 * 상담이력 개별 조회
 */
router.get('/history/:historyId', async (req, res) => {
  try {
    const historyId = validateId(req.params.historyId);

    console.log(`[GET /consultations/history/${historyId}] 상담이력 개별 조회`);

    const response = await axios.get(`${API_BASE_URL}/consultations/consultation-history-detail.php`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
      params: { history_id: historyId }
    });

    console.log(`[GET /consultations/history/${historyId}] 성공`);
    
    res.json({
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || '상담이력을 조회했습니다.'
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상담이력 개별 조회 중 오류가 발생했습니다.');
    }
  }
});
module.exports = router;