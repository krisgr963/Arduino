import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ComponentDefinition } from '../../types/circuit';
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
  X,
  Tag,
  Sparkles,
  PanelLeftClose,
  Filter,
} from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

interface ComponentSidebarProps {
  availableComponents: ComponentDefinition[];
  onAddComponent: (typeId: string) => void;
  onOpenComponentEditor: () => void;
  onOpenLibraryManager: () => void;
  onClose?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Layers className="w-3.5 h-3.5" />,
  Microcontrollers: <Cpu className="w-3.5 h-3.5" />,
  Prototyping: <Box className="w-3.5 h-3.5" />,
  Output: <Lightbulb className="w-3.5 h-3.5" />,
  Input: <Sliders className="w-3.5 h-3.5" />,
  Passive: <Radio className="w-3.5 h-3.5" />,
  Power: <Battery className="w-3.5 h-3.5" />,
  Sensors: <Activity className="w-3.5 h-3.5" />,
  Custom: <Package className="w-3.5 h-3.5" />,
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
  Custom: 'Egendefinerte',
};

const POPULAR_SEARCH_PRESETS = [
  'Arduino',
  'LED',
  'Koblingsbrett',
  'Motstand',
  'ESP32',
  'Sensor',
  'Potensiometer',
];

export const ComponentSidebar: React.FC<ComponentSidebarProps> = ({
  availableComponents,
  onAddComponent,
  onOpenComponentEditor,
  onOpenLibraryManager,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to immediately focus the search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: availableComponents.length };
    availableComponents.forEach((comp) => {
      counts[comp.category] = (counts[comp.category] || 0) + 1;
    });
    return counts;
  }, [availableComponents]);

  // Extract all unique tags across all available components
  const allUniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    availableComponents.forEach((comp) => {
      if (comp.tags && Array.isArray(comp.tags)) {
        comp.tags.forEach((t) => {
          if (t && t.trim()) tagSet.add(t.trim().toLowerCase());
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [availableComponents]);

  // Filter components based on search query, category, and selected tag
  const filteredComponents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase().replace(/^#+/, '');

    return availableComponents.filter((comp) => {
      // 1. Category filter
      const matchesCategory =
        selectedCategory === 'All' || comp.category === selectedCategory;

      if (!matchesCategory) return false;

      // 2. Selected Tag filter
      if (selectedTag) {
        const hasTag = comp.tags?.some(
          (t) => t.toLowerCase() === selectedTag.toLowerCase()
        );
        if (!hasTag) return false;
      }

      // 3. Search query filter (matches name, description, category, or any tag)
      if (!query) return true;

      const nameMatch = comp.name.toLowerCase().includes(query);
      const descMatch = comp.description.toLowerCase().includes(query);
      const catMatch = comp.category.toLowerCase().includes(query);
      const norwegianCatMatch =
        CATEGORY_NAMES[comp.category]?.toLowerCase().includes(query) ?? false;
      const tagMatch =
        comp.tags?.some((t) => t.toLowerCase().includes(query)) ?? false;

      return nameMatch || descMatch || catMatch || norwegianCatMatch || tagMatch;
    });
  }, [availableComponents, searchQuery, selectedCategory, selectedTag]);

  // Drag start handler
  const handleDragStart = (e: React.DragEvent, typeId: string) => {
    e.dataTransfer.setData('application/circulab-component', typeId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSelectTag = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTag(null);
    searchInputRef.current?.focus();
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'All' ||
    selectedTag !== null;

  // Text highlighting helper
  const renderHighlighted = (text: string, query: string) => {
    const cleanQuery = query.trim().toLowerCase().replace(/^#+/, '');
    if (!cleanQuery) return text;
    const parts = text.split(new RegExp(`(${cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === cleanQuery ? (
            <mark key={i} className="bg-blue-500/35 text-blue-200 rounded px-0.5 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col text-slate-200 text-xs select-none shadow-xl">
      {/* 1. Header & Dedicated Search Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2.5 bg-slate-950/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              Komponenter
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 font-semibold">
              {filteredComponents.length}/{availableComponents.length}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Tooltip
              title="Bibliotek & Pakker"
              description="Administrer eksterne modul- og sensorpakker"
              position="bottom"
            >
              <button
                onClick={onOpenLibraryManager}
                className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white rounded-md border border-slate-700/60 transition"
                aria-label="Administrer pakker"
              >
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <span>Pakker</span>
              </button>
            </Tooltip>

            <Tooltip
              title="Ny Komponent"
              description="Bygg en egendefinert mikrokontroller eller IC"
              position="bottom"
            >
              <button
                onClick={onOpenComponentEditor}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-[11px] text-white rounded-md font-semibold shadow transition"
                aria-label="Opprett ny komponent"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ny</span>
              </button>
            </Tooltip>

            {onClose && (
              <Tooltip
                title="Skjul bibliotek"
                shortcut="["
                description="Lukk sidepanelet for mer plass"
                position="bottom"
              >
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"
                  aria-label="Skjul bibliotek-meny"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Dedicated Search Input with Quick Focus Shortcut '/' */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk navn eller kategori... (/)"
            className="w-full bg-slate-900/95 border border-slate-700/80 rounded-lg pl-8.5 pr-14 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
          />
          {searchQuery ? (
            <Tooltip title="Tøm søk" description="Fjern søketeksten" position="left">
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                aria-label="Tøm søkefelt"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          ) : (
            <Tooltip
              title="Fokuser søk"
              shortcut="/"
              description="Trykk '/' når som helst for å søke"
              position="left"
            >
              <kbd className="absolute right-2.5 top-2.5 text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 py-0.5 rounded border border-slate-700/60 cursor-pointer hover:text-white">
                /
              </kbd>
            </Tooltip>
          )}
        </div>

        {/* Category Dropdown Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Filter className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-md pl-7 pr-3 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer transition appearance-none"
            >
              <option value="All">Alle kategorier ({categoryCounts['All'] || 0})</option>
              {Object.keys(CATEGORY_NAMES)
                .filter((cat) => cat !== 'All')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_NAMES[cat]} ({categoryCounts[cat] || 0})
                  </option>
                ))}
            </select>
          </div>

          {hasActiveFilters && (
            <Tooltip
              title="Nullstill filtre"
              description="Tilbakestill søk og vis alle komponenter"
              position="bottom"
            >
              <button
                onClick={handleClearFilters}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-[10px] text-blue-400 hover:text-blue-300 rounded border border-slate-700 transition shrink-0"
              >
                Nullstill
              </button>
            </Tooltip>
          )}
        </div>

        {/* Quick Search Preset Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pt-0.5">
          <span className="text-[10px] text-slate-500 font-medium shrink-0 mr-0.5">Hurtigsøk:</span>
          {POPULAR_SEARCH_PRESETS.map((preset) => {
            const isPresetActive = searchQuery.trim().toLowerCase() === preset.toLowerCase();
            return (
              <Tooltip
                key={preset}
                title={`Søk: ${preset}`}
                description="Filtrer listen raskt etter denne komponenten"
                position="bottom"
              >
                <button
                  onClick={() => {
                    if (isPresetActive) {
                      setSearchQuery('');
                    } else {
                      setSearchQuery(preset);
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 transition border ${
                    isPresetActive
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {preset}
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* Active Tag Filter Indicator (if any tag selected) */}
        {selectedTag && (
          <div className="flex items-center justify-between bg-blue-950/60 border border-blue-500/40 px-2.5 py-1 rounded-md text-[11px] text-blue-200">
            <div className="flex items-center space-x-1.5">
              <Tag className="w-3 h-3 text-blue-400" />
              <span>Filter:</span>
              <span className="font-mono font-bold text-white">#{selectedTag}</span>
            </div>
            <Tooltip title="Fjern tag-filter" position="left">
              <button
                onClick={() => setSelectedTag(null)}
                className="text-blue-300 hover:text-white flex items-center space-x-0.5 text-[10px]"
              >
                <X className="w-3 h-3" />
                <span>Fjern</span>
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* 2. Horizontal Category Tabs */}
      <div className="flex items-center space-x-1 px-3 py-2 border-b border-slate-800 overflow-x-auto no-scrollbar bg-slate-900/60">
        {[
          'All',
          'Microcontrollers',
          'Prototyping',
          'Output',
          'Input',
          'Passive',
          'Power',
          'Sensors',
          'Custom',
        ].map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <Tooltip
              key={cat}
              title={CATEGORY_NAMES[cat] || cat}
              description={`${categoryCounts[cat] || 0} komponenter tilgjengelig`}
              position="bottom"
            >
              <button
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{CATEGORY_NAMES[cat]}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* 3. Quick Tag Filter Chips Bar */}
      {allUniqueTags.length > 0 && (
        <div className="px-3 py-1.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-500 font-medium flex items-center space-x-1 pr-1 shrink-0">
            <Tag className="w-2.5 h-2.5" />
            <span>Koder:</span>
          </span>
          {allUniqueTags.map((tag) => {
            const isTagActive = selectedTag === tag;
            return (
              <Tooltip
                key={tag}
                title={`#${tag}`}
                description="Filtrer komponenter etter denne merkelappen"
                position="bottom"
              >
                <button
                  onClick={() => handleSelectTag(tag)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 transition border ${
                    isTagActive
                      ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                      : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-blue-300 border-slate-700/60'
                  }`}
                >
                  #{tag}
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* 4. Component Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-slate-800/50 rounded-full text-slate-500 border border-slate-700/60">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-300 text-xs">
                Ingen komponenter funnet
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {searchQuery
                  ? `Ingen treff for "${searchQuery}"`
                  : 'Ingen komponenter passer valgte filtre.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-[11px] font-medium rounded-lg border border-slate-700 transition"
              >
                Nullstill alle filtre
              </button>
            )}
          </div>
        ) : (
          filteredComponents.map((comp) => {
            const compTags = comp.tags || (comp.isCustom ? ['custom'] : []);

            return (
              <div
                key={comp.typeId}
                draggable
                onDragStart={(e) => handleDragStart(e, comp.typeId)}
                onClick={() => onAddComponent(comp.typeId)}
                className="p-2.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-blue-500 cursor-grab active:cursor-grabbing transition group flex flex-col justify-between shadow-sm hover:shadow"
              >
                <div>
                  {/* Category Pill & Badges */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1 font-medium">
                      <span>{CATEGORY_ICONS[comp.category]}</span>
                      <span>{renderHighlighted(CATEGORY_NAMES[comp.category] || comp.category, searchQuery)}</span>
                    </span>
                    {comp.isCustom ? (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                        Egen
                      </span>
                    ) : comp.libraryId ? (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                        Pakke
                      </span>
                    ) : null}
                  </div>

                  {/* Component Name */}
                  <h4 className="font-semibold text-white text-xs group-hover:text-blue-400 transition leading-snug">
                    {renderHighlighted(comp.name, searchQuery)}
                  </h4>

                  {/* Description */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-tight">
                    {renderHighlighted(comp.description, searchQuery)}
                  </p>

                  {/* Merkelapper (Tags) as small code badges */}
                  {compTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      {compTags.map((t) => {
                        const isMatchingTag =
                          selectedTag?.toLowerCase() === t.toLowerCase() ||
                          (searchQuery &&
                            t
                              .toLowerCase()
                              .includes(
                                searchQuery.trim().toLowerCase().replace(/^#+/, '')
                              ));

                        return (
                          <span
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTag(t);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition border cursor-pointer ${
                              isMatchingTag
                                ? 'bg-blue-600/30 text-blue-200 border-blue-400 shadow-sm font-semibold'
                                : 'bg-slate-900/80 hover:bg-blue-950/60 text-slate-300 hover:text-blue-300 border-slate-700/80 hover:border-blue-500/60'
                            }`}
                            title={`Klikk for å filtrere etter #${t}`}
                          >
                            #{t}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer: Pins & Click-to-add action */}
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-700/50">
                  <span className="font-mono text-slate-400 font-medium">
                    {comp.pins.length} pinner
                  </span>
                  <span className="text-blue-400 group-hover:text-blue-300 group-hover:underline transition flex items-center space-x-0.5">
                    <span>Dra eller klikk +</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Bottom Shortcut / Helper */}
      <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Tips: Trykk [/] for søk, [L] for layout</span>
        </span>
        <button
          onClick={onOpenComponentEditor}
          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
        >
          + Ny IC/Modul
        </button>
      </div>
    </div>
  );
};
