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
	code: "svg.svelte-1p0ceta.svelte-1p0ceta{display:inherit}svg.svelte-1p0ceta.svelte-1p0ceta,svg.svelte-1p0ceta .svelte-1p0ceta{fill:rgba(var(--theme-svg-fill));stroke:rgba(var(--theme-svg-fill))}.small.svelte-1p0ceta.svelte-1p0ceta{width:18px;height:18px}.medium.svelte-1p0ceta.svelte-1p0ceta{width:24px;height:24px}.big.svelte-1p0ceta.svelte-1p0ceta{width:30px;height:30px}.primary.svelte-1p0ceta.svelte-1p0ceta,.primary.svelte-1p0ceta .svelte-1p0ceta{fill:rgb(var(--color-success));stroke:rgb(var(--color-success))}.danger.svelte-1p0ceta.svelte-1p0ceta,.danger.svelte-1p0ceta .svelte-1p0ceta{fill:rgb(var(--color-danger));stroke:rgb(var(--color-danger))}.info.svelte-1p0ceta.svelte-1p0ceta,.info.svelte-1p0ceta .svelte-1p0ceta{fill:rgb(var(--color-info));stroke:rgb(var(--color-info))}.light.svelte-1p0ceta.svelte-1p0ceta,.light.svelte-1p0ceta .svelte-1p0ceta{fill:rgb(var(--color-white));stroke:rgb(var(--color-white))}.dark.svelte-1p0ceta.svelte-1p0ceta,.dark.svelte-1p0ceta .svelte-1p0ceta{fill:rgb(var(--color-black));stroke:rgb(var(--color-black))}",
	map: "{\"version\":3,\"file\":\"Icon.svelte\",\"sources\":[\"Icon.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames, toCSSString } from '../utils'\\n\\n    export let type\\n    export let is // primary|warning|danger|light|dark\\n    export let size = 'medium' // small|medium|big\\n    export let rotate = 0\\n    export let style = undefined\\n    export let id = undefined\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n    let styleProp = toCSSString({ transform: !!rotate ? `rotateZ(${rotate}deg)` : null, ...style })\\n\\n    $: classProp = classnames('ico', is, size, $$props.class)\\n</script>\\n\\n<svg\\n        {id}\\n        title={titleProp}\\n        class={classProp}\\n        style={styleProp}\\n        aria-label={ariaLabelProp}\\n>\\n    <use xlink:href={`#ico-${type}`} class=\\\"ico-use\\\"/>\\n</svg>\\n\\n<style>\\n    svg {\\n        display: inherit;\\n    }\\n\\n    svg, svg * {\\n        fill: rgba(var(--theme-svg-fill));\\n        stroke: rgba(var(--theme-svg-fill));\\n    }\\n\\n    /* ------------=========( Size )=========------------ */\\n    .small {\\n        width: 18px;\\n        height: 18px;\\n    }\\n\\n    .medium {\\n        width: 24px;\\n        height: 24px;\\n    }\\n\\n    .big {\\n        width: 30px;\\n        height: 30px;\\n    }\\n\\n    /* ------------=========( Color )=========------------ */\\n    .primary, .primary * {\\n        fill: rgb(var(--color-success));\\n        stroke: rgb(var(--color-success));\\n    }\\n\\n    .danger, .danger * {\\n        fill: rgb(var(--color-danger));\\n        stroke: rgb(var(--color-danger));\\n    }\\n\\n    .info, .info * {\\n        fill: rgb(var(--color-info));\\n        stroke: rgb(var(--color-info));\\n    }\\n\\n    .light, .light * {\\n        fill: rgb(var(--color-white));\\n        stroke: rgb(var(--color-white));\\n    }\\n\\n    .dark, .dark * {\\n        fill: rgb(var(--color-black));\\n        stroke: rgb(var(--color-black));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA8BI,GAAG,8BAAC,CAAC,AACD,OAAO,CAAE,OAAO,AACpB,CAAC,AAED,iCAAG,CAAE,kBAAG,CAAC,eAAE,CAAC,AACR,IAAI,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CACjC,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACvC,CAAC,AAGD,MAAM,8BAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,OAAO,8BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,IAAI,8BAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAGD,sCAAQ,CAAE,uBAAQ,CAAC,eAAE,CAAC,AAClB,IAAI,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,CAC/B,MAAM,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AACrC,CAAC,AAED,qCAAO,CAAE,sBAAO,CAAC,eAAE,CAAC,AAChB,IAAI,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAC9B,MAAM,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AACpC,CAAC,AAED,mCAAK,CAAE,oBAAK,CAAC,eAAE,CAAC,AACZ,IAAI,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CAC5B,MAAM,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AAClC,CAAC,AAED,oCAAM,CAAE,qBAAM,CAAC,eAAE,CAAC,AACd,IAAI,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAC7B,MAAM,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,AACnC,CAAC,AAED,mCAAK,CAAE,oBAAK,CAAC,eAAE,CAAC,AACZ,IAAI,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAC7B,MAAM,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,AACnC,CAAC\"}"
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

	return `<svg${add_attribute("id", id, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1p0ceta"}"${add_attribute("style", styleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)}>
    <use${add_attribute("xlink:href", `#ico-${type}`, 0)} class="${"ico-use svelte-1p0ceta"}"></use>
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

const css$3 = {
	code: ".card.svelte-uy8y5q{width:100%;overflow:hidden;box-shadow:var(--shadow-secondary);border-radius:var(--border-radius-big);background-color:rgba(var(--color-white))}",
	map: "{\"version\":3,\"file\":\"Card.svelte\",\"sources\":[\"Card.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '../utils'\\n\\n    $: classProp = classnames('card', $$props.class)\\n</script>\\n\\n<section class={classProp}>\\n    <slot></slot>\\n</section>\\n\\n<style>\\n    .card {\\n        width: 100%;\\n        overflow: hidden;\\n        box-shadow: var(--shadow-secondary);\\n        border-radius: var(--border-radius-big);\\n        background-color: rgba(var(--color-white));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAWI,KAAK,cAAC,CAAC,AACH,KAAK,CAAE,IAAI,CACX,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,IAAI,kBAAkB,CAAC,CACnC,aAAa,CAAE,IAAI,mBAAmB,CAAC,CACvC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,AAC9C,CAAC\"}"
};

const Card = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$3);
	let classProp = classnames("card", $$props.class);

	return `<section class="${escape(null_to_empty(classProp)) + " svelte-uy8y5q"}">
    ${$$slots.default ? $$slots.default({}) : ``}
</section>`;
});

/* src/components/Space.svelte generated by Svelte v3.18.1 */

const Space = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { size = 1 } = $$props;
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	return `${each(Array.from({ length: +size }), _ => ` `)}`;
});

/* src/components/Input.svelte generated by Svelte v3.18.1 */

const css$4 = {
	code: ".inp.svelte-pqri7m{width:100%;flex:1 1 0;color:inherit;border-radius:var(--border-radius-small);min-width:var(--min-interactive-size);min-height:var(--min-interactive-size);background-color:rgba(var(--color-white));box-shadow:var(--shadow-field-inset)\n    }",
	map: "{\"version\":3,\"file\":\"Input.svelte\",\"sources\":[\"Input.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let name\\n    export let value = ''\\n    export let style = {}\\n    export let type = 'text'\\n    export let id = undefined\\n    export let align = undefined\\n    export let maxlength = 1000\\n    export let rows = undefined\\n    export let disabled = false\\n    export let title = undefined\\n    export let invalid = undefined\\n    export let min = undefined // Specifies a minimum value for an <input> element\\n    export let max = undefined // Specifies the maximum value for an <input> element\\n    export let list = undefined // Refers to a <datalist> element that contains pre-defined options for an <input> element\\n    export let form = undefined // Specifies the form the <input> element belongs to\\n    export let readonly = undefined // undefined|readonly\\n    export let required = undefined // undefined|required\\n    export let pattern = undefined // Specifies a regular expression that an <input> element's value is checked against (regexp)\\n    export let autocomplete = true // on|off\\n    export let autoselect = false\\n    export let ariaLabel = undefined\\n    export let placeholder = undefined\\n\\n    let idProp = id || name\\n    let typeProp = type === 'number' ? 'text' : type\\n    let titleProp = title || ariaLabel || placeholder\\n    let ariaLabelProp = ariaLabel || title || placeholder\\n    let autocompleteProp = autocomplete ? 'on' : 'off'\\n    let styleProp = toCSSString({ ...style, textAlign: align })\\n    let patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern\\n\\n    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, invalid })\\n\\n    /**\\n     *\\n     * @description Emit click and select content when \\\"autoselect\\\" is enabled.\\n     *\\n     * @param {MouseEvent} e - Native mouse event.\\n     */\\n    function onClick(e) {\\n        !disabled && dispatch(\\\"click\\\", e)\\n        !disabled && autoselect && e.target.select()\\n    }\\n</script>\\n\\n{#if rows}\\n    <textarea\\n            {min}\\n            {max}\\n            {rows}\\n            {name}\\n            {form}\\n            {align}\\n            {readonly}\\n            {disabled}\\n            {required}\\n            {maxlength}\\n            {placeholder}\\n            id={idProp}\\n            class={classProp}\\n            title={titleProp}\\n            style={styleProp}\\n            pattern={patternProp}\\n            aria-label={ariaLabelProp}\\n            autocomplete={autocompleteProp}\\n            {...{ type: typeProp }}\\n            bind:value\\n            on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n            on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            on:click='{onClick}'\\n    ></textarea>\\n{:else}\\n    <input\\n            {min}\\n            {max}\\n            {name}\\n            {list}\\n            {form}\\n            {align}\\n            {readonly}\\n            {disabled}\\n            {required}\\n            {maxlength}\\n            {placeholder}\\n            id={idProp}\\n            class={classProp}\\n            title={titleProp}\\n            style={styleProp}\\n            pattern={patternProp}\\n            aria-label={ariaLabelProp}\\n            autocomplete={autocompleteProp}\\n            {...{ type: typeProp }}\\n            bind:value\\n            on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n            on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            on:click='{onClick}'\\n    />\\n{/if}\\n\\n<style>\\n    .inp {\\n        width: 100%;\\n        flex: 1 1 0;\\n        color: inherit;\\n        border-radius: var(--border-radius-small);\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n        background-color: rgba(var(--color-white));\\n        box-shadow: var(--shadow-field-inset)\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA0GI,IAAI,cAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACX,KAAK,CAAE,OAAO,CACd,aAAa,CAAE,IAAI,qBAAqB,CAAC,CACzC,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,CACvC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAC1C,UAAU,CAAE,IAAI,oBAAoB,CAAC;IACzC,CAAC\"}"
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
	$$result.css.add(css$4);
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
			"svelte-pqri7m"
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
			"svelte-pqri7m"
		)}${add_attribute("value", value, 1)}>`}`;
});

/* src/components/Picture.svelte generated by Svelte v3.18.1 */

const css$5 = {
	code: ".picture.svelte-11pdx8f.svelte-11pdx8f{position:relative;flex-grow:1;align-self:stretch;display:inline-flex;flex-direction:column;align-items:stretch;justify-content:stretch}.picture.cover.svelte-11pdx8f .pic.svelte-11pdx8f{object-fit:cover}.picture.contain.svelte-11pdx8f .pic.svelte-11pdx8f{object-fit:contain}.picture.svelte-11pdx8f .pic.svelte-11pdx8f{flex-grow:1;align-self:stretch;object-position:center;transition:opacity .3s ease-in}.picture.svelte-11pdx8f .pic-2x.svelte-11pdx8f{position:absolute;top:0;left:0;width:100%;height:100%}",
	map: "{\"version\":3,\"file\":\"Picture.svelte\",\"sources\":[\"Picture.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let src\\n    export let alt\\n    export let size = 'cover'\\n    export let srcBig = undefined\\n    export let id = undefined\\n    export let width = undefined\\n    export let height = undefined\\n\\n    let loadingSrc = true\\n    let loadingSrcBig = true\\n    let isError = false\\n\\n    $: wrapClassProp = classnames('picture', $$props.class, size, { loadingSrc, loadingSrcBig, isError })\\n\\n    function onLoadSrc(e) {\\n        loadingSrc = false\\n        dispatch('load', e)\\n    }\\n\\n    function onErrorSrc(e) {\\n        loadingSrc = false\\n        isError = true\\n        dispatch('error', e)\\n    }\\n\\n    function onLoadSrcBig(e) {\\n        loadingSrcBig = false\\n        dispatch('loadBig', e)\\n    }\\n\\n    function onErrorSrcBig(e) {\\n        loadingSrcBig = false\\n        isError = true\\n        dispatch('errorBig', e)\\n    }\\n</script>\\n\\n<figure class={wrapClassProp}>\\n    <img\\n            {id}\\n            {alt}\\n            {src}\\n            {width}\\n            {height}\\n            class=\\\"pic pic-1x\\\"\\n            on:load={onLoadSrc}\\n            on:error={onErrorSrc}\\n    />\\n    {#if srcBig && !loadingSrc}\\n        <img\\n                {alt}\\n                {width}\\n                {height}\\n                src={srcBig}\\n                class=\\\"pic pic-2x\\\"\\n                on:load={onLoadSrcBig}\\n                on:error={onErrorSrcBig}\\n        />\\n    {/if}\\n    <figcaption>\\n        <slot></slot>\\n    </figcaption>\\n</figure>\\n\\n<style>\\n    .picture {\\n        position: relative;\\n        flex-grow: 1;\\n        align-self: stretch;\\n        display: inline-flex;\\n        flex-direction: column;\\n        align-items: stretch;\\n        justify-content: stretch;\\n    }\\n\\n    .picture.cover .pic {\\n        object-fit: cover;\\n    }\\n\\n    .picture.contain .pic {\\n        object-fit: contain;\\n    }\\n\\n    .picture .pic {\\n        flex-grow: 1;\\n        align-self: stretch;\\n        object-position: center;\\n        transition: opacity .3s ease-in;\\n    }\\n\\n    .picture .pic-2x {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n    }\\n\\n    /*.picture.loadingSrc .pic-1x,*/\\n    /*.picture.loadingSrcBig .pic-2x {*/\\n    /*    opacity: 0;*/\\n    /*}*/\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAuEI,QAAQ,8BAAC,CAAC,AACN,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,OAAO,CAAE,WAAW,CACpB,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,AAC5B,CAAC,AAED,QAAQ,qBAAM,CAAC,IAAI,eAAC,CAAC,AACjB,UAAU,CAAE,KAAK,AACrB,CAAC,AAED,QAAQ,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACnB,UAAU,CAAE,OAAO,AACvB,CAAC,AAED,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACX,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,eAAe,CAAE,MAAM,CACvB,UAAU,CAAE,OAAO,CAAC,GAAG,CAAC,OAAO,AACnC,CAAC,AAED,uBAAQ,CAAC,OAAO,eAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC\"}"
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
	let loadingSrc = true;
	let loadingSrcBig = true;
	let isError = false;

	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	if ($$props.srcBig === void 0 && $$bindings.srcBig && srcBig !== void 0) $$bindings.srcBig(srcBig);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
	$$result.css.add(css$5);
	let wrapClassProp = classnames("picture", $$props.class, size, { loadingSrc, loadingSrcBig, isError });

	return `<figure class="${escape(null_to_empty(wrapClassProp)) + " svelte-11pdx8f"}">
    <img${add_attribute("id", id, 0)}${add_attribute("alt", alt, 0)}${add_attribute("src", src, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} class="${"pic pic-1x svelte-11pdx8f"}">
    ${srcBig && !loadingSrc
	? `<img${add_attribute("alt", alt, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("src", srcBig, 0)} class="${"pic pic-2x svelte-11pdx8f"}">`
	: ``}
    <figcaption>
        ${$$slots.default ? $$slots.default({}) : ``}
    </figcaption>
</figure>`;
});

