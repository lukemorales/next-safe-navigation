import { convertObjectToURLSearchParams } from './convert-object-to-url-search-params';

describe('convertObjectToURLSearchParams', () => {
  it('transforms an object into URLSearchParams', () => {
    {
      // empty object
      const result = convertObjectToURLSearchParams({});

      expect(result.toString()).toBe('');
    }

    const result = convertObjectToURLSearchParams({
      query: 'john doe',
      filters: ['active', 'is_admin'],
    });

    expect(result.toString()).toBe(
      'query=john+doe&filters=active&filters=is_admin',
    );
  });
});
