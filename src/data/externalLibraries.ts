import { ComponentDefinition, ExternalLibrary } from '../types/circuit';
import { STANDARD_COMPONENTS } from './standardComponents';

export const SAMPLE_SENSOR_LIBRARY: ExternalLibrary = {
  id: 'lib_sensors_modules',
  name: 'Sensorer & I2C Modul-pakke',
  author: 'CircuLab Community',
  version: '1.2.0',
  description: 'Populære moduler for Arduino & ESP32: Ultralydsensor, I2C OLED display, Relé og LDR lyssensor.',
  enabled: true,
  components: [
    // 1. HC-SR04 Ultrasonic Distance Sensor
    {
      typeId: 'hc_sr04',
      name: 'HC-SR04 Ultralydsensor',
      category: 'Sensors',
      width: 130,
      height: 70,
      description: 'Ultralyd avstandsmåler med rekkevidde 2cm - 400cm.',
      datasheetUrl: 'https://www.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf',
      packageShape: 'builtin',
      libraryId: 'lib_sensors_modules',
      defaultProperties: {
        label: 'US1',
        readingCm: 25,
      },
      pins: [
        { id: 'vcc', name: 'VCC (5V)', type: 'power', x: 26, y: 62, voltage: 5.0, description: '5V Strømtilførsel' },
        { id: 'trig', name: 'TRIG', type: 'digital_io', x: 50, y: 62, description: 'Trig puls inngang' },
        { id: 'echo', name: 'ECHO', type: 'digital_io', x: 80, y: 62, description: 'Echo returpuls utgang' },
        { id: 'gnd', name: 'GND', type: 'ground', x: 104, y: 62, voltage: 0, description: 'Jord' },
      ],
    },
    // 2. 0.96" OLED I2C Display (SSD1306)
    {
      typeId: 'oled_i2c_096',
      name: 'OLED Display 0.96" I2C',
      category: 'Output',
      width: 100,
      height: 100,
      description: '128x64 piksler monokrom I2C OLED skjerm med SSD1306 kontroller.',
      datasheetUrl: 'https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf',
      packageShape: 'builtin',
      libraryId: 'lib_sensors_modules',
      defaultProperties: {
        label: 'DISP1',
        displayText: 'CircuLab v1.0',
      },
      pins: [
        { id: 'gnd', name: 'GND', type: 'ground', x: 25, y: 14, voltage: 0, description: 'Jord' },
        { id: 'vcc', name: 'VCC (3.3-5V)', type: 'power', x: 42, y: 14, voltage: 5.0, description: 'Strømforsyning' },
        { id: 'scl', name: 'SCL', type: 'digital_io', x: 58, y: 14, description: 'I2C Klokke' },
        { id: 'sda', name: 'SDA', type: 'digital_io', x: 75, y: 14, description: 'I2C Data' },
      ],
    },
    // 3. 5V Relay Module (Relé)
    {
      typeId: 'relay_5v_module',
      name: '5V Relé-modul (1-Kanal)',
      category: 'Output',
      width: 110,
      height: 75,
      description: 'Elektromekanisk relé med optokopler for styring av 230V nettspenning.',
      datasheetUrl: 'https://components101.com/switches/5v-single-channel-relay-module-pinout-features',
      packageShape: 'builtin',
      libraryId: 'lib_sensors_modules',
      defaultProperties: {
        label: 'RELAY1',
        state: 'open',
      },
      pins: [
        { id: 'vcc', name: 'VCC', type: 'power', x: 12, y: 22, voltage: 5.0, description: '5V spenning' },
        { id: 'in', name: 'IN', type: 'signal', x: 12, y: 38, description: 'Styresignal (Aktiv Lav/Høy)' },
        { id: 'gnd', name: 'GND', type: 'ground', x: 12, y: 54, voltage: 0, description: 'Jord' },
        { id: 'no', name: 'NO', type: 'passive', x: 98, y: 22, description: 'Normally Open' },
        { id: 'com', name: 'COM', type: 'passive', x: 98, y: 38, description: 'Common' },
        { id: 'nc', name: 'NC', type: 'passive', x: 98, y: 54, description: 'Normally Closed' },
      ],
    },
    // 4. LDR Lyssensor Modul
    {
      typeId: 'ldr_module',
      name: 'LDR Lyssensor Modul',
      category: 'Sensors',
      width: 90,
      height: 60,
      description: 'Lysavhengig motstand med LM393 komparator for analog og digital utgang.',
      packageShape: 'builtin',
      libraryId: 'lib_sensors_modules',
      defaultProperties: {
        label: 'LDR1',
      },
      pins: [
        { id: 'vcc', name: 'VCC', type: 'power', x: 12, y: 15, voltage: 5.0, description: '3.3V - 5V' },
        { id: 'gnd', name: 'GND', type: 'ground', x: 12, y: 27, voltage: 0, description: 'Jord' },
        { id: 'do', name: 'DO', type: 'digital_io', x: 12, y: 39, description: 'Digital terskelutgang' },
        { id: 'ao', name: 'AO', type: 'analog', x: 12, y: 51, description: 'Analog lysverdi' },
      ],
    },
  ],
};

