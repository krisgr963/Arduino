import { CircuitComponentInstance, ComponentDefinition } from '../types/circuit';

export interface AutoLayoutOptions {
  startX?: number;
  startY?: number;
  gapX?: number;
  gapY?: number;
  maxWidth?: number;
  snapGrid?: number;
}

/**
 * Autolayout-funksjon som organiserer alle komponenter i kretsen
 * ved hjelp av en jevn, grid-basert layout-algoritme.
 */
export function autoLayoutComponents(
  components: CircuitComponentInstance[],
  componentDefs: Map<string, ComponentDefinition>,
  options: AutoLayoutOptions = {}
): CircuitComponentInstance[] {
  if (!components || components.length === 0) return [];

  const {
    startX = 100,
    startY = 80,
    gapX = 40,
    gapY = 50,
    maxWidth = 1100,
    snapGrid = 10,
  } = options;

  // Ranger komponenter logisk:
  // 1. Breadboard (sentralt fundament)
  // 2. Mikrokontrollere (Arduino / ESP32)
  // 3. Strømkilder (Batterier)
  // 4. Måleinstrumenter (Simuleringstrend / Oscilloskop)
  // 5. Inndata (Brytere, knapper, potensiometre)
  // 6. Passive (Motstander, kondensatorer)
  // 7. Utdata (LED, Summer)
  // 8. Egendefinerte
  const getPriority = (comp: CircuitComponentInstance): number => {
    const def = componentDefs.get(comp.typeId);
    if (!def) return 99;

    if (def.typeId === 'breadboard_half') return 1;
    if (def.typeId === 'arduino_uno' || def.typeId === 'esp32_devkit') return 2;
    if (def.category === 'Power') return 3;
    if (def.typeId === 'simulation_trend') return 4;
    if (def.category === 'Input') return 5;
    if (def.category === 'Passive') return 6;
    if (def.category === 'Output') return 7;
    return 8;
  };

  // Sorter komponentene for pen, logisk oppstilling
  const sorted = [...components].sort((a, b) => {
    const prioA = getPriority(a);
    const prioB = getPriority(b);
    if (prioA !== prioB) return prioA - prioB;
    return a.label.localeCompare(b.label, undefined, { numeric: true });
  });

  // Plassering i rader og kolonner med dynamisk radehøyde og jevn avstand
  let currentX = startX;
  let currentY = startY;
  let rowMaxHeight = 0;
  const layoutedComps: CircuitComponentInstance[] = [];

  for (const comp of sorted) {
    const def = componentDefs.get(comp.typeId);
    const width = def?.width || 80;
    const height = def?.height || 60;

    // Dersom komponenten ikke får plass i gjeldende rad, hopp til neste rad
    if (currentX > startX && currentX + width > maxWidth) {
      currentX = startX;
      currentY += rowMaxHeight + gapY;
      rowMaxHeight = 0;
    }

    // Juster til rutenett (snap-to-grid)
    const posX = Math.round(currentX / snapGrid) * snapGrid;
    const posY = Math.round(currentY / snapGrid) * snapGrid;

    layoutedComps.push({
      ...comp,
      x: posX,
      y: posY,
    });

    currentX += width + gapX;
    rowMaxHeight = Math.max(rowMaxHeight, height);
  }

  // Behold opprinnelig rekkefølge på komponent-IDer
  const idMap = new Map(layoutedComps.map((c) => [c.id, c]));
  return components.map((c) => idMap.get(c.id) || c);
}
