<script>
    import Br from '../Br.svelte'
    import Icon from '../Icon.svelte'
    import Avatar from '../Avatar.svelte'
    import Progress from '../Progress.svelte'

    /**
     * {
     *   src: string,    
     *   title: string,    
     *   subtitle: string,    
     *   progress: number,    
     *   liked: boolean,
     * }
     */
    export let item = {}
</script>

<section class="item container">
    <div class="top">
        <Avatar src={item.src} size="medium" alt={item.title}/>

        <span class="title">
            <h3 class="text-ellipsis-multiline font-w-500" style="--max-lines: 2">
                {item.title || 'incognito'}
            </h3>
            <p class="text-ellipsis-multiline font-w-300" style="--max-lines: 2">
                {item.subtitle || ''}
            </p>
        </span>
    </div>
    <Br/>
    <Progress value={item.progress}/>
    <Br/>
    <div class="bottom">
        <slot name="bottom-left"></slot>
        <span class="like" class:active={item.liked}>
            <Icon is="danger" size="medium" type="heart"/>
        </span>
    </div>
</section>
    
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
        color: rgba(var(--theme-font-color), 0.7);
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
