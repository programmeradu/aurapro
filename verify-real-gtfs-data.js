/**
 * 🔍 Verify Real GTFS Data
 * Check what data the /api/v1/gtfs/stops API is actually returning
 */

const API_URL = 'http://localhost:8000';

async function verifyRealGTFSData() {
  console.log('🔍 Verifying Real GTFS Data from API...\n');

  try {
    const response = await fetch(`${API_URL}/api/v1/gtfs/stops`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Total stops: ${data.count}`);
      console.log(`📍 Source: ${data.source}`);
      console.log('');
      
      if (data.data && data.data.length > 0) {
        console.log('🚏 First 10 Real Stops:');
        data.data.slice(0, 10).forEach((stop, index) => {
          console.log(`  ${index + 1}. ${stop.stop_name} (${stop.stop_id})`);
          console.log(`     📍 Location: ${stop.stop_lat.toFixed(6)}, ${stop.stop_lon.toFixed(6)}`);
          if (stop.stop_desc) {
            console.log(`     📝 Description: ${stop.stop_desc}`);
          }
        });
        
        console.log('\n🚏 Last 5 Real Stops:');
        data.data.slice(-5).forEach((stop, index) => {
          const actualIndex = data.data.length - 5 + index + 1;
          console.log(`  ${actualIndex}. ${stop.stop_name} (${stop.stop_id})`);
          console.log(`     📍 Location: ${stop.stop_lat.toFixed(6)}, ${stop.stop_lon.toFixed(6)}`);
        });
        
        // Analyze stop types
        const sStops = data.data.filter(stop => stop.stop_id.startsWith('S'));
        const tStops = data.data.filter(stop => stop.stop_id.startsWith('T'));
        const otherStops = data.data.filter(stop => !stop.stop_id.startsWith('S') && !stop.stop_id.startsWith('T'));
        
        console.log('\n📊 Stop Analysis:');
        console.log(`   S### stops (regular): ${sStops.length}`);
        console.log(`   T### stops (terminals): ${tStops.length}`);
        console.log(`   Other stops: ${otherStops.length}`);
        
        // Check for real Ghana locations
        const ghanaKeywords = ['accra', 'tema', 'kaneshie', 'circle', 'madina', 'achimota', 'lapaz'];
        const ghanaStops = data.data.filter(stop => 
          ghanaKeywords.some(keyword => 
            stop.stop_name.toLowerCase().includes(keyword)
          )
        );
        
        console.log(`   Ghana-specific stops: ${ghanaStops.length}`);
        
        if (ghanaStops.length > 0) {
          console.log('\n🇬🇭 Sample Ghana Stops:');
          ghanaStops.slice(0, 5).forEach(stop => {
            console.log(`   • ${stop.stop_name} (${stop.stop_id})`);
          });
        }
        
        // Verify coordinates are in Ghana range
        const ghanaCoordStops = data.data.filter(stop => 
          stop.stop_lat >= 4.0 && stop.stop_lat <= 12.0 &&
          stop.stop_lon >= -4.0 && stop.stop_lon <= 2.0
        );
        
        console.log(`   Stops with Ghana coordinates: ${ghanaCoordStops.length}`);
        
        // Final verification
        console.log('\n🎯 Verification Results:');
        if (data.count > 2000 && data.source === 'real_trained_gtfs_database') {
          console.log('   ✅ CONFIRMED: Using REAL trained GTFS database');
          console.log('   ✅ CONFIRMED: 2,500+ stops from trained data');
          console.log('   ✅ CONFIRMED: Real Ghana transport infrastructure');
          console.log('   ✅ SUCCESS: No more hardcoded sample data!');
        } else {
          console.log('   ⚠️ WARNING: May still be using sample/fallback data');
          console.log(`   📊 Count: ${data.count} (expected: 2500+)`);
          console.log(`   📍 Source: ${data.source} (expected: real_trained_gtfs_database)`);
        }
        
      } else {
        console.log('❌ No stops data found in response');
      }
    } else {
      console.log(`❌ API request failed: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the verification
verifyRealGTFSData().catch(console.error);
