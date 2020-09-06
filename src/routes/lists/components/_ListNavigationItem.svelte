<script>
    import { Icon } from '@components'
    
    export let value = ''
    export let active = false
</script>

<section class:active={active} class="radius-big">
    <h3>{value}</h3>
</section>

<style>
    section {
        display: flex;
        flex-direction: row;
        width: 100%;
        overflow: hidden;
        border: 3px solid rgba(var(--theme-color-primary));
        background-color: rgba(var(--color-black), .4);
    }

    section.active {
        border-color: rgba(var(--color-info));
    }

    section.active h3 {
        opacity: 1;
    }
    
    h3 {
        opacity: .5;
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-weight: normal;
        color: rgba(var(--color-white));
    }
</style>
