// Servicio para generar reportes en diferentes formatos
import { useUser } from '@/context/UserContext';

export interface ReportData {
  tipo: 'consumo' | 'tendencia' | 'canales' | 'completo';
  formato: 'pdf' | 'excel' | 'csv';
  periodo: 'semana' | 'mes' | 'trimestre' | 'personalizado';
  fechaInicio?: string;
  fechaFin?: string;
  canal?: string;
  usuario?: {
    nombre: string;
    email: string;
    plan: string;
    creditos: number;
  };
}

// Datos simulados para reportes
const getSampleData = () => {
  return {
    consumoCreditos: [
      { fecha: '2025-01-01', consumo: 45, canal: 'Facebook' },
      { fecha: '2025-01-02', consumo: 32, canal: 'Instagram' },
      { fecha: '2025-01-03', consumo: 67, canal: 'X' },
      { fecha: '2025-01-04', consumo: 23, canal: 'LinkedIn' },
      { fecha: '2025-01-05', consumo: 89, canal: 'TikTok' },
      { fecha: '2025-01-06', consumo: 12, canal: 'Facebook' },
      { fecha: '2025-01-07', consumo: 56, canal: 'Instagram' },
      { fecha: '2025-01-08', consumo: 78, canal: 'X' },
      { fecha: '2025-01-09', consumo: 34, canal: 'LinkedIn' },
      { fecha: '2025-01-10', consumo: 45, canal: 'TikTok' }
    ],
    resumenCanales: [
      { canal: 'Facebook', consumo: 1245, porcentaje: 28.5 },
      { canal: 'Instagram', consumo: 987, porcentaje: 22.6 },
      { canal: 'X', consumo: 1156, porcentaje: 26.4 },
      { canal: 'LinkedIn', consumo: 567, porcentaje: 13.0 },
      { canal: 'TikTok', consumo: 412, porcentaje: 9.5 }
    ],
    estadisticas: {
      totalConsumo: 4367,
      promedioDiario: 145,
      diaMayorConsumo: { fecha: '2025-01-15', consumo: 234 },
      crecimiento: '+18.5%'
    }
  };
};

export class ReportGenerator {
  // Generar reporte en formato CSV
  static generateCSV(data: ReportData): string {
    const sampleData = getSampleData();
    let csvContent = '';

    // Header del reporte con información de la plataforma
    csvContent += `REPUTACIÓN ONLINE - REPORTE DE CRÉDITOS\n`;
    csvContent += `==========================================\n`;
    csvContent += `Tipo de Reporte: ${data.tipo.toUpperCase()}\n`;
    csvContent += `Formato: CSV\n`;
    csvContent += `Período: ${data.periodo}\n`;
    csvContent += `Fecha de generación: ${new Date().toLocaleDateString()}\n`;
    
    // Datos del usuario si están disponibles
    if (data.usuario) {
      csvContent += `\nDATOS DEL USUARIO\n`;
      csvContent += `Nombre: ${data.usuario.nombre}\n`;
      csvContent += `Email: ${data.usuario.email}\n`;
      csvContent += `Plan: ${data.usuario.plan}\n`;
      csvContent += `Créditos Disponibles: ${data.usuario.creditos}\n`;
    }
    
    csvContent += `\n`;

    if (data.tipo === 'consumo' || data.tipo === 'completo') {
      csvContent += 'CONSUMO POR DÍA\n';
      csvContent += 'Fecha,Consumo,Canal\n';
      sampleData.consumoCreditos.forEach(item => {
        csvContent += `${item.fecha},${item.consumo},${item.canal}\n`;
      });
      csvContent += '\n';
    }

    if (data.tipo === 'canales' || data.tipo === 'completo') {
      csvContent += 'RESUMEN POR CANALES\n';
      csvContent += 'Canal,Consumo,Porcentaje\n';
      sampleData.resumenCanales.forEach(item => {
        csvContent += `${item.canal},${item.consumo},${item.porcentaje}%\n`;
      });
      csvContent += '\n';
    }

    if (data.tipo === 'completo') {
      csvContent += 'ESTADÍSTICAS GENERALES\n';
      csvContent += `Total Consumido,${sampleData.estadisticas.totalConsumo}\n`;
      csvContent += `Promedio Diario,${sampleData.estadisticas.promedioDiario}\n`;
      csvContent += `Crecimiento,${sampleData.estadisticas.crecimiento}\n`;
    }

    // Footer corporativo
    csvContent += `\n=== REPORTE GENERADO POR REPUTACIÓN ONLINE ===\n`;
    csvContent += `Fecha y Hora: ${new Date().toLocaleString()}\n`;
    csvContent += `© 2025 Reputación Online. Todos los derechos reservados.\n`;

    return csvContent;
  }

