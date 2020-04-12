let lastScrollPosition = 0

export function disableScroll() {
    if (document.documentElement.classList.contains('body-scroll-lock')) {
        return
    }
    document.body.classList.add('body-scroll-lock')
}

export function enableScroll() {
    document.body.classList.remove('body-scroll-lock')
}