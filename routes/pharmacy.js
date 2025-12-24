// routes/pharmacy.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// 약국배상책임보험 목록 조회 (프록시) - 거래처 필터 지원
router.get('/list', async (req, res) => {
    try {
        const apiUrl = 'https://imet.kr/api/pharmacy/pharmacy-list.php';
        const params = req.query;
        
        console.log('Pharmacy API 호출:', apiUrl);
        console.log('파라미터:', params);
        
        // 거래처 필터 파라미터 로깅
        if (params.account) {
            console.log('거래처 필터 적용:', params.account);
        }
        
        const response = await axios.get(apiUrl, {
            params: params,
            timeout: 15000,
            headers: {
                'User-Agent': 'disk-cms-proxy/1.0',
                'Accept': 'application/json',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });
        
        // 응답 데이터 검증 및 로깅
        if (response.data && response.data.success) {
            const dataCount = response.data.data ? response.data.data.length : 0;
            console.log(`약국 데이터 조회 성공: ${dataCount}건`);
            
            // 거래처 필터가 적용된 경우 추가 로깅
            if (params.account && dataCount > 0) {
                console.log(`거래처 ${params.account} 필터 적용 결과: ${dataCount}건`);
            }
            
            // 데이터 구조 검증 (첫 번째 항목만)
            if (response.data.data && response.data.data.length > 0) {
                const firstItem = response.data.data[0];
                console.log('데이터 샘플:', {
                    num: firstItem.num,
                    company: firstItem.company,
                    chemist: firstItem.chemist,
                    area: firstItem.area,
                    account: firstItem.account,
                    account_company: firstItem.account_company
                });
            }
        }
        
        res.json(response.data);
        
    } catch (error) {
        console.error('Pharmacy API 프록시 오류:', error.message);
        
        if (error.response) {
            // imet.kr에서 오류 응답을 받은 경우
            console.error('API 서버 오류 응답:', error.response.status, error.response.data);
            res.status(error.response.status).json({
                success: false,
                error: 'API 서버 오류',
                details: error.response.data || error.message
            });
        } else if (error.request) {
            // 요청은 보냈지만 응답을 받지 못한 경우
            console.error('API 서버 연결 실패:', error.request);
            res.status(503).json({
                success: false,
                error: 'API 서버에 연결할 수 없습니다',
                details: error.message
            });
        } else {
            // 기타 오류
            console.error('프록시 내부 오류:', error);
            res.status(500).json({
                success: false,
                error: '프록시 서버 내부 오류',
                details: error.message
            });
        }
    }
});

// 거래처 목록 조회 (필터용)
router.get('/accounts', async (req, res) => {
    try {
        const apiUrl = 'https://imet.kr/api/pharmacy/pharmacy-accounts.php';
        
        console.log('거래처 목록 API 호출:', apiUrl);
        
        const response = await axios.get(apiUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'disk-cms-proxy/1.0',
                'Accept': 'application/json',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });
        
        // 응답 데이터 검증 및 로깅
        if (response.data && response.data.success) {
            console.log(`거래처 목록 조회 성공: ${response.data.data.length}건`);
            
            // 데이터 구조 검증 (첫 번째 항목만)
            if (response.data.data.length > 0) {
                const firstItem = response.data.data[0];
                console.log('거래처 데이터 샘플:', {
                    num: firstItem.num,
                    directory: firstItem.directory
                });
            }
        } else {
            console.warn('거래처 목록 API 응답이 예상과 다릅니다:', response.data);
        }
        
        res.json(response.data);
        
    } catch (error) {
        console.error('거래처 목록 API 프록시 오류:', error.message);
        
        if (error.response) {
            // imet.kr에서 오류 응답을 받은 경우
            console.error('거래처 API 서버 오류 응답:', error.response.status, error.response.data);
            res.status(error.response.status).json({
                success: false,
                error: '거래처 API 서버 오류',
                details: error.response.data || error.message
            });
        } else if (error.request) {
            // 요청은 보냈지만 응답을 받지 못한 경우
            console.error('거래처 API 서버 연결 실패:', error.request);
            res.status(503).json({
                success: false,
                error: '거래처 API 서버에 연결할 수 없습니다',
                details: error.message
            });
        } else if (error.code === 'ECONNABORTED') {
            // 타임아웃 오류
            console.error('거래처 API 타임아웃:', error.message);
            res.status(408).json({
                success: false,
                error: '거래처 목록 조회 시간이 초과되었습니다',
                details: error.message
            });
        } else {
            // 기타 오류
            console.error('거래처 프록시 내부 오류:', error);
            res.status(500).json({
                success: false,
                error: '거래처 프록시 서버 내부 오류',
                details: error.message
            });
        }
    }
});

