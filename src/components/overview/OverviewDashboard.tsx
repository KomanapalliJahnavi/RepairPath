import React from 'react';
import { 
  HelpCircle, 
  Plus, 
  AlertTriangle, 
  History, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Wrench, 
  Clock, 
  Calendar,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';

interface OverviewDashboardProps {
  onOpenAddAppliance: () => void;
  onOpenAddRepair: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onOpenAddAppliance,
  onOpenAddRepair,
}) => {
  const { 
    appliances, 
    repairEvents, 
    setActiveTab, 
    setSelectedApplianceId,
    getTotalRepairCosts,
    getRecurringAlerts,
    getWarrantyReminders,
    resetToDefaults
  } = useApp();

  const totalSpent = getTotalRepairCosts();
  const recurringAlerts = getRecurringAlerts();
  const warrantyReminders = getWarrantyReminders();

  // Sort repairs chronologically
  const recentRepairs = [...repairEvents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // First-use empty state
  if (appliances.length === 0) {
    return (
      <div className="py-12 px-6 max-w-2xl mx-auto text-center flex flex-col items-center justify-center rounded-lg border border-dashed border-[#DADBD3] bg-white my-8 text-left">
        <div className="w-12 h-12 rounded-full bg-[#EBF2EE] text-[#285B45] flex items-center justify-center mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#252923] tracking-tight">
          Welcome to RepairPath
        </h2>
        <p className="text-xs sm:text-sm text-[#73766F] mt-2 mb-6 leading-relaxed text-center max-w-lg">
          No household appliances are currently registered. Register your primary refrigerator, dishwasher, washing machine, or HVAC unit with model and purchase records to track maintenance, warranties, and safe diagnostics.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={onOpenAddAppliance}
          >
            Add Your First Appliance
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={resetToDefaults}
          >
            Load Realistic Demo Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* 1. Welcome & Prominent Actions */}
      <div className="p-5 sm:p-6 bg-white rounded-lg border border-[#DADBD3] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#252923] tracking-tight">
            Maintenance & Decision Overview
          </h2>
          <p className="text-xs sm:text-sm text-[#73766F] mt-1 leading-relaxed">
            Centralized inventory status, verified service history, warranty expirations, and Repair Memory alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Button
            variant="primary"
            size="md"
            icon={<HelpCircle className="w-4 h-4" />}
            onClick={() => {
              if (appliances[0]) setSelectedApplianceId(appliances[0].id);
              setActiveTab('troubleshooter');
            }}
          >
            Troubleshoot a Problem
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={onOpenAddAppliance}
          >
            Add Appliance
          </Button>
        </div>
      </div>

      {/* 2. Repair Memory Alerts (Derived strictly from saved data) */}
      {recurringAlerts.length > 0 && (
        <div className="space-y-3">
          {recurringAlerts.map(alert => (
            <div
              key={alert.applianceId}
              className="p-4 sm:p-5 rounded-lg bg-[#FDF2F2] border border-[#F8C8C8] space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-[#B91C1C]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <h3 className="text-sm font-bold tracking-tight">
                    Repair Memory Alert: Recurring Symptom Pattern on {alert.applianceName}
                  </h3>
                </div>
                <Badge variant="recurring" size="sm">
                  {alert.matchCount} Recorded Events
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed">
                {alert.explanation}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApplianceId(alert.applianceId);
                    setActiveTab('repair-memory');
                  }}
                  className="font-semibold text-[#B91C1C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Related History in Repair Memory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedApplianceId(alert.applianceId);
                    setActiveTab('troubleshooter');
                  }}
                  className="font-semibold text-[#285B45] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Preliminary Troubleshooter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Warranty Reminders (Derived strictly from valid dates) */}
      {warrantyReminders.length > 0 && (
        <div className="p-4 rounded-lg bg-white border border-[#CAD6E2] space-y-2">
          <div className="flex items-center gap-2 text-[#2B5278] pb-1 border-b border-[#F5F4EF]">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Warranty Schedule & Deadlines ({warrantyReminders.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {warrantyReminders.map(item => (
              <div
                key={item.applianceId}
                onClick={() => {
                  setSelectedApplianceId(item.applianceId);
                  setActiveTab('appliances');
                }}
                className="p-2.5 rounded bg-[#FAF9F5] border border-[#DADBD3] hover:border-[#285B45] transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-[#252923] block">{item.applianceName}</span>
                  <span className="text-[11px] text-[#73766F] font-mono">
                    Expires: {item.expiryDate} {item.isExpired ? '(Expired)' : `(${item.daysRemaining} days remaining)`}
                  </span>
                </div>
                <Badge
                  variant={item.isExpired ? 'expired' : 'under_warranty'}
                  size="sm"
                >
                  {item.isExpired ? 'Expired' : 'Active'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Appliance Overview Table */}
      <div className="p-5 sm:p-6 bg-white rounded-lg border border-[#DADBD3] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#285B45]" />
            <h3 className="text-sm font-bold text-[#252923]">
              Registered Household Appliances ({appliances.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('appliances')}
            className="text-xs font-semibold text-[#285B45] hover:underline flex items-center gap-1"
          >
            <span>Manage All Units</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compact Table */}
        <div className="overflow-x-auto border border-[#DADBD3] rounded-md">
          <table className="w-full text-xs text-left text-[#252923]" aria-label="Appliance inventory table">
            <thead className="bg-[#FAF9F5] border-b border-[#DADBD3] text-[#73766F] uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th scope="col" className="px-3.5 py-2.5">Appliance</th>
                <th scope="col" className="px-3.5 py-2.5">Brand & Model</th>
                <th scope="col" className="px-3.5 py-2.5">Location</th>
                <th scope="col" className="px-3.5 py-2.5">Warranty</th>
                <th scope="col" className="px-3.5 py-2.5">Condition</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADBD3]/60">
              {appliances.map(app => (
                <tr
                  key={app.id}
                  className="hover:bg-[#FAF9F5] transition-colors"
                >
                  <td className="px-3.5 py-3 font-semibold text-[#252923]">
                    {app.name}
                  </td>
                  <td className="px-3.5 py-3 font-mono text-[#4A4F44]">
                    {app.brand} {app.modelNumber}
                  </td>
                  <td className="px-3.5 py-3 text-[#73766F]">
                    {app.locationRoom}
                  </td>
                  <td className="px-3.5 py-3">
                    <Badge status={app.warrantyStatus} size="sm" />
                  </td>
                  <td className="px-3.5 py-3">
                    <Badge status={app.conditionStatus} size="sm" />
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApplianceId(app.id);
                        setActiveTab('appliances');
                      }}
                      className="text-xs font-semibold text-[#285B45] hover:underline cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Chronological Recent Repair Activity */}
      <div className="p-5 sm:p-6 bg-white rounded-lg border border-[#DADBD3] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#285B45]" />
            <h3 className="text-sm font-bold text-[#252923]">
              Recent Service & Repair Activity
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#73766F] hidden sm:inline">
              Historical Total: <strong className="text-[#252923]">${totalSpent.toLocaleString()}</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('repair-memory')}
              className="text-xs font-semibold text-[#285B45] hover:underline flex items-center gap-1"
            >
              <span>View Full Chronology</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentRepairs.length === 0 ? (
          <p className="text-xs text-[#73766F] py-6 text-center border border-dashed border-[#DADBD3] rounded-md bg-[#FAF9F5]">
            No repair records logged yet.
          </p>
        ) : (
          <div className="space-y-3">
            {recentRepairs.map(repair => {
              const app = appliances.find(a => a.id === repair.applianceId);
              const symptom = repair.userReportedSymptom || (repair as any).symptom;

              return (
                <div
                  key={repair.id}
                  className="p-3.5 rounded-md border border-[#DADBD3] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#252923]">{repair.date}</span>
                      <span className="font-semibold text-[#285B45]">{app?.name || 'Appliance'}</span>
                      <span className="text-[#73766F]">• {repair.serviceCompany || repair.serviceType.toUpperCase()}</span>
                    </div>
                    <p className="font-semibold text-[#252923]">{repair.title}</p>
                    <p className="text-[#4A4F44]">
                      <span className="text-[#73766F]">Symptom: </span>
                      {symptom}
                    </p>
                  </div>

                  <div className="flex sm:flex-col sm:items-end justify-between gap-1 shrink-0">
                    <span className="font-mono text-sm font-bold text-[#252923]">${repair.cost}</span>
                    <Badge variant={repair.recurringIssueFlag ? 'recurring' : 'neutral'} size="sm">
                      {repair.recurringIssueFlag ? 'Recurring' : repair.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-xs text-[#73766F]">
          <span>Every repair links back into Repair Memory to detect chronic failure patterns.</span>
          <Button
            variant="outline"
            size="sm"
            icon={<Wrench className="w-3.5 h-3.5" />}
            onClick={onOpenAddRepair}
          >
            Log Service Event
          </Button>
        </div>
      </div>
    </div>
  );
};
