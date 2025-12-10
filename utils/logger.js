// ==============================
// utils/logger.js - 로깅 유틸리티
// ==============================
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };
        return JSON.stringify(logEntry) + '\n';
    }

    writeToFile(filename, message) {
        const filePath = path.join(this.logDir, filename);
        fs.appendFileSync(filePath, message);
    }

    info(message, meta = {}) {
        const logMessage = this.formatMessage('INFO', message, meta);
        console.log(logMessage.trim());
        this.writeToFile('app.log', logMessage);
    }

    error(message, error = null, meta = {}) {
        const errorMeta = error ? {
            error: {
                message: error.message,
                stack: error.stack
            },
            ...meta
        } : meta;

        const logMessage = this.formatMessage('ERROR', message, errorMeta);
        console.error(logMessage.trim());
        this.writeToFile('error.log', logMessage);
    }

    warn(message, meta = {}) {
        const logMessage = this.formatMessage('WARN', message, meta);
        console.warn(logMessage.trim());
        this.writeToFile('app.log', logMessage);
    }

    debug(message, meta = {}) {
        if (process.env.NODE_ENV === 'development') {
            const logMessage = this.formatMessage('DEBUG', message, meta);
            console.log(logMessage.trim());
            this.writeToFile('debug.log', logMessage);
        }
    }

    // 사용자 활동 로깅
    logUserActivity(userId, action, details = {}) {
        this.info('User activity', {
            userId,
            action,
            details,
            type: 'user_activity'
        });
    }

    // 시스템 로깅
    logSystemEvent(event, details = {}) {
        this.info('System event', {
            event,
            details,
            type: 'system_event'
        });
    }
}

module.exports = new Logger();
