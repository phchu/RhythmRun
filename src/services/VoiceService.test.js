import { describe, it, expect } from 'vitest';
import { speak } from './VoiceService';

describe('VoiceService', () => {
  it('exports speak function safely', () => {
    expect(typeof speak).toBe('function');
  });
});
