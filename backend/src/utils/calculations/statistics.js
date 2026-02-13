// src/utils/calculations/statistics.js

/**
 * Calcular promedio
 */
const average = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Calcular máximo
 */
const max = (values) => {
  if (!values || values.length === 0) return 0;
  return Math.max(...values);
};

/**
 * Calcular mínimo
 */
const min = (values) => {
  if (!values || values.length === 0) return 0;
  return Math.min(...values);
};

/**
 * Calcular suma total
 */
const sum = (values) => {
  if (!values || values.length === 0) return 0;
  return values.reduce((acc, val) => acc + val, 0);
};

/**
 * Calcular desviación estándar
 */
const standardDeviation = (values) => {
  if (!values || values.length === 0) return 0;
  const avg = average(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
};

/**
 * Calcular mediana
 */
const median = (values) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

/**
 * Calcular percentil
 */
const percentile = (values, p) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  }
  
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

/**
 * Detectar outliers usando IQR (Interquartile Range)
 */
const detectOutliers = (values) => {
  if (!values || values.length < 4) return [];
  
  const q1 = percentile(values, 25);
  const q3 = percentile(values, 75);
  const iqr = q3 - q1;
  
  const lowerBound = q1 - (1.5 * iqr);
  const upperBound = q3 + (1.5 * iqr);
  
  return values.filter(value => value < lowerBound || value > upperBound);
};

/**
 * Calcular tasa de cambio porcentual
 */
const percentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

module.exports = {
  average,
  max,
  min,
  sum,
  standardDeviation,
  median,
  percentile,
  detectOutliers,
  percentageChange
};
