<script>
    import { onMount } from 'svelte'
    import { classnames } from '@utils'
    import Icon from '@components/Icon.svelte'

    export let is = 'success'

    let activeDonateBtn = false

    onMount(() => setTimeout(() => activeDonateBtn = true, 500))

    $: classPropDonateBtn = classnames('donate-btn', is, { active: activeDonateBtn })
</script>

<button type="button" class={classPropDonateBtn} on:click>
    <slot>
        <span>
            <Icon type="coin" size="medium" is="primary"/>
        </span>
        <s></s>
        <s></s>
        Допомогти
    </slot>
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
        padding: 20px;
        z-index: 9;
        touch-action: manipulation;
        text-align: center;
        transition: .3s ease-in-out;
        transform: translateY(100%);
    }

    .donate-btn.success {
        color: rgba(var(--color-white));
        background-color: rgba(var(--color-success));
    }

    .donate-btn.info {
        color: rgba(var(--color-white));
        background-color: rgba(var(--color-info));
    }

    span {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        width: 32px;
        border-radius: 50%;
        overflow: hidden;
        background-color: rgba(var(--color-white));
    }

    .donate-btn.active {
        transform: none
    }
</style>
