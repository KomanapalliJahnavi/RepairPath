import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  BookmarkCheck,
  CheckCircle2, 
  AlertTriangle,
  Info, 
  DollarSign,
  Calendar,
  Sliders,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { calculateRepairVsReplace } from '../../utils/repairVsReplaceCalculations';
import { RepairVsReplaceAssumptions } from '../../types';

export const RepairVsReplaceCalculator: React.FC = () => {
  const { 
    appliances, 
    selectedApplianceId, 
    setSelectedApplianceId, 
    getQuotesForAppliance,
    evaluations, 
    addEvaluation, 
    deleteEvaluation 
  } = useApp();

  const [activeApplianceId, setActiveApplianceId] = useState<string>(
    selectedApplianceId || (appliances[0]?.id ?? 'custom')
  );

  const selectedAppliance = appliances.find(a => a.id === activeApplianceId);

  // Form states - Transparent user-editable assumptions
  const [proposedRepairCost, setProposedRepairCost] = useState<number>(380);
  const [replacementCost, setReplacementCost] = useState<number>(1200);
  const [comparisonPeriodYears, setComparisonPeriodYears] = useState<number>(3);
  const [estimatedFutureAnnualRepairs, setEstimatedFutureAnnualRepairs] = useState<number>(50);
  const [specifyRemainingLife, setSpecifyRemainingLife] = useState<boolean>(true);
  const [remainingUsefulLifeYears, setRemainingUsefulLifeYears] = useState<number>(4);
  const [expectedReplacementLifespanYears, setExpectedReplacementLifespanYears] = useState<number>(10);
  const [annualRunningCostDifference, setAnnualRunningCostDifference] = useState<number>(25);

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Auto-populate baseline assumptions when appliance changes, with clear indication they are editable
  useEffect(() => {
    if (selectedAppliance) {
      // Find latest or lowest quote if available
      const quotes = getQuotesForAppliance(selectedAppliance.id);
      if (quotes.length > 0) {
        setProposedRepairCost(quotes[0].calculatedTotal || quotes[0].laborCost + quotes[0].partsCost);
      } else {
        const purchasePrice = selectedAppliance.purchasePrice || 1000;
        setProposedRepairCost(Math.round(purchasePrice * 0.3));
      }

      setReplacementCost(selectedAppliance.purchasePrice || 1200);
      setExpectedReplacementLifespanYears(selectedAppliance.expectedLifespanYears || 10);

      // Estimate remaining life based on current age
      const purchaseTime = selectedAppliance.purchaseDate ? new Date(selectedAppliance.purchaseDate).getTime() : Date.now();
      const ageYrs = Math.max(0.5, (Date.now() - purchaseTime) / (1000 * 60 * 60 * 24 * 365.25));
      const projectedRemaining = Math.max(1, Math.round((selectedAppliance.expectedLifespanYears || 10) - ageYrs));
      setRemainingUsefulLifeYears(projectedRemaining);
    }
  }, [activeApplianceId, selectedAppliance, getQuotesForAppliance]);

  // Current age calculation for actuarial rules
  const applianceAgeYears = useMemo(() => {
    if (!selectedAppliance?.purchaseDate) return 5;
    const purchaseTime = new Date(selectedAppliance.purchaseDate).getTime();
    return Math.max(0.5, Number(((Date.now() - purchaseTime) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)));
  }, [selectedAppliance]);

  // Actuarial scenario calculation
  const assumptions: RepairVsReplaceAssumptions = useMemo(() => ({
    applianceId: activeApplianceId,
    proposedRepairCost: Number(proposedRepairCost) || 0,
    replacementCost: Number(replacementCost) || 0,
    estimatedFutureAnnualRepairs: Number(estimatedFutureAnnualRepairs) || 0,
    remainingUsefulLifeYears: specifyRemainingLife ? Number(remainingUsefulLifeYears) || null : null,
    expectedReplacementLifespanYears: Number(expectedReplacementLifespanYears) || 10,
    comparisonPeriodYears: Number(comparisonPeriodYears) || 3,
    annualRunningCostDifference: Number(annualRunningCostDifference) || 0,
  }), [
    activeApplianceId,
    proposedRepairCost,
    replacementCost,
    estimatedFutureAnnualRepairs,
    specifyRemainingLife,
    remainingUsefulLifeYears,
    expectedReplacementLifespanYears,
    comparisonPeriodYears,
    annualRunningCostDifference,
  ]);

  const actuarialResult = useMemo(() => {
    return calculateRepairVsReplace(assumptions, applianceAgeYears);
  }, [assumptions, applianceAgeYears]);

  const handleSaveEvaluation = () => {
    if (!selectedAppliance && activeApplianceId !== 'custom') {
      alert('Please select an appliance or create a generic evaluation.');
      return;
    }

    addEvaluation({
      applianceId: activeApplianceId,
      assumptions,
      repairScenarioTotal: actuarialResult.repairScenarioTotal,
      replacementScenarioTotal: actuarialResult.replacementScenarioTotal,
      netScenarioDifference: actuarialResult.netScenarioDifference,
      annualizedRepairCost: actuarialResult.annualizedRepairCost,
      annualizedReplacementCost: actuarialResult.annualizedReplacementCost,
      repairToReplacementRatio: actuarialResult.repairToReplacementRatio,
      fiftyPercentRuleViolated: actuarialResult.fiftyPercentRuleViolated,
      lifespanThresholdViolated: actuarialResult.lifespanThresholdViolated,
      recommendation: actuarialResult.recommendation,
      financialScoreNote: actuarialResult.financialScoreNote,
      detailedAnalysis: actuarialResult.detailedAnalysis,
      limitations: actuarialResult.limitations,
    });

    setSaveSuccessMessage('Decision evaluation logged to permanent record.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Intro Header */}
      <div className="p-5 bg-white rounded-lg border border-[#DADBD3] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-[#285B45]" />
            <h2 className="text-base font-bold text-[#252923]">
              Repair vs. Replace Decision Tool
            </h2>
          </div>
          <p className="text-xs text-[#73766F] mt-1 leading-relaxed max-w-2xl">
            A transparent financial tool comparing repair costs against replacement over a defined multi-year comparison period. All inputs below are user-editable assumptions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="eval-appliance-select" className="text-xs font-semibold text-[#73766F] whitespace-nowrap">
            Appliance:
          </label>
          <select
            id="eval-appliance-select"
            value={activeApplianceId}
            onChange={e => {
              setActiveApplianceId(e.target.value);
              setSelectedApplianceId(e.target.value);
            }}
            className="px-3 py-2 text-xs font-semibold text-[#252923] bg-[#FAF9F5] border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
          >
            {appliances.map(app => (
              <option key={app.id} value={app.id}>
                {app.name} ({app.brand})
              </option>
            ))}
            <option value="custom">Generic Assessment (No Saved Appliance)</option>
          </select>
        </div>
      </div>

      {/* Assumptions Notice */}
      <div className="p-3 bg-[#FAF9F5] border border-[#DADBD3] rounded-md flex items-center justify-between gap-2 text-xs text-[#4A4F44]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#285B45] shrink-0" />
          <span>
            <strong>Transparent Calculation Model:</strong> No arbitrary AI prediction scores. Comparisons evaluate total ownership costs over a user-selected time window.
          </span>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#73766F] bg-white px-2 py-0.5 rounded border border-[#DADBD3] shrink-0">
          User Assumptions
        </span>
      </div>

      {/* Main Grid: Inputs on Left, Scenario Analysis on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editable Assumptions Form */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-lg border border-[#DADBD3] bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5F4EF]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#73766F] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#285B45]" />
              Direct Capital Inputs
            </h3>
            <span className="text-[11px] text-[#73766F]">Currency in USD ($)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Proposed Repair Cost"
              prefixText="$"
              min="0"
              step="1"
              value={proposedRepairCost}
              onChange={e => setProposedRepairCost(Math.max(0, Number(e.target.value)))}
              hint="Contractor quote or part cost"
            />
            <Input
              type="number"
              label="Replacement Purchase Cost"
              prefixText="$"
              min="0"
              step="1"
              value={replacementCost}
              onChange={e => setReplacementCost(Math.max(0, Number(e.target.value)))}
              hint="Price of comparable new unit"
            />
          </div>

          <div className="pt-3 border-t border-[#F5F4EF]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#73766F] mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#285B45]" />
              Timeframe & Lifespan Assumptions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#252923] mb-1">
                  Comparison Period (Years)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[2, 3, 5, 7].map(yrs => (
                    <button
                      key={yrs}
                      type="button"
                      onClick={() => setComparisonPeriodYears(yrs)}
                      className={`py-1.5 text-xs font-semibold rounded border transition-colors ${
                        comparisonPeriodYears === yrs
                          ? 'bg-[#285B45] text-white border-[#285B45]'
                          : 'bg-[#FAF9F5] text-[#252923] border-[#DADBD3] hover:bg-[#EAE9E2]'
                      }`}
                    >
                      {yrs} yrs
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#73766F] mt-1">Decision horizon for cost total</p>
              </div>

              <Input
                type="number"
                label="New Unit Expected Lifespan"
                suffixText="yrs"
                min="1"
                max="25"
                value={expectedReplacementLifespanYears}
                onChange={e => setExpectedReplacementLifespanYears(Math.max(1, Number(e.target.value)))}
                hint="Manufacturer baseline (typical 10-14 yrs)"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#F5F4EF] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#73766F] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#285B45]" />
              Optional Operating & Future Expenses
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Est. Future Annual Repairs"
                prefixText="$"
                suffixText="/yr"
                min="0"
                value={estimatedFutureAnnualRepairs}
                onChange={e => setEstimatedFutureAnnualRepairs(Math.max(0, Number(e.target.value)))}
                hint="Expected upkeep if kept ($/yr)"
              />

              <Input
                type="number"
                label="Running-Cost Delta"
                prefixText="$"
                suffixText="/yr"
                min="0"
                value={annualRunningCostDifference}
                onChange={e => setAnnualRunningCostDifference(Math.max(0, Number(e.target.value)))}
                hint="Energy/water savings of modern unit ($/yr)"
              />
            </div>

            {/* Remaining useful life toggle */}
            <div className="p-3 bg-[#FAF9F5] border border-[#DADBD3] rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#252923] flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={specifyRemainingLife}
                    onChange={e => setSpecifyRemainingLife(e.target.checked)}
                    className="rounded border-[#DADBD3] text-[#285B45] focus:ring-[#285B45]"
                  />
                  Specify remaining useful life after repair
                </label>
                <span className="text-[11px] text-[#73766F]">
                  {specifyRemainingLife ? 'Active' : 'Unspecified / Unknown'}
                </span>
              </div>

              {specifyRemainingLife && (
                <div className="pt-2">
                  <Input
                    type="number"
                    label="Estimated remaining life post-repair"
                    suffixText="years"
                    min="1"
                    max="15"
                    value={remainingUsefulLifeYears}
                    onChange={e => setRemainingUsefulLifeYears(Math.max(1, Number(e.target.value)))}
                    hint="How long do you expect the unit to run after this fix?"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Transparent calculation method disclosure */}
          <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#DADBD3] text-xs space-y-2 text-[#4A4F44]">
            <div className="flex items-center gap-1.5 font-bold text-[#252923]">
              <Info className="w-3.5 h-3.5 text-[#285B45]" />
              <span>Calculation Formulas Applied:</span>
            </div>
            <div className="font-mono text-[11px] bg-white p-2 rounded border border-[#DADBD3] space-y-1 text-[#252923]">
              <div>Repair Total = Repair Quote + (Annual Maintenance × {comparisonPeriodYears}) + (Running Penalty × {comparisonPeriodYears})</div>
              <div>Replacement Total = New Unit Purchase Cost</div>
              <div>Normalized Annual Repair = Repair Total ÷ {comparisonPeriodYears} yrs</div>
              <div>Normalized Annual Replace = New Purchase ÷ {expectedReplacementLifespanYears} yrs</div>
            </div>
          </div>
        </div>

        {/* Right Column: Scenario Totals & Financial Assessment */}
        <div className="lg:col-span-6 space-y-5">
          {/* Verdict Banner */}
          <div className="p-5 sm:p-6 rounded-lg border border-[#DADBD3] bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F4EF]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#73766F] block">
                  Actuarial Assessment ({comparisonPeriodYears}-Year Horizon)
                </span>
                <span className="text-xs text-[#73766F]">
                  {actuarialResult.financialScoreNote}
                </span>
              </div>
              <Badge
                variant={
                  actuarialResult.recommendation === 'repair'
                    ? 'optimal'
                    : actuarialResult.recommendation === 'replace'
                    ? 'urgent'
                    : 'attention'
                }
                size="md"
              >
                {actuarialResult.recommendation === 'repair'
                  ? 'Prudent to Repair'
                  : actuarialResult.recommendation === 'replace'
                  ? 'Prudent to Replace'
                  : 'Insufficient Data'}
              </Badge>
            </div>

            {/* Scenario Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Repair Scenario Card */}
              <div className="p-4 rounded-md border border-[#DADBD3] bg-[#FAF9F5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#252923]">Repair Scenario</span>
                  <span className="text-[11px] font-mono text-[#73766F]">{comparisonPeriodYears} yrs</span>
                </div>
                <div className="text-xl font-bold font-mono text-[#252923]">
                  ${actuarialResult.repairScenarioTotal.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#73766F] space-y-1 border-t border-[#DADBD3] pt-2">
                  <div className="flex justify-between">
                    <span>Immediate Quote:</span>
                    <span className="font-mono">${proposedRepairCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upkeep ({comparisonPeriodYears} yrs):</span>
                    <span className="font-mono">${estimatedFutureAnnualRepairs * comparisonPeriodYears}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Running Penalty:</span>
                    <span className="font-mono">${annualRunningCostDifference * comparisonPeriodYears}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#252923] pt-1 border-t border-[#EAE9E2]">
                    <span>Annualized:</span>
                    <span className="font-mono">${actuarialResult.annualizedRepairCost}/yr</span>
                  </div>
                </div>
              </div>

              {/* Replacement Scenario Card */}
              <div className="p-4 rounded-md border border-[#DADBD3] bg-[#FAF9F5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#252923]">Replacement Scenario</span>
                  <span className="text-[11px] font-mono text-[#73766F]">{expectedReplacementLifespanYears} yr life</span>
                </div>
                <div className="text-xl font-bold font-mono text-[#252923]">
                  ${actuarialResult.replacementScenarioTotal.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#73766F] space-y-1 border-t border-[#DADBD3] pt-2">
                  <div className="flex justify-between">
                    <span>New Machine:</span>
                    <span className="font-mono">${replacementCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Warranty Coverage:</span>
                    <span className="font-mono">Included</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operating Savings:</span>
                    <span className="font-mono">Baseline</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#252923] pt-1 border-t border-[#EAE9E2]">
                    <span>Annualized ({expectedReplacementLifespanYears} yr life):</span>
                    <span className="font-mono">${actuarialResult.annualizedReplacementCost}/yr</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Difference Callout */}
            <div className="p-3.5 rounded-md border border-[#BDD4C8] bg-[#EBF2EE] flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-[#285B45] block">
                  Net Scenario Difference over {comparisonPeriodYears} Years:
                </span>
                <span className="text-[#4A4F44]">
                  {actuarialResult.netScenarioDifference >= 0
                    ? `Repair is $${actuarialResult.netScenarioDifference.toLocaleString()} less expensive than buying new.`
                    : `Replacement is $${Math.abs(actuarialResult.netScenarioDifference).toLocaleString()} more economical over this timeframe.`}
                </span>
              </div>
              <span className="font-mono font-bold text-base text-[#285B45] shrink-0">
                {actuarialResult.netScenarioDifference >= 0 ? '+' : '-'}${Math.abs(actuarialResult.netScenarioDifference).toLocaleString()}
              </span>
            </div>

            {/* Actuarial Ratio Checks */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#252923]">The 50% Prudence Ceiling</span>
                  <span className="font-mono text-[#252923]">
                    {actuarialResult.repairToReplacementRatio.toFixed(0)}% of replacement price (Max: 50%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE9E2] overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all ${
                      actuarialResult.fiftyPercentRuleViolated ? 'bg-[#B91C1C]' : 'bg-[#285B45]'
                    }`}
                    style={{ width: `${Math.min(100, actuarialResult.repairToReplacementRatio)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Plain-Language Rationale */}
            <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#DADBD3] text-xs leading-relaxed text-[#252923]">
              <strong className="block font-bold text-[#285B45] mb-1">Reasoned Explanation:</strong>
              {actuarialResult.detailedAnalysis}
            </div>

            {/* Explicit Limitations & Missing Information */}
            {actuarialResult.limitations.length > 0 && (
              <div className="p-3 rounded bg-[#FEF7EA] border border-[#F7DBA7] text-xs space-y-1 text-[#92400E]">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Important Modeling Limitations & Incomplete Information:</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {actuarialResult.limitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save Action */}
            <div className="pt-3 border-t border-[#DADBD3] flex items-center justify-between">
              <span className="text-xs text-[#73766F]">
                {saveSuccessMessage ? (
                  <span className="text-[#285B45] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {saveSuccessMessage}
                  </span>
                ) : (
                  'Log this evaluation with its specific assumptions.'
                )}
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={<BookmarkCheck className="w-4 h-4" />}
                onClick={handleSaveEvaluation}
                disabled={actuarialResult.recommendation === 'insufficient_information'}
              >
                Save Evaluation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Evaluations Log */}
      {evaluations.length > 0 && (
        <div className="p-5 sm:p-6 bg-white rounded-lg border border-[#DADBD3] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-[#285B45]" />
              <h3 className="text-sm font-bold text-[#252923]">
                Logged Decision Evaluations ({evaluations.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#73766F]">
              Preserved across browser sessions
            </span>
          </div>

          <div className="space-y-3">
            {evaluations.map(ev => {
              const app = appliances.find(a => a.id === ev.applianceId);
              return (
                <div
                  key={ev.id}
                  className="p-4 rounded-md border border-[#DADBD3] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#252923] text-sm">
                        {app?.name || 'Generic Assessment'}
                      </span>
                      <span className="font-mono text-[#73766F]">
                        {ev.evaluatedAt.split('T')[0]}
                      </span>
                      <Badge
                        variant={
                          ev.recommendation === 'repair'
                            ? 'optimal'
                            : ev.recommendation === 'replace'
                            ? 'urgent'
                            : 'attention'
                        }
                        size="sm"
                      >
                        {ev.recommendation.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-[#73766F] font-mono">
                        ({ev.assumptions?.comparisonPeriodYears || 3}-yr horizon)
                      </span>
                    </div>

                    <p className="text-[#4A4F44] leading-relaxed">{ev.detailedAnalysis}</p>

                    {/* Assumptions snapshot */}
                    <div className="flex items-center gap-3 text-[11px] text-[#73766F] pt-1">
                      <span>Repair: <strong>${ev.assumptions?.proposedRepairCost ?? ev.repairScenarioTotal}</strong></span>
                      <span>Replace: <strong>${ev.assumptions?.replacementCost ?? ev.replacementScenarioTotal}</strong></span>
                      <span>Net diff: <strong>${ev.netScenarioDifference}</strong></span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-[#73766F] block">Scenario Cost</span>
                      <span className="font-mono font-bold text-sm text-[#252923]">
                        ${ev.repairScenarioTotal.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteEvaluation(ev.id)}
                      className="text-[#73766F] hover:text-[#B91C1C] p-1 flex items-center gap-1 text-[11px] transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
