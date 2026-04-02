import { useEffect, useState } from 'react';
import { BuildingScene } from '../components/3d/BuildingScene';
import { ControlPanel } from '../components/ControlPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useSimulationStore } from '../store/simulationStore';
import { Building2, ChevronRight, Plus, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const Simulator = () => {
  const { buildings, currentBuildingId, currentBuildingName, fetchBuildings, loadBuilding } = useSimulationStore();
  const [status, setStatus] = useState<'picking' | 'loading' | 'ready' | 'error'>('picking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBuildings().catch(() => {
      setStatus('error');
      setErrorMsg('Failed to connect to the simulation server.');
    });
  }, [fetchBuildings]);

  // If a building is already in store, switch to ready
  useEffect(() => {
    if (currentBuildingId && status === 'picking') {
      setStatus('ready');
    }
  }, [currentBuildingId, status]);

  const handleSelectBuilding = async (id: string) => {
    setStatus('loading');
    await loadBuilding(id);

    // Kick off real-time sync
    const { syncParticipants, updatePulse, syncHazards } = useSimulationStore.getState();
    const partInterval = setInterval(syncParticipants, 2500);
    const pulseInterval = setInterval(updatePulse, 5000);
    const hazardInterval = setInterval(syncHazards, 10000);

    setStatus('ready');

    return () => {
      clearInterval(partInterval);
      clearInterval(pulseInterval);
      clearInterval(hazardInterval);
    };
  };

  // ─── Building Picker ────────────────────────────────────────────────────────
  if (status === 'picking') {
    return (
      <div className="h-screen bg-[#0f1117] flex flex-col items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
              <Building2 size={32} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Select a Building</h1>
            <p className="text-gray-400">Choose the building you are currently in to begin the evacuation simulation.</p>
          </div>

          {buildings.length === 0 ? (
            <div className="text-center space-y-4">
              <p className="text-gray-500">No buildings have been created yet.</p>
              <Link to="/dashboard"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl transition font-medium">
                <Plus size={16} /> Create a Building in Admin Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {buildings.map(b => (
                <button
                  key={b._id}
                  onClick={() => handleSelectBuilding(b._id)}
                  className="w-full flex items-center justify-between bg-[#1a1d2e] border border-gray-700 hover:border-blue-500 hover:bg-blue-900/10 rounded-xl px-5 py-4 text-left transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                      <Building2 size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{b.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{b._id}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="h-screen bg-[#0f1117] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="max-w-lg w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 mb-4">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-display">Connection Lost</h1>
          <p className="text-gray-400 mb-8">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl transition-all font-bold shadow-lg"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0f1117] text-blue-400 gap-4">
        <span className="w-5 h-5 rounded-full bg-blue-400 animate-ping" />
        <span className="text-lg font-medium animate-pulse">Loading {currentBuildingName || 'Building'}...</span>
      </div>
    );
  }

  // ─── Simulator View ─────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full flex overflow-hidden bg-black">
      {/* 3D Viewer */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <div className="w-full h-full p-2 border border-gray-800 bg-gray-900 rounded-2xl relative shadow-2xl">
          {/* Building badge */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300">
            <Building2 size={12} className="text-blue-400" />
            {currentBuildingName}
            <button
              onClick={() => { useSimulationStore.setState({ currentBuildingId: null, nodes: [], edges: [] }); setStatus('picking'); }}
              className="ml-1 text-gray-500 hover:text-white transition text-xs"
              title="Switch building"
            >↩</button>
          </div>

          <ErrorBoundary>
            <BuildingScene />
          </ErrorBoundary>

          {/* Legend */}
          <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-gray-700 text-sm">
            <h3 className="text-white font-bold mb-3 border-b border-gray-600 pb-2">Map Legend</h3>
            <div className="space-y-2">
              {[
                { color: 'bg-blue-500', label: 'Room / Area' },
                { color: 'bg-emerald-500', label: 'Safe Exit' },
                { color: 'bg-purple-500', label: 'Refuge Area' },
                { color: 'bg-red-500 animate-pulse', label: 'Fire / Obstacle' },
                { color: 'bg-blue-400', label: 'Other Users' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color} shadow-lg`} />
                  <span className="text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-96 shrink-0 z-10">
        <ControlPanel />
      </div>
    </div>
  );
};

export default Simulator;
