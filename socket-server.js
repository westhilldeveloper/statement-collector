// socket-server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow requests from your Next.js app

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', // Your Next.js app URL
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store connected users
const connectedAdmins = new Set();
const customerConnections = new Map(); // customerId -> socketId

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Admin authentication
  socket.on('admin-auth', (data) => {
    if (data.isAdmin) {
      connectedAdmins.add(socket.id);
      socket.join('admins');
      console.log('Admin connected:', socket.id);
    }
  });

  // Customer connection
  socket.on('customer-connect', (data) => {
    if (!data?.customerId) {
      console.warn('customer-connect received without customerId');
      return;
    }
    console.log('👤 Customer connect received:', data);
    customerConnections.set(data.customerId, socket.id);
    socket.join(`customer-${data.customerId}`);
    console.log(`✅ Customer ${data.customerId} connected with socket ${socket.id}`);
    console.log('📊 Total customers connected:', customerConnections.size);
  });

  // New customer created
  socket.on('new-customer-created', (data) => {
    console.log('🆕 New customer created event received:', data);
    io.emit('new-customer-created', {
      ...data,
      broadcastedAt: new Date().toISOString()
    });
    console.log('📤 Emitted new-customer-created to all');
  });

  // Statement uploaded
  socket.on('statement-uploaded', async (data) => {
    console.log('✅ Statement uploaded event received:', data);
    console.log('📊 Admins in room:', connectedAdmins.size);
    io.emit('new-statement-upload', {
      customerId: data.customerId,
      uploadedAt: new Date().toISOString(),
      status: 'UPLOADED'
    });
    console.log('📤 Emitted new-statement-upload to admins');
  });

  // Statement status changed (approve/reject)
  socket.on('statement-status-changed', (data) => {
    console.log('✅ Status changed event received:', data);
    console.log('📊 Admins in room:', connectedAdmins.size);
    
    // Notify all admins
    io.emit('statement-status-update', {
      statementId: data.statementId,
      customerId: data.customerId,
      status: data.status,
      rejectionReason: data.rejectionReason,
      updatedAt: new Date().toISOString()
    });
    console.log('📤 Emitted statement-status-update to admins');

    // Notify specific customer
    if (data.customerId) {
      const customerSocketId = customerConnections.get(data.customerId);
      console.log(`👤 Customer ${data.customerId} socket:`, customerSocketId);
      io.to(`customer-${data.customerId}`).emit('your-statement-status', {
        statementId: data.statementId,
        status: data.status,
        rejectionReason: data.rejectionReason,
        fileName: data.fileName
      });
      console.log(`📤 Emitted your-statement-status to customer-${data.customerId}`);
    }
  });

  // Disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedAdmins.delete(socket.id);
    for (let [customerId, socketId] of customerConnections.entries()) {
      if (socketId === socket.id) {
        customerConnections.delete(customerId);
        console.log(`👤 Customer ${customerId} disconnected`);
        break;
      }
    }
    console.log('📊 Remaining admins:', connectedAdmins.size);
    console.log('📊 Remaining customers:', customerConnections.size);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`🚀 Socket.io server running on port ${HOST}:${PORT}`);
});