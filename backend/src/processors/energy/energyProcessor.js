// src/processors/energy/energyProcessor.js
const moment = require('moment');
const { average, max, min, sum, detectOutliers } = require('../../utils/calculations/statistics');
const { getTimeRange, groupByInterval } = require('../../utils/calculations/timeUtils');

class EnergyProcessor {
  constructor() {
    this.dataBuffer = []; // Buffer temporal de datos
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

    // Mantener buffer en tamaño máximo
    if (this.dataBuffer.length > this.maxBufferSize) {
      this.dataBuffer.shift();
    }
  }

  /**
   * Procesar datos de un dispositivo
   */
  processDeviceData(deviceId, period = '24h') {
    const timeRange = getTimeRange(period);
    
    // Filtrar datos del dispositivo y período
    const deviceData = this.dataBuffer.filter(d => 
      d.device_id === deviceId &&
      moment(d.timestamp).isBetween(timeRange.start, timeRange.end)
    );

    if (deviceData.length === 0) {
      return null;
    }

    // Extraer valores
    const powerValues = deviceData.map(d => d.power || 0);
    const energyValues = deviceData.map(d => d.energy || 0);

    return {
      device_id: deviceId,
      period: period,
      timeRange: timeRange,
      dataPoints: deviceData.length,
      power: {
        current: powerValues[powerValues.length - 1] || 0,
        average: average(powerValues),
        max: max(powerValues),
        min: min(powerValues),
        outliers: detectOutliers(powerValues)
      },
      energy: {
        total: energyValues[energyValues.length - 1] || 0,
        consumed: max(energyValues) - min(energyValues),
        average: average(energyValues)
      },
      lastUpdate: deviceData[deviceData.length - 1].timestamp
    };
  }

  /**
   * Calcular consumo total de todos los dispositivos
   */
  calculateTotalConsumption(period = '24h') {
    const timeRange = getTimeRange(period);
    
    const periodData = this.dataBuffer.filter(d =>
      moment(d.timestamp).isBetween(timeRange.start, timeRange.end)
    );

    if (periodData.length === 0) {
      return {
        totalPower: 0,
        totalEnergy: 0,
        deviceCount: 0,
        period: period
      };
    }

    // Agrupar por dispositivo
    const byDevice = {};
    periodData.forEach(d => {
      if (!byDevice[d.device_id]) {
        byDevice[d.device_id] = [];
      }
      byDevice[d.device_id].push(d);
    });

    // Calcular totales
    let totalPower = 0;
    let totalEnergy = 0;

    Object.keys(byDevice).forEach(deviceId => {
      const deviceData = byDevice[deviceId];
      const latestData = deviceData[deviceData.length - 1];
      
      totalPower += latestData.power || 0;
      totalEnergy += latestData.energy || 0;
    });

    return {
      totalPower: parseFloat(totalPower.toFixed(2)),
      totalEnergy: parseFloat(totalEnergy.toFixed(3)),
      deviceCount: Object.keys(byDevice).length,
      devices: Object.keys(byDevice),
      period: period,
      timeRange: timeRange
    };
  }

  /**
   * Analizar tendencias de consumo
   */
  analyzeTrends(deviceId, interval = 'hour') {
    const data = this.dataBuffer.filter(d => d.device_id === deviceId);
    
    if (data.length < 2) {
      return null;
    }

    const grouped = groupByInterval(data, interval);
    const trends = [];

    Object.keys(grouped).sort().forEach(key => {
      const groupData = grouped[key];
      const powerValues = groupData.map(d => d.power || 0);
      
      trends.push({
        timestamp: key,
        averagePower: average(powerValues),
        maxPower: max(powerValues),
        minPower: min(powerValues),
        dataPoints: groupData.length
      });
    });

    return {
      device_id: deviceId,
      interval: interval,
      trends: trends
    };
  }

  /**
   * Detectar picos de consumo
   */
  detectPowerSpikes(deviceId, threshold = 1000) {
    const deviceData = this.dataBuffer.filter(d => d.device_id === deviceId);
    
    const spikes = deviceData.filter(d => d.power > threshold);
    
    return {
      device_id: deviceId,
      threshold: threshold,
      spikesCount: spikes.length,
      spikes: spikes.map(s => ({
        power: s.power,
        timestamp: s.timestamp
      }))
    };
  }

  /**
   * Calcular costo estimado de energía
   */
  calculateEnergyCost(deviceId, period = '24h', costPerKwh = 2.5) {
    const processed = this.processDeviceData(deviceId, period);
    
    if (!processed) {
      return null;
    }

    const energyConsumed = processed.energy.consumed;
    const estimatedCost = energyConsumed * costPerKwh;

    return {
      device_id: deviceId,
      period: period,
      energyConsumed: parseFloat(energyConsumed.toFixed(3)),
      costPerKwh: costPerKwh,
      estimatedCost: parseFloat(estimatedCost.toFixed(2)),
      currency: 'MXN'
    };
  }

  /**
   * Comparar períodos
   */
  comparePeriods(deviceId, period1 = 'today', period2 = 'yesterday') {
    const data1 = this.processDeviceData(deviceId, period1);
    const data2 = this.processDeviceData(deviceId, period2);

    if (!data1 || !data2) {
      return null;
    }

    const powerDiff = data1.power.average - data2.power.average;
    const powerChangePercent = ((powerDiff / data2.power.average) * 100).toFixed(2);

    const energyDiff = data1.energy.consumed - data2.energy.consumed;
    const energyChangePercent = ((energyDiff / data2.energy.consumed) * 100).toFixed(2);

    return {
      device_id: deviceId,
      period1: {
        name: period1,
        power: data1.power.average,
        energy: data1.energy.consumed
      },
      period2: {
        name: period2,
        power: data2.power.average,
        energy: data2.energy.consumed
      },
      comparison: {
        powerDifference: parseFloat(powerDiff.toFixed(2)),
        powerChangePercent: parseFloat(powerChangePercent),
        energyDifference: parseFloat(energyDiff.toFixed(3)),
        energyChangePercent: parseFloat(energyChangePercent),
        trend: energyDiff > 0 ? 'increasing' : 'decreasing'
      }
    };
  }

  /**
   * Obtener resumen general
   */
  getSummary() {
    return {
      bufferSize: this.dataBuffer.length,
      maxBufferSize: this.maxBufferSize,
      oldestData: this.dataBuffer[0]?.timestamp,
      newestData: this.dataBuffer[this.dataBuffer.length - 1]?.timestamp,
      uniqueDevices: [...new Set(this.dataBuffer.map(d => d.device_id))].length
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
const energyProcessor = new EnergyProcessor();

module.exports = energyProcessor;
