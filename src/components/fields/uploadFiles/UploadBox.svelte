<script>
    import { classnames } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Square from '@components/Square.svelte'
    import Picture from '@components/Picture.svelte'

    export let id = undefined
    export let src = undefined
    export let name = undefined
    export let icon = undefined
    export let label = undefined
    export let value = undefined
    export let errors = undefined
    export let invalid = undefined
    export let disabled = undefined
    export let accept = "image/png, image/jpeg"

    $: error = invalid !== undefined ? invalid : !!(errors || []).length
    $: iconType = icon || 'upload'
    $: idProp = id || name
    $: classProp = classnames('inp-upload', { error, disabled })
</script>

{#if label}
    <h2 class="text-left">{label}</h2>
    <Br size="10"/>
{/if}
<Square class={$$props.class}>
    <input
        {name}
        {accept}
        hidden 
        type="file" 
        id={idProp}
        bind:value
        on:change
    >
    <label for={idProp} class={classProp}>
        <div class="flex full-absolute">
            <Picture {src}/> 
        </div>
        <div class="flex" style="flex: 0 0 75px">
            <Icon type={iconType}/>
        </div>
    </label>
</Square>

<style>
    .inp-upload {
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: stretch;
        justify-self: stretch;
        overflow: hidden;
        border-radius: var(--border-radius-medium);
        color: rgba(var(--theme-color-primary-opposite), .5);
        background-color: rgba(var(--theme-color-primary-opposite), .07);
        transform: translateZ(0);
    }

    .inp-upload.disabled {
        opacity: .5;
        pointer-events: none;
    }

    .inp-upload.error,
    input:invalid + .inp-upload {
        color: rgba(var(--color-danger), .5);
        background-color: rgba(var(--color-danger), .07);
    }

    input:focus + .inp-upload {
        color: rgba(var(--color-info), .5);
        background-color: rgba(var(--color-info), .07);
    }
</style>