<script>
    import { createEventDispatcher } from 'svelte'

    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Form from '@components/Form.svelte'
    import Input from '@components/fields/Input.svelte'
    import Button from '@components/Button.svelte'
    import Loader from '@components/loader'
    import Comment from './Comment.svelte'

    const dispatch = createEventDispatcher()

    /**
     * 
     * @event: submit - submit values of a new comment 
     * 
     */
    
    /**
     * @type {boolean}
     */
    export let withForm = true

    /**
     * @type {{
     *      likes: number,
     *      avatar: string,
     *      author: string,
     *      comment: string,
     *      checked: boolean,
     *      created_at: string,
     * }}
     */
    export let items = new Array(4).fill({ comment: null })
</script>

<section class="comments">
    <ul class="comments-wrap">
        {#each items as comment}
            <li>
                <Comment
                        src={comment.avatar}
                        title={comment.author}
                        date={comment.created_at && new Date(comment.created_at).toLocaleDateString()}
                        amount={comment.likes}
                        checked={comment.checked}
                >
                    {#if comment.comment !== null}
                        {comment.comment}
                    {:else}
                        <Loader type="h4"/>
                        <Loader type="h4"/>
                    {/if}
                </Comment>
            </li>
        {/each}
    </ul>

    <Br size="20"/>  

    <p class="h3 font-w-500 font-secondary underline text-center">
        <span>Всі коментарі</span>
        <Icon type="caret-down" size="small"/>
    </p>

    {#if withForm}
        <Br size="40"/>  
        <div class="comments-form font-secondary h3">
            <Form class="flex" name="comment-form" on:submit={values => dispatch('sumbit', values)}>
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
