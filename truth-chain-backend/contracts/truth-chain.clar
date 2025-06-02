;; TruthChain - Decentralized Content Provenance System
;; Registers and verifies cotent hashes on the Stacks blockchain

;; Contract Owner 
(define-constant CONTRACT-OWNER tx-sender)

;;;;;;;;;;;;; CONSTANTS ;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Constant Error codes
(define-constant ERR-HASH-EXISTS (err u100))
(define-constant ERR-INVALID-HASH (err u101))
(define-constant ERR-INVALID-CONTENT-TYPE (err u102))
(define-constant ERR-UNAUTHORIZED (err u103))
(define-constant ERR-HASH-NOT-FOUND (err u104))


;; Content types
(define-constant CONTENT-TYPE-BLOG-POST "blog_post")
(define-constant CONTENT-TYPE-PAGE "page")
(define-constant CONTENT-TYPE-MEDIA "media")
(define-constant CONTENT-TYPE-DOCUMENT "document")

;;;;;;;;;;;; DATA MAPS ;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Main content registry - maps hash to content metadata
(define-map content-registry
  { hash: (buff 32) }
  { author: principal,
    block-height: uint,
    time-stamp: uint,
    content-type: (string-ascii 32),
    registration-id: uint
  }
)

;; Author's content index - allows querying by author
(define-map author-content
  { author: principal, registration-id: uint }
  { hash: (buff 32) }
)


;;;;;;;;;;;; DATA VARS ;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Global counters
(define-data-var total-registrations uint u0)
(define-data-var contract-active bool true)


;;;;;;;;;; PRIVATE FUNCTIONS ;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-private (is-valid-content-type (content-type (string-ascii 32)))
  (or 
    (is-eq content-type CONTENT-TYPE-BLOG-POST)
    (is-eq content-type CONTENT-TYPE-PAGE)
    (is-eq content-type CONTENT-TYPE-MEDIA)
    (is-eq content-type CONTENT-TYPE-DOCUMENT)
  )
)

;; Helper Function to validate hash (must be 32 bytes)
(define-private (is-valid-hash (hash (buff 32)))
  (is-eq (len hash) u32)
)

;;;;;;;;;;; PUBLIC FUNCTIONS ;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Main registration function
(define-public (register-content (hash (buff 32)) (content-type (string-ascii 32)))
  (let
    (
      (current-registrations (var-get total-registrations))
      (new-registration-id (+ current-registrations u1))
      (current-block stacks-block-height)
      (current-time (unwrap-panic (get-stacks-block-info? time current-block)))
    )
    ;; Validation checks
    (asserts! (var-get contract-active) ERR-UNAUTHORIZED)
    (asserts! (is-valid-hash hash) ERR-INVALID-HASH)
    (asserts! (is-valid-content-type content-type) ERR-INVALID-CONTENT-TYPE)
    (asserts! (is-none (map-get? content-registry { hash: hash })) ERR-HASH-EXISTS)
    
    ;; Register the content
    (map-set content-registry
      { hash: hash }
      {
        author: tx-sender,
        block-height: current-block,
        time-stamp: current-time,
        content-type: content-type,
        registration-id: new-registration-id
      }
    )
    
    ;; Add to author's index
    (map-set author-content
      { author: tx-sender, registration-id: new-registration-id }
      { hash: hash }
    )
    
    ;; Update counter
    (var-set total-registrations new-registration-id)
    
    ;; Return success with registration details
    (ok {
      registration-id: new-registration-id,
      hash: hash,
      author: tx-sender,
      block-height: current-block,
      timestamp: current-time
    })
  )
)

;; Verify content by hash (read-only)
(define-read-only (verify-content (hash (buff 32)))
  (match (map-get? content-registry { hash: hash })
    registration-data (ok registration-data)
    ERR-HASH-NOT-FOUND
  )
)

;; Check if hash exists (simple boolean check)
(define-read-only (hash-exists (hash (buff 32)))
  (is-some (map-get? content-registry { hash: hash }))
)

;; Get content by author and registration ID
(define-read-only (get-author-content (author principal) (registration-id uint))
  (match (map-get? author-content { author: author, registration-id: registration-id })
    hash-data 
      (match (map-get? content-registry { hash: (get hash hash-data) })
        content-data (ok content-data)
        ERR-HASH-NOT-FOUND
      )
    ERR-HASH-NOT-FOUND
  )
)

;; Get total number of registrations
(define-read-only (get-total-registrations)
  (ok (var-get total-registrations))
)

;; Get contract stats
(define-read-only (get-contract-stats)
  (ok {
    total-registrations: (var-get total-registrations),
    contract-active: (var-get contract-active),
    contract-owner: CONTRACT-OWNER
  })
)

;; Batch verify multiple hashes (up to 10 at once)
(define-read-only (batch-verify (hashes (list 10 (buff 32))))
  (ok (map verify-content-simple hashes))
)

;; Helper for batch verify
(define-private (verify-content-simple (hash (buff 32)))
  {
    hash: hash,
    exists: (hash-exists hash)
  }
)

;; Admin functions (only contract owner)
;; Toggle contract active status
(define-public (toggle-contract-status)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (var-set contract-active (not (var-get contract-active)))
    (ok (var-get contract-active))
  )
)

;; Emergency function to verify specific registration by ID
(define-read-only (get-registration-by-id (registration-id uint))
  (if (and (> registration-id u0) (<= registration-id (var-get total-registrations)))
    (ok registration-id)
    ERR-HASH-NOT-FOUND
  )
)

;; Get content type constants (for frontend reference)
(define-read-only (get-content-types)
  (ok {
    blog-post: CONTENT-TYPE-BLOG-POST,
    page: CONTENT-TYPE-PAGE,
    media: CONTENT-TYPE-MEDIA,
    document: CONTENT-TYPE-DOCUMENT
  })
)