import React from 'react';
import {
  CircuitComponentInstance,
  ComponentDefinition,
  PinDefinition,
} from '../../types/circuit';
import { getResistorColorBands, formatResistance } from '../../utils/resistorColors';

interface ComponentRendererProps {
  component: CircuitComponentInstance;
  definition: ComponentDefinition;
  isSelected: boolean;
  isSimulating: boolean;
  hoveredPinId: string | null;
  activePinId: string | null;
  onPinMouseDown?: (pin: PinDefinition, e: React.MouseEvent) => void;
  onPinMouseEnter?: (pin: PinDefinition) => void;
  onPinMouseLeave?: (pin: PinDefinition) => void;
  onComponentClick?: (e: React.MouseEvent) => void;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  definition,
  isSelected,
  isSimulating,
  hoveredPinId,
  activePinId,
  onPinMouseDown,
  onPinMouseEnter,
  onPinMouseLeave,
  onComponentClick,
}) => {
  const { width, height } = definition;
  const isPressed = component.state?.isPressed || false;
  const simActive = component.state?.simActive || false;
  const simBurned = component.state?.simBurned || false;

  // Render individual pins
  const renderPins = () => {
    // For breadboard, we render subtle pin hit targets
    const isBreadboard = definition.typeId === 'breadboard_half';

    return definition.pins.map((pin) => {
      const isHovered = hoveredPinId === pin.id;
      const isActive = activePinId === pin.id;

      let pinColor = '#94a3b8'; // Slate 400
      let pinFill = '#cbd5e1';
      if (pin.type === 'power') {
        pinColor = '#ef4444';
        pinFill = '#fca5a5';
      } else if (pin.type === 'ground') {
        pinColor = '#0f172a';
        pinFill = '#64748b';
      } else if (pin.type === 'digital_io' || pin.type === 'signal') {
        pinColor = '#3b82f6';
        pinFill = '#93c5fd';
      } else if (pin.type === 'analog') {
        pinColor = '#8b5cf6';
        pinFill = '#c4b5fd';
      }

      if (isBreadboard) {
        return (
          <g
            key={pin.id}
            className="cursor-crosshair group"
            onMouseDown={(e) => {
              e.stopPropagation();
              onPinMouseDown?.(pin, e);
            }}
            onMouseEnter={() => onPinMouseEnter?.(pin)}
            onMouseLeave={() => onPinMouseLeave?.(pin)}
          >
            {/* Visual breadboard hole */}
            <circle cx={pin.x} cy={pin.y} r={3.2} fill="#334155" />
            <circle cx={pin.x} cy={pin.y} r={2.0} fill="#0f172a" />
            <rect
              x={pin.x - 1.2}
              y={pin.y - 1.2}
              width={2.4}
              height={2.4}
              fill="#94a3b8"
              opacity={0.7}
            />

            {/* Hover highlight circle */}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={isHovered || isActive ? 7 : 5}
              fill={isActive ? '#3b82f6' : isHovered ? '#10b981' : 'transparent'}
              opacity={isHovered || isActive ? 0.75 : 0}
              className="transition-all duration-100"
            />
          </g>
        );
      }

      // Standard component pin
      return (
        <g
          key={pin.id}
          className="cursor-crosshair"
          onMouseDown={(e) => {
            e.stopPropagation();
            onPinMouseDown?.(pin, e);
          }}
          onMouseEnter={() => onPinMouseEnter?.(pin)}
          onMouseLeave={() => onPinMouseLeave?.(pin)}
        >
          {/* Outer ring on hover/active */}
          {(isHovered || isActive) && (
            <circle
              cx={pin.x}
              cy={pin.y}
              r={9}
              fill="none"
              stroke={isActive ? '#3b82f6' : '#10b981'}
              strokeWidth={2.5}
              className="animate-pulse"
            />
          )}

          {/* Solder eyelet / Pin terminal */}
          <circle cx={pin.x} cy={pin.y} r={5} fill="#d1d5db" stroke="#4b5563" strokeWidth={1} />
          <circle cx={pin.x} cy={pin.y} r={3} fill={isHovered ? '#10b981' : pinColor} />
          <circle cx={pin.x} cy={pin.y} r={1.2} fill="#ffffff" />
        </g>
      );
    });
  };

  // Render specific component visual artwork
  const renderVisual = () => {
    switch (definition.typeId) {
      // 1. ARDUINO UNO R3
      case 'arduino_uno': {
        return (
          <g>
            {/* PCB Board */}
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              rx={12}
              fill="#008184"
              stroke="#005d5f"
              strokeWidth={3}
              filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.3))"
            />

            {/* Mounting holes */}
            <circle cx={14} cy={50} r={6} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={2} />
            <circle cx={14} cy={50} r={3.5} fill="#334155" />
            <circle cx={155} cy={14} r={6} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={2} />
            <circle cx={155} cy={14} r={3.5} fill="#334155" />
            <circle cx={305} cy={60} r={6} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={2} />
            <circle cx={305} cy={60} r={3.5} fill="#334155" />
            <circle cx={305} cy={165} r={6} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={2} />
            <circle cx={305} cy={165} r={3.5} fill="#334155" />

            {/* USB-B Port */}
            <rect x={-8} y={15} width={45} height={42} rx={3} fill="#cbd5e1" stroke="#64748b" strokeWidth={2} />
            <rect x={-4} y={23} width={32} height={26} rx={2} fill="#94a3b8" />
            <rect x={6} y={28} width={12} height={16} fill="#f8fafc" />

            {/* DC Barrel Jack */}
            <rect x={-8} y={135} width={48} height={40} rx={4} fill="#1e293b" stroke="#0f172a" strokeWidth={2} />
            <circle cx={30} cy={155} r={7} fill="#475569" />
            <circle cx={30} cy={155} r={3} fill="#0f172a" />

            {/* ATmega328P DIP IC */}
            <rect x={180} y={90} width={110} height={45} rx={3} fill="#18181b" stroke="#3f3f46" strokeWidth={1.5} />
            {/* Notch */}
            <path d="M 180 107 A 5 5 0 0 0 180 117 Z" fill="#3f3f46" />
            <text x={235} y={117} fill="#e4e4e7" fontSize={9} fontWeight="bold" textAnchor="middle" letterSpacing={0.5}>
              ATMEGA328P-PU
            </text>

            {/* IC Pins */}
            {[...Array(14)].map((_, i) => (
              <React.Fragment key={i}>
                <rect x={186 + i * 7.5} y={86} width={3.5} height={4} fill="#cbd5e1" />
                <rect x={186 + i * 7.5} y={135} width={3.5} height={4} fill="#cbd5e1" />
              </React.Fragment>
            ))}

            {/* 16MHz Crystal */}
            <rect x={155} y={80} width={10} height={24} rx={5} fill="#cbd5e1" stroke="#94a3b8" />

            {/* Reset Button */}
            <rect x={55} y={22} width={22} height={22} rx={2} fill="#cbd5e1" stroke="#64748b" />
            <circle cx={66} cy={33} r={6} fill="#dc2626" />

            {/* Onboard LEDs (ON and L) */}
            {/* ON LED (Green) */}
            <circle cx={145} cy={60} r={3} fill="#22c55e" filter="drop-shadow(0 0 3px #22c55e)" />
            <text x={145} y={72} fill="#ffffff" fontSize={7} textAnchor="middle">ON</text>

            {/* L LED (Pin 13) */}
            <circle
              cx={130}
              cy={60}
              r={3}
              fill={simActive ? '#facc15' : '#713f12'}
              filter={simActive ? 'drop-shadow(0 0 4px #facc15)' : undefined}
            />
            <text x={130} y={72} fill="#ffffff" fontSize={7} textAnchor="middle">L</text>

            {/* Silkscreen text */}
            <text x={105} y={115} fill="#ffffff" fontSize={15} fontWeight="bold">
              ARDUINO
            </text>
            <text x={105} y={130} fill="#ffffff" fontSize={11} letterSpacing={1}>
              UNO R3
            </text>

            {/* Top Header Block */}
            <rect x={100} y={6} width={215} height={16} fill="#0f172a" rx={2} />
            <text x={106} y={32} fill="#ffffff" fontSize={7} textAnchor="middle">SCL</text>
            <text x={119} y={32} fill="#ffffff" fontSize={7} textAnchor="middle">SDA</text>
            <text x={145} y={32} fill="#ffffff" fontSize={7} textAnchor="middle">GND</text>
            <text x={158} y={32} fill="#ffffff" fontSize={7} textAnchor="middle">13</text>
            <text x={184} y={32} fill="#ffffff" fontSize={7} textAnchor="middle">~11</text>
            <text x={223} y={32} fill="#ffffff" fontSize={7} textAnchor="middle">8</text>
            <text x={242} y={32} fill="#ffffff" fontSize={7} textAnchor="middle">7</text>
            <text x={307} y={32} fill="#ffffff" fontSize={7} textAnchor="middle">2</text>
            <text x={200} y={40} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">
              DIGITAL (PWM ~)
            </text>

            {/* Bottom Header Block */}
            <rect x={138} y={198} width={177} height={16} fill="#0f172a" rx={2} />
            <text x={171} y={192} fill="#ffffff" fontSize={7} textAnchor="middle">3.3V</text>
            <text x={184} y={192} fill="#ffffff" fontSize={7} textAnchor="middle">5V</text>
            <text x={204} y={192} fill="#ffffff" fontSize={7} textAnchor="middle">GND</text>
            <text x={223} y={192} fill="#ffffff" fontSize={7} textAnchor="middle">VIN</text>
            <text x={242} y={192} fill="#ffffff" fontSize={7} textAnchor="middle">A0</text>
            <text x={268} y={192} fill="#ffffff" fontSize={7} textAnchor="middle">A2</text>
            <text x={307} y={192} fill="#ffffff" fontSize={7} textAnchor="middle">A5</text>
            <text x={185} y={180} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">
              POWER
            </text>
            <text x={275} y={180} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">
              ANALOG IN
            </text>
          </g>
        );
      }

      // 2. ESP32 DevKit V1
      case 'esp32_devkit': {
        return (
          <g>
            {/* PCB */}
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              rx={6}
              fill="#18181b"
              stroke="#27272a"
              strokeWidth={2}
              filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.35))"
            />

            {/* RF Shielding Can (WROOM-32) */}
            <rect x={26} y={15} width={118} height={130} rx={4} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={2} />
            {/* Antenna Trace Area */}
            <rect x={32} y={18} width={106} height={24} rx={2} fill="#18181b" />
            <path
              d="M 40 34 L 50 24 L 60 34 L 70 24 L 80 34 L 90 24 L 100 34 L 110 24 L 120 34"
              stroke="#eab308"
              strokeWidth={2}
              fill="none"
            />

            <text x={85} y={70} fill="#0f172a" fontSize={11} fontWeight="bold" textAnchor="middle">
              ESP-WROOM-32
            </text>
            <text x={85} y={85} fill="#475569" fontSize={8} textAnchor="middle">
              Wi-Fi &amp; Bluetooth
            </text>
            <text x={85} y={98} fill="#64748b" fontSize={7} textAnchor="middle">
              FCC ID: 2AC7Z-ESPWROOM32
            </text>

            {/* Micro USB Port at bottom */}
            <rect x={60} y={245} width={50} height={26} rx={3} fill="#94a3b8" stroke="#475569" />
            <rect x={68} y={252} width={34} height={14} fill="#1e293b" />

            {/* Buttons (EN and BOOT) */}
            <rect x={25} y={235} width={18} height={18} rx={2} fill="#e2e8f0" />
            <circle cx={34} cy={244} r={5} fill="#ef4444" />
            <text x={34} y={230} fill="#ffffff" fontSize={7} textAnchor="middle">EN</text>

            <rect x={127} y={235} width={18} height={18} rx={2} fill="#e2e8f0" />
            <circle cx={136} cy={244} r={5} fill="#3b82f6" />
            <text x={136} y={230} fill="#ffffff" fontSize={7} textAnchor="middle">BOOT</text>

            {/* Header Pins Strips Left & Right */}
            <rect x={6} y={25} width={16} height={230} rx={2} fill="#09090b" />
            <rect x={148} y={25} width={16} height={230} rx={2} fill="#09090b" />

            {/* Labels on board */}
            <text x={85} y={170} fill="#ffffff" fontSize={12} fontWeight="bold" textAnchor="middle">
              ESP32
            </text>
            <text x={85} y={185} fill="#a1a1aa" fontSize={8} textAnchor="middle">
              NodeMCU-32S
            </text>
          </g>
        );
      }

      // 3. KOBLINGSBRETT (Breadboard 400 tie points)
      case 'breadboard_half': {
        return (
          <g>
            {/* Breadboard Plastic Body */}
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              rx={8}
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth={3}
              filter="drop-shadow(0 6px 12px rgba(0,0,0,0.15))"
            />

            {/* Interlocking tabs on side */}
            <path d="M 0 50 L -6 56 L -6 70 L 0 76 Z" fill="#f8fafc" stroke="#e2e8f0" />
            <path d="M 0 150 L -6 156 L -6 170 L 0 176 Z" fill="#f8fafc" stroke="#e2e8f0" />
            <path d="M 445 50 L 451 56 L 451 70 L 445 76 Z" fill="#f8fafc" stroke="#e2e8f0" />
            <path d="M 445 150 L 451 156 L 451 170 L 445 176 Z" fill="#f8fafc" stroke="#e2e8f0" />

            {/* Top Power Rail Lines */}
            {/* Red Line (+) */}
            <line x1={30} y1={12} x2={420} y2={12} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
            <text x={18} y={21} fill="#ef4444" fontSize={13} fontWeight="bold" textAnchor="middle">+</text>
            <text x={430} y={21} fill="#ef4444" fontSize={13} fontWeight="bold" textAnchor="middle">+</text>

            {/* Blue Line (-) */}
            <line x1={30} y1={40} x2={420} y2={40} stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" />
            <text x={18} y={37} fill="#3b82f6" fontSize={15} fontWeight="bold" textAnchor="middle">-</text>
            <text x={430} y={37} fill="#3b82f6" fontSize={15} fontWeight="bold" textAnchor="middle">-</text>

            {/* Bottom Power Rail Lines */}
            {/* Red Line (+) */}
            <line x1={30} y1={188} x2={420} y2={188} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
            <text x={18} y={197} fill="#ef4444" fontSize={13} fontWeight="bold" textAnchor="middle">+</text>
            <text x={430} y={197} fill="#ef4444" fontSize={13} fontWeight="bold" textAnchor="middle">+</text>

            {/* Blue Line (-) */}
            <line x1={30} y1={216} x2={420} y2={216} stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" />
            <text x={18} y={213} fill="#3b82f6" fontSize={15} fontWeight="bold" textAnchor="middle">-</text>
            <text x={430} y={213} fill="#3b82f6" fontSize={15} fontWeight="bold" textAnchor="middle">-</text>

            {/* Center Ravine (DIP Divider) */}
            <rect x={20} y={109} width={405} height={8} fill="#e2e8f0" rx={2} />
            <line x1={22} y1={113} x2={423} y2={113} stroke="#cbd5e1" strokeWidth={1} />

            {/* Row Letters (A, B, C, D, E and F, G, H, I, J) */}
            {['a', 'b', 'c', 'd', 'e'].map((letter, idx) => (
              <React.Fragment key={letter}>
                <text x={18} y={60 + idx * 12} fill="#64748b" fontSize={9} fontWeight="bold" textAnchor="middle">
                  {letter.toUpperCase()}
                </text>
                <text x={430} y={60 + idx * 12} fill="#64748b" fontSize={9} fontWeight="bold" textAnchor="middle">
                  {letter.toUpperCase()}
                </text>
              </React.Fragment>
            ))}

            {['f', 'g', 'h', 'i', 'j'].map((letter, idx) => (
              <React.Fragment key={letter}>
                <text x={18} y={128 + idx * 12} fill="#64748b" fontSize={9} fontWeight="bold" textAnchor="middle">
                  {letter.toUpperCase()}
                </text>
                <text x={430} y={128 + idx * 12} fill="#64748b" fontSize={9} fontWeight="bold" textAnchor="middle">
                  {letter.toUpperCase()}
                </text>
              </React.Fragment>
            ))}

            {/* Column Numbers (1, 5, 10, 15, 20, 25, 30) */}
            {[1, 5, 10, 15, 20, 25, 30].map((col) => {
              const xPos = 35 + (col - 1) * 13;
              return (
                <React.Fragment key={col}>
                  <text x={xPos} y={50} fill="#94a3b8" fontSize={8} fontWeight="bold" textAnchor="middle">
                    {col}
                  </text>
                  <text x={xPos} y={180} fill="#94a3b8" fontSize={8} fontWeight="bold" textAnchor="middle">
                    {col}
                  </text>
                </React.Fragment>
              );
            })}
          </g>
        );
      }

      // 4. LED 5mm
      case 'led_5mm': {
        const color = component.properties.color || '#ef4444';
        return (
          <g>
            {/* Cathode Notch & Anode Legs */}
            <line x1={20} y1={42} x2={20} y2={62} stroke="#94a3b8" strokeWidth={2.5} />
            <line x1={40} y1={42} x2={40} y2={62} stroke="#94a3b8" strokeWidth={2.5} />

            {/* Glow effect when active */}
            {simActive && !simBurned && (
              <circle
                cx={30}
                cy={25}
                r={26}
                fill={color}
                opacity={0.5}
                filter="blur(10px)"
                className="animate-pulse"
              />
            )}

            {/* LED 5mm Base Rim */}
            <path
              d="M 12 40 L 48 40 L 48 36 L 46 36 L 46 25 A 16 16 0 0 0 14 25 L 14 36 L 12 36 Z"
              fill={simBurned ? '#262626' : color}
              opacity={0.88}
              stroke={simBurned ? '#0a0a0a' : '#ffffff'}
              strokeWidth={1}
            />

            {/* Flat notch indicator on cathode side (right side x=46..48) */}
            <line x1={47} y1={36} x2={47} y2={40} stroke="#ffffff" strokeWidth={1.5} />

            {/* Internal Anvil and Post (realistic LED internals) */}
            <path d="M 23 37 L 23 28 L 27 28 Z" fill="#ffffff" opacity={0.6} />
            <line x1={37} y1={37} x2={37} y2={28} stroke="#ffffff" strokeWidth={1} opacity={0.6} />

            {/* Highlight glare */}
            <path d="M 18 20 A 10 10 0 0 1 25 15" stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.8} />

            {/* Burned out state overlay */}
            {simBurned && (
              <g>
                <circle cx={30} cy={25} r={14} fill="#000000" opacity={0.7} />
                <path d="M 24 19 L 36 31 M 36 19 L 24 31" stroke="#ef4444" strokeWidth={2.5} />
                <text x={30} y={55} fill="#ef4444" fontSize={8} fontWeight="bold" textAnchor="middle">
                  BRENT!
                </text>
              </g>
            )}
          </g>
        );
      }

      // 5. MOTSTAND (Resistor)
      case 'resistor': {
        const resistance = Number(component.properties.resistance) || 330;
        const bands = getResistorColorBands(resistance);

        return (
          <g>
            {/* Terminal Leads */}
            <line x1={0} y1={16} x2={20} y2={16} stroke="#cbd5e1" strokeWidth={2.5} />
            <line x1={70} y1={16} x2={90} y2={16} stroke="#cbd5e1" strokeWidth={2.5} />

            {/* Resistor Body (Dumbbell / Bulbous cylinder) */}
            <path
              d="M 20 10 
                 C 25 7, 28 8, 30 11 
                 L 60 11 
                 C 62 8, 65 7, 70 10 
                 L 70 22 
                 C 65 25, 62 24, 60 21 
                 L 30 21 
                 C 28 24, 25 25, 20 22 Z"
              fill="#d9c5a5"
              stroke="#b59a72"
              strokeWidth={1.2}
            />

            {/* Color Bands */}
            <rect x={26} y={8.5} width={4.5} height={15} fill={bands[0]?.color || '#000'} rx={1} />
            <rect x={35} y={11} width={4.5} height={10} fill={bands[1]?.color || '#000'} rx={1} />
            <rect x={44} y={11} width={4.5} height={10} fill={bands[2]?.color || '#000'} rx={1} />
            <rect x={59} y={8.5} width={4.5} height={15} fill={bands[3]?.color || '#d4af37'} rx={1} />

            {/* Resistance label text */}
            <text x={45} y={28} fill="#475569" fontSize={8} fontWeight="bold" textAnchor="middle">
              {formatResistance(resistance)}
            </text>
          </g>
        );
      }

      // 6. TRYKKNAPP (Push Button)
      case 'pushbutton': {
        return (
          <g
            className="cursor-pointer"
            onClick={(e) => {
              if (isSimulating) {
                e.stopPropagation();
                onComponentClick?.(e);
              }
            }}
          >
            {/* Metal Pins */}
            <line x1={0} y1={12} x2={10} y2={12} stroke="#94a3b8" strokeWidth={3} />
            <line x1={0} y1={48} x2={10} y2={48} stroke="#94a3b8" strokeWidth={3} />
            <line x1={50} y1={12} x2={60} y2={12} stroke="#94a3b8" strokeWidth={3} />
            <line x1={50} y1={48} x2={60} y2={48} stroke="#94a3b8" strokeWidth={3} />

            {/* Black Base Package */}
            <rect x={8} y={8} width={44} height={44} rx={5} fill="#1e293b" stroke="#0f172a" strokeWidth={2} />

            {/* Metal Top Bezel */}
            <rect x={11} y={11} width={38} height={38} rx={3} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />

            {/* 4 Corner Rivets */}
            <circle cx={14} cy={14} r={1.5} fill="#64748b" />
            <circle cx={46} cy={14} r={1.5} fill="#64748b" />
            <circle cx={14} cy={46} r={1.5} fill="#64748b" />
            <circle cx={46} cy={46} r={1.5} fill="#64748b" />

            {/* Actuator Button Center */}
            <circle
              cx={30}
              cy={30}
              r={isPressed ? 11 : 13}
              fill={isPressed ? '#2563eb' : '#3b82f6'}
              stroke="#1d4ed8"
              strokeWidth={2}
              filter={isPressed ? 'drop-shadow(0 0 6px #3b82f6)' : undefined}
            />

            {isSimulating && (
              <text x={30} y={58} fill="#2563eb" fontSize={7} fontWeight="bold" textAnchor="middle">
                {isPressed ? 'LUKKET' : 'KLIKK FOR Å TRYKKE'}
              </text>
            )}
          </g>
        );
      }

      // 7. 9V BATTERI
      case 'battery_9v': {
        return (
          <g>
            {/* Battery Body */}
            <rect
              x={6}
              y={20}
              width={68}
              height={100}
              rx={6}
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth={2}
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
            />

            {/* Battery Golden Label Strip */}
            <rect x={6} y={45} width={68} height={40} fill="#f59e0b" />
            <text x={40} y={64} fill="#0f172a" fontSize={14} fontWeight="900" textAnchor="middle">
              9V
            </text>
            <text x={40} y={78} fill="#0f172a" fontSize={8} fontWeight="bold" textAnchor="middle">
              HEAVY DUTY
            </text>

            {/* Terminals at top */}
            {/* Positive (+) Hex/Octagonal Terminal */}
            <circle cx={26} cy={14} r={6} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
            <circle cx={26} cy={14} r={3} fill="#ef4444" />
            <text x={26} y={32} fill="#ef4444" fontSize={9} fontWeight="bold" textAnchor="middle">
              +
            </text>

            {/* Negative (-) Snap Crown Terminal */}
            <circle cx={54} cy={14} r={7} fill="#94a3b8" stroke="#475569" strokeWidth={1.5} />
            <circle cx={54} cy={14} r={4} fill="#1e293b" />
            <text x={54} y={32} fill="#94a3b8" fontSize={11} fontWeight="bold" textAnchor="middle">
              -
            </text>
          </g>
        );
      }

      // 8. BATTERIPAKKE AA (4.5V)
      case 'battery_aa_pack': {
        return (
          <g>
            {/* Holder Case */}
            <rect x={6} y={6} width={100} height={68} rx={4} fill="#1e293b" stroke="#0f172a" strokeWidth={2} />

            {/* 3x AA Batteries inside */}
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={12} y={12 + i * 20} width={80} height={15} rx={3} fill="#3b82f6" />
                <rect x={12} y={12 + i * 20} width={20} height={15} rx={2} fill="#eab308" />
                <rect x={92} y={16 + i * 20} width={4} height={7} fill="#cbd5e1" />
              </g>
            ))}

            {/* Wires coming out on right */}
            <line x1={100} y1={25} x2={110} y2={25} stroke="#ef4444" strokeWidth={2.5} />
            <line x1={100} y1={55} x2={110} y2={55} stroke="#0f172a" strokeWidth={2.5} />
            <text x={55} y={72} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">
              4.5V (3x AA)
            </text>
          </g>
        );
      }

      // 9. POTENSIOMETER
      case 'potentiometer': {
        return (
          <g>
            {/* Pins */}
            <line x1={15} y1={50} x2={15} y2={70} stroke="#cbd5e1" strokeWidth={2.5} />
            <line x1={35} y1={50} x2={35} y2={70} stroke="#cbd5e1" strokeWidth={2.5} />
            <line x1={55} y1={50} x2={55} y2={70} stroke="#cbd5e1" strokeWidth={2.5} />

            {/* Pot Body */}
            <circle cx={35} cy={35} r={28} fill="#2563eb" stroke="#1d4ed8" strokeWidth={2} />
            <circle cx={35} cy={35} r={22} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1.5} />

            {/* Shaft and Knob */}
            <circle cx={35} cy={35} r={14} fill="#475569" />
            <line x1={35} y1={35} x2={44} y2={25} stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
            <text x={35} y={15} fill="#ffffff" fontSize={7} fontWeight="bold" textAnchor="middle">
              10kΩ
            </text>
          </g>
        );
      }

      // 10. PIEZO BUZZER
      case 'piezo_buzzer': {
        return (
          <g>
            {/* Leads */}
            <line x1={22} y1={45} x2={22} y2={56} stroke="#cbd5e1" strokeWidth={2} />
            <line x1={43} y1={45} x2={43} y2={56} stroke="#cbd5e1" strokeWidth={2} />

            {/* Buzzer housing */}
            <circle cx={32} cy={28} r={25} fill="#1e293b" stroke="#0f172a" strokeWidth={2} />
            <circle cx={32} cy={28} r={8} fill="#0f172a" />
            <text x={22} y={20} fill="#ef4444" fontSize={10} fontWeight="bold">+</text>

            {/* Sound waves when active */}
            {simActive && (
              <g className="animate-pulse">
                <path d="M 45 15 A 16 16 0 0 1 45 41" stroke="#3b82f6" strokeWidth={2} fill="none" />
                <path d="M 52 10 A 24 24 0 0 1 52 46" stroke="#60a5fa" strokeWidth={2} fill="none" />
              </g>
            )}
          </g>
        );
      }

      // 11. SKYVEBRYTER (Slide Switch)
      case 'slide_switch': {
        const pos = component.properties.activePosition || 'A';
        return (
          <g
            className="cursor-pointer"
            onClick={(e) => {
              if (isSimulating) {
                e.stopPropagation();
                onComponentClick?.(e);
              }
            }}
          >
            <rect x={8} y={8} width={54} height={22} rx={3} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
            {/* Metal casing slot */}
            <rect x={18} y={14} width={34} height={10} rx={2} fill="#334155" />
            {/* Slider Knob */}
            <rect
              x={pos === 'A' ? 20 : 38}
              y={11}
              width={14}
              height={16}
              rx={2}
              fill="#2563eb"
              stroke="#1e40af"
              strokeWidth={1.5}
              className="transition-all duration-150"
            />
            <text x={pos === 'A' ? 27 : 45} y={23} fill="#ffffff" fontSize={7} textAnchor="middle" fontWeight="bold">
              {pos}
            </text>
          </g>
        );
      }

      // 12. HC-SR04 Ultrasonic Sensor
      case 'hc_sr04': {
        return (
          <g>
            <rect x={6} y={6} width={118} height={52} rx={6} fill="#0284c7" stroke="#0369a1" strokeWidth={2} />
            {/* Two Transducer Cans (Transmitter & Receiver) */}
            <circle cx={35} cy={30} r={18} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={2} />
            <circle cx={35} cy={30} r={13} fill="#475569" />
            <text x={35} y={33} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">T</text>

            <circle cx={95} cy={30} r={18} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={2} />
            <circle cx={95} cy={30} r={13} fill="#475569" />
            <text x={95} y={33} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">R</text>

            <text x={65} y={20} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">
              HC-SR04
            </text>
          </g>
        );
      }

      // 13. OLED I2C Display
      case 'oled_i2c_096': {
        return (
          <g>
            {/* PCB */}
            <rect x={6} y={6} width={88} height={88} rx={5} fill="#0284c7" stroke="#0369a1" strokeWidth={2} />
            {/* OLED Glass */}
            <rect x={14} y={24} width={72} height={60} rx={2} fill="#0f172a" stroke="#334155" strokeWidth={1.5} />
            {/* Display pixels simulation */}
            <text x={50} y={48} fill="#38bdf8" fontSize={8} fontFamily="monospace" textAnchor="middle">
              CircuLab
            </text>
            <text x={50} y={62} fill="#38bdf8" fontSize={7} fontFamily="monospace" textAnchor="middle">
              128x64 OLED
            </text>
          </g>
        );
      }

      // Generic IC or Custom Component fallback
      default: {
        const bodyColor = definition.customColor || '#1e293b';
        return (
          <g>
            {definition.customSvgBody ? (
              <g dangerouslySetInnerHTML={{ __html: definition.customSvgBody }} />
            ) : (
              <>
                {/* IC / Module Body */}
                <rect
                  x={4}
                  y={4}
                  width={width - 8}
                  height={height - 8}
                  rx={5}
                  fill={bodyColor}
                  stroke="#475569"
                  strokeWidth={2}
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))"
                />

                {/* Notch on IC */}
                <path d={`M 4 ${height / 2 - 6} A 6 6 0 0 1 4 ${height / 2 + 6} Z`} fill="#475569" />

                {/* Component Label */}
                <text
                  x={width / 2}
                  y={height / 2 - 2}
                  fill="#f8fafc"
                  fontSize={10}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {definition.name}
                </text>
                <text
                  x={width / 2}
                  y={height / 2 + 12}
                  fill="#94a3b8"
                  fontSize={8}
                  textAnchor="middle"
                >
                  {component.label}
                </text>
              </>
            )}
          </g>
        );
      }
    }
  };

  return (
    <g
      id={`comp_${component.id}`}
      transform={`translate(${component.x}, ${component.y}) rotate(${component.rotation || 0}, ${width / 2}, ${height / 2})`}
      className="select-none"
    >
      {/* Selection bounding box */}
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={8}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4 3"
          className="pointer-events-none animate-pulse"
        />
      )}

      {/* Main Component Artwork */}
      {renderVisual()}

      {/* Pins Layer */}
      {renderPins()}
    </g>
  );
};
