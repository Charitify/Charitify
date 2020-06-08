<script>
    import { Br } from '@components'
    import { classnames } from '@utils'
    import { VirtualTour, WeOnMap } from '../components'

    export let location
    export let preview
</script>

<style>
    .preview :global(.full-container) {
        height: 200px;
        width: 100%;
        margin: 0;
        border-radius: var(--border-radius-big);
        overflow: hidden;
        transform: translateZ(0);
    }

    .preview :global(iframe) {
        height: 100% !important;
    }
</style>

<section class={classnames({ preview })}>
    <VirtualTour src={location.virtual_tour}/>
    <Br size={preview ? 20 : 60} />
    <WeOnMap src={location.map}/>
</section>
