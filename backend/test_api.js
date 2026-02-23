const fetch = require('node-fetch');

async function test() {
    console.log('Testing Admin Telemetry...');
    try {
        const res1 = await fetch('http://localhost:3000/api/v1/admin/telemetry');
        console.log('Telemetry Status:', res1.status);
        const data1 = await res1.json();
        console.log('Telemetry Data:', JSON.stringify(data1, null, 2));
    } catch (e) {
        console.error('Telemetry Error:', e.message);
    }

    console.log('\nTesting Materials API...');
    try {
        const res2 = await fetch('http://localhost:3000/api/v1/materials?admin=true');
        console.log('Materials Status:', res2.status);
        const data2 = await res2.json();
        console.log('Materials Data Structure (Keys):', Object.keys(data2));
        if (data2.data) console.log('Materials Data Type:', Array.isArray(data2.data) ? 'Array' : typeof data2.data);
    } catch (e) {
        console.error('Materials Error:', e.message);
    }
}

test();
