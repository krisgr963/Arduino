import { ComponentDefinition, PinDefinition } from '../types/circuit';

// Helper to generate Breadboard pins
function generateBreadboardPins(): PinDefinition[] {
  const pins: PinDefinition[] = [];
  const startX = 35;
  const colSpacing = 13;

  // Top Power Rails (+ and -)
  // Positive (+) top
  for (let c = 1; c <= 30; c++) {
    pins.push({
      id: `top_plus_${c}`,
      name: `Top (+) Col ${c}`,
      type: 'power',
      x: startX + (c - 1) * colSpacing,
      y: 18,
      isBreadboardHole: true,
      breadboardGroup: 'bb_top_plus',
      description: 'Øvre positiv spenningsskinne (+)',
    });
  }

  // Negative (-) top
  for (let c = 1; c <= 30; c++) {
    pins.push({
      id: `top_minus_${c}`,
      name: `Top (-) Col ${c}`,
      type: 'ground',
      x: startX + (c - 1) * colSpacing,
      y: 34,
      isBreadboardHole: true,
      breadboardGroup: 'bb_top_minus',
      description: 'Øvre jordskinne (-)',
    });
  }

  // Row A-E (top terminal strip)
  const rowsTop = ['a', 'b', 'c', 'd', 'e'];
  rowsTop.forEach((rowLetter, rIdx) => {
    for (let c = 1; c <= 30; c++) {
      pins.push({
        id: `row_${rowLetter}_${c}`,
        name: `Rad ${rowLetter.toUpperCase()} Kolonne ${c}`,
        type: 'passive',
        x: startX + (c - 1) * colSpacing,
        y: 56 + rIdx * 12,
        isBreadboardHole: true,
        breadboardGroup: `bb_col_${c}_top`,
        description: `Koblingsrad ${rowLetter.toUpperCase()}${c}`,
      });
    }
  });

  // Row F-J (bottom terminal strip)
  const rowsBot = ['f', 'g', 'h', 'i', 'j'];
  rowsBot.forEach((rowLetter, rIdx) => {
    for (let c = 1; c <= 30; c++) {
      pins.push({
        id: `row_${rowLetter}_${c}`,
        name: `Rad ${rowLetter.toUpperCase()} Kolonne ${c}`,
        type: 'passive',
        x: startX + (c - 1) * colSpacing,
        y: 124 + rIdx * 12,
        isBreadboardHole: true,
        breadboardGroup: `bb_col_${c}_bot`,
        description: `Koblingsrad ${rowLetter.toUpperCase()}${c}`,
      });
    }
  });

  // Bottom Power Rails (+ and -)
  // Positive (+) bottom
  for (let c = 1; c <= 30; c++) {
    pins.push({
      id: `bot_plus_${c}`,
      name: `Bunn (+) Col ${c}`,
      type: 'power',
      x: startX + (c - 1) * colSpacing,
      y: 194,
      isBreadboardHole: true,
      breadboardGroup: 'bb_bot_plus',
      description: 'Nedre positiv spenningsskinne (+)',
    });
  }

  // Negative (-) bottom
  for (let c = 1; c <= 30; c++) {
    pins.push({
      id: `bot_minus_${c}`,
      name: `Bunn (-) Col ${c}`,
      type: 'ground',
      x: startX + (c - 1) * colSpacing,
      y: 210,
      isBreadboardHole: true,
      breadboardGroup: 'bb_bot_minus',
      description: 'Nedre jordskinne (-)',
    });
  }

  return pins;
}

