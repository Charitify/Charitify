<script>
    import { classnames } from '../utils'
    import Picture from './Picture.svelte'

    export let src
    export let alt
    export let size = null // small|medium|big

    $: classProp = classnames('ava', size, $$props.class)
</script>

<div class={classProp}>
    <Picture {src} alt={`Picture: ${alt}`}/>
</div>

<style>
    .ava {
        flex: none;
        display: flex;
        border-radius: 50%;
        overflow: hidden;
        max-width: 100%;
    }

    .small {
        width: 25px;
        height: 25px;
    }
    .medium {
        width: 35px;
        height: 35px;
    }
    .big {
        width: 130px;
        height: 130px;
    }
</style>
