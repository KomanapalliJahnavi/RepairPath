import { Appliance, RepairEvent, RepairQuote, DecisionEvaluation, TroubleshootingSession } from '../types';

export const INITIAL_APPLIANCES: Appliance[] = [
  {
    id: 'app-01',
    name: 'Primary Kitchen Refrigerator',
    category: 'refrigeration',
    brand: 'Samsung',
    modelNumber: 'RF28R7351SR',
    serialNumber: '0BR843BN801292W',
    locationRoom: 'Kitchen',
    purchaseDate: '2019-06-15',
    purchasePrice: 2299,
    expectedLifespanYears: 12,
    warrantyExpiryDate: '2020-06-15',
    warrantyStatus: 'expired',
    conditionStatus: 'attention_needed',
    notes: 'French door with CoolSelect pantry drawer. Ice maker chute prone to frost accumulation in humid summer months.',
    installedBy: 'Best Buy Delivery & Installation',
    energyRating: 'Energy Star Certified (690 kWh/yr)',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-10-18T14:30:00Z',
  },
  {
    id: 'app-02',
    name: 'Quiet-Series Built-in Dishwasher',
    category: 'dishwashing',
    brand: 'Bosch',
    modelNumber: 'SHP78CM5N',
    serialNumber: 'FD0208003492',
    locationRoom: 'Kitchen',
    purchaseDate: '2022-03-20',
    purchasePrice: 1299,
    expectedLifespanYears: 11,
    warrantyExpiryDate: '2023-03-20',
    warrantyStatus: 'expired',
    conditionStatus: 'optimal',
    notes: 'CrystalDry zeolite heating system. Clean triple-stage microfilter every 60 days.',
    installedBy: 'Self-installed with brass elbow kit',
    energyRating: 'Tier 1 Top Efficiency (240 kWh/yr)',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-09-02T11:00:00Z',
  },
  {
    id: 'app-03',
    name: 'High-Efficiency Front-Load Washer',
    category: 'laundry',
    brand: 'LG',
    modelNumber: 'WM4000HWA',
    serialNumber: '109KWED82711',
    locationRoom: 'Laundry Room',
    purchaseDate: '2021-11-28',
    purchasePrice: 949,
    expectedLifespanYears: 10,
    warrantyExpiryDate: '2031-11-28',
    warrantyStatus: 'extended_warranty',
    conditionStatus: 'optimal',
    notes: 'Direct Drive motor covered by 10-year manufacturer limited parts warranty. Tub Clean cycle run monthly.',
    installedBy: 'Costco Logistics Team',
    energyRating: 'CEE Tier 2 (90 kWh/yr)',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-08-15T16:20:00Z',
  },
  {
    id: 'app-04',
    name: 'High-Efficiency Condensing Furnace',
    category: 'hvac',
    brand: 'Carrier',
    modelNumber: '59TN6B080C1714',
    serialNumber: '4217A92014',
    locationRoom: 'Utility / Basement',
    purchaseDate: '2017-10-12',
    purchasePrice: 4850,
    expectedLifespanYears: 18,
    warrantyExpiryDate: '2027-10-12',
    warrantyStatus: 'extended_warranty',
    conditionStatus: 'optimal',
    notes: 'Infinity 96 two-stage variable speed gas furnace. 10-year registered parts warranty with installer.',
    installedBy: 'Precision Air Systems LLC',
    energyRating: '96.7% AFUE',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-10-01T08:15:00Z',
  }
];

