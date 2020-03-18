'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sirv = _interopDefault(require('sirv'));
var polka = _interopDefault(require('polka'));
var compression = _interopDefault(require('compression'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var classnames = _interopDefault(require('classnames'));
var zlFetch = _interopDefault(require('zl-fetch'));
var Stream = _interopDefault(require('stream'));
var http = _interopDefault(require('http'));
var Url = _interopDefault(require('url'));
var https = _interopDefault(require('https'));
var zlib = _interopDefault(require('zlib'));

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

const toCSSString = (styles = {}) => Object.entries(styles)
  .filter(([_propName, propValue]) => propValue !== undefined && propValue !== null)
  .reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`
  }, '');

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

/* src/components/Icon.svelte generated by Svelte v3.18.1 */

const css = {
	code: "svg.svelte-1uhjpqh.svelte-1uhjpqh{display:inherit;flex-grow:1;align-self:stretch}svg.svelte-1uhjpqh.svelte-1uhjpqh,svg.svelte-1uhjpqh .svelte-1uhjpqh{fill:rgba(var(--theme-svg-fill));stroke:rgba(var(--theme-svg-fill))}.small.svelte-1uhjpqh.svelte-1uhjpqh{width:18px;height:18px;flex:none;align-self:auto}.medium.svelte-1uhjpqh.svelte-1uhjpqh{width:24px;height:24px;flex:none;align-self:auto}.big.svelte-1uhjpqh.svelte-1uhjpqh{width:30px;height:30px;flex:none;align-self:auto}.primary.svelte-1uhjpqh.svelte-1uhjpqh,.primary.svelte-1uhjpqh .svelte-1uhjpqh{fill:rgb(var(--color-success));stroke:rgb(var(--color-success))}.danger.svelte-1uhjpqh.svelte-1uhjpqh,.danger.svelte-1uhjpqh .svelte-1uhjpqh{fill:rgb(var(--color-danger));stroke:rgb(var(--color-danger))}.info.svelte-1uhjpqh.svelte-1uhjpqh,.info.svelte-1uhjpqh .svelte-1uhjpqh{fill:rgb(var(--color-info));stroke:rgb(var(--color-info))}.light.svelte-1uhjpqh.svelte-1uhjpqh,.light.svelte-1uhjpqh .svelte-1uhjpqh{fill:rgb(var(--color-white));stroke:rgb(var(--color-white))}.dark.svelte-1uhjpqh.svelte-1uhjpqh,.dark.svelte-1uhjpqh .svelte-1uhjpqh{fill:rgb(var(--color-black));stroke:rgb(var(--color-black))}",
	map: "{\"version\":3,\"file\":\"Icon.svelte\",\"sources\":[\"Icon.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames, toCSSString } from '../utils'\\n\\n    export let type\\n    export let is // primary|warning|danger|light|dark\\n    export let size = null // small|medium|big\\n    export let rotate = 0\\n    export let style = undefined\\n    export let id = undefined\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n    let styleProp = toCSSString({ transform: !!rotate ? `rotateZ(${rotate}deg)` : null, ...style })\\n\\n    $: classProp = classnames('ico', is, size, $$props.class)\\n</script>\\n\\n<svg\\n        {id}\\n        title={titleProp}\\n        class={classProp}\\n        style={styleProp}\\n        aria-label={ariaLabelProp}\\n>\\n    <use xlink:href={`#ico-${type}`} class=\\\"ico-use\\\"/>\\n</svg>\\n\\n<style>\\n    svg {\\n        display: inherit;\\n        flex-grow: 1;\\n        align-self: stretch;\\n    }\\n\\n    svg, svg * {\\n        fill: rgba(var(--theme-svg-fill));\\n        stroke: rgba(var(--theme-svg-fill));\\n    }\\n\\n    /* ------------=========( Size )=========------------ */\\n    .small {\\n        width: 18px;\\n        height: 18px;\\n        flex: none;\\n        align-self: auto;\\n    }\\n\\n    .medium {\\n        width: 24px;\\n        height: 24px;\\n        flex: none;\\n        align-self: auto;\\n    }\\n\\n    .big {\\n        width: 30px;\\n        height: 30px;\\n        flex: none;\\n        align-self: auto;\\n    }\\n\\n    /* ------------=========( Color )=========------------ */\\n    .primary, .primary * {\\n        fill: rgb(var(--color-success));\\n        stroke: rgb(var(--color-success));\\n    }\\n\\n    .danger, .danger * {\\n        fill: rgb(var(--color-danger));\\n        stroke: rgb(var(--color-danger));\\n    }\\n\\n    .info, .info * {\\n        fill: rgb(var(--color-info));\\n        stroke: rgb(var(--color-info));\\n    }\\n\\n    .light, .light * {\\n        fill: rgb(var(--color-white));\\n        stroke: rgb(var(--color-white));\\n    }\\n\\n    .dark, .dark * {\\n        fill: rgb(var(--color-black));\\n        stroke: rgb(var(--color-black));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0ljb24uc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGdCQUFnQjtRQUNoQixZQUFZO1FBQ1osbUJBQW1CO0lBQ3ZCOztJQUVBO1FBQ0ksaUNBQWlDO1FBQ2pDLG1DQUFtQztJQUN2Qzs7SUFFQSx1REFBdUQ7SUFDdkQ7UUFDSSxXQUFXO1FBQ1gsWUFBWTtRQUNaLFVBQVU7UUFDVixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsWUFBWTtRQUNaLFVBQVU7UUFDVixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsWUFBWTtRQUNaLFVBQVU7UUFDVixnQkFBZ0I7SUFDcEI7O0lBRUEsd0RBQXdEO0lBQ3hEO1FBQ0ksK0JBQStCO1FBQy9CLGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLDhCQUE4QjtRQUM5QixnQ0FBZ0M7SUFDcEM7O0lBRUE7UUFDSSw0QkFBNEI7UUFDNUIsOEJBQThCO0lBQ2xDOztJQUVBO1FBQ0ksNkJBQTZCO1FBQzdCLCtCQUErQjtJQUNuQzs7SUFFQTtRQUNJLDZCQUE2QjtRQUM3QiwrQkFBK0I7SUFDbkMiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBzdmcge1xuICAgICAgICBkaXNwbGF5OiBpbmhlcml0O1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgfVxuXG4gICAgc3ZnLCBzdmcgKiB7XG4gICAgICAgIGZpbGw6IHJnYmEodmFyKC0tdGhlbWUtc3ZnLWZpbGwpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2JhKHZhcigtLXRoZW1lLXN2Zy1maWxsKSk7XG4gICAgfVxuXG4gICAgLyogLS0tLS0tLS0tLS0tPT09PT09PT09KCBTaXplICk9PT09PT09PT0tLS0tLS0tLS0tLS0gKi9cbiAgICAuc21hbGwge1xuICAgICAgICB3aWR0aDogMThweDtcbiAgICAgICAgaGVpZ2h0OiAxOHB4O1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBhdXRvO1xuICAgIH1cblxuICAgIC5tZWRpdW0ge1xuICAgICAgICB3aWR0aDogMjRweDtcbiAgICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBhdXRvO1xuICAgIH1cblxuICAgIC5iaWcge1xuICAgICAgICB3aWR0aDogMzBweDtcbiAgICAgICAgaGVpZ2h0OiAzMHB4O1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBhdXRvO1xuICAgIH1cblxuICAgIC8qIC0tLS0tLS0tLS0tLT09PT09PT09PSggQ29sb3IgKT09PT09PT09PS0tLS0tLS0tLS0tLSAqL1xuICAgIC5wcmltYXJ5LCAucHJpbWFyeSAqIHtcbiAgICAgICAgZmlsbDogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgIH1cblxuICAgIC5kYW5nZXIsIC5kYW5nZXIgKiB7XG4gICAgICAgIGZpbGw6IHJnYih2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuXG4gICAgLmluZm8sIC5pbmZvICoge1xuICAgICAgICBmaWxsOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgICAgICBzdHJva2U6IHJnYih2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuXG4gICAgLmxpZ2h0LCAubGlnaHQgKiB7XG4gICAgICAgIGZpbGw6IHJnYih2YXIoLS1jb2xvci13aGl0ZSkpO1xuICAgICAgICBzdHJva2U6IHJnYih2YXIoLS1jb2xvci13aGl0ZSkpO1xuICAgIH1cblxuICAgIC5kYXJrLCAuZGFyayAqIHtcbiAgICAgICAgZmlsbDogcmdiKHZhcigtLWNvbG9yLWJsYWNrKSk7XG4gICAgICAgIHN0cm9rZTogcmdiKHZhcigtLWNvbG9yLWJsYWNrKSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AA8BI,GAAG,8BAAC,CAAC,AACD,OAAO,CAAE,OAAO,CAChB,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,AACvB,CAAC,AAED,iCAAG,CAAE,kBAAG,CAAC,eAAE,CAAC,AACR,IAAI,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CACjC,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACvC,CAAC,AAGD,MAAM,8BAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,IAAI,CAAE,IAAI,CACV,UAAU,CAAE,IAAI,AACpB,CAAC,AAED,OAAO,8BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,IAAI,CAAE,IAAI,CACV,UAAU,CAAE,IAAI,AACpB,CAAC,AAED,IAAI,8BAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,IAAI,CAAE,IAAI,CACV,UAAU,CAAE,IAAI,AACpB,CAAC,AAGD,sCAAQ,CAAE,uBAAQ,CAAC,eAAE,CAAC,AAClB,IAAI,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,CAC/B,MAAM,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AACrC,CAAC,AAED,qCAAO,CAAE,sBAAO,CAAC,eAAE,CAAC,AAChB,IAAI,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAC9B,MAAM,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AACpC,CAAC,AAED,mCAAK,CAAE,oBAAK,CAAC,eAAE,CAAC,AACZ,IAAI,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CAC5B,MAAM,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AAClC,CAAC,AAED,oCAAM,CAAE,qBAAM,CAAC,eAAE,CAAC,AACd,IAAI,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAC7B,MAAM,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,AACnC,CAAC,AAED,mCAAK,CAAE,oBAAK,CAAC,eAAE,CAAC,AACZ,IAAI,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAC7B,MAAM,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,AACnC,CAAC\"}"
};

const Icon = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { type } = $$props;
	let { is } = $$props; // primary|warning|danger|light|dark
	let { size = null } = $$props; // small|medium|big
	let { rotate = 0 } = $$props;
	let { style = undefined } = $$props;
	let { id = undefined } = $$props;
	let { title = undefined } = $$props;
	let { ariaLabel = undefined } = $$props;
	let titleProp = title || ariaLabel;
	let ariaLabelProp = ariaLabel || title;

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
	$$result.css.add(css);
	let classProp = classnames("ico", is, size, $$props.class);

	return `<svg${add_attribute("id", id, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1uhjpqh"}"${add_attribute("style", styleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)}>
    <use${add_attribute("xlink:href", `#ico-${type}`, 0)} class="${"ico-use svelte-1uhjpqh"}"></use>
</svg>`;
});

/* src/components/Rate.svelte generated by Svelte v3.18.1 */

const css$1 = {
	code: ".rate.svelte-tekjtj.svelte-tekjtj{display:inline-flex;margin:calc(var(--screen-padding) * -1 / 3)}li.svelte-tekjtj.svelte-tekjtj{padding:calc(var(--screen-padding) / 3)}.rate.svelte-tekjtj li.svelte-tekjtj{-webkit-filter:drop-shadow(-1px 2px 1px rgba(var(--color-black), .25));filter:drop-shadow(-1px 2px 1px rgba(var(--color-black), .25))}",
	map: "{\"version\":3,\"file\":\"Rate.svelte\",\"sources\":[\"Rate.svelte\"],\"sourcesContent\":[\"<script>\\n    import Icon from '../components/Icon.svelte'\\n\\n    export let is = 'danger'\\n    export let size = 'medium' // small|medium|mig\\n</script>\\n\\n<ul class=\\\"rate\\\">\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n</ul>\\n\\n<style>\\n    .rate {\\n        display: inline-flex;\\n        margin: calc(var(--screen-padding) * -1 / 3);\\n    }\\n\\n    li {\\n        padding: calc(var(--screen-padding) / 3);\\n    }\\n\\n    .rate li {\\n        -webkit-filter: drop-shadow(-1px 2px 1px rgba(var(--color-black), .25));\\n        filter: drop-shadow(-1px 2px 1px rgba(var(--color-black), .25));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL1JhdGUuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG9CQUFvQjtRQUNwQiw0Q0FBNEM7SUFDaEQ7O0lBRUE7UUFDSSx3Q0FBd0M7SUFDNUM7O0lBRUE7UUFDSSx1RUFBdUU7UUFDdkUsK0RBQStEO0lBQ25FIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL1JhdGUuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnJhdGUge1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAgbWFyZ2luOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIC0xIC8gMyk7XG4gICAgfVxuXG4gICAgbGkge1xuICAgICAgICBwYWRkaW5nOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAvIDMpO1xuICAgIH1cblxuICAgIC5yYXRlIGxpIHtcbiAgICAgICAgLXdlYmtpdC1maWx0ZXI6IGRyb3Atc2hhZG93KC0xcHggMnB4IDFweCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgLjI1KSk7XG4gICAgICAgIGZpbHRlcjogZHJvcC1zaGFkb3coLTFweCAycHggMXB4IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuMjUpKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AA0BI,KAAK,4BAAC,CAAC,AACH,OAAO,CAAE,WAAW,CACpB,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,AAChD,CAAC,AAED,EAAE,4BAAC,CAAC,AACA,OAAO,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC5C,CAAC,AAED,mBAAK,CAAC,EAAE,cAAC,CAAC,AACN,cAAc,CAAE,YAAY,IAAI,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CACvE,MAAM,CAAE,YAAY,IAAI,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,AACnE,CAAC\"}"
};

const Rate = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { is = "danger" } = $$props;
	let { size = "medium" } = $$props; // small|medium|mig
	if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	$$result.css.add(css$1);

	return `<ul class="${"rate svelte-tekjtj"}">
    <li class="${"svelte-tekjtj"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-tekjtj"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-tekjtj"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-tekjtj"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-tekjtj"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
</ul>`;
});

/* src/components/Form.svelte generated by Svelte v3.18.1 */

const Form = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { id = undefined } = $$props;
	let { title = undefined } = $$props;
	let { ariaLabel = undefined } = $$props;
	let { autocomplete = true } = $$props;
	let titleProp = title || ariaLabel;
	let ariaLabelProp = ariaLabel || title;
	let autocompleteProp = autocomplete ? "on" : "off";
	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	if ($$props.autocomplete === void 0 && $$bindings.autocomplete && autocomplete !== void 0) $$bindings.autocomplete(autocomplete);
	let classProp = classnames("form", $$props.class);

	return `<form${add_attribute("id", id, 0)}${add_attribute("name", name, 0)}${add_attribute("title", titleProp, 0)}${add_attribute("class", classProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)}${add_attribute("autocomplete", autocompleteProp, 0)}>
    ${$$slots.default ? $$slots.default({}) : ``}
</form>`;
});

/* src/components/Card.svelte generated by Svelte v3.18.1 */

const css$2 = {
	code: ".card.svelte-5zadp1{width:100%;overflow:hidden;box-shadow:var(--shadow-secondary);border-radius:var(--border-radius-big);background-color:rgba(var(--theme-color-primary))}",
	map: "{\"version\":3,\"file\":\"Card.svelte\",\"sources\":[\"Card.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '../utils'\\n\\n    $: classProp = classnames('card', $$props.class)\\n</script>\\n\\n<section class={classProp}>\\n    <slot></slot>\\n</section>\\n\\n<style>\\n    .card {\\n        width: 100%;\\n        overflow: hidden;\\n        box-shadow: var(--shadow-secondary);\\n        border-radius: var(--border-radius-big);\\n        background-color: rgba(var(--theme-color-primary));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0NhcmQuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFdBQVc7UUFDWCxnQkFBZ0I7UUFDaEIsbUNBQW1DO1FBQ25DLHVDQUF1QztRQUN2QyxrREFBa0Q7SUFDdEQiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvQ2FyZC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuY2FyZCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cy1iaWcpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnkpKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAWI,KAAK,cAAC,CAAC,AACH,KAAK,CAAE,IAAI,CACX,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,IAAI,kBAAkB,CAAC,CACnC,aAAa,CAAE,IAAI,mBAAmB,CAAC,CACvC,gBAAgB,CAAE,KAAK,IAAI,qBAAqB,CAAC,CAAC,AACtD,CAAC\"}"
};

const Card = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$2);
	let classProp = classnames("card", $$props.class);

	return `<section class="${escape(null_to_empty(classProp)) + " svelte-5zadp1"}">
    ${$$slots.default ? $$slots.default({}) : ``}
</section>`;
});

/* src/components/Space.svelte generated by Svelte v3.18.1 */

const Space = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { size = 1 } = $$props;
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	return `${each(Array.from({ length: +size }), _ => ` `)}`;
});

/* src/components/Picture.svelte generated by Svelte v3.18.1 */

const css$3 = {
	code: ".picture.svelte-17twgjb.svelte-17twgjb{position:relative;flex-grow:1;align-self:stretch;display:inline-flex;flex-direction:column;align-items:stretch;justify-content:stretch;background-color:rgba(var(--color-black), .04)}.picture.svelte-17twgjb .pic.svelte-17twgjb{flex-grow:1;overflow:hidden;align-self:stretch;-o-object-position:center;object-position:center;transition:opacity .3s ease-in}.picture.svelte-17twgjb .pic-2x.svelte-17twgjb{position:absolute;top:0;left:0;width:100%;height:100%}.picture.cover.svelte-17twgjb .pic.svelte-17twgjb{-o-object-fit:cover;object-fit:cover}.picture.contain.svelte-17twgjb .pic.svelte-17twgjb{-o-object-fit:contain;object-fit:contain}.picture.isError.svelte-17twgjb .pic-1x.svelte-17twgjb,.picture.isError.svelte-17twgjb .pic-2x.svelte-17twgjb,.picture.loadingSrcSmall.svelte-17twgjb .pic-1x.svelte-17twgjb,.picture.loadingSrcBig.svelte-17twgjb .pic-2x.svelte-17twgjb{opacity:0}",
	map: "{\"version\":3,\"file\":\"Picture.svelte\",\"sources\":[\"Picture.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let src\\n    export let alt\\n    export let size = 'cover'\\n    export let srcBig = undefined\\n    export let id = undefined\\n    export let width = undefined\\n    export let height = undefined\\n\\n    let isError = false\\n    let loadingSrcSmall = true\\n    let loadingSrcBig = true\\n\\n    $: wrapClassProp = classnames('picture', $$props.class, size, { loadingSrcSmall, loadingSrcBig, isError })\\n\\n    function imgService(node, postFix) {\\n        if (node.complete) {\\n            onLoad(node, postFix)\\n        } else {\\n            node.onload = () => onLoad(node, postFix)\\n            node.onerror = () => onError(node, postFix)\\n        }\\n    }\\n\\n    function onLoad(node, postFix) {\\n        changeLoading(postFix, false)\\n        isError = false\\n        dispatch(`load${postFix}`, node)\\n\\n        if (!srcBig || !loadingSrcBig) {\\n            dispatch('load', node)\\n        }\\n    }\\n\\n    function onError(node, postFix) {\\n        changeLoading(postFix, false)\\n        isError = true\\n        dispatch(`error${postFix}`, node)\\n    }\\n\\n    function changeLoading(type, isLoading) {\\n        switch (type) {\\n            case 'Small':\\n                loadingSrcSmall = isLoading\\n                break\\n            case 'Big':\\n                loadingSrcBig = isLoading\\n                break\\n        }\\n    }\\n\\n</script>\\n\\n<figure class={wrapClassProp}>\\n    <img\\n            use:imgService={'Small'}\\n            {id}\\n            {alt}\\n            {src}\\n            {width}\\n            {height}\\n            class=\\\"pic pic-1x\\\"\\n    />\\n\\n    {#if srcBig && !loadingSrcSmall}\\n        <img\\n                use:imgService={'Big'}\\n                {alt}\\n                {width}\\n                {height}\\n                src={srcBig}\\n                class=\\\"pic pic-2x\\\"\\n        />\\n    {/if}\\n\\n    <figcaption>\\n        <slot></slot>\\n    </figcaption>\\n</figure>\\n\\n<style>\\n    .picture {\\n        position: relative;\\n        flex-grow: 1;\\n        align-self: stretch;\\n        display: inline-flex;\\n        flex-direction: column;\\n        align-items: stretch;\\n        justify-content: stretch;\\n        background-color: rgba(var(--color-black), .04);\\n    }\\n\\n    .picture .pic {\\n        flex-grow: 1;\\n        overflow: hidden;\\n        align-self: stretch;\\n        -o-object-position: center;\\n           object-position: center;\\n        transition: opacity .3s ease-in;\\n    }\\n\\n    .picture .pic-2x {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n    }\\n\\n    .picture.cover .pic {\\n        -o-object-fit: cover;\\n           object-fit: cover;\\n    }\\n\\n    .picture.contain .pic {\\n        -o-object-fit: contain;\\n           object-fit: contain;\\n    }\\n\\n    .picture.isError .pic-1x,\\n    .picture.isError .pic-2x,\\n    .picture.loadingSrcSmall .pic-1x,\\n    .picture.loadingSrcBig .pic-2x {\\n        opacity: 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL1BpY3R1cmUuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGtCQUFrQjtRQUNsQixZQUFZO1FBQ1osbUJBQW1CO1FBQ25CLG9CQUFvQjtRQUNwQixzQkFBc0I7UUFDdEIsb0JBQW9CO1FBQ3BCLHdCQUF3QjtRQUN4QiwrQ0FBK0M7SUFDbkQ7O0lBRUE7UUFDSSxZQUFZO1FBQ1osZ0JBQWdCO1FBQ2hCLG1CQUFtQjtRQUNuQiwwQkFBdUI7V0FBdkIsdUJBQXVCO1FBQ3ZCLCtCQUErQjtJQUNuQzs7SUFFQTtRQUNJLGtCQUFrQjtRQUNsQixNQUFNO1FBQ04sT0FBTztRQUNQLFdBQVc7UUFDWCxZQUFZO0lBQ2hCOztJQUVBO1FBQ0ksb0JBQWlCO1dBQWpCLGlCQUFpQjtJQUNyQjs7SUFFQTtRQUNJLHNCQUFtQjtXQUFuQixtQkFBbUI7SUFDdkI7O0lBRUE7Ozs7UUFJSSxVQUFVO0lBQ2QiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvUGljdHVyZS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAucGljdHVyZSB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4wNCk7XG4gICAgfVxuXG4gICAgLnBpY3R1cmUgLnBpYyB7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgb2JqZWN0LXBvc2l0aW9uOiBjZW50ZXI7XG4gICAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgLjNzIGVhc2UtaW47XG4gICAgfVxuXG4gICAgLnBpY3R1cmUgLnBpYy0yeCB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgIH1cblxuICAgIC5waWN0dXJlLmNvdmVyIC5waWMge1xuICAgICAgICBvYmplY3QtZml0OiBjb3ZlcjtcbiAgICB9XG5cbiAgICAucGljdHVyZS5jb250YWluIC5waWMge1xuICAgICAgICBvYmplY3QtZml0OiBjb250YWluO1xuICAgIH1cblxuICAgIC5waWN0dXJlLmlzRXJyb3IgLnBpYy0xeCxcbiAgICAucGljdHVyZS5pc0Vycm9yIC5waWMtMngsXG4gICAgLnBpY3R1cmUubG9hZGluZ1NyY1NtYWxsIC5waWMtMXgsXG4gICAgLnBpY3R1cmUubG9hZGluZ1NyY0JpZyAucGljLTJ4IHtcbiAgICAgICAgb3BhY2l0eTogMDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAsFI,QAAQ,8BAAC,CAAC,AACN,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,OAAO,CAAE,WAAW,CACpB,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,CACxB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAED,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACX,SAAS,CAAE,CAAC,CACZ,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,CACnB,kBAAkB,CAAE,MAAM,CACvB,eAAe,CAAE,MAAM,CAC1B,UAAU,CAAE,OAAO,CAAC,GAAG,CAAC,OAAO,AACnC,CAAC,AAED,uBAAQ,CAAC,OAAO,eAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,QAAQ,qBAAM,CAAC,IAAI,eAAC,CAAC,AACjB,aAAa,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,AACxB,CAAC,AAED,QAAQ,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACnB,aAAa,CAAE,OAAO,CACnB,UAAU,CAAE,OAAO,AAC1B,CAAC,AAED,QAAQ,uBAAQ,CAAC,sBAAO,CACxB,QAAQ,uBAAQ,CAAC,sBAAO,CACxB,QAAQ,+BAAgB,CAAC,sBAAO,CAChC,QAAQ,6BAAc,CAAC,OAAO,eAAC,CAAC,AAC5B,OAAO,CAAE,CAAC,AACd,CAAC\"}"
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
	let isError = false;
	let loadingSrcSmall = true;
	let loadingSrcBig = true;

	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.srcBig === void 0 && $$bindings.srcBig && srcBig !== void 0) $$bindings.srcBig(srcBig);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
	$$result.css.add(css$3);
	let wrapClassProp = classnames("picture", $$props.class, size, { loadingSrcSmall, loadingSrcBig, isError });

	return `<figure class="${escape(null_to_empty(wrapClassProp)) + " svelte-17twgjb"}">
    <img${add_attribute("id", id, 0)}${add_attribute("alt", alt, 0)}${add_attribute("src", src, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} class="${"pic pic-1x svelte-17twgjb"}">

    ${srcBig && !loadingSrcSmall
	? `<img${add_attribute("alt", alt, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("src", srcBig, 0)} class="${"pic pic-2x svelte-17twgjb"}">`
	: ``}

    <figcaption>
        ${$$slots.default ? $$slots.default({}) : ``}
    </figcaption>
</figure>`;
});

/* src/components/Avatar.svelte generated by Svelte v3.18.1 */

const css$4 = {
	code: ".ava.svelte-1vvwi7d{position:relative;flex:none;display:flex;border-radius:50%;overflow:hidden}.small.svelte-1vvwi7d{width:30px;height:30px}.medium.svelte-1vvwi7d{width:60px;height:60px}.big.svelte-1vvwi7d{width:130px;height:130px}",
	map: "{\"version\":3,\"file\":\"Avatar.svelte\",\"sources\":[\"Avatar.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '../utils'\\n    import Picture from './Picture.svelte'\\n\\n    export let src\\n    export let alt\\n    export let size = null // small|medium|big\\n\\n    $: classProp = classnames('ava', size, $$props.class)\\n</script>\\n\\n<div class={classProp}>\\n    <Picture {src} {alt}/>\\n</div>\\n\\n<style>\\n    .ava {\\n        position: relative;\\n        flex: none;\\n        display: flex;\\n        border-radius: 50%;\\n        overflow: hidden;\\n    }\\n\\n    .small {\\n        width: 30px;\\n        height: 30px;\\n    }\\n    .medium {\\n        width: 60px;\\n        height: 60px;\\n    }\\n    .big {\\n        width: 130px;\\n        height: 130px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0F2YXRhci5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksa0JBQWtCO1FBQ2xCLFVBQVU7UUFDVixhQUFhO1FBQ2Isa0JBQWtCO1FBQ2xCLGdCQUFnQjtJQUNwQjs7SUFFQTtRQUNJLFdBQVc7UUFDWCxZQUFZO0lBQ2hCO0lBQ0E7UUFDSSxXQUFXO1FBQ1gsWUFBWTtJQUNoQjtJQUNBO1FBQ0ksWUFBWTtRQUNaLGFBQWE7SUFDakIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvQXZhdGFyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5hdmEge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB9XG5cbiAgICAuc21hbGwge1xuICAgICAgICB3aWR0aDogMzBweDtcbiAgICAgICAgaGVpZ2h0OiAzMHB4O1xuICAgIH1cbiAgICAubWVkaXVtIHtcbiAgICAgICAgd2lkdGg6IDYwcHg7XG4gICAgICAgIGhlaWdodDogNjBweDtcbiAgICB9XG4gICAgLmJpZyB7XG4gICAgICAgIHdpZHRoOiAxMzBweDtcbiAgICAgICAgaGVpZ2h0OiAxMzBweDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAgBI,IAAI,eAAC,CAAC,AACF,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,MAAM,eAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,OAAO,eAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,IAAI,eAAC,CAAC,AACF,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,AACjB,CAAC\"}"
};

const Avatar = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	let { alt } = $$props;
	let { size = null } = $$props; // small|medium|big
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	$$result.css.add(css$4);
	let classProp = classnames("ava", size, $$props.class);

	return `<div class="${escape(null_to_empty(classProp)) + " svelte-1vvwi7d"}">
    ${validate_component(Picture, "Picture").$$render($$result, { src, alt }, {}, {})}
</div>`;
});

/* src/components/Button.svelte generated by Svelte v3.18.1 */

const css$5 = {
	code: ".btn.svelte-1ckvyl7:not(.auto){width:100%;padding:5px 15px}.btn{flex:none;cursor:pointer;max-width:100%;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;font-weight:bold;text-align:center;align-items:center;display:inline-flex;justify-content:center;color:rgba(var(--theme-font-color));border-radius:var(--border-radius-medium)}.btn.small{padding:5px;min-width:calc(var(--min-interactive-size) / 1.5);min-height:calc(var(--min-interactive-size) / 1.5)}.btn.medium{padding:5px 10px;min-width:var(--min-interactive-size);min-height:var(--min-interactive-size)}.btn.big{padding:5px 15px;min-width:calc(var(--min-interactive-size) * 1.5);min-height:calc(var(--min-interactive-size) * 1.5)}.btn:focus{background-color:rgba(var(--color-black), 0.1)}.btn:hover{background-color:rgba(var(--color-black), 0.1)}.btn:active{background-color:rgba(var(--color-black), 0.1)}.btn.white{color:rgba(var(--color-font-dark));background-color:rgba(var(--color-white))}.btn.white:focus{background-color:rgba(var(--color-white), .85)}.btn.white:hover{box-shadow:var(--shadow-primary)}.btn.white:active{box-shadow:var(--shadow-primary)}.btn.success{color:rgba(var(--color-font-light));background-color:rgba(var(--color-success))}.btn.success:focus{background-color:rgba(var(--color-success), .85)}.btn.success:hover{box-shadow:var(--shadow-primary)}.btn.success:active{box-shadow:var(--shadow-primary)}.btn.warning{color:rgba(var(--color-font-light));background-color:rgba(var(--color-warning))}.btn.warning:focus{background-color:rgba(var(--color-warning), .85)}.btn.warning:hover{box-shadow:var(--shadow-primary)}.btn.warning:active{box-shadow:var(--shadow-primary)}.btn.danger{color:rgba(var(--color-font-light));background-color:rgba(var(--color-danger))}.btn.danger:focus{background-color:rgba(var(--color-danger), .85)}.btn.danger:hover{box-shadow:var(--shadow-primary)}.btn.danger:active{box-shadow:var(--shadow-primary)}",
	map: "{\"version\":3,\"file\":\"Button.svelte\",\"sources\":[\"Button.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let is = undefined\\n    export let id = undefined\\n    export let href = undefined\\n    export let auto = false\\n    export let type = 'button'\\n    export let size = undefined\\n    export let title = undefined\\n    export let htmlFor = undefined\\n    export let disabled = false\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n\\n    $: classProp = classnames('btn', is, size, $$props.class, { auto, disabled })\\n\\n    function onLabelClick(e) {\\n        document.getElementById(htmlFor).click()\\n        !disabled && dispatch('click', e)\\n    }\\n\\n    function onClick(e) {\\n        !disabled && dispatch('click', e)\\n    }\\n</script>\\n\\n{#if href}\\n    <a\\n            {id}\\n            {href}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </a>\\n{:else if htmlFor}\\n    <label\\n            {id}\\n            {disabled}\\n            for={htmlFor}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onLabelClick}\\n    >\\n        <slot></slot>\\n    </label>\\n{:else}\\n    <button\\n            {id}\\n            {type}\\n            {disabled}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </button>\\n{/if}\\n\\n<style>\\n    .btn:not(.auto) {\\n        width: 100%;\\n        padding: 5px 15px;\\n    }\\n\\n    :global(.btn) {\\n        flex: none;\\n        cursor: pointer;\\n        max-width: 100%;\\n        -webkit-user-select: none;\\n           -moz-user-select: none;\\n            -ms-user-select: none;\\n                user-select: none;\\n        font-weight: bold;\\n        text-align: center;\\n        align-items: center;\\n        display: inline-flex;\\n        justify-content: center;\\n        color: rgba(var(--theme-font-color));\\n        border-radius: var(--border-radius-medium);\\n    }\\n\\n    :global(.btn.small) {\\n        padding: 5px;\\n        min-width: calc(var(--min-interactive-size) / 1.5);\\n        min-height: calc(var(--min-interactive-size) / 1.5);\\n    }\\n\\n    :global(.btn.medium) {\\n        padding: 5px 10px;\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n    }\\n\\n    :global(.btn.big) {\\n        padding: 5px 15px;\\n        min-width: calc(var(--min-interactive-size) * 1.5);\\n        min-height: calc(var(--min-interactive-size) * 1.5);\\n    }\\n\\n    :global(.btn:focus) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:hover) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:active) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    /* White */\\n\\n    :global(.btn).white {\\n        color: rgba(var(--color-font-dark));\\n        background-color: rgba(var(--color-white));\\n    }\\n\\n    :global(.btn).white:focus {\\n        background-color: rgba(var(--color-white), .85);\\n    }\\n\\n    :global(.btn).white:hover {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).white:active {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Success */\\n\\n    :global(.btn).success {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-success));\\n    }\\n\\n    :global(.btn).success:focus {\\n        background-color: rgba(var(--color-success), .85);\\n    }\\n\\n    :global(.btn).success:hover {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).success:active {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Warning */\\n\\n    :global(.btn).warning {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-warning));\\n    }\\n\\n    :global(.btn).warning:focus {\\n        background-color: rgba(var(--color-warning), .85);\\n    }\\n\\n    :global(.btn).warning:hover {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).warning:active {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Danger */\\n\\n    :global(.btn).danger {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-danger));\\n    }\\n\\n    :global(.btn).danger:focus {\\n        background-color: rgba(var(--color-danger), .85);\\n    }\\n\\n    :global(.btn).danger:hover {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).danger:active {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0J1dHRvbi5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksV0FBVztRQUNYLGlCQUFpQjtJQUNyQjs7SUFFQTtRQUNJLFVBQVU7UUFDVixlQUFlO1FBQ2YsZUFBZTtRQUNmLHlCQUFpQjtXQUFqQixzQkFBaUI7WUFBakIscUJBQWlCO2dCQUFqQixpQkFBaUI7UUFDakIsaUJBQWlCO1FBQ2pCLGtCQUFrQjtRQUNsQixtQkFBbUI7UUFDbkIsb0JBQW9CO1FBQ3BCLHVCQUF1QjtRQUN2QixvQ0FBb0M7UUFDcEMsMENBQTBDO0lBQzlDOztJQUVBO1FBQ0ksWUFBWTtRQUNaLGtEQUFrRDtRQUNsRCxtREFBbUQ7SUFDdkQ7O0lBRUE7UUFDSSxpQkFBaUI7UUFDakIsc0NBQXNDO1FBQ3RDLHVDQUF1QztJQUMzQzs7SUFFQTtRQUNJLGlCQUFpQjtRQUNqQixrREFBa0Q7UUFDbEQsbURBQW1EO0lBQ3ZEOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBLFVBQVU7O0lBRVY7UUFDSSxtQ0FBbUM7UUFDbkMsMENBQTBDO0lBQzlDOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBO1FBQ0ksaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0ksaUNBQWlDO0lBQ3JDOztJQUVBLFlBQVk7O0lBRVo7UUFDSSxvQ0FBb0M7UUFDcEMsNENBQTRDO0lBQ2hEOztJQUVBO1FBQ0ksaURBQWlEO0lBQ3JEOztJQUVBO1FBQ0ksaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0ksaUNBQWlDO0lBQ3JDOztJQUVBLFlBQVk7O0lBRVo7UUFDSSxvQ0FBb0M7UUFDcEMsNENBQTRDO0lBQ2hEOztJQUVBO1FBQ0ksaURBQWlEO0lBQ3JEOztJQUVBO1FBQ0ksaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0ksaUNBQWlDO0lBQ3JDOztJQUVBLFdBQVc7O0lBRVg7UUFDSSxvQ0FBb0M7UUFDcEMsMkNBQTJDO0lBQy9DOztJQUVBO1FBQ0ksZ0RBQWdEO0lBQ3BEOztJQUVBO1FBQ0ksaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0ksaUNBQWlDO0lBQ3JDIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL0J1dHRvbi5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuYnRuOm5vdCguYXV0bykge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgcGFkZGluZzogNXB4IDE1cHg7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS10aGVtZS1mb250LWNvbG9yKSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtbWVkaXVtKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4uc21hbGwpIHtcbiAgICAgICAgcGFkZGluZzogNXB4O1xuICAgICAgICBtaW4td2lkdGg6IGNhbGModmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpIC8gMS41KTtcbiAgICAgICAgbWluLWhlaWdodDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgLyAxLjUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bi5tZWRpdW0pIHtcbiAgICAgICAgcGFkZGluZzogNXB4IDEwcHg7XG4gICAgICAgIG1pbi13aWR0aDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgICAgICBtaW4taGVpZ2h0OiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuLmJpZykge1xuICAgICAgICBwYWRkaW5nOiA1cHggMTVweDtcbiAgICAgICAgbWluLXdpZHRoOiBjYWxjKHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKSAqIDEuNSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IGNhbGModmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpICogMS41KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG46Zm9jdXMpIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuOmhvdmVyKSB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjEpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bjphY3RpdmUpIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuXG4gICAgLyogV2hpdGUgKi9cblxuICAgIDpnbG9iYWwoLmJ0bikud2hpdGUge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWRhcmspKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci13aGl0ZSkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2hpdGU6Zm9jdXMge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXdoaXRlKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLndoaXRlOmhvdmVyIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2hpdGU6YWN0aXZlIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC8qIFN1Y2Nlc3MgKi9cblxuICAgIDpnbG9iYWwoLmJ0bikuc3VjY2VzcyB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5zdWNjZXNzOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLnN1Y2Nlc3M6aG92ZXIge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5zdWNjZXNzOmFjdGl2ZSB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBXYXJuaW5nICovXG5cbiAgICA6Z2xvYmFsKC5idG4pLndhcm5pbmcge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2FybmluZzpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZyksIC44NSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS53YXJuaW5nOmhvdmVyIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2FybmluZzphY3RpdmUge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLyogRGFuZ2VyICovXG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhbmdlciB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhbmdlcjpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhbmdlcjpob3ZlciB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhbmdlcjphY3RpdmUge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAsEI,mBAAI,KAAK,KAAK,CAAC,AAAC,CAAC,AACb,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,IAAI,AACrB,CAAC,AAEO,IAAI,AAAE,CAAC,AACX,IAAI,CAAE,IAAI,CACV,MAAM,CAAE,OAAO,CACf,SAAS,CAAE,IAAI,CACf,mBAAmB,CAAE,IAAI,CACtB,gBAAgB,CAAE,IAAI,CACrB,eAAe,CAAE,IAAI,CACjB,WAAW,CAAE,IAAI,CACzB,WAAW,CAAE,IAAI,CACjB,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,WAAW,CACpB,eAAe,CAAE,MAAM,CACvB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,aAAa,CAAE,IAAI,sBAAsB,CAAC,AAC9C,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,UAAU,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AACvD,CAAC,AAEO,WAAW,AAAE,CAAC,AAClB,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,AAC3C,CAAC,AAEO,QAAQ,AAAE,CAAC,AACf,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,SAAS,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,UAAU,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AACvD,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,WAAW,AAAE,CAAC,AAClB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAIO,IAAI,AAAC,MAAM,AAAC,CAAC,AACjB,KAAK,CAAE,KAAK,IAAI,iBAAiB,CAAC,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,AAC9C,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAEO,IAAI,AAAC,MAAM,OAAO,AAAC,CAAC,AACxB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAIO,IAAI,AAAC,QAAQ,AAAC,CAAC,AACnB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,CAAC,GAAG,CAAC,AACrD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAEO,IAAI,AAAC,QAAQ,OAAO,AAAC,CAAC,AAC1B,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAIO,IAAI,AAAC,QAAQ,AAAC,CAAC,AACnB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,CAAC,GAAG,CAAC,AACrD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAEO,IAAI,AAAC,QAAQ,OAAO,AAAC,CAAC,AAC1B,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAIO,IAAI,AAAC,OAAO,AAAC,CAAC,AAClB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,AAC/C,CAAC,AAEO,IAAI,AAAC,OAAO,MAAM,AAAC,CAAC,AACxB,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,GAAG,CAAC,AACpD,CAAC,AAEO,IAAI,AAAC,OAAO,MAAM,AAAC,CAAC,AACxB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAEO,IAAI,AAAC,OAAO,OAAO,AAAC,CAAC,AACzB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC\"}"
};

const Button = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { is = undefined } = $$props;
	let { id = undefined } = $$props;
	let { href = undefined } = $$props;
	let { auto = false } = $$props;
	let { type = "button" } = $$props;
	let { size = undefined } = $$props;
	let { title = undefined } = $$props;
	let { htmlFor = undefined } = $$props;
	let { disabled = false } = $$props;
	let { ariaLabel = undefined } = $$props;
	let titleProp = title || ariaLabel;
	let ariaLabelProp = ariaLabel || title;

	if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.href === void 0 && $$bindings.href && href !== void 0) $$bindings.href(href);
	if ($$props.auto === void 0 && $$bindings.auto && auto !== void 0) $$bindings.auto(auto);
	if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.htmlFor === void 0 && $$bindings.htmlFor && htmlFor !== void 0) $$bindings.htmlFor(htmlFor);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	$$result.css.add(css$5);
	let classProp = classnames("btn", is, size, $$props.class, { auto, disabled });

	return `${href
	? `<a${add_attribute("id", id, 0)}${add_attribute("href", href, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1ckvyl7"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </a>`
	: `${htmlFor
		? `<label${add_attribute("id", id, 0)} ${disabled ? "disabled" : ""}${add_attribute("for", htmlFor, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1ckvyl7"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </label>`
		: `<button${add_attribute("id", id, 0)}${add_attribute("type", type, 0)} ${disabled ? "disabled" : ""}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1ckvyl7"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </button>`}`}`;
});

/* src/components/Divider.svelte generated by Svelte v3.18.1 */

const css$6 = {
	code: ".divider.svelte-16e0qet{margin:0;border:none;box-sizing:content-box;background-clip:content-box}.info.svelte-16e0qet{background-color:rgb(var(--color-info))}.success.svelte-16e0qet{background-color:rgb(var(--color-success))}.warning.svelte-16e0qet{background-color:rgb(var(--color-warning))}.danger.svelte-16e0qet{background-color:rgb(var(--color-danger))}",
	map: "{\"version\":3,\"file\":\"Divider.svelte\",\"sources\":[\"Divider.svelte\"],\"sourcesContent\":[\"<script>\\n    import { toCSSString, classnames } from '../utils'\\n\\n    export let is = 'info'\\n    export let size = 0\\n    export let width = 2\\n\\n    $: classProp = classnames('divider', is, $$props.class)\\n    $: styleProp = toCSSString({ padding: `${size / 2}px 0`, height: `${width}px` })\\n</script>\\n\\n<hr class={classProp} style={styleProp}>\\n\\n<style>\\n    .divider {\\n        margin: 0;\\n        border: none;\\n        box-sizing: content-box;\\n        background-clip: content-box;\\n    }\\n\\n    .info {\\n        background-color: rgb(var(--color-info));\\n    }\\n\\n    .success {\\n        background-color: rgb(var(--color-success));\\n    }\\n\\n    .warning {\\n        background-color: rgb(var(--color-warning));\\n    }\\n\\n    .danger {\\n        background-color: rgb(var(--color-danger));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0RpdmlkZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFNBQVM7UUFDVCxZQUFZO1FBQ1osdUJBQXVCO1FBQ3ZCLDRCQUE0QjtJQUNoQzs7SUFFQTtRQUNJLHdDQUF3QztJQUM1Qzs7SUFFQTtRQUNJLDJDQUEyQztJQUMvQzs7SUFFQTtRQUNJLDJDQUEyQztJQUMvQzs7SUFFQTtRQUNJLDBDQUEwQztJQUM5QyIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9EaXZpZGVyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5kaXZpZGVyIHtcbiAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgIGJveC1zaXppbmc6IGNvbnRlbnQtYm94O1xuICAgICAgICBiYWNrZ3JvdW5kLWNsaXA6IGNvbnRlbnQtYm94O1xuICAgIH1cblxuICAgIC5pbmZvIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICB9XG5cbiAgICAuc3VjY2VzcyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgfVxuXG4gICAgLndhcm5pbmcge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgIH1cblxuICAgIC5kYW5nZXIge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAcI,QAAQ,eAAC,CAAC,AACN,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,WAAW,CACvB,eAAe,CAAE,WAAW,AAChC,CAAC,AAED,KAAK,eAAC,CAAC,AACH,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AAC5C,CAAC,AAED,QAAQ,eAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC/C,CAAC,AAED,QAAQ,eAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC/C,CAAC,AAED,OAAO,eAAC,CAAC,AACL,gBAAgB,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AAC9C,CAAC\"}"
};

const Divider = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { is = "info" } = $$props;
	let { size = 0 } = $$props;
	let { width = 2 } = $$props;
	if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	$$result.css.add(css$6);
	let classProp = classnames("divider", is, $$props.class);

	let styleProp = toCSSString({
		padding: `${size / 2}px 0`,
		height: `${width}px`
	});

	return `<hr class="${escape(null_to_empty(classProp)) + " svelte-16e0qet"}"${add_attribute("style", styleProp, 0)}>`;
});