// 약국 상태 업데이트 (향후 구현)
router.put('/update-status', async (req, res) => {
    try {
        const { num, status } = req.body;
        
        // 입력 검증
        if (!num || !status) {
            return res.status(400).json({
                success: false,
                error: '필수 파라미터가 누락되었습니다',
                required: ['num', 'status']
            });
        }
        
        console.log('상태 업데이트 요청:', { num, status });
        
        // 향후 imet.kr에 상태 업데이트 API가 준비되면 구현
        // const apiUrl = 'https://imet.kr/api/pharmacy-update-status.php';
        // const response = await axios.put(apiUrl, { num, status });
        
        res.json({
            success: true,
            message: `약국 번호 ${num}의 상태를 '${status}'로 업데이트하는 기능은 준비 중입니다`,
            data: { num, status }
        });
        
    } catch (error) {
        console.error('상태 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            error: '상태 업데이트 중 오류가 발생했습니다',
            details: error.message
        });
    }
});

// 설계번호 업데이트 (향후 구현)
router.put('/update-design', async (req, res) => {
    try {
        const { num, field, value } = req.body;
        
        // 입력 검증
        if (!num || !field) {
            return res.status(400).json({
                success: false,
                error: '필수 파라미터가 누락되었습니다',
                required: ['num', 'field']
            });
        }
        
        // field 값 검증 (chemist, area 필드 추가)
        const allowedFields = ['chemist', 'area', 'chemist_design', 'area_design'];
        if (!allowedFields.includes(field)) {
            return res.status(400).json({
                success: false,
                error: '잘못된 필드명입니다',
                allowed_fields: allowedFields
            });
        }
        
        console.log('설계번호 업데이트 요청:', { num, field, value });
        
        let fieldName;
        switch(field) {
            case 'chemist':
                fieldName = '전문인수';
                break;
            case 'area':
                fieldName = '화재면적';
                break;
            case 'chemist_design':
                fieldName = '전문인설계번호';
                break;
            case 'area_design':
                fieldName = '화재설계번호';
                break;
            default:
                fieldName = field;
        }
        
        res.json({
            success: true,
            message: `약국 번호 ${num}의 ${fieldName} 업데이트 기능은 준비 중입니다`,
            data: { num, field, value, fieldName }
        });
        
    } catch (error) {
        console.error('설계번호 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            error: '설계번호 업데이트 중 오류가 발생했습니다',
            details: error.message
        });
    }
});

// 메모 업데이트 (향후 구현)
router.put('/update-memo', async (req, res) => {
    try {
        const { num, memo } = req.body;
        
        // 입력 검증
        if (!num) {
            return res.status(400).json({
                success: false,
                error: '약국 번호가 필요합니다',
                required: ['num']
            });
        }
        
        console.log('메모 업데이트 요청:', { num, memo: memo ? memo.substring(0, 50) + '...' : '(빈 메모)' });
        
        res.json({
            success: true,
            message: `약국 번호 ${num}의 메모 업데이트 기능은 준비 중입니다`,
            data: { num, memo_length: memo ? memo.length : 0 }
        });
        
    } catch (error) {
        console.error('메모 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            error: '메모 업데이트 중 오류가 발생했습니다',
            details: error.message
        });
    }
});

// routes/pharmacy.js에 추가할 업체 관리 라우트들
// 기존 pharmacy.js 파일에 아래 라우트들을 추가하세요

// 업체 리스트 조회
router.get('/id-list', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const params = new URLSearchParams({
      page,
      limit,
      search
    });

    const response = await axios.get(`https://imet.kr/api/pharmacy/pharmacy-id-list.php?${params}`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
    
  } catch (error) {
    console.error('업체 리스트 조회 오류:', error);
    
    if (error.response) {
      // PHP API에서 에러 응답이 온 경우
      res.status(error.response.status).json(error.response.data);
    } else {
      // 네트워크 오류 등
      res.status(500).json({
        success: false,
        error: '업체 리스트 조회 중 오류가 발생했습니다.'
      });
    }
  }
});

