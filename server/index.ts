import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { BuildingModel, ParticipantModel, UserModel, ContactModel } from './models';
import { findEvacuationPath } from './pathfinding';
import authRouter, { requireAuth, initializeAdminSystem } from './auth';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5005;

// ─── Production CORS ─────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    status: 'online', 
    message: 'Evacu3D API is running',
    version: '1.1.0-prod',
    timestamp: new Date().toISOString()
  });
});

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, false); // For sockets, we just deny the connection if origin is invalid
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  
  socket.on('join-building', (buildingId) => {
    socket.join(`building:${buildingId}`);
    console.log(`🏢 Socket ${socket.id} joined building:${buildingId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Helper to emit hazard changes
const emitHazardChange = async (buildingId: string, type: 'added' | 'removed' | 'updated', data: any) => {
  try {
    const building = await BuildingModel.findById(buildingId).lean();
    if (building) {
      // Legacy "hazards:update" for full sync compatibility
      io.to(`building:${buildingId}`).emit('hazards:update', building.hazards);
      // New incremental events for performance
      io.to(`building:${buildingId}`).emit(`hazard:${type}`, data);
    }
  } catch (err) {
    console.error('Socket emission failed:', err);
  }
};

// Helper: Dynamic Refuge Occupancy Sync
const updateRefugeOccupancy = async (buildingId: string, nodeId: string) => {
  try {
    const building = await BuildingModel.findById(buildingId).lean();
    const node = (building as any)?.nodes.find((n: any) => n.id === nodeId && n.isRefuge);
    if (!node) return; // Not a refuge, skip
    
    // Calculate absolute true occupancy from active users
    const cutoff = new Date(Date.now() - 30000);
    const occupancy = await ParticipantModel.countDocuments({ 
      buildingId, 
      nodeId, 
      lastActive: { $gt: cutoff } 
    });
    
    io.to(`building:${buildingId}`).emit('refuge:update', {
      refugeId: nodeId,
      currentOccupancy: occupancy,
      maxCapacity: node.capacity || 10
    });
  } catch (err) {
    console.error('Failed to sync refuge occupancy:', err);
  }
};

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Initial Buildings ──────────────────────────────────────────────────────────────
const defaultBuilding = {
  name: 'Main Building',
  nodes: [
    { id: 'lobby',      x: 0,   y: 0, z: 0,   roomName: 'Lobby',        isExit: false, isRefuge: false, capacity: 50,  occupancy: 0 },
    { id: 'corridor1',  x: 4,   y: 0, z: 0,   roomName: 'Corridor A',   isExit: false, isRefuge: false, capacity: 20,  occupancy: 0 },
    { id: 'corridor2',  x: 4,   y: 0, z: 4,   roomName: 'Corridor B',   isExit: false, isRefuge: false, capacity: 20,  occupancy: 0 },
    { id: 'office1',    x: 8,   y: 0, z: 0,   roomName: 'Office 101',   isExit: false, isRefuge: false, capacity: 10,  occupancy: 0 },
    { id: 'office2',    x: 8,   y: 0, z: 4,   roomName: 'Office 102',   isExit: false, isRefuge: false, capacity: 10,  occupancy: 0 },
    { id: 'stairs1',    x: 4,   y: 0, z: -4,  roomName: 'Stairwell A',  isExit: false, isRefuge: false, capacity: 30,  occupancy: 0 },
    { id: 'exit1',      x: -4,  y: 0, z: 0,   roomName: 'Main Exit',    isExit: true,  isRefuge: false, capacity: 100, occupancy: 0 },
    { id: 'exit2',      x: 8,   y: 0, z: -4,  roomName: 'Fire Exit A',  isExit: true,  isRefuge: false, capacity: 100, occupancy: 0 },
    { id: 'refuge1',    x: 0,   y: 0, z: 4,   roomName: 'Refuge Room A',isExit: false, isRefuge: true,  capacity: 15,  occupancy: 5 },
    { id: 'landing',    x: 4,   y: 4, z: -4,  roomName: 'Upper Landing',isExit: false, isRefuge: false, capacity: 20,  occupancy: 0 },
    { id: 'boardroom',  x: 8,   y: 4, z: -4,  roomName: 'Boardroom',    isExit: false, isRefuge: false, capacity: 25,  occupancy: 0 },
    { id: 'office3',    x: 8,   y: 4, z: 0,   roomName: 'Office 201',   isExit: false, isRefuge: false, capacity: 10,  occupancy: 0 },
    { id: 'exit3',      x: 0,   y: 4, z: -4,  roomName: 'Fire Exit B',  isExit: true,  isRefuge: false, capacity: 100, occupancy: 0 },
    { id: 'refuge2',    x: 0,   y: 4, z: 0,   roomName: 'Refuge Area B',isExit: false, isRefuge: true,  capacity: 10,  occupancy: 10 },
  ],
  edges: [
    { source: 'lobby',     target: 'corridor1', distance: 4 },
    { source: 'lobby',     target: 'exit1',     distance: 4 },
    { source: 'lobby',     target: 'refuge1',   distance: 4 },
    { source: 'corridor1', target: 'corridor2', distance: 4 },
    { source: 'corridor1', target: 'office1',   distance: 4 },
    { source: 'corridor1', target: 'stairs1',   distance: 4 },
    { source: 'corridor2', target: 'office2',   distance: 4 },
    { source: 'corridor2', target: 'refuge1',   distance: 4 },
    { source: 'stairs1',   target: 'exit2',     distance: 4 },
    { source: 'stairs1',   target: 'landing',   distance: 5 },
    { source: 'landing',   target: 'boardroom', distance: 4 },
    { source: 'landing',   target: 'office3',   distance: 4 },
    { source: 'landing',   target: 'exit3',     distance: 4 },
    { source: 'landing',   target: 'refuge2',   distance: 4 },
    { source: 'office3',   target: 'refuge2',   distance: 4 },
  ],
  hazards: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getBuilding = async (id: string) => {
  return BuildingModel.findById(id).lean();
};

// ─── Buildings API ────────────────────────────────────────────────────────────

app.get('/api/buildings', async (_req: Request, res: Response) => {
  try {
    const buildings = await BuildingModel.find({}, 'name _id createdAt').lean();
    return res.json(buildings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/buildings', requireAuth(['admin']), async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const building = await BuildingModel.create({ name, nodes: [], edges: [], hazards: [] });
    return res.status(201).json(building);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/buildings/:id', async (req: Request, res: Response) => {
  try {
    const building = await getBuilding(req.params.id as string);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    res.json(building);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/buildings/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  const { nodes, edges, name } = req.body;
  try {
    const update: any = {};
    if (nodes !== undefined) update.nodes = nodes;
    if (edges !== undefined) update.edges = edges;
    if (name !== undefined) update.name = name;
    
    const building = await BuildingModel.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!building) return res.status(404).json({ error: 'Building not found' });
    
    return res.json(building);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/buildings/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    await BuildingModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

// ─── Hazards (building-scoped) ────────────────────────────────────────────────

app.get('/api/buildings/:id/hazards', async (req: Request, res: Response) => {
  try {
    const building = await getBuilding(req.params.id as string);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    res.json((building as any).hazards || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/buildings/:id/hazards', requireAuth(['admin', 'user']), async (req: Request, res: Response) => {
  const { nodeId, type = 'fire', severity = 1 } = req.body;
  if (!nodeId) return res.status(400).json({ error: 'nodeId is required' });

  const user = (req as any).user;
  const reportedBy = user.email;
  const status = user.role === 'admin' ? 'active' : 'pending';

  try {
    const building = await BuildingModel.findById(req.params.id);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    
    const hazards = building.hazards as any[];
    const existingIdx = hazards.findIndex((h) => h.nodeId === nodeId);
    if (existingIdx > -1) hazards.splice(existingIdx, 1);
    
    const newHazard = { nodeId, type, severity, reportedBy, status, createdAt: new Date() };
    hazards.push(newHazard);
    await building.save();

    // Notify clients in real-time
    emitHazardChange(req.params.id as string, 'added', newHazard);

    return res.status(201).json(hazards);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/buildings/:id/hazards/:nodeId', requireAuth(['admin', 'user']), async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const building = await BuildingModel.findById(req.params.id);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    
    const hazards = building.hazards as any[];
    const hIdx = hazards.findIndex((h) => h.nodeId === req.params.nodeId);
    
    if (hIdx === -1) return res.status(404).json({ error: 'Hazard not found' });

    const hazard = hazards[hIdx];

    // Permission Check: Admin can delete any. User can only undo their own "pending" hazard.
    const isAdmin = user.role === 'admin';
    const isReporter = user.email === hazard.reportedBy;
    const isPending = hazard.status === 'pending';

    if (!isAdmin && !(isReporter && isPending)) {
      return res.status(403).json({ error: 'You do not have permission to clear this hazard.' });
    }

    hazards.splice(hIdx, 1);
    await building.save();

    // Notify clients in real-time
    emitHazardChange(req.params.id as string, 'removed', { nodeId: req.params.nodeId as string });

    return res.json({ success: true });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

// ─── Simulate (building-scoped) ───────────────────────────────────────────────

app.post('/api/buildings/:id/simulate', async (req: Request, res: Response) => {
  const { startNode, activeHazards: clientHazards = [] } = req.body;
  if (!startNode) return res.status(400).json({ error: 'startNode is required' });

  try {
    const building = await getBuilding(req.params.id as string);
    if (!building) return res.status(404).json({ error: 'Building not found' });

    const { nodes: nodesData, edges: edgesData, hazards: storedHazards } = building as any;
    const serverHazardIds = (storedHazards || []).map((h: any) => h.nodeId);
    const hazardsSet = new Set<string>([...serverHazardIds, ...clientHazards]);

    const exitNodes = nodesData.filter((n: any) => n.isExit).map((n: any) => n.id);
    const refugeNodes = nodesData.filter((n: any) => n.isRefuge).map((n: any) => ({
      id: n.id, isExit: n.isExit, isRefuge: n.isRefuge,
      capacity: n.capacity || 10, occupancy: n.occupancy || 0,
    }));

    const graph: Record<string, { target: string; distance: number }[]> = {};
    for (const node of nodesData) graph[node.id] = [];
    for (const edge of edgesData) {
      if (!graph[edge.source]) graph[edge.source] = [];
      graph[edge.source].push({ target: edge.target, distance: edge.distance });
      if (!graph[edge.target]) graph[edge.target] = [];
      graph[edge.target].push({ target: edge.source, distance: edge.distance });
    }

    const result = findEvacuationPath(graph, startNode, exitNodes, refugeNodes, hazardsSet);
    const pathCoordinates = result.path.map(nodeId => {
      const node = nodesData.find((n: any) => n.id === nodeId);
      return { id: node?.id, x: node?.x, y: node?.y, z: node?.z };
    });
    res.json({ path: result.path, pathCoordinates, mode: result.mode, message: result.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

// ─── Participants ─────────────────────────────────────────────────────────────

app.get('/api/buildings/:id/participants', async (req: Request, res: Response) => {
  try {
    const cutoff = new Date(Date.now() - 30000);
    const participants = await ParticipantModel.find({
      buildingId: req.params.id,
      lastActive: { $gt: cutoff },
    });
    return res.json(participants);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/buildings/:id/participants', async (req: Request, res: Response) => {
  const { id, nodeId, name, status } = req.body;
  const buildingId = req.params.id as string;
  if (!id || !nodeId) return res.status(400).json({ error: 'id and nodeId required' });

  try {
    // Optimization: Check for existing participant and throttle updates (e.g., 2s cooldown)
    const existing = await ParticipantModel.findOne({ id }).lean();
    const oldNodeId = existing?.nodeId;
    
    if (existing && (Date.now() - new Date(existing.lastActive).getTime() < 2000)) {
      // If position/status hasn't changed much, we can skip the write
      if (oldNodeId === nodeId && existing.status === status) {
        return res.json(existing);
      }
    }

    const p = await ParticipantModel.findOneAndUpdate(
      { id },
      { id, buildingId, nodeId, name, status, lastActive: new Date() },
      { upsert: true, new: true }
    );
    
    // Check if user transitioned between nodes
    if (oldNodeId !== nodeId) {
      if (oldNodeId) updateRefugeOccupancy(buildingId, oldNodeId);
      updateRefugeOccupancy(buildingId, nodeId);
    }
    
    return res.status(201).json(p);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

// ─── Contact Form ─────────────────────────────────────────────────────────────

app.post('/api/contact', async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'name, email, and message are required' });

  try {
    const contact = await ContactModel.create({ name, email, message });
    return res.status(201).json({ success: true, id: contact._id });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/contact', requireAuth(['admin']), async (_req: Request, res: Response) => {
  try {
    const messages = await ContactModel.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contact/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    await ContactModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Users Management ─────────────────────────────────────────────────────────

app.get('/api/users', requireAuth(['admin']), async (_req: Request, res: Response) => {
  try {
    const users = await UserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/status', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await UserModel.findByIdAndUpdate(req.params.id, { status }, { new: true, select: '-passwordHash' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    await UserModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Global Aliases (Hardening Compatibility) ────────────────────────────────
app.get('/api/layout', async (_req: Request, res: Response) => {
  try {
    const b = await BuildingModel.findOne().sort({ createdAt: 1 }).lean();
    if (!b) return res.status(404).json({ error: 'No layout found' });
    return res.json(b);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/hazards', async (_req: Request, res: Response) => {
  try {
    const b = await BuildingModel.findOne().sort({ createdAt: 1 }).lean();
    if (!b) return res.status(404).json({ error: 'No building found' });
    return res.json((b as any).hazards || []);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ─── Legacy /api/building (compat) ───────────────────────────────────────────

app.get('/api/building', async (_req: Request, res: Response) => {
  try {
    const b = await BuildingModel.findOne().lean();
    if (b) return res.json({ nodes: (b as any).nodes, edges: (b as any).edges, hazards: (b as any).hazards });
    return res.json({ nodes: [], edges: [], hazards: [] });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

// ─── MongoDB Connection ──────────────────────────────────────────────────────

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is required.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('❌ JWT_SECRET is required in production.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    await initializeAdminSystem();

    const count = await BuildingModel.countDocuments();
    if (count === 0) {
      await BuildingModel.create(defaultBuilding);
      console.log('✅ Seeded default building');
    }
  } catch (err) {
    console.error('❌ MongoDB connection failed. Exiting.', err);
    process.exit(1);
  }
};

httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

startServer();

// Participant cleanup every 60s
setInterval(async () => {
  const cutoff = new Date(Date.now() - 120000);
  try {
    const inactive = await ParticipantModel.find({ lastActive: { $lt: cutoff } });
    if (inactive.length > 0) {
      await ParticipantModel.deleteMany({ _id: { $in: inactive.map(p => p._id) } });
      
      // Update refuges if dropped users were in them
      const nodesToUpdate = new Set(inactive.map(p => `${p.buildingId}|${p.nodeId}`));
      nodesToUpdate.forEach(compound => {
        const [bId, nId] = compound.split('|');
        if (bId && nId) updateRefugeOccupancy(bId, nId);
      });
    }
  } catch (err) {
    console.error('⚠️  Participant cleanup failed:', err);
  }
}, 60000);