/* src/components/Avatar.svelte generated by Svelte v3.18.1 */

const css$6 = {
	code: ".ava.svelte-1lra0v3{flex:none;display:flex;border-radius:50%;overflow:hidden}.small.svelte-1lra0v3{width:30px;height:30px}.medium.svelte-1lra0v3{width:60px;height:60px}.big.svelte-1lra0v3{width:130px;height:130px}",
	map: "{\"version\":3,\"file\":\"Avatar.svelte\",\"sources\":[\"Avatar.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '../utils'\\n    import Picture from './Picture.svelte'\\n\\n    export let src\\n    export let alt\\n    export let size = null // small|medium|big\\n\\n    $: classProp = classnames('ava', size, $$props.class)\\n</script>\\n\\n<div class={classProp}>\\n    <Picture {src} {alt}/>\\n</div>\\n\\n<style>\\n    .ava {\\n        flex: none;\\n        display: flex;\\n        border-radius: 50%;\\n        overflow: hidden;\\n    }\\n\\n    .small {\\n        width: 30px;\\n        height: 30px;\\n    }\\n    .medium {\\n        width: 60px;\\n        height: 60px;\\n    }\\n    .big {\\n        width: 130px;\\n        height: 130px;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAgBI,IAAI,eAAC,CAAC,AACF,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,MAAM,eAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,OAAO,eAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,IAAI,eAAC,CAAC,AACF,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,AACjB,CAAC\"}"
};

const Avatar = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	let { alt } = $$props;
	let { size = null } = $$props; // small|medium|big
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	$$result.css.add(css$6);
	let classProp = classnames("ava", size, $$props.class);

	return `<div class="${escape(null_to_empty(classProp)) + " svelte-1lra0v3"}">
    ${validate_component(Picture, "Picture").$$render($$result, { src, alt }, {}, {})}
</div>`;
});

/* src/components/Button.svelte generated by Svelte v3.18.1 */

const css$7 = {
	code: ".btn.svelte-30pg3u:not(.auto){width:100%}.btn{flex:none;cursor:pointer;max-width:100%;user-select:none;padding:5px 15px;margin-bottom:3px;font-weight:bold;text-align:center;align-items:center;display:inline-flex;justify-content:center;border-radius:var(--border-radius-medium);color:rgba(var(--theme-font-color));text-shadow:1px 1px rgba(var(--color-black), .3)}.btn.small{padding:5px;min-width:calc(var(--min-interactive-size) / 1.5);min-height:calc(var(--min-interactive-size) / 1.5)}.btn.medium{padding:5px 10px;min-width:var(--min-interactive-size);min-height:var(--min-interactive-size)}.btn.big{padding:5px 15px;min-width:calc(var(--min-interactive-size) * 1.5);min-height:calc(var(--min-interactive-size) * 1.5)}.btn:focus{background-color:rgba(var(--color-black), 0.1)}.btn:hover{box-shadow:0 2px rgba(var(--color-black), 0.2);background-color:rgba(var(--color-black), 0.1)}.btn:active{transform:translateY(1px);box-shadow:0 1px rgba(var(--color-black), 0.2);background-color:rgba(var(--color-black), 0.1)}.btn.white{color:rgba(var(--color-font-dark));background-color:rgba(var(--color-white))}.btn.white:focus{background-color:rgba(var(--color-white), .85)}.btn.white:hover{box-shadow:var(--shadow-primary)}.btn.white:active{box-shadow:var(--shadow-primary)}.btn.success{color:rgba(var(--color-font-light));background-color:rgba(var(--color-success));box-shadow:0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.success:focus{background-color:rgba(var(--color-success), .85)}.btn.success:hover{transform:translateY(1px);box-shadow:0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.success:active{transform:translateY(2px);box-shadow:0 1px rgba(var(--color-success-dark)), var(--shadow-secondary)}.btn.danger{color:rgba(var(--color-font-light));background-color:rgba(var(--color-danger));box-shadow:0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.danger:focus{background-color:rgba(var(--color-danger), .85)}.btn.danger:hover{transform:translateY(1px);box-shadow:0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.danger:active{transform:translateY(2px);box-shadow:0 1px rgba(var(--color-danger-dark)), var(--shadow-secondary)}@media screen and (min-width: 769px){.btn{margin-bottom:2px}.btn.success{box-shadow:0 3px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.warning{box-shadow:0 3px rgba(var(--color-warning-dark)), var(--shadow-secondary), var(--shadow-primary)}.btn.danger{box-shadow:0 3px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary)}}",
	map: "{\"version\":3,\"file\":\"Button.svelte\",\"sources\":[\"Button.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, onMount } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let is = undefined\\n    export let id = undefined\\n    export let href = undefined\\n    export let auto = false\\n    export let type = 'button'\\n    export let size = 'medium'\\n    export let title = undefined\\n    export let htmlFor = undefined\\n    export let disabled = false\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n\\n    $: classProp = classnames('btn', is, size, $$props.class, { auto, disabled })\\n\\n    function onLabelClick(e) {\\n        document.getElementById(htmlFor).click()\\n        !disabled && dispatch('click', e)\\n    }\\n\\n    function onClick(e) {\\n        !disabled && dispatch('click', e)\\n    }\\n</script>\\n\\n{#if href}\\n    <a\\n            {id}\\n            {href}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </a>\\n{:else if htmlFor}\\n    <label\\n            {id}\\n            {disabled}\\n            for={htmlFor}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onLabelClick}\\n    >\\n        <slot></slot>\\n    </label>\\n{:else}\\n    <button\\n            {id}\\n            {type}\\n            {disabled}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </button>\\n{/if}\\n\\n<style>\\n    .btn:not(.auto) {\\n        width: 100%;\\n    }\\n\\n    :global(.btn) {\\n        flex: none;\\n        cursor: pointer;\\n        max-width: 100%;\\n        user-select: none;\\n        padding: 5px 15px;\\n        margin-bottom: 3px;\\n        font-weight: bold;\\n        text-align: center;\\n        align-items: center;\\n        display: inline-flex;\\n        justify-content: center;\\n        border-radius: var(--border-radius-medium);\\n        color: rgba(var(--theme-font-color));\\n        text-shadow: 1px 1px rgba(var(--color-black), .3);\\n    }\\n\\n    :global(.btn.small) {\\n        padding: 5px;\\n        min-width: calc(var(--min-interactive-size) / 1.5);\\n        min-height: calc(var(--min-interactive-size) / 1.5);\\n    }\\n\\n    :global(.btn.medium) {\\n        padding: 5px 10px;\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n    }\\n\\n    :global(.btn.big) {\\n        padding: 5px 15px;\\n        min-width: calc(var(--min-interactive-size) * 1.5);\\n        min-height: calc(var(--min-interactive-size) * 1.5);\\n    }\\n\\n    :global(.btn:focus) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:hover) {\\n        box-shadow: 0 2px rgba(var(--color-black), 0.2);\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:active) {\\n        transform: translateY(1px);\\n        box-shadow: 0 1px rgba(var(--color-black), 0.2);\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    /* Success */\\n\\n    :global(.btn).white {\\n        color: rgba(var(--color-font-dark));\\n        background-color: rgba(var(--color-white));\\n    }\\n\\n    :global(.btn).white:focus {\\n        background-color: rgba(var(--color-white), .85);\\n    }\\n\\n    :global(.btn).white:hover {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).white:active {\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Success */\\n\\n    :global(.btn).success {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-success));\\n        box-shadow: 0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    :global(.btn).success:focus {\\n        background-color: rgba(var(--color-success), .85);\\n    }\\n\\n    :global(.btn).success:hover {\\n        transform: translateY(1px);\\n        box-shadow: 0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    :global(.btn).success:active {\\n        transform: translateY(2px);\\n        box-shadow: 0 1px rgba(var(--color-success-dark)), var(--shadow-secondary);\\n    }\\n\\n    /* Danger */\\n\\n    :global(.btn).danger {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-danger));\\n        box-shadow: 0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    :global(.btn).danger:focus {\\n        background-color: rgba(var(--color-danger), .85);\\n    }\\n\\n    :global(.btn).danger:hover {\\n        transform: translateY(1px);\\n        box-shadow: 0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary);\\n    }\\n\\n    :global(.btn).danger:active {\\n        transform: translateY(2px);\\n        box-shadow: 0 1px rgba(var(--color-danger-dark)), var(--shadow-secondary);\\n    }\\n\\n\\n    @media screen and (min-width: 769px) {\\n        :global(.btn) {\\n            margin-bottom: 2px;\\n        }\\n\\n        :global(.btn).success {\\n            box-shadow: 0 3px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary);\\n        }\\n\\n        :global(.btn).warning {\\n            box-shadow: 0 3px rgba(var(--color-warning-dark)), var(--shadow-secondary), var(--shadow-primary);\\n        }\\n\\n        :global(.btn).danger {\\n            box-shadow: 0 3px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary);\\n        }\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAsEI,kBAAI,KAAK,KAAK,CAAC,AAAC,CAAC,AACb,KAAK,CAAE,IAAI,AACf,CAAC,AAEO,IAAI,AAAE,CAAC,AACX,IAAI,CAAE,IAAI,CACV,MAAM,CAAE,OAAO,CACf,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,aAAa,CAAE,GAAG,CAClB,WAAW,CAAE,IAAI,CACjB,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,WAAW,CACpB,eAAe,CAAE,MAAM,CACvB,aAAa,CAAE,IAAI,sBAAsB,CAAC,CAC1C,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,WAAW,CAAE,GAAG,CAAC,GAAG,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AACrD,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,UAAU,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AACvD,CAAC,AAEO,WAAW,AAAE,CAAC,AAClB,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,AAC3C,CAAC,AAEO,QAAQ,AAAE,CAAC,AACf,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,SAAS,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,UAAU,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AACvD,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAC/C,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,WAAW,AAAE,CAAC,AAClB,SAAS,CAAE,WAAW,GAAG,CAAC,CAC1B,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAC/C,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAIO,IAAI,AAAC,MAAM,AAAC,CAAC,AACjB,KAAK,CAAE,KAAK,IAAI,iBAAiB,CAAC,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,AAC9C,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAEO,IAAI,AAAC,MAAM,OAAO,AAAC,CAAC,AACxB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAIO,IAAI,AAAC,QAAQ,AAAC,CAAC,AACnB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,CAC5C,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,oBAAoB,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACrG,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,CAAC,GAAG,CAAC,AACrD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,SAAS,CAAE,WAAW,GAAG,CAAC,CAC1B,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,oBAAoB,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACrG,CAAC,AAEO,IAAI,AAAC,QAAQ,OAAO,AAAC,CAAC,AAC1B,SAAS,CAAE,WAAW,GAAG,CAAC,CAC1B,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,oBAAoB,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,AAC9E,CAAC,AAIO,IAAI,AAAC,OAAO,AAAC,CAAC,AAClB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAC3C,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,mBAAmB,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACpG,CAAC,AAEO,IAAI,AAAC,OAAO,MAAM,AAAC,CAAC,AACxB,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,GAAG,CAAC,AACpD,CAAC,AAEO,IAAI,AAAC,OAAO,MAAM,AAAC,CAAC,AACxB,SAAS,CAAE,WAAW,GAAG,CAAC,CAC1B,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,mBAAmB,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACpG,CAAC,AAEO,IAAI,AAAC,OAAO,OAAO,AAAC,CAAC,AACzB,SAAS,CAAE,WAAW,GAAG,CAAC,CAC1B,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,mBAAmB,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,AAC7E,CAAC,AAGD,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AAC1B,IAAI,AAAE,CAAC,AACX,aAAa,CAAE,GAAG,AACtB,CAAC,AAEO,IAAI,AAAC,QAAQ,AAAC,CAAC,AACnB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,oBAAoB,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACrG,CAAC,AAEO,IAAI,AAAC,QAAQ,AAAC,CAAC,AACnB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,oBAAoB,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACrG,CAAC,AAEO,IAAI,AAAC,OAAO,AAAC,CAAC,AAClB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,KAAK,IAAI,mBAAmB,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACpG,CAAC,AACL,CAAC\"}"
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
	$$result.css.add(css$7);
	let classProp = classnames("btn", is, size, $$props.class, { auto, disabled });

	return `${href
	? `<a${add_attribute("id", id, 0)}${add_attribute("href", href, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-30pg3u"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </a>`
	: `${htmlFor
		? `<label${add_attribute("id", id, 0)} ${disabled ? "disabled" : ""}${add_attribute("for", htmlFor, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-30pg3u"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </label>`
		: `<button${add_attribute("id", id, 0)}${add_attribute("type", type, 0)} ${disabled ? "disabled" : ""}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-30pg3u"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </button>`}`}`;
});

/* src/components/Divider.svelte generated by Svelte v3.18.1 */

const css$8 = {
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
	$$result.css.add(css$8);
	let classProp = classnames("divider", is, $$props.class);

	let styleProp = toCSSString({
		padding: `${size / 2}px 0`,
		height: `${width}px`
	});

	return `<hr class="${escape(null_to_empty(classProp)) + " svelte-10708ut"}"${add_attribute("style", styleProp, 0)}>`;
});

/* src/components/Comment.svelte generated by Svelte v3.18.1 */

const Comment = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = undefined } = $$props;
	let { date = undefined } = $$props;
	let { title = undefined } = $$props;
	let { amount = undefined } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.date === void 0 && $$bindings.date && date !== void 0) $$bindings.date(date);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.amount === void 0 && $$bindings.amount && amount !== void 0) $$bindings.amount(amount);
	let classProp = classnames($$props.class);

	return `${validate_component(Card, "Card").$$render($$result, { class: classProp }, {}, {
		default: () => `
    <section class="${"comment flex flex-align-start"}" style="${"padding: 20px"}">

        ${validate_component(Avatar, "Avatar").$$render(
			$$result,
			{
				src,
				alt: title,
				size: "medium",
				class: "comment-ava"
			},
			{},
			{}
		)}

        <s></s>
        <s></s>
        <s></s>
        <s></s>

        <div class="${"flex flex-column flex-1"}" style="${"overflow: hidden"}">
            <h3 class="${"text-ellipsis"}">${escape(title)}</h3>

            <br class="${"tiny"}">

            <pre class="${"h5"}" style="${"line-height: 1.46"}">
                ${$$slots.default
		? $$slots.default({})
		: `
                     [No comment]
                `}
            </pre>

            <br class="${"small"}">

            <p class="${"flex flex-align-center flex-justify-between"}">
                <span class="${"h5"}" style="${"rgba(var(--color-black), .3)"}">${escape(date)}</span>
                <span class="${"h5"}">Reply</span>
                <span class="${"h5 flex flex-align-center"}">
                    <span${add_attribute("style", `opacity: ${amount > 2 ? 1 : 0.6}`, 0)}>
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
                    <span>${escape(amount)}</span>
                    <s></s>
                    <s></s>
                    <s></s>
                    <s></s>
                </span>
            </p>
        </div>

    </section>
