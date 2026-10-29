export type ApplianceCategory = 
  | 'refrigeration' 
  | 'dishwashing' 
  | 'laundry' 
  | 'cooking' 
  | 'hvac' 
  | 'water_heating' 
  | 'small_appliance';

export type ConditionStatus = 'optimal' | 'attention_needed' | 'urgent_repair' | 'retired';

export type WarrantyStatus = 'under_warranty' | 'extended_warranty' | 'expired' | 'unknown';

export interface Appliance {
  id: string;
  name: string;
  category: ApplianceCategory;
  brand: string;
  modelNumber: string;
  serialNumber?: string;
  locationRoom: string;
  purchaseDate?: string; // YYYY-MM-DD, optional if unknown
  purchasePrice?: number | null; // null if unknown, 0 if genuinely free/included
  expectedLifespanYears: number;
  warrantyExpiryDate?: string | null;
  warrantyStatus: WarrantyStatus;
  conditionStatus: ConditionStatus;
  manualUrl?: string;
  notes?: string;
  installedBy?: string;
  energyRating?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TroubleshootingCheckItem {
  id: string;
  title: string;
  testProcedure: string;
  intent: string; // What this preliminary check is intended to establish
  observation: 'passed' | 'failed' | 'skipped';
  possibleExplanation?: string;
}

export interface TroubleshootingSession {
  id: string;
  applianceId: string;
  createdAt: string;
  reportedSymptom: string;
  symptomCategory: string;
  startedWhen: string;
  errorCode?: string;
  userNotes?: string;
  hazardDetected: boolean;
  hazardType?: 'electrical' | 'gas' | 'water_leak' | 'smoke_heat' | 'none';
  checksPerformed: TroubleshootingCheckItem[];
  outcomeSummary: string;
  suggestedNextAction: 'safe_diy_maintenance' | 'call_technician' | 'emergency_shutoff' | 'monitor';
  status: 'completed' | 'in_progress';
}

export interface RepairEvent {
  id: string;
  applianceId: string;
  date: string; // YYYY-MM-DD
  title: string;
  
  // Explicitly distinguished information types
  userReportedSymptom: string;
  technicianDiagnosis?: string;
  possibleExplanation?: string;
  repairPerformed: string;
  partsReplaced: string[];
  
  serviceType: 'professional' | 'diy' | 'warranty_claim';
  serviceCompany?: string;
  technicianName?: string;
  
  laborCost?: number;
  partsCost?: number;
  cost: number; // Total out of pocket
  
  repairWarrantyMonths?: number;
  status: 'completed' | 'in_progress' | 'scheduled';
  followUpNotes?: string;
  
  // Repair Memory Linkages
  recurringIssueFlag?: boolean;
  recurrenceReason?: string;
  relatedRepairIds?: string[];
  relatedSessionId?: string;
}

export interface QuotePartItem {
  id: string;
  name: string;
  partName?: string;
  partNumber?: string;
  cost: number;
  isOem?: boolean;
}

export interface RepairQuote {
  id: string;
  applianceId: string;
  serviceProvider: string; // Technician or shop name entered by user
  contactInfo?: string;
  quoteDate: string;
  
  // Financial breakdown fields (Total = Labour + Parts + Taxes + Additional Fees − Discounts)
  laborCost: number;
  partsCost: number;
  parts: QuotePartItem[];
  taxes: number;
  additionalFees: number; // Trip fee, environmental fee, or disposal fee
  diagnosticFee?: number;
  diagnosticWaivedWithRepair?: boolean;
  discountAmount: number;
  calculatedTotal: number;
  
  warrantyLaborDays: number;
  warrantyPartsMonths: number;
  estimatedTurnaroundDays: number;
  notes?: string;
  isApproved?: boolean;
  sourceType: 'user_entered'; // Clearly distinguishes user input from independent market rates
}

export interface RepairVsReplaceAssumptions {
  applianceId: string;
  proposedRepairCost: number;
  replacementCost: number;
  estimatedFutureAnnualRepairs: number;
  remainingUsefulLifeYears: number | null; // null if unknown
  expectedReplacementLifespanYears: number;
  comparisonPeriodYears: number;
  annualRunningCostDifference: number; // Energy/water savings of replacement ($/yr)
}

export interface DecisionEvaluation {
  id: string;
  applianceId: string;
  evaluatedAt: string;
  assumptions: RepairVsReplaceAssumptions;
  
  // Scenarios calculated over comparison period
  repairScenarioTotal: number;
  replacementScenarioTotal: number;
  netScenarioDifference: number; // positive = repair is cheaper; negative = replace is cheaper
  annualizedRepairCost: number;
  annualizedReplacementCost: number;
  
  // Actuarial thresholds
  repairToReplacementRatio: number;
  fiftyPercentRuleViolated: boolean;
  lifespanThresholdViolated: boolean;
  
  recommendation: 'repair' | 'replace' | 'insufficient_information';
  financialScoreNote: string;
  detailedAnalysis: string;
  limitations: string[];
}

export interface TechnicianSummaryPacket {
  appliance: Appliance;
  currentSymptom: string;
  errorCode?: string;
  startedWhen?: string;
  relatedRepairs: RepairEvent[];
  recurringAlert?: {
    isRecurring: boolean;
    matchCount: number;
    explanation: string;
  };
  suggestedQuestions: string[];
  userQuestions: string[];
  safetyNotes: string[];
}

export type ActiveTab = 
  | 'overview' 
  | 'appliances' 
  | 'troubleshooter' 
  | 'repair-memory' 
  | 'quotesense' 
  | 'repair-vs-replace';

export interface AiDiagnosticRootCause {
  cause: string;
  probability: number; // 0 to 100 percentage
  explanation: string;
  commonParts: string[];
  estimatedCostRange: { min: number; max: number };
  diyDifficulty: 'Easy DIY' | 'Moderate DIY' | 'Professional Only';
}

export interface AiDiagnosticStep {
  id: string;
  title: string;
  description: string;
  testProcedure: string;
  intent: string;
  passCondition: string;
  possibleObservationFailure: string;
  warningNote?: string;
}

export interface AiDiagnosticResult {
  summary: string;
  safetyLevel: 'safe' | 'caution' | 'danger_shutoff';
  safetyInstructions?: string;
  rootCauses: AiDiagnosticRootCause[];
  diagnosticSteps: AiDiagnosticStep[];
  recommendation: 'safe_diy_maintenance' | 'call_technician' | 'emergency_shutoff' | 'monitor';
  technicianBriefNotes: string[];
  source: 'gemini_ai' | 'smart_knowledge_engine';
}
