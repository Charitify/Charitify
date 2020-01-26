<script>
    import AvatarAndName from './AvatarAndName.svelte'

    export let amount = 1

    $: listArr = [...(new Array(Number.isFinite(+amount) ? +amount : 1))]
</script>

{#each listArr as item}
    <section class="item container">
        <br>
        <AvatarAndName
                src="https://placeimg.com/300/300/people"
                title="Tina Kandelaki"
                subtitle="ORG charity charitify"
        />
        <br>
    </section>
    <br>
{/each}

<style>
    .item {
        box-shadow: var(--shadow-primary);
        border-radius: var(--border-radius);
        background-color: rgba(var(--theme-bg-color));
    }
</style>
