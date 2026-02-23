const http = require('http');

const test = (url) => {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        }).on('error', (err) => {
            resolve({ error: err.message });
        });
    });
};

async function run() {
    console.log('--- ADMIN TELEMETRY ---');
    const tel = await test('http://localhost:3000/api/v1/admin/telemetry');
    console.log(tel);

    console.log('\n--- MATERIALS ADMIN ---');
    const mat = await test('http://localhost:3000/api/v1/materials?admin=true');
    console.log(mat);
}

run();
