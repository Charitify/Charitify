<script>
    import { _, classnames } from '@utils'
    import Br from '@components/Br.svelte'
    import UploadBox from './UploadBox.svelte'

    export let name
    export let id = undefined
    export let label = undefined
    export let value = undefined
    export let items = undefined
    export let accept = undefined
    export let errors = undefined
    export let invalid = undefined
    export let disabled = undefined

    function getCells(list) {
        const defaultList = new Array(4).fill(undefined)
        const listArr = [].concat(list || [])
        const biggerList = listArr.length > defaultList.length ? listArr : defaultList
        return biggerList.map(((_, i) => listArr[i] || defaultList[i]))
    }

    $: error = invalid !== undefined ? invalid : !!(errors || []).length
    $: idProp = id || name
    $: itemsList = getCells(items)
    $: classProp = classnames('inp-upload-group', $$props.class, { error, disabled })
</script>

{#if label}
    <h2 class="text-left">{label}</h2>
    <Br size="10"/>
{/if}
<ul id={idProp} class={classProp}>
    {#each itemsList as item, i}
        <li>
            <UploadBox
                {accept}
                {invalid}
                {disabled}
                src={item}
                name={`${name || ''}[${i}]`}
                errors={_.get(errors, i)}
                bind:value
                on:change 
            />
        </li>
    {/each}
</ul>

<style>
    ul {
        width: 100%;
        display: grid;
        grid-template: auto / .5fr .5fr;
        grid-gap: 20px;
    }
</style>