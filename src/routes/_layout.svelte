<script>
	import { Nav } from '../components';
	import Icons from './_icons.svelte';

	export let segment;
</script>

<style>

</style>

<Nav {segment}/>

<Icons/>

<main>
	<slot></slot>
</main>
