// server.js (in root directory)
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Store connected users (for admin dashboard)
  const connectedAdmins = new Set();
  
  // Store customer connections (for real-time upload notifications)
  const customerConnections = new Map(); // customerId -> socketId

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle admin authentication
    socket.on('admin-auth', (data) => {
      if (data.isAdmin) {
        connectedAdmins.add(socket.id);
        socket.join('admins');
        console.log('Admin connected:', socket.id);
      }
    });

    // ✅ ADD THIS MISSING HANDLER - Customer connection
    socket.on('customer-connect', (data) => {
      console.log('👤 Customer connect received:', data);
      if (data.customerId) {
        customerConnections.set(data.customerId, socket.id);
        socket.join(`customer-${data.customerId}`);
        console.log(`✅ Customer ${data.customerId} connected with socket ${socket.id}`);
        console.log('📊 Total customers connected:', customerConnections.size);
      }
    });

    // ✅ ADD THIS MISSING HANDLER - New customer created
    socket.on('new-customer-created', (data) => {
      console.log('🆕 New customer created event received:', data);
      
      // Broadcast to all connected admins
      io.emit('new-customer-created', {
        ...data,
        broadcastedAt: new Date().toISOString()
      });
      
      console.log('📤 Emitted new-customer-created to Homepage');
    });

    // Handle statement upload events
    socket.on('statement-uploaded', async (data) => {
      console.log('✅ Statement uploaded event received:', data);
      
      // Log the admins room
      console.log('📊 Admins in room:', connectedAdmins.size);
      
      // Notify all admins about new upload
      io.emit('new-statement-upload', {
        customerId: customer.id,
        uploadedAt: new Date().toISOString(),
        status: 'PENDING'
      });
      
      console.log('📤 Emitted new-statement-upload to admins');
    });

    // Listen for status changes (approve/reject)
    socket.on('statement-status-changed', (data) => {
      console.log('✅ Status changed event received:', data);
      
      // Log the admins room
      console.log('📊 Admins in room:', connectedAdmins.size);
      
      // Notify all admins about status change
      io.emit('statement-status-update', {
        statementId: data.statementId,
        customerId: data.customerId,
        status: data.status,
        rejectionReason: data.rejectionReason,
        updatedAt: new Date().toISOString()
      });
      
      console.log('📤 Emitted statement-status-update to admins');

      // Notify specific customer about their statement status
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

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from connected admins
      connectedAdmins.delete(socket.id);
      
      // Remove from customer connections
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

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});