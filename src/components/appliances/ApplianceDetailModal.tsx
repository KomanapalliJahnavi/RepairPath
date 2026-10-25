import React, { useState } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  HelpCircle, 
  ArrowLeftRight, 
  Edit3, 
  Trash2,
  FileText
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Appliance } from '../../types';
import { useApp } from '../../context/AppContext';
import { TechnicianSummaryModal } from '../troubleshooter/TechnicianSummaryModal';

interface ApplianceDetailModalProps {
  appliance: Appliance | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (appliance: Appliance) => void;
  onOpenAddRepairForAppliance?: (applianceId: string) => void;
}

export const ApplianceDetailModal: React.FC<ApplianceDetailModalProps> = ({
  appliance,
  isOpen,
  onClose,
  onEdit,
  onOpenAddRepairForAppliance,
}) => {
  const { 
    getRepairsForAppliance, 
    getTroubleshootingSessionsForAppliance,
    getApplianceCascadeStats,
    deleteAppliance, 
    setActiveTab, 
    setSelectedApplianceId 
  } = useApp();

  const [activeTab, setActiveTabLocal] = useState<'specs' | 'repairs' | 'sessions'>('specs');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isTechPacketOpen, setIsTechPacketOpen] = useState(false);

  if (!appliance || !isOpen) return null;

  const repairs = getRepairsForAppliance(appliance.id);
  const sessions = getTroubleshootingSessionsForAppliance(appliance.id);
  const cascadeStats = getApplianceCascadeStats(appliance.id);
  const totalRepairsCost = repairs.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);

  // Age calculation
  const purchaseTime = appliance.purchaseDate ? new Date(appliance.purchaseDate).getTime() : null;
  const now = new Date().getTime();
  const ageYears = purchaseTime ? Math.max(0, (now - purchaseTime) / (1000 * 60 * 60 * 24 * 365.25)) : null;
  const ageFormatted = ageYears !== null ? (ageYears < 1 ? `${Math.round(ageYears * 12)} months` : `${ageYears.toFixed(1)} years`) : 'Unknown';

  const lifespanFraction = ageYears !== null ? Math.min(1, ageYears / (appliance.expectedLifespanYears || 10)) : 0;
  const lifespanPercentage = Math.round(lifespanFraction * 100);
  const remainingYears = ageYears !== null ? Math.max(0, (appliance.expectedLifespanYears || 10) - ageYears).toFixed(1) : '—';

  const hasRecurringIssues = repairs.some(r => r.recurringIssueFlag);

  const handleDeleteProceed = () => {
    deleteAppliance(appliance.id);
    setIsConfirmingDelete(false);
    onClose();
  };

  const handleStartTroubleshooting = () => {
    setSelectedApplianceId(appliance.id);
    setActiveTab('troubleshooter');
    onClose();
  };

  const handleStartRepairVsReplace = () => {
    setSelectedApplianceId(appliance.id);
    setActiveTab('repair-vs-replace');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsConfirmingDelete(false);
          onClose();
        }}
        title={appliance.name}
        description={`${appliance.brand} • Model ${appliance.modelNumber}`}
        maxWidth="2xl"
        footer={
          <div className="w-full flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[#B91C1C] hover:bg-[#FDF2F2]"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setIsConfirmingDelete(true)}
            >
              Delete Appliance
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => onEdit(appliance)}
              >
                Edit Specs
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-left">
          {/* Deletion Warning Banner */}
          {isConfirmingDelete && (
            <div className="p-4 rounded-lg bg-[#FDF2F2] border border-[#F8C8C8] space-y-3">
              <div className="flex items-center gap-2 text-[#B91C1C] font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Confirm Permanent Removal of {appliance.name}</span>
              </div>
              <p className="text-xs text-[#7F1D1D] leading-relaxed">
                Deleting this appliance will deliberately remove all associated records from local storage:
              </p>
              <ul className="text-xs text-[#7F1D1D] space-y-1 list-disc list-inside">
                <li><strong>{cascadeStats.repairsCount}</strong> repair/service history records</li>
                <li><strong>{cascadeStats.sessionsCount}</strong> preliminary troubleshooting sessions</li>
                <li><strong>{cascadeStats.quotesCount}</strong> contractor estimates</li>
                <li><strong>{cascadeStats.evaluationsCount}</strong> repair vs. replace actuarial evaluations</li>
              </ul>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteProceed}
                >
                  Confirm Delete & Erase Records
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Status & Lifespan Banner */}
          <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DADBD3] flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge status={appliance.conditionStatus} />
                <Badge status={appliance.warrantyStatus} />
                {hasRecurringIssues && (
                  <Badge variant="recurring">
                    Recurring Symptom Flagged
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#73766F]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{appliance.locationRoom}</span>
              </div>
            </div>

            {/* Lifespan bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#252923]">
                  Lifespan Progression ({ageFormatted} of {appliance.expectedLifespanYears} yr estimate)
                </span>
                <span className="font-mono text-[#73766F]">
                  {lifespanPercentage}% elapsed ({remainingYears} yrs left)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EAE9E2] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    lifespanPercentage > 80 ? 'bg-[#B45309]' : 'bg-[#285B45]'
                  }`}
                  style={{ width: `${lifespanPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Specs vs Repairs vs Troubleshooting Sessions */}
          <div className="flex items-center gap-2 border-b border-[#DADBD3] pb-1">
            <button
              type="button"
              onClick={() => setActiveTabLocal('specs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors cursor-pointer ${
                activeTab === 'specs'
                  ? 'bg-white border-b-2 border-[#285B45] text-[#252923]'
                  : 'text-[#73766F] hover:text-[#252923]'
              }`}
            >
              Hardware Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTabLocal('repairs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors cursor-pointer ${
                activeTab === 'repairs'
                  ? 'bg-white border-b-2 border-[#285B45] text-[#252923]'
                  : 'text-[#73766F] hover:text-[#252923]'
              }`}
            >
              Repair History ({repairs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabLocal('sessions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-white border-b-2 border-[#285B45] text-[#252923]'
                  : 'text-[#73766F] hover:text-[#252923]'
              }`}
            >
              Troubleshooting Sessions ({sessions.length})
            </button>
          </div>

          {/* Tab 1: Specs */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3]">
                  <span className="block text-[11px] text-[#73766F]">Brand</span>
                  <span className="font-semibold text-xs text-[#252923]">{appliance.brand}</span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3]">
                  <span className="block text-[11px] text-[#73766F]">Model Number</span>
                  <span className="font-mono text-xs font-semibold text-[#252923]">{appliance.modelNumber}</span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3]">
                  <span className="block text-[11px] text-[#73766F]">Serial Number</span>
                  <span className="font-mono text-xs text-[#252923]">{appliance.serialNumber || '—'}</span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3]">
                  <span className="block text-[11px] text-[#73766F]">Purchase Date</span>
                  <span className="font-mono text-xs text-[#252923]">{appliance.purchaseDate || 'Unknown'}</span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3]">
                  <span className="block text-[11px] text-[#73766F]">Purchase Price</span>
                  <span className="font-mono text-xs font-semibold text-[#252923]">
                    {appliance.purchasePrice !== null && appliance.purchasePrice !== undefined 
                      ? `$${appliance.purchasePrice.toLocaleString()}` 
                      : 'Unknown'}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3]">
                  <span className="block text-[11px] text-[#73766F]">Historical Repairs</span>
                  <span className="font-mono text-xs font-semibold text-[#252923]">${totalRepairsCost.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3]">
                  <span className="block text-[11px] text-[#73766F]">Warranty Expiration</span>
                  <span className="font-mono text-xs text-[#252923]">{appliance.warrantyExpiryDate || 'Not specified'}</span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3]">
                  <span className="block text-[11px] text-[#73766F]">Installed By</span>
                  <span className="text-xs text-[#252923] truncate">{appliance.installedBy || 'Owner'}</span>
                </div>
              </div>

              {appliance.notes && (
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3] text-xs">
                  <span className="font-semibold text-[#73766F] block mb-1">Maintenance Observations:</span>
                  <p className="text-[#252923] leading-relaxed">{appliance.notes}</p>
                </div>
              )}

              {/* Action triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartTroubleshooting}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#DADBD3] hover:border-[#285B45] hover:bg-[#FAF9F5] transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-[#EBF2EE] text-[#285B45] flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#252923]">Troubleshoot</span>
                    <span className="text-[11px] text-[#73766F]">Run guided checks</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleStartRepairVsReplace}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#DADBD3] hover:border-[#285B45] hover:bg-[#FAF9F5] transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-[#EAE9E2] text-[#252923] flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#252923]">Repair vs Replace</span>
                    <span className="text-[11px] text-[#73766F]">Evaluate 50% rule</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTechPacketOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#DADBD3] hover:border-[#285B45] hover:bg-[#FAF9F5] transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-[#FAF9F5] text-[#252923] flex items-center justify-center shrink-0 border border-[#DADBD3]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#252923]">Technician Packet</span>
                    <span className="text-[11px] text-[#73766F]">Generate visit notes</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Repairs */}
          {activeTab === 'repairs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-[#73766F]">
                  Service records linked to {appliance.name}
                </span>
                {onOpenAddRepairForAppliance && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddRepairForAppliance(appliance.id);
                    }}
                    className="text-xs font-semibold text-[#285B45] hover:underline"
                  >
                    + Log New Service Event
                  </button>
                )}
              </div>

              {repairs.length === 0 ? (
                <p className="text-xs text-[#73766F] p-5 text-center border border-dashed border-[#DADBD3] rounded-md bg-[#FAF9F5]">
                  No recorded repairs or service events for this unit yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {repairs.map(repair => (
                    <div
                      key={repair.id}
                      className="p-3.5 rounded-md border border-[#DADBD3] bg-white flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-[#252923] block">
                            {repair.title}
                          </span>
                          <span className="text-[11px] text-[#73766F] font-mono">
                            {repair.date} • {repair.serviceCompany || repair.serviceType.toUpperCase()}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#252923]">
                          ${repair.cost}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="text-[#4A4F44]">
                          <strong className="text-[#73766F]">Symptom: </strong>
                          {repair.userReportedSymptom || (repair as any).symptom}
                        </p>
                        {repair.technicianDiagnosis && (
                          <p className="text-[#4A4F44]">
                            <strong className="text-[#73766F]">Diagnosis: </strong>
                            {repair.technicianDiagnosis}
                          </p>
                        )}
                      </div>

                      {repair.partsReplaced.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {repair.partsReplaced.map((part, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#DADBD3] text-[#4A4F44] font-mono">
                              {part}
                            </span>
                          ))}
                        </div>
                      )}

                      {repair.recurringIssueFlag && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#B91C1C] font-medium bg-[#FDF2F2] p-1.5 rounded border border-[#F8C8C8]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{repair.recurrenceReason || 'Recurring symptom detected.'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Troubleshooting Sessions */}
          {activeTab === 'sessions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-[#73766F]">
                  Saved preliminary troubleshooting runs for {appliance.name}
                </span>
                <button
                  type="button"
                  onClick={handleStartTroubleshooting}
                  className="text-xs font-semibold text-[#285B45] hover:underline"
                >
                  + New Troubleshooting Run
                </button>
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-[#73766F] p-5 text-center border border-dashed border-[#DADBD3] rounded-md bg-[#FAF9F5]">
                  No preliminary troubleshooting sessions recorded for this unit yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map(sess => (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-md border border-[#DADBD3] bg-white text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-[#252923] block">
                            {sess.symptomCategory}
                          </span>
                          <span className="text-[11px] text-[#73766F] font-mono">
                            {sess.createdAt.split('T')[0]} • Started: {sess.startedWhen}
                          </span>
                        </div>
                        <Badge variant={sess.hazardDetected ? 'urgent' : 'neutral'} size="sm">
                          {sess.hazardDetected ? 'Hazard Alert' : 'Standard Check'}
                        </Badge>
                      </div>

                      <p className="text-[#4A4F44]">
                        <strong className="text-[#73766F]">Reported: </strong>
                        {sess.reportedSymptom}
                      </p>

                      {sess.errorCode && (
                        <p className="text-[#73766F]">
                          Error Code: <strong className="font-mono text-[#252923]">{sess.errorCode}</strong>
                        </p>
                      )}

                      <div className="p-2 rounded bg-[#FAF9F5] border border-[#DADBD3] text-[#252923]">
                        <strong>Outcome: </strong> {sess.outcomeSummary}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Technician Visit Summary Modal */}
      <TechnicianSummaryModal
        isOpen={isTechPacketOpen}
        onClose={() => setIsTechPacketOpen(false)}
        appliance={appliance}
        currentSymptom={repairs[0]?.userReportedSymptom || 'Routine service / diagnostic review'}
        errorCode="None"
        startedWhen="Past service record review"
        relatedRepairs={repairs}
        recurringExplanation={hasRecurringIssues ? 'Recurring symptom pattern detected in unit history' : undefined}
        suggestedQuestions={[
          'What is the root cause behind any repeat symptoms?',
          'Is there an upgraded OEM revision bulletin for this model?'
        ]}
      />
    </>
  );
};
