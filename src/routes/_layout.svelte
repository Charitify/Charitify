<script>
	import { Header } from '../components';
	import Icons from './_icons.svelte';

	export let segment;
</script>

<style>

</style>

<Header {segment}/>

<Icons/>

<main id="main">
	<slot></slot>
</main>

