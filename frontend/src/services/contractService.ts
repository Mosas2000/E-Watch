import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  fetchCallReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import logger from '../utils/logger';

const network = STACKS_MAINNET;
const contractAddress = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const contractName = 'ewatch';

export const registerEvent = async (eventType: string, data: string) => {
  logger.info('Initiating event registration', {
    eventType,
    dataLength: data.length,
  });

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'register-event',
      functionArgs: [stringAsciiCV(eventType), stringAsciiCV(data)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        logger.transaction('Event registration completed', {
          eventType,
          txid: data.txId,
        });
        resolve(data);
      },
      onCancel: () => {
        logger.warn('Event registration cancelled by user', {
          eventType,
        });
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
};

export const getEvent = async (eventId: number) => {
  logger.debug('Fetching event from contract', {
    eventId,
    contractAddress,
  });

  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-event',
      functionArgs: [uintCV(eventId)],
      network,
      senderAddress: contractAddress,
    });

    const data = cvToJSON(result);
    logger.info('Event retrieved successfully', {
      eventId,
      found: !!data.value,
    });
    
    return data;
  } catch (error: any) {
    logger.error('Failed to fetch event', {
      eventId,
      error: error.message,
    });
    throw error;
  }
};

export const getEventCount = async () => {
  logger.debug('Fetching event count from contract', {
    contractAddress,
  });

  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-event-count',
      functionArgs: [],
      network,
      senderAddress: contractAddress,
    });

    const data = cvToJSON(result);
    logger.info('Event count retrieved', {
      count: data.value?.value,
    });
    
    return data;
  } catch (error: any) {
    logger.error('Failed to fetch event count', {
      error: error.message,
    });
    throw error;
  }
};

export const updateEvent = async (eventId: number, newData: string) => {
  const userData = userSession.loadUserData();
  
  const txOptions = {
    contractAddress,
    contractName,
    functionName: 'update-event',
    functionArgs: [uintCV(eventId), stringAsciiCV(newData)],
    senderKey: userData.appPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction({ transaction, network });
};

export const deactivateEvent = async (eventId: number) => {
  const userData = userSession.loadUserData();
  
  const txOptions = {
    contractAddress,
    contractName,
    functionName: 'deactivate-event',
    functionArgs: [uintCV(eventId)],
    senderKey: userData.appPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction({ transaction, network });
};
