import express from 'express';
import cors from 'cors';
import { fileDispute, getDisputeStatus } from './app.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. PUBLIC VERIFICATION ENDPOINT (Read-Only)
// This works perfectly online WITHOUT a private key!
app.get('/api/verify/:id', async (req, res) => {
    const disputeId = req.params.id;
    console.log(`[API Request] Reviewer verifying dispute ID: ${disputeId}`);
    
    try {
        const onChainData = await getDisputeStatus(disputeId);
        return res.json({
            verified: true,
            network: "GenLayer Asimov Testnet",
            contract_address: process.env.CONTRACT_ADDRESS || "Not Configured",
            dispute_id: Number(disputeId),
            on_chain_payload: onChainData
        });
    } catch (error) {
        console.error("❌ Verification Route Error:", error.message);
        return res.status(200).json({ 
            verified: false, 
            status: "Awaiting Block Finalization",
            message: "Dispute ID not fully processed inside GenVM storage yet.",
            details: error.message 
        });
    }
});

// 2. SUBMISSION ENDPOINT (Write)
// Gracefully denies access on the live server if no private key is supplied
app.post('/api/disputes', async (req, res) => {
    if (!process.env.PRIVATE_KEY) {
        return res.status(403).json({
            success: false,
            error: "Write operations are disabled on this live public verification node for security purposes."
        });
    }

    const { orderId, amount, carrier, claimText } = req.body;
    const disputeId = Math.floor(Date.now() / 1000);

    try {
        const txHash = await fileDispute(disputeId, orderId, amount, carrier, claimText);
        res.json({ success: true, allocated_dispute_id: disputeId, transaction_hash: txHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Secure Headless Verification Server running on port ${PORT}`);
    console.log(`👉 Verification Endpoint: http://localhost:${PORT}/api/verify/1\n`);
});