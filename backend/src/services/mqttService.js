// src/services/mqttService.js
const mqtt = require('mqtt');
const config = require('../config/config');
const energyProcessor = require('../processors/energy/energyProcessor');
const waterProcessor = require('../processors/water/waterProcessor');
const alertManager = require('../processors/alerts/alertManager');

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.messageCount = 0;
    this.lastMessageTime = null;
    this.config = config.mqtt;
  }

  /**
   * Conectar al broker MQTT
   */
  connect() {
    console.log('🔌 Conectando a MQTT broker...');
    console.log(`   Host: ${this.config.broker}:${this.config.port}`);
    console.log(`   Usuario: ${this.config.username}`);

    // ⭐ AGREGAR ESTOS LOGS DE DEBUG
    console.log('🔍 DEBUG: Credenciales MQTT:');
    console.log(`   Username: "${this.config.username}"`);
    console.log(`   Password: "${this.config.password}"`);
    console.log(`   Password length: ${this.config.password ? this.config.password.length : 0}`);

    // Opciones de conexión MEJORADAS
    const options = {
      clientId: `wattnbeaber-backend-${Math.random().toString(16).substr(2, 8)}`,
      username: this.config.username,
      password: this.config.password,
      clean: true,
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      will: {
        topic: 'wattnbeaber/system/status',
        payload: JSON.stringify({
          status: 'offline',
          timestamp: new Date().toISOString()
        }),
        qos: 0,
        retain: false
      }
    };

    // Crear cliente MQTT
    this.client = mqtt.connect(`mqtt://127.0.0.1:${this.config.port}`, options);

    // Evento: Conexión exitosa
    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Conectado a MQTT broker');

      // Publicar estado online
      this.publish('wattnbeaber/system/status', {
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });

      // Suscribirse a topics
      this.subscribeToTopics();
    });

    // Manejar mensajes recibidos
    this.client.on('message', (topic, message) => {
      try {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`📨 [${timestamp}] ${topic}`);
        
        const data = JSON.parse(message.toString());

        // Procesar según el tipo de topic
        if (topic.startsWith('wattnbeaber/energy/')) {
          this.handleEnergyMessage(topic, data);
        } else if (topic.startsWith('wattnbeaber/water/')) {
          this.handleWaterMessage(topic, data);
        } else if (topic.startsWith('wattnbeaber/system/')) {
          console.log('🔧 Mensaje del sistema:', topic, data);
        }
      } catch (error) {
        console.error('❌ Error al procesar mensaje MQTT:', error);
        console.error('Topic:', topic);
        console.error('Message:', message.toString());
      }
    });

    // Evento: Error
    this.client.on('error', (error) => {
      console.error('❌ Error MQTT:', error.message);
      this.isConnected = false;
    });

    // Evento: Desconexión
    this.client.on('close', () => {
      this.isConnected = false;
      console.log('⚠️  Desconectado del broker MQTT');
    });

    // Evento: Reconexión
    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`🔄 Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Máximo de intentos de reconexión alcanzado');
        this.client.end();
      }
    });

    // Evento: Offline
    this.client.on('offline', () => {
      this.isConnected = false;
      console.log('📡 Cliente MQTT offline');
    });
  }

  /**
   * Suscribirse a todos los topics necesarios
   */
  subscribeToTopics() {
    const topics = [
      'wattnbeaber/energy/#',    // Todos los topics de energía
      'wattnbeaber/water/#',     // Todos los topics de agua
      'wattnbeaber/system/#'     // Topics del sistema
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error(`❌ Error al suscribirse a ${topic}:`, err);
        } else {
          console.log(`📬 Suscrito a: ${topic}`);
        }
      });
    });
  }

  /**
   * Manejar mensajes de energía
   */
  async handleEnergyMessage(topic, data) {
    // Extraer device_id del topic
    const parts = topic.split('/');
    const deviceId = parts[2];
    const dataType = parts[3];

    // Si es un mensaje de estado general del dispositivo
    if (dataType === 'status' || topic.endsWith('/data')) {
      // Procesar datos
      const processedData = {
        device_id: deviceId,
        power: data.power || 0,
        voltage: data.voltage || 0,
        current: data.current || 0,
        energy: data.energy || 0,
        timestamp: data.timestamp || new Date().toISOString()
      };

      // Agregar al procesador (memoria)
      energyProcessor.addData(processedData);

      // ⭐ NUEVO: Guardar en base de datos
      const readingsService = require('./readingsService');
      console.log(`💾 Intentando guardar lectura de energía: ${deviceId}`);
      const savedId = await readingsService.saveEnergyReading(deviceId, processedData);
      if (savedId) {
        console.log(`✅ Lectura de energía guardada: ID ${savedId}`);
      }

      // Verificar alertas
      alertManager.checkEnergyConsumption(
        deviceId,
        processedData.power,
        processedData.voltage
      );
    }
  }

  /**
   * Manejar mensajes de agua
   */
  async handleWaterMessage(topic, data) {
    // Extraer sensor_id del topic
    const parts = topic.split('/');
    const sensorId = parts[2];
    const dataType = parts[3];

    // Si es un mensaje de estado general del sensor
    if (dataType === 'status' || topic.endsWith('/data')) {
      // Procesar datos
      const processedData = {
        sensor_id: sensorId,
        flow: data.flow || 0,
        total: data.total || 0,
        timestamp: data.timestamp || new Date().toISOString()
      };

      // Agregar al procesador (memoria)
      waterProcessor.addData(processedData);

      // ⭐ NUEVO: Guardar en base de datos
      const readingsService = require('./readingsService');
      console.log(`💾 Intentando guardar lectura de agua: ${sensorId}`);
      const savedId = await readingsService.saveWaterReading(sensorId, processedData);
      if (savedId) {
        console.log(`✅ Lectura de agua guardada: ID ${savedId}`);
      }

      // Detectar fugas
      const leakDetection = waterProcessor.detectLeaks(sensorId);

      // Verificar alertas
      alertManager.checkWaterFlow(
        sensorId,
        processedData.flow,
        leakDetection.leak_detected
      );
    }
  }

  /**
   * Publicar mensaje en un topic
   */
  publish(topic, data, options = {}) {
    if (!this.isConnected) {
      console.error('❌ No conectado a MQTT broker');
      return false;
    }

    const message = typeof data === 'object' ? JSON.stringify(data) : data;
    const publishOptions = {
      qos: options.qos || 0,
      retain: options.retain || false
    };

    this.client.publish(topic, message, publishOptions, (err) => {
      if (err) {
        console.error(`❌ Error al publicar en ${topic}:`, err);
      } else {
        console.log(`📤 Publicado en ${topic}`);
      }
    });

    return true;
  }

  /**
   * Enviar comando a dispositivo de energía
   */
  sendEnergyCommand(deviceId, command) {
    const topic = `wattnbeaber/energy/${deviceId}/command`;
    const payload = {
      command: command, // 'on', 'off', 'toggle'
      timestamp: new Date().toISOString()
    };

    return this.publish(topic, payload);
  }

  /**
   * Enviar comando a sensor de agua
   */
  sendWaterCommand(sensorId, command) {
    const topic = `wattnbeaber/water/${sensorId}/command`;
    const payload = {
      command: command,
      timestamp: new Date().toISOString()
    };

    return this.publish(topic, payload);
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      messageCount: this.messageCount,
      lastMessageTime: this.lastMessageTime,
      reconnectAttempts: this.reconnectAttempts,
      broker: `${this.config.broker}:${this.config.port}`,
      clientId: this.client?.options?.clientId || null
    };
  }

  /**
   * Desconectar del broker
   */
  disconnect() {
    if (this.client) {
      console.log('👋 Desconectando de MQTT broker...');

      // Publicar estado offline
      this.publish('wattnbeaber/system/status', {
        status: 'offline',
        timestamp: new Date().toISOString()
      });

      this.client.end();
      this.isConnected = false;
      console.log('✅ Desconectado');
    }
  }

  /**
   * 🎮 Procesar gamificación automática para un usuario
   * Se ejecuta cada vez que llega una nueva lectura
   */
  async processGamification(userId) {
    if (!userId) {
      console.warn('⚠️  No se pudo procesar gamificación: userId no proporcionado');
      return;
    }

    try {
      const Gamification = require('../models/Gamification');

      console.log(`🎮 Procesando gamificación para usuario ${userId}...`);

      const result = await Gamification.processGamification(userId);

      // Log de resultados importantes
      if (result.achievements && result.achievements.length > 0) {
        console.log(`   🏆 ${result.achievements.length} nuevo(s) logro(s) desbloqueado(s)`);
      }

      if (result.challenges && result.challenges.completed && result.challenges.completed.length > 0) {
        console.log(`   🎯 ${result.challenges.completed.length} reto(s) completado(s)`);
      }

      if (result.streak && result.streak.milestone && result.streak.milestone.reached) {
        console.log(`   🔥 Hito de racha alcanzado: ${result.streak.milestone.days} días`);
      }

      return result;
    } catch (error) {
      console.error('❌ Error al procesar gamificación:', error);
      // No lanzar error para no interrumpir el flujo de lecturas
    }
  }
}

// Singleton instance
const mqttService = new MQTTService();

module.exports = mqttService;