import { writable } from 'svelte-persistent-store/dist/local';

export const donator = writable('donator', null);
export const donators = writable('donators', null);
