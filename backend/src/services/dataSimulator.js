// src/services/dataSimulator.js
const energyProcessor = require('../processors/energy/energyProcessor');
const waterProcessor = require('../processors/water/waterProcessor');
const alertManager = require('../processors/alerts/alertManager');
const mqttService = require('./mqttService');

class DataSimulator {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    // ⭐ ACTUALIZAR: Usar IDs de dispositivos reales vinculados
    this.devices = ['sonoff_01', 'sonoff_02', 'sonoff_kitchen']; // Agregar los que existan
    this.sensors = ['sensor_01', 'sensor_02', 'sensor_bathroom']; // Agregar los que existan
  }

  /**
   * Iniciar simulación
   */
  start(intervalMs = 5000) {
    if (this.isRunning) {
      console.log('⚠️  Simulador ya está corriendo');
      return;
    }

    console.log('🎮 Iniciando simulador de datos...');
    this.isRunning = true;

    this.interval = setInterval(() => {
      this.generateEnergyData();
      this.generateWaterData();
      this.checkAlerts();
    }, intervalMs);

    console.log(`✅ Simulador iniciado (intervalo: ${intervalMs}ms)`);
  }

  /**
   * Detener simulación
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Simulador no está corriendo');
      return;
    }

    clearInterval(this.interval);
    this.isRunning = false;
    console.log('🛑 Simulador detenido');
  }

  /**
   * Generar datos de energía
   */
  generateEnergyData() {
    this.devices.forEach(deviceId => {
      const baseVoltage = 127;
      const voltage = baseVoltage + (Math.random() * 6 - 3); // 124-130V
      
      // Simular patrones realistas
      const hour = new Date().getHours();
      let basePower = 0;

      // Refrigerador (siempre encendido)
      if (deviceId === 'sonoff_01') {
        basePower = Math.random() < 0.7 ? 150 : 0; // 70% del tiempo encendido
      }
      // Lavadora (horarios específicos)
      else if (deviceId === 'sonoff_02') {
        if (hour >= 10 && hour <= 12) {
          basePower = 500 + Math.random() * 300; // 500-800W
        } else {
          basePower = 0;
        }
      }

      const power = basePower + (Math.random() * 20 - 10);
      const current = power / voltage;
      const energy = Math.random() * 10;

      const data = {
        device_id: deviceId,
        power: parseFloat(power.toFixed(2)),
        voltage: parseFloat(voltage.toFixed(2)),
        current: parseFloat(current.toFixed(2)),
        energy: parseFloat(energy.toFixed(3)),
        timestamp: new Date().toISOString()
      };

      energyProcessor.addData(data);
      
      // Publicar en MQTT
      if (mqttService.isConnected) {
        mqttService.publish(`wattnbeaber/energy/${deviceId}/data`, data);
      }
    });
  }

  /**
   * Generar datos de agua
   */
  generateWaterData() {
    this.sensors.forEach(sensorId => {
      const hour = new Date().getHours();
      let flow = 0;

      // Baño - más uso en mañana y noche
      if (sensorId === 'sensor_01') {
        if ((hour >= 6 && hour <= 9) || (hour >= 19 && hour <= 22)) {
          flow = Math.random() * 20; // 0-20 L/min
        } else {
          flow = Math.random() * 2; // 0-2 L/min
        }
      }
      // Cocina - horarios de comida
      else if (sensorId === 'sensor_02') {
        if ((hour >= 7 && hour <= 9) || (hour >= 13 && hour <= 15) || (hour >= 19 && hour <= 21)) {
          flow = Math.random() * 15; // 0-15 L/min
        } else {
          flow = Math.random() * 1; // 0-1 L/min
        }
      }

      const data = {
        sensor_id: sensorId,
        flow: parseFloat(flow.toFixed(2)),
        total: parseFloat((Math.random() * 2000).toFixed(2)),
        timestamp: new Date().toISOString()
      };

      waterProcessor.addData(data);
      
      // Publicar en MQTT
      if (mqttService.isConnected) {
        mqttService.publish(`wattnbeaber/water/${sensorId}/data`, data);
      }
    });
  }

  /**
   * Verificar condiciones de alerta
   */
  checkAlerts() {
    // Verificar energía
    this.devices.forEach(deviceId => {
      const latest = energyProcessor.dataBuffer
        .filter(d => d.device_id === deviceId)
        .slice(-1)[0];

      if (latest) {
        alertManager.checkEnergyConsumption(
          deviceId,
          latest.power,
          latest.voltage
        );
      }
    });

    // Verificar agua
    this.sensors.forEach(sensorId => {
      const latest = waterProcessor.dataBuffer
        .filter(d => d.sensor_id === sensorId)
        .slice(-1)[0];

      if (latest) {
        const leakCheck = waterProcessor.detectLeaks(sensorId);
        alertManager.checkWaterFlow(
          sensorId,
          latest.flow,
          leakCheck.leak_detected
        );
      }
    });
  }

  /**
   * Estado del simulador
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      devices: this.devices,
      sensors: this.sensors,
      energyBufferSize: energyProcessor.dataBuffer.length,
      waterBufferSize: waterProcessor.dataBuffer.length,
      alertsCount: alertManager.alerts.length
    };
  }
}

// Singleton instance
const dataSimulator = new DataSimulator();

module.exports = dataSimulator;
