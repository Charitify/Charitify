<script>
    import Icon from './Icon.svelte'

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
        display: flex;
        margin: calc(var(--screen-padding) * -1 / 3);
    }

    li {
        padding: calc(var(--screen-padding) / 3);
    }
</style>
