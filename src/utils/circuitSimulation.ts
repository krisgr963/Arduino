import {
  CircuitComponentInstance,
  ComponentDefinition,
  ElectricalNet,
  ERCWarning,
  WireConnection,
} from '../types/circuit';

interface DSU {
  parent: Record<string, string>;
  find: (x: string) => string;
  union: (x: string, y: string) => void;
}

function createDSU(): DSU {
  const parent: Record<string, string> = {};

  const find = (x: string): string => {
    if (!parent[x]) {
      parent[x] = x;
    }
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);
    }
    return parent[x];
  };

  const union = (x: string, y: string) => {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX !== rootY) {
      parent[rootX] = rootY;
    }
  };

  return { parent, find, union };
}

export interface SimulationResult {
  nets: ElectricalNet[];
  warnings: ERCWarning[];
  activeComponents: Record<
    string,
    {
      simActive: boolean;
      simVoltage?: number;
      simCurrent?: number;
      simBurned?: boolean;
      statusText?: string;
    }
  >;
  energizedWireIds: Set<string>;
}

export function analyzeCircuit(
  components: CircuitComponentInstance[],
  wires: WireConnection[],
  componentDefs: Map<string, ComponentDefinition>,
  buttonPressedStates: Record<string, boolean> = {}
): SimulationResult {
  const dsu = createDSU();
  const pinKey = (compId: string, pinId: string) => `${compId}:${pinId}`;

  // 1. Initialize pins from all components
  const pinMap = new Map<
    string,
    {
      componentId: string;
      pinId: string;
      pinDef: any;
      compInst: CircuitComponentInstance;
    }
  >();

  components.forEach((comp) => {
    const def = componentDefs.get(comp.typeId);
    if (!def) return;

    def.pins.forEach((pin) => {
      const key = pinKey(comp.id, pin.id);
      pinMap.set(key, {
        componentId: comp.id,
        pinId: pin.id,
        pinDef: pin,
        compInst: comp,
      });
      dsu.find(key);
    });

    // Handle Breadboard internal connections
    if (comp.typeId === 'breadboard_half') {
      const groups = new Map<string, string[]>();
      def.pins.forEach((pin) => {
        if (pin.breadboardGroup) {
          if (!groups.has(pin.breadboardGroup)) {
            groups.set(pin.breadboardGroup, []);
          }
          groups.get(pin.breadboardGroup)!.push(pinKey(comp.id, pin.id));
        }
      });

      // Union all pins in the same breadboard group
      groups.forEach((keys) => {
        for (let i = 1; i < keys.length; i++) {
          dsu.union(keys[0], keys[i]);
        }
      });
    }

    // Handle Push Button internal connections
    if (comp.typeId === 'pushbutton') {
      // 1A and 1B are connected permanently
      dsu.union(pinKey(comp.id, 'pin1a'), pinKey(comp.id, 'pin1b'));
      // 2A and 2B are connected permanently
      dsu.union(pinKey(comp.id, 'pin2a'), pinKey(comp.id, 'pin2b'));

      // If pressed: bridge 1 and 2
      const isPressed = buttonPressedStates[comp.id] ?? comp.state?.isPressed ?? false;
      if (isPressed) {
        dsu.union(pinKey(comp.id, 'pin1a'), pinKey(comp.id, 'pin2a'));
      }
    }

    // Handle Slide Switch internal connections
    if (comp.typeId === 'slide_switch') {
      const pos = comp.properties.activePosition || 'A';
      if (pos === 'A') {
        dsu.union(pinKey(comp.id, 'common'), pinKey(comp.id, 'pin_a'));
      } else {
        dsu.union(pinKey(comp.id, 'common'), pinKey(comp.id, 'pin_b'));
      }
    }
  });

  // 2. Connect explicit wires
  wires.forEach((wire) => {
    const k1 = pinKey(wire.fromComponentId, wire.fromPinId);
    const k2 = pinKey(wire.toComponentId, wire.toPinId);
    dsu.union(k1, k2);
  });

  // 3. Group pins into Nets
  const netGroups = new Map<string, string[]>();
  pinMap.forEach((_, key) => {
    const root = dsu.find(key);
    if (!netGroups.has(root)) {
      netGroups.set(root, []);
    }
    netGroups.get(root)!.push(key);
  });

  // 4. Identify Voltage and Ground Sources in each net
  const nets: ElectricalNet[] = [];
  const netVoltages = new Map<string, number>();
  const netIsGround = new Map<string, boolean>();
  const netIsPower = new Map<string, boolean>();

  netGroups.forEach((pinKeys, root) => {
    let maxVoltage = 0;
    let hasPower = false;
    let hasGnd = false;

    pinKeys.forEach((key) => {
      const p = pinMap.get(key);
      if (!p) return;

      const comp = p.compInst;
      const pinId = p.pinId;

      // Power identification
      if (comp.typeId === 'battery_9v' && pinId === 'pos') {
        maxVoltage = Math.max(maxVoltage, 9.0);
        hasPower = true;
      } else if (comp.typeId === 'battery_aa_pack' && pinId === 'pos') {
        maxVoltage = Math.max(maxVoltage, 4.5);
        hasPower = true;
      } else if (comp.typeId === 'arduino_uno' && pinId === 'v5') {
        maxVoltage = Math.max(maxVoltage, 5.0);
        hasPower = true;
      } else if (comp.typeId === 'arduino_uno' && pinId === 'v33') {
        maxVoltage = Math.max(maxVoltage, 3.3);
        hasPower = true;
      } else if (comp.typeId === 'esp32_devkit' && (pinId === 'vin' || pinId === '3v3')) {
        maxVoltage = Math.max(maxVoltage, pinId === '3v3' ? 3.3 : 5.0);
        hasPower = true;
      }

      // Ground identification
      if (
        (comp.typeId === 'battery_9v' && pinId === 'neg') ||
        (comp.typeId === 'battery_aa_pack' && pinId === 'neg') ||
        (comp.typeId === 'arduino_uno' && (pinId === 'gnd_top' || pinId === 'gnd_bot1' || pinId === 'gnd_bot2')) ||
        (comp.typeId === 'esp32_devkit' && (pinId === 'gnd_l' || pinId === 'gnd_r'))
      ) {
        hasGnd = true;
      }
    });

    netVoltages.set(root, hasPower ? maxVoltage : 0);
    netIsPower.set(root, hasPower);
    netIsGround.set(root, hasGnd);

    // Associated wires
    const associatedWireIds = wires
      .filter((w) => {
        const k1 = pinKey(w.fromComponentId, w.fromPinId);
        return dsu.find(k1) === root;
      })
      .map((w) => w.id);

    nets.push({
      id: root,
      voltage: hasPower ? maxVoltage : hasGnd ? 0 : undefined,
      isGround: hasGnd,
      isPower: hasPower,
      pins: pinKeys.map((k) => {
        const [cId, pId] = k.split(':');
        return { componentId: cId, pinId: pId };
      }),
      wireIds: associatedWireIds,
    });
  });

  // 5. Electrical Rule Check (ERC)
  const warnings: ERCWarning[] = [];

  // Check 5a: Direct Short Circuits (Power Net connected directly to Ground Net with 0-ohm path)
  netGroups.forEach((pinKeys, root) => {
    const isPower = netIsPower.get(root);
    const isGnd = netIsGround.get(root);

    if (isPower && isGnd) {
      // Direct short circuit!
      const compsInNet = Array.from(new Set(pinKeys.map((k) => k.split(':')[0])));
      const shortWireIds = wires
        .filter((w) => dsu.find(pinKey(w.fromComponentId, w.fromPinId)) === root)
        .map((w) => w.id);

      warnings.push({
        id: `erc_short_${root}`,
        severity: 'error',
        title: 'Kritisk feil: Kortslutning (Short Circuit)!',
        message:
          'Spenningskilde (VCC) er koblet direkte til Jord (GND) uten motstand eller belastning. Dette forårsaker overoppheting og skader på utstyret.',
        componentIds: compsInNet,
        wireIds: shortWireIds,
        recommendation:
          'Fjern den direkte forbindelsen mellom VCC og GND, og sett inn en last eller motstand i kretsen.',
      });
    }
  });

  // 6. Component-specific checks & simulation states
  const activeComponents: Record<
    string,
    {
      simActive: boolean;
      simVoltage?: number;
      simCurrent?: number;
      simBurned?: boolean;
      statusText?: string;
    }
  > = {};

  const energizedWireIds = new Set<string>();

  // Check Resistors in the circuit
  const resistorNodes: {
    compId: string;
    resistance: number;
    pin1Root: string;
    pin2Root: string;
  }[] = [];

  components.forEach((comp) => {
    if (comp.typeId === 'resistor') {
      const rVal = Number(comp.properties.resistance) || 330;
      const r1 = dsu.find(pinKey(comp.id, 'pin1'));
      const r2 = dsu.find(pinKey(comp.id, 'pin2'));
      resistorNodes.push({ compId: comp.id, resistance: rVal, pin1Root: r1, pin2Root: r2 });
    }
  });

  // Check LEDs
  components.forEach((comp) => {
    if (comp.typeId === 'led_5mm') {
      const anodeRoot = dsu.find(pinKey(comp.id, 'anode'));
      const cathodeRoot = dsu.find(pinKey(comp.id, 'cathode'));

      const anodeIsPower = netIsPower.get(anodeRoot) ?? false;
      const anodeIsGnd = netIsGround.get(anodeRoot) ?? false;
      const cathodeIsPower = netIsPower.get(cathodeRoot) ?? false;
      const cathodeIsGnd = netIsGround.get(cathodeRoot) ?? false;

      const anodeVolts = netVoltages.get(anodeRoot) || 0;
      const cathodeVolts = netVoltages.get(cathodeRoot) || 0;

      // Check series resistor in path
      // Direct connection to power & gnd through resistor:
      // Case 1: Anode connected to Power, Cathode connected to Resistor which connects to GND
      // Case 2: Anode connected to Resistor which connects to Power, Cathode connected to GND
      let hasSeriesResistor = false;
      let totalSeriesResistance = 0;

      resistorNodes.forEach((res) => {
        if (
          (res.pin1Root === cathodeRoot && netIsGround.get(res.pin2Root)) ||
          (res.pin2Root === cathodeRoot && netIsGround.get(res.pin1Root)) ||
          (res.pin1Root === anodeRoot && netIsPower.get(res.pin2Root)) ||
          (res.pin2Root === anodeRoot && netIsPower.get(res.pin1Root))
        ) {
          hasSeriesResistor = true;
          totalSeriesResistance += res.resistance;
        }
      });

      // Check reverse polarity
      if (anodeIsGnd && cathodeIsPower) {
        warnings.push({
          id: `erc_led_rev_${comp.id}`,
          severity: 'warning',
          title: `Feil polaritet på ${comp.label || 'LED'}`,
          message:
            'Lysdioden er koblet i revers (Anode til jord, Katode til spenning). Dioder leder kun strøm i én retning og vil ikke lyse.',
          componentIds: [comp.id],
          recommendation: 'Snu LED-en eller bytt ledningene slik at Anode (+) kobles til positiv spenning.',
        });
        activeComponents[comp.id] = {
          simActive: false,
          statusText: 'Feil polaritet (sperretilstand)',
        };
        return;
      }

      // Check direct power without resistor
      if (anodeIsPower && cathodeIsGnd && !hasSeriesResistor) {
        const supplyV = anodeVolts || 5.0;
        if (supplyV >= 3.0) {
          // Burned LED!
          warnings.push({
            id: `erc_led_no_resistor_${comp.id}`,
            severity: 'error',
            title: `${comp.label || 'LED'} mangler seriemotstand!`,
            message: `LED er koblet direkte til ${supplyV}V uten motstand. Dette vil ødelegge lysdioden på grunn av overdreven strømtrekk (>100mA).`,
            componentIds: [comp.id],
            recommendation: 'Sett inn en 220Ω eller 330Ω motstand i serie med LED-en.',
          });
          activeComponents[comp.id] = {
            simActive: true,
            simBurned: true,
            simVoltage: supplyV,
            simCurrent: 150,
            statusText: 'Brent ut! (For høy strøm)',
          };
          return;
        }
      }

      // Valid powered circuit with resistor or low voltage
      const forwardDrop = 2.0;
      const isEnergized =
        (anodeIsPower && cathodeIsGnd && hasSeriesResistor) ||
        (hasSeriesResistor &&
          ((anodeIsPower && netIsGround.get(cathodeRoot)) ||
            (cathodeIsGnd && netIsPower.get(anodeRoot))));

      if (isEnergized) {
        const supplyV = Math.max(anodeVolts, 5.0);
        const rValue = totalSeriesResistance || 330;
        const currentMa = Math.round(((supplyV - forwardDrop) / rValue) * 1000);

        activeComponents[comp.id] = {
          simActive: true,
          simVoltage: forwardDrop,
          simCurrent: currentMa,
          statusText: `Lyser normalt (${currentMa} mA)`,
        };

        // Mark energized wires connected to this loop
        wires.forEach((w) => {
          const k1 = pinKey(w.fromComponentId, w.fromPinId);
          const k2 = pinKey(w.toComponentId, w.toPinId);
          const rA = dsu.find(k1);
          const rB = dsu.find(k2);
          if (
            rA === anodeRoot ||
            rB === anodeRoot ||
            rA === cathodeRoot ||
            rB === cathodeRoot
          ) {
            energizedWireIds.add(w.id);
          }
        });
      } else {
        activeComponents[comp.id] = {
          simActive: false,
          statusText: 'Slått av (ingen sluttet krets)',
        };
      }
    }

    // Piezo Buzzer check
    if (comp.typeId === 'piezo_buzzer') {
      const posRoot = dsu.find(pinKey(comp.id, 'pos'));
      const negRoot = dsu.find(pinKey(comp.id, 'neg'));
      const isPosPower = netIsPower.get(posRoot) ?? false;
      const isNegGnd = netIsGround.get(negRoot) ?? false;

      if (isPosPower && isNegGnd) {
        activeComponents[comp.id] = {
          simActive: true,
          simVoltage: netVoltages.get(posRoot) || 5.0,
          statusText: 'Piper (aktiv tone)',
        };
      }
    }

    // Push Button State
    if (comp.typeId === 'pushbutton') {
      const isPressed = buttonPressedStates[comp.id] ?? comp.state?.isPressed ?? false;
      activeComponents[comp.id] = {
        simActive: isPressed,
        statusText: isPressed ? 'Trykket inn (Lukket krets)' : 'Åpen bryter',
      };
    }
  });

  return {
    nets,
    warnings,
    activeComponents,
    energizedWireIds,
  };
}
