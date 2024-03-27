# next-safe-navigation

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
