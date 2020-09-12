<script>
    export let style = undefined
</script>  

<section {style} class={`square ${$$props.class || ''}`}>
    <div>
        <slot></slot>
    </div>
</section>

<style>
    section {
        position: relative;
        width: 100%;
        overflow: hidden;
        transform: translateZ(0);

        --proportion: 100%;
    }

    section:after {
        content: "";
        display: block;
        padding-top: var(--proportion);
    }

    div {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
    }
</style>
