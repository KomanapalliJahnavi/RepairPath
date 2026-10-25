import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRight,
  Info,
  ShieldCheck,
  Clock,
  Tag,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RepairQuote } from '../../types';
import { AddQuoteModal } from './AddQuoteModal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { calculateQuoteTotal } from '../../utils/quoteCalculations';

export const QuoteSenseComparison: React.FC = () => {
  const { quotes, appliances, deleteQuote, setActiveTab, setSelectedApplianceId } = useApp();

  const [selectedApplianceId, setSelectedApplianceIdFilter] = useState<string>(
    appliances[0]?.id || 'all'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<RepairQuote | null>(null);

  // Filter quotes for chosen appliance
  const relevantQuotes = useMemo(() => {
    if (selectedApplianceId === 'all') return quotes;
    return quotes.filter(q => q.applianceId === selectedApplianceId);
  }, [quotes, selectedApplianceId]);

  // Compute calculated totals for quotes
  const quotesWithTotals = useMemo(() => {
    return relevantQuotes.map(q => {
      const calc = calculateQuoteTotal({
        laborCost: q.laborCost,
        parts: q.parts,
        taxes: q.taxes || 0,
        additionalFees: q.additionalFees || 0,
        discountAmount: q.discountAmount || 0,
      });
      return {
        ...q,
        calc,
        effectiveTotal: q.calculatedTotal !== undefined ? q.calculatedTotal : calc.calculatedTotal,
      };
    });
  }, [relevantQuotes]);

  // Identify lowest price
  const lowestPriceQuoteId = useMemo(() => {
    if (quotesWithTotals.length === 0) return null;
    let min = Infinity;
    let minId = null;
    quotesWithTotals.forEach(q => {
      if (q.effectiveTotal < min) {
        min = q.effectiveTotal;
        minId = q.id;
      }
    });
    return minId;
  }, [quotesWithTotals]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the quotation from "${name}"?`)) {
      deleteQuote(id);
    }
  };

  const handleBridgeToRepairVsReplace = (quote: RepairQuote) => {
    setSelectedApplianceId(quote.applianceId);
    setActiveTab('repair-vs-replace');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header and Appliance Selector */}
      <div className="p-5 sm:p-6 bg-white rounded-lg border border-[#DADBD3] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#285B45]" />
            <h2 className="text-base sm:text-lg font-bold text-[#252923]">
              QuoteSense Quotation Management & Comparison
            </h2>
          </div>
          <p className="text-xs text-[#73766F] mt-1 leading-relaxed">
            Side-by-side breakdown using formula: Total = Labour + Parts + Taxes + Additional Fees − Discounts.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2">
            <label htmlFor="quote-appliance-filter" className="text-xs font-semibold text-[#73766F] whitespace-nowrap">
              Appliance:
            </label>
            <select
              id="quote-appliance-filter"
              value={selectedApplianceId}
              onChange={e => setSelectedApplianceIdFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-[#252923] bg-[#FAF9F5] border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
            >
              <option value="all">All Appliances ({quotes.length} quotations)</option>
              {appliances.map(app => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.brand})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingQuote(null);
              setIsModalOpen(true);
            }}
          >
            Enter Quotation
          </Button>
        </div>
      </div>

      {/* Manual Comparison Notice */}
      <div className="p-3 bg-[#FAF9F5] rounded-md border border-[#DADBD3] text-xs text-[#73766F] flex items-center gap-2">
        <Info className="w-4 h-4 text-[#285B45] shrink-0" />
        <span>
          <strong>Reference Transparency:</strong> All quotation estimates below reflect user-entered figures. RepairPath does not fabricate market research or claim unverified third-party certifications.
        </span>
      </div>

      {quotesWithTotals.length === 0 ? (
        <EmptyState
          icon={<Scale className="w-6 h-6" />}
          title="No contractor quotations recorded"
          description="Enter estimates from local technicians or service shops to compute itemised totals and compare warranties side by side."
          actionLabel="Enter First Quotation"
          onAction={() => {
            setEditingQuote(null);
            setIsModalOpen(true);
          }}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="space-y-6">
          {/* Responsive Comparison Grid: Side-by-side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quotesWithTotals.map(quote => {
              const isBestPrice = quote.id === lowestPriceQuoteId;
              const app = appliances.find(a => a.id === quote.applianceId);
              const hasAftermarketParts = quote.parts.some(p => !p.isOem);

              return (
                <div
                  key={quote.id}
                  className={`p-5 rounded-lg border bg-white flex flex-col justify-between text-left transition-all ${
                    isBestPrice ? 'border-[#285B45] shadow-xs ring-1 ring-[#285B45]/40' : 'border-[#DADBD3]'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Provider & Best Value Tag */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-[#285B45] block">
                            {app?.name || 'Appliance'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FAF9F5] border border-[#DADBD3] text-[#73766F]">
                            User Entered
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#252923] tracking-tight mt-0.5">
                          {quote.serviceProvider}
                        </h3>
                        {quote.contactInfo && (
                          <span className="text-[11px] text-[#73766F] font-mono">
                            {quote.contactInfo}
                          </span>
                        )}
                      </div>
                      {isBestPrice && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EBF2EE] text-[#285B45] border border-[#BDD4C8] whitespace-nowrap">
                          Lowest Calculated Total
                        </span>
                      )}
                    </div>

                    {/* Total formula result */}
                    <div className="p-3.5 rounded-md bg-[#FAF9F5] border border-[#DADBD3] flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-[#73766F] uppercase tracking-wider block font-bold">
                          Total (Calculated)
                        </span>
                        <span className="font-mono text-2xl font-bold text-[#252923]">
                          ${quote.effectiveTotal.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#73766F] font-mono">
                        {quote.quoteDate}
                      </span>
                    </div>

                    {/* Formula components breakdown */}
                    <div className="space-y-1.5 text-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#73766F] block">
                        Itemised Formula Breakdown
                      </span>

                      <div className="flex justify-between py-1 border-b border-[#F5F4EF]">
                        <span className="text-[#73766F]">Labour Charge:</span>
                        <span className="font-mono font-semibold text-[#252923]">
                          ${quote.laborCost.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-[#F5F4EF]">
                        <span className="text-[#73766F]">Parts Subtotal ({quote.parts.length}):</span>
                        <span className="font-mono font-semibold text-[#252923]">
                          ${quote.calc.partsSubtotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-[#F5F4EF]">
                        <span className="text-[#73766F]">Taxes:</span>
                        <span className="font-mono font-semibold text-[#252923]">
                          ${(quote.taxes || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-[#F5F4EF]">
                        <span className="text-[#73766F]">Additional Fees:</span>
                        <span className="font-mono font-semibold text-[#252923]">
                          ${(quote.additionalFees || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-[#F5F4EF]">
                        <span className="text-[#73766F]">Discounts Applied:</span>
                        <span className="font-mono font-semibold text-[#285B45]">
                          −${(quote.discountAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Parts list */}
                    {quote.parts.length > 0 && (
                      <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#DADBD3] text-xs space-y-1">
                        <span className="font-semibold text-[#73766F] block text-[11px]">Parts List:</span>
                        <ul className="space-y-0.5">
                          {quote.parts.map(p => (
                            <li key={p.id} className="flex justify-between text-[#252923] text-[11px]">
                              <span className="truncate">{p.name} {p.isOem ? '(OEM)' : '(Aftermarket)'}</span>
                              <span className="font-mono">${Number(p.cost).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warranty terms */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded bg-[#FAF9F5] border border-[#DADBD3]">
                        <span className="block text-[10px] text-[#73766F] uppercase">Labour Warranty</span>
                        <span className="font-mono font-bold text-[#252923]">{quote.warrantyLaborDays} days</span>
                      </div>
                      <div className="p-2 rounded bg-[#FAF9F5] border border-[#DADBD3]">
                        <span className="block text-[10px] text-[#73766F] uppercase">Parts Warranty</span>
                        <span className="font-mono font-bold text-[#252923]">{quote.warrantyPartsMonths} months</span>
                      </div>
                    </div>

                    {quote.notes && (
                      <p className="text-[11px] text-[#73766F] italic bg-[#FAF9F5] p-2 rounded">
                        &quot;{quote.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-[#DADBD3] flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => handleBridgeToRepairVsReplace(quote)}
                    >
                      Compare vs Replace
                    </Button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuote(quote);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-[#73766F] hover:text-[#252923] rounded transition-colors"
                        title="Edit quotation"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(quote.id, quote.serviceProvider)}
                        className="p-1.5 text-[#73766F] hover:text-[#B91C1C] rounded transition-colors"
                        title="Delete quotation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quote Modal */}
      <AddQuoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuote(null);
        }}
        initialApplianceId={selectedApplianceId !== 'all' ? selectedApplianceId : undefined}
        initialData={editingQuote}
      />
    </div>
  );
};
