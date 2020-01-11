<script>
    import { classnames } from '../utils'
    import Picture from './Picture.svelte'

    export let src
    export let alt
    export let size = 'medium' // small|medium|big

    $: classProp = classnames('ava', size, $$props.class)
</script>

<div class={classProp}>
    <Picture {src} {alt}/>
</div>

<style>
    .ava {
        flex: none;
        display: flex;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: var(--shadow-primary);
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
        width: 45px;
        height: 45px;
    }
</style>
