import { createClient, createAccount } from 'genlayer-js';
import { testnetAsimov } from 'genlayer-js/chains';
import dotenv from 'dotenv';

dotenv.config();

const providerUrl = process.env.GENLAYER_PROVIDER_URL;
const privateKey = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const account = createAccount(privateKey);

const activeChain = {
    ...testnetAsimov,
    rpcUrls: {
        default: { http: [providerUrl] },
        public: { http: [providerUrl] },
    }
};

const client = createClient({
    chain: activeChain,
    account: account
});

// Explicit, stripped down GenLayer ABI definitions
const contractAbi = [
    {
        "name": "file_dispute",
        "type": "function",
        "inputs": [{ "name": "claim_text", "type": "string" }],
        "outputs": []
    },
    {
        "name": "resolve_dispute",
        "type": "function",
        "inputs": [{ "name": "dispute_id", "type": "uint256" }],
        "outputs": []
    },
    {
        "name": "get_status",
        "type": "function",
        "inputs": [{ "name": "dispute_id", "type": "uint256" }],
        "outputs": [{ "type": "string" }]
    }
];

export async function fileDispute(claimText) {
    console.log(`[GenLayer RPC] Filing dispute text to storage...`);
    
    return await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'file_dispute',
        args: [String(claimText)],
        // CRITICAL: Hardcoding gas as a BigInt overrides viem's automated eth_estimateGas 
        // fallback sequence, preventing the execution revert loop.
        gas: 2000000n 
    });
}

export async function resolveDispute(disputeId) {
    console.log(`[GenLayer RPC] Invoking resolve_dispute for ID: ${disputeId}...`);
    
    return await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'resolve_dispute',
        args: [BigInt(disputeId)],
        gas: 4000000n 
    });
}

export async function getDisputeStatus(disputeId) {
    console.log(`[GenLayer RPC] Reading status for ID: ${disputeId}...`);
    
    const rawJsonString = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'get_status',
        args: [BigInt(disputeId)]
    });
    return JSON.parse(rawJsonString);
}