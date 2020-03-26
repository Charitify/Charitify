<script>
	import { Header } from '@components';
	import { Storages } from '@services'
	import { safeGet } from '@utils'
	import Icons from './_icons.svelte';

	export let segment;

	let theme = safeGet(() => Storages.cookieStorage.get('theme') || Storages.localStorage.get('theme'))
</script>

<style>
</style>

<Icons/>

<main id="main" class={theme}>
	<Header {segment}/>

	<slot></slot>
</main>

