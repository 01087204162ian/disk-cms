/**
 * routes/pharmacy/reports.js - 실적 관리 프록시 라우터
 * 경로: routes/pharmacy/reports.js
 * 
 * GET /api/pharmacy-reports/daily - 일별 실적 조회
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

/**
 * GET /api/pharmacy-reports/daily
 * 일별 실적 조회
 * 프록시 대상: pharmacy-daily-report.php
 * 
 * Query Params:
 * - account: 거래처 번호 (선택, 전체는 빈값)
 * - year: 년도 (필수)
 * - month: 월 (선택, 빈값이면 최근 30일)
 */
router.get('/daily', async (req, res) => {
  try {
    const { account = '', year = '', month = '' } = req.query;
    
    // 년도 검증 (필수)
    if (!year || !year.trim()) {
      return res.status(400).json({
        success: false,
        error: '년도를 입력해주세요.'
      });
    }

    const validYear = parseInt(year);
    if (isNaN(validYear) || validYear < 2000 || validYear > 2100) {
      return res.status(400).json({
        success: false,
        error: '올바른 년도를 입력해주세요. (2000-2100)'
      });
    }

    // 월 검증 (선택)
    let validMonth = '';
    if (month && month.trim()) {
      const monthNum = parseInt(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          error: '올바른 월을 입력해주세요. (1-12)'
        });
      }
      validMonth = monthNum;
    }

    // 거래처 검증 (선택)
    let validAccount = '';
    if (account && account.trim()) {
      const accountNum = parseInt(account);
      if (isNaN(accountNum) || accountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: '올바른 거래처 번호를 입력해주세요.'
        });
      }
      validAccount = accountNum;
    }

    // 쿼리 파라미터 구성
    const params = new URLSearchParams({
      year: validYear
    });

    if (validMonth) {
      params.append('month', validMonth);
    }

    if (validAccount) {
      params.append('account', validAccount);
    }

    console.log(`[GET /daily] 일별 실적 조회 요청 - 년도: ${validYear}, 월: ${validMonth || '전체(최근30일)'}, 거래처: ${validAccount || '전체'}`);

    // PHP API 호출
    const response = await axios.get(
      `${PHP_API_BASE_URL}/pharmacy-daily-report.php?${params}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /daily] 성공 - 일별 실적 조회 완료`);
    
    // 응답 데이터 정리
    const responseData = {
      success: true,
      data: response.data.data || response.data.list || [],
      summary: response.data.summary || {
        total_approval_count: 0,
        total_approval_amount: 0,
        total_cancel_count: 0,
        total_cancel_amount: 0
      },
      message: response.data.message || '일별 실적 조회가 완료되었습니다.'
    };
    
    res.json(responseData);
    
  } catch (error) {
    console.error(`[GET /daily] 오류:`, error.message);
    handleApiError(error, res, '일별 실적 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/pharmacy-reports/monthly
 * 월별 실적 조회 (선택적 구현)
 * 프록시 대상: pharmacy-monthly-report.php
 */
router.get('/monthly', async (req, res) => {
  try {
    const { account = '', year = '' } = req.query;
    
    // 년도 검증
    if (!year || !year.trim()) {
      return res.status(400).json({
        success: false,
        error: '년도를 입력해주세요.'
      });
    }

    const validYear = parseInt(year);
    if (isNaN(validYear) || validYear < 2000 || validYear > 2100) {
      return res.status(400).json({
        success: false,
        error: '올바른 년도를 입력해주세요. (2000-2100)'
      });
    }

    // 거래처 검증 (선택)
    let validAccount = '';
    if (account && account.trim()) {
      const accountNum = parseInt(account);
      if (isNaN(accountNum) || accountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: '올바른 거래처 번호를 입력해주세요.'
        });
      }
      validAccount = accountNum;
    }

    const params = new URLSearchParams({ year: validYear });
    if (validAccount) {
      params.append('account', validAccount);
    }

    console.log(`[GET /monthly] 월별 실적 조회 요청 - 년도: ${validYear}, 거래처: ${validAccount || '전체'}`);

    // PHP API 호출
    const response = await axios.get(
      `${PHP_API_BASE_URL}/pharmacy-monthly-report.php?${params}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /monthly] 성공 - 월별 실적 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[GET /monthly] 오류:`, error.message);
    handleApiError(error, res, '월별 실적 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/pharmacy-reports/statistics
 * 통계 조회 (선택적 구현)
 */
router.get('/statistics', async (req, res) => {
  try {
    const { account = '', start_date = '', end_date = '' } = req.query;
    
    // 거래처 검증 (선택)
    let validAccount = '';
    if (account && account.trim()) {
      const accountNum = parseInt(account);
      if (isNaN(accountNum) || accountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: '올바른 거래처 번호를 입력해주세요.'
        });
      }
      validAccount = accountNum;
    }

    const params = new URLSearchParams();
    if (validAccount) params.append('account', validAccount);
    if (start_date && start_date.trim()) params.append('start_date', start_date.trim());
    if (end_date && end_date.trim()) params.append('end_date', end_date.trim());

    console.log(`[GET /statistics] 통계 조회 요청`);

    // PHP API 호출
    const response = await axios.get(
      `${PHP_API_BASE_URL}/pharmacy-statistics.php?${params}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /statistics] 성공 - 통계 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[GET /statistics] 오류:`, error.message);
    handleApiError(error, res, '통계 조회 중 오류가 발생했습니다.');
  }
});

module.exports = router;