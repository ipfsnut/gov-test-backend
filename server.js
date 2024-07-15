// server.js

const express = require('express');
const cors = require('cors');
const { CosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT;
const PAGE_DAO_CONTRACT = process.env.PAGE_DAO_CONTRACT;

let client;

const initializeClient = async () => {
  try {
    client = await CosmWasmClient.connect(RPC_ENDPOINT);
    console.log('Client initialized successfully');
  } catch (error) {
    console.error('Error initializing client:', error);
  }
};

initializeClient().catch(console.error);

app.get('/api/dao-data', async (req, res) => {
  try {
    const { address } = req.query;
    const daoInfo = await client.queryContractSmart(PAGE_DAO_CONTRACT, { info: {} });
    const subDAOs = await client.queryContractSmart(PAGE_DAO_CONTRACT, { list_sub_daos: { member: address } });
    res.json({ daoInfo, subDAOs });
  } catch (error) {
    console.error('Error fetching DAO data:', error);
    res.status(500).json({ error: 'Failed to fetch DAO data' });
  }
});

app.get('/api/proposals', async (req, res) => {
  try {
    const proposalModules = await client.queryContractSmart(PAGE_DAO_CONTRACT, { proposal_modules: {} });
    const proposals = [];
    for (const module of proposalModules.proposal_modules) {
      const moduleProposals = await client.queryContractSmart(module.code_id, { list_proposals: {} });
      proposals.push(...moduleProposals.proposals);
    }
    res.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

app.get('/api/voting-power', async (req, res) => {
  try {
    const { address, daoId } = req.query;
    const votingPower = await client.queryContractSmart(daoId, { voting_power_at_height: { address } });
    res.json({ votingPower });
  } catch (error) {
    console.error('Error fetching voting power:', error);
    res.status(500).json({ error: 'Failed to fetch voting power' });
  }
});

app.get('/api/staked-amount', async (req, res) => {
  try {
    const { address, daoId } = req.query;
    const stakedAmount = await client.queryContractSmart(daoId, { get_staked_amount: { address } });
    res.json({ stakedAmount });
  } catch (error) {
    console.error('Error fetching staked amount:', error);
    res.status(500).json({ error: 'Failed to fetch staked amount' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
