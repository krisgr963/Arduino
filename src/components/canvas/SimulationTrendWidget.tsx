import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Play, Pause, RotateCcw, Activity, Zap, BarChart2 } from 'lucide-react';
import { CircuitComponentInstance, ComponentDefinition } from '../../types/circuit';

interface SimulationTrendWidgetProps {
  component: CircuitComponentInstance;
  definition: ComponentDefinition;
  isSimulating: boolean;
  simVoltage?: number;
}

interface SamplePoint {
  index: number;
  timeLabel: string;
  voltage: number;
}

export const SimulationTrendWidget: React.FC<SimulationTrendWidgetProps> = ({
  component,
  definition,
  isSimulating,
  simVoltage = 0,
}) => {
  const [samples, setSamples] = useState<SamplePoint[]>(() => {
    // Start med 10 nøytrale punkter
    const initial: SamplePoint[] = [];
    for (let i = 0; i < 15; i++) {
      initial.push({
        index: i,
        timeLabel: `${i * 0.25}s`,
        voltage: 0,
      });
    }
    return initial;
  });

  const [isPaused, setIsPaused] = useState(false);
  const [yScaleMax, setYScaleMax] = useState<number>(5.5); // 5V default, can toggle to 10V
  const sampleCounterRef = useRef<number>(15);

  // Samplings-loop: Kjører når simulering er aktiv og grafen ikke er pauset
  useEffect(() => {
    if (!isSimulating || isPaused) return;

    const interval = setInterval(() => {
      const idx = sampleCounterRef.current++;
      const timeSec = (idx * 0.25).toFixed(1);

      // Tilsett en bitteliten realistisk mikrostøy (±0.01V) kun dersom spenning > 0 for analog oscilloskop-følelse
      const noise = simVoltage > 0 ? (Math.random() - 0.5) * 0.02 : 0;
      const recordedVoltage = Math.max(0, +(simVoltage + noise).toFixed(2));

      setSamples((prev) => {
        const next = [...prev, { index: idx, timeLabel: `${timeSec}s`, voltage: recordedVoltage }];
        // Behold de siste 24 målingene for optimal oversikt i liten widget
        if (next.length > 24) {
          next.shift();
        }
        return next;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isSimulating, isPaused, simVoltage]);

  // Beregn min, maks og snittspenning
  const stats = useMemo(() => {
    if (samples.length === 0) return { min: 0, max: 0, avg: 0 };
    const voltages = samples.map((s) => s.voltage);
    const min = Math.min(...voltages);
    const max = Math.max(...voltages);
    const avg = voltages.reduce((acc, v) => acc + v, 0) / voltages.length;
    return {
      min: +min.toFixed(2),
      max: +max.toFixed(2),
      avg: +avg.toFixed(2),
    };
  }, [samples]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    sampleCounterRef.current = 0;
    setSamples([
      { index: 0, timeLabel: '0.0s', voltage: simVoltage || 0 },
    ]);
  };

  const handleTogglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused((p) => !p);
  };

  const handleToggleScale = (e: React.MouseEvent) => {
    e.stopPropagation();
    setYScaleMax((prev) => (prev === 5.5 ? 10.5 : 5.5));
  };

  return (
    <div className="w-[260px] h-[190px] bg-slate-950/95 border-2 border-slate-700/80 rounded-xl shadow-2xl p-2.5 flex flex-col justify-between font-sans select-none text-slate-200">
      {/* 1. Header: Tittel, statusindikator og kontroller */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center space-x-1.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              !isSimulating
                ? 'bg-slate-600'
                : isPaused
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
            }`}
          />
          <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
            {component.label || 'Oscilloskop'}
          </span>
        </div>

        {/* Hurtigknapper */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleToggleScale}
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Bytt spenningsskala (5V / 10V)"
          >
            {yScaleMax > 6 ? '10V' : '5V'}
          </button>

          <button
            onClick={handleTogglePause}
            className={`p-1 rounded text-[10px] transition ${
              isPaused
                ? 'bg-amber-500/30 text-amber-300 hover:bg-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isPaused ? 'Fortsett måling' : 'Pause måling'}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>

          <button
            onClick={handleClear}
            className="p-1 rounded text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-red-400 transition"
            title="Nullstill måledata"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Digital LCD-skjerm: Nåværende spenning og statistikk */}
      <div className="flex items-baseline justify-between px-2 py-1 bg-slate-900/90 rounded border border-slate-800/80 my-1">
        <div className="flex items-baseline space-x-1">
          <span className="text-[10px] text-slate-400 font-medium">U:</span>
          <span className="text-base font-mono font-bold tracking-tight text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">
            {(simVoltage || 0).toFixed(2)}
          </span>
          <span className="text-xs text-emerald-500/80 font-bold">V</span>
        </div>

        <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-400">
          <span>MIN: <strong className="text-slate-300">{stats.min}V</strong></span>
          <span>MAKS: <strong className="text-slate-300">{stats.max}V</strong></span>
        </div>
      </div>

      {/* 3. Recharts Sanntids Graf */}
      <div className="w-full h-[76px] bg-slate-900/60 rounded border border-slate-800/60 relative overflow-hidden">
        {/* Bakgrunns oscilloskop-rutenett */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={samples} margin={{ top: 4, right: 6, left: -28, bottom: 2 }}>
            <XAxis dataKey="timeLabel" hide={true} />
            <YAxis
              domain={[0, yScaleMax]}
              tick={{ fontSize: 8, fill: '#64748b' }}
              tickCount={3}
              width={30}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-400 shadow">
                      {payload[0].value} V
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="voltage"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Sokkel- og Pinne-guide nederst */}
      <div className="flex items-center justify-between pt-1 px-1 text-[9px] text-slate-400 font-mono">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-[0_0_4px_#ef4444]" />
          <span className="text-slate-300 font-semibold">PROBE (IN)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
          <span className="text-slate-300 font-semibold">GND (0V)</span>
        </div>
      </div>
    </div>
  );
};
