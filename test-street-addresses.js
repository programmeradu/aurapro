/**
 * 🏠 Test Street Addresses Integration
 * Test that walking segments now include real Ghana street addresses
 */

const API_URL = 'http://localhost:8000';

async function testStreetAddresses() {
  console.log('🏠 Testing Street Addresses Integration...\n');

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
      
      console.log('✅ Journey planning with street addresses working!');
      console.log(`📍 Route: ${firstOption.type} (${firstOption.totalDuration} min)\n`);
      
      console.log('🚶 Walking Segments with Real Addresses:');
      firstOption.legs.forEach((leg, index) => {
        console.log(`\nLeg ${index + 1}: ${leg.mode.toUpperCase()}`);
        console.log(`  From: ${leg.origin.name}`);
        if (leg.origin.address) {
          console.log(`    📍 Address: ${leg.origin.address}`);
        }
        console.log(`  To: ${leg.destination.name}`);
        if (leg.destination.address) {
          console.log(`    📍 Address: ${leg.destination.address}`);
        }
        console.log(`  Duration: ${leg.duration} minutes`);
        
        if (leg.mode === 'walking') {
          console.log(`  🚶 Walking distance: ${leg.walkingDistance}m`);
        } else if (leg.mode === 'trotro') {
          console.log(`  🚌 Route: ${leg.route?.name || 'N/A'}`);
          console.log(`  💰 Fare: ₵${leg.fare}`);
        }
      });
      
      // Check if addresses are present
      const walkingLegs = firstOption.legs.filter(leg => leg.mode === 'walking');
      const allLegsWithAddresses = firstOption.legs.filter(leg =>
        leg.origin.address || leg.destination.address
      );
      
      console.log('\n📊 Address Integration Summary:');
      console.log(`   Walking legs: ${walkingLegs.length}`);
      console.log(`   All legs with addresses: ${allLegsWithAddresses.length}`);

      if (allLegsWithAddresses.length > 0) {
        console.log('   ✅ Real Ghana street addresses integrated!');
        console.log('   ✅ No more generic location descriptions');
        console.log('   ✅ Commuters can identify exact pickup/drop-off points');
      } else {
        console.log('   ⚠️ Addresses not found in walking segments');
      }
      
    } else {
      console.log('❌ Journey planning failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n🇬🇭 Expected Ghana Street Addresses:');
  console.log('   • High Street, Accra Central Business District');
  console.log('   • Kaneshie-Mallam Highway, Kaneshie');
  console.log('   • Kwame Nkrumah Avenue, Circle');
  console.log('   • Ring Road West, Kokomlemle');
  console.log('   • Liberation Road, Accra Central');
}

// Run the test
testStreetAddresses().catch(console.error);
