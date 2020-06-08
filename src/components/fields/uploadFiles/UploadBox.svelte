<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Square from '@components/Square.svelte'
    import Picture from '@components/Picture.svelte'

    const dispatch = createEventDispatcher()

    export let id = undefined
    export let src = undefined
    export let name = undefined
    export let icon = undefined
    export let label = undefined
    export let value = undefined
    export let round = undefined
    export let style = undefined
    export let iconIs = undefined
    export let errors = undefined
    export let invalid = undefined
    export let multiple = undefined
    export let disabled = undefined
    export let accept = "image/png, image/jpeg"

    let validSrc

    $: error = invalid !== undefined ? invalid : !!(errors || []).length
    $: iconType = icon || 'upload'
    $: idProp = id || name
    $: setValidSrc(src)
    $: classProp = classnames('inp-upload', { error, disabled, preview: src })
    $: styleProp = toCSSString({ ...style, borderRadius: round ? '50%' : null })

    function setValidSrc(file) {
        try {
            if (typeof file === 'string') {
                validSrc = file
            } else if (file) {
                const f = Array.isArray(file) ? file[0] : file
                const reader = new FileReader();
                reader.onload = e => validSrc = e.target.result
                reader.readAsDataURL(f); // convert to base64 string
            } else if (!file) {
                validSrc = undefined
            }
        } catch(err) {
            console.log('UploadBox/getValidSrc error: ', err)
        }
    }
    
    function onChange(e) {
        const value = Array.from(e.target.files)
        if (!value || !value.length) return
        dispatch('change', { value, name, e })
    }
</script>

{#if label}
    <h2 class="text-left">{label}</h2>
    <Br size="10"/>
{/if}
<Square class={$$props.class} style={styleProp}>
    <input
        {name}
        {accept}
        {multiple}
        hidden 
        type="file" 
        id={idProp}
        bind:value
        on:change={onChange}
    >
    <label for={idProp} class={classProp}>
        <div class="flex full-absolute">
            <Picture src={validSrc} alt="Завантажене фото"/> 
        </div>
        <div class="icon flex relative" style="flex: 0 0 75px">
            <Icon type={iconType} is={iconIs}/>
        </div>
    </label>
</Square>

<style>
    .inp-upload {
        width: 100%;
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

    .inp-upload.preview .icon {
        opacity: .5;
    }

    .inp-upload .icon {
        opacity: .7;
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
