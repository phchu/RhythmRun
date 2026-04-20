import { describe, it, expect } from 'vitest';
import { db, auth } from './firebase';

describe('Firebase Module', () => {
  it('should initialize firebase and export db and auth', () => {
    expect(db).toBeDefined();
    expect(auth).toBeDefined();
  });
});
