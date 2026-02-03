import { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, stringAsciiCV } from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import { readFileSync } from 'fs';
import * as toml from '@iarna/toml';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';

const configPath = 'settings/mainnet.toml';
const config: any = toml.parse(readFileSync(configPath, 'utf-8'));
const network = STACKS_MAINNET;

// Contract details from deployment
const contractAddress = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const contractName = 'ewatch';

async function registerEvent() {
  const mnemonic = config.settings.mnemonic;
  
  if (!mnemonic || mnemonic.includes('your twelve')) {
    console.error('❌ Please add your mnemonic phrase to settings/mainnet.toml');
    process.exit(1);
  }

  console.log('🚀 Registering event on E-Watch contract...');
  console.log('📄 Contract:', `${contractAddress}.${contractName}`);

  // Generate wallet from mnemonic
  const wallet = await generateWallet({ secretKey: mnemonic, password: '' });
  const account = wallet.accounts[0];
  const senderAddress = getStxAddress({ account, network });
  
  console.log('📍 Sender address:', senderAddress);

  // Event data
  const eventType = 'test-transaction';
  const eventData = JSON.stringify({
    message: 'First on-chain transaction',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });

  console.log('📝 Event Type:', eventType);
  console.log('📝 Event Data:', eventData);

  // Validate string lengths
  if (eventType.length > 50) {
    console.error('❌ Event type exceeds 50 characters');
    process.exit(1);
  }
  if (eventData.length > 500) {
    console.error('❌ Event data exceeds 500 characters');
    process.exit(1);
  }

  const txOptions = {
    contractAddress,
    contractName,
    functionName: 'register-event',
    functionArgs: [
      stringAsciiCV(eventType),
      stringAsciiCV(eventData)
    ],
    senderKey: account.stxPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  try {
    console.log('\n⏳ Creating transaction...');
    const transaction = await makeContractCall(txOptions);
    
    console.log('⏳ Broadcasting transaction...');
    const broadcastResponse = await broadcastTransaction({ transaction, network });
    
    console.log('\n✅ Event registered successfully!');
    console.log('📝 Transaction ID:', broadcastResponse.txid);
    console.log('🔍 Explorer:', `https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=mainnet`);
    console.log('\n⏰ Wait for transaction to confirm (usually 10-30 minutes)');
  } catch (error: any) {
    console.error('\n❌ Transaction failed:', error.message || error);
    if (error.reason) console.error('Reason:', error.reason);
    if (error.error) console.error('Error:', error.error);
    process.exit(1);
  }
}

registerEvent();
