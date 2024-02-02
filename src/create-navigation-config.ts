import {
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';

import { type z } from 'zod';

import { convertURLSearchParamsToObject } from './convert-url-search-params-to-object';
import { makeRouteBuilder, type RouteBuilder } from './make-route-builder';
import type { Prettify } from './types';

type AnyRouteBuilder =
  | RouteBuilder<any, any>
  | RouteBuilder<any, never>
  | RouteBuilder<never, any>
  | RouteBuilder<never, never>;

type NavigationConfig = Record<string, AnyRouteBuilder>;

type SafeRootRoute = () => string;

type SafeRouteWithParams<Params extends z.ZodSchema> = {
  (options: z.input<Params>): string;
  $parseParams: (params: unknown) => z.output<Params>;
};

type SafeRouteWithSearch<Search extends z.ZodSchema> = {
  (options?: { search?: z.input<Search> }): string;
  $parseSearchParams: (searchParams: unknown) => z.output<Search>;
};

type SafeRouteWithRequiredSearch<Search extends z.ZodSchema> = {
  (options: { search: z.input<Search> }): string;
  $parseSearchParams: (searchParams: unknown) => z.output<Search>;
};

type SafeRouteWithParamsAndSearch<
  Params extends z.ZodSchema,
  Search extends z.ZodSchema,
  Options = z.input<Params> & { search?: z.input<Search> },
> = {
  (options: Prettify<Options>): string;
  $parseParams: (params: unknown) => z.output<Params>;
  $parseSearchParams: (searchParams: unknown) => z.output<Search>;
};

type SafeRouteWithParamsAndRequiredSearch<
  Params extends z.ZodSchema,
  Search extends z.ZodSchema,
  Options = z.input<Params> & { search: z.input<Search> },
> = {
  (options: Prettify<Options>): string;
  $parseParams: (params: unknown) => z.output<Params>;
  $parseSearchParams: (searchParams: unknown) => z.output<Search>;
};

type SafeRoute<Params extends z.ZodSchema, Search extends z.ZodSchema> =
  [Params, Search] extends [never, never] ? SafeRootRoute
  : [Params, Search] extends [z.ZodSchema, never] ? SafeRouteWithParams<Params>
  : [Params, Search] extends [never, z.ZodSchema] ?
    undefined extends z.input<Search> ?
      SafeRouteWithSearch<Search>
    : SafeRouteWithRequiredSearch<Search>
  : [Params, Search] extends [z.ZodSchema, z.ZodSchema] ?
    undefined extends z.input<Search> ?
      SafeRouteWithParamsAndSearch<Params, Search>
    : SafeRouteWithParamsAndRequiredSearch<Params, Search>
  : never;

type RouteWithParams<Config extends NavigationConfig> = {
  [Route in keyof Config & string]: Config[Route] extends (
    RouteBuilder<infer Params, never> | RouteBuilder<infer Params, any>
  ) ?
    Params extends z.ZodSchema ?
      Route
    : never
  : never;
}[keyof Config & string];

type RouteWithSearchParams<Config extends NavigationConfig> = {
  [Route in keyof Config & string]: Config[Route] extends (
    RouteBuilder<never, infer Search> | RouteBuilder<any, infer Search>
  ) ?
    Search extends z.ZodSchema ?
      Route
    : never
  : never;
}[keyof Config & string];

type SafeNavigation<Config extends NavigationConfig> = {
  [Route in keyof Config]: Config[Route] extends (
    RouteBuilder<infer Params, infer Search>
  ) ?
    SafeRoute<Params, Search>
  : never;
};

type ValidatedRouteParams<
  Config extends NavigationConfig,
  Route extends string,
  AcceptableRoute extends string,
  Router = SafeNavigation<Config>,
> =
  Route extends keyof Pick<Router, AcceptableRoute & keyof Router> ?
    Router[Route] extends (
      SafeRoute<infer Params, any> | SafeRoute<infer Params, never>
    ) ?
      z.output<Params>
    : never
  : never;

type ValidatedRouteSearchParams<
  Config extends NavigationConfig,
  Route extends string,
  AcceptableRoute extends string,
  Router = SafeNavigation<Config>,
> =
  Route extends keyof Pick<Router, AcceptableRoute & keyof Router> ?
    Router[Route] extends (
      SafeRoute<any, infer Search> | SafeRoute<never, infer Search>
    ) ?
      z.output<Search>
    : never
  : never;

interface SafeNavigationConfigImpl<
  Config extends NavigationConfig,
  $SafeRouter extends SafeNavigation<any> = SafeNavigation<Config>,
  $RouteWithParams extends string = RouteWithParams<Config>,
  $RouteWithSearchParams extends string = RouteWithSearchParams<Config>,
> {
  routes: $SafeRouter;
  useSafeParams: <Route extends keyof $SafeRouter & string>(
    route: Extract<$RouteWithParams, Route>,
  ) => ValidatedRouteParams<Config, Route, $RouteWithParams>;
  useSafeSearchParams: <Route extends keyof $SafeRouter & string>(
    route: Extract<$RouteWithSearchParams, Route>,
  ) => ValidatedRouteSearchParams<Config, Route, $RouteWithSearchParams>;
}

type SafeNavigationConfig<Config extends NavigationConfig> =
  SafeNavigationConfigImpl<Config>;

export function createNavigationConfig<Config extends NavigationConfig>(
  createConfig: (defineRoute: makeRouteBuilder) => Config,
): SafeNavigationConfig<Config> {
  const navigationConfig = createConfig(makeRouteBuilder);

  const schemasStore = new Map<
    keyof Config,
    Partial<Record<'params' | 'search', z.ZodSchema>>
  >();

  for (const [route, builder] of Object.entries(navigationConfig)) {
    const schemas = builder.getSchemas();

    // @ts-expect-error overwriting runtime implementation
    builder.getSchemas = undefined;

    if (schemas.params != null || schemas.search != null) {
      schemasStore.set(route, schemas);
    }

    if (schemas.params) {
      const paramsSchema = schemas.params as z.ZodSchema;

      (builder as any).$parseParams = (input: unknown) => {
        const validation = paramsSchema.safeParse(input);

        if (!validation.success) {
          throw new Error(
            `Invalid route params for route "${route}": ${validation.error.message}`,
          );
        }

        return validation.data;
      };
    }

    if (schemas.search) {
      const searchSchema = schemas.search as z.ZodSchema;

      (builder as any).$parseSearchParams = (input: unknown) => {
        const validation = searchSchema.safeParse(input);

        if (!validation.success) {
          throw new Error(
            `Invalid search params for route "${route}": ${validation.error.message}`,
          );
        }

        return validation.data;
      };
    }
  }

  function useSafeParams(route: string) {
    const schema = schemasStore.get(route);

    if (!schema?.params) {
      throw new Error(`Route "${route}" does not have params validation`);
    }

    const validation = schema.params.safeParse(useNextParams());

    if (!validation.success) {
      throw new Error(
        `Invalid route params for route "${route}": ${validation.error.message}`,
      );
    }

    return validation.data;
  }

  function useSafeSearchParams(route: string) {
    const schema = schemasStore.get(route);

    if (!schema?.search) {
      throw new Error(`Route "${route}" does not have searchParams validation`);
    }

    const validation = schema.search.safeParse(
      convertURLSearchParamsToObject(useNextSearchParams()),
    );

    if (!validation.success) {
      throw new Error(
        `Invalid search params for route "${route}": ${validation.error.message}`,
      );
    }

    return validation.data;
  }

  return {
    routes: navigationConfig as unknown as SafeNavigation<Config>,
    useSafeParams,
    useSafeSearchParams,
  };
}