`
	})}`;
});

/* src/components/Progress.svelte generated by Svelte v3.18.1 */

const css$9 = {
	code: ".progress.medium.svelte-17do1e7.svelte-17do1e7{--progress-height:10px;--progress-padding-point:1px}.progress.svelte-17do1e7.svelte-17do1e7{flex:0;width:100%;border-radius:9999px;height:var(--progress-height)}.progress-inner-frame.svelte-17do1e7.svelte-17do1e7{position:relative;display:flex;width:100%;height:100%;border-radius:9999px;overflow:hidden;padding:var(--progress-padding-point) 0;background-color:rgba(var(--color-black), .1);background-clip:content-box}.progress-core.svelte-17do1e7.svelte-17do1e7{position:absolute;top:0;left:0;height:100%;flex:none;align-self:stretch;transition:1s ease-in-out;border-radius:9999px;background-color:rgba(var(--color-info))}.progress[aria-valuenow=\"100\"].svelte-17do1e7 .progress-core.svelte-17do1e7{background-color:rgba(var(--color-success))}",
	map: "{\"version\":3,\"file\":\"Progress.svelte\",\"sources\":[\"Progress.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, onMount } from 'svelte'\\n    import { classnames, safeGet } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let id = undefined\\n    export let value = 0 // 0 - 100\\n    export let size = 'medium'\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n    export let borderRadius = undefined\\n\\n    $: val = 0\\n    $: titleProp = title || `Progress - ${val}%`\\n    $: ariaLabelProp = ariaLabel || `Progress - ${val}%`\\n    $: classProp = classnames('progress', size, $$props.class)\\n\\n    onMount(() => {\\n        // Make loading progress effect on mount component.\\n        requestAnimationFrame(() => val = Number.isFinite(+value) ? Math.max(0, Math.min(+value, 100)) : 0, 0)\\n    })\\n\\n    function getBorderRadius(borders, defaults = '99999px') {\\n        const brDefault = new Array(4).fill(defaults)\\n        const bds = safeGet(() => borders.split(' '), [], true)\\n        const rule = 'border-radius'\\n        return `${rule}:${brDefault.map((def, i) => `${bds[i] || def}`).join(' ')}`\\n    }\\n</script>\\n\\n\\n<div\\n        {id}\\n        class={classProp}\\n        title={titleProp}\\n        aria-label={ariaLabelProp}\\n        role=\\\"progressbar\\\"\\n        aria-valuemin=\\\"0\\\"\\n        aria-valuemax=\\\"100\\\"\\n        aria-valuenow={val}\\n        style={getBorderRadius(borderRadius)}\\n>\\n    <div class=\\\"progress-inner-frame\\\">\\n        <div class=\\\"progress-core\\\" style={`width:${val}%`}></div>\\n    </div>\\n</div>\\n\\n<style>\\n    .progress.medium {\\n        --progress-height: 10px;\\n        --progress-padding-point: 1px;\\n    }\\n\\n    .progress {\\n        flex: 0;\\n        width: 100%;\\n        border-radius: 9999px;\\n        height: var(--progress-height);\\n    }\\n\\n    .progress-inner-frame {\\n        position: relative;\\n        display: flex;\\n        width: 100%;\\n        height: 100%;\\n        border-radius: 9999px;\\n        overflow: hidden;\\n        padding: var(--progress-padding-point) 0;\\n        background-color: rgba(var(--color-black), .1);\\n        background-clip: content-box;\\n    }\\n\\n    .progress-core {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        height: 100%;\\n        flex: none;\\n        align-self: stretch;\\n        transition: 1s ease-in-out;\\n        border-radius: 9999px;\\n        background-color: rgba(var(--color-info));\\n    }\\n\\n    .progress[aria-valuenow=\\\"100\\\"] .progress-core {\\n        background-color: rgba(var(--color-success));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAiDI,SAAS,OAAO,8BAAC,CAAC,AACd,iBAAiB,CAAE,IAAI,CACvB,wBAAwB,CAAE,GAAG,AACjC,CAAC,AAED,SAAS,8BAAC,CAAC,AACP,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,MAAM,CACrB,MAAM,CAAE,IAAI,iBAAiB,CAAC,AAClC,CAAC,AAED,qBAAqB,8BAAC,CAAC,AACnB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,MAAM,CACrB,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,IAAI,wBAAwB,CAAC,CAAC,CAAC,CACxC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,CAC9C,eAAe,CAAE,WAAW,AAChC,CAAC,AAED,cAAc,8BAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,CACZ,IAAI,CAAE,IAAI,CACV,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,EAAE,CAAC,WAAW,CAC1B,aAAa,CAAE,MAAM,CACrB,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC,AAED,SAAS,CAAC,aAAa,CAAC,KAAK,gBAAC,CAAC,cAAc,eAAC,CAAC,AAC3C,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC\"}"
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
	$$result.css.add(css$9);
	let val = 0;
	let titleProp = title || `Progress - ${val}%`;
	let ariaLabelProp = ariaLabel || `Progress - ${val}%`;
	let classProp = classnames("progress", size, $$props.class);

	return `<div${add_attribute("id", id, 0)} class="${escape(null_to_empty(classProp)) + " svelte-17do1e7"}"${add_attribute("title", titleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)} role="${"progressbar"}" aria-valuemin="${"0"}" aria-valuemax="${"100"}"${add_attribute("aria-valuenow", val, 0)}${add_attribute("style", getBorderRadius(borderRadius), 0)}>
    <div class="${"progress-inner-frame svelte-17do1e7"}">
        <div class="${"progress-core svelte-17do1e7"}"${add_attribute("style", `width:${val}%`, 0)}></div>
    </div>
</div>`;
});

/* src/components/Carousel.svelte generated by Svelte v3.18.1 */

const css$a = {
	code: "ul.svelte-1jfh9aa{width:100%;display:flex;align-self:stretch;align-items:stretch;justify-content:stretch;overflow-y:hidden;overflow-x:auto;margin-bottom:2px;border-radius:var(--border-radius-big)}ul.svelte-1jfh9aa::-webkit-scrollbar{display:none}li.svelte-1jfh9aa{width:100%;flex:none;display:flex;align-items:stretch;justify-content:stretch}",
	map: "{\"version\":3,\"file\":\"Carousel.svelte\",\"sources\":[\"Carousel.svelte\"],\"sourcesContent\":[\"<script>\\n    import Picture from './Picture.svelte'\\n\\n    const cards = [\\n        {\\n            src: 'https://placeimg.com/300/300/tech',\\n            title: 'The main title and short description.',\\n            percent: 45,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG charity of Charitify.',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/arch',\\n            title: 'Second bigger major card title line with a bit longer description.',\\n            percent: 65,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG charity of Charitify.',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/any',\\n            title: 'The main title and short description.',\\n            percent: 5,\\n            orgHead: 'Tinaramisimuss Kandelakinuskas',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG charity of Charitify.',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/nature',\\n            title: 'The main title and short description.',\\n            percent: 95,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG giant charity organization of big Charitify company.',\\n        },\\n    ]\\n\\n    const imagesDefault = cards.map(card => ({\\n        src: card.src,\\n        alt: card.title,\\n    }))\\n\\n    /**\\n     *\\n     * @type {number | {\\n     *     src: string,\\n     *     srcBig: string,\\n     *     alt: string,\\n     *     onClick?: function,\\n     * }[]}\\n     */\\n    export let items = imagesDefault\\n</script>\\n\\n<ul aria-label=\\\"carousel\\\" class=\\\"scroll-x-center\\\">\\n    {#each items as item}\\n        <li>\\n            <slot {item}>\\n                <Picture {...item}/>\\n            </slot>\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    ul {\\n        width: 100%;\\n        display: flex;\\n        align-self: stretch;\\n        align-items: stretch;\\n        justify-content: stretch;\\n        overflow-y: hidden;\\n        overflow-x: auto;\\n        margin-bottom: 2px;\\n        border-radius: var(--border-radius-big);\\n    }\\n\\n    ul::-webkit-scrollbar {\\n        display: none;\\n    }\\n\\n    li {\\n        width: 100%;\\n        flex: none;\\n        display: flex;\\n        align-items: stretch;\\n        justify-content: stretch;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAkEI,EAAE,eAAC,CAAC,AACA,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,CACxB,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC3C,CAAC,AAED,iBAAE,mBAAmB,AAAC,CAAC,AACnB,OAAO,CAAE,IAAI,AACjB,CAAC,AAED,EAAE,eAAC,CAAC,AACA,KAAK,CAAE,IAAI,CACX,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,AAC5B,CAAC\"}"
};

const Carousel = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const cards = [
		{
			src: "https://placeimg.com/300/300/tech",
			title: "The main title and short description.",
			percent: 45,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG charity of Charitify."
		},
		{
			src: "https://placeimg.com/300/300/arch",
			title: "Second bigger major card title line with a bit longer description.",
			percent: 65,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG charity of Charitify."
		},
		{
			src: "https://placeimg.com/300/300/any",
			title: "The main title and short description.",
			percent: 5,
			orgHead: "Tinaramisimuss Kandelakinuskas",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG charity of Charitify."
		},
		{
			src: "https://placeimg.com/300/300/nature",
			title: "The main title and short description.",
			percent: 95,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG giant charity organization of big Charitify company."
		}
	];

	const imagesDefault = cards.map(card => ({ src: card.src, alt: card.title }));
	let { items = imagesDefault } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$a);

	return `<ul aria-label="${"carousel"}" class="${"scroll-x-center svelte-1jfh9aa"}">
    ${each(items, item => `<li class="${"svelte-1jfh9aa"}">
            ${$$slots.default
	? $$slots.default({ item })
	: `
                ${validate_component(Picture, "Picture").$$render($$result, Object.assign(item), {}, {})}
            `}
        </li>`)}
</ul>`;
});

/* src/layouts/Header.svelte generated by Svelte v3.18.1 */

const css$b = {
	code: "nav.svelte-teuio4.svelte-teuio4{position:sticky;top:0;z-index:10;display:flex;color:rgba(var(--color-font-light));justify-content:space-between;box-shadow:var(--shadow-secondary);border-bottom:1px solid rgba(var(--color-danger), .1);background-color:rgba(var(--color-dark-second))}.selected.svelte-teuio4.svelte-teuio4{position:relative;display:inline-block}.selected.svelte-teuio4.svelte-teuio4::after{position:absolute;content:\"\";width:calc(100% - 1em);height:2px;background-color:rgb(var(--color-danger));display:block;bottom:-1px}.nav-pages.svelte-teuio4 a.svelte-teuio4{padding:0.8em 0.5em}.nav-actions.svelte-teuio4.svelte-teuio4{display:flex;align-items:center;margin:-3px}.nav-actions.svelte-teuio4 li.svelte-teuio4{padding:3px}.nav-actions.svelte-teuio4 a.svelte-teuio4{display:block}.lang-select.svelte-teuio4.svelte-teuio4{padding:5px;background-color:transparent;color:rgba(var(--color-font-light))}.lang-select.svelte-teuio4.svelte-teuio4:hover,.lang-select.svelte-teuio4.svelte-teuio4:focus{box-shadow:none;background-color:rgba(var(--color-black), 0.1)}",
	map: "{\"version\":3,\"file\":\"Header.svelte\",\"sources\":[\"Header.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Icon, Button, Avatar } from '../components'\\n\\n    export let segment\\n\\n    let isDarkTheme = false\\n\\n    let value = 'ua'\\n\\n    function changeTheme() {\\n        isDarkTheme = !isDarkTheme\\n        document.body.classList.remove('theme-dark')\\n        document.body.classList.remove('theme-light')\\n        document.body.classList.add(isDarkTheme ? 'theme-dark' : 'theme-light')\\n    }\\n</script>\\n\\n<nav class=\\\"container\\\">\\n    <ul class=\\\"nav-pages flex\\\">\\n        <li><a rel=prefetch href='.' class:selected='{segment === undefined}'>home</a></li>\\n        <li><a rel=prefetch href='lists/funds' class:selected='{segment === \\\"lists\\\"}'>lists</a></li>\\n        <li><a href='map' class:selected='{segment === \\\"map\\\"}'>map</a></li>\\n    </ul>\\n\\n    <ul class=\\\"nav-actions\\\">\\n        <li>\\n            <select {value} name=\\\"lang\\\" id=\\\"lang\\\" class=\\\"btn small lang-select\\\">\\n                <option value=\\\"ua\\\">Ua</option>\\n                <option value=\\\"ru\\\">Ru</option>\\n                <option value=\\\"en\\\">En</option>\\n            </select>\\n        </li>\\n\\n        <li>\\n            <Button on:click={changeTheme} auto size=\\\"small\\\">\\n                <Icon type=\\\"moon\\\" class=\\\"theme-svg-fill-opposite\\\" is=\\\"light\\\"/>\\n            </Button>\\n        </li>\\n\\n        <li>\\n            <a class=\\\"btn small\\\" href=\\\"users/me\\\">\\n                <Avatar size=\\\"small\\\" src=\\\"https://placeimg.com/30/30/people\\\" alt=\\\"avatar\\\"/>\\n            </a>\\n        </li>\\n    </ul>\\n</nav>\\n\\n<style>\\n    nav {\\n        position: sticky;\\n        top: 0;\\n        z-index: 10;\\n        display: flex;\\n        color: rgba(var(--color-font-light));\\n        justify-content: space-between;\\n        box-shadow: var(--shadow-secondary);\\n        border-bottom: 1px solid rgba(var(--color-danger), .1);\\n        background-color: rgba(var(--color-dark-second));\\n    }\\n\\n    .selected {\\n        position: relative;\\n        display: inline-block;\\n    }\\n\\n    .selected::after {\\n        position: absolute;\\n        content: \\\"\\\";\\n        width: calc(100% - 1em);\\n        height: 2px;\\n        background-color: rgb(var(--color-danger));\\n        display: block;\\n        bottom: -1px;\\n    }\\n\\n    .nav-pages a {\\n        padding: 0.8em 0.5em;\\n    }\\n\\n    .nav-actions {\\n        display: flex;\\n        align-items: center;\\n        margin: -3px;\\n    }\\n\\n    .nav-actions li {\\n        padding: 3px;\\n    }\\n\\n    .nav-actions a {\\n        display: block;\\n    }\\n\\n    .lang-select {\\n        padding: 5px;\\n        background-color: transparent;\\n        color: rgba(var(--color-font-light));\\n    }\\n\\n    .lang-select:hover,\\n    .lang-select:focus {\\n        box-shadow: none;\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAgDI,GAAG,4BAAC,CAAC,AACD,QAAQ,CAAE,MAAM,CAChB,GAAG,CAAE,CAAC,CACN,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,eAAe,CAAE,aAAa,CAC9B,UAAU,CAAE,IAAI,kBAAkB,CAAC,CACnC,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,EAAE,CAAC,CACtD,gBAAgB,CAAE,KAAK,IAAI,mBAAmB,CAAC,CAAC,AACpD,CAAC,AAED,SAAS,4BAAC,CAAC,AACP,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,AACzB,CAAC,AAED,qCAAS,OAAO,AAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,GAAG,CAAC,CACvB,MAAM,CAAE,GAAG,CACX,gBAAgB,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAC1C,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,wBAAU,CAAC,CAAC,cAAC,CAAC,AACV,OAAO,CAAE,KAAK,CAAC,KAAK,AACxB,CAAC,AAED,YAAY,4BAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,0BAAY,CAAC,EAAE,cAAC,CAAC,AACb,OAAO,CAAE,GAAG,AAChB,CAAC,AAED,0BAAY,CAAC,CAAC,cAAC,CAAC,AACZ,OAAO,CAAE,KAAK,AAClB,CAAC,AAED,YAAY,4BAAC,CAAC,AACV,OAAO,CAAE,GAAG,CACZ,gBAAgB,CAAE,WAAW,CAC7B,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,AACxC,CAAC,AAED,wCAAY,MAAM,CAClB,wCAAY,MAAM,AAAC,CAAC,AAChB,UAAU,CAAE,IAAI,CAChB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC\"}"
};

