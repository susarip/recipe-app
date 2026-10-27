import { fail, redirect } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { sessionToken } from '../../hooks.server';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const form = await request.formData();
    const given = Buffer.from(String(form.get('password') ?? ''));
    const want = Buffer.from(env.APP_PASSWORD ?? '');
    if (!want.length || given.length !== want.length || !timingSafeEqual(given, want)) {
      await new Promise((r) => setTimeout(r, 500));
      return fail(401, { error: 'Wrong password.' });
    }
    cookies.set('session', sessionToken(), { path: '/', httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:', maxAge: 60 * 60 * 24 * 365 });
    const next = url.searchParams.get('next') ?? '/';
    redirect(303, next.startsWith('/') ? next : '/');
  }
};
