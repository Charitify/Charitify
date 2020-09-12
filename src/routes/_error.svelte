<script>
	import { Br, StatusCard, Button } from '@components' 

	export let status;
	export let error;

	console.warn(`There was an error with status ${status}: `, error);
</script>

<svelte:head>
	<title>Error: {status}</title>
</svelte:head>

<section class="container">	
	<Br size="var(--header-height)"/>
	<Br size="40"/>
	<StatusCard 
		{status}
		src="/assets/notFoundIllustration.svg"
	 	text="Упс... Щось пішло не так"
	>
		<Button href="/" type="primary" is="info" style="max-width: 300px">
			<span class="h3 font-secondary font-w-500">До головної сторінки</span>
		</Button>
	</StatusCard>
	<Br size="40"/>
</section>