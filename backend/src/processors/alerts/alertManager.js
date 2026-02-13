// src/processors/alerts/alertManager.js
const moment = require('moment');

class AlertManager {
  constructor() {
    this.alerts = [];
    this.maxAlerts = 100;
    this.alertRules = {
      energy: {
        highPower: { threshold: 2000, severity: 'warning' },
        veryHighPower: { threshold: 3000, severity: 'critical' },
        lowVoltage: { threshold: 110, severity: 'warning' },
        highVoltage: { threshold: 135, severity: 'warning' }
      },
      water: {
        highFlow: { threshold: 50, severity: 'warning' },
        leak: { threshold: 30, severity: 'critical' }
      }
    };
  }

  /**
   * Crear nueva alerta
   */
  createAlert(type, deviceId, message, severity = 'info', data = {}) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type, // 'energy', 'water', 'system'
      device_id: deviceId,
      message: message,
      severity: severity, // 'info', 'warning', 'critical'
      data: data,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.unshift(alert);

    // Mantener límite de alertas
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    console.log(`🚨 [${severity.toUpperCase()}] ${type}: ${message}`);
    
    return alert;
  }

  /**
   * Verificar consumo de energía
   */
  checkEnergyConsumption(deviceId, power, voltage) {
    const alerts = [];

    // Verificar potencia alta
    if (power > this.alertRules.energy.veryHighPower.threshold) {
      alerts.push(
        this.createAlert(
          'energy',
          deviceId,
          `Potencia crítica: ${power}W excede ${this.alertRules.energy.veryHighPower.threshold}W`,
          'critical',
          { power, threshold: this.alertRules.energy.veryHighPower.threshold }
        )
      );
    } else if (power > this.alertRules.energy.highPower.threshold) {
      alerts.push(
        this.createAlert(
          'energy',
          deviceId,
          `Potencia alta: ${power}W excede ${this.alertRules.energy.highPower.threshold}W`,
          'warning',
          { power, threshold: this.alertRules.energy.highPower.threshold }
        )
      );
    }

    // Verificar voltaje
    if (voltage < this.alertRules.energy.lowVoltage.threshold) {
      alerts.push(
        this.createAlert(
          'energy',
          deviceId,
          `Voltaje bajo: ${voltage}V por debajo de ${this.alertRules.energy.lowVoltage.threshold}V`,
          'warning',
          { voltage, threshold: this.alertRules.energy.lowVoltage.threshold }
        )
      );
    } else if (voltage > this.alertRules.energy.highVoltage.threshold) {
      alerts.push(
        this.createAlert(
          'energy',
          deviceId,
          `Voltaje alto: ${voltage}V excede ${this.alertRules.energy.highVoltage.threshold}V`,
          'warning',
          { voltage, threshold: this.alertRules.energy.highVoltage.threshold }
        )
      );
    }

    return alerts;
  }

  /**
   * Verificar consumo de agua
   */
  checkWaterFlow(sensorId, flow, leakDetected = false) {
    const alerts = [];

    // Verificar fuga
    if (leakDetected) {
      alerts.push(
        this.createAlert(
          'water',
          sensorId,
          `Posible fuga detectada: flujo continuo de ${flow}L/min`,
          'critical',
          { flow, leak: true }
        )
      );
    }

    // Verificar flujo alto
    if (flow > this.alertRules.water.highFlow.threshold) {
      alerts.push(
        this.createAlert(
          'water',
          sensorId,
          `Flujo alto: ${flow}L/min excede ${this.alertRules.water.highFlow.threshold}L/min`,
          'warning',
          { flow, threshold: this.alertRules.water.highFlow.threshold }
        )
      );
    }

    return alerts;
  }

  /**
   * Obtener todas las alertas
   */
  getAllAlerts(filters = {}) {
    let filtered = [...this.alerts];

    // Filtrar por tipo
    if (filters.type) {
      filtered = filtered.filter(a => a.type === filters.type);
    }

    // Filtrar por severidad
    if (filters.severity) {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }

    // Filtrar por dispositivo
    if (filters.device_id) {
      filtered = filtered.filter(a => a.device_id === filters.device_id);
    }

    // Filtrar por estado
    if (filters.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === filters.acknowledged);
    }

    if (filters.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === filters.resolved);
    }

    // Filtrar por período
    if (filters.since) {
      const since = moment(filters.since);
      filtered = filtered.filter(a => moment(a.timestamp).isAfter(since));
    }

    // Limitar cantidad
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Obtener alerta por ID
   */
  getAlertById(alertId) {
    return this.alerts.find(a => a.id === alertId);
  }

  /**
   * Reconocer alerta
   */
  acknowledgeAlert(alertId) {
    const alert = this.getAlertById(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      return alert;
    }
    return null;
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId, resolution = '') {
    const alert = this.getAlertById(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
      return alert;
    }
    return null;
  }

  /**
   * Obtener estadísticas de alertas
   */
  getAlertStats(period = '24h') {
    const since = moment().subtract(
      parseInt(period),
      period.includes('h') ? 'hours' : 'days'
    );

    const recentAlerts = this.alerts.filter(a =>
      moment(a.timestamp).isAfter(since)
    );

    return {
      total: recentAlerts.length,
      bySeverity: {
        info: recentAlerts.filter(a => a.severity === 'info').length,
        warning: recentAlerts.filter(a => a.severity === 'warning').length,
        critical: recentAlerts.filter(a => a.severity === 'critical').length
      },
      byType: {
        energy: recentAlerts.filter(a => a.type === 'energy').length,
        water: recentAlerts.filter(a => a.type === 'water').length,
        system: recentAlerts.filter(a => a.type === 'system').length
      },
      acknowledged: recentAlerts.filter(a => a.acknowledged).length,
      unacknowledged: recentAlerts.filter(a => !a.acknowledged).length,
      resolved: recentAlerts.filter(a => a.resolved).length,
      unresolved: recentAlerts.filter(a => !a.resolved).length,
      period: period
    };
  }

  /**
   * Actualizar reglas de alertas
   */
  updateAlertRule(category, rule, threshold, severity) {
    if (this.alertRules[category] && this.alertRules[category][rule]) {
      this.alertRules[category][rule] = { threshold, severity };
      return true;
    }
    return false;
  }

  /**
   * Limpiar alertas antiguas resueltas
   */
  cleanOldAlerts(daysOld = 7) {
    const cutoff = moment().subtract(daysOld, 'days');
    this.alerts = this.alerts.filter(a =>
      !a.resolved || moment(a.timestamp).isAfter(cutoff)
    );
  }

  /**
   * Limpiar todas las alertas
   */
  clearAllAlerts() {
    this.alerts = [];
  }
}

// Singleton instance
const alertManager = new AlertManager();

module.exports = alertManager;
