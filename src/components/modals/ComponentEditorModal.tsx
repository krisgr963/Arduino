import React, { useState } from 'react';
import {
  ComponentCategory,
  ComponentDefinition,
  PinDefinition,
  PinType,
} from '../../types/circuit';
import { X, Plus, Trash2, Cpu, Eye, Save, Sparkles } from 'lucide-react';

interface ComponentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveComponent: (comp: ComponentDefinition) => void;
}

export const ComponentEditorModal: React.FC<ComponentEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveComponent,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('Custom');
  const [description, setDescription] = useState('');
  const [datasheetUrl, setDatasheetUrl] = useState('');
  const [width, setWidth] = useState(140);
  const [height, setHeight] = useState(100);
  const [bodyColor, setBodyColor] = useState('#1e293b');
  const [pins, setPins] = useState<PinDefinition[]>([
    { id: 'pin_1', name: 'VCC', type: 'power', x: 12, y: 25, description: '3.3V - 5V' },
    { id: 'pin_2', name: 'GND', type: 'ground', x: 12, y: 50, description: 'Jord' },
    { id: 'pin_3', name: 'SIG', type: 'signal', x: 128, y: 25, description: 'Signalutgang' },
    { id: 'pin_4', name: 'EN', type: 'digital_io', x: 128, y: 50, description: 'Enable' },
  ]);

  // Form state for adding new pin
  const [newPinName, setNewPinName] = useState('');
  const [newPinType, setNewPinType] = useState<PinType>('signal');
  const [newPinSide, setNewPinSide] = useState<'left' | 'right' | 'top' | 'bottom'>('left');

  if (!isOpen) return null;

  const handleAddPin = () => {
    if (!newPinName.trim()) return;

    let x = 12;
    let y = 20;

    if (newPinSide === 'left') {
      x = 12;
      y = Math.min(height - 15, 20 + pins.filter((p) => p.x <= 20).length * 18);
    } else if (newPinSide === 'right') {
      x = width - 12;
      y = Math.min(height - 15, 20 + pins.filter((p) => p.x >= width - 20).length * 18);
    } else if (newPinSide === 'top') {
      y = 12;
      x = Math.min(width - 15, 20 + pins.filter((p) => p.y <= 20).length * 18);
    } else if (newPinSide === 'bottom') {
      y = height - 12;
      x = Math.min(width - 15, 20 + pins.filter((p) => p.y >= height - 20).length * 18);
    }

    const newPin: PinDefinition = {
      id: `pin_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: newPinName.trim(),
      type: newPinType,
      x,
      y,
      description: `${newPinType} pin`,
    };

    setPins([...pins, newPin]);
    setNewPinName('');
  };

  const handleRemovePin = (id: string) => {
    setPins(pins.filter((p) => p.id !== id));
  };

  const handleAutoAlignPins = () => {
    // Distribute pins evenly on Left and Right sides like a DIP IC
    const half = Math.ceil(pins.length / 2);
    const updated = pins.map((p, idx) => {
      if (idx < half) {
        // Left side
        const step = (height - 30) / Math.max(1, half - 1);
        return {
          ...p,
          x: 12,
          y: Math.round(15 + idx * step),
        };
      } else {
        // Right side
        const rightIdx = idx - half;
        const rightCount = pins.length - half;
        const step = (height - 30) / Math.max(1, rightCount - 1);
        return {
          ...p,
          x: width - 12,
          y: Math.round(15 + rightIdx * step),
        };
      }
    });
    setPins(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Vennligst oppgi et navn på komponenten.');
      return;
    }

    const compDef: ComponentDefinition = {
      typeId: `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      name: name.trim(),
      category,
      width,
      height,
      description: description.trim() || 'Egendefinert komponent',
      datasheetUrl: datasheetUrl.trim() || undefined,
      customColor: bodyColor,
      isCustom: true,
      pins,
      packageShape: 'custom',
      defaultProperties: {
        label: name.substring(0, 4).toUpperCase() + '1',
      },
    };

    onSaveComponent(compDef);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Komponent-editor (Bygg egen komponent)</h2>
              <p className="text-xs text-slate-400">
                Design nye moduler og IC-brikker med egne pinner, utseende og datablad.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Properties & Pin Editor */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Grunnleggende Egenskaper
            </h3>

            {/* Component Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Komponentnavn *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="f.eks. ATtiny85, BME280 Sensor, Motor Driver"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category & Color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComponentCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Microcontrollers">Mikrokontrollere</option>
                  <option value="Sensors">Sensorer</option>
                  <option value="Output">Utganger / Aktuatorer</option>
                  <option value="Input">Innganger / Brytere</option>
                  <option value="Passive">Passive komponenter</option>
                  <option value="Power">Strømforsyning</option>
                  <option value="Custom">Egendefinert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kapslingsfarge</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={bodyColor}
                    onChange={(e) => setBodyColor(e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={bodyColor}
                    onChange={(e) => setBodyColor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Dimensions (Width / Height) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Bredde (px): {width}
                </label>
                <input
                  type="range"
                  min="80"
                  max="260"
                  step="10"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Høyde (px): {height}
                </label>
                <input
                  type="range"
                  min="60"
                  max="220"
                  step="10"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            {/* Description & Datasheet URL */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Beskrivelse</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Kort beskrivelse av komponentens funksjon og bruksområde..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Lenke til datablad (URL)
              </label>
              <input
                type="url"
                value={datasheetUrl}
                onChange={(e) => setDatasheetUrl(e.target.value)}
                placeholder="https://example.com/datasheet.pdf"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Pin Management */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Legg til pinner ({pins.length} pinner)
                </h4>
                <button
                  onClick={handleAutoAlignPins}
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Juster jevnt (DIP)</span>
                </button>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newPinName}
                  onChange={(e) => setNewPinName(e.target.value)}
                  placeholder="Pinnenavn (f.eks. SDA, TX, GND)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddPin();
                  }}
                />
                <select
                  value={newPinType}
                  onChange={(e) => setNewPinType(e.target.value as PinType)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  <option value="signal">Signal</option>
                  <option value="power">Power</option>
                  <option value="ground">Ground</option>
                  <option value="digital_io">Digital I/O</option>
                  <option value="analog">Analog</option>
                  <option value="passive">Passiv</option>
                </select>
                <select
                  value={newPinSide}
                  onChange={(e) => setNewPinSide(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  <option value="left">Venstre</option>
                  <option value="right">Høyre</option>
                  <option value="top">Topp</option>
                  <option value="bottom">Bunn</option>
                </select>
                <button
                  onClick={handleAddPin}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Legg til</span>
                </button>
              </div>

              {/* Pin List Table */}
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded text-xs border border-slate-700/60"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-400">{pin.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">
                        {pin.type}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        ({pin.x}, {pin.y})
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemovePin(pin.id)}
                      className="text-slate-400 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Visual Preview */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Sanntids Forhåndsvisning</span>
              </h3>
              <span className="text-xs text-slate-400">
                {width} x {height} px
              </span>
            </div>

            <div className="flex-1 min-h-[300px] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-6 relative overflow-hidden">
              {/* Circuit Grid background */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #475569 1px, transparent 1px)',
                  backgroundSize: '15px 15px',
                }}
              />

              {/* Component SVG Preview */}
              <svg
                width={width + 30}
                height={height + 30}
                viewBox={`-15 -15 ${width + 30} ${height + 30}`}
                className="filter drop-shadow-xl select-none"
              >
                {/* IC Body */}
                <rect
                  x={4}
                  y={4}
                  width={width - 8}
                  height={height - 8}
                  rx={6}
                  fill={bodyColor}
                  stroke="#475569"
                  strokeWidth={2}
                />

                {/* IC Orientation Notch */}
                <path d={`M 4 ${height / 2 - 8} A 8 8 0 0 1 4 ${height / 2 + 8} Z`} fill="#334155" />

                {/* Label text */}
                <text
                  x={width / 2}
                  y={height / 2 - 4}
                  fill="#f8fafc"
                  fontSize={13}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {name || 'KOMPONENT'}
                </text>
                <text
                  x={width / 2}
                  y={height / 2 + 12}
                  fill="#94a3b8"
                  fontSize={9}
                  textAnchor="middle"
                >
                  {category}
                </text>

                {/* Pins */}
                {pins.map((pin) => {
                  let pColor = '#3b82f6';
                  if (pin.type === 'power') pColor = '#ef4444';
                  if (pin.type === 'ground') pColor = '#0f172a';
                  if (pin.type === 'analog') pColor = '#8b5cf6';

                  return (
                    <g key={pin.id}>
                      <circle cx={pin.x} cy={pin.y} r={6} fill="#cbd5e1" stroke="#475569" strokeWidth={1} />
                      <circle cx={pin.x} cy={pin.y} r={3.5} fill={pColor} />
                      <text
                        x={pin.x <= 20 ? pin.x + 9 : pin.x >= width - 20 ? pin.x - 9 : pin.x}
                        y={pin.y + 3}
                        fill="#cbd5e1"
                        fontSize={8}
                        fontWeight="bold"
                        textAnchor={pin.x <= 20 ? 'start' : pin.x >= width - 20 ? 'end' : 'middle'}
                      >
                        {pin.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="text-xs text-slate-400 mt-2 text-center">
              Komponenten vil lagres i ditt lokale bibliotek og være tilgjengelig i sidemenyen for alle prosjekter.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg transition"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition"
          >
            <Save className="w-4 h-4" />
            <span>Lagre i Komponentbibliotek</span>
          </button>
        </div>
      </div>
    </div>
  );
};
