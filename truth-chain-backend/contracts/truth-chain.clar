;; TruthChain - Decentralized Content Provenance System
;; Registers and verifies cotent hashes on the Stacks blockchain

;; Contract Owner 
(define-constant CONTRACT-OWNER tx-sender)


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
