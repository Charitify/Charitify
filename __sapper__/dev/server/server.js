'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sirv = _interopDefault(require('sirv'));
var polka = _interopDefault(require('polka'));
var compression = _interopDefault(require('compression'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var classnames = _interopDefault(require('classnames'));
var Stream = _interopDefault(require('stream'));
var http = _interopDefault(require('http'));
var Url = _interopDefault(require('url'));
var https = _interopDefault(require('https'));
var zlib = _interopDefault(require('zlib'));

// Ordinarily, you'd generate this data from markdown files in your
// repo, or fetch them from a database of some kind. But in order to
// avoid unnecessary dependencies in the starter template, and in the
// service of obviousness, we're just going to leave it here.

// This file is called `_posts.js` rather than `posts.js`, because
// we don't want to create an `/blog/posts` route — the leading
// underscore tells Sapper not to do that.

const posts = [
	{
		title: 'What is Sapper?',
		slug: 'what-is-sapper',
		html: `
			<p>First, you have to know what <a href='https://svelte.dev'>Svelte</a> is. Svelte is a UI framework with a bold new idea: rather than providing a library that you write code with (like React or Vue, for example), it's a compiler that turns your components into highly optimized vanilla JavaScript. If you haven't already read the <a href='https://svelte.dev/blog/frameworks-without-the-framework'>introductory blog post</a>, you should!</p>

			<p>Sapper is a Next.js-style framework (<a href='blog/how-is-sapper-different-from-next'>more on that here</a>) built around Svelte. It makes it embarrassingly easy to create extremely high performance web apps. Out of the box, you get:</p>

			<ul>
				<li>Code-splitting, dynamic imports and hot module replacement, powered by webpack</li>
				<li>Server-side rendering (SSR) with client-side hydration</li>
				<li>Service worker for offline support, and all the PWA bells and whistles</li>
				<li>The nicest development experience you've ever had, or your money back</li>
			</ul>

			<p>It's implemented as Express middleware. Everything is set up and waiting for you to get started, but you keep complete control over the server, service worker, webpack config and everything else, so it's as flexible as you need it to be.</p>
		`
	},

	{
		title: 'How to use Sapper',
		slug: 'how-to-use-sapper',
		html: `
			<h2>Step one</h2>
			<p>Create a new project, using <a href='https://github.com/Rich-Harris/degit'>degit</a>:</p>

			<pre><code>npx degit "sveltejs/sapper-template#rollup" my-app
			cd my-app
			npm install # or yarn!
			npm run dev
			</code></pre>

			<h2>Step two</h2>
			<p>Go to <a href='http://localhost:3000'>localhost:3000</a>. Open <code>my-app</code> in your editor. Edit the files in the <code>src/routes</code> directory or add new ones.</p>

			<h2>Step three</h2>
			<p>...</p>

			<h2>Step four</h2>
			<p>Resist overdone joke formats.</p>
		`
	},

	{
		title: 'Why the name?',
		slug: 'why-the-name',
		html: `
			<p>In war, the soldiers who build bridges, repair roads, clear minefields and conduct demolitions — all under combat conditions — are known as <em>sappers</em>.</p>

			<p>For web developers, the stakes are generally lower than those for combat engineers. But we face our own hostile environment: underpowered devices, poor network connections, and the complexity inherent in front-end engineering. Sapper, which is short for <strong>S</strong>velte <strong>app</strong> mak<strong>er</strong>, is your courageous and dutiful ally.</p>
		`
	},

	{
		title: 'How is Sapper different from Next.js?',
		slug: 'how-is-sapper-different-from-next',
		html: `
			<p><a href='https://github.com/zeit/next.js'>Next.js</a> is a React framework from <a href='https://zeit.co'>Zeit</a>, and is the inspiration for Sapper. There are a few notable differences, however:</p>

			<ul>
				<li>It's powered by <a href='https://svelte.dev'>Svelte</a> instead of React, so it's faster and your apps are smaller</li>
				<li>Instead of route masking, we encode route parameters in filenames. For example, the page you're looking at right now is <code>src/routes/blog/[slug].html</code></li>
				<li>As well as pages (Svelte components, which render on server or client), you can create <em>server routes</em> in your <code>routes</code> directory. These are just <code>.js</code> files that export functions corresponding to HTTP methods, and receive Express <code>request</code> and <code>response</code> objects as arguments. This makes it very easy to, for example, add a JSON API such as the one <a href='blog/how-is-sapper-different-from-next.json'>powering this very page</a></li>
				<li>Links are just <code>&lt;a&gt;</code> elements, rather than framework-specific <code>&lt;Link&gt;</code> components. That means, for example, that <a href='blog/how-can-i-get-involved'>this link right here</a>, despite being inside a blob of HTML, works with the router as you'd expect.</li>
			</ul>
		`
	},

	{
		title: 'How can I get involved?',
		slug: 'how-can-i-get-involved',
		html: `
			<p>We're so glad you asked! Come on over to the <a href='https://github.com/sveltejs/svelte'>Svelte</a> and <a href='https://github.com/sveltejs/sapper'>Sapper</a> repos, and join us in the <a href='https://svelte.dev/chat'>Discord chatroom</a>. Everyone is welcome, especially you!</p>
		`
	}
];

posts.forEach(post => {
	post.html = post.html.replace(/^\t{3}/gm, '');
});

const contents = JSON.stringify(posts.map(post => {
	return {
		title: post.title,
		slug: post.slug
	};
}));

function get(req, res) {
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});

	res.end(contents);
}

var route_0 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	get: get
});

const lookup = new Map();
posts.forEach(post => {
	lookup.set(post.slug, JSON.stringify(post));
});

function get$1(req, res, next) {
	// the `slug` parameter is available because
	// this file is called [slug].json.js
	const { slug } = req.params;

	if (lookup.has(slug)) {
		res.writeHead(200, {
			'Content-Type': 'application/json'
		});

		res.end(lookup.get(slug));
	} else {
		res.writeHead(404, {
			'Content-Type': 'application/json'
		});

		res.end(JSON.stringify({
			message: `Not found`
		}));
	}
}

var route_1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	get: get$1
});

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
            str += " " + name + "=" + JSON.stringify(String(value)
                .replace(/"/g, '&#34;')
                .replace(/'/g, '&#39;'));
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
            const result = { head: '', css: new Set() };
            const html = $$render(result, props, {}, options);
            run_all(on_destroy);
            return {
                html,
                css: {
                    code: Array.from(result.css).map(css => css.code).join('\n'),
                    map: null // TODO
                },
                head: result.head
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

/* src/plugins/Swipe/Swipe.svelte generated by Svelte v3.16.7 */

const css = {
	code: ".swipe-panel.svelte-tx0axj.svelte-tx0axj{position:relative;height:var(--sv-swipe-panel-height, 100%);width:var(--sv-swipe-panel-width, inherit)}.swipe-item-wrapper.svelte-tx0axj.svelte-tx0axj{display:flex;align-self:stretch;overflow:hidden;position:relative;height:inherit;z-index:var(--sv-swipe-panel-wrapper-index, 2);pointer-events:none}.swipeable-items.svelte-tx0axj.svelte-tx0axj,.swipeable-slot-wrapper.svelte-tx0axj.svelte-tx0axj{display:flex;align-self:stretch;position:relative;width:100%}.swipe-handler.svelte-tx0axj.svelte-tx0axj{width:100%;position:absolute;top:40px;bottom:0px;left:0;right:0;background:rgba(0,0,0,0)}.swipe-indicator.svelte-tx0axj.svelte-tx0axj{position:relative;bottom:1.5rem;display:flex;justify-content:center;z-index:var(--sv-swipe-panel-wrapper-index, 2);pointer-events:none}.dot.svelte-tx0axj.svelte-tx0axj{height:10px;width:10px;background-color:transparent;border:1px solid grey;border-radius:50%;display:inline-block;margin:0px 2px;cursor:pointer;pointer-events:fill}.swipe-indicator.svelte-tx0axj .is-active.svelte-tx0axj{background-color:var(--sv-swipe-indicator-active-color, grey)}",
	map: "{\"version\":3,\"file\":\"Swipe.svelte\",\"sources\":[\"Swipe.svelte\"],\"sourcesContent\":[\"<script>\\n\\n    import { onMount, onDestroy } from 'svelte';\\n\\n\\n    export let transitionDuration = 200;\\n    export let showIndicators = false;\\n    export let autoplay = false;\\n    export let delay = 1000;\\n\\n\\n\\n    let activeIndicator = 0;\\n    let indicators;\\n    let items = 0;\\n    let availableWidth = 0;\\n    let topClearence = 0;\\n\\n    let elems;\\n    let diff = 0;\\n\\n    let swipeWrapper;\\n    let swipeHandler;\\n\\n    let min = 0;\\n    let touchingTpl = `\\n    -webkit-transition-duration: 0s;\\n    transition-duration: 0s;\\n    -webkit-transform: translate3d(-{{val}}px, 0, 0);\\n    -ms-transform: translate3d(-{{val}}px, 0, 0);`;\\n    let non_touchingTpl = `\\n    -webkit-transition-duration: ${transitionDuration}ms;\\n    transition-duration: ${transitionDuration}ms;\\n    -webkit-transform: translate3d(-{{val}}px, 0, 0);\\n    -ms-transform: translate3d(-{{val}}px, 0, 0);`;\\n    let touching = false;\\n    let posX = 0;\\n    let dir = 0;\\n    let x;\\n\\n\\n\\n    let played = 0;\\n    let run_interval = false;\\n\\n    $: indicators = Array(items);\\n\\n    $: {\\n        if(autoplay && !run_interval){\\n            run_interval = setInterval(changeView , delay);\\n        }\\n\\n        if(!autoplay && run_interval){\\n            clearInterval(run_interval)\\n            run_interval = false;\\n        }\\n    }\\n\\n\\n    function update(){\\n        swipeHandler.style.top = topClearence + 'px';\\n        availableWidth = swipeWrapper.querySelector('.swipeable-items').offsetWidth;\\n        for (let i = 0; i < items; i++) {\\n            elems[i].style.transform = 'translate3d(' + (availableWidth * i) + 'px, 0, 0)';\\n        }\\n        diff = 0;\\n    }\\n\\n    function init(){\\n        elems = swipeWrapper.querySelectorAll('.swipeable-item');\\n        items = elems.length;\\n        update();\\n    }\\n\\n    onMount(() => {\\n        init();\\n        window.addEventListener('resize', update);\\n    });\\n\\n\\n\\n    onDestroy(()=>{\\n        window.removeEventListener('resize', update);\\n    })\\n\\n    function moveHandler(e){\\n        if (touching) {\\n            e.stopImmediatePropagation();\\n            e.stopPropagation();\\n\\n\\n            let max = availableWidth;\\n\\n            let _x = e.touches ? e.touches[0].pageX : e.pageX;\\n            let _diff = (x - _x) + posX;\\n            let dir = _x > x ? 0 : 1;\\n            if (!dir) { _diff = posX - (_x - x) }\\n            if (_diff <= (max * (items - 1)) && _diff >= min) {\\n\\n                for (let i = 0; i < items; i++) {\\n                    let template = i < 0 ? '{{val}}' : '-{{val}}';\\n                    let _value = (max * i) - _diff;\\n                    elems[i].style.cssText = touchingTpl.replace(template, _value).replace(template, _value);\\n                }\\n\\n                diff = _diff;\\n            }\\n\\n        }\\n    }\\n\\n    function endHandler(e) {\\n        e && e.stopImmediatePropagation();\\n        e && e.stopPropagation();\\n        e && e.preventDefault();\\n\\n        let max = availableWidth;\\n\\n        touching = false;\\n        x = null;\\n\\n        let delta = .05\\n        let swipe_threshold = 0.85;\\n        let d_max = (diff / max);\\n        let deltaDMax = d_max - Math.floor(d_max) // custom delta\\n        let _target = deltaDMax > delta && deltaDMax < .5 ? Math.ceil(d_max) : Math.floor(d_max); // Math.round(d_max);\\n\\n        if(Math.abs(_target - d_max) < swipe_threshold ){\\n            diff = _target * max;\\n        }else{\\n            diff = (dir ? (_target - 1) : (_target + 1)) * max;\\n        }\\n\\n        posX = diff;\\n        activeIndicator = (diff / max);\\n        for (let i = 0; i < items; i++) {\\n            let template = i < 0 ? '{{val}}' : '-{{val}}';\\n            let _value = (max * i) - posX;\\n            elems[i].style.cssText = non_touchingTpl.replace(template, _value).replace(template, _value);\\n        }\\n\\n        window.removeEventListener('mousemove', moveHandler);\\n        window.removeEventListener('mouseup', endHandler);\\n        window.removeEventListener('touchmove', moveHandler);\\n        window.removeEventListener('touchend', endHandler);\\n    }\\n\\n    function moveStart(e){\\n        e.stopImmediatePropagation();\\n        e.stopPropagation();\\n        e.preventDefault();\\n\\n        let max = availableWidth;\\n\\n        touching = true;\\n        x = e.touches ? e.touches[0].pageX : e.pageX;\\n        window.addEventListener('mousemove', moveHandler);\\n        window.addEventListener('mouseup', endHandler);\\n        window.addEventListener('touchmove', moveHandler);\\n        window.addEventListener('touchend', endHandler);\\n    }\\n\\n    function changeItem(item) {\\n        let max = availableWidth;\\n        diff = max * item;\\n        activeIndicator = item;\\n        endHandler();\\n    }\\n\\n    function changeView() {\\n        changeItem(played);\\n        played = played < (items - 1) ? ++played : 0;\\n    }\\n\\n</script>\\n\\n<style>\\n\\n    .swipe-panel {\\n        position: relative;\\n        height: var(--sv-swipe-panel-height, 100%);\\n        width: var(--sv-swipe-panel-width, inherit);\\n    }\\n    .swipe-item-wrapper{\\n        display: flex;\\n        align-self: stretch;\\n        overflow: hidden;\\n        position: relative;\\n        height: inherit;\\n        z-index: var(--sv-swipe-panel-wrapper-index, 2);\\n        pointer-events: none;\\n    }\\n\\n    .swipeable-items,\\n    .swipeable-slot-wrapper {\\n        display: flex;\\n        align-self: stretch;\\n        position: relative;\\n        width: 100%;\\n    }\\n\\n    .swipe-handler {\\n        width: 100%;\\n        position: absolute;\\n        top: 40px;\\n        bottom: 0px;\\n        left: 0;\\n        right: 0;\\n        background: rgba(0,0,0,0);\\n    }\\n    .swipe-indicator {\\n        position: relative;\\n        bottom: 1.5rem;\\n        display: flex;\\n        justify-content: center;\\n        z-index: var(--sv-swipe-panel-wrapper-index, 2);\\n        pointer-events: none;\\n    }\\n\\n    .dot {\\n        height: 10px;\\n        width: 10px;\\n        background-color: transparent;\\n        border: 1px solid grey;\\n        border-radius: 50%;\\n        display: inline-block;\\n        margin: 0px 2px;\\n        cursor: pointer;\\n        pointer-events: fill;\\n    }\\n    .swipe-indicator .is-active {\\n        background-color: var(--sv-swipe-indicator-active-color, grey);\\n    }\\n\\n</style>\\n\\n<div class=\\\"swipe-panel\\\">\\n    <div class=\\\"swipe-item-wrapper\\\" bind:this={swipeWrapper}>\\n        <div class=\\\"swipeable-items\\\">\\n            <div class=\\\"swipeable-slot-wrapper\\\">\\n                <slot />\\n            </div>\\n        </div>\\n    </div>\\n    <div class=\\\"swipe-handler\\\" bind:this={swipeHandler} on:touchstart={moveStart} on:mousedown={moveStart}></div>\\n    {#if showIndicators}\\n        <div class=\\\"swipe-indicator swipe-indicator-inside\\\">\\n            {#each indicators as x, i }\\n                <span class=\\\"dot {activeIndicator == i ? 'is-active' : ''}\\\" on:click={() => {changeItem(i)}}></span>\\n            {/each}\\n        </div>\\n    {/if}\\n\\n</div>\\n\"],\"names\":[],\"mappings\":\"AAkLI,YAAY,4BAAC,CAAC,AACV,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,IAAI,uBAAuB,CAAC,KAAK,CAAC,CAC1C,KAAK,CAAE,IAAI,sBAAsB,CAAC,QAAQ,CAAC,AAC/C,CAAC,AACD,+CAAmB,CAAC,AAChB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,QAAQ,CAAE,MAAM,CAChB,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,OAAO,CACf,OAAO,CAAE,IAAI,8BAA8B,CAAC,EAAE,CAAC,CAC/C,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,4CAAgB,CAChB,uBAAuB,4BAAC,CAAC,AACrB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,AACf,CAAC,AAED,cAAc,4BAAC,CAAC,AACZ,KAAK,CAAE,IAAI,CACX,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,IAAI,CACT,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC7B,CAAC,AACD,gBAAgB,4BAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,MAAM,CACd,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,IAAI,8BAA8B,CAAC,EAAE,CAAC,CAC/C,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,IAAI,4BAAC,CAAC,AACF,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,WAAW,CAC7B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,CACtB,aAAa,CAAE,GAAG,CAClB,OAAO,CAAE,YAAY,CACrB,MAAM,CAAE,GAAG,CAAC,GAAG,CACf,MAAM,CAAE,OAAO,CACf,cAAc,CAAE,IAAI,AACxB,CAAC,AACD,8BAAgB,CAAC,UAAU,cAAC,CAAC,AACzB,gBAAgB,CAAE,IAAI,iCAAiC,CAAC,KAAK,CAAC,AAClE,CAAC\"}"
};

const Swipe = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { transitionDuration = 200 } = $$props;
	let { showIndicators = false } = $$props;
	let { autoplay = false } = $$props;
	let { delay = 1000 } = $$props;
	let activeIndicator = 0;
	let indicators;
	let items = 0;
	let availableWidth = 0;
	let topClearence = 0;
	let elems;
	let diff = 0;
	let swipeWrapper;
	let swipeHandler;
	let min = 0;

	let touchingTpl = `
    -webkit-transition-duration: 0s;
    transition-duration: 0s;
    -webkit-transform: translate3d(-{{val}}px, 0, 0);
    -ms-transform: translate3d(-{{val}}px, 0, 0);`;

	let non_touchingTpl = `
    -webkit-transition-duration: ${transitionDuration}ms;
    transition-duration: ${transitionDuration}ms;
    -webkit-transform: translate3d(-{{val}}px, 0, 0);
    -ms-transform: translate3d(-{{val}}px, 0, 0);`;

	let touching = false;
	let posX = 0;
	let x;
	let played = 0;
	let run_interval = false;

	function update() {
		swipeHandler.style.top = topClearence + "px";
		availableWidth = swipeWrapper.querySelector(".swipeable-items").offsetWidth;

		for (let i = 0; i < items; i++) {
			elems[i].style.transform = "translate3d(" + availableWidth * i + "px, 0, 0)";
		}

		diff = 0;
	}

	function init() {
		elems = swipeWrapper.querySelectorAll(".swipeable-item");
		items = elems.length;
		update();
	}

	onMount(() => {
		init();
		window.addEventListener("resize", update);
	});

	onDestroy(() => {
		window.removeEventListener("resize", update);
	});

	function moveHandler(e) {
		if (touching) {
			e.stopImmediatePropagation();
			e.stopPropagation();
			let max = availableWidth;
			let _x = e.touches ? e.touches[0].pageX : e.pageX;
			let _diff = x - _x + posX;
			let dir = _x > x ? 0 : 1;

			if (!dir) {
				_diff = posX - (_x - x);
			}

			if (_diff <= max * (items - 1) && _diff >= min) {
				for (let i = 0; i < items; i++) {
					let template = i < 0 ? "{{val}}" : "-{{val}}";
					let _value = max * i - _diff;
					elems[i].style.cssText = touchingTpl.replace(template, _value).replace(template, _value);
				}

				diff = _diff;
			}
		}
	}

	function endHandler(e) {
		e && e.stopImmediatePropagation();
		e && e.stopPropagation();
		e && e.preventDefault();
		let max = availableWidth;
		touching = false;
		x = null;
		let delta = 0.05;
		let swipe_threshold = 0.85;
		let d_max = diff / max;
		let deltaDMax = d_max - Math.floor(d_max);

		let _target = deltaDMax > delta && deltaDMax < 0.5
		? Math.ceil(d_max)
		: Math.floor(d_max);

		if (Math.abs(_target - d_max) < swipe_threshold) {
			diff = _target * max;
		} else {
			diff = ( _target + 1) * max;
		}

		posX = diff;
		activeIndicator = diff / max;

		for (let i = 0; i < items; i++) {
			let template = i < 0 ? "{{val}}" : "-{{val}}";
			let _value = max * i - posX;
			elems[i].style.cssText = non_touchingTpl.replace(template, _value).replace(template, _value);
		}

		window.removeEventListener("mousemove", moveHandler);
		window.removeEventListener("mouseup", endHandler);
		window.removeEventListener("touchmove", moveHandler);
		window.removeEventListener("touchend", endHandler);
	}

	function changeItem(item) {
		let max = availableWidth;
		diff = max * item;
		activeIndicator = item;
		endHandler();
	}

	function changeView() {
		changeItem(played);
		played = played < items - 1 ? ++played : 0;
	}

	if ($$props.transitionDuration === void 0 && $$bindings.transitionDuration && transitionDuration !== void 0) $$bindings.transitionDuration(transitionDuration);
	if ($$props.showIndicators === void 0 && $$bindings.showIndicators && showIndicators !== void 0) $$bindings.showIndicators(showIndicators);
	if ($$props.autoplay === void 0 && $$bindings.autoplay && autoplay !== void 0) $$bindings.autoplay(autoplay);
	if ($$props.delay === void 0 && $$bindings.delay && delay !== void 0) $$bindings.delay(delay);
	$$result.css.add(css);
	indicators = Array(items);

	 {
		{
			if (autoplay && !run_interval) {
				run_interval = setInterval(changeView, delay);
			}

			if (!autoplay && run_interval) {
				clearInterval(run_interval);
				run_interval = false;
			}
		}
	}

	return `<div class="${"swipe-panel svelte-tx0axj"}">
    <div class="${"swipe-item-wrapper svelte-tx0axj"}"${add_attribute("this", swipeWrapper, 1)}>
        <div class="${"swipeable-items svelte-tx0axj"}">
            <div class="${"swipeable-slot-wrapper svelte-tx0axj"}">
                ${$$slots.default ? $$slots.default({}) : ``}
            </div>
        </div>
    </div>
    <div class="${"swipe-handler svelte-tx0axj"}"${add_attribute("this", swipeHandler, 1)}></div>
    ${showIndicators
	? `<div class="${"swipe-indicator swipe-indicator-inside svelte-tx0axj"}">
            ${each(indicators, (x, i) => `<span class="${"dot " + escape(activeIndicator == i ? "is-active" : "") + " svelte-tx0axj"}"></span>`)}
        </div>`
	: ``}

</div>`;
});

/* src/plugins/Swipe/SwipeItem.svelte generated by Svelte v3.16.7 */

const css$1 = {
	code: ".swipeable-item.svelte-1c0dn3k{display:flex;align-self:stretch;position:absolute;top:0;bottom:0;left:0;right:0;transition-timing-function:ease-out}",
	map: "{\"version\":3,\"file\":\"SwipeItem.svelte\",\"sources\":[\"SwipeItem.svelte\"],\"sourcesContent\":[\"<script>\\n    export let classes = '';\\n</script>\\n\\n<style>\\n    .swipeable-item {\\n        display: flex;\\n        align-self: stretch;\\n        position: absolute;\\n        top: 0;\\n        bottom: 0;\\n        left: 0;\\n        right: 0;\\n        transition-timing-function: ease-out;\\n    }\\n</style>\\n\\n<div class=\\\"swipeable-item {classes}\\\">\\n    <slot />\\n</div>\\n\"],\"names\":[],\"mappings\":\"AAKI,eAAe,eAAC,CAAC,AACb,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,MAAM,CAAE,CAAC,CACT,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,0BAA0B,CAAE,QAAQ,AACxC,CAAC\"}"
};

const SwipeItem = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { classes = "" } = $$props;
	if ($$props.classes === void 0 && $$bindings.classes && classes !== void 0) $$bindings.classes(classes);
	$$result.css.add(css$1);

	return `<div class="${"swipeable-item " + escape(classes) + " svelte-1c0dn3k"}">
    ${$$slots.default ? $$slots.default({}) : ``}
</div>`;
});

const toCSSString = (styles = {}) => Object.entries(styles)
  .filter(([_propName, propValue]) => propValue !== undefined && propValue !== null)
  .reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`
  }, '');

/* src/components/Icon.svelte generated by Svelte v3.16.7 */

const css$2 = {
	code: "svg.svelte-1y5h9x9.svelte-1y5h9x9{display:inherit}svg.svelte-1y5h9x9.svelte-1y5h9x9,svg.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgba(var(--theme-svg-fill));stroke:rgba(var(--theme-svg-fill))}.small.svelte-1y5h9x9.svelte-1y5h9x9{width:15px;height:15px}.medium.svelte-1y5h9x9.svelte-1y5h9x9{width:22px;height:22px}.big.svelte-1y5h9x9.svelte-1y5h9x9{width:35px;height:35px}.primary.svelte-1y5h9x9.svelte-1y5h9x9,.primary.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgb(var(--color-success));stroke:rgb(var(--color-success))}.warning.svelte-1y5h9x9.svelte-1y5h9x9,.warning.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgb(var(--color-warning));stroke:rgb(var(--color-warning))}.danger.svelte-1y5h9x9.svelte-1y5h9x9,.danger.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgb(var(--color-danger));stroke:rgb(var(--color-danger))}.info.svelte-1y5h9x9.svelte-1y5h9x9,.info.svelte-1y5h9x9 .svelte-1y5h9x9{fill:rgb(var(--color-info));stroke:rgb(var(--color-info))}.light.svelte-1y5h9x9.svelte-1y5h9x9,.light.svelte-1y5h9x9 .svelte-1y5h9x9{fill:var(--color-light-1);stroke:var(--color-light-1)}.dark.svelte-1y5h9x9.svelte-1y5h9x9,.dark.svelte-1y5h9x9 .svelte-1y5h9x9{fill:var(--color-dark-1);stroke:var(--color-dark-1)}",
	map: "{\"version\":3,\"file\":\"Icon.svelte\",\"sources\":[\"Icon.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames, toCSSString } from '../utils'\\n\\n    export let type\\n    export let is // primary|warning|danger|light|dark\\n    export let size = 'medium' // small|medium|big\\n    export let rotate = 0\\n    export let style = undefined\\n    export let id = undefined\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n    let styleProp = toCSSString({ transform: !!rotate ? `rotateZ(${rotate}deg)` : null, ...style })\\n\\n    $:  classProp = classnames('ico', is, size, $$props.class)\\n</script>\\n\\n<svg\\n        {id}\\n        title={titleProp}\\n        class={classProp}\\n        style={styleProp}\\n        aria-label={ariaLabelProp}\\n>\\n    <use xlink:href={`#ico-${type}`} class=\\\"ico-use\\\"/>\\n</svg>\\n\\n<style>\\n    svg {\\n        display: inherit;\\n    }\\n\\n    svg, svg * {\\n        fill: rgba(var(--theme-svg-fill));\\n        stroke: rgba(var(--theme-svg-fill));\\n    }\\n\\n    /* ------------=========( Size )=========------------ */\\n    .small {\\n        width: 15px;\\n        height: 15px;\\n    }\\n\\n    .medium {\\n        width: 22px;\\n        height: 22px;\\n    }\\n\\n    .big {\\n        width: 35px;\\n        height: 35px;\\n    }\\n\\n    /* ------------=========( Color )=========------------ */\\n    .primary, .primary * {\\n        fill: rgb(var(--color-success));\\n        stroke: rgb(var(--color-success));\\n    }\\n\\n    .warning, .warning * {\\n        fill: rgb(var(--color-warning));\\n        stroke: rgb(var(--color-warning));\\n    }\\n\\n    .danger, .danger * {\\n        fill: rgb(var(--color-danger));\\n        stroke: rgb(var(--color-danger));\\n    }\\n\\n    .info, .info * {\\n        fill: rgb(var(--color-info));\\n        stroke: rgb(var(--color-info));\\n    }\\n\\n    .light, .light * {\\n        fill: var(--color-light-1);\\n        stroke: var(--color-light-1);\\n    }\\n\\n    .dark, .dark * {\\n        fill: var(--color-dark-1);\\n        stroke: var(--color-dark-1);\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA8BI,GAAG,8BAAC,CAAC,AACD,OAAO,CAAE,OAAO,AACpB,CAAC,AAED,iCAAG,CAAE,kBAAG,CAAC,eAAE,CAAC,AACR,IAAI,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CACjC,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACvC,CAAC,AAGD,MAAM,8BAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,OAAO,8BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,IAAI,8BAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAGD,sCAAQ,CAAE,uBAAQ,CAAC,eAAE,CAAC,AAClB,IAAI,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,CAC/B,MAAM,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AACrC,CAAC,AAED,sCAAQ,CAAE,uBAAQ,CAAC,eAAE,CAAC,AAClB,IAAI,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,CAC/B,MAAM,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AACrC,CAAC,AAED,qCAAO,CAAE,sBAAO,CAAC,eAAE,CAAC,AAChB,IAAI,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAC9B,MAAM,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AACpC,CAAC,AAED,mCAAK,CAAE,oBAAK,CAAC,eAAE,CAAC,AACZ,IAAI,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CAC5B,MAAM,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AAClC,CAAC,AAED,oCAAM,CAAE,qBAAM,CAAC,eAAE,CAAC,AACd,IAAI,CAAE,IAAI,eAAe,CAAC,CAC1B,MAAM,CAAE,IAAI,eAAe,CAAC,AAChC,CAAC,AAED,mCAAK,CAAE,oBAAK,CAAC,eAAE,CAAC,AACZ,IAAI,CAAE,IAAI,cAAc,CAAC,CACzB,MAAM,CAAE,IAAI,cAAc,CAAC,AAC/B,CAAC\"}"
};

const Icon = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { type } = $$props;
	let { is } = $$props;
	let { size = "medium" } = $$props;
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
	$$result.css.add(css$2);
	let classProp = classnames("ico", is, size, $$props.class);

	return `<svg${add_attribute("id", id, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1y5h9x9"}"${add_attribute("style", styleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)}>
    <use${add_attribute("xlink:href", `#ico-${type}`, 0)} class="${"ico-use svelte-1y5h9x9"}"></use>
</svg>`;
});

/* src/components/Form.svelte generated by Svelte v3.16.7 */

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

/* src/components/Rate.svelte generated by Svelte v3.16.7 */

const css$3 = {
	code: ".rate.svelte-1peopo6.svelte-1peopo6{display:flex;margin:calc(var(--screen-padding) * -1 / 3)}li.svelte-1peopo6.svelte-1peopo6{padding:calc(var(--screen-padding) / 3)}.rate.svelte-1peopo6 li.svelte-1peopo6{-webkit-filter:drop-shadow(var(--shadow-primary));filter:drop-shadow(var(--shadow-primary))}",
	map: "{\"version\":3,\"file\":\"Rate.svelte\",\"sources\":[\"Rate.svelte\"],\"sourcesContent\":[\"<script>\\n    import Icon from './Icon.svelte'\\n\\n    export let is = 'danger'\\n    export let size = 'medium' // small|medium|mig\\n</script>\\n\\n<ul class=\\\"rate\\\">\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n    <li>\\n        <Icon {is} {size} type=\\\"heart-filled\\\"/>\\n    </li>\\n</ul>\\n\\n<style>\\n    .rate {\\n        display: flex;\\n        margin: calc(var(--screen-padding) * -1 / 3);\\n    }\\n\\n    li {\\n        padding: calc(var(--screen-padding) / 3);\\n    }\\n\\n    .rate li {\\n        -webkit-filter: drop-shadow(var(--shadow-primary));\\n        filter: drop-shadow(var(--shadow-primary));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA0BI,KAAK,8BAAC,CAAC,AACH,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,AAChD,CAAC,AAED,EAAE,8BAAC,CAAC,AACA,OAAO,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC5C,CAAC,AAED,oBAAK,CAAC,EAAE,eAAC,CAAC,AACN,cAAc,CAAE,YAAY,IAAI,gBAAgB,CAAC,CAAC,CAClD,MAAM,CAAE,YAAY,IAAI,gBAAgB,CAAC,CAAC,AAC9C,CAAC\"}"
};

const Rate = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { is = "danger" } = $$props;
	let { size = "medium" } = $$props;
	if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	$$result.css.add(css$3);

	return `<ul class="${"rate svelte-1peopo6"}">
    <li class="${"svelte-1peopo6"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-1peopo6"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-1peopo6"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-1peopo6"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
    <li class="${"svelte-1peopo6"}">
        ${validate_component(Icon, "Icon").$$render($$result, { is, size, type: "heart-filled" }, {}, {})}
    </li>
</ul>`;
});

/* src/components/Input.svelte generated by Svelte v3.16.7 */

const css$4 = {
	code: ".inp.svelte-a1e2g3{width:100%;flex:1 1 0;color:inherit;border-radius:var(--border-radius);min-width:var(--min-interactive-size);min-height:var(--min-interactive-size);border:1px solid rgba(var(--color-black), .2);background-color:rgba(var(--theme-bg-color));box-shadow:inset var(--shadow-primary), var(--shadow-secondary-inset)}.inp.svelte-a1e2g3:focus{border-color:rgb(var(--color-success))}.inp.svelte-a1e2g3:invalid,.inp.invalid.svelte-a1e2g3{border-color:rgb(var(--color-danger))}",
	map: "{\"version\":3,\"file\":\"Input.svelte\",\"sources\":[\"Input.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let name\\n    export let value = ''\\n    export let style = {}\\n    export let type = 'text'\\n    export let id = undefined\\n    export let align = undefined\\n    export let maxlength = 1000\\n    export let rows = undefined\\n    export let disabled = false\\n    export let title = undefined\\n    export let invalid = undefined\\n    export let min = undefined // Specifies a minimum value for an <input> element\\n    export let max = undefined // Specifies the maximum value for an <input> element\\n    export let list = undefined // Refers to a <datalist> element that contains pre-defined options for an <input> element\\n    export let form = undefined // Specifies the form the <input> element belongs to\\n    export let readonly = undefined // undefined|readonly\\n    export let required = undefined // undefined|required\\n    export let pattern = undefined // Specifies a regular expression that an <input> element's value is checked against (regexp)\\n    export let autocomplete = true // on|off\\n    export let autoselect = false\\n    export let ariaLabel = undefined\\n    export let placeholder = undefined\\n\\n    let idProp = id || name\\n    let typeProp = type === 'number' ? 'text' : type\\n    let titleProp = title || ariaLabel || placeholder\\n    let ariaLabelProp = ariaLabel || title || placeholder\\n    let autocompleteProp = autocomplete ? 'on' : 'off'\\n    let styleProp = toCSSString({ ...style, textAlign: align })\\n    let patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern\\n\\n    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, invalid })\\n\\n    /**\\n     *\\n     * @description Emit click and select content when \\\"autoselect\\\" is enabled.\\n     *\\n     * @param {MouseEvent} e - Native mouse event.\\n     */\\n    function onClick(e) {\\n        !disabled && dispatch(\\\"click\\\", e)\\n        !disabled && autoselect && e.target.select()\\n    }\\n</script>\\n\\n{#if rows}\\n    <textarea\\n            {min}\\n            {max}\\n            {rows}\\n            {name}\\n            {form}\\n            {align}\\n            {readonly}\\n            {disabled}\\n            {required}\\n            {maxlength}\\n            {placeholder}\\n            id={idProp}\\n            class={classProp}\\n            title={titleProp}\\n            style={styleProp}\\n            pattern={patternProp}\\n            aria-label={ariaLabelProp}\\n            autocomplete={autocompleteProp}\\n            {...{ type: typeProp }}\\n            bind:value\\n            on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n            on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            on:click='{onClick}'\\n    ></textarea>\\n{:else}\\n    <input\\n            {min}\\n            {max}\\n            {name}\\n            {list}\\n            {form}\\n            {align}\\n            {readonly}\\n            {disabled}\\n            {required}\\n            {maxlength}\\n            {placeholder}\\n            id={idProp}\\n            class={classProp}\\n            title={titleProp}\\n            style={styleProp}\\n            pattern={patternProp}\\n            aria-label={ariaLabelProp}\\n            autocomplete={autocompleteProp}\\n            {...{ type: typeProp }}\\n            bind:value\\n            on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n            on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            on:click='{onClick}'\\n    />\\n{/if}\\n\\n<style>\\n    .inp {\\n        width: 100%;\\n        flex: 1 1 0;\\n        color: inherit;\\n        border-radius: var(--border-radius);\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n        border: 1px solid rgba(var(--color-black), .2);\\n        background-color: rgba(var(--theme-bg-color));\\n        box-shadow: inset var(--shadow-primary), var(--shadow-secondary-inset);\\n    }\\n\\n    .inp:focus {\\n        border-color: rgb(var(--color-success));\\n    }\\n\\n    .inp:invalid, .inp.invalid {\\n        border-color: rgb(var(--color-danger));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA0GI,IAAI,cAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACX,KAAK,CAAE,OAAO,CACd,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,CACvC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,CAC9C,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAC7C,UAAU,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,IAAI,wBAAwB,CAAC,AAC1E,CAAC,AAED,kBAAI,MAAM,AAAC,CAAC,AACR,YAAY,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC3C,CAAC,AAED,kBAAI,QAAQ,CAAE,IAAI,QAAQ,cAAC,CAAC,AACxB,YAAY,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AAC1C,CAAC\"}"
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
	let { min = undefined } = $$props;
	let { max = undefined } = $$props;
	let { list = undefined } = $$props;
	let { form = undefined } = $$props;
	let { readonly = undefined } = $$props;
	let { required = undefined } = $$props;
	let { pattern = undefined } = $$props;
	let { autocomplete = true } = $$props;
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
			"svelte-a1e2g3"
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
			"svelte-a1e2g3"
		)}${add_attribute("value", value, 1)}>`}`;
});

/* src/components/Picture.svelte generated by Svelte v3.16.7 */

const css$5 = {
	code: ".picture.svelte-1rkw8xk.svelte-1rkw8xk{flex-grow:1;align-self:stretch;display:inline-flex;flex-direction:column;align-items:stretch;justify-content:stretch}.picture.svelte-1rkw8xk .pic.svelte-1rkw8xk{flex-grow:1;align-self:stretch;object-fit:cover;object-position:center;transition:opacity .3s ease-in}.picture.loading.svelte-1rkw8xk .pic.svelte-1rkw8xk{opacity:0}",
	map: "{\"version\":3,\"file\":\"Picture.svelte\",\"sources\":[\"Picture.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let src\\n    export let alt\\n    export let id = undefined\\n    export let width = undefined\\n    export let height = undefined\\n\\n    let loading = true\\n    let isError = false\\n\\n    $: wrapClassProp = classnames('picture', $$props.class, { loading, isError })\\n\\n    function onLoad(e) {\\n        loading = false\\n        dispatch('load', e)\\n    }\\n\\n    function onError(e) {\\n        loading = false\\n        isError = true\\n        dispatch('error', e)\\n    }\\n</script>\\n\\n<figure class={wrapClassProp}>\\n    <img\\n            {id}\\n            {alt}\\n            {src}\\n            {width}\\n            {height}\\n            class=\\\"pic\\\"\\n            on:load={onLoad}\\n            on:error={onError}\\n    />\\n\\n    <figcaption>\\n        <slot></slot>\\n    </figcaption>\\n</figure>\\n\\n<style>\\n    .picture {\\n        flex-grow: 1;\\n        align-self: stretch;\\n        display: inline-flex;\\n        flex-direction: column;\\n        align-items: stretch;\\n        justify-content: stretch;\\n    }\\n\\n    .picture .pic {\\n        flex-grow: 1;\\n        align-self: stretch;\\n        object-fit: cover;\\n        object-position: center;\\n        transition: opacity .3s ease-in;\\n    }\\n\\n    .picture.loading .pic {\\n        opacity: 0;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA+CI,QAAQ,8BAAC,CAAC,AACN,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,OAAO,CAAE,WAAW,CACpB,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,OAAO,CACpB,eAAe,CAAE,OAAO,AAC5B,CAAC,AAED,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACX,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,KAAK,CACjB,eAAe,CAAE,MAAM,CACvB,UAAU,CAAE,OAAO,CAAC,GAAG,CAAC,OAAO,AACnC,CAAC,AAED,QAAQ,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACnB,OAAO,CAAE,CAAC,AACd,CAAC\"}"
};

const Picture = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { src } = $$props;
	let { alt } = $$props;
	let { id = undefined } = $$props;
	let { width = undefined } = $$props;
	let { height = undefined } = $$props;
	let loading = true;
	let isError = false;

	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
	if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
	$$result.css.add(css$5);
	let wrapClassProp = classnames("picture", $$props.class, { loading, isError });

	return `<figure class="${escape(null_to_empty(wrapClassProp)) + " svelte-1rkw8xk"}">
    <img${add_attribute("id", id, 0)}${add_attribute("alt", alt, 0)}${add_attribute("src", src, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} class="${"pic svelte-1rkw8xk"}">

    <figcaption>
        ${$$slots.default ? $$slots.default({}) : ``}
    </figcaption>
</figure>`;
});

/* src/components/Avatar.svelte generated by Svelte v3.16.7 */

const css$6 = {
	code: ".ava.svelte-wvf7xz{flex:none;display:flex;border-radius:50%;overflow:hidden}.small.svelte-wvf7xz{width:25px;height:25px}.medium.svelte-wvf7xz{width:35px;height:35px}.big.svelte-wvf7xz{width:45px;height:45px}",
	map: "{\"version\":3,\"file\":\"Avatar.svelte\",\"sources\":[\"Avatar.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '../utils'\\n    import Picture from './Picture.svelte'\\n\\n    export let src\\n    export let alt\\n    export let size = 'medium' // small|medium|big\\n\\n    $: classProp = classnames('ava', size, $$props.class)\\n</script>\\n\\n<div class={classProp}>\\n    <Picture {src} {alt}/>\\n</div>\\n\\n<style>\\n    .ava {\\n        flex: none;\\n        display: flex;\\n        border-radius: 50%;\\n        overflow: hidden;\\n    }\\n\\n    .small {\\n        width: 25px;\\n        height: 25px;\\n    }\\n    .medium {\\n        width: 35px;\\n        height: 35px;\\n    }\\n    .big {\\n        width: 45px;\\n        height: 45px;\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAgBI,IAAI,cAAC,CAAC,AACF,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,MAAM,cAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,OAAO,cAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,IAAI,cAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC\"}"
};

const Avatar = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	let { alt } = $$props;
	let { size = "medium" } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0) $$bindings.alt(alt);
	if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
	$$result.css.add(css$6);
	let classProp = classnames("ava", size, $$props.class);

	return `<div class="${escape(null_to_empty(classProp)) + " svelte-wvf7xz"}">
    ${validate_component(Picture, "Picture").$$render($$result, { src, alt }, {}, {})}
</div>`;
});

/* src/components/Button.svelte generated by Svelte v3.16.7 */

const css$7 = {
	code: ".btn.svelte-o6g7w0:not(.auto){width:100%}.btn{flex:none;cursor:pointer;max-width:100%;user-select:none;padding:5px 15px;margin-bottom:3px;font-weight:bold;text-align:center;align-items:center;display:inline-flex;justify-content:center;border-radius:var(--border-radius);color:rgba(var(--theme-font-color));text-shadow:1px 1px rgba(var(--color-black), .3)}.btn.small{padding:5px;min-width:calc(var(--min-interactive-size) / 1.5);min-height:calc(var(--min-interactive-size) / 1.5)}.btn.medium{padding:5px 10px;min-width:var(--min-interactive-size);min-height:var(--min-interactive-size)}.btn.big{padding:5px 15px;min-width:calc(var(--min-interactive-size) * 1.5);min-height:calc(var(--min-interactive-size) * 1.5)}.btn:focus{background-color:rgba(var(--color-black), 0.1)}.btn:hover{box-shadow:0 2px rgba(var(--color-black), 0.2);background-color:rgba(var(--color-black), 0.1)}.btn:active{transform:translateY(1px);box-shadow:0 1px rgba(var(--color-black), 0.2);background-color:rgba(var(--color-black), 0.1)}.btn.success.svelte-o6g7w0{color:rgba(var(--color-font-light));background-color:rgba(var(--color-success));box-shadow:0 2px rgba(var(--color-success-dark)), var(--shadow-secondary)}.btn.success.svelte-o6g7w0:focus{background-color:rgba(var(--color-success), .85)}.btn.success.svelte-o6g7w0:hover{transform:translateY(1px);box-shadow:0 2px rgba(var(--color-success-dark)), var(--shadow-secondary)}.btn.success.svelte-o6g7w0:active{transform:translateY(2px);box-shadow:0 1px rgba(var(--color-success-dark)), var(--shadow-secondary)}.btn.warning.svelte-o6g7w0{color:rgba(var(--color-font-light));background-color:rgba(var(--color-warning));box-shadow:0 2px rgba(var(--color-warning-dark)), var(--shadow-secondary)}.btn.warning.svelte-o6g7w0:focus{background-color:rgba(var(--color-warning), .85)}.btn.warning.svelte-o6g7w0:hover{transform:translateY(1px);box-shadow:0 2px rgba(var(--color-warning-dark)), var(--shadow-secondary)}.btn.warning.svelte-o6g7w0:active{transform:translateY(2px);box-shadow:0 1px rgba(var(--color-warning-dark)), var(--shadow-secondary)}.btn.danger.svelte-o6g7w0{color:rgba(var(--color-font-light));background-color:rgba(var(--color-danger));box-shadow:0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary)}.btn.danger.svelte-o6g7w0:focus{background-color:rgba(var(--color-danger), .85)}.btn.danger.svelte-o6g7w0:hover{transform:translateY(1px);box-shadow:0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary)}.btn.danger.svelte-o6g7w0:active{transform:translateY(2px);box-shadow:0 1px rgba(var(--color-danger-dark)), var(--shadow-secondary)}@media screen and (min-width: 769px){.btn{margin-bottom:2px}.btn.success.svelte-o6g7w0{box-shadow:0 3px rgba(var(--color-success-dark)), var(--shadow-secondary)}.btn.warning.svelte-o6g7w0{box-shadow:0 3px rgba(var(--color-warning-dark)), var(--shadow-secondary)}.btn.danger.svelte-o6g7w0{box-shadow:0 3px rgba(var(--color-danger-dark)), var(--shadow-secondary)}}",
	map: "{\"version\":3,\"file\":\"Button.svelte\",\"sources\":[\"Button.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let is = undefined\\n    export let id = undefined\\n    export let href = undefined\\n    export let auto = false\\n    export let type = 'button'\\n    export let size = 'medium'\\n    export let title = undefined\\n    export let htmlFor = undefined\\n    export let disabled = false\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n\\n    $: classProp = classnames('btn', is, size, $$props.class, { auto, disabled })\\n\\n    function onLabelClick(e) {\\n        document.getElementById(htmlFor).click()\\n        // try { document.getElementById(htmlFor).click() } catch (e) {}\\n        !disabled && dispatch(\\\"click\\\", e)\\n    }\\n</script>\\n\\n{#if href}\\n    <a\\n            {id}\\n            {href}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click='{e => !disabled && dispatch(\\\"click\\\", e)}'\\n    >\\n        <slot></slot>\\n    </a>\\n{:else if htmlFor}\\n    <label\\n            {id}\\n            {disabled}\\n            for={htmlFor}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onLabelClick}\\n    >\\n        <slot></slot>\\n    </label>\\n{:else}\\n    <button\\n            {id}\\n            {type}\\n            {disabled}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click='{e => !disabled && dispatch(\\\"click\\\", e)}'\\n    >\\n        <slot></slot>\\n    </button>\\n{/if}\\n\\n<style>\\n    .btn:not(.auto) {\\n        width: 100%;\\n    }\\n\\n    :global(.btn) {\\n        flex: none;\\n        cursor: pointer;\\n        max-width: 100%;\\n        user-select: none;\\n        padding: 5px 15px;\\n        margin-bottom: 3px;\\n        font-weight: bold;\\n        text-align: center;\\n        align-items: center;\\n        display: inline-flex;\\n        justify-content: center;\\n        border-radius: var(--border-radius);\\n        color: rgba(var(--theme-font-color));\\n        text-shadow: 1px 1px rgba(var(--color-black), .3);\\n    }\\n\\n    :global(.btn.small) {\\n        padding: 5px;\\n        min-width: calc(var(--min-interactive-size) / 1.5);\\n        min-height: calc(var(--min-interactive-size) / 1.5);\\n    }\\n\\n    :global(.btn.medium) {\\n        padding: 5px 10px;\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n    }\\n\\n    :global(.btn.big) {\\n        padding: 5px 15px;\\n        min-width: calc(var(--min-interactive-size) * 1.5);\\n        min-height: calc(var(--min-interactive-size) * 1.5);\\n    }\\n\\n    :global(.btn:focus) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:hover) {\\n        box-shadow: 0 2px rgba(var(--color-black), 0.2);\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:active) {\\n        transform: translateY(1px);\\n        box-shadow: 0 1px rgba(var(--color-black), 0.2);\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    /* Success */\\n\\n    .btn.success {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-success));\\n        box-shadow: 0 2px rgba(var(--color-success-dark)), var(--shadow-secondary);\\n    }\\n\\n    .btn.success:focus {\\n        background-color: rgba(var(--color-success), .85);\\n    }\\n\\n    .btn.success:hover {\\n        transform: translateY(1px);\\n        box-shadow: 0 2px rgba(var(--color-success-dark)), var(--shadow-secondary);\\n    }\\n\\n    .btn.success:active {\\n        transform: translateY(2px);\\n        box-shadow: 0 1px rgba(var(--color-success-dark)), var(--shadow-secondary);\\n    }\\n\\n    /* Warning */\\n\\n    .btn.warning {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-warning));\\n        box-shadow: 0 2px rgba(var(--color-warning-dark)), var(--shadow-secondary);\\n    }\\n\\n    .btn.warning:focus {\\n        background-color: rgba(var(--color-warning), .85);\\n    }\\n\\n    .btn.warning:hover {\\n        transform: translateY(1px);\\n        box-shadow: 0 2px rgba(var(--color-warning-dark)), var(--shadow-secondary);\\n    }\\n\\n    .btn.warning:active {\\n        transform: translateY(2px);\\n        box-shadow: 0 1px rgba(var(--color-warning-dark)), var(--shadow-secondary);\\n    }\\n\\n    /* Danger */\\n\\n    .btn.danger {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-danger));\\n        box-shadow: 0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary);\\n    }\\n\\n    .btn.danger:focus {\\n        background-color: rgba(var(--color-danger), .85);\\n    }\\n\\n    .btn.danger:hover {\\n        transform: translateY(1px);\\n        box-shadow: 0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary);\\n    }\\n\\n    .btn.danger:active {\\n        transform: translateY(2px);\\n        box-shadow: 0 1px rgba(var(--color-danger-dark)), var(--shadow-secondary);\\n    }\\n\\n\\n    @media screen and (min-width: 769px) {\\n        :global(.btn) {\\n            margin-bottom: 2px;\\n        }\\n        .btn.success {\\n            box-shadow: 0 3px rgba(var(--color-success-dark)), var(--shadow-secondary);\\n        }\\n\\n        .btn.warning {\\n            box-shadow: 0 3px rgba(var(--color-warning-dark)), var(--shadow-secondary);\\n        }\\n\\n        .btn.danger {\\n            box-shadow: 0 3px rgba(var(--color-danger-dark)), var(--shadow-secondary);\\n        }\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"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\"}"
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
	? `<a${add_attribute("id", id, 0)}${add_attribute("href", href, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-o6g7w0"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </a>`
	: `${htmlFor
		? `<label${add_attribute("id", id, 0)} ${disabled ? "disabled" : ""}${add_attribute("for", htmlFor, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-o6g7w0"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </label>`
		: `<button${add_attribute("id", id, 0)}${add_attribute("type", type, 0)} ${disabled ? "disabled" : ""}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-o6g7w0"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </button>`}`}`;
});

/* src/components/Divider.svelte generated by Svelte v3.16.7 */

const css$8 = {
	code: ".divider.svelte-7u2z10{margin:0;border:none}.info.svelte-7u2z10{background-color:rgb(var(--color-info))}.success.svelte-7u2z10{background-color:rgb(var(--color-success))}.warning.svelte-7u2z10{background-color:rgb(var(--color-warning))}.danger.svelte-7u2z10{background-color:rgb(var(--color-danger))}",
	map: "{\"version\":3,\"file\":\"Divider.svelte\",\"sources\":[\"Divider.svelte\"],\"sourcesContent\":[\"<script>\\n    import { toCSSString, classnames } from '../utils'\\n\\n    export let is = 'info'\\n    export let size = 0\\n    export let width = 2\\n\\n    $: classProp = classnames('divider', is, $$props.class)\\n    $: styleProp = toCSSString({ padding: `${size / 2}px 0`, height: `${width}px` })\\n</script>\\n\\n<hr class={classProp} style={styleProp}>\\n\\n<style>\\n    .divider {\\n        margin: 0;\\n        border: none;\\n    }\\n\\n    .info {\\n        background-color: rgb(var(--color-info));\\n    }\\n\\n    .success {\\n        background-color: rgb(var(--color-success));\\n    }\\n\\n    .warning {\\n        background-color: rgb(var(--color-warning));\\n    }\\n\\n    .danger {\\n        background-color: rgb(var(--color-danger));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAcI,QAAQ,cAAC,CAAC,AACN,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,KAAK,cAAC,CAAC,AACH,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AAC5C,CAAC,AAED,QAAQ,cAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC/C,CAAC,AAED,QAAQ,cAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AAC/C,CAAC,AAED,OAAO,cAAC,CAAC,AACL,gBAAgB,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AAC9C,CAAC\"}"
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

	return `<hr class="${escape(null_to_empty(classProp)) + " svelte-7u2z10"}"${add_attribute("style", styleProp, 0)}>`;
});

/* src/components/Progress.svelte generated by Svelte v3.16.7 */

const css$9 = {
	code: ".progress.svelte-1i5c0kx{flex:0;width:100%;height:30px;padding:7px;border-radius:9999px;background-color:rgba(var(--theme-bg-color));box-shadow:inset var(--shadow-primary), var(--shadow-secondary-inset)}.progress-inner-frame.svelte-1i5c0kx{display:flex;width:100%;height:100%;overflow:hidden;border-radius:9999px}.progress-core.svelte-1i5c0kx{flex:none;align-self:stretch;transition:1s ease-in-out;margin-bottom:2px;box-shadow:var(--shadow-primary);border-radius:var(--border-radius);background-color:rgba(var(--color-success))}",
	map: "{\"version\":3,\"file\":\"Progress.svelte\",\"sources\":[\"Progress.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, onMount } from 'svelte'\\n    import { classnames } from '../utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let id = undefined\\n    export let value = 0 // 0 - 100\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n\\n    $: val = 0\\n    $: titleProp = title || `Progress - ${val}%`\\n    $: ariaLabelProp = ariaLabel || `Progress - ${val}%`\\n    $: classProp = classnames('progress', $$props.class)\\n\\n    onMount(() => {\\n        // Make loading progress effect on mount component.\\n        setTimeout(() => val = Number.isFinite(+value) ? Math.max(0, Math.min(+value, 100)) : 0, 0)\\n    })\\n</script>\\n\\n\\n<div\\n        {id}\\n        class={classProp}\\n        title={titleProp}\\n        aria-label={ariaLabelProp}\\n        role=\\\"progressbar\\\"\\n        aria-valuemin=\\\"0\\\"\\n        aria-valuemax=\\\"100\\\"\\n        aria-valuenow={val}\\n>\\n    <div class=\\\"progress-inner-frame\\\">\\n        <div class=\\\"progress-core\\\" style={`width:${val}%`}></div>\\n    </div>\\n</div>\\n\\n<style>\\n    .progress {\\n        flex: 0;\\n        width: 100%;\\n        height: 30px;\\n        padding: 7px;\\n        border-radius: 9999px;\\n        background-color: rgba(var(--theme-bg-color));\\n        box-shadow: inset var(--shadow-primary), var(--shadow-secondary-inset);\\n    }\\n\\n    .progress-inner-frame {\\n        display: flex;\\n        width: 100%;\\n        height: 100%;\\n        overflow: hidden;\\n        border-radius: 9999px;\\n    }\\n\\n    .progress-core {\\n        flex: none;\\n        align-self: stretch;\\n        transition: 1s ease-in-out;\\n        margin-bottom: 2px;\\n        box-shadow: var(--shadow-primary);\\n        border-radius: var(--border-radius);\\n        background-color: rgba(var(--color-success));\\n    }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAuCI,SAAS,eAAC,CAAC,AACP,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,GAAG,CACZ,aAAa,CAAE,MAAM,CACrB,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAC7C,UAAU,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,IAAI,wBAAwB,CAAC,AAC1E,CAAC,AAED,qBAAqB,eAAC,CAAC,AACnB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,MAAM,AACzB,CAAC,AAED,cAAc,eAAC,CAAC,AACZ,IAAI,CAAE,IAAI,CACV,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,EAAE,CAAC,WAAW,CAC1B,aAAa,CAAE,GAAG,CAClB,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC\"}"
};

const Progress = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { value = 0 } = $$props;
	let { title = undefined } = $$props;
	let { ariaLabel = undefined } = $$props;

	onMount(() => {
		setTimeout(
			() => val = Number.isFinite(+value)
			? Math.max(0, Math.min(+value, 100))
			: 0,
			0
		);
	});

	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	$$result.css.add(css$9);
	let val = 0;
	let titleProp = title || `Progress - ${val}%`;
	let ariaLabelProp = ariaLabel || `Progress - ${val}%`;
	let classProp = classnames("progress", $$props.class);

	return `<div${add_attribute("id", id, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1i5c0kx"}"${add_attribute("title", titleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)} role="${"progressbar"}" aria-valuemin="${"0"}" aria-valuemax="${"100"}"${add_attribute("aria-valuenow", val, 0)}>
    <div class="${"progress-inner-frame svelte-1i5c0kx"}">
        <div class="${"progress-core svelte-1i5c0kx"}"${add_attribute("style", `width:${val}%`, 0)}></div>
    </div>
</div>`;
});

/* src/components/Nav.svelte generated by Svelte v3.16.7 */

const css$a = {
	code: "nav.svelte-1uar9t{position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;box-shadow:var(--shadow-secondary);border-bottom:1px solid rgba(var(--color-danger), .1)}.selected.svelte-1uar9t{position:relative;display:inline-block}.selected.svelte-1uar9t::after{position:absolute;content:\"\";width:calc(100% - 1em);height:2px;background-color:rgb(var(--color-danger));display:block;bottom:-1px}a.svelte-1uar9t{padding:.8em 0.5em}.nav-actions.svelte-1uar9t{display:flex;align-items:center}.lang-select.svelte-1uar9t{padding:5px;background-color:transparent}.lang-select.svelte-1uar9t:hover,.lang-select.svelte-1uar9t:focus{box-shadow:none;background-color:rgba(var(--color-black), 0.1)}",
	map: "{\"version\":3,\"file\":\"Nav.svelte\",\"sources\":[\"Nav.svelte\"],\"sourcesContent\":[\"<script>\\n  import Icon from './Icon.svelte'\\n  import Button from './Button.svelte'\\n\\n  export let segment;\\n\\n  let isDarkTheme = false\\n\\n  let value = 'ua'\\n\\n  function changeTheme() {\\n    isDarkTheme = !isDarkTheme\\n    document.body.classList.remove('theme-dark')\\n    document.body.classList.remove('theme-light')\\n    document.body.classList.add(isDarkTheme ? 'theme-dark' : 'theme-light')\\n  }\\n</script>\\n\\n<nav class=\\\"theme-bg container\\\">\\n\\t<ul>\\n\\t\\t<li><a class:selected='{segment === undefined}' href='.'>home</a></li>\\n\\t\\t<li><a class:selected='{segment === \\\"about\\\"}' href='about'>about</a></li>\\n\\n\\t\\t<!-- for the blog link, we're using rel=prefetch so that Sapper prefetches\\n\\t\\t     the blog data when we hover over the link or tap it on a touchscreen -->\\n\\t\\t<li><a rel=prefetch class:selected='{segment === \\\"blog\\\"}' href='blog'>blog</a></li>\\n\\t</ul>\\n\\n  <span class=\\\"nav-actions\\\">\\n    <select {value} name=\\\"lang\\\" id=\\\"lang\\\" class=\\\"btn small lang-select\\\">\\n      <option value=\\\"ua\\\">Ua</option>\\n      <option value=\\\"ru\\\">Ru</option>\\n      <option value=\\\"en\\\">En</option>\\n    </select>\\n\\n    <Button on:click={changeTheme} auto size=\\\"small\\\">\\n      <Icon type=\\\"moon\\\" class=\\\"theme-svg-fill\\\"/>\\n    </Button>\\n  </span>\\n</nav>\\n\\n<style>\\n  nav {\\n    position: sticky;\\n    top: 0;\\n    z-index: 1;\\n    display: flex;\\n    justify-content: space-between;\\n    box-shadow: var(--shadow-secondary);\\n    border-bottom: 1px solid rgba(var(--color-danger), .1);\\n  }\\n\\n  .selected {\\n    position: relative;\\n    display: inline-block;\\n  }\\n\\n  .selected::after {\\n    position: absolute;\\n    content: \\\"\\\";\\n    width: calc(100% - 1em);\\n    height: 2px;\\n    background-color: rgb(var(--color-danger));\\n    display: block;\\n    bottom: -1px;\\n  }\\n\\n  a {\\n    padding: .8em 0.5em;\\n  }\\n\\n  .nav-actions {\\n    display: flex;\\n    align-items: center;\\n  }\\n\\n  .lang-select {\\n    padding: 5px;\\n    background-color: transparent;\\n  }\\n\\n  .lang-select:hover,\\n  .lang-select:focus {\\n    box-shadow: none;\\n    background-color: rgba(var(--color-black), 0.1);\\n  }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA0CE,GAAG,cAAC,CAAC,AACH,QAAQ,CAAE,MAAM,CAChB,GAAG,CAAE,CAAC,CACN,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,UAAU,CAAE,IAAI,kBAAkB,CAAC,CACnC,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,EAAE,CAAC,AACxD,CAAC,AAED,SAAS,cAAC,CAAC,AACT,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,AACvB,CAAC,AAED,uBAAS,OAAO,AAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,GAAG,CAAC,CACvB,MAAM,CAAE,GAAG,CACX,gBAAgB,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAC1C,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,IAAI,AACd,CAAC,AAED,CAAC,cAAC,CAAC,AACD,OAAO,CAAE,IAAI,CAAC,KAAK,AACrB,CAAC,AAED,YAAY,cAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,AACrB,CAAC,AAED,YAAY,cAAC,CAAC,AACZ,OAAO,CAAE,GAAG,CACZ,gBAAgB,CAAE,WAAW,AAC/B,CAAC,AAED,0BAAY,MAAM,CAClB,0BAAY,MAAM,AAAC,CAAC,AAClB,UAAU,CAAE,IAAI,CAChB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACjD,CAAC\"}"
};

const Nav = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	let value = "ua";

	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$a);

	return `<nav class="${"theme-bg container svelte-1uar9t"}">
	<ul>
		<li><a href="${"."}" class="${["svelte-1uar9t", segment === undefined ? "selected" : ""].join(" ").trim()}">home</a></li>
		<li><a href="${"about"}" class="${["svelte-1uar9t", segment === "about" ? "selected" : ""].join(" ").trim()}">about</a></li>

		
		<li><a rel="${"prefetch"}" href="${"blog"}" class="${["svelte-1uar9t", segment === "blog" ? "selected" : ""].join(" ").trim()}">blog</a></li>
	</ul>

  <span class="${"nav-actions svelte-1uar9t"}">
    <select${add_attribute("value", value, 0)} name="${"lang"}" id="${"lang"}" class="${"btn small lang-select svelte-1uar9t"}">
      <option value="${"ua"}">Ua</option>
      <option value="${"ru"}">Ru</option>
      <option value="${"en"}">En</option>
    </select>

    ${validate_component(Button, "Button").$$render($$result, { auto: true, size: "small" }, {}, {
		default: () => `
      ${validate_component(Icon, "Icon").$$render($$result, { type: "moon", class: "theme-svg-fill" }, {}, {})}
    `
	})}
  </span>
</nav>`;
});

/* src/routes/index.svelte generated by Svelte v3.16.7 */

const css$b = {
	code: "h1.svelte-hwohzt.svelte-hwohzt{text-transform:uppercase;text-align:center}.top.svelte-hwohzt.svelte-hwohzt{display:flex;margin-bottom:calc(var(--screen-padding) * 2);margin-top:var(--screen-padding)}.top-pic.svelte-hwohzt.svelte-hwohzt{z-index:0;flex-grow:1;overflow:hidden;margin-bottom:2px;border-radius:var(--border-radius);box-shadow:var(--shadow-primary)}.options.svelte-hwohzt.svelte-hwohzt{flex:0;display:flex;flex-direction:column;margin:calc(var(--screen-padding) * -1) 0;padding:0 0 0 var(--screen-padding)}.options.svelte-hwohzt li.svelte-hwohzt{flex:none;margin:var(--screen-padding) 0}.rate-section.svelte-hwohzt.svelte-hwohzt{display:flex;align-items:baseline;justify-content:space-between;padding:calc(var(--screen-padding) * 2) 0}.ava-section.svelte-hwohzt.svelte-hwohzt{display:flex;align-items:center;justify-content:space-between}.ava-section.svelte-hwohzt span.svelte-hwohzt{font-size:.7rem;padding:0 var(--screen-padding)}.ava-section.svelte-hwohzt span p.svelte-hwohzt{font-size:.6rem}.ava-section.svelte-hwohzt span p.svelte-hwohzt,.ava-section.svelte-hwohzt span h3.svelte-hwohzt{max-width:100%;line-height:1.4;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Swipe, SwipeItem } from \\\"../plugins\\\";\\n    import { Button, Picture, Input, Progress, Icon, Form, Rate, Avatar, Divider } from '../components'\\n</script>\\n\\n<style>\\n    h1 {\\n        text-transform: uppercase;\\n        text-align: center;\\n    }\\n\\n    .top {\\n        display: flex;\\n        margin-bottom: calc(var(--screen-padding) * 2);\\n        margin-top: var(--screen-padding);\\n    }\\n\\n    .top-pic {\\n        z-index: 0;\\n        flex-grow: 1;\\n        overflow: hidden;\\n        margin-bottom: 2px;\\n        border-radius: var(--border-radius);\\n        box-shadow: var(--shadow-primary);\\n    }\\n\\n    .options {\\n        flex: 0;\\n        display: flex;\\n        flex-direction: column;\\n        margin: calc(var(--screen-padding) * -1) 0;\\n        padding: 0 0 0 var(--screen-padding);\\n    }\\n\\n    .options li {\\n        flex: none;\\n        margin: var(--screen-padding) 0;\\n    }\\n\\n    .rate-section {\\n        display: flex;\\n        align-items: baseline;\\n        justify-content: space-between;\\n        padding: calc(var(--screen-padding) * 2) 0;\\n    }\\n\\n    .ava-section {\\n        display: flex;\\n        align-items: center;\\n        justify-content: space-between;\\n    }\\n\\n    .ava-section span {\\n        font-size: .7rem;\\n        padding: 0 var(--screen-padding);\\n    }\\n\\n    .ava-section span p {\\n        font-size: .6rem;\\n    }\\n\\n    .ava-section span p,\\n    .ava-section span h3 {\\n        max-width: 100%;\\n        line-height: 1.4;\\n        overflow: hidden;\\n        white-space: nowrap;\\n        text-overflow: ellipsis;\\n    }\\n</style>\\n\\n<svelte:head>\\n    <title>Charitify - is the application for helping those in need.</title>\\n</svelte:head>\\n\\n<section class=\\\"container\\\">\\n    <section class=\\\"top\\\">\\n        <div class=\\\"top-pic\\\">\\n            <Swipe>\\n                <SwipeItem>\\n                    <Picture src=\\\"https://placeimg.com/300/300/people\\\" alt=\\\"sample\\\"/>\\n                </SwipeItem>\\n                <SwipeItem>\\n                    <Picture src=\\\"https://placeimg.com/300/300/any\\\" alt=\\\"sample\\\"/>\\n                </SwipeItem>\\n                <SwipeItem>\\n                    <Picture src=\\\"https://placeimg.com/300/300/arch\\\" alt=\\\"sample\\\"/>\\n                </SwipeItem>\\n                <SwipeItem>\\n                    <Picture src=\\\"https://placeimg.com/300/300/nature\\\" alt=\\\"sample\\\"/>\\n                </SwipeItem>\\n                <SwipeItem>\\n                    <Picture src=\\\"https://placeimg.com/300/300/tech\\\" alt=\\\"sample\\\"/>\\n                </SwipeItem>\\n            </Swipe>\\n        </div>\\n\\n        <ul class=\\\"options\\\">\\n            <li>\\n                <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">test1</Button>\\n            </li>\\n            <li>\\n                <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">test12</Button>\\n            </li>\\n            <li>\\n                <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">test123</Button>\\n            </li>\\n            <li>\\n                <br>\\n                <Input\\n                        type=\\\"number\\\"\\n                        name=\\\"num\\\"\\n                        list=\\\"sum-suggestions\\\"\\n                        placeholder=\\\"Num\\\"\\n                        autoselect\\n                        align=\\\"right\\\"\\n                />\\n\\n                <datalist id=\\\"sum-suggestions\\\">\\n                    <option value=\\\"20\\\">\\n                    <option value=\\\"500\\\">\\n                    <option value=\\\"1000\\\">\\n                </datalist>\\n            </li>\\n            <li>\\n                <Button is=\\\"warning\\\" on:click=\\\"{e => console.log(e)}\\\">Submit</Button>\\n            </li>\\n        </ul>\\n    </section>\\n\\n    <Progress value=\\\"65\\\"></Progress>\\n\\n    <section class=\\\"rate-section\\\">\\n        <div class=\\\"ava-section\\\">\\n            <Avatar src=\\\"https://placeimg.com/300/300/people\\\" alt=\\\"avatar\\\"/>\\n\\n            <span>\\n                <h3>Tina Kandelaki</h3>\\n                <p>ORG charity charitify</p>\\n            </span>\\n        </div>\\n\\n        <Rate/>\\n    </section>\\n\\n    <br>\\n\\n    <h1>The main title</h1>\\n\\n    <br>\\n\\n    <p class=\\\"text-center\\\" style=\\\"padding: 0 10vw\\\">\\n        A small description that describes the title above and just makes text longer.\\n    </p>\\n</section>\\n\\n<br>\\n<br>\\n\\n<Divider/>\\n\\n\\n<Form on:submit=\\\"{(e) => console.log(e)}\\\" name=\\\"main-form\\\">\\n    <br>\\n    <br>\\n\\n    <Input name=\\\"test1\\\" type=\\\"number\\\" list=\\\"sum-suggestions\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Input name=\\\"test2\\\" type=\\\"text\\\" list=\\\"sum-suggestions\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Input name=\\\"test3\\\" type=\\\"email\\\" list=\\\"sum-suggestions\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Input name=\\\"test4\\\" type=\\\"url\\\" list=\\\"sum-suggestions\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Input name=\\\"test5\\\" type=\\\"search\\\" list=\\\"sum-suggestions\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Input name=\\\"test6\\\" type=\\\"date\\\" list=\\\"sum-suggestions\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Input name=\\\"test7\\\" type=\\\"password\\\" list=\\\"sum-suggestions\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Input name=\\\"test8\\\" type=\\\"tel\\\" list=\\\"sum-suggestions\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Button is=\\\"success\\\" type=\\\"submit\\\">Submit</Button>\\n</Form>\\n\\n<h1>Charitify - is the application for helping those in need.</h1>\\n\\n<br>\\n<br>\\n\\n<h2 class=\\\"text-success\\\">Typography</h2>\\n\\n<br>\\n<br>\\n\\n<p>Few paragraphs to text fonts</p>\\n<p>Декілька параграфів для тесту тексту</p>\\n<p>Несколько параграфов для теста текста</p>\\n\\n<br>\\n<br>\\n\\n<h2 class=\\\"text-warning\\\">Interactive elements</h2>\\n\\n<ul>\\n    <li>\\n        <span>\\n            <Icon size=\\\"small\\\" type=\\\"heart-filled\\\"/>\\n            <Icon size=\\\"small\\\" type=\\\"heart-filled\\\" is=\\\"warning\\\"/>\\n            <Icon size=\\\"small\\\" type=\\\"heart-filled\\\" is=\\\"danger\\\"/>\\n        </span>\\n    </li>\\n    <li>\\n        <span>\\n            <Icon type=\\\"heart-filled\\\"/>\\n            <Icon type=\\\"heart-filled\\\" is=\\\"warning\\\"/>\\n            <Icon type=\\\"heart-filled\\\" is=\\\"danger\\\"/>\\n        </span>\\n    </li>\\n    <li>\\n        <span>\\n            <Icon size=\\\"big\\\" type=\\\"heart-filled\\\"/>\\n            <Icon size=\\\"big\\\" type=\\\"heart-filled\\\" is=\\\"warning\\\"/>\\n            <Icon size=\\\"big\\\" type=\\\"heart-filled\\\" is=\\\"danger\\\"/>\\n        </span>\\n    </li>\\n</ul>\\n\\n<br>\\n<br>\\n\\n<section style=\\\"text-align: center; display: flex; justify-content: space-around\\\">\\n    <div>\\n        <br>\\n        Buttons\\n        <br>\\n        <br>\\n        <Button on:click=\\\"{e => console.log(e)}\\\">test</Button>\\n        <br>\\n        <br>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">test</Button>\\n        <br>\\n        <br>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\" ariaLabel=\\\"text\\\">test</Button>\\n        <br>\\n        <br>\\n        With text\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">test</Button>\\n        and behind.\\n        <br>\\n        <br>\\n        <Button is=\\\"warning\\\" on:click=\\\"{e => console.log(e)}\\\">Some example of Button</Button>\\n        <br>\\n        <br>\\n        <Button is=\\\"danger\\\" on:click=\\\"{e => console.log(e)}\\\">Some example of Button</Button>\\n        <br>\\n        <br>\\n    </div>\\n\\n    <div>\\n        <br>\\n        Links as buttons\\n        <br>\\n        <br>\\n        <Button on:click=\\\"{e => console.log(e)}\\\" href=\\\"#\\\">test</Button>\\n        <br>\\n        <br>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\" href=\\\"#\\\">test</Button>\\n        <br>\\n        <br>\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\" href=\\\"#\\\">test</Button>\\n        <br>\\n        <br>\\n        With text\\n        <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\" href=\\\"#\\\">test</Button>\\n        and behind.\\n        <br>\\n        <br>\\n        <Button is=\\\"warning\\\" on:click=\\\"{e => console.log(e)}\\\" href=\\\"#\\\">Some example of Button</Button>\\n        <br>\\n        <br>\\n        <Button is=\\\"danger\\\" on:click=\\\"{e => console.log(e)}\\\" href=\\\"#\\\">Some example of Button</Button>\\n        <br>\\n        <br>\\n    </div>\\n</section>\\n\\n<br>\\n<br>\\n\\n<h2 class=\\\"text-danger\\\">Input fields</h2>\\n\\n<br>\\n<br>\\n\\n<section>\\n    <Input rows={2} name=\\\"tex\\\" list=\\\"lis\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Input name=\\\"tex1\\\" list=\\\"lis\\\" placeholder=\\\"Some placeholder text\\\"/>\\n\\n    <br>\\n    <br>\\n\\n    <Input type=\\\"number\\\" name=\\\"tex2\\\" list=\\\"lis\\\"/>\\n\\n    <datalist id=\\\"lis\\\">\\n        <option value=\\\"1\\\">\\n        <option value=\\\"2\\\">\\n        <option value=\\\"3\\\">\\n    </datalist>\\n\\n    <label for=\\\"input\\\" class=\\\"text-success\\\">label</label>\\n    <input id=\\\"input\\\" type=\\\"text\\\" value=\\\"text\\\">\\n\\n    <br>\\n    <br>\\n\\n    <a href=\\\".\\\" class=\\\"text-warning\\\">Some link</a>\\n\\n    <br>\\n    <br>\\n\\n    <button type=\\\"button\\\" class=\\\"text-info\\\">Button example</button>\\n</section>\\n\\n<br>\\n<br>\\n\\n<h2 class=\\\"text-info\\\">Images</h2>\\n\\n<Picture alt=\\\"Borat\\\" src=\\\"great-success.png\\\" class=\\\"picture\\\">\\n    HIGH FIVE!\\n</Picture>\\n\\n<br>\\n<br>\\n\\n<Picture src=\\\"https://placeimg.com/1000/1000/any\\\" alt=\\\"sample\\\"/>\\n\\n<br>\\n<br>\\n\\n<h2 class=\\\"text-success\\\">Other</h2>\\n\\n<p>\\n    <strong>\\n        Try editing this file (src/routes/index.svelte) to test live reloading.\\n    </strong>\\n</p>\\n\\n<p style=\\\"text-align: justify\\\">\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\\n</p>\\n\"],\"names\":[],\"mappings\":\"AAMI,EAAE,4BAAC,CAAC,AACA,cAAc,CAAE,SAAS,CACzB,UAAU,CAAE,MAAM,AACtB,CAAC,AAED,IAAI,4BAAC,CAAC,AACF,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9C,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,QAAQ,4BAAC,CAAC,AACN,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,CAAC,CACZ,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,IAAI,eAAe,CAAC,CACnC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AACrC,CAAC,AAED,QAAQ,4BAAC,CAAC,AACN,IAAI,CAAE,CAAC,CACP,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,MAAM,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAC1C,OAAO,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACxC,CAAC,AAED,sBAAQ,CAAC,EAAE,cAAC,CAAC,AACT,IAAI,CAAE,IAAI,CACV,MAAM,CAAE,IAAI,gBAAgB,CAAC,CAAC,CAAC,AACnC,CAAC,AAED,aAAa,4BAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,QAAQ,CACrB,eAAe,CAAE,aAAa,CAC9B,OAAO,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC9C,CAAC,AAED,YAAY,4BAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,aAAa,AAClC,CAAC,AAED,0BAAY,CAAC,IAAI,cAAC,CAAC,AACf,SAAS,CAAE,KAAK,CAChB,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACpC,CAAC,AAED,0BAAY,CAAC,IAAI,CAAC,CAAC,cAAC,CAAC,AACjB,SAAS,CAAE,KAAK,AACpB,CAAC,AAED,0BAAY,CAAC,IAAI,CAAC,eAAC,CACnB,0BAAY,CAAC,IAAI,CAAC,EAAE,cAAC,CAAC,AAClB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,CAChB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,QAAQ,AAC3B,CAAC\"}"
};

const Routes = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$b);

	return `${($$result.head += `<title>Charitify - is the application for helping those in need.</title>`, "")}

<section class="${"container"}">
    <section class="${"top svelte-hwohzt"}">
        <div class="${"top-pic svelte-hwohzt"}">
            ${validate_component(Swipe, "Swipe").$$render($$result, {}, {}, {
		default: () => `
                ${validate_component(SwipeItem, "SwipeItem").$$render($$result, {}, {}, {
			default: () => `
                    ${validate_component(Picture, "Picture").$$render(
				$$result,
				{
					src: "https://placeimg.com/300/300/people",
					alt: "sample"
				},
				{},
				{}
			)}
                `
		})}
                ${validate_component(SwipeItem, "SwipeItem").$$render($$result, {}, {}, {
			default: () => `
                    ${validate_component(Picture, "Picture").$$render(
				$$result,
				{
					src: "https://placeimg.com/300/300/any",
					alt: "sample"
				},
				{},
				{}
			)}
                `
		})}
                ${validate_component(SwipeItem, "SwipeItem").$$render($$result, {}, {}, {
			default: () => `
                    ${validate_component(Picture, "Picture").$$render(
				$$result,
				{
					src: "https://placeimg.com/300/300/arch",
					alt: "sample"
				},
				{},
				{}
			)}
                `
		})}
                ${validate_component(SwipeItem, "SwipeItem").$$render($$result, {}, {}, {
			default: () => `
                    ${validate_component(Picture, "Picture").$$render(
				$$result,
				{
					src: "https://placeimg.com/300/300/nature",
					alt: "sample"
				},
				{},
				{}
			)}
                `
		})}
                ${validate_component(SwipeItem, "SwipeItem").$$render($$result, {}, {}, {
			default: () => `
                    ${validate_component(Picture, "Picture").$$render(
				$$result,
				{
					src: "https://placeimg.com/300/300/tech",
					alt: "sample"
				},
				{},
				{}
			)}
                `
		})}
            `
	})}
        </div>

        <ul class="${"options svelte-hwohzt"}">
            <li class="${"svelte-hwohzt"}">
                ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `test1` })}
            </li>
            <li class="${"svelte-hwohzt"}">
                ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `test12` })}
            </li>
            <li class="${"svelte-hwohzt"}">
                ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `test123` })}
            </li>
            <li class="${"svelte-hwohzt"}">
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
            <li class="${"svelte-hwohzt"}">
                ${validate_component(Button, "Button").$$render($$result, { is: "warning" }, {}, { default: () => `Submit` })}
            </li>
        </ul>
    </section>

    ${validate_component(Progress, "Progress").$$render($$result, { value: "65" }, {}, {})}

    <section class="${"rate-section svelte-hwohzt"}">
        <div class="${"ava-section svelte-hwohzt"}">
            ${validate_component(Avatar, "Avatar").$$render(
		$$result,
		{
			src: "https://placeimg.com/300/300/people",
			alt: "avatar"
		},
		{},
		{}
	)}

            <span class="${"svelte-hwohzt"}">
                <h3 class="${"svelte-hwohzt"}">Tina Kandelaki</h3>
                <p class="${"svelte-hwohzt"}">ORG charity charitify</p>
            </span>
        </div>

        ${validate_component(Rate, "Rate").$$render($$result, {}, {}, {})}
    </section>

    <br>

    <h1 class="${"svelte-hwohzt"}">The main title</h1>

    <br>

    <p class="${"text-center"}" style="${"padding: 0 10vw"}">
        A small description that describes the title above and just makes text longer.
    </p>
</section>

<br>
<br>

${validate_component(Divider, "Divider").$$render($$result, {}, {}, {})}


${validate_component(Form, "Form").$$render($$result, { name: "main-form" }, {}, {
		default: () => `
    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
			$$result,
			{
				name: "test1",
				type: "number",
				list: "sum-suggestions"
			},
			{},
			{}
		)}

    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
			$$result,
			{
				name: "test2",
				type: "text",
				list: "sum-suggestions"
			},
			{},
			{}
		)}

    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
			$$result,
			{
				name: "test3",
				type: "email",
				list: "sum-suggestions"
			},
			{},
			{}
		)}

    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
			$$result,
			{
				name: "test4",
				type: "url",
				list: "sum-suggestions"
			},
			{},
			{}
		)}

    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
			$$result,
			{
				name: "test5",
				type: "search",
				list: "sum-suggestions"
			},
			{},
			{}
		)}

    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
			$$result,
			{
				name: "test6",
				type: "date",
				list: "sum-suggestions"
			},
			{},
			{}
		)}

    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
			$$result,
			{
				name: "test7",
				type: "password",
				list: "sum-suggestions"
			},
			{},
			{}
		)}

    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
			$$result,
			{
				name: "test8",
				type: "tel",
				list: "sum-suggestions"
			},
			{},
			{}
		)}

    <br>
    <br>

    ${validate_component(Button, "Button").$$render($$result, { is: "success", type: "submit" }, {}, { default: () => `Submit` })}
`
	})}

<h1 class="${"svelte-hwohzt"}">Charitify - is the application for helping those in need.</h1>

<br>
<br>

<h2 class="${"text-success"}">Typography</h2>

<br>
<br>

<p>Few paragraphs to text fonts</p>
<p>Декілька параграфів для тесту тексту</p>
<p>Несколько параграфов для теста текста</p>

<br>
<br>

<h2 class="${"text-warning"}">Interactive elements</h2>

<ul>
    <li>
        <span>
            ${validate_component(Icon, "Icon").$$render($$result, { size: "small", type: "heart-filled" }, {}, {})}
            ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			size: "small",
			type: "heart-filled",
			is: "warning"
		},
		{},
		{}
	)}
            ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			size: "small",
			type: "heart-filled",
			is: "danger"
		},
		{},
		{}
	)}
        </span>
    </li>
    <li>
        <span>
            ${validate_component(Icon, "Icon").$$render($$result, { type: "heart-filled" }, {}, {})}
            ${validate_component(Icon, "Icon").$$render($$result, { type: "heart-filled", is: "warning" }, {}, {})}
            ${validate_component(Icon, "Icon").$$render($$result, { type: "heart-filled", is: "danger" }, {}, {})}
        </span>
    </li>
    <li>
        <span>
            ${validate_component(Icon, "Icon").$$render($$result, { size: "big", type: "heart-filled" }, {}, {})}
            ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			size: "big",
			type: "heart-filled",
			is: "warning"
		},
		{},
		{}
	)}
            ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			size: "big",
			type: "heart-filled",
			is: "danger"
		},
		{},
		{}
	)}
        </span>
    </li>
</ul>

<br>
<br>

<section style="${"text-align: center; display: flex; justify-content: space-around"}">
    <div>
        <br>
        Buttons
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, {}, {}, { default: () => `test` })}
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `test` })}
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, { is: "success", ariaLabel: "text" }, {}, { default: () => `test` })}
        <br>
        <br>
        With text
        ${validate_component(Button, "Button").$$render($$result, { is: "success" }, {}, { default: () => `test` })}
        and behind.
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, { is: "warning" }, {}, { default: () => `Some example of Button` })}
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, { is: "danger" }, {}, { default: () => `Some example of Button` })}
        <br>
        <br>
    </div>

    <div>
        <br>
        Links as buttons
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, { href: "#" }, {}, { default: () => `test` })}
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, { is: "success", href: "#" }, {}, { default: () => `test` })}
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, { is: "success", href: "#" }, {}, { default: () => `test` })}
        <br>
        <br>
        With text
        ${validate_component(Button, "Button").$$render($$result, { is: "success", href: "#" }, {}, { default: () => `test` })}
        and behind.
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, { is: "warning", href: "#" }, {}, { default: () => `Some example of Button` })}
        <br>
        <br>
        ${validate_component(Button, "Button").$$render($$result, { is: "danger", href: "#" }, {}, { default: () => `Some example of Button` })}
        <br>
        <br>
    </div>
</section>

<br>
<br>

<h2 class="${"text-danger"}">Input fields</h2>

<br>
<br>

<section>
    ${validate_component(Input, "Input").$$render($$result, { rows: 2, name: "tex", list: "lis" }, {}, {})}

    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
		$$result,
		{
			name: "tex1",
			list: "lis",
			placeholder: "Some placeholder text"
		},
		{},
		{}
	)}

    <br>
    <br>

    ${validate_component(Input, "Input").$$render(
		$$result,
		{
			type: "number",
			name: "tex2",
			list: "lis"
		},
		{},
		{}
	)}

    <datalist id="${"lis"}">
        <option value="${"1"}">
        </option><option value="${"2"}">
        </option><option value="${"3"}">
    </option></datalist>

    <label for="${"input"}" class="${"text-success"}">label</label>
    <input id="${"input"}" type="${"text"}" value="${"text"}">

    <br>
    <br>

    <a href="${"."}" class="${"text-warning"}">Some link</a>

    <br>
    <br>

    <button type="${"button"}" class="${"text-info"}">Button example</button>
</section>

<br>
<br>

<h2 class="${"text-info"}">Images</h2>

${validate_component(Picture, "Picture").$$render(
		$$result,
		{
			alt: "Borat",
			src: "great-success.png",
			class: "picture"
		},
		{},
		{
			default: () => `
    HIGH FIVE!
`
		}
	)}

<br>
<br>

${validate_component(Picture, "Picture").$$render(
		$$result,
		{
			src: "https://placeimg.com/1000/1000/any",
			alt: "sample"
		},
		{},
		{}
	)}

<br>
<br>

<h2 class="${"text-success"}">Other</h2>

<p>
    <strong>
        Try editing this file (src/routes/index.svelte) to test live reloading.
    </strong>
</p>

<p style="${"text-align: justify"}">
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.

    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.

    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.

    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.

    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
</p>`;
});

/* src/routes/about.svelte generated by Svelte v3.16.7 */

const About = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${($$result.head += `<title>About</title>`, "")}

<h1>About this site</h1>

<p>This is the &#39;about&#39; page. There&#39;s not much here.</p>`;
});

/* src/routes/blog/index.svelte generated by Svelte v3.16.7 */

const css$c = {
	code: "ul.svelte-1frg2tf{margin:0 0 1em 0;line-height:1.5}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<script context=\\\"module\\\">\\n\\texport function preload({ params, query }) {\\n\\t\\treturn this.fetch(`blog.json`).then(r => r.json()).then(posts => {\\n\\t\\t\\treturn { posts };\\n\\t\\t});\\n\\t}\\n</script>\\n\\n<script>\\n\\texport let posts;\\n</script>\\n\\n<style>\\n\\tul {\\n\\t\\tmargin: 0 0 1em 0;\\n\\t\\tline-height: 1.5;\\n\\t}\\n</style>\\n\\n<svelte:head>\\n\\t<title>Blog</title>\\n</svelte:head>\\n\\n<h1>Recent posts</h1>\\n\\n<ul>\\n\\t{#each posts as post}\\n\\t\\t<!-- we're using the non-standard `rel=prefetch` attribute to\\n\\t\\t\\t\\ttell Sapper to load the data for the page as soon as\\n\\t\\t\\t\\tthe user hovers over the link or taps it, instead of\\n\\t\\t\\t\\twaiting for the 'click' event -->\\n\\t\\t<li><a rel='prefetch' href='blog/{post.slug}'>{post.title}</a></li>\\n\\t{/each}\\n</ul>\"],\"names\":[],\"mappings\":\"AAaC,EAAE,eAAC,CAAC,AACH,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CACjB,WAAW,CAAE,GAAG,AACjB,CAAC\"}"
};

function preload({ params, query }) {
	return this.fetch(`blog.json`).then(r => r.json()).then(posts => {
		return { posts };
	});
}

const Blog = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { posts } = $$props;
	if ($$props.posts === void 0 && $$bindings.posts && posts !== void 0) $$bindings.posts(posts);
	$$result.css.add(css$c);

	return `${($$result.head += `<title>Blog</title>`, "")}

<h1>Recent posts</h1>

<ul class="${"svelte-1frg2tf"}">
	${each(posts, post => `
		<li><a rel="${"prefetch"}" href="${"blog/" + escape(post.slug)}">${escape(post.title)}</a></li>`)}
</ul>`;
});

/* src/routes/blog/[slug].svelte generated by Svelte v3.16.7 */

const css$d = {
	code: ".content.svelte-gnxal1 h2{font-size:1.4em;font-weight:500}.content.svelte-gnxal1 pre{background-color:#f9f9f9;box-shadow:inset 1px 1px 5px rgba(0,0,0,0.05);padding:0.5em;border-radius:2px;overflow-x:auto}.content.svelte-gnxal1 pre code{background-color:transparent;padding:0}.content.svelte-gnxal1 ul{line-height:1.5}.content.svelte-gnxal1 li{margin:0 0 0.5em 0}",
	map: "{\"version\":3,\"file\":\"[slug].svelte\",\"sources\":[\"[slug].svelte\"],\"sourcesContent\":[\"<script context=\\\"module\\\">\\n\\texport async function preload({ params, query }) {\\n\\t\\t// the `slug` parameter is available because\\n\\t\\t// this file is called [slug].svelte\\n\\t\\tconst res = await this.fetch(`blog/${params.slug}.json`);\\n\\t\\tconst data = await res.json();\\n\\n\\t\\tif (res.status === 200) {\\n\\t\\t\\treturn { post: data };\\n\\t\\t} else {\\n\\t\\t\\tthis.error(res.status, data.message);\\n\\t\\t}\\n\\t}\\n</script>\\n\\n<script>\\n\\texport let post;\\n</script>\\n\\n<style>\\n\\t/*\\n\\t\\tBy default, CSS is locally scoped to the component,\\n\\t\\tand any unused styles are dead-code-eliminated.\\n\\t\\tIn this page, Svelte can't know which elements are\\n\\t\\tgoing to appear inside the {{{post.html}}} block,\\n\\t\\tso we have to use the :global(...) modifier to target\\n\\t\\tall elements inside .content\\n\\t*/\\n\\t.content :global(h2) {\\n\\t\\tfont-size: 1.4em;\\n\\t\\tfont-weight: 500;\\n\\t}\\n\\n\\t.content :global(pre) {\\n\\t\\tbackground-color: #f9f9f9;\\n\\t\\tbox-shadow: inset 1px 1px 5px rgba(0,0,0,0.05);\\n\\t\\tpadding: 0.5em;\\n\\t\\tborder-radius: 2px;\\n\\t\\toverflow-x: auto;\\n\\t}\\n\\n\\t.content :global(pre) :global(code) {\\n\\t\\tbackground-color: transparent;\\n\\t\\tpadding: 0;\\n\\t}\\n\\n\\t.content :global(ul) {\\n\\t\\tline-height: 1.5;\\n\\t}\\n\\n\\t.content :global(li) {\\n\\t\\tmargin: 0 0 0.5em 0;\\n\\t}\\n</style>\\n\\n<svelte:head>\\n\\t<title>{post.title}</title>\\n</svelte:head>\\n\\n<h1>{post.title}</h1>\\n\\n<div class='content'>\\n\\t{@html post.html}\\n</div>\\n\"],\"names\":[],\"mappings\":\"AA4BC,sBAAQ,CAAC,AAAQ,EAAE,AAAE,CAAC,AACrB,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,GAAG,AACjB,CAAC,AAED,sBAAQ,CAAC,AAAQ,GAAG,AAAE,CAAC,AACtB,gBAAgB,CAAE,OAAO,CACzB,UAAU,CAAE,KAAK,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAC9C,OAAO,CAAE,KAAK,CACd,aAAa,CAAE,GAAG,CAClB,UAAU,CAAE,IAAI,AACjB,CAAC,AAED,sBAAQ,CAAC,AAAQ,GAAG,AAAC,CAAC,AAAQ,IAAI,AAAE,CAAC,AACpC,gBAAgB,CAAE,WAAW,CAC7B,OAAO,CAAE,CAAC,AACX,CAAC,AAED,sBAAQ,CAAC,AAAQ,EAAE,AAAE,CAAC,AACrB,WAAW,CAAE,GAAG,AACjB,CAAC,AAED,sBAAQ,CAAC,AAAQ,EAAE,AAAE,CAAC,AACrB,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,AACpB,CAAC\"}"
};

async function preload$1({ params, query }) {
	const res = await this.fetch(`blog/${params.slug}.json`);
	const data = await res.json();

	if (res.status === 200) {
		return { post: data };
	} else {
		this.error(res.status, data.message);
	}
}

const U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { post } = $$props;
	if ($$props.post === void 0 && $$bindings.post && post !== void 0) $$bindings.post(post);
	$$result.css.add(css$d);

	return `${($$result.head += `<title>${escape(post.title)}</title>`, "")}

<h1>${escape(post.title)}</h1>

<div class="${"content svelte-gnxal1"}">
	${post.html}
</div>`;
});

/* src/routes/_icons.svelte generated by Svelte v3.16.7 */

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

/* src/routes/_layout.svelte generated by Svelte v3.16.7 */

const css$e = {
	code: "main.svelte-7sd4o8{position:relative;max-width:56em;margin:0 auto;box-sizing:border-box}",
	map: "{\"version\":3,\"file\":\"_layout.svelte\",\"sources\":[\"_layout.svelte\"],\"sourcesContent\":[\"<script>\\n\\timport { Nav } from '../components';\\n\\timport Icons from './_icons.svelte';\\n\\n\\texport let segment;\\n</script>\\n\\n<style>\\n\\tmain {\\n\\t\\tposition: relative;\\n\\t\\tmax-width: 56em;\\n\\t\\tmargin: 0 auto;\\n\\t\\tbox-sizing: border-box;\\n\\t}\\n</style>\\n\\n<Nav {segment}/>\\n\\n<Icons/>\\n\\n<main>\\n\\t<slot></slot>\\n</main>\\n\"],\"names\":[],\"mappings\":\"AAQC,IAAI,cAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,UAAU,CAAE,UAAU,AACvB,CAAC\"}"
};

const Layout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$e);

	return `${validate_component(Nav, "Nav").$$render($$result, { segment }, {}, {})}

${validate_component(Icons, "Icons").$$render($$result, {}, {}, {})}

<main class="${"svelte-7sd4o8"}">
	${$$slots.default ? $$slots.default({}) : ``}
</main>`;
});

/* src/routes/_error.svelte generated by Svelte v3.16.7 */

const css$f = {
	code: "h1.svelte-8od9u6,p.svelte-8od9u6{margin:0 auto}h1.svelte-8od9u6{font-size:2.8em;font-weight:700;margin:0 0 0.5em 0}p.svelte-8od9u6{margin:1em auto}@media(min-width: 480px){h1.svelte-8od9u6{font-size:4em}}",
	map: "{\"version\":3,\"file\":\"_error.svelte\",\"sources\":[\"_error.svelte\"],\"sourcesContent\":[\"<script>\\n\\texport let status;\\n\\texport let error;\\n\\n\\tconst dev = \\\"development\\\" === 'development';\\n</script>\\n\\n<style>\\n\\th1, p {\\n\\t\\tmargin: 0 auto;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2.8em;\\n\\t\\tfont-weight: 700;\\n\\t\\tmargin: 0 0 0.5em 0;\\n\\t}\\n\\n\\tp {\\n\\t\\tmargin: 1em auto;\\n\\t}\\n\\n\\t@media (min-width: 480px) {\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 4em;\\n\\t\\t}\\n\\t}\\n</style>\\n\\n<svelte:head>\\n\\t<title>{status}</title>\\n</svelte:head>\\n\\n<h1>{status}</h1>\\n\\n<p>{error.message}</p>\\n\\n{#if dev && error.stack}\\n\\t<pre>{error.stack}</pre>\\n{/if}\\n\"],\"names\":[],\"mappings\":\"AAQC,gBAAE,CAAE,CAAC,cAAC,CAAC,AACN,MAAM,CAAE,CAAC,CAAC,IAAI,AACf,CAAC,AAED,EAAE,cAAC,CAAC,AACH,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,GAAG,CAChB,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,AACpB,CAAC,AAED,CAAC,cAAC,CAAC,AACF,MAAM,CAAE,GAAG,CAAC,IAAI,AACjB,CAAC,AAED,MAAM,AAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AAC1B,EAAE,cAAC,CAAC,AACH,SAAS,CAAE,GAAG,AACf,CAAC,AACF,CAAC\"}"
};

const Error$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { status } = $$props;
	let { error } = $$props;
	if ($$props.status === void 0 && $$bindings.status && status !== void 0) $$bindings.status(status);
	if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);
	$$result.css.add(css$f);

	return `${($$result.head += `<title>${escape(status)}</title>`, "")}

<h1 class="${"svelte-8od9u6"}">${escape(status)}</h1>

<p class="${"svelte-8od9u6"}">${escape(error.message)}</p>

${ error.stack
	? `<pre>${escape(error.stack)}</pre>`
	: ``}`;
});

// This file is generated by Sapper — do not edit it!

const d = decodeURIComponent;

const manifest = {
	server_routes: [
		{
			// blog/index.json.js
			pattern: /^\/blog.json$/,
			handlers: route_0,
			params: () => ({})
		},

		{
			// blog/[slug].json.js
			pattern: /^\/blog\/([^\/]+?).json$/,
			handlers: route_1,
			params: match => ({ slug: d(match[1]) })
		}
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
			// about.svelte
			pattern: /^\/about\/?$/,
			parts: [
				{ name: "about", file: "about.svelte", component: About }
			]
		},

		{
			// blog/index.svelte
			pattern: /^\/blog\/?$/,
			parts: [
				{ name: "blog", file: "blog/index.svelte", component: Blog, preload: preload }
			]
		},

		{
			// blog/[slug].svelte
			pattern: /^\/blog\/([^\/]+?)\/?$/,
			parts: [
				null,
				{ name: "blog_$slug", file: "blog/[slug].svelte", component: U5Bslugu5D, preload: preload$1, params: match => ({ slug: d(match[1]) }) }
			]
		}
	],

	root: Layout,
	root_preload: () => {},
	error: Error$1
};

const build_dir = "__sapper__/build";

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

/* src/node_modules/@sapper/internal/App.svelte generated by Svelte v3.16.7 */

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

function lookup$1(file) {
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
			const type = lookup$1(req.path);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcm91dGVzL2Jsb2cvX3Bvc3RzLmpzIiwiLi4vLi4vLi4vc3JjL3JvdXRlcy9ibG9nL2luZGV4Lmpzb24uanMiLCIuLi8uLi8uLi9zcmMvcm91dGVzL2Jsb2cvW3NsdWddLmpzb24uanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIi4uLy4uLy4uL3NyYy9wbHVnaW5zL1N3aXBlL1N3aXBlLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9wbHVnaW5zL1N3aXBlL1N3aXBlSXRlbS5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvdXRpbHMuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9JY29uLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0Zvcm0uc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvUmF0ZS5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9JbnB1dC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9QaWN0dXJlLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0F2YXRhci5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9CdXR0b24uc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRGl2aWRlci5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9Qcm9ncmVzcy5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9OYXYuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL3JvdXRlcy9pbmRleC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvcm91dGVzL2Jsb2cvaW5kZXguc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL3JvdXRlcy9ibG9nL1tzbHVnXS5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvcm91dGVzL19sYXlvdXQuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL3JvdXRlcy9fZXJyb3Iuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL25vZGVfbW9kdWxlcy9Ac2FwcGVyL2ludGVybmFsL21hbmlmZXN0LXNlcnZlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3ZlbHRlL3N0b3JlL2luZGV4Lm1qcyIsIi4uLy4uLy4uL3NyYy9ub2RlX21vZHVsZXMvQHNhcHBlci9pbnRlcm5hbC9zaGFyZWQubWpzIiwiLi4vLi4vLi4vc3JjL25vZGVfbW9kdWxlcy9Ac2FwcGVyL2ludGVybmFsL0FwcC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbm9kZV9tb2R1bGVzL0BzYXBwZXIvc2VydmVyLm1qcyIsIi4uLy4uLy4uL3NyYy9zZXJ2ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gT3JkaW5hcmlseSwgeW91J2QgZ2VuZXJhdGUgdGhpcyBkYXRhIGZyb20gbWFya2Rvd24gZmlsZXMgaW4geW91clxuLy8gcmVwbywgb3IgZmV0Y2ggdGhlbSBmcm9tIGEgZGF0YWJhc2Ugb2Ygc29tZSBraW5kLiBCdXQgaW4gb3JkZXIgdG9cbi8vIGF2b2lkIHVubmVjZXNzYXJ5IGRlcGVuZGVuY2llcyBpbiB0aGUgc3RhcnRlciB0ZW1wbGF0ZSwgYW5kIGluIHRoZVxuLy8gc2VydmljZSBvZiBvYnZpb3VzbmVzcywgd2UncmUganVzdCBnb2luZyB0byBsZWF2ZSBpdCBoZXJlLlxuXG4vLyBUaGlzIGZpbGUgaXMgY2FsbGVkIGBfcG9zdHMuanNgIHJhdGhlciB0aGFuIGBwb3N0cy5qc2AsIGJlY2F1c2Vcbi8vIHdlIGRvbid0IHdhbnQgdG8gY3JlYXRlIGFuIGAvYmxvZy9wb3N0c2Agcm91dGUg4oCUIHRoZSBsZWFkaW5nXG4vLyB1bmRlcnNjb3JlIHRlbGxzIFNhcHBlciBub3QgdG8gZG8gdGhhdC5cblxuY29uc3QgcG9zdHMgPSBbXG5cdHtcblx0XHR0aXRsZTogJ1doYXQgaXMgU2FwcGVyPycsXG5cdFx0c2x1ZzogJ3doYXQtaXMtc2FwcGVyJyxcblx0XHRodG1sOiBgXG5cdFx0XHQ8cD5GaXJzdCwgeW91IGhhdmUgdG8ga25vdyB3aGF0IDxhIGhyZWY9J2h0dHBzOi8vc3ZlbHRlLmRldic+U3ZlbHRlPC9hPiBpcy4gU3ZlbHRlIGlzIGEgVUkgZnJhbWV3b3JrIHdpdGggYSBib2xkIG5ldyBpZGVhOiByYXRoZXIgdGhhbiBwcm92aWRpbmcgYSBsaWJyYXJ5IHRoYXQgeW91IHdyaXRlIGNvZGUgd2l0aCAobGlrZSBSZWFjdCBvciBWdWUsIGZvciBleGFtcGxlKSwgaXQncyBhIGNvbXBpbGVyIHRoYXQgdHVybnMgeW91ciBjb21wb25lbnRzIGludG8gaGlnaGx5IG9wdGltaXplZCB2YW5pbGxhIEphdmFTY3JpcHQuIElmIHlvdSBoYXZlbid0IGFscmVhZHkgcmVhZCB0aGUgPGEgaHJlZj0naHR0cHM6Ly9zdmVsdGUuZGV2L2Jsb2cvZnJhbWV3b3Jrcy13aXRob3V0LXRoZS1mcmFtZXdvcmsnPmludHJvZHVjdG9yeSBibG9nIHBvc3Q8L2E+LCB5b3Ugc2hvdWxkITwvcD5cblxuXHRcdFx0PHA+U2FwcGVyIGlzIGEgTmV4dC5qcy1zdHlsZSBmcmFtZXdvcmsgKDxhIGhyZWY9J2Jsb2cvaG93LWlzLXNhcHBlci1kaWZmZXJlbnQtZnJvbS1uZXh0Jz5tb3JlIG9uIHRoYXQgaGVyZTwvYT4pIGJ1aWx0IGFyb3VuZCBTdmVsdGUuIEl0IG1ha2VzIGl0IGVtYmFycmFzc2luZ2x5IGVhc3kgdG8gY3JlYXRlIGV4dHJlbWVseSBoaWdoIHBlcmZvcm1hbmNlIHdlYiBhcHBzLiBPdXQgb2YgdGhlIGJveCwgeW91IGdldDo8L3A+XG5cblx0XHRcdDx1bD5cblx0XHRcdFx0PGxpPkNvZGUtc3BsaXR0aW5nLCBkeW5hbWljIGltcG9ydHMgYW5kIGhvdCBtb2R1bGUgcmVwbGFjZW1lbnQsIHBvd2VyZWQgYnkgd2VicGFjazwvbGk+XG5cdFx0XHRcdDxsaT5TZXJ2ZXItc2lkZSByZW5kZXJpbmcgKFNTUikgd2l0aCBjbGllbnQtc2lkZSBoeWRyYXRpb248L2xpPlxuXHRcdFx0XHQ8bGk+U2VydmljZSB3b3JrZXIgZm9yIG9mZmxpbmUgc3VwcG9ydCwgYW5kIGFsbCB0aGUgUFdBIGJlbGxzIGFuZCB3aGlzdGxlczwvbGk+XG5cdFx0XHRcdDxsaT5UaGUgbmljZXN0IGRldmVsb3BtZW50IGV4cGVyaWVuY2UgeW91J3ZlIGV2ZXIgaGFkLCBvciB5b3VyIG1vbmV5IGJhY2s8L2xpPlxuXHRcdFx0PC91bD5cblxuXHRcdFx0PHA+SXQncyBpbXBsZW1lbnRlZCBhcyBFeHByZXNzIG1pZGRsZXdhcmUuIEV2ZXJ5dGhpbmcgaXMgc2V0IHVwIGFuZCB3YWl0aW5nIGZvciB5b3UgdG8gZ2V0IHN0YXJ0ZWQsIGJ1dCB5b3Uga2VlcCBjb21wbGV0ZSBjb250cm9sIG92ZXIgdGhlIHNlcnZlciwgc2VydmljZSB3b3JrZXIsIHdlYnBhY2sgY29uZmlnIGFuZCBldmVyeXRoaW5nIGVsc2UsIHNvIGl0J3MgYXMgZmxleGlibGUgYXMgeW91IG5lZWQgaXQgdG8gYmUuPC9wPlxuXHRcdGBcblx0fSxcblxuXHR7XG5cdFx0dGl0bGU6ICdIb3cgdG8gdXNlIFNhcHBlcicsXG5cdFx0c2x1ZzogJ2hvdy10by11c2Utc2FwcGVyJyxcblx0XHRodG1sOiBgXG5cdFx0XHQ8aDI+U3RlcCBvbmU8L2gyPlxuXHRcdFx0PHA+Q3JlYXRlIGEgbmV3IHByb2plY3QsIHVzaW5nIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9SaWNoLUhhcnJpcy9kZWdpdCc+ZGVnaXQ8L2E+OjwvcD5cblxuXHRcdFx0PHByZT48Y29kZT5ucHggZGVnaXQgXCJzdmVsdGVqcy9zYXBwZXItdGVtcGxhdGUjcm9sbHVwXCIgbXktYXBwXG5cdFx0XHRjZCBteS1hcHBcblx0XHRcdG5wbSBpbnN0YWxsICMgb3IgeWFybiFcblx0XHRcdG5wbSBydW4gZGV2XG5cdFx0XHQ8L2NvZGU+PC9wcmU+XG5cblx0XHRcdDxoMj5TdGVwIHR3bzwvaDI+XG5cdFx0XHQ8cD5HbyB0byA8YSBocmVmPSdodHRwOi8vbG9jYWxob3N0OjMwMDAnPmxvY2FsaG9zdDozMDAwPC9hPi4gT3BlbiA8Y29kZT5teS1hcHA8L2NvZGU+IGluIHlvdXIgZWRpdG9yLiBFZGl0IHRoZSBmaWxlcyBpbiB0aGUgPGNvZGU+c3JjL3JvdXRlczwvY29kZT4gZGlyZWN0b3J5IG9yIGFkZCBuZXcgb25lcy48L3A+XG5cblx0XHRcdDxoMj5TdGVwIHRocmVlPC9oMj5cblx0XHRcdDxwPi4uLjwvcD5cblxuXHRcdFx0PGgyPlN0ZXAgZm91cjwvaDI+XG5cdFx0XHQ8cD5SZXNpc3Qgb3ZlcmRvbmUgam9rZSBmb3JtYXRzLjwvcD5cblx0XHRgXG5cdH0sXG5cblx0e1xuXHRcdHRpdGxlOiAnV2h5IHRoZSBuYW1lPycsXG5cdFx0c2x1ZzogJ3doeS10aGUtbmFtZScsXG5cdFx0aHRtbDogYFxuXHRcdFx0PHA+SW4gd2FyLCB0aGUgc29sZGllcnMgd2hvIGJ1aWxkIGJyaWRnZXMsIHJlcGFpciByb2FkcywgY2xlYXIgbWluZWZpZWxkcyBhbmQgY29uZHVjdCBkZW1vbGl0aW9ucyDigJQgYWxsIHVuZGVyIGNvbWJhdCBjb25kaXRpb25zIOKAlCBhcmUga25vd24gYXMgPGVtPnNhcHBlcnM8L2VtPi48L3A+XG5cblx0XHRcdDxwPkZvciB3ZWIgZGV2ZWxvcGVycywgdGhlIHN0YWtlcyBhcmUgZ2VuZXJhbGx5IGxvd2VyIHRoYW4gdGhvc2UgZm9yIGNvbWJhdCBlbmdpbmVlcnMuIEJ1dCB3ZSBmYWNlIG91ciBvd24gaG9zdGlsZSBlbnZpcm9ubWVudDogdW5kZXJwb3dlcmVkIGRldmljZXMsIHBvb3IgbmV0d29yayBjb25uZWN0aW9ucywgYW5kIHRoZSBjb21wbGV4aXR5IGluaGVyZW50IGluIGZyb250LWVuZCBlbmdpbmVlcmluZy4gU2FwcGVyLCB3aGljaCBpcyBzaG9ydCBmb3IgPHN0cm9uZz5TPC9zdHJvbmc+dmVsdGUgPHN0cm9uZz5hcHA8L3N0cm9uZz4gbWFrPHN0cm9uZz5lcjwvc3Ryb25nPiwgaXMgeW91ciBjb3VyYWdlb3VzIGFuZCBkdXRpZnVsIGFsbHkuPC9wPlxuXHRcdGBcblx0fSxcblxuXHR7XG5cdFx0dGl0bGU6ICdIb3cgaXMgU2FwcGVyIGRpZmZlcmVudCBmcm9tIE5leHQuanM/Jyxcblx0XHRzbHVnOiAnaG93LWlzLXNhcHBlci1kaWZmZXJlbnQtZnJvbS1uZXh0Jyxcblx0XHRodG1sOiBgXG5cdFx0XHQ8cD48YSBocmVmPSdodHRwczovL2dpdGh1Yi5jb20vemVpdC9uZXh0LmpzJz5OZXh0LmpzPC9hPiBpcyBhIFJlYWN0IGZyYW1ld29yayBmcm9tIDxhIGhyZWY9J2h0dHBzOi8vemVpdC5jbyc+WmVpdDwvYT4sIGFuZCBpcyB0aGUgaW5zcGlyYXRpb24gZm9yIFNhcHBlci4gVGhlcmUgYXJlIGEgZmV3IG5vdGFibGUgZGlmZmVyZW5jZXMsIGhvd2V2ZXI6PC9wPlxuXG5cdFx0XHQ8dWw+XG5cdFx0XHRcdDxsaT5JdCdzIHBvd2VyZWQgYnkgPGEgaHJlZj0naHR0cHM6Ly9zdmVsdGUuZGV2Jz5TdmVsdGU8L2E+IGluc3RlYWQgb2YgUmVhY3QsIHNvIGl0J3MgZmFzdGVyIGFuZCB5b3VyIGFwcHMgYXJlIHNtYWxsZXI8L2xpPlxuXHRcdFx0XHQ8bGk+SW5zdGVhZCBvZiByb3V0ZSBtYXNraW5nLCB3ZSBlbmNvZGUgcm91dGUgcGFyYW1ldGVycyBpbiBmaWxlbmFtZXMuIEZvciBleGFtcGxlLCB0aGUgcGFnZSB5b3UncmUgbG9va2luZyBhdCByaWdodCBub3cgaXMgPGNvZGU+c3JjL3JvdXRlcy9ibG9nL1tzbHVnXS5odG1sPC9jb2RlPjwvbGk+XG5cdFx0XHRcdDxsaT5BcyB3ZWxsIGFzIHBhZ2VzIChTdmVsdGUgY29tcG9uZW50cywgd2hpY2ggcmVuZGVyIG9uIHNlcnZlciBvciBjbGllbnQpLCB5b3UgY2FuIGNyZWF0ZSA8ZW0+c2VydmVyIHJvdXRlczwvZW0+IGluIHlvdXIgPGNvZGU+cm91dGVzPC9jb2RlPiBkaXJlY3RvcnkuIFRoZXNlIGFyZSBqdXN0IDxjb2RlPi5qczwvY29kZT4gZmlsZXMgdGhhdCBleHBvcnQgZnVuY3Rpb25zIGNvcnJlc3BvbmRpbmcgdG8gSFRUUCBtZXRob2RzLCBhbmQgcmVjZWl2ZSBFeHByZXNzIDxjb2RlPnJlcXVlc3Q8L2NvZGU+IGFuZCA8Y29kZT5yZXNwb25zZTwvY29kZT4gb2JqZWN0cyBhcyBhcmd1bWVudHMuIFRoaXMgbWFrZXMgaXQgdmVyeSBlYXN5IHRvLCBmb3IgZXhhbXBsZSwgYWRkIGEgSlNPTiBBUEkgc3VjaCBhcyB0aGUgb25lIDxhIGhyZWY9J2Jsb2cvaG93LWlzLXNhcHBlci1kaWZmZXJlbnQtZnJvbS1uZXh0Lmpzb24nPnBvd2VyaW5nIHRoaXMgdmVyeSBwYWdlPC9hPjwvbGk+XG5cdFx0XHRcdDxsaT5MaW5rcyBhcmUganVzdCA8Y29kZT4mbHQ7YSZndDs8L2NvZGU+IGVsZW1lbnRzLCByYXRoZXIgdGhhbiBmcmFtZXdvcmstc3BlY2lmaWMgPGNvZGU+Jmx0O0xpbmsmZ3Q7PC9jb2RlPiBjb21wb25lbnRzLiBUaGF0IG1lYW5zLCBmb3IgZXhhbXBsZSwgdGhhdCA8YSBocmVmPSdibG9nL2hvdy1jYW4taS1nZXQtaW52b2x2ZWQnPnRoaXMgbGluayByaWdodCBoZXJlPC9hPiwgZGVzcGl0ZSBiZWluZyBpbnNpZGUgYSBibG9iIG9mIEhUTUwsIHdvcmtzIHdpdGggdGhlIHJvdXRlciBhcyB5b3UnZCBleHBlY3QuPC9saT5cblx0XHRcdDwvdWw+XG5cdFx0YFxuXHR9LFxuXG5cdHtcblx0XHR0aXRsZTogJ0hvdyBjYW4gSSBnZXQgaW52b2x2ZWQ/Jyxcblx0XHRzbHVnOiAnaG93LWNhbi1pLWdldC1pbnZvbHZlZCcsXG5cdFx0aHRtbDogYFxuXHRcdFx0PHA+V2UncmUgc28gZ2xhZCB5b3UgYXNrZWQhIENvbWUgb24gb3ZlciB0byB0aGUgPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZSc+U3ZlbHRlPC9hPiBhbmQgPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3NhcHBlcic+U2FwcGVyPC9hPiByZXBvcywgYW5kIGpvaW4gdXMgaW4gdGhlIDxhIGhyZWY9J2h0dHBzOi8vc3ZlbHRlLmRldi9jaGF0Jz5EaXNjb3JkIGNoYXRyb29tPC9hPi4gRXZlcnlvbmUgaXMgd2VsY29tZSwgZXNwZWNpYWxseSB5b3UhPC9wPlxuXHRcdGBcblx0fVxuXTtcblxucG9zdHMuZm9yRWFjaChwb3N0ID0+IHtcblx0cG9zdC5odG1sID0gcG9zdC5odG1sLnJlcGxhY2UoL15cXHR7M30vZ20sICcnKTtcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBwb3N0cztcbiIsImltcG9ydCBwb3N0cyBmcm9tICcuL19wb3N0cy5qcyc7XG5cbmNvbnN0IGNvbnRlbnRzID0gSlNPTi5zdHJpbmdpZnkocG9zdHMubWFwKHBvc3QgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHRpdGxlOiBwb3N0LnRpdGxlLFxuXHRcdHNsdWc6IHBvc3Quc2x1Z1xuXHR9O1xufSkpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0KHJlcSwgcmVzKSB7XG5cdHJlcy53cml0ZUhlYWQoMjAwLCB7XG5cdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHR9KTtcblxuXHRyZXMuZW5kKGNvbnRlbnRzKTtcbn0iLCJpbXBvcnQgcG9zdHMgZnJvbSAnLi9fcG9zdHMuanMnO1xuXG5jb25zdCBsb29rdXAgPSBuZXcgTWFwKCk7XG5wb3N0cy5mb3JFYWNoKHBvc3QgPT4ge1xuXHRsb29rdXAuc2V0KHBvc3Quc2x1ZywgSlNPTi5zdHJpbmdpZnkocG9zdCkpO1xufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXQocmVxLCByZXMsIG5leHQpIHtcblx0Ly8gdGhlIGBzbHVnYCBwYXJhbWV0ZXIgaXMgYXZhaWxhYmxlIGJlY2F1c2Vcblx0Ly8gdGhpcyBmaWxlIGlzIGNhbGxlZCBbc2x1Z10uanNvbi5qc1xuXHRjb25zdCB7IHNsdWcgfSA9IHJlcS5wYXJhbXM7XG5cblx0aWYgKGxvb2t1cC5oYXMoc2x1ZykpIHtcblx0XHRyZXMud3JpdGVIZWFkKDIwMCwge1xuXHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdH0pO1xuXG5cdFx0cmVzLmVuZChsb29rdXAuZ2V0KHNsdWcpKTtcblx0fSBlbHNlIHtcblx0XHRyZXMud3JpdGVIZWFkKDQwNCwge1xuXHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdH0pO1xuXG5cdFx0cmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRtZXNzYWdlOiBgTm90IGZvdW5kYFxuXHRcdH0pKTtcblx0fVxufVxuIiwiZnVuY3Rpb24gbm9vcCgpIHsgfVxuY29uc3QgaWRlbnRpdHkgPSB4ID0+IHg7XG5mdW5jdGlvbiBhc3NpZ24odGFyLCBzcmMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZm9yIChjb25zdCBrIGluIHNyYylcbiAgICAgICAgdGFyW2tdID0gc3JjW2tdO1xuICAgIHJldHVybiB0YXI7XG59XG5mdW5jdGlvbiBpc19wcm9taXNlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBhZGRfbG9jYXRpb24oZWxlbWVudCwgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyKSB7XG4gICAgZWxlbWVudC5fX3N2ZWx0ZV9tZXRhID0ge1xuICAgICAgICBsb2M6IHsgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gcnVuKGZuKSB7XG4gICAgcmV0dXJuIGZuKCk7XG59XG5mdW5jdGlvbiBibGFua19vYmplY3QoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5mdW5jdGlvbiBydW5fYWxsKGZucykge1xuICAgIGZucy5mb3JFYWNoKHJ1bik7XG59XG5mdW5jdGlvbiBpc19mdW5jdGlvbih0aGluZykge1xuICAgIHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBzYWZlX25vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGIgfHwgKChhICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JykgfHwgdHlwZW9mIGEgPT09ICdmdW5jdGlvbicpO1xufVxuZnVuY3Rpb24gbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYjtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX3N0b3JlKHN0b3JlLCBuYW1lKSB7XG4gICAgaWYgKCFzdG9yZSB8fCB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgdW5zdWIgPSBzdG9yZS5zdWJzY3JpYmUoY2FsbGJhY2spO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAodHlwZW9mICQkc2NvcGUuZGlydHkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiBleGNsdWRlX2ludGVybmFsX3Byb3BzKHByb3BzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoa1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdWx0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIG9uY2UoZm4pIHtcbiAgICBsZXQgcmFuID0gZmFsc2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGlmIChyYW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgIGZuLmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIG51bGxfdG9fZW1wdHkodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfc3RvcmVfdmFsdWUoc3RvcmUsIHJldCwgdmFsdWUgPSByZXQpIHtcbiAgICBzdG9yZS5zZXQodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59XG5jb25zdCBoYXNfcHJvcCA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xuZnVuY3Rpb24gYWN0aW9uX2Rlc3Ryb3llcihhY3Rpb25fcmVzdWx0KSB7XG4gICAgcmV0dXJuIGFjdGlvbl9yZXN1bHQgJiYgaXNfZnVuY3Rpb24oYWN0aW9uX3Jlc3VsdC5kZXN0cm95KSA/IGFjdGlvbl9yZXN1bHQuZGVzdHJveSA6IG5vb3A7XG59XG5cbmNvbnN0IGlzX2NsaWVudCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xubGV0IG5vdyA9IGlzX2NsaWVudFxuICAgID8gKCkgPT4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpXG4gICAgOiAoKSA9PiBEYXRlLm5vdygpO1xubGV0IHJhZiA9IGlzX2NsaWVudCA/IGNiID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShjYikgOiBub29wO1xuLy8gdXNlZCBpbnRlcm5hbGx5IGZvciB0ZXN0aW5nXG5mdW5jdGlvbiBzZXRfbm93KGZuKSB7XG4gICAgbm93ID0gZm47XG59XG5mdW5jdGlvbiBzZXRfcmFmKGZuKSB7XG4gICAgcmFmID0gZm47XG59XG5cbmNvbnN0IHRhc2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gcnVuX3Rhc2tzKG5vdykge1xuICAgIHRhc2tzLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGlmICghdGFzay5jKG5vdykpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgICAgIHRhc2suZigpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRhc2tzLnNpemUgIT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xufVxuLyoqXG4gKiBGb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5IVxuICovXG5mdW5jdGlvbiBjbGVhcl9sb29wcygpIHtcbiAgICB0YXNrcy5jbGVhcigpO1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHRhc2sgdGhhdCBydW5zIG9uIGVhY2ggcmFmIGZyYW1lXG4gKiB1bnRpbCBpdCByZXR1cm5zIGEgZmFsc3kgdmFsdWUgb3IgaXMgYWJvcnRlZFxuICovXG5mdW5jdGlvbiBsb29wKGNhbGxiYWNrKSB7XG4gICAgbGV0IHRhc2s7XG4gICAgaWYgKHRhc2tzLnNpemUgPT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHByb21pc2U6IG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgICAgICAgdGFza3MuYWRkKHRhc2sgPSB7IGM6IGNhbGxiYWNrLCBmOiBmdWxmaWxsIH0pO1xuICAgICAgICB9KSxcbiAgICAgICAgYWJvcnQoKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfZWFjaChpdGVyYXRpb25zLCBkZXRhY2hpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnNbaV0pXG4gICAgICAgICAgICBpdGVyYXRpb25zW2ldLmQoZGV0YWNoaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBlbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cbmZ1bmN0aW9uIGVsZW1lbnRfaXMobmFtZSwgaXMpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lLCB7IGlzIH0pO1xufVxuZnVuY3Rpb24gb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcyhvYmosIGV4Y2x1ZGUpIHtcbiAgICBjb25zdCB0YXJnZXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gb2JqKSB7XG4gICAgICAgIGlmIChoYXNfcHJvcChvYmosIGspXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAmJiBleGNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0YXJnZXRba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHN2Z19lbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5hbWUpO1xufVxuZnVuY3Rpb24gdGV4dChkYXRhKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xufVxuZnVuY3Rpb24gc3BhY2UoKSB7XG4gICAgcmV0dXJuIHRleHQoJyAnKTtcbn1cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICAgIHJldHVybiB0ZXh0KCcnKTtcbn1cbmZ1bmN0aW9uIGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBwcmV2ZW50X2RlZmF1bHQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzdG9wX3Byb3BhZ2F0aW9uKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNlbGYoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcylcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMobm9kZS5fX3Byb3RvX18pO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2NyaXB0b3JzW2tleV0gJiYgZGVzY3JpcHRvcnNba2V5XS5zZXQpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB4bGlua19hdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRfYmluZGluZ19ncm91cF92YWx1ZShncm91cCkge1xuICAgIGNvbnN0IHZhbHVlID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoZ3JvdXBbaV0uY2hlY2tlZClcbiAgICAgICAgICAgIHZhbHVlLnB1c2goZ3JvdXBbaV0uX192YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyB1bmRlZmluZWQgOiArdmFsdWU7XG59XG5mdW5jdGlvbiB0aW1lX3Jhbmdlc190b19hcnJheShyYW5nZXMpIHtcbiAgICBjb25zdCBhcnJheSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGFycmF5LnB1c2goeyBzdGFydDogcmFuZ2VzLnN0YXJ0KGkpLCBlbmQ6IHJhbmdlcy5lbmQoaSkgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbn1cbmZ1bmN0aW9uIGNoaWxkcmVuKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xufVxuZnVuY3Rpb24gY2xhaW1fZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcywgc3ZnKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVOYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGogKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5vZGUuYXR0cmlidXRlc1tqXTtcbiAgICAgICAgICAgICAgICBpZiAoIWF0dHJpYnV0ZXNbYXR0cmlidXRlLm5hbWVdKVxuICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdOyAvLyBUT0RPIHN0cmlwIHVud2FudGVkIGF0dHJpYnV0ZXNcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3ZnID8gc3ZnX2VsZW1lbnQobmFtZSkgOiBlbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gY2xhaW1fdGV4dChub2RlcywgZGF0YSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gJycgKyBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dChkYXRhKTtcbn1cbmZ1bmN0aW9uIGNsYWltX3NwYWNlKG5vZGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX3RleHQobm9kZXMsICcgJyk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC5kYXRhICE9PSBkYXRhKVxuICAgICAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gc2V0X2lucHV0X3ZhbHVlKGlucHV0LCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSAhPSBudWxsIHx8IGlucHV0LnZhbHVlKSB7XG4gICAgICAgIGlucHV0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X2lucHV0X3R5cGUoaW5wdXQsIHR5cGUpIHtcbiAgICB0cnkge1xuICAgICAgICBpbnB1dC50eXBlID0gdHlwZTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdHlsZShub2RlLCBrZXksIHZhbHVlLCBpbXBvcnRhbnQpIHtcbiAgICBub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUsIGltcG9ydGFudCA/ICdpbXBvcnRhbnQnIDogJycpO1xufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbihzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgaWYgKG9wdGlvbi5fX3ZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb25zKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB+dmFsdWUuaW5kZXhPZihvcHRpb24uX192YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X3ZhbHVlKHNlbGVjdCkge1xuICAgIGNvbnN0IHNlbGVjdGVkX29wdGlvbiA9IHNlbGVjdC5xdWVyeVNlbGVjdG9yKCc6Y2hlY2tlZCcpIHx8IHNlbGVjdC5vcHRpb25zWzBdO1xuICAgIHJldHVybiBzZWxlY3RlZF9vcHRpb24gJiYgc2VsZWN0ZWRfb3B0aW9uLl9fdmFsdWU7XG59XG5mdW5jdGlvbiBzZWxlY3RfbXVsdGlwbGVfdmFsdWUoc2VsZWN0KSB7XG4gICAgcmV0dXJuIFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKCc6Y2hlY2tlZCcpLCBvcHRpb24gPT4gb3B0aW9uLl9fdmFsdWUpO1xufVxuZnVuY3Rpb24gYWRkX3Jlc2l6ZV9saXN0ZW5lcihlbGVtZW50LCBmbikge1xuICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpLnBvc2l0aW9uID09PSAnc3RhdGljJykge1xuICAgICAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICB9XG4gICAgY29uc3Qgb2JqZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb2JqZWN0Jyk7XG4gICAgb2JqZWN0LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTogYmxvY2s7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBsZWZ0OiAwOyBoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogLTE7Jyk7XG4gICAgb2JqZWN0LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIG9iamVjdC50eXBlID0gJ3RleHQvaHRtbCc7XG4gICAgb2JqZWN0LnRhYkluZGV4ID0gLTE7XG4gICAgbGV0IHdpbjtcbiAgICBvYmplY3Qub25sb2FkID0gKCkgPT4ge1xuICAgICAgICB3aW4gPSBvYmplY3QuY29udGVudERvY3VtZW50LmRlZmF1bHRWaWV3O1xuICAgICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZm4pO1xuICAgIH07XG4gICAgaWYgKC9UcmlkZW50Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob2JqZWN0KTtcbiAgICAgICAgb2JqZWN0LmRhdGEgPSAnYWJvdXQ6YmxhbmsnO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgb2JqZWN0LmRhdGEgPSAnYWJvdXQ6YmxhbmsnO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKG9iamVjdCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGNhbmNlbDogKCkgPT4ge1xuICAgICAgICAgICAgd2luICYmIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyICYmIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmbik7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUNoaWxkKG9iamVjdCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gdG9nZ2xlX2NsYXNzKGVsZW1lbnQsIG5hbWUsIHRvZ2dsZSkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0W3RvZ2dsZSA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xufVxuZnVuY3Rpb24gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCkge1xuICAgIGNvbnN0IGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBmYWxzZSwgZmFsc2UsIGRldGFpbCk7XG4gICAgcmV0dXJuIGU7XG59XG5jbGFzcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihodG1sLCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIHRoaXMuZSA9IGVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmEgPSBhbmNob3I7XG4gICAgICAgIHRoaXMudShodG1sKTtcbiAgICB9XG4gICAgbSh0YXJnZXQsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydCh0YXJnZXQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnQgPSB0YXJnZXQ7XG4gICAgfVxuICAgIHUoaHRtbCkge1xuICAgICAgICB0aGlzLmUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgdGhpcy5uID0gQXJyYXkuZnJvbSh0aGlzLmUuY2hpbGROb2Rlcyk7XG4gICAgfVxuICAgIHAoaHRtbCkge1xuICAgICAgICB0aGlzLmQoKTtcbiAgICAgICAgdGhpcy51KGh0bWwpO1xuICAgICAgICB0aGlzLm0odGhpcy50LCB0aGlzLmEpO1xuICAgIH1cbiAgICBkKCkge1xuICAgICAgICB0aGlzLm4uZm9yRWFjaChkZXRhY2gpO1xuICAgIH1cbn1cblxubGV0IHN0eWxlc2hlZXQ7XG5sZXQgYWN0aXZlID0gMDtcbmxldCBjdXJyZW50X3J1bGVzID0ge307XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcbiAgICBsZXQgaGFzaCA9IDUzODE7XG4gICAgbGV0IGkgPSBzdHIubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSBeIHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBoYXNoID4+PiAwO1xufVxuZnVuY3Rpb24gY3JlYXRlX3J1bGUobm9kZSwgYSwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNlLCBmbiwgdWlkID0gMCkge1xuICAgIGNvbnN0IHN0ZXAgPSAxNi42NjYgLyBkdXJhdGlvbjtcbiAgICBsZXQga2V5ZnJhbWVzID0gJ3tcXG4nO1xuICAgIGZvciAobGV0IHAgPSAwOyBwIDw9IDE7IHAgKz0gc3RlcCkge1xuICAgICAgICBjb25zdCB0ID0gYSArIChiIC0gYSkgKiBlYXNlKHApO1xuICAgICAgICBrZXlmcmFtZXMgKz0gcCAqIDEwMCArIGAleyR7Zm4odCwgMSAtIHQpfX1cXG5gO1xuICAgIH1cbiAgICBjb25zdCBydWxlID0ga2V5ZnJhbWVzICsgYDEwMCUgeyR7Zm4oYiwgMSAtIGIpfX1cXG59YDtcbiAgICBjb25zdCBuYW1lID0gYF9fc3ZlbHRlXyR7aGFzaChydWxlKX1fJHt1aWR9YDtcbiAgICBpZiAoIWN1cnJlbnRfcnVsZXNbbmFtZV0pIHtcbiAgICAgICAgaWYgKCFzdHlsZXNoZWV0KSB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZSA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgICAgICAgIHN0eWxlc2hlZXQgPSBzdHlsZS5zaGVldDtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50X3J1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogYGB9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpXG4gICAgICAgIC5zcGxpdCgnLCAnKVxuICAgICAgICAuZmlsdGVyKG5hbWVcbiAgICAgICAgPyBhbmltID0+IGFuaW0uaW5kZXhPZihuYW1lKSA8IDAgLy8gcmVtb3ZlIHNwZWNpZmljIGFuaW1hdGlvblxuICAgICAgICA6IGFuaW0gPT4gYW5pbS5pbmRleE9mKCdfX3N2ZWx0ZScpID09PSAtMSAvLyByZW1vdmUgYWxsIFN2ZWx0ZSBhbmltYXRpb25zXG4gICAgKVxuICAgICAgICAuam9pbignLCAnKTtcbiAgICBpZiAobmFtZSAmJiAhLS1hY3RpdmUpXG4gICAgICAgIGNsZWFyX3J1bGVzKCk7XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgaSA9IHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgc3R5bGVzaGVldC5kZWxldGVSdWxlKGkpO1xuICAgICAgICBjdXJyZW50X3J1bGVzID0ge307XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9hbmltYXRpb24obm9kZSwgZnJvbSwgZm4sIHBhcmFtcykge1xuICAgIGlmICghZnJvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChmcm9tLmxlZnQgPT09IHRvLmxlZnQgJiYgZnJvbS5yaWdodCA9PT0gdG8ucmlnaHQgJiYgZnJvbS50b3AgPT09IHRvLnRvcCAmJiBmcm9tLmJvdHRvbSA9PT0gdG8uYm90dG9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86IHNob3VsZCB0aGlzIGJlIHNlcGFyYXRlZCBmcm9tIGRlc3RydWN0dXJpbmc/IE9yIHN0YXJ0L2VuZCBhZGRlZCB0byBwdWJsaWMgYXBpIGFuZCBkb2N1bWVudGF0aW9uP1xuICAgIHN0YXJ0OiBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOlxuICAgIGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbiwgdGljayA9IG5vb3AsIGNzcyB9ID0gZm4obm9kZSwgeyBmcm9tLCB0byB9LCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIGxldCBuYW1lO1xuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICBuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWxheSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpO1xuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgaWYgKCFzdGFydGVkICYmIG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcbiAgICAgICAgICAgIGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgc3RhcnQoKTtcbiAgICB0aWNrKDAsIDEpO1xuICAgIHJldHVybiBzdG9wO1xufVxuZnVuY3Rpb24gZml4X3Bvc2l0aW9uKG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKHN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHN0eWxlLnBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gc3R5bGU7XG4gICAgICAgIGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgYWRkX3RyYW5zZm9ybShub2RlLCBhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpIHtcbiAgICBjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoYS5sZWZ0ICE9PSBiLmxlZnQgfHwgYS50b3AgIT09IGIudG9wKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtID09PSAnbm9uZScgPyAnJyA6IHN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgbm9kZS5zdHlsZS50cmFuc2Zvcm0gPSBgJHt0cmFuc2Zvcm19IHRyYW5zbGF0ZSgke2EubGVmdCAtIGIubGVmdH1weCwgJHthLnRvcCAtIGIudG9wfXB4KWA7XG4gICAgfVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb25gKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5iZWZvcmVfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5hZnRlcl91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuKGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICBjb25zdCBzZWVuX2NhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbiAgICBkbyB7XG4gICAgICAgIC8vIGZpcnN0LCBjYWxsIGJlZm9yZVVwZGF0ZSBmdW5jdGlvbnNcbiAgICAgICAgLy8gYW5kIHVwZGF0ZSBjb21wb25lbnRzXG4gICAgICAgIHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gZGlydHlfY29tcG9uZW50cy5zaGlmdCgpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoY29tcG9uZW50LiQkKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoYmluZGluZ19jYWxsYmFja3MubGVuZ3RoKVxuICAgICAgICAgICAgYmluZGluZ19jYWxsYmFja3MucG9wKCkoKTtcbiAgICAgICAgLy8gdGhlbiwgb25jZSBjb21wb25lbnRzIGFyZSB1cGRhdGVkLCBjYWxsXG4gICAgICAgIC8vIGFmdGVyVXBkYXRlIGZ1bmN0aW9ucy4gVGhpcyBtYXkgY2F1c2VcbiAgICAgICAgLy8gc3Vic2VxdWVudCB1cGRhdGVzLi4uXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZW5kZXJfY2FsbGJhY2tzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWVuX2NhbGxiYWNrcy5oYXMoY2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAvLyAuLi5zbyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGxvb3BzXG4gICAgICAgICAgICAgICAgc2Vlbl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgfSB3aGlsZSAoZGlydHlfY29tcG9uZW50cy5sZW5ndGgpO1xuICAgIHdoaWxlIChmbHVzaF9jYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgIGZsdXNoX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgIH1cbiAgICB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG59XG5mdW5jdGlvbiB1cGRhdGUoJCQpIHtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgJCQudXBkYXRlKCk7XG4gICAgICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gJCQuZGlydHk7XG4gICAgICAgICQkLmRpcnR5ID0gWy0xXTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQucCgkJC5jdHgsIGRpcnR5KTtcbiAgICAgICAgJCQuYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG4gICAgfVxufVxuXG5sZXQgcHJvbWlzZTtcbmZ1bmN0aW9uIHdhaXQoKSB7XG4gICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5mdW5jdGlvbiBkaXNwYXRjaChub2RlLCBkaXJlY3Rpb24sIGtpbmQpIHtcbiAgICBub2RlLmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KGAke2RpcmVjdGlvbiA/ICdpbnRybycgOiAnb3V0cm8nfSR7a2luZH1gKSk7XG59XG5jb25zdCBvdXRyb2luZyA9IG5ldyBTZXQoKTtcbmxldCBvdXRyb3M7XG5mdW5jdGlvbiBncm91cF9vdXRyb3MoKSB7XG4gICAgb3V0cm9zID0ge1xuICAgICAgICByOiAwLFxuICAgICAgICBjOiBbXSxcbiAgICAgICAgcDogb3V0cm9zIC8vIHBhcmVudCBncm91cFxuICAgIH07XG59XG5mdW5jdGlvbiBjaGVja19vdXRyb3MoKSB7XG4gICAgaWYgKCFvdXRyb3Mucikge1xuICAgICAgICBydW5fYWxsKG91dHJvcy5jKTtcbiAgICB9XG4gICAgb3V0cm9zID0gb3V0cm9zLnA7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX2luKGJsb2NrLCBsb2NhbCkge1xuICAgIGlmIChibG9jayAmJiBibG9jay5pKSB7XG4gICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgIGJsb2NrLmkobG9jYWwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25fb3V0KGJsb2NrLCBsb2NhbCwgZGV0YWNoLCBjYWxsYmFjaykge1xuICAgIGlmIChibG9jayAmJiBibG9jay5vKSB7XG4gICAgICAgIGlmIChvdXRyb2luZy5oYXMoYmxvY2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBvdXRyb2luZy5hZGQoYmxvY2spO1xuICAgICAgICBvdXRyb3MuYy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZGV0YWNoKVxuICAgICAgICAgICAgICAgICAgICBibG9jay5kKDEpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBibG9jay5vKGxvY2FsKTtcbiAgICB9XG59XG5jb25zdCBudWxsX3RyYW5zaXRpb24gPSB7IGR1cmF0aW9uOiAwIH07XG5mdW5jdGlvbiBjcmVhdGVfaW5fdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IHVpZCA9IDA7XG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcywgdWlkKyspO1xuICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGlmICh0YXNrKVxuICAgICAgICAgICAgdGFzay5hYm9ydCgpO1xuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCB0cnVlLCAnc3RhcnQnKSk7XG4gICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0KCkge1xuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSk7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKGdvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGludmFsaWRhdGUoKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGVuZCgpIHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfb3V0X3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgY29uc3QgZ3JvdXAgPSBvdXRyb3M7XG4gICAgZ3JvdXAuciArPSAxO1xuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAxLCAwLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnc3RhcnQnKSk7XG4gICAgICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIS0tZ3JvdXAucikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB3aWxsIHJlc3VsdCBpbiBgZW5kKClgIGJlaW5nIGNhbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvIHdlIGRvbid0IG5lZWQgdG8gY2xlYW4gdXAgaGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVuX2FsbChncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxIC0gdCwgdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICB3YWl0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgIGdvKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ28oKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZW5kKHJlc2V0KSB7XG4gICAgICAgICAgICBpZiAocmVzZXQgJiYgY29uZmlnLnRpY2spIHtcbiAgICAgICAgICAgICAgICBjb25maWcudGljaygxLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcywgaW50cm8pIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgdCA9IGludHJvID8gMCA6IDE7XG4gICAgbGV0IHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgbGV0IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lID0gbnVsbDtcbiAgICBmdW5jdGlvbiBjbGVhcl9hbmltYXRpb24oKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5pdChwcm9ncmFtLCBkdXJhdGlvbikge1xuICAgICAgICBjb25zdCBkID0gcHJvZ3JhbS5iIC0gdDtcbiAgICAgICAgZHVyYXRpb24gKj0gTWF0aC5hYnMoZCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhOiB0LFxuICAgICAgICAgICAgYjogcHJvZ3JhbS5iLFxuICAgICAgICAgICAgZCxcbiAgICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgICAgc3RhcnQ6IHByb2dyYW0uc3RhcnQsXG4gICAgICAgICAgICBlbmQ6IHByb2dyYW0uc3RhcnQgKyBkdXJhdGlvbixcbiAgICAgICAgICAgIGdyb3VwOiBwcm9ncmFtLmdyb3VwXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKGIpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgY29uc3QgcHJvZ3JhbSA9IHtcbiAgICAgICAgICAgIHN0YXJ0OiBub3coKSArIGRlbGF5LFxuICAgICAgICAgICAgYlxuICAgICAgICB9O1xuICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICBwcm9ncmFtLmdyb3VwID0gb3V0cm9zO1xuICAgICAgICAgICAgb3V0cm9zLnIgKz0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBwcm9ncmFtO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhbiBpbnRybywgYW5kIHRoZXJlJ3MgYSBkZWxheSwgd2UgbmVlZCB0byBkb1xuICAgICAgICAgICAgLy8gYW4gaW5pdGlhbCB0aWNrIGFuZC9vciBhcHBseSBDU1MgYW5pbWF0aW9uIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChiKVxuICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHByb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgYiwgJ3N0YXJ0JykpO1xuICAgICAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwZW5kaW5nX3Byb2dyYW0gJiYgbm93ID4gcGVuZGluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocGVuZGluZ19wcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnc3RhcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIHJ1bm5pbmdfcHJvZ3JhbS5iLCBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24sIDAsIGVhc2luZywgY29uZmlnLmNzcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCA9IHJ1bm5pbmdfcHJvZ3JhbS5iLCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSBkb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbS5iKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludHJvIOKAlCB3ZSBjYW4gdGlkeSB1cCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG91dHJvIOKAlCBuZWVkcyB0byBiZSBjb29yZGluYXRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIS0tcnVubmluZ19wcm9ncmFtLmdyb3VwLnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKHJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBydW5uaW5nX3Byb2dyYW0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ID0gcnVubmluZ19wcm9ncmFtLmEgKyBydW5uaW5nX3Byb2dyYW0uZCAqIGVhc2luZyhwIC8gcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhIShydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJ1bihiKSB7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX3Byb21pc2UocHJvbWlzZSwgaW5mbykge1xuICAgIGNvbnN0IHRva2VuID0gaW5mby50b2tlbiA9IHt9O1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSh0eXBlLCBpbmRleCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoaW5mby50b2tlbiAhPT0gdG9rZW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IGNoaWxkX2N0eCA9IGluZm8uY3R4O1xuICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNoaWxkX2N0eCA9IGNoaWxkX2N0eC5zbGljZSgpO1xuICAgICAgICAgICAgY2hpbGRfY3R4W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBibG9jayA9IHR5cGUgJiYgKGluZm8uY3VycmVudCA9IHR5cGUpKGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBuZWVkc19mbHVzaCA9IGZhbHNlO1xuICAgICAgICBpZiAoaW5mby5ibG9jaykge1xuICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzKSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9ja3MuZm9yRWFjaCgoYmxvY2ssIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4ICYmIGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cF9vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5ibG9ja3NbaV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja19vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9jay5kKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgICAgICBibG9jay5tKGluZm8ubW91bnQoKSwgaW5mby5hbmNob3IpO1xuICAgICAgICAgICAgbmVlZHNfZmx1c2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8uYmxvY2sgPSBibG9jaztcbiAgICAgICAgaWYgKGluZm8uYmxvY2tzKVxuICAgICAgICAgICAgaW5mby5ibG9ja3NbaW5kZXhdID0gYmxvY2s7XG4gICAgICAgIGlmIChuZWVkc19mbHVzaCkge1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNfcHJvbWlzZShwcm9taXNlKSkge1xuICAgICAgICBjb25zdCBjdXJyZW50X2NvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgICAgICBwcm9taXNlLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLmNhdGNoLCAyLCBpbmZvLmVycm9yLCBlcnJvcik7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBpZiB3ZSBwcmV2aW91c2x5IGhhZCBhIHRoZW4vY2F0Y2ggYmxvY2ssIGRlc3Ryb3kgaXRcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby5wZW5kaW5nKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby5wZW5kaW5nLCAwKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnRoZW4pIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHByb21pc2UpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHByb21pc2U7XG4gICAgfVxufVxuXG5jb25zdCBnbG9iYWxzID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogZ2xvYmFsKTtcblxuZnVuY3Rpb24gZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZCgxKTtcbiAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG59XG5mdW5jdGlvbiBvdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gZml4X2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBvdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZV9rZXllZF9lYWNoKG9sZF9ibG9ja3MsIGRpcnR5LCBnZXRfa2V5LCBkeW5hbWljLCBjdHgsIGxpc3QsIGxvb2t1cCwgbm9kZSwgZGVzdHJveSwgY3JlYXRlX2VhY2hfYmxvY2ssIG5leHQsIGdldF9jb250ZXh0KSB7XG4gICAgbGV0IG8gPSBvbGRfYmxvY2tzLmxlbmd0aDtcbiAgICBsZXQgbiA9IGxpc3QubGVuZ3RoO1xuICAgIGxldCBpID0gbztcbiAgICBjb25zdCBvbGRfaW5kZXhlcyA9IHt9O1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIG9sZF9pbmRleGVzW29sZF9ibG9ja3NbaV0ua2V5XSA9IGk7XG4gICAgY29uc3QgbmV3X2Jsb2NrcyA9IFtdO1xuICAgIGNvbnN0IG5ld19sb29rdXAgPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgZGVsdGFzID0gbmV3IE1hcCgpO1xuICAgIGkgPSBuO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgY2hpbGRfY3R4ID0gZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKTtcbiAgICAgICAgY29uc3Qga2V5ID0gZ2V0X2tleShjaGlsZF9jdHgpO1xuICAgICAgICBsZXQgYmxvY2sgPSBsb29rdXAuZ2V0KGtleSk7XG4gICAgICAgIGlmICghYmxvY2spIHtcbiAgICAgICAgICAgIGJsb2NrID0gY3JlYXRlX2VhY2hfYmxvY2soa2V5LCBjaGlsZF9jdHgpO1xuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGR5bmFtaWMpIHtcbiAgICAgICAgICAgIGJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG4gICAgICAgIH1cbiAgICAgICAgbmV3X2xvb2t1cC5zZXQoa2V5LCBuZXdfYmxvY2tzW2ldID0gYmxvY2spO1xuICAgICAgICBpZiAoa2V5IGluIG9sZF9pbmRleGVzKVxuICAgICAgICAgICAgZGVsdGFzLnNldChrZXksIE1hdGguYWJzKGkgLSBvbGRfaW5kZXhlc1trZXldKSk7XG4gICAgfVxuICAgIGNvbnN0IHdpbGxfbW92ZSA9IG5ldyBTZXQoKTtcbiAgICBjb25zdCBkaWRfbW92ZSA9IG5ldyBTZXQoKTtcbiAgICBmdW5jdGlvbiBpbnNlcnQoYmxvY2spIHtcbiAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgIGJsb2NrLm0obm9kZSwgbmV4dCk7XG4gICAgICAgIGxvb2t1cC5zZXQoYmxvY2sua2V5LCBibG9jayk7XG4gICAgICAgIG5leHQgPSBibG9jay5maXJzdDtcbiAgICAgICAgbi0tO1xuICAgIH1cbiAgICB3aGlsZSAobyAmJiBuKSB7XG4gICAgICAgIGNvbnN0IG5ld19ibG9jayA9IG5ld19ibG9ja3NbbiAtIDFdO1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW28gLSAxXTtcbiAgICAgICAgY29uc3QgbmV3X2tleSA9IG5ld19ibG9jay5rZXk7XG4gICAgICAgIGNvbnN0IG9sZF9rZXkgPSBvbGRfYmxvY2sua2V5O1xuICAgICAgICBpZiAobmV3X2Jsb2NrID09PSBvbGRfYmxvY2spIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICAgICAgICAgIG5leHQgPSBuZXdfYmxvY2suZmlyc3Q7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgICAgICBuLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgb2xkIGJsb2NrXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbG9va3VwLmhhcyhuZXdfa2V5KSB8fCB3aWxsX21vdmUuaGFzKG5ld19rZXkpKSB7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkaWRfbW92ZS5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZWx0YXMuZ2V0KG5ld19rZXkpID4gZGVsdGFzLmdldChvbGRfa2V5KSkge1xuICAgICAgICAgICAgZGlkX21vdmUuYWRkKG5ld19rZXkpO1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3aWxsX21vdmUuYWRkKG9sZF9rZXkpO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIHdoaWxlIChvLS0pIHtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvXTtcbiAgICAgICAgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfYmxvY2sua2V5KSlcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgIH1cbiAgICB3aGlsZSAobilcbiAgICAgICAgaW5zZXJ0KG5ld19ibG9ja3NbbiAtIDFdKTtcbiAgICByZXR1cm4gbmV3X2Jsb2Nrcztcbn1cbmZ1bmN0aW9uIG1lYXN1cmUoYmxvY2tzKSB7XG4gICAgY29uc3QgcmVjdHMgPSB7fTtcbiAgICBsZXQgaSA9IGJsb2Nrcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgcmVjdHNbYmxvY2tzW2ldLmtleV0gPSBibG9ja3NbaV0ubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4gcmVjdHM7XG59XG5cbmZ1bmN0aW9uIGdldF9zcHJlYWRfdXBkYXRlKGxldmVscywgdXBkYXRlcykge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHt9O1xuICAgIGNvbnN0IHRvX251bGxfb3V0ID0ge307XG4gICAgY29uc3QgYWNjb3VudGVkX2ZvciA9IHsgJCRzY29wZTogMSB9O1xuICAgIGxldCBpID0gbGV2ZWxzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IG8gPSBsZXZlbHNbaV07XG4gICAgICAgIGNvbnN0IG4gPSB1cGRhdGVzW2ldO1xuICAgICAgICBpZiAobikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGlmICghKGtleSBpbiBuKSlcbiAgICAgICAgICAgICAgICAgICAgdG9fbnVsbF9vdXRba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBuKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhY2NvdW50ZWRfZm9yW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlW2tleV0gPSBuW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV2ZWxzW2ldID0gbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIHRvX251bGxfb3V0KSB7XG4gICAgICAgIGlmICghKGtleSBpbiB1cGRhdGUpKVxuICAgICAgICAgICAgdXBkYXRlW2tleV0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB1cGRhdGU7XG59XG5mdW5jdGlvbiBnZXRfc3ByZWFkX29iamVjdChzcHJlYWRfcHJvcHMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHNwcmVhZF9wcm9wcyA9PT0gJ29iamVjdCcgJiYgc3ByZWFkX3Byb3BzICE9PSBudWxsID8gc3ByZWFkX3Byb3BzIDoge307XG59XG5cbi8vIHNvdXJjZTogaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvaW5kaWNlcy5odG1sXG5jb25zdCBib29sZWFuX2F0dHJpYnV0ZXMgPSBuZXcgU2V0KFtcbiAgICAnYWxsb3dmdWxsc2NyZWVuJyxcbiAgICAnYWxsb3dwYXltZW50cmVxdWVzdCcsXG4gICAgJ2FzeW5jJyxcbiAgICAnYXV0b2ZvY3VzJyxcbiAgICAnYXV0b3BsYXknLFxuICAgICdjaGVja2VkJyxcbiAgICAnY29udHJvbHMnLFxuICAgICdkZWZhdWx0JyxcbiAgICAnZGVmZXInLFxuICAgICdkaXNhYmxlZCcsXG4gICAgJ2Zvcm1ub3ZhbGlkYXRlJyxcbiAgICAnaGlkZGVuJyxcbiAgICAnaXNtYXAnLFxuICAgICdsb29wJyxcbiAgICAnbXVsdGlwbGUnLFxuICAgICdtdXRlZCcsXG4gICAgJ25vbW9kdWxlJyxcbiAgICAnbm92YWxpZGF0ZScsXG4gICAgJ29wZW4nLFxuICAgICdwbGF5c2lubGluZScsXG4gICAgJ3JlYWRvbmx5JyxcbiAgICAncmVxdWlyZWQnLFxuICAgICdyZXZlcnNlZCcsXG4gICAgJ3NlbGVjdGVkJ1xuXSk7XG5cbmNvbnN0IGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyID0gL1tcXHMnXCI+Lz1cXHV7RkREMH0tXFx1e0ZERUZ9XFx1e0ZGRkV9XFx1e0ZGRkZ9XFx1ezFGRkZFfVxcdXsxRkZGRn1cXHV7MkZGRkV9XFx1ezJGRkZGfVxcdXszRkZGRX1cXHV7M0ZGRkZ9XFx1ezRGRkZFfVxcdXs0RkZGRn1cXHV7NUZGRkV9XFx1ezVGRkZGfVxcdXs2RkZGRX1cXHV7NkZGRkZ9XFx1ezdGRkZFfVxcdXs3RkZGRn1cXHV7OEZGRkV9XFx1ezhGRkZGfVxcdXs5RkZGRX1cXHV7OUZGRkZ9XFx1e0FGRkZFfVxcdXtBRkZGRn1cXHV7QkZGRkV9XFx1e0JGRkZGfVxcdXtDRkZGRX1cXHV7Q0ZGRkZ9XFx1e0RGRkZFfVxcdXtERkZGRn1cXHV7RUZGRkV9XFx1e0VGRkZGfVxcdXtGRkZGRX1cXHV7RkZGRkZ9XFx1ezEwRkZGRX1cXHV7MTBGRkZGfV0vdTtcbi8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3N5bnRheC5odG1sI2F0dHJpYnV0ZXMtMlxuLy8gaHR0cHM6Ly9pbmZyYS5zcGVjLndoYXR3Zy5vcmcvI25vbmNoYXJhY3RlclxuZnVuY3Rpb24gc3ByZWFkKGFyZ3MsIGNsYXNzZXNfdG9fYWRkKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIC4uLmFyZ3MpO1xuICAgIGlmIChjbGFzc2VzX3RvX2FkZCkge1xuICAgICAgICBpZiAoYXR0cmlidXRlcy5jbGFzcyA9PSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLmNsYXNzID0gY2xhc3Nlc190b19hZGQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLmNsYXNzICs9ICcgJyArIGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBzdHIgPSAnJztcbiAgICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBpZiAoaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIudGVzdChuYW1lKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpXG4gICAgICAgICAgICBzdHIgKz0gXCIgXCIgKyBuYW1lO1xuICAgICAgICBlbHNlIGlmIChib29sZWFuX2F0dHJpYnV0ZXMuaGFzKG5hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAgICAgICAgICBzdHIgKz0gXCIgXCIgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciArPSBcIiBcIiArIG5hbWUgKyBcIj1cIiArIEpTT04uc3RyaW5naWZ5KFN0cmluZyh2YWx1ZSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCIvZywgJyYjMzQ7JylcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgZXNjYXBlZCA9IHtcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0Oydcbn07XG5mdW5jdGlvbiBlc2NhcGUoaHRtbCkge1xuICAgIHJldHVybiBTdHJpbmcoaHRtbCkucmVwbGFjZSgvW1wiJyY8Pl0vZywgbWF0Y2ggPT4gZXNjYXBlZFttYXRjaF0pO1xufVxuZnVuY3Rpb24gZWFjaChpdGVtcywgZm4pIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBzdHIgKz0gZm4oaXRlbXNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgbWlzc2luZ19jb21wb25lbnQgPSB7XG4gICAgJCRyZW5kZXI6ICgpID0+ICcnXG59O1xuZnVuY3Rpb24gdmFsaWRhdGVfY29tcG9uZW50KGNvbXBvbmVudCwgbmFtZSkge1xuICAgIGlmICghY29tcG9uZW50IHx8ICFjb21wb25lbnQuJCRyZW5kZXIpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdzdmVsdGU6Y29tcG9uZW50JylcbiAgICAgICAgICAgIG5hbWUgKz0gJyB0aGlzPXsuLi59JztcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGA8JHtuYW1lfT4gaXMgbm90IGEgdmFsaWQgU1NSIGNvbXBvbmVudC4gWW91IG1heSBuZWVkIHRvIHJldmlldyB5b3VyIGJ1aWxkIGNvbmZpZyB0byBlbnN1cmUgdGhhdCBkZXBlbmRlbmNpZXMgYXJlIGNvbXBpbGVkLCByYXRoZXIgdGhhbiBpbXBvcnRlZCBhcyBwcmUtY29tcGlsZWQgbW9kdWxlc2ApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cykge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgICAgIC8vIHRoZXNlIHdpbGwgYmUgaW1tZWRpYXRlbHkgZGlzY2FyZGVkXG4gICAgICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpXG4gICAgICAgIH07XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudCh7ICQkIH0pO1xuICAgICAgICBjb25zdCBodG1sID0gZm4ocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyOiAocHJvcHMgPSB7fSwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgICAgICAgICBvbl9kZXN0cm95ID0gW107XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGhlYWQ6ICcnLCBjc3M6IG5ldyBTZXQoKSB9O1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9ICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIHt9LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJ1bl9hbGwob25fZGVzdHJveSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IEFycmF5LmZyb20ocmVzdWx0LmNzcykubWFwKGNzcyA9PiBjc3MuY29kZSkuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbnVsbCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoZWFkOiByZXN1bHQuaGVhZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgJCRyZW5kZXJcbiAgICB9O1xufVxuZnVuY3Rpb24gYWRkX2F0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IChib29sZWFuICYmICF2YWx1ZSkpXG4gICAgICAgIHJldHVybiAnJztcbiAgICByZXR1cm4gYCAke25hbWV9JHt2YWx1ZSA9PT0gdHJ1ZSA/ICcnIDogYD0ke3R5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeShlc2NhcGUodmFsdWUpKSA6IGBcIiR7dmFsdWV9XCJgfWB9YDtcbn1cbmZ1bmN0aW9uIGFkZF9jbGFzc2VzKGNsYXNzZXMpIHtcbiAgICByZXR1cm4gY2xhc3NlcyA/IGAgY2xhc3M9XCIke2NsYXNzZXN9XCJgIDogYGA7XG59XG5cbmZ1bmN0aW9uIGJpbmQoY29tcG9uZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGluZGV4ID0gY29tcG9uZW50LiQkLnByb3BzW25hbWVdO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudC4kJC5ib3VuZFtpbmRleF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtpbmRleF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZV9jb21wb25lbnQoYmxvY2spIHtcbiAgICBibG9jayAmJiBibG9jay5jKCk7XG59XG5mdW5jdGlvbiBjbGFpbV9jb21wb25lbnQoYmxvY2ssIHBhcmVudF9ub2Rlcykge1xuICAgIGJsb2NrICYmIGJsb2NrLmwocGFyZW50X25vZGVzKTtcbn1cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yKSB7XG4gICAgY29uc3QgeyBmcmFnbWVudCwgb25fbW91bnQsIG9uX2Rlc3Ryb3ksIGFmdGVyX3VwZGF0ZSB9ID0gY29tcG9uZW50LiQkO1xuICAgIGZyYWdtZW50ICYmIGZyYWdtZW50Lm0odGFyZ2V0LCBhbmNob3IpO1xuICAgIC8vIG9uTW91bnQgaGFwcGVucyBiZWZvcmUgdGhlIGluaXRpYWwgYWZ0ZXJVcGRhdGVcbiAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgY29uc3QgbmV3X29uX2Rlc3Ryb3kgPSBvbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICBpZiAob25fZGVzdHJveSkge1xuICAgICAgICAgICAgb25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgLy8gbW9zdCBsaWtlbHkgYXMgYSByZXN1bHQgb2YgYSBiaW5kaW5nIGluaXRpYWxpc2luZ1xuICAgICAgICAgICAgcnVuX2FsbChuZXdfb25fZGVzdHJveSk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50LiQkLm9uX21vdW50ID0gW107XG4gICAgfSk7XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgcHJvcF92YWx1ZXMgPSBvcHRpb25zLnByb3BzIHx8IHt9O1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkID0ge1xuICAgICAgICBmcmFnbWVudDogbnVsbCxcbiAgICAgICAgY3R4OiBudWxsLFxuICAgICAgICAvLyBzdGF0ZVxuICAgICAgICBwcm9wcyxcbiAgICAgICAgdXBkYXRlOiBub29wLFxuICAgICAgICBub3RfZXF1YWwsXG4gICAgICAgIGJvdW5kOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgLy8gbGlmZWN5Y2xlXG4gICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgb25fZGVzdHJveTogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSksXG4gICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICBkaXJ0eVxuICAgIH07XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIHByb3BfdmFsdWVzLCAoaSwgcmV0LCB2YWx1ZSA9IHJldCkgPT4ge1xuICAgICAgICAgICAgaWYgKCQkLmN0eCAmJiBub3RfZXF1YWwoJCQuY3R4W2ldLCAkJC5jdHhbaV0gPSB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCQuYm91bmRbaV0pXG4gICAgICAgICAgICAgICAgICAgICQkLmJvdW5kW2ldKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkpXG4gICAgICAgICAgICAgICAgICAgIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0pXG4gICAgICAgIDogW107XG4gICAgJCQudXBkYXRlKCk7XG4gICAgcmVhZHkgPSB0cnVlO1xuICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgLy8gYGZhbHNlYCBhcyBhIHNwZWNpYWwgY2FzZSBvZiBubyBET00gY29tcG9uZW50XG4gICAgJCQuZnJhZ21lbnQgPSBjcmVhdGVfZnJhZ21lbnQgPyBjcmVhdGVfZnJhZ21lbnQoJCQuY3R4KSA6IGZhbHNlO1xuICAgIGlmIChvcHRpb25zLnRhcmdldCkge1xuICAgICAgICBpZiAob3B0aW9ucy5oeWRyYXRlKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQubChjaGlsZHJlbihvcHRpb25zLnRhcmdldCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnRybylcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oY29tcG9uZW50LiQkLmZyYWdtZW50KTtcbiAgICAgICAgbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgb3B0aW9ucy50YXJnZXQsIG9wdGlvbnMuYW5jaG9yKTtcbiAgICAgICAgZmx1c2goKTtcbiAgICB9XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xufVxubGV0IFN2ZWx0ZUVsZW1lbnQ7XG5pZiAodHlwZW9mIEhUTUxFbGVtZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgU3ZlbHRlRWxlbWVudCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLiQkLnNsb3R0ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy4kJC5zbG90dGVkW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyLCBfb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzW2F0dHJdID0gbmV3VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgJGRlc3Ryb3koKSB7XG4gICAgICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgICAgICB9XG4gICAgICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gVE9ETyBzaG91bGQgdGhpcyBkZWxlZ2F0ZSB0byBhZGRFdmVudExpc3RlbmVyP1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAkc2V0KCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGRlbiBieSBpbnN0YW5jZSwgaWYgaXQgaGFzIHByb3BzXG4gICAgICAgIH1cbiAgICB9O1xufVxuY2xhc3MgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgIH1cbiAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJHNldCgpIHtcbiAgICAgICAgLy8gb3ZlcnJpZGRlbiBieSBpbnN0YW5jZSwgaWYgaXQgaGFzIHByb3BzXG4gICAgfVxufVxuXG5mdW5jdGlvbiBkaXNwYXRjaF9kZXYodHlwZSwgZGV0YWlsKSB7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTUluc2VydFwiLCB7IHRhcmdldCwgbm9kZSB9KTtcbiAgICBhcHBlbmQodGFyZ2V0LCBub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9kZXYodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01JbnNlcnRcIiwgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlXCIsIHsgbm9kZSB9KTtcbiAgICBkZXRhY2gobm9kZSk7XG59XG5mdW5jdGlvbiBkZXRhY2hfYmV0d2Vlbl9kZXYoYmVmb3JlLCBhZnRlcikge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2JlZm9yZV9kZXYoYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYWZ0ZXJfZGV2KGJlZm9yZSkge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxpc3Rlbl9kZXYobm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMsIGhhc19wcmV2ZW50X2RlZmF1bHQsIGhhc19zdG9wX3Byb3BhZ2F0aW9uKSB7XG4gICAgY29uc3QgbW9kaWZpZXJzID0gb3B0aW9ucyA9PT0gdHJ1ZSA/IFtcImNhcHR1cmVcIl0gOiBvcHRpb25zID8gQXJyYXkuZnJvbShPYmplY3Qua2V5cyhvcHRpb25zKSkgOiBbXTtcbiAgICBpZiAoaGFzX3ByZXZlbnRfZGVmYXVsdClcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3ByZXZlbnREZWZhdWx0Jyk7XG4gICAgaWYgKGhhc19zdG9wX3Byb3BhZ2F0aW9uKVxuICAgICAgICBtb2RpZmllcnMucHVzaCgnc3RvcFByb3BhZ2F0aW9uJyk7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NQWRkRXZlbnRMaXN0ZW5lclwiLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlRXZlbnRMaXN0ZW5lclwiLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgICAgIGRpc3Bvc2UoKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cl9kZXYobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZVwiLCB7IG5vZGUsIGF0dHJpYnV0ZSB9KTtcbiAgICBlbHNlXG4gICAgICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldEF0dHJpYnV0ZVwiLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldFByb3BlcnR5XCIsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gZGF0YXNldF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZS5kYXRhc2V0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldERhdGFzZXRcIiwgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YV9kZXYodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQuZGF0YSA9PT0gZGF0YSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldERhdGFcIiwgeyBub2RlOiB0ZXh0LCBkYXRhIH0pO1xuICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5jbGFzcyBTdmVsdGVDb21wb25lbnREZXYgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICghb3B0aW9ucy50YXJnZXQgJiYgIW9wdGlvbnMuJCRpbmxpbmUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCd0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uYCk7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIHN1cGVyLiRkZXN0cm95KCk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYENvbXBvbmVudCB3YXMgYWxyZWFkeSBkZXN0cm95ZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH07XG4gICAgfVxufVxuZnVuY3Rpb24gbG9vcF9ndWFyZCh0aW1lb3V0KSB7XG4gICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnQgPiB0aW1lb3V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEluZmluaXRlIGxvb3AgZGV0ZWN0ZWRgKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEh0bWxUYWcsIFN2ZWx0ZUNvbXBvbmVudCwgU3ZlbHRlQ29tcG9uZW50RGV2LCBTdmVsdGVFbGVtZW50LCBhY3Rpb25fZGVzdHJveWVyLCBhZGRfYXR0cmlidXRlLCBhZGRfY2xhc3NlcywgYWRkX2ZsdXNoX2NhbGxiYWNrLCBhZGRfbG9jYXRpb24sIGFkZF9yZW5kZXJfY2FsbGJhY2ssIGFkZF9yZXNpemVfbGlzdGVuZXIsIGFkZF90cmFuc2Zvcm0sIGFmdGVyVXBkYXRlLCBhcHBlbmQsIGFwcGVuZF9kZXYsIGFzc2lnbiwgYXR0ciwgYXR0cl9kZXYsIGJlZm9yZVVwZGF0ZSwgYmluZCwgYmluZGluZ19jYWxsYmFja3MsIGJsYW5rX29iamVjdCwgYnViYmxlLCBjaGVja19vdXRyb3MsIGNoaWxkcmVuLCBjbGFpbV9jb21wb25lbnQsIGNsYWltX2VsZW1lbnQsIGNsYWltX3NwYWNlLCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tcG9uZW50X3N1YnNjcmliZSwgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlc2NhcGUsIGVzY2FwZWQsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZ2V0Q29udGV4dCwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X3Nsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dCwgZ2V0X3NwcmVhZF9vYmplY3QsIGdldF9zcHJlYWRfdXBkYXRlLCBnZXRfc3RvcmVfdmFsdWUsIGdsb2JhbHMsIGdyb3VwX291dHJvcywgaGFuZGxlX3Byb21pc2UsIGhhc19wcm9wLCBpZGVudGl0eSwgaW5pdCwgaW5zZXJ0LCBpbnNlcnRfZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Z1bmN0aW9uLCBpc19wcm9taXNlLCBsaXN0ZW4sIGxpc3Rlbl9kZXYsIGxvb3AsIGxvb3BfZ3VhcmQsIG1lYXN1cmUsIG1pc3NpbmdfY29tcG9uZW50LCBtb3VudF9jb21wb25lbnQsIG5vb3AsIG5vdF9lcXVhbCwgbm93LCBudWxsX3RvX2VtcHR5LCBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzLCBvbkRlc3Ryb3ksIG9uTW91bnQsIG9uY2UsIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBwcmV2ZW50X2RlZmF1bHQsIHByb3BfZGV2LCByYWYsIHJ1biwgcnVuX2FsbCwgc2FmZV9ub3RfZXF1YWwsIHNjaGVkdWxlX3VwZGF0ZSwgc2VsZWN0X211bHRpcGxlX3ZhbHVlLCBzZWxlY3Rfb3B0aW9uLCBzZWxlY3Rfb3B0aW9ucywgc2VsZWN0X3ZhbHVlLCBzZWxmLCBzZXRDb250ZXh0LCBzZXRfYXR0cmlidXRlcywgc2V0X2N1cnJlbnRfY29tcG9uZW50LCBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YSwgc2V0X2RhdGEsIHNldF9kYXRhX2Rldiwgc2V0X2lucHV0X3R5cGUsIHNldF9pbnB1dF92YWx1ZSwgc2V0X25vdywgc2V0X3JhZiwgc2V0X3N0b3JlX3ZhbHVlLCBzZXRfc3R5bGUsIHNldF9zdmdfYXR0cmlidXRlcywgc3BhY2UsIHNwcmVhZCwgc3RvcF9wcm9wYWdhdGlvbiwgc3Vic2NyaWJlLCBzdmdfZWxlbWVudCwgdGV4dCwgdGljaywgdGltZV9yYW5nZXNfdG9fYXJyYXksIHRvX251bWJlciwgdG9nZ2xlX2NsYXNzLCB0cmFuc2l0aW9uX2luLCB0cmFuc2l0aW9uX291dCwgdXBkYXRlX2tleWVkX2VhY2gsIHZhbGlkYXRlX2NvbXBvbmVudCwgdmFsaWRhdGVfc3RvcmUsIHhsaW5rX2F0dHIgfTtcbiIsIjxzY3JpcHQ+XG5cbiAgICBpbXBvcnQgeyBvbk1vdW50LCBvbkRlc3Ryb3kgfSBmcm9tICdzdmVsdGUnO1xuXG5cbiAgICBleHBvcnQgbGV0IHRyYW5zaXRpb25EdXJhdGlvbiA9IDIwMDtcbiAgICBleHBvcnQgbGV0IHNob3dJbmRpY2F0b3JzID0gZmFsc2U7XG4gICAgZXhwb3J0IGxldCBhdXRvcGxheSA9IGZhbHNlO1xuICAgIGV4cG9ydCBsZXQgZGVsYXkgPSAxMDAwO1xuXG5cblxuICAgIGxldCBhY3RpdmVJbmRpY2F0b3IgPSAwO1xuICAgIGxldCBpbmRpY2F0b3JzO1xuICAgIGxldCBpdGVtcyA9IDA7XG4gICAgbGV0IGF2YWlsYWJsZVdpZHRoID0gMDtcbiAgICBsZXQgdG9wQ2xlYXJlbmNlID0gMDtcblxuICAgIGxldCBlbGVtcztcbiAgICBsZXQgZGlmZiA9IDA7XG5cbiAgICBsZXQgc3dpcGVXcmFwcGVyO1xuICAgIGxldCBzd2lwZUhhbmRsZXI7XG5cbiAgICBsZXQgbWluID0gMDtcbiAgICBsZXQgdG91Y2hpbmdUcGwgPSBgXG4gICAgLXdlYmtpdC10cmFuc2l0aW9uLWR1cmF0aW9uOiAwcztcbiAgICB0cmFuc2l0aW9uLWR1cmF0aW9uOiAwcztcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLXt7dmFsfX1weCwgMCwgMCk7XG4gICAgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLXt7dmFsfX1weCwgMCwgMCk7YDtcbiAgICBsZXQgbm9uX3RvdWNoaW5nVHBsID0gYFxuICAgIC13ZWJraXQtdHJhbnNpdGlvbi1kdXJhdGlvbjogJHt0cmFuc2l0aW9uRHVyYXRpb259bXM7XG4gICAgdHJhbnNpdGlvbi1kdXJhdGlvbjogJHt0cmFuc2l0aW9uRHVyYXRpb259bXM7XG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKC17e3ZhbH19cHgsIDAsIDApO1xuICAgIC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKC17e3ZhbH19cHgsIDAsIDApO2A7XG4gICAgbGV0IHRvdWNoaW5nID0gZmFsc2U7XG4gICAgbGV0IHBvc1ggPSAwO1xuICAgIGxldCBkaXIgPSAwO1xuICAgIGxldCB4O1xuXG5cblxuICAgIGxldCBwbGF5ZWQgPSAwO1xuICAgIGxldCBydW5faW50ZXJ2YWwgPSBmYWxzZTtcblxuICAgICQ6IGluZGljYXRvcnMgPSBBcnJheShpdGVtcyk7XG5cbiAgICAkOiB7XG4gICAgICAgIGlmKGF1dG9wbGF5ICYmICFydW5faW50ZXJ2YWwpe1xuICAgICAgICAgICAgcnVuX2ludGVydmFsID0gc2V0SW50ZXJ2YWwoY2hhbmdlVmlldyAsIGRlbGF5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCFhdXRvcGxheSAmJiBydW5faW50ZXJ2YWwpe1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChydW5faW50ZXJ2YWwpXG4gICAgICAgICAgICBydW5faW50ZXJ2YWwgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gdXBkYXRlKCl7XG4gICAgICAgIHN3aXBlSGFuZGxlci5zdHlsZS50b3AgPSB0b3BDbGVhcmVuY2UgKyAncHgnO1xuICAgICAgICBhdmFpbGFibGVXaWR0aCA9IHN3aXBlV3JhcHBlci5xdWVyeVNlbGVjdG9yKCcuc3dpcGVhYmxlLWl0ZW1zJykub2Zmc2V0V2lkdGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXM7IGkrKykge1xuICAgICAgICAgICAgZWxlbXNbaV0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZTNkKCcgKyAoYXZhaWxhYmxlV2lkdGggKiBpKSArICdweCwgMCwgMCknO1xuICAgICAgICB9XG4gICAgICAgIGRpZmYgPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluaXQoKXtcbiAgICAgICAgZWxlbXMgPSBzd2lwZVdyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgnLnN3aXBlYWJsZS1pdGVtJyk7XG4gICAgICAgIGl0ZW1zID0gZWxlbXMubGVuZ3RoO1xuICAgICAgICB1cGRhdGUoKTtcbiAgICB9XG5cbiAgICBvbk1vdW50KCgpID0+IHtcbiAgICAgICAgaW5pdCgpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdXBkYXRlKTtcbiAgICB9KTtcblxuXG5cbiAgICBvbkRlc3Ryb3koKCk9PntcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHVwZGF0ZSk7XG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIG1vdmVIYW5kbGVyKGUpe1xuICAgICAgICBpZiAodG91Y2hpbmcpIHtcbiAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cbiAgICAgICAgICAgIGxldCBtYXggPSBhdmFpbGFibGVXaWR0aDtcblxuICAgICAgICAgICAgbGV0IF94ID0gZS50b3VjaGVzID8gZS50b3VjaGVzWzBdLnBhZ2VYIDogZS5wYWdlWDtcbiAgICAgICAgICAgIGxldCBfZGlmZiA9ICh4IC0gX3gpICsgcG9zWDtcbiAgICAgICAgICAgIGxldCBkaXIgPSBfeCA+IHggPyAwIDogMTtcbiAgICAgICAgICAgIGlmICghZGlyKSB7IF9kaWZmID0gcG9zWCAtIChfeCAtIHgpIH1cbiAgICAgICAgICAgIGlmIChfZGlmZiA8PSAobWF4ICogKGl0ZW1zIC0gMSkpICYmIF9kaWZmID49IG1pbikge1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZSA9IGkgPCAwID8gJ3t7dmFsfX0nIDogJy17e3ZhbH19JztcbiAgICAgICAgICAgICAgICAgICAgbGV0IF92YWx1ZSA9IChtYXggKiBpKSAtIF9kaWZmO1xuICAgICAgICAgICAgICAgICAgICBlbGVtc1tpXS5zdHlsZS5jc3NUZXh0ID0gdG91Y2hpbmdUcGwucmVwbGFjZSh0ZW1wbGF0ZSwgX3ZhbHVlKS5yZXBsYWNlKHRlbXBsYXRlLCBfdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRpZmYgPSBfZGlmZjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW5kSGFuZGxlcihlKSB7XG4gICAgICAgIGUgJiYgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZSAmJiBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlICYmIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBsZXQgbWF4ID0gYXZhaWxhYmxlV2lkdGg7XG5cbiAgICAgICAgdG91Y2hpbmcgPSBmYWxzZTtcbiAgICAgICAgeCA9IG51bGw7XG5cbiAgICAgICAgbGV0IGRlbHRhID0gLjA1XG4gICAgICAgIGxldCBzd2lwZV90aHJlc2hvbGQgPSAwLjg1O1xuICAgICAgICBsZXQgZF9tYXggPSAoZGlmZiAvIG1heCk7XG4gICAgICAgIGxldCBkZWx0YURNYXggPSBkX21heCAtIE1hdGguZmxvb3IoZF9tYXgpIC8vIGN1c3RvbSBkZWx0YVxuICAgICAgICBsZXQgX3RhcmdldCA9IGRlbHRhRE1heCA+IGRlbHRhICYmIGRlbHRhRE1heCA8IC41ID8gTWF0aC5jZWlsKGRfbWF4KSA6IE1hdGguZmxvb3IoZF9tYXgpOyAvLyBNYXRoLnJvdW5kKGRfbWF4KTtcblxuICAgICAgICBpZihNYXRoLmFicyhfdGFyZ2V0IC0gZF9tYXgpIDwgc3dpcGVfdGhyZXNob2xkICl7XG4gICAgICAgICAgICBkaWZmID0gX3RhcmdldCAqIG1heDtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBkaWZmID0gKGRpciA/IChfdGFyZ2V0IC0gMSkgOiAoX3RhcmdldCArIDEpKSAqIG1heDtcbiAgICAgICAgfVxuXG4gICAgICAgIHBvc1ggPSBkaWZmO1xuICAgICAgICBhY3RpdmVJbmRpY2F0b3IgPSAoZGlmZiAvIG1heCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXM7IGkrKykge1xuICAgICAgICAgICAgbGV0IHRlbXBsYXRlID0gaSA8IDAgPyAne3t2YWx9fScgOiAnLXt7dmFsfX0nO1xuICAgICAgICAgICAgbGV0IF92YWx1ZSA9IChtYXggKiBpKSAtIHBvc1g7XG4gICAgICAgICAgICBlbGVtc1tpXS5zdHlsZS5jc3NUZXh0ID0gbm9uX3RvdWNoaW5nVHBsLnJlcGxhY2UodGVtcGxhdGUsIF92YWx1ZSkucmVwbGFjZSh0ZW1wbGF0ZSwgX3ZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3ZlSGFuZGxlcik7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZW5kSGFuZGxlcik7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBtb3ZlSGFuZGxlcik7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGVuZEhhbmRsZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vdmVTdGFydChlKXtcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGxldCBtYXggPSBhdmFpbGFibGVXaWR0aDtcblxuICAgICAgICB0b3VjaGluZyA9IHRydWU7XG4gICAgICAgIHggPSBlLnRvdWNoZXMgPyBlLnRvdWNoZXNbMF0ucGFnZVggOiBlLnBhZ2VYO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW92ZUhhbmRsZXIpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGVuZEhhbmRsZXIpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgbW92ZUhhbmRsZXIpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBlbmRIYW5kbGVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGFuZ2VJdGVtKGl0ZW0pIHtcbiAgICAgICAgbGV0IG1heCA9IGF2YWlsYWJsZVdpZHRoO1xuICAgICAgICBkaWZmID0gbWF4ICogaXRlbTtcbiAgICAgICAgYWN0aXZlSW5kaWNhdG9yID0gaXRlbTtcbiAgICAgICAgZW5kSGFuZGxlcigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoYW5nZVZpZXcoKSB7XG4gICAgICAgIGNoYW5nZUl0ZW0ocGxheWVkKTtcbiAgICAgICAgcGxheWVkID0gcGxheWVkIDwgKGl0ZW1zIC0gMSkgPyArK3BsYXllZCA6IDA7XG4gICAgfVxuXG48L3NjcmlwdD5cblxuPHN0eWxlPlxuXG4gICAgLnN3aXBlLXBhbmVsIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBoZWlnaHQ6IHZhcigtLXN2LXN3aXBlLXBhbmVsLWhlaWdodCwgMTAwJSk7XG4gICAgICAgIHdpZHRoOiB2YXIoLS1zdi1zd2lwZS1wYW5lbC13aWR0aCwgaW5oZXJpdCk7XG4gICAgfVxuICAgIC5zd2lwZS1pdGVtLXdyYXBwZXJ7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgaGVpZ2h0OiBpbmhlcml0O1xuICAgICAgICB6LWluZGV4OiB2YXIoLS1zdi1zd2lwZS1wYW5lbC13cmFwcGVyLWluZGV4LCAyKTtcbiAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgfVxuXG4gICAgLnN3aXBlYWJsZS1pdGVtcyxcbiAgICAuc3dpcGVhYmxlLXNsb3Qtd3JhcHBlciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuXG4gICAgLnN3aXBlLWhhbmRsZXIge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICB0b3A6IDQwcHg7XG4gICAgICAgIGJvdHRvbTogMHB4O1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICByaWdodDogMDtcbiAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLDAsMCwwKTtcbiAgICB9XG4gICAgLnN3aXBlLWluZGljYXRvciB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgYm90dG9tOiAxLjVyZW07XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB6LWluZGV4OiB2YXIoLS1zdi1zd2lwZS1wYW5lbC13cmFwcGVyLWluZGV4LCAyKTtcbiAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgfVxuXG4gICAgLmRvdCB7XG4gICAgICAgIGhlaWdodDogMTBweDtcbiAgICAgICAgd2lkdGg6IDEwcHg7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICAgICAgICBib3JkZXI6IDFweCBzb2xpZCBncmV5O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgICAgbWFyZ2luOiAwcHggMnB4O1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBmaWxsO1xuICAgIH1cbiAgICAuc3dpcGUtaW5kaWNhdG9yIC5pcy1hY3RpdmUge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1zdi1zd2lwZS1pbmRpY2F0b3ItYWN0aXZlLWNvbG9yLCBncmV5KTtcbiAgICB9XG5cbjwvc3R5bGU+XG5cbjxkaXYgY2xhc3M9XCJzd2lwZS1wYW5lbFwiPlxuICAgIDxkaXYgY2xhc3M9XCJzd2lwZS1pdGVtLXdyYXBwZXJcIiBiaW5kOnRoaXM9e3N3aXBlV3JhcHBlcn0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzd2lwZWFibGUtaXRlbXNcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzd2lwZWFibGUtc2xvdC13cmFwcGVyXCI+XG4gICAgICAgICAgICAgICAgPHNsb3QgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwic3dpcGUtaGFuZGxlclwiIGJpbmQ6dGhpcz17c3dpcGVIYW5kbGVyfSBvbjp0b3VjaHN0YXJ0PXttb3ZlU3RhcnR9IG9uOm1vdXNlZG93bj17bW92ZVN0YXJ0fT48L2Rpdj5cbiAgICB7I2lmIHNob3dJbmRpY2F0b3JzfVxuICAgICAgICA8ZGl2IGNsYXNzPVwic3dpcGUtaW5kaWNhdG9yIHN3aXBlLWluZGljYXRvci1pbnNpZGVcIj5cbiAgICAgICAgICAgIHsjZWFjaCBpbmRpY2F0b3JzIGFzIHgsIGkgfVxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZG90IHthY3RpdmVJbmRpY2F0b3IgPT0gaSA/ICdpcy1hY3RpdmUnIDogJyd9XCIgb246Y2xpY2s9eygpID0+IHtjaGFuZ2VJdGVtKGkpfX0+PC9zcGFuPlxuICAgICAgICAgICAgey9lYWNofVxuICAgICAgICA8L2Rpdj5cbiAgICB7L2lmfVxuXG48L2Rpdj5cbiIsIjxzY3JpcHQ+XG4gICAgZXhwb3J0IGxldCBjbGFzc2VzID0gJyc7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICAgIC5zd2lwZWFibGUtaXRlbSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBib3R0b206IDA7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIHJpZ2h0OiAwO1xuICAgICAgICB0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbjogZWFzZS1vdXQ7XG4gICAgfVxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cInN3aXBlYWJsZS1pdGVtIHtjbGFzc2VzfVwiPlxuICAgIDxzbG90IC8+XG48L2Rpdj5cbiIsImV4cG9ydCB7IGRlZmF1bHQgYXMgY2xhc3NuYW1lcyB9IGZyb20gJ2NsYXNzbmFtZXMnXG5cbmV4cG9ydCBjb25zdCB0b0NTU1N0cmluZyA9IChzdHlsZXMgPSB7fSkgPT4gT2JqZWN0LmVudHJpZXMoc3R5bGVzKVxuICAuZmlsdGVyKChbX3Byb3BOYW1lLCBwcm9wVmFsdWVdKSA9PiBwcm9wVmFsdWUgIT09IHVuZGVmaW5lZCAmJiBwcm9wVmFsdWUgIT09IG51bGwpXG4gIC5yZWR1Y2UoKHN0eWxlU3RyaW5nLCBbcHJvcE5hbWUsIHByb3BWYWx1ZV0pID0+IHtcbiAgICBwcm9wTmFtZSA9IHByb3BOYW1lLnJlcGxhY2UoL1tBLVpdL2csIG1hdGNoID0+IGAtJHttYXRjaC50b0xvd2VyQ2FzZSgpfWApXG4gICAgcmV0dXJuIGAke3N0eWxlU3RyaW5nfSR7cHJvcE5hbWV9OiR7cHJvcFZhbHVlfTtgXG4gIH0sICcnKVxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBjbGFzc25hbWVzLCB0b0NTU1N0cmluZyB9IGZyb20gJy4uL3V0aWxzJ1xuXG4gICAgZXhwb3J0IGxldCB0eXBlXG4gICAgZXhwb3J0IGxldCBpcyAvLyBwcmltYXJ5fHdhcm5pbmd8ZGFuZ2VyfGxpZ2h0fGRhcmtcbiAgICBleHBvcnQgbGV0IHNpemUgPSAnbWVkaXVtJyAvLyBzbWFsbHxtZWRpdW18YmlnXG4gICAgZXhwb3J0IGxldCByb3RhdGUgPSAwXG4gICAgZXhwb3J0IGxldCBzdHlsZSA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaWQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBhcmlhTGFiZWwgPSB1bmRlZmluZWRcblxuICAgIGxldCB0aXRsZVByb3AgPSB0aXRsZSB8fCBhcmlhTGFiZWxcbiAgICBsZXQgYXJpYUxhYmVsUHJvcCA9IGFyaWFMYWJlbCB8fCB0aXRsZVxuICAgIGxldCBzdHlsZVByb3AgPSB0b0NTU1N0cmluZyh7IHRyYW5zZm9ybTogISFyb3RhdGUgPyBgcm90YXRlWigke3JvdGF0ZX1kZWcpYCA6IG51bGwsIC4uLnN0eWxlIH0pXG5cbiAgICAkOiAgY2xhc3NQcm9wID0gY2xhc3NuYW1lcygnaWNvJywgaXMsIHNpemUsICQkcHJvcHMuY2xhc3MpXG48L3NjcmlwdD5cblxuPHN2Z1xuICAgICAgICB7aWR9XG4gICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgIHN0eWxlPXtzdHlsZVByb3B9XG4gICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4+XG4gICAgPHVzZSB4bGluazpocmVmPXtgI2ljby0ke3R5cGV9YH0gY2xhc3M9XCJpY28tdXNlXCIvPlxuPC9zdmc+XG5cbjxzdHlsZT5cbiAgICBzdmcge1xuICAgICAgICBkaXNwbGF5OiBpbmhlcml0O1xuICAgIH1cblxuICAgIHN2Zywgc3ZnICoge1xuICAgICAgICBmaWxsOiByZ2JhKHZhcigtLXRoZW1lLXN2Zy1maWxsKSk7XG4gICAgICAgIHN0cm9rZTogcmdiYSh2YXIoLS10aGVtZS1zdmctZmlsbCkpO1xuICAgIH1cblxuICAgIC8qIC0tLS0tLS0tLS0tLT09PT09PT09PSggU2l6ZSApPT09PT09PT09LS0tLS0tLS0tLS0tICovXG4gICAgLnNtYWxsIHtcbiAgICAgICAgd2lkdGg6IDE1cHg7XG4gICAgICAgIGhlaWdodDogMTVweDtcbiAgICB9XG5cbiAgICAubWVkaXVtIHtcbiAgICAgICAgd2lkdGg6IDIycHg7XG4gICAgICAgIGhlaWdodDogMjJweDtcbiAgICB9XG5cbiAgICAuYmlnIHtcbiAgICAgICAgd2lkdGg6IDM1cHg7XG4gICAgICAgIGhlaWdodDogMzVweDtcbiAgICB9XG5cbiAgICAvKiAtLS0tLS0tLS0tLS09PT09PT09PT0oIENvbG9yICk9PT09PT09PT0tLS0tLS0tLS0tLS0gKi9cbiAgICAucHJpbWFyeSwgLnByaW1hcnkgKiB7XG4gICAgICAgIGZpbGw6IHJnYih2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgICAgIHN0cm9rZTogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG5cbiAgICAud2FybmluZywgLndhcm5pbmcgKiB7XG4gICAgICAgIGZpbGw6IHJnYih2YXIoLS1jb2xvci13YXJuaW5nKSk7XG4gICAgICAgIHN0cm9rZTogcmdiKHZhcigtLWNvbG9yLXdhcm5pbmcpKTtcbiAgICB9XG5cbiAgICAuZGFuZ2VyLCAuZGFuZ2VyICoge1xuICAgICAgICBmaWxsOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIHN0cm9rZTogcmdiKHZhcigtLWNvbG9yLWRhbmdlcikpO1xuICAgIH1cblxuICAgIC5pbmZvLCAuaW5mbyAqIHtcbiAgICAgICAgZmlsbDogcmdiKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgIH1cblxuICAgIC5saWdodCwgLmxpZ2h0ICoge1xuICAgICAgICBmaWxsOiB2YXIoLS1jb2xvci1saWdodC0xKTtcbiAgICAgICAgc3Ryb2tlOiB2YXIoLS1jb2xvci1saWdodC0xKTtcbiAgICB9XG5cbiAgICAuZGFyaywgLmRhcmsgKiB7XG4gICAgICAgIGZpbGw6IHZhcigtLWNvbG9yLWRhcmstMSk7XG4gICAgICAgIHN0cm9rZTogdmFyKC0tY29sb3ItZGFyay0xKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnXG4gICAgaW1wb3J0IHsgY2xhc3NuYW1lcyB9IGZyb20gJy4uL3V0aWxzJ1xuXG4gICAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gICAgZXhwb3J0IGxldCBuYW1lXG4gICAgZXhwb3J0IGxldCBpZCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGFyaWFMYWJlbCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgYXV0b2NvbXBsZXRlID0gdHJ1ZVxuXG4gICAgbGV0IHRpdGxlUHJvcCA9IHRpdGxlIHx8IGFyaWFMYWJlbFxuICAgIGxldCBhcmlhTGFiZWxQcm9wID0gYXJpYUxhYmVsIHx8IHRpdGxlXG4gICAgbGV0IGF1dG9jb21wbGV0ZVByb3AgPSBhdXRvY29tcGxldGUgPyAnb24nIDogJ29mZidcblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2Zvcm0nLCAkJHByb3BzLmNsYXNzKVxuPC9zY3JpcHQ+XG5cbjxmb3JtXG4gICAgICAgIHtpZH1cbiAgICAgICAge25hbWV9XG4gICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4gICAgICAgIGF1dG9jb21wbGV0ZT17YXV0b2NvbXBsZXRlUHJvcH1cbiAgICAgICAgb246c3VibWl0fHByZXZlbnREZWZhdWx0PXtlID0+IGRpc3BhdGNoKCdzdWJtaXQnLCBlKX1cbj5cbiAgICA8c2xvdD48L3Nsb3Q+XG48L2Zvcm0+XG5cbjxzdHlsZT5cblxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IEljb24gZnJvbSAnLi9JY29uLnN2ZWx0ZSdcblxuICAgIGV4cG9ydCBsZXQgaXMgPSAnZGFuZ2VyJ1xuICAgIGV4cG9ydCBsZXQgc2l6ZSA9ICdtZWRpdW0nIC8vIHNtYWxsfG1lZGl1bXxtaWdcbjwvc2NyaXB0PlxuXG48dWwgY2xhc3M9XCJyYXRlXCI+XG4gICAgPGxpPlxuICAgICAgICA8SWNvbiB7aXN9IHtzaXplfSB0eXBlPVwiaGVhcnQtZmlsbGVkXCIvPlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgICA8SWNvbiB7aXN9IHtzaXplfSB0eXBlPVwiaGVhcnQtZmlsbGVkXCIvPlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgICA8SWNvbiB7aXN9IHtzaXplfSB0eXBlPVwiaGVhcnQtZmlsbGVkXCIvPlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgICA8SWNvbiB7aXN9IHtzaXplfSB0eXBlPVwiaGVhcnQtZmlsbGVkXCIvPlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgICA8SWNvbiB7aXN9IHtzaXplfSB0eXBlPVwiaGVhcnQtZmlsbGVkXCIvPlxuICAgIDwvbGk+XG48L3VsPlxuXG48c3R5bGU+XG4gICAgLnJhdGUge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBtYXJnaW46IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogLTEgLyAzKTtcbiAgICB9XG5cbiAgICBsaSB7XG4gICAgICAgIHBhZGRpbmc6IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpIC8gMyk7XG4gICAgfVxuXG4gICAgLnJhdGUgbGkge1xuICAgICAgICAtd2Via2l0LWZpbHRlcjogZHJvcC1zaGFkb3codmFyKC0tc2hhZG93LXByaW1hcnkpKTtcbiAgICAgICAgZmlsdGVyOiBkcm9wLXNoYWRvdyh2YXIoLS1zaGFkb3ctcHJpbWFyeSkpO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbiAgICBpbXBvcnQgeyBjbGFzc25hbWVzLCB0b0NTU1N0cmluZyB9IGZyb20gJy4uL3V0aWxzJ1xuXG4gICAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gICAgZXhwb3J0IGxldCBuYW1lXG4gICAgZXhwb3J0IGxldCB2YWx1ZSA9ICcnXG4gICAgZXhwb3J0IGxldCBzdHlsZSA9IHt9XG4gICAgZXhwb3J0IGxldCB0eXBlID0gJ3RleHQnXG4gICAgZXhwb3J0IGxldCBpZCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgYWxpZ24gPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IG1heGxlbmd0aCA9IDEwMDBcbiAgICBleHBvcnQgbGV0IHJvd3MgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGRpc2FibGVkID0gZmFsc2VcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBpbnZhbGlkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBtaW4gPSB1bmRlZmluZWQgLy8gU3BlY2lmaWVzIGEgbWluaW11bSB2YWx1ZSBmb3IgYW4gPGlucHV0PiBlbGVtZW50XG4gICAgZXhwb3J0IGxldCBtYXggPSB1bmRlZmluZWQgLy8gU3BlY2lmaWVzIHRoZSBtYXhpbXVtIHZhbHVlIGZvciBhbiA8aW5wdXQ+IGVsZW1lbnRcbiAgICBleHBvcnQgbGV0IGxpc3QgPSB1bmRlZmluZWQgLy8gUmVmZXJzIHRvIGEgPGRhdGFsaXN0PiBlbGVtZW50IHRoYXQgY29udGFpbnMgcHJlLWRlZmluZWQgb3B0aW9ucyBmb3IgYW4gPGlucHV0PiBlbGVtZW50XG4gICAgZXhwb3J0IGxldCBmb3JtID0gdW5kZWZpbmVkIC8vIFNwZWNpZmllcyB0aGUgZm9ybSB0aGUgPGlucHV0PiBlbGVtZW50IGJlbG9uZ3MgdG9cbiAgICBleHBvcnQgbGV0IHJlYWRvbmx5ID0gdW5kZWZpbmVkIC8vIHVuZGVmaW5lZHxyZWFkb25seVxuICAgIGV4cG9ydCBsZXQgcmVxdWlyZWQgPSB1bmRlZmluZWQgLy8gdW5kZWZpbmVkfHJlcXVpcmVkXG4gICAgZXhwb3J0IGxldCBwYXR0ZXJuID0gdW5kZWZpbmVkIC8vIFNwZWNpZmllcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IGFuIDxpbnB1dD4gZWxlbWVudCdzIHZhbHVlIGlzIGNoZWNrZWQgYWdhaW5zdCAocmVnZXhwKVxuICAgIGV4cG9ydCBsZXQgYXV0b2NvbXBsZXRlID0gdHJ1ZSAvLyBvbnxvZmZcbiAgICBleHBvcnQgbGV0IGF1dG9zZWxlY3QgPSBmYWxzZVxuICAgIGV4cG9ydCBsZXQgYXJpYUxhYmVsID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBwbGFjZWhvbGRlciA9IHVuZGVmaW5lZFxuXG4gICAgbGV0IGlkUHJvcCA9IGlkIHx8IG5hbWVcbiAgICBsZXQgdHlwZVByb3AgPSB0eXBlID09PSAnbnVtYmVyJyA/ICd0ZXh0JyA6IHR5cGVcbiAgICBsZXQgdGl0bGVQcm9wID0gdGl0bGUgfHwgYXJpYUxhYmVsIHx8IHBsYWNlaG9sZGVyXG4gICAgbGV0IGFyaWFMYWJlbFByb3AgPSBhcmlhTGFiZWwgfHwgdGl0bGUgfHwgcGxhY2Vob2xkZXJcbiAgICBsZXQgYXV0b2NvbXBsZXRlUHJvcCA9IGF1dG9jb21wbGV0ZSA/ICdvbicgOiAnb2ZmJ1xuICAgIGxldCBzdHlsZVByb3AgPSB0b0NTU1N0cmluZyh7IC4uLnN0eWxlLCB0ZXh0QWxpZ246IGFsaWduIH0pXG4gICAgbGV0IHBhdHRlcm5Qcm9wID0gdHlwZSA9PT0gJ251bWJlcicgJiYgIXBhdHRlcm4gPyAnWzAtOV0qJyA6IHBhdHRlcm5cblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2lucCcsICQkcHJvcHMuY2xhc3MsIHsgZGlzYWJsZWQsIHJlYWRvbmx5LCByZXF1aXJlZCwgaW52YWxpZCB9KVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb24gRW1pdCBjbGljayBhbmQgc2VsZWN0IGNvbnRlbnQgd2hlbiBcImF1dG9zZWxlY3RcIiBpcyBlbmFibGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gTmF0aXZlIG1vdXNlIGV2ZW50LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG9uQ2xpY2soZSkge1xuICAgICAgICAhZGlzYWJsZWQgJiYgZGlzcGF0Y2goXCJjbGlja1wiLCBlKVxuICAgICAgICAhZGlzYWJsZWQgJiYgYXV0b3NlbGVjdCAmJiBlLnRhcmdldC5zZWxlY3QoKVxuICAgIH1cbjwvc2NyaXB0PlxuXG57I2lmIHJvd3N9XG4gICAgPHRleHRhcmVhXG4gICAgICAgICAgICB7bWlufVxuICAgICAgICAgICAge21heH1cbiAgICAgICAgICAgIHtyb3dzfVxuICAgICAgICAgICAge25hbWV9XG4gICAgICAgICAgICB7Zm9ybX1cbiAgICAgICAgICAgIHthbGlnbn1cbiAgICAgICAgICAgIHtyZWFkb25seX1cbiAgICAgICAgICAgIHtkaXNhYmxlZH1cbiAgICAgICAgICAgIHtyZXF1aXJlZH1cbiAgICAgICAgICAgIHttYXhsZW5ndGh9XG4gICAgICAgICAgICB7cGxhY2Vob2xkZXJ9XG4gICAgICAgICAgICBpZD17aWRQcm9wfVxuICAgICAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgICAgICBzdHlsZT17c3R5bGVQcm9wfVxuICAgICAgICAgICAgcGF0dGVybj17cGF0dGVyblByb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgYXV0b2NvbXBsZXRlPXthdXRvY29tcGxldGVQcm9wfVxuICAgICAgICAgICAgey4uLnsgdHlwZTogdHlwZVByb3AgfX1cbiAgICAgICAgICAgIGJpbmQ6dmFsdWVcbiAgICAgICAgICAgIG9uOmJsdXI9J3tlID0+ICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImJsdXJcIiwgZSl9J1xuICAgICAgICAgICAgb246Zm9jdXM9J3tlID0+ICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImZvY3VzXCIsIGUpfSdcbiAgICAgICAgICAgIG9uOmNsaWNrPSd7b25DbGlja30nXG4gICAgPjwvdGV4dGFyZWE+XG57OmVsc2V9XG4gICAgPGlucHV0XG4gICAgICAgICAgICB7bWlufVxuICAgICAgICAgICAge21heH1cbiAgICAgICAgICAgIHtuYW1lfVxuICAgICAgICAgICAge2xpc3R9XG4gICAgICAgICAgICB7Zm9ybX1cbiAgICAgICAgICAgIHthbGlnbn1cbiAgICAgICAgICAgIHtyZWFkb25seX1cbiAgICAgICAgICAgIHtkaXNhYmxlZH1cbiAgICAgICAgICAgIHtyZXF1aXJlZH1cbiAgICAgICAgICAgIHttYXhsZW5ndGh9XG4gICAgICAgICAgICB7cGxhY2Vob2xkZXJ9XG4gICAgICAgICAgICBpZD17aWRQcm9wfVxuICAgICAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgICAgICBzdHlsZT17c3R5bGVQcm9wfVxuICAgICAgICAgICAgcGF0dGVybj17cGF0dGVyblByb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgYXV0b2NvbXBsZXRlPXthdXRvY29tcGxldGVQcm9wfVxuICAgICAgICAgICAgey4uLnsgdHlwZTogdHlwZVByb3AgfX1cbiAgICAgICAgICAgIGJpbmQ6dmFsdWVcbiAgICAgICAgICAgIG9uOmJsdXI9J3tlID0+ICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImJsdXJcIiwgZSl9J1xuICAgICAgICAgICAgb246Zm9jdXM9J3tlID0+ICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImZvY3VzXCIsIGUpfSdcbiAgICAgICAgICAgIG9uOmNsaWNrPSd7b25DbGlja30nXG4gICAgLz5cbnsvaWZ9XG5cbjxzdHlsZT5cbiAgICAuaW5wIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGZsZXg6IDEgMSAwO1xuICAgICAgICBjb2xvcjogaW5oZXJpdDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG4gICAgICAgIG1pbi13aWR0aDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgICAgICBtaW4taGVpZ2h0OiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuMik7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICAgICAgYm94LXNoYWRvdzogaW5zZXQgdmFyKC0tc2hhZG93LXByaW1hcnkpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5LWluc2V0KTtcbiAgICB9XG5cbiAgICAuaW5wOmZvY3VzIHtcbiAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2IodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgIH1cblxuICAgIC5pbnA6aW52YWxpZCwgLmlucC5pbnZhbGlkIHtcbiAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcblxuICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAgIGV4cG9ydCBsZXQgc3JjXG4gICAgZXhwb3J0IGxldCBhbHRcbiAgICBleHBvcnQgbGV0IGlkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCB3aWR0aCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaGVpZ2h0ID0gdW5kZWZpbmVkXG5cbiAgICBsZXQgbG9hZGluZyA9IHRydWVcbiAgICBsZXQgaXNFcnJvciA9IGZhbHNlXG5cbiAgICAkOiB3cmFwQ2xhc3NQcm9wID0gY2xhc3NuYW1lcygncGljdHVyZScsICQkcHJvcHMuY2xhc3MsIHsgbG9hZGluZywgaXNFcnJvciB9KVxuXG4gICAgZnVuY3Rpb24gb25Mb2FkKGUpIHtcbiAgICAgICAgbG9hZGluZyA9IGZhbHNlXG4gICAgICAgIGRpc3BhdGNoKCdsb2FkJywgZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbkVycm9yKGUpIHtcbiAgICAgICAgbG9hZGluZyA9IGZhbHNlXG4gICAgICAgIGlzRXJyb3IgPSB0cnVlXG4gICAgICAgIGRpc3BhdGNoKCdlcnJvcicsIGUpXG4gICAgfVxuPC9zY3JpcHQ+XG5cbjxmaWd1cmUgY2xhc3M9e3dyYXBDbGFzc1Byb3B9PlxuICAgIDxpbWdcbiAgICAgICAgICAgIHtpZH1cbiAgICAgICAgICAgIHthbHR9XG4gICAgICAgICAgICB7c3JjfVxuICAgICAgICAgICAge3dpZHRofVxuICAgICAgICAgICAge2hlaWdodH1cbiAgICAgICAgICAgIGNsYXNzPVwicGljXCJcbiAgICAgICAgICAgIG9uOmxvYWQ9e29uTG9hZH1cbiAgICAgICAgICAgIG9uOmVycm9yPXtvbkVycm9yfVxuICAgIC8+XG5cbiAgICA8ZmlnY2FwdGlvbj5cbiAgICAgICAgPHNsb3Q+PC9zbG90PlxuICAgIDwvZmlnY2FwdGlvbj5cbjwvZmlndXJlPlxuXG48c3R5bGU+XG4gICAgLnBpY3R1cmUge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgIH1cblxuICAgIC5waWN0dXJlIC5waWMge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIG9iamVjdC1maXQ6IGNvdmVyO1xuICAgICAgICBvYmplY3QtcG9zaXRpb246IGNlbnRlcjtcbiAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAuM3MgZWFzZS1pbjtcbiAgICB9XG5cbiAgICAucGljdHVyZS5sb2FkaW5nIC5waWMge1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcbiAgICBpbXBvcnQgUGljdHVyZSBmcm9tICcuL1BpY3R1cmUuc3ZlbHRlJ1xuXG4gICAgZXhwb3J0IGxldCBzcmNcbiAgICBleHBvcnQgbGV0IGFsdFxuICAgIGV4cG9ydCBsZXQgc2l6ZSA9ICdtZWRpdW0nIC8vIHNtYWxsfG1lZGl1bXxiaWdcblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2F2YScsIHNpemUsICQkcHJvcHMuY2xhc3MpXG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz17Y2xhc3NQcm9wfT5cbiAgICA8UGljdHVyZSB7c3JjfSB7YWx0fS8+XG48L2Rpdj5cblxuPHN0eWxlPlxuICAgIC5hdmEge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgfVxuXG4gICAgLnNtYWxsIHtcbiAgICAgICAgd2lkdGg6IDI1cHg7XG4gICAgICAgIGhlaWdodDogMjVweDtcbiAgICB9XG4gICAgLm1lZGl1bSB7XG4gICAgICAgIHdpZHRoOiAzNXB4O1xuICAgICAgICBoZWlnaHQ6IDM1cHg7XG4gICAgfVxuICAgIC5iaWcge1xuICAgICAgICB3aWR0aDogNDVweDtcbiAgICAgICAgaGVpZ2h0OiA0NXB4O1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbiAgICBpbXBvcnQgeyBjbGFzc25hbWVzIH0gZnJvbSAnLi4vdXRpbHMnXG5cbiAgICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgICBleHBvcnQgbGV0IGlzID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBpZCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaHJlZiA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgYXV0byA9IGZhbHNlXG4gICAgZXhwb3J0IGxldCB0eXBlID0gJ2J1dHRvbidcbiAgICBleHBvcnQgbGV0IHNpemUgPSAnbWVkaXVtJ1xuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGh0bWxGb3IgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGRpc2FibGVkID0gZmFsc2VcbiAgICBleHBvcnQgbGV0IGFyaWFMYWJlbCA9IHVuZGVmaW5lZFxuXG4gICAgbGV0IHRpdGxlUHJvcCA9IHRpdGxlIHx8IGFyaWFMYWJlbFxuICAgIGxldCBhcmlhTGFiZWxQcm9wID0gYXJpYUxhYmVsIHx8IHRpdGxlXG5cbiAgICAkOiBjbGFzc1Byb3AgPSBjbGFzc25hbWVzKCdidG4nLCBpcywgc2l6ZSwgJCRwcm9wcy5jbGFzcywgeyBhdXRvLCBkaXNhYmxlZCB9KVxuXG4gICAgZnVuY3Rpb24gb25MYWJlbENsaWNrKGUpIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHRtbEZvcikuY2xpY2soKVxuICAgICAgICAvLyB0cnkgeyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sRm9yKS5jbGljaygpIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImNsaWNrXCIsIGUpXG4gICAgfVxuPC9zY3JpcHQ+XG5cbnsjaWYgaHJlZn1cbiAgICA8YVxuICAgICAgICAgICAge2lkfVxuICAgICAgICAgICAge2hyZWZ9XG4gICAgICAgICAgICB0aXRsZT17dGl0bGVQcm9wfVxuICAgICAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4gICAgICAgICAgICBvbjpjbGljaz0ne2UgPT4gIWRpc2FibGVkICYmIGRpc3BhdGNoKFwiY2xpY2tcIiwgZSl9J1xuICAgID5cbiAgICAgICAgPHNsb3Q+PC9zbG90PlxuICAgIDwvYT5cbns6ZWxzZSBpZiBodG1sRm9yfVxuICAgIDxsYWJlbFxuICAgICAgICAgICAge2lkfVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAgZm9yPXtodG1sRm9yfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgb246Y2xpY2s9e29uTGFiZWxDbGlja31cbiAgICA+XG4gICAgICAgIDxzbG90Pjwvc2xvdD5cbiAgICA8L2xhYmVsPlxuezplbHNlfVxuICAgIDxidXR0b25cbiAgICAgICAgICAgIHtpZH1cbiAgICAgICAgICAgIHt0eXBlfVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgb246Y2xpY2s9J3tlID0+ICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImNsaWNrXCIsIGUpfSdcbiAgICA+XG4gICAgICAgIDxzbG90Pjwvc2xvdD5cbiAgICA8L2J1dHRvbj5cbnsvaWZ9XG5cbjxzdHlsZT5cbiAgICAuYnRuOm5vdCguYXV0bykge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgICAgIHVzZXItc2VsZWN0OiBub25lO1xuICAgICAgICBwYWRkaW5nOiA1cHggMTVweDtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogM3B4O1xuICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS10aGVtZS1mb250LWNvbG9yKSk7XG4gICAgICAgIHRleHQtc2hhZG93OiAxcHggMXB4IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuMyk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuLnNtYWxsKSB7XG4gICAgICAgIHBhZGRpbmc6IDVweDtcbiAgICAgICAgbWluLXdpZHRoOiBjYWxjKHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKSAvIDEuNSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IGNhbGModmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpIC8gMS41KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4ubWVkaXVtKSB7XG4gICAgICAgIHBhZGRpbmc6IDVweCAxMHB4O1xuICAgICAgICBtaW4td2lkdGg6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICAgICAgbWluLWhlaWdodDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bi5iaWcpIHtcbiAgICAgICAgcGFkZGluZzogNXB4IDE1cHg7XG4gICAgICAgIG1pbi13aWR0aDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgKiAxLjUpO1xuICAgICAgICBtaW4taGVpZ2h0OiBjYWxjKHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKSAqIDEuNSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuOmZvY3VzKSB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjEpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bjpob3Zlcikge1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4yKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuOmFjdGl2ZSkge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMXB4KTtcbiAgICAgICAgYm94LXNoYWRvdzogMCAxcHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMik7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjEpO1xuICAgIH1cblxuICAgIC8qIFN1Y2Nlc3MgKi9cblxuICAgIC5idG4uc3VjY2VzcyB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3Itc3VjY2Vzcy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgIH1cblxuICAgIC5idG4uc3VjY2Vzczpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itc3VjY2VzcyksIC44NSk7XG4gICAgfVxuXG4gICAgLmJ0bi5zdWNjZXNzOmhvdmVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDFweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3Itc3VjY2Vzcy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgIH1cblxuICAgIC5idG4uc3VjY2VzczphY3RpdmUge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMnB4KTtcbiAgICAgICAgYm94LXNoYWRvdzogMCAxcHggcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgfVxuXG4gICAgLyogV2FybmluZyAqL1xuXG4gICAgLmJ0bi53YXJuaW5nIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZm9udC1saWdodCkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXdhcm5pbmcpKTtcbiAgICAgICAgYm94LXNoYWRvdzogMCAycHggcmdiYSh2YXIoLS1jb2xvci13YXJuaW5nLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi53YXJuaW5nOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci13YXJuaW5nKSwgLjg1KTtcbiAgICB9XG5cbiAgICAuYnRuLndhcm5pbmc6aG92ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMXB4KTtcbiAgICAgICAgYm94LXNoYWRvdzogMCAycHggcmdiYSh2YXIoLS1jb2xvci13YXJuaW5nLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi53YXJuaW5nOmFjdGl2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgycHgpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDFweCByZ2JhKHZhcigtLWNvbG9yLXdhcm5pbmctZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBEYW5nZXIgKi9cblxuICAgIC5idG4uZGFuZ2VyIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZm9udC1saWdodCkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhbmdlcikpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLWRhbmdlci1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgIH1cblxuICAgIC5idG4uZGFuZ2VyOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpLCAuODUpO1xuICAgIH1cblxuICAgIC5idG4uZGFuZ2VyOmhvdmVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDFweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi5kYW5nZXI6YWN0aXZlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDJweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMXB4IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgfVxuXG5cbiAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkge1xuICAgICAgICA6Z2xvYmFsKC5idG4pIHtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDJweDtcbiAgICAgICAgfVxuICAgICAgICAuYnRuLnN1Y2Nlc3Mge1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAzcHggcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLndhcm5pbmcge1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAzcHggcmdiYSh2YXIoLS1jb2xvci13YXJuaW5nLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLmRhbmdlciB7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDNweCByZ2JhKHZhcigtLWNvbG9yLWRhbmdlci1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgICAgICB9XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgdG9DU1NTdHJpbmcsIGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcblxuICAgIGV4cG9ydCBsZXQgaXMgPSAnaW5mbydcbiAgICBleHBvcnQgbGV0IHNpemUgPSAwXG4gICAgZXhwb3J0IGxldCB3aWR0aCA9IDJcblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2RpdmlkZXInLCBpcywgJCRwcm9wcy5jbGFzcylcbiAgICAkOiBzdHlsZVByb3AgPSB0b0NTU1N0cmluZyh7IHBhZGRpbmc6IGAke3NpemUgLyAyfXB4IDBgLCBoZWlnaHQ6IGAke3dpZHRofXB4YCB9KVxuPC9zY3JpcHQ+XG5cbjxociBjbGFzcz17Y2xhc3NQcm9wfSBzdHlsZT17c3R5bGVQcm9wfT5cblxuPHN0eWxlPlxuICAgIC5kaXZpZGVyIHtcbiAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgfVxuXG4gICAgLmluZm8ge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgIH1cblxuICAgIC5zdWNjZXNzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG5cbiAgICAud2FybmluZyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci13YXJuaW5nKSk7XG4gICAgfVxuXG4gICAgLmRhbmdlciB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIsIG9uTW91bnQgfSBmcm9tICdzdmVsdGUnXG4gICAgaW1wb3J0IHsgY2xhc3NuYW1lcyB9IGZyb20gJy4uL3V0aWxzJ1xuXG4gICAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gICAgZXhwb3J0IGxldCBpZCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgdmFsdWUgPSAwIC8vIDAgLSAxMDBcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBhcmlhTGFiZWwgPSB1bmRlZmluZWRcblxuICAgICQ6IHZhbCA9IDBcbiAgICAkOiB0aXRsZVByb3AgPSB0aXRsZSB8fCBgUHJvZ3Jlc3MgLSAke3ZhbH0lYFxuICAgICQ6IGFyaWFMYWJlbFByb3AgPSBhcmlhTGFiZWwgfHwgYFByb2dyZXNzIC0gJHt2YWx9JWBcbiAgICAkOiBjbGFzc1Byb3AgPSBjbGFzc25hbWVzKCdwcm9ncmVzcycsICQkcHJvcHMuY2xhc3MpXG5cbiAgICBvbk1vdW50KCgpID0+IHtcbiAgICAgICAgLy8gTWFrZSBsb2FkaW5nIHByb2dyZXNzIGVmZmVjdCBvbiBtb3VudCBjb21wb25lbnQuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdmFsID0gTnVtYmVyLmlzRmluaXRlKCt2YWx1ZSkgPyBNYXRoLm1heCgwLCBNYXRoLm1pbigrdmFsdWUsIDEwMCkpIDogMCwgMClcbiAgICB9KVxuPC9zY3JpcHQ+XG5cblxuPGRpdlxuICAgICAgICB7aWR9XG4gICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4gICAgICAgIHJvbGU9XCJwcm9ncmVzc2JhclwiXG4gICAgICAgIGFyaWEtdmFsdWVtaW49XCIwXCJcbiAgICAgICAgYXJpYS12YWx1ZW1heD1cIjEwMFwiXG4gICAgICAgIGFyaWEtdmFsdWVub3c9e3ZhbH1cbj5cbiAgICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtaW5uZXItZnJhbWVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInByb2dyZXNzLWNvcmVcIiBzdHlsZT17YHdpZHRoOiR7dmFsfSVgfT48L2Rpdj5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuXG48c3R5bGU+XG4gICAgLnByb2dyZXNzIHtcbiAgICAgICAgZmxleDogMDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGhlaWdodDogMzBweDtcbiAgICAgICAgcGFkZGluZzogN3B4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA5OTk5cHg7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICAgICAgYm94LXNoYWRvdzogaW5zZXQgdmFyKC0tc2hhZG93LXByaW1hcnkpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5LWluc2V0KTtcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3MtaW5uZXItZnJhbWUge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA5OTk5cHg7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzLWNvcmUge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICB0cmFuc2l0aW9uOiAxcyBlYXNlLWluLW91dDtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogMnB4O1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgaW1wb3J0IEljb24gZnJvbSAnLi9JY29uLnN2ZWx0ZSdcbiAgaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnXG5cbiAgZXhwb3J0IGxldCBzZWdtZW50O1xuXG4gIGxldCBpc0RhcmtUaGVtZSA9IGZhbHNlXG5cbiAgbGV0IHZhbHVlID0gJ3VhJ1xuXG4gIGZ1bmN0aW9uIGNoYW5nZVRoZW1lKCkge1xuICAgIGlzRGFya1RoZW1lID0gIWlzRGFya1RoZW1lXG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCd0aGVtZS1kYXJrJylcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ3RoZW1lLWxpZ2h0JylcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoaXNEYXJrVGhlbWUgPyAndGhlbWUtZGFyaycgOiAndGhlbWUtbGlnaHQnKVxuICB9XG48L3NjcmlwdD5cblxuPG5hdiBjbGFzcz1cInRoZW1lLWJnIGNvbnRhaW5lclwiPlxuXHQ8dWw+XG5cdFx0PGxpPjxhIGNsYXNzOnNlbGVjdGVkPSd7c2VnbWVudCA9PT0gdW5kZWZpbmVkfScgaHJlZj0nLic+aG9tZTwvYT48L2xpPlxuXHRcdDxsaT48YSBjbGFzczpzZWxlY3RlZD0ne3NlZ21lbnQgPT09IFwiYWJvdXRcIn0nIGhyZWY9J2Fib3V0Jz5hYm91dDwvYT48L2xpPlxuXG5cdFx0PCEtLSBmb3IgdGhlIGJsb2cgbGluaywgd2UncmUgdXNpbmcgcmVsPXByZWZldGNoIHNvIHRoYXQgU2FwcGVyIHByZWZldGNoZXNcblx0XHQgICAgIHRoZSBibG9nIGRhdGEgd2hlbiB3ZSBob3ZlciBvdmVyIHRoZSBsaW5rIG9yIHRhcCBpdCBvbiBhIHRvdWNoc2NyZWVuIC0tPlxuXHRcdDxsaT48YSByZWw9cHJlZmV0Y2ggY2xhc3M6c2VsZWN0ZWQ9J3tzZWdtZW50ID09PSBcImJsb2dcIn0nIGhyZWY9J2Jsb2cnPmJsb2c8L2E+PC9saT5cblx0PC91bD5cblxuICA8c3BhbiBjbGFzcz1cIm5hdi1hY3Rpb25zXCI+XG4gICAgPHNlbGVjdCB7dmFsdWV9IG5hbWU9XCJsYW5nXCIgaWQ9XCJsYW5nXCIgY2xhc3M9XCJidG4gc21hbGwgbGFuZy1zZWxlY3RcIj5cbiAgICAgIDxvcHRpb24gdmFsdWU9XCJ1YVwiPlVhPC9vcHRpb24+XG4gICAgICA8b3B0aW9uIHZhbHVlPVwicnVcIj5SdTwvb3B0aW9uPlxuICAgICAgPG9wdGlvbiB2YWx1ZT1cImVuXCI+RW48L29wdGlvbj5cbiAgICA8L3NlbGVjdD5cblxuICAgIDxCdXR0b24gb246Y2xpY2s9e2NoYW5nZVRoZW1lfSBhdXRvIHNpemU9XCJzbWFsbFwiPlxuICAgICAgPEljb24gdHlwZT1cIm1vb25cIiBjbGFzcz1cInRoZW1lLXN2Zy1maWxsXCIvPlxuICAgIDwvQnV0dG9uPlxuICA8L3NwYW4+XG48L25hdj5cblxuPHN0eWxlPlxuICBuYXYge1xuICAgIHBvc2l0aW9uOiBzdGlja3k7XG4gICAgdG9wOiAwO1xuICAgIHotaW5kZXg6IDE7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXNlY29uZGFyeSk7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSwgLjEpO1xuICB9XG5cbiAgLnNlbGVjdGVkIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICB9XG5cbiAgLnNlbGVjdGVkOjphZnRlciB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGNvbnRlbnQ6IFwiXCI7XG4gICAgd2lkdGg6IGNhbGMoMTAwJSAtIDFlbSk7XG4gICAgaGVpZ2h0OiAycHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKHZhcigtLWNvbG9yLWRhbmdlcikpO1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIGJvdHRvbTogLTFweDtcbiAgfVxuXG4gIGEge1xuICAgIHBhZGRpbmc6IC44ZW0gMC41ZW07XG4gIH1cblxuICAubmF2LWFjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgfVxuXG4gIC5sYW5nLXNlbGVjdCB7XG4gICAgcGFkZGluZzogNXB4O1xuICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICB9XG5cbiAgLmxhbmctc2VsZWN0OmhvdmVyLFxuICAubGFuZy1zZWxlY3Q6Zm9jdXMge1xuICAgIGJveC1zaGFkb3c6IG5vbmU7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IFN3aXBlLCBTd2lwZUl0ZW0gfSBmcm9tIFwiLi4vcGx1Z2luc1wiO1xuICAgIGltcG9ydCB7IEJ1dHRvbiwgUGljdHVyZSwgSW5wdXQsIFByb2dyZXNzLCBJY29uLCBGb3JtLCBSYXRlLCBBdmF0YXIsIERpdmlkZXIgfSBmcm9tICcuLi9jb21wb25lbnRzJ1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgICBoMSB7XG4gICAgICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICB9XG5cbiAgICAudG9wIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAyKTtcbiAgICAgICAgbWFyZ2luLXRvcDogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgIH1cblxuICAgIC50b3AtcGljIHtcbiAgICAgICAgei1pbmRleDogMDtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAycHg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLm9wdGlvbnMge1xuICAgICAgICBmbGV4OiAwO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBtYXJnaW46IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogLTEpIDA7XG4gICAgICAgIHBhZGRpbmc6IDAgMCAwIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICAub3B0aW9ucyBsaSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIG1hcmdpbjogdmFyKC0tc2NyZWVuLXBhZGRpbmcpIDA7XG4gICAgfVxuXG4gICAgLnJhdGUtc2VjdGlvbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBiYXNlbGluZTtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBwYWRkaW5nOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDIpIDA7XG4gICAgfVxuXG4gICAgLmF2YS1zZWN0aW9uIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIH1cblxuICAgIC5hdmEtc2VjdGlvbiBzcGFuIHtcbiAgICAgICAgZm9udC1zaXplOiAuN3JlbTtcbiAgICAgICAgcGFkZGluZzogMCB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgfVxuXG4gICAgLmF2YS1zZWN0aW9uIHNwYW4gcCB7XG4gICAgICAgIGZvbnQtc2l6ZTogLjZyZW07XG4gICAgfVxuXG4gICAgLmF2YS1zZWN0aW9uIHNwYW4gcCxcbiAgICAuYXZhLXNlY3Rpb24gc3BhbiBoMyB7XG4gICAgICAgIG1heC13aWR0aDogMTAwJTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuNDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgfVxuPC9zdHlsZT5cblxuPHN2ZWx0ZTpoZWFkPlxuICAgIDx0aXRsZT5DaGFyaXRpZnkgLSBpcyB0aGUgYXBwbGljYXRpb24gZm9yIGhlbHBpbmcgdGhvc2UgaW4gbmVlZC48L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICA8c2VjdGlvbiBjbGFzcz1cInRvcFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwidG9wLXBpY1wiPlxuICAgICAgICAgICAgPFN3aXBlPlxuICAgICAgICAgICAgICAgIDxTd2lwZUl0ZW0+XG4gICAgICAgICAgICAgICAgICAgIDxQaWN0dXJlIHNyYz1cImh0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvcGVvcGxlXCIgYWx0PVwic2FtcGxlXCIvPlxuICAgICAgICAgICAgICAgIDwvU3dpcGVJdGVtPlxuICAgICAgICAgICAgICAgIDxTd2lwZUl0ZW0+XG4gICAgICAgICAgICAgICAgICAgIDxQaWN0dXJlIHNyYz1cImh0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvYW55XCIgYWx0PVwic2FtcGxlXCIvPlxuICAgICAgICAgICAgICAgIDwvU3dpcGVJdGVtPlxuICAgICAgICAgICAgICAgIDxTd2lwZUl0ZW0+XG4gICAgICAgICAgICAgICAgICAgIDxQaWN0dXJlIHNyYz1cImh0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvYXJjaFwiIGFsdD1cInNhbXBsZVwiLz5cbiAgICAgICAgICAgICAgICA8L1N3aXBlSXRlbT5cbiAgICAgICAgICAgICAgICA8U3dpcGVJdGVtPlxuICAgICAgICAgICAgICAgICAgICA8UGljdHVyZSBzcmM9XCJodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL25hdHVyZVwiIGFsdD1cInNhbXBsZVwiLz5cbiAgICAgICAgICAgICAgICA8L1N3aXBlSXRlbT5cbiAgICAgICAgICAgICAgICA8U3dpcGVJdGVtPlxuICAgICAgICAgICAgICAgICAgICA8UGljdHVyZSBzcmM9XCJodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3RlY2hcIiBhbHQ9XCJzYW1wbGVcIi8+XG4gICAgICAgICAgICAgICAgPC9Td2lwZUl0ZW0+XG4gICAgICAgICAgICA8L1N3aXBlPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8dWwgY2xhc3M9XCJvcHRpb25zXCI+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgPEJ1dHRvbiBpcz1cInN1Y2Nlc3NcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiPnRlc3QxPC9CdXR0b24+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgIDxCdXR0b24gaXM9XCJzdWNjZXNzXCIgb246Y2xpY2s9XCJ7ZSA9PiBjb25zb2xlLmxvZyhlKX1cIj50ZXN0MTI8L0J1dHRvbj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgPEJ1dHRvbiBpcz1cInN1Y2Nlc3NcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiPnRlc3QxMjM8L0J1dHRvbj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgPGJyPlxuICAgICAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwibnVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3Q9XCJzdW0tc3VnZ2VzdGlvbnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJOdW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b3NlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ249XCJyaWdodFwiXG4gICAgICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgICAgIDxkYXRhbGlzdCBpZD1cInN1bS1zdWdnZXN0aW9uc1wiPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMjBcIj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjUwMFwiPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMTAwMFwiPlxuICAgICAgICAgICAgICAgIDwvZGF0YWxpc3Q+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgIDxCdXR0b24gaXM9XCJ3YXJuaW5nXCIgb246Y2xpY2s9XCJ7ZSA9PiBjb25zb2xlLmxvZyhlKX1cIj5TdWJtaXQ8L0J1dHRvbj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgIDwvdWw+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPFByb2dyZXNzIHZhbHVlPVwiNjVcIj48L1Byb2dyZXNzPlxuXG4gICAgPHNlY3Rpb24gY2xhc3M9XCJyYXRlLXNlY3Rpb25cIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImF2YS1zZWN0aW9uXCI+XG4gICAgICAgICAgICA8QXZhdGFyIHNyYz1cImh0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvcGVvcGxlXCIgYWx0PVwiYXZhdGFyXCIvPlxuXG4gICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICA8aDM+VGluYSBLYW5kZWxha2k8L2gzPlxuICAgICAgICAgICAgICAgIDxwPk9SRyBjaGFyaXR5IGNoYXJpdGlmeTwvcD5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPFJhdGUvPlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxicj5cblxuICAgIDxoMT5UaGUgbWFpbiB0aXRsZTwvaDE+XG5cbiAgICA8YnI+XG5cbiAgICA8cCBjbGFzcz1cInRleHQtY2VudGVyXCIgc3R5bGU9XCJwYWRkaW5nOiAwIDEwdndcIj5cbiAgICAgICAgQSBzbWFsbCBkZXNjcmlwdGlvbiB0aGF0IGRlc2NyaWJlcyB0aGUgdGl0bGUgYWJvdmUgYW5kIGp1c3QgbWFrZXMgdGV4dCBsb25nZXIuXG4gICAgPC9wPlxuPC9zZWN0aW9uPlxuXG48YnI+XG48YnI+XG5cbjxEaXZpZGVyLz5cblxuXG48Rm9ybSBvbjpzdWJtaXQ9XCJ7KGUpID0+IGNvbnNvbGUubG9nKGUpfVwiIG5hbWU9XCJtYWluLWZvcm1cIj5cbiAgICA8YnI+XG4gICAgPGJyPlxuXG4gICAgPElucHV0IG5hbWU9XCJ0ZXN0MVwiIHR5cGU9XCJudW1iZXJcIiBsaXN0PVwic3VtLXN1Z2dlc3Rpb25zXCIvPlxuXG4gICAgPGJyPlxuICAgIDxicj5cblxuICAgIDxJbnB1dCBuYW1lPVwidGVzdDJcIiB0eXBlPVwidGV4dFwiIGxpc3Q9XCJzdW0tc3VnZ2VzdGlvbnNcIi8+XG5cbiAgICA8YnI+XG4gICAgPGJyPlxuXG4gICAgPElucHV0IG5hbWU9XCJ0ZXN0M1wiIHR5cGU9XCJlbWFpbFwiIGxpc3Q9XCJzdW0tc3VnZ2VzdGlvbnNcIi8+XG5cbiAgICA8YnI+XG4gICAgPGJyPlxuXG4gICAgPElucHV0IG5hbWU9XCJ0ZXN0NFwiIHR5cGU9XCJ1cmxcIiBsaXN0PVwic3VtLXN1Z2dlc3Rpb25zXCIvPlxuXG4gICAgPGJyPlxuICAgIDxicj5cblxuICAgIDxJbnB1dCBuYW1lPVwidGVzdDVcIiB0eXBlPVwic2VhcmNoXCIgbGlzdD1cInN1bS1zdWdnZXN0aW9uc1wiLz5cblxuICAgIDxicj5cbiAgICA8YnI+XG5cbiAgICA8SW5wdXQgbmFtZT1cInRlc3Q2XCIgdHlwZT1cImRhdGVcIiBsaXN0PVwic3VtLXN1Z2dlc3Rpb25zXCIvPlxuXG4gICAgPGJyPlxuICAgIDxicj5cblxuICAgIDxJbnB1dCBuYW1lPVwidGVzdDdcIiB0eXBlPVwicGFzc3dvcmRcIiBsaXN0PVwic3VtLXN1Z2dlc3Rpb25zXCIvPlxuXG4gICAgPGJyPlxuICAgIDxicj5cblxuICAgIDxJbnB1dCBuYW1lPVwidGVzdDhcIiB0eXBlPVwidGVsXCIgbGlzdD1cInN1bS1zdWdnZXN0aW9uc1wiLz5cblxuICAgIDxicj5cbiAgICA8YnI+XG5cbiAgICA8QnV0dG9uIGlzPVwic3VjY2Vzc1wiIHR5cGU9XCJzdWJtaXRcIj5TdWJtaXQ8L0J1dHRvbj5cbjwvRm9ybT5cblxuPGgxPkNoYXJpdGlmeSAtIGlzIHRoZSBhcHBsaWNhdGlvbiBmb3IgaGVscGluZyB0aG9zZSBpbiBuZWVkLjwvaDE+XG5cbjxicj5cbjxicj5cblxuPGgyIGNsYXNzPVwidGV4dC1zdWNjZXNzXCI+VHlwb2dyYXBoeTwvaDI+XG5cbjxicj5cbjxicj5cblxuPHA+RmV3IHBhcmFncmFwaHMgdG8gdGV4dCBmb250czwvcD5cbjxwPtCU0LXQutGW0LvRjNC60LAg0L/QsNGA0LDQs9GA0LDRhNGW0LIg0LTQu9GPINGC0LXRgdGC0YMg0YLQtdC60YHRgtGDPC9wPlxuPHA+0J3QtdGB0LrQvtC70YzQutC+INC/0LDRgNCw0LPRgNCw0YTQvtCyINC00LvRjyDRgtC10YHRgtCwINGC0LXQutGB0YLQsDwvcD5cblxuPGJyPlxuPGJyPlxuXG48aDIgY2xhc3M9XCJ0ZXh0LXdhcm5pbmdcIj5JbnRlcmFjdGl2ZSBlbGVtZW50czwvaDI+XG5cbjx1bD5cbiAgICA8bGk+XG4gICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgPEljb24gc2l6ZT1cInNtYWxsXCIgdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICAgICAgICAgIDxJY29uIHNpemU9XCJzbWFsbFwiIHR5cGU9XCJoZWFydC1maWxsZWRcIiBpcz1cIndhcm5pbmdcIi8+XG4gICAgICAgICAgICA8SWNvbiBzaXplPVwic21hbGxcIiB0eXBlPVwiaGVhcnQtZmlsbGVkXCIgaXM9XCJkYW5nZXJcIi8+XG4gICAgICAgIDwvc3Bhbj5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICA8SWNvbiB0eXBlPVwiaGVhcnQtZmlsbGVkXCIvPlxuICAgICAgICAgICAgPEljb24gdHlwZT1cImhlYXJ0LWZpbGxlZFwiIGlzPVwid2FybmluZ1wiLz5cbiAgICAgICAgICAgIDxJY29uIHR5cGU9XCJoZWFydC1maWxsZWRcIiBpcz1cImRhbmdlclwiLz5cbiAgICAgICAgPC9zcGFuPlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgIDxJY29uIHNpemU9XCJiaWdcIiB0eXBlPVwiaGVhcnQtZmlsbGVkXCIvPlxuICAgICAgICAgICAgPEljb24gc2l6ZT1cImJpZ1wiIHR5cGU9XCJoZWFydC1maWxsZWRcIiBpcz1cIndhcm5pbmdcIi8+XG4gICAgICAgICAgICA8SWNvbiBzaXplPVwiYmlnXCIgdHlwZT1cImhlYXJ0LWZpbGxlZFwiIGlzPVwiZGFuZ2VyXCIvPlxuICAgICAgICA8L3NwYW4+XG4gICAgPC9saT5cbjwvdWw+XG5cbjxicj5cbjxicj5cblxuPHNlY3Rpb24gc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IGRpc3BsYXk6IGZsZXg7IGp1c3RpZnktY29udGVudDogc3BhY2UtYXJvdW5kXCI+XG4gICAgPGRpdj5cbiAgICAgICAgPGJyPlxuICAgICAgICBCdXR0b25zXG4gICAgICAgIDxicj5cbiAgICAgICAgPGJyPlxuICAgICAgICA8QnV0dG9uIG9uOmNsaWNrPVwie2UgPT4gY29uc29sZS5sb2coZSl9XCI+dGVzdDwvQnV0dG9uPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxicj5cbiAgICAgICAgPEJ1dHRvbiBpcz1cInN1Y2Nlc3NcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiPnRlc3Q8L0J1dHRvbj5cbiAgICAgICAgPGJyPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxCdXR0b24gaXM9XCJzdWNjZXNzXCIgb246Y2xpY2s9XCJ7ZSA9PiBjb25zb2xlLmxvZyhlKX1cIiBhcmlhTGFiZWw9XCJ0ZXh0XCI+dGVzdDwvQnV0dG9uPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxicj5cbiAgICAgICAgV2l0aCB0ZXh0XG4gICAgICAgIDxCdXR0b24gaXM9XCJzdWNjZXNzXCIgb246Y2xpY2s9XCJ7ZSA9PiBjb25zb2xlLmxvZyhlKX1cIj50ZXN0PC9CdXR0b24+XG4gICAgICAgIGFuZCBiZWhpbmQuXG4gICAgICAgIDxicj5cbiAgICAgICAgPGJyPlxuICAgICAgICA8QnV0dG9uIGlzPVwid2FybmluZ1wiIG9uOmNsaWNrPVwie2UgPT4gY29uc29sZS5sb2coZSl9XCI+U29tZSBleGFtcGxlIG9mIEJ1dHRvbjwvQnV0dG9uPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxicj5cbiAgICAgICAgPEJ1dHRvbiBpcz1cImRhbmdlclwiIG9uOmNsaWNrPVwie2UgPT4gY29uc29sZS5sb2coZSl9XCI+U29tZSBleGFtcGxlIG9mIEJ1dHRvbjwvQnV0dG9uPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxicj5cbiAgICA8L2Rpdj5cblxuICAgIDxkaXY+XG4gICAgICAgIDxicj5cbiAgICAgICAgTGlua3MgYXMgYnV0dG9uc1xuICAgICAgICA8YnI+XG4gICAgICAgIDxicj5cbiAgICAgICAgPEJ1dHRvbiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiIGhyZWY9XCIjXCI+dGVzdDwvQnV0dG9uPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxicj5cbiAgICAgICAgPEJ1dHRvbiBpcz1cInN1Y2Nlc3NcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiIGhyZWY9XCIjXCI+dGVzdDwvQnV0dG9uPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxicj5cbiAgICAgICAgPEJ1dHRvbiBpcz1cInN1Y2Nlc3NcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiIGhyZWY9XCIjXCI+dGVzdDwvQnV0dG9uPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxicj5cbiAgICAgICAgV2l0aCB0ZXh0XG4gICAgICAgIDxCdXR0b24gaXM9XCJzdWNjZXNzXCIgb246Y2xpY2s9XCJ7ZSA9PiBjb25zb2xlLmxvZyhlKX1cIiBocmVmPVwiI1wiPnRlc3Q8L0J1dHRvbj5cbiAgICAgICAgYW5kIGJlaGluZC5cbiAgICAgICAgPGJyPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxCdXR0b24gaXM9XCJ3YXJuaW5nXCIgb246Y2xpY2s9XCJ7ZSA9PiBjb25zb2xlLmxvZyhlKX1cIiBocmVmPVwiI1wiPlNvbWUgZXhhbXBsZSBvZiBCdXR0b248L0J1dHRvbj5cbiAgICAgICAgPGJyPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxCdXR0b24gaXM9XCJkYW5nZXJcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiIGhyZWY9XCIjXCI+U29tZSBleGFtcGxlIG9mIEJ1dHRvbjwvQnV0dG9uPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxicj5cbiAgICA8L2Rpdj5cbjwvc2VjdGlvbj5cblxuPGJyPlxuPGJyPlxuXG48aDIgY2xhc3M9XCJ0ZXh0LWRhbmdlclwiPklucHV0IGZpZWxkczwvaDI+XG5cbjxicj5cbjxicj5cblxuPHNlY3Rpb24+XG4gICAgPElucHV0IHJvd3M9ezJ9IG5hbWU9XCJ0ZXhcIiBsaXN0PVwibGlzXCIvPlxuXG4gICAgPGJyPlxuICAgIDxicj5cblxuICAgIDxJbnB1dCBuYW1lPVwidGV4MVwiIGxpc3Q9XCJsaXNcIiBwbGFjZWhvbGRlcj1cIlNvbWUgcGxhY2Vob2xkZXIgdGV4dFwiLz5cblxuICAgIDxicj5cbiAgICA8YnI+XG5cbiAgICA8SW5wdXQgdHlwZT1cIm51bWJlclwiIG5hbWU9XCJ0ZXgyXCIgbGlzdD1cImxpc1wiLz5cblxuICAgIDxkYXRhbGlzdCBpZD1cImxpc1wiPlxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMVwiPlxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMlwiPlxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiM1wiPlxuICAgIDwvZGF0YWxpc3Q+XG5cbiAgICA8bGFiZWwgZm9yPVwiaW5wdXRcIiBjbGFzcz1cInRleHQtc3VjY2Vzc1wiPmxhYmVsPC9sYWJlbD5cbiAgICA8aW5wdXQgaWQ9XCJpbnB1dFwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCJ0ZXh0XCI+XG5cbiAgICA8YnI+XG4gICAgPGJyPlxuXG4gICAgPGEgaHJlZj1cIi5cIiBjbGFzcz1cInRleHQtd2FybmluZ1wiPlNvbWUgbGluazwvYT5cblxuICAgIDxicj5cbiAgICA8YnI+XG5cbiAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInRleHQtaW5mb1wiPkJ1dHRvbiBleGFtcGxlPC9idXR0b24+XG48L3NlY3Rpb24+XG5cbjxicj5cbjxicj5cblxuPGgyIGNsYXNzPVwidGV4dC1pbmZvXCI+SW1hZ2VzPC9oMj5cblxuPFBpY3R1cmUgYWx0PVwiQm9yYXRcIiBzcmM9XCJncmVhdC1zdWNjZXNzLnBuZ1wiIGNsYXNzPVwicGljdHVyZVwiPlxuICAgIEhJR0ggRklWRSFcbjwvUGljdHVyZT5cblxuPGJyPlxuPGJyPlxuXG48UGljdHVyZSBzcmM9XCJodHRwczovL3BsYWNlaW1nLmNvbS8xMDAwLzEwMDAvYW55XCIgYWx0PVwic2FtcGxlXCIvPlxuXG48YnI+XG48YnI+XG5cbjxoMiBjbGFzcz1cInRleHQtc3VjY2Vzc1wiPk90aGVyPC9oMj5cblxuPHA+XG4gICAgPHN0cm9uZz5cbiAgICAgICAgVHJ5IGVkaXRpbmcgdGhpcyBmaWxlIChzcmMvcm91dGVzL2luZGV4LnN2ZWx0ZSkgdG8gdGVzdCBsaXZlIHJlbG9hZGluZy5cbiAgICA8L3N0cm9uZz5cbjwvcD5cblxuPHAgc3R5bGU9XCJ0ZXh0LWFsaWduOiBqdXN0aWZ5XCI+XG4gICAgQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LlxuICAgIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC5cbiAgICBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuXG4gICAgQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LlxuICAgIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC5cblxuICAgIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC5cbiAgICBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuXG4gICAgQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LlxuICAgIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC5cbiAgICBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuXG5cbiAgICBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuXG4gICAgQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LlxuICAgIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC5cbiAgICBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuXG4gICAgQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LlxuXG4gICAgQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LlxuICAgIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC5cbiAgICBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuXG4gICAgQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LlxuICAgIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC5cblxuICAgIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC5cbiAgICBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuXG4gICAgQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LlxuICAgIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC5cbiAgICBBIGxvdCBvZiBFbmdsaXNoIHRleHQuIEEgbG90IG9mIEVuZ2xpc2ggdGV4dC4gQSBsb3Qgb2YgRW5nbGlzaCB0ZXh0LiBBIGxvdCBvZiBFbmdsaXNoIHRleHQuXG48L3A+XG4iLCI8c2NyaXB0IGNvbnRleHQ9XCJtb2R1bGVcIj5cblx0ZXhwb3J0IGZ1bmN0aW9uIHByZWxvYWQoeyBwYXJhbXMsIHF1ZXJ5IH0pIHtcblx0XHRyZXR1cm4gdGhpcy5mZXRjaChgYmxvZy5qc29uYCkudGhlbihyID0+IHIuanNvbigpKS50aGVuKHBvc3RzID0+IHtcblx0XHRcdHJldHVybiB7IHBvc3RzIH07XG5cdFx0fSk7XG5cdH1cbjwvc2NyaXB0PlxuXG48c2NyaXB0PlxuXHRleHBvcnQgbGV0IHBvc3RzO1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cblx0dWwge1xuXHRcdG1hcmdpbjogMCAwIDFlbSAwO1xuXHRcdGxpbmUtaGVpZ2h0OiAxLjU7XG5cdH1cbjwvc3R5bGU+XG5cbjxzdmVsdGU6aGVhZD5cblx0PHRpdGxlPkJsb2c8L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPGgxPlJlY2VudCBwb3N0czwvaDE+XG5cbjx1bD5cblx0eyNlYWNoIHBvc3RzIGFzIHBvc3R9XG5cdFx0PCEtLSB3ZSdyZSB1c2luZyB0aGUgbm9uLXN0YW5kYXJkIGByZWw9cHJlZmV0Y2hgIGF0dHJpYnV0ZSB0b1xuXHRcdFx0XHR0ZWxsIFNhcHBlciB0byBsb2FkIHRoZSBkYXRhIGZvciB0aGUgcGFnZSBhcyBzb29uIGFzXG5cdFx0XHRcdHRoZSB1c2VyIGhvdmVycyBvdmVyIHRoZSBsaW5rIG9yIHRhcHMgaXQsIGluc3RlYWQgb2Zcblx0XHRcdFx0d2FpdGluZyBmb3IgdGhlICdjbGljaycgZXZlbnQgLS0+XG5cdFx0PGxpPjxhIHJlbD0ncHJlZmV0Y2gnIGhyZWY9J2Jsb2cve3Bvc3Quc2x1Z30nPntwb3N0LnRpdGxlfTwvYT48L2xpPlxuXHR7L2VhY2h9XG48L3VsPiIsIjxzY3JpcHQgY29udGV4dD1cIm1vZHVsZVwiPlxuXHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJlbG9hZCh7IHBhcmFtcywgcXVlcnkgfSkge1xuXHRcdC8vIHRoZSBgc2x1Z2AgcGFyYW1ldGVyIGlzIGF2YWlsYWJsZSBiZWNhdXNlXG5cdFx0Ly8gdGhpcyBmaWxlIGlzIGNhbGxlZCBbc2x1Z10uc3ZlbHRlXG5cdFx0Y29uc3QgcmVzID0gYXdhaXQgdGhpcy5mZXRjaChgYmxvZy8ke3BhcmFtcy5zbHVnfS5qc29uYCk7XG5cdFx0Y29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG5cblx0XHRpZiAocmVzLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0XHRyZXR1cm4geyBwb3N0OiBkYXRhIH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZXJyb3IocmVzLnN0YXR1cywgZGF0YS5tZXNzYWdlKTtcblx0XHR9XG5cdH1cbjwvc2NyaXB0PlxuXG48c2NyaXB0PlxuXHRleHBvcnQgbGV0IHBvc3Q7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuXHQvKlxuXHRcdEJ5IGRlZmF1bHQsIENTUyBpcyBsb2NhbGx5IHNjb3BlZCB0byB0aGUgY29tcG9uZW50LFxuXHRcdGFuZCBhbnkgdW51c2VkIHN0eWxlcyBhcmUgZGVhZC1jb2RlLWVsaW1pbmF0ZWQuXG5cdFx0SW4gdGhpcyBwYWdlLCBTdmVsdGUgY2FuJ3Qga25vdyB3aGljaCBlbGVtZW50cyBhcmVcblx0XHRnb2luZyB0byBhcHBlYXIgaW5zaWRlIHRoZSB7e3twb3N0Lmh0bWx9fX0gYmxvY2ssXG5cdFx0c28gd2UgaGF2ZSB0byB1c2UgdGhlIDpnbG9iYWwoLi4uKSBtb2RpZmllciB0byB0YXJnZXRcblx0XHRhbGwgZWxlbWVudHMgaW5zaWRlIC5jb250ZW50XG5cdCovXG5cdC5jb250ZW50IDpnbG9iYWwoaDIpIHtcblx0XHRmb250LXNpemU6IDEuNGVtO1xuXHRcdGZvbnQtd2VpZ2h0OiA1MDA7XG5cdH1cblxuXHQuY29udGVudCA6Z2xvYmFsKHByZSkge1xuXHRcdGJhY2tncm91bmQtY29sb3I6ICNmOWY5Zjk7XG5cdFx0Ym94LXNoYWRvdzogaW5zZXQgMXB4IDFweCA1cHggcmdiYSgwLDAsMCwwLjA1KTtcblx0XHRwYWRkaW5nOiAwLjVlbTtcblx0XHRib3JkZXItcmFkaXVzOiAycHg7XG5cdFx0b3ZlcmZsb3cteDogYXV0bztcblx0fVxuXG5cdC5jb250ZW50IDpnbG9iYWwocHJlKSA6Z2xvYmFsKGNvZGUpIHtcblx0XHRiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcblx0XHRwYWRkaW5nOiAwO1xuXHR9XG5cblx0LmNvbnRlbnQgOmdsb2JhbCh1bCkge1xuXHRcdGxpbmUtaGVpZ2h0OiAxLjU7XG5cdH1cblxuXHQuY29udGVudCA6Z2xvYmFsKGxpKSB7XG5cdFx0bWFyZ2luOiAwIDAgMC41ZW0gMDtcblx0fVxuPC9zdHlsZT5cblxuPHN2ZWx0ZTpoZWFkPlxuXHQ8dGl0bGU+e3Bvc3QudGl0bGV9PC90aXRsZT5cbjwvc3ZlbHRlOmhlYWQ+XG5cbjxoMT57cG9zdC50aXRsZX08L2gxPlxuXG48ZGl2IGNsYXNzPSdjb250ZW50Jz5cblx0e0BodG1sIHBvc3QuaHRtbH1cbjwvZGl2PlxuIiwiPHNjcmlwdD5cblx0aW1wb3J0IHsgTmF2IH0gZnJvbSAnLi4vY29tcG9uZW50cyc7XG5cdGltcG9ydCBJY29ucyBmcm9tICcuL19pY29ucy5zdmVsdGUnO1xuXG5cdGV4cG9ydCBsZXQgc2VnbWVudDtcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG5cdG1haW4ge1xuXHRcdHBvc2l0aW9uOiByZWxhdGl2ZTtcblx0XHRtYXgtd2lkdGg6IDU2ZW07XG5cdFx0bWFyZ2luOiAwIGF1dG87XG5cdFx0Ym94LXNpemluZzogYm9yZGVyLWJveDtcblx0fVxuPC9zdHlsZT5cblxuPE5hdiB7c2VnbWVudH0vPlxuXG48SWNvbnMvPlxuXG48bWFpbj5cblx0PHNsb3Q+PC9zbG90PlxuPC9tYWluPlxuIiwiPHNjcmlwdD5cblx0ZXhwb3J0IGxldCBzdGF0dXM7XG5cdGV4cG9ydCBsZXQgZXJyb3I7XG5cblx0Y29uc3QgZGV2ID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCc7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuXHRoMSwgcCB7XG5cdFx0bWFyZ2luOiAwIGF1dG87XG5cdH1cblxuXHRoMSB7XG5cdFx0Zm9udC1zaXplOiAyLjhlbTtcblx0XHRmb250LXdlaWdodDogNzAwO1xuXHRcdG1hcmdpbjogMCAwIDAuNWVtIDA7XG5cdH1cblxuXHRwIHtcblx0XHRtYXJnaW46IDFlbSBhdXRvO1xuXHR9XG5cblx0QG1lZGlhIChtaW4td2lkdGg6IDQ4MHB4KSB7XG5cdFx0aDEge1xuXHRcdFx0Zm9udC1zaXplOiA0ZW07XG5cdFx0fVxuXHR9XG48L3N0eWxlPlxuXG48c3ZlbHRlOmhlYWQ+XG5cdDx0aXRsZT57c3RhdHVzfTwvdGl0bGU+XG48L3N2ZWx0ZTpoZWFkPlxuXG48aDE+e3N0YXR1c308L2gxPlxuXG48cD57ZXJyb3IubWVzc2FnZX08L3A+XG5cbnsjaWYgZGV2ICYmIGVycm9yLnN0YWNrfVxuXHQ8cHJlPntlcnJvci5zdGFja308L3ByZT5cbnsvaWZ9XG4iLCIvLyBUaGlzIGZpbGUgaXMgZ2VuZXJhdGVkIGJ5IFNhcHBlciDigJQgZG8gbm90IGVkaXQgaXQhXG5pbXBvcnQgKiBhcyByb3V0ZV8wIGZyb20gXCIuLi8uLi8uLi9yb3V0ZXMvYmxvZy9pbmRleC5qc29uLmpzXCI7XG5pbXBvcnQgKiBhcyByb3V0ZV8xIGZyb20gXCIuLi8uLi8uLi9yb3V0ZXMvYmxvZy9bc2x1Z10uanNvbi5qc1wiO1xuaW1wb3J0IGNvbXBvbmVudF8wIGZyb20gXCIuLi8uLi8uLi9yb3V0ZXMvaW5kZXguc3ZlbHRlXCI7XG5pbXBvcnQgY29tcG9uZW50XzEgZnJvbSBcIi4uLy4uLy4uL3JvdXRlcy9hYm91dC5zdmVsdGVcIjtcbmltcG9ydCBjb21wb25lbnRfMiwgeyBwcmVsb2FkIGFzIHByZWxvYWRfMiB9IGZyb20gXCIuLi8uLi8uLi9yb3V0ZXMvYmxvZy9pbmRleC5zdmVsdGVcIjtcbmltcG9ydCBjb21wb25lbnRfMywgeyBwcmVsb2FkIGFzIHByZWxvYWRfMyB9IGZyb20gXCIuLi8uLi8uLi9yb3V0ZXMvYmxvZy9bc2x1Z10uc3ZlbHRlXCI7XG5pbXBvcnQgcm9vdCBmcm9tIFwiLi4vLi4vLi4vcm91dGVzL19sYXlvdXQuc3ZlbHRlXCI7XG5pbXBvcnQgZXJyb3IgZnJvbSBcIi4uLy4uLy4uL3JvdXRlcy9fZXJyb3Iuc3ZlbHRlXCI7XG5cbmNvbnN0IGQgPSBkZWNvZGVVUklDb21wb25lbnQ7XG5cbmV4cG9ydCBjb25zdCBtYW5pZmVzdCA9IHtcblx0c2VydmVyX3JvdXRlczogW1xuXHRcdHtcblx0XHRcdC8vIGJsb2cvaW5kZXguanNvbi5qc1xuXHRcdFx0cGF0dGVybjogL15cXC9ibG9nLmpzb24kLyxcblx0XHRcdGhhbmRsZXJzOiByb3V0ZV8wLFxuXHRcdFx0cGFyYW1zOiAoKSA9PiAoe30pXG5cdFx0fSxcblxuXHRcdHtcblx0XHRcdC8vIGJsb2cvW3NsdWddLmpzb24uanNcblx0XHRcdHBhdHRlcm46IC9eXFwvYmxvZ1xcLyhbXlxcL10rPykuanNvbiQvLFxuXHRcdFx0aGFuZGxlcnM6IHJvdXRlXzEsXG5cdFx0XHRwYXJhbXM6IG1hdGNoID0+ICh7IHNsdWc6IGQobWF0Y2hbMV0pIH0pXG5cdFx0fVxuXHRdLFxuXG5cdHBhZ2VzOiBbXG5cdFx0e1xuXHRcdFx0Ly8gaW5kZXguc3ZlbHRlXG5cdFx0XHRwYXR0ZXJuOiAvXlxcLyQvLFxuXHRcdFx0cGFydHM6IFtcblx0XHRcdFx0eyBuYW1lOiBcImluZGV4XCIsIGZpbGU6IFwiaW5kZXguc3ZlbHRlXCIsIGNvbXBvbmVudDogY29tcG9uZW50XzAgfVxuXHRcdFx0XVxuXHRcdH0sXG5cblx0XHR7XG5cdFx0XHQvLyBhYm91dC5zdmVsdGVcblx0XHRcdHBhdHRlcm46IC9eXFwvYWJvdXRcXC8/JC8sXG5cdFx0XHRwYXJ0czogW1xuXHRcdFx0XHR7IG5hbWU6IFwiYWJvdXRcIiwgZmlsZTogXCJhYm91dC5zdmVsdGVcIiwgY29tcG9uZW50OiBjb21wb25lbnRfMSB9XG5cdFx0XHRdXG5cdFx0fSxcblxuXHRcdHtcblx0XHRcdC8vIGJsb2cvaW5kZXguc3ZlbHRlXG5cdFx0XHRwYXR0ZXJuOiAvXlxcL2Jsb2dcXC8/JC8sXG5cdFx0XHRwYXJ0czogW1xuXHRcdFx0XHR7IG5hbWU6IFwiYmxvZ1wiLCBmaWxlOiBcImJsb2cvaW5kZXguc3ZlbHRlXCIsIGNvbXBvbmVudDogY29tcG9uZW50XzIsIHByZWxvYWQ6IHByZWxvYWRfMiB9XG5cdFx0XHRdXG5cdFx0fSxcblxuXHRcdHtcblx0XHRcdC8vIGJsb2cvW3NsdWddLnN2ZWx0ZVxuXHRcdFx0cGF0dGVybjogL15cXC9ibG9nXFwvKFteXFwvXSs/KVxcLz8kLyxcblx0XHRcdHBhcnRzOiBbXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdHsgbmFtZTogXCJibG9nXyRzbHVnXCIsIGZpbGU6IFwiYmxvZy9bc2x1Z10uc3ZlbHRlXCIsIGNvbXBvbmVudDogY29tcG9uZW50XzMsIHByZWxvYWQ6IHByZWxvYWRfMywgcGFyYW1zOiBtYXRjaCA9PiAoeyBzbHVnOiBkKG1hdGNoWzFdKSB9KSB9XG5cdFx0XHRdXG5cdFx0fVxuXHRdLFxuXG5cdHJvb3QsXG5cdHJvb3RfcHJlbG9hZDogKCkgPT4ge30sXG5cdGVycm9yXG59O1xuXG5leHBvcnQgY29uc3QgYnVpbGRfZGlyID0gXCJfX3NhcHBlcl9fL2J1aWxkXCI7XG5cbmV4cG9ydCBjb25zdCBzcmNfZGlyID0gXCJzcmNcIjtcblxuZXhwb3J0IGNvbnN0IGRldiA9IGZhbHNlOyIsImltcG9ydCB7IHNhZmVfbm90X2VxdWFsLCBub29wLCBydW5fYWxsLCBpc19mdW5jdGlvbiB9IGZyb20gJy4uL2ludGVybmFsJztcbmV4cG9ydCB7IGdldF9zdG9yZV92YWx1ZSBhcyBnZXQgfSBmcm9tICcuLi9pbnRlcm5hbCc7XG5cbmNvbnN0IHN1YnNjcmliZXJfcXVldWUgPSBbXTtcbi8qKlxuICogQ3JlYXRlcyBhIGBSZWFkYWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKiBAcGFyYW0gdmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcn1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHJlYWRhYmxlKHZhbHVlLCBzdGFydCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHN1YnNjcmliZTogd3JpdGFibGUodmFsdWUsIHN0YXJ0KS5zdWJzY3JpYmUsXG4gICAgfTtcbn1cbi8qKlxuICogQ3JlYXRlIGEgYFdyaXRhYmxlYCBzdG9yZSB0aGF0IGFsbG93cyBib3RoIHVwZGF0aW5nIGFuZCByZWFkaW5nIGJ5IHN1YnNjcmlwdGlvbi5cbiAqIEBwYXJhbSB7Kj19dmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcj19c3RhcnQgc3RhcnQgYW5kIHN0b3Agbm90aWZpY2F0aW9ucyBmb3Igc3Vic2NyaXB0aW9uc1xuICovXG5mdW5jdGlvbiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQgPSBub29wKSB7XG4gICAgbGV0IHN0b3A7XG4gICAgY29uc3Qgc3Vic2NyaWJlcnMgPSBbXTtcbiAgICBmdW5jdGlvbiBzZXQobmV3X3ZhbHVlKSB7XG4gICAgICAgIGlmIChzYWZlX25vdF9lcXVhbCh2YWx1ZSwgbmV3X3ZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgICAgICBpZiAoc3RvcCkgeyAvLyBzdG9yZSBpcyByZWFkeVxuICAgICAgICAgICAgICAgIGNvbnN0IHJ1bl9xdWV1ZSA9ICFzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgc1sxXSgpO1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLnB1c2gocywgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVuX3F1ZXVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZVtpXVswXShzdWJzY3JpYmVyX3F1ZXVlW2kgKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiB1cGRhdGUoZm4pIHtcbiAgICAgICAgc2V0KGZuKHZhbHVlKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShydW4sIGludmFsaWRhdGUgPSBub29wKSB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmliZXIgPSBbcnVuLCBpbnZhbGlkYXRlXTtcbiAgICAgICAgc3Vic2NyaWJlcnMucHVzaChzdWJzY3JpYmVyKTtcbiAgICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgc3RvcCA9IHN0YXJ0KHNldCkgfHwgbm9vcDtcbiAgICAgICAgfVxuICAgICAgICBydW4odmFsdWUpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBzdWJzY3JpYmVycy5pbmRleE9mKHN1YnNjcmliZXIpO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHN1YnNjcmliZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICAgICAgICAgIHN0b3AgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyBzZXQsIHVwZGF0ZSwgc3Vic2NyaWJlIH07XG59XG5mdW5jdGlvbiBkZXJpdmVkKHN0b3JlcywgZm4sIGluaXRpYWxfdmFsdWUpIHtcbiAgICBjb25zdCBzaW5nbGUgPSAhQXJyYXkuaXNBcnJheShzdG9yZXMpO1xuICAgIGNvbnN0IHN0b3Jlc19hcnJheSA9IHNpbmdsZVxuICAgICAgICA/IFtzdG9yZXNdXG4gICAgICAgIDogc3RvcmVzO1xuICAgIGNvbnN0IGF1dG8gPSBmbi5sZW5ndGggPCAyO1xuICAgIHJldHVybiByZWFkYWJsZShpbml0aWFsX3ZhbHVlLCAoc2V0KSA9PiB7XG4gICAgICAgIGxldCBpbml0ZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gW107XG4gICAgICAgIGxldCBwZW5kaW5nID0gMDtcbiAgICAgICAgbGV0IGNsZWFudXAgPSBub29wO1xuICAgICAgICBjb25zdCBzeW5jID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHBlbmRpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmbihzaW5nbGUgPyB2YWx1ZXNbMF0gOiB2YWx1ZXMsIHNldCk7XG4gICAgICAgICAgICBpZiAoYXV0bykge1xuICAgICAgICAgICAgICAgIHNldChyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xlYW51cCA9IGlzX2Z1bmN0aW9uKHJlc3VsdCkgPyByZXN1bHQgOiBub29wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB1bnN1YnNjcmliZXJzID0gc3RvcmVzX2FycmF5Lm1hcCgoc3RvcmUsIGkpID0+IHN0b3JlLnN1YnNjcmliZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHZhbHVlc1tpXSA9IHZhbHVlO1xuICAgICAgICAgICAgcGVuZGluZyAmPSB+KDEgPDwgaSk7XG4gICAgICAgICAgICBpZiAoaW5pdGVkKSB7XG4gICAgICAgICAgICAgICAgc3luYygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICBwZW5kaW5nIHw9ICgxIDw8IGkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGluaXRlZCA9IHRydWU7XG4gICAgICAgIHN5bmMoKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAgICBydW5fYWxsKHVuc3Vic2NyaWJlcnMpO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICB9O1xuICAgIH0pO1xufVxuXG5leHBvcnQgeyBkZXJpdmVkLCByZWFkYWJsZSwgd3JpdGFibGUgfTtcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcblxuZXhwb3J0IGNvbnN0IENPTlRFWFRfS0VZID0ge307XG5cbmV4cG9ydCBjb25zdCBwcmVsb2FkID0gKCkgPT4gKHt9KTsiLCI8IS0tIFRoaXMgZmlsZSBpcyBnZW5lcmF0ZWQgYnkgU2FwcGVyIOKAlCBkbyBub3QgZWRpdCBpdCEgLS0+XG48c2NyaXB0PlxuXHRpbXBvcnQgeyBzZXRDb250ZXh0IH0gZnJvbSAnc3ZlbHRlJztcblx0aW1wb3J0IHsgQ09OVEVYVF9LRVkgfSBmcm9tICcuL3NoYXJlZCc7XG5cdGltcG9ydCBMYXlvdXQgZnJvbSAnLi4vLi4vLi4vcm91dGVzL19sYXlvdXQuc3ZlbHRlJztcblx0aW1wb3J0IEVycm9yIGZyb20gJy4uLy4uLy4uL3JvdXRlcy9fZXJyb3Iuc3ZlbHRlJztcblxuXHRleHBvcnQgbGV0IHN0b3Jlcztcblx0ZXhwb3J0IGxldCBlcnJvcjtcblx0ZXhwb3J0IGxldCBzdGF0dXM7XG5cdGV4cG9ydCBsZXQgc2VnbWVudHM7XG5cdGV4cG9ydCBsZXQgbGV2ZWwwO1xuXHRleHBvcnQgbGV0IGxldmVsMSA9IG51bGw7XG5cblx0c2V0Q29udGV4dChDT05URVhUX0tFWSwgc3RvcmVzKTtcbjwvc2NyaXB0PlxuXG48TGF5b3V0IHNlZ21lbnQ9XCJ7c2VnbWVudHNbMF19XCIgey4uLmxldmVsMC5wcm9wc30+XG5cdHsjaWYgZXJyb3J9XG5cdFx0PEVycm9yIHtlcnJvcn0ge3N0YXR1c30vPlxuXHR7OmVsc2V9XG5cdFx0PHN2ZWx0ZTpjb21wb25lbnQgdGhpcz1cIntsZXZlbDEuY29tcG9uZW50fVwiIHsuLi5sZXZlbDEucHJvcHN9Lz5cblx0ey9pZn1cbjwvTGF5b3V0PiIsImltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGRldiwgYnVpbGRfZGlyLCBzcmNfZGlyLCBtYW5pZmVzdCB9IGZyb20gJy4vaW50ZXJuYWwvbWFuaWZlc3Qtc2VydmVyJztcbmltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcbmltcG9ydCBTdHJlYW0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0IFVybCBmcm9tICd1cmwnO1xuaW1wb3J0IGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCB6bGliIGZyb20gJ3psaWInO1xuaW1wb3J0IEFwcCBmcm9tICcuL2ludGVybmFsL0FwcC5zdmVsdGUnO1xuXG5mdW5jdGlvbiBnZXRfc2VydmVyX3JvdXRlX2hhbmRsZXIocm91dGVzKSB7XG5cdGFzeW5jIGZ1bmN0aW9uIGhhbmRsZV9yb3V0ZShyb3V0ZSwgcmVxLCByZXMsIG5leHQpIHtcblx0XHRyZXEucGFyYW1zID0gcm91dGUucGFyYW1zKHJvdXRlLnBhdHRlcm4uZXhlYyhyZXEucGF0aCkpO1xuXG5cdFx0Y29uc3QgbWV0aG9kID0gcmVxLm1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuXHRcdC8vICdkZWxldGUnIGNhbm5vdCBiZSBleHBvcnRlZCBmcm9tIGEgbW9kdWxlIGJlY2F1c2UgaXQgaXMgYSBrZXl3b3JkLFxuXHRcdC8vIHNvIGNoZWNrIGZvciAnZGVsJyBpbnN0ZWFkXG5cdFx0Y29uc3QgbWV0aG9kX2V4cG9ydCA9IG1ldGhvZCA9PT0gJ2RlbGV0ZScgPyAnZGVsJyA6IG1ldGhvZDtcblx0XHRjb25zdCBoYW5kbGVfbWV0aG9kID0gcm91dGUuaGFuZGxlcnNbbWV0aG9kX2V4cG9ydF07XG5cdFx0aWYgKGhhbmRsZV9tZXRob2QpIHtcblx0XHRcdGlmIChwcm9jZXNzLmVudi5TQVBQRVJfRVhQT1JUKSB7XG5cdFx0XHRcdGNvbnN0IHsgd3JpdGUsIGVuZCwgc2V0SGVhZGVyIH0gPSByZXM7XG5cdFx0XHRcdGNvbnN0IGNodW5rcyA9IFtdO1xuXHRcdFx0XHRjb25zdCBoZWFkZXJzID0ge307XG5cblx0XHRcdFx0Ly8gaW50ZXJjZXB0IGRhdGEgc28gdGhhdCBpdCBjYW4gYmUgZXhwb3J0ZWRcblx0XHRcdFx0cmVzLndyaXRlID0gZnVuY3Rpb24oY2h1bmspIHtcblx0XHRcdFx0XHRjaHVua3MucHVzaChCdWZmZXIuZnJvbShjaHVuaykpO1xuXHRcdFx0XHRcdHdyaXRlLmFwcGx5KHJlcywgYXJndW1lbnRzKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRyZXMuc2V0SGVhZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcblx0XHRcdFx0XHRoZWFkZXJzW25hbWUudG9Mb3dlckNhc2UoKV0gPSB2YWx1ZTtcblx0XHRcdFx0XHRzZXRIZWFkZXIuYXBwbHkocmVzLCBhcmd1bWVudHMpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHJlcy5lbmQgPSBmdW5jdGlvbihjaHVuaykge1xuXHRcdFx0XHRcdGlmIChjaHVuaykgY2h1bmtzLnB1c2goQnVmZmVyLmZyb20oY2h1bmspKTtcblx0XHRcdFx0XHRlbmQuYXBwbHkocmVzLCBhcmd1bWVudHMpO1xuXG5cdFx0XHRcdFx0cHJvY2Vzcy5zZW5kKHtcblx0XHRcdFx0XHRcdF9fc2FwcGVyX186IHRydWUsXG5cdFx0XHRcdFx0XHRldmVudDogJ2ZpbGUnLFxuXHRcdFx0XHRcdFx0dXJsOiByZXEudXJsLFxuXHRcdFx0XHRcdFx0bWV0aG9kOiByZXEubWV0aG9kLFxuXHRcdFx0XHRcdFx0c3RhdHVzOiByZXMuc3RhdHVzQ29kZSxcblx0XHRcdFx0XHRcdHR5cGU6IGhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddLFxuXHRcdFx0XHRcdFx0Ym9keTogQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKClcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaGFuZGxlX25leHQgPSAoZXJyKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRyZXMuc3RhdHVzQ29kZSA9IDUwMDtcblx0XHRcdFx0XHRyZXMuZW5kKGVyci5tZXNzYWdlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRwcm9jZXNzLm5leHRUaWNrKG5leHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCBoYW5kbGVfbWV0aG9kKHJlcSwgcmVzLCBoYW5kbGVfbmV4dCk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHRoYW5kbGVfbmV4dChlcnIpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBubyBtYXRjaGluZyBoYW5kbGVyIGZvciBtZXRob2Rcblx0XHRcdHByb2Nlc3MubmV4dFRpY2sobmV4dCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGZ1bmN0aW9uIGZpbmRfcm91dGUocmVxLCByZXMsIG5leHQpIHtcblx0XHRmb3IgKGNvbnN0IHJvdXRlIG9mIHJvdXRlcykge1xuXHRcdFx0aWYgKHJvdXRlLnBhdHRlcm4udGVzdChyZXEucGF0aCkpIHtcblx0XHRcdFx0aGFuZGxlX3JvdXRlKHJvdXRlLCByZXEsIHJlcywgbmV4dCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRuZXh0KCk7XG5cdH07XG59XG5cbi8qIVxuICogY29va2llXG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IFJvbWFuIFNodHlsbWFuXG4gKiBDb3B5cmlnaHQoYykgMjAxNSBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cy5cbiAqIEBwdWJsaWNcbiAqL1xuXG52YXIgcGFyc2VfMSA9IHBhcnNlO1xudmFyIHNlcmlhbGl6ZV8xID0gc2VyaWFsaXplO1xuXG4vKipcbiAqIE1vZHVsZSB2YXJpYWJsZXMuXG4gKiBAcHJpdmF0ZVxuICovXG5cbnZhciBkZWNvZGUgPSBkZWNvZGVVUklDb21wb25lbnQ7XG52YXIgZW5jb2RlID0gZW5jb2RlVVJJQ29tcG9uZW50O1xudmFyIHBhaXJTcGxpdFJlZ0V4cCA9IC87ICovO1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCBmaWVsZC1jb250ZW50IGluIFJGQyA3MjMwIHNlYyAzLjJcbiAqXG4gKiBmaWVsZC1jb250ZW50ID0gZmllbGQtdmNoYXIgWyAxKiggU1AgLyBIVEFCICkgZmllbGQtdmNoYXIgXVxuICogZmllbGQtdmNoYXIgICA9IFZDSEFSIC8gb2JzLXRleHRcbiAqIG9icy10ZXh0ICAgICAgPSAleDgwLUZGXG4gKi9cblxudmFyIGZpZWxkQ29udGVudFJlZ0V4cCA9IC9eW1xcdTAwMDlcXHUwMDIwLVxcdTAwN2VcXHUwMDgwLVxcdTAwZmZdKyQvO1xuXG4vKipcbiAqIFBhcnNlIGEgY29va2llIGhlYWRlci5cbiAqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gY29va2llIGhlYWRlciBzdHJpbmcgaW50byBhbiBvYmplY3RcbiAqIFRoZSBvYmplY3QgaGFzIHRoZSB2YXJpb3VzIGNvb2tpZXMgYXMga2V5cyhuYW1lcykgPT4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHJldHVybiB7b2JqZWN0fVxuICogQHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0ciwgb3B0aW9ucykge1xuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzdHIgbXVzdCBiZSBhIHN0cmluZycpO1xuICB9XG5cbiAgdmFyIG9iaiA9IHt9O1xuICB2YXIgb3B0ID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHBhaXJzID0gc3RyLnNwbGl0KHBhaXJTcGxpdFJlZ0V4cCk7XG4gIHZhciBkZWMgPSBvcHQuZGVjb2RlIHx8IGRlY29kZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhaXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBhaXIgPSBwYWlyc1tpXTtcbiAgICB2YXIgZXFfaWR4ID0gcGFpci5pbmRleE9mKCc9Jyk7XG5cbiAgICAvLyBza2lwIHRoaW5ncyB0aGF0IGRvbid0IGxvb2sgbGlrZSBrZXk9dmFsdWVcbiAgICBpZiAoZXFfaWR4IDwgMCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgdmFyIGtleSA9IHBhaXIuc3Vic3RyKDAsIGVxX2lkeCkudHJpbSgpO1xuICAgIHZhciB2YWwgPSBwYWlyLnN1YnN0cigrK2VxX2lkeCwgcGFpci5sZW5ndGgpLnRyaW0oKTtcblxuICAgIC8vIHF1b3RlZCB2YWx1ZXNcbiAgICBpZiAoJ1wiJyA9PSB2YWxbMF0pIHtcbiAgICAgIHZhbCA9IHZhbC5zbGljZSgxLCAtMSk7XG4gICAgfVxuXG4gICAgLy8gb25seSBhc3NpZ24gb25jZVxuICAgIGlmICh1bmRlZmluZWQgPT0gb2JqW2tleV0pIHtcbiAgICAgIG9ialtrZXldID0gdHJ5RGVjb2RlKHZhbCwgZGVjKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZSBkYXRhIGludG8gYSBjb29raWUgaGVhZGVyLlxuICpcbiAqIFNlcmlhbGl6ZSB0aGUgYSBuYW1lIHZhbHVlIHBhaXIgaW50byBhIGNvb2tpZSBzdHJpbmcgc3VpdGFibGUgZm9yXG4gKiBodHRwIGhlYWRlcnMuIEFuIG9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHNwZWNpZmllZCBjb29raWUgcGFyYW1ldGVycy5cbiAqXG4gKiBzZXJpYWxpemUoJ2ZvbycsICdiYXInLCB7IGh0dHBPbmx5OiB0cnVlIH0pXG4gKiAgID0+IFwiZm9vPWJhcjsgaHR0cE9ubHlcIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAcHVibGljXG4gKi9cblxuZnVuY3Rpb24gc2VyaWFsaXplKG5hbWUsIHZhbCwgb3B0aW9ucykge1xuICB2YXIgb3B0ID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIGVuYyA9IG9wdC5lbmNvZGUgfHwgZW5jb2RlO1xuXG4gIGlmICh0eXBlb2YgZW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIGVuY29kZSBpcyBpbnZhbGlkJyk7XG4gIH1cblxuICBpZiAoIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KG5hbWUpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgbmFtZSBpcyBpbnZhbGlkJyk7XG4gIH1cblxuICB2YXIgdmFsdWUgPSBlbmModmFsKTtcblxuICBpZiAodmFsdWUgJiYgIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHZhbCBpcyBpbnZhbGlkJyk7XG4gIH1cblxuICB2YXIgc3RyID0gbmFtZSArICc9JyArIHZhbHVlO1xuXG4gIGlmIChudWxsICE9IG9wdC5tYXhBZ2UpIHtcbiAgICB2YXIgbWF4QWdlID0gb3B0Lm1heEFnZSAtIDA7XG4gICAgaWYgKGlzTmFOKG1heEFnZSkpIHRocm93IG5ldyBFcnJvcignbWF4QWdlIHNob3VsZCBiZSBhIE51bWJlcicpO1xuICAgIHN0ciArPSAnOyBNYXgtQWdlPScgKyBNYXRoLmZsb29yKG1heEFnZSk7XG4gIH1cblxuICBpZiAob3B0LmRvbWFpbikge1xuICAgIGlmICghZmllbGRDb250ZW50UmVnRXhwLnRlc3Qob3B0LmRvbWFpbikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBkb21haW4gaXMgaW52YWxpZCcpO1xuICAgIH1cblxuICAgIHN0ciArPSAnOyBEb21haW49JyArIG9wdC5kb21haW47XG4gIH1cblxuICBpZiAob3B0LnBhdGgpIHtcbiAgICBpZiAoIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KG9wdC5wYXRoKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIHBhdGggaXMgaW52YWxpZCcpO1xuICAgIH1cblxuICAgIHN0ciArPSAnOyBQYXRoPScgKyBvcHQucGF0aDtcbiAgfVxuXG4gIGlmIChvcHQuZXhwaXJlcykge1xuICAgIGlmICh0eXBlb2Ygb3B0LmV4cGlyZXMudG9VVENTdHJpbmcgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBleHBpcmVzIGlzIGludmFsaWQnKTtcbiAgICB9XG5cbiAgICBzdHIgKz0gJzsgRXhwaXJlcz0nICsgb3B0LmV4cGlyZXMudG9VVENTdHJpbmcoKTtcbiAgfVxuXG4gIGlmIChvcHQuaHR0cE9ubHkpIHtcbiAgICBzdHIgKz0gJzsgSHR0cE9ubHknO1xuICB9XG5cbiAgaWYgKG9wdC5zZWN1cmUpIHtcbiAgICBzdHIgKz0gJzsgU2VjdXJlJztcbiAgfVxuXG4gIGlmIChvcHQuc2FtZVNpdGUpIHtcbiAgICB2YXIgc2FtZVNpdGUgPSB0eXBlb2Ygb3B0LnNhbWVTaXRlID09PSAnc3RyaW5nJ1xuICAgICAgPyBvcHQuc2FtZVNpdGUudG9Mb3dlckNhc2UoKSA6IG9wdC5zYW1lU2l0ZTtcblxuICAgIHN3aXRjaCAoc2FtZVNpdGUpIHtcbiAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPVN0cmljdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbGF4JzpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPUxheCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RyaWN0JzpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPVN0cmljdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbm9uZSc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1Ob25lJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gc2FtZVNpdGUgaXMgaW52YWxpZCcpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdHI7XG59XG5cbi8qKlxuICogVHJ5IGRlY29kaW5nIGEgc3RyaW5nIHVzaW5nIGEgZGVjb2RpbmcgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHBhcmFtIHtmdW5jdGlvbn0gZGVjb2RlXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHRyeURlY29kZShzdHIsIGRlY29kZSkge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGUoc3RyKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxudmFyIGNvb2tpZSA9IHtcblx0cGFyc2U6IHBhcnNlXzEsXG5cdHNlcmlhbGl6ZTogc2VyaWFsaXplXzFcbn07XG5cbnZhciBjaGFycyA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaXyQnO1xudmFyIHVuc2FmZUNoYXJzID0gL1s8PlxcYlxcZlxcblxcclxcdFxcMFxcdTIwMjhcXHUyMDI5XS9nO1xudmFyIHJlc2VydmVkID0gL14oPzpkb3xpZnxpbnxmb3J8aW50fGxldHxuZXd8dHJ5fHZhcnxieXRlfGNhc2V8Y2hhcnxlbHNlfGVudW18Z290b3xsb25nfHRoaXN8dm9pZHx3aXRofGF3YWl0fGJyZWFrfGNhdGNofGNsYXNzfGNvbnN0fGZpbmFsfGZsb2F0fHNob3J0fHN1cGVyfHRocm93fHdoaWxlfHlpZWxkfGRlbGV0ZXxkb3VibGV8ZXhwb3J0fGltcG9ydHxuYXRpdmV8cmV0dXJufHN3aXRjaHx0aHJvd3N8dHlwZW9mfGJvb2xlYW58ZGVmYXVsdHxleHRlbmRzfGZpbmFsbHl8cGFja2FnZXxwcml2YXRlfGFic3RyYWN0fGNvbnRpbnVlfGRlYnVnZ2VyfGZ1bmN0aW9ufHZvbGF0aWxlfGludGVyZmFjZXxwcm90ZWN0ZWR8dHJhbnNpZW50fGltcGxlbWVudHN8aW5zdGFuY2VvZnxzeW5jaHJvbml6ZWQpJC87XG52YXIgZXNjYXBlZCA9IHtcbiAgICAnPCc6ICdcXFxcdTAwM0MnLFxuICAgICc+JzogJ1xcXFx1MDAzRScsXG4gICAgJy8nOiAnXFxcXHUwMDJGJyxcbiAgICAnXFxcXCc6ICdcXFxcXFxcXCcsXG4gICAgJ1xcYic6ICdcXFxcYicsXG4gICAgJ1xcZic6ICdcXFxcZicsXG4gICAgJ1xcbic6ICdcXFxcbicsXG4gICAgJ1xccic6ICdcXFxccicsXG4gICAgJ1xcdCc6ICdcXFxcdCcsXG4gICAgJ1xcMCc6ICdcXFxcMCcsXG4gICAgJ1xcdTIwMjgnOiAnXFxcXHUyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICdcXFxcdTIwMjknXG59O1xudmFyIG9iamVjdFByb3RvT3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKE9iamVjdC5wcm90b3R5cGUpLnNvcnQoKS5qb2luKCdcXDAnKTtcbmZ1bmN0aW9uIGRldmFsdWUodmFsdWUpIHtcbiAgICB2YXIgY291bnRzID0gbmV3IE1hcCgpO1xuICAgIGZ1bmN0aW9uIHdhbGsodGhpbmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHN0cmluZ2lmeSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb3VudHMuaGFzKHRoaW5nKSkge1xuICAgICAgICAgICAgY291bnRzLnNldCh0aGluZywgY291bnRzLmdldCh0aGluZykgKyAxKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb3VudHMuc2V0KHRoaW5nLCAxKTtcbiAgICAgICAgaWYgKCFpc1ByaW1pdGl2ZSh0aGluZykpIHtcbiAgICAgICAgICAgIHZhciB0eXBlID0gZ2V0VHlwZSh0aGluZyk7XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICAgICAgICAgIGNhc2UgJ1N0cmluZyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnQm9vbGVhbic6XG4gICAgICAgICAgICAgICAgY2FzZSAnRGF0ZSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnUmVnRXhwJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgICAgICAgICAgICAgdGhpbmcuZm9yRWFjaCh3YWxrKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnU2V0JzpcbiAgICAgICAgICAgICAgICBjYXNlICdNYXAnOlxuICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHRoaW5nKS5mb3JFYWNoKHdhbGspO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpbmcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvdG8gIT09IE9iamVjdC5wcm90b3R5cGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3RvICE9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm90bykuc29ydCgpLmpvaW4oJ1xcMCcpICE9PSBvYmplY3RQcm90b093blByb3BlcnR5TmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBzdHJpbmdpZnkgYXJiaXRyYXJ5IG5vbi1QT0pPc1wiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyh0aGluZykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHN0cmluZ2lmeSBQT0pPcyB3aXRoIHN5bWJvbGljIGtleXNcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpbmcpLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gd2Fsayh0aGluZ1trZXldKTsgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2Fsayh2YWx1ZSk7XG4gICAgdmFyIG5hbWVzID0gbmV3IE1hcCgpO1xuICAgIEFycmF5LmZyb20oY291bnRzKVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChlbnRyeSkgeyByZXR1cm4gZW50cnlbMV0gPiAxOyB9KVxuICAgICAgICAuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYlsxXSAtIGFbMV07IH0pXG4gICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChlbnRyeSwgaSkge1xuICAgICAgICBuYW1lcy5zZXQoZW50cnlbMF0sIGdldE5hbWUoaSkpO1xuICAgIH0pO1xuICAgIGZ1bmN0aW9uIHN0cmluZ2lmeSh0aGluZykge1xuICAgICAgICBpZiAobmFtZXMuaGFzKHRoaW5nKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5hbWVzLmdldCh0aGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzUHJpbWl0aXZlKHRoaW5nKSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeVByaW1pdGl2ZSh0aGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHR5cGUgPSBnZXRUeXBlKHRoaW5nKTtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICAgICAgY2FzZSAnU3RyaW5nJzpcbiAgICAgICAgICAgIGNhc2UgJ0Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIHJldHVybiBcIk9iamVjdChcIiArIHN0cmluZ2lmeSh0aGluZy52YWx1ZU9mKCkpICsgXCIpXCI7XG4gICAgICAgICAgICBjYXNlICdSZWdFeHAnOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGluZy50b1N0cmluZygpO1xuICAgICAgICAgICAgY2FzZSAnRGF0ZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibmV3IERhdGUoXCIgKyB0aGluZy5nZXRUaW1lKCkgKyBcIilcIjtcbiAgICAgICAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgICAgICAgICB2YXIgbWVtYmVycyA9IHRoaW5nLm1hcChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gaSBpbiB0aGluZyA/IHN0cmluZ2lmeSh2KSA6ICcnOyB9KTtcbiAgICAgICAgICAgICAgICB2YXIgdGFpbCA9IHRoaW5nLmxlbmd0aCA9PT0gMCB8fCAodGhpbmcubGVuZ3RoIC0gMSBpbiB0aGluZykgPyAnJyA6ICcsJztcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJbXCIgKyBtZW1iZXJzLmpvaW4oJywnKSArIHRhaWwgKyBcIl1cIjtcbiAgICAgICAgICAgIGNhc2UgJ1NldCc6XG4gICAgICAgICAgICBjYXNlICdNYXAnOlxuICAgICAgICAgICAgICAgIHJldHVybiBcIm5ldyBcIiArIHR5cGUgKyBcIihbXCIgKyBBcnJheS5mcm9tKHRoaW5nKS5tYXAoc3RyaW5naWZ5KS5qb2luKCcsJykgKyBcIl0pXCI7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBcIntcIiArIE9iamVjdC5rZXlzKHRoaW5nKS5tYXAoZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gc2FmZUtleShrZXkpICsgXCI6XCIgKyBzdHJpbmdpZnkodGhpbmdba2V5XSk7IH0pLmpvaW4oJywnKSArIFwifVwiO1xuICAgICAgICAgICAgICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGluZyk7XG4gICAgICAgICAgICAgICAgaWYgKHByb3RvID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGluZykubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBcIk9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShudWxsKSxcIiArIG9iaiArIFwiKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFwiT2JqZWN0LmNyZWF0ZShudWxsKVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBzdHIgPSBzdHJpbmdpZnkodmFsdWUpO1xuICAgIGlmIChuYW1lcy5zaXplKSB7XG4gICAgICAgIHZhciBwYXJhbXNfMSA9IFtdO1xuICAgICAgICB2YXIgc3RhdGVtZW50c18xID0gW107XG4gICAgICAgIHZhciB2YWx1ZXNfMSA9IFtdO1xuICAgICAgICBuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lLCB0aGluZykge1xuICAgICAgICAgICAgcGFyYW1zXzEucHVzaChuYW1lKTtcbiAgICAgICAgICAgIGlmIChpc1ByaW1pdGl2ZSh0aGluZykpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNfMS5wdXNoKHN0cmluZ2lmeVByaW1pdGl2ZSh0aGluZykpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0eXBlID0gZ2V0VHlwZSh0aGluZyk7XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICAgICAgICAgIGNhc2UgJ1N0cmluZyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnQm9vbGVhbic6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc18xLnB1c2goXCJPYmplY3QoXCIgKyBzdHJpbmdpZnkodGhpbmcudmFsdWVPZigpKSArIFwiKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnUmVnRXhwJzpcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzXzEucHVzaCh0aGluZy50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnRGF0ZSc6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc18xLnB1c2goXCJuZXcgRGF0ZShcIiArIHRoaW5nLmdldFRpbWUoKSArIFwiKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnQXJyYXknOlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNfMS5wdXNoKFwiQXJyYXkoXCIgKyB0aGluZy5sZW5ndGggKyBcIilcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaW5nLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHNfMS5wdXNoKG5hbWUgKyBcIltcIiArIGkgKyBcIl09XCIgKyBzdHJpbmdpZnkodikpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnU2V0JzpcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzXzEucHVzaChcIm5ldyBTZXRcIik7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHNfMS5wdXNoKG5hbWUgKyBcIi5cIiArIEFycmF5LmZyb20odGhpbmcpLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gXCJhZGQoXCIgKyBzdHJpbmdpZnkodikgKyBcIilcIjsgfSkuam9pbignLicpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnTWFwJzpcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzXzEucHVzaChcIm5ldyBNYXBcIik7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHNfMS5wdXNoKG5hbWUgKyBcIi5cIiArIEFycmF5LmZyb20odGhpbmcpLm1hcChmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrID0gX2FbMF0sIHYgPSBfYVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInNldChcIiArIHN0cmluZ2lmeShrKSArIFwiLCBcIiArIHN0cmluZ2lmeSh2KSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICB9KS5qb2luKCcuJykpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNfMS5wdXNoKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGluZykgPT09IG51bGwgPyAnT2JqZWN0LmNyZWF0ZShudWxsKScgOiAne30nKTtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpbmcpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50c18xLnB1c2goXCJcIiArIG5hbWUgKyBzYWZlUHJvcChrZXkpICsgXCI9XCIgKyBzdHJpbmdpZnkodGhpbmdba2V5XSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHN0YXRlbWVudHNfMS5wdXNoKFwicmV0dXJuIFwiICsgc3RyKTtcbiAgICAgICAgcmV0dXJuIFwiKGZ1bmN0aW9uKFwiICsgcGFyYW1zXzEuam9pbignLCcpICsgXCIpe1wiICsgc3RhdGVtZW50c18xLmpvaW4oJzsnKSArIFwifShcIiArIHZhbHVlc18xLmpvaW4oJywnKSArIFwiKSlcIjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0TmFtZShudW0pIHtcbiAgICB2YXIgbmFtZSA9ICcnO1xuICAgIGRvIHtcbiAgICAgICAgbmFtZSA9IGNoYXJzW251bSAlIGNoYXJzLmxlbmd0aF0gKyBuYW1lO1xuICAgICAgICBudW0gPSB+fihudW0gLyBjaGFycy5sZW5ndGgpIC0gMTtcbiAgICB9IHdoaWxlIChudW0gPj0gMCk7XG4gICAgcmV0dXJuIHJlc2VydmVkLnRlc3QobmFtZSkgPyBuYW1lICsgXCJfXCIgOiBuYW1lO1xufVxuZnVuY3Rpb24gaXNQcmltaXRpdmUodGhpbmcpIHtcbiAgICByZXR1cm4gT2JqZWN0KHRoaW5nKSAhPT0gdGhpbmc7XG59XG5mdW5jdGlvbiBzdHJpbmdpZnlQcmltaXRpdmUodGhpbmcpIHtcbiAgICBpZiAodHlwZW9mIHRoaW5nID09PSAnc3RyaW5nJylcbiAgICAgICAgcmV0dXJuIHN0cmluZ2lmeVN0cmluZyh0aGluZyk7XG4gICAgaWYgKHRoaW5nID09PSB2b2lkIDApXG4gICAgICAgIHJldHVybiAndm9pZCAwJztcbiAgICBpZiAodGhpbmcgPT09IDAgJiYgMSAvIHRoaW5nIDwgMClcbiAgICAgICAgcmV0dXJuICctMCc7XG4gICAgdmFyIHN0ciA9IFN0cmluZyh0aGluZyk7XG4gICAgaWYgKHR5cGVvZiB0aGluZyA9PT0gJ251bWJlcicpXG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvXigtKT8wXFwuLywgJyQxLicpO1xuICAgIHJldHVybiBzdHI7XG59XG5mdW5jdGlvbiBnZXRUeXBlKHRoaW5nKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGluZykuc2xpY2UoOCwgLTEpO1xufVxuZnVuY3Rpb24gZXNjYXBlVW5zYWZlQ2hhcihjKSB7XG4gICAgcmV0dXJuIGVzY2FwZWRbY10gfHwgYztcbn1cbmZ1bmN0aW9uIGVzY2FwZVVuc2FmZUNoYXJzKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSh1bnNhZmVDaGFycywgZXNjYXBlVW5zYWZlQ2hhcik7XG59XG5mdW5jdGlvbiBzYWZlS2V5KGtleSkge1xuICAgIHJldHVybiAvXltfJGEtekEtWl1bXyRhLXpBLVowLTldKiQvLnRlc3Qoa2V5KSA/IGtleSA6IGVzY2FwZVVuc2FmZUNoYXJzKEpTT04uc3RyaW5naWZ5KGtleSkpO1xufVxuZnVuY3Rpb24gc2FmZVByb3Aoa2V5KSB7XG4gICAgcmV0dXJuIC9eW18kYS16QS1aXVtfJGEtekEtWjAtOV0qJC8udGVzdChrZXkpID8gXCIuXCIgKyBrZXkgOiBcIltcIiArIGVzY2FwZVVuc2FmZUNoYXJzKEpTT04uc3RyaW5naWZ5KGtleSkpICsgXCJdXCI7XG59XG5mdW5jdGlvbiBzdHJpbmdpZnlTdHJpbmcoc3RyKSB7XG4gICAgdmFyIHJlc3VsdCA9ICdcIic7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGNoYXIgPSBzdHIuY2hhckF0KGkpO1xuICAgICAgICB2YXIgY29kZSA9IGNoYXIuY2hhckNvZGVBdCgwKTtcbiAgICAgICAgaWYgKGNoYXIgPT09ICdcIicpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFxcXFwiJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjaGFyIGluIGVzY2FwZWQpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBlc2NhcGVkW2NoYXJdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNvZGUgPj0gMHhkODAwICYmIGNvZGUgPD0gMHhkZmZmKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHN0ci5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIGJlZ2lubmluZyBvZiBhIFtoaWdoLCBsb3ddIHN1cnJvZ2F0ZSBwYWlyLFxuICAgICAgICAgICAgLy8gYWRkIHRoZSBuZXh0IHR3byBjaGFyYWN0ZXJzLCBvdGhlcndpc2UgZXNjYXBlXG4gICAgICAgICAgICBpZiAoY29kZSA8PSAweGRiZmYgJiYgKG5leHQgPj0gMHhkYzAwICYmIG5leHQgPD0gMHhkZmZmKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjaGFyICsgc3RyWysraV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gXCJcXFxcdVwiICsgY29kZS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBjaGFyO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlc3VsdCArPSAnXCInO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS90bXB2YXIvanNkb20vYmxvYi9hYTg1YjJhYmYwNzc2NmZmN2JmNWMxZjZkYWFmYjM3MjZmMmYyZGI1L2xpYi9qc2RvbS9saXZpbmcvYmxvYi5qc1xuXG4vLyBmaXggZm9yIFwiUmVhZGFibGVcIiBpc24ndCBhIG5hbWVkIGV4cG9ydCBpc3N1ZVxuY29uc3QgUmVhZGFibGUgPSBTdHJlYW0uUmVhZGFibGU7XG5cbmNvbnN0IEJVRkZFUiA9IFN5bWJvbCgnYnVmZmVyJyk7XG5jb25zdCBUWVBFID0gU3ltYm9sKCd0eXBlJyk7XG5cbmNsYXNzIEJsb2Ige1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzW1RZUEVdID0gJyc7XG5cblx0XHRjb25zdCBibG9iUGFydHMgPSBhcmd1bWVudHNbMF07XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IGFyZ3VtZW50c1sxXTtcblxuXHRcdGNvbnN0IGJ1ZmZlcnMgPSBbXTtcblx0XHRsZXQgc2l6ZSA9IDA7XG5cblx0XHRpZiAoYmxvYlBhcnRzKSB7XG5cdFx0XHRjb25zdCBhID0gYmxvYlBhcnRzO1xuXHRcdFx0Y29uc3QgbGVuZ3RoID0gTnVtYmVyKGEubGVuZ3RoKTtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc3QgZWxlbWVudCA9IGFbaV07XG5cdFx0XHRcdGxldCBidWZmZXI7XG5cdFx0XHRcdGlmIChlbGVtZW50IGluc3RhbmNlb2YgQnVmZmVyKSB7XG5cdFx0XHRcdFx0YnVmZmVyID0gZWxlbWVudDtcblx0XHRcdFx0fSBlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoZWxlbWVudCkpIHtcblx0XHRcdFx0XHRidWZmZXIgPSBCdWZmZXIuZnJvbShlbGVtZW50LmJ1ZmZlciwgZWxlbWVudC5ieXRlT2Zmc2V0LCBlbGVtZW50LmJ5dGVMZW5ndGgpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuXHRcdFx0XHRcdGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGVsZW1lbnQpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBCbG9iKSB7XG5cdFx0XHRcdFx0YnVmZmVyID0gZWxlbWVudFtCVUZGRVJdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJyA/IGVsZW1lbnQgOiBTdHJpbmcoZWxlbWVudCkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHNpemUgKz0gYnVmZmVyLmxlbmd0aDtcblx0XHRcdFx0YnVmZmVycy5wdXNoKGJ1ZmZlcik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpc1tCVUZGRVJdID0gQnVmZmVyLmNvbmNhdChidWZmZXJzKTtcblxuXHRcdGxldCB0eXBlID0gb3B0aW9ucyAmJiBvcHRpb25zLnR5cGUgIT09IHVuZGVmaW5lZCAmJiBTdHJpbmcob3B0aW9ucy50eXBlKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICh0eXBlICYmICEvW15cXHUwMDIwLVxcdTAwN0VdLy50ZXN0KHR5cGUpKSB7XG5cdFx0XHR0aGlzW1RZUEVdID0gdHlwZTtcblx0XHR9XG5cdH1cblx0Z2V0IHNpemUoKSB7XG5cdFx0cmV0dXJuIHRoaXNbQlVGRkVSXS5sZW5ndGg7XG5cdH1cblx0Z2V0IHR5cGUoKSB7XG5cdFx0cmV0dXJuIHRoaXNbVFlQRV07XG5cdH1cblx0dGV4dCgpIHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXNbQlVGRkVSXS50b1N0cmluZygpKTtcblx0fVxuXHRhcnJheUJ1ZmZlcigpIHtcblx0XHRjb25zdCBidWYgPSB0aGlzW0JVRkZFUl07XG5cdFx0Y29uc3QgYWIgPSBidWYuYnVmZmVyLnNsaWNlKGJ1Zi5ieXRlT2Zmc2V0LCBidWYuYnl0ZU9mZnNldCArIGJ1Zi5ieXRlTGVuZ3RoKTtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFiKTtcblx0fVxuXHRzdHJlYW0oKSB7XG5cdFx0Y29uc3QgcmVhZGFibGUgPSBuZXcgUmVhZGFibGUoKTtcblx0XHRyZWFkYWJsZS5fcmVhZCA9IGZ1bmN0aW9uICgpIHt9O1xuXHRcdHJlYWRhYmxlLnB1c2godGhpc1tCVUZGRVJdKTtcblx0XHRyZWFkYWJsZS5wdXNoKG51bGwpO1xuXHRcdHJldHVybiByZWFkYWJsZTtcblx0fVxuXHR0b1N0cmluZygpIHtcblx0XHRyZXR1cm4gJ1tvYmplY3QgQmxvYl0nO1xuXHR9XG5cdHNsaWNlKCkge1xuXHRcdGNvbnN0IHNpemUgPSB0aGlzLnNpemU7XG5cblx0XHRjb25zdCBzdGFydCA9IGFyZ3VtZW50c1swXTtcblx0XHRjb25zdCBlbmQgPSBhcmd1bWVudHNbMV07XG5cdFx0bGV0IHJlbGF0aXZlU3RhcnQsIHJlbGF0aXZlRW5kO1xuXHRcdGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZWxhdGl2ZVN0YXJ0ID0gMDtcblx0XHR9IGVsc2UgaWYgKHN0YXJ0IDwgMCkge1xuXHRcdFx0cmVsYXRpdmVTdGFydCA9IE1hdGgubWF4KHNpemUgKyBzdGFydCwgMCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlbGF0aXZlU3RhcnQgPSBNYXRoLm1pbihzdGFydCwgc2l6ZSk7XG5cdFx0fVxuXHRcdGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmVsYXRpdmVFbmQgPSBzaXplO1xuXHRcdH0gZWxzZSBpZiAoZW5kIDwgMCkge1xuXHRcdFx0cmVsYXRpdmVFbmQgPSBNYXRoLm1heChzaXplICsgZW5kLCAwKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVsYXRpdmVFbmQgPSBNYXRoLm1pbihlbmQsIHNpemUpO1xuXHRcdH1cblx0XHRjb25zdCBzcGFuID0gTWF0aC5tYXgocmVsYXRpdmVFbmQgLSByZWxhdGl2ZVN0YXJ0LCAwKTtcblxuXHRcdGNvbnN0IGJ1ZmZlciA9IHRoaXNbQlVGRkVSXTtcblx0XHRjb25zdCBzbGljZWRCdWZmZXIgPSBidWZmZXIuc2xpY2UocmVsYXRpdmVTdGFydCwgcmVsYXRpdmVTdGFydCArIHNwYW4pO1xuXHRcdGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbXSwgeyB0eXBlOiBhcmd1bWVudHNbMl0gfSk7XG5cdFx0YmxvYltCVUZGRVJdID0gc2xpY2VkQnVmZmVyO1xuXHRcdHJldHVybiBibG9iO1xuXHR9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKEJsb2IucHJvdG90eXBlLCB7XG5cdHNpemU6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHR0eXBlOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0c2xpY2U6IHsgZW51bWVyYWJsZTogdHJ1ZSB9XG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJsb2IucHJvdG90eXBlLCBTeW1ib2wudG9TdHJpbmdUYWcsIHtcblx0dmFsdWU6ICdCbG9iJyxcblx0d3JpdGFibGU6IGZhbHNlLFxuXHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0Y29uZmlndXJhYmxlOiB0cnVlXG59KTtcblxuLyoqXG4gKiBmZXRjaC1lcnJvci5qc1xuICpcbiAqIEZldGNoRXJyb3IgaW50ZXJmYWNlIGZvciBvcGVyYXRpb25hbCBlcnJvcnNcbiAqL1xuXG4vKipcbiAqIENyZWF0ZSBGZXRjaEVycm9yIGluc3RhbmNlXG4gKlxuICogQHBhcmFtICAgU3RyaW5nICAgICAgbWVzc2FnZSAgICAgIEVycm9yIG1lc3NhZ2UgZm9yIGh1bWFuXG4gKiBAcGFyYW0gICBTdHJpbmcgICAgICB0eXBlICAgICAgICAgRXJyb3IgdHlwZSBmb3IgbWFjaGluZVxuICogQHBhcmFtICAgU3RyaW5nICAgICAgc3lzdGVtRXJyb3IgIEZvciBOb2RlLmpzIHN5c3RlbSBlcnJvclxuICogQHJldHVybiAgRmV0Y2hFcnJvclxuICovXG5mdW5jdGlvbiBGZXRjaEVycm9yKG1lc3NhZ2UsIHR5cGUsIHN5c3RlbUVycm9yKSB7XG4gIEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgdGhpcy50eXBlID0gdHlwZTtcblxuICAvLyB3aGVuIGVyci50eXBlIGlzIGBzeXN0ZW1gLCBlcnIuY29kZSBjb250YWlucyBzeXN0ZW0gZXJyb3IgY29kZVxuICBpZiAoc3lzdGVtRXJyb3IpIHtcbiAgICB0aGlzLmNvZGUgPSB0aGlzLmVycm5vID0gc3lzdGVtRXJyb3IuY29kZTtcbiAgfVxuXG4gIC8vIGhpZGUgY3VzdG9tIGVycm9yIGltcGxlbWVudGF0aW9uIGRldGFpbHMgZnJvbSBlbmQtdXNlcnNcbiAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG59XG5cbkZldGNoRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuRmV0Y2hFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGZXRjaEVycm9yO1xuRmV0Y2hFcnJvci5wcm90b3R5cGUubmFtZSA9ICdGZXRjaEVycm9yJztcblxubGV0IGNvbnZlcnQ7XG50cnkge1xuXHRjb252ZXJ0ID0gcmVxdWlyZSgnZW5jb2RpbmcnKS5jb252ZXJ0O1xufSBjYXRjaCAoZSkge31cblxuY29uc3QgSU5URVJOQUxTID0gU3ltYm9sKCdCb2R5IGludGVybmFscycpO1xuXG4vLyBmaXggYW4gaXNzdWUgd2hlcmUgXCJQYXNzVGhyb3VnaFwiIGlzbid0IGEgbmFtZWQgZXhwb3J0IGZvciBub2RlIDwxMFxuY29uc3QgUGFzc1Rocm91Z2ggPSBTdHJlYW0uUGFzc1Rocm91Z2g7XG5cbi8qKlxuICogQm9keSBtaXhpblxuICpcbiAqIFJlZjogaHR0cHM6Ly9mZXRjaC5zcGVjLndoYXR3Zy5vcmcvI2JvZHlcbiAqXG4gKiBAcGFyYW0gICBTdHJlYW0gIGJvZHkgIFJlYWRhYmxlIHN0cmVhbVxuICogQHBhcmFtICAgT2JqZWN0ICBvcHRzICBSZXNwb25zZSBvcHRpb25zXG4gKiBAcmV0dXJuICBWb2lkXG4gKi9cbmZ1bmN0aW9uIEJvZHkoYm9keSkge1xuXHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdHZhciBfcmVmID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fSxcblx0ICAgIF9yZWYkc2l6ZSA9IF9yZWYuc2l6ZTtcblxuXHRsZXQgc2l6ZSA9IF9yZWYkc2l6ZSA9PT0gdW5kZWZpbmVkID8gMCA6IF9yZWYkc2l6ZTtcblx0dmFyIF9yZWYkdGltZW91dCA9IF9yZWYudGltZW91dDtcblx0bGV0IHRpbWVvdXQgPSBfcmVmJHRpbWVvdXQgPT09IHVuZGVmaW5lZCA/IDAgOiBfcmVmJHRpbWVvdXQ7XG5cblx0aWYgKGJvZHkgPT0gbnVsbCkge1xuXHRcdC8vIGJvZHkgaXMgdW5kZWZpbmVkIG9yIG51bGxcblx0XHRib2R5ID0gbnVsbDtcblx0fSBlbHNlIGlmIChpc1VSTFNlYXJjaFBhcmFtcyhib2R5KSkge1xuXHRcdC8vIGJvZHkgaXMgYSBVUkxTZWFyY2hQYXJhbXNcblx0XHRib2R5ID0gQnVmZmVyLmZyb20oYm9keS50b1N0cmluZygpKTtcblx0fSBlbHNlIGlmIChpc0Jsb2IoYm9keSkpIDsgZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGJvZHkpKSA7IGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChib2R5KSA9PT0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJykge1xuXHRcdC8vIGJvZHkgaXMgQXJyYXlCdWZmZXJcblx0XHRib2R5ID0gQnVmZmVyLmZyb20oYm9keSk7XG5cdH0gZWxzZSBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBBcnJheUJ1ZmZlclZpZXdcblx0XHRib2R5ID0gQnVmZmVyLmZyb20oYm9keS5idWZmZXIsIGJvZHkuYnl0ZU9mZnNldCwgYm9keS5ieXRlTGVuZ3RoKTtcblx0fSBlbHNlIGlmIChib2R5IGluc3RhbmNlb2YgU3RyZWFtKSA7IGVsc2Uge1xuXHRcdC8vIG5vbmUgb2YgdGhlIGFib3ZlXG5cdFx0Ly8gY29lcmNlIHRvIHN0cmluZyB0aGVuIGJ1ZmZlclxuXHRcdGJvZHkgPSBCdWZmZXIuZnJvbShTdHJpbmcoYm9keSkpO1xuXHR9XG5cdHRoaXNbSU5URVJOQUxTXSA9IHtcblx0XHRib2R5LFxuXHRcdGRpc3R1cmJlZDogZmFsc2UsXG5cdFx0ZXJyb3I6IG51bGxcblx0fTtcblx0dGhpcy5zaXplID0gc2l6ZTtcblx0dGhpcy50aW1lb3V0ID0gdGltZW91dDtcblxuXHRpZiAoYm9keSBpbnN0YW5jZW9mIFN0cmVhbSkge1xuXHRcdGJvZHkub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0Y29uc3QgZXJyb3IgPSBlcnIubmFtZSA9PT0gJ0Fib3J0RXJyb3InID8gZXJyIDogbmV3IEZldGNoRXJyb3IoYEludmFsaWQgcmVzcG9uc2UgYm9keSB3aGlsZSB0cnlpbmcgdG8gZmV0Y2ggJHtfdGhpcy51cmx9OiAke2Vyci5tZXNzYWdlfWAsICdzeXN0ZW0nLCBlcnIpO1xuXHRcdFx0X3RoaXNbSU5URVJOQUxTXS5lcnJvciA9IGVycm9yO1xuXHRcdH0pO1xuXHR9XG59XG5cbkJvZHkucHJvdG90eXBlID0ge1xuXHRnZXQgYm9keSgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFNdLmJvZHk7XG5cdH0sXG5cblx0Z2V0IGJvZHlVc2VkKCkge1xuXHRcdHJldHVybiB0aGlzW0lOVEVSTkFMU10uZGlzdHVyYmVkO1xuXHR9LFxuXG5cdC8qKlxuICAqIERlY29kZSByZXNwb25zZSBhcyBBcnJheUJ1ZmZlclxuICAqXG4gICogQHJldHVybiAgUHJvbWlzZVxuICAqL1xuXHRhcnJheUJ1ZmZlcigpIHtcblx0XHRyZXR1cm4gY29uc3VtZUJvZHkuY2FsbCh0aGlzKS50aGVuKGZ1bmN0aW9uIChidWYpIHtcblx0XHRcdHJldHVybiBidWYuYnVmZmVyLnNsaWNlKGJ1Zi5ieXRlT2Zmc2V0LCBidWYuYnl0ZU9mZnNldCArIGJ1Zi5ieXRlTGVuZ3RoKTtcblx0XHR9KTtcblx0fSxcblxuXHQvKipcbiAgKiBSZXR1cm4gcmF3IHJlc3BvbnNlIGFzIEJsb2JcbiAgKlxuICAqIEByZXR1cm4gUHJvbWlzZVxuICAqL1xuXHRibG9iKCkge1xuXHRcdGxldCBjdCA9IHRoaXMuaGVhZGVycyAmJiB0aGlzLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSB8fCAnJztcblx0XHRyZXR1cm4gY29uc3VtZUJvZHkuY2FsbCh0aGlzKS50aGVuKGZ1bmN0aW9uIChidWYpIHtcblx0XHRcdHJldHVybiBPYmplY3QuYXNzaWduKFxuXHRcdFx0Ly8gUHJldmVudCBjb3B5aW5nXG5cdFx0XHRuZXcgQmxvYihbXSwge1xuXHRcdFx0XHR0eXBlOiBjdC50b0xvd2VyQ2FzZSgpXG5cdFx0XHR9KSwge1xuXHRcdFx0XHRbQlVGRkVSXTogYnVmXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSxcblxuXHQvKipcbiAgKiBEZWNvZGUgcmVzcG9uc2UgYXMganNvblxuICAqXG4gICogQHJldHVybiAgUHJvbWlzZVxuICAqL1xuXHRqc29uKCkge1xuXHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0cmV0dXJuIGNvbnN1bWVCb2R5LmNhbGwodGhpcykudGhlbihmdW5jdGlvbiAoYnVmZmVyKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShidWZmZXIudG9TdHJpbmcoKSk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0cmV0dXJuIEJvZHkuUHJvbWlzZS5yZWplY3QobmV3IEZldGNoRXJyb3IoYGludmFsaWQganNvbiByZXNwb25zZSBib2R5IGF0ICR7X3RoaXMyLnVybH0gcmVhc29uOiAke2Vyci5tZXNzYWdlfWAsICdpbnZhbGlkLWpzb24nKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG4gICogRGVjb2RlIHJlc3BvbnNlIGFzIHRleHRcbiAgKlxuICAqIEByZXR1cm4gIFByb21pc2VcbiAgKi9cblx0dGV4dCgpIHtcblx0XHRyZXR1cm4gY29uc3VtZUJvZHkuY2FsbCh0aGlzKS50aGVuKGZ1bmN0aW9uIChidWZmZXIpIHtcblx0XHRcdHJldHVybiBidWZmZXIudG9TdHJpbmcoKTtcblx0XHR9KTtcblx0fSxcblxuXHQvKipcbiAgKiBEZWNvZGUgcmVzcG9uc2UgYXMgYnVmZmVyIChub24tc3BlYyBhcGkpXG4gICpcbiAgKiBAcmV0dXJuICBQcm9taXNlXG4gICovXG5cdGJ1ZmZlcigpIHtcblx0XHRyZXR1cm4gY29uc3VtZUJvZHkuY2FsbCh0aGlzKTtcblx0fSxcblxuXHQvKipcbiAgKiBEZWNvZGUgcmVzcG9uc2UgYXMgdGV4dCwgd2hpbGUgYXV0b21hdGljYWxseSBkZXRlY3RpbmcgdGhlIGVuY29kaW5nIGFuZFxuICAqIHRyeWluZyB0byBkZWNvZGUgdG8gVVRGLTggKG5vbi1zcGVjIGFwaSlcbiAgKlxuICAqIEByZXR1cm4gIFByb21pc2VcbiAgKi9cblx0dGV4dENvbnZlcnRlZCgpIHtcblx0XHR2YXIgX3RoaXMzID0gdGhpcztcblxuXHRcdHJldHVybiBjb25zdW1lQm9keS5jYWxsKHRoaXMpLnRoZW4oZnVuY3Rpb24gKGJ1ZmZlcikge1xuXHRcdFx0cmV0dXJuIGNvbnZlcnRCb2R5KGJ1ZmZlciwgX3RoaXMzLmhlYWRlcnMpO1xuXHRcdH0pO1xuXHR9XG59O1xuXG4vLyBJbiBicm93c2VycywgYWxsIHByb3BlcnRpZXMgYXJlIGVudW1lcmFibGUuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhCb2R5LnByb3RvdHlwZSwge1xuXHRib2R5OiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0Ym9keVVzZWQ6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRhcnJheUJ1ZmZlcjogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdGJsb2I6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRqc29uOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0dGV4dDogeyBlbnVtZXJhYmxlOiB0cnVlIH1cbn0pO1xuXG5Cb2R5Lm1peEluID0gZnVuY3Rpb24gKHByb3RvKSB7XG5cdGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhCb2R5LnByb3RvdHlwZSkpIHtcblx0XHQvLyBpc3RhbmJ1bCBpZ25vcmUgZWxzZTogZnV0dXJlIHByb29mXG5cdFx0aWYgKCEobmFtZSBpbiBwcm90bykpIHtcblx0XHRcdGNvbnN0IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEJvZHkucHJvdG90eXBlLCBuYW1lKTtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgbmFtZSwgZGVzYyk7XG5cdFx0fVxuXHR9XG59O1xuXG4vKipcbiAqIENvbnN1bWUgYW5kIGNvbnZlcnQgYW4gZW50aXJlIEJvZHkgdG8gYSBCdWZmZXIuXG4gKlxuICogUmVmOiBodHRwczovL2ZldGNoLnNwZWMud2hhdHdnLm9yZy8jY29uY2VwdC1ib2R5LWNvbnN1bWUtYm9keVxuICpcbiAqIEByZXR1cm4gIFByb21pc2VcbiAqL1xuZnVuY3Rpb24gY29uc3VtZUJvZHkoKSB7XG5cdHZhciBfdGhpczQgPSB0aGlzO1xuXG5cdGlmICh0aGlzW0lOVEVSTkFMU10uZGlzdHVyYmVkKSB7XG5cdFx0cmV0dXJuIEJvZHkuUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcihgYm9keSB1c2VkIGFscmVhZHkgZm9yOiAke3RoaXMudXJsfWApKTtcblx0fVxuXG5cdHRoaXNbSU5URVJOQUxTXS5kaXN0dXJiZWQgPSB0cnVlO1xuXG5cdGlmICh0aGlzW0lOVEVSTkFMU10uZXJyb3IpIHtcblx0XHRyZXR1cm4gQm9keS5Qcm9taXNlLnJlamVjdCh0aGlzW0lOVEVSTkFMU10uZXJyb3IpO1xuXHR9XG5cblx0bGV0IGJvZHkgPSB0aGlzLmJvZHk7XG5cblx0Ly8gYm9keSBpcyBudWxsXG5cdGlmIChib2R5ID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIEJvZHkuUHJvbWlzZS5yZXNvbHZlKEJ1ZmZlci5hbGxvYygwKSk7XG5cdH1cblxuXHQvLyBib2R5IGlzIGJsb2Jcblx0aWYgKGlzQmxvYihib2R5KSkge1xuXHRcdGJvZHkgPSBib2R5LnN0cmVhbSgpO1xuXHR9XG5cblx0Ly8gYm9keSBpcyBidWZmZXJcblx0aWYgKEJ1ZmZlci5pc0J1ZmZlcihib2R5KSkge1xuXHRcdHJldHVybiBCb2R5LlByb21pc2UucmVzb2x2ZShib2R5KTtcblx0fVxuXG5cdC8vIGlzdGFuYnVsIGlnbm9yZSBpZjogc2hvdWxkIG5ldmVyIGhhcHBlblxuXHRpZiAoIShib2R5IGluc3RhbmNlb2YgU3RyZWFtKSkge1xuXHRcdHJldHVybiBCb2R5LlByb21pc2UucmVzb2x2ZShCdWZmZXIuYWxsb2MoMCkpO1xuXHR9XG5cblx0Ly8gYm9keSBpcyBzdHJlYW1cblx0Ly8gZ2V0IHJlYWR5IHRvIGFjdHVhbGx5IGNvbnN1bWUgdGhlIGJvZHlcblx0bGV0IGFjY3VtID0gW107XG5cdGxldCBhY2N1bUJ5dGVzID0gMDtcblx0bGV0IGFib3J0ID0gZmFsc2U7XG5cblx0cmV0dXJuIG5ldyBCb2R5LlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdGxldCByZXNUaW1lb3V0O1xuXG5cdFx0Ly8gYWxsb3cgdGltZW91dCBvbiBzbG93IHJlc3BvbnNlIGJvZHlcblx0XHRpZiAoX3RoaXM0LnRpbWVvdXQpIHtcblx0XHRcdHJlc1RpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0YWJvcnQgPSB0cnVlO1xuXHRcdFx0XHRyZWplY3QobmV3IEZldGNoRXJyb3IoYFJlc3BvbnNlIHRpbWVvdXQgd2hpbGUgdHJ5aW5nIHRvIGZldGNoICR7X3RoaXM0LnVybH0gKG92ZXIgJHtfdGhpczQudGltZW91dH1tcylgLCAnYm9keS10aW1lb3V0JykpO1xuXHRcdFx0fSwgX3RoaXM0LnRpbWVvdXQpO1xuXHRcdH1cblxuXHRcdC8vIGhhbmRsZSBzdHJlYW0gZXJyb3JzXG5cdFx0Ym9keS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRpZiAoZXJyLm5hbWUgPT09ICdBYm9ydEVycm9yJykge1xuXHRcdFx0XHQvLyBpZiB0aGUgcmVxdWVzdCB3YXMgYWJvcnRlZCwgcmVqZWN0IHdpdGggdGhpcyBFcnJvclxuXHRcdFx0XHRhYm9ydCA9IHRydWU7XG5cdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gb3RoZXIgZXJyb3JzLCBzdWNoIGFzIGluY29ycmVjdCBjb250ZW50LWVuY29kaW5nXG5cdFx0XHRcdHJlamVjdChuZXcgRmV0Y2hFcnJvcihgSW52YWxpZCByZXNwb25zZSBib2R5IHdoaWxlIHRyeWluZyB0byBmZXRjaCAke190aGlzNC51cmx9OiAke2Vyci5tZXNzYWdlfWAsICdzeXN0ZW0nLCBlcnIpKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGJvZHkub24oJ2RhdGEnLCBmdW5jdGlvbiAoY2h1bmspIHtcblx0XHRcdGlmIChhYm9ydCB8fCBjaHVuayA9PT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfdGhpczQuc2l6ZSAmJiBhY2N1bUJ5dGVzICsgY2h1bmsubGVuZ3RoID4gX3RoaXM0LnNpemUpIHtcblx0XHRcdFx0YWJvcnQgPSB0cnVlO1xuXHRcdFx0XHRyZWplY3QobmV3IEZldGNoRXJyb3IoYGNvbnRlbnQgc2l6ZSBhdCAke190aGlzNC51cmx9IG92ZXIgbGltaXQ6ICR7X3RoaXM0LnNpemV9YCwgJ21heC1zaXplJykpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGFjY3VtQnl0ZXMgKz0gY2h1bmsubGVuZ3RoO1xuXHRcdFx0YWNjdW0ucHVzaChjaHVuayk7XG5cdFx0fSk7XG5cblx0XHRib2R5Lm9uKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoYWJvcnQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjbGVhclRpbWVvdXQocmVzVGltZW91dCk7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJlc29sdmUoQnVmZmVyLmNvbmNhdChhY2N1bSwgYWNjdW1CeXRlcykpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdC8vIGhhbmRsZSBzdHJlYW1zIHRoYXQgaGF2ZSBhY2N1bXVsYXRlZCB0b28gbXVjaCBkYXRhIChpc3N1ZSAjNDE0KVxuXHRcdFx0XHRyZWplY3QobmV3IEZldGNoRXJyb3IoYENvdWxkIG5vdCBjcmVhdGUgQnVmZmVyIGZyb20gcmVzcG9uc2UgYm9keSBmb3IgJHtfdGhpczQudXJsfTogJHtlcnIubWVzc2FnZX1gLCAnc3lzdGVtJywgZXJyKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xufVxuXG4vKipcbiAqIERldGVjdCBidWZmZXIgZW5jb2RpbmcgYW5kIGNvbnZlcnQgdG8gdGFyZ2V0IGVuY29kaW5nXG4gKiByZWY6IGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTEvV0QtaHRtbDUtMjAxMTAxMTMvcGFyc2luZy5odG1sI2RldGVybWluaW5nLXRoZS1jaGFyYWN0ZXItZW5jb2RpbmdcbiAqXG4gKiBAcGFyYW0gICBCdWZmZXIgIGJ1ZmZlciAgICBJbmNvbWluZyBidWZmZXJcbiAqIEBwYXJhbSAgIFN0cmluZyAgZW5jb2RpbmcgIFRhcmdldCBlbmNvZGluZ1xuICogQHJldHVybiAgU3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRCb2R5KGJ1ZmZlciwgaGVhZGVycykge1xuXHRpZiAodHlwZW9mIGNvbnZlcnQgIT09ICdmdW5jdGlvbicpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwYWNrYWdlIGBlbmNvZGluZ2AgbXVzdCBiZSBpbnN0YWxsZWQgdG8gdXNlIHRoZSB0ZXh0Q29udmVydGVkKCkgZnVuY3Rpb24nKTtcblx0fVxuXG5cdGNvbnN0IGN0ID0gaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpO1xuXHRsZXQgY2hhcnNldCA9ICd1dGYtOCc7XG5cdGxldCByZXMsIHN0cjtcblxuXHQvLyBoZWFkZXJcblx0aWYgKGN0KSB7XG5cdFx0cmVzID0gL2NoYXJzZXQ9KFteO10qKS9pLmV4ZWMoY3QpO1xuXHR9XG5cblx0Ly8gbm8gY2hhcnNldCBpbiBjb250ZW50IHR5cGUsIHBlZWsgYXQgcmVzcG9uc2UgYm9keSBmb3IgYXQgbW9zdCAxMDI0IGJ5dGVzXG5cdHN0ciA9IGJ1ZmZlci5zbGljZSgwLCAxMDI0KS50b1N0cmluZygpO1xuXG5cdC8vIGh0bWw1XG5cdGlmICghcmVzICYmIHN0cikge1xuXHRcdHJlcyA9IC88bWV0YS4rP2NoYXJzZXQ9KFsnXCJdKSguKz8pXFwxL2kuZXhlYyhzdHIpO1xuXHR9XG5cblx0Ly8gaHRtbDRcblx0aWYgKCFyZXMgJiYgc3RyKSB7XG5cdFx0cmVzID0gLzxtZXRhW1xcc10rP2h0dHAtZXF1aXY9KFsnXCJdKWNvbnRlbnQtdHlwZVxcMVtcXHNdKz9jb250ZW50PShbJ1wiXSkoLis/KVxcMi9pLmV4ZWMoc3RyKTtcblxuXHRcdGlmIChyZXMpIHtcblx0XHRcdHJlcyA9IC9jaGFyc2V0PSguKikvaS5leGVjKHJlcy5wb3AoKSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8geG1sXG5cdGlmICghcmVzICYmIHN0cikge1xuXHRcdHJlcyA9IC88XFw/eG1sLis/ZW5jb2Rpbmc9KFsnXCJdKSguKz8pXFwxL2kuZXhlYyhzdHIpO1xuXHR9XG5cblx0Ly8gZm91bmQgY2hhcnNldFxuXHRpZiAocmVzKSB7XG5cdFx0Y2hhcnNldCA9IHJlcy5wb3AoKTtcblxuXHRcdC8vIHByZXZlbnQgZGVjb2RlIGlzc3VlcyB3aGVuIHNpdGVzIHVzZSBpbmNvcnJlY3QgZW5jb2Rpbmdcblx0XHQvLyByZWY6IGh0dHBzOi8vaHNpdm9uZW4uZmkvZW5jb2RpbmctbWVudS9cblx0XHRpZiAoY2hhcnNldCA9PT0gJ2diMjMxMicgfHwgY2hhcnNldCA9PT0gJ2diaycpIHtcblx0XHRcdGNoYXJzZXQgPSAnZ2IxODAzMCc7XG5cdFx0fVxuXHR9XG5cblx0Ly8gdHVybiByYXcgYnVmZmVycyBpbnRvIGEgc2luZ2xlIHV0Zi04IGJ1ZmZlclxuXHRyZXR1cm4gY29udmVydChidWZmZXIsICdVVEYtOCcsIGNoYXJzZXQpLnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICogRGV0ZWN0IGEgVVJMU2VhcmNoUGFyYW1zIG9iamVjdFxuICogcmVmOiBodHRwczovL2dpdGh1Yi5jb20vYml0aW5uL25vZGUtZmV0Y2gvaXNzdWVzLzI5NiNpc3N1ZWNvbW1lbnQtMzA3NTk4MTQzXG4gKlxuICogQHBhcmFtICAgT2JqZWN0ICBvYmogICAgIE9iamVjdCB0byBkZXRlY3QgYnkgdHlwZSBvciBicmFuZFxuICogQHJldHVybiAgU3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGlzVVJMU2VhcmNoUGFyYW1zKG9iaikge1xuXHQvLyBEdWNrLXR5cGluZyBhcyBhIG5lY2Vzc2FyeSBjb25kaXRpb24uXG5cdGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCB0eXBlb2Ygb2JqLmFwcGVuZCAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLmRlbGV0ZSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLmdldCAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLmdldEFsbCAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLmhhcyAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2Ygb2JqLnNldCAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIEJyYW5kLWNoZWNraW5nIGFuZCBtb3JlIGR1Y2stdHlwaW5nIGFzIG9wdGlvbmFsIGNvbmRpdGlvbi5cblx0cmV0dXJuIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnVVJMU2VhcmNoUGFyYW1zJyB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgVVJMU2VhcmNoUGFyYW1zXScgfHwgdHlwZW9mIG9iai5zb3J0ID09PSAnZnVuY3Rpb24nO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGEgVzNDIGBCbG9iYCBvYmplY3QgKHdoaWNoIGBGaWxlYCBpbmhlcml0cyBmcm9tKVxuICogQHBhcmFtICB7Kn0gb2JqXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc0Jsb2Iob2JqKSB7XG5cdHJldHVybiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqLmFycmF5QnVmZmVyID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBvYmoudHlwZSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIG9iai5zdHJlYW0gPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIG9iai5jb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdzdHJpbmcnICYmIC9eKEJsb2J8RmlsZSkkLy50ZXN0KG9iai5jb25zdHJ1Y3Rvci5uYW1lKSAmJiAvXihCbG9ifEZpbGUpJC8udGVzdChvYmpbU3ltYm9sLnRvU3RyaW5nVGFnXSk7XG59XG5cbi8qKlxuICogQ2xvbmUgYm9keSBnaXZlbiBSZXMvUmVxIGluc3RhbmNlXG4gKlxuICogQHBhcmFtICAgTWl4ZWQgIGluc3RhbmNlICBSZXNwb25zZSBvciBSZXF1ZXN0IGluc3RhbmNlXG4gKiBAcmV0dXJuICBNaXhlZFxuICovXG5mdW5jdGlvbiBjbG9uZShpbnN0YW5jZSkge1xuXHRsZXQgcDEsIHAyO1xuXHRsZXQgYm9keSA9IGluc3RhbmNlLmJvZHk7XG5cblx0Ly8gZG9uJ3QgYWxsb3cgY2xvbmluZyBhIHVzZWQgYm9keVxuXHRpZiAoaW5zdGFuY2UuYm9keVVzZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBjbG9uZSBib2R5IGFmdGVyIGl0IGlzIHVzZWQnKTtcblx0fVxuXG5cdC8vIGNoZWNrIHRoYXQgYm9keSBpcyBhIHN0cmVhbSBhbmQgbm90IGZvcm0tZGF0YSBvYmplY3Rcblx0Ly8gbm90ZTogd2UgY2FuJ3QgY2xvbmUgdGhlIGZvcm0tZGF0YSBvYmplY3Qgd2l0aG91dCBoYXZpbmcgaXQgYXMgYSBkZXBlbmRlbmN5XG5cdGlmIChib2R5IGluc3RhbmNlb2YgU3RyZWFtICYmIHR5cGVvZiBib2R5LmdldEJvdW5kYXJ5ICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0Ly8gdGVlIGluc3RhbmNlIGJvZHlcblx0XHRwMSA9IG5ldyBQYXNzVGhyb3VnaCgpO1xuXHRcdHAyID0gbmV3IFBhc3NUaHJvdWdoKCk7XG5cdFx0Ym9keS5waXBlKHAxKTtcblx0XHRib2R5LnBpcGUocDIpO1xuXHRcdC8vIHNldCBpbnN0YW5jZSBib2R5IHRvIHRlZWQgYm9keSBhbmQgcmV0dXJuIHRoZSBvdGhlciB0ZWVkIGJvZHlcblx0XHRpbnN0YW5jZVtJTlRFUk5BTFNdLmJvZHkgPSBwMTtcblx0XHRib2R5ID0gcDI7XG5cdH1cblxuXHRyZXR1cm4gYm9keTtcbn1cblxuLyoqXG4gKiBQZXJmb3JtcyB0aGUgb3BlcmF0aW9uIFwiZXh0cmFjdCBhIGBDb250ZW50LVR5cGVgIHZhbHVlIGZyb20gfG9iamVjdHxcIiBhc1xuICogc3BlY2lmaWVkIGluIHRoZSBzcGVjaWZpY2F0aW9uOlxuICogaHR0cHM6Ly9mZXRjaC5zcGVjLndoYXR3Zy5vcmcvI2NvbmNlcHQtYm9keWluaXQtZXh0cmFjdFxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYXNzdW1lcyB0aGF0IGluc3RhbmNlLmJvZHkgaXMgcHJlc2VudC5cbiAqXG4gKiBAcGFyYW0gICBNaXhlZCAgaW5zdGFuY2UgIEFueSBvcHRpb25zLmJvZHkgaW5wdXRcbiAqL1xuZnVuY3Rpb24gZXh0cmFjdENvbnRlbnRUeXBlKGJvZHkpIHtcblx0aWYgKGJvZHkgPT09IG51bGwpIHtcblx0XHQvLyBib2R5IGlzIG51bGxcblx0XHRyZXR1cm4gbnVsbDtcblx0fSBlbHNlIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcblx0XHQvLyBib2R5IGlzIHN0cmluZ1xuXHRcdHJldHVybiAndGV4dC9wbGFpbjtjaGFyc2V0PVVURi04Jztcblx0fSBlbHNlIGlmIChpc1VSTFNlYXJjaFBhcmFtcyhib2R5KSkge1xuXHRcdC8vIGJvZHkgaXMgYSBVUkxTZWFyY2hQYXJhbXNcblx0XHRyZXR1cm4gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04Jztcblx0fSBlbHNlIGlmIChpc0Jsb2IoYm9keSkpIHtcblx0XHQvLyBib2R5IGlzIGJsb2Jcblx0XHRyZXR1cm4gYm9keS50eXBlIHx8IG51bGw7XG5cdH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBidWZmZXJcblx0XHRyZXR1cm4gbnVsbDtcblx0fSBlbHNlIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYm9keSkgPT09ICdbb2JqZWN0IEFycmF5QnVmZmVyXScpIHtcblx0XHQvLyBib2R5IGlzIEFycmF5QnVmZmVyXG5cdFx0cmV0dXJuIG51bGw7XG5cdH0gZWxzZSBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBBcnJheUJ1ZmZlclZpZXdcblx0XHRyZXR1cm4gbnVsbDtcblx0fSBlbHNlIGlmICh0eXBlb2YgYm9keS5nZXRCb3VuZGFyeSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdC8vIGRldGVjdCBmb3JtIGRhdGEgaW5wdXQgZnJvbSBmb3JtLWRhdGEgbW9kdWxlXG5cdFx0cmV0dXJuIGBtdWx0aXBhcnQvZm9ybS1kYXRhO2JvdW5kYXJ5PSR7Ym9keS5nZXRCb3VuZGFyeSgpfWA7XG5cdH0gZWxzZSBpZiAoYm9keSBpbnN0YW5jZW9mIFN0cmVhbSkge1xuXHRcdC8vIGJvZHkgaXMgc3RyZWFtXG5cdFx0Ly8gY2FuJ3QgcmVhbGx5IGRvIG11Y2ggYWJvdXQgdGhpc1xuXHRcdHJldHVybiBudWxsO1xuXHR9IGVsc2Uge1xuXHRcdC8vIEJvZHkgY29uc3RydWN0b3IgZGVmYXVsdHMgb3RoZXIgdGhpbmdzIHRvIHN0cmluZ1xuXHRcdHJldHVybiAndGV4dC9wbGFpbjtjaGFyc2V0PVVURi04Jztcblx0fVxufVxuXG4vKipcbiAqIFRoZSBGZXRjaCBTdGFuZGFyZCB0cmVhdHMgdGhpcyBhcyBpZiBcInRvdGFsIGJ5dGVzXCIgaXMgYSBwcm9wZXJ0eSBvbiB0aGUgYm9keS5cbiAqIEZvciB1cywgd2UgaGF2ZSB0byBleHBsaWNpdGx5IGdldCBpdCB3aXRoIGEgZnVuY3Rpb24uXG4gKlxuICogcmVmOiBodHRwczovL2ZldGNoLnNwZWMud2hhdHdnLm9yZy8jY29uY2VwdC1ib2R5LXRvdGFsLWJ5dGVzXG4gKlxuICogQHBhcmFtICAgQm9keSAgICBpbnN0YW5jZSAgIEluc3RhbmNlIG9mIEJvZHlcbiAqIEByZXR1cm4gIE51bWJlcj8gICAgICAgICAgICBOdW1iZXIgb2YgYnl0ZXMsIG9yIG51bGwgaWYgbm90IHBvc3NpYmxlXG4gKi9cbmZ1bmN0aW9uIGdldFRvdGFsQnl0ZXMoaW5zdGFuY2UpIHtcblx0Y29uc3QgYm9keSA9IGluc3RhbmNlLmJvZHk7XG5cblxuXHRpZiAoYm9keSA9PT0gbnVsbCkge1xuXHRcdC8vIGJvZHkgaXMgbnVsbFxuXHRcdHJldHVybiAwO1xuXHR9IGVsc2UgaWYgKGlzQmxvYihib2R5KSkge1xuXHRcdHJldHVybiBib2R5LnNpemU7XG5cdH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBidWZmZXJcblx0XHRyZXR1cm4gYm9keS5sZW5ndGg7XG5cdH0gZWxzZSBpZiAoYm9keSAmJiB0eXBlb2YgYm9keS5nZXRMZW5ndGhTeW5jID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0Ly8gZGV0ZWN0IGZvcm0gZGF0YSBpbnB1dCBmcm9tIGZvcm0tZGF0YSBtb2R1bGVcblx0XHRpZiAoYm9keS5fbGVuZ3RoUmV0cmlldmVycyAmJiBib2R5Ll9sZW5ndGhSZXRyaWV2ZXJzLmxlbmd0aCA9PSAwIHx8IC8vIDEueFxuXHRcdGJvZHkuaGFzS25vd25MZW5ndGggJiYgYm9keS5oYXNLbm93bkxlbmd0aCgpKSB7XG5cdFx0XHQvLyAyLnhcblx0XHRcdHJldHVybiBib2R5LmdldExlbmd0aFN5bmMoKTtcblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gYm9keSBpcyBzdHJlYW1cblx0XHRyZXR1cm4gbnVsbDtcblx0fVxufVxuXG4vKipcbiAqIFdyaXRlIGEgQm9keSB0byBhIE5vZGUuanMgV3JpdGFibGVTdHJlYW0gKGUuZy4gaHR0cC5SZXF1ZXN0KSBvYmplY3QuXG4gKlxuICogQHBhcmFtICAgQm9keSAgICBpbnN0YW5jZSAgIEluc3RhbmNlIG9mIEJvZHlcbiAqIEByZXR1cm4gIFZvaWRcbiAqL1xuZnVuY3Rpb24gd3JpdGVUb1N0cmVhbShkZXN0LCBpbnN0YW5jZSkge1xuXHRjb25zdCBib2R5ID0gaW5zdGFuY2UuYm9keTtcblxuXG5cdGlmIChib2R5ID09PSBudWxsKSB7XG5cdFx0Ly8gYm9keSBpcyBudWxsXG5cdFx0ZGVzdC5lbmQoKTtcblx0fSBlbHNlIGlmIChpc0Jsb2IoYm9keSkpIHtcblx0XHRib2R5LnN0cmVhbSgpLnBpcGUoZGVzdCk7XG5cdH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGJvZHkpKSB7XG5cdFx0Ly8gYm9keSBpcyBidWZmZXJcblx0XHRkZXN0LndyaXRlKGJvZHkpO1xuXHRcdGRlc3QuZW5kKCk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gYm9keSBpcyBzdHJlYW1cblx0XHRib2R5LnBpcGUoZGVzdCk7XG5cdH1cbn1cblxuLy8gZXhwb3NlIFByb21pc2VcbkJvZHkuUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlO1xuXG4vKipcbiAqIGhlYWRlcnMuanNcbiAqXG4gKiBIZWFkZXJzIGNsYXNzIG9mZmVycyBjb252ZW5pZW50IGhlbHBlcnNcbiAqL1xuXG5jb25zdCBpbnZhbGlkVG9rZW5SZWdleCA9IC9bXlxcXl9gYS16QS1aXFwtMC05ISMkJSYnKisufH5dLztcbmNvbnN0IGludmFsaWRIZWFkZXJDaGFyUmVnZXggPSAvW15cXHRcXHgyMC1cXHg3ZVxceDgwLVxceGZmXS87XG5cbmZ1bmN0aW9uIHZhbGlkYXRlTmFtZShuYW1lKSB7XG5cdG5hbWUgPSBgJHtuYW1lfWA7XG5cdGlmIChpbnZhbGlkVG9rZW5SZWdleC50ZXN0KG5hbWUpIHx8IG5hbWUgPT09ICcnKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihgJHtuYW1lfSBpcyBub3QgYSBsZWdhbCBIVFRQIGhlYWRlciBuYW1lYCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVWYWx1ZSh2YWx1ZSkge1xuXHR2YWx1ZSA9IGAke3ZhbHVlfWA7XG5cdGlmIChpbnZhbGlkSGVhZGVyQ2hhclJlZ2V4LnRlc3QodmFsdWUpKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihgJHt2YWx1ZX0gaXMgbm90IGEgbGVnYWwgSFRUUCBoZWFkZXIgdmFsdWVgKTtcblx0fVxufVxuXG4vKipcbiAqIEZpbmQgdGhlIGtleSBpbiB0aGUgbWFwIG9iamVjdCBnaXZlbiBhIGhlYWRlciBuYW1lLlxuICpcbiAqIFJldHVybnMgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZC5cbiAqXG4gKiBAcGFyYW0gICBTdHJpbmcgIG5hbWUgIEhlYWRlciBuYW1lXG4gKiBAcmV0dXJuICBTdHJpbmd8VW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIGZpbmQobWFwLCBuYW1lKSB7XG5cdG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG5cdGZvciAoY29uc3Qga2V5IGluIG1hcCkge1xuXHRcdGlmIChrZXkudG9Mb3dlckNhc2UoKSA9PT0gbmFtZSkge1xuXHRcdFx0cmV0dXJuIGtleTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuY29uc3QgTUFQID0gU3ltYm9sKCdtYXAnKTtcbmNsYXNzIEhlYWRlcnMge1xuXHQvKipcbiAgKiBIZWFkZXJzIGNsYXNzXG4gICpcbiAgKiBAcGFyYW0gICBPYmplY3QgIGhlYWRlcnMgIFJlc3BvbnNlIGhlYWRlcnNcbiAgKiBAcmV0dXJuICBWb2lkXG4gICovXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdGxldCBpbml0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQ7XG5cblx0XHR0aGlzW01BUF0gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5cdFx0aWYgKGluaXQgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG5cdFx0XHRjb25zdCByYXdIZWFkZXJzID0gaW5pdC5yYXcoKTtcblx0XHRcdGNvbnN0IGhlYWRlck5hbWVzID0gT2JqZWN0LmtleXMocmF3SGVhZGVycyk7XG5cblx0XHRcdGZvciAoY29uc3QgaGVhZGVyTmFtZSBvZiBoZWFkZXJOYW1lcykge1xuXHRcdFx0XHRmb3IgKGNvbnN0IHZhbHVlIG9mIHJhd0hlYWRlcnNbaGVhZGVyTmFtZV0pIHtcblx0XHRcdFx0XHR0aGlzLmFwcGVuZChoZWFkZXJOYW1lLCB2YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFdlIGRvbid0IHdvcnJ5IGFib3V0IGNvbnZlcnRpbmcgcHJvcCB0byBCeXRlU3RyaW5nIGhlcmUgYXMgYXBwZW5kKClcblx0XHQvLyB3aWxsIGhhbmRsZSBpdC5cblx0XHRpZiAoaW5pdCA9PSBudWxsKSA7IGVsc2UgaWYgKHR5cGVvZiBpbml0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Y29uc3QgbWV0aG9kID0gaW5pdFtTeW1ib2wuaXRlcmF0b3JdO1xuXHRcdFx0aWYgKG1ldGhvZCAhPSBudWxsKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgbWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignSGVhZGVyIHBhaXJzIG11c3QgYmUgaXRlcmFibGUnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIHNlcXVlbmNlPHNlcXVlbmNlPEJ5dGVTdHJpbmc+PlxuXHRcdFx0XHQvLyBOb3RlOiBwZXIgc3BlYyB3ZSBoYXZlIHRvIGZpcnN0IGV4aGF1c3QgdGhlIGxpc3RzIHRoZW4gcHJvY2VzcyB0aGVtXG5cdFx0XHRcdGNvbnN0IHBhaXJzID0gW107XG5cdFx0XHRcdGZvciAoY29uc3QgcGFpciBvZiBpbml0KSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBwYWlyICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgcGFpcltTeW1ib2wuaXRlcmF0b3JdICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdFYWNoIGhlYWRlciBwYWlyIG11c3QgYmUgaXRlcmFibGUnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cGFpcnMucHVzaChBcnJheS5mcm9tKHBhaXIpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAoY29uc3QgcGFpciBvZiBwYWlycykge1xuXHRcdFx0XHRcdGlmIChwYWlyLmxlbmd0aCAhPT0gMikge1xuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRWFjaCBoZWFkZXIgcGFpciBtdXN0IGJlIGEgbmFtZS92YWx1ZSB0dXBsZScpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLmFwcGVuZChwYWlyWzBdLCBwYWlyWzFdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gcmVjb3JkPEJ5dGVTdHJpbmcsIEJ5dGVTdHJpbmc+XG5cdFx0XHRcdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGluaXQpKSB7XG5cdFx0XHRcdFx0Y29uc3QgdmFsdWUgPSBpbml0W2tleV07XG5cdFx0XHRcdFx0dGhpcy5hcHBlbmQoa2V5LCB2YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignUHJvdmlkZWQgaW5pdGlhbGl6ZXIgbXVzdCBiZSBhbiBvYmplY3QnKTtcblx0XHR9XG5cdH1cblxuXHQvKipcbiAgKiBSZXR1cm4gY29tYmluZWQgaGVhZGVyIHZhbHVlIGdpdmVuIG5hbWVcbiAgKlxuICAqIEBwYXJhbSAgIFN0cmluZyAgbmFtZSAgSGVhZGVyIG5hbWVcbiAgKiBAcmV0dXJuICBNaXhlZFxuICAqL1xuXHRnZXQobmFtZSkge1xuXHRcdG5hbWUgPSBgJHtuYW1lfWA7XG5cdFx0dmFsaWRhdGVOYW1lKG5hbWUpO1xuXHRcdGNvbnN0IGtleSA9IGZpbmQodGhpc1tNQVBdLCBuYW1lKTtcblx0XHRpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzW01BUF1ba2V5XS5qb2luKCcsICcpO1xuXHR9XG5cblx0LyoqXG4gICogSXRlcmF0ZSBvdmVyIGFsbCBoZWFkZXJzXG4gICpcbiAgKiBAcGFyYW0gICBGdW5jdGlvbiAgY2FsbGJhY2sgIEV4ZWN1dGVkIGZvciBlYWNoIGl0ZW0gd2l0aCBwYXJhbWV0ZXJzICh2YWx1ZSwgbmFtZSwgdGhpc0FyZylcbiAgKiBAcGFyYW0gICBCb29sZWFuICAgdGhpc0FyZyAgIGB0aGlzYCBjb250ZXh0IGZvciBjYWxsYmFjayBmdW5jdGlvblxuICAqIEByZXR1cm4gIFZvaWRcbiAgKi9cblx0Zm9yRWFjaChjYWxsYmFjaykge1xuXHRcdGxldCB0aGlzQXJnID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG5cblx0XHRsZXQgcGFpcnMgPSBnZXRIZWFkZXJzKHRoaXMpO1xuXHRcdGxldCBpID0gMDtcblx0XHR3aGlsZSAoaSA8IHBhaXJzLmxlbmd0aCkge1xuXHRcdFx0dmFyIF9wYWlycyRpID0gcGFpcnNbaV07XG5cdFx0XHRjb25zdCBuYW1lID0gX3BhaXJzJGlbMF0sXG5cdFx0XHQgICAgICB2YWx1ZSA9IF9wYWlycyRpWzFdO1xuXG5cdFx0XHRjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHZhbHVlLCBuYW1lLCB0aGlzKTtcblx0XHRcdHBhaXJzID0gZ2V0SGVhZGVycyh0aGlzKTtcblx0XHRcdGkrKztcblx0XHR9XG5cdH1cblxuXHQvKipcbiAgKiBPdmVyd3JpdGUgaGVhZGVyIHZhbHVlcyBnaXZlbiBuYW1lXG4gICpcbiAgKiBAcGFyYW0gICBTdHJpbmcgIG5hbWUgICBIZWFkZXIgbmFtZVxuICAqIEBwYXJhbSAgIFN0cmluZyAgdmFsdWUgIEhlYWRlciB2YWx1ZVxuICAqIEByZXR1cm4gIFZvaWRcbiAgKi9cblx0c2V0KG5hbWUsIHZhbHVlKSB7XG5cdFx0bmFtZSA9IGAke25hbWV9YDtcblx0XHR2YWx1ZSA9IGAke3ZhbHVlfWA7XG5cdFx0dmFsaWRhdGVOYW1lKG5hbWUpO1xuXHRcdHZhbGlkYXRlVmFsdWUodmFsdWUpO1xuXHRcdGNvbnN0IGtleSA9IGZpbmQodGhpc1tNQVBdLCBuYW1lKTtcblx0XHR0aGlzW01BUF1ba2V5ICE9PSB1bmRlZmluZWQgPyBrZXkgOiBuYW1lXSA9IFt2YWx1ZV07XG5cdH1cblxuXHQvKipcbiAgKiBBcHBlbmQgYSB2YWx1ZSBvbnRvIGV4aXN0aW5nIGhlYWRlclxuICAqXG4gICogQHBhcmFtICAgU3RyaW5nICBuYW1lICAgSGVhZGVyIG5hbWVcbiAgKiBAcGFyYW0gICBTdHJpbmcgIHZhbHVlICBIZWFkZXIgdmFsdWVcbiAgKiBAcmV0dXJuICBWb2lkXG4gICovXG5cdGFwcGVuZChuYW1lLCB2YWx1ZSkge1xuXHRcdG5hbWUgPSBgJHtuYW1lfWA7XG5cdFx0dmFsdWUgPSBgJHt2YWx1ZX1gO1xuXHRcdHZhbGlkYXRlTmFtZShuYW1lKTtcblx0XHR2YWxpZGF0ZVZhbHVlKHZhbHVlKTtcblx0XHRjb25zdCBrZXkgPSBmaW5kKHRoaXNbTUFQXSwgbmFtZSk7XG5cdFx0aWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzW01BUF1ba2V5XS5wdXNoKHZhbHVlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpc1tNQVBdW25hbWVdID0gW3ZhbHVlXTtcblx0XHR9XG5cdH1cblxuXHQvKipcbiAgKiBDaGVjayBmb3IgaGVhZGVyIG5hbWUgZXhpc3RlbmNlXG4gICpcbiAgKiBAcGFyYW0gICBTdHJpbmcgICBuYW1lICBIZWFkZXIgbmFtZVxuICAqIEByZXR1cm4gIEJvb2xlYW5cbiAgKi9cblx0aGFzKG5hbWUpIHtcblx0XHRuYW1lID0gYCR7bmFtZX1gO1xuXHRcdHZhbGlkYXRlTmFtZShuYW1lKTtcblx0XHRyZXR1cm4gZmluZCh0aGlzW01BUF0sIG5hbWUpICE9PSB1bmRlZmluZWQ7XG5cdH1cblxuXHQvKipcbiAgKiBEZWxldGUgYWxsIGhlYWRlciB2YWx1ZXMgZ2l2ZW4gbmFtZVxuICAqXG4gICogQHBhcmFtICAgU3RyaW5nICBuYW1lICBIZWFkZXIgbmFtZVxuICAqIEByZXR1cm4gIFZvaWRcbiAgKi9cblx0ZGVsZXRlKG5hbWUpIHtcblx0XHRuYW1lID0gYCR7bmFtZX1gO1xuXHRcdHZhbGlkYXRlTmFtZShuYW1lKTtcblx0XHRjb25zdCBrZXkgPSBmaW5kKHRoaXNbTUFQXSwgbmFtZSk7XG5cdFx0aWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRkZWxldGUgdGhpc1tNQVBdW2tleV07XG5cdFx0fVxuXHR9XG5cblx0LyoqXG4gICogUmV0dXJuIHJhdyBoZWFkZXJzIChub24tc3BlYyBhcGkpXG4gICpcbiAgKiBAcmV0dXJuICBPYmplY3RcbiAgKi9cblx0cmF3KCkge1xuXHRcdHJldHVybiB0aGlzW01BUF07XG5cdH1cblxuXHQvKipcbiAgKiBHZXQgYW4gaXRlcmF0b3Igb24ga2V5cy5cbiAgKlxuICAqIEByZXR1cm4gIEl0ZXJhdG9yXG4gICovXG5cdGtleXMoKSB7XG5cdFx0cmV0dXJuIGNyZWF0ZUhlYWRlcnNJdGVyYXRvcih0aGlzLCAna2V5Jyk7XG5cdH1cblxuXHQvKipcbiAgKiBHZXQgYW4gaXRlcmF0b3Igb24gdmFsdWVzLlxuICAqXG4gICogQHJldHVybiAgSXRlcmF0b3JcbiAgKi9cblx0dmFsdWVzKCkge1xuXHRcdHJldHVybiBjcmVhdGVIZWFkZXJzSXRlcmF0b3IodGhpcywgJ3ZhbHVlJyk7XG5cdH1cblxuXHQvKipcbiAgKiBHZXQgYW4gaXRlcmF0b3Igb24gZW50cmllcy5cbiAgKlxuICAqIFRoaXMgaXMgdGhlIGRlZmF1bHQgaXRlcmF0b3Igb2YgdGhlIEhlYWRlcnMgb2JqZWN0LlxuICAqXG4gICogQHJldHVybiAgSXRlcmF0b3JcbiAgKi9cblx0W1N5bWJvbC5pdGVyYXRvcl0oKSB7XG5cdFx0cmV0dXJuIGNyZWF0ZUhlYWRlcnNJdGVyYXRvcih0aGlzLCAna2V5K3ZhbHVlJyk7XG5cdH1cbn1cbkhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoSGVhZGVycy5wcm90b3R5cGUsIFN5bWJvbC50b1N0cmluZ1RhZywge1xuXHR2YWx1ZTogJ0hlYWRlcnMnLFxuXHR3cml0YWJsZTogZmFsc2UsXG5cdGVudW1lcmFibGU6IGZhbHNlLFxuXHRjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhIZWFkZXJzLnByb3RvdHlwZSwge1xuXHRnZXQ6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRmb3JFYWNoOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0c2V0OiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0YXBwZW5kOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0aGFzOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0ZGVsZXRlOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0a2V5czogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdHZhbHVlczogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdGVudHJpZXM6IHsgZW51bWVyYWJsZTogdHJ1ZSB9XG59KTtcblxuZnVuY3Rpb24gZ2V0SGVhZGVycyhoZWFkZXJzKSB7XG5cdGxldCBraW5kID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAna2V5K3ZhbHVlJztcblxuXHRjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoaGVhZGVyc1tNQVBdKS5zb3J0KCk7XG5cdHJldHVybiBrZXlzLm1hcChraW5kID09PSAna2V5JyA/IGZ1bmN0aW9uIChrKSB7XG5cdFx0cmV0dXJuIGsudG9Mb3dlckNhc2UoKTtcblx0fSA6IGtpbmQgPT09ICd2YWx1ZScgPyBmdW5jdGlvbiAoaykge1xuXHRcdHJldHVybiBoZWFkZXJzW01BUF1ba10uam9pbignLCAnKTtcblx0fSA6IGZ1bmN0aW9uIChrKSB7XG5cdFx0cmV0dXJuIFtrLnRvTG93ZXJDYXNlKCksIGhlYWRlcnNbTUFQXVtrXS5qb2luKCcsICcpXTtcblx0fSk7XG59XG5cbmNvbnN0IElOVEVSTkFMID0gU3ltYm9sKCdpbnRlcm5hbCcpO1xuXG5mdW5jdGlvbiBjcmVhdGVIZWFkZXJzSXRlcmF0b3IodGFyZ2V0LCBraW5kKSB7XG5cdGNvbnN0IGl0ZXJhdG9yID0gT2JqZWN0LmNyZWF0ZShIZWFkZXJzSXRlcmF0b3JQcm90b3R5cGUpO1xuXHRpdGVyYXRvcltJTlRFUk5BTF0gPSB7XG5cdFx0dGFyZ2V0LFxuXHRcdGtpbmQsXG5cdFx0aW5kZXg6IDBcblx0fTtcblx0cmV0dXJuIGl0ZXJhdG9yO1xufVxuXG5jb25zdCBIZWFkZXJzSXRlcmF0b3JQcm90b3R5cGUgPSBPYmplY3Quc2V0UHJvdG90eXBlT2Yoe1xuXHRuZXh0KCkge1xuXHRcdC8vIGlzdGFuYnVsIGlnbm9yZSBpZlxuXHRcdGlmICghdGhpcyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgIT09IEhlYWRlcnNJdGVyYXRvclByb3RvdHlwZSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignVmFsdWUgb2YgYHRoaXNgIGlzIG5vdCBhIEhlYWRlcnNJdGVyYXRvcicpO1xuXHRcdH1cblxuXHRcdHZhciBfSU5URVJOQUwgPSB0aGlzW0lOVEVSTkFMXTtcblx0XHRjb25zdCB0YXJnZXQgPSBfSU5URVJOQUwudGFyZ2V0LFxuXHRcdCAgICAgIGtpbmQgPSBfSU5URVJOQUwua2luZCxcblx0XHQgICAgICBpbmRleCA9IF9JTlRFUk5BTC5pbmRleDtcblxuXHRcdGNvbnN0IHZhbHVlcyA9IGdldEhlYWRlcnModGFyZ2V0LCBraW5kKTtcblx0XHRjb25zdCBsZW4gPSB2YWx1ZXMubGVuZ3RoO1xuXHRcdGlmIChpbmRleCA+PSBsZW4pIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGRvbmU6IHRydWVcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dGhpc1tJTlRFUk5BTF0uaW5kZXggPSBpbmRleCArIDE7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dmFsdWU6IHZhbHVlc1tpbmRleF0sXG5cdFx0XHRkb25lOiBmYWxzZVxuXHRcdH07XG5cdH1cbn0sIE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2YoW11bU3ltYm9sLml0ZXJhdG9yXSgpKSkpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoSGVhZGVyc0l0ZXJhdG9yUHJvdG90eXBlLCBTeW1ib2wudG9TdHJpbmdUYWcsIHtcblx0dmFsdWU6ICdIZWFkZXJzSXRlcmF0b3InLFxuXHR3cml0YWJsZTogZmFsc2UsXG5cdGVudW1lcmFibGU6IGZhbHNlLFxuXHRjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG4vKipcbiAqIEV4cG9ydCB0aGUgSGVhZGVycyBvYmplY3QgaW4gYSBmb3JtIHRoYXQgTm9kZS5qcyBjYW4gY29uc3VtZS5cbiAqXG4gKiBAcGFyYW0gICBIZWFkZXJzICBoZWFkZXJzXG4gKiBAcmV0dXJuICBPYmplY3RcbiAqL1xuZnVuY3Rpb24gZXhwb3J0Tm9kZUNvbXBhdGlibGVIZWFkZXJzKGhlYWRlcnMpIHtcblx0Y29uc3Qgb2JqID0gT2JqZWN0LmFzc2lnbih7IF9fcHJvdG9fXzogbnVsbCB9LCBoZWFkZXJzW01BUF0pO1xuXG5cdC8vIGh0dHAucmVxdWVzdCgpIG9ubHkgc3VwcG9ydHMgc3RyaW5nIGFzIEhvc3QgaGVhZGVyLiBUaGlzIGhhY2sgbWFrZXNcblx0Ly8gc3BlY2lmeWluZyBjdXN0b20gSG9zdCBoZWFkZXIgcG9zc2libGUuXG5cdGNvbnN0IGhvc3RIZWFkZXJLZXkgPSBmaW5kKGhlYWRlcnNbTUFQXSwgJ0hvc3QnKTtcblx0aWYgKGhvc3RIZWFkZXJLZXkgIT09IHVuZGVmaW5lZCkge1xuXHRcdG9ialtob3N0SGVhZGVyS2V5XSA9IG9ialtob3N0SGVhZGVyS2V5XVswXTtcblx0fVxuXG5cdHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgSGVhZGVycyBvYmplY3QgZnJvbSBhbiBvYmplY3Qgb2YgaGVhZGVycywgaWdub3JpbmcgdGhvc2UgdGhhdCBkb1xuICogbm90IGNvbmZvcm0gdG8gSFRUUCBncmFtbWFyIHByb2R1Y3Rpb25zLlxuICpcbiAqIEBwYXJhbSAgIE9iamVjdCAgb2JqICBPYmplY3Qgb2YgaGVhZGVyc1xuICogQHJldHVybiAgSGVhZGVyc1xuICovXG5mdW5jdGlvbiBjcmVhdGVIZWFkZXJzTGVuaWVudChvYmopIHtcblx0Y29uc3QgaGVhZGVycyA9IG5ldyBIZWFkZXJzKCk7XG5cdGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XG5cdFx0aWYgKGludmFsaWRUb2tlblJlZ2V4LnRlc3QobmFtZSkpIHtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblx0XHRpZiAoQXJyYXkuaXNBcnJheShvYmpbbmFtZV0pKSB7XG5cdFx0XHRmb3IgKGNvbnN0IHZhbCBvZiBvYmpbbmFtZV0pIHtcblx0XHRcdFx0aWYgKGludmFsaWRIZWFkZXJDaGFyUmVnZXgudGVzdCh2YWwpKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGhlYWRlcnNbTUFQXVtuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0aGVhZGVyc1tNQVBdW25hbWVdID0gW3ZhbF07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aGVhZGVyc1tNQVBdW25hbWVdLnB1c2godmFsKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoIWludmFsaWRIZWFkZXJDaGFyUmVnZXgudGVzdChvYmpbbmFtZV0pKSB7XG5cdFx0XHRoZWFkZXJzW01BUF1bbmFtZV0gPSBbb2JqW25hbWVdXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGhlYWRlcnM7XG59XG5cbmNvbnN0IElOVEVSTkFMUyQxID0gU3ltYm9sKCdSZXNwb25zZSBpbnRlcm5hbHMnKTtcblxuLy8gZml4IGFuIGlzc3VlIHdoZXJlIFwiU1RBVFVTX0NPREVTXCIgYXJlbid0IGEgbmFtZWQgZXhwb3J0IGZvciBub2RlIDwxMFxuY29uc3QgU1RBVFVTX0NPREVTID0gaHR0cC5TVEFUVVNfQ09ERVM7XG5cbi8qKlxuICogUmVzcG9uc2UgY2xhc3NcbiAqXG4gKiBAcGFyYW0gICBTdHJlYW0gIGJvZHkgIFJlYWRhYmxlIHN0cmVhbVxuICogQHBhcmFtICAgT2JqZWN0ICBvcHRzICBSZXNwb25zZSBvcHRpb25zXG4gKiBAcmV0dXJuICBWb2lkXG4gKi9cbmNsYXNzIFJlc3BvbnNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0bGV0IGJvZHkgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IG51bGw7XG5cdFx0bGV0IG9wdHMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuXG5cdFx0Qm9keS5jYWxsKHRoaXMsIGJvZHksIG9wdHMpO1xuXG5cdFx0Y29uc3Qgc3RhdHVzID0gb3B0cy5zdGF0dXMgfHwgMjAwO1xuXHRcdGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRzLmhlYWRlcnMpO1xuXG5cdFx0aWYgKGJvZHkgIT0gbnVsbCAmJiAhaGVhZGVycy5oYXMoJ0NvbnRlbnQtVHlwZScpKSB7XG5cdFx0XHRjb25zdCBjb250ZW50VHlwZSA9IGV4dHJhY3RDb250ZW50VHlwZShib2R5KTtcblx0XHRcdGlmIChjb250ZW50VHlwZSkge1xuXHRcdFx0XHRoZWFkZXJzLmFwcGVuZCgnQ29udGVudC1UeXBlJywgY29udGVudFR5cGUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXNbSU5URVJOQUxTJDFdID0ge1xuXHRcdFx0dXJsOiBvcHRzLnVybCxcblx0XHRcdHN0YXR1cyxcblx0XHRcdHN0YXR1c1RleHQ6IG9wdHMuc3RhdHVzVGV4dCB8fCBTVEFUVVNfQ09ERVNbc3RhdHVzXSxcblx0XHRcdGhlYWRlcnMsXG5cdFx0XHRjb3VudGVyOiBvcHRzLmNvdW50ZXJcblx0XHR9O1xuXHR9XG5cblx0Z2V0IHVybCgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0udXJsIHx8ICcnO1xuXHR9XG5cblx0Z2V0IHN0YXR1cygpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0uc3RhdHVzO1xuXHR9XG5cblx0LyoqXG4gICogQ29udmVuaWVuY2UgcHJvcGVydHkgcmVwcmVzZW50aW5nIGlmIHRoZSByZXF1ZXN0IGVuZGVkIG5vcm1hbGx5XG4gICovXG5cdGdldCBvaygpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0uc3RhdHVzID49IDIwMCAmJiB0aGlzW0lOVEVSTkFMUyQxXS5zdGF0dXMgPCAzMDA7XG5cdH1cblxuXHRnZXQgcmVkaXJlY3RlZCgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0uY291bnRlciA+IDA7XG5cdH1cblxuXHRnZXQgc3RhdHVzVGV4dCgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMV0uc3RhdHVzVGV4dDtcblx0fVxuXG5cdGdldCBoZWFkZXJzKCkge1xuXHRcdHJldHVybiB0aGlzW0lOVEVSTkFMUyQxXS5oZWFkZXJzO1xuXHR9XG5cblx0LyoqXG4gICogQ2xvbmUgdGhpcyByZXNwb25zZVxuICAqXG4gICogQHJldHVybiAgUmVzcG9uc2VcbiAgKi9cblx0Y2xvbmUoKSB7XG5cdFx0cmV0dXJuIG5ldyBSZXNwb25zZShjbG9uZSh0aGlzKSwge1xuXHRcdFx0dXJsOiB0aGlzLnVybCxcblx0XHRcdHN0YXR1czogdGhpcy5zdGF0dXMsXG5cdFx0XHRzdGF0dXNUZXh0OiB0aGlzLnN0YXR1c1RleHQsXG5cdFx0XHRoZWFkZXJzOiB0aGlzLmhlYWRlcnMsXG5cdFx0XHRvazogdGhpcy5vayxcblx0XHRcdHJlZGlyZWN0ZWQ6IHRoaXMucmVkaXJlY3RlZFxuXHRcdH0pO1xuXHR9XG59XG5cbkJvZHkubWl4SW4oUmVzcG9uc2UucHJvdG90eXBlKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoUmVzcG9uc2UucHJvdG90eXBlLCB7XG5cdHVybDogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdHN0YXR1czogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdG9rOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0cmVkaXJlY3RlZDogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdHN0YXR1c1RleHQ6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRoZWFkZXJzOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0Y2xvbmU6IHsgZW51bWVyYWJsZTogdHJ1ZSB9XG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlc3BvbnNlLnByb3RvdHlwZSwgU3ltYm9sLnRvU3RyaW5nVGFnLCB7XG5cdHZhbHVlOiAnUmVzcG9uc2UnLFxuXHR3cml0YWJsZTogZmFsc2UsXG5cdGVudW1lcmFibGU6IGZhbHNlLFxuXHRjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5jb25zdCBJTlRFUk5BTFMkMiA9IFN5bWJvbCgnUmVxdWVzdCBpbnRlcm5hbHMnKTtcblxuLy8gZml4IGFuIGlzc3VlIHdoZXJlIFwiZm9ybWF0XCIsIFwicGFyc2VcIiBhcmVuJ3QgYSBuYW1lZCBleHBvcnQgZm9yIG5vZGUgPDEwXG5jb25zdCBwYXJzZV91cmwgPSBVcmwucGFyc2U7XG5jb25zdCBmb3JtYXRfdXJsID0gVXJsLmZvcm1hdDtcblxuY29uc3Qgc3RyZWFtRGVzdHJ1Y3Rpb25TdXBwb3J0ZWQgPSAnZGVzdHJveScgaW4gU3RyZWFtLlJlYWRhYmxlLnByb3RvdHlwZTtcblxuLyoqXG4gKiBDaGVjayBpZiBhIHZhbHVlIGlzIGFuIGluc3RhbmNlIG9mIFJlcXVlc3QuXG4gKlxuICogQHBhcmFtICAgTWl4ZWQgICBpbnB1dFxuICogQHJldHVybiAgQm9vbGVhblxuICovXG5mdW5jdGlvbiBpc1JlcXVlc3QoaW5wdXQpIHtcblx0cmV0dXJuIHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGlucHV0W0lOVEVSTkFMUyQyXSA9PT0gJ29iamVjdCc7XG59XG5cbmZ1bmN0aW9uIGlzQWJvcnRTaWduYWwoc2lnbmFsKSB7XG5cdGNvbnN0IHByb3RvID0gc2lnbmFsICYmIHR5cGVvZiBzaWduYWwgPT09ICdvYmplY3QnICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihzaWduYWwpO1xuXHRyZXR1cm4gISEocHJvdG8gJiYgcHJvdG8uY29uc3RydWN0b3IubmFtZSA9PT0gJ0Fib3J0U2lnbmFsJyk7XG59XG5cbi8qKlxuICogUmVxdWVzdCBjbGFzc1xuICpcbiAqIEBwYXJhbSAgIE1peGVkICAgaW5wdXQgIFVybCBvciBSZXF1ZXN0IGluc3RhbmNlXG4gKiBAcGFyYW0gICBPYmplY3QgIGluaXQgICBDdXN0b20gb3B0aW9uc1xuICogQHJldHVybiAgVm9pZFxuICovXG5jbGFzcyBSZXF1ZXN0IHtcblx0Y29uc3RydWN0b3IoaW5wdXQpIHtcblx0XHRsZXQgaW5pdCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG5cblx0XHRsZXQgcGFyc2VkVVJMO1xuXG5cdFx0Ly8gbm9ybWFsaXplIGlucHV0XG5cdFx0aWYgKCFpc1JlcXVlc3QoaW5wdXQpKSB7XG5cdFx0XHRpZiAoaW5wdXQgJiYgaW5wdXQuaHJlZikge1xuXHRcdFx0XHQvLyBpbiBvcmRlciB0byBzdXBwb3J0IE5vZGUuanMnIFVybCBvYmplY3RzOyB0aG91Z2ggV0hBVFdHJ3MgVVJMIG9iamVjdHNcblx0XHRcdFx0Ly8gd2lsbCBmYWxsIGludG8gdGhpcyBicmFuY2ggYWxzbyAoc2luY2UgdGhlaXIgYHRvU3RyaW5nKClgIHdpbGwgcmV0dXJuXG5cdFx0XHRcdC8vIGBocmVmYCBwcm9wZXJ0eSBhbnl3YXkpXG5cdFx0XHRcdHBhcnNlZFVSTCA9IHBhcnNlX3VybChpbnB1dC5ocmVmKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIGNvZXJjZSBpbnB1dCB0byBhIHN0cmluZyBiZWZvcmUgYXR0ZW1wdGluZyB0byBwYXJzZVxuXHRcdFx0XHRwYXJzZWRVUkwgPSBwYXJzZV91cmwoYCR7aW5wdXR9YCk7XG5cdFx0XHR9XG5cdFx0XHRpbnB1dCA9IHt9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYXJzZWRVUkwgPSBwYXJzZV91cmwoaW5wdXQudXJsKTtcblx0XHR9XG5cblx0XHRsZXQgbWV0aG9kID0gaW5pdC5tZXRob2QgfHwgaW5wdXQubWV0aG9kIHx8ICdHRVQnO1xuXHRcdG1ldGhvZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuXG5cdFx0aWYgKChpbml0LmJvZHkgIT0gbnVsbCB8fCBpc1JlcXVlc3QoaW5wdXQpICYmIGlucHV0LmJvZHkgIT09IG51bGwpICYmIChtZXRob2QgPT09ICdHRVQnIHx8IG1ldGhvZCA9PT0gJ0hFQUQnKSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignUmVxdWVzdCB3aXRoIEdFVC9IRUFEIG1ldGhvZCBjYW5ub3QgaGF2ZSBib2R5Jyk7XG5cdFx0fVxuXG5cdFx0bGV0IGlucHV0Qm9keSA9IGluaXQuYm9keSAhPSBudWxsID8gaW5pdC5ib2R5IDogaXNSZXF1ZXN0KGlucHV0KSAmJiBpbnB1dC5ib2R5ICE9PSBudWxsID8gY2xvbmUoaW5wdXQpIDogbnVsbDtcblxuXHRcdEJvZHkuY2FsbCh0aGlzLCBpbnB1dEJvZHksIHtcblx0XHRcdHRpbWVvdXQ6IGluaXQudGltZW91dCB8fCBpbnB1dC50aW1lb3V0IHx8IDAsXG5cdFx0XHRzaXplOiBpbml0LnNpemUgfHwgaW5wdXQuc2l6ZSB8fCAwXG5cdFx0fSk7XG5cblx0XHRjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoaW5pdC5oZWFkZXJzIHx8IGlucHV0LmhlYWRlcnMgfHwge30pO1xuXG5cdFx0aWYgKGlucHV0Qm9keSAhPSBudWxsICYmICFoZWFkZXJzLmhhcygnQ29udGVudC1UeXBlJykpIHtcblx0XHRcdGNvbnN0IGNvbnRlbnRUeXBlID0gZXh0cmFjdENvbnRlbnRUeXBlKGlucHV0Qm9keSk7XG5cdFx0XHRpZiAoY29udGVudFR5cGUpIHtcblx0XHRcdFx0aGVhZGVycy5hcHBlbmQoJ0NvbnRlbnQtVHlwZScsIGNvbnRlbnRUeXBlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRsZXQgc2lnbmFsID0gaXNSZXF1ZXN0KGlucHV0KSA/IGlucHV0LnNpZ25hbCA6IG51bGw7XG5cdFx0aWYgKCdzaWduYWwnIGluIGluaXQpIHNpZ25hbCA9IGluaXQuc2lnbmFsO1xuXG5cdFx0aWYgKHNpZ25hbCAhPSBudWxsICYmICFpc0Fib3J0U2lnbmFsKHNpZ25hbCkpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIHNpZ25hbCB0byBiZSBhbiBpbnN0YW5jZW9mIEFib3J0U2lnbmFsJyk7XG5cdFx0fVxuXG5cdFx0dGhpc1tJTlRFUk5BTFMkMl0gPSB7XG5cdFx0XHRtZXRob2QsXG5cdFx0XHRyZWRpcmVjdDogaW5pdC5yZWRpcmVjdCB8fCBpbnB1dC5yZWRpcmVjdCB8fCAnZm9sbG93Jyxcblx0XHRcdGhlYWRlcnMsXG5cdFx0XHRwYXJzZWRVUkwsXG5cdFx0XHRzaWduYWxcblx0XHR9O1xuXG5cdFx0Ly8gbm9kZS1mZXRjaC1vbmx5IG9wdGlvbnNcblx0XHR0aGlzLmZvbGxvdyA9IGluaXQuZm9sbG93ICE9PSB1bmRlZmluZWQgPyBpbml0LmZvbGxvdyA6IGlucHV0LmZvbGxvdyAhPT0gdW5kZWZpbmVkID8gaW5wdXQuZm9sbG93IDogMjA7XG5cdFx0dGhpcy5jb21wcmVzcyA9IGluaXQuY29tcHJlc3MgIT09IHVuZGVmaW5lZCA/IGluaXQuY29tcHJlc3MgOiBpbnB1dC5jb21wcmVzcyAhPT0gdW5kZWZpbmVkID8gaW5wdXQuY29tcHJlc3MgOiB0cnVlO1xuXHRcdHRoaXMuY291bnRlciA9IGluaXQuY291bnRlciB8fCBpbnB1dC5jb3VudGVyIHx8IDA7XG5cdFx0dGhpcy5hZ2VudCA9IGluaXQuYWdlbnQgfHwgaW5wdXQuYWdlbnQ7XG5cdH1cblxuXHRnZXQgbWV0aG9kKCkge1xuXHRcdHJldHVybiB0aGlzW0lOVEVSTkFMUyQyXS5tZXRob2Q7XG5cdH1cblxuXHRnZXQgdXJsKCkge1xuXHRcdHJldHVybiBmb3JtYXRfdXJsKHRoaXNbSU5URVJOQUxTJDJdLnBhcnNlZFVSTCk7XG5cdH1cblxuXHRnZXQgaGVhZGVycygpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMl0uaGVhZGVycztcblx0fVxuXG5cdGdldCByZWRpcmVjdCgpIHtcblx0XHRyZXR1cm4gdGhpc1tJTlRFUk5BTFMkMl0ucmVkaXJlY3Q7XG5cdH1cblxuXHRnZXQgc2lnbmFsKCkge1xuXHRcdHJldHVybiB0aGlzW0lOVEVSTkFMUyQyXS5zaWduYWw7XG5cdH1cblxuXHQvKipcbiAgKiBDbG9uZSB0aGlzIHJlcXVlc3RcbiAgKlxuICAqIEByZXR1cm4gIFJlcXVlc3RcbiAgKi9cblx0Y2xvbmUoKSB7XG5cdFx0cmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMpO1xuXHR9XG59XG5cbkJvZHkubWl4SW4oUmVxdWVzdC5wcm90b3R5cGUpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUmVxdWVzdC5wcm90b3R5cGUsIFN5bWJvbC50b1N0cmluZ1RhZywge1xuXHR2YWx1ZTogJ1JlcXVlc3QnLFxuXHR3cml0YWJsZTogZmFsc2UsXG5cdGVudW1lcmFibGU6IGZhbHNlLFxuXHRjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhSZXF1ZXN0LnByb3RvdHlwZSwge1xuXHRtZXRob2Q6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHR1cmw6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRoZWFkZXJzOiB7IGVudW1lcmFibGU6IHRydWUgfSxcblx0cmVkaXJlY3Q6IHsgZW51bWVyYWJsZTogdHJ1ZSB9LFxuXHRjbG9uZTogeyBlbnVtZXJhYmxlOiB0cnVlIH0sXG5cdHNpZ25hbDogeyBlbnVtZXJhYmxlOiB0cnVlIH1cbn0pO1xuXG4vKipcbiAqIENvbnZlcnQgYSBSZXF1ZXN0IHRvIE5vZGUuanMgaHR0cCByZXF1ZXN0IG9wdGlvbnMuXG4gKlxuICogQHBhcmFtICAgUmVxdWVzdCAgQSBSZXF1ZXN0IGluc3RhbmNlXG4gKiBAcmV0dXJuICBPYmplY3QgICBUaGUgb3B0aW9ucyBvYmplY3QgdG8gYmUgcGFzc2VkIHRvIGh0dHAucmVxdWVzdFxuICovXG5mdW5jdGlvbiBnZXROb2RlUmVxdWVzdE9wdGlvbnMocmVxdWVzdCkge1xuXHRjb25zdCBwYXJzZWRVUkwgPSByZXF1ZXN0W0lOVEVSTkFMUyQyXS5wYXJzZWRVUkw7XG5cdGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyhyZXF1ZXN0W0lOVEVSTkFMUyQyXS5oZWFkZXJzKTtcblxuXHQvLyBmZXRjaCBzdGVwIDEuM1xuXHRpZiAoIWhlYWRlcnMuaGFzKCdBY2NlcHQnKSkge1xuXHRcdGhlYWRlcnMuc2V0KCdBY2NlcHQnLCAnKi8qJyk7XG5cdH1cblxuXHQvLyBCYXNpYyBmZXRjaFxuXHRpZiAoIXBhcnNlZFVSTC5wcm90b2NvbCB8fCAhcGFyc2VkVVJMLmhvc3RuYW1lKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT25seSBhYnNvbHV0ZSBVUkxzIGFyZSBzdXBwb3J0ZWQnKTtcblx0fVxuXG5cdGlmICghL15odHRwcz86JC8udGVzdChwYXJzZWRVUkwucHJvdG9jb2wpKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT25seSBIVFRQKFMpIHByb3RvY29scyBhcmUgc3VwcG9ydGVkJyk7XG5cdH1cblxuXHRpZiAocmVxdWVzdC5zaWduYWwgJiYgcmVxdWVzdC5ib2R5IGluc3RhbmNlb2YgU3RyZWFtLlJlYWRhYmxlICYmICFzdHJlYW1EZXN0cnVjdGlvblN1cHBvcnRlZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignQ2FuY2VsbGF0aW9uIG9mIHN0cmVhbWVkIHJlcXVlc3RzIHdpdGggQWJvcnRTaWduYWwgaXMgbm90IHN1cHBvcnRlZCBpbiBub2RlIDwgOCcpO1xuXHR9XG5cblx0Ly8gSFRUUC1uZXR3b3JrLW9yLWNhY2hlIGZldGNoIHN0ZXBzIDIuNC0yLjdcblx0bGV0IGNvbnRlbnRMZW5ndGhWYWx1ZSA9IG51bGw7XG5cdGlmIChyZXF1ZXN0LmJvZHkgPT0gbnVsbCAmJiAvXihQT1NUfFBVVCkkL2kudGVzdChyZXF1ZXN0Lm1ldGhvZCkpIHtcblx0XHRjb250ZW50TGVuZ3RoVmFsdWUgPSAnMCc7XG5cdH1cblx0aWYgKHJlcXVlc3QuYm9keSAhPSBudWxsKSB7XG5cdFx0Y29uc3QgdG90YWxCeXRlcyA9IGdldFRvdGFsQnl0ZXMocmVxdWVzdCk7XG5cdFx0aWYgKHR5cGVvZiB0b3RhbEJ5dGVzID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y29udGVudExlbmd0aFZhbHVlID0gU3RyaW5nKHRvdGFsQnl0ZXMpO1xuXHRcdH1cblx0fVxuXHRpZiAoY29udGVudExlbmd0aFZhbHVlKSB7XG5cdFx0aGVhZGVycy5zZXQoJ0NvbnRlbnQtTGVuZ3RoJywgY29udGVudExlbmd0aFZhbHVlKTtcblx0fVxuXG5cdC8vIEhUVFAtbmV0d29yay1vci1jYWNoZSBmZXRjaCBzdGVwIDIuMTFcblx0aWYgKCFoZWFkZXJzLmhhcygnVXNlci1BZ2VudCcpKSB7XG5cdFx0aGVhZGVycy5zZXQoJ1VzZXItQWdlbnQnLCAnbm9kZS1mZXRjaC8xLjAgKCtodHRwczovL2dpdGh1Yi5jb20vYml0aW5uL25vZGUtZmV0Y2gpJyk7XG5cdH1cblxuXHQvLyBIVFRQLW5ldHdvcmstb3ItY2FjaGUgZmV0Y2ggc3RlcCAyLjE1XG5cdGlmIChyZXF1ZXN0LmNvbXByZXNzICYmICFoZWFkZXJzLmhhcygnQWNjZXB0LUVuY29kaW5nJykpIHtcblx0XHRoZWFkZXJzLnNldCgnQWNjZXB0LUVuY29kaW5nJywgJ2d6aXAsZGVmbGF0ZScpO1xuXHR9XG5cblx0bGV0IGFnZW50ID0gcmVxdWVzdC5hZ2VudDtcblx0aWYgKHR5cGVvZiBhZ2VudCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGFnZW50ID0gYWdlbnQocGFyc2VkVVJMKTtcblx0fVxuXG5cdGlmICghaGVhZGVycy5oYXMoJ0Nvbm5lY3Rpb24nKSAmJiAhYWdlbnQpIHtcblx0XHRoZWFkZXJzLnNldCgnQ29ubmVjdGlvbicsICdjbG9zZScpO1xuXHR9XG5cblx0Ly8gSFRUUC1uZXR3b3JrIGZldGNoIHN0ZXAgNC4yXG5cdC8vIGNodW5rZWQgZW5jb2RpbmcgaXMgaGFuZGxlZCBieSBOb2RlLmpzXG5cblx0cmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHBhcnNlZFVSTCwge1xuXHRcdG1ldGhvZDogcmVxdWVzdC5tZXRob2QsXG5cdFx0aGVhZGVyczogZXhwb3J0Tm9kZUNvbXBhdGlibGVIZWFkZXJzKGhlYWRlcnMpLFxuXHRcdGFnZW50XG5cdH0pO1xufVxuXG4vKipcbiAqIGFib3J0LWVycm9yLmpzXG4gKlxuICogQWJvcnRFcnJvciBpbnRlcmZhY2UgZm9yIGNhbmNlbGxlZCByZXF1ZXN0c1xuICovXG5cbi8qKlxuICogQ3JlYXRlIEFib3J0RXJyb3IgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gICBTdHJpbmcgICAgICBtZXNzYWdlICAgICAgRXJyb3IgbWVzc2FnZSBmb3IgaHVtYW5cbiAqIEByZXR1cm4gIEFib3J0RXJyb3JcbiAqL1xuZnVuY3Rpb24gQWJvcnRFcnJvcihtZXNzYWdlKSB7XG4gIEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgdGhpcy50eXBlID0gJ2Fib3J0ZWQnO1xuICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXG4gIC8vIGhpZGUgY3VzdG9tIGVycm9yIGltcGxlbWVudGF0aW9uIGRldGFpbHMgZnJvbSBlbmQtdXNlcnNcbiAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG59XG5cbkFib3J0RXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuQWJvcnRFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBBYm9ydEVycm9yO1xuQWJvcnRFcnJvci5wcm90b3R5cGUubmFtZSA9ICdBYm9ydEVycm9yJztcblxuLy8gZml4IGFuIGlzc3VlIHdoZXJlIFwiUGFzc1Rocm91Z2hcIiwgXCJyZXNvbHZlXCIgYXJlbid0IGEgbmFtZWQgZXhwb3J0IGZvciBub2RlIDwxMFxuY29uc3QgUGFzc1Rocm91Z2gkMSA9IFN0cmVhbS5QYXNzVGhyb3VnaDtcbmNvbnN0IHJlc29sdmVfdXJsID0gVXJsLnJlc29sdmU7XG5cbi8qKlxuICogRmV0Y2ggZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0gICBNaXhlZCAgICB1cmwgICBBYnNvbHV0ZSB1cmwgb3IgUmVxdWVzdCBpbnN0YW5jZVxuICogQHBhcmFtICAgT2JqZWN0ICAgb3B0cyAgRmV0Y2ggb3B0aW9uc1xuICogQHJldHVybiAgUHJvbWlzZVxuICovXG5mdW5jdGlvbiBmZXRjaCh1cmwsIG9wdHMpIHtcblxuXHQvLyBhbGxvdyBjdXN0b20gcHJvbWlzZVxuXHRpZiAoIWZldGNoLlByb21pc2UpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ25hdGl2ZSBwcm9taXNlIG1pc3NpbmcsIHNldCBmZXRjaC5Qcm9taXNlIHRvIHlvdXIgZmF2b3JpdGUgYWx0ZXJuYXRpdmUnKTtcblx0fVxuXG5cdEJvZHkuUHJvbWlzZSA9IGZldGNoLlByb21pc2U7XG5cblx0Ly8gd3JhcCBodHRwLnJlcXVlc3QgaW50byBmZXRjaFxuXHRyZXR1cm4gbmV3IGZldGNoLlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdC8vIGJ1aWxkIHJlcXVlc3Qgb2JqZWN0XG5cdFx0Y29uc3QgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KHVybCwgb3B0cyk7XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IGdldE5vZGVSZXF1ZXN0T3B0aW9ucyhyZXF1ZXN0KTtcblxuXHRcdGNvbnN0IHNlbmQgPSAob3B0aW9ucy5wcm90b2NvbCA9PT0gJ2h0dHBzOicgPyBodHRwcyA6IGh0dHApLnJlcXVlc3Q7XG5cdFx0Y29uc3Qgc2lnbmFsID0gcmVxdWVzdC5zaWduYWw7XG5cblx0XHRsZXQgcmVzcG9uc2UgPSBudWxsO1xuXG5cdFx0Y29uc3QgYWJvcnQgPSBmdW5jdGlvbiBhYm9ydCgpIHtcblx0XHRcdGxldCBlcnJvciA9IG5ldyBBYm9ydEVycm9yKCdUaGUgdXNlciBhYm9ydGVkIGEgcmVxdWVzdC4nKTtcblx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRpZiAocmVxdWVzdC5ib2R5ICYmIHJlcXVlc3QuYm9keSBpbnN0YW5jZW9mIFN0cmVhbS5SZWFkYWJsZSkge1xuXHRcdFx0XHRyZXF1ZXN0LmJvZHkuZGVzdHJveShlcnJvcik7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5ib2R5KSByZXR1cm47XG5cdFx0XHRyZXNwb25zZS5ib2R5LmVtaXQoJ2Vycm9yJywgZXJyb3IpO1xuXHRcdH07XG5cblx0XHRpZiAoc2lnbmFsICYmIHNpZ25hbC5hYm9ydGVkKSB7XG5cdFx0XHRhYm9ydCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFib3J0QW5kRmluYWxpemUgPSBmdW5jdGlvbiBhYm9ydEFuZEZpbmFsaXplKCkge1xuXHRcdFx0YWJvcnQoKTtcblx0XHRcdGZpbmFsaXplKCk7XG5cdFx0fTtcblxuXHRcdC8vIHNlbmQgcmVxdWVzdFxuXHRcdGNvbnN0IHJlcSA9IHNlbmQob3B0aW9ucyk7XG5cdFx0bGV0IHJlcVRpbWVvdXQ7XG5cblx0XHRpZiAoc2lnbmFsKSB7XG5cdFx0XHRzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydEFuZEZpbmFsaXplKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBmaW5hbGl6ZSgpIHtcblx0XHRcdHJlcS5hYm9ydCgpO1xuXHRcdFx0aWYgKHNpZ25hbCkgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgYWJvcnRBbmRGaW5hbGl6ZSk7XG5cdFx0XHRjbGVhclRpbWVvdXQocmVxVGltZW91dCk7XG5cdFx0fVxuXG5cdFx0aWYgKHJlcXVlc3QudGltZW91dCkge1xuXHRcdFx0cmVxLm9uY2UoJ3NvY2tldCcsIGZ1bmN0aW9uIChzb2NrZXQpIHtcblx0XHRcdFx0cmVxVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJlamVjdChuZXcgRmV0Y2hFcnJvcihgbmV0d29yayB0aW1lb3V0IGF0OiAke3JlcXVlc3QudXJsfWAsICdyZXF1ZXN0LXRpbWVvdXQnKSk7XG5cdFx0XHRcdFx0ZmluYWxpemUoKTtcblx0XHRcdFx0fSwgcmVxdWVzdC50aW1lb3V0KTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJlcS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRyZWplY3QobmV3IEZldGNoRXJyb3IoYHJlcXVlc3QgdG8gJHtyZXF1ZXN0LnVybH0gZmFpbGVkLCByZWFzb246ICR7ZXJyLm1lc3NhZ2V9YCwgJ3N5c3RlbScsIGVycikpO1xuXHRcdFx0ZmluYWxpemUoKTtcblx0XHR9KTtcblxuXHRcdHJlcS5vbigncmVzcG9uc2UnLCBmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRjbGVhclRpbWVvdXQocmVxVGltZW91dCk7XG5cblx0XHRcdGNvbnN0IGhlYWRlcnMgPSBjcmVhdGVIZWFkZXJzTGVuaWVudChyZXMuaGVhZGVycyk7XG5cblx0XHRcdC8vIEhUVFAgZmV0Y2ggc3RlcCA1XG5cdFx0XHRpZiAoZmV0Y2guaXNSZWRpcmVjdChyZXMuc3RhdHVzQ29kZSkpIHtcblx0XHRcdFx0Ly8gSFRUUCBmZXRjaCBzdGVwIDUuMlxuXHRcdFx0XHRjb25zdCBsb2NhdGlvbiA9IGhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpO1xuXG5cdFx0XHRcdC8vIEhUVFAgZmV0Y2ggc3RlcCA1LjNcblx0XHRcdFx0Y29uc3QgbG9jYXRpb25VUkwgPSBsb2NhdGlvbiA9PT0gbnVsbCA/IG51bGwgOiByZXNvbHZlX3VybChyZXF1ZXN0LnVybCwgbG9jYXRpb24pO1xuXG5cdFx0XHRcdC8vIEhUVFAgZmV0Y2ggc3RlcCA1LjVcblx0XHRcdFx0c3dpdGNoIChyZXF1ZXN0LnJlZGlyZWN0KSB7XG5cdFx0XHRcdFx0Y2FzZSAnZXJyb3InOlxuXHRcdFx0XHRcdFx0cmVqZWN0KG5ldyBGZXRjaEVycm9yKGByZWRpcmVjdCBtb2RlIGlzIHNldCB0byBlcnJvcjogJHtyZXF1ZXN0LnVybH1gLCAnbm8tcmVkaXJlY3QnKSk7XG5cdFx0XHRcdFx0XHRmaW5hbGl6ZSgpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdGNhc2UgJ21hbnVhbCc6XG5cdFx0XHRcdFx0XHQvLyBub2RlLWZldGNoLXNwZWNpZmljIHN0ZXA6IG1ha2UgbWFudWFsIHJlZGlyZWN0IGEgYml0IGVhc2llciB0byB1c2UgYnkgc2V0dGluZyB0aGUgTG9jYXRpb24gaGVhZGVyIHZhbHVlIHRvIHRoZSByZXNvbHZlZCBVUkwuXG5cdFx0XHRcdFx0XHRpZiAobG9jYXRpb25VUkwgIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0Ly8gaGFuZGxlIGNvcnJ1cHRlZCBoZWFkZXJcblx0XHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0XHRoZWFkZXJzLnNldCgnTG9jYXRpb24nLCBsb2NhdGlvblVSTCk7XG5cdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdFx0XHRcdC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0OiBub2RlanMgc2VydmVyIHByZXZlbnQgaW52YWxpZCByZXNwb25zZSBoZWFkZXJzLCB3ZSBjYW4ndCB0ZXN0IHRoaXMgdGhyb3VnaCBub3JtYWwgcmVxdWVzdFxuXHRcdFx0XHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdmb2xsb3cnOlxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDJcblx0XHRcdFx0XHRcdGlmIChsb2NhdGlvblVSTCA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDVcblx0XHRcdFx0XHRcdGlmIChyZXF1ZXN0LmNvdW50ZXIgPj0gcmVxdWVzdC5mb2xsb3cpIHtcblx0XHRcdFx0XHRcdFx0cmVqZWN0KG5ldyBGZXRjaEVycm9yKGBtYXhpbXVtIHJlZGlyZWN0IHJlYWNoZWQgYXQ6ICR7cmVxdWVzdC51cmx9YCwgJ21heC1yZWRpcmVjdCcpKTtcblx0XHRcdFx0XHRcdFx0ZmluYWxpemUoKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBIVFRQLXJlZGlyZWN0IGZldGNoIHN0ZXAgNiAoY291bnRlciBpbmNyZW1lbnQpXG5cdFx0XHRcdFx0XHQvLyBDcmVhdGUgYSBuZXcgUmVxdWVzdCBvYmplY3QuXG5cdFx0XHRcdFx0XHRjb25zdCByZXF1ZXN0T3B0cyA9IHtcblx0XHRcdFx0XHRcdFx0aGVhZGVyczogbmV3IEhlYWRlcnMocmVxdWVzdC5oZWFkZXJzKSxcblx0XHRcdFx0XHRcdFx0Zm9sbG93OiByZXF1ZXN0LmZvbGxvdyxcblx0XHRcdFx0XHRcdFx0Y291bnRlcjogcmVxdWVzdC5jb3VudGVyICsgMSxcblx0XHRcdFx0XHRcdFx0YWdlbnQ6IHJlcXVlc3QuYWdlbnQsXG5cdFx0XHRcdFx0XHRcdGNvbXByZXNzOiByZXF1ZXN0LmNvbXByZXNzLFxuXHRcdFx0XHRcdFx0XHRtZXRob2Q6IHJlcXVlc3QubWV0aG9kLFxuXHRcdFx0XHRcdFx0XHRib2R5OiByZXF1ZXN0LmJvZHksXG5cdFx0XHRcdFx0XHRcdHNpZ25hbDogcmVxdWVzdC5zaWduYWwsXG5cdFx0XHRcdFx0XHRcdHRpbWVvdXQ6IHJlcXVlc3QudGltZW91dFxuXHRcdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDlcblx0XHRcdFx0XHRcdGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMzAzICYmIHJlcXVlc3QuYm9keSAmJiBnZXRUb3RhbEJ5dGVzKHJlcXVlc3QpID09PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHJlamVjdChuZXcgRmV0Y2hFcnJvcignQ2Fubm90IGZvbGxvdyByZWRpcmVjdCB3aXRoIGJvZHkgYmVpbmcgYSByZWFkYWJsZSBzdHJlYW0nLCAndW5zdXBwb3J0ZWQtcmVkaXJlY3QnKSk7XG5cdFx0XHRcdFx0XHRcdGZpbmFsaXplKCk7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDExXG5cdFx0XHRcdFx0XHRpZiAocmVzLnN0YXR1c0NvZGUgPT09IDMwMyB8fCAocmVzLnN0YXR1c0NvZGUgPT09IDMwMSB8fCByZXMuc3RhdHVzQ29kZSA9PT0gMzAyKSAmJiByZXF1ZXN0Lm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG5cdFx0XHRcdFx0XHRcdHJlcXVlc3RPcHRzLm1ldGhvZCA9ICdHRVQnO1xuXHRcdFx0XHRcdFx0XHRyZXF1ZXN0T3B0cy5ib2R5ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdFx0XHRyZXF1ZXN0T3B0cy5oZWFkZXJzLmRlbGV0ZSgnY29udGVudC1sZW5ndGgnKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSFRUUC1yZWRpcmVjdCBmZXRjaCBzdGVwIDE1XG5cdFx0XHRcdFx0XHRyZXNvbHZlKGZldGNoKG5ldyBSZXF1ZXN0KGxvY2F0aW9uVVJMLCByZXF1ZXN0T3B0cykpKTtcblx0XHRcdFx0XHRcdGZpbmFsaXplKCk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gcHJlcGFyZSByZXNwb25zZVxuXHRcdFx0cmVzLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0aWYgKHNpZ25hbCkgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgYWJvcnRBbmRGaW5hbGl6ZSk7XG5cdFx0XHR9KTtcblx0XHRcdGxldCBib2R5ID0gcmVzLnBpcGUobmV3IFBhc3NUaHJvdWdoJDEoKSk7XG5cblx0XHRcdGNvbnN0IHJlc3BvbnNlX29wdGlvbnMgPSB7XG5cdFx0XHRcdHVybDogcmVxdWVzdC51cmwsXG5cdFx0XHRcdHN0YXR1czogcmVzLnN0YXR1c0NvZGUsXG5cdFx0XHRcdHN0YXR1c1RleHQ6IHJlcy5zdGF0dXNNZXNzYWdlLFxuXHRcdFx0XHRoZWFkZXJzOiBoZWFkZXJzLFxuXHRcdFx0XHRzaXplOiByZXF1ZXN0LnNpemUsXG5cdFx0XHRcdHRpbWVvdXQ6IHJlcXVlc3QudGltZW91dCxcblx0XHRcdFx0Y291bnRlcjogcmVxdWVzdC5jb3VudGVyXG5cdFx0XHR9O1xuXG5cdFx0XHQvLyBIVFRQLW5ldHdvcmsgZmV0Y2ggc3RlcCAxMi4xLjEuM1xuXHRcdFx0Y29uc3QgY29kaW5ncyA9IGhlYWRlcnMuZ2V0KCdDb250ZW50LUVuY29kaW5nJyk7XG5cblx0XHRcdC8vIEhUVFAtbmV0d29yayBmZXRjaCBzdGVwIDEyLjEuMS40OiBoYW5kbGUgY29udGVudCBjb2RpbmdzXG5cblx0XHRcdC8vIGluIGZvbGxvd2luZyBzY2VuYXJpb3Mgd2UgaWdub3JlIGNvbXByZXNzaW9uIHN1cHBvcnRcblx0XHRcdC8vIDEuIGNvbXByZXNzaW9uIHN1cHBvcnQgaXMgZGlzYWJsZWRcblx0XHRcdC8vIDIuIEhFQUQgcmVxdWVzdFxuXHRcdFx0Ly8gMy4gbm8gQ29udGVudC1FbmNvZGluZyBoZWFkZXJcblx0XHRcdC8vIDQuIG5vIGNvbnRlbnQgcmVzcG9uc2UgKDIwNClcblx0XHRcdC8vIDUuIGNvbnRlbnQgbm90IG1vZGlmaWVkIHJlc3BvbnNlICgzMDQpXG5cdFx0XHRpZiAoIXJlcXVlc3QuY29tcHJlc3MgfHwgcmVxdWVzdC5tZXRob2QgPT09ICdIRUFEJyB8fCBjb2RpbmdzID09PSBudWxsIHx8IHJlcy5zdGF0dXNDb2RlID09PSAyMDQgfHwgcmVzLnN0YXR1c0NvZGUgPT09IDMwNCkge1xuXHRcdFx0XHRyZXNwb25zZSA9IG5ldyBSZXNwb25zZShib2R5LCByZXNwb25zZV9vcHRpb25zKTtcblx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRm9yIE5vZGUgdjYrXG5cdFx0XHQvLyBCZSBsZXNzIHN0cmljdCB3aGVuIGRlY29kaW5nIGNvbXByZXNzZWQgcmVzcG9uc2VzLCBzaW5jZSBzb21ldGltZXNcblx0XHRcdC8vIHNlcnZlcnMgc2VuZCBzbGlnaHRseSBpbnZhbGlkIHJlc3BvbnNlcyB0aGF0IGFyZSBzdGlsbCBhY2NlcHRlZFxuXHRcdFx0Ly8gYnkgY29tbW9uIGJyb3dzZXJzLlxuXHRcdFx0Ly8gQWx3YXlzIHVzaW5nIFpfU1lOQ19GTFVTSCBpcyB3aGF0IGNVUkwgZG9lcy5cblx0XHRcdGNvbnN0IHpsaWJPcHRpb25zID0ge1xuXHRcdFx0XHRmbHVzaDogemxpYi5aX1NZTkNfRkxVU0gsXG5cdFx0XHRcdGZpbmlzaEZsdXNoOiB6bGliLlpfU1lOQ19GTFVTSFxuXHRcdFx0fTtcblxuXHRcdFx0Ly8gZm9yIGd6aXBcblx0XHRcdGlmIChjb2RpbmdzID09ICdnemlwJyB8fCBjb2RpbmdzID09ICd4LWd6aXAnKSB7XG5cdFx0XHRcdGJvZHkgPSBib2R5LnBpcGUoemxpYi5jcmVhdGVHdW56aXAoemxpYk9wdGlvbnMpKTtcblx0XHRcdFx0cmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UoYm9keSwgcmVzcG9uc2Vfb3B0aW9ucyk7XG5cdFx0XHRcdHJlc29sdmUocmVzcG9uc2UpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIGZvciBkZWZsYXRlXG5cdFx0XHRpZiAoY29kaW5ncyA9PSAnZGVmbGF0ZScgfHwgY29kaW5ncyA9PSAneC1kZWZsYXRlJykge1xuXHRcdFx0XHQvLyBoYW5kbGUgdGhlIGluZmFtb3VzIHJhdyBkZWZsYXRlIHJlc3BvbnNlIGZyb20gb2xkIHNlcnZlcnNcblx0XHRcdFx0Ly8gYSBoYWNrIGZvciBvbGQgSUlTIGFuZCBBcGFjaGUgc2VydmVyc1xuXHRcdFx0XHRjb25zdCByYXcgPSByZXMucGlwZShuZXcgUGFzc1Rocm91Z2gkMSgpKTtcblx0XHRcdFx0cmF3Lm9uY2UoJ2RhdGEnLCBmdW5jdGlvbiAoY2h1bmspIHtcblx0XHRcdFx0XHQvLyBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNzUxOTgyOFxuXHRcdFx0XHRcdGlmICgoY2h1bmtbMF0gJiAweDBGKSA9PT0gMHgwOCkge1xuXHRcdFx0XHRcdFx0Ym9keSA9IGJvZHkucGlwZSh6bGliLmNyZWF0ZUluZmxhdGUoKSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGJvZHkgPSBib2R5LnBpcGUoemxpYi5jcmVhdGVJbmZsYXRlUmF3KCkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXNwb25zZSA9IG5ldyBSZXNwb25zZShib2R5LCByZXNwb25zZV9vcHRpb25zKTtcblx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gZm9yIGJyXG5cdFx0XHRpZiAoY29kaW5ncyA9PSAnYnInICYmIHR5cGVvZiB6bGliLmNyZWF0ZUJyb3RsaURlY29tcHJlc3MgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Ym9keSA9IGJvZHkucGlwZSh6bGliLmNyZWF0ZUJyb3RsaURlY29tcHJlc3MoKSk7XG5cdFx0XHRcdHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKGJvZHksIHJlc3BvbnNlX29wdGlvbnMpO1xuXHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBvdGhlcndpc2UsIHVzZSByZXNwb25zZSBhcy1pc1xuXHRcdFx0cmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UoYm9keSwgcmVzcG9uc2Vfb3B0aW9ucyk7XG5cdFx0XHRyZXNvbHZlKHJlc3BvbnNlKTtcblx0XHR9KTtcblxuXHRcdHdyaXRlVG9TdHJlYW0ocmVxLCByZXF1ZXN0KTtcblx0fSk7XG59XG4vKipcbiAqIFJlZGlyZWN0IGNvZGUgbWF0Y2hpbmdcbiAqXG4gKiBAcGFyYW0gICBOdW1iZXIgICBjb2RlICBTdGF0dXMgY29kZVxuICogQHJldHVybiAgQm9vbGVhblxuICovXG5mZXRjaC5pc1JlZGlyZWN0ID0gZnVuY3Rpb24gKGNvZGUpIHtcblx0cmV0dXJuIGNvZGUgPT09IDMwMSB8fCBjb2RlID09PSAzMDIgfHwgY29kZSA9PT0gMzAzIHx8IGNvZGUgPT09IDMwNyB8fCBjb2RlID09PSAzMDg7XG59O1xuXG4vLyBleHBvc2UgUHJvbWlzZVxuZmV0Y2guUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlO1xuXG5mdW5jdGlvbiBnZXRfcGFnZV9oYW5kbGVyKFxuXHRtYW5pZmVzdCxcblx0c2Vzc2lvbl9nZXR0ZXJcbikge1xuXHRjb25zdCBnZXRfYnVpbGRfaW5mbyA9IGRldlxuXHRcdD8gKCkgPT4gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKGJ1aWxkX2RpciwgJ2J1aWxkLmpzb24nKSwgJ3V0Zi04JykpXG5cdFx0OiAoYXNzZXRzID0+ICgpID0+IGFzc2V0cykoSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKGJ1aWxkX2RpciwgJ2J1aWxkLmpzb24nKSwgJ3V0Zi04JykpKTtcblxuXHRjb25zdCB0ZW1wbGF0ZSA9IGRldlxuXHRcdD8gKCkgPT4gcmVhZF90ZW1wbGF0ZShzcmNfZGlyKVxuXHRcdDogKHN0ciA9PiAoKSA9PiBzdHIpKHJlYWRfdGVtcGxhdGUoYnVpbGRfZGlyKSk7XG5cblx0Y29uc3QgaGFzX3NlcnZpY2Vfd29ya2VyID0gZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYnVpbGRfZGlyLCAnc2VydmljZS13b3JrZXIuanMnKSk7XG5cblx0Y29uc3QgeyBzZXJ2ZXJfcm91dGVzLCBwYWdlcyB9ID0gbWFuaWZlc3Q7XG5cdGNvbnN0IGVycm9yX3JvdXRlID0gbWFuaWZlc3QuZXJyb3I7XG5cblx0ZnVuY3Rpb24gYmFpbChyZXEsIHJlcywgZXJyKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IGRldiA/IGVzY2FwZV9odG1sKGVyci5tZXNzYWdlKSA6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InO1xuXG5cdFx0cmVzLnN0YXR1c0NvZGUgPSA1MDA7XG5cdFx0cmVzLmVuZChgPHByZT4ke21lc3NhZ2V9PC9wcmU+YCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVfZXJyb3IocmVxLCByZXMsIHN0YXR1c0NvZGUsIGVycm9yKSB7XG5cdFx0aGFuZGxlX3BhZ2Uoe1xuXHRcdFx0cGF0dGVybjogbnVsbCxcblx0XHRcdHBhcnRzOiBbXG5cdFx0XHRcdHsgbmFtZTogbnVsbCwgY29tcG9uZW50OiBlcnJvcl9yb3V0ZSB9XG5cdFx0XHRdXG5cdFx0fSwgcmVxLCByZXMsIHN0YXR1c0NvZGUsIGVycm9yIHx8IG5ldyBFcnJvcignVW5rbm93biBlcnJvciBpbiBwcmVsb2FkIGZ1bmN0aW9uJykpO1xuXHR9XG5cblx0YXN5bmMgZnVuY3Rpb24gaGFuZGxlX3BhZ2UocGFnZSwgcmVxLCByZXMsIHN0YXR1cyA9IDIwMCwgZXJyb3IgPSBudWxsKSB7XG5cdFx0Y29uc3QgaXNfc2VydmljZV93b3JrZXJfaW5kZXggPSByZXEucGF0aCA9PT0gJy9zZXJ2aWNlLXdvcmtlci1pbmRleC5odG1sJztcblx0XHRjb25zdCBidWlsZF9pbmZvXG5cblxuXG5cbiA9IGdldF9idWlsZF9pbmZvKCk7XG5cblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAndGV4dC9odG1sJyk7XG5cdFx0cmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsIGRldiA/ICduby1jYWNoZScgOiAnbWF4LWFnZT02MDAnKTtcblxuXHRcdC8vIHByZWxvYWQgbWFpbi5qcyBhbmQgY3VycmVudCByb3V0ZVxuXHRcdC8vIFRPRE8gZGV0ZWN0IG90aGVyIHN0dWZmIHdlIGNhbiBwcmVsb2FkPyBpbWFnZXMsIENTUywgZm9udHM/XG5cdFx0bGV0IHByZWxvYWRlZF9jaHVua3MgPSBBcnJheS5pc0FycmF5KGJ1aWxkX2luZm8uYXNzZXRzLm1haW4pID8gYnVpbGRfaW5mby5hc3NldHMubWFpbiA6IFtidWlsZF9pbmZvLmFzc2V0cy5tYWluXTtcblx0XHRpZiAoIWVycm9yICYmICFpc19zZXJ2aWNlX3dvcmtlcl9pbmRleCkge1xuXHRcdFx0cGFnZS5wYXJ0cy5mb3JFYWNoKHBhcnQgPT4ge1xuXHRcdFx0XHRpZiAoIXBhcnQpIHJldHVybjtcblxuXHRcdFx0XHQvLyB1c2luZyBjb25jYXQgYmVjYXVzZSBpdCBjb3VsZCBiZSBhIHN0cmluZyBvciBhbiBhcnJheS4gdGhhbmtzIHdlYnBhY2shXG5cdFx0XHRcdHByZWxvYWRlZF9jaHVua3MgPSBwcmVsb2FkZWRfY2h1bmtzLmNvbmNhdChidWlsZF9pbmZvLmFzc2V0c1twYXJ0Lm5hbWVdKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChidWlsZF9pbmZvLmJ1bmRsZXIgPT09ICdyb2xsdXAnKSB7XG5cdFx0XHQvLyBUT0RPIGFkZCBkZXBlbmRlbmNpZXMgYW5kIENTU1xuXHRcdFx0Y29uc3QgbGluayA9IHByZWxvYWRlZF9jaHVua3Ncblx0XHRcdFx0LmZpbHRlcihmaWxlID0+IGZpbGUgJiYgIWZpbGUubWF0Y2goL1xcLm1hcCQvKSlcblx0XHRcdFx0Lm1hcChmaWxlID0+IGA8JHtyZXEuYmFzZVVybH0vY2xpZW50LyR7ZmlsZX0+O3JlbD1cIm1vZHVsZXByZWxvYWRcImApXG5cdFx0XHRcdC5qb2luKCcsICcpO1xuXG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdMaW5rJywgbGluayk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGxpbmsgPSBwcmVsb2FkZWRfY2h1bmtzXG5cdFx0XHRcdC5maWx0ZXIoZmlsZSA9PiBmaWxlICYmICFmaWxlLm1hdGNoKC9cXC5tYXAkLykpXG5cdFx0XHRcdC5tYXAoKGZpbGUpID0+IHtcblx0XHRcdFx0XHRjb25zdCBhcyA9IC9cXC5jc3MkLy50ZXN0KGZpbGUpID8gJ3N0eWxlJyA6ICdzY3JpcHQnO1xuXHRcdFx0XHRcdHJldHVybiBgPCR7cmVxLmJhc2VVcmx9L2NsaWVudC8ke2ZpbGV9PjtyZWw9XCJwcmVsb2FkXCI7YXM9XCIke2FzfVwiYDtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmpvaW4oJywgJyk7XG5cblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xpbmsnLCBsaW5rKTtcblx0XHR9XG5cblx0XHRjb25zdCBzZXNzaW9uID0gc2Vzc2lvbl9nZXR0ZXIocmVxLCByZXMpO1xuXG5cdFx0bGV0IHJlZGlyZWN0O1xuXHRcdGxldCBwcmVsb2FkX2Vycm9yO1xuXG5cdFx0Y29uc3QgcHJlbG9hZF9jb250ZXh0ID0ge1xuXHRcdFx0cmVkaXJlY3Q6IChzdGF0dXNDb2RlLCBsb2NhdGlvbikgPT4ge1xuXHRcdFx0XHRpZiAocmVkaXJlY3QgJiYgKHJlZGlyZWN0LnN0YXR1c0NvZGUgIT09IHN0YXR1c0NvZGUgfHwgcmVkaXJlY3QubG9jYXRpb24gIT09IGxvY2F0aW9uKSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgQ29uZmxpY3RpbmcgcmVkaXJlY3RzYCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0bG9jYXRpb24gPSBsb2NhdGlvbi5yZXBsYWNlKC9eXFwvL2csICcnKTsgLy8gbGVhZGluZyBzbGFzaCAob25seSlcblx0XHRcdFx0cmVkaXJlY3QgPSB7IHN0YXR1c0NvZGUsIGxvY2F0aW9uIH07XG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IChzdGF0dXNDb2RlLCBtZXNzYWdlKSA9PiB7XG5cdFx0XHRcdHByZWxvYWRfZXJyb3IgPSB7IHN0YXR1c0NvZGUsIG1lc3NhZ2UgfTtcblx0XHRcdH0sXG5cdFx0XHRmZXRjaDogKHVybCwgb3B0cykgPT4ge1xuXHRcdFx0XHRjb25zdCBwYXJzZWQgPSBuZXcgVXJsLlVSTCh1cmwsIGBodHRwOi8vMTI3LjAuMC4xOiR7cHJvY2Vzcy5lbnYuUE9SVH0ke3JlcS5iYXNlVXJsID8gcmVxLmJhc2VVcmwgKyAnLycgOicnfWApO1xuXG5cdFx0XHRcdGlmIChvcHRzKSB7XG5cdFx0XHRcdFx0b3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMpO1xuXG5cdFx0XHRcdFx0Y29uc3QgaW5jbHVkZV9jb29raWVzID0gKFxuXHRcdFx0XHRcdFx0b3B0cy5jcmVkZW50aWFscyA9PT0gJ2luY2x1ZGUnIHx8XG5cdFx0XHRcdFx0XHRvcHRzLmNyZWRlbnRpYWxzID09PSAnc2FtZS1vcmlnaW4nICYmIHBhcnNlZC5vcmlnaW4gPT09IGBodHRwOi8vMTI3LjAuMC4xOiR7cHJvY2Vzcy5lbnYuUE9SVH1gXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdGlmIChpbmNsdWRlX2Nvb2tpZXMpIHtcblx0XHRcdFx0XHRcdG9wdHMuaGVhZGVycyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMuaGVhZGVycyk7XG5cblx0XHRcdFx0XHRcdGNvbnN0IGNvb2tpZXMgPSBPYmplY3QuYXNzaWduKFxuXHRcdFx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHRcdFx0Y29va2llLnBhcnNlKHJlcS5oZWFkZXJzLmNvb2tpZSB8fCAnJyksXG5cdFx0XHRcdFx0XHRcdGNvb2tpZS5wYXJzZShvcHRzLmhlYWRlcnMuY29va2llIHx8ICcnKVxuXHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0Y29uc3Qgc2V0X2Nvb2tpZSA9IHJlcy5nZXRIZWFkZXIoJ1NldC1Db29raWUnKTtcblx0XHRcdFx0XHRcdChBcnJheS5pc0FycmF5KHNldF9jb29raWUpID8gc2V0X2Nvb2tpZSA6IFtzZXRfY29va2llXSkuZm9yRWFjaChzdHIgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBtYXRjaCA9IC8oW149XSspPShbXjtdKykvLmV4ZWMoc3RyKTtcblx0XHRcdFx0XHRcdFx0aWYgKG1hdGNoKSBjb29raWVzW21hdGNoWzFdXSA9IG1hdGNoWzJdO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdGNvbnN0IHN0ciA9IE9iamVjdC5rZXlzKGNvb2tpZXMpXG5cdFx0XHRcdFx0XHRcdC5tYXAoa2V5ID0+IGAke2tleX09JHtjb29raWVzW2tleV19YClcblx0XHRcdFx0XHRcdFx0LmpvaW4oJzsgJyk7XG5cblx0XHRcdFx0XHRcdG9wdHMuaGVhZGVycy5jb29raWUgPSBzdHI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGZldGNoKHBhcnNlZC5ocmVmLCBvcHRzKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0bGV0IHByZWxvYWRlZDtcblx0XHRsZXQgbWF0Y2g7XG5cdFx0bGV0IHBhcmFtcztcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByb290X3ByZWxvYWRlZCA9IG1hbmlmZXN0LnJvb3RfcHJlbG9hZFxuXHRcdFx0XHQ/IG1hbmlmZXN0LnJvb3RfcHJlbG9hZC5jYWxsKHByZWxvYWRfY29udGV4dCwge1xuXHRcdFx0XHRcdGhvc3Q6IHJlcS5oZWFkZXJzLmhvc3QsXG5cdFx0XHRcdFx0cGF0aDogcmVxLnBhdGgsXG5cdFx0XHRcdFx0cXVlcnk6IHJlcS5xdWVyeSxcblx0XHRcdFx0XHRwYXJhbXM6IHt9XG5cdFx0XHRcdH0sIHNlc3Npb24pXG5cdFx0XHRcdDoge307XG5cblx0XHRcdG1hdGNoID0gZXJyb3IgPyBudWxsIDogcGFnZS5wYXR0ZXJuLmV4ZWMocmVxLnBhdGgpO1xuXG5cblx0XHRcdGxldCB0b1ByZWxvYWQgPSBbcm9vdF9wcmVsb2FkZWRdO1xuXHRcdFx0aWYgKCFpc19zZXJ2aWNlX3dvcmtlcl9pbmRleCkge1xuXHRcdFx0XHR0b1ByZWxvYWQgPSB0b1ByZWxvYWQuY29uY2F0KHBhZ2UucGFydHMubWFwKHBhcnQgPT4ge1xuXHRcdFx0XHRcdGlmICghcGFydCkgcmV0dXJuIG51bGw7XG5cblx0XHRcdFx0XHQvLyB0aGUgZGVlcGVzdCBsZXZlbCBpcyB1c2VkIGJlbG93LCB0byBpbml0aWFsaXNlIHRoZSBzdG9yZVxuXHRcdFx0XHRcdHBhcmFtcyA9IHBhcnQucGFyYW1zID8gcGFydC5wYXJhbXMobWF0Y2gpIDoge307XG5cblx0XHRcdFx0XHRyZXR1cm4gcGFydC5wcmVsb2FkXG5cdFx0XHRcdFx0XHQ/IHBhcnQucHJlbG9hZC5jYWxsKHByZWxvYWRfY29udGV4dCwge1xuXHRcdFx0XHRcdFx0XHRob3N0OiByZXEuaGVhZGVycy5ob3N0LFxuXHRcdFx0XHRcdFx0XHRwYXRoOiByZXEucGF0aCxcblx0XHRcdFx0XHRcdFx0cXVlcnk6IHJlcS5xdWVyeSxcblx0XHRcdFx0XHRcdFx0cGFyYW1zXG5cdFx0XHRcdFx0XHR9LCBzZXNzaW9uKVxuXHRcdFx0XHRcdFx0OiB7fTtcblx0XHRcdFx0fSkpO1xuXHRcdFx0fVxuXG5cdFx0XHRwcmVsb2FkZWQgPSBhd2FpdCBQcm9taXNlLmFsbCh0b1ByZWxvYWQpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdHJldHVybiBiYWlsKHJlcSwgcmVzLCBlcnIpXG5cdFx0XHR9XG5cblx0XHRcdHByZWxvYWRfZXJyb3IgPSB7IHN0YXR1c0NvZGU6IDUwMCwgbWVzc2FnZTogZXJyIH07XG5cdFx0XHRwcmVsb2FkZWQgPSBbXTsgLy8gYXBwZWFzZSBUeXBlU2NyaXB0XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChyZWRpcmVjdCkge1xuXHRcdFx0XHRjb25zdCBsb2NhdGlvbiA9IFVybC5yZXNvbHZlKChyZXEuYmFzZVVybCB8fCAnJykgKyAnLycsIHJlZGlyZWN0LmxvY2F0aW9uKTtcblxuXHRcdFx0XHRyZXMuc3RhdHVzQ29kZSA9IHJlZGlyZWN0LnN0YXR1c0NvZGU7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgbG9jYXRpb24pO1xuXHRcdFx0XHRyZXMuZW5kKCk7XG5cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocHJlbG9hZF9lcnJvcikge1xuXHRcdFx0XHRoYW5kbGVfZXJyb3IocmVxLCByZXMsIHByZWxvYWRfZXJyb3Iuc3RhdHVzQ29kZSwgcHJlbG9hZF9lcnJvci5tZXNzYWdlKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzZWdtZW50cyA9IHJlcS5wYXRoLnNwbGl0KCcvJykuZmlsdGVyKEJvb2xlYW4pO1xuXG5cdFx0XHQvLyBUT0RPIG1ha2UgdGhpcyBsZXNzIGNvbmZ1c2luZ1xuXHRcdFx0Y29uc3QgbGF5b3V0X3NlZ21lbnRzID0gW3NlZ21lbnRzWzBdXTtcblx0XHRcdGxldCBsID0gMTtcblxuXHRcdFx0cGFnZS5wYXJ0cy5mb3JFYWNoKChwYXJ0LCBpKSA9PiB7XG5cdFx0XHRcdGxheW91dF9zZWdtZW50c1tsXSA9IHNlZ21lbnRzW2kgKyAxXTtcblx0XHRcdFx0aWYgKCFwYXJ0KSByZXR1cm4gbnVsbDtcblx0XHRcdFx0bCsrO1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IHByb3BzID0ge1xuXHRcdFx0XHRzdG9yZXM6IHtcblx0XHRcdFx0XHRwYWdlOiB7XG5cdFx0XHRcdFx0XHRzdWJzY3JpYmU6IHdyaXRhYmxlKHtcblx0XHRcdFx0XHRcdFx0aG9zdDogcmVxLmhlYWRlcnMuaG9zdCxcblx0XHRcdFx0XHRcdFx0cGF0aDogcmVxLnBhdGgsXG5cdFx0XHRcdFx0XHRcdHF1ZXJ5OiByZXEucXVlcnksXG5cdFx0XHRcdFx0XHRcdHBhcmFtc1xuXHRcdFx0XHRcdFx0fSkuc3Vic2NyaWJlXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRwcmVsb2FkaW5nOiB7XG5cdFx0XHRcdFx0XHRzdWJzY3JpYmU6IHdyaXRhYmxlKG51bGwpLnN1YnNjcmliZVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0c2Vzc2lvbjogd3JpdGFibGUoc2Vzc2lvbilcblx0XHRcdFx0fSxcblx0XHRcdFx0c2VnbWVudHM6IGxheW91dF9zZWdtZW50cyxcblx0XHRcdFx0c3RhdHVzOiBlcnJvciA/IHN0YXR1cyA6IDIwMCxcblx0XHRcdFx0ZXJyb3I6IGVycm9yID8gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogeyBtZXNzYWdlOiBlcnJvciB9IDogbnVsbCxcblx0XHRcdFx0bGV2ZWwwOiB7XG5cdFx0XHRcdFx0cHJvcHM6IHByZWxvYWRlZFswXVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRsZXZlbDE6IHtcblx0XHRcdFx0XHRzZWdtZW50OiBzZWdtZW50c1swXSxcblx0XHRcdFx0XHRwcm9wczoge31cblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKCFpc19zZXJ2aWNlX3dvcmtlcl9pbmRleCkge1xuXHRcdFx0XHRsZXQgbCA9IDE7XG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgcGFnZS5wYXJ0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGNvbnN0IHBhcnQgPSBwYWdlLnBhcnRzW2ldO1xuXHRcdFx0XHRcdGlmICghcGFydCkgY29udGludWU7XG5cblx0XHRcdFx0XHRwcm9wc1tgbGV2ZWwke2wrK31gXSA9IHtcblx0XHRcdFx0XHRcdGNvbXBvbmVudDogcGFydC5jb21wb25lbnQsXG5cdFx0XHRcdFx0XHRwcm9wczogcHJlbG9hZGVkW2kgKyAxXSB8fCB7fSxcblx0XHRcdFx0XHRcdHNlZ21lbnQ6IHNlZ21lbnRzW2ldXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB7IGh0bWwsIGhlYWQsIGNzcyB9ID0gQXBwLnJlbmRlcihwcm9wcyk7XG5cblx0XHRcdGNvbnN0IHNlcmlhbGl6ZWQgPSB7XG5cdFx0XHRcdHByZWxvYWRlZDogYFske3ByZWxvYWRlZC5tYXAoZGF0YSA9PiB0cnlfc2VyaWFsaXplKGRhdGEpKS5qb2luKCcsJyl9XWAsXG5cdFx0XHRcdHNlc3Npb246IHNlc3Npb24gJiYgdHJ5X3NlcmlhbGl6ZShzZXNzaW9uLCBlcnIgPT4ge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHNlcmlhbGl6ZSBzZXNzaW9uIGRhdGE6ICR7ZXJyLm1lc3NhZ2V9YCk7XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRlcnJvcjogZXJyb3IgJiYgdHJ5X3NlcmlhbGl6ZShwcm9wcy5lcnJvcilcblx0XHRcdH07XG5cblx0XHRcdGxldCBzY3JpcHQgPSBgX19TQVBQRVJfXz17JHtbXG5cdFx0XHRcdGVycm9yICYmIGBlcnJvcjoke3NlcmlhbGl6ZWQuZXJyb3J9LHN0YXR1czoke3N0YXR1c31gLFxuXHRcdFx0XHRgYmFzZVVybDpcIiR7cmVxLmJhc2VVcmx9XCJgLFxuXHRcdFx0XHRzZXJpYWxpemVkLnByZWxvYWRlZCAmJiBgcHJlbG9hZGVkOiR7c2VyaWFsaXplZC5wcmVsb2FkZWR9YCxcblx0XHRcdFx0c2VyaWFsaXplZC5zZXNzaW9uICYmIGBzZXNzaW9uOiR7c2VyaWFsaXplZC5zZXNzaW9ufWBcblx0XHRcdF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oJywnKX19O2A7XG5cblx0XHRcdGlmIChoYXNfc2VydmljZV93b3JrZXIpIHtcblx0XHRcdFx0c2NyaXB0ICs9IGBpZignc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcke3JlcS5iYXNlVXJsfS9zZXJ2aWNlLXdvcmtlci5qcycpO2A7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGZpbGUgPSBbXS5jb25jYXQoYnVpbGRfaW5mby5hc3NldHMubWFpbikuZmlsdGVyKGZpbGUgPT4gZmlsZSAmJiAvXFwuanMkLy50ZXN0KGZpbGUpKVswXTtcblx0XHRcdGNvbnN0IG1haW4gPSBgJHtyZXEuYmFzZVVybH0vY2xpZW50LyR7ZmlsZX1gO1xuXG5cdFx0XHRpZiAoYnVpbGRfaW5mby5idW5kbGVyID09PSAncm9sbHVwJykge1xuXHRcdFx0XHRpZiAoYnVpbGRfaW5mby5sZWdhY3lfYXNzZXRzKSB7XG5cdFx0XHRcdFx0Y29uc3QgbGVnYWN5X21haW4gPSBgJHtyZXEuYmFzZVVybH0vY2xpZW50L2xlZ2FjeS8ke2J1aWxkX2luZm8ubGVnYWN5X2Fzc2V0cy5tYWlufWA7XG5cdFx0XHRcdFx0c2NyaXB0ICs9IGAoZnVuY3Rpb24oKXt0cnl7ZXZhbChcImFzeW5jIGZ1bmN0aW9uIHgoKXt9XCIpO3ZhciBtYWluPVwiJHttYWlufVwifWNhdGNoKGUpe21haW49XCIke2xlZ2FjeV9tYWlufVwifTt2YXIgcz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO3RyeXtuZXcgRnVuY3Rpb24oXCJpZigwKWltcG9ydCgnJylcIikoKTtzLnNyYz1tYWluO3MudHlwZT1cIm1vZHVsZVwiO3MuY3Jvc3NPcmlnaW49XCJ1c2UtY3JlZGVudGlhbHNcIjt9Y2F0Y2goZSl7cy5zcmM9XCIke3JlcS5iYXNlVXJsfS9jbGllbnQvc2hpbXBvcnRAJHtidWlsZF9pbmZvLnNoaW1wb3J0fS5qc1wiO3Muc2V0QXR0cmlidXRlKFwiZGF0YS1tYWluXCIsbWFpbik7fWRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQocyk7fSgpKTtgO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNjcmlwdCArPSBgdmFyIHM9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTt0cnl7bmV3IEZ1bmN0aW9uKFwiaWYoMClpbXBvcnQoJycpXCIpKCk7cy5zcmM9XCIke21haW59XCI7cy50eXBlPVwibW9kdWxlXCI7cy5jcm9zc09yaWdpbj1cInVzZS1jcmVkZW50aWFsc1wiO31jYXRjaChlKXtzLnNyYz1cIiR7cmVxLmJhc2VVcmx9L2NsaWVudC9zaGltcG9ydEAke2J1aWxkX2luZm8uc2hpbXBvcnR9LmpzXCI7cy5zZXRBdHRyaWJ1dGUoXCJkYXRhLW1haW5cIixcIiR7bWFpbn1cIil9ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKWA7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNjcmlwdCArPSBgPC9zY3JpcHQ+PHNjcmlwdCBzcmM9XCIke21haW59XCI+YDtcblx0XHRcdH1cblxuXHRcdFx0bGV0IHN0eWxlcztcblxuXHRcdFx0Ly8gVE9ETyBtYWtlIHRoaXMgY29uc2lzdGVudCBhY3Jvc3MgYXBwc1xuXHRcdFx0Ly8gVE9ETyBlbWJlZCBidWlsZF9pbmZvIGluIHBsYWNlaG9sZGVyLnRzXG5cdFx0XHRpZiAoYnVpbGRfaW5mby5jc3MgJiYgYnVpbGRfaW5mby5jc3MubWFpbikge1xuXHRcdFx0XHRjb25zdCBjc3NfY2h1bmtzID0gbmV3IFNldCgpO1xuXHRcdFx0XHRpZiAoYnVpbGRfaW5mby5jc3MubWFpbikgY3NzX2NodW5rcy5hZGQoYnVpbGRfaW5mby5jc3MubWFpbik7XG5cdFx0XHRcdHBhZ2UucGFydHMuZm9yRWFjaChwYXJ0ID0+IHtcblx0XHRcdFx0XHRpZiAoIXBhcnQpIHJldHVybjtcblx0XHRcdFx0XHRjb25zdCBjc3NfY2h1bmtzX2Zvcl9wYXJ0ID0gYnVpbGRfaW5mby5jc3MuY2h1bmtzW3BhcnQuZmlsZV07XG5cblx0XHRcdFx0XHRpZiAoY3NzX2NodW5rc19mb3JfcGFydCkge1xuXHRcdFx0XHRcdFx0Y3NzX2NodW5rc19mb3JfcGFydC5mb3JFYWNoKGZpbGUgPT4ge1xuXHRcdFx0XHRcdFx0XHRjc3NfY2h1bmtzLmFkZChmaWxlKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0c3R5bGVzID0gQXJyYXkuZnJvbShjc3NfY2h1bmtzKVxuXHRcdFx0XHRcdC5tYXAoaHJlZiA9PiBgPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIGhyZWY9XCJjbGllbnQvJHtocmVmfVwiPmApXG5cdFx0XHRcdFx0LmpvaW4oJycpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c3R5bGVzID0gKGNzcyAmJiBjc3MuY29kZSA/IGA8c3R5bGU+JHtjc3MuY29kZX08L3N0eWxlPmAgOiAnJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHVzZXJzIGNhbiBzZXQgYSBDU1Agbm9uY2UgdXNpbmcgcmVzLmxvY2Fscy5ub25jZVxuXHRcdFx0Y29uc3Qgbm9uY2VfYXR0ciA9IChyZXMubG9jYWxzICYmIHJlcy5sb2NhbHMubm9uY2UpID8gYCBub25jZT1cIiR7cmVzLmxvY2Fscy5ub25jZX1cImAgOiAnJztcblxuXHRcdFx0Y29uc3QgYm9keSA9IHRlbXBsYXRlKClcblx0XHRcdFx0LnJlcGxhY2UoJyVzYXBwZXIuYmFzZSUnLCAoKSA9PiBgPGJhc2UgaHJlZj1cIiR7cmVxLmJhc2VVcmx9L1wiPmApXG5cdFx0XHRcdC5yZXBsYWNlKCclc2FwcGVyLnNjcmlwdHMlJywgKCkgPT4gYDxzY3JpcHQke25vbmNlX2F0dHJ9PiR7c2NyaXB0fTwvc2NyaXB0PmApXG5cdFx0XHRcdC5yZXBsYWNlKCclc2FwcGVyLmh0bWwlJywgKCkgPT4gaHRtbClcblx0XHRcdFx0LnJlcGxhY2UoJyVzYXBwZXIuaGVhZCUnLCAoKSA9PiBgPG5vc2NyaXB0IGlkPSdzYXBwZXItaGVhZC1zdGFydCc+PC9ub3NjcmlwdD4ke2hlYWR9PG5vc2NyaXB0IGlkPSdzYXBwZXItaGVhZC1lbmQnPjwvbm9zY3JpcHQ+YClcblx0XHRcdFx0LnJlcGxhY2UoJyVzYXBwZXIuc3R5bGVzJScsICgpID0+IHN0eWxlcyk7XG5cblx0XHRcdHJlcy5zdGF0dXNDb2RlID0gc3RhdHVzO1xuXHRcdFx0cmVzLmVuZChib2R5KTtcblx0XHR9IGNhdGNoKGVycikge1xuXHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdGJhaWwocmVxLCByZXMsIGVycik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRoYW5kbGVfZXJyb3IocmVxLCByZXMsIDUwMCwgZXJyKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZnVuY3Rpb24gZmluZF9yb3V0ZShyZXEsIHJlcywgbmV4dCkge1xuXHRcdGlmIChyZXEucGF0aCA9PT0gJy9zZXJ2aWNlLXdvcmtlci1pbmRleC5odG1sJykge1xuXHRcdFx0Y29uc3QgaG9tZVBhZ2UgPSBwYWdlcy5maW5kKHBhZ2UgPT4gcGFnZS5wYXR0ZXJuLnRlc3QoJy8nKSk7XG5cdFx0XHRoYW5kbGVfcGFnZShob21lUGFnZSwgcmVxLCByZXMpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgcGFnZSBvZiBwYWdlcykge1xuXHRcdFx0aWYgKHBhZ2UucGF0dGVybi50ZXN0KHJlcS5wYXRoKSkge1xuXHRcdFx0XHRoYW5kbGVfcGFnZShwYWdlLCByZXEsIHJlcyk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRoYW5kbGVfZXJyb3IocmVxLCByZXMsIDQwNCwgJ05vdCBmb3VuZCcpO1xuXHR9O1xufVxuXG5mdW5jdGlvbiByZWFkX3RlbXBsYXRlKGRpciA9IGJ1aWxkX2Rpcikge1xuXHRyZXR1cm4gZnMucmVhZEZpbGVTeW5jKGAke2Rpcn0vdGVtcGxhdGUuaHRtbGAsICd1dGYtOCcpO1xufVxuXG5mdW5jdGlvbiB0cnlfc2VyaWFsaXplKGRhdGEsIGZhaWwpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gZGV2YWx1ZShkYXRhKTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0aWYgKGZhaWwpIGZhaWwoZXJyKTtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxufVxuXG5mdW5jdGlvbiBlc2NhcGVfaHRtbChodG1sKSB7XG5cdGNvbnN0IGNoYXJzID0ge1xuXHRcdCdcIicgOiAncXVvdCcsXG5cdFx0XCInXCI6ICcjMzknLFxuXHRcdCcmJzogJ2FtcCcsXG5cdFx0JzwnIDogJ2x0Jyxcblx0XHQnPicgOiAnZ3QnXG5cdH07XG5cblx0cmV0dXJuIGh0bWwucmVwbGFjZSgvW1wiJyY8Pl0vZywgYyA9PiBgJiR7Y2hhcnNbY119O2ApO1xufVxuXG52YXIgbWltZV9yYXcgPSBcImFwcGxpY2F0aW9uL2FuZHJldy1pbnNldFxcdFxcdFxcdGV6XFxuYXBwbGljYXRpb24vYXBwbGl4d2FyZVxcdFxcdFxcdFxcdGF3XFxuYXBwbGljYXRpb24vYXRvbSt4bWxcXHRcXHRcXHRcXHRhdG9tXFxuYXBwbGljYXRpb24vYXRvbWNhdCt4bWxcXHRcXHRcXHRcXHRhdG9tY2F0XFxuYXBwbGljYXRpb24vYXRvbXN2Yyt4bWxcXHRcXHRcXHRcXHRhdG9tc3ZjXFxuYXBwbGljYXRpb24vY2N4bWwreG1sXFx0XFx0XFx0XFx0Y2N4bWxcXG5hcHBsaWNhdGlvbi9jZG1pLWNhcGFiaWxpdHlcXHRcXHRcXHRjZG1pYVxcbmFwcGxpY2F0aW9uL2NkbWktY29udGFpbmVyXFx0XFx0XFx0Y2RtaWNcXG5hcHBsaWNhdGlvbi9jZG1pLWRvbWFpblxcdFxcdFxcdFxcdGNkbWlkXFxuYXBwbGljYXRpb24vY2RtaS1vYmplY3RcXHRcXHRcXHRcXHRjZG1pb1xcbmFwcGxpY2F0aW9uL2NkbWktcXVldWVcXHRcXHRcXHRcXHRjZG1pcVxcbmFwcGxpY2F0aW9uL2N1LXNlZW1lXFx0XFx0XFx0XFx0Y3VcXG5hcHBsaWNhdGlvbi9kYXZtb3VudCt4bWxcXHRcXHRcXHRkYXZtb3VudFxcbmFwcGxpY2F0aW9uL2RvY2Jvb2sreG1sXFx0XFx0XFx0XFx0ZGJrXFxuYXBwbGljYXRpb24vZHNzYytkZXJcXHRcXHRcXHRcXHRkc3NjXFxuYXBwbGljYXRpb24vZHNzYyt4bWxcXHRcXHRcXHRcXHR4ZHNzY1xcbmFwcGxpY2F0aW9uL2VjbWFzY3JpcHRcXHRcXHRcXHRcXHRlY21hXFxuYXBwbGljYXRpb24vZW1tYSt4bWxcXHRcXHRcXHRcXHRlbW1hXFxuYXBwbGljYXRpb24vZXB1Yit6aXBcXHRcXHRcXHRcXHRlcHViXFxuYXBwbGljYXRpb24vZXhpXFx0XFx0XFx0XFx0XFx0ZXhpXFxuYXBwbGljYXRpb24vZm9udC10ZHBmclxcdFxcdFxcdFxcdHBmclxcbmFwcGxpY2F0aW9uL2dtbCt4bWxcXHRcXHRcXHRcXHRnbWxcXG5hcHBsaWNhdGlvbi9ncHgreG1sXFx0XFx0XFx0XFx0Z3B4XFxuYXBwbGljYXRpb24vZ3hmXFx0XFx0XFx0XFx0XFx0Z3hmXFxuYXBwbGljYXRpb24vaHlwZXJzdHVkaW9cXHRcXHRcXHRcXHRzdGtcXG5hcHBsaWNhdGlvbi9pbmttbCt4bWxcXHRcXHRcXHRcXHRpbmsgaW5rbWxcXG5hcHBsaWNhdGlvbi9pcGZpeFxcdFxcdFxcdFxcdGlwZml4XFxuYXBwbGljYXRpb24vamF2YS1hcmNoaXZlXFx0XFx0XFx0amFyXFxuYXBwbGljYXRpb24vamF2YS1zZXJpYWxpemVkLW9iamVjdFxcdFxcdHNlclxcbmFwcGxpY2F0aW9uL2phdmEtdm1cXHRcXHRcXHRcXHRjbGFzc1xcbmFwcGxpY2F0aW9uL2phdmFzY3JpcHRcXHRcXHRcXHRcXHRqc1xcbmFwcGxpY2F0aW9uL2pzb25cXHRcXHRcXHRcXHRqc29uIG1hcFxcbmFwcGxpY2F0aW9uL2pzb25tbCtqc29uXFx0XFx0XFx0XFx0anNvbm1sXFxuYXBwbGljYXRpb24vbG9zdCt4bWxcXHRcXHRcXHRcXHRsb3N0eG1sXFxuYXBwbGljYXRpb24vbWFjLWJpbmhleDQwXFx0XFx0XFx0aHF4XFxuYXBwbGljYXRpb24vbWFjLWNvbXBhY3Rwcm9cXHRcXHRcXHRjcHRcXG5hcHBsaWNhdGlvbi9tYWRzK3htbFxcdFxcdFxcdFxcdG1hZHNcXG5hcHBsaWNhdGlvbi9tYXJjXFx0XFx0XFx0XFx0bXJjXFxuYXBwbGljYXRpb24vbWFyY3htbCt4bWxcXHRcXHRcXHRcXHRtcmN4XFxuYXBwbGljYXRpb24vbWF0aGVtYXRpY2FcXHRcXHRcXHRcXHRtYSBuYiBtYlxcbmFwcGxpY2F0aW9uL21hdGhtbCt4bWxcXHRcXHRcXHRcXHRtYXRobWxcXG5hcHBsaWNhdGlvbi9tYm94XFx0XFx0XFx0XFx0bWJveFxcbmFwcGxpY2F0aW9uL21lZGlhc2VydmVyY29udHJvbCt4bWxcXHRcXHRtc2NtbFxcbmFwcGxpY2F0aW9uL21ldGFsaW5rK3htbFxcdFxcdFxcdG1ldGFsaW5rXFxuYXBwbGljYXRpb24vbWV0YWxpbms0K3htbFxcdFxcdFxcdG1ldGE0XFxuYXBwbGljYXRpb24vbWV0cyt4bWxcXHRcXHRcXHRcXHRtZXRzXFxuYXBwbGljYXRpb24vbW9kcyt4bWxcXHRcXHRcXHRcXHRtb2RzXFxuYXBwbGljYXRpb24vbXAyMVxcdFxcdFxcdFxcdG0yMSBtcDIxXFxuYXBwbGljYXRpb24vbXA0XFx0XFx0XFx0XFx0XFx0bXA0c1xcbmFwcGxpY2F0aW9uL21zd29yZFxcdFxcdFxcdFxcdGRvYyBkb3RcXG5hcHBsaWNhdGlvbi9teGZcXHRcXHRcXHRcXHRcXHRteGZcXG5hcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cXHRiaW4gZG1zIGxyZiBtYXIgc28gZGlzdCBkaXN0eiBwa2cgYnBrIGR1bXAgZWxjIGRlcGxveVxcbmFwcGxpY2F0aW9uL29kYVxcdFxcdFxcdFxcdFxcdG9kYVxcbmFwcGxpY2F0aW9uL29lYnBzLXBhY2thZ2UreG1sXFx0XFx0XFx0b3BmXFxuYXBwbGljYXRpb24vb2dnXFx0XFx0XFx0XFx0XFx0b2d4XFxuYXBwbGljYXRpb24vb21kb2MreG1sXFx0XFx0XFx0XFx0b21kb2NcXG5hcHBsaWNhdGlvbi9vbmVub3RlXFx0XFx0XFx0XFx0b25ldG9jIG9uZXRvYzIgb25ldG1wIG9uZXBrZ1xcbmFwcGxpY2F0aW9uL294cHNcXHRcXHRcXHRcXHRveHBzXFxuYXBwbGljYXRpb24vcGF0Y2gtb3BzLWVycm9yK3htbFxcdFxcdFxcdHhlclxcbmFwcGxpY2F0aW9uL3BkZlxcdFxcdFxcdFxcdFxcdHBkZlxcbmFwcGxpY2F0aW9uL3BncC1lbmNyeXB0ZWRcXHRcXHRcXHRwZ3BcXG5hcHBsaWNhdGlvbi9wZ3Atc2lnbmF0dXJlXFx0XFx0XFx0YXNjIHNpZ1xcbmFwcGxpY2F0aW9uL3BpY3MtcnVsZXNcXHRcXHRcXHRcXHRwcmZcXG5hcHBsaWNhdGlvbi9wa2NzMTBcXHRcXHRcXHRcXHRwMTBcXG5hcHBsaWNhdGlvbi9wa2NzNy1taW1lXFx0XFx0XFx0XFx0cDdtIHA3Y1xcbmFwcGxpY2F0aW9uL3BrY3M3LXNpZ25hdHVyZVxcdFxcdFxcdHA3c1xcbmFwcGxpY2F0aW9uL3BrY3M4XFx0XFx0XFx0XFx0cDhcXG5hcHBsaWNhdGlvbi9wa2l4LWF0dHItY2VydFxcdFxcdFxcdGFjXFxuYXBwbGljYXRpb24vcGtpeC1jZXJ0XFx0XFx0XFx0XFx0Y2VyXFxuYXBwbGljYXRpb24vcGtpeC1jcmxcXHRcXHRcXHRcXHRjcmxcXG5hcHBsaWNhdGlvbi9wa2l4LXBraXBhdGhcXHRcXHRcXHRwa2lwYXRoXFxuYXBwbGljYXRpb24vcGtpeGNtcFxcdFxcdFxcdFxcdHBraVxcbmFwcGxpY2F0aW9uL3Bscyt4bWxcXHRcXHRcXHRcXHRwbHNcXG5hcHBsaWNhdGlvbi9wb3N0c2NyaXB0XFx0XFx0XFx0XFx0YWkgZXBzIHBzXFxuYXBwbGljYXRpb24vcHJzLmN3d1xcdFxcdFxcdFxcdGN3d1xcbmFwcGxpY2F0aW9uL3Bza2MreG1sXFx0XFx0XFx0XFx0cHNrY3htbFxcbmFwcGxpY2F0aW9uL3JkZit4bWxcXHRcXHRcXHRcXHRyZGZcXG5hcHBsaWNhdGlvbi9yZWdpbmZvK3htbFxcdFxcdFxcdFxcdHJpZlxcbmFwcGxpY2F0aW9uL3JlbGF4LW5nLWNvbXBhY3Qtc3ludGF4XFx0XFx0cm5jXFxuYXBwbGljYXRpb24vcmVzb3VyY2UtbGlzdHMreG1sXFx0XFx0XFx0cmxcXG5hcHBsaWNhdGlvbi9yZXNvdXJjZS1saXN0cy1kaWZmK3htbFxcdFxcdHJsZFxcbmFwcGxpY2F0aW9uL3Jscy1zZXJ2aWNlcyt4bWxcXHRcXHRcXHRyc1xcbmFwcGxpY2F0aW9uL3Jwa2ktZ2hvc3RidXN0ZXJzXFx0XFx0XFx0Z2JyXFxuYXBwbGljYXRpb24vcnBraS1tYW5pZmVzdFxcdFxcdFxcdG1mdFxcbmFwcGxpY2F0aW9uL3Jwa2ktcm9hXFx0XFx0XFx0XFx0cm9hXFxuYXBwbGljYXRpb24vcnNkK3htbFxcdFxcdFxcdFxcdHJzZFxcbmFwcGxpY2F0aW9uL3Jzcyt4bWxcXHRcXHRcXHRcXHRyc3NcXG5hcHBsaWNhdGlvbi9ydGZcXHRcXHRcXHRcXHRcXHRydGZcXG5hcHBsaWNhdGlvbi9zYm1sK3htbFxcdFxcdFxcdFxcdHNibWxcXG5hcHBsaWNhdGlvbi9zY3ZwLWN2LXJlcXVlc3RcXHRcXHRcXHRzY3FcXG5hcHBsaWNhdGlvbi9zY3ZwLWN2LXJlc3BvbnNlXFx0XFx0XFx0c2NzXFxuYXBwbGljYXRpb24vc2N2cC12cC1yZXF1ZXN0XFx0XFx0XFx0c3BxXFxuYXBwbGljYXRpb24vc2N2cC12cC1yZXNwb25zZVxcdFxcdFxcdHNwcFxcbmFwcGxpY2F0aW9uL3NkcFxcdFxcdFxcdFxcdFxcdHNkcFxcbmFwcGxpY2F0aW9uL3NldC1wYXltZW50LWluaXRpYXRpb25cXHRcXHRzZXRwYXlcXG5hcHBsaWNhdGlvbi9zZXQtcmVnaXN0cmF0aW9uLWluaXRpYXRpb25cXHRcXHRzZXRyZWdcXG5hcHBsaWNhdGlvbi9zaGYreG1sXFx0XFx0XFx0XFx0c2hmXFxuYXBwbGljYXRpb24vc21pbCt4bWxcXHRcXHRcXHRcXHRzbWkgc21pbFxcbmFwcGxpY2F0aW9uL3NwYXJxbC1xdWVyeVxcdFxcdFxcdHJxXFxuYXBwbGljYXRpb24vc3BhcnFsLXJlc3VsdHMreG1sXFx0XFx0XFx0c3J4XFxuYXBwbGljYXRpb24vc3Jnc1xcdFxcdFxcdFxcdGdyYW1cXG5hcHBsaWNhdGlvbi9zcmdzK3htbFxcdFxcdFxcdFxcdGdyeG1sXFxuYXBwbGljYXRpb24vc3J1K3htbFxcdFxcdFxcdFxcdHNydVxcbmFwcGxpY2F0aW9uL3NzZGwreG1sXFx0XFx0XFx0XFx0c3NkbFxcbmFwcGxpY2F0aW9uL3NzbWwreG1sXFx0XFx0XFx0XFx0c3NtbFxcbmFwcGxpY2F0aW9uL3RlaSt4bWxcXHRcXHRcXHRcXHR0ZWkgdGVpY29ycHVzXFxuYXBwbGljYXRpb24vdGhyYXVkK3htbFxcdFxcdFxcdFxcdHRmaVxcbmFwcGxpY2F0aW9uL3RpbWVzdGFtcGVkLWRhdGFcXHRcXHRcXHR0c2RcXG5hcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctbGFyZ2VcXHRcXHRwbGJcXG5hcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctc21hbGxcXHRcXHRwc2JcXG5hcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctdmFyXFx0XFx0XFx0cHZiXFxuYXBwbGljYXRpb24vdm5kLjNncHAyLnRjYXBcXHRcXHRcXHR0Y2FwXFxuYXBwbGljYXRpb24vdm5kLjNtLnBvc3QtaXQtbm90ZXNcXHRcXHRwd25cXG5hcHBsaWNhdGlvbi92bmQuYWNjcGFjLnNpbXBseS5hc29cXHRcXHRhc29cXG5hcHBsaWNhdGlvbi92bmQuYWNjcGFjLnNpbXBseS5pbXBcXHRcXHRpbXBcXG5hcHBsaWNhdGlvbi92bmQuYWN1Y29ib2xcXHRcXHRcXHRhY3VcXG5hcHBsaWNhdGlvbi92bmQuYWN1Y29ycFxcdFxcdFxcdFxcdGF0YyBhY3V0Y1xcbmFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5haXItYXBwbGljYXRpb24taW5zdGFsbGVyLXBhY2thZ2UremlwXFx0YWlyXFxuYXBwbGljYXRpb24vdm5kLmFkb2JlLmZvcm1zY2VudHJhbC5mY2R0XFx0XFx0ZmNkdFxcbmFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5meHBcXHRcXHRcXHRmeHAgZnhwbFxcbmFwcGxpY2F0aW9uL3ZuZC5hZG9iZS54ZHAreG1sXFx0XFx0XFx0eGRwXFxuYXBwbGljYXRpb24vdm5kLmFkb2JlLnhmZGZcXHRcXHRcXHR4ZmRmXFxuYXBwbGljYXRpb24vdm5kLmFoZWFkLnNwYWNlXFx0XFx0XFx0YWhlYWRcXG5hcHBsaWNhdGlvbi92bmQuYWlyemlwLmZpbGVzZWN1cmUuYXpmXFx0XFx0YXpmXFxuYXBwbGljYXRpb24vdm5kLmFpcnppcC5maWxlc2VjdXJlLmF6c1xcdFxcdGF6c1xcbmFwcGxpY2F0aW9uL3ZuZC5hbWF6b24uZWJvb2tcXHRcXHRcXHRhendcXG5hcHBsaWNhdGlvbi92bmQuYW1lcmljYW5keW5hbWljcy5hY2NcXHRcXHRhY2NcXG5hcHBsaWNhdGlvbi92bmQuYW1pZ2EuYW1pXFx0XFx0XFx0YW1pXFxuYXBwbGljYXRpb24vdm5kLmFuZHJvaWQucGFja2FnZS1hcmNoaXZlXFx0XFx0YXBrXFxuYXBwbGljYXRpb24vdm5kLmFuc2VyLXdlYi1jZXJ0aWZpY2F0ZS1pc3N1ZS1pbml0aWF0aW9uXFx0Y2lpXFxuYXBwbGljYXRpb24vdm5kLmFuc2VyLXdlYi1mdW5kcy10cmFuc2Zlci1pbml0aWF0aW9uXFx0ZnRpXFxuYXBwbGljYXRpb24vdm5kLmFudGl4LmdhbWUtY29tcG9uZW50XFx0XFx0YXR4XFxuYXBwbGljYXRpb24vdm5kLmFwcGxlLmluc3RhbGxlcit4bWxcXHRcXHRtcGtnXFxuYXBwbGljYXRpb24vdm5kLmFwcGxlLm1wZWd1cmxcXHRcXHRcXHRtM3U4XFxuYXBwbGljYXRpb24vdm5kLmFyaXN0YW5ldHdvcmtzLnN3aVxcdFxcdHN3aVxcbmFwcGxpY2F0aW9uL3ZuZC5hc3RyYWVhLXNvZnR3YXJlLmlvdGFcXHRcXHRpb3RhXFxuYXBwbGljYXRpb24vdm5kLmF1ZGlvZ3JhcGhcXHRcXHRcXHRhZXBcXG5hcHBsaWNhdGlvbi92bmQuYmx1ZWljZS5tdWx0aXBhc3NcXHRcXHRtcG1cXG5hcHBsaWNhdGlvbi92bmQuYm1pXFx0XFx0XFx0XFx0Ym1pXFxuYXBwbGljYXRpb24vdm5kLmJ1c2luZXNzb2JqZWN0c1xcdFxcdFxcdHJlcFxcbmFwcGxpY2F0aW9uL3ZuZC5jaGVtZHJhdyt4bWxcXHRcXHRcXHRjZHhtbFxcbmFwcGxpY2F0aW9uL3ZuZC5jaGlwbnV0cy5rYXJhb2tlLW1tZFxcdFxcdG1tZFxcbmFwcGxpY2F0aW9uL3ZuZC5jaW5kZXJlbGxhXFx0XFx0XFx0Y2R5XFxuYXBwbGljYXRpb24vdm5kLmNsYXltb3JlXFx0XFx0XFx0Y2xhXFxuYXBwbGljYXRpb24vdm5kLmNsb2FudG8ucnA5XFx0XFx0XFx0cnA5XFxuYXBwbGljYXRpb24vdm5kLmNsb25rLmM0Z3JvdXBcXHRcXHRcXHRjNGcgYzRkIGM0ZiBjNHAgYzR1XFxuYXBwbGljYXRpb24vdm5kLmNsdWV0cnVzdC5jYXJ0b21vYmlsZS1jb25maWdcXHRcXHRjMTFhbWNcXG5hcHBsaWNhdGlvbi92bmQuY2x1ZXRydXN0LmNhcnRvbW9iaWxlLWNvbmZpZy1wa2dcXHRjMTFhbXpcXG5hcHBsaWNhdGlvbi92bmQuY29tbW9uc3BhY2VcXHRcXHRcXHRjc3BcXG5hcHBsaWNhdGlvbi92bmQuY29udGFjdC5jbXNnXFx0XFx0XFx0Y2RiY21zZ1xcbmFwcGxpY2F0aW9uL3ZuZC5jb3Ntb2NhbGxlclxcdFxcdFxcdGNtY1xcbmFwcGxpY2F0aW9uL3ZuZC5jcmljay5jbGlja2VyXFx0XFx0XFx0Y2xreFxcbmFwcGxpY2F0aW9uL3ZuZC5jcmljay5jbGlja2VyLmtleWJvYXJkXFx0XFx0Y2xra1xcbmFwcGxpY2F0aW9uL3ZuZC5jcmljay5jbGlja2VyLnBhbGV0dGVcXHRcXHRjbGtwXFxuYXBwbGljYXRpb24vdm5kLmNyaWNrLmNsaWNrZXIudGVtcGxhdGVcXHRcXHRjbGt0XFxuYXBwbGljYXRpb24vdm5kLmNyaWNrLmNsaWNrZXIud29yZGJhbmtcXHRcXHRjbGt3XFxuYXBwbGljYXRpb24vdm5kLmNyaXRpY2FsdG9vbHMud2JzK3htbFxcdFxcdHdic1xcbmFwcGxpY2F0aW9uL3ZuZC5jdGMtcG9zbWxcXHRcXHRcXHRwbWxcXG5hcHBsaWNhdGlvbi92bmQuY3Vwcy1wcGRcXHRcXHRcXHRwcGRcXG5hcHBsaWNhdGlvbi92bmQuY3VybC5jYXJcXHRcXHRcXHRjYXJcXG5hcHBsaWNhdGlvbi92bmQuY3VybC5wY3VybFxcdFxcdFxcdHBjdXJsXFxuYXBwbGljYXRpb24vdm5kLmRhcnRcXHRcXHRcXHRcXHRkYXJ0XFxuYXBwbGljYXRpb24vdm5kLmRhdGEtdmlzaW9uLnJkelxcdFxcdFxcdHJkelxcbmFwcGxpY2F0aW9uL3ZuZC5kZWNlLmRhdGFcXHRcXHRcXHR1dmYgdXZ2ZiB1dmQgdXZ2ZFxcbmFwcGxpY2F0aW9uL3ZuZC5kZWNlLnR0bWwreG1sXFx0XFx0XFx0dXZ0IHV2dnRcXG5hcHBsaWNhdGlvbi92bmQuZGVjZS51bnNwZWNpZmllZFxcdFxcdHV2eCB1dnZ4XFxuYXBwbGljYXRpb24vdm5kLmRlY2UuemlwXFx0XFx0XFx0dXZ6IHV2dnpcXG5hcHBsaWNhdGlvbi92bmQuZGVub3ZvLmZjc2VsYXlvdXQtbGlua1xcdFxcdGZlX2xhdW5jaFxcbmFwcGxpY2F0aW9uL3ZuZC5kbmFcXHRcXHRcXHRcXHRkbmFcXG5hcHBsaWNhdGlvbi92bmQuZG9sYnkubWxwXFx0XFx0XFx0bWxwXFxuYXBwbGljYXRpb24vdm5kLmRwZ3JhcGhcXHRcXHRcXHRcXHRkcGdcXG5hcHBsaWNhdGlvbi92bmQuZHJlYW1mYWN0b3J5XFx0XFx0XFx0ZGZhY1xcbmFwcGxpY2F0aW9uL3ZuZC5kcy1rZXlwb2ludFxcdFxcdFxcdGtweHhcXG5hcHBsaWNhdGlvbi92bmQuZHZiLmFpdFxcdFxcdFxcdFxcdGFpdFxcbmFwcGxpY2F0aW9uL3ZuZC5kdmIuc2VydmljZVxcdFxcdFxcdHN2Y1xcbmFwcGxpY2F0aW9uL3ZuZC5keW5hZ2VvXFx0XFx0XFx0XFx0Z2VvXFxuYXBwbGljYXRpb24vdm5kLmVjb3dpbi5jaGFydFxcdFxcdFxcdG1hZ1xcbmFwcGxpY2F0aW9uL3ZuZC5lbmxpdmVuXFx0XFx0XFx0XFx0bm1sXFxuYXBwbGljYXRpb24vdm5kLmVwc29uLmVzZlxcdFxcdFxcdGVzZlxcbmFwcGxpY2F0aW9uL3ZuZC5lcHNvbi5tc2ZcXHRcXHRcXHRtc2ZcXG5hcHBsaWNhdGlvbi92bmQuZXBzb24ucXVpY2thbmltZVxcdFxcdHFhbVxcbmFwcGxpY2F0aW9uL3ZuZC5lcHNvbi5zYWx0XFx0XFx0XFx0c2x0XFxuYXBwbGljYXRpb24vdm5kLmVwc29uLnNzZlxcdFxcdFxcdHNzZlxcbmFwcGxpY2F0aW9uL3ZuZC5lc3ppZ25vMyt4bWxcXHRcXHRcXHRlczMgZXQzXFxuYXBwbGljYXRpb24vdm5kLmV6cGl4LWFsYnVtXFx0XFx0XFx0ZXoyXFxuYXBwbGljYXRpb24vdm5kLmV6cGl4LXBhY2thZ2VcXHRcXHRcXHRlejNcXG5hcHBsaWNhdGlvbi92bmQuZmRmXFx0XFx0XFx0XFx0ZmRmXFxuYXBwbGljYXRpb24vdm5kLmZkc24ubXNlZWRcXHRcXHRcXHRtc2VlZFxcbmFwcGxpY2F0aW9uL3ZuZC5mZHNuLnNlZWRcXHRcXHRcXHRzZWVkIGRhdGFsZXNzXFxuYXBwbGljYXRpb24vdm5kLmZsb2dyYXBoaXRcXHRcXHRcXHRncGhcXG5hcHBsaWNhdGlvbi92bmQuZmx1eHRpbWUuY2xpcFxcdFxcdFxcdGZ0Y1xcbmFwcGxpY2F0aW9uL3ZuZC5mcmFtZW1ha2VyXFx0XFx0XFx0Zm0gZnJhbWUgbWFrZXIgYm9va1xcbmFwcGxpY2F0aW9uL3ZuZC5mcm9nYW5zLmZuY1xcdFxcdFxcdGZuY1xcbmFwcGxpY2F0aW9uL3ZuZC5mcm9nYW5zLmx0ZlxcdFxcdFxcdGx0ZlxcbmFwcGxpY2F0aW9uL3ZuZC5mc2Mud2VibGF1bmNoXFx0XFx0XFx0ZnNjXFxuYXBwbGljYXRpb24vdm5kLmZ1aml0c3Uub2FzeXNcXHRcXHRcXHRvYXNcXG5hcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5czJcXHRcXHRcXHRvYTJcXG5hcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5czNcXHRcXHRcXHRvYTNcXG5hcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5c2dwXFx0XFx0XFx0Zmc1XFxuYXBwbGljYXRpb24vdm5kLmZ1aml0c3Uub2FzeXNwcnNcXHRcXHRiaDJcXG5hcHBsaWNhdGlvbi92bmQuZnVqaXhlcm94LmRkZFxcdFxcdFxcdGRkZFxcbmFwcGxpY2F0aW9uL3ZuZC5mdWppeGVyb3guZG9jdXdvcmtzXFx0XFx0eGR3XFxuYXBwbGljYXRpb24vdm5kLmZ1aml4ZXJveC5kb2N1d29ya3MuYmluZGVyXFx0eGJkXFxuYXBwbGljYXRpb24vdm5kLmZ1enp5c2hlZXRcXHRcXHRcXHRmenNcXG5hcHBsaWNhdGlvbi92bmQuZ2Vub21hdGl4LnR1eGVkb1xcdFxcdHR4ZFxcbmFwcGxpY2F0aW9uL3ZuZC5nZW9nZWJyYS5maWxlXFx0XFx0XFx0Z2diXFxuYXBwbGljYXRpb24vdm5kLmdlb2dlYnJhLnRvb2xcXHRcXHRcXHRnZ3RcXG5hcHBsaWNhdGlvbi92bmQuZ2VvbWV0cnktZXhwbG9yZXJcXHRcXHRnZXggZ3JlXFxuYXBwbGljYXRpb24vdm5kLmdlb25leHRcXHRcXHRcXHRcXHRneHRcXG5hcHBsaWNhdGlvbi92bmQuZ2VvcGxhblxcdFxcdFxcdFxcdGcyd1xcbmFwcGxpY2F0aW9uL3ZuZC5nZW9zcGFjZVxcdFxcdFxcdGczd1xcbmFwcGxpY2F0aW9uL3ZuZC5nbXhcXHRcXHRcXHRcXHRnbXhcXG5hcHBsaWNhdGlvbi92bmQuZ29vZ2xlLWVhcnRoLmttbCt4bWxcXHRcXHRrbWxcXG5hcHBsaWNhdGlvbi92bmQuZ29vZ2xlLWVhcnRoLmttelxcdFxcdGttelxcbmFwcGxpY2F0aW9uL3ZuZC5ncmFmZXFcXHRcXHRcXHRcXHRncWYgZ3FzXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS1hY2NvdW50XFx0XFx0XFx0Z2FjXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS1oZWxwXFx0XFx0XFx0Z2hmXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS1pZGVudGl0eS1tZXNzYWdlXFx0XFx0Z2ltXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS1pbmplY3RvclxcdFxcdFxcdGdydlxcbmFwcGxpY2F0aW9uL3ZuZC5ncm9vdmUtdG9vbC1tZXNzYWdlXFx0XFx0Z3RtXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS10b29sLXRlbXBsYXRlXFx0XFx0dHBsXFxuYXBwbGljYXRpb24vdm5kLmdyb292ZS12Y2FyZFxcdFxcdFxcdHZjZ1xcbmFwcGxpY2F0aW9uL3ZuZC5oYWwreG1sXFx0XFx0XFx0XFx0aGFsXFxuYXBwbGljYXRpb24vdm5kLmhhbmRoZWxkLWVudGVydGFpbm1lbnQreG1sXFx0em1tXFxuYXBwbGljYXRpb24vdm5kLmhiY2lcXHRcXHRcXHRcXHRoYmNpXFxuYXBwbGljYXRpb24vdm5kLmhoZS5sZXNzb24tcGxheWVyXFx0XFx0bGVzXFxuYXBwbGljYXRpb24vdm5kLmhwLWhwZ2xcXHRcXHRcXHRcXHRocGdsXFxuYXBwbGljYXRpb24vdm5kLmhwLWhwaWRcXHRcXHRcXHRcXHRocGlkXFxuYXBwbGljYXRpb24vdm5kLmhwLWhwc1xcdFxcdFxcdFxcdGhwc1xcbmFwcGxpY2F0aW9uL3ZuZC5ocC1qbHl0XFx0XFx0XFx0XFx0amx0XFxuYXBwbGljYXRpb24vdm5kLmhwLXBjbFxcdFxcdFxcdFxcdHBjbFxcbmFwcGxpY2F0aW9uL3ZuZC5ocC1wY2x4bFxcdFxcdFxcdHBjbHhsXFxuYXBwbGljYXRpb24vdm5kLmh5ZHJvc3RhdGl4LnNvZi1kYXRhXFx0XFx0c2ZkLWhkc3R4XFxuYXBwbGljYXRpb24vdm5kLmlibS5taW5pcGF5XFx0XFx0XFx0bXB5XFxuYXBwbGljYXRpb24vdm5kLmlibS5tb2RjYXBcXHRcXHRcXHRhZnAgbGlzdGFmcCBsaXN0MzgyMFxcbmFwcGxpY2F0aW9uL3ZuZC5pYm0ucmlnaHRzLW1hbmFnZW1lbnRcXHRcXHRpcm1cXG5hcHBsaWNhdGlvbi92bmQuaWJtLnNlY3VyZS1jb250YWluZXJcXHRcXHRzY1xcbmFwcGxpY2F0aW9uL3ZuZC5pY2Nwcm9maWxlXFx0XFx0XFx0aWNjIGljbVxcbmFwcGxpY2F0aW9uL3ZuZC5pZ2xvYWRlclxcdFxcdFxcdGlnbFxcbmFwcGxpY2F0aW9uL3ZuZC5pbW1lcnZpc2lvbi1pdnBcXHRcXHRcXHRpdnBcXG5hcHBsaWNhdGlvbi92bmQuaW1tZXJ2aXNpb24taXZ1XFx0XFx0XFx0aXZ1XFxuYXBwbGljYXRpb24vdm5kLmluc29ycy5pZ21cXHRcXHRcXHRpZ21cXG5hcHBsaWNhdGlvbi92bmQuaW50ZXJjb24uZm9ybW5ldFxcdFxcdHhwdyB4cHhcXG5hcHBsaWNhdGlvbi92bmQuaW50ZXJnZW9cXHRcXHRcXHRpMmdcXG5hcHBsaWNhdGlvbi92bmQuaW50dS5xYm9cXHRcXHRcXHRxYm9cXG5hcHBsaWNhdGlvbi92bmQuaW50dS5xZnhcXHRcXHRcXHRxZnhcXG5hcHBsaWNhdGlvbi92bmQuaXB1bnBsdWdnZWQucmNwcm9maWxlXFx0XFx0cmNwcm9maWxlXFxuYXBwbGljYXRpb24vdm5kLmlyZXBvc2l0b3J5LnBhY2thZ2UreG1sXFx0XFx0aXJwXFxuYXBwbGljYXRpb24vdm5kLmlzLXhwclxcdFxcdFxcdFxcdHhwclxcbmFwcGxpY2F0aW9uL3ZuZC5pc2FjLmZjc1xcdFxcdFxcdGZjc1xcbmFwcGxpY2F0aW9uL3ZuZC5qYW1cXHRcXHRcXHRcXHRqYW1cXG5hcHBsaWNhdGlvbi92bmQuamNwLmphdmFtZS5taWRsZXQtcm1zXFx0XFx0cm1zXFxuYXBwbGljYXRpb24vdm5kLmppc3BcXHRcXHRcXHRcXHRqaXNwXFxuYXBwbGljYXRpb24vdm5kLmpvb3N0LmpvZGEtYXJjaGl2ZVxcdFxcdGpvZGFcXG5hcHBsaWNhdGlvbi92bmQua2Fob290elxcdFxcdFxcdFxcdGt0eiBrdHJcXG5hcHBsaWNhdGlvbi92bmQua2RlLmthcmJvblxcdFxcdFxcdGthcmJvblxcbmFwcGxpY2F0aW9uL3ZuZC5rZGUua2NoYXJ0XFx0XFx0XFx0Y2hydFxcbmFwcGxpY2F0aW9uL3ZuZC5rZGUua2Zvcm11bGFcXHRcXHRcXHRrZm9cXG5hcHBsaWNhdGlvbi92bmQua2RlLmtpdmlvXFx0XFx0XFx0Zmx3XFxuYXBwbGljYXRpb24vdm5kLmtkZS5rb250b3VyXFx0XFx0XFx0a29uXFxuYXBwbGljYXRpb24vdm5kLmtkZS5rcHJlc2VudGVyXFx0XFx0XFx0a3ByIGtwdFxcbmFwcGxpY2F0aW9uL3ZuZC5rZGUua3NwcmVhZFxcdFxcdFxcdGtzcFxcbmFwcGxpY2F0aW9uL3ZuZC5rZGUua3dvcmRcXHRcXHRcXHRrd2Qga3d0XFxuYXBwbGljYXRpb24vdm5kLmtlbmFtZWFhcHBcXHRcXHRcXHRodGtlXFxuYXBwbGljYXRpb24vdm5kLmtpZHNwaXJhdGlvblxcdFxcdFxcdGtpYVxcbmFwcGxpY2F0aW9uL3ZuZC5raW5hclxcdFxcdFxcdFxcdGtuZSBrbnBcXG5hcHBsaWNhdGlvbi92bmQua29hblxcdFxcdFxcdFxcdHNrcCBza2Qgc2t0IHNrbVxcbmFwcGxpY2F0aW9uL3ZuZC5rb2Rhay1kZXNjcmlwdG9yXFx0XFx0c3NlXFxuYXBwbGljYXRpb24vdm5kLmxhcy5sYXMreG1sXFx0XFx0XFx0bGFzeG1sXFxuYXBwbGljYXRpb24vdm5kLmxsYW1hZ3JhcGhpY3MubGlmZS1iYWxhbmNlLmRlc2t0b3BcXHRsYmRcXG5hcHBsaWNhdGlvbi92bmQubGxhbWFncmFwaGljcy5saWZlLWJhbGFuY2UuZXhjaGFuZ2UreG1sXFx0bGJlXFxuYXBwbGljYXRpb24vdm5kLmxvdHVzLTEtMi0zXFx0XFx0XFx0MTIzXFxuYXBwbGljYXRpb24vdm5kLmxvdHVzLWFwcHJvYWNoXFx0XFx0XFx0YXByXFxuYXBwbGljYXRpb24vdm5kLmxvdHVzLWZyZWVsYW5jZVxcdFxcdFxcdHByZVxcbmFwcGxpY2F0aW9uL3ZuZC5sb3R1cy1ub3Rlc1xcdFxcdFxcdG5zZlxcbmFwcGxpY2F0aW9uL3ZuZC5sb3R1cy1vcmdhbml6ZXJcXHRcXHRcXHRvcmdcXG5hcHBsaWNhdGlvbi92bmQubG90dXMtc2NyZWVuY2FtXFx0XFx0XFx0c2NtXFxuYXBwbGljYXRpb24vdm5kLmxvdHVzLXdvcmRwcm9cXHRcXHRcXHRsd3BcXG5hcHBsaWNhdGlvbi92bmQubWFjcG9ydHMucG9ydHBrZ1xcdFxcdHBvcnRwa2dcXG5hcHBsaWNhdGlvbi92bmQubWNkXFx0XFx0XFx0XFx0bWNkXFxuYXBwbGljYXRpb24vdm5kLm1lZGNhbGNkYXRhXFx0XFx0XFx0bWMxXFxuYXBwbGljYXRpb24vdm5kLm1lZGlhc3RhdGlvbi5jZGtleVxcdFxcdGNka2V5XFxuYXBwbGljYXRpb24vdm5kLm1mZXJcXHRcXHRcXHRcXHRtd2ZcXG5hcHBsaWNhdGlvbi92bmQubWZtcFxcdFxcdFxcdFxcdG1mbVxcbmFwcGxpY2F0aW9uL3ZuZC5taWNyb2dyYWZ4LmZsb1xcdFxcdFxcdGZsb1xcbmFwcGxpY2F0aW9uL3ZuZC5taWNyb2dyYWZ4LmlneFxcdFxcdFxcdGlneFxcbmFwcGxpY2F0aW9uL3ZuZC5taWZcXHRcXHRcXHRcXHRtaWZcXG5hcHBsaWNhdGlvbi92bmQubW9iaXVzLmRhZlxcdFxcdFxcdGRhZlxcbmFwcGxpY2F0aW9uL3ZuZC5tb2JpdXMuZGlzXFx0XFx0XFx0ZGlzXFxuYXBwbGljYXRpb24vdm5kLm1vYml1cy5tYmtcXHRcXHRcXHRtYmtcXG5hcHBsaWNhdGlvbi92bmQubW9iaXVzLm1xeVxcdFxcdFxcdG1xeVxcbmFwcGxpY2F0aW9uL3ZuZC5tb2JpdXMubXNsXFx0XFx0XFx0bXNsXFxuYXBwbGljYXRpb24vdm5kLm1vYml1cy5wbGNcXHRcXHRcXHRwbGNcXG5hcHBsaWNhdGlvbi92bmQubW9iaXVzLnR4ZlxcdFxcdFxcdHR4ZlxcbmFwcGxpY2F0aW9uL3ZuZC5tb3BodW4uYXBwbGljYXRpb25cXHRcXHRtcG5cXG5hcHBsaWNhdGlvbi92bmQubW9waHVuLmNlcnRpZmljYXRlXFx0XFx0bXBjXFxuYXBwbGljYXRpb24vdm5kLm1vemlsbGEueHVsK3htbFxcdFxcdFxcdHh1bFxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1hcnRnYWxyeVxcdFxcdFxcdGNpbFxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1jYWItY29tcHJlc3NlZFxcdFxcdGNhYlxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbFxcdFxcdFxcdHhscyB4bG0geGxhIHhsYyB4bHQgeGx3XFxuYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsLmFkZGluLm1hY3JvZW5hYmxlZC4xMlxcdFxcdHhsYW1cXG5hcHBsaWNhdGlvbi92bmQubXMtZXhjZWwuc2hlZXQuYmluYXJ5Lm1hY3JvZW5hYmxlZC4xMlxcdHhsc2JcXG5hcHBsaWNhdGlvbi92bmQubXMtZXhjZWwuc2hlZXQubWFjcm9lbmFibGVkLjEyXFx0XFx0eGxzbVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbC50ZW1wbGF0ZS5tYWNyb2VuYWJsZWQuMTJcXHR4bHRtXFxuYXBwbGljYXRpb24vdm5kLm1zLWZvbnRvYmplY3RcXHRcXHRcXHRlb3RcXG5hcHBsaWNhdGlvbi92bmQubXMtaHRtbGhlbHBcXHRcXHRcXHRjaG1cXG5hcHBsaWNhdGlvbi92bmQubXMtaW1zXFx0XFx0XFx0XFx0aW1zXFxuYXBwbGljYXRpb24vdm5kLm1zLWxybVxcdFxcdFxcdFxcdGxybVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1vZmZpY2V0aGVtZVxcdFxcdFxcdHRobXhcXG5hcHBsaWNhdGlvbi92bmQubXMtcGtpLnNlY2NhdFxcdFxcdFxcdGNhdFxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1wa2kuc3RsXFx0XFx0XFx0c3RsXFxuYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnRcXHRcXHRcXHRwcHQgcHBzIHBvdFxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50LmFkZGluLm1hY3JvZW5hYmxlZC4xMlxcdFxcdHBwYW1cXG5hcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludC5wcmVzZW50YXRpb24ubWFjcm9lbmFibGVkLjEyXFx0cHB0bVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50LnNsaWRlLm1hY3JvZW5hYmxlZC4xMlxcdFxcdHNsZG1cXG5hcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludC5zbGlkZXNob3cubWFjcm9lbmFibGVkLjEyXFx0XFx0cHBzbVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50LnRlbXBsYXRlLm1hY3JvZW5hYmxlZC4xMlxcdFxcdHBvdG1cXG5hcHBsaWNhdGlvbi92bmQubXMtcHJvamVjdFxcdFxcdFxcdG1wcCBtcHRcXG5hcHBsaWNhdGlvbi92bmQubXMtd29yZC5kb2N1bWVudC5tYWNyb2VuYWJsZWQuMTJcXHRkb2NtXFxuYXBwbGljYXRpb24vdm5kLm1zLXdvcmQudGVtcGxhdGUubWFjcm9lbmFibGVkLjEyXFx0ZG90bVxcbmFwcGxpY2F0aW9uL3ZuZC5tcy13b3Jrc1xcdFxcdFxcdHdwcyB3a3Mgd2NtIHdkYlxcbmFwcGxpY2F0aW9uL3ZuZC5tcy13cGxcXHRcXHRcXHRcXHR3cGxcXG5hcHBsaWNhdGlvbi92bmQubXMteHBzZG9jdW1lbnRcXHRcXHRcXHR4cHNcXG5hcHBsaWNhdGlvbi92bmQubXNlcVxcdFxcdFxcdFxcdG1zZXFcXG5hcHBsaWNhdGlvbi92bmQubXVzaWNpYW5cXHRcXHRcXHRtdXNcXG5hcHBsaWNhdGlvbi92bmQubXV2ZWUuc3R5bGVcXHRcXHRcXHRtc3R5XFxuYXBwbGljYXRpb24vdm5kLm15bmZjXFx0XFx0XFx0XFx0dGFnbGV0XFxuYXBwbGljYXRpb24vdm5kLm5ldXJvbGFuZ3VhZ2Uubmx1XFx0XFx0bmx1XFxuYXBwbGljYXRpb24vdm5kLm5pdGZcXHRcXHRcXHRcXHRudGYgbml0ZlxcbmFwcGxpY2F0aW9uL3ZuZC5ub2JsZW5ldC1kaXJlY3RvcnlcXHRcXHRubmRcXG5hcHBsaWNhdGlvbi92bmQubm9ibGVuZXQtc2VhbGVyXFx0XFx0XFx0bm5zXFxuYXBwbGljYXRpb24vdm5kLm5vYmxlbmV0LXdlYlxcdFxcdFxcdG5ud1xcbmFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5uLWdhZ2UuZGF0YVxcdFxcdG5nZGF0XFxuYXBwbGljYXRpb24vdm5kLm5va2lhLm4tZ2FnZS5zeW1iaWFuLmluc3RhbGxcXHRuLWdhZ2VcXG5hcHBsaWNhdGlvbi92bmQubm9raWEucmFkaW8tcHJlc2V0XFx0XFx0cnBzdFxcbmFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5yYWRpby1wcmVzZXRzXFx0XFx0cnBzc1xcbmFwcGxpY2F0aW9uL3ZuZC5ub3ZhZGlnbS5lZG1cXHRcXHRcXHRlZG1cXG5hcHBsaWNhdGlvbi92bmQubm92YWRpZ20uZWR4XFx0XFx0XFx0ZWR4XFxuYXBwbGljYXRpb24vdm5kLm5vdmFkaWdtLmV4dFxcdFxcdFxcdGV4dFxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuY2hhcnRcXHRcXHRvZGNcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmNoYXJ0LXRlbXBsYXRlXFx0b3RjXFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5kYXRhYmFzZVxcdFxcdG9kYlxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZm9ybXVsYVxcdFxcdG9kZlxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZm9ybXVsYS10ZW1wbGF0ZVxcdG9kZnRcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmdyYXBoaWNzXFx0XFx0b2RnXFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5ncmFwaGljcy10ZW1wbGF0ZVxcdG90Z1xcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuaW1hZ2VcXHRcXHRvZGlcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmltYWdlLXRlbXBsYXRlXFx0b3RpXFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5wcmVzZW50YXRpb25cXHRcXHRvZHBcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvbi10ZW1wbGF0ZVxcdG90cFxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuc3ByZWFkc2hlZXRcXHRcXHRvZHNcXG5hcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0LXRlbXBsYXRlXFx0b3RzXFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC50ZXh0XFx0XFx0XFx0b2R0XFxuYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC50ZXh0LW1hc3RlclxcdFxcdG9kbVxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dC10ZW1wbGF0ZVxcdG90dFxcbmFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dC13ZWJcXHRcXHRvdGhcXG5hcHBsaWNhdGlvbi92bmQub2xwYy1zdWdhclxcdFxcdFxcdHhvXFxuYXBwbGljYXRpb24vdm5kLm9tYS5kZDIreG1sXFx0XFx0XFx0ZGQyXFxuYXBwbGljYXRpb24vdm5kLm9wZW5vZmZpY2VvcmcuZXh0ZW5zaW9uXFx0XFx0b3h0XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnByZXNlbnRhdGlvblxcdHBwdHhcXG5hcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwuc2xpZGVcXHRzbGR4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnNsaWRlc2hvd1xcdHBwc3hcXG5hcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwudGVtcGxhdGVcXHRwb3R4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXRcXHR4bHN4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwudGVtcGxhdGVcXHR4bHR4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnRcXHRkb2N4XFxuYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwudGVtcGxhdGVcXHRkb3R4XFxuYXBwbGljYXRpb24vdm5kLm9zZ2VvLm1hcGd1aWRlLnBhY2thZ2VcXHRcXHRtZ3BcXG5hcHBsaWNhdGlvbi92bmQub3NnaS5kcFxcdFxcdFxcdFxcdGRwXFxuYXBwbGljYXRpb24vdm5kLm9zZ2kuc3Vic3lzdGVtXFx0XFx0XFx0ZXNhXFxuYXBwbGljYXRpb24vdm5kLnBhbG1cXHRcXHRcXHRcXHRwZGIgcHFhIG9wcmNcXG5hcHBsaWNhdGlvbi92bmQucGF3YWFmaWxlXFx0XFx0XFx0cGF3XFxuYXBwbGljYXRpb24vdm5kLnBnLmZvcm1hdFxcdFxcdFxcdHN0clxcbmFwcGxpY2F0aW9uL3ZuZC5wZy5vc2FzbGlcXHRcXHRcXHRlaTZcXG5hcHBsaWNhdGlvbi92bmQucGljc2VsXFx0XFx0XFx0XFx0ZWZpZlxcbmFwcGxpY2F0aW9uL3ZuZC5wbWkud2lkZ2V0XFx0XFx0XFx0d2dcXG5hcHBsaWNhdGlvbi92bmQucG9ja2V0bGVhcm5cXHRcXHRcXHRwbGZcXG5hcHBsaWNhdGlvbi92bmQucG93ZXJidWlsZGVyNlxcdFxcdFxcdHBiZFxcbmFwcGxpY2F0aW9uL3ZuZC5wcmV2aWV3c3lzdGVtcy5ib3hcXHRcXHRib3hcXG5hcHBsaWNhdGlvbi92bmQucHJvdGV1cy5tYWdhemluZVxcdFxcdG1nelxcbmFwcGxpY2F0aW9uL3ZuZC5wdWJsaXNoYXJlLWRlbHRhLXRyZWVcXHRcXHRxcHNcXG5hcHBsaWNhdGlvbi92bmQucHZpLnB0aWQxXFx0XFx0XFx0cHRpZFxcbmFwcGxpY2F0aW9uL3ZuZC5xdWFyay5xdWFya3hwcmVzc1xcdFxcdHF4ZCBxeHQgcXdkIHF3dCBxeGwgcXhiXFxuYXBwbGljYXRpb24vdm5kLnJlYWx2bmMuYmVkXFx0XFx0XFx0YmVkXFxuYXBwbGljYXRpb24vdm5kLnJlY29yZGFyZS5tdXNpY3htbFxcdFxcdG14bFxcbmFwcGxpY2F0aW9uL3ZuZC5yZWNvcmRhcmUubXVzaWN4bWwreG1sXFx0XFx0bXVzaWN4bWxcXG5hcHBsaWNhdGlvbi92bmQucmlnLmNyeXB0b25vdGVcXHRcXHRcXHRjcnlwdG9ub3RlXFxuYXBwbGljYXRpb24vdm5kLnJpbS5jb2RcXHRcXHRcXHRcXHRjb2RcXG5hcHBsaWNhdGlvbi92bmQucm4tcmVhbG1lZGlhXFx0XFx0XFx0cm1cXG5hcHBsaWNhdGlvbi92bmQucm4tcmVhbG1lZGlhLXZiclxcdFxcdHJtdmJcXG5hcHBsaWNhdGlvbi92bmQucm91dGU2Ni5saW5rNjYreG1sXFx0XFx0bGluazY2XFxuYXBwbGljYXRpb24vdm5kLnNhaWxpbmd0cmFja2VyLnRyYWNrXFx0XFx0c3RcXG5hcHBsaWNhdGlvbi92bmQuc2VlbWFpbFxcdFxcdFxcdFxcdHNlZVxcbmFwcGxpY2F0aW9uL3ZuZC5zZW1hXFx0XFx0XFx0XFx0c2VtYVxcbmFwcGxpY2F0aW9uL3ZuZC5zZW1kXFx0XFx0XFx0XFx0c2VtZFxcbmFwcGxpY2F0aW9uL3ZuZC5zZW1mXFx0XFx0XFx0XFx0c2VtZlxcbmFwcGxpY2F0aW9uL3ZuZC5zaGFuYS5pbmZvcm1lZC5mb3JtZGF0YVxcdFxcdGlmbVxcbmFwcGxpY2F0aW9uL3ZuZC5zaGFuYS5pbmZvcm1lZC5mb3JtdGVtcGxhdGVcXHRpdHBcXG5hcHBsaWNhdGlvbi92bmQuc2hhbmEuaW5mb3JtZWQuaW50ZXJjaGFuZ2VcXHRpaWZcXG5hcHBsaWNhdGlvbi92bmQuc2hhbmEuaW5mb3JtZWQucGFja2FnZVxcdFxcdGlwa1xcbmFwcGxpY2F0aW9uL3ZuZC5zaW10ZWNoLW1pbmRtYXBwZXJcXHRcXHR0d2QgdHdkc1xcbmFwcGxpY2F0aW9uL3ZuZC5zbWFmXFx0XFx0XFx0XFx0bW1mXFxuYXBwbGljYXRpb24vdm5kLnNtYXJ0LnRlYWNoZXJcXHRcXHRcXHR0ZWFjaGVyXFxuYXBwbGljYXRpb24vdm5kLnNvbGVudC5zZGttK3htbFxcdFxcdFxcdHNka20gc2RrZFxcbmFwcGxpY2F0aW9uL3ZuZC5zcG90ZmlyZS5keHBcXHRcXHRcXHRkeHBcXG5hcHBsaWNhdGlvbi92bmQuc3BvdGZpcmUuc2ZzXFx0XFx0XFx0c2ZzXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5jYWxjXFx0XFx0c2RjXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5kcmF3XFx0XFx0c2RhXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5pbXByZXNzXFx0XFx0c2RkXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5tYXRoXFx0XFx0c21mXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi53cml0ZXJcXHRcXHRzZHcgdm9yXFxuYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi53cml0ZXItZ2xvYmFsXFx0c2dsXFxuYXBwbGljYXRpb24vdm5kLnN0ZXBtYW5pYS5wYWNrYWdlXFx0XFx0c216aXBcXG5hcHBsaWNhdGlvbi92bmQuc3RlcG1hbmlhLnN0ZXBjaGFydFxcdFxcdHNtXFxuYXBwbGljYXRpb24vdm5kLnN1bi54bWwuY2FsY1xcdFxcdFxcdHN4Y1xcbmFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmNhbGMudGVtcGxhdGVcXHRcXHRzdGNcXG5hcHBsaWNhdGlvbi92bmQuc3VuLnhtbC5kcmF3XFx0XFx0XFx0c3hkXFxuYXBwbGljYXRpb24vdm5kLnN1bi54bWwuZHJhdy50ZW1wbGF0ZVxcdFxcdHN0ZFxcbmFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmltcHJlc3NcXHRcXHRcXHRzeGlcXG5hcHBsaWNhdGlvbi92bmQuc3VuLnhtbC5pbXByZXNzLnRlbXBsYXRlXFx0c3RpXFxuYXBwbGljYXRpb24vdm5kLnN1bi54bWwubWF0aFxcdFxcdFxcdHN4bVxcbmFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLndyaXRlclxcdFxcdFxcdHN4d1xcbmFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLndyaXRlci5nbG9iYWxcXHRcXHRzeGdcXG5hcHBsaWNhdGlvbi92bmQuc3VuLnhtbC53cml0ZXIudGVtcGxhdGVcXHRcXHRzdHdcXG5hcHBsaWNhdGlvbi92bmQuc3VzLWNhbGVuZGFyXFx0XFx0XFx0c3VzIHN1c3BcXG5hcHBsaWNhdGlvbi92bmQuc3ZkXFx0XFx0XFx0XFx0c3ZkXFxuYXBwbGljYXRpb24vdm5kLnN5bWJpYW4uaW5zdGFsbFxcdFxcdFxcdHNpcyBzaXN4XFxuYXBwbGljYXRpb24vdm5kLnN5bmNtbCt4bWxcXHRcXHRcXHR4c21cXG5hcHBsaWNhdGlvbi92bmQuc3luY21sLmRtK3dieG1sXFx0XFx0XFx0YmRtXFxuYXBwbGljYXRpb24vdm5kLnN5bmNtbC5kbSt4bWxcXHRcXHRcXHR4ZG1cXG5hcHBsaWNhdGlvbi92bmQudGFvLmludGVudC1tb2R1bGUtYXJjaGl2ZVxcdHRhb1xcbmFwcGxpY2F0aW9uL3ZuZC50Y3BkdW1wLnBjYXBcXHRcXHRcXHRwY2FwIGNhcCBkbXBcXG5hcHBsaWNhdGlvbi92bmQudG1vYmlsZS1saXZldHZcXHRcXHRcXHR0bW9cXG5hcHBsaWNhdGlvbi92bmQudHJpZC50cHRcXHRcXHRcXHR0cHRcXG5hcHBsaWNhdGlvbi92bmQudHJpc2NhcGUubXhzXFx0XFx0XFx0bXhzXFxuYXBwbGljYXRpb24vdm5kLnRydWVhcHBcXHRcXHRcXHRcXHR0cmFcXG5hcHBsaWNhdGlvbi92bmQudWZkbFxcdFxcdFxcdFxcdHVmZCB1ZmRsXFxuYXBwbGljYXRpb24vdm5kLnVpcS50aGVtZVxcdFxcdFxcdHV0elxcbmFwcGxpY2F0aW9uL3ZuZC51bWFqaW5cXHRcXHRcXHRcXHR1bWpcXG5hcHBsaWNhdGlvbi92bmQudW5pdHlcXHRcXHRcXHRcXHR1bml0eXdlYlxcbmFwcGxpY2F0aW9uL3ZuZC51b21sK3htbFxcdFxcdFxcdHVvbWxcXG5hcHBsaWNhdGlvbi92bmQudmN4XFx0XFx0XFx0XFx0dmN4XFxuYXBwbGljYXRpb24vdm5kLnZpc2lvXFx0XFx0XFx0XFx0dnNkIHZzdCB2c3MgdnN3XFxuYXBwbGljYXRpb24vdm5kLnZpc2lvbmFyeVxcdFxcdFxcdHZpc1xcbmFwcGxpY2F0aW9uL3ZuZC52c2ZcXHRcXHRcXHRcXHR2c2ZcXG5hcHBsaWNhdGlvbi92bmQud2FwLndieG1sXFx0XFx0XFx0d2J4bWxcXG5hcHBsaWNhdGlvbi92bmQud2FwLndtbGNcXHRcXHRcXHR3bWxjXFxuYXBwbGljYXRpb24vdm5kLndhcC53bWxzY3JpcHRjXFx0XFx0XFx0d21sc2NcXG5hcHBsaWNhdGlvbi92bmQud2VidHVyYm9cXHRcXHRcXHR3dGJcXG5hcHBsaWNhdGlvbi92bmQud29sZnJhbS5wbGF5ZXJcXHRcXHRcXHRuYnBcXG5hcHBsaWNhdGlvbi92bmQud29yZHBlcmZlY3RcXHRcXHRcXHR3cGRcXG5hcHBsaWNhdGlvbi92bmQud3FkXFx0XFx0XFx0XFx0d3FkXFxuYXBwbGljYXRpb24vdm5kLnd0LnN0ZlxcdFxcdFxcdFxcdHN0ZlxcbmFwcGxpY2F0aW9uL3ZuZC54YXJhXFx0XFx0XFx0XFx0eGFyXFxuYXBwbGljYXRpb24vdm5kLnhmZGxcXHRcXHRcXHRcXHR4ZmRsXFxuYXBwbGljYXRpb24vdm5kLnlhbWFoYS5odi1kaWNcXHRcXHRcXHRodmRcXG5hcHBsaWNhdGlvbi92bmQueWFtYWhhLmh2LXNjcmlwdFxcdFxcdGh2c1xcbmFwcGxpY2F0aW9uL3ZuZC55YW1haGEuaHYtdm9pY2VcXHRcXHRcXHRodnBcXG5hcHBsaWNhdGlvbi92bmQueWFtYWhhLm9wZW5zY29yZWZvcm1hdFxcdFxcdFxcdG9zZlxcbmFwcGxpY2F0aW9uL3ZuZC55YW1haGEub3BlbnNjb3JlZm9ybWF0Lm9zZnB2Zyt4bWxcXHRvc2ZwdmdcXG5hcHBsaWNhdGlvbi92bmQueWFtYWhhLnNtYWYtYXVkaW9cXHRcXHRzYWZcXG5hcHBsaWNhdGlvbi92bmQueWFtYWhhLnNtYWYtcGhyYXNlXFx0XFx0c3BmXFxuYXBwbGljYXRpb24vdm5kLnllbGxvd3JpdmVyLWN1c3RvbS1tZW51XFx0XFx0Y21wXFxuYXBwbGljYXRpb24vdm5kLnp1bFxcdFxcdFxcdFxcdHppciB6aXJ6XFxuYXBwbGljYXRpb24vdm5kLnp6YXp6LmRlY2sreG1sXFx0XFx0XFx0emF6XFxuYXBwbGljYXRpb24vdm9pY2V4bWwreG1sXFx0XFx0XFx0dnhtbFxcbmFwcGxpY2F0aW9uL3dhc21cXHRcXHRcXHRcXHR3YXNtXFxuYXBwbGljYXRpb24vd2lkZ2V0XFx0XFx0XFx0XFx0d2d0XFxuYXBwbGljYXRpb24vd2luaGxwXFx0XFx0XFx0XFx0aGxwXFxuYXBwbGljYXRpb24vd3NkbCt4bWxcXHRcXHRcXHRcXHR3c2RsXFxuYXBwbGljYXRpb24vd3Nwb2xpY3kreG1sXFx0XFx0XFx0d3Nwb2xpY3lcXG5hcHBsaWNhdGlvbi94LTd6LWNvbXByZXNzZWRcXHRcXHRcXHQ3elxcbmFwcGxpY2F0aW9uL3gtYWJpd29yZFxcdFxcdFxcdFxcdGFid1xcbmFwcGxpY2F0aW9uL3gtYWNlLWNvbXByZXNzZWRcXHRcXHRcXHRhY2VcXG5hcHBsaWNhdGlvbi94LWFwcGxlLWRpc2tpbWFnZVxcdFxcdFxcdGRtZ1xcbmFwcGxpY2F0aW9uL3gtYXV0aG9yd2FyZS1iaW5cXHRcXHRcXHRhYWIgeDMyIHUzMiB2b3hcXG5hcHBsaWNhdGlvbi94LWF1dGhvcndhcmUtbWFwXFx0XFx0XFx0YWFtXFxuYXBwbGljYXRpb24veC1hdXRob3J3YXJlLXNlZ1xcdFxcdFxcdGFhc1xcbmFwcGxpY2F0aW9uL3gtYmNwaW9cXHRcXHRcXHRcXHRiY3Bpb1xcbmFwcGxpY2F0aW9uL3gtYml0dG9ycmVudFxcdFxcdFxcdHRvcnJlbnRcXG5hcHBsaWNhdGlvbi94LWJsb3JiXFx0XFx0XFx0XFx0YmxiIGJsb3JiXFxuYXBwbGljYXRpb24veC1iemlwXFx0XFx0XFx0XFx0YnpcXG5hcHBsaWNhdGlvbi94LWJ6aXAyXFx0XFx0XFx0XFx0YnoyIGJvelxcbmFwcGxpY2F0aW9uL3gtY2JyXFx0XFx0XFx0XFx0Y2JyIGNiYSBjYnQgY2J6IGNiN1xcbmFwcGxpY2F0aW9uL3gtY2RsaW5rXFx0XFx0XFx0XFx0dmNkXFxuYXBwbGljYXRpb24veC1jZnMtY29tcHJlc3NlZFxcdFxcdFxcdGNmc1xcbmFwcGxpY2F0aW9uL3gtY2hhdFxcdFxcdFxcdFxcdGNoYXRcXG5hcHBsaWNhdGlvbi94LWNoZXNzLXBnblxcdFxcdFxcdFxcdHBnblxcbmFwcGxpY2F0aW9uL3gtY29uZmVyZW5jZVxcdFxcdFxcdG5zY1xcbmFwcGxpY2F0aW9uL3gtY3Bpb1xcdFxcdFxcdFxcdGNwaW9cXG5hcHBsaWNhdGlvbi94LWNzaFxcdFxcdFxcdFxcdGNzaFxcbmFwcGxpY2F0aW9uL3gtZGViaWFuLXBhY2thZ2VcXHRcXHRcXHRkZWIgdWRlYlxcbmFwcGxpY2F0aW9uL3gtZGdjLWNvbXByZXNzZWRcXHRcXHRcXHRkZ2NcXG5hcHBsaWNhdGlvbi94LWRpcmVjdG9yXFx0XFx0XFx0ZGlyIGRjciBkeHIgY3N0IGNjdCBjeHQgdzNkIGZnZCBzd2FcXG5hcHBsaWNhdGlvbi94LWRvb21cXHRcXHRcXHRcXHR3YWRcXG5hcHBsaWNhdGlvbi94LWR0Ym5jeCt4bWxcXHRcXHRcXHRuY3hcXG5hcHBsaWNhdGlvbi94LWR0Ym9vayt4bWxcXHRcXHRcXHRkdGJcXG5hcHBsaWNhdGlvbi94LWR0YnJlc291cmNlK3htbFxcdFxcdFxcdHJlc1xcbmFwcGxpY2F0aW9uL3gtZHZpXFx0XFx0XFx0XFx0ZHZpXFxuYXBwbGljYXRpb24veC1lbnZveVxcdFxcdFxcdFxcdGV2eVxcbmFwcGxpY2F0aW9uL3gtZXZhXFx0XFx0XFx0XFx0ZXZhXFxuYXBwbGljYXRpb24veC1mb250LWJkZlxcdFxcdFxcdFxcdGJkZlxcbmFwcGxpY2F0aW9uL3gtZm9udC1naG9zdHNjcmlwdFxcdFxcdFxcdGdzZlxcbmFwcGxpY2F0aW9uL3gtZm9udC1saW51eC1wc2ZcXHRcXHRcXHRwc2ZcXG5hcHBsaWNhdGlvbi94LWZvbnQtcGNmXFx0XFx0XFx0XFx0cGNmXFxuYXBwbGljYXRpb24veC1mb250LXNuZlxcdFxcdFxcdFxcdHNuZlxcbmFwcGxpY2F0aW9uL3gtZm9udC10eXBlMVxcdFxcdFxcdHBmYSBwZmIgcGZtIGFmbVxcbmFwcGxpY2F0aW9uL3gtZnJlZWFyY1xcdFxcdFxcdFxcdGFyY1xcbmFwcGxpY2F0aW9uL3gtZnV0dXJlc3BsYXNoXFx0XFx0XFx0c3BsXFxuYXBwbGljYXRpb24veC1nY2EtY29tcHJlc3NlZFxcdFxcdFxcdGdjYVxcbmFwcGxpY2F0aW9uL3gtZ2x1bHhcXHRcXHRcXHRcXHR1bHhcXG5hcHBsaWNhdGlvbi94LWdudW1lcmljXFx0XFx0XFx0XFx0Z251bWVyaWNcXG5hcHBsaWNhdGlvbi94LWdyYW1wcy14bWxcXHRcXHRcXHRncmFtcHNcXG5hcHBsaWNhdGlvbi94LWd0YXJcXHRcXHRcXHRcXHRndGFyXFxuYXBwbGljYXRpb24veC1oZGZcXHRcXHRcXHRcXHRoZGZcXG5hcHBsaWNhdGlvbi94LWluc3RhbGwtaW5zdHJ1Y3Rpb25zXFx0XFx0aW5zdGFsbFxcbmFwcGxpY2F0aW9uL3gtaXNvOTY2MC1pbWFnZVxcdFxcdFxcdGlzb1xcbmFwcGxpY2F0aW9uL3gtamF2YS1qbmxwLWZpbGVcXHRcXHRcXHRqbmxwXFxuYXBwbGljYXRpb24veC1sYXRleFxcdFxcdFxcdFxcdGxhdGV4XFxuYXBwbGljYXRpb24veC1semgtY29tcHJlc3NlZFxcdFxcdFxcdGx6aCBsaGFcXG5hcHBsaWNhdGlvbi94LW1pZVxcdFxcdFxcdFxcdG1pZVxcbmFwcGxpY2F0aW9uL3gtbW9iaXBvY2tldC1lYm9va1xcdFxcdFxcdHByYyBtb2JpXFxuYXBwbGljYXRpb24veC1tcy1hcHBsaWNhdGlvblxcdFxcdFxcdGFwcGxpY2F0aW9uXFxuYXBwbGljYXRpb24veC1tcy1zaG9ydGN1dFxcdFxcdFxcdGxua1xcbmFwcGxpY2F0aW9uL3gtbXMtd21kXFx0XFx0XFx0XFx0d21kXFxuYXBwbGljYXRpb24veC1tcy13bXpcXHRcXHRcXHRcXHR3bXpcXG5hcHBsaWNhdGlvbi94LW1zLXhiYXBcXHRcXHRcXHRcXHR4YmFwXFxuYXBwbGljYXRpb24veC1tc2FjY2Vzc1xcdFxcdFxcdFxcdG1kYlxcbmFwcGxpY2F0aW9uL3gtbXNiaW5kZXJcXHRcXHRcXHRcXHRvYmRcXG5hcHBsaWNhdGlvbi94LW1zY2FyZGZpbGVcXHRcXHRcXHRjcmRcXG5hcHBsaWNhdGlvbi94LW1zY2xpcFxcdFxcdFxcdFxcdGNscFxcbmFwcGxpY2F0aW9uL3gtbXNkb3dubG9hZFxcdFxcdFxcdGV4ZSBkbGwgY29tIGJhdCBtc2lcXG5hcHBsaWNhdGlvbi94LW1zbWVkaWF2aWV3XFx0XFx0XFx0bXZiIG0xMyBtMTRcXG5hcHBsaWNhdGlvbi94LW1zbWV0YWZpbGVcXHRcXHRcXHR3bWYgd216IGVtZiBlbXpcXG5hcHBsaWNhdGlvbi94LW1zbW9uZXlcXHRcXHRcXHRcXHRtbnlcXG5hcHBsaWNhdGlvbi94LW1zcHVibGlzaGVyXFx0XFx0XFx0cHViXFxuYXBwbGljYXRpb24veC1tc3NjaGVkdWxlXFx0XFx0XFx0c2NkXFxuYXBwbGljYXRpb24veC1tc3Rlcm1pbmFsXFx0XFx0XFx0dHJtXFxuYXBwbGljYXRpb24veC1tc3dyaXRlXFx0XFx0XFx0XFx0d3JpXFxuYXBwbGljYXRpb24veC1uZXRjZGZcXHRcXHRcXHRcXHRuYyBjZGZcXG5hcHBsaWNhdGlvbi94LW56YlxcdFxcdFxcdFxcdG56YlxcbmFwcGxpY2F0aW9uL3gtcGtjczEyXFx0XFx0XFx0XFx0cDEyIHBmeFxcbmFwcGxpY2F0aW9uL3gtcGtjczctY2VydGlmaWNhdGVzXFx0XFx0cDdiIHNwY1xcbmFwcGxpY2F0aW9uL3gtcGtjczctY2VydHJlcXJlc3BcXHRcXHRcXHRwN3JcXG5hcHBsaWNhdGlvbi94LXJhci1jb21wcmVzc2VkXFx0XFx0XFx0cmFyXFxuYXBwbGljYXRpb24veC1yZXNlYXJjaC1pbmZvLXN5c3RlbXNcXHRcXHRyaXNcXG5hcHBsaWNhdGlvbi94LXNoXFx0XFx0XFx0XFx0c2hcXG5hcHBsaWNhdGlvbi94LXNoYXJcXHRcXHRcXHRcXHRzaGFyXFxuYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2hcXHRcXHRcXHRzd2ZcXG5hcHBsaWNhdGlvbi94LXNpbHZlcmxpZ2h0LWFwcFxcdFxcdFxcdHhhcFxcbmFwcGxpY2F0aW9uL3gtc3FsXFx0XFx0XFx0XFx0c3FsXFxuYXBwbGljYXRpb24veC1zdHVmZml0XFx0XFx0XFx0XFx0c2l0XFxuYXBwbGljYXRpb24veC1zdHVmZml0eFxcdFxcdFxcdFxcdHNpdHhcXG5hcHBsaWNhdGlvbi94LXN1YnJpcFxcdFxcdFxcdFxcdHNydFxcbmFwcGxpY2F0aW9uL3gtc3Y0Y3Bpb1xcdFxcdFxcdFxcdHN2NGNwaW9cXG5hcHBsaWNhdGlvbi94LXN2NGNyY1xcdFxcdFxcdFxcdHN2NGNyY1xcbmFwcGxpY2F0aW9uL3gtdDN2bS1pbWFnZVxcdFxcdFxcdHQzXFxuYXBwbGljYXRpb24veC10YWRzXFx0XFx0XFx0XFx0Z2FtXFxuYXBwbGljYXRpb24veC10YXJcXHRcXHRcXHRcXHR0YXJcXG5hcHBsaWNhdGlvbi94LXRjbFxcdFxcdFxcdFxcdHRjbFxcbmFwcGxpY2F0aW9uL3gtdGV4XFx0XFx0XFx0XFx0dGV4XFxuYXBwbGljYXRpb24veC10ZXgtdGZtXFx0XFx0XFx0XFx0dGZtXFxuYXBwbGljYXRpb24veC10ZXhpbmZvXFx0XFx0XFx0XFx0dGV4aW5mbyB0ZXhpXFxuYXBwbGljYXRpb24veC10Z2lmXFx0XFx0XFx0XFx0b2JqXFxuYXBwbGljYXRpb24veC11c3RhclxcdFxcdFxcdFxcdHVzdGFyXFxuYXBwbGljYXRpb24veC13YWlzLXNvdXJjZVxcdFxcdFxcdHNyY1xcbmFwcGxpY2F0aW9uL3gteDUwOS1jYS1jZXJ0XFx0XFx0XFx0ZGVyIGNydFxcbmFwcGxpY2F0aW9uL3gteGZpZ1xcdFxcdFxcdFxcdGZpZ1xcbmFwcGxpY2F0aW9uL3gteGxpZmYreG1sXFx0XFx0XFx0XFx0eGxmXFxuYXBwbGljYXRpb24veC14cGluc3RhbGxcXHRcXHRcXHRcXHR4cGlcXG5hcHBsaWNhdGlvbi94LXh6XFx0XFx0XFx0XFx0eHpcXG5hcHBsaWNhdGlvbi94LXptYWNoaW5lXFx0XFx0XFx0XFx0ejEgejIgejMgejQgejUgejYgejcgejhcXG5hcHBsaWNhdGlvbi94YW1sK3htbFxcdFxcdFxcdFxcdHhhbWxcXG5hcHBsaWNhdGlvbi94Y2FwLWRpZmYreG1sXFx0XFx0XFx0eGRmXFxuYXBwbGljYXRpb24veGVuYyt4bWxcXHRcXHRcXHRcXHR4ZW5jXFxuYXBwbGljYXRpb24veGh0bWwreG1sXFx0XFx0XFx0XFx0eGh0bWwgeGh0XFxuYXBwbGljYXRpb24veG1sXFx0XFx0XFx0XFx0XFx0eG1sIHhzbFxcbmFwcGxpY2F0aW9uL3htbC1kdGRcXHRcXHRcXHRcXHRkdGRcXG5hcHBsaWNhdGlvbi94b3AreG1sXFx0XFx0XFx0XFx0eG9wXFxuYXBwbGljYXRpb24veHByb2MreG1sXFx0XFx0XFx0XFx0eHBsXFxuYXBwbGljYXRpb24veHNsdCt4bWxcXHRcXHRcXHRcXHR4c2x0XFxuYXBwbGljYXRpb24veHNwZit4bWxcXHRcXHRcXHRcXHR4c3BmXFxuYXBwbGljYXRpb24veHYreG1sXFx0XFx0XFx0XFx0bXhtbCB4aHZtbCB4dm1sIHh2bVxcbmFwcGxpY2F0aW9uL3lhbmdcXHRcXHRcXHRcXHR5YW5nXFxuYXBwbGljYXRpb24veWluK3htbFxcdFxcdFxcdFxcdHlpblxcbmFwcGxpY2F0aW9uL3ppcFxcdFxcdFxcdFxcdFxcdHppcFxcbmF1ZGlvL2FkcGNtXFx0XFx0XFx0XFx0XFx0YWRwXFxuYXVkaW8vYmFzaWNcXHRcXHRcXHRcXHRcXHRhdSBzbmRcXG5hdWRpby9taWRpXFx0XFx0XFx0XFx0XFx0bWlkIG1pZGkga2FyIHJtaVxcbmF1ZGlvL21wNFxcdFxcdFxcdFxcdFxcdG00YSBtcDRhXFxuYXVkaW8vbXBlZ1xcdFxcdFxcdFxcdFxcdG1wZ2EgbXAyIG1wMmEgbXAzIG0yYSBtM2FcXG5hdWRpby9vZ2dcXHRcXHRcXHRcXHRcXHRvZ2Egb2dnIHNweFxcbmF1ZGlvL3MzbVxcdFxcdFxcdFxcdFxcdHMzbVxcbmF1ZGlvL3NpbGtcXHRcXHRcXHRcXHRcXHRzaWxcXG5hdWRpby92bmQuZGVjZS5hdWRpb1xcdFxcdFxcdFxcdHV2YSB1dnZhXFxuYXVkaW8vdm5kLmRpZ2l0YWwtd2luZHNcXHRcXHRcXHRcXHRlb2xcXG5hdWRpby92bmQuZHJhXFx0XFx0XFx0XFx0XFx0ZHJhXFxuYXVkaW8vdm5kLmR0c1xcdFxcdFxcdFxcdFxcdGR0c1xcbmF1ZGlvL3ZuZC5kdHMuaGRcXHRcXHRcXHRcXHRkdHNoZFxcbmF1ZGlvL3ZuZC5sdWNlbnQudm9pY2VcXHRcXHRcXHRcXHRsdnBcXG5hdWRpby92bmQubXMtcGxheXJlYWR5Lm1lZGlhLnB5YVxcdFxcdHB5YVxcbmF1ZGlvL3ZuZC5udWVyYS5lY2VscDQ4MDBcXHRcXHRcXHRlY2VscDQ4MDBcXG5hdWRpby92bmQubnVlcmEuZWNlbHA3NDcwXFx0XFx0XFx0ZWNlbHA3NDcwXFxuYXVkaW8vdm5kLm51ZXJhLmVjZWxwOTYwMFxcdFxcdFxcdGVjZWxwOTYwMFxcbmF1ZGlvL3ZuZC5yaXBcXHRcXHRcXHRcXHRcXHRyaXBcXG5hdWRpby93ZWJtXFx0XFx0XFx0XFx0XFx0d2ViYVxcbmF1ZGlvL3gtYWFjXFx0XFx0XFx0XFx0XFx0YWFjXFxuYXVkaW8veC1haWZmXFx0XFx0XFx0XFx0XFx0YWlmIGFpZmYgYWlmY1xcbmF1ZGlvL3gtY2FmXFx0XFx0XFx0XFx0XFx0Y2FmXFxuYXVkaW8veC1mbGFjXFx0XFx0XFx0XFx0XFx0ZmxhY1xcbmF1ZGlvL3gtbWF0cm9za2FcXHRcXHRcXHRcXHRta2FcXG5hdWRpby94LW1wZWd1cmxcXHRcXHRcXHRcXHRcXHRtM3VcXG5hdWRpby94LW1zLXdheFxcdFxcdFxcdFxcdFxcdHdheFxcbmF1ZGlvL3gtbXMtd21hXFx0XFx0XFx0XFx0XFx0d21hXFxuYXVkaW8veC1wbi1yZWFsYXVkaW9cXHRcXHRcXHRcXHRyYW0gcmFcXG5hdWRpby94LXBuLXJlYWxhdWRpby1wbHVnaW5cXHRcXHRcXHRybXBcXG5hdWRpby94LXdhdlxcdFxcdFxcdFxcdFxcdHdhdlxcbmF1ZGlvL3htXFx0XFx0XFx0XFx0XFx0eG1cXG5jaGVtaWNhbC94LWNkeFxcdFxcdFxcdFxcdFxcdGNkeFxcbmNoZW1pY2FsL3gtY2lmXFx0XFx0XFx0XFx0XFx0Y2lmXFxuY2hlbWljYWwveC1jbWRmXFx0XFx0XFx0XFx0XFx0Y21kZlxcbmNoZW1pY2FsL3gtY21sXFx0XFx0XFx0XFx0XFx0Y21sXFxuY2hlbWljYWwveC1jc21sXFx0XFx0XFx0XFx0XFx0Y3NtbFxcbmNoZW1pY2FsL3gteHl6XFx0XFx0XFx0XFx0XFx0eHl6XFxuZm9udC9jb2xsZWN0aW9uXFx0XFx0XFx0XFx0XFx0dHRjXFxuZm9udC9vdGZcXHRcXHRcXHRcXHRcXHRvdGZcXG5mb250L3R0ZlxcdFxcdFxcdFxcdFxcdHR0ZlxcbmZvbnQvd29mZlxcdFxcdFxcdFxcdFxcdHdvZmZcXG5mb250L3dvZmYyXFx0XFx0XFx0XFx0XFx0d29mZjJcXG5pbWFnZS9ibXBcXHRcXHRcXHRcXHRcXHRibXBcXG5pbWFnZS9jZ21cXHRcXHRcXHRcXHRcXHRjZ21cXG5pbWFnZS9nM2ZheFxcdFxcdFxcdFxcdFxcdGczXFxuaW1hZ2UvZ2lmXFx0XFx0XFx0XFx0XFx0Z2lmXFxuaW1hZ2UvaWVmXFx0XFx0XFx0XFx0XFx0aWVmXFxuaW1hZ2UvanBlZ1xcdFxcdFxcdFxcdFxcdGpwZWcganBnIGpwZVxcbmltYWdlL2t0eFxcdFxcdFxcdFxcdFxcdGt0eFxcbmltYWdlL3BuZ1xcdFxcdFxcdFxcdFxcdHBuZ1xcbmltYWdlL3Bycy5idGlmXFx0XFx0XFx0XFx0XFx0YnRpZlxcbmltYWdlL3NnaVxcdFxcdFxcdFxcdFxcdHNnaVxcbmltYWdlL3N2Zyt4bWxcXHRcXHRcXHRcXHRcXHRzdmcgc3ZnelxcbmltYWdlL3RpZmZcXHRcXHRcXHRcXHRcXHR0aWZmIHRpZlxcbmltYWdlL3ZuZC5hZG9iZS5waG90b3Nob3BcXHRcXHRcXHRwc2RcXG5pbWFnZS92bmQuZGVjZS5ncmFwaGljXFx0XFx0XFx0XFx0dXZpIHV2dmkgdXZnIHV2dmdcXG5pbWFnZS92bmQuZGp2dVxcdFxcdFxcdFxcdFxcdGRqdnUgZGp2XFxuaW1hZ2Uvdm5kLmR2Yi5zdWJ0aXRsZVxcdFxcdFxcdFxcdHN1YlxcbmltYWdlL3ZuZC5kd2dcXHRcXHRcXHRcXHRcXHRkd2dcXG5pbWFnZS92bmQuZHhmXFx0XFx0XFx0XFx0XFx0ZHhmXFxuaW1hZ2Uvdm5kLmZhc3RiaWRzaGVldFxcdFxcdFxcdFxcdGZic1xcbmltYWdlL3ZuZC5mcHhcXHRcXHRcXHRcXHRcXHRmcHhcXG5pbWFnZS92bmQuZnN0XFx0XFx0XFx0XFx0XFx0ZnN0XFxuaW1hZ2Uvdm5kLmZ1aml4ZXJveC5lZG1pY3MtbW1yXFx0XFx0XFx0bW1yXFxuaW1hZ2Uvdm5kLmZ1aml4ZXJveC5lZG1pY3MtcmxjXFx0XFx0XFx0cmxjXFxuaW1hZ2Uvdm5kLm1zLW1vZGlcXHRcXHRcXHRcXHRtZGlcXG5pbWFnZS92bmQubXMtcGhvdG9cXHRcXHRcXHRcXHR3ZHBcXG5pbWFnZS92bmQubmV0LWZweFxcdFxcdFxcdFxcdG5weFxcbmltYWdlL3ZuZC53YXAud2JtcFxcdFxcdFxcdFxcdHdibXBcXG5pbWFnZS92bmQueGlmZlxcdFxcdFxcdFxcdFxcdHhpZlxcbmltYWdlL3dlYnBcXHRcXHRcXHRcXHRcXHR3ZWJwXFxuaW1hZ2UveC0zZHNcXHRcXHRcXHRcXHRcXHQzZHNcXG5pbWFnZS94LWNtdS1yYXN0ZXJcXHRcXHRcXHRcXHRyYXNcXG5pbWFnZS94LWNteFxcdFxcdFxcdFxcdFxcdGNteFxcbmltYWdlL3gtZnJlZWhhbmRcXHRcXHRcXHRcXHRmaCBmaGMgZmg0IGZoNSBmaDdcXG5pbWFnZS94LWljb25cXHRcXHRcXHRcXHRcXHRpY29cXG5pbWFnZS94LW1yc2lkLWltYWdlXFx0XFx0XFx0XFx0c2lkXFxuaW1hZ2UveC1wY3hcXHRcXHRcXHRcXHRcXHRwY3hcXG5pbWFnZS94LXBpY3RcXHRcXHRcXHRcXHRcXHRwaWMgcGN0XFxuaW1hZ2UveC1wb3J0YWJsZS1hbnltYXBcXHRcXHRcXHRcXHRwbm1cXG5pbWFnZS94LXBvcnRhYmxlLWJpdG1hcFxcdFxcdFxcdFxcdHBibVxcbmltYWdlL3gtcG9ydGFibGUtZ3JheW1hcFxcdFxcdFxcdHBnbVxcbmltYWdlL3gtcG9ydGFibGUtcGl4bWFwXFx0XFx0XFx0XFx0cHBtXFxuaW1hZ2UveC1yZ2JcXHRcXHRcXHRcXHRcXHRyZ2JcXG5pbWFnZS94LXRnYVxcdFxcdFxcdFxcdFxcdHRnYVxcbmltYWdlL3gteGJpdG1hcFxcdFxcdFxcdFxcdFxcdHhibVxcbmltYWdlL3gteHBpeG1hcFxcdFxcdFxcdFxcdFxcdHhwbVxcbmltYWdlL3gteHdpbmRvd2R1bXBcXHRcXHRcXHRcXHR4d2RcXG5tZXNzYWdlL3JmYzgyMlxcdFxcdFxcdFxcdFxcdGVtbCBtaW1lXFxubW9kZWwvaWdlc1xcdFxcdFxcdFxcdFxcdGlncyBpZ2VzXFxubW9kZWwvbWVzaFxcdFxcdFxcdFxcdFxcdG1zaCBtZXNoIHNpbG9cXG5tb2RlbC92bmQuY29sbGFkYSt4bWxcXHRcXHRcXHRcXHRkYWVcXG5tb2RlbC92bmQuZHdmXFx0XFx0XFx0XFx0XFx0ZHdmXFxubW9kZWwvdm5kLmdkbFxcdFxcdFxcdFxcdFxcdGdkbFxcbm1vZGVsL3ZuZC5ndHdcXHRcXHRcXHRcXHRcXHRndHdcXG5tb2RlbC92bmQubXRzXFx0XFx0XFx0XFx0XFx0bXRzXFxubW9kZWwvdm5kLnZ0dVxcdFxcdFxcdFxcdFxcdHZ0dVxcbm1vZGVsL3ZybWxcXHRcXHRcXHRcXHRcXHR3cmwgdnJtbFxcbm1vZGVsL3gzZCtiaW5hcnlcXHRcXHRcXHRcXHR4M2RiIHgzZGJ6XFxubW9kZWwveDNkK3ZybWxcXHRcXHRcXHRcXHRcXHR4M2R2IHgzZHZ6XFxubW9kZWwveDNkK3htbFxcdFxcdFxcdFxcdFxcdHgzZCB4M2R6XFxudGV4dC9jYWNoZS1tYW5pZmVzdFxcdFxcdFxcdFxcdGFwcGNhY2hlXFxudGV4dC9jYWxlbmRhclxcdFxcdFxcdFxcdFxcdGljcyBpZmJcXG50ZXh0L2Nzc1xcdFxcdFxcdFxcdFxcdGNzc1xcbnRleHQvY3N2XFx0XFx0XFx0XFx0XFx0Y3N2XFxudGV4dC9odG1sXFx0XFx0XFx0XFx0XFx0aHRtbCBodG1cXG50ZXh0L24zXFx0XFx0XFx0XFx0XFx0XFx0bjNcXG50ZXh0L3BsYWluXFx0XFx0XFx0XFx0XFx0dHh0IHRleHQgY29uZiBkZWYgbGlzdCBsb2cgaW5cXG50ZXh0L3Bycy5saW5lcy50YWdcXHRcXHRcXHRcXHRkc2NcXG50ZXh0L3JpY2h0ZXh0XFx0XFx0XFx0XFx0XFx0cnR4XFxudGV4dC9zZ21sXFx0XFx0XFx0XFx0XFx0c2dtbCBzZ21cXG50ZXh0L3RhYi1zZXBhcmF0ZWQtdmFsdWVzXFx0XFx0XFx0dHN2XFxudGV4dC90cm9mZlxcdFxcdFxcdFxcdFxcdHQgdHIgcm9mZiBtYW4gbWUgbXNcXG50ZXh0L3R1cnRsZVxcdFxcdFxcdFxcdFxcdHR0bFxcbnRleHQvdXJpLWxpc3RcXHRcXHRcXHRcXHRcXHR1cmkgdXJpcyB1cmxzXFxudGV4dC92Y2FyZFxcdFxcdFxcdFxcdFxcdHZjYXJkXFxudGV4dC92bmQuY3VybFxcdFxcdFxcdFxcdFxcdGN1cmxcXG50ZXh0L3ZuZC5jdXJsLmRjdXJsXFx0XFx0XFx0XFx0ZGN1cmxcXG50ZXh0L3ZuZC5jdXJsLm1jdXJsXFx0XFx0XFx0XFx0bWN1cmxcXG50ZXh0L3ZuZC5jdXJsLnNjdXJsXFx0XFx0XFx0XFx0c2N1cmxcXG50ZXh0L3ZuZC5kdmIuc3VidGl0bGVcXHRcXHRcXHRcXHRzdWJcXG50ZXh0L3ZuZC5mbHlcXHRcXHRcXHRcXHRcXHRmbHlcXG50ZXh0L3ZuZC5mbWkuZmxleHN0b3JcXHRcXHRcXHRcXHRmbHhcXG50ZXh0L3ZuZC5ncmFwaHZpelxcdFxcdFxcdFxcdGd2XFxudGV4dC92bmQuaW4zZC4zZG1sXFx0XFx0XFx0XFx0M2RtbFxcbnRleHQvdm5kLmluM2Quc3BvdFxcdFxcdFxcdFxcdHNwb3RcXG50ZXh0L3ZuZC5zdW4uajJtZS5hcHAtZGVzY3JpcHRvclxcdFxcdGphZFxcbnRleHQvdm5kLndhcC53bWxcXHRcXHRcXHRcXHR3bWxcXG50ZXh0L3ZuZC53YXAud21sc2NyaXB0XFx0XFx0XFx0XFx0d21sc1xcbnRleHQveC1hc21cXHRcXHRcXHRcXHRcXHRzIGFzbVxcbnRleHQveC1jXFx0XFx0XFx0XFx0XFx0YyBjYyBjeHggY3BwIGggaGggZGljXFxudGV4dC94LWZvcnRyYW5cXHRcXHRcXHRcXHRcXHRmIGZvciBmNzcgZjkwXFxudGV4dC94LWphdmEtc291cmNlXFx0XFx0XFx0XFx0amF2YVxcbnRleHQveC1uZm9cXHRcXHRcXHRcXHRcXHRuZm9cXG50ZXh0L3gtb3BtbFxcdFxcdFxcdFxcdFxcdG9wbWxcXG50ZXh0L3gtcGFzY2FsXFx0XFx0XFx0XFx0XFx0cCBwYXNcXG50ZXh0L3gtc2V0ZXh0XFx0XFx0XFx0XFx0XFx0ZXR4XFxudGV4dC94LXNmdlxcdFxcdFxcdFxcdFxcdHNmdlxcbnRleHQveC11dWVuY29kZVxcdFxcdFxcdFxcdFxcdHV1XFxudGV4dC94LXZjYWxlbmRhclxcdFxcdFxcdFxcdHZjc1xcbnRleHQveC12Y2FyZFxcdFxcdFxcdFxcdFxcdHZjZlxcbnZpZGVvLzNncHBcXHRcXHRcXHRcXHRcXHQzZ3BcXG52aWRlby8zZ3BwMlxcdFxcdFxcdFxcdFxcdDNnMlxcbnZpZGVvL2gyNjFcXHRcXHRcXHRcXHRcXHRoMjYxXFxudmlkZW8vaDI2M1xcdFxcdFxcdFxcdFxcdGgyNjNcXG52aWRlby9oMjY0XFx0XFx0XFx0XFx0XFx0aDI2NFxcbnZpZGVvL2pwZWdcXHRcXHRcXHRcXHRcXHRqcGd2XFxudmlkZW8vanBtXFx0XFx0XFx0XFx0XFx0anBtIGpwZ21cXG52aWRlby9tajJcXHRcXHRcXHRcXHRcXHRtajIgbWpwMlxcbnZpZGVvL21wNFxcdFxcdFxcdFxcdFxcdG1wNCBtcDR2IG1wZzRcXG52aWRlby9tcGVnXFx0XFx0XFx0XFx0XFx0bXBlZyBtcGcgbXBlIG0xdiBtMnZcXG52aWRlby9vZ2dcXHRcXHRcXHRcXHRcXHRvZ3ZcXG52aWRlby9xdWlja3RpbWVcXHRcXHRcXHRcXHRcXHRxdCBtb3ZcXG52aWRlby92bmQuZGVjZS5oZFxcdFxcdFxcdFxcdHV2aCB1dnZoXFxudmlkZW8vdm5kLmRlY2UubW9iaWxlXFx0XFx0XFx0XFx0dXZtIHV2dm1cXG52aWRlby92bmQuZGVjZS5wZFxcdFxcdFxcdFxcdHV2cCB1dnZwXFxudmlkZW8vdm5kLmRlY2Uuc2RcXHRcXHRcXHRcXHR1dnMgdXZ2c1xcbnZpZGVvL3ZuZC5kZWNlLnZpZGVvXFx0XFx0XFx0XFx0dXZ2IHV2dnZcXG52aWRlby92bmQuZHZiLmZpbGVcXHRcXHRcXHRcXHRkdmJcXG52aWRlby92bmQuZnZ0XFx0XFx0XFx0XFx0XFx0ZnZ0XFxudmlkZW8vdm5kLm1wZWd1cmxcXHRcXHRcXHRcXHRteHUgbTR1XFxudmlkZW8vdm5kLm1zLXBsYXlyZWFkeS5tZWRpYS5weXZcXHRcXHRweXZcXG52aWRlby92bmQudXZ2dS5tcDRcXHRcXHRcXHRcXHR1dnUgdXZ2dVxcbnZpZGVvL3ZuZC52aXZvXFx0XFx0XFx0XFx0XFx0dml2XFxudmlkZW8vd2VibVxcdFxcdFxcdFxcdFxcdHdlYm1cXG52aWRlby94LWY0dlxcdFxcdFxcdFxcdFxcdGY0dlxcbnZpZGVvL3gtZmxpXFx0XFx0XFx0XFx0XFx0ZmxpXFxudmlkZW8veC1mbHZcXHRcXHRcXHRcXHRcXHRmbHZcXG52aWRlby94LW00dlxcdFxcdFxcdFxcdFxcdG00dlxcbnZpZGVvL3gtbWF0cm9za2FcXHRcXHRcXHRcXHRta3YgbWszZCBta3NcXG52aWRlby94LW1uZ1xcdFxcdFxcdFxcdFxcdG1uZ1xcbnZpZGVvL3gtbXMtYXNmXFx0XFx0XFx0XFx0XFx0YXNmIGFzeFxcbnZpZGVvL3gtbXMtdm9iXFx0XFx0XFx0XFx0XFx0dm9iXFxudmlkZW8veC1tcy13bVxcdFxcdFxcdFxcdFxcdHdtXFxudmlkZW8veC1tcy13bXZcXHRcXHRcXHRcXHRcXHR3bXZcXG52aWRlby94LW1zLXdteFxcdFxcdFxcdFxcdFxcdHdteFxcbnZpZGVvL3gtbXMtd3Z4XFx0XFx0XFx0XFx0XFx0d3Z4XFxudmlkZW8veC1tc3ZpZGVvXFx0XFx0XFx0XFx0XFx0YXZpXFxudmlkZW8veC1zZ2ktbW92aWVcXHRcXHRcXHRcXHRtb3ZpZVxcbnZpZGVvL3gtc212XFx0XFx0XFx0XFx0XFx0c212XFxueC1jb25mZXJlbmNlL3gtY29vbHRhbGtcXHRcXHRcXHRcXHRpY2VcXG5cIjtcblxuY29uc3QgbWFwID0gbmV3IE1hcCgpO1xuXG5taW1lX3Jhdy5zcGxpdCgnXFxuJykuZm9yRWFjaCgocm93KSA9PiB7XG5cdGNvbnN0IG1hdGNoID0gLyguKz8pXFx0KyguKykvLmV4ZWMocm93KTtcblx0aWYgKCFtYXRjaCkgcmV0dXJuO1xuXG5cdGNvbnN0IHR5cGUgPSBtYXRjaFsxXTtcblx0Y29uc3QgZXh0ZW5zaW9ucyA9IG1hdGNoWzJdLnNwbGl0KCcgJyk7XG5cblx0ZXh0ZW5zaW9ucy5mb3JFYWNoKGV4dCA9PiB7XG5cdFx0bWFwLnNldChleHQsIHR5cGUpO1xuXHR9KTtcbn0pO1xuXG5mdW5jdGlvbiBsb29rdXAoZmlsZSkge1xuXHRjb25zdCBtYXRjaCA9IC9cXC4oW15cXC5dKykkLy5leGVjKGZpbGUpO1xuXHRyZXR1cm4gbWF0Y2ggJiYgbWFwLmdldChtYXRjaFsxXSk7XG59XG5cbmZ1bmN0aW9uIG1pZGRsZXdhcmUob3B0c1xuXG5cbiA9IHt9KSB7XG5cdGNvbnN0IHsgc2Vzc2lvbiwgaWdub3JlIH0gPSBvcHRzO1xuXG5cdGxldCBlbWl0dGVkX2Jhc2VwYXRoID0gZmFsc2U7XG5cblx0cmV0dXJuIGNvbXBvc2VfaGFuZGxlcnMoaWdub3JlLCBbXG5cdFx0KHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdFx0XHRpZiAocmVxLmJhc2VVcmwgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsZXQgeyBvcmlnaW5hbFVybCB9ID0gcmVxO1xuXHRcdFx0XHRpZiAocmVxLnVybCA9PT0gJy8nICYmIG9yaWdpbmFsVXJsW29yaWdpbmFsVXJsLmxlbmd0aCAtIDFdICE9PSAnLycpIHtcblx0XHRcdFx0XHRvcmlnaW5hbFVybCArPSAnLyc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXEuYmFzZVVybCA9IG9yaWdpbmFsVXJsXG5cdFx0XHRcdFx0PyBvcmlnaW5hbFVybC5zbGljZSgwLCAtcmVxLnVybC5sZW5ndGgpXG5cdFx0XHRcdFx0OiAnJztcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFlbWl0dGVkX2Jhc2VwYXRoICYmIHByb2Nlc3Muc2VuZCkge1xuXHRcdFx0XHRwcm9jZXNzLnNlbmQoe1xuXHRcdFx0XHRcdF9fc2FwcGVyX186IHRydWUsXG5cdFx0XHRcdFx0ZXZlbnQ6ICdiYXNlcGF0aCcsXG5cdFx0XHRcdFx0YmFzZXBhdGg6IHJlcS5iYXNlVXJsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGVtaXR0ZWRfYmFzZXBhdGggPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocmVxLnBhdGggPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXEucGF0aCA9IHJlcS51cmwucmVwbGFjZSgvXFw/LiovLCAnJyk7XG5cdFx0XHR9XG5cblx0XHRcdG5leHQoKTtcblx0XHR9LFxuXG5cdFx0ZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYnVpbGRfZGlyLCAnc2VydmljZS13b3JrZXIuanMnKSkgJiYgc2VydmUoe1xuXHRcdFx0cGF0aG5hbWU6ICcvc2VydmljZS13b3JrZXIuanMnLFxuXHRcdFx0Y2FjaGVfY29udHJvbDogJ25vLWNhY2hlLCBuby1zdG9yZSwgbXVzdC1yZXZhbGlkYXRlJ1xuXHRcdH0pLFxuXG5cdFx0ZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYnVpbGRfZGlyLCAnc2VydmljZS13b3JrZXIuanMubWFwJykpICYmIHNlcnZlKHtcblx0XHRcdHBhdGhuYW1lOiAnL3NlcnZpY2Utd29ya2VyLmpzLm1hcCcsXG5cdFx0XHRjYWNoZV9jb250cm9sOiAnbm8tY2FjaGUsIG5vLXN0b3JlLCBtdXN0LXJldmFsaWRhdGUnXG5cdFx0fSksXG5cblx0XHRzZXJ2ZSh7XG5cdFx0XHRwcmVmaXg6ICcvY2xpZW50LycsXG5cdFx0XHRjYWNoZV9jb250cm9sOiBkZXYgPyAnbm8tY2FjaGUnIDogJ21heC1hZ2U9MzE1MzYwMDAsIGltbXV0YWJsZSdcblx0XHR9KSxcblxuXHRcdGdldF9zZXJ2ZXJfcm91dGVfaGFuZGxlcihtYW5pZmVzdC5zZXJ2ZXJfcm91dGVzKSxcblxuXHRcdGdldF9wYWdlX2hhbmRsZXIobWFuaWZlc3QsIHNlc3Npb24gfHwgbm9vcClcblx0XS5maWx0ZXIoQm9vbGVhbikpO1xufVxuXG5mdW5jdGlvbiBjb21wb3NlX2hhbmRsZXJzKGlnbm9yZSwgaGFuZGxlcnMpIHtcblx0Y29uc3QgdG90YWwgPSBoYW5kbGVycy5sZW5ndGg7XG5cblx0ZnVuY3Rpb24gbnRoX2hhbmRsZXIobiwgcmVxLCByZXMsIG5leHQpIHtcblx0XHRpZiAobiA+PSB0b3RhbCkge1xuXHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHR9XG5cblx0XHRoYW5kbGVyc1tuXShyZXEsIHJlcywgKCkgPT4gbnRoX2hhbmRsZXIobisxLCByZXEsIHJlcywgbmV4dCkpO1xuXHR9XG5cblx0cmV0dXJuICFpZ25vcmVcblx0XHQ/IChyZXEsIHJlcywgbmV4dCkgPT4gbnRoX2hhbmRsZXIoMCwgcmVxLCByZXMsIG5leHQpXG5cdFx0OiAocmVxLCByZXMsIG5leHQpID0+IHtcblx0XHRcdGlmIChzaG91bGRfaWdub3JlKHJlcS5wYXRoLCBpZ25vcmUpKSB7XG5cdFx0XHRcdG5leHQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG50aF9oYW5kbGVyKDAsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHRcdH1cblx0XHR9O1xufVxuXG5mdW5jdGlvbiBzaG91bGRfaWdub3JlKHVyaSwgdmFsKSB7XG5cdGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHJldHVybiB2YWwuc29tZSh4ID0+IHNob3VsZF9pZ25vcmUodXJpLCB4KSk7XG5cdGlmICh2YWwgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiB2YWwudGVzdCh1cmkpO1xuXHRpZiAodHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHZhbCh1cmkpO1xuXHRyZXR1cm4gdXJpLnN0YXJ0c1dpdGgodmFsLmNoYXJDb2RlQXQoMCkgPT09IDQ3ID8gdmFsIDogYC8ke3ZhbH1gKTtcbn1cblxuZnVuY3Rpb24gc2VydmUoeyBwcmVmaXgsIHBhdGhuYW1lLCBjYWNoZV9jb250cm9sIH1cblxuXG5cbikge1xuXHRjb25zdCBmaWx0ZXIgPSBwYXRobmFtZVxuXHRcdD8gKHJlcSkgPT4gcmVxLnBhdGggPT09IHBhdGhuYW1lXG5cdFx0OiAocmVxKSA9PiByZXEucGF0aC5zdGFydHNXaXRoKHByZWZpeCk7XG5cblx0Y29uc3QgY2FjaGUgPSBuZXcgTWFwKCk7XG5cblx0Y29uc3QgcmVhZCA9IGRldlxuXHRcdD8gKGZpbGUpID0+IGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoYnVpbGRfZGlyLCBmaWxlKSlcblx0XHQ6IChmaWxlKSA9PiAoY2FjaGUuaGFzKGZpbGUpID8gY2FjaGUgOiBjYWNoZS5zZXQoZmlsZSwgZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShidWlsZF9kaXIsIGZpbGUpKSkpLmdldChmaWxlKTtcblxuXHRyZXR1cm4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdFx0aWYgKGZpbHRlcihyZXEpKSB7XG5cdFx0XHRjb25zdCB0eXBlID0gbG9va3VwKHJlcS5wYXRoKTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgZmlsZSA9IGRlY29kZVVSSUNvbXBvbmVudChyZXEucGF0aC5zbGljZSgxKSk7XG5cdFx0XHRcdGNvbnN0IGRhdGEgPSByZWFkKGZpbGUpO1xuXG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIHR5cGUpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDYWNoZS1Db250cm9sJywgY2FjaGVfY29udHJvbCk7XG5cdFx0XHRcdHJlcy5lbmQoZGF0YSk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0cmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG5cdFx0XHRcdHJlcy5lbmQoJ25vdCBmb3VuZCcpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRuZXh0KCk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBub29wKCl7fVxuXG5leHBvcnQgeyBtaWRkbGV3YXJlIH07XG4iLCJpbXBvcnQgc2lydiBmcm9tICdzaXJ2JztcbmltcG9ydCBwb2xrYSBmcm9tICdwb2xrYSc7XG5pbXBvcnQgY29tcHJlc3Npb24gZnJvbSAnY29tcHJlc3Npb24nO1xuaW1wb3J0ICogYXMgc2FwcGVyIGZyb20gJ0BzYXBwZXIvc2VydmVyJztcblxuY29uc3QgeyBQT1JULCBOT0RFX0VOViB9ID0gcHJvY2Vzcy5lbnY7XG5jb25zdCBkZXYgPSBOT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JztcblxucG9sa2EoKSAvLyBZb3UgY2FuIGFsc28gdXNlIEV4cHJlc3Ncblx0LnVzZShcblx0XHQnL0NoYXJpdGlmeScsXG5cdFx0Y29tcHJlc3Npb24oeyB0aHJlc2hvbGQ6IDAgfSksXG5cdFx0c2lydignc3RhdGljJywgeyBkZXYgfSksXG5cdFx0c2FwcGVyLm1pZGRsZXdhcmUoKVxuXHQpXG5cdC5saXN0ZW4oUE9SVCwgZXJyID0+IHtcblx0XHRpZiAoZXJyKSBjb25zb2xlLmxvZygnZXJyb3InLCBlcnIpO1xuXHR9KTtcbiJdLCJuYW1lcyI6WyJnZXQiLCJwcmVsb2FkIiwiY29tcG9uZW50XzAiLCJjb21wb25lbnRfMSIsImNvbXBvbmVudF8yIiwicHJlbG9hZF8yIiwiY29tcG9uZW50XzMiLCJwcmVsb2FkXzMiLCJyb290IiwiZXJyb3IiLCJlc2NhcGVkIiwibG9va3VwIiwibm9vcCIsInNhcHBlci5taWRkbGV3YXJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7OztBQVNBLE1BQU0sS0FBSyxHQUFHO0NBQ2I7RUFDQyxLQUFLLEVBQUUsaUJBQWlCO0VBQ3hCLElBQUksRUFBRSxnQkFBZ0I7RUFDdEIsSUFBSSxFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7RUFhUCxDQUFDO0VBQ0Q7O0NBRUQ7RUFDQyxLQUFLLEVBQUUsbUJBQW1CO0VBQzFCLElBQUksRUFBRSxtQkFBbUI7RUFDekIsSUFBSSxFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQWtCUCxDQUFDO0VBQ0Q7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
