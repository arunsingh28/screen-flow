const axios = require('axios');

const API_URL = 'http://localhost:8000/api/v1';

async function testLLM() {
    try {
        // 0. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        const { access_token } = loginRes.data;
        const headers = { Authorization: `Bearer ${access_token}` };
        console.log('Login successful.');

        // 1. Build JD
        console.log('\n--- Testing JD Builder (LLM) ---');
        console.log('Generating JD for "Senior React Engineer"... this may take a few seconds...');
        const start = Date.now();

        const jdRes = await axios.post(`${API_URL}/jd-builder/build`, {
            job_title: 'Senior React Engineer',
            department: 'Frontend Engineering',
            min_years_experience: 5,
            seniority_level: 'Senior'
        }, { headers });

        const duration = Date.now() - start;
        console.log(`Generation took ${duration}ms`);

        const jd = jdRes.data;
        if (jd.success) {
            console.log('✅ JD Generation Successful!');
            console.log('JD ID:', jd.jd_id);
            console.log('Token Usage:', jd.usage);
            console.log('Estimated Cost:', jd.cost);

            console.log('\n--- Generated Content Preview ---');
            const content = jd.structured_jd;
            console.log('Overview:', content.overview?.substring(0, 100) + '...');
            console.log('Responsibilities:', content.responsibilities?.slice(0, 2));
            console.log('Requirements:', content.requirements?.slice(0, 2));
        } else {
            console.error('❌ JD Generation Failed:', jd.error);
        }

        // 2. Check Stats
        console.log('\n--- Checking LLM Stats ---');
        const statsRes = await axios.get(`${API_URL}/jd-builder/llm/stats`, { headers });
        const stats = statsRes.data;
        console.log('Total Calls:', stats.total_calls);
        console.log('Total Tokens:', stats.total_tokens);
        console.log('Total Cost:', stats.total_cost);
        console.log('Recent Calls:', stats.recent_calls.length);

    } catch (err) {
        console.error('TEST FAILED:', err.response ? err.response.data : err.message);
    }
}

testLLM();
