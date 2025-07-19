/**
 * 🧪 Test Journey Planning
 * Test the updated journey planning endpoint
 */

const API_URL = 'http://localhost:8000';

async function testJourneyPlanning() {
  console.log('🧪 Testing Journey Planning...\n');

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

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Journey planning endpoint working!');
      console.log(`   Status: ${data.status}`);
      console.log(`   Journey ID: ${data.data?.id}`);
      console.log(`   Options count: ${data.data?.options?.length || 0}`);
      
      if (data.data?.options?.length > 0) {
        const firstOption = data.data.options[0];
        console.log(`   First option: ${firstOption.type} (${firstOption.totalDuration}min, ₵${firstOption.totalFare})`);
        console.log(`   Legs: ${firstOption.legs?.length || 0}`);
      }
      
      console.log('\n📱 This should now work in the mobile app without TypeError!');
    } else {
      console.log('❌ Journey planning endpoint failed:', response.status);
      const errorData = await response.text();
      console.log('   Error:', errorData);
    }
  } catch (error) {
    console.log('❌ Journey planning endpoint error:', error.message);
  }
}

// Run the test
testJourneyPlanning().catch(console.error);
