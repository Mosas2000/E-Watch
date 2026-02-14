import { makeContractDeploy, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { readFileSync } from 'fs';
import * as toml from '@iarna/toml';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';
import logger from '../utils/logger';
import { createLogContext } from '../utils/requestId';
import { maskAddress, sanitizeError } from '../utils/sanitizer';

const configPath = 'settings/mainnet.toml';
const config: any = toml.parse(readFileSync(configPath, 'utf-8'));

const network = config.settings.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
const contractCode = readFileSync('contracts/ewatch.clar', 'utf-8');

async function deployContract() {
  const context = createLogContext(undefined, {
    operation: 'deployContract',
    network: config.settings.network,
  });

  logger.info('Starting contract deployment', context);

  const mnemonic = config.settings.mnemonic;
  
  if (!mnemonic || mnemonic.includes('your twelve')) {
    logger.error('Invalid or missing mnemonic in configuration', {
      ...context,
      configPath,
    });
    console.error('❌ Please add your mnemonic phrase to settings/mainnet.toml');
    process.exit(1);
  }

  logger.info('Deploying E-Watch contract', {
    ...context,
    contractName: 'ewatch',
    network: config.settings.network,
  });
  console.log('🚀 Deploying E-Watch contract to', config.settings.network + '...');
  console.log('📄 Contract:', 'ewatch');

  const wallet = await generateWallet({ secretKey: mnemonic, password: '' });
  const account = wallet.accounts[0];
  const address = getStxAddress({ account, network });
  
  logger.info('Generated deployer wallet', {
    ...context,
    address: maskAddress(address),
  });
  console.log('📍 Deployer address:', address);

  const txOptions = {
    contractName: 'ewatch',
    codeBody: contractCode,
    senderKey: account.stxPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
  };

  try {
    logger.debug('Creating contract deployment transaction', {
      ...context,
      contractName: 'ewatch',
      codeLength: contractCode.length,
    });

    const transaction = await makeContractDeploy(txOptions);

    logger.info('Broadcasting transaction to network', context);
    const broadcastResponse = await broadcastTransaction({ transaction, network });
    
    logger.info('Contract deployed successfully', {
      ...context,
      txid: broadcastResponse.txid,
      explorerUrl: `https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=${config.settings.network}`,
    });

    console.log('✅ Contract deployed successfully!');
    console.log('📝 Transaction ID:', broadcastResponse.txid);
    console.log('🔍 Explorer:', `https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=${config.settings.network}`);
  } catch (error: any) {
    logger.error('Contract deployment failed', {
      ...context,
      error: sanitizeError(error),
    });

    console.error('❌ Deployment failed:', error.message || error);
    if (error.reason) console.error('Reason:', error.reason);
    process.exit(1);
  }
}

deployContract();