// 업체 상세 정보 조회
router.get('/id-detail/:num', async (req, res) => {
  try {
    const { num } = req.params;
    
    console.log('상세 정보 조회 시작:', num);
    
    // 쿼리 파라미터 방식으로 변경
    const response = await axios.get(`https://imet.kr/api/pharmacy/pharmacyApply-num-detail.php`, {
      params: { num },  // 다시 params 방식 사용
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
	console.log('https://imet.kr/api/pharmacy/pharmacyApply-num-detail.php');
    console.log('API 응답:', response.status, response.data);
    
    res.json(response.data);
    
  } catch (error) {
    console.error('업체 상세 조회 오류:', error.message);
    
    if (error.response && error.response.data) {
      res.status(200).json({
        success: false,
        error: error.response.data.error || '업체 정보를 찾을 수 없습니다.',
        data: []
      });
    } else {
      res.status(500).json({
        success: false,
        error: '업체 상세 정보 조회 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }
});

// 업체 정보 수정
router.put('/id-update/:num', async (req, res) => {
  try {
    const { num } = req.params;
    
    console.log('업체 정보 수정 요청:', { num, data: req.body });
    
    // PHP API는 PUT 방식으로 호출
    const response = await axios.put(`https://imet.kr/api/pharmacy/pharmacyApply-num-update.php?num=${num}`, req.body, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('PHP API 응답:', response.data);
    
    // 응답 데이터 검증
    if (response.data && typeof response.data === 'object') {
      res.json(response.data);
    } else {
      // PHP에서 예상과 다른 응답이 온 경우
      res.json({
        success: false,
        error: 'API 응답 형식이 올바르지 않습니다.',
        raw_response: response.data
      });
    }
    
  } catch (error) {
    console.error('업체 정보 수정 오류:', error.message);
    
    if (error.response) {
      console.error('PHP API 오류 응답:', error.response.data);
      
      // PHP API에서 온 오류 응답을 그대로 전달
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.error || error.response.data || '서버 오류가 발생했습니다.',
        status: error.response.status
      });
    } else if (error.code === 'ECONNABORTED') {
      // 타임아웃 오류
      res.status(408).json({
        success: false,
        error: '요청 시간이 초과되었습니다. 다시 시도해주세요.'
      });
    } else {
      // 네트워크 오류 등
      res.status(500).json({
        success: false,
        error: '업체 정보 수정 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }
});

// 업체 삭제
router.delete('/id-delete/:num', async (req, res) => {
  try {
    const { num } = req.params;
    
    const response = await axios.delete(`https://imet.kr/api/pharmacy/pharmacy-id-detail.php`, {
      params: { num },
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
    
  } catch (error) {
    console.error('업체 삭제 오류:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: '업체 삭제 중 오류가 발생했습니다.'
      });
    }
  }
});

// 업체 신규 등록
router.post('/id-create', async (req, res) => {
  try {
    const newCompanyData = req.body;
    
    const response = await axios.post(`https://imet.kr/api/pharmacy/pharmacy-id-detail.php`, newCompanyData, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
    
  } catch (error) {
    console.error('업체 등록 오류:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: '업체 등록 중 오류가 발생했습니다.'
      });
    }
  }
});

// 아이디 중복 확인
router.get('/id-check', async (req, res) => {
  try {
    const { mem_id } = req.query;
    
    if (!mem_id) {
      return res.status(400).json({
        success: false,
        error: '아이디를 입력해주세요.'
      });
    }
    
    const response = await axios.get(`https://imet.kr/api/pharmacy/pharmacy-id-check.php`, {
      params: { mem_id },
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
    
  } catch (error) {
    console.error('아이디 중복확인 오류:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: '아이디 중복확인 중 오류가 발생했습니다.'
      });
    }
  }
});


// routes/pharmacy.js 파일에 추가할 라우트들

// 전문증권 발행 라우트
router.post('/issue-certificate', async (req, res) => {
  try {
    const { num, certificate_number } = req.body;
    
    // 입력 검증
    if (!num || !certificate_number) {
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다',
        required: ['num', 'certificate_number']
      });
    }
    
    console.log('전문증권 발행 요청:', { num, certificate_number });
    
    // 향후 실제 API 연동 시 구현
    // const apiUrl = 'https://imet.kr/api/pharmacy/issue-certificate.php';
    // const response = await axios.post(apiUrl, {
    //   num,
    //   certificate_number
    // }, {
    //   timeout: 30000,
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json'
    //   }
    // });
    
    // 현재는 모의 응답 반환
    res.json({
      success: true,
      message: `약국 번호 ${num}의 전문증권 (${certificate_number})이 발행 요청되었습니다. (실제 발행 기능은 준비 중입니다)`,
      data: {
        num,
        certificate_number,
        issued_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('전문증권 발행 오류:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: '전문증권 발행 API 서버 오류',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: '전문증권 발행 중 서버 오류가 발생했습니다',
        details: error.message
      });
    }
  }
});

// 파일 업로드 라우트 (multer 사용)
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: async function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/pharmacy');
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      console.error('업로드 디렉토리 생성 오류:', error);
      cb(error);
    }
  },
  filename: function(req, file, cb) {
    // 파일명: 약국번호_타입_타임스탬프_원본파일명
    const timestamp = Date.now();
    const fileType = file.fieldname === 'certificate_files' ? 'cert' : 'receipt';
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const fileName = `${req.body.num}_${fileType}_${timestamp}_${baseName}${extension}`;
    
    cb(null, fileName);
  }
});

// 파일 필터 (이미지 및 PDF만 허용)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('허용되지 않은 파일 형식입니다. (JPG, PNG, GIF, PDF만 가능)'), false);
  }
};

// multer 설정
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // 최대 10개 파일
  }
});

