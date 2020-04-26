<script>
	import { onMount } from 'svelte';
	import { Header } from '@components';
	import { Storages } from '@services'
	import { safeGet, disableDoubleTapZoom } from '@utils'
	import Icons from './_icons.svelte';

	export let segment;

	let theme = safeGet(() => Storages.cookieStorage.get('theme') || Storages.localStorage.get('theme'))

	onMount(() => {
		disableDoubleTapZoom([document])
	})
</script>

<Icons/>

<main id="main" class={theme}>
	<Header {segment}/>

	<br>
	<br>
	<br>
	<br>

	<section id="offline-message">
		Сторінка оффлайн
	</section>

	<slot></slot>
</main>

<style>
	:global(#offline-message) {
		position: fixed;
		z-index: 11;
		bottom: calc(env(safe-area-inset-bottom) + 100px);
		left: 50%;
		padding: 10px 20px;
		background-color: rgba(var(--theme-bg-color));
		border-radius: var(--border-radius-small);
		overflow: hidden;
		transition: .2s ease-out;
		opacity: 0;
		pointer-events: none;
		transform: translate3d(-50%, 20px, 0);
	}
	:global(#offline-message.active) {
		opacity: 1;
		pointer-events: auto;
		transform: translate3d(-50%, 0, 0);
	}
</style>

