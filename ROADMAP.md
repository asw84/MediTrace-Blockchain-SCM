# Roadmap

MediTrace is an early reference implementation for auditable pharmaceutical
supply chain workflows.

## Near Term

- Add CI for Truffle tests and frontend build.
- Add stronger role checks for shipment status updates.
- Add more contract tests for medicine lifecycle transitions.
- Add frontend network detection and clearer wallet guidance.
- Add screenshots and a short demo recording to the README.

## Backend

- Add request validation for shipment and participant payloads.
- Make MongoDB integration fully optional and documented.
- Add structured logging for blockchain transaction lifecycle.
- Add API tests for shipment note endpoints.

## Frontend

- Improve transaction pending, confirmed, and failed states.
- Add timeline filters by status and participant.
- Add copyable transaction hashes and explorer links.
- Add empty states for local demo mode.

## Smart Contract

- Add event coverage for all lifecycle transitions.
- Add role-based restrictions for shipment updates.
- Add tests for invalid stage transitions.
- Add documentation for upgrade and migration limitations.

## Deployment

- Document Polygon Amoy deployment.
- Document Sepolia deployment.
- Add Truffle Dashboard workflow for safer signing.
- Add contract verification instructions.
