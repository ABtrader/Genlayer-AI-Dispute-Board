import { createClient, createAccount } from 'genlayer-js';
import { testnetAsimov } from 'genlayer-js/chains';
import { readFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const providerUrl = process.env.GENLAYER_PROVIDER_URL;
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey || privateKey.startsWith('0x0123456789')) {
    console.error("❌ Error: Please make sure your real funded Private Key is set in your .env file!");
    process.exit(1);
}

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

async function main() {
    console.log("====================================================");
    console.log(`🚀 Starting fresh contract deployment on GenLayer Asimov...`);
    console.log(`Signing Account: ${account.address}`);
    console.log("====================================================");

    try {
        // Read the dispute_resolver.py contract file
        const contractPath = path.resolve(process.cwd(), 'dispute_resolver.py');
        console.log(`[File System] Reading contract from: ${contractPath}`);
        const contractCode = readFileSync(contractPath, 'utf-8');

        console.log(`[GenLayer RPC] Initializing consensus layer...`);
        await client.initializeConsensusSmartContract();

        console.log(`[GenLayer RPC] Sending deployment transaction to network...`);
        const txHash = await client.deployContract({
            code: contractCode,
            args: [],
            leaderOnly: false
        });

        console.log(`🔑 Transaction Submitted! Hash: ${txHash}`);
        console.log(`Waiting for Asimov validators to finalize deployment block...`);

        // Wait for finalization and fetch the fresh receipt
        const receipt = await client.waitForTransactionReceipt({
            hash: txHash,
            retries: 30,
            interval: 4000
        });

        // Pull the live address directly out of the finalized receipt object
        const newAddress = receipt.data?.contract_address || receipt.txDataDecoded?.contractAddress;

        if (!newAddress) {
            throw new Error(`Deployment completed but failed to retrieve the contract address. Raw receipt: ${JSON.stringify(receipt)}`);
        }

        console.log("\n====================================================");
        console.log("🎉 SUCCESS! CONTRACT DEPLOYED SUCCESSFULLY!");
        console.log(`👉 NEW CONTRACT ADDRESS: ${newAddress}`);
        console.log("====================================================");
        console.log("Action: Copy this new address and update CONTRACT_ADDRESS in your .env file!");
        
    } catch (error) {
        console.error("\n❌ Deployment pipeline broken:", error);
    }
}

main();