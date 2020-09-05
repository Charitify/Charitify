<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Button from '@components/Button.svelte'
    import FieldErrors from '@components/FieldErrors.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let style = {}
    export let id = undefined
    export let form = undefined // Specifies the form the <input> element belongs to
    export let value = undefined
    export let label = undefined
    export let align = undefined
    export let options = undefined
    export let invalid = undefined
    export let disabled = undefined
    export let required = undefined // undefined|required
    export let errors = undefined

    $: idProp = id || name
    $: error = invalid || !!(errors || []).length
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: classProp = classnames('radio-rect', $$props.class, { disabled, required, error })

    function onChange(val, e) {
        dispatch('change', { e, name, value: val })
    }
</script>

<div id={idProp} class={classProp} style={styleProp}>
    {#if label}
        <h2 class="text-left">
            { label }
            <Br size="10"/>
        </h2>
    {/if}

    <ul style="margin: -5px" class="flex flex-wrap">
        {#each options as radio, i}
            <li style="padding: 5px">
                <Button
                    auto
                    htmlFor={`${idProp}_${i}`}
                    is={value === radio.value ? 'info' : 'info-border'}
                >
                    <input 
                        {form}
                        hidden
                        type="checkbox" 
                        id={`${idProp}_${i}`}
                        value={radio.value}
                        on:change={onChange.bind(null, radio.value)}
                    >
                    <slot item={radio} checked={value === radio.value}>
                        <p class="flex flex-align-center" style="padding: 10px 20px">
                            {#if radio.preIcon}
                                <Icon type={radio.preIcon} size="medium" is={value === radio.value ? 'light' : 'info'}/>
                                <s></s>
                            {/if}
                            <span class="font-w-500 h3 flex flex-align-center flex-justify-center">
                                {radio.label}
                            </span>
                            {#if radio.postIcon}
                                <s></s>
                                <Icon type={radio.postIcon} size="medium" is={value === radio.value ? 'light' : 'info'}/>
                            {/if}
                        </p>
                    </slot>
                </Button>
            </li>
        {/each}
    </ul>

</div>
