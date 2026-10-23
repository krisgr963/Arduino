import React, { useState } from 'react';
import { ComponentCategory, ComponentDefinition } from '../../types/circuit';
import {
  Search,
  Plus,
  Package,
  Cpu,
  Layers,
  Lightbulb,
  Radio,
  Sliders,
  Battery,
  Activity,
  Box,
} from 'lucide-react';

interface ComponentSidebarProps {
  availableComponents: ComponentDefinition[];
  onAddComponent: (typeId: string) => void;
  onOpenComponentEditor: () => void;
  onOpenLibraryManager: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Layers className="w-4 h-4" />,
  Microcontrollers: <Cpu className="w-4 h-4" />,
  Prototyping: <Box className="w-4 h-4" />,
  Output: <Lightbulb className="w-4 h-4" />,
  Input: <Sliders className="w-4 h-4" />,
  Passive: <Radio className="w-4 h-4" />,
  Power: <Battery className="w-4 h-4" />,
  Sensors: <Activity className="w-4 h-4" />,
  Custom: <Package className="w-4 h-4" />,
};

const CATEGORY_NAMES: Record<string, string> = {
  All: 'Alle',
  Microcontrollers: 'Mikrokontrollere',
  Prototyping: 'Koblingsbrett',
  Output: 'Utganger / LED',
  Input: 'Brytere & Knapper',
  Passive: 'Motstander & Passive',
  Power: 'Strømforsyning',
  Sensors: 'Sensorer',
  Custom: 'Mine Egendefinerte',
};

export const ComponentSidebar: React.FC<ComponentSidebarProps> = ({
  availableComponents,
  onAddComponent,
  onOpenComponentEditor,
  onOpenLibraryManager,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredComponents = availableComponents.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || comp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDragStart = (e: React.DragEvent, typeId: string) => {
    e.dataTransfer.setData('application/circulab-component', typeId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-72 h-full bg-slate-900 border-r border-slate-800 flex flex-col text-slate-200 text-xs select-none">
      {/* Header and Quick Buttons */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/70">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-xs uppercase tracking-wider">
            Komponentbibliotek
          </span>
          <button
            onClick={onOpenLibraryManager}
            className="flex items-center space-x-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
            title="Administrer eksterne biblioteker"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Biblioteker</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk komponenter (f.eks. Uno, LED, ESP32)..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Create Custom Component Button */}
        <button
          onClick={onOpenComponentEditor}
          className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Bygg Ny Komponent (Editor)</span>
        </button>
      </div>

      {/* Horizontal Category Pill Tabs */}
      <div className="flex items-center space-x-1 px-3 py-2 border-b border-slate-800 overflow-x-auto no-scrollbar">
        {['All', 'Microcontrollers', 'Prototyping', 'Output', 'Input', 'Passive', 'Power', 'Sensors', 'Custom'].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition flex items-center space-x-1 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{CATEGORY_NAMES[cat]}</span>
            </button>
          )
        )}
      </div>

      {/* Component Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Ingen komponenter funnet for søket &quot;{searchQuery}&quot;.
          </div>
        ) : (
          filteredComponents.map((comp) => (
            <div
              key={comp.typeId}
              draggable
              onDragStart={(e) => handleDragStart(e, comp.typeId)}
              onClick={() => onAddComponent(comp.typeId)}
              className="p-2.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-blue-500 cursor-grab active:cursor-grabbing transition group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white text-xs group-hover:text-blue-400 transition">
                    {comp.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                    {comp.description}
                  </p>
                </div>
                {comp.isCustom && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Egen
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-700/40">
                <span className="font-mono">{comp.pins.length} pinner</span>
                <span className="text-blue-400 group-hover:underline">
                  Dra eller klikk for å legge til +
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
