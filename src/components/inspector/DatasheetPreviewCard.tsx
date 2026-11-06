import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  FileText,
  Eye,
  Zap,
  CheckCircle,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Globe,
  Radio,
  Clock,
  Gauge,
  Image as ImageIcon,
  Compass,
  RefreshCw,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { ComponentDefinition, CircuitComponentInstance } from '../../types/circuit';
import { Tooltip } from '../common/Tooltip';

interface DatasheetExcerpt {
  title: string;
  subTitle: string;
  provider: string;
  providerType: 'official' | 'community' | 'pdf' | 'wiki' | 'web';
  operatingVoltage: string;
  operatingCurrent: string;
  clockSpeedOrFreq?: string;
  packageType: string;
  summary: string;
  highlights: string[];
  pinSummary: string;
}

// Built-in curated technical data for popular standard hardware components
const CURATED_EXCERPTS: Record<string, DatasheetExcerpt> = {
  arduino_uno: {
    title: 'ATmega328P Microcontroller Board',
    subTitle: 'Arduino Uno Rev3 Datablad & Teknisk Referanse',
    provider: 'Arduino Docs Official',
    providerType: 'official',
    operatingVoltage: '5V (Anbefalt Vin: 7V - 12V)',
    operatingCurrent: 'Maks 20 mA per I/O-pinne (50 mA for 3.3V pin)',
    clockSpeedOrFreq: '16 MHz Keramisk Resonator',
    packageType: 'ATmega328P-PU (DIP-28 / TQFP-32)',
    summary:
      'Arduino Uno Rev3 er basert på Microchip ATmega328P. Den har 14 digitale inn-/utgangspinner (hvorav 6 støtter PWM), 6 analoge innganger, en 16 MHz resonator, USB-tilkobling, en strømplugg, en ICSP-kontakt og en resetknapp.',
    highlights: [
      'Flash-minne: 32 KB (0.5 KB brukt av bootloader)',
      'SRAM: 2 KB | EEPROM: 1 KB',
      'PWM-kanaler: D3, D5, D6, D9, D10, D11 (490Hz / 980Hz)',
      'Innebygd LED koblet til D13',
      'I2C: A4 (SDA) og A5 (SCL) | SPI: D10 (SS), D11 (MOSI), D12 (MISO), D13 (SCK)',
    ],
    pinSummary: '14 digitale pinner, 6 analoge innganger, 5V, 3.3V, VIN, 3x GND',
  },
  esp32_devkit: {
    title: 'ESP32-WROOM-32 Wi-Fi & BT MCU SoC',
    subTitle: 'Espressif Systems Datablad & Spesifikasjoner',
    provider: 'Espressif Systems',
    providerType: 'official',
    operatingVoltage: '3.0V - 3.6V (Normalt 3.3V, 5V via USB/VIN)',
    operatingCurrent: 'Typisk 80 - 240 mA (Peak opptil 500 mA under RF TX)',
    clockSpeedOrFreq: 'Opptil 240 MHz Dual Core Xtensa LX6',
    packageType: 'ESP-WROOM-32 (QFN-48 / 38-pin DevKit)',
    summary:
      'ESP32 er en lavstrøms 32-bits to-kjerners mikrokontroller med integrert 802.11 b/g/n Wi-Fi og Bluetooth v4.2 BR/EDR & BLE. Den er ideell for IoT-sensorer, nettverksprosjekter og sanntids datainnsamling.',
    highlights: [
      'Minne: 520 KB intern SRAM | 4 MB ekstern SPI Flash',
      'Wi-Fi: 802.11 b/g/n (opptil 150 Mbps)',
      'Bluetooth: v4.2 BR/EDR og Bluetooth Low Energy (BLE)',
      '12-bit SAR ADC (opptil 18 kanaler), 2x 8-bit DAC',
      'Kapasitive berøringssensorer på 10 pinner',
    ],
    pinSummary: '30/38 pinner: 25x GPIO, 2x UART, 2x I2C, 3x SPI, ADC, DAC',
  },
  ic_555: {
    title: 'NE555 Precision Timer IC',
    subTitle: 'Texas Instruments / Signetics Datablad',
    provider: 'TI Official Datasheet',
    providerType: 'pdf',
    operatingVoltage: '4.5V til 15V (Maks 18V)',
    operatingCurrent: 'Typisk 3 mA til 10 mA (ved 5V forsyning)',
    clockSpeedOrFreq: 'Opptil 500 kHz stabil oscillasjon',
    packageType: 'DIP-8 (8-pin Dual In-line Package)',
    summary:
      'NE555 er en presisjonstimer som kan operere i monostabil (one-shot) eller astabil (oscillator) modus. I astabil modus bestemmes frekvens og driftssyklus nøyaktig av to eksterne motstander (Ra, Rb) og én kondensator (C1).',
    highlights: [
      'Timing fra mikrosekunder til timer',
      'Justerbar driftssyklus (Duty Cycle)',
      'Utgang kan synke eller kilde opptil 200 mA',
      'TTL-kompatibel utgang ved 5V forsyning',
      'Formel: f = 1.44 / ((Ra + 2*Rb) * C)',
    ],
    pinSummary: '1: GND, 2: TRIG, 3: OUT, 4: RESET, 5: CTRL, 6: THRESH, 7: DISCH, 8: VCC',
  },
  breadboard_half: {
    title: 'Solderless Half-Size Breadboard (400 Tie-Points)',
    subTitle: 'Prototyping Koblingsbrett Spesifikasjon',
    provider: 'CircuLab Hardware Guide',
    providerType: 'community',
    operatingVoltage: 'Maks 36V DC / 300V testspenning',
    operatingCurrent: 'Maks 2A kontinuerlig per stripe',
    packageType: '400 tie-points (30 rader x 5 hull x 2 terminalstriper)',
    summary:
      'Loddefritt eksperimentkort for hurtig prototyping. Har en sentral "kløft" (ravine) med 0.3" avstand ideell for DIP IC-er, flankert av to strømskinner for VCC (+) og GND (-).',
    highlights: [
      'Standard 2.54 mm (0.1") pinneavstand',
      'Fjærende fosforbronse-kontakter for god holdekraft',
      'Merking A-J for rader og 1-30 for kolonner',
      'Separate positive og negative strømskinner i topp og bunn',
    ],
    pinSummary: '300 terminalpunkter (Rad A-E & F-J) + 100 strømskinnehull',
  },
  hc_sr04: {
    title: 'HC-SR04 Ultrasonic Distance Sensor Module',
    subTitle: 'Ultralyd Avstandsmåler Datablad',
    provider: 'Elecfreaks / SparkFun',
    providerType: 'pdf',
    operatingVoltage: '5.0V DC (Driftsspenning)',
    operatingCurrent: 'Arbeidsstrøm: 15 mA | Standby: < 2 mA',
    clockSpeedOrFreq: '40 kHz Ultralydfrekvens',
    packageType: '4-pin Modul (VCC, TRIG, ECHO, GND)',
    summary:
      'HC-SR04 måler avstand berøringsfritt mellom 2 cm og 400 cm med en presisjon på opptil 3 mm. Sender ut en 40 kHz ultralydbølge når TRIG-pinnen holdes høy i 10 µs, og setter ECHO-pinnen høy i tidsrommet det tar før ekkoet mottas.',
    highlights: [
      'Måleområde: 2 cm til 400 cm',
      'Målevinkel: 15 grader',
      'Trigger-inngangssignal: 10 µs TTL-puls',
      'Echo-utgangssignal: Proporsjonalt med avstand (Avstand = (Tid * 340m/s) / 2)',
    ],
    pinSummary: 'VCC (5V), TRIG (Puls-inngang), ECHO (Puls-utgang), GND',
  },
  oled_i2c_096: {
    title: 'SSD1306 0.96" Monokrom I2C OLED Skjerm',
    subTitle: '128x64 Dot Matrix OLED Driver Datablad',
    provider: 'Adafruit Industries',
    providerType: 'pdf',
    operatingVoltage: '3.3V til 5.0V DC (Innebygd charge-pump)',
    operatingCurrent: 'Typisk 15 - 25 mA (ved 50% piksler på)',
    clockSpeedOrFreq: 'Opptil 400 kHz (I2C Fast Mode)',
    packageType: '4-pin I2C Modul (GND, VCC, SCL, SDA)',
    summary:
      'SSD1306 er en integrert CMOS OLED/PLED driver med 128x64 pikslers oppløsning. Skjermen har ultrahøy kontrast fordi hver piksel er en egen lyskilde uten behov for bakgrunnsbelysning.',
    highlights: [
      'Oppløsning: 128 x 64 piksler',
      'Synsvinkel: > 160 grader',
      'I2C-adresse: Standard 0x3C (eller 0x3D ved loddebro)',
      'Innebygd 1 KB Graphic Display Data RAM (GDDRAM)',
    ],
    pinSummary: 'GND (0V), VCC (3.3-5V), SCL (I2C Clock), SDA (I2C Data)',
  },
  relay_5v_module: {
    title: '5V Single-Channel Relay Module med Optokopler',
    subTitle: 'Elektromekanisk Relé Datablad',
    provider: 'Songle / Components101',
    providerType: 'official',
    operatingVoltage: '5.0V DC spolespenning',
    operatingCurrent: 'Spolestrøm: ~70 mA | Styresignal: 5 mA',
    packageType: '1-Kanal Modul med 3-pin styring + 3 skruterminaler',
    summary:
      'Relémodul for styring av høyspente enheter fra mikrokontrollere. Har galvanisk skille via PC817 optokopler for å skjerme mikrokontrolleren mot transienter og støy fra induktive laster.',
    highlights: [
      'Maks koblingsspenning: AC 250V / 10A eller DC 30V / 10A',
      'Galvanisk optokopler-isolering (PC817)',
      'Skruterminaler: NO (Normally Open), COM (Common), NC (Normally Closed)',
      'Status-LED for spenning og reléinnkobling',
    ],
    pinSummary: 'Styring: VCC, IN, GND | Bryter: NO, COM, NC',
  },
  led_5mm: {
    title: 'Standard 5mm Rund Gjennomhulls Lysdiode (LED)',
    subTitle: 'Optoelektronisk Halvleder Datablad',
    provider: 'Wikipedia / Vishay Referanse',
    providerType: 'wiki',
    operatingVoltage: 'Rød/Gul: 1.8V - 2.2V | Blå/Grønn/Hvit: 3.0V - 3.4V',
    operatingCurrent: 'Nominelt: 20 mA | Maksimal kontinuerlig: 30 mA',
    packageType: 'T-1 3/4 (5mm) Epoksykapsel med faset kant',
    summary:
      '5mm lysdiode med PN-overgang som emitterer synlig lys ved forspenning (forward bias). Krever alltid en seriemotstand for å begrense strømmen og forhindre termisk overbelastning.',
    highlights: [
      'Anode (+) har lengre ben; Katode (-) har kortere ben og flat kant',
      'Formel for seriemotstand: R = (V_forsyning - V_led) / I_led',
      'Eksempel ved 5V og rød LED (2.0V): R = (5 - 2.0) / 0.02 = 150 Ω (bruk 220 Ω)',
      'Spenningsfall (Vf) varierer med farge og strøm',
    ],
    pinSummary: 'Anode (+) Positiv spenning, Katode (-) Jord / 0V',
  },
  resistor: {
    title: 'Karbonfilm / Metallfilm Motstand (1/4 Watt)',
    subTitle: 'Passiv Komponent Datablad & Fargekoder',
    provider: 'EIA E12 / E24 Standard',
    providerType: 'wiki',
    operatingVoltage: 'Maks arbeidsspenning: 250V RMS',
    operatingCurrent: 'Beregnes med Ohms lov (I = U / R)',
    packageType: 'Aksial gjennomhulls (0207 / 6.5 x 2.3 mm)',
    summary:
      'Gjennomhullsmotstand med 4 eller 5 fargeringer som angir resistans og toleranse. Benyttes som pull-up/pull-down motstander, i spenningsdelere eller som strømbegrensere for lysdioder.',
    highlights: [
      'Maksimal effekttap: 0.25 W (1/4 Watt) ved 70°C',
      'Toleranse: ±5% (gullring) eller ±1% (brun ring)',
      'Effektformel: P = U * I = I² * R = U² / R',
      'Temperaturkoeffisient: ±350 ppm/°C',
    ],
    pinSummary: 'To reversible, ikke-polariserte terminaler',
  },
  pushbutton: {
    title: 'Taktil 6x6mm Midlertidig Trykkknapp (SPST-NO)',
    subTitle: 'Elektromekanisk Bryter Datablad',
    provider: 'Omron / C&K Referanse',
    providerType: 'wiki',
    operatingVoltage: 'Maks 12V DC',
    operatingCurrent: 'Nominelt: 50 mA',
    packageType: 'DIP-4 (6.0 x 6.0 mm, 4 pinner)',
    summary:
      'En-polet normalt åpen (Normally Open) taktil bryter. De fire pinnene er internt koblet sammen i par (1A med 1B, og 2A med 2B). Når knappen trykkes ned, etableres kontakt mellom begge par.',
    highlights: [
      'Kontaktmotstand: < 100 mΩ',
      'Prelltid (bouncing): Typisk < 5 ms (anbefaler programvare-debouncing)',
      'Aktiveringskraft: ~160 gf til 260 gf',
      'Elektrisk levetid: Minst 100 000 sykluser',
    ],
    pinSummary: '1A og 1B (par 1), 2A og 2B (par 2)',
  },
  potentiometer: {
    title: '10kΩ Roterbart Lineært Potensiometer',
    subTitle: 'Variabel Spenningsdeler Datablad',
    provider: 'Bourns / Alps Referanse',
    providerType: 'wiki',
    operatingVoltage: 'Maks 50V AC / 20V DC',
    operatingCurrent: 'Maks 10 mA gjennom slepekontakten',
    packageType: '3-pin Panelmontering / PCB (Akseldiameter 6mm)',
    summary:
      'Tre-pols justerbar motstand (spenningsdeler). De to ytterste pinnene er koblet til en fast 10 kΩ bane, mens den midterste pinnen (wiper) sveiper over banen og gir et kontinuerlig variabelt analogt spenningssignal.',
    highlights: [
      'Karakteristikk: Lineær (B-kurve, 10kΩ)',
      'Rotasjonsvinkel: 300° ± 5°',
      'Effektvurdering: 0.1 Watt',
      'Perfekt for analog inngang på Arduino (0 - 1023) eller ESP32 (0 - 4095)',
    ],
    pinSummary: 'Pinne 1 (VCC/IN), Pinne 2 (Wiper/Analog ut), Pinne 3 (GND)',
  },
  capacitor_electrolytic: {
    title: 'Radiell Elektrolyttkondensator (10µF / 25V)',
    subTitle: 'Polarisert Kapasitiv Komponent Datablad',
    provider: 'Panasonic / Nichicon Spesifikasjon',
    providerType: 'pdf',
    operatingVoltage: 'Maks 25V DC merkespenning',
    operatingCurrent: 'Rippelstrøm: opptil 70 mA ved 100 kHz',
    packageType: 'Radiell aluminiumsboks (5 x 11 mm)',
    summary:
      'Polarisert kondensator med høy kapasitans i forhold til volum. Må alltid kobles med riktig polaritet (langt ben er pluss, hvit/grå stripe på kroppen angir minus). Benyttes til glatting av spenning og RC-tidsstyring.',
    highlights: [
      'Kapasitans: 10 µF ±20% toleranse',
      'Tydelig markert negativ stripe med minus-tegn (-)',
      'Temperaturområde: -40°C til +85°C / 105°C',
      'Må aldri utsettes for revers polaritet!',
    ],
    pinSummary: 'Anode (+) Langt ben, Katode (-) Kort ben ved stripe',
  },
  battery_9v: {
    title: '9V Alkalisk Blokkbatteri (6LR61 / PP3)',
    subTitle: 'Kjemisk Primærcelle Datablad',
    provider: 'Energizer / Duracell Spesifikasjon',
    providerType: 'wiki',
    operatingVoltage: 'Nominell: 9.0V DC (Ferskt: ~9.5V, Avskjæring: 5.4V)',
    operatingCurrent: 'Kapasitet: ~550 - 600 mAh (ved 25 mA belastning)',
    packageType: 'PP3 Standard blokk med snap-terminaler',
    summary:
      'Standard 9V blokkbatteri bygget opp av 6 seriekoblede 1.5V sylindriske alkaliceller. Har mekanisk polaritetslås med sirkulær han-kontakt (-) og åttekantet hun-kontakt (+).',
    highlights: [
      'Intern motstand: Typisk 1.5 - 2.5 Ω',
      'Temperaturområde: -18°C til +55°C',
      'Vekt: ~45 gram',
      'Maksimal anbefalt kontinuerlig utladningsstrøm: 100 mA',
    ],
    pinSummary: 'Positiv kontakt (+) åttekantet, Negativ kontakt (-) sirkulær',
  },
};