/* src/components/Progress.svelte generated by Svelte v3.18.1 */

const css$7 = {
	code: ".progress.medium.svelte-1mtqwje.svelte-1mtqwje{--progress-height:10px;--progress-padding-point:1px}.progress.svelte-1mtqwje.svelte-1mtqwje{flex:0;width:100%;border-radius:9999px;height:var(--progress-height)}.progress-inner-frame.svelte-1mtqwje.svelte-1mtqwje{position:relative;display:flex;width:100%;height:100%;border-radius:9999px;overflow:hidden;padding:var(--progress-padding-point) 0;background-color:rgba(var(--theme-color-primary-opposite), .1);background-clip:content-box}.progress-core.svelte-1mtqwje.svelte-1mtqwje{position:absolute;top:0;left:0;height:100%;flex:none;align-self:stretch;transition:1s ease-in-out;border-radius:9999px;background-color:rgba(var(--color-info))}.progress[aria-valuenow=\"100\"].svelte-1mtqwje .progress-core.svelte-1mtqwje{background-color:rgba(var(--color-success))}",
	map: "{\"version\":3,\"file\":\"Progress.svelte\",\"sources\":[\"Progress.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, onMount } from 'svelte'\\n    import { classnames, safeGet } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let id = undefined\\n    export let value = 0 // 0 - 100\\n    export let size = 'medium'\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n    export let borderRadius = undefined\\n\\n    $: val = 0\\n    $: titleProp = title || `Progress - ${val}%`\\n    $: ariaLabelProp = ariaLabel || `Progress - ${val}%`\\n    $: classProp = classnames('progress', size, $$props.class)\\n\\n    onMount(() => {\\n        // Make loading progress effect on mount component.\\n        requestAnimationFrame(() => val = Number.isFinite(+value) ? Math.max(0, Math.min(+value, 100)) : 0, 0)\\n    })\\n\\n    function getBorderRadius(borders, defaults = '99999px') {\\n        const brDefault = new Array(4).fill(defaults)\\n        const bds = safeGet(() => borders.split(' '), [], true)\\n        const rule = 'border-radius'\\n        return `${rule}:${brDefault.map((def, i) => `${bds[i] || def}`).join(' ')}`\\n    }\\n</script>\\n\\n\\n<div\\n        {id}\\n        class={classProp}\\n        title={titleProp}\\n        aria-label={ariaLabelProp}\\n        role=\\\"progressbar\\\"\\n        aria-valuemin=\\\"0\\\"\\n        aria-valuemax=\\\"100\\\"\\n        aria-valuenow={val}\\n        style={getBorderRadius(borderRadius)}\\n>\\n    <div class=\\\"progress-inner-frame\\\">\\n        <div class=\\\"progress-core\\\" style={`width:${val}%`}></div>\\n    </div>\\n</div>\\n\\n<style>\\n    .progress.medium {\\n        --progress-height: 10px;\\n        --progress-padding-point: 1px;\\n    }\\n\\n    .progress {\\n        flex: 0;\\n        width: 100%;\\n        border-radius: 9999px;\\n        height: var(--progress-height);\\n    }\\n\\n    .progress-inner-frame {\\n        position: relative;\\n        display: flex;\\n        width: 100%;\\n        height: 100%;\\n        border-radius: 9999px;\\n        overflow: hidden;\\n        padding: var(--progress-padding-point) 0;\\n        background-color: rgba(var(--theme-color-primary-opposite), .1);\\n        background-clip: content-box;\\n    }\\n\\n    .progress-core {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        height: 100%;\\n        flex: none;\\n        align-self: stretch;\\n        transition: 1s ease-in-out;\\n        border-radius: 9999px;\\n        background-color: rgba(var(--color-info));\\n    }\\n\\n    .progress[aria-valuenow=\\\"100\\\"] .progress-core {\\n        background-color: rgba(var(--color-success));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL1Byb2dyZXNzLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSx1QkFBdUI7UUFDdkIsNkJBQTZCO0lBQ2pDOztJQUVBO1FBQ0ksT0FBTztRQUNQLFdBQVc7UUFDWCxxQkFBcUI7UUFDckIsOEJBQThCO0lBQ2xDOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLGFBQWE7UUFDYixXQUFXO1FBQ1gsWUFBWTtRQUNaLHFCQUFxQjtRQUNyQixnQkFBZ0I7UUFDaEIsd0NBQXdDO1FBQ3hDLCtEQUErRDtRQUMvRCw0QkFBNEI7SUFDaEM7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsTUFBTTtRQUNOLE9BQU87UUFDUCxZQUFZO1FBQ1osVUFBVTtRQUNWLG1CQUFtQjtRQUNuQiwwQkFBMEI7UUFDMUIscUJBQXFCO1FBQ3JCLHlDQUF5QztJQUM3Qzs7SUFFQTtRQUNJLDRDQUE0QztJQUNoRCIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9Qcm9ncmVzcy5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAucHJvZ3Jlc3MubWVkaXVtIHtcbiAgICAgICAgLS1wcm9ncmVzcy1oZWlnaHQ6IDEwcHg7XG4gICAgICAgIC0tcHJvZ3Jlc3MtcGFkZGluZy1wb2ludDogMXB4O1xuICAgIH1cblxuICAgIC5wcm9ncmVzcyB7XG4gICAgICAgIGZsZXg6IDA7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA5OTk5cHg7XG4gICAgICAgIGhlaWdodDogdmFyKC0tcHJvZ3Jlc3MtaGVpZ2h0KTtcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3MtaW5uZXItZnJhbWUge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDk5OTlweDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgcGFkZGluZzogdmFyKC0tcHJvZ3Jlc3MtcGFkZGluZy1wb2ludCkgMDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1jb2xvci1wcmltYXJ5LW9wcG9zaXRlKSwgLjEpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNsaXA6IGNvbnRlbnQtYm94O1xuICAgIH1cblxuICAgIC5wcm9ncmVzcy1jb3JlIHtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgdHJhbnNpdGlvbjogMXMgZWFzZS1pbi1vdXQ7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDk5OTlweDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzW2FyaWEtdmFsdWVub3c9XCIxMDBcIl0gLnByb2dyZXNzLWNvcmUge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAiDI,SAAS,OAAO,8BAAC,CAAC,AACd,iBAAiB,CAAE,IAAI,CACvB,wBAAwB,CAAE,GAAG,AACjC,CAAC,AAED,SAAS,8BAAC,CAAC,AACP,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,MAAM,CACrB,MAAM,CAAE,IAAI,iBAAiB,CAAC,AAClC,CAAC,AAED,qBAAqB,8BAAC,CAAC,AACnB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,MAAM,CACrB,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,IAAI,wBAAwB,CAAC,CAAC,CAAC,CACxC,gBAAgB,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,EAAE,CAAC,CAC/D,eAAe,CAAE,WAAW,AAChC,CAAC,AAED,cAAc,8BAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,CACZ,IAAI,CAAE,IAAI,CACV,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,EAAE,CAAC,WAAW,CAC1B,aAAa,CAAE,MAAM,CACrB,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC,AAED,SAAS,CAAC,aAAa,CAAC,KAAK,gBAAC,CAAC,cAAc,eAAC,CAAC,AAC3C,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC\"}"
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

	onMount(() => {
		// Make loading progress effect on mount component.
		requestAnimationFrame(
			() => val = Number.isFinite(+value)
			? Math.max(0, Math.min(+value, 100))
			: 0,
			0
		);
	});

	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	if ($$props.borderRadius === void 0 && $$bindings.borderRadius && borderRadius !== void 0) $$bindings.borderRadius(borderRadius);
	$$result.css.add(css$7);
	let val = 0;
	let titleProp = title || `Progress - ${val}%`;
	let ariaLabelProp = ariaLabel || `Progress - ${val}%`;
	let classProp = classnames("progress", size, $$props.class);

	return `<div${add_attribute("id", id, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1mtqwje"}"${add_attribute("title", titleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)} role="${"progressbar"}" aria-valuemin="${"0"}" aria-valuemax="${"100"}"${add_attribute("aria-valuenow", val, 0)}${add_attribute("style", getBorderRadius(borderRadius), 0)}>
    <div class="${"progress-inner-frame svelte-1mtqwje"}">
        <div class="${"progress-core svelte-1mtqwje"}"${add_attribute("style", `width:${val}%`, 0)}></div>
    </div>
</div>`;
});

/* src/components/Carousel.svelte generated by Svelte v3.18.1 */

const css$8 = {
	code: ".carousel.svelte-r6xd4.svelte-r6xd4,.carousel-inner.svelte-r6xd4.svelte-r6xd4,.carousel-inner.svelte-r6xd4 li.svelte-r6xd4,button.svelte-r6xd4.svelte-r6xd4{position:relative;flex:none;display:flex;overflow:hidden;align-self:stretch;align-items:stretch;justify-content:stretch}.carousel.stretch.svelte-r6xd4 .fluid.svelte-r6xd4{width:100%}.carousel.auto.svelte-r6xd4 .fluid.svelte-r6xd4{width:auto}.carousel.svelte-r6xd4.svelte-r6xd4{width:100%;border-radius:var(--border-radius-big)}.carousel-inner.svelte-r6xd4.svelte-r6xd4::-webkit-scrollbar{display:none}.carousel.svelte-r6xd4 .carousel-inner.svelte-r6xd4{width:100%;overflow-y:hidden;overflow-x:scroll}.carousel-dots.svelte-r6xd4.svelte-r6xd4{position:absolute;left:0;bottom:10px;width:100%;display:flex;align-items:center;justify-items:center;justify-content:center;pointer-events:none}.carousel-dots.svelte-r6xd4 li.svelte-r6xd4{position:relative;width:8px;height:8px;margin:5px;border-radius:50%;overflow:hidden;background-color:rgba(var(--theme-bg-color));box-shadow:var(--shadow-primary)\n    }li.active.svelte-r6xd4.svelte-r6xd4{transform:scale(1.5)}",
	map: "{\"version\":3,\"file\":\"Carousel.svelte\",\"sources\":[\"Carousel.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { waitUntil, classnames } from '../utils'\\n    import Picture from './Picture.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    /**\\n     *\\n     * @type {number | {\\n     *     src: string,\\n     *     srcBig: string,\\n     *     alt: string,\\n     *     onClick?: function,\\n     * }[]}\\n     */\\n    export let items = []\\n    export let dots = true\\n    export let size = 'stretch'\\n    export let initIndex = 0\\n\\n    $: activeDot = initIndex\\n    $: classProp = classnames('carousel', size, $$props.class)\\n\\n    function carousel(node) {\\n        initScrollPosition(node)\\n        node.addEventListener('scroll', onScroll)\\n        return { destroy: () => node.removeEventListener('scroll', onScroll) }\\n    }\\n\\n    function onScroll(e) {\\n        try {\\n            getActiveDot(e.target)\\n        } catch (err) { console.warn('Carousel does not work.', err) }\\n    }\\n\\n    function getActiveDot(parent) {\\n        const { scrollLeft } = parent\\n        const { width } = parent.getBoundingClientRect()\\n        const newActiveDot = Math.round(scrollLeft / width)\\n        if (activeDot !== newActiveDot) activeDot = newActiveDot\\n    }\\n\\n    function initScrollPosition(parent) {\\n        const { width } = parent.getBoundingClientRect()\\n        waitUntil(() => {\\n            parent.scrollLeft = width * activeDot\\n            if (parent.scrollLeft !== width * activeDot) {\\n              throw new Error('Not set.')\\n            }\\n        }, { interval: 50 })\\n    }\\n\\n    function onClick(item, index, e) {\\n        dispatch('click', { item, index, e })\\n        if (typeof item.onClick === 'function') item.onClick(item, index, e)\\n    }\\n\\n</script>\\n\\n<section aria-label=\\\"carousel\\\" class={classProp}>\\n    <ul use:carousel class=\\\"carousel-inner scroll-x-center\\\">\\n        {#each items as item, index}\\n            <li class=\\\"fluid\\\">\\n                <button type=\\\"button\\\" class=\\\"fluid\\\" on:click={onClick.bind(null, item, index)}>\\n                    <slot {item} {index}>\\n                        <Picture {...item}/>\\n                    </slot>\\n                </button>\\n            </li>\\n        {/each}\\n    </ul>\\n\\n\\n    {#if dots}\\n        <ul class=\\\"carousel-dots\\\">\\n            {#each items as _item, i}\\n                <li class={i === activeDot ? 'active' : ''}></li>\\n            {/each}\\n        </ul>\\n    {/if}\\n</section>\\n\\n<style>\\n    .carousel, .carousel-inner, .carousel-inner li, button {\\n        position: relative;\\n        flex: none;\\n        display: flex;\\n        overflow: hidden;\\n        align-self: stretch;\\n        align-items: stretch;\\n        justify-content: stretch;\\n    }\\n\\n    .carousel.stretch .fluid {\\n        width: 100%;\\n    }\\n\\n    .carousel.auto .fluid {\\n        width: auto;\\n    }\\n\\n    .carousel {\\n        width: 100%;\\n        border-radius: var(--border-radius-big);\\n    }\\n\\n    .carousel-inner::-webkit-scrollbar {\\n        display: none;\\n    }\\n\\n    .carousel .carousel-inner {\\n        width: 100%;\\n        overflow-y: hidden;\\n        overflow-x: scroll;\\n    }\\n\\n    .carousel-dots {\\n        position: absolute;\\n        left: 0;\\n        bottom: 10px;\\n        width: 100%;\\n        display: flex;\\n        align-items: center;\\n        justify-items: center;\\n        justify-content: center;\\n        pointer-events: none;\\n    }\\n\\n    .carousel-dots li {\\n        position: relative;\\n        width: 8px;\\n        height: 8px;\\n        margin: 5px;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        background-color: rgba(var(--theme-bg-color));\\n        box-shadow: var(--shadow-primary)\\n    }\\n\\n    li.active {\\n        transform: scale(1.5);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0Nhcm91c2VsLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxrQkFBa0I7UUFDbEIsVUFBVTtRQUNWLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsbUJBQW1CO1FBQ25CLG9CQUFvQjtRQUNwQix3QkFBd0I7SUFDNUI7O0lBRUE7UUFDSSxXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsdUNBQXVDO0lBQzNDOztJQUVBO1FBQ0ksYUFBYTtJQUNqQjs7SUFFQTtRQUNJLFdBQVc7UUFDWCxrQkFBa0I7UUFDbEIsa0JBQWtCO0lBQ3RCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLE9BQU87UUFDUCxZQUFZO1FBQ1osV0FBVztRQUNYLGFBQWE7UUFDYixtQkFBbUI7UUFDbkIscUJBQXFCO1FBQ3JCLHVCQUF1QjtRQUN2QixvQkFBb0I7SUFDeEI7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsVUFBVTtRQUNWLFdBQVc7UUFDWCxXQUFXO1FBQ1gsa0JBQWtCO1FBQ2xCLGdCQUFnQjtRQUNoQiw2Q0FBNkM7UUFDN0M7SUFDSjs7SUFFQTtRQUNJLHFCQUFxQjtJQUN6QiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9DYXJvdXNlbC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuY2Fyb3VzZWwsIC5jYXJvdXNlbC1pbm5lciwgLmNhcm91c2VsLWlubmVyIGxpLCBidXR0b24ge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLnN0cmV0Y2ggLmZsdWlkIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLmF1dG8gLmZsdWlkIHtcbiAgICAgICAgd2lkdGg6IGF1dG87XG4gICAgfVxuXG4gICAgLmNhcm91c2VsIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtYmlnKTtcbiAgICB9XG5cbiAgICAuY2Fyb3VzZWwtaW5uZXI6Oi13ZWJraXQtc2Nyb2xsYmFyIHtcbiAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICB9XG5cbiAgICAuY2Fyb3VzZWwgLmNhcm91c2VsLWlubmVyIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIG92ZXJmbG93LXk6IGhpZGRlbjtcbiAgICAgICAgb3ZlcmZsb3cteDogc2Nyb2xsO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbC1kb3RzIHtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICBib3R0b206IDEwcHg7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICB9XG5cbiAgICAuY2Fyb3VzZWwtZG90cyBsaSB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgd2lkdGg6IDhweDtcbiAgICAgICAgaGVpZ2h0OiA4cHg7XG4gICAgICAgIG1hcmdpbjogNXB4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpXG4gICAgfVxuXG4gICAgbGkuYWN0aXZlIHtcbiAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxLjUpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAoFI,mCAAS,CAAE,yCAAe,CAAE,4BAAe,CAAC,eAAE,CAAE,MAAM,0BAAC,CAAC,AACpD,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,AAC5B,CAAC,AAED,SAAS,qBAAQ,CAAC,MAAM,aAAC,CAAC,AACtB,KAAK,CAAE,IAAI,AACf,CAAC,AAED,SAAS,kBAAK,CAAC,MAAM,aAAC,CAAC,AACnB,KAAK,CAAE,IAAI,AACf,CAAC,AAED,SAAS,0BAAC,CAAC,AACP,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC3C,CAAC,AAED,yCAAe,mBAAmB,AAAC,CAAC,AAChC,OAAO,CAAE,IAAI,AACjB,CAAC,AAED,sBAAS,CAAC,eAAe,aAAC,CAAC,AACvB,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,MAAM,AACtB,CAAC,AAED,cAAc,0BAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,MAAM,CACrB,eAAe,CAAE,MAAM,CACvB,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,2BAAc,CAAC,EAAE,aAAC,CAAC,AACf,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,MAAM,CAAE,GAAG,CACX,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAC7C,UAAU,CAAE,IAAI,gBAAgB,CAAC;IACrC,CAAC,AAED,EAAE,OAAO,0BAAC,CAAC,AACP,SAAS,CAAE,MAAM,GAAG,CAAC,AACzB,CAAC\"}"
};

