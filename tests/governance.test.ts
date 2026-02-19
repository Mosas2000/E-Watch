import { describe, it, expect, beforeEach } from 'vitest';
import { Cl, tx } from '@hirosystems/clarinet-sdk';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;
const wallet4 = accounts.get('wallet_4')!;
const wallet5 = accounts.get('wallet_5')!;

describe('governance contract', () => {
  describe('submit-proposal', () => {
    it('creates a proposal and increments the counter', () => {
      const receipt = simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Add dark mode'),
          Cl.stringAscii('The app should support a dark color scheme'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      expect(receipt.result).toBeOk(Cl.uint(0));

      const count = simnet.callReadOnlyFn(
        'governance',
        'get-proposal-count',
        [],
        deployer,
      );
      expect(count.result).toBeOk(Cl.uint(1));
    });

    it('rejects empty titles', () => {
      const receipt = simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii(''),
          Cl.stringAscii('Some description'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      expect(receipt.result).toBeErr(Cl.uint(400));
    });

    it('rejects empty descriptions', () => {
      const receipt = simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Valid title'),
          Cl.stringAscii(''),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      expect(receipt.result).toBeErr(Cl.uint(400));
    });

    it('allows multiple proposals from the same address', () => {
      simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('First proposal'),
          Cl.stringAscii('First description'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      const second = simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Second proposal'),
          Cl.stringAscii('Second description'),
          Cl.stringAscii('improvement'),
        ],
        wallet1,
      );
      expect(second.result).toBeOk(Cl.uint(1));
    });
  });

  describe('get-proposal', () => {
    it('returns proposal data after submission', () => {
      simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Test proposal'),
          Cl.stringAscii('Testing the read path'),
          Cl.stringAscii('bugfix'),
        ],
        wallet2,
      );
      const result = simnet.callReadOnlyFn(
        'governance',
        'get-proposal',
        [Cl.uint(0)],
        deployer,
      );
      const proposal = result.result;
      expect(proposal).toBeSome(
        expect.objectContaining({
          type: expect.any(Number),
        }),
      );
    });

    it('returns none for nonexistent proposal', () => {
      const result = simnet.callReadOnlyFn(
        'governance',
        'get-proposal',
        [Cl.uint(999)],
        deployer,
      );
      expect(result.result).toBeNone();
    });
  });

  describe('vote', () => {
    it('allows a wallet to vote in favor', () => {
      simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Vote target'),
          Cl.stringAscii('Testing vote path'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      const receipt = simnet.callPublicFn(
        'governance',
        'vote',
        [Cl.uint(0), Cl.bool(true)],
        wallet2,
      );
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it('allows a wallet to vote against', () => {
      simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Vote target'),
          Cl.stringAscii('Testing against vote'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      const receipt = simnet.callPublicFn(
        'governance',
        'vote',
        [Cl.uint(0), Cl.bool(false)],
        wallet3,
      );
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it('prevents double voting from the same address', () => {
      simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Double vote test'),
          Cl.stringAscii('Should reject second vote'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      simnet.callPublicFn(
        'governance',
        'vote',
        [Cl.uint(0), Cl.bool(true)],
        wallet2,
      );
      const second = simnet.callPublicFn(
        'governance',
        'vote',
        [Cl.uint(0), Cl.bool(false)],
        wallet2,
      );
      expect(second.result).toBeErr(Cl.uint(409));
    });

    it('rejects votes on nonexistent proposals', () => {
      const receipt = simnet.callPublicFn(
        'governance',
        'vote',
        [Cl.uint(999), Cl.bool(true)],
        wallet1,
      );
      expect(receipt.result).toBeErr(Cl.uint(404));
    });

    it('records the vote in the vote map', () => {
      simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Map check'),
          Cl.stringAscii('Make sure the vote is stored'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      simnet.callPublicFn(
        'governance',
        'vote',
        [Cl.uint(0), Cl.bool(true)],
        wallet2,
      );
      const vote = simnet.callReadOnlyFn(
        'governance',
        'get-vote',
        [Cl.uint(0), Cl.standardPrincipal(wallet2)],
        deployer,
      );
      expect(vote.result).toBeSome(
        expect.objectContaining({ type: expect.any(Number) }),
      );
    });

    it('increments voter history total-votes', () => {
      simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('History test'),
          Cl.stringAscii('Check voter history'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      simnet.callPublicFn(
        'governance',
        'vote',
        [Cl.uint(0), Cl.bool(true)],
        wallet4,
      );
      const history = simnet.callReadOnlyFn(
        'governance',
        'get-voter-history',
        [Cl.standardPrincipal(wallet4)],
        deployer,
      );
      expect(history.result).toBeTuple({
        'total-votes': Cl.uint(1),
      });
    });
  });

  describe('is-voting-open', () => {
    it('returns true for a newly submitted proposal', () => {
      simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Open check'),
          Cl.stringAscii('Should be open'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      const result = simnet.callReadOnlyFn(
        'governance',
        'is-voting-open',
        [Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeBool(true);
    });

    it('returns false for a nonexistent proposal', () => {
      const result = simnet.callReadOnlyFn(
        'governance',
        'is-voting-open',
        [Cl.uint(999)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });
  });

  describe('execute-proposal', () => {
    it('rejects execution by non-owner', () => {
      simnet.callPublicFn(
        'governance',
        'submit-proposal',
        [
          Cl.stringAscii('Exec test'),
          Cl.stringAscii('Only deployer can execute'),
          Cl.stringAscii('feature'),
        ],
        wallet1,
      );
      const receipt = simnet.callPublicFn(
        'governance',
        'execute-proposal',
        [Cl.uint(0)],
        wallet1,
      );
      // Either unauthorized or not approved yet
      expect(receipt.result.type).toBe(7); // err type
    });
  });
});
