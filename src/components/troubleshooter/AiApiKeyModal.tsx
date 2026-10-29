import React, { useState } from 'react';
import { Sparkles, Key, Check, ShieldCheck, X, Trash2, ExternalLink } from 'lucide-react';
import { getStoredGeminiKey, setStoredGeminiKey, removeStoredGeminiKey } from '../../services/aiDiagnosticService';
import { Button } from '../common/Button';

interface AiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChanged?: () => void;
}

export const AiApiKeyModal: React.FC<AiApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyChanged
}) => {
  const [keyInput, setKeyInput] = useState(getStoredGeminiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredGeminiKey(keyInput);
    setSavedSuccess(true);
    if (onKeyChanged) onKeyChanged();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleRemove = () => {
    removeStoredGeminiKey();
    setKeyInput('');
    if (onKeyChanged) onKeyChanged();
  };

  const hasKey = Boolean(getStoredGeminiKey());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF9F5] border border-[#DADBD3] rounded-xl shadow-xl max-w-md w-full overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#DADBD3] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#285B45]/10 text-[#285B45]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#252923]">AI Diagnostic Engine</h2>
              <p className="text-[11px] text-[#73766F]">Google Gemini Integration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#73766F] hover:text-[#252923] p-1 rounded hover:bg-[#F5F4EF] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="p-3 bg-white rounded-lg border border-[#DADBD3] text-xs text-[#4A4F44] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#252923] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#285B45]" />
                Current Engine Mode:
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                hasKey 
                  ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]' 
                  : 'bg-[#F0EFEB] text-[#4A4F44] border border-[#DADBD3]'
              }`}>
                {hasKey ? 'Gemini 1.5/2.5 Live API' : 'Smart Knowledge Engine (Offline)'}
              </span>
            </div>
            <p className="text-[11px] text-[#73766F] leading-relaxed">
              RepairPath works seamlessly with the built-in Smart Appliance Knowledge Engine even without an API key. To unlock unbounded real-time AI reasoning across any niche appliance model, provide your Google Gemini API key below.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#252923]">
              Gemini API Key (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#73766F]">
                <Key className="w-3.5 h-3.5" />
              </div>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#DADBD3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#285B45] font-mono text-[#252923]"
              />
            </div>
            <p className="text-[10px] text-[#73766F] flex items-center justify-between pt-0.5">
              <span>Key is stored exclusively in your browser's local storage.</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#285B45] hover:underline flex items-center gap-1 font-medium"
              >
                Get Free Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          {savedSuccess && (
            <div className="p-2.5 bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] rounded-md text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Gemini API Key successfully updated!</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-[#DADBD3] flex items-center justify-between">
            {hasKey ? (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-[#B91C1C] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Key
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Engine Settings
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
