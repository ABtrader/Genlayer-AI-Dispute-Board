import { fileDispute, resolveDispute, getDisputeStatus } from './app.js';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeTestPipeline() {
    console.log("=== STARTING GENLAYER PROJECT INTEGRATION TEST ===");
    
    try {
        const testClaim = "The package arrived completely empty, but the merchant refuses to refund saying it was marked delivered.";
        
        // 1. Submit Dispute text
        const txHash1 = await fileDispute(testClaim);
        console.log(`✅ File Dispute Tx Sent! Hash: ${txHash1}\n`);
        
        // 2. Trigger AI Validator Jury
        const disputeId = 1;
        const txHash2 = await resolveDispute(disputeId);
        console.log(`✅ AI Jury Execution Triggered! Hash: ${txHash2}\n`);
        
        console.log("⏳ Waiting for Decentralized AI Jury to reach consensus across nodes...");
        
        // 3. Poll storage state until the AI results finalize
        let status = { status: "Awaiting AI Jury Consensus" };
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            attempts++;
            console.log(`[Polling GenVM Storage] Checking status (Attempt ${attempts}/${maxAttempts})...`);
            
            status = await getDisputeStatus(disputeId);
            
            // Break the loop if the text changes from the default waiting state
            if (status && status.status !== "Awaiting AI Jury Consensus") {
                break;
            }
            
            // Wait 5 seconds between checks for the block to mine and AI to infer
            await sleep(5000); 
        }

        console.log("\n=================== TEST RESULT ===================");
        console.log(`Claim Text Stored: ${testClaim}`);
        console.log(`AI Jury Decision: `, JSON.stringify(status, null, 2));
        console.log("===================================================\n");
        
    } catch (error) {
        console.error("❌ Test Script Failed:", error);
    }
}

executeTestPipeline();