// ==========================================
// 1. UI CORE DOM ELEMENT REFERENCES
// ==========================================
const statusDiv = document.getElementById('status');
const viewersBadge = document.getElementById('viewers-badge');
const imgElement = document.getElementById('camera-frame');
const canvas = document.getElementById('overlay-canvas');
const ctx = canvas.getContext('2d');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const myUsernameDisplay = document.getElementById('my-username');

const loginOverlay = document.getElementById('login-overlay');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');

// ==========================================
// 2. APPLICATION STATE MANAGEMENT
// ==========================================
let myCustomName = "";
let ws = null;

// ==========================================
// 3. ROOM LOGIN & INTERFACE LOGIC
// ==========================================
function attemptJoin() {
    const enteredName = usernameInput.value.trim();
    if (!enteredName) {
        alert("Please type a valid username!");
        return;
    }
    myCustomName = enteredName;
    loginOverlay.style.display = 'none';
    initializeWebSocket();
}

// Event Bindings for Entry Overlay
joinBtn.addEventListener('click', attemptJoin);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') attemptJoin();
});

// ==========================================
// 4. WEBSOCKET NETWORK STREAM CONNECTION
// ==========================================
function initializeWebSocket() {
    // Falls back safely if window location properties are unassigned
    const host = window.location.hostname || "localhost";
    ws = new WebSocket(`ws://${host}:8089`);

    ws.onopen = () => {
        statusDiv.textContent = 'Connected';
        statusDiv.className = 'badge connected';
        
        // Immediately register identity with the server cluster
        const regPayload = {
            type: 'register',
            username: myCustomName
        };
        ws.send(JSON.stringify(regPayload));
        myUsernameDisplay.textContent = `You: ${myCustomName}`;
    };

    ws.onclose = () => {
        statusDiv.textContent = 'Disconnected';
        statusDiv.className = 'badge disconnected';
        viewersBadge.textContent = '👥 0 Online';
        
        // Clear canvas context safely on disconnection
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Handle Real-Time Camera Tracking Frames
            if (data.type === 'video') {
                if (data.frame) {
                    imgElement.src = "data:image/png;base64," + data.frame;
                    
                    // Fallback to strict base configurations if layout geometries are 0
                    const targetWidth = imgElement.clientWidth || 640;
                    const targetHeight = imgElement.clientHeight || 480;

                    // Only update dimensions if values change to prevent resetting canvas coordinates
                    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                    }
                }
                
                // Clear bounding canvas layer before drawing updates
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Render computer vision face bounding boxes
                if (data.faces && Array.isArray(data.faces)) {
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 3;
                    ctx.fillStyle = '#00FF00';
                    ctx.font = '16px Arial';
                    
                    data.faces.forEach((face, index) => {
                        if (face.length === 4) {
                            const [x, y, w, h] = face;
                            ctx.strokeRect(x, y, w, h);
                            ctx.fillText(`Face ${index + 1}`, x, y > 20 ? y - 8 : y + 20);
                        }
                    });
                }
            }
            // Handle Network System Logs & Room Counter Alerts
            else if (data.type === 'system') {
                const sysDiv = document.createElement('div');
                sysDiv.className = 'message-system';
                sysDiv.textContent = data.text; // Security protection against DOM string injection
                chatMessages.appendChild(sysDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                if (data.count !== undefined) {
                    viewersBadge.textContent = `👥 ${data.count} Online`;
                }
            }
            // Handle Distributed Instant Chat Messaging
            else if (data.type === 'chat') {
                const block = document.createElement('div');
                block.className = 'message-block';
                if (data.username === myCustomName) {
                    block.classList.add('is-me');
                }

                const meta = document.createElement('div');
                meta.className = 'message-meta';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'user-name';
                nameSpan.textContent = data.username;
                
                const timeSpan = document.createElement('span');
                timeSpan.className = 'timestamp';
                
                const time = data.timestamp ? new Date(data.timestamp) : new Date();
                timeSpan.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                meta.appendChild(nameSpan);
                meta.appendChild(timeSpan);
                
                const textDiv = document.createElement('div');
                textDiv.className = 'message-text';
                textDiv.textContent = data.text; // Prevents arbitrary script injection execution (XSS)
                
                block.appendChild(meta);
                block.appendChild(textDiv);
                chatMessages.appendChild(block);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (err) {
            console.error("Error breaking down incoming JSON stream payload:", err);
        }
    };
}
// ==========================================
// 5. CHAT TEXT TRANSMISSION PIPELINE
// ==========================================
function sendMessage() {
    const text = messageInput.value.trim();
    if (text && ws && ws.readyState === WebSocket.OPEN) {
        const payload = {
            type: 'chat',
            text: text
        };
        ws.send(JSON.stringify(payload));
        messageInput.value = '';
    }
}

// Event Bindings for Messaging Room Input
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});