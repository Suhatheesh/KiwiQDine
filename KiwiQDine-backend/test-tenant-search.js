const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testTenantSearch() {
    try {
        console.log('🔐 Step 1: Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@dineflow.com',
            password: 'SuperAdmin@123'
        });

        const token = loginResponse.data.accessToken;
        console.log('✅ Login successful! Token received.');

        console.log('\n🔍 Step 2: Testing /api/tenants/search?q=abc');
        const searchResponse = await axios.get(`${BASE_URL}/tenants/search?q=abc`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Search successful!');
        console.log('📊 Response:', JSON.stringify(searchResponse.data, null, 2));
        console.log(`📈 Found ${searchResponse.data.length} tenants`);

        console.log('\n🔍 Step 3: Testing /api/tenants/search (no query)');
        const searchAllResponse = await axios.get(`${BASE_URL}/tenants/search`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Search all successful!');
        console.log(`📈 Found ${searchAllResponse.data.length} total tenants`);

        console.log('\n✨ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

testTenantSearch();
