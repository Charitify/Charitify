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
<div class="text-center">
	<h1>ой 🙃</h1>
</div>
<div hidden class="text-center">
	<h1>Error: {status}</h1>
	<br>
	<p>Reason: {error.message}</p>
</div>
<br>
<br>