let value = "ua";

const Header = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;

	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$b);

	return `<nav class="${"container svelte-teuio4"}">
    <ul class="${"nav-pages flex svelte-teuio4"}">
        <li><a rel="${"prefetch"}" href="${"."}" class="${["svelte-teuio4", segment === undefined ? "selected" : ""].join(" ").trim()}">home</a></li>
        <li><a rel="${"prefetch"}" href="${"lists/funds"}" class="${["svelte-teuio4", segment === "lists" ? "selected" : ""].join(" ").trim()}">lists</a></li>
        <li><a href="${"map"}" class="${["svelte-teuio4", segment === "map" ? "selected" : ""].join(" ").trim()}">map</a></li>
    </ul>

    <ul class="${"nav-actions svelte-teuio4"}">
        <li class="${"svelte-teuio4"}">
            <select${add_attribute("value", value, 0)} name="${"lang"}" id="${"lang"}" class="${"btn small lang-select svelte-teuio4"}">
                <option value="${"ua"}">Ua</option>
                <option value="${"ru"}">Ru</option>
                <option value="${"en"}">En</option>
            </select>
        </li>

        <li class="${"svelte-teuio4"}">
            ${validate_component(Button, "Button").$$render($$result, { auto: true, size: "small" }, {}, {
		default: () => `
                ${validate_component(Icon, "Icon").$$render(
			$$result,
			{
				type: "moon",
				class: "theme-svg-fill-opposite",
				is: "light"
			},
			{},
			{}
		)}
            `
	})}
        </li>

        <li class="${"svelte-teuio4"}">
            <a class="${"btn small svelte-teuio4"}" href="${"users/me"}">
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

/* src/layouts/Footer.svelte generated by Svelte v3.18.1 */

const css$c = {
	code: "footer.svelte-n8bslm{display:flex;align-items:center;justify-content:space-between;padding:var(--screen-padding);box-shadow:inset var(--shadow-primary);background-color:rgba(var(--theme-bg-color))}ul.svelte-n8bslm{display:flex;margin:-3px}li.svelte-n8bslm{padding:3px}",
	map: "{\"version\":3,\"file\":\"Footer.svelte\",\"sources\":[\"Footer.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Button } from '../components'\\n</script>\\n\\n<footer>\\n    <p>© {new Date().getFullYear()}</p>\\n    <ul>\\n        <li>\\n            <Button size=\\\"small\\\" is=\\\"success\\\">Action</Button>\\n        </li>\\n    </ul>\\n</footer>\\n\\n<style>\\n    footer {\\n        display: flex;\\n        align-items: center;\\n        justify-content: space-between;\\n        padding: var(--screen-padding);\\n        box-shadow: inset var(--shadow-primary);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n    ul {\\n        display: flex;\\n        margin: -3px;\\n    }\\n\\n    li {\\n        padding: 3px;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAcI,MAAM,cAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,aAAa,CAC9B,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAC9B,UAAU,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CACvC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC,AAED,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,GAAG,AAChB,CAAC\"}"
};

const Footer = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$c);

	return `<footer class="${"svelte-n8bslm"}">
    <p>© ${escape(new Date().getFullYear())}</p>
    <ul class="${"svelte-n8bslm"}">
        <li class="${"svelte-n8bslm"}">
            ${validate_component(Button, "Button").$$render($$result, { size: "small", is: "success" }, {}, { default: () => `Action` })}
        </li>
    </ul>
</footer>`;
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

/* src/layouts/Comments.svelte generated by Svelte v3.18.1 */

const css$d = {
	code: ".comments.svelte-1i5fkxb.svelte-1i5fkxb{width:100%;flex-grow:1;display:flex;overflow-y:auto;overflow-x:hidden;align-self:stretch;flex-direction:column}.comments-form.svelte-1i5fkxb.svelte-1i5fkxb{flex:none}.comments-wrap.svelte-1i5fkxb.svelte-1i5fkxb{width:100%;overflow:hidden;margin:-5px 0}.comments-wrap.svelte-1i5fkxb li.svelte-1i5fkxb{width:100%;padding:5px 0}",
	map: "{\"version\":3,\"file\":\"Comments.svelte\",\"sources\":[\"Comments.svelte\"],\"sourcesContent\":[\"<script>\\n    import { onMount } from 'svelte'\\n    import { api } from '../services'\\n    import { Comment, Form, Input, Button } from '../components'\\n\\n    export let withForm = true\\n\\n    let comments = []\\n\\n    onMount(async () => {\\n        comments = await api.getComments()\\n    })\\n</script>\\n\\n<section class=\\\"comments\\\">\\n    <ul class=\\\"comments-wrap\\\">\\n        {#each comments as comment}\\n            <li>\\n                <Comment\\n                        src={comment.avatar}\\n                        title={comment.author}\\n                        date={new Date(comment.created_at).toLocaleDateString()}\\n                        amount={comment.likes}\\n                >\\n                    {comment.comment}\\n                </Comment>\\n            </li>\\n        {/each}\\n    </ul>\\n\\n    {#if withForm}\\n        <br class=\\\"big\\\">\\n        <div class=\\\"comments-form\\\">\\n            <Form>\\n                <Input type=\\\"textarea\\\" rows=\\\"1\\\" class=\\\"comment-field\\\" placeholder=\\\"Leave your comment here\\\"/>\\n            </Form>\\n<!--            <div class=\\\"text-right\\\">-->\\n<!--                <Button type=\\\"submit\\\" is=\\\"success\\\" auto>-->\\n<!--                    <span>Send</span>-->\\n<!--                </Button>-->\\n<!--            </div>-->\\n        </div>\\n    {/if}\\n</section>\\n\\n<style>\\n    .comments {\\n        width: 100%;\\n        flex-grow: 1;\\n        display: flex;\\n        overflow-y: auto;\\n        overflow-x: hidden;\\n        align-self: stretch;\\n        flex-direction: column;\\n    }\\n\\n    .comments-form {\\n        flex: none;\\n    }\\n\\n    .comments-wrap {\\n        width: 100%;\\n        overflow: hidden;\\n        margin: -5px 0;\\n    }\\n\\n    .comments-wrap li {\\n        width: 100%;\\n        padding: 5px 0;\\n    }\\n\\n    span {\\n        padding: 0 3em;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA8CI,SAAS,8BAAC,CAAC,AACP,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,OAAO,CACnB,cAAc,CAAE,MAAM,AAC1B,CAAC,AAED,cAAc,8BAAC,CAAC,AACZ,IAAI,CAAE,IAAI,AACd,CAAC,AAED,cAAc,8BAAC,CAAC,AACZ,KAAK,CAAE,IAAI,CACX,QAAQ,CAAE,MAAM,CAChB,MAAM,CAAE,IAAI,CAAC,CAAC,AAClB,CAAC,AAED,6BAAc,CAAC,EAAE,eAAC,CAAC,AACf,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,CAAC,AAClB,CAAC\"}"
};

const Comments = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { withForm = true } = $$props;
	let comments = [];

	onMount(async () => {
		comments = await api.getComments();
	});

	if ($$props.withForm === void 0 && $$bindings.withForm && withForm !== void 0) $$bindings.withForm(withForm);
	$$result.css.add(css$d);

	return `<section class="${"comments svelte-1i5fkxb"}">
    <ul class="${"comments-wrap svelte-1i5fkxb"}">
        ${each(comments, comment => `<li class="${"svelte-1i5fkxb"}">
                ${validate_component(Comment, "Comment").$$render(
		$$result,
		{
			src: comment.avatar,
			title: comment.author,
			date: new Date(comment.created_at).toLocaleDateString(),
			amount: comment.likes
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

    ${withForm
	? `<br class="${"big"}">
        <div class="${"comments-form svelte-1i5fkxb"}">
            ${validate_component(Form, "Form").$$render($$result, {}, {}, {
			default: () => `
                ${validate_component(Input, "Input").$$render(
				$$result,
				{
					type: "textarea",
					rows: "1",
					class: "comment-field",
					placeholder: "Leave your comment here"
				},
				{},
				{}
			)}
            `
		})}





        </div>`
	: ``}
</section>`;
});

/* src/layouts/Documents.svelte generated by Svelte v3.18.1 */

const css$e = {
	code: "ul.svelte-htrpa4{width:100%;display:flex;align-items:flex-start;max-width:100%;overflow-y:hidden;overflow-x:auto;padding:var(--screen-padding) 0}li.svelte-htrpa4{flex:none;display:flex;align-self:stretch;height:180px;width:126px;padding:0 5px;box-sizing:content-box}li.svelte-htrpa4:first-child{padding-left:15px}li.svelte-htrpa4:last-child{padding-right:15px}",
	map: "{\"version\":3,\"file\":\"Documents.svelte\",\"sources\":[\"Documents.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Picture, Card } from '../components'\\n\\n    const cardSample = {\\n        src: 'https://placeimg.com/300/300/people',\\n        alt: '10грн',\\n    }\\n\\n    const all = new Array(5).fill(cardSample)\\n</script>\\n\\n<ul class=\\\"scroll-x-center\\\">\\n    {#each all as img}\\n        <li>\\n            <Card class=\\\"flex\\\">\\n                <Picture {...img} size=\\\"contain\\\"/>\\n            </Card>\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    ul {\\n        width: 100%;\\n        display: flex;\\n        align-items: flex-start;\\n        max-width: 100%;\\n        overflow-y: hidden;\\n        overflow-x: auto;\\n        padding: var(--screen-padding) 0;\\n    }\\n\\n    li {\\n        flex: none;\\n        display: flex;\\n        align-self: stretch;\\n        height: 180px;\\n        width: 126px;\\n        padding: 0 5px;\\n        box-sizing: content-box;\\n    }\\n\\n    li:first-child {\\n        padding-left: 15px;\\n    }\\n\\n    li:last-child {\\n        padding-right: 15px;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAsBI,EAAE,cAAC,CAAC,AACA,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,UAAU,CACvB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAAC,CAAC,AACpC,CAAC,AAED,EAAE,cAAC,CAAC,AACA,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,CAAC,CAAC,GAAG,CACd,UAAU,CAAE,WAAW,AAC3B,CAAC,AAED,gBAAE,YAAY,AAAC,CAAC,AACZ,YAAY,CAAE,IAAI,AACtB,CAAC,AAED,gBAAE,WAAW,AAAC,CAAC,AACX,aAAa,CAAE,IAAI,AACvB,CAAC\"}"
};

const Documents = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const cardSample = {
		src: "https://placeimg.com/300/300/people",
		alt: "10грн"
	};

	const all = new Array(5).fill(cardSample);
	$$result.css.add(css$e);

	return `<ul class="${"scroll-x-center svelte-htrpa4"}">
    ${each(all, img => `<li class="${"svelte-htrpa4"}">
            ${validate_component(Card, "Card").$$render($$result, { class: "flex" }, {}, {
		default: () => `
                ${validate_component(Picture, "Picture").$$render($$result, Object.assign(img, { size: "contain" }), {}, {})}
            `
	})}
        </li>`)}
</ul>`;
});

/* src/layouts/AvatarAndName.svelte generated by Svelte v3.18.1 */

const css$f = {
	code: "section.svelte-ccxq8x.svelte-ccxq8x{width:100%;flex-grow:1;display:flex;align-self:stretch;align-items:center;overflow:hidden}span.svelte-ccxq8x.svelte-ccxq8x{display:flex;flex-direction:column;justify-content:center;overflow:hidden;padding:0 8px}span.svelte-ccxq8x h4.svelte-ccxq8x,span.svelte-ccxq8x sub.svelte-ccxq8x{line-height:1.4;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
	map: "{\"version\":3,\"file\":\"AvatarAndName.svelte\",\"sources\":[\"AvatarAndName.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Avatar } from '../components'\\n\\n    export let src = undefined\\n    export let title = 'incognito'\\n    export let subtitle = ''\\n</script>\\n\\n<section>\\n    <Avatar src={src} alt={title}/>\\n\\n    <span>\\n        <h4>{title}</h4>\\n        <sub>{subtitle}</sub>\\n    </span>\\n</section>\\n\\n<style>\\n    section {\\n        width: 100%;\\n        flex-grow: 1;\\n        display: flex;\\n        align-self: stretch;\\n        align-items: center;\\n        overflow: hidden;\\n    }\\n\\n    span {\\n        display: flex;\\n        flex-direction: column;\\n        justify-content: center;\\n        overflow: hidden;\\n        padding: 0 8px;\\n    }\\n\\n    span h4,\\n    span sub {\\n        line-height: 1.4;\\n        max-width: 100%;\\n        overflow: hidden;\\n        white-space: nowrap;\\n        text-overflow: ellipsis;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAkBI,OAAO,4BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,MAAM,CACnB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,IAAI,4BAAC,CAAC,AACF,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,CACvB,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,kBAAI,CAAC,gBAAE,CACP,kBAAI,CAAC,GAAG,cAAC,CAAC,AACN,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,QAAQ,AAC3B,CAAC\"}"
};

