import { makeContractDeploy, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const network = new StacksMainnet();
const contractCode = readFileSync('contracts/ewatch.clar', 'utf-8');

async function deployContract() {
  const deployerKey = process.env.DEPLOYER_KEY;
  
  if (!deployerKey) {
    console.error('DEPLOYER_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('Deploying E-Watch contract to mainnet...');

  const txOptions = {
    contractName: 'ewatch',
    codeBody: contractCode,
    senderKey: deployerKey,
    network,
    anchorMode: AnchorMode.Any,
  };

  try {
    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    
    console.log('Contract deployed successfully');
    console.log('Transaction ID:', broadcastResponse.txid);
    console.log('Check status at: https://explorer.hiro.so/txid/' + broadcastResponse.txid);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deployContract();
