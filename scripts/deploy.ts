import { makeContractDeploy, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { readFileSync } from 'fs';
import * as toml from '@iarna/toml';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';

const configPath = 'settings/mainnet.toml';
const config: any = toml.parse(readFileSync(configPath, 'utf-8'));

const network = config.settings.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
const contractCode = readFileSync('contracts/ewatch.clar', 'utf-8');

async function deployContract() {
  const mnemonic = config.settings.mnemonic;
  
  if (!mnemonic || mnemonic.includes('your twelve')) {
    console.error('❌ Please add your mnemonic phrase to settings/mainnet.toml');
    process.exit(1);
  }

  console.log('🚀 Deploying E-Watch contract to', config.settings.network + '...');
  console.log('📄 Contract:', 'ewatch');

  const wallet = await generateWallet({ secretKey: mnemonic, password: '' });
  const account = wallet.accounts[0];
  const address = getStxAddress({ account, network });
  
  console.log('📍 Deployer address:', address);

  const txOptions = {
    contractName: 'ewatch',
    codeBody: contractCode,
    senderKey: account.stxPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
  };

  try {
    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction({ transaction, network });
    
    console.log('✅ Contract deployed successfully!');
    console.log('📝 Transaction ID:', broadcastResponse.txid);
    console.log('🔍 Explorer:', `https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=${config.settings.network}`);
  } catch (error: any) {
    console.error('❌ Deployment failed:', error.message || error);
    if (error.reason) console.error('Reason:', error.reason);
    process.exit(1);
  }
}

deployContract();
