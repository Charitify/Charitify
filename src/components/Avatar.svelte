<script>
    import { classnames } from '../utils'
    import Picture from './Picture.svelte'

    export let src
    export let alt
    export let size = null // small|medium|big

    $: classProp = classnames('ava', size, $$props.class)
</script>

<div class={classProp} style="background-color: green">
    <Picture {src} {alt}/>
</div>

<style>
    .ava {
        flex: none;
        display: flex;
        border-radius: 50%;
        overflow: hidden;
    }

    .small {
        width: 30px;
        height: 30px;
    }
    .medium {
        width: 60px;
        height: 60px;
    }
    .big {
        width: 130px;
        height: 130px;
    }
</style>
