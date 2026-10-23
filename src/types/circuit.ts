export type PinType = 'power' | 'ground' | 'digital_io' | 'analog' | 'passive' | 'signal';

export interface PinDefinition {
  id: string;
  name: string;
  type: PinType;
  x: number; // pixel offset from component origin (top-left)
  y: number; // pixel offset from component origin (top-left)
  description?: string;
  voltage?: number; // e.g. 5.0, 3.3, 9.0
  isBreadboardHole?: boolean;
  breadboardGroup?: string; // tie points sharing the same electrical bus
}

export type ComponentCategory =
  | 'Microcontrollers'
  | 'Prototyping'
  | 'Output'
  | 'Input'
  | 'Passive'
  | 'Power'
  | 'Sensors'
  | 'Custom';

export interface ComponentPropertyDef {
  key: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'color';
  options?: { label: string; value: any }[];
  defaultValue: any;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface ComponentDefinition {
  typeId: string;
  name: string;
  category: ComponentCategory;
  width: number;
  height: number;
  description: string;
  datasheetUrl?: string;
  pins: PinDefinition[];
  defaultProperties?: Record<string, any>;
  propertyDefinitions?: ComponentPropertyDef[];
  packageShape?: 'ic' | 'box' | 'custom' | 'builtin';
  customSvgBody?: string;
  customColor?: string;
  isCustom?: boolean;
  libraryId?: string;
  author?: string;
  version?: string;
}

export interface CircuitComponentInstance {
  id: string;
  typeId: string;
  label: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  properties: Record<string, any>;
  notes?: string;
  datasheetUrl?: string;
  state?: {
    isPressed?: boolean; // for push button
    simActive?: boolean; // e.g. LED shining
    simVoltage?: number;
    simCurrent?: number;
    simBurned?: boolean; // blown LED due to overcurrent
  };
}

export interface WireConnection {
  id: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  color: string;
  curvature?: number; // for realistic curved jumper wire sag
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

export interface CircuitProject {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  components: CircuitComponentInstance[];
  wires: WireConnection[];
  notes?: StickyNote[];
}

export interface ExternalLibrary {
  id: string;
  name: string;
  author?: string;
  version: string;
  description: string;
  enabled: boolean;
  components: ComponentDefinition[];
}

export interface ERCWarning {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  componentIds: string[];
  wireIds?: string[];
  recommendation?: string;
}

export interface BOMItem {
  reference: string;
  typeId: string;
  name: string;
  category: string;
  quantity: number;
  specifications: string;
  datasheetUrl?: string;
  instances: CircuitComponentInstance[];
}

export interface ElectricalNet {
  id: string;
  voltage?: number;
  isGround: boolean;
  isPower: boolean;
  pins: { componentId: string; pinId: string }[];
  wireIds: string[];
}

export interface MultimeterReading {
  active: boolean;
  pin1?: { componentId: string; pinId: string; label: string };
  pin2?: { componentId: string; pinId: string; label: string };
  voltage?: number;
  continuity?: boolean;
}
