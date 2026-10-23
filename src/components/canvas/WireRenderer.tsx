import React from 'react';
import { WireConnection } from '../../types/circuit';

interface WireRendererProps {
  wire: WireConnection;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isSelected: boolean;
  isEnergized: boolean;
  isSimulating: boolean;
  onSelectWire?: (wireId: string, e: React.MouseEvent) => void;
}

export const WireRenderer: React.FC<WireRendererProps> = ({
  wire,
  fromX,
  fromY,
  toX,
  toY,
  isSelected,
  isEnergized,
  isSimulating,
  onSelectWire,
}) => {
  // Compute curved Bezier path for realistic Fritzing wire droop
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular vector for natural wire bow
  const nx = -dy / (distance || 1);
  const ny = dx / (distance || 1);

  // User or default curvature
  const curvature = wire.curvature !== undefined ? wire.curvature : Math.min(35, distance * 0.15);

  const midX = (fromX + toX) / 2 + nx * curvature;
  const midY = (fromY + toY) / 2 + ny * curvature;

  const pathData = `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;

  return (
    <g
      className="cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onSelectWire?.(wire.id, e);
      }}
    >
      {/* Invisible wider stroke for easy click selection */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        strokeLinecap="round"
      />

      {/* Wire shadow */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(0, 0, 0, 0.2)"
        strokeWidth={isSelected ? 6 : 4}
        strokeLinecap="round"
        transform="translate(1, 2)"
      />

      {/* Selection Glow */}
      {isSelected && (
        <path
          d={pathData}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.7}
          className="animate-pulse"
        />
      )}

      {/* Main Wire Insulation */}
      <path
        d={pathData}
        fill="none"
        stroke={wire.color || '#ef4444'}
        strokeWidth={isSelected ? 4 : 3}
        strokeLinecap="round"
        className="transition-colors duration-150 group-hover:brightness-125"
      />

      {/* Animated Current flow particles in simulation mode */}
      {isSimulating && isEnergized && (
        <path
          d={pathData}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          strokeDasharray="4 8"
          strokeLinecap="round"
          className="animate-[dash_1s_linear_infinite]"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="24"
            to="0"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </path>
      )}

      {/* Terminal Wire End Sleeves (Jumper Pin Plugs) */}
      <circle cx={fromX} cy={fromY} r={4.5} fill="#1e293b" stroke="#64748b" strokeWidth={1} />
      <circle cx={fromX} cy={fromY} r={2.5} fill={wire.color || '#ef4444'} />

      <circle cx={toX} cy={toY} r={4.5} fill="#1e293b" stroke="#64748b" strokeWidth={1} />
      <circle cx={toX} cy={toY} r={2.5} fill={wire.color || '#ef4444'} />
    </g>
  );
};
