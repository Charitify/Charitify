let lastScrollPosition = 0

export function disableScroll(el) {
    if (document.documentElement.classList.contains('body-scroll-lock')) {
        return
    }
    // lastScrollPosition = document.documentElement.scrollTop
    document.body.classList.add('body-scroll-lock')

    if (el) {
        el.ontouchstart = (e) => (e.preventDefault(), e.stopPropagation());
        el.ontouchmove = (e) => (e.preventDefault(), e.stopPropagation());
        el.ontouchend = (e) => (e.preventDefault(), e.stopPropagation());
    }
    // document.body.style.position = `relative`
    // document.body.style.top = `-${lastScrollPosition}px`
}

export function enableScroll(el) {
    document.body.classList.remove('body-scroll-lock')

    if (el) {
        el.ontouchstart = null;
        el.ontouchmove = null;
        el.ontouchend = null;
    }
//     // document.body.style.position = null
//     // document.body.style.top = null
//     // document.documentElement.scrollTop = lastScrollPosition
}