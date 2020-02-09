<script>
    import { Avatar } from '../components'

    export let src = undefined
    export let title = undefined
    export let subtitle = undefined
</script>

<section>
    <Avatar src={src} alt={title} class="comment-ava"/>

    <div>
        <span>
            <h4>{title}</h4>
            <sub>{subtitle}</sub>
        </span>

        <br class="small">

        <slot>
            <pre>
                A loooooooooong comment that has been
                left by a very angry guy who complains upon
                looooong comments.
            </pre>
        </slot>
    </div>
</section>

<style>
    section {
        width: 100%;
        flex-grow: 1;
        display: flex;
        align-self: stretch;
        align-items: flex-start;
    }

    div {
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }


    span {
        flex: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        padding: 0 8px;
    }

    span h4,
    span sub {
        line-height: 1.4;
        max-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    pre {
        padding: 0 8px;
        font-size: .825em;
        line-height: 1.2;
    }
</style>
