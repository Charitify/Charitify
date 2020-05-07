<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'
    import Icon from '@components/Icon.svelte'

    const dispatch = createEventDispatcher()

    export let isActive = null
    export let onAsyncClick = null

    let isActiveLocal = !!isActive

    $: isActiveState = isActive === null ? isActiveLocal : isActive
    $: classProp = classnames('trust-btn', $$props.class, { isActive: isActiveState })

    function onClickHandler(e) {
        onClickEvent(e)
        onClickPromise(e)
    }

    function onClickEvent(e) {
        dispatch('click', e)
    }

    const onClickPromise = async (e) => {
        if (typeof onAsyncClick === 'function') {
            try {
                isActiveLocal = !isActiveLocal
                await onAsyncClick(e)
            } catch (err) {
                isActiveLocal = !isActiveLocal
            }
        }
    }
</script>

<button type="button" title="I trust" class={classProp} on:click={onClickHandler}>
    <div class="full-absolute">
        <span>
            <Icon type="heart" is={isActive ? 'light' : 'danger'}/>
        </span>
    </div>
</button>

<style>
    .trust-btn {
        position: relative;
        display: block;
        width: 100%;
        height: 0;
        padding-bottom: 100%;
        border-radius: 50%;
        overflow: hidden;
    }

    div {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 4px solid rgba(var(--color-danger));
        background-color: rgba(var(--color-danger), .2);
    }

    .trust-btn.isActive div {
        background-color: rgba(var(--color-danger), 1);
    }

    .trust-btn.isActive span {
        color: rgba(var(--color-white));
        animation: none;
        transform: scale(1.1)
    }

    span {
        display: flex;
        width: 50%;
        height: 50%;
        margin-top: 3px;
        max-width: calc(100% - 10px);
        max-height: calc(100% - 10px);
        color: rgba(var(--color-danger));
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        10% {
            transform: scale(1.1)
        }
        20% {
            transform: scale(1.05)
        }
        30% {
            transform: scale(1.15)
        }
    }
</style>
