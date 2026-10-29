import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  ClipboardList, 
  RotateCcw,
  Scale,
  AlertTriangle,
  History,
  FileText,
  BookmarkCheck,
  Flame,
  Zap,
  Droplets,
  Sparkles,
  Cpu,
  Wrench,
  DollarSign,
  HelpCircle,
  Key
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DIAGNOSTIC_KNOWLEDGE_BASE } from '../../data/seedData';
import { analyzeRepairMemory } from '../../utils/repairMemoryMatcher';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { TechnicianSummaryModal } from './TechnicianSummaryModal';
import { AiApiKeyModal } from './AiApiKeyModal';
import { TroubleshootingCheckItem, AiDiagnosticResult } from '../../types';
import { diagnoseWithAi, getStoredGeminiKey } from '../../services/aiDiagnosticService';

export const TroubleshooterWizard: React.FC = () => {
  const { 
    appliances, 
    selectedApplianceId, 
    setSelectedApplianceId, 
    repairEvents,
    troubleshootingSessions,
    addTroubleshootingSession,
    setActiveTab 
  } = useApp();

  const [activeApplianceId, setActiveApplianceId] = useState<string>(
    selectedApplianceId || (appliances[0]?.id ?? '')
  );

  const selectedAppliance = appliances.find(a => a.id === activeApplianceId);

  // Diagnostic Mode: 'ai_copilot' (default) or 'preset' (traditional decision tree)
  const [diagnosticMode, setDiagnosticMode] = useState<'ai_copilot' | 'preset'>('ai_copilot');

  // User input states
  const [selectedDiagId, setSelectedDiagId] = useState<string>(DIAGNOSTIC_KNOWLEDGE_BASE[0].id);
  const [symptomInput, setSymptomInput] = useState<string>('');
  const [startedWhen, setStartedWhen] = useState<string>('Today / Sudden onset');
  const [errorCode, setErrorCode] = useState<string>('');
  const [sensoryDetails, setSensoryDetails] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');

  // AI Diagnostic States
  const [aiResult, setAiResult] = useState<AiDiagnosticResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoadingPhase, setAiLoadingPhase] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasCustomApiKey, setHasCustomApiKey] = useState(Boolean(getStoredGeminiKey()));

  // Critical hazard screening
  const [hazardFlag, setHazardFlag] = useState<'none' | 'smoke_heat' | 'gas' | 'electrical' | 'water_leak'>('none');
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  // Interactive check observations
  const [checkObservations, setCheckObservations] = useState<Record<string, 'passed' | 'failed' | 'skipped'>>({});
  const [sessionSaved, setSessionSaved] = useState(false);
  const [isTechPacketOpen, setIsTechPacketOpen] = useState(false);

  // Predefined diagnostic node
  const activeDiagnostic = DIAGNOSTIC_KNOWLEDGE_BASE.find(d => d.id === selectedDiagId) || DIAGNOSTIC_KNOWLEDGE_BASE[0];

  // Effective symptom description
  const currentEffectiveSymptom = diagnosticMode === 'ai_copilot'
    ? (symptomInput || 'Unspecified operational irregularity')
    : activeDiagnostic.symptomName;

  // Analyze Repair Memory for recurring symptoms
  const memoryAnalysis = useMemo(() => {
    if (!activeApplianceId) return null;
    return analyzeRepairMemory(
      activeApplianceId,
      currentEffectiveSymptom,
      errorCode,
      repairEvents,
      troubleshootingSessions
    );
  }, [activeApplianceId, currentEffectiveSymptom, errorCode, repairEvents, troubleshootingSessions]);

  // Quick suggestions based on appliance category
  const quickSymptoms = useMemo(() => {
    if (!selectedAppliance) return [];
    switch (selectedAppliance.category) {
      case 'refrigeration':
        return [
          { label: 'Fridge compartment warm but freezer is freezing', symptom: 'Fresh food compartment warm (46°F), freezer cold; whistling fan noise', code: '' },
          { label: 'Ice maker stopped dispensing / frozen solid', symptom: 'Ice room frosted solid; ice cubes clumping together', code: '' },
          { label: 'Water leaking under crisper drawers', symptom: 'Standing water freezing under bottom crisper pans', code: '' },
        ];
      case 'dishwashing':
        return [
          { label: 'Error E24 / Standing water in bottom basin', symptom: 'Standing dirty water left in bottom sump after cycle', code: 'E24' },
          { label: 'Dishes coming out gritty / residue on glasses', symptom: 'Cloudy film and food particulate left on upper rack glasses', code: '' },
          { label: 'Error E15 / Water leak float triggered', symptom: 'Appliance constantly runs drain pump even when switched off', code: 'E15' },
        ];
      case 'laundry':
        return [
          { label: 'Violent banging / vibration on spin cycle', symptom: 'Tub slams cabinet walls during high-speed extraction', code: 'UE' },
          { label: 'Washer will not drain water', symptom: 'Cycle halts with full tub of soapy water; humming sound', code: 'OE' },
          { label: 'Dryer tumbling but blowing cold air', symptom: 'Dryer drum rotates but clothes remain damp with zero heat', code: '' },
        ];
      case 'hvac':
        return [
          { label: 'Furnace ignites then shuts off after 4 seconds', symptom: 'Short-cycling: burners light for 4 seconds then extinguish repeatedly', code: '34' },
          { label: 'Blower fan continuously running cold air', symptom: 'Thermostat set to Heat but supply vents blow room temperature air', code: '33' },
        ];
      default:
        return [
          { label: 'Appliance powers on but fails to complete cycle', symptom: 'Cycle starts but aborts before completion', code: '' },
          { label: 'Strange high-pitch whining or clicking noise', symptom: 'Unusual mechanical vibration during operation', code: '' },
        ];
    }
  }, [selectedAppliance]);

  const handleSelectAppliance = (id: string) => {
    setActiveApplianceId(id);
    setSelectedApplianceId(id);
    const matching = DIAGNOSTIC_KNOWLEDGE_BASE.find(d => {
      const app = appliances.find(a => a.id === id);
      return app && d.category === app.category;
    });
    if (matching) {
      setSelectedDiagId(matching.id);
    }
    setAiResult(null);
    setCheckObservations({});
    setSafetyAcknowledged(false);
    setSessionSaved(false);
  };

  const handleSelectDiagnostic = (diagId: string) => {
    setSelectedDiagId(diagId);
    setCheckObservations({});
    setSafetyAcknowledged(false);
    setSessionSaved(false);
  };

  const setObservation = (stepId: string, status: 'passed' | 'failed' | 'skipped') => {
    setCheckObservations(prev => ({ ...prev, [stepId]: status }));
  };

  const resetWorkflow = () => {
    setCheckObservations({});
    setSafetyAcknowledged(false);
    setHazardFlag('none');
    setSessionSaved(false);
    setAiResult(null);
    setSymptomInput('');
    setErrorCode('');
    setSensoryDetails('');
  };

  // Run AI Diagnosis
  const handleRunAiDiagnosis = async () => {
    if (!selectedAppliance) return;
    if (!symptomInput.trim() && !errorCode.trim()) {
      alert('Please enter a symptom description or an error code first.');
      return;
    }

    setIsAiLoading(true);
    setAiResult(null);
    setCheckObservations({});
    setSafetyAcknowledged(false);
    setSessionSaved(false);

    try {
      setAiLoadingPhase(`Consulting ${selectedAppliance.brand} ${selectedAppliance.modelNumber || ''} engineering service bulletins...`);
      await new Promise(r => setTimeout(r, 450));
      
      setAiLoadingPhase(`Cross-referencing historical repair memory (${repairEvents.filter(r => r.applianceId === selectedAppliance.id).length} prior records)...`);
      await new Promise(r => setTimeout(r, 450));

      setAiLoadingPhase('Calculating root cause probabilities & formulating safe test procedures...');
      
      const pastRepairs = repairEvents.filter(r => r.applianceId === selectedAppliance.id);
      const result = await diagnoseWithAi({
        appliance: selectedAppliance,
        symptom: symptomInput.trim() || 'Unspecified irregularity',
        errorCode: errorCode.trim() || undefined,
        startedWhen,
        sensoryDetails: sensoryDetails.trim() || undefined,
        pastRepairs
      });

      setAiResult(result);
      if (result.safetyLevel === 'danger_shutoff') {
        setHazardFlag('electrical');
      }
    } catch (err) {
      console.error('Failed to run AI diagnosis:', err);
      alert('Failed to complete AI diagnosis. Please check network connection.');
    } finally {
      setIsAiLoading(false);
      setAiLoadingPhase('');
    }
  };

  // Active steps list
  const activeSteps = useMemo(() => {
    if (diagnosticMode === 'ai_copilot' && aiResult) {
      return aiResult.diagnosticSteps;
    }
    return activeDiagnostic.steps;
  }, [diagnosticMode, aiResult, activeDiagnostic]);

  const completedChecksCount = Object.keys(checkObservations).length;
  const isAllChecksEvaluated = activeSteps.length > 0 && completedChecksCount === activeSteps.length;

  const handleSaveSession = () => {
    if (!selectedAppliance) return;

    const checksPayload: TroubleshootingCheckItem[] = activeSteps.map(step => ({
      id: step.id,
      title: step.title,
      testProcedure: step.testProcedure,
      intent: step.intent,
      observation: checkObservations[step.id] || 'skipped',
      possibleExplanation: checkObservations[step.id] === 'failed' ? step.possibleObservationFailure : undefined,
    }));

    const outcomeSummary = hazardFlag !== 'none'
      ? 'Emergency safety hazard protocol activated. Equipment disconnected.'
      : aiResult 
      ? aiResult.summary 
      : activeDiagnostic.verdictRule.summary;

    const suggestedNextAction = hazardFlag !== 'none' 
      ? 'emergency_shutoff' 
      : aiResult 
      ? aiResult.recommendation 
      : activeDiagnostic.verdictRule.suggestedNextAction;

    addTroubleshootingSession({
      applianceId: selectedAppliance.id,
      reportedSymptom: currentEffectiveSymptom,
      symptomCategory: diagnosticMode === 'ai_copilot' ? 'AI Diagnostic Copilot' : activeDiagnostic.symptomName,
      startedWhen,
      errorCode: errorCode.trim() || undefined,
      userNotes: userNotes.trim() || undefined,
      hazardDetected: hazardFlag !== 'none',
      hazardType: hazardFlag,
      checksPerformed: checksPayload,
      outcomeSummary,
      suggestedNextAction,
      status: 'completed',
    });

    setSessionSaved(true);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner / Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-[#DADBD3] shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#285B45]/10 text-[#285B45]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#252923]">
              Diagnostic Copilot & Troubleshooting
            </h2>
            <p className="text-[11px] text-[#73766F]">
              Determine failure root causes, perform safe physical tests, and prevent costly misdiagnoses.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mode Pill Toggle */}
          <div className="inline-flex rounded-md p-0.5 bg-[#FAF9F5] border border-[#DADBD3] text-xs">
            <button
              type="button"
              onClick={() => setDiagnosticMode('ai_copilot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-all cursor-pointer ${
                diagnosticMode === 'ai_copilot'
                  ? 'bg-[#285B45] text-white shadow-xs font-semibold'
                  : 'text-[#4A4F44] hover:text-[#252923]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </button>
            <button
              type="button"
              onClick={() => setDiagnosticMode('preset')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-all cursor-pointer ${
                diagnosticMode === 'preset'
                  ? 'bg-[#285B45] text-white shadow-xs font-semibold'
                  : 'text-[#4A4F44] hover:text-[#252923]'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Pre-set Trees</span>
            </button>
          </div>

          {/* Engine Settings button */}
          <button
            type="button"
            onClick={() => setIsApiKeyModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium border border-[#DADBD3] bg-[#FAF9F5] hover:bg-[#EAE9E2] text-[#4A4F44] transition-colors cursor-pointer"
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-[#285B45]" />
            <span className="hidden sm:inline">{hasCustomApiKey ? 'Gemini Live' : 'AI Settings'}</span>
          </button>
        </div>
      </div>

      {/* Step 1: Symptom Reporting & AI Analysis Intake */}
      <div className="p-5 sm:p-6 bg-white rounded-lg border border-[#DADBD3] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F5F4EF]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#252923] flex items-center gap-2">
              {diagnosticMode === 'ai_copilot' ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#285B45]" />
                  <span>AI Symptom Intake & Reasoning Engine</span>
                </>
              ) : (
                <>
                  <ClipboardList className="w-4 h-4 text-[#285B45]" />
                  <span>Category Decision Tree Intake</span>
                </>
              )}
            </h3>
            <p className="text-xs text-[#73766F] mt-0.5">
              Select your appliance and describe observed anomalies for root-cause deduction.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={resetWorkflow}
          >
            Reset Form
          </Button>
        </div>

        {/* Appliance & Timeframe Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="troubleshoot-appliance" className="text-xs font-semibold text-[#252923]">
              Affected Appliance
            </label>
            <select
              id="troubleshoot-appliance"
              value={activeApplianceId}
              onChange={e => handleSelectAppliance(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-semibold text-[#252923] bg-[#FAF9F5] border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
            >
              {appliances.map(app => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.brand} {app.modelNumber || 'Chassis'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="troubleshoot-started" className="text-xs font-semibold text-[#252923]">
              When Did Issue Begin?
            </label>
            <select
              id="troubleshoot-started"
              value={startedWhen}
              onChange={e => setStartedWhen(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm text-[#252923] bg-[#FAF9F5] border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
            >
              <option value="Today / Sudden onset">Today / Sudden onset</option>
              <option value="2-3 days ago">2-3 days ago</option>
              <option value="Within the past week">Within the past week</option>
              <option value="Over a month (gradual degradation)">Over a month (gradual degradation)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#252923]">
              Appliance Context Profile
            </label>
            <div className="px-3 py-2 text-xs bg-[#FAF9F5] border border-[#DADBD3] rounded-md text-[#4A4F44] flex items-center justify-between">
              <span>{selectedAppliance?.category.toUpperCase()}</span>
              <span className="font-mono text-[11px] font-semibold text-[#285B45]">
                {selectedAppliance?.conditionStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* AI Copilot Mode Fields */}
        {diagnosticMode === 'ai_copilot' ? (
          <div className="space-y-4 pt-1">
            {/* Quick Suggestions Chips */}
            {quickSymptoms.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#73766F] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#285B45]" />
                  Common Patterns for {selectedAppliance?.brand} {selectedAppliance?.category}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSymptoms.map((qs, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSymptomInput(qs.symptom);
                        if (qs.code) setErrorCode(qs.code);
                      }}
                      className="px-2.5 py-1 text-xs rounded-full bg-[#FAF9F5] hover:bg-[#EAE9E2] border border-[#DADBD3] text-[#252923] transition-colors cursor-pointer text-left"
                    >
                      {qs.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ai-symptom" className="text-xs font-semibold text-[#252923] flex items-center justify-between">
                <span>Observed Problem / Unusual Behavior</span>
                <span className="text-[11px] font-normal text-[#73766F]">Describe what the machine is or isn't doing</span>
              </label>
              <textarea
                id="ai-symptom"
                rows={2}
                value={symptomInput}
                onChange={e => setSymptomInput(e.target.value)}
                placeholder="e.g. Fresh food compartment reached 46°F while freezer is working; high-pitched whistling noise when doors close..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none text-[#252923]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Error Code on Digital Display (if any)"
                placeholder="e.g. E24, 4C, F03E01, 34, CL"
                value={errorCode}
                onChange={e => setErrorCode(e.target.value)}
                hint="Check LCD display, LED blink cadence, or beeps"
              />
              <Input
                label="Sensory Details / Sounds / Odors"
                placeholder="e.g. Clicking noise, water under unit, vibrating drum"
                value={sensoryDetails}
                onChange={e => setSensoryDetails(e.target.value)}
                hint="Auditory and physical indicators"
              />
            </div>

            {/* AI Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-[#73766F]">
                The AI incorporates your appliance&apos;s brand, model bulletin history, and past repair memory to deduce root causes.
              </p>

              <button
                type="button"
                onClick={handleRunAiDiagnosis}
                disabled={isAiLoading || (!symptomInput.trim() && !errorCode.trim())}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#285B45] hover:bg-[#1E4635] disabled:bg-[#DADBD3] disabled:text-[#73766F] text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#285B45]"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAiLoading ? 'Analyzing Model & History...' : 'Diagnose with AI Copilot'}</span>
              </button>
            </div>

            {/* AI Analyzing Loading State */}
            {isAiLoading && (
              <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#BDD4C8] space-y-2 animate-pulse">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#285B45]">
                  <Cpu className="w-4 h-4 animate-spin" />
                  <span>{aiLoadingPhase || 'Consulting Engineering Knowledge Base...'}</span>
                </div>
                <div className="w-full bg-[#EAE9E2] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#285B45] h-full w-2/3 rounded-full animate-progress" />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Preset Decision Tree Mode */
          <div className="space-y-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="troubleshoot-predefined" className="text-xs font-semibold text-[#252923]">
                Predefined Symptom Category
              </label>
              <select
                id="troubleshoot-predefined"
                value={selectedDiagId}
                onChange={e => handleSelectDiagnostic(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm text-[#252923] bg-[#FAF9F5] border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
              >
                {DIAGNOSTIC_KNOWLEDGE_BASE.map(diag => (
                  <option key={diag.id} value={diag.id}>
                    [{diag.category.toUpperCase()}] {diag.symptomName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Warning Indicator / Error Code"
                placeholder="e.g. E24, Error 34, Blink code 3"
                value={errorCode}
                onChange={e => setErrorCode(e.target.value)}
                hint="Look for code on digital display or blink LED"
              />
              <Input
                label="Additional Operating Context"
                placeholder="e.g. Occurred after heavy rain; started after cleaning"
                value={userNotes}
                onChange={e => setUserNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Immediate Hazard Screening */}
      <div className="p-4 sm:p-5 rounded-lg border border-[#DADBD3] bg-white space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#73766F] flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />
          Critical Hazard Screening (Safety First)
        </h3>
        <p className="text-xs text-[#73766F]">
          Do any of the following severe emergency conditions exist?
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setHazardFlag(hazardFlag === 'smoke_heat' ? 'none' : 'smoke_heat')}
            className={`p-2.5 rounded border text-left transition-all flex items-center gap-2 cursor-pointer ${
              hazardFlag === 'smoke_heat' ? 'bg-[#FDF2F2] border-[#B91C1C] text-[#B91C1C] font-bold' : 'bg-[#FAF9F5] border-[#DADBD3] text-[#252923]'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0" />
            <span>Smoke or Burning Smell</span>
          </button>

          <button
            type="button"
            onClick={() => setHazardFlag(hazardFlag === 'gas' ? 'none' : 'gas')}
            className={`p-2.5 rounded border text-left transition-all flex items-center gap-2 cursor-pointer ${
              hazardFlag === 'gas' ? 'bg-[#FDF2F2] border-[#B91C1C] text-[#B91C1C] font-bold' : 'bg-[#FAF9F5] border-[#DADBD3] text-[#252923]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Gas / Sulfur Odor</span>
          </button>

          <button
            type="button"
            onClick={() => setHazardFlag(hazardFlag === 'electrical' ? 'none' : 'electrical')}
            className={`p-2.5 rounded border text-left transition-all flex items-center gap-2 cursor-pointer ${
              hazardFlag === 'electrical' ? 'bg-[#FDF2F2] border-[#B91C1C] text-[#B91C1C] font-bold' : 'bg-[#FAF9F5] border-[#DADBD3] text-[#252923]'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>Sparks or Electric Tingle</span>
          </button>

          <button
            type="button"
            onClick={() => setHazardFlag(hazardFlag === 'water_leak' ? 'none' : 'water_leak')}
            className={`p-2.5 rounded border text-left transition-all flex items-center gap-2 cursor-pointer ${
              hazardFlag === 'water_leak' ? 'bg-[#FEF7EA] border-[#B45309] text-[#B45309] font-bold' : 'bg-[#FAF9F5] border-[#DADBD3] text-[#252923]'
            }`}
          >
            <Droplets className="w-4 h-4 shrink-0" />
            <span>Active Water Flood</span>
          </button>
        </div>

        {/* Hazard Emergency Response Box */}
        {hazardFlag !== 'none' && (
          <div className="p-4 rounded-md bg-[#FDF2F2] border border-[#F8C8C8] text-xs space-y-2 mt-3">
            <div className="flex items-center gap-2 text-[#B91C1C] font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>EMERGENCY SAFETY PROTOCOL ACTIVATED</span>
            </div>
            {hazardFlag === 'gas' && (
              <p className="text-[#7F1D1D] leading-relaxed">
                <strong>NATURAL GAS PRECAUTION:</strong> DO NOT operate any electrical light switches or telephone equipment inside the premises. Evacuate immediately, shut off main exterior gas valve if trained, and call your local gas utility or 911 from outside.
              </p>
            )}
            {hazardFlag === 'smoke_heat' && (
              <p className="text-[#7F1D1D] leading-relaxed">
                <strong>ELECTRICAL/FIRE HAZARD:</strong> Stop using the appliance immediately. Switch off the dedicated circuit breaker at the main electrical panel.
              </p>
            )}
            {hazardFlag === 'electrical' && (
              <p className="text-[#7F1D1D] leading-relaxed">
                <strong>SHOCK HAZARD:</strong> Do not touch the appliance frame or standing puddles near it. Immediately trip the breaker at the electrical service panel.
              </p>
            )}
            {hazardFlag === 'water_leak' && (
              <p className="text-[#92400E] leading-relaxed">
                <strong>WATER DAMAGE HAZARD:</strong> Immediately locate and close the appliance isolation shut-off valve behind the unit or shut the main household water supply.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Repair Memory Alert Banner (If recurring symptom detected) */}
      {memoryAnalysis && memoryAnalysis.isRecurring && (
        <div className="p-4 sm:p-5 rounded-lg bg-[#FDF2F2] border border-[#F8C8C8] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-[#B91C1C]">
              <History className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">
                Repair Memory Alert: Recurring Symptom Pattern Identified
              </h3>
            </div>
            <Badge variant="recurring" size="sm">
              {memoryAnalysis.matchCount} prior match{memoryAnalysis.matchCount > 1 ? 'es' : ''}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed">
            {memoryAnalysis.explanation}
          </p>

          <div className="p-3 bg-white rounded border border-[#F8C8C8] text-xs space-y-1">
            <strong className="text-[#252923] block">Recommended Technician Inquiry:</strong>
            <p className="text-[#4A4F44]">
              &quot;This symptom was recorded {memoryAnalysis.matchCount} times previously. Review the related repair history and consider asking your technician whether the underlying root cause has been resolved.&quot;
            </p>
          </div>
        </div>
      )}

      {/* AI DEDUCTION RESULTS (Probable Root Causes & Explanations) */}
      {aiResult && hazardFlag === 'none' && (
        <div className="p-5 sm:p-6 bg-white rounded-lg border border-[#BDD4C8] shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F5F4EF]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#285B45] text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#252923]">
                  AI Diagnostic Analysis & Probability Breakdown
                </h3>
                <p className="text-xs text-[#73766F]">
                  Deductions for {selectedAppliance?.brand} {selectedAppliance?.modelNumber || selectedAppliance?.name}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#FAF9F5] border border-[#DADBD3] text-[#4A4F44]">
              Source: {aiResult.source === 'gemini_ai' ? 'Gemini AI Live Engine' : 'Smart Diagnostic Engine'}
            </span>
          </div>

          {/* Engineering Summary */}
          <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DADBD3] text-xs sm:text-sm text-[#252923] leading-relaxed">
            <strong>Diagnosis Summary: </strong>
            <span>{aiResult.summary}</span>
          </div>

          {/* Probable Root Causes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#73766F] flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#285B45]" />
              Ranked Probable Root Causes
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {aiResult.rootCauses.map((rc, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-lg border border-[#DADBD3] bg-[#FAF9F5]/60 hover:bg-[#FAF9F5] transition-colors space-y-2.5 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#252923]">
                        {rc.cause}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        rc.diyDifficulty === 'Easy DIY' 
                          ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
                          : rc.diyDifficulty === 'Moderate DIY'
                          ? 'bg-[#FEF7EA] text-[#B45309] border border-[#F7DBA7]'
                          : 'bg-[#FDF2F2] text-[#B91C1C] border border-[#F8C8C8]'
                      }`}>
                        {rc.diyDifficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-[#285B45]">
                        {rc.probability}% Likelihood
                      </span>
                      <div className="w-24 bg-[#DADBD3] h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#285B45] h-full rounded-full" 
                          style={{ width: `${rc.probability}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[#4A4F44] leading-relaxed">
                    {rc.explanation}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#DADBD3]/60 text-[11px] text-[#73766F]">
                    <div>
                      <strong>Likely Components: </strong>
                      <span>{rc.commonParts.join(', ') || 'N/A'}</span>
                    </div>
                    <div className="font-mono font-medium text-[#252923] flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-[#285B45]" />
                      <span>Estimated Range: ${rc.estimatedCostRange.min} – ${rc.estimatedCostRange.max}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Safety Protocol Checkbox */}
      {hazardFlag === 'none' && (
        <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DADBD3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#285B45] shrink-0 mt-0.5" />
            <div>
              <strong className="text-xs font-bold text-[#252923] block">
                Standard Inspection Safety Protocol
              </strong>
              <p className="text-xs text-[#73766F]">
                {aiResult?.safetyInstructions || activeDiagnostic.safetyCheck}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#252923] cursor-pointer shrink-0 select-none bg-white px-3 py-2 rounded border border-[#DADBD3]">
            <input
              type="checkbox"
              checked={safetyAcknowledged}
              onChange={e => setSafetyAcknowledged(e.target.checked)}
              className="w-4 h-4 text-[#285B45] rounded cursor-pointer"
            />
            <span>Power Safe / Ready</span>
          </label>
        </div>
      )}

      {/* Sequential Preliminary Checks */}
      {hazardFlag === 'none' && activeSteps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#285B45]" />
              <h3 className="text-sm font-bold text-[#252923]">
                Physical Verification Checks ({completedChecksCount} of {activeSteps.length} evaluated)
              </h3>
            </div>
            <span className="text-xs text-[#73766F] font-mono">
              {diagnosticMode === 'ai_copilot' ? 'Tailored AI non-destructive tests' : 'Predefined verification logic'}
            </span>
          </div>

          <div className="space-y-3">
            {activeSteps.map((step, idx) => {
              const currentObservation = checkObservations[step.id];

              return (
                <div
                  key={step.id}
                  className={`p-4 sm:p-5 rounded-lg border transition-all ${
                    currentObservation === 'passed'
                      ? 'bg-[#FAFDF9] border-[#A3D9A5]'
                      : currentObservation === 'failed'
                      ? 'bg-[#FFF9F9] border-[#F8C8C8]'
                      : currentObservation === 'skipped'
                      ? 'bg-[#FAF9F5] border-[#DADBD3] opacity-75'
                      : 'bg-white border-[#DADBD3]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#EAE9E2] text-[#252923] text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-[#252923]">
                          {step.title}
                        </h4>
                      </div>

                      <p className="text-xs text-[#4A4F44] pl-7">
                        {step.description}
                      </p>

                      <div className="pl-7 space-y-1.5 text-xs">
                        <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#DADBD3] space-y-1">
                          <strong className="text-[#252923] block">Test Procedure:</strong>
                          <p className="text-[#4A4F44]">{step.testProcedure}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          <div>
                            <strong className="text-[#285B45]">Expected Pass: </strong>
                            <span className="text-[#4A4F44]">{step.passCondition}</span>
                          </div>
                          <div>
                            <strong className="text-[#B91C1C]">Failure Indicator: </strong>
                            <span className="text-[#4A4F44]">{step.possibleObservationFailure}</span>
                          </div>
                        </div>

                        {step.warningNote && (
                          <p className="text-[11px] text-[#B45309] bg-[#FEF7EA] p-1.5 rounded border border-[#F7DBA7]">
                            <strong>Precaution: </strong>{step.warningNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col gap-2 shrink-0 ml-7 sm:ml-0">
                      <button
                        type="button"
                        onClick={() => setObservation(step.id, 'passed')}
                        className={`px-3 py-1.5 rounded text-xs font-medium border cursor-pointer transition-colors ${
                          currentObservation === 'passed'
                            ? 'bg-[#285B45] text-white border-[#285B45]'
                            : 'bg-[#FAF9F5] text-[#252923] border-[#DADBD3] hover:bg-[#EAE9E2]'
                        }`}
                      >
                        ✓ Passes Test
                      </button>
                      <button
                        type="button"
                        onClick={() => setObservation(step.id, 'failed')}
                        className={`px-3 py-1.5 rounded text-xs font-medium border cursor-pointer transition-colors ${
                          currentObservation === 'failed'
                            ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                            : 'bg-[#FAF9F5] text-[#252923] border-[#DADBD3] hover:bg-[#EAE9E2]'
                        }`}
                      >
                        ✗ Fails Test
                      </button>
                      <button
                        type="button"
                        onClick={() => setObservation(step.id, 'skipped')}
                        className={`px-3 py-1.5 rounded text-xs font-medium border cursor-pointer transition-colors ${
                          currentObservation === 'skipped'
                            ? 'bg-[#73766F] text-white border-[#73766F]'
                            : 'bg-[#FAF9F5] text-[#73766F] border-[#DADBD3] hover:bg-[#EAE9E2]'
                        }`}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outcome Synthesis & Session Actions */}
      {(isAllChecksEvaluated || hazardFlag !== 'none' || aiResult) && (
        <div className="p-5 sm:p-6 rounded-lg border border-[#BDD4C8] bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DADBD3]">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#285B45]" />
                <h3 className="text-base font-bold text-[#252923]">
                  Troubleshooting Session Synthesis
                </h3>
              </div>
              <p className="text-xs text-[#73766F] mt-0.5">
                Evaluation for {selectedAppliance?.name || 'appliance'}
              </p>
            </div>

            <Badge
              variant={
                hazardFlag !== 'none'
                  ? 'urgent'
                  : aiResult?.recommendation === 'safe_diy_maintenance' || activeDiagnostic.verdictRule.diyRecommended
                  ? 'optimal'
                  : 'attention'
              }
            >
              {hazardFlag !== 'none'
                ? 'Emergency Action Required'
                : (aiResult?.recommendation === 'safe_diy_maintenance' || activeDiagnostic.verdictRule.diyRecommended)
                ? 'Safe DIY Clearing Feasible'
                : 'Qualified Technician Service Advised'}
            </Badge>
          </div>

          <div className="p-4 rounded bg-[#FAF9F5] border border-[#DADBD3] text-xs sm:text-sm text-[#4A4F44] space-y-2">
            <p className="leading-relaxed">
              <strong>Observation Summary: </strong>
              {hazardFlag !== 'none'
                ? 'Emergency hazard detected. Equipment disconnected from active service.'
                : aiResult?.summary || activeDiagnostic.verdictRule.summary}
            </p>
            <p className="text-[11px] text-[#73766F] italic">
              Notice: This is a safe preliminary checklist and observation record, not a certified structural diagnosis.
            </p>
          </div>

          {/* Action Triggers */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={sessionSaved ? 'outline' : 'primary'}
              size="sm"
              icon={<BookmarkCheck className="w-4 h-4" />}
              onClick={handleSaveSession}
              disabled={sessionSaved}
            >
              {sessionSaved ? 'Session Saved in Appliance History' : 'Save Session to Appliance History'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4" />}
              onClick={() => setIsTechPacketOpen(true)}
            >
              Prepare Technician Pre-Visit Packet
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Scale className="w-4 h-4" />}
              onClick={() => setActiveTab('quotesense')}
            >
              Compare Contractor Quotes
            </Button>
          </div>
        </div>
      )}

      {/* Technician Visit Summary Modal */}
      {selectedAppliance && (
        <TechnicianSummaryModal
          isOpen={isTechPacketOpen}
          onClose={() => setIsTechPacketOpen(false)}
          appliance={selectedAppliance}
          currentSymptom={currentEffectiveSymptom}
          errorCode={errorCode}
          startedWhen={startedWhen}
          relatedRepairs={memoryAnalysis?.matchedRepairs || []}
          recurringExplanation={memoryAnalysis?.isRecurring ? memoryAnalysis.explanation : undefined}
          suggestedQuestions={aiResult?.technicianBriefNotes || memoryAnalysis?.suggestedQuestions || []}
        />
      )}

      {/* AI API Key Modal */}
      <AiApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyChanged={() => setHasCustomApiKey(Boolean(getStoredGeminiKey()))}
      />
    </div>
  );
};
