<script>
    import { Br, DonatorsList } from '@components'

    export let items
</script>

<h1>Наші піклувальники</h1>
<Br size="20"/>
<div class="full-container">
    <DonatorsList items={items}/>
</div>