interface DatasheetPreviewCardProps {
  selectedComponent: CircuitComponentInstance;
  componentDef: ComponentDefinition;
  datasheetUrl?: string;
  onOpenExternal: () => void;
}

type PreviewTab = 'excerpt' | 'schematic' | 'iframe';

export const DatasheetPreviewCard: React.FC<DatasheetPreviewCardProps> = ({
  selectedComponent,
  componentDef,
  datasheetUrl,
  onOpenExternal,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('excerpt');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showFullModal, setShowFullModal] = useState<boolean>(false);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [iframeError, setIframeError] = useState<boolean>(false);

  // Determine active URL
  const activeUrl = datasheetUrl || selectedComponent.datasheetUrl || componentDef.datasheetUrl || '';

  // Resolve matching excerpt or generate dynamic fallback excerpt
  const excerpt: DatasheetExcerpt = useMemo(() => {
    // 1. Direct typeId match
    if (CURATED_EXCERPTS[componentDef.typeId]) {
      return CURATED_EXCERPTS[componentDef.typeId];
    }

    // 2. Keyword matching on URL or name
    const urlLower = activeUrl.toLowerCase();
    const nameLower = componentDef.name.toLowerCase();

    if (urlLower.includes('555') || nameLower.includes('555')) {
      return CURATED_EXCERPTS['ic_555'];
    }
    if (urlLower.includes('arduino') || nameLower.includes('arduino')) {
      return CURATED_EXCERPTS['arduino_uno'];
    }
    if (urlLower.includes('esp32') || nameLower.includes('esp32')) {
      return CURATED_EXCERPTS['esp32_devkit'];
    }
    if (urlLower.includes('hcsr04') || urlLower.includes('hc-sr04') || nameLower.includes('ultralyd')) {
      return CURATED_EXCERPTS['hc_sr04'];
    }
    if (urlLower.includes('ssd1306') || urlLower.includes('oled') || nameLower.includes('oled')) {
      return CURATED_EXCERPTS['oled_i2c_096'];
    }
    if (urlLower.includes('relay') || nameLower.includes('relé') || nameLower.includes('relay')) {
      return CURATED_EXCERPTS['relay_5v_module'];
    }
    if (urlLower.includes('capacitor') || nameLower.includes('kondensator')) {
      return CURATED_EXCERPTS['capacitor_electrolytic'];
    }
    if (urlLower.includes('led') || nameLower.includes('lysdiode') || nameLower.includes('led')) {
      return CURATED_EXCERPTS['led_5mm'];
    }
    if (urlLower.includes('resistor') || nameLower.includes('motstand')) {
      return CURATED_EXCERPTS['resistor'];
    }

    // 3. Fallback generic excerpt from componentDef & URL metadata
    let providerName = 'Eksternt Datablad';
    let providerType: DatasheetExcerpt['providerType'] = 'web';

    try {
      if (activeUrl) {
        const parsed = new URL(activeUrl);
        providerName = parsed.hostname.replace('www.', '');
        if (activeUrl.toLowerCase().endsWith('.pdf') || activeUrl.toLowerCase().includes('/pdf/')) {
          providerType = 'pdf';
        } else if (providerName.includes('wikipedia')) {
          providerType = 'wiki';
        } else {
          providerType = 'official';
        }
      }
    } catch {
      // not a valid URL yet
    }

    return {
      title: componentDef.name,
      subTitle: `${componentDef.category} Spesifikasjon & Referanse`,
      provider: providerName,
      providerType,
      operatingVoltage: (componentDef.defaultProperties?.voltage as string) || 'Standard spenning',
      operatingCurrent: 'Se komponentens tekniske dokumentasjon',
      packageType: componentDef.packageShape ? `Form: ${componentDef.packageShape}` : 'Standard Kapsling',
      summary:
        componentDef.description ||
        'Tekniske data, pinoppsett og koblingsanvisninger hentet fra den tilknyttede datablad-ressursen.',
      highlights: [
        `Kategori: ${componentDef.category}`,
        `Tilkoblingspinner: ${componentDef.pins.length} pinner`,
        ...(componentDef.tags ? [`Merkelapper: ${componentDef.tags.join(', ')}`] : []),
      ],
      pinSummary: `${componentDef.pins.length} tilkoblingspinner definert i CircuLab`,
    };
  }, [componentDef, activeUrl]);

  // Render high-fidelity visual schematic drawing / blueprint placeholder
  const renderVisualSchematic = () => {
    const type = componentDef.typeId;

    if (type === 'ic_555') {
      return (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col items-center">
          <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between w-full">
            <span className="text-amber-400 font-bold">NE555 DIP-8 Kapsling &amp; Pinout</span>
            <span className="text-slate-500">Toppvisning (Notch opp)</span>
          </div>
          <svg width="260" height="150" viewBox="0 0 260 150" className="drop-shadow-lg">
            {/* IC Body */}
            <rect x="70" y="20" width="120" height="110" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            {/* Notch */}
            <path d="M 115 20 A 15 15 0 0 0 145 20 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            {/* Laser Marking */}
            <text x="130" y="65" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">
              NE555P
            </text>
            <text x="130" y="80" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
              TI 24A9 K12
            </text>
            {/* Dot for Pin 1 */}
            <circle cx="85" cy="35" r="3" fill="#cbd5e1" opacity="0.6" />

            {/* Left Pins (1 to 4) */}
            <g stroke="#94a3b8" strokeWidth="3" strokeLinecap="round">
              <line x1="45" y1="36" x2="70" y2="36" />
              <line x1="45" y1="62" x2="70" y2="62" />
              <line x1="45" y1="88" x2="70" y2="88" />
              <line x1="45" y1="114" x2="70" y2="114" />
            </g>
            <text x="40" y="40" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">1: GND</text>
            <text x="40" y="66" textAnchor="end" fill="#38bdf8" fontSize="9" fontFamily="monospace">2: TRIG</text>
            <text x="40" y="92" textAnchor="end" fill="#4ade80" fontSize="9" fontFamily="monospace">3: OUT</text>
            <text x="40" y="118" textAnchor="end" fill="#f87171" fontSize="9" fontFamily="monospace">4: RESET</text>

            {/* Right Pins (8 down to 5) */}
            <g stroke="#94a3b8" strokeWidth="3" strokeLinecap="round">
              <line x1="190" y1="36" x2="215" y2="36" />
              <line x1="190" y1="62" x2="215" y2="62" />
              <line x1="190" y1="88" x2="215" y2="88" />
              <line x1="190" y1="114" x2="215" y2="114" />
            </g>
            <text x="220" y="40" textAnchor="start" fill="#ef4444" fontSize="9" fontFamily="monospace">8: VCC</text>
            <text x="220" y="66" textAnchor="start" fill="#f59e0b" fontSize="9" fontFamily="monospace">7: DISCH</text>
            <text x="220" y="92" textAnchor="start" fill="#a855f7" fontSize="9" fontFamily="monospace">6: THRESH</text>
            <text x="220" y="118" textAnchor="start" fill="#38bdf8" fontSize="9" fontFamily="monospace">5: CTRL</text>
          </svg>
          <div className="mt-2 text-[9px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-center w-full font-mono">
            Formel: f = 1.44 / ((Ra + 2·Rb) · C1) | Driftssyklus = (Ra + Rb)/(Ra + 2·Rb)
          </div>
        </div>
      );
    }

    if (type === 'arduino_uno') {
      return (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col items-center">
          <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between w-full">
            <span className="text-cyan-400 font-bold">Arduino Uno Rev3 Kretsarkitektur</span>
            <span className="text-slate-500">Microchip ATmega328P</span>
          </div>
          <svg width="270" height="150" viewBox="0 0 270 150" className="drop-shadow-lg">
            {/* PCB Board */}
            <rect x="25" y="15" width="220" height="120" rx="8" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
            {/* USB port */}
            <rect x="15" y="30" width="28" height="30" rx="3" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
            <text x="22" y="48" fill="#0f172a" fontSize="7" fontWeight="bold">USB</text>
            {/* DC Barrel Jack */}
            <rect x="15" y="90" width="30" height="26" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <circle cx="20" cy="103" r="4" fill="#334155" />
            {/* MCU Chip */}
            <rect x="110" y="60" width="85" height="35" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            <text x="152" y="80" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="bold" fontFamily="monospace">
              ATmega328P
            </text>
            <text x="152" y="90" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="monospace">
              16 MHz | 32 KB Flash
            </text>
            {/* Digital Pin Header */}
            <rect x="80" y="18" width="155" height="12" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="157" y="27" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="bold">
              DIGITAL PINS (PWM: 3, 5, 6, 9, 10, 11)
            </text>
            {/* Power & Analog Header */}
            <rect x="70" y="120" width="80" height="12" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="110" y="129" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">POWER / 5V / 3V3</text>
            <rect x="160" y="120" width="75" height="12" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="197" y="129" textAnchor="middle" fill="#a855f7" fontSize="7" fontWeight="bold">ANALOG (A0-A5)</text>
          </svg>
          <div className="mt-2 text-[9px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-center w-full font-mono">
            Forsyningsspenning: 5V DC | Maks 20 mA per I/O-pinne | I2C: A4/A5 | SPI: 10, 11, 12, 13
          </div>
        </div>
      );
    }

    if (type === 'led_5mm') {
      return (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col items-center">
          <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between w-full">
            <span className="text-red-400 font-bold">5mm Lysdiode Fysisk &amp; Skjematisk</span>
            <span className="text-slate-500">T-1 3/4 Kapsling</span>
          </div>
          <svg width="250" height="130" viewBox="0 0 250 130" className="drop-shadow-lg">
            {/* LED Bulb Epoxy Dome */}
            <path d="M 60 70 L 60 40 A 20 20 0 0 1 100 40 L 100 70 Z" fill="#ef4444" opacity="0.85" stroke="#f87171" strokeWidth="1.5" />
            <line x1="58" y1="70" x2="102" y2="70" stroke="#f87171" strokeWidth="2" />
            {/* Flat spot on cathode */}
            <line x1="99" y1="67" x2="99" y2="73" stroke="#fca5a5" strokeWidth="2.5" />
            {/* Anode Lead (Longer) */}
            <line x1="72" y1="72" x2="72" y2="120" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            <text x="72" y="128" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">Anode (+)</text>
            {/* Cathode Lead (Shorter) */}
            <line x1="88" y1="72" x2="88" y2="110" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            <text x="90" y="118" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">Katode (-)</text>

            {/* Schematic Diode Symbol on Right */}
            <g transform="translate(145, 35)">
              <rect x="0" y="0" width="95" height="60" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              <text x="47" y="14" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">Kretssymbol</text>
              {/* Diode triangle */}
              <polygon points="35,25 35,45 55,35" fill="#ef4444" stroke="#f87171" strokeWidth="1.5" />
              <line x1="55" y1="23" x2="55" y2="47" stroke="#f87171" strokeWidth="2" />
              <line x1="20" y1="35" x2="35" y2="35" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="55" y1="35" x2="75" y2="35" stroke="#cbd5e1" strokeWidth="2" />
              {/* Emission arrows */}
              <line x1="45" y1="24" x2="55" y2="15" stroke="#fbbf24" strokeWidth="1.5" />
              <polygon points="55,15 50,15 53,19" fill="#fbbf24" />
              <line x1="53" y1="28" x2="63" y2="19" stroke="#fbbf24" strokeWidth="1.5" />
              <polygon points="63,19 58,19 61,23" fill="#fbbf24" />
            </g>
          </svg>
          <div className="mt-2 text-[9px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-center w-full font-mono">
            R_serie = (V_forsyning - V_led) / I_led | F.eks. (5V - 2.0V) / 20mA = 150 Ω (anbefalt 220 Ω)
          </div>
        </div>
      );
    }

    if (type === 'resistor') {
      return (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col items-center">
          <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between w-full">
            <span className="text-amber-400 font-bold">Gjennomhullsmotstand &amp; Fargekoder</span>
            <span className="text-slate-500">EIA-RS-279 Standard</span>
          </div>
          <svg width="260" height="110" viewBox="0 0 260 110" className="drop-shadow-lg">
            {/* Leads */}
            <line x1="20" y1="55" x2="70" y2="55" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <line x1="190" y1="55" x2="240" y2="55" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            {/* Resistor Body */}
            <rect x="70" y="40" width="120" height="30" rx="10" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
            {/* Color Bands (e.g. 220 ohm: Red, Red, Brown, Gold) */}
            <rect x="90" y="40" width="7" height="30" fill="#dc2626" />
            <rect x="110" y="40" width="7" height="30" fill="#dc2626" />
            <rect x="130" y="40" width="7" height="30" fill="#78350f" />
            <rect x="160" y="40" width="7" height="30" fill="#fbbf24" />
          </svg>
          <div className="mt-1 text-[9px] text-slate-300 grid grid-cols-4 gap-1 w-full text-center font-mono">
            <span className="bg-red-950/80 border border-red-700/60 p-1 rounded">Bånd 1: 2</span>
            <span className="bg-red-950/80 border border-red-700/60 p-1 rounded">Bånd 2: 2</span>
            <span className="bg-amber-950/80 border border-amber-700/60 p-1 rounded">Mult: x10</span>
            <span className="bg-yellow-950/80 border border-yellow-700/60 p-1 rounded">Tol: ±5%</span>
          </div>
        </div>
      );
    }

    // Default dynamic technical drawing for all other components (and custom ones)
    return (
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col items-center">
        <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between w-full">
          <span className="text-blue-400 font-bold">{componentDef.name} Skisse</span>
          <span className="text-slate-500">{componentDef.pins.length} pinner</span>
        </div>
        <svg width="260" height="130" viewBox="0 0 260 130" className="drop-shadow-lg">
          {/* Main Enclosure */}
          <rect x="50" y="25" width="160" height="80" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
          <text x="130" y="60" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
            {componentDef.name}
          </text>
          <text x="130" y="75" textAnchor="middle" fill="#60a5fa" fontSize="8" fontFamily="monospace">
            {componentDef.category}
          </text>

          {/* Render pins around perimeter */}
          {componentDef.pins.slice(0, 8).map((pin, i) => {
            const isLeft = i < 4;
            const y = 35 + (i % 4) * 18;
            const x1 = isLeft ? 25 : 210;
            const x2 = isLeft ? 50 : 235;

            return (
              <g key={pin.id}>
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={
                    pin.type === 'power'
                      ? '#ef4444'
                      : pin.type === 'ground'
                      ? '#64748b'
                      : pin.type === 'analog'
                      ? '#a855f7'
                      : '#38bdf8'
                  }
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle
                  cx={isLeft ? 25 : 235}
                  cy={y}
                  r="2.5"
                  fill="#ffffff"
                />
                <text
                  x={isLeft ? 55 : 205}
                  y={y + 3}
                  textAnchor={isLeft ? 'start' : 'end'}
                  fill="#94a3b8"
                  fontSize="7"
                  fontFamily="monospace"
                >
                  {pin.name}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 text-[9px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-center w-full font-mono">
          Kapsling: {componentDef.packageShape || 'Standard Modul'} | Pinner: {componentDef.pins.map(p => p.name).slice(0, 5).join(', ')}...
        </div>
      </div>
    );
  };

  // Render iframe view with security sandbox, loading spinner and friendly fallback
  const renderIframeView = () => {
    return (
      <div className="space-y-2">
        <div className="relative w-full h-56 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden shadow-inner flex flex-col">
          {/* Iframe Loading State */}
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 space-y-2">
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-[11px] text-slate-400">Laster forhåndsvisning av datablad...</span>
            </div>
          )}

          <iframe
            src={activeUrl}
            title={`Datablad for ${componentDef.name}`}
            sandbox="allow-scripts allow-same-origin allow-popups"
            onLoad={() => setIframeLoading(false)}
            onError={() => {
              setIframeLoading(false);
              setIframeError(true);
            }}
            className="w-full flex-1 border-0"
          />
        </div>

        {/* Informational banner regarding web embedding constraints */}
        <div className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-md text-[10px] text-slate-400 flex items-start justify-between space-x-2">
          <div className="flex items-start space-x-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-tight">
              Enkelte eksterne nettsteder (f.eks. Wikipedia eller PDF-datablad) begrenser iframe-visning.
            </span>
          </div>
          <button
            onClick={onOpenExternal}
            className="text-blue-400 hover:text-white flex items-center space-x-1 shrink-0 font-medium hover:underline"
          >
            <span>Åpne kilde</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  if (!activeUrl) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg transition">
      {/* 1. Preview Header with Title, Provider Badge and Quick Actions */}
      <div className="p-2.5 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/40 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            {excerpt.providerType === 'pdf' ? (
              <FileText className="w-3.5 h-3.5 text-red-400" />
            ) : excerpt.providerType === 'wiki' ? (
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Forhåndsvisning
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                  excerpt.providerType === 'pdf'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {excerpt.providerType === 'pdf' ? 'PDF' : excerpt.provider}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Tooltip title="Åpne i full skjerm" description="Vis forstørret datablad og spesifikasjon" position="left">
            <button
              onClick={() => setShowFullModal(true)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              aria-label="Åpne forhåndsvisning i full modal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Åpne ekstern URL" description="Gå til kildedokumentet i ny nettleserfane" position="left">
            <button
              onClick={onOpenExternal}
              className="p-1 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded transition"
              aria-label="Åpne datablad i ny fane"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip
            title={isExpanded ? 'Skjul detaljer' : 'Vis utdrag'}
            description="Ekspander tekniske nøkkeldata"
            position="left"
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              aria-label="Veksle visning av utdrag"
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 2. Interactive Mode Selector Tabs: Utdrag / Bilde (Skjematisk) / Iframe */}
      <div className="flex items-center px-2 py-1.5 bg-slate-950/60 border-b border-slate-800/80 space-x-1 text-[10px]">
        <button
          onClick={() => setActiveTab('excerpt')}
          className={`flex-1 py-1 px-2 rounded font-medium flex items-center justify-center space-x-1 transition ${
            activeTab === 'excerpt'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>Utdrag</span>
        </button>

        <button
          onClick={() => setActiveTab('schematic')}
          className={`flex-1 py-1 px-2 rounded font-medium flex items-center justify-center space-x-1 transition ${
            activeTab === 'schematic'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          <span>Skjematisk Bilde</span>
        </button>

        <button
          onClick={() => setActiveTab('iframe')}
          className={`flex-1 py-1 px-2 rounded font-medium flex items-center justify-center space-x-1 transition ${
            activeTab === 'iframe'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>Iframe / Web</span>
        </button>
      </div>

      {/* 3. Main Body Based on Active Tab */}
      <div className="p-3 space-y-2.5">
        {activeTab === 'schematic' && renderVisualSchematic()}

        {activeTab === 'iframe' && renderIframeView()}

        {activeTab === 'excerpt' && (
          <>
            <div>
              <h5 className="font-semibold text-white text-xs leading-snug flex items-center justify-between">
                <span>{excerpt.title}</span>
              </h5>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{excerpt.subTitle}</p>
            </div>

            {/* Quick Specs Pill Grid */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Spenning</span>
                <span className="font-mono text-amber-300 font-medium truncate block">
                  {excerpt.operatingVoltage}
                </span>
              </div>

              <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Kapsling</span>
                <span className="font-mono text-cyan-300 font-medium truncate block">
                  {excerpt.packageType}
                </span>
              </div>
            </div>

            {/* Summary Paragraph */}
            <p className="text-[11px] text-slate-300/90 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
              {excerpt.summary}
            </p>

            {/* Expanded Details Accordion */}
            {isExpanded && (
              <div className="space-y-2 pt-2 border-t border-slate-800 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Nøkkelegenskaper fra datablad:
                  </span>
                  <ul className="space-y-1">
                    {excerpt.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5 text-[10px] text-slate-300">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {excerpt.clockSpeedOrFreq && (
                  <div className="flex items-center justify-between bg-slate-950/70 px-2 py-1 rounded text-[10px]">
                    <span className="text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Klokkefrekvens:</span>
                    </span>
                    <span className="font-mono text-purple-300 font-semibold">
                      {excerpt.clockSpeedOrFreq}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-950/70 px-2 py-1 rounded text-[10px]">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Gauge className="w-3 h-3 text-slate-500" />
                    <span>Maks strømtrekk:</span>
                  </span>
                  <span className="font-mono text-emerald-300 font-semibold truncate max-w-[150px]">
                    {excerpt.operatingCurrent}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1"
          >
            <span>{isExpanded ? 'Mindre info' : 'Flere spesifikasjoner'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setShowFullModal(true)}
            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[10px] font-semibold rounded border border-blue-500/30 flex items-center space-x-1 transition"
          >
            <Eye className="w-3 h-3" />
            <span>Full forhåndsvisning</span>
          </button>
        </div>
      </div>

      {/* 4. Expanded Full Modal View */}
      {showFullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {excerpt.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-slate-400">{excerpt.subTitle}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                      {excerpt.provider}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow transition"
                >
                  <span>Åpne kilde</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setShowFullModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Visual Drawing in Modal */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Krets- &amp; Pinouttegning</span>
                </h4>
                {renderVisualSchematic()}
              </div>

              {/* Top Highlights Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Driftsspenning
                  </span>
                  <span className="text-sm font-mono text-amber-300 font-semibold block">
                    {excerpt.operatingVoltage}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Strømforbruk
                  </span>
                  <span className="text-sm font-mono text-emerald-300 font-semibold block">
                    {excerpt.operatingCurrent}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Fysisk Kapsling
                  </span>
                  <span className="text-sm font-mono text-cyan-300 font-semibold block truncate">
                    {excerpt.packageType}
                  </span>
                </div>
              </div>

              {/* Technical Description */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Sammendrag fra Databladet</span>
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">{excerpt.summary}</p>
              </div>

              {/* Bullet Features */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Tekniske Høydepunkter</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {excerpt.highlights.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300"
                    >
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pinout quick reference */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Pinoversikt ({componentDef.pins.length} pinner)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {excerpt.pinSummary}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {componentDef.pins.map((pin) => (
                    <div
                      key={pin.id}
                      className="p-1.5 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-mono text-white font-semibold">{pin.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{pin.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Link & Embedded Notice */}
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center space-x-2 truncate">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">{activeUrl}</span>
                </div>
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-white font-semibold flex items-center space-x-1 shrink-0 ml-3"
                >
                  <span>Åpne fullt dokument</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setShowFullModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
