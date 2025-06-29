# next-safe-navigation

## 0.4.0

### Minor Changes

- [#29](https://github.com/lukemorales/next-safe-navigation/pull/29) [`cb2c4be`](https://github.com/lukemorales/next-safe-navigation/commit/cb2c4bee2ca3ea8f87f8dc6cf2158bc300fda580) Thanks [@mikerudge](https://github.com/mikerudge)! - ### Standard Schema Support

  This release introduces support for [Standard Schema](https://github.com/standard-schema/standard-schema), allowing you to use your favorite validation library for defining route params and search query schemas.

  Previously, `next-safe-navigation` was tightly coupled with `zod`. Now, you can use any `standard-schema` compatible library, such as `valibot`, `arktype`, and others, while `zod` continues to be supported out-of-the-box.

  For existing users, your `zod` schemas will continue to work without any changes.

  For new users or those wishing to switch, you can now use other libraries. For example, using `valibot`:

  ```ts
  // src/shared/navigation.ts
  import { createNavigationConfig } from "next-safe-navigation";
  import * as v from "valibot";

  export const { routes, useSafeParams, useSafeSearchParams } =
    createNavigationConfig((defineRoute) => ({
      customers: defineRoute("/customers", {
        search: v.object({
          query: v.optional(v.string(), ""),
          page: v.optional(v.pipe(v.string(), v.transform(Number)), 1),
        }),
      }),
      // ...
    }));
  ```

## 0.3.3

### Patch Changes

- [#25](https://github.com/lukemorales/next-safe-navigation/pull/25) [`711f5f6`](https://github.com/lukemorales/next-safe-navigation/commit/711f5f6b85d1fcb4147901523226cc8cac1e6a5f) Thanks [@Katona](https://github.com/Katona)! - Fix `catch-all` params can't be mixed with other params

## 0.3.2

### Patch Changes

- [`a953425`](https://github.com/lukemorales/next-safe-navigation/commit/a9534250a8d3b820f91249ce7384954dcd95943c) Thanks [@lukemorales](https://github.com/lukemorales)! - Use iterator to check `URLSearchParams` size in older browsers by @wontondon

## 0.3.1

### Patch Changes

- [`4f0e3a5`](https://github.com/lukemorales/next-safe-navigation/commit/4f0e3a50bd6f56447d80e59885cc5a2496efa3fb) Thanks [@lukemorales](https://github.com/lukemorales)! - Fix type definition for `useSafeParams` when route has both `params` and `searchParams` defined

## 0.3.0

### Minor Changes

- [#15](https://github.com/lukemorales/next-safe-navigation/pull/15) [`31d794e`](https://github.com/lukemorales/next-safe-navigation/commit/31d794ed599e14596591f9874874c8446151528a) Thanks [@lukemorales](https://github.com/lukemorales)! - Add support for `experimental.typedRoutes`

  You may now enable `experimental.typedRoutes` in `next.config.js` to have a better and safer experience with autocomplete when defining your routes

## 0.2.0

### Minor Changes

- [#14](https://github.com/lukemorales/next-safe-navigation/pull/14) [`fc55e1d`](https://github.com/lukemorales/next-safe-navigation/commit/fc55e1dff699c331d7e3517e41161473d7da08d1) Thanks [@lukemorales](https://github.com/lukemorales)! - Add better support for Catch-all Segments

### Patch Changes

- [`a5194b3`](https://github.com/lukemorales/next-safe-navigation/commit/a5194b31b7e2708c4e4f20ac4d79f55d29cda705) Thanks [@lukemorales](https://github.com/lukemorales)! - Use regex instead of for loop to replace path params

## 0.1.1

### Patch Changes

- [`be00799`](https://github.com/lukemorales/next-safe-navigation/commit/be00799e9befbfd6fee464a3a76266c3fd1599d9) Thanks [@lukemorales](https://github.com/lukemorales)! - Fix route builder closure mutating same path string

## 0.1.0

### Minor Changes

- [`8cbcb51`](https://github.com/lukemorales/next-safe-navigation/commit/8cbcb5150724add6351b445db557eb63d941ce63) Thanks [@lukemorales](https://github.com/lukemorales)! - Initial release

  **Static type and runtime validation of routes, route params and query string parameters on client and server components for navigating routes in [NextJS App Router](https://nextjs.org) with Zod schemas.**

  > [!WARNING]
  > Ensure `experimental.typedRoutes` is not enabled in `next.config.js`

  ### Declare your application routes and parameters in a single place

  ```ts
  // src/shared/navigation.ts
  import { createNavigationConfig } from "next-safe-navigation";
  import { z } from "zod";

  export const { routes, useSafeParams, useSafeSearchParams } =
    createNavigationConfig((defineRoute) => ({
      home: defineRoute("/"),
      customers: defineRoute("/customers", {
        search: z
          .object({
            query: z.string().default(""),
            page: z.coerce.number().default(1),
          })
          .default({ query: "", page: 1 }),
      }),
      invoice: defineRoute("/invoices/[invoiceId]", {
        params: z.object({
          invoiceId: z.string(),
        }),
      }),
    }));
  ```

  ### Runtime validation for React Server Components (RSC)

  > [!IMPORTANT]
  > The output of a Zod schema might not be the same as its input, since schemas can transform the values during parsing (e.g.: `z.coerce.number()`), especially when dealing with `URLSearchParams` where all values are strings and you might want to convert params to different types. For this reason, this package does not expose types to infer `params` or `searchParams` from your declared routes to be used in page props:
  >
  > ```ts
  > interface CustomersPageProps {
  >   // ❌ Do not declare your params | searchParam types
  >   searchParams?: ReturnType<typeof routes.customers.$parseSearchParams>;
  > }
  > ```
  >
  > Instead, it is strongly advised that you parse the params in your server components to have runtime validated and accurate type information for the values in your app.

  ```ts
  // src/app/customers/page.tsx
  import { routes } from "@/shared/navigation";

  interface CustomersPageProps {
    // ✅ Never assume the types of your params before validation
    searchParams?: unknown
  }

  export default async function CustomersPage({ searchParams }: CustomersPageProps) {
    const { query, page } = routes.customers.$parseSearchParams(searchParams);

    const customers = await fetchCustomers({ query, page });

    return (
      <main>
        <input name="query" type="search" defaultValue={query} />

        <Customers data={customers} />
      </main>
    )
  };

  /* --------------------------------- */

  // src/app/invoices/[invoiceId]/page.tsx
  import { routes } from "@/shared/navigation";

  interface InvoicePageProps {
    // ✅ Never assume the types of your params before validation
    params?: unknown
  }

  export default async function InvoicePage({ params }: InvoicePageProps) {
    const { invoiceId } = routes.invoice.$parseParams(params);

    const invoice = await fetchInvoice(invoiceId);

    return (
      <main>
        <Invoice data={customers} />
      </main>
    )
  };
  ```

  ### Runtime validation for Client Components

  ```ts
  // src/app/customers/page.tsx
  'use client';

  import { useSafeSearchParams } from "@/shared/navigation";

  export default function CustomersPage() {
    const { query, page } = useSafeSearchParams('customers');

    const customers = useSuspenseQuery({
      queryKey: ['customers', { query, page }],
      queryFn: () => fetchCustomers({ query, page}),
    });

    return (
      <main>
        <input name="query" type="search" defaultValue={query} />

        <Customers data={customers.data} />
      </main>
    )
  };

  /* --------------------------------- */

  // src/app/invoices/[invoiceId]/page.tsx
  'use client';

  import { useSafeParams } from "@/shared/navigation";

  export default function InvoicePage() {
    const { invoiceId } = useSafeParams('invoice');

    const invoice = useSuspenseQuery({
      queryKey: ['invoices', { invoiceId }],
      queryFn: () => fetchInvoice(invoiceId),
    });

    return (
      <main>
        <Invoice data={invoice.data} />
      </main>
    )
  };
  ```

  Use throughout your codebase as the single source for navigating between routes:

  ```ts
  import { routes } from "@/shared/navigation";

  export function Header() {
    return (
      <nav>
        <Link href={routes.home()}>Home</Link>
        <Link href={routes.customers()}>Customers</Link>
      </nav>
    )
  };

  export function CustomerInvoices({ invoices }) {
    return (
      <ul>
        {invoices.map(invoice => (
          <li key={invoice.id}>
            <Link href={routes.invoice({ invoiceId: invoice.id })}>
              View invoice
            </Link>
          </li>
        ))}
      </ul>
    )
  };
  ```
