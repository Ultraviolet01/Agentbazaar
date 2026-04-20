const axios = require('axios');

async function testSignupIncentive() {
  const API_URL = 'http://localhost:3006';
  const testUser = {
    email: `test_incentive_${Date.now()}@agentbazaar.ai`,
    username: `test_${Math.floor(Math.random() * 100000)}`,
    password: 'Password123!'
  };

  try {
    console.log(`--- Registering test user: ${testUser.email}`);
    const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('Registration Response:', regRes.data);

    // Now login to get tokens and check balance
    console.log('--- Logging in to check balance');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    // The me endpoint should show credits
    const token = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];
    const meRes = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Cookie: `accessToken=${token}`
      }
    });

    console.log('User Data after Signup:', JSON.stringify(meRes.data.user, null, 2));
    if (meRes.data.user.credits === 20) {
      console.log('✅ SUCCESS: New user received 20 credits!');
    } else {
      console.error(`❌ FAILURE: New user received ${meRes.data.user.credits} credits instead of 20.`);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testSignupIncentive();
