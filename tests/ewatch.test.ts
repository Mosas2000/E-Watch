import { describe, it, expect, beforeEach } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';
import { Cl, cvToJSON } from '@stacks/transactions';

let simnet: any;
let accounts: any;
let wallet1: string;
let wallet2: string;

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
  wallet1 = accounts.get('wallet_1')!;
  wallet2 = accounts.get('wallet_2')!;
});

describe('E-Watch v1 Contract', () => {
  describe('register-event', () => {
    it('should accept valid event type and data parameters and auto-increment event ID', () => {
      const receipt = simnet.callPublicFn(
        'ewatch',
        'register-event',
        [
          Cl.stringAscii('transfer'),
          Cl.stringAscii('{"amount": 1000, "recipient": "SP123"}')
        ],
        wallet1
      );
      expect(receipt.result).toEqual(Cl.ok(Cl.uint(0)));

      const receipt2 = simnet.callPublicFn(
        'ewatch',
        'register-event',
        [
          Cl.stringAscii('transfer'),
          Cl.stringAscii('{"amount": 2000, "recipient": "SP456"}')
        ],
        wallet1
      );
      expect(receipt2.result).toEqual(Cl.ok(Cl.uint(1)));
    });

    it('should reject event type exceeding 50 characters', () => {
      const longType = 'a'.repeat(51);
      // Constructing is fine, but sending to contract should be rejected
      expect(() => {
        simnet.callPublicFn(
          'ewatch',
          'register-event',
          [Cl.stringAscii(longType), Cl.stringAscii('data')],
          wallet1
        );
      }).toThrow();
    });

    it('should reject data exceeding 500 characters', () => {
      const longData = 'x'.repeat(501);
      expect(() => {
        simnet.callPublicFn(
          'ewatch',
          'register-event',
          [Cl.stringAscii('mint'), Cl.stringAscii(longData)],
          wallet1
        );
      }).toThrow();
    });

    it('sets the event owner to the transaction sender and it is active by default', () => {
      simnet.callPublicFn(
        'ewatch',
        'register-event',
        [
          Cl.stringAscii('mint'),
          Cl.stringAscii('data')
        ],
        wallet1
      );

      const result = simnet.callReadOnlyFn(
        'ewatch',
        'get-event',
        [Cl.uint(0)],
        wallet1
      );

      const json = cvToJSON(result.result);
      expect(json.value).toBeDefined();
      expect(json.value.value.owner.value).toBe(wallet1);
      expect(json.value.value['event-type'].value).toBe('mint');
      expect(json.value.value.data.value).toBe('data');
      expect(json.value.value.active.value).toBe(true);
    });

    it('handles edge case of empty strings for inputs', () => {
      const receipt = simnet.callPublicFn(
        'ewatch',
        'register-event',
        [
          Cl.stringAscii(''),
          Cl.stringAscii('')
        ],
        wallet1
      );
      expect(receipt.result).toEqual(Cl.ok(Cl.uint(0)));
    });
  });

  describe('get-event', () => {
    it('should return none for non-existent event IDs', () => {
      const result = simnet.callReadOnlyFn(
        'ewatch',
        'get-event',
        [Cl.uint(999)],
        wallet1
      );
      expect(result.result).toEqual(Cl.none());
    });
  });

  describe('get-event-count', () => {
    it('should return zero when no events are registered', () => {
      const result = simnet.callReadOnlyFn(
        'ewatch',
        'get-event-count',
        [],
        wallet1
      );
      expect(result.result).toEqual(Cl.ok(Cl.uint(0)));
    });

    it('should increment after each registration', () => {
      simnet.callPublicFn('ewatch', 'register-event', [Cl.stringAscii('a'), Cl.stringAscii('b')], wallet1);
      simnet.callPublicFn('ewatch', 'register-event', [Cl.stringAscii('c'), Cl.stringAscii('d')], wallet1);

      const result = simnet.callReadOnlyFn(
        'ewatch',
        'get-event-count',
        [],
        wallet1
      );
      const json = cvToJSON(result.result);
      expect(json.value.value).toBe("2");
    });
  });

  describe('update-event', () => {
    it('should allow the owner to update event data', () => {
      simnet.callPublicFn('ewatch', 'register-event', [Cl.stringAscii('transfer'), Cl.stringAscii('old data')], wallet1);

      const updateResult = simnet.callPublicFn(
        'ewatch',
        'update-event',
        [Cl.uint(0), Cl.stringAscii('new data')],
        wallet1
      );
      expect(updateResult.result).toEqual(Cl.ok(Cl.bool(true)));

      const getResult = simnet.callReadOnlyFn('ewatch', 'get-event', [Cl.uint(0)], wallet1);
      const json = cvToJSON(getResult.result);
      expect(json.value.value.data.value).toBe('new data');
    });

    it('should reject updates from non-owner addresses (u403)', () => {
      simnet.callPublicFn('ewatch', 'register-event', [Cl.stringAscii('transfer'), Cl.stringAscii('old data')], wallet1);

      const updateResult = simnet.callPublicFn(
        'ewatch',
        'update-event',
        [Cl.uint(0), Cl.stringAscii('new data')],
        wallet2
      );
      expect(updateResult.result).toEqual(Cl.error(Cl.uint(403)));
    });

    it('should reject updates to inactive events (u410)', () => {
      simnet.callPublicFn('ewatch', 'register-event', [Cl.stringAscii('transfer'), Cl.stringAscii('old data')], wallet1);
      simnet.callPublicFn('ewatch', 'deactivate-event', [Cl.uint(0)], wallet1);

      const updateResult = simnet.callPublicFn(
        'ewatch',
        'update-event',
        [Cl.uint(0), Cl.stringAscii('new data')],
        wallet1
      );
      expect(updateResult.result).toEqual(Cl.error(Cl.uint(410)));
    });

    it('should reject updates for non-existent event IDs (u404)', () => {
      const updateResult = simnet.callPublicFn(
        'ewatch',
        'update-event',
        [Cl.uint(999), Cl.stringAscii('new data')],
        wallet1
      );
      expect(updateResult.result).toEqual(Cl.error(Cl.uint(404)));
    });
  });

  describe('deactivate-event', () => {
    it('should allow the owner to deactivate their event', () => {
      simnet.callPublicFn('ewatch', 'register-event', [Cl.stringAscii('mint'), Cl.stringAscii('test data')], wallet1);

      const deactivateResult = simnet.callPublicFn(
        'ewatch',
        'deactivate-event',
        [Cl.uint(0)],
        wallet1
      );
      expect(deactivateResult.result).toEqual(Cl.ok(Cl.bool(true)));

      const getResult = simnet.callReadOnlyFn('ewatch', 'get-event', [Cl.uint(0)], wallet1);
      const json = cvToJSON(getResult.result);
      expect(json.value.value.active.value).toBe(false);
    });

    it('should reject deactivation from non-owner addresses (u403)', () => {
      simnet.callPublicFn('ewatch', 'register-event', [Cl.stringAscii('mint'), Cl.stringAscii('test data')], wallet1);

      const deactivateResult = simnet.callPublicFn(
        'ewatch',
        'deactivate-event',
        [Cl.uint(0)],
        wallet2
      );
      expect(deactivateResult.result).toEqual(Cl.error(Cl.uint(403)));
    });

    it('should reject deactivation of non-existent events (u404)', () => {
      const deactivateResult = simnet.callPublicFn(
        'ewatch',
        'deactivate-event',
        [Cl.uint(999)],
        wallet1
      );
      expect(deactivateResult.result).toEqual(Cl.error(Cl.uint(404)));
    });
  });
});
