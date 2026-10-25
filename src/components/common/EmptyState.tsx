import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="py-12 px-6 text-center flex flex-col items-center justify-center rounded-lg border border-dashed border-[#DADBD3] bg-[#FAF9F5] my-4">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[#EAE9E2] text-[#285B45] flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#252923] tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#73766F] max-w-md mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="primary"
          size="sm"
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
