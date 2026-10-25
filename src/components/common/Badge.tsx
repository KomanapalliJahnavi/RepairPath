import React from 'react';
import { ConditionStatus, WarrantyStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 
    | 'default'
    | 'optimal' 
    | 'attention' 
    | 'urgent' 
    | 'retired' 
    | 'under_warranty' 
    | 'extended_warranty'
    | 'expired' 
    | 'neutral'
    | 'diy'
    | 'recurring';
  status?: ConditionStatus | WarrantyStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
  className = '',
}) => {
  // Determine variant from status if not explicitly passed
  let resolvedVariant = variant || 'default';
  let defaultLabel = children;

  if (status) {
    switch (status) {
      case 'optimal':
        resolvedVariant = 'optimal';
        defaultLabel = defaultLabel || 'Operational';
        break;
      case 'attention_needed':
        resolvedVariant = 'attention';
        defaultLabel = defaultLabel || 'Attention Needed';
        break;
      case 'urgent_repair':
        resolvedVariant = 'urgent';
        defaultLabel = defaultLabel || 'Urgent Repair';
        break;
      case 'retired':
        resolvedVariant = 'retired';
        defaultLabel = defaultLabel || 'Retired / Replaced';
        break;
      case 'under_warranty':
        resolvedVariant = 'under_warranty';
        defaultLabel = defaultLabel || 'Factory Warranty';
        break;
      case 'extended_warranty':
        resolvedVariant = 'extended_warranty';
        defaultLabel = defaultLabel || 'Extended Coverage';
        break;
      case 'expired':
        resolvedVariant = 'expired';
        defaultLabel = defaultLabel || 'Warranty Expired';
        break;
      default:
        break;
    }
  }

  const baseClasses = 'inline-flex items-center gap-1.5 font-medium rounded-md border tracking-wide transition-colors';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantStyles: Record<string, string> = {
    optimal: 'bg-[#EBF2EE] text-[#285B45] border-[#BDD4C8]',
    attention: 'bg-[#FEF7EA] text-[#B45309] border-[#F7DBA7]',
    urgent: 'bg-[#FDF2F2] text-[#B91C1C] border-[#F8C8C8]',
    retired: 'bg-[#EAE9E2] text-[#73766F] border-[#DADBD3]',
    under_warranty: 'bg-[#EBF2EE] text-[#285B45] border-[#BDD4C8]',
    extended_warranty: 'bg-[#EEF2F6] text-[#2B5278] border-[#CAD6E2]',
    expired: 'bg-[#F5F4EF] text-[#73766F] border-[#DADBD3]',
    neutral: 'bg-[#EAE9E2] text-[#252923] border-[#DADBD3]',
    diy: 'bg-[#F4F3ED] text-[#4A4F44] border-[#D1D2C8]',
    recurring: 'bg-[#FDF2F2] text-[#B91C1C] border-[#F8C8C8]',
    default: 'bg-[#EAE9E2] text-[#252923] border-[#DADBD3]',
  };

  const dotColors: Record<string, string> = {
    optimal: 'bg-[#285B45]',
    attention: 'bg-[#D97706]',
    urgent: 'bg-[#DC2626]',
    retired: 'bg-[#8F928B]',
    under_warranty: 'bg-[#285B45]',
    extended_warranty: 'bg-[#356B9E]',
    expired: 'bg-[#8F928B]',
    recurring: 'bg-[#DC2626]',
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses} ${variantStyles[resolvedVariant] || variantStyles.default} ${className}`}
    >
      {dotColors[resolvedVariant] && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[resolvedVariant]}`}
          aria-hidden="true"
        />
      )}
      <span>{defaultLabel || children}</span>
    </span>
  );
};