const Carousel = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { items = [] } = $$props;
	let { dots = true } = $$props;
	let { size = "stretch" } = $$props;
	let { initIndex = 0 } = $$props;

	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.dots === void 0 && $$bindings.dots && dots !== void 0) $$bindings.dots(dots);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.initIndex === void 0 && $$bindings.initIndex && initIndex !== void 0) $$bindings.initIndex(initIndex);
	$$result.css.add(css$8);
	let activeDot = initIndex;
	let classProp = classnames("carousel", size, $$props.class);

	return `<section aria-label="${"carousel"}" class="${escape(null_to_empty(classProp)) + " svelte-r6xd4"}">
    <ul class="${"carousel-inner scroll-x-center svelte-r6xd4"}">
        ${each(items, (item, index) => `<li class="${"fluid svelte-r6xd4"}">
                <button type="${"button"}" class="${"fluid svelte-r6xd4"}">
                    ${$$slots.default
	? $$slots.default({ item, index })
	: `
                        ${validate_component(Picture, "Picture").$$render($$result, Object.assign(item), {}, {})}
                    `}
                </button>
            </li>`)}
    </ul>


    ${dots
	? `<ul class="${"carousel-dots svelte-r6xd4"}">
            ${each(items, (_item, i) => `<li class="${escape(null_to_empty(i === activeDot ? "active" : "")) + " svelte-r6xd4"}"></li>`)}
        </ul>`
	: ``}
</section>`;
});

/* src/components/FancyBox.svelte generated by Svelte v3.18.1 */

const css$9 = {
	code: ".fancy-box.svelte-qxyy5e{position:relative;width:100%;flex:none;display:flex;overflow:hidden;align-self:stretch;align-items:stretch;justify-content:stretch}.fancy-box-ghost.svelte-qxyy5e{z-index:10;position:fixed;top:0;left:0;width:100%;height:100%;display:flex;overflow:hidden;align-items:center;justify-content:center;padding:var(--screen-padding);background-color:rgba(var(--color-black), 0);-webkit-animation:svelte-qxyy5e-fadeInBox .2s ease-in-out forwards;animation:svelte-qxyy5e-fadeInBox .2s ease-in-out forwards}@-webkit-keyframes svelte-qxyy5e-fadeInBox{to{background-color:rgba(var(--color-black), .75)}}@keyframes svelte-qxyy5e-fadeInBox{to{background-color:rgba(var(--color-black), .75)}}",
	map: "{\"version\":3,\"file\":\"FancyBox.svelte\",\"sources\":[\"FancyBox.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    let active = false\\n    function onClick(e) {\\n        active = !active\\n\\n        if (!active)\\n          dispatch('close', e)\\n        else\\n          dispatch('open', e)\\n    }\\n</script>\\n\\n<section role=\\\"button\\\" class=\\\"fancy-box\\\" on:click={onClick}>\\n    <slot></slot>\\n</section>\\n\\n{#if active}\\n    <button type=\\\"button\\\" class=\\\"fancy-box-ghost\\\" on:click={onClick}>\\n        <slot name=\\\"box\\\"></slot>\\n    </button>\\n{/if}\\n\\n<style>\\n    .fancy-box {\\n        position: relative;\\n        width: 100%;\\n        flex: none;\\n        display: flex;\\n        overflow: hidden;\\n        align-self: stretch;\\n        align-items: stretch;\\n        justify-content: stretch;\\n    }\\n\\n    .fancy-box-ghost {\\n        z-index: 10;\\n        position: fixed;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n        display: flex;\\n        overflow: hidden;\\n        align-items: center;\\n        justify-content: center;\\n        padding: var(--screen-padding);\\n        background-color: rgba(var(--color-black), 0);\\n        -webkit-animation: fadeInBox .2s ease-in-out forwards;\\n                animation: fadeInBox .2s ease-in-out forwards;\\n    }\\n\\n    @-webkit-keyframes fadeInBox {\\n        to {\\n            background-color: rgba(var(--color-black), .75);\\n        }\\n    }\\n\\n    @keyframes fadeInBox {\\n        to {\\n            background-color: rgba(var(--color-black), .75);\\n        }\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0ZhbmN5Qm94LnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxrQkFBa0I7UUFDbEIsV0FBVztRQUNYLFVBQVU7UUFDVixhQUFhO1FBQ2IsZ0JBQWdCO1FBQ2hCLG1CQUFtQjtRQUNuQixvQkFBb0I7UUFDcEIsd0JBQXdCO0lBQzVCOztJQUVBO1FBQ0ksV0FBVztRQUNYLGVBQWU7UUFDZixNQUFNO1FBQ04sT0FBTztRQUNQLFdBQVc7UUFDWCxZQUFZO1FBQ1osYUFBYTtRQUNiLGdCQUFnQjtRQUNoQixtQkFBbUI7UUFDbkIsdUJBQXVCO1FBQ3ZCLDhCQUE4QjtRQUM5Qiw2Q0FBNkM7UUFDN0MscURBQTZDO2dCQUE3Qyw2Q0FBNkM7SUFDakQ7O0lBRUE7UUFDSTtZQUNJLCtDQUErQztRQUNuRDtJQUNKOztJQUpBO1FBQ0k7WUFDSSwrQ0FBK0M7UUFDbkQ7SUFDSiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9GYW5jeUJveC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuZmFuY3ktYm94IHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICB9XG5cbiAgICAuZmFuY3ktYm94LWdob3N0IHtcbiAgICAgICAgei1pbmRleDogMTA7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMCk7XG4gICAgICAgIGFuaW1hdGlvbjogZmFkZUluQm94IC4ycyBlYXNlLWluLW91dCBmb3J3YXJkcztcbiAgICB9XG5cbiAgICBAa2V5ZnJhbWVzIGZhZGVJbkJveCB7XG4gICAgICAgIHRvIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuNzUpO1xuICAgICAgICB9XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AA2BI,UAAU,cAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,AAC5B,CAAC,AAED,gBAAgB,cAAC,CAAC,AACd,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAC9B,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,CAAC,CAC7C,iBAAiB,CAAE,uBAAS,CAAC,GAAG,CAAC,WAAW,CAAC,QAAQ,CAC7C,SAAS,CAAE,uBAAS,CAAC,GAAG,CAAC,WAAW,CAAC,QAAQ,AACzD,CAAC,AAED,mBAAmB,uBAAU,CAAC,AAC1B,EAAE,AAAC,CAAC,AACA,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AACL,CAAC,AAED,WAAW,uBAAU,CAAC,AAClB,EAAE,AAAC,CAAC,AACA,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AACL,CAAC\"}"
};

const FancyBox = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();

	$$result.css.add(css$9);

	return `<section role="${"button"}" class="${"fancy-box svelte-qxyy5e"}">
    ${$$slots.default ? $$slots.default({}) : ``}
</section>

${ ``}`;
});

/* src/components/app/Header.svelte generated by Svelte v3.18.1 */

const css$a = {
	code: "nav.svelte-146xvef.svelte-146xvef{position:-webkit-sticky;position:sticky;top:0;height:50px;z-index:10;display:flex;align-items:center;color:rgba(var(--color-font-light));justify-content:space-between;box-shadow:var(--shadow-secondary);border-bottom:1px solid rgba(var(--color-danger), .1);background-color:rgba(var(--color-dark-second))}.selected.svelte-146xvef.svelte-146xvef{position:relative;display:inline-block}.selected.svelte-146xvef.svelte-146xvef::after{position:absolute;content:\"\";width:calc(100% - 1em);height:2px;background-color:rgb(var(--color-danger));display:block;bottom:-1px}.nav-pages.svelte-146xvef a.svelte-146xvef{padding:0.8em 0.5em}.nav-actions.svelte-146xvef.svelte-146xvef{display:flex;align-items:center;margin:-3px}.nav-actions.svelte-146xvef li.svelte-146xvef{padding:3px}.nav-actions.svelte-146xvef a.svelte-146xvef{display:block}.lang-select.svelte-146xvef.svelte-146xvef{padding:5px;background-color:transparent;color:rgba(var(--color-font-light))}.lang-select.svelte-146xvef.svelte-146xvef:hover,.lang-select.svelte-146xvef.svelte-146xvef:focus{box-shadow:none;background-color:rgba(var(--color-black), 0.1)}",
	map: "{\"version\":3,\"file\":\"Header.svelte\",\"sources\":[\"Header.svelte\"],\"sourcesContent\":[\"<script>\\n    import Icon from '../Icon.svelte'\\n    import Button from '../Button.svelte'\\n    import Avatar from '../Avatar.svelte'\\n\\n    export let segment\\n\\n    let isDarkTheme = false\\n\\n    let value = 'ua'\\n\\n    function changeTheme() {\\n        isDarkTheme = !isDarkTheme\\n        document.body.classList.remove('theme-dark')\\n        document.body.classList.remove('theme-light')\\n        document.body.classList.add(isDarkTheme ? 'theme-dark' : 'theme-light')\\n    }\\n</script>\\n\\n<nav class=\\\"container\\\">\\n    <ul class=\\\"nav-pages flex\\\">\\n        <li><a rel=prefetch href='.' class:selected='{segment === undefined}'>home</a></li>\\n        <li><a rel=prefetch href='lists/funds' class:selected='{segment === \\\"lists\\\"}'>lists</a></li>\\n        <li><a href='map' class:selected='{segment === \\\"map\\\"}'>map</a></li>\\n    </ul>\\n\\n    <ul class=\\\"nav-actions\\\">\\n        <li>\\n            <select {value} name=\\\"lang\\\" id=\\\"lang\\\" class=\\\"btn small lang-select\\\">\\n                <option value=\\\"ua\\\">Ua</option>\\n                <option value=\\\"ru\\\">Ru</option>\\n                <option value=\\\"en\\\">En</option>\\n            </select>\\n        </li>\\n\\n        <li>\\n            <Button on:click={changeTheme} auto size=\\\"small\\\">\\n                <Icon type=\\\"moon\\\" size=\\\"medium\\\" class=\\\"theme-svg-fill-opposite\\\" is=\\\"light\\\"/>\\n            </Button>\\n        </li>\\n\\n        <li>\\n            <a class=\\\"btn small\\\" href=\\\"users/me\\\">\\n                <Avatar size=\\\"small\\\" src=\\\"https://placeimg.com/30/30/people\\\" alt=\\\"avatar\\\"/>\\n            </a>\\n        </li>\\n    </ul>\\n</nav>\\n\\n<style>\\n    nav {\\n        position: -webkit-sticky;\\n        position: sticky;\\n        top: 0;\\n        height: 50px;\\n        z-index: 10;\\n        display: flex;\\n        align-items: center;\\n        color: rgba(var(--color-font-light));\\n        justify-content: space-between;\\n        box-shadow: var(--shadow-secondary);\\n        border-bottom: 1px solid rgba(var(--color-danger), .1);\\n        background-color: rgba(var(--color-dark-second));\\n    }\\n\\n    .selected {\\n        position: relative;\\n        display: inline-block;\\n    }\\n\\n    .selected::after {\\n        position: absolute;\\n        content: \\\"\\\";\\n        width: calc(100% - 1em);\\n        height: 2px;\\n        background-color: rgb(var(--color-danger));\\n        display: block;\\n        bottom: -1px;\\n    }\\n\\n    .nav-pages a {\\n        padding: 0.8em 0.5em;\\n    }\\n\\n    .nav-actions {\\n        display: flex;\\n        align-items: center;\\n        margin: -3px;\\n    }\\n\\n    .nav-actions li {\\n        padding: 3px;\\n    }\\n\\n    .nav-actions a {\\n        display: block;\\n    }\\n\\n    .lang-select {\\n        padding: 5px;\\n        background-color: transparent;\\n        color: rgba(var(--color-font-light));\\n    }\\n\\n    .lang-select:hover,\\n    .lang-select:focus {\\n        box-shadow: none;\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9IZWFkZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLHdCQUFnQjtRQUFoQixnQkFBZ0I7UUFDaEIsTUFBTTtRQUNOLFlBQVk7UUFDWixXQUFXO1FBQ1gsYUFBYTtRQUNiLG1CQUFtQjtRQUNuQixvQ0FBb0M7UUFDcEMsOEJBQThCO1FBQzlCLG1DQUFtQztRQUNuQyxzREFBc0Q7UUFDdEQsZ0RBQWdEO0lBQ3BEOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLHFCQUFxQjtJQUN6Qjs7SUFFQTtRQUNJLGtCQUFrQjtRQUNsQixXQUFXO1FBQ1gsdUJBQXVCO1FBQ3ZCLFdBQVc7UUFDWCwwQ0FBMEM7UUFDMUMsY0FBYztRQUNkLFlBQVk7SUFDaEI7O0lBRUE7UUFDSSxvQkFBb0I7SUFDeEI7O0lBRUE7UUFDSSxhQUFhO1FBQ2IsbUJBQW1CO1FBQ25CLFlBQVk7SUFDaEI7O0lBRUE7UUFDSSxZQUFZO0lBQ2hCOztJQUVBO1FBQ0ksY0FBYztJQUNsQjs7SUFFQTtRQUNJLFlBQVk7UUFDWiw2QkFBNkI7UUFDN0Isb0NBQW9DO0lBQ3hDOztJQUVBOztRQUVJLGdCQUFnQjtRQUNoQiwrQ0FBK0M7SUFDbkQiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL0hlYWRlci5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBuYXYge1xuICAgICAgICBwb3NpdGlvbjogc3RpY2t5O1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIGhlaWdodDogNTBweDtcbiAgICAgICAgei1pbmRleDogMTA7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KTtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSwgLjEpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhcmstc2Vjb25kKSk7XG4gICAgfVxuXG4gICAgLnNlbGVjdGVkIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfVxuXG4gICAgLnNlbGVjdGVkOjphZnRlciB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgY29udGVudDogXCJcIjtcbiAgICAgICAgd2lkdGg6IGNhbGMoMTAwJSAtIDFlbSk7XG4gICAgICAgIGhlaWdodDogMnB4O1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICBib3R0b206IC0xcHg7XG4gICAgfVxuXG4gICAgLm5hdi1wYWdlcyBhIHtcbiAgICAgICAgcGFkZGluZzogMC44ZW0gMC41ZW07XG4gICAgfVxuXG4gICAgLm5hdi1hY3Rpb25zIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgbWFyZ2luOiAtM3B4O1xuICAgIH1cblxuICAgIC5uYXYtYWN0aW9ucyBsaSB7XG4gICAgICAgIHBhZGRpbmc6IDNweDtcbiAgICB9XG5cbiAgICAubmF2LWFjdGlvbnMgYSB7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIH1cblxuICAgIC5sYW5nLXNlbGVjdCB7XG4gICAgICAgIHBhZGRpbmc6IDVweDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICB9XG5cbiAgICAubGFuZy1zZWxlY3Q6aG92ZXIsXG4gICAgLmxhbmctc2VsZWN0OmZvY3VzIHtcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAkDI,GAAG,8BAAC,CAAC,AACD,QAAQ,CAAE,cAAc,CACxB,QAAQ,CAAE,MAAM,CAChB,GAAG,CAAE,CAAC,CACN,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,eAAe,CAAE,aAAa,CAC9B,UAAU,CAAE,IAAI,kBAAkB,CAAC,CACnC,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,EAAE,CAAC,CACtD,gBAAgB,CAAE,KAAK,IAAI,mBAAmB,CAAC,CAAC,AACpD,CAAC,AAED,SAAS,8BAAC,CAAC,AACP,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,AACzB,CAAC,AAED,uCAAS,OAAO,AAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,GAAG,CAAC,CACvB,MAAM,CAAE,GAAG,CACX,gBAAgB,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAC1C,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,yBAAU,CAAC,CAAC,eAAC,CAAC,AACV,OAAO,CAAE,KAAK,CAAC,KAAK,AACxB,CAAC,AAED,YAAY,8BAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,2BAAY,CAAC,EAAE,eAAC,CAAC,AACb,OAAO,CAAE,GAAG,AAChB,CAAC,AAED,2BAAY,CAAC,CAAC,eAAC,CAAC,AACZ,OAAO,CAAE,KAAK,AAClB,CAAC,AAED,YAAY,8BAAC,CAAC,AACV,OAAO,CAAE,GAAG,CACZ,gBAAgB,CAAE,WAAW,CAC7B,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,AACxC,CAAC,AAED,0CAAY,MAAM,CAClB,0CAAY,MAAM,AAAC,CAAC,AAChB,UAAU,CAAE,IAAI,CAChB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC\"}"
};

let value = "ua";

const Header = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;

	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$a);

	return `<nav class="${"container svelte-146xvef"}">
    <ul class="${"nav-pages flex svelte-146xvef"}">
        <li><a rel="${"prefetch"}" href="${"."}" class="${["svelte-146xvef", segment === undefined ? "selected" : ""].join(" ").trim()}">home</a></li>
        <li><a rel="${"prefetch"}" href="${"lists/funds"}" class="${["svelte-146xvef", segment === "lists" ? "selected" : ""].join(" ").trim()}">lists</a></li>
        <li><a href="${"map"}" class="${["svelte-146xvef", segment === "map" ? "selected" : ""].join(" ").trim()}">map</a></li>
    </ul>

    <ul class="${"nav-actions svelte-146xvef"}">
        <li class="${"svelte-146xvef"}">
            <select${add_attribute("value", value, 0)} name="${"lang"}" id="${"lang"}" class="${"btn small lang-select svelte-146xvef"}">
                <option value="${"ua"}">Ua</option>
                <option value="${"ru"}">Ru</option>
                <option value="${"en"}">En</option>
            </select>
        </li>

        <li class="${"svelte-146xvef"}">
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

        <li class="${"svelte-146xvef"}">
            <a class="${"btn small svelte-146xvef"}" href="${"users/me"}">
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

const css$b = {
	code: "footer.svelte-nh4nbp{display:flex;align-items:center;justify-content:space-between;padding:var(--screen-padding);box-shadow:inset var(--shadow-primary);background-color:rgba(var(--theme-bg-color))}ul.svelte-nh4nbp{display:flex;margin:-3px}li.svelte-nh4nbp{padding:3px}",
	map: "{\"version\":3,\"file\":\"Footer.svelte\",\"sources\":[\"Footer.svelte\"],\"sourcesContent\":[\"<script>\\n    import Button from '../Button.svelte'\\n</script>\\n\\n<footer>\\n    <p>© {new Date().getFullYear()}</p>\\n    <ul>\\n        <li>\\n            <Button size=\\\"small\\\" is=\\\"success\\\">Action</Button>\\n        </li>\\n    </ul>\\n</footer>\\n\\n<style>\\n    footer {\\n        display: flex;\\n        align-items: center;\\n        justify-content: space-between;\\n        padding: var(--screen-padding);\\n        box-shadow: inset var(--shadow-primary);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n    ul {\\n        display: flex;\\n        margin: -3px;\\n    }\\n\\n    li {\\n        padding: 3px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Gb290ZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGFBQWE7UUFDYixtQkFBbUI7UUFDbkIsOEJBQThCO1FBQzlCLDhCQUE4QjtRQUM5Qix1Q0FBdUM7UUFDdkMsNkNBQTZDO0lBQ2pEOztJQUVBO1FBQ0ksYUFBYTtRQUNiLFlBQVk7SUFDaEI7O0lBRUE7UUFDSSxZQUFZO0lBQ2hCIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2FwcC9Gb290ZXIuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgZm9vdGVyIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBwYWRkaW5nOiB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgICAgIGJveC1zaGFkb3c6IGluc2V0IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvcikpO1xuICAgIH1cblxuICAgIHVsIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgbWFyZ2luOiAtM3B4O1xuICAgIH1cblxuICAgIGxpIHtcbiAgICAgICAgcGFkZGluZzogM3B4O1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAcI,MAAM,cAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,aAAa,CAC9B,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAC9B,UAAU,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CACvC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC,AAED,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,GAAG,AAChB,CAAC\"}"
};

const Footer = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$b);

	return `<footer class="${"svelte-nh4nbp"}">
    <p>© ${escape(new Date().getFullYear())}</p>
    <ul class="${"svelte-nh4nbp"}">
        <li class="${"svelte-nh4nbp"}">
            ${validate_component(Button, "Button").$$render($$result, { size: "small", is: "success" }, {}, { default: () => `Action` })}
        </li>
    </ul>
</footer>`;
});

/* src/components/app/Documents.svelte generated by Svelte v3.18.1 */

const css$c = {
	code: "div.svelte-1191jt7{flex:none;display:flex;align-self:stretch;height:180px;width:126px;padding:0 5px;box-sizing:content-box}div.start.svelte-1191jt7{padding-left:var(--screen-padding)}div.end.svelte-1191jt7{padding-right:var(--screen-padding)}",
	map: "{\"version\":3,\"file\":\"Documents.svelte\",\"sources\":[\"Documents.svelte\"],\"sourcesContent\":[\"<script>\\n    import Card from '../Card.svelte'\\n    import Picture from '../Picture.svelte'\\n    import Carousel from '../Carousel.svelte'\\n\\n    const cardSample = {\\n        src: 'https://placeimg.com/300/300/people',\\n        alt: '10грн',\\n    }\\n\\n    const all = new Array(5).fill(cardSample)\\n</script>\\n\\n<Carousel items={all} size=\\\"auto\\\" dots={false} let:item={item} let:index={index}>\\n    <div class={!index ? 'start' : index === all.length - 1 ? 'end' : ''}>\\n        <Card class=\\\"flex\\\">\\n            <Picture {...item} size=\\\"contain\\\"/>\\n        </Card>\\n    </div>\\n</Carousel>\\n\\n<style>\\n    div {\\n        flex: none;\\n        display: flex;\\n        align-self: stretch;\\n        height: 180px;\\n        width: 126px;\\n        padding: 0 5px;\\n        box-sizing: content-box;\\n    }\\n\\n    div.start {\\n        padding-left: var(--screen-padding);\\n    }\\n\\n    div.end {\\n        padding-right: var(--screen-padding);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Eb2N1bWVudHMuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFVBQVU7UUFDVixhQUFhO1FBQ2IsbUJBQW1CO1FBQ25CLGFBQWE7UUFDYixZQUFZO1FBQ1osY0FBYztRQUNkLHVCQUF1QjtJQUMzQjs7SUFFQTtRQUNJLG1DQUFtQztJQUN2Qzs7SUFFQTtRQUNJLG9DQUFvQztJQUN4QyIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvRG9jdW1lbnRzLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIGRpdiB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGhlaWdodDogMTgwcHg7XG4gICAgICAgIHdpZHRoOiAxMjZweDtcbiAgICAgICAgcGFkZGluZzogMCA1cHg7XG4gICAgICAgIGJveC1zaXppbmc6IGNvbnRlbnQtYm94O1xuICAgIH1cblxuICAgIGRpdi5zdGFydCB7XG4gICAgICAgIHBhZGRpbmctbGVmdDogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgIH1cblxuICAgIGRpdi5lbmQge1xuICAgICAgICBwYWRkaW5nLXJpZ2h0OiB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAsBI,GAAG,eAAC,CAAC,AACD,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,CAAC,CAAC,GAAG,CACd,UAAU,CAAE,WAAW,AAC3B,CAAC,AAED,GAAG,MAAM,eAAC,CAAC,AACP,YAAY,CAAE,IAAI,gBAAgB,CAAC,AACvC,CAAC,AAED,GAAG,IAAI,eAAC,CAAC,AACL,aAAa,CAAE,IAAI,gBAAgB,CAAC,AACxC,CAAC\"}"
};

const Documents = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const cardSample = {
		src: "https://placeimg.com/300/300/people",
		alt: "10грн"
	};

	const all = new Array(5).fill(cardSample);
	$$result.css.add(css$c);

	return `${validate_component(Carousel, "Carousel").$$render($$result, { items: all, size: "auto", dots: false }, {}, {
		default: ({ item, index }) => `
    <div class="${escape(null_to_empty(!index ? "start" : index === all.length - 1 ? "end" : "")) + " svelte-1191jt7"}">
        ${validate_component(Card, "Card").$$render($$result, { class: "flex" }, {}, {
			default: () => `
            ${validate_component(Picture, "Picture").$$render($$result, Object.assign(item, { size: "contain" }), {}, {})}
        `
		})}
    </div>
`
	})}`;
});

/* src/components/app/AvatarAndName.svelte generated by Svelte v3.18.1 */

const css$d = {
	code: "section.svelte-v9kkxx.svelte-v9kkxx{width:100%;flex-grow:1;display:flex;align-self:stretch;align-items:center;overflow:hidden}span.svelte-v9kkxx.svelte-v9kkxx{display:flex;flex-direction:column;justify-content:center;overflow:hidden;padding:0 8px}span.svelte-v9kkxx h4.svelte-v9kkxx,span.svelte-v9kkxx sub.svelte-v9kkxx{line-height:1.4;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
	map: "{\"version\":3,\"file\":\"AvatarAndName.svelte\",\"sources\":[\"AvatarAndName.svelte\"],\"sourcesContent\":[\"<script>\\n    import Avatar from '../Avatar.svelte'\\n\\n    export let src = undefined\\n    export let title = 'incognito'\\n    export let subtitle = ''\\n</script>\\n\\n<section>\\n    <Avatar src={src} alt={title}/>\\n\\n    <span>\\n        <h4>{title}</h4>\\n        <sub>{subtitle}</sub>\\n    </span>\\n</section>\\n\\n<style>\\n    section {\\n        width: 100%;\\n        flex-grow: 1;\\n        display: flex;\\n        align-self: stretch;\\n        align-items: center;\\n        overflow: hidden;\\n    }\\n\\n    span {\\n        display: flex;\\n        flex-direction: column;\\n        justify-content: center;\\n        overflow: hidden;\\n        padding: 0 8px;\\n    }\\n\\n    span h4,\\n    span sub {\\n        line-height: 1.4;\\n        max-width: 100%;\\n        overflow: hidden;\\n        white-space: nowrap;\\n        text-overflow: ellipsis;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9BdmF0YXJBbmROYW1lLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxXQUFXO1FBQ1gsWUFBWTtRQUNaLGFBQWE7UUFDYixtQkFBbUI7UUFDbkIsbUJBQW1CO1FBQ25CLGdCQUFnQjtJQUNwQjs7SUFFQTtRQUNJLGFBQWE7UUFDYixzQkFBc0I7UUFDdEIsdUJBQXVCO1FBQ3ZCLGdCQUFnQjtRQUNoQixjQUFjO0lBQ2xCOztJQUVBOztRQUVJLGdCQUFnQjtRQUNoQixlQUFlO1FBQ2YsZ0JBQWdCO1FBQ2hCLG1CQUFtQjtRQUNuQix1QkFBdUI7SUFDM0IiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL0F2YXRhckFuZE5hbWUuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgc2VjdGlvbiB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBwYWRkaW5nOiAwIDhweDtcbiAgICB9XG5cbiAgICBzcGFuIGg0LFxuICAgIHNwYW4gc3ViIHtcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuNDtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAkBI,OAAO,4BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,MAAM,CACnB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,IAAI,4BAAC,CAAC,AACF,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,CACvB,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,kBAAI,CAAC,gBAAE,CACP,kBAAI,CAAC,GAAG,cAAC,CAAC,AACN,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,QAAQ,AAC3B,CAAC\"}"
};

const AvatarAndName = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = undefined } = $$props;
	let { title = "incognito" } = $$props;
	let { subtitle = "" } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$d);

	return `<section class="${"svelte-v9kkxx"}">
    ${validate_component(Avatar, "Avatar").$$render($$result, { src, alt: title }, {}, {})}

    <span class="${"svelte-v9kkxx"}">
        <h4 class="${"svelte-v9kkxx"}">${escape(title)}</h4>
        <sub class="${"svelte-v9kkxx"}">${escape(subtitle)}</sub>
    </span>
</section>`;
});

/* src/components/app/ListItems.svelte generated by Svelte v3.18.1 */

const css$e = {
	code: ".item.svelte-112yxdo{display:block;flex:1 1 auto;box-shadow:var(--shadow-primary);border-radius:var(--border-radius-small);background-color:rgba(var(--theme-bg-color))}",
	map: "{\"version\":3,\"file\":\"ListItems.svelte\",\"sources\":[\"ListItems.svelte\"],\"sourcesContent\":[\"<script>\\n    import AvatarAndName from './AvatarAndName.svelte'\\n\\n    export let items = []\\n    export let basePath = ''\\n</script>\\n\\n{#each items as item}\\n    <a class=\\\"item container\\\" href={`${basePath}/${item.id}`}>\\n        <br>\\n        <AvatarAndName\\n                src={item.org_head_avatar}\\n                title={item.org_head}\\n                subtitle={item.organization}\\n        />\\n        <br>\\n    </a>\\n    <br>\\n{:else}\\n    <section class=\\\"item container\\\">\\n        <p class=\\\"text-center\\\">No organizations</p>\\n    </section>\\n{/each}\\n\\n<style>\\n    .item {\\n        display: block;\\n        flex: 1 1 auto;\\n        box-shadow: var(--shadow-primary);\\n        border-radius: var(--border-radius-small);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9MaXN0SXRlbXMuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGNBQWM7UUFDZCxjQUFjO1FBQ2QsaUNBQWlDO1FBQ2pDLHlDQUF5QztRQUN6Qyw2Q0FBNkM7SUFDakQiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL0xpc3RJdGVtcy5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuaXRlbSB7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzLXNtYWxsKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvcikpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAyBI,KAAK,eAAC,CAAC,AACH,OAAO,CAAE,KAAK,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,aAAa,CAAE,IAAI,qBAAqB,CAAC,CACzC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC\"}"
};

const ListItems = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	let { basePath = "" } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.basePath === void 0 && $$bindings.basePath && basePath !== void 0) $$bindings.basePath(basePath);
	$$result.css.add(css$e);

	return `${items.length
	? each(items, item => `<a class="${"item container svelte-112yxdo"}"${add_attribute("href", `${basePath}/${item.id}`, 0)}>
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
	: `<section class="${"item container svelte-112yxdo"}">
        <p class="${"text-center"}">No organizations</p>
    </section>`}`;
});

/* src/components/fields/Input.svelte generated by Svelte v3.18.1 */

