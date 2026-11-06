import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  AlignmentType,
  CircuitComponentInstance,
  CircuitLayer,
  CircuitProject,
  ComponentDefinition,
  DEFAULT_LAYERS,
  DistributionType,
  ExternalLibrary,
  StickyNote,
  WireConnection,
} from './types/circuit';
import {
  getAllAvailableComponents,
  loadStoredLibraries,
  saveStoredLibraries,
  loadStoredCustomComponents,
  saveStoredCustomComponent,
} from './data/externalLibraries';
import { PRESET_PROJECTS } from './data/presetProjects';
import { analyzeCircuit } from './utils/circuitSimulation';
import { autoLayoutComponents } from './utils/autoLayout';
import { autoRouteCircuitWires } from './utils/autoRouteWires';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { HeaderBar } from './components/toolbar/HeaderBar';
import { CanvasToolbar } from './components/toolbar/CanvasToolbar';
import { ComponentSidebar } from './components/toolbar/ComponentSidebar';
import { ComponentInspector } from './components/inspector/ComponentInspector';
import { CircuitGuidePanel } from './components/guide/CircuitGuidePanel';
import { ComponentEditorModal } from './components/modals/ComponentEditorModal';
import { LibraryManagerModal } from './components/modals/LibraryManagerModal';
import { BOMModal } from './components/modals/BOMModal';
import { ERCWarningsDrawer } from './components/modals/ERCWarningsDrawer';
import { ProjectManagerModal, saveProjectToStorage } from './components/modals/ProjectManagerModal';
import { LayerManagerDrawer } from './components/layers/LayerManagerDrawer';
import { PDFExportModal } from './components/modals/PDFExportModal';
import { ImageExportModal } from './components/modals/ImageExportModal';
import { PanelLeft, PanelRight } from 'lucide-react';

