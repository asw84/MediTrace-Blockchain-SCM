# Demo Submission: Enhanced Medicine Supply Chain
**Candidate:** Sergei Aviatsiuk  
**Focus:** Option A – Smart Contract + Backend Integration

## What's New (Demo Enhancements)
I have transformed the base repository into a professional **Audit Trail** system. While the original project focused on simple status overwriting, my implementation ensures **Immutable Data Integrity**—a must-have for the pharmaceutical industry.

### Blockchain & Solidity (Core Task)
- **Immutable History:** Added a `ShipmentNote` struct and mapping-based history logic. Every status update now records a mandatory note, timestamp, and author's address on-chain.
- **Unit Testing:** Integrated Javascript tests (`truffle test`) to verify logic, state transitions, and security reverts.

### Backend & Hybrid Data Layer
- **Web3.js Orchestration:** Built robust async controllers to handle real-time data flow between the UI and the Ethereum (Ganache) network.
- **"Plug & Play" Demo Mode:** To respect the reviewer's time, I implemented a **Hybrid Data Layer**. Metadata (medicine names) is served via local mocks, while **all Shipment Logs and Notes are fetched live from the Blockchain**. No MongoDB Atlas setup is required to verify the Web3 functionality.

### Frontend & UX
- **Shipment Timeline:** Developed a professional UI component that visualizes the medicine's journey as a vertical audit trail.
- **Transaction States:** Implemented clear visual feedback: Loading (Mining), Success (TX Hash), and Error handling.

---

## ⚡ Quick Start (Verify in 5 mins)

### 1. Prerequisites
Ensure you have [Ganache](https://trufflesuite.com/ganache/) running on `127.0.0.1:8545`.

### 2. Deploy Smart Contract
```bash
npx truffle migrate --reset
```

### 3. Start Backend
```bash
cd backend
npm install
npm start
```
*Server will run on http://localhost:5001*

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*App will run on http://localhost:5173*

### 5. Test the Flow
Navigate to **Shipments**, find a demo shipment (e.g., #DEMO-TRACK-001), click **"View Timeline & Add Notes"**, and submit a new status update to see it recorded on the blockchain.

---

## Environment Configuration (For Reviewers)
The `.env` files are already pre-configured for a local Ganache environment:
- **Backend Port:** 5001
- **Blockchain:** http://127.0.0.1:8545
- **Demo Mode:** Active (MongoDB is optional)

## License
This project is licensed under the MIT License.
