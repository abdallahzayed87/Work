const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(express.json());
app.use(require('cors')());

// Helper: read users
function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}
// Helper: write users
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'بيانات غير صحيحة' });
  res.json({ username: user.username, role: user.role });
});

// Get all users (admin only)
app.get('/api/users', (req, res) => {
  // In production, use JWT/session for admin check
  if (req.headers['x-admin'] !== 'true') return res.status(403).json({ error: 'ممنوع' });
  res.json(readUsers());
});

// Add user (admin only)
app.post('/api/users', (req, res) => {
  if (req.headers['x-admin'] !== 'true') return res.status(403).json({ error: 'ممنوع' });
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'بيانات ناقصة' });
  const users = readUsers();
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'المستخدم موجود' });
  users.push({ username, password, role });
  writeUsers(users);
  res.json({ success: true });
});

// Change password (admin only)
app.put('/api/users/:username/password', (req, res) => {
  if (req.headers['x-admin'] !== 'true') return res.status(403).json({ error: 'ممنوع' });
  const { password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  user.password = password;
  writeUsers(users);
  res.json({ success: true });
});

// Update role (admin only)
app.put('/api/users/:username/role', (req, res) => {
  if (req.headers['x-admin'] !== 'true') return res.status(403).json({ error: 'ممنوع' });
  const { role } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  user.role = role;
  writeUsers(users);
  res.json({ success: true });
});

// Delete user (admin only)
app.delete('/api/users/:username', (req, res) => {
  if (req.headers['x-admin'] !== 'true') return res.status(403).json({ error: 'ممنوع' });
  let users = readUsers();
  users = users.filter(u => u.username !== req.params.username);
  writeUsers(users);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log('User management API running on http://localhost:' + PORT);
});
