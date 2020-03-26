export class Swipe {
  constructor(element) {
    this.xDown = null;
    this.yDown = null;
    this.element = typeof(element) === 'string' ? document.querySelector(element) : element;

    this.element.addEventListener('touchstart', (evt) => {
      this.xDown = evt.touches[0].clientX;
      this.yDown = evt.touches[0].clientY;
    }, false);

    // Reset values.
    this.element.addEventListener('touchend', (evt) => {
      this.xDown = null;
      this.yDown = null;
    })
  }

  onLeft(callback = () => {}) {
    this.onLeft = callback;

    return this;
  }

  onRight(callback = () => {}) {
    this.onRight = callback;

    return this;
  }

  onUp(callback = () => {}) {
    this.onUp = callback;

    return this;
  }

  onDown(callback = () => {}) {
    this.onDown = callback;

    return this;
  }

  handleTouchMove(evt) {
    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;

    this.xDiff = xUp - this.xDown;
    this.yDiff = yUp - this.yDown;

    console.log(this.xDiff, this.yDiff)

    if ( Math.abs( this.xDiff ) > Math.abs( this.yDiff ) ) { // Most significant.
      if ( this.xDiff < 0 ) {
        this.onLeft(this.xDown, xUp, evt);
      } else {
        this.onRight(this.xDown, xUp, evt);
      }
    } else {
      if ( this.yDiff < 0 ) {
        this.onUp(this.yDown, yUp, evt);
      } else {
        this.onDown(this.yDown, yUp, evt);
      }
    }
  }

  run() {
    this.element.addEventListener('touchmove', e => requestAnimationFrame(this.handleTouchMove.bind(this, e)), false);
  }
}

export function swipe(element) {
  return new Swipe(element)
}
