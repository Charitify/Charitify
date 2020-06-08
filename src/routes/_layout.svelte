<script>
	import { onMount } from 'svelte';
	import { Header, OfflineMessage } from '@components';
	import { Storages } from '@services'
	import { safeGet, disableDoubleTapZoom, classnames } from '@utils'

	export let segment;

	let theme = safeGet(() => Storages.cookieStorage.get('theme') || Storages.localStorage.get('theme'))

	$: classProp = classnames('theme-bg-color-secondary', theme)

	onMount(() => {
		disableDoubleTapZoom([document])
	})
</script>

<main id="main" class={classProp}>
	<Header {segment}/>

	<section class="pages">
		<slot></slot>
	</section>

	<OfflineMessage/>
</main>


