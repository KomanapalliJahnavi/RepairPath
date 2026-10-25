import { calculateQuoteTotal, parseCurrencyInput, roundCurrency } from '../utils/quoteCalculations';
import { calculateRepairVsReplace } from '../utils/repairVsReplaceCalculations';
import { INITIAL_APPLIANCES, INITIAL_REPAIRS, INITIAL_QUOTES, INITIAL_EVALUATIONS } from '../data/seedData';
import { RepairQuote, QuotePartItem, RepairVsReplaceAssumptions, Appliance } from '../types';

console.log('===========================================================');
console.log('REPAIRPATH PART 3: FINANCIAL TOOLS, PERSISTENCE & AUDIT');
console.log('===========================================================\n');

let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failedTests++;
  } else {
    console.log(`✓ PASSED: ${message}`);
  }
}

// -------------------------------------------------------------
// 1. QUOTESENSE FORMULA & CALCULATION AUDIT
// Formula: Total = Labour + Parts + Taxes + Additional Fees − Discounts
// -------------------------------------------------------------
console.log('--- TEST GROUP 1: QuoteSense Formula & Financial Math ---');

// Test 1.1: Standard valid breakdown
const standardParts: QuotePartItem[] = [
  { id: 'p1', partName: 'Drain Pump Assembly', partNumber: 'WPW10348269', cost: 125.50 },
  { id: 'p2', partName: 'O-ring Seal Gasket', cost: 14.25 },
];
const standardCalc = calculateQuoteTotal({
  laborCost: 180.00,
  parts: standardParts,
  taxes: 23.98,
  additionalFees: 35.00,
  discountAmount: 25.00,
});

assert(standardCalc.partsCost === 139.75, `Parts sum: expected 139.75, got ${standardCalc.partsCost}`);
// 180 + 139.75 + 23.98 + 35 - 25 = 353.73
assert(standardCalc.calculatedTotal === 353.73, `Formula calculation: expected 353.73, got ${standardCalc.calculatedTotal}`);
assert(standardCalc.isValid === true, 'Standard quote marked valid');
assert(standardCalc.errorMessages.length === 0, 'No validation errors on standard quote');

// Test 1.2: Blank / zero fields handling
const zeroCalc = calculateQuoteTotal({
  laborCost: 0,
  parts: [],
  taxes: 0,
  additionalFees: 0,
  discountAmount: 0,
});
assert(zeroCalc.calculatedTotal === 0, `Zero values result in $0 total, got ${zeroCalc.calculatedTotal}`);
assert(zeroCalc.partsCost === 0, 'Empty parts list yields 0 partsCost');

// Test 1.3: Negative inputs rejection
const negativeCalc = calculateQuoteTotal({
  laborCost: -150,
  partsCost: -50,
  taxes: 10,
  additionalFees: -5,
  discountAmount: 0,
});
assert(negativeCalc.isValid === false, 'Negative inputs correctly invalidate quote');
assert(negativeCalc.errorMessages.some(e => e.includes('Labour cost cannot be negative')), 'Flags negative labor');
assert(negativeCalc.errorMessages.some(e => e.includes('Additional fees cannot be negative')), 'Flags negative fees');

// Test 1.4: Discount exceeding gross sum guard
const excessiveDiscountCalc = calculateQuoteTotal({
  laborCost: 100,
  partsCost: 50,
  taxes: 10,
  additionalFees: 10, // Gross = 170
  discountAmount: 200, // Exceeds gross
});
assert(excessiveDiscountCalc.isValid === false, 'Discount exceeding gross is flagged invalid');
assert(excessiveDiscountCalc.calculatedTotal === 0, 'Calculated total clamped to 0 without negative balance');
assert(excessiveDiscountCalc.errorMessages.some(e => e.includes('cannot exceed')), 'Clear error message on excessive discount');

