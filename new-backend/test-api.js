const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:8000/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NjM3NzYzMjgyMjM3ZjcwYjVmYTk1NCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY4MTI2MzA3LCJleHAiOjE3Njg3MzExMDd9.co2A9rFoc_WZ-cEx0pPyDqUMgwcNUa-SJO1nKM_R8XA';

async function test() {
    try {
        // 1. Create Job
        console.log('Creating job...');
        const jobRes = await axios.post(`${API_URL}/jobs/batches`, {
            title: 'Integration Test Job',
            description: 'Testing endpoints'
        }, { headers: { Authorization: `Bearer ${TOKEN}` } });
        const jobId = jobRes.data._id;
        console.log('Job ID:', jobId);

        // 2. Request Upload
        console.log('Requesting upload...');
        const uploadReqRes = await axios.post(`${API_URL}/jobs/batches/${jobId}/upload-request`, {
            filename: 'resume.pdf',
            file_size_bytes: 12345,
            content_type: 'application/pdf'
        }, { headers: { Authorization: `Bearer ${TOKEN}` } });
        const { upload_url, key, cv_id } = uploadReqRes.data;
        console.log('Upload URL:', upload_url);
        console.log('CV ID:', cv_id);

        // 3. Upload File (PUT)
        console.log('Uploading file...');
        // Create dummy buffer
        const buffer = Buffer.from('Dummy PDF Content');
        await axios.put(upload_url, buffer, {
            headers: { 'Content-Type': 'application/pdf' }
        });
        console.log('File uploaded');

        // 4. Confirm Upload
        console.log('Confirming upload...');
        const confirmRes = await axios.post(`${API_URL}/jobs/batches/${jobId}/upload-complete`, {
            cv_id: cv_id
        }, { headers: { Authorization: `Bearer ${TOKEN}` } });
        console.log('Confirm status:', confirmRes.data);

        // 5. Get Batch CVs
        console.log('Getting CVs...');
        const cvsRes = await axios.get(`${API_URL}/jobs/batches/${jobId}/cvs`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        console.log('CVs count:', cvsRes.data.total);

        console.log('ALL TESTS PASSED');
    } catch (err) {
        console.error('TEST FAILED:', err.response ? err.response.data : err.message);
    }
}

test();
