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

const contextMapbox = {};

/* src/layouts/Map/Map.svelte generated by Svelte v3.18.1 */

const css = {
	code: "section.svelte-i65r7p{flex-grow:1;align-self:stretch}",
	map: "{\"version\":3,\"file\":\"Map.svelte\",\"sources\":[\"Map.svelte\"],\"sourcesContent\":[\"<style>\\n    section {\\n        flex-grow: 1;\\n        align-self: stretch;\\n    }\\n</style>\\n\\n<script>\\n    import { onMount, onDestroy, setContext, createEventDispatcher } from 'svelte'\\n    import { contextMapbox } from './context'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let center = [31.1656, 48.3794]\\n    export let zoom = 3.75\\n\\n    let map\\n    let container\\n\\n    setContext(contextMapbox, {\\n        getMap: () => map,\\n        getMapbox: () => window.mapboxgl\\n    })\\n\\n    function onCreateMap() {\\n        map = new mapboxgl.Map({\\n            zoom,\\n            center,\\n            container,\\n            style: 'mapbox://styles/mapbox/streets-v11',\\n        })\\n\\n        map.on('dragend', () => dispatch('recentre', { map, center: map.getCenter() }))\\n        map.on('load', () => dispatch('ready', map))\\n    }\\n\\n    function createMap() {\\n        const scriptTag = document.createElement('script')\\n        scriptTag.type = 'text/javascript'\\n        scriptTag.src = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.js'\\n\\n        const link = document.createElement('link')\\n        link.rel = 'stylesheet'\\n        link.href = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.css'\\n\\n        scriptTag.onload = () => {\\n            const token = 'pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw'\\n            mapboxgl.accessToken = token\\n\\n            link.onload = onCreateMap\\n\\n            document.head.appendChild(link)\\n        }\\n\\n        document.body.appendChild(scriptTag)\\n    }\\n\\n    onMount(() => {\\n        if ('mapboxgl' in window) {\\n            onCreateMap()\\n        } else {\\n            createMap()\\n        }\\n    })\\n\\n    onDestroy(() => {\\n        map && map.remove()\\n    })\\n</script>\\n\\n<section bind:this={container}>\\n    {#if map}\\n        <slot></slot>\\n    {/if}\\n</section>\\n\"],\"names\":[],\"mappings\":\"AACI,OAAO,cAAC,CAAC,AACL,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,AACvB,CAAC\"}"
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
	$$result.css.add(css);

	return `<section class="${"svelte-i65r7p"}"${add_attribute("this", container, 1)}>
    ${map
	? `${$$slots.default ? $$slots.default({}) : ``}`
	: ``}
</section>`;
});

/* src/layouts/Map/MapMarker.svelte generated by Svelte v3.18.1 */

const MapMarker = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const { getMap, getMapbox } = getContext(contextMapbox);
	const map = getMap();
	const mapbox = getMapbox();
	let { lng } = $$props;
	let { lat } = $$props;
	let { label = "label" } = $$props;
	const popup = new mapbox.Popup({ offset: 25 }).setText(label);
	const marker = new mapbox.Marker().setLngLat([lng, lat]).setPopup(popup).addTo(map);
	if ($$props.lng === void 0 && $$bindings.lng && lng !== void 0) $$bindings.lng(lng);
	if ($$props.lat === void 0 && $$bindings.lat && lat !== void 0) $$bindings.lat(lat);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	return ``;
});

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

const css$1 = {
	code: "svg.svelte-1y5h9x9.svelte-1y5h9x9{display:inherit}svg.svelte-1y5h9x9.svelte-1y5h9x9,svg.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgba(var(--theme-svg-fill));stroke:rgba(var(--theme-svg-fill))}.small.svelte-1y5h9x9.svelte-1y5h9x9{width:15px;height:15px}.medium.svelte-1y5h9x9.svelte-1y5h9x9{width:22px;height:22px}.big.svelte-1y5h9x9.svelte-1y5h9x9{width:35px;height:35px}.primary.svelte-1y5h9x9.svelte-1y5h9x9,.primary.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgb(var(--color-success));stroke:rgb(var(--color-success))}.warning.svelte-1y5h9x9.svelte-1y5h9x9,.warning.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgb(var(--color-warning));stroke:rgb(var(--color-warning))}.danger.svelte-1y5h9x9.svelte-1y5h9x9,.danger.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgb(var(--color-danger));stroke:rgb(var(--color-danger))}.info.svelte-1y5h9x9.svelte-1y5h9x9,.info.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgb(var(--color-info));stroke:rgb(var(--color-info))}.light.svelte-1y5h9x9.svelte-1y5h9x9,.light.svelte-1y5h9x9 .svelte-1y5h9x9{fill:var(--color-light-1);stroke:var(--color-light-1)}.dark.svelte-1y5h9x9.svelte-1y5h9x9,.dark.svelte-1y5h9x9 .svelte-1y5h9x9{fill:var(--color-dark-1);stroke:var(--color-dark-1)}",
	map: "{\"version\":3,\"file\":\"Icon.svelte\",\"sources\":[\"Icon.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames, toCSSString } from '../utils'\\n\\n    export let type\\n    export let is // primary|warning|danger|light|dark\\n    export let size = 'medium' // small|medium|big\\n    export let rotate = 0\\n    export let style = undefined\\n    export let id = undefined\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n    let styleProp = toCSSString({ transform: !!rotate ? `rotateZ(${rotate}deg)` : null, ...style })\\n\\n    $:  classProp = classnames('ico', is, size, $$props.class)\\n</script>\\n\\n<svg\\n        {id}\\n        title={titleProp}\\n        class={classProp}\\n        style={styleProp}\\n        aria-label={ariaLabelProp}\\n>\\n    <use xlink:href={`#ico-${type}`} class=\\\"ico-use\\\"/>\\n</svg>\\n\\n<style>\\n    svg {\\n        display: inherit;\\n    }\\n\\n    svg, svg * {\\n        fill: rgba(var(--theme-svg-fill));\\n        stroke: rgba(var(--theme-svg-fill));\\n    }\\n\\n    /* ------------=========( Size )=========------------ */\\n    .small {\\n        width: 15px;\\n        height: 15px;\\n    }\\n\\n    .medium {\\n        width: 22px;\\n        height: 22px;\\n    }\\n\\n    .big {\\n        width: 35px;\\n        height: 35px;\\n    }\\n\\n    /* ------------=========( Color )=========------------ */\\n    .primary, .primary * {\\n        fill: rgb(var(--color-success));\\n        stroke: rgb(var(--color-success));\\n    }\\n\\n    .warning, .warning * {\\n        fill: rgb(var(--color-warning));\\n        stroke: rgb(var(--color-warning));\\n    }\\n\\n    .danger, .danger * {\\n        fill: rgb(var(--color-danger));\\n        stroke: rgb(var(--color-danger));\\n    }\\n\\n    .info, .info * {\\n        fill: rgb(var(--color-info));\\n        stroke: rgb(var(--color-info));\\n    }\\n\\n    .light, .light * {\\n        fill: var(--color-light-1);\\n        stroke: var(--color-light-1);\\n    }\\n\\n    .dark, .dark * {\\n        fill: var(--color-dark-1);\\n        stroke: var(--color-dark-1);\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA8BI,GAAG,8BAAC,CAAC,AACD,OAAO,CAAE,OAAO,AACpB,CAAC,AAED,iCAAG,CAAE,kBAAG,CAAC,eAAE,CAAC,AACR,IAAI,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CACjC,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACvC,CAAC,AAGD,MAAM,8BAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,OAAO,8BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,IAAI,8BAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAGD,sCAAQ,CAAE,uBAAQ,CAAC,eAAE,CAAC,AAClB,IAAI,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,CAC/B,MAAM,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AACrC,CAAC,AAED,sCAAQ,CAAE,uBAAQ,CAAC,eAAE,CAAC,AAClB,IAAI,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,CAC/B,MAAM,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AACrC,CAAC,AAED,qCAAO,CAAE,sBAAO,CAAC,eAAE,CAAC,AAChB,IAAI,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAC9B,MAAM,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AACpC,CAAC,AAED,mCAAK,CAAE,oBAAK,CAAC,eAAE,CAAC,AACZ,IAAI,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CAC5B,MAAM,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AAClC,CAAC,AAED,oCAAM,CAAE,qBAAM,CAAC,eAAE,CAAC,AACd,IAAI,CAAE,IAAI,eAAe,CAAC,CAC1B,MAAM,CAAE,IAAI,eAAe,CAAC,AAChC,CAAC,AAED,mCAAK,CAAE,oBAAK,CAAC,eAAE,CAAC,AACZ,IAAI,CAAE,IAAI,cAAc,CAAC,CACzB,MAAM,CAAE,IAAI,cAAc,CAAC,AAC/B,CAAC\"}"
};

const Icon = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { type } = $$props;
	let { is } = $$props; // primary|warning|danger|light|dark
	let { size = "medium" } = $$props; // small|medium|big
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
	$$result.css.add(css$1);
	let classProp = classnames("ico", is, size, $$props.class);

	return `<svg${add_attribute("id", id, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1y5h9x9"}"${add_attribute("style", styleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)}>
    <use${add_attribute("xlink:href", `#ico-${type}`, 0)} class="${"ico-use svelte-1y5h9x9"}"></use>
</svg>`;
});

/* src/components/Rate.svelte generated by Svelte v3.18.1 */

const css$2 = {
	code: ".rate.svelte-9gtglw.svelte-9gtglw{display:inline-flex;margin:calc(var(--screen-padding) * -1 / 3)}li.svelte-9gtglw.svelte-9gtglw{padding:calc(var(--screen-padding) / 3)}.rate.svelte-9gtglw li.svelte-9gtglw{-webkit-filter:drop-shadow(-1px 2px 1px rgba(var(--color-black), .25));filter:drop-shadow(-1px 2px 1px rgba(var(--color-black), .25))}",
	map: "{\"version\":3,\"file\":\"Rate.svelte\",\"sources\":[\"Rate.svelte\"],\"sourcesContent\":[\"<script>\\n    import Icon from '../components/Icon.svelte'\\n\\n    export let is = 'danger'\\n    export let size = 'medium' // small|medium|mig\\n</script>\\n\\n<ul class=\\\"rate\\\">\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n</ul>\\n\\n<style>\\n    .rate {\\n        display: inline-flex;\\n        margin: calc(var(--screen-padding) * -1 / 3);\\n    }\\n\\n    li {\\n        padding: calc(var(--screen-padding) / 3);\\n    }\\n\\n    .rate li {\\n        -webkit-filter: drop-shadow(-1px 2px 1px rgba(var(--color-black), .25));\\n        filter: drop-shadow(-1px 2px 1px rgba(var(--color-black), .25));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA0BI,KAAK,4BAAC,CAAC,AACH,OAAO,CAAE,WAAW,CACpB,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,AAChD,CAAC,AAED,EAAE,4BAAC,CAAC,AACA,OAAO,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC5C,CAAC,AAED,mBAAK,CAAC,EAAE,cAAC,CAAC,AACN,cAAc,CAAE,YAAY,IAAI,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CACvE,MAAM,CAAE,YAAY,IAAI,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,AACnE,CAAC\"}"
};

const Rate = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { is = "danger" } = $$props;
	let { size = "medium" } = $$props; // small|medium|mig
	if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	$$result.css.add(css$2);

	return `<ul class="${"rate svelte-9gtglw"}">
    <li class="${"svelte-9gtglw"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-9gtglw"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-9gtglw"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-9gtglw"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-9gtglw"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
</ul>`;
});

/* src/components/Input.svelte generated by Svelte v3.18.1 */

const css$3 = {
	code: ".inp.svelte-1vg8tdg{width:100%;flex:1 1 0;color:inherit;border-radius:var(--border-radius);min-width:var(--min-interactive-size);min-height:var(--min-interactive-size);border:1px solid rgba(var(--color-black), .25);background-color:rgba(var(--theme-bg-color));box-shadow:inset var(--shadow-primary), var(--shadow-secondary-inset)}.inp.svelte-1vg8tdg:focus{border-color:rgb(var(--color-success))}.inp.svelte-1vg8tdg:invalid,.inp.invalid.svelte-1vg8tdg{border-color:rgb(var(--color-danger))}",
	map: "{\"version\":3,\"file\":\"Input.svelte\",\"sources\":[\"Input.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let name\\n    export let value = ''\\n    export let style = {}\\n    export let type = 'text'\\n    export let id = undefined\\n    export let align = undefined\\n    export let maxlength = 1000\\n    export let rows = undefined\\n    export let disabled = false\\n    export let title = undefined\\n    export let invalid = undefined\\n    export let min = undefined // Specifies a minimum value for an <input> element\\n    export let max = undefined // Specifies the maximum value for an <input> element\\n    export let list = undefined // Refers to a <datalist> element that contains pre-defined options for an <input> element\\n    export let form = undefined // Specifies the form the <input> element belongs to\\n    export let readonly = undefined // undefined|readonly\\n    export let required = undefined // undefined|required\\n    export let pattern = undefined // Specifies a regular expression that an <input> element's value is checked against (regexp)\\n    export let autocomplete = true // on|off\\n    export let autoselect = false\\n    export let ariaLabel = undefined\\n    export let placeholder = undefined\\n\\n    let idProp = id || name\\n    let typeProp = type === 'number' ? 'text' : type\\n    let titleProp = title || ariaLabel || placeholder\\n    let ariaLabelProp = ariaLabel || title || placeholder\\n    let autocompleteProp = autocomplete ? 'on' : 'off'\\n    let styleProp = toCSSString({ ...style, textAlign: align })\\n    let patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern\\n\\n    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, invalid })\\n\\n    /**\\n     *\\n     * @description Emit click and select content when \\\"autoselect\\\" is enabled.\\n     *\\n     * @param {MouseEvent} e - Native mouse event.\\n     */\\n    function onClick(e) {\\n        !disabled && dispatch(\\\"click\\\", e)\\n        !disabled && autoselect && e.target.select()\\n    }\\n</script>\\n\\n{#if rows}\\n    <textarea\\n            {min}\\n            {max}\\n            {rows}\\n            {name}\\n            {form}\\n            {align}\\n            {readonly}\\n            {disabled}\\n            {required}\\n            {maxlength}\\n            {placeholder}\\n            id={idProp}\\n            class={classProp}\\n            title={titleProp}\\n            style={styleProp}\\n            pattern={patternProp}\\n            aria-label={ariaLabelProp}\\n            autocomplete={autocompleteProp}\\n            {...{ type: typeProp }}\\n            bind:value\\n            on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n            on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            on:click='{onClick}'\\n    ></textarea>\\n{:else}\\n    <input\\n            {min}\\n            {max}\\n            {name}\\n            {list}\\n            {form}\\n            {align}\\n            {readonly}\\n            {disabled}\\n            {required}\\n            {maxlength}\\n            {placeholder}\\n            id={idProp}\\n            class={classProp}\\n            title={titleProp}\\n            style={styleProp}\\n            pattern={patternProp}\\n            aria-label={ariaLabelProp}\\n            autocomplete={autocompleteProp}\\n            {...{ type: typeProp }}\\n            bind:value\\n            on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n            on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            on:click='{onClick}'\\n    />\\n{/if}\\n\\n<style>\\n    .inp {\\n        width: 100%;\\n        flex: 1 1 0;\\n        color: inherit;\\n        border-radius: var(--border-radius);\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n        border: 1px solid rgba(var(--color-black), .25);\\n        background-color: rgba(var(--theme-bg-color));\\n        box-shadow: inset var(--shadow-primary), var(--shadow-secondary-inset);\\n    }\\n\\n    .inp:focus {\\n        border-color: rgb(var(--color-success));\\n    }\\n\\n    .inp:invalid, .inp.invalid {\\n        border-color: rgb(var(--color-danger));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA0GI,IAAI,eAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACX,KAAK,CAAE,OAAO,CACd,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,CACvC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAC/C,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAC7C,UAAU,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,IAAI,wBAAwB,CAAC,AAC1E,CAAC,AAED,mBAAI,MAAM,AAAC,CAAC,AACR,YAAY,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC3C,CAAC,AAED,mBAAI,QAAQ,CAAE,IAAI,QAAQ,eAAC,CAAC,AACxB,YAAY,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AAC1C,CAAC\"}"
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
	$$result.css.add(css$3);
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
			"svelte-1vg8tdg"
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
			"svelte-1vg8tdg"
		)}${add_attribute("value", value, 1)}>`}`;
});

/* src/components/Picture.svelte generated by Svelte v3.18.1 */

const css$4 = {
	code: ".picture.svelte-1h9qfqe.svelte-1h9qfqe{position:relative;flex-grow:1;align-self:stretch;display:inline-flex;flex-direction:column;align-items:stretch;justify-content:stretch}.picture.svelte-1h9qfqe .pic.svelte-1h9qfqe{flex-grow:1;align-self:stretch;object-fit:cover;object-position:center;transition:opacity .3s ease-in}.picture.svelte-1h9qfqe .pic-2x.svelte-1h9qfqe{position:absolute;top:0;left:0;width:100%;height:100%}.picture.loadingSrc.svelte-1h9qfqe .pic-1x.svelte-1h9qfqe,.picture.loadingSrcBig.svelte-1h9qfqe .pic-2x.svelte-1h9qfqe{opacity:0}",
	map: "{\"version\":3,\"file\":\"Picture.svelte\",\"sources\":[\"Picture.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let src\\n    export let alt\\n    export let srcBig = undefined\\n    export let id = undefined\\n    export let width = undefined\\n    export let height = undefined\\n\\n    let loadingSrc = true\\n    let loadingSrcBig = true\\n    let isError = false\\n\\n    $: wrapClassProp = classnames('picture', $$props.class, { loadingSrc, loadingSrcBig, isError })\\n\\n    function onLoadSrc(e) {\\n        loadingSrc = false\\n        dispatch('load', e)\\n    }\\n\\n    function onErrorSrc(e) {\\n        loadingSrc = false\\n        isError = true\\n        dispatch('error', e)\\n    }\\n\\n    function onLoadSrcBig(e) {\\n        loadingSrcBig = false\\n        dispatch('loadBig', e)\\n    }\\n\\n    function onErrorSrcBig(e) {\\n        loadingSrcBig = false\\n        isError = true\\n        dispatch('errorBig', e)\\n    }\\n</script>\\n\\n<figure class={wrapClassProp}>\\n    <img\\n            {id}\\n            {alt}\\n            {src}\\n            {width}\\n            {height}\\n            class=\\\"pic pic-1x\\\"\\n            on:load={onLoadSrc}\\n            on:error={onErrorSrc}\\n    />\\n    {#if srcBig && !loadingSrc}\\n        <img\\n                {alt}\\n                {width}\\n                {height}\\n                src={srcBig}\\n                class=\\\"pic pic-2x\\\"\\n                on:load={onLoadSrcBig}\\n                on:error={onErrorSrcBig}\\n        />\\n    {/if}\\n    <figcaption>\\n        <slot></slot>\\n    </figcaption>\\n</figure>\\n\\n<style>\\n    .picture {\\n        position: relative;\\n        flex-grow: 1;\\n        align-self: stretch;\\n        display: inline-flex;\\n        flex-direction: column;\\n        align-items: stretch;\\n        justify-content: stretch;\\n    }\\n\\n    .picture .pic {\\n        flex-grow: 1;\\n        align-self: stretch;\\n        object-fit: cover;\\n        object-position: center;\\n        transition: opacity .3s ease-in;\\n    }\\n\\n    .picture .pic-2x {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n    }\\n\\n    .picture.loadingSrc .pic-1x,\\n    .picture.loadingSrcBig .pic-2x {\\n        opacity: 0;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAsEI,QAAQ,8BAAC,CAAC,AACN,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,OAAO,CAAE,WAAW,CACpB,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,AAC5B,CAAC,AAED,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACX,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,KAAK,CACjB,eAAe,CAAE,MAAM,CACvB,UAAU,CAAE,OAAO,CAAC,GAAG,CAAC,OAAO,AACnC,CAAC,AAED,uBAAQ,CAAC,OAAO,eAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,QAAQ,0BAAW,CAAC,sBAAO,CAC3B,QAAQ,6BAAc,CAAC,OAAO,eAAC,CAAC,AAC5B,OAAO,CAAE,CAAC,AACd,CAAC\"}"
};

const Picture = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { src } = $$props;
	let { alt } = $$props;
	let { srcBig = undefined } = $$props;
	let { id = undefined } = $$props;
	let { width = undefined } = $$props;
	let { height = undefined } = $$props;
	let loadingSrc = true;
	let loadingSrcBig = true;
	let isError = false;

	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.srcBig === void 0 && $$bindings.srcBig && srcBig !== void 0) $$bindings.srcBig(srcBig);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
	$$result.css.add(css$4);
	let wrapClassProp = classnames("picture", $$props.class, { loadingSrc, loadingSrcBig, isError });

	return `<figure class="${escape(null_to_empty(wrapClassProp)) + " svelte-1h9qfqe"}">
    <img${add_attribute("id", id, 0)}${add_attribute("alt", alt, 0)}${add_attribute("src", src, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} class="${"pic pic-1x svelte-1h9qfqe"}">
    ${srcBig && !loadingSrc
	? `<img${add_attribute("alt", alt, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("src", srcBig, 0)} class="${"pic pic-2x svelte-1h9qfqe"}">`
	: ``}
    <figcaption>
        ${$$slots.default ? $$slots.default({}) : ``}
    </figcaption>
</figure>`;
});

/* src/components/Avatar.svelte generated by Svelte v3.18.1 */

const css$5 = {
	code: ".ava.svelte-ow3g6r{flex:none;display:flex;border-radius:50%;overflow:hidden;box-shadow:var(--shadow-primary)}.small.svelte-ow3g6r{width:25px;height:25px}.medium.svelte-ow3g6r{width:35px;height:35px}.big.svelte-ow3g6r{width:45px;height:45px}",
	map: "{\"version\":3,\"file\":\"Avatar.svelte\",\"sources\":[\"Avatar.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '../utils'\\n    import Picture from './Picture.svelte'\\n\\n    export let src\\n    export let alt\\n    export let size = 'medium' // small|medium|big\\n\\n    $: classProp = classnames('ava', size, $$props.class)\\n</script>\\n\\n<div class={classProp}>\\n    <Picture {src} alt={`Picture: ${alt}`}/>\\n</div>\\n\\n<style>\\n    .ava {\\n        flex: none;\\n        display: flex;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    .small {\\n        width: 25px;\\n        height: 25px;\\n    }\\n    .medium {\\n        width: 35px;\\n        height: 35px;\\n    }\\n    .big {\\n        width: 45px;\\n        height: 45px;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAgBI,IAAI,cAAC,CAAC,AACF,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,MAAM,cAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,OAAO,cAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,IAAI,cAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC\"}"
};

const Avatar = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	let { alt } = $$props;
	let { size = "medium" } = $$props; // small|medium|big
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	$$result.css.add(css$5);
	let classProp = classnames("ava", size, $$props.class);

	return `<div class="${escape(null_to_empty(classProp)) + " svelte-ow3g6r"}">
    ${validate_component(Picture, "Picture").$$render($$result, { src, alt: `Picture: ${alt}` }, {}, {})}
</div>`;
});

/* src/components/Button.svelte generated by Svelte v3.18.1 */

const css$6 = {
	code: ".btn.svelte-jhaexl:not(.auto){width:100%}.btn{flex:none;cursor:pointer;max-width:100%;user-select:none;padding:5px 15px;margin-bottom:3px;font-weight:bold;text-align:center;align-items:center;display:inline-flex;justify-content:center;border-radius:var(--border-radius);color:rgba(var(--theme-font-color));text-shadow:1px 1px rgba(var(--color-black), .3)}.btn.small{padding:5px;min-width:calc(var(--min-interactive-size) / 1.5);min-height:calc(var(--min-interactive-size) / 1.5)}.btn.medium{padding:5px 10px;min-width:var(--min-interactive-size);min-height:var(--min-interactive-size)}.btn.big{padding:5px 15px;min-width:calc(var(--min-interactive-size) * 1.5);min-height:calc(var(--min-interactive-size) * 1.5)}.btn:focus{background-color:rgba(var(--color-black), 0.1)}.btn:hover{box-shadow:0 2px rgba(var(--color-black), 0.2);background-color:rgba(var(--color-black), 0.1)}.btn:active{transform:translateY(1px);box-shadow:0 1px rgba(var(--color-black), 0.2);background-color:rgba(var(--color-black), 0.1)}.btn.success.svelte-jhaexl{color:rgba(var(--color-font-light));background-color:rgba(var(--color-success));box-shadow:0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.success.svelte-jhaexl:focus{background-color:rgba(var(--color-success), .85)}.btn.success.svelte-jhaexl:hover{transform:translateY(1px);box-shadow:0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.success.svelte-jhaexl:active{transform:translateY(2px);box-shadow:0 1px rgba(var(--color-success-dark)), var(--shadow-secondary)}.btn.warning.svelte-jhaexl{color:rgba(var(--color-font-light));background-color:rgba(var(--color-warning));box-shadow:0 2px rgba(var(--color-warning-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.warning.svelte-jhaexl:focus{background-color:rgba(var(--color-warning), .85)}.btn.warning.svelte-jhaexl:hover{transform:translateY(1px);box-shadow:0 2px rgba(var(--color-warning-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.warning.svelte-jhaexl:active{transform:translateY(2px);box-shadow:0 1px rgba(var(--color-warning-dark)), var(--shadow-secondary)}.btn.danger.svelte-jhaexl{color:rgba(var(--color-font-light));background-color:rgba(var(--color-danger));box-shadow:0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.danger.svelte-jhaexl:focus{background-color:rgba(var(--color-danger), .85)}.btn.danger.svelte-jhaexl:hover{transform:translateY(1px);box-shadow:0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.danger.svelte-jhaexl:active{transform:translateY(2px);box-shadow:0 1px rgba(var(--color-danger-dark)), var(--shadow-secondary)}@media screen and (min-width: 769px){.btn{margin-bottom:2px}.btn.success.svelte-jhaexl{box-shadow:0 3px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.warning.svelte-jhaexl{box-shadow:0 3px rgba(var(--color-warning-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.danger.svelte-jhaexl{box-shadow:0 3px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary)}}",
	map: "{\"version\":3,\"file\":\"Button.svelte\",\"sources\":[\"Button.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, onMount } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let is = undefined\\n    export let id = undefined\\n    export let href = undefined\\n    export let auto = false\\n    export let type = 'button'\\n    export let size = 'medium'\\n    export let title = undefined\\n    export let htmlFor = undefined\\n    export let disabled = false\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n\\n    $: classProp = classnames('btn', is, size, $$props.class, { auto, disabled })\\n\\n    function onLabelClick(e) {\\n        document.getElementById(htmlFor).click()\\n        !disabled && dispatch('click', e)\\n    }\\n\\n    function onClick(e) {\\n        !disabled && dispatch('click', e)\\n    }\\n</script>\\n\\n{#if href}\\n    <a\\n            {id}\\n            {href}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </a>\\n{:else if htmlFor}\\n    <label\\n            {id}\\n            {disabled}\\n            for={htmlFor}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onLabelClick}\\n    >\\n        <slot></slot>\\n    </label>\\n{:else}\\n    <button\\n            {id}\\n            {type}\\n            {disabled}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </button>\\n{/if}\\n\\n<style>\\n    .btn:not(.auto) {\\n        width: 100%;\\n    }\\n\\n    :global(.btn) {\\n        flex: none;\\n        cursor: pointer;\\n        max-width: 100%;\\n        user-select: none;\\n        padding: 5px 15px;\\n        margin-bottom: 3px;\\n        font-weight: bold;\\n        text-align: center;\\n        align-items: center;\\n        display: inline-flex;\\n        justify-content: center;\\n        border-radius: var(--border-radius);\\n        color: rgba(var(--theme-font-color));\\n        text-shadow: 1px 1px rgba(var(--color-black), .3);\\n    }\\n\\n    :global(.btn.small) {\\n        padding: 5px;\\n        min-width: calc(var(--min-interactive-size) / 1.5);\\n        min-height: calc(var(--min-interactive-size) / 1.5);\\n    }\\n\\n    :global(.btn.medium) {\\n        padding: 5px 10px;\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n    }\\n\\n    :global(.btn.big) {\\n        padding: 5px 15px;\\n        min-width: calc(var(--min-interactive-size) * 1.5);\\n        min-height: calc(var(--min-interactive-size) * 1.5);\\n    }\\n\\n    :global(.btn:focus) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:hover) {\\n        box-shadow: 0 2px rgba(var(--color-black), 0.2);\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:active) {\\n        transform: translateY(1px);\\n        box-shadow: 0 1px rgba(var(--color-black), 0.2);\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    /* Success */\\n\\n    .btn.success {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-success));\\n        box-shadow: 0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    .btn.success:focus {\\n        background-color: rgba(var(--color-success), .85);\\n    }\\n\\n    .btn.success:hover {\\n        transform: translateY(1px);\\n        box-shadow: 0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    .btn.success:active {\\n        transform: translateY(2px);\\n        box-shadow: 0 1px rgba(var(--color-success-dark)), var(--shadow-secondary);\\n    }\\n\\n    /* Warning */\\n\\n    .btn.warning {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-warning));\\n        box-shadow: 0 2px rgba(var(--color-warning-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    .btn.warning:focus {\\n        background-color: rgba(var(--color-warning), .85);\\n    }\\n\\n    .btn.warning:hover {\\n        transform: translateY(1px);\\n        box-shadow: 0 2px rgba(var(--color-warning-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    .btn.warning:active {\\n        transform: translateY(2px);\\n        box-shadow: 0 1px rgba(var(--color-warning-dark)), var(--shadow-secondary);\\n    }\\n\\n    /* Danger */\\n\\n    .btn.danger {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-danger));\\n        box-shadow: 0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    .btn.danger:focus {\\n        background-color: rgba(var(--color-danger), .85);\\n    }\\n\\n    .btn.danger:hover {\\n        transform: translateY(1px);\\n        box-shadow: 0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    .btn.danger:active {\\n        transform: translateY(2px);\\n        box-shadow: 0 1px rgba(var(--color-danger-dark)), var(--shadow-secondary);\\n    }\\n\\n\\n    @media screen and (min-width: 769px) {\\n        :global(.btn) {\\n            margin-bottom: 2px;\\n        }\\n\\n        .btn.success {\\n            box-shadow: 0 3px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary);\\n        }\\n\\n        .btn.warning {\\n            box-shadow: 0 3px rgba(var(--color-warning-dark)), var(--shadow-secondary), var(--shadow-primary);\\n        }\\n\\n        .btn.danger {\\n            box-shadow: 0 3px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary);\\n        }\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"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\"}"
};

const Button = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { is = undefined } = $$props;
	let { id = undefined } = $$props;
	let { href = undefined } = $$props;
	let { auto = false } = $$props;
	let { type = "button" } = $$props;
	let { size = "medium" } = $$props;
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
	$$result.css.add(css$6);
	let classProp = classnames("btn", is, size, $$props.class, { auto, disabled });

	return `${href
	? `<a${add_attribute("id", id, 0)}${add_attribute("href", href, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-jhaexl"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </a>`
	: `${htmlFor
		? `<label${add_attribute("id", id, 0)} ${disabled ? "disabled" : ""}${add_attribute("for", htmlFor, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-jhaexl"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </label>`
		: `<button${add_attribute("id", id, 0)}${add_attribute("type", type, 0)} ${disabled ? "disabled" : ""}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-jhaexl"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </button>`}`}`;
});

/* src/components/Divider.svelte generated by Svelte v3.18.1 */

const css$7 = {
	code: ".divider.svelte-10708ut{margin:0;border:none;box-sizing:content-box;background-clip:content-box}.info.svelte-10708ut{background-color:rgb(var(--color-info))}.success.svelte-10708ut{background-color:rgb(var(--color-success))}.warning.svelte-10708ut{background-color:rgb(var(--color-warning))}.danger.svelte-10708ut{background-color:rgb(var(--color-danger))}",
	map: "{\"version\":3,\"file\":\"Divider.svelte\",\"sources\":[\"Divider.svelte\"],\"sourcesContent\":[\"<script>\\n    import { toCSSString, classnames } from '../utils'\\n\\n    export let is = 'info'\\n    export let size = 0\\n    export let width = 2\\n\\n    $: classProp = classnames('divider', is, $$props.class)\\n    $: styleProp = toCSSString({ padding: `${size / 2}px 0`, height: `${width}px` })\\n</script>\\n\\n<hr class={classProp} style={styleProp}>\\n\\n<style>\\n    .divider {\\n        margin: 0;\\n        border: none;\\n        box-sizing: content-box;\\n        background-clip: content-box;\\n    }\\n\\n    .info {\\n        background-color: rgb(var(--color-info));\\n    }\\n\\n    .success {\\n        background-color: rgb(var(--color-success));\\n    }\\n\\n    .warning {\\n        background-color: rgb(var(--color-warning));\\n    }\\n\\n    .danger {\\n        background-color: rgb(var(--color-danger));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAcI,QAAQ,eAAC,CAAC,AACN,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,WAAW,CACvB,eAAe,CAAE,WAAW,AAChC,CAAC,AAED,KAAK,eAAC,CAAC,AACH,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AAC5C,CAAC,AAED,QAAQ,eAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC/C,CAAC,AAED,QAAQ,eAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC/C,CAAC,AAED,OAAO,eAAC,CAAC,AACL,gBAAgB,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AAC9C,CAAC\"}"
};

const Divider = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { is = "info" } = $$props;
	let { size = 0 } = $$props;
	let { width = 2 } = $$props;
	if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	$$result.css.add(css$7);
	let classProp = classnames("divider", is, $$props.class);

	let styleProp = toCSSString({
		padding: `${size / 2}px 0`,
		height: `${width}px`
	});

	return `<hr class="${escape(null_to_empty(classProp)) + " svelte-10708ut"}"${add_attribute("style", styleProp, 0)}>`;
});

/* src/components/Progress.svelte generated by Svelte v3.18.1 */

const css$8 = {
	code: ".progress.svelte-we6n45{--progress-height:20px;--progress-padding-point:3}.progress.small.svelte-we6n45{--progress-height:15px;--progress-padding-point:3}.progress.medium.svelte-we6n45{--progress-height:20px;--progress-padding-point:3.5}.progress.big.svelte-we6n45{--progress-height:30px;--progress-padding-point:4}.progress.svelte-we6n45{flex:0;width:100%;border-radius:9999px;height:var(--progress-height);background-color:rgba(var(--theme-bg-color));padding:calc(var(--progress-height) / var(--progress-padding-point));box-shadow:inset var(--shadow-primary), var(--shadow-secondary-inset)}.progress-inner-frame.svelte-we6n45{display:flex;width:100%;height:100%;overflow:hidden;border-radius:9999px}.progress-core.svelte-we6n45{flex:none;align-self:stretch;transition:1s ease-in-out;margin-bottom:2px;box-shadow:var(--shadow-primary);border-radius:var(--border-radius);background-color:rgba(var(--color-success))}",
	map: "{\"version\":3,\"file\":\"Progress.svelte\",\"sources\":[\"Progress.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, onMount } from 'svelte'\\n    import { classnames, safeGet } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let id = undefined\\n    export let value = 0 // 0 - 100\\n    export let size = 'medium'\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n    export let borderRadius = undefined\\n\\n    $: val = 0\\n    $: titleProp = title || `Progress - ${val}%`\\n    $: ariaLabelProp = ariaLabel || `Progress - ${val}%`\\n    $: classProp = classnames('progress', size, $$props.class)\\n\\n    onMount(() => {\\n        // Make loading progress effect on mount component.\\n        setTimeout(() => val = Number.isFinite(+value) ? Math.max(0, Math.min(+value, 100)) : 0, 0)\\n    })\\n\\n    function getBorderRadius(borders, defaults = '99999px') {\\n        const brDefault = new Array(4).fill(defaults)\\n        const bds = safeGet(() => borders.split(' '), [], true)\\n        const rule = 'border-radius'\\n        return `${rule}:${brDefault.map((def, i) => `${bds[i] || def}`).join(' ')}`\\n    }\\n</script>\\n\\n\\n<div\\n        {id}\\n        class={classProp}\\n        title={titleProp}\\n        aria-label={ariaLabelProp}\\n        role=\\\"progressbar\\\"\\n        aria-valuemin=\\\"0\\\"\\n        aria-valuemax=\\\"100\\\"\\n        aria-valuenow={val}\\n        style={`${getBorderRadius(borderRadius)}`}\\n>\\n    <div class=\\\"progress-inner-frame\\\">\\n        <div class=\\\"progress-core\\\" style={`width:${val}%`}></div>\\n    </div>\\n</div>\\n\\n<style>\\n    .progress {\\n        --progress-height: 20px;\\n        --progress-padding-point: 3;\\n    }\\n\\n    .progress.small {\\n        --progress-height: 15px;\\n        --progress-padding-point: 3;\\n    }\\n\\n    .progress.medium {\\n        --progress-height: 20px;\\n        --progress-padding-point: 3.5;\\n    }\\n\\n    .progress.big {\\n        --progress-height: 30px;\\n        --progress-padding-point: 4;\\n    }\\n\\n    .progress {\\n        flex: 0;\\n        width: 100%;\\n        border-radius: 9999px;\\n        height: var(--progress-height);\\n        background-color: rgba(var(--theme-bg-color));\\n        padding: calc(var(--progress-height) / var(--progress-padding-point));\\n        box-shadow: inset var(--shadow-primary), var(--shadow-secondary-inset);\\n    }\\n\\n    .progress-inner-frame {\\n        display: flex;\\n        width: 100%;\\n        height: 100%;\\n        overflow: hidden;\\n        border-radius: 9999px;\\n    }\\n\\n    .progress-core {\\n        flex: none;\\n        align-self: stretch;\\n        transition: 1s ease-in-out;\\n        margin-bottom: 2px;\\n        box-shadow: var(--shadow-primary);\\n        border-radius: var(--border-radius);\\n        background-color: rgba(var(--color-success));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAiDI,SAAS,cAAC,CAAC,AACP,iBAAiB,CAAE,IAAI,CACvB,wBAAwB,CAAE,CAAC,AAC/B,CAAC,AAED,SAAS,MAAM,cAAC,CAAC,AACb,iBAAiB,CAAE,IAAI,CACvB,wBAAwB,CAAE,CAAC,AAC/B,CAAC,AAED,SAAS,OAAO,cAAC,CAAC,AACd,iBAAiB,CAAE,IAAI,CACvB,wBAAwB,CAAE,GAAG,AACjC,CAAC,AAED,SAAS,IAAI,cAAC,CAAC,AACX,iBAAiB,CAAE,IAAI,CACvB,wBAAwB,CAAE,CAAC,AAC/B,CAAC,AAED,SAAS,cAAC,CAAC,AACP,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,MAAM,CACrB,MAAM,CAAE,IAAI,iBAAiB,CAAC,CAC9B,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAC7C,OAAO,CAAE,KAAK,IAAI,iBAAiB,CAAC,CAAC,CAAC,CAAC,IAAI,wBAAwB,CAAC,CAAC,CACrE,UAAU,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,IAAI,wBAAwB,CAAC,AAC1E,CAAC,AAED,qBAAqB,cAAC,CAAC,AACnB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,MAAM,AACzB,CAAC,AAED,cAAc,cAAC,CAAC,AACZ,IAAI,CAAE,IAAI,CACV,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,EAAE,CAAC,WAAW,CAC1B,aAAa,CAAE,GAAG,CAClB,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC\"}"
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
		setTimeout(
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
	$$result.css.add(css$8);
	let val = 0;
	let titleProp = title || `Progress - ${val}%`;
	let ariaLabelProp = ariaLabel || `Progress - ${val}%`;
	let classProp = classnames("progress", size, $$props.class);

	return `<div${add_attribute("id", id, 0)} class="${escape(null_to_empty(classProp)) + " svelte-we6n45"}"${add_attribute("title", titleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)} role="${"progressbar"}" aria-valuemin="${"0"}" aria-valuemax="${"100"}"${add_attribute("aria-valuenow", val, 0)}${add_attribute("style", `${getBorderRadius(borderRadius)}`, 0)}>
    <div class="${"progress-inner-frame svelte-we6n45"}">
        <div class="${"progress-core svelte-we6n45"}"${add_attribute("style", `width:${val}%`, 0)}></div>
    </div>
</div>`;
});

/* src/components/Carousel.svelte generated by Svelte v3.18.1 */

const css$9 = {
	code: "ul.svelte-113nkvq{width:100%;display:flex;align-self:stretch;align-items:stretch;justify-content:stretch;overflow-y:hidden;overflow-x:auto;margin-bottom:2px;box-shadow:var(--shadow-primary);border-radius:var(--border-radius);-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory}li.svelte-113nkvq{width:100%;flex:none;display:flex;align-items:stretch;justify-content:stretch;scroll-snap-align:center}",
	map: "{\"version\":3,\"file\":\"Carousel.svelte\",\"sources\":[\"Carousel.svelte\"],\"sourcesContent\":[\"<script>\\n    import Picture from './Picture.svelte'\\n\\n    const cards = [\\n        {\\n            src: 'https://placeimg.com/30/30/tech',\\n            title: 'The main title and short description.',\\n            percent: 45,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/30/30/people',\\n            organization: 'ORG charity of Charitify.',\\n        },\\n        {\\n            src: 'https://placeimg.com/30/30/arch',\\n            title: 'Second bigger major card title line with a bit longer description.',\\n            percent: 65,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/30/30/people',\\n            organization: 'ORG charity of Charitify.',\\n        },\\n        {\\n            src: 'https://placeimg.com/30/30/any',\\n            title: 'The main title and short description.',\\n            percent: 5,\\n            orgHead: 'Tinaramisimuss Kandelakinuskas',\\n            orgHeadSrc: 'https://placeimg.com/30/30/people',\\n            organization: 'ORG charity of Charitify.',\\n        },\\n        {\\n            src: 'https://placeimg.com/30/30/nature',\\n            title: 'The main title and short description.',\\n            percent: 95,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/30/30/people',\\n            organization: 'ORG giant charity organization of big Charitify company.',\\n        },\\n    ]\\n\\n    const imagesDefault = cards.map(card => ({\\n        src: [card.src, card.src, card.src],\\n        alt: card.title,\\n    }))\\n\\n    /**\\n     *\\n     * @type {number | {\\n     *     src: string,\\n     *     srcBig: string,\\n     *     alt: string,\\n     *     onClick?: function,\\n     * }[]}\\n     */\\n    export let items = imagesDefault\\n</script>\\n\\n<ul aria-label=\\\"carousel\\\">\\n    {#each items as item}\\n        <li>\\n            <slot {item}>\\n                <Picture {...item}/>\\n            </slot>\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    ul {\\n        width: 100%;\\n        display: flex;\\n        align-self: stretch;\\n        align-items: stretch;\\n        justify-content: stretch;\\n        overflow-y: hidden;\\n        overflow-x: auto;\\n        margin-bottom: 2px;\\n        box-shadow: var(--shadow-primary);\\n        border-radius: var(--border-radius);\\n        -webkit-overflow-scrolling: touch;\\n        scroll-snap-type: x mandatory;\\n    }\\n\\n    li {\\n        width: 100%;\\n        flex: none;\\n        display: flex;\\n        align-items: stretch;\\n        justify-content: stretch;\\n        scroll-snap-align: center;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAkEI,EAAE,eAAC,CAAC,AACA,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,CACxB,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,aAAa,CAAE,GAAG,CAClB,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,0BAA0B,CAAE,KAAK,CACjC,gBAAgB,CAAE,CAAC,CAAC,SAAS,AACjC,CAAC,AAED,EAAE,eAAC,CAAC,AACA,KAAK,CAAE,IAAI,CACX,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,CACxB,iBAAiB,CAAE,MAAM,AAC7B,CAAC\"}"
};

const Carousel = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const cards = [
		{
			src: "https://placeimg.com/30/30/tech",
			title: "The main title and short description.",
			percent: 45,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/30/30/people",
			organization: "ORG charity of Charitify."
		},
		{
			src: "https://placeimg.com/30/30/arch",
			title: "Second bigger major card title line with a bit longer description.",
			percent: 65,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/30/30/people",
			organization: "ORG charity of Charitify."
		},
		{
			src: "https://placeimg.com/30/30/any",
			title: "The main title and short description.",
			percent: 5,
			orgHead: "Tinaramisimuss Kandelakinuskas",
			orgHeadSrc: "https://placeimg.com/30/30/people",
			organization: "ORG charity of Charitify."
		},
		{
			src: "https://placeimg.com/30/30/nature",
			title: "The main title and short description.",
			percent: 95,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/30/30/people",
			organization: "ORG giant charity organization of big Charitify company."
		}
	];

	const imagesDefault = cards.map(card => ({
		src: [card.src, card.src, card.src],
		alt: card.title
	}));

	let { items = imagesDefault } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$9);

	return `<ul aria-label="${"carousel"}" class="${"svelte-113nkvq"}">
    ${each(items, item => `<li class="${"svelte-113nkvq"}">
            ${$$slots.default
	? $$slots.default({ item })
	: `
                ${validate_component(Picture, "Picture").$$render($$result, Object.assign(item), {}, {})}
            `}
        </li>`)}
</ul>`;
});

/* src/layouts/Header.svelte generated by Svelte v3.18.1 */

const css$a = {
	code: "nav.svelte-iotsi1.svelte-iotsi1{position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;box-shadow:var(--shadow-secondary);border-bottom:1px solid rgba(var(--color-danger), .1)}.selected.svelte-iotsi1.svelte-iotsi1{position:relative;display:inline-block}.selected.svelte-iotsi1.svelte-iotsi1::after{position:absolute;content:\"\";width:calc(100% - 1em);height:2px;background-color:rgb(var(--color-danger));display:block;bottom:-1px}a.svelte-iotsi1.svelte-iotsi1{padding:.8em 0.5em}.nav-actions.svelte-iotsi1.svelte-iotsi1{display:flex;align-items:center;margin:-3px}.nav-actions.svelte-iotsi1 li.svelte-iotsi1{padding:3px}.lang-select.svelte-iotsi1.svelte-iotsi1{padding:5px;background-color:transparent}.lang-select.svelte-iotsi1.svelte-iotsi1:hover,.lang-select.svelte-iotsi1.svelte-iotsi1:focus{box-shadow:none;background-color:rgba(var(--color-black), 0.1)}",
	map: "{\"version\":3,\"file\":\"Header.svelte\",\"sources\":[\"Header.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Icon, Button, Avatar } from '../components'\\n\\n    export let segment\\n\\n    let isDarkTheme = false\\n\\n    let value = 'ua'\\n\\n    function changeTheme() {\\n        isDarkTheme = !isDarkTheme\\n        document.body.classList.remove('theme-dark')\\n        document.body.classList.remove('theme-light')\\n        document.body.classList.add(isDarkTheme ? 'theme-dark' : 'theme-light')\\n    }\\n</script>\\n\\n<nav class=\\\"theme-bg container\\\">\\n    <ul>\\n        <li><a rel=prefetch href='.' class:selected='{segment === undefined}'>home</a></li>\\n        <li><a href='map' class:selected='{segment === \\\"map\\\"}'>map</a></li>\\n        <li><a rel=prefetch href='lists/charities' class:selected='{segment === \\\"lists\\\"}'>lists</a></li>\\n        <li><a rel=prefetch href='charity' class:selected='{segment === \\\"charity\\\"}'>charity</a></li>\\n        <li><a rel=prefetch href='organization' class:selected='{segment === \\\"organization\\\"}'>org</a></li>\\n    </ul>\\n\\n    <ul class=\\\"nav-actions\\\">\\n        <li>\\n            <select {value} name=\\\"lang\\\" id=\\\"lang\\\" class=\\\"btn small lang-select\\\">\\n                <option value=\\\"ua\\\">Ua</option>\\n                <option value=\\\"ru\\\">Ru</option>\\n                <option value=\\\"en\\\">En</option>\\n            </select>\\n        </li>\\n\\n        <li>\\n            <Button on:click={changeTheme} auto size=\\\"small\\\">\\n                <Icon type=\\\"moon\\\" class=\\\"theme-svg-fill\\\"/>\\n            </Button>\\n        </li>\\n\\n        <li>\\n            <Button on:click={changeTheme} auto size=\\\"small\\\">\\n                <Avatar size=\\\"small\\\" src=\\\"https://placeimg.com/300/300/people\\\"/>\\n            </Button>\\n        </li>\\n    </ul>\\n</nav>\\n\\n<style>\\n    nav {\\n        position: sticky;\\n        top: 0;\\n        z-index: 10;\\n        display: flex;\\n        justify-content: space-between;\\n        box-shadow: var(--shadow-secondary);\\n        border-bottom: 1px solid rgba(var(--color-danger), .1);\\n    }\\n\\n    .selected {\\n        position: relative;\\n        display: inline-block;\\n    }\\n\\n    .selected::after {\\n        position: absolute;\\n        content: \\\"\\\";\\n        width: calc(100% - 1em);\\n        height: 2px;\\n        background-color: rgb(var(--color-danger));\\n        display: block;\\n        bottom: -1px;\\n    }\\n\\n    a {\\n        padding: .8em 0.5em;\\n    }\\n\\n    .nav-actions {\\n        display: flex;\\n        align-items: center;\\n        margin: -3px;\\n    }\\n\\n    .nav-actions li {\\n        padding: 3px;\\n    }\\n\\n    .lang-select {\\n        padding: 5px;\\n        background-color: transparent;\\n    }\\n\\n    .lang-select:hover,\\n    .lang-select:focus {\\n        box-shadow: none;\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAkDI,GAAG,4BAAC,CAAC,AACD,QAAQ,CAAE,MAAM,CAChB,GAAG,CAAE,CAAC,CACN,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,UAAU,CAAE,IAAI,kBAAkB,CAAC,CACnC,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,EAAE,CAAC,AAC1D,CAAC,AAED,SAAS,4BAAC,CAAC,AACP,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,AACzB,CAAC,AAED,qCAAS,OAAO,AAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,GAAG,CAAC,CACvB,MAAM,CAAE,GAAG,CACX,gBAAgB,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAC1C,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,CAAC,4BAAC,CAAC,AACC,OAAO,CAAE,IAAI,CAAC,KAAK,AACvB,CAAC,AAED,YAAY,4BAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,0BAAY,CAAC,EAAE,cAAC,CAAC,AACb,OAAO,CAAE,GAAG,AAChB,CAAC,AAED,YAAY,4BAAC,CAAC,AACV,OAAO,CAAE,GAAG,CACZ,gBAAgB,CAAE,WAAW,AACjC,CAAC,AAED,wCAAY,MAAM,CAClB,wCAAY,MAAM,AAAC,CAAC,AAChB,UAAU,CAAE,IAAI,CAChB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC\"}"
};

const Header = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	let value = "ua";

	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$a);

	return `<nav class="${"theme-bg container svelte-iotsi1"}">
    <ul>
        <li><a rel="${"prefetch"}" href="${"."}" class="${["svelte-iotsi1", segment === undefined ? "selected" : ""].join(" ").trim()}">home</a></li>
        <li><a href="${"map"}" class="${["svelte-iotsi1", segment === "map" ? "selected" : ""].join(" ").trim()}">map</a></li>
        <li><a rel="${"prefetch"}" href="${"lists/charities"}" class="${["svelte-iotsi1", segment === "lists" ? "selected" : ""].join(" ").trim()}">lists</a></li>
        <li><a rel="${"prefetch"}" href="${"charity"}" class="${["svelte-iotsi1", segment === "charity" ? "selected" : ""].join(" ").trim()}">charity</a></li>
        <li><a rel="${"prefetch"}" href="${"organization"}" class="${["svelte-iotsi1", segment === "organization" ? "selected" : ""].join(" ").trim()}">org</a></li>
    </ul>

    <ul class="${"nav-actions svelte-iotsi1"}">
        <li class="${"svelte-iotsi1"}">
            <select${add_attribute("value", value, 0)} name="${"lang"}" id="${"lang"}" class="${"btn small lang-select svelte-iotsi1"}">
                <option value="${"ua"}">Ua</option>
                <option value="${"ru"}">Ru</option>
                <option value="${"en"}">En</option>
            </select>
        </li>

        <li class="${"svelte-iotsi1"}">
            ${validate_component(Button, "Button").$$render($$result, { auto: true, size: "small" }, {}, {
		default: () => `
                ${validate_component(Icon, "Icon").$$render($$result, { type: "moon", class: "theme-svg-fill" }, {}, {})}
            `
	})}
        </li>

        <li class="${"svelte-iotsi1"}">
            ${validate_component(Button, "Button").$$render($$result, { auto: true, size: "small" }, {}, {
		default: () => `
                ${validate_component(Avatar, "Avatar").$$render(
			$$result,
			{
				size: "small",
				src: "https://placeimg.com/300/300/people"
			},
			{},
			{}
		)}
            `
	})}
        </li>
    </ul>
</nav>`;
});

/* src/layouts/Footer.svelte generated by Svelte v3.18.1 */

const css$b = {
	code: "footer.svelte-hgsupk{padding:calc(var(--screen-padding) * 2) var(--screen-padding);box-shadow:inset var(--shadow-primary);background-color:rgba(var(--theme-bg-color))}",
	map: "{\"version\":3,\"file\":\"Footer.svelte\",\"sources\":[\"Footer.svelte\"],\"sourcesContent\":[\"<script>\\n\\n</script>\\n\\n<footer>\\n    <p>© 2019 - {new Date().getFullYear()}</p>\\n</footer>\\n\\n<style>\\n    footer {\\n        padding: calc(var(--screen-padding) * 2) var(--screen-padding);\\n        box-shadow: inset var(--shadow-primary);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AASI,MAAM,cAAC,CAAC,AACJ,OAAO,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAC9D,UAAU,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CACvC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC\"}"
};

const Footer = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$b);

	return `<footer class="${"svelte-hgsupk"}">
    <p>© 2019 - ${escape(new Date().getFullYear())}</p>
</footer>`;
});

/* src/layouts/Comment.svelte generated by Svelte v3.18.1 */

const css$c = {
	code: "section.svelte-1u7rlgt.svelte-1u7rlgt{width:100%;flex-grow:1;display:flex;align-self:stretch;align-items:flex-start}div.svelte-1u7rlgt.svelte-1u7rlgt{display:flex;flex-direction:column;overflow:hidden}span.svelte-1u7rlgt.svelte-1u7rlgt{flex:none;overflow:hidden;padding:0 8px}span.svelte-1u7rlgt h4.svelte-1u7rlgt,span.svelte-1u7rlgt sub.svelte-1u7rlgt{display:inline-block;line-height:1;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}pre.svelte-1u7rlgt.svelte-1u7rlgt{padding:0 8px;font-size:.825em;line-height:1.2}",
	map: "{\"version\":3,\"file\":\"Comment.svelte\",\"sources\":[\"Comment.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Avatar } from '../components'\\n\\n    export let src = undefined\\n    export let title = undefined\\n    export let subtitle = undefined\\n</script>\\n\\n<section>\\n    <Avatar src={src} alt={title} class=\\\"comment-ava\\\"/>\\n\\n    <div>\\n        <span>\\n            <h4>{title}</h4>\\n            <sub>{subtitle}</sub>\\n        </span>\\n\\n        <br class=\\\"small\\\">\\n\\n        <slot>\\n            <pre>\\n                A loooooooooong comment that has been\\n                left by a very angry guy who complains upon\\n                looooong comments.\\n            </pre>\\n        </slot>\\n    </div>\\n</section>\\n\\n<style>\\n    section {\\n        width: 100%;\\n        flex-grow: 1;\\n        display: flex;\\n        align-self: stretch;\\n        align-items: flex-start;\\n    }\\n\\n    div {\\n        display: flex;\\n        flex-direction: column;\\n        overflow: hidden;\\n    }\\n\\n    span {\\n        flex: none;\\n        overflow: hidden;\\n        padding: 0 8px;\\n    }\\n\\n    span h4,\\n    span sub {\\n        display: inline-block;\\n        line-height: 1;\\n        max-width: 100%;\\n        overflow: hidden;\\n        white-space: nowrap;\\n        text-overflow: ellipsis;\\n    }\\n\\n    pre {\\n        padding: 0 8px;\\n        font-size: .825em;\\n        line-height: 1.2;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA8BI,OAAO,8BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,UAAU,AAC3B,CAAC,AAED,GAAG,8BAAC,CAAC,AACD,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,IAAI,8BAAC,CAAC,AACF,IAAI,CAAE,IAAI,CACV,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,mBAAI,CAAC,iBAAE,CACP,mBAAI,CAAC,GAAG,eAAC,CAAC,AACN,OAAO,CAAE,YAAY,CACrB,WAAW,CAAE,CAAC,CACd,SAAS,CAAE,IAAI,CACf,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,QAAQ,AAC3B,CAAC,AAED,GAAG,8BAAC,CAAC,AACD,OAAO,CAAE,CAAC,CAAC,GAAG,CACd,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

const Comment = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = undefined } = $$props;
	let { title = undefined } = $$props;
	let { subtitle = undefined } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$c);

	return `<section class="${"svelte-1u7rlgt"}">
    ${validate_component(Avatar, "Avatar").$$render($$result, { src, alt: title, class: "comment-ava" }, {}, {})}

    <div class="${"svelte-1u7rlgt"}">
        <span class="${"svelte-1u7rlgt"}">
            <h4 class="${"svelte-1u7rlgt"}">${escape(title)}</h4>
            <sub class="${"svelte-1u7rlgt"}">${escape(subtitle)}</sub>
        </span>

        <br class="${"small"}">

        ${$$slots.default
	? $$slots.default({})
	: `
            <pre class="${"svelte-1u7rlgt"}">
                A loooooooooong comment that has been
                left by a very angry guy who complains upon
                looooong comments.
            </pre>
        `}
    </div>
</section>`;
});

/* src/layouts/AvatarAndName.svelte generated by Svelte v3.18.1 */

const css$d = {
	code: "section.svelte-s6mhlj.svelte-s6mhlj{width:100%;flex-grow:1;display:flex;align-self:stretch;align-items:center;overflow:hidden}span.svelte-s6mhlj.svelte-s6mhlj{overflow:hidden;padding:0 8px}span.svelte-s6mhlj h4.svelte-s6mhlj,span.svelte-s6mhlj sub.svelte-s6mhlj{line-height:1.4;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
	map: "{\"version\":3,\"file\":\"AvatarAndName.svelte\",\"sources\":[\"AvatarAndName.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Avatar } from '../components'\\n\\n    export let src = undefined\\n    export let title = undefined\\n    export let subtitle = undefined\\n</script>\\n\\n<section>\\n    <Avatar src={src} alt={title}/>\\n\\n    <span>\\n        <h4>{title}</h4>\\n        <sub>{subtitle}</sub>\\n    </span>\\n</section>\\n\\n<style>\\n    section {\\n        width: 100%;\\n        flex-grow: 1;\\n        display: flex;\\n        align-self: stretch;\\n        align-items: center;\\n        overflow: hidden;\\n    }\\n\\n    span {\\n        overflow: hidden;\\n        padding: 0 8px;\\n    }\\n\\n    span h4,\\n    span sub {\\n        line-height: 1.4;\\n        max-width: 100%;\\n        overflow: hidden;\\n        white-space: nowrap;\\n        text-overflow: ellipsis;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAkBI,OAAO,4BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,MAAM,CACnB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,IAAI,4BAAC,CAAC,AACF,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,kBAAI,CAAC,gBAAE,CACP,kBAAI,CAAC,GAAG,cAAC,CAAC,AACN,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,QAAQ,AAC3B,CAAC\"}"
};

const AvatarAndName = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = undefined } = $$props;
	let { title = undefined } = $$props;
	let { subtitle = undefined } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$d);

	return `<section class="${"svelte-s6mhlj"}">
    ${validate_component(Avatar, "Avatar").$$render($$result, { src, alt: title }, {}, {})}

    <span class="${"svelte-s6mhlj"}">
        <h4 class="${"svelte-s6mhlj"}">${escape(title)}</h4>
        <sub class="${"svelte-s6mhlj"}">${escape(subtitle)}</sub>
    </span>
</section>`;
});

/* src/layouts/ListItems.svelte generated by Svelte v3.18.1 */

const css$e = {
	code: ".item.svelte-1b2ug4l{flex:1 1 auto;box-shadow:var(--shadow-primary);border-radius:var(--border-radius);background-color:rgba(var(--theme-bg-color))}",
	map: "{\"version\":3,\"file\":\"ListItems.svelte\",\"sources\":[\"ListItems.svelte\"],\"sourcesContent\":[\"<script>\\n    import AvatarAndName from './AvatarAndName.svelte'\\n\\n    export let items = []\\n</script>\\n\\n{#each items as item}\\n    <section class=\\\"item container\\\">\\n        <br>\\n        <AvatarAndName\\n                src={item.orgHeadSrc}\\n                title={item.orgHead}\\n                subtitle={item.organization}\\n        />\\n        <br>\\n    </section>\\n    <br>\\n{:else}\\n    <section class=\\\"item container\\\">\\n        <p class=\\\"text-center\\\">No organizations</p>\\n    </section>\\n{/each}\\n\\n<style>\\n    .item {\\n        flex: 1 1 auto;\\n        box-shadow: var(--shadow-primary);\\n        border-radius: var(--border-radius);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAwBI,KAAK,eAAC,CAAC,AACH,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC\"}"
};

const ListItems = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$e);

	return `${items.length
	? each(items, item => `<section class="${"item container svelte-1b2ug4l"}">
        <br>
        ${validate_component(AvatarAndName, "AvatarAndName").$$render(
			$$result,
			{
				src: item.orgHeadSrc,
				title: item.orgHead,
				subtitle: item.organization
			},
			{},
			{}
		)}
        <br>
    </section>
    <br>`)
	: `<section class="${"item container svelte-1b2ug4l"}">
        <p class="${"text-center"}">No organizations</p>
    </section>`}`;
});

/* src/layouts/SearchLine.svelte generated by Svelte v3.18.1 */

const css$f = {
	code: ".search.svelte-ovr79r{}",
	map: "{\"version\":3,\"file\":\"SearchLine.svelte\",\"sources\":[\"SearchLine.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Input } from '../components'\\n</script>\\n\\n<section class=\\\"search\\\">\\n    <Input/>\\n</section>\\n\\n<style>\\n    .search {\\n\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AASI,OAAO,cAAC,CAAC,AAET,CAAC\"}"
};

const SearchLine = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$f);

	return `<section class="${"search svelte-ovr79r"}">
    ${validate_component(Input, "Input").$$render($$result, {}, {}, {})}
</section>`;
});

/* src/layouts/CharityCard.svelte generated by Svelte v3.18.1 */

const css$g = {
	code: ".card.svelte-do16pj{display:flex;flex-direction:column;flex:none;width:100%;max-width:100%}.rate-wrap.svelte-do16pj{text-align:center;padding-top:6px}.images-wrap.svelte-do16pj{display:flex;height:100px}h4.svelte-do16pj{--card-line-height:1.4;font-size:.8em;line-height:var(--card-line-height);height:calc(var(--font-size) * (var(--card-line-height) / 1.2) * 2);overflow:hidden}",
	map: "{\"version\":3,\"file\":\"CharityCard.svelte\",\"sources\":[\"CharityCard.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Rate, Progress, Avatar, Carousel } from '../components'\\n    import AvatarAndName from './AvatarAndName.svelte'\\n\\n    export let src = undefined\\n    export let title = undefined\\n    export let percent = undefined\\n    export let orgHead = undefined\\n    export let orgHeadSrc = undefined\\n    export let organization = undefined\\n\\n    $: images = new Array(4).fill({\\n        src,\\n        alt: title,\\n    })\\n</script>\\n\\n<section class=\\\"card\\\">\\n    <div class=\\\"images-wrap\\\">\\n        <Carousel items={images}/>\\n    </div>\\n\\n    <Progress value={percent} borderRadius=\\\"0 0\\\"/>\\n\\n    <h4>{title}</h4>\\n\\n    <div class=\\\"rate-wrap\\\">\\n        <Rate size=\\\"small\\\"/>\\n    </div>\\n\\n    <footer>\\n        <AvatarAndName src={orgHeadSrc} title={orgHead} subtitle={organization}/>\\n    </footer>\\n</section>\\n\\n<style>\\n    .card {\\n        display: flex;\\n        flex-direction: column;\\n        flex: none;\\n        width: 100%;\\n        max-width: 100%;\\n    }\\n\\n    .rate-wrap {\\n        text-align: center;\\n        padding-top: 6px;\\n    }\\n\\n    .images-wrap {\\n        display: flex;\\n        height: 100px;\\n    }\\n\\n    h4 {\\n        --card-line-height: 1.4;\\n\\n        font-size: .8em;\\n        line-height: var(--card-line-height);\\n        height: calc(var(--font-size) * (var(--card-line-height) / 1.2) * 2);\\n        overflow: hidden;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAoCI,KAAK,cAAC,CAAC,AACH,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,IAAI,AACnB,CAAC,AAED,UAAU,cAAC,CAAC,AACR,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,GAAG,AACpB,CAAC,AAED,YAAY,cAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,KAAK,AACjB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,kBAAkB,CAAE,GAAG,CAEvB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,kBAAkB,CAAC,CACpC,MAAM,CAAE,KAAK,IAAI,WAAW,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACpE,QAAQ,CAAE,MAAM,AACpB,CAAC\"}"
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
	$$result.css.add(css$g);
	let images = new Array(4).fill({ src, alt: title });

	return `<section class="${"card svelte-do16pj"}">
    <div class="${"images-wrap svelte-do16pj"}">
        ${validate_component(Carousel, "Carousel").$$render($$result, { items: images }, {}, {})}
    </div>

    ${validate_component(Progress, "Progress").$$render($$result, { value: percent, borderRadius: "0 0" }, {}, {})}

    <h4 class="${"svelte-do16pj"}">${escape(title)}</h4>

    <div class="${"rate-wrap svelte-do16pj"}">
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
</section>`;
});

/* src/layouts/CharityCards.svelte generated by Svelte v3.18.1 */

const css$h = {
	code: "section.svelte-1hdqh35.svelte-1hdqh35{flex-grow:1;align-self:stretch;max-width:100%;padding:0 10px}.cards.svelte-1hdqh35.svelte-1hdqh35{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:var(--screen-padding) 0;margin:calc(var(--screen-padding) * -3) calc(var(--screen-padding) * -1)}.cards.svelte-1hdqh35 li.svelte-1hdqh35{display:flex;justify-content:stretch;width:50%;overflow:hidden;padding:calc(var(--screen-padding) * 3) var(--screen-padding)}.cards.svelte-1hdqh35 li.svelte-1hdqh35:hover{background-color:rgba(0, 0, 0, .1)\n    }",
	map: "{\"version\":3,\"file\":\"CharityCards.svelte\",\"sources\":[\"CharityCards.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Divider } from '../components'\\n    import CharityCard from '../layouts/CharityCard.svelte'\\n\\n    export let listName\\n    export let amount = 2\\n\\n    $: cards = [\\n        {\\n            src: 'https://placeimg.com/300/300/tech',\\n            title: 'This person needs your help',\\n            percent: 45,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'Head of the organization with loooooooong-naaaaaamed charity',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/arch',\\n            title: 'Another person who needs your quick help',\\n            percent: 65,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'Head of another organization',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/any',\\n            title: 'The person with the longest name is also wait for you',\\n            percent: 5,\\n            orgHead: 'Tinaramisimuss el-de-la Kandelakinuskas',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG of charity',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/nature',\\n            title: 'Needs',\\n            percent: 95,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG giant charity organization of big Charitify company',\\n        },\\n    ].slice(Number.isFinite(+amount) ? +amount : 0)\\n\\n    $: images = cards.map(card => ({\\n        src: [card.src, card.src, card.src],\\n        alt: card.title,\\n    }))\\n</script>\\n\\n<section>\\n    {#if listName}\\n        <Divider size=\\\"16\\\"/>\\n        <h3 class=\\\"h2 text-right\\\">{listName}</h3>\\n        <Divider size=\\\"20\\\"/>\\n        <br>\\n    {/if}\\n    <ul class=\\\"cards\\\">\\n        {#each cards as card}\\n            <li>\\n                <CharityCard {...card}/>\\n            </li>\\n        {/each}\\n    </ul>\\n</section>\\n\\n<style>\\n    section {\\n        flex-grow: 1;\\n        align-self: stretch;\\n        max-width: 100%;\\n        padding: 0 10px;\\n    }\\n\\n    .cards {\\n        display: flex;\\n        flex-wrap: wrap;\\n        align-items: flex-start;\\n        justify-content: center;\\n        padding: var(--screen-padding) 0;\\n        margin: calc(var(--screen-padding) * -3) calc(var(--screen-padding) * -1);\\n    }\\n\\n    .cards li {\\n        display: flex;\\n        justify-content: stretch;\\n        width: 50%;\\n        overflow: hidden;\\n        padding: calc(var(--screen-padding) * 3) var(--screen-padding);\\n    }\\n\\n    .cards li:hover {\\n        background-color: rgba(0, 0, 0, .1)\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAiEI,OAAO,8BAAC,CAAC,AACL,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,CAAC,CAAC,IAAI,AACnB,CAAC,AAED,MAAM,8BAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,UAAU,CACvB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAChC,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,AAC7E,CAAC,AAED,qBAAM,CAAC,EAAE,eAAC,CAAC,AACP,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,OAAO,CACxB,KAAK,CAAE,GAAG,CACV,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AAClE,CAAC,AAED,qBAAM,CAAC,iBAAE,MAAM,AAAC,CAAC,AACb,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC;IACvC,CAAC\"}"
};

const CharityCards = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { listName } = $$props;
	let { amount = 2 } = $$props;
	if ($$props.listName === void 0 && $$bindings.listName && listName !== void 0) $$bindings.listName(listName);
	if ($$props.amount === void 0 && $$bindings.amount && amount !== void 0) $$bindings.amount(amount);
	$$result.css.add(css$h);

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

	return `<section class="${"svelte-1hdqh35"}">
    ${listName
	? `${validate_component(Divider, "Divider").$$render($$result, { size: "16" }, {}, {})}
        <h3 class="${"h2 text-right"}">${escape(listName)}</h3>
        ${validate_component(Divider, "Divider").$$render($$result, { size: "20" }, {}, {})}
        <br>`
	: ``}
    <ul class="${"cards svelte-1hdqh35"}">
        ${each(cards, card => `<li class="${"svelte-1hdqh35"}">
                ${validate_component(CharityCard, "CharityCard").$$render($$result, Object.assign(card), {}, {})}
            </li>`)}
    </ul>
</section>`;
});

/* src/layouts/TitleSubTitle.svelte generated by Svelte v3.18.1 */

const css$i = {
	code: "section.svelte-y1uq32{text-align:center;padding:0 3vw}h2.svelte-y1uq32{font-weight:400}",
	map: "{\"version\":3,\"file\":\"TitleSubTitle.svelte\",\"sources\":[\"TitleSubTitle.svelte\"],\"sourcesContent\":[\"<script>\\n    export let title = 'The main title that explains the charity'\\n    export let subtitle = 'And bigger description that describes in short keywords a charity, title above and just makes text longer'\\n</script>\\n\\n<section>\\n    <h1>{title}</h1>\\n    <br>\\n    <h2>{subtitle}</h2>\\n</section>\\n\\n<style>\\n    section {\\n        text-align: center;\\n        padding: 0 3vw;\\n    }\\n\\n    h2 {\\n        font-weight: 400;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAYI,OAAO,cAAC,CAAC,AACL,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

const TitleSubTitle = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = "The main title that explains the charity" } = $$props;
	let { subtitle = "And bigger description that describes in short keywords a charity, title above and just makes text longer" } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$i);

	return `<section class="${"svelte-y1uq32"}">
    <h1>${escape(title)}</h1>
    <br>
    <h2 class="${"svelte-y1uq32"}">${escape(subtitle)}</h2>
</section>`;
});

/* src/layouts/DonatingGroup.svelte generated by Svelte v3.18.1 */

const css$j = {
	code: "ul.svelte-1k5eog2.svelte-1k5eog2{flex:0;display:flex;flex-direction:column;margin:calc(var(--screen-padding) * -1 / 2) 0;padding:0 0 0 var(--screen-padding)}ul.svelte-1k5eog2 li.svelte-1k5eog2{flex:none;margin:calc(var(--screen-padding) / 2) 0}",
	map: "{\"version\":3,\"file\":\"DonatingGroup.svelte\",\"sources\":[\"DonatingGroup.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Input, Button } from '../components'\\n</script>\\n\\n<ul>\\n    <li>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">test1</Button>\\n    </li>\\n    <li>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">test12</Button>\\n    </li>\\n    <li>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">test123</Button>\\n    </li>\\n    <li>\\n        <br>\\n        <Input\\n                type=\\\"number\\\"\\n                name=\\\"num\\\"\\n                list=\\\"sum-suggestions\\\"\\n                placeholder=\\\"Num\\\"\\n                autoselect\\n                align=\\\"right\\\"\\n        />\\n\\n        <datalist id=\\\"sum-suggestions\\\">\\n            <option value=\\\"20\\\">\\n            <option value=\\\"500\\\">\\n            <option value=\\\"1000\\\">\\n        </datalist>\\n    </li>\\n    <li>\\n        <Button is=\\\"warning\\\" on:click=\\\"{e => console.log(e)}\\\">Submit</Button>\\n    </li>\\n</ul>\\n\\n<style>\\n    ul {\\n        flex: 0;\\n        display: flex;\\n        flex-direction: column;\\n        margin: calc(var(--screen-padding) * -1 / 2) 0;\\n        padding: 0 0 0 var(--screen-padding);\\n    }\\n\\n    ul li {\\n        flex: none;\\n        margin: calc(var(--screen-padding) / 2) 0;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAqCI,EAAE,8BAAC,CAAC,AACA,IAAI,CAAE,CAAC,CACP,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9C,OAAO,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACxC,CAAC,AAED,iBAAE,CAAC,EAAE,eAAC,CAAC,AACH,IAAI,CAAE,IAAI,CACV,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC7C,CAAC\"}"
};

const DonatingGroup = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$j);

	return `<ul class="${"svelte-1k5eog2"}">
    <li class="${"svelte-1k5eog2"}">
        ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `test1` })}
    </li>
    <li class="${"svelte-1k5eog2"}">
        ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `test12` })}
    </li>
    <li class="${"svelte-1k5eog2"}">
        ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `test123` })}
    </li>
    <li class="${"svelte-1k5eog2"}">
        <br>
        ${validate_component(Input, "Input").$$render(
		$$result,
		{
			type: "number",
			name: "num",
			list: "sum-suggestions",
			placeholder: "Num",
			autoselect: true,
			align: "right"
		},
		{},
		{}
	)}

        <datalist id="${"sum-suggestions"}">
            <option value="${"20"}">
            </option><option value="${"500"}">
            </option><option value="${"1000"}">
        </option></datalist>
    </li>
    <li class="${"svelte-1k5eog2"}">
        ${validate_component(Button, "Button").$$render($$result, { is: "warning" }, {}, { default: () => `Submit` })}
    </li>
</ul>`;
});

/* src/layouts/ContentHolder.svelte generated by Svelte v3.18.1 */

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

/* src/layouts/ListOfFeatures.svelte generated by Svelte v3.18.1 */

const css$k = {
	code: "ul.svelte-14memlh{list-style:disc outside none;padding:0 calc(var(--screen-padding) * 5)}li.svelte-14memlh{display:list-item}ul.svelte-14memlh,li.svelte-14memlh,h3.svelte-14memlh,p.svelte-14memlh{max-width:100%;vertical-align:middle}h3.svelte-14memlh,p.svelte-14memlh{overflow:hidden;display:inline-block;word-break:break-word;text-overflow:ellipsis}",
	map: "{\"version\":3,\"file\":\"ListOfFeatures.svelte\",\"sources\":[\"ListOfFeatures.svelte\"],\"sourcesContent\":[\"<script>\\n    const items = [\\n        {\\n            title: 'Comfort is the main feature',\\n            text: 'Just imaging, you do something simple and you can see the result of your short way.',\\n        },\\n        {\\n            title: 'Comfort is the main feature',\\n            text: 'Just imaging, you do something simple and you can see the result of your short way.',\\n        },\\n        {\\n            title: 'Comfort is the main feature',\\n            text: 'Just imaging, you do something simple and you can see the result of your short way.',\\n        },\\n        {\\n            title: 'Comfort is the main feature',\\n            text: 'Just imaging, you do something simple and you can see the result of your short way.',\\n        },\\n    ]\\n</script>\\n\\n<ul>\\n    {#each items as item}\\n        <li>\\n            <h3>{item.title}</h3>\\n            <p>{item.text}</p>\\n            <br>\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    ul {\\n        list-style: disc outside none;\\n        padding: 0 calc(var(--screen-padding) * 5);\\n        /*list-style-image: url(\\\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='-1 -1 2 2'><circle r='1' /></svg>\\\");*/\\n    }\\n\\n    li {\\n        display: list-item;\\n    }\\n\\n    ul, li, h3, p {\\n        max-width: 100%;\\n        vertical-align: middle;\\n    }\\n\\n    h3, p {\\n        overflow: hidden;\\n        display: inline-block;\\n        word-break: break-word;\\n        text-overflow: ellipsis;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAgCI,EAAE,eAAC,CAAC,AACA,UAAU,CAAE,IAAI,CAAC,OAAO,CAAC,IAAI,CAC7B,OAAO,CAAE,CAAC,CAAC,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAE9C,CAAC,AAED,EAAE,eAAC,CAAC,AACA,OAAO,CAAE,SAAS,AACtB,CAAC,AAED,iBAAE,CAAE,iBAAE,CAAE,iBAAE,CAAE,CAAC,eAAC,CAAC,AACX,SAAS,CAAE,IAAI,CACf,cAAc,CAAE,MAAM,AAC1B,CAAC,AAED,iBAAE,CAAE,CAAC,eAAC,CAAC,AACH,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,YAAY,CACrB,UAAU,CAAE,UAAU,CACtB,aAAa,CAAE,QAAQ,AAC3B,CAAC\"}"
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

	$$result.css.add(css$k);

	return `<ul class="${"svelte-14memlh"}">
    ${each(items, item => `<li class="${"svelte-14memlh"}">
            <h3 class="${"svelte-14memlh"}">${escape(item.title)}</h3>
            <p class="${"svelte-14memlh"}">${escape(item.text)}</p>
            <br>
        </li>`)}
</ul>`;
});

/* src/routes/index.svelte generated by Svelte v3.18.1 */

const css$l = {
	code: ".top-pic.svelte-b9nco9{flex:none;z-index:0;width:100%;height:200px;display:flex;overflow:hidden;border-radius:0}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<script>\\n    import {\\n        Footer,\\n        Comment,\\n        CharityCards,\\n        ContentHolder,\\n        TitleSubTitle,\\n        ListOfFeatures,\\n    } from '../layouts'\\n    import {\\n        Divider,\\n        Progress,\\n        Carousel,\\n    } from '../components'\\n</script>\\n\\n<style>\\n    .top-pic {\\n        flex: none;\\n        z-index: 0;\\n        width: 100%;\\n        height: 200px;\\n        display: flex;\\n        overflow: hidden;\\n        border-radius: 0;\\n    }\\n</style>\\n\\n<svelte:head>\\n    <title>Charitify - list of charities you can donate.</title>\\n</svelte:head>\\n\\n<div class=\\\"top-pic\\\">\\n    <Carousel/>\\n</div>\\n\\n<Progress borderRadius=\\\"0 0 8px 8px\\\" value=\\\"30\\\"/>\\n\\n<p>These guys rise a pound of vegetables. They like vegetables and long text under photos.</p>\\n\\n<br>\\n<br>\\n<br>\\n<br>\\n<br>\\n<section class=\\\"container\\\">\\n\\n    <TitleSubTitle\\n            title=\\\"Charitify\\\"\\n            subtitle=\\\"Charity application for helping those in need\\\"\\n    />\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Carousel amount=\\\"2\\\">\\n        <CharityCards amount=\\\"2\\\" listName=\\\"Nearest to you:\\\"/>\\n    </Carousel>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <ContentHolder/>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Divider size=\\\"16\\\"/>\\n    <h3 class=\\\"h2 text-right\\\">Comments:</h3>\\n    <Divider size=\\\"20\\\"/>\\n\\n    <Carousel amount=\\\"4\\\">\\n        <ul style=\\\"display: flex; flex-wrap: wrap; overflow: hidden\\\">\\n            <li style=\\\"width: 50%\\\">\\n                <Comment\\n                        src=\\\"https://placeimg.com/300/300/people\\\"\\n                        title=\\\"Tina Kandelaki\\\"\\n                        subtitle=\\\"ORG charity charitify\\\"\\n                >\\n                    <pre>\\n                        I really hate this things.\\n                        It looks awful. Will never ever enter here.\\n                    </pre>\\n                </Comment>\\n                <br>\\n            </li>\\n            <li style=\\\"width: 50%\\\">\\n                <Comment\\n                        src=\\\"https://placeimg.com/300/300/people\\\"\\n                        title=\\\"Tinaramisimuss el-de-la Kandelakinuskas\\\"\\n                        subtitle=\\\"ORG charity charitify\\\"\\n                >\\n                    <pre>\\n                         👍\\n                    </pre>\\n                </Comment>\\n                <br>\\n            </li>\\n            <li style=\\\"width: 50%\\\">\\n                <Comment\\n                        src=\\\"https://placeimg.com/300/300/people\\\"\\n                        title=\\\"Tina Kandelaki\\\"\\n                        subtitle=\\\"ORG charity charitify\\\"\\n                >\\n                    <pre>\\n                        Like\\n                    </pre>\\n                </Comment>\\n                <br>\\n            </li>\\n            <li style=\\\"width: 50%\\\">\\n                <Comment\\n                        src=\\\"https://placeimg.com/300/300/people\\\"\\n                        title=\\\"Tina Kandelaki\\\"\\n                        subtitle=\\\"Head of the organization with loooooooong-naaaaaamed charity\\\"\\n                >\\n                     <pre>\\n                         Don't listen him, hi's wrong. I think this is a good idea and we should continue.\\n                         Anyway, I wish you luck.\\n                    </pre>\\n                </Comment>\\n                <br>\\n            </li>\\n        </ul>\\n    </Carousel>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <ContentHolder/>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <ListOfFeatures/>\\n</section>\\n\\n<br>\\n<br>\\n<br>\\n<br>\\n<br>\\n\\n<Footer/>\\n\"],\"names\":[],\"mappings\":\"AAiBI,QAAQ,cAAC,CAAC,AACN,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,CAAC,CACV,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,CAAC,AACpB,CAAC\"}"
};

const Routes = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$l);

	return `${($$result.head += `${($$result.title = `<title>Charitify - list of charities you can donate.</title>`, "")}`, "")}

<div class="${"top-pic svelte-b9nco9"}">
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

    ${validate_component(Carousel, "Carousel").$$render($$result, { amount: "4" }, {}, {
		default: () => `
        <ul style="${"display: flex; flex-wrap: wrap; overflow: hidden"}">
            <li style="${"width: 50%"}">
                ${validate_component(Comment, "Comment").$$render(
			$$result,
			{
				src: "https://placeimg.com/300/300/people",
				title: "Tina Kandelaki",
				subtitle: "ORG charity charitify"
			},
			{},
			{
				default: () => `
                    <pre>
                        I really hate this things.
                        It looks awful. Will never ever enter here.
                    </pre>
                `
			}
		)}
                <br>
            </li>
            <li style="${"width: 50%"}">
                ${validate_component(Comment, "Comment").$$render(
			$$result,
			{
				src: "https://placeimg.com/300/300/people",
				title: "Tinaramisimuss el-de-la Kandelakinuskas",
				subtitle: "ORG charity charitify"
			},
			{},
			{
				default: () => `
                    <pre>
                         👍
                    </pre>
                `
			}
		)}
                <br>
            </li>
            <li style="${"width: 50%"}">
                ${validate_component(Comment, "Comment").$$render(
			$$result,
			{
				src: "https://placeimg.com/300/300/people",
				title: "Tina Kandelaki",
				subtitle: "ORG charity charitify"
			},
			{},
			{
				default: () => `
                    <pre>
                        Like
                    </pre>
                `
			}
		)}
                <br>
            </li>
            <li style="${"width: 50%"}">
                ${validate_component(Comment, "Comment").$$render(
			$$result,
			{
				src: "https://placeimg.com/300/300/people",
				title: "Tina Kandelaki",
				subtitle: "Head of the organization with loooooooong-naaaaaamed charity"
			},
			{},
			{
				default: () => `
                     <pre>
                         Don&#39;t listen him, hi&#39;s wrong. I think this is a good idea and we should continue.
                         Anyway, I wish you luck.
                    </pre>
                `
			}
		)}
                <br>
            </li>
        </ul>
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

    ${validate_component(ListOfFeatures, "ListOfFeatures").$$render($$result, {}, {}, {})}
</section>

<br>
<br>
<br>
<br>
<br>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});

/**
 *
 * @description API URLs builders.
 */
const endpoints = {
  RECENT_NEWS: () => `recent_news.json`,

  CHARITY: (id) => `charity.json?id=${id}`,
  CHARITIES: () => `charities.json`,
  CHARITY_COMMENTS: (id) => `charity_comments.json?id=${id}`,

  ORGANIZATION: (id) => `organization.json?id=${id}`,
  ORGANIZATIONS: () => `organizations.json`,
  ORGANIZATION_COMMENTS: (id) => `$organization/comments.json?id=${id}`,
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

    this._base_path = config.basePath ? `${config.basePath}/` : '';

    this._requestInterceptor = config.requestInterceptor || (async (...args) => args);
    this._responseInterceptor = config.responseInterceptor || (async (...args) => args);
    this._errorInterceptor = config.errorInterceptor || Promise.reject;
  }

  /**
   *
   * @param method {'get'|'put'|'post'|'delete'|'patch'}
   * @param args {*[]}
   */
  async newRequest(method, ...args) {
    return this.withInterceptors(this._adapter[method], ...args)
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
      args[0] = `${this._base_path}${args[0]}`;
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
   * @description Charity
   */
  getCharity(id, params, config) {
    return this.newRequest('get', endpoints.CHARITY(id), params, config)
  }

  getCharities(params, config) {
    return this.newRequest('get', endpoints.CHARITIES(), params, config)
  }

  getCharityComments(id, params, config) {
    return this.newRequest('get', endpoints.CHARITY_COMMENTS(id), params, config)
  }

  /**
   *
   * @description Organization
   */
  getOrganization(id, params, config) {
    return this.newRequest('get', endpoints.ORGANIZATION(id), params, config)
  }

  getOrganizations(params, config) {
    return this.newRequest('get', endpoints.ORGANIZATIONS(), params, config)
  }

  getOrganizationComments(id, params, config) {
    return this.newRequest('get', endpoints.ORGANIZATION_COMMENTS(id), params, config)
  }

  /**
   *
   * @description News
   */
  getRecentNews(params, config) {
    return this.newRequest('get', endpoints.RECENT_NEWS(), params, config)
  }

}

/**
 *
 * @constructor {Config}
 */
var api = new ApiClass({
  basePath: process.env.BACKEND_URL,
  responseInterceptor: res => (console.info('response -------\n', res), res),
  errorInterceptor: rej => {
    console.warn('request error -------\n', rej);

    if (rej && rej.error && rej.error.message === 'Failed to fetch') {
      console.log('Lost internet connection');
    }

    throw rej
  },
});

/* src/routes/organization.svelte generated by Svelte v3.18.1 */

const css$m = {
	code: ".top.svelte-uz5elz{display:flex;margin-bottom:calc(var(--screen-padding) * 1.5);margin-top:var(--screen-padding)}.pics-wrap.svelte-uz5elz{z-index:0;flex-grow:1;display:flex;overflow:hidden;margin-bottom:2px;border-radius:var(--border-radius);box-shadow:var(--shadow-primary)}.rate-section.svelte-uz5elz{display:flex;align-items:flex-end;justify-content:space-between;padding:12px 0}",
	map: "{\"version\":3,\"file\":\"organization.svelte\",\"sources\":[\"organization.svelte\"],\"sourcesContent\":[\"<script>\\n    import { onMount } from 'svelte'\\n    import { api } from '../services'\\n    import { TitleSubTitle, AvatarAndName, DonatingGroup, CharityCards, Footer } from '../layouts'\\n    import { Rate, Progress, Carousel } from '../components'\\n\\n    let organization = {}\\n\\n    $: carousel = (organization.src || []).map((src, i) => ({ src, srcBig: (organization.src2x || [])[i] }))\\n\\n    onMount(async () => {\\n        await new Promise(r => setTimeout(r, 2000))\\n        organization = await api.getOrganization(1)\\n    })\\n</script>\\n\\n<svelte:head>\\n    <title>Charitify - Organization page.</title>\\n</svelte:head>\\n\\n<style>\\n    .top {\\n        display: flex;\\n        margin-bottom: calc(var(--screen-padding) * 1.5);\\n        margin-top: var(--screen-padding);\\n    }\\n\\n    .pics-wrap {\\n        z-index: 0;\\n        flex-grow: 1;\\n        display: flex;\\n        overflow: hidden;\\n        margin-bottom: 2px;\\n        border-radius: var(--border-radius);\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    .rate-section {\\n        display: flex;\\n        align-items: flex-end;\\n        justify-content: space-between;\\n        padding: 12px 0;\\n    }\\n</style>\\n\\n<section class=\\\"container\\\">\\n\\n    <section>\\n        <br>\\n        <TitleSubTitle\\n            title={organization.title}\\n            subtitle={organization.description}\\n        />\\n        <br>\\n    </section>\\n\\n    <section class=\\\"top\\\">\\n        <div class=\\\"pics-wrap\\\">\\n            <Carousel items={carousel}/>\\n        </div>\\n\\n        <DonatingGroup/>\\n    </section>\\n\\n    <Progress value=\\\"65\\\" size=\\\"big\\\"/>\\n\\n    <section class=\\\"rate-section\\\">\\n        <AvatarAndName\\n                src={organization.orgHeadSrc}\\n                title={organization.orgHead}\\n                subtitle={organization.title}\\n        />\\n\\n        <Rate/>\\n    </section>\\n</section>\\n\\n<br>\\n<br>\\n<br>\\n\\n<div class=\\\"container\\\">\\n    <CharityCards/>\\n</div>\\n\\n<br>\\n<br>\\n<br>\\n<br>\\n<br>\\n\\n<div class=\\\"container\\\">\\n    <CharityCards/>\\n</div>\\n\\n<br>\\n<br>\\n<br>\\n<br>\\n<br>\\n\\n<Footer/>\\n\\n\"],\"names\":[],\"mappings\":\"AAqBI,IAAI,cAAC,CAAC,AACF,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAChD,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,UAAU,cAAC,CAAC,AACR,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,aAAa,cAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,QAAQ,CACrB,eAAe,CAAE,aAAa,CAC9B,OAAO,CAAE,IAAI,CAAC,CAAC,AACnB,CAAC\"}"
};

const Organization = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let organization = {};

	onMount(async () => {
		await new Promise(r => setTimeout(r, 2000));
		organization = await api.getOrganization(1);
	});

	$$result.css.add(css$m);

	let carousel = (organization.src || []).map((src, i) => ({
		src,
		srcBig: (organization.src2x || [])[i]
	}));

	return `${($$result.head += `${($$result.title = `<title>Charitify - Organization page.</title>`, "")}`, "")}



<section class="${"container"}">

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

    <section class="${"top svelte-uz5elz"}">
        <div class="${"pics-wrap svelte-uz5elz"}">
            ${validate_component(Carousel, "Carousel").$$render($$result, { items: carousel }, {}, {})}
        </div>

        ${validate_component(DonatingGroup, "DonatingGroup").$$render($$result, {}, {}, {})}
    </section>

    ${validate_component(Progress, "Progress").$$render($$result, { value: "65", size: "big" }, {}, {})}

    <section class="${"rate-section svelte-uz5elz"}">
        ${validate_component(AvatarAndName, "AvatarAndName").$$render(
		$$result,
		{
			src: organization.orgHeadSrc,
			title: organization.orgHead,
			subtitle: organization.title
		},
		{},
		{}
	)}

        ${validate_component(Rate, "Rate").$$render($$result, {}, {}, {})}
    </section>
</section>

<br>
<br>
<br>

<div class="${"container"}">
    ${validate_component(CharityCards, "CharityCards").$$render($$result, {}, {}, {})}
</div>

<br>
<br>
<br>
<br>
<br>

<div class="${"container"}">
    ${validate_component(CharityCards, "CharityCards").$$render($$result, {}, {}, {})}
</div>

<br>
<br>
<br>
<br>
<br>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});

/* src/routes/charity.svelte generated by Svelte v3.18.1 */

const css$n = {
	code: ".top.svelte-uz5elz{display:flex;margin-bottom:calc(var(--screen-padding) * 1.5);margin-top:var(--screen-padding)}.pics-wrap.svelte-uz5elz{z-index:0;flex-grow:1;display:flex;overflow:hidden;margin-bottom:2px;border-radius:var(--border-radius);box-shadow:var(--shadow-primary)}.rate-section.svelte-uz5elz{display:flex;align-items:flex-end;justify-content:space-between;padding:12px 0}",
	map: "{\"version\":3,\"file\":\"charity.svelte\",\"sources\":[\"charity.svelte\"],\"sourcesContent\":[\"<script>\\n    import { onMount } from 'svelte'\\n    import { api } from '../services'\\n    import { TitleSubTitle, AvatarAndName, DonatingGroup, CharityCards, Footer } from '../layouts'\\n    import { Rate, Progress, Carousel } from '../components'\\n\\n    let charity = {}\\n\\n    $: carousel = (charity.src || []).map((src, i) => ({ src, srcBig: (charity.src2x || [])[i] }))\\n\\n    onMount(async () => {\\n        await new Promise(r => setTimeout(r, 2000))\\n        charity = await api.getCharity(1)\\n    })\\n</script>\\n\\n<svelte:head>\\n    <title>Charitify - Charity page and donate.</title>\\n</svelte:head>\\n\\n<style>\\n    .top {\\n        display: flex;\\n        margin-bottom: calc(var(--screen-padding) * 1.5);\\n        margin-top: var(--screen-padding);\\n    }\\n\\n    .pics-wrap {\\n        z-index: 0;\\n        flex-grow: 1;\\n        display: flex;\\n        overflow: hidden;\\n        margin-bottom: 2px;\\n        border-radius: var(--border-radius);\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    .rate-section {\\n        display: flex;\\n        align-items: flex-end;\\n        justify-content: space-between;\\n        padding: 12px 0;\\n    }\\n</style>\\n\\n<section class=\\\"container\\\">\\n\\n    <section class=\\\"top\\\">\\n        <div class=\\\"pics-wrap\\\">\\n            <Carousel items={carousel}/>\\n        </div>\\n\\n        <DonatingGroup/>\\n    </section>\\n\\n    <Progress value=\\\"65\\\" size=\\\"big\\\"/>\\n\\n    <section class=\\\"rate-section\\\">\\n        <AvatarAndName\\n                src={charity.orgHeadSrc}\\n                title={charity.orgHead}\\n                subtitle={charity.organization}\\n        />\\n\\n        <Rate/>\\n    </section>\\n\\n    <section>\\n        <br>\\n        <TitleSubTitle\\n                title={charity.title}\\n                subtitle={charity.description}\\n        />\\n        <br>\\n    </section>\\n\\n</section>\\n\\n<br>\\n<br>\\n<br>\\n\\n<div class=\\\"container\\\">\\n    <CharityCards/>\\n</div>\\n\\n<br>\\n<br>\\n<br>\\n<br>\\n<br>\\n\\n<div class=\\\"container\\\">\\n    <CharityCards/>\\n</div>\\n\\n<br>\\n<br>\\n<br>\\n<br>\\n<br>\\n\\n<Footer/>\\n\\n\"],\"names\":[],\"mappings\":\"AAqBI,IAAI,cAAC,CAAC,AACF,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAChD,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,UAAU,cAAC,CAAC,AACR,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,aAAa,cAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,QAAQ,CACrB,eAAe,CAAE,aAAa,CAC9B,OAAO,CAAE,IAAI,CAAC,CAAC,AACnB,CAAC\"}"
};

const Charity = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let charity = {};

	onMount(async () => {
		await new Promise(r => setTimeout(r, 2000));
		charity = await api.getCharity(1);
	});

	$$result.css.add(css$n);
	let carousel = (charity.src || []).map((src, i) => ({ src, srcBig: (charity.src2x || [])[i] }));

	return `${($$result.head += `${($$result.title = `<title>Charitify - Charity page and donate.</title>`, "")}`, "")}



<section class="${"container"}">

    <section class="${"top svelte-uz5elz"}">
        <div class="${"pics-wrap svelte-uz5elz"}">
            ${validate_component(Carousel, "Carousel").$$render($$result, { items: carousel }, {}, {})}
        </div>

        ${validate_component(DonatingGroup, "DonatingGroup").$$render($$result, {}, {}, {})}
    </section>

    ${validate_component(Progress, "Progress").$$render($$result, { value: "65", size: "big" }, {}, {})}

    <section class="${"rate-section svelte-uz5elz"}">
        ${validate_component(AvatarAndName, "AvatarAndName").$$render(
		$$result,
		{
			src: charity.orgHeadSrc,
			title: charity.orgHead,
			subtitle: charity.organization
		},
		{},
		{}
	)}

        ${validate_component(Rate, "Rate").$$render($$result, {}, {}, {})}
    </section>

    <section>
        <br>
        ${validate_component(TitleSubTitle, "TitleSubTitle").$$render(
		$$result,
		{
			title: charity.title,
			subtitle: charity.description
		},
		{},
		{}
	)}
        <br>
    </section>

</section>

<br>
<br>
<br>

<div class="${"container"}">
    ${validate_component(CharityCards, "CharityCards").$$render($$result, {}, {}, {})}
</div>

<br>
<br>
<br>
<br>
<br>

<div class="${"container"}">
    ${validate_component(CharityCards, "CharityCards").$$render($$result, {}, {}, {})}
</div>

<br>
<br>
<br>
<br>
<br>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});

/* src/routes/lists/_layout.svelte generated by Svelte v3.18.1 */

const css$o = {
	code: ".search.svelte-1vo7cwi.svelte-1vo7cwi{position:sticky;top:47px;box-shadow:var(--shadow-primary)}.list-wrap.svelte-1vo7cwi.svelte-1vo7cwi{flex:1 1 auto;padding:0 var(--screen-padding)\n\t}nav.svelte-1vo7cwi ul.svelte-1vo7cwi,nav.svelte-1vo7cwi li.svelte-1vo7cwi{display:flex;align-self:stretch;align-items:stretch;justify-content:stretch}li.svelte-1vo7cwi.svelte-1vo7cwi{flex:1 1 0}li.svelte-1vo7cwi a.svelte-1vo7cwi{flex:1 1 0;align-self:stretch;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px 10px}li.svelte-1vo7cwi a.svelte-1vo7cwi:hover,li.svelte-1vo7cwi a.selected.svelte-1vo7cwi{background-color:rgba(var(--color-black), .1)}",
	map: "{\"version\":3,\"file\":\"_layout.svelte\",\"sources\":[\"_layout.svelte\"],\"sourcesContent\":[\"<svelte:head>\\n\\t<title>Charitify - is the application for helping those in need.</title>\\n</svelte:head>\\n\\n<script>\\n\\timport { SearchLine, Footer } from '../../layouts'\\n\\n\\texport let segment\\n</script>\\n\\n<div class=\\\"search theme-bg container\\\">\\n\\t<br>\\n\\n\\t<SearchLine/>\\n\\n\\t<nav>\\n\\t\\t<ul>\\n\\t\\t\\t<li><a rel=prefetch href='lists/charities' class:selected='{segment === \\\"charities\\\"}'>charities</a></li>\\n\\t\\t\\t<li><a rel=prefetch href='lists/organizations' class:selected='{segment === \\\"organizations\\\"}'>organizations</a></li>\\n\\t\\t</ul>\\n\\t</nav>\\n</div>\\n\\n<div class=\\\"list-wrap\\\">\\n\\t<br>\\n\\n\\t<slot></slot>\\n\\n\\t<br>\\n\\t<br>\\n</div>\\n\\n<Footer/>\\n\\n<style>\\n\\t.search {\\n\\t\\tposition: sticky;\\n\\t\\ttop: 47px;\\n\\t\\tbox-shadow: var(--shadow-primary);\\n\\t}\\n\\n\\t.list-wrap {\\n\\t\\tflex: 1 1 auto;\\n\\t\\tpadding: 0 var(--screen-padding)\\n\\t}\\n\\n\\tnav ul, nav li {\\n\\t\\tdisplay: flex;\\n\\t\\talign-self: stretch;\\n\\t\\talign-items: stretch;\\n\\t\\tjustify-content: stretch;\\n\\t}\\n\\n\\tli {\\n\\t\\tflex: 1 1 0;\\n\\t}\\n\\n\\tli a {\\n\\t\\tflex: 1 1 0;\\n\\t\\talign-self: stretch;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\ttext-align: center;\\n\\t\\tpadding: 20px 10px;\\n\\t}\\n\\n\\tli a:hover, li a.selected {\\n\\t\\tbackground-color: rgba(var(--color-black), .1);\\n\\t}\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAmCC,OAAO,8BAAC,CAAC,AACR,QAAQ,CAAE,MAAM,CAChB,GAAG,CAAE,IAAI,CACT,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAClC,CAAC,AAED,UAAU,8BAAC,CAAC,AACX,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC;CACjC,CAAC,AAED,kBAAG,CAAC,iBAAE,CAAE,kBAAG,CAAC,EAAE,eAAC,CAAC,AACf,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,AACzB,CAAC,AAED,EAAE,8BAAC,CAAC,AACH,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,AACZ,CAAC,AAED,iBAAE,CAAC,CAAC,eAAC,CAAC,AACL,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACX,UAAU,CAAE,OAAO,CACnB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,IAAI,CAAC,IAAI,AACnB,CAAC,AAED,iBAAE,CAAC,gBAAC,MAAM,CAAE,iBAAE,CAAC,CAAC,SAAS,eAAC,CAAC,AAC1B,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AAC/C,CAAC\"}"
};

const Layout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$o);

	return `${($$result.head += `${($$result.title = `<title>Charitify - is the application for helping those in need.</title>`, "")}`, "")}



<div class="${"search theme-bg container svelte-1vo7cwi"}">
	<br>

	${validate_component(SearchLine, "SearchLine").$$render($$result, {}, {}, {})}

	<nav class="${"svelte-1vo7cwi"}">
		<ul class="${"svelte-1vo7cwi"}">
			<li class="${"svelte-1vo7cwi"}"><a rel="${"prefetch"}" href="${"lists/charities"}" class="${["svelte-1vo7cwi", segment === "charities" ? "selected" : ""].join(" ").trim()}">charities</a></li>
			<li class="${"svelte-1vo7cwi"}"><a rel="${"prefetch"}" href="${"lists/organizations"}" class="${["svelte-1vo7cwi", segment === "organizations" ? "selected" : ""].join(" ").trim()}">organizations</a></li>
		</ul>
	</nav>
</div>

<div class="${"list-wrap svelte-1vo7cwi"}">
	<br>

	${$$slots.default ? $$slots.default({}) : ``}

	<br>
	<br>
</div>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});

/* src/routes/lists/index.svelte generated by Svelte v3.18.1 */

const Lists = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `Index`;
});

/* src/routes/lists/organizations.svelte generated by Svelte v3.18.1 */

const Organizations = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let organizations = [];

	onMount(async () => {
		await new Promise(r => setTimeout(r, 1000));
		const orgs = await api.getOrganizations();
		organizations = new Array(1).fill(orgs).reduce((a, o) => a.concat(...o), []);
	});

	return `${validate_component(ListItems, "ListItems").$$render($$result, { items: organizations }, {}, {})}`;
});

/* src/routes/lists/charities.svelte generated by Svelte v3.18.1 */

const Charities = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let chariries = [];

	onMount(async () => {
		await new Promise(r => setTimeout(r, 1000));
		const chars = await api.getCharities();
		chariries = new Array(5).fill(chars).reduce((a, o) => a.concat(...o), []);
	});

	return `${validate_component(ListItems, "ListItems").$$render($$result, { items: chariries }, {}, {})}`;
});

/* src/routes/map.svelte generated by Svelte v3.18.1 */

const Map_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let organizations = [];

	return `${($$result.head += `${($$result.title = `<title>Charitify - Map of organizations.</title>`, "")}`, "")}





${validate_component(Map$1, "Map").$$render($$result, {}, {}, {
		default: () => `
    ${each(organizations, o => `${validate_component(MapMarker, "MapMarker").$$render($$result, { lat: o.location.lat, lng: o.location.lng }, {}, {})}`)}
`
	})}`;
});

/* src/routes/_icons.svelte generated by Svelte v3.18.1 */

const Icons = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<section>
    <svg style="${"display: none"}">

        
        <symbol id="${"ico-heart-filled"}" class="${"ico-heart-filled"}" viewBox="${"0 0 32 29.6"}">
            <path stroke="${"none"}" d="${"M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2\n\tc6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z"}"></path>
        </symbol>


        <symbol id="${"ico-moon"}" viewBox="${"0 0 1280.000000 1074.000000"}">
            <g transform="${"translate(0.000000,1074.000000) scale(0.100000,-0.100000)"}">
                <path d="${"M7280 10683 c122 -106 456 -448 564 -578 826 -994 1265 -2198 1266 -3465 0 -1147 -384 -2295 -1075 -3215 -295 -393 -683 -779 -1075 -1073 -800 -599 -1791 -976 -2760 -1052 -80 -6 -167 -14 -193 -18 l-49 -7 114 -91 c1044 -834 2358 -1254 3671 -1173 1734 106 3304 1033 4227 2494 347 549 599 1177 724 1805 76 381 99 618 100 1040 1 363 -7 488 -49 780 -186 1284 -817 2442 -1795 3295 -973 850 -2226 1315 -3535 1315 l-200 -1 65 -56z"}"></path>
                <path d="${"M4371 8892 c-62 -116 -98 -172 -109 -172 -39 -1 -354 -38 -358 -43 -3 -3 53 -66 125 -141 72 -75 131 -139 131 -143 -1 -5 -18 -90 -39 -190 -21 -101 -37 -183 -35 -183 3 0 79 36 171 80 91 44 171 80 177 80 6 0 84 -43 174 -94 89 -52 162 -88 162 -82 0 7 -11 93 -25 192 -14 98 -25 180 -25 181 0 1 64 59 141 129 119 108 139 129 123 136 -11 4 -95 21 -188 38 -93 16 -170 31 -171 32 -1 2 -33 71 -70 153 -37 83 -73 161 -80 174 -12 23 -17 15 -104 -147z"}"></path>
                <path d="${"M610 8054 c-74 -102 -137 -190 -140 -194 -3 -5 -107 24 -230 64 -124 40 -227 72 -229 70 -2 -2 56 -85 128 -184 73 -100 135 -188 138 -195 3 -8 -52 -92 -124 -192 -71 -98 -133 -184 -138 -192 -9 -16 -23 -20 237 65 109 35 202 64 206 64 5 0 71 -86 148 -192 l139 -192 3 241 2 240 225 73 c123 41 222 76 219 79 -3 3 -103 38 -222 76 l-217 71 -5 242 -5 242 -135 -186z"}"></path>
                <path d="${"M4415 6023 c-126 -157 -233 -290 -237 -296 -6 -10 -94 21 -568 202 -85 32 -156 57 -158 56 -1 -1 25 -45 59 -96 77 -116 342 -520 352 -536 4 -7 -90 -132 -233 -309 -131 -164 -238 -299 -237 -301 2 -1 168 43 371 99 222 60 371 97 375 91 160 -247 415 -632 417 -631 1 2 10 174 20 383 9 209 18 381 18 382 1 1 161 45 356 98 195 54 361 100 368 104 8 5 -47 30 -140 65 -84 32 -243 92 -353 134 -110 41 -202 77 -204 78 -2 2 4 167 14 366 9 200 16 371 14 380 -3 11 -86 -86 -234 -269z"}"></path>
            </g>
        </symbol>
    </svg>
</section>`;
});

/* src/routes/_layout.svelte generated by Svelte v3.18.1 */

const Layout$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
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
${ error.stack
	? `<pre>${escape(error.stack)}</pre>`
	: ``}`;
});

// This file is generated by Sapper — do not edit it!

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
			// organization.svelte
			pattern: /^\/organization\/?$/,
			parts: [
				{ name: "organization", file: "organization.svelte", component: Organization }
			]
		},

		{
			// charity.svelte
			pattern: /^\/charity\/?$/,
			parts: [
				{ name: "charity", file: "charity.svelte", component: Charity }
			]
		},

		{
			// lists/index.svelte
			pattern: /^\/lists\/?$/,
			parts: [
				{ name: "lists__layout", file: "lists/_layout.svelte", component: Layout },
				{ name: "lists", file: "lists/index.svelte", component: Lists }
			]
		},

		{
			// lists/organizations.svelte
			pattern: /^\/lists\/organizations\/?$/,
			parts: [
				{ name: "lists__layout", file: "lists/_layout.svelte", component: Layout },
				{ name: "lists_organizations", file: "lists/organizations.svelte", component: Organizations }
			]
		},

		{
			// lists/charities.svelte
			pattern: /^\/lists\/charities\/?$/,
			parts: [
				{ name: "lists__layout", file: "lists/_layout.svelte", component: Layout },
				{ name: "lists_charities", file: "lists/charities.svelte", component: Charities }
			]
		},

		{
			// map.svelte
			pattern: /^\/map\/?$/,
			parts: [
				{ name: "map", file: "map.svelte", component: Map_1 }
			]
		}
	],

	root: Layout$1,
	root_preload: () => {},
	error: Error$1
};

const build_dir = "__sapper__/dev";

const src_dir = "src";

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

/* src/node_modules/@sapper/internal/App.svelte generated by Svelte v3.18.1 */

const App = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { stores } = $$props;
	let { error } = $$props;
	let { status } = $$props;
	let { segments } = $$props;
	let { level0 } = $$props;
	let { level1 = null } = $$props;
	let { level2 = null } = $$props;
	setContext(CONTEXT_KEY, stores);
	if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0) $$bindings.stores(stores);
	if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);
	if ($$props.status === void 0 && $$bindings.status && status !== void 0) $$bindings.status(status);
	if ($$props.segments === void 0 && $$bindings.segments && segments !== void 0) $$bindings.segments(segments);
	if ($$props.level0 === void 0 && $$bindings.level0 && level0 !== void 0) $$bindings.level0(level0);
	if ($$props.level1 === void 0 && $$bindings.level1 && level1 !== void 0) $$bindings.level1(level1);
	if ($$props.level2 === void 0 && $$bindings.level2 && level2 !== void 0) $$bindings.level2(level2);

	return `


${validate_component(Layout$1, "Layout").$$render($$result, Object.assign({ segment: segments[0] }, level0.props), {}, {
		default: () => `
	${error
		? `${validate_component(Error$1, "Error").$$render($$result, { error, status }, {}, {})}`
		: `${validate_component(level1.component || missing_component, "svelte:component").$$render($$result, Object.assign({ segment: segments[1] }, level1.props), {}, {
				default: () => `
			${level2
				? `${validate_component(level2.component || missing_component, "svelte:component").$$render($$result, Object.assign(level2.props), {}, {})}`
				: ``}
		`
			})}`}
`
	})}`;
});

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
	const get_build_info =  () => JSON.parse(fs.readFileSync(path.join(build_dir, 'build.json'), 'utf-8'))
		;

	const template =  () => read_template(src_dir)
		;

	const has_service_worker = fs.existsSync(path.join(build_dir, 'service-worker.js'));

	const { server_routes, pages } = manifest;
	const error_route = manifest.error;

	function bail(req, res, err) {
		console.error(err);

		const message =  escape_html(err.message) ;

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
		res.setHeader('Cache-Control',  'no-cache' );

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

function escape_html(html) {
	const chars = {
		'"' : 'quot',
		"'": '#39',
		'&': 'amp',
		'<' : 'lt',
		'>' : 'gt'
	};

	return html.replace(/["'&<>]/g, c => `&${chars[c]};`);
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
			cache_control:  'no-cache' 
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

	const read =  (file) => fs.readFileSync(path.resolve(build_dir, file))
		;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL01hcC9jb250ZXh0LmpzIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvTWFwL01hcC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9NYXAvTWFwTWFya2VyLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy91dGlscy5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0ljb24uc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvUmF0ZS5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9JbnB1dC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9QaWN0dXJlLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0F2YXRhci5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9CdXR0b24uc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRGl2aWRlci5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9Qcm9ncmVzcy5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9DYXJvdXNlbC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9IZWFkZXIuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvRm9vdGVyLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL0NvbW1lbnQuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvQXZhdGFyQW5kTmFtZS5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9MaXN0SXRlbXMuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvQ2hhcml0eUNhcmQuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvQ2hhcml0eUNhcmRzLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL1RpdGxlU3ViVGl0bGUuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvTGlzdE9mRmVhdHVyZXMuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL2FwaS5qcyIsIi4uLy4uLy4uL3NyYy9yb3V0ZXMvb3JnYW5pemF0aW9uLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9yb3V0ZXMvY2hhcml0eS5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvcm91dGVzL2xpc3RzL19sYXlvdXQuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL3JvdXRlcy9saXN0cy9vcmdhbml6YXRpb25zLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9yb3V0ZXMvbGlzdHMvY2hhcml0aWVzLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9yb3V0ZXMvbWFwLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9yb3V0ZXMvX2xheW91dC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvcm91dGVzL19lcnJvci5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbm9kZV9tb2R1bGVzL0BzYXBwZXIvaW50ZXJuYWwvbWFuaWZlc3Qtc2VydmVyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdmVsdGUvc3RvcmUvaW5kZXgubWpzIiwiLi4vLi4vLi4vc3JjL25vZGVfbW9kdWxlcy9Ac2FwcGVyL2ludGVybmFsL3NoYXJlZC5tanMiLCIuLi8uLi8uLi9zcmMvbm9kZV9tb2R1bGVzL0BzYXBwZXIvaW50ZXJuYWwvQXBwLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9ub2RlX21vZHVsZXMvQHNhcHBlci9zZXJ2ZXIubWpzIiwiLi4vLi4vLi4vc3JjL3NlcnZlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBub29wKCkgeyB9XG5jb25zdCBpZGVudGl0eSA9IHggPT4geDtcbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKVxuICAgICAgICB0YXJba10gPSBzcmNba107XG4gICAgcmV0dXJuIHRhcjtcbn1cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoc3RvcmUgIT0gbnVsbCAmJiB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIC4uLmNhbGxiYWNrcykge1xuICAgIGlmIChzdG9yZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub29wO1xuICAgIH1cbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZSguLi5jYWxsYmFja3MpO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAodHlwZW9mICQkc2NvcGUuZGlydHkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiBleGNsdWRlX2ludGVybmFsX3Byb3BzKHByb3BzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoa1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdWx0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIG9uY2UoZm4pIHtcbiAgICBsZXQgcmFuID0gZmFsc2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGlmIChyYW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgIGZuLmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIG51bGxfdG9fZW1wdHkodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfc3RvcmVfdmFsdWUoc3RvcmUsIHJldCwgdmFsdWUgPSByZXQpIHtcbiAgICBzdG9yZS5zZXQodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59XG5jb25zdCBoYXNfcHJvcCA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xuZnVuY3Rpb24gYWN0aW9uX2Rlc3Ryb3llcihhY3Rpb25fcmVzdWx0KSB7XG4gICAgcmV0dXJuIGFjdGlvbl9yZXN1bHQgJiYgaXNfZnVuY3Rpb24oYWN0aW9uX3Jlc3VsdC5kZXN0cm95KSA/IGFjdGlvbl9yZXN1bHQuZGVzdHJveSA6IG5vb3A7XG59XG5cbmNvbnN0IGlzX2NsaWVudCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xubGV0IG5vdyA9IGlzX2NsaWVudFxuICAgID8gKCkgPT4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpXG4gICAgOiAoKSA9PiBEYXRlLm5vdygpO1xubGV0IHJhZiA9IGlzX2NsaWVudCA/IGNiID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShjYikgOiBub29wO1xuLy8gdXNlZCBpbnRlcm5hbGx5IGZvciB0ZXN0aW5nXG5mdW5jdGlvbiBzZXRfbm93KGZuKSB7XG4gICAgbm93ID0gZm47XG59XG5mdW5jdGlvbiBzZXRfcmFmKGZuKSB7XG4gICAgcmFmID0gZm47XG59XG5cbmNvbnN0IHRhc2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gcnVuX3Rhc2tzKG5vdykge1xuICAgIHRhc2tzLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGlmICghdGFzay5jKG5vdykpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgICAgIHRhc2suZigpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRhc2tzLnNpemUgIT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xufVxuLyoqXG4gKiBGb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5IVxuICovXG5mdW5jdGlvbiBjbGVhcl9sb29wcygpIHtcbiAgICB0YXNrcy5jbGVhcigpO1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHRhc2sgdGhhdCBydW5zIG9uIGVhY2ggcmFmIGZyYW1lXG4gKiB1bnRpbCBpdCByZXR1cm5zIGEgZmFsc3kgdmFsdWUgb3IgaXMgYWJvcnRlZFxuICovXG5mdW5jdGlvbiBsb29wKGNhbGxiYWNrKSB7XG4gICAgbGV0IHRhc2s7XG4gICAgaWYgKHRhc2tzLnNpemUgPT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHByb21pc2U6IG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgICAgICAgdGFza3MuYWRkKHRhc2sgPSB7IGM6IGNhbGxiYWNrLCBmOiBmdWxmaWxsIH0pO1xuICAgICAgICB9KSxcbiAgICAgICAgYWJvcnQoKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfZWFjaChpdGVyYXRpb25zLCBkZXRhY2hpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnNbaV0pXG4gICAgICAgICAgICBpdGVyYXRpb25zW2ldLmQoZGV0YWNoaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBlbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cbmZ1bmN0aW9uIGVsZW1lbnRfaXMobmFtZSwgaXMpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lLCB7IGlzIH0pO1xufVxuZnVuY3Rpb24gb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcyhvYmosIGV4Y2x1ZGUpIHtcbiAgICBjb25zdCB0YXJnZXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gb2JqKSB7XG4gICAgICAgIGlmIChoYXNfcHJvcChvYmosIGspXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAmJiBleGNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0YXJnZXRba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHN2Z19lbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5hbWUpO1xufVxuZnVuY3Rpb24gdGV4dChkYXRhKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xufVxuZnVuY3Rpb24gc3BhY2UoKSB7XG4gICAgcmV0dXJuIHRleHQoJyAnKTtcbn1cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICAgIHJldHVybiB0ZXh0KCcnKTtcbn1cbmZ1bmN0aW9uIGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBwcmV2ZW50X2RlZmF1bHQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzdG9wX3Byb3BhZ2F0aW9uKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNlbGYoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcylcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMobm9kZS5fX3Byb3RvX18pO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2NyaXB0b3JzW2tleV0gJiYgZGVzY3JpcHRvcnNba2V5XS5zZXQpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB4bGlua19hdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRfYmluZGluZ19ncm91cF92YWx1ZShncm91cCkge1xuICAgIGNvbnN0IHZhbHVlID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoZ3JvdXBbaV0uY2hlY2tlZClcbiAgICAgICAgICAgIHZhbHVlLnB1c2goZ3JvdXBbaV0uX192YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyB1bmRlZmluZWQgOiArdmFsdWU7XG59XG5mdW5jdGlvbiB0aW1lX3Jhbmdlc190b19hcnJheShyYW5nZXMpIHtcbiAgICBjb25zdCBhcnJheSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGFycmF5LnB1c2goeyBzdGFydDogcmFuZ2VzLnN0YXJ0KGkpLCBlbmQ6IHJhbmdlcy5lbmQoaSkgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbn1cbmZ1bmN0aW9uIGNoaWxkcmVuKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xufVxuZnVuY3Rpb24gY2xhaW1fZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcywgc3ZnKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVOYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICBsZXQgaiA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBub2RlLmF0dHJpYnV0ZXNbal07XG4gICAgICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZXNbYXR0cmlidXRlLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdmcgPyBzdmdfZWxlbWVudChuYW1lKSA6IGVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSAnJyArIGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0KGRhdGEpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0LmRhdGEgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlICE9IG51bGwgfHwgaW5wdXQudmFsdWUpIHtcbiAgICAgICAgaW5wdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdHlwZShpbnB1dCwgdHlwZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBpZiAob3B0aW9uLl9fdmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbnMoc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IH52YWx1ZS5pbmRleE9mKG9wdGlvbi5fX3ZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3RfdmFsdWUoc2VsZWN0KSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRfb3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJykgfHwgc2VsZWN0Lm9wdGlvbnNbMF07XG4gICAgcmV0dXJuIHNlbGVjdGVkX29wdGlvbiAmJiBzZWxlY3RlZF9vcHRpb24uX192YWx1ZTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9tdWx0aXBsZV92YWx1ZShzZWxlY3QpIHtcbiAgICByZXR1cm4gW10ubWFwLmNhbGwoc2VsZWN0LnF1ZXJ5U2VsZWN0b3JBbGwoJzpjaGVja2VkJyksIG9wdGlvbiA9PiBvcHRpb24uX192YWx1ZSk7XG59XG5mdW5jdGlvbiBhZGRfcmVzaXplX2xpc3RlbmVyKGVsZW1lbnQsIGZuKSB7XG4gICAgaWYgKGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBvYmplY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvYmplY3QnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IGhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvaW50ZXItZXZlbnRzOiBub25lOyB6LWluZGV4OiAtMTsnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgb2JqZWN0LnR5cGUgPSAndGV4dC9odG1sJztcbiAgICBvYmplY3QudGFiSW5kZXggPSAtMTtcbiAgICBsZXQgd2luO1xuICAgIG9iamVjdC5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIHdpbiA9IG9iamVjdC5jb250ZW50RG9jdW1lbnQuZGVmYXVsdFZpZXc7XG4gICAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmbik7XG4gICAgfTtcbiAgICBpZiAoL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChvYmplY3QpO1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob2JqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2FuY2VsOiAoKSA9PiB7XG4gICAgICAgICAgICB3aW4gJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIgJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2hpbGQob2JqZWN0KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmZ1bmN0aW9uIHF1ZXJ5X3NlbGVjdG9yX2FsbChzZWxlY3RvciwgcGFyZW50ID0gZG9jdW1lbnQuYm9keSkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59XG5jbGFzcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihodG1sLCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIHRoaXMuZSA9IGVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmEgPSBhbmNob3I7XG4gICAgICAgIHRoaXMudShodG1sKTtcbiAgICB9XG4gICAgbSh0YXJnZXQsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydCh0YXJnZXQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnQgPSB0YXJnZXQ7XG4gICAgfVxuICAgIHUoaHRtbCkge1xuICAgICAgICB0aGlzLmUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgdGhpcy5uID0gQXJyYXkuZnJvbSh0aGlzLmUuY2hpbGROb2Rlcyk7XG4gICAgfVxuICAgIHAoaHRtbCkge1xuICAgICAgICB0aGlzLmQoKTtcbiAgICAgICAgdGhpcy51KGh0bWwpO1xuICAgICAgICB0aGlzLm0odGhpcy50LCB0aGlzLmEpO1xuICAgIH1cbiAgICBkKCkge1xuICAgICAgICB0aGlzLm4uZm9yRWFjaChkZXRhY2gpO1xuICAgIH1cbn1cblxubGV0IHN0eWxlc2hlZXQ7XG5sZXQgYWN0aXZlID0gMDtcbmxldCBjdXJyZW50X3J1bGVzID0ge307XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcbiAgICBsZXQgaGFzaCA9IDUzODE7XG4gICAgbGV0IGkgPSBzdHIubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSBeIHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBoYXNoID4+PiAwO1xufVxuZnVuY3Rpb24gY3JlYXRlX3J1bGUobm9kZSwgYSwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNlLCBmbiwgdWlkID0gMCkge1xuICAgIGNvbnN0IHN0ZXAgPSAxNi42NjYgLyBkdXJhdGlvbjtcbiAgICBsZXQga2V5ZnJhbWVzID0gJ3tcXG4nO1xuICAgIGZvciAobGV0IHAgPSAwOyBwIDw9IDE7IHAgKz0gc3RlcCkge1xuICAgICAgICBjb25zdCB0ID0gYSArIChiIC0gYSkgKiBlYXNlKHApO1xuICAgICAgICBrZXlmcmFtZXMgKz0gcCAqIDEwMCArIGAleyR7Zm4odCwgMSAtIHQpfX1cXG5gO1xuICAgIH1cbiAgICBjb25zdCBydWxlID0ga2V5ZnJhbWVzICsgYDEwMCUgeyR7Zm4oYiwgMSAtIGIpfX1cXG59YDtcbiAgICBjb25zdCBuYW1lID0gYF9fc3ZlbHRlXyR7aGFzaChydWxlKX1fJHt1aWR9YDtcbiAgICBpZiAoIWN1cnJlbnRfcnVsZXNbbmFtZV0pIHtcbiAgICAgICAgaWYgKCFzdHlsZXNoZWV0KSB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZSA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgICAgICAgIHN0eWxlc2hlZXQgPSBzdHlsZS5zaGVldDtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50X3J1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogYGB9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpXG4gICAgICAgIC5zcGxpdCgnLCAnKVxuICAgICAgICAuZmlsdGVyKG5hbWVcbiAgICAgICAgPyBhbmltID0+IGFuaW0uaW5kZXhPZihuYW1lKSA8IDAgLy8gcmVtb3ZlIHNwZWNpZmljIGFuaW1hdGlvblxuICAgICAgICA6IGFuaW0gPT4gYW5pbS5pbmRleE9mKCdfX3N2ZWx0ZScpID09PSAtMSAvLyByZW1vdmUgYWxsIFN2ZWx0ZSBhbmltYXRpb25zXG4gICAgKVxuICAgICAgICAuam9pbignLCAnKTtcbiAgICBpZiAobmFtZSAmJiAhLS1hY3RpdmUpXG4gICAgICAgIGNsZWFyX3J1bGVzKCk7XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgaSA9IHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgc3R5bGVzaGVldC5kZWxldGVSdWxlKGkpO1xuICAgICAgICBjdXJyZW50X3J1bGVzID0ge307XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9hbmltYXRpb24obm9kZSwgZnJvbSwgZm4sIHBhcmFtcykge1xuICAgIGlmICghZnJvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChmcm9tLmxlZnQgPT09IHRvLmxlZnQgJiYgZnJvbS5yaWdodCA9PT0gdG8ucmlnaHQgJiYgZnJvbS50b3AgPT09IHRvLnRvcCAmJiBmcm9tLmJvdHRvbSA9PT0gdG8uYm90dG9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86IHNob3VsZCB0aGlzIGJlIHNlcGFyYXRlZCBmcm9tIGRlc3RydWN0dXJpbmc/IE9yIHN0YXJ0L2VuZCBhZGRlZCB0byBwdWJsaWMgYXBpIGFuZCBkb2N1bWVudGF0aW9uP1xuICAgIHN0YXJ0OiBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOlxuICAgIGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbiwgdGljayA9IG5vb3AsIGNzcyB9ID0gZm4obm9kZSwgeyBmcm9tLCB0byB9LCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIGxldCBuYW1lO1xuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICBuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWxheSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpO1xuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgaWYgKCFzdGFydGVkICYmIG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcbiAgICAgICAgICAgIGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgc3RhcnQoKTtcbiAgICB0aWNrKDAsIDEpO1xuICAgIHJldHVybiBzdG9wO1xufVxuZnVuY3Rpb24gZml4X3Bvc2l0aW9uKG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKHN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHN0eWxlLnBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gc3R5bGU7XG4gICAgICAgIGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgYWRkX3RyYW5zZm9ybShub2RlLCBhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpIHtcbiAgICBjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoYS5sZWZ0ICE9PSBiLmxlZnQgfHwgYS50b3AgIT09IGIudG9wKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtID09PSAnbm9uZScgPyAnJyA6IHN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgbm9kZS5zdHlsZS50cmFuc2Zvcm0gPSBgJHt0cmFuc2Zvcm19IHRyYW5zbGF0ZSgke2EubGVmdCAtIGIubGVmdH1weCwgJHthLnRvcCAtIGIudG9wfXB4KWA7XG4gICAgfVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb25gKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5iZWZvcmVfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5hZnRlcl91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuKGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG5jb25zdCBzZWVuX2NhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzLnNoaWZ0KCk7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpXG4gICAgICAgICAgICBiaW5kaW5nX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgICAgICAvLyB0aGVuLCBvbmNlIGNvbXBvbmVudHMgYXJlIHVwZGF0ZWQsIGNhbGxcbiAgICAgICAgLy8gYWZ0ZXJVcGRhdGUgZnVuY3Rpb25zLiBUaGlzIG1heSBjYXVzZVxuICAgICAgICAvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlbmRlcl9jYWxsYmFja3NbaV07XG4gICAgICAgICAgICBpZiAoIXNlZW5fY2FsbGJhY2tzLmhhcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICAvLyAuLi5zbyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGxvb3BzXG4gICAgICAgICAgICAgICAgc2Vlbl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9IHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgd2hpbGUgKGZsdXNoX2NhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgZmx1c2hfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgfVxuICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbiAgICBzZWVuX2NhbGxiYWNrcy5jbGVhcigpO1xufVxuZnVuY3Rpb24gdXBkYXRlKCQkKSB7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICQkLnVwZGF0ZSgpO1xuICAgICAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgICAgICBjb25zdCBkaXJ0eSA9ICQkLmRpcnR5O1xuICAgICAgICAkJC5kaXJ0eSA9IFstMV07XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LnAoJCQuY3R4LCBkaXJ0eSk7XG4gICAgICAgICQkLmFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xuICAgIH1cbn1cblxubGV0IHByb21pc2U7XG5mdW5jdGlvbiB3YWl0KCkge1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xufVxuZnVuY3Rpb24gZGlzcGF0Y2gobm9kZSwgZGlyZWN0aW9uLCBraW5kKSB7XG4gICAgbm9kZS5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudChgJHtkaXJlY3Rpb24gPyAnaW50cm8nIDogJ291dHJvJ30ke2tpbmR9YCkpO1xufVxuY29uc3Qgb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5sZXQgb3V0cm9zO1xuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuICAgIG91dHJvcyA9IHtcbiAgICAgICAgcjogMCxcbiAgICAgICAgYzogW10sXG4gICAgICAgIHA6IG91dHJvcyAvLyBwYXJlbnQgZ3JvdXBcbiAgICB9O1xufVxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuICAgIGlmICghb3V0cm9zLnIpIHtcbiAgICAgICAgcnVuX2FsbChvdXRyb3MuYyk7XG4gICAgfVxuICAgIG91dHJvcyA9IG91dHJvcy5wO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9pbihibG9jaywgbG9jYWwpIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2suaSkge1xuICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICBibG9jay5pKGxvY2FsKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX291dChibG9jaywgbG9jYWwsIGRldGFjaCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2subykge1xuICAgICAgICBpZiAob3V0cm9pbmcuaGFzKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgb3V0cm9pbmcuYWRkKGJsb2NrKTtcbiAgICAgICAgb3V0cm9zLmMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFjaClcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZCgxKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYmxvY2subyhsb2NhbCk7XG4gICAgfVxufVxuY29uc3QgbnVsbF90cmFuc2l0aW9uID0geyBkdXJhdGlvbjogMCB9O1xuZnVuY3Rpb24gY3JlYXRlX2luX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gZmFsc2U7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB1aWQgPSAwO1xuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MsIHVpZCsrKTtcbiAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBpZiAodGFzaylcbiAgICAgICAgICAgIHRhc2suYWJvcnQoKTtcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ3N0YXJ0JykpO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHRydWUsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFydCgpIHtcbiAgICAgICAgICAgIGlmIChzdGFydGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbihnbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbnZhbGlkYXRlKCkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX291dF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGNvbnN0IGdyb3VwID0gb3V0cm9zO1xuICAgIGdyb3VwLnIgKz0gMTtcbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMSwgMCwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ3N0YXJ0JykpO1xuICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEtLWdyb3VwLnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCByZXN1bHQgaW4gYGVuZCgpYCBiZWluZyBjYWxsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGNsZWFuIHVwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwoZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSAtIHQsIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICBnbygpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdvKCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGVuZChyZXNldCkge1xuICAgICAgICAgICAgaWYgKHJlc2V0ICYmIGNvbmZpZy50aWNrKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnRpY2soMSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMsIGludHJvKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHQgPSBpbnRybyA/IDAgOiAxO1xuICAgIGxldCBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBhbmltYXRpb25fbmFtZSA9IG51bGw7XG4gICAgZnVuY3Rpb24gY2xlYXJfYW5pbWF0aW9uKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluaXQocHJvZ3JhbSwgZHVyYXRpb24pIHtcbiAgICAgICAgY29uc3QgZCA9IHByb2dyYW0uYiAtIHQ7XG4gICAgICAgIGR1cmF0aW9uICo9IE1hdGguYWJzKGQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTogdCxcbiAgICAgICAgICAgIGI6IHByb2dyYW0uYixcbiAgICAgICAgICAgIGQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0YXJ0OiBwcm9ncmFtLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBwcm9ncmFtLnN0YXJ0ICsgZHVyYXRpb24sXG4gICAgICAgICAgICBncm91cDogcHJvZ3JhbS5ncm91cFxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbyhiKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSB7XG4gICAgICAgICAgICBzdGFydDogbm93KCkgKyBkZWxheSxcbiAgICAgICAgICAgIGJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgcHJvZ3JhbS5ncm91cCA9IG91dHJvcztcbiAgICAgICAgICAgIG91dHJvcy5yICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgYW4gaW50cm8sIGFuZCB0aGVyZSdzIGEgZGVsYXksIHdlIG5lZWQgdG8gZG9cbiAgICAgICAgICAgIC8vIGFuIGluaXRpYWwgdGljayBhbmQvb3IgYXBwbHkgQ1NTIGFuaW1hdGlvbiBpbW1lZGlhdGVseVxuICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYilcbiAgICAgICAgICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIGIsICdzdGFydCcpKTtcbiAgICAgICAgICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocGVuZGluZ19wcm9ncmFtICYmIG5vdyA+IHBlbmRpbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHBlbmRpbmdfcHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ3N0YXJ0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBydW5uaW5nX3Byb2dyYW0uYiwgcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uLCAwLCBlYXNpbmcsIGNvbmZpZy5jc3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQgPSBydW5uaW5nX3Byb2dyYW0uYiwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgZG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0uYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnRybyDigJQgd2UgY2FuIHRpZHkgdXAgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvdXRybyDigJQgbmVlZHMgdG8gYmUgY29vcmRpbmF0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEtLXJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuX2FsbChydW5uaW5nX3Byb2dyYW0uZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwID0gbm93IC0gcnVubmluZ19wcm9ncmFtLnN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdCA9IHJ1bm5pbmdfcHJvZ3JhbS5hICsgcnVubmluZ19wcm9ncmFtLmQgKiBlYXNpbmcocCAvIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gISEocnVubmluZ19wcm9ncmFtIHx8IHBlbmRpbmdfcHJvZ3JhbSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBydW4oYikge1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVuZCgpIHtcbiAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGhhbmRsZV9wcm9taXNlKHByb21pc2UsIGluZm8pIHtcbiAgICBjb25zdCB0b2tlbiA9IGluZm8udG9rZW4gPSB7fTtcbiAgICBmdW5jdGlvbiB1cGRhdGUodHlwZSwgaW5kZXgsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGluZm8udG9rZW4gIT09IHRva2VuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpbmZvLnJlc29sdmVkID0gdmFsdWU7XG4gICAgICAgIGxldCBjaGlsZF9jdHggPSBpbmZvLmN0eDtcbiAgICAgICAgaWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjaGlsZF9jdHggPSBjaGlsZF9jdHguc2xpY2UoKTtcbiAgICAgICAgICAgIGNoaWxkX2N0eFtrZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmxvY2sgPSB0eXBlICYmIChpbmZvLmN1cnJlbnQgPSB0eXBlKShjaGlsZF9jdHgpO1xuICAgICAgICBsZXQgbmVlZHNfZmx1c2ggPSBmYWxzZTtcbiAgICAgICAgaWYgKGluZm8uYmxvY2spIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmJsb2Nrcykge1xuICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzLmZvckVhY2goKGJsb2NrLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9PSBpbmRleCAmJiBibG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBfb3V0cm9zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tfb3V0cm9zKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGluZm8uYmxvY2suZCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICAgICAgYmxvY2subShpbmZvLm1vdW50KCksIGluZm8uYW5jaG9yKTtcbiAgICAgICAgICAgIG5lZWRzX2ZsdXNoID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLmJsb2NrID0gYmxvY2s7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrcylcbiAgICAgICAgICAgIGluZm8uYmxvY2tzW2luZGV4XSA9IGJsb2NrO1xuICAgICAgICBpZiAobmVlZHNfZmx1c2gpIHtcbiAgICAgICAgICAgIGZsdXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzX3Byb21pc2UocHJvbWlzZSkpIHtcbiAgICAgICAgY29uc3QgY3VycmVudF9jb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKHZhbHVlID0+IHtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjdXJyZW50X2NvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjdXJyZW50X2NvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby5jYXRjaCwgMiwgaW5mby5lcnJvciwgZXJyb3IpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8ucGVuZGluZykge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8ucGVuZGluZywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby50aGVuKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSBwcm9taXNlO1xuICAgIH1cbn1cblxuY29uc3QgZ2xvYmFscyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2tleXMoY3R4LCBsaXN0LCBnZXRfY29udGV4dCwgZ2V0X2tleSkge1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKSk7XG4gICAgICAgIGlmIChrZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBoYXZlIGR1cGxpY2F0ZSBrZXlzIGluIGEga2V5ZWQgZWFjaGApO1xuICAgICAgICB9XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciA9IC9bXFxzJ1wiPi89XFx1e0ZERDB9LVxcdXtGREVGfVxcdXtGRkZFfVxcdXtGRkZGfVxcdXsxRkZGRX1cXHV7MUZGRkZ9XFx1ezJGRkZFfVxcdXsyRkZGRn1cXHV7M0ZGRkV9XFx1ezNGRkZGfVxcdXs0RkZGRX1cXHV7NEZGRkZ9XFx1ezVGRkZFfVxcdXs1RkZGRn1cXHV7NkZGRkV9XFx1ezZGRkZGfVxcdXs3RkZGRX1cXHV7N0ZGRkZ9XFx1ezhGRkZFfVxcdXs4RkZGRn1cXHV7OUZGRkV9XFx1ezlGRkZGfVxcdXtBRkZGRX1cXHV7QUZGRkZ9XFx1e0JGRkZFfVxcdXtCRkZGRn1cXHV7Q0ZGRkV9XFx1e0NGRkZGfVxcdXtERkZGRX1cXHV7REZGRkZ9XFx1e0VGRkZFfVxcdXtFRkZGRn1cXHV7RkZGRkV9XFx1e0ZGRkZGfVxcdXsxMEZGRkV9XFx1ezEwRkZGRn1dL3U7XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNhdHRyaWJ1dGVzLTJcbi8vIGh0dHBzOi8vaW5mcmEuc3BlYy53aGF0d2cub3JnLyNub25jaGFyYWN0ZXJcbmZ1bmN0aW9uIHNwcmVhZChhcmdzLCBjbGFzc2VzX3RvX2FkZCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCAuLi5hcmdzKTtcbiAgICBpZiAoY2xhc3Nlc190b19hZGQpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyA9IGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyArPSAnICcgKyBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RyID0gJyc7XG4gICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgaWYgKGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLnRlc3QobmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKVxuICAgICAgICAgICAgc3RyICs9IFwiIFwiICsgbmFtZTtcbiAgICAgICAgZWxzZSBpZiAoYm9vbGVhbl9hdHRyaWJ1dGVzLmhhcyhuYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpXG4gICAgICAgICAgICAgICAgc3RyICs9IFwiIFwiICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgKz0gYCAke25hbWV9PVwiJHtTdHJpbmcodmFsdWUpLnJlcGxhY2UoL1wiL2csICcmIzM0OycpLnJlcGxhY2UoLycvZywgJyYjMzk7Jyl9XCJgO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IGVzY2FwZWQgPSB7XG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmIzM5OycsXG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnXG59O1xuZnVuY3Rpb24gZXNjYXBlKGh0bWwpIHtcbiAgICByZXR1cm4gU3RyaW5nKGh0bWwpLnJlcGxhY2UoL1tcIicmPD5dL2csIG1hdGNoID0+IGVzY2FwZWRbbWF0Y2hdKTtcbn1cbmZ1bmN0aW9uIGVhY2goaXRlbXMsIGZuKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3RyICs9IGZuKGl0ZW1zW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IG1pc3NpbmdfY29tcG9uZW50ID0ge1xuICAgICQkcmVuZGVyOiAoKSA9PiAnJ1xufTtcbmZ1bmN0aW9uIHZhbGlkYXRlX2NvbXBvbmVudChjb21wb25lbnQsIG5hbWUpIHtcbiAgICBpZiAoIWNvbXBvbmVudCB8fCAhY29tcG9uZW50LiQkcmVuZGVyKSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnc3ZlbHRlOmNvbXBvbmVudCcpXG4gICAgICAgICAgICBuYW1lICs9ICcgdGhpcz17Li4ufSc7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgPCR7bmFtZX0+IGlzIG5vdCBhIHZhbGlkIFNTUiBjb21wb25lbnQuIFlvdSBtYXkgbmVlZCB0byByZXZpZXcgeW91ciBidWlsZCBjb25maWcgdG8gZW5zdXJlIHRoYXQgZGVwZW5kZW5jaWVzIGFyZSBjb21waWxlZCwgcmF0aGVyIHRoYW4gaW1wb3J0ZWQgYXMgcHJlLWNvbXBpbGVkIG1vZHVsZXNgKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGRlYnVnKGZpbGUsIGxpbmUsIGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgY29uc29sZS5sb2coYHtAZGVidWd9ICR7ZmlsZSA/IGZpbGUgKyAnICcgOiAnJ30oJHtsaW5lfToke2NvbHVtbn0pYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKHZhbHVlcyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIHJldHVybiAnJztcbn1cbmxldCBvbl9kZXN0cm95O1xuZnVuY3Rpb24gY3JlYXRlX3Nzcl9jb21wb25lbnQoZm4pIHtcbiAgICBmdW5jdGlvbiAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpIHtcbiAgICAgICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgICAgICBjb25zdCAkJCA9IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3ksXG4gICAgICAgICAgICBjb250ZXh0OiBuZXcgTWFwKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSksXG4gICAgICAgICAgICAvLyB0aGVzZSB3aWxsIGJlIGltbWVkaWF0ZWx5IGRpc2NhcmRlZFxuICAgICAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKVxuICAgICAgICB9O1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoeyAkJCB9KTtcbiAgICAgICAgY29uc3QgaHRtbCA9IGZuKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cyk7XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcjogKHByb3BzID0ge30sIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICAgICAgb25fZGVzdHJveSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyB0aXRsZTogJycsIGhlYWQ6ICcnLCBjc3M6IG5ldyBTZXQoKSB9O1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9ICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIHt9LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJ1bl9hbGwob25fZGVzdHJveSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IEFycmF5LmZyb20ocmVzdWx0LmNzcykubWFwKGNzcyA9PiBjc3MuY29kZSkuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbnVsbCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoZWFkOiByZXN1bHQudGl0bGUgKyByZXN1bHQuaGVhZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgJCRyZW5kZXJcbiAgICB9O1xufVxuZnVuY3Rpb24gYWRkX2F0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IChib29sZWFuICYmICF2YWx1ZSkpXG4gICAgICAgIHJldHVybiAnJztcbiAgICByZXR1cm4gYCAke25hbWV9JHt2YWx1ZSA9PT0gdHJ1ZSA/ICcnIDogYD0ke3R5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeShlc2NhcGUodmFsdWUpKSA6IGBcIiR7dmFsdWV9XCJgfWB9YDtcbn1cbmZ1bmN0aW9uIGFkZF9jbGFzc2VzKGNsYXNzZXMpIHtcbiAgICByZXR1cm4gY2xhc3NlcyA/IGAgY2xhc3M9XCIke2NsYXNzZXN9XCJgIDogYGA7XG59XG5cbmZ1bmN0aW9uIGJpbmQoY29tcG9uZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGluZGV4ID0gY29tcG9uZW50LiQkLnByb3BzW25hbWVdO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudC4kJC5ib3VuZFtpbmRleF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtpbmRleF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZV9jb21wb25lbnQoYmxvY2spIHtcbiAgICBibG9jayAmJiBibG9jay5jKCk7XG59XG5mdW5jdGlvbiBjbGFpbV9jb21wb25lbnQoYmxvY2ssIHBhcmVudF9ub2Rlcykge1xuICAgIGJsb2NrICYmIGJsb2NrLmwocGFyZW50X25vZGVzKTtcbn1cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yKSB7XG4gICAgY29uc3QgeyBmcmFnbWVudCwgb25fbW91bnQsIG9uX2Rlc3Ryb3ksIGFmdGVyX3VwZGF0ZSB9ID0gY29tcG9uZW50LiQkO1xuICAgIGZyYWdtZW50ICYmIGZyYWdtZW50Lm0odGFyZ2V0LCBhbmNob3IpO1xuICAgIC8vIG9uTW91bnQgaGFwcGVucyBiZWZvcmUgdGhlIGluaXRpYWwgYWZ0ZXJVcGRhdGVcbiAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgY29uc3QgbmV3X29uX2Rlc3Ryb3kgPSBvbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICBpZiAob25fZGVzdHJveSkge1xuICAgICAgICAgICAgb25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgLy8gbW9zdCBsaWtlbHkgYXMgYSByZXN1bHQgb2YgYSBiaW5kaW5nIGluaXRpYWxpc2luZ1xuICAgICAgICAgICAgcnVuX2FsbChuZXdfb25fZGVzdHJveSk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50LiQkLm9uX21vdW50ID0gW107XG4gICAgfSk7XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgcHJvcF92YWx1ZXMgPSBvcHRpb25zLnByb3BzIHx8IHt9O1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkID0ge1xuICAgICAgICBmcmFnbWVudDogbnVsbCxcbiAgICAgICAgY3R4OiBudWxsLFxuICAgICAgICAvLyBzdGF0ZVxuICAgICAgICBwcm9wcyxcbiAgICAgICAgdXBkYXRlOiBub29wLFxuICAgICAgICBub3RfZXF1YWwsXG4gICAgICAgIGJvdW5kOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgLy8gbGlmZWN5Y2xlXG4gICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgb25fZGVzdHJveTogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSksXG4gICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICBkaXJ0eVxuICAgIH07XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIHByb3BfdmFsdWVzLCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmwoY2hpbGRyZW4ob3B0aW9ucy50YXJnZXQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50cm8pXG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGNvbXBvbmVudC4kJC5mcmFnbWVudCk7XG4gICAgICAgIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zLmFuY2hvcik7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgfVxuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbn1cbmxldCBTdmVsdGVFbGVtZW50O1xuaWYgKHR5cGVvZiBIVE1MRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIFN2ZWx0ZUVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy4kJC5zbG90dGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpc1thdHRyXSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgICAgICRkZXN0cm95KCkge1xuICAgICAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIFRPRE8gc2hvdWxkIHRoaXMgZGVsZWdhdGUgdG8gYWRkRXZlbnRMaXN0ZW5lcj9cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgJHNldCgpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRkZW4gYnkgaW5zdGFuY2UsIGlmIGl0IGhhcyBwcm9wc1xuICAgICAgICB9XG4gICAgfTtcbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICB9XG4gICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgICRzZXQoKSB7XG4gICAgICAgIC8vIG92ZXJyaWRkZW4gYnkgaW5zdGFuY2UsIGlmIGl0IGhhcyBwcm9wc1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hfZGV2KHR5cGUsIGRldGFpbCkge1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oeyB2ZXJzaW9uOiAnMy4xOC4xJyB9LCBkZXRhaWwpKSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTUluc2VydFwiLCB7IHRhcmdldCwgbm9kZSB9KTtcbiAgICBhcHBlbmQodGFyZ2V0LCBub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9kZXYodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01JbnNlcnRcIiwgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlXCIsIHsgbm9kZSB9KTtcbiAgICBkZXRhY2gobm9kZSk7XG59XG5mdW5jdGlvbiBkZXRhY2hfYmV0d2Vlbl9kZXYoYmVmb3JlLCBhZnRlcikge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2JlZm9yZV9kZXYoYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYWZ0ZXJfZGV2KGJlZm9yZSkge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxpc3Rlbl9kZXYobm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMsIGhhc19wcmV2ZW50X2RlZmF1bHQsIGhhc19zdG9wX3Byb3BhZ2F0aW9uKSB7XG4gICAgY29uc3QgbW9kaWZpZXJzID0gb3B0aW9ucyA9PT0gdHJ1ZSA/IFtcImNhcHR1cmVcIl0gOiBvcHRpb25zID8gQXJyYXkuZnJvbShPYmplY3Qua2V5cyhvcHRpb25zKSkgOiBbXTtcbiAgICBpZiAoaGFzX3ByZXZlbnRfZGVmYXVsdClcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3ByZXZlbnREZWZhdWx0Jyk7XG4gICAgaWYgKGhhc19zdG9wX3Byb3BhZ2F0aW9uKVxuICAgICAgICBtb2RpZmllcnMucHVzaCgnc3RvcFByb3BhZ2F0aW9uJyk7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NQWRkRXZlbnRMaXN0ZW5lclwiLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlRXZlbnRMaXN0ZW5lclwiLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgICAgIGRpc3Bvc2UoKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cl9kZXYobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZVwiLCB7IG5vZGUsIGF0dHJpYnV0ZSB9KTtcbiAgICBlbHNlXG4gICAgICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldEF0dHJpYnV0ZVwiLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldFByb3BlcnR5XCIsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gZGF0YXNldF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZS5kYXRhc2V0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldERhdGFzZXRcIiwgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YV9kZXYodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQuZGF0YSA9PT0gZGF0YSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldERhdGFcIiwgeyBub2RlOiB0ZXh0LCBkYXRhIH0pO1xuICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5jbGFzcyBTdmVsdGVDb21wb25lbnREZXYgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICghb3B0aW9ucy50YXJnZXQgJiYgIW9wdGlvbnMuJCRpbmxpbmUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCd0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uYCk7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIHN1cGVyLiRkZXN0cm95KCk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYENvbXBvbmVudCB3YXMgYWxyZWFkeSBkZXN0cm95ZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH07XG4gICAgfVxufVxuZnVuY3Rpb24gbG9vcF9ndWFyZCh0aW1lb3V0KSB7XG4gICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnQgPiB0aW1lb3V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEluZmluaXRlIGxvb3AgZGV0ZWN0ZWRgKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEh0bWxUYWcsIFN2ZWx0ZUNvbXBvbmVudCwgU3ZlbHRlQ29tcG9uZW50RGV2LCBTdmVsdGVFbGVtZW50LCBhY3Rpb25fZGVzdHJveWVyLCBhZGRfYXR0cmlidXRlLCBhZGRfY2xhc3NlcywgYWRkX2ZsdXNoX2NhbGxiYWNrLCBhZGRfbG9jYXRpb24sIGFkZF9yZW5kZXJfY2FsbGJhY2ssIGFkZF9yZXNpemVfbGlzdGVuZXIsIGFkZF90cmFuc2Zvcm0sIGFmdGVyVXBkYXRlLCBhcHBlbmQsIGFwcGVuZF9kZXYsIGFzc2lnbiwgYXR0ciwgYXR0cl9kZXYsIGJlZm9yZVVwZGF0ZSwgYmluZCwgYmluZGluZ19jYWxsYmFja3MsIGJsYW5rX29iamVjdCwgYnViYmxlLCBjaGVja19vdXRyb3MsIGNoaWxkcmVuLCBjbGFpbV9jb21wb25lbnQsIGNsYWltX2VsZW1lbnQsIGNsYWltX3NwYWNlLCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tcG9uZW50X3N1YnNjcmliZSwgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlc2NhcGUsIGVzY2FwZWQsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZ2V0Q29udGV4dCwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X3Nsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dCwgZ2V0X3NwcmVhZF9vYmplY3QsIGdldF9zcHJlYWRfdXBkYXRlLCBnZXRfc3RvcmVfdmFsdWUsIGdsb2JhbHMsIGdyb3VwX291dHJvcywgaGFuZGxlX3Byb21pc2UsIGhhc19wcm9wLCBpZGVudGl0eSwgaW5pdCwgaW5zZXJ0LCBpbnNlcnRfZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Z1bmN0aW9uLCBpc19wcm9taXNlLCBsaXN0ZW4sIGxpc3Rlbl9kZXYsIGxvb3AsIGxvb3BfZ3VhcmQsIG1pc3NpbmdfY29tcG9uZW50LCBtb3VudF9jb21wb25lbnQsIG5vb3AsIG5vdF9lcXVhbCwgbm93LCBudWxsX3RvX2VtcHR5LCBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzLCBvbkRlc3Ryb3ksIG9uTW91bnQsIG9uY2UsIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBwcmV2ZW50X2RlZmF1bHQsIHByb3BfZGV2LCBxdWVyeV9zZWxlY3Rvcl9hbGwsIHJhZiwgcnVuLCBydW5fYWxsLCBzYWZlX25vdF9lcXVhbCwgc2NoZWR1bGVfdXBkYXRlLCBzZWxlY3RfbXVsdGlwbGVfdmFsdWUsIHNlbGVjdF9vcHRpb24sIHNlbGVjdF9vcHRpb25zLCBzZWxlY3RfdmFsdWUsIHNlbGYsIHNldENvbnRleHQsIHNldF9hdHRyaWJ1dGVzLCBzZXRfY3VycmVudF9jb21wb25lbnQsIHNldF9jdXN0b21fZWxlbWVudF9kYXRhLCBzZXRfZGF0YSwgc2V0X2RhdGFfZGV2LCBzZXRfaW5wdXRfdHlwZSwgc2V0X2lucHV0X3ZhbHVlLCBzZXRfbm93LCBzZXRfcmFmLCBzZXRfc3RvcmVfdmFsdWUsIHNldF9zdHlsZSwgc2V0X3N2Z19hdHRyaWJ1dGVzLCBzcGFjZSwgc3ByZWFkLCBzdG9wX3Byb3BhZ2F0aW9uLCBzdWJzY3JpYmUsIHN2Z19lbGVtZW50LCB0ZXh0LCB0aWNrLCB0aW1lX3Jhbmdlc190b19hcnJheSwgdG9fbnVtYmVyLCB0b2dnbGVfY2xhc3MsIHRyYW5zaXRpb25faW4sIHRyYW5zaXRpb25fb3V0LCB1cGRhdGVfa2V5ZWRfZWFjaCwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9lYWNoX2tleXMsIHZhbGlkYXRlX3N0b3JlLCB4bGlua19hdHRyIH07XG4iLCJjb25zdCBjb250ZXh0TWFwYm94ID0ge31cblxuZXhwb3J0IHsgY29udGV4dE1hcGJveCB9XG4iLCI8c3R5bGU+XG4gICAgc2VjdGlvbiB7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICB9XG48L3N0eWxlPlxuXG48c2NyaXB0PlxuICAgIGltcG9ydCB7IG9uTW91bnQsIG9uRGVzdHJveSwgc2V0Q29udGV4dCwgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNvbnRleHRNYXBib3ggfSBmcm9tICcuL2NvbnRleHQnXG5cbiAgICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgICBleHBvcnQgbGV0IGNlbnRlciA9IFszMS4xNjU2LCA0OC4zNzk0XVxuICAgIGV4cG9ydCBsZXQgem9vbSA9IDMuNzVcblxuICAgIGxldCBtYXBcbiAgICBsZXQgY29udGFpbmVyXG5cbiAgICBzZXRDb250ZXh0KGNvbnRleHRNYXBib3gsIHtcbiAgICAgICAgZ2V0TWFwOiAoKSA9PiBtYXAsXG4gICAgICAgIGdldE1hcGJveDogKCkgPT4gd2luZG93Lm1hcGJveGdsXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIG9uQ3JlYXRlTWFwKCkge1xuICAgICAgICBtYXAgPSBuZXcgbWFwYm94Z2wuTWFwKHtcbiAgICAgICAgICAgIHpvb20sXG4gICAgICAgICAgICBjZW50ZXIsXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBzdHlsZTogJ21hcGJveDovL3N0eWxlcy9tYXBib3gvc3RyZWV0cy12MTEnLFxuICAgICAgICB9KVxuXG4gICAgICAgIG1hcC5vbignZHJhZ2VuZCcsICgpID0+IGRpc3BhdGNoKCdyZWNlbnRyZScsIHsgbWFwLCBjZW50ZXI6IG1hcC5nZXRDZW50ZXIoKSB9KSlcbiAgICAgICAgbWFwLm9uKCdsb2FkJywgKCkgPT4gZGlzcGF0Y2goJ3JlYWR5JywgbWFwKSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVNYXAoKSB7XG4gICAgICAgIGNvbnN0IHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgICAgIHNjcmlwdFRhZy50eXBlID0gJ3RleHQvamF2YXNjcmlwdCdcbiAgICAgICAgc2NyaXB0VGFnLnNyYyA9ICdodHRwczovL2FwaS5tYXBib3guY29tL21hcGJveC1nbC1qcy92MS43LjAvbWFwYm94LWdsLmpzJ1xuXG4gICAgICAgIGNvbnN0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJylcbiAgICAgICAgbGluay5yZWwgPSAnc3R5bGVzaGVldCdcbiAgICAgICAgbGluay5ocmVmID0gJ2h0dHBzOi8vYXBpLm1hcGJveC5jb20vbWFwYm94LWdsLWpzL3YxLjcuMC9tYXBib3gtZ2wuY3NzJ1xuXG4gICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0b2tlbiA9ICdway5leUoxSWpvaVluVmliR2xySWl3aVlTSTZJbU5yTlhweGR6Z3hiVEF3Tm5jemJHeHdlRzB3Y1RWM2NqQWlmUS5ydDFwZUxqQ1FIWlVrck00QVd6NU13J1xuICAgICAgICAgICAgbWFwYm94Z2wuYWNjZXNzVG9rZW4gPSB0b2tlblxuXG4gICAgICAgICAgICBsaW5rLm9ubG9hZCA9IG9uQ3JlYXRlTWFwXG5cbiAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluaylcbiAgICAgICAgfVxuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKVxuICAgIH1cblxuICAgIG9uTW91bnQoKCkgPT4ge1xuICAgICAgICBpZiAoJ21hcGJveGdsJyBpbiB3aW5kb3cpIHtcbiAgICAgICAgICAgIG9uQ3JlYXRlTWFwKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNyZWF0ZU1hcCgpXG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgb25EZXN0cm95KCgpID0+IHtcbiAgICAgICAgbWFwICYmIG1hcC5yZW1vdmUoKVxuICAgIH0pXG48L3NjcmlwdD5cblxuPHNlY3Rpb24gYmluZDp0aGlzPXtjb250YWluZXJ9PlxuICAgIHsjaWYgbWFwfVxuICAgICAgICA8c2xvdD48L3Nsb3Q+XG4gICAgey9pZn1cbjwvc2VjdGlvbj5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgZ2V0Q29udGV4dCB9IGZyb20gJ3N2ZWx0ZSdcbiAgICBpbXBvcnQgeyBjb250ZXh0TWFwYm94IH0gZnJvbSAnLi9jb250ZXh0J1xuXG4gICAgY29uc3QgeyBnZXRNYXAsIGdldE1hcGJveCB9ID0gZ2V0Q29udGV4dChjb250ZXh0TWFwYm94KVxuXG4gICAgY29uc3QgbWFwID0gZ2V0TWFwKClcbiAgICBjb25zdCBtYXBib3ggPSBnZXRNYXBib3goKVxuXG4gICAgZXhwb3J0IGxldCBsbmdcbiAgICBleHBvcnQgbGV0IGxhdFxuICAgIGV4cG9ydCBsZXQgbGFiZWwgPSAnbGFiZWwnXG5cbiAgICBjb25zdCBwb3B1cCA9IG5ldyBtYXBib3guUG9wdXAoeyBvZmZzZXQ6IDI1IH0pLnNldFRleHQobGFiZWwpXG5cbiAgICBjb25zdCBtYXJrZXIgPSBuZXcgbWFwYm94Lk1hcmtlcigpXG4gICAgICAgICAgICAuc2V0TG5nTGF0KFtsbmcsIGxhdF0pXG4gICAgICAgICAgICAuc2V0UG9wdXAocG9wdXApXG4gICAgICAgICAgICAuYWRkVG8obWFwKVxuPC9zY3JpcHQ+XG5cbiIsImV4cG9ydCB7IGRlZmF1bHQgYXMgY2xhc3NuYW1lcyB9IGZyb20gJ2NsYXNzbmFtZXMnXG5cbmV4cG9ydCBjb25zdCB0b0NTU1N0cmluZyA9IChzdHlsZXMgPSB7fSkgPT4gT2JqZWN0LmVudHJpZXMoc3R5bGVzKVxuICAuZmlsdGVyKChbX3Byb3BOYW1lLCBwcm9wVmFsdWVdKSA9PiBwcm9wVmFsdWUgIT09IHVuZGVmaW5lZCAmJiBwcm9wVmFsdWUgIT09IG51bGwpXG4gIC5yZWR1Y2UoKHN0eWxlU3RyaW5nLCBbcHJvcE5hbWUsIHByb3BWYWx1ZV0pID0+IHtcbiAgICBwcm9wTmFtZSA9IHByb3BOYW1lLnJlcGxhY2UoL1tBLVpdL2csIG1hdGNoID0+IGAtJHttYXRjaC50b0xvd2VyQ2FzZSgpfWApXG4gICAgcmV0dXJuIGAke3N0eWxlU3RyaW5nfSR7cHJvcE5hbWV9OiR7cHJvcFZhbHVlfTtgXG4gIH0sICcnKVxuXG4vKipcbiAqXG4gKiBAZnVuY3Rpb24gc2FmZUdldFxuICpcbiAqIEBkZXNjcmlwdGlvbiBTYWZlIGdldHRpbmcgb2YgYW4gYW55IHZhbHVlIG9mIGEgbmVzdGVkIG9iamVjdHMuXG4gKlxuICogQHBhcmFtIGV4cHJlc3Npb25GbiB7ZnVuY3Rpb259IC0gVGhlIGZ1bmN0aW9uIHdpdGggYW4gZXhwcmVzc2lvbiB3aGljaCByZXR1cm5zIHJlc3VsdCBvZiB0aGUgc2FmZSBnZXR0aW5nLlxuICogQHBhcmFtIGRlZmF1bHRWYWx1ZSB7YW55fSAtIFRoZSBkZWZhdWx0IHZhbHVlIHdoZW4gcmVzdWx0IGlzIHVuZGVmaW5lZC5cbiAqIEBwYXJhbSBpc0RlZmF1bHRUeXBlZCB7Ym9vbGVhbn0gLSBXaGV0ZXIgaXMgdGhlIHJlc3VsdCBmcm9tIGFuIGV4cHJlc3Npb24gbXVzdCBiZSB0aGUgc2FtZSB0eXBlIGFzIHRoZSBkZWZhdWx0IHZhbHVlLlxuICpcbiAqIEBleGFtcGxlc1xuICogLy8gU29tZSBkYXRhLlxuICogY29uc3QgdmVyeSA9IHtcbiAqICBuZXN0ZWQ6IHtcbiAqICAgb2JqZWN0OiBbe1xuICogICAgIHdpdGg6IHtcbiAqICAgICAgIGFycmF5czogJ3N0dWZmJ1xuICogICAgIH1cbiAqICAgfV1cbiAqICB9XG4gKiB9XG4gKlxuICogLy8gR2V0dGluZy5cbiAqIDEuIHNhZmVHZXQoKCkgPT4gdmVyeS5uZXN0ZWQub2JqZWN0WzBdLndpdGguYXJyYXlzKTtcbiAqIDIuIHNhZmVHZXQoKCkgPT4gdmVyeS5uZXN0ZWQub2JqZWN0WzBdLndpdGguYXJyYXlzLCB7IGRlZmF1bHQ6ICd2YWx1ZScgfSk7XG4gKiAzLiBzYWZlR2V0KCgpID0+IHZlcnkubmVzdGVkLm9iamVjdFswXS53aXRoLmFycmF5cywgeyBkZWZhdWx0OiAndmFsdWUnIH0sIHRydWUpO1xuICpcbiAqIC8vIFJldHVybi5cbiAqIDEuICdzdHVmZidcbiAqIDIuICdzdHVmZidcbiAqIDMuIHsgZGVmYXVsdDogJ3ZhbHVlJyB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYWZlR2V0KGV4cHJlc3Npb25GbiwgZGVmYXVsdFZhbHVlLCBpc0RlZmF1bHRUeXBlZCA9IGZhbHNlKSB7XG4gIC8vIENoZWNrIHdoZXRoZXIgYSBhbmQgYiBoYXZlIHRoZSBzYW1lIHR5cGUuICh1dGlsKVxuICBmdW5jdGlvbiBpc1NhbWVUeXBlKGEsIGIpIHtcbiAgICBjb25zdCBydWxlcyA9IFtcbiAgICAgIChhLCBiKSA9PiB0eXBlb2YgYSA9PT0gdHlwZW9mIGIsXG4gICAgICAoYSwgYikgPT4gKCthID09PSBhKSA9PT0gKCtiID09PSBiKSwgICAgICAgICAgICAgIC8vIHdoZXRoZXIgb25lIGlzIE5hTlxuICAgICAgKGEsIGIpID0+IChhID09PSBudWxsKSA9PT0gKGIgPT09IG51bGwpLCAgICAgICAgICAvLyBudWxsIGlzIG9iamVjdCB0eXBlIHRvb1xuICAgICAgKGEsIGIpID0+IEFycmF5LmlzQXJyYXkoYSkgPT09IEFycmF5LmlzQXJyYXkoYiksICAvLyBhcnJheSBpcyBvYmplY3QgdHlwZSB0b29cbiAgICBdXG4gICAgcmV0dXJuICFydWxlcy5zb21lKHJ1bGVGbiA9PiAhcnVsZUZuKGEsIGIpKVxuICB9XG4gIC8vIENvcmUgb2Ygc2FmZSBnZXR0aW5nLiBFeGVjdXRpbmcgYSBmdW5jdGlvbi4gRGVmYXVsdCB2YWx1ZXMuXG4gIGZ1bmN0aW9uIGdldChleHByZXNzaW9uRm4sIGRlZmF1bHRWYWx1ZSwgaXNEZWZhdWx0VHlwZWQpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZXhwcmVzc2lvbkZuLmNhbGwodGhpcylcbiAgICAgIGlmIChpc0RlZmF1bHRUeXBlZCkge1xuICAgICAgICByZXR1cm4gaXNTYW1lVHlwZShyZXN1bHQsIGRlZmF1bHRWYWx1ZSkgPyByZXN1bHQgOiBkZWZhdWx0VmFsdWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXN1bHQgPT09IHVuZGVmaW5lZCA/IGRlZmF1bHRWYWx1ZSA6IHJlc3VsdFxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBkZWZhdWx0VmFsdWVcbiAgICB9XG4gIH1cbiAgLy8gU2FmZSBnZXR0aW5nIG9mIHRoZSBleHByZXNzaW9uRm4uXG4gIGlmICh0eXBlb2YgZXhwcmVzc2lvbkZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGdldChleHByZXNzaW9uRm4sIGRlZmF1bHRWYWx1ZSwgaXNEZWZhdWx0VHlwZWQpXG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS53YXJuKCdZb3UgbmVlZCB0byB1c2UgYSBmdW5jdGlvbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQuJylcbiAgfVxuICByZXR1cm4gZGVmYXVsdFZhbHVlXG59XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMsIHRvQ1NTU3RyaW5nIH0gZnJvbSAnLi4vdXRpbHMnXG5cbiAgICBleHBvcnQgbGV0IHR5cGVcbiAgICBleHBvcnQgbGV0IGlzIC8vIHByaW1hcnl8d2FybmluZ3xkYW5nZXJ8bGlnaHR8ZGFya1xuICAgIGV4cG9ydCBsZXQgc2l6ZSA9ICdtZWRpdW0nIC8vIHNtYWxsfG1lZGl1bXxiaWdcbiAgICBleHBvcnQgbGV0IHJvdGF0ZSA9IDBcbiAgICBleHBvcnQgbGV0IHN0eWxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBpZCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGFyaWFMYWJlbCA9IHVuZGVmaW5lZFxuXG4gICAgbGV0IHRpdGxlUHJvcCA9IHRpdGxlIHx8IGFyaWFMYWJlbFxuICAgIGxldCBhcmlhTGFiZWxQcm9wID0gYXJpYUxhYmVsIHx8IHRpdGxlXG4gICAgbGV0IHN0eWxlUHJvcCA9IHRvQ1NTU3RyaW5nKHsgdHJhbnNmb3JtOiAhIXJvdGF0ZSA/IGByb3RhdGVaKCR7cm90YXRlfWRlZylgIDogbnVsbCwgLi4uc3R5bGUgfSlcblxuICAgICQ6ICBjbGFzc1Byb3AgPSBjbGFzc25hbWVzKCdpY28nLCBpcywgc2l6ZSwgJCRwcm9wcy5jbGFzcylcbjwvc2NyaXB0PlxuXG48c3ZnXG4gICAgICAgIHtpZH1cbiAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgc3R5bGU9e3N0eWxlUHJvcH1cbiAgICAgICAgYXJpYS1sYWJlbD17YXJpYUxhYmVsUHJvcH1cbj5cbiAgICA8dXNlIHhsaW5rOmhyZWY9e2AjaWNvLSR7dHlwZX1gfSBjbGFzcz1cImljby11c2VcIi8+XG48L3N2Zz5cblxuPHN0eWxlPlxuICAgIHN2ZyB7XG4gICAgICAgIGRpc3BsYXk6IGluaGVyaXQ7XG4gICAgfVxuXG4gICAgc3ZnLCBzdmcgKiB7XG4gICAgICAgIGZpbGw6IHJnYmEodmFyKC0tdGhlbWUtc3ZnLWZpbGwpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2JhKHZhcigtLXRoZW1lLXN2Zy1maWxsKSk7XG4gICAgfVxuXG4gICAgLyogLS0tLS0tLS0tLS0tPT09PT09PT09KCBTaXplICk9PT09PT09PT0tLS0tLS0tLS0tLS0gKi9cbiAgICAuc21hbGwge1xuICAgICAgICB3aWR0aDogMTVweDtcbiAgICAgICAgaGVpZ2h0OiAxNXB4O1xuICAgIH1cblxuICAgIC5tZWRpdW0ge1xuICAgICAgICB3aWR0aDogMjJweDtcbiAgICAgICAgaGVpZ2h0OiAyMnB4O1xuICAgIH1cblxuICAgIC5iaWcge1xuICAgICAgICB3aWR0aDogMzVweDtcbiAgICAgICAgaGVpZ2h0OiAzNXB4O1xuICAgIH1cblxuICAgIC8qIC0tLS0tLS0tLS0tLT09PT09PT09PSggQ29sb3IgKT09PT09PT09PS0tLS0tLS0tLS0tLSAqL1xuICAgIC5wcmltYXJ5LCAucHJpbWFyeSAqIHtcbiAgICAgICAgZmlsbDogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgIH1cblxuICAgIC53YXJuaW5nLCAud2FybmluZyAqIHtcbiAgICAgICAgZmlsbDogcmdiKHZhcigtLWNvbG9yLXdhcm5pbmcpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgIH1cblxuICAgIC5kYW5nZXIsIC5kYW5nZXIgKiB7XG4gICAgICAgIGZpbGw6IHJnYih2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuXG4gICAgLmluZm8sIC5pbmZvICoge1xuICAgICAgICBmaWxsOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgICAgICBzdHJva2U6IHJnYih2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuXG4gICAgLmxpZ2h0LCAubGlnaHQgKiB7XG4gICAgICAgIGZpbGw6IHZhcigtLWNvbG9yLWxpZ2h0LTEpO1xuICAgICAgICBzdHJva2U6IHZhcigtLWNvbG9yLWxpZ2h0LTEpO1xuICAgIH1cblxuICAgIC5kYXJrLCAuZGFyayAqIHtcbiAgICAgICAgZmlsbDogdmFyKC0tY29sb3ItZGFyay0xKTtcbiAgICAgICAgc3Ryb2tlOiB2YXIoLS1jb2xvci1kYXJrLTEpO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCBJY29uIGZyb20gJy4uL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUnXG5cbiAgICBleHBvcnQgbGV0IGlzID0gJ2RhbmdlcidcbiAgICBleHBvcnQgbGV0IHNpemUgPSAnbWVkaXVtJyAvLyBzbWFsbHxtZWRpdW18bWlnXG48L3NjcmlwdD5cblxuPHVsIGNsYXNzPVwicmF0ZVwiPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuPC91bD5cblxuPHN0eWxlPlxuICAgIC5yYXRlIHtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgIG1hcmdpbjogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAtMSAvIDMpO1xuICAgIH1cblxuICAgIGxpIHtcbiAgICAgICAgcGFkZGluZzogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgLyAzKTtcbiAgICB9XG5cbiAgICAucmF0ZSBsaSB7XG4gICAgICAgIC13ZWJraXQtZmlsdGVyOiBkcm9wLXNoYWRvdygtMXB4IDJweCAxcHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4yNSkpO1xuICAgICAgICBmaWx0ZXI6IGRyb3Atc2hhZG93KC0xcHggMnB4IDFweCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgLjI1KSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMsIHRvQ1NTU3RyaW5nIH0gZnJvbSAnLi4vdXRpbHMnXG5cbiAgICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgICBleHBvcnQgbGV0IG5hbWVcbiAgICBleHBvcnQgbGV0IHZhbHVlID0gJydcbiAgICBleHBvcnQgbGV0IHN0eWxlID0ge31cbiAgICBleHBvcnQgbGV0IHR5cGUgPSAndGV4dCdcbiAgICBleHBvcnQgbGV0IGlkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBhbGlnbiA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgbWF4bGVuZ3RoID0gMTAwMFxuICAgIGV4cG9ydCBsZXQgcm93cyA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgZGlzYWJsZWQgPSBmYWxzZVxuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGludmFsaWQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IG1pbiA9IHVuZGVmaW5lZCAvLyBTcGVjaWZpZXMgYSBtaW5pbXVtIHZhbHVlIGZvciBhbiA8aW5wdXQ+IGVsZW1lbnRcbiAgICBleHBvcnQgbGV0IG1heCA9IHVuZGVmaW5lZCAvLyBTcGVjaWZpZXMgdGhlIG1heGltdW0gdmFsdWUgZm9yIGFuIDxpbnB1dD4gZWxlbWVudFxuICAgIGV4cG9ydCBsZXQgbGlzdCA9IHVuZGVmaW5lZCAvLyBSZWZlcnMgdG8gYSA8ZGF0YWxpc3Q+IGVsZW1lbnQgdGhhdCBjb250YWlucyBwcmUtZGVmaW5lZCBvcHRpb25zIGZvciBhbiA8aW5wdXQ+IGVsZW1lbnRcbiAgICBleHBvcnQgbGV0IGZvcm0gPSB1bmRlZmluZWQgLy8gU3BlY2lmaWVzIHRoZSBmb3JtIHRoZSA8aW5wdXQ+IGVsZW1lbnQgYmVsb25ncyB0b1xuICAgIGV4cG9ydCBsZXQgcmVhZG9ubHkgPSB1bmRlZmluZWQgLy8gdW5kZWZpbmVkfHJlYWRvbmx5XG4gICAgZXhwb3J0IGxldCByZXF1aXJlZCA9IHVuZGVmaW5lZCAvLyB1bmRlZmluZWR8cmVxdWlyZWRcbiAgICBleHBvcnQgbGV0IHBhdHRlcm4gPSB1bmRlZmluZWQgLy8gU3BlY2lmaWVzIGEgcmVndWxhciBleHByZXNzaW9uIHRoYXQgYW4gPGlucHV0PiBlbGVtZW50J3MgdmFsdWUgaXMgY2hlY2tlZCBhZ2FpbnN0IChyZWdleHApXG4gICAgZXhwb3J0IGxldCBhdXRvY29tcGxldGUgPSB0cnVlIC8vIG9ufG9mZlxuICAgIGV4cG9ydCBsZXQgYXV0b3NlbGVjdCA9IGZhbHNlXG4gICAgZXhwb3J0IGxldCBhcmlhTGFiZWwgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHBsYWNlaG9sZGVyID0gdW5kZWZpbmVkXG5cbiAgICBsZXQgaWRQcm9wID0gaWQgfHwgbmFtZVxuICAgIGxldCB0eXBlUHJvcCA9IHR5cGUgPT09ICdudW1iZXInID8gJ3RleHQnIDogdHlwZVxuICAgIGxldCB0aXRsZVByb3AgPSB0aXRsZSB8fCBhcmlhTGFiZWwgfHwgcGxhY2Vob2xkZXJcbiAgICBsZXQgYXJpYUxhYmVsUHJvcCA9IGFyaWFMYWJlbCB8fCB0aXRsZSB8fCBwbGFjZWhvbGRlclxuICAgIGxldCBhdXRvY29tcGxldGVQcm9wID0gYXV0b2NvbXBsZXRlID8gJ29uJyA6ICdvZmYnXG4gICAgbGV0IHN0eWxlUHJvcCA9IHRvQ1NTU3RyaW5nKHsgLi4uc3R5bGUsIHRleHRBbGlnbjogYWxpZ24gfSlcbiAgICBsZXQgcGF0dGVyblByb3AgPSB0eXBlID09PSAnbnVtYmVyJyAmJiAhcGF0dGVybiA/ICdbMC05XSonIDogcGF0dGVyblxuXG4gICAgJDogY2xhc3NQcm9wID0gY2xhc3NuYW1lcygnaW5wJywgJCRwcm9wcy5jbGFzcywgeyBkaXNhYmxlZCwgcmVhZG9ubHksIHJlcXVpcmVkLCBpbnZhbGlkIH0pXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvbiBFbWl0IGNsaWNrIGFuZCBzZWxlY3QgY29udGVudCB3aGVuIFwiYXV0b3NlbGVjdFwiIGlzIGVuYWJsZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBOYXRpdmUgbW91c2UgZXZlbnQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gb25DbGljayhlKSB7XG4gICAgICAgICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImNsaWNrXCIsIGUpXG4gICAgICAgICFkaXNhYmxlZCAmJiBhdXRvc2VsZWN0ICYmIGUudGFyZ2V0LnNlbGVjdCgpXG4gICAgfVxuPC9zY3JpcHQ+XG5cbnsjaWYgcm93c31cbiAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgIHttaW59XG4gICAgICAgICAgICB7bWF4fVxuICAgICAgICAgICAge3Jvd3N9XG4gICAgICAgICAgICB7bmFtZX1cbiAgICAgICAgICAgIHtmb3JtfVxuICAgICAgICAgICAge2FsaWdufVxuICAgICAgICAgICAge3JlYWRvbmx5fVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAge3JlcXVpcmVkfVxuICAgICAgICAgICAge21heGxlbmd0aH1cbiAgICAgICAgICAgIHtwbGFjZWhvbGRlcn1cbiAgICAgICAgICAgIGlkPXtpZFByb3B9XG4gICAgICAgICAgICBjbGFzcz17Y2xhc3NQcm9wfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIHN0eWxlPXtzdHlsZVByb3B9XG4gICAgICAgICAgICBwYXR0ZXJuPXtwYXR0ZXJuUHJvcH1cbiAgICAgICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4gICAgICAgICAgICBhdXRvY29tcGxldGU9e2F1dG9jb21wbGV0ZVByb3B9XG4gICAgICAgICAgICB7Li4ueyB0eXBlOiB0eXBlUHJvcCB9fVxuICAgICAgICAgICAgYmluZDp2YWx1ZVxuICAgICAgICAgICAgb246Ymx1cj0ne2UgPT4gIWRpc2FibGVkICYmIGRpc3BhdGNoKFwiYmx1clwiLCBlKX0nXG4gICAgICAgICAgICBvbjpmb2N1cz0ne2UgPT4gIWRpc2FibGVkICYmIGRpc3BhdGNoKFwiZm9jdXNcIiwgZSl9J1xuICAgICAgICAgICAgb246Y2xpY2s9J3tvbkNsaWNrfSdcbiAgICA+PC90ZXh0YXJlYT5cbns6ZWxzZX1cbiAgICA8aW5wdXRcbiAgICAgICAgICAgIHttaW59XG4gICAgICAgICAgICB7bWF4fVxuICAgICAgICAgICAge25hbWV9XG4gICAgICAgICAgICB7bGlzdH1cbiAgICAgICAgICAgIHtmb3JtfVxuICAgICAgICAgICAge2FsaWdufVxuICAgICAgICAgICAge3JlYWRvbmx5fVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAge3JlcXVpcmVkfVxuICAgICAgICAgICAge21heGxlbmd0aH1cbiAgICAgICAgICAgIHtwbGFjZWhvbGRlcn1cbiAgICAgICAgICAgIGlkPXtpZFByb3B9XG4gICAgICAgICAgICBjbGFzcz17Y2xhc3NQcm9wfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIHN0eWxlPXtzdHlsZVByb3B9XG4gICAgICAgICAgICBwYXR0ZXJuPXtwYXR0ZXJuUHJvcH1cbiAgICAgICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4gICAgICAgICAgICBhdXRvY29tcGxldGU9e2F1dG9jb21wbGV0ZVByb3B9XG4gICAgICAgICAgICB7Li4ueyB0eXBlOiB0eXBlUHJvcCB9fVxuICAgICAgICAgICAgYmluZDp2YWx1ZVxuICAgICAgICAgICAgb246Ymx1cj0ne2UgPT4gIWRpc2FibGVkICYmIGRpc3BhdGNoKFwiYmx1clwiLCBlKX0nXG4gICAgICAgICAgICBvbjpmb2N1cz0ne2UgPT4gIWRpc2FibGVkICYmIGRpc3BhdGNoKFwiZm9jdXNcIiwgZSl9J1xuICAgICAgICAgICAgb246Y2xpY2s9J3tvbkNsaWNrfSdcbiAgICAvPlxuey9pZn1cblxuPHN0eWxlPlxuICAgIC5pbnAge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleDogMSAxIDA7XG4gICAgICAgIGNvbG9yOiBpbmhlcml0O1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgICAgICAgbWluLXdpZHRoOiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4yNSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICAgICAgYm94LXNoYWRvdzogaW5zZXQgdmFyKC0tc2hhZG93LXByaW1hcnkpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5LWluc2V0KTtcbiAgICB9XG5cbiAgICAuaW5wOmZvY3VzIHtcbiAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2IodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgIH1cblxuICAgIC5pbnA6aW52YWxpZCwgLmlucC5pbnZhbGlkIHtcbiAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcblxuICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAgIGV4cG9ydCBsZXQgc3JjXG4gICAgZXhwb3J0IGxldCBhbHRcbiAgICBleHBvcnQgbGV0IHNyY0JpZyA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaWQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHdpZHRoID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBoZWlnaHQgPSB1bmRlZmluZWRcblxuICAgIGxldCBsb2FkaW5nU3JjID0gdHJ1ZVxuICAgIGxldCBsb2FkaW5nU3JjQmlnID0gdHJ1ZVxuICAgIGxldCBpc0Vycm9yID0gZmFsc2VcblxuICAgICQ6IHdyYXBDbGFzc1Byb3AgPSBjbGFzc25hbWVzKCdwaWN0dXJlJywgJCRwcm9wcy5jbGFzcywgeyBsb2FkaW5nU3JjLCBsb2FkaW5nU3JjQmlnLCBpc0Vycm9yIH0pXG5cbiAgICBmdW5jdGlvbiBvbkxvYWRTcmMoZSkge1xuICAgICAgICBsb2FkaW5nU3JjID0gZmFsc2VcbiAgICAgICAgZGlzcGF0Y2goJ2xvYWQnLCBlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uRXJyb3JTcmMoZSkge1xuICAgICAgICBsb2FkaW5nU3JjID0gZmFsc2VcbiAgICAgICAgaXNFcnJvciA9IHRydWVcbiAgICAgICAgZGlzcGF0Y2goJ2Vycm9yJywgZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbkxvYWRTcmNCaWcoZSkge1xuICAgICAgICBsb2FkaW5nU3JjQmlnID0gZmFsc2VcbiAgICAgICAgZGlzcGF0Y2goJ2xvYWRCaWcnLCBlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uRXJyb3JTcmNCaWcoZSkge1xuICAgICAgICBsb2FkaW5nU3JjQmlnID0gZmFsc2VcbiAgICAgICAgaXNFcnJvciA9IHRydWVcbiAgICAgICAgZGlzcGF0Y2goJ2Vycm9yQmlnJywgZSlcbiAgICB9XG48L3NjcmlwdD5cblxuPGZpZ3VyZSBjbGFzcz17d3JhcENsYXNzUHJvcH0+XG4gICAgPGltZ1xuICAgICAgICAgICAge2lkfVxuICAgICAgICAgICAge2FsdH1cbiAgICAgICAgICAgIHtzcmN9XG4gICAgICAgICAgICB7d2lkdGh9XG4gICAgICAgICAgICB7aGVpZ2h0fVxuICAgICAgICAgICAgY2xhc3M9XCJwaWMgcGljLTF4XCJcbiAgICAgICAgICAgIG9uOmxvYWQ9e29uTG9hZFNyY31cbiAgICAgICAgICAgIG9uOmVycm9yPXtvbkVycm9yU3JjfVxuICAgIC8+XG4gICAgeyNpZiBzcmNCaWcgJiYgIWxvYWRpbmdTcmN9XG4gICAgICAgIDxpbWdcbiAgICAgICAgICAgICAgICB7YWx0fVxuICAgICAgICAgICAgICAgIHt3aWR0aH1cbiAgICAgICAgICAgICAgICB7aGVpZ2h0fVxuICAgICAgICAgICAgICAgIHNyYz17c3JjQmlnfVxuICAgICAgICAgICAgICAgIGNsYXNzPVwicGljIHBpYy0yeFwiXG4gICAgICAgICAgICAgICAgb246bG9hZD17b25Mb2FkU3JjQmlnfVxuICAgICAgICAgICAgICAgIG9uOmVycm9yPXtvbkVycm9yU3JjQmlnfVxuICAgICAgICAvPlxuICAgIHsvaWZ9XG4gICAgPGZpZ2NhcHRpb24+XG4gICAgICAgIDxzbG90Pjwvc2xvdD5cbiAgICA8L2ZpZ2NhcHRpb24+XG48L2ZpZ3VyZT5cblxuPHN0eWxlPlxuICAgIC5waWN0dXJlIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgIH1cblxuICAgIC5waWN0dXJlIC5waWMge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIG9iamVjdC1maXQ6IGNvdmVyO1xuICAgICAgICBvYmplY3QtcG9zaXRpb246IGNlbnRlcjtcbiAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAuM3MgZWFzZS1pbjtcbiAgICB9XG5cbiAgICAucGljdHVyZSAucGljLTJ4IHtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgfVxuXG4gICAgLnBpY3R1cmUubG9hZGluZ1NyYyAucGljLTF4LFxuICAgIC5waWN0dXJlLmxvYWRpbmdTcmNCaWcgLnBpYy0yeCB7XG4gICAgICAgIG9wYWNpdHk6IDA7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY2xhc3NuYW1lcyB9IGZyb20gJy4uL3V0aWxzJ1xuICAgIGltcG9ydCBQaWN0dXJlIGZyb20gJy4vUGljdHVyZS5zdmVsdGUnXG5cbiAgICBleHBvcnQgbGV0IHNyY1xuICAgIGV4cG9ydCBsZXQgYWx0XG4gICAgZXhwb3J0IGxldCBzaXplID0gJ21lZGl1bScgLy8gc21hbGx8bWVkaXVtfGJpZ1xuXG4gICAgJDogY2xhc3NQcm9wID0gY2xhc3NuYW1lcygnYXZhJywgc2l6ZSwgJCRwcm9wcy5jbGFzcylcbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPXtjbGFzc1Byb3B9PlxuICAgIDxQaWN0dXJlIHtzcmN9IGFsdD17YFBpY3R1cmU6ICR7YWx0fWB9Lz5cbjwvZGl2PlxuXG48c3R5bGU+XG4gICAgLmF2YSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC5zbWFsbCB7XG4gICAgICAgIHdpZHRoOiAyNXB4O1xuICAgICAgICBoZWlnaHQ6IDI1cHg7XG4gICAgfVxuICAgIC5tZWRpdW0ge1xuICAgICAgICB3aWR0aDogMzVweDtcbiAgICAgICAgaGVpZ2h0OiAzNXB4O1xuICAgIH1cbiAgICAuYmlnIHtcbiAgICAgICAgd2lkdGg6IDQ1cHg7XG4gICAgICAgIGhlaWdodDogNDVweDtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIsIG9uTW91bnQgfSBmcm9tICdzdmVsdGUnXG4gICAgaW1wb3J0IHsgY2xhc3NuYW1lcyB9IGZyb20gJy4uL3V0aWxzJ1xuXG4gICAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gICAgZXhwb3J0IGxldCBpcyA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaWQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGhyZWYgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGF1dG8gPSBmYWxzZVxuICAgIGV4cG9ydCBsZXQgdHlwZSA9ICdidXR0b24nXG4gICAgZXhwb3J0IGxldCBzaXplID0gJ21lZGl1bSdcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBodG1sRm9yID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBkaXNhYmxlZCA9IGZhbHNlXG4gICAgZXhwb3J0IGxldCBhcmlhTGFiZWwgPSB1bmRlZmluZWRcblxuICAgIGxldCB0aXRsZVByb3AgPSB0aXRsZSB8fCBhcmlhTGFiZWxcbiAgICBsZXQgYXJpYUxhYmVsUHJvcCA9IGFyaWFMYWJlbCB8fCB0aXRsZVxuXG4gICAgJDogY2xhc3NQcm9wID0gY2xhc3NuYW1lcygnYnRuJywgaXMsIHNpemUsICQkcHJvcHMuY2xhc3MsIHsgYXV0bywgZGlzYWJsZWQgfSlcblxuICAgIGZ1bmN0aW9uIG9uTGFiZWxDbGljayhlKSB7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGh0bWxGb3IpLmNsaWNrKClcbiAgICAgICAgIWRpc2FibGVkICYmIGRpc3BhdGNoKCdjbGljaycsIGUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25DbGljayhlKSB7XG4gICAgICAgICFkaXNhYmxlZCAmJiBkaXNwYXRjaCgnY2xpY2snLCBlKVxuICAgIH1cbjwvc2NyaXB0PlxuXG57I2lmIGhyZWZ9XG4gICAgPGFcbiAgICAgICAgICAgIHtpZH1cbiAgICAgICAgICAgIHtocmVmfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgb246Y2xpY2s9e29uQ2xpY2t9XG4gICAgPlxuICAgICAgICA8c2xvdD48L3Nsb3Q+XG4gICAgPC9hPlxuezplbHNlIGlmIGh0bWxGb3J9XG4gICAgPGxhYmVsXG4gICAgICAgICAgICB7aWR9XG4gICAgICAgICAgICB7ZGlzYWJsZWR9XG4gICAgICAgICAgICBmb3I9e2h0bWxGb3J9XG4gICAgICAgICAgICB0aXRsZT17dGl0bGVQcm9wfVxuICAgICAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4gICAgICAgICAgICBvbjpjbGljaz17b25MYWJlbENsaWNrfVxuICAgID5cbiAgICAgICAgPHNsb3Q+PC9zbG90PlxuICAgIDwvbGFiZWw+XG57OmVsc2V9XG4gICAgPGJ1dHRvblxuICAgICAgICAgICAge2lkfVxuICAgICAgICAgICAge3R5cGV9XG4gICAgICAgICAgICB7ZGlzYWJsZWR9XG4gICAgICAgICAgICB0aXRsZT17dGl0bGVQcm9wfVxuICAgICAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4gICAgICAgICAgICBvbjpjbGljaz17b25DbGlja31cbiAgICA+XG4gICAgICAgIDxzbG90Pjwvc2xvdD5cbiAgICA8L2J1dHRvbj5cbnsvaWZ9XG5cbjxzdHlsZT5cbiAgICAuYnRuOm5vdCguYXV0bykge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgICAgIHVzZXItc2VsZWN0OiBub25lO1xuICAgICAgICBwYWRkaW5nOiA1cHggMTVweDtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogM3B4O1xuICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS10aGVtZS1mb250LWNvbG9yKSk7XG4gICAgICAgIHRleHQtc2hhZG93OiAxcHggMXB4IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuMyk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuLnNtYWxsKSB7XG4gICAgICAgIHBhZGRpbmc6IDVweDtcbiAgICAgICAgbWluLXdpZHRoOiBjYWxjKHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKSAvIDEuNSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IGNhbGModmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpIC8gMS41KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4ubWVkaXVtKSB7XG4gICAgICAgIHBhZGRpbmc6IDVweCAxMHB4O1xuICAgICAgICBtaW4td2lkdGg6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICAgICAgbWluLWhlaWdodDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bi5iaWcpIHtcbiAgICAgICAgcGFkZGluZzogNXB4IDE1cHg7XG4gICAgICAgIG1pbi13aWR0aDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgKiAxLjUpO1xuICAgICAgICBtaW4taGVpZ2h0OiBjYWxjKHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKSAqIDEuNSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuOmZvY3VzKSB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjEpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bjpob3Zlcikge1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4yKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuOmFjdGl2ZSkge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMXB4KTtcbiAgICAgICAgYm94LXNoYWRvdzogMCAxcHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMik7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjEpO1xuICAgIH1cblxuICAgIC8qIFN1Y2Nlc3MgKi9cblxuICAgIC5idG4uc3VjY2VzcyB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3Itc3VjY2Vzcy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi5zdWNjZXNzOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSwgLjg1KTtcbiAgICB9XG5cbiAgICAuYnRuLnN1Y2Nlc3M6aG92ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMXB4KTtcbiAgICAgICAgYm94LXNoYWRvdzogMCAycHggcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSksIHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAuYnRuLnN1Y2Nlc3M6YWN0aXZlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDJweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMXB4IHJnYmEodmFyKC0tY29sb3Itc3VjY2Vzcy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgIH1cblxuICAgIC8qIFdhcm5pbmcgKi9cblxuICAgIC5idG4ud2FybmluZyB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci13YXJuaW5nKSk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3Itd2FybmluZy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi53YXJuaW5nOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci13YXJuaW5nKSwgLjg1KTtcbiAgICB9XG5cbiAgICAuYnRuLndhcm5pbmc6aG92ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMXB4KTtcbiAgICAgICAgYm94LXNoYWRvdzogMCAycHggcmdiYSh2YXIoLS1jb2xvci13YXJuaW5nLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSksIHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAuYnRuLndhcm5pbmc6YWN0aXZlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDJweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMXB4IHJnYmEodmFyKC0tY29sb3Itd2FybmluZy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgIH1cblxuICAgIC8qIERhbmdlciAqL1xuXG4gICAgLmJ0bi5kYW5nZXIge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSksIHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAuYnRuLmRhbmdlcjpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSwgLjg1KTtcbiAgICB9XG5cbiAgICAuYnRuLmRhbmdlcjpob3ZlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgxcHgpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLWRhbmdlci1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi5kYW5nZXI6YWN0aXZlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDJweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMXB4IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgfVxuXG5cbiAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkge1xuICAgICAgICA6Z2xvYmFsKC5idG4pIHtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDJweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4uc3VjY2VzcyB7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDNweCByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MtZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLmJ0bi53YXJuaW5nIHtcbiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgM3B4IHJnYmEodmFyKC0tY29sb3Itd2FybmluZy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLmRhbmdlciB7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDNweCByZ2JhKHZhcigtLWNvbG9yLWRhbmdlci1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIH1cbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyB0b0NTU1N0cmluZywgY2xhc3NuYW1lcyB9IGZyb20gJy4uL3V0aWxzJ1xuXG4gICAgZXhwb3J0IGxldCBpcyA9ICdpbmZvJ1xuICAgIGV4cG9ydCBsZXQgc2l6ZSA9IDBcbiAgICBleHBvcnQgbGV0IHdpZHRoID0gMlxuXG4gICAgJDogY2xhc3NQcm9wID0gY2xhc3NuYW1lcygnZGl2aWRlcicsIGlzLCAkJHByb3BzLmNsYXNzKVxuICAgICQ6IHN0eWxlUHJvcCA9IHRvQ1NTU3RyaW5nKHsgcGFkZGluZzogYCR7c2l6ZSAvIDJ9cHggMGAsIGhlaWdodDogYCR7d2lkdGh9cHhgIH0pXG48L3NjcmlwdD5cblxuPGhyIGNsYXNzPXtjbGFzc1Byb3B9IHN0eWxlPXtzdHlsZVByb3B9PlxuXG48c3R5bGU+XG4gICAgLmRpdmlkZXIge1xuICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgYm94LXNpemluZzogY29udGVudC1ib3g7XG4gICAgICAgIGJhY2tncm91bmQtY2xpcDogY29udGVudC1ib3g7XG4gICAgfVxuXG4gICAgLmluZm8ge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgIH1cblxuICAgIC5zdWNjZXNzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG5cbiAgICAud2FybmluZyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci13YXJuaW5nKSk7XG4gICAgfVxuXG4gICAgLmRhbmdlciB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIsIG9uTW91bnQgfSBmcm9tICdzdmVsdGUnXG4gICAgaW1wb3J0IHsgY2xhc3NuYW1lcywgc2FmZUdldCB9IGZyb20gJy4uL3V0aWxzJ1xuXG4gICAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gICAgZXhwb3J0IGxldCBpZCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgdmFsdWUgPSAwIC8vIDAgLSAxMDBcbiAgICBleHBvcnQgbGV0IHNpemUgPSAnbWVkaXVtJ1xuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGFyaWFMYWJlbCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgYm9yZGVyUmFkaXVzID0gdW5kZWZpbmVkXG5cbiAgICAkOiB2YWwgPSAwXG4gICAgJDogdGl0bGVQcm9wID0gdGl0bGUgfHwgYFByb2dyZXNzIC0gJHt2YWx9JWBcbiAgICAkOiBhcmlhTGFiZWxQcm9wID0gYXJpYUxhYmVsIHx8IGBQcm9ncmVzcyAtICR7dmFsfSVgXG4gICAgJDogY2xhc3NQcm9wID0gY2xhc3NuYW1lcygncHJvZ3Jlc3MnLCBzaXplLCAkJHByb3BzLmNsYXNzKVxuXG4gICAgb25Nb3VudCgoKSA9PiB7XG4gICAgICAgIC8vIE1ha2UgbG9hZGluZyBwcm9ncmVzcyBlZmZlY3Qgb24gbW91bnQgY29tcG9uZW50LlxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHZhbCA9IE51bWJlci5pc0Zpbml0ZSgrdmFsdWUpID8gTWF0aC5tYXgoMCwgTWF0aC5taW4oK3ZhbHVlLCAxMDApKSA6IDAsIDApXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIGdldEJvcmRlclJhZGl1cyhib3JkZXJzLCBkZWZhdWx0cyA9ICc5OTk5OXB4Jykge1xuICAgICAgICBjb25zdCBickRlZmF1bHQgPSBuZXcgQXJyYXkoNCkuZmlsbChkZWZhdWx0cylcbiAgICAgICAgY29uc3QgYmRzID0gc2FmZUdldCgoKSA9PiBib3JkZXJzLnNwbGl0KCcgJyksIFtdLCB0cnVlKVxuICAgICAgICBjb25zdCBydWxlID0gJ2JvcmRlci1yYWRpdXMnXG4gICAgICAgIHJldHVybiBgJHtydWxlfToke2JyRGVmYXVsdC5tYXAoKGRlZiwgaSkgPT4gYCR7YmRzW2ldIHx8IGRlZn1gKS5qb2luKCcgJyl9YFxuICAgIH1cbjwvc2NyaXB0PlxuXG5cbjxkaXZcbiAgICAgICAge2lkfVxuICAgICAgICBjbGFzcz17Y2xhc3NQcm9wfVxuICAgICAgICB0aXRsZT17dGl0bGVQcm9wfVxuICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICByb2xlPVwicHJvZ3Jlc3NiYXJcIlxuICAgICAgICBhcmlhLXZhbHVlbWluPVwiMFwiXG4gICAgICAgIGFyaWEtdmFsdWVtYXg9XCIxMDBcIlxuICAgICAgICBhcmlhLXZhbHVlbm93PXt2YWx9XG4gICAgICAgIHN0eWxlPXtgJHtnZXRCb3JkZXJSYWRpdXMoYm9yZGVyUmFkaXVzKX1gfVxuPlxuICAgIDxkaXYgY2xhc3M9XCJwcm9ncmVzcy1pbm5lci1mcmFtZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtY29yZVwiIHN0eWxlPXtgd2lkdGg6JHt2YWx9JWB9PjwvZGl2PlxuICAgIDwvZGl2PlxuPC9kaXY+XG5cbjxzdHlsZT5cbiAgICAucHJvZ3Jlc3Mge1xuICAgICAgICAtLXByb2dyZXNzLWhlaWdodDogMjBweDtcbiAgICAgICAgLS1wcm9ncmVzcy1wYWRkaW5nLXBvaW50OiAzO1xuICAgIH1cblxuICAgIC5wcm9ncmVzcy5zbWFsbCB7XG4gICAgICAgIC0tcHJvZ3Jlc3MtaGVpZ2h0OiAxNXB4O1xuICAgICAgICAtLXByb2dyZXNzLXBhZGRpbmctcG9pbnQ6IDM7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzLm1lZGl1bSB7XG4gICAgICAgIC0tcHJvZ3Jlc3MtaGVpZ2h0OiAyMHB4O1xuICAgICAgICAtLXByb2dyZXNzLXBhZGRpbmctcG9pbnQ6IDMuNTtcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3MuYmlnIHtcbiAgICAgICAgLS1wcm9ncmVzcy1oZWlnaHQ6IDMwcHg7XG4gICAgICAgIC0tcHJvZ3Jlc3MtcGFkZGluZy1wb2ludDogNDtcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3Mge1xuICAgICAgICBmbGV4OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogOTk5OXB4O1xuICAgICAgICBoZWlnaHQ6IHZhcigtLXByb2dyZXNzLWhlaWdodCk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICAgICAgcGFkZGluZzogY2FsYyh2YXIoLS1wcm9ncmVzcy1oZWlnaHQpIC8gdmFyKC0tcHJvZ3Jlc3MtcGFkZGluZy1wb2ludCkpO1xuICAgICAgICBib3gtc2hhZG93OiBpbnNldCB2YXIoLS1zaGFkb3ctcHJpbWFyeSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnktaW5zZXQpO1xuICAgIH1cblxuICAgIC5wcm9ncmVzcy1pbm5lci1mcmFtZSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDk5OTlweDtcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3MtY29yZSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIHRyYW5zaXRpb246IDFzIGVhc2UtaW4tb3V0O1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAycHg7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCBQaWN0dXJlIGZyb20gJy4vUGljdHVyZS5zdmVsdGUnXG5cbiAgICBjb25zdCBjYXJkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAvMzAvdGVjaCcsXG4gICAgICAgICAgICB0aXRsZTogJ1RoZSBtYWluIHRpdGxlIGFuZCBzaG9ydCBkZXNjcmlwdGlvbi4nLFxuICAgICAgICAgICAgcGVyY2VudDogNDUsXG4gICAgICAgICAgICBvcmdIZWFkOiAnVGluYSBLYW5kZWxha2knLFxuICAgICAgICAgICAgb3JnSGVhZFNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwLzMwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdPUkcgY2hhcml0eSBvZiBDaGFyaXRpZnkuJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAvMzAvYXJjaCcsXG4gICAgICAgICAgICB0aXRsZTogJ1NlY29uZCBiaWdnZXIgbWFqb3IgY2FyZCB0aXRsZSBsaW5lIHdpdGggYSBiaXQgbG9uZ2VyIGRlc2NyaXB0aW9uLicsXG4gICAgICAgICAgICBwZXJjZW50OiA2NSxcbiAgICAgICAgICAgIG9yZ0hlYWQ6ICdUaW5hIEthbmRlbGFraScsXG4gICAgICAgICAgICBvcmdIZWFkU3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAvMzAvcGVvcGxlJyxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbjogJ09SRyBjaGFyaXR5IG9mIENoYXJpdGlmeS4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMC8zMC9hbnknLFxuICAgICAgICAgICAgdGl0bGU6ICdUaGUgbWFpbiB0aXRsZSBhbmQgc2hvcnQgZGVzY3JpcHRpb24uJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDUsXG4gICAgICAgICAgICBvcmdIZWFkOiAnVGluYXJhbWlzaW11c3MgS2FuZGVsYWtpbnVza2FzJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMC8zMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIGNoYXJpdHkgb2YgQ2hhcml0aWZ5LicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwLzMwL25hdHVyZScsXG4gICAgICAgICAgICB0aXRsZTogJ1RoZSBtYWluIHRpdGxlIGFuZCBzaG9ydCBkZXNjcmlwdGlvbi4nLFxuICAgICAgICAgICAgcGVyY2VudDogOTUsXG4gICAgICAgICAgICBvcmdIZWFkOiAnVGluYSBLYW5kZWxha2knLFxuICAgICAgICAgICAgb3JnSGVhZFNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwLzMwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdPUkcgZ2lhbnQgY2hhcml0eSBvcmdhbml6YXRpb24gb2YgYmlnIENoYXJpdGlmeSBjb21wYW55LicsXG4gICAgICAgIH0sXG4gICAgXVxuXG4gICAgY29uc3QgaW1hZ2VzRGVmYXVsdCA9IGNhcmRzLm1hcChjYXJkID0+ICh7XG4gICAgICAgIHNyYzogW2NhcmQuc3JjLCBjYXJkLnNyYywgY2FyZC5zcmNdLFxuICAgICAgICBhbHQ6IGNhcmQudGl0bGUsXG4gICAgfSkpXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXIgfCB7XG4gICAgICogICAgIHNyYzogc3RyaW5nLFxuICAgICAqICAgICBzcmNCaWc6IHN0cmluZyxcbiAgICAgKiAgICAgYWx0OiBzdHJpbmcsXG4gICAgICogICAgIG9uQ2xpY2s/OiBmdW5jdGlvbixcbiAgICAgKiB9W119XG4gICAgICovXG4gICAgZXhwb3J0IGxldCBpdGVtcyA9IGltYWdlc0RlZmF1bHRcbjwvc2NyaXB0PlxuXG48dWwgYXJpYS1sYWJlbD1cImNhcm91c2VsXCI+XG4gICAgeyNlYWNoIGl0ZW1zIGFzIGl0ZW19XG4gICAgICAgIDxsaT5cbiAgICAgICAgICAgIDxzbG90IHtpdGVtfT5cbiAgICAgICAgICAgICAgICA8UGljdHVyZSB7Li4uaXRlbX0vPlxuICAgICAgICAgICAgPC9zbG90PlxuICAgICAgICA8L2xpPlxuICAgIHsvZWFjaH1cbjwvdWw+XG5cbjxzdHlsZT5cbiAgICB1bCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgICAgICBvdmVyZmxvdy15OiBoaWRkZW47XG4gICAgICAgIG92ZXJmbG93LXg6IGF1dG87XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDJweDtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgICAgICAgLXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6IHRvdWNoO1xuICAgICAgICBzY3JvbGwtc25hcC10eXBlOiB4IG1hbmRhdG9yeTtcbiAgICB9XG5cbiAgICBsaSB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgICAgICBzY3JvbGwtc25hcC1hbGlnbjogY2VudGVyO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IEljb24sIEJ1dHRvbiwgQXZhdGFyIH0gZnJvbSAnLi4vY29tcG9uZW50cydcblxuICAgIGV4cG9ydCBsZXQgc2VnbWVudFxuXG4gICAgbGV0IGlzRGFya1RoZW1lID0gZmFsc2VcblxuICAgIGxldCB2YWx1ZSA9ICd1YSdcblxuICAgIGZ1bmN0aW9uIGNoYW5nZVRoZW1lKCkge1xuICAgICAgICBpc0RhcmtUaGVtZSA9ICFpc0RhcmtUaGVtZVxuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ3RoZW1lLWRhcmsnKVxuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ3RoZW1lLWxpZ2h0JylcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKGlzRGFya1RoZW1lID8gJ3RoZW1lLWRhcmsnIDogJ3RoZW1lLWxpZ2h0JylcbiAgICB9XG48L3NjcmlwdD5cblxuPG5hdiBjbGFzcz1cInRoZW1lLWJnIGNvbnRhaW5lclwiPlxuICAgIDx1bD5cbiAgICAgICAgPGxpPjxhIHJlbD1wcmVmZXRjaCBocmVmPScuJyBjbGFzczpzZWxlY3RlZD0ne3NlZ21lbnQgPT09IHVuZGVmaW5lZH0nPmhvbWU8L2E+PC9saT5cbiAgICAgICAgPGxpPjxhIGhyZWY9J21hcCcgY2xhc3M6c2VsZWN0ZWQ9J3tzZWdtZW50ID09PSBcIm1hcFwifSc+bWFwPC9hPjwvbGk+XG4gICAgICAgIDxsaT48YSByZWw9cHJlZmV0Y2ggaHJlZj0nbGlzdHMvY2hhcml0aWVzJyBjbGFzczpzZWxlY3RlZD0ne3NlZ21lbnQgPT09IFwibGlzdHNcIn0nPmxpc3RzPC9hPjwvbGk+XG4gICAgICAgIDxsaT48YSByZWw9cHJlZmV0Y2ggaHJlZj0nY2hhcml0eScgY2xhc3M6c2VsZWN0ZWQ9J3tzZWdtZW50ID09PSBcImNoYXJpdHlcIn0nPmNoYXJpdHk8L2E+PC9saT5cbiAgICAgICAgPGxpPjxhIHJlbD1wcmVmZXRjaCBocmVmPSdvcmdhbml6YXRpb24nIGNsYXNzOnNlbGVjdGVkPSd7c2VnbWVudCA9PT0gXCJvcmdhbml6YXRpb25cIn0nPm9yZzwvYT48L2xpPlxuICAgIDwvdWw+XG5cbiAgICA8dWwgY2xhc3M9XCJuYXYtYWN0aW9uc1wiPlxuICAgICAgICA8bGk+XG4gICAgICAgICAgICA8c2VsZWN0IHt2YWx1ZX0gbmFtZT1cImxhbmdcIiBpZD1cImxhbmdcIiBjbGFzcz1cImJ0biBzbWFsbCBsYW5nLXNlbGVjdFwiPlxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJ1YVwiPlVhPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInJ1XCI+UnU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiZW5cIj5Fbjwvb3B0aW9uPlxuICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvbGk+XG5cbiAgICAgICAgPGxpPlxuICAgICAgICAgICAgPEJ1dHRvbiBvbjpjbGljaz17Y2hhbmdlVGhlbWV9IGF1dG8gc2l6ZT1cInNtYWxsXCI+XG4gICAgICAgICAgICAgICAgPEljb24gdHlwZT1cIm1vb25cIiBjbGFzcz1cInRoZW1lLXN2Zy1maWxsXCIvPlxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgIDwvbGk+XG5cbiAgICAgICAgPGxpPlxuICAgICAgICAgICAgPEJ1dHRvbiBvbjpjbGljaz17Y2hhbmdlVGhlbWV9IGF1dG8gc2l6ZT1cInNtYWxsXCI+XG4gICAgICAgICAgICAgICAgPEF2YXRhciBzaXplPVwic21hbGxcIiBzcmM9XCJodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3Blb3BsZVwiLz5cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8L2xpPlxuICAgIDwvdWw+XG48L25hdj5cblxuPHN0eWxlPlxuICAgIG5hdiB7XG4gICAgICAgIHBvc2l0aW9uOiBzdGlja3k7XG4gICAgICAgIHRvcDogMDtcbiAgICAgICAgei1pbmRleDogMTA7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCByZ2JhKHZhcigtLWNvbG9yLWRhbmdlciksIC4xKTtcbiAgICB9XG5cbiAgICAuc2VsZWN0ZWQge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICB9XG5cbiAgICAuc2VsZWN0ZWQ6OmFmdGVyIHtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICBjb250ZW50OiBcIlwiO1xuICAgICAgICB3aWR0aDogY2FsYygxMDAlIC0gMWVtKTtcbiAgICAgICAgaGVpZ2h0OiAycHg7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgIGJvdHRvbTogLTFweDtcbiAgICB9XG5cbiAgICBhIHtcbiAgICAgICAgcGFkZGluZzogLjhlbSAwLjVlbTtcbiAgICB9XG5cbiAgICAubmF2LWFjdGlvbnMge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBtYXJnaW46IC0zcHg7XG4gICAgfVxuXG4gICAgLm5hdi1hY3Rpb25zIGxpIHtcbiAgICAgICAgcGFkZGluZzogM3B4O1xuICAgIH1cblxuICAgIC5sYW5nLXNlbGVjdCB7XG4gICAgICAgIHBhZGRpbmc6IDVweDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gICAgfVxuXG4gICAgLmxhbmctc2VsZWN0OmhvdmVyLFxuICAgIC5sYW5nLXNlbGVjdDpmb2N1cyB7XG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjEpO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuXG48L3NjcmlwdD5cblxuPGZvb3Rlcj5cbiAgICA8cD7CqSAyMDE5IC0ge25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX08L3A+XG48L2Zvb3Rlcj5cblxuPHN0eWxlPlxuICAgIGZvb3RlciB7XG4gICAgICAgIHBhZGRpbmc6IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogMikgdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgICAgICBib3gtc2hhZG93OiBpbnNldCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBBdmF0YXIgfSBmcm9tICcuLi9jb21wb25lbnRzJ1xuXG4gICAgZXhwb3J0IGxldCBzcmMgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBzdWJ0aXRsZSA9IHVuZGVmaW5lZFxuPC9zY3JpcHQ+XG5cbjxzZWN0aW9uPlxuICAgIDxBdmF0YXIgc3JjPXtzcmN9IGFsdD17dGl0bGV9IGNsYXNzPVwiY29tbWVudC1hdmFcIi8+XG5cbiAgICA8ZGl2PlxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgIDxoND57dGl0bGV9PC9oND5cbiAgICAgICAgICAgIDxzdWI+e3N1YnRpdGxlfTwvc3ViPlxuICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgPGJyIGNsYXNzPVwic21hbGxcIj5cblxuICAgICAgICA8c2xvdD5cbiAgICAgICAgICAgIDxwcmU+XG4gICAgICAgICAgICAgICAgQSBsb29vb29vb29vb25nIGNvbW1lbnQgdGhhdCBoYXMgYmVlblxuICAgICAgICAgICAgICAgIGxlZnQgYnkgYSB2ZXJ5IGFuZ3J5IGd1eSB3aG8gY29tcGxhaW5zIHVwb25cbiAgICAgICAgICAgICAgICBsb29vb29uZyBjb21tZW50cy5cbiAgICAgICAgICAgIDwvcHJlPlxuICAgICAgICA8L3Nsb3Q+XG4gICAgPC9kaXY+XG48L3NlY3Rpb24+XG5cbjxzdHlsZT5cbiAgICBzZWN0aW9uIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgfVxuXG4gICAgZGl2IHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB9XG5cbiAgICBzcGFuIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgcGFkZGluZzogMCA4cHg7XG4gICAgfVxuXG4gICAgc3BhbiBoNCxcbiAgICBzcGFuIHN1YiB7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgICAgbGluZS1oZWlnaHQ6IDE7XG4gICAgICAgIG1heC13aWR0aDogMTAwJTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgfVxuXG4gICAgcHJlIHtcbiAgICAgICAgcGFkZGluZzogMCA4cHg7XG4gICAgICAgIGZvbnQtc2l6ZTogLjgyNWVtO1xuICAgICAgICBsaW5lLWhlaWdodDogMS4yO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IEF2YXRhciB9IGZyb20gJy4uL2NvbXBvbmVudHMnXG5cbiAgICBleHBvcnQgbGV0IHNyYyA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHN1YnRpdGxlID0gdW5kZWZpbmVkXG48L3NjcmlwdD5cblxuPHNlY3Rpb24+XG4gICAgPEF2YXRhciBzcmM9e3NyY30gYWx0PXt0aXRsZX0vPlxuXG4gICAgPHNwYW4+XG4gICAgICAgIDxoND57dGl0bGV9PC9oND5cbiAgICAgICAgPHN1Yj57c3VidGl0bGV9PC9zdWI+XG4gICAgPC9zcGFuPlxuPC9zZWN0aW9uPlxuXG48c3R5bGU+XG4gICAgc2VjdGlvbiB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgIH1cblxuICAgIHNwYW4gaDQsXG4gICAgc3BhbiBzdWIge1xuICAgICAgICBsaW5lLWhlaWdodDogMS40O1xuICAgICAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCBBdmF0YXJBbmROYW1lIGZyb20gJy4vQXZhdGFyQW5kTmFtZS5zdmVsdGUnXG5cbiAgICBleHBvcnQgbGV0IGl0ZW1zID0gW11cbjwvc2NyaXB0PlxuXG57I2VhY2ggaXRlbXMgYXMgaXRlbX1cbiAgICA8c2VjdGlvbiBjbGFzcz1cIml0ZW0gY29udGFpbmVyXCI+XG4gICAgICAgIDxicj5cbiAgICAgICAgPEF2YXRhckFuZE5hbWVcbiAgICAgICAgICAgICAgICBzcmM9e2l0ZW0ub3JnSGVhZFNyY31cbiAgICAgICAgICAgICAgICB0aXRsZT17aXRlbS5vcmdIZWFkfVxuICAgICAgICAgICAgICAgIHN1YnRpdGxlPXtpdGVtLm9yZ2FuaXphdGlvbn1cbiAgICAgICAgLz5cbiAgICAgICAgPGJyPlxuICAgIDwvc2VjdGlvbj5cbiAgICA8YnI+XG57OmVsc2V9XG4gICAgPHNlY3Rpb24gY2xhc3M9XCJpdGVtIGNvbnRhaW5lclwiPlxuICAgICAgICA8cCBjbGFzcz1cInRleHQtY2VudGVyXCI+Tm8gb3JnYW5pemF0aW9uczwvcD5cbiAgICA8L3NlY3Rpb24+XG57L2VhY2h9XG5cbjxzdHlsZT5cbiAgICAuaXRlbSB7XG4gICAgICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yKSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgUmF0ZSwgUHJvZ3Jlc3MsIEF2YXRhciwgQ2Fyb3VzZWwgfSBmcm9tICcuLi9jb21wb25lbnRzJ1xuICAgIGltcG9ydCBBdmF0YXJBbmROYW1lIGZyb20gJy4vQXZhdGFyQW5kTmFtZS5zdmVsdGUnXG5cbiAgICBleHBvcnQgbGV0IHNyYyA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHBlcmNlbnQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IG9yZ0hlYWQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IG9yZ0hlYWRTcmMgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IG9yZ2FuaXphdGlvbiA9IHVuZGVmaW5lZFxuXG4gICAgJDogaW1hZ2VzID0gbmV3IEFycmF5KDQpLmZpbGwoe1xuICAgICAgICBzcmMsXG4gICAgICAgIGFsdDogdGl0bGUsXG4gICAgfSlcbjwvc2NyaXB0PlxuXG48c2VjdGlvbiBjbGFzcz1cImNhcmRcIj5cbiAgICA8ZGl2IGNsYXNzPVwiaW1hZ2VzLXdyYXBcIj5cbiAgICAgICAgPENhcm91c2VsIGl0ZW1zPXtpbWFnZXN9Lz5cbiAgICA8L2Rpdj5cblxuICAgIDxQcm9ncmVzcyB2YWx1ZT17cGVyY2VudH0gYm9yZGVyUmFkaXVzPVwiMCAwXCIvPlxuXG4gICAgPGg0Pnt0aXRsZX08L2g0PlxuXG4gICAgPGRpdiBjbGFzcz1cInJhdGUtd3JhcFwiPlxuICAgICAgICA8UmF0ZSBzaXplPVwic21hbGxcIi8+XG4gICAgPC9kaXY+XG5cbiAgICA8Zm9vdGVyPlxuICAgICAgICA8QXZhdGFyQW5kTmFtZSBzcmM9e29yZ0hlYWRTcmN9IHRpdGxlPXtvcmdIZWFkfSBzdWJ0aXRsZT17b3JnYW5pemF0aW9ufS8+XG4gICAgPC9mb290ZXI+XG48L3NlY3Rpb24+XG5cbjxzdHlsZT5cbiAgICAuY2FyZCB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgfVxuXG4gICAgLnJhdGUtd3JhcCB7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZy10b3A6IDZweDtcbiAgICB9XG5cbiAgICAuaW1hZ2VzLXdyYXAge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBoZWlnaHQ6IDEwMHB4O1xuICAgIH1cblxuICAgIGg0IHtcbiAgICAgICAgLS1jYXJkLWxpbmUtaGVpZ2h0OiAxLjQ7XG5cbiAgICAgICAgZm9udC1zaXplOiAuOGVtO1xuICAgICAgICBsaW5lLWhlaWdodDogdmFyKC0tY2FyZC1saW5lLWhlaWdodCk7XG4gICAgICAgIGhlaWdodDogY2FsYyh2YXIoLS1mb250LXNpemUpICogKHZhcigtLWNhcmQtbGluZS1oZWlnaHQpIC8gMS4yKSAqIDIpO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IERpdmlkZXIgfSBmcm9tICcuLi9jb21wb25lbnRzJ1xuICAgIGltcG9ydCBDaGFyaXR5Q2FyZCBmcm9tICcuLi9sYXlvdXRzL0NoYXJpdHlDYXJkLnN2ZWx0ZSdcblxuICAgIGV4cG9ydCBsZXQgbGlzdE5hbWVcbiAgICBleHBvcnQgbGV0IGFtb3VudCA9IDJcblxuICAgICQ6IGNhcmRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3RlY2gnLFxuICAgICAgICAgICAgdGl0bGU6ICdUaGlzIHBlcnNvbiBuZWVkcyB5b3VyIGhlbHAnLFxuICAgICAgICAgICAgcGVyY2VudDogNDUsXG4gICAgICAgICAgICBvcmdIZWFkOiAnVGluYSBLYW5kZWxha2knLFxuICAgICAgICAgICAgb3JnSGVhZFNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvcGVvcGxlJyxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbjogJ0hlYWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB3aXRoIGxvb29vb29vb25nLW5hYWFhYWFtZWQgY2hhcml0eScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvYXJjaCcsXG4gICAgICAgICAgICB0aXRsZTogJ0Fub3RoZXIgcGVyc29uIHdobyBuZWVkcyB5b3VyIHF1aWNrIGhlbHAnLFxuICAgICAgICAgICAgcGVyY2VudDogNjUsXG4gICAgICAgICAgICBvcmdIZWFkOiAnVGluYSBLYW5kZWxha2knLFxuICAgICAgICAgICAgb3JnSGVhZFNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvcGVvcGxlJyxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbjogJ0hlYWQgb2YgYW5vdGhlciBvcmdhbml6YXRpb24nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL2FueScsXG4gICAgICAgICAgICB0aXRsZTogJ1RoZSBwZXJzb24gd2l0aCB0aGUgbG9uZ2VzdCBuYW1lIGlzIGFsc28gd2FpdCBmb3IgeW91JyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDUsXG4gICAgICAgICAgICBvcmdIZWFkOiAnVGluYXJhbWlzaW11c3MgZWwtZGUtbGEgS2FuZGVsYWtpbnVza2FzJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdPUkcgb2YgY2hhcml0eScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvbmF0dXJlJyxcbiAgICAgICAgICAgIHRpdGxlOiAnTmVlZHMnLFxuICAgICAgICAgICAgcGVyY2VudDogOTUsXG4gICAgICAgICAgICBvcmdIZWFkOiAnVGluYSBLYW5kZWxha2knLFxuICAgICAgICAgICAgb3JnSGVhZFNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvcGVvcGxlJyxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbjogJ09SRyBnaWFudCBjaGFyaXR5IG9yZ2FuaXphdGlvbiBvZiBiaWcgQ2hhcml0aWZ5IGNvbXBhbnknLFxuICAgICAgICB9LFxuICAgIF0uc2xpY2UoTnVtYmVyLmlzRmluaXRlKCthbW91bnQpID8gK2Ftb3VudCA6IDApXG5cbiAgICAkOiBpbWFnZXMgPSBjYXJkcy5tYXAoY2FyZCA9PiAoe1xuICAgICAgICBzcmM6IFtjYXJkLnNyYywgY2FyZC5zcmMsIGNhcmQuc3JjXSxcbiAgICAgICAgYWx0OiBjYXJkLnRpdGxlLFxuICAgIH0pKVxuPC9zY3JpcHQ+XG5cbjxzZWN0aW9uPlxuICAgIHsjaWYgbGlzdE5hbWV9XG4gICAgICAgIDxEaXZpZGVyIHNpemU9XCIxNlwiLz5cbiAgICAgICAgPGgzIGNsYXNzPVwiaDIgdGV4dC1yaWdodFwiPntsaXN0TmFtZX08L2gzPlxuICAgICAgICA8RGl2aWRlciBzaXplPVwiMjBcIi8+XG4gICAgICAgIDxicj5cbiAgICB7L2lmfVxuICAgIDx1bCBjbGFzcz1cImNhcmRzXCI+XG4gICAgICAgIHsjZWFjaCBjYXJkcyBhcyBjYXJkfVxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgIDxDaGFyaXR5Q2FyZCB7Li4uY2FyZH0vPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgey9lYWNofVxuICAgIDwvdWw+XG48L3NlY3Rpb24+XG5cbjxzdHlsZT5cbiAgICBzZWN0aW9uIHtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgICAgIHBhZGRpbmc6IDAgMTBweDtcbiAgICB9XG5cbiAgICAuY2FyZHMge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogdmFyKC0tc2NyZWVuLXBhZGRpbmcpIDA7XG4gICAgICAgIG1hcmdpbjogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAtMykgY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAtMSk7XG4gICAgfVxuXG4gICAgLmNhcmRzIGxpIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgICAgICB3aWR0aDogNTAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBwYWRkaW5nOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDMpIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICAuY2FyZHMgbGk6aG92ZXIge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIC4xKVxuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSAnVGhlIG1haW4gdGl0bGUgdGhhdCBleHBsYWlucyB0aGUgY2hhcml0eSdcbiAgICBleHBvcnQgbGV0IHN1YnRpdGxlID0gJ0FuZCBiaWdnZXIgZGVzY3JpcHRpb24gdGhhdCBkZXNjcmliZXMgaW4gc2hvcnQga2V5d29yZHMgYSBjaGFyaXR5LCB0aXRsZSBhYm92ZSBhbmQganVzdCBtYWtlcyB0ZXh0IGxvbmdlcidcbjwvc2NyaXB0PlxuXG48c2VjdGlvbj5cbiAgICA8aDE+e3RpdGxlfTwvaDE+XG4gICAgPGJyPlxuICAgIDxoMj57c3VidGl0bGV9PC9oMj5cbjwvc2VjdGlvbj5cblxuPHN0eWxlPlxuICAgIHNlY3Rpb24ge1xuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmc6IDAgM3Z3O1xuICAgIH1cblxuICAgIGgyIHtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDQwMDtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBjb25zdCBpdGVtcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdDb21mb3J0IGlzIHRoZSBtYWluIGZlYXR1cmUnLFxuICAgICAgICAgICAgdGV4dDogJ0p1c3QgaW1hZ2luZywgeW91IGRvIHNvbWV0aGluZyBzaW1wbGUgYW5kIHlvdSBjYW4gc2VlIHRoZSByZXN1bHQgb2YgeW91ciBzaG9ydCB3YXkuJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdDb21mb3J0IGlzIHRoZSBtYWluIGZlYXR1cmUnLFxuICAgICAgICAgICAgdGV4dDogJ0p1c3QgaW1hZ2luZywgeW91IGRvIHNvbWV0aGluZyBzaW1wbGUgYW5kIHlvdSBjYW4gc2VlIHRoZSByZXN1bHQgb2YgeW91ciBzaG9ydCB3YXkuJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdDb21mb3J0IGlzIHRoZSBtYWluIGZlYXR1cmUnLFxuICAgICAgICAgICAgdGV4dDogJ0p1c3QgaW1hZ2luZywgeW91IGRvIHNvbWV0aGluZyBzaW1wbGUgYW5kIHlvdSBjYW4gc2VlIHRoZSByZXN1bHQgb2YgeW91ciBzaG9ydCB3YXkuJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdDb21mb3J0IGlzIHRoZSBtYWluIGZlYXR1cmUnLFxuICAgICAgICAgICAgdGV4dDogJ0p1c3QgaW1hZ2luZywgeW91IGRvIHNvbWV0aGluZyBzaW1wbGUgYW5kIHlvdSBjYW4gc2VlIHRoZSByZXN1bHQgb2YgeW91ciBzaG9ydCB3YXkuJyxcbiAgICAgICAgfSxcbiAgICBdXG48L3NjcmlwdD5cblxuPHVsPlxuICAgIHsjZWFjaCBpdGVtcyBhcyBpdGVtfVxuICAgICAgICA8bGk+XG4gICAgICAgICAgICA8aDM+e2l0ZW0udGl0bGV9PC9oMz5cbiAgICAgICAgICAgIDxwPntpdGVtLnRleHR9PC9wPlxuICAgICAgICAgICAgPGJyPlxuICAgICAgICA8L2xpPlxuICAgIHsvZWFjaH1cbjwvdWw+XG5cbjxzdHlsZT5cbiAgICB1bCB7XG4gICAgICAgIGxpc3Qtc3R5bGU6IGRpc2Mgb3V0c2lkZSBub25lO1xuICAgICAgICBwYWRkaW5nOiAwIGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogNSk7XG4gICAgICAgIC8qbGlzdC1zdHlsZS1pbWFnZTogdXJsKFwiZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsPHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCcgdmlld0JveD0nLTEgLTEgMiAyJz48Y2lyY2xlIHI9JzEnIC8+PC9zdmc+XCIpOyovXG4gICAgfVxuXG4gICAgbGkge1xuICAgICAgICBkaXNwbGF5OiBsaXN0LWl0ZW07XG4gICAgfVxuXG4gICAgdWwsIGxpLCBoMywgcCB7XG4gICAgICAgIG1heC13aWR0aDogMTAwJTtcbiAgICAgICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcbiAgICB9XG5cbiAgICBoMywgcCB7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgICAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgfVxuPC9zdHlsZT5cbiIsImltcG9ydCB6bEZldGNoIGZyb20gJ3psLWZldGNoJyAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS96ZWxsd2svemwtZmV0Y2hcblxuLyoqXG4gKlxuICogQGRlc2NyaXB0aW9uIEFQSSBVUkxzIGJ1aWxkZXJzLlxuICovXG5leHBvcnQgY29uc3QgZW5kcG9pbnRzID0ge1xuICBSRUNFTlRfTkVXUzogKCkgPT4gYHJlY2VudF9uZXdzLmpzb25gLFxuXG4gIENIQVJJVFk6IChpZCkgPT4gYGNoYXJpdHkuanNvbj9pZD0ke2lkfWAsXG4gIENIQVJJVElFUzogKCkgPT4gYGNoYXJpdGllcy5qc29uYCxcbiAgQ0hBUklUWV9DT01NRU5UUzogKGlkKSA9PiBgY2hhcml0eV9jb21tZW50cy5qc29uP2lkPSR7aWR9YCxcblxuICBPUkdBTklaQVRJT046IChpZCkgPT4gYG9yZ2FuaXphdGlvbi5qc29uP2lkPSR7aWR9YCxcbiAgT1JHQU5JWkFUSU9OUzogKCkgPT4gYG9yZ2FuaXphdGlvbnMuanNvbmAsXG4gIE9SR0FOSVpBVElPTl9DT01NRU5UUzogKGlkKSA9PiBgJG9yZ2FuaXphdGlvbi9jb21tZW50cy5qc29uP2lkPSR7aWR9YCxcbn1cblxuY2xhc3MgQVBJU2VydmljZSB7XG4gIC8qKlxuICAgKlxuICAgKiBAdHlwZWRlZiBDb25maWcge3tcbiAgICogICBhZGFwdGVyOiBGdW5jdGlvbiwgKHpsRmV0Y2gpXG4gICAqXG4gICAqICAgYmFzZVBhdGg6IHN0cmluZyxcbiAgICpcbiAgICogICByZXF1ZXN0SW50ZXJjZXB0b3IoW1xuICAgKiAgICAgZW5kcG9pbnQ6IHN0cmluZyxcbiAgICogICAgIHBhcmFtcz86IG9iamVjdCxcbiAgICogICAgIGNvbmZpZz86IG9iamVjdCxcbiAgICogICBdKTogeyp9LFxuICAgKiAgIHJlc3BvbnNlSW50ZXJjZXB0b3IoKSB7XG4gICAqICAgICBib2R5OiB7Kn0sXG4gICAqICAgICBoZWFkZXJzOiBvYmplY3QsXG4gICAqICAgICByZXNwb25zZToge1Jlc3BvbnNlfSxcbiAgICogICAgIHN0YXR1czogbnVtYmVyLFxuICAgKiAgICAgc3RhdHVzVGV4dDogc3RyaW5nLFxuICAgKiAgIH0sXG4gICAqICAgZXJyb3JJbnRlcmNlcHRvcigpIHt7XG4gICAqICAgICBib2R5OiB7Kn0sXG4gICAqICAgICBoZWFkZXJzOiBvYmplY3QsXG4gICAqICAgICByZXNwb25zZToge1Jlc3BvbnNlfSxcbiAgICogICAgIHN0YXR1czogbnVtYmVyLFxuICAgKiAgICAgc3RhdHVzVGV4dDogc3RyaW5nLFxuICAgKiAgIH19LFxuICAgKiB9fVxuICAgKiBAcGFyYW0gY29uZmlnIHtDb25maWd9XG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWcgPSB7fSkge1xuICAgIHRoaXMuX2FkYXB0ZXIgPSBjb25maWcuYWRhcHRlciB8fCB6bEZldGNoXG5cbiAgICB0aGlzLl9iYXNlX3BhdGggPSBjb25maWcuYmFzZVBhdGggPyBgJHtjb25maWcuYmFzZVBhdGh9L2AgOiAnJ1xuXG4gICAgdGhpcy5fcmVxdWVzdEludGVyY2VwdG9yID0gY29uZmlnLnJlcXVlc3RJbnRlcmNlcHRvciB8fCAoYXN5bmMgKC4uLmFyZ3MpID0+IGFyZ3MpXG4gICAgdGhpcy5fcmVzcG9uc2VJbnRlcmNlcHRvciA9IGNvbmZpZy5yZXNwb25zZUludGVyY2VwdG9yIHx8IChhc3luYyAoLi4uYXJncykgPT4gYXJncylcbiAgICB0aGlzLl9lcnJvckludGVyY2VwdG9yID0gY29uZmlnLmVycm9ySW50ZXJjZXB0b3IgfHwgUHJvbWlzZS5yZWplY3RcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gbWV0aG9kIHsnZ2V0J3wncHV0J3wncG9zdCd8J2RlbGV0ZSd8J3BhdGNoJ31cbiAgICogQHBhcmFtIGFyZ3MgeypbXX1cbiAgICovXG4gIGFzeW5jIG5ld1JlcXVlc3QobWV0aG9kLCAuLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aEludGVyY2VwdG9ycyh0aGlzLl9hZGFwdGVyW21ldGhvZF0sIC4uLmFyZ3MpXG4gIH1cblxuICBhc3luYyB3aXRoSW50ZXJjZXB0b3JzKGNhbGxlciwgLi4uYXJncykge1xuICAgIGNvbnN0IG5ld0FyZ3MxID0gYXdhaXQgdGhpcy5yZXF1ZXN0SW50ZXJjZXB0b3IoLi4uYXJncylcbiAgICBjb25zdCBuZXdBcmdzMiA9IGF3YWl0IHRoaXMuX3JlcXVlc3RJbnRlcmNlcHRvciguLi5uZXdBcmdzMSlcblxuICAgIHJldHVybiBjYWxsZXIoLi4ubmV3QXJnczIpXG4gICAgICAudGhlbihhc3luYyAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgY29uc3QgbmV3UmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9yZXNwb25zZUludGVyY2VwdG9yKHJlc3BvbnNlKVxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVSZXNwb25zZShuZXdSZXNwb25zZSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goYXN5bmMgKHJlamVjdCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9lcnJvckludGVyY2VwdG9yKHJlamVjdClcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyBlcnJvclxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKHRoaXMuaGFuZGxlUmVqZWN0KVxuICB9XG5cbiAgYXN5bmMgcmVxdWVzdEludGVyY2VwdG9yKC4uLmFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnKSB7IC8vIElmIFVSTCB0aGVuIGNvbmNhdCBCQVNFX1BBVEguXG4gICAgICBhcmdzWzBdID0gYCR7dGhpcy5fYmFzZV9wYXRofSR7YXJnc1swXX1gXG4gICAgfVxuICAgIHJldHVybiBbLi4uYXJnc11cbiAgfVxuXG4gIGFzeW5jIGhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlLmJvZHlcbiAgfVxuXG4gIGFzeW5jIGhhbmRsZVJlamVjdChyZWplY3QpIHtcbiAgICB0aHJvdyByZWplY3RcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBAZGVzY3JpcHRpb24gQVBJIGNsYXNzIGZvciBtYWtpbmcgUkVTVCBBUEkgcmVxdWVzdHMgaW4gYSBicm93c2VyLlxuICovXG5leHBvcnQgY2xhc3MgQXBpQ2xhc3MgZXh0ZW5kcyBBUElTZXJ2aWNlIHtcbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBjb25maWcge0NvbmZpZ31cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZylcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAZGVzY3JpcHRpb24gQ2hhcml0eVxuICAgKi9cbiAgZ2V0Q2hhcml0eShpZCwgcGFyYW1zLCBjb25maWcpIHtcbiAgICByZXR1cm4gdGhpcy5uZXdSZXF1ZXN0KCdnZXQnLCBlbmRwb2ludHMuQ0hBUklUWShpZCksIHBhcmFtcywgY29uZmlnKVxuICB9XG5cbiAgZ2V0Q2hhcml0aWVzKHBhcmFtcywgY29uZmlnKSB7XG4gICAgcmV0dXJuIHRoaXMubmV3UmVxdWVzdCgnZ2V0JywgZW5kcG9pbnRzLkNIQVJJVElFUygpLCBwYXJhbXMsIGNvbmZpZylcbiAgfVxuXG4gIGdldENoYXJpdHlDb21tZW50cyhpZCwgcGFyYW1zLCBjb25maWcpIHtcbiAgICByZXR1cm4gdGhpcy5uZXdSZXF1ZXN0KCdnZXQnLCBlbmRwb2ludHMuQ0hBUklUWV9DT01NRU5UUyhpZCksIHBhcmFtcywgY29uZmlnKVxuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvbiBPcmdhbml6YXRpb25cbiAgICovXG4gIGdldE9yZ2FuaXphdGlvbihpZCwgcGFyYW1zLCBjb25maWcpIHtcbiAgICByZXR1cm4gdGhpcy5uZXdSZXF1ZXN0KCdnZXQnLCBlbmRwb2ludHMuT1JHQU5JWkFUSU9OKGlkKSwgcGFyYW1zLCBjb25maWcpXG4gIH1cblxuICBnZXRPcmdhbml6YXRpb25zKHBhcmFtcywgY29uZmlnKSB7XG4gICAgcmV0dXJuIHRoaXMubmV3UmVxdWVzdCgnZ2V0JywgZW5kcG9pbnRzLk9SR0FOSVpBVElPTlMoKSwgcGFyYW1zLCBjb25maWcpXG4gIH1cblxuICBnZXRPcmdhbml6YXRpb25Db21tZW50cyhpZCwgcGFyYW1zLCBjb25maWcpIHtcbiAgICByZXR1cm4gdGhpcy5uZXdSZXF1ZXN0KCdnZXQnLCBlbmRwb2ludHMuT1JHQU5JWkFUSU9OX0NPTU1FTlRTKGlkKSwgcGFyYW1zLCBjb25maWcpXG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQGRlc2NyaXB0aW9uIE5ld3NcbiAgICovXG4gIGdldFJlY2VudE5ld3MocGFyYW1zLCBjb25maWcpIHtcbiAgICByZXR1cm4gdGhpcy5uZXdSZXF1ZXN0KCdnZXQnLCBlbmRwb2ludHMuUkVDRU5UX05FV1MoKSwgcGFyYW1zLCBjb25maWcpXG4gIH1cblxufVxuXG4vKipcbiAqXG4gKiBAY29uc3RydWN0b3Ige0NvbmZpZ31cbiAqL1xuZXhwb3J0IGRlZmF1bHQgbmV3IEFwaUNsYXNzKHtcbiAgYmFzZVBhdGg6IHByb2Nlc3MuZW52LkJBQ0tFTkRfVVJMLFxuICByZXNwb25zZUludGVyY2VwdG9yOiByZXMgPT4gKGNvbnNvbGUuaW5mbygncmVzcG9uc2UgLS0tLS0tLVxcbicsIHJlcyksIHJlcyksXG4gIGVycm9ySW50ZXJjZXB0b3I6IHJlaiA9PiB7XG4gICAgY29uc29sZS53YXJuKCdyZXF1ZXN0IGVycm9yIC0tLS0tLS1cXG4nLCByZWopXG5cbiAgICBpZiAocmVqICYmIHJlai5lcnJvciAmJiByZWouZXJyb3IubWVzc2FnZSA9PT0gJ0ZhaWxlZCB0byBmZXRjaCcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdMb3N0IGludGVybmV0IGNvbm5lY3Rpb24nKVxuICAgIH1cblxuICAgIHRocm93IHJlalxuICB9LFxufSlcbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSdcbiAgICBpbXBvcnQgeyBhcGkgfSBmcm9tICcuLi9zZXJ2aWNlcydcbiAgICBpbXBvcnQgeyBUaXRsZVN1YlRpdGxlLCBBdmF0YXJBbmROYW1lLCBEb25hdGluZ0dyb3VwLCBDaGFyaXR5Q2FyZHMsIEZvb3RlciB9IGZyb20gJy4uL2xheW91dHMnXG4gICAgaW1wb3J0IHsgUmF0ZSwgUHJvZ3Jlc3MsIENhcm91c2VsIH0gZnJvbSAnLi4vY29tcG9uZW50cydcblxuICAgIGxldCBvcmdhbml6YXRpb24gPSB7fVxuXG4gICAgJDogY2Fyb3VzZWwgPSAob3JnYW5pemF0aW9uLnNyYyB8fCBbXSkubWFwKChzcmMsIGkpID0+ICh7IHNyYywgc3JjQmlnOiAob3JnYW5pemF0aW9uLnNyYzJ4IHx8IFtdKVtpXSB9KSlcblxuICAgIG9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMjAwMCkpXG4gICAgICAgIG9yZ2FuaXphdGlvbiA9IGF3YWl0IGFwaS5nZXRPcmdhbml6YXRpb24oMSlcbiAgICB9KVxuPC9zY3JpcHQ+XG5cbjxzdmVsdGU6aGVhZD5cbiAgICA8dGl0bGU+Q2hhcml0aWZ5IC0gT3JnYW5pemF0aW9uIHBhZ2UuPC90aXRsZT5cbjwvc3ZlbHRlOmhlYWQ+XG5cbjxzdHlsZT5cbiAgICAudG9wIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAxLjUpO1xuICAgICAgICBtYXJnaW4tdG9wOiB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgfVxuXG4gICAgLnBpY3Mtd3JhcCB7XG4gICAgICAgIHotaW5kZXg6IDA7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogMnB4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC5yYXRlLXNlY3Rpb24ge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogZmxleC1lbmQ7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgcGFkZGluZzogMTJweCAwO1xuICAgIH1cbjwvc3R5bGU+XG5cbjxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyXCI+XG5cbiAgICA8c2VjdGlvbj5cbiAgICAgICAgPGJyPlxuICAgICAgICA8VGl0bGVTdWJUaXRsZVxuICAgICAgICAgICAgdGl0bGU9e29yZ2FuaXphdGlvbi50aXRsZX1cbiAgICAgICAgICAgIHN1YnRpdGxlPXtvcmdhbml6YXRpb24uZGVzY3JpcHRpb259XG4gICAgICAgIC8+XG4gICAgICAgIDxicj5cbiAgICA8L3NlY3Rpb24+XG5cbiAgICA8c2VjdGlvbiBjbGFzcz1cInRvcFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGljcy13cmFwXCI+XG4gICAgICAgICAgICA8Q2Fyb3VzZWwgaXRlbXM9e2Nhcm91c2VsfS8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxEb25hdGluZ0dyb3VwLz5cbiAgICA8L3NlY3Rpb24+XG5cbiAgICA8UHJvZ3Jlc3MgdmFsdWU9XCI2NVwiIHNpemU9XCJiaWdcIi8+XG5cbiAgICA8c2VjdGlvbiBjbGFzcz1cInJhdGUtc2VjdGlvblwiPlxuICAgICAgICA8QXZhdGFyQW5kTmFtZVxuICAgICAgICAgICAgICAgIHNyYz17b3JnYW5pemF0aW9uLm9yZ0hlYWRTcmN9XG4gICAgICAgICAgICAgICAgdGl0bGU9e29yZ2FuaXphdGlvbi5vcmdIZWFkfVxuICAgICAgICAgICAgICAgIHN1YnRpdGxlPXtvcmdhbml6YXRpb24udGl0bGV9XG4gICAgICAgIC8+XG5cbiAgICAgICAgPFJhdGUvPlxuICAgIDwvc2VjdGlvbj5cbjwvc2VjdGlvbj5cblxuPGJyPlxuPGJyPlxuPGJyPlxuXG48ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgPENoYXJpdHlDYXJkcy8+XG48L2Rpdj5cblxuPGJyPlxuPGJyPlxuPGJyPlxuPGJyPlxuPGJyPlxuXG48ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgPENoYXJpdHlDYXJkcy8+XG48L2Rpdj5cblxuPGJyPlxuPGJyPlxuPGJyPlxuPGJyPlxuPGJyPlxuXG48Rm9vdGVyLz5cblxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGFwaSB9IGZyb20gJy4uL3NlcnZpY2VzJ1xuICAgIGltcG9ydCB7IFRpdGxlU3ViVGl0bGUsIEF2YXRhckFuZE5hbWUsIERvbmF0aW5nR3JvdXAsIENoYXJpdHlDYXJkcywgRm9vdGVyIH0gZnJvbSAnLi4vbGF5b3V0cydcbiAgICBpbXBvcnQgeyBSYXRlLCBQcm9ncmVzcywgQ2Fyb3VzZWwgfSBmcm9tICcuLi9jb21wb25lbnRzJ1xuXG4gICAgbGV0IGNoYXJpdHkgPSB7fVxuXG4gICAgJDogY2Fyb3VzZWwgPSAoY2hhcml0eS5zcmMgfHwgW10pLm1hcCgoc3JjLCBpKSA9PiAoeyBzcmMsIHNyY0JpZzogKGNoYXJpdHkuc3JjMnggfHwgW10pW2ldIH0pKVxuXG4gICAgb25Nb3VudChhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAyMDAwKSlcbiAgICAgICAgY2hhcml0eSA9IGF3YWl0IGFwaS5nZXRDaGFyaXR5KDEpXG4gICAgfSlcbjwvc2NyaXB0PlxuXG48c3ZlbHRlOmhlYWQ+XG4gICAgPHRpdGxlPkNoYXJpdGlmeSAtIENoYXJpdHkgcGFnZSBhbmQgZG9uYXRlLjwvdGl0bGU+XG48L3N2ZWx0ZTpoZWFkPlxuXG48c3R5bGU+XG4gICAgLnRvcCB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogMS41KTtcbiAgICAgICAgbWFyZ2luLXRvcDogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgIH1cblxuICAgIC5waWNzLXdyYXAge1xuICAgICAgICB6LWluZGV4OiAwO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDJweDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAucmF0ZS1zZWN0aW9uIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtZW5kO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIHBhZGRpbmc6IDEycHggMDtcbiAgICB9XG48L3N0eWxlPlxuXG48c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lclwiPlxuXG4gICAgPHNlY3Rpb24gY2xhc3M9XCJ0b3BcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpY3Mtd3JhcFwiPlxuICAgICAgICAgICAgPENhcm91c2VsIGl0ZW1zPXtjYXJvdXNlbH0vPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8RG9uYXRpbmdHcm91cC8+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPFByb2dyZXNzIHZhbHVlPVwiNjVcIiBzaXplPVwiYmlnXCIvPlxuXG4gICAgPHNlY3Rpb24gY2xhc3M9XCJyYXRlLXNlY3Rpb25cIj5cbiAgICAgICAgPEF2YXRhckFuZE5hbWVcbiAgICAgICAgICAgICAgICBzcmM9e2NoYXJpdHkub3JnSGVhZFNyY31cbiAgICAgICAgICAgICAgICB0aXRsZT17Y2hhcml0eS5vcmdIZWFkfVxuICAgICAgICAgICAgICAgIHN1YnRpdGxlPXtjaGFyaXR5Lm9yZ2FuaXphdGlvbn1cbiAgICAgICAgLz5cblxuICAgICAgICA8UmF0ZS8+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPHNlY3Rpb24+XG4gICAgICAgIDxicj5cbiAgICAgICAgPFRpdGxlU3ViVGl0bGVcbiAgICAgICAgICAgICAgICB0aXRsZT17Y2hhcml0eS50aXRsZX1cbiAgICAgICAgICAgICAgICBzdWJ0aXRsZT17Y2hhcml0eS5kZXNjcmlwdGlvbn1cbiAgICAgICAgLz5cbiAgICAgICAgPGJyPlxuICAgIDwvc2VjdGlvbj5cblxuPC9zZWN0aW9uPlxuXG48YnI+XG48YnI+XG48YnI+XG5cbjxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICA8Q2hhcml0eUNhcmRzLz5cbjwvZGl2PlxuXG48YnI+XG48YnI+XG48YnI+XG48YnI+XG48YnI+XG5cbjxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICA8Q2hhcml0eUNhcmRzLz5cbjwvZGl2PlxuXG48YnI+XG48YnI+XG48YnI+XG48YnI+XG48YnI+XG5cbjxGb290ZXIvPlxuXG4iLCI8c3ZlbHRlOmhlYWQ+XG5cdDx0aXRsZT5DaGFyaXRpZnkgLSBpcyB0aGUgYXBwbGljYXRpb24gZm9yIGhlbHBpbmcgdGhvc2UgaW4gbmVlZC48L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPHNjcmlwdD5cblx0aW1wb3J0IHsgU2VhcmNoTGluZSwgRm9vdGVyIH0gZnJvbSAnLi4vLi4vbGF5b3V0cydcblxuXHRleHBvcnQgbGV0IHNlZ21lbnRcbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwic2VhcmNoIHRoZW1lLWJnIGNvbnRhaW5lclwiPlxuXHQ8YnI+XG5cblx0PFNlYXJjaExpbmUvPlxuXG5cdDxuYXY+XG5cdFx0PHVsPlxuXHRcdFx0PGxpPjxhIHJlbD1wcmVmZXRjaCBocmVmPSdsaXN0cy9jaGFyaXRpZXMnIGNsYXNzOnNlbGVjdGVkPSd7c2VnbWVudCA9PT0gXCJjaGFyaXRpZXNcIn0nPmNoYXJpdGllczwvYT48L2xpPlxuXHRcdFx0PGxpPjxhIHJlbD1wcmVmZXRjaCBocmVmPSdsaXN0cy9vcmdhbml6YXRpb25zJyBjbGFzczpzZWxlY3RlZD0ne3NlZ21lbnQgPT09IFwib3JnYW5pemF0aW9uc1wifSc+b3JnYW5pemF0aW9uczwvYT48L2xpPlxuXHRcdDwvdWw+XG5cdDwvbmF2PlxuPC9kaXY+XG5cbjxkaXYgY2xhc3M9XCJsaXN0LXdyYXBcIj5cblx0PGJyPlxuXG5cdDxzbG90Pjwvc2xvdD5cblxuXHQ8YnI+XG5cdDxicj5cbjwvZGl2PlxuXG48Rm9vdGVyLz5cblxuPHN0eWxlPlxuXHQuc2VhcmNoIHtcblx0XHRwb3NpdGlvbjogc3RpY2t5O1xuXHRcdHRvcDogNDdweDtcblx0XHRib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG5cdH1cblxuXHQubGlzdC13cmFwIHtcblx0XHRmbGV4OiAxIDEgYXV0bztcblx0XHRwYWRkaW5nOiAwIHZhcigtLXNjcmVlbi1wYWRkaW5nKVxuXHR9XG5cblx0bmF2IHVsLCBuYXYgbGkge1xuXHRcdGRpc3BsYXk6IGZsZXg7XG5cdFx0YWxpZ24tc2VsZjogc3RyZXRjaDtcblx0XHRhbGlnbi1pdGVtczogc3RyZXRjaDtcblx0XHRqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG5cdH1cblxuXHRsaSB7XG5cdFx0ZmxleDogMSAxIDA7XG5cdH1cblxuXHRsaSBhIHtcblx0XHRmbGV4OiAxIDEgMDtcblx0XHRhbGlnbi1zZWxmOiBzdHJldGNoO1xuXHRcdGRpc3BsYXk6IGZsZXg7XG5cdFx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0XHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0XHR0ZXh0LWFsaWduOiBjZW50ZXI7XG5cdFx0cGFkZGluZzogMjBweCAxMHB4O1xuXHR9XG5cblx0bGkgYTpob3ZlciwgbGkgYS5zZWxlY3RlZCB7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4xKTtcblx0fVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSdcbiAgICBpbXBvcnQgeyBhcGkgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcydcbiAgICBpbXBvcnQgeyBMaXN0SXRlbXMgfSBmcm9tICcuLi8uLi9sYXlvdXRzJ1xuXG4gICAgbGV0IG9yZ2FuaXphdGlvbnMgPSBbXVxuXG4gICAgb25Nb3VudChhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwKSlcbiAgICAgICAgY29uc3Qgb3JncyA9IGF3YWl0IGFwaS5nZXRPcmdhbml6YXRpb25zKClcbiAgICAgICAgb3JnYW5pemF0aW9ucyA9IG5ldyBBcnJheSgxKS5maWxsKG9yZ3MpLnJlZHVjZSgoYSwgbykgPT4gYS5jb25jYXQoLi4ubyksIFtdKVxuICAgIH0pXG48L3NjcmlwdD5cblxuPExpc3RJdGVtcyBpdGVtcz17b3JnYW5pemF0aW9uc30vPlxuXG48c3R5bGU+XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGFwaSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzJ1xuICAgIGltcG9ydCB7IExpc3RJdGVtcyB9IGZyb20gJy4uLy4uL2xheW91dHMnXG5cbiAgICBsZXQgY2hhcmlyaWVzID0gW11cblxuICAgIG9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTAwMCkpXG4gICAgICAgIGNvbnN0IGNoYXJzID0gYXdhaXQgYXBpLmdldENoYXJpdGllcygpXG4gICAgICAgIGNoYXJpcmllcyA9IG5ldyBBcnJheSg1KS5maWxsKGNoYXJzKS5yZWR1Y2UoKGEsIG8pID0+IGEuY29uY2F0KC4uLm8pLCBbXSlcbiAgICB9KVxuPC9zY3JpcHQ+XG5cbjxMaXN0SXRlbXMgaXRlbXM9e2NoYXJpcmllc30vPlxuXG48c3R5bGU+XG48L3N0eWxlPlxuIiwiPHN2ZWx0ZTpoZWFkPlxuICAgIDx0aXRsZT5DaGFyaXRpZnkgLSBNYXAgb2Ygb3JnYW5pemF0aW9ucy48L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPHN0eWxlPlxuPC9zdHlsZT5cblxuPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBhcGkgfSBmcm9tICcuLi9zZXJ2aWNlcydcbiAgICBpbXBvcnQgeyBNYXAsIE1hcE1hcmtlciB9IGZyb20gJy4uL2xheW91dHMnXG5cbiAgICBsZXQgb3JnYW5pemF0aW9ucyA9IFtdXG5cbiAgICBhc3luYyBmdW5jdGlvbiBvbkNyZWF0ZSh7IGRldGFpbDogbWFwIH0pIHtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDIwMDApKVxuICAgICAgICBvcmdhbml6YXRpb25zID0gYXdhaXQgYXBpLmdldE9yZ2FuaXphdGlvbnMoKVxuXG4gICAgICAgIGNvbnNvbGUubG9nKG9yZ2FuaXphdGlvbnMpXG5cbiAgICAgICAgY29uc3QgZ2V0UmFuZ2UgPSAodHlwZSwgbWV0cmljKSA9PiBNYXRoW3R5cGVdKC4uLm9yZ2FuaXphdGlvbnMubWFwKG8gPT4gby5sb2NhdGlvblttZXRyaWNdKSlcblxuICAgICAgICBjb25zdCBzY2FsZSA9IC0yXG4gICAgICAgIGNvbnN0IGFyZWEgPSBbXG4gICAgICAgICAgICBbZ2V0UmFuZ2UoJ21pbicsICdsbmcnKSArIHNjYWxlLCBnZXRSYW5nZSgnbWluJywgJ2xhdCcpICsgc2NhbGVdLFxuICAgICAgICAgICAgW2dldFJhbmdlKCdtYXgnLCAnbG5nJykgLSBzY2FsZSwgZ2V0UmFuZ2UoJ21heCcsICdsYXQnKSAtIHNjYWxlXVxuICAgICAgICBdXG4gICAgICAgIG1hcC5maXRCb3VuZHMoYXJlYSk7XG4gICAgfVxuPC9zY3JpcHQ+XG5cbjxNYXAgb246cmVhZHk9e29uQ3JlYXRlfT5cbiAgICB7I2VhY2ggb3JnYW5pemF0aW9ucyBhcyBvfVxuICAgICAgICA8TWFwTWFya2VyIGxhdD17by5sb2NhdGlvbi5sYXR9IGxuZz17by5sb2NhdGlvbi5sbmd9Lz5cbiAgICB7L2VhY2h9XG48L01hcD5cbiIsIjxzY3JpcHQ+XG5cdGltcG9ydCB7IEhlYWRlciB9IGZyb20gJy4uL2xheW91dHMnO1xuXHRpbXBvcnQgSWNvbnMgZnJvbSAnLi9faWNvbnMuc3ZlbHRlJztcblxuXHRleHBvcnQgbGV0IHNlZ21lbnQ7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuXG48L3N0eWxlPlxuXG48SGVhZGVyIHtzZWdtZW50fS8+XG5cbjxJY29ucy8+XG5cbjxtYWluIGlkPVwibWFpblwiPlxuXHQ8c2xvdD48L3Nsb3Q+XG48L21haW4+XG5cbiIsIjxzY3JpcHQ+XG5cdGV4cG9ydCBsZXQgc3RhdHVzO1xuXHRleHBvcnQgbGV0IGVycm9yO1xuXG5cdGNvbnN0IGRldiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnO1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbjwvc3R5bGU+XG5cbjxzdmVsdGU6aGVhZD5cblx0PHRpdGxlPkVycm9yOiB7c3RhdHVzfTwvdGl0bGU+XG48L3N2ZWx0ZTpoZWFkPlxuXG48YnI+XG48YnI+XG48YnI+XG48YnI+XG48aDEgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiPkVycm9yOiB7c3RhdHVzfTwvaDE+XG48YnI+XG48cCBjbGFzcz1cInRleHQtY2VudGVyXCI+UmVhc29uOiB7ZXJyb3IubWVzc2FnZX08L3A+XG48YnI+XG48YnI+XG57I2lmIGRldiAmJiBlcnJvci5zdGFja31cblx0PHByZT57ZXJyb3Iuc3RhY2t9PC9wcmU+XG57L2lmfVxuIiwiLy8gVGhpcyBmaWxlIGlzIGdlbmVyYXRlZCBieSBTYXBwZXIg4oCUIGRvIG5vdCBlZGl0IGl0IVxuaW1wb3J0IGNvbXBvbmVudF8wIGZyb20gXCIuLi8uLi8uLi9yb3V0ZXMvaW5kZXguc3ZlbHRlXCI7XG5pbXBvcnQgY29tcG9uZW50XzEgZnJvbSBcIi4uLy4uLy4uL3JvdXRlcy9vcmdhbml6YXRpb24uc3ZlbHRlXCI7XG5pbXBvcnQgY29tcG9uZW50XzIgZnJvbSBcIi4uLy4uLy4uL3JvdXRlcy9jaGFyaXR5LnN2ZWx0ZVwiO1xuaW1wb3J0IGNvbXBvbmVudF8zIGZyb20gXCIuLi8uLi8uLi9yb3V0ZXMvbGlzdHMvX2xheW91dC5zdmVsdGVcIjtcbmltcG9ydCBjb21wb25lbnRfNCBmcm9tIFwiLi4vLi4vLi4vcm91dGVzL2xpc3RzL2luZGV4LnN2ZWx0ZVwiO1xuaW1wb3J0IGNvbXBvbmVudF81IGZyb20gXCIuLi8uLi8uLi9yb3V0ZXMvbGlzdHMvb3JnYW5pemF0aW9ucy5zdmVsdGVcIjtcbmltcG9ydCBjb21wb25lbnRfNiBmcm9tIFwiLi4vLi4vLi4vcm91dGVzL2xpc3RzL2NoYXJpdGllcy5zdmVsdGVcIjtcbmltcG9ydCBjb21wb25lbnRfNyBmcm9tIFwiLi4vLi4vLi4vcm91dGVzL21hcC5zdmVsdGVcIjtcbmltcG9ydCByb290IGZyb20gXCIuLi8uLi8uLi9yb3V0ZXMvX2xheW91dC5zdmVsdGVcIjtcbmltcG9ydCBlcnJvciBmcm9tIFwiLi4vLi4vLi4vcm91dGVzL19lcnJvci5zdmVsdGVcIjtcblxuY29uc3QgZCA9IGRlY29kZVVSSUNvbXBvbmVudDtcblxuZXhwb3J0IGNvbnN0IG1hbmlmZXN0ID0ge1xuXHRzZXJ2ZXJfcm91dGVzOiBbXG5cdFx0XG5cdF0sXG5cblx0cGFnZXM6IFtcblx0XHR7XG5cdFx0XHQvLyBpbmRleC5zdmVsdGVcblx0XHRcdHBhdHRlcm46IC9eXFwvJC8sXG5cdFx0XHRwYXJ0czogW1xuXHRcdFx0XHR7IG5hbWU6IFwiaW5kZXhcIiwgZmlsZTogXCJpbmRleC5zdmVsdGVcIiwgY29tcG9uZW50OiBjb21wb25lbnRfMCB9XG5cdFx0XHRdXG5cdFx0fSxcblxuXHRcdHtcblx0XHRcdC8vIG9yZ2FuaXphdGlvbi5zdmVsdGVcblx0XHRcdHBhdHRlcm46IC9eXFwvb3JnYW5pemF0aW9uXFwvPyQvLFxuXHRcdFx0cGFydHM6IFtcblx0XHRcdFx0eyBuYW1lOiBcIm9yZ2FuaXphdGlvblwiLCBmaWxlOiBcIm9yZ2FuaXphdGlvbi5zdmVsdGVcIiwgY29tcG9uZW50OiBjb21wb25lbnRfMSB9XG5cdFx0XHRdXG5cdFx0fSxcblxuXHRcdHtcblx0XHRcdC8vIGNoYXJpdHkuc3ZlbHRlXG5cdFx0XHRwYXR0ZXJuOiAvXlxcL2NoYXJpdHlcXC8/JC8sXG5cdFx0XHRwYXJ0czogW1xuXHRcdFx0XHR7IG5hbWU6IFwiY2hhcml0eVwiLCBmaWxlOiBcImNoYXJpdHkuc3ZlbHRlXCIsIGNvbXBvbmVudDogY29tcG9uZW50XzIgfVxuXHRcdFx0XVxuXHRcdH0sXG5cblx0XHR7XG5cdFx0XHQvLyBsaXN0cy9pbmRleC5zdmVsdGVcblx0XHRcdHBhdHRlcm46IC9eXFwvbGlzdHNcXC8/JC8sXG5cdFx0XHRwYXJ0czogW1xuXHRcdFx0XHR7IG5hbWU6IFwibGlzdHNfX2xheW91dFwiLCBmaWxlOiBcImxpc3RzL19sYXlvdXQuc3ZlbHRlXCIsIGNvbXBvbmVudDogY29tcG9uZW50XzMgfSxcblx0XHRcdFx0eyBuYW1lOiBcImxpc3RzXCIsIGZpbGU6IFwibGlzdHMvaW5kZXguc3ZlbHRlXCIsIGNvbXBvbmVudDogY29tcG9uZW50XzQgfVxuXHRcdFx0XVxuXHRcdH0sXG5cblx0XHR7XG5cdFx0XHQvLyBsaXN0cy9vcmdhbml6YXRpb25zLnN2ZWx0ZVxuXHRcdFx0cGF0dGVybjogL15cXC9saXN0c1xcL29yZ2FuaXphdGlvbnNcXC8/JC8sXG5cdFx0XHRwYXJ0czogW1xuXHRcdFx0XHR7IG5hbWU6IFwibGlzdHNfX2xheW91dFwiLCBmaWxlOiBcImxpc3RzL19sYXlvdXQuc3ZlbHRlXCIsIGNvbXBvbmVudDogY29tcG9uZW50XzMgfSxcblx0XHRcdFx0eyBuYW1lOiBcImxpc3RzX29yZ2FuaXphdGlvbnNcIiwgZmlsZTogXCJsaXN0cy9vcmdhbml6YXRpb25zLnN2ZWx0ZVwiLCBjb21wb25lbnQ6IGNvbXBvbmVudF81IH1cblx0XHRcdF1cblx0XHR9LFxuXG5cdFx0e1xuXHRcdFx0Ly8gbGlzdHMvY2hhcml0aWVzLnN2ZWx0ZVxuXHRcdFx0cGF0dGVybjogL15cXC9saXN0c1xcL2NoYXJpdGllc1xcLz8kLyxcblx0XHRcdHBhcnRzOiBbXG5cdFx0XHRcdHsgbmFtZTogXCJsaXN0c19fbGF5b3V0XCIsIGZpbGU6IFwibGlzdHMvX2xheW91dC5zdmVsdGVcIiwgY29tcG9uZW50OiBjb21wb25lbnRfMyB9LFxuXHRcdFx0XHR7IG5hbWU6IFwibGlzdHNfY2hhcml0aWVzXCIsIGZpbGU6IFwibGlzdHMvY2hhcml0aWVzLnN2ZWx0ZVwiLCBjb21wb25lbnQ6IGNvbXBvbmVudF82IH1cblx0XHRcdF1cblx0XHR9LFxuXG5cdFx0e1xuXHRcdFx0Ly8gbWFwLnN2ZWx0ZVxuXHRcdFx0cGF0dGVybjogL15cXC9tYXBcXC8/JC8sXG5cdFx0XHRwYXJ0czogW1xuXHRcdFx0XHR7IG5hbWU6IFwibWFwXCIsIGZpbGU6IFwibWFwLnN2ZWx0ZVwiLCBjb21wb25lbnQ6IGNvbXBvbmVudF83IH1cblx0XHRcdF1cblx0XHR9XG5cdF0sXG5cblx0cm9vdCxcblx0cm9vdF9wcmVsb2FkOiAoKSA9PiB7fSxcblx0ZXJyb3Jcbn07XG5cbmV4cG9ydCBjb25zdCBidWlsZF9kaXIgPSBcIl9fc2FwcGVyX18vZGV2XCI7XG5cbmV4cG9ydCBjb25zdCBzcmNfZGlyID0gXCJzcmNcIjtcblxuZXhwb3J0IGNvbnN0IGRldiA9IHRydWU7IiwiaW1wb3J0IHsgbm9vcCwgc2FmZV9ub3RfZXF1YWwsIHN1YnNjcmliZSwgcnVuX2FsbCwgaXNfZnVuY3Rpb24gfSBmcm9tICcuLi9pbnRlcm5hbCc7XG5leHBvcnQgeyBnZXRfc3RvcmVfdmFsdWUgYXMgZ2V0IH0gZnJvbSAnLi4vaW50ZXJuYWwnO1xuXG5jb25zdCBzdWJzY3JpYmVyX3F1ZXVlID0gW107XG4vKipcbiAqIENyZWF0ZXMgYSBgUmVhZGFibGVgIHN0b3JlIHRoYXQgYWxsb3dzIHJlYWRpbmcgYnkgc3Vic2NyaXB0aW9uLlxuICogQHBhcmFtIHZhbHVlIGluaXRpYWwgdmFsdWVcbiAqIEBwYXJhbSB7U3RhcnRTdG9wTm90aWZpZXJ9c3RhcnQgc3RhcnQgYW5kIHN0b3Agbm90aWZpY2F0aW9ucyBmb3Igc3Vic2NyaXB0aW9uc1xuICovXG5mdW5jdGlvbiByZWFkYWJsZSh2YWx1ZSwgc3RhcnQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdWJzY3JpYmU6IHdyaXRhYmxlKHZhbHVlLCBzdGFydCkuc3Vic2NyaWJlLFxuICAgIH07XG59XG4vKipcbiAqIENyZWF0ZSBhIGBXcml0YWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgYm90aCB1cGRhdGluZyBhbmQgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKiBAcGFyYW0geyo9fXZhbHVlIGluaXRpYWwgdmFsdWVcbiAqIEBwYXJhbSB7U3RhcnRTdG9wTm90aWZpZXI9fXN0YXJ0IHN0YXJ0IGFuZCBzdG9wIG5vdGlmaWNhdGlvbnMgZm9yIHN1YnNjcmlwdGlvbnNcbiAqL1xuZnVuY3Rpb24gd3JpdGFibGUodmFsdWUsIHN0YXJ0ID0gbm9vcCkge1xuICAgIGxldCBzdG9wO1xuICAgIGNvbnN0IHN1YnNjcmliZXJzID0gW107XG4gICAgZnVuY3Rpb24gc2V0KG5ld192YWx1ZSkge1xuICAgICAgICBpZiAoc2FmZV9ub3RfZXF1YWwodmFsdWUsIG5ld192YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICAgICAgaWYgKHN0b3ApIHsgLy8gc3RvcmUgaXMgcmVhZHlcbiAgICAgICAgICAgICAgICBjb25zdCBydW5fcXVldWUgPSAhc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVycy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gc3Vic2NyaWJlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIHNbMV0oKTtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZS5wdXNoKHMsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bl9xdWV1ZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YnNjcmliZXJfcXVldWUubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWVbaV1bMF0oc3Vic2NyaWJlcl9xdWV1ZVtpICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlKGZuKSB7XG4gICAgICAgIHNldChmbih2YWx1ZSkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzdWJzY3JpYmUocnVuLCBpbnZhbGlkYXRlID0gbm9vcCkge1xuICAgICAgICBjb25zdCBzdWJzY3JpYmVyID0gW3J1biwgaW52YWxpZGF0ZV07XG4gICAgICAgIHN1YnNjcmliZXJzLnB1c2goc3Vic2NyaWJlcik7XG4gICAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHN0b3AgPSBzdGFydChzZXQpIHx8IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgcnVuKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gc3Vic2NyaWJlcnMuaW5kZXhPZihzdWJzY3JpYmVyKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICAgICAgICBzdG9wID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc2V0LCB1cGRhdGUsIHN1YnNjcmliZSB9O1xufVxuZnVuY3Rpb24gZGVyaXZlZChzdG9yZXMsIGZuLCBpbml0aWFsX3ZhbHVlKSB7XG4gICAgY29uc3Qgc2luZ2xlID0gIUFycmF5LmlzQXJyYXkoc3RvcmVzKTtcbiAgICBjb25zdCBzdG9yZXNfYXJyYXkgPSBzaW5nbGVcbiAgICAgICAgPyBbc3RvcmVzXVxuICAgICAgICA6IHN0b3JlcztcbiAgICBjb25zdCBhdXRvID0gZm4ubGVuZ3RoIDwgMjtcbiAgICByZXR1cm4gcmVhZGFibGUoaW5pdGlhbF92YWx1ZSwgKHNldCkgPT4ge1xuICAgICAgICBsZXQgaW5pdGVkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgICAgICBsZXQgcGVuZGluZyA9IDA7XG4gICAgICAgIGxldCBjbGVhbnVwID0gbm9vcDtcbiAgICAgICAgY29uc3Qgc3luYyA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZm4oc2luZ2xlID8gdmFsdWVzWzBdIDogdmFsdWVzLCBzZXQpO1xuICAgICAgICAgICAgaWYgKGF1dG8pIHtcbiAgICAgICAgICAgICAgICBzZXQocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsZWFudXAgPSBpc19mdW5jdGlvbihyZXN1bHQpID8gcmVzdWx0IDogbm9vcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdW5zdWJzY3JpYmVycyA9IHN0b3Jlc19hcnJheS5tYXAoKHN0b3JlLCBpKSA9PiBzdWJzY3JpYmUoc3RvcmUsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdmFsdWVzW2ldID0gdmFsdWU7XG4gICAgICAgICAgICBwZW5kaW5nICY9IH4oMSA8PCBpKTtcbiAgICAgICAgICAgIGlmIChpbml0ZWQpIHtcbiAgICAgICAgICAgICAgICBzeW5jKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHBlbmRpbmcgfD0gKDEgPDwgaSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgaW5pdGVkID0gdHJ1ZTtcbiAgICAgICAgc3luYygpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIHJ1bl9hbGwodW5zdWJzY3JpYmVycyk7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5cbmV4cG9ydCB7IGRlcml2ZWQsIHJlYWRhYmxlLCB3cml0YWJsZSB9O1xuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnO1xuXG5leHBvcnQgY29uc3QgQ09OVEVYVF9LRVkgPSB7fTtcblxuZXhwb3J0IGNvbnN0IHByZWxvYWQgPSAoKSA9PiAoe30pOyIsIjwhLS0gVGhpcyBmaWxlIGlzIGdlbmVyYXRlZCBieSBTYXBwZXIg4oCUIGRvIG5vdCBlZGl0IGl0ISAtLT5cbjxzY3JpcHQ+XG5cdGltcG9ydCB7IHNldENvbnRleHQgfSBmcm9tICdzdmVsdGUnO1xuXHRpbXBvcnQgeyBDT05URVhUX0tFWSB9IGZyb20gJy4vc2hhcmVkJztcblx0aW1wb3J0IExheW91dCBmcm9tICcuLi8uLi8uLi9yb3V0ZXMvX2xheW91dC5zdmVsdGUnO1xuXHRpbXBvcnQgRXJyb3IgZnJvbSAnLi4vLi4vLi4vcm91dGVzL19lcnJvci5zdmVsdGUnO1xuXG5cdGV4cG9ydCBsZXQgc3RvcmVzO1xuXHRleHBvcnQgbGV0IGVycm9yO1xuXHRleHBvcnQgbGV0IHN0YXR1cztcblx0ZXhwb3J0IGxldCBzZWdtZW50cztcblx0ZXhwb3J0IGxldCBsZXZlbDA7XG5cdGV4cG9ydCBsZXQgbGV2ZWwxID0gbnVsbDtcblx0ZXhwb3J0IGxldCBsZXZlbDIgPSBudWxsO1xuXG5cdHNldENvbnRleHQoQ09OVEVYVF9LRVksIHN0b3Jlcyk7XG48L3NjcmlwdD5cblxuPExheW91dCBzZWdtZW50PVwie3NlZ21lbnRzWzBdfVwiIHsuLi5sZXZlbDAucHJvcHN9PlxuXHR7I2lmIGVycm9yfVxuXHRcdDxFcnJvciB7ZXJyb3J9IHtzdGF0dXN9Lz5cblx0ezplbHNlfVxuXHRcdDxzdmVsdGU6Y29tcG9uZW50IHRoaXM9XCJ7bGV2ZWwxLmNvbXBvbmVudH1cIiBzZWdtZW50PVwie3NlZ21lbnRzWzFdfVwiIHsuLi5sZXZlbDEucHJvcHN9PlxuXHRcdFx0eyNpZiBsZXZlbDJ9XG5cdFx0XHRcdDxzdmVsdGU6Y29tcG9uZW50IHRoaXM9XCJ7bGV2ZWwyLmNvbXBvbmVudH1cIiB7Li4ubGV2ZWwyLnByb3BzfS8+XG5cdFx0XHR7L2lmfVxuXHRcdDwvc3ZlbHRlOmNvbXBvbmVudD5cblx0ey9pZn1cbjwvTGF5b3V0PiIsImltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGRldiwgYnVpbGRfZGlyLCBzcmNfZGlyLCBtYW5pZmVzdCB9IGZyb20gJy4vaW50ZXJuYWwvbWFuaWZlc3Qtc2VydmVyJztcbmltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcbmltcG9ydCBTdHJlYW0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0IFVybCBmcm9tICd1cmwnO1xuaW1wb3J0IGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCB6bGliIGZyb20gJ3psaWInO1xuaW1wb3J0IEFwcCBmcm9tICcuL2ludGVybmFsL0FwcC5zdmVsdGUnO1xuXG5mdW5jdGlvbiBnZXRfc2VydmVyX3JvdXRlX2hhbmRsZXIocm91dGVzKSB7XG5cdGFzeW5jIGZ1bmN0aW9uIGhhbmRsZV9yb3V0ZShyb3V0ZSwgcmVxLCByZXMsIG5leHQpIHtcblx0XHRyZXEucGFyYW1zID0gcm91dGUucGFyYW1zKHJvdXRlLnBhdHRlcm4uZXhlYyhyZXEucGF0aCkpO1xuXG5cdFx0Y29uc3QgbWV0aG9kID0gcmVxLm1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuXHRcdC8vICdkZWxldGUnIGNhbm5vdCBiZSBleHBvcnRlZCBmcm9tIGEgbW9kdWxlIGJlY2F1c2UgaXQgaXMgYSBrZXl3b3JkLFxuXHRcdC8vIHNvIGNoZWNrIGZvciAnZGVsJyBpbnN0ZWFkXG5cdFx0Y29uc3QgbWV0aG9kX2V4cG9ydCA9IG1ldGhvZCA9PT0gJ2RlbGV0ZScgPyAnZGVsJyA6IG1ldGhvZDtcblx0XHRjb25zdCBoYW5kbGVfbWV0aG9kID0gcm91dGUuaGFuZGxlcnNbbWV0aG9kX2V4cG9ydF07XG5cdFx0aWYgKGhhbmRsZV9tZXRob2QpIHtcblx0XHRcdGlmIChwcm9jZXNzLmVudi5TQVBQRVJfRVhQT1JUKSB7XG5cdFx0XHRcdGNvbnN0IHsgd3JpdGUsIGVuZCwgc2V0SGVhZGVyIH0gPSByZXM7XG5cdFx0XHRcdGNvbnN0IGNodW5rcyA9IFtdO1xuXHRcdFx0XHRjb25zdCBoZWFkZXJzID0ge307XG5cblx0XHRcdFx0Ly8gaW50ZXJjZXB0IGRhdGEgc28gdGhhdCBpdCBjYW4gYmUgZXhwb3J0ZWRcblx0XHRcdFx0cmVzLndyaXRlID0gZnVuY3Rpb24oY2h1bmspIHtcblx0XHRcdFx0XHRjaHVua3MucHVzaChCdWZmZXIuZnJvbShjaHVuaykpO1xuXHRcdFx0XHRcdHdyaXRlLmFwcGx5KHJlcywgYXJndW1lbnRzKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRyZXMuc2V0SGVhZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcblx0XHRcdFx0XHRoZWFkZXJzW25hbWUudG9Mb3dlckNhc2UoKV0gPSB2YWx1ZTtcblx0XHRcdFx0XHRzZXRIZWFkZXIuYXBwbHkocmVzLCBhcmd1bWVudHMpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHJlcy5lbmQgPSBmdW5jdGlvbihjaHVuaykge1xuXHRcdFx0XHRcdGlmIChjaHVuaykgY2h1bmtzLnB1c2goQnVmZmVyLmZyb20oY2h1bmspKTtcblx0XHRcdFx0XHRlbmQuYXBwbHkocmVzLCBhcmd1bWVudHMpO1xuXG5cdFx0XHRcdFx0cHJvY2Vzcy5zZW5kKHtcblx0XHRcdFx0XHRcdF9fc2FwcGVyX186IHRydWUsXG5cdFx0XHRcdFx0XHRldmVudDogJ2ZpbGUnLFxuXHRcdFx0XHRcdFx0dXJsOiByZXEudXJsLFxuXHRcdFx0XHRcdFx0bWV0aG9kOiByZXEubWV0aG9kLFxuXHRcdFx0XHRcdFx0c3RhdHVzOiByZXMuc3RhdHVzQ29kZSxcblx0XHRcdFx0XHRcdHR5cGU6IGhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddLFxuXHRcdFx0XHRcdFx0Ym9keTogQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKClcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaGFuZGxlX25leHQgPSAoZXJyKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRyZXMuc3RhdHVzQ29kZSA9IDUwMDtcblx0XHRcdFx0XHRyZXMuZW5kKGVyci5tZXNzYWdlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRwcm9jZXNzLm5leHRUaWNrKG5leHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCBoYW5kbGVfbWV0aG9kKHJlcSwgcmVzLCBoYW5kbGVfbmV4dCk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHRoYW5kbGVfbmV4dChlcnIpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBubyBtYXRjaGluZyBoYW5kbGVyIGZvciBtZXRob2Rcblx0XHRcdHByb2Nlc3MubmV4dFRpY2sobmV4dCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGZ1bmN0aW9uIGZpbmRfcm91dGUocmVxLCByZXMsIG5leHQpIHtcblx0XHRmb3IgKGNvbnN0IHJvdXRlIG9mIHJvdXRlcykge1xuXHRcdFx0aWYgKHJvdXRlLnBhdHRlcm4udGVzdChyZXEucGF0aCkpIHtcblx0XHRcdFx0aGFuZGxlX3JvdXRlKHJvdXRlLCByZXEsIHJlcywgbmV4dCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRuZXh0KCk7XG5cdH07XG59XG5cbi8qIVxuICogY29va2llXG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IFJvbWFuIFNodHlsbWFuXG4gKiBDb3B5cmlnaHQoYykgMjAxNSBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cy5cbiAqIEBwdWJsaWNcbiAqL1xuXG52YXIgcGFyc2VfMSA9IHBhcnNlO1xudmFyIHNlcmlhbGl6ZV8xID0gc2VyaWFsaXplO1xuXG4vKipcbiAqIE1vZHVsZSB2YXJpYWJsZXMuXG4gKiBAcHJpdmF0ZVxuICovXG5cbnZhciBkZWNvZGUgPSBkZWNvZGVVUklDb21wb25lbnQ7XG52YXIgZW5jb2RlID0gZW5jb2RlVVJJQ29tcG9uZW50O1xudmFyIHBhaXJTcGxpdFJlZ0V4cCA9IC87ICovO1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCBmaWVsZC1jb250ZW50IGluIFJGQyA3MjMwIHNlYyAzLjJcbiAqXG4gKiBmaWVsZC1jb250ZW50ID0gZmllbGQtdmNoYXIgWyAxKiggU1AgLyBIVEFCICkgZmllbGQtdmNoYXIgXVxuICogZmllbGQtdmNoYXIgICA9IFZDSEFSIC8gb2JzLXRleHRcbiAqIG9icy10ZXh0ICAgICAgPSAleDgwLUZGXG4gKi9cblxudmFyIGZpZWxkQ29udGVudFJlZ0V4cCA9IC9eW1xcdTAwMDlcXHUwMDIwLVxcdTAwN2VcXHUwMDgwLVxcdTAwZmZdKyQvO1xuXG4vKipcbiAqIFBhcnNlIGEgY29va2llIGhlYWRlci5cbiAqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gY29va2llIGhlYWRlciBzdHJpbmcgaW50byBhbiBvYmplY3RcbiAqIFRoZSBvYmplY3QgaGFzIHRoZSB2YXJpb3VzIGNvb2tpZXMgYXMga2V5cyhuYW1lcykgPT4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHJldHVybiB7b2JqZWN0fVxuICogQHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0ciwgb3B0aW9ucykge1xuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzdHIgbXVzdCBiZSBhIHN0cmluZycpO1xuICB9XG5cbiAgdmFyIG9iaiA9IHt9O1xuICB2YXIgb3B0ID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHBhaXJzID0gc3RyLnNwbGl0KHBhaXJTcGxpdFJlZ0V4cCk7XG4gIHZhciBkZWMgPSBvcHQuZGVjb2RlIHx8IGRlY29kZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhaXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBhaXIgPSBwYWlyc1tpXTtcbiAgICB2YXIgZXFfaWR4ID0gcGFpci5pbmRleE9mKCc9Jyk7XG5cbiAgICAvLyBza2lwIHRoaW5ncyB0aGF0IGRvbid0IGxvb2sgbGlrZSBrZXk9dmFsdWVcbiAgICBpZiAoZXFfaWR4IDwgMCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgdmFyIGtleSA9IHBhaXIuc3Vic3RyKDAsIGVxX2lkeCkudHJpbSgpO1xuICAgIHZhciB2YWwgPSBwYWlyLnN1YnN0cigrK2VxX2lkeCwgcGFpci5sZW5ndGgpLnRyaW0oKTtcblxuICAgIC8vIHF1b3RlZCB2YWx1ZXNcbiAgICBpZiAoJ1wiJyA9PSB2YWxbMF0pIHtcbiAgICAgIHZhbCA9IHZhbC5zbGljZSgxLCAtMSk7XG4gICAgfVxuXG4gICAgLy8gb25seSBhc3NpZ24gb25jZVxuICAgIGlmICh1bmRlZmluZWQgPT0gb2JqW2tleV0pIHtcbiAgICAgIG9ialtrZXldID0gdHJ5RGVjb2RlKHZhbCwgZGVjKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZSBkYXRhIGludG8gYSBjb29raWUgaGVhZGVyLlxuICpcbiAqIFNlcmlhbGl6ZSB0aGUgYSBuYW1lIHZhbHVlIHBhaXIgaW50byBhIGNvb2tpZSBzdHJpbmcgc3VpdGFibGUgZm9yXG4gKiBodHRwIGhlYWRlcnMuIEFuIG9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHNwZWNpZmllZCBjb29raWUgcGFyYW1ldGVycy5cbiAqXG4gKiBzZXJpYWxpemUoJ2ZvbycsICdiYXInLCB7IGh0dHBPbmx5OiB0cnVlIH0pXG4gKiAgID0+IFwiZm9vPWJhcjsgaHR0cE9ubHlcIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAcHVibGljXG4gKi9cblxuZnVuY3Rpb24gc2VyaWFsaXplKG5hbWUsIHZhbCwgb3B0aW9ucykge1xuICB2YXIgb3B0ID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIGVuYyA9IG9wdC5lbmNvZGUgfHwgZW5jb2RlO1xuXG4gIGlmICh0eXBlb2YgZW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIGVuY29kZSBpcyBpbnZhbGlkJyk7XG4gIH1cblxuICBpZiAoIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KG5hbWUpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgbmFtZSBpcyBpbnZhbGlkJyk7XG4gIH1cblxuICB2YXIgdmFsdWUgPSBlbmModmFsKTtcblxuICBpZiAodmFsdWUgJiYgIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHZhbCBpcyBpbnZhbGlkJyk7XG4gIH1cblxuICB2YXIgc3RyID0gbmFtZSArICc9JyArIHZhbHVlO1xuXG4gIGlmIChudWxsICE9IG9wdC5tYXhBZ2UpIHtcbiAgICB2YXIgbWF4QWdlID0gb3B0Lm1heEFnZSAtIDA7XG4gICAgaWYgKGlzTmFOKG1heEFnZSkpIHRocm93IG5ldyBFcnJvcignbWF4QWdlIHNob3VsZCBiZSBhIE51bWJlcicpO1xuICAgIHN0ciArPSAnOyBNYXgtQWdlPScgKyBNYXRoLmZsb29yKG1heEFnZSk7XG4gIH1cblxuICBpZiAob3B0LmRvbWFpbikge1xuICAgIGlmICghZmllbGRDb250ZW50UmVnRXhwLnRlc3Qob3B0LmRvbWFpbikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBkb21haW4gaXMgaW52YWxpZCcpO1xuICAgIH1cblxuICAgIHN0ciArPSAnOyBEb21haW49JyArIG9wdC5kb21haW47XG4gIH1cblxuICBpZiAob3B0LnBhdGgpIHtcbiAgICBpZiAoIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KG9wdC5wYXRoKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIHBhdGggaXMgaW52YWxpZCcpO1xuICAgIH1cblxuICAgIHN0ciArPSAnOyBQYXRoPScgKyBvcHQucGF0aDtcbiAgfVxuXG4gIGlmIChvcHQuZXhwaXJlcykge1xuICAgIGlmICh0eXBlb2Ygb3B0LmV4cGlyZXMudG9VVENTdHJpbmcgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBleHBpcmVzIGlzIGludmFsaWQnKTtcbiAgICB9XG5cbiAgICBzdHIgKz0gJzsgRXhwaXJlcz0nICsgb3B0LmV4cGlyZXMudG9VVENTdHJpbmcoKTtcbiAgfVxuXG4gIGlmIChvcHQuaHR0cE9ubHkpIHtcbiAgICBzdHIgKz0gJzsgSHR0cE9ubHknO1xuICB9XG5cbiAgaWYgKG9wdC5zZWN1cmUpIHtcbiAgICBzdHIgKz0gJzsgU2VjdXJlJztcbiAgfVxuXG4gIGlmIChvcHQuc2FtZVNpdGUpIHtcbiAgICB2YXIgc2FtZVNpdGUgPSB0eXBlb2Ygb3B0LnNhbWVTaXRlID09PSAnc3RyaW5nJ1xuICAgICAgPyBvcHQuc2FtZVNpdGUudG9Mb3dlckNhc2UoKSA6IG9wdC5zYW1lU2l0ZTtcblxuICAgIHN3aXRjaCAoc2FtZVNpdGUpIHtcbiAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPVN0cmljdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbGF4JzpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPUxheCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RyaWN0JzpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPVN0cmljdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbm9uZSc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1Ob25lJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gc2FtZVNpdGUgaXMgaW52YWxpZCcpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdHI7XG59XG5cbi8qKlxuICogVHJ5IGRlY29kaW5nIGEgc3RyaW5nIHVzaW5nIGEgZGVjb2RpbmcgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHBhcmFtIHtmdW5jdGlvbn0gZGVjb2RlXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHRyeURlY29kZShzdHIsIGRlY29kZSkge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGUoc3RyKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxudmFyIGNvb2tpZSA9IHtcblx0cGFyc2U6IHBhcnNlXzEsXG5cdHNlcmlhbGl6ZTogc2VyaWFsaXplXzFcbn07XG5cbnZhciBjaGFycyA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaXyQnO1xudmFyIHVuc2FmZUNoYXJzID0gL1s8PlxcYlxcZlxcblxcclxcdFxcMFxcdTIwMjhcXHUyMDI5XS9nO1xudmFyIHJlc2VydmVkID0gL14oPzpkb3xpZnxpbnxmb3J8aW50fGxldHxuZXd8dHJ5fHZhcnxieXRlfGNhc2V8Y2hhcnxlbHNlfGVudW18Z290b3xsb25nfHRoaXN8dm9pZHx3aXRofGF3YWl0fGJyZWFrfGNhdGNofGNsYXNzfGNvbnN0fGZpbmFsfGZsb2F0fHNob3J0fHN1cGVyfHRocm93fHdoaWxlfHlpZWxkfGRlbGV0ZXxkb3VibGV8ZXhwb3J0fGltcG9ydHxuYXRpdmV8cmV0dXJufHN3aXRjaHx0aHJvd3N8dHlwZW9mfGJvb2xlYW58ZGVmYXVsdHxleHRlbmRzfGZpbmFsbHl8cGFja2FnZXxwcml2YXRlfGFic3RyYWN0fGNvbnRpbnVlfGRlYnVnZ2VyfGZ1bmN0aW9ufHZvbGF0aWxlfGludGVyZmFjZXxwcm90ZWN0ZWR8dHJhbnNpZW50fGltcGxlbWVudHN8aW5zdGFuY2VvZnxzeW5jaHJvbml6ZWQpJC87XG52YXIgZXNjYXBlZCA9IHtcbiAgICAnPCc6ICdcXFxcdTAwM0MnLFxuICAgICc+JzogJ1xcXFx1MDAzRScsXG4gICAgJy8nOiAnXFxcXHUwMDJGJyxcbiAgICAnXFxcXCc6ICdcXFxcXFxcXCcsXG4gICAgJ1xcYic6ICdcXFxcYicsXG4gICAgJ1xcZic6ICdcXFxcZicsXG4gICAgJ1xcbic6ICdcXFxcbicsXG4gICAgJ1xccic6ICdcXFxccicsXG4gICAgJ1xcdCc6ICdcXFxcdCcsXG4gICAgJ1xcMCc6ICdcXFxcMCcsXG4gICAgJ1xcdTIwMjgnOiAnXFxcXHUyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICdcXFxcdTIwMjknXG59O1xudmFyIG9iamVjdFByb3RvT3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKE9iamVjdC5wcm90b3R5cGUpLnNvcnQoKS5qb2luKCdcXDAnKTtcbmZ1bmN0aW9uIGRldmFsdWUodmFsdWUpIHtcbiAgICB2YXIgY291bnRzID0gbmV3IE1hcCgpO1xuICAgIGZ1bmN0aW9uIHdhbGsodGhpbmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHN0cmluZ2lmeSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb3VudHMuaGFzKHRoaW5nKSkge1xuICAgICAgICAgICAgY291bnRzLnNldCh0aGluZywgY291bnRzLmdldCh0aGluZykgKyAxKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb3VudHMuc2V0KHRoaW5nLCAxKTtcbiAgICAgICAgaWYgKCFpc1ByaW1pdGl2ZSh0aGluZykpIHtcbiAgICAgICAgICAgIHZhciB0eXBlID0gZ2V0VHlwZSh0aGluZyk7XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICAgICAgICAgIGNhc2UgJ1N0cmluZyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnQm9vbGVhbic6XG4gICAgICAgICAgICAgICAgY2FzZSAnRGF0ZSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnUmVnRXhwJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgICAgICAgICAgICAgdGhpbmcuZm9yRWFjaCh3YWxrKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnU2V0JzpcbiAgICAgICAgICAgICAgICBjYXNlICdNYXAnOlxuICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHRoaW5nKS5mb3JFYWNoKHdhbGspO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpbmcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvdG8gIT09IE9iamVjdC5wcm90b3R5cGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3RvICE9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm90bykuc29ydCgpLmpvaW4oJ1xcMCcpICE9PSBvYmplY3RQcm90b093blByb3BlcnR5TmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBzdHJpbmdpZnkgYXJiaXRyYXJ5IG5vbi1QT0pPc1wiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyh0aGluZykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHN0cmluZ2lmeSBQT0pPcyB3aXRoIHN5bWJvbGljIGtleXNcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpbmcpLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gd2Fsayh0aGluZ1trZXldKTsgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2Fsayh2YWx1ZSk7XG4gICAgdmFyIG5hbWVzID0gbmV3IE1hcCgpO1xuICAgIEFycmF5LmZyb20oY291bnRzKVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChlbnRyeSkgeyByZXR1cm4gZW50cnlbMV0gPiAxOyB9KVxuICAgICAgICAuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYlsxXSAtIGFbMV07IH0pXG4gICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChlbnRyeSwgaSkge1xuICAgICAgICBuYW1lcy5zZXQoZW50cnlbMF0sIGdldE5hbWUoaSkpO1xuICAgIH0pO1xuICAgIGZ1bmN0aW9uIHN0cmluZ2lmeSh0aGluZykge1xuICAgICAgICBpZiAobmFtZXMuaGFzKHRoaW5nKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5hbWVzLmdldCh0aGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzUHJpbWl0aXZlKHRoaW5nKSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeVByaW1pdGl2ZSh0aGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHR5cGUgPSBnZXRUeXBlKHRoaW5nKTtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICAgICAgY2FzZSAnU3RyaW5nJzpcbiAgICAgICAgICAgIGNhc2UgJ0Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIHJldHVybiBcIk9iamVjdChcIiArIHN0cmluZ2lmeSh0aGluZy52YWx1ZU9mKCkpICsgXCIpXCI7XG4gICAgICAgICAgICBjYXNlICdSZWdFeHAnOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGluZy50b1N0cmluZygpO1xuICAgICAgICAgICAgY2FzZSAnRGF0ZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibmV3IERhdGUoXCIgKyB0aGluZy5nZXRUaW1lKCkgKyBcIilcIjtcbiAgICAgICAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgICAgICAgICB2YXIgbWVtYmVycyA9IHRoaW5nLm1hcChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gaSBpbiB0aGluZyA/IHN0cmluZ2lmeSh2KSA6ICcnOyB9KTtcbiAgICAgICAgICAgICAgICB2YXIgdGFpbCA9IHRoaW5nLmxlbmd0aCA9PT0gMCB8fCAodGhpbmcubGVuZ3RoIC0gMSBpbiB0aGluZykgPyAnJyA6ICcsJztcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJbXCIgKyBtZW1iZXJzLmpvaW4oJywnKSArIHRhaWwgKyBcIl1cIjtcbiAgICAgICAgICAgIGNhc2UgJ1NldCc6XG4gICAgICAgICAgICBjYXNlICdNYXAnOlxuICAgICAgICAgICAgICAgIHJldHVybiBcIm5ldyBcIiArIHR5cGUgKyBcIihbXCIgKyBBcnJheS5mcm9tKHRoaW5nKS5tYXAoc3RyaW5naWZ5KS5qb2luKCcsJykgKyBcIl0pXCI7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBcIntcIiArIE9iamVjdC5rZXlzKHRoaW5nKS5tYXAoZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gc2FmZUtleShrZXkpICsgXCI6XCIgKyBzdHJpbmdpZnkodGhpbmdba2V5XSk7IH0pLmpvaW4oJywnKSArIFwifVwiO1xuICAgICAgICAgICAgICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGluZyk7XG4gICAgICAgICAgICAgICAgaWYgKHByb3RvID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGluZykubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBcIk9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShudWxsKSxcIiArIG9iaiArIFwiKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFwiT2JqZWN0LmNyZWF0ZShudWxsKVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBzdHIgPSBzdHJpbmdpZnkodmFsdWUpO1xuICAgIGlmIChuYW1lcy5zaXplKSB7XG4gICAgICAgIHZhciBwYXJhbXNfMSA9IFtdO1xuICAgICAgICB2YXIgc3RhdGVtZW50c18xID0gW107XG4gICAgICAgIHZhciB2YWx1ZXNfMSA9IFtdO1xuICAgICAgICBuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lLCB0aGluZykge1xuICAgICAgICAgICAgcGFyYW1zXzEucHVzaChuYW1lKTtcbiAgICAgICAgICAgIGlmIChpc1ByaW1pdGl2ZSh0aGluZykpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNfMS5wdXNoKHN0cmluZ2lmeVByaW1pdGl2ZSh0aGluZykpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0eXBlID0gZ2V0VHlwZSh0aGluZyk7XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICAgICAgICAgIGNhc2UgJ1N0cmluZyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnQm9vbGVhbic6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc18xLnB1c2goXCJPYmplY3QoXCIgKyBzdHJpbmdpZnkodGhpbmcudmFsdWVPZigpKSArIFwiKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnUmVnRXhwJzpcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzXzEucHVzaCh0aGluZy50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnRGF0ZSc6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc18xLnB1c2goXCJuZXcgRGF0ZShcIiArIHRoaW5nLmdldFRpbWUoKSArIFwiKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnQXJyYXknOlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNfMS5wdXNoKFwiQXJyYXkoXCIgKyB0aGluZy5sZW5ndGggKyBcIilcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaW5nLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHNfMS5wdXNoKG5hbWUgKyBcIltcIiArIGkgKyBcIl09XCIgKyBzdHJpbmdpZnkodikpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnU2V0JzpcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzXzEucHVzaChcIm5ldyBTZXRcIik7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHNfMS5wdXNoKG5hbWUgKyBcIi5cIiArIEFycmF5LmZyb20odGhpbmcpLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gXCJhZGQoXCIgKyBzdHJpbmdpZnkodikgKyBcIilcIjsgfSkuam9pbignLicpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnTWFwJzpcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzXzEucHVzaChcIm5ldyBNYXBcIik7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHNfMS5wdXNoKG5hbWUgKyBcIi5cIiArIEFycmF5LmZyb20odGhpbmcpLm1hcChmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrID0gX2FbMF0sIHYgPSBfYVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInNldChcIiArIHN0cmluZ2lmeShrKSArIFwiLCBcIiArIHN0cmluZ2lmeSh2KSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICB9KS5qb2luKCcuJykpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNfMS5wdXNoKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGluZykgPT09IG51bGwgPyAnT2JqZWN0LmNyZWF0ZShudWxsKScgOiAne30nKTtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpbmcpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50c18xLnB1c2goXCJcIiArIG5hbWUgKyBzYWZlUHJvcChrZXkpICsgXCI9XCIgKyBzdHJpbmdpZnkodGhpbmdba2V5XSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHN0YXRlbWVudHNfMS5wdXNoKFwicmV0dXJuIFwiICsgc3RyKTtcbiAgICAgICAgcmV0dXJuIFwiKGZ1bmN0aW9uKFwiICsgcGFyYW1zXzEuam9pbignLCcpICsgXCIpe1wiICsgc3RhdGVtZW50c18xLmpvaW4oJzsnKSArIFwifShcIiArIHZhbHVlc18xLmpvaW4oJywnKSArIFwiKSlcIjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0TmFtZShudW0pIHtcbiAgICB2YXIgbmFtZSA9ICcnO1xuICAgIGRvIHtcbiAgICAgICAgbmFtZSA9IGNoYXJzW251bSAlIGNoYXJzLmxlbmd0aF0gKyBuYW1lO1xuICAgICAgICBudW0gPSB+fihudW0gLyBjaGFycy5sZW5ndGgpIC0gMTtcbiAgICB9IHdoaWxlIChudW0gPj0gMCk7XG4gICAgcmV0dXJuIHJlc2VydmVkLnRlc3QobmFtZSkgPyBuYW1lICsgXCJfXCIgOiBuYW1lO1xufVxuZnVuY3Rpb24gaXNQcmltaXRpdmUodGhpbmcpIHtcbiAgICByZXR1cm4gT2JqZWN0KHRoaW5nKSAhPT0gdGhpbmc7XG59XG5mdW5jdGlvbiBzdHJpbmdpZnlQcmltaXRpdmUodGhpbmcpIHtcbiAgICBpZiAodHlwZW9mIHRoaW5nID09PSAnc3RyaW5nJylcbiAgICAgICAgcmV0dXJuIHN0cmluZ2lmeVN0cmluZyh0aGluZyk7XG4gICAgaWYgKHRoaW5nID09PSB2b2lkIDApXG4gICAgICAgIHJldHVybiAndm9pZCAwJztcbiAgICBpZiAodGhpbmcgPT09IDAgJiYgMSAvIHRoaW5nIDwgMClcbiAgICAgICAgcmV0dXJuICctMCc7XG4gICAgdmFyIHN0ciA9IFN0cmluZyh0aGluZyk7XG4gICAgaWYgKHR5cGVvZiB0aGluZyA9PT0gJ251bWJlcicpXG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvXigtKT8wXFwuLywgJyQxLicpO1xuICAgIHJldHVybiBzdHI7XG59XG5mdW5jdGlvbiBnZXRUeXBlKHRoaW5nKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGluZykuc2xpY2UoOCwgLTEpO1xufVxuZnVuY3Rpb24gZXNjYXBlVW5zYWZlQ2hhcihjKSB7XG4gICAgcmV0dXJuIGVzY2FwZWRbY10gfHwgYztcbn1cbmZ1bmN0aW9uIGVzY2FwZVVuc2FmZUNoYXJzKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSh1bnNhZmVDaGFycywgZXNjYXBlVW5zYWZlQ2hhcik7XG59XG5mdW5jdGlvbiBzYWZlS2V5KGtleSkge1xuICAgIHJldHVybiAvXltfJGEtekEtWl1bXyRhLXpBLVowLTldKiQvLnRlc3Qoa2V5KSA/IGtleSA6IGVzY2FwZVVuc2FmZUNoYXJzKEpTT04uc3RyaW5naWZ5KGtleSkpO1xufVxuZnVuY3Rpb24gc2FmZVByb3Aoa2V5KSB7XG4gICAgcmV0dXJuIC9eW18kYS16QS1aXVtfJGEtekEtWjAtOV0qJC8udGVzdChrZXkpID8gXCIuXCIgKyBrZXkgOiBcIltcIiArIGVzY2FwZVVuc2FmZUNoYXJzKEpTT04uc3RyaW5naWZ5KGtleSkpICsgXCJdXCI7XG59XG5mdW5jdGlvbiBzdHJpbmdpZnlTdHJpbmcoc3RyKSB7XG4gICAgdmFyIHJlc3VsdCA9ICdcIic7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGNoYXIgPSBzdHIuY2hhckF0KGkpO1xuICAgICAgICB2YXIgY29kZSA9IGNoYXIuY2hhckNvZGVBdCgwKTtcbiAgICAgICAgaWYgKGNoYXIgPT09ICdcIicpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFxcXFwiJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjaGFyIGluIGVzY2FwZWQpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBlc2NhcGVkW2NoYXJdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNvZGUgPj0gMHhkODAwICYmIGNvZGUgPD0gMHhkZmZmKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHN0ci5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIGJlZ2lubmluZyBvZiBhIFtoaWdoLCBsb3ddIHN1cnJvZ2F0ZSBwYWlyLFxuICAgICAgICAgICAgLy8gYWRkIHRoZSBuZXh0IHR3byBjaGFyYWN0ZXJzLCBvdGhlcndpc2UgZXNjYXBlXG4gICAgICAgICAgICBpZiAoY29kZSA8PSAweGRiZmYgJiYgKG5leHQgPj0gMHhkYzAwICYmIG5leHQgPD0gMHhkZmZmKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjaGFyICsgc3RyWysraV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gXCJcXFxcdVwiICsgY29kZS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBjaGFyO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlc3VsdCArPSAnXCInO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS90bXB2YXIvanNkb20vYmxvYi9hYTg1YjJhYmYwNzc2NmZmN2JmNWMxZjZkYWFmYjM3MjZmMmYyZGI1L2xpYi9qc2RvbS9saXZpbmcvYmxvYi5qc1xuXG4vLyBmaXggZm9yIFwiUmVhZGFibGVcIiBpc24ndCBhIG5hbWVkIGV4cG9ydCBpc3N1ZVxuY29uc3QgUmVhZGFibGUgPSBTdHJlYW0uUmVhZGFibGU7XG5cbmNvbnN0IEJVRkZFUiA9IFN5bWJvbCgnYnVmZmVyJyk7XG5jb25zdCBUWVBFID0gU3ltYm9sKCd0eXBlJyk7XG5cbmNsYXNzIEJsb2Ige1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzW1RZUEVdID0gJyc7XG5cblx0XHRjb25zdCBibG9iUGFydHMgPSBhcmd1bWVudHNbMF07XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IGFyZ3VtZW50c1sxXTtcblxuXHRcdGNvbnN0IGJ1ZmZlcnMgPSBbXTtcblx0XHRsZXQgc2l6ZSA9IDA7XG5cblx0XHRpZiAoYmxvYlBhcnRzKSB7XG5cdFx0XHRjb25zdCBhID0gYmxvYlBhcnRzO1xuXHRcdFx0Y29uc3QgbGVuZ3RoID0gTnVtYmVyKGEubGVuZ3RoKTtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc3QgZWxlbWVudCA9IGFbaV07XG5cdFx0XHRcdGxldCBidWZmZXI7XG5cdFx0XHRcdGlmIChlbGVtZW50IGluc3RhbmNlb2YgQnVmZmVyKSB7XG5cdFx0XHRcdFx0YnVmZmVyID0gZWxlbWVudDtcblx0XHRcdFx0fSBlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoZWxlbWVudCkpIHtcblx0XHRcdFx0XHRidWZmZXIgPSBCdWZmZXIuZnJvbShlbGVtZW50LmJ1ZmZlciwgZWxlbWVudC5ieXRlT2Zmc2V0LCBlbGVtZW50LmJ5dGVMZW5ndGgpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuXHRcdFx0XHRcdGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGVsZW1lbnQpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBCbG9iKSB7XG5cdFx0XHRcdFx0YnVmZmVyID0gZWxlbWVudFtCVUZGRVJdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJyA/IGVsZW1lbnQgOiBTdHJpbmcoZWxlbWVudCkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHNpemUgKz0gYnVmZmVyLmxlbmd0aDtcblx0XHRcdFx0YnVmZmVycy5wdXNoKGJ1ZmZlcik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpc1tCVUZGRVJdID0gQnVmZmVyLmNvbmNhdChidWZmZXJzKTtcblxuXHRcdGxldCB0eXBlID0gb3B0aW9ucyAmJiBvcHRpb25zLnR5cGUgIT09IHVuZGVmaW5lZCAmJiBTdHJpbmcob3B0aW9ucy50eXBlKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICh0eXBlICYmICEvW15cXHUwMDIwLVxcdTAwN0VdLy50ZXN0KHR5cGUpKSB7XG5cdFx0XHR0aGlzW1RZUEVdID0gdHlwZTtcblx0XHR9XG5cdH1cblx0Z2V0IHNpemUoKSB7XG5cdFx0cmV0dXJuIHRoaXNbQlVGRkVSXS5sZW5ndGg7XG5cdH1cblx0Z2V0IHR5cGUoKSB7XG5cdFx0cmV0dXJuIHRoaXNbVFlQRV07XG5cdH1cblx0dGV4dCgpIHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXNbQlVGRkVSXS50b1N0cmluZygpKTtcblx0fVxuXHRhcnJheUJ1ZmZlcigpIHtcblx0XHRjb25zdCBidWYgPSB0aGlzW0JVRkZFUl07XG5cdFx0Y29uc3QgYWIgPSBidWYuYnVmZmVyLnNsaWNlKGJ1Zi5ieXRlT2Zmc2V0LCBidWYuYnl0ZU9mZnNldCArIGJ1Zi5ieXRlTGVuZ3RoKTtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFiKTtcblx0fVxuXHRzdHJlYW0oKSB7XG5cdFx0Y29uc3QgcmVhZGFibGUgPSBuZXcgUmVhZGFibGUoKTtcblx0XHRyZWFkYWJsZS5fcmVhZCA9IGZ1bmN0aW9uICgpIHt9O1xuXHRcdHJlYWRhYmxlLnB1c2godGhpc1tCVUZGRVJdKTtcblx0XHRyZWFkYWJsZS5wdXNoKG51bGwpO1xuXHRcdHJldHVybiByZWFkYWJsZTtcblx0fVxuXHR0b1N0cmluZygpIHtcblx0XHRyZXR1cm4gJ1tvYmplY3QgQmxvYl0nO1xuXHR9XG5cdHNsaWNlKCkge1xuXHRcdGNvbnN0IHNpemUgPSB0aGlzLnNpemU7XG5cblx0XHRjb25zdCBzdGFydCA9IGFyZ3VtZW50c1swXTtcblx0XHRjb25zdCBlbmQgPSBhcmd1bWVudHNbMV07XG5cdFx0bGV0IHJlbGF0aXZlU3RhcnQsIHJlbGF0aXZlRW5kO1xuXHRcdGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZWxhdGl2ZVN0YXJ0ID0gMDtcblx0XHR9IGVsc2UgaWYgKHN0YXJ0IDwgMCkge1xuXHRcdFx0cmVsYXRpdmVTdGFydCA9IE1hdGgubWF4KHNpemUgKyBzdGFydCwgMCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlbGF0aXZlU3RhcnQgPSBNYXRoLm1pbihzdGFydCwgc2l6ZSk7XG5cdFx0fVxuXHRcdGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmVsYXRpdmVFbmQgPSBzaXplO1xuXHRcdH0gZWxzZSBpZiAoZW5kIDwgMCkge1xuXHRcdFx0cmVsYXRpdmVFbmQgPSBNYXRoLm1heChzaXplICsgZW5kLCAwKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVsYXRpdmVFbmQgPSBNYXRoLm1pbihlbmQsIHNpemUpO1xuXHRcdH1cblx0XHRjb25zdCBzcGFuID0gTWF0aC5tYXgocmVsYXRpdmVFbmQgLSByZWxhdGl2ZVN0YXJ0LCAwKTtcblxuXHRcdGNvbnN0IGJ1ZmZlciA9IHRoaXNbQlVGRkVSXTtcblx0XHRjb25zdCBzbGljZWRCdWZmZXIgPSBidWZmZXIuc2xpY2UocmVsYXRpdmVTdGFydCwgcmVsYXRpdmVTdGFydCArIHNwYW4pO1xuXHRcdGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbXSwgeyB0eXBlOiBhcmd1bWVudHNbMl0gfSk7XG5cdFx0YmxvYltCVUZGRVJdID0gc2xpY2VkQnVmZmVyO1xuXHRcdHJldHVybiBibG9iO1xuXHR9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKEJsb2IucHJvdG90eXBlLCB7XG5cdHNpemU6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHR0eXBlOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0c2xpY2U6IHsgZW51bWVyYWJsZTogdHJ1ZSB9XG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJsb2IucHJvdG90eXBlLCBTeW1ib2wudG9TdHJpbmdUYWcsIHtcblx0dmFsdWU6ICdCbG9iJyxcblx0d3JpdGFibGU6IGZhbHNlLFxuXHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0Y29uZmlndXJhYmxlOiB0cnVlXG59KTtcblxuLyoqXG4gKiBmZXRjaC1lcnJvci5qc1xuICpcbiAqIEZldGNoRXJyb3IgaW50ZXJmYWNlIGZvciBvcGVyYXRpb25hbCBlcnJvcnNcbiAqL1xuXG4vKipcbiAqIENyZWF0ZSBGZXRjaEVycm9yIGluc3RhbmNlXG4gKlxuICogQHBhcmFtICAgU3RyaW5nICAgICAgbWVzc2FnZSAgICAgIEVycm9yIG1lc3NhZ2UgZm9yIGh1bWFuXG4gKiBAcGFyYW0gICBTdHJpbmcgICAgICB0eXBlICAgICAgICAgRXJyb3IgdHlwZSBmb3IgbWFjaGluZVxuICogQHBhcmFtICAgU3RyaW5nICAgICAgc3lzdGVtRXJyb3IgIEZvciBOb2RlLmpzIHN5c3RlbSBlcnJvclxuICogQHJldHVybiAgRmV0Y2hFcnJvclxuICovXG5mdW5jdGlvbiBGZXRjaEVycm9yKG1lc3NhZ2UsIHR5cGUsIHN5c3RlbUVycm9yKSB7XG4gIEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgdGhpcy50eXBlID0gdHlwZTtcblxuICAvLyB3aGVuIGVyci50eXBlIGlzIGBzeXN0ZW1gLCBlcnIuY29kZSBjb250YWlucyBzeXN0ZW0gZXJyb3IgY29kZVxuICBpZiAoc3lzdGVtRXJyb3IpIHtcbiAgICB0aGlzLmNvZGUgPSB0aGlzLmVycm5vID0gc3lzdGVtRXJyb3IuY29kZTtcbiAgfVxuXG4gIC8vIGhpZGUgY3VzdG9tIGVycm9yIGltcGxlbWVudGF0aW9uIGRldGFpbHMgZnJvbSBlbmQtdXNlcnNcbiAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG59XG5cbkZldGNoRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuRmV0Y2hFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGZXRjaEVycm9yO1xuRmV0Y2hFcnJvci5wcm90b3R5cGUubmFtZSA9ICdGZXRjaEVycm9yJztcblxubGV0IGNvbnZlcnQ7XG50cnkge1xuXHRjb252ZXJ0ID0gcmVxdWlyZSgnZW5jb2RpbmcnKS5jb252ZXJ0O1xufSBjYXRjaCAoZSkge31cblxuY29uc3QgSU5URVJOQUxTID0gU3ltYm9sKCdCb2R5IGludGVybmFscycpO1xuXG4vLyBmaXggYW4gaXNzdWUgd2hlcmUgXCJQYXNzVGhyb3VnaFwiIGlzbid0IGEgbmFtZWQgZXhwb3J0IGZvciBub2RlIDwxMFxuY29uc3QgUGFzc1Rocm91Z2ggPSBTdHJlYW0uUGFzc1Rocm91Z2g7XG5cbi8qKlxuICogQm9keSBtaXhpblxuICpcbiAqIFJlZjogaHR0cHM6Ly9mZXRjaC5zcGVjLndoYXR3Zy5vcmcvI2JvZHlcbiAqXG4gKiBAcGFyYW0gICBTdHJlYW0gIGJvZHkgIFJlYWRhYmxlIHN0cmVhbVxuICogQHBhcmFtICAgT2JqZWN0ICBvcHRzICBSZXNwb25zZSBvcHRpb25zXG4gKiBAcmV0dXJuICBWb2lkXG4gKi9cbmZ1bmN0aW9uIEJvZHkoYm9keSkge1xuXHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdHZhciBfcmVmID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fSxcblx0ICAgIF9yZWYkc2l6ZSA9IF9yZWYuc2l6ZTtcblxuXHRsZXQgc2l6ZSA9IF9yZWYkc2l6ZSA9PT0gdW5kZWZpbmVkID8gMCA6IF9yZWYkc2l6ZTtcblx0dmFyIF9yZWYkdGltZW91dCA9IF9yZWYudGltZW91dDtcblx0bGV0IHRpbWVvdXQgPSBfcmVmJHRpbWVvdXQgPT09IHVuZGVmaW5lZCA/IDAgOiBfcmVmJHRpbWVvdXQ7XG5cblx0aWYgKGJvZHkgPT0gbnVsbCkge1xuXHRcdC8vIGJvZHkgaXMgdW5kZWZpbmVkIG9yIG51bGxcblx0XHRib2R5ID0gbnVsbDtcblx0fSBlbHNlIGlmIChpc1VSTFNlYXJjaFBhcmFtcyhib2R5KSkge1xuXHRcdC8vIGJvZHkgaXMgYSBVUkxTZWFyY2hQYXJhbXNcblx0XHRib2R5ID0gQnVmZmVyLmZyb20oYm9keS50b1N0cmluZygpKTtcblx0fSBlbHNlIGlmIChpc0Jsb2IoYm9keSkpIDsgZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGJvZHkpKSA7IGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChib2R5KSA9PT0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJykge1xuXHRcdC8vIGJvZHkgaXMgQXJyYXlCdWZmZXJcblx0XHRib2R5ID0gQnVmZmVyLmZyb20oYm9keSk7XG5cdH0gZWxzZSBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBBcnJheUJ1ZmZlclZpZXdcblx0XHRib2R5ID0gQnVmZmVyLmZyb20oYm9keS5idWZmZXIsIGJvZHkuYnl0ZU9mZnNldCwgYm9keS5ieXRlTGVuZ3RoKTtcblx0fSBlbHNlIGlmIChib2R5IGluc3RhbmNlb2YgU3RyZWFtKSA7IGVsc2Uge1xuXHRcdC8vIG5vbmUgb2YgdGhlIGFib3ZlXG5cdFx0Ly8gY29lcmNlIHRvIHN0cmluZyB0aGVuIGJ1ZmZlclxuXHRcdGJvZHkgPSBCdWZmZXIuZnJvbShTdHJpbmcoYm9keSkpO1xuXHR9XG5cdHRoaXNbSU5URVJOQUxTXSA9IHtcblx0XHRib2R5LFxuXHRcdGRpc3R1cmJlZDogZmFsc2UsXG5cdFx0ZXJyb3I6IG51bGxcblx0fTtcblx0dGhpcy5zaXplID0gc2l6ZTtcblx0dGhpcy50aW1lb3V0ID0gdGltZW91dDtcblxuXHRpZiAoYm9keSBpbnN0YW5jZW9mIFN0cmVhbSkge1xuXHRcdGJvZHkub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0Y29uc3QgZXJyb3IgPSBlcnIubmFtZSA9PT0gJ0Fib3J0RXJyb3InID8gZXJyIDogbmV3IEZldGNoRXJyb3IoYEludmFsaWQgcmVzcG9uc2UgYm9keSB3aGlsZSB0cnlpbmcgdG8gZmV0Y2ggJHtfdGhpcy51cmx9OiAke2Vyci5tZXNzYWdlfWAsICdzeXN0ZW0nLCBlcnIpO1xuXHRcdFx0X3RoaXNbSU5URVJOQUxTXS5lcnJvciA9IGVycm9yO1xuXHRcdH0pO1xuXHR9XG59XG5cbkJvZHkucHJvdG90eXBlID0ge1xuXHRnZXQgYm9keSgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFNdLmJvZHk7XG5cdH0sXG5cblx0Z2V0IGJvZHlVc2VkKCkge1xuXHRcdHJldHVybiB0aGlzW0lOVEVSTkFMU10uZGlzdHVyYmVkO1xuXHR9LFxuXG5cdC8qKlxuICAqIERlY29kZSByZXNwb25zZSBhcyBBcnJheUJ1ZmZlclxuICAqXG4gICogQHJldHVybiAgUHJvbWlzZVxuICAqL1xuXHRhcnJheUJ1ZmZlcigpIHtcblx0XHRyZXR1cm4gY29uc3VtZUJvZHkuY2FsbCh0aGlzKS50aGVuKGZ1bmN0aW9uIChidWYpIHtcblx0XHRcdHJldHVybiBidWYuYnVmZmVyLnNsaWNlKGJ1Zi5ieXRlT2Zmc2V0LCBidWYuYnl0ZU9mZnNldCArIGJ1Zi5ieXRlTGVuZ3RoKTtcblx0XHR9KTtcblx0fSxcblxuXHQvKipcbiAgKiBSZXR1cm4gcmF3IHJlc3BvbnNlIGFzIEJsb2JcbiAgKlxuICAqIEByZXR1cm4gUHJvbWlzZVxuICAqL1xuXHRibG9iKCkge1xuXHRcdGxldCBjdCA9IHRoaXMuaGVhZGVycyAmJiB0aGlzLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSB8fCAnJztcblx0XHRyZXR1cm4gY29uc3VtZUJvZHkuY2FsbCh0aGlzKS50aGVuKGZ1bmN0aW9uIChidWYpIHtcblx0XHRcdHJldHVybiBPYmplY3QuYXNzaWduKFxuXHRcdFx0Ly8gUHJldmVudCBjb3B5aW5nXG5cdFx0XHRuZXcgQmxvYihbXSwge1xuXHRcdFx0XHR0eXBlOiBjdC50b0xvd2VyQ2FzZSgpXG5cdFx0XHR9KSwge1xuXHRcdFx0XHRbQlVGRkVSXTogYnVmXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSxcblxuXHQvKipcbiAgKiBEZWNvZGUgcmVzcG9uc2UgYXMganNvblxuICAqXG4gICogQHJldHVybiAgUHJvbWlzZVxuICAqL1xuXHRqc29uKCkge1xuXHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0cmV0dXJuIGNvbnN1bWVCb2R5LmNhbGwodGhpcykudGhlbihmdW5jdGlvbiAoYnVmZmVyKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShidWZmZXIudG9TdHJpbmcoKSk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0cmV0dXJuIEJvZHkuUHJvbWlzZS5yZWplY3QobmV3IEZldGNoRXJyb3IoYGludmFsaWQganNvbiByZXNwb25zZSBib2R5IGF0ICR7X3RoaXMyLnVybH0gcmVhc29uOiAke2Vyci5tZXNzYWdlfWAsICdpbnZhbGlkLWpzb24nKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG4gICogRGVjb2RlIHJlc3BvbnNlIGFzIHRleHRcbiAgKlxuICAqIEByZXR1cm4gIFByb21pc2VcbiAgKi9cblx0dGV4dCgpIHtcblx0XHRyZXR1cm4gY29uc3VtZUJvZHkuY2FsbCh0aGlzKS50aGVuKGZ1bmN0aW9uIChidWZmZXIpIHtcblx0XHRcdHJldHVybiBidWZmZXIudG9TdHJpbmcoKTtcblx0XHR9KTtcblx0fSxcblxuXHQvKipcbiAgKiBEZWNvZGUgcmVzcG9uc2UgYXMgYnVmZmVyIChub24tc3BlYyBhcGkpXG4gICpcbiAgKiBAcmV0dXJuICBQcm9taXNlXG4gICovXG5cdGJ1ZmZlcigpIHtcblx0XHRyZXR1cm4gY29uc3VtZUJvZHkuY2FsbCh0aGlzKTtcblx0fSxcblxuXHQvKipcbiAgKiBEZWNvZGUgcmVzcG9uc2UgYXMgdGV4dCwgd2hpbGUgYXV0b21hdGljYWxseSBkZXRlY3RpbmcgdGhlIGVuY29kaW5nIGFuZFxuICAqIHRyeWluZyB0byBkZWNvZGUgdG8gVVRGLTggKG5vbi1zcGVjIGFwaSlcbiAgKlxuICAqIEByZXR1cm4gIFByb21pc2VcbiAgKi9cblx0dGV4dENvbnZlcnRlZCgpIHtcblx0XHR2YXIgX3RoaXMzID0gdGhpcztcblxuXHRcdHJldHVybiBjb25zdW1lQm9keS5jYWxsKHRoaXMpLnRoZW4oZnVuY3Rpb24gKGJ1ZmZlcikge1xuXHRcdFx0cmV0dXJuIGNvbnZlcnRCb2R5KGJ1ZmZlciwgX3RoaXMzLmhlYWRlcnMpO1xuXHRcdH0pO1xuXHR9XG59O1xuXG4vLyBJbiBicm93c2VycywgYWxsIHByb3BlcnRpZXMgYXJlIGVudW1lcmFibGUuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhCb2R5LnByb3RvdHlwZSwge1xuXHRib2R5OiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0Ym9keVVzZWQ6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRhcnJheUJ1ZmZlcjogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdGJsb2I6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRqc29uOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0dGV4dDogeyBlbnVtZXJhYmxlOiB0cnVlIH1cbn0pO1xuXG5Cb2R5Lm1peEluID0gZnVuY3Rpb24gKHByb3RvKSB7XG5cdGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhCb2R5LnByb3RvdHlwZSkpIHtcblx0XHQvLyBpc3RhbmJ1bCBpZ25vcmUgZWxzZTogZnV0dXJlIHByb29mXG5cdFx0aWYgKCEobmFtZSBpbiBwcm90bykpIHtcblx0XHRcdGNvbnN0IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEJvZHkucHJvdG90eXBlLCBuYW1lKTtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgbmFtZSwgZGVzYyk7XG5cdFx0fVxuXHR9XG59O1xuXG4vKipcbiAqIENvbnN1bWUgYW5kIGNvbnZlcnQgYW4gZW50aXJlIEJvZHkgdG8gYSBCdWZmZXIuXG4gKlxuICogUmVmOiBodHRwczovL2ZldGNoLnNwZWMud2hhdHdnLm9yZy8jY29uY2VwdC1ib2R5LWNvbnN1bWUtYm9keVxuICpcbiAqIEByZXR1cm4gIFByb21pc2VcbiAqL1xuZnVuY3Rpb24gY29uc3VtZUJvZHkoKSB7XG5cdHZhciBfdGhpczQgPSB0aGlzO1xuXG5cdGlmICh0aGlzW0lOVEVSTkFMU10uZGlzdHVyYmVkKSB7XG5cdFx0cmV0dXJuIEJvZHkuUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcihgYm9keSB1c2VkIGFscmVhZHkgZm9yOiAke3RoaXMudXJsfWApKTtcblx0fVxuXG5cdHRoaXNbSU5URVJOQUxTXS5kaXN0dXJiZWQgPSB0cnVlO1xuXG5cdGlmICh0aGlzW0lOVEVSTkFMU10uZXJyb3IpIHtcblx0XHRyZXR1cm4gQm9keS5Qcm9taXNlLnJlamVjdCh0aGlzW0lOVEVSTkFMU10uZXJyb3IpO1xuXHR9XG5cblx0bGV0IGJvZHkgPSB0aGlzLmJvZHk7XG5cblx0Ly8gYm9keSBpcyBudWxsXG5cdGlmIChib2R5ID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIEJvZHkuUHJvbWlzZS5yZXNvbHZlKEJ1ZmZlci5hbGxvYygwKSk7XG5cdH1cblxuXHQvLyBib2R5IGlzIGJsb2Jcblx0aWYgKGlzQmxvYihib2R5KSkge1xuXHRcdGJvZHkgPSBib2R5LnN0cmVhbSgpO1xuXHR9XG5cblx0Ly8gYm9keSBpcyBidWZmZXJcblx0aWYgKEJ1ZmZlci5pc0J1ZmZlcihib2R5KSkge1xuXHRcdHJldHVybiBCb2R5LlByb21pc2UucmVzb2x2ZShib2R5KTtcblx0fVxuXG5cdC8vIGlzdGFuYnVsIGlnbm9yZSBpZjogc2hvdWxkIG5ldmVyIGhhcHBlblxuXHRpZiAoIShib2R5IGluc3RhbmNlb2YgU3RyZWFtKSkge1xuXHRcdHJldHVybiBCb2R5LlByb21pc2UucmVzb2x2ZShCdWZmZXIuYWxsb2MoMCkpO1xuXHR9XG5cblx0Ly8gYm9keSBpcyBzdHJlYW1cblx0Ly8gZ2V0IHJlYWR5IHRvIGFjdHVhbGx5IGNvbnN1bWUgdGhlIGJvZHlcblx0bGV0IGFjY3VtID0gW107XG5cdGxldCBhY2N1bUJ5dGVzID0gMDtcblx0bGV0IGFib3J0ID0gZmFsc2U7XG5cblx0cmV0dXJuIG5ldyBCb2R5LlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdGxldCByZXNUaW1lb3V0O1xuXG5cdFx0Ly8gYWxsb3cgdGltZW91dCBvbiBzbG93IHJlc3BvbnNlIGJvZHlcblx0XHRpZiAoX3RoaXM0LnRpbWVvdXQpIHtcblx0XHRcdHJlc1RpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0YWJvcnQgPSB0cnVlO1xuXHRcdFx0XHRyZWplY3QobmV3IEZldGNoRXJyb3IoYFJlc3BvbnNlIHRpbWVvdXQgd2hpbGUgdHJ5aW5nIHRvIGZldGNoICR7X3RoaXM0LnVybH0gKG92ZXIgJHtfdGhpczQudGltZW91dH1tcylgLCAnYm9keS10aW1lb3V0JykpO1xuXHRcdFx0fSwgX3RoaXM0LnRpbWVvdXQpO1xuXHRcdH1cblxuXHRcdC8vIGhhbmRsZSBzdHJlYW0gZXJyb3JzXG5cdFx0Ym9keS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRpZiAoZXJyLm5hbWUgPT09ICdBYm9ydEVycm9yJykge1xuXHRcdFx0XHQvLyBpZiB0aGUgcmVxdWVzdCB3YXMgYWJvcnRlZCwgcmVqZWN0IHdpdGggdGhpcyBFcnJvclxuXHRcdFx0XHRhYm9ydCA9IHRydWU7XG5cdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gb3RoZXIgZXJyb3JzLCBzdWNoIGFzIGluY29ycmVjdCBjb250ZW50LWVuY29kaW5nXG5cdFx0XHRcdHJlamVjdChuZXcgRmV0Y2hFcnJvcihgSW52YWxpZCByZXNwb25zZSBib2R5IHdoaWxlIHRyeWluZyB0byBmZXRjaCAke190aGlzNC51cmx9OiAke2Vyci5tZXNzYWdlfWAsICdzeXN0ZW0nLCBlcnIpKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGJvZHkub24oJ2RhdGEnLCBmdW5jdGlvbiAoY2h1bmspIHtcblx0XHRcdGlmIChhYm9ydCB8fCBjaHVuayA9PT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfdGhpczQuc2l6ZSAmJiBhY2N1bUJ5dGVzICsgY2h1bmsubGVuZ3RoID4gX3RoaXM0LnNpemUpIHtcblx0XHRcdFx0YWJvcnQgPSB0cnVlO1xuXHRcdFx0XHRyZWplY3QobmV3IEZldGNoRXJyb3IoYGNvbnRlbnQgc2l6ZSBhdCAke190aGlzNC51cmx9IG92ZXIgbGltaXQ6ICR7X3RoaXM0LnNpemV9YCwgJ21heC1zaXplJykpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGFjY3VtQnl0ZXMgKz0gY2h1bmsubGVuZ3RoO1xuXHRcdFx0YWNjdW0ucHVzaChjaHVuayk7XG5cdFx0fSk7XG5cblx0XHRib2R5Lm9uKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoYWJvcnQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjbGVhclRpbWVvdXQocmVzVGltZW91dCk7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJlc29sdmUoQnVmZmVyLmNvbmNhdChhY2N1bSwgYWNjdW1CeXRlcykpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdC8vIGhhbmRsZSBzdHJlYW1zIHRoYXQgaGF2ZSBhY2N1bXVsYXRlZCB0b28gbXVjaCBkYXRhIChpc3N1ZSAjNDE0KVxuXHRcdFx0XHRyZWplY3QobmV3IEZldGNoRXJyb3IoYENvdWxkIG5vdCBjcmVhdGUgQnVmZmVyIGZyb20gcmVzcG9uc2UgYm9keSBmb3IgJHtfdGhpczQudXJsfTogJHtlcnIubWVzc2FnZX1gLCAnc3lzdGVtJywgZXJyKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xufVxuXG4vKipcbiAqIERldGVjdCBidWZmZXIgZW5jb2RpbmcgYW5kIGNvbnZlcnQgdG8gdGFyZ2V0IGVuY29kaW5nXG4gKiByZWY6IGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTEvV0QtaHRtbDUtMjAxMTAxMTMvcGFyc2luZy5odG1sI2RldGVybWluaW5nLXRoZS1jaGFyYWN0ZXItZW5jb2RpbmdcbiAqXG4gKiBAcGFyYW0gICBCdWZmZXIgIGJ1ZmZlciAgICBJbmNvbWluZyBidWZmZXJcbiAqIEBwYXJhbSAgIFN0cmluZyAgZW5jb2RpbmcgIFRhcmdldCBlbmNvZGluZ1xuICogQHJldHVybiAgU3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRCb2R5KGJ1ZmZlciwgaGVhZGVycykge1xuXHRpZiAodHlwZW9mIGNvbnZlcnQgIT09ICdmdW5jdGlvbicpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwYWNrYWdlIGBlbmNvZGluZ2AgbXVzdCBiZSBpbnN0YWxsZWQgdG8gdXNlIHRoZSB0ZXh0Q29udmVydGVkKCkgZnVuY3Rpb24nKTtcblx0fVxuXG5cdGNvbnN0IGN0ID0gaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpO1xuXHRsZXQgY2hhcnNldCA9ICd1dGYtOCc7XG5cdGxldCByZXMsIHN0cjtcblxuXHQvLyBoZWFkZXJcblx0aWYgKGN0KSB7XG5cdFx0cmVzID0gL2NoYXJzZXQ9KFteO10qKS9pLmV4ZWMoY3QpO1xuXHR9XG5cblx0Ly8gbm8gY2hhcnNldCBpbiBjb250ZW50IHR5cGUsIHBlZWsgYXQgcmVzcG9uc2UgYm9keSBmb3IgYXQgbW9zdCAxMDI0IGJ5dGVzXG5cdHN0ciA9IGJ1ZmZlci5zbGljZSgwLCAxMDI0KS50b1N0cmluZygpO1xuXG5cdC8vIGh0bWw1XG5cdGlmICghcmVzICYmIHN0cikge1xuXHRcdHJlcyA9IC88bWV0YS4rP2NoYXJzZXQ9KFsnXCJdKSguKz8pXFwxL2kuZXhlYyhzdHIpO1xuXHR9XG5cblx0Ly8gaHRtbDRcblx0aWYgKCFyZXMgJiYgc3RyKSB7XG5cdFx0cmVzID0gLzxtZXRhW1xcc10rP2h0dHAtZXF1aXY9KFsnXCJdKWNvbnRlbnQtdHlwZVxcMVtcXHNdKz9jb250ZW50PShbJ1wiXSkoLis/KVxcMi9pLmV4ZWMoc3RyKTtcblxuXHRcdGlmIChyZXMpIHtcblx0XHRcdHJlcyA9IC9jaGFyc2V0PSguKikvaS5leGVjKHJlcy5wb3AoKSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8geG1sXG5cdGlmICghcmVzICYmIHN0cikge1xuXHRcdHJlcyA9IC88XFw/eG1sLis/ZW5jb2Rpbmc9KFsnXCJdKSguKz8pXFwxL2kuZXhlYyhzdHIpO1xuXHR9XG5cblx0Ly8gZm91bmQgY2hhcnNldFxuXHRpZiAocmVzKSB7XG5cdFx0Y2hhcnNldCA9IHJlcy5wb3AoKTtcblxuXHRcdC8vIHByZXZlbnQgZGVjb2RlIGlzc3VlcyB3aGVuIHNpdGVzIHVzZSBpbmNvcnJlY3QgZW5jb2Rpbmdcblx0XHQvLyByZWY6IGh0dHBzOi8vaHNpdm9uZW4uZmkvZW5jb2RpbmctbWVudS9cblx0XHRpZiAoY2hhcnNldCA9PT0gJ2diMjMxMicgfHwgY2hhcnNldCA9PT0gJ2diaycpIHtcblx0XHRcdGNoYXJzZXQgPSAnZ2IxODAzMCc7XG5cdFx0fVxuXHR9XG5cblx0Ly8gdHVybiByYXcgYnVmZmVycyBpbnRvIGEgc2luZ2xlIHV0Zi04IGJ1ZmZlclxuXHRyZXR1cm4gY29udmVydChidWZmZXIsICdVVEYtOCcsIGNoYXJzZXQpLnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICogRGV0ZWN0IGEgVVJMU2VhcmNoUGFyYW1zIG9iamVjdFxuICogcmVmOiBodHRwczovL2dpdGh1Yi5jb20vYml0aW5uL25vZGUtZmV0Y2gvaXNzdWVzLzI5NiNpc3N1ZWNvbW1lbnQtMzA3NTk4MTQzXG4gKlxuICogQHBhcmFtICAgT2JqZWN0ICBvYmogICAgIE9iamVjdCB0byBkZXRlY3QgYnkgdHlwZSBvciBicmFuZFxuICogQHJldHVybiAgU3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGlzVVJMU2VhcmNoUGFyYW1zKG9iaikge1xuXHQvLyBEdWNrLXR5cGluZyBhcyBhIG5lY2Vzc2FyeSBjb25kaXRpb24uXG5cdGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCB0eXBlb2Ygb2JqLmFwcGVuZCAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLmRlbGV0ZSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLmdldCAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLmdldEFsbCAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLmhhcyAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLnNldCAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIEJyYW5kLWNoZWNraW5nIGFuZCBtb3JlIGR1Y2stdHlwaW5nIGFzIG9wdGlvbmFsIGNvbmRpdGlvbi5cblx0cmV0dXJuIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnVVJMU2VhcmNoUGFyYW1zJyB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgVVJMU2VhcmNoUGFyYW1zXScgfHwgdHlwZW9mIG9iai5zb3J0ID09PSAnZnVuY3Rpb24nO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGEgVzNDIGBCbG9iYCBvYmplY3QgKHdoaWNoIGBGaWxlYCBpbmhlcml0cyBmcm9tKVxuICogQHBhcmFtICB7Kn0gb2JqXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc0Jsb2Iob2JqKSB7XG5cdHJldHVybiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqLmFycmF5QnVmZmVyID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBvYmoudHlwZSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIG9iai5zdHJlYW0gPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIG9iai5jb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdzdHJpbmcnICYmIC9eKEJsb2J8RmlsZSkkLy50ZXN0KG9iai5jb25zdHJ1Y3Rvci5uYW1lKSAmJiAvXihCbG9ifEZpbGUpJC8udGVzdChvYmpbU3ltYm9sLnRvU3RyaW5nVGFnXSk7XG59XG5cbi8qKlxuICogQ2xvbmUgYm9keSBnaXZlbiBSZXMvUmVxIGluc3RhbmNlXG4gKlxuICogQHBhcmFtICAgTWl4ZWQgIGluc3RhbmNlICBSZXNwb25zZSBvciBSZXF1ZXN0IGluc3RhbmNlXG4gKiBAcmV0dXJuICBNaXhlZFxuICovXG5mdW5jdGlvbiBjbG9uZShpbnN0YW5jZSkge1xuXHRsZXQgcDEsIHAyO1xuXHRsZXQgYm9keSA9IGluc3RhbmNlLmJvZHk7XG5cblx0Ly8gZG9uJ3QgYWxsb3cgY2xvbmluZyBhIHVzZWQgYm9keVxuXHRpZiAoaW5zdGFuY2UuYm9keVVzZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBjbG9uZSBib2R5IGFmdGVyIGl0IGlzIHVzZWQnKTtcblx0fVxuXG5cdC8vIGNoZWNrIHRoYXQgYm9keSBpcyBhIHN0cmVhbSBhbmQgbm90IGZvcm0tZGF0YSBvYmplY3Rcblx0Ly8gbm90ZTogd2UgY2FuJ3QgY2xvbmUgdGhlIGZvcm0tZGF0YSBvYmplY3Qgd2l0aG91dCBoYXZpbmcgaXQgYXMgYSBkZXBlbmRlbmN5XG5cdGlmIChib2R5IGluc3RhbmNlb2YgU3RyZWFtICYmIHR5cGVvZiBib2R5LmdldEJvdW5kYXJ5ICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0Ly8gdGVlIGluc3RhbmNlIGJvZHlcblx0XHRwMSA9IG5ldyBQYXNzVGhyb3VnaCgpO1xuXHRcdHAyID0gbmV3IFBhc3NUaHJvdWdoKCk7XG5cdFx0Ym9keS5waXBlKHAxKTtcblx0XHRib2R5LnBpcGUocDIpO1xuXHRcdC8vIHNldCBpbnN0YW5jZSBib2R5IHRvIHRlZWQgYm9keSBhbmQgcmV0dXJuIHRoZSBvdGhlciB0ZWVkIGJvZHlcblx0XHRpbnN0YW5jZVtJTlRFUk5BTFNdLmJvZHkgPSBwMTtcblx0XHRib2R5ID0gcDI7XG5cdH1cblxuXHRyZXR1cm4gYm9keTtcbn1cblxuLyoqXG4gKiBQZXJmb3JtcyB0aGUgb3BlcmF0aW9uIFwiZXh0cmFjdCBhIGBDb250ZW50LVR5cGVgIHZhbHVlIGZyb20gfG9iamVjdHxcIiBhc1xuICogc3BlY2lmaWVkIGluIHRoZSBzcGVjaWZpY2F0aW9uOlxuICogaHR0cHM6Ly9mZXRjaC5zcGVjLndoYXR3Zy5vcmcvI2NvbmNlcHQtYm9keWluaXQtZXh0cmFjdFxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYXNzdW1lcyB0aGF0IGluc3RhbmNlLmJvZHkgaXMgcHJlc2VudC5cbiAqXG4gKiBAcGFyYW0gICBNaXhlZCAgaW5zdGFuY2UgIEFueSBvcHRpb25zLmJvZHkgaW5wdXRcbiAqL1xuZnVuY3Rpb24gZXh0cmFjdENvbnRlbnRUeXBlKGJvZHkpIHtcblx0aWYgKGJvZHkgPT09IG51bGwpIHtcblx0XHQvLyBib2R5IGlzIG51bGxcblx0XHRyZXR1cm4gbnVsbDtcblx0fSBlbHNlIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcblx0XHQvLyBib2R5IGlzIHN0cmluZ1xuXHRcdHJldHVybiAndGV4dC9wbGFpbjtjaGFyc2V0PVVURi04Jztcblx0fSBlbHNlIGlmIChpc1VSTFNlYXJjaFBhcmFtcyhib2R5KSkge1xuXHRcdC8vIGJvZHkgaXMgYSBVUkxTZWFyY2hQYXJhbXNcblx0XHRyZXR1cm4gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04Jztcblx0fSBlbHNlIGlmIChpc0Jsb2IoYm9keSkpIHtcblx0XHQvLyBib2R5IGlzIGJsb2Jcblx0XHRyZXR1cm4gYm9keS50eXBlIHx8IG51bGw7XG5cdH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBidWZmZXJcblx0XHRyZXR1cm4gbnVsbDtcblx0fSBlbHNlIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYm9keSkgPT09ICdbb2JqZWN0IEFycmF5QnVmZmVyXScpIHtcblx0XHQvLyBib2R5IGlzIEFycmF5QnVmZmVyXG5cdFx0cmV0dXJuIG51bGw7XG5cdH0gZWxzZSBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBBcnJheUJ1ZmZlclZpZXdcblx0XHRyZXR1cm4gbnVsbDtcblx0fSBlbHNlIGlmICh0eXBlb2YgYm9keS5nZXRCb3VuZGFyeSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdC8vIGRldGVjdCBmb3JtIGRhdGEgaW5wdXQgZnJvbSBmb3JtLWRhdGEgbW9kdWxlXG5cdFx0cmV0dXJuIGBtdWx0aXBhcnQvZm9ybS1kYXRhO2JvdW5kYXJ5PSR7Ym9keS5nZXRCb3VuZGFyeSgpfWA7XG5cdH0gZWxzZSBpZiAoYm9keSBpbnN0YW5jZW9mIFN0cmVhbSkge1xuXHRcdC8vIGJvZHkgaXMgc3RyZWFtXG5cdFx0Ly8gY2FuJ3QgcmVhbGx5IGRvIG11Y2ggYWJvdXQgdGhpc1xuXHRcdHJldHVybiBudWxsO1xuXHR9IGVsc2Uge1xuXHRcdC8vIEJvZHkgY29uc3RydWN0b3IgZGVmYXVsdHMgb3RoZXIgdGhpbmdzIHRvIHN0cmluZ1xuXHRcdHJldHVybiAndGV4dC9wbGFpbjtjaGFyc2V0PVVURi04Jztcblx0fVxufVxuXG4vKipcbiAqIFRoZSBGZXRjaCBTdGFuZGFyZCB0cmVhdHMgdGhpcyBhcyBpZiBcInRvdGFsIGJ5dGVzXCIgaXMgYSBwcm9wZXJ0eSBvbiB0aGUgYm9keS5cbiAqIEZvciB1cywgd2UgaGF2ZSB0byBleHBsaWNpdGx5IGdldCBpdCB3aXRoIGEgZnVuY3Rpb24uXG4gKlxuICogcmVmOiBodHRwczovL2ZldGNoLnNwZWMud2hhdHdnLm9yZy8jY29uY2VwdC1ib2R5LXRvdGFsLWJ5dGVzXG4gKlxuICogQHBhcmFtICAgQm9keSAgICBpbnN0YW5jZSAgIEluc3RhbmNlIG9mIEJvZHlcbiAqIEByZXR1cm4gIE51bWJlcj8gICAgICAgICAgICBOdW1iZXIgb2YgYnl0ZXMsIG9yIG51bGwgaWYgbm90IHBvc3NpYmxlXG4gKi9cbmZ1bmN0aW9uIGdldFRvdGFsQnl0ZXMoaW5zdGFuY2UpIHtcblx0Y29uc3QgYm9keSA9IGluc3RhbmNlLmJvZHk7XG5cblxuXHRpZiAoYm9keSA9PT0gbnVsbCkge1xuXHRcdC8vIGJvZHkgaXMgbnVsbFxuXHRcdHJldHVybiAwO1xuXHR9IGVsc2UgaWYgKGlzQmxvYihib2R5KSkge1xuXHRcdHJldHVybiBib2R5LnNpemU7XG5cdH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBidWZmZXJcblx0XHRyZXR1cm4gYm9keS5sZW5ndGg7XG5cdH0gZWxzZSBpZiAoYm9keSAmJiB0eXBlb2YgYm9keS5nZXRMZW5ndGhTeW5jID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0Ly8gZGV0ZWN0IGZvcm0gZGF0YSBpbnB1dCBmcm9tIGZvcm0tZGF0YSBtb2R1bGVcblx0XHRpZiAoYm9keS5fbGVuZ3RoUmV0cmlldmVycyAmJiBib2R5Ll9sZW5ndGhSZXRyaWV2ZXJzLmxlbmd0aCA9PSAwIHx8IC8vIDEueFxuXHRcdGJvZHkuaGFzS25vd25MZW5ndGggJiYgYm9keS5oYXNLbm93bkxlbmd0aCgpKSB7XG5cdFx0XHQvLyAyLnhcblx0XHRcdHJldHVybiBib2R5LmdldExlbmd0aFN5bmMoKTtcblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gYm9keSBpcyBzdHJlYW1cblx0XHRyZXR1cm4gbnVsbDtcblx0fVxufVxuXG4vKipcbiAqIFdyaXRlIGEgQm9keSB0byBhIE5vZGUuanMgV3JpdGFibGVTdHJlYW0gKGUuZy4gaHR0cC5SZXF1ZXN0KSBvYmplY3QuXG4gKlxuICogQHBhcmFtICAgQm9keSAgICBpbnN0YW5jZSAgIEluc3RhbmNlIG9mIEJvZHlcbiAqIEByZXR1cm4gIFZvaWRcbiAqL1xuZnVuY3Rpb24gd3JpdGVUb1N0cmVhbShkZXN0LCBpbnN0YW5jZSkge1xuXHRjb25zdCBib2R5ID0gaW5zdGFuY2UuYm9keTtcblxuXG5cdGlmIChib2R5ID09PSBudWxsKSB7XG5cdFx0Ly8gYm9keSBpcyBudWxsXG5cdFx0ZGVzdC5lbmQoKTtcblx0fSBlbHNlIGlmIChpc0Jsb2IoYm9keSkpIHtcblx0XHRib2R5LnN0cmVhbSgpLnBpcGUoZGVzdCk7XG5cdH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBidWZmZXJcblx0XHRkZXN0LndyaXRlKGJvZHkpO1xuXHRcdGRlc3QuZW5kKCk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gYm9keSBpcyBzdHJlYW1cblx0XHRib2R5LnBpcGUoZGVzdCk7XG5cdH1cbn1cblxuLy8gZXhwb3NlIFByb21pc2VcbkJvZHkuUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlO1xuXG4vKipcbiAqIGhlYWRlcnMuanNcbiAqXG4gKiBIZWFkZXJzIGNsYXNzIG9mZmVycyBjb252ZW5pZW50IGhlbHBlcnNcbiAqL1xuXG5jb25zdCBpbnZhbGlkVG9rZW5SZWdleCA9IC9bXlxcXl9gYS16QS1aXFwtMC05ISMkJSYnKisufH5dLztcbmNvbnN0IGludmFsaWRIZWFkZXJDaGFyUmVnZXggPSAvW15cXHRcXHgyMC1cXHg3ZVxceDgwLVxceGZmXS87XG5cbmZ1bmN0aW9uIHZhbGlkYXRlTmFtZShuYW1lKSB7XG5cdG5hbWUgPSBgJHtuYW1lfWA7XG5cdGlmIChpbnZhbGlkVG9rZW5SZWdleC50ZXN0KG5hbWUpIHx8IG5hbWUgPT09ICcnKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihgJHtuYW1lfSBpcyBub3QgYSBsZWdhbCBIVFRQIGhlYWRlciBuYW1lYCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVWYWx1ZSh2YWx1ZSkge1xuXHR2YWx1ZSA9IGAke3ZhbHVlfWA7XG5cdGlmIChpbnZhbGlkSGVhZGVyQ2hhclJlZ2V4LnRlc3QodmFsdWUpKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihgJHt2YWx1ZX0gaXMgbm90IGEgbGVnYWwgSFRUUCBoZWFkZXIgdmFsdWVgKTtcblx0fVxufVxuXG4vKipcbiAqIEZpbmQgdGhlIGtleSBpbiB0aGUgbWFwIG9iamVjdCBnaXZlbiBhIGhlYWRlciBuYW1lLlxuICpcbiAqIFJldHVybnMgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZC5cbiAqXG4gKiBAcGFyYW0gICBTdHJpbmcgIG5hbWUgIEhlYWRlciBuYW1lXG4gKiBAcmV0dXJuICBTdHJpbmd8VW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIGZpbmQobWFwLCBuYW1lKSB7XG5cdG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG5cdGZvciAoY29uc3Qga2V5IGluIG1hcCkge1xuXHRcdGlmIChrZXkudG9Mb3dlckNhc2UoKSA9PT0gbmFtZSkge1xuXHRcdFx0cmV0dXJuIGtleTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuY29uc3QgTUFQID0gU3ltYm9sKCdtYXAnKTtcbmNsYXNzIEhlYWRlcnMge1xuXHQvKipcbiAgKiBIZWFkZXJzIGNsYXNzXG4gICpcbiAgKiBAcGFyYW0gICBPYmplY3QgIGhlYWRlcnMgIFJlc3BvbnNlIGhlYWRlcnNcbiAgKiBAcmV0dXJuICBWb2lkXG4gICovXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdGxldCBpbml0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQ7XG5cblx0XHR0aGlzW01BUF0gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5cdFx0aWYgKGluaXQgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG5cdFx0XHRjb25zdCByYXdIZWFkZXJzID0gaW5pdC5yYXcoKTtcblx0XHRcdGNvbnN0IGhlYWRlck5hbWVzID0gT2JqZWN0LmtleXMocmF3SGVhZGVycyk7XG5cblx0XHRcdGZvciAoY29uc3QgaGVhZGVyTmFtZSBvZiBoZWFkZXJOYW1lcykge1xuXHRcdFx0XHRmb3IgKGNvbnN0IHZhbHVlIG9mIHJhd0hlYWRlcnNbaGVhZGVyTmFtZV0pIHtcblx0XHRcdFx0XHR0aGlzLmFwcGVuZChoZWFkZXJOYW1lLCB2YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFdlIGRvbid0IHdvcnJ5IGFib3V0IGNvbnZlcnRpbmcgcHJvcCB0byBCeXRlU3RyaW5nIGhlcmUgYXMgYXBwZW5kKClcblx0XHQvLyB3aWxsIGhhbmRsZSBpdC5cblx0XHRpZiAoaW5pdCA9PSBudWxsKSA7IGVsc2UgaWYgKHR5cGVvZiBpbml0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Y29uc3QgbWV0aG9kID0gaW5pdFtTeW1ib2wuaXRlcmF0b3JdO1xuXHRcdFx0aWYgKG1ldGhvZCAhPSBudWxsKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgbWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignSGVhZGVyIHBhaXJzIG11c3QgYmUgaXRlcmFibGUnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIHNlcXVlbmNlPHNlcXVlbmNlPEJ5dGVTdHJpbmc+PlxuXHRcdFx0XHQvLyBOb3RlOiBwZXIgc3BlYyB3ZSBoYXZlIHRvIGZpcnN0IGV4aGF1c3QgdGhlIGxpc3RzIHRoZW4gcHJvY2VzcyB0aGVtXG5cdFx0XHRcdGNvbnN0IHBhaXJzID0gW107XG5cdFx0XHRcdGZvciAoY29uc3QgcGFpciBvZiBpbml0KSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBwYWlyICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgcGFpcltTeW1ib2wuaXRlcmF0b3JdICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdFYWNoIGhlYWRlciBwYWlyIG11c3QgYmUgaXRlcmFibGUnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cGFpcnMucHVzaChBcnJheS5mcm9tKHBhaXIpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAoY29uc3QgcGFpciBvZiBwYWlycykge1xuXHRcdFx0XHRcdGlmIChwYWlyLmxlbmd0aCAhPT0gMikge1xuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRWFjaCBoZWFkZXIgcGFpciBtdXN0IGJlIGEgbmFtZS92YWx1ZSB0dXBsZScpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLmFwcGVuZChwYWlyWzBdLCBwYWlyWzFdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gcmVjb3JkPEJ5dGVTdHJpbmcsIEJ5dGVTdHJpbmc+XG5cdFx0XHRcdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGluaXQpKSB7XG5cdFx0XHRcdFx0Y29uc3QgdmFsdWUgPSBpbml0W2tleV07XG5cdFx0XHRcdFx0dGhpcy5hcHBlbmQoa2V5LCB2YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignUHJvdmlkZWQgaW5pdGlhbGl6ZXIgbXVzdCBiZSBhbiBvYmplY3QnKTtcblx0XHR9XG5cdH1cblxuXHQvKipcbiAgKiBSZXR1cm4gY29tYmluZWQgaGVhZGVyIHZhbHVlIGdpdmVuIG5hbWVcbiAgKlxuICAqIEBwYXJhbSAgIFN0cmluZyAgbmFtZSAgSGVhZGVyIG5hbWVcbiAgKiBAcmV0dXJuICBNaXhlZFxuICAqL1xuXHRnZXQobmFtZSkge1xuXHRcdG5hbWUgPSBgJHtuYW1lfWA7XG5cdFx0dmFsaWRhdGVOYW1lKG5hbWUpO1xuXHRcdGNvbnN0IGtleSA9IGZpbmQodGhpc1tNQVBdLCBuYW1lKTtcblx0XHRpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzW01BUF1ba2V5XS5qb2luKCcsICcpO1xuXHR9XG5cblx0LyoqXG4gICogSXRlcmF0ZSBvdmVyIGFsbCBoZWFkZXJzXG4gICpcbiAgKiBAcGFyYW0gICBGdW5jdGlvbiAgY2FsbGJhY2sgIEV4ZWN1dGVkIGZvciBlYWNoIGl0ZW0gd2l0aCBwYXJhbWV0ZXJzICh2YWx1ZSwgbmFtZSwgdGhpc0FyZylcbiAgKiBAcGFyYW0gICBCb29sZWFuICAgdGhpc0FyZyAgIGB0aGlzYCBjb250ZXh0IGZvciBjYWxsYmFjayBmdW5jdGlvblxuICAqIEByZXR1cm4gIFZvaWRcbiAgKi9cblx0Zm9yRWFjaChjYWxsYmFjaykge1xuXHRcdGxldCB0aGlzQXJnID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG5cblx0XHRsZXQgcGFpcnMgPSBnZXRIZWFkZXJzKHRoaXMpO1xuXHRcdGxldCBpID0gMDtcblx0XHR3aGlsZSAoaSA8IHBhaXJzLmxlbmd0aCkge1xuXHRcdFx0dmFyIF9wYWlycyRpID0gcGFpcnNbaV07XG5cdFx0XHRjb25zdCBuYW1lID0gX3BhaXJzJGlbMF0sXG5cdFx0XHQgICAgICB2YWx1ZSA9IF9wYWlycyRpWzFdO1xuXG5cdFx0XHRjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHZhbHVlLCBuYW1lLCB0aGlzKTtcblx0XHRcdHBhaXJzID0gZ2V0SGVhZGVycyh0aGlzKTtcblx0XHRcdGkrKztcblx0XHR9XG5cdH1cblxuXHQvKipcbiAgKiBPdmVyd3JpdGUgaGVhZGVyIHZhbHVlcyBnaXZlbiBuYW1lXG4gICpcbiAgKiBAcGFyYW0gICBTdHJpbmcgIG5hbWUgICBIZWFkZXIgbmFtZVxuICAqIEBwYXJhbSAgIFN0cmluZyAgdmFsdWUgIEhlYWRlciB2YWx1ZVxuICAqIEByZXR1cm4gIFZvaWRcbiAgKi9cblx0c2V0KG5hbWUsIHZhbHVlKSB7XG5cdFx0bmFtZSA9IGAke25hbWV9YDtcblx0XHR2YWx1ZSA9IGAke3ZhbHVlfWA7XG5cdFx0dmFsaWRhdGVOYW1lKG5hbWUpO1xuXHRcdHZhbGlkYXRlVmFsdWUodmFsdWUpO1xuXHRcdGNvbnN0IGtleSA9IGZpbmQodGhpc1tNQVBdLCBuYW1lKTtcblx0XHR0aGlzW01BUF1ba2V5ICE9PSB1bmRlZmluZWQgPyBrZXkgOiBuYW1lXSA9IFt2YWx1ZV07XG5cdH1cblxuXHQvKipcbiAgKiBBcHBlbmQgYSB2YWx1ZSBvbnRvIGV4aXN0aW5nIGhlYWRlclxuICAqXG4gICogQHBhcmFtICAgU3RyaW5nICBuYW1lICAgSGVhZGVyIG5hbWVcbiAgKiBAcGFyYW0gICBTdHJpbmcgIHZhbHVlICBIZWFkZXIgdmFsdWVcbiAgKiBAcmV0dXJuICBWb2lkXG4gICovXG5cdGFwcGVuZChuYW1lLCB2YWx1ZSkge1xuXHRcdG5hbWUgPSBgJHtuYW1lfWA7XG5cdFx0dmFsdWUgPSBgJHt2YWx1ZX1gO1xuXHRcdHZhbGlkYXRlTmFtZShuYW1lKTtcblx0XHR2YWxpZGF0ZVZhbHVlKHZhbHVlKTtcblx0XHRjb25zdCBrZXkgPSBmaW5kKHRoaXNbTUFQXSwgbmFtZSk7XG5cdFx0aWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzW01BUF1ba2V5XS5wdXNoKHZhbHVlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpc1tNQVBdW25hbWVdID0gW3ZhbHVlXTtcblx0XHR9XG5cdH1cblxuXHQvKipcbiAgKiBDaGVjayBmb3IgaGVhZGVyIG5hbWUgZXhpc3RlbmNlXG4gICpcbiAgKiBAcGFyYW0gICBTdHJpbmcgICBuYW1lICBIZWFkZXIgbmFtZVxuICAqIEByZXR1cm4gIEJvb2xlYW5cbiAgKi9cblx0aGFzKG5hbWUpIHtcblx0XHRuYW1lID0gYCR7bmFtZX1gO1xuXHRcdHZhbGlkYXRlTmFtZShuYW1lKTtcblx0XHRyZXR1cm4gZmluZCh0aGlzW01BUF0sIG5hbWUpICE9PSB1bmRlZmluZWQ7XG5cdH1cblxuXHQvKipcbiAgKiBEZWxldGUgYWxsIGhlYWRlciB2YWx1ZXMgZ2l2ZW4gbmFtZVxuICAqXG4gICogQHBhcmFtICAgU3RyaW5nICBuYW1lICBIZWFkZXIgbmFtZVxuICAqIEByZXR1cm4gIFZvaWRcbiAgKi9cblx0ZGVsZXRlKG5hbWUpIHtcblx0XHRuYW1lID0gYCR7bmFtZX1gO1xuXHRcdHZhbGlkYXRlTmFtZShuYW1lKTtcblx0XHRjb25zdCBrZXkgPSBmaW5kKHRoaXNbTUFQXSwgbmFtZSk7XG5cdFx0aWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRkZWxldGUgdGhpc1tNQVBdW2tleV07XG5cdFx0fVxuXHR9XG5cblx0LyoqXG4gICogUmV0dXJuIHJhdyBoZWFkZXJzIChub24tc3BlYyBhcGkpXG4gICpcbiAgKiBAcmV0dXJuICBPYmplY3RcbiAgKi9cblx0cmF3KCkge1xuXHRcdHJldHVybiB0aGlzW01BUF07XG5cdH1cblxuXHQvKipcbiAgKiBHZXQgYW4gaXRlcmF0b3Igb24ga2V5cy5cbiAgKlxuICAqIEByZXR1cm4gIEl0ZXJhdG9yXG4gICovXG5cdGtleXMoKSB7XG5cdFx0cmV0dXJuIGNyZWF0ZUhlYWRlcnNJdGVyYXRvcih0aGlzLCAna2V5Jyk7XG5cdH1cblxuXHQvKipcbiAgKiBHZXQgYW4gaXRlcmF0b3Igb24gdmFsdWVzLlxuICAqXG4gICogQHJldHVybiAgSXRlcmF0b3JcbiAgKi9cblx0dmFsdWVzKCkge1xuXHRcdHJldHVybiBjcmVhdGVIZWFkZXJzSXRlcmF0b3IodGhpcywgJ3ZhbHVlJyk7XG5cdH1cblxuXHQvKipcbiAgKiBHZXQgYW4gaXRlcmF0b3Igb24gZW50cmllcy5cbiAgKlxuICAqIFRoaXMgaXMgdGhlIGRlZmF1bHQgaXRlcmF0b3Igb2YgdGhlIEhlYWRlcnMgb2JqZWN0LlxuICAqXG4gICogQHJldHVybiAgSXRlcmF0b3JcbiAgKi9cblx0W1N5bWJvbC5pdGVyYXRvcl0oKSB7XG5cdFx0cmV0dXJuIGNyZWF0ZUhlYWRlcnNJdGVyYXRvcih0aGlzLCAna2V5K3ZhbHVlJyk7XG5cdH1cbn1cbkhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoSGVhZGVycy5wcm90b3R5cGUsIFN5bWJvbC50b1N0cmluZ1RhZywge1xuXHR2YWx1ZTogJ0hlYWRlcnMnLFxuXHR3cml0YWJsZTogZmFsc2UsXG5cdGVudW1lcmFibGU6IGZhbHNlLFxuXHRjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhIZWFkZXJzLnByb3RvdHlwZSwge1xuXHRnZXQ6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRmb3JFYWNoOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0c2V0OiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0YXBwZW5kOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0aGFzOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0ZGVsZXRlOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0a2V5czogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdHZhbHVlczogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdGVudHJpZXM6IHsgZW51bWVyYWJsZTogdHJ1ZSB9XG59KTtcblxuZnVuY3Rpb24gZ2V0SGVhZGVycyhoZWFkZXJzKSB7XG5cdGxldCBraW5kID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAna2V5K3ZhbHVlJztcblxuXHRjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoaGVhZGVyc1tNQVBdKS5zb3J0KCk7XG5cdHJldHVybiBrZXlzLm1hcChraW5kID09PSAna2V5JyA/IGZ1bmN0aW9uIChrKSB7XG5cdFx0cmV0dXJuIGsudG9Mb3dlckNhc2UoKTtcblx0fSA6IGtpbmQgPT09ICd2YWx1ZScgPyBmdW5jdGlvbiAoaykge1xuXHRcdHJldHVybiBoZWFkZXJzW01BUF1ba10uam9pbignLCAnKTtcblx0fSA6IGZ1bmN0aW9uIChrKSB7XG5cdFx0cmV0dXJuIFtrLnRvTG93ZXJDYXNlKCksIGhlYWRlcnNbTUFQXVtrXS5qb2luKCcsICcpXTtcblx0fSk7XG59XG5cbmNvbnN0IElOVEVSTkFMID0gU3ltYm9sKCdpbnRlcm5hbCcpO1xuXG5mdW5jdGlvbiBjcmVhdGVIZWFkZXJzSXRlcmF0b3IodGFyZ2V0LCBraW5kKSB7XG5cdGNvbnN0IGl0ZXJhdG9yID0gT2JqZWN0LmNyZWF0ZShIZWFkZXJzSXRlcmF0b3JQcm90b3R5cGUpO1xuXHRpdGVyYXRvcltJTlRFUk5BTF0gPSB7XG5cdFx0dGFyZ2V0LFxuXHRcdGtpbmQsXG5cdFx0aW5kZXg6IDBcblx0fTtcblx0cmV0dXJuIGl0ZXJhdG9yO1xufVxuXG5jb25zdCBIZWFkZXJzSXRlcmF0b3JQcm90b3R5cGUgPSBPYmplY3Quc2V0UHJvdG90eXBlT2Yoe1xuXHRuZXh0KCkge1xuXHRcdC8vIGlzdGFuYnVsIGlnbm9yZSBpZlxuXHRcdGlmICghdGhpcyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgIT09IEhlYWRlcnNJdGVyYXRvclByb3RvdHlwZSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignVmFsdWUgb2YgYHRoaXNgIGlzIG5vdCBhIEhlYWRlcnNJdGVyYXRvcicpO1xuXHRcdH1cblxuXHRcdHZhciBfSU5URVJOQUwgPSB0aGlzW0lOVEVSTkFMXTtcblx0XHRjb25zdCB0YXJnZXQgPSBfSU5URVJOQUwudGFyZ2V0LFxuXHRcdCAgICAgIGtpbmQgPSBfSU5URVJOQUwua2luZCxcblx0XHQgICAgICBpbmRleCA9IF9JTlRFUk5BTC5pbmRleDtcblxuXHRcdGNvbnN0IHZhbHVlcyA9IGdldEhlYWRlcnModGFyZ2V0LCBraW5kKTtcblx0XHRjb25zdCBsZW4gPSB2YWx1ZXMubGVuZ3RoO1xuXHRcdGlmIChpbmRleCA+PSBsZW4pIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGRvbmU6IHRydWVcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dGhpc1tJTlRFUk5BTF0uaW5kZXggPSBpbmRleCArIDE7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dmFsdWU6IHZhbHVlc1tpbmRleF0sXG5cdFx0XHRkb25lOiBmYWxzZVxuXHRcdH07XG5cdH1cbn0sIE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2YoW11bU3ltYm9sLml0ZXJhdG9yXSgpKSkpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoSGVhZGVyc0l0ZXJhdG9yUHJvdG90eXBlLCBTeW1ib2wudG9TdHJpbmdUYWcsIHtcblx0dmFsdWU6ICdIZWFkZXJzSXRlcmF0b3InLFxuXHR3cml0YWJsZTogZmFsc2UsXG5cdGVudW1lcmFibGU6IGZhbHNlLFxuXHRjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG4vKipcbiAqIEV4cG9ydCB0aGUgSGVhZGVycyBvYmplY3QgaW4gYSBmb3JtIHRoYXQgTm9kZS5qcyBjYW4gY29uc3VtZS5cbiAqXG4gKiBAcGFyYW0gICBIZWFkZXJzICBoZWFkZXJzXG4gKiBAcmV0dXJuICBPYmplY3RcbiAqL1xuZnVuY3Rpb24gZXhwb3J0Tm9kZUNvbXBhdGlibGVIZWFkZXJzKGhlYWRlcnMpIHtcblx0Y29uc3Qgb2JqID0gT2JqZWN0LmFzc2lnbih7IF9fcHJvdG9fXzogbnVsbCB9LCBoZWFkZXJzW01BUF0pO1xuXG5cdC8vIGh0dHAucmVxdWVzdCgpIG9ubHkgc3VwcG9ydHMgc3RyaW5nIGFzIEhvc3QgaGVhZGVyLiBUaGlzIGhhY2sgbWFrZXNcblx0Ly8gc3BlY2lmeWluZyBjdXN0b20gSG9zdCBoZWFkZXIgcG9zc2libGUuXG5cdGNvbnN0IGhvc3RIZWFkZXJLZXkgPSBmaW5kKGhlYWRlcnNbTUFQXSwgJ0hvc3QnKTtcblx0aWYgKGhvc3RIZWFkZXJLZXkgIT09IHVuZGVmaW5lZCkge1xuXHRcdG9ialtob3N0SGVhZGVyS2V5XSA9IG9ialtob3N0SGVhZGVyS2V5XVswXTtcblx0fVxuXG5cdHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgSGVhZGVycyBvYmplY3QgZnJvbSBhbiBvYmplY3Qgb2YgaGVhZGVycywgaWdub3JpbmcgdGhvc2UgdGhhdCBkb1xuICogbm90IGNvbmZvcm0gdG8gSFRUUCBncmFtbWFyIHByb2R1Y3Rpb25zLlxuICpcbiAqIEBwYXJhbSAgIE9iamVjdCAgb2JqICBPYmplY3Qgb2YgaGVhZGVyc1xuICogQHJldHVybiAgSGVhZGVyc1xuICovXG5mdW5jdGlvbiBjcmVhdGVIZWFkZXJzTGVuaWVudChvYmopIHtcblx0Y29uc3QgaGVhZGVycyA9IG5ldyBIZWFkZXJzKCk7XG5cdGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XG5cdFx0aWYgKGludmFsaWRUb2tlblJlZ2V4LnRlc3QobmFtZSkpIHtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblx0XHRpZiAoQXJyYXkuaXNBcnJheShvYmpbbmFtZV0pKSB7XG5cdFx0XHRmb3IgKGNvbnN0IHZhbCBvZiBvYmpbbmFtZV0pIHtcblx0XHRcdFx0aWYgKGludmFsaWRIZWFkZXJDaGFyUmVnZXgudGVzdCh2YWwpKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGhlYWRlcnNbTUFQXVtuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0aGVhZGVyc1tNQVBdW25hbWVdID0gW3ZhbF07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aGVhZGVyc1tNQVBdW25hbWVdLnB1c2godmFsKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoIWludmFsaWRIZWFkZXJDaGFyUmVnZXgudGVzdChvYmpbbmFtZV0pKSB7XG5cdFx0XHRoZWFkZXJzW01BUF1bbmFtZV0gPSBbb2JqW25hbWVdXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGhlYWRlcnM7XG59XG5cbmNvbnN0IElOVEVSTkFMUyQxID0gU3ltYm9sKCdSZXNwb25zZSBpbnRlcm5hbHMnKTtcblxuLy8gZml4IGFuIGlzc3VlIHdoZXJlIFwiU1RBVFVTX0NPREVTXCIgYXJlbid0IGEgbmFtZWQgZXhwb3J0IGZvciBub2RlIDwxMFxuY29uc3QgU1RBVFVTX0NPREVTID0gaHR0cC5TVEFUVVNfQ09ERVM7XG5cbi8qKlxuICogUmVzcG9uc2UgY2xhc3NcbiAqXG4gKiBAcGFyYW0gICBTdHJlYW0gIGJvZHkgIFJlYWRhYmxlIHN0cmVhbVxuICogQHBhcmFtICAgT2JqZWN0ICBvcHRzICBSZXNwb25zZSBvcHRpb25zXG4gKiBAcmV0dXJuICBWb2lkXG4gKi9cbmNsYXNzIFJlc3BvbnNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0bGV0IGJvZHkgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IG51bGw7XG5cdFx0bGV0IG9wdHMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuXG5cdFx0Qm9keS5jYWxsKHRoaXMsIGJvZHksIG9wdHMpO1xuXG5cdFx0Y29uc3Qgc3RhdHVzID0gb3B0cy5zdGF0dXMgfHwgMjAwO1xuXHRcdGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRzLmhlYWRlcnMpO1xuXG5cdFx0aWYgKGJvZHkgIT0gbnVsbCAmJiAhaGVhZGVycy5oYXMoJ0NvbnRlbnQtVHlwZScpKSB7XG5cdFx0XHRjb25zdCBjb250ZW50VHlwZSA9IGV4dHJhY3RDb250ZW50VHlwZShib2R5KTtcblx0XHRcdGlmIChjb250ZW50VHlwZSkge1xuXHRcdFx0XHRoZWFkZXJzLmFwcGVuZCgnQ29udGVudC1UeXBlJywgY29udGVudFR5cGUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXNbSU5URVJOQUxTJDFdID0ge1xuXHRcdFx0dXJsOiBvcHRzLnVybCxcblx0XHRcdHN0YXR1cyxcblx0XHRcdHN0YXR1c1RleHQ6IG9wdHMuc3RhdHVzVGV4dCB8fCBTVEFUVVNfQ09ERVNbc3RhdHVzXSxcblx0XHRcdGhlYWRlcnMsXG5cdFx0XHRjb3VudGVyOiBvcHRzLmNvdW50ZXJcblx0XHR9O1xuXHR9XG5cblx0Z2V0IHVybCgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0udXJsIHx8ICcnO1xuXHR9XG5cblx0Z2V0IHN0YXR1cygpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0uc3RhdHVzO1xuXHR9XG5cblx0LyoqXG4gICogQ29udmVuaWVuY2UgcHJvcGVydHkgcmVwcmVzZW50aW5nIGlmIHRoZSByZXF1ZXN0IGVuZGVkIG5vcm1hbGx5XG4gICovXG5cdGdldCBvaygpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0uc3RhdHVzID49IDIwMCAmJiB0aGlzW0lOVEVSTkFMUyQxXS5zdGF0dXMgPCAzMDA7XG5cdH1cblxuXHRnZXQgcmVkaXJlY3RlZCgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0uY291bnRlciA+IDA7XG5cdH1cblxuXHRnZXQgc3RhdHVzVGV4dCgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0uc3RhdHVzVGV4dDtcblx0fVxuXG5cdGdldCBoZWFkZXJzKCkge1xuXHRcdHJldHVybiB0aGlzW0lOVEVSTkFMUyQxXS5oZWFkZXJzO1xuXHR9XG5cblx0LyoqXG4gICogQ2xvbmUgdGhpcyByZXNwb25zZVxuICAqXG4gICogQHJldHVybiAgUmVzcG9uc2VcbiAgKi9cblx0Y2xvbmUoKSB7XG5cdFx0cmV0dXJuIG5ldyBSZXNwb25zZShjbG9uZSh0aGlzKSwge1xuXHRcdFx0dXJsOiB0aGlzLnVybCxcblx0XHRcdHN0YXR1czogdGhpcy5zdGF0dXMsXG5cdFx0XHRzdGF0dXNUZXh0OiB0aGlzLnN0YXR1c1RleHQsXG5cdFx0XHRoZWFkZXJzOiB0aGlzLmhlYWRlcnMsXG5cdFx0XHRvazogdGhpcy5vayxcblx0XHRcdHJlZGlyZWN0ZWQ6IHRoaXMucmVkaXJlY3RlZFxuXHRcdH0pO1xuXHR9XG59XG5cbkJvZHkubWl4SW4oUmVzcG9uc2UucHJvdG90eXBlKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoUmVzcG9uc2UucHJvdG90eXBlLCB7XG5cdHVybDogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdHN0YXR1czogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdG9rOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0cmVkaXJlY3RlZDogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdHN0YXR1c1RleHQ6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRoZWFkZXJzOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0Y2xvbmU6IHsgZW51bWVyYWJsZTogdHJ1ZSB9XG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlc3BvbnNlLnByb3RvdHlwZSwgU3ltYm9sLnRvU3RyaW5nVGFnLCB7XG5cdHZhbHVlOiAnUmVzcG9uc2UnLFxuXHR3cml0YWJsZTogZmFsc2UsXG5cdGVudW1lcmFibGU6IGZhbHNlLFxuXHRjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5jb25zdCBJTlRFUk5BTFMkMiA9IFN5bWJvbCgnUmVxdWVzdCBpbnRlcm5hbHMnKTtcblxuLy8gZml4IGFuIGlzc3VlIHdoZXJlIFwiZm9ybWF0XCIsIFwicGFyc2VcIiBhcmVuJ3QgYSBuYW1lZCBleHBvcnQgZm9yIG5vZGUgPDEwXG5jb25zdCBwYXJzZV91cmwgPSBVcmwucGFyc2U7XG5jb25zdCBmb3JtYXRfdXJsID0gVXJsLmZvcm1hdDtcblxuY29uc3Qgc3RyZWFtRGVzdHJ1Y3Rpb25TdXBwb3J0ZWQgPSAnZGVzdHJveScgaW4gU3RyZWFtLlJlYWRhYmxlLnByb3RvdHlwZTtcblxuLyoqXG4gKiBDaGVjayBpZiBhIHZhbHVlIGlzIGFuIGluc3RhbmNlIG9mIFJlcXVlc3QuXG4gKlxuICogQHBhcmFtICAgTWl4ZWQgICBpbnB1dFxuICogQHJldHVybiAgQm9vbGVhblxuICovXG5mdW5jdGlvbiBpc1JlcXVlc3QoaW5wdXQpIHtcblx0cmV0dXJuIHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGlucHV0W0lOVEVSTkFMUyQyXSA9PT0gJ29iamVjdCc7XG59XG5cbmZ1bmN0aW9uIGlzQWJvcnRTaWduYWwoc2lnbmFsKSB7XG5cdGNvbnN0IHByb3RvID0gc2lnbmFsICYmIHR5cGVvZiBzaWduYWwgPT09ICdvYmplY3QnICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihzaWduYWwpO1xuXHRyZXR1cm4gISEocHJvdG8gJiYgcHJvdG8uY29uc3RydWN0b3IubmFtZSA9PT0gJ0Fib3J0U2lnbmFsJyk7XG59XG5cbi8qKlxuICogUmVxdWVzdCBjbGFzc1xuICpcbiAqIEBwYXJhbSAgIE1peGVkICAgaW5wdXQgIFVybCBvciBSZXF1ZXN0IGluc3RhbmNlXG4gKiBAcGFyYW0gICBPYmplY3QgIGluaXQgICBDdXN0b20gb3B0aW9uc1xuICogQHJldHVybiAgVm9pZFxuICovXG5jbGFzcyBSZXF1ZXN0IHtcblx0Y29uc3RydWN0b3IoaW5wdXQpIHtcblx0XHRsZXQgaW5pdCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG5cblx0XHRsZXQgcGFyc2VkVVJMO1xuXG5cdFx0Ly8gbm9ybWFsaXplIGlucHV0XG5cdFx0aWYgKCFpc1JlcXVlc3QoaW5wdXQpKSB7XG5cdFx0XHRpZiAoaW5wdXQgJiYgaW5wdXQuaHJlZikge1xuXHRcdFx0XHQvLyBpbiBvcmRlciB0byBzdXBwb3J0IE5vZGUuanMnIFVybCBvYmplY3RzOyB0aG91Z2ggV0hBVFdHJ3MgVVJMIG9iamVjdHNcblx0XHRcdFx0Ly8gd2lsbCBmYWxsIGludG8gdGhpcyBicmFuY2ggYWxzbyAoc2luY2UgdGhlaXIgYHRvU3RyaW5nKClgIHdpbGwgcmV0dXJuXG5cdFx0XHRcdC8vIGBocmVmYCBwcm9wZXJ0eSBhbnl3YXkpXG5cdFx0XHRcdHBhcnNlZFVSTCA9IHBhcnNlX3VybChpbnB1dC5ocmVmKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIGNvZXJjZSBpbnB1dCB0byBhIHN0cmluZyBiZWZvcmUgYXR0ZW1wdGluZyB0byBwYXJzZVxuXHRcdFx0XHRwYXJzZWRVUkwgPSBwYXJzZV91cmwoYCR7aW5wdXR9YCk7XG5cdFx0XHR9XG5cdFx0XHRpbnB1dCA9IHt9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYXJzZWRVUkwgPSBwYXJzZV91cmwoaW5wdXQudXJsKTtcblx0XHR9XG5cblx0XHRsZXQgbWV0aG9kID0gaW5pdC5tZXRob2QgfHwgaW5wdXQubWV0aG9kIHx8ICdHRVQnO1xuXHRcdG1ldGhvZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuXG5cdFx0aWYgKChpbml0LmJvZHkgIT0gbnVsbCB8fCBpc1JlcXVlc3QoaW5wdXQpICYmIGlucHV0LmJvZHkgIT09IG51bGwpICYmIChtZXRob2QgPT09ICdHRVQnIHx8IG1ldGhvZCA9PT0gJ0hFQUQnKSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignUmVxdWVzdCB3aXRoIEdFVC9IRUFEIG1ldGhvZCBjYW5ub3QgaGF2ZSBib2R5Jyk7XG5cdFx0fVxuXG5cdFx0bGV0IGlucHV0Qm9keSA9IGluaXQuYm9keSAhPSBudWxsID8gaW5pdC5ib2R5IDogaXNSZXF1ZXN0KGlucHV0KSAmJiBpbnB1dC5ib2R5ICE9PSBudWxsID8gY2xvbmUoaW5wdXQpIDogbnVsbDtcblxuXHRcdEJvZHkuY2FsbCh0aGlzLCBpbnB1dEJvZHksIHtcblx0XHRcdHRpbWVvdXQ6IGluaXQudGltZW91dCB8fCBpbnB1dC50aW1lb3V0IHx8IDAsXG5cdFx0XHRzaXplOiBpbml0LnNpemUgfHwgaW5wdXQuc2l6ZSB8fCAwXG5cdFx0fSk7XG5cblx0XHRjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoaW5pdC5oZWFkZXJzIHx8IGlucHV0LmhlYWRlcnMgfHwge30pO1xuXG5cdFx0aWYgKGlucHV0Qm9keSAhPSBudWxsICYmICFoZWFkZXJzLmhhcygnQ29udGVudC1UeXBlJykpIHtcblx0XHRcdGNvbnN0IGNvbnRlbnRUeXBlID0gZXh0cmFjdENvbnRlbnRUeXBlKGlucHV0Qm9keSk7XG5cdFx0XHRpZiAoY29udGVudFR5cGUpIHtcblx0XHRcdFx0aGVhZGVycy5hcHBlbmQoJ0NvbnRlbnQtVHlwZScsIGNvbnRlbnRUeXBlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRsZXQgc2lnbmFsID0gaXNSZXF1ZXN0KGlucHV0KSA/IGlucHV0LnNpZ25hbCA6IG51bGw7XG5cdFx0aWYgKCdzaWduYWwnIGluIGluaXQpIHNpZ25hbCA9IGluaXQuc2lnbmFsO1xuXG5cdFx0aWYgKHNpZ25hbCAhPSBudWxsICYmICFpc0Fib3J0U2lnbmFsKHNpZ25hbCkpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIHNpZ25hbCB0byBiZSBhbiBpbnN0YW5jZW9mIEFib3J0U2lnbmFsJyk7XG5cdFx0fVxuXG5cdFx0dGhpc1tJTlRFUk5BTFMkMl0gPSB7XG5cdFx0XHRtZXRob2QsXG5cdFx0XHRyZWRpcmVjdDogaW5pdC5yZWRpcmVjdCB8fCBpbnB1dC5yZWRpcmVjdCB8fCAnZm9sbG93Jyxcblx0XHRcdGhlYWRlcnMsXG5cdFx0XHRwYXJzZWRVUkwsXG5cdFx0XHRzaWduYWxcblx0XHR9O1xuXG5cdFx0Ly8gbm9kZS1mZXRjaC1vbmx5IG9wdGlvbnNcblx0XHR0aGlzLmZvbGxvdyA9IGluaXQuZm9sbG93ICE9PSB1bmRlZmluZWQgPyBpbml0LmZvbGxvdyA6IGlucHV0LmZvbGxvdyAhPT0gdW5kZWZpbmVkID8gaW5wdXQuZm9sbG93IDogMjA7XG5cdFx0dGhpcy5jb21wcmVzcyA9IGluaXQuY29tcHJlc3MgIT09IHVuZGVmaW5lZCA/IGluaXQuY29tcHJlc3MgOiBpbnB1dC5jb21wcmVzcyAhPT0gdW5kZWZpbmVkID8gaW5wdXQuY29tcHJlc3MgOiB0cnVlO1xuXHRcdHRoaXMuY291bnRlciA9IGluaXQuY291bnRlciB8fCBpbnB1dC5jb3VudGVyIHx8IDA7XG5cdFx0dGhpcy5hZ2VudCA9IGluaXQuYWdlbnQgfHwgaW5wdXQuYWdlbnQ7XG5cdH1cblxuXHRnZXQgbWV0aG9kKCkge1xuXHRcdHJldHVybiB0aGlzW0lOVEVSTkFMUyQyXS5tZXRob2Q7XG5cdH1cblxuXHRnZXQgdXJsKCkge1xuXHRcdHJldHVybiBmb3JtYXRfdXJsKHRoaXNbSU5URVJOQUxTJDJdLnBhcnNlZFVSTCk7XG5cdH1cblxuXHRnZXQgaGVhZGVycygpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMl0uaGVhZGVycztcblx0fVxuXG5cdGdldCByZWRpcmVjdCgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMl0ucmVkaXJlY3Q7XG5cdH1cblxuXHRnZXQgc2lnbmFsKCkge1xuXHRcdHJldHVybiB0aGlzW0lOVEVSTkFMUyQyXS5zaWduYWw7XG5cdH1cblxuXHQvKipcbiAgKiBDbG9uZSB0aGlzIHJlcXVlc3RcbiAgKlxuICAqIEByZXR1cm4gIFJlcXVlc3RcbiAgKi9cblx0Y2xvbmUoKSB7XG5cdFx0cmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMpO1xuXHR9XG59XG5cbkJvZHkubWl4SW4oUmVxdWVzdC5wcm90b3R5cGUpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUmVxdWVzdC5wcm90b3R5cGUsIFN5bWJvbC50b1N0cmluZ1RhZywge1xuXHR2YWx1ZTogJ1JlcXVlc3QnLFxuXHR3cml0YWJsZTogZmFsc2UsXG5cdGVudW1lcmFibGU6IGZhbHNlLFxuXHRjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhSZXF1ZXN0LnByb3RvdHlwZSwge1xuXHRtZXRob2Q6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHR1cmw6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRoZWFkZXJzOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0cmVkaXJlY3Q6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRjbG9uZTogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdHNpZ25hbDogeyBlbnVtZXJhYmxlOiB0cnVlIH1cbn0pO1xuXG4vKipcbiAqIENvbnZlcnQgYSBSZXF1ZXN0IHRvIE5vZGUuanMgaHR0cCByZXF1ZXN0IG9wdGlvbnMuXG4gKlxuICogQHBhcmFtICAgUmVxdWVzdCAgQSBSZXF1ZXN0IGluc3RhbmNlXG4gKiBAcmV0dXJuICBPYmplY3QgICBUaGUgb3B0aW9ucyBvYmplY3QgdG8gYmUgcGFzc2VkIHRvIGh0dHAucmVxdWVzdFxuICovXG5mdW5jdGlvbiBnZXROb2RlUmVxdWVzdE9wdGlvbnMocmVxdWVzdCkge1xuXHRjb25zdCBwYXJzZWRVUkwgPSByZXF1ZXN0W0lOVEVSTkFMUyQyXS5wYXJzZWRVUkw7XG5cdGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyhyZXF1ZXN0W0lOVEVSTkFMUyQyXS5oZWFkZXJzKTtcblxuXHQvLyBmZXRjaCBzdGVwIDEuM1xuXHRpZiAoIWhlYWRlcnMuaGFzKCdBY2NlcHQnKSkge1xuXHRcdGhlYWRlcnMuc2V0KCdBY2NlcHQnLCAnKi8qJyk7XG5cdH1cblxuXHQvLyBCYXNpYyBmZXRjaFxuXHRpZiAoIXBhcnNlZFVSTC5wcm90b2NvbCB8fCAhcGFyc2VkVVJMLmhvc3RuYW1lKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT25seSBhYnNvbHV0ZSBVUkxzIGFyZSBzdXBwb3J0ZWQnKTtcblx0fVxuXG5cdGlmICghL15odHRwcz86JC8udGVzdChwYXJzZWRVUkwucHJvdG9jb2wpKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT25seSBIVFRQKFMpIHByb3RvY29scyBhcmUgc3VwcG9ydGVkJyk7XG5cdH1cblxuXHRpZiAocmVxdWVzdC5zaWduYWwgJiYgcmVxdWVzdC5ib2R5IGluc3RhbmNlb2YgU3RyZWFtLlJlYWRhYmxlICYmICFzdHJlYW1EZXN0cnVjdGlvblN1cHBvcnRlZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignQ2FuY2VsbGF0aW9uIG9mIHN0cmVhbWVkIHJlcXVlc3RzIHdpdGggQWJvcnRTaWduYWwgaXMgbm90IHN1cHBvcnRlZCBpbiBub2RlIDwgOCcpO1xuXHR9XG5cblx0Ly8gSFRUUC1uZXR3b3JrLW9yLWNhY2hlIGZldGNoIHN0ZXBzIDIuNC0yLjdcblx0bGV0IGNvbnRlbnRMZW5ndGhWYWx1ZSA9IG51bGw7XG5cdGlmIChyZXF1ZXN0LmJvZHkgPT0gbnVsbCAmJiAvXihQT1NUfFBVVCkkL2kudGVzdChyZXF1ZXN0Lm1ldGhvZCkpIHtcblx0XHRjb250ZW50TGVuZ3RoVmFsdWUgPSAnMCc7XG5cdH1cblx0aWYgKHJlcXVlc3QuYm9keSAhPSBudWxsKSB7XG5cdFx0Y29uc3QgdG90YWxCeXRlcyA9IGdldFRvdGFsQnl0ZXMocmVxdWVzdCk7XG5cdFx0aWYgKHR5cGVvZiB0b3RhbEJ5dGVzID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y29udGVudExlbmd0aFZhbHVlID0gU3RyaW5nKHRvdGFsQnl0ZXMpO1xuXHRcdH1cblx0fVxuXHRpZiAoY29udGVudExlbmd0aFZhbHVlKSB7XG5cdFx0aGVhZGVycy5zZXQoJ0NvbnRlbnQtTGVuZ3RoJywgY29udGVudExlbmd0aFZhbHVlKTtcblx0fVxuXG5cdC8vIEhUVFAtbmV0d29yay1vci1jYWNoZSBmZXRjaCBzdGVwIDIuMTFcblx0aWYgKCFoZWFkZXJzLmhhcygnVXNlci1BZ2VudCcpKSB7XG5cdFx0aGVhZGVycy5zZXQoJ1VzZXItQWdlbnQnLCAnbm9kZS1mZXRjaC8xLjAgKCtodHRwczovL2dpdGh1Yi5jb20vYml0aW5uL25vZGUtZmV0Y2gpJyk7XG5cdH1cblxuXHQvLyBIVFRQLW5ldHdvcmstb3ItY2FjaGUgZmV0Y2ggc3RlcCAyLjE1XG5cdGlmIChyZXF1ZXN0LmNvbXByZXNzICYmICFoZWFkZXJzLmhhcygnQWNjZXB0LUVuY29kaW5nJykpIHtcblx0XHRoZWFkZXJzLnNldCgnQWNjZXB0LUVuY29kaW5nJywgJ2d6aXAsZGVmbGF0ZScpO1xuXHR9XG5cblx0bGV0IGFnZW50ID0gcmVxdWVzdC5hZ2VudDtcblx0aWYgKHR5cGVvZiBhZ2VudCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGFnZW50ID0gYWdlbnQocGFyc2VkVVJMKTtcblx0fVxuXG5cdGlmICghaGVhZGVycy5oYXMoJ0Nvbm5lY3Rpb24nKSAmJiAhYWdlbnQpIHtcblx0XHRoZWFkZXJzLnNldCgnQ29ubmVjdGlvbicsICdjbG9zZScpO1xuXHR9XG5cblx0Ly8gSFRUUC1uZXR3b3JrIGZldGNoIHN0ZXAgNC4yXG5cdC8vIGNodW5rZWQgZW5jb2RpbmcgaXMgaGFuZGxlZCBieSBOb2RlLmpzXG5cblx0cmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHBhcnNlZFVSTCwge1xuXHRcdG1ldGhvZDogcmVxdWVzdC5tZXRob2QsXG5cdFx0aGVhZGVyczogZXhwb3J0Tm9kZUNvbXBhdGlibGVIZWFkZXJzKGhlYWRlcnMpLFxuXHRcdGFnZW50XG5cdH0pO1xufVxuXG4vKipcbiAqIGFib3J0LWVycm9yLmpzXG4gKlxuICogQWJvcnRFcnJvciBpbnRlcmZhY2UgZm9yIGNhbmNlbGxlZCByZXF1ZXN0c1xuICovXG5cbi8qKlxuICogQ3JlYXRlIEFib3J0RXJyb3IgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gICBTdHJpbmcgICAgICBtZXNzYWdlICAgICAgRXJyb3IgbWVzc2FnZSBmb3IgaHVtYW5cbiAqIEByZXR1cm4gIEFib3J0RXJyb3JcbiAqL1xuZnVuY3Rpb24gQWJvcnRFcnJvcihtZXNzYWdlKSB7XG4gIEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgdGhpcy50eXBlID0gJ2Fib3J0ZWQnO1xuICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXG4gIC8vIGhpZGUgY3VzdG9tIGVycm9yIGltcGxlbWVudGF0aW9uIGRldGFpbHMgZnJvbSBlbmQtdXNlcnNcbiAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG59XG5cbkFib3J0RXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuQWJvcnRFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBBYm9ydEVycm9yO1xuQWJvcnRFcnJvci5wcm90b3R5cGUubmFtZSA9ICdBYm9ydEVycm9yJztcblxuLy8gZml4IGFuIGlzc3VlIHdoZXJlIFwiUGFzc1Rocm91Z2hcIiwgXCJyZXNvbHZlXCIgYXJlbid0IGEgbmFtZWQgZXhwb3J0IGZvciBub2RlIDwxMFxuY29uc3QgUGFzc1Rocm91Z2gkMSA9IFN0cmVhbS5QYXNzVGhyb3VnaDtcbmNvbnN0IHJlc29sdmVfdXJsID0gVXJsLnJlc29sdmU7XG5cbi8qKlxuICogRmV0Y2ggZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0gICBNaXhlZCAgICB1cmwgICBBYnNvbHV0ZSB1cmwgb3IgUmVxdWVzdCBpbnN0YW5jZVxuICogQHBhcmFtICAgT2JqZWN0ICAgb3B0cyAgRmV0Y2ggb3B0aW9uc1xuICogQHJldHVybiAgUHJvbWlzZVxuICovXG5mdW5jdGlvbiBmZXRjaCh1cmwsIG9wdHMpIHtcblxuXHQvLyBhbGxvdyBjdXN0b20gcHJvbWlzZVxuXHRpZiAoIWZldGNoLlByb21pc2UpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ25hdGl2ZSBwcm9taXNlIG1pc3NpbmcsIHNldCBmZXRjaC5Qcm9taXNlIHRvIHlvdXIgZmF2b3JpdGUgYWx0ZXJuYXRpdmUnKTtcblx0fVxuXG5cdEJvZHkuUHJvbWlzZSA9IGZldGNoLlByb21pc2U7XG5cblx0Ly8gd3JhcCBodHRwLnJlcXVlc3QgaW50byBmZXRjaFxuXHRyZXR1cm4gbmV3IGZldGNoLlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdC8vIGJ1aWxkIHJlcXVlc3Qgb2JqZWN0XG5cdFx0Y29uc3QgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KHVybCwgb3B0cyk7XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IGdldE5vZGVSZXF1ZXN0T3B0aW9ucyhyZXF1ZXN0KTtcblxuXHRcdGNvbnN0IHNlbmQgPSAob3B0aW9ucy5wcm90b2NvbCA9PT0gJ2h0dHBzOicgPyBodHRwcyA6IGh0dHApLnJlcXVlc3Q7XG5cdFx0Y29uc3Qgc2lnbmFsID0gcmVxdWVzdC5zaWduYWw7XG5cblx0XHRsZXQgcmVzcG9uc2UgPSBudWxsO1xuXG5cdFx0Y29uc3QgYWJvcnQgPSBmdW5jdGlvbiBhYm9ydCgpIHtcblx0XHRcdGxldCBlcnJvciA9IG5ldyBBYm9ydEVycm9yKCdUaGUgdXNlciBhYm9ydGVkIGEgcmVxdWVzdC4nKTtcblx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRpZiAocmVxdWVzdC5ib2R5ICYmIHJlcXVlc3QuYm9keSBpbnN0YW5jZW9mIFN0cmVhbS5SZWFkYWJsZSkge1xuXHRcdFx0XHRyZXF1ZXN0LmJvZHkuZGVzdHJveShlcnJvcik7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5ib2R5KSByZXR1cm47XG5cdFx0XHRyZXNwb25zZS5ib2R5LmVtaXQoJ2Vycm9yJywgZXJyb3IpO1xuXHRcdH07XG5cblx0XHRpZiAoc2lnbmFsICYmIHNpZ25hbC5hYm9ydGVkKSB7XG5cdFx0XHRhYm9ydCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFib3J0QW5kRmluYWxpemUgPSBmdW5jdGlvbiBhYm9ydEFuZEZpbmFsaXplKCkge1xuXHRcdFx0YWJvcnQoKTtcblx0XHRcdGZpbmFsaXplKCk7XG5cdFx0fTtcblxuXHRcdC8vIHNlbmQgcmVxdWVzdFxuXHRcdGNvbnN0IHJlcSA9IHNlbmQob3B0aW9ucyk7XG5cdFx0bGV0IHJlcVRpbWVvdXQ7XG5cblx0XHRpZiAoc2lnbmFsKSB7XG5cdFx0XHRzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydEFuZEZpbmFsaXplKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBmaW5hbGl6ZSgpIHtcblx0XHRcdHJlcS5hYm9ydCgpO1xuXHRcdFx0aWYgKHNpZ25hbCkgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgYWJvcnRBbmRGaW5hbGl6ZSk7XG5cdFx0XHRjbGVhclRpbWVvdXQocmVxVGltZW91dCk7XG5cdFx0fVxuXG5cdFx0aWYgKHJlcXVlc3QudGltZW91dCkge1xuXHRcdFx0cmVxLm9uY2UoJ3NvY2tldCcsIGZ1bmN0aW9uIChzb2NrZXQpIHtcblx0XHRcdFx0cmVxVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJlamVjdChuZXcgRmV0Y2hFcnJvcihgbmV0d29yayB0aW1lb3V0IGF0OiAke3JlcXVlc3QudXJsfWAsICdyZXF1ZXN0LXRpbWVvdXQnKSk7XG5cdFx0XHRcdFx0ZmluYWxpemUoKTtcblx0XHRcdFx0fSwgcmVxdWVzdC50aW1lb3V0KTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJlcS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRyZWplY3QobmV3IEZldGNoRXJyb3IoYHJlcXVlc3QgdG8gJHtyZXF1ZXN0LnVybH0gZmFpbGVkLCByZWFzb246ICR7ZXJyLm1lc3NhZ2V9YCwgJ3N5c3RlbScsIGVycikpO1xuXHRcdFx0ZmluYWxpemUoKTtcblx0XHR9KTtcblxuXHRcdHJlcS5vbigncmVzcG9uc2UnLCBmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRjbGVhclRpbWVvdXQocmVxVGltZW91dCk7XG5cblx0XHRcdGNvbnN0IGhlYWRlcnMgPSBjcmVhdGVIZWFkZXJzTGVuaWVudChyZXMuaGVhZGVycyk7XG5cblx0XHRcdC8vIEhUVFAgZmV0Y2ggc3RlcCA1XG5cdFx0XHRpZiAoZmV0Y2guaXNSZWRpcmVjdChyZXMuc3RhdHVzQ29kZSkpIHtcblx0XHRcdFx0Ly8gSFRUUCBmZXRjaCBzdGVwIDUuMlxuXHRcdFx0XHRjb25zdCBsb2NhdGlvbiA9IGhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpO1xuXG5cdFx0XHRcdC8vIEhUVFAgZmV0Y2ggc3RlcCA1LjNcblx0XHRcdFx0Y29uc3QgbG9jYXRpb25VUkwgPSBsb2NhdGlvbiA9PT0gbnVsbCA/IG51bGwgOiByZXNvbHZlX3VybChyZXF1ZXN0LnVybCwgbG9jYXRpb24pO1xuXG5cdFx0XHRcdC8vIEhUVFAgZmV0Y2ggc3RlcCA1LjVcblx0XHRcdFx0c3dpdGNoIChyZXF1ZXN0LnJlZGlyZWN0KSB7XG5cdFx0XHRcdFx0Y2FzZSAnZXJyb3InOlxuXHRcdFx0XHRcdFx0cmVqZWN0KG5ldyBGZXRjaEVycm9yKGByZWRpcmVjdCBtb2RlIGlzIHNldCB0byBlcnJvcjogJHtyZXF1ZXN0LnVybH1gLCAnbm8tcmVkaXJlY3QnKSk7XG5cdFx0XHRcdFx0XHRmaW5hbGl6ZSgpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdGNhc2UgJ21hbnVhbCc6XG5cdFx0XHRcdFx0XHQvLyBub2RlLWZldGNoLXNwZWNpZmljIHN0ZXA6IG1ha2UgbWFudWFsIHJlZGlyZWN0IGEgYml0IGVhc2llciB0byB1c2UgYnkgc2V0dGluZyB0aGUgTG9jYXRpb24gaGVhZGVyIHZhbHVlIHRvIHRoZSByZXNvbHZlZCBVUkwuXG5cdFx0XHRcdFx0XHRpZiAobG9jYXRpb25VUkwgIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0Ly8gaGFuZGxlIGNvcnJ1cHRlZCBoZWFkZXJcblx0XHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0XHRoZWFkZXJzLnNldCgnTG9jYXRpb24nLCBsb2NhdGlvblVSTCk7XG5cdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdFx0XHRcdC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0OiBub2RlanMgc2VydmVyIHByZXZlbnQgaW52YWxpZCByZXNwb25zZSBoZWFkZXJzLCB3ZSBjYW4ndCB0ZXN0IHRoaXMgdGhyb3VnaCBub3JtYWwgcmVxdWVzdFxuXHRcdFx0XHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdmb2xsb3cnOlxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDJcblx0XHRcdFx0XHRcdGlmIChsb2NhdGlvblVSTCA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDVcblx0XHRcdFx0XHRcdGlmIChyZXF1ZXN0LmNvdW50ZXIgPj0gcmVxdWVzdC5mb2xsb3cpIHtcblx0XHRcdFx0XHRcdFx0cmVqZWN0KG5ldyBGZXRjaEVycm9yKGBtYXhpbXVtIHJlZGlyZWN0IHJlYWNoZWQgYXQ6ICR7cmVxdWVzdC51cmx9YCwgJ21heC1yZWRpcmVjdCcpKTtcblx0XHRcdFx0XHRcdFx0ZmluYWxpemUoKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBIVFRQLXJlZGlyZWN0IGZldGNoIHN0ZXAgNiAoY291bnRlciBpbmNyZW1lbnQpXG5cdFx0XHRcdFx0XHQvLyBDcmVhdGUgYSBuZXcgUmVxdWVzdCBvYmplY3QuXG5cdFx0XHRcdFx0XHRjb25zdCByZXF1ZXN0T3B0cyA9IHtcblx0XHRcdFx0XHRcdFx0aGVhZGVyczogbmV3IEhlYWRlcnMocmVxdWVzdC5oZWFkZXJzKSxcblx0XHRcdFx0XHRcdFx0Zm9sbG93OiByZXF1ZXN0LmZvbGxvdyxcblx0XHRcdFx0XHRcdFx0Y291bnRlcjogcmVxdWVzdC5jb3VudGVyICsgMSxcblx0XHRcdFx0XHRcdFx0YWdlbnQ6IHJlcXVlc3QuYWdlbnQsXG5cdFx0XHRcdFx0XHRcdGNvbXByZXNzOiByZXF1ZXN0LmNvbXByZXNzLFxuXHRcdFx0XHRcdFx0XHRtZXRob2Q6IHJlcXVlc3QubWV0aG9kLFxuXHRcdFx0XHRcdFx0XHRib2R5OiByZXF1ZXN0LmJvZHksXG5cdFx0XHRcdFx0XHRcdHNpZ25hbDogcmVxdWVzdC5zaWduYWwsXG5cdFx0XHRcdFx0XHRcdHRpbWVvdXQ6IHJlcXVlc3QudGltZW91dFxuXHRcdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDlcblx0XHRcdFx0XHRcdGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMzAzICYmIHJlcXVlc3QuYm9keSAmJiBnZXRUb3RhbEJ5dGVzKHJlcXVlc3QpID09PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHJlamVjdChuZXcgRmV0Y2hFcnJvcignQ2Fubm90IGZvbGxvdyByZWRpcmVjdCB3aXRoIGJvZHkgYmVpbmcgYSByZWFkYWJsZSBzdHJlYW0nLCAndW5zdXBwb3J0ZWQtcmVkaXJlY3QnKSk7XG5cdFx0XHRcdFx0XHRcdGZpbmFsaXplKCk7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDExXG5cdFx0XHRcdFx0XHRpZiAocmVzLnN0YXR1c0NvZGUgPT09IDMwMyB8fCAocmVzLnN0YXR1c0NvZGUgPT09IDMwMSB8fCByZXMuc3RhdHVzQ29kZSA9PT0gMzAyKSAmJiByZXF1ZXN0Lm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG5cdFx0XHRcdFx0XHRcdHJlcXVlc3RPcHRzLm1ldGhvZCA9ICdHRVQnO1xuXHRcdFx0XHRcdFx0XHRyZXF1ZXN0T3B0cy5ib2R5ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdFx0XHRyZXF1ZXN0T3B0cy5oZWFkZXJzLmRlbGV0ZSgnY29udGVudC1sZW5ndGgnKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDE1XG5cdFx0XHRcdFx0XHRyZXNvbHZlKGZldGNoKG5ldyBSZXF1ZXN0KGxvY2F0aW9uVVJMLCByZXF1ZXN0T3B0cykpKTtcblx0XHRcdFx0XHRcdGZpbmFsaXplKCk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gcHJlcGFyZSByZXNwb25zZVxuXHRcdFx0cmVzLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0aWYgKHNpZ25hbCkgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgYWJvcnRBbmRGaW5hbGl6ZSk7XG5cdFx0XHR9KTtcblx0XHRcdGxldCBib2R5ID0gcmVzLnBpcGUobmV3IFBhc3NUaHJvdWdoJDEoKSk7XG5cblx0XHRcdGNvbnN0IHJlc3BvbnNlX29wdGlvbnMgPSB7XG5cdFx0XHRcdHVybDogcmVxdWVzdC51cmwsXG5cdFx0XHRcdHN0YXR1czogcmVzLnN0YXR1c0NvZGUsXG5cdFx0XHRcdHN0YXR1c1RleHQ6IHJlcy5zdGF0dXNNZXNzYWdlLFxuXHRcdFx0XHRoZWFkZXJzOiBoZWFkZXJzLFxuXHRcdFx0XHRzaXplOiByZXF1ZXN0LnNpemUsXG5cdFx0XHRcdHRpbWVvdXQ6IHJlcXVlc3QudGltZW91dCxcblx0XHRcdFx0Y291bnRlcjogcmVxdWVzdC5jb3VudGVyXG5cdFx0XHR9O1xuXG5cdFx0XHQvLyBIVFRQLW5ldHdvcmsgZmV0Y2ggc3RlcCAxMi4xLjEuM1xuXHRcdFx0Y29uc3QgY29kaW5ncyA9IGhlYWRlcnMuZ2V0KCdDb250ZW50LUVuY29kaW5nJyk7XG5cblx0XHRcdC8vIEhUVFAtbmV0d29yayBmZXRjaCBzdGVwIDEyLjEuMS40OiBoYW5kbGUgY29udGVudCBjb2RpbmdzXG5cblx0XHRcdC8vIGluIGZvbGxvd2luZyBzY2VuYXJpb3Mgd2UgaWdub3JlIGNvbXByZXNzaW9uIHN1cHBvcnRcblx0XHRcdC8vIDEuIGNvbXByZXNzaW9uIHN1cHBvcnQgaXMgZGlzYWJsZWRcblx0XHRcdC8vIDIuIEhFQUQgcmVxdWVzdFxuXHRcdFx0Ly8gMy4gbm8gQ29udGVudC1FbmNvZGluZyBoZWFkZXJcblx0XHRcdC8vIDQuIG5vIGNvbnRlbnQgcmVzcG9uc2UgKDIwNClcblx0XHRcdC8vIDUuIGNvbnRlbnQgbm90IG1vZGlmaWVkIHJlc3BvbnNlICgzMDQpXG5cdFx0XHRpZiAoIXJlcXVlc3QuY29tcHJlc3MgfHwgcmVxdWVzdC5tZXRob2QgPT09ICdIRUFEJyB8fCBjb2RpbmdzID09PSBudWxsIHx8IHJlcy5zdGF0dXNDb2RlID09PSAyMDQgfHwgcmVzLnN0YXR1c0NvZGUgPT09IDMwNCkge1xuXHRcdFx0XHRyZXNwb25zZSA9IG5ldyBSZXNwb25zZShib2R5LCByZXNwb25zZV9vcHRpb25zKTtcblx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRm9yIE5vZGUgdjYrXG5cdFx0XHQvLyBCZSBsZXNzIHN0cmljdCB3aGVuIGRlY29kaW5nIGNvbXByZXNzZWQgcmVzcG9uc2VzLCBzaW5jZSBzb21ldGltZXNcblx0XHRcdC8vIHNlcnZlcnMgc2VuZCBzbGlnaHRseSBpbnZhbGlkIHJlc3BvbnNlcyB0aGF0IGFyZSBzdGlsbCBhY2NlcHRlZFxuXHRcdFx0Ly8gYnkgY29tbW9uIGJyb3dzZXJzLlxuXHRcdFx0Ly8gQWx3YXlzIHVzaW5nIFpfU1lOQ19GTFVTSCBpcyB3aGF0IGNVUkwgZG9lcy5cblx0XHRcdGNvbnN0IHpsaWJPcHRpb25zID0ge1xuXHRcdFx0XHRmbHVzaDogemxpYi5aX1NZTkNfRkxVU0gsXG5cdFx0XHRcdGZpbmlzaEZsdXNoOiB6bGliLlpfU1lOQ19GTFVTSFxuXHRcdFx0fTtcblxuXHRcdFx0Ly8gZm9yIGd6aXBcblx0XHRcdGlmIChjb2RpbmdzID09ICdnemlwJyB8fCBjb2RpbmdzID09ICd4LWd6aXAnKSB7XG5cdFx0XHRcdGJvZHkgPSBib2R5LnBpcGUoemxpYi5jcmVhdGVHdW56aXAoemxpYk9wdGlvbnMpKTtcblx0XHRcdFx0cmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UoYm9keSwgcmVzcG9uc2Vfb3B0aW9ucyk7XG5cdFx0XHRcdHJlc29sdmUocmVzcG9uc2UpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIGZvciBkZWZsYXRlXG5cdFx0XHRpZiAoY29kaW5ncyA9PSAnZGVmbGF0ZScgfHwgY29kaW5ncyA9PSAneC1kZWZsYXRlJykge1xuXHRcdFx0XHQvLyBoYW5kbGUgdGhlIGluZmFtb3VzIHJhdyBkZWZsYXRlIHJlc3BvbnNlIGZyb20gb2xkIHNlcnZlcnNcblx0XHRcdFx0Ly8gYSBoYWNrIGZvciBvbGQgSUlTIGFuZCBBcGFjaGUgc2VydmVyc1xuXHRcdFx0XHRjb25zdCByYXcgPSByZXMucGlwZShuZXcgUGFzc1Rocm91Z2gkMSgpKTtcblx0XHRcdFx0cmF3Lm9uY2UoJ2RhdGEnLCBmdW5jdGlvbiAoY2h1bmspIHtcblx0XHRcdFx0XHQvLyBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNzUxOTgyOFxuXHRcdFx0XHRcdGlmICgoY2h1bmtbMF0gJiAweDBGKSA9PT0gMHgwOCkge1xuXHRcdFx0XHRcdFx0Ym9keSA9IGJvZHkucGlwZSh6bGliLmNyZWF0ZUluZmxhdGUoKSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGJvZHkgPSBib2R5LnBpcGUoemxpYi5jcmVhdGVJbmZsYXRlUmF3KCkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXNwb25zZSA9IG5ldyBSZXNwb25zZShib2R5LCByZXNwb25zZV9vcHRpb25zKTtcblx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gZm9yIGJyXG5cdFx0XHRpZiAoY29kaW5ncyA9PSAnYnInICYmIHR5cGVvZiB6bGliLmNyZWF0ZUJyb3RsaURlY29tcHJlc3MgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Ym9keSA9IGJvZHkucGlwZSh6bGliLmNyZWF0ZUJyb3RsaURlY29tcHJlc3MoKSk7XG5cdFx0XHRcdHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKGJvZHksIHJlc3BvbnNlX29wdGlvbnMpO1xuXHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBvdGhlcndpc2UsIHVzZSByZXNwb25zZSBhcy1pc1xuXHRcdFx0cmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UoYm9keSwgcmVzcG9uc2Vfb3B0aW9ucyk7XG5cdFx0XHRyZXNvbHZlKHJlc3BvbnNlKTtcblx0XHR9KTtcblxuXHRcdHdyaXRlVG9TdHJlYW0ocmVxLCByZXF1ZXN0KTtcblx0fSk7XG59XG4vKipcbiAqIFJlZGlyZWN0IGNvZGUgbWF0Y2hpbmdcbiAqXG4gKiBAcGFyYW0gICBOdW1iZXIgICBjb2RlICBTdGF0dXMgY29kZVxuICogQHJldHVybiAgQm9vbGVhblxuICovXG5mZXRjaC5pc1JlZGlyZWN0ID0gZnVuY3Rpb24gKGNvZGUpIHtcblx0cmV0dXJuIGNvZGUgPT09IDMwMSB8fCBjb2RlID09PSAzMDIgfHwgY29kZSA9PT0gMzAzIHx8IGNvZGUgPT09IDMwNyB8fCBjb2RlID09PSAzMDg7XG59O1xuXG4vLyBleHBvc2UgUHJvbWlzZVxuZmV0Y2guUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlO1xuXG5mdW5jdGlvbiBnZXRfcGFnZV9oYW5kbGVyKFxuXHRtYW5pZmVzdCxcblx0c2Vzc2lvbl9nZXR0ZXJcbikge1xuXHRjb25zdCBnZXRfYnVpbGRfaW5mbyA9IGRldlxuXHRcdD8gKCkgPT4gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKGJ1aWxkX2RpciwgJ2J1aWxkLmpzb24nKSwgJ3V0Zi04JykpXG5cdFx0OiAoYXNzZXRzID0+ICgpID0+IGFzc2V0cykoSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKGJ1aWxkX2RpciwgJ2J1aWxkLmpzb24nKSwgJ3V0Zi04JykpKTtcblxuXHRjb25zdCB0ZW1wbGF0ZSA9IGRldlxuXHRcdD8gKCkgPT4gcmVhZF90ZW1wbGF0ZShzcmNfZGlyKVxuXHRcdDogKHN0ciA9PiAoKSA9PiBzdHIpKHJlYWRfdGVtcGxhdGUoYnVpbGRfZGlyKSk7XG5cblx0Y29uc3QgaGFzX3NlcnZpY2Vfd29ya2VyID0gZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYnVpbGRfZGlyLCAnc2VydmljZS13b3JrZXIuanMnKSk7XG5cblx0Y29uc3QgeyBzZXJ2ZXJfcm91dGVzLCBwYWdlcyB9ID0gbWFuaWZlc3Q7XG5cdGNvbnN0IGVycm9yX3JvdXRlID0gbWFuaWZlc3QuZXJyb3I7XG5cblx0ZnVuY3Rpb24gYmFpbChyZXEsIHJlcywgZXJyKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IGRldiA/IGVzY2FwZV9odG1sKGVyci5tZXNzYWdlKSA6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InO1xuXG5cdFx0cmVzLnN0YXR1c0NvZGUgPSA1MDA7XG5cdFx0cmVzLmVuZChgPHByZT4ke21lc3NhZ2V9PC9wcmU+YCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVfZXJyb3IocmVxLCByZXMsIHN0YXR1c0NvZGUsIGVycm9yKSB7XG5cdFx0aGFuZGxlX3BhZ2Uoe1xuXHRcdFx0cGF0dGVybjogbnVsbCxcblx0XHRcdHBhcnRzOiBbXG5cdFx0XHRcdHsgbmFtZTogbnVsbCwgY29tcG9uZW50OiBlcnJvcl9yb3V0ZSB9XG5cdFx0XHRdXG5cdFx0fSwgcmVxLCByZXMsIHN0YXR1c0NvZGUsIGVycm9yIHx8IG5ldyBFcnJvcignVW5rbm93biBlcnJvciBpbiBwcmVsb2FkIGZ1bmN0aW9uJykpO1xuXHR9XG5cblx0YXN5bmMgZnVuY3Rpb24gaGFuZGxlX3BhZ2UocGFnZSwgcmVxLCByZXMsIHN0YXR1cyA9IDIwMCwgZXJyb3IgPSBudWxsKSB7XG5cdFx0Y29uc3QgaXNfc2VydmljZV93b3JrZXJfaW5kZXggPSByZXEucGF0aCA9PT0gJy9zZXJ2aWNlLXdvcmtlci1pbmRleC5odG1sJztcblx0XHRjb25zdCBidWlsZF9pbmZvXG5cblxuXG5cbiA9IGdldF9idWlsZF9pbmZvKCk7XG5cblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAndGV4dC9odG1sJyk7XG5cdFx0cmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsIGRldiA/ICduby1jYWNoZScgOiAnbWF4LWFnZT02MDAnKTtcblxuXHRcdC8vIHByZWxvYWQgbWFpbi5qcyBhbmQgY3VycmVudCByb3V0ZVxuXHRcdC8vIFRPRE8gZGV0ZWN0IG90aGVyIHN0dWZmIHdlIGNhbiBwcmVsb2FkPyBpbWFnZXMsIENTUywgZm9udHM/XG5cdFx0bGV0IHByZWxvYWRlZF9jaHVua3MgPSBBcnJheS5pc0FycmF5KGJ1aWxkX2luZm8uYXNzZXRzLm1haW4pID8gYnVpbGRfaW5mby5hc3NldHMubWFpbiA6IFtidWlsZF9pbmZvLmFzc2V0cy5tYWluXTtcblx0XHRpZiAoIWVycm9yICYmICFpc19zZXJ2aWNlX3dvcmtlcl9pbmRleCkge1xuXHRcdFx0cGFnZS5wYXJ0cy5mb3JFYWNoKHBhcnQgPT4ge1xuXHRcdFx0XHRpZiAoIXBhcnQpIHJldHVybjtcblxuXHRcdFx0XHQvLyB1c2luZyBjb25jYXQgYmVjYXVzZSBpdCBjb3VsZCBiZSBhIHN0cmluZyBvciBhbiBhcnJheS4gdGhhbmtzIHdlYnBhY2shXG5cdFx0XHRcdHByZWxvYWRlZF9jaHVua3MgPSBwcmVsb2FkZWRfY2h1bmtzLmNvbmNhdChidWlsZF9pbmZvLmFzc2V0c1twYXJ0Lm5hbWVdKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChidWlsZF9pbmZvLmJ1bmRsZXIgPT09ICdyb2xsdXAnKSB7XG5cdFx0XHQvLyBUT0RPIGFkZCBkZXBlbmRlbmNpZXMgYW5kIENTU1xuXHRcdFx0Y29uc3QgbGluayA9IHByZWxvYWRlZF9jaHVua3Ncblx0XHRcdFx0LmZpbHRlcihmaWxlID0+IGZpbGUgJiYgIWZpbGUubWF0Y2goL1xcLm1hcCQvKSlcblx0XHRcdFx0Lm1hcChmaWxlID0+IGA8JHtyZXEuYmFzZVVybH0vY2xpZW50LyR7ZmlsZX0+O3JlbD1cIm1vZHVsZXByZWxvYWRcImApXG5cdFx0XHRcdC5qb2luKCcsICcpO1xuXG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdMaW5rJywgbGluayk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGxpbmsgPSBwcmVsb2FkZWRfY2h1bmtzXG5cdFx0XHRcdC5maWx0ZXIoZmlsZSA9PiBmaWxlICYmICFmaWxlLm1hdGNoKC9cXC5tYXAkLykpXG5cdFx0XHRcdC5tYXAoKGZpbGUpID0+IHtcblx0XHRcdFx0XHRjb25zdCBhcyA9IC9cXC5jc3MkLy50ZXN0KGZpbGUpID8gJ3N0eWxlJyA6ICdzY3JpcHQnO1xuXHRcdFx0XHRcdHJldHVybiBgPCR7cmVxLmJhc2VVcmx9L2NsaWVudC8ke2ZpbGV9PjtyZWw9XCJwcmVsb2FkXCI7YXM9XCIke2FzfVwiYDtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmpvaW4oJywgJyk7XG5cblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xpbmsnLCBsaW5rKTtcblx0XHR9XG5cblx0XHRjb25zdCBzZXNzaW9uID0gc2Vzc2lvbl9nZXR0ZXIocmVxLCByZXMpO1xuXG5cdFx0bGV0IHJlZGlyZWN0O1xuXHRcdGxldCBwcmVsb2FkX2Vycm9yO1xuXG5cdFx0Y29uc3QgcHJlbG9hZF9jb250ZXh0ID0ge1xuXHRcdFx0cmVkaXJlY3Q6IChzdGF0dXNDb2RlLCBsb2NhdGlvbikgPT4ge1xuXHRcdFx0XHRpZiAocmVkaXJlY3QgJiYgKHJlZGlyZWN0LnN0YXR1c0NvZGUgIT09IHN0YXR1c0NvZGUgfHwgcmVkaXJlY3QubG9jYXRpb24gIT09IGxvY2F0aW9uKSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgQ29uZmxpY3RpbmcgcmVkaXJlY3RzYCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0bG9jYXRpb24gPSBsb2NhdGlvbi5yZXBsYWNlKC9eXFwvL2csICcnKTsgLy8gbGVhZGluZyBzbGFzaCAob25seSlcblx0XHRcdFx0cmVkaXJlY3QgPSB7IHN0YXR1c0NvZGUsIGxvY2F0aW9uIH07XG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IChzdGF0dXNDb2RlLCBtZXNzYWdlKSA9PiB7XG5cdFx0XHRcdHByZWxvYWRfZXJyb3IgPSB7IHN0YXR1c0NvZGUsIG1lc3NhZ2UgfTtcblx0XHRcdH0sXG5cdFx0XHRmZXRjaDogKHVybCwgb3B0cykgPT4ge1xuXHRcdFx0XHRjb25zdCBwYXJzZWQgPSBuZXcgVXJsLlVSTCh1cmwsIGBodHRwOi8vMTI3LjAuMC4xOiR7cHJvY2Vzcy5lbnYuUE9SVH0ke3JlcS5iYXNlVXJsID8gcmVxLmJhc2VVcmwgKyAnLycgOicnfWApO1xuXG5cdFx0XHRcdGlmIChvcHRzKSB7XG5cdFx0XHRcdFx0b3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMpO1xuXG5cdFx0XHRcdFx0Y29uc3QgaW5jbHVkZV9jb29raWVzID0gKFxuXHRcdFx0XHRcdFx0b3B0cy5jcmVkZW50aWFscyA9PT0gJ2luY2x1ZGUnIHx8XG5cdFx0XHRcdFx0XHRvcHRzLmNyZWRlbnRpYWxzID09PSAnc2FtZS1vcmlnaW4nICYmIHBhcnNlZC5vcmlnaW4gPT09IGBodHRwOi8vMTI3LjAuMC4xOiR7cHJvY2Vzcy5lbnYuUE9SVH1gXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdGlmIChpbmNsdWRlX2Nvb2tpZXMpIHtcblx0XHRcdFx0XHRcdG9wdHMuaGVhZGVycyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMuaGVhZGVycyk7XG5cblx0XHRcdFx0XHRcdGNvbnN0IGNvb2tpZXMgPSBPYmplY3QuYXNzaWduKFxuXHRcdFx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHRcdFx0Y29va2llLnBhcnNlKHJlcS5oZWFkZXJzLmNvb2tpZSB8fCAnJyksXG5cdFx0XHRcdFx0XHRcdGNvb2tpZS5wYXJzZShvcHRzLmhlYWRlcnMuY29va2llIHx8ICcnKVxuXHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0Y29uc3Qgc2V0X2Nvb2tpZSA9IHJlcy5nZXRIZWFkZXIoJ1NldC1Db29raWUnKTtcblx0XHRcdFx0XHRcdChBcnJheS5pc0FycmF5KHNldF9jb29raWUpID8gc2V0X2Nvb2tpZSA6IFtzZXRfY29va2llXSkuZm9yRWFjaChzdHIgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBtYXRjaCA9IC8oW149XSspPShbXjtdKykvLmV4ZWMoc3RyKTtcblx0XHRcdFx0XHRcdFx0aWYgKG1hdGNoKSBjb29raWVzW21hdGNoWzFdXSA9IG1hdGNoWzJdO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdGNvbnN0IHN0ciA9IE9iamVjdC5rZXlzKGNvb2tpZXMpXG5cdFx0XHRcdFx0XHRcdC5tYXAoa2V5ID0+IGAke2tleX09JHtjb29raWVzW2tleV19YClcblx0XHRcdFx0XHRcdFx0LmpvaW4oJzsgJyk7XG5cblx0XHRcdFx0XHRcdG9wdHMuaGVhZGVycy5jb29raWUgPSBzdHI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGZldGNoKHBhcnNlZC5ocmVmLCBvcHRzKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0bGV0IHByZWxvYWRlZDtcblx0XHRsZXQgbWF0Y2g7XG5cdFx0bGV0IHBhcmFtcztcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByb290X3ByZWxvYWRlZCA9IG1hbmlmZXN0LnJvb3RfcHJlbG9hZFxuXHRcdFx0XHQ/IG1hbmlmZXN0LnJvb3RfcHJlbG9hZC5jYWxsKHByZWxvYWRfY29udGV4dCwge1xuXHRcdFx0XHRcdGhvc3Q6IHJlcS5oZWFkZXJzLmhvc3QsXG5cdFx0XHRcdFx0cGF0aDogcmVxLnBhdGgsXG5cdFx0XHRcdFx0cXVlcnk6IHJlcS5xdWVyeSxcblx0XHRcdFx0XHRwYXJhbXM6IHt9XG5cdFx0XHRcdH0sIHNlc3Npb24pXG5cdFx0XHRcdDoge307XG5cblx0XHRcdG1hdGNoID0gZXJyb3IgPyBudWxsIDogcGFnZS5wYXR0ZXJuLmV4ZWMocmVxLnBhdGgpO1xuXG5cblx0XHRcdGxldCB0b1ByZWxvYWQgPSBbcm9vdF9wcmVsb2FkZWRdO1xuXHRcdFx0aWYgKCFpc19zZXJ2aWNlX3dvcmtlcl9pbmRleCkge1xuXHRcdFx0XHR0b1ByZWxvYWQgPSB0b1ByZWxvYWQuY29uY2F0KHBhZ2UucGFydHMubWFwKHBhcnQgPT4ge1xuXHRcdFx0XHRcdGlmICghcGFydCkgcmV0dXJuIG51bGw7XG5cblx0XHRcdFx0XHQvLyB0aGUgZGVlcGVzdCBsZXZlbCBpcyB1c2VkIGJlbG93LCB0byBpbml0aWFsaXNlIHRoZSBzdG9yZVxuXHRcdFx0XHRcdHBhcmFtcyA9IHBhcnQucGFyYW1zID8gcGFydC5wYXJhbXMobWF0Y2gpIDoge307XG5cblx0XHRcdFx0XHRyZXR1cm4gcGFydC5wcmVsb2FkXG5cdFx0XHRcdFx0XHQ/IHBhcnQucHJlbG9hZC5jYWxsKHByZWxvYWRfY29udGV4dCwge1xuXHRcdFx0XHRcdFx0XHRob3N0OiByZXEuaGVhZGVycy5ob3N0LFxuXHRcdFx0XHRcdFx0XHRwYXRoOiByZXEucGF0aCxcblx0XHRcdFx0XHRcdFx0cXVlcnk6IHJlcS5xdWVyeSxcblx0XHRcdFx0XHRcdFx0cGFyYW1zXG5cdFx0XHRcdFx0XHR9LCBzZXNzaW9uKVxuXHRcdFx0XHRcdFx0OiB7fTtcblx0XHRcdFx0fSkpO1xuXHRcdFx0fVxuXG5cdFx0XHRwcmVsb2FkZWQgPSBhd2FpdCBQcm9taXNlLmFsbCh0b1ByZWxvYWQpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdHJldHVybiBiYWlsKHJlcSwgcmVzLCBlcnIpXG5cdFx0XHR9XG5cblx0XHRcdHByZWxvYWRfZXJyb3IgPSB7IHN0YXR1c0NvZGU6IDUwMCwgbWVzc2FnZTogZXJyIH07XG5cdFx0XHRwcmVsb2FkZWQgPSBbXTsgLy8gYXBwZWFzZSBUeXBlU2NyaXB0XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChyZWRpcmVjdCkge1xuXHRcdFx0XHRjb25zdCBsb2NhdGlvbiA9IFVybC5yZXNvbHZlKChyZXEuYmFzZVVybCB8fCAnJykgKyAnLycsIHJlZGlyZWN0LmxvY2F0aW9uKTtcblxuXHRcdFx0XHRyZXMuc3RhdHVzQ29kZSA9IHJlZGlyZWN0LnN0YXR1c0NvZGU7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgbG9jYXRpb24pO1xuXHRcdFx0XHRyZXMuZW5kKCk7XG5cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocHJlbG9hZF9lcnJvcikge1xuXHRcdFx0XHRoYW5kbGVfZXJyb3IocmVxLCByZXMsIHByZWxvYWRfZXJyb3Iuc3RhdHVzQ29kZSwgcHJlbG9hZF9lcnJvci5tZXNzYWdlKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzZWdtZW50cyA9IHJlcS5wYXRoLnNwbGl0KCcvJykuZmlsdGVyKEJvb2xlYW4pO1xuXG5cdFx0XHQvLyBUT0RPIG1ha2UgdGhpcyBsZXNzIGNvbmZ1c2luZ1xuXHRcdFx0Y29uc3QgbGF5b3V0X3NlZ21lbnRzID0gW3NlZ21lbnRzWzBdXTtcblx0XHRcdGxldCBsID0gMTtcblxuXHRcdFx0cGFnZS5wYXJ0cy5mb3JFYWNoKChwYXJ0LCBpKSA9PiB7XG5cdFx0XHRcdGxheW91dF9zZWdtZW50c1tsXSA9IHNlZ21lbnRzW2kgKyAxXTtcblx0XHRcdFx0aWYgKCFwYXJ0KSByZXR1cm4gbnVsbDtcblx0XHRcdFx0bCsrO1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IHByb3BzID0ge1xuXHRcdFx0XHRzdG9yZXM6IHtcblx0XHRcdFx0XHRwYWdlOiB7XG5cdFx0XHRcdFx0XHRzdWJzY3JpYmU6IHdyaXRhYmxlKHtcblx0XHRcdFx0XHRcdFx0aG9zdDogcmVxLmhlYWRlcnMuaG9zdCxcblx0XHRcdFx0XHRcdFx0cGF0aDogcmVxLnBhdGgsXG5cdFx0XHRcdFx0XHRcdHF1ZXJ5OiByZXEucXVlcnksXG5cdFx0XHRcdFx0XHRcdHBhcmFtc1xuXHRcdFx0XHRcdFx0fSkuc3Vic2NyaWJlXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRwcmVsb2FkaW5nOiB7XG5cdFx0XHRcdFx0XHRzdWJzY3JpYmU6IHdyaXRhYmxlKG51bGwpLnN1YnNjcmliZVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0c2Vzc2lvbjogd3JpdGFibGUoc2Vzc2lvbilcblx0XHRcdFx0fSxcblx0XHRcdFx0c2VnbWVudHM6IGxheW91dF9zZWdtZW50cyxcblx0XHRcdFx0c3RhdHVzOiBlcnJvciA/IHN0YXR1cyA6IDIwMCxcblx0XHRcdFx0ZXJyb3I6IGVycm9yID8gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogeyBtZXNzYWdlOiBlcnJvciB9IDogbnVsbCxcblx0XHRcdFx0bGV2ZWwwOiB7XG5cdFx0XHRcdFx0cHJvcHM6IHByZWxvYWRlZFswXVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRsZXZlbDE6IHtcblx0XHRcdFx0XHRzZWdtZW50OiBzZWdtZW50c1swXSxcblx0XHRcdFx0XHRwcm9wczoge31cblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKCFpc19zZXJ2aWNlX3dvcmtlcl9pbmRleCkge1xuXHRcdFx0XHRsZXQgbCA9IDE7XG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgcGFnZS5wYXJ0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGNvbnN0IHBhcnQgPSBwYWdlLnBhcnRzW2ldO1xuXHRcdFx0XHRcdGlmICghcGFydCkgY29udGludWU7XG5cblx0XHRcdFx0XHRwcm9wc1tgbGV2ZWwke2wrK31gXSA9IHtcblx0XHRcdFx0XHRcdGNvbXBvbmVudDogcGFydC5jb21wb25lbnQsXG5cdFx0XHRcdFx0XHRwcm9wczogcHJlbG9hZGVkW2kgKyAxXSB8fCB7fSxcblx0XHRcdFx0XHRcdHNlZ21lbnQ6IHNlZ21lbnRzW2ldXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB7IGh0bWwsIGhlYWQsIGNzcyB9ID0gQXBwLnJlbmRlcihwcm9wcyk7XG5cblx0XHRcdGNvbnN0IHNlcmlhbGl6ZWQgPSB7XG5cdFx0XHRcdHByZWxvYWRlZDogYFske3ByZWxvYWRlZC5tYXAoZGF0YSA9PiB0cnlfc2VyaWFsaXplKGRhdGEpKS5qb2luKCcsJyl9XWAsXG5cdFx0XHRcdHNlc3Npb246IHNlc3Npb24gJiYgdHJ5X3NlcmlhbGl6ZShzZXNzaW9uLCBlcnIgPT4ge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHNlcmlhbGl6ZSBzZXNzaW9uIGRhdGE6ICR7ZXJyLm1lc3NhZ2V9YCk7XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRlcnJvcjogZXJyb3IgJiYgdHJ5X3NlcmlhbGl6ZShwcm9wcy5lcnJvcilcblx0XHRcdH07XG5cblx0XHRcdGxldCBzY3JpcHQgPSBgX19TQVBQRVJfXz17JHtbXG5cdFx0XHRcdGVycm9yICYmIGBlcnJvcjoke3NlcmlhbGl6ZWQuZXJyb3J9LHN0YXR1czoke3N0YXR1c31gLFxuXHRcdFx0XHRgYmFzZVVybDpcIiR7cmVxLmJhc2VVcmx9XCJgLFxuXHRcdFx0XHRzZXJpYWxpemVkLnByZWxvYWRlZCAmJiBgcHJlbG9hZGVkOiR7c2VyaWFsaXplZC5wcmVsb2FkZWR9YCxcblx0XHRcdFx0c2VyaWFsaXplZC5zZXNzaW9uICYmIGBzZXNzaW9uOiR7c2VyaWFsaXplZC5zZXNzaW9ufWBcblx0XHRcdF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oJywnKX19O2A7XG5cblx0XHRcdGlmIChoYXNfc2VydmljZV93b3JrZXIpIHtcblx0XHRcdFx0c2NyaXB0ICs9IGBpZignc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcke3JlcS5iYXNlVXJsfS9zZXJ2aWNlLXdvcmtlci5qcycpO2A7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGZpbGUgPSBbXS5jb25jYXQoYnVpbGRfaW5mby5hc3NldHMubWFpbikuZmlsdGVyKGZpbGUgPT4gZmlsZSAmJiAvXFwuanMkLy50ZXN0KGZpbGUpKVswXTtcblx0XHRcdGNvbnN0IG1haW4gPSBgJHtyZXEuYmFzZVVybH0vY2xpZW50LyR7ZmlsZX1gO1xuXG5cdFx0XHRpZiAoYnVpbGRfaW5mby5idW5kbGVyID09PSAncm9sbHVwJykge1xuXHRcdFx0XHRpZiAoYnVpbGRfaW5mby5sZWdhY3lfYXNzZXRzKSB7XG5cdFx0XHRcdFx0Y29uc3QgbGVnYWN5X21haW4gPSBgJHtyZXEuYmFzZVVybH0vY2xpZW50L2xlZ2FjeS8ke2J1aWxkX2luZm8ubGVnYWN5X2Fzc2V0cy5tYWlufWA7XG5cdFx0XHRcdFx0c2NyaXB0ICs9IGAoZnVuY3Rpb24oKXt0cnl7ZXZhbChcImFzeW5jIGZ1bmN0aW9uIHgoKXt9XCIpO3ZhciBtYWluPVwiJHttYWlufVwifWNhdGNoKGUpe21haW49XCIke2xlZ2FjeV9tYWlufVwifTt2YXIgcz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO3RyeXtuZXcgRnVuY3Rpb24oXCJpZigwKWltcG9ydCgnJylcIikoKTtzLnNyYz1tYWluO3MudHlwZT1cIm1vZHVsZVwiO3MuY3Jvc3NPcmlnaW49XCJ1c2UtY3JlZGVudGlhbHNcIjt9Y2F0Y2goZSl7cy5zcmM9XCIke3JlcS5iYXNlVXJsfS9jbGllbnQvc2hpbXBvcnRAJHtidWlsZF9pbmZvLnNoaW1wb3J0fS5qc1wiO3Muc2V0QXR0cmlidXRlKFwiZGF0YS1tYWluXCIsbWFpbik7fWRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQocyk7fSgpKTtgO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNjcmlwdCArPSBgdmFyIHM9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTt0cnl7bmV3IEZ1bmN0aW9uKFwiaWYoMClpbXBvcnQoJycpXCIpKCk7cy5zcmM9XCIke21haW59XCI7cy50eXBlPVwibW9kdWxlXCI7cy5jcm9zc09yaWdpbj1cInVzZS1jcmVkZW50aWFsc1wiO31jYXRjaChlKXtzLnNyYz1cIiR7cmVxLmJhc2VVcmx9L2NsaWVudC9zaGltcG9ydEAke2J1aWxkX2luZm8uc2hpbXBvcnR9LmpzXCI7cy5zZXRBdHRyaWJ1dGUoXCJkYXRhLW1haW5cIixcIiR7bWFpbn1cIil9ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKWA7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNjcmlwdCArPSBgPC9zY3JpcHQ+PHNjcmlwdCBzcmM9XCIke21haW59XCI+YDtcblx0XHRcdH1cblxuXHRcdFx0bGV0IHN0eWxlcztcblxuXHRcdFx0Ly8gVE9ETyBtYWtlIHRoaXMgY29uc2lzdGVudCBhY3Jvc3MgYXBwc1xuXHRcdFx0Ly8gVE9ETyBlbWJlZCBidWlsZF9pbmZvIGluIHBsYWNlaG9sZGVyLnRzXG5cdFx0XHRpZiAoYnVpbGRfaW5mby5jc3MgJiYgYnVpbGRfaW5mby5jc3MubWFpbikge1xuXHRcdFx0XHRjb25zdCBjc3NfY2h1bmtzID0gbmV3IFNldCgpO1xuXHRcdFx0XHRpZiAoYnVpbGRfaW5mby5jc3MubWFpbikgY3NzX2NodW5rcy5hZGQoYnVpbGRfaW5mby5jc3MubWFpbik7XG5cdFx0XHRcdHBhZ2UucGFydHMuZm9yRWFjaChwYXJ0ID0+IHtcblx0XHRcdFx0XHRpZiAoIXBhcnQpIHJldHVybjtcblx0XHRcdFx0XHRjb25zdCBjc3NfY2h1bmtzX2Zvcl9wYXJ0ID0gYnVpbGRfaW5mby5jc3MuY2h1bmtzW3BhcnQuZmlsZV07XG5cblx0XHRcdFx0XHRpZiAoY3NzX2NodW5rc19mb3JfcGFydCkge1xuXHRcdFx0XHRcdFx0Y3NzX2NodW5rc19mb3JfcGFydC5mb3JFYWNoKGZpbGUgPT4ge1xuXHRcdFx0XHRcdFx0XHRjc3NfY2h1bmtzLmFkZChmaWxlKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0c3R5bGVzID0gQXJyYXkuZnJvbShjc3NfY2h1bmtzKVxuXHRcdFx0XHRcdC5tYXAoaHJlZiA9PiBgPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIGhyZWY9XCJjbGllbnQvJHtocmVmfVwiPmApXG5cdFx0XHRcdFx0LmpvaW4oJycpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c3R5bGVzID0gKGNzcyAmJiBjc3MuY29kZSA/IGA8c3R5bGU+JHtjc3MuY29kZX08L3N0eWxlPmAgOiAnJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHVzZXJzIGNhbiBzZXQgYSBDU1Agbm9uY2UgdXNpbmcgcmVzLmxvY2Fscy5ub25jZVxuXHRcdFx0Y29uc3Qgbm9uY2VfYXR0ciA9IChyZXMubG9jYWxzICYmIHJlcy5sb2NhbHMubm9uY2UpID8gYCBub25jZT1cIiR7cmVzLmxvY2Fscy5ub25jZX1cImAgOiAnJztcblxuXHRcdFx0Y29uc3QgYm9keSA9IHRlbXBsYXRlKClcblx0XHRcdFx0LnJlcGxhY2UoJyVzYXBwZXIuYmFzZSUnLCAoKSA9PiBgPGJhc2UgaHJlZj1cIiR7cmVxLmJhc2VVcmx9L1wiPmApXG5cdFx0XHRcdC5yZXBsYWNlKCclc2FwcGVyLnNjcmlwdHMlJywgKCkgPT4gYDxzY3JpcHQke25vbmNlX2F0dHJ9PiR7c2NyaXB0fTwvc2NyaXB0PmApXG5cdFx0XHRcdC5yZXBsYWNlKCclc2FwcGVyLmh0bWwlJywgKCkgPT4gaHRtbClcblx0XHRcdFx0LnJlcGxhY2UoJyVzYXBwZXIuaGVhZCUnLCAoKSA9PiBgPG5vc2NyaXB0IGlkPSdzYXBwZXItaGVhZC1zdGFydCc+PC9ub3NjcmlwdD4ke2hlYWR9PG5vc2NyaXB0IGlkPSdzYXBwZXItaGVhZC1lbmQnPjwvbm9zY3JpcHQ+YClcblx0XHRcdFx0LnJlcGxhY2UoJyVzYXBwZXIuc3R5bGVzJScsICgpID0+IHN0eWxlcyk7XG5cblx0XHRcdHJlcy5zdGF0dXNDb2RlID0gc3RhdHVzO1xuXHRcdFx0cmVzLmVuZChib2R5KTtcblx0XHR9IGNhdGNoKGVycikge1xuXHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdGJhaWwocmVxLCByZXMsIGVycik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRoYW5kbGVfZXJyb3IocmVxLCByZXMsIDUwMCwgZXJyKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZnVuY3Rpb24gZmluZF9yb3V0ZShyZXEsIHJlcywgbmV4dCkge1xuXHRcdGlmIChyZXEucGF0aCA9PT0gJy9zZXJ2aWNlLXdvcmtlci1pbmRleC5odG1sJykge1xuXHRcdFx0Y29uc3QgaG9tZVBhZ2UgPSBwYWdlcy5maW5kKHBhZ2UgPT4gcGFnZS5wYXR0ZXJuLnRlc3QoJy8nKSk7XG5cdFx0XHRoYW5kbGVfcGFnZShob21lUGFnZSwgcmVxLCByZXMpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgcGFnZSBvZiBwYWdlcykge1xuXHRcdFx0aWYgKHBhZ2UucGF0dGVybi50ZXN0KHJlcS5wYXRoKSkge1xuXHRcdFx0XHRoYW5kbGVfcGFnZShwYWdlLCByZXEsIHJlcyk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRoYW5kbGVfZXJyb3IocmVxLCByZXMsIDQwNCwgJ05vdCBmb3VuZCcpO1xuXHR9O1xufVxuXG5mdW5jdGlvbiByZWFkX3RlbXBsYXRlKGRpciA9IGJ1aWxkX2Rpcikge1xuXHRyZXR1cm4gZnMucmVhZEZpbGVTeW5jKGAke2Rpcn0vdGVtcGxhdGUuaHRtbGAsICd1dGYtOCcpO1xufVxuXG5mdW5jdGlvbiB0cnlfc2VyaWFsaXplKGRhdGEsIGZhaWwpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gZGV2YWx1ZShkYXRhKTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0aWYgKGZhaWwpIGZhaWwoZXJyKTtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxufVxuXG5mdW5jdGlvbiBlc2NhcGVfaHRtbChodG1sKSB7XG5cdGNvbnN0IGNoYXJzID0ge1xuXHRcdCdcIicgOiAncXVvdCcsXG5cdFx0XCInXCI6ICcjMzknLFxuXHRcdCcmJzogJ2FtcCcsXG5cdFx0JzwnIDogJ2x0Jyxcblx0XHQnPicgOiAnZ3QnXG5cdH07XG5cblx0cmV0dXJuIGh0bWwucmVwbGFjZSgvW1wiJyY8Pl0vZywgYyA9PiBgJiR7Y2hhcnNbY119O2ApO1xufVxuXG52YXIgbWltZV9yYXcgPSBcImFwcGxpY2F0aW9uL2FuZHJldy1pbnNldFxcdFxcdFxcdGV6XFxuYXBwbGljYXRpb24vYXBwbGl4d2FyZVxcdFxcdFxcdFxcdGF3XFxuYXBwbGljYXRpb24vYXRvbSt4bWxcXHRcXHRcXHRcXHRhdG9tXFxuYXBwbGljYXRpb24vYXRvbWNhdCt4bWxcXHRcXHRcXHRcXHRhdG9tY2F0XFxuYXBwbGljYXRpb24vYXRvbXN2Yyt4bWxcXHRcXHRcXHRcXHRhdG9tc3ZjXFxuYXBwbGljYXRpb24vY2N4bWwreG1sXFx0XFx0XFx0XFx0Y2N4bWxcXG5hcHBsaWNhdGlvbi9jZG1pLWNhcGFiaWxpdHlcXHRcXHRcXHRjZG1pYVxcbmFwcGxpY2F0aW9uL2NkbWktY29udGFpbmVyXFx0XFx0XFx0Y2RtaWNcXG5hcHBsaWNhdGlvbi9jZG1pLWRvbWFpblxcdFxcdFxcdFxcdGNkbWlkXFxuYXBwbGljYXRpb24vY2RtaS1vYmplY3RcXHRcXHRcXHRcXHRjZG1pb1xcbmFwcGxpY2F0aW9uL2NkbWktcXVldWVcXHRcXHRcXHRcXHRjZG1pcVxcbmFwcGxpY2F0aW9uL2N1LXNlZW1lXFx0XFx0XFx0XFx0Y3VcXG5hcHBsaWNhdGlvbi9kYXZtb3VudCt4bWxcXHRcXHRcXHRkYXZtb3VudFxcbmFwcGxpY2F0aW9uL2RvY2Jvb2sreG1sXFx0XFx0XFx0XFx0ZGJrXFxuYXBwbGljYXRpb24vZHNzYytkZXJcXHRcXHRcXHRcXHRkc3NjXFxuYXBwbGljYXRpb24vZHNzYyt4bWxcXHRcXHRcXHRcXHR4ZHNzY1xcbmFwcGxpY2F0aW9uL2VjbWFzY3JpcHRcXHRcXHRcXHRcXHRlY21hXFxuYXBwbGljYXRpb24vZW1tYSt4bWxcXHRcXHRcXHRcXHRlbW1hXFxuYXBwbGljYXRpb24vZXB1Yit6aXBcXHRcXHRcXHRcXHRlcHViXFxuYXBwbGljYXRpb24vZXhpXFx0XFx0XFx0XFx0XFx0ZXhpXFxuYXBwbGljYXRpb24vZm9udC10ZHBmclxcdFxcdFxcdFxcdHBmclxcbmFwcGxpY2F0aW9uL2dtbCt4bWxcXHRcXHRcXHRcXHRnbWxcXG5hcHBsaWNhdGlvbi9ncHgreG1sXFx0XFx0XFx0XFx0Z3B4XFxuYXBwbGljYXRpb24vZ3hmXFx0XFx0XFx0XFx0XFx0Z3hmXFxuYXBwbGljYXRpb24vaHlwZXJzdHVkaW9cXHRcXHRcXHRcXHRzdGtcXG5hcHBsaWNhdGlvbi9pbmttbCt4bWxcXHRcXHRcXHRcXHRpbmsgaW5rbWxcXG5hcHBsaWNhdGlvbi9pcGZpeFxcdFxcdFxcdFxcdGlwZml4XFxuYXBwbGljYXRpb24vamF2YS1hcmNoaXZlXFx0XFx0XFx0amFyXFxuYXBwbGljYXRpb24vamF2YS1zZXJpYWxpemVkLW9iamVjdFxcdFxcdHNlclxcbmFwcGxpY2F0aW9uL2phdmEtdm1cXHRcXHRcXHRcXHRjbGFzc1xcbmFwcGxpY2F0aW9uL2phdmFzY3JpcHRcXHRcXHRcXHRcXHRqc1xcbmFwcGxpY2F0aW9uL2pzb25cXHRcXHRcXHRcXHRqc29uIG1hcFxcbmFwcGxpY2F0aW9uL2pzb25tbCtqc29uXFx0XFx0XFx0XFx0anNvbm1sXFxuYXBwbGljYXRpb24vbG9zdCt4bWxcXHRcXHRcXHRcXHRsb3N0eG1sXFxuYXBwbGljYXRpb24vbWFjLWJpbmhleDQwXFx0XFx0XFx0aHF4XFxuYXBwbGljYXRpb24vbWFjLWNvbXBhY3Rwcm9cXHRcXHRcXHRjcHRcXG5hcHBsaWNhdGlvbi9tYWRzK3htbFxcdFxcdFxcdFxcdG1hZHNcXG5hcHBsaWNhdGlvbi9tYXJjXFx0XFx0XFx0XFx0bXJjXFxuYXBwbGljYXRpb24vbWFyY3htbCt4bWxcXHRcXHRcXHRcXHRtcmN4XFxuYXBwbGljYXRpb24vbWF0aGVtYXRpY2FcXHRcXHRcXHRcXHRtYSBuYiBtYlxcbmFwcGxpY2F0aW9uL21hdGhtbCt4bWxcXHRcXHRcXHRcXHRtYXRobWxcXG5hcHBsaWNhdGlvbi9tYm94XFx0XFx0XFx0XFx0bWJveFxcbmFwcGxpY2F0aW9uL21lZGlhc2VydmVyY29udHJvbCt4bWxcXHRcXHRtc2NtbFxcbmFwcGxpY2F0aW9uL21ldGFsaW5rK3htbFxcdFxcdFxcdG1ldGFsaW5rXFxuYXBwbGljYXRpb24vbWV0YWxpbms0K3htbFxcdFxcdFxcdG1ldGE0XFxuYXBwbGljYXRpb24vbWV0cyt4bWxcXHRcXHRcXHRcXHRtZXRzXFxuYXBwbGljYXRpb24vbW9kcyt4bWxcXHRcXHRcXHRcXHRtb2RzXFxuYXBwbGljYXRpb24vbXAyMVxcdFxcdFxcdFxcdG0yMSBtcDIxXFxuYXBwbGljYXRpb24vbXA0XFx0XFx0XFx0XFx0XFx0bXA0c1xcbmFwcGxpY2F0aW9uL21zd29yZFxcdFxcdFxcdFxcdGRvYyBkb3RcXG5hcHBsaWNhdGlvbi9teGZcXHRcXHRcXHRcXHRcXHRteGZcXG5hcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cXHRiaW4gZG1zIGxyZiBtYXIgc28gZGlzdCBkaXN0eiBwa2cgYnBrIGR1bXAgZWxjIGRlcGxveVxcbmFwcGxpY2F0aW9uL29kYVxcdFxcdFxcdFxcdFxcdG9kYVxcbmFwcGxpY2F0aW9uL29lYnBzLXBhY2thZ2UreG1sXFx0XFx0XFx0b3BmXFxuYXBwbGljYXRpb24vb2dnXFx0XFx0XFx0XFx0XFx0b2d4XFxuYXBwbGljYXRpb24vb21kb2MreG1sXFx0XFx0XFx0XFx0b21kb2NcXG5hcHBsaWNhdGlvbi9vbmVub3RlXFx0XFx0XFx0XFx0b25ldG9jIG9uZXRvYzIgb25ldG1wIG9uZXBrZ1xcbmFwcGxpY2F0aW9uL294cHNcXHRcXHRcXHRcXHRveHBzXFxuYXBwbGljYXRpb24vcGF0Y2gtb3BzLWVycm9yK3htbFxcdFxcdFxcdHhlclxcbmFwcGxpY2F0aW9uL3BkZlxcdFxcdFxcdFxcdFxcdHBkZlxcbmFwcGxpY2F0aW9uL3BncC1lbmNyeXB0ZWRcXHRcXHRcXHRwZ3BcXG5hcHBsaWNhdGlvbi9wZ3Atc2lnbmF0dXJlXFx0XFx0XFx0YXNjIHNpZ1xcbmFwcGxpY2F0aW9uL3BpY3MtcnVsZXNcXHRcXHRcXHRcXHRwcmZcXG5hcHBsaWNhdGlvbi9wa2NzMTBcXHRcXHRcXHRcXHRwMTBcXG5hcHBsaWNhdGlvbi9wa2NzNy1taW1lXFx0XFx0XFx0XFx0cDdtIHA3Y1xcbmFwcGxpY2F0aW9uL3BrY3M3LXNpZ25hdHVyZVxcdFxcdFxcdHA3c1xcbmFwcGxpY2F0aW9uL3BrY3M4XFx0XFx0XFx0XFx0cDhcXG5hcHBsaWNhdGlvbi9wa2l4LWF0dHItY2VydFxcdFxcdFxcdGFjXFxuYXBwbGljYXRpb24vcGtpeC1jZXJ0XFx0XFx0XFx0XFx0Y2VyXFxuYXBwbGljYXRpb24vcGtpeC1jcmxcXHRcXHRcXHRcXHRjcmxcXG5hcHBsaWNhdGlvbi9wa2l4LXBraXBhdGhcXHRcXHRcXHRwa2lwYXRoXFxuYXBwbGljYXRpb24vcGtpeGNtcFxcdFxcdFxcdFxcdHBraVxcbmFwcGxpY2F0aW9uL3Bscyt4bWxcXHRcXHRcXHRcXHRwbHNcXG5hcHBsaWNhdGlvbi9wb3N0c2NyaXB0XFx0XFx0XFx0XFx0YWkgZXBzIHBzXFxuYXBwbGljYXRpb24vcHJzLmN3d1xcdFxcdFxcdFxcdGN3d1xcbmFwcGxpY2F0aW9uL3Bza2MreG1sXFx0XFx0XFx0XFx0cHNrY3htbFxcbmFwcGxpY2F0aW9uL3JkZit4bWxcXHRcXHRcXHRcXHRyZGZcXG5hcHBsaWNhdGlvbi9yZWdpbmZvK3htbFxcdFxcdFxcdFxcdHJpZlxcbmFwcGxpY2F0aW9uL3JlbGF4LW5nLWNvbXBhY3Qtc3ludGF4XFx0XFx0cm5jXFxuYXBwbGljYXRpb24vcmVzb3VyY2UtbGlzdHMreG1sXFx0XFx0XFx0cmxcXG5hcHBsaWNhdGlvbi9yZXNvdXJjZS1saXN0cy1kaWZmK3htbFxcdFxcdHJsZFxcbmFwcGxpY2F0aW9uL3Jscy1zZXJ2aWNlcyt4bWxcXHRcXHRcXHRyc1xcbmFwcGxpY2F0aW9uL3Jwa2ktZ2hvc3RidXN0ZXJzXFx0XFx0XFx0Z2JyXFxuYXBwbGljYXRpb24vcnBraS1tYW5pZmVzdFxcdFxcdFxcdG1mdFxcbmFwcGxpY2F0aW9uL3Jwa2ktcm9hXFx0XFx0XFx0XFx0cm9hXFxuYXBwbGljYXRpb24vcnNkK3htbFxcdFxcdFxcdFxcdHJzZFxcbmFwcGxpY2F0aW9uL3Jzcyt4bWxcXHRcXHRcXHRcXHRyc3NcXG5hcHBsaWNhdGlvbi9ydGZcXHRcXHRcXHRcXHRcXHRydGZcXG5hcHBsaWNhdGlvbi9zYm1sK3htbFxcdFxcdFxcdFxcdHNibWxcXG5hcHBsaWNhdGlvbi9zY3ZwLWN2LXJlcXVlc3RcXHRcXHRcXHRzY3FcXG5hcHBsaWNhdGlvbi9zY3ZwLWN2LXJlc3BvbnNlXFx0XFx0XFx0c2NzXFxuYXBwbGljYXRpb24vc2N2cC12cC1yZXF1ZXN0XFx0XFx0XFx0c3BxXFxuYXBwbGljYXRpb24vc2N2cC12cC1yZXNwb25zZVxcdFxcdFxcdHNwcFxcbmFwcGxpY2F0aW9uL3NkcFxcdFxcdFxcdFxcdFxcdHNkcFxcbmFwcGxpY2F0aW9uL3NldC1wYXltZW50LWluaXRpYXRpb25cXHRcXHRzZXRwYXlcXG5hcHBsaWNhdGlvbi9zZXQtcmVnaXN0cmF0aW9uLWluaXRpYXRpb25cXHRcXHRzZXRyZWdcXG5hcHBsaWNhdGlvbi9zaGYreG1sXFx0XFx0XFx0XFx0c2hmXFxuYXBwbGljYXRpb24vc21pbCt4bWxcXHRcXHRcXHRcXHRzbWkgc21pbFxcbmFwcGxpY2F0aW9uL3NwYXJxbC1xdWVyeVxcdFxcdFxcdHJxXFxuYXBwbGljYXRpb24vc3BhcnFsLXJlc3VsdHMreG1sXFx0XFx0XFx0c3J4XFxuYXBwbGljYXRpb24vc3Jnc1xcdFxcdFxcdFxcdGdyYW1cXG5hcHBsaWNhdGlvbi9zcmdzK3htbFxcdFxcdFxcdFxcdGdyeG1sXFxuYXBwbGljYXRpb24vc3J1K3htbFxcdFxcdFxcdFxcdHNydVxcbmFwcGxpY2F0aW9uL3NzZGwreG1sXFx0XFx0XFx0XFx0c3NkbFxcbmFwcGxpY2F0aW9uL3NzbWwreG1sXFx0XFx0XFx0XFx0c3NtbFxcbmFwcGxpY2F0aW9uL3RlaSt4bWxcXHRcXHRcXHRcXHR0ZWkgdGVpY29ycHVzXFxuYXBwbGljYXRpb24vdGhyYXVkK3htbFxcdFxcdFxcdFxcdHRmaVxcbmFwcGxpY2F0aW9uL3RpbWVzdGFtcGVkLWRhdGFcXHRcXHRcXHR0c2RcXG5hcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctbGFyZ2VcXHRcXHRwbGJcXG5hcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctc21hbGxcXHRcXHRwc2JcXG5hcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctdmFyXFx0XFx0XFx0cHZiXFxuYXBwbGljYXRpb24vdm5kLjNncHAyLnRjYXBcXHRcXHRcXHR0Y2FwXFxuYXBwbGljYXRpb24vdm5kLjNtLnBvc3QtaXQtbm90ZXNcXHRcXHRwd25cXG5hcHBsaWNhdGlvbi92bmQuYWNjcGFjLnNpbXBseS5hc29cXHRcXHRhc29cXG5hcHBsaWNhdGlvbi92bmQuYWNjcGFjLnNpbXBseS5pbXBcXHRcXHRpbXBcXG5hcHBsaWNhdGlvbi92bmQuYWN1Y29ib2xcXHRcXHRcXHRhY3VcXG5hcHBsaWNhdGlvbi92bmQuYWN1Y29ycFxcdFxcdFxcdFxcdGF0YyBhY3V0Y1xcbmFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5haXItYXBwbGljYXRpb24taW5zdGFsbGVyLXBhY2thZ2UremlwXFx0YWlyXFxuYXBwbGljYXRpb24vdm5kLmFkb2JlLmZvcm1zY2VudHJhbC5mY2R0XFx0XFx0ZmNkdFxcbmFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5meHBcXHRcXHRcXHRmeHAgZnhwbFxcbmFwcGxpY2F0aW9uL3ZuZC5hZG9iZS54ZHAreG1sXFx0XFx0XFx0eGRwXFxuYXBwbGljYXRpb24vdm5kLmFkb2JlLnhmZGZcXHRcXHRcXHR4ZmRmXFxuYXBwbGljYXRpb24vdm5kLmFoZWFkLnNwYWNlXFx0XFx0XFx0YWhlYWRcXG5hcHBsaWNhdGlvbi92bmQuYWlyemlwLmZpbGVzZWN1cmUuYXpmXFx0XFx0YXpmXFxuYXBwbGljYXRpb24vdm5kLmFpcnppcC5maWxlc2VjdXJlLmF6c1xcdFxcdGF6c1xcbmFwcGxpY2F0aW9uL3ZuZC5hbWF6b24uZWJvb2tcXHRcXHRcXHRhendcXG5hcHBsaWNhdGlvbi92bmQuYW1lcmljYW5keW5hbWljcy5hY2NcXHRcXHRhY2NcXG5hcHBsaWNhdGlvbi92bmQuYW1pZ2EuYW1pXFx0XFx0XFx0YW1pXFxuYXBwbGljYXRpb24vdm5kLmFuZHJvaWQucGFja2FnZS1hcmNoaXZlXFx0XFx0YXBrXFxuYXBwbGljYXRpb24vdm5kLmFuc2VyLXdlYi1jZXJ0aWZpY2F0ZS1pc3N1ZS1pbml0aWF0aW9uXFx0Y2lpXFxuYXBwbGljYXRpb24vdm5kLmFuc2VyLXdlYi1mdW5kcy10cmFuc2Zlci1pbml0aWF0aW9uXFx0ZnRpXFxuYXBwbGljYXRpb24vdm5kLmFudGl4LmdhbWUtY29tcG9uZW50XFx0XFx0YXR4XFxuYXBwbGljYXRpb24vdm5kLmFwcGxlLmluc3RhbGxlcit4bWxcXHRcXHRtcGtnXFxuYXBwbGljYXRpb24vdm5kLmFwcGxlLm1wZWd1cmxcXHRcXHRcXHRtM3U4XFxuYXBwbGljYXRpb24vdm5kLmFyaXN0YW5ldHdvcmtzLnN3aVxcdFxcdHN3aVxcbmFwcGxpY2F0aW9uL3ZuZC5hc3RyYWVhLXNvZnR3YXJlLmlvdGFcXHRcXHRpb3RhXFxuYXBwbGljYXRpb24vdm5kLmF1ZGlvZ3JhcGhcXHRcXHRcXHRhZXBcXG5hcHBsaWNhdGlvbi92bmQuYmx1ZWljZS5tdWx0aXBhc3NcXHRcXHRtcG1cXG5hcHBsaWNhdGlvbi92bmQuYm1pXFx0XFx0XFx0XFx0Ym1pXFxuYXBwbGljYXRpb24vdm5kLmJ1c2luZXNzb2JqZWN0c1xcdFxcdFxcdHJlcFxcbmFwcGxpY2F0aW9uL3ZuZC5jaGVtZHJhdyt4bWxcXHRcXHRcXHRjZHhtbFxcbmFwcGxpY2F0aW9uL3ZuZC5jaGlwbnV0cy5rYXJhb2tlLW1tZFxcdFxcdG1tZFxcbmFwcGxpY2F0aW9uL3ZuZC5jaW5kZXJlbGxhXFx0XFx0XFx0Y2R5XFxuYXBwbGljYXRpb24vdm5kLmNsYXltb3JlXFx0XFx0XFx0Y2xhXFxuYXBwbGljYXRpb24vdm5kLmNsb2FudG8ucnA5XFx0XFx0XFx0cnA5XFxuYXBwbGljYXRpb24vdm5kLmNsb25rLmM0Z3JvdXBcXHRcXHRcXHRjNGcgYzRkIGM0ZiBjNHAgYzR1XFxuYXBwbGljYXRpb24vdm5kLmNsdWV0cnVzdC5jYXJ0b21vYmlsZS1jb25maWdcXHRcXHRjMTFhbWNcXG5hcHBsaWNhdGlvbi92bmQuY2x1ZXRydXN0LmNhcnRvbW9iaWxlLWNvbmZpZy1wa2dcXHRjMTFhbXpcXG5hcHBsaWNhdGlvbi92bmQuY29tbW9uc3BhY2VcXHRcXHRcXHRjc3BcXG5hcHBsaWNhdGlvbi92bmQuY29udGFjdC5jbXNnXFx0XFx0XFx0Y2RiY21zZ1xcbmFwcGxpY2F0aW9uL3ZuZC5jb3Ntb2NhbGxlclxcdFxcdFxcdGNtY1xcbmFwcGxpY2F0aW9uL3ZuZC5jcmljay5jbGlja2VyXFx0XFx0XFx0Y2xreFxcbmFwcGxpY2F0aW9uL3ZuZC5jcmljay5jbGlja2VyLmtleWJvYXJkXFx0XFx0Y2xra1xcbmFwcGxpY2F0aW9uL3ZuZC5jcmljay5jbGlja2VyLnBhbGV0dGVcXHRcXHRjbGtwXFxuYXBwbGljYXRpb24vdm5kLmNyaWNrLmNsaWNrZXIudGVtcGxhdGVcXHRcXHRjbGt0XFxuYXBwbGljYXRpb24vdm5kLmNyaWNrLmNsaWNrZXIud29yZGJhbmtcXHRcXHRjbGt3XFxuYXBwbGljYXRpb24vdm5kLmNyaXRpY2FsdG9vbHMud2JzK3htbFxcdFxcdHdic1xcbmFwcGxpY2F0aW9uL3ZuZC5jdGMtcG9zbWxcXHRcXHRcXHRwbWxcXG5hcHBsaWNhdGlvbi92bmQuY3Vwcy1wcGRcXHRcXHRcXHRwcGRcXG5hcHBsaWNhdGlvbi92bmQuY3VybC5jYXJcXHRcXHRcXHRjYXJcXG5hcHBsaWNhdGlvbi92bmQuY3VybC5wY3VybFxcdFxcdFxcdHBjdXJsXFxuYXBwbGljYXRpb24vdm5kLmRhcnRcXHRcXHRcXHRcXHRkYXJ0XFxuYXBwbGljYXRpb24vdm5kLmRhdGEtdmlzaW9uLnJkelxcdFxcdFxcdHJkelxcbmFwcGxpY2F0aW9uL3ZuZC5kZWNlLmRhdGFcXHRcXHRcXHR1dmYgdXZ2ZiB1dmQgdXZ2ZFxcbmFwcGxpY2F0aW9uL3ZuZC5kZWNlLnR0bWwreG1sXFx0XFx0XFx0dXZ0IHV2dnRcXG5hcHBsaWNhdGlvbi92bmQuZGVjZS51bnNwZWNpZmllZFxcdFxcdHV2eCB1dnZ4XFxuYXBwbGljYXRpb24vdm5kLmRlY2UuemlwXFx0XFx0XFx0dXZ6IHV2dnpcXG5hcHBsaWNhdGlvbi92bmQuZGVub3ZvLmZjc2VsYXlvdXQtbGlua1xcdFxcdGZlX2xhdW5jaFxcbmFwcGxpY2F0aW9uL3ZuZC5kbmFcXHRcXHRcXHRcXHRkbmFcXG5hcHBsaWNhdGlvbi92bmQuZG9sYnkubWxwXFx0XFx0XFx0bWxwXFxuYXBwbGljYXRpb24vdm5kLmRwZ3JhcGhcXHRcXHRcXHRcXHRkcGdcXG5hcHBsaWNhdGlvbi92bmQuZHJlYW1mYWN0b3J5XFx0XFx0XFx0ZGZhY1xcbmFwcGxpY2F0aW9uL3ZuZC5kcy1rZXlwb2ludFxcdFxcdFxcdGtweHhcXG5hcHBsaWNhdGlvbi92bmQuZHZiLmFpdFxcdFxcdFxcdFxcdGFpdFxcbmFwcGxpY2F0aW9uL3ZuZC5kdmIuc2VydmljZVxcdFxcdFxcdHN2Y1xcbmFwcGxpY2F0aW9uL3ZuZC5keW5hZ2VvXFx0XFx0XFx0XFx0Z2VvXFxuYXBwbGljYXRpb24vdm5kLmVjb3dpbi5jaGFydFxcdFxcdFxcdG1hZ1xcbmFwcGxpY2F0aW9uL3ZuZC5lbmxpdmVuXFx0XFx0XFx0XFx0bm1sXFxuYXBwbGljYXRpb24vdm5kLmVwc29uLmVzZlxcdFxcdFxcdGVzZlxcbmFwcGxpY2F0aW9uL3ZuZC5lcHNvbi5tc2ZcXHRcXHRcXHRtc2ZcXG5hcHBsaWNhdGlvbi92bmQuZXBzb24ucXVpY2thbmltZVxcdFxcdHFhbVxcbmFwcGxpY2F0aW9uL3ZuZC5lcHNvbi5zYWx0XFx0XFx0XFx0c2x0XFxuYXBwbGljYXRpb24vdm5kLmVwc29uLnNzZlxcdFxcdFxcdHNzZlxcbmFwcGxpY2F0aW9uL3ZuZC5lc3ppZ25vMyt4bWxcXHRcXHRcXHRlczMgZXQzXFxuYXBwbGljYXRpb24vdm5kLmV6cGl4LWFsYnVtXFx0XFx0XFx0ZXoyXFxuYXBwbGljYXRpb24vdm5kLmV6cGl4LXBhY2thZ2VcXHRcXHRcXHRlejNcXG5hcHBsaWNhdGlvbi92bmQuZmRmXFx0XFx0XFx0XFx0ZmRmXFxuYXBwbGljYXRpb24vdm5kLmZkc24ubXNlZWRcXHRcXHRcXHRtc2VlZFxcbmFwcGxpY2F0aW9uL3ZuZC5mZHNuLnNlZWRcXHRcXHRcXHRzZWVkIGRhdGFsZXNzXFxuYXBwbGljYXRpb24vdm5kLmZsb2dyYXBoaXRcXHRcXHRcXHRncGhcXG5hcHBsaWNhdGlvbi92bmQuZmx1eHRpbWUuY2xpcFxcdFxcdFxcdGZ0Y1xcbmFwcGxpY2F0aW9uL3ZuZC5mcmFtZW1ha2VyXFx0XFx0XFx0Zm0gZnJhbWUgbWFrZXIgYm9va1xcbmFwcGxpY2F0aW9uL3ZuZC5mcm9nYW5zLmZuY1xcdFxcdFxcdGZuY1xcbmFwcGxpY2F0aW9uL3ZuZC5mcm9nYW5zLmx0ZlxcdFxcdFxcdGx0ZlxcbmFwcGxpY2F0aW9uL3ZuZC5mc2Mud2VibGF1bmNoXFx0XFx0XFx0ZnNjXFxuYXBwbGljYXRpb24vdm5kLmZ1aml0c3Uub2FzeXNcXHRcXHRcXHRvYXNcXG5hcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5czJcXHRcXHRcXHRvYTJcXG5hcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5czNcXHRcXHRcXHRvYTNcXG5hcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5c2dwXFx0XFx0XFx0Zmc1XFxuYXBwbGljYXRpb24vdm5kLmZ1aml0c3Uub2FzeXNwcnNcXHRcXHRiaDJcXG5hcHBsaWNhdGlvbi92bmQuZnVqaXhlcm94LmRkZFxcdFxcdFxcdGRkZFxcbmFwcGxpY2F0aW9uL3ZuZC5mdWppeGVyb3guZG9jdXdvcmtzXFx0XFx0eGR3XFxuYXBwbGljYXRpb24vdm5kLmZ1aml4ZXJveC5kb2N1d29ya3MuYmluZGVyXFx0eGJkXFxuYXBwbGljYXRpb24vdm5kLmZ1enp5c2hlZXRcXHRcXHRcXHRmenNcXG5hcHBsaWNhdGlvbi92bmQuZ2Vub21hdGl4LnR1eGVkb1xcdFxcdHR4ZFxcbmFwcGxpY2F0aW9uL3ZuZC5nZW9nZWJyYS5maWxlXFx0XFx0XFx0Z2diXFxuYXBwbGljYXRpb24vdm5kLmdlb2dlYnJhLnRvb2xcXHRcXHRcXHRnZ3RcXG5hcHBsaWNhdGlvbi92bmQuZ2VvbWV0cnktZXhwbG9yZXJcXHRcXHRnZXggZ3JlXFxuYXBwbGljYXRpb24vdm5kLmdlb25leHRcXHRcXHRcXHRcXHRneHRcXG5hcHBsaWNhdGlvbi92bmQuZ2VvcGxhblxcdFxcdFxcdFxcdGcyd1xcbmFwcGxpY2F0aW9uL3ZuZC5nZW9zcGFjZVxcdFxcdFxcdGczd1xcbmFwcGxpY2F0aW9uL3ZuZC5nbXhcXHRcXHRcXHRcXHRnbXhcXG5hcHBsaWNhdGlvbi92bmQuZ29vZ2xlLWVhcnRoLmttbCt4bWxcXHRcXHRrbWxcXG5hcHBsaWNhdGlvbi92bmQuZ29vZ2xlLWVhcnRoLmttelxcdFxcdGttelxcbmFwcGxpY2F0aW9uL3ZuZC5ncmFmZXFcXHRcXHRcXHRcXHRncWYgZ3FzXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS1hY2NvdW50XFx0XFx0XFx0Z2FjXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS1oZWxwXFx0XFx0XFx0Z2hmXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS1pZGVudGl0eS1tZXNzYWdlXFx0XFx0Z2ltXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS1pbmplY3RvclxcdFxcdFxcdGdydlxcbmFwcGxpY2F0aW9uL3ZuZC5ncm9vdmUtdG9vbC1tZXNzYWdlXFx0XFx0Z3RtXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS10b29sLXRlbXBsYXRlXFx0XFx0dHBsXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS12Y2FyZFxcdFxcdFxcdHZjZ1xcbmFwcGxpY2F0aW9uL3ZuZC5oYWwreG1sXFx0XFx0XFx0XFx0aGFsXFxuYXBwbGljYXRpb24vdm5kLmhhbmRoZWxkLWVudGVydGFpbm1lbnQreG1sXFx0em1tXFxuYXBwbGljYXRpb24vdm5kLmhiY2lcXHRcXHRcXHRcXHRoYmNpXFxuYXBwbGljYXRpb24vdm5kLmhoZS5sZXNzb24tcGxheWVyXFx0XFx0bGVzXFxuYXBwbGljYXRpb24vdm5kLmhwLWhwZ2xcXHRcXHRcXHRcXHRocGdsXFxuYXBwbGljYXRpb24vdm5kLmhwLWhwaWRcXHRcXHRcXHRcXHRocGlkXFxuYXBwbGljYXRpb24vdm5kLmhwLWhwc1xcdFxcdFxcdFxcdGhwc1xcbmFwcGxpY2F0aW9uL3ZuZC5ocC1qbHl0XFx0XFx0XFx0XFx0amx0XFxuYXBwbGljYXRpb24vdm5kLmhwLXBjbFxcdFxcdFxcdFxcdHBjbFxcbmFwcGxpY2F0aW9uL3ZuZC5ocC1wY2x4bFxcdFxcdFxcdHBjbHhsXFxuYXBwbGljYXRpb24vdm5kLmh5ZHJvc3RhdGl4LnNvZi1kYXRhXFx0XFx0c2ZkLWhkc3R4XFxuYXBwbGljYXRpb24vdm5kLmlibS5taW5pcGF5XFx0XFx0XFx0bXB5XFxuYXBwbGljYXRpb24vdm5kLmlibS5tb2RjYXBcXHRcXHRcXHRhZnAgbGlzdGFmcCBsaXN0MzgyMFxcbmFwcGxpY2F0aW9uL3ZuZC5pYm0ucmlnaHRzLW1hbmFnZW1lbnRcXHRcXHRpcm1cXG5hcHBsaWNhdGlvbi92bmQuaWJtLnNlY3VyZS1jb250YWluZXJcXHRcXHRzY1xcbmFwcGxpY2F0aW9uL3ZuZC5pY2Nwcm9maWxlXFx0XFx0XFx0aWNjIGljbVxcbmFwcGxpY2F0aW9uL3ZuZC5pZ2xvYWRlclxcdFxcdFxcdGlnbFxcbmFwcGxpY2F0aW9uL3ZuZC5pbW1lcnZpc2lvbi1pdnBcXHRcXHRcXHRpdnBcXG5hcHBsaWNhdGlvbi92bmQuaW1tZXJ2aXNpb24taXZ1XFx0XFx0XFx0aXZ1XFxuYXBwbGljYXRpb24vdm5kLmluc29ycy5pZ21cXHRcXHRcXHRpZ21cXG5hcHBsaWNhdGlvbi92bmQuaW50ZXJjb24uZm9ybW5ldFxcdFxcdHhwdyB4cHhcXG5hcHBsaWNhdGlvbi92bmQuaW50ZXJnZW9cXHRcXHRcXHRpMmdcXG5hcHBsaWNhdGlvbi92bmQuaW50dS5xYm9cXHRcXHRcXHRxYm9cXG5hcHBsaWNhdGlvbi92bmQuaW50dS5xZnhcXHRcXHRcXHRxZnhcXG5hcHBsaWNhdGlvbi92bmQuaXB1bnBsdWdnZWQucmNwcm9maWxlXFx0XFx0cmNwcm9maWxlXFxuYXBwbGljYXRpb24vdm5kLmlyZXBvc2l0b3J5LnBhY2thZ2UreG1sXFx0XFx0aXJwXFxuYXBwbGljYXRpb24vdm5kLmlzLXhwclxcdFxcdFxcdFxcdHhwclxcbmFwcGxpY2F0aW9uL3ZuZC5pc2FjLmZjc1xcdFxcdFxcdGZjc1xcbmFwcGxpY2F0aW9uL3ZuZC5qYW1cXHRcXHRcXHRcXHRqYW1cXG5hcHBsaWNhdGlvbi92bmQuamNwLmphdmFtZS5taWRsZXQtcm1zXFx0XFx0cm1zXFxuYXBwbGljYXRpb24vdm5kLmppc3BcXHRcXHRcXHRcXHRqaXNwXFxuYXBwbGljYXRpb24vdm5kLmpvb3N0LmpvZGEtYXJjaGl2ZVxcdFxcdGpvZGFcXG5hcHBsaWNhdGlvbi92bmQua2Fob290elxcdFxcdFxcdFxcdGt0eiBrdHJcXG5hcHBsaWNhdGlvbi92bmQua2RlLmthcmJvblxcdFxcdFxcdGthcmJvblxcbmFwcGxpY2F0aW9uL3ZuZC5rZGUua2NoYXJ0XFx0XFx0XFx0Y2hydFxcbmFwcGxpY2F0aW9uL3ZuZC5rZGUua2Zvcm11bGFcXHRcXHRcXHRrZm9cXG5hcHBsaWNhdGlvbi92bmQua2RlLmtpdmlvXFx0XFx0XFx0Zmx3XFxuYXBwbGljYXRpb24vdm5kLmtkZS5rb250b3VyXFx0XFx0XFx0a29uXFxuYXBwbGljYXRpb24vdm5kLmtkZS5rcHJlc2VudGVyXFx0XFx0XFx0a3ByIGtwdFxcbmFwcGxpY2F0aW9uL3ZuZC5rZGUua3NwcmVhZFxcdFxcdFxcdGtzcFxcbmFwcGxpY2F0aW9uL3ZuZC5rZGUua3dvcmRcXHRcXHRcXHRrd2Qga3d0XFxuYXBwbGljYXRpb24vdm5kLmtlbmFtZWFhcHBcXHRcXHRcXHRodGtlXFxuYXBwbGljYXRpb24vdm5kLmtpZHNwaXJhdGlvblxcdFxcdFxcdGtpYVxcbmFwcGxpY2F0aW9uL3ZuZC5raW5hclxcdFxcdFxcdFxcdGtuZSBrbnBcXG5hcHBsaWNhdGlvbi92bmQua29hblxcdFxcdFxcdFxcdHNrcCBza2Qgc2t0IHNrbVxcbmFwcGxpY2F0aW9uL3ZuZC5rb2Rhay1kZXNjcmlwdG9yXFx0XFx0c3NlXFxuYXBwbGljYXRpb24vdm5kLmxhcy5sYXMreG1sXFx0XFx0XFx0bGFzeG1sXFxuYXBwbGljYXRpb24vdm5kLmxsYW1hZ3JhcGhpY3MubGlmZS1iYWxhbmNlLmRlc2t0b3BcXHRsYmRcXG5hcHBsaWNhdGlvbi92bmQubGxhbWFncmFwaGljcy5saWZlLWJhbGFuY2UuZXhjaGFuZ2UreG1sXFx0bGJlXFxuYXBwbGljYXRpb24vdm5kLmxvdHVzLTEtMi0zXFx0XFx0XFx0MTIzXFxuYXBwbGljYXRpb24vdm5kLmxvdHVzLWFwcHJvYWNoXFx0XFx0XFx0YXByXFxuYXBwbGljYXRpb24vdm5kLmxvdHVzLWZyZWVsYW5jZVxcdFxcdFxcdHByZVxcbmFwcGxpY2F0aW9uL3ZuZC5sb3R1cy1ub3Rlc1xcdFxcdFxcdG5zZlxcbmFwcGxpY2F0aW9uL3ZuZC5sb3R1cy1vcmdhbml6ZXJcXHRcXHRcXHRvcmdcXG5hcHBsaWNhdGlvbi92bmQubG90dXMtc2NyZWVuY2FtXFx0XFx0XFx0c2NtXFxuYXBwbGljYXRpb24vdm5kLmxvdHVzLXdvcmRwcm9cXHRcXHRcXHRsd3BcXG5hcHBsaWNhdGlvbi92bmQubWFjcG9ydHMucG9ydHBrZ1xcdFxcdHBvcnRwa2dcXG5hcHBsaWNhdGlvbi92bmQubWNkXFx0XFx0XFx0XFx0bWNkXFxuYXBwbGljYXRpb24vdm5kLm1lZGNhbGNkYXRhXFx0XFx0XFx0bWMxXFxuYXBwbGljYXRpb24vdm5kLm1lZGlhc3RhdGlvbi5jZGtleVxcdFxcdGNka2V5XFxuYXBwbGljYXRpb24vdm5kLm1mZXJcXHRcXHRcXHRcXHRtd2ZcXG5hcHBsaWNhdGlvbi92bmQubWZtcFxcdFxcdFxcdFxcdG1mbVxcbmFwcGxpY2F0aW9uL3ZuZC5taWNyb2dyYWZ4LmZsb1xcdFxcdFxcdGZsb1xcbmFwcGxpY2F0aW9uL3ZuZC5taWNyb2dyYWZ4LmlneFxcdFxcdFxcdGlneFxcbmFwcGxpY2F0aW9uL3ZuZC5taWZcXHRcXHRcXHRcXHRtaWZcXG5hcHBsaWNhdGlvbi92bmQubW9iaXVzLmRhZlxcdFxcdFxcdGRhZlxcbmFwcGxpY2F0aW9uL3ZuZC5tb2JpdXMuZGlzXFx0XFx0XFx0ZGlzXFxuYXBwbGljYXRpb24vdm5kLm1vYml1cy5tYmtcXHRcXHRcXHRtYmtcXG5hcHBsaWNhdGlvbi92bmQubW9iaXVzLm1xeVxcdFxcdFxcdG1xeVxcbmFwcGxpY2F0aW9uL3ZuZC5tb2JpdXMubXNsXFx0XFx0XFx0bXNsXFxuYXBwbGljYXRpb24vdm5kLm1vYml1cy5wbGNcXHRcXHRcXHRwbGNcXG5hcHBsaWNhdGlvbi92bmQubW9iaXVzLnR4ZlxcdFxcdFxcdHR4ZlxcbmFwcGxpY2F0aW9uL3ZuZC5tb3BodW4uYXBwbGljYXRpb25cXHRcXHRtcG5cXG5hcHBsaWNhdGlvbi92bmQubW9waHVuLmNlcnRpZmljYXRlXFx0XFx0bXBjXFxuYXBwbGljYXRpb24vdm5kLm1vemlsbGEueHVsK3htbFxcdFxcdFxcdHh1bFxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1hcnRnYWxyeVxcdFxcdFxcdGNpbFxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1jYWItY29tcHJlc3NlZFxcdFxcdGNhYlxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbFxcdFxcdFxcdHhscyB4bG0geGxhIHhsYyB4bHQgeGx3XFxuYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsLmFkZGluLm1hY3JvZW5hYmxlZC4xMlxcdFxcdHhsYW1cXG5hcHBsaWNhdGlvbi92bmQubXMtZXhjZWwuc2hlZXQuYmluYXJ5Lm1hY3JvZW5hYmxlZC4xMlxcdHhsc2JcXG5hcHBsaWNhdGlvbi92bmQubXMtZXhjZWwuc2hlZXQubWFjcm9lbmFibGVkLjEyXFx0XFx0eGxzbVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbC50ZW1wbGF0ZS5tYWNyb2VuYWJsZWQuMTJcXHR4bHRtXFxuYXBwbGljYXRpb24vdm5kLm1zLWZvbnRvYmplY3RcXHRcXHRcXHRlb3RcXG5hcHBsaWNhdGlvbi92bmQubXMtaHRtbGhlbHBcXHRcXHRcXHRjaG1cXG5hcHBsaWNhdGlvbi92bmQubXMtaW1zXFx0XFx0XFx0XFx0aW1zXFxuYXBwbGljYXRpb24vdm5kLm1zLWxybVxcdFxcdFxcdFxcdGxybVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1vZmZpY2V0aGVtZVxcdFxcdFxcdHRobXhcXG5hcHBsaWNhdGlvbi92bmQubXMtcGtpLnNlY2NhdFxcdFxcdFxcdGNhdFxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1wa2kuc3RsXFx0XFx0XFx0c3RsXFxuYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnRcXHRcXHRcXHRwcHQgcHBzIHBvdFxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50LmFkZGluLm1hY3JvZW5hYmxlZC4xMlxcdFxcdHBwYW1cXG5hcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludC5wcmVzZW50YXRpb24ubWFjcm9lbmFibGVkLjEyXFx0cHB0bVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50LnNsaWRlLm1hY3JvZW5hYmxlZC4xMlxcdFxcdHNsZG1cXG5hcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludC5zbGlkZXNob3cubWFjcm9lbmFibGVkLjEyXFx0XFx0cHBzbVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50LnRlbXBsYXRlLm1hY3JvZW5hYmxlZC4xMlxcdFxcdHBvdG1cXG5hcHBsaWNhdGlvbi92bmQubXMtcHJvamVjdFxcdFxcdFxcdG1wcCBtcHRcXG5hcHBsaWNhdGlvbi92bmQubXMtd29yZC5kb2N1bWVudC5tYWNyb2VuYWJsZWQuMTJcXHRkb2NtXFxuYXBwbGljYXRpb24vdm5kLm1zLXdvcmQudGVtcGxhdGUubWFjcm9lbmFibGVkLjEyXFx0ZG90bVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy13b3Jrc1xcdFxcdFxcdHdwcyB3a3Mgd2NtIHdkYlxcbmFwcGxpY2F0aW9uL3ZuZC5tcy13cGxcXHRcXHRcXHRcXHR3cGxcXG5hcHBsaWNhdGlvbi92bmQubXMteHBzZG9jdW1lbnRcXHRcXHRcXHR4cHNcXG5hcHBsaWNhdGlvbi92bmQubXNlcVxcdFxcdFxcdFxcdG1zZXFcXG5hcHBsaWNhdGlvbi92bmQubXVzaWNpYW5cXHRcXHRcXHRtdXNcXG5hcHBsaWNhdGlvbi92bmQubXV2ZWUuc3R5bGVcXHRcXHRcXHRtc3R5XFxuYXBwbGljYXRpb24vdm5kLm15bmZjXFx0XFx0XFx0XFx0dGFnbGV0XFxuYXBwbGljYXRpb24vdm5kLm5ldXJvbGFuZ3VhZ2Uubmx1XFx0XFx0bmx1XFxuYXBwbGljYXRpb24vdm5kLm5pdGZcXHRcXHRcXHRcXHRudGYgbml0ZlxcbmFwcGxpY2F0aW9uL3ZuZC5ub2JsZW5ldC1kaXJlY3RvcnlcXHRcXHRubmRcXG5hcHBsaWNhdGlvbi92bmQubm9ibGVuZXQtc2VhbGVyXFx0XFx0XFx0bm5zXFxuYXBwbGljYXRpb24vdm5kLm5vYmxlbmV0LXdlYlxcdFxcdFxcdG5ud1xcbmFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5uLWdhZ2UuZGF0YVxcdFxcdG5nZGF0XFxuYXBwbGljYXRpb24vdm5kLm5va2lhLm4tZ2FnZS5zeW1iaWFuLmluc3RhbGxcXHRuLWdhZ2VcXG5hcHBsaWNhdGlvbi92bmQubm9raWEucmFkaW8tcHJlc2V0XFx0XFx0cnBzdFxcbmFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5yYWRpby1wcmVzZXRzXFx0XFx0cnBzc1xcbmFwcGxpY2F0aW9uL3ZuZC5ub3ZhZGlnbS5lZG1cXHRcXHRcXHRlZG1cXG5hcHBsaWNhdGlvbi92bmQubm92YWRpZ20uZWR4XFx0XFx0XFx0ZWR4XFxuYXBwbGljYXRpb24vdm5kLm5vdmFkaWdtLmV4dFxcdFxcdFxcdGV4dFxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuY2hhcnRcXHRcXHRvZGNcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmNoYXJ0LXRlbXBsYXRlXFx0b3RjXFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5kYXRhYmFzZVxcdFxcdG9kYlxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZm9ybXVsYVxcdFxcdG9kZlxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZm9ybXVsYS10ZW1wbGF0ZVxcdG9kZnRcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmdyYXBoaWNzXFx0XFx0b2RnXFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5ncmFwaGljcy10ZW1wbGF0ZVxcdG90Z1xcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuaW1hZ2VcXHRcXHRvZGlcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmltYWdlLXRlbXBsYXRlXFx0b3RpXFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5wcmVzZW50YXRpb25cXHRcXHRvZHBcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvbi10ZW1wbGF0ZVxcdG90cFxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuc3ByZWFkc2hlZXRcXHRcXHRvZHNcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0LXRlbXBsYXRlXFx0b3RzXFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC50ZXh0XFx0XFx0XFx0b2R0XFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC50ZXh0LW1hc3RlclxcdFxcdG9kbVxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dC10ZW1wbGF0ZVxcdG90dFxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dC13ZWJcXHRcXHRvdGhcXG5hcHBsaWNhdGlvbi92bmQub2xwYy1zdWdhclxcdFxcdFxcdHhvXFxuYXBwbGljYXRpb24vdm5kLm9tYS5kZDIreG1sXFx0XFx0XFx0ZGQyXFxuYXBwbGljYXRpb24vdm5kLm9wZW5vZmZpY2VvcmcuZXh0ZW5zaW9uXFx0XFx0b3h0XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnByZXNlbnRhdGlvblxcdHBwdHhcXG5hcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwuc2xpZGVcXHRzbGR4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnNsaWRlc2hvd1xcdHBwc3hcXG5hcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwudGVtcGxhdGVcXHRwb3R4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXRcXHR4bHN4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwudGVtcGxhdGVcXHR4bHR4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnRcXHRkb2N4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwudGVtcGxhdGVcXHRkb3R4XFxuYXBwbGljYXRpb24vdm5kLm9zZ2VvLm1hcGd1aWRlLnBhY2thZ2VcXHRcXHRtZ3BcXG5hcHBsaWNhdGlvbi92bmQub3NnaS5kcFxcdFxcdFxcdFxcdGRwXFxuYXBwbGljYXRpb24vdm5kLm9zZ2kuc3Vic3lzdGVtXFx0XFx0XFx0ZXNhXFxuYXBwbGljYXRpb24vdm5kLnBhbG1cXHRcXHRcXHRcXHRwZGIgcHFhIG9wcmNcXG5hcHBsaWNhdGlvbi92bmQucGF3YWFmaWxlXFx0XFx0XFx0cGF3XFxuYXBwbGljYXRpb24vdm5kLnBnLmZvcm1hdFxcdFxcdFxcdHN0clxcbmFwcGxpY2F0aW9uL3ZuZC5wZy5vc2FzbGlcXHRcXHRcXHRlaTZcXG5hcHBsaWNhdGlvbi92bmQucGljc2VsXFx0XFx0XFx0XFx0ZWZpZlxcbmFwcGxpY2F0aW9uL3ZuZC5wbWkud2lkZ2V0XFx0XFx0XFx0d2dcXG5hcHBsaWNhdGlvbi92bmQucG9ja2V0bGVhcm5cXHRcXHRcXHRwbGZcXG5hcHBsaWNhdGlvbi92bmQucG93ZXJidWlsZGVyNlxcdFxcdFxcdHBiZFxcbmFwcGxpY2F0aW9uL3ZuZC5wcmV2aWV3c3lzdGVtcy5ib3hcXHRcXHRib3hcXG5hcHBsaWNhdGlvbi92bmQucHJvdGV1cy5tYWdhemluZVxcdFxcdG1nelxcbmFwcGxpY2F0aW9uL3ZuZC5wdWJsaXNoYXJlLWRlbHRhLXRyZWVcXHRcXHRxcHNcXG5hcHBsaWNhdGlvbi92bmQucHZpLnB0aWQxXFx0XFx0XFx0cHRpZFxcbmFwcGxpY2F0aW9uL3ZuZC5xdWFyay5xdWFya3hwcmVzc1xcdFxcdHF4ZCBxeHQgcXdkIHF3dCBxeGwgcXhiXFxuYXBwbGljYXRpb24vdm5kLnJlYWx2bmMuYmVkXFx0XFx0XFx0YmVkXFxuYXBwbGljYXRpb24vdm5kLnJlY29yZGFyZS5tdXNpY3htbFxcdFxcdG14bFxcbmFwcGxpY2F0aW9uL3ZuZC5yZWNvcmRhcmUubXVzaWN4bWwreG1sXFx0XFx0bXVzaWN4bWxcXG5hcHBsaWNhdGlvbi92bmQucmlnLmNyeXB0b25vdGVcXHRcXHRcXHRjcnlwdG9ub3RlXFxuYXBwbGljYXRpb24vdm5kLnJpbS5jb2RcXHRcXHRcXHRcXHRjb2RcXG5hcHBsaWNhdGlvbi92bmQucm4tcmVhbG1lZGlhXFx0XFx0XFx0cm1cXG5hcHBsaWNhdGlvbi92bmQucm4tcmVhbG1lZGlhLXZiclxcdFxcdHJtdmJcXG5hcHBsaWNhdGlvbi92bmQucm91dGU2Ni5saW5rNjYreG1sXFx0XFx0bGluazY2XFxuYXBwbGljYXRpb24vdm5kLnNhaWxpbmd0cmFja2VyLnRyYWNrXFx0XFx0c3RcXG5hcHBsaWNhdGlvbi92bmQuc2VlbWFpbFxcdFxcdFxcdFxcdHNlZVxcbmFwcGxpY2F0aW9uL3ZuZC5zZW1hXFx0XFx0XFx0XFx0c2VtYVxcbmFwcGxpY2F0aW9uL3ZuZC5zZW1kXFx0XFx0XFx0XFx0c2VtZFxcbmFwcGxpY2F0aW9uL3ZuZC5zZW1mXFx0XFx0XFx0XFx0c2VtZlxcbmFwcGxpY2F0aW9uL3ZuZC5zaGFuYS5pbmZvcm1lZC5mb3JtZGF0YVxcdFxcdGlmbVxcbmFwcGxpY2F0aW9uL3ZuZC5zaGFuYS5pbmZvcm1lZC5mb3JtdGVtcGxhdGVcXHRpdHBcXG5hcHBsaWNhdGlvbi92bmQuc2hhbmEuaW5mb3JtZWQuaW50ZXJjaGFuZ2VcXHRpaWZcXG5hcHBsaWNhdGlvbi92bmQuc2hhbmEuaW5mb3JtZWQucGFja2FnZVxcdFxcdGlwa1xcbmFwcGxpY2F0aW9uL3ZuZC5zaW10ZWNoLW1pbmRtYXBwZXJcXHRcXHR0d2QgdHdkc1xcbmFwcGxpY2F0aW9uL3ZuZC5zbWFmXFx0XFx0XFx0XFx0bW1mXFxuYXBwbGljYXRpb24vdm5kLnNtYXJ0LnRlYWNoZXJcXHRcXHRcXHR0ZWFjaGVyXFxuYXBwbGljYXRpb24vdm5kLnNvbGVudC5zZGttK3htbFxcdFxcdFxcdHNka20gc2RrZFxcbmFwcGxpY2F0aW9uL3ZuZC5zcG90ZmlyZS5keHBcXHRcXHRcXHRkeHBcXG5hcHBsaWNhdGlvbi92bmQuc3BvdGZpcmUuc2ZzXFx0XFx0XFx0c2ZzXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5jYWxjXFx0XFx0c2RjXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5kcmF3XFx0XFx0c2RhXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5pbXByZXNzXFx0XFx0c2RkXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5tYXRoXFx0XFx0c21mXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi53cml0ZXJcXHRcXHRzZHcgdm9yXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi53cml0ZXItZ2xvYmFsXFx0c2dsXFxuYXBwbGljYXRpb24vdm5kLnN0ZXBtYW5pYS5wYWNrYWdlXFx0XFx0c216aXBcXG5hcHBsaWNhdGlvbi92bmQuc3RlcG1hbmlhLnN0ZXBjaGFydFxcdFxcdHNtXFxuYXBwbGljYXRpb24vdm5kLnN1bi54bWwuY2FsY1xcdFxcdFxcdHN4Y1xcbmFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmNhbGMudGVtcGxhdGVcXHRcXHRzdGNcXG5hcHBsaWNhdGlvbi92bmQuc3VuLnhtbC5kcmF3XFx0XFx0XFx0c3hkXFxuYXBwbGljYXRpb24vdm5kLnN1bi54bWwuZHJhdy50ZW1wbGF0ZVxcdFxcdHN0ZFxcbmFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmltcHJlc3NcXHRcXHRcXHRzeGlcXG5hcHBsaWNhdGlvbi92bmQuc3VuLnhtbC5pbXByZXNzLnRlbXBsYXRlXFx0c3RpXFxuYXBwbGljYXRpb24vdm5kLnN1bi54bWwubWF0aFxcdFxcdFxcdHN4bVxcbmFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLndyaXRlclxcdFxcdFxcdHN4d1xcbmFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLndyaXRlci5nbG9iYWxcXHRcXHRzeGdcXG5hcHBsaWNhdGlvbi92bmQuc3VuLnhtbC53cml0ZXIudGVtcGxhdGVcXHRcXHRzdHdcXG5hcHBsaWNhdGlvbi92bmQuc3VzLWNhbGVuZGFyXFx0XFx0XFx0c3VzIHN1c3BcXG5hcHBsaWNhdGlvbi92bmQuc3ZkXFx0XFx0XFx0XFx0c3ZkXFxuYXBwbGljYXRpb24vdm5kLnN5bWJpYW4uaW5zdGFsbFxcdFxcdFxcdHNpcyBzaXN4XFxuYXBwbGljYXRpb24vdm5kLnN5bmNtbCt4bWxcXHRcXHRcXHR4c21cXG5hcHBsaWNhdGlvbi92bmQuc3luY21sLmRtK3dieG1sXFx0XFx0XFx0YmRtXFxuYXBwbGljYXRpb24vdm5kLnN5bmNtbC5kbSt4bWxcXHRcXHRcXHR4ZG1cXG5hcHBsaWNhdGlvbi92bmQudGFvLmludGVudC1tb2R1bGUtYXJjaGl2ZVxcdHRhb1xcbmFwcGxpY2F0aW9uL3ZuZC50Y3BkdW1wLnBjYXBcXHRcXHRcXHRwY2FwIGNhcCBkbXBcXG5hcHBsaWNhdGlvbi92bmQudG1vYmlsZS1saXZldHZcXHRcXHRcXHR0bW9cXG5hcHBsaWNhdGlvbi92bmQudHJpZC50cHRcXHRcXHRcXHR0cHRcXG5hcHBsaWNhdGlvbi92bmQudHJpc2NhcGUubXhzXFx0XFx0XFx0bXhzXFxuYXBwbGljYXRpb24vdm5kLnRydWVhcHBcXHRcXHRcXHRcXHR0cmFcXG5hcHBsaWNhdGlvbi92bmQudWZkbFxcdFxcdFxcdFxcdHVmZCB1ZmRsXFxuYXBwbGljYXRpb24vdm5kLnVpcS50aGVtZVxcdFxcdFxcdHV0elxcbmFwcGxpY2F0aW9uL3ZuZC51bWFqaW5cXHRcXHRcXHRcXHR1bWpcXG5hcHBsaWNhdGlvbi92bmQudW5pdHlcXHRcXHRcXHRcXHR1bml0eXdlYlxcbmFwcGxpY2F0aW9uL3ZuZC51b21sK3htbFxcdFxcdFxcdHVvbWxcXG5hcHBsaWNhdGlvbi92bmQudmN4XFx0XFx0XFx0XFx0dmN4XFxuYXBwbGljYXRpb24vdm5kLnZpc2lvXFx0XFx0XFx0XFx0dnNkIHZzdCB2c3MgdnN3XFxuYXBwbGljYXRpb24vdm5kLnZpc2lvbmFyeVxcdFxcdFxcdHZpc1xcbmFwcGxpY2F0aW9uL3ZuZC52c2ZcXHRcXHRcXHRcXHR2c2ZcXG5hcHBsaWNhdGlvbi92bmQud2FwLndieG1sXFx0XFx0XFx0d2J4bWxcXG5hcHBsaWNhdGlvbi92bmQud2FwLndtbGNcXHRcXHRcXHR3bWxjXFxuYXBwbGljYXRpb24vdm5kLndhcC53bWxzY3JpcHRjXFx0XFx0XFx0d21sc2NcXG5hcHBsaWNhdGlvbi92bmQud2VidHVyYm9cXHRcXHRcXHR3dGJcXG5hcHBsaWNhdGlvbi92bmQud29sZnJhbS5wbGF5ZXJcXHRcXHRcXHRuYnBcXG5hcHBsaWNhdGlvbi92bmQud29yZHBlcmZlY3RcXHRcXHRcXHR3cGRcXG5hcHBsaWNhdGlvbi92bmQud3FkXFx0XFx0XFx0XFx0d3FkXFxuYXBwbGljYXRpb24vdm5kLnd0LnN0ZlxcdFxcdFxcdFxcdHN0ZlxcbmFwcGxpY2F0aW9uL3ZuZC54YXJhXFx0XFx0XFx0XFx0eGFyXFxuYXBwbGljYXRpb24vdm5kLnhmZGxcXHRcXHRcXHRcXHR4ZmRsXFxuYXBwbGljYXRpb24vdm5kLnlhbWFoYS5odi1kaWNcXHRcXHRcXHRodmRcXG5hcHBsaWNhdGlvbi92bmQueWFtYWhhLmh2LXNjcmlwdFxcdFxcdGh2c1xcbmFwcGxpY2F0aW9uL3ZuZC55YW1haGEuaHYtdm9pY2VcXHRcXHRcXHRodnBcXG5hcHBsaWNhdGlvbi92bmQueWFtYWhhLm9wZW5zY29yZWZvcm1hdFxcdFxcdFxcdG9zZlxcbmFwcGxpY2F0aW9uL3ZuZC55YW1haGEub3BlbnNjb3JlZm9ybWF0Lm9zZnB2Zyt4bWxcXHRvc2ZwdmdcXG5hcHBsaWNhdGlvbi92bmQueWFtYWhhLnNtYWYtYXVkaW9cXHRcXHRzYWZcXG5hcHBsaWNhdGlvbi92bmQueWFtYWhhLnNtYWYtcGhyYXNlXFx0XFx0c3BmXFxuYXBwbGljYXRpb24vdm5kLnllbGxvd3JpdmVyLWN1c3RvbS1tZW51XFx0XFx0Y21wXFxuYXBwbGljYXRpb24vdm5kLnp1bFxcdFxcdFxcdFxcdHppciB6aXJ6XFxuYXBwbGljYXRpb24vdm5kLnp6YXp6LmRlY2sreG1sXFx0XFx0XFx0emF6XFxuYXBwbGljYXRpb24vdm9pY2V4bWwreG1sXFx0XFx0XFx0dnhtbFxcbmFwcGxpY2F0aW9uL3dhc21cXHRcXHRcXHRcXHR3YXNtXFxuYXBwbGljYXRpb24vd2lkZ2V0XFx0XFx0XFx0XFx0d2d0XFxuYXBwbGljYXRpb24vd2luaGxwXFx0XFx0XFx0XFx0aGxwXFxuYXBwbGljYXRpb24vd3NkbCt4bWxcXHRcXHRcXHRcXHR3c2RsXFxuYXBwbGljYXRpb24vd3Nwb2xpY3kreG1sXFx0XFx0XFx0d3Nwb2xpY3lcXG5hcHBsaWNhdGlvbi94LTd6LWNvbXByZXNzZWRcXHRcXHRcXHQ3elxcbmFwcGxpY2F0aW9uL3gtYWJpd29yZFxcdFxcdFxcdFxcdGFid1xcbmFwcGxpY2F0aW9uL3gtYWNlLWNvbXByZXNzZWRcXHRcXHRcXHRhY2VcXG5hcHBsaWNhdGlvbi94LWFwcGxlLWRpc2tpbWFnZVxcdFxcdFxcdGRtZ1xcbmFwcGxpY2F0aW9uL3gtYXV0aG9yd2FyZS1iaW5cXHRcXHRcXHRhYWIgeDMyIHUzMiB2b3hcXG5hcHBsaWNhdGlvbi94LWF1dGhvcndhcmUtbWFwXFx0XFx0XFx0YWFtXFxuYXBwbGljYXRpb24veC1hdXRob3J3YXJlLXNlZ1xcdFxcdFxcdGFhc1xcbmFwcGxpY2F0aW9uL3gtYmNwaW9cXHRcXHRcXHRcXHRiY3Bpb1xcbmFwcGxpY2F0aW9uL3gtYml0dG9ycmVudFxcdFxcdFxcdHRvcnJlbnRcXG5hcHBsaWNhdGlvbi94LWJsb3JiXFx0XFx0XFx0XFx0YmxiIGJsb3JiXFxuYXBwbGljYXRpb24veC1iemlwXFx0XFx0XFx0XFx0YnpcXG5hcHBsaWNhdGlvbi94LWJ6aXAyXFx0XFx0XFx0XFx0YnoyIGJvelxcbmFwcGxpY2F0aW9uL3gtY2JyXFx0XFx0XFx0XFx0Y2JyIGNiYSBjYnQgY2J6IGNiN1xcbmFwcGxpY2F0aW9uL3gtY2RsaW5rXFx0XFx0XFx0XFx0dmNkXFxuYXBwbGljYXRpb24veC1jZnMtY29tcHJlc3NlZFxcdFxcdFxcdGNmc1xcbmFwcGxpY2F0aW9uL3gtY2hhdFxcdFxcdFxcdFxcdGNoYXRcXG5hcHBsaWNhdGlvbi94LWNoZXNzLXBnblxcdFxcdFxcdFxcdHBnblxcbmFwcGxpY2F0aW9uL3gtY29uZmVyZW5jZVxcdFxcdFxcdG5zY1xcbmFwcGxpY2F0aW9uL3gtY3Bpb1xcdFxcdFxcdFxcdGNwaW9cXG5hcHBsaWNhdGlvbi94LWNzaFxcdFxcdFxcdFxcdGNzaFxcbmFwcGxpY2F0aW9uL3gtZGViaWFuLXBhY2thZ2VcXHRcXHRcXHRkZWIgdWRlYlxcbmFwcGxpY2F0aW9uL3gtZGdjLWNvbXByZXNzZWRcXHRcXHRcXHRkZ2NcXG5hcHBsaWNhdGlvbi94LWRpcmVjdG9yXFx0XFx0XFx0ZGlyIGRjciBkeHIgY3N0IGNjdCBjeHQgdzNkIGZnZCBzd2FcXG5hcHBsaWNhdGlvbi94LWRvb21cXHRcXHRcXHRcXHR3YWRcXG5hcHBsaWNhdGlvbi94LWR0Ym5jeCt4bWxcXHRcXHRcXHRuY3hcXG5hcHBsaWNhdGlvbi94LWR0Ym9vayt4bWxcXHRcXHRcXHRkdGJcXG5hcHBsaWNhdGlvbi94LWR0YnJlc291cmNlK3htbFxcdFxcdFxcdHJlc1xcbmFwcGxpY2F0aW9uL3gtZHZpXFx0XFx0XFx0XFx0ZHZpXFxuYXBwbGljYXRpb24veC1lbnZveVxcdFxcdFxcdFxcdGV2eVxcbmFwcGxpY2F0aW9uL3gtZXZhXFx0XFx0XFx0XFx0ZXZhXFxuYXBwbGljYXRpb24veC1mb250LWJkZlxcdFxcdFxcdFxcdGJkZlxcbmFwcGxpY2F0aW9uL3gtZm9udC1naG9zdHNjcmlwdFxcdFxcdFxcdGdzZlxcbmFwcGxpY2F0aW9uL3gtZm9udC1saW51eC1wc2ZcXHRcXHRcXHRwc2ZcXG5hcHBsaWNhdGlvbi94LWZvbnQtcGNmXFx0XFx0XFx0XFx0cGNmXFxuYXBwbGljYXRpb24veC1mb250LXNuZlxcdFxcdFxcdFxcdHNuZlxcbmFwcGxpY2F0aW9uL3gtZm9udC10eXBlMVxcdFxcdFxcdHBmYSBwZmIgcGZtIGFmbVxcbmFwcGxpY2F0aW9uL3gtZnJlZWFyY1xcdFxcdFxcdFxcdGFyY1xcbmFwcGxpY2F0aW9uL3gtZnV0dXJlc3BsYXNoXFx0XFx0XFx0c3BsXFxuYXBwbGljYXRpb24veC1nY2EtY29tcHJlc3NlZFxcdFxcdFxcdGdjYVxcbmFwcGxpY2F0aW9uL3gtZ2x1bHhcXHRcXHRcXHRcXHR1bHhcXG5hcHBsaWNhdGlvbi94LWdudW1lcmljXFx0XFx0XFx0XFx0Z251bWVyaWNcXG5hcHBsaWNhdGlvbi94LWdyYW1wcy14bWxcXHRcXHRcXHRncmFtcHNcXG5hcHBsaWNhdGlvbi94LWd0YXJcXHRcXHRcXHRcXHRndGFyXFxuYXBwbGljYXRpb24veC1oZGZcXHRcXHRcXHRcXHRoZGZcXG5hcHBsaWNhdGlvbi94LWluc3RhbGwtaW5zdHJ1Y3Rpb25zXFx0XFx0aW5zdGFsbFxcbmFwcGxpY2F0aW9uL3gtaXNvOTY2MC1pbWFnZVxcdFxcdFxcdGlzb1xcbmFwcGxpY2F0aW9uL3gtamF2YS1qbmxwLWZpbGVcXHRcXHRcXHRqbmxwXFxuYXBwbGljYXRpb24veC1sYXRleFxcdFxcdFxcdFxcdGxhdGV4XFxuYXBwbGljYXRpb24veC1semgtY29tcHJlc3NlZFxcdFxcdFxcdGx6aCBsaGFcXG5hcHBsaWNhdGlvbi94LW1pZVxcdFxcdFxcdFxcdG1pZVxcbmFwcGxpY2F0aW9uL3gtbW9iaXBvY2tldC1lYm9va1xcdFxcdFxcdHByYyBtb2JpXFxuYXBwbGljYXRpb24veC1tcy1hcHBsaWNhdGlvblxcdFxcdFxcdGFwcGxpY2F0aW9uXFxuYXBwbGljYXRpb24veC1tcy1zaG9ydGN1dFxcdFxcdFxcdGxua1xcbmFwcGxpY2F0aW9uL3gtbXMtd21kXFx0XFx0XFx0XFx0d21kXFxuYXBwbGljYXRpb24veC1tcy13bXpcXHRcXHRcXHRcXHR3bXpcXG5hcHBsaWNhdGlvbi94LW1zLXhiYXBcXHRcXHRcXHRcXHR4YmFwXFxuYXBwbGljYXRpb24veC1tc2FjY2Vzc1xcdFxcdFxcdFxcdG1kYlxcbmFwcGxpY2F0aW9uL3gtbXNiaW5kZXJcXHRcXHRcXHRcXHRvYmRcXG5hcHBsaWNhdGlvbi94LW1zY2FyZGZpbGVcXHRcXHRcXHRjcmRcXG5hcHBsaWNhdGlvbi94LW1zY2xpcFxcdFxcdFxcdFxcdGNscFxcbmFwcGxpY2F0aW9uL3gtbXNkb3dubG9hZFxcdFxcdFxcdGV4ZSBkbGwgY29tIGJhdCBtc2lcXG5hcHBsaWNhdGlvbi94LW1zbWVkaWF2aWV3XFx0XFx0XFx0bXZiIG0xMyBtMTRcXG5hcHBsaWNhdGlvbi94LW1zbWV0YWZpbGVcXHRcXHRcXHR3bWYgd216IGVtZiBlbXpcXG5hcHBsaWNhdGlvbi94LW1zbW9uZXlcXHRcXHRcXHRcXHRtbnlcXG5hcHBsaWNhdGlvbi94LW1zcHVibGlzaGVyXFx0XFx0XFx0cHViXFxuYXBwbGljYXRpb24veC1tc3NjaGVkdWxlXFx0XFx0XFx0c2NkXFxuYXBwbGljYXRpb24veC1tc3Rlcm1pbmFsXFx0XFx0XFx0dHJtXFxuYXBwbGljYXRpb24veC1tc3dyaXRlXFx0XFx0XFx0XFx0d3JpXFxuYXBwbGljYXRpb24veC1uZXRjZGZcXHRcXHRcXHRcXHRuYyBjZGZcXG5hcHBsaWNhdGlvbi94LW56YlxcdFxcdFxcdFxcdG56YlxcbmFwcGxpY2F0aW9uL3gtcGtjczEyXFx0XFx0XFx0XFx0cDEyIHBmeFxcbmFwcGxpY2F0aW9uL3gtcGtjczctY2VydGlmaWNhdGVzXFx0XFx0cDdiIHNwY1xcbmFwcGxpY2F0aW9uL3gtcGtjczctY2VydHJlcXJlc3BcXHRcXHRcXHRwN3JcXG5hcHBsaWNhdGlvbi94LXJhci1jb21wcmVzc2VkXFx0XFx0XFx0cmFyXFxuYXBwbGljYXRpb24veC1yZXNlYXJjaC1pbmZvLXN5c3RlbXNcXHRcXHRyaXNcXG5hcHBsaWNhdGlvbi94LXNoXFx0XFx0XFx0XFx0c2hcXG5hcHBsaWNhdGlvbi94LXNoYXJcXHRcXHRcXHRcXHRzaGFyXFxuYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2hcXHRcXHRcXHRzd2ZcXG5hcHBsaWNhdGlvbi94LXNpbHZlcmxpZ2h0LWFwcFxcdFxcdFxcdHhhcFxcbmFwcGxpY2F0aW9uL3gtc3FsXFx0XFx0XFx0XFx0c3FsXFxuYXBwbGljYXRpb24veC1zdHVmZml0XFx0XFx0XFx0XFx0c2l0XFxuYXBwbGljYXRpb24veC1zdHVmZml0eFxcdFxcdFxcdFxcdHNpdHhcXG5hcHBsaWNhdGlvbi94LXN1YnJpcFxcdFxcdFxcdFxcdHNydFxcbmFwcGxpY2F0aW9uL3gtc3Y0Y3Bpb1xcdFxcdFxcdFxcdHN2NGNwaW9cXG5hcHBsaWNhdGlvbi94LXN2NGNyY1xcdFxcdFxcdFxcdHN2NGNyY1xcbmFwcGxpY2F0aW9uL3gtdDN2bS1pbWFnZVxcdFxcdFxcdHQzXFxuYXBwbGljYXRpb24veC10YWRzXFx0XFx0XFx0XFx0Z2FtXFxuYXBwbGljYXRpb24veC10YXJcXHRcXHRcXHRcXHR0YXJcXG5hcHBsaWNhdGlvbi94LXRjbFxcdFxcdFxcdFxcdHRjbFxcbmFwcGxpY2F0aW9uL3gtdGV4XFx0XFx0XFx0XFx0dGV4XFxuYXBwbGljYXRpb24veC10ZXgtdGZtXFx0XFx0XFx0XFx0dGZtXFxuYXBwbGljYXRpb24veC10ZXhpbmZvXFx0XFx0XFx0XFx0dGV4aW5mbyB0ZXhpXFxuYXBwbGljYXRpb24veC10Z2lmXFx0XFx0XFx0XFx0b2JqXFxuYXBwbGljYXRpb24veC11c3RhclxcdFxcdFxcdFxcdHVzdGFyXFxuYXBwbGljYXRpb24veC13YWlzLXNvdXJjZVxcdFxcdFxcdHNyY1xcbmFwcGxpY2F0aW9uL3gteDUwOS1jYS1jZXJ0XFx0XFx0XFx0ZGVyIGNydFxcbmFwcGxpY2F0aW9uL3gteGZpZ1xcdFxcdFxcdFxcdGZpZ1xcbmFwcGxpY2F0aW9uL3gteGxpZmYreG1sXFx0XFx0XFx0XFx0eGxmXFxuYXBwbGljYXRpb24veC14cGluc3RhbGxcXHRcXHRcXHRcXHR4cGlcXG5hcHBsaWNhdGlvbi94LXh6XFx0XFx0XFx0XFx0eHpcXG5hcHBsaWNhdGlvbi94LXptYWNoaW5lXFx0XFx0XFx0XFx0ejEgejIgejMgejQgejUgejYgejcgejhcXG5hcHBsaWNhdGlvbi94YW1sK3htbFxcdFxcdFxcdFxcdHhhbWxcXG5hcHBsaWNhdGlvbi94Y2FwLWRpZmYreG1sXFx0XFx0XFx0eGRmXFxuYXBwbGljYXRpb24veGVuYyt4bWxcXHRcXHRcXHRcXHR4ZW5jXFxuYXBwbGljYXRpb24veGh0bWwreG1sXFx0XFx0XFx0XFx0eGh0bWwgeGh0XFxuYXBwbGljYXRpb24veG1sXFx0XFx0XFx0XFx0XFx0eG1sIHhzbFxcbmFwcGxpY2F0aW9uL3htbC1kdGRcXHRcXHRcXHRcXHRkdGRcXG5hcHBsaWNhdGlvbi94b3AreG1sXFx0XFx0XFx0XFx0eG9wXFxuYXBwbGljYXRpb24veHByb2MreG1sXFx0XFx0XFx0XFx0eHBsXFxuYXBwbGljYXRpb24veHNsdCt4bWxcXHRcXHRcXHRcXHR4c2x0XFxuYXBwbGljYXRpb24veHNwZit4bWxcXHRcXHRcXHRcXHR4c3BmXFxuYXBwbGljYXRpb24veHYreG1sXFx0XFx0XFx0XFx0bXhtbCB4aHZtbCB4dm1sIHh2bVxcbmFwcGxpY2F0aW9uL3lhbmdcXHRcXHRcXHRcXHR5YW5nXFxuYXBwbGljYXRpb24veWluK3htbFxcdFxcdFxcdFxcdHlpblxcbmFwcGxpY2F0aW9uL3ppcFxcdFxcdFxcdFxcdFxcdHppcFxcbmF1ZGlvL2FkcGNtXFx0XFx0XFx0XFx0XFx0YWRwXFxuYXVkaW8vYmFzaWNcXHRcXHRcXHRcXHRcXHRhdSBzbmRcXG5hdWRpby9taWRpXFx0XFx0XFx0XFx0XFx0bWlkIG1pZGkga2FyIHJtaVxcbmF1ZGlvL21wNFxcdFxcdFxcdFxcdFxcdG00YSBtcDRhXFxuYXVkaW8vbXBlZ1xcdFxcdFxcdFxcdFxcdG1wZ2EgbXAyIG1wMmEgbXAzIG0yYSBtM2FcXG5hdWRpby9vZ2dcXHRcXHRcXHRcXHRcXHRvZ2Egb2dnIHNweFxcbmF1ZGlvL3MzbVxcdFxcdFxcdFxcdFxcdHMzbVxcbmF1ZGlvL3NpbGtcXHRcXHRcXHRcXHRcXHRzaWxcXG5hdWRpby92bmQuZGVjZS5hdWRpb1xcdFxcdFxcdFxcdHV2YSB1dnZhXFxuYXVkaW8vdm5kLmRpZ2l0YWwtd2luZHNcXHRcXHRcXHRcXHRlb2xcXG5hdWRpby92bmQuZHJhXFx0XFx0XFx0XFx0XFx0ZHJhXFxuYXVkaW8vdm5kLmR0c1xcdFxcdFxcdFxcdFxcdGR0c1xcbmF1ZGlvL3ZuZC5kdHMuaGRcXHRcXHRcXHRcXHRkdHNoZFxcbmF1ZGlvL3ZuZC5sdWNlbnQudm9pY2VcXHRcXHRcXHRcXHRsdnBcXG5hdWRpby92bmQubXMtcGxheXJlYWR5Lm1lZGlhLnB5YVxcdFxcdHB5YVxcbmF1ZGlvL3ZuZC5udWVyYS5lY2VscDQ4MDBcXHRcXHRcXHRlY2VscDQ4MDBcXG5hdWRpby92bmQubnVlcmEuZWNlbHA3NDcwXFx0XFx0XFx0ZWNlbHA3NDcwXFxuYXVkaW8vdm5kLm51ZXJhLmVjZWxwOTYwMFxcdFxcdFxcdGVjZWxwOTYwMFxcbmF1ZGlvL3ZuZC5yaXBcXHRcXHRcXHRcXHRcXHRyaXBcXG5hdWRpby93ZWJtXFx0XFx0XFx0XFx0XFx0d2ViYVxcbmF1ZGlvL3gtYWFjXFx0XFx0XFx0XFx0XFx0YWFjXFxuYXVkaW8veC1haWZmXFx0XFx0XFx0XFx0XFx0YWlmIGFpZmYgYWlmY1xcbmF1ZGlvL3gtY2FmXFx0XFx0XFx0XFx0XFx0Y2FmXFxuYXVkaW8veC1mbGFjXFx0XFx0XFx0XFx0XFx0ZmxhY1xcbmF1ZGlvL3gtbWF0cm9za2FcXHRcXHRcXHRcXHRta2FcXG5hdWRpby94LW1wZWd1cmxcXHRcXHRcXHRcXHRcXHRtM3VcXG5hdWRpby94LW1zLXdheFxcdFxcdFxcdFxcdFxcdHdheFxcbmF1ZGlvL3gtbXMtd21hXFx0XFx0XFx0XFx0XFx0d21hXFxuYXVkaW8veC1wbi1yZWFsYXVkaW9cXHRcXHRcXHRcXHRyYW0gcmFcXG5hdWRpby94LXBuLXJlYWxhdWRpby1wbHVnaW5cXHRcXHRcXHRybXBcXG5hdWRpby94LXdhdlxcdFxcdFxcdFxcdFxcdHdhdlxcbmF1ZGlvL3htXFx0XFx0XFx0XFx0XFx0eG1cXG5jaGVtaWNhbC94LWNkeFxcdFxcdFxcdFxcdFxcdGNkeFxcbmNoZW1pY2FsL3gtY2lmXFx0XFx0XFx0XFx0XFx0Y2lmXFxuY2hlbWljYWwveC1jbWRmXFx0XFx0XFx0XFx0XFx0Y21kZlxcbmNoZW1pY2FsL3gtY21sXFx0XFx0XFx0XFx0XFx0Y21sXFxuY2hlbWljYWwveC1jc21sXFx0XFx0XFx0XFx0XFx0Y3NtbFxcbmNoZW1pY2FsL3gteHl6XFx0XFx0XFx0XFx0XFx0eHl6XFxuZm9udC9jb2xsZWN0aW9uXFx0XFx0XFx0XFx0XFx0dHRjXFxuZm9udC9vdGZcXHRcXHRcXHRcXHRcXHRvdGZcXG5mb250L3R0ZlxcdFxcdFxcdFxcdFxcdHR0ZlxcbmZvbnQvd29mZlxcdFxcdFxcdFxcdFxcdHdvZmZcXG5mb250L3dvZmYyXFx0XFx0XFx0XFx0XFx0d29mZjJcXG5pbWFnZS9ibXBcXHRcXHRcXHRcXHRcXHRibXBcXG5pbWFnZS9jZ21cXHRcXHRcXHRcXHRcXHRjZ21cXG5pbWFnZS9nM2ZheFxcdFxcdFxcdFxcdFxcdGczXFxuaW1hZ2UvZ2lmXFx0XFx0XFx0XFx0XFx0Z2lmXFxuaW1hZ2UvaWVmXFx0XFx0XFx0XFx0XFx0aWVmXFxuaW1hZ2UvanBlZ1xcdFxcdFxcdFxcdFxcdGpwZWcganBnIGpwZVxcbmltYWdlL2t0eFxcdFxcdFxcdFxcdFxcdGt0eFxcbmltYWdlL3BuZ1xcdFxcdFxcdFxcdFxcdHBuZ1xcbmltYWdlL3Bycy5idGlmXFx0XFx0XFx0XFx0XFx0YnRpZlxcbmltYWdlL3NnaVxcdFxcdFxcdFxcdFxcdHNnaVxcbmltYWdlL3N2Zyt4bWxcXHRcXHRcXHRcXHRcXHRzdmcgc3ZnelxcbmltYWdlL3RpZmZcXHRcXHRcXHRcXHRcXHR0aWZmIHRpZlxcbmltYWdlL3ZuZC5hZG9iZS5waG90b3Nob3BcXHRcXHRcXHRwc2RcXG5pbWFnZS92bmQuZGVjZS5ncmFwaGljXFx0XFx0XFx0XFx0dXZpIHV2dmkgdXZnIHV2dmdcXG5pbWFnZS92bmQuZGp2dVxcdFxcdFxcdFxcdFxcdGRqdnUgZGp2XFxuaW1hZ2Uvdm5kLmR2Yi5zdWJ0aXRsZVxcdFxcdFxcdFxcdHN1YlxcbmltYWdlL3ZuZC5kd2dcXHRcXHRcXHRcXHRcXHRkd2dcXG5pbWFnZS92bmQuZHhmXFx0XFx0XFx0XFx0XFx0ZHhmXFxuaW1hZ2Uvdm5kLmZhc3RiaWRzaGVldFxcdFxcdFxcdFxcdGZic1xcbmltYWdlL3ZuZC5mcHhcXHRcXHRcXHRcXHRcXHRmcHhcXG5pbWFnZS92bmQuZnN0XFx0XFx0XFx0XFx0XFx0ZnN0XFxuaW1hZ2Uvdm5kLmZ1aml4ZXJveC5lZG1pY3MtbW1yXFx0XFx0XFx0bW1yXFxuaW1hZ2Uvdm5kLmZ1aml4ZXJveC5lZG1pY3MtcmxjXFx0XFx0XFx0cmxjXFxuaW1hZ2Uvdm5kLm1zLW1vZGlcXHRcXHRcXHRcXHRtZGlcXG5pbWFnZS92bmQubXMtcGhvdG9cXHRcXHRcXHRcXHR3ZHBcXG5pbWFnZS92bmQubmV0LWZweFxcdFxcdFxcdFxcdG5weFxcbmltYWdlL3ZuZC53YXAud2JtcFxcdFxcdFxcdFxcdHdibXBcXG5pbWFnZS92bmQueGlmZlxcdFxcdFxcdFxcdFxcdHhpZlxcbmltYWdlL3dlYnBcXHRcXHRcXHRcXHRcXHR3ZWJwXFxuaW1hZ2UveC0zZHNcXHRcXHRcXHRcXHRcXHQzZHNcXG5pbWFnZS94LWNtdS1yYXN0ZXJcXHRcXHRcXHRcXHRyYXNcXG5pbWFnZS94LWNteFxcdFxcdFxcdFxcdFxcdGNteFxcbmltYWdlL3gtZnJlZWhhbmRcXHRcXHRcXHRcXHRmaCBmaGMgZmg0IGZoNSBmaDdcXG5pbWFnZS94LWljb25cXHRcXHRcXHRcXHRcXHRpY29cXG5pbWFnZS94LW1yc2lkLWltYWdlXFx0XFx0XFx0XFx0c2lkXFxuaW1hZ2UveC1wY3hcXHRcXHRcXHRcXHRcXHRwY3hcXG5pbWFnZS94LXBpY3RcXHRcXHRcXHRcXHRcXHRwaWMgcGN0XFxuaW1hZ2UveC1wb3J0YWJsZS1hbnltYXBcXHRcXHRcXHRcXHRwbm1cXG5pbWFnZS94LXBvcnRhYmxlLWJpdG1hcFxcdFxcdFxcdFxcdHBibVxcbmltYWdlL3gtcG9ydGFibGUtZ3JheW1hcFxcdFxcdFxcdHBnbVxcbmltYWdlL3gtcG9ydGFibGUtcGl4bWFwXFx0XFx0XFx0XFx0cHBtXFxuaW1hZ2UveC1yZ2JcXHRcXHRcXHRcXHRcXHRyZ2JcXG5pbWFnZS94LXRnYVxcdFxcdFxcdFxcdFxcdHRnYVxcbmltYWdlL3gteGJpdG1hcFxcdFxcdFxcdFxcdFxcdHhibVxcbmltYWdlL3gteHBpeG1hcFxcdFxcdFxcdFxcdFxcdHhwbVxcbmltYWdlL3gteHdpbmRvd2R1bXBcXHRcXHRcXHRcXHR4d2RcXG5tZXNzYWdlL3JmYzgyMlxcdFxcdFxcdFxcdFxcdGVtbCBtaW1lXFxubW9kZWwvaWdlc1xcdFxcdFxcdFxcdFxcdGlncyBpZ2VzXFxubW9kZWwvbWVzaFxcdFxcdFxcdFxcdFxcdG1zaCBtZXNoIHNpbG9cXG5tb2RlbC92bmQuY29sbGFkYSt4bWxcXHRcXHRcXHRcXHRkYWVcXG5tb2RlbC92bmQuZHdmXFx0XFx0XFx0XFx0XFx0ZHdmXFxubW9kZWwvdm5kLmdkbFxcdFxcdFxcdFxcdFxcdGdkbFxcbm1vZGVsL3ZuZC5ndHdcXHRcXHRcXHRcXHRcXHRndHdcXG5tb2RlbC92bmQubXRzXFx0XFx0XFx0XFx0XFx0bXRzXFxubW9kZWwvdm5kLnZ0dVxcdFxcdFxcdFxcdFxcdHZ0dVxcbm1vZGVsL3ZybWxcXHRcXHRcXHRcXHRcXHR3cmwgdnJtbFxcbm1vZGVsL3gzZCtiaW5hcnlcXHRcXHRcXHRcXHR4M2RiIHgzZGJ6XFxubW9kZWwveDNkK3ZybWxcXHRcXHRcXHRcXHRcXHR4M2R2IHgzZHZ6XFxubW9kZWwveDNkK3htbFxcdFxcdFxcdFxcdFxcdHgzZCB4M2R6XFxudGV4dC9jYWNoZS1tYW5pZmVzdFxcdFxcdFxcdFxcdGFwcGNhY2hlXFxudGV4dC9jYWxlbmRhclxcdFxcdFxcdFxcdFxcdGljcyBpZmJcXG50ZXh0L2Nzc1xcdFxcdFxcdFxcdFxcdGNzc1xcbnRleHQvY3N2XFx0XFx0XFx0XFx0XFx0Y3N2XFxudGV4dC9odG1sXFx0XFx0XFx0XFx0XFx0aHRtbCBodG1cXG50ZXh0L24zXFx0XFx0XFx0XFx0XFx0XFx0bjNcXG50ZXh0L3BsYWluXFx0XFx0XFx0XFx0XFx0dHh0IHRleHQgY29uZiBkZWYgbGlzdCBsb2cgaW5cXG50ZXh0L3Bycy5saW5lcy50YWdcXHRcXHRcXHRcXHRkc2NcXG50ZXh0L3JpY2h0ZXh0XFx0XFx0XFx0XFx0XFx0cnR4XFxudGV4dC9zZ21sXFx0XFx0XFx0XFx0XFx0c2dtbCBzZ21cXG50ZXh0L3RhYi1zZXBhcmF0ZWQtdmFsdWVzXFx0XFx0XFx0dHN2XFxudGV4dC90cm9mZlxcdFxcdFxcdFxcdFxcdHQgdHIgcm9mZiBtYW4gbWUgbXNcXG50ZXh0L3R1cnRsZVxcdFxcdFxcdFxcdFxcdHR0bFxcbnRleHQvdXJpLWxpc3RcXHRcXHRcXHRcXHRcXHR1cmkgdXJpcyB1cmxzXFxudGV4dC92Y2FyZFxcdFxcdFxcdFxcdFxcdHZjYXJkXFxudGV4dC92bmQuY3VybFxcdFxcdFxcdFxcdFxcdGN1cmxcXG50ZXh0L3ZuZC5jdXJsLmRjdXJsXFx0XFx0XFx0XFx0ZGN1cmxcXG50ZXh0L3ZuZC5jdXJsLm1jdXJsXFx0XFx0XFx0XFx0bWN1cmxcXG50ZXh0L3ZuZC5jdXJsLnNjdXJsXFx0XFx0XFx0XFx0c2N1cmxcXG50ZXh0L3ZuZC5kdmIuc3VidGl0bGVcXHRcXHRcXHRcXHRzdWJcXG50ZXh0L3ZuZC5mbHlcXHRcXHRcXHRcXHRcXHRmbHlcXG50ZXh0L3ZuZC5mbWkuZmxleHN0b3JcXHRcXHRcXHRcXHRmbHhcXG50ZXh0L3ZuZC5ncmFwaHZpelxcdFxcdFxcdFxcdGd2XFxudGV4dC92bmQuaW4zZC4zZG1sXFx0XFx0XFx0XFx0M2RtbFxcbnRleHQvdm5kLmluM2Quc3BvdFxcdFxcdFxcdFxcdHNwb3RcXG50ZXh0L3ZuZC5zdW4uajJtZS5hcHAtZGVzY3JpcHRvclxcdFxcdGphZFxcbnRleHQvdm5kLndhcC53bWxcXHRcXHRcXHRcXHR3bWxcXG50ZXh0L3ZuZC53YXAud21sc2NyaXB0XFx0XFx0XFx0XFx0d21sc1xcbnRleHQveC1hc21cXHRcXHRcXHRcXHRcXHRzIGFzbVxcbnRleHQveC1jXFx0XFx0XFx0XFx0XFx0YyBjYyBjeHggY3BwIGggaGggZGljXFxudGV4dC94LWZvcnRyYW5cXHRcXHRcXHRcXHRcXHRmIGZvciBmNzcgZjkwXFxudGV4dC94LWphdmEtc291cmNlXFx0XFx0XFx0XFx0amF2YVxcbnRleHQveC1uZm9cXHRcXHRcXHRcXHRcXHRuZm9cXG50ZXh0L3gtb3BtbFxcdFxcdFxcdFxcdFxcdG9wbWxcXG50ZXh0L3gtcGFzY2FsXFx0XFx0XFx0XFx0XFx0cCBwYXNcXG50ZXh0L3gtc2V0ZXh0XFx0XFx0XFx0XFx0XFx0ZXR4XFxudGV4dC94LXNmdlxcdFxcdFxcdFxcdFxcdHNmdlxcbnRleHQveC11dWVuY29kZVxcdFxcdFxcdFxcdFxcdHV1XFxudGV4dC94LXZjYWxlbmRhclxcdFxcdFxcdFxcdHZjc1xcbnRleHQveC12Y2FyZFxcdFxcdFxcdFxcdFxcdHZjZlxcbnZpZGVvLzNncHBcXHRcXHRcXHRcXHRcXHQzZ3BcXG52aWRlby8zZ3BwMlxcdFxcdFxcdFxcdFxcdDNnMlxcbnZpZGVvL2gyNjFcXHRcXHRcXHRcXHRcXHRoMjYxXFxudmlkZW8vaDI2M1xcdFxcdFxcdFxcdFxcdGgyNjNcXG52aWRlby9oMjY0XFx0XFx0XFx0XFx0XFx0aDI2NFxcbnZpZGVvL2pwZWdcXHRcXHRcXHRcXHRcXHRqcGd2XFxudmlkZW8vanBtXFx0XFx0XFx0XFx0XFx0anBtIGpwZ21cXG52aWRlby9tajJcXHRcXHRcXHRcXHRcXHRtajIgbWpwMlxcbnZpZGVvL21wNFxcdFxcdFxcdFxcdFxcdG1wNCBtcDR2IG1wZzRcXG52aWRlby9tcGVnXFx0XFx0XFx0XFx0XFx0bXBlZyBtcGcgbXBlIG0xdiBtMnZcXG52aWRlby9vZ2dcXHRcXHRcXHRcXHRcXHRvZ3ZcXG52aWRlby9xdWlja3RpbWVcXHRcXHRcXHRcXHRcXHRxdCBtb3ZcXG52aWRlby92bmQuZGVjZS5oZFxcdFxcdFxcdFxcdHV2aCB1dnZoXFxudmlkZW8vdm5kLmRlY2UubW9iaWxlXFx0XFx0XFx0XFx0dXZtIHV2dm1cXG52aWRlby92bmQuZGVjZS5wZFxcdFxcdFxcdFxcdHV2cCB1dnZwXFxudmlkZW8vdm5kLmRlY2Uuc2RcXHRcXHRcXHRcXHR1dnMgdXZ2c1xcbnZpZGVvL3ZuZC5kZWNlLnZpZGVvXFx0XFx0XFx0XFx0dXZ2IHV2dnZcXG52aWRlby92bmQuZHZiLmZpbGVcXHRcXHRcXHRcXHRkdmJcXG52aWRlby92bmQuZnZ0XFx0XFx0XFx0XFx0XFx0ZnZ0XFxudmlkZW8vdm5kLm1wZWd1cmxcXHRcXHRcXHRcXHRteHUgbTR1XFxudmlkZW8vdm5kLm1zLXBsYXlyZWFkeS5tZWRpYS5weXZcXHRcXHRweXZcXG52aWRlby92bmQudXZ2dS5tcDRcXHRcXHRcXHRcXHR1dnUgdXZ2dVxcbnZpZGVvL3ZuZC52aXZvXFx0XFx0XFx0XFx0XFx0dml2XFxudmlkZW8vd2VibVxcdFxcdFxcdFxcdFxcdHdlYm1cXG52aWRlby94LWY0dlxcdFxcdFxcdFxcdFxcdGY0dlxcbnZpZGVvL3gtZmxpXFx0XFx0XFx0XFx0XFx0ZmxpXFxudmlkZW8veC1mbHZcXHRcXHRcXHRcXHRcXHRmbHZcXG52aWRlby94LW00dlxcdFxcdFxcdFxcdFxcdG00dlxcbnZpZGVvL3gtbWF0cm9za2FcXHRcXHRcXHRcXHRta3YgbWszZCBta3NcXG52aWRlby94LW1uZ1xcdFxcdFxcdFxcdFxcdG1uZ1xcbnZpZGVvL3gtbXMtYXNmXFx0XFx0XFx0XFx0XFx0YXNmIGFzeFxcbnZpZGVvL3gtbXMtdm9iXFx0XFx0XFx0XFx0XFx0dm9iXFxudmlkZW8veC1tcy13bVxcdFxcdFxcdFxcdFxcdHdtXFxudmlkZW8veC1tcy13bXZcXHRcXHRcXHRcXHRcXHR3bXZcXG52aWRlby94LW1zLXdteFxcdFxcdFxcdFxcdFxcdHdteFxcbnZpZGVvL3gtbXMtd3Z4XFx0XFx0XFx0XFx0XFx0d3Z4XFxudmlkZW8veC1tc3ZpZGVvXFx0XFx0XFx0XFx0XFx0YXZpXFxudmlkZW8veC1zZ2ktbW92aWVcXHRcXHRcXHRcXHRtb3ZpZVxcbnZpZGVvL3gtc212XFx0XFx0XFx0XFx0XFx0c212XFxueC1jb25mZXJlbmNlL3gtY29vbHRhbGtcXHRcXHRcXHRcXHRpY2VcXG5cIjtcblxuY29uc3QgbWFwID0gbmV3IE1hcCgpO1xuXG5taW1lX3Jhdy5zcGxpdCgnXFxuJykuZm9yRWFjaCgocm93KSA9PiB7XG5cdGNvbnN0IG1hdGNoID0gLyguKz8pXFx0KyguKykvLmV4ZWMocm93KTtcblx0aWYgKCFtYXRjaCkgcmV0dXJuO1xuXG5cdGNvbnN0IHR5cGUgPSBtYXRjaFsxXTtcblx0Y29uc3QgZXh0ZW5zaW9ucyA9IG1hdGNoWzJdLnNwbGl0KCcgJyk7XG5cblx0ZXh0ZW5zaW9ucy5mb3JFYWNoKGV4dCA9PiB7XG5cdFx0bWFwLnNldChleHQsIHR5cGUpO1xuXHR9KTtcbn0pO1xuXG5mdW5jdGlvbiBsb29rdXAoZmlsZSkge1xuXHRjb25zdCBtYXRjaCA9IC9cXC4oW15cXC5dKykkLy5leGVjKGZpbGUpO1xuXHRyZXR1cm4gbWF0Y2ggJiYgbWFwLmdldChtYXRjaFsxXSk7XG59XG5cbmZ1bmN0aW9uIG1pZGRsZXdhcmUob3B0c1xuXG5cbiA9IHt9KSB7XG5cdGNvbnN0IHsgc2Vzc2lvbiwgaWdub3JlIH0gPSBvcHRzO1xuXG5cdGxldCBlbWl0dGVkX2Jhc2VwYXRoID0gZmFsc2U7XG5cblx0cmV0dXJuIGNvbXBvc2VfaGFuZGxlcnMoaWdub3JlLCBbXG5cdFx0KHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdFx0XHRpZiAocmVxLmJhc2VVcmwgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsZXQgeyBvcmlnaW5hbFVybCB9ID0gcmVxO1xuXHRcdFx0XHRpZiAocmVxLnVybCA9PT0gJy8nICYmIG9yaWdpbmFsVXJsW29yaWdpbmFsVXJsLmxlbmd0aCAtIDFdICE9PSAnLycpIHtcblx0XHRcdFx0XHRvcmlnaW5hbFVybCArPSAnLyc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXEuYmFzZVVybCA9IG9yaWdpbmFsVXJsXG5cdFx0XHRcdFx0PyBvcmlnaW5hbFVybC5zbGljZSgwLCAtcmVxLnVybC5sZW5ndGgpXG5cdFx0XHRcdFx0OiAnJztcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFlbWl0dGVkX2Jhc2VwYXRoICYmIHByb2Nlc3Muc2VuZCkge1xuXHRcdFx0XHRwcm9jZXNzLnNlbmQoe1xuXHRcdFx0XHRcdF9fc2FwcGVyX186IHRydWUsXG5cdFx0XHRcdFx0ZXZlbnQ6ICdiYXNlcGF0aCcsXG5cdFx0XHRcdFx0YmFzZXBhdGg6IHJlcS5iYXNlVXJsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGVtaXR0ZWRfYmFzZXBhdGggPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocmVxLnBhdGggPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXEucGF0aCA9IHJlcS51cmwucmVwbGFjZSgvXFw/LiovLCAnJyk7XG5cdFx0XHR9XG5cblx0XHRcdG5leHQoKTtcblx0XHR9LFxuXG5cdFx0ZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYnVpbGRfZGlyLCAnc2VydmljZS13b3JrZXIuanMnKSkgJiYgc2VydmUoe1xuXHRcdFx0cGF0aG5hbWU6ICcvc2VydmljZS13b3JrZXIuanMnLFxuXHRcdFx0Y2FjaGVfY29udHJvbDogJ25vLWNhY2hlLCBuby1zdG9yZSwgbXVzdC1yZXZhbGlkYXRlJ1xuXHRcdH0pLFxuXG5cdFx0ZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYnVpbGRfZGlyLCAnc2VydmljZS13b3JrZXIuanMubWFwJykpICYmIHNlcnZlKHtcblx0XHRcdHBhdGhuYW1lOiAnL3NlcnZpY2Utd29ya2VyLmpzLm1hcCcsXG5cdFx0XHRjYWNoZV9jb250cm9sOiAnbm8tY2FjaGUsIG5vLXN0b3JlLCBtdXN0LXJldmFsaWRhdGUnXG5cdFx0fSksXG5cblx0XHRzZXJ2ZSh7XG5cdFx0XHRwcmVmaXg6ICcvY2xpZW50LycsXG5cdFx0XHRjYWNoZV9jb250cm9sOiBkZXYgPyAnbm8tY2FjaGUnIDogJ21heC1hZ2U9MzE1MzYwMDAsIGltbXV0YWJsZSdcblx0XHR9KSxcblxuXHRcdGdldF9zZXJ2ZXJfcm91dGVfaGFuZGxlcihtYW5pZmVzdC5zZXJ2ZXJfcm91dGVzKSxcblxuXHRcdGdldF9wYWdlX2hhbmRsZXIobWFuaWZlc3QsIHNlc3Npb24gfHwgbm9vcClcblx0XS5maWx0ZXIoQm9vbGVhbikpO1xufVxuXG5mdW5jdGlvbiBjb21wb3NlX2hhbmRsZXJzKGlnbm9yZSwgaGFuZGxlcnMpIHtcblx0Y29uc3QgdG90YWwgPSBoYW5kbGVycy5sZW5ndGg7XG5cblx0ZnVuY3Rpb24gbnRoX2hhbmRsZXIobiwgcmVxLCByZXMsIG5leHQpIHtcblx0XHRpZiAobiA+PSB0b3RhbCkge1xuXHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHR9XG5cblx0XHRoYW5kbGVyc1tuXShyZXEsIHJlcywgKCkgPT4gbnRoX2hhbmRsZXIobisxLCByZXEsIHJlcywgbmV4dCkpO1xuXHR9XG5cblx0cmV0dXJuICFpZ25vcmVcblx0XHQ/IChyZXEsIHJlcywgbmV4dCkgPT4gbnRoX2hhbmRsZXIoMCwgcmVxLCByZXMsIG5leHQpXG5cdFx0OiAocmVxLCByZXMsIG5leHQpID0+IHtcblx0XHRcdGlmIChzaG91bGRfaWdub3JlKHJlcS5wYXRoLCBpZ25vcmUpKSB7XG5cdFx0XHRcdG5leHQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG50aF9oYW5kbGVyKDAsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHRcdH1cblx0XHR9O1xufVxuXG5mdW5jdGlvbiBzaG91bGRfaWdub3JlKHVyaSwgdmFsKSB7XG5cdGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHJldHVybiB2YWwuc29tZSh4ID0+IHNob3VsZF9pZ25vcmUodXJpLCB4KSk7XG5cdGlmICh2YWwgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiB2YWwudGVzdCh1cmkpO1xuXHRpZiAodHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHZhbCh1cmkpO1xuXHRyZXR1cm4gdXJpLnN0YXJ0c1dpdGgodmFsLmNoYXJDb2RlQXQoMCkgPT09IDQ3ID8gdmFsIDogYC8ke3ZhbH1gKTtcbn1cblxuZnVuY3Rpb24gc2VydmUoeyBwcmVmaXgsIHBhdGhuYW1lLCBjYWNoZV9jb250cm9sIH1cblxuXG5cbikge1xuXHRjb25zdCBmaWx0ZXIgPSBwYXRobmFtZVxuXHRcdD8gKHJlcSkgPT4gcmVxLnBhdGggPT09IHBhdGhuYW1lXG5cdFx0OiAocmVxKSA9PiByZXEucGF0aC5zdGFydHNXaXRoKHByZWZpeCk7XG5cblx0Y29uc3QgY2FjaGUgPSBuZXcgTWFwKCk7XG5cblx0Y29uc3QgcmVhZCA9IGRldlxuXHRcdD8gKGZpbGUpID0+IGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoYnVpbGRfZGlyLCBmaWxlKSlcblx0XHQ6IChmaWxlKSA9PiAoY2FjaGUuaGFzKGZpbGUpID8gY2FjaGUgOiBjYWNoZS5zZXQoZmlsZSwgZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShidWlsZF9kaXIsIGZpbGUpKSkpLmdldChmaWxlKTtcblxuXHRyZXR1cm4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdFx0aWYgKGZpbHRlcihyZXEpKSB7XG5cdFx0XHRjb25zdCB0eXBlID0gbG9va3VwKHJlcS5wYXRoKTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgZmlsZSA9IGRlY29kZVVSSUNvbXBvbmVudChyZXEucGF0aC5zbGljZSgxKSk7XG5cdFx0XHRcdGNvbnN0IGRhdGEgPSByZWFkKGZpbGUpO1xuXG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIHR5cGUpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDYWNoZS1Db250cm9sJywgY2FjaGVfY29udHJvbCk7XG5cdFx0XHRcdHJlcy5lbmQoZGF0YSk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0cmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG5cdFx0XHRcdHJlcy5lbmQoJ25vdCBmb3VuZCcpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRuZXh0KCk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBub29wKCl7fVxuXG5leHBvcnQgeyBtaWRkbGV3YXJlIH07XG4iLCJpbXBvcnQgc2lydiBmcm9tICdzaXJ2JztcbmltcG9ydCBwb2xrYSBmcm9tICdwb2xrYSc7XG5pbXBvcnQgY29tcHJlc3Npb24gZnJvbSAnY29tcHJlc3Npb24nO1xuaW1wb3J0ICogYXMgc2FwcGVyIGZyb20gJ0BzYXBwZXIvc2VydmVyJztcblxuY29uc3QgeyBQT1JULCBOT0RFX0VOViB9ID0gcHJvY2Vzcy5lbnY7XG5jb25zdCBkZXYgPSBOT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JztcblxucG9sa2EoKSAvLyBZb3UgY2FuIGFsc28gdXNlIEV4cHJlc3Ncblx0LnVzZShcblx0XHQnL0NoYXJpdGlmeScsXG5cdFx0Y29tcHJlc3Npb24oeyB0aHJlc2hvbGQ6IDAgfSksXG5cdFx0c2lydignc3RhdGljJywgeyBkZXYgfSksXG5cdFx0c2FwcGVyLm1pZGRsZXdhcmUoKVxuXHQpXG5cdC5saXN0ZW4oUE9SVCwgZXJyID0+IHtcblx0XHRpZiAoZXJyKSBjb25zb2xlLmxvZygnZXJyb3InLCBlcnIpO1xuXHR9KTtcbiJdLCJuYW1lcyI6WyJjb21wb25lbnRfMCIsImNvbXBvbmVudF8xIiwiY29tcG9uZW50XzIiLCJjb21wb25lbnRfMyIsImNvbXBvbmVudF80IiwiY29tcG9uZW50XzUiLCJjb21wb25lbnRfNiIsImNvbXBvbmVudF83Iiwicm9vdCIsImVycm9yIiwiZXNjYXBlZCIsIm5vb3AiLCJzYXBwZXIubWlkZGxld2FyZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxTQUFTLElBQUksR0FBRyxHQUFHO0FBZ0JuQixTQUFTLEdBQUcsQ0FBQyxFQUFFLEVBQUU7QUFDakIsSUFBSSxPQUFPLEVBQUUsRUFBRSxDQUFDO0FBQ2hCLENBQUM7QUFDRCxTQUFTLFlBQVksR0FBRztBQUN4QixJQUFJLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBQ0QsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFO0FBQ3RCLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNyQixDQUFDO0FBSUQsU0FBUyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM5QixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxLQUFLLE9BQU8sQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDO0FBQ2xHLENBQUM7QUFrRUQsU0FBUyxhQUFhLENBQUMsS0FBSyxFQUFFO0FBQzlCLElBQUksT0FBTyxLQUFLLElBQUksSUFBSSxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUM7QUFDdEMsQ0FBQztBQXdTRCxTQUFTLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQ3BD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
