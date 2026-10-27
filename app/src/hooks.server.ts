import { redirect, type Handle } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { seedIngredients } from '$lib/server/seed';

seedIngredients();

/** Single shared password for now (set APP_PASSWORD). Real accounts come with households in slice 3. */
export const sessionToken = () => createHash('sha256').update('recipe-app-session:' + env.APP_PASSWORD).digest('hex');
const open = (p: string) => p === '/login' || p.startsWith('/icons/') || p === '/manifest.webmanifest' || p === '/sw.js';

export const handle: Handle = async ({ event, resolve }) => {
  if (env.APP_PASSWORD && !open(event.url.pathname) && event.cookies.get('session') !== sessionToken()) {
    redirect(303, `/login?next=${encodeURIComponent(event.url.pathname + event.url.search)}`);
  }
  return resolve(event);
};
