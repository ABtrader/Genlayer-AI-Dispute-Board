import express from 'express';
import cors from 'cors';
import { fileDispute, getDisputeStatus } from './app.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. PUBLIC VERIFICATION ENDPOINT (Read-Only)
// Anyone can hit this URL to verify a dispute state directly on the blockchain
app.get('/api/verify/:id', async (req, res) => {
    const disputeId = req.params.id;
    console.log(`[API Request] Verifying dispute ID: ${disputeId}`);
    
    try {
        const onChainData = await getDisputeStatus(disputeId);
        
        res.json({
            verified: true,
            source: "GenLayer Asimov Testnet",
            contract_address: process.env.CONTRACT_ADDRESS,
            dispute_id: disputeId,
            data: onChainData
        });
    } catch (error) {
        res.status(500).json({ 
            verified: false, 
            error: "Could not fetch verifiable on-chain data", 
            details: error.message 
        });
    }
});

// 2. SUBMISSION ENDPOINT (Write)
app.post('/api/disputes', async (req, res) => {
    const { claimText } = req.body;
    if (!claimText) return res.status(400).json({ error: "claimText is required" });

    try {
        const txHash = await fileDispute(claimText);
        res.json({ success: true, transaction_hash: txHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Verification Server running on http://localhost:${PORT}`);
    console.log(`👉 Public Verification Link: http://localhost:${PORT}/api/verify/1\n`);
});