// 파일 업로드 라우트
router.post('/upload-files', upload.fields([
  { name: 'certificate_files', maxCount: 5 },
  { name: 'receipt_files', maxCount: 5 }
]), async (req, res) => {
  try {
    const { num } = req.body;
    
    if (!num) {
      return res.status(400).json({
        success: false,
        error: '약국 번호가 필요합니다'
      });
    }
    
    const certificateFiles = req.files['certificate_files'] || [];
    const receiptFiles = req.files['receipt_files'] || [];
    
    if (certificateFiles.length === 0 && receiptFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: '업로드할 파일이 없습니다'
      });
    }
    
    console.log('파일 업로드 완료:', {
      num,
      certificate_count: certificateFiles.length,
      receipt_count: receiptFiles.length,
      certificate_files: certificateFiles.map(f => f.filename),
      receipt_files: receiptFiles.map(f => f.filename)
    });
    
    // 업로드된 파일 정보 구성
    const uploadedFiles = {
      certificate_files: certificateFiles.map(file => ({
        original_name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      })),
      receipt_files: receiptFiles.map(file => ({
        original_name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      }))
    };
    
    // 향후 데이터베이스에 파일 정보 저장
    // await saveFileInfoToDatabase(num, uploadedFiles);
    
    // 향후 외부 API로 파일 정보 전송
    // const apiResponse = await axios.post('https://imet.kr/api/pharmacy/upload-files.php', {
    //   num,
    //   files: uploadedFiles
    // });
    
    res.json({
      success: true,
      message: `${certificateFiles.length + receiptFiles.length}개 파일이 성공적으로 업로드되었습니다`,
      data: {
        num,
        uploaded_files: uploadedFiles,
        total_count: certificateFiles.length + receiptFiles.length
      }
    });
    
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    
    // multer 오류 처리
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: '파일 크기가 5MB를 초과합니다'
        });
      } else if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: '파일 개수가 제한을 초과합니다'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: '파일 업로드 중 서버 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 업로드된 파일 목록 조회
