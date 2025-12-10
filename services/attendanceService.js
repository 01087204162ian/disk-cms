// ==============================
// services/attendanceService.js - 출퇴근 서비스 (KST 저장 최소 수정)
// ==============================
const { pool } = require('../config/database');

class AttendanceService {
    
    // 출근 처리
    static async checkIn(userId) {
        try {
            // ✅ 한국 날짜
            const today = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(new Date()).replace(/\./g, '').replace(/\s+/g, ' ').trim()
              .replace(/^(\d{4}) (\d{2}) (\d{2})$/, '$1-$2-$3');

            // 오늘 이미 출근했는지 확인
            const [existingAttendance] = await pool.execute(`
                SELECT id, check_in_time, check_out_time 
                FROM attendance 
                WHERE user_id = ? AND work_date = ?
            `, [userId, today]);

            if (existingAttendance.length > 0) {
                const record = existingAttendance[0];
                if (record.check_in_time) {
                    return {
                        success: false,
                        message: '이미 출근 처리되었습니다.',
                        data: {
                            checkInTime: new Date(record.check_in_time).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Seoul',
                                hour12: false
                            })
                        }
                    };
                }
            }

            // ✅ 한국시간 문자열
            const now = new Date();
            const checkInTime = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hourCycle: 'h23'
            }).format(now).replace(/\./g, '').replace(/\s+/g, ' ').trim()
              .replace(/^(\d{4}) (\d{2}) (\d{2}) (\d{2}):(\d{2}):(\d{2})$/, '$1-$2-$3 $4:$5:$6');
            
            console.log('=== 출근 처리 (한국 시간대) ===');
            console.log('현재 시간(KST):', checkInTime);
            console.log('DB 저장:', checkInTime);
            
            if (existingAttendance.length > 0) {
                await pool.execute(`
                    UPDATE attendance 
                    SET check_in_time = ?, updated_at = NOW()
                    WHERE user_id = ? AND work_date = ?
                `, [checkInTime, userId, today]);
            } else {
                await pool.execute(`
                    INSERT INTO attendance (user_id, work_date, check_in_time, status, created_at, updated_at)
                    VALUES (?, ?, ?, 'PRESENT', NOW(), NOW())
                `, [userId, today, checkInTime]);
            }

            return {
                success: true,
                message: '출근이 완료되었습니다.',
                data: {
                    checkInTime: now.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Seoul',
                        hour12: false
                    }),
                    workDate: today
                }
            };

        } catch (error) {
            console.error('출근 처리 오류:', error);
            throw error;
        }
    }

    // 퇴근 처리
    static async checkOut(userId) {
        try {
            // ✅ 한국 날짜
            const today = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(new Date()).replace(/\./g, '').replace(/\s+/g, ' ').trim()
              .replace(/^(\d{4}) (\d{2}) (\d{2})$/, '$1-$2-$3');
            
            // 오늘 출근 기록 확인
            const [attendanceRecord] = await pool.execute(`
                SELECT id, check_in_time, check_out_time 
                FROM attendance 
                WHERE user_id = ? AND work_date = ?
            `, [userId, today]);

            if (attendanceRecord.length === 0) {
                return {
                    success: false,
                    message: '출근 기록이 없습니다. 먼저 출근 처리를 해주세요.'
                };
            }

            const record = attendanceRecord[0];
            
            if (!record.check_in_time) {
                return {
                    success: false,
                    message: '출근 처리가 되지 않았습니다. 먼저 출근 처리를 해주세요.'
                };
            }

            if (record.check_out_time) {
                return {
                    success: false,
                    message: '이미 퇴근 처리되었습니다.',
                    data: {
                        checkOutTime: new Date(record.check_out_time).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Seoul',
                            hour12: false
                        })
                    }
                };
            }

            // ✅ 한국시간 문자열
            const now = new Date();
            const checkOutTime = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hourCycle: 'h23'
            }).format(now).replace(/\./g, '').replace(/\s+/g, ' ').trim()
              .replace(/^(\d{4}) (\d{2}) (\d{2}) (\d{2}):(\d{2}):(\d{2})$/, '$1-$2-$3 $4:$5:$6');
            
            console.log('=== 퇴근 처리 (한국 시간대) ===');
            console.log('현재 시간(KST):', checkOutTime);
            console.log('DB 저장:', checkOutTime);
            console.log('출근시간 (DB):', record.check_in_time);
            
            // 근무시간 계산 - 간단하게
            const checkInTime = new Date(record.check_in_time);
            console.log('출근 Date:', checkInTime);
            console.log('퇴근 Date:', now);
            
            const workHours = this.calculateWorkHours(checkInTime, now);

            // 퇴근 시간과 근무시간 업데이트
            await pool.execute(`
                UPDATE attendance 
                SET check_out_time = ?, work_hours = ?, updated_at = NOW()
                WHERE id = ?
            `, [checkOutTime, workHours, record.id]);

            return {
                success: true,
                message: '퇴근이 완료되었습니다.',
                data: {
                    checkOutTime: now.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Seoul',
                        hour12: false
                    }),
                    workHours: workHours,
                    workDate: today
                }
            };

        } catch (error) {
            console.error('퇴근 처리 오류:', error);
            throw error;
        }
    }

    // 오늘 출퇴근 상태 조회
    static async getTodayAttendance(userId) {
        try {
            // ✅ 한국 날짜
            const today = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(new Date()).replace(/\./g, '').replace(/\s+/g, ' ').trim()
              .replace(/^(\d{4}) (\d{2}) (\d{2})$/, '$1-$2-$3');
            
            const [result] = await pool.execute(`
                SELECT 
                    check_in_time,
                    check_out_time,
                    work_hours,
                    status,
                    DATE_FORMAT(check_in_time, '%H:%i') as formatted_check_in,
                    DATE_FORMAT(check_out_time, '%H:%i') as formatted_check_out
                FROM attendance 
                WHERE user_id = ? AND work_date = ?
            `, [userId, today]);

            return result[0] || null;

        } catch (error) {
            console.error('오늘 출퇴근 조회 오류:', error);
            throw error;
        }
    }

    // 근무시간 계산 (한국시간 기준)
    static calculateWorkHours(checkInTime, checkOutTime) {
        console.log('=== 근무시간 계산 (한국시간 기준) ===');
        console.log('출근시간:', checkInTime);
        console.log('퇴근시간:', checkOutTime);
        
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        console.log('시간 차이 (밀리초):', diffMs);
        
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        console.log('시간 차이 (분):', diffMinutes);
        
        const diffHours = diffMs / (1000 * 60 * 60);
        console.log('시간 차이 (시간):', diffHours);
        
        // 점심시간 1시간 제외 (8시간 이상 근무 시만)
        let workHours = diffHours;
        if (diffHours >= 8) {
            workHours = diffHours - 1;
            console.log('8시간 이상 → 점심시간 1시간 제외');
        }
        
        // 음수나 매우 작은 값 처리
        if (workHours < 0) {
            workHours = 0;
        }
        
        const finalHours = Math.round(workHours * 10) / 10;
        console.log('최종 근무시간:', finalHours, '시간');
        console.log('============================');
        
        return finalHours;
    }

    // 월별 출근 통계
    static async getMonthlyAttendanceStats(userId, year, month) {
        try {
            const [result] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_days,
                    SUM(CASE WHEN check_in_time IS NOT NULL THEN 1 ELSE 0 END) as attendance_days,
                    SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late_days,
                    SUM(work_hours) as total_work_hours,
                    AVG(work_hours) as avg_work_hours
                FROM attendance 
                WHERE user_id = ? 
                AND YEAR(work_date) = ? 
                AND MONTH(work_date) = ?
            `, [userId, year, month]);

            const stats = result[0];
            
            return {
                totalDays: stats.total_days || 0,
                attendanceDays: stats.attendance_days || 0,
                lateDays: stats.late_days || 0,
                totalWorkHours: parseFloat(stats.total_work_hours || 0),
                avgWorkHours: parseFloat(stats.avg_work_hours || 0),
                attendanceRate: stats.total_days > 0 ? 
                    Math.round((stats.attendance_days / stats.total_days) * 100) : 0
            };

        } catch (error) {
            console.error('월별 출근 통계 조회 오류:', error);
            throw error;
        }
    }

    // 주간 출근 기록 조회
    static async getWeeklyAttendance(userId, startDate, endDate) {
        try {
            const [result] = await pool.execute(`
                SELECT 
                    work_date,
                    check_in_time,
                    check_out_time,
                    work_hours,
                    status,
                    DATE_FORMAT(check_in_time, '%H:%i') as formatted_check_in,
                    DATE_FORMAT(check_out_time, '%H:%i') as formatted_check_out,
                    DAYOFWEEK(work_date) as day_of_week
                FROM attendance 
                WHERE user_id = ? 
                AND work_date BETWEEN ? AND ?
                ORDER BY work_date DESC
            `, [userId, startDate, endDate]);

            return result.map(record => ({
                ...record,
                dayName: this.getDayName(record.day_of_week)
            }));

        } catch (error) {
            console.error('주간 출근 기록 조회 오류:', error);
            throw error;
        }
    }

    // 요일명 반환
    static getDayName(dayOfWeek) {
        const days = ['', '일', '월', '화', '수', '목', '금', '토'];
        return days[dayOfWeek] || '';
    }

    // 지각 여부 판단 (오전 9시 기준)
    static isLate(checkInTime) {
        if (!checkInTime) return false;
        
        const checkIn = new Date(checkInTime);
        const workStartTime = new Date(checkIn);
        workStartTime.setHours(9, 0, 0, 0); // 오전 9시
        
        return checkIn > workStartTime;
    }

    // 출근 기록 수정 (관리자용)
    static async updateAttendance(attendanceId, updateData) {
        try {
            const { checkInTime, checkOutTime, workHours, status, notes } = updateData;
            
            await pool.execute(`
                UPDATE attendance 
                SET 
                    check_in_time = COALESCE(?, check_in_time),
                    check_out_time = COALESCE(?, check_out_time),
                    work_hours = COALESCE(?, work_hours),
                    status = COALESCE(?, status),
                    notes = COALESCE(?, notes),
                    updated_at = NOW()
                WHERE id = ?
            `, [checkInTime, checkOutTime, workHours, status, notes, attendanceId]);

            return {
                success: true,
                message: '출근 기록이 수정되었습니다.'
            };

        } catch (error) {
            console.error('출근 기록 수정 오류:', error);
            throw error;
        }
    }
}

module.exports = AttendanceService;
