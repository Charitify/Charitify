<script>
	import { onMount } from 'svelte';
	import { Header, OfflineMessage } from '@components';
	import { Storages } from '@services'
	import { safeGet, disableDoubleTapZoom } from '@utils'
	import Icons from './_icons.svelte';

	export let segment;

	let theme = safeGet(() => Storages.cookieStorage.get('theme') || Storages.localStorage.get('theme'))

	onMount(() => {
		disableDoubleTapZoom([document])
	})
</script>

<Icons/>

<main id="main" class={theme}>
	<Header {segment}/>

	<slot></slot>

	<OfflineMessage/>
</main>

