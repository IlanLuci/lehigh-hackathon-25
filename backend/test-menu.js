// Test script to verify menu scraper works (strict, no fallback)
const { fetchRathboneMenu } = require('./src/services/menuScraper');

console.log('🍽️  Testing Rathbone Menu Integration\n');
console.log('=' .repeat(60));

// Test 1: Get sample menu
console.log('🌐 Attempting to fetch from Rathbone website (strict)...\n');
fetchRathboneMenu()
  .then(menu => {
    console.log(`   Fetched ${menu.length} items`);
    const sample = menu.slice(0, 10).map(i => ` - ${i.name} (${i.station || 'Main'})`);
    console.log(sample.join('\n'));
    console.log('\n✅ Fetch succeeded!\n');
  })
  .catch(err => {
    console.error('❌ Fetch failed:', err?.message || err);
    process.exit(1);
  });
