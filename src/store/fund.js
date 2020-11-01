import { writable } from 'svelte-persistent-store/dist/local';

export const fund = writable('fund', null);
export const funds = writable('funds', null);
