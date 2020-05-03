'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sirv = _interopDefault(require('sirv'));
var polka = _interopDefault(require('polka'));
var compression = _interopDefault(require('compression'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var bodyScrollLock = require('body-scroll-lock');
var classnames = _interopDefault(require('classnames'));
var zlFetch = _interopDefault(require('zl-fetch'));
var dayjs = _interopDefault(require('dayjs'));
var Storages = _interopDefault(require('js-storage'));
var Cookies = _interopDefault(require('js-cookie'));
var Stream = _interopDefault(require('stream'));
var http = _interopDefault(require('http'));
var Url = _interopDefault(require('url'));
var https = _interopDefault(require('https'));
var zlib = _interopDefault(require('zlib'));
var session = _interopDefault(require('express-session'));

function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
}
function null_to_empty(value) {
    return value == null ? '' : value;
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function tick() {
    schedule_update();
    return resolved_promise;
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
const seen_callbacks = new Set();
function flush() {
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}

// source: https://html.spec.whatwg.org/multipage/indices.html
const boolean_attributes = new Set([
    'allowfullscreen',
    'allowpaymentrequest',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'controls',
    'default',
    'defer',
    'disabled',
    'formnovalidate',
    'hidden',
    'ismap',
    'loop',
    'multiple',
    'muted',
    'nomodule',
    'novalidate',
    'open',
    'playsinline',
    'readonly',
    'required',
    'reversed',
    'selected'
]);

const invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
// https://infra.spec.whatwg.org/#noncharacter
function spread(args, classes_to_add) {
    const attributes = Object.assign({}, ...args);
    if (classes_to_add) {
        if (attributes.class == null) {
            attributes.class = classes_to_add;
        }
        else {
            attributes.class += ' ' + classes_to_add;
        }
    }
    let str = '';
    Object.keys(attributes).forEach(name => {
        if (invalid_attribute_name_character.test(name))
            return;
        const value = attributes[name];
        if (value === true)
            str += " " + name;
        else if (boolean_attributes.has(name.toLowerCase())) {
            if (value)
                str += " " + name;
        }
        else if (value != null) {
            str += ` ${name}="${String(value).replace(/"/g, '&#34;').replace(/'/g, '&#39;')}"`;
        }
    });
    return str;
}
const escaped = {
    '"': '&quot;',
    "'": '&#39;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};
function escape(html) {
    return String(html).replace(/["'&<>]/g, match => escaped[match]);
}
function each(items, fn) {
    let str = '';
    for (let i = 0; i < items.length; i += 1) {
        str += fn(items[i], i);
    }
    return str;
}
const missing_component = {
    $$render: () => ''
};
function validate_component(component, name) {
    if (!component || !component.$$render) {
        if (name === 'svelte:component')
            name += ' this={...}';
        throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
    }
    return component;
}
let on_destroy;
function create_ssr_component(fn) {
    function $$render(result, props, bindings, slots) {
        const parent_component = current_component;
        const $$ = {
            on_destroy,
            context: new Map(parent_component ? parent_component.$$.context : []),
            // these will be immediately discarded
            on_mount: [],
            before_update: [],
            after_update: [],
            callbacks: blank_object()
        };
        set_current_component({ $$ });
        const html = fn(result, props, bindings, slots);
        set_current_component(parent_component);
        return html;
    }
    return {
        render: (props = {}, options = {}) => {
            on_destroy = [];
            const result = { title: '', head: '', css: new Set() };
            const html = $$render(result, props, {}, options);
            run_all(on_destroy);
            return {
                html,
                css: {
                    code: Array.from(result.css).map(css => css.code).join('\n'),
                    map: null // TODO
                },
                head: result.title + result.head
            };
        },
        $$render
    };
}
function add_attribute(name, value, boolean) {
    if (value == null || (boolean && !value))
        return '';
    return ` ${name}${value === true ? '' : `=${typeof value === 'string' ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}

/* src/components/Br.svelte generated by Svelte v3.18.1 */

const css = {
	code: "br{display:block;height:0;content:\"\\00a0\";-webkit-box-sizing:content-box;box-sizing:content-box}br.tiny{padding-bottom:calc(1em * 0.29)}br.small{padding-bottom:calc(1em * 0.57)}br.medium,br{padding-bottom:calc(1em * 1.14)}br.big{padding-bottom:calc(1em * 2.28)}",
	map: "{\"version\":3,\"file\":\"Br.svelte\",\"sources\":[\"Br.svelte\"],\"sourcesContent\":[\"<script>\\n  export let size = '1em';\\n\\n  $: foramttedSize = Number.isFinite(+size) ? `${size}px` : typeof size === 'string' ? size : null\\n</script>\\n\\n<br style={`padding-bottom: ${foramttedSize}`} class={$$props.class}/>\\n\\n<style>\\n  :global(br) {\\n    display: block;\\n    height: 0;\\n    content: \\\"\\\\00a0\\\";\\n    -webkit-box-sizing: content-box;\\n            box-sizing: content-box;\\n  }\\n\\n  :global(br.tiny) {\\n    padding-bottom: calc(1em * 0.29); /* 4px */\\n  }\\n\\n  :global(br.small) {\\n    padding-bottom: calc(1em * 0.57); /* 8px */\\n  }\\n\\n  :global(br.medium),\\n  :global(br) {\\n    padding-bottom: calc(1em * 1.14); /* 16px */\\n  }\\n\\n  :global(br.big) {\\n    padding-bottom: calc(1em * 2.28); /* 32px */\\n  }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0JyLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0VBQ0U7SUFDRSxjQUFjO0lBQ2QsU0FBUztJQUNULGdCQUFnQjtJQUNoQiwrQkFBdUI7WUFBdkIsdUJBQXVCO0VBQ3pCOztFQUVBO0lBQ0UsZ0NBQWdDLEVBQUUsUUFBUTtFQUM1Qzs7RUFFQTtJQUNFLGdDQUFnQyxFQUFFLFFBQVE7RUFDNUM7O0VBRUE7O0lBRUUsZ0NBQWdDLEVBQUUsU0FBUztFQUM3Qzs7RUFFQTtJQUNFLGdDQUFnQyxFQUFFLFNBQVM7RUFDN0MiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvQnIuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gIDpnbG9iYWwoYnIpIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBoZWlnaHQ6IDA7XG4gICAgY29udGVudDogXCJcXDAwYTBcIjtcbiAgICBib3gtc2l6aW5nOiBjb250ZW50LWJveDtcbiAgfVxuXG4gIDpnbG9iYWwoYnIudGlueSkge1xuICAgIHBhZGRpbmctYm90dG9tOiBjYWxjKDFlbSAqIDAuMjkpOyAvKiA0cHggKi9cbiAgfVxuXG4gIDpnbG9iYWwoYnIuc21hbGwpIHtcbiAgICBwYWRkaW5nLWJvdHRvbTogY2FsYygxZW0gKiAwLjU3KTsgLyogOHB4ICovXG4gIH1cblxuICA6Z2xvYmFsKGJyLm1lZGl1bSksXG4gIDpnbG9iYWwoYnIpIHtcbiAgICBwYWRkaW5nLWJvdHRvbTogY2FsYygxZW0gKiAxLjE0KTsgLyogMTZweCAqL1xuICB9XG5cbiAgOmdsb2JhbChici5iaWcpIHtcbiAgICBwYWRkaW5nLWJvdHRvbTogY2FsYygxZW0gKiAyLjI4KTsgLyogMzJweCAqL1xuICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AASU,EAAE,AAAE,CAAC,AACX,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,OAAO,CAChB,kBAAkB,CAAE,WAAW,CACvB,UAAU,CAAE,WAAW,AACjC,CAAC,AAEO,OAAO,AAAE,CAAC,AAChB,cAAc,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,AAClC,CAAC,AAEO,QAAQ,AAAE,CAAC,AACjB,cAAc,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,AAClC,CAAC,AAEO,SAAS,AAAC,CACV,EAAE,AAAE,CAAC,AACX,cAAc,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,AAClC,CAAC,AAEO,MAAM,AAAE,CAAC,AACf,cAAc,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,AAClC,CAAC\"}"
};

const Br = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { size = "1em" } = $$props;
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	$$result.css.add(css);

	let foramttedSize = Number.isFinite(+size)
	? `${size}px`
	: typeof size === "string" ? size : null;

	return `<br${add_attribute("style", `padding-bottom: ${foramttedSize}`, 0)}${add_attribute("class", $$props.class, 0)}>`;
});

const DURATION = 500;
let scroll;
let scrollCheckInterval;
function preventInertialScroll(e) {
    if (e && e.touches.length !== 1) return

    function scrollTo(top) {
        // document.documentElement.scrollTop = scroll
        window.scrollTo({
            top,
            left: 0,
            behavior: 'smooth'
        });
    }

    function recursive() {
        if (document.documentElement.scrollTop !== scroll) {
            scrollTo(scroll);
            requestAnimationFrame(recursive);
        } else {
            const time = performance.now();
            function stopScroll() {
                if (performance.now() - time < DURATION) {
                    scrollTo(scroll);
                    requestAnimationFrame(stopScroll);
                }
            }
            stopScroll();
        }
    }
    recursive();
}

/**
 * 
 * @attr body-scroll-lock-ignore - to ignor lock.
 * 
 * @param {HTMLElement} container
 * @param {{
 *  extraLock?: boolean (false)
 * }} config
 */
function disableScroll(container, config = {}) {
    if (typeof window !== 'undefined') {
        document.body.classList.add('body-scroll-lock');

        if (config.extraLock) {
            scroll = document.documentElement.scrollTop;
            document.documentElement.ontouchstart = () => scroll = document.documentElement.scrollTop;
            document.documentElement.ontouchmove = preventInertialScroll;
            document.documentElement.ontouchend = preventInertialScroll;
            scrollCheckInterval = setInterval(() => {
                if (document.documentElement.scrollTop !== scroll) {
                    preventInertialScroll();
                }
            }, DURATION);
        }
    }

    bodyScrollLock.disableBodyScroll(container, {
        allowTouchMove: el => {
            while (el && el !== document.body) {
                if (el.getAttribute('body-scroll-lock-ignore') !== null) {
                    return true;
                }
                el = el.parentNode;
            }
        },
    });
}

function enableScroll(container, config = {}) {
    if (typeof window !== 'undefined') {
        document.body.classList.remove('body-scroll-lock');

        if (config.extraLock) {
            document.documentElement.ontouchstart = null;
            document.documentElement.ontouchmove = null;
            document.documentElement.ontouchend = null;
            clearInterval(scrollCheckInterval);
        }
    }

    bodyScrollLock.enableBodyScroll(container);
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function delay (ms, isError) {
  return new Promise((res, rej) => setTimeout(isError ? rej : res, ms))
}

/**
 *
 * @function safeGet
 *
 * @description Safe getting of an any value of a nested objects.
 *
 * @param expressionFn {function} - The function with an expression which returns result of the safe getting.
 * @param defaultValue {any} - The default value when result is undefined.
 * @param isDefaultTyped {boolean} - Wheter is the result from an expression must be the same type as the default value.
 *
 * @examples
 * // Some data.
 * const very = {
 *  nested: {
 *   object: [{
 *     with: {
 *       arrays: 'stuff'
 *     }
 *   }]
 *  }
 * }
 *
 * // Getting.
 * 1. safeGet(() => very.nested.object[0].with.arrays);
 * 2. safeGet(() => very.nested.object[0].with.arrays, { default: 'value' });
 * 3. safeGet(() => very.nested.object[0].with.arrays, { default: 'value' }, true);
 *
 * // Return.
 * 1. 'stuff'
 * 2. 'stuff'
 * 3. { default: 'value' }
 */
function safeGet(expressionFn, defaultValue, isDefaultTyped = false) {
  // Check whether a and b have the same type. (util)
  function isSameType(a, b) {
    const rules = [
      (a, b) => typeof a === typeof b,
      (a, b) => (+a === a) === (+b === b),              // whether one is NaN
      (a, b) => (a === null) === (b === null),          // null is object type too
      (a, b) => Array.isArray(a) === Array.isArray(b),  // array is object type too
    ];
    return !rules.some(ruleFn => !ruleFn(a, b))
  }
  // Core of safe getting. Executing a function. Default values.
  function get(expressionFn, defaultValue, isDefaultTyped) {
    try {
      const result = expressionFn.call(this);
      if (isDefaultTyped) {
        return isSameType(result, defaultValue) ? result : defaultValue
      } else {
        return result === undefined ? defaultValue : result
      }
    } catch (e) {
      return defaultValue
    }
  }
  // Safe getting of the expressionFn.
  if (typeof expressionFn === 'function') {
    return get(expressionFn, defaultValue, isDefaultTyped)
  } else {
    console.warn('You need to use a function as the first argument.');
  }
  return defaultValue
}

function waitUntil(fn, { timeout = 5000, interval = 500 } = {}) {
  let timer = null;
  let intervalTimer = null;
  return new Promise(function (res, rej) {
    timer = setTimeout(rej, timeout, new Error('Error: Timeout'));
    intervalTimer = setInterval(async () => {
      try {
        const result = await fn();
        clearTimeout(timer);
        clearInterval(intervalTimer);
        res(result);
      } catch (_e) {}
    }, interval);
  })
}

function toCSSString(styles = {}) {
  return Object.entries(styles)
    .filter(([_propName, propValue]) => propValue !== undefined && propValue !== null)
    .reduce((styleString, [propName, propValue]) => {
      propName = propName.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
      return `${styleString}${propName}:${propValue};`
    }, '')
}

function disableDoubleTapZoom(elements) {
    [].concat(elements || []).forEach((el) => {
        let lastTouchEnd = 0;
		el.addEventListener('touchend', function(event) {
			const now = (new Date()).getTime();
			if (now - lastTouchEnd <= 300) {
				event.preventDefault();
			}
			lastTouchEnd = now;
		}, false);
    });
}

var setup = {
  BACKEND_URL: './mock', // charitify-application.page.link/?link=https://charitify-application.firebaseio.com&apn=package_name

  MAPBOX_KEY: 'mapbox',
};

/* node_modules/svelte-icons/components/IconBase.svelte generated by Svelte v3.18.1 */

const css$1 = {
	code: "svg.svelte-1b3s8r4{stroke:currentColor;fill:currentColor;stroke-width:0;width:100%;height:auto;max-height:100%}",
	map: "{\"version\":3,\"file\":\"IconBase.svelte\",\"sources\":[\"IconBase.svelte\"],\"sourcesContent\":[\"<script>\\n  export let title = null;\\n  export let viewBox;\\n</script>\\n\\n<style>\\n  svg {\\n    stroke: currentColor;\\n    fill: currentColor;\\n    stroke-width: 0;\\n    width: 100%;\\n    height: auto;\\n    max-height: 100%;\\n  }  \\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9zdmVsdGUtaWNvbnMvY29tcG9uZW50cy9JY29uQmFzZS5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtFQUNFO0lBQ0Usb0JBQW9CO0lBQ3BCLGtCQUFrQjtJQUNsQixlQUFlO0lBQ2YsV0FBVztJQUNYLFlBQVk7SUFDWixnQkFBZ0I7RUFDbEIiLCJmaWxlIjoibm9kZV9tb2R1bGVzL3N2ZWx0ZS1pY29ucy9jb21wb25lbnRzL0ljb25CYXNlLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICBzdmcge1xuICAgIHN0cm9rZTogY3VycmVudENvbG9yO1xuICAgIGZpbGw6IGN1cnJlbnRDb2xvcjtcbiAgICBzdHJva2Utd2lkdGg6IDA7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiBhdXRvO1xuICAgIG1heC1oZWlnaHQ6IDEwMCU7XG4gIH0gIFxuIl19 */</style>\\n\\n<svg xmlns=\\\"http://www.w3.org/2000/svg\\\" {viewBox}>\\n  {#if title}\\n    <title>{title}</title>\\n  {/if}\\n  <slot />\\n</svg>\\n\"],\"names\":[],\"mappings\":\"AAME,GAAG,eAAC,CAAC,AACH,MAAM,CAAE,YAAY,CACpB,IAAI,CAAE,YAAY,CAClB,YAAY,CAAE,CAAC,CACf,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,IAAI,AAClB,CAAC\"}"
};

const IconBase = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = null } = $$props;
	let { viewBox } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.viewBox === void 0 && $$bindings.viewBox && viewBox !== void 0) $$bindings.viewBox(viewBox);
	$$result.css.add(css$1);

	return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("viewBox", viewBox, 0)} class="${"svelte-1b3s8r4"}">
  ${title ? `<title>${escape(title)}</title>` : ``}
  ${$$slots.default ? $$slots.default({}) : ``}
</svg>`;
});

/* node_modules/svelte-icons/fa/FaPhoneAlt.svelte generated by Svelte v3.18.1 */

const FaPhoneAlt = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaAt.svelte generated by Svelte v3.18.1 */

const FaAt = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M256 8C118.941 8 8 118.919 8 256c0 137.059 110.919 248 248 248 48.154 0 95.342-14.14 135.408-40.223 12.005-7.815 14.625-24.288 5.552-35.372l-10.177-12.433c-7.671-9.371-21.179-11.667-31.373-5.129C325.92 429.757 291.314 440 256 440c-101.458 0-184-82.542-184-184S154.542 72 256 72c100.139 0 184 57.619 184 160 0 38.786-21.093 79.742-58.17 83.693-17.349-.454-16.91-12.857-13.476-30.024l23.433-121.11C394.653 149.75 383.308 136 368.225 136h-44.981a13.518 13.518 0 0 0-13.432 11.993l-.01.092c-14.697-17.901-40.448-21.775-59.971-21.775-74.58 0-137.831 62.234-137.831 151.46 0 65.303 36.785 105.87 96 105.87 26.984 0 57.369-15.637 74.991-38.333 9.522 34.104 40.613 34.103 70.71 34.103C462.609 379.41 504 307.798 504 232 504 95.653 394.023 8 256 8zm-21.68 304.43c-22.249 0-36.07-15.623-36.07-40.771 0-44.993 30.779-72.729 58.63-72.729 22.292 0 35.601 15.241 35.601 40.77 0 45.061-33.875 72.73-58.161 72.73z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaMapMarkerAlt.svelte generated by Svelte v3.18.1 */

const FaMapMarkerAlt = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 384 512" }, $$props), {}, {
		default: () => `
          <path d="${"M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaTelegramPlane.svelte generated by Svelte v3.18.1 */

const FaTelegramPlane = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 448 512" }, $$props), {}, {
		default: () => `
          <path d="${"M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaFacebookF.svelte generated by Svelte v3.18.1 */

const FaFacebookF = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 320 512" }, $$props), {}, {
		default: () => `
          <path d="${"M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaViber.svelte generated by Svelte v3.18.1 */

const FaViber = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M444 49.9C431.3 38.2 379.9.9 265.3.4c0 0-135.1-8.1-200.9 52.3C27.8 89.3 14.9 143 13.5 209.5c-1.4 66.5-3.1 191.1 117 224.9h.1l-.1 51.6s-.8 20.9 13 25.1c16.6 5.2 26.4-10.7 42.3-27.8 8.7-9.4 20.7-23.2 29.8-33.7 82.2 6.9 145.3-8.9 152.5-11.2 16.6-5.4 110.5-17.4 125.7-142 15.8-128.6-7.6-209.8-49.8-246.5zM457.9 287c-12.9 104-89 110.6-103 115.1-6 1.9-61.5 15.7-131.2 11.2 0 0-52 62.7-68.2 79-5.3 5.3-11.1 4.8-11-5.7 0-6.9.4-85.7.4-85.7-.1 0-.1 0 0 0-101.8-28.2-95.8-134.3-94.7-189.8 1.1-55.5 11.6-101 42.6-131.6 55.7-50.5 170.4-43 170.4-43 96.9.4 143.3 29.6 154.1 39.4 35.7 30.6 53.9 103.8 40.6 211.1zm-139-80.8c.4 8.6-12.5 9.2-12.9.6-1.1-22-11.4-32.7-32.6-33.9-8.6-.5-7.8-13.4.7-12.9 27.9 1.5 43.4 17.5 44.8 46.2zm20.3 11.3c1-42.4-25.5-75.6-75.8-79.3-8.5-.6-7.6-13.5.9-12.9 58 4.2 88.9 44.1 87.8 92.5-.1 8.6-13.1 8.2-12.9-.3zm47 13.4c.1 8.6-12.9 8.7-12.9.1-.6-81.5-54.9-125.9-120.8-126.4-8.5-.1-8.5-12.9 0-12.9 73.7.5 133 51.4 133.7 139.2zM374.9 329v.2c-10.8 19-31 40-51.8 33.3l-.2-.3c-21.1-5.9-70.8-31.5-102.2-56.5-16.2-12.8-31-27.9-42.4-42.4-10.3-12.9-20.7-28.2-30.8-46.6-21.3-38.5-26-55.7-26-55.7-6.7-20.8 14.2-41 33.3-51.8h.2c9.2-4.8 18-3.2 23.9 3.9 0 0 12.4 14.8 17.7 22.1 5 6.8 11.7 17.7 15.2 23.8 6.1 10.9 2.3 22-3.7 26.6l-12 9.6c-6.1 4.9-5.3 14-5.3 14s17.8 67.3 84.3 84.3c0 0 9.1.8 14-5.3l9.6-12c4.6-6 15.7-9.8 26.6-3.7 14.7 8.3 33.4 21.2 45.8 32.9 7 5.7 8.6 14.4 3.8 23.6z"}"></path>
        `
	})}`;
});

var icons = {
    phone: FaPhoneAlt,
    email: FaAt,
    location: FaMapMarkerAlt,
    telegram: FaTelegramPlane,
    facebook: FaFacebookF,
    viber: FaViber,
};

/* src/components/Icon.svelte generated by Svelte v3.18.1 */

const css$2 = {
	code: ".ico.svelte-lvz63j{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;-ms-flex-item-align:stretch;align-self:stretch;display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex}.tiny.svelte-lvz63j{width:13px;height:13px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}.small.svelte-lvz63j{width:18px;height:18px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}.medium.svelte-lvz63j{width:24px;height:24px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}.big.svelte-lvz63j{width:30px;height:30px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}.large.svelte-lvz63j{width:40px;height:40px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}",
	map: "{\"version\":3,\"file\":\"Icon.svelte\",\"sources\":[\"Icon.svelte\"],\"sourcesContent\":[\"<script>\\n    /**\\n     * @info see more icons: https://www.svelte-icons.gibdig.com/\\n     */\\n    import { classnames, toCSSString } from '@utils'\\n    import { icons } from '@config'\\n\\n\\n    export let type\\n    export let is = null // primary|warning|danger|light|dark\\n    export let size = null // small|medium|big\\n    export let rotate = 0\\n    export let style = undefined\\n    export let id = undefined\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n    let styleProp = toCSSString({ transform: !!rotate ? `rotateZ(${rotate}deg)` : null, ...style })\\n\\n    $: classProp = classnames('ico', is, size, $$props.class)\\n</script>\\n\\n<i {id} title={titleProp} style={styleProp} class={classProp}>\\n    <svelte:component this={icons[type]}/>\\n</i>\\n\\n<style>\\n    .ico {\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        display: -webkit-inline-box;\\n        display: -ms-inline-flexbox;\\n        display: inline-flex;\\n    }\\n\\n    .ico:not(.custom) * {\\n        fill: rgba(var(--theme-svg-fill));\\n        stroke: rgba(var(--theme-svg-fill));\\n    }\\n\\n    /* ------------=========( Size )=========------------ */\\n    .tiny {\\n        width: 13px;\\n        height: 13px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    .small {\\n        width: 18px;\\n        height: 18px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    .medium {\\n        width: 24px;\\n        height: 24px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    .big {\\n        width: 30px;\\n        height: 30px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    .large {\\n        width: 40px;\\n        height: 40px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    /* ------------=========( Color )=========------------ */\\n    .ico.primary * {\\n        fill: rgb(var(--color-success));\\n        stroke: rgb(var(--color-success));\\n    }\\n\\n    .ico.danger * {\\n        fill: rgb(var(--color-danger));\\n        stroke: rgb(var(--color-danger));\\n    }\\n\\n    .ico.info * {\\n        fill: rgb(var(--color-info));\\n        stroke: rgb(var(--color-info));\\n    }\\n\\n    .ico.light * {\\n        fill: rgb(var(--color-white));\\n        stroke: rgb(var(--color-white));\\n    }\\n\\n    .ico.dark * {\\n        fill: rgb(var(--color-black));\\n        stroke: rgb(var(--color-black));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0ljb24uc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG1CQUFZO1lBQVosb0JBQVk7Z0JBQVosWUFBWTtRQUNaLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsMkJBQW9CO1FBQXBCLDJCQUFvQjtRQUFwQixvQkFBb0I7SUFDeEI7O0lBRUE7UUFDSSxpQ0FBaUM7UUFDakMsbUNBQW1DO0lBQ3ZDOztJQUVBLHVEQUF1RDtJQUN2RDtRQUNJLFdBQVc7UUFDWCxZQUFZO1FBQ1osbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVix5QkFBZ0I7WUFBaEIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksV0FBVztRQUNYLFlBQVk7UUFDWixtQkFBVTtZQUFWLGNBQVU7Z0JBQVYsVUFBVTtRQUNWLHlCQUFnQjtZQUFoQixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsWUFBWTtRQUNaLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YseUJBQWdCO1lBQWhCLGdCQUFnQjtJQUNwQjs7SUFFQTtRQUNJLFdBQVc7UUFDWCxZQUFZO1FBQ1osbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVix5QkFBZ0I7WUFBaEIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksV0FBVztRQUNYLFlBQVk7UUFDWixtQkFBVTtZQUFWLGNBQVU7Z0JBQVYsVUFBVTtRQUNWLHlCQUFnQjtZQUFoQixnQkFBZ0I7SUFDcEI7O0lBRUEsd0RBQXdEO0lBQ3hEO1FBQ0ksK0JBQStCO1FBQy9CLGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLDhCQUE4QjtRQUM5QixnQ0FBZ0M7SUFDcEM7O0lBRUE7UUFDSSw0QkFBNEI7UUFDNUIsOEJBQThCO0lBQ2xDOztJQUVBO1FBQ0ksNkJBQTZCO1FBQzdCLCtCQUErQjtJQUNuQzs7SUFFQTtRQUNJLDZCQUE2QjtRQUM3QiwrQkFBK0I7SUFDbkMiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuaWNvIHtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICB9XG5cbiAgICAuaWNvOm5vdCguY3VzdG9tKSAqIHtcbiAgICAgICAgZmlsbDogcmdiYSh2YXIoLS10aGVtZS1zdmctZmlsbCkpO1xuICAgICAgICBzdHJva2U6IHJnYmEodmFyKC0tdGhlbWUtc3ZnLWZpbGwpKTtcbiAgICB9XG5cbiAgICAvKiAtLS0tLS0tLS0tLS09PT09PT09PT0oIFNpemUgKT09PT09PT09PS0tLS0tLS0tLS0tLSAqL1xuICAgIC50aW55IHtcbiAgICAgICAgd2lkdGg6IDEzcHg7XG4gICAgICAgIGhlaWdodDogMTNweDtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgYWxpZ24tc2VsZjogYXV0bztcbiAgICB9XG5cbiAgICAuc21hbGwge1xuICAgICAgICB3aWR0aDogMThweDtcbiAgICAgICAgaGVpZ2h0OiAxOHB4O1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBhdXRvO1xuICAgIH1cblxuICAgIC5tZWRpdW0ge1xuICAgICAgICB3aWR0aDogMjRweDtcbiAgICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBhdXRvO1xuICAgIH1cblxuICAgIC5iaWcge1xuICAgICAgICB3aWR0aDogMzBweDtcbiAgICAgICAgaGVpZ2h0OiAzMHB4O1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBhdXRvO1xuICAgIH1cblxuICAgIC5sYXJnZSB7XG4gICAgICAgIHdpZHRoOiA0MHB4O1xuICAgICAgICBoZWlnaHQ6IDQwcHg7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGFsaWduLXNlbGY6IGF1dG87XG4gICAgfVxuXG4gICAgLyogLS0tLS0tLS0tLS0tPT09PT09PT09KCBDb2xvciApPT09PT09PT09LS0tLS0tLS0tLS0tICovXG4gICAgLmljby5wcmltYXJ5ICoge1xuICAgICAgICBmaWxsOiByZ2IodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgICAgICBzdHJva2U6IHJnYih2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgfVxuXG4gICAgLmljby5kYW5nZXIgKiB7XG4gICAgICAgIGZpbGw6IHJnYih2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuXG4gICAgLmljby5pbmZvICoge1xuICAgICAgICBmaWxsOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgICAgICBzdHJva2U6IHJnYih2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuXG4gICAgLmljby5saWdodCAqIHtcbiAgICAgICAgZmlsbDogcmdiKHZhcigtLWNvbG9yLXdoaXRlKSk7XG4gICAgICAgIHN0cm9rZTogcmdiKHZhcigtLWNvbG9yLXdoaXRlKSk7XG4gICAgfVxuXG4gICAgLmljby5kYXJrICoge1xuICAgICAgICBmaWxsOiByZ2IodmFyKC0tY29sb3ItYmxhY2spKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3ItYmxhY2spKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AA6BI,IAAI,cAAC,CAAC,AACF,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,WAAW,AACxB,CAAC,AAQD,KAAK,cAAC,CAAC,AACH,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC,AAED,MAAM,cAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC,AAED,OAAO,cAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC,AAED,IAAI,cAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC,AAED,MAAM,cAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC\"}"
};

const Icon = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { type } = $$props;
	let { is = null } = $$props; // primary|warning|danger|light|dark
	let { size = null } = $$props; // small|medium|big
	let { rotate = 0 } = $$props;
	let { style = undefined } = $$props;
	let { id = undefined } = $$props;
	let { title = undefined } = $$props;
	let { ariaLabel = undefined } = $$props;
	let titleProp = title || ariaLabel;

	let styleProp = toCSSString({
		transform: !!rotate ? `rotateZ(${rotate}deg)` : null,
		...style
	});

	if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
	if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.rotate === void 0 && $$bindings.rotate && rotate !== void 0) $$bindings.rotate(rotate);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	$$result.css.add(css$2);
	let classProp = classnames("ico", is, size, $$props.class);

	return `<i${add_attribute("id", id, 0)}${add_attribute("title", titleProp, 0)}${add_attribute("style", styleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-lvz63j"}">
    ${validate_component(icons[type] || missing_component, "svelte:component").$$render($$result, {}, {}, {})}
</i>`;
});

/* src/components/Form.svelte generated by Svelte v3.18.1 */

const Form = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { name = undefined } = $$props;
	let { id = undefined } = $$props;
	let { title = undefined } = $$props;
	let { ariaLabel = undefined } = $$props;
	let { method = undefined } = $$props;
	let { autocomplete = undefined } = $$props;
	let titleProp = title || ariaLabel;
	let ariaLabelProp = ariaLabel || title;
	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	if ($$props.method === void 0 && $$bindings.method && method !== void 0) $$bindings.method(method);
	if ($$props.autocomplete === void 0 && $$bindings.autocomplete && autocomplete !== void 0) $$bindings.autocomplete(autocomplete);

	return `<form${add_attribute("id", id, 0)}${add_attribute("name", name, 0)}${add_attribute("method", method, 0)}${add_attribute("autocomplete", autocomplete, 0)}${add_attribute("title", titleProp, 0)}${add_attribute("class", $$props.class, 0)}${add_attribute("aria-label", ariaLabelProp, 0)}>
    ${$$slots.default ? $$slots.default({}) : ``}
</form>`;
});

/* src/components/Card.svelte generated by Svelte v3.18.1 */

const css$3 = {
	code: ".card.svelte-1k36sd6{width:100%;overflow:hidden;position:relative;-webkit-transform:translateZ(0);transform:translateZ(0);-webkit-box-shadow:var(--shadow-secondary);box-shadow:var(--shadow-secondary);border-radius:var(--border-radius-big);background-color:rgba(var(--theme-color-primary))}",
	map: "{\"version\":3,\"file\":\"Card.svelte\",\"sources\":[\"Card.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '@utils'\\n\\n    $: classProp = classnames('card', $$props.class)\\n</script>\\n\\n<section class={classProp} style={$$props.style}>\\n    <slot></slot>\\n</section>\\n\\n<style>\\n    .card {\\n        width: 100%;\\n        overflow: hidden;\\n        position: relative;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n        -webkit-box-shadow: var(--shadow-secondary);\\n                box-shadow: var(--shadow-secondary);\\n        border-radius: var(--border-radius-big);\\n        background-color: rgba(var(--theme-color-primary));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0NhcmQuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFdBQVc7UUFDWCxnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBQ2xCLGdDQUF3QjtnQkFBeEIsd0JBQXdCO1FBQ3hCLDJDQUFtQztnQkFBbkMsbUNBQW1DO1FBQ25DLHVDQUF1QztRQUN2QyxrREFBa0Q7SUFDdEQiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvQ2FyZC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuY2FyZCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtYmlnKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1jb2xvci1wcmltYXJ5KSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAWI,KAAK,eAAC,CAAC,AACH,KAAK,CAAE,IAAI,CACX,QAAQ,CAAE,MAAM,CAChB,QAAQ,CAAE,QAAQ,CAClB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,CAChC,kBAAkB,CAAE,IAAI,kBAAkB,CAAC,CACnC,UAAU,CAAE,IAAI,kBAAkB,CAAC,CAC3C,aAAa,CAAE,IAAI,mBAAmB,CAAC,CACvC,gBAAgB,CAAE,KAAK,IAAI,qBAAqB,CAAC,CAAC,AACtD,CAAC\"}"
};

const Card = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$3);
	let classProp = classnames("card", $$props.class);

	return `<section class="${escape(null_to_empty(classProp)) + " svelte-1k36sd6"}"${add_attribute("style", $$props.style, 0)}>
    ${$$slots.default ? $$slots.default({}) : ``}
</section>`;
});

/**
 *
 * @description API URLs builders.
 */
const endpoints = {
  USER: (id) => `user.json?id=${id}`,
  USERS: () => `users.json`,

  RECENT: (id) => `recent.json?id=${id}`,
  RECENTS: () => `recents.json`,

  COMMENT: (id) => `comment.json?id=${id}`,
  COMMENTS: () => `comments.json`,

  FUND: (id) => `fund.json?id=${id}`,
  FUNDS: () => `funds.json`,

  ORGANIZATION: (id) => `organization.json?id=${id}`,
  ORGANIZATIONS: () => `organizations.json`,
};

class APIService {
  /**
   *
   * @typedef Config {{
   *   adapter: Function, (zlFetch)
   *
   *   basePath: string,
   *
   *   requestInterceptor([
   *     endpoint: string,
   *     params?: object,
   *     config?: object,
   *   ]): {*},
   *   responseInterceptor() {
   *     body: {*},
   *     headers: object,
   *     response: {Response},
   *     status: number,
   *     statusText: string,
   *   },
   *   errorInterceptor() {{
   *     body: {*},
   *     headers: object,
   *     response: {Response},
   *     status: number,
   *     statusText: string,
   *   }},
   * }}
   * @param config {Config}
   */
  constructor(config = {}) {
    this._adapter = config.adapter || zlFetch;

    this._base_path = config.basePath ? config.basePath.replace(/\/$/, '') : '';

    this._requestInterceptor = config.requestInterceptor || (async (...args) => args);
    this._responseInterceptor = config.responseInterceptor || (async (...args) => args);
    this._errorInterceptor = config.errorInterceptor || Promise.reject;
  }

  /**
   *
   * @param method {'get'|'put'|'post'|'delete'|'patch'}
   * @param args {*[]}
   */
  get newRequest() {
    const methods = ['get', 'put', 'post', 'delete', 'patch'];

    return methods.reduce((acc, method) => {
      acc[method] = this.withInterceptors.bind(this, this._adapter[method]);
      return acc
    }, {})
  }

  async withInterceptors(caller, ...args) {
    const newArgs1 = await this.requestInterceptor(...args);
    const newArgs2 = await this._requestInterceptor(...newArgs1);

    return caller(...newArgs2)
      .then(async (response) => {
        const newResponse = await this._responseInterceptor(response);
        return await this.handleResponse(newResponse)
      })
      .catch(async (reject) => {
        try {
          return await this._errorInterceptor(reject)
        } catch (error) {
          throw error
        }
      })
      .catch(this.handleReject)
  }

  async requestInterceptor(...args) {
    if (typeof args[0] === 'string') { // If URL then concat BASE_PATH.
      args[0] = `${this._base_path}/${args[0]}`;
    }
    return [...args]
  }

  async handleResponse(response) {
    return response.body
  }

  async handleReject(reject) {
    throw reject
  }
}

/**
 *
 * @description API class for making REST API requests in a browser.
 */
class ApiClass extends APIService {
  /**
   *
   * @param config {Config}
   */
  constructor(config) {
    super(config);
  }

  /**
   *
   * @description Users
   */
  getUser(id, params, config) {
    return this.newRequest.get(endpoints.USER(id), params, config)
  }

  getUsers(params, config) {
    return this.newRequest.get(endpoints.USERS(), params, config)
  }

  postUser(id, body, config) {
    return this.newRequest.post(endpoints.USER(id), body, config)
  }

  putUser(id, body, config) {
    return this.newRequest.put(endpoints.USER(id), body, config)
  }

  deleteUser(id, config) {
    return this.newRequest.delete(endpoints.USER(id), config)
  }

  /**
   *
   * @description Recent
   */
  getRecent(id, params, config) {
    return this.newRequest.get(endpoints.RECENT(id), params, config)
  }

  getRecents(params, config) {
    return this.newRequest.get(endpoints.RECENTS(), params, config)
  }

  postRecent(id, body, config) {
    return this.newRequest.post(endpoints.RECENT(id), body, config)
  }

  putRecent(id, body, config) {
    return this.newRequest.put(endpoints.RECENT(id), body, config)
  }

  deleteRecent(id, config) {
    return this.newRequest.delete(endpoints.RECENT(id), config)
  }

  /**
   *
   * @description Comments
   */
  getComment(id, params, config) {
    return this.newRequest.get(endpoints.COMMENT(id), params, config)
  }

  getComments(params, config) {
    return this.newRequest.get(endpoints.COMMENTS(), params, config)
  }

  postComment(id, body, config) {
    return this.newRequest.post(endpoints.COMMENT(id), body, config)
  }

  putComment(id, body, config) {
    return this.newRequest.put(endpoints.COMMENT(id), body, config)
  }

  deleteComment(id, config) {
    return this.newRequest.delete(endpoints.COMMENT(id), config)
  }

  /**
   *
   * @description Fund
   */
  getFund(id, params, config) {
    return this.newRequest.get(endpoints.FUND(id), params, config)
  }

  getFunds(params, config) {
    return this.newRequest.get(endpoints.FUNDS(), params, config)
  }

  postFund(id, body, config) {
    return this.newRequest.post(endpoints.FUND(id), body, config)
  }

  putFund(id, body, config) {
    return this.newRequest.put(endpoints.FUND(id), body, config)
  }

  deleteFund(id, config) {
    return this.newRequest.delete(endpoints.FUND(id), config)
  }

  /**
   *
   * @description Organization
   */
  getOrganization(id, params, config) {
    return this.newRequest.get(endpoints.ORGANIZATION(id), params, config)
  }

  getOrganizations(params, config) {
    return this.newRequest.get(endpoints.ORGANIZATIONS(), params, config)
  }

  postOrganization(id, body, config) {
    return this.newRequest.post(endpoints.ORGANIZATION(id), body, config)
  }

  putOrganization(id, body, config) {
    return this.newRequest.put(endpoints.ORGANIZATION(id), body, config)
  }

  deleteOrganization(id, config) {
    return this.newRequest.delete(endpoints.ORGANIZATION(id), config)
  }

}

/**
 *
 * @constructor {Config}
 */
var API = new ApiClass({
  basePath: setup.BACKEND_URL,
  responseInterceptor: res => (console.info('response -------\n', res), res),
  errorInterceptor: rej => {
    console.warn('request error -------\n', rej);

    if (rej && rej.error && rej.error.message === 'Failed to fetch') {
      console.log('Lost internet connection');
      showOfflineMessage();
    }

    throw rej
  },
});

function showOfflineMessage() {
  try {
    let timer = null;
    const offlineEl = document.querySelector('#offline-message');
    if (!timer) {
      offlineEl.classList.add('active');
      timer = setTimeout(() => {
        offlineEl.classList.remove('active');
        clearTimeout(timer);
      }, 5000);
    }
  } catch (err) {
    console.warn(err);
  }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var relativeTime = createCommonjsModule(function (module, exports) {
!function(r,t){module.exports=t();}(commonjsGlobal,function(){return function(r,t,e){var n=t.prototype;e.en.relativeTime={future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"};var o=function(r,t,n,o){for(var d,i,u,a=n.$locale().relativeTime,f=[{l:"s",r:44,d:"second"},{l:"m",r:89},{l:"mm",r:44,d:"minute"},{l:"h",r:89},{l:"hh",r:21,d:"hour"},{l:"d",r:35},{l:"dd",r:25,d:"day"},{l:"M",r:45},{l:"MM",r:10,d:"month"},{l:"y",r:17},{l:"yy",d:"year"}],s=f.length,l=0;l<s;l+=1){var h=f[l];h.d&&(d=o?e(r).diff(n,h.d,!0):n.diff(r,h.d,!0));var m=Math.round(Math.abs(d));if(u=d>0,m<=h.r||!h.r){1===m&&l>0&&(h=f[l-1]);var c=a[h.l];i="string"==typeof c?c.replace("%d",m):c(m,t,h.l,u);break}}return t?i:(u?a.future:a.past).replace("%s",i)};n.to=function(r,t){return o(r,t,this,!0)},n.from=function(r,t){return o(r,t,this)};var d=function(r){return r.$u?e.utc():e()};n.toNow=function(r){return this.to(d(this),r)},n.fromNow=function(r){return this.from(d(this),r)};}});
});

var utc = createCommonjsModule(function (module, exports) {
!function(t,i){module.exports=i();}(commonjsGlobal,function(){return function(t,i,e){var s=(new Date).getTimezoneOffset(),n=i.prototype;e.utc=function(t,e){return new i({date:t,utc:!0,format:e})},n.utc=function(){return e(this.toDate(),{locale:this.$L,utc:!0})},n.local=function(){return e(this.toDate(),{locale:this.$L,utc:!1})};var u=n.parse;n.parse=function(t){t.utc&&(this.$u=!0),this.$utils().u(t.$offset)||(this.$offset=t.$offset),u.call(this,t);};var o=n.init;n.init=function(){if(this.$u){var t=this.$d;this.$y=t.getUTCFullYear(),this.$M=t.getUTCMonth(),this.$D=t.getUTCDate(),this.$W=t.getUTCDay(),this.$H=t.getUTCHours(),this.$m=t.getUTCMinutes(),this.$s=t.getUTCSeconds(),this.$ms=t.getUTCMilliseconds();}else o.call(this);};var f=n.utcOffset;n.utcOffset=function(t){var i=this.$utils().u;if(i(t))return this.$u?0:i(this.$offset)?f.call(this):this.$offset;var e,n=Math.abs(t)<=16?60*t:t;return 0!==t?(e=this.local().add(n+s,"minute")).$offset=n:e=this.utc(),e};var r=n.format;n.format=function(t){var i=t||(this.$u?"YYYY-MM-DDTHH:mm:ss[Z]":"");return r.call(this,i)},n.valueOf=function(){var t=this.$utils().u(this.$offset)?0:this.$offset+s;return this.$d.valueOf()-6e4*t},n.isUTC=function(){return !!this.$u},n.toISOString=function(){return this.toDate().toISOString()},n.toString=function(){return this.toDate().toUTCString()};}});
});

var weekday = createCommonjsModule(function (module, exports) {
!function(e,t){module.exports=t();}(commonjsGlobal,function(){return function(e,t){t.prototype.weekday=function(e){var t=this.$locale().weekStart||0,n=this.$W,i=(n<t?n+7:n)-t;return this.$utils().u(e)?i:this.subtract(i,"day").add(e,"day")};}});
});

var en = createCommonjsModule(function (module, exports) {
!function(e,n){module.exports=n();}(commonjsGlobal,function(){return {name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")}});
});

var ru = createCommonjsModule(function (module, exports) {
!function(_,t){module.exports=t(dayjs);}(commonjsGlobal,function(_){_=_&&_.hasOwnProperty("default")?_.default:_;var t="января_февраля_марта_апреля_мая_июня_июля_августа_сентября_октября_ноября_декабря".split("_"),e="январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь".split("_"),n="янв._февр._мар._апр._мая_июня_июля_авг._сент._окт._нояб._дек.".split("_"),s="янв._февр._март_апр._май_июнь_июль_авг._сент._окт._нояб._дек.".split("_"),o=/D[oD]?(\[[^[\]]*\]|\s)+MMMM?/;function r(_,t,e){var n,s;return "m"===e?t?"минута":"минуту":_+" "+(n=+_,s={mm:t?"минута_минуты_минут":"минуту_минуты_минут",hh:"час_часа_часов",dd:"день_дня_дней",MM:"месяц_месяца_месяцев",yy:"год_года_лет"}[e].split("_"),n%10==1&&n%100!=11?s[0]:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?s[1]:s[2])}var d={name:"ru",weekdays:"воскресенье_понедельник_вторник_среда_четверг_пятница_суббота".split("_"),weekdaysShort:"вск_пнд_втр_срд_чтв_птн_сбт".split("_"),weekdaysMin:"вс_пн_вт_ср_чт_пт_сб".split("_"),months:function(_,n){return o.test(n)?t[_.month()]:e[_.month()]},monthsShort:function(_,t){return o.test(t)?n[_.month()]:s[_.month()]},weekStart:1,formats:{LT:"H:mm",LTS:"H:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY г.",LLL:"D MMMM YYYY г., H:mm",LLLL:"dddd, D MMMM YYYY г., H:mm"},relativeTime:{future:"через %s",past:"%s назад",s:"несколько секунд",m:r,mm:r,h:"час",hh:r,d:"день",dd:r,M:"месяц",MM:r,y:"год",yy:r},ordinal:function(_){return _}};return _.locale(d,null,!0),d});
});

var uk = createCommonjsModule(function (module, exports) {
!function(_,e){module.exports=e(dayjs);}(commonjsGlobal,function(_){function e(_,e,t){var s,d;return "m"===t?e?"хвилина":"хвилину":_+" "+(s=+_,d={ss:e?"секунда_секунди_секунд":"секунду_секунди_секунд",mm:e?"хвилина_хвилини_хвилин":"хвилину_хвилини_хвилин",hh:e?"година_години_годин":"годину_години_годин",dd:"день_дні_днів",MM:"місяць_місяці_місяців",yy:"рік_роки_років"}[t].split("_"),s%10==1&&s%100!=11?d[0]:s%10>=2&&s%10<=4&&(s%100<10||s%100>=20)?d[1]:d[2])}_=_&&_.hasOwnProperty("default")?_.default:_;var t={name:"uk",weekdays:"неділя_понеділок_вівторок_середа_четвер_п’ятниця_субота".split("_"),weekdaysShort:"ндл_пнд_втр_срд_чтв_птн_сбт".split("_"),weekdaysMin:"нд_пн_вт_ср_чт_пт_сб".split("_"),months:"січень_лютий_березень_квітень_травень_червень_липень_серпень_вересень_жовтень_листопад_грудень".split("_"),monthsShort:"сiч_лют_бер_квiт_трав_черв_лип_серп_вер_жовт_лист_груд".split("_"),weekStart:1,relativeTime:{future:"за %s",past:"%s тому",s:"декілька секунд",m:e,mm:e,h:"годину",hh:e,d:"день",dd:e,M:"місяць",MM:e,y:"рік",yy:e},ordinal:function(_){return _},formats:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY р.",LLL:"D MMMM YYYY р., HH:mm",LLLL:"dddd, D MMMM YYYY р., HH:mm"}};return _.locale(t,null,!0),t});
});

dayjs.extend(relativeTime); // use RelativeTime pluggin
dayjs.extend(utc); // use UTC pluggin
dayjs.extend(weekday); // use Weekday pluggin

dayjs.locale('en'); // use Engllish
dayjs.locale('ru'); // use Russian
dayjs.locale('uk'); // use Ukrainian

Storages.alwaysUseJsonInStorage();

const localStorage = Storages.localStorage;
const sessionStorage = Storages.sessionStorage;
const cookieStorage = Cookies;

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

const modals = writable({});

function generator(storage) {
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param key storage key
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(key, value, start) {
        return {
            subscribe: writable$1(key, value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param key storage key
     * @param {*=}value default value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable$1(key, value, start = noop) {
        function wrap_start(ogSet) {
            return start(function wrap_set(new_value) {
                if (storage) {
                    storage.setItem(key, new_value);
                }
                return ogSet(new_value);
            });
        }
        if (storage) {
            if (storage.getItem(key)) {
                value = storage.getItem(key);
            }
            storage.setItem(key, value);
        }
        const ogStore = writable(value, start ? wrap_start : undefined);
        function set(new_value) {
            if (storage) {
                storage.setItem(key, new_value);
            }
            ogStore.set(new_value);
        }
        function update(fn) {
            set(fn(get_store_value(ogStore)));
        }
        function subscribe(run, invalidate = noop) {
            return ogStore.subscribe(run, invalidate);
        }
        return { set, update, subscribe };
    }
    /**
     * Derived value store by synchronizing one or more readable stores and
     * applying an aggregation function over its input values.
     * @param key storage key
     * @param {Stores} stores input stores
     * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
     * @param {*=}initial_value when used asynchronously
     */
    function derived(key, stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        if (storage && storage.getItem(key)) {
            initial_value = storage.getItem(key);
        }
        return readable(key, initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }
    return {
        readable,
        writable: writable$1,
        derived,
        get: get_store_value
    };
}

const storage = typeof window !== 'undefined' ? window.localStorage : undefined;
const { readable, writable: writable$1, derived, get } = generator(storage);

const organization = writable$1('organization', null);
const organizations = writable$1('organizations', null);

/* src/components/Portal.svelte generated by Svelte v3.18.1 */

const css$4 = {
	code: ".portal-clone.svelte-qh8j7n{display:none}",
	map: "{\"version\":3,\"file\":\"Portal.svelte\",\"sources\":[\"Portal.svelte\"],\"sourcesContent\":[\"<script>\\n  import { onMount } from \\\"svelte\\\";\\n\\n  let ref;\\n  let portal;\\n\\n  onMount(() => {\\n    portal = document.createElement(\\\"div\\\");\\n    portal.className = \\\"portal\\\";\\n    portal.appendChild(ref);\\n    document.body.appendChild(portal);\\n    return () => document.body.removeChild(portal)\\n  });\\n\\n</script>\\n\\n<div class=\\\"portal-clone\\\">\\n    <div bind:this={ref}>\\n        <slot />\\n    </div>\\n</div>\\n\\n<style>\\n  .portal-clone {\\n    display: none;\\n  }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL1BvcnRhbC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtFQUNFO0lBQ0UsYUFBYTtFQUNmIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL1BvcnRhbC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgLnBvcnRhbC1jbG9uZSB7XG4gICAgZGlzcGxheTogbm9uZTtcbiAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAuBE,aAAa,cAAC,CAAC,AACb,OAAO,CAAE,IAAI,AACf,CAAC\"}"
};

const Portal = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let ref;
	let portal;

	onMount(() => {
		portal = document.createElement("div");
		portal.className = "portal";
		portal.appendChild(ref);
		document.body.appendChild(portal);
		return () => document.body.removeChild(portal);
	});

	$$result.css.add(css$4);

	return `<div class="${"portal-clone svelte-qh8j7n"}">
    <div${add_attribute("this", ref, 1)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </div>
</div>`;
});

/* src/components/Modal.svelte generated by Svelte v3.18.1 */

const css$5 = {
	code: ".modal.svelte-1r5lpit.svelte-1r5lpit{z-index:8;position:fixed;top:0;left:0;width:100%;height:100%;display:-webkit-box;display:-ms-flexbox;display:flex;overflow-x:hidden;overflow-y:auto;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-ms-touch-action:manipulation;touch-action:manipulation;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:rgba(var(--color-black), .75);outline:150px solid rgba(var(--color-black), .75);-webkit-transition-timing-function:ease-out;transition-timing-function:ease-out;opacity:0;pointer-events:none}.modal.active.svelte-1r5lpit.svelte-1r5lpit,.modal-header.active.svelte-1r5lpit.svelte-1r5lpit{opacity:1;pointer-events:auto}.modal-inner.svelte-1r5lpit.svelte-1r5lpit{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch;overflow:hidden;background-color:rgba(var(--theme-color-primary))}.small.svelte-1r5lpit .modal-inner.svelte-1r5lpit{width:200px;border-radius:var(--border-radius-big)}.medium.svelte-1r5lpit .modal-inner.svelte-1r5lpit{width:calc(100vw - var(--screen-padding) * 2);border-radius:var(--border-radius-big)}.big.svelte-1r5lpit .modal-inner.svelte-1r5lpit{width:calc(100% - var(--screen-padding) * 2);height:calc(100% - var(--screen-padding) * 2);border-radius:var(--border-radius-big)}.full.svelte-1r5lpit.svelte-1r5lpit{-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch}.full.svelte-1r5lpit .modal-inner.svelte-1r5lpit{-webkit-box-flex:0;-ms-flex:none;flex:none;width:100%;min-height:100%;border-radius:0}.modal-header.svelte-1r5lpit.svelte-1r5lpit{-webkit-transform:translateZ(0);transform:translateZ(0);z-index:9;position:fixed;top:0;left:0;width:100%;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;color:rgb(var(--color-white));background-color:rgb(var(--color-info));opacity:0;pointer-events:none;-webkit-transform-origin:50% 50vh;transform-origin:50% 50vh}.modal-header.svelte-1r5lpit .close.svelte-1r5lpit{font-size:24px;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:60px;height:60px}",
	map: "{\"version\":3,\"file\":\"Modal.svelte\",\"sources\":[\"Modal.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, tick } from 'svelte'\\n    import { fly } from \\\"svelte/transition\\\";\\n    import { Swipe } from '@services'\\n    import { safeGet, classnames, delay, bodyScroll, stopPropagationInRanges } from \\\"@utils\\\";\\n    import { modals } from \\\"@store\\\";\\n    import Portal from \\\"./Portal.svelte\\\";\\n    import Br from \\\"./Br.svelte\\\";\\n\\n    const dispatch = createEventDispatcher()\\n    \\n    const DURATION = 250\\n    const THRESHOLD = 50\\n    const SWIPE_SPEED = .5\\n    const THRESHOLD_RANGES = { x: [0, 100], y: [1, 99] }\\n    const START_POSITION = {\\n        x: 50,\\n        y: 0\\n    }\\n\\n    export let id\\n    export let ref = null\\n    export let size = 'full'    // small/medium/big/full\\n    export let swipe = []       // up down left right all\\n    export let open = null\\n    export let startPosition = START_POSITION\\n    export let blockBody = true\\n    export let withHeader = true\\n\\n    let active\\n    let refHeader\\n    let isBodyBlocked = false\\n    let isAllowed = {\\n        up: true,\\n        down: false,\\n        left: true,\\n        right: true,\\n    }\\n\\n    $: isSwipe = {\\n        up: safeGet(() => swipe.includes('up') || swipe.includes('all')),\\n        down: safeGet(() => swipe.includes('down') || swipe.includes('all')),\\n        left: safeGet(() => swipe.includes('left') || swipe.includes('all')),\\n        right: safeGet(() => swipe.includes('right') || swipe.includes('all')),\\n    }\\n    $: scrollY = ref && ref.scrollTop\\n    $: active = safeGet(() => open !== null ? open : $modals[`modal-${id}`].open, null)\\n    $: classProp = classnames('modal', size, { active })\\n    $: onActiveChange(active)\\n    $: blockScroll(ref)\\n\\n    function blockScroll(modal) {\\n        if (blockBody && active && !isBodyBlocked) {\\n            bodyScroll.disableScroll(modal, { extraLock: size === 'full' });\\n            isBodyBlocked = true\\n            modal && (modal.scrollTop = 0)\\n            isAllowed = {\\n                up: true,\\n                down: false,\\n                left: true,\\n                right: true,\\n            }\\n        } else if (blockBody && !active && isBodyBlocked) {\\n            bodyScroll.enableScroll(modal, { extraLock: size === 'full' });\\n            isBodyBlocked = false\\n        }\\n    }\\n\\n    async function onActiveChange(active) {\\n        if (active) {\\n            setDuration(ref, DURATION)\\n            setDuration(refHeader, DURATION)\\n            setTimeout(() => setDuration(ref, 0), DURATION)\\n            setTimeout(() => setDuration(refHeader, 0), DURATION)\\n            drawTransform(ref, 0, 0)\\n            drawTransform(refHeader, 0, 0)\\n            drawOpacity(ref, 0, 0)\\n            drawOpacity(refHeader, 0, 0)\\n            blockScroll(ref)\\n            await tick()\\n            dispatch('open')\\n        } else {\\n            blockScroll(ref)\\n            await tick()\\n            dispatch('close')\\n        }\\n    }\\n\\n    function setActive(isActive) {\\n        if (open !== null) open = isActive\\n        modals.update(s => ({ ...s, [`modal-${id}`]: { open: isActive } }))\\n    }\\n\\n    let xSwipe = 0\\n    let ySwipe = 0\\n\\n    function addSwipe(el) {\\n        stopPropagationInRanges(el, THRESHOLD_RANGES, ({ x, y }) => {\\n            isAllowed = {\\n                up: y <= THRESHOLD_RANGES.y[0],\\n                down: y >= THRESHOLD_RANGES.y[1],\\n                left: x <= THRESHOLD_RANGES.x[0] || x >= THRESHOLD_RANGES.x[1],\\n                right: x <= THRESHOLD_RANGES.x[0] || x >= THRESHOLD_RANGES.x[1],\\n            } \\n        })\\n\\n        new Swipe(el)\\n                .run()\\n                .onUp(isSwipe.up ? handleVerticalSwipe : null)\\n                .onDown(isSwipe.down ? handleVerticalSwipe : null)\\n                .onLeft(isSwipe.left ? handleHorizontalSwipe : null)\\n                .onRight(isSwipe.right ? handleHorizontalSwipe : null)\\n                .onTouchEnd(async () => {\\n                    const shift = 50\\n\\n                    if (xSwipe > THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        setActive(false)\\n                        drawOpacity(el, xSwipe + shift, ySwipe)\\n                        drawOpacity(refHeader, xSwipe + shift, ySwipe)\\n                        drawTransform(el, xSwipe + shift, ySwipe)\\n                        drawTransform(refHeader, xSwipe + shift, ySwipe)\\n                        await delay(DURATION)\\n                    } else if (xSwipe < -THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        setActive(false)\\n                        drawOpacity(el, xSwipe - shift, ySwipe)\\n                        drawOpacity(refHeader, xSwipe - shift, ySwipe)\\n                        drawTransform(el, xSwipe - shift, ySwipe)\\n                        drawTransform(refHeader, xSwipe - shift, ySwipe)\\n                        await delay(DURATION)\\n                    }\\n                    \\n                    if (ySwipe > THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        setActive(false)\\n                        drawOpacity(el, xSwipe, ySwipe + shift)\\n                        drawOpacity(refHeader, xSwipe, ySwipe + shift)\\n                        drawTransform(el, xSwipe, ySwipe + shift)\\n                        drawTransform(refHeader, xSwipe, ySwipe + shift)\\n                        await delay(DURATION)\\n                    } else if (ySwipe < -THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        setActive(false)\\n                        drawOpacity(el, xSwipe, ySwipe - shift)\\n                        drawOpacity(refHeader, xSwipe, ySwipe - shift)\\n                        drawTransform(el, xSwipe, ySwipe - shift)\\n                        drawTransform(refHeader, xSwipe, ySwipe - shift)\\n                        await delay(DURATION)\\n                    }\\n\\n                    if (xSwipe <= THRESHOLD && xSwipe >= -THRESHOLD && ySwipe <= THRESHOLD && ySwipe >= -THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        drawTransform(el, 0, 0)\\n                        drawTransform(refHeader, 0, 0)\\n                    } else {\\n                        setStartPosition()\\n                    }\\n\\n                    xSwipe = 0\\n                    ySwipe = 0\\n                    el.style.opacity = null\\n                    refHeader.style.opacity = null\\n                })\\n    }\\n\\n    function handleVerticalSwipe(yDown, yUp, evt, el) {\\n        const dir = yUp - yDown\\n        if (!isAllowed.up && dir > 0 || !isAllowed.down && dir < 0) return\\n        ySwipe = dir * SWIPE_SPEED\\n        drawTransform(el, xSwipe, ySwipe)\\n        drawTransform(refHeader, xSwipe, ySwipe)\\n        drawOpacity(el, xSwipe, ySwipe)\\n        drawOpacity(refHeader, xSwipe, ySwipe)\\n    }\\n    function handleHorizontalSwipe(xDown, xUp, evt, el) {\\n        const dir = xUp - xDown\\n        if (!isAllowed.left && dir > 0 || !isAllowed.right && dir < 0) return\\n        xSwipe = dir * SWIPE_SPEED\\n        drawTransform(el, xSwipe, ySwipe)\\n        drawTransform(refHeader, xSwipe, ySwipe)\\n        drawOpacity(el, xSwipe, ySwipe)\\n        drawOpacity(refHeader, xSwipe, ySwipe)\\n    }\\n\\n    function setStartPosition() {\\n        drawTransform(ref, startPosition.x, startPosition.y)\\n        drawTransform(refHeader, startPosition.x, startPosition.y)\\n    }\\n\\n    function drawTransform(el, x, y) {\\n        const delta = Math.abs(x) > Math.abs(y) ? x : y\\n        let scale = 1 - Math.abs(delta / window.innerHeight)\\n        el && (el.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${x}, ${y})`)\\n    }\\n     function setDuration(el, ms) {\\n        el && (el.style.transitionDuration = `${ms}ms`)\\n    }\\n    function drawOpacity(el, x, y) {\\n        const delta = Math.abs(x) > Math.abs(y) ? x : y\\n        el && (el.style.opacity = 1 - Math.min(Math.abs(delta / (THRESHOLD * 1.5)), 1))\\n    }\\n\\n    function appear(node, params) {\\n        if (!active) return\\n\\t\\tconst existingTransform = getComputedStyle(node).transform.replace('none', '');\\n        const getScale = t => .9 + .1 * t\\n        const getX = t => startPosition.x - startPosition.x * t\\n\\t\\treturn {\\n\\t\\t\\tduration: DURATION,\\n\\t\\t\\tcss: (t) => `opacity: ${t}; transform: matrix(${getScale(t)}, 0, 0, ${getScale(t)}, ${getX(t)}, 0)`\\n\\t\\t};\\n    }\\n\\n    function onCloseModal() {\\n        setDuration(ref, DURATION)\\n        setDuration(refHeader, DURATION)\\n        setTimeout(() => setDuration(ref, 0), DURATION)\\n        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n        setStartPosition()\\n        drawOpacity(ref, startPosition.x * 2, startPosition.y)\\n        drawOpacity(refHeader, startPosition.x * 2, startPosition.y)\\n        setTimeout(() => setActive(false), DURATION)\\n    }\\n</script>\\n\\n{#if active !== null}\\n    <Portal>\\n        <div\\n            id={`modal-${id}`}\\n            bind:this={ref}\\n            aria-hidden=\\\"true\\\" \\n            class={classProp}\\n            use:addSwipe\\n            in:appear\\n            on:click={setActive.bind(null, false)}\\n        >\\n            {#if withHeader}\\n                <Portal>\\n                    <slot name=\\\"header\\\">\\n                        <button \\n                            type=\\\"button\\\"\\n                            class={classnames('modal-header', { active })}\\n                            in:appear\\n                            bind:this={refHeader}\\n                            on:click={onCloseModal}\\n                        >\\n                            <h2 style=\\\"padding: 15px 20px\\\">Закрити</h2>\\n                            <span class=\\\"close\\\">&#10005;</span>\\n                        </button>\\n                    </slot>\\n                </Portal>   \\n                <Br size=\\\"60\\\"/>\\n            {/if}\\n            <div\\n                class=\\\"modal-inner\\\"\\n                tabindex=\\\"-1\\\"\\n                role=\\\"dialog\\\"\\n                aria-modal=\\\"true\\\"\\n                aria-labelledby=\\\"модальне вікно\\\"\\n                on:click={e => e.stopPropagation()}\\n            >\\n                <slot props={safeGet(() => $modals[`modal-${id}`], {}, true)}/>\\n            </div>\\n        </div>\\n    </Portal>\\n{/if}\\n\\n<style>\\n    .modal {\\n        z-index: 8;\\n        position: fixed;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow-x: hidden;\\n        overflow-y: auto;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        -ms-touch-action: manipulation;\\n            touch-action: manipulation;\\n        -webkit-user-select: none;\\n           -moz-user-select: none;\\n            -ms-user-select: none;\\n                user-select: none;\\n        background-color: rgba(var(--color-black), .75);\\n        outline: 150px solid rgba(var(--color-black), .75);\\n        -webkit-transition-timing-function: ease-out;\\n                transition-timing-function: ease-out;\\n        opacity: 0;\\n        pointer-events: none;\\n    }\\n\\n    .modal.active, .modal-header.active {\\n        opacity: 1;\\n        pointer-events: auto;\\n    }\\n\\n    .modal-inner {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n        overflow: hidden;\\n        background-color: rgba(var(--theme-color-primary));\\n    }\\n    .small .modal-inner {\\n        width: 200px;\\n        border-radius: var(--border-radius-big);\\n    }\\n\\n    .medium .modal-inner {\\n        width: calc(100vw - var(--screen-padding) * 2);\\n        border-radius: var(--border-radius-big);\\n    }\\n    .big .modal-inner {\\n        width: calc(100% - var(--screen-padding) * 2);\\n        height: calc(100% - var(--screen-padding) * 2);\\n        border-radius: var(--border-radius-big);\\n    }\\n\\n    .full {\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n    }\\n\\n    .full .modal-inner {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        width: 100%;\\n        min-height: 100%;\\n        border-radius: 0;\\n    }\\n\\n    .modal-header {\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n        z-index: 9;\\n        position: fixed;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: justify;\\n            -ms-flex-pack: justify;\\n                justify-content: space-between;\\n        color: rgb(var(--color-white));\\n        background-color: rgb(var(--color-info));\\n        opacity: 0;\\n        pointer-events: none;\\n        -webkit-transform-origin: 50% 50vh;\\n                transform-origin: 50% 50vh;\\n    }\\n\\n    .modal-header .close {\\n        font-size: 24px;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 60px;\\n        height: 60px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL01vZGFsLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxVQUFVO1FBQ1YsZUFBZTtRQUNmLE1BQU07UUFDTixPQUFPO1FBQ1AsV0FBVztRQUNYLFlBQVk7UUFDWixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLGtCQUFrQjtRQUNsQixnQkFBZ0I7UUFDaEIseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2Qiw0QkFBc0I7UUFBdEIsNkJBQXNCO1lBQXRCLDBCQUFzQjtnQkFBdEIsc0JBQXNCO1FBQ3RCLDhCQUEwQjtZQUExQiwwQkFBMEI7UUFDMUIseUJBQWlCO1dBQWpCLHNCQUFpQjtZQUFqQixxQkFBaUI7Z0JBQWpCLGlCQUFpQjtRQUNqQiwrQ0FBK0M7UUFDL0Msa0RBQWtEO1FBQ2xELDRDQUFvQztnQkFBcEMsb0NBQW9DO1FBQ3BDLFVBQVU7UUFDVixvQkFBb0I7SUFDeEI7O0lBRUE7UUFDSSxVQUFVO1FBQ1Ysb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYiw0QkFBc0I7UUFBdEIsNkJBQXNCO1lBQXRCLDBCQUFzQjtnQkFBdEIsc0JBQXNCO1FBQ3RCLDBCQUFvQjtZQUFwQix1QkFBb0I7Z0JBQXBCLG9CQUFvQjtRQUNwQix5QkFBd0I7WUFBeEIsc0JBQXdCO2dCQUF4Qix3QkFBd0I7UUFDeEIsZ0JBQWdCO1FBQ2hCLGtEQUFrRDtJQUN0RDtJQUNBO1FBQ0ksWUFBWTtRQUNaLHVDQUF1QztJQUMzQzs7SUFFQTtRQUNJLDhDQUE4QztRQUM5Qyx1Q0FBdUM7SUFDM0M7SUFDQTtRQUNJLDZDQUE2QztRQUM3Qyw4Q0FBOEM7UUFDOUMsdUNBQXVDO0lBQzNDOztJQUVBO1FBQ0ksMEJBQW9CO1lBQXBCLHVCQUFvQjtnQkFBcEIsb0JBQW9CO1FBQ3BCLHlCQUF3QjtZQUF4QixzQkFBd0I7Z0JBQXhCLHdCQUF3QjtJQUM1Qjs7SUFFQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsV0FBVztRQUNYLGdCQUFnQjtRQUNoQixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxnQ0FBd0I7Z0JBQXhCLHdCQUF3QjtRQUN4QixVQUFVO1FBQ1YsZUFBZTtRQUNmLE1BQU07UUFDTixPQUFPO1FBQ1AsV0FBVztRQUNYLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHlCQUE4QjtZQUE5QixzQkFBOEI7Z0JBQTlCLDhCQUE4QjtRQUM5Qiw4QkFBOEI7UUFDOUIsd0NBQXdDO1FBQ3hDLFVBQVU7UUFDVixvQkFBb0I7UUFDcEIsa0NBQTBCO2dCQUExQiwwQkFBMEI7SUFDOUI7O0lBRUE7UUFDSSxlQUFlO1FBQ2Ysb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLFdBQVc7UUFDWCxZQUFZO0lBQ2hCIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL01vZGFsLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5tb2RhbCB7XG4gICAgICAgIHotaW5kZXg6IDg7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICB0b3VjaC1hY3Rpb246IG1hbmlwdWxhdGlvbjtcbiAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuNzUpO1xuICAgICAgICBvdXRsaW5lOiAxNTBweCBzb2xpZCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgLjc1KTtcbiAgICAgICAgdHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb246IGVhc2Utb3V0O1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICB9XG5cbiAgICAubW9kYWwuYWN0aXZlLCAubW9kYWwtaGVhZGVyLmFjdGl2ZSB7XG4gICAgICAgIG9wYWNpdHk6IDE7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xuICAgIH1cblxuICAgIC5tb2RhbC1pbm5lciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtY29sb3ItcHJpbWFyeSkpO1xuICAgIH1cbiAgICAuc21hbGwgLm1vZGFsLWlubmVyIHtcbiAgICAgICAgd2lkdGg6IDIwMHB4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzLWJpZyk7XG4gICAgfVxuXG4gICAgLm1lZGl1bSAubW9kYWwtaW5uZXIge1xuICAgICAgICB3aWR0aDogY2FsYygxMDB2dyAtIHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDIpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzLWJpZyk7XG4gICAgfVxuICAgIC5iaWcgLm1vZGFsLWlubmVyIHtcbiAgICAgICAgd2lkdGg6IGNhbGMoMTAwJSAtIHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDIpO1xuICAgICAgICBoZWlnaHQ6IGNhbGMoMTAwJSAtIHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDIpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzLWJpZyk7XG4gICAgfVxuXG4gICAgLmZ1bGwge1xuICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgIH1cblxuICAgIC5mdWxsIC5tb2RhbC1pbm5lciB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBtaW4taGVpZ2h0OiAxMDAlO1xuICAgICAgICBib3JkZXItcmFkaXVzOiAwO1xuICAgIH1cblxuICAgIC5tb2RhbC1oZWFkZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooMCk7XG4gICAgICAgIHotaW5kZXg6IDk7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBjb2xvcjogcmdiKHZhcigtLWNvbG9yLXdoaXRlKSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiA1MCUgNTB2aDtcbiAgICB9XG5cbiAgICAubW9kYWwtaGVhZGVyIC5jbG9zZSB7XG4gICAgICAgIGZvbnQtc2l6ZTogMjRweDtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIHdpZHRoOiA2MHB4O1xuICAgICAgICBoZWlnaHQ6IDYwcHg7XG4gICAgfVxuIl19 */</style>   \"],\"names\":[],\"mappings\":\"AA4RI,MAAM,8BAAC,CAAC,AACJ,OAAO,CAAE,CAAC,CACV,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,gBAAgB,CAAE,YAAY,CAC1B,YAAY,CAAE,YAAY,CAC9B,mBAAmB,CAAE,IAAI,CACtB,gBAAgB,CAAE,IAAI,CACrB,eAAe,CAAE,IAAI,CACjB,WAAW,CAAE,IAAI,CACzB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAC/C,OAAO,CAAE,KAAK,CAAC,KAAK,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,kCAAkC,CAAE,QAAQ,CACpC,0BAA0B,CAAE,QAAQ,CAC5C,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,MAAM,qCAAO,CAAE,aAAa,OAAO,8BAAC,CAAC,AACjC,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,YAAY,8BAAC,CAAC,AACV,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,CAChC,QAAQ,CAAE,MAAM,CAChB,gBAAgB,CAAE,KAAK,IAAI,qBAAqB,CAAC,CAAC,AACtD,CAAC,AACD,qBAAM,CAAC,YAAY,eAAC,CAAC,AACjB,KAAK,CAAE,KAAK,CACZ,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC3C,CAAC,AAED,sBAAO,CAAC,YAAY,eAAC,CAAC,AAClB,KAAK,CAAE,KAAK,KAAK,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9C,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC3C,CAAC,AACD,mBAAI,CAAC,YAAY,eAAC,CAAC,AACf,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC7C,MAAM,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9C,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC3C,CAAC,AAED,KAAK,8BAAC,CAAC,AACH,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,AACpC,CAAC,AAED,oBAAK,CAAC,YAAY,eAAC,CAAC,AAChB,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,IAAI,CAChB,aAAa,CAAE,CAAC,AACpB,CAAC,AAED,aAAa,8BAAC,CAAC,AACX,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,CAChC,OAAO,CAAE,CAAC,CACV,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,aAAa,CACtC,KAAK,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAC9B,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CACxC,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,CACpB,wBAAwB,CAAE,GAAG,CAAC,IAAI,CAC1B,gBAAgB,CAAE,GAAG,CAAC,IAAI,AACtC,CAAC,AAED,4BAAa,CAAC,MAAM,eAAC,CAAC,AAClB,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC\"}"
};

const DURATION$1 = 250;
const THRESHOLD = 50;

function drawTransform(el, x, y) {
	const delta = Math.abs(x) > Math.abs(y) ? x : y;
	let scale = 1 - Math.abs(delta / window.innerHeight);
	el && (el.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${x}, ${y})`);
}

function setDuration(el, ms) {
	el && (el.style.transitionDuration = `${ms}ms`);
}

function drawOpacity(el, x, y) {
	const delta = Math.abs(x) > Math.abs(y) ? x : y;
	el && (el.style.opacity = 1 - Math.min(Math.abs(delta / (THRESHOLD * 1.5)), 1));
}

const Modal = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $modals = get_store_value(modals);
	const dispatch = createEventDispatcher();
	const START_POSITION = { x: 50, y: 0 };
	let { id } = $$props;
	let { ref = null } = $$props;
	let { size = "full" } = $$props; // small/medium/big/full
	let { swipe = [] } = $$props; // up down left right all
	let { open = null } = $$props;
	let { startPosition = START_POSITION } = $$props;
	let { blockBody = true } = $$props;
	let { withHeader = true } = $$props;
	let active;
	let refHeader;
	let isBodyBlocked = false;

	function blockScroll(modal) {
		if (blockBody && active && !isBodyBlocked) {
			disableScroll(modal, { extraLock: size === "full" });
			isBodyBlocked = true;
			modal && (modal.scrollTop = 0);
		} else if (blockBody && !active && isBodyBlocked) {
			enableScroll(modal, { extraLock: size === "full" });
			isBodyBlocked = false;
		}
	}

	async function onActiveChange(active) {
		if (active) {
			setDuration(ref, DURATION$1);
			setDuration(refHeader, DURATION$1);
			setTimeout(() => setDuration(ref, 0), DURATION$1);
			setTimeout(() => setDuration(refHeader, 0), DURATION$1);
			drawTransform(ref, 0, 0);
			drawTransform(refHeader, 0, 0);
			drawOpacity(ref, 0, 0);
			drawOpacity(refHeader, 0, 0);
			blockScroll(ref);
			await tick();
			dispatch("open");
		} else {
			blockScroll(ref);
			await tick();
			dispatch("close");
		}
	}

	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.ref === void 0 && $$bindings.ref && ref !== void 0) $$bindings.ref(ref);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.swipe === void 0 && $$bindings.swipe && swipe !== void 0) $$bindings.swipe(swipe);
	if ($$props.open === void 0 && $$bindings.open && open !== void 0) $$bindings.open(open);
	if ($$props.startPosition === void 0 && $$bindings.startPosition && startPosition !== void 0) $$bindings.startPosition(startPosition);
	if ($$props.blockBody === void 0 && $$bindings.blockBody && blockBody !== void 0) $$bindings.blockBody(blockBody);
	if ($$props.withHeader === void 0 && $$bindings.withHeader && withHeader !== void 0) $$bindings.withHeader(withHeader);
	$$result.css.add(css$5);

	let isSwipe = {
		up: safeGet(() => swipe.includes("up") || swipe.includes("all")),
		down: safeGet(() => swipe.includes("down") || swipe.includes("all")),
		left: safeGet(() => swipe.includes("left") || swipe.includes("all")),
		right: safeGet(() => swipe.includes("right") || swipe.includes("all"))
	};

	let scrollY = ref && ref.scrollTop;
	active = safeGet(() => open !== null ? open : $modals[`modal-${id}`].open, null);
	let classProp = classnames("modal", size, { active });

	 {
		onActiveChange(active);
	}

	 {
		blockScroll(ref);
	}

	return `${active !== null
	? `${validate_component(Portal, "Portal").$$render($$result, {}, {}, {
			default: () => `
        <div${add_attribute("id", `modal-${id}`, 0)} aria-hidden="${"true"}" class="${escape(null_to_empty(classProp)) + " svelte-1r5lpit"}"${add_attribute("this", ref, 1)}>
            ${withHeader
			? `${validate_component(Portal, "Portal").$$render($$result, {}, {}, {
					default: () => `
                    ${$$slots.header
					? $$slots.header({
							props: safeGet(() => $modals[`modal-${id}`], {}, true)
						})
					: `
                        <button type="${"button"}" class="${escape(null_to_empty(classnames("modal-header", { active }))) + " svelte-1r5lpit"}"${add_attribute("this", refHeader, 1)}>
                            <h2 style="${"padding: 15px 20px"}">Закрити</h2>
                            <span class="${"close svelte-1r5lpit"}">✕</span>
                        </button>
                    `}
                `
				})}   
                ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}`
			: ``}
            <div class="${"modal-inner svelte-1r5lpit"}" tabindex="${"-1"}" role="${"dialog"}" aria-modal="${"true"}" aria-labelledby="${"модальне вікно"}">
                ${$$slots.default
			? $$slots.default({
					props: safeGet(() => $modals[`modal-${id}`], {}, true)
				})
			: ``}
            </div>
        </div>
    `
		})}`
	: ``}`;
});

/* src/components/Picture.svelte generated by Svelte v3.18.1 */

const css$6 = {
	code: ".picture.svelte-dk028u.svelte-dk028u{position:relative;-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;-ms-flex-item-align:stretch;align-self:stretch;display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch;background-color:rgba(var(--theme-bg-color-opposite), .04)}.picture.svelte-dk028u .pic.svelte-dk028u{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;overflow:hidden;-ms-flex-item-align:stretch;align-self:stretch;-o-object-position:center;object-position:center;-webkit-transition:opacity .3s ease-in;transition:opacity .3s ease-in}.picture.svelte-dk028u .pic-2x.svelte-dk028u{position:absolute;top:0;left:0;width:100%;height:100%}.picture.cover.svelte-dk028u .pic.svelte-dk028u{-o-object-fit:cover;object-fit:cover}.picture.contain.svelte-dk028u .pic.svelte-dk028u{-o-object-fit:contain;object-fit:contain}.picture.isErrorSmall.svelte-dk028u .pic-1x.svelte-dk028u,.picture.isErrorBig.svelte-dk028u .pic-2x.svelte-dk028u,.picture.loadingSrcSmall.svelte-dk028u .pic-1x.svelte-dk028u,.picture.loadingSrcBig.svelte-dk028u .pic-2x.svelte-dk028u{opacity:0}",
	map: "{\"version\":3,\"file\":\"Picture.svelte\",\"sources\":[\"Picture.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '@utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let src\\n    export let alt\\n    export let size = 'cover'\\n    export let srcBig = undefined\\n    export let id = undefined\\n    export let width = undefined\\n    export let height = undefined\\n\\n    let loadingSrcSmall = true\\n    let loadingSrcBig = true\\n    let isErrorSmall = false\\n    let isErrorBig = false\\n\\n    $: wrapClassProp = classnames('picture', $$props.class, size, { loadingSrcSmall, loadingSrcBig, isErrorSmall, isErrorBig })\\n\\n    function imgService(node, postFix) {\\n        if (node.complete) {\\n            onLoad(node, postFix)\\n        } else {\\n            node.onload = onLoad.bind(null, node, postFix)\\n            node.onerror = onError.bind(null, node, postFix)\\n        }\\n    }\\n\\n    function onLoad(node, postFix) {\\n        changeLoading(postFix, false)\\n        changeError(postFix, false)\\n        dispatch(`load${postFix}`, node)\\n\\n        if (!srcBig || !loadingSrcBig) {\\n            dispatch('load', node)\\n        }\\n    }\\n\\n    function onError(node, postFix) {\\n        changeLoading(postFix, false)\\n        changeError(postFix, true)\\n        dispatch(`error${postFix}`, node)\\n    }\\n\\n    function changeLoading(type, isLoading) {\\n        switch (type) {\\n            case 'Small':\\n                loadingSrcSmall = isLoading\\n                break\\n            case 'Big':\\n                loadingSrcBig = isLoading\\n                break\\n        }\\n    }\\n\\n    function changeError(type, isError) {\\n        switch (type) {\\n            case 'Small':\\n                isErrorSmall = isError\\n                break\\n            case 'Big':\\n                isErrorBig = isError\\n                break\\n        }\\n    }\\n\\n</script>\\n\\n<figure class={wrapClassProp}>\\n    {#if src}\\n        <img\\n            use:imgService={'Small'}\\n            {id}\\n            {alt}\\n            {src}\\n            {width}\\n            {height}\\n            class=\\\"pic pic-1x\\\"\\n        />\\n    {/if}\\n\\n    {#if srcBig && !loadingSrcSmall}\\n        <img\\n            use:imgService={'Big'}\\n            {alt}\\n            {width}\\n            {height}\\n            src={srcBig}\\n            class=\\\"pic pic-2x\\\"\\n        />\\n    {/if}\\n\\n    <figcaption>\\n        <slot></slot>\\n    </figcaption>\\n</figure>\\n\\n<style>\\n    .picture {\\n        position: relative;\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        display: -webkit-inline-box;\\n        display: -ms-inline-flexbox;\\n        display: inline-flex;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n        background-color: rgba(var(--theme-bg-color-opposite), .04);\\n    }\\n\\n    .picture .pic {\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        overflow: hidden;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -o-object-position: center;\\n           object-position: center;\\n        -webkit-transition: opacity .3s ease-in;\\n        transition: opacity .3s ease-in;\\n    }\\n\\n    .picture .pic-2x {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n    }\\n\\n    .picture.cover .pic {\\n        -o-object-fit: cover;\\n           object-fit: cover;\\n    }\\n\\n    .picture.contain .pic {\\n        -o-object-fit: contain;\\n           object-fit: contain;\\n    }\\n\\n    .picture.isErrorSmall .pic-1x,\\n    .picture.isErrorBig .pic-2x,\\n    .picture.loadingSrcSmall .pic-1x,\\n    .picture.loadingSrcBig .pic-2x {\\n        opacity: 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL1BpY3R1cmUuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGtCQUFrQjtRQUNsQixtQkFBWTtZQUFaLG9CQUFZO2dCQUFaLFlBQVk7UUFDWiw0QkFBbUI7WUFBbkIsbUJBQW1CO1FBQ25CLDJCQUFvQjtRQUFwQiwyQkFBb0I7UUFBcEIsb0JBQW9CO1FBQ3BCLDRCQUFzQjtRQUF0Qiw2QkFBc0I7WUFBdEIsMEJBQXNCO2dCQUF0QixzQkFBc0I7UUFDdEIsMEJBQW9CO1lBQXBCLHVCQUFvQjtnQkFBcEIsb0JBQW9CO1FBQ3BCLHlCQUF3QjtZQUF4QixzQkFBd0I7Z0JBQXhCLHdCQUF3QjtRQUN4QiwyREFBMkQ7SUFDL0Q7O0lBRUE7UUFDSSxtQkFBWTtZQUFaLG9CQUFZO2dCQUFaLFlBQVk7UUFDWixnQkFBZ0I7UUFDaEIsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiwwQkFBdUI7V0FBdkIsdUJBQXVCO1FBQ3ZCLHVDQUErQjtRQUEvQiwrQkFBK0I7SUFDbkM7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsTUFBTTtRQUNOLE9BQU87UUFDUCxXQUFXO1FBQ1gsWUFBWTtJQUNoQjs7SUFFQTtRQUNJLG9CQUFpQjtXQUFqQixpQkFBaUI7SUFDckI7O0lBRUE7UUFDSSxzQkFBbUI7V0FBbkIsbUJBQW1CO0lBQ3ZCOztJQUVBOzs7O1FBSUksVUFBVTtJQUNkIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL1BpY3R1cmUuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnBpY3R1cmUge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3Itb3Bwb3NpdGUpLCAuMDQpO1xuICAgIH1cblxuICAgIC5waWN0dXJlIC5waWMge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIG9iamVjdC1wb3NpdGlvbjogY2VudGVyO1xuICAgICAgICB0cmFuc2l0aW9uOiBvcGFjaXR5IC4zcyBlYXNlLWluO1xuICAgIH1cblxuICAgIC5waWN0dXJlIC5waWMtMngge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIHRvcDogMDtcbiAgICAgICAgbGVmdDogMDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICB9XG5cbiAgICAucGljdHVyZS5jb3ZlciAucGljIHtcbiAgICAgICAgb2JqZWN0LWZpdDogY292ZXI7XG4gICAgfVxuXG4gICAgLnBpY3R1cmUuY29udGFpbiAucGljIHtcbiAgICAgICAgb2JqZWN0LWZpdDogY29udGFpbjtcbiAgICB9XG5cbiAgICAucGljdHVyZS5pc0Vycm9yU21hbGwgLnBpYy0xeCxcbiAgICAucGljdHVyZS5pc0Vycm9yQmlnIC5waWMtMngsXG4gICAgLnBpY3R1cmUubG9hZGluZ1NyY1NtYWxsIC5waWMtMXgsXG4gICAgLnBpY3R1cmUubG9hZGluZ1NyY0JpZyAucGljLTJ4IHtcbiAgICAgICAgb3BhY2l0eTogMDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAoGI,QAAQ,4BAAC,CAAC,AACN,QAAQ,CAAE,QAAQ,CAClB,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,WAAW,CACpB,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,CAChC,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC/D,CAAC,AAED,sBAAQ,CAAC,IAAI,cAAC,CAAC,AACX,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,QAAQ,CAAE,MAAM,CAChB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,kBAAkB,CAAE,MAAM,CACvB,eAAe,CAAE,MAAM,CAC1B,kBAAkB,CAAE,OAAO,CAAC,GAAG,CAAC,OAAO,CACvC,UAAU,CAAE,OAAO,CAAC,GAAG,CAAC,OAAO,AACnC,CAAC,AAED,sBAAQ,CAAC,OAAO,cAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,QAAQ,oBAAM,CAAC,IAAI,cAAC,CAAC,AACjB,aAAa,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,AACxB,CAAC,AAED,QAAQ,sBAAQ,CAAC,IAAI,cAAC,CAAC,AACnB,aAAa,CAAE,OAAO,CACnB,UAAU,CAAE,OAAO,AAC1B,CAAC,AAED,QAAQ,2BAAa,CAAC,qBAAO,CAC7B,QAAQ,yBAAW,CAAC,qBAAO,CAC3B,QAAQ,8BAAgB,CAAC,qBAAO,CAChC,QAAQ,4BAAc,CAAC,OAAO,cAAC,CAAC,AAC5B,OAAO,CAAE,CAAC,AACd,CAAC\"}"
};

const Picture = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { src } = $$props;
	let { alt } = $$props;
	let { size = "cover" } = $$props;
	let { srcBig = undefined } = $$props;
	let { id = undefined } = $$props;
	let { width = undefined } = $$props;
	let { height = undefined } = $$props;
	let loadingSrcSmall = true;
	let loadingSrcBig = true;
	let isErrorSmall = false;
	let isErrorBig = false;

	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.srcBig === void 0 && $$bindings.srcBig && srcBig !== void 0) $$bindings.srcBig(srcBig);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
	$$result.css.add(css$6);

	let wrapClassProp = classnames("picture", $$props.class, size, {
		loadingSrcSmall,
		loadingSrcBig,
		isErrorSmall,
		isErrorBig
	});

	return `<figure class="${escape(null_to_empty(wrapClassProp)) + " svelte-dk028u"}">
    ${src
	? `<img${add_attribute("id", id, 0)}${add_attribute("alt", alt, 0)}${add_attribute("src", src, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} class="${"pic pic-1x svelte-dk028u"}">`
	: ``}

    ${srcBig && !loadingSrcSmall
	? `<img${add_attribute("alt", alt, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("src", srcBig, 0)} class="${"pic pic-2x svelte-dk028u"}">`
	: ``}

    <figcaption>
        ${$$slots.default ? $$slots.default({}) : ``}
    </figcaption>
</figure>`;
});

/* src/components/Avatar.svelte generated by Svelte v3.18.1 */

const css$7 = {
	code: ".ava.svelte-1vccfih{position:relative;-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;display:-webkit-box;display:-ms-flexbox;display:flex;border-radius:50%;overflow:hidden;-webkit-transform:translateZ(0);transform:translateZ(0)}.ava.small.svelte-1vccfih{-webkit-box-flex:0;-ms-flex:none;flex:none;width:30px;height:30px}.ava.medium.svelte-1vccfih{-webkit-box-flex:0;-ms-flex:none;flex:none;width:60px;height:60px}.ava.big.svelte-1vccfih{-webkit-box-flex:0;-ms-flex:none;flex:none;width:130px;height:130px}",
	map: "{\"version\":3,\"file\":\"Avatar.svelte\",\"sources\":[\"Avatar.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '@utils'\\n    import Picture from './Picture.svelte'\\n\\n    export let src\\n    export let alt\\n    export let size = null // small|medium|big\\n    export let srcBig = undefined\\n\\n    $: classProp = classnames('ava', size, $$props.class)\\n</script>\\n\\n<div class={classProp}>\\n    <Picture {src} {srcBig} {alt}/>\\n</div>\\n\\n<style>\\n    .ava {\\n        position: relative;\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n    }\\n\\n    .ava.small {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        width: 30px;\\n        height: 30px;\\n    }\\n    .ava.medium {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        width: 60px;\\n        height: 60px;\\n    }\\n    .ava.big {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        width: 130px;\\n        height: 130px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0F2YXRhci5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksa0JBQWtCO1FBQ2xCLG1CQUFZO1lBQVosb0JBQVk7Z0JBQVosWUFBWTtRQUNaLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2Isa0JBQWtCO1FBQ2xCLGdCQUFnQjtRQUNoQixnQ0FBd0I7Z0JBQXhCLHdCQUF3QjtJQUM1Qjs7SUFFQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsV0FBVztRQUNYLFlBQVk7SUFDaEI7SUFDQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsV0FBVztRQUNYLFlBQVk7SUFDaEI7SUFDQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsWUFBWTtRQUNaLGFBQWE7SUFDakIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvQXZhdGFyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5hdmEge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooMCk7XG4gICAgfVxuXG4gICAgLmF2YS5zbWFsbCB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIHdpZHRoOiAzMHB4O1xuICAgICAgICBoZWlnaHQ6IDMwcHg7XG4gICAgfVxuICAgIC5hdmEubWVkaXVtIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgd2lkdGg6IDYwcHg7XG4gICAgICAgIGhlaWdodDogNjBweDtcbiAgICB9XG4gICAgLmF2YS5iaWcge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICB3aWR0aDogMTMwcHg7XG4gICAgICAgIGhlaWdodDogMTMwcHg7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAiBI,IAAI,eAAC,CAAC,AACF,QAAQ,CAAE,QAAQ,CAClB,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,AACpC,CAAC,AAED,IAAI,MAAM,eAAC,CAAC,AACR,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,IAAI,OAAO,eAAC,CAAC,AACT,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,IAAI,IAAI,eAAC,CAAC,AACN,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,AACjB,CAAC\"}"
};

const Avatar = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	let { alt } = $$props;
	let { size = null } = $$props; // small|medium|big
	let { srcBig = undefined } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.srcBig === void 0 && $$bindings.srcBig && srcBig !== void 0) $$bindings.srcBig(srcBig);
	$$result.css.add(css$7);
	let classProp = classnames("ava", size, $$props.class);

	return `<div class="${escape(null_to_empty(classProp)) + " svelte-1vccfih"}">
    ${validate_component(Picture, "Picture").$$render($$result, { src, srcBig, alt }, {}, {})}
</div>`;
});

/* src/components/Button.svelte generated by Svelte v3.18.1 */

const css$8 = {
	code: ".btn.svelte-1kjrxjx:not(.auto){width:100%;padding:5px 15px}.btn{-webkit-box-flex:0;-ms-flex:none;flex:none;cursor:pointer;max-width:100%;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;font-weight:bold;text-align:center;-webkit-box-align:center;-ms-flex-align:center;align-items:center;display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;color:rgba(var(--theme-font-color));border-radius:var(--border-radius-medium)}.btn.small{padding:5px;min-width:calc(var(--min-interactive-size) / 1.3);min-height:calc(var(--min-interactive-size) / 1.3)}.btn.medium{padding:5px 10px;min-width:var(--min-interactive-size);min-height:var(--min-interactive-size)}.btn.big{padding:5px 15px;min-width:calc(var(--min-interactive-size) * 1.3);min-height:calc(var(--min-interactive-size) * 1.3)}.btn:focus{background-color:rgba(var(--color-black), 0.1)}.btn:hover{background-color:rgba(var(--color-black), 0.1)}.btn:active{background-color:rgba(var(--color-black), 0.1)}.btn.theme{color:rgba(var(--theme-font-color));background-color:rgba(var(--theme-color-secondary))}.btn.theme:focus{background-color:rgba(var(--theme-color-secondary), .85)}.btn.theme:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.theme:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.theme-border{color:rgba(var(--theme-font-color));border:2px solid rgba(var(--theme-color-primary-opposite))}.btn.theme-border:focus{background-color:rgba(var(--theme-color-secondary), .85)}.btn.them-border:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.theme-border:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.white{color:rgba(var(--color-font-dark));background-color:rgba(var(--color-white))}.btn.white:focus{background-color:rgba(var(--color-white), .85)}.btn.white:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.white:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.dark{color:rgba(var(--color-font-light));background-color:rgba(var(--color-dark))}.btn.dark:focus{background-color:rgba(var(--color-dark), .85)}.btn.dark:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.dark:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.dark-border{color:rgba(var(--color-font-dark));border:2px solid rgba(var(--color-dark))}.btn.dark-border:focus{background-color:rgba(var(--color-dark), .85)}.btn.dark-border:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.dark-border:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.success{color:rgba(var(--color-font-light));background-color:rgba(var(--color-success))}.btn.success:focus{background-color:rgba(var(--color-success), .85)}.btn.success:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.success:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.warning{color:rgba(var(--color-font-light));background-color:rgba(var(--color-warning))}.btn.warning:focus{background-color:rgba(var(--color-warning), .85)}.btn.warning:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.warning:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.info{color:rgba(var(--color-font-light));background-color:rgba(var(--color-info))}.btn.info:focus{background-color:rgba(var(--color-info), .85)}.btn.info:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.info:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.danger{color:rgba(var(--color-font-light));background-color:rgba(var(--color-danger))}.btn.danger:focus{background-color:rgba(var(--color-danger), .85)}.btn.danger:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.danger:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}",
	map: "{\"version\":3,\"file\":\"Button.svelte\",\"sources\":[\"Button.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '@utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let is = undefined // theme, theme-border, white, success, warning, danger, dark, dark-border\\n    export let id = undefined\\n    export let rel = undefined\\n    export let href = undefined\\n    export let auto = false\\n    export let type = 'button'\\n    export let form = undefined\\n    export let size = undefined\\n    export let title = undefined\\n    export let style = undefined\\n    export let htmlFor = undefined\\n    export let disabled = false\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n\\n    $: classProp = classnames('btn', is, size, $$props.class, { auto, disabled })\\n\\n    function onLabelClick(e) {\\n        document.getElementById(htmlFor).click()\\n        !disabled && dispatch('click', e)\\n    }\\n\\n    function onClick(e) {\\n        e.stopPropagation();\\n        !disabled && dispatch('click', e)\\n    }\\n</script>\\n\\n{#if href}\\n    <a\\n            {id}\\n            {rel}\\n            {href}\\n            {style}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </a>\\n{:else if htmlFor}\\n    <label\\n            {id}\\n            {style}\\n            {disabled}\\n            for={htmlFor}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onLabelClick}\\n    >\\n        <slot></slot>\\n    </label>\\n{:else}\\n    <button\\n            {id}\\n            {form}\\n            {type}\\n            {style}\\n            {disabled}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </button>\\n{/if}\\n\\n<style>\\n    .btn:not(.auto) {\\n        width: 100%;\\n        padding: 5px 15px;\\n    }\\n\\n    :global(.btn) {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        cursor: pointer;\\n        max-width: 100%;\\n        -webkit-user-select: none;\\n           -moz-user-select: none;\\n            -ms-user-select: none;\\n                user-select: none;\\n        font-weight: bold;\\n        text-align: center;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        display: -webkit-inline-box;\\n        display: -ms-inline-flexbox;\\n        display: inline-flex;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        color: rgba(var(--theme-font-color));\\n        border-radius: var(--border-radius-medium);\\n    }\\n\\n    :global(.btn.small) {\\n        padding: 5px;\\n        min-width: calc(var(--min-interactive-size) / 1.3);\\n        min-height: calc(var(--min-interactive-size) / 1.3);\\n    }\\n\\n    :global(.btn.medium) {\\n        padding: 5px 10px;\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n    }\\n\\n    :global(.btn.big) {\\n        padding: 5px 15px;\\n        min-width: calc(var(--min-interactive-size) * 1.3);\\n        min-height: calc(var(--min-interactive-size) * 1.3);\\n    }\\n\\n    :global(.btn:focus) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:hover) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:active) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    /* theme */\\n\\n    :global(.btn).theme {\\n        color: rgba(var(--theme-font-color));\\n        background-color: rgba(var(--theme-color-secondary));\\n    }\\n\\n    :global(.btn).theme:focus {\\n        background-color: rgba(var(--theme-color-secondary), .85);\\n    }\\n\\n    :global(.btn).theme:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).theme:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* theme */\\n\\n    :global(.btn).theme-border {\\n        color: rgba(var(--theme-font-color));\\n        border: 2px solid rgba(var(--theme-color-primary-opposite));\\n    }\\n\\n    :global(.btn).theme-border:focus {\\n        background-color: rgba(var(--theme-color-secondary), .85);\\n    }\\n\\n    :global(.btn).them-border:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).theme-border:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* White */\\n\\n    :global(.btn).white {\\n        color: rgba(var(--color-font-dark));\\n        background-color: rgba(var(--color-white));\\n    }\\n\\n    :global(.btn).white:focus {\\n        background-color: rgba(var(--color-white), .85);\\n    }\\n\\n    :global(.btn).white:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).white:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Dark */\\n\\n    :global(.btn).dark {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-dark));\\n    }\\n\\n    :global(.btn).dark:focus {\\n        background-color: rgba(var(--color-dark), .85);\\n    }\\n\\n    :global(.btn).dark:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).dark:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Dark-border */\\n\\n    :global(.btn).dark-border {\\n        color: rgba(var(--color-font-dark));\\n        border: 2px solid rgba(var(--color-dark));\\n    }\\n\\n    :global(.btn).dark-border:focus {\\n        background-color: rgba(var(--color-dark), .85);\\n    }\\n\\n    :global(.btn).dark-border:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).dark-border:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Success */\\n\\n    :global(.btn).success {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-success));\\n    }\\n\\n    :global(.btn).success:focus {\\n        background-color: rgba(var(--color-success), .85);\\n    }\\n\\n    :global(.btn).success:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).success:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Warning */\\n\\n    :global(.btn).warning {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-warning));\\n    }\\n\\n    :global(.btn).warning:focus {\\n        background-color: rgba(var(--color-warning), .85);\\n    }\\n\\n    :global(.btn).warning:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).warning:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Info */\\n\\n    :global(.btn).info {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-info));\\n    }\\n\\n    :global(.btn).info:focus {\\n        background-color: rgba(var(--color-info), .85);\\n    }\\n\\n    :global(.btn).info:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).info:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Danger */\\n\\n    :global(.btn).danger {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-danger));\\n    }\\n\\n    :global(.btn).danger:focus {\\n        background-color: rgba(var(--color-danger), .85);\\n    }\\n\\n    :global(.btn).danger:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).danger:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0J1dHRvbi5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksV0FBVztRQUNYLGlCQUFpQjtJQUNyQjs7SUFFQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsZUFBZTtRQUNmLGVBQWU7UUFDZix5QkFBaUI7V0FBakIsc0JBQWlCO1lBQWpCLHFCQUFpQjtnQkFBakIsaUJBQWlCO1FBQ2pCLGlCQUFpQjtRQUNqQixrQkFBa0I7UUFDbEIseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLDJCQUFvQjtRQUFwQiwyQkFBb0I7UUFBcEIsb0JBQW9CO1FBQ3BCLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2QixvQ0FBb0M7UUFDcEMsMENBQTBDO0lBQzlDOztJQUVBO1FBQ0ksWUFBWTtRQUNaLGtEQUFrRDtRQUNsRCxtREFBbUQ7SUFDdkQ7O0lBRUE7UUFDSSxpQkFBaUI7UUFDakIsc0NBQXNDO1FBQ3RDLHVDQUF1QztJQUMzQzs7SUFFQTtRQUNJLGlCQUFpQjtRQUNqQixrREFBa0Q7UUFDbEQsbURBQW1EO0lBQ3ZEOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBLFVBQVU7O0lBRVY7UUFDSSxvQ0FBb0M7UUFDcEMsb0RBQW9EO0lBQ3hEOztJQUVBO1FBQ0kseURBQXlEO0lBQzdEOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQSxVQUFVOztJQUVWO1FBQ0ksb0NBQW9DO1FBQ3BDLDJEQUEyRDtJQUMvRDs7SUFFQTtRQUNJLHlEQUF5RDtJQUM3RDs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUEsVUFBVTs7SUFFVjtRQUNJLG1DQUFtQztRQUNuQywwQ0FBMEM7SUFDOUM7O0lBRUE7UUFDSSwrQ0FBK0M7SUFDbkQ7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBLFNBQVM7O0lBRVQ7UUFDSSxvQ0FBb0M7UUFDcEMseUNBQXlDO0lBQzdDOztJQUVBO1FBQ0ksOENBQThDO0lBQ2xEOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQSxnQkFBZ0I7O0lBRWhCO1FBQ0ksbUNBQW1DO1FBQ25DLHlDQUF5QztJQUM3Qzs7SUFFQTtRQUNJLDhDQUE4QztJQUNsRDs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUEsWUFBWTs7SUFFWjtRQUNJLG9DQUFvQztRQUNwQyw0Q0FBNEM7SUFDaEQ7O0lBRUE7UUFDSSxpREFBaUQ7SUFDckQ7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBLFlBQVk7O0lBRVo7UUFDSSxvQ0FBb0M7UUFDcEMsNENBQTRDO0lBQ2hEOztJQUVBO1FBQ0ksaURBQWlEO0lBQ3JEOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQSxTQUFTOztJQUVUO1FBQ0ksb0NBQW9DO1FBQ3BDLHlDQUF5QztJQUM3Qzs7SUFFQTtRQUNJLDhDQUE4QztJQUNsRDs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUEsV0FBVzs7SUFFWDtRQUNJLG9DQUFvQztRQUNwQywyQ0FBMkM7SUFDL0M7O0lBRUE7UUFDSSxnREFBZ0Q7SUFDcEQ7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL0J1dHRvbi5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuYnRuOm5vdCguYXV0bykge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgcGFkZGluZzogNXB4IDE1cHg7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS10aGVtZS1mb250LWNvbG9yKSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtbWVkaXVtKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4uc21hbGwpIHtcbiAgICAgICAgcGFkZGluZzogNXB4O1xuICAgICAgICBtaW4td2lkdGg6IGNhbGModmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpIC8gMS4zKTtcbiAgICAgICAgbWluLWhlaWdodDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgLyAxLjMpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bi5tZWRpdW0pIHtcbiAgICAgICAgcGFkZGluZzogNXB4IDEwcHg7XG4gICAgICAgIG1pbi13aWR0aDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgICAgICBtaW4taGVpZ2h0OiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuLmJpZykge1xuICAgICAgICBwYWRkaW5nOiA1cHggMTVweDtcbiAgICAgICAgbWluLXdpZHRoOiBjYWxjKHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKSAqIDEuMyk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IGNhbGModmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpICogMS4zKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG46Zm9jdXMpIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuOmhvdmVyKSB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjEpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bjphY3RpdmUpIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuXG4gICAgLyogdGhlbWUgKi9cblxuICAgIDpnbG9iYWwoLmJ0bikudGhlbWUge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS10aGVtZS1mb250LWNvbG9yKSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtY29sb3Itc2Vjb25kYXJ5KSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS50aGVtZTpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtY29sb3Itc2Vjb25kYXJ5KSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLnRoZW1lOmhvdmVyIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikudGhlbWU6YWN0aXZlIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC8qIHRoZW1lICovXG5cbiAgICA6Z2xvYmFsKC5idG4pLnRoZW1lLWJvcmRlciB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWZvbnQtY29sb3IpKTtcbiAgICAgICAgYm9yZGVyOiAycHggc29saWQgcmdiYSh2YXIoLS10aGVtZS1jb2xvci1wcmltYXJ5LW9wcG9zaXRlKSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS50aGVtZS1ib3JkZXI6Zm9jdXMge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXNlY29uZGFyeSksIC44NSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS50aGVtLWJvcmRlcjpob3ZlciB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLnRoZW1lLWJvcmRlcjphY3RpdmUge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLyogV2hpdGUgKi9cblxuICAgIDpnbG9iYWwoLmJ0bikud2hpdGUge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWRhcmspKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci13aGl0ZSkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2hpdGU6Zm9jdXMge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXdoaXRlKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLndoaXRlOmhvdmVyIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2hpdGU6YWN0aXZlIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC8qIERhcmsgKi9cblxuICAgIDpnbG9iYWwoLmJ0bikuZGFyayB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYXJrKSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5kYXJrOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYXJrKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhcms6aG92ZXIge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5kYXJrOmFjdGl2ZSB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBEYXJrLWJvcmRlciAqL1xuXG4gICAgOmdsb2JhbCguYnRuKS5kYXJrLWJvcmRlciB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtZGFyaykpO1xuICAgICAgICBib3JkZXI6IDJweCBzb2xpZCByZ2JhKHZhcigtLWNvbG9yLWRhcmspKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhcmstYm9yZGVyOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYXJrKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhcmstYm9yZGVyOmhvdmVyIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikuZGFyay1ib3JkZXI6YWN0aXZlIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC8qIFN1Y2Nlc3MgKi9cblxuICAgIDpnbG9iYWwoLmJ0bikuc3VjY2VzcyB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5zdWNjZXNzOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLnN1Y2Nlc3M6aG92ZXIge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5zdWNjZXNzOmFjdGl2ZSB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBXYXJuaW5nICovXG5cbiAgICA6Z2xvYmFsKC5idG4pLndhcm5pbmcge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2FybmluZzpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZyksIC44NSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS53YXJuaW5nOmhvdmVyIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2FybmluZzphY3RpdmUge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLyogSW5mbyAqL1xuXG4gICAgOmdsb2JhbCguYnRuKS5pbmZvIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZm9udC1saWdodCkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmluZm86Zm9jdXMge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWluZm8pLCAuODUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikuaW5mbzpob3ZlciB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmluZm86YWN0aXZlIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC8qIERhbmdlciAqL1xuXG4gICAgOmdsb2JhbCguYnRuKS5kYW5nZXIge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5kYW5nZXI6Zm9jdXMge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhbmdlciksIC44NSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5kYW5nZXI6aG92ZXIge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5kYW5nZXI6YWN0aXZlIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AA+EI,mBAAI,KAAK,KAAK,CAAC,AAAC,CAAC,AACb,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,IAAI,AACrB,CAAC,AAEO,IAAI,AAAE,CAAC,AACX,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,MAAM,CAAE,OAAO,CACf,SAAS,CAAE,IAAI,CACf,mBAAmB,CAAE,IAAI,CACtB,gBAAgB,CAAE,IAAI,CACrB,eAAe,CAAE,IAAI,CACjB,WAAW,CAAE,IAAI,CACzB,WAAW,CAAE,IAAI,CACjB,UAAU,CAAE,MAAM,CAClB,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,WAAW,CACpB,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,aAAa,CAAE,IAAI,sBAAsB,CAAC,AAC9C,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,UAAU,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AACvD,CAAC,AAEO,WAAW,AAAE,CAAC,AAClB,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,AAC3C,CAAC,AAEO,QAAQ,AAAE,CAAC,AACf,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,SAAS,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,UAAU,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AACvD,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,WAAW,AAAE,CAAC,AAClB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAIO,IAAI,AAAC,MAAM,AAAC,CAAC,AACjB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,uBAAuB,CAAC,CAAC,AACxD,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,uBAAuB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC7D,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,MAAM,OAAO,AAAC,CAAC,AACxB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,aAAa,AAAC,CAAC,AACxB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,AAC/D,CAAC,AAEO,IAAI,AAAC,aAAa,MAAM,AAAC,CAAC,AAC9B,gBAAgB,CAAE,KAAK,IAAI,uBAAuB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC7D,CAAC,AAEO,IAAI,AAAC,YAAY,MAAM,AAAC,CAAC,AAC7B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,aAAa,OAAO,AAAC,CAAC,AAC/B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,MAAM,AAAC,CAAC,AACjB,KAAK,CAAE,KAAK,IAAI,iBAAiB,CAAC,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,AAC9C,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,MAAM,OAAO,AAAC,CAAC,AACxB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,KAAK,AAAC,CAAC,AAChB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,KAAK,MAAM,AAAC,CAAC,AACtB,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAAC,GAAG,CAAC,AAClD,CAAC,AAEO,IAAI,AAAC,KAAK,MAAM,AAAC,CAAC,AACtB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,KAAK,OAAO,AAAC,CAAC,AACvB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,YAAY,AAAC,CAAC,AACvB,KAAK,CAAE,KAAK,IAAI,iBAAiB,CAAC,CAAC,CACnC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,YAAY,MAAM,AAAC,CAAC,AAC7B,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAAC,GAAG,CAAC,AAClD,CAAC,AAEO,IAAI,AAAC,YAAY,MAAM,AAAC,CAAC,AAC7B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,YAAY,OAAO,AAAC,CAAC,AAC9B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,QAAQ,AAAC,CAAC,AACnB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,CAAC,GAAG,CAAC,AACrD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,QAAQ,OAAO,AAAC,CAAC,AAC1B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,QAAQ,AAAC,CAAC,AACnB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,CAAC,GAAG,CAAC,AACrD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,QAAQ,OAAO,AAAC,CAAC,AAC1B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,KAAK,AAAC,CAAC,AAChB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,KAAK,MAAM,AAAC,CAAC,AACtB,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAAC,GAAG,CAAC,AAClD,CAAC,AAEO,IAAI,AAAC,KAAK,MAAM,AAAC,CAAC,AACtB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,KAAK,OAAO,AAAC,CAAC,AACvB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,OAAO,AAAC,CAAC,AAClB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,AAC/C,CAAC,AAEO,IAAI,AAAC,OAAO,MAAM,AAAC,CAAC,AACxB,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,GAAG,CAAC,AACpD,CAAC,AAEO,IAAI,AAAC,OAAO,MAAM,AAAC,CAAC,AACxB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,OAAO,OAAO,AAAC,CAAC,AACzB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC\"}"
};

const Button = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { is = undefined } = $$props; // theme, theme-border, white, success, warning, danger, dark, dark-border
	let { id = undefined } = $$props;
	let { rel = undefined } = $$props;
	let { href = undefined } = $$props;
	let { auto = false } = $$props;
	let { type = "button" } = $$props;
	let { form = undefined } = $$props;
	let { size = undefined } = $$props;
	let { title = undefined } = $$props;
	let { style = undefined } = $$props;
	let { htmlFor = undefined } = $$props;
	let { disabled = false } = $$props;
	let { ariaLabel = undefined } = $$props;
	let titleProp = title || ariaLabel;
	let ariaLabelProp = ariaLabel || title;

	if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.rel === void 0 && $$bindings.rel && rel !== void 0) $$bindings.rel(rel);
	if ($$props.href === void 0 && $$bindings.href && href !== void 0) $$bindings.href(href);
	if ($$props.auto === void 0 && $$bindings.auto && auto !== void 0) $$bindings.auto(auto);
	if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
	if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.htmlFor === void 0 && $$bindings.htmlFor && htmlFor !== void 0) $$bindings.htmlFor(htmlFor);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	$$result.css.add(css$8);
	let classProp = classnames("btn", is, size, $$props.class, { auto, disabled });

	return `${href
	? `<a${add_attribute("id", id, 0)}${add_attribute("rel", rel, 0)}${add_attribute("href", href, 0)}${add_attribute("style", style, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1kjrxjx"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </a>`
	: `${htmlFor
		? `<label${add_attribute("id", id, 0)}${add_attribute("style", style, 0)} ${disabled ? "disabled" : ""}${add_attribute("for", htmlFor, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1kjrxjx"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </label>`
		: `<button${add_attribute("id", id, 0)}${add_attribute("form", form, 0)}${add_attribute("type", type, 0)}${add_attribute("style", style, 0)} ${disabled ? "disabled" : ""}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1kjrxjx"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </button>`}`}`;
});

/* src/components/Divider.svelte generated by Svelte v3.18.1 */

const css$9 = {
	code: ".divider.svelte-16jxdsi{margin:0;border:none;-webkit-box-sizing:content-box;box-sizing:content-box;background-clip:content-box}.info.svelte-16jxdsi{background-color:rgb(var(--color-info))}.success.svelte-16jxdsi{background-color:rgb(var(--color-success))}.warning.svelte-16jxdsi{background-color:rgb(var(--color-warning))}.danger.svelte-16jxdsi{background-color:rgb(var(--color-danger))}",
	map: "{\"version\":3,\"file\":\"Divider.svelte\",\"sources\":[\"Divider.svelte\"],\"sourcesContent\":[\"<script>\\n    import { toCSSString, classnames } from '@utils'\\n\\n    export let is = 'info'\\n    export let size = 0\\n    export let width = 2\\n\\n    $: classProp = classnames('divider', is, $$props.class)\\n    $: styleProp = toCSSString({ padding: `${size / 2}px 0`, height: `${width}px` })\\n</script>\\n\\n<hr class={classProp} style={styleProp}>\\n\\n<style>\\n    .divider {\\n        margin: 0;\\n        border: none;\\n        -webkit-box-sizing: content-box;\\n                box-sizing: content-box;\\n        background-clip: content-box;\\n    }\\n\\n    .info {\\n        background-color: rgb(var(--color-info));\\n    }\\n\\n    .success {\\n        background-color: rgb(var(--color-success));\\n    }\\n\\n    .warning {\\n        background-color: rgb(var(--color-warning));\\n    }\\n\\n    .danger {\\n        background-color: rgb(var(--color-danger));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0RpdmlkZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFNBQVM7UUFDVCxZQUFZO1FBQ1osK0JBQXVCO2dCQUF2Qix1QkFBdUI7UUFDdkIsNEJBQTRCO0lBQ2hDOztJQUVBO1FBQ0ksd0NBQXdDO0lBQzVDOztJQUVBO1FBQ0ksMkNBQTJDO0lBQy9DOztJQUVBO1FBQ0ksMkNBQTJDO0lBQy9DOztJQUVBO1FBQ0ksMENBQTBDO0lBQzlDIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL0RpdmlkZXIuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLmRpdmlkZXIge1xuICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgYm94LXNpemluZzogY29udGVudC1ib3g7XG4gICAgICAgIGJhY2tncm91bmQtY2xpcDogY29udGVudC1ib3g7XG4gICAgfVxuXG4gICAgLmluZm8ge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgIH1cblxuICAgIC5zdWNjZXNzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG5cbiAgICAud2FybmluZyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci13YXJuaW5nKSk7XG4gICAgfVxuXG4gICAgLmRhbmdlciB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAcI,QAAQ,eAAC,CAAC,AACN,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,IAAI,CACZ,kBAAkB,CAAE,WAAW,CACvB,UAAU,CAAE,WAAW,CAC/B,eAAe,CAAE,WAAW,AAChC,CAAC,AAED,KAAK,eAAC,CAAC,AACH,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AAC5C,CAAC,AAED,QAAQ,eAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC/C,CAAC,AAED,QAAQ,eAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC/C,CAAC,AAED,OAAO,eAAC,CAAC,AACL,gBAAgB,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AAC9C,CAAC\"}"
};

const Divider = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { is = "info" } = $$props;
	let { size = 0 } = $$props;
	let { width = 2 } = $$props;
	if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	$$result.css.add(css$9);
	let classProp = classnames("divider", is, $$props.class);

	let styleProp = toCSSString({
		padding: `${size / 2}px 0`,
		height: `${width}px`
	});

	return `<hr class="${escape(null_to_empty(classProp)) + " svelte-16jxdsi"}"${add_attribute("style", styleProp, 0)}>`;
});

/* src/components/Progress.svelte generated by Svelte v3.18.1 */

const css$a = {
	code: ".progress.medium.svelte-108d5jc.svelte-108d5jc{--progress-height:10px;--progress-padding-point:1px}.progress.svelte-108d5jc.svelte-108d5jc{-webkit-box-flex:0;-ms-flex:0;flex:0;width:100%;border-radius:9999px;height:var(--progress-height)}.progress-inner-frame.svelte-108d5jc.svelte-108d5jc{position:relative;display:-webkit-box;display:-ms-flexbox;display:flex;width:100%;height:100%;border-radius:9999px;overflow:hidden;padding:var(--progress-padding-point) 0;background-color:rgba(var(--theme-color-primary-opposite), .1);background-clip:content-box}.progress-core.svelte-108d5jc.svelte-108d5jc{position:absolute;top:0;left:0;height:100%;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:stretch;align-self:stretch;-webkit-transition:1s ease-in-out;transition:1s ease-in-out;border-radius:9999px;background-color:rgba(var(--color-info))}.progress[aria-valuenow=\"100\"].svelte-108d5jc .progress-core.svelte-108d5jc{background-color:rgba(var(--color-success))}",
	map: "{\"version\":3,\"file\":\"Progress.svelte\",\"sources\":[\"Progress.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, onMount } from 'svelte'\\n    import { classnames, safeGet } from '@utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let id = undefined\\n    export let value = 0 // 0 - 100\\n    export let size = 'medium'\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n    export let borderRadius = undefined\\n\\n    $: val = Number.isFinite(+value) ? Math.max(0, Math.min(+value, 100)) : 0\\n    $: titleProp = title || `Progress - ${val}%`\\n    $: ariaLabelProp = ariaLabel || `Progress - ${val}%`\\n    $: classProp = classnames('progress', size, $$props.class)\\n\\n    function getBorderRadius(borders, defaults = '99999px') {\\n        const brDefault = new Array(4).fill(defaults)\\n        const bds = safeGet(() => borders.split(' '), [], true)\\n        const rule = 'border-radius'\\n        return `${rule}:${brDefault.map((def, i) => `${bds[i] || def}`).join(' ')}`\\n    }\\n</script>\\n\\n\\n<div\\n        {id}\\n        class={classProp}\\n        title={titleProp}\\n        aria-label={ariaLabelProp}\\n        role=\\\"progressbar\\\"\\n        aria-valuemin=\\\"0\\\"\\n        aria-valuemax=\\\"100\\\"\\n        aria-valuenow={val}\\n        style={getBorderRadius(borderRadius)}\\n>\\n    <div class=\\\"progress-inner-frame\\\">\\n        <div class=\\\"progress-core\\\" style={`width:${val}%`}></div>\\n    </div>\\n</div>\\n\\n<style>\\n    .progress.medium {\\n        --progress-height: 10px;\\n        --progress-padding-point: 1px;\\n    }\\n\\n    .progress {\\n        -webkit-box-flex: 0;\\n            -ms-flex: 0;\\n                flex: 0;\\n        width: 100%;\\n        border-radius: 9999px;\\n        height: var(--progress-height);\\n    }\\n\\n    .progress-inner-frame {\\n        position: relative;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        width: 100%;\\n        height: 100%;\\n        border-radius: 9999px;\\n        overflow: hidden;\\n        padding: var(--progress-padding-point) 0;\\n        background-color: rgba(var(--theme-color-primary-opposite), .1);\\n        background-clip: content-box;\\n    }\\n\\n    .progress-core {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        height: 100%;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-transition: 1s ease-in-out;\\n        transition: 1s ease-in-out;\\n        border-radius: 9999px;\\n        background-color: rgba(var(--color-info));\\n    }\\n\\n    .progress[aria-valuenow=\\\"100\\\"] .progress-core {\\n        background-color: rgba(var(--color-success));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL1Byb2dyZXNzLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSx1QkFBdUI7UUFDdkIsNkJBQTZCO0lBQ2pDOztJQUVBO1FBQ0ksbUJBQU87WUFBUCxXQUFPO2dCQUFQLE9BQU87UUFDUCxXQUFXO1FBQ1gscUJBQXFCO1FBQ3JCLDhCQUE4QjtJQUNsQzs7SUFFQTtRQUNJLGtCQUFrQjtRQUNsQixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLFdBQVc7UUFDWCxZQUFZO1FBQ1oscUJBQXFCO1FBQ3JCLGdCQUFnQjtRQUNoQix3Q0FBd0M7UUFDeEMsK0RBQStEO1FBQy9ELDRCQUE0QjtJQUNoQzs7SUFFQTtRQUNJLGtCQUFrQjtRQUNsQixNQUFNO1FBQ04sT0FBTztRQUNQLFlBQVk7UUFDWixtQkFBVTtZQUFWLGNBQVU7Z0JBQVYsVUFBVTtRQUNWLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsa0NBQTBCO1FBQTFCLDBCQUEwQjtRQUMxQixxQkFBcUI7UUFDckIseUNBQXlDO0lBQzdDOztJQUVBO1FBQ0ksNENBQTRDO0lBQ2hEIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL1Byb2dyZXNzLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5wcm9ncmVzcy5tZWRpdW0ge1xuICAgICAgICAtLXByb2dyZXNzLWhlaWdodDogMTBweDtcbiAgICAgICAgLS1wcm9ncmVzcy1wYWRkaW5nLXBvaW50OiAxcHg7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzIHtcbiAgICAgICAgZmxleDogMDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDk5OTlweDtcbiAgICAgICAgaGVpZ2h0OiB2YXIoLS1wcm9ncmVzcy1oZWlnaHQpO1xuICAgIH1cblxuICAgIC5wcm9ncmVzcy1pbm5lci1mcmFtZSB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogOTk5OXB4O1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBwYWRkaW5nOiB2YXIoLS1wcm9ncmVzcy1wYWRkaW5nLXBvaW50KSAwO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnktb3Bwb3NpdGUpLCAuMSk7XG4gICAgICAgIGJhY2tncm91bmQtY2xpcDogY29udGVudC1ib3g7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzLWNvcmUge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIHRvcDogMDtcbiAgICAgICAgbGVmdDogMDtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICB0cmFuc2l0aW9uOiAxcyBlYXNlLWluLW91dDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogOTk5OXB4O1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3NbYXJpYS12YWx1ZW5vdz1cIjEwMFwiXSAucHJvZ3Jlc3MtY29yZSB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AA4CI,SAAS,OAAO,8BAAC,CAAC,AACd,iBAAiB,CAAE,IAAI,CACvB,wBAAwB,CAAE,GAAG,AACjC,CAAC,AAED,SAAS,8BAAC,CAAC,AACP,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CACP,IAAI,CAAE,CAAC,CACf,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,MAAM,CACrB,MAAM,CAAE,IAAI,iBAAiB,CAAC,AAClC,CAAC,AAED,qBAAqB,8BAAC,CAAC,AACnB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,MAAM,CACrB,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,IAAI,wBAAwB,CAAC,CAAC,CAAC,CACxC,gBAAgB,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,EAAE,CAAC,CAC/D,eAAe,CAAE,WAAW,AAChC,CAAC,AAED,cAAc,8BAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,kBAAkB,CAAE,EAAE,CAAC,WAAW,CAClC,UAAU,CAAE,EAAE,CAAC,WAAW,CAC1B,aAAa,CAAE,MAAM,CACrB,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC,AAED,SAAS,CAAC,aAAa,CAAC,KAAK,gBAAC,CAAC,cAAc,eAAC,CAAC,AAC3C,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC\"}"
};

function getBorderRadius(borders, defaults = "99999px") {
	const brDefault = new Array(4).fill(defaults);
	const bds = safeGet(() => borders.split(" "), [], true);
	const rule = "border-radius";
	return `${rule}:${brDefault.map((def, i) => `${bds[i] || def}`).join(" ")}`;
}

const Progress = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { value = 0 } = $$props; // 0 - 100
	let { size = "medium" } = $$props;
	let { title = undefined } = $$props;
	let { ariaLabel = undefined } = $$props;
	let { borderRadius = undefined } = $$props;
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	if ($$props.borderRadius === void 0 && $$bindings.borderRadius && borderRadius !== void 0) $$bindings.borderRadius(borderRadius);
	$$result.css.add(css$a);

	let val = Number.isFinite(+value)
	? Math.max(0, Math.min(+value, 100))
	: 0;

	let titleProp = title || `Progress - ${val}%`;
	let ariaLabelProp = ariaLabel || `Progress - ${val}%`;
	let classProp = classnames("progress", size, $$props.class);

	return `<div${add_attribute("id", id, 0)} class="${escape(null_to_empty(classProp)) + " svelte-108d5jc"}"${add_attribute("title", titleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)} role="${"progressbar"}" aria-valuemin="${"0"}" aria-valuemax="${"100"}"${add_attribute("aria-valuenow", val, 0)}${add_attribute("style", getBorderRadius(borderRadius), 0)}>
    <div class="${"progress-inner-frame svelte-108d5jc"}">
        <div class="${"progress-core svelte-108d5jc"}"${add_attribute("style", `width:${val}%`, 0)}></div>
    </div>
</div>`;
});

/* src/components/FancyBox.svelte generated by Svelte v3.18.1 */

const css$b = {
	code: ".fancy-box.svelte-a2sdhd.svelte-a2sdhd{position:relative;width:100%;-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;overflow:hidden;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch}.fancy-box-ghost.svelte-a2sdhd.svelte-a2sdhd{z-index:10;position:fixed;top:0;left:0;width:100%;height:100%;display:-webkit-box;display:-ms-flexbox;display:flex;overflow:hidden;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-ms-touch-action:manipulation;touch-action:manipulation;background-color:rgba(var(--color-black), .75);outline:150px solid rgba(var(--color-black), .75);-webkit-transition-timing-function:linear;transition-timing-function:linear;opacity:0;padding:0 var(--screen-padding);-webkit-transform:translate3d(0,30px,0);transform:translate3d(0,30px,0);pointer-events:none;will-change:transform, opacity}.fancy-box-ghost.svelte-a2sdhd>.svelte-a2sdhd{max-width:100%;max-height:100%}.fancy-box-ghost.active.svelte-a2sdhd.svelte-a2sdhd{opacity:1;-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0);pointer-events:auto}button.svelte-a2sdhd.svelte-a2sdhd{position:absolute;top:0;right:0;font-size:24px;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:60px;height:60px;color:rgb(var(--color-white))}",
	map: "{\"version\":3,\"file\":\"FancyBox.svelte\",\"sources\":[\"FancyBox.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, tick } from 'svelte'\\n    import { fly } from 'svelte/transition'\\n    import { Swipe } from '@services'\\n    import { classnames, delay, bodyScroll, safeGet } from '@utils'\\n    import Portal from './Portal.svelte';\\n\\n    const dispatch = createEventDispatcher()\\n    \\n    const DURATION = 250\\n    const THRESHOLD = 50\\n    const SWIPE_SPEED = .5\\n    const START_POSITION = {\\n        x: 0,\\n        y: 20\\n    }\\n\\n    export let ref = null\\n    export let blockBody = true\\n    export let swipe = ['all']       // up down left right all\\n    export let disabled = false\\n    export let extraLock = false\\n    export let startPosition = START_POSITION\\n\\n    let active = null\\n    let slots = $$props.$$slots || {}\\n\\n    async function onClick(e) {\\n        if (disabled) return\\n\\n        const newActive = !active\\n\\n        setActive(newActive)\\n\\n        if (newActive) {\\n            drawTransform(ref, 0, 0)\\n        } else {\\n            drawTransform(ref, startPosition.x, startPosition.y)\\n        }\\n    }\\n\\n    async function setActive(isActive) {\\n        active = isActive\\n\\n        await tick()\\n\\n        if (active) {\\n            setDuration(ref, DURATION)\\n            setTimeout(() => setDuration(ref, 0), DURATION)\\n            blockBody && bodyScroll.disableScroll(ref, { extraLock });\\n            dispatch('open')\\n        } else {\\n            setDuration(ref, DURATION)\\n            blockBody && bodyScroll.enableScroll(ref, { extraLock });\\n            dispatch('close')\\n        }\\n    }\\n\\n    $: isSwipe = {\\n        up: safeGet(() => swipe.includes('up') || swipe.includes('all')),\\n        down: safeGet(() => swipe.includes('down') || swipe.includes('all')),\\n        left: safeGet(() => swipe.includes('left') || swipe.includes('all')),\\n        right: safeGet(() => swipe.includes('right') || swipe.includes('all')),\\n    }\\n    $: classProp = classnames('fancy-box-ghost', { active })\\n    $: classPropWrap = classnames('fancy-box', $$props.class)\\n\\n    let xSwipe = 0\\n    let ySwipe = 0\\n\\n    function addSwipe(el) {\\n        new Swipe(el)\\n                .run()\\n                .onUp(isSwipe.up ? handleVerticalSwipe : null)\\n                .onDown(isSwipe.down ? handleVerticalSwipe : null)\\n                .onLeft(isSwipe.left ? handleHorizontalSwipe : null)\\n                .onRight(isSwipe.right ? handleHorizontalSwipe : null)\\n                .onTouchEnd(async () => {\\n                    if (xSwipe > THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        setActive(false)\\n                        drawTransform(el, xSwipe + 50, ySwipe)\\n                        drawOpacity(el, xSwipe + 50, ySwipe)\\n                        await delay(DURATION)\\n                    } else if (xSwipe < -THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        setActive(false)\\n                        drawTransform(el, xSwipe - 50, ySwipe)\\n                        drawOpacity(el, xSwipe - 50, ySwipe)\\n                        await delay(DURATION)\\n                    }\\n                    \\n                    if (ySwipe > THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        setActive(false)\\n                        drawTransform(el, xSwipe, ySwipe + 50)\\n                        drawOpacity(el, xSwipe, ySwipe + 50)\\n                        await delay(DURATION)\\n                    } else if (ySwipe < -THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        setActive(false)\\n                        drawTransform(el, xSwipe, ySwipe - 50)\\n                        drawOpacity(el, xSwipe, ySwipe - 50)\\n                        await delay(DURATION)\\n                    }\\n\\n                    if (xSwipe <= THRESHOLD && xSwipe >= -THRESHOLD && ySwipe <= THRESHOLD && ySwipe >= -THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        drawTransform(el, 0, 0)\\n                    } else {\\n                        drawTransform(el, startPosition.x, startPosition.y)\\n                    }\\n\\n                    xSwipe = 0\\n                    ySwipe = 0\\n                    el.style.opacity = null\\n                })\\n    }\\n\\n    function handleVerticalSwipe(yDown, yUp, evt, el) {\\n        ySwipe = (yUp - yDown) * SWIPE_SPEED\\n        drawTransform(el, xSwipe, ySwipe)\\n        drawOpacity(el, xSwipe, ySwipe)\\n    }\\n    function handleHorizontalSwipe(xDown, xUp, evt, el) {\\n        xSwipe = (xUp - xDown) * SWIPE_SPEED\\n        drawTransform(el, xSwipe, ySwipe)\\n        drawOpacity(el, xSwipe, ySwipe)\\n    }\\n\\n    function drawTransform(el, x, y) {\\n        const delta = Math.abs(x) > Math.abs(y) ? x : y\\n        let scale = 1 - Math.abs(delta / window.innerHeight)\\n        el && (el.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${x}, ${y})`)\\n    }\\n    function setDuration(el, ms) {\\n        el && (el.style.transitionDuration = `${ms}ms`)\\n    }\\n    function drawOpacity(el, x, y) {\\n        const delta = Math.abs(x) > Math.abs(y) ? x : y\\n        el && (el.style.opacity = 1 - Math.min(Math.abs(delta / (THRESHOLD * 1.5)), 1))\\n    }\\n</script>\\n\\n<section role=\\\"button\\\" class={classPropWrap} on:click={onClick}>\\n    <slot {active}></slot>\\n</section>\\n\\n{#if active !== null}\\n    <Portal>\\n        <section\\n            bind:this={ref}\\n            use:addSwipe\\n            class={classProp}\\n        >\\n            <button type=\\\"button\\\" on:click={onClick}>&#10005;</button>\\n            {#if slots.box}\\n                <slot name=\\\"box\\\"></slot>\\n            {:else}\\n                <slot></slot>\\n            {/if}\\n        </section>\\n    </Portal>\\n{/if}\\n\\n<style>\\n    .fancy-box {\\n        position: relative;\\n        width: 100%;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow: hidden;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n    }\\n\\n    .fancy-box-ghost {\\n        z-index: 10;\\n        position: fixed;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow: hidden;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        -webkit-user-select: none;\\n           -moz-user-select: none;\\n            -ms-user-select: none;\\n                user-select: none;\\n        -ms-touch-action: manipulation;\\n            touch-action: manipulation;\\n        background-color: rgba(var(--color-black), .75);\\n        outline: 150px solid rgba(var(--color-black), .75);\\n        -webkit-transition-timing-function: linear;\\n                transition-timing-function: linear;\\n        opacity: 0;\\n        padding: 0 var(--screen-padding);\\n        -webkit-transform: translate3d(0,30px,0);\\n                transform: translate3d(0,30px,0);\\n        pointer-events: none;\\n        will-change: transform, opacity;\\n    }\\n\\n    .fancy-box-ghost > * {\\n        max-width: 100%;\\n        max-height: 100%;\\n    }\\n\\n    .fancy-box-ghost.active {\\n        opacity: 1;\\n        -webkit-transform: translate3d(0,0,0);\\n                transform: translate3d(0,0,0);\\n        pointer-events: auto;\\n    }\\n\\n    button {\\n        position: absolute;\\n        top: 0;\\n        right: 0;\\n        font-size: 24px;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 60px;\\n        height: 60px;\\n        color: rgb(var(--color-white));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0ZhbmN5Qm94LnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxrQkFBa0I7UUFDbEIsV0FBVztRQUNYLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1Ysb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiwwQkFBb0I7WUFBcEIsdUJBQW9CO2dCQUFwQixvQkFBb0I7UUFDcEIseUJBQXdCO1lBQXhCLHNCQUF3QjtnQkFBeEIsd0JBQXdCO0lBQzVCOztJQUVBO1FBQ0ksV0FBVztRQUNYLGVBQWU7UUFDZixNQUFNO1FBQ04sT0FBTztRQUNQLFdBQVc7UUFDWCxZQUFZO1FBQ1osb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsMEJBQW9CO1lBQXBCLHVCQUFvQjtnQkFBcEIsb0JBQW9CO1FBQ3BCLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2Qiw0QkFBc0I7UUFBdEIsNkJBQXNCO1lBQXRCLDBCQUFzQjtnQkFBdEIsc0JBQXNCO1FBQ3RCLHlCQUFpQjtXQUFqQixzQkFBaUI7WUFBakIscUJBQWlCO2dCQUFqQixpQkFBaUI7UUFDakIsOEJBQTBCO1lBQTFCLDBCQUEwQjtRQUMxQiwrQ0FBK0M7UUFDL0Msa0RBQWtEO1FBQ2xELDBDQUFrQztnQkFBbEMsa0NBQWtDO1FBQ2xDLFVBQVU7UUFDVixnQ0FBZ0M7UUFDaEMsd0NBQWdDO2dCQUFoQyxnQ0FBZ0M7UUFDaEMsb0JBQW9CO1FBQ3BCLCtCQUErQjtJQUNuQzs7SUFFQTtRQUNJLGVBQWU7UUFDZixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxVQUFVO1FBQ1YscUNBQTZCO2dCQUE3Qiw2QkFBNkI7UUFDN0Isb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLE1BQU07UUFDTixRQUFRO1FBQ1IsZUFBZTtRQUNmLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2QixXQUFXO1FBQ1gsWUFBWTtRQUNaLDhCQUE4QjtJQUNsQyIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9GYW5jeUJveC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuZmFuY3ktYm94IHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICB9XG5cbiAgICAuZmFuY3ktYm94LWdob3N0IHtcbiAgICAgICAgei1pbmRleDogMTA7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIHVzZXItc2VsZWN0OiBub25lO1xuICAgICAgICB0b3VjaC1hY3Rpb246IG1hbmlwdWxhdGlvbjtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC43NSk7XG4gICAgICAgIG91dGxpbmU6IDE1MHB4IHNvbGlkIHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuNzUpO1xuICAgICAgICB0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbjogbGluZWFyO1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICBwYWRkaW5nOiAwIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLDMwcHgsMCk7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgICB3aWxsLWNoYW5nZTogdHJhbnNmb3JtLCBvcGFjaXR5O1xuICAgIH1cblxuICAgIC5mYW5jeS1ib3gtZ2hvc3QgPiAqIHtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBtYXgtaGVpZ2h0OiAxMDAlO1xuICAgIH1cblxuICAgIC5mYW5jeS1ib3gtZ2hvc3QuYWN0aXZlIHtcbiAgICAgICAgb3BhY2l0eTogMTtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLDAsMCk7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xuICAgIH1cblxuICAgIGJ1dHRvbiB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICByaWdodDogMDtcbiAgICAgICAgZm9udC1zaXplOiAyNHB4O1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgd2lkdGg6IDYwcHg7XG4gICAgICAgIGhlaWdodDogNjBweDtcbiAgICAgICAgY29sb3I6IHJnYih2YXIoLS1jb2xvci13aGl0ZSkpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AA2KI,UAAU,4BAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,AACpC,CAAC,AAED,gBAAgB,4BAAC,CAAC,AACd,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,mBAAmB,CAAE,IAAI,CACtB,gBAAgB,CAAE,IAAI,CACrB,eAAe,CAAE,IAAI,CACjB,WAAW,CAAE,IAAI,CACzB,gBAAgB,CAAE,YAAY,CAC1B,YAAY,CAAE,YAAY,CAC9B,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAC/C,OAAO,CAAE,KAAK,CAAC,KAAK,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,kCAAkC,CAAE,MAAM,CAClC,0BAA0B,CAAE,MAAM,CAC1C,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAChC,iBAAiB,CAAE,YAAY,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAChC,SAAS,CAAE,YAAY,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CACxC,cAAc,CAAE,IAAI,CACpB,WAAW,CAAE,SAAS,CAAC,CAAC,OAAO,AACnC,CAAC,AAED,8BAAgB,CAAG,cAAE,CAAC,AAClB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,IAAI,AACpB,CAAC,AAED,gBAAgB,OAAO,4BAAC,CAAC,AACrB,OAAO,CAAE,CAAC,CACV,iBAAiB,CAAE,YAAY,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC7B,SAAS,CAAE,YAAY,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACrC,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,MAAM,4BAAC,CAAC,AACJ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,CAAC,CACR,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,AAClC,CAAC\"}"
};

const FancyBox = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	const START_POSITION = { x: 0, y: 20 };
	let { ref = null } = $$props;
	let { blockBody = true } = $$props;
	let { swipe = ["all"] } = $$props; // up down left right all
	let { disabled = false } = $$props;
	let { extraLock = false } = $$props;
	let { startPosition = START_POSITION } = $$props;
	let active = null;
	let slots = $$props.$$slots || {};

	if ($$props.ref === void 0 && $$bindings.ref && ref !== void 0) $$bindings.ref(ref);
	if ($$props.blockBody === void 0 && $$bindings.blockBody && blockBody !== void 0) $$bindings.blockBody(blockBody);
	if ($$props.swipe === void 0 && $$bindings.swipe && swipe !== void 0) $$bindings.swipe(swipe);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.extraLock === void 0 && $$bindings.extraLock && extraLock !== void 0) $$bindings.extraLock(extraLock);
	if ($$props.startPosition === void 0 && $$bindings.startPosition && startPosition !== void 0) $$bindings.startPosition(startPosition);
	$$result.css.add(css$b);

	let isSwipe = {
		up: safeGet(() => swipe.includes("up") || swipe.includes("all")),
		down: safeGet(() => swipe.includes("down") || swipe.includes("all")),
		left: safeGet(() => swipe.includes("left") || swipe.includes("all")),
		right: safeGet(() => swipe.includes("right") || swipe.includes("all"))
	};

	let classProp = classnames("fancy-box-ghost", { active });
	let classPropWrap = classnames("fancy-box", $$props.class);

	return `<section role="${"button"}" class="${escape(null_to_empty(classPropWrap)) + " svelte-a2sdhd"}">
    ${$$slots.default ? $$slots.default({ active }) : ``}
</section>

${ ``}`;
});

/* src/components/Carousel.svelte generated by Svelte v3.18.1 */

const css$c = {
	code: ".carousel.rounded.svelte-10wgcs4.svelte-10wgcs4>.carousel-inner.svelte-10wgcs4.svelte-10wgcs4{border-radius:var(--border-radius-big)}.carousel.svelte-10wgcs4.svelte-10wgcs4.svelte-10wgcs4,.carousel-inner.svelte-10wgcs4.svelte-10wgcs4.svelte-10wgcs4,.carousel-inner.svelte-10wgcs4.svelte-10wgcs4>li.svelte-10wgcs4.svelte-10wgcs4{position:relative;-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;overflow:hidden;text-align:left;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch}.carousel.dotsBelow.svelte-10wgcs4.svelte-10wgcs4.svelte-10wgcs4{padding-bottom:40px}.carousel.filled.svelte-10wgcs4.svelte-10wgcs4>.carousel-inner.svelte-10wgcs4.svelte-10wgcs4{background-color:transparent}.carousel.dotsBelow.svelte-10wgcs4.svelte-10wgcs4 .carousel-dots.svelte-10wgcs4.svelte-10wgcs4{bottom:0}.carousel.dotsBelow.svelte-10wgcs4.svelte-10wgcs4 .carousel-dots li.svelte-10wgcs4.svelte-10wgcs4{background-color:rgba(var(--theme-bg-color-opposite))}.carousel.stretch.svelte-10wgcs4>.carousel-inner.svelte-10wgcs4>.fluid.svelte-10wgcs4{-webkit-box-flex:0;-ms-flex:none;flex:none;width:100%}.carousel.auto.svelte-10wgcs4>.carousel-inner.svelte-10wgcs4>.fluid.svelte-10wgcs4{width:auto}.carousel.svelte-10wgcs4.svelte-10wgcs4.svelte-10wgcs4{width:100%}.carousel-inner.svelte-10wgcs4.svelte-10wgcs4.svelte-10wgcs4::-webkit-scrollbar{display:none}.carousel.svelte-10wgcs4.svelte-10wgcs4>.carousel-inner.svelte-10wgcs4.svelte-10wgcs4{width:100%;overflow-y:hidden;overflow-x:scroll;background-color:rgba(var(--theme-bg-color-opposite), .04)}.carousel-dots.svelte-10wgcs4.svelte-10wgcs4.svelte-10wgcs4{position:absolute;left:0;bottom:10px;width:100%;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;justify-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;pointer-events:none}.carousel-dots.svelte-10wgcs4.svelte-10wgcs4 li.svelte-10wgcs4.svelte-10wgcs4{position:relative;width:8px;height:8px;margin:5px;border-radius:50%;overflow:hidden;-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary);background-color:rgba(var(--color-light))}.carousel-dots.svelte-10wgcs4.svelte-10wgcs4 li.svelte-10wgcs4.svelte-10wgcs4:not(.active){opacity:.5}.carousel-dots.svelte-10wgcs4.svelte-10wgcs4 li.active.svelte-10wgcs4.svelte-10wgcs4{-webkit-transform:scale(1.5);transform:scale(1.5)}",
	map: "{\"version\":3,\"file\":\"Carousel.svelte\",\"sources\":[\"Carousel.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { waitUntil, classnames } from '@utils'\\n    import Picture from '@components/Picture.svelte'\\n    import FancyBox from '@components/FancyBox.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    /**\\n     *\\n     * @type {number | {\\n     *     src: string,\\n     *     srcBig: string,\\n     *     alt: string,\\n     *     onClick?: function,\\n     * }[]}\\n     */\\n    export let items = []\\n    export let dots = true\\n    export let dotsBelow = true\\n    export let rounded = true\\n    export let size = 'stretch'\\n    export let initIndex = 0\\n    export let disableFancy = false\\n    export let stopPropagation = undefined\\n\\n    let parent = null\\n\\n    $: activeDot = initIndex\\n    $: classProp = classnames('carousel', size, $$props.class, { dotsBelow, rounded, filled: items && items.length })\\n    $: setScrollPosition(parent, initIndex)\\n\\n    function carousel(node) {\\n        node.ontouchstart = e => stopPropagation && (e.stopPropagation())\\n        node.ontouchmove = e => stopPropagation && (e.stopPropagation())\\n        node.ontouchend = e => stopPropagation && (e.stopPropagation())\\n\\n        parent = node\\n        setScrollPosition(node, activeDot)\\n        node.addEventListener('scroll', onScroll)\\n        return { \\n            destroy: () => {\\n                node.removeEventListener('scroll', onScroll)\\n                node.ontouchstart= null\\n                node.ontouchmove= null\\n                node.ontouchend= null\\n            }\\n        }\\n    }\\n\\n    function onScroll(e) {\\n        try {\\n            getActiveDot(e.target)\\n        } catch (err) { console.warn('Carousel does not work.', err) }\\n    }\\n\\n    function getActiveDot(parent) {\\n        const { scrollLeft, scrollWidth, offsetWidth } = parent\\n        const dotAmount = Array.from(parent.children).length\\n        const scrollX = scrollLeft / (scrollWidth - offsetWidth)\\n        const newActiveDot = Math.round(scrollX * (dotAmount - 1))\\n        if (activeDot !== newActiveDot && !isNaN(newActiveDot)) activeDot = newActiveDot\\n    }\\n\\n    function setScrollPosition(parent, activeDot) {\\n        if (!parent) return\\n        const { width } = parent.getBoundingClientRect()\\n        waitUntil(() => {\\n            parent.scrollLeft = Math.round(width * activeDot)\\n            if (parent.scrollLeft !== Math.round(width * activeDot)) {\\n              throw new Error('Not set.')\\n            }\\n        }, { interval: 50 })\\n    }\\n\\n    function onClick(item, index, e) {\\n        dispatch('click', { item, index, e })\\n        if (typeof item.onClick === 'function') item.onClick(item, index, e)\\n    }\\n\\n</script>\\n\\n<section aria-label=\\\"carousel\\\" class={classProp}>\\n    <ul \\n        use:carousel\\n        class=\\\"carousel-inner scroll-x-center\\\"\\n    >\\n        {#if items !== null}\\n            {#each items as item, index}\\n                <li class=\\\"fluid\\\" role=\\\"button\\\" on:click={onClick.bind(null, item, index)}>\\n                    <slot {item} {index}>\\n                        <FancyBox disabled={disableFancy}>\\n                            <Picture key=\\\"picture\\\" {...item} alt={item.alt || 'Фото слайду'}/>\\n                            <section slot=\\\"box\\\" class=\\\"flex full-width\\\">\\n                                <Picture key=\\\"picture\\\" {...item} alt={item.alt || 'Фото слайду'}/>\\n                            </section>\\n                        </FancyBox>\\n                    </slot>\\n                </li>\\n            {/each}\\n        {/if}\\n    </ul>\\n\\n\\n    {#if dots && Array.isArray(items)}\\n        <ul class=\\\"carousel-dots\\\">\\n            {#each items as _item, i}\\n                <li class={i === activeDot ? 'active' : ''}></li>\\n            {/each}\\n        </ul>\\n    {/if}\\n</section>\\n\\n<style>\\n    .carousel.rounded > .carousel-inner {\\n       border-radius: var(--border-radius-big);\\n    }\\n\\n    .carousel, .carousel-inner, .carousel-inner > li {\\n        position: relative;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow: hidden;\\n        text-align: left;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n    }\\n\\n    .carousel.dotsBelow {\\n        padding-bottom: 40px;\\n    }\\n\\n    .carousel.filled > .carousel-inner {\\n        background-color: transparent;\\n    }\\n\\n    .carousel.dotsBelow .carousel-dots {\\n        bottom: 0;\\n    }\\n\\n    .carousel.dotsBelow .carousel-dots li {\\n        background-color: rgba(var(--theme-bg-color-opposite));\\n    }\\n\\n    .carousel.stretch > .carousel-inner > .fluid {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        width: 100%;\\n    }\\n\\n    .carousel.auto > .carousel-inner > .fluid {\\n        width: auto;\\n    }\\n\\n    .carousel {\\n        width: 100%;\\n    }\\n\\n    .carousel-inner::-webkit-scrollbar {\\n        display: none;\\n    }\\n\\n    .carousel > .carousel-inner {\\n        width: 100%;\\n        overflow-y: hidden;\\n        overflow-x: scroll;\\n        background-color: rgba(var(--theme-bg-color-opposite), .04);\\n    }\\n\\n    .carousel-dots {\\n        position: absolute;\\n        left: 0;\\n        bottom: 10px;\\n        width: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        justify-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        pointer-events: none;\\n    }\\n\\n    .carousel-dots li {\\n        position: relative;\\n        width: 8px;\\n        height: 8px;\\n        margin: 5px;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n        background-color: rgba(var(--color-light));\\n    }\\n\\n    .carousel-dots li:not(.active) {\\n        opacity: .5;\\n    }\\n\\n    .carousel-dots li.active {\\n        -webkit-transform: scale(1.5);\\n                transform: scale(1.5);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0Nhcm91c2VsLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7T0FDRyx1Q0FBdUM7SUFDMUM7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLGdCQUFnQjtRQUNoQixnQkFBZ0I7UUFDaEIsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiwwQkFBb0I7WUFBcEIsdUJBQW9CO2dCQUFwQixvQkFBb0I7UUFDcEIseUJBQXdCO1lBQXhCLHNCQUF3QjtnQkFBeEIsd0JBQXdCO0lBQzVCOztJQUVBO1FBQ0ksb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksNkJBQTZCO0lBQ2pDOztJQUVBO1FBQ0ksU0FBUztJQUNiOztJQUVBO1FBQ0ksc0RBQXNEO0lBQzFEOztJQUVBO1FBQ0ksbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxhQUFhO0lBQ2pCOztJQUVBO1FBQ0ksV0FBVztRQUNYLGtCQUFrQjtRQUNsQixrQkFBa0I7UUFDbEIsMkRBQTJEO0lBQy9EOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLE9BQU87UUFDUCxZQUFZO1FBQ1osV0FBVztRQUNYLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHFCQUFxQjtRQUNyQix3QkFBdUI7WUFBdkIscUJBQXVCO2dCQUF2Qix1QkFBdUI7UUFDdkIsb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLFVBQVU7UUFDVixXQUFXO1FBQ1gsV0FBVztRQUNYLGtCQUFrQjtRQUNsQixnQkFBZ0I7UUFDaEIseUNBQWlDO2dCQUFqQyxpQ0FBaUM7UUFDakMsMENBQTBDO0lBQzlDOztJQUVBO1FBQ0ksV0FBVztJQUNmOztJQUVBO1FBQ0ksNkJBQXFCO2dCQUFyQixxQkFBcUI7SUFDekIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvQ2Fyb3VzZWwuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLmNhcm91c2VsLnJvdW5kZWQgPiAuY2Fyb3VzZWwtaW5uZXIge1xuICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtYmlnKTtcbiAgICB9XG5cbiAgICAuY2Fyb3VzZWwsIC5jYXJvdXNlbC1pbm5lciwgLmNhcm91c2VsLWlubmVyID4gbGkge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLmRvdHNCZWxvdyB7XG4gICAgICAgIHBhZGRpbmctYm90dG9tOiA0MHB4O1xuICAgIH1cblxuICAgIC5jYXJvdXNlbC5maWxsZWQgPiAuY2Fyb3VzZWwtaW5uZXIge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcbiAgICB9XG5cbiAgICAuY2Fyb3VzZWwuZG90c0JlbG93IC5jYXJvdXNlbC1kb3RzIHtcbiAgICAgICAgYm90dG9tOiAwO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbC5kb3RzQmVsb3cgLmNhcm91c2VsLWRvdHMgbGkge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yLW9wcG9zaXRlKSk7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLnN0cmV0Y2ggPiAuY2Fyb3VzZWwtaW5uZXIgPiAuZmx1aWQge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICB9XG5cbiAgICAuY2Fyb3VzZWwuYXV0byA+IC5jYXJvdXNlbC1pbm5lciA+IC5mbHVpZCB7XG4gICAgICAgIHdpZHRoOiBhdXRvO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbC1pbm5lcjo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbCA+IC5jYXJvdXNlbC1pbm5lciB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBvdmVyZmxvdy15OiBoaWRkZW47XG4gICAgICAgIG92ZXJmbG93LXg6IHNjcm9sbDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvci1vcHBvc2l0ZSksIC4wNCk7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLWRvdHMge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIGJvdHRvbTogMTBweDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktaXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbC1kb3RzIGxpIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICB3aWR0aDogOHB4O1xuICAgICAgICBoZWlnaHQ6IDhweDtcbiAgICAgICAgbWFyZ2luOiA1cHg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWxpZ2h0KSk7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLWRvdHMgbGk6bm90KC5hY3RpdmUpIHtcbiAgICAgICAgb3BhY2l0eTogLjU7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLWRvdHMgbGkuYWN0aXZlIHtcbiAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxLjUpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAkHI,SAAS,sCAAQ,CAAG,eAAe,8BAAC,CAAC,AAClC,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC1C,CAAC,AAED,sDAAS,CAAE,4DAAe,CAAE,6CAAe,CAAG,EAAE,8BAAC,CAAC,AAC9C,QAAQ,CAAE,QAAQ,CAClB,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,IAAI,CAChB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,AACpC,CAAC,AAED,SAAS,UAAU,6CAAC,CAAC,AACjB,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,SAAS,qCAAO,CAAG,eAAe,8BAAC,CAAC,AAChC,gBAAgB,CAAE,WAAW,AACjC,CAAC,AAED,SAAS,wCAAU,CAAC,cAAc,8BAAC,CAAC,AAChC,MAAM,CAAE,CAAC,AACb,CAAC,AAED,SAAS,wCAAU,CAAC,cAAc,CAAC,EAAE,8BAAC,CAAC,AACnC,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,AAC1D,CAAC,AAED,SAAS,uBAAQ,CAAG,8BAAe,CAAG,MAAM,eAAC,CAAC,AAC1C,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,KAAK,CAAE,IAAI,AACf,CAAC,AAED,SAAS,oBAAK,CAAG,8BAAe,CAAG,MAAM,eAAC,CAAC,AACvC,KAAK,CAAE,IAAI,AACf,CAAC,AAED,SAAS,6CAAC,CAAC,AACP,KAAK,CAAE,IAAI,AACf,CAAC,AAED,4DAAe,mBAAmB,AAAC,CAAC,AAChC,OAAO,CAAE,IAAI,AACjB,CAAC,AAED,uCAAS,CAAG,eAAe,8BAAC,CAAC,AACzB,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,MAAM,CAClB,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC/D,CAAC,AAED,cAAc,6CAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,aAAa,CAAE,MAAM,CACrB,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,4CAAc,CAAC,EAAE,8BAAC,CAAC,AACf,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,MAAM,CAAE,GAAG,CACX,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACzC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,AAC9C,CAAC,AAED,4CAAc,CAAC,gCAAE,KAAK,OAAO,CAAC,AAAC,CAAC,AAC5B,OAAO,CAAE,EAAE,AACf,CAAC,AAED,4CAAc,CAAC,EAAE,OAAO,8BAAC,CAAC,AACtB,iBAAiB,CAAE,MAAM,GAAG,CAAC,CACrB,SAAS,CAAE,MAAM,GAAG,CAAC,AACjC,CAAC\"}"
};

const Carousel = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { items = [] } = $$props;
	let { dots = true } = $$props;
	let { dotsBelow = true } = $$props;
	let { rounded = true } = $$props;
	let { size = "stretch" } = $$props;
	let { initIndex = 0 } = $$props;
	let { disableFancy = false } = $$props;
	let { stopPropagation = undefined } = $$props;
	let parent = null;

	function setScrollPosition(parent, activeDot) {
		if (!parent) return;
		const { width } = parent.getBoundingClientRect();

		waitUntil(
			() => {
				parent.scrollLeft = Math.round(width * activeDot);

				if (parent.scrollLeft !== Math.round(width * activeDot)) {
					throw new Error("Not set.");
				}
			},
			{ interval: 50 }
		);
	}

	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.dots === void 0 && $$bindings.dots && dots !== void 0) $$bindings.dots(dots);
	if ($$props.dotsBelow === void 0 && $$bindings.dotsBelow && dotsBelow !== void 0) $$bindings.dotsBelow(dotsBelow);
	if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.initIndex === void 0 && $$bindings.initIndex && initIndex !== void 0) $$bindings.initIndex(initIndex);
	if ($$props.disableFancy === void 0 && $$bindings.disableFancy && disableFancy !== void 0) $$bindings.disableFancy(disableFancy);
	if ($$props.stopPropagation === void 0 && $$bindings.stopPropagation && stopPropagation !== void 0) $$bindings.stopPropagation(stopPropagation);
	$$result.css.add(css$c);
	let activeDot = initIndex;

	let classProp = classnames("carousel", size, $$props.class, {
		dotsBelow,
		rounded,
		filled: items && items.length
	});

	 {
		setScrollPosition(parent, initIndex);
	}

	return `<section aria-label="${"carousel"}" class="${escape(null_to_empty(classProp)) + " svelte-10wgcs4"}">
    <ul class="${"carousel-inner scroll-x-center svelte-10wgcs4"}">
        ${items !== null
	? `${each(items, (item, index) => `<li class="${"fluid svelte-10wgcs4"}" role="${"button"}">
                    ${$$slots.default
		? $$slots.default({ item, index })
		: `
                        ${validate_component(FancyBox, "FancyBox").$$render($$result, { disabled: disableFancy }, {}, {
				box: () => `<section slot="${"box"}" class="${"flex full-width"}">
                                ${validate_component(Picture, "Picture").$$render($$result, Object.assign({ key: "picture" }, item, { alt: item.alt || "Фото слайду" }), {}, {})}
                            </section>`,
				default: () => `
                            ${validate_component(Picture, "Picture").$$render($$result, Object.assign({ key: "picture" }, item, { alt: item.alt || "Фото слайду" }), {}, {})}
                            
                        `
			})}
                    `}
                </li>`)}`
	: ``}
    </ul>


    ${dots && Array.isArray(items)
	? `<ul class="${"carousel-dots svelte-10wgcs4"}">
            ${each(items, (_item, i) => `<li class="${escape(null_to_empty(i === activeDot ? "active" : "")) + " svelte-10wgcs4"}"></li>`)}
        </ul>`
	: ``}
</section>`;
});

/* src/components/EditArea.svelte generated by Svelte v3.18.1 */

const css$d = {
	code: ".edit-area.svelte-kzlbkn{--color-bg:rgba(var(--theme-color-primary-opposite), .1);--color-lines:rgba(var(--theme-color-primary-opposite));padding:var(--screen-padding);background-image:-webkit-gradient(linear, left top, right top, color-stop(50%, var(--color-lines)), color-stop(0%, rgba(var(--color-black), 0))),\n                          -webkit-gradient(linear, left top, right top, color-stop(50%, var(--color-lines)), color-stop(0%, rgba(var(--color-black), 0)));background-image:linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%),\n                          linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%);background-color:var(--color-bg);background-position:top, bottom;background-size:20px 1px;background-repeat:repeat-x}.edit-area.svelte-kzlbkn *:not(.no-filter){-webkit-filter:grayscale(100%);filter:grayscale(100%)}",
	map: "{\"version\":3,\"file\":\"EditArea.svelte\",\"sources\":[\"EditArea.svelte\"],\"sourcesContent\":[\"<script>\\n\\n</script>\\n\\n<section class=\\\"edit-area\\\">\\n    <slot></slot>\\n</section>\\n\\n<style>\\n    .edit-area {\\n        --color-bg: rgba(var(--theme-color-primary-opposite), .1);\\n        --color-lines: rgba(var(--theme-color-primary-opposite));\\n\\n        padding: var(--screen-padding);\\n        background-image: -webkit-gradient(linear, left top, right top, color-stop(50%, var(--color-lines)), color-stop(0%, rgba(var(--color-black), 0))),\\n                          -webkit-gradient(linear, left top, right top, color-stop(50%, var(--color-lines)), color-stop(0%, rgba(var(--color-black), 0)));\\n        background-image: linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%),\\n                          linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%);\\n        background-color: var(--color-bg);\\n        background-position: top, bottom;\\n        background-size: 20px 1px;\\n        background-repeat: repeat-x;\\n    }\\n\\n    .edit-area :global(*:not(.no-filter)) {\\n        -webkit-filter: grayscale(100%);\\n                filter: grayscale(100%);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0VkaXRBcmVhLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSx5REFBeUQ7UUFDekQsd0RBQXdEOztRQUV4RCw4QkFBOEI7UUFDOUI7eUpBQ21HO1FBRG5HOzJHQUNtRztRQUNuRyxpQ0FBaUM7UUFDakMsZ0NBQWdDO1FBQ2hDLHlCQUF5QjtRQUN6QiwyQkFBMkI7SUFDL0I7O0lBRUE7UUFDSSwrQkFBdUI7Z0JBQXZCLHVCQUF1QjtJQUMzQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9FZGl0QXJlYS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuZWRpdC1hcmVhIHtcbiAgICAgICAgLS1jb2xvci1iZzogcmdiYSh2YXIoLS10aGVtZS1jb2xvci1wcmltYXJ5LW9wcG9zaXRlKSwgLjEpO1xuICAgICAgICAtLWNvbG9yLWxpbmVzOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnktb3Bwb3NpdGUpKTtcblxuICAgICAgICBwYWRkaW5nOiB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgICAgIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCh0byByaWdodCwgdmFyKC0tY29sb3ItbGluZXMpIDUwJSwgcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDApIDAlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCB2YXIoLS1jb2xvci1saW5lcykgNTAlLCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMCkgMCUpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1iZyk7XG4gICAgICAgIGJhY2tncm91bmQtcG9zaXRpb246IHRvcCwgYm90dG9tO1xuICAgICAgICBiYWNrZ3JvdW5kLXNpemU6IDIwcHggMXB4O1xuICAgICAgICBiYWNrZ3JvdW5kLXJlcGVhdDogcmVwZWF0LXg7XG4gICAgfVxuXG4gICAgLmVkaXQtYXJlYSA6Z2xvYmFsKCo6bm90KC5uby1maWx0ZXIpKSB7XG4gICAgICAgIGZpbHRlcjogZ3JheXNjYWxlKDEwMCUpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AASI,UAAU,cAAC,CAAC,AACR,UAAU,CAAE,6CAA6C,CACzD,aAAa,CAAE,yCAAyC,CAExD,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAC9B,gBAAgB,CAAE,iBAAiB,MAAM,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,WAAW,GAAG,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,WAAW,EAAE,CAAC,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;0BAChI,iBAAiB,MAAM,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,WAAW,GAAG,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,WAAW,EAAE,CAAC,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACjJ,gBAAgB,CAAE,gBAAgB,EAAE,CAAC,KAAK,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,GAAG,CAAC,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC;0BAClF,gBAAgB,EAAE,CAAC,KAAK,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,GAAG,CAAC,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CACnG,gBAAgB,CAAE,IAAI,UAAU,CAAC,CACjC,mBAAmB,CAAE,GAAG,CAAC,CAAC,MAAM,CAChC,eAAe,CAAE,IAAI,CAAC,GAAG,CACzB,iBAAiB,CAAE,QAAQ,AAC/B,CAAC,AAED,wBAAU,CAAC,AAAQ,iBAAiB,AAAE,CAAC,AACnC,cAAc,CAAE,UAAU,IAAI,CAAC,CACvB,MAAM,CAAE,UAAU,IAAI,CAAC,AACnC,CAAC\"}"
};

const EditArea = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$d);

	return `<section class="${"edit-area svelte-kzlbkn"}">
    ${$$slots.default ? $$slots.default({}) : ``}
</section>`;
});

/* src/components/Loader/Text.svelte generated by Svelte v3.18.1 */

const Text = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<rect x="${"0"}" y="${"10%"}" rx="${"3"}" ry="${"3"}" width="${"100%"}" height="${"80%"}"></rect>`;
});

/* src/components/Loader/Circle.svelte generated by Svelte v3.18.1 */

const Circle = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<circle cx="${"50%"}" cy="${"50%"}" r="${"50%"}"></circle>`;
});

/* src/components/Loader/Loader.svelte generated by Svelte v3.18.1 */

const css$e = {
	code: ".loader.svelte-e7rph0.svelte-e7rph0{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;-ms-flex-item-align:stretch;align-self:stretch;-webkit-transform:translateZ(0);transform:translateZ(0)}.loader.svelte-e7rph0 svg.svelte-e7rph0{-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;-ms-flex-item-align:stretch;align-self:stretch;-webkit-transform:translateZ(0);transform:translateZ(0)}.loader.absolute.svelte-e7rph0.svelte-e7rph0{position:absolute;top:0;left:0;right:0;bottom:0}.loader.border.svelte-e7rph0.svelte-e7rph0{outline-width:1px;outline-style:solid}",
	map: "{\"version\":3,\"file\":\"Loader.svelte\",\"sources\":[\"Loader.svelte\"],\"sourcesContent\":[\"<script>\\n    // How to make a custom loader?\\n    // See here for generating: https://danilowoz.com/create-content-loader/\\n    \\n    import { onMount } from 'svelte'\\n    import { classnames, uuid } from '@utils'\\n    import Text from './Text.svelte'\\n    import Circle from './Circle.svelte'\\n\\n    export let width = '100%' \\n    export let height = '100%'\\n    export let light = '#999999';\\n    export let dark = '#555555';\\n    export let opacity = .2;\\n    export let border = false;\\n    export let absolute = false;\\n    export let type = undefined; // h1, h2, h3, h4, h5, h6, p, pre, avatar\\n\\n    const uid = uuid()\\n\\n    let hTypes = {\\n        p: 21,\\n        h1: 35,\\n        h2: 29,\\n        h3: 26,\\n        h4: 21,\\n        h5: 21,\\n        h6: 21,\\n        pre: 21,\\n    }\\n\\n    onMount(() => {\\n        const style = getComputedStyle(document.body);\\n        const lh = Number.parseInt(style.getPropertyValue('line-height'))\\n        const balance = 0\\n\\n        hTypes = {\\n            p: lh * 1.15 + balance,\\n            h1: lh * 1.85 + balance,\\n            h2: lh * 1.4 + balance,\\n            h3: lh * 1.3 + balance,\\n            h4: lh * 1.15 + balance,\\n            h5: lh * 1.15 + balance,\\n            h6: lh * 1.15 + balance,\\n            pre: lh * 1.15 + balance,\\n        }\\n    })\\n\\n    $: areaWidth = width.replace('%', '')\\n    $: areaHeight = hTypes[type] || height\\n    $: classProp = classnames('loader', { border, absolute })\\n</script>\\n\\n<section \\n    class={classProp}\\n    style={`opacity: ${opacity}; outline-color: ${light};`}\\n>\\n    <svg\\n        role=\\\"img\\\"\\n        width=\\\"100%\\\"\\n        height={areaHeight}\\n        aria-labelledby=\\\"loading-aria\\\"\\n        viewBox={`0 0 ${areaWidth} 100`}\\n        preserveAspectRatio=\\\"none\\\"\\n    >\\n        <title id=\\\"loading-aria\\\">Loading...</title>\\n        <rect\\n            x=\\\"0\\\"\\n            y=\\\"0\\\"\\n            width=\\\"100%\\\"\\n            height=\\\"100%\\\"\\n            clip-path={`url(#clip-path-${uid})`}\\n            style='fill: url(\\\"#loader-fill\\\");'\\n        ></rect>\\n        <defs>\\n            <clipPath id={`clip-path-${uid}`}>\\n                <slot>\\n                    {#if 'avatar'.includes(type)}\\n                        <Circle/>\\n                    {:else if 'h1,h2,h3,h4,h5,h6,p,pre'.includes(type)}\\n                        <Text/>\\n                    {:else}\\n                        <rect x=\\\"0\\\" y=\\\"0\\\" rx=\\\"3\\\" ry=\\\"3\\\" width=\\\"100%\\\" height=\\\"100%\\\" />\\n                    {/if}\\n                </slot>\\n            </clipPath>\\n            <linearGradient id=\\\"loader-fill\\\">\\n                <stop\\n                    offset=\\\"0.599964\\\"\\n                    stop-color={light}\\n                    stop-opacity=\\\"1\\\"\\n                >\\n                    <animate\\n                    attributeName=\\\"offset\\\"\\n                    values=\\\"-2; -2; 1\\\"\\n                    keyTimes=\\\"0; 0.25; 1\\\"\\n                    dur=\\\"2s\\\"\\n                    repeatCount=\\\"indefinite\\\"\\n                    ></animate>\\n                </stop>\\n                <stop\\n                    offset=\\\"1.59996\\\"\\n                    stop-color={dark}\\n                    stop-opacity=\\\"1\\\"\\n                >\\n                    <animate\\n                    attributeName=\\\"offset\\\"\\n                    values=\\\"-1; -1; 2\\\"\\n                    keyTimes=\\\"0; 0.25; 1\\\"\\n                    dur=\\\"2s\\\"\\n                    repeatCount=\\\"indefinite\\\"\\n                    ></animate>\\n                </stop>\\n                <stop\\n                    offset=\\\"2.59996\\\"\\n                    stop-color={light}\\n                    stop-opacity=\\\"1\\\"\\n                >\\n                    <animate\\n                    attributeName=\\\"offset\\\"\\n                    values=\\\"0; 0; 3\\\"\\n                    keyTimes=\\\"0; 0.25; 1\\\"\\n                    dur=\\\"2s\\\"\\n                    repeatCount=\\\"indefinite\\\"\\n                    ></animate>\\n                </stop>\\n            </linearGradient>\\n        </defs>\\n    </svg>\\n</section>\\n\\n<style>\\n    .loader {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n    }\\n\\n    .loader svg {\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n    }\\n\\n    .loader.absolute {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        right: 0;\\n        bottom: 0;\\n    }\\n\\n    .loader.border {\\n        outline-width: 1px;\\n        outline-style: solid;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0xvYWRlci9Mb2FkZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IsbUJBQWM7WUFBZCxrQkFBYztnQkFBZCxjQUFjO1FBQ2QsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQixnQ0FBd0I7Z0JBQXhCLHdCQUF3QjtJQUM1Qjs7SUFFQTtRQUNJLG1CQUFjO1lBQWQsa0JBQWM7Z0JBQWQsY0FBYztRQUNkLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsZ0NBQXdCO2dCQUF4Qix3QkFBd0I7SUFDNUI7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsTUFBTTtRQUNOLE9BQU87UUFDUCxRQUFRO1FBQ1IsU0FBUztJQUNiOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLG9CQUFvQjtJQUN4QiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9Mb2FkZXIvTG9hZGVyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5sb2FkZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVaKDApO1xuICAgIH1cblxuICAgIC5sb2FkZXIgc3ZnIHtcbiAgICAgICAgZmxleDogMSAxIGF1dG87XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTtcbiAgICB9XG5cbiAgICAubG9hZGVyLmFic29sdXRlIHtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIHJpZ2h0OiAwO1xuICAgICAgICBib3R0b206IDA7XG4gICAgfVxuXG4gICAgLmxvYWRlci5ib3JkZXIge1xuICAgICAgICBvdXRsaW5lLXdpZHRoOiAxcHg7XG4gICAgICAgIG91dGxpbmUtc3R5bGU6IHNvbGlkO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAoII,OAAO,4BAAC,CAAC,AACL,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,AACpC,CAAC,AAED,qBAAO,CAAC,GAAG,cAAC,CAAC,AACT,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,AACpC,CAAC,AAED,OAAO,SAAS,4BAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,AACb,CAAC,AAED,OAAO,OAAO,4BAAC,CAAC,AACZ,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,KAAK,AACxB,CAAC\"}"
};

const Loader = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { width = "100%" } = $$props;
	let { height = "100%" } = $$props;
	let { light = "#999999" } = $$props;
	let { dark = "#555555" } = $$props;
	let { opacity = 0.2 } = $$props;
	let { border = false } = $$props;
	let { absolute = false } = $$props;
	let { type = undefined } = $$props; // h1, h2, h3, h4, h5, h6, p, pre, avatar
	const uid = uuidv4();

	let hTypes = {
		p: 21,
		h1: 35,
		h2: 29,
		h3: 26,
		h4: 21,
		h5: 21,
		h6: 21,
		pre: 21
	};

	onMount(() => {
		const style = getComputedStyle(document.body);
		const lh = Number.parseInt(style.getPropertyValue("line-height"));
		const balance = 0;

		hTypes = {
			p: lh * 1.15 + balance,
			h1: lh * 1.85 + balance,
			h2: lh * 1.4 + balance,
			h3: lh * 1.3 + balance,
			h4: lh * 1.15 + balance,
			h5: lh * 1.15 + balance,
			h6: lh * 1.15 + balance,
			pre: lh * 1.15 + balance
		};
	});

	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
	if ($$props.light === void 0 && $$bindings.light && light !== void 0) $$bindings.light(light);
	if ($$props.dark === void 0 && $$bindings.dark && dark !== void 0) $$bindings.dark(dark);
	if ($$props.opacity === void 0 && $$bindings.opacity && opacity !== void 0) $$bindings.opacity(opacity);
	if ($$props.border === void 0 && $$bindings.border && border !== void 0) $$bindings.border(border);
	if ($$props.absolute === void 0 && $$bindings.absolute && absolute !== void 0) $$bindings.absolute(absolute);
	if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
	$$result.css.add(css$e);
	let areaWidth = width.replace("%", "");
	let areaHeight = hTypes[type] || height;
	let classProp = classnames("loader", { border, absolute });

	return `<section class="${escape(null_to_empty(classProp)) + " svelte-e7rph0"}"${add_attribute("style", `opacity: ${opacity}; outline-color: ${light};`, 0)}>
    <svg role="${"img"}" width="${"100%"}"${add_attribute("height", areaHeight, 0)} aria-labelledby="${"loading-aria"}"${add_attribute("viewBox", `0 0 ${areaWidth} 100`, 0)} preserveAspectRatio="${"none"}" class="${"svelte-e7rph0"}">
        <title id="${"loading-aria"}">Loading...</title>
        <rect x="${"0"}" y="${"0"}" width="${"100%"}" height="${"100%"}"${add_attribute("clip-path", `url(#clip-path-${uid})`, 0)} style="${"fill: url(&quot;#loader-fill&quot;);"}"></rect>
        <defs>
            <clipPath${add_attribute("id", `clip-path-${uid}`, 0)}>
                ${$$slots.default
	? $$slots.default({})
	: `
                    ${("avatar").includes(type)
		? `${validate_component(Circle, "Circle").$$render($$result, {}, {}, {})}`
		: `${("h1,h2,h3,h4,h5,h6,p,pre").includes(type)
			? `${validate_component(Text, "Text").$$render($$result, {}, {}, {})}`
			: `<rect x="${"0"}" y="${"0"}" rx="${"3"}" ry="${"3"}" width="${"100%"}" height="${"100%"}"></rect>`}`}
                `}
            </clipPath>
            <linearGradient id="${"loader-fill"}">
                <stop offset="${"0.599964"}"${add_attribute("stop-color", light, 0)} stop-opacity="${"1"}">
                    <animate attributeName="${"offset"}" values="${"-2; -2; 1"}" keyTimes="${"0; 0.25; 1"}" dur="${"2s"}" repeatCount="${"indefinite"}"></animate>
                </stop>
                <stop offset="${"1.59996"}"${add_attribute("stop-color", dark, 0)} stop-opacity="${"1"}">
                    <animate attributeName="${"offset"}" values="${"-1; -1; 2"}" keyTimes="${"0; 0.25; 1"}" dur="${"2s"}" repeatCount="${"indefinite"}"></animate>
                </stop>
                <stop offset="${"2.59996"}"${add_attribute("stop-color", light, 0)} stop-opacity="${"1"}">
                    <animate attributeName="${"offset"}" values="${"0; 0; 3"}" keyTimes="${"0; 0.25; 1"}" dur="${"2s"}" repeatCount="${"indefinite"}"></animate>
                </stop>
            </linearGradient>
        </defs>
    </svg>
</section>`;
});

/* src/components/fields/Input.svelte generated by Svelte v3.18.1 */

const css$f = {
	code: ".inp.svelte-1q8pry0{width:100%;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}",
	map: "{\"version\":3,\"file\":\"Input.svelte\",\"sources\":[\"Input.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '@utils'\\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import FieldErrors from '@components/FieldErrors.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let name\\n    export let value = ''\\n    export let style = {}\\n    export let type = 'text'\\n    export let id = undefined\\n    export let align = undefined\\n    export let minlength = undefined\\n    export let maxlength = 1000\\n    export let rows = undefined\\n    export let disabled = false\\n    export let label = undefined\\n    export let invalid = undefined\\n    export let min = undefined // Specifies a minimum value for an <input> element\\n    export let max = undefined // Specifies the maximum value for an <input> element\\n    // export let list = undefined // Refers to a <datalist> element that contains pre-defined options for an <input> element\\n    export let form = undefined // Specifies the form the <input> element belongs to\\n    export let readonly = undefined // undefined|readonly\\n    export let required = undefined // undefined|required\\n    export let pattern = undefined // Specifies a regular expression that an <input> element's value is checked against (regexp)\\n    export let autocomplete = undefined// on|off\\n    export let ariaLabel = undefined\\n    export let placeholder = undefined\\n    // export let errors = undefined\\n\\n    const nameTypes = {\\n        'sex': { autocomplete: 'sex' },\\n        'bday': { autocomplete: 'on' },\\n        'name': { autocomplete: 'name' },\\n        'fname': { autocomplete: 'name' },\\n        'lname': { autocomplete: 'name' },\\n        'email': { autocomplete: 'email' },\\n        'phone': { autocomplete: 'tel' },\\n        'new-password': { autocomplete: 'password' },\\n        'ship-address': { autocomplete: 'shipping street-address' },\\n        'ship-city': { autocomplete: 'shipping locality' },\\n        'ship-state': { autocomplete: 'shipping region' },\\n        'ship-zip': { autocomplete: 'shipping postal-code' },\\n        'ship-country': { autocomplete: 'shipping country' },\\n        'ccname': { autocomplete: 'cc-name' },\\n        'cardnumber': { autocomplete: 'cc-number' },\\n        'cvc': { autocomplete: 'cc-csc' },\\n        'cc-exp': { autocomplete: 'cc-exp' },\\n    }\\n\\n    $: inputPredict = nameTypes[name] || {}\\n\\n    $: idProp = id || inputPredict.id || name\\n    $: typeProp = type === 'number' ? 'text' : type\\n    $: titleProp = label || ariaLabel\\n    $: ariaLabelProp = ariaLabel || label || placeholder\\n    $: styleProp = toCSSString({ ...style, textAlign: align })\\n    $: patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern\\n    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, invalid })\\n    $: autocompleteProp = autocomplete || inputPredict.autocomplete\\n</script>\\n\\n<!--<div class={classProp}>-->\\n<!--    {#if titleProp}-->\\n<!--        <label for={idProp} class=\\\"inp-label h2 font-secondary font-w-600 text-left\\\">-->\\n<!--            { titleProp }-->\\n<!--            <Br size=\\\"10\\\"/>-->\\n<!--        </label>-->\\n<!--    {/if}-->\\n\\n<!--    <div class=\\\"inp-inner-wrap\\\">-->\\n        {#if rows || type === 'textarea'}\\n            <textarea\\n                    {min}\\n                    {max}\\n                    {rows}\\n                    {name}\\n                    {form}\\n                    {align}\\n                    {readonly}\\n                    {disabled}\\n                    {required}\\n                    {minlength}\\n                    {maxlength}\\n                    {placeholder}\\n                    id={idProp}\\n                    class=\\\"inp-inner\\\"\\n                    title={titleProp}\\n                    style={styleProp}\\n                    pattern={patternProp}\\n                    aria-label={ariaLabelProp}\\n                    autocomplete={autocompleteProp}\\n                    {...{ type: typeProp }}\\n                    bind:value\\n            ></textarea>\\n        {:else}\\n            <input\\n                    {name}\\n                    {placeholder}\\n                    autocomplete={autocompleteProp}\\n                    {...{ type: typeProp }}\\n                    bind:value\\n            >\\n<!--\\n                    {min}\\n                    {max}\\n                    {name}\\n                    {list}\\n                    {form}\\n                    {align}\\n                    {readonly}\\n                    {disabled}\\n                    {required}\\n                    {minlength}\\n                    {maxlength}\\n                    {placeholder}\\n                    id={idProp}\\n                    class=\\\"inp-inner\\\"\\n                    title={titleProp}\\n                    style={styleProp}\\n                    pattern={patternProp}\\n                    aria-label={ariaLabelProp}\\n                    {...{ type: typeProp }}\\n                    bind:value\\n                    -->\\n        {/if}\\n\\n<!--        <div class=\\\"inp-post-icon\\\">-->\\n<!--            <slot name=\\\"post-icon\\\">-->\\n<!--                <Icon type=\\\"\\\"/>-->\\n<!--            </slot>-->\\n<!--        </div>-->\\n<!--    </div>-->\\n\\n<!--    <FieldErrors items={errors} class=\\\"inp-errors\\\">-->\\n<!--        <div slot=\\\"before\\\">-->\\n<!--            <Br size=\\\"5\\\"/>-->\\n<!--        </div>-->\\n<!--    </FieldErrors>-->\\n<!--</div>-->\\n\\n<style>\\n    .inp {\\n        width: 100%;\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n    }\\n\\n    .inp .inp-inner-wrap {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-shadow: var(--shadow-field-inset);\\n                box-shadow: var(--shadow-field-inset);\\n        border-radius: var(--border-radius-small);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n    .inp .inp-inner {\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        color: inherit;\\n        overflow-y: auto;\\n        overflow-x: hidden;\\n        background-color: transparent;\\n        -webkit-overflow-scrolling: touch;\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n    }\\n\\n    .inp .inp-post-icon {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        overflow: hidden;\\n    }\\n\\n    .inp .inp-inner::-webkit-input-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .inp .inp-inner::-moz-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .inp .inp-inner:-ms-input-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .inp .inp-inner::-ms-input-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .inp .inp-inner::placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2ZpZWxkcy9JbnB1dC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksV0FBVztRQUNYLG1CQUFjO1lBQWQsa0JBQWM7Z0JBQWQsY0FBYztRQUNkLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IsNEJBQXNCO1FBQXRCLDZCQUFzQjtZQUF0QiwwQkFBc0I7Z0JBQXRCLHNCQUFzQjtJQUMxQjs7SUFFQTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiw2Q0FBcUM7Z0JBQXJDLHFDQUFxQztRQUNyQyx5Q0FBeUM7UUFDekMsNkNBQTZDO0lBQ2pEOztJQUVBO1FBQ0ksbUJBQVk7WUFBWixvQkFBWTtnQkFBWixZQUFZO1FBQ1osY0FBYztRQUNkLGdCQUFnQjtRQUNoQixrQkFBa0I7UUFDbEIsNkJBQTZCO1FBQzdCLGlDQUFpQztRQUNqQyxzQ0FBc0M7UUFDdEMsdUNBQXVDO0lBQzNDOztJQUVBO1FBQ0ksbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLHlCQUFtQjtZQUFuQixzQkFBbUI7Z0JBQW5CLG1CQUFtQjtRQUNuQix3QkFBdUI7WUFBdkIscUJBQXVCO2dCQUF2Qix1QkFBdUI7UUFDdkIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksZ0RBQWdEO1FBQ2hELFdBQVc7SUFDZjs7SUFIQTtRQUNJLGdEQUFnRDtRQUNoRCxXQUFXO0lBQ2Y7O0lBSEE7UUFDSSxnREFBZ0Q7UUFDaEQsV0FBVztJQUNmOztJQUhBO1FBQ0ksZ0RBQWdEO1FBQ2hELFdBQVc7SUFDZjs7SUFIQTtRQUNJLGdEQUFnRDtRQUNoRCxXQUFXO0lBQ2YiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvZmllbGRzL0lucHV0LnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5pbnAge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleDogMSAxIGF1dG87XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgfVxuXG4gICAgLmlucCAuaW5wLWlubmVyLXdyYXAge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctZmllbGQtaW5zZXQpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzLXNtYWxsKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvcikpO1xuICAgIH1cblxuICAgIC5pbnAgLmlucC1pbm5lciB7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgY29sb3I6IGluaGVyaXQ7XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gICAgICAgIC13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOiB0b3VjaDtcbiAgICAgICAgbWluLXdpZHRoOiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICB9XG5cbiAgICAuaW5wIC5pbnAtcG9zdC1pY29uIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgfVxuXG4gICAgLmlucCAuaW5wLWlubmVyOjpwbGFjZWhvbGRlciB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnktb3Bwb3NpdGUpKTtcbiAgICAgICAgb3BhY2l0eTogLjI7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAiJI,IAAI,eAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,AAClC,CAAC\"}"
};

const Input = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { value = "" } = $$props;
	let { style = {} } = $$props;
	let { type = "text" } = $$props;
	let { id = undefined } = $$props;
	let { align = undefined } = $$props;
	let { minlength = undefined } = $$props;
	let { maxlength = 1000 } = $$props;
	let { rows = undefined } = $$props;
	let { disabled = false } = $$props;
	let { label = undefined } = $$props;
	let { invalid = undefined } = $$props;
	let { min = undefined } = $$props; // Specifies a minimum value for an <input> element
	let { max = undefined } = $$props; // Specifies the maximum value for an <input> element
	let { form = undefined } = $$props; // Specifies the form the <input> element belongs to
	let { readonly = undefined } = $$props; // undefined|readonly
	let { required = undefined } = $$props; // undefined|required
	let { pattern = undefined } = $$props; // Specifies a regular expression that an <input> element's value is checked against (regexp)
	let { autocomplete = undefined } = $$props; // on|off
	let { ariaLabel = undefined } = $$props;
	let { placeholder = undefined } = $$props;

	// export let errors = undefined
	const nameTypes = {
		"sex": { autocomplete: "sex" },
		"bday": { autocomplete: "on" },
		"name": { autocomplete: "name" },
		"fname": { autocomplete: "name" },
		"lname": { autocomplete: "name" },
		"email": { autocomplete: "email" },
		"phone": { autocomplete: "tel" },
		"new-password": { autocomplete: "password" },
		"ship-address": { autocomplete: "shipping street-address" },
		"ship-city": { autocomplete: "shipping locality" },
		"ship-state": { autocomplete: "shipping region" },
		"ship-zip": { autocomplete: "shipping postal-code" },
		"ship-country": { autocomplete: "shipping country" },
		"ccname": { autocomplete: "cc-name" },
		"cardnumber": { autocomplete: "cc-number" },
		"cvc": { autocomplete: "cc-csc" },
		"cc-exp": { autocomplete: "cc-exp" }
	};

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
	if ($$props.minlength === void 0 && $$bindings.minlength && minlength !== void 0) $$bindings.minlength(minlength);
	if ($$props.maxlength === void 0 && $$bindings.maxlength && maxlength !== void 0) $$bindings.maxlength(maxlength);
	if ($$props.rows === void 0 && $$bindings.rows && rows !== void 0) $$bindings.rows(rows);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.invalid === void 0 && $$bindings.invalid && invalid !== void 0) $$bindings.invalid(invalid);
	if ($$props.min === void 0 && $$bindings.min && min !== void 0) $$bindings.min(min);
	if ($$props.max === void 0 && $$bindings.max && max !== void 0) $$bindings.max(max);
	if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
	if ($$props.readonly === void 0 && $$bindings.readonly && readonly !== void 0) $$bindings.readonly(readonly);
	if ($$props.required === void 0 && $$bindings.required && required !== void 0) $$bindings.required(required);
	if ($$props.pattern === void 0 && $$bindings.pattern && pattern !== void 0) $$bindings.pattern(pattern);
	if ($$props.autocomplete === void 0 && $$bindings.autocomplete && autocomplete !== void 0) $$bindings.autocomplete(autocomplete);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0) $$bindings.placeholder(placeholder);
	$$result.css.add(css$f);
	let inputPredict = nameTypes[name] || {};
	let idProp = id || inputPredict.id || name;
	let typeProp = type === "number" ? "text" : type;
	let titleProp = label || ariaLabel;
	let ariaLabelProp = ariaLabel || label || placeholder;
	let styleProp = toCSSString({ ...style, textAlign: align });
	let patternProp = type === "number" && !pattern ? "[0-9]*" : pattern;
	let classProp = classnames("inp", $$props.class, { disabled, readonly, required, invalid });
	let autocompleteProp = autocomplete || inputPredict.autocomplete;

	return `








        ${rows || type === "textarea"
	? `<textarea${spread(
			[
				{ min: escape(min) },
				{ max: escape(max) },
				{ rows: escape(rows) },
				{ name: escape(name) },
				{ form: escape(form) },
				{ align: escape(align) },
				{ readonly: readonly || null },
				{ disabled: disabled || null },
				{ required: required || null },
				{ minlength: escape(minlength) },
				{ maxlength: escape(maxlength) },
				{ placeholder: escape(placeholder) },
				{ id: escape(idProp) },
				{ class: "inp-inner" },
				{ title: escape(titleProp) },
				{ style: escape(styleProp) },
				{ pattern: escape(patternProp) },
				{ "aria-label": escape(ariaLabelProp) },
				{ autocomplete: escape(autocompleteProp) },
				{ type: typeProp }
			],
			"svelte-1q8pry0"
		)}>${value || ""}</textarea>`
	: `<input${spread(
			[
				{ name: escape(name) },
				{ placeholder: escape(placeholder) },
				{ autocomplete: escape(autocompleteProp) },
				{ type: typeProp }
			],
			"svelte-1q8pry0"
		)}${add_attribute("value", value, 1)}>
`}













`;
});

/* src/components/app/Header.svelte generated by Svelte v3.18.1 */

const css$g = {
	code: "nav.svelte-5apnel.svelte-5apnel{position:fixed;top:0;width:100%;height:var(--header-height);z-index:7;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-transform:translateY(-100%);transform:translateY(-100%);-webkit-transition:.2s ease-in-out;transition:.2s ease-in-out;color:rgba(var(--color-font-light));-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-shadow:var(--shadow-secondary);box-shadow:var(--shadow-secondary);background-color:rgba(var(--color-dark-second))}nav.active.svelte-5apnel.svelte-5apnel{-webkit-transform:none;transform:none\n    }.selected.svelte-5apnel.svelte-5apnel{position:relative;display:inline-block}.selected.svelte-5apnel.svelte-5apnel::after{position:absolute;content:\"\";width:calc(100% - 1em);height:2px;background-color:rgb(var(--color-danger));display:block;bottom:-1px}.nav-pages.svelte-5apnel a.svelte-5apnel{padding:0.8em 0.5em}.nav-actions.svelte-5apnel.svelte-5apnel{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;margin:-3px}.nav-actions.svelte-5apnel li.svelte-5apnel{padding:3px}.nav-actions.svelte-5apnel a.svelte-5apnel{display:block}.lang-select.svelte-5apnel.svelte-5apnel{padding:5px;background-color:transparent;color:rgba(var(--color-font-light))}.lang-select.svelte-5apnel.svelte-5apnel:hover,.lang-select.svelte-5apnel.svelte-5apnel:focus{-webkit-box-shadow:none;box-shadow:none;background-color:rgba(var(--color-black), 0.1)}",
	map: "{\"version\":3,\"file\":\"Header.svelte\",\"sources\":[\"Header.svelte\"],\"sourcesContent\":[\"<script>\\n    import { onMount } from 'svelte'\\n    import { Storages } from '@services'\\n    import { classnames, safeGet } from '@utils'\\n    import Icon from '@components/Icon.svelte'\\n    import Button from '@components/Button.svelte'\\n    import Avatar from '@components/Avatar.svelte'\\n\\n    export let segment\\n\\n    let value = 'ua'\\n\\n    const gap = 50\\n    let isHeaderVisible = true\\n    let onScroll = null\\n    let lastY = 0\\n    $: classProp = classnames('container', { active: isHeaderVisible })\\n    onMount(() => {\\n        onScroll = () => requestAnimationFrame(function() {\\n            const currentY = window.pageYOffset;\\n            const direction = currentY - lastY\\n            if (direction < -gap || currentY < 50) { // up (50 - max scrollTop for displaying header)\\n                if (!isHeaderVisible) isHeaderVisible = true\\n                lastY = currentY + gap;\\n            } else if (direction > gap) { // down\\n                if (isHeaderVisible) isHeaderVisible = false\\n                lastY = currentY - gap;\\n            }\\n        })\\n    })\\n\\n    let themeName = safeGet(() => Storages.cookieStorage.get('theme') || Storages.localStorage.get('theme'))\\n    function changeTheme(theme) {\\n        themeName = theme\\n        document.body.classList.remove('theme-dark')\\n        document.body.classList.remove('theme-light')\\n        document.body.classList.add(theme)\\n\\n        document.getElementById('main').classList.remove('theme-dark')\\n        document.getElementById('main').classList.remove('theme-light')\\n        document.getElementById('main').classList.add(theme)\\n\\n        Storages.cookieStorage.set('theme', theme)\\n        Storages.localStorage.set('theme', theme)\\n    }\\n\\n    onMount(() => {\\n        changeTheme(themeName)\\n    })\\n</script>\\n\\n<svelte:window on:scroll={onScroll}/>\\n<nav class={classProp}>\\n    <ul class=\\\"nav-pages flex\\\">\\n        <li><a rel=prefetch href='.' class:selected='{segment === undefined}'>home</a></li>\\n        <li><a rel=prefetch href='lists/funds' class:selected='{segment === \\\"lists\\\"}'>lists</a></li>\\n        <li><a href='map' class:selected='{segment === \\\"map\\\"}'>map</a></li>\\n    </ul>\\n\\n    <ul class=\\\"nav-actions\\\">\\n        <li>\\n            <select {value} name=\\\"lang\\\" id=\\\"lang\\\" class=\\\"btn small lang-select\\\">\\n                <option value=\\\"ua\\\">Ua</option>\\n                <option value=\\\"ru\\\">Ru</option>\\n                <option value=\\\"en\\\">En</option>\\n            </select>\\n        </li>\\n\\n        <li>\\n            <Button on:click={() => changeTheme(themeName === 'theme-light' ? 'theme-dark' : 'theme-light')} auto size=\\\"small\\\">\\n                <Icon type=\\\"moon\\\" size=\\\"medium\\\" class=\\\"theme-svg-fill-opposite\\\" is=\\\"light\\\"/>\\n            </Button>\\n        </li>\\n\\n        <li>\\n            <a class=\\\"btn small\\\" href=\\\"users/me\\\">\\n                <Avatar size=\\\"small\\\" src=\\\"https://placeimg.com/30/30/people\\\" alt=\\\"avatar\\\"/>\\n            </a>\\n        </li>\\n    </ul>\\n</nav>\\n\\n<style>\\n    nav {\\n        position: fixed;\\n        top: 0;\\n        width: 100%;\\n        height: var(--header-height);\\n        z-index: 7;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-transform: translateY(-100%);\\n                transform: translateY(-100%);\\n        -webkit-transition: .2s ease-in-out;\\n        transition: .2s ease-in-out;\\n        color: rgba(var(--color-font-light));\\n        -webkit-box-pack: justify;\\n            -ms-flex-pack: justify;\\n                justify-content: space-between;\\n        -webkit-box-shadow: var(--shadow-secondary);\\n                box-shadow: var(--shadow-secondary);\\n        background-color: rgba(var(--color-dark-second));\\n    }\\n\\n    nav.active {\\n        -webkit-transform: none;\\n                transform: none\\n    }\\n\\n    .selected {\\n        position: relative;\\n        display: inline-block;\\n    }\\n\\n    .selected::after {\\n        position: absolute;\\n        content: \\\"\\\";\\n        width: calc(100% - 1em);\\n        height: 2px;\\n        background-color: rgb(var(--color-danger));\\n        display: block;\\n        bottom: -1px;\\n    }\\n\\n    .nav-pages a {\\n        padding: 0.8em 0.5em;\\n    }\\n\\n    .nav-actions {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        margin: -3px;\\n    }\\n\\n    .nav-actions li {\\n        padding: 3px;\\n    }\\n\\n    .nav-actions a {\\n        display: block;\\n    }\\n\\n    .lang-select {\\n        padding: 5px;\\n        background-color: transparent;\\n        color: rgba(var(--color-font-light));\\n    }\\n\\n    .lang-select:hover,\\n    .lang-select:focus {\\n        -webkit-box-shadow: none;\\n                box-shadow: none;\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9IZWFkZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGVBQWU7UUFDZixNQUFNO1FBQ04sV0FBVztRQUNYLDRCQUE0QjtRQUM1QixVQUFVO1FBQ1Ysb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsb0NBQTRCO2dCQUE1Qiw0QkFBNEI7UUFDNUIsbUNBQTJCO1FBQTNCLDJCQUEyQjtRQUMzQixvQ0FBb0M7UUFDcEMseUJBQThCO1lBQTlCLHNCQUE4QjtnQkFBOUIsOEJBQThCO1FBQzlCLDJDQUFtQztnQkFBbkMsbUNBQW1DO1FBQ25DLGdEQUFnRDtJQUNwRDs7SUFFQTtRQUNJLHVCQUFjO2dCQUFkO0lBQ0o7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIscUJBQXFCO0lBQ3pCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLFdBQVc7UUFDWCx1QkFBdUI7UUFDdkIsV0FBVztRQUNYLDBDQUEwQztRQUMxQyxjQUFjO1FBQ2QsWUFBWTtJQUNoQjs7SUFFQTtRQUNJLG9CQUFvQjtJQUN4Qjs7SUFFQTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLFlBQVk7SUFDaEI7O0lBRUE7UUFDSSxZQUFZO0lBQ2hCOztJQUVBO1FBQ0ksY0FBYztJQUNsQjs7SUFFQTtRQUNJLFlBQVk7UUFDWiw2QkFBNkI7UUFDN0Isb0NBQW9DO0lBQ3hDOztJQUVBOztRQUVJLHdCQUFnQjtnQkFBaEIsZ0JBQWdCO1FBQ2hCLCtDQUErQztJQUNuRCIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvSGVhZGVyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIG5hdiB7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiB2YXIoLS1oZWFkZXItaGVpZ2h0KTtcbiAgICAgICAgei1pbmRleDogNztcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xMDAlKTtcbiAgICAgICAgdHJhbnNpdGlvbjogLjJzIGVhc2UtaW4tb3V0O1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZGFyay1zZWNvbmQpKTtcbiAgICB9XG5cbiAgICBuYXYuYWN0aXZlIHtcbiAgICAgICAgdHJhbnNmb3JtOiBub25lXG4gICAgfVxuXG4gICAgLnNlbGVjdGVkIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfVxuXG4gICAgLnNlbGVjdGVkOjphZnRlciB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgY29udGVudDogXCJcIjtcbiAgICAgICAgd2lkdGg6IGNhbGMoMTAwJSAtIDFlbSk7XG4gICAgICAgIGhlaWdodDogMnB4O1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICBib3R0b206IC0xcHg7XG4gICAgfVxuXG4gICAgLm5hdi1wYWdlcyBhIHtcbiAgICAgICAgcGFkZGluZzogMC44ZW0gMC41ZW07XG4gICAgfVxuXG4gICAgLm5hdi1hY3Rpb25zIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgbWFyZ2luOiAtM3B4O1xuICAgIH1cblxuICAgIC5uYXYtYWN0aW9ucyBsaSB7XG4gICAgICAgIHBhZGRpbmc6IDNweDtcbiAgICB9XG5cbiAgICAubmF2LWFjdGlvbnMgYSB7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIH1cblxuICAgIC5sYW5nLXNlbGVjdCB7XG4gICAgICAgIHBhZGRpbmc6IDVweDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICB9XG5cbiAgICAubGFuZy1zZWxlY3Q6aG92ZXIsXG4gICAgLmxhbmctc2VsZWN0OmZvY3VzIHtcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAmFI,GAAG,4BAAC,CAAC,AACD,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,eAAe,CAAC,CAC5B,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,iBAAiB,CAAE,WAAW,KAAK,CAAC,CAC5B,SAAS,CAAE,WAAW,KAAK,CAAC,CACpC,kBAAkB,CAAE,GAAG,CAAC,WAAW,CACnC,UAAU,CAAE,GAAG,CAAC,WAAW,CAC3B,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,aAAa,CACtC,kBAAkB,CAAE,IAAI,kBAAkB,CAAC,CACnC,UAAU,CAAE,IAAI,kBAAkB,CAAC,CAC3C,gBAAgB,CAAE,KAAK,IAAI,mBAAmB,CAAC,CAAC,AACpD,CAAC,AAED,GAAG,OAAO,4BAAC,CAAC,AACR,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI;IAC3B,CAAC,AAED,SAAS,4BAAC,CAAC,AACP,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,AACzB,CAAC,AAED,qCAAS,OAAO,AAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,GAAG,CAAC,CACvB,MAAM,CAAE,GAAG,CACX,gBAAgB,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAC1C,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,wBAAU,CAAC,CAAC,cAAC,CAAC,AACV,OAAO,CAAE,KAAK,CAAC,KAAK,AACxB,CAAC,AAED,YAAY,4BAAC,CAAC,AACV,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,0BAAY,CAAC,EAAE,cAAC,CAAC,AACb,OAAO,CAAE,GAAG,AAChB,CAAC,AAED,0BAAY,CAAC,CAAC,cAAC,CAAC,AACZ,OAAO,CAAE,KAAK,AAClB,CAAC,AAED,YAAY,4BAAC,CAAC,AACV,OAAO,CAAE,GAAG,CACZ,gBAAgB,CAAE,WAAW,CAC7B,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,AACxC,CAAC,AAED,wCAAY,MAAM,CAClB,wCAAY,MAAM,AAAC,CAAC,AAChB,kBAAkB,CAAE,IAAI,CAChB,UAAU,CAAE,IAAI,CACxB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC\"}"
};

let value = "ua";

const Header = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	let isHeaderVisible = true;

	onMount(() => {
	});

	let themeName = safeGet(() => cookieStorage.get("theme") || localStorage.get("theme"));

	function changeTheme(theme) {
		themeName = theme;
		document.body.classList.remove("theme-dark");
		document.body.classList.remove("theme-light");
		document.body.classList.add(theme);
		document.getElementById("main").classList.remove("theme-dark");
		document.getElementById("main").classList.remove("theme-light");
		document.getElementById("main").classList.add(theme);
		cookieStorage.set("theme", theme);
		localStorage.set("theme", theme);
	}

	onMount(() => {
		changeTheme(themeName);
	});

	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$g);
	let classProp = classnames("container", { active: isHeaderVisible });

	return `
<nav class="${escape(null_to_empty(classProp)) + " svelte-5apnel"}">
    <ul class="${"nav-pages flex svelte-5apnel"}">
        <li class="${"svelte-5apnel"}"><a rel="${"prefetch"}" href="${"."}" class="${["svelte-5apnel", segment === undefined ? "selected" : ""].join(" ").trim()}">home</a></li>
        <li class="${"svelte-5apnel"}"><a rel="${"prefetch"}" href="${"lists/funds"}" class="${["svelte-5apnel", segment === "lists" ? "selected" : ""].join(" ").trim()}">lists</a></li>
        <li class="${"svelte-5apnel"}"><a href="${"map"}" class="${["svelte-5apnel", segment === "map" ? "selected" : ""].join(" ").trim()}">map</a></li>
    </ul>

    <ul class="${"nav-actions svelte-5apnel"}">
        <li class="${"svelte-5apnel"}">
            <select${add_attribute("value", value, 0)} name="${"lang"}" id="${"lang"}" class="${"btn small lang-select svelte-5apnel"}">
                <option value="${"ua"}">Ua</option>
                <option value="${"ru"}">Ru</option>
                <option value="${"en"}">En</option>
            </select>
        </li>

        <li class="${"svelte-5apnel"}">
            ${validate_component(Button, "Button").$$render($$result, { auto: true, size: "small" }, {}, {
		default: () => `
                ${validate_component(Icon, "Icon").$$render(
			$$result,
			{
				type: "moon",
				size: "medium",
				class: "theme-svg-fill-opposite",
				is: "light"
			},
			{},
			{}
		)}
            `
	})}
        </li>

        <li class="${"svelte-5apnel"}">
            <a class="${"btn small svelte-5apnel"}" href="${"users/me"}">
                ${validate_component(Avatar, "Avatar").$$render(
		$$result,
		{
			size: "small",
			src: "https://placeimg.com/30/30/people",
			alt: "avatar"
		},
		{},
		{}
	)}
            </a>
        </li>
    </ul>
</nav>`;
});

/* src/components/app/Footer.svelte generated by Svelte v3.18.1 */

const css$h = {
	code: "footer.svelte-76fy0z{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;padding:var(--screen-padding);-webkit-box-shadow:inset var(--shadow-primary);box-shadow:inset var(--shadow-primary);background-color:rgba(var(--theme-bg-color))}ul.svelte-76fy0z{display:-webkit-box;display:-ms-flexbox;display:flex;margin:-3px}li.svelte-76fy0z{padding:3px}",
	map: "{\"version\":3,\"file\":\"Footer.svelte\",\"sources\":[\"Footer.svelte\"],\"sourcesContent\":[\"<script>\\n    import Button from '@components/Button.svelte'\\n</script>\\n\\n<footer>\\n    <p>© {new Date().getFullYear()}</p>\\n    <ul>\\n        <li>\\n            <Button size=\\\"small\\\" is=\\\"success\\\">Action</Button>\\n        </li>\\n    </ul>\\n</footer>\\n\\n<style>\\n    footer {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: justify;\\n            -ms-flex-pack: justify;\\n                justify-content: space-between;\\n        padding: var(--screen-padding);\\n        -webkit-box-shadow: inset var(--shadow-primary);\\n                box-shadow: inset var(--shadow-primary);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n    ul {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        margin: -3px;\\n    }\\n\\n    li {\\n        padding: 3px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Gb290ZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHlCQUE4QjtZQUE5QixzQkFBOEI7Z0JBQTlCLDhCQUE4QjtRQUM5Qiw4QkFBOEI7UUFDOUIsK0NBQXVDO2dCQUF2Qyx1Q0FBdUM7UUFDdkMsNkNBQTZDO0lBQ2pEOztJQUVBO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixZQUFZO0lBQ2hCOztJQUVBO1FBQ0ksWUFBWTtJQUNoQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvRm9vdGVyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIGZvb3RlciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgcGFkZGluZzogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgICAgICBib3gtc2hhZG93OiBpbnNldCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICB9XG5cbiAgICB1bCB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG1hcmdpbjogLTNweDtcbiAgICB9XG5cbiAgICBsaSB7XG4gICAgICAgIHBhZGRpbmc6IDNweDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAcI,MAAM,cAAC,CAAC,AACJ,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,aAAa,CACtC,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAC9B,kBAAkB,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CACvC,UAAU,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CAC/C,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC,AAED,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,GAAG,AAChB,CAAC\"}"
};

const Footer = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$h);

	return `<footer class="${"svelte-76fy0z"}">
    <p>© ${escape(new Date().getFullYear())}</p>
    <ul class="${"svelte-76fy0z"}">
        <li class="${"svelte-76fy0z"}">
            ${validate_component(Button, "Button").$$render($$result, { size: "small", is: "success" }, {}, { default: () => `Action` })}
        </li>
    </ul>
</footer>`;
});

/* src/components/app/SocialsX.svelte generated by Svelte v3.18.1 */

const css$i = {
	code: ".social-icons.svelte-290smm li.svelte-290smm{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:40px;height:40px;border-radius:50%;overflow:hidden;margin:0 10px}.social-icons.svelte-290smm .telegram.svelte-290smm{background-color:#2197D2}.social-icons.svelte-290smm .facebook.svelte-290smm{background-color:#4267B2}.social-icons.svelte-290smm .viber.svelte-290smm{background-color:#665CAC}",
	map: "{\"version\":3,\"file\":\"SocialsX.svelte\",\"sources\":[\"SocialsX.svelte\"],\"sourcesContent\":[\"<script>\\n    import Icon from '../Icon.svelte'\\n    import Loader from '../Loader/Loader.svelte'\\n\\n    /**\\n     * @type {{\\n     *  href: string,\\n     *  title: string,\\n     *  type: Config.Icons,\\n     * }[]}\\n     */\\n    export let items\\n\\n    $: list = items === null ? [null, null, null] : items || []\\n</script>\\n\\n<ul class=\\\"flex flex-justify-center social-icons\\\">\\n    {#each list as item}\\n        {#if item !== null}\\n            <li class={item.type}>\\n                <slot {item}>\\n                    {#if item.href}\\n                        <a href={item.href} target=\\\"_blank\\\" title={item.title}>\\n                            <Icon type={item.type} size=\\\"medium\\\"/>\\n                        </a>\\n                    {:else}\\n                        <span on:click>\\n                            <Icon type={item.type} size=\\\"medium\\\"/>\\n                        </span>\\n                    {/if}\\n                </slot>\\n            </li>\\n        {:else}\\n            <li style=\\\"padding: 0 10px; width: 60px; height: 45px; overflow: hidden\\\">\\n                <Loader type=\\\"avatar\\\"/>\\n            </li>\\n        {/if}\\n    {/each}\\n</ul>\\n\\n<style>\\n    .social-icons li {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 40px;\\n        height: 40px;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        margin: 0 10px;\\n    }\\n\\n    .social-icons .telegram {\\n        background-color: #2197D2;\\n    }\\n    .social-icons .facebook {\\n        background-color: #4267B2;\\n    }\\n    .social-icons .viber {\\n        background-color: #665CAC;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Tb2NpYWxzWC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLFdBQVc7UUFDWCxZQUFZO1FBQ1osa0JBQWtCO1FBQ2xCLGdCQUFnQjtRQUNoQixjQUFjO0lBQ2xCOztJQUVBO1FBQ0kseUJBQXlCO0lBQzdCO0lBQ0E7UUFDSSx5QkFBeUI7SUFDN0I7SUFDQTtRQUNJLHlCQUF5QjtJQUM3QiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvU29jaWFsc1guc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnNvY2lhbC1pY29ucyBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB3aWR0aDogNDBweDtcbiAgICAgICAgaGVpZ2h0OiA0MHB4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIG1hcmdpbjogMCAxMHB4O1xuICAgIH1cblxuICAgIC5zb2NpYWwtaWNvbnMgLnRlbGVncmFtIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzIxOTdEMjtcbiAgICB9XG4gICAgLnNvY2lhbC1pY29ucyAuZmFjZWJvb2sge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNDI2N0IyO1xuICAgIH1cbiAgICAuc29jaWFsLWljb25zIC52aWJlciB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICM2NjVDQUM7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAyCI,2BAAa,CAAC,EAAE,cAAC,CAAC,AACd,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,MAAM,CAAE,CAAC,CAAC,IAAI,AAClB,CAAC,AAED,2BAAa,CAAC,SAAS,cAAC,CAAC,AACrB,gBAAgB,CAAE,OAAO,AAC7B,CAAC,AACD,2BAAa,CAAC,SAAS,cAAC,CAAC,AACrB,gBAAgB,CAAE,OAAO,AAC7B,CAAC,AACD,2BAAa,CAAC,MAAM,cAAC,CAAC,AAClB,gBAAgB,CAAE,OAAO,AAC7B,CAAC\"}"
};

const SocialsX = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$i);
	let list = items === null ? [null, null, null] : items || [];

	return `<ul class="${"flex flex-justify-center social-icons svelte-290smm"}">
    ${each(list, item => `${item !== null
	? `<li class="${escape(null_to_empty(item.type)) + " svelte-290smm"}">
                ${$$slots.default
		? $$slots.default({ item })
		: `
                    ${item.href
			? `<a${add_attribute("href", item.href, 0)} target="${"_blank"}"${add_attribute("title", item.title, 0)}>
                            ${validate_component(Icon, "Icon").$$render($$result, { type: item.type, size: "medium" }, {}, {})}
                        </a>`
			: `<span>
                            ${validate_component(Icon, "Icon").$$render($$result, { type: item.type, size: "medium" }, {}, {})}
                        </span>`}
                `}
            </li>`
	: `<li style="${"padding: 0 10px; width: 60px; height: 45px; overflow: hidden"}" class="${"svelte-290smm"}">
                ${validate_component(Loader, "Loader").$$render($$result, { type: "avatar" }, {}, {})}
            </li>`}`)}
</ul>`;
});

/* src/components/app/SocialsY.svelte generated by Svelte v3.18.1 */

const css$j = {
	code: ".social-icons.svelte-liclkg li.svelte-liclkg{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;overflow:hidden;margin:7px 0}.social-icons.svelte-liclkg .inner.svelte-liclkg{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center}.social-icons.svelte-liclkg .icon-wrap.svelte-liclkg{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:26px;height:26px;border-radius:50%;background-color:rgba(var(--color-dark))}",
	map: "{\"version\":3,\"file\":\"SocialsY.svelte\",\"sources\":[\"SocialsY.svelte\"],\"sourcesContent\":[\"\\n<script>\\n    import Icon from '../Icon.svelte'\\n    import Loader from '../Loader/Loader.svelte'\\n\\n    /**\\n     * @type {{\\n     *  href: string,\\n     *  title: string,\\n     *  type: Config.Icons,\\n     * }[]}\\n     */\\n    export let items\\n\\n    $: list = items === null ? [null, null, null] : items || []\\n</script>\\n\\n<ul class=\\\"social-icons\\\">\\n    {#each list as item}\\n        <li>\\n            {#if item !== null}\\n                <slot {item}>\\n                    {#if item.href}\\n                        <a href={item.href} target=\\\"_blank\\\" class=\\\"inner\\\" title={item.title}>\\n                            <span class=\\\"icon-wrap\\\">\\n                                <Icon type={item.type} size=\\\"tiny\\\"/>\\n                            </span>\\n                            <s></s>\\n                            <s></s>\\n                            <s></s>\\n                            <p class=\\\"h3\\\">{item.title}</p>\\n                        </a>\\n                    {:else}\\n                        <div on:click class=\\\"inner\\\" title={item.title}>\\n                            <span class=\\\"icon-wrap\\\">\\n                                <Icon type={item.type} size=\\\"tiny\\\"/>\\n                            </span>\\n                            <s></s>\\n                            <s></s>\\n                            <s></s>\\n                            <p class=\\\"h3\\\">{item.title}</p>\\n                        </div>\\n                    {/if}\\n                </slot>\\n            {:else}\\n                <span class=\\\"flex flex-align-center\\\" style=\\\"padding: 7px 0\\\">\\n                    <Loader type=\\\"h3\\\"/>\\n                </span>\\n            {/if}\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    .social-icons li {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        overflow: hidden;\\n        margin: 7px 0;\\n    }\\n\\n    .social-icons .inner {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n    }\\n\\n    .social-icons .icon-wrap {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 26px;\\n        height: 26px;\\n        border-radius: 50%;\\n        background-color: rgba(var(--color-dark));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Tb2NpYWxzWS5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsZ0JBQWdCO1FBQ2hCLGFBQWE7SUFDakI7O0lBRUE7UUFDSSxvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLHlCQUFtQjtZQUFuQixzQkFBbUI7Z0JBQW5CLG1CQUFtQjtJQUN2Qjs7SUFFQTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2QixXQUFXO1FBQ1gsWUFBWTtRQUNaLGtCQUFrQjtRQUNsQix5Q0FBeUM7SUFDN0MiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL1NvY2lhbHNZLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5zb2NpYWwtaWNvbnMgbGkge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBtYXJnaW46IDdweCAwO1xuICAgIH1cblxuICAgIC5zb2NpYWwtaWNvbnMgLmlubmVyIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAuc29jaWFsLWljb25zIC5pY29uLXdyYXAge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgd2lkdGg6IDI2cHg7XG4gICAgICAgIGhlaWdodDogMjZweDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhcmspKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAsDI,2BAAa,CAAC,EAAE,cAAC,CAAC,AACd,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,QAAQ,CAAE,MAAM,CAChB,MAAM,CAAE,GAAG,CAAC,CAAC,AACjB,CAAC,AAED,2BAAa,CAAC,MAAM,cAAC,CAAC,AAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,AAC/B,CAAC,AAED,2BAAa,CAAC,UAAU,cAAC,CAAC,AACtB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC\"}"
};

const SocialsY = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$j);
	let list = items === null ? [null, null, null] : items || [];

	return `<ul class="${"social-icons svelte-liclkg"}">
    ${each(list, item => `<li class="${"svelte-liclkg"}">
            ${item !== null
	? `${$$slots.default
		? $$slots.default({ item })
		: `
                    ${item.href
			? `<a${add_attribute("href", item.href, 0)} target="${"_blank"}" class="${"inner svelte-liclkg"}"${add_attribute("title", item.title, 0)}>
                            <span class="${"icon-wrap svelte-liclkg"}">
                                ${validate_component(Icon, "Icon").$$render($$result, { type: item.type, size: "tiny" }, {}, {})}
                            </span>
                            <s></s>
                            <s></s>
                            <s></s>
                            <p class="${"h3"}">${escape(item.title)}</p>
                        </a>`
			: `<div class="${"inner svelte-liclkg"}"${add_attribute("title", item.title, 0)}>
                            <span class="${"icon-wrap svelte-liclkg"}">
                                ${validate_component(Icon, "Icon").$$render($$result, { type: item.type, size: "tiny" }, {}, {})}
                            </span>
                            <s></s>
                            <s></s>
                            <s></s>
                            <p class="${"h3"}">${escape(item.title)}</p>
                        </div>`}
                `}`
	: `<span class="${"flex flex-align-center"}" style="${"padding: 7px 0"}">
                    ${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}
                </span>`}
        </li>`)}
</ul>`;
});

/* src/components/app/Documents.svelte generated by Svelte v3.18.1 */

const css$k = {
	code: ".documents.active .scroll-x-center > *{-webkit-transform:none;transform:none\n    }section.svelte-fiqk5v{height:calc((100vw - var(--screen-padding) * 2) * 1.428);padding:0 var(--screen-padding)}div.svelte-fiqk5v{-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;height:180px;width:126px;padding:15px 5px;-webkit-box-sizing:content-box;box-sizing:content-box}div.start.svelte-fiqk5v{padding-left:var(--screen-padding)}div.end.svelte-fiqk5v{padding-right:var(--screen-padding)}",
	map: "{\"version\":3,\"file\":\"Documents.svelte\",\"sources\":[\"Documents.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '@utils'\\n    import Card from '@components/Card.svelte'\\n    import Picture from '@components/Picture.svelte'\\n    import FancyBox from '@components/FancyBox.svelte'\\n    import Carousel from '@components/Carousel.svelte'\\n\\n    export let items = new Array(5).fill({})\\n\\n    let active = false\\n</script>\\n\\n<Carousel items={items} size=\\\"auto\\\" dots={false} let:item={item} let:index={index} class={classnames('documents', { active })}>\\n    <div class={!index ? 'start' : index === items.length - 1 ? 'end' : ''}>\\n        <FancyBox on:open={() => active = true} on:close={() => active = false}>\\n            <Card class=\\\"flex\\\">\\n                <Picture src={item.src} alt={item.title} size=\\\"contain\\\"/>\\n            </Card>\\n            <section slot=\\\"box\\\" class=\\\"flex full-container\\\">\\n                <Card class=\\\"flex\\\">\\n                    <Picture src={item.src} srcBig={item.src2x} alt={item.title} size=\\\"contain\\\"/>\\n                </Card>\\n            </section>\\n        </FancyBox>\\n    </div>\\n</Carousel>\\n\\n<style>\\n    :global(.documents.active .scroll-x-center > *) {\\n        -webkit-transform: none;\\n                transform: none\\n    }\\n\\n    section {\\n        height: calc((100vw - var(--screen-padding) * 2) * 1.428);\\n        padding: 0 var(--screen-padding);\\n    }\\n    \\n    div {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        height: 180px;\\n        width: 126px;\\n        padding: 15px 5px;\\n        -webkit-box-sizing: content-box;\\n                box-sizing: content-box;\\n    }\\n\\n    div.start {\\n        padding-left: var(--screen-padding);\\n    }\\n\\n    div.end {\\n        padding-right: var(--screen-padding);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Eb2N1bWVudHMuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLHVCQUFjO2dCQUFkO0lBQ0o7O0lBRUE7UUFDSSx5REFBeUQ7UUFDekQsZ0NBQWdDO0lBQ3BDOztJQUVBO1FBQ0ksbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsYUFBYTtRQUNiLFlBQVk7UUFDWixpQkFBaUI7UUFDakIsK0JBQXVCO2dCQUF2Qix1QkFBdUI7SUFDM0I7O0lBRUE7UUFDSSxtQ0FBbUM7SUFDdkM7O0lBRUE7UUFDSSxvQ0FBb0M7SUFDeEMiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL0RvY3VtZW50cy5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICA6Z2xvYmFsKC5kb2N1bWVudHMuYWN0aXZlIC5zY3JvbGwteC1jZW50ZXIgPiAqKSB7XG4gICAgICAgIHRyYW5zZm9ybTogbm9uZVxuICAgIH1cblxuICAgIHNlY3Rpb24ge1xuICAgICAgICBoZWlnaHQ6IGNhbGMoKDEwMHZ3IC0gdmFyKC0tc2NyZWVuLXBhZGRpbmcpICogMikgKiAxLjQyOCk7XG4gICAgICAgIHBhZGRpbmc6IDAgdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgIH1cbiAgICBcbiAgICBkaXYge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBoZWlnaHQ6IDE4MHB4O1xuICAgICAgICB3aWR0aDogMTI2cHg7XG4gICAgICAgIHBhZGRpbmc6IDE1cHggNXB4O1xuICAgICAgICBib3gtc2l6aW5nOiBjb250ZW50LWJveDtcbiAgICB9XG5cbiAgICBkaXYuc3RhcnQge1xuICAgICAgICBwYWRkaW5nLWxlZnQ6IHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICBkaXYuZW5kIHtcbiAgICAgICAgcGFkZGluZy1yaWdodDogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AA4BY,sCAAsC,AAAE,CAAC,AAC7C,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI;IAC3B,CAAC,AAED,OAAO,cAAC,CAAC,AACL,MAAM,CAAE,KAAK,CAAC,KAAK,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CACzD,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACpC,CAAC,AAED,GAAG,cAAC,CAAC,AACD,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,IAAI,CAAC,GAAG,CACjB,kBAAkB,CAAE,WAAW,CACvB,UAAU,CAAE,WAAW,AACnC,CAAC,AAED,GAAG,MAAM,cAAC,CAAC,AACP,YAAY,CAAE,IAAI,gBAAgB,CAAC,AACvC,CAAC,AAED,GAAG,IAAI,cAAC,CAAC,AACL,aAAa,CAAE,IAAI,gBAAgB,CAAC,AACxC,CAAC\"}"
};

const Documents = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = new Array(5).fill({}) } = $$props;
	let active = false;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$k);

	return `${validate_component(Carousel, "Carousel").$$render(
		$$result,
		{
			items,
			size: "auto",
			dots: false,
			class: classnames("documents", { active })
		},
		{},
		{
			default: ({ item, index }) => `
    <div class="${escape(null_to_empty(!index
			? "start"
			: index === items.length - 1 ? "end" : "")) + " svelte-fiqk5v"}">
        ${validate_component(FancyBox, "FancyBox").$$render($$result, {}, {}, {
				box: () => `<section slot="${"box"}" class="${"flex full-container svelte-fiqk5v"}">
                ${validate_component(Card, "Card").$$render($$result, { class: "flex" }, {}, {
					default: () => `
                    ${validate_component(Picture, "Picture").$$render(
						$$result,
						{
							src: item.src,
							srcBig: item.src2x,
							alt: item.title,
							size: "contain"
						},
						{},
						{}
					)}
                `
				})}
            </section>`,
				default: () => `
            ${validate_component(Card, "Card").$$render($$result, { class: "flex" }, {}, {
					default: () => `
                ${validate_component(Picture, "Picture").$$render(
						$$result,
						{
							src: item.src,
							alt: item.title,
							size: "contain"
						},
						{},
						{}
					)}
            `
				})}
            
        `
			})}
    </div>
`
		}
	)}`;
});

/* src/components/app/AvatarAndName.svelte generated by Svelte v3.18.1 */

const css$l = {
	code: "section.svelte-1s1l67a.svelte-1s1l67a{width:100%;-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-align:center;-ms-flex-align:center;align-items:center;overflow:hidden}span.svelte-1s1l67a.svelte-1s1l67a{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;overflow:hidden;padding:0 15px}span.svelte-1s1l67a h4.svelte-1s1l67a,span.svelte-1s1l67a sub.svelte-1s1l67a{max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
	map: "{\"version\":3,\"file\":\"AvatarAndName.svelte\",\"sources\":[\"AvatarAndName.svelte\"],\"sourcesContent\":[\"<script>\\n    import Avatar from '@components/Avatar.svelte'\\n\\n    export let src = undefined\\n    export let title = 'incognito'\\n    export let subtitle = ''\\n</script>\\n\\n<section>\\n    <Avatar src={src} size=\\\"medium\\\" alt={title}/>\\n\\n    <span>\\n        <h4>{title}</h4>\\n        <sub>{subtitle}</sub>\\n    </span>\\n</section>\\n\\n<style>\\n    section {\\n        width: 100%;\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        overflow: hidden;\\n    }\\n\\n    span {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        overflow: hidden;\\n        padding: 0 15px;\\n    }\\n\\n    span h4,\\n    span sub {\\n        max-width: 100%;\\n        overflow: hidden;\\n        white-space: nowrap;\\n        text-overflow: ellipsis;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9BdmF0YXJBbmROYW1lLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxXQUFXO1FBQ1gsbUJBQVk7WUFBWixvQkFBWTtnQkFBWixZQUFZO1FBQ1osb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYiw0QkFBbUI7WUFBbkIsbUJBQW1CO1FBQ25CLHlCQUFtQjtZQUFuQixzQkFBbUI7Z0JBQW5CLG1CQUFtQjtRQUNuQixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLDRCQUFzQjtRQUF0Qiw2QkFBc0I7WUFBdEIsMEJBQXNCO2dCQUF0QixzQkFBc0I7UUFDdEIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLGdCQUFnQjtRQUNoQixlQUFlO0lBQ25COztJQUVBOztRQUVJLGVBQWU7UUFDZixnQkFBZ0I7UUFDaEIsbUJBQW1CO1FBQ25CLHVCQUF1QjtJQUMzQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvQXZhdGFyQW5kTmFtZS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBzZWN0aW9uIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB9XG5cbiAgICBzcGFuIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHBhZGRpbmc6IDAgMTVweDtcbiAgICB9XG5cbiAgICBzcGFuIGg0LFxuICAgIHNwYW4gc3ViIHtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAkBI,OAAO,8BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,IAAI,8BAAC,CAAC,AACF,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,CAAC,CAAC,IAAI,AACnB,CAAC,AAED,mBAAI,CAAC,iBAAE,CACP,mBAAI,CAAC,GAAG,eAAC,CAAC,AACN,SAAS,CAAE,IAAI,CACf,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,QAAQ,AAC3B,CAAC\"}"
};

const AvatarAndName = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = undefined } = $$props;
	let { title = "incognito" } = $$props;
	let { subtitle = "" } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$l);

	return `<section class="${"svelte-1s1l67a"}">
    ${validate_component(Avatar, "Avatar").$$render($$result, { src, size: "medium", alt: title }, {}, {})}

    <span class="${"svelte-1s1l67a"}">
        <h4 class="${"svelte-1s1l67a"}">${escape(title)}</h4>
        <sub class="${"svelte-1s1l67a"}">${escape(subtitle)}</sub>
    </span>
</section>`;
});

/* src/components/app/ListItems.svelte generated by Svelte v3.18.1 */

const css$m = {
	code: ".item.svelte-eahofk{display:block;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary);border-radius:var(--border-radius-small);background-color:rgba(var(--theme-bg-color))}",
	map: "{\"version\":3,\"file\":\"ListItems.svelte\",\"sources\":[\"ListItems.svelte\"],\"sourcesContent\":[\"<script>\\n    import AvatarAndName from './AvatarAndName.svelte'\\n\\n    export let items = []\\n    export let basePath = ''\\n</script>\\n\\n{#each items as item}\\n    <a class=\\\"item container\\\" href={`${basePath}/${item.id}`}>\\n        <br>\\n        <AvatarAndName\\n                src={item.org_head_avatar}\\n                title={item.org_head}\\n                subtitle={item.organization}\\n        />\\n        <br>\\n    </a>\\n    <br>\\n{:else}\\n    <section class=\\\"item container\\\">\\n        <p class=\\\"text-center\\\">No organizations</p>\\n    </section>\\n{/each}\\n\\n<style>\\n    .item {\\n        display: block;\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n        border-radius: var(--border-radius-small);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9MaXN0SXRlbXMuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGNBQWM7UUFDZCxtQkFBYztZQUFkLGtCQUFjO2dCQUFkLGNBQWM7UUFDZCx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztRQUNqQyx5Q0FBeUM7UUFDekMsNkNBQTZDO0lBQ2pEIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2FwcC9MaXN0SXRlbXMuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLml0ZW0ge1xuICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgZmxleDogMSAxIGF1dG87XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cy1zbWFsbCk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAyBI,KAAK,cAAC,CAAC,AACH,OAAO,CAAE,KAAK,CACd,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACzC,aAAa,CAAE,IAAI,qBAAqB,CAAC,CACzC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC\"}"
};

const ListItems = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	let { basePath = "" } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.basePath === void 0 && $$bindings.basePath && basePath !== void 0) $$bindings.basePath(basePath);
	$$result.css.add(css$m);

	return `${items.length
	? each(items, item => `<a class="${"item container svelte-eahofk"}"${add_attribute("href", `${basePath}/${item.id}`, 0)}>
        <br>
        ${validate_component(AvatarAndName, "AvatarAndName").$$render(
			$$result,
			{
				src: item.org_head_avatar,
				title: item.org_head,
				subtitle: item.organization
			},
			{},
			{}
		)}
        <br>
    </a>
    <br>`)
	: `<section class="${"item container svelte-eahofk"}">
        <p class="${"text-center"}">No organizations</p>
    </section>`}`;
});

/* src/components/app/SearchLine.svelte generated by Svelte v3.18.1 */

const SearchLine = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<section class="${"search svelte-ibwz4z"}">
    ${validate_component(Input, "Input").$$render($$result, {}, {}, {})}
</section>`;
});

/* src/components/app/TrustButton.svelte generated by Svelte v3.18.1 */

const css$n = {
	code: ".trust-btn.svelte-1j7kueo.svelte-1j7kueo{position:relative;display:block;width:100%;height:0;padding-bottom:100%;border-radius:50%;overflow:hidden}div.svelte-1j7kueo.svelte-1j7kueo{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;border-radius:50%;border:4px solid rgba(var(--color-danger));background-color:rgba(var(--color-danger), .2)}.trust-btn.isActive.svelte-1j7kueo div.svelte-1j7kueo{background-color:rgba(var(--color-danger), 1)}.trust-btn.isActive.svelte-1j7kueo svg.svelte-1j7kueo{fill:rgba(var(--color-white));-webkit-animation:none;animation:none;-webkit-transform:scale(1.1);transform:scale(1.1)\n    }svg.svelte-1j7kueo.svelte-1j7kueo{width:50%;height:50%;margin-top:3px;max-width:calc(100% - 10px);max-height:calc(100% - 10px);fill:rgba(var(--color-danger));-webkit-animation:svelte-1j7kueo-pulse 2s infinite;animation:svelte-1j7kueo-pulse 2s infinite}@-webkit-keyframes svelte-1j7kueo-pulse{10%{-webkit-transform:scale(1.1);transform:scale(1.1)\n        }20%{-webkit-transform:scale(1.05);transform:scale(1.05)\n        }30%{-webkit-transform:scale(1.15);transform:scale(1.15)\n        }}@keyframes svelte-1j7kueo-pulse{10%{-webkit-transform:scale(1.1);transform:scale(1.1)\n        }20%{-webkit-transform:scale(1.05);transform:scale(1.05)\n        }30%{-webkit-transform:scale(1.15);transform:scale(1.15)\n        }}",
	map: "{\"version\":3,\"file\":\"TrustButton.svelte\",\"sources\":[\"TrustButton.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '@utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let isActive = null\\n    export let onAsyncClick = null\\n\\n    let isActiveLocal = !!isActive\\n\\n    $: isActiveState = isActive === null ? isActiveLocal : isActive\\n    $: classProp = classnames('trust-btn', $$props.class, { isActive: isActiveState })\\n\\n    function onClickHandler(e) {\\n        onClickEvent(e)\\n        onClickPromise(e)\\n    }\\n\\n    function onClickEvent(e) {\\n        dispatch('click', e)\\n    }\\n\\n    const onClickPromise = async (e) => {\\n        if (typeof onAsyncClick === 'function') {\\n            try {\\n                isActiveLocal = !isActiveLocal\\n                await onAsyncClick(e)\\n            } catch (err) {\\n                isActiveLocal = !isActiveLocal\\n            }\\n        }\\n    }\\n</script>\\n\\n<button type=\\\"button\\\" title=\\\"I trust\\\" class={classProp} on:click={onClickHandler}>\\n    <div class=\\\"full-absolute\\\">\\n        <svg>\\n            <use xlink:href=\\\"#ico-heart-filled\\\" class=\\\"ico-use\\\"/>\\n        </svg>\\n    </div>\\n</button>\\n\\n<style>\\n    .trust-btn {\\n        position: relative;\\n        display: block;\\n        width: 100%;\\n        height: 0;\\n        padding-bottom: 100%;\\n        border-radius: 50%;\\n        overflow: hidden;\\n    }\\n\\n    div {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        border-radius: 50%;\\n        border: 4px solid rgba(var(--color-danger));\\n        background-color: rgba(var(--color-danger), .2);\\n    }\\n\\n    .trust-btn.isActive div {\\n        background-color: rgba(var(--color-danger), 1);\\n    }\\n\\n    .trust-btn.isActive svg {\\n        fill: rgba(var(--color-white));\\n        -webkit-animation: none;\\n                animation: none;\\n        -webkit-transform: scale(1.1);\\n                transform: scale(1.1)\\n    }\\n\\n    svg {\\n        width: 50%;\\n        height: 50%;\\n        margin-top: 3px;\\n        max-width: calc(100% - 10px);\\n        max-height: calc(100% - 10px);\\n        fill: rgba(var(--color-danger));\\n        -webkit-animation: pulse 2s infinite;\\n                animation: pulse 2s infinite;\\n    }\\n\\n    @-webkit-keyframes pulse {\\n        10% {\\n            -webkit-transform: scale(1.1);\\n                    transform: scale(1.1)\\n        }\\n        20% {\\n            -webkit-transform: scale(1.05);\\n                    transform: scale(1.05)\\n        }\\n        30% {\\n            -webkit-transform: scale(1.15);\\n                    transform: scale(1.15)\\n        }\\n    }\\n\\n    @keyframes pulse {\\n        10% {\\n            -webkit-transform: scale(1.1);\\n                    transform: scale(1.1)\\n        }\\n        20% {\\n            -webkit-transform: scale(1.05);\\n                    transform: scale(1.05)\\n        }\\n        30% {\\n            -webkit-transform: scale(1.15);\\n                    transform: scale(1.15)\\n        }\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9UcnVzdEJ1dHRvbi5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksa0JBQWtCO1FBQ2xCLGNBQWM7UUFDZCxXQUFXO1FBQ1gsU0FBUztRQUNULG9CQUFvQjtRQUNwQixrQkFBa0I7UUFDbEIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLGtCQUFrQjtRQUNsQiwyQ0FBMkM7UUFDM0MsK0NBQStDO0lBQ25EOztJQUVBO1FBQ0ksOENBQThDO0lBQ2xEOztJQUVBO1FBQ0ksOEJBQThCO1FBQzlCLHVCQUFlO2dCQUFmLGVBQWU7UUFDZiw2QkFBb0I7Z0JBQXBCO0lBQ0o7O0lBRUE7UUFDSSxVQUFVO1FBQ1YsV0FBVztRQUNYLGVBQWU7UUFDZiw0QkFBNEI7UUFDNUIsNkJBQTZCO1FBQzdCLCtCQUErQjtRQUMvQixvQ0FBNEI7Z0JBQTVCLDRCQUE0QjtJQUNoQzs7SUFFQTtRQUNJO1lBQ0ksNkJBQW9CO29CQUFwQjtRQUNKO1FBQ0E7WUFDSSw4QkFBcUI7b0JBQXJCO1FBQ0o7UUFDQTtZQUNJLDhCQUFxQjtvQkFBckI7UUFDSjtJQUNKOztJQVZBO1FBQ0k7WUFDSSw2QkFBb0I7b0JBQXBCO1FBQ0o7UUFDQTtZQUNJLDhCQUFxQjtvQkFBckI7UUFDSjtRQUNBO1lBQ0ksOEJBQXFCO29CQUFyQjtRQUNKO0lBQ0oiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL1RydXN0QnV0dG9uLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC50cnVzdC1idG4ge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAwO1xuICAgICAgICBwYWRkaW5nLWJvdHRvbTogMTAwJTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIH1cblxuICAgIGRpdiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIGJvcmRlcjogNHB4IHNvbGlkIHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSwgLjIpO1xuICAgIH1cblxuICAgIC50cnVzdC1idG4uaXNBY3RpdmUgZGl2IHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpLCAxKTtcbiAgICB9XG5cbiAgICAudHJ1c3QtYnRuLmlzQWN0aXZlIHN2ZyB7XG4gICAgICAgIGZpbGw6IHJnYmEodmFyKC0tY29sb3Itd2hpdGUpKTtcbiAgICAgICAgYW5pbWF0aW9uOiBub25lO1xuICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMSlcbiAgICB9XG5cbiAgICBzdmcge1xuICAgICAgICB3aWR0aDogNTAlO1xuICAgICAgICBoZWlnaHQ6IDUwJTtcbiAgICAgICAgbWFyZ2luLXRvcDogM3B4O1xuICAgICAgICBtYXgtd2lkdGg6IGNhbGMoMTAwJSAtIDEwcHgpO1xuICAgICAgICBtYXgtaGVpZ2h0OiBjYWxjKDEwMCUgLSAxMHB4KTtcbiAgICAgICAgZmlsbDogcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICAgICAgYW5pbWF0aW9uOiBwdWxzZSAycyBpbmZpbml0ZTtcbiAgICB9XG5cbiAgICBAa2V5ZnJhbWVzIHB1bHNlIHtcbiAgICAgICAgMTAlIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4xKVxuICAgICAgICB9XG4gICAgICAgIDIwJSB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMDUpXG4gICAgICAgIH1cbiAgICAgICAgMzAlIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4xNSlcbiAgICAgICAgfVxuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AA4CI,UAAU,8BAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,CAAC,CACT,cAAc,CAAE,IAAI,CACpB,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,GAAG,8BAAC,CAAC,AACD,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,aAAa,CAAE,GAAG,CAClB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,cAAc,CAAC,CAAC,CAC3C,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,EAAE,CAAC,AACnD,CAAC,AAED,UAAU,wBAAS,CAAC,GAAG,eAAC,CAAC,AACrB,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,CAAC,CAAC,AAClD,CAAC,AAED,UAAU,wBAAS,CAAC,GAAG,eAAC,CAAC,AACrB,IAAI,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAC9B,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI,CACvB,iBAAiB,CAAE,MAAM,GAAG,CAAC,CACrB,SAAS,CAAE,MAAM,GAAG,CAAC;IACjC,CAAC,AAED,GAAG,8BAAC,CAAC,AACD,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,UAAU,CAAE,GAAG,CACf,SAAS,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAC5B,UAAU,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAC7B,IAAI,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAC/B,iBAAiB,CAAE,oBAAK,CAAC,EAAE,CAAC,QAAQ,CAC5B,SAAS,CAAE,oBAAK,CAAC,EAAE,CAAC,QAAQ,AACxC,CAAC,AAED,mBAAmB,oBAAM,CAAC,AACtB,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,GAAG,CAAC,CACrB,SAAS,CAAE,MAAM,GAAG,CAAC;QACjC,CAAC,AACD,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,IAAI,CAAC,CACtB,SAAS,CAAE,MAAM,IAAI,CAAC;QAClC,CAAC,AACD,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,IAAI,CAAC,CACtB,SAAS,CAAE,MAAM,IAAI,CAAC;QAClC,CAAC,AACL,CAAC,AAED,WAAW,oBAAM,CAAC,AACd,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,GAAG,CAAC,CACrB,SAAS,CAAE,MAAM,GAAG,CAAC;QACjC,CAAC,AACD,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,IAAI,CAAC,CACtB,SAAS,CAAE,MAAM,IAAI,CAAC;QAClC,CAAC,AACD,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,IAAI,CAAC,CACtB,SAAS,CAAE,MAAM,IAAI,CAAC;QAClC,CAAC,AACL,CAAC\"}"
};

const TrustButton = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { isActive = null } = $$props;
	let { onAsyncClick = null } = $$props;
	let isActiveLocal = !!isActive;

	if ($$props.isActive === void 0 && $$bindings.isActive && isActive !== void 0) $$bindings.isActive(isActive);
	if ($$props.onAsyncClick === void 0 && $$bindings.onAsyncClick && onAsyncClick !== void 0) $$bindings.onAsyncClick(onAsyncClick);
	$$result.css.add(css$n);
	let isActiveState = isActive === null ? isActiveLocal : isActive;
	let classProp = classnames("trust-btn", $$props.class, { isActive: isActiveState });

	return `<button type="${"button"}" title="${"I trust"}" class="${escape(null_to_empty(classProp)) + " svelte-1j7kueo"}">
    <div class="${"full-absolute svelte-1j7kueo"}">
        <svg class="${"svelte-1j7kueo"}">
            <use xlink:href="${"#ico-heart-filled"}" class="${"ico-use"}"></use>
        </svg>
    </div>
</button>`;
});

/* src/components/app/ListsLayout.svelte generated by Svelte v3.18.1 */

const css$o = {
	code: ".search.svelte-1vpuklg.svelte-1vpuklg{-webkit-box-flex:0;-ms-flex:none;flex:none;position:relative;-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.list-wrap.svelte-1vpuklg.svelte-1vpuklg{-webkit-box-flex:1;-ms-flex:1 1 0px;flex:1 1 0;overflow-x:hidden;overflow-y:auto;padding:0 var(--screen-padding);-webkit-box-shadow:inset 0 -100px 2000px rgba(var(--color-black), .5);box-shadow:inset 0 -100px 2000px rgba(var(--color-black), .5)}nav.svelte-1vpuklg ul.svelte-1vpuklg,nav.svelte-1vpuklg li.svelte-1vpuklg{display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch}li.svelte-1vpuklg.svelte-1vpuklg{-webkit-box-flex:1;-ms-flex:1 1 0px;flex:1 1 0}li.svelte-1vpuklg a.svelte-1vpuklg{-webkit-box-flex:1;-ms-flex:1 1 0px;flex:1 1 0;-ms-flex-item-align:stretch;align-self:stretch;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;text-align:center;padding:20px 10px}li.svelte-1vpuklg a.svelte-1vpuklg:hover,li.svelte-1vpuklg a.selected.svelte-1vpuklg{background-color:rgba(var(--color-black), .1)}",
	map: "{\"version\":3,\"file\":\"ListsLayout.svelte\",\"sources\":[\"ListsLayout.svelte\"],\"sourcesContent\":[\"<svelte:head>\\n    <title>Charitify - is the application for helping those in need.</title>\\n</svelte:head>\\n\\n<script>\\n    import Footer from './Footer.svelte'\\n    import SearchLine from './SearchLine.svelte'\\n\\n    export let segment\\n</script>\\n\\n<div class=\\\"search theme-bg container\\\">\\n    <br>\\n\\n    <SearchLine/>\\n\\n    <nav>\\n        <ul>\\n            <li><a rel=prefetch href='lists/funds' class:selected='{segment === \\\"charities\\\"}'>funds</a></li>\\n            <li><a rel=prefetch href='lists/organizations' class:selected='{segment === \\\"organizations\\\"}'>organizations</a></li>\\n        </ul>\\n    </nav>\\n</div>\\n\\n<div class=\\\"list-wrap\\\">\\n    <br>\\n\\n    <slot></slot>\\n\\n    <br>\\n    <br>\\n</div>\\n\\n<Footer/>\\n\\n<style>\\n    .search {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        position: relative;\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    .list-wrap {\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 0px;\\n                flex: 1 1 0;\\n        overflow-x: hidden;\\n        overflow-y: auto;\\n        padding: 0 var(--screen-padding);\\n        -webkit-box-shadow: inset 0 -100px 2000px rgba(var(--color-black), .5);\\n                box-shadow: inset 0 -100px 2000px rgba(var(--color-black), .5);\\n    }\\n\\n    nav ul, nav li {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n    }\\n\\n    li {\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 0px;\\n                flex: 1 1 0;\\n    }\\n\\n    li a {\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 0px;\\n                flex: 1 1 0;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        text-align: center;\\n        padding: 20px 10px;\\n    }\\n\\n    li a:hover, li a.selected {\\n        background-color: rgba(var(--color-black), .1);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9MaXN0c0xheW91dC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixrQkFBa0I7UUFDbEIseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSxtQkFBVztZQUFYLGlCQUFXO2dCQUFYLFdBQVc7UUFDWCxrQkFBa0I7UUFDbEIsZ0JBQWdCO1FBQ2hCLGdDQUFnQztRQUNoQyxzRUFBOEQ7Z0JBQTlELDhEQUE4RDtJQUNsRTs7SUFFQTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiwwQkFBb0I7WUFBcEIsdUJBQW9CO2dCQUFwQixvQkFBb0I7UUFDcEIseUJBQXdCO1lBQXhCLHNCQUF3QjtnQkFBeEIsd0JBQXdCO0lBQzVCOztJQUVBO1FBQ0ksbUJBQVc7WUFBWCxpQkFBVztnQkFBWCxXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxtQkFBVztZQUFYLGlCQUFXO2dCQUFYLFdBQVc7UUFDWCw0QkFBbUI7WUFBbkIsbUJBQW1CO1FBQ25CLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2QixrQkFBa0I7UUFDbEIsa0JBQWtCO0lBQ3RCOztJQUVBO1FBQ0ksOENBQThDO0lBQ2xEIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2FwcC9MaXN0c0xheW91dC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuc2VhcmNoIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmxpc3Qtd3JhcCB7XG4gICAgICAgIGZsZXg6IDEgMSAwO1xuICAgICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIHBhZGRpbmc6IDAgdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgICAgICBib3gtc2hhZG93OiBpbnNldCAwIC0xMDBweCAyMDAwcHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC41KTtcbiAgICB9XG5cbiAgICBuYXYgdWwsIG5hdiBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgfVxuXG4gICAgbGkge1xuICAgICAgICBmbGV4OiAxIDEgMDtcbiAgICB9XG5cbiAgICBsaSBhIHtcbiAgICAgICAgZmxleDogMSAxIDA7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmc6IDIwcHggMTBweDtcbiAgICB9XG5cbiAgICBsaSBhOmhvdmVyLCBsaSBhLnNlbGVjdGVkIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4xKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAoCI,OAAO,8BAAC,CAAC,AACL,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,QAAQ,CAAE,QAAQ,CAClB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAED,UAAU,8BAAC,CAAC,AACR,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CACb,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAChC,kBAAkB,CAAE,KAAK,CAAC,CAAC,CAAC,MAAM,CAAC,MAAM,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,CAC9D,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,MAAM,CAAC,MAAM,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AAC1E,CAAC,AAED,kBAAG,CAAC,iBAAE,CAAE,kBAAG,CAAC,EAAE,eAAC,CAAC,AACZ,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,AACpC,CAAC,AAED,EAAE,8BAAC,CAAC,AACA,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CACb,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,AACvB,CAAC,AAED,iBAAE,CAAC,CAAC,eAAC,CAAC,AACF,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CACb,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,IAAI,CAAC,IAAI,AACtB,CAAC,AAED,iBAAE,CAAC,gBAAC,MAAM,CAAE,iBAAE,CAAC,CAAC,SAAS,eAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AAClD,CAAC\"}"
};

const ListsLayout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$o);

	return `${($$result.head += `${($$result.title = `<title>Charitify - is the application for helping those in need.</title>`, "")}`, "")}



<div class="${"search theme-bg container svelte-1vpuklg"}">
    <br>

    ${validate_component(SearchLine, "SearchLine").$$render($$result, {}, {}, {})}

    <nav class="${"svelte-1vpuklg"}">
        <ul class="${"svelte-1vpuklg"}">
            <li class="${"svelte-1vpuklg"}"><a rel="${"prefetch"}" href="${"lists/funds"}" class="${["svelte-1vpuklg", segment === "charities" ? "selected" : ""].join(" ").trim()}">funds</a></li>
            <li class="${"svelte-1vpuklg"}"><a rel="${"prefetch"}" href="${"lists/organizations"}" class="${["svelte-1vpuklg", segment === "organizations" ? "selected" : ""].join(" ").trim()}">organizations</a></li>
        </ul>
    </nav>
</div>

<div class="${"list-wrap svelte-1vpuklg"}">
    <br>

    ${$$slots.default ? $$slots.default({}) : ``}

    <br>
    <br>
</div>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});

/* src/components/app/TitleSubTitle.svelte generated by Svelte v3.18.1 */

const css$p = {
	code: "section.svelte-gnegnw{text-align:center;padding:0 3vw}h2.svelte-gnegnw{font-weight:400}",
	map: "{\"version\":3,\"file\":\"TitleSubTitle.svelte\",\"sources\":[\"TitleSubTitle.svelte\"],\"sourcesContent\":[\"<script>\\n    export let title = 'The main title that explains the charity'\\n    export let subtitle = 'And bigger description that describes in short keywords a charity, title above and just makes text longer'\\n</script>\\n\\n<section>\\n    <h1>{title}</h1>\\n    <br>\\n    <h2>{subtitle}</h2>\\n</section>\\n\\n<style>\\n    section {\\n        text-align: center;\\n        padding: 0 3vw;\\n    }\\n\\n    h2 {\\n        font-weight: 400;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9UaXRsZVN1YlRpdGxlLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxrQkFBa0I7UUFDbEIsY0FBYztJQUNsQjs7SUFFQTtRQUNJLGdCQUFnQjtJQUNwQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvVGl0bGVTdWJUaXRsZS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBzZWN0aW9uIHtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBwYWRkaW5nOiAwIDN2dztcbiAgICB9XG5cbiAgICBoMiB7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA0MDA7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAYI,OAAO,cAAC,CAAC,AACL,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

const TitleSubTitle = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = "The main title that explains the charity" } = $$props;
	let { subtitle = "And bigger description that describes in short keywords a charity, title above and just makes text longer" } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$p);

	return `<section class="${"svelte-gnegnw"}">
    <h1>${escape(title)}</h1>
    <br>
    <h2 class="${"svelte-gnegnw"}">${escape(subtitle)}</h2>
</section>`;
});

/* src/components/app/ContentHolder.svelte generated by Svelte v3.18.1 */

const ContentHolder = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<h1 class="${"text-center"}">About</h1>
<br>
<br>
<pre>
    This is the &quot;about&quot; section which explains people the main sense of our purpose.
    There&#39;s not much here.
    But this section is not the least!
</pre>
<br>
<pre>
    We try to make our society more kind and we do kind things for it.
    Nevertheless, this is the &quot;about&quot; page.
    And there&#39;s not much here.
</pre>`;
});

/* src/components/app/DonationButton.svelte generated by Svelte v3.18.1 */

const css$q = {
	code: ".donate-btn.svelte-1on7pks{position:fixed;left:0;bottom:env(safe-area-inset-bottom);display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:100%;font-weight:600;font-size:1.85em;line-height:1.26;color:rgba(var(--color-white));padding:20px;z-index:9;-ms-touch-action:manipulation;touch-action:manipulation;text-align:center;-webkit-transition:.3s ease-in-out;transition:.3s ease-in-out;-webkit-transform:translateY(100%);transform:translateY(100%);background-color:rgba(var(--color-success))}.donate-btn.active.svelte-1on7pks{-webkit-transform:none;transform:none\n    }",
	map: "{\"version\":3,\"file\":\"DonationButton.svelte\",\"sources\":[\"DonationButton.svelte\"],\"sourcesContent\":[\"<script>\\n    import { onMount } from 'svelte'\\n    import { classnames } from '@utils'\\n    import Icon from '@components/Icon.svelte'\\n\\n    let activeDonateBtn = false\\n\\n    onMount(() => setTimeout(() => activeDonateBtn = true, 500))\\n\\n    $: classPropDonateBtn = classnames('donate-btn', { active: activeDonateBtn })\\n\\n    function onDonate() {\\n        alert('Дякую! 🥰')\\n    }\\n</script>\\n\\n<button type=\\\"button\\\" class={classPropDonateBtn} on:click={onDonate}>\\n    <Icon type=\\\"coin\\\" size=\\\"big\\\" is=\\\"light\\\"/>\\n    <s></s>\\n    <s></s>\\n    Допомогти\\n</button>\\n\\n<style>\\n    .donate-btn {\\n        position: fixed;\\n        left: 0;\\n        bottom: env(safe-area-inset-bottom);\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 100%;\\n        font-weight: 600;\\n        font-size: 1.85em;\\n        line-height: 1.26;\\n        color: rgba(var(--color-white));\\n        padding: 20px;\\n        z-index: 9;\\n        -ms-touch-action: manipulation;\\n            touch-action: manipulation;\\n        text-align: center;\\n        -webkit-transition: .3s ease-in-out;\\n        transition: .3s ease-in-out;\\n        -webkit-transform: translateY(100%);\\n                transform: translateY(100%);\\n        background-color: rgba(var(--color-success));\\n    }\\n\\n    .donate-btn.active {\\n        -webkit-transform: none;\\n                transform: none\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Eb25hdGlvbkJ1dHRvbi5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksZUFBZTtRQUNmLE9BQU87UUFDUCxtQ0FBbUM7UUFDbkMsb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLFdBQVc7UUFDWCxnQkFBZ0I7UUFDaEIsaUJBQWlCO1FBQ2pCLGlCQUFpQjtRQUNqQiwrQkFBK0I7UUFDL0IsYUFBYTtRQUNiLFVBQVU7UUFDViw4QkFBMEI7WUFBMUIsMEJBQTBCO1FBQzFCLGtCQUFrQjtRQUNsQixtQ0FBMkI7UUFBM0IsMkJBQTJCO1FBQzNCLG1DQUEyQjtnQkFBM0IsMkJBQTJCO1FBQzNCLDRDQUE0QztJQUNoRDs7SUFFQTtRQUNJLHVCQUFjO2dCQUFkO0lBQ0oiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL0RvbmF0aW9uQnV0dG9uLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5kb25hdGUtYnRuIHtcbiAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICBib3R0b206IGVudihzYWZlLWFyZWEtaW5zZXQtYm90dG9tKTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICBmb250LXNpemU6IDEuODVlbTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuMjY7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXdoaXRlKSk7XG4gICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgIHotaW5kZXg6IDk7XG4gICAgICAgIHRvdWNoLWFjdGlvbjogbWFuaXB1bGF0aW9uO1xuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIHRyYW5zaXRpb246IC4zcyBlYXNlLWluLW91dDtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDEwMCUpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG5cbiAgICAuZG9uYXRlLWJ0bi5hY3RpdmUge1xuICAgICAgICB0cmFuc2Zvcm06IG5vbmVcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAwBI,WAAW,eAAC,CAAC,AACT,QAAQ,CAAE,KAAK,CACf,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,sBAAsB,CAAC,CACnC,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAC/B,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,CAAC,CACV,gBAAgB,CAAE,YAAY,CAC1B,YAAY,CAAE,YAAY,CAC9B,UAAU,CAAE,MAAM,CAClB,kBAAkB,CAAE,GAAG,CAAC,WAAW,CACnC,UAAU,CAAE,GAAG,CAAC,WAAW,CAC3B,iBAAiB,CAAE,WAAW,IAAI,CAAC,CAC3B,SAAS,CAAE,WAAW,IAAI,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC,AAED,WAAW,OAAO,eAAC,CAAC,AAChB,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI;IAC3B,CAAC\"}"
};

const DonationButton = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let activeDonateBtn = false;
	onMount(() => setTimeout(() => activeDonateBtn = true, 500));
	$$result.css.add(css$q);
	let classPropDonateBtn = classnames("donate-btn", { active: activeDonateBtn });

	return `<button type="${"button"}" class="${escape(null_to_empty(classPropDonateBtn)) + " svelte-1on7pks"}">
    ${validate_component(Icon, "Icon").$$render($$result, { type: "coin", size: "big", is: "light" }, {}, {})}
    <s></s>
    <s></s>
    Допомогти
</button>`;
});

/* src/components/app/ListOfFeatures.svelte generated by Svelte v3.18.1 */

const css$r = {
	code: "ul.svelte-17ny656{list-style:disc outside none;padding:0 calc(var(--screen-padding) * 5)}li.svelte-17ny656{display:list-item}ul.svelte-17ny656,li.svelte-17ny656,h3.svelte-17ny656,p.svelte-17ny656{max-width:100%;vertical-align:middle}h3.svelte-17ny656,p.svelte-17ny656{overflow:hidden;display:inline-block;word-break:break-word;text-overflow:ellipsis}",
	map: "{\"version\":3,\"file\":\"ListOfFeatures.svelte\",\"sources\":[\"ListOfFeatures.svelte\"],\"sourcesContent\":[\"<script>\\n    const items = [\\n        {\\n            title: 'Comfort is the main feature',\\n            text: 'Just imaging, you do something simple and you can see the result of your short way.',\\n        },\\n        {\\n            title: 'Comfort is the main feature',\\n            text: 'Just imaging, you do something simple and you can see the result of your short way.',\\n        },\\n        {\\n            title: 'Comfort is the main feature',\\n            text: 'Just imaging, you do something simple and you can see the result of your short way.',\\n        },\\n        {\\n            title: 'Comfort is the main feature',\\n            text: 'Just imaging, you do something simple and you can see the result of your short way.',\\n        },\\n    ]\\n</script>\\n\\n<ul>\\n    {#each items as item}\\n        <li>\\n            <h3>{item.title}</h3>\\n            <p>{item.text}</p>\\n            <br>\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    ul {\\n        list-style: disc outside none;\\n        padding: 0 calc(var(--screen-padding) * 5);\\n        /*list-style-image: url(\\\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='-1 -1 2 2'><circle r='1' /></svg>\\\");*/\\n    }\\n\\n    li {\\n        display: list-item;\\n    }\\n\\n    ul, li, h3, p {\\n        max-width: 100%;\\n        vertical-align: middle;\\n    }\\n\\n    h3, p {\\n        overflow: hidden;\\n        display: inline-block;\\n        word-break: break-word;\\n        text-overflow: ellipsis;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9MaXN0T2ZGZWF0dXJlcy5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksNkJBQTZCO1FBQzdCLDBDQUEwQztRQUMxQyw4SkFBOEo7SUFDbEs7O0lBRUE7UUFDSSxrQkFBa0I7SUFDdEI7O0lBRUE7UUFDSSxlQUFlO1FBQ2Ysc0JBQXNCO0lBQzFCOztJQUVBO1FBQ0ksZ0JBQWdCO1FBQ2hCLHFCQUFxQjtRQUNyQixzQkFBc0I7UUFDdEIsdUJBQXVCO0lBQzNCIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2FwcC9MaXN0T2ZGZWF0dXJlcy5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICB1bCB7XG4gICAgICAgIGxpc3Qtc3R5bGU6IGRpc2Mgb3V0c2lkZSBub25lO1xuICAgICAgICBwYWRkaW5nOiAwIGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogNSk7XG4gICAgICAgIC8qbGlzdC1zdHlsZS1pbWFnZTogdXJsKFwiZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsPHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCcgdmlld0JveD0nLTEgLTEgMiAyJz48Y2lyY2xlIHI9JzEnIC8+PC9zdmc+XCIpOyovXG4gICAgfVxuXG4gICAgbGkge1xuICAgICAgICBkaXNwbGF5OiBsaXN0LWl0ZW07XG4gICAgfVxuXG4gICAgdWwsIGxpLCBoMywgcCB7XG4gICAgICAgIG1heC13aWR0aDogMTAwJTtcbiAgICAgICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcbiAgICB9XG5cbiAgICBoMywgcCB7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgICAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAgCI,EAAE,eAAC,CAAC,AACA,UAAU,CAAE,IAAI,CAAC,OAAO,CAAC,IAAI,CAC7B,OAAO,CAAE,CAAC,CAAC,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAE9C,CAAC,AAED,EAAE,eAAC,CAAC,AACA,OAAO,CAAE,SAAS,AACtB,CAAC,AAED,iBAAE,CAAE,iBAAE,CAAE,iBAAE,CAAE,CAAC,eAAC,CAAC,AACX,SAAS,CAAE,IAAI,CACf,cAAc,CAAE,MAAM,AAC1B,CAAC,AAED,iBAAE,CAAE,CAAC,eAAC,CAAC,AACH,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,YAAY,CACrB,UAAU,CAAE,UAAU,CACtB,aAAa,CAAE,QAAQ,AAC3B,CAAC\"}"
};

const ListOfFeatures = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const items = [
		{
			title: "Comfort is the main feature",
			text: "Just imaging, you do something simple and you can see the result of your short way."
		},
		{
			title: "Comfort is the main feature",
			text: "Just imaging, you do something simple and you can see the result of your short way."
		},
		{
			title: "Comfort is the main feature",
			text: "Just imaging, you do something simple and you can see the result of your short way."
		},
		{
			title: "Comfort is the main feature",
			text: "Just imaging, you do something simple and you can see the result of your short way."
		}
	];

	$$result.css.add(css$r);

	return `<ul class="${"svelte-17ny656"}">
    ${each(items, item => `<li class="${"svelte-17ny656"}">
            <h3 class="${"svelte-17ny656"}">${escape(item.title)}</h3>
            <p class="${"svelte-17ny656"}">${escape(item.text)}</p>
            <br>
        </li>`)}
</ul>`;
});

/* src/components/app/OfflineMessage.svelte generated by Svelte v3.18.1 */

const css$s = {
	code: "#offline-message{position:fixed;z-index:11;bottom:calc(env(safe-area-inset-bottom) + 100px);left:50%;padding:10px 20px;background-color:rgba(var(--theme-bg-color));border-radius:var(--border-radius-small);overflow:hidden;-webkit-transition:.2s ease-out;transition:.2s ease-out;opacity:0;pointer-events:none;-webkit-transform:translate3d(-50%, 20px, 0);transform:translate3d(-50%, 20px, 0)}#offline-message.active{opacity:1;pointer-events:auto;-webkit-transform:translate3d(-50%, 0, 0);transform:translate3d(-50%, 0, 0)}",
	map: "{\"version\":3,\"file\":\"OfflineMessage.svelte\",\"sources\":[\"OfflineMessage.svelte\"],\"sourcesContent\":[\"<script>\\n</script>\\n\\n<section id=\\\"offline-message\\\">\\n    Сторінка оффлайн\\n</section>\\n\\n<style>\\n    :global(#offline-message) {\\n        position: fixed;\\n        z-index: 11;\\n        bottom: calc(env(safe-area-inset-bottom) + 100px);\\n        left: 50%;\\n        padding: 10px 20px;\\n        background-color: rgba(var(--theme-bg-color));\\n        border-radius: var(--border-radius-small);\\n        overflow: hidden;\\n        -webkit-transition: .2s ease-out;\\n        transition: .2s ease-out;\\n        opacity: 0;\\n        pointer-events: none;\\n        -webkit-transform: translate3d(-50%, 20px, 0);\\n                transform: translate3d(-50%, 20px, 0);\\n    }\\n    :global(#offline-message.active) {\\n        opacity: 1;\\n        pointer-events: auto;\\n        -webkit-transform: translate3d(-50%, 0, 0);\\n                transform: translate3d(-50%, 0, 0);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9PZmZsaW5lTWVzc2FnZS5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksZUFBZTtRQUNmLFdBQVc7UUFDWCxpREFBaUQ7UUFDakQsU0FBUztRQUNULGtCQUFrQjtRQUNsQiw2Q0FBNkM7UUFDN0MseUNBQXlDO1FBQ3pDLGdCQUFnQjtRQUNoQixnQ0FBd0I7UUFBeEIsd0JBQXdCO1FBQ3hCLFVBQVU7UUFDVixvQkFBb0I7UUFDcEIsNkNBQXFDO2dCQUFyQyxxQ0FBcUM7SUFDekM7SUFDQTtRQUNJLFVBQVU7UUFDVixvQkFBb0I7UUFDcEIsMENBQWtDO2dCQUFsQyxrQ0FBa0M7SUFDdEMiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL09mZmxpbmVNZXNzYWdlLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIDpnbG9iYWwoI29mZmxpbmUtbWVzc2FnZSkge1xuICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgIHotaW5kZXg6IDExO1xuICAgICAgICBib3R0b206IGNhbGMoZW52KHNhZmUtYXJlYS1pbnNldC1ib3R0b20pICsgMTAwcHgpO1xuICAgICAgICBsZWZ0OiA1MCU7XG4gICAgICAgIHBhZGRpbmc6IDEwcHggMjBweDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvcikpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzLXNtYWxsKTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgdHJhbnNpdGlvbjogLjJzIGVhc2Utb3V0O1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtNTAlLCAyMHB4LCAwKTtcbiAgICB9XG4gICAgOmdsb2JhbCgjb2ZmbGluZS1tZXNzYWdlLmFjdGl2ZSkge1xuICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgICBwb2ludGVyLWV2ZW50czogYXV0bztcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtNTAlLCAwLCAwKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAQY,gBAAgB,AAAE,CAAC,AACvB,QAAQ,CAAE,KAAK,CACf,OAAO,CAAE,EAAE,CACX,MAAM,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CACjD,IAAI,CAAE,GAAG,CACT,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAC7C,aAAa,CAAE,IAAI,qBAAqB,CAAC,CACzC,QAAQ,CAAE,MAAM,CAChB,kBAAkB,CAAE,GAAG,CAAC,QAAQ,CAChC,UAAU,CAAE,GAAG,CAAC,QAAQ,CACxB,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,CACpB,iBAAiB,CAAE,YAAY,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,CACrC,SAAS,CAAE,YAAY,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,AACjD,CAAC,AACO,uBAAuB,AAAE,CAAC,AAC9B,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,CACpB,iBAAiB,CAAE,YAAY,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAClC,SAAS,CAAE,YAAY,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC9C,CAAC\"}"
};

const OfflineMessage = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$s);

	return `<section id="${"offline-message"}">
    Сторінка оффлайн
</section>`;
});

const contextMapbox = {};

/* src/components/map/Map.svelte generated by Svelte v3.18.1 */

const css$t = {
	code: "section.svelte-yig78c{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;-ms-flex-item-align:stretch;align-self:stretch}",
	map: "{\"version\":3,\"file\":\"Map.svelte\",\"sources\":[\"Map.svelte\"],\"sourcesContent\":[\"<style>\\n    section {\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL21hcC9NYXAuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG1CQUFZO1lBQVosb0JBQVk7Z0JBQVosWUFBWTtRQUNaLDRCQUFtQjtZQUFuQixtQkFBbUI7SUFDdkIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvbWFwL01hcC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBzZWN0aW9uIHtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgIH1cbiJdfQ== */</style>\\n\\n<script>\\n    import { onMount, onDestroy, setContext, createEventDispatcher } from 'svelte'\\n    import { contextMapbox } from './context'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let center = [31.1656, 48.3794]\\n    export let zoom = 3.75\\n\\n    let map\\n    let container\\n\\n    setContext(contextMapbox, {\\n        getMap: () => map,\\n        getMapbox: () => window.mapboxgl\\n    })\\n\\n    function onCreateMap() {\\n        map = new mapboxgl.Map({\\n            zoom,\\n            center,\\n            container,\\n            style: 'mapbox://styles/mapbox/streets-v11',\\n        })\\n\\n        map.on('dragend', () => dispatch('recentre', { map, center: map.getCenter() }))\\n        map.on('load', () => dispatch('ready', map))\\n    }\\n\\n    function createMap() {\\n        const scriptTag = document.createElement('script')\\n        scriptTag.type = 'text/javascript'\\n        scriptTag.src = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.js'\\n\\n        const link = document.createElement('link')\\n        link.rel = 'stylesheet'\\n        link.href = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.css'\\n\\n        scriptTag.onload = () => {\\n            const token = 'pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw'\\n            mapboxgl.accessToken = token\\n\\n            link.onload = onCreateMap\\n\\n            document.head.appendChild(link)\\n        }\\n\\n        document.body.appendChild(scriptTag)\\n    }\\n\\n    onMount(() => {\\n        if ('mapboxgl' in window) {\\n            onCreateMap()\\n        } else {\\n            createMap()\\n        }\\n    })\\n\\n    onDestroy(() => {\\n        map && map.remove()\\n    })\\n</script>\\n\\n<section bind:this={container}>\\n    {#if map}\\n        <slot></slot>\\n    {/if}\\n</section>\\n\"],\"names\":[],\"mappings\":\"AACI,OAAO,cAAC,CAAC,AACL,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,AAC3B,CAAC\"}"
};

const Map$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { center = [31.1656, 48.3794] } = $$props;
	let { zoom = 3.75 } = $$props;
	let map;
	let container;

	setContext(contextMapbox, {
		getMap: () => map,
		getMapbox: () => window.mapboxgl
	});

	function onCreateMap() {
		map = new mapboxgl.Map({
				zoom,
				center,
				container,
				style: "mapbox://styles/mapbox/streets-v11"
			});

		map.on("dragend", () => dispatch("recentre", { map, center: map.getCenter() }));
		map.on("load", () => dispatch("ready", map));
	}

	function createMap() {
		const scriptTag = document.createElement("script");
		scriptTag.type = "text/javascript";
		scriptTag.src = "https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.js";
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.css";

		scriptTag.onload = () => {
			const token = "pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw";
			mapboxgl.accessToken = token;
			link.onload = onCreateMap;
			document.head.appendChild(link);
		};

		document.body.appendChild(scriptTag);
	}

	onMount(() => {
		if ("mapboxgl" in window) {
			onCreateMap();
		} else {
			createMap();
		}
	});

	onDestroy(() => {
		map && map.remove();
	});

	if ($$props.center === void 0 && $$bindings.center && center !== void 0) $$bindings.center(center);
	if ($$props.zoom === void 0 && $$bindings.zoom && zoom !== void 0) $$bindings.zoom(zoom);
	$$result.css.add(css$t);

	return `<section class="${"svelte-yig78c"}"${add_attribute("this", container, 1)}>
    ${map
	? `${$$slots.default ? $$slots.default({}) : ``}`
	: ``}
</section>`;
});

/* src/components/map/MapMarker.svelte generated by Svelte v3.18.1 */

const MapMarker = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	const { getMap, getMapbox } = getContext(contextMapbox);
	const map = getMap();
	const mapbox = getMapbox();
	let { lng } = $$props;
	let { lat } = $$props;

	// export let label = 'label'
	// const popup = new mapbox.Popup({ offset: 25 }).setText(label)
	const markerEl = document.createElement("div");

	markerEl.style.fontSize = "50px";
	markerEl.style.cursor = "pointer";
	markerEl.innerHTML = "📍";

	const marker = new mapbox.Marker(markerEl, { offset: [0, -25] }).setLngLat([lng, lat]).// .setPopup(popup)
	addTo(map);

	markerEl.addEventListener("click", dispatch.bind(null, "click"));
	if ($$props.lng === void 0 && $$bindings.lng && lng !== void 0) $$bindings.lng(lng);
	if ($$props.lat === void 0 && $$bindings.lat && lat !== void 0) $$bindings.lat(lat);
	return ``;
});

/* src/components/loader/Text.svelte generated by Svelte v3.18.1 */

const Text$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<rect x="${"0"}" y="${"10%"}" rx="${"3"}" ry="${"3"}" width="${"100%"}" height="${"80%"}"></rect>`;
});

/* src/components/loader/Circle.svelte generated by Svelte v3.18.1 */

const Circle$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<circle cx="${"50%"}" cy="${"50%"}" r="${"50%"}"></circle>`;
});

/* src/components/loader/Loader.svelte generated by Svelte v3.18.1 */

const css$u = {
	code: ".loader.svelte-175toc4.svelte-175toc4{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;-ms-flex-item-align:stretch;align-self:stretch;-webkit-transform:translateZ(0);transform:translateZ(0)}.loader.svelte-175toc4 svg.svelte-175toc4{-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;-ms-flex-item-align:stretch;align-self:stretch;-webkit-transform:translateZ(0);transform:translateZ(0)}.loader.absolute.svelte-175toc4.svelte-175toc4{position:absolute;top:0;left:0;right:0;bottom:0}.loader.border.svelte-175toc4.svelte-175toc4{outline-width:1px;outline-style:solid}",
	map: "{\"version\":3,\"file\":\"Loader.svelte\",\"sources\":[\"Loader.svelte\"],\"sourcesContent\":[\"<script>\\n    // How to make a custom loader?\\n    // See here for generating: https://danilowoz.com/create-content-loader/\\n    \\n    import { onMount } from 'svelte'\\n    import { classnames, uuid } from '@utils'\\n    import Text from './Text.svelte'\\n    import Circle from './Circle.svelte'\\n\\n    export let width = '100%' \\n    export let height = '100%'\\n    export let light = '#999999';\\n    export let dark = '#555555';\\n    export let opacity = .2;\\n    export let border = false;\\n    export let absolute = false;\\n    export let type = undefined; // h1, h2, h3, h4, h5, h6, p, pre, avatar\\n\\n    const uid = uuid()\\n\\n    let hTypes = {\\n        p: 21,\\n        h1: 35,\\n        h2: 29,\\n        h3: 26,\\n        h4: 21,\\n        h5: 21,\\n        h6: 21,\\n        pre: 21,\\n    }\\n\\n    onMount(() => {\\n        const style = getComputedStyle(document.body);\\n        const lh = Number.parseInt(style.getPropertyValue('line-height'))\\n        const balance = 0\\n\\n        hTypes = {\\n            p: lh * 1.15 + balance,\\n            h1: lh * 1.85 + balance,\\n            h2: lh * 1.4 + balance,\\n            h3: lh * 1.3 + balance,\\n            h4: lh * 1.15 + balance,\\n            h5: lh * 1.15 + balance,\\n            h6: lh * 1.15 + balance,\\n            pre: lh * 1.15 + balance,\\n        }\\n    })\\n\\n    $: areaWidth = width.replace('%', '')\\n    $: areaHeight = hTypes[type] || height\\n    $: classProp = classnames('loader', { border, absolute })\\n</script>\\n\\n<section \\n    class={classProp}\\n    style={`opacity: ${opacity}; outline-color: ${light};`}\\n>\\n    <svg\\n        role=\\\"img\\\"\\n        width=\\\"100%\\\"\\n        height={areaHeight}\\n        aria-labelledby=\\\"loading-aria\\\"\\n        viewBox={`0 0 ${areaWidth} 100`}\\n        preserveAspectRatio=\\\"none\\\"\\n    >\\n        <title id=\\\"loading-aria\\\">Loading...</title>\\n        <rect\\n            x=\\\"0\\\"\\n            y=\\\"0\\\"\\n            width=\\\"100%\\\"\\n            height=\\\"100%\\\"\\n            clip-path={`url(#clip-path-${uid})`}\\n            style='fill: url(\\\"#loader-fill\\\");'\\n        ></rect>\\n        <defs>\\n            <clipPath id={`clip-path-${uid}`}>\\n                <slot>\\n                    {#if 'avatar'.includes(type)}\\n                        <Circle/>\\n                    {:else if 'h1,h2,h3,h4,h5,h6,p,pre'.includes(type)}\\n                        <Text/>\\n                    {:else}\\n                        <rect x=\\\"0\\\" y=\\\"0\\\" rx=\\\"3\\\" ry=\\\"3\\\" width=\\\"100%\\\" height=\\\"100%\\\" />\\n                    {/if}\\n                </slot>\\n            </clipPath>\\n            <linearGradient id=\\\"loader-fill\\\">\\n                <stop\\n                    offset=\\\"0.599964\\\"\\n                    stop-color={light}\\n                    stop-opacity=\\\"1\\\"\\n                >\\n                    <animate\\n                    attributeName=\\\"offset\\\"\\n                    values=\\\"-2; -2; 1\\\"\\n                    keyTimes=\\\"0; 0.25; 1\\\"\\n                    dur=\\\"2s\\\"\\n                    repeatCount=\\\"indefinite\\\"\\n                    ></animate>\\n                </stop>\\n                <stop\\n                    offset=\\\"1.59996\\\"\\n                    stop-color={dark}\\n                    stop-opacity=\\\"1\\\"\\n                >\\n                    <animate\\n                    attributeName=\\\"offset\\\"\\n                    values=\\\"-1; -1; 2\\\"\\n                    keyTimes=\\\"0; 0.25; 1\\\"\\n                    dur=\\\"2s\\\"\\n                    repeatCount=\\\"indefinite\\\"\\n                    ></animate>\\n                </stop>\\n                <stop\\n                    offset=\\\"2.59996\\\"\\n                    stop-color={light}\\n                    stop-opacity=\\\"1\\\"\\n                >\\n                    <animate\\n                    attributeName=\\\"offset\\\"\\n                    values=\\\"0; 0; 3\\\"\\n                    keyTimes=\\\"0; 0.25; 1\\\"\\n                    dur=\\\"2s\\\"\\n                    repeatCount=\\\"indefinite\\\"\\n                    ></animate>\\n                </stop>\\n            </linearGradient>\\n        </defs>\\n    </svg>\\n</section>\\n\\n<style>\\n    .loader {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n    }\\n\\n    .loader svg {\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n    }\\n\\n    .loader.absolute {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        right: 0;\\n        bottom: 0;\\n    }\\n\\n    .loader.border {\\n        outline-width: 1px;\\n        outline-style: solid;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2xvYWRlci9Mb2FkZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IsbUJBQWM7WUFBZCxrQkFBYztnQkFBZCxjQUFjO1FBQ2QsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQixnQ0FBd0I7Z0JBQXhCLHdCQUF3QjtJQUM1Qjs7SUFFQTtRQUNJLG1CQUFjO1lBQWQsa0JBQWM7Z0JBQWQsY0FBYztRQUNkLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsZ0NBQXdCO2dCQUF4Qix3QkFBd0I7SUFDNUI7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsTUFBTTtRQUNOLE9BQU87UUFDUCxRQUFRO1FBQ1IsU0FBUztJQUNiOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLG9CQUFvQjtJQUN4QiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9sb2FkZXIvTG9hZGVyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5sb2FkZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVaKDApO1xuICAgIH1cblxuICAgIC5sb2FkZXIgc3ZnIHtcbiAgICAgICAgZmxleDogMSAxIGF1dG87XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTtcbiAgICB9XG5cbiAgICAubG9hZGVyLmFic29sdXRlIHtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIHJpZ2h0OiAwO1xuICAgICAgICBib3R0b206IDA7XG4gICAgfVxuXG4gICAgLmxvYWRlci5ib3JkZXIge1xuICAgICAgICBvdXRsaW5lLXdpZHRoOiAxcHg7XG4gICAgICAgIG91dGxpbmUtc3R5bGU6IHNvbGlkO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAoII,OAAO,8BAAC,CAAC,AACL,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,AACpC,CAAC,AAED,sBAAO,CAAC,GAAG,eAAC,CAAC,AACT,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,AACpC,CAAC,AAED,OAAO,SAAS,8BAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,AACb,CAAC,AAED,OAAO,OAAO,8BAAC,CAAC,AACZ,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,KAAK,AACxB,CAAC\"}"
};

const Loader$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { width = "100%" } = $$props;
	let { height = "100%" } = $$props;
	let { light = "#999999" } = $$props;
	let { dark = "#555555" } = $$props;
	let { opacity = 0.2 } = $$props;
	let { border = false } = $$props;
	let { absolute = false } = $$props;
	let { type = undefined } = $$props; // h1, h2, h3, h4, h5, h6, p, pre, avatar
	const uid = uuidv4();

	let hTypes = {
		p: 21,
		h1: 35,
		h2: 29,
		h3: 26,
		h4: 21,
		h5: 21,
		h6: 21,
		pre: 21
	};

	onMount(() => {
		const style = getComputedStyle(document.body);
		const lh = Number.parseInt(style.getPropertyValue("line-height"));
		const balance = 0;

		hTypes = {
			p: lh * 1.15 + balance,
			h1: lh * 1.85 + balance,
			h2: lh * 1.4 + balance,
			h3: lh * 1.3 + balance,
			h4: lh * 1.15 + balance,
			h5: lh * 1.15 + balance,
			h6: lh * 1.15 + balance,
			pre: lh * 1.15 + balance
		};
	});

	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
	if ($$props.light === void 0 && $$bindings.light && light !== void 0) $$bindings.light(light);
	if ($$props.dark === void 0 && $$bindings.dark && dark !== void 0) $$bindings.dark(dark);
	if ($$props.opacity === void 0 && $$bindings.opacity && opacity !== void 0) $$bindings.opacity(opacity);
	if ($$props.border === void 0 && $$bindings.border && border !== void 0) $$bindings.border(border);
	if ($$props.absolute === void 0 && $$bindings.absolute && absolute !== void 0) $$bindings.absolute(absolute);
	if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
	$$result.css.add(css$u);
	let areaWidth = width.replace("%", "");
	let areaHeight = hTypes[type] || height;
	let classProp = classnames("loader", { border, absolute });

	return `<section class="${escape(null_to_empty(classProp)) + " svelte-175toc4"}"${add_attribute("style", `opacity: ${opacity}; outline-color: ${light};`, 0)}>
    <svg role="${"img"}" width="${"100%"}"${add_attribute("height", areaHeight, 0)} aria-labelledby="${"loading-aria"}"${add_attribute("viewBox", `0 0 ${areaWidth} 100`, 0)} preserveAspectRatio="${"none"}" class="${"svelte-175toc4"}">
        <title id="${"loading-aria"}">Loading...</title>
        <rect x="${"0"}" y="${"0"}" width="${"100%"}" height="${"100%"}"${add_attribute("clip-path", `url(#clip-path-${uid})`, 0)} style="${"fill: url(&quot;#loader-fill&quot;);"}"></rect>
        <defs>
            <clipPath${add_attribute("id", `clip-path-${uid}`, 0)}>
                ${$$slots.default
	? $$slots.default({})
	: `
                    ${("avatar").includes(type)
		? `${validate_component(Circle$1, "Circle").$$render($$result, {}, {}, {})}`
		: `${("h1,h2,h3,h4,h5,h6,p,pre").includes(type)
			? `${validate_component(Text$1, "Text").$$render($$result, {}, {}, {})}`
			: `<rect x="${"0"}" y="${"0"}" rx="${"3"}" ry="${"3"}" width="${"100%"}" height="${"100%"}"></rect>`}`}
                `}
            </clipPath>
            <linearGradient id="${"loader-fill"}">
                <stop offset="${"0.599964"}"${add_attribute("stop-color", light, 0)} stop-opacity="${"1"}">
                    <animate attributeName="${"offset"}" values="${"-2; -2; 1"}" keyTimes="${"0; 0.25; 1"}" dur="${"2s"}" repeatCount="${"indefinite"}"></animate>
                </stop>
                <stop offset="${"1.59996"}"${add_attribute("stop-color", dark, 0)} stop-opacity="${"1"}">
                    <animate attributeName="${"offset"}" values="${"-1; -1; 2"}" keyTimes="${"0; 0.25; 1"}" dur="${"2s"}" repeatCount="${"indefinite"}"></animate>
                </stop>
                <stop offset="${"2.59996"}"${add_attribute("stop-color", light, 0)} stop-opacity="${"1"}">
                    <animate attributeName="${"offset"}" values="${"0; 0; 3"}" keyTimes="${"0; 0.25; 1"}" dur="${"2s"}" repeatCount="${"indefinite"}"></animate>
                </stop>
            </linearGradient>
        </defs>
    </svg>
</section>`;
});

/* src/components/comments/Comment.svelte generated by Svelte v3.18.1 */

const Comment = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = null } = $$props;
	let { date = null } = $$props;
	let { title = null } = $$props;
	let { amount = null } = $$props;
	let { checked = null } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.date === void 0 && $$bindings.date && date !== void 0) $$bindings.date(date);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.amount === void 0 && $$bindings.amount && amount !== void 0) $$bindings.amount(amount);
	if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0) $$bindings.checked(checked);
	let classProp = classnames($$props.class);

	return `${validate_component(Card, "Card").$$render($$result, { class: classProp }, {}, {
		default: () => `
    <section class="${"comment flex flex-align-start"}" style="${"padding: 20px"}">

        <div class="${"flex relative"}">
            ${validate_component(FancyBox, "FancyBox").$$render($$result, {}, {}, {
			box: () => `<section slot="${"box"}" class="${"flex full-width full-height"}" style="${"height: 100vw"}">
                    <div class="${"flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch"}" style="${"padding: var(--screen-padding) 0"}">
                        ${validate_component(Avatar, "Avatar").$$render($$result, { src, alt: title }, {}, {})}
                    </div>
                </section>`,
			default: () => `
                ${validate_component(Avatar, "Avatar").$$render($$result, { src, alt: title, size: "medium" }, {}, {})}
                
            `
		})}

            ${checked
		? `<div class="${"absolute flex"}" style="${"top: -1px; right: -1px; width: 20px; height: 20px; overflow: hidden"}">
                ${validate_component(Icon, "Icon").$$render($$result, { type: "polygon", is: "info" }, {}, {})}
                <div class="${"absolute-center flex"}" style="${"width: 10px; height: 10px;"}">
                    ${validate_component(Icon, "Icon").$$render($$result, { type: "check-flag", is: "light" }, {}, {})}
                </div>
            </div>`
		: ``}
        </div>

        <s></s>
        <s></s>
        <s></s>
        <s></s>

        <div class="${"flex flex-column flex-1"}" style="${"overflow: hidden"}">

            ${title !== null
		? `<h3 class="${"text-ellipsis font-w-500"}">${escape(title)}</h3>`
		: `<div style="${"width: 60%"}">${validate_component(Loader$1, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>`}

            ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}

            <pre class="${"h4 font-w-300"}" style="${"line-height: 1.46;"}">
                ${$$slots.default
		? $$slots.default({})
		: `
                     [No comment]
                `}
            </pre>

            ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

            <div class="${"flex flex-align-center flex-justify-between"}">
                <p class="${"flex flex-align-center flex-justify-between"}">
                    ${date !== null
		? `<span class="${"h4"}" style="${"opacity: .3"}">${escape(date)}</span>
                        <s></s>
                        <s></s>
                        <s></s>
                        <s></s>
                        <span class="${"h4"}" style="${"opacity: .7"}">Відповісти</span>
                        <s></s>
                        <s></s>`
		: `<div style="${"width: 80%"}">${validate_component(Loader$1, "Loader").$$render($$result, { type: "h4" }, {}, {})}</div>`}
                </p>
                <span class="${"h5 flex flex-align-center font-secondary"}" style="${"min-width: 4em"}">
                    <span${add_attribute("style", `opacity: ${amount > 2 ? 1 : 0.5}`, 0)}>
                        ${validate_component(Icon, "Icon").$$render(
			$$result,
			{
				type: "heart-filled",
				is: "danger",
				size: "small"
			},
			{},
			{}
		)}
                    </span>
                    <s></s>
                    <s></s>
                    ${amount !== null
		? `<h4>${escape(amount)}</h4>`
		: `<span class="${"h4 relative flex-self-start"}">
                            <span style="${"visibility: hidden"}">199</span>
                            ${validate_component(Loader$1, "Loader").$$render($$result, { type: "h4", absolute: true }, {}, {})}
                        </span>`}
                </span>
            </div>
        </div>

    </section>
`
	})}`;
});

/* src/components/comments/Comments.svelte generated by Svelte v3.18.1 */

const css$v = {
	code: ".comments.svelte-88w9s0.svelte-88w9s0{width:100%;-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;display:-webkit-box;display:-ms-flexbox;display:flex;overflow-y:auto;overflow-x:hidden;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;padding:15px}.comments-form.svelte-88w9s0.svelte-88w9s0{position:relative;-webkit-box-flex:0;-ms-flex:none;flex:none}.comments-wrap.svelte-88w9s0.svelte-88w9s0{width:100%;margin:-5px 0}.comments-wrap.svelte-88w9s0 li.svelte-88w9s0{width:100%;padding:5px 0}",
	map: "{\"version\":3,\"file\":\"Comments.svelte\",\"sources\":[\"Comments.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n\\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import Form from '@components/Form.svelte'\\n    import Input from '@components/fields/Input.svelte'\\n    import Button from '@components/Button.svelte'\\n    import Loader from '@components/loader'\\n    import Comment from './Comment.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    /**\\n     * \\n     * @event: submit - submit values of a new comment \\n     * \\n     */\\n    \\n    /**\\n     * @type {boolean}\\n     */\\n    export let withForm = true\\n\\n    /**\\n     * @type {{\\n     *      likes: number,\\n     *      avatar: string,\\n     *      author: string,\\n     *      comment: string,\\n     *      checked: boolean,\\n     *      created_at: string,\\n     * }}\\n     */\\n    export let items = new Array(4).fill({ comment: null })\\n</script>\\n\\n<section class=\\\"comments\\\">\\n    <ul class=\\\"comments-wrap\\\">\\n        {#each items as comment}\\n            <li>\\n                <Comment\\n                        src={comment.avatar}\\n                        title={comment.author}\\n                        date={comment.created_at && new Date(comment.created_at).toLocaleDateString()}\\n                        amount={comment.likes}\\n                        checked={comment.checked}\\n                >\\n                    {#if comment.comment !== null}\\n                        {comment.comment}\\n                    {:else}\\n                        <Loader type=\\\"h4\\\"/>\\n                        <Loader type=\\\"h4\\\"/>\\n                    {/if}\\n                </Comment>\\n            </li>\\n        {/each}\\n    </ul>\\n\\n    <Br size=\\\"20\\\"/>  \\n\\n    <p class=\\\"h3 font-w-500 font-secondary underline text-center\\\">\\n        <span>All comments</span>\\n        <span class=\\\"font-w-600\\\">⋁</span>\\n    </p>\\n\\n    {#if withForm}\\n        <Br size=\\\"40\\\"/>  \\n        <div class=\\\"comments-form font-secondary h3\\\">\\n            <Form class=\\\"flex\\\" name=\\\"comment-form\\\" on:submit={values => dispatch('sumbit', values)}>\\n                <Input\\n                        type=\\\"textarea\\\"\\n                        name=\\\"comment\\\"\\n                        rows=\\\"1\\\"\\n                        class=\\\"comment-field flex-self-stretch\\\"\\n                        placeholder=\\\"Залиште свій коментар\\\"\\n                />\\n            </Form>\\n            <div class=\\\"flex absolute\\\" style=\\\"top: 0; right: 0; height: 100%; width: 50px\\\">\\n                <Button type=\\\"submit\\\" class=\\\"flex full-width flex-self-stretch flex-justify-start\\\">\\n                    <Icon type=\\\"send\\\" is=\\\"info\\\" size=\\\"medium\\\"/>\\n                </Button>\\n            </div>\\n        </div>\\n    {/if}\\n</section>\\n\\n<style>\\n    .comments {\\n        width: 100%;\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow-y: auto;\\n        overflow-x: hidden;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        padding: 15px;\\n    }\\n\\n    .comments-form {\\n        position: relative;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n    }\\n\\n    .comments-wrap {\\n        width: 100%;\\n        margin: -5px 0;\\n    }\\n\\n    .comments-wrap li {\\n        width: 100%;\\n        padding: 5px 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2NvbW1lbnRzL0NvbW1lbnRzLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxXQUFXO1FBQ1gsbUJBQVk7WUFBWixvQkFBWTtnQkFBWixZQUFZO1FBQ1osb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBQ2xCLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsNEJBQXNCO1FBQXRCLDZCQUFzQjtZQUF0QiwwQkFBc0I7Z0JBQXRCLHNCQUFzQjtRQUN0QixhQUFhO0lBQ2pCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO0lBQ2Q7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsY0FBYztJQUNsQjs7SUFFQTtRQUNJLFdBQVc7UUFDWCxjQUFjO0lBQ2xCIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2NvbW1lbnRzL0NvbW1lbnRzLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5jb21tZW50cyB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgcGFkZGluZzogMTVweDtcbiAgICB9XG5cbiAgICAuY29tbWVudHMtZm9ybSB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICB9XG5cbiAgICAuY29tbWVudHMtd3JhcCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBtYXJnaW46IC01cHggMDtcbiAgICB9XG5cbiAgICAuY29tbWVudHMtd3JhcCBsaSB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBwYWRkaW5nOiA1cHggMDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAwFI,SAAS,4BAAC,CAAC,AACP,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,MAAM,CAClB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,OAAO,CAAE,IAAI,AACjB,CAAC,AAED,cAAc,4BAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,AACtB,CAAC,AAED,cAAc,4BAAC,CAAC,AACZ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CAAC,CAAC,AAClB,CAAC,AAED,4BAAc,CAAC,EAAE,cAAC,CAAC,AACf,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,CAAC,AAClB,CAAC\"}"
};

const Comments = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { withForm = true } = $$props;
	let { items = new Array(4).fill({ comment: null }) } = $$props;
	if ($$props.withForm === void 0 && $$bindings.withForm && withForm !== void 0) $$bindings.withForm(withForm);
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$v);

	return `<section class="${"comments svelte-88w9s0"}">
    <ul class="${"comments-wrap svelte-88w9s0"}">
        ${each(items, comment => `<li class="${"svelte-88w9s0"}">
                ${validate_component(Comment, "Comment").$$render(
		$$result,
		{
			src: comment.avatar,
			title: comment.author,
			date: comment.created_at && new Date(comment.created_at).toLocaleDateString(),
			amount: comment.likes,
			checked: comment.checked
		},
		{},
		{
			default: () => `
                    ${comment.comment !== null
			? `${escape(comment.comment)}`
			: `${validate_component(Loader$1, "Loader").$$render($$result, { type: "h4" }, {}, {})}
                        ${validate_component(Loader$1, "Loader").$$render($$result, { type: "h4" }, {}, {})}`}
                `
		}
	)}
            </li>`)}
    </ul>

    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}  

    <p class="${"h3 font-w-500 font-secondary underline text-center"}">
        <span>All comments</span>
        <span class="${"font-w-600"}">⋁</span>
    </p>

    ${withForm
	? `${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}  
        <div class="${"comments-form font-secondary h3 svelte-88w9s0"}">
            ${validate_component(Form, "Form").$$render($$result, { class: "flex", name: "comment-form" }, {}, {
			default: () => `
                ${validate_component(Input, "Input").$$render(
				$$result,
				{
					type: "textarea",
					name: "comment",
					rows: "1",
					class: "comment-field flex-self-stretch",
					placeholder: "Залиште свій коментар"
				},
				{},
				{}
			)}
            `
		})}
            <div class="${"flex absolute"}" style="${"top: 0; right: 0; height: 100%; width: 50px"}">
                ${validate_component(Button, "Button").$$render(
			$$result,
			{
				type: "submit",
				class: "flex full-width flex-self-stretch flex-justify-start"
			},
			{},
			{
				default: () => `
                    ${validate_component(Icon, "Icon").$$render($$result, { type: "send", is: "info", size: "medium" }, {}, {})}
                `
			}
		)}
            </div>
        </div>`
	: ``}
</section>`;
});

/* src/components/donators/DonatorsCard.svelte generated by Svelte v3.18.1 */

const css$w = {
	code: "li.svelte-13srupt{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;padding:20px;width:100%}li.svelte-13srupt:not(:last-child){background-image:-webkit-gradient(linear, left top, right top, color-stop(50%, rgba(var(--theme-color-primary-opposite), 0.1)), color-stop(0%, rgba(var(--theme-color-primary-opposite), 0)));background-image:linear-gradient(to right, rgba(var(--theme-color-primary-opposite), 0.1) 50%, rgba(var(--theme-color-primary-opposite), 0) 0%);background-position:bottom;background-size:20px 1px;background-repeat:repeat-x}",
	map: "{\"version\":3,\"file\":\"DonatorsCard.svelte\",\"sources\":[\"DonatorsCard.svelte\"],\"sourcesContent\":[\"<script>\\n    import Icon from '@components/Icon.svelte'\\n    import Card from '@components/Card.svelte'\\n    import Avatar from '@components/Avatar.svelte'\\n    import Loader from '@components/loader'\\n\\n    /**\\n     * @type {{\\n     *  id: string,\\n     *  src: string,\\n     *  title: string,\\n     *  subtitle: string,\\n     *  checked: boolean,\\n     * }}\\n     */\\n    export let items\\n</script>\\n\\n{#if Array.isArray(items) && items.length}\\n    <Card>\\n        <ul class=\\\"full-width\\\">\\n            {#each items as item}\\n                <li key={item.id}>\\n                    <div class=\\\"relative\\\">\\n                        <Avatar src={item.src} size=\\\"medium\\\" alt={item.subtitle}/>\\n                        {#if item.checked}\\n                            <div class=\\\"absolute flex\\\" style=\\\"top: -1px; right: -1px; width: 20px; height: 20px; overflow: hidden\\\">\\n                                <Icon type=\\\"polygon\\\" is=\\\"info\\\"/>\\n                                <div class=\\\"absolute-center flex\\\" style=\\\"width: 10px; height: 10px;\\\">\\n                                    <Icon type=\\\"check-flag\\\" is=\\\"light\\\"/>\\n                                </div>\\n                            </div>\\n                        {/if}\\n                    </div>\\n                    <s></s>\\n                    <s></s>\\n                    <s></s>\\n                    <s></s>\\n                    <div style=\\\"overflow: hidden;\\\" class=\\\"flex flex-column flex-justify-center\\\">\\n                        {#if item.title !== null}\\n                            <h2 class=\\\"text-ellipsis\\\">{ item.title }</h2>\\n                        {:else}\\n                            <span class=\\\"h2 relative flex-self-start\\\">\\n                                <span style=\\\"visibility: hidden\\\">₴ 1000</span>\\n                                <Loader type=\\\"h2\\\" absolute/>\\n                            </span>  \\n                        {/if}\\n\\n                        {#if item.subtitle !== null}\\n                            <span class=\\\"h4 font-w-300 text-ellipsis\\\">{ item.subtitle }</span>\\n                        {:else}\\n                            <Loader type=\\\"h4\\\"/>\\n                        {/if}\\n                    </div>\\n                </li>\\n            {/each}\\n        </ul>\\n    </Card>\\n{/if}\\n\\n<style>\\n    li {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        padding: 20px;\\n        width: 100%;\\n    }\\n\\n    li:not(:last-child) {\\n        background-image: -webkit-gradient(linear, left top, right top, color-stop(50%, rgba(var(--theme-color-primary-opposite), 0.1)), color-stop(0%, rgba(var(--theme-color-primary-opposite), 0)));\\n        background-image: linear-gradient(to right, rgba(var(--theme-color-primary-opposite), 0.1) 50%, rgba(var(--theme-color-primary-opposite), 0) 0%);\\n        background-position: bottom;\\n        background-size: 20px 1px;\\n        background-repeat: repeat-x;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2RvbmF0b3JzL0RvbmF0b3JzQ2FyZC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsYUFBYTtRQUNiLFdBQVc7SUFDZjs7SUFFQTtRQUNJLDhMQUFnSjtRQUFoSixnSkFBZ0o7UUFDaEosMkJBQTJCO1FBQzNCLHlCQUF5QjtRQUN6QiwyQkFBMkI7SUFDL0IiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvZG9uYXRvcnMvRG9uYXRvcnNDYXJkLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIGxpIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuXG4gICAgbGk6bm90KDpsYXN0LWNoaWxkKSB7XG4gICAgICAgIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCh0byByaWdodCwgcmdiYSh2YXIoLS10aGVtZS1jb2xvci1wcmltYXJ5LW9wcG9zaXRlKSwgMC4xKSA1MCUsIHJnYmEodmFyKC0tdGhlbWUtY29sb3ItcHJpbWFyeS1vcHBvc2l0ZSksIDApIDAlKTtcbiAgICAgICAgYmFja2dyb3VuZC1wb3NpdGlvbjogYm90dG9tO1xuICAgICAgICBiYWNrZ3JvdW5kLXNpemU6IDIwcHggMXB4O1xuICAgICAgICBiYWNrZ3JvdW5kLXJlcGVhdDogcmVwZWF0LXg7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AA6DI,EAAE,eAAC,CAAC,AACA,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,AACf,CAAC,AAED,iBAAE,KAAK,WAAW,CAAC,AAAC,CAAC,AACjB,gBAAgB,CAAE,iBAAiB,MAAM,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,WAAW,GAAG,CAAC,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,WAAW,EAAE,CAAC,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9L,gBAAgB,CAAE,gBAAgB,EAAE,CAAC,KAAK,CAAC,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAChJ,mBAAmB,CAAE,MAAM,CAC3B,eAAe,CAAE,IAAI,CAAC,GAAG,CACzB,iBAAiB,CAAE,QAAQ,AAC/B,CAAC\"}"
};

const DonatorsCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$w);

	return `${Array.isArray(items) && items.length
	? `${validate_component(Card, "Card").$$render($$result, {}, {}, {
			default: () => `
        <ul class="${"full-width"}">
            ${each(items, item => `<li${add_attribute("key", item.id, 0)} class="${"svelte-13srupt"}">
                    <div class="${"relative"}">
                        ${validate_component(Avatar, "Avatar").$$render(
				$$result,
				{
					src: item.src,
					size: "medium",
					alt: item.subtitle
				},
				{},
				{}
			)}
                        ${item.checked
			? `<div class="${"absolute flex"}" style="${"top: -1px; right: -1px; width: 20px; height: 20px; overflow: hidden"}">
                                ${validate_component(Icon, "Icon").$$render($$result, { type: "polygon", is: "info" }, {}, {})}
                                <div class="${"absolute-center flex"}" style="${"width: 10px; height: 10px;"}">
                                    ${validate_component(Icon, "Icon").$$render($$result, { type: "check-flag", is: "light" }, {}, {})}
                                </div>
                            </div>`
			: ``}
                    </div>
                    <s></s>
                    <s></s>
                    <s></s>
                    <s></s>
                    <div style="${"overflow: hidden;"}" class="${"flex flex-column flex-justify-center"}">
                        ${item.title !== null
			? `<h2 class="${"text-ellipsis"}">${escape(item.title)}</h2>`
			: `<span class="${"h2 relative flex-self-start"}">
                                <span style="${"visibility: hidden"}">₴ 1000</span>
                                ${validate_component(Loader$1, "Loader").$$render($$result, { type: "h2", absolute: true }, {}, {})}
                            </span>`}

                        ${item.subtitle !== null
			? `<span class="${"h4 font-w-300 text-ellipsis"}">${escape(item.subtitle)}</span>`
			: `${validate_component(Loader$1, "Loader").$$render($$result, { type: "h4" }, {}, {})}`}
                    </div>
                </li>`)}
        </ul>
    `
		})}`
	: ``}`;
});

/* src/components/donators/DonatorsList.svelte generated by Svelte v3.18.1 */

const css$x = {
	code: "ul.svelte-17hwyyp{width:100%;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:start;-ms-flex-align:start;align-items:flex-start;max-width:100%;overflow-y:hidden;overflow-x:auto;padding:var(--screen-padding) 0}li.svelte-17hwyyp{-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:stretch;align-self:stretch;width:260px;padding:0 5px}li.svelte-17hwyyp:first-child{padding-left:15px}li.svelte-17hwyyp:last-child{padding-right:15px}",
	map: "{\"version\":3,\"file\":\"DonatorsList.svelte\",\"sources\":[\"DonatorsList.svelte\"],\"sourcesContent\":[\"<script>\\n    import { tick } from 'svelte'\\n    import DonatorsCard from './DonatorsCard.svelte'\\n\\n    /**\\n     * @type {{\\n     *  id: string,\\n     *  src: string,\\n     *  title: string,\\n     *  subtitle: string,\\n     *  checked: boolean,\\n     * }[]}\\n     */\\n    export let items = new Array(8).fill({ title: null, subtitle: null })\\n\\n    let itemsPrev = []\\n    let container = null\\n    let grouped = []\\n    \\n    $: grouped = items.reverse().reduce((acc, item) => {\\n        const lastInd = Math.max(acc.length - 1, 0)\\n        if (!Array.isArray(acc[lastInd])) {\\n            acc[lastInd] = []\\n        }\\n        if (acc[lastInd].length < 3) {\\n            acc[lastInd].push(item)\\n        } else {\\n            acc.push([])\\n            acc[lastInd + 1].push(item)\\n        }\\n        return acc\\n    }, []).reverse()\\n\\n    $: onItemsChange(items, container)\\n\\n    async function onItemsChange(items, container) {\\n        if (items && items.length && !(itemsPrev && itemsPrev.length)) {\\n            await tick()\\n            scrollEnd(container)\\n        }\\n        itemsPrev = items\\n    }\\n\\n    function scrollEnd(node) {\\n        try {\\n            node && node.scrollTo(node.scrollWidth, 0)\\n        } catch (err) {\\n            console.warn(`The Magic told me \\\"${err.message}\\\". It's a weird reason, I know, but I couldn't scroll to the end of ${node} with it: `, err)\\n        }\\n    }\\n</script>\\n\\n<ul class=\\\"donators scroll-x-center\\\" bind:this={container}>\\n    {#each grouped as cards}\\n        <li>\\n            <DonatorsCard items={cards}/>\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    ul {\\n        width: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: start;\\n            -ms-flex-align: start;\\n                align-items: flex-start;\\n        max-width: 100%;\\n        overflow-y: hidden;\\n        overflow-x: auto;\\n        padding: var(--screen-padding) 0;\\n    }\\n\\n    li {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        width: 260px;\\n        padding: 0 5px;\\n    }\\n\\n    li:first-child {\\n        padding-left: 15px;\\n    }\\n\\n    li:last-child {\\n        padding-right: 15px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2RvbmF0b3JzL0RvbmF0b3JzTGlzdC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksV0FBVztRQUNYLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2Isd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLGVBQWU7UUFDZixrQkFBa0I7UUFDbEIsZ0JBQWdCO1FBQ2hCLGdDQUFnQztJQUNwQzs7SUFFQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQixZQUFZO1FBQ1osY0FBYztJQUNsQjs7SUFFQTtRQUNJLGtCQUFrQjtJQUN0Qjs7SUFFQTtRQUNJLG1CQUFtQjtJQUN2QiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9kb25hdG9ycy9Eb25hdG9yc0xpc3Quc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgdWwge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgICAgIG1heC13aWR0aDogMTAwJTtcbiAgICAgICAgb3ZlcmZsb3cteTogaGlkZGVuO1xuICAgICAgICBvdmVyZmxvdy14OiBhdXRvO1xuICAgICAgICBwYWRkaW5nOiB2YXIoLS1zY3JlZW4tcGFkZGluZykgMDtcbiAgICB9XG5cbiAgICBsaSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIHdpZHRoOiAyNjBweDtcbiAgICAgICAgcGFkZGluZzogMCA1cHg7XG4gICAgfVxuXG4gICAgbGk6Zmlyc3QtY2hpbGQge1xuICAgICAgICBwYWRkaW5nLWxlZnQ6IDE1cHg7XG4gICAgfVxuXG4gICAgbGk6bGFzdC1jaGlsZCB7XG4gICAgICAgIHBhZGRpbmctcmlnaHQ6IDE1cHg7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AA6DI,EAAE,eAAC,CAAC,AACA,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,KAAK,CACpB,cAAc,CAAE,KAAK,CACjB,WAAW,CAAE,UAAU,CAC/B,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAAC,CAAC,AACpC,CAAC,AAED,EAAE,eAAC,CAAC,AACA,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,iBAAE,YAAY,AAAC,CAAC,AACZ,YAAY,CAAE,IAAI,AACtB,CAAC,AAED,iBAAE,WAAW,AAAC,CAAC,AACX,aAAa,CAAE,IAAI,AACvB,CAAC\"}"
};

function scrollEnd(node) {
	try {
		node && node.scrollTo(node.scrollWidth, 0);
	} catch(err) {
		console.warn(`The Magic told me "${err.message}". It's a weird reason, I know, but I couldn't scroll to the end of ${node} with it: `, err);
	}
}

const DonatorsList = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = new Array(8).fill({ title: null, subtitle: null }) } = $$props;
	let itemsPrev = [];
	let container = null;
	let grouped = [];

	async function onItemsChange(items, container) {
		if (items && items.length && !(itemsPrev && itemsPrev.length)) {
			await tick();
			scrollEnd(container);
		}

		itemsPrev = items;
	}

	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$x);

	grouped = items.reverse().reduce(
		(acc, item) => {
			const lastInd = Math.max(acc.length - 1, 0);

			if (!Array.isArray(acc[lastInd])) {
				acc[lastInd] = [];
			}

			if (acc[lastInd].length < 3) {
				acc[lastInd].push(item);
			} else {
				acc.push([]);
				acc[lastInd + 1].push(item);
			}

			return acc;
		},
		[]
	).reverse();

	 {
		onItemsChange(items, container);
	}

	return `<ul class="${"donators scroll-x-center svelte-17hwyyp"}"${add_attribute("this", container, 1)}>
    ${each(grouped, cards => `<li class="${"svelte-17hwyyp"}">
            ${validate_component(DonatorsCard, "DonatorsCard").$$render($$result, { items: cards }, {}, {})}
        </li>`)}
</ul>`;
});

/* src/components/newsList/NewsItem.svelte generated by Svelte v3.18.1 */

const NewsItem = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { src = null } = $$props;
	let { date = null } = $$props;
	let { title = null } = $$props;
	let { likes = null } = $$props;
	let { isLiked = null } = $$props;
	let { subtitle = null } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.date === void 0 && $$bindings.date && date !== void 0) $$bindings.date(date);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.likes === void 0 && $$bindings.likes && likes !== void 0) $$bindings.likes(likes);
	if ($$props.isLiked === void 0 && $$bindings.isLiked && isLiked !== void 0) $$bindings.isLiked(isLiked);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	let classProp = classnames($$props.class);

	return `${validate_component(Card, "Card").$$render($$result, { class: classProp }, {}, {
		default: () => `
    <section class="${"news-item flex"}">

        <div class="${"flex flex-none relative"}" style="${"width: 110px"}">
            ${validate_component(Picture, "Picture").$$render($$result, { src, alt: title }, {}, {})}
        </div>

        <div class="${"flex flex-column flex-1 container overflow-hidden"}" style="${"padding-top: 20px; padding-bottom: 5px"}">

            ${title !== null
		? `<h3 class="${"font-w-500 text-ellipsis-multiline"}" style="${"--max-lines: 2"}">${escape(title)}</h3>`
		: `<div style="${"width: 80%"}">${validate_component(Loader$1, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>
                <div style="${"width: 80%"}">${validate_component(Loader$1, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>`}

            ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

            ${subtitle !== null
		? `<p class="${"font-w-300 text-ellipsis-multiline"}" style="${"--max-lines: 3"}">${escape(subtitle)}</p>`
		: `<div style="${"width: 100%"}">${validate_component(Loader$1, "Loader").$$render($$result, { type: "p" }, {}, {})}</div>
                <div style="${"width: 100%"}">${validate_component(Loader$1, "Loader").$$render($$result, { type: "p" }, {}, {})}</div>`}

            <div class="${"flex flex-align-center flex-justify-between"}">
                <p>
                    ${date !== null
		? `<span class="${"h4"}" style="${"opacity: .3"}">${escape(date)}</span>`
		: `<div style="${"width: 60%"}">${validate_component(Loader$1, "Loader").$$render($$result, { type: "h4" }, {}, {})}</div>`}
                </p>
                <s></s>
                <s></s>
                <span class="${"h5 flex flex-align-center font-secondary"}" style="${"min-width: 4em"}">
                    ${validate_component(Button, "Button").$$render($$result, { size: "medium" }, {}, {
			default: () => `
                        <span${add_attribute("style", `opacity: ${isLiked ? 1 : 0.5}`, 0)}>
                            ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					type: "heart-filled",
					is: "danger",
					size: "small"
				},
				{},
				{}
			)}
                        </span>
                        <s></s>
                        <s></s>
                        ${likes !== null
			? `<h4>${escape(likes)}</h4>`
			: `<span class="${"h4 relative"}">
                                <span style="${"visibility: hidden"}">199</span>
                                ${validate_component(Loader$1, "Loader").$$render($$result, { type: "h4", absolute: true }, {}, {})}
                            </span>`}
                    `
		})}
                </span>
            </div>
        </div>

    </section>
`
	})}`;
});

/* src/components/newsList/NewsList.svelte generated by Svelte v3.18.1 */

const css$y = {
	code: ".news-list.svelte-6apgo.svelte-6apgo{width:100%;-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;display:-webkit-box;display:-ms-flexbox;display:flex;overflow-y:auto;overflow-x:hidden;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.news-list-wrap.svelte-6apgo.svelte-6apgo{width:100%;margin:-5px 0}.news-list-wrap.svelte-6apgo li.svelte-6apgo{position:relative;width:100%;padding:5px 0}.arrow.svelte-6apgo.svelte-6apgo{position:absolute;top:8px;right:15px;color:rgba(var(--color-info))}",
	map: "{\"version\":3,\"file\":\"NewsList.svelte\",\"sources\":[\"NewsList.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { onMount } from 'svelte'\\n    import { API, Dates } from '@services'\\n    \\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import Button from '@components/Button.svelte'\\n    import NewsItem from './NewsItem.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n   \\n   /**\\n    * @type {{\\n    *   id: string,\\n    *   src: string,\\n    *   likes: number,\\n    *   title: string,\\n    *   subtitle: string,\\n    *   created_at: string,\\n    * }}\\n    */\\n    export let items = new Array(3).fill({ title: null, subtitle: null, created_at: null, likes: null })\\n</script>\\n\\n<section class=\\\"news-list\\\">\\n    <ul class=\\\"news-list-wrap\\\">\\n        {#each items as item, index}\\n            <li role=\\\"button\\\" on:click={() => dispatch('click', { item, index })} key={item.id}>\\n                <NewsItem\\n                        src={item.src}\\n                        title={item.title}\\n                        likes={item.likes}\\n                        isLiked={item.isLiked}\\n                        subtitle={item.subtitle}\\n                        date={item.created_at === null ? null : Dates(item.created_at).fromNow()}\\n                />\\n\\n                <span class=\\\"arrow h2\\\">→</span>\\n            </li>\\n        {/each}\\n    </ul>\\n\\n    <Br size=\\\"20\\\"/>  \\n\\n    <p class=\\\"h3 font-w-500 font-secondary underline text-center\\\">\\n        <span>All comments</span>\\n        <span class=\\\"font-w-600\\\">⋁</span>\\n    </p>\\n</section>\\n\\n<style>\\n    .news-list {\\n        width: 100%;\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow-y: auto;\\n        overflow-x: hidden;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n    }\\n\\n    .news-list-wrap {\\n        width: 100%;\\n        margin: -5px 0;\\n    }\\n\\n    .news-list-wrap li {\\n        position: relative;\\n        width: 100%;\\n        padding: 5px 0;\\n    }\\n\\n    .arrow {\\n        position: absolute;\\n        top: 8px;\\n        right: 15px;\\n        color: rgba(var(--color-info));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL25ld3NMaXN0L05ld3NMaXN0LnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxXQUFXO1FBQ1gsbUJBQVk7WUFBWixvQkFBWTtnQkFBWixZQUFZO1FBQ1osb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBQ2xCLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsNEJBQXNCO1FBQXRCLDZCQUFzQjtZQUF0QiwwQkFBc0I7Z0JBQXRCLHNCQUFzQjtJQUMxQjs7SUFFQTtRQUNJLFdBQVc7UUFDWCxjQUFjO0lBQ2xCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLFdBQVc7UUFDWCxjQUFjO0lBQ2xCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLFFBQVE7UUFDUixXQUFXO1FBQ1gsOEJBQThCO0lBQ2xDIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL25ld3NMaXN0L05ld3NMaXN0LnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5uZXdzLWxpc3Qge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgfVxuXG4gICAgLm5ld3MtbGlzdC13cmFwIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIG1hcmdpbjogLTVweCAwO1xuICAgIH1cblxuICAgIC5uZXdzLWxpc3Qtd3JhcCBsaSB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIHBhZGRpbmc6IDVweCAwO1xuICAgIH1cblxuICAgIC5hcnJvdyB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiA4cHg7XG4gICAgICAgIHJpZ2h0OiAxNXB4O1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAoDI,UAAU,0BAAC,CAAC,AACR,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,MAAM,CAClB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,AAClC,CAAC,AAED,eAAe,0BAAC,CAAC,AACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CAAC,CAAC,AAClB,CAAC,AAED,4BAAe,CAAC,EAAE,aAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,CAAC,AAClB,CAAC,AAED,MAAM,0BAAC,CAAC,AACJ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,KAAK,CAAE,IAAI,CACX,KAAK,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAClC,CAAC\"}"
};

const NewsList = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();

	let { items = new Array(3).fill({
		title: null,
		subtitle: null,
		created_at: null,
		likes: null
	}) } = $$props;

	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$y);

	return `<section class="${"news-list svelte-6apgo"}">
    <ul class="${"news-list-wrap svelte-6apgo"}">
        ${each(items, (item, index) => `<li role="${"button"}"${add_attribute("key", item.id, 0)} class="${"svelte-6apgo"}">
                ${validate_component(NewsItem, "NewsItem").$$render(
		$$result,
		{
			src: item.src,
			title: item.title,
			likes: item.likes,
			isLiked: item.isLiked,
			subtitle: item.subtitle,
			date: item.created_at === null
			? null
			: dayjs(item.created_at).fromNow()
		},
		{},
		{}
	)}

                <span class="${"arrow h2 svelte-6apgo"}">→</span>
            </li>`)}
    </ul>

    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}  

    <p class="${"h3 font-w-500 font-secondary underline text-center"}">
        <span>All comments</span>
        <span class="${"font-w-600"}">⋁</span>
    </p>
</section>`;
});

/* src/components/fundCards/FundCard.svelte generated by Svelte v3.18.1 */

const FundCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = null } = $$props;
	let { city = null } = $$props;
	let { title = null } = $$props;
	let { total = null } = $$props;
	let { current = null } = $$props;
	let { currency = null } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.city === void 0 && $$bindings.city && city !== void 0) $$bindings.city(city);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.total === void 0 && $$bindings.total && total !== void 0) $$bindings.total(total);
	if ($$props.current === void 0 && $$bindings.current && current !== void 0) $$bindings.current(current);
	if ($$props.currency === void 0 && $$bindings.currency && currency !== void 0) $$bindings.currency(currency);

	return `${validate_component(Card, "Card").$$render($$result, { class: "flex flex-column" }, {}, {
		default: () => `
    
    <div style="${"height: 160px"}" class="${"flex"}">
        ${validate_component(Carousel, "Carousel").$$render(
			$$result,
			{
				items: [{ src, alt: title }, { src, alt: title }, { src, alt: title }],
				disableFancy: true,
				dotsBelow: false,
				rounded: false,
				stopPropagation: true
			},
			{},
			{}
		)}    
    </div>

    <section class="${"container flex flex-column flex-justify-between flex-1"}">
        <div class="${"flex-none overflow-hidden"}" style="${"height: calc(2 * var(--font-line-height-h2) + var(--font-line-height) + 20px + 5px + 10px)"}">
            ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}     

            ${title !== null
		? `<h2 class="${"text-ellipsis-multiline"}" style="${"--max-lines: 2"}">
                    ${escape(title)}
                </h2>`
		: `${validate_component(Loader$1, "Loader").$$render($$result, { type: "h2" }, {}, {})}
                ${validate_component(Loader$1, "Loader").$$render($$result, { type: "h2" }, {}, {})}`}

            ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}     

            ${city !== null
		? `<p class="${"flex flex-align-center font-secondary font-w-500"}" style="${"opacity: .7; margin-left: -2px"}">
                    ${validate_component(Icon, "Icon").$$render($$result, { type: "location-mark", size: "small" }, {}, {})}
                    <s></s>
                    <span>${escape(city)}</span>
                </p>
                ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}`
		: `<div style="${"width: 40%"}">${validate_component(Loader$1, "Loader").$$render($$result, { type: "p" }, {}, {})}</div>`}
        </div>

        <div>
            <p class="${"font-secondary flex flex-wrap flex-align-end"}" style="${"letter-spacing: -0.5px"}">
                ${current !== null && total !== null
		? `<span class="${"h1 font-w-500"}">${escape(currency)} ${escape(current)}</span>
                    <s></s>
                    <span class="${"h4"}">/ ${escape(currency)} ${escape(total)}</span>`
		: `<div style="${"width: 80%; flex: none"}">${validate_component(Loader$1, "Loader").$$render($$result, { type: "h1" }, {}, {})}</div>`}
            </p>

            ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}  
            ${validate_component(Progress, "Progress").$$render($$result, { value: Math.floor(current / total * 100) }, {}, {})}
            ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}  

            ${$$slots.button ? $$slots.button({}) : ``}

            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}     
        </div>
    </section>
`
	})}`;
});

/* src/components/fundCards/FundCards.svelte generated by Svelte v3.18.1 */

const css$z = {
	code: ".charities.active .scroll-x-center > *{-webkit-transform:none;transform:none\n    }div.svelte-14qvbw3{-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;height:470px;width:77vw;max-width:350px;padding:15px 5px;-webkit-box-sizing:content-box;box-sizing:content-box}div.start.svelte-14qvbw3{padding-left:var(--screen-padding)}div.end.svelte-14qvbw3{padding-right:var(--screen-padding)}",
	map: "{\"version\":3,\"file\":\"FundCards.svelte\",\"sources\":[\"FundCards.svelte\"],\"sourcesContent\":[\"<script>\\n    import Carousel from '@components/Carousel.svelte'\\n    import Button from '@components/Button.svelte'\\n    import FundCard from './FundCard.svelte'\\n\\n    /**\\n     * @type {{\\n     *  id: string,\\n     *  src: string,\\n     *  total: number,\\n     *  current: number,\\n     *  currency: string,\\n     *  city: string,\\n     *  title: string,\\n     * }}\\n     */\\n    export let items = [{}, {}, {}]\\n</script>\\n\\n<Carousel {items} size=\\\"auto\\\" let:index={index} let:item={item} class=\\\"charities\\\">\\n    <div class={!index ? 'start' : index === items.length - 1 ? 'end' : ''} key={item.id}>\\n        <FundCard\\n            src={item.src}\\n            total={item.total}\\n            current={item.current}\\n            currency={item.currency}\\n            city={item.city}\\n            title={item.title}\\n        >\\n            <span slot=\\\"button\\\" let:id={id}>\\n                <slot name=\\\"button\\\">\\n                    <Button size=\\\"big\\\" is=\\\"success\\\" href={id}>\\n                        <span class=\\\"h2 font-secondary font-w-600\\\">\\n                            Допомогти\\n                        </span>\\n                    </Button>\\n                </slot>\\n            </span>\\n        </FundCard>\\n    </div>\\n</Carousel>\\n\\n<style>\\n    :global(.charities.active .scroll-x-center > *) {\\n        -webkit-transform: none;\\n                transform: none\\n    }\\n    div {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        height: 470px;\\n        width: 77vw;\\n        max-width: 350px;\\n        padding: 15px 5px;\\n        -webkit-box-sizing: content-box;\\n                box-sizing: content-box;\\n    }\\n\\n    div.start {\\n        padding-left: var(--screen-padding);\\n    }\\n\\n    div.end {\\n        padding-right: var(--screen-padding);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2Z1bmRDYXJkcy9GdW5kQ2FyZHMuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLHVCQUFjO2dCQUFkO0lBQ0o7SUFDQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1Ysb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYiw0QkFBbUI7WUFBbkIsbUJBQW1CO1FBQ25CLGFBQWE7UUFDYixXQUFXO1FBQ1gsZ0JBQWdCO1FBQ2hCLGlCQUFpQjtRQUNqQiwrQkFBdUI7Z0JBQXZCLHVCQUF1QjtJQUMzQjs7SUFFQTtRQUNJLG1DQUFtQztJQUN2Qzs7SUFFQTtRQUNJLG9DQUFvQztJQUN4QyIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9mdW5kQ2FyZHMvRnVuZENhcmRzLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIDpnbG9iYWwoLmNoYXJpdGllcy5hY3RpdmUgLnNjcm9sbC14LWNlbnRlciA+ICopIHtcbiAgICAgICAgdHJhbnNmb3JtOiBub25lXG4gICAgfVxuICAgIGRpdiB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGhlaWdodDogNDcwcHg7XG4gICAgICAgIHdpZHRoOiA3N3Z3O1xuICAgICAgICBtYXgtd2lkdGg6IDM1MHB4O1xuICAgICAgICBwYWRkaW5nOiAxNXB4IDVweDtcbiAgICAgICAgYm94LXNpemluZzogY29udGVudC1ib3g7XG4gICAgfVxuXG4gICAgZGl2LnN0YXJ0IHtcbiAgICAgICAgcGFkZGluZy1sZWZ0OiB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgfVxuXG4gICAgZGl2LmVuZCB7XG4gICAgICAgIHBhZGRpbmctcmlnaHQ6IHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AA2CY,sCAAsC,AAAE,CAAC,AAC7C,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI;IAC3B,CAAC,AACD,GAAG,eAAC,CAAC,AACD,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,KAAK,CAChB,OAAO,CAAE,IAAI,CAAC,GAAG,CACjB,kBAAkB,CAAE,WAAW,CACvB,UAAU,CAAE,WAAW,AACnC,CAAC,AAED,GAAG,MAAM,eAAC,CAAC,AACP,YAAY,CAAE,IAAI,gBAAgB,CAAC,AACvC,CAAC,AAED,GAAG,IAAI,eAAC,CAAC,AACL,aAAa,CAAE,IAAI,gBAAgB,CAAC,AACxC,CAAC\"}"
};

const FundCards = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [{}, {}, {}] } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$z);

	return `${validate_component(Carousel, "Carousel").$$render($$result, { items, size: "auto", class: "charities" }, {}, {
		default: ({ index, item }) => `
    <div class="${escape(null_to_empty(!index
		? "start"
		: index === items.length - 1 ? "end" : "")) + " svelte-14qvbw3"}"${add_attribute("key", item.id, 0)}>
        ${validate_component(FundCard, "FundCard").$$render(
			$$result,
			{
				src: item.src,
				total: item.total,
				current: item.current,
				currency: item.currency,
				city: item.city,
				title: item.title
			},
			{},
			{
				button: ({ id }) => `<span slot="${"button"}">
                ${$$slots.button
				? $$slots.button({})
				: `
                    ${validate_component(Button, "Button").$$render($$result, { size: "big", is: "success", href: id }, {}, {
						default: () => `
                        <span class="${"h2 font-secondary font-w-600"}">
                            Допомогти
                        </span>
                    `
					})}
                `}
            </span>`,
				default: () => `
            
        `
			}
		)}
    </div>
`
	})}`;
});

/* src/routes/index.svelte generated by Svelte v3.18.1 */

const css$A = {
	code: ".top-pic.svelte-zj2ii1{-webkit-box-flex:0;-ms-flex:none;flex:none;z-index:0;width:100%;height:200px;display:-webkit-box;display:-ms-flexbox;display:flex;overflow:hidden;border-radius:0}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<script>\\n    import {\\n        Br,\\n        Footer,\\n        Divider,\\n        Comments,\\n        Progress,\\n        Carousel,\\n        ContentHolder,\\n        TitleSubTitle,\\n        ListOfFeatures,\\n    } from '@components'\\n</script>\\n\\n<style>\\n    .top-pic {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        z-index: 0;\\n        width: 100%;\\n        height: 200px;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow: hidden;\\n        border-radius: 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvaW5kZXguc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsVUFBVTtRQUNWLFdBQVc7UUFDWCxhQUFhO1FBQ2Isb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsZ0JBQWdCO0lBQ3BCIiwiZmlsZSI6InNyYy9yb3V0ZXMvaW5kZXguc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnRvcC1waWMge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICB6LWluZGV4OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAyMDBweDtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICB9XG4iXX0= */</style>\\n\\n<svelte:head>\\n    <title>Charitify - list of charities you can donate.</title>\\n</svelte:head>\\n\\n<section>\\n    <Br size=\\\"var(--header-height)\\\"/>\\n\\n    <div class=\\\"top-pic\\\">\\n        <Carousel/>\\n    </div>\\n\\n    <Progress borderRadius=\\\"0 0 8px 8px\\\" value=\\\"30\\\"/>\\n\\n    <p>These guys rise a pound of vegetables. They like vegetables and long text under photos.</p>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <section class=\\\"container\\\">\\n\\n        <TitleSubTitle\\n                title=\\\"Charitify\\\"\\n                subtitle=\\\"Charity application for helping those in need\\\"\\n        />\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <ContentHolder/>\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <Divider size=\\\"16\\\"/>\\n        <h3 class=\\\"h2 text-right\\\">Comments:</h3>\\n        <Divider size=\\\"20\\\"/>\\n\\n        <Comments withForm={false}/>\\n\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n\\n            <ContentHolder/>\\n\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n\\n            <ListOfFeatures/>\\n    </section>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Footer/>\\n\\n</section>\\n\"],\"names\":[],\"mappings\":\"AAeI,QAAQ,cAAC,CAAC,AACN,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,CAAC,CACV,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,CAAC,AACpB,CAAC\"}"
};

const Routes = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$A);

	return `${($$result.head += `${($$result.title = `<title>Charitify - list of charities you can donate.</title>`, "")}`, "")}

<section>
    ${validate_component(Br, "Br").$$render($$result, { size: "var(--header-height)" }, {}, {})}

    <div class="${"top-pic svelte-zj2ii1"}">
        ${validate_component(Carousel, "Carousel").$$render($$result, {}, {}, {})}
    </div>

    ${validate_component(Progress, "Progress").$$render($$result, { borderRadius: "0 0 8px 8px", value: "30" }, {}, {})}

    <p>These guys rise a pound of vegetables. They like vegetables and long text under photos.</p>

    <br>
    <br>
    <br>
    <br>
    <br>
    <section class="${"container"}">

        ${validate_component(TitleSubTitle, "TitleSubTitle").$$render(
		$$result,
		{
			title: "Charitify",
			subtitle: "Charity application for helping those in need"
		},
		{},
		{}
	)}

        <br>
        <br>
        <br>
        <br>
        <br>

        ${validate_component(ContentHolder, "ContentHolder").$$render($$result, {}, {}, {})}

        <br>
        <br>
        <br>
        <br>
        <br>

        ${validate_component(Divider, "Divider").$$render($$result, { size: "16" }, {}, {})}
        <h3 class="${"h2 text-right"}">Comments:</h3>
        ${validate_component(Divider, "Divider").$$render($$result, { size: "20" }, {}, {})}

        ${validate_component(Comments, "Comments").$$render($$result, { withForm: false }, {}, {})}

            <br>
            <br>
            <br>
            <br>
            <br>

            ${validate_component(ContentHolder, "ContentHolder").$$render($$result, {}, {}, {})}

            <br>
            <br>
            <br>
            <br>
            <br>

            ${validate_component(ListOfFeatures, "ListOfFeatures").$$render($$result, {}, {}, {})}
    </section>

    <br>
    <br>
    <br>
    <br>
    <br>

    ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}

</section>`;
});

const CONTEXT_KEY = {};

/* src/routes/_icons.svelte generated by Svelte v3.18.1 */

const Icons = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<section>
    <svg style="${"display: none"}">
    
        
        <svg id="${"ico-heart-filled"}" class="${"ico-heart-filled"}" viewBox="${"0 0 52 46"}">
            <path stroke="${"none"}" d="${"M38.1875 0C35.3658 0 32.7788 0.895982 30.4985 2.66312C28.3124 4.35728 26.8569 6.51511 26 8.08419C25.1431 6.515 23.6876 4.35728 21.5015 2.66312C19.2212 0.895982 16.6342 0 13.8125 0C5.93816 0 0 6.45394 0 15.0125C0 24.2587 7.40827 30.5848 18.6234 40.1617C20.5279 41.788 22.6866 43.6315 24.9303 45.5976C25.2261 45.8571 25.6059 46 26 46C26.3941 46 26.7739 45.8571 27.0697 45.5977C29.3136 43.6313 31.4722 41.7879 33.3778 40.1606C44.5917 30.5848 52 24.2587 52 15.0125C52 6.45394 46.0618 0 38.1875 0Z"}"></path>
        </svg>

        
        <svg id="${"ico-moon"}" viewBox="${"0 0 1280.000000 1074.000000"}">
            <g transform="${"translate(0.000000,1074.000000) scale(0.100000,-0.100000)"}">
                <path d="${"M7280 10683 c122 -106 456 -448 564 -578 826 -994 1265 -2198 1266 -3465 0 -1147 -384 -2295 -1075 -3215 -295 -393 -683 -779 -1075 -1073 -800 -599 -1791 -976 -2760 -1052 -80 -6 -167 -14 -193 -18 l-49 -7 114 -91 c1044 -834 2358 -1254 3671 -1173 1734 106 3304 1033 4227 2494 347 549 599 1177 724 1805 76 381 99 618 100 1040 1 363 -7 488 -49 780 -186 1284 -817 2442 -1795 3295 -973 850 -2226 1315 -3535 1315 l-200 -1 65 -56z"}"></path>
                <path d="${"M4371 8892 c-62 -116 -98 -172 -109 -172 -39 -1 -354 -38 -358 -43 -3 -3 53 -66 125 -141 72 -75 131 -139 131 -143 -1 -5 -18 -90 -39 -190 -21 -101 -37 -183 -35 -183 3 0 79 36 171 80 91 44 171 80 177 80 6 0 84 -43 174 -94 89 -52 162 -88 162 -82 0 7 -11 93 -25 192 -14 98 -25 180 -25 181 0 1 64 59 141 129 119 108 139 129 123 136 -11 4 -95 21 -188 38 -93 16 -170 31 -171 32 -1 2 -33 71 -70 153 -37 83 -73 161 -80 174 -12 23 -17 15 -104 -147z"}"></path>
                <path d="${"M610 8054 c-74 -102 -137 -190 -140 -194 -3 -5 -107 24 -230 64 -124 40 -227 72 -229 70 -2 -2 56 -85 128 -184 73 -100 135 -188 138 -195 3 -8 -52 -92 -124 -192 -71 -98 -133 -184 -138 -192 -9 -16 -23 -20 237 65 109 35 202 64 206 64 5 0 71 -86 148 -192 l139 -192 3 241 2 240 225 73 c123 41 222 76 219 79 -3 3 -103 38 -222 76 l-217 71 -5 242 -5 242 -135 -186z"}"></path>
                <path d="${"M4415 6023 c-126 -157 -233 -290 -237 -296 -6 -10 -94 21 -568 202 -85 32 -156 57 -158 56 -1 -1 25 -45 59 -96 77 -116 342 -520 352 -536 4 -7 -90 -132 -233 -309 -131 -164 -238 -299 -237 -301 2 -1 168 43 371 99 222 60 371 97 375 91 160 -247 415 -632 417 -631 1 2 10 174 20 383 9 209 18 381 18 382 1 1 161 45 356 98 195 54 361 100 368 104 8 5 -47 30 -140 65 -84 32 -243 92 -353 134 -110 41 -202 77 -204 78 -2 2 4 167 14 366 9 200 16 371 14 380 -3 11 -86 -86 -234 -269z"}"></path>
            </g>
        </svg>

        
        <svg id="${"ico-eye"}" viewBox="${"0 0 29 17"}">
            <path d="${"M14.5 0C8.95924 0 3.93459 2.98113 0.22691 7.82327C-0.0756367 8.21997 -0.0756367 8.77419 0.22691 9.1709C3.93459 14.0189 8.95924 17 14.5 17C20.0408 17 25.0654 14.0189 28.7731 9.17673C29.0756 8.78003 29.0756 8.22581 28.7731 7.8291C25.0654 2.98113 20.0408 0 14.5 0ZM14.8975 14.4856C11.2194 14.7131 8.18211 11.732 8.41347 8.10913C8.6033 5.12217 11.0652 2.7011 14.1025 2.51441C17.7806 2.28689 20.8179 5.26802 20.5865 8.89087C20.3908 11.872 17.9289 14.2931 14.8975 14.4856ZM14.7136 11.7203C12.7322 11.8428 11.0949 10.2385 11.2254 8.28998C11.3262 6.67982 12.6551 5.37886 14.2924 5.27385C16.2738 5.15134 17.9111 6.75566 17.7806 8.70419C17.6738 10.3202 16.3449 11.6211 14.7136 11.7203Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-checked-circle"}" viewBox="${"0 0 24 24"}">
            <path d="${"M12 0C5.38338 0 0 5.38292 0 12C0 18.6171 5.38338 24 12 24C18.6166 24 24 18.6171 24 12C24 5.38292 18.6166 0 12 0ZM18.69 7.998L11.3054 16.3057C11.1235 16.5102 10.8702 16.6154 10.6149 16.6154C10.4123 16.6154 10.2088 16.5489 10.0385 16.4132L5.42308 12.7209C5.02523 12.4029 4.96062 11.8218 5.27908 11.4235C5.59708 11.0252 6.17862 10.9606 6.57646 11.2791L10.5074 14.4235L17.31 6.77077C17.6478 6.38954 18.2322 6.35538 18.6129 6.69415C18.9942 7.03338 19.0288 7.61677 18.69 7.998Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-cancel-circle"}" viewBox="${"0 0 24 24"}">
            <path d="${"M12 0C5.36756 0 0 5.36705 0 12C0 18.6325 5.36705 24 12 24C18.6324 24 24 18.633 24 12C24 5.36752 18.633 0 12 0ZM12 22.125C6.40387 22.125 1.875 17.5965 1.875 12C1.875 6.40383 6.40345 1.875 12 1.875C17.5961 1.875 22.125 6.40345 22.125 12C22.125 17.5962 17.5965 22.125 12 22.125Z"}" stroke="${"none"}"></path>
            <path d="${"M9.10568 7.77973L6.3259 4.99995L9.10568 2.22017C9.47178 1.85407 9.47182 1.2605 9.10573 0.894356C8.73954 0.528216 8.14597 0.528263 7.77992 0.894356L5.00009 3.67414L2.22027 0.894356C1.85422 0.528216 1.26055 0.528216 0.894455 0.894356C0.528361 1.2605 0.528362 1.85407 0.894502 2.22017L3.67428 4.99995L0.894502 7.77973C0.528362 8.14587 0.528314 8.73945 0.894455 9.10554C1.26069 9.47173 1.85427 9.47159 2.22027 9.10554L5.00009 6.32576L7.77992 9.10554C8.14592 9.47164 8.73959 9.47168 9.10573 9.10554C9.47187 8.7394 9.47182 8.14582 9.10568 7.77973Z"}" stroke="${"none"}" transform="${"translate(7 7)"}"></path>
        </svg>

        
        <svg id="${"ico-phone"}" viewBox="${"0 0 28 28"}">
            <path d="${"M25.7533 18.3788C24.039 18.3788 22.3558 18.1107 20.7608 17.5836C19.9792 17.317 19.0183 17.5615 18.5413 18.0515L15.393 20.4281C11.7418 18.4791 9.4928 16.2308 7.57043 12.6071L9.87714 9.54078C10.4764 8.94228 10.6914 8.06801 10.4339 7.2477C9.90449 5.64426 9.63557 3.96185 9.63557 2.24685C9.63565 1.00793 8.62772 0 7.38886 0H2.24678C1.00793 0 0 1.00793 0 2.24678C0 16.4473 11.5528 28 25.7533 28C26.9921 28 28.0001 26.9921 28.0001 25.7532V20.6255C28 19.3867 26.9921 18.3788 25.7533 18.3788Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-polygon"}" viewBox="${"0 0 91 90"}">
            <path d="${"M45.5056 0L49.3808 2.4221L53.631 0.723167L57.0065 3.79059L61.4951 2.86943L64.2626 6.48358L68.8454 6.3698L70.9158 10.4145L75.4455 11.1118L76.7523 15.4571L81.0833 16.943L81.5845 21.4492L85.5777 23.6759L85.2571 28.1982L88.784 31.0942L87.6521 35.4872L90.5994 38.9595L88.6924 43.082L90.9654 47.0189L88.3447 50.7385L89.8703 55.0134L86.6201 58.2105L87.3493 62.6861L83.5741 65.2579L83.4834 69.7904L79.3045 71.6542L78.3969 76.0978L73.9485 77.1938L72.2532 81.4058L67.6784 81.6987L65.2498 85.5436L60.6957 85.024L57.6118 88.3783L53.2247 87.063L49.5847 89.8188L45.5056 87.75L41.4265 89.8188L37.7865 87.063L33.3994 88.3783L30.3156 85.024L25.7615 85.5436L23.3328 81.6987L18.7581 81.4058L17.0627 77.1938L12.6144 76.0978L11.7068 71.6542L7.52785 69.7904L7.43718 65.2579L3.66194 62.6861L4.39112 58.2105L1.14092 55.0134L2.66653 50.7385L0.0458221 47.0189L2.31881 43.082L0.411839 38.9595L3.35916 35.4872L2.2272 31.0942L5.75412 28.1982L5.43357 23.6759L9.42673 21.4492L9.92789 16.943L14.259 15.4571L15.5657 11.1118L20.0955 10.4145L22.1658 6.3698L26.7487 6.48358L29.5161 2.86943L34.0048 3.79059L37.3803 0.723167L41.6305 2.4221L45.5056 0Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-female"}" viewBox="${"0 0 33 50"}">
            <path d="${"M28.1727 28.1639C34.6091 21.7296 34.6091 11.2601 28.1727 4.82581C21.7364 -1.6086 11.2637 -1.6086 4.82727 4.82581C-1.60909 11.2601 -1.60909 21.7296 4.82727 28.1639C7.55171 30.8875 10.9993 32.4578 14.5578 32.8757V38.4006H10.6737C9.60111 38.4006 8.73166 39.2699 8.73166 40.3421C8.73166 41.4143 9.60111 42.2835 10.6737 42.2835H14.5578V47.7526C14.5579 48.8248 15.4274 49.6941 16.5 49.6941C17.5726 49.6941 18.4421 48.8248 18.4421 47.7526V42.2835H22.3263C23.3989 42.2835 24.2683 41.4143 24.2683 40.3421C24.2683 39.2699 23.3989 38.4006 22.3263 38.4006H18.4421V32.8758C22.0007 32.4578 25.4483 30.8875 28.1727 28.1639ZM7.57384 25.4182C2.65189 20.4978 2.65189 12.4918 7.57384 7.57141C12.4957 2.65121 20.5041 2.65092 25.4263 7.57141C30.3482 12.4918 30.3482 20.4978 25.4263 25.4182C20.5043 30.3385 12.4958 30.3385 7.57384 25.4182Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-male"}" viewBox="${"0 0 44 44"}">
            <path d="${"M43.9763 1.59701C43.9561 1.43901 43.9212 1.28682 43.8635 1.14404C43.8617 1.14046 43.8617 1.13554 43.8608 1.13106C43.8608 1.13017 43.8599 1.12927 43.859 1.12838C43.7955 0.977987 43.7086 0.841471 43.6106 0.714803C43.5864 0.684814 43.5627 0.655273 43.5372 0.627075C43.4325 0.508911 43.3188 0.399699 43.1867 0.310628C43.1831 0.307943 43.1787 0.307048 43.1751 0.304362C43.0475 0.220215 42.9065 0.156657 42.7588 0.106527C42.7221 0.0935465 42.6863 0.0823568 42.6487 0.0725097C42.4939 0.0304362 42.3345 0 42.1667 0H29.3333C28.3213 0 27.5 0.82133 27.5 1.83333C27.5 2.84534 28.3213 3.66667 29.3333 3.66667H37.74L26.7977 14.6089C23.8799 12.2752 20.2875 11 16.5 11C7.40226 11 0 18.4023 0 27.5C0 36.5977 7.40226 44 16.5 44C25.5977 44 33 36.5977 33 27.5C33 23.7143 31.7257 20.1228 29.3902 17.2023L40.3333 6.25911V14.6667C40.3333 15.6787 41.1547 16.5 42.1667 16.5C43.1787 16.5 44 15.6787 44 14.6667V1.83333C44 1.79484 43.9911 1.75814 43.9888 1.72054C43.9861 1.67847 43.9817 1.63818 43.9763 1.59701ZM16.5 40.3333C9.42314 40.3333 3.66667 34.5769 3.66667 27.5C3.66667 20.4231 9.42314 14.6667 16.5 14.6667C19.9263 14.6667 23.1521 16.0005 25.5776 18.4175C27.9995 20.8479 29.3333 24.0737 29.3333 27.5C29.3333 34.5769 23.5769 40.3333 16.5 40.3333Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-check-flag"}" viewBox="${"0 0 11 9"}" fill="${"none"}">
            <path d="${"M1.51733 4.14799L4.26305 6.81348L9.9261 1.31592"}" stroke-width="${"2"}"></path>
        </svg>

        
        <svg id="${"ico-share"}" viewBox="${"0 0 23 22"}">
            <path d="${"M23 10.5144L13.4416 0.0126953V6.2782H11.4095C5.10811 6.2782 0 11.3963 0 17.71V21.0303L0.902649 20.0392C3.97155 16.6702 8.31388 14.7506 12.8664 14.7506H13.4416V21.0161L23 10.5144Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-link"}" viewBox="${"0 0 26 26"}">
            <path d="${"M18.4167 20.6003H16.25C15.6519 20.6003 15.1667 20.1159 15.1667 19.5169C15.1667 18.9178 15.6519 18.4336 16.25 18.4336H18.4167C21.4035 18.4336 23.8333 16.0036 23.8333 13.0169C23.8333 10.0301 21.4035 7.60033 18.4167 7.60033H16.25C15.6519 7.60033 15.1667 7.11592 15.1667 6.51686C15.1667 5.9178 15.6519 5.43359 16.25 5.43359H18.4167C22.5983 5.43359 26 8.83633 26 13.0169C26 17.1976 22.5983 20.6003 18.4167 20.6003Z"}" stroke="${"none"}"></path>
            <path d="${"M9.75 20.6003H7.58327C3.40175 20.6003 0 17.1976 0 13.0169C0 8.83633 3.40175 5.43359 7.58327 5.43359H9.75C10.3481 5.43359 10.8333 5.9178 10.8333 6.51686C10.8333 7.11592 10.3481 7.60033 9.75 7.60033H7.58327C4.5965 7.60033 2.16673 10.0301 2.16673 13.0169C2.16673 16.0036 4.5965 18.4336 7.58327 18.4336H9.75C10.3481 18.4336 10.8333 18.9178 10.8333 19.5169C10.8333 20.1159 10.3481 20.6003 9.75 20.6003Z"}" stroke="${"none"}"></path>
            <path d="${"M16.25 14.1003H9.75002C9.15195 14.1003 8.66675 13.6159 8.66675 13.0169C8.66675 12.4178 9.15195 11.9336 9.75002 11.9336H16.25C16.8481 11.9336 17.3333 12.4178 17.3333 13.0169C17.3333 13.6159 16.8481 14.1003 16.25 14.1003Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-send"}" viewBox="${"0 0 22 22"}">
            <path d="${"M21.5443 10.2858L1.11621 0.857462C0.790936 0.709751 0.402802 0.797749 0.176522 1.07746C-0.0513293 1.35716 -0.0591863 1.75473 0.157666 2.04229L6.87536 10.9992L0.157666 19.9561C-0.0591863 20.2437 -0.0513293 20.6428 0.174951 20.921C0.327376 21.1111 0.555227 21.2132 0.786222 21.2132C0.89779 21.2132 1.00936 21.1897 1.11464 21.141L21.5427 11.7126C21.8224 11.5838 22 11.3056 22 10.9992C22 10.6928 21.8224 10.4147 21.5443 10.2858Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-coin"}" viewBox="${"0 0 32 33"}">
            <path d="${"M27.1357 5.2002L27.3137 5.02468L27.1357 5.2002C30.1112 8.21822 31.75 12.2304 31.75 16.5001C31.75 20.7698 30.1112 24.7819 27.1357 27.7999C24.1603 30.8178 20.2064 32.4786 16 32.4786C11.7937 32.4786 7.83974 30.8178 4.86434 27.7999C1.88876 24.7819 0.25 20.7698 0.25 16.5001C0.25 12.2304 1.88882 8.21822 4.86434 5.2002C7.83974 2.18236 11.7937 0.521484 16 0.521484C20.2064 0.521484 24.1603 2.18236 27.1357 5.2002ZM17.1875 9.18815V7.33351C17.1875 6.67366 16.6592 6.13262 16 6.13262C15.3409 6.13262 14.8125 6.67364 14.8125 7.33351V9.19215C12.5782 9.28975 10.7959 11.1628 10.7959 13.4446C10.7959 15.7884 12.6764 17.7009 14.9958 17.7009H17.0042C18.007 17.7009 18.8293 18.5298 18.8293 19.5556C18.8293 20.5814 18.007 21.4102 17.0043 21.4102H12.9876C12.3285 21.4102 11.8001 21.9513 11.8001 22.6111C11.8001 23.271 12.3285 23.812 12.9876 23.812H14.8125V25.6667C14.8125 26.3266 15.3409 26.8676 16 26.8676C16.6592 26.8676 17.1875 26.3266 17.1875 25.6667V23.808C19.4219 23.7105 21.2042 21.8374 21.2042 19.5556C21.2042 17.2118 19.3237 15.2992 17.0042 15.2992H14.9958C13.9931 15.2992 13.1709 14.4703 13.1709 13.4446C13.1709 12.4188 13.993 11.5899 14.9958 11.5899H19.0126C19.6716 11.5899 20.2001 11.0489 20.2001 10.389C20.2001 9.72917 19.6716 9.18815 19.0126 9.18815H17.1875Z"}" stroke="${"none"}"></path>
        </svg>

        
        <svg id="${"ico-location-mark"}" viewBox="${"0 0 512 512"}">
            <path d="${"m256,36.082c-84.553,0 -153.105,68.554 -153.105,153.106c0,113.559 153.105,286.73 153.105,286.73s153.106,-173.172 153.106,-286.73c0,-84.552 -68.554,-153.106 -153.106,-153.106zm0,217.705c-35.682,0 -64.6,-28.917 -64.6,-64.6s28.918,-64.6 64.6,-64.6s64.6,28.917 64.6,64.6s-28.918,64.6 -64.6,64.6z"}"></path>
        </svg>

        
        <svg id="${"ico-telegram"}" viewBox="${"0 0 40 40"}">
            <path stroke="${"none"}" fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M20 40C31.0457 40 40 31.0457 40 20C40 8.95431 31.0457 0 20 0C8.95431 0 0 8.95431 0 20C0 31.0457 8.95431 40 20 40ZM16.3334 29.1667C16.8198 29.1667 17.0421 28.9503 17.3108 28.6887L17.3334 28.6667L19.7357 26.3308L24.7334 30.0232C25.6531 30.5306 26.3169 30.2679 26.546 29.1692L29.8269 13.7087C30.1628 12.362 29.3135 11.7512 28.4336 12.1507L9.16864 19.5792C7.85363 20.1067 7.86129 20.8403 8.92894 21.1672L13.8728 22.7103L25.3183 15.4894C25.8586 15.1618 26.3545 15.3379 25.9475 15.6992L16.6738 24.0679L16.6737 24.0679L16.6737 24.068L16.6734 24.0683L16.6737 24.0685L16.3334 29.1667Z"}"></path>
        </svg>
    
        
        <svg id="${"ico-viber"}" viewBox="${"0 0 40 40"}">
            <path stroke="${"none"}" fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M20 0C31.0457 0 40 8.9543 40 20C40 31.0457 31.0457 40 20 40C8.9543 40 0 31.0457 0 20C0 8.9543 8.9543 0 20 0ZM21.1978 8.14674C22.5578 8.31647 23.6567 8.64408 24.8625 9.23221C26.0484 9.81249 26.8074 10.3611 27.8116 11.3598C28.7524 12.3032 29.2743 13.0176 29.8277 14.1268C30.5986 15.6741 31.0374 17.5135 31.1125 19.5384C31.1402 20.2292 31.1204 20.3832 30.9623 20.5805C30.6619 20.9634 30.0016 20.9002 29.7763 20.47C29.7051 20.3279 29.6854 20.2056 29.6617 19.6529C29.6221 18.8043 29.5629 18.2556 29.4443 17.6003C28.9778 15.0307 27.7444 12.9782 25.7756 11.5058C24.1351 10.2743 22.4391 9.6743 20.2175 9.54405C19.4663 9.50064 19.3359 9.47303 19.1659 9.34276C18.8496 9.09407 18.8338 8.5099 19.1382 8.23755C19.324 8.06778 19.4545 8.04411 20.0989 8.06385C20.4349 8.07569 20.929 8.11516 21.1978 8.14674V8.14674ZM12.1606 8.57303C12.299 8.62038 12.5124 8.73088 12.635 8.80984C13.3861 9.30722 15.4773 11.9795 16.1613 13.3137C16.5526 14.0754 16.6831 14.6399 16.5606 15.0583C16.434 15.5083 16.2245 15.7452 15.2876 16.4991C14.912 16.803 14.5602 17.1148 14.5049 17.1977C14.3625 17.403 14.2479 17.8056 14.2479 18.0898C14.2519 18.749 14.6788 19.945 15.2402 20.8647C15.675 21.5792 16.4538 22.4949 17.2247 23.1975C18.1299 24.0265 18.9285 24.5909 19.8298 25.037C20.9881 25.6132 21.6958 25.7593 22.2137 25.5185C22.3441 25.4593 22.4824 25.3803 22.526 25.3449C22.5654 25.3093 22.8699 24.9382 23.202 24.5278C23.8423 23.7225 23.9886 23.5923 24.4274 23.4423C24.9849 23.2528 25.5541 23.3041 26.1273 23.5962C26.5622 23.8212 27.5109 24.4093 28.1237 24.8356C28.9301 25.4001 30.6537 26.8053 30.887 27.0856C31.2981 27.5908 31.3693 28.2381 31.0925 28.9526C30.8 29.7065 29.6615 31.1197 28.8669 31.7236C28.1474 32.2683 27.6374 32.4775 26.9654 32.5091C26.412 32.5367 26.1827 32.4893 25.475 32.1972C19.9247 29.9118 15.4932 26.5014 11.9748 21.816C10.1366 19.3687 8.7371 16.8306 7.78038 14.1978C7.22302 12.6624 7.19537 11.9953 7.65388 11.2098C7.85159 10.8782 8.69362 10.0572 9.30635 9.59933C10.3263 8.84144 10.7967 8.56117 11.1723 8.48225C11.4292 8.42698 11.8759 8.47039 12.1606 8.57303V8.57303ZM21.4706 11.0085C23.8703 11.3598 25.7282 12.4729 26.9458 14.2808C27.6298 15.2991 28.0567 16.4951 28.203 17.778C28.2543 18.2477 28.2543 19.1043 28.199 19.2464C28.1476 19.3806 27.9816 19.5622 27.8392 19.6371C27.6851 19.7161 27.357 19.7082 27.1751 19.6135C26.8707 19.4595 26.7798 19.2148 26.7798 18.5517C26.7798 17.5293 26.5149 16.4517 26.0564 15.6149C25.5346 14.6597 24.7756 13.8702 23.8505 13.3216C23.0559 12.8479 21.8818 12.4966 20.8105 12.4098C20.423 12.3782 20.2095 12.2992 20.0633 12.1295C19.838 11.8729 19.8142 11.5256 20.004 11.2374C20.2095 10.9177 20.5258 10.8664 21.4706 11.0085V11.0085ZM22.3128 13.9886C23.0916 14.1544 23.6886 14.4505 24.1985 14.9281C24.8547 15.5478 25.2145 16.2978 25.3726 17.3754C25.4794 18.078 25.4359 18.3543 25.1868 18.5832C24.9536 18.7964 24.5227 18.8043 24.2618 18.603C24.072 18.4608 24.0127 18.3109 23.9692 17.9043C23.9179 17.3635 23.823 16.9846 23.6609 16.6333C23.313 15.8873 22.7003 15.5004 21.6646 15.3741C21.1782 15.3149 21.032 15.2596 20.8739 15.0741C20.5853 14.7307 20.6959 14.1742 21.0952 13.9689C21.2455 13.8939 21.3088 13.886 21.6408 13.9057C21.8464 13.9176 22.1508 13.9531 22.3128 13.9886V13.9886Z"}"></path>
        </svg>

        
        <svg id="${"ico-facebook"}" viewBox="${"0 0 40 40"}">
            <path stroke="${"none"}" fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0ZM22.0845 20.8785V31.7596H17.5824V20.8789H15.3332V17.1293H17.5824V14.878C17.5824 11.819 18.8524 10 22.4608 10H25.4649V13.7501H23.5871C22.1825 13.7501 22.0896 14.2741 22.0896 15.2521L22.0845 17.1288H25.4861L25.0881 20.8785H22.0845Z"}"></path>
        </svg>

        
        <svg id="${"ico-phone-filled"}" viewBox="${"0 0 26 26"}">
            <path stroke="${"none"}" fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M13 0C5.8203 0 0 5.8203 0 13C0 20.1797 5.8203 26 13 26C20.1797 26 26 20.1797 26 13C26 5.8203 20.1797 0 13 0ZM9.57358 6.69633C9.48603 6.55174 9.35072 6.51327 9.19286 6.52653C9.16235 6.53051 9.13184 6.53051 9.09337 6.5C9.00553 6.52039 8.91757 6.5402 8.8296 6.56002C8.61999 6.60723 8.4103 6.65447 8.20192 6.7096C7.83314 6.80909 7.54793 7.03195 7.31977 7.33573C7.02925 7.72706 6.8369 8.16482 6.68302 8.62249C6.5119 9.12923 6.45485 9.64393 6.5371 10.1785C6.60873 10.6508 6.76792 11.0925 6.92976 11.5382C7.1964 12.2771 7.49089 13.0014 7.90345 13.674C8.53621 14.71 9.31888 15.6201 10.1957 16.4545C10.8882 17.1111 11.6364 17.6988 12.4588 18.1856C13.3649 18.7202 14.3492 19.0731 15.3481 19.3808C15.8654 19.5427 16.404 19.5864 16.9439 19.4657C17.5382 19.3331 18.0967 19.1168 18.5968 18.7666C18.7772 18.638 18.9563 18.4788 19.0823 18.297C19.3834 17.8593 19.4697 17.3499 19.4988 16.8312C19.5095 16.6468 19.4471 16.5128 19.2919 16.4213C19.1874 16.3587 19.0832 16.295 18.9789 16.2312C18.7959 16.1194 18.6124 16.0073 18.4257 15.9C18.2446 15.7958 18.0599 15.6974 17.8752 15.599C17.5025 15.4004 17.1293 15.2016 16.7834 14.9541C16.7464 14.9274 16.703 14.907 16.66 14.8869C16.6475 14.881 16.6351 14.8752 16.6229 14.8692C16.4279 14.7711 16.2422 14.787 16.0724 14.9302C15.9888 14.9992 15.9026 15.0709 15.8309 15.1518C15.702 15.2968 15.5747 15.4423 15.4476 15.5877C15.2805 15.7788 15.1137 15.9696 14.9435 16.1586C14.6211 16.5181 14.4593 16.5579 14.0441 16.3231C13.6036 16.0737 13.1672 15.8124 12.748 15.5272C11.6602 14.791 10.7993 13.8358 10.1254 12.7122C9.9546 12.4267 9.79901 12.1353 9.64323 11.8435C9.63328 11.8249 9.62333 11.8063 9.61338 11.7876C9.50593 11.5847 9.54705 11.3923 9.70623 11.2384C9.8313 11.1183 9.96133 11.0025 10.0915 10.8867C10.1739 10.8134 10.2564 10.74 10.3377 10.6654C10.4031 10.6055 10.4691 10.546 10.5351 10.4865C10.7224 10.3178 10.91 10.1487 11.0845 9.97026C11.2503 9.80179 11.2556 9.58954 11.1442 9.37862L11.1358 9.36425C11.0841 9.27593 11.0311 9.18546 10.9757 9.09739C10.9528 9.06197 10.9282 9.02723 10.9037 8.99251C10.8603 8.931 10.8168 8.86951 10.7821 8.80422C10.6923 8.64316 10.6049 8.48091 10.5175 8.31877C10.3984 8.09766 10.2794 7.87677 10.1546 7.65941C9.98228 7.35875 9.80095 7.06485 9.61994 6.77148C9.60448 6.74643 9.58903 6.72138 9.57358 6.69633Z"}"></path>
        </svg>

        
        <svg id="${"ico-email"}" viewBox="${"0 0 26 26"}">
            <path stroke="${"none"}" fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M13 0C5.8203 0 0 5.8203 0 13C0 20.1797 5.8203 26 13 26C20.1797 26 26 20.1797 26 13C26 5.8203 20.1797 0 13 0ZM15.8656 9.97544C15.0425 9.15049 13.9217 8.62362 12.7296 8.62362C10.3738 8.62362 8.30118 10.7202 8.30118 13.0994C8.30118 15.4543 10.3738 17.5271 12.7296 17.5271C13.9217 17.5271 15.016 17.0511 15.8383 16.235L15.8506 16.6749C15.8393 18.0202 17.5934 18.9187 18.7742 17.996C21.3809 15.9629 21.5367 10.7366 18.8644 7.94566C16.308 5.27564 12.0684 4.74569 8.85265 6.65903C4.64917 9.16033 4.5647 13.9885 6.14962 16.7325C8.49553 20.7962 13.5172 20.8737 15.3215 20.1047C16.5156 19.5971 15.9845 18.0427 14.8348 18.5069C12.5643 19.423 8.744 18.5046 7.40898 15.4229C6.18427 12.5983 7.44507 9.59105 9.4154 8.23206C11.2689 6.95465 14.7538 6.5799 17.3513 8.85323C20.1381 11.2918 18.955 15.5002 17.9661 16.5166C17.7127 16.7749 17.2557 16.5669 17.2965 16.164L17.2936 10.0048C17.2936 9.83132 17.1749 9.28334 16.5958 9.28334L16.5023 9.28395C16.1321 9.28395 15.8656 9.58244 15.8656 9.97872V9.97544Z"}"></path>
            <path stroke="${"none"}" fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M15.6938 12.9286C15.605 11.2036 14.3249 10.1665 12.7788 10.1665H12.7205C10.9364 10.1665 9.94678 11.5696 9.94678 13.1633C9.94678 14.9481 11.144 16.0752 12.7136 16.0752C14.4637 16.0752 15.6146 14.7933 15.6979 13.2771L15.6938 12.9286Z"}"></path>
        </svg>

        
        <svg id="${"ico-location-mark-filled"}" viewBox="${"0 0 26 26"}">
            <path stroke="${"none"}" fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M26 13C26 20.1797 20.1797 26 13 26C5.8203 26 0 20.1797 0 13C0 5.8203 5.8203 0 13 0C20.1797 0 26 5.8203 26 13ZM13.015 20.8C13.015 20.8 9.52516 15.5808 8.28982 12.6792C7.97559 12.0028 7.8 11.2478 7.8 10.4513C7.8 7.55108 10.1281 5.2 13 5.2C15.8719 5.2 18.2 7.55108 18.2 10.4513C18.2 11.0895 18.0873 11.7011 17.8808 12.2669H17.8863C17.0585 14.4684 13.015 20.8 13.015 20.8Z"}"></path>
            <path stroke="${"none"}" fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M13.0001 13.4334C14.6754 13.4334 16.0335 12.0753 16.0335 10.4C16.0335 8.72477 14.6754 7.3667 13.0001 7.3667C11.3249 7.3667 9.9668 8.72477 9.9668 10.4C9.9668 12.0753 11.3249 13.4334 13.0001 13.4334V13.4334Z"}"></path>
        </svg>

        
        <svg id="${"ico-edit"}" viewBox="${"0 0 19 20"}">
            <path stroke="${"none"}" d="${"M11.7903 3.71468L15.6473 7.5717L5.88407 17.335L2.02921 13.4779L11.7903 3.71468ZM18.5741 2.78446L16.854 1.06436C16.1892 0.399606 15.1098 0.399606 14.4428 1.06436L12.7951 2.71204L16.6522 6.5691L18.5741 4.64717C19.0897 4.13154 19.0897 3.30005 18.5741 2.78446ZM0.0107333 18.8993C-0.0594602 19.2152 0.225759 19.4983 0.541701 19.4214L4.83974 18.3793L0.984873 14.5223L0.0107333 18.8993Z"}"></path>
        </svg>
    </svg>
</section>`;
});

/* src/routes/_layout.svelte generated by Svelte v3.18.1 */

const Layout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	let theme = safeGet(() => cookieStorage.get("theme") || localStorage.get("theme"));

	onMount(() => {
		disableDoubleTapZoom([document]);
	});

	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);

	return `${validate_component(Icons, "Icons").$$render($$result, {}, {}, {})}

<main id="${"main"}"${add_attribute("class", theme, 0)}>
	${validate_component(Header, "Header").$$render($$result, { segment }, {}, {})}

	${$$slots.default ? $$slots.default({}) : ``}

	${validate_component(OfflineMessage, "OfflineMessage").$$render($$result, {}, {}, {})}
</main>`;
});

/* src/routes/_error.svelte generated by Svelte v3.18.1 */

const Error$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { status } = $$props;
	let { error } = $$props;
	if ($$props.status === void 0 && $$bindings.status && status !== void 0) $$bindings.status(status);
	if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);

	return `${($$result.head += `${($$result.title = `<title>Error: ${escape(status)}</title>`, "")}`, "")}

<br>
<br>
<br>
<br>
<div class="${"text-center"}">
	<h1>ой 🙃</h1>
</div>
<div hidden class="${"text-center"}">
	<h1>Error: ${escape(status)}</h1>
	<br>
	<p>Reason: ${escape(error.message)}</p>
</div>
<br>
<br>`;
});

/* src/node_modules/@sapper/internal/App.svelte generated by Svelte v3.18.1 */

const App = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { stores } = $$props;
	let { error } = $$props;
	let { status } = $$props;
	let { segments } = $$props;
	let { level0 } = $$props;
	let { level1 = null } = $$props;
	setContext(CONTEXT_KEY, stores);
	if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0) $$bindings.stores(stores);
	if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);
	if ($$props.status === void 0 && $$bindings.status && status !== void 0) $$bindings.status(status);
	if ($$props.segments === void 0 && $$bindings.segments && segments !== void 0) $$bindings.segments(segments);
	if ($$props.level0 === void 0 && $$bindings.level0 && level0 !== void 0) $$bindings.level0(level0);
	if ($$props.level1 === void 0 && $$bindings.level1 && level1 !== void 0) $$bindings.level1(level1);

	return `


${validate_component(Layout, "Layout").$$render($$result, Object.assign({ segment: segments[0] }, level0.props), {}, {
		default: () => `
	${error
		? `${validate_component(Error$1, "Error").$$render($$result, { error, status }, {}, {})}`
		: `${validate_component(level1.component || missing_component, "svelte:component").$$render($$result, Object.assign(level1.props), {}, {})}`}
`
	})}`;
});

const initial_data = typeof __SAPPER__ !== 'undefined' && __SAPPER__;

const stores = {
	page: writable({}),
	preloading: writable(null),
	session: writable(initial_data && initial_data.session)
};

stores.session.subscribe(async value => {

	return;
});

const stores$1 = () => getContext(CONTEXT_KEY);

/* src/routes/organizations/_OrganizationButton.svelte generated by Svelte v3.18.1 */

const OrganizationButton = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { id = null } = $$props;
	let { src = null } = $$props;
	let { title = null } = $$props;
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);

	return `${validate_component(Button, "Button").$$render(
		$$result,
		{
			rel: "prefetch",
			href: id,
			class: "white"
		},
		{},
		{
			default: () => `
  <div class="${"flex flex-align-center flex-justify-between full-width"}">

    <div class="${"flex flex-align-center"}">
      <s></s>
      <div class="${"flex"}" style="${"max-width: 45px; height: 40px; overflow: hidden"}">
        ${validate_component(Picture, "Picture").$$render(
				$$result,
				{
					src,
					size: "contain",
					alt: "якесь фото організації"
				},
				{},
				{}
			)}
      </div>
      <s></s>
      ${title !== null
			? `<s></s>
        <s></s>
        <h3>${escape(title)}</h3>`
			: `<span>${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</span>`}
    </div>
    
  </div>
`
		}
	)}`;
});

/* src/routes/organizations/_TopCarousel.svelte generated by Svelte v3.18.1 */

const TopCarousel = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<section class="${"flex"}" style="${"height: 240px"}">
    ${validate_component(Carousel, "Carousel").$$render($$result, { items, dotsBelow: false }, {}, {})}
</section>`;
});

/* src/routes/organizations/_DescriptionShort.svelte generated by Svelte v3.18.1 */

const DescriptionShort = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title } = $$props;
	let { text } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);

	return `${title
	? `<h2>${escape(title)}</h2>`
	: `<div style="${"width: 85%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}  </div>`}
${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

${text
	? `<pre class="${"font-w-300"}">
    ${escape(text)}
</pre>`
	: `${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    <div style="${"width: 60%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}</div>`}`;
});

/* src/routes/organizations/_InteractionIndicators.svelte generated by Svelte v3.18.1 */

const InteractionIndicators = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { likes = null } = $$props;
	let { views = null } = $$props;
	let { isLiked = false } = $$props;
	if ($$props.likes === void 0 && $$bindings.likes && likes !== void 0) $$bindings.likes(likes);
	if ($$props.views === void 0 && $$bindings.views && views !== void 0) $$bindings.views(views);
	if ($$props.isLiked === void 0 && $$bindings.isLiked && isLiked !== void 0) $$bindings.isLiked(isLiked);

	return `<p class="${"container flex flex-justify-between flex-align-center"}">
  ${validate_component(Button, "Button").$$render(
		$$result,
		{
			class: "flex flex-align-center",
			auto: true,
			size: "small",
			style: `opacity: ${isLiked ? 1 : 0.5}`
		},
		{},
		{
			default: () => `
    ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					is: "danger",
					type: "heart-filled",
					size: "medium"
				},
				{},
				{}
			)}
    <s></s>
    <s></s>
    ${likes !== null
			? `<span class="${"font-secondary font-w-600 h3"}">${escape(likes)}</span>`
			: `<span class="${"font-secondary font-w-600 h3 relative"}">
        <span style="${"visibility: hidden"}">199</span>
        ${validate_component(Loader, "Loader").$$render($$result, { type: "h3", absolute: true }, {}, {})}
      </span>`}
  `
		}
	)}

  <span class="${"flex"}">
    ${validate_component(Button, "Button").$$render(
		$$result,
		{
			class: "flex flex-align-center",
			auto: true,
			size: "small"
		},
		{},
		{
			default: () => `
      ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					type: "share",
					size: "medium",
					class: "theme-svg-fill"
				},
				{},
				{}
			)}
      <s></s>
      <s></s>
      <h3 class="${"font-w-600"}">Поділитись</h3>
    `
		}
	)}
  </span>
  <span class="${"flex flex-align-center"}">
    ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			type: "eye",
			size: "medium",
			class: "theme-svg-fill"
		},
		{},
		{}
	)}
    <s></s>
    <s></s>
    ${views !== null
	? `<span class="${"font-secondary font-w-600 h3"}">${escape(views)}</span>`
	: `<span class="${"font-secondary font-w-600 h3 relative"}">
        <span style="${"visibility: hidden"}">199</span>
        ${validate_component(Loader, "Loader").$$render($$result, { type: "h3", absolute: true }, {}, {})}
      </span>`}
  </span>
</p>`;
});

/* src/routes/organizations/_FundList.svelte generated by Svelte v3.18.1 */

const FundList = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title } = $$props;
	let { items } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>${escape(title)}</h1>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(FundCards, "FundCards").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/organizations/_Description.svelte generated by Svelte v3.18.1 */

const Description = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = null } = $$props;
	let { text = null } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);

	return `${title !== null
	? `<h1>${escape(title)}</h1>`
	: `<div style="${"width: 85%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h1" }, {}, {})}  </div>`}
${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

${text !== null
	? `<pre class="${"font-w-300"}">
    ${escape(text)}
</pre>`
	: `${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    <div style="${"width: 60%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}</div>`}`;
});

/* src/routes/organizations/_Share.svelte generated by Svelte v3.18.1 */

const Share = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<p class="${"flex"}">
  ${validate_component(Button, "Button").$$render(
		$$result,
		{
			class: "flex flex-align-center",
			auto: true,
			size: "small"
		},
		{},
		{
			default: () => `
    ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					type: "share",
					size: "medium",
					class: "theme-svg-fill"
				},
				{},
				{}
			)}
    <s></s>
    <s></s>
    <p class="${"font-w-500"}">Поділитись</p>
  `
		}
	)}
  <s></s>
  <s></s>
  <s></s>
  <s></s>
  <s></s>
  ${validate_component(Button, "Button").$$render(
		$$result,
		{
			class: "flex flex-align-center",
			auto: true,
			size: "small"
		},
		{},
		{
			default: () => `
    ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					type: "link",
					size: "medium",
					class: "theme-svg-fill"
				},
				{},
				{}
			)}
    <s></s>
    <s></s>
    <p class="${"font-w-500"}">Скопіювати</p>
  `
		}
	)}
</p>`;
});

/* src/routes/organizations/_Trust.svelte generated by Svelte v3.18.1 */

const Trust = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { active = false } = $$props;
	if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);

	return `<section class="${"flex flex-column flex-align-center flex-justify-center"}">
    <div style="${"width: 100px; max-width: 100%"}">
        ${validate_component(TrustButton, "TrustButton").$$render($$result, { isActive: active }, {}, {})}
    </div>
    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
    <h2>Я довіряю</h2>
</section>`;
});

/* src/routes/organizations/_Donators.svelte generated by Svelte v3.18.1 */

const Donators = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Наші піклувальники</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(DonatorsList, "DonatorsList").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/organizations/_LastNews.svelte generated by Svelte v3.18.1 */

const LastNews = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	let { carousel = [] } = $$props;
	let { iconsLine = {} } = $$props;
	let { organization = {} } = $$props;
	let { descriptionShort = {} } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.carousel === void 0 && $$bindings.carousel && carousel !== void 0) $$bindings.carousel(carousel);
	if ($$props.iconsLine === void 0 && $$bindings.iconsLine && iconsLine !== void 0) $$bindings.iconsLine(iconsLine);
	if ($$props.organization === void 0 && $$bindings.organization && organization !== void 0) $$bindings.organization(organization);
	if ($$props.descriptionShort === void 0 && $$bindings.descriptionShort && descriptionShort !== void 0) $$bindings.descriptionShort(descriptionShort);

	return `<h1>Останні новини</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
${validate_component(NewsList, "NewsList").$$render($$result, { items }, {}, {})}

${validate_component(Modal, "Modal").$$render(
		$$result,
		{
			id: "last-news",
			size: "full",
			swipe: "all"
		},
		{},
		{
			default: () => `
    <section class="${"container flex flex-column relative"}">
        ${validate_component(Br, "Br").$$render($$result, {}, {}, {})}

        ${descriptionShort.title !== null
			? `<h1>${escape(descriptionShort.title)}</h1>`
			: `${validate_component(Loader, "Loader").$$render($$result, { type: "h1" }, {}, {})}`}
        ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
        ${descriptionShort.title !== null
			? `<p>${escape(descriptionShort.title)}</p>`
			: `<div style="${"width: 40%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</div>`}
        ${validate_component(Br, "Br").$$render($$result, { size: "25" }, {}, {})}
        
        <section class="${"flex"}" style="${"height: 240px"}">
            ${validate_component(Carousel, "Carousel").$$render($$result, { items: carousel, stopPropagation: true }, {}, {})}
        </section>

        ${validate_component(Br, "Br").$$render($$result, { size: "25" }, {}, {})}
        ${validate_component(DescriptionShort, "DescriptionShort").$$render(
				$$result,
				{
					text: descriptionShort.text,
					title: descriptionShort.title
				},
				{},
				{}
			)}
        ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

        ${validate_component(InteractionIndicators, "InteractionIndicators").$$render(
				$$result,
				{
					likes: iconsLine.likes,
					views: iconsLine.views,
					isLiked: organization.isLiked
				},
				{},
				{}
			)}
        ${validate_component(Br, "Br").$$render($$result, { size: "50" }, {}, {})}

        ${validate_component(Trust, "Trust").$$render($$result, { active: organization.isLiked }, {}, {})}

        ${validate_component(Br, "Br").$$render($$result, {}, {}, {})}
    </section>
`
		}
	)}`;
});

/* src/routes/organizations/_Certificates.svelte generated by Svelte v3.18.1 */

const Certificates = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Сертифікати</h1>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(Documents, "Documents").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/organizations/_Videos.svelte generated by Svelte v3.18.1 */

const Videos = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Відео про нас</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<section class="${"flex"}" style="${"height: 240px"}">
    ${validate_component(Carousel, "Carousel").$$render($$result, { items }, {}, {})}
</section>`;
});

/* src/routes/organizations/_ContactsCard.svelte generated by Svelte v3.18.1 */

const ContactsCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = null } = $$props;
	let { orgName = null } = $$props;
	let { avatar = null } = $$props;
	let { avatarBig = null } = $$props;
	const top = ["telegram", "facebook", "viber"];
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.orgName === void 0 && $$bindings.orgName && orgName !== void 0) $$bindings.orgName(orgName);
	if ($$props.avatar === void 0 && $$bindings.avatar && avatar !== void 0) $$bindings.avatar(avatar);
	if ($$props.avatarBig === void 0 && $$bindings.avatarBig && avatarBig !== void 0) $$bindings.avatarBig(avatarBig);

	let topItems = items === null
	? undefined
	: items.filter(i => !top.includes(i.type));

	let bottomItems = items === null
	? undefined
	: items.filter(i => top.includes(i.type));

	return `${validate_component(Card, "Card").$$render($$result, {}, {}, {
		default: () => `
    <section style="${"padding: 0 20px"}">
        ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}

        <div class="${"flex flex-column flex-align-center"}">
            
            <span>
                ${validate_component(FancyBox, "FancyBox").$$render($$result, { class: "flex-justify-center" }, {}, {
			box: () => `<section slot="${"box"}" class="${"flex full-width full-height"}" style="${"height: 100vw"}">
                        <div class="${"flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch"}" style="${"padding: var(--screen-padding) 0"}">
                            ${validate_component(Avatar, "Avatar").$$render(
				$$result,
				{
					src: avatar,
					srcBig: avatarBig,
					alt: "ava"
				},
				{},
				{}
			)}
                        </div>
                    </section>`,
			default: () => `
                    ${validate_component(Avatar, "Avatar").$$render(
				$$result,
				{
					size: "big",
					src: avatar,
					alt: "Організація"
				},
				{},
				{}
			)}
                    
                `
		})}
            </span>

            ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
            <h2>Наші контакти</h2>
            ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}

            ${orgName !== null
		? `<p class="${"h3 font-secondary font-w-500"}" style="${"opacity: .7"}">
                    ${escape(orgName)}
                </p>`
		: `<p style="${"width: 60%"}">
                    ${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}
                </p>`}
        </div>

        ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}

        ${validate_component(SocialsY, "SocialsY").$$render($$result, { items: topItems }, {}, {})}   

        ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}

        ${validate_component(SocialsX, "SocialsX").$$render($$result, { items: bottomItems }, {}, {})}

        ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
    </section>
`
	})}`;
});

/* src/routes/organizations/_VirtualTour.svelte generated by Svelte v3.18.1 */

const css$B = {
	code: "div.svelte-1ep59z6{background-color:rgba(var(--theme-bg-color-opposite), .04)}",
	map: "{\"version\":3,\"file\":\"_VirtualTour.svelte\",\"sources\":[\"_VirtualTour.svelte\"],\"sourcesContent\":[\"<script>\\n  import { Br } from \\\"@components\\\";\\n\\n  export let src\\n</script>\\n\\n<h1>3D - Тур 360°</h1>\\n<Br size=\\\"20\\\" />\\n<div class=\\\"full-container\\\">\\n  <iframe\\n    {src}\\n    title=\\\"360 тур\\\"\\n    width=\\\"100%\\\"\\n    height=\\\"450\\\"\\n    frameborder=\\\"0\\\"\\n    style=\\\"border:0;\\\"\\n    allowfullscreen=\\\"\\\"\\n    aria-hidden=\\\"false\\\"\\n    tabindex=\\\"0\\\" ></iframe>\\n</div>\\n\\n<style>\\n    div {\\n        background-color: rgba(var(--theme-bg-color-opposite), .04);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvb3JnYW5pemF0aW9ucy9fVmlydHVhbFRvdXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLDJEQUEyRDtJQUMvRCIsImZpbGUiOiJzcmMvcm91dGVzL29yZ2FuaXphdGlvbnMvX1ZpcnR1YWxUb3VyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIGRpdiB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3Itb3Bwb3NpdGUpLCAuMDQpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAsBI,GAAG,eAAC,CAAC,AACD,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC/D,CAAC\"}"
};

const VirtualTour = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	$$result.css.add(css$B);

	return `<h1>3D - Тур 360°</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<div class="${"full-container svelte-1ep59z6"}">
  <iframe${add_attribute("src", src, 0)} title="${"360 тур"}" width="${"100%"}" height="${"450"}" frameborder="${"0"}" style="${"border:0;"}" allowfullscreen="${""}" aria-hidden="${"false"}" tabindex="${"0"}"></iframe>
</div>`;
});

/* src/routes/organizations/_WeOnMap.svelte generated by Svelte v3.18.1 */

const css$C = {
	code: "div.svelte-151uyyh{background-color:rgba(var(--theme-bg-color-opposite), .04)}",
	map: "{\"version\":3,\"file\":\"_WeOnMap.svelte\",\"sources\":[\"_WeOnMap.svelte\"],\"sourcesContent\":[\"<script>\\n  import { Br } from \\\"@components\\\";\\n  \\n  export let src\\n</script>\\n\\n<h1>Ми на карті</h1>\\n<Br size=\\\"20\\\" />\\n<div class=\\\"full-container\\\">\\n  <iframe\\n    {src}\\n    title=\\\"Карта\\\"\\n    width=\\\"100%\\\"\\n    height=\\\"450\\\"\\n    frameborder=\\\"0\\\"\\n    style=\\\"border:0;\\\"\\n    allowfullscreen=\\\"\\\"\\n    aria-hidden=\\\"false\\\"\\n    tabindex=\\\"0\\\" ></iframe>\\n</div>\\n\\n<style>\\n    div {\\n        background-color: rgba(var(--theme-bg-color-opposite), .04);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvb3JnYW5pemF0aW9ucy9fV2VPbk1hcC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksMkRBQTJEO0lBQy9EIiwiZmlsZSI6InNyYy9yb3V0ZXMvb3JnYW5pemF0aW9ucy9fV2VPbk1hcC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBkaXYge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yLW9wcG9zaXRlKSwgLjA0KTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAsBI,GAAG,eAAC,CAAC,AACD,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC/D,CAAC\"}"
};

const WeOnMap = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	$$result.css.add(css$C);

	return `<h1>Ми на карті</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<div class="${"full-container svelte-151uyyh"}">
  <iframe${add_attribute("src", src, 0)} title="${"Карта"}" width="${"100%"}" height="${"450"}" frameborder="${"0"}" style="${"border:0;"}" allowfullscreen="${""}" aria-hidden="${"false"}" tabindex="${"0"}"></iframe>
</div>`;
});

/* src/routes/organizations/_Comments.svelte generated by Svelte v3.18.1 */

const Comments_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Коментарі</h1>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<div class="${"full-container"}">
  ${validate_component(Comments, "Comments").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/organizations/[id].svelte generated by Svelte v3.18.1 */

const U5Bidu5D = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $page;
	const { page } = stores$1();
	$page = get_store_value(page);

	// Organization
	let organizationId = $page.params.id;

	// Entities
	let organization = {};

	let comments;
	let funds;

	onMount(async () => {
		await delay(20000);
		organization = await API.getOrganization(1);
		comments = await API.getComments();
		funds = await API.getFunds();
	});

	$page = get_store_value(page);

	let organizationBlock = {
		id: organization.id,
		name: organization.title,
		avatar: organization.avatar
	};

	let carouselTop = (organization.avatars || []).map((a, i) => ({
		src: a.src,
		srcBig: a.src2x,
		alt: a.title
	}));

	let descriptionShort = {
		title: organization.title || null,
		text: organization.subtitle || null
	};

	let animalFunds = safeGet(() => funds.filter(f => f.type === "animal").reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
		id: f.id,
		src: f.avatars[0].src,
		type: f.type,
		title: f.title,
		total: f.need_sum,
		current: f.curremt_sum,
		currency: f.currency,
		city: f.location.city
	})));

	let othersFunds = safeGet(() => funds.filter(f => f.type === "animal").reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
		id: f.id,
		src: f.avatars[0].src,
		type: f.type,
		title: f.title,
		total: f.need_sum,
		current: f.curremt_sum,
		currency: f.currency,
		city: f.location.city
	})));

	let iconsLine = {
		likes: organization.likes,
		isLiked: organization.is_liked,
		views: organization.views
	};

	let descriptionBlock = {
		title: organization.title,
		text: organization.description
	};

	let contacts = safeGet(
		() => organization.contacts.map(c => ({
			title: c.title,
			href: c.value,
			type: c.type
		})),
		[].true
	);

	let donators = safeGet(() => organization.donators.map(d => ({
		id: d.id,
		src: d.avatar,
		title: `${d.currency} ${d.amount}`,
		subtitle: d.name,
		checked: d.checked
	})));

	let lastNews = safeGet(() => organization.news.map(n => ({
		id: n.id,
		src: n.src,
		likes: n.likes,
		isLiked: n.is_liked,
		title: n.title,
		subtitle: n.subtitle,
		created_at: n.created_at
	})).slice(0, 3));

	let documents = safeGet(() => organization.documents.map(d => ({
		id: d.id,
		alt: d.title,
		src: d.src,
		src2x: d.src2x
	})));

	let media = safeGet(
		() => organization.media.map(d => ({
			id: d.id,
			alt: d.title,
			src: d.src,
			srcBig: d.src2x,
			description: d.description
		})),
		[],
		true
	);

	let location = {
		map: safeGet(() => organization.location.map),
		virtual_tour: safeGet(() => organization.location.virtual_tour)
	};

	let commentsData = {
		comments: safeGet(() => comments.map(c => ({
			likes: c.likes,
			avatar: c["author.avatar"],
			author: c["author.name"],
			comment: c.comment,
			checked: c.checked,
			reply_to: c.reply_to,
			created_at: c.created_at
		})))
	};

	return `${($$result.head += `${($$result.title = `<title>Charitify - Organization page.</title>`, "")}`, "")}

<section class="${"container theme-bg-color-secondary"}">
    ${validate_component(Br, "Br").$$render($$result, { size: "var(--header-height)" }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}

    ${validate_component(OrganizationButton, "OrganizationButton").$$render(
		$$result,
		{
			id: organizationBlock.id,
			src: organizationBlock.avatar,
			title: organizationBlock.name
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}

    ${validate_component(TopCarousel, "TopCarousel").$$render($$result, { items: carouselTop }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(DescriptionShort, "DescriptionShort").$$render(
		$$result,
		{
			title: descriptionShort.title,
			text: descriptionShort.text
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

    ${validate_component(InteractionIndicators, "InteractionIndicators").$$render(
		$$result,
		{
			likes: iconsLine.likes,
			views: iconsLine.views,
			isLiked: organization.isLiked
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "50" }, {}, {})}

    ${validate_component(FundList, "FundList").$$render(
		$$result,
		{
			title: "Фонди тварин",
			items: animalFunds
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "45" }, {}, {})}

    ${validate_component(FundList, "FundList").$$render($$result, { title: "Інші фонди", items: othersFunds }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "45" }, {}, {})}

    ${validate_component(Description, "Description").$$render(
		$$result,
		{
			title: descriptionBlock.title,
			text: descriptionBlock.text
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

    ${validate_component(Share, "Share").$$render($$result, {}, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "50" }, {}, {})}

    ${validate_component(Trust, "Trust").$$render($$result, { active: organization.isLiked }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "50" }, {}, {})}

    ${validate_component(Donators, "Donators").$$render($$result, { items: donators }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(LastNews, "LastNews").$$render(
		$$result,
		{
			items: lastNews,
			carousel: carouselTop,
			iconsLine,
			organization,
			descriptionShort
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(Certificates, "Certificates").$$render($$result, { items: documents }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "45" }, {}, {})}

    ${validate_component(Videos, "Videos").$$render($$result, { items: media }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "70" }, {}, {})}

    ${validate_component(ContactsCard, "ContactsCard").$$render(
		$$result,
		{
			items: contacts,
			orgName: organization.title,
			avatar: organization.avatar,
			avatarBig: organization.avatarBig
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(VirtualTour, "VirtualTour").$$render($$result, { src: location.virtual_tour }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(WeOnMap, "WeOnMap").$$render($$result, { src: location.map }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(Comments_1, "Comments").$$render($$result, { items: commentsData.comments }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}

    <div class="${"full-container"}">
        ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
    </div>

</section>`;
});

/* src/routes/funds/_TopCarousel.svelte generated by Svelte v3.18.1 */

const TopCarousel$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;

	// Carousel & FancyBox
	let propsBox = {};

	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<section class="${"flex"}" style="${"height: 240px"}">
    ${validate_component(FancyBox, "FancyBox").$$render($$result, {}, {}, {
		box: () => `<section slot="${"box"}" class="${"flex full-width"}">
            ${validate_component(Carousel, "Carousel").$$render($$result, Object.assign({ items }, propsBox), {}, {})}
        </section>`,
		default: () => `
        ${validate_component(Carousel, "Carousel").$$render($$result, { items, dotsBelow: false }, {}, {})}
        
    `
	})}
</section>`;
});

/* src/routes/funds/_OrganizationButton.svelte generated by Svelte v3.18.1 */

const OrganizationButton$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { id = null } = $$props;
	let { src = null } = $$props;
	let { title = null } = $$props;
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);

	return `${validate_component(Button, "Button").$$render(
		$$result,
		{
			rel: "prefetch",
			href: id,
			class: "white"
		},
		{},
		{
			default: () => `
  <div class="${"flex flex-align-center flex-justify-between full-width"}">

    <div class="${"flex flex-align-center"}">
      <s></s>
      <div class="${"flex"}" style="${"max-width: 45px; height: 40px; overflow: hidden"}">
        ${validate_component(Picture, "Picture").$$render(
				$$result,
				{
					src,
					size: "contain",
					alt: "якесь фото організації"
				},
				{},
				{}
			)}
      </div>
      <s></s>
      ${title !== null
			? `<s></s>
        <s></s>
        <h3>${escape(title)}</h3>`
			: `<span style="${"width: 80%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</span>`}
    </div>
    
    <span style="${"font-size: 24px"}">→</span>
  </div>
`
		}
	)}`;
});

/* src/routes/funds/_QuickInfoCard.svelte generated by Svelte v3.18.1 */

const QuickInfoCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { cardTop = {
		title: null,
		subtitle: null,
		currentSum: null,
		neededSum: null
	} } = $$props;

	if ($$props.cardTop === void 0 && $$bindings.cardTop && cardTop !== void 0) $$bindings.cardTop(cardTop);

	return `${validate_component(Card, "Card").$$render($$result, { class: "container" }, {}, {
		default: () => `
    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}

    ${cardTop.title !== null
		? `<h2>${escape(cardTop.title)}</h2>`
		: `<div style="${"width: 80%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}</div>
        <div style="${"width: 80%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}</div>`}

    ${cardTop.subtitle !== null
		? `<h3 class="${"font-w-normal"}" style="${"opacity: .7"}">${escape(cardTop.subtitle)}</h3>`
		: `<div style="${"width: 100%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>
        <div style="${"width: 100%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>`}

    ${validate_component(Br, "Br").$$render($$result, { size: "25" }, {}, {})}
    <p class="${"font-secondary flex flex-align-end"}">
        ${cardTop.currentSum !== null
		? `<span class="${"h1 font-w-500"}">${escape(cardTop.currency)} ${escape(cardTop.currentSum)}</span>`
		: `<div style="${"width: 50%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h1" }, {}, {})}</div>`}

        <s></s>

        ${cardTop.neededSum !== null
		? `<span class="${"h3"}">/ ${escape(cardTop.currency)} ${escape(cardTop.neededSum)}</span>`
		: `<div style="${"width: 30%; padding-bottom: 2px"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>`}
    </p>
    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}

    ${validate_component(Progress, "Progress").$$render(
			$$result,
			{
				value: Math.floor(cardTop.currentSum / cardTop.neededSum * 100)
			},
			{},
			{}
		)}

    ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}
`
	})}`;
});

/* src/routes/funds/_InteractionIndicators.svelte generated by Svelte v3.18.1 */

const InteractionIndicators$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { likes = null } = $$props;
	let { views = null } = $$props;
	if ($$props.likes === void 0 && $$bindings.likes && likes !== void 0) $$bindings.likes(likes);
	if ($$props.views === void 0 && $$bindings.views && views !== void 0) $$bindings.views(views);

	return `<p class="${"container flex flex-justify-between flex-align-center"}">
    <span class="${"flex flex-align-center"}">
        ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			is: "danger",
			type: "heart-filled",
			size: "medium"
		},
		{},
		{}
	)}
        <s></s>
        <s></s>
        ${likes !== null
	? `<span class="${"font-secondary font-w-600 h3"}">${escape(likes)}</span>`
	: `<span class="${"font-secondary font-w-600 h3 relative"}">
                <span style="${"visibility: hidden"}">199</span>
                ${validate_component(Loader, "Loader").$$render($$result, { type: "h3", absolute: true }, {}, {})}
            </span>`}
    </span>
    <span class="${"flex flex-align-center"}">
        ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			type: "eye",
			size: "medium",
			class: "theme-svg-fill"
		},
		{},
		{}
	)}
        <s></s>
        <s></s>
        ${views !== null
	? `<span class="${"font-secondary font-w-600 h3"}">${escape(views)}</span>`
	: `<span class="${"font-secondary font-w-600 h3 relative"}">
                <span style="${"visibility: hidden"}">199</span>
                ${validate_component(Loader, "Loader").$$render($$result, { type: "h3", absolute: true }, {}, {})}
            </span>`}
    </span>
</p>`;
});

/* src/routes/funds/_Description.svelte generated by Svelte v3.18.1 */

const Description$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = null } = $$props;
	let { text = null } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);

	return `${title !== null
	? `<h1>${escape(title)}</h1>`
	: `<div style="${"width: 85%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h1" }, {}, {})}  </div>
    <div style="${"width: 85%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h1" }, {}, {})}  </div>`}
${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

${text !== null
	? `<pre class="${"font-w-300"}">
    ${escape(text)}
</pre>`
	: `${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    ${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}  
    <div style="${"width: 60%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "pre" }, {}, {})}</div>`}`;
});

/* src/routes/funds/_Share.svelte generated by Svelte v3.18.1 */

const Share$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<p class="${"flex"}">
    ${validate_component(Button, "Button").$$render(
		$$result,
		{
			class: "flex flex-align-center",
			auto: true,
			size: "small"
		},
		{},
		{
			default: () => `
        ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					type: "share",
					size: "medium",
					class: "theme-svg-fill"
				},
				{},
				{}
			)}
        <s></s>
        <s></s>
        <p class="${"font-w-500"}">Поділитись</p>
    `
		}
	)}
    <s></s>
    <s></s>
    <s></s>
    <s></s>
    <s></s>
    ${validate_component(Button, "Button").$$render(
		$$result,
		{
			class: "flex flex-align-center",
			auto: true,
			size: "small"
		},
		{},
		{
			default: () => `
        ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					type: "link",
					size: "medium",
					class: "theme-svg-fill"
				},
				{},
				{}
			)}
        <s></s>
        <s></s>
        <p class="${"font-w-500"}">Скопіювати</p>
    `
		}
	)}
</p>`;
});

/* src/routes/funds/_Trust.svelte generated by Svelte v3.18.1 */

const Trust$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { active = false } = $$props;
	if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);

	return `<section class="${"flex flex-column flex-align-center flex-justify-center"}">
    <div style="${"width: 100px; max-width: 100%"}">
        ${validate_component(TrustButton, "TrustButton").$$render($$result, { isActive: active }, {}, {})}
    </div>
    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
    <h2>Я довіряю</h2>
</section>`;
});

/* src/routes/funds/_AnimalCard.svelte generated by Svelte v3.18.1 */

const css$D = {
	code: "table.svelte-jh5z1b tr:not(:last-child) td.svelte-jh5z1b{padding-bottom:16px}table.svelte-jh5z1b td.svelte-jh5z1b:last-child{font-weight:300}",
	map: "{\"version\":3,\"file\":\"_AnimalCard.svelte\",\"sources\":[\"_AnimalCard.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Card, Br, FancyBox, Avatar, Icon, Loader } from '@components'\\n\\n    export let animal = {\\n        avatar: null,\\n        avatar2x: null,\\n        name: null,\\n        breed: null,\\n        age: null,\\n        sex: null,\\n        sterilization: null,\\n        characterShort: null,\\n        character: null,\\n        lifestory: null,\\n        vaccination: null,\\n    }\\n</script>\\n\\n<style>\\n    table tr:not(:last-child) td {\\n        padding-bottom: 16px;\\n    }\\n\\n    table td:last-child {\\n        font-weight: 300;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvZnVuZHMvX0FuaW1hbENhcmQuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG9CQUFvQjtJQUN4Qjs7SUFFQTtRQUNJLGdCQUFnQjtJQUNwQiIsImZpbGUiOiJzcmMvcm91dGVzL2Z1bmRzL19BbmltYWxDYXJkLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIHRhYmxlIHRyOm5vdCg6bGFzdC1jaGlsZCkgdGQge1xuICAgICAgICBwYWRkaW5nLWJvdHRvbTogMTZweDtcbiAgICB9XG5cbiAgICB0YWJsZSB0ZDpsYXN0LWNoaWxkIHtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDMwMDtcbiAgICB9XG4iXX0= */</style>\\n\\n<Card class=\\\"container\\\">\\n    <Br size=\\\"30\\\"/>\\n\\n    <div class=\\\"flex flex-column flex-align-center\\\">\\n        <span>\\n            <FancyBox>\\n                <Avatar src={animal.avatar} size=\\\"big\\\" alt=\\\"Волтер\\\"/>\\n                <section slot=\\\"box\\\" class=\\\"flex full-width full-height\\\" style=\\\"height: 100vw\\\">\\n                    <div class=\\\"flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch\\\" style=\\\"padding: var(--screen-padding) 0\\\">\\n                        <Avatar src={animal.avatar} srcBig={animal.avatar2x} alt=\\\"Волтер\\\"/>\\n                    </div>\\n                </section>\\n            </FancyBox>\\n        </span>\\n\\n        <Br size=\\\"20\\\"/>\\n\\n        {#if animal.name !== null}\\n            <h2>{animal.name}</h2>\\n        {:else}\\n            <span style=\\\"width: 40%\\\"><Loader type=\\\"h2\\\"/></span>\\n        {/if}\\n        <Br size=\\\"5\\\"/>\\n        {#if animal.breed !== null}\\n            <h3 class=\\\"font-w-500\\\" style=\\\"opacity: .7\\\">{animal.breed}</h3>\\n        {:else}\\n            <span style=\\\"width: 60%\\\"><Loader type=\\\"h3\\\"/></span>\\n        {/if}\\n    </div>\\n    <Br size=\\\"35\\\"/>\\n\\n    <section class=\\\"flex flex-justify-center\\\">\\n        <div class=\\\"flex flex-center relative\\\" style=\\\"width: 90px; height: 90px; margin: 0 .8em\\\">\\n            <Icon type=\\\"polygon\\\" is=\\\"primary\\\"/>\\n\\n            {#if animal.age !== null}\\n                <div class=\\\"text-white text-center absolute\\\">\\n                    <h4 class=\\\"h1\\\">{animal.age}</h4>\\n                    <h4 style=\\\"margin-top: -8px\\\">Роки</h4>\\n                </div>\\n            {/if}\\n        </div>\\n\\n        <div class=\\\"flex flex-center relative\\\" style=\\\"width: 90px; height: 90px; margin: 0 .8em\\\">\\n            <Icon type=\\\"polygon\\\" is=\\\"info\\\"/>\\n\\n            {#if animal.sex !== null}\\n                <div class=\\\"absolute flex\\\" style=\\\"width: 44px; height: 44px\\\">\\n                {#if animal.sex === 'male'}\\n                    <Icon type=\\\"male\\\" is=\\\"light\\\"/>\\n                {:else if animal.sex === 'female'}\\n                    <Icon type=\\\"female\\\" is=\\\"light\\\"/>\\n                {/if}\\n                </div>\\n            {/if}\\n        </div>\\n\\n        <div class=\\\"flex flex-center relative\\\" style=\\\"width: 90px; height: 90px; margin: 0 .8em\\\">\\n            <Icon type=\\\"polygon\\\" is=\\\"primary\\\"/>\\n\\n            {#if animal.sterilization !== null}\\n                <div class=\\\"absolute flex flex-column flex-center\\\">\\n                    {#if animal.sterilization}\\n                        <Icon type=\\\"checked-circle\\\" is=\\\"light\\\" size=\\\"big\\\"/>\\n                    {:else}\\n                        <Icon type=\\\"cancel-circle\\\" is=\\\"light\\\" size=\\\"big\\\"/>\\n                    {/if}\\n                    <span class=\\\"text-white text-center h5\\\">Cтерилізація</span>\\n                </div>\\n            {/if}\\n        </div>\\n    </section>\\n    <Br size=\\\"40\\\"/>\\n\\n    <h2>Характер: {animal.characterShort ? animal.characterShort : ''}</h2>\\n    <Br size=\\\"10\\\"/>\\n\\n    {#if animal.character !== null}\\n        <p class=\\\"font-w-300\\\">\\n            {animal.character}\\n        </p>\\n    {:else}\\n        <Loader type=\\\"p\\\"/>\\n        <Loader type=\\\"p\\\"/>\\n        <Loader type=\\\"p\\\"/>\\n        <Loader type=\\\"p\\\"/>\\n    {/if}\\n    <Br size=\\\"35\\\"/>\\n\\n    <h2>Життя</h2>\\n    <Br size=\\\"10\\\"/>\\n    <table>\\n        <tbody>\\n            {#if animal.lifestory !== null}\\n                {#each animal.lifestory as item}\\n                    <tr>\\n                        <td>{item.date}</td>\\n                        <td>—</td>\\n                        <td>{item.title}</td>\\n                    </tr>\\n                {/each}\\n            {:else}\\n                <tr>\\n                    <td><Loader type=\\\"p\\\"/></td>\\n                    <td>—</td>\\n                    <td>\\n                        <Loader type=\\\"p\\\"/>\\n                        <Loader type=\\\"p\\\"/>\\n                    </td>\\n                </tr>\\n                <tr>\\n                    <td><Loader type=\\\"p\\\"/></td>\\n                    <td>—</td>\\n                    <td>\\n                        <Loader type=\\\"p\\\"/>\\n                        <Loader type=\\\"p\\\"/>\\n                    </td>\\n                </tr>\\n                <tr>\\n                    <td><Loader type=\\\"p\\\"/></td>\\n                    <td>—</td>\\n                    <td>\\n                        <Loader type=\\\"p\\\"/>\\n                        <Loader type=\\\"p\\\"/>\\n                    </td>\\n                </tr>\\n            {/if}\\n        </tbody>\\n    </table>\\n    <Br size=\\\"45\\\"/>\\n\\n    <h2>Вакцинації</h2>\\n    <Br size=\\\"15\\\"/>\\n    <ul class=\\\"flex flex-column text-left\\\">\\n        {#if animal.vaccination !== null}\\n            {#each animal.vaccination as item, i}\\n                <li>\\n                    {#if i}\\n                        <Br size=\\\"10\\\"/>\\n                    {/if}\\n                    <span class=\\\"flex flex-align-center font-w-300\\\">\\n                        {#if item.done}\\n                            <Icon is=\\\"primary\\\" type=\\\"checked-circle\\\" size=\\\"medium\\\"/>\\n                        {:else}\\n                            <Icon is=\\\"danger\\\" type=\\\"cancel-circle\\\" size=\\\"medium\\\"/>\\n                        {/if}\\n                        <s></s>\\n                        <s></s>\\n                        <s></s>\\n                        {item.title}\\n                    </span>\\n                </li>\\n            {/each}\\n        {:else}\\n            <li style=\\\"width: 40%\\\">\\n                <Loader type=\\\"p\\\"/>\\n            </li>\\n            <li style=\\\"width: 40%\\\">\\n                <Br size=\\\"10\\\"/>\\n                <Loader type=\\\"p\\\"/>\\n            </li>\\n            <li style=\\\"width: 40%\\\">\\n                <Br size=\\\"10\\\"/>\\n                <Loader type=\\\"p\\\"/>\\n            </li>\\n        {/if}\\n    </ul>\\n\\n    <Br size=\\\"35\\\"/>\\n</Card>\"],\"names\":[],\"mappings\":\"AAmBI,mBAAK,CAAC,EAAE,KAAK,WAAW,CAAC,CAAC,EAAE,cAAC,CAAC,AAC1B,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,mBAAK,CAAC,gBAAE,WAAW,AAAC,CAAC,AACjB,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

const AnimalCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { animal = {
		avatar: null,
		avatar2x: null,
		name: null,
		breed: null,
		age: null,
		sex: null,
		sterilization: null,
		characterShort: null,
		character: null,
		lifestory: null,
		vaccination: null
	} } = $$props;

	if ($$props.animal === void 0 && $$bindings.animal && animal !== void 0) $$bindings.animal(animal);
	$$result.css.add(css$D);

	return `${validate_component(Card, "Card").$$render($$result, { class: "container" }, {}, {
		default: () => `
    ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}

    <div class="${"flex flex-column flex-align-center"}">
        <span>
            ${validate_component(FancyBox, "FancyBox").$$render($$result, {}, {}, {
			box: () => `<section slot="${"box"}" class="${"flex full-width full-height"}" style="${"height: 100vw"}">
                    <div class="${"flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch"}" style="${"padding: var(--screen-padding) 0"}">
                        ${validate_component(Avatar, "Avatar").$$render(
				$$result,
				{
					src: animal.avatar,
					srcBig: animal.avatar2x,
					alt: "Волтер"
				},
				{},
				{}
			)}
                    </div>
                </section>`,
			default: () => `
                ${validate_component(Avatar, "Avatar").$$render(
				$$result,
				{
					src: animal.avatar,
					size: "big",
					alt: "Волтер"
				},
				{},
				{}
			)}
                
            `
		})}
        </span>

        ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}

        ${animal.name !== null
		? `<h2>${escape(animal.name)}</h2>`
		: `<span style="${"width: 40%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}</span>`}
        ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
        ${animal.breed !== null
		? `<h3 class="${"font-w-500"}" style="${"opacity: .7"}">${escape(animal.breed)}</h3>`
		: `<span style="${"width: 60%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</span>`}
    </div>
    ${validate_component(Br, "Br").$$render($$result, { size: "35" }, {}, {})}

    <section class="${"flex flex-justify-center"}">
        <div class="${"flex flex-center relative"}" style="${"width: 90px; height: 90px; margin: 0 .8em"}">
            ${validate_component(Icon, "Icon").$$render($$result, { type: "polygon", is: "primary" }, {}, {})}

            ${animal.age !== null
		? `<div class="${"text-white text-center absolute"}">
                    <h4 class="${"h1"}">${escape(animal.age)}</h4>
                    <h4 style="${"margin-top: -8px"}">Роки</h4>
                </div>`
		: ``}
        </div>

        <div class="${"flex flex-center relative"}" style="${"width: 90px; height: 90px; margin: 0 .8em"}">
            ${validate_component(Icon, "Icon").$$render($$result, { type: "polygon", is: "info" }, {}, {})}

            ${animal.sex !== null
		? `<div class="${"absolute flex"}" style="${"width: 44px; height: 44px"}">
                ${animal.sex === "male"
			? `${validate_component(Icon, "Icon").$$render($$result, { type: "male", is: "light" }, {}, {})}`
			: `${animal.sex === "female"
				? `${validate_component(Icon, "Icon").$$render($$result, { type: "female", is: "light" }, {}, {})}`
				: ``}`}
                </div>`
		: ``}
        </div>

        <div class="${"flex flex-center relative"}" style="${"width: 90px; height: 90px; margin: 0 .8em"}">
            ${validate_component(Icon, "Icon").$$render($$result, { type: "polygon", is: "primary" }, {}, {})}

            ${animal.sterilization !== null
		? `<div class="${"absolute flex flex-column flex-center"}">
                    ${animal.sterilization
			? `${validate_component(Icon, "Icon").$$render(
					$$result,
					{
						type: "checked-circle",
						is: "light",
						size: "big"
					},
					{},
					{}
				)}`
			: `${validate_component(Icon, "Icon").$$render(
					$$result,
					{
						type: "cancel-circle",
						is: "light",
						size: "big"
					},
					{},
					{}
				)}`}
                    <span class="${"text-white text-center h5"}">Cтерилізація</span>
                </div>`
		: ``}
        </div>
    </section>
    ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}

    <h2>Характер: ${escape(animal.characterShort ? animal.characterShort : "")}</h2>
    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

    ${animal.character !== null
		? `<p class="${"font-w-300"}">
            ${escape(animal.character)}
        </p>`
		: `${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}`}
    ${validate_component(Br, "Br").$$render($$result, { size: "35" }, {}, {})}

    <h2>Життя</h2>
    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
    <table class="${"svelte-jh5z1b"}">
        <tbody>
            ${animal.lifestory !== null
		? `${each(animal.lifestory, item => `<tr>
                        <td class="${"svelte-jh5z1b"}">${escape(item.date)}</td>
                        <td class="${"svelte-jh5z1b"}">—</td>
                        <td class="${"svelte-jh5z1b"}">${escape(item.title)}</td>
                    </tr>`)}`
		: `<tr>
                    <td class="${"svelte-jh5z1b"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</td>
                    <td class="${"svelte-jh5z1b"}">—</td>
                    <td class="${"svelte-jh5z1b"}">
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                    </td>
                </tr>
                <tr>
                    <td class="${"svelte-jh5z1b"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</td>
                    <td class="${"svelte-jh5z1b"}">—</td>
                    <td class="${"svelte-jh5z1b"}">
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                    </td>
                </tr>
                <tr>
                    <td class="${"svelte-jh5z1b"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</td>
                    <td class="${"svelte-jh5z1b"}">—</td>
                    <td class="${"svelte-jh5z1b"}">
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                    </td>
                </tr>`}
        </tbody>
    </table>
    ${validate_component(Br, "Br").$$render($$result, { size: "45" }, {}, {})}

    <h2>Вакцинації</h2>
    ${validate_component(Br, "Br").$$render($$result, { size: "15" }, {}, {})}
    <ul class="${"flex flex-column text-left"}">
        ${animal.vaccination !== null
		? `${each(animal.vaccination, (item, i) => `<li>
                    ${i
			? `${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}`
			: ``}
                    <span class="${"flex flex-align-center font-w-300"}">
                        ${item.done
			? `${validate_component(Icon, "Icon").$$render(
					$$result,
					{
						is: "primary",
						type: "checked-circle",
						size: "medium"
					},
					{},
					{}
				)}`
			: `${validate_component(Icon, "Icon").$$render(
					$$result,
					{
						is: "danger",
						type: "cancel-circle",
						size: "medium"
					},
					{},
					{}
				)}`}
                        <s></s>
                        <s></s>
                        <s></s>
                        ${escape(item.title)}
                    </span>
                </li>`)}`
		: `<li style="${"width: 40%"}">
                ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
            </li>
            <li style="${"width: 40%"}">
                ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
                ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
            </li>
            <li style="${"width: 40%"}">
                ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
                ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
            </li>`}
    </ul>

    ${validate_component(Br, "Br").$$render($$result, { size: "35" }, {}, {})}
`
	})}`;
});

/* src/routes/funds/_Donators.svelte generated by Svelte v3.18.1 */

const Donators$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Наші піклувальники</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(DonatorsList, "DonatorsList").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/funds/_Documents.svelte generated by Svelte v3.18.1 */

const Documents_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Документи</h1>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(Documents, "Documents").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/funds/_Media.svelte generated by Svelte v3.18.1 */

const Media = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Відео про Волтера</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<section class="${"flex"}" style="${"height: 280px"}">
    ${validate_component(Carousel, "Carousel").$$render($$result, { items }, {}, {})}
</section>`;
});

/* src/routes/funds/_HowToHelp.svelte generated by Svelte v3.18.1 */

const HowToHelp = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = { phone: null } } = $$props;
	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);

	return `<h1>Як допомогти</h1>
${validate_component(Br, "Br").$$render($$result, { size: "15" }, {}, {})}
<ul style="${"list-style: disc outside none; padding-left: var(--screen-padding)"}" class="${"h3 font-w-500 font-secondary"}">
    ${data.phone !== null
	? `<li style="${"padding-bottom: 5px"}">Ви пожете купити йому поїсти</li>
        <li style="${"padding-bottom: 5px"}">Можете особисто відвідати його у нас</li>
        <li style="${"padding-bottom: 5px"}">Купити вакцінацію для Волтера</li>
        <li style="${"padding-bottom: 5px"}">Допомогти любим інщим способом</li>`
	: `<li style="${"padding-bottom: 5px"}">
            <span class="${"font-secondary font-w-500 p relative"}">
                <span style="${"visibility: hidden"}">Допомогти любим способом</span>
                ${validate_component(Loader, "Loader").$$render($$result, { type: "h3", absolute: true }, {}, {})}
            </span>  
        </li>
       <li style="${"padding-bottom: 5px"}">
            <span class="${"font-secondary font-w-500 p relative"}">
                <span style="${"visibility: hidden"}">Допомогти любим способом</span>
                ${validate_component(Loader, "Loader").$$render($$result, { type: "h3", absolute: true }, {}, {})}
            </span>  
        </li>
       <li style="${"padding-bottom: 5px"}">
            <span class="${"font-secondary font-w-500 p relative"}">
                <span style="${"visibility: hidden"}">Допомогти любим способом</span>
                ${validate_component(Loader, "Loader").$$render($$result, { type: "h3", absolute: true }, {}, {})}
            </span>
        </li>
       <li style="${"padding-bottom: 5px"}">
            <span class="${"font-secondary font-w-500 p relative"}">
                <span style="${"visibility: hidden"}">Допомогти любим способом</span>
                ${validate_component(Loader, "Loader").$$render($$result, { type: "h3", absolute: true }, {}, {})}
            </span>  
        </li>`}
</ul>
${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
<div class="${"flex"}">
    <div class="${"flex flex-align-center font-secondary"}">
        ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			size: "medium",
			type: "phone",
			class: "theme-svg-fill-opposite"
		},
		{},
		{}
	)}
        <s></s>
        <s></s>
        ${data.phone !== null
	? `<h2>${escape(data.phone)}</h2>`
	: `<span style="${"width: 240px"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}</span>`}
    </div>
</div>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<p class="${"font-w-300"}">Подзвоніть нам, допоможемо разом!</p>`;
});

/* src/routes/funds/_Comments.svelte generated by Svelte v3.18.1 */

const Comments_1$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Коментарі</h1>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(Comments, "Comments").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/funds/[id].svelte generated by Svelte v3.18.1 */

const U5Bidu5D$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $page;
	const { page } = stores$1();
	$page = get_store_value(page);
	let charityId = $page.params.id;

	// Entities
	let charity;

	let comments;

	onMount(async () => {
		await delay(20000);
		charity = await API.getFund(1);
		comments = await API.getComments();
	});

	$page = get_store_value(page);

	let carouselTop = safeGet(() => charity.avatars.map((a, i) => ({
		src: a.src,
		srcBig: a.src2x,
		alt: a.title
	})));

	let organization = safeGet(() => charity.organization, {});

	let cardTop = safeGet(() => ({
		title: charity.title,
		subtitle: charity.subtitle,
		currentSum: charity.curremt_sum,
		neededSum: charity.need_sum,
		currency: charity.currency
	}));

	let iconsLine = {
		likes: safeGet(() => charity.likes),
		views: safeGet(() => charity.views)
	};

	let trust = { isLiked: safeGet(() => charity.is_liked) };

	let descriptionBlock = {
		title: safeGet(() => charity.title),
		text: safeGet(() => charity.description)
	};

	let animal = safeGet(() => ({
		avatar: charity.animal.avatars[0].src,
		name: charity.animal.name,
		breed: charity.animal.breed,
		age: new Date().getFullYear() - new Date(charity.animal.birth).getFullYear(),
		sex: charity.animal.sex,
		sterilization: charity.animal.sterilization,
		character: charity.animal.character,
		characterShort: charity.animal.character_short,
		lifestory: charity.animal.lifestory.map(l => ({
			...l,
			date: new Date(l.date).toLocaleDateString()
		})),
		vaccination: charity.animal.vaccination
	}));

	let donators = safeGet(() => charity.donators.map(d => ({
		id: d.id,
		title: `${d.currency} ${d.amount}`,
		subtitle: d.name,
		src: d.avatar,
		src2x: d.avatar2x
	})));

	let documents = safeGet(() => charity.documents.map(d => ({
		id: d.id,
		title: d.title,
		src: d.src,
		src2x: d.src2x
	})));

	let media = safeGet(
		() => charity.media.map(d => ({
			id: d.id,
			alt: d.title,
			src: d.src,
			srcBig: d.src2x,
			description: d.description
		})),
		[],
		true
	);

	let howToHelp = safeGet(() => ({ phone: charity.organization.phone }));

	let commentsData = {
		comments: safeGet(() => comments.map(c => ({
			likes: c.likes,
			avatar: c["author.avatar"],
			author: c["author.name"],
			comment: c.comment,
			checked: c.checked,
			reply_to: c.reply_to,
			created_at: c.created_at
		})))
	};

	return `${($$result.head += `${($$result.title = `<title>Charitify - Charity page and donate.</title>`, "")}`, "")}



${validate_component(DonationButton, "DonationButton").$$render($$result, {}, {}, {})}

<section class="${"container theme-bg-color-secondary"}">
    ${validate_component(Br, "Br").$$render($$result, { size: "var(--header-height)" }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}

    ${validate_component(TopCarousel$1, "TopCarousel").$$render($$result, { items: carouselTop }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}

    ${validate_component(OrganizationButton$1, "OrganizationButton").$$render(
		$$result,
		{
			id: organization.id,
			src: organization.avatar,
			title: organization.name
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}

    ${validate_component(QuickInfoCard, "QuickInfoCard").$$render($$result, { cardTop }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}

    ${validate_component(InteractionIndicators$1, "InteractionIndicators").$$render(
		$$result,
		{
			likes: iconsLine.likes,
			views: iconsLine.views
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "50" }, {}, {})}

    ${validate_component(Description$1, "Description").$$render(
		$$result,
		{
			title: descriptionBlock.title,
			text: descriptionBlock.text
		},
		{},
		{}
	)}
    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

    ${validate_component(Share$1, "Share").$$render($$result, {}, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "45" }, {}, {})}

    ${validate_component(Trust$1, "Trust").$$render($$result, { active: trust.isLiked }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(AnimalCard, "AnimalCard").$$render($$result, { animal }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(Donators$1, "Donators").$$render($$result, { items: donators }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(Documents_1, "Documents").$$render($$result, { items: documents }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "45" }, {}, {})} 

    ${validate_component(Media, "Media").$$render($$result, { items: media }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(HowToHelp, "HowToHelp").$$render($$result, { data: howToHelp }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(Comments_1$1, "Comments").$$render($$result, { items: commentsData.comments }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    <div class="${"full-container"}">
        ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
    </div>
    ${validate_component(Br, "Br").$$render($$result, { size: "70" }, {}, {})}
</section>`;
});

/* src/routes/lists/organizations.svelte generated by Svelte v3.18.1 */

const Organizations = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let organizations = [];

	onMount(async () => {
		await new Promise(r => setTimeout(r, 1000));
		const orgs = await API.getOrganizations();
		organizations = new Array(1).fill(orgs).reduce((a, o) => a.concat(...o), []);
	});

	return `${($$result.head += `${($$result.title = `<title>Charitify - is the application for helping those in need.</title>`, "")}`, "")}



${validate_component(Br, "Br").$$render($$result, { size: "50" }, {}, {})}
${validate_component(ListsLayout, "ListsLayout").$$render($$result, {}, {}, {
		default: () => `
    ${validate_component(ListItems, "ListItems").$$render(
			$$result,
			{
				items: organizations,
				basePath: "organizations"
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/lists/funds.svelte generated by Svelte v3.18.1 */

const Funds = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let chariries = [];

	onMount(async () => {
		await new Promise(r => setTimeout(r, 1000));
		const chars = await API.getFunds();
		chariries = new Array(5).fill(chars).reduce((a, o) => a.concat(...o), []);
	});

	return `${($$result.head += `${($$result.title = `<title>Charitify - is the application for helping those in need.</title>`, "")}`, "")}



${validate_component(Br, "Br").$$render($$result, { size: "50" }, {}, {})}
${validate_component(ListsLayout, "ListsLayout").$$render($$result, {}, {}, {
		default: () => `
    ${validate_component(ListItems, "ListItems").$$render($$result, { items: chariries, basePath: "funds" }, {}, {})}
`
	})}`;
});

/* src/routes/users/index.svelte generated by Svelte v3.18.1 */

const Users = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<section>
    <br>
    <br>
    <br>
    Here will be users for ADMIN
    <br>
    <br>
    <br>
</section>`;
});

/* src/routes/users/_components/_UserCardView.svelte generated by Svelte v3.18.1 */

const UserCardView = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	let { srcBig } = $$props;
	let { title } = $$props;
	let { subtitle } = $$props;
	let { itemsX } = $$props;
	let { itemsY } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.srcBig === void 0 && $$bindings.srcBig && srcBig !== void 0) $$bindings.srcBig(srcBig);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	if ($$props.itemsX === void 0 && $$bindings.itemsX && itemsX !== void 0) $$bindings.itemsX(itemsX);
	if ($$props.itemsY === void 0 && $$bindings.itemsY && itemsY !== void 0) $$bindings.itemsY(itemsY);

	return `<div class="${"text-center flex flex-column flex-align-center"}">
    <span>
        ${validate_component(FancyBox, "FancyBox").$$render($$result, { class: "flex-justify-center" }, {}, {
		box: () => `<section slot="${"box"}" class="${"flex full-width full-height"}" style="${"height: 100vw"}">
                <div class="${"flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch"}" style="${"padding: var(--screen-padding) 0"}">
                    ${validate_component(Avatar, "Avatar").$$render($$result, { src, srcBig, alt: "ava" }, {}, {})}
                </div>
            </section>`,
		default: () => `
            ${validate_component(Avatar, "Avatar").$$render($$result, { size: "big", src, alt: "Організація" }, {}, {})}
            
        `
	})}
    </span>

    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
    ${title !== undefined
	? `${title !== null
		? `<h2>${escape(title)}</h2>`
		: `<div style="${"width: 200px"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}</div>`}`
	: ``}
    ${validate_component(Br, "Br").$$render($$result, { size: "4" }, {}, {})}
    ${title !== undefined
	? `${title !== null
		? `<p>${escape(subtitle)}</p>`
		: `<div style="${"width: 100px"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</div>`}`
	: ``}
</div>

${Array.isArray(itemsX)
	? `${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
    ${validate_component(SocialsX, "SocialsX").$$render($$result, { items: itemsX }, {}, {})}`
	: ``}

${Array.isArray(itemsY)
	? `${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
    ${validate_component(SocialsY, "SocialsY").$$render($$result, { items: itemsY }, {}, {})}`
	: ``}`;
});

/* src/routes/users/_Usercard.svelte generated by Svelte v3.18.1 */

const Usercard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = null } = $$props;
	let { srcBig = null } = $$props;
	let { items = null } = $$props;
	let { title = null } = $$props;
	let { subtitle = null } = $$props;
	const top = ["telegram", "facebook", "viber"];
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.srcBig === void 0 && $$bindings.srcBig && srcBig !== void 0) $$bindings.srcBig(srcBig);
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);

	let itemsX = items === null
	? null
	: safeGet(() => items.filter(i => top.includes(i.type)));

	let itemsY = items === null
	? null
	: safeGet(() => items.filter(i => !top.includes(i.type)));

	return `${validate_component(Card, "Card").$$render($$result, { class: "container" }, {}, {
		default: () => `
    ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}

    ${ `${validate_component(UserCardView, "UserCardView").$$render(
				$$result,
				{
					src,
					srcBig,
					title,
					subtitle,
					itemsX,
					itemsY
				},
				{},
				{}
			)}`
		}

    ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}

    ${validate_component(Button, "Button").$$render(
			$$result,
			{
				size: "small",
				is:  "info" 
			},
			{},
			{
				default: () => `
        ${ `<span class="${"h3 font-secondary font-w-500 flex flex-align-center"}">
                Редагувати
                <s></s>
                <s></s>
                ${validate_component(Icon, "Icon").$$render($$result, { type: "edit", size: "small", is: "light" }, {}, {})}
            </span>`
				}
    `
			}
		)}

    ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
`
	})}`;
});

/* src/routes/users/me.svelte generated by Svelte v3.18.1 */
let href = ".";

const Me = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let organization = {};
	let funds;

	onMount(async () => {
		await delay(7000);
		organization = await API.getOrganization(1);
		funds = await API.getFunds();
	});

	let contacts = safeGet(
		() => organization.contacts.map(c => ({
			title: c.title,
			href: c.value,
			type: c.type
		})),
		null
	);

	let animalFunds = safeGet(
		() => funds.filter(f => f.type === "animal").reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
			id: f.id,
			src: f.avatars[0].src,
			type: f.type,
			title: f.title,
			total: f.need_sum,
			current: f.curremt_sum,
			currency: f.currency,
			city: f.location.city
		})),
		null
	);

	let othersFunds = safeGet(
		() => funds.filter(f => f.type === "animal").reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
			id: f.id,
			src: f.avatars[0].src,
			type: f.type,
			title: f.title,
			total: f.need_sum,
			current: f.curremt_sum,
			currency: f.currency,
			city: f.location.city
		})),
		null
	);

	return `<section class="${"container theme-bg-color-secondary"}">
    ${validate_component(Br, "Br").$$render($$result, { size: "var(--header-height)" }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: "35" }, {}, {})}

    <h1 class="${"text-center"}">Про мене</h1>
    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}

    ${validate_component(Usercard, "Usercard").$$render(
		$$result,
		{
			items: contacts,
			title: safeGet(() => organization.name),
			subtitle: safeGet(() => organization.title),
			src: safeGet(() => organization.avatar),
			srcBig: safeGet(() => organization.avatarBig)
		},
		{},
		{}
	)}

    ${validate_component(Br, "Br").$$render($$result, { size: "15" }, {}, {})}

    <div class="${"full-container"}">
        ${validate_component(EditArea, "EditArea").$$render($$result, {}, {}, {
		default: () => `
            ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}
            <h1>Мої організації</h1>
            ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
            <div class="${"full-container"}">
                ${validate_component(FundCards, "FundCards").$$render($$result, { items: animalFunds }, {}, {
			button: ({ id }) => `<div slot="${"button"}">
                        ${validate_component(Button, "Button").$$render($$result, { size: "small", is: "info", href: id }, {}, {
				default: () => `
                            <span class="${"h3 font-secondary font-w-500 flex flex-align-center"}">
                                Редагувати
                                <s></s>
                                <s></s>
                                ${validate_component(Icon, "Icon").$$render($$result, { type: "edit", size: "small", is: "light" }, {}, {})}
                            </span>
                        `
			})}
                    </div>`,
			default: () => `
                    
                `
		})}
            </div>

            ${validate_component(Br, "Br").$$render($$result, { size: "35" }, {}, {})}
            ${validate_component(Button, "Button").$$render(
			$$result,
			{
				size: "big",
				is: "success",
				href,
				class: "no-filter"
			},
			{},
			{
				default: () => `
                <span class="${"h2 font-secondary font-w-600"}">
                    Додати
                </span>
            `
			}
		)}
            ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}
        `
	})}
    </div>

    ${validate_component(Br, "Br").$$render($$result, { size: "15" }, {}, {})}

    <h1>Мої фонди</h1>
    ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
    <div class="${"full-container"}">
        ${validate_component(FundCards, "FundCards").$$render($$result, { items: othersFunds }, {}, {
		button: ({ id }) => `<div slot="${"button"}">
                ${validate_component(Button, "Button").$$render($$result, { size: "small", is: "info", href: id }, {}, {
			default: () => `
                    <span class="${"h3 font-secondary font-w-500 flex flex-align-center"}">
                        Редагувати
                        <s></s>
                        <s></s>
                        ${validate_component(Icon, "Icon").$$render($$result, { type: "edit", size: "small", is: "light" }, {}, {})}
                    </span>
                `
		})}
            </div>`,
		default: () => `
            
        `
	})}
    </div>

    ${validate_component(Br, "Br").$$render($$result, { size: "35" }, {}, {})}
    ${validate_component(Button, "Button").$$render($$result, { size: "big", is: "success", href }, {}, {
		default: () => `
        <span class="${"h2 font-secondary font-w-600"}">
            Додати
        </span>
    `
	})}

    ${validate_component(Br, "Br").$$render($$result, { size: "125" }, {}, {})}
</section>`;
});

/* src/routes/users/[id].svelte generated by Svelte v3.18.1 */

const U5Bidu5D$2 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<section>
    <br>
    <br>
    <br>
    Here will a user for ADMIN
    <br>
    <br>
    <br>
</section>`;
});

/* src/routes/map/index.svelte generated by Svelte v3.18.1 */

const Map_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const { page } = stores$1();
	let organizations = [];

	return `${($$result.head += `${($$result.title = `<title>Charitify - Map of organizations.</title>`, "")}`, "")}





${validate_component(Br, "Br").$$render($$result, { size: "var(--header-height)" }, {}, {})}
${validate_component(Map$1, "Map").$$render($$result, {}, {}, {
		default: () => `
    ${each(organizations, o => `${validate_component(MapMarker, "MapMarker").$$render($$result, { lat: o.location.lat, lng: o.location.lng }, {}, {})}`)}
`
	})}`;
});

/* src/routes/map/[id].svelte generated by Svelte v3.18.1 */

const U5Bidu5D$3 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $page;
	const { page } = stores$1();
	$page = get_store_value(page);
	let center = undefined;
	let markerId = $page.params.id;
	let organizations = [];

	$page = get_store_value(page);

	return `${($$result.head += `${($$result.title = `<title>Charitify - Map of organizations.</title>`, "")}`, "")}





 ${validate_component(Br, "Br").$$render($$result, { size: "var(--header-height)" }, {}, {})}
${validate_component(Map$1, "Map").$$render($$result, { center }, {}, {
		default: () => `
    ${each(organizations, o => `${validate_component(MapMarker, "MapMarker").$$render($$result, { lat: o.location.lat, lng: o.location.lng }, {}, {})}`)}
`
	})}`;
});

// This file is generated by Sapper — do not edit it!

const d = decodeURIComponent;

const manifest = {
	server_routes: [
		
	],

	pages: [
		{
			// index.svelte
			pattern: /^\/$/,
			parts: [
				{ name: "index", file: "index.svelte", component: Routes }
			]
		},

		{
			// organizations/[id].svelte
			pattern: /^\/organizations\/([^\/]+?)\/?$/,
			parts: [
				null,
				{ name: "organizations_$id", file: "organizations/[id].svelte", component: U5Bidu5D, params: match => ({ id: d(match[1]) }) }
			]
		},

		{
			// funds/[id].svelte
			pattern: /^\/funds\/([^\/]+?)\/?$/,
			parts: [
				null,
				{ name: "funds_$id", file: "funds/[id].svelte", component: U5Bidu5D$1, params: match => ({ id: d(match[1]) }) }
			]
		},

		{
			// lists/organizations.svelte
			pattern: /^\/lists\/organizations\/?$/,
			parts: [
				null,
				{ name: "lists_organizations", file: "lists/organizations.svelte", component: Organizations }
			]
		},

		{
			// lists/funds.svelte
			pattern: /^\/lists\/funds\/?$/,
			parts: [
				null,
				{ name: "lists_funds", file: "lists/funds.svelte", component: Funds }
			]
		},

		{
			// users/index.svelte
			pattern: /^\/users\/?$/,
			parts: [
				{ name: "users", file: "users/index.svelte", component: Users }
			]
		},

		{
			// users/me.svelte
			pattern: /^\/users\/me\/?$/,
			parts: [
				null,
				{ name: "users_me", file: "users/me.svelte", component: Me }
			]
		},

		{
			// users/[id].svelte
			pattern: /^\/users\/([^\/]+?)\/?$/,
			parts: [
				null,
				{ name: "users_$id", file: "users/[id].svelte", component: U5Bidu5D$2, params: match => ({ id: d(match[1]) }) }
			]
		},

		{
			// map/index.svelte
			pattern: /^\/map\/?$/,
			parts: [
				{ name: "map", file: "map/index.svelte", component: Map_1 }
			]
		},

		{
			// map/[id].svelte
			pattern: /^\/map\/([^\/]+?)\/?$/,
			parts: [
				null,
				{ name: "map_$id", file: "map/[id].svelte", component: U5Bidu5D$3, params: match => ({ id: d(match[1]) }) }
			]
		}
	],

	root: Layout,
	root_preload: () => {},
	error: Error$1
};

const build_dir = "__sapper__/build";

/**
 * @param typeMap [Object] Map of MIME type -> Array[extensions]
 * @param ...
 */
function Mime() {
  this._types = Object.create(null);
  this._extensions = Object.create(null);

  for (var i = 0; i < arguments.length; i++) {
    this.define(arguments[i]);
  }

  this.define = this.define.bind(this);
  this.getType = this.getType.bind(this);
  this.getExtension = this.getExtension.bind(this);
}

/**
 * Define mimetype -> extension mappings.  Each key is a mime-type that maps
 * to an array of extensions associated with the type.  The first extension is
 * used as the default extension for the type.
 *
 * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
 *
 * If a type declares an extension that has already been defined, an error will
 * be thrown.  To suppress this error and force the extension to be associated
 * with the new type, pass `force`=true.  Alternatively, you may prefix the
 * extension with "*" to map the type to extension, without mapping the
 * extension to the type.
 *
 * e.g. mime.define({'audio/wav', ['wav']}, {'audio/x-wav', ['*wav']});
 *
 *
 * @param map (Object) type definitions
 * @param force (Boolean) if true, force overriding of existing definitions
 */
Mime.prototype.define = function(typeMap, force) {
  for (var type in typeMap) {
    var extensions = typeMap[type].map(function(t) {return t.toLowerCase()});
    type = type.toLowerCase();

    for (var i = 0; i < extensions.length; i++) {
      var ext = extensions[i];

      // '*' prefix = not the preferred type for this extension.  So fixup the
      // extension, and skip it.
      if (ext[0] == '*') {
        continue;
      }

      if (!force && (ext in this._types)) {
        throw new Error(
          'Attempt to change mapping for "' + ext +
          '" extension from "' + this._types[ext] + '" to "' + type +
          '". Pass `force=true` to allow this, otherwise remove "' + ext +
          '" from the list of extensions for "' + type + '".'
        );
      }

      this._types[ext] = type;
    }

    // Use first extension as default
    if (force || !this._extensions[type]) {
      var ext = extensions[0];
      this._extensions[type] = (ext[0] != '*') ? ext : ext.substr(1);
    }
  }
};

/**
 * Lookup a mime type based on extension
 */
Mime.prototype.getType = function(path) {
  path = String(path);
  var last = path.replace(/^.*[/\\]/, '').toLowerCase();
  var ext = last.replace(/^.*\./, '').toLowerCase();

  var hasPath = last.length < path.length;
  var hasDot = ext.length < last.length - 1;

  return (hasDot || !hasPath) && this._types[ext] || null;
};

/**
 * Return file extension associated with a mime type
 */
Mime.prototype.getExtension = function(type) {
  type = /^\s*([^;\s]*)/.test(type) && RegExp.$1;
  return type && this._extensions[type.toLowerCase()] || null;
};

var Mime_1 = Mime;

var standard = {"application/andrew-inset":["ez"],"application/applixware":["aw"],"application/atom+xml":["atom"],"application/atomcat+xml":["atomcat"],"application/atomsvc+xml":["atomsvc"],"application/bdoc":["bdoc"],"application/ccxml+xml":["ccxml"],"application/cdmi-capability":["cdmia"],"application/cdmi-container":["cdmic"],"application/cdmi-domain":["cdmid"],"application/cdmi-object":["cdmio"],"application/cdmi-queue":["cdmiq"],"application/cu-seeme":["cu"],"application/dash+xml":["mpd"],"application/davmount+xml":["davmount"],"application/docbook+xml":["dbk"],"application/dssc+der":["dssc"],"application/dssc+xml":["xdssc"],"application/ecmascript":["ecma","es"],"application/emma+xml":["emma"],"application/epub+zip":["epub"],"application/exi":["exi"],"application/font-tdpfr":["pfr"],"application/geo+json":["geojson"],"application/gml+xml":["gml"],"application/gpx+xml":["gpx"],"application/gxf":["gxf"],"application/gzip":["gz"],"application/hjson":["hjson"],"application/hyperstudio":["stk"],"application/inkml+xml":["ink","inkml"],"application/ipfix":["ipfix"],"application/java-archive":["jar","war","ear"],"application/java-serialized-object":["ser"],"application/java-vm":["class"],"application/javascript":["js","mjs"],"application/json":["json","map"],"application/json5":["json5"],"application/jsonml+json":["jsonml"],"application/ld+json":["jsonld"],"application/lost+xml":["lostxml"],"application/mac-binhex40":["hqx"],"application/mac-compactpro":["cpt"],"application/mads+xml":["mads"],"application/manifest+json":["webmanifest"],"application/marc":["mrc"],"application/marcxml+xml":["mrcx"],"application/mathematica":["ma","nb","mb"],"application/mathml+xml":["mathml"],"application/mbox":["mbox"],"application/mediaservercontrol+xml":["mscml"],"application/metalink+xml":["metalink"],"application/metalink4+xml":["meta4"],"application/mets+xml":["mets"],"application/mods+xml":["mods"],"application/mp21":["m21","mp21"],"application/mp4":["mp4s","m4p"],"application/msword":["doc","dot"],"application/mxf":["mxf"],"application/n-quads":["nq"],"application/n-triples":["nt"],"application/octet-stream":["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"],"application/oda":["oda"],"application/oebps-package+xml":["opf"],"application/ogg":["ogx"],"application/omdoc+xml":["omdoc"],"application/onenote":["onetoc","onetoc2","onetmp","onepkg"],"application/oxps":["oxps"],"application/patch-ops-error+xml":["xer"],"application/pdf":["pdf"],"application/pgp-encrypted":["pgp"],"application/pgp-signature":["asc","sig"],"application/pics-rules":["prf"],"application/pkcs10":["p10"],"application/pkcs7-mime":["p7m","p7c"],"application/pkcs7-signature":["p7s"],"application/pkcs8":["p8"],"application/pkix-attr-cert":["ac"],"application/pkix-cert":["cer"],"application/pkix-crl":["crl"],"application/pkix-pkipath":["pkipath"],"application/pkixcmp":["pki"],"application/pls+xml":["pls"],"application/postscript":["ai","eps","ps"],"application/pskc+xml":["pskcxml"],"application/raml+yaml":["raml"],"application/rdf+xml":["rdf","owl"],"application/reginfo+xml":["rif"],"application/relax-ng-compact-syntax":["rnc"],"application/resource-lists+xml":["rl"],"application/resource-lists-diff+xml":["rld"],"application/rls-services+xml":["rs"],"application/rpki-ghostbusters":["gbr"],"application/rpki-manifest":["mft"],"application/rpki-roa":["roa"],"application/rsd+xml":["rsd"],"application/rss+xml":["rss"],"application/rtf":["rtf"],"application/sbml+xml":["sbml"],"application/scvp-cv-request":["scq"],"application/scvp-cv-response":["scs"],"application/scvp-vp-request":["spq"],"application/scvp-vp-response":["spp"],"application/sdp":["sdp"],"application/set-payment-initiation":["setpay"],"application/set-registration-initiation":["setreg"],"application/shf+xml":["shf"],"application/sieve":["siv","sieve"],"application/smil+xml":["smi","smil"],"application/sparql-query":["rq"],"application/sparql-results+xml":["srx"],"application/srgs":["gram"],"application/srgs+xml":["grxml"],"application/sru+xml":["sru"],"application/ssdl+xml":["ssdl"],"application/ssml+xml":["ssml"],"application/tei+xml":["tei","teicorpus"],"application/thraud+xml":["tfi"],"application/timestamped-data":["tsd"],"application/voicexml+xml":["vxml"],"application/wasm":["wasm"],"application/widget":["wgt"],"application/winhlp":["hlp"],"application/wsdl+xml":["wsdl"],"application/wspolicy+xml":["wspolicy"],"application/xaml+xml":["xaml"],"application/xcap-diff+xml":["xdf"],"application/xenc+xml":["xenc"],"application/xhtml+xml":["xhtml","xht"],"application/xml":["xml","xsl","xsd","rng"],"application/xml-dtd":["dtd"],"application/xop+xml":["xop"],"application/xproc+xml":["xpl"],"application/xslt+xml":["xslt"],"application/xspf+xml":["xspf"],"application/xv+xml":["mxml","xhvml","xvml","xvm"],"application/yang":["yang"],"application/yin+xml":["yin"],"application/zip":["zip"],"audio/3gpp":["*3gpp"],"audio/adpcm":["adp"],"audio/basic":["au","snd"],"audio/midi":["mid","midi","kar","rmi"],"audio/mp3":["*mp3"],"audio/mp4":["m4a","mp4a"],"audio/mpeg":["mpga","mp2","mp2a","mp3","m2a","m3a"],"audio/ogg":["oga","ogg","spx"],"audio/s3m":["s3m"],"audio/silk":["sil"],"audio/wav":["wav"],"audio/wave":["*wav"],"audio/webm":["weba"],"audio/xm":["xm"],"font/collection":["ttc"],"font/otf":["otf"],"font/ttf":["ttf"],"font/woff":["woff"],"font/woff2":["woff2"],"image/aces":["exr"],"image/apng":["apng"],"image/bmp":["bmp"],"image/cgm":["cgm"],"image/dicom-rle":["drle"],"image/emf":["emf"],"image/fits":["fits"],"image/g3fax":["g3"],"image/gif":["gif"],"image/heic":["heic"],"image/heic-sequence":["heics"],"image/heif":["heif"],"image/heif-sequence":["heifs"],"image/ief":["ief"],"image/jls":["jls"],"image/jp2":["jp2","jpg2"],"image/jpeg":["jpeg","jpg","jpe"],"image/jpm":["jpm"],"image/jpx":["jpx","jpf"],"image/jxr":["jxr"],"image/ktx":["ktx"],"image/png":["png"],"image/sgi":["sgi"],"image/svg+xml":["svg","svgz"],"image/t38":["t38"],"image/tiff":["tif","tiff"],"image/tiff-fx":["tfx"],"image/webp":["webp"],"image/wmf":["wmf"],"message/disposition-notification":["disposition-notification"],"message/global":["u8msg"],"message/global-delivery-status":["u8dsn"],"message/global-disposition-notification":["u8mdn"],"message/global-headers":["u8hdr"],"message/rfc822":["eml","mime"],"model/3mf":["3mf"],"model/gltf+json":["gltf"],"model/gltf-binary":["glb"],"model/iges":["igs","iges"],"model/mesh":["msh","mesh","silo"],"model/stl":["stl"],"model/vrml":["wrl","vrml"],"model/x3d+binary":["*x3db","x3dbz"],"model/x3d+fastinfoset":["x3db"],"model/x3d+vrml":["*x3dv","x3dvz"],"model/x3d+xml":["x3d","x3dz"],"model/x3d-vrml":["x3dv"],"text/cache-manifest":["appcache","manifest"],"text/calendar":["ics","ifb"],"text/coffeescript":["coffee","litcoffee"],"text/css":["css"],"text/csv":["csv"],"text/html":["html","htm","shtml"],"text/jade":["jade"],"text/jsx":["jsx"],"text/less":["less"],"text/markdown":["markdown","md"],"text/mathml":["mml"],"text/mdx":["mdx"],"text/n3":["n3"],"text/plain":["txt","text","conf","def","list","log","in","ini"],"text/richtext":["rtx"],"text/rtf":["*rtf"],"text/sgml":["sgml","sgm"],"text/shex":["shex"],"text/slim":["slim","slm"],"text/stylus":["stylus","styl"],"text/tab-separated-values":["tsv"],"text/troff":["t","tr","roff","man","me","ms"],"text/turtle":["ttl"],"text/uri-list":["uri","uris","urls"],"text/vcard":["vcard"],"text/vtt":["vtt"],"text/xml":["*xml"],"text/yaml":["yaml","yml"],"video/3gpp":["3gp","3gpp"],"video/3gpp2":["3g2"],"video/h261":["h261"],"video/h263":["h263"],"video/h264":["h264"],"video/jpeg":["jpgv"],"video/jpm":["*jpm","jpgm"],"video/mj2":["mj2","mjp2"],"video/mp2t":["ts"],"video/mp4":["mp4","mp4v","mpg4"],"video/mpeg":["mpeg","mpg","mpe","m1v","m2v"],"video/ogg":["ogv"],"video/quicktime":["qt","mov"],"video/webm":["webm"]};

var lite = new Mime_1(standard);

function get_server_route_handler(routes) {
	async function handle_route(route, req, res, next) {
		req.params = route.params(route.pattern.exec(req.path));

		const method = req.method.toLowerCase();
		// 'delete' cannot be exported from a module because it is a keyword,
		// so check for 'del' instead
		const method_export = method === 'delete' ? 'del' : method;
		const handle_method = route.handlers[method_export];
		if (handle_method) {
			if (process.env.SAPPER_EXPORT) {
				const { write, end, setHeader } = res;
				const chunks = [];
				const headers = {};

				// intercept data so that it can be exported
				res.write = function(chunk) {
					chunks.push(Buffer.from(chunk));
					write.apply(res, arguments);
				};

				res.setHeader = function(name, value) {
					headers[name.toLowerCase()] = value;
					setHeader.apply(res, arguments);
				};

				res.end = function(chunk) {
					if (chunk) chunks.push(Buffer.from(chunk));
					end.apply(res, arguments);

					process.send({
						__sapper__: true,
						event: 'file',
						url: req.url,
						method: req.method,
						status: res.statusCode,
						type: headers['content-type'],
						body: Buffer.concat(chunks).toString()
					});
				};
			}

			const handle_next = (err) => {
				if (err) {
					res.statusCode = 500;
					res.end(err.message);
				} else {
					process.nextTick(next);
				}
			};

			try {
				await handle_method(req, res, handle_next);
			} catch (err) {
				console.error(err);
				handle_next(err);
			}
		} else {
			// no matching handler for method
			process.nextTick(next);
		}
	}

	return function find_route(req, res, next) {
		for (const route of routes) {
			if (route.pattern.test(req.path)) {
				handle_route(route, req, res, next);
				return;
			}
		}

		next();
	};
}

/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module exports.
 * @public
 */

var parse_1 = parse;
var serialize_1 = serialize;

/**
 * Module variables.
 * @private
 */

var decode = decodeURIComponent;
var encode = encodeURIComponent;
var pairSplitRegExp = /; */;

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */

function parse(str, options) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  var obj = {};
  var opt = options || {};
  var pairs = str.split(pairSplitRegExp);
  var dec = opt.decode || decode;

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var eq_idx = pair.indexOf('=');

    // skip things that don't look like key=value
    if (eq_idx < 0) {
      continue;
    }

    var key = pair.substr(0, eq_idx).trim();
    var val = pair.substr(++eq_idx, pair.length).trim();

    // quoted values
    if ('"' == val[0]) {
      val = val.slice(1, -1);
    }

    // only assign once
    if (undefined == obj[key]) {
      obj[key] = tryDecode(val, dec);
    }
  }

  return obj;
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */

function serialize(name, val, options) {
  var opt = options || {};
  var enc = opt.encode || encode;

  if (typeof enc !== 'function') {
    throw new TypeError('option encode is invalid');
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid');
  }

  var value = enc(val);

  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError('argument val is invalid');
  }

  var str = name + '=' + value;

  if (null != opt.maxAge) {
    var maxAge = opt.maxAge - 0;
    if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
    str += '; Max-Age=' + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError('option domain is invalid');
    }

    str += '; Domain=' + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError('option path is invalid');
    }

    str += '; Path=' + opt.path;
  }

  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== 'function') {
      throw new TypeError('option expires is invalid');
    }

    str += '; Expires=' + opt.expires.toUTCString();
  }

  if (opt.httpOnly) {
    str += '; HttpOnly';
  }

  if (opt.secure) {
    str += '; Secure';
  }

  if (opt.sameSite) {
    var sameSite = typeof opt.sameSite === 'string'
      ? opt.sameSite.toLowerCase() : opt.sameSite;

    switch (sameSite) {
      case true:
        str += '; SameSite=Strict';
        break;
      case 'lax':
        str += '; SameSite=Lax';
        break;
      case 'strict':
        str += '; SameSite=Strict';
        break;
      case 'none':
        str += '; SameSite=None';
        break;
      default:
        throw new TypeError('option sameSite is invalid');
    }
  }

  return str;
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */

function tryDecode(str, decode) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}

var cookie = {
	parse: parse_1,
	serialize: serialize_1
};

var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
    '<': '\\u003C',
    '>': '\\u003E',
    '/': '\\u002F',
    '\\': '\\\\',
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\0': '\\0',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join('\0');
function devalue(value) {
    var counts = new Map();
    function walk(thing) {
        if (typeof thing === 'function') {
            throw new Error("Cannot stringify a function");
        }
        if (counts.has(thing)) {
            counts.set(thing, counts.get(thing) + 1);
            return;
        }
        counts.set(thing, 1);
        if (!isPrimitive(thing)) {
            var type = getType(thing);
            switch (type) {
                case 'Number':
                case 'String':
                case 'Boolean':
                case 'Date':
                case 'RegExp':
                    return;
                case 'Array':
                    thing.forEach(walk);
                    break;
                case 'Set':
                case 'Map':
                    Array.from(thing).forEach(walk);
                    break;
                default:
                    var proto = Object.getPrototypeOf(thing);
                    if (proto !== Object.prototype &&
                        proto !== null &&
                        Object.getOwnPropertyNames(proto).sort().join('\0') !== objectProtoOwnPropertyNames) {
                        throw new Error("Cannot stringify arbitrary non-POJOs");
                    }
                    if (Object.getOwnPropertySymbols(thing).length > 0) {
                        throw new Error("Cannot stringify POJOs with symbolic keys");
                    }
                    Object.keys(thing).forEach(function (key) { return walk(thing[key]); });
            }
        }
    }
    walk(value);
    var names = new Map();
    Array.from(counts)
        .filter(function (entry) { return entry[1] > 1; })
        .sort(function (a, b) { return b[1] - a[1]; })
        .forEach(function (entry, i) {
        names.set(entry[0], getName(i));
    });
    function stringify(thing) {
        if (names.has(thing)) {
            return names.get(thing);
        }
        if (isPrimitive(thing)) {
            return stringifyPrimitive(thing);
        }
        var type = getType(thing);
        switch (type) {
            case 'Number':
            case 'String':
            case 'Boolean':
                return "Object(" + stringify(thing.valueOf()) + ")";
            case 'RegExp':
                return thing.toString();
            case 'Date':
                return "new Date(" + thing.getTime() + ")";
            case 'Array':
                var members = thing.map(function (v, i) { return i in thing ? stringify(v) : ''; });
                var tail = thing.length === 0 || (thing.length - 1 in thing) ? '' : ',';
                return "[" + members.join(',') + tail + "]";
            case 'Set':
            case 'Map':
                return "new " + type + "([" + Array.from(thing).map(stringify).join(',') + "])";
            default:
                var obj = "{" + Object.keys(thing).map(function (key) { return safeKey(key) + ":" + stringify(thing[key]); }).join(',') + "}";
                var proto = Object.getPrototypeOf(thing);
                if (proto === null) {
                    return Object.keys(thing).length > 0
                        ? "Object.assign(Object.create(null)," + obj + ")"
                        : "Object.create(null)";
                }
                return obj;
        }
    }
    var str = stringify(value);
    if (names.size) {
        var params_1 = [];
        var statements_1 = [];
        var values_1 = [];
        names.forEach(function (name, thing) {
            params_1.push(name);
            if (isPrimitive(thing)) {
                values_1.push(stringifyPrimitive(thing));
                return;
            }
            var type = getType(thing);
            switch (type) {
                case 'Number':
                case 'String':
                case 'Boolean':
                    values_1.push("Object(" + stringify(thing.valueOf()) + ")");
                    break;
                case 'RegExp':
                    values_1.push(thing.toString());
                    break;
                case 'Date':
                    values_1.push("new Date(" + thing.getTime() + ")");
                    break;
                case 'Array':
                    values_1.push("Array(" + thing.length + ")");
                    thing.forEach(function (v, i) {
                        statements_1.push(name + "[" + i + "]=" + stringify(v));
                    });
                    break;
                case 'Set':
                    values_1.push("new Set");
                    statements_1.push(name + "." + Array.from(thing).map(function (v) { return "add(" + stringify(v) + ")"; }).join('.'));
                    break;
                case 'Map':
                    values_1.push("new Map");
                    statements_1.push(name + "." + Array.from(thing).map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return "set(" + stringify(k) + ", " + stringify(v) + ")";
                    }).join('.'));
                    break;
                default:
                    values_1.push(Object.getPrototypeOf(thing) === null ? 'Object.create(null)' : '{}');
                    Object.keys(thing).forEach(function (key) {
                        statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
                    });
            }
        });
        statements_1.push("return " + str);
        return "(function(" + params_1.join(',') + "){" + statements_1.join(';') + "}(" + values_1.join(',') + "))";
    }
    else {
        return str;
    }
}
function getName(num) {
    var name = '';
    do {
        name = chars[num % chars.length] + name;
        num = ~~(num / chars.length) - 1;
    } while (num >= 0);
    return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
    return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
    if (typeof thing === 'string')
        return stringifyString(thing);
    if (thing === void 0)
        return 'void 0';
    if (thing === 0 && 1 / thing < 0)
        return '-0';
    var str = String(thing);
    if (typeof thing === 'number')
        return str.replace(/^(-)?0\./, '$1.');
    return str;
}
function getType(thing) {
    return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
    return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
    return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
    return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
    return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
    var result = '"';
    for (var i = 0; i < str.length; i += 1) {
        var char = str.charAt(i);
        var code = char.charCodeAt(0);
        if (char === '"') {
            result += '\\"';
        }
        else if (char in escaped$1) {
            result += escaped$1[char];
        }
        else if (code >= 0xd800 && code <= 0xdfff) {
            var next = str.charCodeAt(i + 1);
            // If this is the beginning of a [high, low] surrogate pair,
            // add the next two characters, otherwise escape
            if (code <= 0xdbff && (next >= 0xdc00 && next <= 0xdfff)) {
                result += char + str[++i];
            }
            else {
                result += "\\u" + code.toString(16).toUpperCase();
            }
        }
        else {
            result += char;
        }
    }
    result += '"';
    return result;
}

// Based on https://github.com/tmpvar/jsdom/blob/aa85b2abf07766ff7bf5c1f6daafb3726f2f2db5/lib/jsdom/living/blob.js

// fix for "Readable" isn't a named export issue
const Readable = Stream.Readable;

const BUFFER = Symbol('buffer');
const TYPE = Symbol('type');

class Blob {
	constructor() {
		this[TYPE] = '';

		const blobParts = arguments[0];
		const options = arguments[1];

		const buffers = [];
		let size = 0;

		if (blobParts) {
			const a = blobParts;
			const length = Number(a.length);
			for (let i = 0; i < length; i++) {
				const element = a[i];
				let buffer;
				if (element instanceof Buffer) {
					buffer = element;
				} else if (ArrayBuffer.isView(element)) {
					buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
				} else if (element instanceof ArrayBuffer) {
					buffer = Buffer.from(element);
				} else if (element instanceof Blob) {
					buffer = element[BUFFER];
				} else {
					buffer = Buffer.from(typeof element === 'string' ? element : String(element));
				}
				size += buffer.length;
				buffers.push(buffer);
			}
		}

		this[BUFFER] = Buffer.concat(buffers);

		let type = options && options.type !== undefined && String(options.type).toLowerCase();
		if (type && !/[^\u0020-\u007E]/.test(type)) {
			this[TYPE] = type;
		}
	}
	get size() {
		return this[BUFFER].length;
	}
	get type() {
		return this[TYPE];
	}
	text() {
		return Promise.resolve(this[BUFFER].toString());
	}
	arrayBuffer() {
		const buf = this[BUFFER];
		const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		return Promise.resolve(ab);
	}
	stream() {
		const readable = new Readable();
		readable._read = function () {};
		readable.push(this[BUFFER]);
		readable.push(null);
		return readable;
	}
	toString() {
		return '[object Blob]';
	}
	slice() {
		const size = this.size;

		const start = arguments[0];
		const end = arguments[1];
		let relativeStart, relativeEnd;
		if (start === undefined) {
			relativeStart = 0;
		} else if (start < 0) {
			relativeStart = Math.max(size + start, 0);
		} else {
			relativeStart = Math.min(start, size);
		}
		if (end === undefined) {
			relativeEnd = size;
		} else if (end < 0) {
			relativeEnd = Math.max(size + end, 0);
		} else {
			relativeEnd = Math.min(end, size);
		}
		const span = Math.max(relativeEnd - relativeStart, 0);

		const buffer = this[BUFFER];
		const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
		const blob = new Blob([], { type: arguments[2] });
		blob[BUFFER] = slicedBuffer;
		return blob;
	}
}

Object.defineProperties(Blob.prototype, {
	size: { enumerable: true },
	type: { enumerable: true },
	slice: { enumerable: true }
});

Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
	value: 'Blob',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * fetch-error.js
 *
 * FetchError interface for operational errors
 */

/**
 * Create FetchError instance
 *
 * @param   String      message      Error message for human
 * @param   String      type         Error type for machine
 * @param   String      systemError  For Node.js system error
 * @return  FetchError
 */
function FetchError(message, type, systemError) {
  Error.call(this, message);

  this.message = message;
  this.type = type;

  // when err.type is `system`, err.code contains system error code
  if (systemError) {
    this.code = this.errno = systemError.code;
  }

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;
FetchError.prototype.name = 'FetchError';

let convert;
try {
	convert = require('encoding').convert;
} catch (e) {}

const INTERNALS = Symbol('Body internals');

// fix an issue where "PassThrough" isn't a named export for node <10
const PassThrough = Stream.PassThrough;

/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
function Body(body) {
	var _this = this;

	var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
	    _ref$size = _ref.size;

	let size = _ref$size === undefined ? 0 : _ref$size;
	var _ref$timeout = _ref.timeout;
	let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

	if (body == null) {
		// body is undefined or null
		body = null;
	} else if (isURLSearchParams(body)) {
		// body is a URLSearchParams
		body = Buffer.from(body.toString());
	} else if (isBlob(body)) ; else if (Buffer.isBuffer(body)) ; else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		body = Buffer.from(body);
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
	} else if (body instanceof Stream) ; else {
		// none of the above
		// coerce to string then buffer
		body = Buffer.from(String(body));
	}
	this[INTERNALS] = {
		body,
		disturbed: false,
		error: null
	};
	this.size = size;
	this.timeout = timeout;

	if (body instanceof Stream) {
		body.on('error', function (err) {
			const error = err.name === 'AbortError' ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, 'system', err);
			_this[INTERNALS].error = error;
		});
	}
}

Body.prototype = {
	get body() {
		return this[INTERNALS].body;
	},

	get bodyUsed() {
		return this[INTERNALS].disturbed;
	},

	/**
  * Decode response as ArrayBuffer
  *
  * @return  Promise
  */
	arrayBuffer() {
		return consumeBody.call(this).then(function (buf) {
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		});
	},

	/**
  * Return raw response as Blob
  *
  * @return Promise
  */
	blob() {
		let ct = this.headers && this.headers.get('content-type') || '';
		return consumeBody.call(this).then(function (buf) {
			return Object.assign(
			// Prevent copying
			new Blob([], {
				type: ct.toLowerCase()
			}), {
				[BUFFER]: buf
			});
		});
	},

	/**
  * Decode response as json
  *
  * @return  Promise
  */
	json() {
		var _this2 = this;

		return consumeBody.call(this).then(function (buffer) {
			try {
				return JSON.parse(buffer.toString());
			} catch (err) {
				return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, 'invalid-json'));
			}
		});
	},

	/**
  * Decode response as text
  *
  * @return  Promise
  */
	text() {
		return consumeBody.call(this).then(function (buffer) {
			return buffer.toString();
		});
	},

	/**
  * Decode response as buffer (non-spec api)
  *
  * @return  Promise
  */
	buffer() {
		return consumeBody.call(this);
	},

	/**
  * Decode response as text, while automatically detecting the encoding and
  * trying to decode to UTF-8 (non-spec api)
  *
  * @return  Promise
  */
	textConverted() {
		var _this3 = this;

		return consumeBody.call(this).then(function (buffer) {
			return convertBody(buffer, _this3.headers);
		});
	}
};

// In browsers, all properties are enumerable.
Object.defineProperties(Body.prototype, {
	body: { enumerable: true },
	bodyUsed: { enumerable: true },
	arrayBuffer: { enumerable: true },
	blob: { enumerable: true },
	json: { enumerable: true },
	text: { enumerable: true }
});

Body.mixIn = function (proto) {
	for (const name of Object.getOwnPropertyNames(Body.prototype)) {
		// istanbul ignore else: future proof
		if (!(name in proto)) {
			const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
			Object.defineProperty(proto, name, desc);
		}
	}
};

/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return  Promise
 */
function consumeBody() {
	var _this4 = this;

	if (this[INTERNALS].disturbed) {
		return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
	}

	this[INTERNALS].disturbed = true;

	if (this[INTERNALS].error) {
		return Body.Promise.reject(this[INTERNALS].error);
	}

	let body = this.body;

	// body is null
	if (body === null) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is blob
	if (isBlob(body)) {
		body = body.stream();
	}

	// body is buffer
	if (Buffer.isBuffer(body)) {
		return Body.Promise.resolve(body);
	}

	// istanbul ignore if: should never happen
	if (!(body instanceof Stream)) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is stream
	// get ready to actually consume the body
	let accum = [];
	let accumBytes = 0;
	let abort = false;

	return new Body.Promise(function (resolve, reject) {
		let resTimeout;

		// allow timeout on slow response body
		if (_this4.timeout) {
			resTimeout = setTimeout(function () {
				abort = true;
				reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, 'body-timeout'));
			}, _this4.timeout);
		}

		// handle stream errors
		body.on('error', function (err) {
			if (err.name === 'AbortError') {
				// if the request was aborted, reject with this Error
				abort = true;
				reject(err);
			} else {
				// other errors, such as incorrect content-encoding
				reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, 'system', err));
			}
		});

		body.on('data', function (chunk) {
			if (abort || chunk === null) {
				return;
			}

			if (_this4.size && accumBytes + chunk.length > _this4.size) {
				abort = true;
				reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, 'max-size'));
				return;
			}

			accumBytes += chunk.length;
			accum.push(chunk);
		});

		body.on('end', function () {
			if (abort) {
				return;
			}

			clearTimeout(resTimeout);

			try {
				resolve(Buffer.concat(accum, accumBytes));
			} catch (err) {
				// handle streams that have accumulated too much data (issue #414)
				reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, 'system', err));
			}
		});
	});
}

/**
 * Detect buffer encoding and convert to target encoding
 * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
 *
 * @param   Buffer  buffer    Incoming buffer
 * @param   String  encoding  Target encoding
 * @return  String
 */
function convertBody(buffer, headers) {
	if (typeof convert !== 'function') {
		throw new Error('The package `encoding` must be installed to use the textConverted() function');
	}

	const ct = headers.get('content-type');
	let charset = 'utf-8';
	let res, str;

	// header
	if (ct) {
		res = /charset=([^;]*)/i.exec(ct);
	}

	// no charset in content type, peek at response body for at most 1024 bytes
	str = buffer.slice(0, 1024).toString();

	// html5
	if (!res && str) {
		res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
	}

	// html4
	if (!res && str) {
		res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);

		if (res) {
			res = /charset=(.*)/i.exec(res.pop());
		}
	}

	// xml
	if (!res && str) {
		res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
	}

	// found charset
	if (res) {
		charset = res.pop();

		// prevent decode issues when sites use incorrect encoding
		// ref: https://hsivonen.fi/encoding-menu/
		if (charset === 'gb2312' || charset === 'gbk') {
			charset = 'gb18030';
		}
	}

	// turn raw buffers into a single utf-8 buffer
	return convert(buffer, 'UTF-8', charset).toString();
}

/**
 * Detect a URLSearchParams object
 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
 *
 * @param   Object  obj     Object to detect by type or brand
 * @return  String
 */
function isURLSearchParams(obj) {
	// Duck-typing as a necessary condition.
	if (typeof obj !== 'object' || typeof obj.append !== 'function' || typeof obj.delete !== 'function' || typeof obj.get !== 'function' || typeof obj.getAll !== 'function' || typeof obj.has !== 'function' || typeof obj.set !== 'function') {
		return false;
	}

	// Brand-checking and more duck-typing as optional condition.
	return obj.constructor.name === 'URLSearchParams' || Object.prototype.toString.call(obj) === '[object URLSearchParams]' || typeof obj.sort === 'function';
}

/**
 * Check if `obj` is a W3C `Blob` object (which `File` inherits from)
 * @param  {*} obj
 * @return {boolean}
 */
function isBlob(obj) {
	return typeof obj === 'object' && typeof obj.arrayBuffer === 'function' && typeof obj.type === 'string' && typeof obj.stream === 'function' && typeof obj.constructor === 'function' && typeof obj.constructor.name === 'string' && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
}

/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed  instance  Response or Request instance
 * @return  Mixed
 */
function clone(instance) {
	let p1, p2;
	let body = instance.body;

	// don't allow cloning a used body
	if (instance.bodyUsed) {
		throw new Error('cannot clone body after it is used');
	}

	// check that body is a stream and not form-data object
	// note: we can't clone the form-data object without having it as a dependency
	if (body instanceof Stream && typeof body.getBoundary !== 'function') {
		// tee instance body
		p1 = new PassThrough();
		p2 = new PassThrough();
		body.pipe(p1);
		body.pipe(p2);
		// set instance body to teed body and return the other teed body
		instance[INTERNALS].body = p1;
		body = p2;
	}

	return body;
}

/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param   Mixed  instance  Any options.body input
 */
function extractContentType(body) {
	if (body === null) {
		// body is null
		return null;
	} else if (typeof body === 'string') {
		// body is string
		return 'text/plain;charset=UTF-8';
	} else if (isURLSearchParams(body)) {
		// body is a URLSearchParams
		return 'application/x-www-form-urlencoded;charset=UTF-8';
	} else if (isBlob(body)) {
		// body is blob
		return body.type || null;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return null;
	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		return null;
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		return null;
	} else if (typeof body.getBoundary === 'function') {
		// detect form data input from form-data module
		return `multipart/form-data;boundary=${body.getBoundary()}`;
	} else if (body instanceof Stream) {
		// body is stream
		// can't really do much about this
		return null;
	} else {
		// Body constructor defaults other things to string
		return 'text/plain;charset=UTF-8';
	}
}

/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param   Body    instance   Instance of Body
 * @return  Number?            Number of bytes, or null if not possible
 */
function getTotalBytes(instance) {
	const body = instance.body;


	if (body === null) {
		// body is null
		return 0;
	} else if (isBlob(body)) {
		return body.size;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return body.length;
	} else if (body && typeof body.getLengthSync === 'function') {
		// detect form data input from form-data module
		if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || // 1.x
		body.hasKnownLength && body.hasKnownLength()) {
			// 2.x
			return body.getLengthSync();
		}
		return null;
	} else {
		// body is stream
		return null;
	}
}

/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param   Body    instance   Instance of Body
 * @return  Void
 */
function writeToStream(dest, instance) {
	const body = instance.body;


	if (body === null) {
		// body is null
		dest.end();
	} else if (isBlob(body)) {
		body.stream().pipe(dest);
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		dest.write(body);
		dest.end();
	} else {
		// body is stream
		body.pipe(dest);
	}
}

// expose Promise
Body.Promise = global.Promise;

/**
 * headers.js
 *
 * Headers class offers convenient helpers
 */

const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

function validateName(name) {
	name = `${name}`;
	if (invalidTokenRegex.test(name) || name === '') {
		throw new TypeError(`${name} is not a legal HTTP header name`);
	}
}

function validateValue(value) {
	value = `${value}`;
	if (invalidHeaderCharRegex.test(value)) {
		throw new TypeError(`${value} is not a legal HTTP header value`);
	}
}

/**
 * Find the key in the map object given a header name.
 *
 * Returns undefined if not found.
 *
 * @param   String  name  Header name
 * @return  String|Undefined
 */
function find(map, name) {
	name = name.toLowerCase();
	for (const key in map) {
		if (key.toLowerCase() === name) {
			return key;
		}
	}
	return undefined;
}

const MAP = Symbol('map');
class Headers {
	/**
  * Headers class
  *
  * @param   Object  headers  Response headers
  * @return  Void
  */
	constructor() {
		let init = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

		this[MAP] = Object.create(null);

		if (init instanceof Headers) {
			const rawHeaders = init.raw();
			const headerNames = Object.keys(rawHeaders);

			for (const headerName of headerNames) {
				for (const value of rawHeaders[headerName]) {
					this.append(headerName, value);
				}
			}

			return;
		}

		// We don't worry about converting prop to ByteString here as append()
		// will handle it.
		if (init == null) ; else if (typeof init === 'object') {
			const method = init[Symbol.iterator];
			if (method != null) {
				if (typeof method !== 'function') {
					throw new TypeError('Header pairs must be iterable');
				}

				// sequence<sequence<ByteString>>
				// Note: per spec we have to first exhaust the lists then process them
				const pairs = [];
				for (const pair of init) {
					if (typeof pair !== 'object' || typeof pair[Symbol.iterator] !== 'function') {
						throw new TypeError('Each header pair must be iterable');
					}
					pairs.push(Array.from(pair));
				}

				for (const pair of pairs) {
					if (pair.length !== 2) {
						throw new TypeError('Each header pair must be a name/value tuple');
					}
					this.append(pair[0], pair[1]);
				}
			} else {
				// record<ByteString, ByteString>
				for (const key of Object.keys(init)) {
					const value = init[key];
					this.append(key, value);
				}
			}
		} else {
			throw new TypeError('Provided initializer must be an object');
		}
	}

	/**
  * Return combined header value given name
  *
  * @param   String  name  Header name
  * @return  Mixed
  */
	get(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key === undefined) {
			return null;
		}

		return this[MAP][key].join(', ');
	}

	/**
  * Iterate over all headers
  *
  * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
  * @param   Boolean   thisArg   `this` context for callback function
  * @return  Void
  */
	forEach(callback) {
		let thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

		let pairs = getHeaders(this);
		let i = 0;
		while (i < pairs.length) {
			var _pairs$i = pairs[i];
			const name = _pairs$i[0],
			      value = _pairs$i[1];

			callback.call(thisArg, value, name, this);
			pairs = getHeaders(this);
			i++;
		}
	}

	/**
  * Overwrite header values given name
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	set(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		this[MAP][key !== undefined ? key : name] = [value];
	}

	/**
  * Append a value onto existing header
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	append(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			this[MAP][key].push(value);
		} else {
			this[MAP][name] = [value];
		}
	}

	/**
  * Check for header name existence
  *
  * @param   String   name  Header name
  * @return  Boolean
  */
	has(name) {
		name = `${name}`;
		validateName(name);
		return find(this[MAP], name) !== undefined;
	}

	/**
  * Delete all header values given name
  *
  * @param   String  name  Header name
  * @return  Void
  */
	delete(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			delete this[MAP][key];
		}
	}

	/**
  * Return raw headers (non-spec api)
  *
  * @return  Object
  */
	raw() {
		return this[MAP];
	}

	/**
  * Get an iterator on keys.
  *
  * @return  Iterator
  */
	keys() {
		return createHeadersIterator(this, 'key');
	}

	/**
  * Get an iterator on values.
  *
  * @return  Iterator
  */
	values() {
		return createHeadersIterator(this, 'value');
	}

	/**
  * Get an iterator on entries.
  *
  * This is the default iterator of the Headers object.
  *
  * @return  Iterator
  */
	[Symbol.iterator]() {
		return createHeadersIterator(this, 'key+value');
	}
}
Headers.prototype.entries = Headers.prototype[Symbol.iterator];

Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
	value: 'Headers',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Headers.prototype, {
	get: { enumerable: true },
	forEach: { enumerable: true },
	set: { enumerable: true },
	append: { enumerable: true },
	has: { enumerable: true },
	delete: { enumerable: true },
	keys: { enumerable: true },
	values: { enumerable: true },
	entries: { enumerable: true }
});

function getHeaders(headers) {
	let kind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'key+value';

	const keys = Object.keys(headers[MAP]).sort();
	return keys.map(kind === 'key' ? function (k) {
		return k.toLowerCase();
	} : kind === 'value' ? function (k) {
		return headers[MAP][k].join(', ');
	} : function (k) {
		return [k.toLowerCase(), headers[MAP][k].join(', ')];
	});
}

const INTERNAL = Symbol('internal');

function createHeadersIterator(target, kind) {
	const iterator = Object.create(HeadersIteratorPrototype);
	iterator[INTERNAL] = {
		target,
		kind,
		index: 0
	};
	return iterator;
}

const HeadersIteratorPrototype = Object.setPrototypeOf({
	next() {
		// istanbul ignore if
		if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
			throw new TypeError('Value of `this` is not a HeadersIterator');
		}

		var _INTERNAL = this[INTERNAL];
		const target = _INTERNAL.target,
		      kind = _INTERNAL.kind,
		      index = _INTERNAL.index;

		const values = getHeaders(target, kind);
		const len = values.length;
		if (index >= len) {
			return {
				value: undefined,
				done: true
			};
		}

		this[INTERNAL].index = index + 1;

		return {
			value: values[index],
			done: false
		};
	}
}, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));

Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
	value: 'HeadersIterator',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * Export the Headers object in a form that Node.js can consume.
 *
 * @param   Headers  headers
 * @return  Object
 */
function exportNodeCompatibleHeaders(headers) {
	const obj = Object.assign({ __proto__: null }, headers[MAP]);

	// http.request() only supports string as Host header. This hack makes
	// specifying custom Host header possible.
	const hostHeaderKey = find(headers[MAP], 'Host');
	if (hostHeaderKey !== undefined) {
		obj[hostHeaderKey] = obj[hostHeaderKey][0];
	}

	return obj;
}

/**
 * Create a Headers object from an object of headers, ignoring those that do
 * not conform to HTTP grammar productions.
 *
 * @param   Object  obj  Object of headers
 * @return  Headers
 */
function createHeadersLenient(obj) {
	const headers = new Headers();
	for (const name of Object.keys(obj)) {
		if (invalidTokenRegex.test(name)) {
			continue;
		}
		if (Array.isArray(obj[name])) {
			for (const val of obj[name]) {
				if (invalidHeaderCharRegex.test(val)) {
					continue;
				}
				if (headers[MAP][name] === undefined) {
					headers[MAP][name] = [val];
				} else {
					headers[MAP][name].push(val);
				}
			}
		} else if (!invalidHeaderCharRegex.test(obj[name])) {
			headers[MAP][name] = [obj[name]];
		}
	}
	return headers;
}

const INTERNALS$1 = Symbol('Response internals');

// fix an issue where "STATUS_CODES" aren't a named export for node <10
const STATUS_CODES = http.STATUS_CODES;

/**
 * Response class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Response {
	constructor() {
		let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		Body.call(this, body, opts);

		const status = opts.status || 200;
		const headers = new Headers(opts.headers);

		if (body != null && !headers.has('Content-Type')) {
			const contentType = extractContentType(body);
			if (contentType) {
				headers.append('Content-Type', contentType);
			}
		}

		this[INTERNALS$1] = {
			url: opts.url,
			status,
			statusText: opts.statusText || STATUS_CODES[status],
			headers,
			counter: opts.counter
		};
	}

	get url() {
		return this[INTERNALS$1].url || '';
	}

	get status() {
		return this[INTERNALS$1].status;
	}

	/**
  * Convenience property representing if the request ended normally
  */
	get ok() {
		return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
	}

	get redirected() {
		return this[INTERNALS$1].counter > 0;
	}

	get statusText() {
		return this[INTERNALS$1].statusText;
	}

	get headers() {
		return this[INTERNALS$1].headers;
	}

	/**
  * Clone this response
  *
  * @return  Response
  */
	clone() {
		return new Response(clone(this), {
			url: this.url,
			status: this.status,
			statusText: this.statusText,
			headers: this.headers,
			ok: this.ok,
			redirected: this.redirected
		});
	}
}

Body.mixIn(Response.prototype);

Object.defineProperties(Response.prototype, {
	url: { enumerable: true },
	status: { enumerable: true },
	ok: { enumerable: true },
	redirected: { enumerable: true },
	statusText: { enumerable: true },
	headers: { enumerable: true },
	clone: { enumerable: true }
});

Object.defineProperty(Response.prototype, Symbol.toStringTag, {
	value: 'Response',
	writable: false,
	enumerable: false,
	configurable: true
});

const INTERNALS$2 = Symbol('Request internals');

// fix an issue where "format", "parse" aren't a named export for node <10
const parse_url = Url.parse;
const format_url = Url.format;

const streamDestructionSupported = 'destroy' in Stream.Readable.prototype;

/**
 * Check if a value is an instance of Request.
 *
 * @param   Mixed   input
 * @return  Boolean
 */
function isRequest(input) {
	return typeof input === 'object' && typeof input[INTERNALS$2] === 'object';
}

function isAbortSignal(signal) {
	const proto = signal && typeof signal === 'object' && Object.getPrototypeOf(signal);
	return !!(proto && proto.constructor.name === 'AbortSignal');
}

/**
 * Request class
 *
 * @param   Mixed   input  Url or Request instance
 * @param   Object  init   Custom options
 * @return  Void
 */
class Request {
	constructor(input) {
		let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		let parsedURL;

		// normalize input
		if (!isRequest(input)) {
			if (input && input.href) {
				// in order to support Node.js' Url objects; though WHATWG's URL objects
				// will fall into this branch also (since their `toString()` will return
				// `href` property anyway)
				parsedURL = parse_url(input.href);
			} else {
				// coerce input to a string before attempting to parse
				parsedURL = parse_url(`${input}`);
			}
			input = {};
		} else {
			parsedURL = parse_url(input.url);
		}

		let method = init.method || input.method || 'GET';
		method = method.toUpperCase();

		if ((init.body != null || isRequest(input) && input.body !== null) && (method === 'GET' || method === 'HEAD')) {
			throw new TypeError('Request with GET/HEAD method cannot have body');
		}

		let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;

		Body.call(this, inputBody, {
			timeout: init.timeout || input.timeout || 0,
			size: init.size || input.size || 0
		});

		const headers = new Headers(init.headers || input.headers || {});

		if (inputBody != null && !headers.has('Content-Type')) {
			const contentType = extractContentType(inputBody);
			if (contentType) {
				headers.append('Content-Type', contentType);
			}
		}

		let signal = isRequest(input) ? input.signal : null;
		if ('signal' in init) signal = init.signal;

		if (signal != null && !isAbortSignal(signal)) {
			throw new TypeError('Expected signal to be an instanceof AbortSignal');
		}

		this[INTERNALS$2] = {
			method,
			redirect: init.redirect || input.redirect || 'follow',
			headers,
			parsedURL,
			signal
		};

		// node-fetch-only options
		this.follow = init.follow !== undefined ? init.follow : input.follow !== undefined ? input.follow : 20;
		this.compress = init.compress !== undefined ? init.compress : input.compress !== undefined ? input.compress : true;
		this.counter = init.counter || input.counter || 0;
		this.agent = init.agent || input.agent;
	}

	get method() {
		return this[INTERNALS$2].method;
	}

	get url() {
		return format_url(this[INTERNALS$2].parsedURL);
	}

	get headers() {
		return this[INTERNALS$2].headers;
	}

	get redirect() {
		return this[INTERNALS$2].redirect;
	}

	get signal() {
		return this[INTERNALS$2].signal;
	}

	/**
  * Clone this request
  *
  * @return  Request
  */
	clone() {
		return new Request(this);
	}
}

Body.mixIn(Request.prototype);

Object.defineProperty(Request.prototype, Symbol.toStringTag, {
	value: 'Request',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Request.prototype, {
	method: { enumerable: true },
	url: { enumerable: true },
	headers: { enumerable: true },
	redirect: { enumerable: true },
	clone: { enumerable: true },
	signal: { enumerable: true }
});

/**
 * Convert a Request to Node.js http request options.
 *
 * @param   Request  A Request instance
 * @return  Object   The options object to be passed to http.request
 */
function getNodeRequestOptions(request) {
	const parsedURL = request[INTERNALS$2].parsedURL;
	const headers = new Headers(request[INTERNALS$2].headers);

	// fetch step 1.3
	if (!headers.has('Accept')) {
		headers.set('Accept', '*/*');
	}

	// Basic fetch
	if (!parsedURL.protocol || !parsedURL.hostname) {
		throw new TypeError('Only absolute URLs are supported');
	}

	if (!/^https?:$/.test(parsedURL.protocol)) {
		throw new TypeError('Only HTTP(S) protocols are supported');
	}

	if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) {
		throw new Error('Cancellation of streamed requests with AbortSignal is not supported in node < 8');
	}

	// HTTP-network-or-cache fetch steps 2.4-2.7
	let contentLengthValue = null;
	if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
		contentLengthValue = '0';
	}
	if (request.body != null) {
		const totalBytes = getTotalBytes(request);
		if (typeof totalBytes === 'number') {
			contentLengthValue = String(totalBytes);
		}
	}
	if (contentLengthValue) {
		headers.set('Content-Length', contentLengthValue);
	}

	// HTTP-network-or-cache fetch step 2.11
	if (!headers.has('User-Agent')) {
		headers.set('User-Agent', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)');
	}

	// HTTP-network-or-cache fetch step 2.15
	if (request.compress && !headers.has('Accept-Encoding')) {
		headers.set('Accept-Encoding', 'gzip,deflate');
	}

	let agent = request.agent;
	if (typeof agent === 'function') {
		agent = agent(parsedURL);
	}

	if (!headers.has('Connection') && !agent) {
		headers.set('Connection', 'close');
	}

	// HTTP-network fetch step 4.2
	// chunked encoding is handled by Node.js

	return Object.assign({}, parsedURL, {
		method: request.method,
		headers: exportNodeCompatibleHeaders(headers),
		agent
	});
}

/**
 * abort-error.js
 *
 * AbortError interface for cancelled requests
 */

/**
 * Create AbortError instance
 *
 * @param   String      message      Error message for human
 * @return  AbortError
 */
function AbortError(message) {
  Error.call(this, message);

  this.type = 'aborted';
  this.message = message;

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

AbortError.prototype = Object.create(Error.prototype);
AbortError.prototype.constructor = AbortError;
AbortError.prototype.name = 'AbortError';

// fix an issue where "PassThrough", "resolve" aren't a named export for node <10
const PassThrough$1 = Stream.PassThrough;
const resolve_url = Url.resolve;

/**
 * Fetch function
 *
 * @param   Mixed    url   Absolute url or Request instance
 * @param   Object   opts  Fetch options
 * @return  Promise
 */
function fetch(url, opts) {

	// allow custom promise
	if (!fetch.Promise) {
		throw new Error('native promise missing, set fetch.Promise to your favorite alternative');
	}

	Body.Promise = fetch.Promise;

	// wrap http.request into fetch
	return new fetch.Promise(function (resolve, reject) {
		// build request object
		const request = new Request(url, opts);
		const options = getNodeRequestOptions(request);

		const send = (options.protocol === 'https:' ? https : http).request;
		const signal = request.signal;

		let response = null;

		const abort = function abort() {
			let error = new AbortError('The user aborted a request.');
			reject(error);
			if (request.body && request.body instanceof Stream.Readable) {
				request.body.destroy(error);
			}
			if (!response || !response.body) return;
			response.body.emit('error', error);
		};

		if (signal && signal.aborted) {
			abort();
			return;
		}

		const abortAndFinalize = function abortAndFinalize() {
			abort();
			finalize();
		};

		// send request
		const req = send(options);
		let reqTimeout;

		if (signal) {
			signal.addEventListener('abort', abortAndFinalize);
		}

		function finalize() {
			req.abort();
			if (signal) signal.removeEventListener('abort', abortAndFinalize);
			clearTimeout(reqTimeout);
		}

		if (request.timeout) {
			req.once('socket', function (socket) {
				reqTimeout = setTimeout(function () {
					reject(new FetchError(`network timeout at: ${request.url}`, 'request-timeout'));
					finalize();
				}, request.timeout);
			});
		}

		req.on('error', function (err) {
			reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, 'system', err));
			finalize();
		});

		req.on('response', function (res) {
			clearTimeout(reqTimeout);

			const headers = createHeadersLenient(res.headers);

			// HTTP fetch step 5
			if (fetch.isRedirect(res.statusCode)) {
				// HTTP fetch step 5.2
				const location = headers.get('Location');

				// HTTP fetch step 5.3
				const locationURL = location === null ? null : resolve_url(request.url, location);

				// HTTP fetch step 5.5
				switch (request.redirect) {
					case 'error':
						reject(new FetchError(`redirect mode is set to error: ${request.url}`, 'no-redirect'));
						finalize();
						return;
					case 'manual':
						// node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
						if (locationURL !== null) {
							// handle corrupted header
							try {
								headers.set('Location', locationURL);
							} catch (err) {
								// istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
								reject(err);
							}
						}
						break;
					case 'follow':
						// HTTP-redirect fetch step 2
						if (locationURL === null) {
							break;
						}

						// HTTP-redirect fetch step 5
						if (request.counter >= request.follow) {
							reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 6 (counter increment)
						// Create a new Request object.
						const requestOpts = {
							headers: new Headers(request.headers),
							follow: request.follow,
							counter: request.counter + 1,
							agent: request.agent,
							compress: request.compress,
							method: request.method,
							body: request.body,
							signal: request.signal,
							timeout: request.timeout
						};

						// HTTP-redirect fetch step 9
						if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
							reject(new FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 11
						if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === 'POST') {
							requestOpts.method = 'GET';
							requestOpts.body = undefined;
							requestOpts.headers.delete('content-length');
						}

						// HTTP-redirect fetch step 15
						resolve(fetch(new Request(locationURL, requestOpts)));
						finalize();
						return;
				}
			}

			// prepare response
			res.once('end', function () {
				if (signal) signal.removeEventListener('abort', abortAndFinalize);
			});
			let body = res.pipe(new PassThrough$1());

			const response_options = {
				url: request.url,
				status: res.statusCode,
				statusText: res.statusMessage,
				headers: headers,
				size: request.size,
				timeout: request.timeout,
				counter: request.counter
			};

			// HTTP-network fetch step 12.1.1.3
			const codings = headers.get('Content-Encoding');

			// HTTP-network fetch step 12.1.1.4: handle content codings

			// in following scenarios we ignore compression support
			// 1. compression support is disabled
			// 2. HEAD request
			// 3. no Content-Encoding header
			// 4. no content response (204)
			// 5. content not modified response (304)
			if (!request.compress || request.method === 'HEAD' || codings === null || res.statusCode === 204 || res.statusCode === 304) {
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// For Node v6+
			// Be less strict when decoding compressed responses, since sometimes
			// servers send slightly invalid responses that are still accepted
			// by common browsers.
			// Always using Z_SYNC_FLUSH is what cURL does.
			const zlibOptions = {
				flush: zlib.Z_SYNC_FLUSH,
				finishFlush: zlib.Z_SYNC_FLUSH
			};

			// for gzip
			if (codings == 'gzip' || codings == 'x-gzip') {
				body = body.pipe(zlib.createGunzip(zlibOptions));
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// for deflate
			if (codings == 'deflate' || codings == 'x-deflate') {
				// handle the infamous raw deflate response from old servers
				// a hack for old IIS and Apache servers
				const raw = res.pipe(new PassThrough$1());
				raw.once('data', function (chunk) {
					// see http://stackoverflow.com/questions/37519828
					if ((chunk[0] & 0x0F) === 0x08) {
						body = body.pipe(zlib.createInflate());
					} else {
						body = body.pipe(zlib.createInflateRaw());
					}
					response = new Response(body, response_options);
					resolve(response);
				});
				return;
			}

			// for br
			if (codings == 'br' && typeof zlib.createBrotliDecompress === 'function') {
				body = body.pipe(zlib.createBrotliDecompress());
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// otherwise, use response as-is
			response = new Response(body, response_options);
			resolve(response);
		});

		writeToStream(req, request);
	});
}
/**
 * Redirect code matching
 *
 * @param   Number   code  Status code
 * @return  Boolean
 */
fetch.isRedirect = function (code) {
	return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
};

// expose Promise
fetch.Promise = global.Promise;

function get_page_handler(
	manifest,
	session_getter
) {
	const get_build_info =  (assets => () => assets)(JSON.parse(fs.readFileSync(path.join(build_dir, 'build.json'), 'utf-8')));

	const template =  (str => () => str)(read_template(build_dir));

	const has_service_worker = fs.existsSync(path.join(build_dir, 'service-worker.js'));

	const { server_routes, pages } = manifest;
	const error_route = manifest.error;

	function bail(req, res, err) {
		console.error(err);

		const message =  'Internal server error';

		res.statusCode = 500;
		res.end(`<pre>${message}</pre>`);
	}

	function handle_error(req, res, statusCode, error) {
		handle_page({
			pattern: null,
			parts: [
				{ name: null, component: error_route }
			]
		}, req, res, statusCode, error || new Error('Unknown error in preload function'));
	}

	async function handle_page(page, req, res, status = 200, error = null) {
		const is_service_worker_index = req.path === '/service-worker-index.html';
		const build_info




 = get_build_info();

		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Cache-Control',  'max-age=600');

		// preload main.js and current route
		// TODO detect other stuff we can preload? images, CSS, fonts?
		let preloaded_chunks = Array.isArray(build_info.assets.main) ? build_info.assets.main : [build_info.assets.main];
		if (!error && !is_service_worker_index) {
			page.parts.forEach(part => {
				if (!part) return;

				// using concat because it could be a string or an array. thanks webpack!
				preloaded_chunks = preloaded_chunks.concat(build_info.assets[part.name]);
			});
		}

		if (build_info.bundler === 'rollup') {
			// TODO add dependencies and CSS
			const link = preloaded_chunks
				.filter(file => file && !file.match(/\.map$/))
				.map(file => `<${req.baseUrl}/client/${file}>;rel="modulepreload"`)
				.join(', ');

			res.setHeader('Link', link);
		} else {
			const link = preloaded_chunks
				.filter(file => file && !file.match(/\.map$/))
				.map((file) => {
					const as = /\.css$/.test(file) ? 'style' : 'script';
					return `<${req.baseUrl}/client/${file}>;rel="preload";as="${as}"`;
				})
				.join(', ');

			res.setHeader('Link', link);
		}

		const session = session_getter(req, res);

		let redirect;
		let preload_error;

		const preload_context = {
			redirect: (statusCode, location) => {
				if (redirect && (redirect.statusCode !== statusCode || redirect.location !== location)) {
					throw new Error(`Conflicting redirects`);
				}
				location = location.replace(/^\//g, ''); // leading slash (only)
				redirect = { statusCode, location };
			},
			error: (statusCode, message) => {
				preload_error = { statusCode, message };
			},
			fetch: (url, opts) => {
				const parsed = new Url.URL(url, `http://127.0.0.1:${process.env.PORT}${req.baseUrl ? req.baseUrl + '/' :''}`);

				if (opts) {
					opts = Object.assign({}, opts);

					const include_cookies = (
						opts.credentials === 'include' ||
						opts.credentials === 'same-origin' && parsed.origin === `http://127.0.0.1:${process.env.PORT}`
					);

					if (include_cookies) {
						opts.headers = Object.assign({}, opts.headers);

						const cookies = Object.assign(
							{},
							cookie.parse(req.headers.cookie || ''),
							cookie.parse(opts.headers.cookie || '')
						);

						const set_cookie = res.getHeader('Set-Cookie');
						(Array.isArray(set_cookie) ? set_cookie : [set_cookie]).forEach(str => {
							const match = /([^=]+)=([^;]+)/.exec(str);
							if (match) cookies[match[1]] = match[2];
						});

						const str = Object.keys(cookies)
							.map(key => `${key}=${cookies[key]}`)
							.join('; ');

						opts.headers.cookie = str;
					}
				}

				return fetch(parsed.href, opts);
			}
		};

		let preloaded;
		let match;
		let params;

		try {
			const root_preloaded = manifest.root_preload
				? manifest.root_preload.call(preload_context, {
					host: req.headers.host,
					path: req.path,
					query: req.query,
					params: {}
				}, session)
				: {};

			match = error ? null : page.pattern.exec(req.path);


			let toPreload = [root_preloaded];
			if (!is_service_worker_index) {
				toPreload = toPreload.concat(page.parts.map(part => {
					if (!part) return null;

					// the deepest level is used below, to initialise the store
					params = part.params ? part.params(match) : {};

					return part.preload
						? part.preload.call(preload_context, {
							host: req.headers.host,
							path: req.path,
							query: req.query,
							params
						}, session)
						: {};
				}));
			}

			preloaded = await Promise.all(toPreload);
		} catch (err) {
			if (error) {
				return bail(req, res, err)
			}

			preload_error = { statusCode: 500, message: err };
			preloaded = []; // appease TypeScript
		}

		try {
			if (redirect) {
				const location = Url.resolve((req.baseUrl || '') + '/', redirect.location);

				res.statusCode = redirect.statusCode;
				res.setHeader('Location', location);
				res.end();

				return;
			}

			if (preload_error) {
				handle_error(req, res, preload_error.statusCode, preload_error.message);
				return;
			}

			const segments = req.path.split('/').filter(Boolean);

			// TODO make this less confusing
			const layout_segments = [segments[0]];
			let l = 1;

			page.parts.forEach((part, i) => {
				layout_segments[l] = segments[i + 1];
				if (!part) return null;
				l++;
			});

			const props = {
				stores: {
					page: {
						subscribe: writable({
							host: req.headers.host,
							path: req.path,
							query: req.query,
							params
						}).subscribe
					},
					preloading: {
						subscribe: writable(null).subscribe
					},
					session: writable(session)
				},
				segments: layout_segments,
				status: error ? status : 200,
				error: error ? error instanceof Error ? error : { message: error } : null,
				level0: {
					props: preloaded[0]
				},
				level1: {
					segment: segments[0],
					props: {}
				}
			};

			if (!is_service_worker_index) {
				let l = 1;
				for (let i = 0; i < page.parts.length; i += 1) {
					const part = page.parts[i];
					if (!part) continue;

					props[`level${l++}`] = {
						component: part.component,
						props: preloaded[i + 1] || {},
						segment: segments[i]
					};
				}
			}

			const { html, head, css } = App.render(props);

			const serialized = {
				preloaded: `[${preloaded.map(data => try_serialize(data)).join(',')}]`,
				session: session && try_serialize(session, err => {
					throw new Error(`Failed to serialize session data: ${err.message}`);
				}),
				error: error && try_serialize(props.error)
			};

			let script = `__SAPPER__={${[
				error && `error:${serialized.error},status:${status}`,
				`baseUrl:"${req.baseUrl}"`,
				serialized.preloaded && `preloaded:${serialized.preloaded}`,
				serialized.session && `session:${serialized.session}`
			].filter(Boolean).join(',')}};`;

			if (has_service_worker) {
				script += `if('serviceWorker' in navigator)navigator.serviceWorker.register('${req.baseUrl}/service-worker.js');`;
			}

			const file = [].concat(build_info.assets.main).filter(file => file && /\.js$/.test(file))[0];
			const main = `${req.baseUrl}/client/${file}`;

			if (build_info.bundler === 'rollup') {
				if (build_info.legacy_assets) {
					const legacy_main = `${req.baseUrl}/client/legacy/${build_info.legacy_assets.main}`;
					script += `(function(){try{eval("async function x(){}");var main="${main}"}catch(e){main="${legacy_main}"};var s=document.createElement("script");try{new Function("if(0)import('')")();s.src=main;s.type="module";s.crossOrigin="use-credentials";}catch(e){s.src="${req.baseUrl}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main",main);}document.head.appendChild(s);}());`;
				} else {
					script += `var s=document.createElement("script");try{new Function("if(0)import('')")();s.src="${main}";s.type="module";s.crossOrigin="use-credentials";}catch(e){s.src="${req.baseUrl}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main","${main}")}document.head.appendChild(s)`;
				}
			} else {
				script += `</script><script src="${main}">`;
			}

			let styles;

			// TODO make this consistent across apps
			// TODO embed build_info in placeholder.ts
			if (build_info.css && build_info.css.main) {
				const css_chunks = new Set();
				if (build_info.css.main) css_chunks.add(build_info.css.main);
				page.parts.forEach(part => {
					if (!part) return;
					const css_chunks_for_part = build_info.css.chunks[part.file];

					if (css_chunks_for_part) {
						css_chunks_for_part.forEach(file => {
							css_chunks.add(file);
						});
					}
				});

				styles = Array.from(css_chunks)
					.map(href => `<link rel="stylesheet" href="client/${href}">`)
					.join('');
			} else {
				styles = (css && css.code ? `<style>${css.code}</style>` : '');
			}

			// users can set a CSP nonce using res.locals.nonce
			const nonce_attr = (res.locals && res.locals.nonce) ? ` nonce="${res.locals.nonce}"` : '';

			const body = template()
				.replace('%sapper.base%', () => `<base href="${req.baseUrl}/">`)
				.replace('%sapper.scripts%', () => `<script${nonce_attr}>${script}</script>`)
				.replace('%sapper.html%', () => html)
				.replace('%sapper.head%', () => `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`)
				.replace('%sapper.styles%', () => styles);

			res.statusCode = status;
			res.end(body);
		} catch(err) {
			if (error) {
				bail(req, res, err);
			} else {
				handle_error(req, res, 500, err);
			}
		}
	}

	return function find_route(req, res, next) {
		if (req.path === '/service-worker-index.html') {
			const homePage = pages.find(page => page.pattern.test('/'));
			handle_page(homePage, req, res);
			return;
		}

		for (const page of pages) {
			if (page.pattern.test(req.path)) {
				handle_page(page, req, res);
				return;
			}
		}

		handle_error(req, res, 404, 'Not found');
	};
}

function read_template(dir = build_dir) {
	return fs.readFileSync(`${dir}/template.html`, 'utf-8');
}

function try_serialize(data, fail) {
	try {
		return devalue(data);
	} catch (err) {
		if (fail) fail(err);
		return null;
	}
}

function middleware(opts


 = {}) {
	const { session, ignore } = opts;

	let emitted_basepath = false;

	return compose_handlers(ignore, [
		(req, res, next) => {
			if (req.baseUrl === undefined) {
				let { originalUrl } = req;
				if (req.url === '/' && originalUrl[originalUrl.length - 1] !== '/') {
					originalUrl += '/';
				}

				req.baseUrl = originalUrl
					? originalUrl.slice(0, -req.url.length)
					: '';
			}

			if (!emitted_basepath && process.send) {
				process.send({
					__sapper__: true,
					event: 'basepath',
					basepath: req.baseUrl
				});

				emitted_basepath = true;
			}

			if (req.path === undefined) {
				req.path = req.url.replace(/\?.*/, '');
			}

			next();
		},

		fs.existsSync(path.join(build_dir, 'service-worker.js')) && serve({
			pathname: '/service-worker.js',
			cache_control: 'no-cache, no-store, must-revalidate'
		}),

		fs.existsSync(path.join(build_dir, 'service-worker.js.map')) && serve({
			pathname: '/service-worker.js.map',
			cache_control: 'no-cache, no-store, must-revalidate'
		}),

		serve({
			prefix: '/client/',
			cache_control:  'max-age=31536000, immutable'
		}),

		get_server_route_handler(manifest.server_routes),

		get_page_handler(manifest, session || noop$1)
	].filter(Boolean));
}

function compose_handlers(ignore, handlers) {
	const total = handlers.length;

	function nth_handler(n, req, res, next) {
		if (n >= total) {
			return next();
		}

		handlers[n](req, res, () => nth_handler(n+1, req, res, next));
	}

	return !ignore
		? (req, res, next) => nth_handler(0, req, res, next)
		: (req, res, next) => {
			if (should_ignore(req.path, ignore)) {
				next();
			} else {
				nth_handler(0, req, res, next);
			}
		};
}

function should_ignore(uri, val) {
	if (Array.isArray(val)) return val.some(x => should_ignore(uri, x));
	if (val instanceof RegExp) return val.test(uri);
	if (typeof val === 'function') return val(uri);
	return uri.startsWith(val.charCodeAt(0) === 47 ? val : `/${val}`);
}

function serve({ prefix, pathname, cache_control }



) {
	const filter = pathname
		? (req) => req.path === pathname
		: (req) => req.path.startsWith(prefix);

	const cache = new Map();

	const read =  (file) => (cache.has(file) ? cache : cache.set(file, fs.readFileSync(path.join(build_dir, file)))).get(file);

	return (req, res, next) => {
		if (filter(req)) {
			const type = lite.getType(req.path);

			try {
				const file = path.posix.normalize(decodeURIComponent(req.path));
				const data = read(file);

				res.setHeader('Content-Type', type);
				res.setHeader('Cache-Control', cache_control);
				res.end(data);
			} catch (err) {
				res.statusCode = 404;
				res.end('not found');
			}
		} else {
			next();
		}
	};
}

function noop$1(){}

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

polka() // You can also use Express
	.use(
		'/Charitify',
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		middleware(),
		session({
			secret: 'keyboard cat',
			resave: false,
			saveUninitialized: true,
			cookie: { secure: true }
		})
	)
	.listen(PORT, (err) => {
		if (err) console.log('error', err);
	});
