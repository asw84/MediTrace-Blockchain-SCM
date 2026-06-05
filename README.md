# MediTrace Blockchain SCM

MediTrace is an open-source reference application for pharmaceutical supply
chain traceability. It combines a Solidity smart contract, an Express backend,
and a React frontend to record medicine lifecycle events and shipment audit
notes on a local or testnet blockchain.

The project focuses on one practical problem: medicine supply chains need an
audit trail that cannot be silently rewritten. MediTrace stores shipment status
changes and notes as append-only blockchain history while keeping product
metadata available through a conventional web API.

## Why This Matters

Counterfeit medicine, incomplete shipment records, and weak handoff visibility
are real risks in pharmaceutical logistics. A transparent audit trail helps
manufacturers, distributors, retailers, and auditors verify what happened, when
it happened, and who signed the update.

MediTrace is not a production compliance system yet. It is a maintainable
starting point for builders who want to study or extend blockchain-backed
traceability workflows.

## Highlights

- Solidity smart contract for medicine stages, participants, shipments, and
  transaction history.
- Append-only shipment notes with status, note text, timestamp, and updater
  address.
- Truffle test suite for shipment note behavior and revert cases.
- Express backend that orchestrates Web3 contract calls.
- React + Vite frontend for medicines, participants, shipments, transactions,
  and shipment timelines.
- Local Ganache workflow for quick verification.
- Optional MongoDB integration with demo mode fallback.

## Architecture

```text
React frontend
  Vite, Tailwind, Web3 UI flows
        |
Express API
  medicines, participants, shipments, transactions
        |
Web3.js / contract ABI
        |
Solidity smart contract
  medicine lifecycle, shipment notes, transaction history
        |
Ganache or EVM-compatible testnet
```

## Quick Start

### Requirements

- Node.js 18+
- npm
- Ganache running at `127.0.0.1:8545`

### 1. Install Root Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

For local Ganache, the defaults are enough after you deploy the contract and set
`CONTRACT_ADDRESS` in `backend/.env`.

### 3. Deploy the Smart Contract

```bash
npx truffle migrate --reset --network development
```

Copy the deployed contract address into:

```env
backend/.env
CONTRACT_ADDRESS=0x...
```

### 4. Run the Backend

```bash
cd backend
npm install
npm run dev
```

Backend health check:

```text
http://localhost:5001/health
```

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Useful Commands

From the repository root:

```bash
npm run migrate
npm test
```

From `backend/`:

```bash
npm run dev
```

From `frontend/`:

```bash
npm run dev
npm run build
npm run lint
```

## Smart Contract Scope

The `SupplyChain` contract currently supports:

- owner-managed participant registration;
- medicine lifecycle stages from ordered to sold;
- shipment creation by distributors;
- shipment status updates;
- immutable shipment note history;
- transaction history for lifecycle events.

The core audit-trail method is:

```solidity
function updateShipmentStatusWithNote(
    string memory trackingId,
    ShipmentStatus status,
    string memory note
) public
```

Each note stores:

- status;
- note text;
- block timestamp;
- updater address.

## Repository Layout

```text
contracts/       Solidity smart contracts
migrations/      Truffle deployment scripts
test/            Truffle contract tests
backend/         Express API and Web3 integration
frontend/        React + Vite application
assets/          screenshots and visual assets
```

## Security Notes

- Never commit `.env` files or private keys.
- Use Ganache-only private keys for local development.
- Use Truffle Dashboard or a managed wallet flow for real testnet deployments.
- Treat all public-chain data as public. Do not store patient data, secrets, or
  regulated private information on-chain.
- This project has not been audited.

See [SECURITY.md](SECURITY.md) for responsible disclosure and hardening notes.

## Roadmap

See [ROADMAP.md](ROADMAP.md). Current priorities include stronger role checks,
event indexing, CI for contract/frontend/backend checks, and clearer deployment
guides for testnets.

## Contributing

Contributions are welcome. Good first areas include tests, frontend state
handling, deployment documentation, and contract security hardening.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
