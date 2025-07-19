/**
 * 🗄️ Test GTFS Database Integration
 * Test that journey planning uses real GTFS stops from trained database
 */

const API_URL = 'http://localhost:8000';

async function testGTFSDatabase() {
  console.log('🗄️ Testing GTFS Database Integration...\n');

  try {
    const response = await fetch(`${API_URL}/api/v1/journey/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { name: 'Accra Central', lat: 5.5502, lon: -0.2174 },
        to: { name: 'Kaneshie', lat: 5.5731, lon: -0.2469 }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const firstOption = data.data.options[0];
      
      console.log('✅ Journey planning with GTFS database working!');
      console.log(`📍 Route: ${firstOption.type} (${firstOption.totalDuration} min)\n`);
      
      console.log('🗄️ GTFS Stops from Trained Database:');
      firstOption.legs.forEach((leg, index) => {
        console.log(`\nLeg ${index + 1}: ${leg.mode.toUpperCase()}`);
        console.log(`  From: ${leg.origin.name} (ID: ${leg.origin.id})`);
        console.log(`  To: ${leg.destination.name} (ID: ${leg.destination.id})`);
        
        if (leg.origin.type) {
          console.log(`    Origin Type: ${leg.origin.type}`);
        }
        if (leg.destination.type) {
          console.log(`    Destination Type: ${leg.destination.type}`);
        }
      });
      
      // Check for real GTFS stop IDs and names
      const allStops = [];
      firstOption.legs.forEach(leg => {
        allStops.push(leg.origin);
        allStops.push(leg.destination);
      });
      
      const gtfsStops = allStops.filter(stop => 
        stop.id && stop.id.includes('_') && stop.name.includes('Terminal')
      );
      
      console.log('\n📊 GTFS Database Integration Summary:');
      console.log(`   Total stops/locations: ${allStops.length}`);
      console.log(`   GTFS terminal stops: ${gtfsStops.length}`);
      
      if (gtfsStops.length > 0) {
        console.log('   ✅ Real GTFS stops from trained database!');
        console.log('   ✅ Proper stop IDs and terminal names');
        console.log('   ✅ Connected to Ghana transport infrastructure');
        
        console.log('\n🏢 GTFS Terminal Stops Found:');
        gtfsStops.forEach(stop => {
          console.log(`   • ${stop.name} (${stop.id})`);
        });
      } else {
        console.log('   ⚠️ Using fallback stops instead of GTFS database');
      }
      
      // Test GTFS stops endpoint directly
      console.log('\n🔍 Testing Direct GTFS Stops Endpoint...');
      const stopsResponse = await fetch(`${API_URL}/api/v1/gtfs/stops`);
      
      if (stopsResponse.ok) {
        const stopsData = await stopsResponse.json();
        console.log(`   ✅ GTFS stops endpoint working: ${stopsData.length} stops`);
        
        if (stopsData.length > 0) {
          console.log('   📍 Sample GTFS stops:');
          stopsData.slice(0, 5).forEach(stop => {
            console.log(`     • ${stop.stop_name} (${stop.stop_id})`);
          });
        }
      } else {
        console.log('   ⚠️ GTFS stops endpoint not accessible');
      }
      
    } else {
      console.log('❌ Journey planning failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n🎯 Expected GTFS Database Features:');
  console.log('   ✅ Real stop names from trained GTFS data');
  console.log('   ✅ Proper GTFS stop IDs (e.g., ACCRA_CENTRAL_01)');
  console.log('   ✅ Terminal and station classifications');
  console.log('   ✅ Comprehensive Ghana transport network');
  console.log('   ✅ Fallback to enhanced stops if database unavailable');
}

// Run the test
testGTFSDatabase().catch(console.error);
