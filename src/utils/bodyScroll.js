export function disableScroll() {
    const scrollDistance = document.documentElement.scrollTop

    document.documentElement.classList.add('overflow-hidden')
    document.body.classList.add('overflow-hidden')
    document.body.addEventListener("touchmove", freezeVp, false);
    
    const vpH = window.innerHeight;
    document.documentElement.style.height = vpH.toString() + "px";
    document.body.style.height = vpH.toString() + "px";

    console.log(scrollDistance)
    document.body.scrollTop = scrollDistance
}

export function enableScroll() {
    document.documentElement.style.height = null
    document.body.style.height = null

    document.documentElement.classList.remove('overflow-hidden')
    document.body.classList.remove('overflow-hidden')
    document.body.removeEventListener("touchmove", freezeVp, false);
}

function freezeVp(e) {
    e.preventDefault();
};