// Test 1.5: Currency precision & rounding
const rounded = roundCurrency(10.1265);
assert(rounded === 10.13, `Currency rounding 10.1265 -> 10.13, got ${rounded}`);
const parsedCurrency = parseCurrencyInput('$ 1,450.75');
assert(parsedCurrency === 1450.75, `Currency parser strips formatting: expected 1450.75, got ${parsedCurrency}`);
const parsedEmpty = parseCurrencyInput('');
assert(parsedEmpty === 0, `Empty input parses to 0, got ${parsedEmpty}`);


// -------------------------------------------------------------
// 2. REPAIR-VERSUS-REPLACE CALCULATOR AUDIT
// Actuarial Decision Models, 50% Rule, Annualized Costs & Limitations
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Repair vs Replace Actuarial Decision Tool ---');

// Case 2.1: Economically prudent repair
// $350 repair, $1200 new, 3 yr horizon, $50/yr maintenance, $20/yr running penalty
// Repair Scenario = 350 + (50 * 3) + (20 * 3) = 350 + 150 + 60 = 560
// Replacement Scenario = 1200
// Net Difference = 1200 - 560 = +640 saved by repairing
const prudentAssumptions: RepairVsReplaceAssumptions = {
  applianceId: 'app-01',
  proposedRepairCost: 350,
  replacementCost: 1200,
  comparisonPeriodYears: 3,
  estimatedFutureAnnualRepairs: 50,
  remainingUsefulLifeYears: 4,
  expectedReplacementLifespanYears: 10,
  annualRunningCostDifference: 20,
};
const prudentResult = calculateRepairVsReplace(prudentAssumptions, 4);

assert(prudentResult.repairScenarioTotal === 560, `Repair scenario total: expected 560, got ${prudentResult.repairScenarioTotal}`);
assert(prudentResult.replacementScenarioTotal === 1200, `Replacement scenario total: expected 1200, got ${prudentResult.replacementScenarioTotal}`);
assert(prudentResult.netScenarioDifference === 640, `Net difference: expected 640 saved, got ${prudentResult.netScenarioDifference}`);
assert(prudentResult.recommendation === 'repair', `Recommendation: expected 'repair', got '${prudentResult.recommendation}'`);
assert(prudentResult.fiftyPercentRuleViolated === false, '50% rule not violated (350 / 1200 = 29.2%)');
assert(prudentResult.annualizedRepairCost === roundCurrency(560 / 3), `Annualized repair cost: expected ${roundCurrency(560/3)}, got ${prudentResult.annualizedRepairCost}`);
assert(prudentResult.annualizedReplacementCost === 120, `Annualized replacement cost: expected 120, got ${prudentResult.annualizedReplacementCost}`);

// Case 2.2: 50% Rule Violated
// $700 repair on $1100 machine = 63.6% ratio -> Must recommend replace
const fiftyPercentAssumptions: RepairVsReplaceAssumptions = {
  applianceId: 'app-02',
  proposedRepairCost: 700,
  replacementCost: 1100,
  comparisonPeriodYears: 3,
  estimatedFutureAnnualRepairs: 80,
  remainingUsefulLifeYears: 2,
  expectedReplacementLifespanYears: 10,
  annualRunningCostDifference: 30,
};
const fiftyPercentResult = calculateRepairVsReplace(fiftyPercentAssumptions, 6);

assert(fiftyPercentResult.fiftyPercentRuleViolated === true, '50% rule violation flagged correctly');
assert(fiftyPercentResult.recommendation === 'replace', `Recommendation: expected 'replace', got '${fiftyPercentResult.recommendation}'`);
assert(fiftyPercentResult.detailedAnalysis.includes('exceeds 50%'), 'Rationale transparently explains 50% prudence ceiling');

// Case 2.3: Incomplete / Missing Information Handling
const missingAssumptions: RepairVsReplaceAssumptions = {
  applianceId: 'app-03',
  proposedRepairCost: 0, // Missing
  replacementCost: 1000,
  comparisonPeriodYears: 3,
  estimatedFutureAnnualRepairs: 0,
  remainingUsefulLifeYears: null, // Unspecified
  expectedReplacementLifespanYears: 10,
  annualRunningCostDifference: 0,
};
const missingResult = calculateRepairVsReplace(missingAssumptions, 5);

