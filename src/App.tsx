import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  CircuitComponentInstance,
  CircuitProject,
  ComponentDefinition,
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

  // 3. Selection & Canvas Settings
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
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
  const [buttonPressedStates, setButtonPressedStates] = useState<Record<string, boolean>>({});

  // 7. Modals State
  const [isComponentEditorOpen, setIsComponentEditorOpen] = useState(false);
  const [isLibraryManagerOpen, setIsLibraryManagerOpen] = useState(false);
  const [isBOMOpen, setIsBOMOpen] = useState(false);
  const [isERCWarningsOpen, setIsERCWarningsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  // 8. Run Circuit Analysis & Electrical Rule Check (ERC)
  const simulationResult = useMemo(() => {
    return analyzeCircuit(
      project.components,
      project.wires,
      componentDefsMap,
      isSimulating ? buttonPressedStates : {}
    );
  }, [project.components, project.wires, componentDefsMap, isSimulating, buttonPressedStates]);

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

  // Selected Component & Definition
  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) return null;
    return activeComponentsWithSim.find((c) => c.id === selectedComponentId) || null;
  }, [selectedComponentId, activeComponentsWithSim]);

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
      setSelectedComponentId(newComp.id);
      setSelectedWireId(null);

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

  // Handler: Rotate Component 90°
  const handleRotateComponent = useCallback(
    (id: string) => {
      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        components: prev.components.map((c) => {
          if (c.id !== id) return c;
          const nextRot = ((c.rotation + 90) % 360) as 0 | 90 | 180 | 270;
          return { ...c, rotation: nextRot };
        }),
      }));
    },
    [project, pushToHistory]
  );

  // Handler: Duplicate Component
  const handleDuplicateComponent = useCallback(
    (id: string) => {
      const target = project.components.find((c) => c.id === id);
      if (!target) return;

      pushToHistory(project);
      const dup: CircuitComponentInstance = {
        ...target,
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        label: `${target.label}_Kopi`,
        x: target.x + 30,
        y: target.y + 30,
      };

      setProject((prev) => ({
        ...prev,
        components: [...prev.components, dup],
      }));
      setSelectedComponentId(dup.id);
    },
    [project, pushToHistory]
  );

  // Handler: Delete Component
  const handleDeleteComponent = useCallback(
    (id: string) => {
      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        components: prev.components.filter((c) => c.id !== id),
        wires: prev.wires.filter(
          (w) => w.fromComponentId !== id && w.toComponentId !== id
        ),
      }));
      if (selectedComponentId === id) setSelectedComponentId(null);
    },
    [project, pushToHistory, selectedComponentId]
  );

  // Handler: Add Wire
  const handleAddWire = useCallback(
    (wire: WireConnection) => {
      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        wires: [...prev.wires, wire],
      }));
      setSelectedWireId(wire.id);
    },
    [project, pushToHistory]
  );

  // Handler: Delete Wire
  const handleDeleteWire = useCallback(
    (wireId: string) => {
      pushToHistory(project);
      setProject((prev) => ({
        ...prev,
        wires: prev.wires.filter((w) => w.id !== wireId),
      }));
      if (selectedWireId === wireId) setSelectedWireId(null);
    },
    [project, pushToHistory, selectedWireId]
  );

  // Handler: Delete Selected (Component or Wire)
  const handleDeleteSelected = useCallback(() => {
    if (selectedComponentId) {
      handleDeleteComponent(selectedComponentId);
    } else if (selectedWireId) {
      handleDeleteWire(selectedWireId);
    }
  }, [selectedComponentId, selectedWireId, handleDeleteComponent, handleDeleteWire]);

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
        if (selectedComponentId || selectedWireId) {
          handleDeleteSelected();
        }
      }
      // Rotate selected component (R)
      else if (e.key === 'r' || e.key === 'R') {
        if (selectedComponentId) {
          handleRotateComponent(selectedComponentId);
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
    handleAddStickyNote,
    selectedComponentId,
    selectedWireId,
    handleZoomIn,
    handleZoomOut,
  ]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Header Navigation Bar */}
      <HeaderBar
        projectName={project.name}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating((prev) => !prev)}
        warnings={simulationResult.warnings}
        onOpenERCWarnings={() => setIsERCWarningsOpen(true)}
        onOpenBOM={() => setIsBOMOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onAddStickyNote={handleAddStickyNote}
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
        {/* Left: Component Catalog Sidebar (Collapsible) */}
        {isLeftSidebarOpen && (
          <ComponentSidebar
            availableComponents={availableComponents}
            onAddComponent={(typeId) => handleAddComponent(typeId)}
            onOpenComponentEditor={() => setIsComponentEditorOpen(true)}
            onOpenLibraryManager={() => setIsLibraryManagerOpen(true)}
          />
        )}

        {/* Collapsed Left Sidebar Toggle Tab */}
        {!isLeftSidebarOpen && (
          <button
            onClick={() => setIsLeftSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-r-xl border-y border-r border-slate-700/80 shadow-xl transition flex items-center space-x-1"
            title="Åpne Komponentbibliotek"
          >
            <PanelLeft className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] uppercase font-bold writing-mode-vertical">
              Bibliotek
            </span>
          </button>
        )}

        {/* Center: Interactive Circuit Canvas & Floating Canvas Toolbar */}
        <main className="flex-1 h-full relative overflow-hidden">
          {/* Canvas Toolbar (Undo, Redo, Zoom In, Zoom Out, Delete, Guide, Fullscreen, Theme, Export) */}
          <CanvasToolbar
            canUndo={historyPast.length > 0}
            canRedo={historyFuture.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            hasSelection={Boolean(selectedComponentId || selectedWireId)}
            onDeleteSelected={handleDeleteSelected}
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
          />

          <CircuitCanvas
            components={activeComponentsWithSim}
            wires={project.wires}
            notes={project.notes || []}
            componentDefs={componentDefsMap}
            selectedComponentId={selectedComponentId}
            selectedWireId={selectedWireId}
            activeWireColor={activeWireColor}
            isSimulating={isSimulating}
            activeWireIds={simulationResult.energizedWireIds}
            snapToGrid={snapToGrid}
            canvasTheme={canvasTheme}
            zoom={zoom}
            pan={pan}
            onZoomChange={setZoom}
            onPanChange={setPan}
            onComponentDragEnd={handleComponentDragEnd}
            onSelectComponent={(id) => {
              setSelectedComponentId(id);
              if (id) setSelectedWireId(null);
            }}
            onSelectWire={(id) => {
              setSelectedWireId(id);
              if (id) setSelectedComponentId(null);
            }}
            onUpdateComponentPosition={handleUpdateComponentPosition}
            onAddWire={handleAddWire}
            onDeleteWire={handleDeleteWire}
            onToggleComponentState={handleToggleComponentState}
            onDropNewComponent={(typeId, x, y) => handleAddComponent(typeId, undefined, x, y)}
            onDeleteNote={handleDeleteNote}
          />
        </main>

        {/* Right: Component Inspector & Properties (Collapsible) */}
        {isRightSidebarOpen && (
          <ComponentInspector
            selectedComponent={selectedComponent}
            componentDef={selectedComponentDef}
            isSimulating={isSimulating}
            onUpdateComponent={handleUpdateComponent}
            onRotateComponent={handleRotateComponent}
            onDuplicateComponent={handleDuplicateComponent}
            onDeleteComponent={handleDeleteComponent}
          />
        )}

        {/* Collapsed Right Sidebar Toggle Tab */}
        {!isRightSidebarOpen && (
          <button
            onClick={() => setIsRightSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-l-xl border-y border-l border-slate-700/80 shadow-xl transition flex items-center space-x-1"
            title="Åpne Egenskaper"
          >
            <span className="text-[10px] uppercase font-bold writing-mode-vertical">
              Egenskaper
            </span>
            <PanelRight className="w-4 h-4 text-blue-400" />
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
        onSelectComponent={(compId) => setSelectedComponentId(compId)}
      />

      <ProjectManagerModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        currentProject={project}
        onLoadProject={(loaded) => {
          pushToHistory(project);
          setProject(loaded);
          setSelectedComponentId(null);
          setSelectedWireId(null);
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
          setSelectedComponentId(null);
          setSelectedWireId(null);
        }}
      />
    </div>
  );
}
