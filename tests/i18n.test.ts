import { describe, expect, it } from 'vitest';
import enJson from '../src/i18n/en.json';
import { __setLangForTest, tr } from '../src/game/i18n';

const dict = enJson as Record<string, string>;
const EXTRACT = '../tools/i18n/extract.cjs';

describe('Bản quốc tế (Little Shops of Dalat)', () => {
  it('mọi chữ tiếng Việt trong game đều có bản dịch tiếng Anh', async () => {
    const { collect } = (await import(/* @vite-ignore */ EXTRACT)) as { collect: () => Map<string, string> };
    const missing = [...collect().keys()].filter((k) => !(k in dict));
    expect(missing.slice(0, 20)).toEqual([]);
  });

  it('bản dịch giữ đủ chỗ chen số / tên {0} {1}…', () => {
    const bad = Object.entries(dict).filter(([k, v]) => {
      const a = (k.match(/\{\d+\}/g) ?? []).sort().join();
      const b = (v.match(/\{\d+\}/g) ?? []).sort().join();
      return a !== b;
    });
    expect(bad).toEqual([]);
  });

  it('dịch chữ thường, mẫu có số chen giữa, phần chen giữa cũng được dịch, giữ khoảng trắng', () => {
    __setLangForTest('en', { 'Gọi đợt': 'Call wave', 'Đợt {0}/{1}': 'Wave {0}/{1}', 'Tiệm Giày': 'Shoe Shop', '{0} đã giữ': '{0} saved' });
    expect(tr('Gọi đợt')).toBe('Call wave');
    expect(tr('  Gọi   đợt ')).toBe('  Call wave ');
    expect(tr('Đợt 3/10')).toBe('Wave 3/10');
    expect(tr('Tiệm Giày đã giữ')).toBe('Shoe Shop saved');
    expect(tr('Chữ lạ chưa dịch')).toBe('Chữ lạ chưa dịch');
    expect(tr('TIỆM GIÀY')).toBe('SHOE SHOP');
    expect(tr('English stays')).toBe('English stays');
    __setLangForTest('vi');
    expect(tr('Gọi đợt')).toBe('Gọi đợt');
  });
});
