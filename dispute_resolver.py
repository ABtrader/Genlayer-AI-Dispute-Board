# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class DisputeResolver(gl.Contract):
    dispute_count: u256
    disputes: TreeMap[u256, str]

    def __init__(self):
        self.dispute_count = u256(0)
        self.disputes = TreeMap[u256, str]()

    @gl.public.write
    def file_dispute(self, claim_text: str) -> u256:
        self.dispute_count += u256(1)
        
        dispute_data = {
            "claim": claim_text,
            "verdict": "Awaiting AI Jury Consensus"
        }
        self.disputes[self.dispute_count] = json.dumps(dispute_data)
        return self.dispute_count

    @gl.public.view
    def get_status(self, dispute_id: u256) -> str:
        return self.disputes.get(dispute_id, "Dispute not found")

    @gl.public.write
    def resolve_dispute(self, dispute_id: u256) -> str:
        dispute_str = self.disputes.get(dispute_id, "")
        if not dispute_str:
            return "Invalid Dispute ID"

        dispute_record = json.loads(dispute_str)
        claim_text = dispute_record["claim"]

        # This lambda tells the leader node exactly what to ask the LLM
        prompt_fn = lambda: f"""
        You are an independent decentralized AI Judge resolving an e-commerce transaction dispute.
        
        Buyer Complaint: "{claim_text}"
        
        Determine a final verdict: should the funds be REFUNDED to the buyer or RELEASED to the merchant? 
        Provide a concise 2-sentence breakdown explaining your reasoning.
        """
        
        # EXACT SDK METHOD: Uses non-comparative validation against a core task & clear criteria
        ai_verdict = gl.eq_principle.prompt_non_comparative(
            prompt_fn,
            task="Resolve an e-commerce refund dispute based on the buyer's complaint description.",
            criteria="The response must explicitly declare a verdict (REFUNDED or RELEASED) and provide a clear 2-sentence rationale."
        )
        
        dispute_record["verdict"] = ai_verdict
        self.disputes[dispute_id] = json.dumps(dispute_record)
        return ai_verdict