const axios = require('axios');

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.error('Please provide a token as argument');
  process.exit(1);
}

async function testProfile() {
  try {
    const response = await axios.get('http://localhost:5001/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Profile data:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

testProfile(); 