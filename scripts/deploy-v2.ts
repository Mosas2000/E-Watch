import { makeContractDeploy, broadcastTransaction, AnchorMode, TransactionVersion, ClarityVersion } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { readFileSync } from 'fs';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';

/**
 * Deploy ewatch-v2 contract to mainnet.
 *
 * Usage:
 *   npx ts-node scripts/deploy-v2.ts
 */

const toml = require('toml');
const configPath = 'settings/mainnet.toml';
const config: any = toml.parse(readFileSync(configPath, 'utf-8'));
const network = new StacksMainnet();
const contractCode = readFileSync('contracts/ewatch-v2.clar', 'utf-8');

async function deployV2() {
  const mnemonic = config.settings.mnemonic;

  if (!mnemonic || mnemonic.includes('your twelve')) {
    console.error('Missing or placeholder mnemonic in settings/mainnet.toml');
    process.exit(1);
  }

  console.log('Deploying ewatch-v2 to mainnet...');
  console.log('Contract size:', contractCode.length, 'bytes');

  const wallet = await generateWallet({ secretKey: mnemonic, password: '' });
  const account = wallet.accounts[0];
  const address = getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet });

  console.log('Deployer:', address);

  const txOptions = {
    contractName: 'ewatch-v2',
    codeBody: contractCode,
    senderKey: account.stxPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    clarityVersion: ClarityVersion.Clarity3,
    fee: 50000,
  };

  try {
    const transaction = await makeContractDeploy(txOptions);
    const serialized = Buffer.from(transaction.serialize());
    console.log('Broadcasting (' + serialized.length + ' bytes)...');

    const response = await fetch('https://api.mainnet.hiro.so/v2/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: serialized,
    });

    const text = await response.text();

    if (!response.ok) {
      console.error('Broadcast rejected (' + response.status + '):', text);
      process.exit(1);
    }

    // Successful broadcast returns the txid as a JSON string
    const txid = text.replace(/"/g, '');
    console.log('Deployed successfully');
    console.log('Transaction ID:', txid);
    console.log('Explorer: https://explorer.hiro.so/txid/' + txid + '?chain=mainnet');
  } catch (error: any) {
    console.error('Deployment failed:', error.message || error);
    if (error.reason) console.error('Reason:', error.reason);
    process.exit(1);
  }
}

deployV2();
