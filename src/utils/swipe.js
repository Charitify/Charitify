export class Swipe {
  constructor(element) {
    this.isMoveStart = false
    this.xDown = null;
    this.yDown = null;
    this.element = typeof(element) === 'string' ? document.querySelector(element) : element;

    this.element.addEventListener('touchstart', (evt) => {
      this.isMoveStart = true

      this.xDown = evt.touches[0].clientX;
      this.yDown = evt.touches[0].clientY;

      try {
        this.onTouchStart(this.xDown, this.yDown, evt, this.element)
      } catch(err) { /* ignore throwing of unknown functions */ }
    }, false);

    // Reset values.
    this.element.addEventListener('touchend', (evt) => {
      this.isMoveStart = false

      this.xDown = null;
      this.yDown = null;

      try {
        const xUp = evt.changedTouches[0].clientX;
        const yUp = evt.changedTouches[0].clientY;
        this.onTouchEnd(xUp, yUp, evt, this.element)
      } catch(err) { /* ignore throwing of unknown functions */ }
    })
  }

  onLeft(callback) {
    this.onLeft = callback;

    return this;
  }

  onRight(callback) {
    this.onRight = callback;

    return this;
  }

  onUp(callback) {
    this.onUp = callback;

    return this;
  }

  onDown(callback) {
    this.onDown = callback;

    return this;
  }

  onTouchStart(callback) {
    this.onTouchStart = callback;

    return this;
  }

  onTouchEnd(callback) {
    this.onTouchEnd = callback;

    return this;
  }

  handleTouchMove(evt) {
    if (!this.isMoveStart) {
      return
    }

    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;

    this.xDiff = xUp - this.xDown;
    this.yDiff = yUp - this.yDown;

    try {
      if ( Math.abs( this.xDiff ) > Math.abs( this.yDiff ) ) { // Most significant.
        if ( this.xDiff < 0 ) {
          this.onLeft(this.xDown, xUp, evt, this.element);
        } else {
          this.onRight(this.xDown, xUp, evt, this.element);
        }
      } else {
        if ( this.yDiff < 0 ) {
          this.onUp(this.yDown, yUp, evt, this.element);
        } else {
          this.onDown(this.yDown, yUp, evt, this.element);
        }
      }
    } catch(err) { /* ignore throwing of unknown functions */ }
  }

  handleMove(e) {
    return requestAnimationFrame(() => this.handleTouchMove(e))
  }

  stop() {
    this.element.removeEventListener('touchmove', this.handleMove.bind(this), false);

    return this
  }

  run() {
    this.element.addEventListener('touchmove', this.handleMove.bind(this), false);

    return this
  }
}

export function swipe(element) {
  return new Swipe(element)
}
