/**
 * ================================================================
 * 공휴일 관리 API 라우터
 * ================================================================
 * 
 * 주요 기능:
 * - 공휴일 목록 조회
 * - 공휴일 추가
 * - 공휴일 수정
 * - 공휴일 삭제 (비활성화)
 * - 대체 공휴일 자동 생성
 * 
 * Created: 2025-12-28
 * Version: 1.0.0
 * ================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const { requireAuth, requireRole } = require('../../middleware/auth');

/**
 * 날짜 포맷팅 함수
 */
function formatDate(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 주말(토, 일)인지 확인
 */
function isWeekend(date) {
  const d = date instanceof Date ? date : new Date(date);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0=일요일, 6=토요일
}

/**
 * 다음 평일 찾기
 */
function getNextWeekday(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  while (isWeekend(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/**
 * 공휴일 목록 조회
 * GET /api/staff/holidays?year=2026&startDate=2026-01-01&endDate=2026-12-31
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { year, startDate, endDate } = req.query;
    
    let query = 'SELECT id, holiday_date, name, year, is_active, created_at, updated_at FROM holidays WHERE 1=1';
    const params = [];
    
    if (year) {
      query += ' AND year = ?';
      params.push(parseInt(year));
    }
    
    if (startDate) {
      query += ' AND holiday_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND holiday_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY holiday_date ASC';
    
    const [rows] = await pool.execute(query, params);
    
    const holidays = rows.map(row => ({
      id: row.id,
      date: formatDate(row.holiday_date),
      name: row.name,
      year: row.year,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: holidays
    });
  } catch (error) {
    console.error('공휴일 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '공휴일 목록을 조회하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 공휴일 추가
 * POST /api/staff/holidays
 * Body: { date: '2026-01-01', name: '신정', year: 2026 }
 */
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { date, name, year } = req.body;
    
    if (!date || !name || !year) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다. (date, name, year)'
      });
    }
    
    // 날짜 유효성 검사
    const holidayDate = new Date(date);
    if (isNaN(holidayDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 날짜 형식입니다.'
      });
    }
    
    // 연도 일치 확인
    const dateYear = holidayDate.getFullYear();
    if (dateYear !== parseInt(year)) {
      return res.status(400).json({
        success: false,
        message: '날짜와 연도가 일치하지 않습니다.'
      });
    }
    
    // 중복 확인
    const [existing] = await pool.execute(
      'SELECT id FROM holidays WHERE holiday_date = ?',
      [date]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: '해당 날짜의 공휴일이 이미 존재합니다.'
      });
    }
    
    // 공휴일 추가
    const [result] = await pool.execute(
      'INSERT INTO holidays (holiday_date, name, year, is_active) VALUES (?, ?, ?, 1)',
      [date, name, parseInt(year)]
    );
    
    res.json({
      success: true,
      message: '공휴일이 추가되었습니다.',
      data: {
        id: result.insertId,
        date,
        name,
        year: parseInt(year)
      }
    });
  } catch (error) {
    console.error('공휴일 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '공휴일을 추가하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 공휴일 수정
 * PUT /api/staff/holidays/:id
 * Body: { name: '신정', isActive: true }
 */
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 필드가 없습니다.'
      });
    }
    
    params.push(id);
    
    await pool.execute(
      `UPDATE holidays SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({
      success: true,
      message: '공휴일이 수정되었습니다.'
    });
  } catch (error) {
    console.error('공휴일 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '공휴일을 수정하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 공휴일 삭제 (비활성화)
 * DELETE /api/staff/holidays/:id
 */
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE holidays SET is_active = 0 WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: '공휴일이 삭제(비활성화)되었습니다.'
    });
  } catch (error) {
    console.error('공휴일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '공휴일을 삭제하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 대체 공휴일 자동 생성
 * POST /api/staff/holidays/generate-substitute
 * Body: { year: 2026 }
 * 
 * 주말에 있는 공휴일의 경우 다음 평일을 대체 공휴일로 자동 생성
 * 1년 이내의 날짜만 생성
 */
router.post('/generate-substitute', requireAuth, requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { year } = req.body;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: '연도를 입력해주세요.'
      });
    }
    
    const targetYear = parseInt(year);
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);
    
    // 해당 연도의 모든 공휴일 조회
    const [holidays] = await pool.execute(
      'SELECT id, holiday_date, name, year FROM holidays WHERE year = ? AND is_active = 1 ORDER BY holiday_date ASC',
      [targetYear]
    );
    
    const generated = [];
    const errors = [];
    
    for (const holiday of holidays) {
      const holidayDate = new Date(holiday.holiday_date);
      
      // 주말인지 확인
      if (isWeekend(holidayDate)) {
        // 다음 평일 찾기
        const substituteDate = getNextWeekday(holidayDate);
        
        // 1년 이내인지 확인
        if (substituteDate <= oneYearLater) {
          const substituteDateStr = formatDate(substituteDate);
          const substituteName = `${holiday.name} (대체공휴일)`;
          const substituteYear = substituteDate.getFullYear();
          
          try {
            // 이미 존재하는지 확인
            const [existing] = await pool.execute(
              'SELECT id FROM holidays WHERE holiday_date = ?',
              [substituteDateStr]
            );
            
            if (existing.length === 0) {
              // 대체 공휴일 추가
              await pool.execute(
                'INSERT INTO holidays (holiday_date, name, year, is_active) VALUES (?, ?, ?, 1)',
                [substituteDateStr, substituteName, substituteYear]
              );
              
              generated.push({
                originalDate: formatDate(holidayDate),
                originalName: holiday.name,
                substituteDate: substituteDateStr,
                substituteName,
                year: substituteYear
              });
            }
          } catch (error) {
            errors.push({
              date: formatDate(holidayDate),
              name: holiday.name,
              error: error.message
            });
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: `대체 공휴일 ${generated.length}개가 생성되었습니다.`,
      data: {
        generated,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('대체 공휴일 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '대체 공휴일을 생성하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 공휴일 데이터 검증
 * GET /api/staff/holidays/validate?year=2026
 */
router.get('/validate', requireAuth, requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: '연도를 입력해주세요.'
      });
    }
    
    const targetYear = parseInt(year);
    
    // 해당 연도의 모든 공휴일 조회
    const [holidays] = await pool.execute(
      'SELECT id, holiday_date, name, year, is_active FROM holidays WHERE year = ? AND is_active = 1 ORDER BY holiday_date ASC',
      [targetYear]
    );
    
    const errors = [];
    const warnings = [];
    
    // 고정 공휴일 목록 (날짜 기준)
    const fixedHolidays = {
      '01-01': '신정',
      '03-01': '삼일절',
      '05-05': '어린이날',
      '06-06': '현충일',
      '08-15': '광복절',
      '10-03': '개천절',
      '10-09': '한글날',
      '12-25': '성탄절'
    };
    
    // 찾은 공휴일 체크
    const foundHolidays = new Set();
    
    for (const holiday of holidays) {
      const holidayDate = new Date(holiday.holiday_date);
      const monthDay = String(holidayDate.getMonth() + 1).padStart(2, '0') + '-' + String(holidayDate.getDate()).padStart(2, '0');
      const dateStr = formatDate(holidayDate);
      
      // 연도 확인
      if (holidayDate.getFullYear() !== targetYear) {
        errors.push({
          id: holiday.id,
          date: dateStr,
          name: holiday.name,
          issue: '날짜와 연도가 일치하지 않습니다.',
          type: 'error'
        });
      }
      
      // 고정 공휴일 확인
      if (fixedHolidays[monthDay]) {
        foundHolidays.add(monthDay);
        if (holiday.name !== fixedHolidays[monthDay] && !holiday.name.includes('대체공휴일')) {
          warnings.push({
            id: holiday.id,
            date: dateStr,
            name: holiday.name,
            expected: fixedHolidays[monthDay],
            issue: `고정 공휴일 이름이 예상과 다릅니다. 예상: ${fixedHolidays[monthDay]}`,
            type: 'warning'
          });
        }
      }
      
      // 중복 날짜 확인
      const duplicates = holidays.filter(h => 
        h.id !== holiday.id && 
        formatDate(h.holiday_date) === dateStr
      );
      
      if (duplicates.length > 0) {
        errors.push({
          id: holiday.id,
          date: dateStr,
          name: holiday.name,
          issue: `중복된 날짜의 공휴일이 있습니다. (ID: ${duplicates.map(d => d.id).join(', ')})`,
          type: 'error'
        });
      }
    }
    
    // 누락된 고정 공휴일 확인
    const missingHolidays = [];
    for (const [monthDay, name] of Object.entries(fixedHolidays)) {
      if (!foundHolidays.has(monthDay)) {
        const [month, day] = monthDay.split('-');
        missingHolidays.push({
          date: `${targetYear}-${month}-${day}`,
          name: name,
          issue: '고정 공휴일이 누락되었습니다.',
          type: 'error'
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        year: targetYear,
        totalHolidays: holidays.length,
        errors: [...errors, ...missingHolidays],
        warnings: warnings,
        isValid: errors.length === 0 && missingHolidays.length === 0
      }
    });
  } catch (error) {
    console.error('공휴일 검증 오류:', error);
    res.status(500).json({
      success: false,
      message: '공휴일 검증 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;

