# Contributing

Thanks for considering a contribution to MediTrace Blockchain SCM.

This repository is a reference implementation for blockchain-backed medicine
supply chain traceability. Contributions should make the system easier to run,
audit, test, and adapt.

## Local Development

Start Ganache on `127.0.0.1:8545`, then:

```bash
npm install
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npx truffle migrate --reset --network development
```

Copy the deployed contract address into `backend/.env`.

Run the backend:

```bash
cd backend
npm install
npm run dev
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Verification

From the root:

```bash
npm test
```

From `frontend/`:

```bash
npm run build
npm run lint
```

## Pull Request Guidelines

- Keep changes focused.
- Add contract tests for Solidity behavior changes.
- Add screenshots for frontend changes.
- Do not commit `.env` files, private keys, or real RPC credentials.
- Document any setup or migration steps.

## Good First Issues

- Add contract tests for participant role restrictions.
- Improve frontend error states for failed transactions.
- Add contract event indexing examples.
- Add deployment docs for Polygon Amoy and Ethereum Sepolia.
- Add CI for contract tests and frontend build.
