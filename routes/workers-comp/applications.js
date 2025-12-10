/**
 * routes/workers-comp/applications.js - 근재보험 가입신청 관리 라우터
 * 경로: routes/workers-comp/applications.js
 * 
 * GET /api/workers-comp/applications - 신청서 리스트 조회
 * GET /api/workers-comp/applications/:id - 특정 신청서 상세 조회
 * PUT /api/workers-comp/applications/:id - 신청서 정보 수정
 * POST /api/workers-comp/applications/:id/status - 상태 변경
 * POST /api/workers-comp/applications/:id/memo - 메모 저장
 * POST /api/workers-comp/applications/bulk-status - 일괄 상태변경
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// 기본 설정
const API_BASE_URL = process.env.WORKERS_COMP_API_URL || 'https://geunjae.kr/api';
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

// 입력 검증 함수
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
  const validStatuses = ['pending', 'reviewing', 'approved', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    throw new Error('올바른 상태값을 입력해주세요.');
  }
  return status;
};

const validateContractType = (contractType) => {
  const validTypes = ['annual', 'project'];
  if (contractType && !validTypes.includes(contractType)) {
    throw new Error('올바른 계약유형을 입력해주세요.');
  }
  return contractType;
};

/**
 * GET /api/workers-comp/applications
 * 근재보험 가입신청 리스트 조회 (페이징, 검색, 필터 지원)
 */
router.get('/applications', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '', 
      contract_type = '', 
      account = '',
      date_from = '',
      date_to = ''
    } = req.query;
    
    // 입력값 검증
    const { page: validatedPage, limit: validatedLimit } = validatePagination(page, limit);
    const validatedStatus = validateStatus(status);
    const validatedContractType = validateContractType(contract_type);
    
    // API 요청 파라미터 구성
    const params = new URLSearchParams({
      page: validatedPage,
      limit: validatedLimit,
      search: search.toString().trim(),
      ...(validatedStatus && { status: validatedStatus }),
      ...(validatedContractType && { contract_type: validatedContractType }),
      ...(account && { account: account.toString().trim() }),
      ...(date_from && { date_from: date_from.toString().trim() }),
      ...(date_to && { date_to: date_to.toString().trim() })
    });

    console.log(`[GET /applications] 요청 - page: ${validatedPage}, limit: ${validatedLimit}, search: "${search}", status: "${validatedStatus}", contract_type: "${validatedContractType}"`);

    // 외부 API 호출 (실제 환경에서는 데이터베이스 직접 조회로 변경)
    const response = await axios.get(`${API_BASE_URL}/workers-comp/list.php?${params}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /applications] 성공 - 총 ${response.data?.pagination?.total_count || 0}개 데이터`);
    
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
    handleApiError(error, res, '신청서 리스트 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/workers-comp/applications/:id
 * 특정 근재보험 가입신청 상세 조회
 */
router.get('/applications/:id', async (req, res) => {
  try {
    const applicationId = validateId(req.params.id);

    console.log(`[GET /applications/${applicationId}] 상세 조회 - 신청서ID: ${applicationId}`);

    // 외부 API 호출 (실제 환경에서는 데이터베이스 직접 조회로 변경)
    const response = await axios.get(`${API_BASE_URL}/workers-comp/detail.php`, {
	  timeout: DEFAULT_TIMEOUT,
	  headers: getDefaultHeaders(),
	  params: {
		id: applicationId
	  }
	});

    console.log(`[GET /applications/${applicationId}] 성공 - 상세정보 조회 완료`);
    
    // 업로드된 파일 정보 파싱
    let uploadedFiles = [];
    if (response.data?.uploaded_files) {
      try {
        if (typeof response.data.uploaded_files === 'string') {
          const parsed = JSON.parse(response.data.uploaded_files);
          uploadedFiles = parsed.files || [];
        } else if (Array.isArray(response.data.uploaded_files)) {
          uploadedFiles = response.data.uploaded_files;
        }
      } catch (parseError) {
        console.warn('파일 정보 파싱 오류:', parseError);
      }
    }
    
    // 응답 데이터 구조화
    const responseData = {
		  success: true,
		  data: {
			...response.data.data,  // response.data.data로 실제 데이터만 추출
			uploaded_files_parsed: uploadedFiles
		  }
		};
    
    res.json(responseData);
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '신청서 상세 조회 중 오류가 발생했습니다.');
    }
  }
});

