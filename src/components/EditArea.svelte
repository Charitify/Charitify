<script>

</script>

<section class="edit-area">
    <slot></slot>
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
