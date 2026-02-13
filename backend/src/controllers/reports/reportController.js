// src/controllers/reports/reportController.js
const Report = require('../../models/Report');
const { success, error } = require('../../utils/response');

/**
 * Reporte diario
 */
const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    
    const report = Report.getDailyReport(req.user.id, date);

    return success(res, { report }, 'Reporte diario generado');

  } catch (err) {
    console.error('Error al generar reporte diario:', err);
    return error(res, 'Error al generar reporte diario', 500);
  }
};

/**
 * Reporte semanal
 */
const getWeeklyReport = async (req, res) => {
  try {
    const { week_start } = req.query;
    
    const report = Report.getWeeklyReport(req.user.id, week_start);

    return success(res, { report }, 'Reporte semanal generado');

  } catch (err) {
    console.error('Error al generar reporte semanal:', err);
    return error(res, 'Error al generar reporte semanal', 500);
  }
};

/**
 * Reporte mensual
 */
const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const report = Report.getMonthlyReport(req.user.id, month, year);

    return success(res, { report }, 'Reporte mensual generado');

  } catch (err) {
    console.error('Error al generar reporte mensual:', err);
    return error(res, 'Error al generar reporte mensual', 500);
  }
};

/**
 * Exportar reporte
 */
const exportReport = async (req, res) => {
  try {
    const { period, format } = req.params;

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return error(res, 'Periodo inválido', 400);
    }

    if (!['json', 'csv'].includes(format)) {
      return error(res, 'Formato inválido. Use: json o csv', 400);
    }

    const reportData = Report.generateExportData(req.user.id, period, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${period}_${Date.now()}.csv`);
      return res.send(reportData);
    }

    return success(res, { report: reportData }, 'Reporte exportado');

  } catch (err) {
    console.error('Error al exportar reporte:', err);
    return error(res, err.message || 'Error al exportar reporte', 500);
  }
};

module.exports = {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  exportReport
};
