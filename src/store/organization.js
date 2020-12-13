import { writable } from 'svelte/store' // 'svelte-persistent-store/dist/local';

export const organization = writable(null);
export const organizations = writable(null);
export const rootOrganization = writable(null);
