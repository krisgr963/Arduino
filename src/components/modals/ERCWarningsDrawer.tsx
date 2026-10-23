import React from 'react';
import { ERCWarning } from '../../types/circuit';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  X,
  Lightbulb,
} from 'lucide-react';

interface ERCWarningsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  warnings: ERCWarning[];
  onSelectComponent: (compId: string) => void;
}

export const ERCWarningsDrawer: React.FC<ERCWarningsDrawerProps> = ({
  isOpen,
  onClose,
  warnings,
  onSelectComponent,
}) => {
  if (!isOpen) return null;

  const errorCount = warnings.filter((w) => w.severity === 'error').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                errorCount > 0
                  ? 'bg-red-600/20 text-red-400'
                  : warningCount > 0
                  ? 'bg-amber-600/20 text-amber-400'
                  : 'bg-emerald-600/20 text-emerald-400'
              }`}
            >
              {errorCount > 0 ? (
                <AlertOctagon className="w-5 h-5" />
              ) : warningCount > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">Kretsvalidering &amp; ERC (Electrical Rule Check)</h2>
              <p className="text-xs text-slate-400">
                Automatisk analyse av kortslutninger, overspenning, polaritet og manglende seriemotstander.
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {warnings.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Ingen elektriske feil funnet!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Kretsen oppfyller alle grunnleggende sikkerhetsregler. Ingen kortslutninger mellom VCC og GND, og lysdioder har adekvat beskyttelse.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {warnings.map((warn) => {
                const isError = warn.severity === 'error';
                const isWarn = warn.severity === 'warning';

                return (
                  <div
                    key={warn.id}
                    className={`p-4 rounded-xl border ${
                      isError
                        ? 'bg-red-950/40 border-red-800/80'
                        : isWarn
                        ? 'bg-amber-950/40 border-amber-800/80'
                        : 'bg-blue-950/40 border-blue-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          {isError ? (
                            <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0" />
                          ) : isWarn ? (
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                          ) : (
                            <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                        <div>
                          <h4
                            className={`text-sm font-bold ${
                              isError
                                ? 'text-red-300'
                                : isWarn
                                ? 'text-amber-300'
                                : 'text-blue-300'
                            }`}
                          >
                            {warn.title}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {warn.message}
                          </p>

                          {warn.recommendation && (
                            <div className="mt-2.5 flex items-start space-x-1.5 text-xs text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                              <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              <span>
                                <strong className="text-slate-200">Tips til løsning: </strong>
                                {warn.recommendation}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {warn.componentIds.length > 0 && (
                        <button
                          onClick={() => {
                            onSelectComponent(warn.componentIds[0]);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 ml-3 whitespace-nowrap transition"
                        >
                          Lokaliser
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
