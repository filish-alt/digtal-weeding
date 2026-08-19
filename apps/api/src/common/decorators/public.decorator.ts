import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public — skips both JWT auth and tenant isolation checks.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
