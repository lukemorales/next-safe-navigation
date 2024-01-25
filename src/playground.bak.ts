import { z } from 'zod';
import { createRouterConfig } from './create-router-config';

export const { routes, useSafeParams, useSafeSearchParams } =
  createRouterConfig((route) => ({
    home: route('/'),
    signup: route('/signup', {
      search: z.object({
        invitationId: z.string().optional(),
      }),
    }),
    organization: route('/org/[orgId]', {
      params: z.object({ orgId: z.string() }),
    }),
    organizationUsers: route('/org/[orgId]/users', {
      params: z.object({ orgId: z.string() }),
      search: z.object({ order: z.enum(['asc', 'desc']) }),
    }),
  }));

//@ts-expect-error Route "home" does not have params declared
const invalid = useSafeParams('home');
//      ^? const invalid: never

const params = useSafeParams('organization');
//      ^? const params: { orgId: string; }

const signUpSearch = useSafeSearchParams('signup');
//        ^? const signUpSearch: { invitationId?: string | null | undefined; }

//@ts-expect-error Route "organization" does not have params declared
const invalidSearch = useSafeSearchParams('organization');
//         ^? const invalidSearch: never

routes.home(); //?
routes.signup({ search: { invitationId: 'invite_123' } }); // "/signup?invitationId=invite_123"
routes.organization({ orgId: 'org_123' }); // "/org/org_123"
routes.organizationUsers({ orgId: 'org_123', search: { order: 'asc' } }); // "/org/org_123/users?order=asc"

routes.signup.$parseSearchParams({ invitationId: 'invite_345' });
routes.organization.$parseParams({ orgId: 'org_123' });
routes.organizationUsers.$parseParams({ orgId: 'org_123' });
routes.organizationUsers.$parseSearchParams({ order: 'desc' });
