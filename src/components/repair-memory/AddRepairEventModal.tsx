import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { RepairEvent } from '../../types';
import { useApp } from '../../context/AppContext';

interface AddRepairEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialApplianceId?: string;
  initialData?: RepairEvent | null;
}

export const AddRepairEventModal: React.FC<AddRepairEventModalProps> = ({
  isOpen,
  onClose,
  initialApplianceId,
  initialData,
}) => {
  const { appliances, addRepairEvent, updateRepairEvent } = useApp();

  const [formData, setFormData] = useState({
    applianceId: initialApplianceId || appliances[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    title: '',
    userReportedSymptom: '',
    technicianDiagnosis: '',
    possibleExplanation: '',
    repairPerformed: '',
    serviceType: 'professional' as 'professional' | 'diy' | 'warranty_claim',
    serviceCompany: '',
    technicianName: '',
    laborCost: '',
    partsCost: '',
    cost: '',
    partsReplacedText: '',
    repairWarrantyMonths: '6',
    status: 'completed' as 'completed' | 'in_progress' | 'scheduled',
    followUpNotes: '',
    recurringIssueFlag: false,
    recurrenceReason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        applianceId: initialData.applianceId,
        date: initialData.date,
        title: initialData.title,
        userReportedSymptom: initialData.userReportedSymptom || (initialData as any).symptom || '',
        technicianDiagnosis: initialData.technicianDiagnosis || (initialData as any).rootCause || '',
        possibleExplanation: initialData.possibleExplanation || '',
        repairPerformed: initialData.repairPerformed || initialData.title,
        serviceType: initialData.serviceType,
        serviceCompany: initialData.serviceCompany || '',
        technicianName: initialData.technicianName || '',
        laborCost: initialData.laborCost ? String(initialData.laborCost) : '',
        partsCost: initialData.partsCost ? String(initialData.partsCost) : '',
        cost: String(initialData.cost),
        partsReplacedText: initialData.partsReplaced.join(', '),
        repairWarrantyMonths: String(initialData.repairWarrantyMonths || 0),
        status: initialData.status,
        followUpNotes: initialData.followUpNotes || (initialData as any).notes || '',
        recurringIssueFlag: !!initialData.recurringIssueFlag,
        recurrenceReason: initialData.recurrenceReason || '',
      });
    } else {
      setFormData({
        applianceId: initialApplianceId || appliances[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        title: '',
        userReportedSymptom: '',
        technicianDiagnosis: '',
        possibleExplanation: '',
        repairPerformed: '',
        serviceType: 'professional',
        serviceCompany: '',
        technicianName: '',
        laborCost: '',
        partsCost: '',
        cost: '',
        partsReplacedText: '',
        repairWarrantyMonths: '6',
        status: 'completed',
        followUpNotes: '',
        recurringIssueFlag: false,
        recurrenceReason: '',
      });
    }
    setErrors({});
  }, [initialData, initialApplianceId, isOpen, appliances]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.applianceId) errs.applianceId = 'Select an appliance';
    if (!formData.title.trim()) errs.title = 'Service title is required';
    if (!formData.userReportedSymptom.trim()) errs.userReportedSymptom = 'Describe the symptom or failure condition';
    if (!formData.date) errs.date = 'Date is required';
    if (formData.cost === '' || isNaN(Number(formData.cost)) || Number(formData.cost) < 0) {
      errs.cost = 'Enter a valid cost ($0 for self-cleared)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCostAutoSum = (laborStr: string, partsStr: string) => {
    const labor = Number(laborStr) || 0;
    const parts = Number(partsStr) || 0;
    if (labor > 0 || parts > 0) {
      setFormData(prev => ({
        ...prev,
        laborCost: laborStr,
        partsCost: partsStr,
        cost: String(labor + parts)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        laborCost: laborStr,
        partsCost: partsStr
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parts = formData.partsReplacedText
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const eventPayload: Omit<RepairEvent, 'id'> = {
      applianceId: formData.applianceId,
      date: formData.date,
      title: formData.title.trim(),
      userReportedSymptom: formData.userReportedSymptom.trim(),
      technicianDiagnosis: formData.technicianDiagnosis.trim() || undefined,
      possibleExplanation: formData.possibleExplanation.trim() || undefined,
      repairPerformed: formData.repairPerformed.trim() || formData.title.trim(),
      partsReplaced: parts,
      serviceType: formData.serviceType,
      serviceCompany: formData.serviceCompany.trim() || undefined,
      technicianName: formData.technicianName.trim() || undefined,
      laborCost: formData.laborCost ? Number(formData.laborCost) : undefined,
      partsCost: formData.partsCost ? Number(formData.partsCost) : undefined,
      cost: Number(formData.cost),
      repairWarrantyMonths: Number(formData.repairWarrantyMonths) || 0,
      status: formData.status,
      followUpNotes: formData.followUpNotes.trim() || undefined,
      recurringIssueFlag: formData.recurringIssueFlag,
      recurrenceReason: formData.recurringIssueFlag ? formData.recurrenceReason.trim() || 'Identified repeat symptom pattern' : undefined,
    };

    if (initialData) {
      updateRepairEvent(initialData.id, eventPayload);
    } else {
      addRepairEvent(eventPayload);
    }

    onClose();
  };

  const applianceOptions = appliances.map(a => ({
    value: a.id,
    label: `${a.name} (${a.brand} ${a.modelNumber})`,
  }));

  const serviceOptions = [
    { value: 'professional', label: 'Contractor / Professional Field Service' },
    { value: 'diy', label: 'Owner / DIY Maintenance' },
    { value: 'warranty_claim', label: 'Authorized Manufacturer Warranty Claim' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Service Record' : 'Record Service Event into Repair Memory'}
      description="Explicitly separate user-reported symptoms, technician diagnoses, and replaced parts."
      maxWidth="xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit}>
            {initialData ? 'Update Record' : 'Save to Repair Memory'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Select
          label="Appliance"
          options={applianceOptions}
          value={formData.applianceId}
          onChange={e => setFormData({ ...formData, applianceId: e.target.value })}
          error={errors.applianceId}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Service Title"
            placeholder="e.g. Ice Room Defrost Heater Replacement"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            required
          />
          <Input
            type="date"
            label="Service Date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            error={errors.date}
            required
          />
        </div>

        {/* Explicitly distinguished info block */}
        <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DADBD3] space-y-3">
          <Input
            label="User-Reported Symptom (What you noticed)"
            placeholder="e.g. Ice maker frosted solid; loud grinding noise when dispensing"
            value={formData.userReportedSymptom}
            onChange={e => setFormData({ ...formData, userReportedSymptom: e.target.value })}
            error={errors.userReportedSymptom}
            required
            hint="Your direct observation prior to professional inspection"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Technician Diagnosis (Confirmed on invoice)"
              placeholder="e.g. Perimeter cabinet gasket seam leak causing frost"
              value={formData.technicianDiagnosis}
              onChange={e => setFormData({ ...formData, technicianDiagnosis: e.target.value })}
              hint="Professional diagnosis written on work order"
            />
            <Input
              label="Repair Performed (Work completed)"
              placeholder="e.g. Sealed seam with RTV silicone & replaced auger"
              value={formData.repairPerformed}
              onChange={e => setFormData({ ...formData, repairPerformed: e.target.value })}
            />
          </div>
        </div>

        {/* Pricing breakdown: Labor, Parts, Total */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            type="number"
            label="Labor Cost"
            prefixText="$"
            placeholder="0.00"
            value={formData.laborCost}
            onChange={e => handleCostAutoSum(e.target.value, formData.partsCost)}
          />
          <Input
            type="number"
            label="Parts Cost"
            prefixText="$"
            placeholder="0.00"
            value={formData.partsCost}
            onChange={e => handleCostAutoSum(formData.laborCost, e.target.value)}
          />
          <Input
            type="number"
            label="Total Paid"
            prefixText="$"
            placeholder="0.00"
            value={formData.cost}
            onChange={e => setFormData({ ...formData, cost: e.target.value })}
            error={errors.cost}
            required
            hint="$0 for self-cleared DIY"
          />
        </div>

        {/* Provider, Tech, Warranty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Service Provider Type"
            options={serviceOptions}
            value={formData.serviceType}
            onChange={e => setFormData({ ...formData, serviceType: e.target.value as any })}
          />
          <Input
            label="Service Company"
            placeholder="e.g. Apex Appliance Care"
            value={formData.serviceCompany}
            onChange={e => setFormData({ ...formData, serviceCompany: e.target.value })}
          />
          <Input
            type="number"
            label="Repair Warranty"
            suffixText="mo"
            value={formData.repairWarrantyMonths}
            onChange={e => setFormData({ ...formData, repairWarrantyMonths: e.target.value })}
            hint="Warranty on this work"
          />
        </div>

        <Input
          label="Parts Replaced (comma separated with OEM part numbers)"
          placeholder="e.g. DA97-15217D Ice Maker Kit, Drain Clip"
          value={formData.partsReplacedText}
          onChange={e => setFormData({ ...formData, partsReplacedText: e.target.value })}
          hint="Include part numbers for exact tracking"
        />

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="repair-followup" className="text-xs font-semibold text-[#252923]">
            Follow-Up Observations & Notes
          </label>
          <textarea
            id="repair-followup"
            rows={2}
            className="w-full px-3 py-2 text-sm text-[#252923] placeholder-[#8F928B] bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] focus:ring-1 focus:ring-[#285B45] outline-none"
            placeholder="Technician recommendations, operating advice, or maintenance schedule..."
            value={formData.followUpNotes}
            onChange={e => setFormData({ ...formData, followUpNotes: e.target.value })}
          />
        </div>

        {/* Recurring flag */}
        <div className="p-3 bg-[#FAF9F5] border border-[#DADBD3] rounded-md space-y-2">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="recurring-flag"
              checked={formData.recurringIssueFlag}
              onChange={e => setFormData({ ...formData, recurringIssueFlag: e.target.checked })}
              className="w-4 h-4 text-[#B91C1C] rounded border-[#DADBD3] focus:ring-[#B91C1C] cursor-pointer"
            />
            <label htmlFor="recurring-flag" className="text-xs font-semibold text-[#252923] cursor-pointer select-none">
              Flag as Recurring Symptom Pattern
            </label>
          </div>
          {formData.recurringIssueFlag && (
            <input
              type="text"
              placeholder="Why is this recurring? (e.g. Repeat coil frost on French Door cabinet)"
              value={formData.recurrenceReason}
              onChange={e => setFormData({ ...formData, recurrenceReason: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#DADBD3] rounded-md text-[#252923] focus:border-[#285B45] outline-none"
            />
          )}
        </div>
      </form>
    </Modal>
  );
};
