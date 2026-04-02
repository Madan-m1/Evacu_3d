// Extended Dijkstra implementation supporting exit and refuge fallback modes

export interface GraphEdge {
  target: string;
  distance: number;
}

export interface Graph {
  [nodeId: string]: GraphEdge[];
}

export interface NodeData {
  id: string;
  isExit: boolean;
  isRefuge: boolean;
  capacity: number;
  occupancy: number;
}

export interface PathResult {
  path: string[];
  mode: 'exit' | 'refuge' | 'none';
  message: string;
}

export function findEvacuationPath(
  graph: Graph,
  startNode: string,
  exitNodes: string[],
  refugeNodes: NodeData[],
  hazards: Set<string>
): PathResult {
  // First attempt: find path to nearest exit
  const exitIds = exitNodes;
  const exitPath = dijkstra(graph, startNode, exitIds, hazards);
  if (exitPath.length > 0) {
    return {
      path: exitPath,
      mode: 'exit',
      message: `Route found! Follow the path to ${exitPath[exitPath.length - 1]} — your nearest exit.`
    };
  }

  // Fallback: find path to nearest refuge area with available capacity
  const availableRefuges = refugeNodes
    .filter(n => n.occupancy < n.capacity)
    .map(n => n.id);

  const fullRefuges = refugeNodes
    .filter(n => n.occupancy >= n.capacity)
    .map(n => n.id);

  const refugePath = dijkstra(graph, startNode, availableRefuges, hazards);
  if (refugePath.length > 0) {
    const target = refugePath[refugePath.length - 1];
    const targetNode = refugeNodes.find(n => n.id === target);
    const capacityMsg = targetNode ? ` (Current occupancy: ${targetNode.occupancy}/${targetNode.capacity})` : '';
    
    return {
      path: refugePath,
      mode: 'refuge',
      message: `⚠️ All exits are currently blocked. Please move to the nearest safe refuge area: ${target}${capacityMsg}.`
    };
  }

  // If we reached here, either no refuge exists or all are full
  let msg = '🚨 Critical: No safe path available. Stay in place and contact emergency services immediately.';
  if (fullRefuges.length > 0 && availableRefuges.length === 0) {
    msg = `🚨 Emergency: All nearby refuge areas (${fullRefuges.join(', ')}) are at full capacity. Stay where you are and wait for rescue instructions.`;
  }

  return {
    path: [],
    mode: 'none',
    message: msg
  };
}

function dijkstra(
  graph: Graph,
  startNode: string,
  targetNodes: string[],
  hazards: Set<string>
): string[] {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set(Object.keys(graph));

  for (const node of Object.keys(graph)) {
    distances[node] = node === startNode ? 0 : Infinity;
    previous[node] = null;
  }

  while (unvisited.size > 0) {
    let currentNode: string | null = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      if (distances[node] !== undefined && distances[node]! < minDistance) {
        minDistance = distances[node]!;
        currentNode = node;
      }
    }

    if (currentNode === null || distances[currentNode] === Infinity) break;

    if (targetNodes.includes(currentNode)) {
      const path: string[] = [];
      let temp: string | null = currentNode;
      while (temp !== null) {
        path.unshift(temp);
        temp = previous[temp] ?? null;
      }
      return path;
    }

    unvisited.delete(currentNode);

    for (const neighbor of graph[currentNode] || []) {
      if (hazards.has(neighbor.target)) continue;
      const currentDist = distances[currentNode]!;
      const alt = currentDist + neighbor.distance;
      const targetDist = distances[neighbor.target];
      if (targetDist === undefined || alt < targetDist) {
        distances[neighbor.target] = alt;
        previous[neighbor.target] = currentNode;
      }
    }
  }

  return [];
}

// Backwards-compatible export
export function findShortestPath(
  graph: Graph,
  startNode: string,
  exitNodes: string[],
  hazards: Set<string>
): string[] {
  return dijkstra(graph, startNode, exitNodes, hazards);
}