const css$f = {
	code: ".inp.svelte-r3fxqh{width:100%;flex:1 1 0;color:inherit;border-radius:var(--border-radius-small);min-width:var(--min-interactive-size);min-height:var(--min-interactive-size);background-color:rgba(var(--color-white));box-shadow:var(--shadow-field-inset)\n    }",
	map: "{\"version\":3,\"file\":\"Input.svelte\",\"sources\":[\"Input.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '../../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let name\\n    export let value = ''\\n    export let style = {}\\n    export let type = 'text'\\n    export let id = undefined\\n    export let align = undefined\\n    export let maxlength = 1000\\n    export let rows = undefined\\n    export let disabled = false\\n    export let title = undefined\\n    export let invalid = undefined\\n    export let min = undefined // Specifies a minimum value for an <input> element\\n    export let max = undefined // Specifies the maximum value for an <input> element\\n    export let list = undefined // Refers to a <datalist> element that contains pre-defined options for an <input> element\\n    export let form = undefined // Specifies the form the <input> element belongs to\\n    export let readonly = undefined // undefined|readonly\\n    export let required = undefined // undefined|required\\n    export let pattern = undefined // Specifies a regular expression that an <input> element's value is checked against (regexp)\\n    export let autocomplete = true // on|off\\n    export let autoselect = false\\n    export let ariaLabel = undefined\\n    export let placeholder = undefined\\n\\n    let idProp = id || name\\n    let typeProp = type === 'number' ? 'text' : type\\n    let titleProp = title || ariaLabel || placeholder\\n    let ariaLabelProp = ariaLabel || title || placeholder\\n    let autocompleteProp = autocomplete ? 'on' : 'off'\\n    let styleProp = toCSSString({ ...style, textAlign: align })\\n    let patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern\\n\\n    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, invalid })\\n\\n    /**\\n     *\\n     * @description Emit click and select content when \\\"autoselect\\\" is enabled.\\n     *\\n     * @param {MouseEvent} e - Native mouse event.\\n     */\\n    function onClick(e) {\\n        !disabled && dispatch(\\\"click\\\", e)\\n        !disabled && autoselect && e.target.select()\\n    }\\n</script>\\n\\n{#if rows}\\n    <textarea\\n            {min}\\n            {max}\\n            {rows}\\n            {name}\\n            {form}\\n            {align}\\n            {readonly}\\n            {disabled}\\n            {required}\\n            {maxlength}\\n            {placeholder}\\n            id={idProp}\\n            class={classProp}\\n            title={titleProp}\\n            style={styleProp}\\n            pattern={patternProp}\\n            aria-label={ariaLabelProp}\\n            autocomplete={autocompleteProp}\\n            {...{ type: typeProp }}\\n            bind:value\\n            on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n            on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            on:click='{onClick}'\\n    ></textarea>\\n{:else}\\n    <input\\n            {min}\\n            {max}\\n            {name}\\n            {list}\\n            {form}\\n            {align}\\n            {readonly}\\n            {disabled}\\n            {required}\\n            {maxlength}\\n            {placeholder}\\n            id={idProp}\\n            class={classProp}\\n            title={titleProp}\\n            style={styleProp}\\n            pattern={patternProp}\\n            aria-label={ariaLabelProp}\\n            autocomplete={autocompleteProp}\\n            {...{ type: typeProp }}\\n            bind:value\\n            on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n            on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            on:click='{onClick}'\\n    />\\n{/if}\\n\\n<style>\\n    .inp {\\n        width: 100%;\\n        flex: 1 1 0;\\n        color: inherit;\\n        border-radius: var(--border-radius-small);\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n        background-color: rgba(var(--color-white));\\n        box-shadow: var(--shadow-field-inset)\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2ZpZWxkcy9JbnB1dC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksV0FBVztRQUNYLFdBQVc7UUFDWCxjQUFjO1FBQ2QseUNBQXlDO1FBQ3pDLHNDQUFzQztRQUN0Qyx1Q0FBdUM7UUFDdkMsMENBQTBDO1FBQzFDO0lBQ0oiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvZmllbGRzL0lucHV0LnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5pbnAge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleDogMSAxIDA7XG4gICAgICAgIGNvbG9yOiBpbmhlcml0O1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzLXNtYWxsKTtcbiAgICAgICAgbWluLXdpZHRoOiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci13aGl0ZSkpO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctZmllbGQtaW5zZXQpXG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AA0GI,IAAI,cAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACX,KAAK,CAAE,OAAO,CACd,aAAa,CAAE,IAAI,qBAAqB,CAAC,CACzC,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,CACvC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAC1C,UAAU,CAAE,IAAI,oBAAoB,CAAC;IACzC,CAAC\"}"
};

const Input = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { value = "" } = $$props;
	let { style = {} } = $$props;
	let { type = "text" } = $$props;
	let { id = undefined } = $$props;
	let { align = undefined } = $$props;
	let { maxlength = 1000 } = $$props;
	let { rows = undefined } = $$props;
	let { disabled = false } = $$props;
	let { title = undefined } = $$props;
	let { invalid = undefined } = $$props;
	let { min = undefined } = $$props; // Specifies a minimum value for an <input> element
	let { max = undefined } = $$props; // Specifies the maximum value for an <input> element
	let { list = undefined } = $$props; // Refers to a <datalist> element that contains pre-defined options for an <input> element
	let { form = undefined } = $$props; // Specifies the form the <input> element belongs to
	let { readonly = undefined } = $$props; // undefined|readonly
	let { required = undefined } = $$props; // undefined|required
	let { pattern = undefined } = $$props; // Specifies a regular expression that an <input> element's value is checked against (regexp)
	let { autocomplete = true } = $$props; // on|off
	let { autoselect = false } = $$props;
	let { ariaLabel = undefined } = $$props;
	let { placeholder = undefined } = $$props;
	let idProp = id || name;
	let typeProp = type === "number" ? "text" : type;
	let titleProp = title || ariaLabel || placeholder;
	let ariaLabelProp = ariaLabel || title || placeholder;
	let autocompleteProp = autocomplete ? "on" : "off";
	let styleProp = toCSSString({ ...style, textAlign: align });
	let patternProp = type === "number" && !pattern ? "[0-9]*" : pattern;

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
	if ($$props.maxlength === void 0 && $$bindings.maxlength && maxlength !== void 0) $$bindings.maxlength(maxlength);
	if ($$props.rows === void 0 && $$bindings.rows && rows !== void 0) $$bindings.rows(rows);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.invalid === void 0 && $$bindings.invalid && invalid !== void 0) $$bindings.invalid(invalid);
	if ($$props.min === void 0 && $$bindings.min && min !== void 0) $$bindings.min(min);
	if ($$props.max === void 0 && $$bindings.max && max !== void 0) $$bindings.max(max);
	if ($$props.list === void 0 && $$bindings.list && list !== void 0) $$bindings.list(list);
	if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
	if ($$props.readonly === void 0 && $$bindings.readonly && readonly !== void 0) $$bindings.readonly(readonly);
	if ($$props.required === void 0 && $$bindings.required && required !== void 0) $$bindings.required(required);
	if ($$props.pattern === void 0 && $$bindings.pattern && pattern !== void 0) $$bindings.pattern(pattern);
	if ($$props.autocomplete === void 0 && $$bindings.autocomplete && autocomplete !== void 0) $$bindings.autocomplete(autocomplete);
	if ($$props.autoselect === void 0 && $$bindings.autoselect && autoselect !== void 0) $$bindings.autoselect(autoselect);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0) $$bindings.placeholder(placeholder);
	$$result.css.add(css$f);
	let classProp = classnames("inp", $$props.class, { disabled, readonly, required, invalid });

	return `${rows
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
				{ maxlength: escape(maxlength) },
				{ placeholder: escape(placeholder) },
				{ id: escape(idProp) },
				{ class: escape(classProp) },
				{ title: escape(titleProp) },
				{ style: escape(styleProp) },
				{ pattern: escape(patternProp) },
				{ "aria-label": escape(ariaLabelProp) },
				{ autocomplete: escape(autocompleteProp) },
				{ type: typeProp }
			],
			"svelte-r3fxqh"
		)}>${value || ""}</textarea>`
	: `<input${spread(
			[
				{ min: escape(min) },
				{ max: escape(max) },
				{ name: escape(name) },
				{ list: escape(list) },
				{ form: escape(form) },
				{ align: escape(align) },
				{ readonly: readonly || null },
				{ disabled: disabled || null },
				{ required: required || null },
				{ maxlength: escape(maxlength) },
				{ placeholder: escape(placeholder) },
				{ id: escape(idProp) },
				{ class: escape(classProp) },
				{ title: escape(titleProp) },
				{ style: escape(styleProp) },
				{ pattern: escape(patternProp) },
				{ "aria-label": escape(ariaLabelProp) },
				{ autocomplete: escape(autocompleteProp) },
				{ type: typeProp }
			],
			"svelte-r3fxqh"
		)}${add_attribute("value", value, 1)}>`}`;
});

/* src/components/app/SearchLine.svelte generated by Svelte v3.18.1 */

const SearchLine = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<section class="${"search svelte-ibwz4z"}">
    ${validate_component(Input, "Input").$$render($$result, {}, {}, {})}
</section>`;
});

/* src/components/app/TrustButton.svelte generated by Svelte v3.18.1 */

const css$g = {
	code: ".trust-btn.svelte-1fgqkg8.svelte-1fgqkg8{position:relative;display:block;width:100%;height:0;padding-bottom:100%;border-radius:50%;overflow:hidden}div.svelte-1fgqkg8.svelte-1fgqkg8{display:flex;align-items:center;justify-content:center;border-radius:50%;border:4px solid rgba(var(--color-danger));background-color:rgba(var(--color-danger), .2)}.trust-btn.isActive.svelte-1fgqkg8 div.svelte-1fgqkg8{background-color:rgba(var(--color-danger), 1)}.trust-btn.isActive.svelte-1fgqkg8 svg.svelte-1fgqkg8{fill:rgba(var(--color-white));-webkit-animation:none;animation:none;transform:scale(1.1)\n    }svg.svelte-1fgqkg8.svelte-1fgqkg8{width:50%;height:50%;margin-top:3px;max-width:calc(100% - 10px);max-height:calc(100% - 10px);fill:rgba(var(--color-danger));-webkit-animation:svelte-1fgqkg8-pulse 2s infinite;animation:svelte-1fgqkg8-pulse 2s infinite}@-webkit-keyframes svelte-1fgqkg8-pulse{10%{transform:scale(1.1)\n        }20%{transform:scale(1.05)\n        }30%{transform:scale(1.15)\n        }}@keyframes svelte-1fgqkg8-pulse{10%{transform:scale(1.1)\n        }20%{transform:scale(1.05)\n        }30%{transform:scale(1.15)\n        }}",
	map: "{\"version\":3,\"file\":\"TrustButton.svelte\",\"sources\":[\"TrustButton.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '../../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let isActive = null\\n    export let onAsyncClick = null\\n\\n    let isActiveLocal = !!isActive\\n\\n    $: isActiveState = isActive === null ? isActiveLocal : isActive\\n    $: classProp = classnames('trust-btn', $$props.class, { isActive: isActiveState })\\n\\n    function onClickHandler(e) {\\n        onClickEvent(e)\\n        onClickPromise(e)\\n    }\\n\\n    function onClickEvent(e) {\\n        dispatch('click', e)\\n    }\\n\\n    const onClickPromise = async (e) => {\\n        if (typeof onAsyncClick === 'function') {\\n            try {\\n                isActiveLocal = !isActiveLocal\\n                await onAsyncClick(e)\\n            } catch (err) {\\n                isActiveLocal = !isActiveLocal\\n            }\\n        }\\n    }\\n</script>\\n\\n<button type=\\\"button\\\" title=\\\"I trust\\\" class={classProp} on:click={onClickHandler}>\\n    <div class=\\\"full-absolute\\\">\\n        <svg>\\n            <use xlink:href=\\\"#ico-heart-filled\\\" class=\\\"ico-use\\\"/>\\n        </svg>\\n    </div>\\n</button>\\n\\n<style>\\n    .trust-btn {\\n        position: relative;\\n        display: block;\\n        width: 100%;\\n        height: 0;\\n        padding-bottom: 100%;\\n        border-radius: 50%;\\n        overflow: hidden;\\n    }\\n\\n    div {\\n        display: flex;\\n        align-items: center;\\n        justify-content: center;\\n        border-radius: 50%;\\n        border: 4px solid rgba(var(--color-danger));\\n        background-color: rgba(var(--color-danger), .2);\\n    }\\n\\n    .trust-btn.isActive div {\\n        background-color: rgba(var(--color-danger), 1);\\n    }\\n\\n    .trust-btn.isActive svg {\\n        fill: rgba(var(--color-white));\\n        -webkit-animation: none;\\n                animation: none;\\n        transform: scale(1.1)\\n    }\\n\\n    svg {\\n        width: 50%;\\n        height: 50%;\\n        margin-top: 3px;\\n        max-width: calc(100% - 10px);\\n        max-height: calc(100% - 10px);\\n        fill: rgba(var(--color-danger));\\n        -webkit-animation: pulse 2s infinite;\\n                animation: pulse 2s infinite;\\n    }\\n\\n    @-webkit-keyframes pulse {\\n        10% {\\n            transform: scale(1.1)\\n        }\\n        20% {\\n            transform: scale(1.05)\\n        }\\n        30% {\\n            transform: scale(1.15)\\n        }\\n    }\\n\\n    @keyframes pulse {\\n        10% {\\n            transform: scale(1.1)\\n        }\\n        20% {\\n            transform: scale(1.05)\\n        }\\n        30% {\\n            transform: scale(1.15)\\n        }\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9UcnVzdEJ1dHRvbi5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksa0JBQWtCO1FBQ2xCLGNBQWM7UUFDZCxXQUFXO1FBQ1gsU0FBUztRQUNULG9CQUFvQjtRQUNwQixrQkFBa0I7UUFDbEIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksYUFBYTtRQUNiLG1CQUFtQjtRQUNuQix1QkFBdUI7UUFDdkIsa0JBQWtCO1FBQ2xCLDJDQUEyQztRQUMzQywrQ0FBK0M7SUFDbkQ7O0lBRUE7UUFDSSw4Q0FBOEM7SUFDbEQ7O0lBRUE7UUFDSSw4QkFBOEI7UUFDOUIsdUJBQWU7Z0JBQWYsZUFBZTtRQUNmO0lBQ0o7O0lBRUE7UUFDSSxVQUFVO1FBQ1YsV0FBVztRQUNYLGVBQWU7UUFDZiw0QkFBNEI7UUFDNUIsNkJBQTZCO1FBQzdCLCtCQUErQjtRQUMvQixvQ0FBNEI7Z0JBQTVCLDRCQUE0QjtJQUNoQzs7SUFFQTtRQUNJO1lBQ0k7UUFDSjtRQUNBO1lBQ0k7UUFDSjtRQUNBO1lBQ0k7UUFDSjtJQUNKOztJQVZBO1FBQ0k7WUFDSTtRQUNKO1FBQ0E7WUFDSTtRQUNKO1FBQ0E7WUFDSTtRQUNKO0lBQ0oiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL1RydXN0QnV0dG9uLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC50cnVzdC1idG4ge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAwO1xuICAgICAgICBwYWRkaW5nLWJvdHRvbTogMTAwJTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIH1cblxuICAgIGRpdiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIGJvcmRlcjogNHB4IHNvbGlkIHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSwgLjIpO1xuICAgIH1cblxuICAgIC50cnVzdC1idG4uaXNBY3RpdmUgZGl2IHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpLCAxKTtcbiAgICB9XG5cbiAgICAudHJ1c3QtYnRuLmlzQWN0aXZlIHN2ZyB7XG4gICAgICAgIGZpbGw6IHJnYmEodmFyKC0tY29sb3Itd2hpdGUpKTtcbiAgICAgICAgYW5pbWF0aW9uOiBub25lO1xuICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMSlcbiAgICB9XG5cbiAgICBzdmcge1xuICAgICAgICB3aWR0aDogNTAlO1xuICAgICAgICBoZWlnaHQ6IDUwJTtcbiAgICAgICAgbWFyZ2luLXRvcDogM3B4O1xuICAgICAgICBtYXgtd2lkdGg6IGNhbGMoMTAwJSAtIDEwcHgpO1xuICAgICAgICBtYXgtaGVpZ2h0OiBjYWxjKDEwMCUgLSAxMHB4KTtcbiAgICAgICAgZmlsbDogcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICAgICAgYW5pbWF0aW9uOiBwdWxzZSAycyBpbmZpbml0ZTtcbiAgICB9XG5cbiAgICBAa2V5ZnJhbWVzIHB1bHNlIHtcbiAgICAgICAgMTAlIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4xKVxuICAgICAgICB9XG4gICAgICAgIDIwJSB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMDUpXG4gICAgICAgIH1cbiAgICAgICAgMzAlIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4xNSlcbiAgICAgICAgfVxuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AA4CI,UAAU,8BAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,CAAC,CACT,cAAc,CAAE,IAAI,CACpB,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,GAAG,8BAAC,CAAC,AACD,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,aAAa,CAAE,GAAG,CAClB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,cAAc,CAAC,CAAC,CAC3C,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,EAAE,CAAC,AACnD,CAAC,AAED,UAAU,wBAAS,CAAC,GAAG,eAAC,CAAC,AACrB,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,CAAC,CAAC,AAClD,CAAC,AAED,UAAU,wBAAS,CAAC,GAAG,eAAC,CAAC,AACrB,IAAI,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAC9B,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI,CACvB,SAAS,CAAE,MAAM,GAAG,CAAC;IACzB,CAAC,AAED,GAAG,8BAAC,CAAC,AACD,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,UAAU,CAAE,GAAG,CACf,SAAS,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAC5B,UAAU,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAC7B,IAAI,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAC/B,iBAAiB,CAAE,oBAAK,CAAC,EAAE,CAAC,QAAQ,CAC5B,SAAS,CAAE,oBAAK,CAAC,EAAE,CAAC,QAAQ,AACxC,CAAC,AAED,mBAAmB,oBAAM,CAAC,AACtB,GAAG,AAAC,CAAC,AACD,SAAS,CAAE,MAAM,GAAG,CAAC;QACzB,CAAC,AACD,GAAG,AAAC,CAAC,AACD,SAAS,CAAE,MAAM,IAAI,CAAC;QAC1B,CAAC,AACD,GAAG,AAAC,CAAC,AACD,SAAS,CAAE,MAAM,IAAI,CAAC;QAC1B,CAAC,AACL,CAAC,AAED,WAAW,oBAAM,CAAC,AACd,GAAG,AAAC,CAAC,AACD,SAAS,CAAE,MAAM,GAAG,CAAC;QACzB,CAAC,AACD,GAAG,AAAC,CAAC,AACD,SAAS,CAAE,MAAM,IAAI,CAAC;QAC1B,CAAC,AACD,GAAG,AAAC,CAAC,AACD,SAAS,CAAE,MAAM,IAAI,CAAC;QAC1B,CAAC,AACL,CAAC\"}"
};

const TrustButton = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { isActive = null } = $$props;
	let { onAsyncClick = null } = $$props;
	let isActiveLocal = !!isActive;

	if ($$props.isActive === void 0 && $$bindings.isActive && isActive !== void 0) $$bindings.isActive(isActive);
	if ($$props.onAsyncClick === void 0 && $$bindings.onAsyncClick && onAsyncClick !== void 0) $$bindings.onAsyncClick(onAsyncClick);
	$$result.css.add(css$g);
	let isActiveState = isActive === null ? isActiveLocal : isActive;
	let classProp = classnames("trust-btn", $$props.class, { isActive: isActiveState });

	return `<button type="${"button"}" title="${"I trust"}" class="${escape(null_to_empty(classProp)) + " svelte-1fgqkg8"}">
    <div class="${"full-absolute svelte-1fgqkg8"}">
        <svg class="${"svelte-1fgqkg8"}">
            <use xlink:href="${"#ico-heart-filled"}" class="${"ico-use"}"></use>
        </svg>
    </div>
</button>`;
});

/* src/components/app/ListsLayout.svelte generated by Svelte v3.18.1 */

const css$h = {
	code: ".search.svelte-15en0ab.svelte-15en0ab{flex:none;position:relative;box-shadow:var(--shadow-primary)}.list-wrap.svelte-15en0ab.svelte-15en0ab{flex:1 1 0;overflow-x:hidden;overflow-y:auto;padding:0 var(--screen-padding);box-shadow:inset 0 -100px 2000px rgba(var(--color-black), .5)}nav.svelte-15en0ab ul.svelte-15en0ab,nav.svelte-15en0ab li.svelte-15en0ab{display:flex;align-self:stretch;align-items:stretch;justify-content:stretch}li.svelte-15en0ab.svelte-15en0ab{flex:1 1 0}li.svelte-15en0ab a.svelte-15en0ab{flex:1 1 0;align-self:stretch;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px 10px}li.svelte-15en0ab a.svelte-15en0ab:hover,li.svelte-15en0ab a.selected.svelte-15en0ab{background-color:rgba(var(--color-black), .1)}",
	map: "{\"version\":3,\"file\":\"ListsLayout.svelte\",\"sources\":[\"ListsLayout.svelte\"],\"sourcesContent\":[\"<svelte:head>\\n    <title>Charitify - is the application for helping those in need.</title>\\n</svelte:head>\\n\\n<script>\\n    import Footer from './Footer.svelte'\\n    import SearchLine from './SearchLine.svelte'\\n\\n    export let segment\\n</script>\\n\\n<div class=\\\"search theme-bg container\\\">\\n    <br>\\n\\n    <SearchLine/>\\n\\n    <nav>\\n        <ul>\\n            <li><a rel=prefetch href='lists/funds' class:selected='{segment === \\\"charities\\\"}'>funds</a></li>\\n            <li><a rel=prefetch href='lists/organizations' class:selected='{segment === \\\"organizations\\\"}'>organizations</a></li>\\n        </ul>\\n    </nav>\\n</div>\\n\\n<div class=\\\"list-wrap\\\">\\n    <br>\\n\\n    <slot></slot>\\n\\n    <br>\\n    <br>\\n</div>\\n\\n<Footer/>\\n\\n<style>\\n    .search {\\n        flex: none;\\n        position: relative;\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    .list-wrap {\\n        flex: 1 1 0;\\n        overflow-x: hidden;\\n        overflow-y: auto;\\n        padding: 0 var(--screen-padding);\\n        box-shadow: inset 0 -100px 2000px rgba(var(--color-black), .5);\\n    }\\n\\n    nav ul, nav li {\\n        display: flex;\\n        align-self: stretch;\\n        align-items: stretch;\\n        justify-content: stretch;\\n    }\\n\\n    li {\\n        flex: 1 1 0;\\n    }\\n\\n    li a {\\n        flex: 1 1 0;\\n        align-self: stretch;\\n        display: flex;\\n        align-items: center;\\n        justify-content: center;\\n        text-align: center;\\n        padding: 20px 10px;\\n    }\\n\\n    li a:hover, li a.selected {\\n        background-color: rgba(var(--color-black), .1);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9MaXN0c0xheW91dC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksVUFBVTtRQUNWLGtCQUFrQjtRQUNsQixpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsa0JBQWtCO1FBQ2xCLGdCQUFnQjtRQUNoQixnQ0FBZ0M7UUFDaEMsOERBQThEO0lBQ2xFOztJQUVBO1FBQ0ksYUFBYTtRQUNiLG1CQUFtQjtRQUNuQixvQkFBb0I7UUFDcEIsd0JBQXdCO0lBQzVCOztJQUVBO1FBQ0ksV0FBVztJQUNmOztJQUVBO1FBQ0ksV0FBVztRQUNYLG1CQUFtQjtRQUNuQixhQUFhO1FBQ2IsbUJBQW1CO1FBQ25CLHVCQUF1QjtRQUN2QixrQkFBa0I7UUFDbEIsa0JBQWtCO0lBQ3RCOztJQUVBO1FBQ0ksOENBQThDO0lBQ2xEIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2FwcC9MaXN0c0xheW91dC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuc2VhcmNoIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmxpc3Qtd3JhcCB7XG4gICAgICAgIGZsZXg6IDEgMSAwO1xuICAgICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIHBhZGRpbmc6IDAgdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgICAgICBib3gtc2hhZG93OiBpbnNldCAwIC0xMDBweCAyMDAwcHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC41KTtcbiAgICB9XG5cbiAgICBuYXYgdWwsIG5hdiBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgfVxuXG4gICAgbGkge1xuICAgICAgICBmbGV4OiAxIDEgMDtcbiAgICB9XG5cbiAgICBsaSBhIHtcbiAgICAgICAgZmxleDogMSAxIDA7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmc6IDIwcHggMTBweDtcbiAgICB9XG5cbiAgICBsaSBhOmhvdmVyLCBsaSBhLnNlbGVjdGVkIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4xKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAoCI,OAAO,8BAAC,CAAC,AACL,IAAI,CAAE,IAAI,CACV,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,UAAU,8BAAC,CAAC,AACR,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACX,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAChC,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,MAAM,CAAC,MAAM,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AAClE,CAAC,AAED,kBAAG,CAAC,iBAAE,CAAE,kBAAG,CAAC,EAAE,eAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,AAC5B,CAAC,AAED,EAAE,8BAAC,CAAC,AACA,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,AACf,CAAC,AAED,iBAAE,CAAC,CAAC,eAAC,CAAC,AACF,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACX,UAAU,CAAE,OAAO,CACnB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,IAAI,CAAC,IAAI,AACtB,CAAC,AAED,iBAAE,CAAC,gBAAC,MAAM,CAAE,iBAAE,CAAC,CAAC,SAAS,eAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AAClD,CAAC\"}"
};

const ListsLayout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$h);

	return `${($$result.head += `${($$result.title = `<title>Charitify - is the application for helping those in need.</title>`, "")}`, "")}



<div class="${"search theme-bg container svelte-15en0ab"}">
    <br>

    ${validate_component(SearchLine, "SearchLine").$$render($$result, {}, {}, {})}

    <nav class="${"svelte-15en0ab"}">
        <ul class="${"svelte-15en0ab"}">
            <li class="${"svelte-15en0ab"}"><a rel="${"prefetch"}" href="${"lists/funds"}" class="${["svelte-15en0ab", segment === "charities" ? "selected" : ""].join(" ").trim()}">funds</a></li>
            <li class="${"svelte-15en0ab"}"><a rel="${"prefetch"}" href="${"lists/organizations"}" class="${["svelte-15en0ab", segment === "organizations" ? "selected" : ""].join(" ").trim()}">organizations</a></li>
        </ul>
    </nav>
</div>

<div class="${"list-wrap svelte-15en0ab"}">
    <br>

    ${$$slots.default ? $$slots.default({}) : ``}

    <br>
    <br>
</div>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});

/* src/components/app/CharityCard.svelte generated by Svelte v3.18.1 */

const css$i = {
	code: ".card.svelte-1v4nyvu{display:flex;flex-direction:column;flex:none;width:100%;max-width:100%}.rate-wrap.svelte-1v4nyvu{text-align:center;padding-top:6px}.images-wrap.svelte-1v4nyvu{display:flex;height:100px}h4.svelte-1v4nyvu{--card-line-height:1.4;font-size:.8em;line-height:var(--card-line-height);height:calc(var(--font-size) * (var(--card-line-height) / 1.2) * 2);overflow:hidden}",
	map: "{\"version\":3,\"file\":\"CharityCard.svelte\",\"sources\":[\"CharityCard.svelte\"],\"sourcesContent\":[\"<script>\\n    import Rate from '../Rate.svelte'\\n    import Carousel from '../Carousel.svelte'\\n    import Progress from '../Progress.svelte'\\n    import AvatarAndName from './AvatarAndName.svelte'\\n\\n    export let src = undefined\\n    export let title = undefined\\n    export let percent = undefined\\n    export let orgHead = undefined\\n    export let orgHeadSrc = undefined\\n    export let organization = undefined\\n\\n    $: images = new Array(4).fill({\\n        src,\\n        alt: title,\\n    })\\n</script>\\n\\n<a class=\\\"card\\\" href=\\\"funds/id\\\">\\n    <div class=\\\"images-wrap\\\">\\n        <Carousel items={images}/>\\n    </div>\\n\\n    <Progress value={percent} borderRadius=\\\"0 0\\\"/>\\n\\n    <h4>{title}</h4>\\n\\n    <div class=\\\"rate-wrap\\\">\\n        <Rate size=\\\"small\\\"/>\\n    </div>\\n\\n    <footer>\\n        <AvatarAndName src={orgHeadSrc} title={orgHead} subtitle={organization}/>\\n    </footer>\\n</a>\\n\\n<style>\\n    .card {\\n        display: flex;\\n        flex-direction: column;\\n        flex: none;\\n        width: 100%;\\n        max-width: 100%;\\n    }\\n\\n    .rate-wrap {\\n        text-align: center;\\n        padding-top: 6px;\\n    }\\n\\n    .images-wrap {\\n        display: flex;\\n        height: 100px;\\n    }\\n\\n    h4 {\\n        --card-line-height: 1.4;\\n\\n        font-size: .8em;\\n        line-height: var(--card-line-height);\\n        height: calc(var(--font-size) * (var(--card-line-height) / 1.2) * 2);\\n        overflow: hidden;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9DaGFyaXR5Q2FyZC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksYUFBYTtRQUNiLHNCQUFzQjtRQUN0QixVQUFVO1FBQ1YsV0FBVztRQUNYLGVBQWU7SUFDbkI7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksYUFBYTtRQUNiLGFBQWE7SUFDakI7O0lBRUE7UUFDSSx1QkFBdUI7O1FBRXZCLGVBQWU7UUFDZixvQ0FBb0M7UUFDcEMsb0VBQW9FO1FBQ3BFLGdCQUFnQjtJQUNwQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvQ2hhcml0eUNhcmQuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLmNhcmQge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgIH1cblxuICAgIC5yYXRlLXdyYXAge1xuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmctdG9wOiA2cHg7XG4gICAgfVxuXG4gICAgLmltYWdlcy13cmFwIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgaGVpZ2h0OiAxMDBweDtcbiAgICB9XG5cbiAgICBoNCB7XG4gICAgICAgIC0tY2FyZC1saW5lLWhlaWdodDogMS40O1xuXG4gICAgICAgIGZvbnQtc2l6ZTogLjhlbTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IHZhcigtLWNhcmQtbGluZS1oZWlnaHQpO1xuICAgICAgICBoZWlnaHQ6IGNhbGModmFyKC0tZm9udC1zaXplKSAqICh2YXIoLS1jYXJkLWxpbmUtaGVpZ2h0KSAvIDEuMikgKiAyKTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAsCI,KAAK,eAAC,CAAC,AACH,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,IAAI,AACnB,CAAC,AAED,UAAU,eAAC,CAAC,AACR,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,GAAG,AACpB,CAAC,AAED,YAAY,eAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,KAAK,AACjB,CAAC,AAED,EAAE,eAAC,CAAC,AACA,kBAAkB,CAAE,GAAG,CAEvB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,kBAAkB,CAAC,CACpC,MAAM,CAAE,KAAK,IAAI,WAAW,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACpE,QAAQ,CAAE,MAAM,AACpB,CAAC\"}"
};

const CharityCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = undefined } = $$props;
	let { title = undefined } = $$props;
	let { percent = undefined } = $$props;
	let { orgHead = undefined } = $$props;
	let { orgHeadSrc = undefined } = $$props;
	let { organization = undefined } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.percent === void 0 && $$bindings.percent && percent !== void 0) $$bindings.percent(percent);
	if ($$props.orgHead === void 0 && $$bindings.orgHead && orgHead !== void 0) $$bindings.orgHead(orgHead);
	if ($$props.orgHeadSrc === void 0 && $$bindings.orgHeadSrc && orgHeadSrc !== void 0) $$bindings.orgHeadSrc(orgHeadSrc);
	if ($$props.organization === void 0 && $$bindings.organization && organization !== void 0) $$bindings.organization(organization);
	$$result.css.add(css$i);
	let images = new Array(4).fill({ src, alt: title });

	return `<a class="${"card svelte-1v4nyvu"}" href="${"funds/id"}">
    <div class="${"images-wrap svelte-1v4nyvu"}">
        ${validate_component(Carousel, "Carousel").$$render($$result, { items: images }, {}, {})}
    </div>

    ${validate_component(Progress, "Progress").$$render($$result, { value: percent, borderRadius: "0 0" }, {}, {})}

    <h4 class="${"svelte-1v4nyvu"}">${escape(title)}</h4>

    <div class="${"rate-wrap svelte-1v4nyvu"}">
        ${validate_component(Rate, "Rate").$$render($$result, { size: "small" }, {}, {})}
    </div>

    <footer>
        ${validate_component(AvatarAndName, "AvatarAndName").$$render(
		$$result,
		{
			src: orgHeadSrc,
			title: orgHead,
			subtitle: organization
		},
		{},
		{}
	)}
    </footer>
