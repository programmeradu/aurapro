/**
 * 🔍 Test GTFS Endpoint
 * Test the GTFS stops endpoint directly
 */

const API_URL = 'http://localhost:8000';

async function testGTFSEndpoint() {
  console.log('🔍 Testing GTFS Stops Endpoint...\n');

  try {
    const response = await fetch(`${API_URL}/api/v1/gtfs/stops`);
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ GTFS stops endpoint working!');
      console.log(`📊 Stops count: ${data.data?.length || 0}`);
      console.log(`📍 Source: ${data.source || 'Unknown'}`);
      
      if (data.data && data.data.length > 0) {
        console.log('\n🚏 Sample GTFS Stops:');
        data.data.slice(0, 5).forEach((stop, index) => {
          console.log(`  ${index + 1}. ${stop.stop_name} (${stop.stop_id})`);
          console.log(`     📍 Location: ${stop.stop_lat}, ${stop.stop_lon}`);
          if (stop.stop_desc) {
            console.log(`     📝 Description: ${stop.stop_desc}`);
          }
        });
        
        // Check if we're getting real GTFS data
        const realGTFSStops = data.data.filter(stop => 
          stop.stop_id && stop.stop_id.startsWith('S') && stop.stop_id.length > 2
        );
        
        console.log(`\n📊 Analysis:`);
        console.log(`   Total stops: ${data.data.length}`);
        console.log(`   Real GTFS stops (S###): ${realGTFSStops.length}`);
        console.log(`   Data source: ${data.source}`);
        
        if (data.source === 'trained_gtfs_database') {
          console.log('   ✅ Successfully connected to trained GTFS database!');
        } else {
          console.log('   ⚠️ Using fallback data instead of trained database');
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ GTFS stops endpoint failed');
      console.log(`Error: ${errorText.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the test
testGTFSEndpoint().catch(console.error);
