<script>
    import { Br } from '@components'
    import {
        TopCarousel,
        QuickInfoCard,
        OrganizationButton,
    } from '../components'

    export let cardTop
    export let carouselTop
    export let organization
</script>

<TopCarousel items={carouselTop}/>
<Br size="40"/>

<OrganizationButton id={organization.id} src={organization.avatar} title={organization.name}/>
<Br size="20"/>

<QuickInfoCard {cardTop}/>