<script>
    import { createEventDispatcher } from 'svelte'
    import { onMount } from 'svelte'
    import { API, Dates } from '@services'
    
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Button from '@components/Button.svelte'
    import NewsItem from './NewsItem.svelte'

    const dispatch = createEventDispatcher()
   
   /**
    * @type {{
    *   id: string,
    *   src: string,
    *   likes: number,
    *   title: string,
    *   subtitle: string,
    *   created_at: string,
    * }}
    */
    export let items = new Array(3).fill({ title: null, subtitle: null, created_at: null, likes: null })
</script>

<section class="news-list">
    <ul class="news-list-wrap">
        {#each items as item, index}
            <li role="button" on:click={() => dispatch('click', { item, index })} key={item.id}>
                <NewsItem
                        src={item.src}
                        title={item.title}
                        likes={item.likes}
                        isLiked={item.isLiked}
                        subtitle={item.subtitle}
                        date={item.created_at === null ? null : Dates(item.created_at).fromNow()}
                />

                <span class="arrow">
                    <Icon type="arrow-right" size="small"/>
                </span>
            </li>
        {/each}
    </ul>

    <Br size="20"/>  

    <p class="h3 font-w-500 font-secondary underline text-center">
        <span>Всі новини</span>
        <Icon type="caret-down" size="small"/>
    </p>
</section>

<style>
    .news-list {
        width: 100%;
        flex-grow: 1;
        display: flex;
        overflow-y: auto;
        overflow-x: hidden;
        align-self: stretch;
        flex-direction: column;
    }

    .news-list-wrap {
        width: 100%;
        margin: -5px 0;
    }

    .news-list-wrap li {
        position: relative;
        width: 100%;
        padding: 5px 0;
    }

    .arrow {
        position: absolute;
        top: 8px;
        right: 15px;
        color: rgba(var(--color-info));
    }
</style>