export const INITIAL_REPAIRS: RepairEvent[] = [
  {
    id: 'rep-01',
    applianceId: 'app-01',
    date: '2023-04-14',
    title: 'Ice Room Defrost Heater & Augmented Seal Replacement',
    userReportedSymptom: 'Ice maker froze into solid block; loud grinding noise during auger rotation',
    technicianDiagnosis: 'Cabinet seam air leakage around ice compartment perimeter gasket allowing moisture ingress and coil frost build-up',
    possibleExplanation: 'Warm humid ambient kitchen air drawn into sub-zero ice box',
    repairPerformed: 'Installed updated auger assembly, defrosted coil manually, and applied RTV silicone sealant bead per TSB',
    serviceType: 'professional',
    serviceCompany: 'Apex Home Appliance Service',
    technicianName: 'Marcus Vance (Cert #8821)',
    laborCost: 130,
    partsCost: 165,
    cost: 295,
    partsReplaced: ['DA97-15217D Ice Maker Assembly', 'Defrost Drain Tube Clip'],
    repairWarrantyMonths: 6,
    status: 'completed',
    followUpNotes: 'Advised owner to monitor ice cube size and defrost drain pan under compressor.',
    recurringIssueFlag: true,
    recurrenceReason: 'Repeated ice chute frost accumulation on Samsung French Door chassis',
    relatedRepairIds: ['rep-02'],
  },
  {
    id: 'rep-02',
    applianceId: 'app-01',
    date: '2024-09-08',
    title: 'Evaporator Fan Motor Replacement',
    userReportedSymptom: 'High-pitched whistling vibration when refrigerator door closed; fridge compartment reached 44°F',
    technicianDiagnosis: 'Bearing wear on DC circulation fan caused by heavy frost buildup drag',
    possibleExplanation: 'Ice buildup from ice room migrating down rear air tower',
    repairPerformed: 'Replaced circulation fan motor and internal cabinet temperature sensor',
    serviceType: 'professional',
    serviceCompany: 'Reliable Tech Appliance',
    technicianName: 'David Cho',
    laborCost: 180,
    partsCost: 160,
    cost: 340,
    partsReplaced: ['DA31-00287B DC Evap Fan Motor', 'Internal Temperature Sensor Probe'],
    repairWarrantyMonths: 12,
    status: 'completed',
    followUpNotes: 'Technician noted recurrence of ice buildup on top rear panel. Advised checking defrost bi-metal thermostat if issue reoccurs.',
    recurringIssueFlag: true,
    recurrenceReason: 'Second service event directly tied to chronic ice compartment frosting',
    relatedRepairIds: ['rep-01'],
  },
  {
    id: 'rep-03',
    applianceId: 'app-02',
    date: '2023-11-05',
    title: 'Drain Impeller Clearing & Filter Gasket Tune-Up',
    userReportedSymptom: 'Error code E24 on display panel; standing water left in bottom sump basin',
    technicianDiagnosis: 'Mechanical jam in drain pump impeller cavity (cleared by owner)',
    possibleExplanation: 'Foreign debris bypass through coarse filter',
    repairPerformed: 'Removed pump cover under triple-stage filter using T20 key, extracted olive pit and glass shard, retested drain pump cycle',
    serviceType: 'diy',
    cost: 0,
    partsReplaced: [],
    status: 'completed',
    followUpNotes: 'Cleaned microfilter under warm tap water with soft bristle brush. Drain verified free-flowing.',
    recurringIssueFlag: false,
  },
  {
    id: 'rep-04',
    applianceId: 'app-04',
    date: '2024-01-22',
    title: 'Flame Sensor Polishing & Inducer Draft Calibration',
    userReportedSymptom: 'Furnace igniting for 4 seconds then shutting down on short cycling error code 34',
    technicianDiagnosis: 'Microscopic carbon oxidation coating the flame sensor rod, preventing micro-amp DC flame rectification detection',
    possibleExplanation: 'Normal combustion byproduct deposition over 6 heating seasons',
    repairPerformed: 'Extracted flame sensor rod, cleaned surface with fine Scotch-Brite pad (zero abrasive grit left), verified 4.2 µA reading',
    serviceType: 'professional',
    serviceCompany: 'Precision Air Systems LLC',
    technicianName: 'Sarah Jenkins',
    laborCost: 165,
    partsCost: 0,
    cost: 165,
    partsReplaced: [],
    repairWarrantyMonths: 3,
    status: 'completed',
    followUpNotes: 'Combustion exhaust static pressure and draft pressure switch tested within manufacturer spec.',
    recurringIssueFlag: false,
  }
];

