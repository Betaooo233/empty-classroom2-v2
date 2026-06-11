(function () {
    'use strict';

    const C = window.CONFIG;

    const Utils = {
        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },

        lerp(start, end, t) {
            return start + (end - start) * Utils.clamp(t, C.Common.minAlpha, C.Common.maxAlpha);
        },

        distance(x1, y1, x2, y2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        },

        rectContains(rect, x, y) {
            return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
        },

        rectCenter(rect) {
            return {
                x: rect.x + rect.w * C.Common.half,
                y: rect.y + rect.h * C.Common.half
            };
        },

        now() {
            return performance.now();
        },

        randomRange(min, max) {
            return min + Math.random() * (max - min);
        },

        pick(list) {
            return list[Math.floor(Math.random() * list.length)];
        },

        uniquePush(list, id) {
            if (list.indexOf(id) === -1) {
                list.push(id);
                return true;
            }
            return false;
        },

        removeClass(el, className) {
            if (el) {
                el.classList.remove(className);
            }
        },

        addClass(el, className) {
            if (el) {
                el.classList.add(className);
            }
        },

        setActive(el, active) {
            if (!el) {
                return;
            }
            el.classList.toggle('active', Boolean(active));
        },

        clearChildren(el) {
            while (el && el.firstChild) {
                el.removeChild(el.firstChild);
            }
        },

        createButton(label, className, onClick) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = label;
            if (className) {
                button.className = className;
            }
            if (onClick) {
                button.addEventListener('click', onClick);
            }
            return button;
        },

        toPercent(value) {
            return `${Math.round(value * C.Loading.completePercent)}%`;
        },

        alphaColor(template, alpha) {
            return template.replace('{alpha}', String(alpha));
        },

        scaleToContain(sourceW, sourceH, targetW, targetH) {
            const scale = Math.max(targetW / sourceW, targetH / sourceH);
            const width = sourceW * scale;
            const height = sourceH * scale;
            return {
                x: (targetW - width) * C.Common.half,
                y: (targetH - height) * C.Common.half,
                w: width,
                h: height
            };
        },

        wrapText(ctx, text, x, y, maxWidth, lineHeight) {
            const chars = Array.from(text);
            let line = '';
            let cursorY = y;
            chars.forEach((char) => {
                const testLine = line + char;
                if (ctx.measureText(testLine).width > maxWidth && line) {
                    ctx.fillText(line, x, cursorY);
                    line = char;
                    cursorY += lineHeight;
                } else {
                    line = testLine;
                }
            });
            if (line) {
                ctx.fillText(line, x, cursorY);
            }
            return cursorY;
        },

        safeJsonParse(raw) {
            try {
                return JSON.parse(raw);
            } catch (error) {
                return null;
            }
        },

        requestAnimationFrame(callback) {
            return window.requestAnimationFrame(callback);
        },

        cancelAnimationFrame(id) {
            window.cancelAnimationFrame(id);
        },

        setCanvasSize(canvas) {
            canvas.width = C.Screen.width;
            canvas.height = C.Screen.height;
        }
    };

    window.Utils = Utils;
}());
