/* eslint-disable no-undef */
import GeoImage from '.';

const g = new GeoImage();

describe('Geo', () => {
  test('defines setRule()', () => {
    expect(typeof g.getOrigin).toBe('function');
  });
});
