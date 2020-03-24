<script>
    import { createEventDispatcher } from 'svelte'
    import { onMount } from 'svelte'
    import { API, Dates } from '@services'
    
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Button from '@components/Button.svelte'
    import NewsItem from './NewsItem.svelte'

    const dispatch = createEventDispatcher()
   
    let comments = []

    $: console.log(comments)

    onMount(async () => {
        comments = await API.getComments()
    })
</script>

<section class="news-list">
    <ul class="news-list-wrap">
        {#each comments as comment, index}
            <li role="button" on:click={() => dispatch('click', { item: comment, index })}>
                <NewsItem
                        src={comment.avatar}
                        title={comment.author}
                        subtitle={comment.author}
                        date={Dates(comment.created_at).fromNow()}
                        amount={comment.likes}
                />

                <span class="arrow h2">→</span>
            </li>
        {/each}
    </ul>

    <Br size="20"/>  

    <p class="h3 font-w-500 font-secondary underline text-center">
        <span>All comments</span>
        <span class="font-w-600">⋁</span>
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
