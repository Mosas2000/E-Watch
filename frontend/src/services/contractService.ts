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

const network = STACKS_MAINNET;
const contractAddress = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const contractName = 'ewatch';

export const registerEvent = async (eventType: string, data: string) => {
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
        resolve(data);
      },
      onCancel: () => {
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
};

export const getEvent = async (eventId: number) => {
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-event',
    functionArgs: [uintCV(eventId)],
    network,
    senderAddress: contractAddress,
  });

  return cvToJSON(result);
};

export const getEventCount = async () => {
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-event-count',
    functionArgs: [],
    network,
    senderAddress: contractAddress,
  });

  return cvToJSON(result);
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
