<p align="center">
  <a href="https://github.com/lukemorales/next-safe-navigation" target="\_parent"><img src="https://em-content.zobj.net/source/apple/354/goggles_1f97d.png" alt="Goggles emoji" height="130"></a>
</p>

<h1 align="center">Safe NextJS Navigation</h1>

<p align="center">
  <a href="https://github.com/lukemorales/next-safe-navigation/actions/workflows/tests.yml" target="\_parent"><img src="https://github.com/lukemorales/next-safe-navigation/actions/workflows/tests.yml/badge.svg?branch=main" alt="Latest build"></a>
  <a href="https://codecov.io/gh/lukemorales/next-safe-navigation"><img src="https://codecov.io/gh/lukemorales/next-safe-navigation/graph/badge.svg?token=35GW5EJMFK"/></a>
  <a href="https://www.npmjs.com/package/next-safe-navigation" target="\_parent"><img src="https://badgen.net/npm/v/next-safe-navigation" alt="Latest published version"></a>
  <a href="https://bundlephobia.com/package/next-safe-navigation@latest" target="\_parent"><img src="https://badgen.net/bundlephobia/minzip/next-safe-navigation" alt="Bundlephobia"></a>
  <a href="https://bundlephobia.com/package/next-safe-navigation@latest" target="\_parent"><img src="https://badgen.net/bundlephobia/tree-shaking/next-safe-navigation" alt="Tree shaking available"></a>
  <a href="https://github.com/lukemorales/next-safe-navigation" target="\_parent"><img src="https://badgen.net/npm/types/next-safe-navigation" alt="Types included"></a>
  <a href="https://www.npmjs.com/package/next-safe-navigation" target="\_parent"><img src="https://badgen.net/npm/license/next-safe-navigation" alt="License"></a>
  <a href="https://www.npmjs.com/package/next-safe-navigation" target="\_parent"><img src="https://badgen.net/npm/dt/next-safe-navigation" alt="Number of downloads"></a>
  <a href="https://github.com/lukemorales/next-safe-navigation" target="\_parent"><img src="https://img.shields.io/github/stars/lukemorales/next-safe-navigation.svg?style=social&amp;label=Star" alt="GitHub Stars"></a>
</p>

<p align="center">
  <strong>Static type and runtime validation for navigating routes in <a href="https://nextjs.org" target="\_parent">NextJS App Router</a> with Zod schemas.</strong>
</p>

<p align="center">
  Static and runtime validation of routes, route params and query string parameters on client and server components.
</p>

## 📦 Install
Safe NextJS Navigation is available as a package on NPM, install with your favorite package manager:

```dircolors
npm install next-safe-navigation
```

## ⚡ Quick start

> [!WARNING]
> Ensure `experimental.typedRoutes` is disabled in `next.config.js`

### Declare your application routes and parameters in a single place
```ts
// src/shared/navigation.ts
import { createNavigationConfig } from "next-safe-navigation";
import { z } from "zod";

export const { routes, useSafeParams, useSafeSearchParams } = createNavigationConfig(
  (defineRoute) => ({
    home: defineRoute('/'),
    customers: defineRoute('/customers', {
      search: z
        .object({
          query: z.string().default(''),
          page: z.coerce.number().default(1),
        })
        .default({ query: '', page: 1 }),
    }),
    invoice: defineRoute('/invoices/[invoiceId]', {
      params: z.object({
        invoiceId: z.string(),
      }),
    }),
    shop: defineRoute('/support/[...tickets]', {
      params: z.object({
        tickets: z.array(z.string()),
      }),
    }),
    shop: defineRoute('/shop/[[...slug]]', {
      params: z.object({
        // ⚠️ Remember to always set your optional catch-all segments
        // as optional values, or add a default value to them
        slug: z.array(z.string()).optional(),
      }),
    }),
  }),
);
```

### Runtime validation for React Server Components (RSC)
> [!IMPORTANT]
> The output of a Zod schema might not be the same as its input, since schemas can transform the values during parsing (e.g.: `z.coerce.number()`), especially when dealing with `URLSearchParams` where all values are strings and you might want to convert params to different types. For this reason, this package does not expose types to infer `params` or `searchParams` from your declared routes to be used in page props:
> ```ts
> interface CustomersPageProps {
>   // ❌ Do not declare your params | searchParam types
>   searchParams?: ReturnType<typeof routes.customers.$parseSearchParams>
> }
>```
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
