(define-map events
  { event-id: uint }
  {
    owner: principal,
    event-type: (string-ascii 50),
    timestamp: uint,
    data: (string-ascii 500)
  }
)

(define-data-var event-counter uint u0)

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
        timestamp: block-height,
        data: data
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

(define-read-only (get-events-by-owner (owner principal))
  (ok true)
)
