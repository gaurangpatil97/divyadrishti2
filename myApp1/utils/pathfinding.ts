import { IndoorMap, MapNode, MapEdge } from '../types/indoor-navigation';

interface PathNode {
  id: string;
  parent: string | null;
  cost: number;
}

/**
 * Find shortest path between two nodes using Dijkstra's algorithm
 */
export function findPath(
  map: IndoorMap,
  startId: string,
  endId: string
): MapEdge[] | null {
  const visited = new Set<string>();
  const nodes = new Map<string, PathNode>();
  const edges = new Map<string, MapEdge[]>();

  // Build adjacency list
  map.edges.forEach(edge => {
    if (!edges.has(edge.from)) {
      edges.set(edge.from, []);
    }
    edges.get(edge.from)!.push(edge);
  });

  // Initialize
  nodes.set(startId, { id: startId, parent: null, cost: 0 });
  const queue = [startId];

  while (queue.length > 0) {
    // Get node with lowest cost
    queue.sort((a, b) => {
      const costA = nodes.get(a)?.cost || Infinity;
      const costB = nodes.get(b)?.cost || Infinity;
      return costA - costB;
    });

    const currentId = queue.shift()!;
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    if (currentId === endId) {
      // Found the destination, reconstruct path
      return reconstructPath(nodes, edges, startId, endId);
    }

    const currentNode = nodes.get(currentId)!;
    const neighbors = edges.get(currentId) || [];

    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue;

      const newCost = currentNode.cost + edge.steps;
      const existingNode = nodes.get(edge.to);

      if (!existingNode || newCost < existingNode.cost) {
        nodes.set(edge.to, {
          id: edge.to,
          parent: currentId,
          cost: newCost,
        });
        queue.push(edge.to);
      }
    }
  }

  return null; // No path found
}

function reconstructPath(
  nodes: Map<string, PathNode>,
  edges: Map<string, MapEdge[]>,
  startId: string,
  endId: string
): MapEdge[] {
  const path: MapEdge[] = [];
  let currentId = endId;

  while (currentId !== startId) {
    const node = nodes.get(currentId)!;
    const parentId = node.parent!;
    
    // Find the edge from parent to current
    const parentEdges = edges.get(parentId) || [];
    const edge = parentEdges.find(e => e.to === currentId);
    
    if (edge) {
      path.unshift(edge);
    }
    
    currentId = parentId;
  }

  return path;
}

/**
 * Get readable direction from heading
 */
export function getDirectionFromHeading(heading: number): string {
  const normalized = ((heading % 360) + 360) % 360;
  
  if (normalized >= 337.5 || normalized < 22.5) return 'north';
  if (normalized >= 22.5 && normalized < 67.5) return 'northeast';
  if (normalized >= 67.5 && normalized < 112.5) return 'east';
  if (normalized >= 112.5 && normalized < 157.5) return 'southeast';
  if (normalized >= 157.5 && normalized < 202.5) return 'south';
  if (normalized >= 202.5 && normalized < 247.5) return 'southwest';
  if (normalized >= 247.5 && normalized < 292.5) return 'west';
  return 'northwest';
}

/**
 * Calculate turn direction for blind users
 */
export function getTurnDirection(fromHeading: number, toHeading: number): string {
  const diff = ((toHeading - fromHeading + 360) % 360);
  
  if (diff < 15 || diff > 345) return 'continue straight';
  if (diff > 15 && diff < 60) return 'turn slightly right';
  if (diff >= 60 && diff <= 120) return 'turn right';
  if (diff > 120 && diff < 165) return 'turn sharp right';
  if (diff >= 165 && diff <= 195) return 'turn around';
  if (diff > 195 && diff < 240) return 'turn sharp left';
  if (diff >= 240 && diff <= 300) return 'turn left';
  return 'turn slightly left';
}
