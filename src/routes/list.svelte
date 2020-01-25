<script>
    import { SearchLine, ListItems } from '../layouts'
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>


<div class="container">

    <br>

    <div class="search">
        <SearchLine/>
    </div>

    <br>

    <ListItems amount="20"/>

    <br>
    <br>

</div>

<style>
    .search {
        position: sticky;
        top: 62px;
    }
</style>
