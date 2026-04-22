const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let currentToken = null;
let currentReceiver = null;
let isLoginMode = true;
let userPrivateKey = null;

// UI Elements
const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const messagesContainer = document.getElementById('messages-container');
const userList = document.getElementById('user-list');
const receiverName = document.getElementById('receiver-name');
const messageInputArea = document.getElementById('message-input-area');

// Session persistence check
window.addEventListener('load', () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
        currentToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
});

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    authTitle.innerText = isLoginMode ? 'Sign In' : 'Sign Up';
    authBtn.innerText = isLoginMode ? 'Login' : 'Register';
    document.querySelector('.toggle-auth').innerHTML = isLoginMode ?
        'New user? <span onclick="toggleAuthMode()">Create account</span>' :
        'Already have an account? <span onclick="toggleAuthMode()">Login</span>';
}

async function handleAuth() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) return alert('Fill all fields');

    const endpoint = isLoginMode ? '/login' : '/register';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            if (isLoginMode) {
                currentUser = data.user;
                currentToken = data.token;
                localStorage.setItem('token', currentToken);
                localStorage.setItem('user', JSON.stringify(currentUser));
                showDashboard();
            } else {
                alert('Registration successful! Please login.');
                toggleAuthMode();
            }
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Connection error');
    }
}

async function showDashboard() {
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    document.getElementById('current-user-display').innerText = currentUser.username;
    document.getElementById('avatar-char').innerText = currentUser.username.charAt(0).toUpperCase();

    await fetchUserPrivateKey();
    loadUsers();
    setInterval(loadMessages, 5000);
}

async function fetchUserPrivateKey() {
    try {
        const response = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        userPrivateKey = data.private_key;
    } catch (e) {
        console.error('Key fetch error', e);
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const users = await response.json();
        window.allUsers = users;
        userList.innerHTML = users.map(u => `
            <div class="user-link" onclick="selectUser('${u.id}', '${u.username}')" id="user-${u.id}">
                <div class="avatar-md">${u.username.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="user-name">${u.username}</div>
                    <div class="user-meta">Secure Channel Active</div>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

function selectUser(id, username) {
    currentReceiver = id;
    receiverName.innerText = username;
    messageInputArea.classList.remove('hidden');

    document.querySelectorAll('.user-link').forEach(li => li.classList.remove('active'));
    const li = document.getElementById(`user-${id}`);
    if (li) li.classList.add('active');

    loadMessages();
}

async function sendMessage() {
    const input = document.getElementById('message-text');
    const content = input.value;
    if (!content || !currentReceiver) return;

    const receiver = window.allUsers.find(u => String(u.id) === String(currentReceiver));
    if (!receiver) return alert('Receiver not found');

    try {
        const publicKey = forge.pki.publicKeyFromPem(receiver.public_key);
        const buffer = forge.util.encodeUtf8(content);
        const encrypted = publicKey.encrypt(buffer, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() }
        });
        const ciphertext = forge.util.encode64(encrypted);

        const response = await fetch(`${API_URL}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ receiverId: currentReceiver, ciphertext })
        });

        if (response.ok) {
            input.value = '';
            loadMessages();
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadMessages() {
    if (!currentReceiver) return;

    try {
        const response = await fetch(`${API_URL}/messages`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const messages = await response.json();

        messagesContainer.innerHTML = messages.filter(m =>
            (String(m.sender.id) === String(currentUser.id) && String(m.receiver.id) === String(currentReceiver)) ||
            (String(m.sender.id) === String(currentReceiver) && String(m.receiver.id) === String(currentUser.id))
        ).map(m => {
            let plaintext = '[Encrypted]';
            let decryptionSuccess = false;

            if (String(m.receiver.id) === String(currentUser.id)) {
                try {
                    plaintext = decryptMessage(m.ciphertext);
                    decryptionSuccess = true;
                } catch (e) { plaintext = '[Decryption Error]'; }
            } else if (String(m.sender.id) === String(currentUser.id)) {
                plaintext = '[Encrypted for Receiver]';
            }

            const isSent = String(m.sender.id) === String(currentUser.id);
            return `
                <div class="bubble-wrapper ${isSent ? 'sent' : 'received'}">
                    <div class="bubble" id="msg-${m.id}">
                        <div class="msg-content">
                            <p class="plaintext">${plaintext}</p>
                            <p class="ciphertext hidden">${m.ciphertext}</p>
                        </div>
                        <button class="toggle-crypto" onclick="toggleCryptoView(${m.id})">
                            View Encryption
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (err) { console.error(err); }
}

function decryptMessage(ciphertext) {
    if (!userPrivateKey) return '[Key Missing]';
    const privateKey = forge.pki.privateKeyFromPem(userPrivateKey);
    const encrypted = forge.util.decode64(ciphertext);
    const decrypted = privateKey.decrypt(encrypted, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() }
    });
    return forge.util.encodeUtf8(decrypted);
}

function toggleCryptoView(msgId) {
    const msgElement = document.getElementById(`msg-${msgId}`);
    const plaintext = msgElement.querySelector('.plaintext');
    const ciphertext = msgElement.querySelector('.ciphertext');
    const btn = msgElement.querySelector('.toggle-crypto');

    if (ciphertext.classList.contains('hidden')) {
        ciphertext.classList.remove('hidden');
        plaintext.classList.add('hidden');
        btn.innerText = 'View Decrypted';
    } else {
        ciphertext.classList.add('hidden');
        plaintext.classList.remove('hidden');
        btn.innerText = 'View Encryption';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
}
