from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Set
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception:
                self.disconnect(user_id)

    async def broadcast(self, message: dict):
        for user_id, connection in list(self.active_connections.items()):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(user_id)

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    # In a real app we would verify token here
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle incoming real-time data if needed (e.g. driver location update)
            if data.get("type") == "driver_location":
                # Need to forward this to the rider
                rider_id = data.get("rider_id")
                if rider_id:
                    await manager.send_personal_message({
                        "type": "location_update",
                        "latitude": data.get("latitude"),
                        "longitude": data.get("longitude"),
                        "ride_id": data.get("ride_id")
                    }, rider_id)
    except WebSocketDisconnect:
        manager.disconnect(user_id)
