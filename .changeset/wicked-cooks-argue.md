---
'next-safe-navigation': minor
---

### Standard Schema Support

This release introduces support for [Standard Schema](https://github.com/standard-schema/standard-schema), allowing you to use your favorite validation library for defining route params and search query schemas.

Previously, `next-safe-navigation` was tightly coupled with `zod`. Now, you can use any `standard-schema` compatible library, such as `valibot`, `arktype`, and others, while `zod` continues to be supported out-of-the-box.

For existing users, your `zod` schemas will continue to work without any changes.

For new users or those wishing to switch, you can now use other libraries. For example, using `valibot`:

```ts
// src/shared/navigation.ts
import { createNavigationConfig } from 'next-safe-navigation';
import * as v from 'valibot';

export const { routes, useSafeParams, useSafeSearchParams } =
  createNavigationConfig((defineRoute) => ({
    customers: defineRoute('/customers', {
      search: v.object({
        query: v.optional(v.string(), ''),
        page: v.optional(v.pipe(v.string(), v.transform(Number)), 1),
      }),
    }),
    // ...
  }));
```
