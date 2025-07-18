import { MatchUsers } from '../../domain/useCases/MatchUsers.js';
import { RelayMessage } from '../../domain/useCases/RelayMessage.js';
import { TrackGuestChats } from '../../domain/useCases/TrackGuestChats.js';

export function ChatController(io, chatRepository, waitingPool, guestChatCounts, onlineLoggedInUsers, onlineGuestUsers, onlineUserRepository) {
  return (socket) => {
    // Get userId and isGuest from handshake query
    const userId = socket.handshake.query.userId || socket.id;
    const isGuest = socket.handshake.query.isGuest === 'true';

    socket.userId = userId;
    socket.isGuest = isGuest;

    console.log(`[CONNECT] User connected: ${userId} (Guest: ${isGuest})`);

    // Register in online user repository (MongoDB)
    onlineUserRepository.addOnlineUser(userId, isGuest);

    // Add to in-memory sets
    if (isGuest) {
      onlineGuestUsers.add(userId);
    } else {
      onlineLoggedInUsers.add(userId);
    }

    // Print debug info
    console.log(`[CONNECT] User connected: ${userId} (Guest: ${isGuest})`);
    console.log(`[ONLINE USERS] LoggedIn:`, Array.from(onlineLoggedInUsers));
    console.log(`[ONLINE USERS] Guests:`, Array.from(onlineGuestUsers));

    io.emit('users_online', {
      loggedIn: onlineLoggedInUsers.size,
      guests: onlineGuestUsers.size,
      total: onlineLoggedInUsers.size + onlineGuestUsers.size,
    });

    socket.on('join_chat', () => {
      MatchUsers(waitingPool, socket, guestChatCounts);
    });

    socket.on('send_message', (data) => {
      const { roomId, ...message } = data;
      RelayMessage(io, roomId, message);
    });

    socket.on('end_chat', ({ roomId }) => {
      chatRepository.endSession(roomId);
      socket.leave(roomId);
      if (socket.isGuest) {
        if (!guestChatCounts[socket.userId]) guestChatCounts[socket.userId] = 0;
        guestChatCounts[socket.userId]++;
      }
      MatchUsers(waitingPool, socket, guestChatCounts);
      // Print debug info
      console.log(`[END CHAT] Session ended: ${roomId}`);
    });

    socket.on('chat_session_started', ({ roomId, user1, user2 }) => {
      // Print debug info for chat session
      console.log(`[CHAT SESSION] Session ID: ${roomId}, Users: ${user1}, ${user2}`);
    });

    socket.on('report_user', ({ reportedUserId, reason }) => {
      console.log(`User ${socket.userId} reported ${reportedUserId}: ${reason}`);
    });

    socket.on('disconnect', async () => {
      waitingPool.delete(socket);
      if (socket.isGuest) {
        onlineGuestUsers.delete(userId);
      } else {
        onlineLoggedInUsers.delete(userId);
      }
      await onlineUserRepository.removeOnlineUser(userId);
      io.emit('users_online', {
        loggedIn: onlineLoggedInUsers.size,
        guests: onlineGuestUsers.size,
        total: onlineLoggedInUsers.size + onlineGuestUsers.size,
      });
      // Print debug info
      console.log(`[DISCONNECT] User disconnected: ${userId}`);
      console.log(`[ONLINE USERS] LoggedIn:`, Array.from(onlineLoggedInUsers));
      console.log(`[ONLINE USERS] Guests:`, Array.from(onlineGuestUsers));
    });
  };
}