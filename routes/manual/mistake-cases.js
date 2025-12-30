// ==============================
// routes/manual/mistake-cases.js - 실수 사례 관리 라우터
// ==============================

const express = require('express');
const { pool } = require('../../config/database');
const router = express.Router();

// 권한 확인 미들웨어
const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      error: '로그인이 필요합니다.'
    });
  }
  next();
};

// 실수 사례 목록 조회
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      severity,
      search,
      sort = 'created_at'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ["status = 'active'"];
    let params = [];

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    if (severity) {
      whereConditions.push('severity = ?');
      params.push(severity);
    }

    if (search) {
      whereConditions.push('(title LIKE ? OR work_content LIKE ? OR mistake_description LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // 전체 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM mistake_cases ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 목록 조회
    const validSortFields = ['created_at', 'view_count', 'comment_count', 'title'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = 'DESC';

    const [rows] = await pool.execute(
      `SELECT 
        id, title, category, severity, author_name, 
        view_count, comment_count, created_at,
        SUBSTRING(COALESCE(work_content, ''), 1, 100) as preview
       FROM mistake_cases 
       ${whereClause}
       ORDER BY ${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        items: rows
      }
    });
  } catch (error) {
    console.error('실수 사례 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '실수 사례 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 실수 사례 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 조회수 증가
    await pool.execute(
      'UPDATE mistake_cases SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    // 상세 정보 조회
    const [rows] = await pool.execute(
      `SELECT mc.*,
        (SELECT COUNT(*) FROM mistake_case_files WHERE case_id = mc.id) as file_count
       FROM mistake_cases mc
       WHERE mc.id = ? AND mc.status = 'active'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '실수 사례를 찾을 수 없습니다.'
      });
    }

    // 첨부 파일 조회
    const [files] = await pool.execute(
      'SELECT * FROM mistake_case_files WHERE case_id = ?',
      [id]
    );

    // 댓글 개수 조회
    const [commentCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM mistake_case_comments WHERE case_id = ? AND deleted_at IS NULL',
      [id]
    );

    const result = {
      ...rows[0],
      files,
      comment_count: commentCount[0].count,
      checklist_items: rows[0].checklist_items ? JSON.parse(rows[0].checklist_items) : [],
      tags: rows[0].tags ? JSON.parse(rows[0].tags) : []
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('실수 사례 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '실수 사례 상세 조회 중 오류가 발생했습니다.'
    });
  }
});

// 실수 사례 등록
router.post('/', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      title,
      category,
      severity,
      tags,
      work_content,
      mistake_description,
      result_description,
      surface_causes,
      root_causes,
      structural_issues,
      improvement_measures,
      checklist_items
    } = req.body;

    // 필수 필드 검증
    if (!title || !category || !mistake_description || !root_causes) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다. (제목, 업무영역, 실수 내용, 근본 원인)'
      });
    }

    // 세션에서 사용자 정보 가져오기
    const authorId = req.session.user?.id || null;
    const authorName = req.session.user?.name || '익명';

    // 실수 사례 등록
    const [result] = await connection.execute(
      `INSERT INTO mistake_cases (
        title, category, severity, tags,
        work_content, mistake_description, result_description,
        surface_causes, root_causes, structural_issues,
        improvement_measures, checklist_items,
        author_id, author_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        category, 
        severity || 'medium',
        JSON.stringify(tags || []),
        work_content || null,
        mistake_description,
        result_description || null,
        surface_causes || null,
        root_causes,
        structural_issues || null,
        improvement_measures || null,
        JSON.stringify(checklist_items || []),
        authorId, 
        authorName
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '실수 사례가 등록되었습니다.',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('실수 사례 등록 오류:', error);
    res.status(500).json({
      success: false,
      error: '실수 사례 등록 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
});

// 실수 사례 수정
router.put('/:id', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const userId = req.session.user?.id;

    // 기존 데이터 조회
    const [existing] = await connection.execute(
      'SELECT * FROM mistake_cases WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '실수 사례를 찾을 수 없습니다.'
      });
    }

    // 권한 체크 (작성자 또는 관리자)
    if (existing[0].author_id !== userId && !['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(req.session.user?.role)) {
      return res.status(403).json({
        success: false,
        error: '수정 권한이 없습니다.'
      });
    }

    // 수정 전 데이터 저장 (이력)
    const oldData = { ...existing[0] };
    
    // 수정 데이터
    const updateFields = {
      title: req.body.title,
      category: req.body.category,
      severity: req.body.severity,
      tags: JSON.stringify(req.body.tags || []),
      work_content: req.body.work_content,
      mistake_description: req.body.mistake_description,
      result_description: req.body.result_description,
      surface_causes: req.body.surface_causes,
      root_causes: req.body.root_causes,
      structural_issues: req.body.structural_issues,
      improvement_measures: req.body.improvement_measures,
      checklist_items: JSON.stringify(req.body.checklist_items || [])
    };

    // 수정 이력 저장
    await connection.execute(
      `INSERT INTO mistake_case_history 
       (case_id, changed_fields, old_value, new_value, changed_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        JSON.stringify(Object.keys(updateFields)),
        JSON.stringify(oldData),
        JSON.stringify(updateFields),
        userId
      ]
    );

    // 데이터 업데이트
    await connection.execute(
      `UPDATE mistake_cases SET
        title = ?, category = ?, severity = ?, tags = ?,
        work_content = ?, mistake_description = ?, result_description = ?,
        surface_causes = ?, root_causes = ?, structural_issues = ?,
        improvement_measures = ?, checklist_items = ?
       WHERE id = ?`,
      [
        ...Object.values(updateFields),
        id
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '실수 사례가 수정되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('실수 사례 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '실수 사례 수정 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
});

// 실수 사례 삭제 (soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user?.id;

    // 기존 데이터 조회
    const [existing] = await pool.execute(
      'SELECT * FROM mistake_cases WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '실수 사례를 찾을 수 없습니다.'
      });
    }

    // 권한 체크
    if (existing[0].author_id !== userId && !['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(req.session.user?.role)) {
      return res.status(403).json({
        success: false,
        error: '삭제 권한이 없습니다.'
      });
    }

    // Soft delete
    await pool.execute(
      'UPDATE mistake_cases SET status = ?, deleted_at = NOW() WHERE id = ?',
      ['deleted', id]
    );

    res.json({
      success: true,
      message: '실수 사례가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('실수 사례 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '실수 사례 삭제 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;

