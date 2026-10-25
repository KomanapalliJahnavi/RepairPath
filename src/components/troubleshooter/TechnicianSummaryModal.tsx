import React, { useState } from 'react';
import { 
  Printer, 
  Copy, 
  Check, 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  Trash2,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Appliance, RepairEvent, TroubleshootingSession } from '../../types';

interface TechnicianSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  appliance: Appliance;
  currentSymptom: string;
  errorCode?: string;
  startedWhen?: string;
  relatedRepairs: RepairEvent[];
  recurringExplanation?: string;
  suggestedQuestions: string[];
}

export const TechnicianSummaryModal: React.FC<TechnicianSummaryModalProps> = ({
  isOpen,
  onClose,
  appliance,
  currentSymptom,
  errorCode,
  startedWhen,
  relatedRepairs,
  recurringExplanation,
  suggestedQuestions: initialQuestions,
}) => {
  const [copied, setCopied] = useState(false);
  const [questions, setQuestions] = useState<string[]>(initialQuestions);
  const [newQuestionText, setNewQuestionText] = useState('');

  const purchaseTime = appliance.purchaseDate ? new Date(appliance.purchaseDate).getTime() : null;
  const now = new Date().getTime();
  const ageYears = purchaseTime ? Math.max(0, (now - purchaseTime) / (1000 * 60 * 60 * 24 * 365.25)) : null;
  const ageText = ageYears !== null ? (ageYears < 1 ? `${Math.round(ageYears * 12)} months` : `${ageYears.toFixed(1)} years`) : 'Unknown';

  const addQuestion = () => {
    if (!newQuestionText.trim()) return;
    setQuestions([...questions, newQuestionText.trim()]);
    setNewQuestionText('');
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const generatePlainText = () => {
    let text = `====================================================\n`;
    text += `REPAIRPATH — TECHNICIAN PRE-VISIT SERVICE PACKET\n`;
    text += `====================================================\n\n`;
    text += `APPLIANCE SPECIFICATIONS:\n`;
    text += `• Identifier: ${appliance.name}\n`;
    text += `• Manufacturer: ${appliance.brand}\n`;
    text += `• Model Number: ${appliance.modelNumber}\n`;
    text += `• Serial Number: ${appliance.serialNumber || 'Not specified'}\n`;
    text += `• Location: ${appliance.locationRoom}\n`;
    text += `• Age / In Service: ${ageText} (Purchased: ${appliance.purchaseDate || 'Unknown'})\n`;
    text += `• Warranty Status: ${appliance.warrantyStatus.replace('_', ' ').toUpperCase()}\n\n`;

    text += `CURRENT REPORTED PROBLEM:\n`;
    text += `• Observed Symptom: ${currentSymptom}\n`;
    text += `• Onset / Duration: ${startedWhen || 'Recent'}\n`;
    text += `• Error Code Displayed: ${errorCode || 'None / Not recorded'}\n\n`;

    if (recurringExplanation) {
      text += `REPAIR MEMORY NOTICE:\n`;
      text += `• ${recurringExplanation}\n\n`;
    }

    if (relatedRepairs.length > 0) {
      text += `PREVIOUS SERVICE CHRONOLOGY ON THIS UNIT (${relatedRepairs.length} records):\n`;
      relatedRepairs.forEach((r, idx) => {
        text += `  [${idx + 1}] Date: ${r.date} | Cost: $${r.cost} | Service: ${r.serviceCompany || r.serviceType}\n`;
        text += `      Symptom: ${r.userReportedSymptom}\n`;
        if (r.technicianDiagnosis) text += `      Diagnosis: ${r.technicianDiagnosis}\n`;
        if (r.repairPerformed) text += `      Repair: ${r.repairPerformed}\n`;
        if (r.partsReplaced.length > 0) text += `      Parts: ${r.partsReplaced.join(', ')}\n`;
        text += `\n`;
      });
    }

    if (questions.length > 0) {
      text += `QUESTIONS FOR THE TECHNICIAN:\n`;
      questions.forEach((q, idx) => {
        text += `  [ ] ${idx + 1}. ${q}\n`;
      });
      text += `\n`;
    }

    text += `====================================================\n`;
    text += `Generated for service appointment reference via RepairPath\n`;
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Technician Pre-Visit Information Packet"
      description="Review this summary before scheduling or greeting your field technician to avoid exploratory fees."
      maxWidth="2xl"
      footer={
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-[#73766F]">
            Ready to paste into booking portals or print for the on-site technician.
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={copied ? <Check className="w-3.5 h-3.5 text-[#285B45]" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopy}
            >
              {copied ? 'Copied to Clipboard' : 'Copy Text'}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print Packet
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-left text-sm text-[#252923]">
        {/* Hardware specifications banner */}
        <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DADBD3] space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#DADBD3]">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#73766F] block">
                Target Appliance
              </span>
              <h3 className="text-base font-bold text-[#252923]">
                {appliance.name}
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-[#DADBD3] text-[#285B45] font-semibold">
              {appliance.warrantyStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div>
              <span className="text-[#73766F] block text-[11px]">Brand:</span>
              <strong className="text-[#252923]">{appliance.brand}</strong>
            </div>
            <div>
              <span className="text-[#73766F] block text-[11px]">Model Number:</span>
              <strong className="font-mono text-[#252923]">{appliance.modelNumber}</strong>
            </div>
            <div>
              <span className="text-[#73766F] block text-[11px]">Serial Number:</span>
              <strong className="font-mono text-[#252923]">{appliance.serialNumber || 'Unspecified'}</strong>
            </div>
            <div>
              <span className="text-[#73766F] block text-[11px]">Appliance Age:</span>
              <strong className="text-[#252923]">{ageText}</strong>
            </div>
          </div>
        </div>

        {/* Current Reported Problem */}
        <div className="p-4 rounded-lg bg-white border border-[#DADBD3] space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#73766F]">
            Current Issue Symptoms
          </h4>
          <p className="text-xs sm:text-sm font-medium text-[#252923]">
            {currentSymptom}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#73766F] pt-1">
            <span>Started: <strong className="text-[#252923]">{startedWhen || 'Recent'}</strong></span>
            <span>Error Code: <strong className="text-[#252923] font-mono">{errorCode || 'None'}</strong></span>
            <span>Location: <strong className="text-[#252923]">{appliance.locationRoom}</strong></span>
          </div>
        </div>

        {/* Recurring alert if present */}
        {recurringExplanation && (
          <div className="p-3.5 rounded-lg bg-[#FDF2F2] border border-[#F8C8C8] text-xs space-y-1">
            <div className="flex items-center gap-2 text-[#B91C1C] font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Repair Memory: Repeat Symptom Pattern Identified</span>
            </div>
            <p className="text-[#7F1D1D] leading-relaxed">
              {recurringExplanation}
            </p>
          </div>
        )}

        {/* Previous repairs list on this unit */}
        {relatedRepairs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#73766F] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#285B45]" />
              Related Prior Service Chronology ({relatedRepairs.length} records)
            </h4>
            <div className="space-y-2">
              {relatedRepairs.map((r, i) => (
                <div key={i} className="p-3 rounded bg-[#FAF9F5] border border-[#DADBD3] text-xs space-y-1">
                  <div className="flex justify-between items-start font-medium text-[#252923]">
                    <span>{r.title}</span>
                    <span className="font-mono">${r.cost} ({r.date})</span>
                  </div>
                  {r.technicianDiagnosis && (
                    <p className="text-[#4A4F44]">
                      <strong className="text-[#73766F]">Previous Diagnosis: </strong>
                      {r.technicianDiagnosis}
                    </p>
                  )}
                  {r.partsReplaced.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[11px] pt-1">
                      <span className="text-[#73766F]">Parts:</span>
                      {r.partsReplaced.map((part, pIdx) => (
                        <span key={pIdx} className="px-1.5 py-0.2 rounded bg-white border border-[#DADBD3] font-mono">
                          {part}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions for Technician */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#73766F]">
              Questions to Ask the Technician
            </h4>
            <span className="text-[11px] text-[#73766F]">Personalize your checklist</span>
          </div>

          <div className="space-y-1.5">
            {questions.map((q, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-2.5 rounded bg-[#FAF9F5] border border-[#DADBD3] text-xs">
                <span className="text-[#252923] flex-1">
                  <strong className="text-[#285B45] mr-1.5">Q{idx + 1}.</strong> {q}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  className="p-1 text-[#73766F] hover:text-[#B91C1C]"
                  title="Remove question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Add your own question for the technician..."
              value={newQuestionText}
              onChange={e => setNewQuestionText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#DADBD3] rounded-md text-[#252923] placeholder-[#8F928B] focus:border-[#285B45] outline-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={addQuestion}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Non-transmission disclaimer */}
        <p className="text-[11px] text-[#73766F] italic bg-[#FAF9F5] p-2.5 rounded border border-[#DADBD3]">
          Notice: RepairPath operates locally on your machine. This summary is strictly generated for your personal use to review, print, or copy into booking notes.
        </p>
      </div>
    </Modal>
  );
};
