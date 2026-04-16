import React, { useState } from 'react';
import { useSimulationStore, type NodeData } from '../store/simulationStore';
import { Play, RotateCcw, ShieldAlert, MapPin, Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../api/config';

export const ControlPanel: React.FC = () => {
  const { 
    nodes, 
    startNode, 
    setStartNode, 
    activeHazards, 
    toggleHazard, 
    syncHazards,
    setSimulationResult,
    resetSimulation,
    simulationMode,
    simulationMessage,
    currentBuildingId,
    hazards,
    path,
    confirmedRefugeId,
    confirmArrivalAtRefuge,
    updatePulse,
    refugeOccupancy,
  } = useSimulationStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destNodeId = path[path.length - 1];
  const destNode = nodes.find(n => n.id === destNodeId);
  const isRefugeDest = destNode?.isRefuge && simulationMode === 'refuge';

  // Poll for shared hazard awareness
  React.useEffect(() => {
    const timer = setInterval(() => syncHazards(), 5000);
    return () => clearInterval(timer);
  }, [syncHazards]);

  const runSimulation = async () => {
    if (!startNode) {
      setError("Please select a starting location.");
      return;
    }
    if (!currentBuildingId) {
      setError("No building selected.");
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(getApiUrl(`/api/buildings/${currentBuildingId}/simulate`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNode, activeHazards })
      });
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setSimulationResult(data.path, data.pathCoordinates, data.mode, data.message);
      
      if (data.path.length === 0) {
        setError("SAFETY ALERT: No safe path available! All routes blocked.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to simulation server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-panelBg border-l border-gray-800 shadow-2xl overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-gray-800 bg-gray-900/50">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-alertRed" />
          Simulation Controls
        </h2>
      </div>

      <div className="p-6 space-y-8 flex-1">
        
        {/* Simulation Feedback Alert */}
        {simulationMessage && (
          <div className={`p-4 rounded-xl border ${
            simulationMode === 'exit' 
              ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-200' 
              : simulationMode === 'refuge'
              ? 'bg-amber-900/20 border-amber-500/50 text-amber-200'
              : 'bg-red-900/20 border-red-500/50 text-red-200'
          }`}>
            <h4 className="font-bold flex items-center gap-2 mb-1">
              {simulationMode === 'exit' ? '✅ Exit Route Found' : simulationMode === 'refuge' ? '⚠️ Falling Back to Refuge' : '🚨 CRITICAL FAILURE'}
            </h4>
            <p className="text-sm leading-relaxed">{simulationMessage}</p>
            
            {simulationMode === 'refuge' && destNode && (
              <div className="mt-3 pt-3 border-t border-amber-500/30 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-400 font-medium">TARGET REFUGE</span>
                  <span className="text-white font-bold">{destNode.roomName || destNode.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-400 font-medium">LIVE OCCUPANCY</span>
                  <span className={`font-mono font-bold ${(refugeOccupancy[destNode.id] || 0) >= (destNode.capacity || 10) ? 'text-red-400' : 'text-emerald-400'}`}>
                    {refugeOccupancy[destNode.id] || 0} / {destNode.capacity || 10}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Location Selection */}
        <div className="space-y-4">
          <label className="text-sm font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-2">
            <MapPin size={16} /> My Current Location
          </label>
          <div className="grid grid-cols-2 gap-3">
            {nodes.filter((n: NodeData) => !n.isExit && !n.isRefuge).map((node: NodeData) => (
              <button
                key={node.id}
                onClick={() => setStartNode(node.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  startNode === node.id 
                    ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(69,123,157,0.4)]' 
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }`}
              >
                <div className="font-medium">{node.roomName || node.id}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Emergency Guidance Panel */}
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <label className="text-sm font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-2">
            <ShieldAlert size={16} className="text-blue-400" /> Emergency Guidance
          </label>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3 text-gray-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-800/50">1</span>
                <span>{simulationMode === 'none' ? 'Stay where you are and seek immediate cover.' : 'Follow the highlighted path on the map.'}</span>
              </li>
              <li className="flex gap-3 text-gray-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-800/50">2</span>
                <span>Avoid any areas marked with <span className="text-alertRed font-semibold">Fire Indicators</span> 🔥.</span>
              </li>
              {simulationMode === 'refuge' ? (
                <li className="flex gap-3 text-amber-300 font-medium">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-900/40 text-amber-400 flex items-center justify-center text-[10px] font-bold border border-amber-800/50">3</span>
                  <span>Exits are blocked. Move to the assigned <span className="text-purple-400">Refuge Zone</span> and wait for rescue.</span>
                </li>
              ) : (
                <li className="flex gap-3 text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-800/50">3</span>
                  <span>Move calmly and assist others who may need help.</span>
                </li>
              )}
            </ul>
            {isRefugeDest && path.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                {!confirmedRefugeId ? (
                  <button 
                    onClick={() => {
                      confirmArrivalAtRefuge();
                      // Timeout to ensure state resolves before pulse
                      setTimeout(() => updatePulse(), 50); 
                    }}
                    className="w-full py-2.5 rounded-lg font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/20 text-sm flex items-center justify-center gap-2"
                  >
                    <ShieldAlert size={16} /> I have reached the refuge
                  </button>
                ) : (
                  <button 
                    disabled
                    className="w-full py-2.5 rounded-lg font-bold bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 transition-all cursor-default text-sm flex items-center justify-center gap-2"
                  >
                    ✅ You are safe in this refuge
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hazard Reporting */}
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <label className="text-sm font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-2">
            <ShieldAlert size={16} className="text-alertRed" /> Report Hazard (Fire/Blocked)
          </label>
          {isAuthenticated ? (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                {nodes.map((node: NodeData) => {
                  const hazard = hazards.find(h => h.nodeId === node.id);
                  const isActive = !!hazard;
                  const canClear = isActive && (user?.role === 'admin' || (user?.email === hazard.reportedBy && hazard.status === 'pending'));
                  const canToggle = !isActive || canClear;

                  return (
                    <button
                      key={node.id}
                      onClick={() => canToggle ? toggleHazard(node.id) : null}
                      disabled={!canToggle}
                      className={`px-2.5 py-1.5 rounded-md border transition-all flex items-center gap-1 ${
                        isActive
                          ? 'border-alertRed bg-alertRed/30 text-white shadow-[0_0_10px_rgba(230,57,70,0.3)]'
                          : 'border-gray-700 bg-gray-800/30 text-gray-500 hover:border-gray-500'
                      } ${!canToggle ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {isActive && <span className="animate-pulse">{canClear ? '🔥' : '🔒'}</span>}
                      {node.roomName || node.id}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 italic mt-2">
                Hazards reported here are shared with all users and instantly affect routing.
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3 bg-gray-800/40 border border-gray-700/50 rounded-xl px-4 py-3">
              <Lock size={16} className="text-gray-500 shrink-0" />
              <p className="text-sm text-gray-400">
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium underline">Sign in</Link>
                {' '}to report hazards and help other participants find safer routes. Guests can only view active hazards.
              </p>
            </div>
          )}
        </div>

      </div>

      <div className="p-6 border-t border-gray-800 bg-gray-900/80 space-y-4">
        {error && (
          <div className="bg-red-900/30 border border-alertRed text-red-200 px-4 py-3 rounded-lg text-sm animate-pulse">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={runSimulation}
            disabled={loading || !startNode}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-lg ${
              !startNode 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-blue-500 text-white shadow-primary/30'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
            Find Safest Path
          </button>
          
          <button
            onClick={() => {
              resetSimulation();
              setStartNode(null);
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-white font-medium transition-all"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
