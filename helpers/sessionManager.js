class SessionManager {
    constructor() {
        this.sessions = new Map()
        this.SESSION_TIMEOUT = 600000 // 10 minutes
    }
    createSession(userId, transactionId, payment) {
        this.sessions.set(userId, {
            transactionId,
            payment,
            expiresAt: Date.now() + this.SESSION_TIMEOUT
        })
    }
    getSession(userId) {
        return this.sessions.get(userId)
    }
    isSessionExpired(userId) {
        const session = this.sessions.get(userId)
        if (!session) return true
        return Date.now() > session.expiresAt
    }
    deleteSession(userId) {
        this.sessions.delete(userId)
    }
}

export const sessionManager = new SessionManager()