import {
  makeContractCall,
  broadcastTransaction,
  callReadOnlyFunction,
  cvToValue,
  uintCV,
  stringAsciiCV,
  boolCV,
  standardPrincipalCV,
  AnchorMode,
  PostConditionMode,
} from "@stacks/transactions";
import { StacksMainnet } from "@stacks/network";

/**
 * E-Watch v1 -> v2 Migration Script
 *
 * Reads all events from the v1 contract and imports them into v2
 * using the migrate-event function. Follows the procedure defined
 * in docs/MIGRATION.md.
 *
 * Usage:
 *   npx ts-node scripts/migrate-v1-to-v2.ts
 *
 * Environment variables:
 *   DEPLOYER_KEY - hex private key of the deployer/admin
 *
 * The script will:
 *   1. Read the v1 event count
 *   2. Fetch each event from v1
 *   3. Pause v2
 *   4. Import each event into v2 via migrate-event
 *   5. Set the v2 counter to match v1
 *   6. Verify all events
 *   7. Unpause v2
 */

const V1_CONTRACT_ADDRESS = "SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T";
const V1_CONTRACT_NAME = "ewatch";
const V2_CONTRACT_ADDRESS = "SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T";
const V2_CONTRACT_NAME = "ewatch-v2";

const network = new StacksMainnet();

interface EventRecord {
  id: number;
  owner: string;
  eventType: string;
  timestamp: number;
  data: string;
  active: boolean;
}

// ── Read v1 state ────────────────────────────────────────

async function getV1EventCount(): Promise<number> {
  const result = await callReadOnlyFunction({
    contractAddress: V1_CONTRACT_ADDRESS,
    contractName: V1_CONTRACT_NAME,
    functionName: "get-event-count",
    functionArgs: [],
    network,
    senderAddress: V1_CONTRACT_ADDRESS,
  });
  const value = cvToValue(result);
  return Number(value.value);
}

async function getV1Event(eventId: number): Promise<EventRecord | null> {
  const result = await callReadOnlyFunction({
    contractAddress: V1_CONTRACT_ADDRESS,
    contractName: V1_CONTRACT_NAME,
    functionName: "get-event",
    functionArgs: [uintCV(eventId)],
    network,
    senderAddress: V1_CONTRACT_ADDRESS,
  });
  const value = cvToValue(result);
  if (!value) return null;
  return {
    id: eventId,
    owner: value.owner.value || value.owner,
    eventType: value["event-type"].value || value["event-type"],
    timestamp: Number(value.timestamp.value || value.timestamp),
    data: value.data.value || value.data,
    active: value.active.value !== undefined ? value.active.value : value.active,
  };
}

// ── Write to v2 ──────────────────────────────────────────

async function pauseV2(senderKey: string, nonce: number): Promise<string> {
  const tx = await makeContractCall({
    contractAddress: V2_CONTRACT_ADDRESS,
    contractName: V2_CONTRACT_NAME,
    functionName: "pause-contract",
    functionArgs: [],
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    nonce,
    fee: 2000,
  });
  const result = await broadcastTransaction(tx, network);
  return typeof result === "string" ? result : result.txid;
}

async function migrateEventToV2(
  senderKey: string,
  nonce: number,
  event: EventRecord
): Promise<string> {
  const tx = await makeContractCall({
    contractAddress: V2_CONTRACT_ADDRESS,
    contractName: V2_CONTRACT_NAME,
    functionName: "migrate-event",
    functionArgs: [
      uintCV(event.id),
      standardPrincipalCV(event.owner),
      stringAsciiCV(event.eventType),
      uintCV(event.timestamp),
      stringAsciiCV(event.data),
      boolCV(event.active),
    ],
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    nonce,
    fee: 3000,
  });
  const result = await broadcastTransaction(tx, network);
  return typeof result === "string" ? result : result.txid;
}

async function setV2Counter(
  senderKey: string,
  nonce: number,
  count: number
): Promise<string> {
  const tx = await makeContractCall({
    contractAddress: V2_CONTRACT_ADDRESS,
    contractName: V2_CONTRACT_NAME,
    functionName: "set-event-counter",
    functionArgs: [uintCV(count)],
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    nonce,
    fee: 2000,
  });
  const result = await broadcastTransaction(tx, network);
  return typeof result === "string" ? result : result.txid;
}

async function unpauseV2(senderKey: string, nonce: number): Promise<string> {
  const tx = await makeContractCall({
    contractAddress: V2_CONTRACT_ADDRESS,
    contractName: V2_CONTRACT_NAME,
    functionName: "unpause-contract",
    functionArgs: [],
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    nonce,
    fee: 2000,
  });
  const result = await broadcastTransaction(tx, network);
  return typeof result === "string" ? result : result.txid;
}

