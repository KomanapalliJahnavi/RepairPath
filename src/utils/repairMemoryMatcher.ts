import { RepairEvent, TroubleshootingSession, Appliance } from '../types';

export interface SymptomMatchResult {
  isRecurring: boolean;
  matchCount: number;
  matchedRepairs: RepairEvent[];
  matchedSessions: TroubleshootingSession[];
  explanation: string;
  suggestedQuestions: string[];
  caveat: string;
}

// Stop words that shouldn't trigger matching
const STOP_WORDS = new Set([
  'the', 'and', 'is', 'a', 'an', 'in', 'on', 'of', 'for', 'to', 'with',
  'at', 'by', 'from', 'it', 'my', 'not', 'when', 'has', 'unit', 'problem',
  'appliance', 'issue', 'repair', 'broken', 'stopped', 'working', 'does'
]);

function stemWord(word: string): string {
  let w = word.toLowerCase();
  if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) w = w.slice(0, -1);
  return w;
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !STOP_WORDS.has(word))
    .map(stemWord);
}

/**
 * Transparent symptom matching: compares symptom descriptions and error codes
 * against past records for the specified appliance.
 */
export function analyzeRepairMemory(
  applianceId: string,
  currentSymptom: string,
  errorCode: string | undefined,
  allRepairs: RepairEvent[],
  allSessions: TroubleshootingSession[] = [],
  currentEventIdToExclude?: string
): SymptomMatchResult {
  if (!currentSymptom && !errorCode) {
    return {
      isRecurring: false,
      matchCount: 0,
      matchedRepairs: [],
      matchedSessions: [],
      explanation: '',
      suggestedQuestions: [],
      caveat: '',
    };
  }

  const currentTokens = extractKeywords(currentSymptom);
  const normalizedErrorCode = errorCode?.trim().toLowerCase();

  // Find matching repairs on the same appliance
  const matchedRepairs = allRepairs.filter(repair => {
    if (repair.applianceId !== applianceId) return false;
    if (currentEventIdToExclude && repair.id === currentEventIdToExclude) return false;

    // Direct error code match
    if (normalizedErrorCode && normalizedErrorCode.length > 1) {
      const repairText = `${repair.title} ${repair.userReportedSymptom} ${repair.technicianDiagnosis || ''} ${repair.followUpNotes || ''}`.toLowerCase();
      if (repairText.includes(normalizedErrorCode)) return true;
    }

    // Keyword overlap match across title, reported symptom, technician diagnosis, explanation, and performed repair
    const priorTokens = extractKeywords(
      `${repair.title} ${repair.userReportedSymptom} ${repair.technicianDiagnosis || ''} ${repair.possibleExplanation || ''} ${repair.repairPerformed || ''} ${repair.recurrenceReason || ''}`
    );

    const shared = currentTokens.filter(token => priorTokens.includes(token));
    const hasCoreDiagnosticWord = shared.some(t => 
      ['frost', 'ice', 'leak', 'drain', 'grind', 'flame', 'fan', 'motor', 'compressor'].includes(t)
    );
    return shared.length >= 2 || (shared.length >= 1 && hasCoreDiagnosticWord);
  });

  // Find matching troubleshooting sessions
  const matchedSessions = allSessions.filter(session => {
    if (session.applianceId !== applianceId) return false;
    const sessionTokens = extractKeywords(`${session.reportedSymptom} ${session.errorCode || ''}`);
    const shared = currentTokens.filter(token => sessionTokens.includes(token));
    return shared.length >= 2;
  });

  const totalMatches = matchedRepairs.length;
  const isRecurring = totalMatches > 0;

  if (!isRecurring) {
    return {
      isRecurring: false,
      matchCount: 0,
      matchedRepairs: [],
      matchedSessions,
      explanation: 'No identical or closely related symptoms were found in this unit’s saved repair journal.',
      suggestedQuestions: [
        'What is the verified root cause behind this initial symptom?',
        'Does this component show standard wear, or did an external factor cause it to fail?'
      ],
      caveat: '',
    };
  }

  // Generate transparent explanation
  const dates = matchedRepairs.map(r => r.date).join(', ');
  const parts = Array.from(new Set(matchedRepairs.flatMap(r => r.partsReplaced))).filter(Boolean);

  let explanation = `This symptom has been recorded ${totalMatches} ${totalMatches === 1 ? 'time' : 'times'} previously (on ${dates}).`;
  if (parts.length > 0) {
    explanation += ` Prior service involved replacing: ${parts.slice(0, 3).join(', ')}.`;
  }
  explanation += ' Review related history and consider asking your technician whether an underlying cause has yet to be addressed.';

  const suggestedQuestions = [
    `Since this symptom occurred ${totalMatches} times previously, is there an underlying cause (e.g. air leakage, drain line slope, or static pressure) that is triggering repeated wear?`,
    'Has the manufacturer released a technical service bulletin (TSB) or revised OEM part kit for this specific failure?',
    'What specific warranty coverage applies if this identical symptom recurs within the next 6 to 12 months?'
  ];

  const caveat = 'Similar symptoms do not prove that a prior part was defective, a repair failed, or a technician acted improperly. They identify a pattern warranting root-cause inquiry.';

  return {
    isRecurring,
    matchCount: totalMatches,
    matchedRepairs,
    matchedSessions,
    explanation,
    suggestedQuestions,
    caveat,
  };
}