/**
 * PUT /api/workers-comp/applications/:id
 * 근재보험 가입신청 정보 수정
 */
router.put('/applications/:id', async (req, res) => {
  try {
    const applicationId = validateId(req.params.id);
   const { 
	 company_name,
	  contact_name, 
	  phone,
	  email,
	  business_number,        // 추가
	  contract_type,          // 추가
	  labor_cost,            // 추가
	  project_duration,      // 추가
	  site_name,             // 추가
	  premium_amount, 
	  policy_number, 
	  insurance_start_date, 
	  insurance_end_date, 
	  memo,
	  insurance_company,
	  account_directory
	} = req.body;

    // 수정 가능한 필드만 구성
    const updateData = { 
      id: applicationId 
    };
    // 보험사
	if (insurance_company !== undefined) {
	  updateData.insurance_company = insurance_company ? insurance_company.toString().trim() : null;
	  if (updateData.insurance_company && updateData.insurance_company.length > 100) {
		return res.status(400).json({
		  success: false,
		  error: '보험사명은 100자 이내로 입력해주세요.'
		});
	  }
	}
	// 기본정보 필드들도 updateData에 포함
		if (company_name !== undefined) {
		  updateData.company_name = company_name ? company_name.toString().trim() : null;
		}

		if (contact_name !== undefined) {
		  updateData.contact_name = contact_name ? contact_name.toString().trim() : null;
		}
		
		// 연락처
		if (phone !== undefined) {
		  updateData.phone = phone ? phone.toString().trim() : null;
		  if (updateData.phone && updateData.phone.length > 20) {
			return res.status(400).json({
			  success: false,
			  error: '연락처는 20자 이내로 입력해주세요.'
			});
		  }
		}

	// 이메일
	if (email !== undefined) {
	  updateData.email = email ? email.toString().trim() : null;
	  if (updateData.email) {
		// 이메일 형식 검증
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(updateData.email)) {
		  return res.status(400).json({
			success: false,
			error: '올바른 이메일 형식을 입력해주세요.'
		  });
		}
		if (updateData.email.length > 100) {
		  return res.status(400).json({
			success: false,
			error: '이메일은 100자 이내로 입력해주세요.'
		  });
		}
	  }
	}
    if (premium_amount !== undefined) {
      const cleanAmount = premium_amount ? premium_amount.toString().replace(/[^0-9]/g, '') : null;
      if (cleanAmount && !isNaN(parseInt(cleanAmount))) {
        updateData.premium_amount = parseInt(cleanAmount);
      } else if (premium_amount === null || premium_amount === '') {
        updateData.premium_amount = null;
      }
    }
    
    if (policy_number !== undefined) {
      updateData.policy_number = policy_number ? policy_number.toString().trim() : null;
      if (updateData.policy_number && updateData.policy_number.length > 50) {
        return res.status(400).json({
          success: false,
          error: '증권번호는 50자 이내로 입력해주세요.'
        });
      }
    }
	
	// 사업자번호
		if (business_number !== undefined) {
		  updateData.business_number = business_number ? business_number.toString().trim() : null;
		}

		// 계약유형
		if (contract_type !== undefined) {
		  const validatedContractType = validateContractType(contract_type);
		  updateData.contract_type = validatedContractType;
		}

		// 현장명
		if (site_name !== undefined) {
		  updateData.site_name = site_name ? site_name.toString().trim() : null;
		}

		// 공사기간
		if (project_duration !== undefined) {
		  const cleanDuration = project_duration ? parseInt(project_duration) : null;
		  if (cleanDuration && cleanDuration > 0) {
			updateData.project_duration = cleanDuration;
		  } else if (project_duration === null || project_duration === '') {
			updateData.project_duration = null;
		  }
		}

		// 인건비
		if (labor_cost !== undefined) {
		  const cleanCost = labor_cost ? labor_cost.toString().replace(/[^0-9]/g, '') : null;
		  if (cleanCost && !isNaN(parseInt(cleanCost))) {
			updateData.labor_cost = parseInt(cleanCost);
		  } else if (labor_cost === null || labor_cost === '') {
			updateData.labor_cost = null;
		  }
		}
    
    if (insurance_start_date !== undefined) {
      if (insurance_start_date && !/^\d{4}-\d{2}-\d{2}$/.test(insurance_start_date)) {
        return res.status(400).json({
          success: false,
          error: '보험시작일은 YYYY-MM-DD 형식으로 입력해주세요.'
        });
      }
      updateData.insurance_start_date = insurance_start_date || null;
    }
    
    if (insurance_end_date !== undefined) {
      if (insurance_end_date && !/^\d{4}-\d{2}-\d{2}$/.test(insurance_end_date)) {
        return res.status(400).json({
          success: false,
          error: '보험종료일은 YYYY-MM-DD 형식으로 입력해주세요.'
        });
      }
      updateData.insurance_end_date = insurance_end_date || null;
    }
    
    if (memo !== undefined) {
      updateData.memo = memo ? memo.toString().trim() : null;
      if (updateData.memo && updateData.memo.length > 5000) {
        return res.status(400).json({
          success: false,
          error: '메모는 5,000자 이내로 입력해주세요.'
        });
      }
    }
    
    if (account_directory !== undefined) {
      updateData.account_directory = account_directory ? account_directory.toString().trim() : 'workers-comp';
    }

    console.log(`[PUT /applications/${applicationId}] 정보 수정 요청 - 신청서ID: ${applicationId}`);

    // 외부 API 호출 (실제 환경에서는 데이터베이스 직접 수정으로 변경)
    const response = await axios.put(`${API_BASE_URL}/workers-comp/update.php`, updateData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[PUT /applications/${applicationId}] 성공 - 정보 수정 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || '신청서 정보가 수정되었습니다.',
      data: response.data?.data || null
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '신청서 정보 수정 중 오류가 발생했습니다.');
    }
  }
});

