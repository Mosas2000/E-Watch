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

(define-data-var event-counter uint u0)

(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-UNAUTHORIZED (err u403))
(define-constant ERR-INACTIVE (err u410))

(define-public (register-event (event-type (string-ascii 50)) (data (string-ascii 500)))
  (let
    (
      (event-id (var-get event-counter))
    )
    (map-set events
      { event-id: event-id }
      {
        owner: tx-sender,
        event-type: event-type,
        timestamp: stacks-block-height,
        data: data,
        active: true
      }
    )
    (var-set event-counter (+ event-id u1))
    (ok event-id)
  )
)

(define-read-only (get-event (event-id uint))
  (map-get? events { event-id: event-id })
)

(define-read-only (get-event-count)
  (ok (var-get event-counter))
)

(define-public (update-event (event-id uint) (new-data (string-ascii 500)))
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

(define-public (deactivate-event (event-id uint))
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
