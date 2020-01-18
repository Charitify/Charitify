<script>
    import { Avatar } from '../components'

    export let src = undefined
    export let title = undefined
    export let subtitle = undefined
</script>

<section>
    <Avatar src={src} alt={title}/>

    <span>
        <h4>{title}</h4>
        <sub>{subtitle}</sub>
    </span>
</section>

<style>
    section {
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

    span h4,
    span sub {
        line-height: 1.2;
        max-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
</style>
