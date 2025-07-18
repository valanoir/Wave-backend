export function MatchUsers(waitingPool, socket, guestChatCounts, maxGuestChats = 5) {
  waitingPool.delete(socket);

  // Enforce guest chat limit
  if (socket.isGuest) {
    if (!guestChatCounts[socket.userId]) guestChatCounts[socket.userId] = 0;
    if (guestChatCounts[socket.userId] >= maxGuestChats) {
      socket.emit('limit_reached');
      return;
    }
  }

  for (let other of waitingPool) {
    if (other !== socket) {
      const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      socket.join(roomId);
      other.join(roomId);
      socket.emit('matched', { roomId, user1: socket.userId, user2: other.userId });
      other.emit('matched', { roomId, user1: socket.userId, user2: other.userId });
      waitingPool.delete(other);
      return;
    }
  }
  waitingPool.add(socket);
}