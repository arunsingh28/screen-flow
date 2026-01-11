const axios = require('axios');

const API_URL = 'http://localhost:8000/api/v1';

const ENDPOINTS = [
    // Auth
    { method: 'POST', url: '/auth/register', body: { email: `parity_${Date.now()}@test.com`, password: 'password123', first_name: 'Parity', last_name: 'Test' }, expected: 200, saveToken: true },
    { method: 'POST', url: '/auth/login', body: { email: 'test@example.com', password: 'password123' }, expected: 200, saveToken: true },
    { method: 'POST', url: '/auth/refresh', body: {}, expected: [200, 401] }, // Send empty body to avoid 415
    { method: 'POST', url: '/auth/logout', body: {}, expected: 200 },

    // Users
    { method: 'GET', url: '/users/me', expected: 200, auth: true },
    { method: 'PUT', url: '/users/me', body: { first_name: 'Updated' }, expected: 200, auth: true },
    { method: 'POST', url: '/users/me/avatar/upload-url', body: { filename: 'test.jpg', content_type: 'image/jpeg' }, expected: 200, auth: true },

    // JD Builder
    { method: 'POST', url: '/jd-builder/build', body: { job_title: 'Test', department: 'Test' }, expected: 200, auth: true },
    { method: 'GET', url: '/jd-builder/list', expected: 200, auth: true },
    { method: 'GET', url: '/jd-builder/llm/stats', expected: 200, auth: true },

    // Jobs (Batches)
    { method: 'GET', url: '/jobs/batches', expected: 200, auth: true },
    { method: 'POST', url: '/jobs/batches', body: { job_title: 'Batch Test', department: 'Test' }, expected: 200, auth: true, saveJobId: true },
    { method: 'GET', url: '/jobs/activities', expected: 200, auth: true },
    { method: 'GET', url: '/jobs/stats', expected: 200, auth: true },

    // Credits
    { method: 'GET', url: '/credits', expected: 200, auth: true },
    { method: 'GET', url: '/credits/history', expected: 200, auth: true },

    // Referrals
    { method: 'GET', url: '/referrals/code', expected: 200, auth: true },
    { method: 'GET', url: '/referrals/stats', expected: 200, auth: true },

    // Admin
    { method: 'GET', url: '/admin/analytics/overview', expected: 200, auth: true },
    { method: 'GET', url: '/admin/users', expected: 200, auth: true },

    // Analytics
    { method: 'POST', url: '/analytics/page-visit', body: { path: '/home' }, expected: 200 },

    // Legacy Frontend Compatibility Aliases
    {
        method: 'POST',
        url: '/jobs/parse-jd',
        body: '--boundary\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nTest content\r\n--boundary--',
        headers: { 'Content-Type': 'multipart/form-data; boundary=boundary' },
        expected: [200],
        auth: true
    },
];

let token = null;
let jobId = null;

async function verify() {
    console.log('--- STARTING PARITY VERIFICATION ---');
    let failures = [];

    for (const ep of ENDPOINTS) {
        try {
            const config = {
                method: ep.method,
                url: `${API_URL}${ep.url}`,
                data: ep.body,
                headers: {
                    ...(ep.auth ? { Authorization: `Bearer ${token}` } : {}),
                    ...(ep.headers || {})
                }
            };

            // Dynamic URL params check
            if (ep.url.includes(':jobId') && jobId) {
                config.url = config.url.replace(':jobId', jobId);
            }

            const res = await axios(config);

            if (ep.saveToken && res.data.token?.access_token) {
                token = res.data.token.access_token;
            }
            if (ep.saveJobId && res.data._id) {
                jobId = res.data._id;
            }

            console.log(`✅ [${ep.method}] ${ep.url} - ${res.status}`);

        } catch (err) {
            const status = err.response?.status;
            if (Array.isArray(ep.expected) && ep.expected.includes(status)) {
                console.log(`✅ [${ep.method}] ${ep.url} - ${status} (Accepted Expected Error)`);
            } else if (status === ep.expected) {
                console.log(`✅ [${ep.method}] ${ep.url} - ${status} (Expected Error matched)`);
            } else {
                console.error(`❌ [${ep.method}] ${ep.url} - FAILED: ${status || err.message}`);
                failures.push(`${ep.method} ${ep.url}: ${status || err.message}`);
            }
        }
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
    if (failures.length === 0) {
        console.log('ALL ENDPOINTS VERIFIED SUCCESSFULLY ✅');
    } else {
        console.log(`${failures.length} ENDPOINTS FAILED ❌`);
        failures.forEach(f => console.log(' - ' + f));
    }
}

// Quick wait for server
setTimeout(verify, 3000);
