import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  HelpCircle, 
  History, 
  Scale, 
  ArrowLeftRight,
  RotateCcw,
  Plus
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

interface SidebarProps {
  onOpenAddAppliance: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAddAppliance }) => {
  const { activeTab, setActiveTab, resetToDefaults, appliances, repairEvents } = useApp();

  const attentionCount = appliances.filter(a => a.conditionStatus === 'attention_needed' || a.conditionStatus === 'urgent_repair').length;
  const recurringCount = repairEvents.filter(r => r.recurringIssueFlag).length;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badgeCount?: number; badgeVariant?: 'warning' | 'danger' }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'appliances',
      label: 'My Appliances',
      icon: <Layers className="w-4 h-4" />,
      badgeCount: appliances.length,
    },
    {
      id: 'troubleshooter',
      label: 'Troubleshooter',
      icon: <HelpCircle className="w-4 h-4" />,
      badgeCount: attentionCount > 0 ? attentionCount : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'repair-memory',
      label: 'Repair Memory',
      icon: <History className="w-4 h-4" />,
      badgeCount: recurringCount > 0 ? recurringCount : undefined,
      badgeVariant: 'danger',
    },
    {
      id: 'quotesense',
      label: 'QuoteSense',
      icon: <Scale className="w-4 h-4" />,
    },
    {
      id: 'repair-vs-replace',
      label: 'Repair vs Replace',
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between border-r border-[#DADBD3] bg-[#FAF9F5] h-screen sticky top-0">
      {/* Brand & Primary Action */}
      <div className="p-5 flex flex-col gap-6">
        <BrandMark />

        <button
          type="button"
          onClick={onOpenAddAppliance}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-md bg-[#285B45] hover:bg-[#1E4635] text-white text-xs font-semibold tracking-wide transition-all shadow-xs border border-[#204937] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#285B45]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Appliance</span>
        </button>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1" aria-label="Main Navigation">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#73766F] px-3 pb-1">
            Navigation
          </span>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#EAE9E2] text-[#252923] font-semibold border-l-2 border-[#285B45]'
                    : 'text-[#4A4F44] hover:text-[#252923] hover:bg-[#EAE9E2]/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#285B45]' : 'text-[#73766F]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badgeCount !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded font-mono font-medium ${
                      item.badgeVariant === 'danger'
                        ? 'bg-[#FDF2F2] text-[#B91C1C] border border-[#F8C8C8]'
                        : item.badgeVariant === 'warning'
                        ? 'bg-[#FEF7EA] text-[#B45309] border border-[#F7DBA7]'
                        : 'bg-[#E3E2DA] text-[#4A4F44]'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Utility & Lived-in journal stats */}
      <div className="p-4 border-t border-[#DADBD3] bg-[#F5F4EF]/70 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-[#73766F]">
          <span>Appliance Journal</span>
          <span className="font-mono text-[11px] font-medium text-[#252923]">v1.0 Ready</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all appliance records, repairs, and quotes to standard reference data?')) {
              resetToDefaults();
            }
          }}
          className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#73766F] hover:text-[#252923] py-1.5 px-2 rounded hover:bg-[#EAE9E2] transition-colors cursor-pointer border border-[#DADBD3]"
          title="Restore sample demo appliances and repair records"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Records</span>
        </button>
      </div>
    </aside>
  );
};