export const STANDARD_COMPONENTS: ComponentDefinition[] = [
  // 1. ARDUINO UNO R3
  {
    typeId: 'arduino_uno',
    name: 'Arduino Uno R3',
    category: 'Microcontrollers',
    width: 320,
    height: 220,
    description: 'Klassisk mikrokontroller-kort basert på ATmega328P med 14 digitale I/O-pinner og 6 analoge innganger.',
    datasheetUrl: 'https://docs.arduino.cc/hardware/uno-rev3',
    packageShape: 'builtin',
    defaultProperties: {
      voltage: '5V',
      label: 'ARDUINO1',
    },
    pins: [
      // Top header (Digital 0-13, GND, AREF, SDA, SCL)
      { id: 'scl', name: 'SCL', type: 'digital_io', x: 106, y: 14, description: 'I2C Clock' },
      { id: 'sda', name: 'SDA', type: 'digital_io', x: 119, y: 14, description: 'I2C Data' },
      { id: 'aref', name: 'AREF', type: 'passive', x: 132, y: 14, description: 'Analog referanse' },
      { id: 'gnd_top', name: 'GND', type: 'ground', x: 145, y: 14, voltage: 0, description: 'Jord' },
      { id: 'd13', name: 'D13', type: 'digital_io', x: 158, y: 14, description: 'Digital Pin 13 (Innebygd LED)' },
      { id: 'd12', name: 'D12', type: 'digital_io', x: 171, y: 14, description: 'Digital Pin 12' },
      { id: 'd11', name: 'D11~', type: 'digital_io', x: 184, y: 14, description: 'Digital Pin 11 (PWM)' },
      { id: 'd10', name: 'D10~', type: 'digital_io', x: 197, y: 14, description: 'Digital Pin 10 (PWM)' },
      { id: 'd9', name: 'D9~', type: 'digital_io', x: 210, y: 14, description: 'Digital Pin 9 (PWM)' },
      { id: 'd8', name: 'D8', type: 'digital_io', x: 223, y: 14, description: 'Digital Pin 8' },
      { id: 'd7', name: 'D7', type: 'digital_io', x: 242, y: 14, description: 'Digital Pin 7' },
      { id: 'd6', name: 'D6~', type: 'digital_io', x: 255, y: 14, description: 'Digital Pin 6 (PWM)' },
      { id: 'd5', name: 'D5~', type: 'digital_io', x: 268, y: 14, description: 'Digital Pin 5 (PWM)' },
      { id: 'd4', name: 'D4', type: 'digital_io', x: 281, y: 14, description: 'Digital Pin 4' },
      { id: 'd3', name: 'D3~', type: 'digital_io', x: 294, y: 14, description: 'Digital Pin 3 (PWM)' },
      { id: 'd2', name: 'D2', type: 'digital_io', x: 307, y: 14, description: 'Digital Pin 2' },
      // Bottom header (Power & Analog)
      { id: 'ioref', name: 'IOREF', type: 'passive', x: 145, y: 206, description: 'I/O Reference spenning' },
      { id: 'reset', name: 'RESET', type: 'signal', x: 158, y: 206, description: 'Reset pin' },
      { id: 'v33', name: '3.3V', type: 'power', x: 171, y: 206, voltage: 3.3, description: '3.3V Strømutgang' },
      { id: 'v5', name: '5V', type: 'power', x: 184, y: 206, voltage: 5.0, description: '5.0V Strømutgang' },
      { id: 'gnd_bot1', name: 'GND', type: 'ground', x: 197, y: 206, voltage: 0, description: 'Jord 1' },
      { id: 'gnd_bot2', name: 'GND', type: 'ground', x: 210, y: 206, voltage: 0, description: 'Jord 2' },
      { id: 'vin', name: 'VIN', type: 'power', x: 223, y: 206, description: 'Ekstern spenningsinngang' },
      { id: 'a0', name: 'A0', type: 'analog', x: 242, y: 206, description: 'Analog inngang A0' },
      { id: 'a1', name: 'A1', type: 'analog', x: 255, y: 206, description: 'Analog inngang A1' },
      { id: 'a2', name: 'A2', type: 'analog', x: 268, y: 206, description: 'Analog inngang A2' },
      { id: 'a3', name: 'A3', type: 'analog', x: 281, y: 206, description: 'Analog inngang A3' },
      { id: 'a4', name: 'A4', type: 'analog', x: 294, y: 206, description: 'Analog inngang A4 (SDA)' },
      { id: 'a5', name: 'A5', type: 'analog', x: 307, y: 206, description: 'Analog inngang A5 (SCL)' },
    ],
  },

  // 2. ESP32 DevKit V1
  {
    typeId: 'esp32_devkit',
    name: 'ESP32 DevKit V1',
    category: 'Microcontrollers',
    width: 170,
    height: 270,
    description: '32-bit to-kjerners Wi-Fi & Bluetooth mikrokontroller (NodeMCU-32S kompatibel).',
    datasheetUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf',
    packageShape: 'builtin',
    defaultProperties: {
      voltage: '3.3V',
      label: 'ESP32_1',
    },
    pins: [
      // Left side pins (top to bottom)
      { id: '3v3', name: '3V3', type: 'power', x: 14, y: 35, voltage: 3.3, description: '3.3V regulert strømforsyning' },
      { id: 'en', name: 'EN', type: 'signal', x: 14, y: 50, description: 'Enable / Reset' },
      { id: 'vp', name: 'VP', type: 'analog', x: 14, y: 65, description: 'GPIO 36 / ADC1_CH0' },
      { id: 'vn', name: 'VN', type: 'analog', x: 14, y: 80, description: 'GPIO 39 / ADC1_CH3' },
      { id: 'd34', name: 'D34', type: 'digital_io', x: 14, y: 95, description: 'GPIO 34' },
      { id: 'd35', name: 'D35', type: 'digital_io', x: 14, y: 110, description: 'GPIO 35' },
      { id: 'd32', name: 'D32', type: 'digital_io', x: 14, y: 125, description: 'GPIO 32' },
      { id: 'd33', name: 'D33', type: 'digital_io', x: 14, y: 140, description: 'GPIO 33' },
      { id: 'd25', name: 'D25', type: 'digital_io', x: 14, y: 155, description: 'GPIO 25 / DAC1' },
      { id: 'd26', name: 'D26', type: 'digital_io', x: 14, y: 170, description: 'GPIO 26 / DAC2' },
      { id: 'd27', name: 'D27', type: 'digital_io', x: 14, y: 185, description: 'GPIO 27' },
      { id: 'd14', name: 'D14', type: 'digital_io', x: 14, y: 200, description: 'GPIO 14' },
      { id: 'd12', name: 'D12', type: 'digital_io', x: 14, y: 215, description: 'GPIO 12' },
      { id: 'd13', name: 'D13', type: 'digital_io', x: 14, y: 230, description: 'GPIO 13' },
      { id: 'gnd_l', name: 'GND', type: 'ground', x: 14, y: 245, voltage: 0, description: 'Jord' },

      // Right side pins (top to bottom)
      { id: 'vin', name: 'VIN', type: 'power', x: 156, y: 35, voltage: 5.0, description: '5V USB / Ekstern forsyning' },
      { id: 'gnd_r', name: 'GND', type: 'ground', x: 156, y: 50, voltage: 0, description: 'Jord' },
      { id: 'd15', name: 'D15', type: 'digital_io', x: 156, y: 65, description: 'GPIO 15' },
      { id: 'd2', name: 'D2', type: 'digital_io', x: 156, y: 80, description: 'GPIO 2 (Innebygd Blå LED)' },
      { id: 'd4', name: 'D4', type: 'digital_io', x: 156, y: 95, description: 'GPIO 4' },
      { id: 'd16', name: 'RX2', type: 'digital_io', x: 156, y: 110, description: 'GPIO 16 / RX2' },
      { id: 'd17', name: 'TX2', type: 'digital_io', x: 156, y: 125, description: 'GPIO 17 / TX2' },
      { id: 'd5', name: 'D5', type: 'digital_io', x: 156, y: 140, description: 'GPIO 5' },
      { id: 'd18', name: 'D18', type: 'digital_io', x: 156, y: 155, description: 'GPIO 18 / SCK' },
      { id: 'd19', name: 'D19', type: 'digital_io', x: 156, y: 170, description: 'GPIO 19 / MISO' },
      { id: 'd21', name: 'D21', type: 'digital_io', x: 156, y: 185, description: 'GPIO 21 / SDA' },
      { id: 'd22', name: 'D22', type: 'digital_io', x: 156, y: 200, description: 'GPIO 22 / SCL' },
      { id: 'd23', name: 'D23', type: 'digital_io', x: 156, y: 215, description: 'GPIO 23 / MOSI' },
    ],
  },

  // 3. KOBLINGSBRETT (Breadboard Half-size 400 tie-points)
  {
    typeId: 'breadboard_half',
    name: 'Koblingsbrett (400 hull)',
    category: 'Prototyping',
    width: 445,
    height: 228,
    description: 'Halv-størrelse prototypingsbrett med to strømskinner (+/-) og 30 sammenkoblede 5-punkts rekker.',
    packageShape: 'builtin',
    defaultProperties: {
      label: 'BB1',
    },
    pins: generateBreadboardPins(),
  },

  // 4. LED 5mm
  {
    typeId: 'led_5mm',
    name: 'Lysdiode (LED 5mm)',
    category: 'Output',
    width: 60,
    height: 70,
    description: 'Standard 5mm lysdiode. Krever en seriemotstand for å beskytte mot for høy strøm.',
    datasheetUrl: 'https://en.wikipedia.org/wiki/Light-emitting_diode',
    packageShape: 'builtin',
    defaultProperties: {
      color: '#ef4444',
      label: 'LED1',
      forwardVoltage: 2.0,
      maxCurrentMa: 25,
    },
    propertyDefinitions: [
      {
        key: 'color',
        label: 'LED Farge',
        type: 'select',
        defaultValue: '#ef4444',
        options: [
          { label: 'Rød (Red)', value: '#ef4444' },
          { label: 'Grønn (Green)', value: '#22c55e' },
          { label: 'Blå (Blue)', value: '#3b82f6' },
          { label: 'Gul (Yellow)', value: '#eab308' },
          { label: 'Oransje (Orange)', value: '#f97316' },
          { label: 'Hvit (White)', value: '#f8fafc' },
        ],
      },
    ],
    pins: [
      { id: 'anode', name: 'Anode (+)', type: 'passive', x: 20, y: 62, description: 'Langt ben (+ / Positiv spenning)' },
      { id: 'cathode', name: 'Katode (-)', type: 'passive', x: 40, y: 62, description: 'Kort ben (- / Flat kant / Jord)' },
    ],
  },

  // 5. MOTSTAND (Resistor)
  {
    typeId: 'resistor',
    name: 'Motstand (1/4W)',
    category: 'Passive',
    width: 90,
    height: 32,
    description: 'Gjennomhulls karbonfilmmotstand med fargebånd for strømbegrensning eller spenningsdeler.',
    datasheetUrl: 'https://en.wikipedia.org/wiki/Resistor',
    packageShape: 'builtin',
    defaultProperties: {
      resistance: 330,
      label: 'R1',
    },
    propertyDefinitions: [
      {
        key: 'resistance',
        label: 'Motstandsverdi (Ω)',
        type: 'select',
        defaultValue: 330,
        options: [
          { label: '100 Ω', value: 100 },
          { label: '220 Ω (LED standard)', value: 220 },
          { label: '330 Ω (LED 5V)', value: 330 },
          { label: '470 Ω', value: 470 },
          { label: '1 kΩ (Pull-up/down)', value: 1000 },
          { label: '4.7 kΩ (I2C pullup)', value: 4700 },
          { label: '10 kΩ (Standard pullup)', value: 10000 },
          { label: '100 kΩ', value: 100000 },
        ],
      },
    ],
    pins: [
      { id: 'pin1', name: 'Pinne 1', type: 'passive', x: 4, y: 16, description: 'Terminal 1' },
      { id: 'pin2', name: 'Pinne 2', type: 'passive', x: 86, y: 16, description: 'Terminal 2' },
    ],
  },

  // 6. TRYKKNAPP (Tactile Push Button)
  {
    typeId: 'pushbutton',
    name: 'Trykknapp (Taktil)',
    category: 'Input',
    width: 60,
    height: 60,
    description: 'Midlertidig trykkbryter (momentary switch). Kobler sammen de to sidene når den trykkes.',
    datasheetUrl: 'https://en.wikipedia.org/wiki/Push-button',
    packageShape: 'builtin',
    defaultProperties: {
      label: 'SW1',
    },
    pins: [
      { id: 'pin1a', name: '1A', type: 'passive', x: 8, y: 12, description: 'Pol 1 (Intern koblet til 1B)' },
      { id: 'pin1b', name: '1B', type: 'passive', x: 8, y: 48, description: 'Pol 1 (Intern koblet til 1A)' },
      { id: 'pin2a', name: '2A', type: 'passive', x: 52, y: 12, description: 'Pol 2 (Intern koblet til 2B)' },
      { id: 'pin2b', name: '2B', type: 'passive', x: 52, y: 48, description: 'Pol 2 (Intern koblet til 2A)' },
    ],
  },

  // 7. 9V BATTERI
  {
    typeId: 'battery_9v',
    name: '9V Batteri',
    category: 'Power',
    width: 80,
    height: 126,
    description: 'Standard 9V alkalisk blokkbatteri (PP3) med snap-kontakter.',
    datasheetUrl: 'https://en.wikipedia.org/wiki/Nine-volt_battery',
    packageShape: 'builtin',
    defaultProperties: {
      voltage: 9.0,
      label: 'BAT1',
    },
    pins: [
      { id: 'pos', name: '+ (9V)', type: 'power', x: 26, y: 14, voltage: 9.0, description: 'Positiv pol (+9V)' },
      { id: 'neg', name: '- (GND)', type: 'ground', x: 54, y: 14, voltage: 0, description: 'Negativ pol (Jord / 0V)' },
    ],
  },

  // 8. AA BATTERIPAKKE (4.5V / 3xAA)
  {
    typeId: 'battery_aa_pack',
    name: 'Batteripakke (4.5V 3xAA)',
    category: 'Power',
    width: 120,
    height: 80,
    description: 'Batteriholder med 3x 1.5V AA-batterier som gir totalt 4.5V likestrøm.',
    packageShape: 'builtin',
    defaultProperties: {
      voltage: 4.5,
      label: 'BAT_AA',
    },
    pins: [
      { id: 'pos', name: '+ (4.5V)', type: 'power', x: 110, y: 25, voltage: 4.5, description: 'Positiv rød ledning (+4.5V)' },
      { id: 'neg', name: '- (GND)', type: 'ground', x: 110, y: 55, voltage: 0, description: 'Negativ sort ledning (Jord)' },
    ],
  },

  // 9. POTENSIOMETER (10kΩ Rotary)
  {
    typeId: 'potentiometer',
    name: 'Potensiometer (10kΩ)',
    category: 'Input',
    width: 70,
    height: 80,
    description: 'Roterbart potensiometer med 3 pinner for å justere spenning eller analogt signal.',
    packageShape: 'builtin',
    defaultProperties: {
      maxResistance: 10000,
      valueRatio: 0.5,
      label: 'POT1',
    },
    propertyDefinitions: [
      {
        key: 'valueRatio',
        label: 'Slider posisjon (0 - 1)',
        type: 'number',
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
    pins: [
      { id: 'pin1', name: 'Pinne 1 (VCC/IN)', type: 'passive', x: 15, y: 70, description: 'Endepinne 1' },
      { id: 'wiper', name: 'Wiper (Sveiper)', type: 'analog', x: 35, y: 70, description: 'Sentral justerbar spenningsdeler' },
      { id: 'pin2', name: 'Pinne 3 (GND)', type: 'passive', x: 55, y: 70, description: 'Endepinne 2' },
    ],
  },

  // 10. PIEZO BUZZER
  {
    typeId: 'piezo_buzzer',
    name: 'Piezo Summer (Buzzer)',
    category: 'Output',
    width: 65,
    height: 65,
    description: 'Akustisk piezo-element som genererer lyd ved tilkoblet likespenning eller PWM.',
    packageShape: 'builtin',
    defaultProperties: {
      label: 'BZ1',
      nominalVoltage: 5.0,
    },
    pins: [
      { id: 'pos', name: '+ (Positiv)', type: 'passive', x: 22, y: 56, description: 'Positiv terminal (+)' },
      { id: 'neg', name: '- (GND)', type: 'passive', x: 43, y: 56, description: 'Negativ terminal (-)' },
    ],
  },

  // 11. SKYVEBRYTER (Slide Switch SPDT)
  {
    typeId: 'slide_switch',
    name: 'Skyvebryter (SPDT)',
    category: 'Input',
    width: 70,
    height: 38,
    description: 'En-polet vekselbryter med 3 pinner (Common, A, B) for å slå av/på kretser.',
    packageShape: 'builtin',
    defaultProperties: {
      label: 'SW_SLIDE',
      activePosition: 'A', // 'A' or 'B'
    },
    propertyDefinitions: [
      {
        key: 'activePosition',
        label: 'Bryterposisjon',
        type: 'select',
        defaultValue: 'A',
        options: [
          { label: 'Posisjon A (Venstre)', value: 'A' },
          { label: 'Posisjon B (Høyre)', value: 'B' },
        ],
      },
    ],
    pins: [
      { id: 'pin_a', name: 'Pinne A', type: 'passive', x: 15, y: 32, description: 'Kontakt A' },
      { id: 'common', name: 'Common (C)', type: 'passive', x: 35, y: 32, description: 'Felles kontakt' },
      { id: 'pin_b', name: 'Pinne B', type: 'passive', x: 55, y: 32, description: 'Kontakt B' },
    ],
  },
];
