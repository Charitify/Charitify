<script>
    import { Picture, Rate, Progress, Avatar } from '../components'
    import { Swipe, SwipeItem } from '../plugins'

    export let src = undefined
    export let title = undefined
    export let percent = undefined
    export let orgHead = undefined
    export let orgHeadSrc = undefined
    export let organization = undefined
</script>

<div class="card">

    <div class="images">
        <Swipe>
            <SwipeItem>
                <Picture {src} alt={title}/>
            </SwipeItem>
            <SwipeItem>
                <Picture {src} alt={title}/>
            </SwipeItem>
            <SwipeItem>
                <Picture {src} alt={title}/>
            </SwipeItem>
            <SwipeItem>
                <Picture {src} alt={title}/>
            </SwipeItem>
            <SwipeItem>
                <Picture {src} alt={title}/>
            </SwipeItem>
        </Swipe>
    </div>

    <Progress value={percent} borderRadius="0 0"/>

    <h5>{title}</h5>

    <p class="text-center" style="padding-top: var(--screen-padding)">
        <Rate size="small"/>
    </p>

    <footer class="ava-section">
        <Avatar src={orgHeadSrc} alt="avatar"/>

        <span>
            <h3>{orgHead}</h3>
            <p>{organization}</p>
        </span>
    </footer>
</div>

<style>
    .card {
        display: flex;
        flex-direction: column;
        flex: none;
        max-width: 100%;
    }

    .images {
        width: 100%;
        height: 100px;
        overflow: hidden;
        box-shadow: var(--shadow-primary);
        border-radius: var(--border-radius);
    }

    h5 {
        --card-line-height: 1.4;

        line-height: var(--card-line-height);
        height: calc(var(--font-size) * (var(--card-line-height) / 1.2) * 2);
        overflow: hidden;
    }

    .ava-section {
        display: flex;
        align-items: center;
    }

    .ava-section span {
        overflow: hidden;
        font-size: .7rem;
        padding: 0 var(--screen-padding);
    }

    .ava-section span p {
        font-size: .6rem;
    }

    .ava-section span p,
    .ava-section span h3 {
        max-width: 100%;
        line-height: 1.4;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
</style>