export const INITIAL_SESSIONS: TroubleshootingSession[] = [
  {
    id: 'sess-01',
    applianceId: 'app-01',
    createdAt: '2024-10-20T14:15:00Z',
    reportedSymptom: 'Ice cubes clumping together; small frost crust forming at top dispenser opening',
    symptomCategory: 'Frost & Ice Build-up',
    startedWhen: '3 days ago',
    errorCode: 'None displayed',
    userNotes: 'Room humidity has been high. Door gasket feels slightly stiff on top right corner.',
    hazardDetected: false,
    checksPerformed: [
      {
        id: 'chk-1',
        title: 'Door Gasket Dollar Bill Resistance Test',
        testProcedure: 'Close door on bill and pull across perimeter',
        intent: 'Establish whether ambient air is leaking through deformed rubber seal',
        observation: 'failed',
        possibleExplanation: 'Top corner gasket allows air slip without friction resistance',
      },
      {
        id: 'chk-2',
        title: 'Condenser Coil Clearance Inspection',
        testProcedure: 'Check rear air intake for dust blanket',
        intent: 'Verify heat exchange airflow',
        observation: 'passed',
        possibleExplanation: 'Coils were vacuumed last month and airflow is unimpeded',
      }
    ],
    outcomeSummary: 'Preliminary checks indicate door gasket magnetic seal failure, permitting moisture ingress.',
    suggestedNextAction: 'call_technician',
    status: 'completed',
  }
];

export const INITIAL_QUOTES: RepairQuote[] = [
  {
    id: 'quote-01',
    applianceId: 'app-01',
    serviceProvider: 'Apex Home Appliance Service',
    contactInfo: '(555) 234-8900 • service@apexappliance.example',
    quoteDate: '2024-10-22',
    laborCost: 185,
    partsCost: 215,
    parts: [
      { id: 'part-01', name: 'OEM Samsung DA97-15217G Updated Ice Maker Kit', cost: 165, isOem: true },
      { id: 'part-02', name: 'Samsung DA96-00558A Defrost Thermostat Assembly', cost: 50, isOem: true }
    ],
    taxes: 28,
    additionalFees: 0,
    diagnosticFee: 95,
    diagnosticWaivedWithRepair: true,
    discountAmount: 20,
    calculatedTotal: 408,
    warrantyLaborDays: 90,
    warrantyPartsMonths: 12,
    estimatedTurnaroundDays: 2,
    notes: 'Diagnostic fee ($95) waived upon repair approval. Includes $20 promotional discount coupon. All parts are authentic factory OEM directly sourced from Samsung Parts distribution.',
    isApproved: false,
    sourceType: 'user_entered',
  },
  {
    id: 'quote-02',
    applianceId: 'app-01',
    serviceProvider: 'Metro FastFix Appliance Pros',
    contactInfo: '(555) 877-3310 • dispatch@metrofastfix.example',
    quoteDate: '2024-10-23',
    laborCost: 260,
    partsCost: 175,
    parts: [
      { id: 'part-03', name: 'Aftermarket Compatible Ice Maker Kit', cost: 125, isOem: false },
      { id: 'part-04', name: 'Universal Sensor Probe', cost: 50, isOem: false }
    ],
    taxes: 30.45,
    additionalFees: 125, // Diagnostic trip charge billed separately
    diagnosticFee: 125,
    diagnosticWaivedWithRepair: false,
    discountAmount: 0,
    calculatedTotal: 590.45,
    warrantyLaborDays: 30,
    warrantyPartsMonths: 3,
    estimatedTurnaroundDays: 4,
    notes: 'Diagnostic trip charge ($125) is billed separately as an additional fee and NOT credited toward labor. Uses aftermarket supplier components with 90-day parts coverage.',
    isApproved: false,
    sourceType: 'user_entered',
  }
];

export const INITIAL_EVALUATIONS: DecisionEvaluation[] = [
  {
    id: 'eval-01',
    applianceId: 'app-01',
    evaluatedAt: '2024-10-23T15:45:00Z',
    assumptions: {
      applianceId: 'app-01',
      proposedRepairCost: 408,
      replacementCost: 2100,
      estimatedFutureAnnualRepairs: 60,
      remainingUsefulLifeYears: 6.7,
      expectedReplacementLifespanYears: 12,
      comparisonPeriodYears: 3,
      annualRunningCostDifference: 35,
    },
    repairScenarioTotal: 693,
    replacementScenarioTotal: 2100,
    netScenarioDifference: 1407,
    annualizedRepairCost: 231,
    annualizedReplacementCost: 175,
    repairToReplacementRatio: 19.4,
    fiftyPercentRuleViolated: false,
    lifespanThresholdViolated: false,
    recommendation: 'repair',
    financialScoreNote: 'Repair scenario saves $1,407 over a 3-year comparison window.',
    detailedAnalysis: 'Repairing the existing appliance is the economically rational choice. The total cost of repair plus projected maintenance over 3 years ($693) remains $1,407 lower than purchasing a new replacement unit ($2,100). The quote represents 19.4% of new cost, comfortably under the 50% prudence ceiling.',
    limitations: [
      'Assumes $60/yr in future maintenance based on past history.',
      'Energy efficiency difference is an editable estimate ($35/yr).'
    ]
  }
];

