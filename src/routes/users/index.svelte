<script>
    import { onMount } from 'svelte'
    import { API } from '@services'

    let users

    onMount(async () => {
        users = await API.getUsers()
    })

    $: console.log(users)
</script>

<section>
    <br>
    <br>
    <br>
    ADMIN "{ users }"
    <br>
    <br>
    <br>
</section>

<style>

</style>
