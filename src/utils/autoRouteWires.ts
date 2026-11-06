import {
  CircuitComponentInstance,
  ComponentDefinition,
  PinDefinition,
  WireConnection,
} from '../types/circuit';

export interface AutoRouteOptions {
  mode?: 'direct' | 'orthogonal' | 'curved';
  selectedWireIds?: string[];
  padding?: number;
}

export interface AutoRouteResult {
  updatedWires: WireConnection[];
  routedCount: number;
}

/**
 * Calculates the absolute world coordinates of a pin considering component position and rotation.
 */
export function getPinAbsoluteCoords(
  comp: CircuitComponentInstance,
  pinId: string,
  componentDefs: Map<string, ComponentDefinition>
): { x: number; y: number } {
  const def = componentDefs.get(comp.typeId);
  if (!def) return { x: comp.x, y: comp.y };

  const pin = def.pins.find((p) => p.id === pinId);
  if (!pin) return { x: comp.x, y: comp.y };

  const rotation = comp.rotation || 0;
  if (rotation === 0) {
    return { x: comp.x + pin.x, y: comp.y + pin.y };
  }

  // Component origin center for rotation
  const cx = comp.x + def.width / 2;
  const cy = comp.y + def.height / 2;
  const px = comp.x + pin.x;
  const py = comp.y + pin.y;

  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rx = cos * (px - cx) - sin * (py - cy) + cx;
  const ry = sin * (px - cx) + cos * (py - cy) + cy;

  return { x: Math.round(rx), y: Math.round(ry) };
}

/**
 * Checks whether a line segment (x1, y1) -> (x2, y2) intersects an axis-aligned bounding box.
 */
function lineIntersectsBox(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  box: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
  // Check if either endpoint is inside the box
  if (
    (x1 >= box.minX && x1 <= box.maxX && y1 >= box.minY && y1 <= box.maxY) ||
    (x2 >= box.minX && x2 <= box.maxX && y2 >= box.minY && y2 <= box.maxY)
  ) {
    return true;
  }

  // Cohen-Sutherland line clipping style bounding check
  const minLineX = Math.min(x1, x2);
  const maxLineX = Math.max(x1, x2);
  const minLineY = Math.min(y1, y2);
  const maxLineY = Math.max(y1, y2);

  if (maxLineX < box.minX || minLineX > box.maxX || maxLineY < box.minY || minLineY > box.maxY) {
    return false;
  }

  // Ray cross check against box diagonals or center distance
  const boxCenterX = (box.minX + box.maxX) / 2;
  const boxCenterY = (box.minY + box.maxY) / 2;
  const boxRadius = Math.max(box.maxX - box.minX, box.maxY - box.minY) / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lineLenSq = dx * dx + dy * dy;

  if (lineLenSq === 0) return false;

  const t = Math.max(0, Math.min(1, ((boxCenterX - x1) * dx + (boxCenterY - y1) * dy) / lineLenSq));
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  const distSq = (closestX - boxCenterX) * (closestX - boxCenterX) + (closestY - boxCenterY) * (closestY - boxCenterY);
  return distSq < boxRadius * boxRadius * 0.8;
}

/**
 * Auto-routes wires to find the most direct, clean paths between component pins,
 * resolving overlaps and routing cleanly around obstacles.
 */
export function autoRouteCircuitWires(
  wires: WireConnection[],
  components: CircuitComponentInstance[],
  componentDefs: Map<string, ComponentDefinition>,
  options: AutoRouteOptions = {}
): AutoRouteResult {
  if (!wires || wires.length === 0) {
    return { updatedWires: [], routedCount: 0 };
  }

  const { mode = 'direct', selectedWireIds } = options;
  const shouldFilter = selectedWireIds && selectedWireIds.length > 0;
  const compMap = new Map<string, CircuitComponentInstance>();
  components.forEach((c) => compMap.set(c.id, c));

  // Build component bounding boxes (excluding breadboard holes since wires land inside them)
  const obstacleBoxes = components
    .filter((c) => c.typeId !== 'breadboard_half')
    .map((c) => {
      const def = componentDefs.get(c.typeId);
      const w = def?.width || 60;
      const h = def?.height || 50;
      return {
        id: c.id,
        minX: c.x,
        minY: c.y,
        maxX: c.x + w,
        maxY: c.y + h,
      };
    });

  // Track component-pair wire clusters to stagger parallel connections
  const pairWireMap = new Map<string, string[]>();
  wires.forEach((wire) => {
    const pairKey = [wire.fromComponentId, wire.toComponentId].sort().join(':::');
    if (!pairWireMap.has(pairKey)) {
      pairWireMap.set(pairKey, []);
    }
    pairWireMap.get(pairKey)!.push(wire.id);
  });

  let routedCount = 0;

  const updatedWires: WireConnection[] = wires.map((wire): WireConnection => {
    // If user specified selectedWireIds, only update selected ones
    if (shouldFilter && !selectedWireIds.includes(wire.id)) {
      return wire;
    }

    const fromComp = compMap.get(wire.fromComponentId);
    const toComp = compMap.get(wire.toComponentId);

    if (!fromComp || !toComp) return wire;

    const p1 = getPinAbsoluteCoords(fromComp, wire.fromPinId, componentDefs);
    const p2 = getPinAbsoluteCoords(toComp, wire.toPinId, componentDefs);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Identify obstacles between p1 and p2 (excluding source & target components)
    const hasObstacle = obstacleBoxes.some((box) => {
      if (box.id === wire.fromComponentId || box.id === wire.toComponentId) return false;
      return lineIntersectsBox(p1.x, p1.y, p2.x, p2.y, box);
    });

    // Check parallel wire bundle position
    const pairKey = [wire.fromComponentId, wire.toComponentId].sort().join(':::');
    const cluster = pairWireMap.get(pairKey) || [];
    const clusterIndex = cluster.indexOf(wire.id);
    const clusterSize = cluster.length;

    let targetCurvature = 0;

    if (mode === 'orthogonal') {
      // Orthogonal Manhattan routing with waypoints
      const midX = Math.round((p1.x + p2.x) / 2);
      const waypoints = [
        { x: midX, y: p1.y },
        { x: midX, y: p2.y },
      ];
      routedCount++;
      return {
        ...wire,
        curvature: 0,
        routingMode: 'orthogonal' as const,
        waypoints,
      };
    }

    if (hasObstacle) {
      // Route around the obstacle by applying a calculated safe arc
      const baseArc = Math.min(45, Math.max(25, distance * 0.18));
      // Alternate direction based on bundle or obstacle orientation
      const dir = clusterIndex % 2 === 0 ? 1 : -1;
      targetCurvature = Math.round(baseArc * dir);
    } else if (clusterSize > 1) {
      // Multiple wires between same components: spread them out with clean symmetrical spacing
      const spreadStep = 16;
      const offset = (clusterIndex - (clusterSize - 1) / 2) * spreadStep;
      targetCurvature = Math.round(offset);
    } else {
      // Direct cleanest route: minimal to 0 curvature
      // If pins are vertical/horizontal aligned, 0 curvature gives pure straight line
      if (Math.abs(dx) < 8 || Math.abs(dy) < 8 || distance < 120) {
        targetCurvature = 0;
      } else {
        // Very subtle natural 4-8px slack for visual elegance
        targetCurvature = distance > 300 ? 8 : 0;
      }
    }

    routedCount++;

    return {
      ...wire,
      curvature: targetCurvature,
      routingMode: 'direct' as const,
      waypoints: undefined,
    };
  });

  return {
    updatedWires,
    routedCount,
  };
}