const AvatarAndName = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src = undefined } = $$props;
	let { title = "incognito" } = $$props;
	let { subtitle = "" } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$f);

	return `<section class="${"svelte-ccxq8x"}">
    ${validate_component(Avatar, "Avatar").$$render($$result, { src, alt: title }, {}, {})}

    <span class="${"svelte-ccxq8x"}">
        <h4 class="${"svelte-ccxq8x"}">${escape(title)}</h4>
        <sub class="${"svelte-ccxq8x"}">${escape(subtitle)}</sub>
    </span>
</section>`;
});

/* src/layouts/ListItems.svelte generated by Svelte v3.18.1 */

const css$g = {
	code: ".item.svelte-6ybk2p{display:block;flex:1 1 auto;box-shadow:var(--shadow-primary);border-radius:var(--border-radius);background-color:rgba(var(--theme-bg-color))}",
	map: "{\"version\":3,\"file\":\"ListItems.svelte\",\"sources\":[\"ListItems.svelte\"],\"sourcesContent\":[\"<script>\\n    import AvatarAndName from './AvatarAndName.svelte'\\n\\n    export let items = []\\n    export let basePath = ''\\n</script>\\n\\n{#each items as item}\\n    <a class=\\\"item container\\\" href={`${basePath}/${item.id}`}>\\n        <br>\\n        <AvatarAndName\\n                src={item.org_head_avatar}\\n                title={item.org_head}\\n                subtitle={item.organization}\\n        />\\n        <br>\\n    </a>\\n    <br>\\n{:else}\\n    <section class=\\\"item container\\\">\\n        <p class=\\\"text-center\\\">No organizations</p>\\n    </section>\\n{/each}\\n\\n<style>\\n    .item {\\n        display: block;\\n        flex: 1 1 auto;\\n        box-shadow: var(--shadow-primary);\\n        border-radius: var(--border-radius);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAyBI,KAAK,cAAC,CAAC,AACH,OAAO,CAAE,KAAK,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC\"}"
};

const ListItems = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	let { basePath = "" } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.basePath === void 0 && $$bindings.basePath && basePath !== void 0) $$bindings.basePath(basePath);
	$$result.css.add(css$g);

	return `${items.length
	? each(items, item => `<a class="${"item container svelte-6ybk2p"}"${add_attribute("href", `${basePath}/${item.id}`, 0)}>
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
	: `<section class="${"item container svelte-6ybk2p"}">
        <p class="${"text-center"}">No organizations</p>
    </section>`}`;
});

/* src/layouts/SearchLine.svelte generated by Svelte v3.18.1 */

const SearchLine = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<section class="${"search svelte-ovr79r"}">
    ${validate_component(Input, "Input").$$render($$result, {}, {}, {})}
</section>`;
});

/* src/layouts/TrustButton.svelte generated by Svelte v3.18.1 */

const css$h = {
	code: ".trust-btn.svelte-in1lxn.svelte-in1lxn{position:relative;display:block;width:100%;height:0;padding-bottom:100%;border-radius:50%;overflow:hidden}div.svelte-in1lxn.svelte-in1lxn{display:flex;align-items:center;justify-content:center;border-radius:50%;border:4px solid rgba(var(--color-danger));background-color:rgba(var(--color-danger), .2)}.trust-btn.isActive.svelte-in1lxn div.svelte-in1lxn{background-color:rgba(var(--color-danger), 1)}.trust-btn.isActive.svelte-in1lxn svg.svelte-in1lxn{fill:rgba(var(--color-white));animation:none;transform:scale(1.1)\n    }svg.svelte-in1lxn.svelte-in1lxn{width:50%;height:50%;max-width:calc(100% - 10px);max-height:calc(100% - 10px);fill:rgba(var(--color-danger));animation:svelte-in1lxn-pulse 2s infinite}@keyframes svelte-in1lxn-pulse{10%{transform:scale(1.1)\n        }20%{transform:scale(1.05)\n        }30%{transform:scale(1.15)\n        }}",
	map: "{\"version\":3,\"file\":\"TrustButton.svelte\",\"sources\":[\"TrustButton.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let isActive = null\\n    export let onAsyncClick = null\\n\\n    let isActiveLocal = !!isActive\\n\\n    $: isActiveState = isActive === null ? isActiveLocal : isActive\\n    $: classProp = classnames('trust-btn', $$props.class, { isActive: isActiveState })\\n\\n    function onClickHandler(e) {\\n        onClickEvent(e)\\n        onClickPromise(e)\\n    }\\n\\n    function onClickEvent(e) {\\n        dispatch('click', e)\\n    }\\n\\n    const onClickPromise = async (e) => {\\n        if (typeof onAsyncClick === 'function') {\\n            try {\\n                isActiveLocal = !isActiveLocal\\n                await onAsyncClick(e)\\n            } catch (err) {\\n                isActiveLocal = !isActiveLocal\\n            }\\n        }\\n    }\\n</script>\\n\\n<button type=\\\"button\\\" title=\\\"I trust\\\" class={classProp} on:click={onClickHandler}>\\n    <div class=\\\"full-absolute\\\">\\n        <svg>\\n            <use xlink:href=\\\"#ico-heart-filled\\\" class=\\\"ico-use\\\"/>\\n        </svg>\\n    </div>\\n</button>\\n\\n<style>\\n    .trust-btn {\\n        position: relative;\\n        display: block;\\n        width: 100%;\\n        height: 0;\\n        padding-bottom: 100%;\\n        border-radius: 50%;\\n        overflow: hidden;\\n    }\\n\\n    div {\\n        display: flex;\\n        align-items: center;\\n        justify-content: center;\\n        border-radius: 50%;\\n        border: 4px solid rgba(var(--color-danger));\\n        background-color: rgba(var(--color-danger), .2);\\n    }\\n\\n    .trust-btn.isActive div {\\n        background-color: rgba(var(--color-danger), 1);\\n    }\\n\\n    .trust-btn.isActive svg {\\n        fill: rgba(var(--color-white));\\n        animation: none;\\n        transform: scale(1.1)\\n    }\\n\\n    svg {\\n        width: 50%;\\n        height: 50%;\\n        max-width: calc(100% - 10px);\\n        max-height: calc(100% - 10px);\\n        fill: rgba(var(--color-danger));\\n        animation: pulse 2s infinite;\\n    }\\n\\n    @keyframes pulse {\\n        10% {\\n            transform: scale(1.1)\\n        }\\n        20% {\\n            transform: scale(1.05)\\n        }\\n        30% {\\n            transform: scale(1.15)\\n        }\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA4CI,UAAU,4BAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,CAAC,CACT,cAAc,CAAE,IAAI,CACpB,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,GAAG,4BAAC,CAAC,AACD,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,aAAa,CAAE,GAAG,CAClB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,cAAc,CAAC,CAAC,CAC3C,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,EAAE,CAAC,AACnD,CAAC,AAED,UAAU,uBAAS,CAAC,GAAG,cAAC,CAAC,AACrB,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,CAAC,CAAC,AAClD,CAAC,AAED,UAAU,uBAAS,CAAC,GAAG,cAAC,CAAC,AACrB,IAAI,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAC9B,SAAS,CAAE,IAAI,CACf,SAAS,CAAE,MAAM,GAAG,CAAC;IACzB,CAAC,AAED,GAAG,4BAAC,CAAC,AACD,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,SAAS,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAC5B,UAAU,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAC7B,IAAI,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAC/B,SAAS,CAAE,mBAAK,CAAC,EAAE,CAAC,QAAQ,AAChC,CAAC,AAED,WAAW,mBAAM,CAAC,AACd,GAAG,AAAC,CAAC,AACD,SAAS,CAAE,MAAM,GAAG,CAAC;QACzB,CAAC,AACD,GAAG,AAAC,CAAC,AACD,SAAS,CAAE,MAAM,IAAI,CAAC;QAC1B,CAAC,AACD,GAAG,AAAC,CAAC,AACD,SAAS,CAAE,MAAM,IAAI,CAAC;QAC1B,CAAC,AACL,CAAC\"}"
};

const TrustButton = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { isActive = null } = $$props;
	let { onAsyncClick = null } = $$props;
	let isActiveLocal = !!isActive;

	if ($$props.isActive === void 0 && $$bindings.isActive && isActive !== void 0) $$bindings.isActive(isActive);
	if ($$props.onAsyncClick === void 0 && $$bindings.onAsyncClick && onAsyncClick !== void 0) $$bindings.onAsyncClick(onAsyncClick);
	$$result.css.add(css$h);
	let isActiveState = isActive === null ? isActiveLocal : isActive;
	let classProp = classnames("trust-btn", $$props.class, { isActive: isActiveState });

	return `<button type="${"button"}" title="${"I trust"}" class="${escape(null_to_empty(classProp)) + " svelte-in1lxn"}">
    <div class="${"full-absolute svelte-in1lxn"}">
        <svg class="${"svelte-in1lxn"}">
            <use xlink:href="${"#ico-heart-filled"}" class="${"ico-use"}"></use>
        </svg>
    </div>
</button>`;
});

/* src/layouts/ListsLayout.svelte generated by Svelte v3.18.1 */

const css$i = {
	code: ".search.svelte-4yrc5j.svelte-4yrc5j{flex:none;position:relative;box-shadow:var(--shadow-primary)}.list-wrap.svelte-4yrc5j.svelte-4yrc5j{flex:1 1 0;overflow-x:hidden;overflow-y:auto;padding:0 var(--screen-padding);box-shadow:inset 0 -100px 2000px rgba(var(--color-black), .5)}nav.svelte-4yrc5j ul.svelte-4yrc5j,nav.svelte-4yrc5j li.svelte-4yrc5j{display:flex;align-self:stretch;align-items:stretch;justify-content:stretch}li.svelte-4yrc5j.svelte-4yrc5j{flex:1 1 0}li.svelte-4yrc5j a.svelte-4yrc5j{flex:1 1 0;align-self:stretch;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px 10px}li.svelte-4yrc5j a.svelte-4yrc5j:hover,li.svelte-4yrc5j a.selected.svelte-4yrc5j{background-color:rgba(var(--color-black), .1)}",
	map: "{\"version\":3,\"file\":\"ListsLayout.svelte\",\"sources\":[\"ListsLayout.svelte\"],\"sourcesContent\":[\"<svelte:head>\\n    <title>Charitify - is the application for helping those in need.</title>\\n</svelte:head>\\n\\n<script>\\n    import Footer from './Footer.svelte'\\n    import SearchLine from './SearchLine.svelte'\\n\\n    export let segment\\n</script>\\n\\n<div class=\\\"search theme-bg container\\\">\\n    <br>\\n\\n    <SearchLine/>\\n\\n    <nav>\\n        <ul>\\n            <li><a rel=prefetch href='lists/funds' class:selected='{segment === \\\"charities\\\"}'>funds</a></li>\\n            <li><a rel=prefetch href='lists/organizations' class:selected='{segment === \\\"organizations\\\"}'>organizations</a></li>\\n        </ul>\\n    </nav>\\n</div>\\n\\n<div class=\\\"list-wrap\\\">\\n    <br>\\n\\n    <slot></slot>\\n\\n    <br>\\n    <br>\\n</div>\\n\\n<Footer/>\\n\\n<style>\\n    .search {\\n        flex: none;\\n        position: relative;\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    .list-wrap {\\n        flex: 1 1 0;\\n        overflow-x: hidden;\\n        overflow-y: auto;\\n        padding: 0 var(--screen-padding);\\n        box-shadow: inset 0 -100px 2000px rgba(var(--color-black), .5);\\n    }\\n\\n    nav ul, nav li {\\n        display: flex;\\n        align-self: stretch;\\n        align-items: stretch;\\n        justify-content: stretch;\\n    }\\n\\n    li {\\n        flex: 1 1 0;\\n    }\\n\\n    li a {\\n        flex: 1 1 0;\\n        align-self: stretch;\\n        display: flex;\\n        align-items: center;\\n        justify-content: center;\\n        text-align: center;\\n        padding: 20px 10px;\\n    }\\n\\n    li a:hover, li a.selected {\\n        background-color: rgba(var(--color-black), .1);\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAoCI,OAAO,4BAAC,CAAC,AACL,IAAI,CAAE,IAAI,CACV,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,UAAU,4BAAC,CAAC,AACR,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACX,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAChC,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,MAAM,CAAC,MAAM,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AAClE,CAAC,AAED,iBAAG,CAAC,gBAAE,CAAE,iBAAG,CAAC,EAAE,cAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,AAC5B,CAAC,AAED,EAAE,4BAAC,CAAC,AACA,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,AACf,CAAC,AAED,gBAAE,CAAC,CAAC,cAAC,CAAC,AACF,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACX,UAAU,CAAE,OAAO,CACnB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,IAAI,CAAC,IAAI,AACtB,CAAC,AAED,gBAAE,CAAC,eAAC,MAAM,CAAE,gBAAE,CAAC,CAAC,SAAS,cAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AAClD,CAAC\"}"
};

