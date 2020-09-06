<script>
    import ListNavigationItem from './_ListNavigationItem.svelte'

    export let enabled = false
</script>

<section style={$$props.style} class="font-secondary">
    <button type="button" on:click={() => enabled = false} class:active={!enabled}>
        Усі
    </button>
    <button type="button" on:click={() => enabled = true} class:active={enabled}>
        Лише мої
    </button>
</section>

<style>
    section {
        display: flex;
        height: 40px;
        overflow: hidden;
        border-radius: 9999px;
        background-color: rgba(var(--theme-color-primary));
    }

    button {
        flex: 1 0 0;
        opacity: .7;
        border-radius: 9999px;
        color: rgba(var(--theme-font-color));
        background-color: rgba(var(--theme-color-primary));
    }

    button.active {
        opacity: 1;
        color: rgba(var(--theme-font-color-opposite));
        background-color: rgba(var(--color-info));
    }
</style>
