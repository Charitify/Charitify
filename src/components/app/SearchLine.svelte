<script>
    import Input from '@components/fields/Input.svelte'

    export let value = null
</script>

<section class="search">
    <Input type="search" name="search" value={value || ''}/>
</section>

<style>
    .search {

    }
</style>
