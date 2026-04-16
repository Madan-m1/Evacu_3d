import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { API_URL, getApiUrl } from '../api/config';

// Helper: read JWT from localStorage (avoids circular dep with authStore)
const getAuthHeader = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem('evacu3d_auth');
    if (!raw) return {};
    const { token } = JSON.parse(raw);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
};

export interface NodeData {
  id: string;
  x: number;
  y: number;
  z: number;
  isExit?: boolean;
  isRefuge?: boolean;
  roomName?: string;
  capacity?: number;
  occupancy?: number;
}

export interface EdgeData {
  source: string;
  target: string;
  distance: number;
}

export interface HazardData {
  nodeId: string;
  type: string;
  severity?: number;
  reportedBy?: string;
  status?: 'pending' | 'active' | 'resolved';
}

export interface ParticipantData {
  id: string;
  nodeId: string;
  name: string;
  status: 'waiting' | 'evacuating' | 'reached_exit' | 'refuge_mode' | 'safe_in_refuge';
  lastActive: string;
}

export interface BuildingListItem {
  _id: string;
  name: string;
}

interface SimulationState {
  // ─── Multi-building ───────────────────────────────────
  buildings: BuildingListItem[];
  currentBuildingId: string | null;
  currentBuildingName: string;

  // ─── Layout ───────────────────────────────────────────
  nodes: NodeData[];
  edges: EdgeData[];

  // ─── Simulation ───────────────────────────────────────
  hazards: HazardData[];
  activeHazards: string[];
  participants: ParticipantData[];
  localParticipantId: string;
  startNode: string | null;
  path: string[];
  pathCoordinates: NodeData[];
  simulationMode: 'exit' | 'refuge' | 'none';
  simulationMessage: string | null;
  socket: Socket | null;
  refugeOccupancy: Record<string, number>;
  confirmedRefugeId: string | null;

