<script>
    import { Br, NewsList } from '@components'
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList on:click={(e) => console.log(e.detail)}/>