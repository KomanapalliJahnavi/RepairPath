import { Appliance, RepairEvent, AiDiagnosticResult } from '../types';

const STORAGE_KEY_GEMINI_KEY = 'repairpath_gemini_api_key';

export const getStoredGeminiKey = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_GEMINI_KEY) || '';
  } catch {
    return '';
  }
};

export const setStoredGeminiKey = (key: string): void => {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
    }
  } catch (err) {
    console.error('Failed to save API key in localStorage', err);
  }
};

export const removeStoredGeminiKey = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
  } catch (err) {
    console.error('Failed to remove API key from localStorage', err);
  }
};

interface DiagnoseRequest {
  appliance: Appliance;
  symptom: string;
  errorCode?: string;
  startedWhen?: string;
  sensoryDetails?: string; // noises, smells, heat, leaks
  pastRepairs: RepairEvent[];
  apiKeyOverride?: string;
}

/**
 * Call Gemini API with structured prompt for appliance diagnosis
 */
async function callGeminiApi(
  req: DiagnoseRequest,
  apiKey: string
): Promise<AiDiagnosticResult> {
  const pastRepairsSummary = req.pastRepairs.length > 0
    ? req.pastRepairs.map(r => `- ${r.date}: ${r.title} | Symptom: "${r.userReportedSymptom}" | Repaired: ${r.repairPerformed} | Parts: ${r.partsReplaced.join(', ')}`).join('\n')
    : 'No previous repair history on file for this appliance.';

  const prompt = `You are a Master Certified Home Appliance Diagnostic Technician and Engineering Specialist.
Analyze the following appliance failure with utmost technical rigor, safety awareness, and financial realism.

### Appliance Profile:
- Name: ${req.appliance.name}
- Brand: ${req.appliance.brand}
- Model Number: ${req.appliance.modelNumber || 'Unknown'}
- Category: ${req.appliance.category}
- Installed/Age: ${req.appliance.purchaseDate ? `Purchased in ${req.appliance.purchaseDate}` : 'Age estimated 4-8 years'}
- Condition: ${req.appliance.conditionStatus}
- Expected Lifespan: ${req.appliance.expectedLifespanYears} years

### Historical Repair Memory:
${pastRepairsSummary}

### Current Reported Failure:
- Symptom: "${req.symptom}"
- Error Code Displayed: "${req.errorCode || 'None / Not available'}"
- Started: "${req.startedWhen || 'Recent'}"
- Sensory / Sound / Visual Clues: "${req.sensoryDetails || 'None provided'}"

### Instructions:
1. Evaluate whether an IMMEDIATE SAFETY HAZARD exists (gas leak, electrical short/sparking, active internal water flood). If so, set safetyLevel to 'danger_shutoff' and provide immediate lockout instructions.
2. Formulate 2 to 4 ranked probable ROOT CAUSES with realistic percentage likelihoods (summing to ~100%). For each, detail why it happens on this brand/model chassis, typical part numbers/names, cost range, and whether it is DIY or Pro.
3. Formulate 2 to 3 safe, NON-DESTRUCTIVE preliminary tests the homeowner can perform without dangerous disassembly (e.g. multimeter test, coin trap check, paper gasket test, filter clearance). Each test MUST have an explicit procedure, intent, pass criteria, failure indicator, and safety warning.
4. Provide a clear bottom-line recommendation (safe_diy_maintenance, call_technician, emergency_shutoff, or monitor) and bullet points for the technician briefing.

Respond ONLY with valid JSON (no markdown fences, no formatting before or after) matching this exact JSON schema:
{
  "summary": "Concise 1-2 sentence engineering summary of the probable failure mode",
  "safetyLevel": "safe" | "caution" | "danger_shutoff",
  "safetyInstructions": "Emergency steps if danger_shutoff or caution",
  "rootCauses": [
    {
      "cause": "Descriptive name of root cause component failure",
      "probability": 65,
      "explanation": "Specific technical explanation referencing model/brand design",
      "commonParts": ["Part Name & OEM # if known"],
      "estimatedCostRange": { "min": 80, "max": 220 },
      "diyDifficulty": "Easy DIY" | "Moderate DIY" | "Professional Only"
    }
  ],
  "diagnosticSteps": [
    {
      "id": "step-1",
      "title": "Clear Actionable Step Title",
      "description": "Why we are testing this",
      "testProcedure": "Exact non-destructive physical test procedure",
      "intent": "Engineering intent of this check",
      "passCondition": "Observable pass result",
      "possibleObservationFailure": "What failure looks like",
      "warningNote": "Safety precaution"
    }
  ],
  "recommendation": "safe_diy_maintenance" | "call_technician" | "emergency_shutoff" | "monitor",
  "technicianBriefNotes": [
    "Specific technical question or observation for the repair technician"
  ]
}`;

  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned an empty response.');
  }

  // Parse JSON (strip backticks if model wrapped it)
  const cleaned = rawText.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as AiDiagnosticResult;
  parsed.source = 'gemini_ai';
  return parsed;
}

