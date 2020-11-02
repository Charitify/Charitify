import { writable } from 'svelte-persistent-store/dist/local';

export const article = writable('article', null);
export const articles = writable('articles', null);
