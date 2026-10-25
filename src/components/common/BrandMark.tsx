import React from 'react';

interface BrandMarkProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  className = '',
  size = 28,
  showWordmark = true,
  wordmarkClassName = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Precision Caliper & Compass / Appliance Core Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-[#285B45]"
        aria-hidden="true"
      >
        <rect
          x="2.5"
          y="2.5"
          width="27"
          height="27"
          rx="5.5"
          stroke="currentColor"
          strokeWidth="2.2"
          className="stroke-[#285B45]"
        />
        {/* Precision Diagnostic Path Line & Node */}
        <path
          d="M8 19.5L14 13.5L19 18.5L24 11"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-[#285B45]"
        />
        <circle cx="24" cy="11" r="2.2" fill="currentColor" className="fill-[#285B45]" />
        <path
          d="M8 24H24"
          stroke="#DADBD3"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      {showWordmark && (
        <div className={`flex flex-col text-left ${wordmarkClassName}`}>
          <span className="font-semibold text-lg tracking-tight text-[#252923] leading-tight">
            RepairPath
          </span>
          <span className="text-[11px] font-medium tracking-wide uppercase text-[#73766F] leading-none">
            Appliance Journal & Decisions
          </span>
        </div>
      )}
    </div>
  );
};
