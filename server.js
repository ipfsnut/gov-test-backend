// server.js

const express = require('express');
const cors = require('cors');
const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const util = require('util');
require('dotenv').config();

// Initialize Express app
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000'
}));
// Parse JSON bodies
app.use(express.json());

// Set up server port and other constants from environment variables
const PORT = process.env.PORT || 3001;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT;
const PAGE_DAO_CONTRACT = process.env.PAGE_DAO_CONTRACT;
const CHAIN_ID = process.env.CHAIN_ID;

// Initialize CosmWasmClient
let client;

const initializeClient = async () => {
  try {
    console.log('Initializing SigningCosmWasmClient...');
    console.log('RPC_ENDPOINT:', RPC_ENDPOINT);
    console.log('CHAIN_ID:', CHAIN_ID);
    
    client = await SigningCosmWasmClient.connect(RPC_ENDPOINT);
    
    console.log('Client initialized successfully');
    
    // Verify the contract exists
    try {
      const contractInfo = await client.getContract(PAGE_DAO_CONTRACT);
      console.log('Contract info:', contractInfo);
    } catch (contractError) {
      console.error('Error fetching contract info:', contractError);
      throw new Error('Failed to verify contract existence');
    }
  } catch (error) {
    console.error('Error initializing client:', error);
    throw error;
  }
};

// API endpoint to fetch DAO data
app.get('/api/dao-data', async (req, res) => {
  try {
    const { address } = req.query;

    console.log(`Fetching DAO data for address: ${address}`);

    // Fetch DAO info
    console.log('Fetching DAO info...');
    const daoInfo = await client.queryContractSmart(PAGE_DAO_CONTRACT, { info: {} });
    console.log('DAO info fetched successfully:', util.inspect(daoInfo, { depth: null }));
    
    // Fetch and paginate through all sub-DAOs
    console.log('Fetching sub-DAOs...');
    let allSubDAOs = [];
    let startAfter = null;
    const limit = 10;

    while (true) {
      console.log(`Fetching sub-DAOs batch. Start after: ${startAfter}, Limit: ${limit}`);
      const subDAOsResponse = await client.queryContractSmart(PAGE_DAO_CONTRACT, { 
        list_sub_daos: { 
          start_after: startAfter,
          limit: limit
        } 
      });
      console.log('Sub-DAOs response:', util.inspect(subDAOsResponse, { depth: null }));

      if (!Array.isArray(subDAOsResponse)) {
        throw new Error(`Unexpected sub-DAOs response type: ${typeof subDAOsResponse}`);
      }

      allSubDAOs = [...allSubDAOs, ...subDAOsResponse];

      if (subDAOsResponse.length < limit) {
        break;
      }

      startAfter = subDAOsResponse[subDAOsResponse.length - 1].addr;
    }

    console.log(`Total sub-DAOs fetched: ${allSubDAOs.length}`);

    // Send the response
    res.json({ daoInfo, subDAOs: allSubDAOs });
  } catch (error) {
    console.error('Error fetching DAO data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch DAO data', 
      details: error.message,
      stack: error.stack
    });
  }
});

// API endpoint to fetch proposals
app.get('/api/proposals', async (req, res) => {
  try {
    console.log('Fetching proposal modules...');
    const proposalModules = await client.queryContractSmart(PAGE_DAO_CONTRACT, { proposal_modules: {} });
    console.log('Proposal modules:', util.inspect(proposalModules, { depth: null }));

    const proposals = [];

    if (proposalModules && Array.isArray(proposalModules.proposal_modules)) {
      for (const module of proposalModules.proposal_modules) {
        console.log(`Fetching proposals for module: ${module.address}`);
        const moduleProposals = await client.queryContractSmart(module.address, { list_proposals: {} });
        console.log('Module proposals:', util.inspect(moduleProposals, { depth: null }));
        proposals.push(...moduleProposals.proposals);
      }
    }

    console.log(`Total proposals fetched: ${proposals.length}`);
    res.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch proposals', 
      details: error.message,
      stack: error.stack
    });
  }
});

// API endpoint to fetch voting power
app.get('/api/voting-power', async (req, res) => {
  try {
    const { address, daoId } = req.query;
    console.log(`Fetching voting power for address: ${address}, daoId: ${daoId}`);
    
    if (!address || !daoId) {
      throw new Error('Address and DAO ID are required');
    }

    const votingPower = await client.queryContractSmart(daoId, { 
      voting_power_at_height: { 
        address: address,
        height: null  // null means current height
      } 
    });
    
    console.log('Voting power:', util.inspect(votingPower, { depth: null }));
    res.json({ votingPower });
  } catch (error) {
    console.error('Error fetching voting power:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voting power', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Start the server
const startServer = async () => {
  try {
    await initializeClient();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();