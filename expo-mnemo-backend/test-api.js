// Test Google Places API
require('dotenv').config();
const https = require('https');

if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.log('❌ GOOGLE_MAPS_API_KEY not found in .env');
  process.exit(1);
}

console.log('🧪 Testing Google Places API...\n');

// Test coordinates (Hyderabad)
const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=17.4375,78.3851&radius=50&key=${process.env.GOOGLE_MAPS_API_KEY}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const result = JSON.parse(data);
    
    console.log('Status:', result.status);
    
    if (result.status === 'OK' || result.status === 'ZERO_RESULTS') {
      console.log('✅ Google Places API is working!\n');
      if (result.results && result.results.length > 0) {
        console.log('📍 Found places:');
        result.results.slice(0, 3).forEach((place, i) => {
          console.log(`   ${i + 1}. ${place.name}`);
        });
      }
    } else {
      console.log('❌ Error:', result.status);
      if (result.error_message) {
        console.log('   ', result.error_message);
      }
    }
  });
}).on('error', (err) => {
  console.error('❌ Network error:', err.message);
});


