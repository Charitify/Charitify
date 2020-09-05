<script>
    import { createEventDispatcher } from 'svelte'
    import { _, classnames } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import UploadBox from './UploadBox.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let id = undefined
    export let label = undefined
    export let value = undefined
    export let accept = undefined
    export let errors = undefined
    export let invalid = undefined
    export let multiple = undefined
    export let disabled = undefined
    export let infoIndex = [0]

    const BOX_AMOUNT = 4

    $: values = value || []
    $: error = invalid !== undefined ? invalid : !!(errors || []).length
    $: idProp = id || name
    $: itemsList = getCells(values)
    $: classProp = classnames('inp-upload-group', $$props.class, { error, disabled })

    function getCells(list) {
        const defaultList = new Array(BOX_AMOUNT - 1).fill(undefined)
        const listArr = [].concat(list || [])
        const biggerList = listArr.length > defaultList.length ? listArr : defaultList
        biggerList.push(undefined)
        return biggerList.map(((_, i) => listArr[i] || defaultList[i]))
    }

    function onChange(i, { detail: { e, value } }) {
        const val = [...values]
        val.splice(i, 0, ...value)
        values = val
        dispatch('change', { e, name, value: values })
    }

    function onRemove(i, e) {
        values = [...values.filter((_, ind) => ind !== i)]
        dispatch('change', { e, name, value: values })
    }
</script>

{#if label}
    <h2 class="text-left">{label}</h2>
    <Br size="10"/>
{/if}
<ul id={idProp} class={classProp}>
    {#each itemsList as item, i}
        <li class="relative">
            <UploadBox
                key={i}
                {accept}
                {invalid}
                {disabled}
                {multiple}
                name={`${name || ''}[${i}]`}
                src={(values[i] || {}).src || values[i]}
                errors={_.get(errors, i)}
                style={{ maxHeight: '160px' }}
                iconIs={infoIndex.includes(i) ? 'info' : undefined}
                on:change={onChange.bind(null, i)}
            />

            {#if values[i]}
                <button type="button" on:click={onRemove.bind(null, i)}>
                    <Icon size="big" type="close"/>    
                </button>
            {/if}
        </li>
    {/each}
</ul>

<style>
    ul {
        width: 100%;
        display: grid;
        grid-template: auto / .5fr .5fr;
        grid-gap: var(--screen-padding);
    }

    ul.disabled {
        opacity: .5;
        pointer-events: none;
    }

    button {
        position: absolute;
        top: 0;
        right: 0;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
    }
</style>
