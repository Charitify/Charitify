<script>
	import { onMount } from 'svelte';
	import { Header } from '@components';
	import { Storages } from '@services'
	import { safeGet } from '@utils'
	import Icons from './_icons.svelte';

	export let segment;

	let theme = safeGet(() => Storages.cookieStorage.get('theme') || Storages.localStorage.get('theme'))

	onMount(() => {
		// Avoid double tap to zoom in.
		let lastTouchEnd = 0;
		document.addEventListener('touchend', function(event) {
			const now = (new Date()).getTime();
			if (now - lastTouchEnd <= 300) {
				event.preventDefault();
			}
			lastTouchEnd = now;
		}, false);
	})

</script>

<style>
</style>

<Icons/>

<main id="main" class={theme}>
	<Header {segment}/>

	<slot></slot>
</main>

