import { writable } from 'svelte-persistent-store/dist/local';

export const user = writable('user', null);
export const users = writable('users', null);
