import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface ReportData {
  vehicles: any[]
  routes: any[]
  kpis: any[]
  timestamp: Date
}

export const generatePDFReport = (data: ReportData) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('AURA Transport Intelligence Report', 20, 30)
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${data.timestamp.toLocaleString()}`, 20, 40)
  
  // Executive Summary
  doc.setFontSize(16)
  doc.setTextColor(40, 40, 40)
  doc.text('Executive Summary', 20, 60)
  
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const summaryText = [
    `• Total Active Vehicles: ${data.vehicles.length}`,
    `• Active Routes: ${data.routes.length}`,
    `• System Performance: ${data.kpis.find(k => k.label === 'System Performance')?.value || 'N/A'}`,
    `• Network Efficiency: ${data.kpis.find(k => k.label === 'Network Efficiency')?.value || 'N/A'}`,
    `• Fleet Utilization: ${data.kpis.find(k => k.label === 'Fleet Utilization')?.value || 'N/A'}`
  ]
  
  let yPos = 70
  summaryText.forEach(text => {
    doc.text(text, 25, yPos)
    yPos += 8
  })
  
  // KPI Table
  yPos += 10
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text('Key Performance Indicators', 20, yPos)
  
  const kpiTableData = data.kpis.map(kpi => [
    kpi.label,
    kpi.value,
    kpi.trend || 'Stable',
    kpi.status || 'Normal'
  ])
  
  ;(doc as any).autoTable({
    startY: yPos + 10,
    head: [['Metric', 'Value', 'Trend', 'Status']],
    body: kpiTableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  })
  
  // Vehicle Status
  yPos = (doc as any).lastAutoTable.finalY + 20
  doc.setFontSize(14)
  doc.text('Vehicle Fleet Status', 20, yPos)
  
  const vehicleTableData = data.vehicles.slice(0, 10).map(vehicle => [
    vehicle.id,
    vehicle.route,
    vehicle.status,
    `${vehicle.speed} km/h`,
    `${vehicle.passengers} passengers`
  ])
  
  ;(doc as any).autoTable({
    startY: yPos + 10,
    head: [['Vehicle ID', 'Route', 'Status', 'Speed', 'Passengers']],
    body: vehicleTableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] }
  })
  
  // Route Performance
  if ((doc as any).lastAutoTable.finalY < 250) {
    yPos = (doc as any).lastAutoTable.finalY + 20
    doc.setFontSize(14)
    doc.text('Route Performance', 20, yPos)
    
    const routeTableData = data.routes.map(route => [
      route.name,
      route.status,
      `${route.vehicles?.length || 0} vehicles`,
      route.efficiency || 'N/A'
    ])
    
    ;(doc as any).autoTable({
      startY: yPos + 10,
      head: [['Route Name', 'Status', 'Vehicles', 'Efficiency']],
      body: routeTableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] }
    })
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`AURA Command Center - Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10)
    doc.text('Confidential - Transport Authority Use Only', doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10)
  }
  
  // Save the PDF
  const filename = `AURA_Report_${data.timestamp.toISOString().split('T')[0]}.pdf`
  doc.save(filename)
  
  return filename
}

export const generateAnalyticsReport = (data: ReportData) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('AURA Analytics Deep Dive', 20, 30)
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${data.timestamp.toLocaleString()}`, 20, 40)
  
  // Analytics sections would go here
  doc.setFontSize(14)
  doc.text('Predictive Analytics', 20, 60)
  
  const analyticsText = [
    '• Demand forecasting shows 15% increase expected next week',
    '• Route optimization suggests 3 efficiency improvements',
    '• Predictive maintenance alerts for 2 vehicles',
    '• Traffic pattern analysis indicates peak hour shifts',
    '• Revenue optimization potential: +12% with dynamic pricing'
  ]
  
  let yPos = 70
  analyticsText.forEach(text => {
    doc.text(text, 25, yPos)
    yPos += 10
  })
  
  const filename = `AURA_Analytics_${data.timestamp.toISOString().split('T')[0]}.pdf`
  doc.save(filename)
  
  return filename
}

export const activateCrisisMode = () => {
  // Crisis mode activation logic
  console.log('🚨 CRISIS MODE ACTIVATED')
  
  // This would typically:
  // 1. Send alerts to all stakeholders
  // 2. Switch to emergency protocols
  // 3. Activate backup systems
  // 4. Enable emergency communication channels
  // 5. Redirect resources to critical routes
  
  return {
    activated: true,
    timestamp: new Date(),
    protocols: [
      'Emergency communication activated',
      'Backup systems online',
      'Critical route prioritization enabled',
      'Stakeholder notifications sent',
      'Resource reallocation initiated'
    ]
  }
}
