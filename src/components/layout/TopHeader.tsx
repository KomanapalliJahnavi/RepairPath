import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { BrandMark } from '../common/BrandMark';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

interface TopHeaderProps {
  onToggleMobileNav: () => void;
  onOpenAddAppliance: () => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; description: string }> = {
  overview: {
    title: 'Household Appliance Overview',
    description: 'System health, recent repair events, and warranty tracking across your registered units.',
  },
  appliances: {
    title: 'Registered Household Appliances',
    description: 'Detailed inventory, model specifications, warranty expirations, and replacement lifespans.',
  },
  troubleshooter: {
    title: 'Safe Preliminary Troubleshooter',
    description: 'Step-by-step diagnostic trees with strict electrical and mechanical safety precautions.',
  },
  'repair-memory': {
    title: 'Repair Memory & Chronology',
    description: 'Verified service records, technician notes, parts replaced, and recurring symptom flags.',
  },
  quotesense: {
    title: 'QuoteSense Comparison',
    description: 'Side-by-side contractor quote breakdown: diagnostic fee credits, labor, and warranty terms.',
  },
  'repair-vs-replace': {
    title: 'Repair vs. Replace Decision Tool',
    description: 'Actuarial decision model applying the 50% rule and depreciation against expected lifespan.',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileNav,
  onOpenAddAppliance,
}) => {
  const { activeTab } = useApp();
  const current = TAB_TITLES[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F5]/95 backdrop-blur-none border-b border-[#DADBD3] px-4 sm:px-8 py-3.5 sm:py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="md:hidden p-2 -ml-2 rounded-md text-[#252923] hover:bg-[#EAE9E2] transition-colors focus-visible:ring-2 focus-visible:ring-[#285B45]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="md:hidden flex items-center">
            <BrandMark showWordmark={false} size={30} />
          </div>

          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-bold text-[#252923] tracking-tight leading-tight">
              {current.title}
            </h1>
            <p className="text-xs text-[#73766F] hidden sm:block mt-0.5 leading-snug">
              {current.description}
            </p>
          </div>
        </div>

        {/* Right: Quick CTA on mobile / desktop */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddAppliance}
            className="sm:hidden flex items-center justify-center p-2 rounded-md bg-[#285B45] text-white hover:bg-[#1E4635] text-xs font-medium cursor-pointer"
            aria-label="Add Appliance"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
