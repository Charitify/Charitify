<script>
    import { Br, NewsList} from '@components'

    export let items = []
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList {items} on:click={(e) => console.log(e.detail)}/>