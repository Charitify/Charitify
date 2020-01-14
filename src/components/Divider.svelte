<script>
    import { toCSSString, classnames } from '../utils'

    export let is = 'info'
    export let size = 0
    export let width = 2

    $: classProp = classnames('divider', is, $$props.class)
    $: styleProp = toCSSString({ padding: `${size / 2}px 0`, height: `${width}px` })
</script>

<hr class={classProp} style={styleProp}>

<style>
    .divider {
        margin: 0;
        border: none;
        box-sizing: content-box;
        background-clip: content-box;
    }

    .info {
        background-color: rgb(var(--color-info));
    }

    .success {
        background-color: rgb(var(--color-success));
    }

    .warning {
        background-color: rgb(var(--color-warning));
    }

    .danger {
        background-color: rgb(var(--color-danger));
    }
</style>
