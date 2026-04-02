import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NodeModel, EdgeModel, HazardModel } from './models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evacu3d';

const buildingNodes = [
  // Ground Floor
  { id: 'lobby',      x: 0,   y: 0, z: 0,   roomName: 'Lobby',        isExit: false },
  { id: 'corridor1', x: 4,   y: 0, z: 0,   roomName: 'Corridor A',   isExit: false },
  { id: 'corridor2', x: 4,   y: 0, z: 4,   roomName: 'Corridor B',   isExit: false },
  { id: 'office1',   x: 8,   y: 0, z: 0,   roomName: 'Office 101',   isExit: false },
  { id: 'office2',   x: 8,   y: 0, z: 4,   roomName: 'Office 102',   isExit: false },
  { id: 'stairs1',   x: 4,   y: 0, z: -4,  roomName: 'Stairwell A',  isExit: false },
  { id: 'exit1',     x: -4,  y: 0, z: 0,   roomName: 'Main Exit',    isExit: true  },
  { id: 'exit2',     x: 8,   y: 0, z: -4,  roomName: 'Fire Exit A',  isExit: true  },
  // Upper Floor (y = 4)
  { id: 'landing',   x: 4,   y: 4, z: -4,  roomName: 'Upper Landing', isExit: false },
  { id: 'boardroom', x: 8,   y: 4, z: -4,  roomName: 'Boardroom',     isExit: false },
  { id: 'office3',   x: 8,   y: 4, z: 0,   roomName: 'Office 201',    isExit: false },
  { id: 'exit3',     x: 0,   y: 4, z: -4,  roomName: 'Fire Exit B',   isExit: true  },
];

const buildingEdges = [
  { source: 'lobby',      target: 'corridor1', distance: 4 },
  { source: 'lobby',      target: 'exit1',     distance: 4 },
  { source: 'corridor1',  target: 'corridor2', distance: 4 },
  { source: 'corridor1',  target: 'office1',   distance: 4 },
  { source: 'corridor1',  target: 'stairs1',   distance: 4 },
  { source: 'corridor2',  target: 'office2',   distance: 4 },
  { source: 'stairs1',    target: 'exit2',     distance: 4 },
  { source: 'stairs1',    target: 'landing',   distance: 5 },
  { source: 'landing',    target: 'boardroom', distance: 4 },
  { source: 'landing',    target: 'office3',   distance: 4 },
  { source: 'landing',    target: 'exit3',     distance: 4 },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await NodeModel.deleteMany({});
  await EdgeModel.deleteMany({});
  await HazardModel.deleteMany({});
  console.log('Cleared existing data');

  await NodeModel.insertMany(buildingNodes);
  await EdgeModel.insertMany(buildingEdges);
  console.log(`Seeded ${buildingNodes.length} nodes and ${buildingEdges.length} edges.`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
