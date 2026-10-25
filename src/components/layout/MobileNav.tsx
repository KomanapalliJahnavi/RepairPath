import React, { useEffect } from 'react';
import { 
  X, 
  LayoutDashboard, 
  Layers, 
  HelpCircle, 
  History, 
  Scale, 
  ArrowLeftRight, 
  Plus, 
  RotateCcw 
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddAppliance: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  onOpenAddAppliance,
}) => {
  const { activeTab, setActiveTab, resetToDefaults, appliances, repairEvents } = useApp();

  const attentionCount = appliances.filter(a => a.conditionStatus === 'attention_needed' || a.conditionStatus === 'urgent_repair').length;
  const recurringCount = repairEvents.filter(r => r.recurringIssueFlag).length;

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'appliances',
      label: 'My Appliances',
      icon: <Layers className="w-5 h-5" />,
      badgeCount: appliances.length,
    },
    {
      id: 'troubleshooter',
      label: 'Troubleshooter',
      icon: <HelpCircle className="w-5 h-5" />,
      badgeCount: attentionCount > 0 ? attentionCount : undefined,
    },
    {
      id: 'repair-memory',
      label: 'Repair Memory',
      icon: <History className="w-5 h-5" />,
      badgeCount: recurringCount > 0 ? recurringCount : undefined,
    },
    {
      id: 'quotesense',
      label: 'QuoteSense',
      icon: <Scale className="w-5 h-5" />,
    },
    {
      id: 'repair-vs-replace',
      label: 'Repair vs Replace',
      icon: <ArrowLeftRight className="w-5 h-5" />,
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 md:hidden flex"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#252923]/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-xs bg-[#FAF9F5] h-full shadow-xl flex flex-col justify-between border-r border-[#DADBD3] z-10 p-5 overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#DADBD3]">
            <BrandMark />
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#73766F] hover:text-[#252923] rounded-md"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddAppliance();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#285B45] text-white text-sm font-semibold tracking-wide shadow-xs border border-[#204937]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Appliance</span>
          </button>

          <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation Links">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-md text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#EAE9E2] text-[#252923] font-semibold border-l-3 border-[#285B45]'
                      : 'text-[#4A4F44] hover:bg-[#EAE9E2]/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-[#285B45]' : 'text-[#73766F]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badgeCount !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-[#E3E2DA] text-[#4A4F44]">
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#DADBD3] flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all appliance records, repairs, and quotes to standard reference data?')) {
                resetToDefaults();
                onClose();
              }
            }}
            className="flex items-center justify-center gap-2 text-xs font-medium text-[#73766F] hover:text-[#252923] py-2 px-3 rounded bg-[#EAE9E2] border border-[#DADBD3]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
