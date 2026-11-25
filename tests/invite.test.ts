import { describe, expect, it } from 'vitest';
import { __sha256ForTest } from '../src/game/invite';

describe('Mã mời', () => {
  it('SHA-256 viết tay khớp chuẩn (dùng khi máy không có crypto.subtle)', () => {
    expect(__sha256ForTest('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(__sha256ForTest('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(__sha256ForTest('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });
});