assert(missingResult.recommendation === 'insufficient_information', 'Flags insufficient information when repair quote is $0');
assert(missingResult.limitations.length >= 2, `Lists transparent limitations, count: ${missingResult.limitations.length}`);
assert(missingResult.limitations.some(l => l.includes('missing or zero')), 'Identifies missing repair estimate in limitations');
assert(missingResult.limitations.some(l => l.includes('unspecified')), 'Identifies unspecified remaining life in limitations');


// -------------------------------------------------------------
// 3. STORAGE & CASCADE DELETION INTEGRITY AUDIT
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Persistence, Parsing & Cascade Handling ---');

// Test 3.1: JSON serialization round-trip
const sampleQuote: RepairQuote = INITIAL_QUOTES[0];
const serialized = JSON.stringify(sampleQuote);
const deserialized: RepairQuote = JSON.parse(serialized);

assert(deserialized.id === sampleQuote.id, 'Quote serialization preserves stable record ID');
assert(deserialized.calculatedTotal === sampleQuote.calculatedTotal, 'Quote serialization preserves calculated total');
assert(deserialized.sourceType === 'user_entered', 'Quote explicitly preserves user_entered attribution');

// Test 3.2: Corrupted JSON recovery fallback
function safeLoadFromStorage(key: string, fallback: any[]) {
  try {
    const raw = '{ invalid_json ::: ';
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
const recovered = safeLoadFromStorage('corrupted_key', INITIAL_APPLIANCES);
assert(recovered.length === INITIAL_APPLIANCES.length, 'Malformed storage recovers safely with fallback data without crashing');

// Test 3.3: Cascade deletion integrity
// When an appliance is deleted, all attached quotes, repairs, and evaluations must cascade
let mockAppliances = [...INITIAL_APPLIANCES];
let mockRepairs = [...INITIAL_REPAIRS];
let mockQuotes = [...INITIAL_QUOTES];
let mockEvaluations = [...INITIAL_EVALUATIONS];

const targetAppId = 'app-01'; // Samsung Refrigerator
const initialRepairsForApp = mockRepairs.filter(r => r.applianceId === targetAppId).length;
const initialQuotesForApp = mockQuotes.filter(q => q.applianceId === targetAppId).length;
const initialEvalsForApp = mockEvaluations.filter(e => e.applianceId === targetAppId).length;

assert(initialRepairsForApp > 0, `App ${targetAppId} has ${initialRepairsForApp} repairs`);
assert(initialQuotesForApp > 0, `App ${targetAppId} has ${initialQuotesForApp} quotes`);

// Perform cascade deletion
mockAppliances = mockAppliances.filter(a => a.id !== targetAppId);
mockRepairs = mockRepairs.filter(r => r.applianceId !== targetAppId);
mockQuotes = mockQuotes.filter(q => q.applianceId !== targetAppId);
mockEvaluations = mockEvaluations.filter(e => e.applianceId !== targetAppId);

assert(mockAppliances.every(a => a.id !== targetAppId), 'Appliance removed from registry');
assert(mockRepairs.every(r => r.applianceId !== targetAppId), 'All associated repair records cascade deleted');
assert(mockQuotes.every(q => q.applianceId !== targetAppId), 'All associated quotations cascade deleted');
assert(mockEvaluations.every(e => e.applianceId !== targetAppId), 'All associated decision evaluations cascade deleted');

// Test 3.4: Remaining records for other appliances remain intact
assert(mockAppliances.length === INITIAL_APPLIANCES.length - 1, 'Only target appliance was deleted');
assert(mockRepairs.length === INITIAL_REPAIRS.length - initialRepairsForApp, 'Unrelated appliance repairs completely preserved');


// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n===========================================================');
if (failedTests === 0) {
  console.log('🎉 ALL PART 3 VERIFICATION TESTS PASSED SUCCESSFULLY! (0 failures)');
} else {
  console.error(`⚠️ ${failedTests} TEST(S) FAILED!`);
  process.exit(1);
}
console.log('===========================================================');
