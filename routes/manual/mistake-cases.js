// ==============================
// routes/manual/mistake-cases.js - 실수 사례 관리 라우터
// ==============================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../../config/database');
const router = express.Router();

// 파일 업로드 설정
const uploadDir = path.join(__dirname, '../../public/uploads/manual');
// 디렉토리 생성 (비동기로 처리)
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  console.error('업로드 디렉토리 생성 오류:', error);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

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

    // 페이지 및 제한 값 정수 변환
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offsetNum = (pageNum - 1) * limitNum;
    
    let whereConditions = ["status = ?"];
    let params = ['active']; // status 파라미터 추가

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

    // LIMIT와 OFFSET을 SQL에 직접 삽입 (파라미터 바인딩 대신)
    // MySQL에서 LIMIT/OFFSET은 바인딩 변수보다 문자열 삽입이 더 안전함
    const [rows] = await pool.execute(
      `SELECT 
        id, title, category, severity, author_name, 
        view_count, comment_count, created_at,
        SUBSTRING(COALESCE(work_content, ''), 1, 100) as preview
       FROM mistake_cases 
       ${whereClause}
       ORDER BY ${sortField} ${sortOrder}
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    res.json({
      success: true,
      data: {
        total,
        page: pageNum,
        limit: limitNum,
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

    // JSON 파싱 헬퍼 함수
    const safeJsonParse = (value, defaultValue = []) => {
      if (!value) return defaultValue;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          console.warn('JSON 파싱 오류:', e.message, '값:', value);
          return defaultValue;
        }
      }
      if (Array.isArray(value) || typeof value === 'object') {
        return value;
      }
      return defaultValue;
    };

    const result = {
      ...rows[0],
      files,
      comment_count: commentCount[0].count,
      checklist_items: safeJsonParse(rows[0].checklist_items, []),
      tags: safeJsonParse(rows[0].tags, [])
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('실수 사례 상세 조회 오류:', error);
    console.error('오류 스택:', error.stack);
    res.status(500).json({
      success: false,
      error: '실수 사례 상세 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    // author_id는 정수형이므로 email 저장 불가 - NULL 처리
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
        null, // author_id는 정수형이므로 NULL 처리 (email 저장 불가)
        authorName
      ]
    );

    const caseId = result.insertId;

    // 파일 저장
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.execute(
          `INSERT INTO mistake_case_files 
           (case_id, file_name, file_path, file_size, file_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            caseId,
            file.originalname,
            `/uploads/manual/${file.filename}`,
            file.size,
            file.mimetype,
            authorId
          ]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: '실수 사례가 등록되었습니다.',
      data: {
        id: caseId
      }
    });
  } catch (error) {
    await connection.rollback();
    
    // 업로드된 파일 삭제
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(uploadDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    console.error('실수 사례 등록 오류:', error);
    res.status(500).json({
      success: false,
      error: '실수 사례 등록 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
});

// 실수 사례 수정 (파일 업로드 지원)
router.put('/:id', requireAuth, upload.array('files', 10), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const userId = req.session.user?.id || req.session.user?.email; // email이 Primary Key
    const userName = req.session.user?.name;
    const userRole = req.session.user?.role;

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
    const authorId = existing[0].author_id;
    const authorName = existing[0].author_name;
    
    let isAuthor = false;
    
    // 방법 1: author_id와 userId (email) 비교
    if (authorId !== null && authorId !== undefined && userId) {
      const authorIdStr = String(authorId).trim();
      const userIdStr = String(userId).trim();
      isAuthor = authorIdStr === userIdStr || authorIdStr === req.session.user?.email;
    }
    
    // 방법 2: author_id가 null인 경우 author_name으로 비교 (기존 데이터 호환성)
    if (!isAuthor && (authorId === null || authorId === undefined) && authorName && userName) {
      isAuthor = authorName.trim() === userName.trim();
    }
    
    const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole);
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: '수정 권한이 없습니다.'
      });
    }

    // 수정 전 데이터 저장 (이력)
    const oldData = { ...existing[0] };
    
    // JSON 데이터 파싱 (FormData로 전송된 경우)
    let data;
    if (req.body.data) {
      data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } else {
      data = req.body;
    }
    
    // 수정 데이터
    const updateFields = {
      title: data.title,
      category: data.category,
      severity: data.severity,
      tags: JSON.stringify(data.tags || []),
      work_content: data.work_content,
      mistake_description: data.mistake_description,
      result_description: data.result_description,
      surface_causes: data.surface_causes,
      root_causes: data.root_causes,
      structural_issues: data.structural_issues,
      improvement_measures: data.improvement_measures,
      checklist_items: JSON.stringify(data.checklist_items || [])
    };

    // 수정 이력 저장
    await connection.execute(
      `INSERT INTO mistake_case_history 
       (case_id, changed_fields, old_value, new_value, changed_by, changed_by_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        JSON.stringify(Object.keys(updateFields)),
        JSON.stringify(oldData),
        JSON.stringify(updateFields),
        null, // changed_by는 정수형이므로 NULL 처리 (email은 저장 불가)
        userName || req.session.user?.name || '알 수 없음' // changed_by_name에 사용자 이름 저장
      ]
    );

    // 데이터 업데이트
    // author_id는 정수형이므로 email 저장 불가 - 자동 업데이트 제거
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

    // 새 파일 저장
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.execute(
          `INSERT INTO mistake_case_files 
           (case_id, file_name, file_path, file_size, file_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            file.originalname,
            `/uploads/manual/${file.filename}`,
            file.size,
            file.mimetype,
            userId
          ]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: '실수 사례가 수정되었습니다.',
      data: {
        id: parseInt(id)
      }
    });
  } catch (error) {
    await connection.rollback();
    
    // 업로드된 파일 삭제
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(uploadDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
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
    const userId = req.session.user?.id || req.session.user?.email; // email이 Primary Key
    const userName = req.session.user?.name;
    const userRole = req.session.user?.role;

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

    // 권한 체크 (작성자 또는 관리자)
    const authorId = existing[0].author_id;
    const authorName = existing[0].author_name;
    
    let isAuthor = false;
    
    // 방법 1: author_id와 userId (email) 비교
    if (authorId !== null && authorId !== undefined && userId) {
      const authorIdStr = String(authorId).trim();
      const userIdStr = String(userId).trim();
      isAuthor = authorIdStr === userIdStr || authorIdStr === req.session.user?.email;
    }
    
    // 방법 2: author_id가 null인 경우 author_name으로 비교 (기존 데이터 호환성)
    if (!isAuthor && (authorId === null || authorId === undefined) && authorName && userName) {
      isAuthor = authorName.trim() === userName.trim();
    }
    
    const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole);
    
    if (!isAuthor && !isAdmin) {
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

// ========== 댓글 관련 API ==========

// 댓글 목록 조회
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;

    // 댓글 목록 조회 (부모 댓글 먼저, 그 다음 대댓글)
    const [rows] = await pool.execute(
      `SELECT * FROM mistake_case_comments 
       WHERE case_id = ? AND deleted_at IS NULL
       ORDER BY COALESCE(parent_id, id), created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('댓글 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '댓글 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 댓글 작성
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '댓글 내용을 입력하세요.'
      });
    }

    // author_id는 정수형이므로 email 저장 불가 - NULL 처리
    const authorName = req.session.user?.name || '익명';

    const [result] = await pool.execute(
      `INSERT INTO mistake_case_comments 
       (case_id, parent_id, content, author_id, author_name)
       VALUES (?, ?, ?, ?, ?)`,
      [id, parent_id || null, content.trim(), null, authorName] // author_id는 NULL, author_name에 이름 저장
    );

    // 댓글 수 업데이트
    await pool.execute(
      'UPDATE mistake_cases SET comment_count = comment_count + 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '댓글이 작성되었습니다.',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.status(500).json({
      success: false,
      error: '댓글 작성 중 오류가 발생했습니다.'
    });
  }
});

// 댓글 수정
router.put('/:id/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;
    const userId = req.session.user?.id || req.session.user?.email; // email이 Primary Key
    const userName = req.session.user?.name;
    const userRole = req.session.user?.role;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '댓글 내용을 입력하세요.'
      });
    }

    // 기존 댓글 확인
    const [existing] = await pool.execute(
      'SELECT * FROM mistake_case_comments WHERE id = ? AND case_id = ?',
      [commentId, id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '댓글을 찾을 수 없습니다.'
      });
    }

    // 권한 체크 (작성자 또는 관리자)
    const authorId = existing[0].author_id;
    const authorName = existing[0].author_name;
    
    let isAuthor = false;
    
    // 방법 1: author_id와 userId (email) 비교
    if (authorId !== null && authorId !== undefined && userId) {
      const authorIdStr = String(authorId).trim();
      const userIdStr = String(userId).trim();
      isAuthor = authorIdStr === userIdStr || authorIdStr === req.session.user?.email;
    }
    
    // 방법 2: author_id가 null인 경우 author_name으로 비교 (기존 데이터 호환성)
    if (!isAuthor && (authorId === null || authorId === undefined) && authorName && userName) {
      isAuthor = authorName.trim() === userName.trim();
    }
    
    const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole);
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: '수정 권한이 없습니다.'
      });
    }

    await pool.execute(
      'UPDATE mistake_case_comments SET content = ? WHERE id = ?',
      [content.trim(), commentId]
    );

    res.json({
      success: true,
      message: '댓글이 수정되었습니다.'
    });
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '댓글 수정 중 오류가 발생했습니다.'
    });
  }
});

// 댓글 삭제
router.delete('/:id/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.session.user?.id || req.session.user?.email; // email이 Primary Key
    const userName = req.session.user?.name;
    const userRole = req.session.user?.role;

    // 기존 댓글 확인
    const [existing] = await pool.execute(
      'SELECT * FROM mistake_case_comments WHERE id = ? AND case_id = ?',
      [commentId, id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '댓글을 찾을 수 없습니다.'
      });
    }

    // 권한 체크 (작성자 또는 관리자)
    const authorId = existing[0].author_id;
    const authorName = existing[0].author_name;
    
    let isAuthor = false;
    
    // 방법 1: author_id와 userId (email) 비교
    if (authorId !== null && authorId !== undefined && userId) {
      const authorIdStr = String(authorId).trim();
      const userIdStr = String(userId).trim();
      isAuthor = authorIdStr === userIdStr || authorIdStr === req.session.user?.email;
    }
    
    // 방법 2: author_id가 null인 경우 author_name으로 비교 (기존 데이터 호환성)
    if (!isAuthor && (authorId === null || authorId === undefined) && authorName && userName) {
      isAuthor = authorName.trim() === userName.trim();
    }
    
    const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole);
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: '삭제 권한이 없습니다.'
      });
    }

    // Soft delete
    await pool.execute(
      'UPDATE mistake_case_comments SET deleted_at = NOW() WHERE id = ?',
      [commentId]
    );

    // 댓글 수 업데이트
    await pool.execute(
      'UPDATE mistake_cases SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '댓글 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 파일 다운로드
router.get('/:id/files/:fileId/download', requireAuth, async (req, res) => {
  try {
    const { id, fileId } = req.params;

    const [files] = await pool.execute(
      'SELECT * FROM mistake_case_files WHERE id = ? AND case_id = ?',
      [fileId, id]
    );

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      });
    }

    const file = files[0];
    const filePath = path.join(__dirname, '../../public', file.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '파일이 존재하지 않습니다.'
      });
    }

    res.download(filePath, file.file_name);
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '파일 다운로드 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;

