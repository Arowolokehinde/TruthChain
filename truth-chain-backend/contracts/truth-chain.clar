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
(define-constant ERR-INVALID-CONTENT-TYPE (err 102))
(define-constant ERR-UNAUTHORIZED (err 103))
(define-constant ERR-HASH-NOT-FOUND (err 104))


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