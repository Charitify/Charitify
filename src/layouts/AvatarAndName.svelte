<script>
    import { Avatar } from '../components'

    export let src = undefined
    export let title = undefined
    export let subTitle = undefined
</script>

<section class="ava-with-name">
    <Avatar src={src} alt={title}/>

    <span>
        <h5>{title}</h5>
        <h6>{subTitle}</h6>
    </span>
</section>

<style>
    .ava-with-name {
        width: 100%;
        flex-grow: 1;
        display: flex;
        align-self: stretch;
        align-items: center;
    }

    span {
        overflow: hidden;
        padding: 0 8px;
    }

    span h6 {
        font-weight: normal;
    }

    span h6,
    span h5 {
        max-width: 100%;
        line-height: 1.4;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
</style>
