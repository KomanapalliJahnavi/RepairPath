import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Appliance, ApplianceCategory, ConditionStatus, WarrantyStatus } from '../../types';

interface ApplianceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applianceData: Omit<Appliance, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Appliance | null;
}

const CATEGORY_OPTIONS = [
  { value: 'refrigeration', label: 'Refrigeration & Freezers' },
  { value: 'dishwashing', label: 'Dishwashers' },
  { value: 'laundry', label: 'Washing Machines & Dryers' },
  { value: 'cooking', label: 'Ovens, Ranges & Cooktops' },
  { value: 'hvac', label: 'Heating & Air Conditioning (HVAC)' },
  { value: 'water_heating', label: 'Water Heaters' },
  { value: 'small_appliance', label: 'Countertop & Small Appliances' },
];

const CONDITION_OPTIONS = [
  { value: 'optimal', label: 'Operational / Optimal Condition' },
  { value: 'attention_needed', label: 'Attention Needed (Minor Symptoms/Noise)' },
  { value: 'urgent_repair', label: 'Urgent Repair Required (Inoperable)' },
  { value: 'retired', label: 'Retired / Replaced' },
];

const WARRANTY_OPTIONS = [
  { value: 'under_warranty', label: 'Active Manufacturer Warranty' },
  { value: 'extended_warranty', label: 'Active Extended Warranty Plan' },
  { value: 'expired', label: 'Warranty Expired' },
  { value: 'unknown', label: 'Warranty Status Unknown' },
];

