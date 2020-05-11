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
    export let label = undefined
    export let align = undefined
    export let options = undefined
    export let invalid = undefined
    export let disabled = undefined
    export let required = undefined // undefined|required
    export let errors = undefined

    let group = undefined

    $: idProp = id || name
    $: error = invalid || !!(errors || []).length
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: classProp = classnames('radio-rect', $$props.class, { disabled, required, error })
</script>

<div class={classProp} style={styleProp}>
    {#if label}
        <h2 class="text-left">
            { label }
            <Br size="10"/>
        </h2>
    {/if}

    <ul style="margin: -5px" class="flex flex-wrap">
        {#each options as radio}
            <li style="padding: 5px">
                <Button htmlFor={idProp} is="info" auto style="padding: 10px">
                    <input 
                        {form}
                        hidden
                        type="radio" 
                        id={idProp}
                        bind:group={group}
                        value={radio.value}
                    >
                    {#if radio.preIcon}
                        <Icon type={radio.preIcon} size="medium" is="light"/>
                        <s></s>
                    {/if}
                    <slot item={radio}>
                        <span class="font-w-500 h3" style="min-width: var(--font-line-height-h3)">
                            {radio.label}
                        </span>
                    </slot>
                    {#if radio.postIcon}
                        <s></s>
                        <Icon type={radio.postIcon} size="medium" is="light"/>
                    {/if}
                </Button>
            </li>
        {/each}
    </ul>

</div>