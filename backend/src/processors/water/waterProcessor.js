// src/processors/water/waterProcessor.js
const moment = require('moment');
const { average, max, min, sum } = require('../../utils/calculations/statistics');
const { getTimeRange, groupByInterval } = require('../../utils/calculations/timeUtils');

class WaterProcessor {
  constructor() {
    this.dataBuffer = [];
    this.maxBufferSize = 1000;
  }

  /**
   * Agregar datos al buffer
   */
  addData(data) {
    this.dataBuffer.push({
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });

    if (this.dataBuffer.length > this.maxBufferSize) {
      this.dataBuffer.shift();
    }
  }

  /**
   * Procesar datos de un sensor
   */
  processSensorData(sensorId, period = '24h') {
    const timeRange = getTimeRange(period);
    
    const sensorData = this.dataBuffer.filter(d =>
      d.sensor_id === sensorId &&
      moment(d.timestamp).isBetween(timeRange.start, timeRange.end)
    );

    if (sensorData.length === 0) {
      return null;
    }

    const flowValues = sensorData.map(d => d.flow || 0);
    const volumeValues = sensorData.map(d => d.total || 0);

    return {
      sensor_id: sensorId,
      period: period,
      timeRange: timeRange,
      dataPoints: sensorData.length,
      flow: {
        current: flowValues[flowValues.length - 1] || 0,
        average: average(flowValues),
        max: max(flowValues),
        min: min(flowValues)
      },
      volume: {
        total: volumeValues[volumeValues.length - 1] || 0,
        consumed: max(volumeValues) - min(volumeValues),
        average: average(volumeValues)
      },
      lastUpdate: sensorData[sensorData.length - 1].timestamp
    };
  }

  /**
   * Calcular consumo total de agua
   */
  calculateTotalConsumption(period = '24h') {
    const timeRange = getTimeRange(period);
    
    const periodData = this.dataBuffer.filter(d =>
      moment(d.timestamp).isBetween(timeRange.start, timeRange.end)
    );

    if (periodData.length === 0) {
      return {
        totalFlow: 0,
        totalVolume: 0,
        sensorCount: 0,
        period: period
      };
    }

    const bySensor = {};
    periodData.forEach(d => {
      if (!bySensor[d.sensor_id]) {
        bySensor[d.sensor_id] = [];
      }
      bySensor[d.sensor_id].push(d);
    });

    let totalFlow = 0;
    let totalVolume = 0;

    Object.keys(bySensor).forEach(sensorId => {
      const sensorData = bySensor[sensorId];
      const latestData = sensorData[sensorData.length - 1];
      
      totalFlow += latestData.flow || 0;
      totalVolume += latestData.total || 0;
    });

    return {
      totalFlow: parseFloat(totalFlow.toFixed(2)),
      totalVolume: parseFloat(totalVolume.toFixed(2)),
      sensorCount: Object.keys(bySensor).length,
      sensors: Object.keys(bySensor),
      period: period,
      timeRange: timeRange
    };
  }

  /**
   * Detectar fugas (flujo continuo sin parar)
   */
  detectLeaks(sensorId, thresholdMinutes = 30, minFlow = 1) {
    const recentData = this.dataBuffer
      .filter(d => d.sensor_id === sensorId)
      .slice(-60); // Últimos 60 registros

    if (recentData.length < 10) {
      return { leak_detected: false, reason: 'Datos insuficientes' };
    }

    // Verificar flujo continuo
    const continuousFlow = recentData.every(d => d.flow >= minFlow);
    const timeSpan = moment(recentData[recentData.length - 1].timestamp)
      .diff(moment(recentData[0].timestamp), 'minutes');

    const leakDetected = continuousFlow && timeSpan >= thresholdMinutes;

    return {
      sensor_id: sensorId,
      leak_detected: leakDetected,
      continuous_flow_minutes: timeSpan,
      threshold_minutes: thresholdMinutes,
      current_flow: recentData[recentData.length - 1].flow,
      severity: leakDetected ? (timeSpan > 60 ? 'high' : 'medium') : 'none',
      message: leakDetected 
        ? `Posible fuga detectada: flujo continuo por ${timeSpan} minutos`
        : 'No se detectaron fugas'
    };
  }

  /**
   * Analizar patrones de consumo
   */
  analyzeConsumptionPatterns(sensorId, days = 7) {
    const timeRange = getTimeRange(`${days}d`);
    
    const data = this.dataBuffer.filter(d =>
      d.sensor_id === sensorId &&
      moment(d.timestamp).isBetween(timeRange.start, timeRange.end)
    );

    if (data.length < 24) {
      return null;
    }

    // Agrupar por hora del día
    const byHour = {};
    for (let i = 0; i < 24; i++) {
      byHour[i] = [];
    }

    data.forEach(d => {
      const hour = moment(d.timestamp).hour();
      byHour[hour].push(d.flow || 0);
    });

    const hourlyPatterns = Object.keys(byHour).map(hour => ({
      hour: parseInt(hour),
      averageFlow: average(byHour[hour]),
      maxFlow: max(byHour[hour]),
      dataPoints: byHour[hour].length
    }));

    // Identificar horas pico
    const peakHours = hourlyPatterns
      .filter(h => h.averageFlow > 0)
      .sort((a, b) => b.averageFlow - a.averageFlow)
      .slice(0, 3);

    return {
      sensor_id: sensorId,
      analysis_days: days,
      hourly_patterns: hourlyPatterns,
      peak_hours: peakHours,
      total_data_points: data.length
    };
  }

  /**
   * Calcular costo de agua
   */
  calculateWaterCost(sensorId, period = '24h', costPerLiter = 0.05) {
    const processed = this.processSensorData(sensorId, period);
    
    if (!processed) {
      return null;
    }

    const volumeConsumed = processed.volume.consumed;
    const estimatedCost = volumeConsumed * costPerLiter;

    return {
      sensor_id: sensorId,
      period: period,
      volumeConsumed: parseFloat(volumeConsumed.toFixed(2)),
      costPerLiter: costPerLiter,
      estimatedCost: parseFloat(estimatedCost.toFixed(2)),
      currency: 'MXN'
    };
  }

  /**
   * Obtener resumen
   */
  getSummary() {
    return {
      bufferSize: this.dataBuffer.length,
      maxBufferSize: this.maxBufferSize,
      oldestData: this.dataBuffer[0]?.timestamp,
      newestData: this.dataBuffer[this.dataBuffer.length - 1]?.timestamp,
      uniqueSensors: [...new Set(this.dataBuffer.map(d => d.sensor_id))].length
    };
  }

  /**
   * Limpiar buffer
   */
  clearBuffer() {
    this.dataBuffer = [];
  }

  /**
   * Limpiar datos antiguos
   */
  cleanOldData(maxAgeHours = 24) {
    const cutoffTime = moment().subtract(maxAgeHours, 'hours');
    this.dataBuffer = this.dataBuffer.filter(d =>
      moment(d.timestamp).isAfter(cutoffTime)
    );
  }
}

// Singleton instance
const waterProcessor = new WaterProcessor();

module.exports = waterProcessor;
