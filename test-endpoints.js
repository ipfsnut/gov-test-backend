const axios = require('axios');
const baseUrl = 'http://localhost:3001'; // Adjust if your server runs on a different port

async function testEndpoint(endpoint, params = {}) {
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`, { params });
    console.log(`Response from ${endpoint}:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.response ? error.response.data : error.message);
  }
}

async function runTests() {
  await testEndpoint('/api/dao-data');
  await testEndpoint('/api/proposals');
  await testEndpoint('/api/voting-power', { address: 'osmo1hj7j4fvmc8h7mum5yrralve867nd8wsm5vls8k', daoId: 'osmo1a40j922z0kwqhw2nn0nx66ycyk88vyzcs73fyjrd092cjgyvyjksrd8dp7' });
  await testEndpoint('/api/dao/config');
  await testEndpoint('/api/dao/proposal-modules');
  await testEndpoint('/api/dao/voting-module');
  await testEndpoint('/api/dao/pause-info');
  await testEndpoint('/api/list_proposal_modules');
  await testEndpoint('/api/admin');
  await testEndpoint('/api/admin_nomination');
  await testEndpoint('/api/cw20_balances');
  await testEndpoint('/api/cw20_token_list');
  await testEndpoint('/api/cw721_token_list');
  await testEndpoint('/api/dump_state');
  await testEndpoint('/api/get_item', { key: 'your_test_key' });
  await testEndpoint('/api/list_items');
  await testEndpoint('/api/info');
  await testEndpoint('/api/active_proposal_modules');
  await testEndpoint('/api/proposal_module_count');
  await testEndpoint('/api/list_sub_daos');
  await testEndpoint('/api/dao_u_r_i');
  await testEndpoint('/api/voting_power_at_height', { address: 'osmo1hj7j4fvmc8h7mum5yrralve867nd8wsm5vls8k', height: 'optional_height' });
  await testEndpoint('/api/total_power_at_height', { height: 'optional_height' });
}

runTests();