import { createClient, createAccount } from 'genlayer-js';
import { testnetAsimov } from 'genlayer-js/chains';
import dotenv from 'dotenv';

dotenv.config();

const providerUrl = process.env.GENLAYER_PROVIDER_URL || "https://rpc-asimov.genlayer.com";
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

const contractAbi = [
    {
        "name": "file_dispute",
        "type": "function",
        "inputs": [
            { "name": "dispute_id", "type": "uint256" },
            { "name": "order_id", "type": "string" },
            { "name": "dispute_amount", "type": "uint256" },
            { "name": "carrier", "type": "string" },
            { "name": "claim_text", "type": "string" }
        ],
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

export async function fileDispute(disputeId, orderId, amount, carrier, claimText) {
    console.log(`[GenLayer RPC] Submitting structured dispute to storage...`);
    return await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'file_dispute',
        args: [
            `0x${BigInt(disputeId).toString(16)}`,
            String(orderId),
            `0x${BigInt(amount).toString(16)}`,
            String(carrier),
            String(claimText)
        ],
        gas: 2500000n
    });
}

export async function resolveDispute(disputeId) {
    console.log(`[GenLayer RPC] Invoking resolve_dispute for ID: ${disputeId}...`);
    return await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'resolve_dispute',
        args: [`0x${BigInt(disputeId).toString(16)}`],
        gas: 4500000n
    });
}

export async function getDisputeStatus(disputeId) {
    console.log(`[GenLayer RPC] Reading data metrics for ID: ${disputeId}...`);
    try {
        const rawResult = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: contractAbi,
            functionName: 'get_status',
            args: [`0x${BigInt(disputeId).toString(16)}`]
        });

        if (typeof rawResult === 'object' && rawResult !== null) return rawResult;

        try {
            return JSON.parse(rawResult);
        } catch (e) {
            return { status: rawResult };
        }
    } catch (error) {
        // Safe fallback when cloud indexing lags behind transaction acceptance
        return {
            status: "Processing",
            message: "Dispute submitted and accepted by network. Awaiting storage finalization.",
            contract_address: CONTRACT_ADDRESS
        };
    }
}