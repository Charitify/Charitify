<script>
    import { onMount } from 'svelte'
    import { api } from '../services'
    import { Comment, Form, Input, Button, Icon } from '../components'

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
                        checked={comment.checked}
                >
                    {comment.comment}
                </Comment>
            </li>
        {/each}
    </ul>

    <br>
    <br class="small">

    <p class="h3 font-w-500 font-secondary underline text-center">All comments</p>

    {#if withForm}
        <br class="big">
        <div class="comments-form font-secondary h3">
            <Form class="flex" name="comment-form">
                <Input
                        type="textarea"
                        name="comment"
                        rows="1"
                        class="comment-field flex-self-stretch"
                        placeholder="Залиште свій коментар"
                />
            </Form>
            <div class="flex absolute" style="top: 0; right: 0; height: 100%; width: 50px">
                <Button type="submit" class="flex full-width flex-self-stretch flex-justify-start">
                    <Icon type="send" is="info" size="medium"/>
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
        padding: 15px;
    }

    .comments-form {
        position: relative;
        flex: none;
    }

    .comments-wrap {
        width: 100%;
        margin: -5px 0;
    }

    .comments-wrap li {
        width: 100%;
        padding: 5px 0;
    }
</style>