const ListsLayout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$i);

	return `${($$result.head += `${($$result.title = `<title>Charitify - is the application for helping those in need.</title>`, "")}`, "")}



<div class="${"search theme-bg container svelte-4yrc5j"}">
    <br>

    ${validate_component(SearchLine, "SearchLine").$$render($$result, {}, {}, {})}

    <nav class="${"svelte-4yrc5j"}">
        <ul class="${"svelte-4yrc5j"}">
            <li class="${"svelte-4yrc5j"}"><a rel="${"prefetch"}" href="${"lists/funds"}" class="${["svelte-4yrc5j", segment === "charities" ? "selected" : ""].join(" ").trim()}">funds</a></li>
            <li class="${"svelte-4yrc5j"}"><a rel="${"prefetch"}" href="${"lists/organizations"}" class="${["svelte-4yrc5j", segment === "organizations" ? "selected" : ""].join(" ").trim()}">organizations</a></li>
        </ul>
    </nav>
</div>

<div class="${"list-wrap svelte-4yrc5j"}">
    <br>

    ${$$slots.default ? $$slots.default({}) : ``}

    <br>
    <br>
</div>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});

/* src/layouts/CharityCard.svelte generated by Svelte v3.18.1 */

const css$j = {
	code: ".card.svelte-do16pj{display:flex;flex-direction:column;flex:none;width:100%;max-width:100%}.rate-wrap.svelte-do16pj{text-align:center;padding-top:6px}.images-wrap.svelte-do16pj{display:flex;height:100px}h4.svelte-do16pj{--card-line-height:1.4;font-size:.8em;line-height:var(--card-line-height);height:calc(var(--font-size) * (var(--card-line-height) / 1.2) * 2);overflow:hidden}",
	map: "{\"version\":3,\"file\":\"CharityCard.svelte\",\"sources\":[\"CharityCard.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Rate, Progress, Avatar, Carousel } from '../components'\\n    import AvatarAndName from './AvatarAndName.svelte'\\n\\n    export let src = undefined\\n    export let title = undefined\\n    export let percent = undefined\\n    export let orgHead = undefined\\n    export let orgHeadSrc = undefined\\n    export let organization = undefined\\n\\n    $: images = new Array(4).fill({\\n        src,\\n        alt: title,\\n    })\\n</script>\\n\\n<a class=\\\"card\\\" href=\\\"funds/id\\\">\\n    <div class=\\\"images-wrap\\\">\\n        <Carousel items={images}/>\\n    </div>\\n\\n    <Progress value={percent} borderRadius=\\\"0 0\\\"/>\\n\\n    <h4>{title}</h4>\\n\\n    <div class=\\\"rate-wrap\\\">\\n        <Rate size=\\\"small\\\"/>\\n    </div>\\n\\n    <footer>\\n        <AvatarAndName src={orgHeadSrc} title={orgHead} subtitle={organization}/>\\n    </footer>\\n</a>\\n\\n<style>\\n    .card {\\n        display: flex;\\n        flex-direction: column;\\n        flex: none;\\n        width: 100%;\\n        max-width: 100%;\\n    }\\n\\n    .rate-wrap {\\n        text-align: center;\\n        padding-top: 6px;\\n    }\\n\\n    .images-wrap {\\n        display: flex;\\n        height: 100px;\\n    }\\n\\n    h4 {\\n        --card-line-height: 1.4;\\n\\n        font-size: .8em;\\n        line-height: var(--card-line-height);\\n        height: calc(var(--font-size) * (var(--card-line-height) / 1.2) * 2);\\n        overflow: hidden;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAoCI,KAAK,cAAC,CAAC,AACH,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,IAAI,AACnB,CAAC,AAED,UAAU,cAAC,CAAC,AACR,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,GAAG,AACpB,CAAC,AAED,YAAY,cAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,KAAK,AACjB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,kBAAkB,CAAE,GAAG,CAEvB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,kBAAkB,CAAC,CACpC,MAAM,CAAE,KAAK,IAAI,WAAW,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACpE,QAAQ,CAAE,MAAM,AACpB,CAAC\"}"
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
	$$result.css.add(css$j);
	let images = new Array(4).fill({ src, alt: title });

	return `<a class="${"card svelte-do16pj"}" href="${"funds/id"}">
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
</a>`;
});

/* src/layouts/CharityCards.svelte generated by Svelte v3.18.1 */

const css$k = {
	code: "section.svelte-1hdqh35.svelte-1hdqh35{flex-grow:1;align-self:stretch;max-width:100%;padding:0 10px}.cards.svelte-1hdqh35.svelte-1hdqh35{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:var(--screen-padding) 0;margin:calc(var(--screen-padding) * -3) calc(var(--screen-padding) * -1)}.cards.svelte-1hdqh35 li.svelte-1hdqh35{display:flex;justify-content:stretch;width:50%;overflow:hidden;padding:calc(var(--screen-padding) * 3) var(--screen-padding)}.cards.svelte-1hdqh35 li.svelte-1hdqh35:hover{background-color:rgba(0, 0, 0, .1)\n    }",
	map: "{\"version\":3,\"file\":\"CharityCards.svelte\",\"sources\":[\"CharityCards.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Divider } from '../components'\\n    import CharityCard from '../layouts/CharityCard.svelte'\\n\\n    export let listName\\n    export let amount = 2\\n\\n    $: cards = [\\n        {\\n            src: 'https://placeimg.com/300/300/tech',\\n            title: 'This person needs your help',\\n            percent: 45,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'Head of the organization with loooooooong-naaaaaamed charity',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/arch',\\n            title: 'Another person who needs your quick help',\\n            percent: 65,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'Head of another organization',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/any',\\n            title: 'The person with the longest name is also wait for you',\\n            percent: 5,\\n            orgHead: 'Tinaramisimuss el-de-la Kandelakinuskas',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG of charity',\\n        },\\n        {\\n            src: 'https://placeimg.com/300/300/nature',\\n            title: 'Needs',\\n            percent: 95,\\n            orgHead: 'Tina Kandelaki',\\n            orgHeadSrc: 'https://placeimg.com/300/300/people',\\n            organization: 'ORG giant charity organization of big Charitify company',\\n        },\\n    ].slice(Number.isFinite(+amount) ? +amount : 0)\\n\\n    $: images = cards.map(card => ({\\n        src: [card.src, card.src, card.src],\\n        alt: card.title,\\n    }))\\n</script>\\n\\n<section>\\n    {#if listName}\\n        <Divider size=\\\"16\\\"/>\\n        <h3 class=\\\"h2 text-right\\\">{listName}</h3>\\n        <Divider size=\\\"20\\\"/>\\n        <br>\\n    {/if}\\n    <ul class=\\\"cards\\\">\\n        {#each cards as card}\\n            <li>\\n                <CharityCard {...card}/>\\n            </li>\\n        {/each}\\n    </ul>\\n</section>\\n\\n<style>\\n    section {\\n        flex-grow: 1;\\n        align-self: stretch;\\n        max-width: 100%;\\n        padding: 0 10px;\\n    }\\n\\n    .cards {\\n        display: flex;\\n        flex-wrap: wrap;\\n        align-items: flex-start;\\n        justify-content: center;\\n        padding: var(--screen-padding) 0;\\n        margin: calc(var(--screen-padding) * -3) calc(var(--screen-padding) * -1);\\n    }\\n\\n    .cards li {\\n        display: flex;\\n        justify-content: stretch;\\n        width: 50%;\\n        overflow: hidden;\\n        padding: calc(var(--screen-padding) * 3) var(--screen-padding);\\n    }\\n\\n    .cards li:hover {\\n        background-color: rgba(0, 0, 0, .1)\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAiEI,OAAO,8BAAC,CAAC,AACL,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,CAAC,CAAC,IAAI,AACnB,CAAC,AAED,MAAM,8BAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,UAAU,CACvB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAChC,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,AAC7E,CAAC,AAED,qBAAM,CAAC,EAAE,eAAC,CAAC,AACP,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,OAAO,CACxB,KAAK,CAAE,GAAG,CACV,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AAClE,CAAC,AAED,qBAAM,CAAC,iBAAE,MAAM,AAAC,CAAC,AACb,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC;IACvC,CAAC\"}"
};

const CharityCards = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { listName } = $$props;
	let { amount = 2 } = $$props;
	if ($$props.listName === void 0 && $$bindings.listName && listName !== void 0) $$bindings.listName(listName);
	if ($$props.amount === void 0 && $$bindings.amount && amount !== void 0) $$bindings.amount(amount);
	$$result.css.add(css$k);

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

/* src/layouts/DonatorsCard.svelte generated by Svelte v3.18.1 */

const css$l = {
	code: "ul.svelte-17ncppz{width:100%\n    }li.svelte-17ncppz{display:flex;align-items:center;padding:20px;width:100%}li.svelte-17ncppz:not(:last-child){border-bottom:1px dashed rgba(var(--color-black), 0.1)}div.svelte-17ncppz{overflow:hidden}p.svelte-17ncppz{font-weight:600}span.svelte-17ncppz{font-weight:300}",
	map: "{\"version\":3,\"file\":\"DonatorsCard.svelte\",\"sources\":[\"DonatorsCard.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Card, Avatar } from '../components'\\n\\n    export let items\\n</script>\\n\\n{#if Array.isArray(items) && items.length}\\n    <Card>\\n        <ul>\\n            {#each items as item}\\n                {#if item.title && item.src}\\n                    <li>\\n                        <Avatar src={item.src} size=\\\"medium\\\" alt={item.subtitle}/>\\n                        <s></s>\\n                        <s></s>\\n                        <s></s>\\n                        <s></s>\\n                        <div>\\n                            <p class=\\\"h1 text-ellipsis\\\">{ item.title }</p>\\n                            <span class=\\\"h5 text-ellipsis\\\">{ item.subtitle }<span/>\\n                        </div>\\n                    </li>\\n                {/if}\\n            {/each}\\n        </ul>\\n    </Card>\\n{/if}\\n\\n<style>\\n    ul {\\n        width: 100%\\n    }\\n\\n    li {\\n        display: flex;\\n        align-items: center;\\n        padding: 20px;\\n        width: 100%;\\n    }\\n\\n    li:not(:last-child) {\\n        border-bottom: 1px dashed rgba(var(--color-black), 0.1);\\n    }\\n\\n    div {\\n        overflow: hidden;\\n    }\\n\\n    p {\\n        font-weight: 600;\\n    }\\n\\n    span {\\n        font-weight: 300;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA6BI,EAAE,eAAC,CAAC,AACA,KAAK,CAAE,IAAI;IACf,CAAC,AAED,EAAE,eAAC,CAAC,AACA,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,AACf,CAAC,AAED,iBAAE,KAAK,WAAW,CAAC,AAAC,CAAC,AACjB,aAAa,CAAE,GAAG,CAAC,MAAM,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AAC3D,CAAC,AAED,GAAG,eAAC,CAAC,AACD,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,CAAC,eAAC,CAAC,AACC,WAAW,CAAE,GAAG,AACpB,CAAC,AAED,IAAI,eAAC,CAAC,AACF,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

const DonatorsCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$l);

	return `${Array.isArray(items) && items.length
	? `${validate_component(Card, "Card").$$render($$result, {}, {}, {
			default: () => `
        <ul class="${"svelte-17ncppz"}">
            ${each(items, item => `${item.title && item.src
			? `<li class="${"svelte-17ncppz"}">
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
                        <s></s>
                        <s></s>
                        <s></s>
                        <s></s>
                        <div class="${"svelte-17ncppz"}">
                            <p class="${"h1 text-ellipsis svelte-17ncppz"}">${escape(item.title)}</p>
                            <span class="${"h5 text-ellipsis svelte-17ncppz"}">${escape(item.subtitle)}<span class="${"svelte-17ncppz"}"></span>
                        </span></div>
                    </li>`
			: ``}`)}
        </ul>
    `
		})}`
	: ``}`;
});

/* src/layouts/DonatorsList.svelte generated by Svelte v3.18.1 */

const css$m = {
	code: "ul.svelte-1nvgbbo{width:100%;display:flex;flex-direction:row-reverse;align-items:flex-start;max-width:100%;overflow-y:hidden;overflow-x:auto;padding:var(--screen-padding) 0}li.svelte-1nvgbbo{align-self:stretch;width:300px;padding:0 5px}li.svelte-1nvgbbo:last-child{padding-left:15px}li.svelte-1nvgbbo:first-child{padding-right:15px}",
	map: "{\"version\":3,\"file\":\"DonatorsList.svelte\",\"sources\":[\"DonatorsList.svelte\"],\"sourcesContent\":[\"<script>\\n    import DonatorsCard from './DonatorsCard.svelte'\\n\\n    const cardSample = {\\n        src: 'https://placeimg.com/300/300/people',\\n        title: '10грн',\\n        subtitle: 'Tina Kandelaki de-junior de-junior',\\n    }\\n\\n    const all = new Array(5).fill(cardSample)\\n\\n    const grouped = all.map(one => new Array(3).fill(one))\\n</script>\\n\\n<ul class=\\\"scroll-x-center\\\">\\n    {#each grouped as cards}\\n        <li>\\n            <DonatorsCard items={cards} />\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    ul {\\n        width: 100%;\\n        display: flex;\\n        flex-direction: row-reverse;\\n        align-items: flex-start;\\n        max-width: 100%;\\n        overflow-y: hidden;\\n        overflow-x: auto;\\n        padding: var(--screen-padding) 0;\\n    }\\n\\n    li {\\n        align-self: stretch;\\n        width: 300px;\\n        padding: 0 5px;\\n    }\\n\\n    li:last-child {\\n        padding-left: 15px;\\n    }\\n\\n    li:first-child {\\n        padding-right: 15px;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAuBI,EAAE,eAAC,CAAC,AACA,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,WAAW,CAC3B,WAAW,CAAE,UAAU,CACvB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAAC,CAAC,AACpC,CAAC,AAED,EAAE,eAAC,CAAC,AACA,UAAU,CAAE,OAAO,CACnB,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,iBAAE,WAAW,AAAC,CAAC,AACX,YAAY,CAAE,IAAI,AACtB,CAAC,AAED,iBAAE,YAAY,AAAC,CAAC,AACZ,aAAa,CAAE,IAAI,AACvB,CAAC\"}"
};

const DonatorsList = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const cardSample = {
		src: "https://placeimg.com/300/300/people",
		title: "10грн",
		subtitle: "Tina Kandelaki de-junior de-junior"
	};

	const all = new Array(5).fill(cardSample);
	const grouped = all.map(one => new Array(3).fill(one));
	$$result.css.add(css$m);

	return `<ul class="${"scroll-x-center svelte-1nvgbbo"}">
    ${each(grouped, cards => `<li class="${"svelte-1nvgbbo"}">
            ${validate_component(DonatorsCard, "DonatorsCard").$$render($$result, { items: cards }, {}, {})}
        </li>`)}
</ul>`;
});

/* src/layouts/TitleSubTitle.svelte generated by Svelte v3.18.1 */

const css$n = {
	code: "section.svelte-y1uq32{text-align:center;padding:0 3vw}h2.svelte-y1uq32{font-weight:400}",
	map: "{\"version\":3,\"file\":\"TitleSubTitle.svelte\",\"sources\":[\"TitleSubTitle.svelte\"],\"sourcesContent\":[\"<script>\\n    export let title = 'The main title that explains the charity'\\n    export let subtitle = 'And bigger description that describes in short keywords a charity, title above and just makes text longer'\\n</script>\\n\\n<section>\\n    <h1>{title}</h1>\\n    <br>\\n    <h2>{subtitle}</h2>\\n</section>\\n\\n<style>\\n    section {\\n        text-align: center;\\n        padding: 0 3vw;\\n    }\\n\\n    h2 {\\n        font-weight: 400;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAYI,OAAO,cAAC,CAAC,AACL,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

const TitleSubTitle = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = "The main title that explains the charity" } = $$props;
	let { subtitle = "And bigger description that describes in short keywords a charity, title above and just makes text longer" } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$n);

	return `<section class="${"svelte-y1uq32"}">
    <h1>${escape(title)}</h1>
    <br>
    <h2 class="${"svelte-y1uq32"}">${escape(subtitle)}</h2>