export interface DiagnosticQuestionNode {
  id: string;
  category: Appliance['category'];
  symptomName: string;
  safetyCheck: string;
  hazardType?: 'electrical' | 'gas' | 'water_leak' | 'smoke_heat';
  steps: {
    id: string;
    title: string;
    description: string;
    testProcedure: string;
    intent: string;
    passCondition: string;
    possibleObservationFailure: string;
    warningNote?: string;
  }[];
  verdictRule: {
    diyRecommended: boolean;
    urgencyLevel: 'Normal Maintenance' | 'Action Needed' | 'Immediate Hazard (Shut Off)';
    summary: string;
    suggestedNextAction: 'safe_diy_maintenance' | 'call_technician' | 'emergency_shutoff' | 'monitor';
    techChecklist: string[];
  };
}

export const DIAGNOSTIC_KNOWLEDGE_BASE: DiagnosticQuestionNode[] = [
  {
    id: 'diag-ref-01',
    category: 'refrigeration',
    symptomName: 'Frost Buildup & Temperature Fluctuation (Warm Compartment)',
    safetyCheck: 'Always unplug the appliance or trip the breaker before examining rear coils or removing interior air baffle panels. Never use sharp metal knives or ice picks to scrape evaporator frost.',
    steps: [
      {
        id: 'step-ref-1',
        title: 'Check Door Gasket Magnetic Seal',
        description: 'A compromised rubber door gasket allows humid ambient air to enter continuously, causing evaporator frost.',
        testProcedure: 'Close the door on a crisp dollar bill. Pull gently. There should be uniform friction resistance across the entire door perimeter.',
        intent: 'Establish whether ambient humid air is leaking into the sub-zero cabinet cavity.',
        passCondition: 'Dollar bill cannot be easily slid out without firm resistance on all 4 edges.',
        possibleObservationFailure: 'Paper slides out freely with no resistance, indicating collapsed gasket folds or misaligned door hinges.',
        warningNote: 'If the paper slips freely, warm the deformed gasket fold with a hair dryer on medium heat to restore magnetic contact.'
      },
      {
        id: 'step-ref-2',
        title: 'Inspect Condenser Coils & Air Circulation',
        description: 'Dust-clogged condenser coils prevent refrigerant heat rejection, forcing the compressor to run hot continuously.',
        testProcedure: 'Examine bottom or rear coil grate with a flashlight. Vacuum any pet hair or lint blankets.',
        intent: 'Verify heat exchange surface is clear to rule out thermal overload.',
        passCondition: 'Coil fins are clear with unobstructed airflow clearance of at least 2 inches from wall.',
        possibleObservationFailure: 'Coil fins are blanketed in a dense layer of pet hair or dryer lint, trapping heat.'
      },
      {
        id: 'step-ref-3',
        title: 'Test Evaporator Circulation Fan',
        description: 'Open the freezer door and manually depress the interior door switch peg.',
        testProcedure: 'Listen for the whisper of the circulation fan motor starting within 5 seconds of depressing the door switch.',
        intent: 'Determine if cool air is actively being circulated across shelves or if the fan motor is seized.',
        passCondition: 'Quiet air rush heard. No squealing, chirping, or silence.',
        possibleObservationFailure: 'Fan makes a loud chirping or buzzing vibration, or fails to rotate at all.',
        warningNote: 'If fan blades strike frost, do not force them. The automatic defrost heater or bi-metal sensor requires technician testing.'
      }
    ],
    verdictRule: {
      diyRecommended: false,
      urgencyLevel: 'Action Needed',
      summary: 'Likely defrost system heater/bimetal failure or evaporator fan motor obstruction. Technician visit recommended.',
      suggestedNextAction: 'call_technician',
      techChecklist: [
        'Model & serial number plate photo',
        'Exact temperature readings of fresh food & freezer compartments',
        'Record of whether compressor is actively vibrating/running',
        'Note date when frost buildup first reappeared'
      ]
    }
  },
  {
    id: 'diag-dish-01',
    category: 'dishwashing',
    symptomName: 'Standing Water in Bottom Basin (Error E24 / E25)',
    safetyCheck: 'Disconnect power circuit. Wear protective gloves when reaching into sump basin; broken glass shards frequently settle around the impeller.',
    steps: [
      {
        id: 'step-dish-1',
        title: 'Inspect & Clean Cylindrical Microfilter',
        description: 'Food residue, lime deposit, or grease film blocks gravity drainage into the sump chamber.',
        testProcedure: 'Twist the lower mesh filter counter-clockwise and lift out. Scrub under hot tap water with a soft nylon brush and dish soap.',
        intent: 'Confirm that mechanical drainage blockage is not simply caused by surface grease clogging the filter mesh.',
        passCondition: 'Water passes freely through the fine mesh screen without pooling.',
        possibleObservationFailure: 'Mesh screen is coated in a thick, impermeable layer of calcium and solidified cooking fat.'
      },
      {
        id: 'step-dish-2',
        title: 'Examine Drain Pump Impeller Access',
        description: 'Small foreign objects (toothpicks, seeds, glass) lock the magnetic pump rotor.',
        testProcedure: 'Sponge out standing water. Remove plastic pump cover tab (if equipped). Gently spin impeller with finger.',
        intent: 'Establish whether the drain pump rotor is physically jammed by foreign debris.',
        passCondition: 'Impeller spins with light indexed spring-like magnetic resistance, no hard jams.',
        possibleObservationFailure: 'Impeller is completely seized by a hard foreign object wedged between blade tips.',
        warningNote: 'Ensure the pump cover clicks firmly back into locked position; without it, pump creates no suction.'
      },
      {
        id: 'step-dish-3',
        title: 'Check Garbage Disposal & High Loop Air Gap',
        description: 'If recently installed, garbage disposal drain plug may still be knocked in; or sink drain hose is kinked.',
        testProcedure: 'Inspect under-sink drain hose. Ensure it elevates in a high loop higher than the sink flood level before entering the drain pipe.',
        intent: 'Verify gravity and siphon backflow prevention.',
        passCondition: 'Hose loop is elevated and unkinked; disposal knock-out plug is confirmed punched out.',
        possibleObservationFailure: 'Drain hose sags onto cabinet floor, allowing dirty sink water to back-siphon into dishwasher.'
      }
    ],
    verdictRule: {
      diyRecommended: true,
      urgencyLevel: 'Normal Maintenance',
      summary: 'High probability of resolved obstruction via simple filter or impeller clearing without professional expense.',
      suggestedNextAction: 'safe_diy_maintenance',
      techChecklist: [
        'Confirm whether drain pump buzzes or remains silent during cycle cancel',
        'Confirm if sink drains freely without backup',
        'Document exact error code displayed on control panel'
      ]
    }
  },
  {
    id: 'diag-wash-01',
    category: 'laundry',
    symptomName: 'Excessive Vibration & Bang Noise During High-Speed Spin',
    safetyCheck: 'Never attempt to reach into a rotating wash drum. Shut off machine immediately if drum strikes outer cabinet frame.',
    steps: [
      {
        id: 'step-wash-1',
        title: 'Verify Cabinet Leveling with Spirit Level',
        description: 'Unlevel feet transfer centrifugal kinetic force straight through the floor and chassis.',
        testProcedure: 'Place a spirit level across top front and side edges. Try rocking the machine corner-to-corner with body weight.',
        intent: 'Establish whether uneven floor contact is amplifying centrifugal vibration.',
        passCondition: 'All 4 feet contact floor solidly with zero diagonal wobble; lock nuts tightened up against the chassis.',
        possibleObservationFailure: 'One diagonal foot is suspended 1/4 inch above the tile floor, allowing aggressive rocking.'
      },
      {
        id: 'step-wash-2',
        title: 'Check for Drum Shock Absorber Resistance',
        description: 'Front-load washing machines utilize 2-4 hydraulic or friction dampers beneath the wash tub.',
        testProcedure: 'Push firmly down on the bottom front edge of the stainless inner drum, then release quickly.',
        intent: 'Determine if suspension dampers have lost hydraulic dampening resistance.',
        passCondition: 'Tub rebounds smoothly and stops in 1 bounce. If it bounces 3-4 times loosely like an old car suspension, dampers are shot.',
        possibleObservationFailure: 'Tub oscillates freely with zero resistance, swinging like an undamped pendulum.',
        warningNote: 'Replacing suspension dampers is a moderate-skill DIY repair or standard 1-hour technician job.'
      },
      {
        id: 'step-wash-3',
        title: 'Examine Coin Trap / Debris Filter',
        description: 'Unbalanced loads can occur if wash water drains sluggishly between spin increments.',
        testProcedure: 'Open lower access door, place shallow pan, unscrew drain pump plug, clear lint and coins.',
        intent: 'Ensure rapid evacuation of water weight before high-RPM spin transition.',
        passCondition: 'Clear passage free of hair pins, coins, or fabric buildup.',
        possibleObservationFailure: 'Pump trap contains coins, keys, or hair clumps obstructing high-volume water discharge.'
      }
    ],
    verdictRule: {
      diyRecommended: true,
      urgencyLevel: 'Action Needed',
      summary: 'Re-leveling feet and clearing coin trap often resolves 80% of violent vibrations. If dampers are weak, replacement is straightforward.',
      suggestedNextAction: 'safe_diy_maintenance',
      techChecklist: [
        'Age and load size when vibration occurs',
        'Whether drum makes a rumbling roar when spun by hand (indicates rear tub bearing failure)',
        'Presence of any oily black mist on floor underneath the washer'
      ]
    }
  },
  {
    id: 'diag-hvac-01',
    category: 'hvac',
    symptomName: 'Furnace Blows Cold Air or Cycles Off After 5 Seconds of Ignition',
    safetyCheck: 'DANGER: If you smell sulfur/rotten eggs (natural gas), immediately evacuate the building and call gas utility from outside. Do not toggle electrical switches.',
    hazardType: 'gas',
    steps: [
      {
        id: 'step-hvac-1',
        title: 'Inspect Air Filter Cleanliness',
        description: 'A choked air filter causes high-limit thermal switch trip, cutting the gas valve while fan continues blowing cold.',
        testProcedure: 'Slide out furnace filter and hold against a light source.',
        intent: 'Rule out high-limit thermal tripping caused by air starvation.',
        passCondition: 'Light is clearly visible through filter media; filter was replaced within past 90 days.',
        possibleObservationFailure: 'Filter is completely clogged with dark gray dust mats, bowing inward from static suction.',
        warningNote: 'High MERV pleated filters (>MERV 11) cause excessive static pressure on standard blowers.'
      },
      {
        id: 'step-hvac-2',
        title: 'Observe LED Diagnostic Code on Blower Board',
        description: 'Modern control boards flash blink codes through a sight glass on the lower door panel.',
        testProcedure: 'Count slow and fast red/amber flashes before turning power off.',
        intent: 'Capture the microcontroller’s recorded safety lockout code.',
        passCondition: 'Steady heartbeat flash or recorded code (e.g. 33 = limit open, 34 = flame sense failure).',
        possibleObservationFailure: 'Blower board flashes continuous rapid red pulse indicating thermal limit lockout.'
      },
      {
        id: 'step-hvac-3',
        title: 'Inspect Flame Rectification Sensor Rod',
        description: 'Microscopic carbon buildup insulates the flame sensor rod, preventing the microamp ionization signal to the board.',
        testProcedure: 'Locate thin metal rod bathed in burner flame on opposite side of hot surface igniter.',
        intent: 'Establish whether the flame ionization detection circuit is functioning.',
        passCondition: 'Rod is clean metal without black carbon crust; burner stays lit continuously after ignition.',
        possibleObservationFailure: 'Rod has a dull black crusty coating; flame lights for 4 seconds then gas valve audibly clicks shut.',
        warningNote: 'Cleaning flame sensor requires turning off 120V switch and gas shutoff valve first. Use non-shedding Scotch-Brite only.'
      }
    ],
    verdictRule: {
      diyRecommended: false,
      urgencyLevel: 'Action Needed',
      summary: 'Most frequently caused by dirty flame sensor or dirty filter. Gas valve and combustion components require qualified HVAC technician.',
      suggestedNextAction: 'call_technician',
      techChecklist: [
        'Count of LED flash code through furnace sight glass',
        'Brand and serial number of furnace control board',
        'Exact duration of burner fire before shutdown (e.g., shuts off after 3-4 seconds)'
      ]
    }
  }
];
