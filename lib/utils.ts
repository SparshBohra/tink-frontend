export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(Number(value))) return '$0.00';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(value));
}; 