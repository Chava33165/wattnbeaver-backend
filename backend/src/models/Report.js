// src/models/Report.js
const db = require('../services/database');
const moment = require('moment');

/**
 * Modelo de Reportes
 */
class Report {
  /**
   * Reporte diario
   */
  static getDailyReport(userId, date = null) {
    const targetDate = date ? moment(date) : moment();
    const startOfDay = targetDate.startOf('day').toISOString();
    const endOfDay = targetDate.endOf('day').toISOString();

    // Consumo de energía del día
    const energyStmt = db.prepare(`
      SELECT 
        d.device_id,
        d.device_name,
        COUNT(*) as readings_count,
        AVG(er.power) as avg_power,
        MAX(er.power) as max_power,
        MIN(er.power) as min_power,
        SUM(er.energy) as total_energy,
        AVG(er.voltage) as avg_voltage
      FROM energy_readings er
      INNER JOIN devices d ON er.device_id = d.device_id
      WHERE er.user_id = ? 
        AND er.timestamp >= ? 
        AND er.timestamp <= ?
      GROUP BY d.device_id, d.device_name
    `);
    
    const energyData = energyStmt.all(userId, startOfDay, endOfDay);

    // Consumo de agua del día
    const waterStmt = db.prepare(`
      SELECT 
        d.device_id,
        d.device_name,
        COUNT(*) as readings_count,
        AVG(wr.flow) as avg_flow,
        MAX(wr.flow) as max_flow,
        MIN(wr.flow) as min_flow,
        SUM(wr.total) as total_volume
      FROM water_readings wr
      INNER JOIN devices d ON wr.device_id = d.device_id
      WHERE wr.user_id = ? 
        AND wr.timestamp >= ? 
        AND wr.timestamp <= ?
      GROUP BY d.device_id, d.device_name
    `);
    
    const waterData = waterStmt.all(userId, startOfDay, endOfDay);

    // Alertas del día
    const alertsStmt = db.prepare(`
      SELECT 
        type,
        severity,
        COUNT(*) as count
      FROM alerts
      WHERE user_id = ? 
        AND created_at >= ? 
        AND created_at <= ?
      GROUP BY type, severity
    `);
    
    const alertsData = alertsStmt.all(userId, startOfDay, endOfDay);

    // Calcular totales
    const totalEnergy = energyData.reduce((sum, d) => sum + (d.total_energy || 0), 0);
    const totalWater = waterData.reduce((sum, d) => sum + (d.total_volume || 0), 0);
    const totalAlerts = alertsData.reduce((sum, a) => sum + a.count, 0);

    return {
      date: targetDate.format('YYYY-MM-DD'),
      period: 'daily',
      energy: {
        devices: energyData,
        total_kwh: parseFloat(totalEnergy.toFixed(3)),
        total_cost: parseFloat((totalEnergy * 2.5).toFixed(2)), // $2.50/kWh
        readings_count: energyData.reduce((sum, d) => sum + d.readings_count, 0)
      },
      water: {
        devices: waterData,
        total_liters: parseFloat(totalWater.toFixed(2)),
        total_cost: parseFloat((totalWater * 0.02).toFixed(2)), // $0.02/litro
        readings_count: waterData.reduce((sum, d) => sum + d.readings_count, 0)
      },
      alerts: {
        by_type: alertsData,
        total: totalAlerts
      }
    };
  }

