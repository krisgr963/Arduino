import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Activity, Zap, Sliders, Waves, Radio } from 'lucide-react';
import { CircuitComponentInstance, ComponentDefinition } from '../../types/circuit';

interface VirtualOscilloscopeWidgetProps {
  component: CircuitComponentInstance;
  definition: ComponentDefinition;
  isSimulating: boolean;
  simVoltageCh1?: number;
  simVoltageCh2?: number;
}

interface WavePoint {
  t: number;
  v1: number;
  v2: number;
}

export const VirtualOscilloscopeWidget: React.FC<VirtualOscilloscopeWidgetProps> = ({
  component,
  definition,
  isSimulating,
  simVoltageCh1 = 0,
  simVoltageCh2 = 0,
}) => {
  // Oscilloscope state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [activeChannel, setActiveChannel] = useState<'ch1' | 'ch2' | 'both'>('ch1');
  const [timeDiv, setTimeDiv] = useState<string>(
    component.properties?.timeDiv || '50ms'
  );
  const [voltsDivCh1, setVoltsDivCh1] = useState<number>(() => {
    const val = component.properties?.voltsDivCh1;
    if (val === '0.5V') return 0.5;
    if (val === '1V') return 1.0;
    if (val === '5V') return 5.0;
    if (val === '10V') return 10.0;
    return 2.0;
  });
  const [signalMode, setSignalMode] = useState<'live' | 'sine' | 'square' | 'triangle'>(
    component.properties?.signalMode || 'live'
  );

  const [points, setPoints] = useState<WavePoint[]>(() => {
    const initial: WavePoint[] = [];
    for (let i = 0; i < 60; i++) {
      initial.push({ t: i, v1: 0, v2: 0 });
    }
    return initial;
  });

  const tickCounterRef = useRef<number>(0);

  // Time multiplier based on timeDiv
  const speedMs = useMemo(() => {
    switch (timeDiv) {
      case '10ms':
        return 30;
      case '25ms':
        return 45;
      case '50ms':
        return 65;
      case '100ms':
        return 100;
      case '250ms':
        return 160;
      case '500ms':
        return 220;
      default:
        return 65;
    }
  }, [timeDiv]);

  // Real-time animation / sampling loop
  useEffect(() => {
    if (!isSimulating || !isRunning) return;

    const interval = setInterval(() => {
      tickCounterRef.current += 1;
      const count = tickCounterRef.current;
      const tSec = count * 0.1;

      let v1 = 0;
      let v2 = 0;

      const baseV1 = Math.max(0, simVoltageCh1);
      const baseV2 = Math.max(0, simVoltageCh2);

      // Micro-noise for realistic oscilloscope feel
      const noise1 = baseV1 > 0 ? (Math.random() - 0.5) * 0.04 : 0;
      const noise2 = baseV2 > 0 ? (Math.random() - 0.5) * 0.04 : 0;

      if (signalMode === 'live') {
        // True live circuit voltage + subtle analog ripple
        v1 = Math.max(0, +(baseV1 + noise1).toFixed(2));
        v2 = Math.max(0, +(baseV2 + noise2).toFixed(2));
      } else if (signalMode === 'sine') {
        // Sinusoidal wave with amplitude proportional to circuit voltage (fallback to 3.3V)
        const amp1 = baseV1 > 0 ? baseV1 : 3.3;
        const amp2 = baseV2 > 0 ? baseV2 : 2.5;
        v1 = Math.max(0, +(amp1 / 2 + (amp1 / 2) * Math.sin(tSec * 4) + noise1).toFixed(2));
        v2 = Math.max(0, +(amp2 / 2 + (amp2 / 2) * Math.sin(tSec * 4 + Math.PI / 2) + noise2).toFixed(2));
      } else if (signalMode === 'square') {
        // Digital PWM / Clock square wave
        const amp1 = baseV1 > 0 ? baseV1 : 5.0;
        const amp2 = baseV2 > 0 ? baseV2 : 3.3;
        const phase1 = Math.sin(tSec * 4);
        v1 = phase1 >= 0 ? amp1 : 0.0;
        v2 = Math.sin(tSec * 2) >= 0 ? amp2 : 0.0;
      } else if (signalMode === 'triangle') {
        // Triangle wave
        const amp1 = baseV1 > 0 ? baseV1 : 4.0;
        const cycle = (count % 20) / 20;
        const tri = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
        v1 = +(amp1 * tri + noise1).toFixed(2);
        v2 = +(baseV2 * (1 - tri) + noise2).toFixed(2);
      }

      setPoints((prev) => {
        const next = [...prev, { t: count, v1, v2 }];
        if (next.length > 55) {
          next.shift();
        }
        return next;
      });
    }, speedMs);

    return () => clearInterval(interval);
  }, [isSimulating, isRunning, simVoltageCh1, simVoltageCh2, signalMode, speedMs]);

  // Telemetry computations
  const stats = useMemo(() => {
    if (points.length === 0) return { vpp: 0, vrms: 0, vavg: 0, vmax: 0, vmin: 0, freq: 0 };
    const v1s = points.map((p) => p.v1);
    const max = Math.max(...v1s);
    const min = Math.min(...v1s);
    const avg = v1s.reduce((a, b) => a + b, 0) / v1s.length;
    const vpp = +(max - min).toFixed(2);
    const vrms = +Math.sqrt(v1s.reduce((a, b) => a + b * b, 0) / v1s.length).toFixed(2);

    // Approximate frequency
    let freq = 0;
    if (signalMode === 'sine') freq = 50;
    else if (signalMode === 'square') freq = 100;
    else if (signalMode === 'triangle') freq = 25;
    else freq = max > 0 ? 0 : 0;

    return {
      vpp,
      vrms,
      vavg: +avg.toFixed(2),
      vmax: +max.toFixed(2),
      vmin: +min.toFixed(2),
      freq,
    };
  }, [points, signalMode]);

  // Canvas drawing path generator
  // Screen bounds: width 280, height 108
  const screenWidth = 280;
  const screenHeight = 108;
  const maxVoltageDisplay = voltsDivCh1 * 4; // 4 divisions vertically from center/bottom

  const generatePath = (channel: 1 | 2) => {
    if (points.length < 2) return '';
    const stepX = screenWidth / (points.length - 1);

    return points
      .map((pt, idx) => {
        const x = idx * stepX;
        const val = channel === 1 ? pt.v1 : pt.v2;
        // Map 0 to maxVoltageDisplay to screen coordinates (bottom to top)
        const ratio = Math.min(1, Math.max(0, val / maxVoltageDisplay));
        const y = screenHeight - 6 - ratio * (screenHeight - 14);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const pathCh1 = useMemo(() => generatePath(1), [points, maxVoltageDisplay]);
  const pathCh2 = useMemo(() => generatePath(2), [points, maxVoltageDisplay]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    tickCounterRef.current = 0;
    setPoints(Array.from({ length: 55 }, (_, i) => ({ t: i, v1: 0, v2: 0 })));
  };

  return (
    <div className="w-[320px] h-[240px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-700/90 rounded-2xl shadow-2xl p-2.5 flex flex-col justify-between font-sans select-none text-slate-100 relative overflow-hidden ring-1 ring-white/10">
      {/* Top Instrument Bezel & Handle */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          {/* Power status indicator LED */}
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              !isSimulating
                ? 'bg-slate-600'
                : isRunning
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
            }`}
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-black tracking-wider text-slate-200 uppercase font-mono">
              {component.label || 'DSO-2000'}
            </span>
            <span className="text-[8px] text-slate-400 font-mono tracking-tight">
              2CH DIGITAL OSCILLOSCOPE
            </span>
          </div>
        </div>

        {/* Top Control Bar: Mode, Run/Stop, Reset */}
        <div className="flex items-center space-x-1">
          {/* Signal Mode Selector */}
          <select
            value={signalMode}
            onChange={(e) => setSignalMode(e.target.value as any)}
            onClick={(e) => e.stopPropagation()}
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 focus:outline-none transition cursor-pointer"
            title="Velg bølgeform-modus"
          >
            <option value="live">Krets (DC)</option>
            <option value="sine">Sinus AC</option>
            <option value="square">PWM Puls</option>
            <option value="triangle">Trekant</option>
          </select>

          {/* Time/Div Selector */}
          <select
            value={timeDiv}
            onChange={(e) => setTimeDiv(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 focus:outline-none transition cursor-pointer"
            title="Tidsbase per rute"
          >
            <option value="10ms">10ms/div</option>
            <option value="25ms">25ms/div</option>
            <option value="50ms">50ms/div</option>
            <option value="100ms">100ms/div</option>
            <option value="250ms">250ms/div</option>
          </select>

          {/* Run / Stop Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRunning((r) => !r);
            }}
            className={`p-1 rounded text-[10px] font-bold transition flex items-center justify-center ${
              isRunning
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/40'
                : 'bg-amber-600/30 text-amber-300 border border-amber-500/50 hover:bg-amber-600/40'
            }`}
            title={isRunning ? 'Frys bølgeform (Pause)' : 'Start måling (Run)'}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="p-1 rounded text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-red-400 border border-slate-700 transition"
            title="Nullstill skjerm"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main CRT / LCD Display with Glowing Graticule */}
      <div className="w-full h-[112px] bg-[#02130d] rounded-lg border-2 border-slate-800 shadow-inner relative overflow-hidden flex flex-col justify-between">
        {/* Graticule Grid (8 vertical divisions, 10 horizontal divisions) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `
              linear-gradient(to right, #10b981 1px, transparent 1px),
              linear-gradient(to bottom, #10b981 1px, transparent 1px)
            `,
            backgroundSize: '28px 14px',
          }}
        />

        {/* Center Crosshairs */}
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-500/30 pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-emerald-500/30 pointer-events-none" />

        {/* Screen Status Header */}
        <div className="flex items-center justify-between px-2 pt-1 text-[8px] font-mono z-10">
          <div className="flex items-center space-x-2">
            <span
              onClick={(e) => {
                e.stopPropagation();
                setActiveChannel((c) => (c === 'ch1' ? 'both' : c === 'both' ? 'ch2' : 'ch1'));
              }}
              className={`cursor-pointer px-1 py-0.2 rounded font-bold transition ${
                activeChannel === 'ch1' || activeChannel === 'both'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              CH1: {voltsDivCh1}V/div
            </span>

            <span
              onClick={(e) => {
                e.stopPropagation();
                setActiveChannel((c) => (c === 'ch2' ? 'both' : c === 'both' ? 'ch1' : 'ch2'));
              }}
              className={`cursor-pointer px-1 py-0.2 rounded font-bold transition ${
                activeChannel === 'ch2' || activeChannel === 'both'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              CH2: 2V/div
            </span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <span>TB: {timeDiv}</span>
            <span className={isRunning ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isRunning ? 'AUTO' : 'STOP'}
            </span>
          </div>
        </div>

        {/* SVG Waveform Render */}
        <svg
          viewBox={`0 0 ${screenWidth} ${screenHeight}`}
          className="w-full h-full absolute inset-0 pointer-events-none"
        >
          {/* CH1 Waveform (Amber / Yellow) with glow */}
          {(activeChannel === 'ch1' || activeChannel === 'both') && pathCh1 && (
            <>
              {/* Soft glow layer */}
              <path
                d={pathCh1}
                fill="none"
                stroke="#eab308"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.35}
              />
              {/* Sharp crisp signal core */}
              <path
                d={pathCh1}
                fill="none"
                stroke="#fef08a"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* CH2 Waveform (Cyan) with glow */}
          {(activeChannel === 'ch2' || activeChannel === 'both') && pathCh2 && (
            <>
              <path
                d={pathCh2}
                fill="none"
                stroke="#06b6d4"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.3}
              />
              <path
                d={pathCh2}
                fill="none"
                stroke="#67e8f9"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>

        {/* Screen Bottom Telemetry Bar */}
        <div className="flex items-center justify-between px-2 pb-0.5 text-[8.5px] font-mono text-emerald-400 bg-black/40 backdrop-blur-sm z-10 border-t border-emerald-900/40">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-yellow-300">
              U1: {simVoltageCh1.toFixed(2)}V
            </span>
            <span className="text-slate-400">Vpp: {stats.vpp}V</span>
            <span className="text-slate-400">Vrms: {stats.vrms}V</span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <span>F: {stats.freq > 0 ? `${stats.freq}Hz` : '0Hz'}</span>
            <span>Maks: {stats.vmax}V</span>
          </div>
        </div>
      </div>

      {/* Bottom Instrumentation Panel: Channel controls & BNC Connectors */}
      <div className="flex items-center justify-between pt-1 px-1 text-[9px] font-mono border-t border-slate-800">
        {/* CH1 Yellow Probe Port */}
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="flex items-center space-x-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15]" />
            <span className="font-bold text-yellow-400">CH1</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-yellow-500/80 flex items-center justify-center shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/90" />
          </div>
          <span className="text-[7.5px] text-slate-400 mt-0.5">PROBE 1</span>
        </div>

        {/* CH2 Cyan Probe Port */}
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="flex items-center space-x-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            <span className="font-bold text-cyan-400">CH2</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-cyan-500/80 flex items-center justify-center shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/90" />
          </div>
          <span className="text-[7.5px] text-slate-400 mt-0.5">PROBE 2</span>
        </div>

        {/* GND Black Terminal */}
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="flex items-center space-x-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="font-bold text-slate-300">GND</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-500 flex items-center justify-center shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          </div>
          <span className="text-[7.5px] text-slate-400 mt-0.5">0V JORD</span>
        </div>

        {/* CAL 1kHz Reference Pin */}
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="flex items-center space-x-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            <span className="font-bold text-emerald-400">CAL</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-emerald-500/80 flex items-center justify-center shadow-md">
            <div className="w-2 h-2 rounded-sm bg-emerald-400" />
          </div>
          <span className="text-[7.5px] text-slate-400 mt-0.5">1kHz 3V</span>
        </div>
      </div>
    </div>
  );
};
