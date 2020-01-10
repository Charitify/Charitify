<script>
	import { Nav } from '../components';
	import Icons from './_icons.svelte';

	export let segment;

	import { onMount } from 'svelte';

	onMount(() => {
		console.log('init')
		window.addEventListener('popstate', function(event) {
			console.log('works hide', event)
			alert('works hide')
		});
	});

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
