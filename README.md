Real-Time Video Streaming & Chat Server

A Python-based server that streams live video from a webcam, performs face detection, and handles multi-user chat over WebSockets using asynchronous I/O.

Features
Live Video Streaming: Captures webcam frames and streams them as Base64-encoded PNGs over WebSockets.

Face Detection: Extracts coordinates of faces detected in the video stream in real time.
Multi-User Chat Room: Allows clients to register a custom username and broadcast messages to all connected peers.
Live Counter: Tracks and broadcasts the real-time count of actively registered viewers.
Concurrent Networking: Handles concurrent connections and frame broadcasts efficiently using asyncio.
Graceful Shutdown: Intercepts Ctrl+C to safely stop video hardware threads and close network loops.

System Architecture

The application initializes two main components alongside the WebSocket infrastructure:

HTTP Server: Serves static frontend files (HTML/JS) on port 8088.
WebSocket Server: Coordinates the video stream, face data payloads, and chat state on port 8089.

Installation

Prerequisites

Ensure you have Python 3.8+ installed on your system.

Dependencies

Install the required core libraries using pip:

bash
pip install opencv-python websockets

Usage

bash 
python main.py

Once initialized, the terminal will display:

System running with live viewer counter. Press Ctrl+C to kill...

To shut down the servers and release camera hardware safely, press Ctrl+C.

WebSocket API Protocol
The server communicates using structured JSON payloads. All client-to-server messages must include a type key.

Client Messages

1. Register User
Sent by the client modal to unlock the video stream and register a username.

json{
  "type": "register",
  "username": "JohnDoe"
}

2. Send Chat Message
Sent by a registered user to broadcast a chat message.
json{
  "type": "chat",
  "text": "Hello everyone!"
}

Server Broadcasts
1. System AlertsBroadcasted to all users when someone joins or leaves the chat.
json{
  "type": "system",
  "text": "👋 JohnDoe joined the chat",
  "count": 1
}

2. Chat Delivery
Broadcasted to all users when a chat message is handled.
json{
  "type": "chat",
  "username": "JohnDoe",
  "text": "Hello everyone!",
  "timestamp": "2026-08-24T13:01:00.000Z"
}

3. Video Frame Update
Continuously sent to individual registered clients at a 40ms interval (~25 FPS).
json{
  "type": "video",
  "frame": "iVBORw0KGgoAAAANSUhEUgAA...",
  "faces": [[100, 120, 50, 50]]
}

