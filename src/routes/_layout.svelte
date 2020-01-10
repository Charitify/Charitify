<script>
	import { Nav } from '../components';
	import Icons from './_icons.svelte';

	export let segment;
</script>

<style>
	main {
		position: relative;
		max-width: 56em;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>

<Nav {segment}/>

<Icons/>

<main>
	<slot></slot>
</main>
