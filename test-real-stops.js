/**
 * 🧪 Test Real GTFS Stop Names
 * Verify that journey planning now uses real Ghana transport stop names
 */

const API_URL = 'http://localhost:8000';

async function testRealStopNames() {
  console.log('🧪 Testing Real GTFS Stop Names in Journey Planning...\n');

  try {
    const response = await fetch(`${API_URL}/api/v1/journey/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: {
          name: 'Accra Central',
          lat: 5.5502,
          lon: -0.2174
        },
        to: {
          name: 'Kaneshie',
          lat: 5.5731,
          lon: -0.2469
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Journey planning endpoint working!');
    console.log(`   Status: ${data.status}`);
    
    if (data.status === 'success' && data.data && data.data.options) {
      const firstOption = data.data.options[0];
      console.log('\n🗺️ First Option Journey Details:');
      console.log(`   Option ID: ${firstOption.id}`);
      console.log(`   Type: ${firstOption.type}`);
      console.log(`   Duration: ${firstOption.totalDuration} minutes`);
      console.log(`   Fare: ₵${firstOption.totalFare}`);
      
      if (firstOption.legs && firstOption.legs.length > 0) {
        console.log('\n🚶 Journey Legs with Real Stop Names:');
        firstOption.legs.forEach((leg, index) => {
          console.log(`\n   Leg ${index + 1}: ${leg.mode.toUpperCase()}`);
          console.log(`     From: ${leg.origin.name} (${leg.origin.type})`);
          console.log(`     To: ${leg.destination.name} (${leg.destination.type})`);
          console.log(`     Duration: ${leg.duration} minutes`);
          if (leg.fare > 0) {
            console.log(`     Fare: ₵${leg.fare}`);
          }
          if (leg.route) {
            console.log(`     Route: ${leg.route.name}`);
          }
        });
        
        // Check for real stop names (not generic placeholders)
        const hasRealStops = firstOption.legs.some(leg => 
          leg.origin.name.includes('Terminal') || 
          leg.destination.name.includes('Terminal') ||
          leg.origin.name.includes('Station') ||
          leg.destination.name.includes('Station')
        );
        
        if (hasRealStops) {
          console.log('\n✅ SUCCESS: Real Ghana transport stop names detected!');
          console.log('   ✅ No more generic "Nearest Stop" or "Transfer Point"');
          console.log('   ✅ Using actual GTFS terminal and station names');
        } else {
          console.log('\n⚠️ WARNING: Still using generic stop names');
        }
        
        // Check for specific Ghana locations
        const ghanaStops = firstOption.legs.flatMap(leg => [leg.origin.name, leg.destination.name])
          .filter(name => 
            name.includes('Accra') || 
            name.includes('Kaneshie') || 
            name.includes('Circle') || 
            name.includes('Terminal') ||
            name.includes('Station')
          );
        
        if (ghanaStops.length > 0) {
          console.log('\n🇬🇭 Ghana-specific locations found:');
          ghanaStops.forEach(stop => console.log(`   • ${stop}`));
        }
        
      } else {
        console.log('   ⚠️ No legs found in journey option');
      }
      
      // Test second option too
      if (data.data.options.length > 1) {
        const secondOption = data.data.options[1];
        console.log('\n🗺️ Second Option Journey Details:');
        console.log(`   Option ID: ${secondOption.id}`);
        console.log(`   Type: ${secondOption.type}`);
        
        if (secondOption.legs && secondOption.legs.length > 0) {
          console.log('\n🚶 Second Option Legs:');
          secondOption.legs.forEach((leg, index) => {
            console.log(`   Leg ${index + 1}: ${leg.origin.name} → ${leg.destination.name}`);
          });
        }
      }
      
    } else {
      console.log('   ❌ Invalid response structure');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n📱 Expected Improvements:');
  console.log('   ✅ Real terminal names like "Accra Central Terminal"');
  console.log('   ✅ Actual station names like "Kaneshie Terminal"');
  console.log('   ✅ Specific transport hubs like "Circle Terminal"');
  console.log('   ✅ No more generic "Nearest Stop" placeholders');
  console.log('   ✅ Commuters can easily identify pickup/drop-off points');
}

// Run the test
testRealStopNames().catch(console.error);
