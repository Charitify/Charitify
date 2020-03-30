<script>
    import { TrustButton, Br } from '@components'

    // Trust button
    let active = false
    async function onClick() {
        active = !active
    }
</script>

<section class="flex flex-column flex-align-center flex-justify-center">
    <div style="width: 100px; max-width: 100%">
        <TrustButton isActive={active} on:click={onClick}/>
    </div>
    <Br size="10"/>
    <h2>Я довіряю</h2>
</section>