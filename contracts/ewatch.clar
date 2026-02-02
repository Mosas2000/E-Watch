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
