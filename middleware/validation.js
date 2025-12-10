// ==============================
// middleware/validation.js - 입력 검증 미들웨어 (실제 테이블 구조에 맞춤)
// ==============================
const { body, validationResult } = require('express-validator');

// 검증 결과 처리 미들웨어
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '입력값이 올바르지 않습니다.',
            errors: errors.array()
        });
    }
    next();
};

// 로그인 검증
const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('올바른 이메일 형식이 아닙니다.'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
    handleValidationErrors
];

// 사용자 등록 검증
const validateUserRegistration = [
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('올바른 이메일 형식이 아닙니다.'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('비밀번호는 최소 8자 이상, 대소문자와 숫자를 포함해야 합니다.'),
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('이름은 2-50자 사이여야 합니다.'),
    body('phone')
        .optional()
        .matches(/^[0-9-+\s()]+$/)
        .withMessage('올바른 전화번호 형식이 아닙니다.'),
    body('employee_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('사번은 1-20자 사이여야 합니다.'),
    body('department_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('올바른 부서를 선택해주세요.'),
    body('position')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('직급은 50자 이하여야 합니다.'),
    body('hire_date')
        .optional()
        .isISO8601()
        .withMessage('올바른 입사일 형식이 아닙니다.'),
    body('role')
        .isIn(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER', 'EMPLOYEE'])
        .withMessage('올바른 역할을 선택해주세요.'),
    body('work_type')
        .optional()
        .isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT'])
        .withMessage('올바른 근무형태를 선택해주세요.'),
    body('work_schedule')
        .optional()
        .isIn(['4_DAY', 'FLEXIBLE', 'STANDARD'])
        .withMessage('올바른 근무일정을 선택해주세요.'),
    handleValidationErrors
];

// 사용자 정보 수정 검증
const validateUserUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('이름은 2-50자 사이여야 합니다.'),
    body('phone')
        .optional()
        .matches(/^[0-9-+\s()]+$/)
        .withMessage('올바른 전화번호 형식이 아닙니다.'),
    body('employee_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('사번은 1-20자 사이여야 합니다.'),
    body('department_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('올바른 부서를 선택해주세요.'),
    body('position')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('직급은 50자 이하여야 합니다.'),
    body('hire_date')
        .optional()
        .isISO8601()
        .withMessage('올바른 입사일 형식이 아닙니다.'),
    body('role')
        .optional()
        .isIn(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER', 'EMPLOYEE'])
        .withMessage('올바른 역할을 선택해주세요.'),
    body('work_type')
        .optional()
        .isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT'])
        .withMessage('올바른 근무형태를 선택해주세요.'),
    body('work_schedule')
        .optional()
        .isIn(['4_DAY', 'FLEXIBLE', 'STANDARD'])
        .withMessage('올바른 근무일정을 선택해주세요.'),
    handleValidationErrors
];

module.exports = {
    validateLogin,
    validateUserRegistration,
    validateUserUpdate,
    handleValidationErrors
};