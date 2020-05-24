<script>
    import { Br } from '@components'
    import { VirtualTour, WeOnMap } from '../components'

    export let location
</script>

<VirtualTour src={location.virtual_tour}/>
<Br size="60" />
<WeOnMap src={location.map}/>

