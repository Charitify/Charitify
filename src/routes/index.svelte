<script>
    import {
        Br,
        Footer,
        Divider,
        Comments,
        Progress,
        Carousel,
        ContentHolder,
        TitleSubTitle,
        ListOfFeatures,
    } from '@components'
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

<section>
    <Br size="var(--header-height)"/>

    <div class="top-pic">
        <Carousel/>
    </div>

    <Progress borderRadius="0 0 8px 8px" value="30"/>

    <p>These guys rise a pound of vegetables. They like vegetables and long text under photos.</p>

    <br>
    <br>
    <br>
    <br>
    <br>
    <section class="container">

        <TitleSubTitle
                title="Charitify built and deployed from Master"
                subtitle="Charity application for helping those in need"
        />

        <br>
        <br>
        <br>
        <br>
        <br>

        <ContentHolder/>

        <br>
        <br>
        <br>
        <br>
        <br>

        <Divider size="16"/>
        <h3 class="h2 text-right">Comments:</h3>
        <Divider size="20"/>

        <Comments withFrom={false}/>

            <br>
            <br>
            <br>
            <br>
            <br>

            <ContentHolder/>

            <br>
            <br>
            <br>
            <br>
            <br>

            <ListOfFeatures/>
    </section>

    <br>
    <br>
    <br>
    <br>
    <br>

    <Footer/>

</section>
