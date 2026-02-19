;; governance.clar
;; Community governance contract for E-Watch platform
;; Allows users to submit proposals and vote on platform direction

;; ----- Constants -----

(define-constant CONTRACT-OWNER tx-sender)

(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-UNAUTHORIZED (err u403))
(define-constant ERR-ALREADY-VOTED (err u409))
(define-constant ERR-PROPOSAL-CLOSED (err u410))
(define-constant ERR-INVALID-INPUT (err u400))
(define-constant ERR-VOTING-ENDED (err u411))

;; Proposal statuses
(define-constant STATUS-OPEN u0)
(define-constant STATUS-APPROVED u1)
(define-constant STATUS-REJECTED u2)
(define-constant STATUS-EXECUTED u3)

;; Voting duration in blocks (roughly 7 days at ~10 min per block)
(define-constant VOTING-DURATION u1008)

;; Minimum votes needed for a proposal to be valid
(define-constant QUORUM u5)

;; ----- Data Variables -----

(define-data-var proposal-counter uint u0)

;; ----- Data Maps -----

(define-map proposals
  { proposal-id: uint }
  {
    proposer: principal,
    title: (string-ascii 100),
    description: (string-ascii 500),
    category: (string-ascii 50),
    created-at: uint,
    end-block: uint,
    votes-for: uint,
    votes-against: uint,
    status: uint,
    executed: bool
  }
)

(define-map votes
  { proposal-id: uint, voter: principal }
  { in-favor: bool }
)

(define-map voter-history
  { voter: principal }
  { total-votes: uint }
)

;; ----- Public Functions -----

;; Submit a new proposal for community voting
(define-public (submit-proposal
    (title (string-ascii 100))
    (description (string-ascii 500))
    (category (string-ascii 50)))
  (let
    (
      (proposal-id (var-get proposal-counter))
      (end-block (+ stacks-block-height VOTING-DURATION))
    )
    (asserts! (> (len title) u0) ERR-INVALID-INPUT)
    (asserts! (> (len description) u0) ERR-INVALID-INPUT)
    (map-set proposals
      { proposal-id: proposal-id }
      {
        proposer: tx-sender,
        title: title,
        description: description,
        category: category,
        created-at: stacks-block-height,
        end-block: end-block,
        votes-for: u0,
        votes-against: u0,
        status: STATUS-OPEN,
        executed: false
      }
    )
    (var-set proposal-counter (+ proposal-id u1))
    (ok proposal-id)
  )
)

;; Cast a vote on an open proposal
(define-public (vote (proposal-id uint) (in-favor bool))
  (let
    (
      (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR-NOT-FOUND))
      (existing-vote (map-get? votes { proposal-id: proposal-id, voter: tx-sender }))
      (history (default-to { total-votes: u0 } (map-get? voter-history { voter: tx-sender })))
    )
    ;; Must still be in voting window
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR-VOTING-ENDED)
    ;; Must be open
    (asserts! (is-eq (get status proposal) STATUS-OPEN) ERR-PROPOSAL-CLOSED)
    ;; One address one vote
    (asserts! (is-none existing-vote) ERR-ALREADY-VOTED)

    ;; Record vote
    (map-set votes
      { proposal-id: proposal-id, voter: tx-sender }
      { in-favor: in-favor }
    )

    ;; Update tallies
    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal
        (if in-favor
          { votes-for: (+ (get votes-for proposal) u1) }
          { votes-against: (+ (get votes-against proposal) u1) }
        )
      )
    )

    ;; Track voter participation
    (map-set voter-history
      { voter: tx-sender }
      { total-votes: (+ (get total-votes history) u1) }
    )

    (ok true)
  )
)

;; Finalize a proposal after voting ends
(define-public (finalize-proposal (proposal-id uint))
  (let
    (
      (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR-NOT-FOUND))
      (total-votes (+ (get votes-for proposal) (get votes-against proposal)))
    )
    ;; Voting period must be over
    (asserts! (> stacks-block-height (get end-block proposal)) ERR-PROPOSAL-CLOSED)
    ;; Must still be open
    (asserts! (is-eq (get status proposal) STATUS-OPEN) ERR-PROPOSAL-CLOSED)

    (if (and (>= total-votes QUORUM) (> (get votes-for proposal) (get votes-against proposal)))
      (map-set proposals
        { proposal-id: proposal-id }
        (merge proposal { status: STATUS-APPROVED })
      )
      (map-set proposals
        { proposal-id: proposal-id }
        (merge proposal { status: STATUS-REJECTED })
      )
    )

    (ok true)
  )
)

;; Mark an approved proposal as executed (admin only)
(define-public (execute-proposal (proposal-id uint))
  (let
    (
      (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (asserts! (is-eq (get status proposal) STATUS-APPROVED) ERR-PROPOSAL-CLOSED)

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal { status: STATUS-EXECUTED, executed: true })
    )

    (ok true)
  )
)

;; ----- Read-Only Functions -----

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-proposal-count)
  (ok (var-get proposal-counter))
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-voter-history (voter principal))
  (default-to { total-votes: u0 } (map-get? voter-history { voter: voter }))
)

(define-read-only (is-voting-open (proposal-id uint))
  (match (map-get? proposals { proposal-id: proposal-id })
    proposal (and
      (is-eq (get status proposal) STATUS-OPEN)
      (<= stacks-block-height (get end-block proposal))
    )
    false
  )
)