export default function App() {
  // 1. Libraries and Custom Components
  const [libraries, setLibraries] = useState<ExternalLibrary[]>(() => loadStoredLibraries());
  const [customComponents, setCustomComponents] = useState<ComponentDefinition[]>(() =>
    loadStoredCustomComponents()
  );

  // Available components dictionary
  const availableComponents = useMemo(() => {
    return getAllAvailableComponents(libraries, customComponents);
  }, [libraries, customComponents]);

  const componentDefsMap = useMemo(() => {
    const map = new Map<string, ComponentDefinition>();
    availableComponents.forEach((c) => map.set(c.typeId, c));
    return map;
  }, [availableComponents]);

  // 2. Active Project
  const [project, setProject] = useState<CircuitProject>(() => {
    try {
      const saved = localStorage.getItem('circulab_last_project');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return PRESET_PROJECTS[0];
  });

  // Undo / Redo History Stacks
  const [historyPast, setHistoryPast] = useState<CircuitProject[]>([]);
  const [historyFuture, setHistoryFuture] = useState<CircuitProject[]>([]);

  // Push current state to past history before mutations
  const pushToHistory = useCallback((current: CircuitProject) => {
    setHistoryPast((prev) => {
      const copy = JSON.parse(JSON.stringify(current));
      const next = [...prev, copy];
      if (next.length > 30) next.shift(); // keep max 30 history states
      return next;
    });
    setHistoryFuture([]); // clear redo stack on new action
  }, []);

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    setHistoryPast((prev) => {
      const newPast = [...prev];
      const previousState = newPast.pop()!;
      setHistoryFuture((f) => [JSON.parse(JSON.stringify(project)), ...f]);
      setProject(previousState);
      return newPast;
    });
  }, [historyPast, project]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    setHistoryFuture((prev) => {
      const newFuture = [...prev];
      const nextState = newFuture.shift()!;
      setHistoryPast((p) => [...p, JSON.parse(JSON.stringify(project))]);
      setProject(nextState);
      return newFuture;
    });
  }, [historyFuture, project]);

  // Autosave and Manual Save State
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(() => new Date());
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Autosave current project to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('circulab_last_project', JSON.stringify(project));
      setLastSavedTime(new Date());
    } catch (err) {
      console.error('Autosave error:', err);
    }
  }, [project]);

  // Manual save handler to force immediate write to localStorage
  const handleManualSave = useCallback(() => {
    setIsSaving(true);
    try {
      localStorage.setItem('circulab_last_project', JSON.stringify(project));
      saveProjectToStorage(project);
      setLastSavedTime(new Date());
      setExportNotification('Kretsen ble lagret til nettleserminnet (localStorage)!');
      setTimeout(() => setExportNotification(null), 3000);
    } catch (err) {
      console.error('Manual save error:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 350);
    }
  }, [project]);

  // 3. Selection & Canvas Settings (Supports Multi-Selection)
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [selectedWireIds, setSelectedWireIds] = useState<string[]>([]);
  const [activeWireColor, setActiveWireColor] = useState<string>('#dc2626');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Canvas Pan & Zoom
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(2.5, +(z * 1.2).toFixed(2)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.25, +(z / 1.2).toFixed(2)));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 50, y: 50 });
  }, []);

  // 4. Sidebars Visibility (Full Screen Workspace)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const isFullScreenWorkspace = !isLeftSidebarOpen && !isRightSidebarOpen;

  // 5. Canvas Theme (Dark vs Light Grid Background)
  const [canvasTheme, setCanvasTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('circulab_canvas_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('circulab_canvas_theme', canvasTheme);
    } catch (err) {
      console.error('Error saving theme:', err);
    }
  }, [canvasTheme]);

  const handleToggleCanvasTheme = useCallback(() => {
    setCanvasTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Export JSON Notification Toast
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Direct Export Circuit Design as .JSON file
  const handleExportProjectJson = useCallback(() => {
    const exportData = {
      ...project,
      exportedAt: new Date().toISOString(),
      app: 'CircuLab Fritzing Designer',
      format: 'circulab-json-v1',
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    const safeName = (project.name || 'kretsdesign')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    downloadAnchor.setAttribute('download', `${safeName}.circulab.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    setExportNotification(`Kretsdesignet ble lastet ned som "${safeName}.circulab.json"!`);
    setTimeout(() => setExportNotification(null), 3500);
  }, [project]);

  const handleToggleFullScreenWorkspace = useCallback(() => {
    if (isFullScreenWorkspace) {
      setIsLeftSidebarOpen(true);
      setIsRightSidebarOpen(true);
    } else {
      setIsLeftSidebarOpen(false);
      setIsRightSidebarOpen(false);
    }
  }, [isFullScreenWorkspace]);

  // 5. Koblingsguide (Circuit Assistant) State
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // 6. Interactive Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0);
  const [simulationClockTick, setSimulationClockTick] = useState<number>(0);
  const [buttonPressedStates, setButtonPressedStates] = useState<Record<string, boolean>>({});

  // Clock tick interval generator for logic simulation, scaled by simulationSpeed
  useEffect(() => {
    if (!isSimulating) {
      setSimulationClockTick(0);
      return;
    }

    // Base interval is 400ms at 1.0x speed.
    // e.g. at 0.25x speed => 1600ms (slow motion logic observation).
    // at 2.0x speed => 200ms.
    // at 5.0x speed => 80ms.
    const intervalMs = Math.max(35, Math.round(400 / simulationSpeed));
    const timer = setInterval(() => {
      setSimulationClockTick((prev) => (prev + 1) % 1000000);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed]);

  // 7. Modals State
  const [isComponentEditorOpen, setIsComponentEditorOpen] = useState(false);
  const [isLibraryManagerOpen, setIsLibraryManagerOpen] = useState(false);
  const [isBOMOpen, setIsBOMOpen] = useState(false);
  const [isERCWarningsOpen, setIsERCWarningsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isPDFExportOpen, setIsPDFExportOpen] = useState(false);
  const [isImageExportOpen, setIsImageExportOpen] = useState(false);

  // Active Layers for current project
  const projectLayers = useMemo(() => {
    return project.layers && project.layers.length > 0 ? project.layers : DEFAULT_LAYERS;
  }, [project.layers]);

  // Handler: Update Layer configurations (visibility, lock, name, color)
  const handleUpdateLayers = useCallback(
    (updatedLayers: CircuitLayer[]) => {
      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        layers: updatedLayers,
      }));
    },
    [project, pushToHistory]
  );

  // Handler: Move elements from a deleted layer to another layer
  const handleMoveComponentsToLayer = useCallback(
    (sourceLayerId: string, targetLayerId: string) => {
      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        components: prev.components.map((c) =>
          c.layerId === sourceLayerId ? { ...c, layerId: targetLayerId } : c
        ),
        wires: prev.wires.map((w) =>
          w.layerId === sourceLayerId ? { ...w, layerId: targetLayerId } : w
        ),
        notes: (prev.notes || []).map((n) =>
          n.layerId === sourceLayerId ? { ...n, layerId: targetLayerId } : n
        ),
      }));
    },
    [project, pushToHistory]
  );

  // 8. Run Circuit Analysis & Electrical Rule Check (ERC)
  const simulationResult = useMemo(() => {
    return analyzeCircuit(
      project.components,
      project.wires,
      componentDefsMap,
      isSimulating ? buttonPressedStates : {},
      simulationClockTick
    );
  }, [project.components, project.wires, componentDefsMap, isSimulating, buttonPressedStates, simulationClockTick]);

  // Merge computed simulation states into component instances
  const activeComponentsWithSim = useMemo(() => {
    return project.components.map((comp) => {
      const sim = simulationResult.activeComponents[comp.id];
      return {
        ...comp,
        state: {
          ...comp.state,
          isPressed: buttonPressedStates[comp.id] ?? false,
          simActive: isSimulating ? sim?.simActive ?? false : false,
          simVoltage: isSimulating ? sim?.simVoltage : undefined,
          simCurrent: isSimulating ? sim?.simCurrent : undefined,
          simBurned: isSimulating ? sim?.simBurned ?? false : false,
        },
      };
    });
  }, [project.components, simulationResult.activeComponents, isSimulating, buttonPressedStates]);

  // Selected Components & Definitions
  const selectedComponents = useMemo(() => {
    return activeComponentsWithSim.filter((c) => selectedComponentIds.includes(c.id));
  }, [selectedComponentIds, activeComponentsWithSim]);

  const selectedComponent = selectedComponents[0] || null;

  const selectedComponentDef = useMemo(() => {
    if (!selectedComponent) return null;
    return componentDefsMap.get(selectedComponent.typeId) || null;
  }, [selectedComponent, componentDefsMap]);

  // Handler: Add Component to Canvas
  const handleAddComponent = useCallback(
    (typeId: string, customProps?: Record<string, any>, customX?: number, customY?: number) => {
      pushToHistory(project);

      const def = componentDefsMap.get(typeId);
      if (!def) return;

      const prefix = def.name.substring(0, 3).toUpperCase();
      const count = project.components.filter((c) => c.typeId === typeId).length + 1;

      // Smart positioning: place near center or offset from existing
      let posX = customX;
      let posY = customY;
      if (posX === undefined || posY === undefined) {
        posX = 320 + (project.components.length % 6) * 45;
        posY = 170 + (project.components.length % 6) * 35;
      }

      const newComp: CircuitComponentInstance = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        typeId,
        label: `${prefix}${count}`,
        x: posX,
        y: posY,
        rotation: 0,
        properties: { ...(def.defaultProperties || {}), ...(customProps || {}) },
        notes: def.description,
        datasheetUrl: def.datasheetUrl,
      };

      setProject((prev) => ({
        ...prev,
        components: [...prev.components, newComp],
      }));
      setSelectedComponentIds([newComp.id]);
      setSelectedWireIds([]);

      // Proactively open/suggest guide if user adds LED, Arduino, or ESP32 and guide is not yet open
      if (typeId === 'led_5mm' || typeId === 'arduino_uno' || typeId === 'esp32_devkit') {
        setIsGuideOpen(true);
      }
    },
    [componentDefsMap, project, pushToHistory]
  );

  // Component Dragging History Tracker
  const dragStartSnapshotRef = useRef<CircuitProject | null>(null);

  const handleUpdateComponentPosition = useCallback((id: string, x: number, y: number) => {
    if (!dragStartSnapshotRef.current) {
      dragStartSnapshotRef.current = project;
    }
    setProject((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, x, y } : c)),
    }));
  }, [project]);

  const handleComponentDragEnd = useCallback(() => {
    if (dragStartSnapshotRef.current) {
      pushToHistory(dragStartSnapshotRef.current);
      dragStartSnapshotRef.current = null;
    }
  }, [pushToHistory]);

  // Handler: Update Component Data
  const handleUpdateComponent = useCallback(
    (updated: CircuitComponentInstance) => {
      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        components: prev.components.map((c) => (c.id === updated.id ? updated : c)),
      }));
    },
    [project, pushToHistory]
  );

  // Handler: Rotate Component(s) 90°
  const handleRotateComponent = useCallback(
    (targetId?: string) => {
      pushToHistory(project);
      const idsToRotate = targetId ? [targetId] : selectedComponentIds;
      if (idsToRotate.length === 0) return;

      setProject((prev) => ({
        ...prev,
        components: prev.components.map((c) => {
          if (!idsToRotate.includes(c.id)) return c;
          const nextRot = ((c.rotation + 90) % 360) as 0 | 90 | 180 | 270;
          return { ...c, rotation: nextRot };
        }),
      }));
    },
    [project, pushToHistory, selectedComponentIds]
  );

  // Handler: Duplicate Component(s)
  const handleDuplicateComponent = useCallback(
    (targetId?: string) => {
      const idsToDup = targetId ? [targetId] : selectedComponentIds;
      if (idsToDup.length === 0) return;

      pushToHistory(project);
      const newDuplicates: CircuitComponentInstance[] = [];

      idsToDup.forEach((id) => {
        const target = project.components.find((c) => c.id === id);
        if (!target) return;
        newDuplicates.push({
          ...target,
          id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          label: `${target.label}_Kopi`,
          x: target.x + 30,
          y: target.y + 30,
        });
      });

      setProject((prev) => ({
        ...prev,
        components: [...prev.components, ...newDuplicates],
      }));
      setSelectedComponentIds(newDuplicates.map((d) => d.id));
    },
    [project, pushToHistory, selectedComponentIds]
  );

  // Handler: Delete Component(s)
  const handleDeleteComponent = useCallback(
    (targetId?: string) => {
      const idsToDelete = targetId ? [targetId] : selectedComponentIds;
      if (idsToDelete.length === 0) return;

      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        components: prev.components.filter((c) => !idsToDelete.includes(c.id)),
        wires: prev.wires.filter(
          (w) =>
            !idsToDelete.includes(w.fromComponentId) &&
            !idsToDelete.includes(w.toComponentId)
        ),
      }));
      setSelectedComponentIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    },
    [project, pushToHistory, selectedComponentIds]
  );

  // Handler: Add Wire
  const handleAddWire = useCallback(
    (wire: WireConnection) => {
      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        wires: [...prev.wires, wire],
      }));
      setSelectedWireIds([wire.id]);
    },
    [project, pushToHistory]
  );

  // Handler: Delete Wire(s)
  const handleDeleteWire = useCallback(
    (targetWireId?: string) => {
      const wireIdsToDelete = targetWireId ? [targetWireId] : selectedWireIds;
      if (wireIdsToDelete.length === 0) return;

      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        wires: prev.wires.filter((w) => !wireIdsToDelete.includes(w.id)),
      }));
      setSelectedWireIds((prev) => prev.filter((id) => !wireIdsToDelete.includes(id)));
    },
    [project, pushToHistory, selectedWireIds]
  );

  // Handler: Delete Selected (Bulk components and wires)
  const handleDeleteSelected = useCallback(() => {
    if (selectedComponentIds.length > 0 || selectedWireIds.length > 0) {
      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        components: prev.components.filter((c) => !selectedComponentIds.includes(c.id)),
        wires: prev.wires.filter(
          (w) =>
            !selectedWireIds.includes(w.id) &&
            !selectedComponentIds.includes(w.fromComponentId) &&
            !selectedComponentIds.includes(w.toComponentId)
        ),
      }));
      setSelectedComponentIds([]);
      setSelectedWireIds([]);
    }
  }, [project, pushToHistory, selectedComponentIds, selectedWireIds]);

  // Alignment Controls Implementation
  const handleAlignComponents = useCallback(
    (type: AlignmentType) => {
      if (selectedComponentIds.length < 2) return;
      pushToHistory(project);

      const comps = project.components.filter((c) => selectedComponentIds.includes(c.id));
      if (comps.length < 2) return;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      comps.forEach((comp) => {
        const def = componentDefsMap.get(comp.typeId);
        const w = def?.width || 60;
        const h = def?.height || 60;
        minX = Math.min(minX, comp.x);
        maxX = Math.max(maxX, comp.x + w);
        minY = Math.min(minY, comp.y);
        maxY = Math.max(maxY, comp.y + h);
      });

      const centerH = (minX + maxX) / 2;
      const centerV = (minY + maxY) / 2;

      setProject((prev) => ({
        ...prev,
        components: prev.components.map((comp) => {
          if (!selectedComponentIds.includes(comp.id)) return comp;
          const def = componentDefsMap.get(comp.typeId);
          const w = def?.width || 60;
          const h = def?.height || 60;

          let nextX = comp.x;
          let nextY = comp.y;

          switch (type) {
            case 'left':
              nextX = minX;
              break;
            case 'center-h':
              nextX = Math.round(centerH - w / 2);
              break;
            case 'right':
              nextX = maxX - w;
              break;
            case 'top':
              nextY = minY;
              break;
            case 'center-v':
              nextY = Math.round(centerV - h / 2);
              break;
            case 'bottom':
              nextY = maxY - h;
              break;
          }

          if (snapToGrid) {
            nextX = Math.round(nextX / 10) * 10;
            nextY = Math.round(nextY / 10) * 10;
          }

          return { ...comp, x: nextX, y: nextY };
        }),
      }));
    },
    [project, selectedComponentIds, componentDefsMap, pushToHistory, snapToGrid]
  );

  // Distribution Controls Implementation
  const handleDistributeComponents = useCallback(
    (type: DistributionType) => {
      if (selectedComponentIds.length < 3) return;
      pushToHistory(project);

      const comps = project.components.filter((c) => selectedComponentIds.includes(c.id));
      if (comps.length < 3) return;

      if (type === 'horizontal') {
        const sorted = [...comps].sort((a, b) => a.x - b.x);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const lastDef = componentDefsMap.get(last.typeId);
        const lastW = lastDef?.width || 60;

        const totalSpan = last.x + lastW - first.x;
        const sumCompWidths = sorted.reduce((sum, c) => {
          const def = componentDefsMap.get(c.typeId);
          return sum + (def?.width || 60);
        }, 0);

        const totalGap = totalSpan - sumCompWidths;
        const gap = totalGap / (sorted.length - 1);

        let curX = first.x;
        const newPos = new Map<string, number>();

        sorted.forEach((comp) => {
          const def = componentDefsMap.get(comp.typeId);
          const w = def?.width || 60;
          newPos.set(comp.id, Math.round(curX));
          curX += w + gap;
        });

        setProject((prev) => ({
          ...prev,
          components: prev.components.map((c) =>
            newPos.has(c.id) ? { ...c, x: newPos.get(c.id)! } : c
          ),
        }));
      } else {
        const sorted = [...comps].sort((a, b) => a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const lastDef = componentDefsMap.get(last.typeId);
        const lastH = lastDef?.height || 60;

        const totalSpan = last.y + lastH - first.y;
        const sumCompHeights = sorted.reduce((sum, c) => {
          const def = componentDefsMap.get(c.typeId);
          return sum + (def?.height || 60);
        }, 0);

        const totalGap = totalSpan - sumCompHeights;
        const gap = totalGap / (sorted.length - 1);

        let curY = first.y;
        const newPos = new Map<string, number>();

        sorted.forEach((comp) => {
          const def = componentDefsMap.get(comp.typeId);
          const h = def?.height || 60;
          newPos.set(comp.id, Math.round(curY));
          curY += h + gap;
        });

        setProject((prev) => ({
          ...prev,
          components: prev.components.map((c) =>
            newPos.has(c.id) ? { ...c, y: newPos.get(c.id)! } : c
          ),
        }));
      }
    },
    [project, selectedComponentIds, componentDefsMap, pushToHistory]
  );

  // Handler: Autolayout feature (Grid-based automatic organization of all components)
  const handleAutoLayout = useCallback(() => {
    if (project.components.length === 0) return;
    pushToHistory(project);

    const reorganized = autoLayoutComponents(project.components, componentDefsMap, {
      startX: 100,
      startY: 80,
      gapX: 45,
      gapY: 55,
      maxWidth: 1100,
      snapGrid: snapToGrid ? 10 : 1,
    });

    setProject((prev) => ({
      ...prev,
      components: reorganized,
    }));

    setExportNotification('Kretsen ble automatisk organisert i et ryddig rutenett!');
    setTimeout(() => setExportNotification(null), 3000);
  }, [project, componentDefsMap, pushToHistory, snapToGrid]);

  // Handler: Auto-route Wires
  const handleAutoRouteWires = useCallback(() => {
    if (!project.wires || project.wires.length === 0) {
      setExportNotification('Ingen ledninger å rute.');
      setTimeout(() => setExportNotification(null), 2500);
      return;
    }

    pushToHistory(project);
    const result = autoRouteCircuitWires(
      project.wires,
      project.components,
      componentDefsMap,
      {
        mode: 'direct',
        selectedWireIds: selectedWireIds.length > 0 ? selectedWireIds : undefined,
      }
    );

    setProject((prev) => ({
      ...prev,
      wires: result.updatedWires,
    }));

    setExportNotification(
      `Auto-rutet ${result.routedCount} ${
        result.routedCount === 1 ? 'ledning' : 'ledninger'
      } med direkte, ryddige stier!`
    );
    setTimeout(() => setExportNotification(null), 3000);
  }, [project, componentDefsMap, selectedWireIds, pushToHistory]);

  // Handler: Interactive Component Click in Simulation
  const handleToggleComponentState = useCallback(
    (compId: string) => {
      const comp = project.components.find((c) => c.id === compId);
      if (!comp) return;

      if (comp.typeId === 'pushbutton') {
        setButtonPressedStates((prev) => ({
          ...prev,
          [compId]: !prev[compId],
        }));
      } else if (comp.typeId === 'slide_switch') {
        const cur = comp.properties.activePosition || 'A';
        const next = cur === 'A' ? 'B' : 'A';
        handleUpdateComponent({
          ...comp,
          properties: { ...comp.properties, activePosition: next },
        });
      }
    },
    [project.components, handleUpdateComponent]
  );

  // Handler: Save Custom Component from Editor Modal
  const handleSaveCustomComponent = (comp: ComponentDefinition) => {
    const updatedList = saveStoredCustomComponent(comp);
    setCustomComponents(updatedList);
  };

  // Handler: Update External Libraries
  const handleUpdateLibraries = (updated: ExternalLibrary[]) => {
    setLibraries(updated);
    saveStoredLibraries(updated);
  };

  // Handler: Add Sticky Note
  const handleAddStickyNote = () => {
    pushToHistory(project);
    const newNote: StickyNote = {
      id: `note_${Date.now()}`,
      x: 380,
      y: 120,
      width: 200,
      height: 80,
      text: 'Ny notat / påminnelse om kretsen...',
      color: '#fef08a',
    };
    setProject((prev) => ({
      ...prev,
      notes: [...(prev.notes || []), newNote],
    }));
  };

  const handleDeleteNote = (noteId: string) => {
    pushToHistory(project);
    setProject((prev) => ({
      ...prev,
      notes: (prev.notes || []).filter((n) => n.id !== noteId),
    }));
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y, Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      else if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Delete selected
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentIds.length > 0 || selectedWireIds.length > 0) {
          handleDeleteSelected();
        }
      }
      // Rotate selected component(s) (R) or Auto-route wires when nothing selected
      else if (e.key === 'r' || e.key === 'R') {
        if (selectedComponentIds.length > 0) {
          handleRotateComponent();
        } else {
          handleAutoRouteWires();
        }
      }
      // Toggle Snap-to-Grid (G)
      else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setSnapToGrid((prev) => !prev);
      }
      // Add new Sticky Note (N)
      else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleAddStickyNote();
      }
      // Toggle / Open ERC validation drawer (E)
      else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsERCWarningsOpen((prev) => !prev);
      }
      // Toggle Left Sidebar ([)
      else if (e.key === '[') {
        e.preventDefault();
        setIsLeftSidebarOpen((prev) => !prev);
      }
      // Toggle Right Sidebar (])
      else if (e.key === ']') {
        e.preventDefault();
        setIsRightSidebarOpen((prev) => !prev);
      }
      // Toggle Fullscreen Workspace (backslash \)
      else if (e.key === '\\') {
        e.preventDefault();
        handleToggleFullScreenWorkspace();
      }
      // Autolayout: 'L' or 'l'
      else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleAutoLayout();
      }
      // Zoom In (+ or =)
      else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      }
      // Zoom Out (-)
      else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleRotateComponent,
    handleAutoRouteWires,
    handleAddStickyNote,
    handleAutoLayout,
    handleToggleFullScreenWorkspace,
    selectedComponentIds,
    selectedWireIds,
    handleZoomIn,
    handleZoomOut,
  ]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 font-sans touch-none select-none">
      {/* 1. Header Navigation Bar */}
      <HeaderBar
        projectName={project.name}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating((prev) => !prev)}
        simulationSpeed={simulationSpeed}
        onChangeSimulationSpeed={setSimulationSpeed}
        warnings={simulationResult.warnings}
        onOpenERCWarnings={() => setIsERCWarningsOpen(true)}
        onOpenBOM={() => setIsBOMOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onAddStickyNote={handleAddStickyNote}
        onAutoLayout={handleAutoLayout}
        onAutoRouteWires={handleAutoRouteWires}
        snapToGrid={snapToGrid}
        onToggleSnapToGrid={() => setSnapToGrid((prev) => !prev)}
        activeWireColor={activeWireColor}
        onChangeWireColor={setActiveWireColor}
        onExportJson={handleExportProjectJson}
        canvasTheme={canvasTheme}
        onToggleCanvasTheme={handleToggleCanvasTheme}
        lastSavedTime={lastSavedTime}
        isSaving={isSaving}
        onManualSave={handleManualSave}
        onOpenLayers={() => setIsLayersOpen(true)}
        onOpenPDFExport={() => setIsPDFExportOpen(true)}
        onOpenImageExport={() => setIsImageExportOpen(true)}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
        isFullScreenWorkspace={isFullScreenWorkspace}
        onToggleFullScreenWorkspace={handleToggleFullScreenWorkspace}
      />

      {/* Floating Export Notification Toast */}
      {exportNotification && (
        <div className="absolute top-16 right-4 z-50 bg-emerald-900/90 text-emerald-100 border border-emerald-600 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium">{exportNotification}</span>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Component Catalog Sidebar (Responsive: drawer on Android / mobile, static on desktop) */}
        {isLeftSidebarOpen && (
          <>
            {/* Mobile / Android Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsLeftSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 md:relative md:z-auto h-full shadow-2xl md:shadow-none animate-in slide-in-from-left duration-200">
              <ComponentSidebar
                availableComponents={availableComponents}
                onAddComponent={(typeId) => handleAddComponent(typeId)}
                onOpenComponentEditor={() => setIsComponentEditorOpen(true)}
                onOpenLibraryManager={() => setIsLibraryManagerOpen(true)}
                onClose={() => setIsLeftSidebarOpen(false)}
              />
            </div>
          </>
        )}

        {/* Collapsed Left Sidebar Toggle Tab */}
        {!isLeftSidebarOpen && (
          <button
            onClick={() => setIsLeftSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center py-3 px-2 bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-white rounded-r-xl border-y border-r border-slate-700/80 shadow-2xl transition group cursor-pointer"
            title="Åpne Komponentbibliotek (Hurtigtast: [ )"
          >
            <PanelLeft className="w-4 h-4 text-blue-400 group-hover:scale-110 transition mb-1.5" />
            <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] uppercase font-bold tracking-wider text-slate-300 group-hover:text-white">
              Bibliotek
            </span>
          </button>
        )}

        {/* Center: Interactive Circuit Canvas & Floating Canvas Toolbar */}
        <main className="flex-1 h-full relative overflow-hidden">
          {/* Canvas Toolbar (Undo, Redo, Zoom In, Zoom Out, Delete, Guide, Fullscreen, Theme, Export, Layers, PDF, Bilde) */}
          <CanvasToolbar
            canUndo={historyPast.length > 0}
            canRedo={historyFuture.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            hasSelection={selectedComponentIds.length > 0 || selectedWireIds.length > 0}
            onDeleteSelected={handleDeleteSelected}
            onAutoLayout={handleAutoLayout}
            onAutoRouteWires={handleAutoRouteWires}
            isLeftSidebarOpen={isLeftSidebarOpen}
            onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
            isRightSidebarOpen={isRightSidebarOpen}
            onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
            isFullScreenWorkspace={isFullScreenWorkspace}
            onToggleFullScreenWorkspace={handleToggleFullScreenWorkspace}
            onOpenGuide={() => setIsGuideOpen(true)}
            canvasTheme={canvasTheme}
            onToggleCanvasTheme={handleToggleCanvasTheme}
            onExportJson={handleExportProjectJson}
            onOpenLayers={() => setIsLayersOpen(true)}
            onOpenPDFExport={() => setIsPDFExportOpen(true)}
            onOpenImageExport={() => setIsImageExportOpen(true)}
          />

          <CircuitCanvas
            components={activeComponentsWithSim}
            wires={project.wires}
            notes={project.notes || []}
            layers={projectLayers}
            componentDefs={componentDefsMap}
            selectedComponentIds={selectedComponentIds}
            selectedWireIds={selectedWireIds}
            activeWireColor={activeWireColor}
            isSimulating={isSimulating}
            simulationSpeed={simulationSpeed}
            activeWireIds={simulationResult.energizedWireIds}
            snapToGrid={snapToGrid}
            canvasTheme={canvasTheme}
            zoom={zoom}
            pan={pan}
            onZoomChange={setZoom}
            onPanChange={setPan}
            onComponentDragEnd={handleComponentDragEnd}
            onSelectComponent={(id) => {
              setSelectedComponentIds(id ? [id] : []);
              if (id) setSelectedWireIds([]);
            }}
            onSelectComponents={(ids) => {
              setSelectedComponentIds(ids);
            }}
            onSelectWire={(id) => {
              setSelectedWireIds(id ? [id] : []);
              if (id) setSelectedComponentIds([]);
            }}
            onSelectWires={(ids) => {
              setSelectedWireIds(ids);
            }}
            onUpdateComponentPosition={handleUpdateComponentPosition}
            onAddWire={handleAddWire}
            onDeleteWire={handleDeleteWire}
            onToggleComponentState={handleToggleComponentState}
            onDropNewComponent={(typeId, x, y) => handleAddComponent(typeId, undefined, x, y)}
            onDeleteNote={handleDeleteNote}
          />
        </main>

        {/* Right: Component Inspector & Alignment Controls (Responsive: drawer on Android / mobile, static on desktop) */}
        {isRightSidebarOpen && (
          <>
            {/* Mobile / Android Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsRightSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-50 md:relative md:z-auto h-full shadow-2xl md:shadow-none animate-in slide-in-from-right duration-200">
              <ComponentInspector
                selectedComponent={selectedComponent}
                selectedComponents={selectedComponents}
                componentDef={selectedComponentDef}
                componentDefs={componentDefsMap}
                layers={projectLayers}
                isSimulating={isSimulating}
                onUpdateComponent={handleUpdateComponent}
                onRotateComponent={(id) => handleRotateComponent(id)}
                onDuplicateComponent={(id) => handleDuplicateComponent(id)}
                onDeleteComponent={(id) => handleDeleteComponent(id)}
                onAlignComponents={handleAlignComponents}
                onDistributeComponents={handleDistributeComponents}
                onSelectComponentById={(id) => {
                  setSelectedComponentIds([id]);
                  setSelectedWireIds([]);
                }}
                onClose={() => setIsRightSidebarOpen(false)}
              />
            </div>
          </>
        )}

        {/* Collapsed Right Sidebar Toggle Tab */}
        {!isRightSidebarOpen && (
          <button
            onClick={() => setIsRightSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center py-3 px-2 bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-white rounded-l-xl border-y border-l border-slate-700/80 shadow-2xl transition group cursor-pointer"
            title="Åpne Egenskaper (Hurtigtast: ] )"
          >
            <PanelRight className="w-4 h-4 text-blue-400 group-hover:scale-110 transition mb-1.5" />
            <span className="[writing-mode:vertical-rl] text-[10px] uppercase font-bold tracking-wider text-slate-300 group-hover:text-white">
              Egenskaper
            </span>
          </button>
        )}

        {/* Koblingsguide Drawer */}
        <CircuitGuidePanel
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          selectedComponent={selectedComponent}
          selectedComponentDef={selectedComponentDef}
          allComponents={project.components}
          componentDefs={componentDefsMap}
          onAddComponent={(typeId, customProps) => handleAddComponent(typeId, customProps)}
        />
      </div>

      {/* 3. Modals */}
      <ComponentEditorModal
        isOpen={isComponentEditorOpen}
        onClose={() => setIsComponentEditorOpen(false)}
        onSaveComponent={handleSaveCustomComponent}
      />

      <LibraryManagerModal
        isOpen={isLibraryManagerOpen}
        onClose={() => setIsLibraryManagerOpen(false)}
        libraries={libraries}
        onUpdateLibraries={handleUpdateLibraries}
      />

      <BOMModal
        isOpen={isBOMOpen}
        onClose={() => setIsBOMOpen(false)}
        components={project.components}
        componentDefs={componentDefsMap}
      />

      <ERCWarningsDrawer
        isOpen={isERCWarningsOpen}
        onClose={() => setIsERCWarningsOpen(false)}
        warnings={simulationResult.warnings}
        onSelectComponent={(compId) => setSelectedComponentIds([compId])}
      />

      <ProjectManagerModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        currentProject={project}
        onLoadProject={(loaded) => {
          pushToHistory(project);
          setProject(loaded);
          setSelectedComponentIds([]);
          setSelectedWireIds([]);
        }}
        onNewEmptyProject={() => {
          pushToHistory(project);
          setProject({
            id: `proj_${Date.now()}`,
            name: 'Ny Krets',
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            components: [
              {
                id: 'bb_empty',
                typeId: 'breadboard_half',
                label: 'Koblingsbrett',
                x: 350,
                y: 180,
                rotation: 0,
                properties: {},
              },
            ],
            wires: [],
            notes: [],
          });
          setSelectedComponentIds([]);
          setSelectedWireIds([]);
        }}
      />

      {/* Layer Management Drawer */}
      <LayerManagerDrawer
        isOpen={isLayersOpen}
        onClose={() => setIsLayersOpen(false)}
        layers={projectLayers}
        project={project}
        onUpdateLayers={handleUpdateLayers}
        onMoveComponentsToLayer={handleMoveComponentsToLayer}
      />

      {/* PDF Export Modal */}
      <PDFExportModal
        isOpen={isPDFExportOpen}
        onClose={() => setIsPDFExportOpen(false)}
        project={project}
        componentDefs={componentDefsMap}
      />

      {/* High-Res Image (PNG / SVG) Export Modal */}
      <ImageExportModal
        isOpen={isImageExportOpen}
        onClose={() => setIsImageExportOpen(false)}
        project={project}
        componentDefs={componentDefsMap}
      />
    </div>
  );
}
