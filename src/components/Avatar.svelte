<script>
    import { classnames } from '@utils'
    import Picture from './Picture.svelte'

    export let src
    export let alt
    export let size = null // small|medium|big

    $: classProp = classnames('ava', size, $$props.class)
</script>

<div class={classProp}>
    <Picture {src} {alt}/>
</div>

<style>
    .ava {
        position: relative;
        flex-grow: 1;
        display: flex;
        border-radius: 50%;
        overflow: hidden;
    }

    .ava.small {
        flex: none;
        width: 30px;
        height: 30px;
    }
    .ava.medium {
        flex: none;
        width: 60px;
        height: 60px;
    }
    .ava.big {
        flex: none;
        width: 130px;
        height: 130px;
    }
</style>