/**
 * POST /api/workers-comp/applications/:id/status
 * 근재보험 가입신청 상태 변경
 */
router.post('/applications/:id/status', async (req, res) => {
  try {
    const applicationId = validateId(req.params.id);
    const { status, old_status, reason } = req.body;
    
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
        error: '올바른 상태값을 입력해주세요. (pending, reviewing, approved, rejected)'
      });
    }

    const requestData = {
      application_id: applicationId,
      status: validatedStatus,
      ...(old_status && { old_status: old_status.trim() }),
      ...(reason && { reason: reason.toString().trim() }),
      action: 'update_status'
    };

    console.log(`[POST /applications/${applicationId}/status] 상태 변경 요청 - 신청서ID: ${applicationId}, 상태: "${validatedStatus}"`);

    // 외부 API 호출 (실제 환경에서는 데이터베이스 직접 수정으로 변경)
    const response = await axios.post(`${API_BASE_URL}/workers-comp/status-update`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /applications/${applicationId}/status] 성공 - 상태 변경 완료`);
    
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
 * POST /api/workers-comp/applications/:id/memo
 * 근재보험 가입신청 메모 저장
 */
router.post('/applications/:id/memo', async (req, res) => {
  try {
    const applicationId = validateId(req.params.id);
    let { memo } = req.body;

    // 메모 검증 및 정제
    memo = (typeof memo === 'string') ? memo : '';
    memo = memo.replace(/[^\S\r\n]*$/g, '');         // 말미 공백 정리
    memo = memo.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // 제어문자 제거
    
    if (memo.length > 5000) {
      return res.status(400).json({
        success: false,
        error: '메모는 5,000자 이내로 입력해주세요.'
      });
    }

    const requestData = {
      application_id: applicationId,
      memo,
      action: 'update_memo'
    };

    console.log(`[POST /applications/${applicationId}/memo] 메모 저장 요청 - 신청서ID: ${applicationId}, 길이: ${memo.length}`);

    // 외부 API 호출 (실제 환경에서는 데이터베이스 직접 수정으로 변경)
    const response = await axios.post(`${API_BASE_URL}/workers-comp/memo-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /applications/${applicationId}/memo] 성공 - 메모 저장 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || '메모가 저장되었습니다.',
      data: response.data?.data || null
    });

  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '메모 저장 중 오류가 발생했습니다.');
    }
  }
});

