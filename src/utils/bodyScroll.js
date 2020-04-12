let lastScrollPosition = 0

export function disableScroll(el) {
    if (document.documentElement.classList.contains('body-scroll-lock')) {
        return
    }
    // lastScrollPosition = document.documentElement.scrollTop
    document.body.classList.add('body-scroll-lock')

    if (el && el.parentElement) {
        el.parentElement.ontouchstart = (e) => (e.preventDefault(), e.stopPropagation());
        el.parentElement.ontouchmove = (e) => (e.preventDefault(), e.stopPropagation());
        el.parentElement.ontouchend = (e) => (e.preventDefault(), e.stopPropagation());
    }
    // document.body.style.position = `relative`
    // document.body.style.top = `-${lastScrollPosition}px`
}

export function enableScroll(el) {
    document.body.classList.remove('body-scroll-lock')

    if (el && el.parentElement) {
        el.parentElement.ontouchstart = null;
        el.parentElement.ontouchmove = null;
        el.parentElement.ontouchend = null;
    }
//     // document.body.style.position = null
//     // document.body.style.top = null
//     // document.documentElement.scrollTop = lastScrollPosition
}