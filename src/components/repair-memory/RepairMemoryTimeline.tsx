import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Plus, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2, 
  Edit3,
  Link as LinkIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RepairEvent } from '../../types';
import { AddRepairEventModal } from './AddRepairEventModal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';

export const RepairMemoryTimeline: React.FC = () => {
  const { repairEvents, appliances, deleteRepairEvent } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplianceId, setSelectedApplianceId] = useState<string>('all');
  const [onlyRecurring, setOnlyRecurring] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [highlightedRepairId, setHighlightedRepairId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairEvent | null>(null);

  const totalSpent = repairEvents.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
  const recurringCount = repairEvents.filter(r => r.recurringIssueFlag).length;

  const filteredEvents = useMemo(() => {
    return repairEvents
      .filter(r => {
        const app = appliances.find(a => a.id === r.applianceId);
        const appName = app ? app.name.toLowerCase() : '';
        const search = searchQuery.toLowerCase();

        const symptom = r.userReportedSymptom || (r as any).symptom || '';
        const diag = r.technicianDiagnosis || (r as any).rootCause || '';
        const perf = r.repairPerformed || '';

        const matchesQuery =
          r.title.toLowerCase().includes(search) ||
          symptom.toLowerCase().includes(search) ||
          diag.toLowerCase().includes(search) ||
          perf.toLowerCase().includes(search) ||
          (r.serviceCompany && r.serviceCompany.toLowerCase().includes(search)) ||
          r.partsReplaced.some(p => p.toLowerCase().includes(search)) ||
          appName.includes(search);

        const matchesApp = selectedApplianceId === 'all' || r.applianceId === selectedApplianceId;
        const matchesRecurring = !onlyRecurring || r.recurringIssueFlag;
        const matchesType = selectedType === 'all' || r.serviceType === selectedType;

        return matchesQuery && matchesApp && matchesRecurring && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [repairEvents, appliances, searchQuery, selectedApplianceId, onlyRecurring, selectedType]);

  const handleEdit = (repair: RepairEvent) => {
    setEditingRepair(repair);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the service record for "${title}"? This cannot be undone.`)) {
      deleteRepairEvent(id);
    }
  };

  const scrollToRepair = (targetId: string) => {
    setHighlightedRepairId(targetId);
    const element = document.getElementById(`repair-entry-${targetId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & Insight */}
      <div className="p-5 bg-white rounded-lg border border-[#DADBD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#285B45]" />
            <h2 className="text-base font-bold text-[#252923]">
              Repair Memory Chronology
            </h2>
          </div>
          <p className="text-xs text-[#73766F] mt-1 leading-relaxed">
            Verified service history with explicit separation between user-reported symptoms, technician diagnoses, and replaced OEM components.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-[#73766F] block">Total Incurred Cost</span>
            <span className="font-mono text-base font-bold text-[#252923]">${totalSpent.toLocaleString()}</span>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingRepair(null);
              setIsModalOpen(true);
            }}
          >
            Log Repair Event
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#73766F]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search symptoms, parts, company or technician..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#DADBD3] rounded-md text-[#252923] placeholder-[#8F928B] focus:border-[#285B45] focus:ring-1 focus:ring-[#285B45] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Appliance Filter */}
          <select
            value={selectedApplianceId}
            onChange={e => setSelectedApplianceId(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#252923] bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
            aria-label="Filter by appliance"
          >
            <option value="all">All Appliances ({repairEvents.length})</option>
            {appliances.map(app => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#252923] bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
            aria-label="Filter by service type"
          >
            <option value="all">All Service Types</option>
            <option value="professional">Professional</option>
            <option value="diy">DIY Self-Cleared</option>
            <option value="warranty_claim">Warranty Claim</option>
          </select>

          {/* Recurring Toggle Button */}
          <button
            type="button"
            onClick={() => setOnlyRecurring(!onlyRecurring)}
            className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              onlyRecurring
                ? 'bg-[#FDF2F2] text-[#B91C1C] border-[#F8C8C8]'
                : 'bg-white text-[#73766F] border-[#DADBD3] hover:text-[#252923]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Recurring Only ({recurringCount})</span>
          </button>
        </div>
      </div>

      {/* Timeline List */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<History className="w-6 h-6" />}
          title="No service records found"
          description="Try broadening your search or log a maintenance visit to build your appliance repair memory."
          actionLabel="Log Repair Event"
          onAction={() => {
            setSearchQuery('');
            setSelectedApplianceId('all');
            setOnlyRecurring(false);
            setEditingRepair(null);
            setIsModalOpen(true);
          }}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(repair => {
            const appliance = appliances.find(a => a.id === repair.applianceId);
            const isHighlighted = highlightedRepairId === repair.id;
            const symptom = repair.userReportedSymptom || (repair as any).symptom;
            const diagnosis = repair.technicianDiagnosis || (repair as any).rootCause;

            return (
              <div
                id={`repair-entry-${repair.id}`}
                key={repair.id}
                className={`p-5 rounded-lg border bg-white shadow-xs text-left space-y-3 transition-all ${
                  isHighlighted ? 'ring-2 ring-[#285B45] border-[#285B45]' : 'border-[#DADBD3]'
                }`}
              >
                {/* Header: Date, Appliance & Cost */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-[#F5F4EF]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#DADBD3] text-[#252923]">
                        {repair.date}
                      </span>
                      <span className="text-xs font-semibold text-[#285B45]">
                        {appliance?.name || 'Unknown Unit'}
                      </span>
                      {appliance && (
                        <span className="text-[11px] text-[#73766F] font-mono">
                          ({appliance.brand} {appliance.modelNumber})
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#252923] mt-1.5">
                      {repair.title}
                    </h3>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1">
                    <span className="font-mono text-lg font-bold text-[#252923]">
                      ${repair.cost}
                    </span>
                    <Badge variant={repair.serviceType === 'diy' ? 'diy' : 'neutral'} size="sm">
                      {repair.serviceType === 'diy' ? 'DIY Self-Cleared' : repair.serviceCompany || 'Field Service'}
                    </Badge>
                  </div>
                </div>

                {/* Recurring Alert Notice */}
                {repair.recurringIssueFlag && (
                  <div className="p-3.5 rounded-md bg-[#FDF2F2] border border-[#F8C8C8] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#B91C1C] font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Recurring Symptom Pattern Logged</span>
                      </div>
                      {repair.relatedRepairIds && repair.relatedRepairIds.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#7F1D1D]">
                          <LinkIcon className="w-3 h-3" />
                          <span>Connected to {repair.relatedRepairIds.length} related service record(s)</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[#7F1D1D] leading-relaxed">
                      {repair.recurrenceReason || 'Similar symptoms were previously documented on this appliance. In repeat scenarios, repeated component swaps frequently treat symptoms without resolving the primary driver (e.g. ambient air ingress or static line pressure).'}
                    </p>

                    {/* Direct links to related prior repairs */}
                    {repair.relatedRepairIds && repair.relatedRepairIds.length > 0 && (
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#7F1D1D]">Open Related Record:</span>
                        {repair.relatedRepairIds.map(relId => {
                          const relRepair = repairEvents.find(r => r.id === relId);
                          return (
                            <button
                              key={relId}
                              type="button"
                              onClick={() => scrollToRepair(relId)}
                              className="px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-[#F8C8C8] text-[#B91C1C] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                            >
                              {relRepair ? `${relRepair.date} (${relRepair.title.slice(0, 24)}...)` : relId}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Explicitly distinguished info cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#73766F] block">
                      User-Reported Symptom
                    </span>
                    <p className="text-[#252923] leading-relaxed font-medium">
                      {symptom}
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#73766F] block">
                      Technician-Recorded Diagnosis
                    </span>
                    <p className="text-[#252923] leading-relaxed">
                      {diagnosis || 'No formal written diagnosis recorded on service ticket.'}
                    </p>
                  </div>
                </div>

                {/* Repair Performed & Parts Replaced */}
                {(repair.repairPerformed || repair.partsReplaced.length > 0) && (
                  <div className="p-3 bg-[#FAF9F5] rounded border border-[#DADBD3] text-xs space-y-2">
                    {repair.repairPerformed && (
                      <div>
                        <strong className="text-[#73766F] block text-[11px] uppercase tracking-wider mb-0.5">
                          Work Performed:
                        </strong>
                        <p className="text-[#252923]">{repair.repairPerformed}</p>
                      </div>
                    )}

                    {repair.partsReplaced.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#DADBD3]/60">
                        <span className="text-[11px] font-semibold text-[#73766F]">Replaced Parts:</span>
                        {repair.partsReplaced.map((part, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 rounded font-mono text-xs bg-white border border-[#DADBD3] text-[#252923]"
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Financial breakdown & follow-up */}
                <div className="flex flex-wrap items-center justify-between text-xs text-[#73766F] pt-1">
                  <div className="flex items-center gap-3">
                    {repair.laborCost !== undefined && (
                      <span>Labor: <strong className="font-mono text-[#252923]">${repair.laborCost}</strong></span>
                    )}
                    {repair.partsCost !== undefined && (
                      <span>Parts: <strong className="font-mono text-[#252923]">${repair.partsCost}</strong></span>
                    )}
                    {repair.technicianName && (
                      <span>Tech: <strong className="text-[#252923]">{repair.technicianName}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {repair.repairWarrantyMonths ? (
                      <span className="flex items-center gap-1 text-[#285B45] font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {repair.repairWarrantyMonths}-Month Repair Warranty
                      </span>
                    ) : null}
                  </div>
                </div>

                {repair.followUpNotes && (
                  <p className="text-xs text-[#4A4F44] italic bg-[#FAF9F5] p-2.5 rounded border border-[#DADBD3]">
                    &quot;{repair.followUpNotes}&quot;
                  </p>
                )}

                {/* Actions Footer */}
                <div className="pt-2 border-t border-[#F5F4EF] flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleEdit(repair)}
                    className="p-1.5 text-[#73766F] hover:text-[#252923] hover:bg-[#FAF9F5] rounded transition-colors"
                    title="Edit repair details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(repair.id, repair.title)}
                    className="p-1.5 text-[#73766F] hover:text-[#B91C1C] hover:bg-[#FDF2F2] rounded transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Repair Modal */}
      <AddRepairEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRepair(null);
        }}
        initialData={editingRepair}
      />
    </div>
  );
};
