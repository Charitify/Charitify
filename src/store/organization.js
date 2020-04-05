import { writable } from 'svelte-persistent-store/local';

export const organization = writable('organization', null);
export const organizations = writable('organizations', null);