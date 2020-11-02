import { writable } from 'svelte-persistent-store/dist/local';

export const pet = writable('pet', null);
export const pets = writable('pets', null);
