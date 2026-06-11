(function () {
    'use strict';

    const C = window.CONFIG;

    class InputManager {
        constructor() {
            this.container = null;
            this.handlers = {};
            this.isDown = false;
            this.start = { x: C.Common.zero, y: C.Common.zero, time: C.Common.zero };
            this.current = { x: C.Common.zero, y: C.Common.zero };
            this.dragThreshold = C.Input.dragThreshold;
            this.swipeThreshold = C.Input.swipeThreshold;
        }

        init(container, handlers) {
            this.container = container;
            this.handlers = handlers || {};
            container.addEventListener('pointerdown', (event) => this.onDown(event));
            container.addEventListener('pointermove', (event) => this.onMove(event));
            container.addEventListener('pointerup', (event) => this.onUp(event));
            container.addEventListener('pointercancel', (event) => this.onCancel(event));
            container.addEventListener('pointerleave', (event) => this.onCancel(event));
        }

        onDown(event) {
            if (!this.container) {
                return;
            }
            const point = this.toGamePoint(event);
            this.isDown = true;
            this.start = { x: point.x, y: point.y, time: window.Utils.now() };
            this.current = point;
            if (this.handlers.onDown) {
                this.handlers.onDown(point, event);
            }
        }

        onMove(event) {
            if (!this.isDown) {
                return;
            }
            const point = this.toGamePoint(event);
            this.current = point;
            if (this.handlers.onMove) {
                this.handlers.onMove(point, event);
            }
        }

        onUp(event) {
            if (!this.isDown) {
                return;
            }
            const point = this.toGamePoint(event);
            const dx = point.x - this.start.x;
            const dy = point.y - this.start.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.isDown = false;
            if (Math.abs(dx) > this.swipeThreshold && Math.abs(dx) > Math.abs(dy) * C.Common.two) {
                if (this.handlers.onSwipe) {
                    this.handlers.onSwipe(dx > C.Common.zero ? 'right' : 'left', point, event);
                }
            } else if (dist <= this.dragThreshold && this.handlers.onTap) {
                this.handlers.onTap(point, event);
            }
            if (this.handlers.onUp) {
                this.handlers.onUp(point, event);
            }
        }

        onCancel(event) {
            if (!this.isDown) {
                return;
            }
            this.isDown = false;
            const point = this.toGamePoint(event);
            if (this.handlers.onUp) {
                this.handlers.onUp(point, event);
            }
        }

        toGamePoint(event) {
            const rect = this.container.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width * C.Screen.width;
            const y = (event.clientY - rect.top) / rect.height * C.Screen.height;
            return {
                x: window.Utils.clamp(x, C.Common.zero, C.Screen.width),
                y: window.Utils.clamp(y, C.Common.zero, C.Screen.height),
                rawX: event.clientX,
                rawY: event.clientY
            };
        }
    }

    window.InputManager = new InputManager();
}());
