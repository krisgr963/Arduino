import React, { useState } from 'react';
import {
  CircuitComponentInstance,
  ComponentDefinition,
} from '../../types/circuit';
import {
  Lightbulb,
  Plus,
  ArrowRight,
  Sparkles,
  Info,
  X,
  ChevronRight,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  typeIdToAdd: string;
  properties?: Record<string, any>;
  wiringHint: string;
}

interface GuideTopic {
  id: string;
  title: string;
  summary: string;
  componentsNeeded: string[];
  steps: string[];
}

interface CircuitGuidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComponent: CircuitComponentInstance | null;
  selectedComponentDef: ComponentDefinition | null;
  allComponents: CircuitComponentInstance[];
  componentDefs: Map<string, ComponentDefinition>;
  onAddComponent: (typeId: string, customProps?: Record<string, any>) => void;
}

export const CircuitGuidePanel: React.FC<CircuitGuidePanelProps> = ({
  isOpen,
  onClose,
  selectedComponent,
  selectedComponentDef,
  allComponents,
  componentDefs,
  onAddComponent,
}) => {
  const [activeTab, setActiveTab] = useState<'context' | 'recipes'>('context');
  const [selectedRecipe, setSelectedRecipe] = useState<GuideTopic | null>(null);

  if (!isOpen) return null;

  // Determine smart suggestions based on selected component or recent components in circuit
  const getSmartSuggestions = (): {
    heading: string;
    reason: string;
    suggestions: SuggestionItem[];
  } => {
    // If an LED is selected or in circuit without resistor
    if (selectedComponent?.typeId === 'led_5mm') {
      return {
        heading: 'Koblingsforslag for Lysdiode (LED)',
        reason:
          'En LED har nesten null indre motstand og krever en seriemotstand for å unngå at den brenner ut, samt en stabil likespenningskilde.',
        suggestions: [
          {
            id: 'sug_res_330',
            title: '330 Ω Seriemotstand (Anbefalt for 5V - 9V)',
            description:
              'Begrenser strømmen gjennom LED-en til trygge ~15-20 mA. Kobles i serie med enten Anode (+) eller Katode (-).',
            typeIdToAdd: 'resistor',
            properties: { resistance: 330 },
            wiringHint: 'Koble motstandens ene ben til LED Anode (+), og det andre til spenning.',
          },
          {
            id: 'sug_bat_9v',
            title: '9V Batteri (Strømkilde)',
            description:
              'Klassisk 9V batteri med trykk-kontakter. Gir pålitelig likestrøm til LED-kretser og mikrokontrollere.',
            typeIdToAdd: 'battery_9v',
            wiringHint: 'Koble (+) polen via motstanden til LED Anode, og (-) polen til LED Katode.',
          },
          {
            id: 'sug_pushbtn',
            title: 'Trykknapp (Taktil bryter)',
            description: 'Lar deg manuelt bryte og slutte kretsen for å slå LED-en av og på.',
            typeIdToAdd: 'pushbutton',
            wiringHint: 'Sett knappen i serie mellom batteriets (+) pol og motstanden.',
          },
        ],
      };
    }

    // If Arduino Uno is selected
    if (selectedComponent?.typeId === 'arduino_uno') {
      return {
        heading: 'Koblingsforslag for Arduino Uno R3',
        reason:
          'Arduino Uno leverer stabil 5.0V og 3.3V logikk, samt 14 digitale og 6 analoge I/O-pinner. Her er vanlige komponenter som passer perfekt:',
        suggestions: [
          {
            id: 'sug_bb',
            title: 'Koblingsbrett (Half-size 400 hull)',
            description: 'Uunnværlig for loddefri prototyping med Arduino-jumperledninger.',
            typeIdToAdd: 'breadboard_half',
            wiringHint: 'Koble Arduino 5V og GND til koblingsbrettets røde (+) og blå (-) skinner.',
          },
          {
            id: 'sug_led_blink',
            title: 'LED (5mm) for Pin 13 / PWM styring',
            description: 'Klassisk Blink-prosjekt: kontroller lysdioden fra digital pinne D13 eller PWM D9~.',
            typeIdToAdd: 'led_5mm',
            properties: { color: '#22c55e' },
            wiringHint: 'Koble fra digital pinne -> 220Ω motstand -> LED Anode -> Arduino GND.',
          },
          {
            id: 'sug_res_220',
            title: '220 Ω Motstand for Arduino LED',
            description: 'Passer perfekt til 5V logikknivå for optimal lysstyrke uten overstrøm.',
            typeIdToAdd: 'resistor',
            properties: { resistance: 220 },
            wiringHint: 'Sett i serie med digitalutgangen.',
          },
          {
            id: 'sug_pot',
            title: '10kΩ Potensiometer (Analog inngang A0)',
            description: 'Juster spenning 0-5V og les av verdier fra 0 til 1023 på Arduino analog pinne A0.',
            typeIdToAdd: 'potentiometer',
            wiringHint: 'Koble pinne 1 til 5V, pinne 3 til GND, og midtre Wiper til A0.',
          },
        ],
      };
    }

    // If ESP32 is selected
    if (selectedComponent?.typeId === 'esp32_devkit') {
      return {
        heading: 'Koblingsforslag for ESP32 DevKit',
        reason:
          'ESP32 opererer på 3.3V logikk og støtter Wi-Fi, Bluetooth og avanserte I2C- og SPI-sensorer.',
        suggestions: [
          {
            id: 'sug_bb_esp',
            title: 'Koblingsbrett (400 hull)',
            description: 'Plasser ESP32 over midtsenter-ravinen slik at begge sider har ledige hullrekker.',
            typeIdToAdd: 'breadboard_half',
            wiringHint: 'Bruk 3V3 og GND for strøm til sensorer.',
          },
          {
            id: 'sug_btn_esp',
            title: 'Trykknapp med pullup',
            description: 'Bruk en trykknapp koblet til GPIO 4 eller GPIO 5 for digital inngangsavlesing.',
            typeIdToAdd: 'pushbutton',
            wiringHint: 'Koble ene siden til GND og andre til GPIO (med intern pullup i kode).',
          },
        ],
      };
    }

    // If Push Button is selected
    if (selectedComponent?.typeId === 'pushbutton') {
      return {
        heading: 'Koblingsforslag for Trykknapp',
        reason:
          'Når trykknappen kobles til mikrokontroller-innganger bør den ha en pull-down eller pull-up motstand for å unngå flytende tilstand.',
        suggestions: [
          {
            id: 'sug_res_10k',
            title: '10 kΩ Pull-down Motstand',
            description: 'Trekker inngangen stabilt til 0V (GND) når knappen ikke er trykket inn.',
            typeIdToAdd: 'resistor',
            properties: { resistance: 10000 },
            wiringHint: 'Koble mellom knappeutgang/inngangspinne og GND.',
          },
          {
            id: 'sug_led_btn',
            title: 'LED som last',
            description: 'Enkel krets der knappen tenner en lysdiode når den holdes nede.',
            typeIdToAdd: 'led_5mm',
            wiringHint: 'Koble i serie med motstand og spenningskilde.',
          },
        ],
      };
    }

    // Default suggestions based on what's in the project
    const hasBattery = allComponents.some(
      (c) => c.typeId === 'battery_9v' || c.typeId === 'battery_aa_pack'
    );
    const hasBreadboard = allComponents.some((c) => c.typeId === 'breadboard_half');

    return {
      heading: 'Generelle Kretsforslag',
      reason:
        'Her er viktige grunnelementer som vanligvis inngår i vellykkede kretsdesign:',
      suggestions: [
        ...(!hasBreadboard
          ? [
              {
                id: 'sug_bb_gen',
                title: 'Koblingsbrett (Breadboard)',
                description: 'Organiser kretsen ryddig med strømskinner og faste tilkoblingspunkter.',
                typeIdToAdd: 'breadboard_half',
                wiringHint: 'Dra komponenter opp på brettet for å koble dem sammen.',
              },
            ]
          : []),
        ...(!hasBattery
          ? [
              {
                id: 'sug_bat_gen',
                title: '9V Batteri (Strømkilde)',
                description: 'Forsyn kretsen med likespenning.',
                typeIdToAdd: 'battery_9v',
                wiringHint: 'Koble (+) til kretsens forsyningsskinne og (-) til felles jord.',
              },
            ]
          : []),
        {
          id: 'sug_led_gen',
          title: '5mm LED (Indikator)',
          description: 'Visuell indikator på at det går strøm i kretsen.',
          typeIdToAdd: 'led_5mm',
          properties: { color: '#ef4444' },
          wiringHint: 'Husk alltid å koble i serie med 220Ω - 330Ω motstand!',
        },
        {
          id: 'sug_res_gen',
          title: '330 Ω Motstand',
          description: 'Passer til LED-beskyttelse og strømbegrensning.',
          typeIdToAdd: 'resistor',
          properties: { resistance: 330 },
          wiringHint: 'Kobles i serie i strømbanen.',
        },
      ],
    };
  };

  const contextData = getSmartSuggestions();

  // Recipe catalog
  const RECIPES: GuideTopic[] = [
    {
      id: 'rec_basic_led',
      title: 'Enkel LED-krets med bryter',
      summary: 'Den mest klassiske kretsen: Batteri, taktil bryter, motstand og lysdiode.',
      componentsNeeded: ['9V Batteri', 'Trykknapp', '330Ω Motstand', 'LED 5mm'],
      steps: [
        'Koble 9V batteriets (+) pol til pinne 1A på trykknappen.',
        'Koble trykknappens pinne 2A til pinne 1 på 330Ω motstanden.',
        'Koble motstandens pinne 2 til LED Anode (+) [det lange benet].',
        'Koble LED Katode (-) [det flate/korte benet] tilbake til batteriets (-) pol.',
        'Klikk "Kjør simulering" og trykk på knappen for å se LED-en lyse!',
      ],
    },
    {
      id: 'rec_arduino_blink',
      title: 'Arduino LED-styring (Pin 13)',
      summary: 'Styr en ekstern LED fra en Arduino-mikrokontroller med jordretur.',
      componentsNeeded: ['Arduino Uno R3', 'Koblingsbrett', '220Ω Motstand', 'LED 5mm'],
      steps: [
        'Plasser Arduino og koblingsbrett side om side.',
        'Koble Arduino GND til koblingsbrettets blå (-) jordskinne.',
        'Koble Arduino digital pinne D13 til motstandens første ben.',
        'Koble motstandens andre ben til LED Anode (+).',
        'Koble LED Katode (-) til jordskinnen.',
      ],
    },
    {
      id: 'rec_pot_divider',
      title: 'Spenningsdeler med Potensiometer',
      summary: 'Trinnløs regulering av spenning (0 - 5V) til analog inngang.',
      componentsNeeded: ['Potensiometer (10kΩ)', 'Strømkilde (5V)', 'Arduino Uno A0'],
      steps: [
        'Koble ytterpinne 1 på potensiometeret til 5V.',
        'Koble ytterpinne 3 på potensiometeret til GND.',
        'Koble den midtre pinnen (Wiper) til målepinnen eller Arduino A0.',
        'Når potentiometerknappen roteres, endres spenningen lineært mellom 0V og 5V.',
      ],
    },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 shadow-2xl flex flex-col text-slate-200 text-xs overflow-hidden transition-transform animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Koblingsguide &amp; Assistent</h3>
            <p className="text-[11px] text-slate-400">
              Smarte kretsforslag og koblingsinstruksjoner
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs (Kontekstuelt forslag vs Kretsoppskrifter) */}
      <div className="flex border-b border-slate-800 bg-slate-900">
        <button
          onClick={() => {
            setActiveTab('context');
            setSelectedRecipe(null);
          }}
          className={`flex-1 py-2.5 font-semibold text-center transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'context'
              ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kontekstuelle forslag</span>
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex-1 py-2.5 font-semibold text-center transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'recipes'
              ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Kretsoppskrifter</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'context' ? (
          <>
            {/* Context Banner */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5">
              <div className="flex items-center space-x-2 text-white font-bold text-xs">
                {selectedComponentDef ? (
                  <>
                    <span className="text-blue-400">Valgt:</span>
                    <span>{selectedComponentDef.name}</span>
                  </>
                ) : (
                  <span>{contextData.heading}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{contextData.reason}</p>
            </div>

            {/* Smart Suggestions List */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Anbefalte tilkoblede komponenter:</span>
              </h4>

              {contextData.suggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-blue-500 transition space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-white text-xs group-hover:text-blue-400 transition">
                        {sug.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                        {sug.description}
                      </p>
                    </div>
                  </div>

                  {sug.wiringHint && (
                    <div className="text-[10px] text-emerald-300/90 bg-emerald-950/40 p-2 rounded border border-emerald-800/40 flex items-start space-x-1.5">
                      <ArrowRight className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{sug.wiringHint}</span>
                    </div>
                  )}

                  <button
                    onClick={() => onAddComponent(sug.typeIdToAdd, sug.properties)}
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Legg til denne komponenten</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Recipes Tab */
          <div className="space-y-3">
            {selectedRecipe ? (
              /* Selected Recipe Details */
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-xs text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <span>&larr; Tilbake til oppskrifter</span>
                </button>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                  <h4 className="font-bold text-white text-sm">{selectedRecipe.title}</h4>
                  <p className="text-xs text-slate-300">{selectedRecipe.summary}</p>
                </div>

                <div>
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Nødvendige komponenter:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRecipe.componentsNeeded.map((compName, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-800 rounded text-xs text-slate-200 border border-slate-700 font-medium"
                      >
                        {compName}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Koblingstrinn for trinn:
                  </h5>
                  <div className="space-y-2">
                    {selectedRecipe.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2.5 p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* List of Recipes */
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 mb-2">
                  Velg en standardkrets for å se trinnvise koblingsinstruksjoner:
                </p>
                {RECIPES.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className="p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <h5 className="font-bold text-white text-xs group-hover:text-blue-400 transition">
                        {recipe.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {recipe.summary}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Tips: Bruk &quot;Kjør Simulering&quot; for å teste koden</span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium transition"
        >
          Lukk guide
        </button>
      </div>
    </div>
  );
};
