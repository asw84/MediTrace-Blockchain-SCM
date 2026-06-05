# Security Policy

MediTrace handles supply chain metadata and blockchain transactions. Please
report security issues privately when they could expose keys, bypass access
control, corrupt audit history, or misrepresent shipment state.

## Supported Versions

The `main` branch is the actively maintained development branch.

## Reporting a Vulnerability

Please do not open a public GitHub issue for sensitive findings. Contact the
maintainer through GitHub profile contact options and include:

- affected commit or version;
- reproduction steps;
- expected impact;
- suggested fix if known.

## Important Notes

- This project has not been audited.
- Do not use real private keys in `.env`.
- Do not store patient data, regulated private data, or secrets on-chain.
- Local Ganache keys are only for local development.
- Public testnet deployments should use dedicated test wallets.

## Hardening Backlog

- Add stricter role checks for shipment status updates.
- Add rate limiting and request validation in the backend.
- Add CI dependency scanning.
- Add frontend warnings when connected to an unexpected chain.
- Add event indexing instead of relying only on direct contract calls.
