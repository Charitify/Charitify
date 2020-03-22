<script>
    import Icon from '@components/Icon.svelte'

    export let is = 'danger'
    export let size = 'medium' // small|medium|mig
</script>

<ul class="rate">
    <li>
        <Icon {is} {size} type="heart-filled"/>
    </li>
    <li>
        <Icon {is} {size} type="heart-filled"/>
    </li>
    <li>
        <Icon {is} {size} type="heart-filled"/>
    </li>
    <li>
        <Icon {is} {size} type="heart-filled"/>
    </li>
    <li>
        <Icon {is} {size} type="heart-filled"/>
    </li>
</ul>

<style>
    .rate {
        display: inline-flex;
        margin: calc(var(--screen-padding) * -1 / 3);
    }

    li {
        padding: calc(var(--screen-padding) / 3);
    }

    .rate li {
        -webkit-filter: drop-shadow(-1px 2px 1px rgba(var(--color-black), .25));
        filter: drop-shadow(-1px 2px 1px rgba(var(--color-black), .25));
    }
</style>
