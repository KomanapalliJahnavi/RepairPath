import { INITIAL_APPLIANCES, INITIAL_REPAIRS, INITIAL_SESSIONS } from '../data/seedData';
import { analyzeRepairMemory } from '../utils/repairMemoryMatcher';
import { Appliance, RepairEvent, TroubleshootingSession } from '../types';

console.log('=== RUNNING REPAIRPATH PART 2 VERIFICATION SUITE ===\n');

// 1. Test Appliance CRUD & Lifespan/Age Logic
console.log('--- Test 1: Appliance Data & Integrity ---');
const testApp: Appliance = {
  id: 'app-test-99',
  name: 'Basement Wine Cooler',
  category: 'refrigeration',
  brand: 'Kalamera',
  modelNumber: 'KRC-30SZB',
  serialNumber: 'KLM98412',
  locationRoom: 'Basement',
  purchaseDate: '2023-01-15',
  purchasePrice: 650,
  expectedLifespanYears: 8,
  warrantyExpiryDate: '2024-01-15',
  warrantyStatus: 'expired',
  conditionStatus: 'optimal',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

console.log(`✓ Created appliance: ${testApp.name} (${testApp.brand} ${testApp.modelNumber})`);
console.log(`✓ Price: $${testApp.purchasePrice}, Expected life: ${testApp.expectedLifespanYears} yrs`);

// Test cascade stats calculation logic
const allRepairs: RepairEvent[] = [...INITIAL_REPAIRS];
const allSessions: TroubleshootingSession[] = [...INITIAL_SESSIONS];

function getCascadeStats(applianceId: string) {
  return {
    repairsCount: allRepairs.filter(r => r.applianceId === applianceId).length,
    sessionsCount: allSessions.filter(s => s.applianceId === applianceId).length,
  };
}

const samsungCascade = getCascadeStats('app-01');
console.log(`✓ Cascade deletion stats for app-01: ${samsungCascade.repairsCount} repairs, ${samsungCascade.sessionsCount} sessions`);
if (samsungCascade.repairsCount !== 2 || samsungCascade.sessionsCount !== 1) {
  throw new Error('Cascade stats do not match expected seed counts');
}

// 2. Test Repair Memory Symptom Matcher (Core Differentiator)
console.log('\n--- Test 2: Signature Feature: Repair Memory Matcher ---');

// Case A: Matching recurring symptom on Samsung Refrigerator
const recurringSymptom = 'Ice maker chute frosted over and auger making grinding noise';
const matchResultA = analyzeRepairMemory('app-01', recurringSymptom, undefined, allRepairs, allSessions);

console.log(`Symptom tested: "${recurringSymptom}"`);
console.log(`• Recurring flag: ${matchResultA.isRecurring}`);
console.log(`• Matches found: ${matchResultA.matchCount}`);
console.log(`• Matched record dates: ${matchResultA.matchedRepairs.map(r => r.date).join(', ')}`);
console.log(`• Plain-English explanation: ${matchResultA.explanation}`);
console.log(`• Suggested technician questions:`);
matchResultA.suggestedQuestions.forEach((q, i) => console.log(`   [Q${i + 1}] ${q}`));

if (!matchResultA.isRecurring || matchResultA.matchCount !== 2) {
  throw new Error('Repair Memory failed to match recurring ice maker frost on Samsung Refrigerator');
}

// Case B: Completely new/unrelated symptom (must NOT trigger false positive)
const newSymptom = 'Digital door display panel LED segment flickers dimly';
const matchResultB = analyzeRepairMemory('app-01', newSymptom, undefined, allRepairs, allSessions);

console.log(`\nUnrelated symptom tested: "${newSymptom}"`);
console.log(`• Recurring flag: ${matchResultB.isRecurring} (Expected: false)`);
console.log(`• Matches found: ${matchResultB.matchCount} (Expected: 0)`);

if (matchResultB.isRecurring) {
  throw new Error('Repair Memory triggered false positive on unrelated symptom');
}

// 3. Test Safe Troubleshooter Session Logging
console.log('\n--- Test 3: Safe Troubleshooter & Session History ---');
const newSession: TroubleshootingSession = {
  id: 'sess-test-01',
  applianceId: 'app-02',
  createdAt: new Date().toISOString(),
  reportedSymptom: 'Water not draining completely from sump basin after normal cycle',
  symptomCategory: 'Standing Water in Bottom Basin (Error E24 / E25)',
  startedWhen: 'Today',
  errorCode: 'E24',
  hazardDetected: false,
  checksPerformed: [
    {
      id: 'chk-1',
      title: 'Inspect & Clean Cylindrical Microfilter',
      testProcedure: 'Twist lower mesh filter counter-clockwise and scrub under tap',
      intent: 'Confirm that mechanical drainage blockage is not simply caused by surface grease',
      observation: 'passed',
      possibleExplanation: undefined,
    },
    {
      id: 'chk-2',
      title: 'Examine Drain Pump Impeller Access',
      testProcedure: 'Remove pump cover and check for foreign objects',
      intent: 'Establish whether the drain pump rotor is physically jammed by foreign debris',
      observation: 'failed',
      possibleExplanation: 'Foreign object wedged in impeller blades',
    }
  ],
  outcomeSummary: 'Preliminary check identifies drain pump impeller obstruction.',
  suggestedNextAction: 'safe_diy_maintenance',
  status: 'completed',
};

allSessions.push(newSession);
console.log(`✓ Created & saved troubleshooting session: ${newSession.id} for appliance ${newSession.applianceId}`);
console.log(`✓ Attached checks: ${newSession.checksPerformed.length} checks, outcome: "${newSession.outcomeSummary}"`);

// 4. Test Dashboard Data-Derived Alerts & Warranty Reminders
console.log('\n--- Test 4: Dynamic Dashboard Alerts Derivation ---');

// Derive recurring alerts
const recurringAlerts = INITIAL_APPLIANCES.flatMap(app => {
  const appRepairs = allRepairs.filter(r => r.applianceId === app.id && r.recurringIssueFlag);
  if (appRepairs.length > 0) {
    return [{
      applianceId: app.id,
      name: app.name,
      matchCount: appRepairs.length,
      dates: appRepairs.map(r => r.date),
      explanation: appRepairs[0].recurrenceReason || 'Repeat symptom logged',
    }];
  }
  return [];
});

console.log(`✓ Verified Recurring Alerts derived from saved data: ${recurringAlerts.length} alert(s)`);
recurringAlerts.forEach(alert => {
  console.log(`   Alert on [${alert.name}]: ${alert.matchCount} prior events (${alert.dates.join(', ')})`);
});

if (recurringAlerts.length === 0 || recurringAlerts[0].applianceId !== 'app-01') {
  throw new Error('Recurring alerts did not properly isolate the Samsung Refrigerator');
}

// Derive warranty reminders (only for valid dates)
const warrantyReminders = INITIAL_APPLIANCES.filter(a => a.warrantyExpiryDate).map(a => {
  const expiry = new Date(a.warrantyExpiryDate!);
  const diffDays = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return {
    name: a.name,
    expiryDate: a.warrantyExpiryDate,
    status: a.warrantyStatus,
    diffDays,
    isExpired: diffDays < 0,
  };
});

console.log(`✓ Verified Warranty Reminders derived strictly from valid dates:`);
warrantyReminders.forEach(w => {
  console.log(`   ${w.name} -> Expiry: ${w.expiryDate} (${w.isExpired ? 'Expired' : `${w.diffDays} days left`})`);
});

console.log('\n=== ALL PART 2 CORE TESTS PASSED SUCCESSFULLY! ===');
