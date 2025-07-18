// In-memory chat sessions
export class ChatRepository {
    constructor() {
      this.sessions = new Map(); // roomId -> ChatSession
    }
    createSession(roomId, user1, user2) {
      this.sessions.set(roomId, { roomId, user1, user2, messages: [] });
    }
    getSession(roomId) {
      return this.sessions.get(roomId);
    }
    endSession(roomId) {
      this.sessions.delete(roomId);
    }
  }