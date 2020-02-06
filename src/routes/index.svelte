<script>
    import {
        Footer,
        Comment,
        CharityCards,
        ContentHolder,
        TitleSubTitle,
        ListOfFeatures,
    } from '../layouts'
    import {
        Divider,
        Progress,
        Carousel,
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

<br>
<br>
<br>
<br>
<br>
<section class="container">

    <TitleSubTitle
            title="Charitify"
            subtitle="Charity application for helping those in need"
    />

    <br>
    <br>
    <br>
    <br>
    <br>

    <Carousel amount="2">
        <CharityCards amount="2" listName="Nearest to you:"/>
    </Carousel>

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

    <Carousel amount="4">
        <ul style="display: flex; flex-wrap: wrap; overflow: hidden">
            <li style="width: 50%">
                <Comment
                        src="https://placeimg.com/300/300/people"
                        title="Tina Kandelaki"
                        subtitle="ORG charity charitify"
                >
                    <pre>
                        I really hate this things.
                        It looks awful. Will never ever enter here.
                    </pre>
                </Comment>
                <br>
            </li>
            <li style="width: 50%">
                <Comment
                        src="https://placeimg.com/300/300/people"
                        title="Tinaramisimuss el-de-la Kandelakinuskas"
                        subtitle="ORG charity charitify"
                >
                    <pre>
                         👍
                    </pre>
                </Comment>
                <br>
            </li>
            <li style="width: 50%">
                <Comment
                        src="https://placeimg.com/300/300/people"
                        title="Tina Kandelaki"
                        subtitle="ORG charity charitify"
                >
                    <pre>
                        Like
                    </pre>
                </Comment>
                <br>
            </li>
            <li style="width: 50%">
                <Comment
                        src="https://placeimg.com/300/300/people"
                        title="Tina Kandelaki"
                        subtitle="Head of the organization with loooooooong-naaaaaamed charity"
                >
                     <pre>
                         Don't listen him, hi's wrong. I think this is a good idea and we should continue.
                         Anyway, I wish you lusk.
                    </pre>
                </Comment>
                <br>
            </li>
        </ul>
    </Carousel>

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