router.get('/files/:num', async (req, res) => {
  try {
    const { num } = req.params;
    const uploadDir = path.join(__dirname, '../uploads/pharmacy');
    
    // 해당 약국의 파일 목록 조회
    const files = await fs.readdir(uploadDir);
    const pharmacyFiles = files.filter(file => file.startsWith(`${num}_`));
    
    const fileList = [];
    
    for (const filename of pharmacyFiles) {
      try {
        const filePath = path.join(uploadDir, filename);
        const stats = await fs.stat(filePath);
        const parts = filename.split('_');
        
        if (parts.length >= 4) {
          const [pharmacyNum, fileType, timestamp, ...nameParts] = parts;
          const originalName = nameParts.join('_');
          
          fileList.push({
            filename,
            original_name: originalName,
            type: fileType === 'cert' ? 'certificate' : 'receipt',
            size: stats.size,
            uploaded_at: new Date(parseInt(timestamp)).toISOString(),
            url: `/api/pharmacy/download/${filename}`
          });
        }
      } catch (err) {
        console.warn('파일 정보 조회 오류:', filename, err);
      }
    }
    
    res.json({
      success: true,
      data: fileList,
      count: fileList.length
    });
    
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '파일 목록 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 파일 다운로드
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/pharmacy', filename);
    
    // 파일 존재 확인
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '파일을 찾을 수 없습니다'
      });
    }
    
    // 원본 파일명 복원
    const parts = filename.split('_');
    if (parts.length >= 4) {
      const originalName = parts.slice(3).join('_');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
    }
    
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '파일 다운로드 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 파일 삭제
router.delete('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/pharmacy', filename);
    
    // 파일 존재 확인
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '파일을 찾을 수 없습니다'
      });
    }
    
    // 파일 삭제
    await fs.unlink(filePath);
    
    console.log('파일 삭제 완료:', filename);
    
    res.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다',
      deleted_file: filename
    });
    
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '파일 삭제 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 증권 파일 조회 및 다운로드 프록시
router.get('/certificate/:pharmacyId/:certificateType', async (req, res) => {
  try {
    const { pharmacyId, certificateType } = req.params;
    
    // certificateType 검증
    if (!['expert', 'fire'].includes(certificateType)) {
      return res.status(400).json({
        success: false,
        error: '올바른 증권 유형을 선택해주세요. (expert 또는 fire)'
      });
    }
    
    console.log(`[GET /certificate/${pharmacyId}/${certificateType}] 증권 파일 조회 요청`);
    
    // PHP API를 통해 증권 파일 정보 조회
    const detailResponse = await axios.get('https://imet.kr/api/pharmacy/pharmacyApply-num-detail.php', {
      params: { num: pharmacyId },
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!detailResponse.data || !detailResponse.data.success) {
      return res.status(404).json({
        success: false,
        error: '약국 정보를 찾을 수 없습니다.'
      });
    }
    
    const pharmacyData = detailResponse.data.data || detailResponse.data;
    const images = pharmacyData.images || [];
    
    // 증권 유형에 따라 kind 값 결정 (1=전문인, 2=화재)
    const kind = certificateType === 'expert' ? '1' : '2';
    const certificateFile = images.find(img => img.kind === kind);
    
    // 파일이 없지만 증권번호가 있는 경우 PDF 자동 생성
    if (!certificateFile || !certificateFile.description2) {
      const certField = certificateType === 'expert' ? 'expert_certificate_number' : 'fire_certificate_number';
      const certNumber = pharmacyData[certField] || 
                         (certificateType === 'expert' ? pharmacyData.chemistCerti : pharmacyData.areaCerti);
      
      if (certNumber) {
        console.log(`[GET /certificate/${pharmacyId}/${certificateType}] PDF 파일이 없어 자동 생성 시도 - 증권번호: ${certNumber}`);
        
        try {
          // PDF 생성 API 호출
          const generateResponse = await axios.post('https://imet.kr/api/pharmacy/pharmacy-certificate-update.php', {
            pharmacy_id: pharmacyId,
            certificate_type: certificateType,
            action: 'generate_pdf'
          }, {
            timeout: 30000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (generateResponse.data && generateResponse.data.success) {
            console.log(`[GET /certificate/${pharmacyId}/${certificateType}] PDF 생성 성공, 파일 재조회 중`);
            
            // PDF 생성 후 다시 상세 정보 조회하여 파일 경로 확인
            const retryDetailResponse = await axios.get('https://imet.kr/api/pharmacy/pharmacyApply-num-detail.php', {
              params: { num: pharmacyId },
              timeout: 15000,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            if (retryDetailResponse.data && retryDetailResponse.data.success) {
              const retryPharmacyData = retryDetailResponse.data.data || retryDetailResponse.data;
              const retryImages = retryPharmacyData.images || [];
              const retryCertificateFile = retryImages.find(img => img.kind === kind);
              
              if (retryCertificateFile && retryCertificateFile.description2) {
                // 재생성된 파일 경로로 계속 진행
                const filePath = retryCertificateFile.description2;
                const fullPath = filePath.startsWith('http') ? filePath : 
                                (filePath.startsWith('/') ? `https://imet.kr${filePath}` : `https://imet.kr/${filePath}`);
                
                console.log(`[GET /certificate/${pharmacyId}/${certificateType}] 재생성된 파일 경로: ${fullPath}`);
                
                try {
                  const fileResponse = await axios.get(fullPath, {
                    responseType: 'stream',
                    timeout: 30000,
                    headers: { 'Accept': '*/*' }
                  });
                  
                  const contentType = fileResponse.headers['content-type'] || 'application/pdf';
                  res.setHeader('Content-Type', contentType);
                  const fileName = certificateType === 'expert' ? '전문인증권.pdf' : '화재증권.pdf';
                  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`);
                  fileResponse.data.pipe(res);
                  return;
                } catch (fileError) {
                  res.redirect(fullPath);
                  return;
                }
              }
            }
          }
        } catch (generateError) {
          console.error(`[GET /certificate/${pharmacyId}/${certificateType}] PDF 자동 생성 실패:`, generateError.message);
          // PDF 생성 실패 시 기존 에러 메시지 반환
        }
      }
      
      return res.status(404).json({
        success: false,
        error: '증권 파일을 찾을 수 없습니다. 증권번호를 다시 입력하여 PDF를 생성해주세요.'
      });
    }
    
    const filePath = certificateFile.description2;
    
    // 파일 경로가 상대 경로인 경우 절대 경로로 변환
    let fullPath;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      // 이미 전체 URL인 경우
      fullPath = filePath;
    } else if (filePath.startsWith('/')) {
      // 절대 경로인 경우
      fullPath = `https://imet.kr${filePath}`;
    } else {
      // 상대 경로인 경우
      fullPath = `https://imet.kr/${filePath}`;
    }
    
    console.log(`[GET /certificate/${pharmacyId}/${certificateType}] 증권 파일 경로: ${fullPath}`);
    
    // PHP 서버에서 파일 다운로드
    try {
      const fileResponse = await axios.get(fullPath, {
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'Accept': '*/*'
        }
      });
      
      // Content-Type 설정
      const contentType = fileResponse.headers['content-type'] || 'application/pdf';
      res.setHeader('Content-Type', contentType);
      
      // 파일명 설정
      const fileName = certificateType === 'expert' ? '전문인증권.pdf' : '화재증권.pdf';
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      
      // 파일 스트림 전송
      fileResponse.data.pipe(res);
      
    } catch (fileError) {
      console.error(`[GET /certificate/${pharmacyId}/${certificateType}] 파일 다운로드 오류:`, fileError.message);
      
      // 파일을 직접 다운로드할 수 없는 경우, URL을 리다이렉트
      res.redirect(fullPath);
    }
    
  } catch (error) {
    console.error(`[GET /certificate/${pharmacyId}/${certificateType}] 오류:`, error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: '증권 파일 조회 중 오류가 발생했습니다.',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: '증권 파일 조회 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }
});

// 보험료 검증 API 프록시
router.get('/premium-verify', async (req, res) => {
  try {
    const { pharmacy_id, all } = req.query;
    
    const params = new URLSearchParams();
    if (pharmacy_id) {
      params.append('pharmacy_id', pharmacy_id);
    }
    if (all === '1') {
      params.append('all', '1');
    }
    
    const apiUrl = `https://imet.kr/api/pharmacy/pharmacy-premium-verify.php?${params}`;
    
    console.log(`[GET /premium-verify] 보험료 검증 요청 - 약국ID: ${pharmacy_id || '전체'}`);
    
    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`[GET /premium-verify] 성공 - 보험료 검증 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error('보험료 검증 프록시 오류:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: '보험료 검증 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }
});

// package.json dependencies에 추가 필요:
// npm install multer
module.exports = router;
