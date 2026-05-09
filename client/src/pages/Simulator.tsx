import { useEffect, useState, useCallback } from 'react';
import { BuildingScene } from '../components/3d/BuildingScene';
import { ControlPanel } from '../components/ControlPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useSimulationStore } from '../store/simulationStore';
import { Building2, ChevronRight, Plus, ShieldAlert, Home, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import SimulatorHelpTip, { EVACU3D_HELP_SEEN_KEY } from '../components/SimulatorHelpTip';

const Simulator = () => {
  // ── Store — single source of truth ────────────────────────────────────────
  const {
    buildings,
    currentBuildingId,
    currentBuildingName,
    fetchBuildings,
    loadBuilding,
    drawerOpen,           // consumed here AND by the 3D label system
    setDrawerOpen,        // from store — drives label suppression in LevelMap
  } = useSimulationStore();

  const [status, setStatus] = useState<'picking' | 'loading' | 'ready' | 'error'>('picking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Track Quick Start visibility so Controls button can avoid overlapping it
  const [helpTipVisible, setHelpTipVisible] = useState(
    () => typeof window !== 'undefined' ? !localStorage.getItem(EVACU3D_HELP_SEEN_KEY) : false
  );

  // ── Reliable mobile detection via matchMedia ──────────────────────────────
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // ── Fetch buildings on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchBuildings().catch(() => {
      setStatus('error');
      setErrorMsg('Failed to connect to the simulation server.');
    });
  }, [fetchBuildings]);

  // If a building is already in the store (e.g. navigating back), go to ready
  useEffect(() => {
    if (currentBuildingId && status === 'picking') {
      setStatus('ready');
    }
  }, [currentBuildingId, status]);

  // ── Real-time sync intervals — owned by React, properly cleaned up ────────
  useEffect(() => {
    if (!currentBuildingId) return;
    const { syncParticipants, updatePulse, syncHazards } = useSimulationStore.getState();
    const partInterval   = setInterval(syncParticipants, 2500);
    const pulseInterval  = setInterval(updatePulse,      5000);
    const hazardInterval = setInterval(syncHazards,     10000);
    return () => {
      clearInterval(partInterval);
      clearInterval(pulseInterval);
      clearInterval(hazardInterval);
    };
  }, [currentBuildingId]);

  // ── Cleanup on unmount: reset simulation state + close drawer ─────────────
  // Ensures the next visit starts completely clean
  useEffect(() => {
    return () => {
      setDrawerOpen(false);
      useSimulationStore.setState({
        path: [],
        pathCoordinates: [],
        simulationMode: 'none',
        simulationMessage: null,
        startNode: null,
        drawerOpen: false,
      });
    };
  }, [setDrawerOpen]);

  // ── Switch building ───────────────────────────────────────────────────────
  const handleSwitchBuilding = useCallback(() => {
    setDrawerOpen(false);
    useSimulationStore.setState({ currentBuildingId: null, nodes: [], edges: [] });
    setStatus('picking');
  }, [setDrawerOpen]);

  const handleSelectBuilding = async (id: string) => {
    setStatus('loading');
    await loadBuilding(id);
    setStatus('ready');
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
                    <div className="text-white font-semibold">{b.name}</div>
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
      <div className="h-screen bg-[#0f1117] flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-lg w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 mb-4">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Connection Lost</h1>
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
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-black">

      {/* ── 3D Viewer ─────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0">

        {/* Top bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <Link
            to="/"
            className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition"
            aria-label="Back to home"
          >
            <Home size={12} />
            <span>Home</span>
          </Link>
          <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300">
            <Building2 size={12} className="text-blue-400" />
            {currentBuildingName}
            <button
              onClick={handleSwitchBuilding}
              className="ml-1 text-gray-500 hover:text-white transition text-xs"
              title="Switch building"
              aria-label="Switch building"
            >↩</button>
          </div>
        </div>

        {/* Map Legend — desktop only */}
        <div className="hidden md:block absolute top-12 left-3 z-10 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-gray-700 text-xs max-w-[140px]">
          <h3 className="text-white font-bold mb-3 border-b border-gray-600 pb-2">Map Legend</h3>
          <div className="space-y-2">
            {[
              { color: 'bg-blue-500',   label: 'Room / Area' },
              { color: 'bg-emerald-500', label: 'Safe Exit' },
              { color: 'bg-purple-500', label: 'Refuge Area' },
              { color: 'bg-red-500 animate-pulse', label: 'Fire / Obstacle' },
              { color: 'bg-blue-400',   label: 'Other Users' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color} shadow-lg`} />
                <span className="text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Onboarding help tip */}
        <SimulatorHelpTip onDismiss={() => setHelpTipVisible(false)} />

        {/* Mobile: floating Controls button — only when drawer is closed.
             When Quick Start panel is visible (bottom-right), pin button to bottom-left
             so they never overlap. Once help is dismissed it returns to bottom-right. */}
        {isMobile && !drawerOpen && (
          <button
            onClick={() => setDrawerOpen(true)}
            className={`absolute bottom-5 z-[19] flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl shadow-lg font-semibold text-sm transition ${
              helpTipVisible ? 'left-4' : 'right-4'
            }`}
            aria-label="Open simulation controls"
            aria-expanded={false}
            aria-controls="sim-control-drawer"
          >
            <SlidersHorizontal size={16} />
            Controls
          </button>
        )}

        {/* 3D Canvas — keyed on building ID so R3F fully remounts on change */}
        <div className="absolute inset-0">
          <ErrorBoundary>
            <BuildingScene key={currentBuildingId ?? 'no-building'} />
          </ErrorBoundary>
        </div>
      </div>

      {/* ── Desktop Control Panel — only mounted when not mobile ──────────── */}
      {!isMobile && (
        <div className="w-96 shrink-0 z-10" aria-label="Simulation controls">
          <ControlPanel />
        </div>
      )}

      {/* ── Mobile Drawer — only mounted when open ────────────────────────── */}
      {isMobile && drawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div
            id="sim-control-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Simulation controls"
            className="relative z-10 bg-panelBg rounded-t-2xl border-t border-gray-700 shadow-2xl"
            style={{ maxHeight: '82vh', overflowY: 'auto' }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-gray-800 sticky top-0 bg-panelBg z-10">
              <div className="w-10 h-1 bg-gray-600 rounded-full" aria-hidden="true" />
              <span className="text-sm font-semibold text-white">Simulation Controls</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close simulation controls"
                className="text-gray-500 hover:text-white transition p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(82vh - 60px)' }}>
              <ControlPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulator;
