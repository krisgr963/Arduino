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
  schematicSnippet?: React.ReactNode;
}

// Built-in curated excerpts for standard and popular hardware components
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
    provider: 'SparkFun / Elecfreaks',
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
    provider: 'Components101',
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
      'Spenningsfall (Vf) varierer med bølgelengde/farge',
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

export const DatasheetPreviewCard: React.FC<DatasheetPreviewCardProps> = ({
  selectedComponent,
  componentDef,
  datasheetUrl,
  onOpenExternal,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showFullModal, setShowFullModal] = useState<boolean>(false);

  // Determine active URL
  const activeUrl = datasheetUrl || selectedComponent.datasheetUrl || componentDef.datasheetUrl || '';

  // Resolve matching excerpt or generate dynamic excerpt
  const excerpt: DatasheetExcerpt = useMemo(() => {
    // 1. Direct typeId match
    if (CURATED_EXCERPTS[componentDef.typeId]) {
      return CURATED_EXCERPTS[componentDef.typeId];
    }

    // 2. Keyword matching on URL or name
    const urlLower = activeUrl.toLowerCase();
    const nameLower = componentDef.name.toLowerCase();

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

  if (!activeUrl) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg transition">
      {/* Preview Header / Banner */}
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
                Datablad Utdrag
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
              aria-label="Åpne datablad-modal"
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

      {/* Main Snippet Body */}
      <div className="p-3 space-y-2.5">
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

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-between pt-1">
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

      {/* Expanded Full Modal View */}
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