</a>`;
});

/* src/components/app/CharityCards.svelte generated by Svelte v3.18.1 */

const css$j = {
	code: "section.svelte-1nqz9r3.svelte-1nqz9r3{flex-grow:1;align-self:stretch;max-width:100%;padding:0 10px}.cards.svelte-1nqz9r3.svelte-1nqz9r3{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:var(--screen-padding) 0;margin:calc(var(--screen-padding) * -3) calc(var(--screen-padding) * -1)}.cards.svelte-1nqz9r3 li.svelte-1nqz9r3{display:flex;justify-content:stretch;width:50%;overflow:hidden;padding:calc(var(--screen-padding) * 3) var(--screen-padding)}.cards.svelte-1nqz9r3 li.svelte-1nqz9r3:hover{background-color:rgba(0, 0, 0, .1)\n    }",
	map: "{\"version\":3,\"file\":\"CharityCards.svelte\",\"sources\":[\"CharityCards.svelte\"],\"sourcesContent\":[\"<script>\\n    import Divider from '../Divider.svelte'\\n    import CharityCard from './CharityCard.svelte'\\n\\n    export let listName\\n    export let amount = 2\\n\\n    $: cards = [\\n        {\\n            src: 'https://placeimg.com/300/300/tech',\\n            title: 'This person needs your help',\\n            percent: 45,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'Head of the organization with loooooooong-naaaaaamed charity',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/arch',\\n            title: 'Another person who needs your quick help',\\n            percent: 65,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'Head of another organization',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/any',\\n            title: 'The person with the longest name is also wait for you',\\n            percent: 5,\\n            orgHead: 'Tinaramisimuss el-de-la Kandelakinuskas',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG of charity',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/nature',\\n            title: 'Needs',\\n            percent: 95,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG giant charity organization of big Charitify company',\\n        },\\n    ].slice(Number.isFinite(+amount) ? +amount : 0)\\n\\n    $: images = cards.map(card => ({\\n        src: [card.src, card.src, card.src],\\n        alt: card.title,\\n    }))\\n</script>\\n\\n<section>\\n    {#if listName}\\n        <Divider size=\\\"16\\\"/>\\n        <h3 class=\\\"h2 text-right\\\">{listName}</h3>\\n        <Divider size=\\\"20\\\"/>\\n        <br>\\n    {/if}\\n    <ul class=\\\"cards\\\">\\n        {#each cards as card}\\n            <li>\\n                <CharityCard {...card}/>\\n            </li>\\n        {/each}\\n    </ul>\\n</section>\\n\\n<style>\\n    section {\\n        flex-grow: 1;\\n        align-self: stretch;\\n        max-width: 100%;\\n        padding: 0 10px;\\n    }\\n\\n    .cards {\\n        display: flex;\\n        flex-wrap: wrap;\\n        align-items: flex-start;\\n        justify-content: center;\\n        padding: var(--screen-padding) 0;\\n        margin: calc(var(--screen-padding) * -3) calc(var(--screen-padding) * -1);\\n    }\\n\\n    .cards li {\\n        display: flex;\\n        justify-content: stretch;\\n        width: 50%;\\n        overflow: hidden;\\n        padding: calc(var(--screen-padding) * 3) var(--screen-padding);\\n    }\\n\\n    .cards li:hover {\\n        background-color: rgba(0, 0, 0, .1)\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9DaGFyaXR5Q2FyZHMuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFlBQVk7UUFDWixtQkFBbUI7UUFDbkIsZUFBZTtRQUNmLGVBQWU7SUFDbkI7O0lBRUE7UUFDSSxhQUFhO1FBQ2IsZUFBZTtRQUNmLHVCQUF1QjtRQUN2Qix1QkFBdUI7UUFDdkIsZ0NBQWdDO1FBQ2hDLHlFQUF5RTtJQUM3RTs7SUFFQTtRQUNJLGFBQWE7UUFDYix3QkFBd0I7UUFDeEIsVUFBVTtRQUNWLGdCQUFnQjtRQUNoQiw4REFBOEQ7SUFDbEU7O0lBRUE7UUFDSTtJQUNKIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2FwcC9DaGFyaXR5Q2FyZHMuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgc2VjdGlvbiB7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBwYWRkaW5nOiAwIDEwcHg7XG4gICAgfVxuXG4gICAgLmNhcmRzIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgICAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmc6IHZhcigtLXNjcmVlbi1wYWRkaW5nKSAwO1xuICAgICAgICBtYXJnaW46IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogLTMpIGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogLTEpO1xuICAgIH1cblxuICAgIC5jYXJkcyBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICAgICAgd2lkdGg6IDUwJTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgcGFkZGluZzogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAzKSB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgfVxuXG4gICAgLmNhcmRzIGxpOmhvdmVyIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAuMSlcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAiEI,OAAO,8BAAC,CAAC,AACL,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,CAAC,CAAC,IAAI,AACnB,CAAC,AAED,MAAM,8BAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,UAAU,CACvB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAChC,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,AAC7E,CAAC,AAED,qBAAM,CAAC,EAAE,eAAC,CAAC,AACP,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,OAAO,CACxB,KAAK,CAAE,GAAG,CACV,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AAClE,CAAC,AAED,qBAAM,CAAC,iBAAE,MAAM,AAAC,CAAC,AACb,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC;IACvC,CAAC\"}"
};

const CharityCards = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { listName } = $$props;
	let { amount = 2 } = $$props;
	if ($$props.listName === void 0 && $$bindings.listName && listName !== void 0) $$bindings.listName(listName);
	if ($$props.amount === void 0 && $$bindings.amount && amount !== void 0) $$bindings.amount(amount);
	$$result.css.add(css$j);

	let cards = [
		{
			src: "https://placeimg.com/300/300/tech",
			title: "This person needs your help",
			percent: 45,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "Head of the organization with loooooooong-naaaaaamed charity"
		},
		{
			src: "https://placeimg.com/300/300/arch",
			title: "Another person who needs your quick help",
			percent: 65,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "Head of another organization"
		},
		{
			src: "https://placeimg.com/300/300/any",
			title: "The person with the longest name is also wait for you",
			percent: 5,
			orgHead: "Tinaramisimuss el-de-la Kandelakinuskas",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG of charity"
		},
		{
			src: "https://placeimg.com/300/300/nature",
			title: "Needs",
			percent: 95,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG giant charity organization of big Charitify company"
		}
	].slice(Number.isFinite(+amount) ? +amount : 0);

	let images = cards.map(card => ({
		src: [card.src, card.src, card.src],
		alt: card.title
	}));

	return `<section class="${"svelte-1nqz9r3"}">
    ${listName
	? `${validate_component(Divider, "Divider").$$render($$result, { size: "16" }, {}, {})}
        <h3 class="${"h2 text-right"}">${escape(listName)}</h3>
        ${validate_component(Divider, "Divider").$$render($$result, { size: "20" }, {}, {})}
        <br>`
	: ``}
    <ul class="${"cards svelte-1nqz9r3"}">
        ${each(cards, card => `<li class="${"svelte-1nqz9r3"}">
                ${validate_component(CharityCard, "CharityCard").$$render($$result, Object.assign(card), {}, {})}
            </li>`)}
    </ul>
</section>`;
});

/* src/components/app/DonatorsCard.svelte generated by Svelte v3.18.1 */

const css$k = {
	code: "li.svelte-q6f13n{display:flex;align-items:center;padding:20px;width:100%}li.svelte-q6f13n:not(:last-child){border-bottom:1px dashed rgba(var(--color-black), 0.1)}",
	map: "{\"version\":3,\"file\":\"DonatorsCard.svelte\",\"sources\":[\"DonatorsCard.svelte\"],\"sourcesContent\":[\"<script>\\n    import Icon from '../Icon.svelte'\\n    import Card from '../Card.svelte'\\n    import Avatar from '../Avatar.svelte'\\n\\n    export let items\\n</script>\\n\\n{#if Array.isArray(items) && items.length}\\n    <Card>\\n        <ul class=\\\"full-width\\\">\\n            {#each items as item}\\n                {#if item.title && item.src}\\n                    <li>\\n                        <div class=\\\"relative\\\">\\n                            <Avatar src={item.src} size=\\\"medium\\\" alt={item.subtitle}/>\\n                            {#if item.checked}\\n                                <div class=\\\"absolute flex\\\" style=\\\"top: -1px; right: -1px; width: 20px; height: 20px; overflow: hidden\\\">\\n                                    <Icon type=\\\"polygon\\\" is=\\\"info\\\"/>\\n                                    <div class=\\\"absolute-center flex\\\" style=\\\"width: 10px; height: 10px;\\\">\\n                                        <Icon type=\\\"check-flag\\\" is=\\\"light\\\"/>\\n                                    </div>\\n                                </div>\\n                            {/if}\\n                        </div>\\n                        <s></s>\\n                        <s></s>\\n                        <s></s>\\n                        <s></s>\\n                        <div style=\\\"overflow: hidden;\\\" class=\\\"flex flex-column flex-justify-center\\\">\\n                            <h2 class=\\\"text-ellipsis\\\">{ item.title }</h2>\\n                            <span class=\\\"h4 font-w-300 text-ellipsis\\\">{ item.subtitle }<span/>\\n                        </div>\\n                    </li>\\n                {/if}\\n            {/each}\\n        </ul>\\n    </Card>\\n{/if}\\n\\n<style>\\n    li {\\n        display: flex;\\n        align-items: center;\\n        padding: 20px;\\n        width: 100%;\\n    }\\n\\n    li:not(:last-child) {\\n        border-bottom: 1px dashed rgba(var(--color-black), 0.1);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Eb25hdG9yc0NhcmQuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGFBQWE7UUFDYixtQkFBbUI7UUFDbkIsYUFBYTtRQUNiLFdBQVc7SUFDZjs7SUFFQTtRQUNJLHVEQUF1RDtJQUMzRCIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvRG9uYXRvcnNDYXJkLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIGxpIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuXG4gICAgbGk6bm90KDpsYXN0LWNoaWxkKSB7XG4gICAgICAgIGJvcmRlci1ib3R0b206IDFweCBkYXNoZWQgcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAyCI,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,AACf,CAAC,AAED,gBAAE,KAAK,WAAW,CAAC,AAAC,CAAC,AACjB,aAAa,CAAE,GAAG,CAAC,MAAM,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AAC3D,CAAC\"}"
};

const DonatorsCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$k);

	return `${Array.isArray(items) && items.length
	? `${validate_component(Card, "Card").$$render($$result, {}, {}, {
			default: () => `
        <ul class="${"full-width"}">
            ${each(items, item => `${item.title && item.src
			? `<li class="${"svelte-q6f13n"}">
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
                            <h2 class="${"text-ellipsis"}">${escape(item.title)}</h2>
                            <span class="${"h4 font-w-300 text-ellipsis"}">${escape(item.subtitle)}<span></span>
                        </span></div>
                    </li>`
			: ``}`)}
        </ul>
    `
		})}`
	: ``}`;
});

/* src/components/app/DonatorsList.svelte generated by Svelte v3.18.1 */

const css$l = {
	code: "ul.svelte-ni1k8c{width:100%;display:flex;align-items:flex-start;max-width:100%;overflow-y:hidden;overflow-x:auto;padding:var(--screen-padding) 0}li.svelte-ni1k8c{flex:none;align-self:stretch;width:260px;padding:0 5px}li.svelte-ni1k8c:first-child{padding-left:15px}li.svelte-ni1k8c:last-child{padding-right:15px}",
	map: "{\"version\":3,\"file\":\"DonatorsList.svelte\",\"sources\":[\"DonatorsList.svelte\"],\"sourcesContent\":[\"<script>\\n    import DonatorsCard from './DonatorsCard.svelte'\\n\\n    const all = [\\n        {\\n            src: 'https://placeimg.com/300/300/people',\\n            title: '₴ 10',\\n            subtitle: 'Тіна Канделакі',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/people',\\n            title: '₴ 250',\\n            subtitle: 'Bruce Lee',\\n            checked: true,\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/people',\\n            title: '₴ 1140',\\n            subtitle: 'Leonardo DiCaprio junior',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/people',\\n            title: '₴ 50',\\n            subtitle: 'Добра людина',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/people',\\n            title: '₴ 5',\\n            subtitle: 'Добра людина',\\n        },\\n    ]\\n\\n    const grouped = all.map(one => new Array(3).fill(one))\\n\\n    function scrollEnd(node) {\\n        try {\\n          node.scrollTo(node.scrollWidth, 0)\\n        } catch (e) {}\\n    }\\n</script>\\n\\n<ul class=\\\"scroll-x-center\\\" use:scrollEnd>\\n    {#each grouped as cards}\\n        <li>\\n            <DonatorsCard items={cards}/>\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    ul {\\n        width: 100%;\\n        display: flex;\\n        align-items: flex-start;\\n        max-width: 100%;\\n        overflow-y: hidden;\\n        overflow-x: auto;\\n        padding: var(--screen-padding) 0;\\n    }\\n\\n    li {\\n        flex: none;\\n        align-self: stretch;\\n        width: 260px;\\n        padding: 0 5px;\\n    }\\n\\n    li:first-child {\\n        padding-left: 15px;\\n    }\\n\\n    li:last-child {\\n        padding-right: 15px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Eb25hdG9yc0xpc3Quc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFdBQVc7UUFDWCxhQUFhO1FBQ2IsdUJBQXVCO1FBQ3ZCLGVBQWU7UUFDZixrQkFBa0I7UUFDbEIsZ0JBQWdCO1FBQ2hCLGdDQUFnQztJQUNwQzs7SUFFQTtRQUNJLFVBQVU7UUFDVixtQkFBbUI7UUFDbkIsWUFBWTtRQUNaLGNBQWM7SUFDbEI7O0lBRUE7UUFDSSxrQkFBa0I7SUFDdEI7O0lBRUE7UUFDSSxtQkFBbUI7SUFDdkIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL0RvbmF0b3JzTGlzdC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICB1bCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBvdmVyZmxvdy15OiBoaWRkZW47XG4gICAgICAgIG92ZXJmbG93LXg6IGF1dG87XG4gICAgICAgIHBhZGRpbmc6IHZhcigtLXNjcmVlbi1wYWRkaW5nKSAwO1xuICAgIH1cblxuICAgIGxpIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgd2lkdGg6IDI2MHB4O1xuICAgICAgICBwYWRkaW5nOiAwIDVweDtcbiAgICB9XG5cbiAgICBsaTpmaXJzdC1jaGlsZCB7XG4gICAgICAgIHBhZGRpbmctbGVmdDogMTVweDtcbiAgICB9XG5cbiAgICBsaTpsYXN0LWNoaWxkIHtcbiAgICAgICAgcGFkZGluZy1yaWdodDogMTVweDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAkDI,EAAE,cAAC,CAAC,AACA,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,UAAU,CACvB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAAC,CAAC,AACpC,CAAC,AAED,EAAE,cAAC,CAAC,AACA,IAAI,CAAE,IAAI,CACV,UAAU,CAAE,OAAO,CACnB,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,gBAAE,YAAY,AAAC,CAAC,AACZ,YAAY,CAAE,IAAI,AACtB,CAAC,AAED,gBAAE,WAAW,AAAC,CAAC,AACX,aAAa,CAAE,IAAI,AACvB,CAAC\"}"
};

const DonatorsList = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const all = [
		{
			src: "https://placeimg.com/300/300/people",
			title: "₴ 10",
			subtitle: "Тіна Канделакі"
		},
		{
			src: "https://placeimg.com/300/300/people",
			title: "₴ 250",
			subtitle: "Bruce Lee",
			checked: true
		},
		{
			src: "https://placeimg.com/300/300/people",
			title: "₴ 1140",
			subtitle: "Leonardo DiCaprio junior"
		},
		{
			src: "https://placeimg.com/300/300/people",
			title: "₴ 50",
			subtitle: "Добра людина"
		},
		{
			src: "https://placeimg.com/300/300/people",
			title: "₴ 5",
			subtitle: "Добра людина"
		}
	];

	const grouped = all.map(one => new Array(3).fill(one));
	$$result.css.add(css$l);

	return `<ul class="${"scroll-x-center svelte-ni1k8c"}">
    ${each(grouped, cards => `<li class="${"svelte-ni1k8c"}">
            ${validate_component(DonatorsCard, "DonatorsCard").$$render($$result, { items: cards }, {}, {})}
        </li>`)}
</ul>`;
});

/* src/components/app/TitleSubTitle.svelte generated by Svelte v3.18.1 */

const css$m = {
	code: "section.svelte-gnegnw{text-align:center;padding:0 3vw}h2.svelte-gnegnw{font-weight:400}",
	map: "{\"version\":3,\"file\":\"TitleSubTitle.svelte\",\"sources\":[\"TitleSubTitle.svelte\"],\"sourcesContent\":[\"<script>\\n    export let title = 'The main title that explains the charity'\\n    export let subtitle = 'And bigger description that describes in short keywords a charity, title above and just makes text longer'\\n</script>\\n\\n<section>\\n    <h1>{title}</h1>\\n    <br>\\n    <h2>{subtitle}</h2>\\n</section>\\n\\n<style>\\n    section {\\n        text-align: center;\\n        padding: 0 3vw;\\n    }\\n\\n    h2 {\\n        font-weight: 400;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9UaXRsZVN1YlRpdGxlLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxrQkFBa0I7UUFDbEIsY0FBYztJQUNsQjs7SUFFQTtRQUNJLGdCQUFnQjtJQUNwQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvVGl0bGVTdWJUaXRsZS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBzZWN0aW9uIHtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBwYWRkaW5nOiAwIDN2dztcbiAgICB9XG5cbiAgICBoMiB7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA0MDA7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAYI,OAAO,cAAC,CAAC,AACL,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

const TitleSubTitle = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = "The main title that explains the charity" } = $$props;
	let { subtitle = "And bigger description that describes in short keywords a charity, title above and just makes text longer" } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$m);

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

const css$n = {
	code: ".donate-btn.svelte-1q3bcic{position:fixed;left:0;bottom:env(safe-area-inset-bottom);display:flex;align-items:center;justify-content:center;width:100%;font-weight:600;font-size:1.85em;line-height:1.26;color:rgba(var(--color-white));padding:20px;z-index:9;text-align:center;transition:.3s ease-in-out;transform:translateY(100%);background-color:rgba(var(--color-success))}.donate-btn.active.svelte-1q3bcic{transform:none\n    }",
	map: "{\"version\":3,\"file\":\"DonationButton.svelte\",\"sources\":[\"DonationButton.svelte\"],\"sourcesContent\":[\"<script>\\n    import { onMount } from 'svelte'\\n    import { classnames } from '../../utils'\\n    import Icon from '../Icon.svelte'\\n\\n    let activeDonateBtn = false\\n\\n    onMount(() => setTimeout(() => activeDonateBtn = true, 500))\\n\\n    $: classPropDonateBtn = classnames('donate-btn', { active: activeDonateBtn })\\n\\n    function onDonate() {\\n        alert('Дякую! 🥰')\\n    }\\n</script>\\n\\n<button type=\\\"button\\\" class={classPropDonateBtn} on:click={onDonate}>\\n    <Icon type=\\\"coin\\\" size=\\\"big\\\" is=\\\"light\\\"/>\\n    <s></s>\\n    <s></s>\\n    Допомогти\\n</button>\\n\\n<style>\\n    .donate-btn {\\n        position: fixed;\\n        left: 0;\\n        bottom: env(safe-area-inset-bottom);\\n        display: flex;\\n        align-items: center;\\n        justify-content: center;\\n        width: 100%;\\n        font-weight: 600;\\n        font-size: 1.85em;\\n        line-height: 1.26;\\n        color: rgba(var(--color-white));\\n        padding: 20px;\\n        z-index: 9;\\n        text-align: center;\\n        transition: .3s ease-in-out;\\n        transform: translateY(100%);\\n        background-color: rgba(var(--color-success));\\n    }\\n\\n    .donate-btn.active {\\n        transform: none\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Eb25hdGlvbkJ1dHRvbi5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksZUFBZTtRQUNmLE9BQU87UUFDUCxtQ0FBbUM7UUFDbkMsYUFBYTtRQUNiLG1CQUFtQjtRQUNuQix1QkFBdUI7UUFDdkIsV0FBVztRQUNYLGdCQUFnQjtRQUNoQixpQkFBaUI7UUFDakIsaUJBQWlCO1FBQ2pCLCtCQUErQjtRQUMvQixhQUFhO1FBQ2IsVUFBVTtRQUNWLGtCQUFrQjtRQUNsQiwyQkFBMkI7UUFDM0IsMkJBQTJCO1FBQzNCLDRDQUE0QztJQUNoRDs7SUFFQTtRQUNJO0lBQ0oiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL0RvbmF0aW9uQnV0dG9uLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5kb25hdGUtYnRuIHtcbiAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICBib3R0b206IGVudihzYWZlLWFyZWEtaW5zZXQtYm90dG9tKTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICBmb250LXNpemU6IDEuODVlbTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuMjY7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXdoaXRlKSk7XG4gICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgIHotaW5kZXg6IDk7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgdHJhbnNpdGlvbjogLjNzIGVhc2UtaW4tb3V0O1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMTAwJSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgIH1cblxuICAgIC5kb25hdGUtYnRuLmFjdGl2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTogbm9uZVxuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAwBI,WAAW,eAAC,CAAC,AACT,QAAQ,CAAE,KAAK,CACf,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,sBAAsB,CAAC,CACnC,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,KAAK,CAAE,IAAI,CACX,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAC/B,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,GAAG,CAAC,WAAW,CAC3B,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC,AAED,WAAW,OAAO,eAAC,CAAC,AAChB,SAAS,CAAE,IAAI;IACnB,CAAC\"}"
};

const DonationButton = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let activeDonateBtn = false;
	onMount(() => setTimeout(() => activeDonateBtn = true, 500));
	$$result.css.add(css$n);
	let classPropDonateBtn = classnames("donate-btn", { active: activeDonateBtn });

	return `<button type="${"button"}" class="${escape(null_to_empty(classPropDonateBtn)) + " svelte-1q3bcic"}">
    ${validate_component(Icon, "Icon").$$render($$result, { type: "coin", size: "big", is: "light" }, {}, {})}
    <s></s>
    <s></s>
    Допомогти
</button>`;
});

/* src/components/app/ContactsHolder.svelte generated by Svelte v3.18.1 */

const ContactsHolder = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<h1 class="${"text-center"}">Contacts</h1>
<br>
<br>

<h4>
    We are available for you and can easily contact us through social networks:
</h4>

<br>

<p>We here: <a href="${"facebook.com"}">Organization here</a></p>
<p>Facebook: <a href="${"facebook.com"}">Organization name in FB</a></p>
<p>Instagram: <a href="${"facebook.com"}">Organization name in Instagram</a></p>
<p>Our web site: <a href="${"facebook.com"}">Organization wab site name</a></p>

<br>
<br>

<h4>
    Also we have other contacts:
</h4>

<br>

<p>Email: <a href="${"facebook.com"}">Email@address.com</a></p>
<p>Telephone: <a href="${"facebook.com"}">+380959595959</a></p>
<p>Address: <a href="${"facebook.com"}">Ivano-Frankivsk, Stusa 1</a></p>

<br>`;
});

/* src/components/app/ListOfFeatures.svelte generated by Svelte v3.18.1 */

const css$o = {
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

	$$result.css.add(css$o);

	return `<ul class="${"svelte-17ny656"}">
    ${each(items, item => `<li class="${"svelte-17ny656"}">
            <h3 class="${"svelte-17ny656"}">${escape(item.title)}</h3>
            <p class="${"svelte-17ny656"}">${escape(item.text)}</p>
            <br>
        </li>`)}
</ul>`;
});

const contextMapbox = {};

/* src/components/map/Map.svelte generated by Svelte v3.18.1 */

