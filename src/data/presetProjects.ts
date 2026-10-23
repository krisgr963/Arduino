import { CircuitProject } from '../types/circuit';

export const PRESET_PROJECTS: CircuitProject[] = [
  // 1. Interactive Button + LED + 9V Battery Circuit
  {
    id: 'preset_button_led_battery',
    name: 'Interaktiv LED med Trykknapp & 9V Batteri',
    description:
      'Komplett krets på koblingsbrett med 9V batteri, taktil trykknapp, 330Ω seriemotstand og rød 5mm LED. Trykk på knappen under simulering for å lukke kretsen og tenne lysdioden!',
    version: '1.0.0',
    createdAt: '2026-10-23T12:00:00Z',
    updatedAt: '2026-10-23T12:00:00Z',
    components: [
      {
        id: 'bb_1',
        typeId: 'breadboard_half',
        label: 'Koblingsbrett (400)',
        x: 320,
        y: 180,
        rotation: 0,
        properties: {},
        notes: 'Halv-størrelse koblingsbrett med felles strømskinner og 30 kolonner.',
      },
      {
        id: 'bat_1',
        typeId: 'battery_9v',
        label: '9V Batteri',
        x: 140,
        y: 190,
        rotation: 0,
        properties: { voltage: 9.0 },
        notes: 'Alkalisk 9V batteri som strømforsyning for hele kretsen.',
      },
      {
        id: 'btn_1',
        typeId: 'pushbutton',
        label: 'Trykknapp SW1',
        x: 480,
        y: 220,
        rotation: 0,
        properties: {},
        notes: 'Taktil trykkbryter som slutter kretsen når den holdes nede.',
      },
      {
        id: 'res_1',
        typeId: 'resistor',
        label: 'R1 (330Ω)',
        x: 580,
        y: 230,
        rotation: 0,
        properties: { resistance: 330 },
        notes: 'Strømbegrensende motstand på 330Ω som beskytter LED-en mot overspenning.',
      },
      {
        id: 'led_1',
        typeId: 'led_5mm',
        label: 'LED Rød',
        x: 690,
        y: 210,
        rotation: 0,
        properties: { color: '#ef4444' },
        notes: 'Standard 5mm rød lysdiode med 2.0V fremspenning.',
      },
    ],
    wires: [
      // Battery (+) to Button pin 1A
      {
        id: 'w_bat_pos',
        fromComponentId: 'bat_1',
        fromPinId: 'pos',
        toComponentId: 'btn_1',
        toPinId: 'pin1a',
        color: '#dc2626', // Red
        curvature: -25,
      },
      // Button pin 2A to Resistor pin 1
      {
        id: 'w_btn_to_res',
        fromComponentId: 'btn_1',
        fromPinId: 'pin2a',
        toComponentId: 'res_1',
        toPinId: 'pin1',
        color: '#f59e0b', // Amber
        curvature: 15,
      },
      // Resistor pin 2 to LED Anode
      {
        id: 'w_res_to_led',
        fromComponentId: 'res_1',
        fromPinId: 'pin2',
        toComponentId: 'led_1',
        toPinId: 'anode',
        color: '#10b981', // Green
        curvature: -15,
      },
      // LED Cathode back to Battery (-)
      {
        id: 'w_led_to_bat_neg',
        fromComponentId: 'led_1',
        fromPinId: 'cathode',
        toComponentId: 'bat_1',
        toPinId: 'neg',
        color: '#1e293b', // Black / Dark Slate
        curvature: 45,
      },
    ],
    notes: [
      {
        id: 'note_1',
        x: 460,
        y: 90,
        width: 250,
        height: 70,
        text: 'Tips: Klikk på "Kjør simulering", deretter klikk på trykknappen for å se kretsen lyse opp i sanntid!',
        color: '#fef08a',
      },
    ],
  },

  // 2. Arduino Uno + Breadboard Starter
  {
    id: 'preset_arduino_starter',
    name: 'Arduino Uno R3 Strømoppsett',
    description:
      'Arduino Uno R3 koblet til et koblingsbrett med 5V og GND matet til skinnene, samt en 220Ω motstand og grønn LED.',
    version: '1.0.0',
    createdAt: '2026-10-23T12:00:00Z',
    updatedAt: '2026-10-23T12:00:00Z',
    components: [
      {
        id: 'ard_1',
        typeId: 'arduino_uno',
        label: 'Arduino Uno R3',
        x: 120,
        y: 160,
        rotation: 0,
        properties: { voltage: '5V' },
        notes: 'ATmega328P mikrokontroller. Koblet til USB for 5V logikkspenning.',
      },
      {
        id: 'bb_2',
        typeId: 'breadboard_half',
        label: 'Koblingsbrett',
        x: 480,
        y: 160,
        rotation: 0,
        properties: {},
      },
      {
        id: 'res_2',
        typeId: 'resistor',
        label: 'R1 (220Ω)',
        x: 550,
        y: 220,
        rotation: 0,
        properties: { resistance: 220 },
      },
      {
        id: 'led_2',
        typeId: 'led_5mm',
        label: 'LED Grønn',
        x: 670,
        y: 200,
        rotation: 0,
        properties: { color: '#22c55e' },
      },
    ],
    wires: [
      // Arduino 5V to Resistor pin1
      {
        id: 'w_ard_5v',
        fromComponentId: 'ard_1',
        fromPinId: 'v5',
        toComponentId: 'res_2',
        toPinId: 'pin1',
        color: '#dc2626',
        curvature: -30,
      },
      // Resistor pin2 to LED Anode
      {
        id: 'w_res_led',
        fromComponentId: 'res_2',
        fromPinId: 'pin2',
        toComponentId: 'led_2',
        toPinId: 'anode',
        color: '#f59e0b',
        curvature: 15,
      },
      // LED Cathode to Arduino GND
      {
        id: 'w_led_gnd',
        fromComponentId: 'led_2',
        fromPinId: 'cathode',
        toComponentId: 'ard_1',
        toPinId: 'gnd_bot1',
        color: '#0f172a',
        curvature: 40,
      },
    ],
    notes: [
      {
        id: 'note_ard',
        x: 150,
        y: 70,
        width: 270,
        height: 65,
        text: 'Arduino leverer stabil 5.0V via USB. Med 220Ω seriemotstand trekker LED-en trygge ~13.6 mA.',
        color: '#bae6fd',
      },
    ],
  },

  // 3. Validation / ERC Test Circuit
  {
    id: 'preset_erc_test',
    name: 'Feilkrets (Demonstrasjon av ERC & Validering)',
    description:
      'Inneholder bevisste kretsfeil: En blå LED koblet direkte til 9V uten motstand (vil brenne ut!), samt en kortsluttet gren. Åpne "Validering & ERC"-panelet for å se advarslene.',
    version: '1.0.0',
    createdAt: '2026-10-23T12:00:00Z',
    updatedAt: '2026-10-23T12:00:00Z',
    components: [
      {
        id: 'bat_err',
        typeId: 'battery_9v',
        label: '9V Kilde',
        x: 180,
        y: 190,
        rotation: 0,
        properties: { voltage: 9.0 },
      },
      {
        id: 'led_danger',
        typeId: 'led_5mm',
        label: 'Ubeskyttet LED',
        x: 390,
        y: 200,
        rotation: 0,
        properties: { color: '#3b82f6' },
      },
    ],
    wires: [
      {
        id: 'w_danger_pos',
        fromComponentId: 'bat_err',
        fromPinId: 'pos',
        toComponentId: 'led_danger',
        toPinId: 'anode',
        color: '#dc2626',
        curvature: -20,
      },
      {
        id: 'w_danger_neg',
        fromComponentId: 'bat_err',
        fromPinId: 'neg',
        toComponentId: 'led_danger',
        toPinId: 'cathode',
        color: '#0f172a',
        curvature: 20,
      },
    ],
    notes: [
      {
        id: 'note_warn',
        x: 230,
        y: 90,
        width: 300,
        height: 70,
        text: 'Se varsellampen øverst i verktøylinjen! ERC-motoren oppdager automatisk at LED-en mangler seriemotstand og vil ødelegges.',
        color: '#fecaca',
      },
    ],
  },
];