/**
 * Intelligent Smart Knowledge Engine fallback
 * Uses domain-specific appliance repair engineering heuristics, brand bulletins, and error code databases
 */
function runSmartKnowledgeEngine(req: DiagnoseRequest): AiDiagnosticResult {
  const brand = (req.appliance.brand || '').toLowerCase();
  const model = (req.appliance.modelNumber || '').toUpperCase();
  const category = req.appliance.category;
  const symptomText = `${req.symptom} ${req.errorCode || ''} ${req.sensoryDetails || ''}`.toLowerCase();
  const errCode = (req.errorCode || '').trim().toUpperCase();

  // Check critical emergency hazards
  if (
    symptomText.includes('gas') || 
    symptomText.includes('smell gas') || 
    symptomText.includes('rotten egg')
  ) {
    return {
      summary: 'Potential fuel gas leak detected. Flammable hazard requires immediate evacuation and emergency utility contact.',
      safetyLevel: 'danger_shutoff',
      safetyInstructions: 'Evacuate home immediately. Do not flip light switches, use phones, or operate appliances. Turn off main gas valve if safely accessible from outside, then call gas utility and 911 from outside.',
      rootCauses: [
        {
          cause: 'Gas Supply Line or Appliance Solenoid Valve Leak',
          probability: 95,
          explanation: 'Flexible line pinhole, loose flare fitting, or stuck dual-solenoid burner gas safety valve.',
          commonParts: ['Gas Range Safety Valve', 'Flex Line & Shutoff Valve'],
          estimatedCostRange: { min: 150, max: 400 },
          diyDifficulty: 'Professional Only'
        }
      ],
      diagnosticSteps: [],
      recommendation: 'emergency_shutoff',
      technicianBriefNotes: ['Mandatory gas pressure drop test and soap-bubble leak check required.'],
      source: 'smart_knowledge_engine'
    };
  }

  if (
    symptomText.includes('spark') || 
    symptomText.includes('smoke') || 
    symptomText.includes('burning wire') || 
    symptomText.includes('electrical smell')
  ) {
    return {
      summary: 'Electrical arcing or terminal insulation burn detected. High risk of electrical fire or chassis energization.',
      safetyLevel: 'danger_shutoff',
      safetyInstructions: 'Immediately trip the corresponding dedicated circuit breaker at your main service panel. Do NOT touch wet appliance surfaces or power cords while breaker is on.',
      rootCauses: [
        {
          cause: 'Burned Wire Harness Terminal or Control Board Relay Meltdown',
          probability: 85,
          explanation: 'High current draw through loose spade connector creating resistive heating and insulation charring.',
          commonParts: ['High-Temp Wire Harness Pig-Tail', 'Main Electronic Control Board (PCB)'],
          estimatedCostRange: { min: 180, max: 450 },
          diyDifficulty: 'Professional Only'
        }
      ],
      diagnosticSteps: [],
      recommendation: 'emergency_shutoff',
      technicianBriefNotes: ['Inspect terminal block and main relay board for localized scorching and trace damage.'],
      source: 'smart_knowledge_engine'
    };
  }

  // Brand & Model Specific Diagnostics
  // 1. REFRIGERATION
  if (category === 'refrigeration') {
    if (
      brand.includes('samsung') || 
      model.includes('RF28') || 
      symptomText.includes('ice') || 
      symptomText.includes('frost') ||
      symptomText.includes('fan noise')
    ) {
      return {
        summary: `Chassis failure consistent with Samsung French-Door Ice Room & Defrost air-tower thermal migration (${model || brand}).`,
        safetyLevel: 'safe',
        rootCauses: [
          {
            cause: 'Ice Maker Room Air Leak & Defrost Drain Prough Freezing',
            probability: 65,
            explanation: 'Sub-zero air from the ice maker compartment migrates through the rear evaporator cover seal, freezing the drain trough and forcing the fan blades to strike ice.',
            commonParts: ['DA97-15217G Updated Ice Maker Kit', 'DA96-00558A Defrost Bi-Metal & Heater Assembly'],
            estimatedCostRange: { min: 140, max: 340 },
            diyDifficulty: 'Moderate DIY'
          },
          {
            cause: 'Evaporator Circulation Fan Motor Seizure or Bearing Wear',
            probability: 25,
            explanation: 'Moisture buildup from recurrent defrost cycling penetrates the DC motor sleeve bearings, causing high-pitch whining or total circulation stall.',
            commonParts: ['DA31-00287B DC Evap Fan Motor', 'Internal Temperature Sensor Probe'],
            estimatedCostRange: { min: 90, max: 210 },
            diyDifficulty: 'Moderate DIY'
          },
          {
            cause: 'Condenser Coil Heat Dissipation Inefficiency',
            probability: 10,
            explanation: 'Under-chassis dust blanket choking compressor cooling fins, elevating head pressure.',
            commonParts: ['Condenser Cleaning Brush'],
            estimatedCostRange: { min: 15, max: 40 },
            diyDifficulty: 'Easy DIY'
          }
        ],
        diagnosticSteps: [
          {
            id: 'step-1',
            title: 'Door Gasket Dollar Bill Seal Test',
            description: 'Verify ambient moisture is not leaking past deformed magnetic gaskets.',
            testProcedure: 'Close the refrigerator door on a crisp dollar bill along top, side, and bottom edges. Pull gently.',
            intent: 'Rule out ambient humidity ingress as primary driver of continuous frost.',
            passCondition: 'Dollar bill offers firm, uniform resistance everywhere along the perimeter.',
            possibleObservationFailure: 'Paper slips out effortlessly, showing magnetic seal gap.',
            warningNote: 'Use a hair dryer on low-medium heat to soften and re-seat deformed vinyl folds.'
          },
          {
            id: 'step-2',
            title: 'Depress Freezer Door Switch for Fan Spin-Up',
            description: 'Listen to DC evaporator fan acoustics.',
            testProcedure: 'Open freezer door, locate the interior door switch pin, press and hold for 6 seconds.',
            intent: 'Establish whether circulation motor is actively commanded and free of mechanical blade strikes.',
            passCondition: 'Smooth, whisper-quiet air rush without squealing, vibrating, or metallic clicking.',
            possibleObservationFailure: 'Loud buzzing or fan blades visibly hitting frost wall behind rear panel.'
          },
          {
            id: 'step-3',
            title: 'Examine Defrost Drain Trough Under Vegetable Crisper',
            description: 'Check for pooled water freezing into an ice sheet.',
            testProcedure: 'Slide out the lowest drawers and inspect the metal trough beneath the evaporator housing.',
            intent: 'Confirm whether defrost drain hole is obstructed with ice or mineral slime.',
            passCondition: 'Floor beneath drawers is completely dry and clean.',
            possibleObservationFailure: 'A 1/2-inch thick solid ice sheet covering the cabinet floor.'
          }
        ],
        recommendation: 'call_technician',
        technicianBriefNotes: [
          'Customer experienced recurring frost migration; check service bulletin ASC20180416001 for Samsung Ice Room sealant update.',
          'Test defrost heating element resistance (nominal ~65 ohms) and bi-metal thermostat continuity.',
          'Verify DC fan output voltage (7-12V DC) on the main motherboard.'
        ],
        source: 'smart_knowledge_engine'
      };
    }
  }

  // 2. DISHWASHING
  if (category === 'dishwashing') {
    if (
      errCode === 'E24' || 
      errCode === 'E25' || 
      symptomText.includes('drain') || 
      symptomText.includes('standing water')
    ) {
      return {
        summary: 'Drainage hydraulic stoppage: Impeller cavity obstruction or drain hose siphon lock.',
        safetyLevel: 'caution',
        safetyInstructions: 'Disconnect appliance power circuit before reaching into sump basin. Broken glass pieces frequently collect around drain impellers.',
        rootCauses: [
          {
            cause: 'Foreign Debris Jamming Drain Pump Impeller',
            probability: 70,
            explanation: 'Olive pit, broken glass shard, or bone fragment slipped through coarse filter mesh into the magnetic impeller chamber.',
            commonParts: ['Impeller Cover Clip (OEM)', 'Microfilter Cylinder Assembly'],
            estimatedCostRange: { min: 0, max: 80 },
            diyDifficulty: 'Easy DIY'
          },
          {
            cause: 'Drain Hose Siphon Lock or Disposal Knockout Plug',
            probability: 20,
            explanation: 'Lack of a high drain loop under sink allows sink water back-siphon, or grease coagulation in corrugated line.',
            commonParts: ['High-Loop Bracket', 'Reinforced Drain Hose (1-1/8")'],
            estimatedCostRange: { min: 25, max: 95 },
            diyDifficulty: 'Easy DIY'
          },
          {
            cause: 'Drain Pump Motor Winding Burnout or Bearing Seizure',
            probability: 10,
            explanation: 'Synchronous BLDC pump motor windings open-circuited due to chronic thermal overheating.',
            commonParts: ['BLDC Drain Pump Motor (e.g. Bosch 00631200)'],
            estimatedCostRange: { min: 85, max: 230 },
            diyDifficulty: 'Moderate DIY'
          }
        ],
        diagnosticSteps: [
          {
            id: 'step-1',
            title: 'Inspect & Clear Triple-Stage Sump Filter',
            description: 'Remove surface debris barrier from sump floor.',
            testProcedure: 'Twist cylindrical microfilter counter-clockwise 1/4 turn, lift out, and scrub with warm soapy water.',
            intent: 'Ensure gravity feed into pump chamber is unrestricted.',
            passCondition: 'Fine mesh screen lets tap water run through without pooling.',
            possibleObservationFailure: 'Filter clogged with grease glaze or food deposit.'
          },
          {
            id: 'step-2',
            title: 'Remove White Impeller Cover Plate',
            description: 'Directly check drain pump impeller blades for physical jam.',
            testProcedure: 'Sponge out standing water. Remove white plastic pump cover under filter using spoon handle or T20 Torx. Feel impeller with gloved finger.',
            intent: 'Verify impeller rotates freely with magnetic distinct resistance pulses.',
            passCondition: 'Impeller rotates 360° with slight magnetic snap, zero foreign grit.',
            possibleObservationFailure: 'Impeller completely locked by glass sliver or plastic bread tag.',
            warningNote: 'Wear puncture-resistant gloves; broken glassware chips are common.'
          },
          {
            id: 'step-3',
            title: 'Verify Sink High-Drain Loop',
            description: 'Inspect drain hose routing under kitchen sink.',
            testProcedure: 'Check that dishwasher hose curves up to touch the underside of the countertop before joining the sink drain.',
            intent: 'Prevent dirty sink water from back-siphoning into dishwasher basin.',
            passCondition: 'Hose forms a high loop at least 32 inches off cabinet floor.',
            possibleObservationFailure: 'Hose lies flat along cabinet floor, creating constant siphoning error.'
          }
        ],
        recommendation: 'safe_diy_maintenance',
        technicianBriefNotes: [
          'Owner performed preliminary sump impeller clearing; verify pump motor resistance (~85 ohms).',
          'Check flow sensor reed switch and non-return check valve ball.'
        ],
        source: 'smart_knowledge_engine'
      };
    }
  }

  // 3. LAUNDRY
  if (category === 'laundry') {
    if (
      symptomText.includes('spin') || 
      symptomText.includes('banging') || 
      symptomText.includes('shaking') || 
      errCode === 'UE' || 
      errCode === 'UB'
    ) {
      return {
        summary: 'Suspension rod damping failure or tub out-of-balance centrifugal resonance.',
        safetyLevel: 'safe',
        rootCauses: [
          {
            cause: 'Suspension Rod Damper Spring Fatigue',
            probability: 75,
            explanation: 'Internal grease in suspension rod sleeves has dried or spring tension lost balance, allowing the wash tub to violently slam the cabinet wall during spin cycle.',
            commonParts: ['W10780048 Washer Suspension Rod 4-Pack Kit'],
            estimatedCostRange: { min: 55, max: 170 },
            diyDifficulty: 'Moderate DIY'
          },
          {
            cause: 'Tub Balance Ring Fluid Leakage',
            probability: 15,
            explanation: 'Saline solution inside the plastic ring atop the spin basket has cracked or leaked out, eliminating dynamic mass stabilization.',
            commonParts: ['Spin Basket Balance Ring'],
            estimatedCostRange: { min: 90, max: 210 },
            diyDifficulty: 'Moderate DIY'
          },
          {
            cause: 'Drive Belt Slippage or Motor Pulley Spline Wear',
            probability: 10,
            explanation: 'Glazed belt slipping under heavy wet towel inertia.',
            commonParts: ['Serpentine Drive Belt & Tensioner'],
            estimatedCostRange: { min: 30, max: 90 },
            diyDifficulty: 'Easy DIY'
          }
        ],
        diagnosticSteps: [
          {
            id: 'step-1',
            title: 'Tub Suspension Bounce Test',
            description: 'Evaluate hydraulic damping of suspension springs.',
            testProcedure: 'Push down firmly on center of the wash drum and release instantly.',
            intent: 'Determine if shocks absorb bounce within 1 recovery stroke or oscillate like a trampoline.',
            passCondition: 'Drum rebounds immediately to rest position with zero continuous bouncing.',
            possibleObservationFailure: 'Drum bounces up and down 3-5 times violently, proving blown dampers.'
          },
          {
            id: 'step-2',
            title: 'Spirit Level Check on Chassis Feet',
            description: 'Ensure four-point stable floor contact.',
            testProcedure: 'Place spirit level on top edges of cabinet. Press diagonally on corners.',
            intent: 'Rule out rocking cabinet footing under high-speed RPM.',
            passCondition: 'Level bubble centered in both axes; no corner wobble when leaned on.',
            possibleObservationFailure: 'One front foot is floating or locking nut is loose.'
          }
        ],
        recommendation: 'safe_diy_maintenance',
        technicianBriefNotes: [
          'Test suspension rod rebound damping; advise replacing all 4 rods as a matched set.',
          'Inspect optical tachometer / Hall sensor on motor rotor.'
        ],
        source: 'smart_knowledge_engine'
      };
    }
  }

  // 4. HVAC
  if (category === 'hvac') {
    if (
      errCode === '34' || 
      errCode === '33' || 
      symptomText.includes('ignit') || 
      symptomText.includes('short cycle') || 
      symptomText.includes('blow cold')
    ) {
      return {
        summary: 'Furnace flame rectification failure or inducer pressure switch lockout.',
        safetyLevel: 'caution',
        safetyInstructions: 'Turn off furnace power switch before servicing burner compartment. Never bypass safety flame sensors or high-limit switches.',
        rootCauses: [
          {
            cause: 'Flame Sensor Carbon Oxidation Coating',
            probability: 70,
            explanation: 'Microscopic silica and carbon soot coats the stainless flame rod, preventing micro-amp DC flame rectification current to the board.',
            commonParts: ['Fine Scotch-Brite Pad', 'Universal Flame Sensor Rod (LH680014)'],
            estimatedCostRange: { min: 10, max: 80 },
            diyDifficulty: 'Easy DIY'
          },
          {
            cause: 'Inducer Draft Pressure Switch or Exhaust Port Condensate Clog',
            probability: 20,
            explanation: 'Condensate slime blocking the 1/8-inch silicone reference tube or flue pipe back-pressure.',
            commonParts: ['Silicone Pressure Tubing', 'Dual Differential Pressure Switch'],
            estimatedCostRange: { min: 35, max: 140 },
            diyDifficulty: 'Moderate DIY'
          },
          {
            cause: 'Hot Surface Igniter (HSI) Element Cracking',
            probability: 10,
            explanation: 'Silicon nitride or carbide igniter thermal stress fracture; element glows partially or stays dead.',
            commonParts: ['Universal Silicon Nitride Igniter'],
            estimatedCostRange: { min: 45, max: 130 },
            diyDifficulty: 'Moderate DIY'
          }
        ],
        diagnosticSteps: [
          {
            id: 'step-1',
            title: 'Observe Ignition Sequence Timing',
            description: 'Watch the sequence through the cabinet sight glass.',
            testProcedure: 'Turn thermostat heat on. Count seconds from inducer motor start, to igniter glow, to burner fire, to shutoff.',
            intent: 'Pinpoint the exact phase of combustion control failure.',
            passCondition: 'Burners ignite and stay lit continuously for full heating call.',
            possibleObservationFailure: 'Burner ignites for 4 seconds then clicks off, repeated 3 times before hard lockout (classic flame sensor).'
          },
          {
            id: 'step-2',
            title: 'Inspect & Polish Flame Sensor Rod',
            description: 'Remove single 1/4" hex screw and clean sensing probe.',
            testProcedure: 'Remove flame rod from burner bracket. Gently polish probe surface with a clean Scotch-Brite pad until shiny metal shows. Reinstall.',
            intent: 'Restore micro-amp DC flame rectification continuity without leaving steel wool residues.',
            passCondition: 'Rod is bright silver and clean.',
            possibleObservationFailure: 'Rod coated in gray crusty soot.'
          }
        ],
        recommendation: 'safe_diy_maintenance',
        technicianBriefNotes: [
          'Flame sensor cleaned; verify flame rectification current reading (> 1.5 µA DC).',
          'Check exhaust static draft pressure across heat exchanger.'
        ],
        source: 'smart_knowledge_engine'
      };
    }
  }

  // Generic Intelligent Fallback
  return {
    summary: `Diagnostic evaluation for ${req.appliance.brand} ${req.appliance.category}: Symptom indicates mechanical wear or sensor feedback variance.`,
    safetyLevel: 'safe',
    rootCauses: [
      {
        cause: `Primary Electro-Mechanical Actuator / Sensor Failure in ${req.appliance.category}`,
        probability: 60,
        explanation: `Commonly observed failure mode in ${req.appliance.brand} machines of this age: component wear prevents proper control feedback.`,
        commonParts: ['Main OEM Actuator Assembly', 'Position / Thermostat Sensor Probe'],
        estimatedCostRange: { min: 80, max: 240 },
        diyDifficulty: 'Moderate DIY'
      },
      {
        cause: 'Wiring Harness Connection or Terminal Oxidation',
        probability: 25,
        explanation: 'Vibration and thermal expansion over time cause high-resistance terminal pins on sub-boards.',
        commonParts: ['Electrical Contact Cleaner & Terminal Kit'],
        estimatedCostRange: { min: 20, max: 60 },
        diyDifficulty: 'Easy DIY'
      },
      {
        cause: 'Main Control Board Relay Output Failure',
        probability: 15,
        explanation: 'Onboard power relay contacts pitted, failing to deliver 120V to internal components.',
        commonParts: ['OEM Main Control Board'],
        estimatedCostRange: { min: 160, max: 380 },
        diyDifficulty: 'Professional Only'
      }
    ],
    diagnosticSteps: [
      {
        id: 'step-1',
        title: 'Hard Power Reset & Residual Energy Drain',
        description: 'Clear microprocessor soft-fault latching.',
        testProcedure: 'Unplug unit or switch breaker off for 5 full minutes. Press power button while unplugged to drain capacitor charge. Re-power.',
        intent: 'Rule out transient firmware glitch or micro-surge lock.',
        passCondition: 'Appliance reboot completes normal calibration chime without immediate fault return.',
        possibleObservationFailure: 'Error reappears instantly upon power-up.'
      },
      {
        id: 'step-2',
        title: 'Check Airflow, Intake, and Drainage Clearances',
        description: 'Verify operational environment meets manufacturer tolerances.',
        testProcedure: 'Inspect rear and underside clearances, lint filters, intake grates, and flexible lines for kinks or crushing.',
        intent: 'Ensure external installation factors are not inducing thermal or pressure trips.',
        passCondition: 'All pathways unobstructed with minimum 2" clearance.',
        possibleObservationFailure: 'Crushed hose, blanket of lint, or blocked exhaust.'
      }
    ],
    recommendation: 'call_technician',
    technicianBriefNotes: [
      `Inspect ${req.appliance.brand} ${req.appliance.modelNumber || ''} error history log through technician service diagnostics mode.`,
      'Check input power line voltage under active operational load.'
    ],
    source: 'smart_knowledge_engine'
  };
}

/**
 * Main public function: Diagnose an appliance symptom using AI or Smart Engine
 */
export async function diagnoseWithAi(req: DiagnoseRequest): Promise<AiDiagnosticResult> {
  const apiKey = req.apiKeyOverride || getStoredGeminiKey();

  if (apiKey) {
    try {
      return await callGeminiApi(req, apiKey);
    } catch (err) {
      console.warn('Gemini API call failed, falling back to Smart Knowledge Engine:', err);
      const fallbackResult = runSmartKnowledgeEngine(req);
      fallbackResult.summary += ` (API note: Live Gemini call encountered an issue, served via Smart Appliance Diagnostic Engine).`;
      return fallbackResult;
    }
  }

  // Instant response via Smart Knowledge Engine
  // Simulate short analysis delay for smooth UX transition
  await new Promise(r => setTimeout(r, 600));
  return runSmartKnowledgeEngine(req);
}
