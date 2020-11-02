import { writable } from 'svelte-persistent-store/dist/local';

export const comment = writable('comment', null);
export const comments = writable('comments', null);
