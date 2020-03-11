<script>
    import { classnames } from '../utils'

    $: classProp = classnames('card', $$props.class)
</script>

<section class={classProp}>
    <slot></slot>
</section>

<style>
    .card {
        box-shadow: var(--shadow-secondary);
        border-radius: var(--border-radius-big);
        background-color: rgba(var(--color-white));
    }
</style>
