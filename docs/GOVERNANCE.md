# Governance Guide

This document describes the community governance system built into E-Watch.

## Overview

The governance module lets any wallet holder propose changes and vote on them.  
Proposals live on-chain in the `governance.clar` contract and voting follows a  
one-address-one-vote model.

## How It Works

1. **Submit a proposal** -- Provide a title (up to 100 characters), a  
   description (up to 500 characters), and a category.
2. **Voting period** -- Voting stays open for approximately seven days (1,008  
   blocks at ~10 minutes per block).
3. **Cast your vote** -- Each connected wallet can vote once per proposal,  
   either in favor or against.
4. **Quorum** -- A minimum of five votes must be cast for the result to count.
5. **Finalization** -- After the voting period ends, anyone can call  
   `finalize-proposal` to lock in the outcome (approved or rejected).
6. **Execution** -- The contract owner can mark approved proposals as executed  
   once the corresponding work is done.

## Proposal Categories

| Category       | When to use                              |
| -------------- | ---------------------------------------- |
| Feature        | Requesting a new capability              |
| Improvement    | Enhancing something that already exists  |
| Bug Fix        | Flagging a defect for prioritization     |
| Security       | Reporting or requesting a security patch |
| Documentation  | Proposing doc changes or additions       |
| Other          | Anything that doesn't fit above          |

## Voting Rules

- One address gets one vote per proposal.
- You cannot change your vote after submitting it.
- The proposer can also vote on their own proposal.
- Votes are recorded permanently on-chain for transparency.

## Contract Functions

### Public

| Function              | Description                                      |
| --------------------- | ------------------------------------------------ |
| `submit-proposal`     | Create a new proposal for community review       |
| `vote`                | Cast a for or against vote on an open proposal   |
| `finalize-proposal`   | Close voting and set the outcome                 |
| `execute-proposal`    | Mark an approved proposal as executed (admin)    |

### Read-Only

| Function              | Description                                      |
| --------------------- | ------------------------------------------------ |
| `get-proposal`        | Fetch proposal details by ID                     |
| `get-proposal-count`  | Total proposals submitted                        |
| `get-vote`            | Check how a specific address voted               |
| `get-voter-history`   | Look up total votes cast by an address           |
| `is-voting-open`      | Whether a proposal is still accepting votes      |

## Error Codes

| Code | Meaning                                      |
| ---- | -------------------------------------------- |
| 400  | Invalid input (empty title or description)   |
| 403  | Unauthorized (admin-only action)             |
| 404  | Proposal not found                           |
| 409  | Already voted on this proposal               |
| 410  | Proposal is no longer open                   |
| 411  | Voting period has ended                      |

## Frontend

The governance UI is accessible from the main page under the  
"Community Governance" heading. Features include:

- A proposal list with status filters and sort order toggle
- A submit form with category picker and character counters
- Real-time vote tallies with a visual progress bar
- Voter participation stats for the connected wallet

## Future Improvements

- Quadratic voting mode as an alternative to one-address-one-vote
- Token-weighted voting once a governance token is introduced
- Threaded discussion per proposal
- Off-chain proposal drafts with IPFS archiving
