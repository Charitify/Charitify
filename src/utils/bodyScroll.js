// import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

export function disableScroll() {
    // const defaltEl = document.getElementById('portal')
    document.documentElement.classList.add('block-scroll')
    document.body.classList.add('block-scroll')
    // disableBodyScroll(el || defaltEl)
}

export function enableScroll() {
    // const defaltEl = document.getElementById('portal')
    document.documentElement.classList.remove('block-scroll')
    document.body.classList.remove('block-scroll')
    // enableBodyScroll(el || defaltEl)
}