import express from 'express';
import path from 'path';
import { myDir } from '../utils/utils.js';
import { apply, getCacheStats, clearCache } from '../index.js';

const __dirname = myDir(import.meta.url);

// Test caching functionality
async function testCaching() {
    console.log('🧪 Testing Template and Codebehind Caching...\n');
    
    const app = express();
    app.set('view engine', 'pug');
    app.set('views', path.join(__dirname, 'views'));
    
    // Apply the codebehind framework
    await apply(app, {
        codebehindPath: path.join(__dirname, 'codebehind')
    });
    
    // Test route that will use caching
    app.get('/test', (req, res) => {
        res.render('home', { title: 'Caching Test' });
    });
    
    // Route to show cache statistics
    app.get('/cache-stats', (req, res) => {
        const stats = getCacheStats();
        res.json({
            message: 'Cache Statistics',
            stats: stats,
            timestamp: new Date().toISOString()
        });
    });
    
    // Route to clear cache
    app.get('/clear-cache', (req, res) => {
        clearCache();
        res.json({
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString()
        });
    });
    
    console.log('✅ Caching test routes configured:');
    console.log('   • GET /test - Test template caching');
    console.log('   • GET /cache-stats - View cache statistics');
    console.log('   • GET /clear-cache - Clear all caches');
    
    console.log('\n📊 Cache Features:');
    console.log('   • Template caching (prevents re-parsing HTML)');
    console.log('   • Codebehind caching (prevents re-requiring files)');
    console.log('   • Memory leak prevention (max 100 items per cache)');
    console.log('   • Cache statistics and management');
    
    return app;
}

// Export for use
export default testCaching;

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testCaching().then(app => {
        app.listen(5001, () => {
            console.log('\n🚀 Caching test server running on http://localhost:5001');
            console.log('📝 Test the caching by:');
            console.log('   1. Visit http://localhost:5001/test (loads page)');
            console.log('   2. Visit http://localhost:5001/cache-stats (see cache)');
            console.log('   3. Visit http://localhost:5001/test again (uses cache)');
            console.log('   4. Check cache stats again to see improvement');
        });
    }).catch(err => {
        console.error('❌ Caching test failed:', err);
    });
}
