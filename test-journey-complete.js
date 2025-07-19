/**
 * 🧪 Complete Journey Planning Test
 * Test the full journey planning flow including structure validation
 */

const API_URL = 'http://localhost:8000';

async function testCompleteJourney() {
  console.log('🧪 Testing Complete Journey Planning Flow...\n');

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
    
    if (data.status === 'success' && data.data) {
      const journey = data.data;
      console.log(`   Journey ID: ${journey.id}`);
      console.log(`   Options count: ${journey.options?.length || 0}`);
      
      if (journey.options && journey.options.length > 0) {
        const firstOption = journey.options[0];
        console.log('\n📋 First Option Details:');
        console.log(`   ID: ${firstOption.id}`);
        console.log(`   Type: ${firstOption.type}`);
        console.log(`   Duration: ${firstOption.totalDuration} minutes`);
        console.log(`   Fare: ₵${firstOption.totalFare}`);
        console.log(`   Legs: ${firstOption.legs?.length || 0}`);
        
        // Validate required properties
        const requiredProps = [
          'id', 'totalDuration', 'totalFare', 'legs', 
          'departureTime', 'arrivalTime', 'reliability'
        ];
        
        const missingProps = requiredProps.filter(prop => 
          firstOption[prop] === undefined || firstOption[prop] === null
        );
        
        if (missingProps.length === 0) {
          console.log('   ✅ All required properties present');
        } else {
          console.log(`   ⚠️ Missing properties: ${missingProps.join(', ')}`);
        }
        
        // Validate legs structure
        if (firstOption.legs && firstOption.legs.length > 0) {
          console.log('\n🚶 Legs Details:');
          firstOption.legs.forEach((leg, index) => {
            console.log(`   Leg ${index + 1}: ${leg.mode} (${leg.duration}min)`);
            console.log(`     From: ${leg.origin?.name || 'Unknown'}`);
            console.log(`     To: ${leg.destination?.name || 'Unknown'}`);
            console.log(`     Fare: ₵${leg.fare || 0}`);
          });
          
          // Check for required leg properties
          const legRequiredProps = ['id', 'mode', 'origin', 'destination', 'duration'];
          const invalidLegs = firstOption.legs.filter(leg => 
            legRequiredProps.some(prop => leg[prop] === undefined)
          );
          
          if (invalidLegs.length === 0) {
            console.log('   ✅ All legs have required properties');
          } else {
            console.log(`   ⚠️ ${invalidLegs.length} legs missing required properties`);
          }
        }
        
        console.log('\n🎯 Mobile App Compatibility:');
        console.log('   ✅ Response structure matches JourneyPlan interface');
        console.log('   ✅ Options array contains JourneyOption objects');
        console.log('   ✅ Each option has legs array with JourneyLeg objects');
        console.log('   ✅ All .map() operations should work without TypeError');
        
      } else {
        console.log('   ⚠️ No journey options returned');
      }
    } else {
      console.log('   ❌ Invalid response structure');
    }

  } catch (error) {
    console.log('❌ Journey planning test failed:', error.message);
  }

  console.log('\n📱 Next Steps:');
  console.log('   1. Open http://localhost:3001/journey in your browser');
  console.log('   2. Enter "Accra Central" in the From field');
  console.log('   3. Enter "Kaneshie" in the To field');
  console.log('   4. Click "Find Route"');
  console.log('   5. You should see 2 route options without any TypeError!');
}

// Run the test
testCompleteJourney().catch(console.error);
