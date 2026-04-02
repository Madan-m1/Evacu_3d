import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Plus, Trash2, CheckCircle, AlertCircle, Settings2, Layers } from 'lucide-react';

export interface Node {
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

export interface Edge {
  source: string;
  target: string;
  distance: number;
}

interface Props {
  initialNodes: Node[];
  initialEdges: Edge[];
  onSave: (nodes: Node[], edges: Edge[]) => void;
}

// Generate a guaranteed-unique node id
const makeId = () => `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export default function VisualBuilder({ initialNodes, initialEdges, onSave }: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [saveMsg, setSaveMsg] = useState('');
  
  // Floor and grid positioning state
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  // ─── Only initialise from props once per building load ───────────────────
  // We track the previous building fingerprint (first node id) so that when
  // the Admin changes to a different building the editor reloads, but parent
  // polling rerenders don't wipe unsaved edits.
  const loadedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    // Compute a fingerprint for the incoming data set
    const fingerprint = (initialNodes && initialNodes.length > 0)
      ? initialNodes[0].id
      : '__empty__';

    if (fingerprint !== loadedFingerprintRef.current) {
      console.log('[VisualBuilder] Loading new building data. fingerprint:', fingerprint);
      loadedFingerprintRef.current = fingerprint;
      setNodes(initialNodes ? [...initialNodes] : []);
      setEdges(initialEdges ? [...initialEdges] : []);
      setSaveStatus('idle');
    }
    // If fingerprint unchanged we intentionally do NOT reset state,
    // so in-progress edits (including new nodes) survive parent re-renders.
  }, [initialNodes, initialEdges]);

  // ─── Add Node ─────────────────────────────────────────────────────────────
  const addNode = useCallback(() => {
    setNodes(prev => {
      // Calculate automatic grid positioning
      const floorY = (selectedFloor - 1) * 4;
      // Find how many nodes are already on this floor
      const nodesOnFloor = prev.filter(n => Math.abs((n.y || 0) - floorY) < 0.1);
      const nodeIndex = nodesOnFloor.length;
      
      const columns = 5;
      const spacing = 4;
      
      const col = nodeIndex % columns;
      const row = Math.floor(nodeIndex / columns);
      
      const x = col * spacing;
      const z = row * spacing;

      const newNode: Node = {
        id: makeId(),
        x,
        y: floorY,
        z,
        roomName: `Room ${prev.length + 1}`,
        isExit: false,
        isRefuge: false,
        capacity: 10,
        occupancy: 0,
      };

      console.log('[VisualBuilder] Adding node:', newNode.id, 'at', {x, y: floorY, z});
      const updated = [...prev, newNode];
      return updated;
    });
  }, [selectedFloor]);

  // ─── Add Edge ─────────────────────────────────────────────────────────────
  const addEdge = useCallback(() => {
    setNodes(current => {
      if (current.length < 2) {
        console.warn('[VisualBuilder] Need at least 2 nodes to add an edge');
        return current;
      }
      setEdges(prev => [
        ...prev,
        { source: current[0].id, target: current[1].id, distance: 4 },
      ]);
      return current;
    });
  }, []);

  // ─── Update Node ──────────────────────────────────────────────────────────
  const updateNode = useCallback((index: number, field: keyof Node, value: any) => {
    setNodes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // ─── Update Edge ──────────────────────────────────────────────────────────
  const updateEdge = useCallback((index: number, field: keyof Edge, value: any) => {
    setEdges(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // ─── Delete Node (cascades to edges) ─────────────────────────────────────
  const deleteNode = useCallback((index: number) => {
    setNodes(prev => {
      const nodeId = prev[index]?.id;
      const newNodes = prev.filter((_, i) => i !== index);
      setEdges(prevEdges => prevEdges.filter(e => e.source !== nodeId && e.target !== nodeId));
      return newNodes;
    });
  }, []);

  // ─── Delete Edge ──────────────────────────────────────────────────────────
  const deleteEdge = useCallback((index: number) => {
    setEdges(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    const payload = { nodes, edges };
    console.log('[VisualBuilder] Saving layout. Nodes:', nodes.length, 'Edges:', edges.length);
    console.log('[VisualBuilder] Payload:', JSON.stringify(payload, null, 2));
    try {
      onSave(nodes, edges);
      setSaveStatus('ok');
      setSaveMsg(`Saved ${nodes.length} nodes and ${edges.length} edges.`);
    } catch (err: any) {
      console.error('[VisualBuilder] Save failed:', err);
      setSaveStatus('error');
      setSaveMsg(`Save failed: ${err?.message || 'unknown error'}`);
    }
    setTimeout(() => setSaveStatus('idle'), 3000);
  }, [nodes, edges, onSave]);

  const inputCls = "bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500";
  const numCls = "bg-gray-800 border border-gray-700 text-white rounded px-1 py-1 text-sm w-16 text-center focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="flex flex-col bg-gray-900 h-full overflow-y-auto custom-scrollbar p-6 gap-6">

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">Layout Editor</h2>
          <p className="text-sm text-gray-400">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} edge{edges.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white px-4 py-2 rounded-lg shadow-lg transition font-medium"
        >
          <Save size={16} />
          {saveStatus === 'saving' ? 'Saving…' : 'Save Layout'}
        </button>
      </div>

      {/* ─── Save Status ─────────────────────────────────────────────────────── */}
      {saveStatus !== 'idle' && saveStatus !== 'saving' && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm shrink-0 ${
          saveStatus === 'ok'
            ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-300'
            : 'bg-red-900/30 border border-red-700 text-red-300'
        }`}>
          {saveStatus === 'ok'
            ? <CheckCircle size={14} />
            : <AlertCircle size={14} />}
          {saveMsg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* ─── Nodes Table ─────────────────────────────────────────────────────── */}
        <div className="bg-[#1a1d2e] rounded-xl border border-gray-800 shadow-lg overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-white text-sm flex items-center">
                Nodes <span className="ml-2 bg-blue-900/30 text-blue-400 border border-blue-800/40 text-xs px-2 py-0.5 rounded-full">{nodes.length}</span>
              </h3>
              
              {/* Floor Selector & Advanced Toggle */}
              <div className="flex items-center gap-2 ml-2 border-l border-gray-700 pl-4 h-6">
                <div className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-lg transition">
                  <Layers size={14} className="text-gray-400" />
                  <select 
                    value={selectedFloor} 
                    onChange={e => setSelectedFloor(Number(e.target.value))}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer appearance-none outline-none"
                    title="Select Floor (determines Y coordinate)"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(f => (
                      <option key={f} value={f} className="bg-gray-900">Floor {f}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setAdvancedMode(m => !m)}
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition font-medium ${
                    advancedMode 
                      ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50' 
                      : 'bg-gray-800/50 border border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  title="Toggle Advanced Mode (Manual Coordinates)"
                >
                  <Settings2 size={13} /> Advanced
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={addNode}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition font-medium select-none"
            >
              <Plus size={13} /> Add Node
            </button>
          </div>

          {nodes.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No nodes yet. Click <strong className="text-white">Add Node</strong> to start.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-900/60 text-gray-400 text-xs">
                  <tr>
                    <th className="px-3 py-2">Room Name</th>
                    {advancedMode && <th className="px-3 py-2">ID</th>}
                    {advancedMode && <th className="px-3 py-2 text-center">X</th>}
                    {advancedMode && <th className="px-3 py-2 text-center">Y</th>}
                    {advancedMode && <th className="px-3 py-2 text-center">Z</th>}
                    <th className="px-3 py-2 text-center">Exit</th>
                    <th className="px-3 py-2 text-center">Refuge</th>
                    <th className="px-3 py-2 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {nodes.map((n, i) => (
                    <tr key={n.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-3 py-2">
                        <input
                          className={inputCls}
                          value={n.roomName || ''}
                          placeholder="Room name…"
                          onChange={e => updateNode(i, 'roomName', e.target.value)}
                        />
                      </td>
                      {advancedMode && (
                        <td className="px-3 py-2">
                          <input
                            className={inputCls + ' font-mono text-xs w-24'}
                            value={n.id}
                            placeholder="unique-id"
                            onChange={e => updateNode(i, 'id', e.target.value)}
                          />
                        </td>
                      )}
                      {advancedMode && (
                        <td className="px-3 py-2">
                          <input type="number" step="0.5" className={numCls} value={n.x}
                            onChange={e => updateNode(i, 'x', parseFloat(e.target.value) || 0)} />
                        </td>
                      )}
                      {advancedMode && (
                        <td className="px-3 py-2">
                          <input type="number" step="0.5" className={numCls} value={n.y}
                            onChange={e => updateNode(i, 'y', parseFloat(e.target.value) || 0)} />
                        </td>
                      )}
                      {advancedMode && (
                        <td className="px-3 py-2">
                          <input type="number" step="0.5" className={numCls} value={n.z}
                            onChange={e => updateNode(i, 'z', parseFloat(e.target.value) || 0)} />
                        </td>
                      )}
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={!!n.isExit}
                          onChange={e => updateNode(i, 'isExit', e.target.checked)}
                          className="accent-emerald-500 cursor-pointer w-4 h-4" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={!!n.isRefuge}
                          onChange={e => updateNode(i, 'isRefuge', e.target.checked)}
                          className="accent-purple-500 cursor-pointer w-4 h-4" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => deleteNode(i)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded transition">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Edges Table ─────────────────────────────────────────────────────── */}
        <div className="bg-[#1a1d2e] rounded-xl border border-gray-800 shadow-lg overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
            <h3 className="font-semibold text-white text-sm">
              Connections <span className="ml-1 bg-blue-900/30 text-blue-400 border border-blue-800/40 text-xs px-2 py-0.5 rounded-full">{edges.length}</span>
            </h3>
            <button
              type="button"
              onClick={addEdge}
              disabled={nodes.length < 2}
              title={nodes.length < 2 ? 'Need at least 2 nodes' : 'Add connection'}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-1.5 rounded-lg transition font-medium select-none"
            >
              <Plus size={13} /> Add Edge
            </button>
          </div>

          {edges.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No connections yet. Add at least 2 nodes, then click <strong className="text-white">Add Edge</strong>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-900/60 text-gray-400 text-xs">
                  <tr>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Target</th>
                    <th className="px-3 py-2 text-center">Distance (m)</th>
                    <th className="px-3 py-2 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {edges.map((e, i) => (
                    <tr key={i} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-3 py-2">
                        <select className={inputCls} value={e.source}
                          onChange={evt => updateEdge(i, 'source', evt.target.value)}>
                          <option value="">Select node…</option>
                          {nodes.map(n => <option key={n.id} value={n.id}>{n.roomName || n.id}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select className={inputCls} value={e.target}
                          onChange={evt => updateEdge(i, 'target', evt.target.value)}>
                          <option value="">Select node…</option>
                          {nodes.map(n => <option key={n.id} value={n.id}>{n.roomName || n.id}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" step="0.5" min="0.5" className={numCls}
                          value={e.distance}
                          onChange={evt => updateEdge(i, 'distance', parseFloat(evt.target.value) || 1)} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => deleteEdge(i)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded transition">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
