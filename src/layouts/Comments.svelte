<script>
    import { onMount } from 'svelte'
    import { api } from '../services'
    import { Comment, Form, Input, Button } from '../components'

    export let withForm = true

    let comments = []

    onMount(async () => {
        comments = await api.getComments()
    })
</script>

<section class="comments">
    <ul class="comments-wrap">
        {#each comments as comment}
            <li>
                <Comment
                        src={comment.avatar}
                        title={comment.author}
                        date={new Date(comment.created_at).toLocaleDateString()}
                        amount={comment.likes}
                >
                    {comment.comment}
                </Comment>
            </li>
        {/each}
    </ul>

    {#if withForm}
        <br class="big">
        <div class="comments-form">
            <Form>
                <Input type="textarea" rows="1" class="comment-field" placeholder="Leave your comment here"/>
            </Form>
<!--            <div class="text-right">-->
<!--                <Button type="submit" is="success" auto>-->
<!--                    <span>Send</span>-->
<!--                </Button>-->
<!--            </div>-->
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
    }

    .comments-form {
        flex: none;
    }

    .comments-wrap {
        width: 100%;
        overflow: hidden;
        margin: -5px 0;
    }

    .comments-wrap li {
        width: 100%;
        padding: 5px 0;
    }

    span {
        padding: 0 3em;
    }
</style>
