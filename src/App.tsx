import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { OverviewDashboard } from './components/overview/OverviewDashboard';
import { ApplianceList } from './components/appliances/ApplianceList';
import { TroubleshooterWizard } from './components/troubleshooter/TroubleshooterWizard';
import { RepairMemoryTimeline } from './components/repair-memory/RepairMemoryTimeline';
import { QuoteSenseComparison } from './components/quotesense/QuoteSenseComparison';
import { RepairVsReplaceCalculator } from './components/repair-vs-replace/RepairVsReplaceCalculator';
import { ApplianceFormModal } from './components/appliances/ApplianceFormModal';
import { AddRepairEventModal } from './components/repair-memory/AddRepairEventModal';

const MainContent: React.FC = () => {
  const { activeTab, addAppliance } = useApp();
  const [isAddApplianceOpen, setIsAddApplianceOpen] = useState(false);
  const [isAddRepairOpen, setIsAddRepairOpen] = useState(false);
  const [targetRepairApplianceId, setTargetRepairApplianceId] = useState<string | undefined>(undefined);

  const handleOpenAddRepair = (applianceId?: string) => {
    setTargetRepairApplianceId(applianceId);
    setIsAddRepairOpen(true);
  };

  return (
    <AppShell onOpenAddAppliance={() => setIsAddApplianceOpen(true)}>
      {activeTab === 'overview' && (
        <OverviewDashboard
          onOpenAddAppliance={() => setIsAddApplianceOpen(true)}
          onOpenAddRepair={() => handleOpenAddRepair()}
        />
      )}

      {activeTab === 'appliances' && (
        <ApplianceList
          onOpenAddRepairForAppliance={(id) => handleOpenAddRepair(id)}
        />
      )}

      {activeTab === 'troubleshooter' && <TroubleshooterWizard />}

      {activeTab === 'repair-memory' && <RepairMemoryTimeline />}

      {activeTab === 'quotesense' && <QuoteSenseComparison />}

      {activeTab === 'repair-vs-replace' && <RepairVsReplaceCalculator />}

      {/* Global Add Appliance Modal */}
      <ApplianceFormModal
        isOpen={isAddApplianceOpen}
        onClose={() => setIsAddApplianceOpen(false)}
        onSubmit={(data) => addAppliance(data)}
      />

      {/* Global Add Repair Event Modal */}
      <AddRepairEventModal
        isOpen={isAddRepairOpen}
        onClose={() => {
          setIsAddRepairOpen(false);
          setTargetRepairApplianceId(undefined);
        }}
        initialApplianceId={targetRepairApplianceId}
      />
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
