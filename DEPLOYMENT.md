# E-Watch Deployment Guide

## Prerequisites
- Node.js 18 or higher
- Stacks wallet with STX for deployment fees
- Private key exported from wallet

## Environment Setup

1. Install dependencies:
```bash
npm install
cd frontend && npm install && cd ..
```

2. Create .env file from template:
```bash
cp .env.example .env
```

3. Add your private key to .env:
```
DEPLOYER_KEY=your_actual_private_key
```

## Testing

Run contract tests:
```bash
npm run test
```

## Deployment to Mainnet

1. Ensure you have sufficient STX in your deployment wallet

2. Deploy the contract:
```bash
npm run deploy
```

3. Wait for transaction confirmation

4. Update frontend configuration with deployed contract address

5. Build frontend:
```bash
npm run build
```

6. Deploy frontend to hosting service

## Verification

1. Check contract deployment on explorer
2. Test contract functions via frontend
3. Verify all transactions complete successfully

## Mainnet Contract Details

After deployment, your contract will be at:
- Address: [Your Deployer Address]
- Contract Name: ewatch
- Explorer: https://explorer.hiro.so/

## Support

For issues or questions, refer to project README.md
