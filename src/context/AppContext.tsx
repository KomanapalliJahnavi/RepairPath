import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Appliance, 
  RepairEvent, 
  RepairQuote, 
  DecisionEvaluation, 
  TroubleshootingSession,
  ActiveTab 
} from '../types';
import { 
  INITIAL_APPLIANCES, 
  INITIAL_REPAIRS, 
  INITIAL_QUOTES, 
  INITIAL_EVALUATIONS,
  INITIAL_SESSIONS 
} from '../data/seedData';
import { analyzeRepairMemory } from '../utils/repairMemoryMatcher';

export interface RecurringAlertItem {
  applianceId: string;
  applianceName: string;
  brand: string;
  modelNumber: string;
  symptomSummary: string;
  matchCount: number;
  dates: string[];
  explanation: string;
  relatedRepairIds: string[];
  suggestedQuestions: string[];
}

export interface WarrantyReminderItem {
  applianceId: string;
  applianceName: string;
  brand: string;
  modelNumber: string;
  expiryDate: string;
  warrantyStatus: Appliance['warrantyStatus'];
  daysRemaining: number;
  isExpired: boolean;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  appliances: Appliance[];
  repairEvents: RepairEvent[];
  troubleshootingSessions: TroubleshootingSession[];
  quotes: RepairQuote[];
  evaluations: DecisionEvaluation[];
  selectedApplianceId: string | null;
  setSelectedApplianceId: (id: string | null) => void;
  
  // Appliance actions
  addAppliance: (appliance: Omit<Appliance, 'id' | 'createdAt' | 'updatedAt'>) => Appliance;
  updateAppliance: (id: string, updates: Partial<Appliance>) => void;
  deleteAppliance: (id: string) => void;
  getApplianceCascadeStats: (id: string) => {
    repairsCount: number;
    sessionsCount: number;
    quotesCount: number;
    evaluationsCount: number;
  };
  
  // Repair actions
  addRepairEvent: (event: Omit<RepairEvent, 'id'>) => RepairEvent;
  updateRepairEvent: (id: string, updates: Partial<RepairEvent>) => void;
  deleteRepairEvent: (id: string) => void;
  
  // Troubleshooting session actions
  addTroubleshootingSession: (session: Omit<TroubleshootingSession, 'id' | 'createdAt'>) => TroubleshootingSession;
  deleteTroubleshootingSession: (id: string) => void;
  getTroubleshootingSessionsForAppliance: (applianceId: string) => TroubleshootingSession[];
  
  // Quote actions
  addQuote: (quote: Omit<RepairQuote, 'id'>) => RepairQuote;
  updateQuote: (id: string, updates: Partial<RepairQuote>) => void;
  deleteQuote: (id: string) => void;
  
  // Evaluation actions
  addEvaluation: (evalData: Omit<DecisionEvaluation, 'id' | 'evaluatedAt'>) => DecisionEvaluation;
  deleteEvaluation: (id: string) => void;
  