const STORAGE_KEY_LIBRARIES = 'circulab_external_libraries';
const STORAGE_KEY_CUSTOM_COMPONENTS = 'circulab_custom_components';

export function loadStoredLibraries(): ExternalLibrary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIBRARIES);
    if (!raw) {
      // Seed with sample library on first run
      const initial = [SAMPLE_SENSOR_LIBRARY];
      localStorage.setItem(STORAGE_KEY_LIBRARIES, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [SAMPLE_SENSOR_LIBRARY];
  } catch (err) {
    console.error('Error loading external libraries:', err);
    return [SAMPLE_SENSOR_LIBRARY];
  }
}

export function saveStoredLibraries(libraries: ExternalLibrary[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LIBRARIES, JSON.stringify(libraries));
  } catch (err) {
    console.error('Error saving external libraries:', err);
  }
}

export function loadStoredCustomComponents(): ComponentDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_COMPONENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading custom components:', err);
    return [];
  }
}

export function saveStoredCustomComponent(comp: ComponentDefinition): ComponentDefinition[] {
  try {
    const list = loadStoredCustomComponents();
    const idx = list.findIndex((c) => c.typeId === comp.typeId);
    let updated: ComponentDefinition[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = comp;
    } else {
      updated = [comp, ...list];
    }
    localStorage.setItem(STORAGE_KEY_CUSTOM_COMPONENTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving custom component:', err);
    return [];
  }
}

export function deleteStoredCustomComponent(typeId: string): ComponentDefinition[] {
  try {
    const list = loadStoredCustomComponents();
    const updated = list.filter((c) => c.typeId !== typeId);
    localStorage.setItem(STORAGE_KEY_CUSTOM_COMPONENTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting custom component:', err);
    return [];
  }
}

// Combine all available components: Standard + Enabled External Libraries + Custom Components
export function getAllAvailableComponents(
  externalLibraries: ExternalLibrary[],
  customComponents: ComponentDefinition[]
): ComponentDefinition[] {
  const map = new Map<string, ComponentDefinition>();

  // 1. Standard
  STANDARD_COMPONENTS.forEach((c) => map.set(c.typeId, c));

  // 2. External active libraries
  externalLibraries
    .filter((lib) => lib.enabled)
    .forEach((lib) => {
      lib.components.forEach((c) => {
        map.set(c.typeId, { ...c, libraryId: lib.id });
      });
    });

  // 3. User custom components (highest priority)
  customComponents.forEach((c) => {
    map.set(c.typeId, { ...c, isCustom: true });
  });

  return Array.from(map.values());
}

// Validate external library JSON structure
export function validateLibraryJson(data: any): { valid: boolean; error?: string; library?: ExternalLibrary } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Ugyldig fil: JSON må være et objekt.' };
  }
  if (!data.name || typeof data.name !== 'string') {
    return { valid: false, error: 'Biblioteket må ha et gyldig "name"-felt.' };
  }
  if (!Array.isArray(data.components) || data.components.length === 0) {
    return { valid: false, error: 'Biblioteket må inneholde en ikke-tom "components"-liste.' };
  }

  // Validate each component
  for (let i = 0; i < data.components.length; i++) {
    const comp = data.components[i];
    if (!comp.typeId || !comp.name || !Array.isArray(comp.pins)) {
      return {
        valid: false,
        error: `Komponent #${i + 1} (${comp.name || 'ukjent'}) mangler typeId, navn eller pinner.`,
      };
    }
  }

  const lib: ExternalLibrary = {
    id: data.id || `lib_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    author: data.author || 'Ukjent forfatter',
    version: data.version || '1.0.0',
    description: data.description || 'Importert komponentbibliotek',
    enabled: true,
    components: data.components,
  };

  return { valid: true, library: lib };
}
