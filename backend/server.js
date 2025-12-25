const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Data file path
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper: Read users from file
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users file:', err);
    return {};
  }
}

// Helper: Write users to file
function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing users file:', err);
    return false;
  }
}

// API: Check if first user
app.get('/api/is-first-user', (req, res) => {
  const users = readUsers();
  const isFirst = Object.keys(users).length === 0;
  res.json({ isFirstUser: isFirst });
});

// API: Register new user
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;

  // Validation
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'Username can only contain letters, numbers, and underscores.'
    });
  }

  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 4 characters long.'
    });
  }

  const users = readUsers();

  if (users[username]) {
    return res.status(409).json({ success: false, message: 'Username already exists.' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // First user becomes admin automatically
  const isFirstUser = Object.keys(users).length === 0;
  const userRole = isFirstUser ? 'Admin' : role;
  const approved = isFirstUser;

  users[username] = {
    role: userRole,
    password: hashedPassword,
    approved,
    printRequests: [] // Store print requests per user
  };

  if (writeUsers(users)) {
    res.json({
      success: true,
      message: isFirstUser
        ? 'Welcome! You are the first user and have been assigned as Admin. Please login.'
        : 'Account created! An admin must approve your account before you can login.',
      autoApproved: isFirstUser
    });
  } else {
    res.status(500).json({ success: false, message: 'Failed to save user data.' });
  }
});

// API: Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const users = readUsers();
  const user = users[username];

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!user.approved) {
    return res.status(403).json({ success: false, message: 'Awaiting admin approval' });
  }

  // Compare password with hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  res.json({
    success: true,
    user: {
      username,
      role: user.role,
      printRequests: user.printRequests || []
    }
  });
});

// API: Get all users (for admin)
app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json({ success: true, users });
});

// API: Update user (approve, change role)
app.put('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const { approved, role } = req.body;

  const users = readUsers();

  if (!users[username]) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (approved !== undefined) {
    users[username].approved = approved;
  }

  if (role !== undefined) {
    users[username].role = role;
  }

  if (writeUsers(users)) {
    res.json({ success: true, message: 'User updated successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// API: Delete user
app.delete('/api/users/:username', (req, res) => {
  const { username } = req.params;

  const users = readUsers();

  if (!users[username]) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  delete users[username];

  if (writeUsers(users)) {
    res.json({ success: true, message: 'User deleted successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// API: Create print request
app.post('/api/print-request', (req, res) => {
  const { username, productId, message } = req.body;

  if (!username || !productId) {
    return res.status(400).json({ success: false, message: 'Username and Product ID are required' });
  }

  const users = readUsers();

  if (!users[username]) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Initialize printRequests if not exists
  if (!users[username].printRequests) {
    users[username].printRequests = [];
  }

  // Check if request already exists
  const existingRequest = users[username].printRequests.find(
    r => r.productId === productId
  );

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      return res.status(400).json({ success: false, message: 'Request already pending for this product' });
    }
    if (existingRequest.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Print permission already granted for this product' });
    }

    // If request was denied, update it to pending again
    if (existingRequest.status === 'denied') {
      existingRequest.status = 'pending';
      existingRequest.requestDate = new Date().toISOString();
      existingRequest.message = message || ''; // Update message
      delete existingRequest.processedDate; // Remove the processed date
    }
  } else {
    // Create new request only if no existing request
    const request = {
      productId,
      status: 'pending',
      requestDate: new Date().toISOString(),
      message: message || '' // Include optional message
    };

    users[username].printRequests.push(request);
  }

  if (writeUsers(users)) {
    res.json({ success: true, message: 'Print request submitted successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to submit print request' });
  }
});

// API: Get all print requests (admin only)
app.get('/api/print-requests/all', (req, res) => {
  const users = readUsers();
  const allRequests = [];

  Object.entries(users).forEach(([username, user]) => {
    if (user.printRequests) {
      user.printRequests.forEach(request => {
        allRequests.push({
          username,
          role: user.role,
          productId: request.productId,
          requestDate: request.requestDate,
          status: request.status,
          processedDate: request.processedDate || null,
          message: request.message || ''
        });
      });
    }
  });

  // Sort by request date (newest first)
  allRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  res.json({ success: true, requests: allRequests });
});

// API: Approve or deny print request
app.put('/api/print-request', (req, res) => {
  const { username, productId, status } = req.body;

  if (!username || !productId || !status) {
    return res.status(400).json({ success: false, message: 'Username, Product ID, and status are required' });
  }

  if (status !== 'approved' && status !== 'denied') {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const users = readUsers();

  if (!users[username]) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!users[username].printRequests) {
    return res.status(404).json({ success: false, message: 'No print requests found' });
  }

  const request = users[username].printRequests.find(r => r.productId === productId);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Print request not found' });
  }

  request.status = status;
  request.processedDate = new Date().toISOString();

  if (writeUsers(users)) {
    res.json({ success: true, message: `Print request ${status}` });
  } else {
    res.status(500).json({ success: false, message: 'Failed to update print request' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🍓 Strawberry Traceability Server running on http://localhost:${PORT}`);
  console.log(`📁 User data stored in: ${USERS_FILE}`);
});


