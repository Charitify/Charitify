<script>
    import { Icon } from '@components'

    export let likes = 0
    export let views = 0
</script>

<p class="container flex flex-justify-between flex-align-center">
    <span class="flex flex-align-center">
        <Icon is="danger" type="heart-filled" size="medium"/>
        <s></s>
        <s></s>
        <span class="font-secondary font-w-600 h3">{likes}</span>
    </span>
    <span class="flex flex-align-center">
        <Icon type="eye" size="medium" class="theme-svg-fill"/>
        <s></s>
        <s></s>
        <span class="font-secondary font-w-600 h3">{views}</span>
    </span>
</p>