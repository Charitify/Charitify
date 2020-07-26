<script>
    import { Icon } from '@components'
    
    export let value = ''
    export let active = false
</script>

<section class:active={active} class="radius-big">
    <div>
        <span>
            <Icon type="check-flag" is="primary"/>    
        </span>
    </div>
    <h3>{value}</h3>
</section>

<style>
    section {
        display: flex;
        flex-direction: column;
        width: 100%;
        overflow: hidden;
        border: 3px solid transparent;
        background-color: rgba(var(--theme-input-bg-color));
    }

    section.active {
        border-color: rgba(var(--color-white));
    }

    section.active > div {
        visibility: visible;
    }

    div {
        visibility: hidden;
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
    }

    div span {
        display: flex;
        width: 50px;
        height: 50px;
    }

    h3 {
        flex: none;
        width: 100%;
        padding: 8px 5px 16px;
        text-align: center;
        font-weight: normal;
        color: rgba(var(--color-white));
        background-color: rgba(var(--color-black), .5);
    }
</style>
