import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';

describe('Decentralized Content Provenance System', () => {
  // Get simnet accounts
  const accounts = simnet.getAccounts();
  const deployer = accounts.get('deployer');
  const wallet1 = accounts.get('wallet_1');
  const wallet2 = accounts.get('wallet_2');
  
  // Contract name
  const contractName = 'Truth-Chain';
  
  // Sample content data
  const contentHash1 = '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20';
  const contentHash2 = '2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40';
  const updatedContentHash = '4142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f60';
  const contentType = 'article';
  const signature = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40';
  const title = 'Test Content';
  const storageUrl = 'ipfs://QmTest123456789';
  
  describe('Content Registration', () => {
    it('allows users to register new content', () => {
      // Register content as wallet1
      const result = simnet.callPublicFn(
        contractName, 
        'register-content', 
        [
          Cl.buffer(Buffer.from(contentHash1, 'hex')), 
          Cl.stringAscii(contentType), 
          Cl.buffer(Buffer.from(signature, 'hex')), 
          Cl.stringAscii(title),
          Cl.some(Cl.stringUtf8(storageUrl))
        ], 
        wallet1
      );
      
      // Verify registration was successful
      expect(result.result).toBeOk(Cl.buffer(Buffer.from(contentHash1, 'hex')));
    });
    
    it('prevents registering the same content hash twice', () => {
      // Register content first time
      simnet.callPublicFn(
        contractName, 
        'register-content', 
        [
          Cl.buffer(Buffer.from(contentHash1, 'hex')), 
          Cl.stringAscii(contentType), 
          Cl.buffer(Buffer.from(signature, 'hex')), 
          Cl.stringAscii(title),
          Cl.some(Cl.stringUtf8(storageUrl))
        ], 
        wallet1
      );
      
      // Try to register the same content hash again
      const result = simnet.callPublicFn(
        contractName, 
        'register-content', 
        [
          Cl.buffer(Buffer.from(contentHash1, 'hex')), 
          Cl.stringAscii(contentType), 
          Cl.buffer(Buffer.from(signature, 'hex')), 
          Cl.stringAscii(title),
          Cl.some(Cl.stringUtf8(storageUrl))
        ], 
        wallet2
      );
      
      // Should fail with ERR_ALREADY_REGISTERED (u101)
      expect(result.result).toBeErr(Cl.uint(101));
    });
  });
  
  describe('Content Verification', () => {
    it('verifies registered content', () => {
      // Register content first
      simnet.callPublicFn(
        contractName, 
        'register-content', 
        [
          Cl.buffer(Buffer.from(contentHash1, 'hex')), 
          Cl.stringAscii(contentType), 
          Cl.buffer(Buffer.from(signature, 'hex')), 
          Cl.stringAscii(title),
          Cl.some(Cl.stringUtf8(storageUrl))
        ], 
        wallet1
      );
      
      // Verify the content
      const result = simnet.callReadOnlyFn(
        contractName, 
        'verify-content', 
        [Cl.buffer(Buffer.from(contentHash1, 'hex'))], 
        wallet1
      );
      
      // Inspect the result and check that it's ok (using actual pattern matching)
      expect(result.result.isOk).toBe(true);
      // Check that author is correct in the returned data
      expect(result.result.value.data.author.value).toBe(wallet1.address);
    });
    
    it('returns error for non-existent content', () => {
      // Try to verify non-existent content
      const result = simnet.callReadOnlyFn(
        contractName, 
        'verify-content', 
        [Cl.buffer(Buffer.from(contentHash2, 'hex'))], 
        wallet1
      );
      
      // Should fail with ERR_NOT_FOUND (u102)
      expect(result.result).toBeErr(Cl.uint(102));
    });
  });
  
  describe('Author Content', () => {
    it('retrieves author content with pagination', () => {
      // Register multiple content items for the same author
      simnet.callPublicFn(
        contractName, 
        'register-content', 
        [
          Cl.buffer(Buffer.from(contentHash1, 'hex')), 
          Cl.stringAscii(contentType), 
          Cl.buffer(Buffer.from(signature, 'hex')), 
          Cl.stringAscii(title),
          Cl.some(Cl.stringUtf8(storageUrl))
        ], 
        wallet1
      );
      
      simnet.callPublicFn(
        contractName, 
        'register-content', 
        [
          Cl.buffer(Buffer.from(contentHash2, 'hex')), 
          Cl.stringAscii(contentType), 
          Cl.buffer(Buffer.from(signature, 'hex')), 
          Cl.stringAscii(title + " 2"),
          Cl.some(Cl.stringUtf8(storageUrl))
        ], 
        wallet1
      );
      
      // Get author content with pagination (page 0, size 5)
      // Use proper principal format
      const result = simnet.callReadOnlyFn(
        contractName, 
        'get-author-content-paged', 
        [
          Cl.principal(wallet1.address), 
          Cl.uint(0),
          Cl.uint(5)
        ], 
        wallet1
      );
      
      // Check successful result
      expect(result.result.isOk).toBe(true);
      
      // Check that we have two items in the content list
      const contentList = result.result.value.list;
      expect(contentList.length).toBe(2);
      
      // Check content hashes
      const hash1 = Buffer.from(contentList[0].buffer).toString('hex');
      const hash2 = Buffer.from(contentList[1].buffer).toString('hex');
      
      // Both hashes should be present (order might vary)
      expect([hash1, hash2].sort()).toEqual([contentHash1, contentHash2].sort());
    });
    
    it('returns empty list for non-existent author or empty page', () => {
      // Get content for user with no content
      const result = simnet.callReadOnlyFn(
        contractName, 
        'get-author-content-paged', 
        [
          Cl.principal(wallet2.address),
          Cl.uint(0),
          Cl.uint(5)
        ], 
        wallet2
      );
      
      // Check successful result with empty list
      expect(result.result.isOk).toBe(true);
      expect(result.result.value.list.length).toBe(0);
    });
  });
  
  describe('Content Management', () => {
    it('allows authors to revoke their content', () => {
      // Register content first
      simnet.callPublicFn(
        contractName, 
        'register-content', 
        [
          Cl.buffer(Buffer.from(contentHash1, 'hex')), 
          Cl.stringAscii(contentType), 
          Cl.buffer(Buffer.from(signature, 'hex')), 
          Cl.stringAscii(title),
          Cl.some(Cl.stringUtf8(storageUrl))
        ], 
        wallet1
      );
      
      // Revoke the content
      const result = simnet.callPublicFn(
        contractName, 
        'revoke-content', 
        [Cl.buffer(Buffer.from(contentHash1, 'hex'))], 
        wallet1
      );
      
      // Should be successful
      expect(result.result).toBeOk(Cl.bool(true));
      
      // Check if content is now inactive
      const active = simnet.callReadOnlyFn(
        contractName, 
        'is-content-active', 
        [Cl.buffer(Buffer.from(contentHash1, 'hex'))], 
        wallet1
      );
      
      expect(active.result).toBeOk(Cl.bool(false));
    });
    
    it('prevents non-authors from revoking content', () => {
      // Register content as wallet1
      simnet.callPublicFn(
        contractName, 
        'register-content', 
        [
          Cl.buffer(Buffer.from(contentHash1, 'hex')), 
          Cl.stringAscii(contentType), 
          Cl.buffer(Buffer.from(signature, 'hex')), 
          Cl.stringAscii(title),
          Cl.some(Cl.stringUtf8(storageUrl))
        ], 
        wallet1
      );
      
      // Try to revoke as wallet2
      const result = simnet.callPublicFn(
        contractName, 
        'revoke-content', 
        [Cl.buffer(Buffer.from(contentHash1, 'hex'))], 
        wallet2
      );
      
      // Should fail with ERR_UNAUTHORIZED (u100)
      expect(result.result).toBeErr(Cl.uint(100));
    });
    
    it('allows authors to update their content', () => {
      // Register original content
      simnet.callPublicFn(
        contractName, 
        'register-content', 
        [
          Cl.buffer(Buffer.from(contentHash1, 'hex')), 
          Cl.stringAscii(contentType), 
          Cl.buffer(Buffer.from(signature, 'hex')), 
          Cl.stringAscii(title),
          Cl.some(Cl.stringUtf8(storageUrl))
        ], 
        wallet1
      );
      
      // Update the content
      const result = simnet.callPublicFn(
        contractName, 
        'update-content', 
        [
          Cl.buffer(Buffer.from(contentHash1, 'hex')),
          Cl.buffer(Buffer.from(updatedContentHash, 'hex')),
          Cl.buffer(Buffer.from(signature, 'hex'))
        ], 
        wallet1
      );
      
      // Should be successful
      expect(result.result).toBeOk(Cl.buffer(Buffer.from(updatedContentHash, 'hex')));
      
      // Verify updated content exists and has version 2
      const details = simnet.callReadOnlyFn(
        contractName, 
        'get-content-details', 
        [Cl.buffer(Buffer.from(updatedContentHash, 'hex'))], 
        wallet1
      );
      
      // Check that we get a successful response
      expect(details.result.isOk).toBe(true);
      
      // Check the version is 2
      const version = details.result.value.data.version.value;
      expect(version).toBe(2n);
    });
  });
  
  describe('Trusted Verifiers', () => {
    it('allows contract owner to add trusted verifiers', () => {
      // Add wallet2 as trusted verifier (as contract owner)
      const result = simnet.callPublicFn(
        contractName, 
        'add-trusted-verifier', 
        [Cl.principal(wallet2.address)], 
        deployer  // Assuming deployer is CONTRACT_OWNER
      );
      
      // Should be successful
      expect(result.result).toBeOk(Cl.bool(true));
      
      // Check if wallet2 is now a trusted verifier
      const isTrusted = simnet.callReadOnlyFn(
        contractName, 
        'is-trusted-verifier', 
        [Cl.principal(wallet2.address)], 
        deployer
      );
      
      // Check result is true
      expect(isTrusted.result.value).toBe(true);
    });
    
    it('prevents non-owners from adding trusted verifiers', () => {
      // Try to add wallet2 as trusted verifier (as non-owner)
      const result = simnet.callPublicFn(
        contractName, 
        'add-trusted-verifier', 
        [Cl.principal(wallet2.address)], 
        wallet1  // Not the contract owner
      );
      
      // Should fail with ERR_UNAUTHORIZED (u100)
      expect(result.result).toBeErr(Cl.uint(100));
    });
  });
});