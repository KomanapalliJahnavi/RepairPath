import { QuotePartItem } from '../types';

export interface QuoteInputValues {
  laborCost: number | string;
  parts?: QuotePartItem[];
  partsCost?: number | string;
  taxes: number | string;
  additionalFees: number | string;
  discountAmount: number | string;
}

export interface QuoteCalculationResult {
  partsSubtotal: number;
  partsCost: number; // Convenient alias for partsSubtotal
  laborSubtotal: number;
  taxesAmount: number;
  feesAmount: number;
  discountApplied: number;
  grossSubtotal: number;
  calculatedTotal: number;
  isValid: boolean;
  errors: Record<string, string>;
  errorMessages: string[];
}

/**
 * Rounds a number to exactly two decimal places for currency consistency.
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Safely parses and validates a numeric currency input.
 * Strips formatting like '$' and commas. Treats blanks as 0.
 */
export function parseCurrencyInput(value: number | string | undefined | null): number {
  if (value === undefined || value === null) {
    return 0;
  }
  const cleanStr = String(value).replace(/[^0-9.-]/g, '').trim();
  if (cleanStr === '' || cleanStr === '-' || cleanStr === '.') {
    return 0;
  }
  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }
  return roundCurrency(parsed);
}

/**
 * Calculates quotation total using the formula:
 * Total = Labour + Parts + Taxes + Additional Fees − Discounts
 */
export function calculateQuoteTotal(inputs: QuoteInputValues): QuoteCalculationResult {
  const errors: Record<string, string> = {};

  const parseRaw = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '') return 0;
    const cleanStr = String(val).replace(/[^0-9.-]/g, '').trim();
    return parseFloat(cleanStr);
  };

  const rawLabor = parseRaw(inputs.laborCost);
  const rawTaxes = parseRaw(inputs.taxes);
  const rawFees = parseRaw(inputs.additionalFees);
  const rawDiscount = parseRaw(inputs.discountAmount);

  // Validate negative values
  if (!isNaN(rawLabor) && rawLabor < 0) {
    errors.laborCost = 'Labour cost cannot be negative';
  }
  if (!isNaN(rawTaxes) && rawTaxes < 0) {
    errors.taxes = 'Taxes cannot be negative';
  }
  if (!isNaN(rawFees) && rawFees < 0) {
    errors.additionalFees = 'Additional fees cannot be negative';
  }
  if (!isNaN(rawDiscount) && rawDiscount < 0) {
    errors.discountAmount = 'Discount cannot be negative';
  }

  const partsList = Array.isArray(inputs.parts) ? inputs.parts : [];
  partsList.forEach((part, index) => {
    const rawPartCost = parseRaw(part.cost);
    if (!isNaN(rawPartCost) && rawPartCost < 0) {
      errors[`part_${index}`] = `Part "${part.partName || index + 1}" cost cannot be negative`;
    }
  });

  const labor = Math.max(0, parseCurrencyInput(inputs.laborCost));
  const taxes = Math.max(0, parseCurrencyInput(inputs.taxes));
  const fees = Math.max(0, parseCurrencyInput(inputs.additionalFees));
  const discount = Math.max(0, parseCurrencyInput(inputs.discountAmount));

  // Sum parts
  let partsSubtotal = 0;
  if (partsList.length > 0) {
    partsSubtotal = roundCurrency(
      partsList.reduce((sum, part) => {
        const partCost = Math.max(0, parseCurrencyInput(part.cost));
        return sum + partCost;
      }, 0)
    );
  } else if (inputs.partsCost !== undefined) {
    const rawDirectParts = parseRaw(inputs.partsCost);
    if (!isNaN(rawDirectParts) && rawDirectParts < 0) {
      errors.partsCost = 'Parts cost cannot be negative';
    }
    partsSubtotal = Math.max(0, parseCurrencyInput(inputs.partsCost));
  }

  const grossSubtotal = roundCurrency(labor + partsSubtotal + taxes + fees);

  if (discount > grossSubtotal) {
    errors.discountAmount = `Discount ($${discount.toFixed(2)}) cannot exceed gross total ($${grossSubtotal.toFixed(2)})`;
  }

  const calculatedTotal = roundCurrency(Math.max(0, grossSubtotal - discount));
  const errorMessages = Object.values(errors);

  return {
    partsSubtotal,
    partsCost: partsSubtotal,
    laborSubtotal: labor,
    taxesAmount: taxes,
    feesAmount: fees,
    discountApplied: Math.min(discount, grossSubtotal),
    grossSubtotal,
    calculatedTotal,
    isValid: errorMessages.length === 0,
    errors,
    errorMessages,
  };
}
