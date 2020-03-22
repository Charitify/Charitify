<script>
	import { Header } from '@components';
	import Icons from './_icons.svelte';

	export let segment;
</script>

<style>
</style>

<Icons/>

<main id="main">
	<Header {segment}/>
	
	<slot></slot>
</main>

