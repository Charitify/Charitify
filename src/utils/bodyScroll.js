let lastScrollPosition = 0

export function disableScroll() {
    if (document.documentElement.classList.contains('body-scroll-lock')) {
        return
    }
    lastScrollPosition = document.documentElement.scrollTop
    document.documentElement.classList.add('body-scroll-lock')
    document.body.style.position = `relative`
    document.body.style.top = `-${lastScrollPosition}px`
}

export function enableScroll() {
    document.documentElement.classList.remove('body-scroll-lock')
    document.body.style.position = null
    document.body.style.top = null
    document.documentElement.scrollTop = lastScrollPosition
}