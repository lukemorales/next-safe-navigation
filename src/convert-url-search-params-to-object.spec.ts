import type { ReadonlyURLSearchParams } from 'next/navigation';
import { convertURLSearchParamsToObject } from './convert-url-search-params-to-object';

describe('convertURLSearchParamsToObject', () => {
  it('returns an empty object if no URLSearchParams are passed', () => {
    const result = convertURLSearchParamsToObject(null);

    expect(result).toEqual({});
  });

  it('transforms URLSearchParams into an object', () => {
    {
      // empty URLSearchParams
      const result = convertURLSearchParamsToObject(
        new URLSearchParams('') as ReadonlyURLSearchParams,
      );

      expect(result).toEqual({});
    }

    const result = convertURLSearchParamsToObject(
      new URLSearchParams(
        'query=john+doe&filters=active&filters=is_admin',
      ) as ReadonlyURLSearchParams,
    );

    expect(result).toEqual({
      query: 'john doe',
      filters: ['active', 'is_admin'],
    });
  });
});
