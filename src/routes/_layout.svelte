<script>
	import { NavigationBar, Footer } from '../layouts';
	import Icons from './_icons.svelte';

	export let segment;
</script>

<style>

</style>

<NavigationBar {segment}/>

<Icons/>

<main>
	<slot></slot>
</main>

<Footer/>
