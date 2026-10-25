import { RepairVsReplaceAssumptions, DecisionEvaluation } from '../types';
import { roundCurrency } from './quoteCalculations';

export interface ActuarialEvaluationResult {
  repairScenarioTotal: number;
  replacementScenarioTotal: number;
  netScenarioDifference: number; // positive = repair is cheaper; negative = replace is cheaper
  annualizedRepairCost: number;
  annualizedReplacementCost: number;
  repairToReplacementRatio: number;
  fiftyPercentRuleViolated: boolean;
  lifespanThresholdViolated: boolean;
  recommendation: 'repair' | 'replace' | 'insufficient_information';
  financialScoreNote: string;
  detailedAnalysis: string;
  limitations: string[];
}

/**
 * Calculates actuarial scenario comparisons for repair versus replacement
 * over a defined comparison timeframe.
 */
export function calculateRepairVsReplace(
  assumptions: RepairVsReplaceAssumptions,
  applianceCurrentAgeYears: number = 5
): ActuarialEvaluationResult {
  const limitations: string[] = [];

  const repairCost = Math.max(0, assumptions.proposedRepairCost || 0);
  const replaceCost = Math.max(0, assumptions.replacementCost || 0);
  const futureAnnual = Math.max(0, assumptions.estimatedFutureAnnualRepairs || 0);
  const period = Math.max(1, assumptions.comparisonPeriodYears || 3);
  const runningDelta = assumptions.annualRunningCostDifference || 0;
  const expectedLife = Math.max(1, assumptions.expectedReplacementLifespanYears || 10);
  const remainingLife = assumptions.remainingUsefulLifeYears;

  // Check for missing information
  if (repairCost <= 0) {
    limitations.push('Proposed repair estimate is missing or zero.');
  }
  if (replaceCost <= 0) {
    limitations.push('Replacement purchase price is missing.');
  }
  if (remainingLife === null || remainingLife === undefined) {
    limitations.push('Estimated remaining useful lifespan after repair was left unspecified.');
  } else if (remainingLife < period) {
    limitations.push(
      `Projected remaining useful life (${remainingLife} yrs) is shorter than the comparison period (${period} yrs). Machine may require secondary replacement within this window.`
    );
  }
  if (futureAnnual === 0) {
    limitations.push('Assumes $0 in future maintenance over the comparison period (illustrative assumption).');
  }

  // If critical inputs are missing
  if (repairCost <= 0 || replaceCost <= 0) {
    return {
      repairScenarioTotal: 0,
      replacementScenarioTotal: 0,
      netScenarioDifference: 0,
      annualizedRepairCost: 0,
      annualizedReplacementCost: 0,
      repairToReplacementRatio: 0,
      fiftyPercentRuleViolated: false,
      lifespanThresholdViolated: false,
      recommendation: 'insufficient_information',
      financialScoreNote: 'Insufficient data for financial comparison',
      detailedAnalysis: 'Please provide both a repair quote and a replacement purchase price to calculate scenario totals.',
      limitations,
    };
  }

  // 1. Repair Scenario Total over comparison period
  // Repair Cost + (Estimated Future Annual Maintenance * Years) + (Running Cost Difference * Years)
  // (If new unit saves energy, remaining on old unit carries that annual running penalty)
  const futureMaintenanceTotal = roundCurrency(futureAnnual * period);
  const runningPenaltyTotal = roundCurrency(Math.max(0, runningDelta) * period);
  const repairScenarioTotal = roundCurrency(repairCost + futureMaintenanceTotal + runningPenaltyTotal);

  // 2. Replacement Scenario Total
  // Direct capital cost of new unit + minimal expected baseline warranty maintenance
  const replacementScenarioTotal = roundCurrency(replaceCost);

  // Net difference over comparison period
  // Positive means repair is cheaper by $X; negative means replacement is cheaper by $X
  const netScenarioDifference = roundCurrency(replacementScenarioTotal - repairScenarioTotal);

  // Annualized costs for normalized comparison
  // Annualized repair cost over comparison window
  const annualizedRepairCost = roundCurrency(repairScenarioTotal / period);
  // Annualized replacement cost over its full expected lifespan
  const annualizedReplacementCost = roundCurrency(replaceCost / expectedLife);

  // 50% Rule and Lifespan Thresholds
  const repairToReplacementRatio = roundCurrency((repairCost / replaceCost) * 100);
  const fiftyPercentRuleViolated = repairToReplacementRatio >= 50;
  const lifespanThresholdViolated = remainingLife !== null ? remainingLife <= 2 : applianceCurrentAgeYears >= (expectedLife * 0.70);

  let recommendation: 'repair' | 'replace' | 'insufficient_information' = 'repair';
  let financialScoreNote = '';
  let detailedAnalysis = '';

  if (fiftyPercentRuleViolated) {
    recommendation = 'replace';
    financialScoreNote = `Repair estimate is ${repairToReplacementRatio.toFixed(0)}% of replacement cost, violating the 50% prudence ceiling.`;
    detailedAnalysis = `The immediate quote of $${repairCost.toLocaleString()} exceeds 50% of buying new ($${replaceCost.toLocaleString()}). Applying industry actuarial standards, replacement avoids the risk of compounding repairs on an out-of-warranty chassis.`;
  } else if (lifespanThresholdViolated && repairToReplacementRatio >= 35) {
    recommendation = 'replace';
    financialScoreNote = `Appliance is near end of lifespan and quote is ${repairToReplacementRatio.toFixed(0)}% of new unit.`;
    detailedAnalysis = `The appliance has elapsed most of its expected useful life. When combined with a repair quote of $${repairCost.toLocaleString()}, the annualized cost of maintaining the unit ($${annualizedRepairCost}/yr) approaches the annualized cost of a brand-new unit with factory warranty ($${annualizedReplacementCost}/yr).`;
  } else if (repairScenarioTotal < replacementScenarioTotal && !fiftyPercentRuleViolated) {
    recommendation = 'repair';
    financialScoreNote = `Repair scenario saves $${netScenarioDifference.toLocaleString()} over a ${period}-year comparison window.`;
    detailedAnalysis = `Repairing the existing appliance is the economically rational choice. The total cost of repair plus projected maintenance over ${period} years ($${repairScenarioTotal.toLocaleString()}) remains $${netScenarioDifference.toLocaleString()} lower than the immediate capital cost of a replacement ($${replacementScenarioTotal.toLocaleString()}).`;
  } else {
    recommendation = 'replace';
    financialScoreNote = `Replacement is financially advantageous over ${period} years.`;
    detailedAnalysis = `When factoring in future maintenance and efficiency differences over ${period} years, purchasing a new unit ($${replacementScenarioTotal.toLocaleString()}) yields lower total ownership costs than sinking ongoing funds into repairs ($${repairScenarioTotal.toLocaleString()}).`;
  }

  return {
    repairScenarioTotal,
    replacementScenarioTotal,
    netScenarioDifference,
    annualizedRepairCost,
    annualizedReplacementCost,
    repairToReplacementRatio,
    fiftyPercentRuleViolated,
    lifespanThresholdViolated,
    recommendation,
    financialScoreNote,
    detailedAnalysis,
    limitations,
  };
}
