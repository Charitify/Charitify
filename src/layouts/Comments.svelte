<script>
    import { onMount } from 'svelte'
    import { api } from '../services'
    import { Comment, Carousel, Form, Input, Button } from '../components'

    export let withForm = true

    let commentsGroup = []

    onMount(async () => {
        await new Promise(r => setTimeout(r, 1000))
        const comments = await api.getComments()
        commentsGroup = new Array(15).fill(comments).reduce((a, o) => a.concat([o]), [])
        console.log(commentsGroup)
    })
</script>

<section class="comments">
    <Carousel items={commentsGroup} let:item={comments}>
        <div class="comments-wrap">
            {#each comments as comment}
                <Comment
                        src={comment.avatar}
                        title={comment.author}
                        subtitle={new Date(comment.created_at).toLocaleString()}
                >
                    {comment.comment}
                </Comment>
                <br>
            {/each}
        </div>
    </Carousel>

    {#if withForm}
        <div class="comments-form">
            <Form>
                <Input type="textarea" rows="2"/>
            </Form>
            <div class="text-right">
                <Button type="submit" is="success" auto>
                    <span>Send</span>
                </Button>
            </div>
        </div>
    {/if}
</section>

<style>
    .comments {
        width: 100%;
        flex-grow: 1;
        display: flex;
        overflow-y: auto;
        overflow-x: hidden;
        align-self: stretch;
        flex-direction: column;
        box-shadow: inset var(--shadow-secondary-inset);
    }

    .comments-form {
        flex: none;
        padding: calc(var(--screen-padding) * 2) var(--screen-padding);
    }

    .comments-wrap {
        overflow: hidden;
        padding: var(--screen-padding);
    }

    span {
        padding: 0 3em;
    }
</style>