/**
 * POST /api/workers-comp/applications/bulk-status
 * 근재보험 가입신청 일괄 상태 변경
 */
router.post('/applications/bulk-status', async (req, res) => {
  try {
    const { application_ids, status, memo } = req.body;
    
    // 입력 검증
    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '변경할 신청서 ID 목록을 입력해주세요.'
      });
    }

    if (application_ids.length > 100) {
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
    for (const id of application_ids) {
      try {
        const validId = validateId(id);
        validatedIds.push(validId);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `잘못된 신청서 ID가 포함되어 있습니다: ${id}`
        });
      }
    }

    const requestData = {
      application_ids: validatedIds,
      status: validatedStatus,
      ...(memo && { memo: memo.toString().trim() }),
      action: 'bulk_update_status'
    };

    console.log(`[POST /applications/bulk-status] 일괄 상태 변경 요청 - ${validatedIds.length}건, 상태: "${validatedStatus}"`);

    // 외부 API 호출 (실제 환경에서는 데이터베이스 직접 수정으로 변경)
    const response = await axios.post(`${API_BASE_URL}/workers-comp/bulk-status-update`, requestData, {
      timeout: DEFAULT_TIMEOUT * 2, // 일괄 처리는 더 긴 타임아웃
      headers: getDefaultHeaders()
    });

    console.log(`[POST /applications/bulk-status] 성공 - 일괄 상태 변경 완료`);
    
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
 * GET /api/workers-comp/applications/:id/status-history
 * 근재보험 가입신청 상태 변경 이력 조회
 */
router.get('/applications/:id/status-history', async (req, res) => {
  try {
    const applicationId = validateId(req.params.id);

    console.log(`[GET /applications/${applicationId}/status-history] 상태 이력 조회 - 신청서ID: ${applicationId}`);

    // 외부 API 호출 (실제 환경에서는 데이터베이스 직접 조회로 변경)
    const response = await axios.get(`${API_BASE_URL}/workers-comp/status-history/${applicationId}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /applications/${applicationId}/status-history] 성공 - 상태 이력 조회 완료`);
    
    res.json({
      success: true,
      data: response.data?.data || [],
      message: response.data?.message || '상태 이력을 조회했습니다.'
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '상태 이력 조회 중 오류가 발생했습니다.');
    }
  }
});

/**
 * DELETE /api/workers-comp/applications/:id
 * 근재보험 가입신청 삭제 (관리자용)
 */
router.delete('/applications/:id', async (req, res) => {
  try {
    const applicationId = validateId(req.params.id);
    
    // TODO: 관리자 권한 확인
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     error: '삭제 권한이 없습니다.'
    //   });
    // }

    console.log(`[DELETE /applications/${applicationId}] 삭제 요청 - 신청서ID: ${applicationId}`);

    // 외부 API 호출 (실제 환경에서는 데이터베이스 직접 삭제로 변경)
    const response = await axios.delete(`${API_BASE_URL}/workers-comp/delete/${applicationId}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[DELETE /applications/${applicationId}] 성공 - 삭제 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || '신청서가 삭제되었습니다.'
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '신청서 삭제 중 오류가 발생했습니다.');
    }
  }
});

/**
 * GET /api/workers-comp/accounts
 * 근재보험 거래처 목록 조회
 */
router.get('/accounts', async (req, res) => {
  try {
    console.log('[GET /accounts] 거래처 목록 조회 요청');

    // 외부 API 호출
    const response = await axios.get(`${API_BASE_URL}/workers-comp/accounts.php`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /accounts] 성공 - ${response.data?.data?.length || 0}개 거래처`);
    
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '거래처 목록 조회 중 오류가 발생했습니다.');
  }
});
/**
 * POST /api/workers-comp/applications/:id/agreement
 * 근재보험 가입신청 약관동의 상태 변경
 */