  // Generar reporte en formato HTML (que se puede convertir a PDF)
  static generateHTML(data: ReportData): string {
    const sampleData = getSampleData();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Créditos - ${data.tipo.toUpperCase()}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          color: #333;
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #01257D; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
        }
        .header h1 {
          color: #01257D;
          margin: 0;
          font-size: 2.5em;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .section {
          margin: 30px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .section h2 {
          color: #01257D;
          border-bottom: 2px solid #059669;
          padding-bottom: 10px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 12px; 
          text-align: left; 
        }
        th { 
          background-color: #01257D; 
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background-color: #f9f9f9; 
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .stat-card {
          background: linear-gradient(135deg, #01257D, #013AAA);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-value {
          font-size: 2em;
          font-weight: bold;
          margin: 10px 0;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        .logo {
          font-size: 1.5em;
          font-weight: bold;
          color: #01257D;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section" style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <div class="logo-placeholder" style="width: 80px; height: 80px; background: linear-gradient(135deg, #01257D, #013AAA); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 20px;">
            <span style="color: white; font-size: 24px; font-weight: bold;">RO</span>
          </div>
          <div>
            <div class="logo" style="font-size: 28px; margin: 0;">🌟 Reputación Online</div>
            <div style="color: #666; font-size: 14px;">Plataforma de Análisis de Reputación Digital</div>
          </div>
        </div>
        <h1>📄 Reporte de Créditos</h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <div>
            <p><strong>Tipo:</strong> ${data.tipo.toUpperCase()}</p>
            <p><strong>Período:</strong> ${data.periodo}</p>
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          ${data.usuario ? `
          <div style="text-align: right;">
            <p><strong>Usuario:</strong> ${data.usuario.nombre}</p>
            <p><strong>Email:</strong> ${data.usuario.email}</p>
            <p><strong>Plan:</strong> ${data.usuario.plan.toUpperCase()}</p>
            <p><strong>Créditos disponibles:</strong> ${data.usuario.creditos}</p>
          </div>` : ''}
        </div>
      </div>

      ${data.tipo === 'completo' || data.tipo === 'consumo' ? `
      <div class="section">
        <h2>📊 Estadísticas Generales</h2>
        <div class="stats">
          <div class="stat-card">
            <div>Total Consumido</div>
            <div class="stat-value">${sampleData.estadisticas.totalConsumo}</div>
            <div>créditos</div>
          </div>
          <div class="stat-card">
            <div>Promedio Diario</div>
            <div class="stat-value">${sampleData.estadisticas.promedioDiario}</div>
            <div>créditos/día</div>
          </div>
          <div class="stat-card">
            <div>Crecimiento</div>
            <div class="stat-value">${sampleData.estadisticas.crecimiento}</div>
            <div>vs. período anterior</div>
          </div>
        </div>
      </div>
      ` : ''}

      ${data.tipo === 'completo' || data.tipo === 'consumo' ? `
      <div class="section">
        <h2>📈 Consumo Diario de Créditos</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Consumo</th>
              <th>Canal Principal</th>
            </tr>
          </thead>
          <tbody>
            ${sampleData.consumoCreditos.map(item => `
              <tr>
                <td>${new Date(item.fecha).toLocaleDateString()}</td>
                <td>${item.consumo} créditos</td>
                <td>${item.canal}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${data.tipo === 'completo' || data.tipo === 'canales' ? `
      <div class="section">
        <h2>📱 Consumo por Canales Sociales</h2>
        <table>
          <thead>
            <tr>
              <th>Canal</th>
              <th>Consumo Total</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            ${sampleData.resumenCanales.map(item => `
              <tr>
                <td>${item.canal}</td>
                <td>${item.consumo} créditos</td>
                <td>${item.porcentaje}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${data.tipo === 'tendencia' || data.tipo === 'completo' ? `
      <div class="section">
        <h2>📈 Análisis de Tendencias</h2>
        <p><strong>Resumen del período analizado:</strong></p>
        <ul>
          <li>Tendencia general: <strong>Crecimiento sostenido del ${sampleData.estadisticas.crecimiento}</strong></li>
          <li>Día de mayor actividad: <strong>${sampleData.estadisticas.diaMayorConsumo.fecha} (${sampleData.estadisticas.diaMayorConsumo.consumo} créditos)</strong></li>
          <li>Canal más utilizado: <strong>${sampleData.resumenCanales[0].canal} (${sampleData.resumenCanales[0].porcentaje}%)</strong></li>
          <li>Promedio diario: <strong>${sampleData.estadisticas.promedioDiario} créditos</strong></li>
        </ul>
        
        <p><strong>🎯 Recomendaciones:</strong></p>
        <ul>
          <li>Optimizar el uso en ${sampleData.resumenCanales[0].canal} para mayor eficiencia</li>
          <li>Considerar aumentar la actividad en ${sampleData.resumenCanales[sampleData.resumenCanales.length-1].canal}</li>
          <li>Mantener el patrón de crecimiento actual</li>
        </ul>
      </div>
      ` : ''}

      <div class="footer">
        <div class="logo">Reputación Online</div>
        <p>Reporte generado automáticamente el ${new Date().toLocaleString()}</p>
        <p>📧 Para soporte técnico, contacta con nuestro equipo</p>
      </div>
    </body>
    </html>
    `;
  }

  // Generar datos estructurados para Excel
  static generateExcelData(data: ReportData) {
    const sampleData = getSampleData();
    
    const workbookData = {
      SheetNames: [] as string[],
      Sheets: {} as any
    };

    // Hoja de resumen
    const resumenData = [
      ['Reporte de Créditos - ' + data.tipo.toUpperCase()],
      ['Período: ' + data.periodo],
      ['Fecha de generación: ' + new Date().toLocaleDateString()],
      [],
      ['ESTADÍSTICAS GENERALES'],
      ['Métrica', 'Valor'],
      ['Total Consumido', sampleData.estadisticas.totalConsumo + ' créditos'],
      ['Promedio Diario', sampleData.estadisticas.promedioDiario + ' créditos'],
      ['Crecimiento', sampleData.estadisticas.crecimiento],
      ['Día Mayor Consumo', sampleData.estadisticas.diaMayorConsumo.fecha + ' (' + sampleData.estadisticas.diaMayorConsumo.consumo + ' créditos)']
    ];

    workbookData.SheetNames.push('Resumen');
    workbookData.Sheets['Resumen'] = this.arrayToSheet(resumenData);

    // Hoja de consumo diario
    if (data.tipo === 'consumo' || data.tipo === 'completo') {
      const consumoData = [
        ['CONSUMO DIARIO'],
        ['Fecha', 'Consumo', 'Canal'],
        ...sampleData.consumoCreditos.map(item => [
          item.fecha,
          item.consumo,
          item.canal
        ])
      ];

      workbookData.SheetNames.push('Consumo Diario');
      workbookData.Sheets['Consumo Diario'] = this.arrayToSheet(consumoData);
    }

    // Hoja de canales
    if (data.tipo === 'canales' || data.tipo === 'completo') {
      const canalesData = [
        ['CONSUMO POR CANALES'],
        ['Canal', 'Consumo', 'Porcentaje'],
        ...sampleData.resumenCanales.map(item => [
          item.canal,
          item.consumo,
          item.porcentaje + '%'
        ])
      ];

      workbookData.SheetNames.push('Por Canales');
      workbookData.Sheets['Por Canales'] = this.arrayToSheet(canalesData);
    }

    return workbookData;
  }

  // Utilidad para convertir array a formato de hoja de Excel
  private static arrayToSheet(data: any[][]) {
    const ws: any = {};
    const range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };

    for (let R = 0; R < data.length; ++R) {
      for (let C = 0; C < data[R].length; ++C) {
        if (range.s.r > R) range.s.r = R;
        if (range.s.c > C) range.s.c = C;
        if (range.e.r < R) range.e.r = R;
        if (range.e.c < C) range.e.c = C;

        const cell = { v: data[R][C] };
        const cellRef = this.encodeCellAddress({ c: C, r: R });
        ws[cellRef] = cell;
      }
    }

    ws['!ref'] = this.encodeRange(range);
    return ws;
  }

  // Utilidades para Excel
  private static encodeCellAddress(cell: { c: number; r: number }): string {
    return this.encodeCol(cell.c) + this.encodeRow(cell.r);
  }

  private static encodeCol(col: number): string {
    let s = '';
    for (++col; col; col = Math.floor((col - 1) / 26)) {
      s = String.fromCharCode(((col - 1) % 26) + 65) + s;
    }
    return s;
  }

  private static encodeRow(row: number): string {
    return (row + 1).toString();
  }

  private static encodeRange(range: any): string {
    return this.encodeCellAddress(range.s) + ':' + this.encodeCellAddress(range.e);
  }

  // Método principal para generar y descargar reportes
  static async generateAndDownload(data: ReportData): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reporte-${data.tipo}-${timestamp}`;

    try {
      switch (data.formato) {
        case 'csv':
          const csvContent = this.generateCSV(data);
          this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
          break;

        case 'pdf':
          // Generar HTML optimizado para PDF que se ve mucho mejor
          const htmlContent = this.generatePrintableHTML(data);
          this.downloadFile(htmlContent, `${filename}-reporte.html`, 'text/html');
          break;

        case 'excel':
          // Generar contenido Excel como CSV con formato especial
          const excelContent = this.generateExcelCSV(data);
          this.downloadFile(excelContent, `${filename}.xlsx.csv`, 'text/csv');
          break;
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  }

  // Generar HTML optimizado para impresión/PDF
  static generatePrintableHTML(data: ReportData): string {
    const sampleData = getSampleData();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Créditos - ${data.tipo.toUpperCase()}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 20px; 
          color: #333;
          line-height: 1.6;
          background: white;
        }
        
        .header { 
          text-align: center; 
          border-bottom: 4px solid #01257D; 
          padding: 30px 0; 
          margin-bottom: 40px;
          background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
          border-radius: 12px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 25px;
          gap: 20px;
        }
        
        .logo-placeholder {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #01257D, #013AAA);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(1, 37, 125, 0.3);
        }
        
        .logo-text {
          color: white;
          font-size: 28px;
          font-weight: bold;
        }
        
        .company-name {
          font-size: 32px;
          font-weight: bold;
          color: #01257D;
          margin: 0;
        }
        
        .company-subtitle {
          color: #666;
          font-size: 16px;
          margin: 5px 0 0 0;
        }
        
        .header h1 {
          color: #01257D;
          margin: 20px 0 10px 0;
          font-size: 2.8em;
          font-weight: 800;
        }
        
        .header-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin: 25px 0;
          text-align: left;
        }
        
        .info-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border-left: 5px solid #059669;
        }
        
        .info-card h3 {
          color: #01257D;
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: bold;
          border-bottom: 2px solid #e3f2fd;
          padding-bottom: 8px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          padding: 5px 0;
        }
        
        .info-label {
          font-weight: 600;
          color: #555;
        }
        
        .info-value {
          color: #01257D;
          font-weight: bold;
        }
        
        .section {
          margin: 40px 0;
          padding: 25px;
          border: 1px solid #e0e7ff;
          border-radius: 16px;
          background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        
        .section h2 {
          color: #01257D;
          border-bottom: 3px solid #059669;
          padding-bottom: 12px;
          margin-bottom: 25px;
          font-size: 24px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .section-icon {
          font-size: 28px;
        }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 25px 0;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        th, td { 
          padding: 15px 20px; 
          text-align: left;
          border-bottom: 1px solid #e3f2fd;
        }
        
        th { 
          background: linear-gradient(135deg, #01257D, #013AAA);
          color: white;
          font-weight: bold;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        tr:nth-child(even) { 
          background-color: #f8faff; 
        }
        
        tr:hover {
          background-color: #e3f2fd;
          transition: background-color 0.3s ease;
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
          margin: 30px 0;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #01257D, #013AAA);
          color: white;
          padding: 25px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 8px 25px rgba(1, 37, 125, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
          z-index: 1;
        }
        
        .stat-card > * {
          position: relative;
          z-index: 2;
        }
        
        .stat-title {
          font-size: 16px;
          margin-bottom: 10px;
          opacity: 0.9;
        }
        
        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          margin: 15px 0;
        }
        
        .stat-unit {
          font-size: 14px;
          opacity: 0.8;
        }
        
        .footer {
          margin-top: 60px;
          text-align: center;
          padding: 30px;
          background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
          border-radius: 16px;
          border: 2px solid #e0e7ff;
        }
        
        .footer-logo {
          font-size: 24px;
          font-weight: bold;
          color: #01257D;
          margin-bottom: 15px;
        }
        
        .footer-info {
          color: #666;
          font-size: 14px;
          line-height: 1.8;
        }
        
        .highlight {
          background: linear-gradient(120deg, #059669, #10b981);
          color: white;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: bold;
        }
        
        .recommendations {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border-left: 5px solid #10b981;
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
        }
        
        .recommendations h4 {
          color: #059669;
          margin: 0 0 15px 0;
          font-size: 20px;
        }
        
        .recommendations ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .recommendations li {
          margin: 8px 0;
          color: #374151;
        }
        
        @page {
          margin: 2cm;
          size: A4;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .no-break {
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <div class="logo-placeholder">
            <span class="logo-text">RO</span>
          </div>
          <div>
            <div class="company-name">🌟 Reputación Online</div>
            <div class="company-subtitle">Plataforma de Análisis de Reputación Digital</div>
          </div>
        </div>
        
        <h1>📄 Reporte de Créditos</h1>
        
        <div class="header-info">
          <div class="info-card">
            <h3>📋 Información del Reporte</h3>
            <div class="info-item">
              <span class="info-label">Tipo:</span>
              <span class="info-value">${data.tipo.toUpperCase()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Período:</span>
              <span class="info-value">${data.periodo}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fecha de generación:</span>
              <span class="info-value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Hora:</span>
              <span class="info-value">${new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          
          ${data.usuario ? `
          <div class="info-card">
            <h3>👤 Datos del Usuario</h3>
            <div class="info-item">
              <span class="info-label">Usuario:</span>
              <span class="info-value">${data.usuario.nombre}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span>
              <span class="info-value">${data.usuario.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Plan:</span>
              <span class="info-value">${data.usuario.plan.toUpperCase()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Créditos disponibles:</span>
              <span class="info-value highlight">${data.usuario.creditos}</span>
            </div>
          </div>` : ''}
        </div>
      </div>

      ${data.tipo === 'completo' || data.tipo === 'consumo' ? `
      <div class="section no-break">
        <h2><span class="section-icon">📊</span> Estadísticas Generales</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-title">Total Consumido</div>
            <div class="stat-value">${sampleData.estadisticas.totalConsumo.toLocaleString()}</div>
            <div class="stat-unit">créditos</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Promedio Diario</div>
            <div class="stat-value">${sampleData.estadisticas.promedioDiario}</div>
            <div class="stat-unit">créditos/día</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Crecimiento</div>
            <div class="stat-value">${sampleData.estadisticas.crecimiento}</div>
            <div class="stat-unit">vs. período anterior</div>
          </div>
        </div>
      </div>
      ` : ''}

      ${data.tipo === 'completo' || data.tipo === 'consumo' ? `
      <div class="section">
        <h2><span class="section-icon">📈</span> Consumo Diario de Créditos</h2>
        <table>
          <thead>
            <tr>
              <th>📅 Fecha</th>
              <th>💳 Consumo</th>
              <th>📱 Canal Principal</th>
            </tr>
          </thead>
          <tbody>
            ${sampleData.consumoCreditos.map(item => `
              <tr>
                <td>${new Date(item.fecha).toLocaleDateString('es-ES', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</td>
                <td><strong>${item.consumo}</strong> créditos</td>
                <td>${item.canal}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${data.tipo === 'completo' || data.tipo === 'canales' ? `
      <div class="section">
        <h2><span class="section-icon">📱</span> Consumo por Canales Sociales</h2>
        <table>
          <thead>
            <tr>
              <th>🌐 Canal</th>
              <th>💰 Consumo Total</th>
              <th>📊 Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            ${sampleData.resumenCanales.map(item => `
              <tr>
                <td><strong>${item.canal}</strong></td>
                <td>${item.consumo.toLocaleString()} créditos</td>
                <td><span class="highlight">${item.porcentaje}%</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${data.tipo === 'tendencia' || data.tipo === 'completo' ? `
      <div class="section page-break">
        <h2><span class="section-icon">📈</span> Análisis de Tendencias</h2>
        <p><strong>📋 Resumen del período analizado:</strong></p>
        <ul style="font-size: 16px; line-height: 1.8;">
          <li><strong>Tendencia general:</strong> <span class="highlight">Crecimiento sostenido del ${sampleData.estadisticas.crecimiento}</span></li>
          <li><strong>Día de mayor actividad:</strong> <span class="highlight">${sampleData.estadisticas.diaMayorConsumo.fecha} (${sampleData.estadisticas.diaMayorConsumo.consumo} créditos)</span></li>
          <li><strong>Canal más utilizado:</strong> <span class="highlight">${sampleData.resumenCanales[0].canal} (${sampleData.resumenCanales[0].porcentaje}%)</span></li>
          <li><strong>Promedio diario:</strong> <span class="highlight">${sampleData.estadisticas.promedioDiario} créditos</span></li>
        </ul>
        
        <div class="recommendations">
          <h4>🎯 Recomendaciones Estratégicas</h4>
          <ul>
            <li><strong>Optimización:</strong> Mejorar la eficiencia en <strong>${sampleData.resumenCanales[0].canal}</strong> para maximizar el ROI</li>
            <li><strong>Expansión:</strong> Considerar aumentar la actividad en <strong>${sampleData.resumenCanales[sampleData.resumenCanales.length-1].canal}</strong></li>
            <li><strong>Crecimiento:</strong> Mantener el patrón de crecimiento actual del <strong>${sampleData.estadisticas.crecimiento}</strong></li>
            <li><strong>Monitoreo:</strong> Establecer alertas para consumos superiores a <strong>${Math.round(sampleData.estadisticas.promedioDiario * 1.5)} créditos/día</strong></li>
          </ul>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div class="footer-logo">🌟 Reputación Online</div>
        <div class="footer-info">
          <strong>Reporte generado automáticamente</strong><br>
          📅 ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} a las ${new Date().toLocaleTimeString()}<br>
          📧 Para soporte técnico, contacta con nuestro equipo<br>
          <strong>© 2025 Reputación Online. Todos los derechos reservados.</strong>
        </div>
      </div>
    </body>
    </html>
    `;
  }


  // Generar contenido Excel especializado
  static generateExcelCSV(data: ReportData): string {
    const sampleData = getSampleData();
    let content = '';

    // Información del header con logo y datos de usuario
    content += `REPUTACIÓN ONLINE - REPORTE DE CRÉDITOS\n`;
    content += `=========================================\n`;
    content += `Tipo de Reporte:,${data.tipo.toUpperCase()}\n`;
    content += `Formato:,Excel (CSV)\n`;
    content += `Período:,${data.periodo}\n`;
    content += `Fecha de Generación:,${new Date().toLocaleDateString()}\n`;
    
    if (data.usuario) {
      content += `\nDATOS DEL USUARIO\n`;
      content += `Nombre:,${data.usuario.nombre}\n`;
      content += `Email:,${data.usuario.email}\n`;
      content += `Plan:,${data.usuario.plan}\n`;
      content += `Créditos Disponibles:,${data.usuario.creditos}\n`;
    }

    content += `\nESTADÍSTICAS GENERALES\n`;
    content += `Métrica,Valor\n`;
    content += `Total Consumido,${sampleData.estadisticas.totalConsumo} créditos\n`;
    content += `Promedio Diario,${sampleData.estadisticas.promedioDiario} créditos\n`;
    content += `Crecimiento,${sampleData.estadisticas.crecimiento}\n`;
    content += `Día Mayor Consumo,${sampleData.estadisticas.diaMayorConsumo.fecha} (${sampleData.estadisticas.diaMayorConsumo.consumo} créditos)\n`;

    if (data.tipo === 'consumo' || data.tipo === 'completo') {
      content += `\nCONSUMO DIARIO\n`;
      content += `Fecha,Consumo (créditos),Canal Principal\n`;
      sampleData.consumoCreditos.forEach(item => {
        content += `${item.fecha},${item.consumo},${item.canal}\n`;
      });
    }

    if (data.tipo === 'canales' || data.tipo === 'completo') {
      content += `\nCONSUMO POR CANALES\n`;
      content += `Canal,Consumo Total,Porcentaje\n`;
      sampleData.resumenCanales.forEach(item => {
        content += `${item.canal},${item.consumo},${item.porcentaje}%\n`;
      });
    }

    content += `\n=== REPORTE GENERADO POR REPUTACIÓN ONLINE ===\n`;
    content += `Fecha y Hora: ${new Date().toLocaleString()}\n`;
    content += `© 2025 Reputación Online. Todos los derechos reservados.\n`;

    return content;
  }

  // Utilidad para descargar archivos
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}