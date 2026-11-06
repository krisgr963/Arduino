import React, { useState, useMemo } from 'react';
import { CircuitProject } from '../../types/circuit';
import { PRESET_PROJECTS } from '../../data/presetProjects';
import {
  X,
  FolderOpen,
  Save,
  Download,
  Upload,
  Sparkles,
  Trash2,
  FileCode,
  Search,
  Cpu,
  Clock,
  Sliders,
  Activity,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: CircuitProject;
  onLoadProject: (project: CircuitProject) => void;
  onNewEmptyProject: () => void;
}

const STORAGE_KEY_PROJECTS = 'circulab_saved_projects';

export function getSavedProjects(): CircuitProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjectToStorage(project: CircuitProject): CircuitProject[] {
  try {
    const current = getSavedProjects();
    const idx = current.findIndex((p) => p.id === project.id);
    let updated: CircuitProject[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...project, updatedAt: new Date().toISOString() }, ...current];
    }
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// Template Category classification
type TemplateCategory = 'all' | 'timer' | 'arduino' | 'sensors' | 'basic';

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  onNewEmptyProject,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'saved'>('templates');
  const [savedProjects, setSavedProjects] = useState<CircuitProject[]>(getSavedProjects());
  const [projectName, setProjectName] = useState(currentProject.name);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    const updatedProject: CircuitProject = {
      ...currentProject,
      name: projectName.trim() || 'Mitt Kretsdesign',
      updatedAt: new Date().toISOString(),
    };
    const saved = saveProjectToStorage(updatedProject);
    setSavedProjects(saved);
    onLoadProject(updatedProject);
    alert('Prosjektet er lagret i nettleserens minne!');
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.circulab.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.components || !parsed.wires) {
          alert('Ugyldig prosjektfil: Mangler komponenter eller ledninger.');
          return;
        }
        onLoadProject(parsed);
        onClose();
      } catch (err: any) {
        alert('Kunne ikke importere fil: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteSaved = (id: string) => {
    if (confirm('Vil du slette dette lagrede prosjektet?')) {
      const updated = savedProjects.filter((p) => p.id !== id);
      setSavedProjects(updated);
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
    }
  };

  // Helper to categorize templates
  const getTemplateCategory = (proj: CircuitProject): TemplateCategory => {
    if (proj.id.includes('555') || proj.name.toLowerCase().includes('555')) return 'timer';
    if (proj.id.includes('pwm') || proj.id.includes('arduino') || proj.name.toLowerCase().includes('arduino'))
      return 'arduino';
    if (proj.id.includes('scope') || proj.id.includes('trend') || proj.name.toLowerCase().includes('oscilloskop'))
      return 'sensors';
    return 'basic';
  };

  const filteredTemplates = useMemo(() => {
    return PRESET_PROJECTS.filter((proj) => {
      const category = getTemplateCategory(proj);
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      if (!matchesCategory) return false;

      const q = templateSearch.trim().toLowerCase();
      if (!q) return true;

      const nameMatch = proj.name.toLowerCase().includes(q);
      const descMatch = (proj.description || '').toLowerCase().includes(q);
      const compMatch = proj.components.some(
        (c) => c.label.toLowerCase().includes(q) || c.typeId.toLowerCase().includes(q)
      );

      return nameMatch || descMatch || compMatch;
    });
  }, [templateSearch, selectedCategory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-xl shadow-md">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Prosjekt- &amp; Kretsmaler
              </h2>
              <p className="text-xs text-slate-400">
                Start med ferdige kretskonfigurasjoner eller administrer egne lagrede kretser
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/40">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'templates'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Kretsmaler ({PRESET_PROJECTS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'saved'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Mine Lagrede Kretser ({savedProjects.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm('Opprette et nytt tomt kretslerret?')) {
                onNewEmptyProject();
                onClose();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Nytt tomt lerret</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'templates' ? (
            /* =================== TAB 1: KRETSMALER =================== */
            <div className="space-y-4">
              {/* Category Pills & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Søk i maler (f.eks. '555', 'PWM', 'LED')..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  {templateSearch && (
                    <button
                      onClick={() => setTemplateSearch('')}
                      className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filters */}
                <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: 'all', label: 'Alle' },
                    { id: 'timer', label: '555-Timer & Oscillator' },
                    { id: 'arduino', label: 'Arduino & PWM' },
                    { id: 'sensors', label: 'Oscilloskop & Lab' },
                    { id: 'basic', label: 'Grunnleggende' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as TemplateCategory)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((proj) => {
                  const is555 = proj.id.includes('555');
                  const isPWM = proj.id.includes('pwm');
                  const isScope = proj.id.includes('oscilloscope') || proj.id.includes('scope');

                  let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  let badgeText = 'Kretsmal';
                  if (is555) {
                    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                    badgeText = '555-Timer';
                  } else if (isPWM) {
                    badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
                    badgeText = 'Arduino PWM';
                  } else if (isScope) {
                    badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                    badgeText = 'Målelab';
                  }

                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        onLoadProject(proj);
                        onClose();
                      }}
                      className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 cursor-pointer transition flex flex-col justify-between group shadow-lg"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="p-2 bg-slate-900 rounded-lg group-hover:scale-105 transition border border-slate-700/80">
                              {is555 ? (
                                <Clock className="w-4 h-4 text-amber-400" />
                              ) : isPWM ? (
                                <Sliders className="w-4 h-4 text-cyan-400" />
                              ) : isScope ? (
                                <Activity className="w-4 h-4 text-purple-400" />
                              ) : (
                                <FileCode className="w-4 h-4 text-blue-400" />
                              )}
                            </div>
                            <h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition">
                              {proj.name}
                            </h4>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${badgeColor}`}
                          >
                            {badgeText}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-3">
                          {proj.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
                          <span>{proj.components.length} komponenter</span>
                          <span>•</span>
                          <span>{proj.wires.length} ledninger</span>
                        </div>

                        <div className="flex items-center space-x-1 text-blue-400 font-bold group-hover:translate-x-0.5 transition">
                          <span>Åpne mal</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Ingen maler matchet søket ditt. Prøv et annet nøkkelord eller nullstill filteret.
                </div>
              )}
            </div>
          ) : (
            /* =================== TAB 2: MINE LAGREDE KRETSER =================== */
            <div className="space-y-6">
              {/* Save Current Project Card */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase">
                  Gjeldende Prosjektnavn
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveCurrent}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lagre lokalt</span>
                    </button>
                    <button
                      onClick={handleExportJson}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Last ned JSON</span>
                    </button>
                    <label className="cursor-pointer px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Åpne JSON</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleImportJson}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Saved Projects List */}
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Lagrede Kretser i Nettleserminnet ({savedProjects.length})
                </h3>

                {savedProjects.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                    Ingen egne prosjekter er lagret lokalt ennå. Klikk &quot;Lagre lokalt&quot; ovenfor for å lagre ditt arbeid!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedProjects.map((proj) => (
                      <div
                        key={proj.id}
                        className="flex items-center justify-between p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-xl hover:border-slate-600 transition"
                      >
                        <div>
                          <h4 className="font-bold text-white text-xs">{proj.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {proj.components.length} komponenter, {proj.wires.length} ledninger
                            {proj.updatedAt && ` · Sist endret: ${new Date(proj.updatedAt).toLocaleDateString()}`}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              onLoadProject(proj);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Åpne
                          </button>
                          <button
                            onClick={() => handleDeleteSaved(proj.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                            title="Slett lagret prosjekt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