  /**
   * Reporte semanal
   */
  static getWeeklyReport(userId, weekStart = null) {
    const startDate = weekStart ? moment(weekStart) : moment().startOf('week');
    const endDate = moment(startDate).endOf('week');

    // Consumo por día de la semana
    const energyStmt = db.prepare(`
      SELECT 
        DATE(er.timestamp) as date,
        SUM(er.energy) as total_energy,
        AVG(er.power) as avg_power,
        COUNT(*) as readings_count
      FROM energy_readings er
      WHERE er.user_id = ? 
        AND er.timestamp >= ? 
        AND er.timestamp <= ?
      GROUP BY DATE(er.timestamp)
      ORDER BY date
    `);
    
    const energyByDay = energyStmt.all(userId, startDate.toISOString(), endDate.toISOString());

    const waterStmt = db.prepare(`
      SELECT 
        DATE(wr.timestamp) as date,
        SUM(wr.total) as total_volume,
        AVG(wr.flow) as avg_flow,
        COUNT(*) as readings_count
      FROM water_readings wr
      WHERE wr.user_id = ? 
        AND wr.timestamp >= ? 
        AND wr.timestamp <= ?
      GROUP BY DATE(wr.timestamp)
      ORDER BY date
    `);
    
    const waterByDay = waterStmt.all(userId, startDate.toISOString(), endDate.toISOString());

    // Totales de la semana
    const totalEnergy = energyByDay.reduce((sum, d) => sum + (d.total_energy || 0), 0);
    const totalWater = waterByDay.reduce((sum, d) => sum + (d.total_volume || 0), 0);

    // Comparar con semana anterior
    const prevWeekStart = moment(startDate).subtract(7, 'days');
    const prevWeekEnd = moment(endDate).subtract(7, 'days');

    const prevEnergyStmt = db.prepare(`
      SELECT SUM(energy) as total FROM energy_readings
      WHERE user_id = ? AND timestamp >= ? AND timestamp <= ?
    `);
    const prevEnergy = prevEnergyStmt.get(userId, prevWeekStart.toISOString(), prevWeekEnd.toISOString());

    const prevWaterStmt = db.prepare(`
      SELECT SUM(total) as total FROM water_readings
      WHERE user_id = ? AND timestamp >= ? AND timestamp <= ?
    `);
    const prevWater = prevWaterStmt.get(userId, prevWeekStart.toISOString(), prevWeekEnd.toISOString());

    const energyChange = prevEnergy?.total ? ((totalEnergy - prevEnergy.total) / prevEnergy.total * 100) : 0;
    const waterChange = prevWater?.total ? ((totalWater - prevWater.total) / prevWater.total * 100) : 0;

    return {
      week_start: startDate.format('YYYY-MM-DD'),
      week_end: endDate.format('YYYY-MM-DD'),
      period: 'weekly',
      energy: {
        by_day: energyByDay,
        total_kwh: parseFloat(totalEnergy.toFixed(3)),
        total_cost: parseFloat((totalEnergy * 2.5).toFixed(2)),
        avg_daily: parseFloat((totalEnergy / 7).toFixed(3)),
        change_vs_previous: parseFloat(energyChange.toFixed(2))
      },
      water: {
        by_day: waterByDay,
        total_liters: parseFloat(totalWater.toFixed(2)),
        total_cost: parseFloat((totalWater * 0.02).toFixed(2)),
        avg_daily: parseFloat((totalWater / 7).toFixed(2)),
        change_vs_previous: parseFloat(waterChange.toFixed(2))
      }
    };
  }

