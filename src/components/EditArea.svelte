<script>
    import Br from './Br.svelte'
    import Icon from './Icon.svelte'
    import Button from './Button.svelte'
</script>

<section class="edit-area">
    <slot></slot>

    <Br size="20"/>
    <Button size="small" is="info" class="no-filter">
        <span class="h3 font-secondary font-w-500 flex flex-align-center">
            Редагувати
            <s></s>
            <s></s>
            <Icon type="edit" size="small" is="light"/>
        </span>
    </Button>
    <Br size="30"/>
</section>

<style>
    .edit-area {
        --color-bg: rgba(var(--theme-color-primary-opposite), .1);
        --color-lines: rgba(var(--theme-color-primary-opposite));

        padding: var(--screen-padding);
        background-image: linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%),
                          linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%);
        background-color: var(--color-bg);
        background-position: top, bottom;
        background-size: 20px 1px;
        background-repeat: repeat-x;
    }

    .edit-area :global(*:not(.no-filter)) {
        filter: grayscale(100%);
    }
</style>
