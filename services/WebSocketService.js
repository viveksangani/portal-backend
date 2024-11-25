class WebSocketService {
  constructor() {
    this.connections = new Map(); // userId -> WebSocket
  }

  addConnection(userId, ws) {
    this.connections.set(userId, ws);
  }

  removeConnection(userId) {
    this.connections.delete(userId);
  }

  sendToUser(userId, message) {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === 1) { // 1 = OPEN
      ws.send(JSON.stringify(message));
    }
  }

  broadcastMessage(message) {
    this.connections.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

const wsService = new WebSocketService();
module.exports = wsService; 