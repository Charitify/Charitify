<svelte:head>
	<title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<script>
	import { SearchLine, Footer } from '../../layouts'
	import CharitiesList from './index.svelte'
	import OrganizationsList from './organizations/index.svelte'

	export let segment
</script>

<div class="search theme-bg container">
	<br>

	<SearchLine/>

	<nav>
		<ul>
			<li><a rel=prefetch href='lists' class:selected='{segment !== "organizations"}'>charities</a></li>
			<li><a rel=prefetch href='lists/organizations' class:selected='{segment === "organizations"}'>organizations</a></li>
		</ul>
	</nav>
</div>

<div class="list-wrap">
	<br>

	{#if segment === 'organizations'}
		<OrganizationsList/>
	{:else}
		<CharitiesList/>
	{/if}

	<br>
	<br>
</div>

<Footer/>

<style>
	.search {
		position: sticky;
		top: 47px;
		box-shadow: var(--shadow-primary);
	}

	.list-wrap {
		flex: 1 1 auto;
		padding: 0 var(--screen-padding)
	}

	nav ul, nav li {
		display: flex;
		align-self: stretch;
		align-items: stretch;
		justify-content: stretch;
	}

	li {
		flex: 1 1 0;
	}

	li a {
		flex: 1 1 0;
		align-self: stretch;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 20px 10px;
	}

	li a:hover, li a.selected {
		background-color: rgba(var(--color-black), .1);
	}
</style>
