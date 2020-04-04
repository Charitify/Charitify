<script>
    import { Br, FundCards } from '@components'

    export let title
    export let items = []
</script>

<h1>{title}</h1>
<Br size="5" />
<div class="full-container">
    <FundCards {items}/>
</div>