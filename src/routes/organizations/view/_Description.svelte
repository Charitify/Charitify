<script>
    import { Br } from '@components'
    import { TopCarousel, DescriptionShort } from '../components'

    export let title = undefined
    export let text = undefined
    export let carouselTop = undefined
</script>

<TopCarousel items={carouselTop}/>
<Br size="60" />
<DescriptionShort {title} {text}/>

