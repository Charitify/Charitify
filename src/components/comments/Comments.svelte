<script>
    import { onMount } from 'svelte'
    import { API } from '@services'

    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Form from '@components/Form.svelte'
    import Input from '@components/fields/Input.svelte'
    import Button from '@components/Button.svelte'
    import Comment from './Comment.svelte'

    export let withForm = true

    let comments = []

    onMount(async () => {
        comments = await API.getComments()
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

    <Br size="20"/>  

    <p class="h3 font-w-500 font-secondary underline text-center">
        <span>All comments</span>
        <span class="font-w-600">⋁</span>
    </p>

    {#if withForm}
        <Br size="40"/>  
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
