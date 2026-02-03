import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

const network = STACKS_MAINNET;
const contractAddress = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const contractName = 'ewatch';

async function queryEvents() {
  console.log('🔍 Querying E-Watch contract events...');
  console.log('📄 Contract:', `${contractAddress}.${contractName}\n`);

  try {
    // Get total event count
    console.log('⏳ Fetching event count...');
    const countResult = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-event-count',
      functionArgs: [],
      network,
      senderAddress: contractAddress,
    });

    const countData = cvToJSON(countResult);
    const totalEvents = countData.value.value;
    
    console.log(`📊 Total Events Registered: ${totalEvents}\n`);

    if (totalEvents === 0) {
      console.log('ℹ️  No events found yet.');
      return;
    }

    // Fetch each event
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Fetching all events...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (let i = 0; i < totalEvents; i++) {
      try {
        const eventResult = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-event',
          functionArgs: [uintCV(i)],
          network,
          senderAddress: contractAddress,
        });

        const eventData = cvToJSON(eventResult);
        
        // Debug: log the raw response
        console.log(`\n🔖 Event ID: ${i}`);
        
        // Handle optional response: check if it's (some {...})
        if (eventData.type === 'optional' && eventData.value) {
          const event = eventData.value.value;
          console.log(`   👤 Owner: ${event.owner.value}`);
          console.log(`   🏷️  Type: ${event['event-type'].value}`);
          console.log(`   📦 Data: ${event.data.value}`);
          console.log(`   ⏰ Block Height: ${event.timestamp.value}`);
          console.log(`   ✅ Active: ${event.active.value}`);
        } else {
          console.log(`\n❌ Event ${i}: Not found`);
        }
      } catch (error: any) {
        console.error(`\n❌ Error fetching event ${i}:`, error.message);
      }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Query completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error: any) {
    console.error('\n❌ Query failed:', error.message || error);
    process.exit(1);
  }
}

queryEvents();