</section>`;
});

/* src/layouts/DonatingGroup.svelte generated by Svelte v3.18.1 */

const css$o = {
	code: "ul.svelte-1k5eog2.svelte-1k5eog2{flex:0;display:flex;flex-direction:column;margin:calc(var(--screen-padding) * -1 / 2) 0;padding:0 0 0 var(--screen-padding)}ul.svelte-1k5eog2 li.svelte-1k5eog2{flex:none;margin:calc(var(--screen-padding) / 2) 0}",
	map: "{\"version\":3,\"file\":\"DonatingGroup.svelte\",\"sources\":[\"DonatingGroup.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Input, Button } from '../components'\\n</script>\\n\\n<ul>\\n    <li>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">50</Button>\\n    </li>\\n    <li>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">100</Button>\\n    </li>\\n    <li>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">200</Button>\\n    </li>\\n    <li>\\n        <br>\\n        <Input\\n                type=\\\"number\\\"\\n                name=\\\"num\\\"\\n                list=\\\"sum-suggestions\\\"\\n                placeholder=\\\"Num\\\"\\n                autoselect\\n                align=\\\"right\\\"\\n                value=\\\"1000\\\"\\n        />\\n\\n        <datalist id=\\\"sum-suggestions\\\">\\n            <option value=\\\"20\\\">\\n            <option value=\\\"500\\\">\\n            <option value=\\\"1000\\\">\\n        </datalist>\\n    </li>\\n    <li>\\n        <Button is=\\\"warning\\\" on:click=\\\"{e => console.log(e)}\\\">Donate</Button>\\n    </li>\\n</ul>\\n\\n<style>\\n    ul {\\n        flex: 0;\\n        display: flex;\\n        flex-direction: column;\\n        margin: calc(var(--screen-padding) * -1 / 2) 0;\\n        padding: 0 0 0 var(--screen-padding);\\n    }\\n\\n    ul li {\\n        flex: none;\\n        margin: calc(var(--screen-padding) / 2) 0;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAsCI,EAAE,8BAAC,CAAC,AACA,IAAI,CAAE,CAAC,CACP,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9C,OAAO,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACxC,CAAC,AAED,iBAAE,CAAC,EAAE,eAAC,CAAC,AACH,IAAI,CAAE,IAAI,CACV,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC7C,CAAC\"}"
};

const DonatingGroup = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$o);

	return `<ul class="${"svelte-1k5eog2"}">
    <li class="${"svelte-1k5eog2"}">
        ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `50` })}
    </li>
    <li class="${"svelte-1k5eog2"}">
        ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `100` })}
    </li>
    <li class="${"svelte-1k5eog2"}">
        ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `200` })}
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
			align: "right",
			value: "1000"
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
        ${validate_component(Button, "Button").$$render($$result, { is: "warning" }, {}, { default: () => `Donate` })}
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

/* src/layouts/ContactsHolder.svelte generated by Svelte v3.18.1 */

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

/* src/layouts/ListOfFeatures.svelte generated by Svelte v3.18.1 */

const css$p = {
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

	$$result.css.add(css$p);

	return `<ul class="${"svelte-14memlh"}">
    ${each(items, item => `<li class="${"svelte-14memlh"}">
            <h3 class="${"svelte-14memlh"}">${escape(item.title)}</h3>
            <p class="${"svelte-14memlh"}">${escape(item.text)}</p>
            <br>
        </li>`)}
</ul>`;
});

/* src/routes/index.svelte generated by Svelte v3.18.1 */

const css$q = {
	code: ".top-pic.svelte-b9nco9{flex:none;z-index:0;width:100%;height:200px;display:flex;overflow:hidden;border-radius:0}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<script>\\n    import {\\n        Footer,\\n        Comments,\\n        CharityCards,\\n        ContentHolder,\\n        TitleSubTitle,\\n        ListOfFeatures,\\n    } from '../layouts'\\n    import {\\n        Divider,\\n        Progress,\\n        Carousel,\\n    } from '../components'\\n</script>\\n\\n<style>\\n    .top-pic {\\n        flex: none;\\n        z-index: 0;\\n        width: 100%;\\n        height: 200px;\\n        display: flex;\\n        overflow: hidden;\\n        border-radius: 0;\\n    }\\n</style>\\n\\n<svelte:head>\\n    <title>Charitify - list of charities you can donate.</title>\\n</svelte:head>\\n\\n<section class=\\\"scroll-box\\\">\\n\\n    <div class=\\\"top-pic\\\">\\n        <Carousel/>\\n    </div>\\n\\n    <Progress borderRadius=\\\"0 0 8px 8px\\\" value=\\\"30\\\"/>\\n\\n    <p>These guys rise a pound of vegetables. They like vegetables and long text under photos.</p>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <section class=\\\"container\\\">\\n\\n        <TitleSubTitle\\n                title=\\\"Charitify\\\"\\n                subtitle=\\\"Charity application for helping those in need\\\"\\n        />\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <Carousel amount=\\\"2\\\">\\n            <CharityCards amount=\\\"2\\\" listName=\\\"Nearest to you:\\\"/>\\n        </Carousel>\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <ContentHolder/>\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <Divider size=\\\"16\\\"/>\\n        <h3 class=\\\"h2 text-right\\\">Comments:</h3>\\n        <Divider size=\\\"20\\\"/>\\n\\n        <Comments withFrom={false}/>\\n\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n\\n            <ContentHolder/>\\n\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n\\n            <ListOfFeatures/>\\n    </section>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Footer/>\\n\\n</section>\\n\"],\"names\":[],\"mappings\":\"AAiBI,QAAQ,cAAC,CAAC,AACN,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,CAAC,CACV,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,CAAC,AACpB,CAAC\"}"
};

const Routes = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$q);

	return `${($$result.head += `${($$result.title = `<title>Charitify - list of charities you can donate.</title>`, "")}`, "")}

<section class="${"scroll-box"}">

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

const css$r = {
	code: ".top.svelte-uz5elz{display:flex;margin-bottom:calc(var(--screen-padding) * 1.5);margin-top:var(--screen-padding)}.pics-wrap.svelte-uz5elz{z-index:0;flex-grow:1;display:flex;overflow:hidden;margin-bottom:2px;border-radius:var(--border-radius);box-shadow:var(--shadow-primary)}.rate-section.svelte-uz5elz{display:flex;align-items:flex-end;justify-content:space-between;padding:12px 0}",
	map: "{\"version\":3,\"file\":\"[id].svelte\",\"sources\":[\"[id].svelte\"],\"sourcesContent\":[\"<script>\\n    import { stores } from '@sapper/app';\\n    const { page } = stores();\\n    import { onMount } from 'svelte'\\n    import { api } from '../../services'\\n    import {\\n        Footer,\\n        Comments,\\n        CharityCards,\\n        TitleSubTitle,\\n        AvatarAndName,\\n        DonatingGroup,\\n        ContentHolder,\\n        ContactsHolder,\\n    } from '../../layouts'\\n    import { Rate, Progress, Carousel, Divider } from '../../components'\\n\\n    let organizationId = $page.params.id\\n    let organization = {}\\n\\n    $: carousel = (organization.avatars || []).map(src => ({ src }))\\n\\n    onMount(async () => {\\n        await new Promise(r => setTimeout(r, 2000))\\n        organization = await api.getOrganization(1)\\n    })\\n\\n    $: console.log(organizationId)\\n</script>\\n\\n<svelte:head>\\n    <title>Charitify - Organization page.</title>\\n</svelte:head>\\n\\n<style>\\n    .top {\\n        display: flex;\\n        margin-bottom: calc(var(--screen-padding) * 1.5);\\n        margin-top: var(--screen-padding);\\n    }\\n\\n    .pics-wrap {\\n        z-index: 0;\\n        flex-grow: 1;\\n        display: flex;\\n        overflow: hidden;\\n        margin-bottom: 2px;\\n        border-radius: var(--border-radius);\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    .rate-section {\\n        display: flex;\\n        align-items: flex-end;\\n        justify-content: space-between;\\n        padding: 12px 0;\\n    }\\n</style>\\n\\n<section class=\\\"container scroll-box\\\">\\n\\n    <section>\\n        <br>\\n        <TitleSubTitle\\n                title={organization.title}\\n                subtitle={organization.description}\\n        />\\n        <br>\\n    </section>\\n\\n    <section class=\\\"top\\\">\\n        <div class=\\\"pics-wrap\\\">\\n            <Carousel items={carousel}/>\\n        </div>\\n\\n        <DonatingGroup/>\\n    </section>\\n\\n    <Progress value=\\\"65\\\" size=\\\"big\\\"/>\\n\\n    <a class=\\\"rate-section\\\" href=\\\"users/me\\\">\\n        <AvatarAndName\\n                src={organization.org_head_avatar}\\n                title={organization.org_head}\\n        />\\n\\n        <Rate/>\\n    </a>\\n\\n    <br>\\n\\n    {#if organization.id}\\n        <p class=\\\"text-center\\\">\\n            <a class=\\\"btn success\\\" href={`map/${organization.id}`}>On the map</a>\\n        </p>\\n    {/if}\\n\\n    <br>\\n    <br>\\n    <br>\\n\\n    <ContentHolder/>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Divider size=\\\"16\\\"/>\\n    <h3 class=\\\"h2 text-right\\\">Charities of the organization:</h3>\\n    <Divider size=\\\"20\\\"/>\\n    <br>\\n    <Carousel amount=\\\"5\\\">\\n        <CharityCards amount=\\\"2\\\"/>\\n    </Carousel>\\n\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <ContactsHolder/>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Divider size=\\\"20\\\"/>\\n    <h3 class=\\\"h2 text-right\\\">Comments:</h3>\\n    <Divider size=\\\"16\\\"/>\\n\\n    <Comments/>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n</section>\\n\\n<Footer/>\\n\\n\"],\"names\":[],\"mappings\":\"AAmCI,IAAI,cAAC,CAAC,AACF,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAChD,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,UAAU,cAAC,CAAC,AACR,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,aAAa,cAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,QAAQ,CACrB,eAAe,CAAE,aAAa,CAC9B,OAAO,CAAE,IAAI,CAAC,CAAC,AACnB,CAAC\"}"
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

	$$result.css.add(css$r);
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

    <section class="${"top svelte-uz5elz"}">
        <div class="${"pics-wrap svelte-uz5elz"}">
            ${validate_component(Carousel, "Carousel").$$render($$result, { items: carousel }, {}, {})}
        </div>

        ${validate_component(DonatingGroup, "DonatingGroup").$$render($$result, {}, {}, {})}
    </section>

    ${validate_component(Progress, "Progress").$$render($$result, { value: "65", size: "big" }, {}, {})}

    <a class="${"rate-section svelte-uz5elz"}" href="${"users/me"}">
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

const css$s = {
	code: "table.svelte-usm0kx td.svelte-usm0kx:first-child{font-weight:bold}table.svelte-usm0kx td.svelte-usm0kx:last-child{text-align:justify}",
	map: "{\"version\":3,\"file\":\"[id].svelte\",\"sources\":[\"[id].svelte\"],\"sourcesContent\":[\"<script>\\n    import { stores } from '@sapper/app'\\n\\n    const { page } = stores()\\n    import { onMount } from 'svelte'\\n    import { api } from '../../services'\\n    import {\\n        Footer,\\n        Comments,\\n        CharityCards,\\n        TitleSubTitle,\\n        AvatarAndName,\\n        DonatingGroup,\\n        ContactsHolder,\\n        TrustButton,\\n        DonatorsList,\\n        Documents,\\n    } from '../../layouts'\\n    import { Button, Progress, Carousel, Divider, Card, Icon, Avatar } from '../../components'\\n\\n    let charityId = $page.params.id\\n\\n    let charity = {}\\n\\n    $: carousel = (charity.avatars || []).map(p => ({ src: p, alt: 'photo' }))\\n\\n    onMount(async () => {\\n        charity = await api.getFund(1)\\n    })\\n\\n    let active = false\\n\\n    async function onClick() {\\n        active = !active\\n    }\\n</script>\\n\\n<svelte:head>\\n    <title>Charitify - Charity page and donate.</title>\\n</svelte:head>\\n\\n<style>\\n    table td:first-child {\\n        font-weight: bold;\\n    }\\n    table td:last-child {\\n        text-align: justify;\\n    }\\n</style>\\n\\n<section class=\\\"container scroll-box theme-bg-color-secondary\\\">\\n\\n    <br>\\n    <br>\\n\\n    <section class=\\\"flex\\\" style=\\\"height: 200px\\\">\\n        <Carousel items={carousel}/>\\n    </section>\\n\\n    <br>\\n\\n    <Button class=\\\"white\\\">\\n        OrgAva\\n    </Button>\\n\\n    <br>\\n\\n    <Card class=\\\"container\\\">\\n        <br>\\n        <br class=\\\"small\\\">\\n\\n        <h1>Save dogs together</h1>\\n        <br class=\\\"small\\\">\\n        <h4 style=\\\"color: rgba(var(--color-black), .7)\\\">Racing money for charity</h4>\\n\\n        <br>\\n        <br class=\\\"small\\\">\\n\\n        <p>\\n            <span class=\\\"h1\\\">600$</span>\\n            <span class=\\\"h3\\\"> / 1150$</span>\\n        </p>\\n\\n        <br>\\n\\n        <Progress value=\\\"60\\\"/>\\n\\n        <br class=\\\"big\\\">\\n    </Card>\\n\\n    <br>\\n\\n    <p class=\\\"container flex flex-justify-between flex-align-center\\\">\\n            <span class=\\\"flex flex-align-center\\\">\\n                <Icon is=\\\"danger\\\" type=\\\"heart-filled\\\"/>\\n                <s></s>\\n                23\\n            </span>\\n        <span class=\\\"flex flex-align-center\\\">\\n                <Icon is=\\\"dark\\\" type=\\\"eye\\\"/>\\n                <s></s>\\n                120\\n            </span>\\n    </p>\\n\\n    <br class=\\\"big\\\">\\n\\n    <h1>Save dogs together</h1>\\n    <br>\\n    <p style=\\\"text-align: justify\\\">\\n        But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and\\n        I will give you a complete account of the system, and expound the actual teachings I must explain to you how\\n        all this mistaken idea of denouncing pleasure and praising pain was born and I will give\\n    </p>\\n\\n    <br>\\n    <br>\\n    <br>\\n\\n    <section class=\\\"flex flex-column flex-align-center flex-justify-center\\\">\\n        <div style=\\\"width: 100px; max-width: 100%\\\">\\n            <TrustButton isActive={active} on:click={onClick}/>\\n        </div>\\n        <br class=\\\"small\\\">\\n        <p class=\\\"h2\\\">I trust</p>\\n    </section>\\n\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Card class=\\\"container\\\">\\n        <br class=\\\"big\\\">\\n\\n        <div class=\\\"flex flex-column flex-align-center\\\">\\n            <Avatar size=\\\"big\\\" src=\\\"https://placeimg.com/300/300/animal\\\"/>\\n\\n            <br class=\\\"big\\\">\\n\\n            <h1>Volter</h1>\\n            <br class=\\\"tiny\\\">\\n            <p>Jack Russell Terrier</p>\\n        </div>\\n\\n        <br class=\\\"big\\\">\\n\\n        <p class=\\\"h1\\\">Сharacter of pet</p>\\n        <br class=\\\"tiny\\\">\\n        <p style=\\\"text-align: justify\\\">\\n            Very playfull and cute dog. And must explain to you how all this mistaken idea of\\n        </p>\\n\\n        <br class=\\\"big\\\">\\n\\n        <p class=\\\"h1\\\">History of pet</p>\\n        <br class=\\\"tiny\\\">\\n        <table>\\n            <tbody>\\n            <tr>\\n                <td>01.02.2019</td>\\n                <td>—</td>\\n                <td>His first Happy Birthday</td>\\n            </tr>\\n            <tr>\\n                <td>05.02.2019</td>\\n                <td>—</td>\\n                <td>We got him from the owners at the shelter</td>\\n            </tr>\\n            <tr>\\n                <td>07.03.2019</td>\\n                <td>—</td>\\n                <td>We do a vaccination for him from fleas</td>\\n            </tr>\\n            <tr>\\n                <td>23.06.2019</td>\\n                <td>—</td>\\n                <td>We do anouter vaccination</td>\\n            </tr>\\n            </tbody>\\n        </table>\\n\\n        <br class=\\\"big\\\">\\n\\n        <p class=\\\"h1\\\">Vaccination</p>\\n        <br>\\n        <ul class=\\\"flex flex-column\\\">\\n            <li>\\n                <span class=\\\"flex flex-align-center\\\">\\n                    <Icon is=\\\"primary\\\" type=\\\"checked-circle\\\"/> <s></s> From something\\n                </span>\\n            </li>\\n            <li>\\n                <br>\\n                <span class=\\\"flex flex-align-center\\\">\\n                    <Icon is=\\\"primary\\\" type=\\\"checked-circle\\\"/> <s></s> From something else\\n                </span>\\n            </li>\\n            <li>\\n                <br>\\n                <span class=\\\"flex flex-align-center\\\">\\n                    <Icon is=\\\"danger\\\" type=\\\"cancel-circle\\\"/> <s></s> From another\\n                </span>\\n            </li>\\n        </ul>\\n\\n        <br class=\\\"big\\\">\\n    </Card>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <p class=\\\"h1\\\">Last donates</p>\\n    <div class=\\\"full-container\\\">\\n        <DonatorsList/>\\n    </div>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <p class=\\\"h1\\\">Documents</p>\\n    <div class=\\\"full-container\\\">\\n        <Documents/>\\n    </div>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <p class=\\\"h1\\\">Videos about pet</p>\\n    <br>\\n    <section class=\\\"flex\\\" style=\\\"height: 200px\\\">\\n        <Carousel items={carousel}/>\\n    </section>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <p class=\\\"h1\\\">Contacts</p>\\n    <br>\\n    <ul style=\\\"list-style: disc outside none; padding-left: var(--screen-padding)\\\">\\n        <li>You can buy food for Volter</li>\\n        <li>Visit Volter by yourself in our shelter</li>\\n        <li>Buy vaccination for Volter</li>\\n        <li>Help by other way</li>\\n    </ul>\\n    <br class=\\\"big\\\">\\n    <div class=\\\"flex\\\">\\n        <p class=\\\"flex flex-align-center\\\">\\n            <Icon is=\\\"dark\\\" type=\\\"phone\\\"/>\\n            <s></s>\\n            <s></s>\\n            <span class=\\\"h2 text-bold\\\">+38 (093) 205-43-92</span>\\n        </p>\\n    </div>\\n    <p>Call us if you want to help our pet</p>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n    <p class=\\\"h1\\\">Comments </p>\\n    <br>\\n    <br class=\\\"small\\\">\\n    <Comments/>\\n\\n    <br class=\\\"big\\\">\\n    <br class=\\\"big\\\">\\n\\n</section>\\n\\n\"],\"names\":[],\"mappings\":\"AA0CI,mBAAK,CAAC,gBAAE,YAAY,AAAC,CAAC,AAClB,WAAW,CAAE,IAAI,AACrB,CAAC,AACD,mBAAK,CAAC,gBAAE,WAAW,AAAC,CAAC,AACjB,UAAU,CAAE,OAAO,AACvB,CAAC\"}"
};

const U5Bidu5D$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $page;
	const { page } = stores$1();
	$page = get_store_value(page);
	let charityId = $page.params.id;
	let charity = {};

	onMount(async () => {
		charity = await api.getFund(1);
	});

	let active = false;

	$$result.css.add(css$s);
	$page = get_store_value(page);
	let carousel = (charity.avatars || []).map(p => ({ src: p, alt: "photo" }));

	return `${($$result.head += `${($$result.title = `<title>Charitify - Charity page and donate.</title>`, "")}`, "")}



