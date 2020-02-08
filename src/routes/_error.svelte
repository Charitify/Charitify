<script>
	export let status;
	export let error;

	const dev = process.env.NODE_ENV === 'development';
</script>

<style>
</style>

<svelte:head>
	<title>Error: {status}</title>
</svelte:head>

<br>
<br>
<br>
<br>
<h1 class="text-center">Error: {status}</h1>
<br>
<p class="text-center">Reason: {error.message}</p>
<br>
<br>
{#if dev && error.stack}
	<pre>{error.stack}</pre>
{/if}
