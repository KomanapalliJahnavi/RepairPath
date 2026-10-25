import React from 'react';
import { MapPin, AlertCircle, Wrench, ChevronRight, Activity } from 'lucide-react';
import { Appliance } from '../../types';
import { Badge } from '../common/Badge';
import { useApp } from '../../context/AppContext';

interface ApplianceCardProps {
  appliance: Appliance;
  onSelect: (appliance: Appliance) => void;
  onQuickTroubleshoot?: (applianceId: string) => void;
}

export const ApplianceCard: React.FC<ApplianceCardProps> = ({
  appliance,
  onSelect,
  onQuickTroubleshoot,
}) => {
  const { getRepairsForAppliance } = useApp();
  const repairs = getRepairsForAppliance(appliance.id);
  const totalRepairsCost = repairs.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
  const hasRecurring = repairs.some(r => r.recurringIssueFlag);

  // Age calculation
  const purchaseTime = appliance.purchaseDate ? new Date(appliance.purchaseDate).getTime() : null;
  const now = new Date().getTime();
  const ageYears = purchaseTime ? Math.max(0, (now - purchaseTime) / (1000 * 60 * 60 * 24 * 365.25)) : null;
  const ageFormatted = ageYears !== null ? (ageYears < 1 ? `${Math.round(ageYears * 12)} mo` : `${ageYears.toFixed(1)} yr`) : '—';

  const lifespanFraction = ageYears !== null ? Math.min(1, ageYears / (appliance.expectedLifespanYears || 10)) : 0;
  const lifespanPercent = Math.round(lifespanFraction * 100);

  return (
    <div
      onClick={() => onSelect(appliance)}
      className="group p-5 rounded-lg border border-[#DADBD3] bg-white hover:border-[#285B45] hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer text-left"
    >
      <div>
        {/* Header: Location & Status */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#73766F]">
            <MapPin className="w-3.5 h-3.5" />
            <span>{appliance.locationRoom}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge status={appliance.conditionStatus} size="sm" />
          </div>
        </div>

        {/* Title and Model */}
        <h3 className="text-base font-bold text-[#252923] tracking-tight group-hover:text-[#285B45] transition-colors leading-snug">
          {appliance.name}
        </h3>
        <p className="text-xs text-[#73766F] mt-0.5">
          <span className="font-medium text-[#252923]">{appliance.brand}</span> • <span className="font-mono">{appliance.modelNumber}</span>
        </p>

        {/* Recurring alert tag */}
        {hasRecurring && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#FDF2F2] border border-[#F8C8C8] text-[11px] font-semibold text-[#B91C1C]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Recurring Issue Logged</span>
          </div>
        )}

        {/* Lifespan meter */}
        <div className="mt-4 pt-3 border-t border-[#F5F4EF] flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-[#73766F]">
            <span>Age: <strong className="text-[#252923] font-mono">{ageFormatted}</strong></span>
            <span>Est. Life: <strong className="text-[#252923] font-mono">{appliance.expectedLifespanYears} yr</strong> ({lifespanPercent}%)</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#EAE9E2] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                lifespanPercent > 80 ? 'bg-[#B45309]' : 'bg-[#285B45]'
              }`}
              style={{ width: `${lifespanPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Warranty & Financials */}
      <div className="mt-4 pt-3 border-t border-[#DADBD3]/70 flex items-center justify-between text-xs">
        <div>
          <span className="text-[11px] text-[#73766F] block">Repairs to date</span>
          <span className="font-mono font-bold text-[#252923]">
            ${totalRepairsCost} <span className="text-[11px] font-normal text-[#73766F]">({repairs.length} rec)</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#285B45] font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
          <span>Inspect</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