const css$p = {
	code: "section.svelte-cvpy75{flex-grow:1;align-self:stretch}",
	map: "{\"version\":3,\"file\":\"Map.svelte\",\"sources\":[\"Map.svelte\"],\"sourcesContent\":[\"<style>\\n    section {\\n        flex-grow: 1;\\n        align-self: stretch;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL21hcC9NYXAuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFlBQVk7UUFDWixtQkFBbUI7SUFDdkIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvbWFwL01hcC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBzZWN0aW9uIHtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgIH1cbiJdfQ== */</style>\\n\\n<script>\\n    import { onMount, onDestroy, setContext, createEventDispatcher } from 'svelte'\\n    import { contextMapbox } from './context'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let center = [31.1656, 48.3794]\\n    export let zoom = 3.75\\n\\n    let map\\n    let container\\n\\n    setContext(contextMapbox, {\\n        getMap: () => map,\\n        getMapbox: () => window.mapboxgl\\n    })\\n\\n    function onCreateMap() {\\n        map = new mapboxgl.Map({\\n            zoom,\\n            center,\\n            container,\\n            style: 'mapbox://styles/mapbox/streets-v11',\\n        })\\n\\n        map.on('dragend', () => dispatch('recentre', { map, center: map.getCenter() }))\\n        map.on('load', () => dispatch('ready', map))\\n    }\\n\\n    function createMap() {\\n        const scriptTag = document.createElement('script')\\n        scriptTag.type = 'text/javascript'\\n        scriptTag.src = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.js'\\n\\n        const link = document.createElement('link')\\n        link.rel = 'stylesheet'\\n        link.href = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.css'\\n\\n        scriptTag.onload = () => {\\n            const token = 'pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw'\\n            mapboxgl.accessToken = token\\n\\n            link.onload = onCreateMap\\n\\n            document.head.appendChild(link)\\n        }\\n\\n        document.body.appendChild(scriptTag)\\n    }\\n\\n    onMount(() => {\\n        if ('mapboxgl' in window) {\\n            onCreateMap()\\n        } else {\\n            createMap()\\n        }\\n    })\\n\\n    onDestroy(() => {\\n        map && map.remove()\\n    })\\n</script>\\n\\n<section bind:this={container}>\\n    {#if map}\\n        <slot></slot>\\n    {/if}\\n</section>\\n\"],\"names\":[],\"mappings\":\"AACI,OAAO,cAAC,CAAC,AACL,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,AACvB,CAAC\"}"
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
	$$result.css.add(css$p);

	return `<section class="${"svelte-cvpy75"}"${add_attribute("this", container, 1)}>
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

/* src/components/comments/Comment.svelte generated by Svelte v3.18.1 */

const Comment = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = undefined } = $$props;
	let { date = undefined } = $$props;
	let { title = undefined } = $$props;
	let { amount = undefined } = $$props;
	let { checked = undefined } = $$props;
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
            ${validate_component(Avatar, "Avatar").$$render($$result, { src, alt: title, size: "medium" }, {}, {})}

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
            <h3 class="${"text-ellipsis font-w-500"}">${escape(title)}</h3>

            <br class="${"tiny"}">

            <pre class="${"h4 font-w-300"}" style="${"line-height: 1.46;"}">
                ${$$slots.default
		? $$slots.default({})
		: `
                     [No comment]
                `}
            </pre>

            <br class="${"small"}">

            <div class="${"flex flex-align-center flex-justify-between"}">
                <p>
                    <span class="${"h5"}" style="${"rgba(var(--color-black), .3)"}">${escape(date)}</span>
                    <s></s>
                    <s></s>
                    <s></s>
                    <s></s>
                    <span class="${"h5"}">Відповісти</span>
                    <s></s>
                    <s></s>
                </p>
                <span class="${"h5 flex flex-align-center"}" style="${"min-width: 4em"}">
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
                    ${amount ? `<h4>${escape(amount)}</h4>` : ``}
                </span>
            </div>
        </div>

    </section>
`
	})}`;
});

var setup = {
  BACKEND_URL: './mock', // charitify-application.page.link/?link=https://charitify-application.firebaseio.com&apn=package_name

  MAPBOX_KEY: 'mapbox',
};

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

  FUND: (id) => `charity.json?id=${id}`,
  FUNDS: () => `charities.json`,

  ORGANIZATION: (id) => `organizations.json/?id=${id}`,
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
var api = new ApiClass({
  basePath: setup.BACKEND_URL,
  responseInterceptor: res => (console.info('response -------\n', res), res),
  errorInterceptor: rej => {
    console.warn('request error -------\n', rej);

    if (rej && rej.error && rej.error.message === 'Failed to fetch') {
      console.log('Lost internet connection');
    }

    throw rej
  },
});

/* src/components/comments/Comments.svelte generated by Svelte v3.18.1 */

const css$q = {
	code: ".comments.svelte-uiircl.svelte-uiircl{width:100%;flex-grow:1;display:flex;overflow-y:auto;overflow-x:hidden;align-self:stretch;flex-direction:column;padding:15px}.comments-form.svelte-uiircl.svelte-uiircl{position:relative;flex:none}.comments-wrap.svelte-uiircl.svelte-uiircl{width:100%;margin:-5px 0}.comments-wrap.svelte-uiircl li.svelte-uiircl{width:100%;padding:5px 0}",
	map: "{\"version\":3,\"file\":\"Comments.svelte\",\"sources\":[\"Comments.svelte\"],\"sourcesContent\":[\"<script>\\n    import { onMount } from 'svelte'\\n    import { api } from '../../services'\\n    import Comment from './Comment.svelte'\\n    import Icon from '../Icon.svelte'\\n    import Form from '../Form.svelte'\\n    import Input from '../fields/Input.svelte'\\n    import Button from '../Button.svelte'\\n\\n    export let withForm = true\\n\\n    let comments = []\\n\\n    onMount(async () => {\\n        comments = await api.getComments()\\n    })\\n</script>\\n\\n<section class=\\\"comments\\\">\\n    <ul class=\\\"comments-wrap\\\">\\n        {#each comments as comment}\\n            <li>\\n                <Comment\\n                        src={comment.avatar}\\n                        title={comment.author}\\n                        date={new Date(comment.created_at).toLocaleDateString()}\\n                        amount={comment.likes}\\n                        checked={comment.checked}\\n                >\\n                    {comment.comment}\\n                </Comment>\\n            </li>\\n        {/each}\\n    </ul>\\n\\n    <br>\\n    <br class=\\\"small\\\">\\n\\n    <p class=\\\"h3 font-w-500 font-secondary underline text-center\\\">\\n        <span>All comments</span>\\n        <span class=\\\"font-w-600\\\">⋁</span>\\n    </p>\\n\\n    {#if withForm}\\n        <br class=\\\"big\\\">\\n        <div class=\\\"comments-form font-secondary h3\\\">\\n            <Form class=\\\"flex\\\" name=\\\"comment-form\\\">\\n                <Input\\n                        type=\\\"textarea\\\"\\n                        name=\\\"comment\\\"\\n                        rows=\\\"1\\\"\\n                        class=\\\"comment-field flex-self-stretch\\\"\\n                        placeholder=\\\"Залиште свій коментар\\\"\\n                />\\n            </Form>\\n            <div class=\\\"flex absolute\\\" style=\\\"top: 0; right: 0; height: 100%; width: 50px\\\">\\n                <Button type=\\\"submit\\\" class=\\\"flex full-width flex-self-stretch flex-justify-start\\\">\\n                    <Icon type=\\\"send\\\" is=\\\"info\\\" size=\\\"medium\\\"/>\\n                </Button>\\n            </div>\\n        </div>\\n    {/if}\\n</section>\\n\\n<style>\\n    .comments {\\n        width: 100%;\\n        flex-grow: 1;\\n        display: flex;\\n        overflow-y: auto;\\n        overflow-x: hidden;\\n        align-self: stretch;\\n        flex-direction: column;\\n        padding: 15px;\\n    }\\n\\n    .comments-form {\\n        position: relative;\\n        flex: none;\\n    }\\n\\n    .comments-wrap {\\n        width: 100%;\\n        margin: -5px 0;\\n    }\\n\\n    .comments-wrap li {\\n        width: 100%;\\n        padding: 5px 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2NvbW1lbnRzL0NvbW1lbnRzLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxXQUFXO1FBQ1gsWUFBWTtRQUNaLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBQ2xCLG1CQUFtQjtRQUNuQixzQkFBc0I7UUFDdEIsYUFBYTtJQUNqQjs7SUFFQTtRQUNJLGtCQUFrQjtRQUNsQixVQUFVO0lBQ2Q7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsY0FBYztJQUNsQjs7SUFFQTtRQUNJLFdBQVc7UUFDWCxjQUFjO0lBQ2xCIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2NvbW1lbnRzL0NvbW1lbnRzLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5jb21tZW50cyB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgcGFkZGluZzogMTVweDtcbiAgICB9XG5cbiAgICAuY29tbWVudHMtZm9ybSB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICB9XG5cbiAgICAuY29tbWVudHMtd3JhcCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBtYXJnaW46IC01cHggMDtcbiAgICB9XG5cbiAgICAuY29tbWVudHMtd3JhcCBsaSB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBwYWRkaW5nOiA1cHggMDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAiEI,SAAS,4BAAC,CAAC,AACP,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,OAAO,CACnB,cAAc,CAAE,MAAM,CACtB,OAAO,CAAE,IAAI,AACjB,CAAC,AAED,cAAc,4BAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,IAAI,AACd,CAAC,AAED,cAAc,4BAAC,CAAC,AACZ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CAAC,CAAC,AAClB,CAAC,AAED,4BAAc,CAAC,EAAE,cAAC,CAAC,AACf,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,CAAC,AAClB,CAAC\"}"
};

const Comments = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { withForm = true } = $$props;
	let comments = [];

	onMount(async () => {
		comments = await api.getComments();
	});

	if ($$props.withForm === void 0 && $$bindings.withForm && withForm !== void 0) $$bindings.withForm(withForm);
	$$result.css.add(css$q);

	return `<section class="${"comments svelte-uiircl"}">
    <ul class="${"comments-wrap svelte-uiircl"}">
        ${each(comments, comment => `<li class="${"svelte-uiircl"}">
                ${validate_component(Comment, "Comment").$$render(
		$$result,
		{
			src: comment.avatar,
			title: comment.author,
			date: new Date(comment.created_at).toLocaleDateString(),
			amount: comment.likes,
			checked: comment.checked
		},
		{},
		{
			default: () => `
                    ${escape(comment.comment)}
                `
		}
	)}
            </li>`)}
    </ul>

    <br>
    <br class="${"small"}">

    <p class="${"h3 font-w-500 font-secondary underline text-center"}">
        <span>All comments</span>
        <span class="${"font-w-600"}">⋁</span>
    </p>

    ${withForm
	? `<br class="${"big"}">
        <div class="${"comments-form font-secondary h3 svelte-uiircl"}">
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

/* src/routes/index.svelte generated by Svelte v3.18.1 */

const css$r = {
	code: ".top-pic.svelte-1bvl4oj{flex:none;z-index:0;width:100%;height:200px;display:flex;overflow:hidden;border-radius:0}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<script>\\n    import {\\n        Footer,\\n        Divider,\\n        Comments,\\n        Progress,\\n        Carousel,\\n        CharityCards,\\n        ContentHolder,\\n        TitleSubTitle,\\n        ListOfFeatures,\\n    } from '../components'\\n</script>\\n\\n<style>\\n    .top-pic {\\n        flex: none;\\n        z-index: 0;\\n        width: 100%;\\n        height: 200px;\\n        display: flex;\\n        overflow: hidden;\\n        border-radius: 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvaW5kZXguc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFVBQVU7UUFDVixVQUFVO1FBQ1YsV0FBVztRQUNYLGFBQWE7UUFDYixhQUFhO1FBQ2IsZ0JBQWdCO1FBQ2hCLGdCQUFnQjtJQUNwQiIsImZpbGUiOiJzcmMvcm91dGVzL2luZGV4LnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC50b3AtcGljIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgei1pbmRleDogMDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGhlaWdodDogMjAwcHg7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDA7XG4gICAgfVxuIl19 */</style>\\n\\n<svelte:head>\\n    <title>Charitify - list of charities you can donate.</title>\\n</svelte:head>\\n\\n<section class=\\\"scroll-box\\\">\\n\\n    <div class=\\\"top-pic\\\">\\n        <Carousel/>\\n    </div>\\n\\n    <Progress borderRadius=\\\"0 0 8px 8px\\\" value=\\\"30\\\"/>\\n\\n    <p>These guys rise a pound of vegetables. They like vegetables and long text under photos.</p>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <section class=\\\"container\\\">\\n\\n        <TitleSubTitle\\n                title=\\\"Charitify\\\"\\n                subtitle=\\\"Charity application for helping those in need\\\"\\n        />\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <Carousel amount=\\\"2\\\">\\n            <CharityCards amount=\\\"2\\\" listName=\\\"Nearest to you:\\\"/>\\n        </Carousel>\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <ContentHolder/>\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <Divider size=\\\"16\\\"/>\\n        <h3 class=\\\"h2 text-right\\\">Comments:</h3>\\n        <Divider size=\\\"20\\\"/>\\n\\n        <Comments withFrom={false}/>\\n\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n\\n            <ContentHolder/>\\n\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n\\n            <ListOfFeatures/>\\n    </section>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Footer/>\\n\\n</section>\\n\"],\"names\":[],\"mappings\":\"AAeI,QAAQ,eAAC,CAAC,AACN,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,CAAC,CACV,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,CAAC,AACpB,CAAC\"}"
};

const Routes = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$r);

	return `${($$result.head += `${($$result.title = `<title>Charitify - list of charities you can donate.</title>`, "")}`, "")}

<section class="${"scroll-box"}">

    <div class="${"top-pic svelte-1bvl4oj"}">
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

        ${validate_component(Carousel, "Carousel").$$render($$result, { amount: "2" }, {}, {
		default: () => `
            ${validate_component(CharityCards, "CharityCards").$$render($$result, { amount: "2", listName: "Nearest to you:" }, {}, {})}
        `
	})}

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

        ${validate_component(Comments, "Comments").$$render($$result, { withFrom: false }, {}, {})}

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
    </svg>
</section>`;
});

/* src/routes/_layout.svelte generated by Svelte v3.18.1 */

const Layout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);

	return `${validate_component(Header, "Header").$$render($$result, { segment }, {}, {})}

${validate_component(Icons, "Icons").$$render($$result, {}, {}, {})}

<main id="${"main"}">
	${$$slots.default ? $$slots.default({}) : ``}
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
<h1 class="${"text-center"}">Error: ${escape(status)}</h1>
<br>
<p class="${"text-center"}">Reason: ${escape(error.message)}</p>
<br>
<br>
${ ``}`;
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

/* src/routes/organizations/[id].svelte generated by Svelte v3.18.1 */

const css$s = {
	code: ".top.svelte-1fqowb1{display:flex;margin-bottom:calc(var(--screen-padding) * 1.5);margin-top:var(--screen-padding)}.pics-wrap.svelte-1fqowb1{z-index:0;flex-grow:1;display:flex;overflow:hidden;margin-bottom:2px;border-radius:var(--border-radius);box-shadow:var(--shadow-primary)}.rate-section.svelte-1fqowb1{display:flex;align-items:flex-end;justify-content:space-between;padding:12px 0}",
	map: "{\"version\":3,\"file\":\"[id].svelte\",\"sources\":[\"[id].svelte\"],\"sourcesContent\":[\"<script>\\n    import { stores } from '@sapper/app';\\n    const { page } = stores();\\n    import { onMount } from 'svelte'\\n    import { api } from '../../services'\\n    import {\\n        Rate,\\n        Footer,\\n        Divider,\\n        Progress,\\n        Carousel,\\n        Comments,\\n        CharityCards,\\n        TitleSubTitle,\\n        AvatarAndName,\\n        ContentHolder,\\n        ContactsHolder,\\n    } from '../../components'\\n\\n    let organizationId = $page.params.id\\n    let organization = {}\\n\\n    $: carousel = (organization.avatars || []).map(src => ({ src }))\\n\\n    onMount(async () => {\\n        await new Promise(r => setTimeout(r, 2000))\\n        organization = await api.getOrganization(1)\\n    })\\n\\n    $: console.log(organizationId)\\n</script>\\n\\n<svelte:head>\\n    <title>Charitify - Organization page.</title>\\n</svelte:head>\\n\\n<style>\\n    .top {\\n        display: flex;\\n        margin-bottom: calc(var(--screen-padding) * 1.5);\\n        margin-top: var(--screen-padding);\\n    }\\n\\n    .pics-wrap {\\n        z-index: 0;\\n        flex-grow: 1;\\n        display: flex;\\n        overflow: hidden;\\n        margin-bottom: 2px;\\n        border-radius: var(--border-radius);\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    .rate-section {\\n        display: flex;\\n        align-items: flex-end;\\n        justify-content: space-between;\\n        padding: 12px 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvb3JnYW5pemF0aW9ucy9baWRdLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxhQUFhO1FBQ2IsZ0RBQWdEO1FBQ2hELGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLFVBQVU7UUFDVixZQUFZO1FBQ1osYUFBYTtRQUNiLGdCQUFnQjtRQUNoQixrQkFBa0I7UUFDbEIsbUNBQW1DO1FBQ25DLGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLGFBQWE7UUFDYixxQkFBcUI7UUFDckIsOEJBQThCO1FBQzlCLGVBQWU7SUFDbkIiLCJmaWxlIjoic3JjL3JvdXRlcy9vcmdhbml6YXRpb25zL1tpZF0uc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnRvcCB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogMS41KTtcbiAgICAgICAgbWFyZ2luLXRvcDogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgIH1cblxuICAgIC5waWNzLXdyYXAge1xuICAgICAgICB6LWluZGV4OiAwO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDJweDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAucmF0ZS1zZWN0aW9uIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtZW5kO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIHBhZGRpbmc6IDEycHggMDtcbiAgICB9XG4iXX0= */</style>\\n\\n<section class=\\\"container scroll-box\\\">\\n\\n    <section>\\n        <br>\\n        <TitleSubTitle\\n                title={organization.title}\\n                subtitle={organization.description}\\n        />\\n        <br>\\n    </section>\\n\\n    <section class=\\\"top\\\">\\n        <div class=\\\"pics-wrap\\\">\\n            <Carousel items={carousel}/>\\n        </div>\\n    </section>\\n\\n    <Progress value=\\\"65\\\" size=\\\"big\\\"/>\\n\\n    <a class=\\\"rate-section\\\" href=\\\"users/me\\\">\\n        <AvatarAndName\\n                src={organization.org_head_avatar}\\n                title={organization.org_head}\\n        />\\n\\n        <Rate/>\\n    </a>\\n\\n    <br>\\n\\n    {#if organization.id}\\n        <p class=\\\"text-center\\\">\\n            <a class=\\\"btn success\\\" href={`map/${organization.id}`}>On the map</a>\\n        </p>\\n    {/if}\\n\\n    <br>\\n    <br>\\n    <br>\\n\\n    <ContentHolder/>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Divider size=\\\"16\\\"/>\\n    <h3 class=\\\"h2 text-right\\\">Charities of the organization:</h3>\\n    <Divider size=\\\"20\\\"/>\\n    <br>\\n    <Carousel amount=\\\"5\\\">\\n        <CharityCards amount=\\\"2\\\"/>\\n    </Carousel>\\n\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <ContactsHolder/>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Divider size=\\\"20\\\"/>\\n    <h3 class=\\\"h2 text-right\\\">Comments:</h3>\\n    <Divider size=\\\"16\\\"/>\\n\\n    <Comments/>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n</section>\\n\\n<Footer/>\\n\\n\"],\"names\":[],\"mappings\":\"AAqCI,IAAI,eAAC,CAAC,AACF,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAChD,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,UAAU,eAAC,CAAC,AACR,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,aAAa,eAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,QAAQ,CACrB,eAAe,CAAE,aAAa,CAC9B,OAAO,CAAE,IAAI,CAAC,CAAC,AACnB,CAAC\"}"
};

const U5Bidu5D = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $page;
	const { page } = stores$1();
	$page = get_store_value(page);
	let organizationId = $page.params.id;
	let organization = {};

	onMount(async () => {
		await new Promise(r => setTimeout(r, 2000));
		organization = await api.getOrganization(1);
	});

	$$result.css.add(css$s);
	$page = get_store_value(page);
	let carousel = (organization.avatars || []).map(src => ({ src }));

	 {
		console.log(organizationId);
	}

	return `${($$result.head += `${($$result.title = `<title>Charitify - Organization page.</title>`, "")}`, "")}



<section class="${"container scroll-box"}">

    <section>
        <br>
        ${validate_component(TitleSubTitle, "TitleSubTitle").$$render(
		$$result,
		{
			title: organization.title,
			subtitle: organization.description
		},
		{},
		{}
	)}
        <br>
    </section>

    <section class="${"top svelte-1fqowb1"}">
        <div class="${"pics-wrap svelte-1fqowb1"}">
            ${validate_component(Carousel, "Carousel").$$render($$result, { items: carousel }, {}, {})}
        </div>
    </section>

    ${validate_component(Progress, "Progress").$$render($$result, { value: "65", size: "big" }, {}, {})}

    <a class="${"rate-section svelte-1fqowb1"}" href="${"users/me"}">
        ${validate_component(AvatarAndName, "AvatarAndName").$$render(
		$$result,
		{
			src: organization.org_head_avatar,
			title: organization.org_head
		},
		{},
		{}
	)}

        ${validate_component(Rate, "Rate").$$render($$result, {}, {}, {})}
    </a>

    <br>

    ${organization.id
	? `<p class="${"text-center"}">
            <a class="${"btn success"}"${add_attribute("href", `map/${organization.id}`, 0)}>On the map</a>
        </p>`
	: ``}

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
    <h3 class="${"h2 text-right"}">Charities of the organization:</h3>
    ${validate_component(Divider, "Divider").$$render($$result, { size: "20" }, {}, {})}
    <br>
    ${validate_component(Carousel, "Carousel").$$render($$result, { amount: "5" }, {}, {
		default: () => `
        ${validate_component(CharityCards, "CharityCards").$$render($$result, { amount: "2" }, {}, {})}
    `
	})}


    <br>
    <br>
    <br>
    <br>
    <br>

    ${validate_component(ContactsHolder, "ContactsHolder").$$render($$result, {}, {}, {})}

    <br>
    <br>
    <br>
    <br>
    <br>

    ${validate_component(Divider, "Divider").$$render($$result, { size: "20" }, {}, {})}
    <h3 class="${"h2 text-right"}">Comments:</h3>
    ${validate_component(Divider, "Divider").$$render($$result, { size: "16" }, {}, {})}

    ${validate_component(Comments, "Comments").$$render($$result, {}, {}, {})}

    <br>
    <br>
    <br>
    <br>
    <br>

</section>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});

/* src/routes/funds/[id].svelte generated by Svelte v3.18.1 */

const css$t = {
	code: "table.svelte-9y31ev tr:not(:last-child) td.svelte-9y31ev{padding-bottom:16px}table.svelte-9y31ev td.svelte-9y31ev:last-child{font-weight:300}",
	map: "{\"version\":3,\"file\":\"[id].svelte\",\"sources\":[\"[id].svelte\"],\"sourcesContent\":[\"<script>\\n    import { stores } from '@sapper/app'\\n    import { onMount } from 'svelte'\\n    import { api } from '../../services'\\n    import {\\n        Icon,\\n        Card,\\n        Avatar,\\n        Button,\\n        Footer,\\n        Picture,\\n        Progress,\\n        Comments,\\n        Carousel,\\n        FancyBox,\\n        Documents,\\n        TrustButton,\\n        DonatorsList,\\n        DonationButton,\\n    } from '../../components'\\n\\n    const { page } = stores()\\n    let charityId = $page.params.id\\n\\n    // Entity\\n    let charity = {}\\n    $: carousel = (charity.avatars || []).map(p => ({ src: p, alt: 'photo' }))\\n    onMount(async () => {\\n        charity = await api.getFund(1)\\n    })\\n\\n    // Trust button\\n    let active = false\\n    async function onClick() {\\n        active = !active\\n    }\\n\\n    // Carousel & FancyBox\\n    let propsBox = {}\\n    function onCarouselClick({ detail }) {\\n        propsBox = { initIndex: detail.index }\\n    }\\n\\n    // Avatar fancy\\n    let avatarFancy = false\\n</script>\\n\\n<svelte:head>\\n    <title>Charitify - Charity page and donate.</title>\\n</svelte:head>\\n\\n<style>\\n    table tr:not(:last-child) td {\\n        padding-bottom: 16px;\\n    }\\n\\n    table td:last-child {\\n        font-weight: 300;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvZnVuZHMvW2lkXS5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksZ0JBQWdCO0lBQ3BCIiwiZmlsZSI6InNyYy9yb3V0ZXMvZnVuZHMvW2lkXS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICB0YWJsZSB0cjpub3QoOmxhc3QtY2hpbGQpIHRkIHtcbiAgICAgICAgcGFkZGluZy1ib3R0b206IDE2cHg7XG4gICAgfVxuXG4gICAgdGFibGUgdGQ6bGFzdC1jaGlsZCB7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiAzMDA7XG4gICAgfVxuIl19 */</style>\\n\\n\\n<DonationButton/>\\n\\n<section class=\\\"container scroll-box theme-bg-color-secondary\\\">\\n\\n    <br>\\n    <br>\\n\\n    <section class=\\\"flex\\\" style=\\\"height: 200px\\\">\\n        <FancyBox>\\n            <Carousel items={carousel} on:click={onCarouselClick}/>\\n            <div slot=\\\"box\\\">\\n                <Carousel {...propsBox} items={carousel}/>\\n            </div>\\n        </FancyBox>\\n    </section>\\n\\n    <br>\\n    <br>\\n    <br class=\\\"tiny\\\">\\n\\n    <Button class=\\\"white\\\">\\n        <div class=\\\"flex flex-align-center flex-justify-between full-width\\\">\\n            <div class=\\\"flex flex-align-center\\\">\\n                <s></s>\\n                <div class=\\\"flex\\\" style=\\\"max-width: 45px; height: 40px; overflow: hidden\\\">\\n                    <Picture\\n                            src=\\\"./assets/dimsirka.jpg\\\"\\n                            size=\\\"contain\\\"\\n                            alt=\\\"logo\\\"\\n                    />\\n                </div>\\n                <s></s>\\n                <s></s>\\n                <s></s>\\n                <h3>\\\"Дім Сірка\\\"</h3>\\n            </div>\\n            <span style=\\\"font-size: 24px\\\">\\n               →\\n            </span>\\n        </div>\\n    </Button>\\n\\n    <br>\\n    <br class=\\\"tiny\\\">\\n\\n    <Card class=\\\"container\\\">\\n        <br>\\n        <br class=\\\"small\\\">\\n\\n        <h2>Збережемо тварин разом</h2>\\n        <br class=\\\"small\\\">\\n        <h3 class=\\\"font-w-normal\\\" style=\\\"opacity: .7\\\">Збір грошей на допомогу безпритульним\\n            тваринам</h3>\\n\\n        <br>\\n        <br class=\\\"small\\\">\\n\\n        <p class=\\\"font-secondary\\\">\\n            <span class=\\\"h1 font-w-500\\\">₴ 3500</span>\\n            <span class=\\\"h3\\\"> / ₴ 20000</span>\\n        </p>\\n\\n        <br>\\n\\n        <Progress value={Math.floor(3500\\n        / 20000 * 100)}/>\\n\\n        <br class=\\\"big\\\">\\n    </Card>\\n\\n    <br class=\\\"small\\\">\\n    <br>\\n\\n    <p class=\\\"container flex flex-justify-between flex-align-center\\\">\\n        <span class=\\\"flex flex-align-center\\\">\\n            <Icon is=\\\"danger\\\" type=\\\"heart-filled\\\" size=\\\"medium\\\"/>\\n            <s></s>\\n            <s></s>\\n            <span class=\\\"font-secondary font-w-600 h3\\\">1</span>\\n        </span>\\n        <span class=\\\"flex flex-align-center\\\">\\n            <Icon type=\\\"eye\\\" size=\\\"medium\\\" class=\\\"theme-svg-fill\\\"/>\\n            <s></s>\\n            <s></s>\\n            <span class=\\\"font-secondary font-w-600 h3\\\">13</span>\\n        </span>\\n    </p>\\n\\n    <br class=\\\"big\\\">\\n\\n    <h2>Збережемо тварин разом</h2>\\n    <br class=\\\"small\\\">\\n    <pre class=\\\"font-w-300\\\">\\n        Терміново шукаємо добрі руки 🤲🥰\\n        Бадді підкинули під кафе біля самої траси!\\n        Біля нього були тільки залишки черствого хліба... 💔\\n        За що можна було покинути малюка напризволяще? 🥺\\n        В чому він міг провинитися? Йому всього 2 місяці.\\n        Зараз буде проходити обробку від паразитів та вакцинацію 💉\\n    </pre>\\n\\n    <br class=\\\"small\\\">\\n\\n    <p class=\\\"flex\\\">\\n    <Button class=\\\"flex flex-align-center\\\" auto size=\\\"small\\\">\\n        <Icon type=\\\"share\\\" size=\\\"medium\\\" class=\\\"theme-svg-fill\\\"/>\\n        <s></s>\\n        <s></s>\\n        <p class=\\\"font-w-500\\\">Поділитись</p>\\n    </Button>\\n    <s></s>\\n    <s></s>\\n    <s></s>\\n    <s></s>\\n    <s></s>\\n    <Button class=\\\"flex flex-align-center\\\" auto size=\\\"small\\\">\\n        <Icon type=\\\"link\\\" size=\\\"medium\\\" class=\\\"theme-svg-fill\\\"/>\\n        <s></s>\\n        <s></s>\\n        <p class=\\\"font-w-500\\\">Скопіювати</p>\\n    </Button>\\n    </p>\\n\\n    <br>\\n    <br>\\n    <br>\\n\\n    <section class=\\\"flex flex-column flex-align-center flex-justify-center\\\">\\n        <div style=\\\"width: 100px; max-width: 100%\\\">\\n            <TrustButton isActive={active} on:click={onClick}/>\\n        </div>\\n        <br class=\\\"small\\\">\\n        <h2>Я Довіряю</h2>\\n    </section>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Card class=\\\"container\\\">\\n        <br class=\\\"big\\\">\\n\\n        <div class=\\\"flex flex-column flex-align-center\\\">\\n            <span>\\n                <FancyBox>\\n                    <Avatar src=\\\"https://placeimg.com/300/300/animal\\\" size=\\\"big\\\" alt=\\\"Волтер\\\"/>\\n                    <div slot=\\\"box\\\">\\n                        <Avatar src=\\\"https://placeimg.com/300/300/animal\\\" alt=\\\"Волтер\\\"/>\\n                    </div>\\n                </FancyBox>\\n            </span>\\n\\n            <br class=\\\"tiny\\\">\\n            <br>\\n\\n            <h2>Волтер</h2>\\n            <br class=\\\"tiny\\\">\\n            <h4 class=\\\"font-w-500\\\">Jack Russell Terrier</h4>\\n        </div>\\n\\n        <br class=\\\"big\\\">\\n\\n        <section class=\\\"flex flex-justify-center\\\">\\n            <div class=\\\"flex flex-center relative\\\" style=\\\"width: 90px; height: 90px; margin: 0 .8em\\\">\\n                <Icon type=\\\"polygon\\\" is=\\\"primary\\\"/>\\n                <div class=\\\"text-white text-center absolute\\\">\\n                    <h4 class=\\\"h1\\\">3</h4>\\n                    <h4 style=\\\"margin-top: -8px\\\">Роки</h4>\\n                </div>\\n            </div>\\n\\n            <div class=\\\"flex flex-center relative\\\" style=\\\"width: 90px; height: 90px; margin: 0 .8em\\\">\\n                <Icon type=\\\"polygon\\\" is=\\\"info\\\"/>\\n                <div class=\\\"absolute flex\\\" style=\\\"width: 44px; height: 44px\\\">\\n                    <Icon type=\\\"male\\\" is=\\\"light\\\"/>\\n                </div>\\n            </div>\\n\\n            <div class=\\\"flex flex-center relative\\\" style=\\\"width: 90px; height: 90px; margin: 0 .8em; opacity: .3\\\">\\n                <Icon type=\\\"polygon\\\" is=\\\"primary\\\"/>\\n                <div class=\\\"absolute flex flex-column flex-center\\\">\\n                    <Icon type=\\\"cancel-circle\\\" is=\\\"light\\\" size=\\\"big\\\"/>\\n                    <span class=\\\"text-white text-center h5\\\">Cтерилізація</span>\\n                </div>\\n            </div>\\n        </section>\\n\\n        <br class=\\\"big\\\">\\n        <br class=\\\"small\\\">\\n\\n        <h2>Характер Волтера: 😃</h2>\\n        <br class=\\\"small\\\">\\n        <p class=\\\"font-w-300\\\">\\n            Дуже грайливий і милий песик. Любить проводити час з іншими собаками, дуже любить гратись з дітьми\\n        </p>\\n\\n        <br class=\\\"big\\\">\\n\\n        <h2>Життя Волтера</h2>\\n        <br class=\\\"small\\\">\\n        <table>\\n            <tbody>\\n            <tr>\\n                <td>01.02.2019</td>\\n                <td>—</td>\\n                <td>Його перший день народження</td>\\n            </tr>\\n            <tr>\\n                <td>05.02.2019</td>\\n                <td>—</td>\\n                <td>Ми приютили його з вулиці</td>\\n            </tr>\\n            <tr>\\n                <td>07.03.2019</td>\\n                <td>—</td>\\n                <td>Зробили вакцинацію проти бліх</td>\\n            </tr>\\n            <tr>\\n                <td>23.06.2019</td>\\n                <td>—</td>\\n                <td>Знайшов для себе улюблену іграшку</td>\\n            </tr>\\n            </tbody>\\n        </table>\\n\\n        <br>\\n        <br>\\n        <br>\\n\\n        <h2>Вакцинації</h2>\\n        <br>\\n        <ul class=\\\"flex flex-column text-left\\\">\\n            <li>\\n                <span class=\\\"flex flex-align-center font-w-300\\\">\\n                    <Icon is=\\\"primary\\\" type=\\\"checked-circle\\\" size=\\\"small\\\"/>\\n                    <s></s>\\n                    <s></s>\\n                    Від бліх\\n                </span>\\n            </li>\\n            <li>\\n                <br>\\n                <span class=\\\"flex flex-align-center font-w-300\\\">\\n                    <Icon is=\\\"primary\\\" type=\\\"checked-circle\\\" size=\\\"small\\\"/>\\n                    <s></s>\\n                    <s></s>\\n                    Від паразитів\\n                </span>\\n            </li>\\n            <li>\\n                <br>\\n                <span class=\\\"flex flex-align-center font-w-300\\\">\\n                    <Icon is=\\\"danger\\\" type=\\\"cancel-circle\\\" size=\\\"small\\\"/>\\n                    <s></s>\\n                    <s></s>\\n                    Від грибків\\n                </span>\\n            </li>\\n        </ul>\\n\\n        <br class=\\\"big\\\">\\n    </Card>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <h2>Наші піклувальники</h2>\\n    <br class=\\\"small\\\">\\n    <div class=\\\"full-container\\\">\\n        <DonatorsList/>\\n    </div>\\n\\n    <br class=\\\"big\\\">\\n    <br>\\n\\n    <h2>Документи</h2>\\n    <br>\\n    <div class=\\\"full-container\\\">\\n        <Documents/>\\n    </div>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <h2>Відео про Волтера</h2>\\n    <br>\\n    <section class=\\\"flex\\\" style=\\\"height: 200px\\\">\\n        <Carousel items={carousel}/>\\n    </section>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <h2>Контакти</h2>\\n    <br>\\n    <ul style=\\\"list-style: disc outside none; padding-left: var(--screen-padding)\\\" class=\\\"h3 font-w-500 font-secondary\\\">\\n        <li style=\\\"padding-bottom: 4px\\\">Ви пожете купити йому поїсти</li>\\n        <li style=\\\"padding-bottom: 4px\\\">Можете особисто відвідати його у нас</li>\\n        <li style=\\\"padding-bottom: 4px\\\">Купити вакцінацію для Волтера</li>\\n        <li style=\\\"padding-bottom: 4px\\\">Допомогти любим інщим способом</li>\\n    </ul>\\n    <br class=\\\"big\\\">\\n    <div class=\\\"flex\\\">\\n        <div class=\\\"flex flex-align-center font-secondary\\\">\\n            <Icon size=\\\"medium\\\" type=\\\"phone\\\" class=\\\"theme-svg-fill-opposite\\\"/>\\n            <s></s>\\n            <s></s>\\n            <h2>+38 (093) 205-43-92</h2>\\n        </div>\\n    </div>\\n    <br class=\\\"small\\\">\\n    <p class=\\\"font-w-300\\\">Подзвоніть нам, якщо хочете допомогти Волтеру</p>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <h2>Коментарі</h2>\\n    <br class=\\\"small\\\">\\n    <div class=\\\"full-container\\\">\\n        <Comments/>\\n    </div>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <div class=\\\"full-container\\\">\\n        <Footer/>\\n    </div>\\n\\n</section>\\n\"],\"names\":[],\"mappings\":\"AAoDI,mBAAK,CAAC,EAAE,KAAK,WAAW,CAAC,CAAC,EAAE,cAAC,CAAC,AAC1B,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,mBAAK,CAAC,gBAAE,WAAW,AAAC,CAAC,AACjB,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

const U5Bidu5D$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $page;
	const { page } = stores$1();
	$page = get_store_value(page);
	let charityId = $page.params.id;

	// Entity
	let charity = {};

	onMount(async () => {
		charity = await api.getFund(1);
	});

	// Trust button
	let active = false;

	// Carousel & FancyBox
	let propsBox = {};

	$$result.css.add(css$t);
	$page = get_store_value(page);
	let carousel = (charity.avatars || []).map(p => ({ src: p, alt: "photo" }));

	return `${($$result.head += `${($$result.title = `<title>Charitify - Charity page and donate.</title>`, "")}`, "")}




${validate_component(DonationButton, "DonationButton").$$render($$result, {}, {}, {})}

<section class="${"container scroll-box theme-bg-color-secondary"}">

    <br>
    <br>

    <section class="${"flex"}" style="${"height: 200px"}">
        ${validate_component(FancyBox, "FancyBox").$$render($$result, {}, {}, {
		box: () => `<div slot="${"box"}">
                ${validate_component(Carousel, "Carousel").$$render($$result, Object.assign(propsBox, { items: carousel }), {}, {})}
            </div>`,
		default: () => `
            ${validate_component(Carousel, "Carousel").$$render($$result, { items: carousel }, {}, {})}
            
        `
	})}
    </section>

    <br>
    <br>
    <br class="${"tiny"}">

    ${validate_component(Button, "Button").$$render($$result, { class: "white" }, {}, {
		default: () => `
        <div class="${"flex flex-align-center flex-justify-between full-width"}">
            <div class="${"flex flex-align-center"}">
                <s></s>
                <div class="${"flex"}" style="${"max-width: 45px; height: 40px; overflow: hidden"}">
                    ${validate_component(Picture, "Picture").$$render(
			$$result,
			{
				src: "./assets/dimsirka.jpg",
				size: "contain",
				alt: "logo"
			},
			{},
			{}
		)}
                </div>
                <s></s>
                <s></s>
                <s></s>
                <h3>&quot;Дім Сірка&quot;</h3>
            </div>
            <span style="${"font-size: 24px"}">
               →
            </span>
        </div>
    `
	})}

    <br>
    <br class="${"tiny"}">

    ${validate_component(Card, "Card").$$render($$result, { class: "container" }, {}, {
		default: () => `
        <br>
        <br class="${"small"}">

        <h2>Збережемо тварин разом</h2>
        <br class="${"small"}">
        <h3 class="${"font-w-normal"}" style="${"opacity: .7"}">Збір грошей на допомогу безпритульним
            тваринам</h3>

        <br>
        <br class="${"small"}">

        <p class="${"font-secondary"}">
            <span class="${"h1 font-w-500"}">₴ 3500</span>
            <span class="${"h3"}"> / ₴ 20000</span>
        </p>

        <br>

        ${validate_component(Progress, "Progress").$$render($$result, { value: Math.floor(3500 / 20000 * 100) }, {}, {})}

        <br class="${"big"}">
    `
	})}

    <br class="${"small"}">
    <br>

    <p class="${"container flex flex-justify-between flex-align-center"}">
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
            <span class="${"font-secondary font-w-600 h3"}">1</span>
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
            <span class="${"font-secondary font-w-600 h3"}">13</span>
        </span>
    </p>

    <br class="${"big"}">

    <h2>Збережемо тварин разом</h2>
    <br class="${"small"}">
    <pre class="${"font-w-300"}">
        Терміново шукаємо добрі руки 🤲🥰
        Бадді підкинули під кафе біля самої траси!
        Біля нього були тільки залишки черствого хліба... 💔
        За що можна було покинути малюка напризволяще? 🥺
        В чому він міг провинитися? Йому всього 2 місяці.
        Зараз буде проходити обробку від паразитів та вакцинацію 💉
    </pre>

    <br class="${"small"}">

    <p class="${"flex"}">
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
    </p>

    <br>
    <br>
    <br>

    <section class="${"flex flex-column flex-align-center flex-justify-center"}">
        <div style="${"width: 100px; max-width: 100%"}">
            ${validate_component(TrustButton, "TrustButton").$$render($$result, { isActive: active }, {}, {})}
        </div>
        <br class="${"small"}">
        <h2>Я Довіряю</h2>
    </section>

    <br>
    <br>
    <br>
    <br>

    ${validate_component(Card, "Card").$$render($$result, { class: "container" }, {}, {
		default: () => `
        <br class="${"big"}">

        <div class="${"flex flex-column flex-align-center"}">
            <span>
                ${validate_component(FancyBox, "FancyBox").$$render($$result, {}, {}, {
			box: () => `<div slot="${"box"}">
                        ${validate_component(Avatar, "Avatar").$$render(
				$$result,
				{
					src: "https://placeimg.com/300/300/animal",
					alt: "Волтер"
				},
				{},
				{}
			)}
                    </div>`,
			default: () => `
                    ${validate_component(Avatar, "Avatar").$$render(
				$$result,
				{
					src: "https://placeimg.com/300/300/animal",
					size: "big",
					alt: "Волтер"
				},
				{},
				{}
			)}
                    
                `
		})}
            </span>

            <br class="${"tiny"}">
            <br>

            <h2>Волтер</h2>
            <br class="${"tiny"}">
            <h4 class="${"font-w-500"}">Jack Russell Terrier</h4>
        </div>

        <br class="${"big"}">

        <section class="${"flex flex-justify-center"}">
            <div class="${"flex flex-center relative"}" style="${"width: 90px; height: 90px; margin: 0 .8em"}">
                ${validate_component(Icon, "Icon").$$render($$result, { type: "polygon", is: "primary" }, {}, {})}
                <div class="${"text-white text-center absolute"}">
                    <h4 class="${"h1"}">3</h4>
                    <h4 style="${"margin-top: -8px"}">Роки</h4>
                </div>
            </div>

            <div class="${"flex flex-center relative"}" style="${"width: 90px; height: 90px; margin: 0 .8em"}">
                ${validate_component(Icon, "Icon").$$render($$result, { type: "polygon", is: "info" }, {}, {})}
                <div class="${"absolute flex"}" style="${"width: 44px; height: 44px"}">
                    ${validate_component(Icon, "Icon").$$render($$result, { type: "male", is: "light" }, {}, {})}
                </div>
            </div>

            <div class="${"flex flex-center relative"}" style="${"width: 90px; height: 90px; margin: 0 .8em; opacity: .3"}">
                ${validate_component(Icon, "Icon").$$render($$result, { type: "polygon", is: "primary" }, {}, {})}
                <div class="${"absolute flex flex-column flex-center"}">
                    ${validate_component(Icon, "Icon").$$render(
			$$result,
			{
				type: "cancel-circle",
				is: "light",
				size: "big"
			},
			{},
			{}
		)}
                    <span class="${"text-white text-center h5"}">Cтерилізація</span>
                </div>
            </div>
        </section>

        <br class="${"big"}">
        <br class="${"small"}">

        <h2>Характер Волтера: 😃</h2>
        <br class="${"small"}">
        <p class="${"font-w-300"}">
            Дуже грайливий і милий песик. Любить проводити час з іншими собаками, дуже любить гратись з дітьми
        </p>

        <br class="${"big"}">

        <h2>Життя Волтера</h2>
        <br class="${"small"}">
        <table class="${"svelte-9y31ev"}">
            <tbody>
            <tr>
                <td class="${"svelte-9y31ev"}">01.02.2019</td>
                <td class="${"svelte-9y31ev"}">—</td>
                <td class="${"svelte-9y31ev"}">Його перший день народження</td>
            </tr>
            <tr>
                <td class="${"svelte-9y31ev"}">05.02.2019</td>
                <td class="${"svelte-9y31ev"}">—</td>
                <td class="${"svelte-9y31ev"}">Ми приютили його з вулиці</td>
            </tr>
            <tr>
                <td class="${"svelte-9y31ev"}">07.03.2019</td>
                <td class="${"svelte-9y31ev"}">—</td>
                <td class="${"svelte-9y31ev"}">Зробили вакцинацію проти бліх</td>
            </tr>
            <tr>
                <td class="${"svelte-9y31ev"}">23.06.2019</td>
                <td class="${"svelte-9y31ev"}">—</td>
                <td class="${"svelte-9y31ev"}">Знайшов для себе улюблену іграшку</td>
            </tr>
            </tbody>
        </table>

        <br>
        <br>
        <br>

        <h2>Вакцинації</h2>
        <br>
        <ul class="${"flex flex-column text-left"}">
            <li>
                <span class="${"flex flex-align-center font-w-300"}">
                    ${validate_component(Icon, "Icon").$$render(
			$$result,
			{
				is: "primary",
				type: "checked-circle",
				size: "small"
			},
			{},
			{}
		)}
                    <s></s>
                    <s></s>
                    Від бліх
                </span>
            </li>
            <li>
                <br>
                <span class="${"flex flex-align-center font-w-300"}">
                    ${validate_component(Icon, "Icon").$$render(
			$$result,
			{
				is: "primary",
				type: "checked-circle",
				size: "small"
			},
			{},
			{}
		)}
                    <s></s>
                    <s></s>
                    Від паразитів
                </span>
            </li>
            <li>
                <br>
                <span class="${"flex flex-align-center font-w-300"}">
                    ${validate_component(Icon, "Icon").$$render(
			$$result,
			{
				is: "danger",
				type: "cancel-circle",
				size: "small"
			},
			{},
			{}
		)}
                    <s></s>
                    <s></s>
                    Від грибків
                </span>
            </li>
        </ul>

        <br class="${"big"}">
    `
	})}

    <br class="${"big"}">
    <br class="${"big"}">

    <h2>Наші піклувальники</h2>
    <br class="${"small"}">
    <div class="${"full-container"}">
        ${validate_component(DonatorsList, "DonatorsList").$$render($$result, {}, {}, {})}
    </div>

    <br class="${"big"}">
    <br>

    <h2>Документи</h2>
    <br>
    <div class="${"full-container"}">
        ${validate_component(Documents, "Documents").$$render($$result, {}, {}, {})}
    </div>

    <br class="${"big"}">
    <br class="${"big"}">

    <h2>Відео про Волтера</h2>
    <br>
    <section class="${"flex"}" style="${"height: 200px"}">
        ${validate_component(Carousel, "Carousel").$$render($$result, { items: carousel }, {}, {})}
    </section>

    <br class="${"big"}">
    <br class="${"big"}">

    <h2>Контакти</h2>
    <br>
    <ul style="${"list-style: disc outside none; padding-left: var(--screen-padding)"}" class="${"h3 font-w-500 font-secondary"}">
        <li style="${"padding-bottom: 4px"}">Ви пожете купити йому поїсти</li>
        <li style="${"padding-bottom: 4px"}">Можете особисто відвідати його у нас</li>
        <li style="${"padding-bottom: 4px"}">Купити вакцінацію для Волтера</li>
        <li style="${"padding-bottom: 4px"}">Допомогти любим інщим способом</li>
    </ul>
    <br class="${"big"}">
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
            <h2>+38 (093) 205-43-92</h2>
        </div>
    </div>
    <br class="${"small"}">
    <p class="${"font-w-300"}">Подзвоніть нам, якщо хочете допомогти Волтеру</p>

    <br class="${"big"}">
    <br class="${"big"}">

    <h2>Коментарі</h2>
    <br class="${"small"}">
    <div class="${"full-container"}">
        ${validate_component(Comments, "Comments").$$render($$result, {}, {}, {})}
    </div>

    <br class="${"big"}">
    <br class="${"big"}">
    <br class="${"big"}">

    <div class="${"full-container"}">
        ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
    </div>

</section>`;
});

