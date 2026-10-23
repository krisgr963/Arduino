import React, { useState } from 'react';
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

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  onNewEmptyProject,
}) => {
  const [savedProjects, setSavedProjects] = useState<CircuitProject[]>(getSavedProjects());
  const [projectName, setProjectName] = useState(currentProject.name);

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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentProject, null, 2));
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Prosjektbehandling (Lagre &amp; Åpne)</h2>
              <p className="text-xs text-slate-400">
                Administrer dine kretser, utforsk forhåndsdefinerte eksempler, eller eksporter til JSON.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] text-slate-400 font-semibold mb-1 uppercase">
                Gjeldende Prosjektnavn
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  onClick={handleSaveCurrent}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lagre lokalt</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Last ned JSON</span>
              </button>

              <label className="cursor-pointer px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Åpne JSON-fil</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportJson}
                />
              </label>

              <button
                onClick={() => {
                  if (confirm('Opprette et nytt tomt prosjekt?')) {
                    onNewEmptyProject();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Nytt tomt lerret
              </button>
            </div>
          </div>

          {/* Section 1: Pre-installed Example Circuits */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Forhåndsdefinerte Eksempel-kretser (Klikk for å laste)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRESET_PROJECTS.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    onLoadProject(proj);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                      <h4 className="font-bold text-white text-xs">{proj.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{proj.components.length} komponenter</span>
                    <span className="text-blue-400 font-semibold group-hover:underline">
                      Åpne &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Saved Projects */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Mine Lagrede Kretser ({savedProjects.length})
            </h3>

            {savedProjects.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Ingen egne prosjekter lagret lokalt ennå. Klikk &quot;Lagre lokalt&quot; ovenfor for å lagre ditt arbeid.
              </p>
            ) : (
              <div className="space-y-2">
                {savedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="flex items-center justify-between p-3 bg-slate-800/70 border border-slate-700/80 rounded-lg hover:border-slate-600 transition"
                  >
                    <div>
                      <h4 className="font-bold text-white text-xs">{proj.name}</h4>
                      <p className="text-[11px] text-slate-400">
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
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                      >
                        Åpne
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(proj.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
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

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
