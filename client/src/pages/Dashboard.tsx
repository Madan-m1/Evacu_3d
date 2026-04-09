import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, LayoutDashboard, RefreshCw, ShieldAlert, Users,
  Grid, Plus, PlayCircle, Building2, Trash2, ChevronDown, UserCog, Mail, Check, X,
  ShieldCheck, Lock, Save, RotateCcw
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import VisualBuilder, { type Node, type Edge } from '../components/Admin/VisualBuilder';
import { API_URL, getApiUrl } from '../api/config';

interface Building {
  _id: string;
  name: string;
}

interface Hazard {
  _id?: string;
  nodeId: string;
  type: string;
  severity: number;
  reportedBy: string;
  status: 'pending' | 'active' | 'resolved';
  createdAt: string;
}

interface Participant {
  id: string;
  nodeId: string;
  name: string;
  status: string;
  lastActive: string;
}

const API = getApiUrl('/api');
const inputCls = 'bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';

const getAuthHeader = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem('evacu3d_auth');
    if (!raw) return {};
    const { token } = JSON.parse(raw);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [currentBuildingId, setCurrentBuildingId] = useState<string | null>(null);
  const [currentBuilding, setCurrentBuilding] = useState<{ name: string; nodes: Node[]; edges: Edge[] } | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<'layout' | 'hazards' | 'simulation' | 'users' | 'messages' | 'security'>('layout');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Security Tab State
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [showNewBuildingForm, setShowNewBuildingForm] = useState(false);
  const [newHazard, setNewHazard] = useState<Partial<Hazard>>({ type: 'fire', severity: 1 });

  const flash = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  const fetchBuildings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/buildings`);
      const data: Building[] = await res.json();
      setBuildings(data);
      // Auto-select first building if none selected
      if (data.length > 0 && !currentBuildingId) {
        setCurrentBuildingId(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
    }
  }, [currentBuildingId]);

  const fetchBuildingData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [buildingRes, hazardRes, partRes] = await Promise.all([
        fetch(`${API}/buildings/${id}`).then(r => r.json()),
        fetch(`${API}/buildings/${id}/hazards`).then(r => r.json()),
        fetch(`${API}/buildings/${id}/participants`).then(r => r.json()),
      ]);
      setCurrentBuilding({ name: buildingRes.name, nodes: buildingRes.nodes || [], edges: buildingRes.edges || [] });
      setHazards(Array.isArray(hazardRes) ? hazardRes : []);
      setParticipants(Array.isArray(partRes) ? partRes : []);
    } catch (err) {
      console.error('Failed to fetch building data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBuildings(); }, []);

  useEffect(() => {
    if (currentBuildingId) {
      fetchBuildingData(currentBuildingId);
      
      // Socket setup for Dashboard
      const socket = io(API_URL);
      socket.on('connect', () => {
        socket.emit('join-building', currentBuildingId);
      });
      socket.on('hazards:update', (h: Hazard[]) => setHazards(h));
      socket.on('hazard:added', (h: Hazard) => {
        setHazards(prev => prev.find(ex => ex.nodeId === h.nodeId) ? prev : [...prev, h]);
      });
      socket.on('hazard:removed', ({ nodeId }) => {
        setHazards(prev => prev.filter(h => h.nodeId !== nodeId));
      });
      
      socketRef.current = socket;
      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [currentBuildingId, fetchBuildingData]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetch(`${API}/users`, { headers: getAuthHeader() })
        .then(res => res.json())
        .then(data => setUsersList(Array.isArray(data) ? data : []));
    } else if (activeTab === 'messages') {
      fetch(`${API}/contact`, { headers: getAuthHeader() })
        .then(res => res.json())
        .then(data => setMessages(Array.isArray(data) ? data : []));
    }
  }, [activeTab]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API}/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status })
      });
      setUsersList(usersList.map(u => u._id === id ? { ...u, status } : u));
    } catch { flash('Update failed', 'error'); }
  };
  
  const deleteUser = async (id: string) => {
    if (!confirm('Permanent delete?')) return;
    try {
      await fetch(`${API}/users/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      setUsersList(usersList.filter(u => u._id !== id));
      flash('User deleted');
    } catch { flash('Delete failed', 'error'); }
  };

  const deleteMessage = async (id: string) => {
    try {
      await fetch(`${API}/contact/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      setMessages(messages.filter(m => m._id !== id));
      flash('Message deleted');
    } catch { flash('Delete failed', 'error'); }
  };

  const handleCreateBuilding = async () => {
    if (!newBuildingName.trim()) { flash('Building name required', 'error'); return; }
    try {
      const res = await fetch(`${API}/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ name: newBuildingName.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      flash(`Building "${data.name}" created!`);
      setNewBuildingName('');
      setShowNewBuildingForm(false);
      setCurrentBuildingId(data._id);
      await fetchBuildings();
    } catch (err: any) { flash(`Error: ${err.message}`, 'error'); }
  };

  const handleDeleteBuilding = async () => {
    if (!currentBuildingId) return;
    const building = buildings.find(b => b._id === currentBuildingId);
    if (!confirm(`Delete "${building?.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`${API}/buildings/${currentBuildingId}`, { method: 'DELETE', headers: getAuthHeader() });
      flash('Building deleted');
      const remaining = buildings.filter(b => b._id !== currentBuildingId);
      setBuildings(remaining);
      setCurrentBuildingId(remaining.length > 0 ? remaining[0]._id : null);
      setCurrentBuilding(null);
    } catch (err: any) { flash(`Error: ${err.message}`, 'error'); }
  };

  const saveLayout = async (updatedNodes: Node[], updatedEdges: Edge[]) => {
    if (!currentBuildingId) return;
    try {
      const res = await fetch(`${API}/buildings/${currentBuildingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ nodes: updatedNodes, edges: updatedEdges }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      flash('Layout saved successfully!');
      fetchBuildingData(currentBuildingId);
    } catch (err: any) { flash(`Save failed: ${err.message}`, 'error'); }
  };

  const addHazard = async () => {
    if (!currentBuildingId || !newHazard.nodeId) { flash('Select a location', 'error'); return; }
    
    // --- Optimistic Update ---
    const tempHazard: Hazard = {
      nodeId: newHazard.nodeId,
      type: newHazard.type || 'fire',
      severity: newHazard.severity || 1,
      reportedBy: user?.email || 'me',
      status: user?.role === 'admin' ? 'active' : 'pending',
      createdAt: new Date().toISOString()
    };
    const oldHazards = [...hazards];
    setHazards(prev => {
      const filtered = prev.filter(h => h.nodeId !== tempHazard.nodeId);
      return [...filtered, tempHazard];
    });

    try {
      const res = await fetch(`${API}/buildings/${currentBuildingId}/hazards`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ ...newHazard }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      flash('Hazard triggered!');
      setNewHazard({ type: 'fire', severity: 1 });
    } catch (err: any) { 
      flash(`Error: ${err.message}`, 'error'); 
      setHazards(oldHazards); // Rollback
    }
  };

  const deleteHazard = async (nodeId: string) => {
    if (!currentBuildingId) return;
    
    // --- Optimistic Update ---
    const oldHazards = [...hazards];
    setHazards(prev => prev.filter(h => h.nodeId !== nodeId));

    try {
      const res = await fetch(`${API}/buildings/${currentBuildingId}/hazards/${nodeId}`, { 
        method: 'DELETE', 
        headers: getAuthHeader() 
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      flash('Hazard cleared');
    } catch (err: any) { 
      flash(err.message, 'error');
      setHazards(oldHazards); // Rollback
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { flash('Current password required', 'error'); return; }
    if (newPassword && newPassword !== confirmPassword) { flash('New passwords do not match', 'error'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          newEmail: profileEmail || undefined,
          currentPassword,
          newPassword: newPassword || undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      
      flash('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Update local storage if email changed
      if (profileEmail) {
        const raw = localStorage.getItem('evacu3d_auth');
        if (raw) {
          const auth = JSON.parse(raw);
          auth.user.email = profileEmail;
          localStorage.setItem('evacu3d_auth', JSON.stringify(auth));
        }
      }
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const nodes = currentBuilding?.nodes || [];

  return (
    <div className="min-h-screen bg-[#0f1117] text-white overflow-hidden flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-[#1a1d2e] border-b border-gray-800 px-6 py-3 flex items-center gap-4 shrink-0 shadow-lg z-20">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <LayoutDashboard className="text-blue-400" size={22} />
        <h1 className="text-lg font-bold">Evacu3D Admin</h1>

        {/* ─── Building Selector ──────── */}
        <div className="ml-4 flex items-center gap-2">
          <Building2 size={16} className="text-gray-400" />
          <div className="relative">
            <select
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={currentBuildingId || ''}
              onChange={e => setCurrentBuildingId(e.target.value)}
            >
              {buildings.length === 0 && <option value="">No Buildings</option>}
              {buildings.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* New Building Button */}
          <button
            onClick={() => setShowNewBuildingForm(v => !v)}
            className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition"
          >
            <Plus size={14} /> New
          </button>

          {/* Delete Building Button */}
          {currentBuildingId && (
            <button
              onClick={handleDeleteBuilding}
              className="flex items-center gap-1 text-xs bg-red-900/40 hover:bg-red-800/60 border border-red-800/50 text-red-400 px-3 py-1.5 rounded-lg transition"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* New Building Form */}
        {showNewBuildingForm && (
          <div className="flex items-center gap-2 ml-2">
            <input
              className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm"
              placeholder="Building name..."
              value={newBuildingName}
              onChange={e => setNewBuildingName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateBuilding()}
              autoFocus
            />
            <button
              onClick={handleCreateBuilding}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded text-white transition"
            >Create</button>
            <button onClick={() => setShowNewBuildingForm(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
          </div>
        )}

        <button
          onClick={() => currentBuildingId && fetchBuildingData(currentBuildingId)}
          className="ml-auto flex items-center gap-2 text-gray-400 hover:text-white text-sm px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
        <Link
          to="/simulator"
          className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-500 transition ml-2 font-medium"
        >
          <PlayCircle size={16} /> Open Simulator
        </Link>
      </header>

      {/* Flash message */}
      {msg && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl font-medium text-sm flex items-center gap-2 border ${
          msg.type === 'error' ? 'bg-red-900/90 border-red-700 text-red-100' : 'bg-emerald-900/90 border-emerald-600 text-emerald-100'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
        <div className="w-56 bg-[#1a1d2e] border-r border-gray-800 p-4 shrink-0 flex flex-col gap-2">
          {(['layout', 'hazards', 'simulation', 'users', 'messages', 'security'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition font-medium text-sm capitalize ${
                activeTab === tab
                  ? tab === 'hazards' ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-blue-900/20 text-blue-400 border border-blue-800/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {tab === 'layout' && <Grid size={16} />}
              {tab === 'hazards' && <ShieldAlert size={16} />}
              {tab === 'simulation' && <Users size={16} />}
              {tab === 'users' && <UserCog size={16} />}
              {tab === 'messages' && <Mail size={16} />}
              {tab === 'security' && <ShieldCheck size={16} />}
              {tab === 'layout' ? 'Building Layout' : tab === 'hazards' ? 'Hazards' : tab === 'simulation' ? 'Active Users' : tab === 'users' ? 'Manage Users' : tab === 'messages' ? 'Messages' : 'Security'}
              {tab === 'hazards' && hazards.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{hazards.length}</span>
              )}
              {tab === 'simulation' && participants.length > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{participants.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Content ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#13151f]">

          {!currentBuildingId && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <Building2 size={48} className="text-gray-600" />
              <p className="text-gray-400">No building selected. Create a new building to get started.</p>
              <button
                onClick={() => setShowNewBuildingForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg transition"
              >
                <Plus size={16} /> Create Building
              </button>
            </div>
          )}

          {currentBuildingId && activeTab === 'layout' && (
            <div className="flex flex-col h-full space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">{currentBuilding?.name || 'Building Layout'}</h2>
                <p className="text-sm text-gray-400">Edit nodes and connections for this building.</p>
              </div>
              <div className="rounded-xl border border-gray-800 overflow-hidden shadow-xl bg-gray-900 flex-1">
                <VisualBuilder
                  initialNodes={currentBuilding?.nodes || []}
                  initialEdges={currentBuilding?.edges || []}
                  onSave={saveLayout}
                />
              </div>
            </div>
          )}

          {currentBuildingId && activeTab === 'hazards' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Inject Hazard */}
              <div className="bg-[#1a1d2e] rounded-xl border border-gray-800 p-6 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-red-400 flex items-center gap-2">
                  <Plus size={18} /> Inject Emergency Hazard
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Impacted Room</label>
                    <select
                      className={inputCls}
                      value={newHazard.nodeId || ''}
                      onChange={e => setNewHazard(prev => ({ ...prev, nodeId: e.target.value }))}
                    >
                      <option value="">Select location...</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.roomName || n.id}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Hazard Type</label>
                    <select className={inputCls} value={newHazard.type}
                      onChange={e => setNewHazard(prev => ({ ...prev, type: e.target.value }))}>
                      <option value="fire">🔥 Fire</option>
                      <option value="smoke">💨 Smoke</option>
                      <option value="blocked">🚫 Structural Block</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Severity (1-5)</label>
                    <input className={inputCls} type="number" min="1" max="5" value={newHazard.severity}
                      onChange={e => setNewHazard(prev => ({ ...prev, severity: +e.target.value }))} />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button onClick={addHazard}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition text-sm font-semibold">
                      Trigger Hazard
                    </button>
                  </div>
                </div>
              </div>

              {/* Hazard List */}
              <div className="bg-[#1a1d2e] rounded-xl border border-gray-800 overflow-hidden shadow-lg">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="font-semibold text-gray-300 flex items-center gap-2"><ShieldAlert size={16} /> Active Hazards</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Location</th>
                      <th className="px-6 py-3 text-center">Type</th>
                      <th className="px-6 py-3 text-center">Severity</th>
                      <th className="px-6 py-3 text-center">Reporter</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {hazards.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-emerald-500/70">✨ No active hazards</td></tr>
                    ) : hazards.map(h => (
                      <tr key={h.nodeId} className="hover:bg-red-900/5 transition">
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{nodes.find(n => n.id === h.nodeId)?.roomName || h.nodeId}</div>
                          <div className="text-xs text-gray-500 font-mono">{h.nodeId}</div>
                        </td>
                        <td className="px-6 py-4 text-center text-red-400 font-bold uppercase text-xs">
                          {h.type === 'fire' ? '🔥 Fire' : h.type === 'smoke' ? '💨 Smoke' : '🚫 Blocked'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className={`w-2 h-4 rounded-sm ${i < h.severity ? 'bg-red-500' : 'bg-gray-800'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex flex-col items-center gap-1">
                             <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                              h.reportedBy === 'admin' ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-yellow-900/30 border-yellow-800 text-yellow-500'
                             }`}>{h.reportedBy.toUpperCase()}</span>
                             <span className={`text-[9px] uppercase tracking-tighter ${h.status === 'pending' ? 'text-yellow-600' : 'text-emerald-600'}`}>
                               ● {h.status}
                             </span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {/* Permission Check for Undo/Clear */}
                          {(user?.role === 'admin' || (user?.email === h.reportedBy && h.status === 'pending')) ? (
                            <button onClick={() => deleteHazard(h.nodeId)}
                              className={`p-2 rounded-lg transition ${
                                h.status === 'pending' 
                                  ? 'text-yellow-500 hover:text-yellow-400 bg-yellow-900/10 hover:bg-yellow-900/30' 
                                  : 'text-gray-500 hover:text-emerald-400 bg-gray-800 hover:bg-emerald-900/30'
                              }`}
                              title={h.status === 'pending' ? 'Undo Report' : 'Clear Hazard'}
                            >
                              {h.status === 'pending' ? <RotateCcw size={16} /> : <RefreshCw size={16} />}
                            </button>
                          ) : (
                            <div className="text-gray-600 mr-2" title="Permission Required">🔒</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentBuildingId && activeTab === 'simulation' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-[#1a1d2e] rounded-xl border border-gray-800 overflow-hidden shadow-lg">
                <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Users size={20} className="text-blue-400" /> Active Participants
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Users active in the last 30 seconds</p>
                  </div>
                  <div className="px-3 py-1 bg-blue-900/20 border border-blue-900/50 rounded-lg text-blue-400 text-xs">
                    Total: {participants.length}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">User</th>
                      <th className="px-6 py-3 text-left">Zone</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-right">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {participants.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-600">No active connections</td></tr>
                    ) : participants.map(p => (
                      <tr key={p.id} className="hover:bg-gray-800/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-300 font-bold border border-blue-800/30 text-sm">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">{p.name}</div>
                              <div className="text-[10px] text-gray-500 font-mono">{p.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-200 bg-gray-900 border border-gray-800 px-2 py-1 rounded inline-block text-xs">
                            {nodes.find(n => n.id === p.nodeId)?.roomName || p.nodeId}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${
                            p.status === 'evacuating' ? 'bg-blue-900/20 border-blue-700 text-blue-400' :
                            p.status === 'refuge_mode' ? 'bg-purple-900/20 border-purple-700 text-purple-400' :
                            p.status === 'reached_exit' ? 'bg-emerald-900/20 border-emerald-700 text-emerald-400' :
                            'bg-gray-800 border-gray-600 text-gray-300'
                          }`}>{p.status.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-gray-400">
                          <div className="flex items-center justify-end gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            {Math.floor((Date.now() - new Date(p.lastActive).getTime()) / 1000)}s ago
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6 max-w-5xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-4">User Management</h2>
                <div className="bg-[#1a1d2e] rounded-xl border border-gray-800 overflow-hidden shadow-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-center">Role</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {usersList.length === 0 ? <tr><td colSpan={4} className="p-4 text-center">No users found.</td></tr> : usersList.map(u => (
                        <tr key={u._id} className="hover:bg-gray-800/30">
                          <td className="px-6 py-4">{u.email}</td>
                          <td className="px-6 py-4 text-center capitalize">{u.role}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              u.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400' :
                              u.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'
                            }`}>{u.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             {u.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => updateStatus(u._id, 'approved')} className="text-emerald-400 hover:text-emerald-300 p-1"><Check size={16}/></button>
                                  <button onClick={() => updateStatus(u._id, 'rejected')} className="text-red-400 hover:text-red-300 p-1"><X size={16}/></button>
                                </div>
                             ) : u.status === 'rejected' ? (
                                <button onClick={() => deleteUser(u._id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                             ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-6 max-w-5xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-4">Contact Messages</h2>
                <div className="space-y-4">
                  {messages.length === 0 ? <p className="text-gray-500">No contact messages.</p> : messages.map((m: any) => (
                    <div key={m._id} className="bg-[#1a1d2e] rounded-xl border border-gray-800 p-5 shadow-lg flex justify-between gap-4">
                       <div>
                         <div className="font-semibold text-white">{m.name} <span className="text-gray-500 text-sm font-normal ml-2">{m.email}</span></div>
                         <p className="text-gray-300 mt-2 text-sm whitespace-pre-wrap">{m.message}</p>
                         <div className="text-xs text-gray-500 mt-3">{new Date(m.createdAt).toLocaleString()}</div>
                       </div>
                       <button onClick={() => deleteMessage(m._id)} className="text-gray-500 hover:text-red-400 self-start p-2"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
            </div>
          )}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={28} className="text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Security Settings</h2>
              </div>
              
              <div className="bg-[#1a1d2e] rounded-2xl border border-gray-800 p-8 shadow-2xl space-y-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Account Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} /> Account Information
                    </h3>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5 ml-1">New Email Address (Optional)</label>
                      <input 
                        type="email" 
                        placeholder="Leave blank to keep current" 
                        className={inputCls}
                        value={profileEmail}
                        onChange={e => setProfileEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password Change */}
                  <div className="space-y-4 pt-4 border-t border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Lock size={14} /> Change Password
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5 ml-1">New Password</label>
                        <input 
                          type="password" 
                          placeholder="Min 8 chars..." 
                          className={inputCls}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5 ml-1">Confirm New Password</label>
                        <input 
                          type="password" 
                          placeholder="Repeat new password" 
                          className={inputCls}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Verification */}
                  <div className="space-y-4 pt-4 border-t border-gray-800">
                    <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl">
                      <label className="block text-sm font-medium text-blue-300 mb-2">Confirm Identity</label>
                      <p className="text-xs text-blue-400/70 mb-3">To save these changes, please enter your CURRENT administrator password.</p>
                      <input 
                        type="password" 
                        placeholder="Current password" 
                        className={inputCls + " border-blue-900/50 focus:ring-blue-400"}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
                  >
                    <Save size={18} /> {loading ? 'Saving Changes...' : 'Update Security Settings'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Polling refresh */}
      <AutoRefresh onRefresh={() => currentBuildingId && fetchBuildingData(currentBuildingId)} />
    </div>
  );
}

function AutoRefresh({ onRefresh }: { onRefresh: () => void }) {
  useEffect(() => {
    const itv = setInterval(onRefresh, 5000);
    return () => clearInterval(itv);
  }, [onRefresh]);
  return null;
}