/* src/routes/lists/organizations.svelte generated by Svelte v3.18.1 */

const Organizations = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let organizations = [];

	onMount(async () => {
		await new Promise(r => setTimeout(r, 1000));
		const orgs = await api.getOrganizations();
		organizations = new Array(1).fill(orgs).reduce((a, o) => a.concat(...o), []);
	});

	return `${($$result.head += `${($$result.title = `<title>Charitify - is the application for helping those in need.</title>`, "")}`, "")}



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
		const chars = await api.getFunds();
		chariries = new Array(5).fill(chars).reduce((a, o) => a.concat(...o), []);
	});

	return `${($$result.head += `${($$result.title = `<title>Charitify - is the application for helping those in need.</title>`, "")}`, "")}



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

/* src/routes/users/me.svelte generated by Svelte v3.18.1 */

const css$u = {
	code: "section.svelte-uq20p0{display:flex;align-items:center;flex-direction:column}ul.svelte-uq20p0{display:flex;justify-content:center;flex-wrap:wrap;margin:0 -5px}li.svelte-uq20p0{flex:1 1 50%;padding:5px}.user-avatar.svelte-uq20p0{flex:none;display:flex;align-items:center;justify-content:center;width:100px;height:100px;border-radius:50%;overflow:hidden;box-shadow:var(--shadow-primary);background-color:rgba(var(--theme-bg-color))}",
	map: "{\"version\":3,\"file\":\"me.svelte\",\"sources\":[\"me.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Input, Picture, Button, Space } from '../../components'\\n\\n    const inputs = [\\n        {\\n            placeholder: 'username',\\n        },\\n        {\\n            placeholder: 'Full name',\\n        },\\n        {\\n            placeholder: 'sex (checkboxes or dropdown)',\\n        },\\n        {\\n            placeholder: 'birth',\\n        },\\n        {\\n            placeholder: 'email',\\n        },\\n        {\\n            placeholder: 'tel',\\n        },\\n        {\\n            placeholder: 'location (autocomplete)',\\n        },\\n    ]\\n\\n    const USERNAME = 'bublikus.script'\\n</script>\\n\\n<section class=\\\"container\\\">\\n    <br>\\n    <div class=\\\"user-avatar\\\">\\n        <Picture src=\\\"https://placeimg.com/100/100/people\\\" alt=\\\"user avatar\\\"/>\\n    </div>\\n    <br>\\n    <br>\\n    <section style=\\\"display: flex; flex-direction: row\\\">\\n        <Button is=\\\"success\\\" auto>success</Button>\\n        <Space size=\\\"2\\\"/>\\n        <Button is=\\\"warning\\\" auto>warning</Button>\\n        <Space size=\\\"2\\\"/>\\n        <Button is=\\\"danger\\\" auto>danger</Button>\\n        <Space size=\\\"2\\\"/>\\n        <Button is=\\\"info\\\" auto>info</Button>\\n    </section>\\n    <br>\\n    <br>\\n    <a href={`https://instagram.com/${USERNAME}/`}>Link to Instagram Page</a>\\n    <br>\\n    <br>\\n    <a href={`instagram://user?username=${USERNAME}`}>Link to Instagram Profile</a>\\n    <br>\\n    <br>\\n    <ul>\\n        {#each inputs as inp}\\n            <li>\\n                <Input {...inp}/>\\n            </li>\\n        {/each}\\n    </ul>\\n</section>\\n\\n<style>\\n    section {\\n        display: flex;\\n        align-items: center;\\n        flex-direction: column;\\n    }\\n\\n    ul {\\n        display: flex;\\n        justify-content: center;\\n        flex-wrap: wrap;\\n        margin: 0 -5px;\\n    }\\n\\n    li {\\n        flex: 1 1 50%;\\n        padding: 5px;\\n    }\\n\\n    .user-avatar {\\n        flex: none;\\n        display: flex;\\n        align-items: center;\\n        justify-content: center;\\n        width: 100px;\\n        height: 100px;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        box-shadow: var(--shadow-primary);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvdXNlcnMvbWUuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGFBQWE7UUFDYixtQkFBbUI7UUFDbkIsc0JBQXNCO0lBQzFCOztJQUVBO1FBQ0ksYUFBYTtRQUNiLHVCQUF1QjtRQUN2QixlQUFlO1FBQ2YsY0FBYztJQUNsQjs7SUFFQTtRQUNJLGFBQWE7UUFDYixZQUFZO0lBQ2hCOztJQUVBO1FBQ0ksVUFBVTtRQUNWLGFBQWE7UUFDYixtQkFBbUI7UUFDbkIsdUJBQXVCO1FBQ3ZCLFlBQVk7UUFDWixhQUFhO1FBQ2Isa0JBQWtCO1FBQ2xCLGdCQUFnQjtRQUNoQixpQ0FBaUM7UUFDakMsNkNBQTZDO0lBQ2pEIiwiZmlsZSI6InNyYy9yb3V0ZXMvdXNlcnMvbWUuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgc2VjdGlvbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgfVxuXG4gICAgdWwge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgICAgICBtYXJnaW46IDAgLTVweDtcbiAgICB9XG5cbiAgICBsaSB7XG4gICAgICAgIGZsZXg6IDEgMSA1MCU7XG4gICAgICAgIHBhZGRpbmc6IDVweDtcbiAgICB9XG5cbiAgICAudXNlci1hdmF0YXIge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgd2lkdGg6IDEwMHB4O1xuICAgICAgICBoZWlnaHQ6IDEwMHB4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvcikpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAgEI,OAAO,cAAC,CAAC,AACL,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,cAAc,CAAE,MAAM,AAC1B,CAAC,AAED,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,CAAC,CAAC,IAAI,AAClB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CACb,OAAO,CAAE,GAAG,AAChB,CAAC,AAED,YAAY,cAAC,CAAC,AACV,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC\"}"
};

const USERNAME = "bublikus.script";

const Me = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const inputs = [
		{ placeholder: "username" },
		{ placeholder: "Full name" },
		{
			placeholder: "sex (checkboxes or dropdown)"
		},
		{ placeholder: "birth" },
		{ placeholder: "email" },
		{ placeholder: "tel" },
		{ placeholder: "location (autocomplete)" }
	];

	$$result.css.add(css$u);

	return `<section class="${"container svelte-uq20p0"}">
    <br>
    <div class="${"user-avatar svelte-uq20p0"}">
        ${validate_component(Picture, "Picture").$$render(
		$$result,
		{
			src: "https://placeimg.com/100/100/people",
			alt: "user avatar"
		},
		{},
		{}
	)}
    </div>
    <br>
    <br>
    <section style="${"display: flex; flex-direction: row"}" class="${"svelte-uq20p0"}">
        ${validate_component(Button, "Button").$$render($$result, { is: "success", auto: true }, {}, { default: () => `success` })}
        ${validate_component(Space, "Space").$$render($$result, { size: "2" }, {}, {})}
        ${validate_component(Button, "Button").$$render($$result, { is: "warning", auto: true }, {}, { default: () => `warning` })}
        ${validate_component(Space, "Space").$$render($$result, { size: "2" }, {}, {})}
        ${validate_component(Button, "Button").$$render($$result, { is: "danger", auto: true }, {}, { default: () => `danger` })}
        ${validate_component(Space, "Space").$$render($$result, { size: "2" }, {}, {})}
        ${validate_component(Button, "Button").$$render($$result, { is: "info", auto: true }, {}, { default: () => `info` })}
    </section>
    <br>
    <br>
    <a${add_attribute("href", `https://instagram.com/${USERNAME}/`, 0)}>Link to Instagram Page</a>
    <br>
    <br>
    <a${add_attribute("href", `instagram://user?username=${USERNAME}`, 0)}>Link to Instagram Profile</a>
    <br>
    <br>
    <ul class="${"svelte-uq20p0"}">
        ${each(inputs, inp => `<li class="${"svelte-uq20p0"}">
                ${validate_component(Input, "Input").$$render($$result, Object.assign(inp), {}, {})}
            </li>`)}
    </ul>
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

