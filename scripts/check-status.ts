import { STACKS_MAINNET } from '@stacks/network';

const API_URL = 'https://api.mainnet.hiro.so';

// All transaction IDs from our broadcasts
const txIds = [
  // First batch (earlier)
  'e562c0c33c8b091ea6dc9e7104e1044197dee11ccdac99844479d0017b0df004',
  '0469d7e1404dc80672b59f03cfadcc07b6c02923a39fac543d4779142373ef21',
  '53239fb3ce6b600455ca088312116d297f8ac56a0bade5aaa7b61a17dcfacf24',
  '02e87c32a08134f3dad86c146c3f5b01dc954c6ed7f79081fddaf5710afa98b3',
  // Second batch
  '4b6cbf9111f8a5c536bdb459dca89fcdf29731b9680a95d595f9bb8050934bc8',
  '5defb4da91f2ab79f0f7bf4285c64678695257f9f6fd369e733f341bc5e23e3d',
  'ad290344a01d55774c10e0ed3a239cdc8920b53bb17dc9e5c9fe82dc4041e905',
  // Third batch
  '993031f7e68a5025dd2a5cceca25965e92d51d103ec1c723c013f404b34d2079',
  'aba753cfe89c1e357216bb8aa83c1cc094d0b38c9f578ef4de77aeca6bd448dc',
  '53fae952bdc69d8edcef76b2df713284ae406fb2ada8bbc2a27c6a7c11bd16d7',
];

async function checkTransactionStatus() {
  console.log('🔍 Checking transaction statuses...\n');
  console.log(`📊 Total Transactions: ${txIds.length}\n`);

  let confirmed = 0;
  let pending = 0;
  let failed = 0;

  for (let i = 0; i < txIds.length; i++) {
    const txId = txIds[i];
    try {
      console.log(`[${i + 1}/${txIds.length}] Checking ${txId.substring(0, 8)}...`);
      
      // Fetch from Stacks API directly
      const response = await fetch(`${API_URL}/extended/v1/tx/${txId}`);
      const tx: any = await response.json();
      
      if (tx.tx_status === 'success') {
        console.log(`   ✅ Confirmed in block ${tx.block_height}`);
        confirmed++;
      } else if (tx.tx_status === 'pending') {
        console.log(`   ⏳ Pending (in mempool)`);
        pending++;
      } else if (tx.tx_status === 'abort_by_response' || tx.tx_status === 'abort_by_post_condition') {
        console.log(`   ❌ Failed: ${tx.tx_status}`);
        failed++;
      } else {
        console.log(`   ❓ Status: ${tx.tx_status}`);
      }
    } catch (error: any) {
      if (error.message?.includes('404')) {
        console.log(`   ⏳ Not yet visible (still propagating)`);
        pending++;
      } else {
        console.log(`   ❌ Error checking: ${error.message}`);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`   ✅ Confirmed: ${confirmed}`);
  console.log(`   ⏳ Pending: ${pending}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

checkTransactionStatus();
