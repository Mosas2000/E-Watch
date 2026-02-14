import { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, stringAsciiCV } from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import { readFileSync } from 'fs';
import * as toml from '@iarna/toml';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';
import logger from '../utils/logger';
import { createLogContext } from '../utils/requestId';
import { maskAddress, maskTxId, sanitizeError } from '../utils/sanitizer';

const configPath = 'settings/mainnet.toml';
const config: any = toml.parse(readFileSync(configPath, 'utf-8'));
const network = STACKS_MAINNET;

// Contract details from deployment
const contractAddress = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const contractName = 'ewatch';

async function registerEvent() {
  const context = createLogContext(undefined, {
    operation: 'registerEvent',
    contractAddress: maskAddress(contractAddress),
    contractName,
  });

  logger.info('Starting test event registration', context);

  const mnemonic = config.settings.mnemonic;
  
  if (!mnemonic || mnemonic.includes('your twelve')) {
    logger.error('Invalid or missing mnemonic in configuration', context);
    console.error('❌ Please add your mnemonic phrase to settings/mainnet.toml');
    process.exit(1);
  }

  logger.info('Registering event on E-Watch contract', {
    ...context,
    contractId: `${contractAddress}.${contractName}`,
  });
  console.log('🚀 Registering event on E-Watch contract...');
  console.log('📄 Contract:', `${contractAddress}.${contractName}`);

  // Generate wallet from mnemonic
  const wallet = await generateWallet({ secretKey: mnemonic, password: '' });
  const account = wallet.accounts[0];
  const senderAddress = getStxAddress({ account, network });
  
  logger.debug('Wallet generated', {
    ...context,
    senderAddress: maskAddress(senderAddress),
  });
  console.log('📍 Sender address:', senderAddress);

  // Event data
  const eventType = 'test-transaction';
  const eventData = JSON.stringify({
    message: 'First on-chain transaction',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
  
  logger.info('Event data prepared', {
    ...context,
    eventType,
    eventDataLength: eventData.length,
  });
  console.log('📝 Event Type:', eventType);
  console.log('📝 Event Data:', eventData);

  // Validate string lengths
  if (eventType.length > 50) {
    logger.error('Event type exceeds character limit', {
      ...context,
      eventType,
      length: eventType.length,
      maxLength: 50,
    });
    console.error('❌ Event type exceeds 50 characters');
    process.exit(1);
  }
  if (eventData.length > 500) {
    logger.error('Event data exceeds character limit', {
      ...context,
      dataLength: eventData.length,
      maxLength: 500,
    });
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
    logger.debug('Creating contract call transaction', context);
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
