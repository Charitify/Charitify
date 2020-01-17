<script>
    import {
        Carousel,
        CharityCards,
        ContentHolder,
        TitleSubTitle,
        AvatarAndName,
    } from '../layouts'
    import {
        Br,
        Divider,
        Progress,
    } from '../components'
</script>

<style>
    .top-pic {
        flex: none;
        z-index: 0;
        width: 100%;
        height: 200px;
        display: flex;
        overflow: hidden;
        border-radius: 0;
    }
</style>

<svelte:head>
    <title>Charitify - list of charities you can donate.</title>
</svelte:head>

<div class="top-pic">
    <Carousel/>
</div>

<Progress borderRadius="0 0 8px 8px" value="30"/>

<p>These guys rise a pound of vegetables. They like vegetables and long text under photos.</p>

<Br amount="5"/>

<TitleSubTitle/>

<Br amount="5"/>

<section class="container">
    <CharityCards amount="2"/>
</section>

<Br amount="5"/>

<ContentHolder/>

<Br amount="5"/>

<section class="container">
    <ul style="display: flex; flex-wrap: wrap">
        <li style="width: 50%">
            <AvatarAndName
                    src="https://placeimg.com/300/300/people"
                    title="Tina Kandelaki"
                    subtitle="ORG charity charitify"
            />
            <br>
        </li>
        <li style="width: 50%">
            <AvatarAndName
                    src="https://placeimg.com/300/300/people"
                    title="Tina Kandelaki"
                    subtitle="ORG charity charitify"
            />
            <br>
        </li>
        <li style="width: 50%">
            <AvatarAndName
                    src="https://placeimg.com/300/300/people"
                    title="Tina Kandelaki"
                    subtitle="ORG charity charitify"
            />
            <br>
        </li>
        <li style="width: 50%">
            <AvatarAndName
                    src="https://placeimg.com/300/300/people"
                    title="Tina Kandelaki"
                    subtitle="ORG charity charitify"
            />
            <br>
        </li>
    </ul>
</section>

<Br amount="5"/>

<section class="container">
    <CharityCards amount="2"/>
</section>

<Br amount="5"/>
