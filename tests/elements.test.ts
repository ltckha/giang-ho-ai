import { describe, expect, it } from 'vitest';
import {
  ALL_ELEMENTS,
  COUNTERED_MULTIPLIER,
  COUNTER_MULTIPLIER,
  NEUTRAL_MULTIPLIER,
  doesElementGenerate,
  getElementMultiplier,
  getElementRelation,
} from '../src/core/elements';

describe('Ngũ Hành tương khắc & tương sinh', () => {
  it('đúng vòng tương khắc: Kim > Mộc > Thổ > Thủy > Hỏa > Kim', () => {
    expect(getElementRelation('kim', 'moc')).toBe('counter');
    expect(getElementRelation('moc', 'tho')).toBe('counter');
    expect(getElementRelation('tho', 'thuy')).toBe('counter');
    expect(getElementRelation('thuy', 'hoa')).toBe('counter');
    expect(getElementRelation('hoa', 'kim')).toBe('counter');
  });

  it('đối xứng khi bị khắc chế', () => {
    expect(getElementRelation('moc', 'kim')).toBe('countered');
    expect(getElementRelation('tho', 'moc')).toBe('countered');
    expect(getElementRelation('thuy', 'tho')).toBe('countered');
    expect(getElementRelation('hoa', 'thuy')).toBe('countered');
    expect(getElementRelation('kim', 'hoa')).toBe('countered');
  });

  it('trả về neutral với cùng hệ hoặc không khắc nhau', () => {
    for (const el of ALL_ELEMENTS) {
      expect(getElementRelation(el, el)).toBe('neutral');
      expect(getElementMultiplier(el, el)).toBe(NEUTRAL_MULTIPLIER);
    }
    expect(getElementRelation('kim', 'thuy')).toBe('neutral');
    expect(getElementRelation('moc', 'hoa')).toBe('neutral');
  });

  it('hệ số sát thương khớp với quan hệ khắc chế', () => {
    expect(getElementMultiplier('kim', 'moc')).toBe(COUNTER_MULTIPLIER);
    expect(getElementMultiplier('moc', 'kim')).toBe(COUNTERED_MULTIPLIER);
    expect(getElementMultiplier('hoa', 'moc')).toBe(NEUTRAL_MULTIPLIER);
  });

  it('đúng vòng tương sinh: Kim -> Thủy -> Mộc -> Hỏa -> Thổ -> Kim', () => {
    expect(doesElementGenerate('kim', 'thuy')).toBe(true);
    expect(doesElementGenerate('thuy', 'moc')).toBe(true);
    expect(doesElementGenerate('moc', 'hoa')).toBe(true);
    expect(doesElementGenerate('hoa', 'tho')).toBe(true);
    expect(doesElementGenerate('tho', 'kim')).toBe(true);
    expect(doesElementGenerate('kim', 'moc')).toBe(false);
  });
});