  /**
   * Reporte mensual
   */
  static getMonthlyReport(userId, month = null, year = null) {
    const targetMonth = month ? moment(`${year}-${month}-01`) : moment().startOf('month');
    const startOfMonth = targetMonth.startOf('month').toISOString();
    const endOfMonth = targetMonth.endOf('month').toISOString();

    // Consumo por semana del mes
    const energyStmt = db.prepare(`
      SELECT 
        strftime('%W', er.timestamp) as week,
        SUM(er.energy) as total_energy,
        AVG(er.power) as avg_power,
        COUNT(*) as readings_count
      FROM energy_readings er
      WHERE er.user_id = ? 
        AND er.timestamp >= ? 
        AND er.timestamp <= ?
      GROUP BY week
      ORDER BY week
    `);
    
    const energyByWeek = energyStmt.all(userId, startOfMonth, endOfMonth);

    const waterStmt = db.prepare(`
      SELECT 
        strftime('%W', wr.timestamp) as week,
        SUM(wr.total) as total_volume,
        AVG(wr.flow) as avg_flow,
        COUNT(*) as readings_count
      FROM water_readings wr
      WHERE wr.user_id = ? 
        AND wr.timestamp >= ? 
        AND wr.timestamp <= ?
      GROUP BY week
      ORDER BY week
    `);
    
    const waterByWeek = waterStmt.all(userId, startOfMonth, endOfMonth);

    // Dispositivos más consumidores
    const topEnergyDevices = db.prepare(`
      SELECT 
        d.device_name,
        SUM(er.energy) as total_energy,
        AVG(er.power) as avg_power
      FROM energy_readings er
      INNER JOIN devices d ON er.device_id = d.device_id
      WHERE er.user_id = ? 
        AND er.timestamp >= ? 
        AND er.timestamp <= ?
      GROUP BY d.device_id, d.device_name
      ORDER BY total_energy DESC
      LIMIT 5
    `).all(userId, startOfMonth, endOfMonth);

    const topWaterDevices = db.prepare(`
      SELECT 
        d.device_name,
        SUM(wr.total) as total_volume,
        AVG(wr.flow) as avg_flow
      FROM water_readings wr
      INNER JOIN devices d ON wr.device_id = d.device_id
      WHERE wr.user_id = ? 
        AND wr.timestamp >= ? 
        AND wr.timestamp <= ?
      GROUP BY d.device_id, d.device_name
      ORDER BY total_volume DESC
      LIMIT 5
    `).all(userId, startOfMonth, endOfMonth);

    const totalEnergy = energyByWeek.reduce((sum, w) => sum + (w.total_energy || 0), 0);
    const totalWater = waterByWeek.reduce((sum, w) => sum + (w.total_volume || 0), 0);

    const daysInMonth = targetMonth.daysInMonth();

    return {
      month: targetMonth.format('YYYY-MM'),
      period: 'monthly',
      energy: {
        by_week: energyByWeek,
        total_kwh: parseFloat(totalEnergy.toFixed(3)),
        total_cost: parseFloat((totalEnergy * 2.5).toFixed(2)),
        avg_daily: parseFloat((totalEnergy / daysInMonth).toFixed(3)),
        top_devices: topEnergyDevices
      },
      water: {
        by_week: waterByWeek,
        total_liters: parseFloat(totalWater.toFixed(2)),
        total_cost: parseFloat((totalWater * 0.02).toFixed(2)),
        avg_daily: parseFloat((totalWater / daysInMonth).toFixed(2)),
        top_devices: topWaterDevices
      },
      summary: {
        total_cost: parseFloat(((totalEnergy * 2.5) + (totalWater * 0.02)).toFixed(2)),
        days_in_month: daysInMonth
      }
    };
  }

  /**
   * Generar reporte en formato exportable
   */
  static generateExportData(userId, period, format = 'json') {
    let reportData;

    switch(period) {
      case 'daily':
        reportData = this.getDailyReport(userId);
        break;
      case 'weekly':
        reportData = this.getWeeklyReport(userId);
        break;
      case 'monthly':
        reportData = this.getMonthlyReport(userId);
        break;
      default:
        throw new Error('Periodo inválido');
    }

    if (format === 'csv') {
      return this.convertToCSV(reportData);
    }

    return reportData;
  }

  /**
   * Convertir a CSV
   */
  static convertToCSV(data) {
    // Implementación básica de CSV
    const lines = [];
    
    // Header
    lines.push('Tipo,Dispositivo,Consumo,Costo');
    
    // Energy data
    if (data.energy && data.energy.devices) {
      data.energy.devices.forEach(device => {
        lines.push(`Energía,${device.device_name},${device.total_energy} kWh,$${(device.total_energy * 2.5).toFixed(2)}`);
      });
    }
    
    // Water data
    if (data.water && data.water.devices) {
      data.water.devices.forEach(device => {
        lines.push(`Agua,${device.device_name},${device.total_volume} L,$${(device.total_volume * 0.02).toFixed(2)}`);
      });
    }
    
    return lines.join('\n');
  }
}

module.exports = Report;
