import {
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';

import {
  type StandardSchemaV1,
  validateStandardSchemaSync,
} from './standard-schema';
import { convertURLSearchParamsToObject } from './convert-url-search-params-to-object';
import { makeRouteBuilder, type RouteBuilder } from './make-route-builder';
import type { Prettify } from './types';

type AnyRouteBuilder =
  | RouteBuilder<string, any, any>
  | RouteBuilder<string, any, never>
  | RouteBuilder<string, never, any>
  | RouteBuilder<string, never, never>;

type NavigationConfig = Record<string, AnyRouteBuilder>;

type SafeRootRoute<Path extends string> = () => Path;

type SafeRouteWithParams<
  Path extends string,
  Params extends StandardSchemaV1,
> = {
  (options: StandardSchemaV1.InferInput<Params>): Path;
  $parseParams: (params: unknown) => StandardSchemaV1.InferOutput<Params>;
};

type SafeRouteWithSearch<
  Path extends string,
  Search extends StandardSchemaV1,
> = {
  (options?: { search?: StandardSchemaV1.InferInput<Search> }): Path;
  $parseSearchParams: (
    searchParams: unknown,
  ) => StandardSchemaV1.InferOutput<Search>;
};

type SafeRouteWithRequiredSearch<
  Path extends string,
  Search extends StandardSchemaV1,
> = {
  (options: { search: StandardSchemaV1.InferInput<Search> }): Path;
  $parseSearchParams: (
    searchParams: unknown,
  ) => StandardSchemaV1.InferOutput<Search>;
};

type SafeRouteWithParamsAndSearch<
  Path extends string,
  Params extends StandardSchemaV1,
  Search extends StandardSchemaV1,
  Options = StandardSchemaV1.InferInput<Params> & {
    search?: StandardSchemaV1.InferInput<Search>;
  },
> = {
  (options: Prettify<Options>): Path;
  $parseParams: (params: unknown) => StandardSchemaV1.InferOutput<Params>;
  $parseSearchParams: (
    searchParams: unknown,
  ) => StandardSchemaV1.InferOutput<Search>;
};

type SafeRouteWithParamsAndRequiredSearch<
  Path extends string,
  Params extends StandardSchemaV1,
  Search extends StandardSchemaV1,
  Options = StandardSchemaV1.InferInput<Params> & {
    search: StandardSchemaV1.InferInput<Search>;
  },
> = {
  (options: Prettify<Options>): Path;
  $parseParams: (params: unknown) => StandardSchemaV1.InferOutput<Params>;
  $parseSearchParams: (
    searchParams: unknown,
  ) => StandardSchemaV1.InferOutput<Search>;
};

type SafeRoute<
  Path extends string,
  Params extends StandardSchemaV1,
  Search extends StandardSchemaV1,
> =
  [Params, Search] extends [never, never] ? SafeRootRoute<Path>
  : [Params, Search] extends [StandardSchemaV1, never] ?
    SafeRouteWithParams<Path, Params>
  : [Params, Search] extends [never, StandardSchemaV1] ?
    undefined extends StandardSchemaV1.InferInput<Search> ?
      SafeRouteWithSearch<Path, Search>
    : SafeRouteWithRequiredSearch<Path, Search>
  : [Params, Search] extends [StandardSchemaV1, StandardSchemaV1] ?
    undefined extends StandardSchemaV1.InferInput<Search> ?
      SafeRouteWithParamsAndSearch<Path, Params, Search>
    : SafeRouteWithParamsAndRequiredSearch<Path, Params, Search>
  : never;

type RouteWithParams<Config extends NavigationConfig> = {
  [Route in keyof Config & string]: Config[Route] extends (
    RouteBuilder<string, infer Params extends StandardSchemaV1, infer _>
  ) ?
    Params extends StandardSchemaV1 ?
      Route
    : never
  : never;
}[keyof Config & string];

type RouteWithSearchParams<Config extends NavigationConfig> = {
  [Route in keyof Config & string]: Config[Route] extends (
    RouteBuilder<
      string,
      infer _ extends StandardSchemaV1,
      infer Search extends StandardSchemaV1
    >
  ) ?
    Search extends StandardSchemaV1 ?
      Route
    : never
  : never;
}[keyof Config & string];

type SafeNavigation<Config extends NavigationConfig> = {
  [Route in keyof Config]: Config[Route] extends (
    RouteBuilder<
      infer Path extends string,
      infer Params extends StandardSchemaV1,
      infer Search extends StandardSchemaV1
    >
  ) ?
    SafeRoute<Path, Params, Search>
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
      | SafeRoute<string, infer Params extends StandardSchemaV1, any>
      | SafeRoute<string, infer Params extends StandardSchemaV1, never>
    ) ?
      StandardSchemaV1.InferOutput<Params>
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
      | SafeRoute<string, any, infer Search extends StandardSchemaV1>
      | SafeRoute<string, never, infer Search extends StandardSchemaV1>
    ) ?
      StandardSchemaV1.InferOutput<Search>
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
    Partial<Record<'params' | 'search', StandardSchemaV1>>
  >();

  for (const [route, builder] of Object.entries(navigationConfig)) {
    const schemas = builder.getSchemas();

    // @ts-expect-error overwriting runtime implementation
    builder.getSchemas = undefined;

    if (schemas.params != null || schemas.search != null) {
      schemasStore.set(route, schemas);
    }

    if (schemas.params) {
      const paramsSchema = schemas.params as StandardSchemaV1;

      (builder as any).$parseParams = (input: unknown) => {
        try {
          return validateStandardSchemaSync(paramsSchema, input);
        } catch (error) {
          throw new Error(
            `Invalid route params for route "${route}": ${error instanceof Error ? error.message : 'Validation failed'}`,
          );
        }
      };
    }

    if (schemas.search) {
      const searchSchema = schemas.search as StandardSchemaV1;

      (builder as any).$parseSearchParams = (input: unknown) => {
        try {
          return validateStandardSchemaSync(searchSchema, input);
        } catch (error) {
          throw new Error(
            `Invalid search params for route "${route}": ${error instanceof Error ? error.message : 'Validation failed'}`,
          );
        }
      };
    }
  }

  function useSafeParams<Route extends keyof SafeNavigation<Config> & string>(
    route: Extract<RouteWithParams<Config>, Route>,
  ): ValidatedRouteParams<Config, Route, RouteWithParams<Config>> {
    const schema = schemasStore.get(route);

    if (!schema?.params) {
      throw new Error(`Route "${route}" does not have params validation`);
    }

    try {
      return validateStandardSchemaSync(
        schema.params,
        useNextParams(),
      ) as ValidatedRouteParams<Config, Route, RouteWithParams<Config>>;
    } catch (error) {
      throw new Error(
        `Invalid route params for route "${route}": ${error instanceof Error ? error.message : 'Validation failed'}`,
      );
    }
  }

  function useSafeSearchParams<
    Route extends keyof SafeNavigation<Config> & string,
  >(
    route: Extract<RouteWithSearchParams<Config>, Route>,
  ): ValidatedRouteSearchParams<Config, Route, RouteWithSearchParams<Config>> {
    const schema = schemasStore.get(route);

    if (!schema?.search) {
      throw new Error(`Route "${route}" does not have searchParams validation`);
    }

    try {
      return validateStandardSchemaSync(
        schema.search,
        convertURLSearchParamsToObject(useNextSearchParams()),
      ) as ValidatedRouteSearchParams<
        Config,
        Route,
        RouteWithSearchParams<Config>
      >;
    } catch (error) {
      throw new Error(
        `Invalid search params for route "${route}": ${error instanceof Error ? error.message : 'Validation failed'}`,
      );
    }
  }

  return {
    routes: navigationConfig as unknown as SafeNavigation<Config>,
    useSafeParams,
    useSafeSearchParams,
  };
}
