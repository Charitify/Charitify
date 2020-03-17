<script>
    import { classnames } from '../utils'

    $: classProp = classnames('card', $$props.class)
</script>

<section class={classProp}>
    <slot></slot>
</section>

<style>
    .card {
        width: 100%;
        overflow: hidden;
        box-shadow: var(--shadow-secondary);
        border-radius: var(--border-radius-big);
        background-color: rgba(var(--theme-color-primary));
    }
</style>
