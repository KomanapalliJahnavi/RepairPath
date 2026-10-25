import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { RepairQuote, QuotePartItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { calculateQuoteTotal, parseCurrencyInput } from '../../utils/quoteCalculations';

interface AddQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialApplianceId?: string;
  initialData?: RepairQuote | null;
}

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({
  isOpen,
  onClose,
  initialApplianceId,
  initialData,
}) => {
  const { appliances, addQuote, updateQuote } = useApp();

  const [formData, setFormData] = useState({
    applianceId: initialApplianceId || appliances[0]?.id || '',
    serviceProvider: '',
    contactInfo: '',
    quoteDate: new Date().toISOString().split('T')[0],
    laborCost: '180',
    taxes: '0',
    additionalFees: '0',
    discountAmount: '0',
    warrantyLaborDays: '90',
    warrantyPartsMonths: '12',
    estimatedTurnaroundDays: '2',
    notes: '',
  });

  const [parts, setParts] = useState<QuotePartItem[]>([
    { id: 'p-1', name: '', cost: 0, isOem: true },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        applianceId: initialData.applianceId,
        serviceProvider: initialData.serviceProvider,
        contactInfo: initialData.contactInfo || '',
        quoteDate: initialData.quoteDate,
        laborCost: String(initialData.laborCost),
        taxes: String(initialData.taxes || 0),
        additionalFees: String(initialData.additionalFees || 0),
        discountAmount: String(initialData.discountAmount || 0),
        warrantyLaborDays: String(initialData.warrantyLaborDays || 30),
        warrantyPartsMonths: String(initialData.warrantyPartsMonths || 3),
        estimatedTurnaroundDays: String(initialData.estimatedTurnaroundDays || 1),
        notes: initialData.notes || '',
      });
      setParts(
        initialData.parts.length > 0 
          ? initialData.parts 
          : [{ id: `p-${Date.now()}`, name: '', cost: 0, isOem: true }]
      );
    } else {
      setFormData({
        applianceId: initialApplianceId || appliances[0]?.id || '',
        serviceProvider: '',
        contactInfo: '',
        quoteDate: new Date().toISOString().split('T')[0],
        laborCost: '',
        taxes: '0',
        additionalFees: '0',
        discountAmount: '0',
        warrantyLaborDays: '90',
        warrantyPartsMonths: '12',
        estimatedTurnaroundDays: '2',
        notes: '',
      });
      setParts([{ id: `p-${Date.now()}`, name: '', cost: 0, isOem: true }]);
    }
    setErrors({});
  }, [initialData, initialApplianceId, isOpen, appliances]);

  // Live calculation
  const calcResult = calculateQuoteTotal({
    laborCost: formData.laborCost,
    parts,
    taxes: formData.taxes,
    additionalFees: formData.additionalFees,
    discountAmount: formData.discountAmount,
  });

  const addPartRow = () => {
    setParts([...parts, { id: `p-${Date.now()}`, name: '', cost: 0, isOem: true }]);
  };

  const removePartRow = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const updatePartRow = (id: string, field: keyof QuotePartItem, value: any) => {
    setParts(parts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.applianceId) errs.applianceId = 'Select an appliance';
    if (!formData.serviceProvider.trim()) errs.serviceProvider = 'Technician or shop name is required';
    if (formData.laborCost === '' || isNaN(Number(formData.laborCost)) || Number(formData.laborCost) < 0) {
      errs.laborCost = 'Enter a valid non-negative labour cost';
    }
    if (formData.taxes !== '' && (isNaN(Number(formData.taxes)) || Number(formData.taxes) < 0)) {
      errs.taxes = 'Taxes must be zero or positive';
    }
    if (formData.additionalFees !== '' && (isNaN(Number(formData.additionalFees)) || Number(formData.additionalFees) < 0)) {
      errs.additionalFees = 'Additional fees must be zero or positive';
    }
    if (formData.discountAmount !== '' && (isNaN(Number(formData.discountAmount)) || Number(formData.discountAmount) < 0)) {
      errs.discountAmount = 'Discount cannot be negative';
    }
    if (!calcResult.isValid) {
      Object.assign(errs, calcResult.errors);
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const validParts = parts.filter(p => p.name.trim().length > 0).map(p => ({
      id: p.id,
      name: p.name.trim(),
      cost: parseCurrencyInput(p.cost),
      isOem: !!p.isOem,
    }));

    const quotePayload: Omit<RepairQuote, 'id'> = {
      applianceId: formData.applianceId,
      serviceProvider: formData.serviceProvider.trim(),
      contactInfo: formData.contactInfo.trim() || undefined,
      quoteDate: formData.quoteDate,
      laborCost: parseCurrencyInput(formData.laborCost),
      partsCost: calcResult.partsSubtotal,
      parts: validParts,
      taxes: parseCurrencyInput(formData.taxes),
      additionalFees: parseCurrencyInput(formData.additionalFees),
      discountAmount: parseCurrencyInput(formData.discountAmount),
      calculatedTotal: calcResult.calculatedTotal,
      warrantyLaborDays: Number(formData.warrantyLaborDays) || 30,
      warrantyPartsMonths: Number(formData.warrantyPartsMonths) || 3,
      estimatedTurnaroundDays: Number(formData.estimatedTurnaroundDays) || 1,
      notes: formData.notes.trim() || undefined,
      sourceType: 'user_entered',
    };

    if (initialData) {
      updateQuote(initialData.id, quotePayload);
    } else {
      addQuote(quotePayload);
    }

    onClose();
  };

  const applianceOptions = appliances.map(a => ({
    value: a.id,
    label: `${a.name} (${a.brand} ${a.modelNumber})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Contractor Quotation' : 'Record Repair Quotation'}
      description="Enter itemised labour, parts, taxes, and fees. Total is computed using Total = Labour + Parts + Taxes + Additional Fees − Discounts."
      maxWidth="xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit}>
            {initialData ? 'Save Changes' : 'Save Quotation to Comparison'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Select
          label="Appliance Being Quoted"
          options={applianceOptions}
          value={formData.applianceId}
          onChange={e => setFormData({ ...formData, applianceId: e.target.value })}
          error={errors.applianceId}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Technician or Service Shop Name"
            placeholder="e.g. Apex Home Appliance Service"
            value={formData.serviceProvider}
            onChange={e => setFormData({ ...formData, serviceProvider: e.target.value })}
            error={errors.serviceProvider}
            required
            hint="Entered by user for manual comparison"
          />
          <Input
            type="date"
            label="Quotation Date"
            value={formData.quoteDate}
            onChange={e => setFormData({ ...formData, quoteDate: e.target.value })}
            required
          />
        </div>

        <Input
          label="Contact Information (Phone / Email)"
          placeholder="e.g. (555) 234-8900 • dispatch@apex.example"
          value={formData.contactInfo}
          onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
        />

        {/* Itemized Parts Section */}
        <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DADBD3] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#73766F]">
              Itemised Replacement Parts ({parts.length})
            </span>
            <button
              type="button"
              onClick={addPartRow}
              className="text-xs font-semibold text-[#285B45] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Part</span>
            </button>
          </div>

          <div className="space-y-2">
            {parts.map(part => (
              <div key={part.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Part description / OEM part number"
                  value={part.name}
                  onChange={e => updatePartRow(part.id, 'name', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#DADBD3] rounded-md text-[#252923] focus:border-[#285B45] outline-none"
                />
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="$ Cost"
                    value={part.cost || ''}
                    onChange={e => updatePartRow(part.id, 'cost', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#DADBD3] rounded-md text-[#252923] font-mono focus:border-[#285B45] outline-none"
                  />
                </div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-[#252923] cursor-pointer select-none whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={part.isOem}
                    onChange={e => updatePartRow(part.id, 'isOem', e.target.checked)}
                    className="rounded text-[#285B45]"
                  />
                  <span>OEM</span>
                </label>
                {parts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePartRow(part.id)}
                    className="p-1.5 text-[#73766F] hover:text-[#B91C1C]"
                    aria-label="Remove part"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="text-right text-xs text-[#73766F] pt-1">
            Parts Subtotal: <strong className="font-mono text-[#252923]">${calcResult.partsSubtotal.toFixed(2)}</strong>
          </div>
        </div>

        {/* Cost Formula Breakdown Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            type="number"
            label="Labour Cost"
            prefixText="$"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={formData.laborCost}
            onChange={e => setFormData({ ...formData, laborCost: e.target.value })}
            error={errors.laborCost}
            required
          />

          <Input
            type="number"
            label="Taxes"
            prefixText="$"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={formData.taxes}
            onChange={e => setFormData({ ...formData, taxes: e.target.value })}
            error={errors.taxes}
          />

          <Input
            type="number"
            label="Additional Fees"
            prefixText="$"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={formData.additionalFees}
            onChange={e => setFormData({ ...formData, additionalFees: e.target.value })}
            error={errors.additionalFees}
            hint="Trip, disposal, or diagnostic fee"
          />

          <Input
            type="number"
            label="Discounts"
            prefixText="-$"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={formData.discountAmount}
            onChange={e => setFormData({ ...formData, discountAmount: e.target.value })}
            error={errors.discountAmount}
            hint="Coupons or fee waivers"
          />
        </div>

        {/* Dynamic Calculation Formula Display */}
        <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DADBD3] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#73766F]">
            <span>Calculation Formula:</span>
            <span className="font-mono text-[11px]">Labour + Parts + Taxes + Fees − Discounts</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#DADBD3]/60 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[#4A4F44]">
              <span>${calcResult.laborSubtotal.toFixed(2)}</span>
              <span>+</span>
              <span>${calcResult.partsSubtotal.toFixed(2)}</span>
              <span>+</span>
              <span>${calcResult.taxesAmount.toFixed(2)}</span>
              <span>+</span>
              <span>${calcResult.feesAmount.toFixed(2)}</span>
              <span>−</span>
              <span>${calcResult.discountApplied.toFixed(2)}</span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-[#73766F] block">Total Quotation</span>
              <span className="font-mono text-xl font-bold text-[#252923]">
                ${calcResult.calculatedTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Warranties & Turnaround */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            type="number"
            label="Labour Warranty (Days)"
            suffixText="days"
            value={formData.warrantyLaborDays}
            onChange={e => setFormData({ ...formData, warrantyLaborDays: e.target.value })}
          />
          <Input
            type="number"
            label="Parts Warranty (Months)"
            suffixText="mo"
            value={formData.warrantyPartsMonths}
            onChange={e => setFormData({ ...formData, warrantyPartsMonths: e.target.value })}
          />
          <Input
            type="number"
            label="Est. Turnaround (Days)"
            suffixText="days"
            value={formData.estimatedTurnaroundDays}
            onChange={e => setFormData({ ...formData, estimatedTurnaroundDays: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="quote-notes" className="text-xs font-semibold text-[#252923]">
            Quotation Notes & Exclusions
          </label>
          <textarea
            id="quote-notes"
            rows={2}
            className="w-full px-3 py-2 text-sm text-[#252923] placeholder-[#8F928B] bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] focus:ring-1 focus:ring-[#285B45] outline-none"
            placeholder="Payment terms, diagnostic waiver conditions, or parts lead times..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* User Data Disclosure */}
        <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#DADBD3] text-[11px] text-[#73766F] flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#285B45] shrink-0 mt-0.5" />
          <span>
            User Input Notice: All quotation numbers and provider names are entered directly by you for your personal comparison. RepairPath does not fabricate external market prices or verify technician credentials.
          </span>
        </div>
      </form>
    </Modal>
  );
};
