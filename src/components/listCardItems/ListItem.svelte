<script>
    import Br from '../Br.svelte'
    import Icon from '../Icon.svelte'
    import Avatar from '../Avatar.svelte'
    import Progress from '../Progress.svelte'
    import { safeGet } from '@utils'

    export let item = {}
    export let basePath = ''
</script>

<a class="item container" href={`${basePath}/${item.id}`}>
    <div class="top">
        <Avatar src={safeGet(() => item.avatars[0].src)} size="medium" alt={item.title}/>

        <span class="title">
            <h3 class="text-ellipsis-multiline font-w-500" style="--max-lines: 2">
                {item.title || 'incognito'}
            </h3>
            <p class="text-ellipsis-multiline font-w-300" style="--max-lines: 2">
                {item.subtitle}
            </p>
        </span>
    </div>
    <Br/>
    <Progress value={item.current_sum / item.need_sum * 100}/>
    <Br/>
    <div class="bottom">
        <div class="flex flex-align-baseline">
            <span class="h2 font-secondary">{item.current_sum}{item.currency} /</span>
            <span class="h4 font-secondary">{item.need_sum}{item.currency}</span>
        </div>
        <span class="like" class:liked={item.is_liked}>
            <Icon is="danger" size="medium" type="heart"/>
        </span>
    </div>
</a>
    
<style>
    .item {
        display: block;
        flex: 1 1 auto;
        padding: 20px;
        box-shadow: var(--shadow-primary);
        border-radius: var(--border-radius-big);
        background-color: rgba(var(--theme-bg-color));
    }

    .item .top {
        display: flex;
    }

    .title {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        overflow: hidden;
        padding: 10px 0 5px 15px;
    }

    .title p {
        padding-top: 3px;
        color: rgba(var(--color-black), 0.7);
    }

    .bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 3px;
    }

    .bottom .like {
        opacity: .3;
    }

    .bottom .like.active {
        opacity: 1;
    }
</style>
