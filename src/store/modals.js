import { writable } from 'svelte-persistent-store/session';

export const modals = writable('modals', JSON.stringify({}));