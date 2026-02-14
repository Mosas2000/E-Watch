import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import logger from '../utils/logger';
import { createLogContext } from '../utils/requestId';
import { maskAddress } from '../utils/sanitizer';

const network = STACKS_MAINNET;
const contractAddress = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const contractName = 'ewatch';

async function queryEvents() {
  const context = createLogContext(undefined, {
    operation: 'queryEvents',
    contractAddress: maskAddress(contractAddress),
    contractName,
  });

  logger.info('Starting event query operation', context);
  console.log('🔍 Querying E-Watch contract events...');
  console.log('📄 Contract:', `${contractAddress}.${contractName}\n`);

  try {
    // Get total event count
    logger.debug('Fetching event count', context);
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
    
    logger.info('Event count retrieved', {
      ...context,
      totalEvents,
    });
    console.log(`📊 Total Events Registered: ${totalEvents}\n`);

    if (totalEvents === 0) {
      logger.info('No events found in contract', context);
      console.log('ℹ️  No events found yet.');
      return;
    }

    // Fetch each event
    logger.debug('Fetching individual events', {
      ...context,
      count: totalEvents,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Fetching all events...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (let i = 0; i < totalEvents; i++) {
      try {
        logger.debug(`Fetching event ${i}`, {
          ...context,
          eventId: i,
        });

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
          logger.info(`Event ${i} retrieved`, {
            ...context,
            eventId: i,
            owner: maskAddress(event.owner.value),
            eventType: event['event-type'].value,
            active: event.active.value,
          });
          console.log(`   👤 Owner: ${event.owner.value}`);
          console.log(`   🏷️  Type: ${event['event-type'].value}`);
          console.log(`   📦 Data: ${event.data.value}`);
          console.log(`   ⏰ Block Height: ${event.timestamp.value}`);
          console.log(`   ✅ Active: ${event.active.value}`);
        } else {
          logger.warn(`Event ${i} not found`, {
            ...context,
            eventId: i,
          });
          console.log(`\n❌ Event ${i}: Not found`);
        }
      } catch (error: any) {
        logger.error(`Failed to fetch event ${i}`, {
          ...context,
          eventId: i,
          error: error.message,
        });
        console.error(`\n❌ Error fetching event ${i}:`, error.message);
      }
    }

    logger.info('Query completed successfully', {
      ...context,
      eventsQueried: totalEvents,
    });
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Query completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error: any) {
    logger.error('Query operation failed', {
      ...context,
      error: error.message,
    });
    console.error('\n❌ Query failed:', error.message || error);
    process.exit(1);
  }
}

queryEvents();
