// src/utils/calculations/timeUtils.js
const moment = require('moment');

/**
 * Obtener rango de tiempo para diferentes períodos
 */
const getTimeRange = (period) => {
  const now = moment();
  let start, end;
  
  switch (period) {
    case 'hour':
      start = moment().subtract(1, 'hour');
      end = now;
      break;
    case 'today':
      start = moment().startOf('day');
      end = now;
      break;
    case 'yesterday':
      start = moment().subtract(1, 'day').startOf('day');
      end = moment().subtract(1, 'day').endOf('day');
      break;
    case 'week':
      start = moment().startOf('week');
      end = now;
      break;
    case 'month':
      start = moment().startOf('month');
      end = now;
      break;
    case 'year':
      start = moment().startOf('year');
      end = now;
      break;
    case '24h':
      start = moment().subtract(24, 'hours');
      end = now;
      break;
    case '7d':
      start = moment().subtract(7, 'days');
      end = now;
      break;
    case '30d':
      start = moment().subtract(30, 'days');
      end = now;
      break;
    default:
      start = moment().startOf('day');
      end = now;
  }
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startUnix: start.unix(),
    endUnix: end.unix()
  };
};

/**
 * Agrupar timestamps por intervalo
 */
const groupByInterval = (data, interval = 'hour') => {
  const grouped = {};
  
  data.forEach(item => {
    let key;
    const time = moment(item.timestamp);
    
    switch (interval) {
      case 'minute':
        key = time.format('YYYY-MM-DD HH:mm');
        break;
      case 'hour':
        key = time.format('YYYY-MM-DD HH:00');
        break;
      case 'day':
        key = time.format('YYYY-MM-DD');
        break;
      case 'week':
        key = time.format('YYYY-[W]WW');
        break;
      case 'month':
        key = time.format('YYYY-MM');
        break;
      default:
        key = time.format('YYYY-MM-DD HH:00');
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
};

/**
 * Calcular duración en formato legible
 */
const formatDuration = (seconds) => {
  const duration = moment.duration(seconds, 'seconds');
  
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '0m';
};

/**
 * Verificar si un timestamp está dentro de un horario específico
 */
const isInTimeWindow = (timestamp, startHour, endHour) => {
  const hour = moment(timestamp).hour();
  
  if (startHour <= endHour) {
    return hour >= startHour && hour < endHour;
  } else {
    // Ventana que cruza medianoche (ej: 22:00 - 06:00)
    return hour >= startHour || hour < endHour;
  }
};

module.exports = {
  getTimeRange,
  groupByInterval,
  formatDuration,
  isInTimeWindow
};
