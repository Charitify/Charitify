<script>
    import AvatarAndName from './AvatarAndName.svelte'

    export let items = []
</script>

{#each items as item}
    <section class="item container">
        <br>
        <AvatarAndName
                src={item.orgHeadSrc}
                title={item.orgHead}
                subtitle={item.organization}
        />
        <br>
    </section>
    <br>
{:else}
    <section class="item container">
        <p class="text-center">No organizations</p>
    </section>
{/each}

<style>
    .item {
        flex: 1 1 auto;
        box-shadow: var(--shadow-primary);
        border-radius: var(--border-radius);
        background-color: rgba(var(--theme-bg-color));
    }
</style>
