<script>
    import { modals } from '@store'
    import { Br, NewsList, Modal } from '@components'

    export let items = []

    let modalActive = false

    function onClick(e) {
        modals.update(s => JSON.stringify({ ...JSON.parse(s), ['modal-last-news']: { open: true } }))
        console.log(e.detail)
    }
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList {items} on:click={onClick}/>

<Modal id="last-news">
    something
</Modal>