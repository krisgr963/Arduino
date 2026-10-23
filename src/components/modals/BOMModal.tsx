import React, { useState } from 'react';
import {
  CircuitComponentInstance,
  ComponentDefinition,
  BOMItem,
} from '../../types/circuit';
import { formatResistance } from '../../utils/resistorColors';
import {
  X,
  FileSpreadsheet,
  Copy,
  Download,
  ExternalLink,
  Check,
} from 'lucide-react';

interface BOMModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponentInstance[];
  componentDefs: Map<string, ComponentDefinition>;
}

export const BOMModal: React.FC<BOMModalProps> = ({
  isOpen,
  onClose,
  components,
  componentDefs,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build BOM Item list
  const bomMap = new Map<string, BOMItem>();

  components.forEach((inst) => {
    const def = componentDefs.get(inst.typeId);
    const key = `${inst.typeId}_${inst.properties.resistance || inst.properties.color || ''}`;

    let spec = '';
    if (inst.typeId === 'resistor') {
      spec = formatResistance(inst.properties.resistance || 330);
    } else if (inst.typeId === 'led_5mm') {
      spec = `Farge: ${inst.properties.color || '#ef4444'}`;
    } else if (inst.typeId === 'battery_9v') {
      spec = '9.0V DC';
    } else if (inst.typeId === 'potentiometer') {
      spec = '10 kΩ Lineær';
    } else if (def?.defaultProperties?.voltage) {
      spec = String(def.defaultProperties.voltage);
    }

    if (!bomMap.has(key)) {
      bomMap.set(key, {
        reference: inst.label || 'U1',
        typeId: inst.typeId,
        name: def?.name || inst.typeId,
        category: def?.category || 'Generisk',
        quantity: 1,
        specifications: spec || '-',
        datasheetUrl: def?.datasheetUrl || inst.datasheetUrl,
        instances: [inst],
      });
    } else {
      const item = bomMap.get(key)!;
      item.quantity += 1;
      item.reference += `, ${inst.label || 'U' + (item.quantity)}`;
      item.instances.push(inst);
    }
  });

  const bomItems = Array.from(bomMap.values());

  const handleCopyClipboard = () => {
    let tsv = 'Referanse\tNavn\tKategori\tAntall\tSpesifikasjon\tDatablad\n';
    bomItems.forEach((item) => {
      tsv += `${item.reference}\t${item.name}\t${item.category}\t${item.quantity}\t${item.specifications}\t${item.datasheetUrl || '-'}\n`;
    });

    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    let csv = 'Referanse,Navn,Kategori,Antall,Spesifikasjon,Datablad\n';
    bomItems.forEach((item) => {
      csv += `"${item.reference}","${item.name}","${item.category}",${item.quantity},"${item.specifications}","${item.datasheetUrl || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `circulab_bom_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-600/20 text-amber-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Stykkliste / Bill of Materials (BOM)</h2>
              <p className="text-xs text-slate-400">
                Automatisk generert liste over alle aktive komponenter, spesifikasjoner og antall.
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

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-800/60 border-b border-slate-800">
          <div className="text-xs text-slate-300">
            Totalt <span className="font-bold text-white">{components.length}</span> komponenter i kretsen ({bomItems.length} unike typer)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyClipboard}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopiert!' : 'Kopier tabell'}</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Last ned CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {bomItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Ingen komponenter på koblingsbrettet ennå. Dra komponenter inn fra menyen for å bygge kretsen.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Antall</th>
                    <th className="py-2.5 px-4 font-semibold">Komponent</th>
                    <th className="py-2.5 px-4 font-semibold">Referanse(r)</th>
                    <th className="py-2.5 px-4 font-semibold">Kategori</th>
                    <th className="py-2.5 px-4 font-semibold">Spesifikasjon</th>
                    <th className="py-2.5 px-4 font-semibold">Datablad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {bomItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-400">
                        {item.quantity}x
                      </td>
                      <td className="py-2.5 px-4 font-medium text-white">{item.name}</td>
                      <td className="py-2.5 px-4 text-slate-300 font-mono text-[11px]">
                        {item.reference}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">{item.category}</td>
                      <td className="py-2.5 px-4 text-slate-300 font-mono">{item.specifications}</td>
                      <td className="py-2.5 px-4">
                        {item.datasheetUrl ? (
                          <a
                            href={item.datasheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 underline"
                          >
                            <span>Vis</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
