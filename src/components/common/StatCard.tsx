import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  variant = 'default',
}) => {
  const borderStyles = {
    default: 'border-[#DADBD3] bg-white',
    accent: 'border-[#BDD4C8] bg-white',
    warning: 'border-[#F7DBA7] bg-white',
    danger: 'border-[#F8C8C8] bg-white',
  }[variant];

  return (
    <div
      className={`p-4 sm:p-5 rounded-lg border ${borderStyles} transition-shadow flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#73766F]">
          {title}
        </span>
        {icon && <div className="text-[#285B45] shrink-0">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#252923]">
          {value}
        </span>
        {badge}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-[#73766F] leading-snug">
          {subtitle}
        </p>
      )}
    </div>
  );
};
