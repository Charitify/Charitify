import { writable } from 'svelte-persistent-store/dist/local';

export const root = writable('root', null);