  // Selectors & derived metrics (derived purely from saved records)
  getAppliance: (id: string) => Appliance | undefined;
  getRepairsForAppliance: (applianceId: string) => RepairEvent[];
  getQuotesForAppliance: (applianceId: string) => RepairQuote[];
  getEvaluationsForAppliance: (applianceId: string) => DecisionEvaluation[];
  getTotalRepairCosts: () => number;
  getRecurringAlerts: () => RecurringAlertItem[];
  getWarrantyReminders: () => WarrantyReminderItem[];
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'repairpath_v1_store';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);

  // Load from local storage or defaults
  const [appliances, setAppliances] = useState<Appliance[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_appliances`);
      return stored ? JSON.parse(stored) : INITIAL_APPLIANCES;
    } catch {
      return INITIAL_APPLIANCES;
    }
  });

  const [repairEvents, setRepairEvents] = useState<RepairEvent[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_repairs`);
      return stored ? JSON.parse(stored) : INITIAL_REPAIRS;
    } catch {
      return INITIAL_REPAIRS;
    }
  });

  const [troubleshootingSessions, setTroubleshootingSessions] = useState<TroubleshootingSession[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_sessions`);
      return stored ? JSON.parse(stored) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  });

  const [quotes, setQuotes] = useState<RepairQuote[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_quotes`);
      return stored ? JSON.parse(stored) : INITIAL_QUOTES;
    } catch {
      return INITIAL_QUOTES;
    }
  });

  const [evaluations, setEvaluations] = useState<DecisionEvaluation[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_evaluations`);
      return stored ? JSON.parse(stored) : INITIAL_EVALUATIONS;
    } catch {
      return INITIAL_EVALUATIONS;
    }
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_appliances`, JSON.stringify(appliances));
    } catch (e) {
      console.warn('LocalStorage save failed for appliances', e);
    }
  }, [appliances]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_repairs`, JSON.stringify(repairEvents));
    } catch (e) {
      console.warn('LocalStorage save failed for repairs', e);
    }
  }, [repairEvents]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_sessions`, JSON.stringify(troubleshootingSessions));
    } catch (e) {
      console.warn('LocalStorage save failed for sessions', e);
    }
  }, [troubleshootingSessions]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_quotes`, JSON.stringify(quotes));
    } catch (e) {
      console.warn('LocalStorage save failed for quotes', e);
    }
  }, [quotes]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_evaluations`, JSON.stringify(evaluations));
    } catch (e) {
      console.warn('LocalStorage save failed for evaluations', e);
    }
  }, [evaluations]);

  // Appliance Actions
  const addAppliance = (applianceData: Omit<Appliance, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newApp: Appliance = {
      ...applianceData,
      id: `app-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setAppliances(prev => [newApp, ...prev]);
    return newApp;
  };

  const updateAppliance = (id: string, updates: Partial<Appliance>) => {
    setAppliances(prev =>
      prev.map(app => (app.id === id ? { ...app, ...updates, updatedAt: new Date().toISOString() } : app))
    );
  };

  const getApplianceCascadeStats = (id: string) => {
    return {
      repairsCount: repairEvents.filter(r => r.applianceId === id).length,
      sessionsCount: troubleshootingSessions.filter(s => s.applianceId === id).length,
      quotesCount: quotes.filter(q => q.applianceId === id).length,
      evaluationsCount: evaluations.filter(e => e.applianceId === id).length,
    };
  };

  const deleteAppliance = (id: string) => {
    setAppliances(prev => prev.filter(app => app.id !== id));
    setRepairEvents(prev => prev.filter(r => r.applianceId !== id));
    setTroubleshootingSessions(prev => prev.filter(s => s.applianceId !== id));
    setQuotes(prev => prev.filter(q => q.applianceId !== id));
    setEvaluations(prev => prev.filter(e => e.applianceId !== id));
    if (selectedApplianceId === id) {
      setSelectedApplianceId(null);
    }
  };

  // Repair Actions with automatic Repair Memory analysis
  const addRepairEvent = (eventData: Omit<RepairEvent, 'id'>) => {
    // Perform transparent symptom matching
    const matchAnalysis = analyzeRepairMemory(
      eventData.applianceId,
      eventData.userReportedSymptom || (eventData as any).symptom || '',
      undefined,
      repairEvents,
      troubleshootingSessions
    );

    const relatedIds = matchAnalysis.matchedRepairs.map(r => r.id);

    const newRepair: RepairEvent = {
      ...eventData,
      id: `rep-${Date.now()}`,
      userReportedSymptom: eventData.userReportedSymptom || (eventData as any).symptom || '',
      recurringIssueFlag: matchAnalysis.isRecurring || !!eventData.recurringIssueFlag,
      recurrenceReason: matchAnalysis.isRecurring ? matchAnalysis.explanation : eventData.recurrenceReason,
      relatedRepairIds: relatedIds.length > 0 ? relatedIds : eventData.relatedRepairIds,
    };

    setRepairEvents(prev => [newRepair, ...prev]);
    return newRepair;
  };

  const updateRepairEvent = (id: string, updates: Partial<RepairEvent>) => {
    setRepairEvents(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRepairEvent = (id: string) => {
    setRepairEvents(prev => prev.filter(r => r.id !== id));
  };

  // Troubleshooting Session Actions
  const addTroubleshootingSession = (sessionData: Omit<TroubleshootingSession, 'id' | 'createdAt'>) => {
    const newSession: TroubleshootingSession = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTroubleshootingSessions(prev => [newSession, ...prev]);
    return newSession;
  };

  const deleteTroubleshootingSession = (id: string) => {
    setTroubleshootingSessions(prev => prev.filter(s => s.id !== id));
  };

  const getTroubleshootingSessionsForAppliance = (applianceId: string) => {
    return troubleshootingSessions.filter(s => s.applianceId === applianceId);
  };

  // Quote Actions
  const addQuote = (quoteData: Omit<RepairQuote, 'id'>) => {
    const newQuote: RepairQuote = {
      ...quoteData,
      id: `quote-${Date.now()}`,
    };
    setQuotes(prev => [newQuote, ...prev]);
    return newQuote;
  };

  const updateQuote = (id: string, updates: Partial<RepairQuote>) => {
    setQuotes(prev =>
      prev.map(q => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  // Evaluation Actions
  const addEvaluation = (evalData: Omit<DecisionEvaluation, 'id' | 'evaluatedAt'>) => {
    const newEval: DecisionEvaluation = {
      ...evalData,
      id: `eval-${Date.now()}`,
      evaluatedAt: new Date().toISOString(),
    };
    setEvaluations(prev => [newEval, ...prev]);
    return newEval;
  };

  const deleteEvaluation = (id: string) => {
    setEvaluations(prev => prev.filter(e => e.id !== id));
  };

  // Selectors & Metrics
  const getAppliance = (id: string) => appliances.find(a => a.id === id);

  const getRepairsForAppliance = (applianceId: string) =>
    repairEvents.filter(r => r.applianceId === applianceId);

  const getQuotesForAppliance = (applianceId: string) =>
    quotes.filter(q => q.applianceId === applianceId);

  const getEvaluationsForAppliance = (applianceId: string) =>
    evaluations.filter(e => e.applianceId === applianceId);

  const getTotalRepairCosts = () =>
    repairEvents.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  // Derived Recurring Alerts (only generated when supported by actual saved data)
  const getRecurringAlerts = (): RecurringAlertItem[] => {
    const alerts: RecurringAlertItem[] = [];
    const processedAppliances = new Set<string>();

    appliances.forEach(app => {
      if (processedAppliances.has(app.id)) return;
      const appRepairs = repairEvents.filter(r => r.applianceId === app.id);
      
      // Look for any repair marked recurring or having multiple keyword matches
      const recurringRepairs = appRepairs.filter(r => r.recurringIssueFlag || (r.relatedRepairIds && r.relatedRepairIds.length > 0));

      if (recurringRepairs.length >= 1) {
        processedAppliances.add(app.id);
        const dates = recurringRepairs.map(r => r.date);
        const explanation = recurringRepairs[0].recurrenceReason || 
          `Multiple repair records on this unit share similar symptoms (${recurringRepairs[0].userReportedSymptom}).`;

        alerts.push({
          applianceId: app.id,
          applianceName: app.name,
          brand: app.brand,
          modelNumber: app.modelNumber,
          symptomSummary: recurringRepairs[0].userReportedSymptom || recurringRepairs[0].title,
          matchCount: recurringRepairs.length,
          dates,
          explanation,
          relatedRepairIds: recurringRepairs.map(r => r.id),
          suggestedQuestions: [
            'What underlying factor is causing this identical component or symptom to fail repeatedly?',
            'Is there an upgraded service kit or revision bulletin released by the manufacturer?',
            'Will the service company offer an extended warranty on this specific recurring fix?'
          ],
        });
      }
    });

    return alerts;
  };

  // Derived Warranty Reminders (only generated when valid dates exist)
  const getWarrantyReminders = (): WarrantyReminderItem[] => {
    const reminders: WarrantyReminderItem[] = [];
    const now = new Date();

    appliances.forEach(app => {
      if (!app.warrantyExpiryDate) return;
      
      const expiry = new Date(app.warrantyExpiryDate);
      if (isNaN(expiry.getTime())) return;

      const diffMs = expiry.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining < 0;

      // Include active warranties expiring within 180 days or recently expired within 30 days
      if (daysRemaining <= 180 && daysRemaining >= -30) {
        reminders.push({
          applianceId: app.id,
          applianceName: app.name,
          brand: app.brand,
          modelNumber: app.modelNumber,
          expiryDate: app.warrantyExpiryDate,
          warrantyStatus: app.warrantyStatus,
          daysRemaining,
          isExpired,
        });
      }
    });

    return reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const resetToDefaults = () => {
    setAppliances(INITIAL_APPLIANCES);
    setRepairEvents(INITIAL_REPAIRS);
    setTroubleshootingSessions(INITIAL_SESSIONS);
    setQuotes(INITIAL_QUOTES);
    setEvaluations(INITIAL_EVALUATIONS);
    setSelectedApplianceId(null);
    localStorage.removeItem(`${STORAGE_KEY}_appliances`);
    localStorage.removeItem(`${STORAGE_KEY}_repairs`);
    localStorage.removeItem(`${STORAGE_KEY}_sessions`);
    localStorage.removeItem(`${STORAGE_KEY}_quotes`);
    localStorage.removeItem(`${STORAGE_KEY}_evaluations`);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        appliances,
        repairEvents,
        troubleshootingSessions,
        quotes,
        evaluations,
        selectedApplianceId,
        setSelectedApplianceId,
        addAppliance,
        updateAppliance,
        deleteAppliance,
        getApplianceCascadeStats,
        addRepairEvent,
        updateRepairEvent,
        deleteRepairEvent,
        addTroubleshootingSession,
        deleteTroubleshootingSession,
        getTroubleshootingSessionsForAppliance,
        addQuote,
        updateQuote,
        deleteQuote,
        addEvaluation,
        deleteEvaluation,
        getAppliance,
        getRepairsForAppliance,
        getQuotesForAppliance,
        getEvaluationsForAppliance,
        getTotalRepairCosts,
        getRecurringAlerts,
        getWarrantyReminders,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
