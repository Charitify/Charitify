<script>
    import Avatar from '@components/Avatar.svelte'

    export let src = undefined
    export let title = 'incognito'
    export let subtitle = ''
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
        overflow: hidden;
    }

    span {
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
</style>