export const ApplianceFormModal: React.FC<ApplianceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'refrigeration' as ApplianceCategory,
    brand: '',
    modelNumber: '',
    serialNumber: '',
    locationRoom: 'Kitchen',
    purchaseDate: '',
    purchasePrice: '',
    expectedLifespanYears: '12',
    warrantyExpiryDate: '',
    warrantyStatus: 'expired' as WarrantyStatus,
    conditionStatus: 'optimal' as ConditionStatus,
    installedBy: '',
    energyRating: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        brand: initialData.brand,
        modelNumber: initialData.modelNumber,
        serialNumber: initialData.serialNumber || '',
        locationRoom: initialData.locationRoom,
        purchaseDate: initialData.purchaseDate || '',
        purchasePrice: initialData.purchasePrice !== null && initialData.purchasePrice !== undefined ? String(initialData.purchasePrice) : '',
        expectedLifespanYears: String(initialData.expectedLifespanYears || 10),
        warrantyExpiryDate: initialData.warrantyExpiryDate || '',
        warrantyStatus: initialData.warrantyStatus,
        conditionStatus: initialData.conditionStatus,
        installedBy: initialData.installedBy || '',
        energyRating: initialData.energyRating || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        name: '',
        category: 'refrigeration',
        brand: '',
        modelNumber: '',
        serialNumber: '',
        locationRoom: 'Kitchen',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: '',
        expectedLifespanYears: '10',
        warrantyExpiryDate: '',
        warrantyStatus: 'expired',
        conditionStatus: 'optimal',
        installedBy: '',
        energyRating: '',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Appliance name or nickname is required';
    if (!formData.brand.trim()) newErrors.brand = 'Manufacturer/Brand is required';
    if (!formData.modelNumber.trim()) newErrors.modelNumber = 'Model number is required';
    if (!formData.purchaseDate) newErrors.purchaseDate = 'Purchase date is required';
    if (formData.purchasePrice !== '' && (isNaN(Number(formData.purchasePrice)) || Number(formData.purchasePrice) < 0)) {
      newErrors.purchasePrice = 'Enter a valid purchase price or leave blank if unknown';
    }
    if (!formData.expectedLifespanYears || isNaN(Number(formData.expectedLifespanYears)) || Number(formData.expectedLifespanYears) <= 0) {
      newErrors.expectedLifespanYears = 'Enter a valid expected lifespan in years';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      category: formData.category,
      brand: formData.brand.trim(),
      modelNumber: formData.modelNumber.trim(),
      serialNumber: formData.serialNumber.trim() || undefined,
      locationRoom: formData.locationRoom.trim() || 'Kitchen',
      purchaseDate: formData.purchaseDate || undefined,
      purchasePrice: formData.purchasePrice !== '' ? Number(formData.purchasePrice) : null,
      expectedLifespanYears: Number(formData.expectedLifespanYears),
      warrantyExpiryDate: formData.warrantyExpiryDate || null,
      warrantyStatus: formData.warrantyStatus,
      conditionStatus: formData.conditionStatus,
      installedBy: formData.installedBy.trim() || undefined,
      energyRating: formData.energyRating.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Appliance Details' : 'Register Household Appliance'}
      description="Enter verified specifications and purchase records to track maintenance history and calculate financial lifespan."
      maxWidth="xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit}>
            {initialData ? 'Save Changes' : 'Register Appliance'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Nickname & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Appliance Name / Identifier"
            placeholder="e.g. Primary Kitchen Refrigerator"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
            hint="A clear label distinguishing this unit in your home"
          />
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value as ApplianceCategory })}
            required
          />
        </div>

        {/* Row 2: Brand, Model Number & Serial */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Brand / Manufacturer"
            placeholder="e.g. Bosch, Samsung, LG"
            value={formData.brand}
            onChange={e => setFormData({ ...formData, brand: e.target.value })}
            error={errors.brand}
            required
          />
          <Input
            label="Model Number"
            placeholder="e.g. SHP78CM5N"
            value={formData.modelNumber}
            onChange={e => setFormData({ ...formData, modelNumber: e.target.value })}
            error={errors.modelNumber}
            required
            hint="From rating plate sticker"
          />
          <Input
            label="Serial Number"
            placeholder="e.g. FD0208003492"
            value={formData.serialNumber}
            onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
            hint="For warranty and recall lookups"
          />
        </div>

        {/* Row 3: Room, Purchase Date & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Room / Location"
            placeholder="e.g. Kitchen, Utility Room"
            value={formData.locationRoom}
            onChange={e => setFormData({ ...formData, locationRoom: e.target.value })}
          />
          <Input
            type="date"
            label="Purchase Date"
            value={formData.purchaseDate}
            onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
            error={errors.purchaseDate}
            required
          />
          <Input
            type="number"
            label="Purchase Price"
            prefixText="$"
            placeholder="0.00"
            min="0"
            step="1"
            value={formData.purchasePrice}
            onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
            error={errors.purchasePrice}
            required
            hint="Original or replacement value"
          />
        </div>

        {/* Row 4: Lifespan & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            type="number"
            label="Expected Lifespan (Years)"
            suffixText="yrs"
            min="1"
            max="30"
            value={formData.expectedLifespanYears}
            onChange={e => setFormData({ ...formData, expectedLifespanYears: e.target.value })}
            error={errors.expectedLifespanYears}
            required
            hint="Industry avg: 10-14 yrs"
          />
          <Select
            label="Operating Condition"
            options={CONDITION_OPTIONS}
            value={formData.conditionStatus}
            onChange={e => setFormData({ ...formData, conditionStatus: e.target.value as ConditionStatus })}
          />
          <Select
            label="Warranty Status"
            options={WARRANTY_OPTIONS}
            value={formData.warrantyStatus}
            onChange={e => setFormData({ ...formData, warrantyStatus: e.target.value as WarrantyStatus })}
          />
        </div>

        {/* Row 5: Notes & Installer info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Installed By / Service Provider"
            placeholder="e.g. Direct Installation LLC"
            value={formData.installedBy}
            onChange={e => setFormData({ ...formData, installedBy: e.target.value })}
          />
          <Input
            label="Energy Rating / Efficiency"
            placeholder="e.g. Energy Star Tier 1"
            value={formData.energyRating}
            onChange={e => setFormData({ ...formData, energyRating: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="appliance-notes" className="text-xs font-semibold text-[#252923]">
            Maintenance Notes & Observations
          </label>
          <textarea
            id="appliance-notes"
            rows={2}
            className="w-full px-3 py-2 text-sm text-[#252923] placeholder-[#8F928B] bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] focus:ring-1 focus:ring-[#285B45] outline-none"
            placeholder="Filter replacement frequency, peculiarities, or installation quirks..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
};