<section class="${"container scroll-box theme-bg-color-secondary"}">

    <br>
    <br>

    <section class="${"flex"}" style="${"height: 200px"}">
        ${validate_component(Carousel, "Carousel").$$render($$result, { items: carousel }, {}, {})}
    </section>

    <br>

    ${validate_component(Button, "Button").$$render($$result, { class: "white" }, {}, {
		default: () => `
        OrgAva
    `
	})}

    <br>

    ${validate_component(Card, "Card").$$render($$result, { class: "container" }, {}, {
		default: () => `
        <br>
        <br class="${"small"}">

        <h1>Save dogs together</h1>
        <br class="${"small"}">
        <h4 style="${"color: rgba(var(--color-black), .7)"}">Racing money for charity</h4>

        <br>
        <br class="${"small"}">

        <p>
            <span class="${"h1"}">600$</span>
            <span class="${"h3"}"> / 1150$</span>
        </p>

        <br>

        ${validate_component(Progress, "Progress").$$render($$result, { value: "60" }, {}, {})}

        <br class="${"big"}">
    `
	})}

    <br>

    <p class="${"container flex flex-justify-between flex-align-center"}">
            <span class="${"flex flex-align-center"}">
                ${validate_component(Icon, "Icon").$$render($$result, { is: "danger", type: "heart-filled" }, {}, {})}
                <s></s>
                23
            </span>
        <span class="${"flex flex-align-center"}">
                ${validate_component(Icon, "Icon").$$render($$result, { is: "dark", type: "eye" }, {}, {})}
                <s></s>
                120
            </span>
    </p>

    <br class="${"big"}">

    <h1>Save dogs together</h1>
    <br>
    <p style="${"text-align: justify"}">
        But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and
        I will give you a complete account of the system, and expound the actual teachings I must explain to you how
        all this mistaken idea of denouncing pleasure and praising pain was born and I will give
    </p>

    <br>
    <br>
    <br>

    <section class="${"flex flex-column flex-align-center flex-justify-center"}">
        <div style="${"width: 100px; max-width: 100%"}">
            ${validate_component(TrustButton, "TrustButton").$$render($$result, { isActive: active }, {}, {})}
        </div>
        <br class="${"small"}">
        <p class="${"h2"}">I trust</p>
    </section>

    <br>
    <br>
    <br>

    ${validate_component(Card, "Card").$$render($$result, { class: "container" }, {}, {
		default: () => `
        <br class="${"big"}">

        <div class="${"flex flex-column flex-align-center"}">
            ${validate_component(Avatar, "Avatar").$$render(
			$$result,
			{
				size: "big",
				src: "https://placeimg.com/300/300/animal"
			},
			{},
			{}
		)}

            <br class="${"big"}">

            <h1>Volter</h1>
            <br class="${"tiny"}">
            <p>Jack Russell Terrier</p>
        </div>

        <br class="${"big"}">

        <p class="${"h1"}">Сharacter of pet</p>
        <br class="${"tiny"}">
        <p style="${"text-align: justify"}">
            Very playfull and cute dog. And must explain to you how all this mistaken idea of
        </p>

        <br class="${"big"}">

        <p class="${"h1"}">History of pet</p>
        <br class="${"tiny"}">
        <table class="${"svelte-usm0kx"}">
            <tbody>
            <tr>
                <td class="${"svelte-usm0kx"}">01.02.2019</td>
                <td class="${"svelte-usm0kx"}">—</td>
                <td class="${"svelte-usm0kx"}">His first Happy Birthday</td>
            </tr>
            <tr>
                <td class="${"svelte-usm0kx"}">05.02.2019</td>
                <td class="${"svelte-usm0kx"}">—</td>
                <td class="${"svelte-usm0kx"}">We got him from the owners at the shelter</td>
            </tr>
            <tr>
                <td class="${"svelte-usm0kx"}">07.03.2019</td>
                <td class="${"svelte-usm0kx"}">—</td>
                <td class="${"svelte-usm0kx"}">We do a vaccination for him from fleas</td>
            </tr>
            <tr>
                <td class="${"svelte-usm0kx"}">23.06.2019</td>
                <td class="${"svelte-usm0kx"}">—</td>
                <td class="${"svelte-usm0kx"}">We do anouter vaccination</td>
            </tr>
            </tbody>
        </table>

        <br class="${"big"}">

        <p class="${"h1"}">Vaccination</p>
        <br>
        <ul class="${"flex flex-column"}">
            <li>
                <span class="${"flex flex-align-center"}">
                    ${validate_component(Icon, "Icon").$$render($$result, { is: "primary", type: "checked-circle" }, {}, {})} <s></s> From something
                </span>
            </li>
            <li>
                <br>
                <span class="${"flex flex-align-center"}">
                    ${validate_component(Icon, "Icon").$$render($$result, { is: "primary", type: "checked-circle" }, {}, {})} <s></s> From something else
                </span>
            </li>
            <li>
                <br>
                <span class="${"flex flex-align-center"}">
                    ${validate_component(Icon, "Icon").$$render($$result, { is: "danger", type: "cancel-circle" }, {}, {})} <s></s> From another
                </span>
            </li>
        </ul>

        <br class="${"big"}">
    `
	})}

    <br class="${"big"}">
    <br class="${"big"}">

    <p class="${"h1"}">Last donates</p>
    <div class="${"full-container"}">
        ${validate_component(DonatorsList, "DonatorsList").$$render($$result, {}, {}, {})}
    </div>

    <br class="${"big"}">
    <br class="${"big"}">

    <p class="${"h1"}">Documents</p>
    <div class="${"full-container"}">
        ${validate_component(Documents, "Documents").$$render($$result, {}, {}, {})}
    </div>

    <br class="${"big"}">
    <br class="${"big"}">

    <p class="${"h1"}">Videos about pet</p>
    <br>
    <section class="${"flex"}" style="${"height: 200px"}">
        ${validate_component(Carousel, "Carousel").$$render($$result, { items: carousel }, {}, {})}
    </section>

    <br class="${"big"}">
    <br class="${"big"}">

    <p class="${"h1"}">Contacts</p>
    <br>
    <ul style="${"list-style: disc outside none; padding-left: var(--screen-padding)"}">
        <li>You can buy food for Volter</li>
        <li>Visit Volter by yourself in our shelter</li>
        <li>Buy vaccination for Volter</li>
        <li>Help by other way</li>
    </ul>
    <br class="${"big"}">
    <div class="${"flex"}">
        <p class="${"flex flex-align-center"}">
            ${validate_component(Icon, "Icon").$$render($$result, { is: "dark", type: "phone" }, {}, {})}
            <s></s>
            <s></s>
            <span class="${"h2 text-bold"}">+38 (093) 205-43-92</span>
        </p>
    </div>
    <p>Call us if you want to help our pet</p>

    <br class="${"big"}">
    <br class="${"big"}">

    <p class="${"h1"}">Comments </p>
    <br>
    <br class="${"small"}">
    ${validate_component(Comments, "Comments").$$render($$result, {}, {}, {})}

    <br class="${"big"}">
    <br class="${"big"}">

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
    ${validate_component(ListItems, "ListItems").$$render($$result, { items: chariries, basePath: "charities" }, {}, {})}
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

const css$t = {
	code: "section.svelte-16ij8e1{display:flex;align-items:center;flex-direction:column}ul.svelte-16ij8e1{display:flex;justify-content:center;flex-wrap:wrap;margin:0 -5px}li.svelte-16ij8e1{flex:1 1 50%;padding:5px}.user-avatar.svelte-16ij8e1{flex:none;display:flex;align-items:center;justify-content:center;width:100px;height:100px;border-radius:50%;overflow:hidden;box-shadow:var(--shadow-primary);background-color:rgba(var(--theme-bg-color))}",
	map: "{\"version\":3,\"file\":\"me.svelte\",\"sources\":[\"me.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Input, Picture, Button, Space } from '../../components'\\n\\n    const inputs = [\\n        {\\n            placeholder: 'username',\\n        },\\n        {\\n            placeholder: 'Full name',\\n        },\\n        {\\n            placeholder: 'sex (checkboxes or dropdown)',\\n        },\\n        {\\n            placeholder: 'birth',\\n        },\\n        {\\n            placeholder: 'email',\\n        },\\n        {\\n            placeholder: 'tel',\\n        },\\n        {\\n            placeholder: 'location (autocomplete)',\\n        },\\n    ]\\n\\n    const USERNAME = 'bublikus.script'\\n</script>\\n\\n<section class=\\\"container\\\">\\n    <br>\\n    <div class=\\\"user-avatar\\\">\\n        <Picture src=\\\"https://placeimg.com/100/100/people\\\" alt=\\\"user avatar\\\"/>\\n    </div>\\n    <br>\\n    <br>\\n    <section style=\\\"display: flex; flex-direction: row\\\">\\n        <Button is=\\\"success\\\" auto>success</Button>\\n        <Space size=\\\"2\\\"/>\\n        <Button is=\\\"warning\\\" auto>warning</Button>\\n        <Space size=\\\"2\\\"/>\\n        <Button is=\\\"danger\\\" auto>danger</Button>\\n        <Space size=\\\"2\\\"/>\\n        <Button is=\\\"info\\\" auto>info</Button>\\n    </section>\\n    <br>\\n    <br>\\n    <a href={`https://instagram.com/${USERNAME}/`}>Link to Instagram Page</a>\\n    <br>\\n    <br>\\n    <a href={`instagram://user?username=${USERNAME}`}>Link to Instagram Profile</a>\\n    <br>\\n    <br>\\n    <ul>\\n        {#each inputs as inp}\\n            <li>\\n                <Input {...inp}/>\\n            </li>\\n        {/each}\\n    </ul>\\n</section>\\n\\n<style>\\n    section {\\n        display: flex;\\n        align-items: center;\\n        flex-direction: column;\\n    }\\n\\n    ul {\\n        display: flex;\\n        justify-content: center;\\n        flex-wrap: wrap;\\n        margin: 0 -5px;\\n    }\\n\\n    li {\\n        flex: 1 1 50%;\\n        padding: 5px;\\n    }\\n\\n    .user-avatar {\\n        flex: none;\\n        display: flex;\\n        align-items: center;\\n        justify-content: center;\\n        width: 100px;\\n        height: 100px;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        box-shadow: var(--shadow-primary);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAgEI,OAAO,eAAC,CAAC,AACL,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,cAAc,CAAE,MAAM,AAC1B,CAAC,AAED,EAAE,eAAC,CAAC,AACA,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,CAAC,CAAC,IAAI,AAClB,CAAC,AAED,EAAE,eAAC,CAAC,AACA,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CACb,OAAO,CAAE,GAAG,AAChB,CAAC,AAED,YAAY,eAAC,CAAC,AACV,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC\"}"
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

	$$result.css.add(css$t);

	return `<section class="${"container svelte-16ij8e1"}">
    <br>
    <div class="${"user-avatar svelte-16ij8e1"}">
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
    <section style="${"display: flex; flex-direction: row"}" class="${"svelte-16ij8e1"}">
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
    <ul class="${"svelte-16ij8e1"}">
        ${each(inputs, inp => `<li class="${"svelte-16ij8e1"}">
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
