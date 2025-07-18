export class ChatSession {
    constructor(roomId, user1, user2) {
      this.roomId = roomId;
      this.user1 = user1;
      this.user2 = user2;
      this.messages = [];
    }
  }