<script>
    export let size = 1
</script>

{#each Array.from({ length: +size }) as _}
    &nbsp;
{/each}

<style>
</style>
