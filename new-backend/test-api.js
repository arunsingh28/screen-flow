const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:8000/api/v1';

async function test() {
  try {
    // 0. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    // Updated to match legacy structure: token is nested
    const { access_token } = loginRes.data.token;
    console.log('Logged in. Token acquired.');
    const headers = { Authorization: `Bearer ${access_token}` };

    // 1. Create Job
    console.log('Creating job...');
    const jobRes = await axios.post(`${API_URL}/jobs/batches`, {
      title: 'Integration Test Job',
      description: 'Testing endpoints'
    }, { headers });
    const jobId = jobRes.data._id;
    console.log('Job ID:', jobId);

    // 2. Request Upload
    console.log('Requesting upload...');
    const uploadReqRes = await axios.post(`${API_URL}/jobs/batches/${jobId}/upload-request`, {
      filename: 'resume.pdf',
      file_size_bytes: 12345,
      content_type: 'application/pdf'
    }, { headers });
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
    }, { headers });
    console.log('Confirm status:', confirmRes.data);

    // 5. Get Batch CVs
    console.log('Getting CVs...');
    const cvsRes = await axios.get(`${API_URL}/jobs/batches/${jobId}/cvs`, { headers });
    console.log('CVs count:', cvsRes.data.total);

    // 6. User Profile (GET /me)
    console.log('Getting User Profile...');
    const meRes = await axios.get(`${API_URL}/users/me`, { headers });
    console.log('User:', meRes.data.email);

    // 7. Credits
    console.log('Checking Credits...');
    const creditRes = await axios.get(`${API_URL}/credits`, { headers });
    console.log('Credit Balance:', creditRes.data.balance);

    // 8. JD Builder (Mocked Build)
    console.log('Building JD...');
    const jdRes = await axios.post(`${API_URL}/jd-builder/build`, {
      job_title: 'Software Engineer',
      department: 'Engineering'
    }, { headers });
    console.log('JD ID:', jdRes.data.jd_id);

    // 9. Admin Stats
    console.log('Checking Admin Overview...');
    const adminRes = await axios.get(`${API_URL}/admin/analytics/overview`, { headers });
    console.log('Total Users:', adminRes.data.total_users);

    console.log('ALL TESTS PASSED');
  } catch (err) {
    console.error('TEST FAILED:', err.response ? err.response.data : err.message);
  }
}

test();
