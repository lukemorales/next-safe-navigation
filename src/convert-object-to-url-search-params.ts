export function convertObjectToURLSearchParams(
  object: Record<string, string | string[]>,
): URLSearchParams {
  const urlSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(object)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        urlSearchParams.append(key, `${entry}`);
      }

      continue;
    }

    urlSearchParams.append(key, `${value}`);
  }

  return urlSearchParams;
}
