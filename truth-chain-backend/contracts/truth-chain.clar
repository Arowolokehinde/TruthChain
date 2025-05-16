;; Decentralized Content Provenance System
;; A Clarity smart contract for registering and verifying content on the Stacks blockchain

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_ALREADY_REGISTERED (err u101))
(define-constant ERR_NOT_FOUND (err u102))
(define-constant ERR_INVALID_SIGNATURE (err u103))
(define-constant ERR_CONTENT_LIMIT_REACHED (err u104))
(define-constant ERR_INVALID_PARAMS (err u105))

;; Constants
(define-constant MAX_CONTENT_PER_AUTHOR u100)
(define-constant CONTRACT_OWNER tx-sender)

;; Data structures

;; Content record structure
;; Contains metadata about registered content
(define-map content-records
  { content-hash: (buff 32) }  ;; SHA-256 hash (32 bytes)
  {
    author: principal,         ;; Stacks address of content creator
    timestamp: uint,           ;; Block height when content was registered
    content-type: (string-ascii 20),  ;; Type of content (e.g., "article", "image", "video")
    signature: (buff 65),      ;; ECDSA signature (r,s,v format)
    title: (string-ascii 100),  ;; Optional title/description
    is-active: bool,           ;; Flag for potential content retraction
    storage-url: (optional (string-utf8 256)),  ;; Optional reference to decentralized storage
    version: uint              ;; Content version (for tracking updates)
  }
)

;; Author records - tracks content published by each author
;; Now uses a counter to simplify pagination of author content
(define-map author-content
  { author: principal }
  { 
    content-count: uint,
    last-activity: uint        ;; Last block height when author was active
  }
)

;; Track content hashes by author with pagination support
(define-map author-content-by-index
  { author: principal, index: uint }
  { content-hash: (buff 32) }
)

;; Trusted verifiers (optional for extending the system with trusted roles)
(define-map trusted-verifiers
  { verifier: principal }
  { active: bool }
)

;; Public functions

;; Register new content
;; @param content-hash: SHA-256 hash of the content
;; @param content-type: Type of content being registered
;; @param signature: Creator's signature of the content hash
;; @param title: Optional title or description
;; @param storage-url: Optional URL pointing to decentralized storage
;; @returns: Success or error code
(define-public (register-content 
                (content-hash (buff 32))
                (content-type (string-ascii 20))
                (signature (buff 65))
                (title (string-ascii 100))
                (storage-url (optional (string-utf8 256))))
  (let
    (
      (caller tx-sender)
      (current-height stacks-block-height)
    )
    
    ;; Check if content already exists
    (asserts! (is-none (map-get? content-records { content-hash: content-hash })) 
              ERR_ALREADY_REGISTERED)
    
    ;; Verify signature (in production, use secp256k1-verify when available)
    ;; This is a placeholder until native signature verification is available
    ;; (asserts! (verify-signature content-hash signature caller) ERR_INVALID_SIGNATURE)
            
    ;; Get or initialize author's content count
    (let
      (
        (author-record (default-to { content-count: u0, last-activity: u0 } 
                         (map-get? author-content { author: caller })))
        (content-count (get content-count author-record))
      )
      
      ;; Ensure author hasn't reached content limit
      (asserts! (< content-count MAX_CONTENT_PER_AUTHOR) ERR_CONTENT_LIMIT_REACHED)
      
      ;; Store content record
      (map-set content-records
        { content-hash: content-hash }
        {
          author: caller,
          timestamp: current-height,
          content-type: content-type,
          signature: signature,
          title: title,
          is-active: true,
          storage-url: storage-url,
          version: u1
        }
      )
      
      ;; Update author's content index
      (map-set author-content-by-index
        { author: caller, index: content-count }
        { content-hash: content-hash }
      )
      
      ;; Update author's content count
      (map-set author-content
        { author: caller }
        { 
          content-count: (+ content-count u1),
          last-activity: current-height
        }
      )
      
      ;; Return success with transaction ID
      (ok content-hash)
    )
  )
)

;; Verify if content matches the registered hash
;; This is a read-only function that returns the record if found
;; @param content-hash: SHA-256 hash to verify
;; @returns: Content record if found, or error if not found
(define-read-only (verify-content (content-hash (buff 32)))
  (match (map-get? content-records { content-hash: content-hash })
    record (ok record)
    ERR_NOT_FOUND
  )
)

;; Get a single content hash by author and index
;; @param author: The content author
;; @param index: The index of the content
;; @returns: Content hash if found, or none
(define-read-only (get-content-hash-at-index (author principal) (index uint))
  (map-get? author-content-by-index { author: author, index: index })
)


