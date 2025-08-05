// services/SessionManager.ts
export interface ActiveSession {
  userId: number;
  username: string;
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export class SessionManager {
  private static instance: SessionManager;
  private activeSessions = new Map<string, ActiveSession>();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Nettoyage automatique toutes les 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Ajouter une session lors du login
  addSession(username: string, userId: number, expiresAt: Date): void {
    const session: ActiveSession = {
      userId,
      username,
      loginTime: new Date(),
      lastActivity: new Date(),
      expiresAt
    };

    this.activeSessions.set(username, session);
    console.log(`✅ Session added for ${username}, total active: ${this.activeSessions.size}`);
  }

  // Supprimer une session lors du logout
  removeSession(username: string): boolean {
    const removed = this.activeSessions.delete(username);
    if (removed) {
      console.log(`🔄 Session removed for ${username}, total active: ${this.activeSessions.size}`);
    }
    return removed;
  }

  // Mettre à jour l'activité d'une session
  updateActivity(username: string): void {
    const session = this.activeSessions.get(username);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  // Vérifier si un utilisateur est en ligne
  isUserOnline(username: string): boolean {
    const session = this.activeSessions.get(username);
    if (!session) return false;

    // Vérifier si la session n'a pas expiré
    if (new Date() > session.expiresAt) {
      this.removeSession(username);
      return false;
    }

    return true;
  }

  // Obtenir la liste des utilisateurs en ligne
  getOnlineUsers(): string[] {
    this.cleanupExpiredSessions();
    return Array.from(this.activeSessions.keys());
  }

  // Obtenir les détails d'une session
  getSession(username: string): ActiveSession | undefined {
    return this.activeSessions.get(username);
  }


  // Nettoyer les sessions expirées
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [username, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt) {
        this.activeSessions.delete(username);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired sessions`);
    }
  }

//   // Obtenir les statistiques des sessions
//   getStats() {
//     return {
//       totalActive: this.activeSessions.size,
//       sessions: Array.from(this.activeSessions.entries()).map(([username, session]) => ({
//         username,
//         loginTime: session.loginTime,
//         lastActivity: session.lastActivity,
//         expiresAt: session.expiresAt
//       }))
//     };
//   }

  // Nettoyer lors de l'arrêt de l'application
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.activeSessions.clear();
  }
}

export const sessionManager = SessionManager.getInstance();