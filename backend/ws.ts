// backend/ws.ts


const clients = new Map<number, Set<WebSocket>>();

export function addClient(userId: number, socket: WebSocket) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  
  
  clients.get(userId)!.add(socket);
  
  console.log(`🔌 User ${userId} connected. Total Tabs: ${clients.get(userId)!.size}`);

  socket.onclose = () => {
    const userSockets = clients.get(userId);
    if (userSockets) {
      userSockets.delete(socket);
      console.log(`🔌 User ${userId} disconnected tab. Remaining Tabs: ${userSockets.size}`);
      if (userSockets.size === 0) {
        clients.delete(userId);
      }
    }
  };
  
  socket.onerror = (e) => {
      console.error("WS Error:", e);
  }
}

export function broadcast(userId: number, message: string) {
  const userSockets = clients.get(userId);
  
  if (userSockets) {
    console.log(` Broadcasting to User ${userId} (${userSockets.size} active tabs)`);
    for (const socket of userSockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  } else {
    console.log(` User ${userId} has no active sockets to broadcast.`);
  }
}