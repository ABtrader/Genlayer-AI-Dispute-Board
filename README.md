# GenLayer AI Dispute Board

An automated, decentralized dispute resolution backend engine powered by GenLayer's Asimov Testnet. This project utilizes Intelligent Contracts written in Python and a JavaScript integration layer to orchestrate an automated AI Jury system via the Equivalence Principle.

## 🚀 How It Works

1. **`file_dispute`**: Submits raw e-commerce/logistics text claims directly to GenVM storage.
2. **`resolve_dispute`**: Triggers decentralized validator nodes running LLMs to evaluate the evidence, reach consensus, and write back a deterministic verdict.
3. **`get_status`**: Polls and parses the live execution status and JSON payload string back into the local environment.

## 🛠️ Project Structure

* `dispute_resolver.py` - The Intelligent Contract running on GenVM.
* `app.js` - Core client interface configuration mapping to the Asimov RPC layer (`genlayer-js`).
* `deploy.js` - Deployment pipeline automation script for compiling and migrating contracts.
* `run_test.js` - End-to-end integration test runner with active storage polling.

## ⚙️ Setup Instructions

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install