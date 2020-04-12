let lastScrollPosition = 0

export function disableScroll(el) {
    if (document.documentElement.classList.contains('body-scroll-lock')) {
        return
    }
    document.body.classList.add('body-scroll-lock')

    document.body.ontouchstart = (e) => (e.preventDefault(), e.stopPropagation());
    document.body.ontouchmove = (e) => (console.log(e.touches[0].clientY), e.preventDefault(), e.stopPropagation());
    document.body.ontouchend = (e) => (e.preventDefault(), e.stopPropagation());
}

export function enableScroll(el) {
    document.body.classList.remove('body-scroll-lock')

    document.body.ontouchstart = null;
    document.body.ontouchmove = null;
    document.body.ontouchend = null;
}