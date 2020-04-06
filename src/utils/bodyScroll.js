import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

export function disableScroll(el) {
    const defaltEl = document.getElementById('portal')
    disableBodyScroll(el || defaltEl)
}

export function enableScroll(el) {
    const defaltEl = document.getElementById('portal')
    enableBodyScroll(el || defaltEl)
}