var mime_raw = "application/andrew-inset\t\t\tez\napplication/applixware\t\t\t\taw\napplication/atom+xml\t\t\t\tatom\napplication/atomcat+xml\t\t\t\tatomcat\napplication/atomsvc+xml\t\t\t\tatomsvc\napplication/ccxml+xml\t\t\t\tccxml\napplication/cdmi-capability\t\t\tcdmia\napplication/cdmi-container\t\t\tcdmic\napplication/cdmi-domain\t\t\t\tcdmid\napplication/cdmi-object\t\t\t\tcdmio\napplication/cdmi-queue\t\t\t\tcdmiq\napplication/cu-seeme\t\t\t\tcu\napplication/davmount+xml\t\t\tdavmount\napplication/docbook+xml\t\t\t\tdbk\napplication/dssc+der\t\t\t\tdssc\napplication/dssc+xml\t\t\t\txdssc\napplication/ecmascript\t\t\t\tecma\napplication/emma+xml\t\t\t\temma\napplication/epub+zip\t\t\t\tepub\napplication/exi\t\t\t\t\texi\napplication/font-tdpfr\t\t\t\tpfr\napplication/gml+xml\t\t\t\tgml\napplication/gpx+xml\t\t\t\tgpx\napplication/gxf\t\t\t\t\tgxf\napplication/hyperstudio\t\t\t\tstk\napplication/inkml+xml\t\t\t\tink inkml\napplication/ipfix\t\t\t\tipfix\napplication/java-archive\t\t\tjar\napplication/java-serialized-object\t\tser\napplication/java-vm\t\t\t\tclass\napplication/javascript\t\t\t\tjs\napplication/json\t\t\t\tjson map\napplication/jsonml+json\t\t\t\tjsonml\napplication/lost+xml\t\t\t\tlostxml\napplication/mac-binhex40\t\t\thqx\napplication/mac-compactpro\t\t\tcpt\napplication/mads+xml\t\t\t\tmads\napplication/marc\t\t\t\tmrc\napplication/marcxml+xml\t\t\t\tmrcx\napplication/mathematica\t\t\t\tma nb mb\napplication/mathml+xml\t\t\t\tmathml\napplication/mbox\t\t\t\tmbox\napplication/mediaservercontrol+xml\t\tmscml\napplication/metalink+xml\t\t\tmetalink\napplication/metalink4+xml\t\t\tmeta4\napplication/mets+xml\t\t\t\tmets\napplication/mods+xml\t\t\t\tmods\napplication/mp21\t\t\t\tm21 mp21\napplication/mp4\t\t\t\t\tmp4s\napplication/msword\t\t\t\tdoc dot\napplication/mxf\t\t\t\t\tmxf\napplication/octet-stream\tbin dms lrf mar so dist distz pkg bpk dump elc deploy\napplication/oda\t\t\t\t\toda\napplication/oebps-package+xml\t\t\topf\napplication/ogg\t\t\t\t\togx\napplication/omdoc+xml\t\t\t\tomdoc\napplication/onenote\t\t\t\tonetoc onetoc2 onetmp onepkg\napplication/oxps\t\t\t\toxps\napplication/patch-ops-error+xml\t\t\txer\napplication/pdf\t\t\t\t\tpdf\napplication/pgp-encrypted\t\t\tpgp\napplication/pgp-signature\t\t\tasc sig\napplication/pics-rules\t\t\t\tprf\napplication/pkcs10\t\t\t\tp10\napplication/pkcs7-mime\t\t\t\tp7m p7c\napplication/pkcs7-signature\t\t\tp7s\napplication/pkcs8\t\t\t\tp8\napplication/pkix-attr-cert\t\t\tac\napplication/pkix-cert\t\t\t\tcer\napplication/pkix-crl\t\t\t\tcrl\napplication/pkix-pkipath\t\t\tpkipath\napplication/pkixcmp\t\t\t\tpki\napplication/pls+xml\t\t\t\tpls\napplication/postscript\t\t\t\tai eps ps\napplication/prs.cww\t\t\t\tcww\napplication/pskc+xml\t\t\t\tpskcxml\napplication/rdf+xml\t\t\t\trdf\napplication/reginfo+xml\t\t\t\trif\napplication/relax-ng-compact-syntax\t\trnc\napplication/resource-lists+xml\t\t\trl\napplication/resource-lists-diff+xml\t\trld\napplication/rls-services+xml\t\t\trs\napplication/rpki-ghostbusters\t\t\tgbr\napplication/rpki-manifest\t\t\tmft\napplication/rpki-roa\t\t\t\troa\napplication/rsd+xml\t\t\t\trsd\napplication/rss+xml\t\t\t\trss\napplication/rtf\t\t\t\t\trtf\napplication/sbml+xml\t\t\t\tsbml\napplication/scvp-cv-request\t\t\tscq\napplication/scvp-cv-response\t\t\tscs\napplication/scvp-vp-request\t\t\tspq\napplication/scvp-vp-response\t\t\tspp\napplication/sdp\t\t\t\t\tsdp\napplication/set-payment-initiation\t\tsetpay\napplication/set-registration-initiation\t\tsetreg\napplication/shf+xml\t\t\t\tshf\napplication/smil+xml\t\t\t\tsmi smil\napplication/sparql-query\t\t\trq\napplication/sparql-results+xml\t\t\tsrx\napplication/srgs\t\t\t\tgram\napplication/srgs+xml\t\t\t\tgrxml\napplication/sru+xml\t\t\t\tsru\napplication/ssdl+xml\t\t\t\tssdl\napplication/ssml+xml\t\t\t\tssml\napplication/tei+xml\t\t\t\ttei teicorpus\napplication/thraud+xml\t\t\t\ttfi\napplication/timestamped-data\t\t\ttsd\napplication/vnd.3gpp.pic-bw-large\t\tplb\napplication/vnd.3gpp.pic-bw-small\t\tpsb\napplication/vnd.3gpp.pic-bw-var\t\t\tpvb\napplication/vnd.3gpp2.tcap\t\t\ttcap\napplication/vnd.3m.post-it-notes\t\tpwn\napplication/vnd.accpac.simply.aso\t\taso\napplication/vnd.accpac.simply.imp\t\timp\napplication/vnd.acucobol\t\t\tacu\napplication/vnd.acucorp\t\t\t\tatc acutc\napplication/vnd.adobe.air-application-installer-package+zip\tair\napplication/vnd.adobe.formscentral.fcdt\t\tfcdt\napplication/vnd.adobe.fxp\t\t\tfxp fxpl\napplication/vnd.adobe.xdp+xml\t\t\txdp\napplication/vnd.adobe.xfdf\t\t\txfdf\napplication/vnd.ahead.space\t\t\tahead\napplication/vnd.airzip.filesecure.azf\t\tazf\napplication/vnd.airzip.filesecure.azs\t\tazs\napplication/vnd.amazon.ebook\t\t\tazw\napplication/vnd.americandynamics.acc\t\tacc\napplication/vnd.amiga.ami\t\t\tami\napplication/vnd.android.package-archive\t\tapk\napplication/vnd.anser-web-certificate-issue-initiation\tcii\napplication/vnd.anser-web-funds-transfer-initiation\tfti\napplication/vnd.antix.game-component\t\tatx\napplication/vnd.apple.installer+xml\t\tmpkg\napplication/vnd.apple.mpegurl\t\t\tm3u8\napplication/vnd.aristanetworks.swi\t\tswi\napplication/vnd.astraea-software.iota\t\tiota\napplication/vnd.audiograph\t\t\taep\napplication/vnd.blueice.multipass\t\tmpm\napplication/vnd.bmi\t\t\t\tbmi\napplication/vnd.businessobjects\t\t\trep\napplication/vnd.chemdraw+xml\t\t\tcdxml\napplication/vnd.chipnuts.karaoke-mmd\t\tmmd\napplication/vnd.cinderella\t\t\tcdy\napplication/vnd.claymore\t\t\tcla\napplication/vnd.cloanto.rp9\t\t\trp9\napplication/vnd.clonk.c4group\t\t\tc4g c4d c4f c4p c4u\napplication/vnd.cluetrust.cartomobile-config\t\tc11amc\napplication/vnd.cluetrust.cartomobile-config-pkg\tc11amz\napplication/vnd.commonspace\t\t\tcsp\napplication/vnd.contact.cmsg\t\t\tcdbcmsg\napplication/vnd.cosmocaller\t\t\tcmc\napplication/vnd.crick.clicker\t\t\tclkx\napplication/vnd.crick.clicker.keyboard\t\tclkk\napplication/vnd.crick.clicker.palette\t\tclkp\napplication/vnd.crick.clicker.template\t\tclkt\napplication/vnd.crick.clicker.wordbank\t\tclkw\napplication/vnd.criticaltools.wbs+xml\t\twbs\napplication/vnd.ctc-posml\t\t\tpml\napplication/vnd.cups-ppd\t\t\tppd\napplication/vnd.curl.car\t\t\tcar\napplication/vnd.curl.pcurl\t\t\tpcurl\napplication/vnd.dart\t\t\t\tdart\napplication/vnd.data-vision.rdz\t\t\trdz\napplication/vnd.dece.data\t\t\tuvf uvvf uvd uvvd\napplication/vnd.dece.ttml+xml\t\t\tuvt uvvt\napplication/vnd.dece.unspecified\t\tuvx uvvx\napplication/vnd.dece.zip\t\t\tuvz uvvz\napplication/vnd.denovo.fcselayout-link\t\tfe_launch\napplication/vnd.dna\t\t\t\tdna\napplication/vnd.dolby.mlp\t\t\tmlp\napplication/vnd.dpgraph\t\t\t\tdpg\napplication/vnd.dreamfactory\t\t\tdfac\napplication/vnd.ds-keypoint\t\t\tkpxx\napplication/vnd.dvb.ait\t\t\t\tait\napplication/vnd.dvb.service\t\t\tsvc\napplication/vnd.dynageo\t\t\t\tgeo\napplication/vnd.ecowin.chart\t\t\tmag\napplication/vnd.enliven\t\t\t\tnml\napplication/vnd.epson.esf\t\t\tesf\napplication/vnd.epson.msf\t\t\tmsf\napplication/vnd.epson.quickanime\t\tqam\napplication/vnd.epson.salt\t\t\tslt\napplication/vnd.epson.ssf\t\t\tssf\napplication/vnd.eszigno3+xml\t\t\tes3 et3\napplication/vnd.ezpix-album\t\t\tez2\napplication/vnd.ezpix-package\t\t\tez3\napplication/vnd.fdf\t\t\t\tfdf\napplication/vnd.fdsn.mseed\t\t\tmseed\napplication/vnd.fdsn.seed\t\t\tseed dataless\napplication/vnd.flographit\t\t\tgph\napplication/vnd.fluxtime.clip\t\t\tftc\napplication/vnd.framemaker\t\t\tfm frame maker book\napplication/vnd.frogans.fnc\t\t\tfnc\napplication/vnd.frogans.ltf\t\t\tltf\napplication/vnd.fsc.weblaunch\t\t\tfsc\napplication/vnd.fujitsu.oasys\t\t\toas\napplication/vnd.fujitsu.oasys2\t\t\toa2\napplication/vnd.fujitsu.oasys3\t\t\toa3\napplication/vnd.fujitsu.oasysgp\t\t\tfg5\napplication/vnd.fujitsu.oasysprs\t\tbh2\napplication/vnd.fujixerox.ddd\t\t\tddd\napplication/vnd.fujixerox.docuworks\t\txdw\napplication/vnd.fujixerox.docuworks.binder\txbd\napplication/vnd.fuzzysheet\t\t\tfzs\napplication/vnd.genomatix.tuxedo\t\ttxd\napplication/vnd.geogebra.file\t\t\tggb\napplication/vnd.geogebra.tool\t\t\tggt\napplication/vnd.geometry-explorer\t\tgex gre\napplication/vnd.geonext\t\t\t\tgxt\napplication/vnd.geoplan\t\t\t\tg2w\napplication/vnd.geospace\t\t\tg3w\napplication/vnd.gmx\t\t\t\tgmx\napplication/vnd.google-earth.kml+xml\t\tkml\napplication/vnd.google-earth.kmz\t\tkmz\napplication/vnd.grafeq\t\t\t\tgqf gqs\napplication/vnd.groove-account\t\t\tgac\napplication/vnd.groove-help\t\t\tghf\napplication/vnd.groove-identity-message\t\tgim\napplication/vnd.groove-injector\t\t\tgrv\napplication/vnd.groove-tool-message\t\tgtm\napplication/vnd.groove-tool-template\t\ttpl\napplication/vnd.groove-vcard\t\t\tvcg\napplication/vnd.hal+xml\t\t\t\thal\napplication/vnd.handheld-entertainment+xml\tzmm\napplication/vnd.hbci\t\t\t\thbci\napplication/vnd.hhe.lesson-player\t\tles\napplication/vnd.hp-hpgl\t\t\t\thpgl\napplication/vnd.hp-hpid\t\t\t\thpid\napplication/vnd.hp-hps\t\t\t\thps\napplication/vnd.hp-jlyt\t\t\t\tjlt\napplication/vnd.hp-pcl\t\t\t\tpcl\napplication/vnd.hp-pclxl\t\t\tpclxl\napplication/vnd.hydrostatix.sof-data\t\tsfd-hdstx\napplication/vnd.ibm.minipay\t\t\tmpy\napplication/vnd.ibm.modcap\t\t\tafp listafp list3820\napplication/vnd.ibm.rights-management\t\tirm\napplication/vnd.ibm.secure-container\t\tsc\napplication/vnd.iccprofile\t\t\ticc icm\napplication/vnd.igloader\t\t\tigl\napplication/vnd.immervision-ivp\t\t\tivp\napplication/vnd.immervision-ivu\t\t\tivu\napplication/vnd.insors.igm\t\t\tigm\napplication/vnd.intercon.formnet\t\txpw xpx\napplication/vnd.intergeo\t\t\ti2g\napplication/vnd.intu.qbo\t\t\tqbo\napplication/vnd.intu.qfx\t\t\tqfx\napplication/vnd.ipunplugged.rcprofile\t\trcprofile\napplication/vnd.irepository.package+xml\t\tirp\napplication/vnd.is-xpr\t\t\t\txpr\napplication/vnd.isac.fcs\t\t\tfcs\napplication/vnd.jam\t\t\t\tjam\napplication/vnd.jcp.javame.midlet-rms\t\trms\napplication/vnd.jisp\t\t\t\tjisp\napplication/vnd.joost.joda-archive\t\tjoda\napplication/vnd.kahootz\t\t\t\tktz ktr\napplication/vnd.kde.karbon\t\t\tkarbon\napplication/vnd.kde.kchart\t\t\tchrt\napplication/vnd.kde.kformula\t\t\tkfo\napplication/vnd.kde.kivio\t\t\tflw\napplication/vnd.kde.kontour\t\t\tkon\napplication/vnd.kde.kpresenter\t\t\tkpr kpt\napplication/vnd.kde.kspread\t\t\tksp\napplication/vnd.kde.kword\t\t\tkwd kwt\napplication/vnd.kenameaapp\t\t\thtke\napplication/vnd.kidspiration\t\t\tkia\napplication/vnd.kinar\t\t\t\tkne knp\napplication/vnd.koan\t\t\t\tskp skd skt skm\napplication/vnd.kodak-descriptor\t\tsse\napplication/vnd.las.las+xml\t\t\tlasxml\napplication/vnd.llamagraphics.life-balance.desktop\tlbd\napplication/vnd.llamagraphics.life-balance.exchange+xml\tlbe\napplication/vnd.lotus-1-2-3\t\t\t123\napplication/vnd.lotus-approach\t\t\tapr\napplication/vnd.lotus-freelance\t\t\tpre\napplication/vnd.lotus-notes\t\t\tnsf\napplication/vnd.lotus-organizer\t\t\torg\napplication/vnd.lotus-screencam\t\t\tscm\napplication/vnd.lotus-wordpro\t\t\tlwp\napplication/vnd.macports.portpkg\t\tportpkg\napplication/vnd.mcd\t\t\t\tmcd\napplication/vnd.medcalcdata\t\t\tmc1\napplication/vnd.mediastation.cdkey\t\tcdkey\napplication/vnd.mfer\t\t\t\tmwf\napplication/vnd.mfmp\t\t\t\tmfm\napplication/vnd.micrografx.flo\t\t\tflo\napplication/vnd.micrografx.igx\t\t\tigx\napplication/vnd.mif\t\t\t\tmif\napplication/vnd.mobius.daf\t\t\tdaf\napplication/vnd.mobius.dis\t\t\tdis\napplication/vnd.mobius.mbk\t\t\tmbk\napplication/vnd.mobius.mqy\t\t\tmqy\napplication/vnd.mobius.msl\t\t\tmsl\napplication/vnd.mobius.plc\t\t\tplc\napplication/vnd.mobius.txf\t\t\ttxf\napplication/vnd.mophun.application\t\tmpn\napplication/vnd.mophun.certificate\t\tmpc\napplication/vnd.mozilla.xul+xml\t\t\txul\napplication/vnd.ms-artgalry\t\t\tcil\napplication/vnd.ms-cab-compressed\t\tcab\napplication/vnd.ms-excel\t\t\txls xlm xla xlc xlt xlw\napplication/vnd.ms-excel.addin.macroenabled.12\t\txlam\napplication/vnd.ms-excel.sheet.binary.macroenabled.12\txlsb\napplication/vnd.ms-excel.sheet.macroenabled.12\t\txlsm\napplication/vnd.ms-excel.template.macroenabled.12\txltm\napplication/vnd.ms-fontobject\t\t\teot\napplication/vnd.ms-htmlhelp\t\t\tchm\napplication/vnd.ms-ims\t\t\t\tims\napplication/vnd.ms-lrm\t\t\t\tlrm\napplication/vnd.ms-officetheme\t\t\tthmx\napplication/vnd.ms-pki.seccat\t\t\tcat\napplication/vnd.ms-pki.stl\t\t\tstl\napplication/vnd.ms-powerpoint\t\t\tppt pps pot\napplication/vnd.ms-powerpoint.addin.macroenabled.12\t\tppam\napplication/vnd.ms-powerpoint.presentation.macroenabled.12\tpptm\napplication/vnd.ms-powerpoint.slide.macroenabled.12\t\tsldm\napplication/vnd.ms-powerpoint.slideshow.macroenabled.12\t\tppsm\napplication/vnd.ms-powerpoint.template.macroenabled.12\t\tpotm\napplication/vnd.ms-project\t\t\tmpp mpt\napplication/vnd.ms-word.document.macroenabled.12\tdocm\napplication/vnd.ms-word.template.macroenabled.12\tdotm\napplication/vnd.ms-works\t\t\twps wks wcm wdb\napplication/vnd.ms-wpl\t\t\t\twpl\napplication/vnd.ms-xpsdocument\t\t\txps\napplication/vnd.mseq\t\t\t\tmseq\napplication/vnd.musician\t\t\tmus\napplication/vnd.muvee.style\t\t\tmsty\napplication/vnd.mynfc\t\t\t\ttaglet\napplication/vnd.neurolanguage.nlu\t\tnlu\napplication/vnd.nitf\t\t\t\tntf nitf\napplication/vnd.noblenet-directory\t\tnnd\napplication/vnd.noblenet-sealer\t\t\tnns\napplication/vnd.noblenet-web\t\t\tnnw\napplication/vnd.nokia.n-gage.data\t\tngdat\napplication/vnd.nokia.n-gage.symbian.install\tn-gage\napplication/vnd.nokia.radio-preset\t\trpst\napplication/vnd.nokia.radio-presets\t\trpss\napplication/vnd.novadigm.edm\t\t\tedm\napplication/vnd.novadigm.edx\t\t\tedx\napplication/vnd.novadigm.ext\t\t\text\napplication/vnd.oasis.opendocument.chart\t\todc\napplication/vnd.oasis.opendocument.chart-template\totc\napplication/vnd.oasis.opendocument.database\t\todb\napplication/vnd.oasis.opendocument.formula\t\todf\napplication/vnd.oasis.opendocument.formula-template\todft\napplication/vnd.oasis.opendocument.graphics\t\todg\napplication/vnd.oasis.opendocument.graphics-template\totg\napplication/vnd.oasis.opendocument.image\t\todi\napplication/vnd.oasis.opendocument.image-template\toti\napplication/vnd.oasis.opendocument.presentation\t\todp\napplication/vnd.oasis.opendocument.presentation-template\totp\napplication/vnd.oasis.opendocument.spreadsheet\t\tods\napplication/vnd.oasis.opendocument.spreadsheet-template\tots\napplication/vnd.oasis.opendocument.text\t\t\todt\napplication/vnd.oasis.opendocument.text-master\t\todm\napplication/vnd.oasis.opendocument.text-template\tott\napplication/vnd.oasis.opendocument.text-web\t\toth\napplication/vnd.olpc-sugar\t\t\txo\napplication/vnd.oma.dd2+xml\t\t\tdd2\napplication/vnd.openofficeorg.extension\t\toxt\napplication/vnd.openxmlformats-officedocument.presentationml.presentation\tpptx\napplication/vnd.openxmlformats-officedocument.presentationml.slide\tsldx\napplication/vnd.openxmlformats-officedocument.presentationml.slideshow\tppsx\napplication/vnd.openxmlformats-officedocument.presentationml.template\tpotx\napplication/vnd.openxmlformats-officedocument.spreadsheetml.sheet\txlsx\napplication/vnd.openxmlformats-officedocument.spreadsheetml.template\txltx\napplication/vnd.openxmlformats-officedocument.wordprocessingml.document\tdocx\napplication/vnd.openxmlformats-officedocument.wordprocessingml.template\tdotx\napplication/vnd.osgeo.mapguide.package\t\tmgp\napplication/vnd.osgi.dp\t\t\t\tdp\napplication/vnd.osgi.subsystem\t\t\tesa\napplication/vnd.palm\t\t\t\tpdb pqa oprc\napplication/vnd.pawaafile\t\t\tpaw\napplication/vnd.pg.format\t\t\tstr\napplication/vnd.pg.osasli\t\t\tei6\napplication/vnd.picsel\t\t\t\tefif\napplication/vnd.pmi.widget\t\t\twg\napplication/vnd.pocketlearn\t\t\tplf\napplication/vnd.powerbuilder6\t\t\tpbd\napplication/vnd.previewsystems.box\t\tbox\napplication/vnd.proteus.magazine\t\tmgz\napplication/vnd.publishare-delta-tree\t\tqps\napplication/vnd.pvi.ptid1\t\t\tptid\napplication/vnd.quark.quarkxpress\t\tqxd qxt qwd qwt qxl qxb\napplication/vnd.realvnc.bed\t\t\tbed\napplication/vnd.recordare.musicxml\t\tmxl\napplication/vnd.recordare.musicxml+xml\t\tmusicxml\napplication/vnd.rig.cryptonote\t\t\tcryptonote\napplication/vnd.rim.cod\t\t\t\tcod\napplication/vnd.rn-realmedia\t\t\trm\napplication/vnd.rn-realmedia-vbr\t\trmvb\napplication/vnd.route66.link66+xml\t\tlink66\napplication/vnd.sailingtracker.track\t\tst\napplication/vnd.seemail\t\t\t\tsee\napplication/vnd.sema\t\t\t\tsema\napplication/vnd.semd\t\t\t\tsemd\napplication/vnd.semf\t\t\t\tsemf\napplication/vnd.shana.informed.formdata\t\tifm\napplication/vnd.shana.informed.formtemplate\titp\napplication/vnd.shana.informed.interchange\tiif\napplication/vnd.shana.informed.package\t\tipk\napplication/vnd.simtech-mindmapper\t\ttwd twds\napplication/vnd.smaf\t\t\t\tmmf\napplication/vnd.smart.teacher\t\t\tteacher\napplication/vnd.solent.sdkm+xml\t\t\tsdkm sdkd\napplication/vnd.spotfire.dxp\t\t\tdxp\napplication/vnd.spotfire.sfs\t\t\tsfs\napplication/vnd.stardivision.calc\t\tsdc\napplication/vnd.stardivision.draw\t\tsda\napplication/vnd.stardivision.impress\t\tsdd\napplication/vnd.stardivision.math\t\tsmf\napplication/vnd.stardivision.writer\t\tsdw vor\napplication/vnd.stardivision.writer-global\tsgl\napplication/vnd.stepmania.package\t\tsmzip\napplication/vnd.stepmania.stepchart\t\tsm\napplication/vnd.sun.xml.calc\t\t\tsxc\napplication/vnd.sun.xml.calc.template\t\tstc\napplication/vnd.sun.xml.draw\t\t\tsxd\napplication/vnd.sun.xml.draw.template\t\tstd\napplication/vnd.sun.xml.impress\t\t\tsxi\napplication/vnd.sun.xml.impress.template\tsti\napplication/vnd.sun.xml.math\t\t\tsxm\napplication/vnd.sun.xml.writer\t\t\tsxw\napplication/vnd.sun.xml.writer.global\t\tsxg\napplication/vnd.sun.xml.writer.template\t\tstw\napplication/vnd.sus-calendar\t\t\tsus susp\napplication/vnd.svd\t\t\t\tsvd\napplication/vnd.symbian.install\t\t\tsis sisx\napplication/vnd.syncml+xml\t\t\txsm\napplication/vnd.syncml.dm+wbxml\t\t\tbdm\napplication/vnd.syncml.dm+xml\t\t\txdm\napplication/vnd.tao.intent-module-archive\ttao\napplication/vnd.tcpdump.pcap\t\t\tpcap cap dmp\napplication/vnd.tmobile-livetv\t\t\ttmo\napplication/vnd.trid.tpt\t\t\ttpt\napplication/vnd.triscape.mxs\t\t\tmxs\napplication/vnd.trueapp\t\t\t\ttra\napplication/vnd.ufdl\t\t\t\tufd ufdl\napplication/vnd.uiq.theme\t\t\tutz\napplication/vnd.umajin\t\t\t\tumj\napplication/vnd.unity\t\t\t\tunityweb\napplication/vnd.uoml+xml\t\t\tuoml\napplication/vnd.vcx\t\t\t\tvcx\napplication/vnd.visio\t\t\t\tvsd vst vss vsw\napplication/vnd.visionary\t\t\tvis\napplication/vnd.vsf\t\t\t\tvsf\napplication/vnd.wap.wbxml\t\t\twbxml\napplication/vnd.wap.wmlc\t\t\twmlc\napplication/vnd.wap.wmlscriptc\t\t\twmlsc\napplication/vnd.webturbo\t\t\twtb\napplication/vnd.wolfram.player\t\t\tnbp\napplication/vnd.wordperfect\t\t\twpd\napplication/vnd.wqd\t\t\t\twqd\napplication/vnd.wt.stf\t\t\t\tstf\napplication/vnd.xara\t\t\t\txar\napplication/vnd.xfdl\t\t\t\txfdl\napplication/vnd.yamaha.hv-dic\t\t\thvd\napplication/vnd.yamaha.hv-script\t\thvs\napplication/vnd.yamaha.hv-voice\t\t\thvp\napplication/vnd.yamaha.openscoreformat\t\t\tosf\napplication/vnd.yamaha.openscoreformat.osfpvg+xml\tosfpvg\napplication/vnd.yamaha.smaf-audio\t\tsaf\napplication/vnd.yamaha.smaf-phrase\t\tspf\napplication/vnd.yellowriver-custom-menu\t\tcmp\napplication/vnd.zul\t\t\t\tzir zirz\napplication/vnd.zzazz.deck+xml\t\t\tzaz\napplication/voicexml+xml\t\t\tvxml\napplication/wasm\t\t\t\twasm\napplication/widget\t\t\t\twgt\napplication/winhlp\t\t\t\thlp\napplication/wsdl+xml\t\t\t\twsdl\napplication/wspolicy+xml\t\t\twspolicy\napplication/x-7z-compressed\t\t\t7z\napplication/x-abiword\t\t\t\tabw\napplication/x-ace-compressed\t\t\tace\napplication/x-apple-diskimage\t\t\tdmg\napplication/x-authorware-bin\t\t\taab x32 u32 vox\napplication/x-authorware-map\t\t\taam\napplication/x-authorware-seg\t\t\taas\napplication/x-bcpio\t\t\t\tbcpio\napplication/x-bittorrent\t\t\ttorrent\napplication/x-blorb\t\t\t\tblb blorb\napplication/x-bzip\t\t\t\tbz\napplication/x-bzip2\t\t\t\tbz2 boz\napplication/x-cbr\t\t\t\tcbr cba cbt cbz cb7\napplication/x-cdlink\t\t\t\tvcd\napplication/x-cfs-compressed\t\t\tcfs\napplication/x-chat\t\t\t\tchat\napplication/x-chess-pgn\t\t\t\tpgn\napplication/x-conference\t\t\tnsc\napplication/x-cpio\t\t\t\tcpio\napplication/x-csh\t\t\t\tcsh\napplication/x-debian-package\t\t\tdeb udeb\napplication/x-dgc-compressed\t\t\tdgc\napplication/x-director\t\t\tdir dcr dxr cst cct cxt w3d fgd swa\napplication/x-doom\t\t\t\twad\napplication/x-dtbncx+xml\t\t\tncx\napplication/x-dtbook+xml\t\t\tdtb\napplication/x-dtbresource+xml\t\t\tres\napplication/x-dvi\t\t\t\tdvi\napplication/x-envoy\t\t\t\tevy\napplication/x-eva\t\t\t\teva\napplication/x-font-bdf\t\t\t\tbdf\napplication/x-font-ghostscript\t\t\tgsf\napplication/x-font-linux-psf\t\t\tpsf\napplication/x-font-pcf\t\t\t\tpcf\napplication/x-font-snf\t\t\t\tsnf\napplication/x-font-type1\t\t\tpfa pfb pfm afm\napplication/x-freearc\t\t\t\tarc\napplication/x-futuresplash\t\t\tspl\napplication/x-gca-compressed\t\t\tgca\napplication/x-glulx\t\t\t\tulx\napplication/x-gnumeric\t\t\t\tgnumeric\napplication/x-gramps-xml\t\t\tgramps\napplication/x-gtar\t\t\t\tgtar\napplication/x-hdf\t\t\t\thdf\napplication/x-install-instructions\t\tinstall\napplication/x-iso9660-image\t\t\tiso\napplication/x-java-jnlp-file\t\t\tjnlp\napplication/x-latex\t\t\t\tlatex\napplication/x-lzh-compressed\t\t\tlzh lha\napplication/x-mie\t\t\t\tmie\napplication/x-mobipocket-ebook\t\t\tprc mobi\napplication/x-ms-application\t\t\tapplication\napplication/x-ms-shortcut\t\t\tlnk\napplication/x-ms-wmd\t\t\t\twmd\napplication/x-ms-wmz\t\t\t\twmz\napplication/x-ms-xbap\t\t\t\txbap\napplication/x-msaccess\t\t\t\tmdb\napplication/x-msbinder\t\t\t\tobd\napplication/x-mscardfile\t\t\tcrd\napplication/x-msclip\t\t\t\tclp\napplication/x-msdownload\t\t\texe dll com bat msi\napplication/x-msmediaview\t\t\tmvb m13 m14\napplication/x-msmetafile\t\t\twmf wmz emf emz\napplication/x-msmoney\t\t\t\tmny\napplication/x-mspublisher\t\t\tpub\napplication/x-msschedule\t\t\tscd\napplication/x-msterminal\t\t\ttrm\napplication/x-mswrite\t\t\t\twri\napplication/x-netcdf\t\t\t\tnc cdf\napplication/x-nzb\t\t\t\tnzb\napplication/x-pkcs12\t\t\t\tp12 pfx\napplication/x-pkcs7-certificates\t\tp7b spc\napplication/x-pkcs7-certreqresp\t\t\tp7r\napplication/x-rar-compressed\t\t\trar\napplication/x-research-info-systems\t\tris\napplication/x-sh\t\t\t\tsh\napplication/x-shar\t\t\t\tshar\napplication/x-shockwave-flash\t\t\tswf\napplication/x-silverlight-app\t\t\txap\napplication/x-sql\t\t\t\tsql\napplication/x-stuffit\t\t\t\tsit\napplication/x-stuffitx\t\t\t\tsitx\napplication/x-subrip\t\t\t\tsrt\napplication/x-sv4cpio\t\t\t\tsv4cpio\napplication/x-sv4crc\t\t\t\tsv4crc\napplication/x-t3vm-image\t\t\tt3\napplication/x-tads\t\t\t\tgam\napplication/x-tar\t\t\t\ttar\napplication/x-tcl\t\t\t\ttcl\napplication/x-tex\t\t\t\ttex\napplication/x-tex-tfm\t\t\t\ttfm\napplication/x-texinfo\t\t\t\ttexinfo texi\napplication/x-tgif\t\t\t\tobj\napplication/x-ustar\t\t\t\tustar\napplication/x-wais-source\t\t\tsrc\napplication/x-x509-ca-cert\t\t\tder crt\napplication/x-xfig\t\t\t\tfig\napplication/x-xliff+xml\t\t\t\txlf\napplication/x-xpinstall\t\t\t\txpi\napplication/x-xz\t\t\t\txz\napplication/x-zmachine\t\t\t\tz1 z2 z3 z4 z5 z6 z7 z8\napplication/xaml+xml\t\t\t\txaml\napplication/xcap-diff+xml\t\t\txdf\napplication/xenc+xml\t\t\t\txenc\napplication/xhtml+xml\t\t\t\txhtml xht\napplication/xml\t\t\t\t\txml xsl\napplication/xml-dtd\t\t\t\tdtd\napplication/xop+xml\t\t\t\txop\napplication/xproc+xml\t\t\t\txpl\napplication/xslt+xml\t\t\t\txslt\napplication/xspf+xml\t\t\t\txspf\napplication/xv+xml\t\t\t\tmxml xhvml xvml xvm\napplication/yang\t\t\t\tyang\napplication/yin+xml\t\t\t\tyin\napplication/zip\t\t\t\t\tzip\naudio/adpcm\t\t\t\t\tadp\naudio/basic\t\t\t\t\tau snd\naudio/midi\t\t\t\t\tmid midi kar rmi\naudio/mp4\t\t\t\t\tm4a mp4a\naudio/mpeg\t\t\t\t\tmpga mp2 mp2a mp3 m2a m3a\naudio/ogg\t\t\t\t\toga ogg spx\naudio/s3m\t\t\t\t\ts3m\naudio/silk\t\t\t\t\tsil\naudio/vnd.dece.audio\t\t\t\tuva uvva\naudio/vnd.digital-winds\t\t\t\teol\naudio/vnd.dra\t\t\t\t\tdra\naudio/vnd.dts\t\t\t\t\tdts\naudio/vnd.dts.hd\t\t\t\tdtshd\naudio/vnd.lucent.voice\t\t\t\tlvp\naudio/vnd.ms-playready.media.pya\t\tpya\naudio/vnd.nuera.ecelp4800\t\t\tecelp4800\naudio/vnd.nuera.ecelp7470\t\t\tecelp7470\naudio/vnd.nuera.ecelp9600\t\t\tecelp9600\naudio/vnd.rip\t\t\t\t\trip\naudio/webm\t\t\t\t\tweba\naudio/x-aac\t\t\t\t\taac\naudio/x-aiff\t\t\t\t\taif aiff aifc\naudio/x-caf\t\t\t\t\tcaf\naudio/x-flac\t\t\t\t\tflac\naudio/x-matroska\t\t\t\tmka\naudio/x-mpegurl\t\t\t\t\tm3u\naudio/x-ms-wax\t\t\t\t\twax\naudio/x-ms-wma\t\t\t\t\twma\naudio/x-pn-realaudio\t\t\t\tram ra\naudio/x-pn-realaudio-plugin\t\t\trmp\naudio/x-wav\t\t\t\t\twav\naudio/xm\t\t\t\t\txm\nchemical/x-cdx\t\t\t\t\tcdx\nchemical/x-cif\t\t\t\t\tcif\nchemical/x-cmdf\t\t\t\t\tcmdf\nchemical/x-cml\t\t\t\t\tcml\nchemical/x-csml\t\t\t\t\tcsml\nchemical/x-xyz\t\t\t\t\txyz\nfont/collection\t\t\t\t\tttc\nfont/otf\t\t\t\t\totf\nfont/ttf\t\t\t\t\tttf\nfont/woff\t\t\t\t\twoff\nfont/woff2\t\t\t\t\twoff2\nimage/bmp\t\t\t\t\tbmp\nimage/cgm\t\t\t\t\tcgm\nimage/g3fax\t\t\t\t\tg3\nimage/gif\t\t\t\t\tgif\nimage/ief\t\t\t\t\tief\nimage/jpeg\t\t\t\t\tjpeg jpg jpe\nimage/ktx\t\t\t\t\tktx\nimage/png\t\t\t\t\tpng\nimage/prs.btif\t\t\t\t\tbtif\nimage/sgi\t\t\t\t\tsgi\nimage/svg+xml\t\t\t\t\tsvg svgz\nimage/tiff\t\t\t\t\ttiff tif\nimage/vnd.adobe.photoshop\t\t\tpsd\nimage/vnd.dece.graphic\t\t\t\tuvi uvvi uvg uvvg\nimage/vnd.djvu\t\t\t\t\tdjvu djv\nimage/vnd.dvb.subtitle\t\t\t\tsub\nimage/vnd.dwg\t\t\t\t\tdwg\nimage/vnd.dxf\t\t\t\t\tdxf\nimage/vnd.fastbidsheet\t\t\t\tfbs\nimage/vnd.fpx\t\t\t\t\tfpx\nimage/vnd.fst\t\t\t\t\tfst\nimage/vnd.fujixerox.edmics-mmr\t\t\tmmr\nimage/vnd.fujixerox.edmics-rlc\t\t\trlc\nimage/vnd.ms-modi\t\t\t\tmdi\nimage/vnd.ms-photo\t\t\t\twdp\nimage/vnd.net-fpx\t\t\t\tnpx\nimage/vnd.wap.wbmp\t\t\t\twbmp\nimage/vnd.xiff\t\t\t\t\txif\nimage/webp\t\t\t\t\twebp\nimage/x-3ds\t\t\t\t\t3ds\nimage/x-cmu-raster\t\t\t\tras\nimage/x-cmx\t\t\t\t\tcmx\nimage/x-freehand\t\t\t\tfh fhc fh4 fh5 fh7\nimage/x-icon\t\t\t\t\tico\nimage/x-mrsid-image\t\t\t\tsid\nimage/x-pcx\t\t\t\t\tpcx\nimage/x-pict\t\t\t\t\tpic pct\nimage/x-portable-anymap\t\t\t\tpnm\nimage/x-portable-bitmap\t\t\t\tpbm\nimage/x-portable-graymap\t\t\tpgm\nimage/x-portable-pixmap\t\t\t\tppm\nimage/x-rgb\t\t\t\t\trgb\nimage/x-tga\t\t\t\t\ttga\nimage/x-xbitmap\t\t\t\t\txbm\nimage/x-xpixmap\t\t\t\t\txpm\nimage/x-xwindowdump\t\t\t\txwd\nmessage/rfc822\t\t\t\t\teml mime\nmodel/iges\t\t\t\t\tigs iges\nmodel/mesh\t\t\t\t\tmsh mesh silo\nmodel/vnd.collada+xml\t\t\t\tdae\nmodel/vnd.dwf\t\t\t\t\tdwf\nmodel/vnd.gdl\t\t\t\t\tgdl\nmodel/vnd.gtw\t\t\t\t\tgtw\nmodel/vnd.mts\t\t\t\t\tmts\nmodel/vnd.vtu\t\t\t\t\tvtu\nmodel/vrml\t\t\t\t\twrl vrml\nmodel/x3d+binary\t\t\t\tx3db x3dbz\nmodel/x3d+vrml\t\t\t\t\tx3dv x3dvz\nmodel/x3d+xml\t\t\t\t\tx3d x3dz\ntext/cache-manifest\t\t\t\tappcache\ntext/calendar\t\t\t\t\tics ifb\ntext/css\t\t\t\t\tcss\ntext/csv\t\t\t\t\tcsv\ntext/html\t\t\t\t\thtml htm\ntext/n3\t\t\t\t\t\tn3\ntext/plain\t\t\t\t\ttxt text conf def list log in\ntext/prs.lines.tag\t\t\t\tdsc\ntext/richtext\t\t\t\t\trtx\ntext/sgml\t\t\t\t\tsgml sgm\ntext/tab-separated-values\t\t\ttsv\ntext/troff\t\t\t\t\tt tr roff man me ms\ntext/turtle\t\t\t\t\tttl\ntext/uri-list\t\t\t\t\turi uris urls\ntext/vcard\t\t\t\t\tvcard\ntext/vnd.curl\t\t\t\t\tcurl\ntext/vnd.curl.dcurl\t\t\t\tdcurl\ntext/vnd.curl.mcurl\t\t\t\tmcurl\ntext/vnd.curl.scurl\t\t\t\tscurl\ntext/vnd.dvb.subtitle\t\t\t\tsub\ntext/vnd.fly\t\t\t\t\tfly\ntext/vnd.fmi.flexstor\t\t\t\tflx\ntext/vnd.graphviz\t\t\t\tgv\ntext/vnd.in3d.3dml\t\t\t\t3dml\ntext/vnd.in3d.spot\t\t\t\tspot\ntext/vnd.sun.j2me.app-descriptor\t\tjad\ntext/vnd.wap.wml\t\t\t\twml\ntext/vnd.wap.wmlscript\t\t\t\twmls\ntext/x-asm\t\t\t\t\ts asm\ntext/x-c\t\t\t\t\tc cc cxx cpp h hh dic\ntext/x-fortran\t\t\t\t\tf for f77 f90\ntext/x-java-source\t\t\t\tjava\ntext/x-nfo\t\t\t\t\tnfo\ntext/x-opml\t\t\t\t\topml\ntext/x-pascal\t\t\t\t\tp pas\ntext/x-setext\t\t\t\t\tetx\ntext/x-sfv\t\t\t\t\tsfv\ntext/x-uuencode\t\t\t\t\tuu\ntext/x-vcalendar\t\t\t\tvcs\ntext/x-vcard\t\t\t\t\tvcf\nvideo/3gpp\t\t\t\t\t3gp\nvideo/3gpp2\t\t\t\t\t3g2\nvideo/h261\t\t\t\t\th261\nvideo/h263\t\t\t\t\th263\nvideo/h264\t\t\t\t\th264\nvideo/jpeg\t\t\t\t\tjpgv\nvideo/jpm\t\t\t\t\tjpm jpgm\nvideo/mj2\t\t\t\t\tmj2 mjp2\nvideo/mp4\t\t\t\t\tmp4 mp4v mpg4\nvideo/mpeg\t\t\t\t\tmpeg mpg mpe m1v m2v\nvideo/ogg\t\t\t\t\togv\nvideo/quicktime\t\t\t\t\tqt mov\nvideo/vnd.dece.hd\t\t\t\tuvh uvvh\nvideo/vnd.dece.mobile\t\t\t\tuvm uvvm\nvideo/vnd.dece.pd\t\t\t\tuvp uvvp\nvideo/vnd.dece.sd\t\t\t\tuvs uvvs\nvideo/vnd.dece.video\t\t\t\tuvv uvvv\nvideo/vnd.dvb.file\t\t\t\tdvb\nvideo/vnd.fvt\t\t\t\t\tfvt\nvideo/vnd.mpegurl\t\t\t\tmxu m4u\nvideo/vnd.ms-playready.media.pyv\t\tpyv\nvideo/vnd.uvvu.mp4\t\t\t\tuvu uvvu\nvideo/vnd.vivo\t\t\t\t\tviv\nvideo/webm\t\t\t\t\twebm\nvideo/x-f4v\t\t\t\t\tf4v\nvideo/x-fli\t\t\t\t\tfli\nvideo/x-flv\t\t\t\t\tflv\nvideo/x-m4v\t\t\t\t\tm4v\nvideo/x-matroska\t\t\t\tmkv mk3d mks\nvideo/x-mng\t\t\t\t\tmng\nvideo/x-ms-asf\t\t\t\t\tasf asx\nvideo/x-ms-vob\t\t\t\t\tvob\nvideo/x-ms-wm\t\t\t\t\twm\nvideo/x-ms-wmv\t\t\t\t\twmv\nvideo/x-ms-wmx\t\t\t\t\twmx\nvideo/x-ms-wvx\t\t\t\t\twvx\nvideo/x-msvideo\t\t\t\t\tavi\nvideo/x-sgi-movie\t\t\t\tmovie\nvideo/x-smv\t\t\t\t\tsmv\nx-conference/x-cooltalk\t\t\t\tice\n";

const map = new Map();

mime_raw.split('\n').forEach((row) => {
	const match = /(.+?)\t+(.+)/.exec(row);
	if (!match) return;

	const type = match[1];
	const extensions = match[2].split(' ');

	extensions.forEach(ext => {
		map.set(ext, type);
	});
});

function lookup(file) {
	const match = /\.([^\.]+)$/.exec(file);
	return match && map.get(match[1]);
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

	const read =  (file) => (cache.has(file) ? cache : cache.set(file, fs.readFileSync(path.resolve(build_dir, file)))).get(file);

	return (req, res, next) => {
		if (filter(req)) {
			const type = lookup(req.path);

			try {
				const file = decodeURIComponent(req.path.slice(1));
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
		middleware()
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});
