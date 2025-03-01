const BASE_URL = 'http://localhost:3000';
let currentUser = null;

// Helper function to make API calls
async function fetchData(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    return response.json();
}

// Show/hide sections based on login status
function updateUI() {
    const isLoggedIn = currentUser !== null;

    // Show opening section only if not logged in
    document.getElementById('opening-section').style.display = isLoggedIn ? 'none' : 'block';

    // Show profile, upload, and credit request sections only if logged in
    document.getElementById('profile-section').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('upload-section').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('credit-request-section').style.display = isLoggedIn ? 'block' : 'none';
}

// Register a new user
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const data = await fetchData('/auth/register', 'POST', { username, password });
    if (data.userId) {
        alert('Registration successful! Please log in.');
        document.getElementById('register-form').reset();
    } else {
        alert('Registration failed. Username may already exist.');
    }
});

// Login an existing user
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const data = await fetchData('/auth/login', 'POST', { username, password });
    if (data.userId) {
        currentUser = data;
        alert('Login successful!');
        updateUI();
        loadProfile();
        document.getElementById('login-form').reset();
    } else {
        alert('Login failed. Invalid credentials.');
    }
});

// Load user profile
async function loadProfile() {
    if (!currentUser) return;

    const data = await fetchData(`/user/profile/${currentUser.userId}`);
    if (data.credits !== undefined) {
        document.getElementById('profile-username').textContent = currentUser.username;
        document.getElementById('profile-credits').textContent = data.credits;
    } else {
        alert('Failed to load profile.');
    }
}

// Upload a document
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }

    const content = document.getElementById('document-content').value;
    const data = await fetchData('/scan/upload', 'POST', { userId: currentUser.userId, content });

    if (data.documentId) {
        alert('Document uploaded successfully!');
        document.getElementById('upload-form').reset();
        loadMatches(data.documentId); // Load matching documents
    } else {
        alert('Failed to upload document.');
    }
});

// Load matching documents
async function loadMatches(docId) {
    if (!currentUser) return;

    const data = await fetchData(`/scan/matches/${docId}`);
    if (Array.isArray(data)) {
        const matchesList = document.getElementById('matches-list');
        matchesList.innerHTML = data.map(doc => `<li>Document ID: ${doc.id}</li>`).join('');
    } else {
        alert('Failed to load matching documents.');
    }
}

// Request additional credits
document.getElementById('credit-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }

    const data = await fetchData('/user/credits/request', 'POST', { userId: currentUser.userId });
    if (data.requestId) {
        alert('Credit request submitted. Waiting for admin approval.');
        document.getElementById('credit-request-form').reset();
    } else {
        alert('Failed to submit credit request.');
    }
});

// Initial setup
updateUI();