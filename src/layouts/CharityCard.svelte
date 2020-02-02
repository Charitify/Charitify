<script>
    import { Rate, Progress, Avatar } from '../components'
    import Carousel from './Carousel.svelte'
    import AvatarAndName from './AvatarAndName.svelte'

    export let src = undefined
    export let title = undefined
    export let percent = undefined
    export let orgHead = undefined
    export let orgHeadSrc = undefined
    export let organization = undefined
</script>

<section class="card">
    <div class="images-wrap">
        <Carousel images={[src, src, src]}/>
    </div>

    <Progress value={percent} borderRadius="0 0"/>

    <h4>{title}</h4>

    <div class="rate-wrap">
        <Rate size="small"/>
    </div>

    <footer>
        <AvatarAndName src={orgHeadSrc} title={orgHead} subtitle={organization}/>
    </footer>
</section>

<style>
    .card {
        display: flex;
        flex-direction: column;
        flex: none;
        width: 100%;
        max-width: 100%;
    }

    .rate-wrap {
        text-align: center;
        padding-top: 6px;
    }

    .images-wrap {
        display: flex;
        height: 100px;
    }

    h4 {
        --card-line-height: 1.4;

        font-size: .8em;
        line-height: var(--card-line-height);
        height: calc(var(--font-size) * (var(--card-line-height) / 1.2) * 2);
        overflow: hidden;
    }
</style>
