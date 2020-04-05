<script>
    import { createEventDispatcher } from 'svelte'
    import { TrustButton, Br } from '@components'

    const dispatch = createEventDispatcher()

    export let active = false
</script>

<section class="flex flex-column flex-align-center flex-justify-center">
    <div style="width: 100px; max-width: 100%">
        <TrustButton isActive={active} on:click={e => dispatch('click', !active)}/>
    </div>
    <Br size="10"/>
    <h2>Я довіряю</h2>
</section>
