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

// Complete, explicit ABI definition mapping to your Python contract methods
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

// Submits the dispute description into GenVM Storage
export async function fileDispute(claimText) {
    console.log(`[GenLayer RPC] Filing dispute text to storage...`);
    return await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'file_dispute',
        args: [String(claimText)],
        gas: 2000000n // Hardcoded gas override prevents automated eth_estimateGas reverts
    });
}

// Triggers the validator nodes to execute the Equivalence Principle AI jury
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

// Reads the TreeMap state string and parses it back safely into a JavaScript Object
export async function getDisputeStatus(disputeId) {
    console.log(`[GenLayer RPC] Reading status for ID: ${disputeId}...`);
    
    const rawResult = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'get_status',
        args: [BigInt(disputeId)]
    });

    // If GenLayer already returned a structured object layout, forward it directly
    if (typeof rawResult === 'object' && rawResult !== null) {
        return rawResult;
    }

    try {
        // Attempt parsing only if it's a valid JSON-formatted string string
        return JSON.parse(rawResult);
    } catch (e) {
        // Fallback: If it's a standard unformatted raw string, wrap it so the browser reads it cleanly
        return { status: rawResult };
    }
}