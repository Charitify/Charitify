<script>
  import { createEventDispatcher } from 'svelte'
  import { fly } from "svelte/transition";
  import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
  import { safeGet, classnames } from "@utils";
  import { modals } from "@store";
  import Portal from "./Portal.svelte";

  const dispatch = createEventDispatcher()

  export let id
  export let open = null

  let active
  $: active = safeGet(() => open || JSON.parse($modals)[`modal-${id}`].open, null)
  $: classProp = classnames('modal', { active })
  $: onActiveChange(active)

  function onBgClick() {
       modals.update(s => JSON.stringify({ ...JSON.parse(s), [`modal-${id}`]: { open: false } }))
  }

  function onActiveChange(active) {
      if (active) {
          dispatch('open')
          disableBodyScroll()
      } else {
          dispatch('close')
          enableBodyScroll()
      }
  }
</script>

{#if active !== null}
    <Portal>
        <div 
            id={`modal-${id}`} 
            aria-hidden="true" 
            class={classProp}
            in:fly="{{ y: 20, duration: 200 }}"
            on:click={onBgClick}
        >
            <div
                class="modal-inner"
                tabindex="-1"
                role="dialog"
                aria-modal="true"
                aria-labelledby="модальне вікно"
            >
                <slot props={safeGet(() => JSON.parse($modals)[`modal-${id}`], {}, true)}/>
            </div>
        </div>
    </Portal>
{/if}

<style>
    .modal {
        z-index: 10;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        overflow: hidden;
        align-items: stretch;
        justify-content: center;
        flex-direction: column;
        touch-action: manipulation;
        background-color: rgba(var(--color-black), .75);
        outline: 20px solid rgba(var(--color-black), .75);
        transition: .3s ease-out;
        opacity: 0;
        padding: 0 var(--screen-padding);
        transform: translate3d(0,0,0);
        pointer-events: none;
    }

    .modal.active {
        opacity: 1;
        transform: translate3d(0,0,0);
        pointer-events: auto;
    }

    .modal-inner {
        width: 100%;
        height: 300px;
        background-color: rgba(var(--theme-color-primary))
    }
</style>   