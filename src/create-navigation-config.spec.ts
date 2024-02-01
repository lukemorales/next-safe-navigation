import { renderHook } from '@testing-library/react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Mock } from 'vitest';
import { z } from 'zod';
import { createNavigationConfig } from './create-navigation-config';
import { suppressConsoleErrors } from './test-utils';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}));

const INVALID_PARAM = Symbol('invalid_param');

describe('createNavigationConfig', () => {
  describe('routes', () => {
    describe('for paths without params or searchParams', () => {
      const { routes } = createNavigationConfig((defineRoute) => ({
        about: defineRoute('/about'),
      }));

      it('creates a safe context for navigating', () => {
        // @ts-expect-error "about" route has no arguments
        routes.about({});

        expect(routes.about()).toBe('/about');
      });

      it('does not expose methods to validate params or searchParams', () => {
        //@ts-expect-error about should not have $parseParams
        expect(routes.about.$parseParams).toBeUndefined();
        //@ts-expect-error about should not have $parseSearchParams
        expect(routes.about.$parseSearchParams).toBeUndefined();
      });
    });

    describe('for paths with searchParams', () => {
      describe('when searchParams are required', () => {
        const { routes } = createNavigationConfig((defineRoute) => ({
          team: defineRoute('/team', {
            search: z.object({
              q: z.string().optional(),
              order: z.enum(['asc', 'desc']).optional(),
            }),
          }),
        }));

        it('creates a safe context for navigating', () => {
          // @ts-expect-error "team" has required searchParams
          routes.team();

          expect(routes.team({ search: { q: 'john doe', order: 'asc' } })).toBe(
            '/team?q=john+doe&order=asc',
          );
        });

        it('exposes method to validate only searchParams', () => {
          //@ts-expect-error team should not have $parseParams
          expect(routes.team.$parseParams).toBeUndefined();

          expect(routes.team.$parseSearchParams).toBeDefined();

          expect(() =>
            routes.team.$parseSearchParams(INVALID_PARAM),
          ).toThrowError('Invalid search params for route "team"');
          expect(() =>
            routes.team.$parseSearchParams({ q: 'john doe', order: 'asc' }),
          ).not.toThrow();
        });
      });

      describe('when searchParams are optional', () => {
        const { routes } = createNavigationConfig((defineRoute) => ({
          team: defineRoute('/team', {
            search: z
              .object({
                q: z.string().optional(),
                order: z.enum(['asc', 'desc']).optional(),
              })
              .optional(),
          }),
        }));

        it('creates a safe context for navigating', () => {
          // no @ts-expect-error as "team" has optional searchParams
          expect(routes.team()).toBe('/team');

          expect(routes.team({ search: { q: 'john doe', order: 'asc' } })).toBe(
            '/team?q=john+doe&order=asc',
          );
        });

        it('exposes method to validate only searchParams', () => {
          //@ts-expect-error team should not have $parseParams
          expect(routes.team.$parseParams).toBeUndefined();

          expect(routes.team.$parseSearchParams).toBeDefined();

          expect(() =>
            routes.team.$parseSearchParams(INVALID_PARAM),
          ).toThrowError('Invalid search params for route "team"');
          expect(() =>
            routes.team.$parseSearchParams({ q: 'john doe', order: 'asc' }),
          ).not.toThrow();
          expect(() => routes.team.$parseSearchParams(undefined)).not.toThrow();
        });
      });
    });

    describe('for paths with route params', () => {
      describe('when path has a single route param', () => {
        const { routes } = createNavigationConfig((defineRoute) => ({
          organization: defineRoute('/organizations/[orgId]', {
            params: z.object({
              orgId: z.string(),
            }),
          }),
        }));

        it('creates a safe context for navigating', () => {
          routes.organization({
            orgId: 'org_123',
            // @ts-expect-error "organization" route has no searchParams validation
            search: {},
          });

          expect(routes.organization({ orgId: 'org_123' })).toBe(
            '/organizations/org_123',
          );
        });

        it('exposes method to validate only params', () => {
          expect(routes.organization.$parseParams).toBeDefined();

          //@ts-expect-error team should not have $parseSearchParams
          expect(routes.organization.$parseSearchParams).toBeUndefined();

          expect(() =>
            routes.organization.$parseParams(INVALID_PARAM),
          ).toThrowError('Invalid route params for route "organization"');
          expect(() =>
            routes.organization.$parseParams({ orgId: 'org_123' }),
          ).not.toThrow();
        });
      });

      describe('when path has multiple route params', () => {
        const { routes } = createNavigationConfig((defineRoute) => ({
          organizationUser: defineRoute(
            '/organizations/[orgId]/users/[userId]',
            {
              params: z.object({
                orgId: z.string(),
                userId: z.string(),
              }),
            },
          ),
        }));

        it('creates a safe context for navigating', () => {
          routes.organizationUser({
            orgId: 'org_123',
            userId: 'user_123',
            // @ts-expect-error "organization" route has no searchParams validation
            search: {},
          });

          expect(
            routes.organizationUser({ orgId: 'org_123', userId: 'user_123' }),
          ).toBe('/organizations/org_123/users/user_123');
        });

        it('exposes method to validate only params', () => {
          expect(routes.organizationUser.$parseParams).toBeDefined();

          //@ts-expect-error team should not have $parseSearchParams
          expect(routes.organizationUser.$parseSearchParams).toBeUndefined();

          expect(() =>
            routes.organizationUser.$parseParams(INVALID_PARAM),
          ).toThrowError('Invalid route params for route "organizationUser"');
          expect(() =>
            routes.organizationUser.$parseParams({
              orgId: 'org_123',
              userId: 'user_123',
            }),
          ).not.toThrow();
        });
      });
    });

    describe('for paths with route params and searchParams', () => {
      describe('when path has a single route param and required searchParams', () => {
        const { routes } = createNavigationConfig((defineRoute) => ({
          organization: defineRoute('/organizations/[orgId]', {
            params: z.object({
              orgId: z.string(),
            }),
            search: z.object({
              q: z.string().optional(),
              order: z.enum(['asc', 'desc']).optional(),
            }),
          }),
        }));

        it('creates a safe context for navigating', () => {
          // @ts-expect-error "organization" route has required searchParams
          routes.organization({
            orgId: 'org_123',
          });

          expect(
            routes.organization({
              orgId: 'org_123',
              search: { q: 'john doe', order: 'asc' },
            }),
          ).toBe('/organizations/org_123?q=john+doe&order=asc');
        });

        it('exposes method to validate params and searchParams', () => {
          expect(routes.organization.$parseParams).toBeDefined();

          expect(routes.organization.$parseSearchParams).toBeDefined();
        });
      });

      describe('when path has a single route param and optional searchParams', () => {
        const { routes } = createNavigationConfig((defineRoute) => ({
          organization: defineRoute('/organizations/[orgId]', {
            params: z.object({
              orgId: z.string(),
            }),
            search: z
              .object({
                q: z.string().optional(),
                order: z.enum(['asc', 'desc']).optional(),
              })
              .optional(),
          }),
        }));

        it('creates a safe context for navigating', () => {
          // no @ts-expect-error as "organization" route has optional searchParams
          routes.organization({
            orgId: 'org_123',
          });

          expect(
            routes.organization({
              orgId: 'org_123',
              search: { q: 'john doe', order: 'asc' },
            }),
          ).toBe('/organizations/org_123?q=john+doe&order=asc');
        });

        it('exposes method to validate params and searchParams', () => {
          expect(routes.organization.$parseParams).toBeDefined();

          expect(routes.organization.$parseSearchParams).toBeDefined();
        });
      });

      describe('when path has multiple route params and required searchParams', () => {
        const { routes } = createNavigationConfig((defineRoute) => ({
          organizationUser: defineRoute(
            '/organizations/[orgId]/users/[userId]',
            {
              params: z.object({
                orgId: z.string(),
                userId: z.string(),
              }),
              search: z.object({
                q: z.string().optional(),
                order: z.enum(['asc', 'desc']).optional(),
              }),
            },
          ),
        }));

        it('creates a safe context for navigating', () => {
          // @ts-expect-error "organization" route has required searchParams
          routes.organizationUser({
            orgId: 'org_123',
            userId: 'user_123',
          });

          expect(
            routes.organizationUser({
              orgId: 'org_123',
              userId: 'user_123',
              search: { q: 'john doe', order: 'asc' },
            }),
          ).toBe('/organizations/org_123/users/user_123?q=john+doe&order=asc');
        });

        it('exposes method to validate params and searchParams', () => {
          expect(routes.organizationUser.$parseParams).toBeDefined();

          expect(routes.organizationUser.$parseSearchParams).toBeDefined();
        });
      });

      describe('when path has multiple route params and optional searchParams', () => {
        const { routes } = createNavigationConfig((defineRoute) => ({
          organizationUser: defineRoute(
            '/organizations/[orgId]/users/[userId]',
            {
              params: z.object({
                orgId: z.string(),
                userId: z.string(),
              }),
              search: z
                .object({
                  q: z.string().optional(),
                  order: z.enum(['asc', 'desc']).optional(),
                })
                .optional(),
            },
          ),
        }));

        it('creates a safe context for navigating', () => {
          // no @ts-expect-error as "organization" route has optional searchParams
          routes.organizationUser({
            orgId: 'org_123',
            userId: 'user_123',
          });

          expect(
            routes.organizationUser({
              orgId: 'org_123',
              userId: 'user_123',
              search: { q: 'john doe', order: 'asc' },
            }),
          ).toBe('/organizations/org_123/users/user_123?q=john+doe&order=asc');
        });

        it('exposes method to validate params and searchParams', () => {
          expect(routes.organizationUser.$parseParams).toBeDefined();

          expect(routes.organizationUser.$parseSearchParams).toBeDefined();
        });
      });
    });
  });

  describe('useSafeParams', () => {
    const { useSafeParams } = createNavigationConfig((defineRoute) => ({
      team: defineRoute('/team'),
      organization: defineRoute('/organizations/[orgId]', {
        params: z.object({
          orgId: z.coerce.number(),
        }),
      }),
      organizationUser: defineRoute('/organizations/[orgId]/users/[userId]', {
        params: z.object({
          orgId: z.coerce.number(),
          userId: z.coerce.number(),
        }),
      }),
    }));

    let useParamsMock: Mock;

    beforeEach(() => {
      useParamsMock = useParams as Mock;
    });

    afterEach(() => {
      useParamsMock.mockClear();
    });

    it('throws when called with a route name that does not have route parameters ', () => {
      suppressConsoleErrors(() => {
        expect(() =>
          //@ts-expect-error teams should not be a valid route
          renderHook(() => useSafeParams('team')),
        ).toThrowError('Route "team" does not have params validation');
      });
    });

    it('throws when called with bad route parameters ', () => {
      suppressConsoleErrors(() => {
        useParamsMock.mockImplementation(() => ({ orgId: 'invalid-org-id' }));

        expect(() =>
          renderHook(() => useSafeParams('organization')),
        ).toThrowError('Invalid route params for route "organization"');
      });
    });

    describe('when path has a single route param', () => {
      it('returns an object of validated params for routes with route parameters', () => {
        useParamsMock.mockImplementation(() => ({ orgId: '1' }));

        const { result } = renderHook(() => useSafeParams('organization'));

        expectTypeOf(result.current).toEqualTypeOf<{ orgId: number }>();
        expect(result.current).toEqual({ orgId: 1 });
      });
    });

    describe('when path has multiple route params', () => {
      it('returns an object of validated params for routes with route parameters', () => {
        useParamsMock.mockImplementation(() => ({ orgId: '1', userId: '1' }));

        const { result } = renderHook(() => useSafeParams('organizationUser'));

        expectTypeOf(result.current).toEqualTypeOf<{
          orgId: number;
          userId: number;
        }>();
        expect(result.current).toEqual({ orgId: 1, userId: 1 });
      });
    });
  });

  describe('useSafeSearchParams', () => {
    const { useSafeSearchParams } = createNavigationConfig((defineRoute) => ({
      about: defineRoute('/about'),
      team: defineRoute('/team', {
        search: z
          .object({
            q: z.string().optional(),
            order: z.enum(['asc', 'desc']),
          })
          .optional(),
      }),
      organizations: defineRoute('/organizations', {
        search: z.object({
          q: z.string().optional(),
          order: z.enum(['asc', 'desc']).optional(),
        }),
      }),
    }));

    let useSearchParamsMock: Mock;

    beforeEach(() => {
      useSearchParamsMock = useSearchParams as Mock;
    });

    afterEach(() => {
      useSearchParamsMock.mockClear();
    });

    it('throws when called with a route name that does not have searchParams ', () => {
      suppressConsoleErrors(() => {
        expect(() =>
          //@ts-expect-error about should not be a valid route
          renderHook(() => useSafeSearchParams('about')),
        ).toThrowError('Route "about" does not have searchParams validation');
      });
    });

    it('throws when called with bad searchParams ', () => {
      suppressConsoleErrors(() => {
        useSearchParamsMock.mockImplementation(
          () => new URLSearchParams('q=john+doe&order=invalid'),
        );

        expect(() =>
          renderHook(() => useSafeSearchParams('team')),
        ).toThrowError('Invalid search params for route "team"');
      });
    });

    describe('when searchParams is required', () => {
      it('returns an object of validated params for routes with route parameters', () => {
        useSearchParamsMock.mockImplementation(
          () => new URLSearchParams('q=john+doe&order=asc'),
        );

        const { result } = renderHook(() =>
          useSafeSearchParams('organizations'),
        );

        type ExpectedOrganizationsSearchParamsType = {
          q?: string;
          order?: 'asc' | 'desc';
        };

        expectTypeOf(
          result.current,
        ).toEqualTypeOf<ExpectedOrganizationsSearchParamsType>();
        expect(result.current).toEqual({ q: 'john doe', order: 'asc' });
      });
    });

    describe('when searchParams is optional', () => {
      it('returns a possibly undefined object of validated params for routes with route parameters', () => {
        useSearchParamsMock.mockImplementation(
          () => new URLSearchParams('q=john+doe&order=asc'),
        );

        const { result } = renderHook(() => useSafeSearchParams('team'));

        type ExpectedTeamMembersSearchParamsType =
          | {
              q?: string;
              order: 'asc' | 'desc';
            }
          | undefined;

        expectTypeOf(
          result.current,
        ).toEqualTypeOf<ExpectedTeamMembersSearchParamsType>();
        expect(result.current).toEqual({ q: 'john doe', order: 'asc' });
      });
    });
  });

  describe.skip('full test suite', () => {
    function makeTestConfig() {
      return createNavigationConfig((defineRoute) => ({
        team: defineRoute('/team'),
        teamMembers: defineRoute('/team/members', {
          search: z
            .object({
              q: z.string().optional(),
              order: z.enum(['asc', 'desc']),
            })
            .optional(),
        }),
        organizations: defineRoute('/organizations', {
          search: z.object({
            q: z.string().optional(),
            order: z.enum(['asc', 'desc']).optional(),
          }),
        }),
        organization: defineRoute('/organizations/[orgId]', {
          params: z.object({
            orgId: z.coerce.number(),
          }),
        }),
        organizationUsers: defineRoute('/organizations/[orgId]/users', {
          params: z.object({
            orgId: z.coerce.number(),
          }),
          search: z.object({
            q: z.string().optional(),
            order: z.enum(['asc', 'desc']).optional(),
          }),
        }),
      }));
    }

    it('creates a safe context for navigating', () => {
      const { routes } = makeTestConfig();

      expectTypeOf(routes.team).toEqualTypeOf<() => string>();
      expect(routes.team()).toBe('/team');

      type ExpectedTeamMembersType = (options: {
        search: { q?: string; order: 'asc' | 'desc' };
      }) => string;

      expectTypeOf(routes.teamMembers).toMatchTypeOf<ExpectedTeamMembersType>();
      expect(routes.teamMembers({ search: { order: 'asc' } })).toBe(
        '/team/members?order=asc',
      );

      type ExpectedOrganizationsType = (options: {
        search: { q?: string; order?: 'asc' | 'desc' };
      }) => string;

      expectTypeOf(
        routes.organizations,
      ).toMatchTypeOf<ExpectedOrganizationsType>();

      // @ts-expect-error organizations search is required
      expect(routes.organizations()).toBe('/organizations');
      expect(
        routes.organizations({ search: { q: 'foo corp', order: 'desc' } }),
      ).toBe('/organizations?q=foo+corp&order=desc');

      expect(routes.organization({ orgId: 1 })).toBe('/organizations/1');

      type ExpectedOrganizationUsersType = (options: {
        orgId: number;
        search: { q?: string; order?: 'asc' | 'desc' };
      }) => string;

      expectTypeOf(
        routes.organizationUsers,
      ).toMatchTypeOf<ExpectedOrganizationUsersType>();

      // @ts-expect-error organizationUsers search is required
      expect(routes.organizationUsers({ orgId: 1 })).toBe(
        '/organizations/1/users',
      );
      expect(
        routes.organizationUsers({
          orgId: 1,
          search: { q: 'john doe', order: 'asc' },
        }),
      ).toBe('/organizations/1/users?q=john+doe&order=asc');
    });

    it('exposes methods to validade params and searchParams', () => {
      const { routes } = makeTestConfig();
      {
        //@ts-expect-error team should not have $parseParams
        routes.team.$parseParams;
        //@ts-expect-error team should not have $parseSearchParams
        routes.team.$parseSearchParams;
      }

      {
        //@ts-expect-error teamMembers should not have $parseParams
        routes.teamMembers.$parseParams;

        expect(() =>
          routes.teamMembers.$parseSearchParams(INVALID_PARAM),
        ).toThrowError('Invalid search params for route "teamMembers"');

        expect(() =>
          routes.teamMembers.$parseSearchParams({
            q: 'john doe',
            order: 'asc',
          }),
        ).not.toThrow();
      }

      {
        //@ts-expect-error organizations should not have $parseParams
        routes.organizations.$parseParams;

        expect(() =>
          routes.organizations.$parseSearchParams(INVALID_PARAM),
        ).toThrowError('Invalid search params for route "organizations"');

        expect(() =>
          routes.organizations.$parseSearchParams({
            q: 'john doe',
            order: 'asc',
          }),
        ).not.toThrow();
      }

      {
        expect(() =>
          routes.organization.$parseParams(INVALID_PARAM),
        ).toThrowError('Invalid route params for route "organization"');
        expect(() =>
          routes.organization.$parseParams({ orgId: '1' }),
        ).not.toThrow();

        //@ts-expect-error organization should not have $parseParams
        routes.organization.$parseSearchParams;
      }

      {
        expect(() =>
          routes.organizationUsers.$parseParams(INVALID_PARAM),
        ).toThrowError('Invalid route params for route "organizationUsers"');
        expect(() =>
          routes.organizationUsers.$parseParams({ orgId: 1 }),
        ).not.toThrow();

        expect(() =>
          routes.organizationUsers.$parseSearchParams(INVALID_PARAM),
        ).toThrowError('Invalid search params for route "organizationUsers"');
        expect(() =>
          routes.organizationUsers.$parseSearchParams({
            q: 'john doe',
            order: 'asc',
          }),
        ).not.toThrow();
      }
    });
  });
});
