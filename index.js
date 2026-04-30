import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import session from 'express-session';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = bcrypt.hashSync('changeme123', 10);

const app = express();
const bareServer = createBareServer('/bare/');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && bcrypt.compareSync(password, ADMIN_PASS_HASH)) {
    req.session.admin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth-status', (req, res) => {
  res.json({ admin: !!req.session.admin });
});

const server = http.createServer((req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

const chatRooms = {};
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else if (req.url.startsWith('/chat-ws')) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/chat-ws?', ''));
  const room = params.get('room') || 'general';
  const name = params.get('name') || 'Anonymous';
  if (!chatRooms[room]) chatRooms[room] = [];
  chatRooms[room].push({ ws, name });
  broadcast(room, { type: 'system', text: name + ' joined' }, ws);
  ws.send(JSON.stringify({ type: 'system', text: 'Welcome to ' + room }));
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      broadcast(room, { type: 'message', text: msg.text, name: name }, null);
    } catch (e) {}
  });
  ws.on('close', () => {
    chatRooms[room] = chatRooms[room].filter(function(c) { return c.ws !== ws; });
    broadcast(room, { type: 'system', text: name + ' left' }, null);
  });
});

function broadcast(room, data, exclude) {
  if (!chatRooms[room]) return;
  const msg = JSON.stringify(data);
  chatRooms[room].forEach(function(client) {
    if (client.ws !== exclude && client.ws.readyState === 1) client.ws.send(msg);
  });
}

server.listen(PORT, () => {
  console.log('RIFT live on port ' + PORT);
});
