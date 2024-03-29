import { type ReadonlyURLSearchParams } from 'next/navigation';

export function convertURLSearchParamsToObject(
  params: ReadonlyURLSearchParams | null,
): Record<string, string | string[]> {
  if (!params) {
    return {};
  }

  return [...params.entries()].reduce<Record<string, string | string[]>>(
    (acc, [key, value]) => {
      const values = params.getAll(key);

      acc[key] = values.length > 1 ? values : value;

      return acc;
    },
    {},
  );
}