// ── Verification ─────────────────────────────────────────

async function getV2Event(eventId: number): Promise<EventRecord | null> {
  const result = await callReadOnlyFunction({
    contractAddress: V2_CONTRACT_ADDRESS,
    contractName: V2_CONTRACT_NAME,
    functionName: "get-event",
    functionArgs: [uintCV(eventId)],
    network,
    senderAddress: V2_CONTRACT_ADDRESS,
  });
  const value = cvToValue(result);
  if (!value) return null;
  return {
    id: eventId,
    owner: value.owner.value || value.owner,
    eventType: value["event-type"].value || value["event-type"],
    timestamp: Number(value.timestamp.value || value.timestamp),
    data: value.data.value || value.data,
    active: value.active.value !== undefined ? value.active.value : value.active,
  };
}

function compareEvents(v1: EventRecord, v2: EventRecord): boolean {
  return (
    v1.owner === v2.owner &&
    v1.eventType === v2.eventType &&
    v1.timestamp === v2.timestamp &&
    v1.data === v2.data &&
    v1.active === v2.active
  );
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const senderKey = process.env.DEPLOYER_KEY;
  if (!senderKey) {
    console.error("Error: DEPLOYER_KEY environment variable is required");
    process.exit(1);
  }

  console.log("Starting v1 -> v2 migration");
  console.log(`v1: ${V1_CONTRACT_ADDRESS}.${V1_CONTRACT_NAME}`);
  console.log(`v2: ${V2_CONTRACT_ADDRESS}.${V2_CONTRACT_NAME}`);
  console.log("");

  // Step 1: Read v1 state
  const eventCount = await getV1EventCount();
  console.log(`v1 event count: ${eventCount}`);

  const v1Events: EventRecord[] = [];
  for (let i = 0; i < eventCount; i++) {
    const ev = await getV1Event(i);
    if (ev) {
      v1Events.push(ev);
      console.log(`  read event ${i}: ${ev.eventType} (${ev.active ? "active" : "inactive"})`);
    } else {
      console.log(`  event ${i}: not found (skipping)`);
    }
  }

  console.log(`\nTotal events to migrate: ${v1Events.length}`);

  // Step 2: Pause v2
  let nonce = 0; // caller must set correct starting nonce
  console.log("\nPausing v2 contract...");
  const pauseTxId = await pauseV2(senderKey, nonce++);
  console.log(`  pause tx: ${pauseTxId}`);
  console.log("  waiting for confirmation (check explorer)...");

  // Step 3: Import events
  console.log("\nImporting events to v2...");
  for (const ev of v1Events) {
    const txId = await migrateEventToV2(senderKey, nonce++, ev);
    console.log(`  migrated event ${ev.id}: tx ${txId}`);
  }

  // Step 4: Set counter
  console.log(`\nSetting v2 counter to ${eventCount}...`);
  const counterTxId = await setV2Counter(senderKey, nonce++, eventCount);
  console.log(`  counter tx: ${counterTxId}`);

  // Step 5: Verify (after transactions confirm)
  console.log("\nVerification (run after transactions confirm):");
  console.log("  Comparing v1 snapshot against v2 records...");

  let mismatches = 0;
  for (const v1Ev of v1Events) {
    const v2Ev = await getV2Event(v1Ev.id);
    if (!v2Ev) {
      console.log(`  event ${v1Ev.id}: MISSING on v2`);
      mismatches++;
    } else if (!compareEvents(v1Ev, v2Ev)) {
      console.log(`  event ${v1Ev.id}: DATA MISMATCH`);
      console.log(`    v1: ${JSON.stringify(v1Ev)}`);
      console.log(`    v2: ${JSON.stringify(v2Ev)}`);
      mismatches++;
    } else {
      console.log(`  event ${v1Ev.id}: verified`);
    }
  }

  if (mismatches > 0) {
    console.log(`\n${mismatches} mismatch(es) found. Review and re-import as needed.`);
    console.log("See docs/ROLLBACK.md for recovery procedures.");
    process.exit(1);
  }

  // Step 6: Unpause v2
  console.log("\nAll events verified. Unpausing v2...");
  const unpauseTxId = await unpauseV2(senderKey, nonce++);
  console.log(`  unpause tx: ${unpauseTxId}`);

  console.log("\nMigration complete.");
  console.log(`  Total events migrated: ${v1Events.length}`);
  console.log(`  Total transactions: ${nonce}`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
