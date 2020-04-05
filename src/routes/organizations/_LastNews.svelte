<script>
    import { modals } from '@store'
    import { Br, NewsList, Modal } from '@components'
    import TopCarousel from './_TopCarousel.svelte'

    export let items = []
    export let carousel = []

    let modalActive = false

    function onClick(e) {
        modals.update(s => ({ ...s, ['modal-last-news']: { open: true, id: e.detail.item.id } }))
    }
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList {items} on:click={onClick}/>

<Modal id="last-news" size="full" let:props={props} swipe="left right" startPosition={{ x: 300, y: 0 }}>
    something {props.id}

    <Br/>

    <div class="container">
        <TopCarousel items={carousel}/>
    </div>
</Modal>