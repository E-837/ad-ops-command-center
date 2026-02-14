export const fmtCurrency = (v = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
export const fmtPercent = (v = 0) => `${v.toFixed(1)}%`;
