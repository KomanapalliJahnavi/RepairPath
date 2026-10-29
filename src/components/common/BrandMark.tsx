import React from 'react';

interface BrandMarkProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  useFullLockupImage?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  className = '',
  size = 36,
  showWordmark = true,
  wordmarkClassName = '',
  useFullLockupImage = false,
}) => {
  if (useFullLockupImage && showWordmark) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/repairpath-logo-transparent.png"
          alt="RepairPath Logo"
          className="h-10 w-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Precision R Mark with Appliance, Wrench, Path, and Leaf */}
      <img
        src="/repairpath-mark-transparent.png"
        alt="RepairPath Logo Mark"
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="shrink-0 object-contain drop-shadow-xs transition-transform duration-200 hover:scale-105"
      />

      {showWordmark && (
        <div className={`flex flex-col text-left ${wordmarkClassName}`}>
          <div className="flex items-baseline tracking-tight leading-tight">
            <span className="font-bold text-xl text-[#1E293B] font-['Plus_Jakarta_Sans',sans-serif]">
              Repair
            </span>
            <span className="font-bold text-xl text-[#16A34A] font-['Plus_Jakarta_Sans',sans-serif]">
              Path
            </span>
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#73766F] leading-none mt-0.5">
            Appliance Journal & Decisions
          </span>
        </div>
      )}
    </div>
  );
};
