import React, { useState } from 'react';
import { Database, ShieldAlert, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';

export const StorageDisclosureFooter: React.FC = () => {
  const { 
    appliances, 
    repairEvents, 
    quotes, 
    troubleshootingSessions, 
    evaluations, 
    resetToDefaults 
  } = useApp();

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(false);

  const handleReset = () => {
    resetToDefaults();
    setConfirmResetOpen(false);
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 3000);
  };

  return (
    <footer className="mt-12 pt-6 pb-8 border-t border-[#DADBD3] text-xs text-[#73766F] space-y-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Transparency note */}
        <div className="space-y-1 max-w-2xl text-left">
          <div className="flex items-center gap-1.5 font-bold text-[#252923]">
            <Database className="w-3.5 h-3.5 text-[#285B45]" />
            <span>Local Prototype Storage & Privacy Disclosure</span>
          </div>
          <p className="leading-relaxed text-[#4A4F44]">
            RepairPath operates entirely as an offline-first browser prototype. All appliances, repair memories, diagnostic logs, and quotes are persisted strictly in your browser’s <code className="px-1 py-0.5 bg-white border border-[#DADBD3] rounded font-mono text-[11px]">localStorage</code>. No passwords, cloud sync, or remote servers are used. Clearing your browser site data will remove saved records.
          </p>
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#73766F] pt-0.5">
            <span>Stored: {appliances.length} appliances</span>
            <span>•</span>
            <span>{repairEvents.length} repairs</span>
            <span>•</span>
            <span>{quotes.length} quotes</span>
            <span>•</span>
            <span>{troubleshootingSessions.length} sessions</span>
            <span>•</span>
            <span>{evaluations.length} evaluations</span>
          </div>
        </div>

        {/* Reset Demo Data Action */}
        <div className="shrink-0 flex items-center gap-2">
          {resetFeedback ? (
            <span className="text-[#285B45] font-semibold flex items-center gap-1 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              Demo data restored
            </span>
          ) : confirmResetOpen ? (
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#B91C1C]">
              <span className="text-[11px] text-[#B91C1C] font-semibold">Reset all to default demo?</span>
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 text-[11px] font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded transition-colors"
              >
                Yes, Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-2 py-1 text-[11px] font-medium text-[#73766F] hover:text-[#252923]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setConfirmResetOpen(true)}
            >
              Reset Demo Records
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
};
