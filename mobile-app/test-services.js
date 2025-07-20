// Simple test to check if services can be imported
const { apiService, unifiedDataService, analyticsService } = require('./services/index.ts')

console.log('✅ Services imported successfully!')
console.log('API Service:', typeof apiService)
console.log('Unified Data Service:', typeof unifiedDataService)
console.log('Analytics Service:', typeof analyticsService)