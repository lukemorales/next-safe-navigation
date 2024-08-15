import { z } from 'zod';

import { makeRouteBuilder } from './make-route-builder';

describe('makeRouteBuilder', () => {
  it('adds a "/" to the start of the path if it is missing in the declaration', () => {
    // @ts-expect-error path should begin with "/"
    const builder = makeRouteBuilder('about');

    expect(builder()).toBe('/about');
  });

  describe('for a path with no route params or searchParams', () => {
    it('creates a builder for the given path', () => {
      const builder = makeRouteBuilder('/about');

      // @ts-expect-error there are no arguments
      builder({});

      expect(builder()).toBe('/about');
      expect(builder.getSchemas()).toEqual({
        params: undefined,
        search: undefined,
      });
    });
  });

  describe('for a path with searchParams', () => {
    describe('when searchParams are required', () => {
      it('creates a builder that adds searchParams to the given path', () => {
        const builder = makeRouteBuilder('/users', {
          search: z.object({
            query: z.string().optional(),
            filters: z
              .array(z.enum(['active', 'is_admin', 'inactive']))
              .optional(),
          }),
        });

        // @ts-expect-error search is required
        builder();

        expect(
          builder({
            search: { query: 'john doe', filters: ['active', 'is_admin'] },
          }),
        ).toBe(`/users?query=john+doe&filters=active&filters=is_admin`);

        expect(builder.getSchemas()).toEqual({
          params: undefined,
          search: expect.any(Object),
        });
      });
    });

    describe('when searchParams are optional', () => {
      it('creates a builder that adds searchParams to the given path', () => {
        const builder = makeRouteBuilder('/users', {
          search: z
            .object({
              query: z.string().optional(),
              filters: z
                .array(z.enum(['active', 'is_admin', 'inactive']))
                .optional(),
            })
            .optional(),
        });

        // no @ts-expect-error as search is optional
        builder();

        expect(
          builder({
            search: { query: 'john doe', filters: ['active'] },
          }),
        ).toBe(`/users?query=john+doe&filters=active`);

        expect(
          builder({
            search: { query: 'john doe', filters: ['active', 'is_admin'] },
          }),
        ).toBe(`/users?query=john+doe&filters=active&filters=is_admin`);

        expect(builder.getSchemas()).toEqual({
          params: undefined,
          search: expect.any(Object),
        });
      });
    });
  });

  describe('for a path with route params', () => {
    it('throws when no validation is not provided', () => {
      expect(() =>
        // @ts-expect-error validation intentionally not provided
        makeRouteBuilder('/organizations/[orgId]'),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: Validation missing for path params: "/organizations/[orgId]"]`,
      );
    });

    describe('when path has a single route param', () => {
      it('creates a builder that replaces the path param with its value', () => {
        const builder = makeRouteBuilder('/organizations/[orgId]', {
          params: z.object({
            orgId: z.string(),
          }),
        });

        // @ts-expect-error no searchParams validation was defined
        builder({ orgId: 'org_123', search: {} });

        expect(builder({ orgId: 'org_123' })).toBe('/organizations/org_123');

        expect(builder.getSchemas()).toEqual({
          params: expect.any(Object),
          search: undefined,
        });
      });
    });

    describe('when path has multiple route params', () => {
      it('creates a builder that replaces all path params with its values', () => {
        const builder = makeRouteBuilder(
          '/organizations/[orgId]/users/[userId]',
          {
            params: z.object({
              orgId: z.string(),
              userId: z.string(),
            }),
          },
        );

        // @ts-expect-error no searchParams validation was defined
        builder({ orgId: 'org_123', userId: 'user_123', search: {} });

        expect(builder({ orgId: 'org_123', userId: 'user_123' })).toBe(
          '/organizations/org_123/users/user_123',
        );

        expect(builder.getSchemas()).toEqual({
          params: expect.any(Object),
          search: undefined,
        });
      });
    });

    describe('when the builder is called multiple times', () => {
      it('replaces correctly the path params with the latest value', () => {
        const builder = makeRouteBuilder('/organizations/[orgId]', {
          params: z.object({
            orgId: z.string(),
          }),
        });

        expect(builder({ orgId: 'org_123' })).toBe('/organizations/org_123');

        expect(builder({ orgId: 'org_456' })).toBe('/organizations/org_456');

        expect(builder({ orgId: 'org_789' })).toBe('/organizations/org_789');
      });
    });

    describe('when path has catch-all params', () => {
      it('creates a builder that replaces the path param with its value', () => {
        const builder = makeRouteBuilder('/[...catch_all]', {
          params: z.object({
            catch_all: z.array(z.string()),
          }),
        });

        // @ts-expect-error no searchParams validation was defined
        builder({ catch_all: ['channels'], search: {} });

        expect(builder({ catch_all: ['channels', 'channel_123'] })).toBe(
          '/channels/channel_123',
        );

        expect(builder.getSchemas()).toEqual({
          params: expect.any(Object),
          search: undefined,
        });
      });
    });

    describe('when path has optional catch-all params', () => {
      it('creates a builder that replaces the path param with its value', () => {
        const builder = makeRouteBuilder('/[[...catch_all]]', {
          params: z.object({
            catch_all: z.array(z.string()).default([]),
          }),
        });

        // @ts-expect-error no searchParams validation was defined
        builder({ catch_all: ['channels'], search: {} });

        expect(builder({ catch_all: ['channels', 'channel_123'] })).toBe(
          '/channels/channel_123',
        );

        expect(builder.getSchemas()).toEqual({
          params: expect.any(Object),
          search: undefined,
        });
      });
    });

    describe('when path has normal and catch-all params', () => {
      it('creates a builder that replaces the path params with their value', () => {
        const builder = makeRouteBuilder(
          '/organization/[orgId]/c/[...catch_all]',
          {
            params: z.object({
              orgId: z.string(),
              catch_all: z.array(z.string()),
            }),
          },
        );

        // @ts-expect-error no searchParams validation was defined
        builder({ catch_all: ['channels'], search: {} });

        expect(
          builder({ catch_all: ['channels', 'channel_123'], orgId: 'org_123' }),
        ).toBe('/organization/org_123/c/channels/channel_123');

        expect(builder.getSchemas()).toEqual({
          params: expect.any(Object),
          search: undefined,
        });
      });
    });
  });

  describe('when path has normal and optional catch-all params', () => {
    it('creates a builder that replaces the path params with their value', () => {
      const builder = makeRouteBuilder(
        '/organization/[orgId]/c/[[...catch_all]]',
        {
          params: z.object({
            orgId: z.string(),
            catch_all: z.array(z.string()).default([]),
          }),
        },
      );

      // @ts-expect-error no searchParams validation was defined
      builder({ catch_all: ['channels'], search: {} });

      expect(
        builder({ catch_all: ['channels', 'channel_123'], orgId: 'org_123' }),
      ).toBe('/organization/org_123/c/channels/channel_123');

      expect(builder.getSchemas()).toEqual({
        params: expect.any(Object),
        search: undefined,
      });
    });
  });

  describe('for a path with route params and searchParams', () => {
    it('throws when no validation is not provided for the route params', () => {
      expect(() =>
        // @ts-expect-error validation intentionally not provided
        makeRouteBuilder('/organizations/[orgId]/users', {
          search: z.object({
            query: z.string().optional(),
            filters: z
              .array(z.enum(['active', 'is_admin', 'inactive']))
              .optional(),
          }),
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: Validation missing for path params: "/organizations/[orgId]/users"]`,
      );
    });

    describe('when route has a single route param and required searchParams', () => {
      it('creates a builder that replaces the route param and adds searchParams to the path', () => {
        const builder = makeRouteBuilder('/organizations/[orgId]/users', {
          params: z.object({
            orgId: z.string(),
          }),
          search: z.object({
            query: z.string().optional(),
            filters: z
              .array(z.enum(['active', 'is_admin', 'inactive']))
              .optional(),
          }),
        });

        // @ts-expect-error search is required
        builder({ orgId: 'org_123' });

        expect(
          builder({
            orgId: 'org_123',
            search: { query: 'john doe', filters: ['active'] },
          }),
        ).toBe(`/organizations/org_123/users?query=john+doe&filters=active`);

        expect(
          builder({
            orgId: 'org_123',
            search: { query: 'john doe', filters: ['active', 'is_admin'] },
          }),
        ).toBe(
          `/organizations/org_123/users?query=john+doe&filters=active&filters=is_admin`,
        );

        expect(builder.getSchemas()).toEqual({
          params: expect.any(Object),
          search: expect.any(Object),
        });
      });
    });

    describe('when route has a single route param and optional searchParams', () => {
      it('creates a builder that replaces the route param and adds searchParams to the path', () => {
        const builder = makeRouteBuilder('/organizations/[orgId]/users', {
          params: z.object({
            orgId: z.string(),
          }),
          search: z
            .object({
              query: z.string().optional(),
              filters: z
                .array(z.enum(['active', 'is_admin', 'inactive']))
                .optional(),
            })
            .optional(),
        });

        expect(
          // no @ts-expect-error as search is optional
          builder({ orgId: 'org_123' }),
        ).toBe(`/organizations/org_123/users`);

        expect(
          builder({
            orgId: 'org_123',
            search: { query: 'john doe', filters: ['active'] },
          }),
        ).toBe(`/organizations/org_123/users?query=john+doe&filters=active`);

        expect(
          builder({
            orgId: 'org_123',
            search: { query: 'john doe', filters: ['active', 'is_admin'] },
          }),
        ).toBe(
          `/organizations/org_123/users?query=john+doe&filters=active&filters=is_admin`,
        );

        expect(builder.getSchemas()).toEqual({
          params: expect.any(Object),
          search: expect.any(Object),
        });
      });
    });

    describe('when route has multiple route params and required searchParams', () => {
      it('creates a builder that replaces all params and adds searchParams to the path', () => {
        const builder = makeRouteBuilder(
          '/organizations/[orgId]/users/[userId]/logs',
          {
            params: z.object({
              orgId: z.string(),
              userId: z.string(),
            }),
            search: z.object({
              order: z.enum(['date', 'user-agent']),
            }),
          },
        );

        // @ts-expect-error search is required
        builder({ orgId: 'org_123', userId: 'user_123' });

        expect(
          builder({
            orgId: 'org_123',
            userId: 'user_123',
            search: { order: 'date' },
          }),
        ).toBe(`/organizations/org_123/users/user_123/logs?order=date`);

        expect(builder.getSchemas()).toEqual({
          params: expect.any(Object),
          search: expect.any(Object),
        });
      });
    });

    describe('when route has multiple route params and optional searchParams', () => {
      it('creates a builder that replaces all params and adds searchParams to the path', () => {
        const builder = makeRouteBuilder(
          '/organizations/[orgId]/users/[userId]/logs',
          {
            params: z.object({
              orgId: z.string(),
              userId: z.string(),
            }),
            search: z
              .object({
                order: z.enum(['date', 'user-agent']),
              })
              .optional(),
          },
        );

        // no @ts-expect-error as search is optional
        expect(
          builder({
            orgId: 'org_123',
            userId: 'user_123',
          }),
        ).toBe('/organizations/org_123/users/user_123/logs');

        expect(
          builder({
            orgId: 'org_123',
            userId: 'user_123',
            search: { order: 'date' },
          }),
        ).toBe(`/organizations/org_123/users/user_123/logs?order=date`);

        expect(builder.getSchemas()).toEqual({
          params: expect.any(Object),
          search: expect.any(Object),
        });
      });
    });
  });
});
