// Disable pinch zoom
export default function disablePinchZoom(elements) {
    [].concat(elements || []).forEach((el) => {
        document.documentElement.addEventListener('gesturechange', function (event) {
            event.preventDefault();
        }, { passive: false });
    })
}