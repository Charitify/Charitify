<script>
	import { onMount } from 'svelte';
	import { Header } from '@components';
	import { Storages } from '@services'
	import { safeGet } from '@utils'
	import Icons from './_icons.svelte';

	export let segment;

	let touches = ''

	let theme = safeGet(() => Storages.cookieStorage.get('theme') || Storages.localStorage.get('theme'))

	onMount(() => {
		//Disable pinch zoom on document
		document.documentElement.addEventListener('touchstart', function (event) {
			touches = JSON.stringify(event.touches, null, 2)
			console.log(touches)
			if (event.touches.length > 1) {
				event.preventDefault();
			}
		}, false);

		// Avoid double tap to zoom in.
		// let lastTouchEnd = 0;
		// document.addEventListener('touchend', function(event) {
		// 	const now = (new Date()).getTime();
		// 	if (now - lastTouchEnd <= 300) {
		// 		event.preventDefault();
		// 	}
		// 	lastTouchEnd = now;
		// }, false);
	})

</script>

<style>
</style>

<Icons/>

<main id="main" class={theme}>
	<Header {segment}/>

	<br>
	<br>
	<br>

	{touches}
	<slot></slot>
</main>

