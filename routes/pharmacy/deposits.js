/**
 * routes/pharmacy/deposits.js - 예치금 관리 프록시 라우터
 * 경로: routes/pharmacy/deposits.js
 * 
 * GET /api/pharmacy-deposits/balance/:accountNum - 예치 잔액 조회
 * GET /api/pharmacy-deposits/list/:accountNum - 예치금 리스트 조회
 * POST /api/pharmacy-deposits/deposit - 예치금 입금
 * GET /api/pharmacy-deposits/usage/:accountNum - 사용 내역 조회
 * GET /api/pharmacy-deposits/summary - 전체 예치금 현황 (관리자용)
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
    // PHP API에서 에러 응답이 온 경우
    res.status(error.response.status).json(error.response.data);
  } else if (error.code === 'ECONNABORTED') {
    // 타임아웃 에러
    res.status(408).json({
      success: false,
      error: '요청 시간이 초과되었습니다.'
    });
  } else {
    // 네트워크 오류 등
    res.status(500).json({
      success: false,
      error: defaultMessage
    });
  }
};

/**
 * GET /api/pharmacy-deposits/balance/:accountNum
 * 특정 거래처의 예치 잔액 조회
 * 프록시 대상: pharmacy-deposit-balance.php
 */
router.get('/balance/:accountNum', async (req, res) => {
  try {
    const { accountNum } = req.params;
    
    // accountNum 검증
    const validAccountNum = parseInt(accountNum);
    if (!validAccountNum || validAccountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 거래처 번호를 입력해주세요.'
      });
    }

    console.log(`[GET /balance/${accountNum}] 예치 잔액 조회 요청 - 거래처번호: ${validAccountNum}`);

    // PHP API 호출
    const response = await axios.get(
      `${PHP_API_BASE_URL}/pharmacy-deposit-balance.php?account_num=${validAccountNum}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /balance/${accountNum}] 성공 - 예치 잔액 조회 완료`);
    
    // 응답 데이터 정리
    const responseData = {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || '예치 잔액 조회가 완료되었습니다.'
    };
    
    res.json(responseData);
    
  } catch (error) {
    console.error(`[GET /balance/${req.params.accountNum}] 오류:`, error.message);
    handleApiError(error, res, '예치 잔액 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/pharmacy-deposits/list/:accountNum
 * 특정 거래처의 예치금 입금 리스트 조회 (페이징 지원)
 * 프록시 대상: pharmacy-deposit-list.php
 */
router.get('/list/:accountNum', async (req, res) => {
  try {
    const { accountNum } = req.params;
    const { page = 1, limit = 20, start_date = '', end_date = '' } = req.query;
    
    // accountNum 검증
    const validAccountNum = parseInt(accountNum);
    if (!validAccountNum || validAccountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 거래처 번호를 입력해주세요.'
      });
    }

    // 페이지 파라미터 검증
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // 쿼리 파라미터 구성
    const params = new URLSearchParams({
      account_num: validAccountNum,
      page: validatedPage,
      limit: validatedLimit
    });

    // 날짜 필터 추가 (선택적)
    if (start_date && start_date.trim()) {
      params.append('start_date', start_date.trim());
    }
    if (end_date && end_date.trim()) {
      params.append('end_date', end_date.trim());
    }

    console.log(`[GET /list/${accountNum}] 예치금 리스트 조회 요청 - 거래처번호: ${validAccountNum}, page: ${validatedPage}, limit: ${validatedLimit}`);

    // PHP API 호출
    const response = await axios.get(
      `${PHP_API_BASE_URL}/pharmacy-deposit-list.php?${params}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /list/${accountNum}] 성공 - 예치금 리스트 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[GET /list/${req.params.accountNum}] 오류:`, error.message);
    handleApiError(error, res, '예치금 리스트 조회 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/pharmacy-deposits/deposit
 * 예치금 입금 등록
 * 프록시 대상: pharmacy-deposit-add.php
 */
router.post('/deposit', async (req, res) => {
  try {
    const { account_num, amount, deposit_date, memo = '' } = req.body;
    
    // 필수 필드 검증
    if (!account_num) {
      return res.status(400).json({
        success: false,
        error: '거래처 번호가 필요합니다.'
      });
    }

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({
        success: false,
        error: '올바른 금액을 입력해주세요.'
      });
    }

    if (!deposit_date || !deposit_date.trim()) {
      return res.status(400).json({
        success: false,
        error: '입금일이 필요합니다.'
      });
    }

    // account_num 검증
    const validAccountNum = parseInt(account_num);
    if (!validAccountNum || validAccountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 거래처 번호를 입력해주세요.'
      });
    }

    // amount 검증
    const validAmount = parseFloat(amount);
    if (isNaN(validAmount) || validAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: '금액은 0보다 큰 숫자로 입력해주세요.'
      });
    }

    // deposit_date 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(deposit_date.trim())) {
      return res.status(400).json({
        success: false,
        error: '입금일은 YYYY-MM-DD 형식으로 입력해주세요.'
      });
    }

    // memo 길이 제한
    const trimmedMemo = memo.toString().trim();
    if (trimmedMemo.length > 500) {
      return res.status(400).json({
        success: false,
        error: '메모는 500자 이내로 입력해주세요.'
      });
    }

    const requestData = {
      account_num: validAccountNum,
      amount: validAmount,
      deposit_date: deposit_date.trim(),
      memo: trimmedMemo,
      action: 'add_deposit'
    };

    console.log(`[POST /deposit] 예치금 입금 등록 요청 - 거래처번호: ${validAccountNum}, 금액: ${validAmount.toLocaleString()}원, 입금일: ${deposit_date.trim()}`);

    // PHP API 호출
    const response = await axios.post(
      `${PHP_API_BASE_URL}/pharmacy-deposit-add.php`,
      requestData,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[POST /deposit] 성공 - 예치금 입금 등록 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[POST /deposit] 오류:`, error.message);
    handleApiError(error, res, '예치금 입금 등록 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/pharmacy-deposits/usage/:accountNum
 * 특정 거래처의 예치금 사용 내역 조회 (페이징 지원)
 * 프록시 대상: pharmacy-deposit-usage.php
 */
router.get('/usage/:accountNum', async (req, res) => {
  try {
    const { accountNum } = req.params;
    const { page = 1, limit = 20, start_date = '', end_date = '' } = req.query;
    
    // accountNum 검증
    const validAccountNum = parseInt(accountNum);
    if (!validAccountNum || validAccountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 거래처 번호를 입력해주세요.'
      });
    }

    // 페이지 파라미터 검증
    const validatedPage = Math.max(1, parseInt(page) || 1);
   const validatedLimit = Math.min(10000, Math.max(1, parseInt(limit) || 20));

    // 쿼리 파라미터 구성
    const params = new URLSearchParams({
      account_num: validAccountNum,
      page: validatedPage,
      limit: validatedLimit
    });

    // 날짜 필터 추가 (선택적)
    if (start_date && start_date.trim()) {
      params.append('start_date', start_date.trim());
    }
    if (end_date && end_date.trim()) {
      params.append('end_date', end_date.trim());
    }

    console.log(`[GET /usage/${accountNum}] 사용 내역 조회 요청 - 거래처번호: ${validAccountNum}, page: ${validatedPage}, limit: ${validatedLimit}`);

    // PHP API 호출
    const response = await axios.get(
      `${PHP_API_BASE_URL}/pharmacy-deposit-usage.php?${params}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /usage/${accountNum}] 성공 - 사용 내역 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[GET /usage/${req.params.accountNum}] 오류:`, error.message);
    handleApiError(error, res, '사용 내역 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/pharmacy-deposits/summary
 * 전체 거래처 예치금 현황 조회 (관리자용)
 * 프록시 대상: pharmacy-deposit-summary.php
 */
router.get('/summary', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    // 페이지 파라미터 검증
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(10000, Math.max(1, parseInt(limit) || 20));

    // 쿼리 파라미터 구성
    const params = new URLSearchParams({
      page: validatedPage,
      limit: validatedLimit,
      search: search.toString().trim()
    });

    console.log(`[GET /summary] 전체 예치금 현황 조회 요청 - page: ${validatedPage}, limit: ${validatedLimit}, search: "${search}"`);

    // PHP API 호출
    const response = await axios.get(
      `${PHP_API_BASE_URL}/pharmacy-deposit-summary.php?${params}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /summary] 성공 - 전체 예치금 현황 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[GET /summary] 오류:`, error.message);
    handleApiError(error, res, '전체 예치금 현황 조회 중 오류가 발생했습니다.');
  }
});

/**
 * PUT /api/pharmacy-deposits/deposit/:depositId
 * 예치금 정보 수정 (선택적 구현)
 * 프록시 대상: pharmacy-deposit-update.php
 */
router.put('/deposit/:depositId', async (req, res) => {
  try {
    const { depositId } = req.params;
    const { amount, deposit_date, memo } = req.body;
    
    // depositId 검증
    const validDepositId = parseInt(depositId);
    if (!validDepositId || validDepositId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 예치금 ID를 입력해주세요.'
      });
    }

    // 수정할 데이터 구성
    const updateData = { deposit_id: validDepositId };

    if (amount !== undefined) {
      const validAmount = parseFloat(amount);
      if (isNaN(validAmount) || validAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: '금액은 0보다 큰 숫자로 입력해주세요.'
        });
      }
      updateData.amount = validAmount;
    }

    if (deposit_date !== undefined && deposit_date.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(deposit_date.trim())) {
        return res.status(400).json({
          success: false,
          error: '입금일은 YYYY-MM-DD 형식으로 입력해주세요.'
        });
      }
      updateData.deposit_date = deposit_date.trim();
    }

    if (memo !== undefined) {
      const trimmedMemo = memo.toString().trim();
      if (trimmedMemo.length > 500) {
        return res.status(400).json({
          success: false,
          error: '메모는 500자 이내로 입력해주세요.'
        });
      }
      updateData.memo = trimmedMemo;
    }

    console.log(`[PUT /deposit/${depositId}] 예치금 정보 수정 요청 - 예치금ID: ${validDepositId}`);

    // PHP API 호출
    const response = await axios.put(
      `${PHP_API_BASE_URL}/pharmacy-deposit-update.php`,
      updateData,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[PUT /deposit/${depositId}] 성공 - 예치금 정보 수정 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[PUT /deposit/${req.params.depositId}] 오류:`, error.message);
    handleApiError(error, res, '예치금 정보 수정 중 오류가 발생했습니다.');
  }
});

/**
 * DELETE /api/pharmacy-deposits/deposit/:depositId
 * 예치금 삭제 (선택적 구현)
 * 프록시 대상: pharmacy-deposit-delete.php
 */
router.delete('/deposit/:depositId', async (req, res) => {
  try {
    const { depositId } = req.params;
    
    // depositId 검증
    const validDepositId = parseInt(depositId);
    if (!validDepositId || validDepositId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 예치금 ID를 입력해주세요.'
      });
    }

    console.log(`[DELETE /deposit/${depositId}] 예치금 삭제 요청 - 예치금ID: ${validDepositId}`);

    // PHP API 호출
    const response = await axios.delete(
      `${PHP_API_BASE_URL}/pharmacy-deposit-delete.php?deposit_id=${validDepositId}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[DELETE /deposit/${depositId}] 성공 - 예치금 삭제 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[DELETE /deposit/${req.params.depositId}] 오류:`, error.message);
    handleApiError(error, res, '예치금 삭제 중 오류가 발생했습니다.');
  }
});

module.exports = router;