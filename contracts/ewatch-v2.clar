;; E-Watch v2 Contract
;;
;; Migration-ready upgrade of the original ewatch contract.
;; Adds version tracking, migration support functions, and
;; admin controls while maintaining backward compatibility
;; with the existing event data structure.
;;
;; Changes from v1:
;;   - Admin role with transferable ownership
;;   - Contract pause/unpause for maintenance windows
;;   - migrate-event for importing v1 data
;;   - set-event-counter for counter alignment
;;   - get-version for on-chain version identification
;;   - ERR-PAUSED (u503) for pause-gated operations

;; -- Data Storage --------------------------------------------------

(define-map events
  { event-id: uint }
  {
    owner: principal,
    event-type: (string-ascii 50),
    timestamp: uint,
    data: (string-ascii 500),
    active: bool
  }
)

(define-map events-by-owner
  { owner: principal }
  { events: (list 100 uint) }
)

(define-data-var event-counter uint u0)
(define-data-var contract-version uint u2)
(define-data-var contract-paused bool false)
(define-data-var admin principal tx-sender)

;; -- Error Constants -----------------------------------------------

(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-UNAUTHORIZED (err u403))
(define-constant ERR-INACTIVE (err u410))
(define-constant ERR-PAUSED (err u503))
(define-constant ERR-INVALID-INPUT (err u400))

;; -- Admin Functions -----------------------------------------------

(define-read-only (get-version)
  (ok (var-get contract-version))
)

(define-read-only (is-paused)
  (ok (var-get contract-paused))
)

(define-read-only (get-admin)
  (ok (var-get admin))
)

(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-UNAUTHORIZED)
    (var-set admin new-admin)
    (ok true)
  )
)

(define-public (pause-contract)
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-UNAUTHORIZED)
    (var-set contract-paused true)
    (ok true)
  )
)

(define-public (unpause-contract)
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-UNAUTHORIZED)
    (var-set contract-paused false)
    (ok true)
  )
)

;; -- Migration Support ---------------------------------------------

;; Import a single event from the v1 contract during migration.
;; Only callable by the admin to prevent unauthorized data injection.
(define-public (migrate-event
    (event-id uint)
    (owner principal)
    (event-type (string-ascii 50))
    (timestamp uint)
    (data (string-ascii 500))
    (active bool)
  )
  (let
    (
      (current-events (default-to (list) (get events (map-get? events-by-owner { owner: owner }))))
    )
    (asserts! (is-eq tx-sender (var-get admin)) ERR-UNAUTHORIZED)
    (asserts! (> (len event-type) u0) ERR-INVALID-INPUT)
    (asserts! (> (len data) u0) ERR-INVALID-INPUT)
    (map-set events
      { event-id: event-id }
      {
        owner: owner,
        event-type: event-type,
        timestamp: timestamp,
        data: data,
        active: active
      }
    )
    ;; Update owner mapping if there's room
    (if (< (len current-events) u100)
      (map-set events-by-owner
        { owner: owner }
        { events: (unwrap-panic (as-max-len? (append current-events event-id) u100)) }
      )
      true
    )
    ;; Update counter if this event-id is beyond current counter
    (if (>= event-id (var-get event-counter))
      (var-set event-counter (+ event-id u1))
      true
    )
    (ok event-id)
  )
)

;; Set the event counter to a specific value during migration.
;; Ensures new registrations continue from the correct ID.
(define-public (set-event-counter (new-counter uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-UNAUTHORIZED)
    (var-set event-counter new-counter)
    (ok true)
  )
)

;; -- Core Functions (backward compatible) ---------------------------

(define-public (register-event (event-type (string-ascii 50)) (data (string-ascii 500)))
  (begin
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (> (len event-type) u0) ERR-INVALID-INPUT)
    (asserts! (> (len data) u0) ERR-INVALID-INPUT)
    (let
      (
        (event-id (var-get event-counter))
        (current-events (default-to (list) (get events (map-get? events-by-owner { owner: tx-sender }))))
      )
      (map-set events
        { event-id: event-id }
        {
          owner: tx-sender,
          event-type: event-type,
          timestamp: block-height,
          data: data,
          active: true
        }
      )
      (if (< (len current-events) u100)
        (map-set events-by-owner
          { owner: tx-sender }
          { events: (unwrap-panic (as-max-len? (append current-events event-id) u100)) }
        )
        true
      )
      (var-set event-counter (+ event-id u1))
      (ok event-id)
    )
  )
)

(define-read-only (get-events-by-owner (owner principal))
  (default-to (list) (get events (map-get? events-by-owner { owner: owner })))
)

(define-read-only (get-event (event-id uint))
  (map-get? events { event-id: event-id })
)

(define-read-only (get-event-count)
  (ok (var-get event-counter))
)

(define-public (update-event (event-id uint) (new-data (string-ascii 500)))
  (begin
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (let
      (
        (event (unwrap! (get-event event-id) ERR-NOT-FOUND))
      )
      (asserts! (is-eq tx-sender (get owner event)) ERR-UNAUTHORIZED)
      (asserts! (get active event) ERR-INACTIVE)
      (map-set events
        { event-id: event-id }
        (merge event { data: new-data })
      )
      (ok true)
    )
  )
)

(define-public (deactivate-event (event-id uint))
  (begin
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (let
      (
        (event (unwrap! (get-event event-id) ERR-NOT-FOUND))
      )
      (asserts! (is-eq tx-sender (get owner event)) ERR-UNAUTHORIZED)
      (map-set events
        { event-id: event-id }
        (merge event { active: false })
      )
      (ok true)
    )
  )
)
