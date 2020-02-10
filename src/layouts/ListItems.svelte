<script>
    import AvatarAndName from './AvatarAndName.svelte'

    export let items = []
    export let basePath = ''
</script>

{#each items as item}
    <a class="item container" href={`${basePath}/${item.id}`}>
        <br>
        <AvatarAndName
                src={item.org_head_avatar}
                title={item.org_head}
                subtitle={item.organization}
        />
        <br>
    </a>
    <br>
{:else}
    <section class="item container">
        <p class="text-center">No organizations</p>
    </section>
{/each}

<style>
    .item {
        display: block;
        flex: 1 1 auto;
        box-shadow: var(--shadow-primary);
        border-radius: var(--border-radius);
        background-color: rgba(var(--theme-bg-color));
    }
</style>
