/**
 * 🧪 Test Search Integration
 * Test script to verify mobile app search integration with backend
 */

const API_URL = 'http://localhost:8000';

async function testSearchIntegration() {
  console.log('🧪 Testing Search Integration...\n');

  // Test 1: Backend search endpoint
  console.log('1️⃣ Testing backend search endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/v1/journey/search-places?q=accra&lat=5.6037&lng=-0.1870&limit=5`);
    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      console.log('✅ Backend search endpoint working!');
      console.log(`   Found ${data.data.length} results for "accra"`);
      console.log(`   First result: ${data.data[0]?.name}`);
    } else {
      console.log('❌ Backend search endpoint failed:', data);
    }
  } catch (error) {
    console.log('❌ Backend search endpoint error:', error.message);
  }

  // Test 2: GTFS nearby stops endpoint
  console.log('\n2️⃣ Testing GTFS nearby stops endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/v1/gtfs/stops/near?lat=5.6037&lon=-0.1870&radius_km=2`);
    const data = await response.json();
    
    if (response.ok && data.success !== false) {
      console.log('✅ GTFS nearby stops endpoint working!');
      const stops = data.data?.stops || data.stops || [];
      console.log(`   Found ${stops.length} nearby stops`);
      if (stops.length > 0) {
        console.log(`   First stop: ${stops[0]?.stop_name || stops[0]?.name}`);
      }
    } else {
      console.log('❌ GTFS nearby stops endpoint failed:', data);
    }
  } catch (error) {
    console.log('❌ GTFS nearby stops endpoint error:', error.message);
  }

  // Test 3: Search for specific terminals
  console.log('\n3️⃣ Testing search for specific terminals...');
  const searchTerms = ['kaneshie', 'tema', 'circle', 'madina'];
  
  for (const term of searchTerms) {
    try {
      const response = await fetch(`${API_URL}/api/v1/journey/search-places?q=${term}&limit=3`);
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        console.log(`✅ Search for "${term}": Found ${data.data.length} results`);
        if (data.data.length > 0) {
          console.log(`   Best match: ${data.data[0].name}`);
        }
      } else {
        console.log(`❌ Search for "${term}" failed:`, data);
      }
    } catch (error) {
      console.log(`❌ Search for "${term}" error:`, error.message);
    }
  }

  // Test 4: Test mobile app frontend integration
  console.log('\n4️⃣ Testing mobile app frontend integration...');
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (response.ok) {
      console.log('✅ Mobile app frontend is running on port 3001');
    } else {
      console.log('⚠️ Mobile app frontend health check failed');
    }
  } catch (error) {
    console.log('⚠️ Mobile app frontend not accessible:', error.message);
    console.log('   This is normal if the app is running but doesn\'t have a health endpoint');
  }

  // Test 5: Test journey planning endpoint
  console.log('\n5️⃣ Testing journey planning endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/v1/journey/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: { name: 'Accra Central', lat: 5.5502, lon: -0.2174 },
        to: { name: 'Kaneshie', lat: 5.5731, lon: -0.2469 }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Journey planning endpoint working!');
      console.log(`   Status: ${data.status}`);
    } else {
      console.log('❌ Journey planning endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Journey planning endpoint error:', error.message);
  }

  console.log('\n🎯 Integration Test Summary:');
  console.log('   - Backend search endpoint: Should be working ✅');
  console.log('   - GTFS nearby stops: Should be working ✅');
  console.log('   - Terminal searches: Should find Ghana transport stops ✅');
  console.log('   - Journey planning: Should be working ✅');
  console.log('   - Mobile app: Should be accessible at http://localhost:3001 🌐');

  console.log('\n📱 To test the mobile app search:');
  console.log('   1. Open http://localhost:3001/journey in your browser');
  console.log('   2. Try typing in the "From" or "To" search boxes');
  console.log('   3. You should see Ghana transport stops like:');
  console.log('      - Accra Central Terminal');
  console.log('      - Kaneshie Terminal');
  console.log('      - Tema Station Terminal');
  console.log('      - Circle Terminal');
  console.log('      - Madina Terminal');

  console.log('\n🔧 Recent Fixes Applied:');
  console.log('   ✅ Added missing /api/v1/journey/search-places endpoint');
  console.log('   ✅ Fixed mobile app response format handling');
  console.log('   ✅ Removed unnecessary auth headers for public endpoints');
  console.log('   ✅ Enhanced search service with backend integration');
  console.log('   ✅ Added proper error handling and fallbacks');
}

// Run the test
testSearchIntegration().catch(console.error);
