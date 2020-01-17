<script>
    export let amount = 1

    $: brArr = new Array(Number.isFinite(+amount) ? +amount : 1).fill(null)
</script>

{#each brArr as _i}
    <br/>
{/each}

<style>

</style>
