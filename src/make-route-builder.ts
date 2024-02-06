import { type z } from 'zod';

import { convertObjectToURLSearchParams } from './convert-object-to-url-search-params';
import type { ExcludeAny } from './types';

type PathBlueprint = `/${string}`;

type ExtractPathParams<T extends string> =
  T extends `${string}[${infer Param}]${infer Rest}` ?
    Param | ExtractPathParams<Rest>
  : never;

export type RouteBuilder<
  Params extends z.ZodSchema,
  Search extends z.ZodSchema,
> =
  [Params, Search] extends [never, never] ?
    { (): string; getSchemas: () => { params: never; search: never } }
  : [Params, Search] extends [z.ZodSchema, never] ?
    {
      (options: z.input<Params>): string;
      getSchemas: () => { params: Params; search: never };
    }
  : [Params, Search] extends [never, z.ZodSchema] ?
    undefined extends z.input<Search> ?
      {
        (options?: { search?: z.input<Search> }): string;
        getSchemas: () => { params: never; search: Search };
      }
    : {
        (options: { search: z.input<Search> }): string;
        getSchemas: () => { params: never; search: Search };
      }
  : [Params, Search] extends [z.ZodSchema, z.ZodSchema] ?
    undefined extends z.input<Search> ?
      {
        (options: z.input<Params> & { search?: z.input<Search> }): string;
        getSchemas: () => { params: Params; search: Search };
      }
    : {
        (options: z.input<Params> & { search: z.input<Search> }): string;
        getSchemas: () => { params: Params; search: Search };
      }
  : never;

type EnsurePathWithNoParams<Path extends string> =
  ExtractPathParams<Path> extends never ? Path
  : `[ERROR]: Missing validation for path params`;

/**
 * Ensures no extra values are passed to params validation
 */
type StrictParams<Schema extends z.ZodSchema, Keys extends string> =
  Schema extends z.ZodObject<infer Params> ?
    [keyof Params] extends [Keys] ?
      Schema
    : z.ZodObject<{
        [Key in keyof Params]: Key extends Keys ? Params[Key] : never;
      }>
  : never;

type RouteBuilderResult<
  PathParams extends string,
  Params extends z.ZodObject<any>,
  Search extends z.ZodSchema,
> =
  [PathParams, Search] extends [string, never] ? RouteBuilder<Params, never>
  : [PathParams, Search] extends [never, z.ZodSchema] ?
    RouteBuilder<never, Search>
  : [PathParams, Search] extends [string, z.ZodSchema] ?
    RouteBuilder<Params, Search>
  : never;

const PATH_PARAM_REGEX = /\[([^[\]]+)]/g;

// @ts-expect-error overload signature does match the implementation,
// the compiler complains about EnsurePathWithNoParams, but it is fine
export function makeRouteBuilder<Path extends PathBlueprint>(
  path: EnsurePathWithNoParams<Path>,
): RouteBuilder<never, never>;

export function makeRouteBuilder<
  Path extends PathBlueprint,
  Params extends z.ZodObject<{
    [K in ExtractPathParams<Path>]: z.ZodSchema;
  }>,
  Search extends z.ZodSchema = never,
>(
  path: Path,
  schemas: ExtractPathParams<Path> extends never ?
    { search: Search | z.ZodOptional<z.ZodSchema> }
  : {
      params: StrictParams<Params, ExtractPathParams<Path>>;
      search?: Search | z.ZodOptional<z.ZodSchema>;
    },
): RouteBuilderResult<
  ExtractPathParams<Path>,
  ExcludeAny<Params>,
  ExcludeAny<Search>
>;

export function makeRouteBuilder(
  path: PathBlueprint,
  schemas?: { params?: z.ZodSchema; search?: z.ZodSchema },
): any {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  const hasParamsInPath = /\[\w+\]/g.test(path);
  const isMissingParamsValidation = hasParamsInPath && !schemas?.params;

  if (isMissingParamsValidation) {
    throw new Error(`Validation missing for path params: "${path}"`);
  }

  const routeBuilder: RouteBuilder<any, any> = (options) => {
    const { search = {}, ...params } = options ?? {};

    const basePath = path.replace(
      PATH_PARAM_REGEX,
      (match, param) => params[param] ?? match,
    );

    const urlSearchParams = convertObjectToURLSearchParams(search);

    if (urlSearchParams.size) {
      return [basePath, urlSearchParams.toString()].join('?');
    }

    return basePath;
  };

  routeBuilder.getSchemas = () => ({
    params: schemas?.params,
    search: schemas?.search,
  });

  return routeBuilder;
}

export type makeRouteBuilder = typeof makeRouteBuilder;
