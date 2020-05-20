<script>
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'

    export let value = ''
    export let style = {}
    export let id = undefined
    export let label = undefined

    $: styleProp = toCSSString({ ...style })
    $: classProp = classnames('block full-width text-left', $$props.class)
</script>

<div {id} class={classProp} style={styleProp}>
    {#if label}
        <h2 class="block full-width">{label}</h2>
        <Br size="10"/>
    {/if}
    <p class="block full-width">{value || '—'}</p>
</div>
