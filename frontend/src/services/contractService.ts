import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  callReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { userSession } from '../auth';

const network = new StacksMainnet();
const contractAddress = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const contractName = 'ewatch';

export const registerEvent = async (eventType: string, data: string) => {
  const userData = userSession.loadUserData();
  
  const txOptions = {
    contractAddress,
    contractName,
    functionName: 'register-event',
    functionArgs: [stringAsciiCV(eventType), stringAsciiCV(data)],
    senderKey: userData.appPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, network);
  return broadcastResponse;
};

export const getEvent = async (eventId: number) => {
  const options = {
    contractAddress,
    contractName,
    functionName: 'get-event',
    functionArgs: [uintCV(eventId)],
    network,
    senderAddress: contractAddress,
  };

  const result = await callReadOnlyFunction(options);
  return cvToJSON(result);
};

export const getEventCount = async () => {
  const options = {
    contractAddress,
    contractName,
    functionName: 'get-event-count',
    functionArgs: [],
    network,
    senderAddress: contractAddress,
  };

  const result = await callReadOnlyFunction(options);
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
  return broadcastTransaction(transaction, network);
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
  return broadcastTransaction(transaction, network);
};
