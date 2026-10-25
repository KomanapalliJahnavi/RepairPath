import React, { useState, useMemo } from 'react';
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
  Droplets
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DIAGNOSTIC_KNOWLEDGE_BASE } from '../../data/seedData';
import { analyzeRepairMemory } from '../../utils/repairMemoryMatcher';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { TechnicianSummaryModal } from './TechnicianSummaryModal';
import { TroubleshootingCheckItem } from '../../types';

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

  // User input states
  const [symptomCategory, setSymptomCategory] = useState<string>('preset');
  const [selectedDiagId, setSelectedDiagId] = useState<string>(DIAGNOSTIC_KNOWLEDGE_BASE[0].id);
  const [freeTextSymptom, setFreeTextSymptom] = useState<string>('');
  const [startedWhen, setStartedWhen] = useState<string>('Today');
  const [errorCode, setErrorCode] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');

  // Critical hazard screening
  const [hazardFlag, setHazardFlag] = useState<'none' | 'smoke_heat' | 'gas' | 'electrical' | 'water_leak'>('none');
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  // Interactive check observations
  const [checkObservations, setCheckObservations] = useState<Record<string, 'passed' | 'failed' | 'skipped'>>({});
  const [sessionSaved, setSessionSaved] = useState(false);
  const [isTechPacketOpen, setIsTechPacketOpen] = useState(false);

  // Predefined diagnostic node
  const activeDiagnostic = DIAGNOSTIC_KNOWLEDGE_BASE.find(d => d.id === selectedDiagId) || DIAGNOSTIC_KNOWLEDGE_BASE[0];

  const currentEffectiveSymptom = symptomCategory === 'preset' ? activeDiagnostic.symptomName : (freeTextSymptom || activeDiagnostic.symptomName);

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
  };

  const completedChecksCount = Object.keys(checkObservations).length;
  const isAllChecksEvaluated = activeDiagnostic.steps.length > 0 && completedChecksCount === activeDiagnostic.steps.length;

  const handleSaveSession = () => {
    if (!selectedAppliance) return;

    const checksPayload: TroubleshootingCheckItem[] = activeDiagnostic.steps.map(step => ({
      id: step.id,
      title: step.title,
      testProcedure: step.testProcedure,
      intent: step.intent,
      observation: checkObservations[step.id] || 'skipped',
      possibleExplanation: checkObservations[step.id] === 'failed' ? step.possibleObservationFailure : undefined,
    }));

    addTroubleshootingSession({
      applianceId: selectedAppliance.id,
      reportedSymptom: currentEffectiveSymptom,
      symptomCategory: symptomCategory === 'preset' ? activeDiagnostic.symptomName : 'Custom Description',
      startedWhen,
      errorCode: errorCode.trim() || undefined,
      userNotes: userNotes.trim() || undefined,
      hazardDetected: hazardFlag !== 'none',
      hazardType: hazardFlag,
      checksPerformed: checksPayload,
      outcomeSummary: hazardFlag !== 'none'
        ? 'Emergency safety hazard protocol activated. Normal preliminary troubleshooting stopped.'
        : activeDiagnostic.verdictRule.summary,
      suggestedNextAction: hazardFlag !== 'none' ? 'emergency_shutoff' : activeDiagnostic.verdictRule.suggestedNextAction,
      status: 'completed',
    });

    setSessionSaved(true);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Step 1: Symptom Reporting Panel */}
      <div className="p-5 sm:p-6 bg-white rounded-lg border border-[#DADBD3] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F5F4EF]">
          <div>
            <h2 className="text-base font-bold text-[#252923]">
              Symptom Reporting & Observation Intake
            </h2>
            <p className="text-xs text-[#73766F] mt-0.5">
              Select the affected unit and specify symptoms to establish safe preliminary checks.
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
                  {app.name} ({app.brand} {app.modelNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="troubleshoot-symptom-type" className="text-xs font-semibold text-[#252923]">
              Symptom Intake Mode
            </label>
            <select
              id="troubleshoot-symptom-type"
              value={symptomCategory}
              onChange={e => setSymptomCategory(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm text-[#252923] bg-[#FAF9F5] border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
            >
              <option value="preset">Predefined Known Symptom Tree</option>
              <option value="custom">Free-Text Description</option>
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
              <option value="Today">Today / Sudden onset</option>
              <option value="2-3 days ago">2-3 days ago</option>
              <option value="Within the past week">Within the past week</option>
              <option value="Over a month (gradual)">Over a month (gradual degradation)</option>
            </select>
          </div>
        </div>

        {symptomCategory === 'preset' ? (
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
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="troubleshoot-freetext" className="text-xs font-semibold text-[#252923]">
              Describe the problem in your own words
            </label>
            <textarea
              id="troubleshoot-freetext"
              rows={2}
              placeholder="e.g. Ice compartment freezing solid; water leaking under kickplate..."
              value={freeTextSymptom}
              onChange={e => setFreeTextSymptom(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Input
            label="Warning Indicator / Error Code"
            placeholder="e.g. E24, Error 34, Blink code 3"
            value={errorCode}
            onChange={e => setErrorCode(e.target.value)}
            hint="Look for code on digital display or blink LED"
          />
          <Input
            label="Additional Operating Context"
            placeholder="e.g. High kitchen humidity; occurred after cleaning"
            value={userNotes}
            onChange={e => setUserNotes(e.target.value)}
          />
        </div>
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
            <span>Active Pressurized Water Leak</span>
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
                <strong>ELECTRICAL/FIRE HAZARD:</strong> Stop using the appliance immediately. If safe to reach without touching hot surfaces, switch off the appliance&apos;s dedicated circuit breaker at the main breaker panel. Do not open internal chassis covers.
              </p>
            )}
            {hazardFlag === 'electrical' && (
              <p className="text-[#7F1D1D] leading-relaxed">
                <strong>SHOCK HAZARD:</strong> Do not touch the appliance frame or any standing puddles near it. Immediately trip the breaker at the electrical service panel. Contact a certified professional technician.
              </p>
            )}
            {hazardFlag === 'water_leak' && (
              <p className="text-[#92400E] leading-relaxed">
                <strong>WATER DAMAGE HAZARD:</strong> Immediately locate and close the appliance isolation shut-off valve behind the unit or under the sink, or shut the home&apos;s main water supply.
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

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('repair-memory')}
              className="text-xs font-semibold text-[#B91C1C] hover:underline flex items-center gap-1"
            >
              <span>View Related History in Repair Memory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsTechPacketOpen(true)}
              className="text-xs font-semibold text-[#285B45] hover:underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Review Pre-Visit Technician Packet</span>
            </button>
          </div>
        </div>
      )}

      {/* Standard Safety Protocol Checkbox */}
      {hazardFlag === 'none' && (
        <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DADBD3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#285B45] shrink-0 mt-0.5" />
            <div>
              <strong className="text-xs font-bold text-[#252923] block">
                Standard Inspection Safety Protocol
              </strong>
              <p className="text-xs text-[#73766F]">
                {activeDiagnostic.safetyCheck}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#252923] cursor-pointer shrink-0 select-none bg-white px-3 py-2 rounded border border-[#DADBD3]">
            <input
              type="checkbox"
              checked={safetyAcknowledged}
              onChange={e => setSafetyAcknowledged(e.target.checked)}
              className="w-4 h-4 text-[#285B45] rounded"
            />
            <span>Power Safe / Ready</span>
          </label>
        </div>
      )}

      {/* Sequential Preliminary Checks */}
      {hazardFlag === 'none' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#285B45]" />
              <h3 className="text-sm font-bold text-[#252923]">
                Sequential Preliminary Checks ({completedChecksCount} of {activeDiagnostic.steps.length} evaluated)
              </h3>
            </div>
            <span className="text-xs text-[#73766F] font-mono">
              Transparent predefined verification logic
            </span>
          </div>

          <div className="space-y-3">
            {activeDiagnostic.steps.map((step, idx) => {
              const currentObservation = checkObservations[step.id];

              return (
                <div
                  key={step.id}
                  className={`p-4 sm:p-5 rounded-lg border transition-all text-left ${
                    currentObservation === 'passed'
                      ? 'border-[#BDD4C8] bg-[#FAF9F5]'
                      : currentObservation === 'failed'
                      ? 'border-[#F8C8C8] bg-white'
                      : 'border-[#DADBD3] bg-white'
                  } ${!safetyAcknowledged ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#EAE9E2] text-[#252923] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-[#252923]">
                          {step.title}
                        </h4>
                      </div>

                      <div className="ml-7 space-y-1.5 text-xs">
                        <p className="text-[#4A4F44]">{step.description}</p>

                        <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3] space-y-1.5">
                          <div>
                            <strong className="text-[#252923]">Procedure: </strong>
                            <span className="text-[#4A4F44]">{step.testProcedure}</span>
                          </div>
                          <div>
                            <strong className="text-[#285B45]">Intended to Establish: </strong>
                            <span className="text-[#4A4F44]">{step.intent}</span>
                          </div>
                          <div>
                            <strong className="text-[#73766F]">Normal Pass Condition: </strong>
                            <span className="text-[#4A4F44]">{step.passCondition}</span>
                          </div>
                        </div>

                        {currentObservation === 'failed' && (
                          <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F8C8C8] text-[#7F1D1D]">
                            <strong>Possible Observation Explanation: </strong>
                            <span>{step.possibleObservationFailure}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step Action Buttons */}
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
      {(isAllChecksEvaluated || hazardFlag !== 'none') && (
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
                Preliminary evaluation for {selectedAppliance?.name || 'appliance'}
              </p>
            </div>

            <Badge
              variant={
                hazardFlag !== 'none'
                  ? 'urgent'
                  : activeDiagnostic.verdictRule.diyRecommended
                  ? 'optimal'
                  : 'attention'
              }
            >
              {hazardFlag !== 'none'
                ? 'Emergency Action Required'
                : activeDiagnostic.verdictRule.diyRecommended
                ? 'Safe DIY Clearing Feasible'
                : 'Qualified Technician Service Advised'}
            </Badge>
          </div>

          <div className="p-4 rounded bg-[#FAF9F5] border border-[#DADBD3] text-xs sm:text-sm text-[#4A4F44] space-y-2">
            <p className="leading-relaxed">
              <strong>Observation Summary: </strong>
              {hazardFlag !== 'none'
                ? 'Emergency hazard detected. Equipment disconnected from active service.'
                : activeDiagnostic.verdictRule.summary}
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
          suggestedQuestions={memoryAnalysis?.suggestedQuestions || []}
        />
      )}
    </div>
  );
};
