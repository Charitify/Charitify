<script>
    import { onMount } from 'svelte'
    import { classnames } from '@utils'
    import Icon from '@components/Icon.svelte'

    let activeDonateBtn = false

    onMount(() => setTimeout(() => activeDonateBtn = true, 500))

    $: classPropDonateBtn = classnames('donate-btn', { active: activeDonateBtn })

    function onDonate() {
        alert('Дякую! 🥰')
    }
</script>

<button type="button" class={classPropDonateBtn} on:click={onDonate}>
    <Icon type="coin" size="big" is="light"/>
    <s></s>
    <s></s>
    Допомогти
</button>

<style>
    .donate-btn {
        position: fixed;
        left: 0;
        bottom: env(safe-area-inset-bottom);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        font-weight: 600;
        font-size: 1.85em;
        line-height: 1.26;
        color: rgba(var(--color-white));
        padding: 20px;
        z-index: 9;
        touch-action: manipulation;
        text-align: center;
        transition: .3s ease-in-out;
        transform: translateY(100%);
        background-color: rgba(var(--color-success));
    }

    .donate-btn.active {
        transform: none
    }
</style>
