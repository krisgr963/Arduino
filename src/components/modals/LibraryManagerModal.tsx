import React, { useState } from 'react';
import { ExternalLibrary } from '../../types/circuit';
import { validateLibraryJson, SAMPLE_SENSOR_LIBRARY } from '../../data/externalLibraries';
import {
  X,
  Upload,
  Download,
  FolderPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Package,
} from 'lucide-react';

interface LibraryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraries: ExternalLibrary[];
  onUpdateLibraries: (libraries: ExternalLibrary[]) => void;
}

export const LibraryManagerModal: React.FC<LibraryManagerModalProps> = ({
  isOpen,
  onClose,
  libraries,
  onUpdateLibraries,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleLibrary = (id: string) => {
    const updated = libraries.map((lib) =>
      lib.id === id ? { ...lib, enabled: !lib.enabled } : lib
    );
    onUpdateLibraries(updated);
  };

  const handleDeleteLibrary = (id: string) => {
    if (confirm('Er du sikker på at du vil fjerne dette komponentbiblioteket?')) {
      const updated = libraries.filter((lib) => lib.id !== id);
      onUpdateLibraries(updated);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const { valid, error, library } = validateLibraryJson(parsed);

        if (!valid || !library) {
          setImportError(error || 'Ugyldig bibliotekformat.');
          return;
        }

        // Check if exists
        const exists = libraries.some((l) => l.name === library.name);
        let updated: ExternalLibrary[];
        if (exists) {
          updated = libraries.map((l) => (l.name === library.name ? library : l));
          setImportSuccess(`Biblioteket "${library.name}" ble oppdatert!`);
        } else {
          updated = [...libraries, library];
          setImportSuccess(`Importerte "${library.name}" med ${library.components.length} komponenter.`);
        }
        onUpdateLibraries(updated);
      } catch (err: any) {
        setImportError(`Feil ved lesing av fil: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportLibrary = (lib: ExternalLibrary) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(lib, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${lib.name.toLowerCase().replace(/\s+/g, '_')}_library.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleAddSampleLibrary = () => {
    if (!libraries.some((l) => l.id === SAMPLE_SENSOR_LIBRARY.id)) {
      onUpdateLibraries([...libraries, SAMPLE_SENSOR_LIBRARY]);
      setImportSuccess('Lastet inn Sensorer & I2C Modul-pakke!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Administrer Komponentbiblioteker</h2>
              <p className="text-xs text-slate-400">
                Utvid Fritzing-katalogen med eksterne JSON-filer, plugins og modul-pakker.
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

        {/* Feedback banners */}
        {importError && (
          <div className="mx-6 mt-4 p-3 bg-red-950/70 border border-red-800 rounded-lg flex items-center space-x-2 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{importError}</span>
          </div>
        )}
        {importSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/70 border border-emerald-800 rounded-lg flex items-center space-x-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Installerte Biblioteker ({libraries.length})
            </h3>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Importer JSON-bibliotek</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <button
                onClick={handleAddSampleLibrary}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Last demo-pakke</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {libraries.map((lib) => (
              <div
                key={lib.id}
                className={`p-4 rounded-xl border transition ${
                  lib.enabled
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-slate-900/50 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{lib.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700 text-slate-300 font-mono">
                        v{lib.version}
                      </span>
                      {lib.author && (
                        <span className="text-xs text-slate-400">av {lib.author}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{lib.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {lib.components.map((c) => (
                        <span
                          key={c.typeId}
                          className="px-2 py-0.5 bg-slate-900 rounded text-[11px] text-slate-300 border border-slate-700/60"
                        >
                          {c.name} ({c.pins.length} pinner)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleLibrary(lib.id)}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        lib.enabled
                          ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {lib.enabled ? 'Aktiv' : 'Deaktivert'}
                    </button>

                    <button
                      onClick={() => handleExportLibrary(lib)}
                      title="Eksporter som JSON-fil"
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteLibrary(lib.id)}
                      title="Slett bibliotek"
                      className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