router.post('/applications/:id/agreement', async (req, res) => {
  try {
    const applicationId = validateId(req.params.id);
    const { agreement_type, agreed } = req.body;
    
    // 약관 유형 검증
    const validAgreementTypes = ['collect', 'third', 'mkt'];
    if (!agreement_type || !validAgreementTypes.includes(agreement_type)) {
      return res.status(400).json({
        success: false,
        error: '올바른 약관 유형을 입력해주세요. (collect, third, mkt)'
      });
    }

    // 동의 상태 검증
    const validAgreedValues = ['Y', 'N'];
    if (!agreed || !validAgreedValues.includes(agreed)) {
      return res.status(400).json({
        success: false,
        error: '올바른 동의 상태를 입력해주세요. (Y, N)'
      });
    }

    const requestData = {
		  ...req.body,  // 프론트엔드에서 온 모든 데이터 포함
		  application_id: applicationId,
		  ip_address: req.ip || req.connection.remoteAddress,
		  user_agent: req.get('User-Agent')
		};

    console.log(`[POST /applications/${applicationId}/agreement] 약관동의 변경 요청 - 신청서ID: ${applicationId}, 유형: ${agreement_type}, 동의: ${agreed}`);

    // 외부 API 호출 (실제 환경에서는 데이터베이스 직접 수정으로 변경)
    const response = await axios.post(`${API_BASE_URL}/workers-comp/agreement-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /applications/${applicationId}/agreement] 성공 - 약관동의 변경 완료`);
    
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
 * GET /api/workers-comp/applications/:id/agreement-history
 * 근재보험 가입신청 약관동의 변경이력 조회
 */
router.get('/applications/:id/agreement-history', async (req, res) => {
  try {
    const applicationId = validateId(req.params.id);

    console.log(`[GET /applications/${applicationId}/agreement-history] 약관동의 이력 조회`);

    const response = await axios.get(`${API_BASE_URL}/workers-comp/agreement-history.php`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
      params: { id: applicationId }
    });

    console.log(`[GET /applications/${applicationId}/agreement-history] 성공`);
    
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


/**
 * PATCH /api/workers-comp/applications/:id/contract-type
 * 근재보험 가입신청 계약유형만 변경
 */
router.patch('/applications/:id/contract-type', async (req, res) => {
  try {
    const applicationId = validateId(req.params.id);
    const { contract_type } = req.body;
    
    if (!contract_type) {
      return res.status(400).json({
        success: false,
        error: '계약유형을 입력해주세요.'
      });
    }
    
    const validatedContractType = validateContractType(contract_type);
    if (!validatedContractType) {
      return res.status(400).json({
        success: false,
        error: '올바른 계약유형을 입력해주세요. (annual, project)'
      });
    }
    
    const requestData = {
      id: applicationId,
      contract_type: validatedContractType
    };
    
    console.log(`[PATCH /applications/${applicationId}/contract-type] 계약유형 변경 요청 - ${validatedContractType}`);
    
    // 전용 API 호출로 변경
    const response = await axios.put(`${API_BASE_URL}/workers-comp/contract-type-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });
    
    console.log(`[PATCH /applications/${applicationId}/contract-type] 성공 - 계약유형 변경 완료`);
    
    res.json({
      success: true,
      message: response.data?.message || `계약유형이 "${validatedContractType === 'annual' ? '연간계약' : '구간계약'}"으로 변경되었습니다.`,
      data: response.data?.data || { contract_type: validatedContractType }
    });
    
  } catch (error) {
    if (error.message.includes('올바른 ID')) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      handleApiError(error, res, '계약유형 변경 중 오류가 발생했습니다.');
    }
  }
});
module.exports = router;