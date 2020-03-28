<script>
	import { onMount } from 'svelte';
	import { Header } from '@components';
	import { Storages } from '@services'
	import { safeGet, disablePinchZoom, disableDoubleTapZoom } from '@utils'
	import Icons from './_icons.svelte';

	export let segment;

	let theme = safeGet(() => Storages.cookieStorage.get('theme') || Storages.localStorage.get('theme'))

	onMount(() => {
		disableDoubleTapZoom([document])
		disablePinchZoom([document, document.querySelector('.donate-btn')])
	})
</script>

<style>
</style>

<Icons/>

<main id="main" class={theme}>
	<Header {segment}/>

	<slot></slot>
</main>

