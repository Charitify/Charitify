<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let id = undefined

    $: options = {
        id,
        class: classnames('progress', $$props.class),
    }
</script>

<progress value="65" max="100" style="background: 0; width: 100%"></progress>

<style>
</style>
