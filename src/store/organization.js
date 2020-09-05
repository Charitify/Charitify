import { writable } from 'svelte-persistent-store/dist/local';

export const organization = writable('organization', null);
export const organizations = writable('organizations', null);
