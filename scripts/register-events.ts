import { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, stringAsciiCV } from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import { readFileSync } from 'fs';
import * as toml from '@iarna/toml';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';

const configPath = 'settings/mainnet.toml';
const config: any = toml.parse(readFileSync(configPath, 'utf-8'));
const network = STACKS_MAINNET;

const contractAddress = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const contractName = 'ewatch';

// Event templates
const events = [
  {
    type: 'transfer',
    data: JSON.stringify({ from: 'SP123', to: 'SP456', amount: 1000, token: 'STX' })
  },
  {
    type: 'mint',
    data: JSON.stringify({ collection: 'E-Watch-NFT', tokenId: 1, recipient: 'SP789' })
  },
  {
    type: 'burn',
    data: JSON.stringify({ asset: 'test-token', amount: 500, burner: 'SP999' })
  }
];

async function registerMultipleEvents() {
  const mnemonic = config.settings.mnemonic;
  
  if (!mnemonic || mnemonic.includes('your twelve')) {
    console.error('❌ Please add your mnemonic phrase to settings/mainnet.toml');
    process.exit(1);
  }

  console.log('🚀 Registering multiple events on E-Watch contract...');
  console.log('📄 Contract:', `${contractAddress}.${contractName}\n`);

  const wallet = await generateWallet({ secretKey: mnemonic, password: '' });
  const account = wallet.accounts[0];
  const senderAddress = getStxAddress({ account, network });
  
  console.log('📍 Sender address:', senderAddress);
  console.log(`📊 Registering ${events.length} events...\n`);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Event ${i + 1}/${events.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('📝 Type:', event.type);
    console.log('📝 Data:', event.data);

    // Validate string lengths
    if (event.type.length > 50) {
      console.error('❌ Event type exceeds 50 characters');
      continue;
    }
    if (event.data.length > 500) {
      console.error('❌ Event data exceeds 500 characters');
      continue;
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName: 'register-event',
      functionArgs: [
        stringAsciiCV(event.type),
        stringAsciiCV(event.data)
      ],
      senderKey: account.stxPrivateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    try {
      console.log('⏳ Creating transaction...');
      const transaction = await makeContractCall(txOptions);
      
      console.log('⏳ Broadcasting transaction...');
      const broadcastResponse = await broadcastTransaction({ transaction, network });
      
      console.log('✅ Event registered successfully!');
      console.log('📝 Transaction ID:', broadcastResponse.txid);
      console.log('🔍 Explorer:', `https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=mainnet`);
      
      // Wait a moment between transactions to avoid nonce conflicts
      if (i < events.length - 1) {
        console.log('\n⏳ Waiting 3 seconds before next transaction...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error: any) {
      console.error('\n❌ Transaction failed:', error.message || error);
      if (error.reason) console.error('Reason:', error.reason);
      if (error.error) console.error('Error:', error.error);
      console.log('⏩ Continuing with next event...');
    }
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All transactions completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏰ Wait for confirmations (usually 10-30 minutes per tx)');
}

registerMultipleEvents();
