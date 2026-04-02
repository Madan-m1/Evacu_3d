import mongoose from 'mongoose';

// ─── Sub-schemas (embedded) ──────────────────────────────────────────────────

const NodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  z: { type: Number, required: true },
  isExit: { type: Boolean, default: false },
  isRefuge: { type: Boolean, default: false },
  capacity: { type: Number, default: 10 },
  occupancy: { type: Number, default: 0 },
  roomName: { type: String, default: 'Room', trim: true },
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
  source: { type: String, required: true },
  target: { type: String, required: true },
  distance: { type: Number, required: true },
}, { _id: false });

const HazardSubSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },
  type: { type: String, enum: ['fire', 'blocked', 'smoke'], default: 'fire' },
  severity: { type: Number, default: 1 },
  reportedBy: { type: String, default: 'user' },
  status: { type: String, enum: ['pending', 'active', 'resolved'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

// ─── Building (top-level document) ──────────────────────────────────────────

const BuildingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nodes: { type: [NodeSchema], default: [] },
  edges: { type: [EdgeSchema], default: [] },
  hazards: { type: [HazardSubSchema], default: [] },
}, { timestamps: true });

// ─── Standalone collections ───────────────────────────────────────────────

const ParticipantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  buildingId: { type: String, required: true },
  nodeId: { type: String, required: true },
  name: { type: String, default: 'Anonymous', trim: true },
  status: {
    type: String,
    enum: ['waiting', 'evacuating', 'reached_exit', 'refuge_mode'],
    default: 'waiting',
  },
  lastActive: { type: Date, default: Date.now, index: true },
});

export const BuildingModel = mongoose.model('Building', BuildingSchema);
export const ParticipantModel = mongoose.model('Participant', ParticipantSchema);

// ─── User ─────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

export const UserModel = mongoose.model('User', UserSchema);

// ─── Contact Submissions ──────────────────────────────────────────────────────
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, required: true, trim: true },
}, { timestamps: true });

export const ContactModel = mongoose.model('Contact', ContactSchema);

// Keep legacy models for backward-compat (unused but prevents import errors)
export const NodeModel = mongoose.model('Node', new mongoose.Schema({ id: String }));
export const EdgeModel = mongoose.model('Edge', new mongoose.Schema({ source: String, target: String }));
export const HazardModel = mongoose.model('Hazard', new mongoose.Schema({ nodeId: String }));

// ─── System Configuration (Setup State) ──────────────────────────────────────
const SystemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true },
  setupToken: { type: String },
  setupTokenExpires: { type: Date },
});

export const SystemConfigModel = mongoose.model('SystemConfig', SystemConfigSchema);
