export type PinType = 'power' | 'ground' | 'digital_io' | 'analog' | 'passive' | 'signal';

export type AlignmentType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

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
  tags?: string[];
}

export interface CircuitLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  description?: string;
  isDefault?: boolean;
}

export const DEFAULT_LAYERS: CircuitLayer[] = [
  {
    id: 'layer_components',
    name: 'Komponenter',
    color: '#3b82f6',
    visible: true,
    locked: false,
    description: 'Mikrokontrollere, sensorer, IC-er og passive komponenter',
    isDefault: true,
  },
  {
    id: 'layer_wires',
    name: 'Ledninger & Koblinger',
    color: '#10b981',
    visible: true,
    locked: false,
    description: 'Kretsbaner og koblingsledninger mellom pinner',
    isDefault: true,
  },
  {
    id: 'layer_notes',
    name: 'Notater & Klistrelapper',
    color: '#f59e0b',
    visible: true,
    locked: false,
    description: 'Gule klistrelapper og dokumentasjonsmerknader',
    isDefault: true,
  },
];

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
  layerId?: string; // ID of the layer this component belongs to (defaults to layer_components)
  state?: {
    isPressed?: boolean; // for push button
    simActive?: boolean; // e.g. LED shining
    simVoltage?: number;
    simVoltageCh2?: number;
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
  layerId?: string; // ID of the layer this wire belongs to (defaults to layer_wires)
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  layerId?: string; // ID of the layer this note belongs to (defaults to layer_notes)
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
  layers?: CircuitLayer[];
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
