<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import { UploadBox } from './uploadFiles'
    import Br from '@components/Br.svelte'
    import FieldErrors from '@components/FieldErrors.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let style = {}
    export let round = true
    export let id = undefined
    export let value = undefined
    export let label = undefined
    export let align = 'center'
    export let invalid = undefined
    export let disabled = undefined
    export let required = undefined // undefined|required
    export let errors = undefined

    $: error = invalid || !!(errors || []).length
    $: styleProp = { width: '145px', ...style }
    $: classProp = classnames('avatar-upload', $$props.class, `text-${align}`,{ disabled, required, error })

    function onChange({ detail }) {
        dispatch('change', detail)
    }
</script>

<div {id} class={classProp}>
    {#if label}
        <h2 class="text-left">
            { label }
            <Br size="10"/>
        </h2>
    {/if}

    <section class="inline-flex flex-justify-center" style="padding: 10px 0">
        <UploadBox 
            {name}
            {round}
            src={value}
            style={styleProp}
            on:change={onChange} 
        />  
    </section>

    <div class="text-center">
        <FieldErrors items={errors}/>
    </div>
</div>
