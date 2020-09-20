<script>
    import { stores } from '@sapper/app'
    import { onMount } from 'svelte'
    import { API } from '@services'

    const { page } = stores()

    let userId = $page.params.id

    let user

    onMount(async () => {
        user = await API.getUser(userId)
    })

    $: console.log(user)
</script>

<section>
    <br>
    <br>
    <br>
        ADMIN "{ userId }"
    <br>
    <br>
    <br>
</section>

<style>

</style>
