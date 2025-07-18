export function TrackGuestChats(guestChatCounts, socket) {
    if (!guestChatCounts[socket.id]) guestChatCounts[socket.id] = 0;
    guestChatCounts[socket.id]++;
  }