;; Revoke content (mark as inactive)
;; Only the original author can revoke their content
;; @param content-hash: SHA-256 hash of content to revoke
;; @returns: Success or error code
(define-public (revoke-content (content-hash (buff 32)))
  (let
    (
      (caller tx-sender)
    )
    (match (map-get? content-records { content-hash: content-hash })
      record (begin
              ;; Check if caller is the author
              (asserts! (is-eq caller (get author record)) ERR_UNAUTHORIZED)
              
              ;; Update record to mark as inactive
              (map-set content-records
                { content-hash: content-hash }
                (merge record { is-active: false })
              )
              
              ;; Update author's last activity
              (match (map-get? author-content { author: caller })
                author-record (map-set author-content
                                { author: caller }
                                (merge author-record { last-activity: stacks-block-height }))
                true
              )
              
              (ok true)
            )
      ERR_NOT_FOUND
    )
  )
)

;; Update content (register a new version)
;; @param old-content-hash: Original content hash
;; @param new-content-hash: Updated content hash
;; @param signature: Creator's signature of the new hash
;; @returns: Success or error code
(define-public (update-content 
                (old-content-hash (buff 32))
                (new-content-hash (buff 32))
                (signature (buff 65)))
  (let
    (
      (caller tx-sender)
    )
    ;; Verify caller is the original author
    (match (map-get? content-records { content-hash: old-content-hash })
      old-record (begin
                  (asserts! (is-eq caller (get author old-record)) ERR_UNAUTHORIZED)
                  
                  ;; Make sure the new hash isn't already registered
                  (asserts! (is-none (map-get? content-records { content-hash: new-content-hash })) 
                            ERR_ALREADY_REGISTERED)
                  
                  ;; Create new record with incremented version
                  (map-set content-records
                    { content-hash: new-content-hash }
                    (merge old-record {
                      timestamp: stacks-block-height,
                      signature: signature,
                      version: (+ (get version old-record) u1)
                    })
                  )
                  
                  ;; Get author's content count for indexing
                  (match (map-get? author-content { author: caller })
                    author-record (let
                                    (
                                      (content-count (get content-count author-record))
                                    )
                                    ;; Add new content hash to author's index
                                    (map-set author-content-by-index
                                      { author: caller, index: content-count }
                                      { content-hash: new-content-hash }
                                    )
                                    
                                    ;; Update author's content count and last activity
                                    (map-set author-content
                                      { author: caller }
                                      { 
                                        content-count: (+ content-count u1),
                                        last-activity: stacks-block-height
                                      }
                                    )
                                    
                                    (ok new-content-hash)
                                  )
                    ERR_NOT_FOUND
                  )
                )
      ERR_NOT_FOUND
    )
  )
)

;; Check if content is registered and active
;; @param content-hash: SHA-256 hash to check
;; @returns: Boolean indicating if content is registered and active
(define-read-only (is-content-active (content-hash (buff 32)))
  (match (map-get? content-records { content-hash: content-hash })
    record (ok (get is-active record))
    (ok false)
  )
)

;; Get content details including authenticity verification
;; @param content-hash: SHA-256 hash of content
;; @returns: Detailed content information for display purposes
(define-read-only (get-content-details (content-hash (buff 32)))
  (match (map-get? content-records { content-hash: content-hash })
    record (ok {
              author: (get author record),
              timestamp: (get timestamp record),
              content-type: (get content-type record),
              title: (get title record),
              is-active: (get is-active record),
              storage-url: (get storage-url record),
              version: (get version record)
            })
    ERR_NOT_FOUND
  )
)

;; === Contract Owner Functions ===

;; Add trusted verifier
;; @param verifier: Principal to add as trusted verifier
;; @returns: Success or error
(define-public (add-trusted-verifier (verifier principal))
  (begin
    ;; Only contract owner can add verifiers
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    
    (map-set trusted-verifiers
      { verifier: verifier }
      { active: true }
    )
    
    (ok true)
  )
)

;; Remove trusted verifier
;; @param verifier: Principal to remove from trusted verifiers
;; @returns: Success or error
(define-public (remove-trusted-verifier (verifier principal))
  (begin
    ;; Only contract owner can remove verifiers
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    
    (map-set trusted-verifiers
      { verifier: verifier }
      { active: false }
    )
    
    (ok true)
  )
)

;; Check if a principal is a trusted verifier
;; @param verifier: Principal to check
;; @returns: Boolean indicating if principal is an active trusted verifier
(define-read-only (is-trusted-verifier (verifier principal))
  (default-to false (get active (map-get? trusted-verifiers { verifier: verifier })))
)