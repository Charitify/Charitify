<script>
	import { onMount } from 'svelte';
    import { API } from '@services'
    import { root, rootOrganization } from '../store';
	import { Header, OfflineMessage } from '@components';
	import { Storages } from '@services'
	import { safeGet, disableDoubleTapZoom, classnames } from '@utils'

	export let segment;
	
	let theme = safeGet(() => Storages.cookieStorage.get('theme') || Storages.localStorage.get('theme'))

	$: classProp = classnames('theme-bg-color-secondary', theme)

	onMount(async () => {
		disableDoubleTapZoom([document])

		root.set(await API.getUser('me').catch(() => null))
		rootOrganization.set(await API.getOrganization($root.organization_id).catch(() => null))
	})
</script>

<main id="main" class={classProp}>
	<Header {segment}/>

	<section class="pages">
		<slot></slot>
	</section>

	<OfflineMessage/>
</main>