  // ─── Actions ──────────────────────────────────────────
  fetchBuildings: () => Promise<void>;
  loadBuilding: (id: string) => Promise<void>;
  setBuildingData: (nodes: NodeData[], edges: EdgeData[], hazards: HazardData[]) => void;
  setStartNode: (nodeId: string | null) => void;
  toggleHazard: (nodeId: string) => Promise<void>;
  syncHazards: () => Promise<void>;
  syncParticipants: () => Promise<void>;
  updatePulse: () => Promise<void>;
  setSimulationResult: (path: string[], pathCoordinates: NodeData[], mode: 'exit' | 'refuge' | 'none', message: string) => void;
  resetSimulation: () => void;
  confirmArrivalAtRefuge: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  buildings: [],
  currentBuildingId: null,
  currentBuildingName: '',
  nodes: [],
  edges: [],
  hazards: [],
  activeHazards: [],
  participants: [],
  localParticipantId: (() => {
    let id = localStorage.getItem('evacu3d_userid');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('evacu3d_userid', id);
    }
    return id;
  })(),
  startNode: null,
  path: [],
  pathCoordinates: [],
  simulationMode: 'none',
  simulationMessage: null,
  socket: null,
  refugeOccupancy: {},
  confirmedRefugeId: null,

  fetchBuildings: async () => {
    try {
      const res = await fetch(getApiUrl('/api/buildings'));
      const buildings: BuildingListItem[] = await res.json();
      set({ buildings });
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
    }
  },

  loadBuilding: async (id: string) => {
    const { socket: oldSocket } = get();
    if (oldSocket) oldSocket.disconnect();

    try {
      const res = await fetch(getApiUrl(`/api/buildings/${id}`));
      const data = await res.json();

      const newSocket = io(API_URL);
      
      newSocket.on('connect', () => {
        newSocket.emit('join-building', id);
      });

      newSocket.on('hazards:update', (hazards: HazardData[]) => {
        set({ hazards, activeHazards: hazards.map(h => h.nodeId) });
      });

      newSocket.on('hazard:added', (h: HazardData) => {
        const { hazards } = get();
        if (!hazards.find(ex => ex.nodeId === h.nodeId)) {
          const newHazards = [...hazards, h];
          set({ hazards: newHazards, activeHazards: newHazards.map(x => x.nodeId) });
        }
      });

      newSocket.on('hazard:removed', ({ nodeId }: { nodeId: string }) => {
        const { hazards } = get();
        const newHazards = hazards.filter(h => h.nodeId !== nodeId);
        set({ hazards: newHazards, activeHazards: newHazards.map(x => x.nodeId) });
      });

      newSocket.on('refuge:update', ({ refugeId, currentOccupancy }: any) => {
        const { refugeOccupancy } = get();
        set({ refugeOccupancy: { ...refugeOccupancy, [refugeId]: currentOccupancy } });
      });

      set({
        currentBuildingId: id,
        currentBuildingName: data.name,
        nodes: data.nodes || [],
        edges: data.edges || [],
        hazards: data.hazards || [],
        activeHazards: (data.hazards || []).map((h: HazardData) => h.nodeId),
        path: [],
        pathCoordinates: [],
        simulationMode: 'none',
        simulationMessage: null,
        startNode: null,
        socket: newSocket,
      });
    } catch (err) {
      console.error('Failed to load building:', err);
    }
  },

  setBuildingData: (nodes, edges, hazards) => set({
    nodes,
    edges,
    hazards,
    activeHazards: hazards.map(h => h.nodeId),
  }),

  setStartNode: (nodeId) => set({ startNode: nodeId, confirmedRefugeId: null }),

  syncHazards: async () => {
    const { currentBuildingId } = get();
    if (!currentBuildingId) return;
    try {
      const res = await fetch(getApiUrl(`/api/buildings/${currentBuildingId}/hazards`));
      const hazards: HazardData[] = await res.json();
      set({ hazards, activeHazards: hazards.map(h => h.nodeId) });
    } catch (err) {
      console.error('Failed to sync hazards:', err);
    }
  },

  syncParticipants: async () => {
    const { currentBuildingId } = get();
    if (!currentBuildingId) return;
    try {
      const res = await fetch(getApiUrl(`/api/buildings/${currentBuildingId}/participants`));
      const participants: ParticipantData[] = await res.json();
      
      set({ participants });
    } catch (err) {
      console.error('Failed to sync participants:', err);
    }
  },

  updatePulse: async () => {
    const { startNode, localParticipantId, simulationMode, currentBuildingId, confirmedRefugeId } = get();
    if (!startNode || !currentBuildingId) return;

    let status: ParticipantData['status'] = 'waiting';
    if (simulationMode === 'exit') status = 'evacuating';
    if (simulationMode === 'refuge') status = 'refuge_mode';
    if (confirmedRefugeId) status = 'safe_in_refuge';

    // Use real user identity when authenticated
    let participantId = localParticipantId;
    let participantName = `Guest ${localParticipantId.split('_')[1]?.slice(0, 4) || '?'}`;

    try {
      const raw = localStorage.getItem('evacu3d_auth');
      if (raw) {
        const { user } = JSON.parse(raw);
        if (user?.email) {
          participantId = user.id || localParticipantId;
          // Use the part before @ as display name, or full email if short
          const emailUser = user.email.split('@')[0];
          participantName = emailUser.length <= 20 ? emailUser : user.email;
        }
      }
    } catch { /* use defaults */ }

    try {
      await fetch(getApiUrl(`/api/buildings/${currentBuildingId}/participants`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: participantId,
          nodeId: confirmedRefugeId || startNode,
          name: participantName,
          status,
        }),
      });
    } catch (err) {
      console.error('Pulse update failed:', err);
    }
  },

  toggleHazard: async (nodeId) => {
    const { activeHazards, hazards, currentBuildingId } = get();
    if (!currentBuildingId) return;
    
    const isActive = activeHazards.includes(nodeId);
    const oldHazards = [...hazards];
    const oldActive = [...activeHazards];

    // --- Optimistic Update ---
    if (isActive) {
      const newHazards = hazards.filter(h => h.nodeId !== nodeId);
      set({ hazards: newHazards, activeHazards: newHazards.map(h => h.nodeId) });
    } else {
      const tempHazard: HazardData = { nodeId, type: 'fire', status: 'pending', reportedBy: 'me' }; // Temp label
      const newHazards = [...hazards, tempHazard];
      set({ hazards: newHazards, activeHazards: [...activeHazards, nodeId] });
    }

    try {
      if (isActive) {
        const res = await fetch(getApiUrl(`/api/buildings/${currentBuildingId}/hazards/${nodeId}`), {
          method: 'DELETE',
          headers: getAuthHeader(),
        });
        if (!res.ok) throw new Error('Delete failed');
      } else {
        const res = await fetch(getApiUrl(`/api/buildings/${currentBuildingId}/hazards`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ nodeId, type: 'fire' }),
        });
        if (!res.ok) throw new Error('Add failed');
      }
      
      // We don't force a full sync here because the socket will handle it, 
      // but we can do it occasionally or as a fallback.
    } catch (err) {
      console.error('Failed to toggle hazard:', err);
      // Rollback on failure
      set({ hazards: oldHazards, activeHazards: oldActive });
    }
  },

  setSimulationResult: (path, pathCoordinates, mode, message) =>
    set({ path, pathCoordinates, simulationMode: mode, simulationMessage: message, confirmedRefugeId: null }),

  resetSimulation: () => set({
    path: [],
    pathCoordinates: [],
    simulationMode: 'none',
    simulationMessage: null,
    confirmedRefugeId: null,
  }),

  confirmArrivalAtRefuge: () => {
    const { path, nodes } = get();
    if (path.length > 0) {
      const destId = path[path.length - 1];
      const destNode = nodes.find(n => n.id === destId);
      if (destNode?.isRefuge) {
        set({ confirmedRefugeId: destId });
      }
    }
  },
}));
