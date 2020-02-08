function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
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
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if (typeof $$scope.dirty === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}
function null_to_empty(value) {
    return value == null ? '' : value;
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
    // @ts-ignore
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
        if (attributes[key] == null) {
            node.removeAttribute(key);
        }
        else if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (descriptors[key] && descriptors[key].set) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
}
function xlink_attr(node, attribute, value) {
    node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function claim_element(nodes, name, attributes, svg) {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.nodeName === name) {
            let j = 0;
            while (j < node.attributes.length) {
                const attribute = node.attributes[j];
                if (attributes[attribute.name]) {
                    j++;
                }
                else {
                    node.removeAttribute(attribute.name);
                }
            }
            return nodes.splice(i, 1)[0];
        }
    }
    return svg ? svg_element(name) : element(name);
}
function claim_text(nodes, data) {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.nodeType === 3) {
            node.data = '' + data;
            return nodes.splice(i, 1)[0];
        }
    }
    return text(data);
}
function claim_space(nodes) {
    return claim_text(nodes, ' ');
}
function set_input_value(input, value) {
    if (value != null || input.value) {
        input.value = value;
    }
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}
function query_selector_all(selector, parent = document.body) {
    return Array.from(parent.querySelectorAll(selector));
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
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

const globals = (typeof window !== 'undefined' ? window : global);

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}
function create_component(block) {
    block && block.c();
}
function claim_component(block, parent_nodes) {
    block && block.l(parent_nodes);
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if ($$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.1' }, detail)));
}
function append_dev(target, node) {
    dispatch_dev("SvelteDOMInsert", { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev("SvelteDOMInsert", { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev("SvelteDOMRemove", { node });
    detach(node);
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
    else
        dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
}
function prop_dev(node, property, value) {
    node[property] = value;
    dispatch_dev("SvelteDOMSetProperty", { node, property, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.data === data)
        return;
    dispatch_dev("SvelteDOMSetData", { node: text, data });
    text.data = data;
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error(`'target' is a required option`);
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
    }
}

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

const preload = () => ({});

const contextMapbox = {};

/* src/layouts/Map/Map.svelte generated by Svelte v3.18.1 */
const file = "src/layouts/Map/Map.svelte";

// (72:4) {#if map}
function create_if_block(ctx) {
	let current;
	const default_slot_template = /*$$slots*/ ctx[8].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

	const block = {
		c: function create() {
			if (default_slot) default_slot.c();
		},
		l: function claim(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m: function mount(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p: function update(ctx, dirty) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 128) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[7], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null));
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(72:4) {#if map}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let section;
	let current;
	let if_block = /*map*/ ctx[0] && create_if_block(ctx);

	const block = {
		c: function create() {
			section = element("section");
			if (if_block) if_block.c();
			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			if (if_block) if_block.l(section_nodes);
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(section, "class", "svelte-i65r7p");
			add_location(section, file, 70, 0, 1749);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			if (if_block) if_block.m(section, null);
			/*section_binding*/ ctx[9](section);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (/*map*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(section, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			if (if_block) if_block.d();
			/*section_binding*/ ctx[9](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance($$self, $$props, $$invalidate) {
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
		$$invalidate(0, map = new mapboxgl.Map({
				zoom,
				center,
				container,
				style: "mapbox://styles/mapbox/streets-v11"
			}));

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

	const writable_props = ["center", "zoom"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Map> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function section_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(1, container = $$value);
		});
	}

	$$self.$set = $$props => {
		if ("center" in $$props) $$invalidate(2, center = $$props.center);
		if ("zoom" in $$props) $$invalidate(3, zoom = $$props.zoom);
		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => {
		return { center, zoom, map, container };
	};

	$$self.$inject_state = $$props => {
		if ("center" in $$props) $$invalidate(2, center = $$props.center);
		if ("zoom" in $$props) $$invalidate(3, zoom = $$props.zoom);
		if ("map" in $$props) $$invalidate(0, map = $$props.map);
		if ("container" in $$props) $$invalidate(1, container = $$props.container);
	};

	return [
		map,
		container,
		center,
		zoom,
		dispatch,
		onCreateMap,
		createMap,
		$$scope,
		$$slots,
		section_binding
	];
}

class Map$1 extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, { center: 2, zoom: 3 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Map",
			options,
			id: create_fragment.name
		});
	}

	get center() {
		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set center(value) {
		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get zoom() {
		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set zoom(value) {
		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/layouts/Map/MapMarker.svelte generated by Svelte v3.18.1 */

function create_fragment$1(ctx) {
	const block = {
		c: noop,
		l: noop,
		m: noop,
		p: noop,
		i: noop,
		o: noop,
		d: noop
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$1.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$1($$self, $$props, $$invalidate) {
	const { getMap, getMapbox } = getContext(contextMapbox);
	const map = getMap();
	const mapbox = getMapbox();
	let { lng } = $$props;
	let { lat } = $$props;
	let { label = "label" } = $$props;
	const popup = new mapbox.Popup({ offset: 25 }).setText(label);
	const marker = new mapbox.Marker().setLngLat([lng, lat]).setPopup(popup).addTo(map);
	const writable_props = ["lng", "lat", "label"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MapMarker> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("lng" in $$props) $$invalidate(0, lng = $$props.lng);
		if ("lat" in $$props) $$invalidate(1, lat = $$props.lat);
		if ("label" in $$props) $$invalidate(2, label = $$props.label);
	};

	$$self.$capture_state = () => {
		return { lng, lat, label };
	};

	$$self.$inject_state = $$props => {
		if ("lng" in $$props) $$invalidate(0, lng = $$props.lng);
		if ("lat" in $$props) $$invalidate(1, lat = $$props.lat);
		if ("label" in $$props) $$invalidate(2, label = $$props.label);
	};

	return [lng, lat, label];
}

class MapMarker extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { lng: 0, lat: 1, label: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "MapMarker",
			options,
			id: create_fragment$1.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*lng*/ ctx[0] === undefined && !("lng" in props)) {
			console.warn("<MapMarker> was created without expected prop 'lng'");
		}

		if (/*lat*/ ctx[1] === undefined && !("lat" in props)) {
			console.warn("<MapMarker> was created without expected prop 'lat'");
		}
	}

	get lng() {
		throw new Error("<MapMarker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set lng(value) {
		throw new Error("<MapMarker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get lat() {
		throw new Error("<MapMarker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set lat(value) {
		throw new Error("<MapMarker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<MapMarker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<MapMarker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var classnames = createCommonjsModule(function (module) {
/*!
  Copyright (c) 2017 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg) && arg.length) {
				var inner = classNames.apply(null, arg);
				if (inner) {
					classes.push(inner);
				}
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if ( module.exports) {
		classNames.default = classNames;
		module.exports = classNames;
	} else {
		window.classNames = classNames;
	}
}());
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
const file$1 = "src/components/Icon.svelte";

function create_fragment$2(ctx) {
	let svg;
	let use;
	let use_xlink_href_value;
	let svg_class_value;

	const block = {
		c: function create() {
			svg = svg_element("svg");
			use = svg_element("use");
			this.h();
		},
		l: function claim(nodes) {
			svg = claim_element(
				nodes,
				"svg",
				{
					id: true,
					title: true,
					class: true,
					style: true,
					"aria-label": true
				},
				1
			);

			var svg_nodes = children(svg);
			use = claim_element(svg_nodes, "use", { "xlink:href": true, class: true }, 1);
			children(use).forEach(detach_dev);
			svg_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			xlink_attr(use, "xlink:href", use_xlink_href_value = `#ico-${/*type*/ ctx[0]}`);
			attr_dev(use, "class", "ico-use svelte-1y5h9x9");
			add_location(use, file$1, 26, 4, 745);
			attr_dev(svg, "id", /*id*/ ctx[1]);
			attr_dev(svg, "title", /*titleProp*/ ctx[3]);
			attr_dev(svg, "class", svg_class_value = "" + (null_to_empty(/*classProp*/ ctx[2]) + " svelte-1y5h9x9"));
			attr_dev(svg, "style", /*styleProp*/ ctx[5]);
			attr_dev(svg, "aria-label", /*ariaLabelProp*/ ctx[4]);
			add_location(svg, file$1, 19, 0, 608);
		},
		m: function mount(target, anchor) {
			insert_dev(target, svg, anchor);
			append_dev(svg, use);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*type*/ 1 && use_xlink_href_value !== (use_xlink_href_value = `#ico-${/*type*/ ctx[0]}`)) {
				xlink_attr(use, "xlink:href", use_xlink_href_value);
			}

			if (dirty & /*id*/ 2) {
				attr_dev(svg, "id", /*id*/ ctx[1]);
			}

			if (dirty & /*classProp*/ 4 && svg_class_value !== (svg_class_value = "" + (null_to_empty(/*classProp*/ ctx[2]) + " svelte-1y5h9x9"))) {
				attr_dev(svg, "class", svg_class_value);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(svg);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$2.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$2($$self, $$props, $$invalidate) {
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

	$$self.$set = $$new_props => {
		$$invalidate(12, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("type" in $$new_props) $$invalidate(0, type = $$new_props.type);
		if ("is" in $$new_props) $$invalidate(6, is = $$new_props.is);
		if ("size" in $$new_props) $$invalidate(7, size = $$new_props.size);
		if ("rotate" in $$new_props) $$invalidate(8, rotate = $$new_props.rotate);
		if ("style" in $$new_props) $$invalidate(9, style = $$new_props.style);
		if ("id" in $$new_props) $$invalidate(1, id = $$new_props.id);
		if ("title" in $$new_props) $$invalidate(10, title = $$new_props.title);
		if ("ariaLabel" in $$new_props) $$invalidate(11, ariaLabel = $$new_props.ariaLabel);
	};

	$$self.$capture_state = () => {
		return {
			type,
			is,
			size,
			rotate,
			style,
			id,
			title,
			ariaLabel,
			titleProp,
			ariaLabelProp,
			styleProp,
			classProp
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(12, $$props = assign(assign({}, $$props), $$new_props));
		if ("type" in $$props) $$invalidate(0, type = $$new_props.type);
		if ("is" in $$props) $$invalidate(6, is = $$new_props.is);
		if ("size" in $$props) $$invalidate(7, size = $$new_props.size);
		if ("rotate" in $$props) $$invalidate(8, rotate = $$new_props.rotate);
		if ("style" in $$props) $$invalidate(9, style = $$new_props.style);
		if ("id" in $$props) $$invalidate(1, id = $$new_props.id);
		if ("title" in $$props) $$invalidate(10, title = $$new_props.title);
		if ("ariaLabel" in $$props) $$invalidate(11, ariaLabel = $$new_props.ariaLabel);
		if ("titleProp" in $$props) $$invalidate(3, titleProp = $$new_props.titleProp);
		if ("ariaLabelProp" in $$props) $$invalidate(4, ariaLabelProp = $$new_props.ariaLabelProp);
		if ("styleProp" in $$props) $$invalidate(5, styleProp = $$new_props.styleProp);
		if ("classProp" in $$props) $$invalidate(2, classProp = $$new_props.classProp);
	};

	let classProp;

	$$self.$$.update = () => {
		 $$invalidate(2, classProp = classnames("ico", is, size, $$props.class));
	};

	$$props = exclude_internal_props($$props);

	return [
		type,
		id,
		classProp,
		titleProp,
		ariaLabelProp,
		styleProp,
		is,
		size,
		rotate,
		style,
		title,
		ariaLabel
	];
}

class Icon extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
			type: 0,
			is: 6,
			size: 7,
			rotate: 8,
			style: 9,
			id: 1,
			title: 10,
			ariaLabel: 11
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Icon",
			options,
			id: create_fragment$2.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*type*/ ctx[0] === undefined && !("type" in props)) {
			console.warn("<Icon> was created without expected prop 'type'");
		}

		if (/*is*/ ctx[6] === undefined && !("is" in props)) {
			console.warn("<Icon> was created without expected prop 'is'");
		}
	}

	get type() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set type(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get is() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set is(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get size() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set size(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rotate() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rotate(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get title() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ariaLabel() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ariaLabel(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/Rate.svelte generated by Svelte v3.18.1 */
const file$2 = "src/components/Rate.svelte";

function create_fragment$3(ctx) {
	let ul;
	let li0;
	let t0;
	let li1;
	let t1;
	let li2;
	let t2;
	let li3;
	let t3;
	let li4;
	let current;

	const icon0 = new Icon({
			props: {
				is: /*is*/ ctx[0],
				size: /*size*/ ctx[1],
				type: "heart-filled"
			},
			$$inline: true
		});

	const icon1 = new Icon({
			props: {
				is: /*is*/ ctx[0],
				size: /*size*/ ctx[1],
				type: "heart-filled"
			},
			$$inline: true
		});

	const icon2 = new Icon({
			props: {
				is: /*is*/ ctx[0],
				size: /*size*/ ctx[1],
				type: "heart-filled"
			},
			$$inline: true
		});

	const icon3 = new Icon({
			props: {
				is: /*is*/ ctx[0],
				size: /*size*/ ctx[1],
				type: "heart-filled"
			},
			$$inline: true
		});

	const icon4 = new Icon({
			props: {
				is: /*is*/ ctx[0],
				size: /*size*/ ctx[1],
				type: "heart-filled"
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			ul = element("ul");
			li0 = element("li");
			create_component(icon0.$$.fragment);
			t0 = space();
			li1 = element("li");
			create_component(icon1.$$.fragment);
			t1 = space();
			li2 = element("li");
			create_component(icon2.$$.fragment);
			t2 = space();
			li3 = element("li");
			create_component(icon3.$$.fragment);
			t3 = space();
			li4 = element("li");
			create_component(icon4.$$.fragment);
			this.h();
		},
		l: function claim(nodes) {
			ul = claim_element(nodes, "UL", { class: true });
			var ul_nodes = children(ul);
			li0 = claim_element(ul_nodes, "LI", { class: true });
			var li0_nodes = children(li0);
			claim_component(icon0.$$.fragment, li0_nodes);
			li0_nodes.forEach(detach_dev);
			t0 = claim_space(ul_nodes);
			li1 = claim_element(ul_nodes, "LI", { class: true });
			var li1_nodes = children(li1);
			claim_component(icon1.$$.fragment, li1_nodes);
			li1_nodes.forEach(detach_dev);
			t1 = claim_space(ul_nodes);
			li2 = claim_element(ul_nodes, "LI", { class: true });
			var li2_nodes = children(li2);
			claim_component(icon2.$$.fragment, li2_nodes);
			li2_nodes.forEach(detach_dev);
			t2 = claim_space(ul_nodes);
			li3 = claim_element(ul_nodes, "LI", { class: true });
			var li3_nodes = children(li3);
			claim_component(icon3.$$.fragment, li3_nodes);
			li3_nodes.forEach(detach_dev);
			t3 = claim_space(ul_nodes);
			li4 = claim_element(ul_nodes, "LI", { class: true });
			var li4_nodes = children(li4);
			claim_component(icon4.$$.fragment, li4_nodes);
			li4_nodes.forEach(detach_dev);
			ul_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(li0, "class", "svelte-9gtglw");
			add_location(li0, file$2, 8, 4, 172);
			attr_dev(li1, "class", "svelte-9gtglw");
			add_location(li1, file$2, 11, 4, 239);
			attr_dev(li2, "class", "svelte-9gtglw");
			add_location(li2, file$2, 14, 4, 306);
			attr_dev(li3, "class", "svelte-9gtglw");
			add_location(li3, file$2, 17, 4, 373);
			attr_dev(li4, "class", "svelte-9gtglw");
			add_location(li4, file$2, 20, 4, 440);
			attr_dev(ul, "class", "rate svelte-9gtglw");
			add_location(ul, file$2, 7, 0, 150);
		},
		m: function mount(target, anchor) {
			insert_dev(target, ul, anchor);
			append_dev(ul, li0);
			mount_component(icon0, li0, null);
			append_dev(ul, t0);
			append_dev(ul, li1);
			mount_component(icon1, li1, null);
			append_dev(ul, t1);
			append_dev(ul, li2);
			mount_component(icon2, li2, null);
			append_dev(ul, t2);
			append_dev(ul, li3);
			mount_component(icon3, li3, null);
			append_dev(ul, t3);
			append_dev(ul, li4);
			mount_component(icon4, li4, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const icon0_changes = {};
			if (dirty & /*is*/ 1) icon0_changes.is = /*is*/ ctx[0];
			if (dirty & /*size*/ 2) icon0_changes.size = /*size*/ ctx[1];
			icon0.$set(icon0_changes);
			const icon1_changes = {};
			if (dirty & /*is*/ 1) icon1_changes.is = /*is*/ ctx[0];
			if (dirty & /*size*/ 2) icon1_changes.size = /*size*/ ctx[1];
			icon1.$set(icon1_changes);
			const icon2_changes = {};
			if (dirty & /*is*/ 1) icon2_changes.is = /*is*/ ctx[0];
			if (dirty & /*size*/ 2) icon2_changes.size = /*size*/ ctx[1];
			icon2.$set(icon2_changes);
			const icon3_changes = {};
			if (dirty & /*is*/ 1) icon3_changes.is = /*is*/ ctx[0];
			if (dirty & /*size*/ 2) icon3_changes.size = /*size*/ ctx[1];
			icon3.$set(icon3_changes);
			const icon4_changes = {};
			if (dirty & /*is*/ 1) icon4_changes.is = /*is*/ ctx[0];
			if (dirty & /*size*/ 2) icon4_changes.size = /*size*/ ctx[1];
			icon4.$set(icon4_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(icon0.$$.fragment, local);
			transition_in(icon1.$$.fragment, local);
			transition_in(icon2.$$.fragment, local);
			transition_in(icon3.$$.fragment, local);
			transition_in(icon4.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(icon0.$$.fragment, local);
			transition_out(icon1.$$.fragment, local);
			transition_out(icon2.$$.fragment, local);
			transition_out(icon3.$$.fragment, local);
			transition_out(icon4.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(ul);
			destroy_component(icon0);
			destroy_component(icon1);
			destroy_component(icon2);
			destroy_component(icon3);
			destroy_component(icon4);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$3.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$3($$self, $$props, $$invalidate) {
	let { is = "danger" } = $$props;
	let { size = "medium" } = $$props; // small|medium|mig
	const writable_props = ["is", "size"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Rate> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("is" in $$props) $$invalidate(0, is = $$props.is);
		if ("size" in $$props) $$invalidate(1, size = $$props.size);
	};

	$$self.$capture_state = () => {
		return { is, size };
	};

	$$self.$inject_state = $$props => {
		if ("is" in $$props) $$invalidate(0, is = $$props.is);
		if ("size" in $$props) $$invalidate(1, size = $$props.size);
	};

	return [is, size];
}

class Rate extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { is: 0, size: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Rate",
			options,
			id: create_fragment$3.name
		});
	}

	get is() {
		throw new Error("<Rate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set is(value) {
		throw new Error("<Rate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get size() {
		throw new Error("<Rate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set size(value) {
		throw new Error("<Rate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/Input.svelte generated by Svelte v3.18.1 */
const file$3 = "src/components/Input.svelte";

// (78:0) {:else}
function create_else_block(ctx) {
	let input;
	let dispose;

	let input_levels = [
		{ min: /*min*/ ctx[6] },
		{ max: /*max*/ ctx[7] },
		{ name: /*name*/ ctx[1] },
		{ list: /*list*/ ctx[8] },
		{ form: /*form*/ ctx[9] },
		{ align: /*align*/ ctx[2] },
		{ readOnly: /*readonly*/ ctx[10] },
		{ disabled: /*disabled*/ ctx[5] },
		{ required: /*required*/ ctx[11] },
		{ maxlength: /*maxlength*/ ctx[3] },
		{ placeholder: /*placeholder*/ ctx[12] },
		{ id: /*idProp*/ ctx[15] },
		{ class: /*classProp*/ ctx[13] },
		{ title: /*titleProp*/ ctx[17] },
		{ style: /*styleProp*/ ctx[20] },
		{ pattern: /*patternProp*/ ctx[21] },
		{ "aria-label": /*ariaLabelProp*/ ctx[18] },
		{
			autocomplete: /*autocompleteProp*/ ctx[19]
		},
		{ type: /*typeProp*/ ctx[16] }
	];

	let input_data = {};

	for (let i = 0; i < input_levels.length; i += 1) {
		input_data = assign(input_data, input_levels[i]);
	}

	const block = {
		c: function create() {
			input = element("input");
			this.h();
		},
		l: function claim(nodes) {
			input = claim_element(nodes, "INPUT", {
				min: true,
				max: true,
				name: true,
				list: true,
				form: true,
				align: true,
				readonly: true,
				disabled: true,
				required: true,
				maxlength: true,
				placeholder: true,
				id: true,
				class: true,
				title: true,
				style: true,
				pattern: true,
				"aria-label": true,
				autocomplete: true
			});

			this.h();
		},
		h: function hydrate() {
			set_attributes(input, input_data);
			toggle_class(input, "svelte-1vg8tdg", true);
			add_location(input, file$3, 78, 4, 2783);
		},
		m: function mount(target, anchor) {
			insert_dev(target, input, anchor);
			set_input_value(input, /*value*/ ctx[0]);

			dispose = [
				listen_dev(input, "input", /*input_input_handler*/ ctx[36]),
				listen_dev(input, "blur", /*blur_handler_1*/ ctx[37], false, false, false),
				listen_dev(input, "focus", /*focus_handler_1*/ ctx[38], false, false, false),
				listen_dev(input, "click", /*onClick*/ ctx[22], false, false, false)
			];
		},
		p: function update(ctx, dirty) {
			set_attributes(input, get_spread_update(input_levels, [
				dirty[0] & /*min*/ 64 && { min: /*min*/ ctx[6] },
				dirty[0] & /*max*/ 128 && { max: /*max*/ ctx[7] },
				dirty[0] & /*name*/ 2 && { name: /*name*/ ctx[1] },
				dirty[0] & /*list*/ 256 && { list: /*list*/ ctx[8] },
				dirty[0] & /*form*/ 512 && { form: /*form*/ ctx[9] },
				dirty[0] & /*align*/ 4 && { align: /*align*/ ctx[2] },
				dirty[0] & /*readonly*/ 1024 && { readOnly: /*readonly*/ ctx[10] },
				dirty[0] & /*disabled*/ 32 && { disabled: /*disabled*/ ctx[5] },
				dirty[0] & /*required*/ 2048 && { required: /*required*/ ctx[11] },
				dirty[0] & /*maxlength*/ 8 && { maxlength: /*maxlength*/ ctx[3] },
				dirty[0] & /*placeholder*/ 4096 && { placeholder: /*placeholder*/ ctx[12] },
				dirty[0] & /*idProp*/ 32768 && { id: /*idProp*/ ctx[15] },
				dirty[0] & /*classProp*/ 8192 && { class: /*classProp*/ ctx[13] },
				dirty[0] & /*titleProp*/ 131072 && { title: /*titleProp*/ ctx[17] },
				dirty[0] & /*styleProp*/ 1048576 && { style: /*styleProp*/ ctx[20] },
				dirty[0] & /*patternProp*/ 2097152 && { pattern: /*patternProp*/ ctx[21] },
				dirty[0] & /*ariaLabelProp*/ 262144 && { "aria-label": /*ariaLabelProp*/ ctx[18] },
				dirty[0] & /*autocompleteProp*/ 524288 && {
					autocomplete: /*autocompleteProp*/ ctx[19]
				},
				dirty[0] & /*typeProp*/ 65536 && { type: /*typeProp*/ ctx[16] }
			]));

			if (dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
				set_input_value(input, /*value*/ ctx[0]);
			}

			toggle_class(input, "svelte-1vg8tdg", true);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(input);
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block.name,
		type: "else",
		source: "(78:0) {:else}",
		ctx
	});

	return block;
}

// (52:0) {#if rows}
function create_if_block$1(ctx) {
	let textarea;
	let dispose;

	let textarea_levels = [
		{ min: /*min*/ ctx[6] },
		{ max: /*max*/ ctx[7] },
		{ rows: /*rows*/ ctx[4] },
		{ name: /*name*/ ctx[1] },
		{ form: /*form*/ ctx[9] },
		{ align: /*align*/ ctx[2] },
		{ readOnly: /*readonly*/ ctx[10] },
		{ disabled: /*disabled*/ ctx[5] },
		{ required: /*required*/ ctx[11] },
		{ maxlength: /*maxlength*/ ctx[3] },
		{ placeholder: /*placeholder*/ ctx[12] },
		{ id: /*idProp*/ ctx[15] },
		{ class: /*classProp*/ ctx[13] },
		{ title: /*titleProp*/ ctx[17] },
		{ style: /*styleProp*/ ctx[20] },
		{ pattern: /*patternProp*/ ctx[21] },
		{ "aria-label": /*ariaLabelProp*/ ctx[18] },
		{
			autocomplete: /*autocompleteProp*/ ctx[19]
		},
		{ type: /*typeProp*/ ctx[16] }
	];

	let textarea_data = {};

	for (let i = 0; i < textarea_levels.length; i += 1) {
		textarea_data = assign(textarea_data, textarea_levels[i]);
	}

	const block = {
		c: function create() {
			textarea = element("textarea");
			this.h();
		},
		l: function claim(nodes) {
			textarea = claim_element(nodes, "TEXTAREA", {
				min: true,
				max: true,
				rows: true,
				name: true,
				form: true,
				align: true,
				readonly: true,
				disabled: true,
				required: true,
				maxlength: true,
				placeholder: true,
				id: true,
				class: true,
				title: true,
				style: true,
				pattern: true,
				"aria-label": true,
				autocomplete: true
			});

			children(textarea).forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			set_attributes(textarea, textarea_data);
			toggle_class(textarea, "svelte-1vg8tdg", true);
			add_location(textarea, file$3, 52, 4, 2063);
		},
		m: function mount(target, anchor) {
			insert_dev(target, textarea, anchor);
			set_input_value(textarea, /*value*/ ctx[0]);

			dispose = [
				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[33]),
				listen_dev(textarea, "blur", /*blur_handler*/ ctx[34], false, false, false),
				listen_dev(textarea, "focus", /*focus_handler*/ ctx[35], false, false, false),
				listen_dev(textarea, "click", /*onClick*/ ctx[22], false, false, false)
			];
		},
		p: function update(ctx, dirty) {
			set_attributes(textarea, get_spread_update(textarea_levels, [
				dirty[0] & /*min*/ 64 && { min: /*min*/ ctx[6] },
				dirty[0] & /*max*/ 128 && { max: /*max*/ ctx[7] },
				dirty[0] & /*rows*/ 16 && { rows: /*rows*/ ctx[4] },
				dirty[0] & /*name*/ 2 && { name: /*name*/ ctx[1] },
				dirty[0] & /*form*/ 512 && { form: /*form*/ ctx[9] },
				dirty[0] & /*align*/ 4 && { align: /*align*/ ctx[2] },
				dirty[0] & /*readonly*/ 1024 && { readOnly: /*readonly*/ ctx[10] },
				dirty[0] & /*disabled*/ 32 && { disabled: /*disabled*/ ctx[5] },
				dirty[0] & /*required*/ 2048 && { required: /*required*/ ctx[11] },
				dirty[0] & /*maxlength*/ 8 && { maxlength: /*maxlength*/ ctx[3] },
				dirty[0] & /*placeholder*/ 4096 && { placeholder: /*placeholder*/ ctx[12] },
				dirty[0] & /*idProp*/ 32768 && { id: /*idProp*/ ctx[15] },
				dirty[0] & /*classProp*/ 8192 && { class: /*classProp*/ ctx[13] },
				dirty[0] & /*titleProp*/ 131072 && { title: /*titleProp*/ ctx[17] },
				dirty[0] & /*styleProp*/ 1048576 && { style: /*styleProp*/ ctx[20] },
				dirty[0] & /*patternProp*/ 2097152 && { pattern: /*patternProp*/ ctx[21] },
				dirty[0] & /*ariaLabelProp*/ 262144 && { "aria-label": /*ariaLabelProp*/ ctx[18] },
				dirty[0] & /*autocompleteProp*/ 524288 && {
					autocomplete: /*autocompleteProp*/ ctx[19]
				},
				dirty[0] & /*typeProp*/ 65536 && { type: /*typeProp*/ ctx[16] }
			]));

			if (dirty[0] & /*value*/ 1) {
				set_input_value(textarea, /*value*/ ctx[0]);
			}

			toggle_class(textarea, "svelte-1vg8tdg", true);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(textarea);
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$1.name,
		type: "if",
		source: "(52:0) {#if rows}",
		ctx
	});

	return block;
}

function create_fragment$4(ctx) {
	let if_block_anchor;

	function select_block_type(ctx, dirty) {
		if (/*rows*/ ctx[4]) return create_if_block$1;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	const block = {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			if_block.l(nodes);
			if_block_anchor = empty();
		},
		m: function mount(target, anchor) {
			if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
		},
		p: function update(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if_block.d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$4.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$4($$self, $$props, $$invalidate) {
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

	/**
 *
 * @description Emit click and select content when "autoselect" is enabled.
 *
 * @param {MouseEvent} e - Native mouse event.
 */
	function onClick(e) {
		!disabled && dispatch("click", e);
		!disabled && autoselect && e.target.select();
	}

	function textarea_input_handler() {
		value = this.value;
		$$invalidate(0, value);
	}

	const blur_handler = e => !disabled && dispatch("blur", e);
	const focus_handler = e => !disabled && dispatch("focus", e);

	function input_input_handler() {
		value = this.value;
		$$invalidate(0, value);
	}

	const blur_handler_1 = e => !disabled && dispatch("blur", e);
	const focus_handler_1 = e => !disabled && dispatch("focus", e);

	$$self.$set = $$new_props => {
		$$invalidate(32, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("name" in $$new_props) $$invalidate(1, name = $$new_props.name);
		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
		if ("style" in $$new_props) $$invalidate(23, style = $$new_props.style);
		if ("type" in $$new_props) $$invalidate(24, type = $$new_props.type);
		if ("id" in $$new_props) $$invalidate(25, id = $$new_props.id);
		if ("align" in $$new_props) $$invalidate(2, align = $$new_props.align);
		if ("maxlength" in $$new_props) $$invalidate(3, maxlength = $$new_props.maxlength);
		if ("rows" in $$new_props) $$invalidate(4, rows = $$new_props.rows);
		if ("disabled" in $$new_props) $$invalidate(5, disabled = $$new_props.disabled);
		if ("title" in $$new_props) $$invalidate(26, title = $$new_props.title);
		if ("invalid" in $$new_props) $$invalidate(27, invalid = $$new_props.invalid);
		if ("min" in $$new_props) $$invalidate(6, min = $$new_props.min);
		if ("max" in $$new_props) $$invalidate(7, max = $$new_props.max);
		if ("list" in $$new_props) $$invalidate(8, list = $$new_props.list);
		if ("form" in $$new_props) $$invalidate(9, form = $$new_props.form);
		if ("readonly" in $$new_props) $$invalidate(10, readonly = $$new_props.readonly);
		if ("required" in $$new_props) $$invalidate(11, required = $$new_props.required);
		if ("pattern" in $$new_props) $$invalidate(28, pattern = $$new_props.pattern);
		if ("autocomplete" in $$new_props) $$invalidate(29, autocomplete = $$new_props.autocomplete);
		if ("autoselect" in $$new_props) $$invalidate(30, autoselect = $$new_props.autoselect);
		if ("ariaLabel" in $$new_props) $$invalidate(31, ariaLabel = $$new_props.ariaLabel);
		if ("placeholder" in $$new_props) $$invalidate(12, placeholder = $$new_props.placeholder);
	};

	$$self.$capture_state = () => {
		return {
			name,
			value,
			style,
			type,
			id,
			align,
			maxlength,
			rows,
			disabled,
			title,
			invalid,
			min,
			max,
			list,
			form,
			readonly,
			required,
			pattern,
			autocomplete,
			autoselect,
			ariaLabel,
			placeholder,
			idProp,
			typeProp,
			titleProp,
			ariaLabelProp,
			autocompleteProp,
			styleProp,
			patternProp,
			classProp
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(32, $$props = assign(assign({}, $$props), $$new_props));
		if ("name" in $$props) $$invalidate(1, name = $$new_props.name);
		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
		if ("style" in $$props) $$invalidate(23, style = $$new_props.style);
		if ("type" in $$props) $$invalidate(24, type = $$new_props.type);
		if ("id" in $$props) $$invalidate(25, id = $$new_props.id);
		if ("align" in $$props) $$invalidate(2, align = $$new_props.align);
		if ("maxlength" in $$props) $$invalidate(3, maxlength = $$new_props.maxlength);
		if ("rows" in $$props) $$invalidate(4, rows = $$new_props.rows);
		if ("disabled" in $$props) $$invalidate(5, disabled = $$new_props.disabled);
		if ("title" in $$props) $$invalidate(26, title = $$new_props.title);
		if ("invalid" in $$props) $$invalidate(27, invalid = $$new_props.invalid);
		if ("min" in $$props) $$invalidate(6, min = $$new_props.min);
		if ("max" in $$props) $$invalidate(7, max = $$new_props.max);
		if ("list" in $$props) $$invalidate(8, list = $$new_props.list);
		if ("form" in $$props) $$invalidate(9, form = $$new_props.form);
		if ("readonly" in $$props) $$invalidate(10, readonly = $$new_props.readonly);
		if ("required" in $$props) $$invalidate(11, required = $$new_props.required);
		if ("pattern" in $$props) $$invalidate(28, pattern = $$new_props.pattern);
		if ("autocomplete" in $$props) $$invalidate(29, autocomplete = $$new_props.autocomplete);
		if ("autoselect" in $$props) $$invalidate(30, autoselect = $$new_props.autoselect);
		if ("ariaLabel" in $$props) $$invalidate(31, ariaLabel = $$new_props.ariaLabel);
		if ("placeholder" in $$props) $$invalidate(12, placeholder = $$new_props.placeholder);
		if ("idProp" in $$props) $$invalidate(15, idProp = $$new_props.idProp);
		if ("typeProp" in $$props) $$invalidate(16, typeProp = $$new_props.typeProp);
		if ("titleProp" in $$props) $$invalidate(17, titleProp = $$new_props.titleProp);
		if ("ariaLabelProp" in $$props) $$invalidate(18, ariaLabelProp = $$new_props.ariaLabelProp);
		if ("autocompleteProp" in $$props) $$invalidate(19, autocompleteProp = $$new_props.autocompleteProp);
		if ("styleProp" in $$props) $$invalidate(20, styleProp = $$new_props.styleProp);
		if ("patternProp" in $$props) $$invalidate(21, patternProp = $$new_props.patternProp);
		if ("classProp" in $$props) $$invalidate(13, classProp = $$new_props.classProp);
	};

	let classProp;

	$$self.$$.update = () => {
		 $$invalidate(13, classProp = classnames("inp", $$props.class, { disabled, readonly, required, invalid }));
	};

	$$props = exclude_internal_props($$props);

	return [
		value,
		name,
		align,
		maxlength,
		rows,
		disabled,
		min,
		max,
		list,
		form,
		readonly,
		required,
		placeholder,
		classProp,
		dispatch,
		idProp,
		typeProp,
		titleProp,
		ariaLabelProp,
		autocompleteProp,
		styleProp,
		patternProp,
		onClick,
		style,
		type,
		id,
		title,
		invalid,
		pattern,
		autocomplete,
		autoselect,
		ariaLabel,
		$$props,
		textarea_input_handler,
		blur_handler,
		focus_handler,
		input_input_handler,
		blur_handler_1,
		focus_handler_1
	];
}

class Input extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(
			this,
			options,
			instance$4,
			create_fragment$4,
			safe_not_equal,
			{
				name: 1,
				value: 0,
				style: 23,
				type: 24,
				id: 25,
				align: 2,
				maxlength: 3,
				rows: 4,
				disabled: 5,
				title: 26,
				invalid: 27,
				min: 6,
				max: 7,
				list: 8,
				form: 9,
				readonly: 10,
				required: 11,
				pattern: 28,
				autocomplete: 29,
				autoselect: 30,
				ariaLabel: 31,
				placeholder: 12
			},
			[-1, -1]
		);

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Input",
			options,
			id: create_fragment$4.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
			console.warn("<Input> was created without expected prop 'name'");
		}
	}

	get name() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set name(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get type() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set type(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get align() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set align(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get maxlength() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set maxlength(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rows() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rows(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get title() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get invalid() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set invalid(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get min() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set min(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get max() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set max(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get list() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set list(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get form() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set form(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get readonly() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set readonly(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get required() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set required(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get pattern() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set pattern(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get autocomplete() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set autocomplete(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get autoselect() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set autoselect(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ariaLabel() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ariaLabel(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get placeholder() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set placeholder(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/Picture.svelte generated by Svelte v3.18.1 */
const file$4 = "src/components/Picture.svelte";

// (54:4) {#if srcBig && !loadingSrc}
function create_if_block$2(ctx) {
	let img;
	let img_src_value;
	let dispose;

	const block = {
		c: function create() {
			img = element("img");
			this.h();
		},
		l: function claim(nodes) {
			img = claim_element(nodes, "IMG", {
				alt: true,
				width: true,
				height: true,
				src: true,
				class: true
			});

			this.h();
		},
		h: function hydrate() {
			attr_dev(img, "alt", /*alt*/ ctx[1]);
			attr_dev(img, "width", /*width*/ ctx[4]);
			attr_dev(img, "height", /*height*/ ctx[5]);
			if (img.src !== (img_src_value = /*srcBig*/ ctx[2])) attr_dev(img, "src", img_src_value);
			attr_dev(img, "class", "pic pic-2x svelte-1h9qfqe");
			add_location(img, file$4, 54, 8, 1216);
		},
		m: function mount(target, anchor) {
			insert_dev(target, img, anchor);

			dispose = [
				listen_dev(img, "load", /*onLoadSrcBig*/ ctx[10], false, false, false),
				listen_dev(img, "error", /*onErrorSrcBig*/ ctx[11], false, false, false)
			];
		},
		p: function update(ctx, dirty) {
			if (dirty & /*alt*/ 2) {
				attr_dev(img, "alt", /*alt*/ ctx[1]);
			}

			if (dirty & /*width*/ 16) {
				attr_dev(img, "width", /*width*/ ctx[4]);
			}

			if (dirty & /*height*/ 32) {
				attr_dev(img, "height", /*height*/ ctx[5]);
			}

			if (dirty & /*srcBig*/ 4 && img.src !== (img_src_value = /*srcBig*/ ctx[2])) {
				attr_dev(img, "src", img_src_value);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(img);
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$2.name,
		type: "if",
		source: "(54:4) {#if srcBig && !loadingSrc}",
		ctx
	});

	return block;
}

function create_fragment$5(ctx) {
	let figure;
	let img;
	let img_src_value;
	let t0;
	let t1;
	let figcaption;
	let figure_class_value;
	let current;
	let dispose;
	let if_block = /*srcBig*/ ctx[2] && !/*loadingSrc*/ ctx[6] && create_if_block$2(ctx);
	const default_slot_template = /*$$slots*/ ctx[17].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

	const block = {
		c: function create() {
			figure = element("figure");
			img = element("img");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			figcaption = element("figcaption");
			if (default_slot) default_slot.c();
			this.h();
		},
		l: function claim(nodes) {
			figure = claim_element(nodes, "FIGURE", { class: true });
			var figure_nodes = children(figure);

			img = claim_element(figure_nodes, "IMG", {
				id: true,
				alt: true,
				src: true,
				width: true,
				height: true,
				class: true
			});

			t0 = claim_space(figure_nodes);
			if (if_block) if_block.l(figure_nodes);
			t1 = claim_space(figure_nodes);
			figcaption = claim_element(figure_nodes, "FIGCAPTION", {});
			var figcaption_nodes = children(figcaption);
			if (default_slot) default_slot.l(figcaption_nodes);
			figcaption_nodes.forEach(detach_dev);
			figure_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(img, "id", /*id*/ ctx[3]);
			attr_dev(img, "alt", /*alt*/ ctx[1]);
			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
			attr_dev(img, "width", /*width*/ ctx[4]);
			attr_dev(img, "height", /*height*/ ctx[5]);
			attr_dev(img, "class", "pic pic-1x svelte-1h9qfqe");
			add_location(img, file$4, 43, 4, 973);
			add_location(figcaption, file$4, 64, 4, 1461);
			attr_dev(figure, "class", figure_class_value = "" + (null_to_empty(/*wrapClassProp*/ ctx[7]) + " svelte-1h9qfqe"));
			add_location(figure, file$4, 42, 0, 938);
		},
		m: function mount(target, anchor) {
			insert_dev(target, figure, anchor);
			append_dev(figure, img);
			append_dev(figure, t0);
			if (if_block) if_block.m(figure, null);
			append_dev(figure, t1);
			append_dev(figure, figcaption);

			if (default_slot) {
				default_slot.m(figcaption, null);
			}

			current = true;

			dispose = [
				listen_dev(img, "load", /*onLoadSrc*/ ctx[8], false, false, false),
				listen_dev(img, "error", /*onErrorSrc*/ ctx[9], false, false, false)
			];
		},
		p: function update(ctx, [dirty]) {
			if (!current || dirty & /*id*/ 8) {
				attr_dev(img, "id", /*id*/ ctx[3]);
			}

			if (!current || dirty & /*alt*/ 2) {
				attr_dev(img, "alt", /*alt*/ ctx[1]);
			}

			if (!current || dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0])) {
				attr_dev(img, "src", img_src_value);
			}

			if (!current || dirty & /*width*/ 16) {
				attr_dev(img, "width", /*width*/ ctx[4]);
			}

			if (!current || dirty & /*height*/ 32) {
				attr_dev(img, "height", /*height*/ ctx[5]);
			}

			if (/*srcBig*/ ctx[2] && !/*loadingSrc*/ ctx[6]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					if_block.m(figure, t1);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (default_slot && default_slot.p && dirty & /*$$scope*/ 65536) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[16], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[16], dirty, null));
			}

			if (!current || dirty & /*wrapClassProp*/ 128 && figure_class_value !== (figure_class_value = "" + (null_to_empty(/*wrapClassProp*/ ctx[7]) + " svelte-1h9qfqe"))) {
				attr_dev(figure, "class", figure_class_value);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(figure);
			if (if_block) if_block.d();
			if (default_slot) default_slot.d(detaching);
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$5.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$5($$self, $$props, $$invalidate) {
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

	function onLoadSrc(e) {
		$$invalidate(6, loadingSrc = false);
		dispatch("load", e);
	}

	function onErrorSrc(e) {
		$$invalidate(6, loadingSrc = false);
		$$invalidate(13, isError = true);
		dispatch("error", e);
	}

	function onLoadSrcBig(e) {
		$$invalidate(12, loadingSrcBig = false);
		dispatch("loadBig", e);
	}

	function onErrorSrcBig(e) {
		$$invalidate(12, loadingSrcBig = false);
		$$invalidate(13, isError = true);
		dispatch("errorBig", e);
	}

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$new_props => {
		$$invalidate(15, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("src" in $$new_props) $$invalidate(0, src = $$new_props.src);
		if ("alt" in $$new_props) $$invalidate(1, alt = $$new_props.alt);
		if ("srcBig" in $$new_props) $$invalidate(2, srcBig = $$new_props.srcBig);
		if ("id" in $$new_props) $$invalidate(3, id = $$new_props.id);
		if ("width" in $$new_props) $$invalidate(4, width = $$new_props.width);
		if ("height" in $$new_props) $$invalidate(5, height = $$new_props.height);
		if ("$$scope" in $$new_props) $$invalidate(16, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			src,
			alt,
			srcBig,
			id,
			width,
			height,
			loadingSrc,
			loadingSrcBig,
			isError,
			wrapClassProp
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(15, $$props = assign(assign({}, $$props), $$new_props));
		if ("src" in $$props) $$invalidate(0, src = $$new_props.src);
		if ("alt" in $$props) $$invalidate(1, alt = $$new_props.alt);
		if ("srcBig" in $$props) $$invalidate(2, srcBig = $$new_props.srcBig);
		if ("id" in $$props) $$invalidate(3, id = $$new_props.id);
		if ("width" in $$props) $$invalidate(4, width = $$new_props.width);
		if ("height" in $$props) $$invalidate(5, height = $$new_props.height);
		if ("loadingSrc" in $$props) $$invalidate(6, loadingSrc = $$new_props.loadingSrc);
		if ("loadingSrcBig" in $$props) $$invalidate(12, loadingSrcBig = $$new_props.loadingSrcBig);
		if ("isError" in $$props) $$invalidate(13, isError = $$new_props.isError);
		if ("wrapClassProp" in $$props) $$invalidate(7, wrapClassProp = $$new_props.wrapClassProp);
	};

	let wrapClassProp;

	$$self.$$.update = () => {
		 $$invalidate(7, wrapClassProp = classnames("picture", $$props.class, { loadingSrc, loadingSrcBig, isError }));
	};

	$$props = exclude_internal_props($$props);

	return [
		src,
		alt,
		srcBig,
		id,
		width,
		height,
		loadingSrc,
		wrapClassProp,
		onLoadSrc,
		onErrorSrc,
		onLoadSrcBig,
		onErrorSrcBig,
		loadingSrcBig,
		isError,
		dispatch,
		$$props,
		$$scope,
		$$slots
	];
}

class Picture extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
			src: 0,
			alt: 1,
			srcBig: 2,
			id: 3,
			width: 4,
			height: 5
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Picture",
			options,
			id: create_fragment$5.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
			console.warn("<Picture> was created without expected prop 'src'");
		}

		if (/*alt*/ ctx[1] === undefined && !("alt" in props)) {
			console.warn("<Picture> was created without expected prop 'alt'");
		}
	}

	get src() {
		throw new Error("<Picture>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set src(value) {
		throw new Error("<Picture>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get alt() {
		throw new Error("<Picture>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set alt(value) {
		throw new Error("<Picture>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get srcBig() {
		throw new Error("<Picture>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set srcBig(value) {
		throw new Error("<Picture>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<Picture>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Picture>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get width() {
		throw new Error("<Picture>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set width(value) {
		throw new Error("<Picture>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get height() {
		throw new Error("<Picture>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set height(value) {
		throw new Error("<Picture>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/Avatar.svelte generated by Svelte v3.18.1 */
const file$5 = "src/components/Avatar.svelte";

function create_fragment$6(ctx) {
	let div;
	let div_class_value;
	let current;

	const picture = new Picture({
			props: {
				src: /*src*/ ctx[0],
				alt: `Picture: ${/*alt*/ ctx[1]}`
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div = element("div");
			create_component(picture.$$.fragment);
			this.h();
		},
		l: function claim(nodes) {
			div = claim_element(nodes, "DIV", { class: true });
			var div_nodes = children(div);
			claim_component(picture.$$.fragment, div_nodes);
			div_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*classProp*/ ctx[2]) + " svelte-ow3g6r"));
			add_location(div, file$5, 11, 0, 254);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(picture, div, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const picture_changes = {};
			if (dirty & /*src*/ 1) picture_changes.src = /*src*/ ctx[0];
			if (dirty & /*alt*/ 2) picture_changes.alt = `Picture: ${/*alt*/ ctx[1]}`;
			picture.$set(picture_changes);

			if (!current || dirty & /*classProp*/ 4 && div_class_value !== (div_class_value = "" + (null_to_empty(/*classProp*/ ctx[2]) + " svelte-ow3g6r"))) {
				attr_dev(div, "class", div_class_value);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(picture.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(picture.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(picture);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$6.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$6($$self, $$props, $$invalidate) {
	let { src } = $$props;
	let { alt } = $$props;
	let { size = "medium" } = $$props; // small|medium|big

	$$self.$set = $$new_props => {
		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("src" in $$new_props) $$invalidate(0, src = $$new_props.src);
		if ("alt" in $$new_props) $$invalidate(1, alt = $$new_props.alt);
		if ("size" in $$new_props) $$invalidate(3, size = $$new_props.size);
	};

	$$self.$capture_state = () => {
		return { src, alt, size, classProp };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(4, $$props = assign(assign({}, $$props), $$new_props));
		if ("src" in $$props) $$invalidate(0, src = $$new_props.src);
		if ("alt" in $$props) $$invalidate(1, alt = $$new_props.alt);
		if ("size" in $$props) $$invalidate(3, size = $$new_props.size);
		if ("classProp" in $$props) $$invalidate(2, classProp = $$new_props.classProp);
	};

	let classProp;

	$$self.$$.update = () => {
		 $$invalidate(2, classProp = classnames("ava", size, $$props.class));
	};

	$$props = exclude_internal_props($$props);
	return [src, alt, classProp, size];
}

class Avatar extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { src: 0, alt: 1, size: 3 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Avatar",
			options,
			id: create_fragment$6.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
			console.warn("<Avatar> was created without expected prop 'src'");
		}

		if (/*alt*/ ctx[1] === undefined && !("alt" in props)) {
			console.warn("<Avatar> was created without expected prop 'alt'");
		}
	}

	get src() {
		throw new Error("<Avatar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set src(value) {
		throw new Error("<Avatar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get alt() {
		throw new Error("<Avatar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set alt(value) {
		throw new Error("<Avatar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get size() {
		throw new Error("<Avatar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set size(value) {
		throw new Error("<Avatar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/Button.svelte generated by Svelte v3.18.1 */
const file$6 = "src/components/Button.svelte";

// (56:0) {:else}
function create_else_block$1(ctx) {
	let button;
	let button_class_value;
	let current;
	let dispose;
	const default_slot_template = /*$$slots*/ ctx[18].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[17], null);

	const block = {
		c: function create() {
			button = element("button");
			if (default_slot) default_slot.c();
			this.h();
		},
		l: function claim(nodes) {
			button = claim_element(nodes, "BUTTON", {
				id: true,
				type: true,
				disabled: true,
				title: true,
				class: true,
				"aria-label": true
			});

			var button_nodes = children(button);
			if (default_slot) default_slot.l(button_nodes);
			button_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(button, "id", /*id*/ ctx[0]);
			attr_dev(button, "type", /*type*/ ctx[2]);
			button.disabled = /*disabled*/ ctx[4];
			attr_dev(button, "title", /*titleProp*/ ctx[6]);
			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*classProp*/ ctx[5]) + " svelte-jhaexl"));
			attr_dev(button, "aria-label", /*ariaLabelProp*/ ctx[7]);
			add_location(button, file$6, 56, 4, 1363);
		},
		m: function mount(target, anchor) {
			insert_dev(target, button, anchor);

			if (default_slot) {
				default_slot.m(button, null);
			}

			current = true;
			dispose = listen_dev(button, "click", /*onClick*/ ctx[9], false, false, false);
		},
		p: function update(ctx, dirty) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 131072) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[17], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[17], dirty, null));
			}

			if (!current || dirty & /*id*/ 1) {
				attr_dev(button, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*type*/ 4) {
				attr_dev(button, "type", /*type*/ ctx[2]);
			}

			if (!current || dirty & /*disabled*/ 16) {
				prop_dev(button, "disabled", /*disabled*/ ctx[4]);
			}

			if (!current || dirty & /*classProp*/ 32 && button_class_value !== (button_class_value = "" + (null_to_empty(/*classProp*/ ctx[5]) + " svelte-jhaexl"))) {
				attr_dev(button, "class", button_class_value);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(button);
			if (default_slot) default_slot.d(detaching);
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$1.name,
		type: "else",
		source: "(56:0) {:else}",
		ctx
	});

	return block;
}

// (44:18) 
function create_if_block_1(ctx) {
	let label;
	let label_class_value;
	let current;
	let dispose;
	const default_slot_template = /*$$slots*/ ctx[18].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[17], null);

	const block = {
		c: function create() {
			label = element("label");
			if (default_slot) default_slot.c();
			this.h();
		},
		l: function claim(nodes) {
			label = claim_element(nodes, "LABEL", {
				id: true,
				disabled: true,
				for: true,
				title: true,
				class: true,
				"aria-label": true
			});

			var label_nodes = children(label);
			if (default_slot) default_slot.l(label_nodes);
			label_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(label, "id", /*id*/ ctx[0]);
			attr_dev(label, "disabled", /*disabled*/ ctx[4]);
			attr_dev(label, "for", /*htmlFor*/ ctx[3]);
			attr_dev(label, "title", /*titleProp*/ ctx[6]);
			attr_dev(label, "class", label_class_value = "" + (null_to_empty(/*classProp*/ ctx[5]) + " svelte-jhaexl"));
			attr_dev(label, "aria-label", /*ariaLabelProp*/ ctx[7]);
			add_location(label, file$6, 44, 4, 1102);
		},
		m: function mount(target, anchor) {
			insert_dev(target, label, anchor);

			if (default_slot) {
				default_slot.m(label, null);
			}

			current = true;
			dispose = listen_dev(label, "click", /*onLabelClick*/ ctx[8], false, false, false);
		},
		p: function update(ctx, dirty) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 131072) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[17], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[17], dirty, null));
			}

			if (!current || dirty & /*id*/ 1) {
				attr_dev(label, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*disabled*/ 16) {
				attr_dev(label, "disabled", /*disabled*/ ctx[4]);
			}

			if (!current || dirty & /*htmlFor*/ 8) {
				attr_dev(label, "for", /*htmlFor*/ ctx[3]);
			}

			if (!current || dirty & /*classProp*/ 32 && label_class_value !== (label_class_value = "" + (null_to_empty(/*classProp*/ ctx[5]) + " svelte-jhaexl"))) {
				attr_dev(label, "class", label_class_value);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(label);
			if (default_slot) default_slot.d(detaching);
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(44:18) ",
		ctx
	});

	return block;
}

// (33:0) {#if href}
function create_if_block$3(ctx) {
	let a;
	let a_class_value;
	let current;
	let dispose;
	const default_slot_template = /*$$slots*/ ctx[18].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[17], null);

	const block = {
		c: function create() {
			a = element("a");
			if (default_slot) default_slot.c();
			this.h();
		},
		l: function claim(nodes) {
			a = claim_element(nodes, "A", {
				id: true,
				href: true,
				title: true,
				class: true,
				"aria-label": true
			});

			var a_nodes = children(a);
			if (default_slot) default_slot.l(a_nodes);
			a_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(a, "id", /*id*/ ctx[0]);
			attr_dev(a, "href", /*href*/ ctx[1]);
			attr_dev(a, "title", /*titleProp*/ ctx[6]);
			attr_dev(a, "class", a_class_value = "" + (null_to_empty(/*classProp*/ ctx[5]) + " svelte-jhaexl"));
			attr_dev(a, "aria-label", /*ariaLabelProp*/ ctx[7]);
			add_location(a, file$6, 33, 4, 873);
		},
		m: function mount(target, anchor) {
			insert_dev(target, a, anchor);

			if (default_slot) {
				default_slot.m(a, null);
			}

			current = true;
			dispose = listen_dev(a, "click", /*onClick*/ ctx[9], false, false, false);
		},
		p: function update(ctx, dirty) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 131072) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[17], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[17], dirty, null));
			}

			if (!current || dirty & /*id*/ 1) {
				attr_dev(a, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*href*/ 2) {
				attr_dev(a, "href", /*href*/ ctx[1]);
			}

			if (!current || dirty & /*classProp*/ 32 && a_class_value !== (a_class_value = "" + (null_to_empty(/*classProp*/ ctx[5]) + " svelte-jhaexl"))) {
				attr_dev(a, "class", a_class_value);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(a);
			if (default_slot) default_slot.d(detaching);
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$3.name,
		type: "if",
		source: "(33:0) {#if href}",
		ctx
	});

	return block;
}

function create_fragment$7(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$3, create_if_block_1, create_else_block$1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*href*/ ctx[1]) return 0;
		if (/*htmlFor*/ ctx[3]) return 1;
		return 2;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			if_block.l(nodes);
			if_block_anchor = empty();
		},
		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$7.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$7($$self, $$props, $$invalidate) {
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

	function onLabelClick(e) {
		document.getElementById(htmlFor).click();
		!disabled && dispatch("click", e);
	}

	function onClick(e) {
		!disabled && dispatch("click", e);
	}

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$new_props => {
		$$invalidate(16, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("is" in $$new_props) $$invalidate(10, is = $$new_props.is);
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("href" in $$new_props) $$invalidate(1, href = $$new_props.href);
		if ("auto" in $$new_props) $$invalidate(11, auto = $$new_props.auto);
		if ("type" in $$new_props) $$invalidate(2, type = $$new_props.type);
		if ("size" in $$new_props) $$invalidate(12, size = $$new_props.size);
		if ("title" in $$new_props) $$invalidate(13, title = $$new_props.title);
		if ("htmlFor" in $$new_props) $$invalidate(3, htmlFor = $$new_props.htmlFor);
		if ("disabled" in $$new_props) $$invalidate(4, disabled = $$new_props.disabled);
		if ("ariaLabel" in $$new_props) $$invalidate(14, ariaLabel = $$new_props.ariaLabel);
		if ("$$scope" in $$new_props) $$invalidate(17, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			is,
			id,
			href,
			auto,
			type,
			size,
			title,
			htmlFor,
			disabled,
			ariaLabel,
			titleProp,
			ariaLabelProp,
			classProp
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(16, $$props = assign(assign({}, $$props), $$new_props));
		if ("is" in $$props) $$invalidate(10, is = $$new_props.is);
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("href" in $$props) $$invalidate(1, href = $$new_props.href);
		if ("auto" in $$props) $$invalidate(11, auto = $$new_props.auto);
		if ("type" in $$props) $$invalidate(2, type = $$new_props.type);
		if ("size" in $$props) $$invalidate(12, size = $$new_props.size);
		if ("title" in $$props) $$invalidate(13, title = $$new_props.title);
		if ("htmlFor" in $$props) $$invalidate(3, htmlFor = $$new_props.htmlFor);
		if ("disabled" in $$props) $$invalidate(4, disabled = $$new_props.disabled);
		if ("ariaLabel" in $$props) $$invalidate(14, ariaLabel = $$new_props.ariaLabel);
		if ("titleProp" in $$props) $$invalidate(6, titleProp = $$new_props.titleProp);
		if ("ariaLabelProp" in $$props) $$invalidate(7, ariaLabelProp = $$new_props.ariaLabelProp);
		if ("classProp" in $$props) $$invalidate(5, classProp = $$new_props.classProp);
	};

	let classProp;

	$$self.$$.update = () => {
		 $$invalidate(5, classProp = classnames("btn", is, size, $$props.class, { auto, disabled }));
	};

	$$props = exclude_internal_props($$props);

	return [
		id,
		href,
		type,
		htmlFor,
		disabled,
		classProp,
		titleProp,
		ariaLabelProp,
		onLabelClick,
		onClick,
		is,
		auto,
		size,
		title,
		ariaLabel,
		dispatch,
		$$props,
		$$scope,
		$$slots
	];
}

class Button extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
			is: 10,
			id: 0,
			href: 1,
			auto: 11,
			type: 2,
			size: 12,
			title: 13,
			htmlFor: 3,
			disabled: 4,
			ariaLabel: 14
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Button",
			options,
			id: create_fragment$7.name
		});
	}

	get is() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set is(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get href() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set href(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get auto() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set auto(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get type() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set type(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get size() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set size(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get title() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get htmlFor() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set htmlFor(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ariaLabel() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ariaLabel(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/Divider.svelte generated by Svelte v3.18.1 */
const file$7 = "src/components/Divider.svelte";

function create_fragment$8(ctx) {
	let hr;
	let hr_class_value;

	const block = {
		c: function create() {
			hr = element("hr");
			this.h();
		},
		l: function claim(nodes) {
			hr = claim_element(nodes, "HR", { class: true, style: true });
			this.h();
		},
		h: function hydrate() {
			attr_dev(hr, "class", hr_class_value = "" + (null_to_empty(/*classProp*/ ctx[0]) + " svelte-10708ut"));
			attr_dev(hr, "style", /*styleProp*/ ctx[1]);
			add_location(hr, file$7, 11, 0, 298);
		},
		m: function mount(target, anchor) {
			insert_dev(target, hr, anchor);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*classProp*/ 1 && hr_class_value !== (hr_class_value = "" + (null_to_empty(/*classProp*/ ctx[0]) + " svelte-10708ut"))) {
				attr_dev(hr, "class", hr_class_value);
			}

			if (dirty & /*styleProp*/ 2) {
				attr_dev(hr, "style", /*styleProp*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(hr);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$8.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$8($$self, $$props, $$invalidate) {
	let { is = "info" } = $$props;
	let { size = 0 } = $$props;
	let { width = 2 } = $$props;

	$$self.$set = $$new_props => {
		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("is" in $$new_props) $$invalidate(2, is = $$new_props.is);
		if ("size" in $$new_props) $$invalidate(3, size = $$new_props.size);
		if ("width" in $$new_props) $$invalidate(4, width = $$new_props.width);
	};

	$$self.$capture_state = () => {
		return { is, size, width, classProp, styleProp };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
		if ("is" in $$props) $$invalidate(2, is = $$new_props.is);
		if ("size" in $$props) $$invalidate(3, size = $$new_props.size);
		if ("width" in $$props) $$invalidate(4, width = $$new_props.width);
		if ("classProp" in $$props) $$invalidate(0, classProp = $$new_props.classProp);
		if ("styleProp" in $$props) $$invalidate(1, styleProp = $$new_props.styleProp);
	};

	let classProp;
	let styleProp;

	$$self.$$.update = () => {
		 $$invalidate(0, classProp = classnames("divider", is, $$props.class));

		if ($$self.$$.dirty & /*size, width*/ 24) {
			 $$invalidate(1, styleProp = toCSSString({
				padding: `${size / 2}px 0`,
				height: `${width}px`
			}));
		}
	};

	$$props = exclude_internal_props($$props);
	return [classProp, styleProp, is, size, width];
}

class Divider extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$8, create_fragment$8, safe_not_equal, { is: 2, size: 3, width: 4 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Divider",
			options,
			id: create_fragment$8.name
		});
	}

	get is() {
		throw new Error("<Divider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set is(value) {
		throw new Error("<Divider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get size() {
		throw new Error("<Divider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set size(value) {
		throw new Error("<Divider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get width() {
		throw new Error("<Divider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set width(value) {
		throw new Error("<Divider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/Progress.svelte generated by Svelte v3.18.1 */
const file$8 = "src/components/Progress.svelte";

function create_fragment$9(ctx) {
	let div2;
	let div1;
	let div0;
	let div0_style_value;
	let div2_class_value;
	let div2_style_value;

	const block = {
		c: function create() {
			div2 = element("div");
			div1 = element("div");
			div0 = element("div");
			this.h();
		},
		l: function claim(nodes) {
			div2 = claim_element(nodes, "DIV", {
				id: true,
				class: true,
				title: true,
				"aria-label": true,
				role: true,
				"aria-valuemin": true,
				"aria-valuemax": true,
				"aria-valuenow": true,
				style: true
			});

			var div2_nodes = children(div2);
			div1 = claim_element(div2_nodes, "DIV", { class: true });
			var div1_nodes = children(div1);
			div0 = claim_element(div1_nodes, "DIV", { class: true, style: true });
			children(div0).forEach(detach_dev);
			div1_nodes.forEach(detach_dev);
			div2_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(div0, "class", "progress-core svelte-we6n45");
			attr_dev(div0, "style", div0_style_value = `width:${/*val*/ ctx[2]}%`);
			add_location(div0, file$8, 44, 8, 1381);
			attr_dev(div1, "class", "progress-inner-frame svelte-we6n45");
			add_location(div1, file$8, 43, 4, 1338);
			attr_dev(div2, "id", /*id*/ ctx[0]);
			attr_dev(div2, "class", div2_class_value = "" + (null_to_empty(/*classProp*/ ctx[5]) + " svelte-we6n45"));
			attr_dev(div2, "title", /*titleProp*/ ctx[3]);
			attr_dev(div2, "aria-label", /*ariaLabelProp*/ ctx[4]);
			attr_dev(div2, "role", "progressbar");
			attr_dev(div2, "aria-valuemin", "0");
			attr_dev(div2, "aria-valuemax", "100");
			attr_dev(div2, "aria-valuenow", /*val*/ ctx[2]);
			attr_dev(div2, "style", div2_style_value = `${getBorderRadius(/*borderRadius*/ ctx[1])}`);
			add_location(div2, file$8, 32, 0, 1067);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div2, anchor);
			append_dev(div2, div1);
			append_dev(div1, div0);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*val*/ 4 && div0_style_value !== (div0_style_value = `width:${/*val*/ ctx[2]}%`)) {
				attr_dev(div0, "style", div0_style_value);
			}

			if (dirty & /*id*/ 1) {
				attr_dev(div2, "id", /*id*/ ctx[0]);
			}

			if (dirty & /*classProp*/ 32 && div2_class_value !== (div2_class_value = "" + (null_to_empty(/*classProp*/ ctx[5]) + " svelte-we6n45"))) {
				attr_dev(div2, "class", div2_class_value);
			}

			if (dirty & /*titleProp*/ 8) {
				attr_dev(div2, "title", /*titleProp*/ ctx[3]);
			}

			if (dirty & /*ariaLabelProp*/ 16) {
				attr_dev(div2, "aria-label", /*ariaLabelProp*/ ctx[4]);
			}

			if (dirty & /*val*/ 4) {
				attr_dev(div2, "aria-valuenow", /*val*/ ctx[2]);
			}

			if (dirty & /*borderRadius*/ 2 && div2_style_value !== (div2_style_value = `${getBorderRadius(/*borderRadius*/ ctx[1])}`)) {
				attr_dev(div2, "style", div2_style_value);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div2);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$9.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function getBorderRadius(borders, defaults = "99999px") {
	const brDefault = new Array(4).fill(defaults);
	const bds = safeGet(() => borders.split(" "), [], true);
	const rule = "border-radius";
	return `${rule}:${brDefault.map((def, i) => `${bds[i] || def}`).join(" ")}`;
}

function instance$9($$self, $$props, $$invalidate) {
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
			() => $$invalidate(2, val = Number.isFinite(+value)
			? Math.max(0, Math.min(+value, 100))
			: 0),
			0
		);
	});

	$$self.$set = $$new_props => {
		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("value" in $$new_props) $$invalidate(6, value = $$new_props.value);
		if ("size" in $$new_props) $$invalidate(7, size = $$new_props.size);
		if ("title" in $$new_props) $$invalidate(8, title = $$new_props.title);
		if ("ariaLabel" in $$new_props) $$invalidate(9, ariaLabel = $$new_props.ariaLabel);
		if ("borderRadius" in $$new_props) $$invalidate(1, borderRadius = $$new_props.borderRadius);
	};

	$$self.$capture_state = () => {
		return {
			id,
			value,
			size,
			title,
			ariaLabel,
			borderRadius,
			val,
			titleProp,
			ariaLabelProp,
			classProp
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("value" in $$props) $$invalidate(6, value = $$new_props.value);
		if ("size" in $$props) $$invalidate(7, size = $$new_props.size);
		if ("title" in $$props) $$invalidate(8, title = $$new_props.title);
		if ("ariaLabel" in $$props) $$invalidate(9, ariaLabel = $$new_props.ariaLabel);
		if ("borderRadius" in $$props) $$invalidate(1, borderRadius = $$new_props.borderRadius);
		if ("val" in $$props) $$invalidate(2, val = $$new_props.val);
		if ("titleProp" in $$props) $$invalidate(3, titleProp = $$new_props.titleProp);
		if ("ariaLabelProp" in $$props) $$invalidate(4, ariaLabelProp = $$new_props.ariaLabelProp);
		if ("classProp" in $$props) $$invalidate(5, classProp = $$new_props.classProp);
	};

	let val;
	let titleProp;
	let ariaLabelProp;
	let classProp;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*title, val*/ 260) {
			 $$invalidate(3, titleProp = title || `Progress - ${val}%`);
		}

		if ($$self.$$.dirty & /*ariaLabel, val*/ 516) {
			 $$invalidate(4, ariaLabelProp = ariaLabel || `Progress - ${val}%`);
		}

		 $$invalidate(5, classProp = classnames("progress", size, $$props.class));
	};

	 $$invalidate(2, val = 0);
	$$props = exclude_internal_props($$props);

	return [
		id,
		borderRadius,
		val,
		titleProp,
		ariaLabelProp,
		classProp,
		value,
		size,
		title,
		ariaLabel
	];
}

class Progress extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
			id: 0,
			value: 6,
			size: 7,
			title: 8,
			ariaLabel: 9,
			borderRadius: 1
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Progress",
			options,
			id: create_fragment$9.name
		});
	}

	get id() {
		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get size() {
		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set size(value) {
		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get title() {
		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ariaLabel() {
		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ariaLabel(value) {
		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get borderRadius() {
		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set borderRadius(value) {
		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/Carousel.svelte generated by Svelte v3.18.1 */
const file$9 = "src/components/Carousel.svelte";
const get_default_slot_changes = dirty => ({ item: dirty & /*items*/ 1 });
const get_default_slot_context = ctx => ({ item: /*item*/ ctx[5] });

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i];
	return child_ctx;
}

// (57:4) {#each items as item}
function create_each_block(ctx) {
	let li;
	let t;
	let current;
	const default_slot_template = /*$$slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], get_default_slot_context);
	const picture_spread_levels = [/*item*/ ctx[5]];
	let picture_props = {};

	for (let i = 0; i < picture_spread_levels.length; i += 1) {
		picture_props = assign(picture_props, picture_spread_levels[i]);
	}

	const picture = new Picture({ props: picture_props, $$inline: true });

	const block = {
		c: function create() {
			li = element("li");

			if (!default_slot) {
				create_component(picture.$$.fragment);
			}

			if (default_slot) default_slot.c();
			t = space();
			this.h();
		},
		l: function claim(nodes) {
			li = claim_element(nodes, "LI", { class: true });
			var li_nodes = children(li);

			if (!default_slot) {
				claim_component(picture.$$.fragment, li_nodes);
			}

			if (default_slot) default_slot.l(li_nodes);
			t = claim_space(li_nodes);
			li_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(li, "class", "svelte-113nkvq");
			add_location(li, file$9, 57, 8, 1809);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);

			if (!default_slot) {
				mount_component(picture, li, null);
			}

			if (default_slot) {
				default_slot.m(li, null);
			}

			append_dev(li, t);
			current = true;
		},
		p: function update(ctx, dirty) {
			if (!default_slot) {
				const picture_changes = (dirty & /*items*/ 1)
				? get_spread_update(picture_spread_levels, [get_spread_object(/*item*/ ctx[5])])
				: {};

				picture.$set(picture_changes);
			}

			if (default_slot && default_slot.p && dirty & /*$$scope, items*/ 9) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, get_default_slot_changes));
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(picture.$$.fragment, local);
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(picture.$$.fragment, local);
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);

			if (!default_slot) {
				destroy_component(picture);
			}

			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block.name,
		type: "each",
		source: "(57:4) {#each items as item}",
		ctx
	});

	return block;
}

function create_fragment$a(ctx) {
	let ul;
	let current;
	let each_value = /*items*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const block = {
		c: function create() {
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			this.h();
		},
		l: function claim(nodes) {
			ul = claim_element(nodes, "UL", { "aria-label": true, class: true });
			var ul_nodes = children(ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].l(ul_nodes);
			}

			ul_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(ul, "aria-label", "carousel");
			attr_dev(ul, "class", "svelte-113nkvq");
			add_location(ul, file$9, 55, 0, 1748);
		},
		m: function mount(target, anchor) {
			insert_dev(target, ul, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*items, $$scope*/ 9) {
				each_value = /*items*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(ul, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(ul);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$a.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$a($$self, $$props, $$invalidate) {
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
	const writable_props = ["items"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Carousel> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("items" in $$props) $$invalidate(0, items = $$props.items);
		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => {
		return { items };
	};

	$$self.$inject_state = $$props => {
		if ("items" in $$props) $$invalidate(0, items = $$props.items);
	};

	return [items, cards, imagesDefault, $$scope, $$slots];
}

class Carousel extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$a, create_fragment$a, safe_not_equal, { items: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Carousel",
			options,
			id: create_fragment$a.name
		});
	}

	get items() {
		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set items(value) {
		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/layouts/Header.svelte generated by Svelte v3.18.1 */
const file$a = "src/layouts/Header.svelte";

// (37:12) <Button on:click={changeTheme} auto size="small">
function create_default_slot_1(ctx) {
	let current;

	const icon = new Icon({
			props: { type: "moon", class: "theme-svg-fill" },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(icon.$$.fragment);
		},
		l: function claim(nodes) {
			claim_component(icon.$$.fragment, nodes);
		},
		m: function mount(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(icon, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_1.name,
		type: "slot",
		source: "(37:12) <Button on:click={changeTheme} auto size=\\\"small\\\">",
		ctx
	});

	return block;
}

// (43:12) <Button on:click={changeTheme} auto size="small">
function create_default_slot(ctx) {
	let current;

	const avatar = new Avatar({
			props: {
				size: "small",
				src: "https://placeimg.com/300/300/people"
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(avatar.$$.fragment);
		},
		l: function claim(nodes) {
			claim_component(avatar.$$.fragment, nodes);
		},
		m: function mount(target, anchor) {
			mount_component(avatar, target, anchor);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(avatar.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(avatar.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(avatar, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot.name,
		type: "slot",
		source: "(43:12) <Button on:click={changeTheme} auto size=\\\"small\\\">",
		ctx
	});

	return block;
}

function create_fragment$b(ctx) {
	let nav;
	let ul0;
	let li0;
	let a0;
	let t0;
	let t1;
	let li1;
	let a1;
	let t2;
	let t3;
	let li2;
	let a2;
	let t4;
	let t5;
	let li3;
	let a3;
	let t6;
	let t7;
	let li4;
	let a4;
	let t8;
	let t9;
	let ul1;
	let li5;
	let select;
	let option0;
	let t10;
	let option1;
	let t11;
	let option2;
	let t12;
	let select_value_value;
	let t13;
	let li6;
	let t14;
	let li7;
	let current;

	const button0 = new Button({
			props: {
				auto: true,
				size: "small",
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	button0.$on("click", /*changeTheme*/ ctx[2]);

	const button1 = new Button({
			props: {
				auto: true,
				size: "small",
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	button1.$on("click", /*changeTheme*/ ctx[2]);

	const block = {
		c: function create() {
			nav = element("nav");
			ul0 = element("ul");
			li0 = element("li");
			a0 = element("a");
			t0 = text("home");
			t1 = space();
			li1 = element("li");
			a1 = element("a");
			t2 = text("map");
			t3 = space();
			li2 = element("li");
			a2 = element("a");
			t4 = text("lists");
			t5 = space();
			li3 = element("li");
			a3 = element("a");
			t6 = text("charity");
			t7 = space();
			li4 = element("li");
			a4 = element("a");
			t8 = text("org");
			t9 = space();
			ul1 = element("ul");
			li5 = element("li");
			select = element("select");
			option0 = element("option");
			t10 = text("Ua");
			option1 = element("option");
			t11 = text("Ru");
			option2 = element("option");
			t12 = text("En");
			t13 = space();
			li6 = element("li");
			create_component(button0.$$.fragment);
			t14 = space();
			li7 = element("li");
			create_component(button1.$$.fragment);
			this.h();
		},
		l: function claim(nodes) {
			nav = claim_element(nodes, "NAV", { class: true });
			var nav_nodes = children(nav);
			ul0 = claim_element(nav_nodes, "UL", {});
			var ul0_nodes = children(ul0);
			li0 = claim_element(ul0_nodes, "LI", {});
			var li0_nodes = children(li0);
			a0 = claim_element(li0_nodes, "A", { rel: true, href: true, class: true });
			var a0_nodes = children(a0);
			t0 = claim_text(a0_nodes, "home");
			a0_nodes.forEach(detach_dev);
			li0_nodes.forEach(detach_dev);
			t1 = claim_space(ul0_nodes);
			li1 = claim_element(ul0_nodes, "LI", {});
			var li1_nodes = children(li1);
			a1 = claim_element(li1_nodes, "A", { href: true, class: true });
			var a1_nodes = children(a1);
			t2 = claim_text(a1_nodes, "map");
			a1_nodes.forEach(detach_dev);
			li1_nodes.forEach(detach_dev);
			t3 = claim_space(ul0_nodes);
			li2 = claim_element(ul0_nodes, "LI", {});
			var li2_nodes = children(li2);
			a2 = claim_element(li2_nodes, "A", { rel: true, href: true, class: true });
			var a2_nodes = children(a2);
			t4 = claim_text(a2_nodes, "lists");
			a2_nodes.forEach(detach_dev);
			li2_nodes.forEach(detach_dev);
			t5 = claim_space(ul0_nodes);
			li3 = claim_element(ul0_nodes, "LI", {});
			var li3_nodes = children(li3);
			a3 = claim_element(li3_nodes, "A", { rel: true, href: true, class: true });
			var a3_nodes = children(a3);
			t6 = claim_text(a3_nodes, "charity");
			a3_nodes.forEach(detach_dev);
			li3_nodes.forEach(detach_dev);
			t7 = claim_space(ul0_nodes);
			li4 = claim_element(ul0_nodes, "LI", {});
			var li4_nodes = children(li4);
			a4 = claim_element(li4_nodes, "A", { rel: true, href: true, class: true });
			var a4_nodes = children(a4);
			t8 = claim_text(a4_nodes, "org");
			a4_nodes.forEach(detach_dev);
			li4_nodes.forEach(detach_dev);
			ul0_nodes.forEach(detach_dev);
			t9 = claim_space(nav_nodes);
			ul1 = claim_element(nav_nodes, "UL", { class: true });
			var ul1_nodes = children(ul1);
			li5 = claim_element(ul1_nodes, "LI", { class: true });
			var li5_nodes = children(li5);

			select = claim_element(li5_nodes, "SELECT", {
				value: true,
				name: true,
				id: true,
				class: true
			});

			var select_nodes = children(select);
			option0 = claim_element(select_nodes, "OPTION", { value: true });
			var option0_nodes = children(option0);
			t10 = claim_text(option0_nodes, "Ua");
			option0_nodes.forEach(detach_dev);
			option1 = claim_element(select_nodes, "OPTION", { value: true });
			var option1_nodes = children(option1);
			t11 = claim_text(option1_nodes, "Ru");
			option1_nodes.forEach(detach_dev);
			option2 = claim_element(select_nodes, "OPTION", { value: true });
			var option2_nodes = children(option2);
			t12 = claim_text(option2_nodes, "En");
			option2_nodes.forEach(detach_dev);
			select_nodes.forEach(detach_dev);
			li5_nodes.forEach(detach_dev);
			t13 = claim_space(ul1_nodes);
			li6 = claim_element(ul1_nodes, "LI", { class: true });
			var li6_nodes = children(li6);
			claim_component(button0.$$.fragment, li6_nodes);
			li6_nodes.forEach(detach_dev);
			t14 = claim_space(ul1_nodes);
			li7 = claim_element(ul1_nodes, "LI", { class: true });
			var li7_nodes = children(li7);
			claim_component(button1.$$.fragment, li7_nodes);
			li7_nodes.forEach(detach_dev);
			ul1_nodes.forEach(detach_dev);
			nav_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(a0, "rel", "prefetch");
			attr_dev(a0, "href", ".");
			attr_dev(a0, "class", "svelte-iotsi1");
			toggle_class(a0, "selected", /*segment*/ ctx[0] === undefined);
			add_location(a0, file$a, 19, 12, 464);
			add_location(li0, file$a, 19, 8, 460);
			attr_dev(a1, "href", "map");
			attr_dev(a1, "class", "svelte-iotsi1");
			toggle_class(a1, "selected", /*segment*/ ctx[0] === "map");
			add_location(a1, file$a, 20, 12, 556);
			add_location(li1, file$a, 20, 8, 552);
			attr_dev(a2, "rel", "prefetch");
			attr_dev(a2, "href", "lists/charities");
			attr_dev(a2, "class", "svelte-iotsi1");
			toggle_class(a2, "selected", /*segment*/ ctx[0] === "lists");
			add_location(a2, file$a, 21, 12, 632);
			add_location(li2, file$a, 21, 8, 628);
			attr_dev(a3, "rel", "prefetch");
			attr_dev(a3, "href", "charity");
			attr_dev(a3, "class", "svelte-iotsi1");
			toggle_class(a3, "selected", /*segment*/ ctx[0] === "charity");
			add_location(a3, file$a, 22, 12, 737);
			add_location(li3, file$a, 22, 8, 733);
			attr_dev(a4, "rel", "prefetch");
			attr_dev(a4, "href", "organization");
			attr_dev(a4, "class", "svelte-iotsi1");
			toggle_class(a4, "selected", /*segment*/ ctx[0] === "organization");
			add_location(a4, file$a, 23, 12, 838);
			add_location(li4, file$a, 23, 8, 834);
			add_location(ul0, file$a, 18, 4, 447);
			option0.__value = "ua";
			option0.value = option0.__value;
			add_location(option0, file$a, 29, 16, 1083);
			option1.__value = "ru";
			option1.value = option1.__value;
			add_location(option1, file$a, 30, 16, 1130);
			option2.__value = "en";
			option2.value = option2.__value;
			add_location(option2, file$a, 31, 16, 1177);
			attr_dev(select, "name", "lang");
			attr_dev(select, "id", "lang");
			attr_dev(select, "class", "btn small lang-select svelte-iotsi1");
			add_location(select, file$a, 28, 12, 998);
			attr_dev(li5, "class", "svelte-iotsi1");
			add_location(li5, file$a, 27, 8, 981);
			attr_dev(li6, "class", "svelte-iotsi1");
			add_location(li6, file$a, 35, 8, 1253);
			attr_dev(li7, "class", "svelte-iotsi1");
			add_location(li7, file$a, 41, 8, 1424);
			attr_dev(ul1, "class", "nav-actions svelte-iotsi1");
			add_location(ul1, file$a, 26, 4, 948);
			attr_dev(nav, "class", "theme-bg container svelte-iotsi1");
			add_location(nav, file$a, 17, 0, 410);
		},
		m: function mount(target, anchor) {
			insert_dev(target, nav, anchor);
			append_dev(nav, ul0);
			append_dev(ul0, li0);
			append_dev(li0, a0);
			append_dev(a0, t0);
			append_dev(ul0, t1);
			append_dev(ul0, li1);
			append_dev(li1, a1);
			append_dev(a1, t2);
			append_dev(ul0, t3);
			append_dev(ul0, li2);
			append_dev(li2, a2);
			append_dev(a2, t4);
			append_dev(ul0, t5);
			append_dev(ul0, li3);
			append_dev(li3, a3);
			append_dev(a3, t6);
			append_dev(ul0, t7);
			append_dev(ul0, li4);
			append_dev(li4, a4);
			append_dev(a4, t8);
			append_dev(nav, t9);
			append_dev(nav, ul1);
			append_dev(ul1, li5);
			append_dev(li5, select);
			append_dev(select, option0);
			append_dev(option0, t10);
			append_dev(select, option1);
			append_dev(option1, t11);
			append_dev(select, option2);
			append_dev(option2, t12);
			select_value_value = /*value*/ ctx[1];

			for (var i = 0; i < select.options.length; i += 1) {
				var option = select.options[i];

				if (option.__value === select_value_value) {
					option.selected = true;
					break;
				}
			}

			append_dev(ul1, t13);
			append_dev(ul1, li6);
			mount_component(button0, li6, null);
			append_dev(ul1, t14);
			append_dev(ul1, li7);
			mount_component(button1, li7, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*segment, undefined*/ 1) {
				toggle_class(a0, "selected", /*segment*/ ctx[0] === undefined);
			}

			if (dirty & /*segment*/ 1) {
				toggle_class(a1, "selected", /*segment*/ ctx[0] === "map");
			}

			if (dirty & /*segment*/ 1) {
				toggle_class(a2, "selected", /*segment*/ ctx[0] === "lists");
			}

			if (dirty & /*segment*/ 1) {
				toggle_class(a3, "selected", /*segment*/ ctx[0] === "charity");
			}

			if (dirty & /*segment*/ 1) {
				toggle_class(a4, "selected", /*segment*/ ctx[0] === "organization");
			}

			const button0_changes = {};

			if (dirty & /*$$scope*/ 16) {
				button0_changes.$$scope = { dirty, ctx };
			}

			button0.$set(button0_changes);
			const button1_changes = {};

			if (dirty & /*$$scope*/ 16) {
				button1_changes.$$scope = { dirty, ctx };
			}

			button1.$set(button1_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);
			transition_in(button1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(nav);
			destroy_component(button0);
			destroy_component(button1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$b.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$b($$self, $$props, $$invalidate) {
	let { segment } = $$props;
	let isDarkTheme = false;
	let value = "ua";

	function changeTheme() {
		isDarkTheme = !isDarkTheme;
		document.body.classList.remove("theme-dark");
		document.body.classList.remove("theme-light");
		document.body.classList.add(isDarkTheme ? "theme-dark" : "theme-light");
	}

	const writable_props = ["segment"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("segment" in $$props) $$invalidate(0, segment = $$props.segment);
	};

	$$self.$capture_state = () => {
		return { segment, isDarkTheme, value };
	};

	$$self.$inject_state = $$props => {
		if ("segment" in $$props) $$invalidate(0, segment = $$props.segment);
		if ("isDarkTheme" in $$props) isDarkTheme = $$props.isDarkTheme;
		if ("value" in $$props) $$invalidate(1, value = $$props.value);
	};

	return [segment, value, changeTheme];
}

class Header extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$b, create_fragment$b, safe_not_equal, { segment: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Header",
			options,
			id: create_fragment$b.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*segment*/ ctx[0] === undefined && !("segment" in props)) {
			console.warn("<Header> was created without expected prop 'segment'");
		}
	}

	get segment() {
		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set segment(value) {
		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/layouts/Footer.svelte generated by Svelte v3.18.1 */

const file$b = "src/layouts/Footer.svelte";

function create_fragment$c(ctx) {
	let footer;
	let p;
	let t0;
	let t1_value = new Date().getFullYear() + "";
	let t1;

	const block = {
		c: function create() {
			footer = element("footer");
			p = element("p");
			t0 = text("© 2019 - ");
			t1 = text(t1_value);
			this.h();
		},
		l: function claim(nodes) {
			footer = claim_element(nodes, "FOOTER", { class: true });
			var footer_nodes = children(footer);
			p = claim_element(footer_nodes, "P", {});
			var p_nodes = children(p);
			t0 = claim_text(p_nodes, "© 2019 - ");
			t1 = claim_text(p_nodes, t1_value);
			p_nodes.forEach(detach_dev);
			footer_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			add_location(p, file$b, 5, 4, 34);
			attr_dev(footer, "class", "svelte-hgsupk");
			add_location(footer, file$b, 4, 0, 21);
		},
		m: function mount(target, anchor) {
			insert_dev(target, footer, anchor);
			append_dev(footer, p);
			append_dev(p, t0);
			append_dev(p, t1);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(footer);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$c.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

class Footer extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$c, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Footer",
			options,
			id: create_fragment$c.name
		});
	}
}

/* src/layouts/Comment.svelte generated by Svelte v3.18.1 */
const file$c = "src/layouts/Comment.svelte";

function create_fragment$d(ctx) {
	let section;
	let t0;
	let div;
	let span;
	let h4;
	let t1;
	let t2;
	let sub;
	let t3;
	let t4;
	let br;
	let t5;
	let pre;
	let t6;
	let current;

	const avatar = new Avatar({
			props: {
				src: /*src*/ ctx[0],
				alt: /*title*/ ctx[1],
				class: "comment-ava"
			},
			$$inline: true
		});

	const default_slot_template = /*$$slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

	const block = {
		c: function create() {
			section = element("section");
			create_component(avatar.$$.fragment);
			t0 = space();
			div = element("div");
			span = element("span");
			h4 = element("h4");
			t1 = text(/*title*/ ctx[1]);
			t2 = space();
			sub = element("sub");
			t3 = text(/*subtitle*/ ctx[2]);
			t4 = space();
			br = element("br");
			t5 = space();

			if (!default_slot) {
				pre = element("pre");
				t6 = text("A loooooooooong comment that has been\n                left by a very angry guy who complains upon\n                looooong comments.");
			}

			if (default_slot) default_slot.c();
			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			claim_component(avatar.$$.fragment, section_nodes);
			t0 = claim_space(section_nodes);
			div = claim_element(section_nodes, "DIV", { class: true });
			var div_nodes = children(div);
			span = claim_element(div_nodes, "SPAN", { class: true });
			var span_nodes = children(span);
			h4 = claim_element(span_nodes, "H4", { class: true });
			var h4_nodes = children(h4);
			t1 = claim_text(h4_nodes, /*title*/ ctx[1]);
			h4_nodes.forEach(detach_dev);
			t2 = claim_space(span_nodes);
			sub = claim_element(span_nodes, "SUB", { class: true });
			var sub_nodes = children(sub);
			t3 = claim_text(sub_nodes, /*subtitle*/ ctx[2]);
			sub_nodes.forEach(detach_dev);
			span_nodes.forEach(detach_dev);
			t4 = claim_space(div_nodes);
			br = claim_element(div_nodes, "BR", { class: true });
			t5 = claim_space(div_nodes);

			if (!default_slot) {
				pre = claim_element(div_nodes, "PRE", { class: true });
				var pre_nodes = children(pre);
				t6 = claim_text(pre_nodes, "A loooooooooong comment that has been\n                left by a very angry guy who complains upon\n                looooong comments.");
				pre_nodes.forEach(detach_dev);
			}

			if (default_slot) default_slot.l(div_nodes);
			div_nodes.forEach(detach_dev);
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(h4, "class", "svelte-1u7rlgt");
			add_location(h4, file$c, 13, 12, 268);
			attr_dev(sub, "class", "svelte-1u7rlgt");
			add_location(sub, file$c, 14, 12, 297);
			attr_dev(span, "class", "svelte-1u7rlgt");
			add_location(span, file$c, 12, 8, 249);
			attr_dev(br, "class", "small");
			add_location(br, file$c, 17, 8, 344);

			if (!default_slot) {
				attr_dev(pre, "class", "svelte-1u7rlgt");
				add_location(pre, file$c, 20, 12, 391);
			}

			attr_dev(div, "class", "svelte-1u7rlgt");
			add_location(div, file$c, 11, 4, 235);
			attr_dev(section, "class", "svelte-1u7rlgt");
			add_location(section, file$c, 8, 0, 164);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			mount_component(avatar, section, null);
			append_dev(section, t0);
			append_dev(section, div);
			append_dev(div, span);
			append_dev(span, h4);
			append_dev(h4, t1);
			append_dev(span, t2);
			append_dev(span, sub);
			append_dev(sub, t3);
			append_dev(div, t4);
			append_dev(div, br);
			append_dev(div, t5);

			if (!default_slot) {
				append_dev(div, pre);
				append_dev(pre, t6);
			}

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			const avatar_changes = {};
			if (dirty & /*src*/ 1) avatar_changes.src = /*src*/ ctx[0];
			if (dirty & /*title*/ 2) avatar_changes.alt = /*title*/ ctx[1];
			avatar.$set(avatar_changes);
			if (!current || dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
			if (!current || dirty & /*subtitle*/ 4) set_data_dev(t3, /*subtitle*/ ctx[2]);

			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(avatar.$$.fragment, local);
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(avatar.$$.fragment, local);
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			destroy_component(avatar);
			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$d.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$c($$self, $$props, $$invalidate) {
	let { src = undefined } = $$props;
	let { title = undefined } = $$props;
	let { subtitle = undefined } = $$props;
	const writable_props = ["src", "title", "subtitle"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Comment> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("src" in $$props) $$invalidate(0, src = $$props.src);
		if ("title" in $$props) $$invalidate(1, title = $$props.title);
		if ("subtitle" in $$props) $$invalidate(2, subtitle = $$props.subtitle);
		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => {
		return { src, title, subtitle };
	};

	$$self.$inject_state = $$props => {
		if ("src" in $$props) $$invalidate(0, src = $$props.src);
		if ("title" in $$props) $$invalidate(1, title = $$props.title);
		if ("subtitle" in $$props) $$invalidate(2, subtitle = $$props.subtitle);
	};

	return [src, title, subtitle, $$scope, $$slots];
}

class Comment extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$c, create_fragment$d, safe_not_equal, { src: 0, title: 1, subtitle: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Comment",
			options,
			id: create_fragment$d.name
		});
	}

	get src() {
		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set src(value) {
		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get title() {
		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get subtitle() {
		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set subtitle(value) {
		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/layouts/AvatarAndName.svelte generated by Svelte v3.18.1 */
const file$d = "src/layouts/AvatarAndName.svelte";

function create_fragment$e(ctx) {
	let section;
	let t0;
	let span;
	let h4;
	let t1;
	let t2;
	let sub;
	let t3;
	let current;

	const avatar = new Avatar({
			props: {
				src: /*src*/ ctx[0],
				alt: /*title*/ ctx[1]
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			section = element("section");
			create_component(avatar.$$.fragment);
			t0 = space();
			span = element("span");
			h4 = element("h4");
			t1 = text(/*title*/ ctx[1]);
			t2 = space();
			sub = element("sub");
			t3 = text(/*subtitle*/ ctx[2]);
			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			claim_component(avatar.$$.fragment, section_nodes);
			t0 = claim_space(section_nodes);
			span = claim_element(section_nodes, "SPAN", { class: true });
			var span_nodes = children(span);
			h4 = claim_element(span_nodes, "H4", { class: true });
			var h4_nodes = children(h4);
			t1 = claim_text(h4_nodes, /*title*/ ctx[1]);
			h4_nodes.forEach(detach_dev);
			t2 = claim_space(span_nodes);
			sub = claim_element(span_nodes, "SUB", { class: true });
			var sub_nodes = children(sub);
			t3 = claim_text(sub_nodes, /*subtitle*/ ctx[2]);
			sub_nodes.forEach(detach_dev);
			span_nodes.forEach(detach_dev);
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(h4, "class", "svelte-s6mhlj");
			add_location(h4, file$d, 12, 8, 230);
			attr_dev(sub, "class", "svelte-s6mhlj");
			add_location(sub, file$d, 13, 8, 255);
			attr_dev(span, "class", "svelte-s6mhlj");
			add_location(span, file$d, 11, 4, 215);
			attr_dev(section, "class", "svelte-s6mhlj");
			add_location(section, file$d, 8, 0, 164);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			mount_component(avatar, section, null);
			append_dev(section, t0);
			append_dev(section, span);
			append_dev(span, h4);
			append_dev(h4, t1);
			append_dev(span, t2);
			append_dev(span, sub);
			append_dev(sub, t3);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const avatar_changes = {};
			if (dirty & /*src*/ 1) avatar_changes.src = /*src*/ ctx[0];
			if (dirty & /*title*/ 2) avatar_changes.alt = /*title*/ ctx[1];
			avatar.$set(avatar_changes);
			if (!current || dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
			if (!current || dirty & /*subtitle*/ 4) set_data_dev(t3, /*subtitle*/ ctx[2]);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(avatar.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(avatar.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			destroy_component(avatar);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$e.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$d($$self, $$props, $$invalidate) {
	let { src = undefined } = $$props;
	let { title = undefined } = $$props;
	let { subtitle = undefined } = $$props;
	const writable_props = ["src", "title", "subtitle"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AvatarAndName> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("src" in $$props) $$invalidate(0, src = $$props.src);
		if ("title" in $$props) $$invalidate(1, title = $$props.title);
		if ("subtitle" in $$props) $$invalidate(2, subtitle = $$props.subtitle);
	};

	$$self.$capture_state = () => {
		return { src, title, subtitle };
	};

	$$self.$inject_state = $$props => {
		if ("src" in $$props) $$invalidate(0, src = $$props.src);
		if ("title" in $$props) $$invalidate(1, title = $$props.title);
		if ("subtitle" in $$props) $$invalidate(2, subtitle = $$props.subtitle);
	};

	return [src, title, subtitle];
}

class AvatarAndName extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$d, create_fragment$e, safe_not_equal, { src: 0, title: 1, subtitle: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "AvatarAndName",
			options,
			id: create_fragment$e.name
		});
	}

	get src() {
		throw new Error("<AvatarAndName>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set src(value) {
		throw new Error("<AvatarAndName>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get title() {
		throw new Error("<AvatarAndName>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<AvatarAndName>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get subtitle() {
		throw new Error("<AvatarAndName>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set subtitle(value) {
		throw new Error("<AvatarAndName>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/layouts/ListItems.svelte generated by Svelte v3.18.1 */
const file$e = "src/layouts/ListItems.svelte";

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[1] = list[i];
	return child_ctx;
}

// (18:0) {:else}
function create_else_block$2(ctx) {
	let section;
	let p;
	let t0;
	let t1;

	const block = {
		c: function create() {
			section = element("section");
			p = element("p");
			t0 = text("No organizations");
			t1 = space();
			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			p = claim_element(section_nodes, "P", { class: true });
			var p_nodes = children(p);
			t0 = claim_text(p_nodes, "No organizations");
			p_nodes.forEach(detach_dev);
			t1 = claim_space(section_nodes);
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(p, "class", "text-center");
			add_location(p, file$e, 19, 8, 418);
			attr_dev(section, "class", "item container svelte-1b2ug4l");
			add_location(section, file$e, 18, 4, 377);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			append_dev(section, p);
			append_dev(p, t0);
			append_dev(section, t1);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$2.name,
		type: "else",
		source: "(18:0) {:else}",
		ctx
	});

	return block;
}

// (7:0) {#each items as item}
function create_each_block$1(ctx) {
	let section;
	let br0;
	let t0;
	let t1;
	let br1;
	let t2;
	let br2;
	let current;

	const avatarandname = new AvatarAndName({
			props: {
				src: /*item*/ ctx[1].orgHeadSrc,
				title: /*item*/ ctx[1].orgHead,
				subtitle: /*item*/ ctx[1].organization
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			section = element("section");
			br0 = element("br");
			t0 = space();
			create_component(avatarandname.$$.fragment);
			t1 = space();
			br1 = element("br");
			t2 = space();
			br2 = element("br");
			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			br0 = claim_element(section_nodes, "BR", {});
			t0 = claim_space(section_nodes);
			claim_component(avatarandname.$$.fragment, section_nodes);
			t1 = claim_space(section_nodes);
			br1 = claim_element(section_nodes, "BR", {});
			section_nodes.forEach(detach_dev);
			t2 = claim_space(nodes);
			br2 = claim_element(nodes, "BR", {});
			this.h();
		},
		h: function hydrate() {
			add_location(br0, file$e, 8, 8, 169);
			add_location(br1, file$e, 14, 8, 336);
			attr_dev(section, "class", "item container svelte-1b2ug4l");
			add_location(section, file$e, 7, 4, 128);
			add_location(br2, file$e, 16, 4, 360);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			append_dev(section, br0);
			append_dev(section, t0);
			mount_component(avatarandname, section, null);
			append_dev(section, t1);
			append_dev(section, br1);
			insert_dev(target, t2, anchor);
			insert_dev(target, br2, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const avatarandname_changes = {};
			if (dirty & /*items*/ 1) avatarandname_changes.src = /*item*/ ctx[1].orgHeadSrc;
			if (dirty & /*items*/ 1) avatarandname_changes.title = /*item*/ ctx[1].orgHead;
			if (dirty & /*items*/ 1) avatarandname_changes.subtitle = /*item*/ ctx[1].organization;
			avatarandname.$set(avatarandname_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(avatarandname.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(avatarandname.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			destroy_component(avatarandname);
			if (detaching) detach_dev(t2);
			if (detaching) detach_dev(br2);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$1.name,
		type: "each",
		source: "(7:0) {#each items as item}",
		ctx
	});

	return block;
}

function create_fragment$f(ctx) {
	let each_1_anchor;
	let current;
	let each_value = /*items*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	let each_1_else = null;

	if (!each_value.length) {
		each_1_else = create_else_block$2(ctx);
	}

	const block = {
		c: function create() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();

			if (each_1_else) {
				each_1_else.c();
			}
		},
		l: function claim(nodes) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].l(nodes);
			}

			each_1_anchor = empty();

			if (each_1_else) {
				each_1_else.l(nodes);
			}
		},
		m: function mount(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert_dev(target, each_1_anchor, anchor);

			if (each_1_else) {
				each_1_else.m(target, anchor);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*items*/ 1) {
				each_value = /*items*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (each_value.length) {
				if (each_1_else) {
					each_1_else.d(1);
					each_1_else = null;
				}
			} else if (!each_1_else) {
				each_1_else = create_else_block$2(ctx);
				each_1_else.c();
				each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach_dev(each_1_anchor);
			if (each_1_else) each_1_else.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$f.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$e($$self, $$props, $$invalidate) {
	let { items = [] } = $$props;
	const writable_props = ["items"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ListItems> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("items" in $$props) $$invalidate(0, items = $$props.items);
	};

	$$self.$capture_state = () => {
		return { items };
	};

	$$self.$inject_state = $$props => {
		if ("items" in $$props) $$invalidate(0, items = $$props.items);
	};

	return [items];
}

class ListItems extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$e, create_fragment$f, safe_not_equal, { items: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "ListItems",
			options,
			id: create_fragment$f.name
		});
	}

	get items() {
		throw new Error("<ListItems>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set items(value) {
		throw new Error("<ListItems>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/layouts/SearchLine.svelte generated by Svelte v3.18.1 */
const file$f = "src/layouts/SearchLine.svelte";

function create_fragment$g(ctx) {
	let section;
	let current;
	const input = new Input({ $$inline: true });

	const block = {
		c: function create() {
			section = element("section");
			create_component(input.$$.fragment);
			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			claim_component(input.$$.fragment, section_nodes);
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(section, "class", "search svelte-ovr79r");
			add_location(section, file$f, 4, 0, 62);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			mount_component(input, section, null);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(input.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(input.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			destroy_component(input);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$g.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

class SearchLine extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$g, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "SearchLine",
			options,
			id: create_fragment$g.name
		});
	}
}

/* src/layouts/CharityCard.svelte generated by Svelte v3.18.1 */
const file$g = "src/layouts/CharityCard.svelte";

function create_fragment$h(ctx) {
	let section;
	let div0;
	let t0;
	let t1;
	let h4;
	let t2;
	let t3;
	let div1;
	let t4;
	let footer;
	let current;

	const carousel = new Carousel({
			props: { items: /*images*/ ctx[5] },
			$$inline: true
		});

	const progress = new Progress({
			props: {
				value: /*percent*/ ctx[1],
				borderRadius: "0 0"
			},
			$$inline: true
		});

	const rate = new Rate({ props: { size: "small" }, $$inline: true });

	const avatarandname = new AvatarAndName({
			props: {
				src: /*orgHeadSrc*/ ctx[3],
				title: /*orgHead*/ ctx[2],
				subtitle: /*organization*/ ctx[4]
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			section = element("section");
			div0 = element("div");
			create_component(carousel.$$.fragment);
			t0 = space();
			create_component(progress.$$.fragment);
			t1 = space();
			h4 = element("h4");
			t2 = text(/*title*/ ctx[0]);
			t3 = space();
			div1 = element("div");
			create_component(rate.$$.fragment);
			t4 = space();
			footer = element("footer");
			create_component(avatarandname.$$.fragment);
			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			div0 = claim_element(section_nodes, "DIV", { class: true });
			var div0_nodes = children(div0);
			claim_component(carousel.$$.fragment, div0_nodes);
			div0_nodes.forEach(detach_dev);
			t0 = claim_space(section_nodes);
			claim_component(progress.$$.fragment, section_nodes);
			t1 = claim_space(section_nodes);
			h4 = claim_element(section_nodes, "H4", { class: true });
			var h4_nodes = children(h4);
			t2 = claim_text(h4_nodes, /*title*/ ctx[0]);
			h4_nodes.forEach(detach_dev);
			t3 = claim_space(section_nodes);
			div1 = claim_element(section_nodes, "DIV", { class: true });
			var div1_nodes = children(div1);
			claim_component(rate.$$.fragment, div1_nodes);
			div1_nodes.forEach(detach_dev);
			t4 = claim_space(section_nodes);
			footer = claim_element(section_nodes, "FOOTER", {});
			var footer_nodes = children(footer);
			claim_component(avatarandname.$$.fragment, footer_nodes);
			footer_nodes.forEach(detach_dev);
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(div0, "class", "images-wrap svelte-do16pj");
			add_location(div0, file$g, 18, 4, 461);
			attr_dev(h4, "class", "svelte-do16pj");
			add_location(h4, file$g, 24, 4, 590);
			attr_dev(div1, "class", "rate-wrap svelte-do16pj");
			add_location(div1, file$g, 26, 4, 612);
			add_location(footer, file$g, 30, 4, 681);
			attr_dev(section, "class", "card svelte-do16pj");
			add_location(section, file$g, 17, 0, 434);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			append_dev(section, div0);
			mount_component(carousel, div0, null);
			append_dev(section, t0);
			mount_component(progress, section, null);
			append_dev(section, t1);
			append_dev(section, h4);
			append_dev(h4, t2);
			append_dev(section, t3);
			append_dev(section, div1);
			mount_component(rate, div1, null);
			append_dev(section, t4);
			append_dev(section, footer);
			mount_component(avatarandname, footer, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const carousel_changes = {};
			if (dirty & /*images*/ 32) carousel_changes.items = /*images*/ ctx[5];
			carousel.$set(carousel_changes);
			const progress_changes = {};
			if (dirty & /*percent*/ 2) progress_changes.value = /*percent*/ ctx[1];
			progress.$set(progress_changes);
			if (!current || dirty & /*title*/ 1) set_data_dev(t2, /*title*/ ctx[0]);
			const avatarandname_changes = {};
			if (dirty & /*orgHeadSrc*/ 8) avatarandname_changes.src = /*orgHeadSrc*/ ctx[3];
			if (dirty & /*orgHead*/ 4) avatarandname_changes.title = /*orgHead*/ ctx[2];
			if (dirty & /*organization*/ 16) avatarandname_changes.subtitle = /*organization*/ ctx[4];
			avatarandname.$set(avatarandname_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(carousel.$$.fragment, local);
			transition_in(progress.$$.fragment, local);
			transition_in(rate.$$.fragment, local);
			transition_in(avatarandname.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(carousel.$$.fragment, local);
			transition_out(progress.$$.fragment, local);
			transition_out(rate.$$.fragment, local);
			transition_out(avatarandname.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			destroy_component(carousel);
			destroy_component(progress);
			destroy_component(rate);
			destroy_component(avatarandname);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$h.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$f($$self, $$props, $$invalidate) {
	let { src = undefined } = $$props;
	let { title = undefined } = $$props;
	let { percent = undefined } = $$props;
	let { orgHead = undefined } = $$props;
	let { orgHeadSrc = undefined } = $$props;
	let { organization = undefined } = $$props;
	const writable_props = ["src", "title", "percent", "orgHead", "orgHeadSrc", "organization"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CharityCard> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("src" in $$props) $$invalidate(6, src = $$props.src);
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("percent" in $$props) $$invalidate(1, percent = $$props.percent);
		if ("orgHead" in $$props) $$invalidate(2, orgHead = $$props.orgHead);
		if ("orgHeadSrc" in $$props) $$invalidate(3, orgHeadSrc = $$props.orgHeadSrc);
		if ("organization" in $$props) $$invalidate(4, organization = $$props.organization);
	};

	$$self.$capture_state = () => {
		return {
			src,
			title,
			percent,
			orgHead,
			orgHeadSrc,
			organization,
			images
		};
	};

	$$self.$inject_state = $$props => {
		if ("src" in $$props) $$invalidate(6, src = $$props.src);
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("percent" in $$props) $$invalidate(1, percent = $$props.percent);
		if ("orgHead" in $$props) $$invalidate(2, orgHead = $$props.orgHead);
		if ("orgHeadSrc" in $$props) $$invalidate(3, orgHeadSrc = $$props.orgHeadSrc);
		if ("organization" in $$props) $$invalidate(4, organization = $$props.organization);
		if ("images" in $$props) $$invalidate(5, images = $$props.images);
	};

	let images;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*src, title*/ 65) {
			 $$invalidate(5, images = new Array(4).fill({ src, alt: title }));
		}
	};

	return [title, percent, orgHead, orgHeadSrc, organization, images, src];
}

class CharityCard extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$f, create_fragment$h, safe_not_equal, {
			src: 6,
			title: 0,
			percent: 1,
			orgHead: 2,
			orgHeadSrc: 3,
			organization: 4
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "CharityCard",
			options,
			id: create_fragment$h.name
		});
	}

	get src() {
		throw new Error("<CharityCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set src(value) {
		throw new Error("<CharityCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get title() {
		throw new Error("<CharityCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<CharityCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get percent() {
		throw new Error("<CharityCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set percent(value) {
		throw new Error("<CharityCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get orgHead() {
		throw new Error("<CharityCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set orgHead(value) {
		throw new Error("<CharityCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get orgHeadSrc() {
		throw new Error("<CharityCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set orgHeadSrc(value) {
		throw new Error("<CharityCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get organization() {
		throw new Error("<CharityCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set organization(value) {
		throw new Error("<CharityCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/layouts/CharityCards.svelte generated by Svelte v3.18.1 */
const file$h = "src/layouts/CharityCards.svelte";

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[4] = list[i];
	return child_ctx;
}

// (50:4) {#if listName}
function create_if_block$4(ctx) {
	let t0;
	let h3;
	let t1;
	let t2;
	let t3;
	let br;
	let current;
	const divider0 = new Divider({ props: { size: "16" }, $$inline: true });
	const divider1 = new Divider({ props: { size: "20" }, $$inline: true });

	const block = {
		c: function create() {
			create_component(divider0.$$.fragment);
			t0 = space();
			h3 = element("h3");
			t1 = text(/*listName*/ ctx[0]);
			t2 = space();
			create_component(divider1.$$.fragment);
			t3 = space();
			br = element("br");
			this.h();
		},
		l: function claim(nodes) {
			claim_component(divider0.$$.fragment, nodes);
			t0 = claim_space(nodes);
			h3 = claim_element(nodes, "H3", { class: true });
			var h3_nodes = children(h3);
			t1 = claim_text(h3_nodes, /*listName*/ ctx[0]);
			h3_nodes.forEach(detach_dev);
			t2 = claim_space(nodes);
			claim_component(divider1.$$.fragment, nodes);
			t3 = claim_space(nodes);
			br = claim_element(nodes, "BR", {});
			this.h();
		},
		h: function hydrate() {
			attr_dev(h3, "class", "h2 text-right");
			add_location(h3, file$h, 51, 8, 1754);
			add_location(br, file$h, 53, 8, 1833);
		},
		m: function mount(target, anchor) {
			mount_component(divider0, target, anchor);
			insert_dev(target, t0, anchor);
			insert_dev(target, h3, anchor);
			append_dev(h3, t1);
			insert_dev(target, t2, anchor);
			mount_component(divider1, target, anchor);
			insert_dev(target, t3, anchor);
			insert_dev(target, br, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			if (!current || dirty & /*listName*/ 1) set_data_dev(t1, /*listName*/ ctx[0]);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(divider0.$$.fragment, local);
			transition_in(divider1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(divider0.$$.fragment, local);
			transition_out(divider1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(divider0, detaching);
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(h3);
			if (detaching) detach_dev(t2);
			destroy_component(divider1, detaching);
			if (detaching) detach_dev(t3);
			if (detaching) detach_dev(br);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$4.name,
		type: "if",
		source: "(50:4) {#if listName}",
		ctx
	});

	return block;
}

// (57:8) {#each cards as card}
function create_each_block$2(ctx) {
	let li;
	let t;
	let current;
	const charitycard_spread_levels = [/*card*/ ctx[4]];
	let charitycard_props = {};

	for (let i = 0; i < charitycard_spread_levels.length; i += 1) {
		charitycard_props = assign(charitycard_props, charitycard_spread_levels[i]);
	}

	const charitycard = new CharityCard({ props: charitycard_props, $$inline: true });

	const block = {
		c: function create() {
			li = element("li");
			create_component(charitycard.$$.fragment);
			t = space();
			this.h();
		},
		l: function claim(nodes) {
			li = claim_element(nodes, "LI", { class: true });
			var li_nodes = children(li);
			claim_component(charitycard.$$.fragment, li_nodes);
			t = claim_space(li_nodes);
			li_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(li, "class", "svelte-1hdqh35");
			add_location(li, file$h, 57, 12, 1913);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			mount_component(charitycard, li, null);
			append_dev(li, t);
			current = true;
		},
		p: function update(ctx, dirty) {
			const charitycard_changes = (dirty & /*cards*/ 2)
			? get_spread_update(charitycard_spread_levels, [get_spread_object(/*card*/ ctx[4])])
			: {};

			charitycard.$set(charitycard_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(charitycard.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(charitycard.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
			destroy_component(charitycard);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$2.name,
		type: "each",
		source: "(57:8) {#each cards as card}",
		ctx
	});

	return block;
}

function create_fragment$i(ctx) {
	let section;
	let t;
	let ul;
	let current;
	let if_block = /*listName*/ ctx[0] && create_if_block$4(ctx);
	let each_value = /*cards*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const block = {
		c: function create() {
			section = element("section");
			if (if_block) if_block.c();
			t = space();
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			if (if_block) if_block.l(section_nodes);
			t = claim_space(section_nodes);
			ul = claim_element(section_nodes, "UL", { class: true });
			var ul_nodes = children(ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].l(ul_nodes);
			}

			ul_nodes.forEach(detach_dev);
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(ul, "class", "cards svelte-1hdqh35");
			add_location(ul, file$h, 55, 4, 1852);
			attr_dev(section, "class", "svelte-1hdqh35");
			add_location(section, file$h, 48, 0, 1688);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			if (if_block) if_block.m(section, null);
			append_dev(section, t);
			append_dev(section, ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (/*listName*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$4(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(section, t);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (dirty & /*cards*/ 2) {
				each_value = /*cards*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(ul, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			if (if_block) if_block.d();
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$i.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$g($$self, $$props, $$invalidate) {
	let { listName } = $$props;
	let { amount = 2 } = $$props;
	const writable_props = ["listName", "amount"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CharityCards> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("listName" in $$props) $$invalidate(0, listName = $$props.listName);
		if ("amount" in $$props) $$invalidate(2, amount = $$props.amount);
	};

	$$self.$capture_state = () => {
		return { listName, amount, cards, images };
	};

	$$self.$inject_state = $$props => {
		if ("listName" in $$props) $$invalidate(0, listName = $$props.listName);
		if ("amount" in $$props) $$invalidate(2, amount = $$props.amount);
		if ("cards" in $$props) $$invalidate(1, cards = $$props.cards);
		if ("images" in $$props) images = $$props.images;
	};

	let cards;
	let images;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*amount*/ 4) {
			 $$invalidate(1, cards = [
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
			].slice(Number.isFinite(+amount) ? +amount : 0));
		}

		if ($$self.$$.dirty & /*cards*/ 2) {
			 images = cards.map(card => ({
				src: [card.src, card.src, card.src],
				alt: card.title
			}));
		}
	};

	return [listName, cards, amount];
}

class CharityCards extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$g, create_fragment$i, safe_not_equal, { listName: 0, amount: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "CharityCards",
			options,
			id: create_fragment$i.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*listName*/ ctx[0] === undefined && !("listName" in props)) {
			console.warn("<CharityCards> was created without expected prop 'listName'");
		}
	}

	get listName() {
		throw new Error("<CharityCards>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set listName(value) {
		throw new Error("<CharityCards>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get amount() {
		throw new Error("<CharityCards>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set amount(value) {
		throw new Error("<CharityCards>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/layouts/TitleSubTitle.svelte generated by Svelte v3.18.1 */

const file$i = "src/layouts/TitleSubTitle.svelte";

function create_fragment$j(ctx) {
	let section;
	let h1;
	let t0;
	let t1;
	let br;
	let t2;
	let h2;
	let t3;

	const block = {
		c: function create() {
			section = element("section");
			h1 = element("h1");
			t0 = text(/*title*/ ctx[0]);
			t1 = space();
			br = element("br");
			t2 = space();
			h2 = element("h2");
			t3 = text(/*subtitle*/ ctx[1]);
			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			h1 = claim_element(section_nodes, "H1", {});
			var h1_nodes = children(h1);
			t0 = claim_text(h1_nodes, /*title*/ ctx[0]);
			h1_nodes.forEach(detach_dev);
			t1 = claim_space(section_nodes);
			br = claim_element(section_nodes, "BR", {});
			t2 = claim_space(section_nodes);
			h2 = claim_element(section_nodes, "H2", { class: true });
			var h2_nodes = children(h2);
			t3 = claim_text(h2_nodes, /*subtitle*/ ctx[1]);
			h2_nodes.forEach(detach_dev);
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			add_location(h1, file$i, 6, 4, 234);
			add_location(br, file$i, 7, 4, 255);
			attr_dev(h2, "class", "svelte-y1uq32");
			add_location(h2, file$i, 8, 4, 264);
			attr_dev(section, "class", "svelte-y1uq32");
			add_location(section, file$i, 5, 0, 220);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			append_dev(section, h1);
			append_dev(h1, t0);
			append_dev(section, t1);
			append_dev(section, br);
			append_dev(section, t2);
			append_dev(section, h2);
			append_dev(h2, t3);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
			if (dirty & /*subtitle*/ 2) set_data_dev(t3, /*subtitle*/ ctx[1]);
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$j.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$h($$self, $$props, $$invalidate) {
	let { title = "The main title that explains the charity" } = $$props;
	let { subtitle = "And bigger description that describes in short keywords a charity, title above and just makes text longer" } = $$props;
	const writable_props = ["title", "subtitle"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TitleSubTitle> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("subtitle" in $$props) $$invalidate(1, subtitle = $$props.subtitle);
	};

	$$self.$capture_state = () => {
		return { title, subtitle };
	};

	$$self.$inject_state = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("subtitle" in $$props) $$invalidate(1, subtitle = $$props.subtitle);
	};

	return [title, subtitle];
}

class TitleSubTitle extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$h, create_fragment$j, safe_not_equal, { title: 0, subtitle: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "TitleSubTitle",
			options,
			id: create_fragment$j.name
		});
	}

	get title() {
		throw new Error("<TitleSubTitle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<TitleSubTitle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get subtitle() {
		throw new Error("<TitleSubTitle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set subtitle(value) {
		throw new Error("<TitleSubTitle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/layouts/DonatingGroup.svelte generated by Svelte v3.18.1 */
const file$j = "src/layouts/DonatingGroup.svelte";

// (7:8) <Button is="success" on:click="{e => console.log(e)}">
function create_default_slot_3(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("test1");
		},
		l: function claim(nodes) {
			t = claim_text(nodes, "test1");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_3.name,
		type: "slot",
		source: "(7:8) <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">",
		ctx
	});

	return block;
}

// (10:8) <Button is="success" on:click="{e => console.log(e)}">
function create_default_slot_2(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("test12");
		},
		l: function claim(nodes) {
			t = claim_text(nodes, "test12");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_2.name,
		type: "slot",
		source: "(10:8) <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">",
		ctx
	});

	return block;
}

// (13:8) <Button is="success" on:click="{e => console.log(e)}">
function create_default_slot_1$1(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("test123");
		},
		l: function claim(nodes) {
			t = claim_text(nodes, "test123");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_1$1.name,
		type: "slot",
		source: "(13:8) <Button is=\\\"success\\\" on:click=\\\"{e => console.log(e)}\\\">",
		ctx
	});

	return block;
}

// (33:8) <Button is="warning" on:click="{e => console.log(e)}">
function create_default_slot$1(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("Submit");
		},
		l: function claim(nodes) {
			t = claim_text(nodes, "Submit");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$1.name,
		type: "slot",
		source: "(33:8) <Button is=\\\"warning\\\" on:click=\\\"{e => console.log(e)}\\\">",
		ctx
	});

	return block;
}

function create_fragment$k(ctx) {
	let ul;
	let li0;
	let t0;
	let li1;
	let t1;
	let li2;
	let t2;
	let li3;
	let br;
	let t3;
	let t4;
	let datalist;
	let option0;
	let option1;
	let option2;
	let t5;
	let li4;
	let current;

	const button0 = new Button({
			props: {
				is: "success",
				$$slots: { default: [create_default_slot_3] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	button0.$on("click", /*click_handler*/ ctx[0]);

	const button1 = new Button({
			props: {
				is: "success",
				$$slots: { default: [create_default_slot_2] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	button1.$on("click", /*click_handler_1*/ ctx[1]);

	const button2 = new Button({
			props: {
				is: "success",
				$$slots: { default: [create_default_slot_1$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	button2.$on("click", /*click_handler_2*/ ctx[2]);

	const input = new Input({
			props: {
				type: "number",
				name: "num",
				list: "sum-suggestions",
				placeholder: "Num",
				autoselect: true,
				align: "right"
			},
			$$inline: true
		});

	const button3 = new Button({
			props: {
				is: "warning",
				$$slots: { default: [create_default_slot$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	button3.$on("click", /*click_handler_3*/ ctx[3]);

	const block = {
		c: function create() {
			ul = element("ul");
			li0 = element("li");
			create_component(button0.$$.fragment);
			t0 = space();
			li1 = element("li");
			create_component(button1.$$.fragment);
			t1 = space();
			li2 = element("li");
			create_component(button2.$$.fragment);
			t2 = space();
			li3 = element("li");
			br = element("br");
			t3 = space();
			create_component(input.$$.fragment);
			t4 = space();
			datalist = element("datalist");
			option0 = element("option");
			option1 = element("option");
			option2 = element("option");
			t5 = space();
			li4 = element("li");
			create_component(button3.$$.fragment);
			this.h();
		},
		l: function claim(nodes) {
			ul = claim_element(nodes, "UL", { class: true });
			var ul_nodes = children(ul);
			li0 = claim_element(ul_nodes, "LI", { class: true });
			var li0_nodes = children(li0);
			claim_component(button0.$$.fragment, li0_nodes);
			li0_nodes.forEach(detach_dev);
			t0 = claim_space(ul_nodes);
			li1 = claim_element(ul_nodes, "LI", { class: true });
			var li1_nodes = children(li1);
			claim_component(button1.$$.fragment, li1_nodes);
			li1_nodes.forEach(detach_dev);
			t1 = claim_space(ul_nodes);
			li2 = claim_element(ul_nodes, "LI", { class: true });
			var li2_nodes = children(li2);
			claim_component(button2.$$.fragment, li2_nodes);
			li2_nodes.forEach(detach_dev);
			t2 = claim_space(ul_nodes);
			li3 = claim_element(ul_nodes, "LI", { class: true });
			var li3_nodes = children(li3);
			br = claim_element(li3_nodes, "BR", {});
			t3 = claim_space(li3_nodes);
			claim_component(input.$$.fragment, li3_nodes);
			t4 = claim_space(li3_nodes);
			datalist = claim_element(li3_nodes, "DATALIST", { id: true });
			var datalist_nodes = children(datalist);
			option0 = claim_element(datalist_nodes, "OPTION", { value: true });
			var option0_nodes = children(option0);
			option0_nodes.forEach(detach_dev);
			option1 = claim_element(datalist_nodes, "OPTION", { value: true });
			var option1_nodes = children(option1);
			option1_nodes.forEach(detach_dev);
			option2 = claim_element(datalist_nodes, "OPTION", { value: true });
			var option2_nodes = children(option2);
			option2_nodes.forEach(detach_dev);
			datalist_nodes.forEach(detach_dev);
			li3_nodes.forEach(detach_dev);
			t5 = claim_space(ul_nodes);
			li4 = claim_element(ul_nodes, "LI", { class: true });
			var li4_nodes = children(li4);
			claim_component(button3.$$.fragment, li4_nodes);
			li4_nodes.forEach(detach_dev);
			ul_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(li0, "class", "svelte-1k5eog2");
			add_location(li0, file$j, 5, 4, 79);
			attr_dev(li1, "class", "svelte-1k5eog2");
			add_location(li1, file$j, 8, 4, 175);
			attr_dev(li2, "class", "svelte-1k5eog2");
			add_location(li2, file$j, 11, 4, 272);
			add_location(br, file$j, 15, 8, 383);
			option0.__value = "20";
			option0.value = option0.__value;
			add_location(option0, file$j, 26, 12, 654);
			option1.__value = "500";
			option1.value = option1.__value;
			add_location(option1, file$j, 27, 12, 686);
			option2.__value = "1000";
			option2.value = option2.__value;
			add_location(option2, file$j, 28, 12, 719);
			attr_dev(datalist, "id", "sum-suggestions");
			add_location(datalist, file$j, 25, 8, 610);
			attr_dev(li3, "class", "svelte-1k5eog2");
			add_location(li3, file$j, 14, 4, 370);
			attr_dev(li4, "class", "svelte-1k5eog2");
			add_location(li4, file$j, 31, 4, 775);
			attr_dev(ul, "class", "svelte-1k5eog2");
			add_location(ul, file$j, 4, 0, 70);
		},
		m: function mount(target, anchor) {
			insert_dev(target, ul, anchor);
			append_dev(ul, li0);
			mount_component(button0, li0, null);
			append_dev(ul, t0);
			append_dev(ul, li1);
			mount_component(button1, li1, null);
			append_dev(ul, t1);
			append_dev(ul, li2);
			mount_component(button2, li2, null);
			append_dev(ul, t2);
			append_dev(ul, li3);
			append_dev(li3, br);
			append_dev(li3, t3);
			mount_component(input, li3, null);
			append_dev(li3, t4);
			append_dev(li3, datalist);
			append_dev(datalist, option0);
			append_dev(datalist, option1);
			append_dev(datalist, option2);
			append_dev(ul, t5);
			append_dev(ul, li4);
			mount_component(button3, li4, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const button0_changes = {};

			if (dirty & /*$$scope*/ 16) {
				button0_changes.$$scope = { dirty, ctx };
			}

			button0.$set(button0_changes);
			const button1_changes = {};

			if (dirty & /*$$scope*/ 16) {
				button1_changes.$$scope = { dirty, ctx };
			}

			button1.$set(button1_changes);
			const button2_changes = {};

			if (dirty & /*$$scope*/ 16) {
				button2_changes.$$scope = { dirty, ctx };
			}

			button2.$set(button2_changes);
			const button3_changes = {};

			if (dirty & /*$$scope*/ 16) {
				button3_changes.$$scope = { dirty, ctx };
			}

			button3.$set(button3_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);
			transition_in(button1.$$.fragment, local);
			transition_in(button2.$$.fragment, local);
			transition_in(input.$$.fragment, local);
			transition_in(button3.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			transition_out(button2.$$.fragment, local);
			transition_out(input.$$.fragment, local);
			transition_out(button3.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(ul);
			destroy_component(button0);
			destroy_component(button1);
			destroy_component(button2);
			destroy_component(input);
			destroy_component(button3);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$k.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$i($$self) {
	const click_handler = e => console.log(e);
	const click_handler_1 = e => console.log(e);
	const click_handler_2 = e => console.log(e);
	const click_handler_3 = e => console.log(e);

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		
	};

	return [click_handler, click_handler_1, click_handler_2, click_handler_3];
}

class DonatingGroup extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$i, create_fragment$k, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "DonatingGroup",
			options,
			id: create_fragment$k.name
		});
	}
}

/* src/layouts/ContentHolder.svelte generated by Svelte v3.18.1 */

const file$k = "src/layouts/ContentHolder.svelte";

function create_fragment$l(ctx) {
	let h1;
	let t0;
	let t1;
	let br0;
	let t2;
	let br1;
	let t3;
	let pre0;
	let t4;
	let t5;
	let br2;
	let t6;
	let pre1;
	let t7;

	const block = {
		c: function create() {
			h1 = element("h1");
			t0 = text("About");
			t1 = space();
			br0 = element("br");
			t2 = space();
			br1 = element("br");
			t3 = space();
			pre0 = element("pre");
			t4 = text("This is the \"about\" section which explains people the main sense of our purpose.\n    There's not much here.\n    But this section is not the least!");
			t5 = space();
			br2 = element("br");
			t6 = space();
			pre1 = element("pre");
			t7 = text("We try to make our society more kind and we do kind things for it.\n    Nevertheless, this is the \"about\" page.\n    And there's not much here.");
			this.h();
		},
		l: function claim(nodes) {
			h1 = claim_element(nodes, "H1", { class: true });
			var h1_nodes = children(h1);
			t0 = claim_text(h1_nodes, "About");
			h1_nodes.forEach(detach_dev);
			t1 = claim_space(nodes);
			br0 = claim_element(nodes, "BR", {});
			t2 = claim_space(nodes);
			br1 = claim_element(nodes, "BR", {});
			t3 = claim_space(nodes);
			pre0 = claim_element(nodes, "PRE", {});
			var pre0_nodes = children(pre0);
			t4 = claim_text(pre0_nodes, "This is the \"about\" section which explains people the main sense of our purpose.\n    There's not much here.\n    But this section is not the least!");
			pre0_nodes.forEach(detach_dev);
			t5 = claim_space(nodes);
			br2 = claim_element(nodes, "BR", {});
			t6 = claim_space(nodes);
			pre1 = claim_element(nodes, "PRE", {});
			var pre1_nodes = children(pre1);
			t7 = claim_text(pre1_nodes, "We try to make our society more kind and we do kind things for it.\n    Nevertheless, this is the \"about\" page.\n    And there's not much here.");
			pre1_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(h1, "class", "text-center");
			add_location(h1, file$k, 4, 0, 21);
			add_location(br0, file$k, 5, 0, 56);
			add_location(br1, file$k, 6, 0, 61);
			add_location(pre0, file$k, 7, 0, 66);
			add_location(br2, file$k, 12, 0, 230);
			add_location(pre1, file$k, 13, 0, 235);
		},
		m: function mount(target, anchor) {
			insert_dev(target, h1, anchor);
			append_dev(h1, t0);
			insert_dev(target, t1, anchor);
			insert_dev(target, br0, anchor);
			insert_dev(target, t2, anchor);
			insert_dev(target, br1, anchor);
			insert_dev(target, t3, anchor);
			insert_dev(target, pre0, anchor);
			append_dev(pre0, t4);
			insert_dev(target, t5, anchor);
			insert_dev(target, br2, anchor);
			insert_dev(target, t6, anchor);
			insert_dev(target, pre1, anchor);
			append_dev(pre1, t7);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(h1);
			if (detaching) detach_dev(t1);
			if (detaching) detach_dev(br0);
			if (detaching) detach_dev(t2);
			if (detaching) detach_dev(br1);
			if (detaching) detach_dev(t3);
			if (detaching) detach_dev(pre0);
			if (detaching) detach_dev(t5);
			if (detaching) detach_dev(br2);
			if (detaching) detach_dev(t6);
			if (detaching) detach_dev(pre1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$l.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

class ContentHolder extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$l, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "ContentHolder",
			options,
			id: create_fragment$l.name
		});
	}
}

/* src/layouts/ListOfFeatures.svelte generated by Svelte v3.18.1 */

const file$l = "src/layouts/ListOfFeatures.svelte";

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[1] = list[i];
	return child_ctx;
}

// (23:4) {#each items as item}
function create_each_block$3(ctx) {
	let li;
	let h3;
	let t0_value = /*item*/ ctx[1].title + "";
	let t0;
	let t1;
	let p;
	let t2_value = /*item*/ ctx[1].text + "";
	let t2;
	let t3;
	let br;
	let t4;

	const block = {
		c: function create() {
			li = element("li");
			h3 = element("h3");
			t0 = text(t0_value);
			t1 = space();
			p = element("p");
			t2 = text(t2_value);
			t3 = space();
			br = element("br");
			t4 = space();
			this.h();
		},
		l: function claim(nodes) {
			li = claim_element(nodes, "LI", { class: true });
			var li_nodes = children(li);
			h3 = claim_element(li_nodes, "H3", { class: true });
			var h3_nodes = children(h3);
			t0 = claim_text(h3_nodes, t0_value);
			h3_nodes.forEach(detach_dev);
			t1 = claim_space(li_nodes);
			p = claim_element(li_nodes, "P", { class: true });
			var p_nodes = children(p);
			t2 = claim_text(p_nodes, t2_value);
			p_nodes.forEach(detach_dev);
			t3 = claim_space(li_nodes);
			br = claim_element(li_nodes, "BR", {});
			t4 = claim_space(li_nodes);
			li_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(h3, "class", "svelte-14memlh");
			add_location(h3, file$l, 24, 12, 806);
			attr_dev(p, "class", "svelte-14memlh");
			add_location(p, file$l, 25, 12, 840);
			add_location(br, file$l, 26, 12, 871);
			attr_dev(li, "class", "svelte-14memlh");
			add_location(li, file$l, 23, 8, 789);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			append_dev(li, h3);
			append_dev(h3, t0);
			append_dev(li, t1);
			append_dev(li, p);
			append_dev(p, t2);
			append_dev(li, t3);
			append_dev(li, br);
			append_dev(li, t4);
		},
		p: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$3.name,
		type: "each",
		source: "(23:4) {#each items as item}",
		ctx
	});

	return block;
}

function create_fragment$m(ctx) {
	let ul;
	let each_value = /*items*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			this.h();
		},
		l: function claim(nodes) {
			ul = claim_element(nodes, "UL", { class: true });
			var ul_nodes = children(ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].l(ul_nodes);
			}

			ul_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(ul, "class", "svelte-14memlh");
			add_location(ul, file$l, 21, 0, 750);
		},
		m: function mount(target, anchor) {
			insert_dev(target, ul, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*items*/ 1) {
				each_value = /*items*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(ul);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$m.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$j($$self) {
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

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		
	};

	return [items];
}

class ListOfFeatures extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$j, create_fragment$m, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "ListOfFeatures",
			options,
			id: create_fragment$m.name
		});
	}
}

/* src/routes/_icons.svelte generated by Svelte v3.18.1 */

const file$m = "src/routes/_icons.svelte";

function create_fragment$n(ctx) {
	let section;
	let svg;
	let symbol0;
	let path0;
	let symbol1;
	let g;
	let path1;
	let path2;
	let path3;
	let path4;

	const block = {
		c: function create() {
			section = element("section");
			svg = svg_element("svg");
			symbol0 = svg_element("symbol");
			path0 = svg_element("path");
			symbol1 = svg_element("symbol");
			g = svg_element("g");
			path1 = svg_element("path");
			path2 = svg_element("path");
			path3 = svg_element("path");
			path4 = svg_element("path");
			this.h();
		},
		l: function claim(nodes) {
			section = claim_element(nodes, "SECTION", {});
			var section_nodes = children(section);
			svg = claim_element(section_nodes, "svg", { style: true }, 1);
			var svg_nodes = children(svg);
			symbol0 = claim_element(svg_nodes, "symbol", { id: true, class: true, viewBox: true }, 1);
			var symbol0_nodes = children(symbol0);
			path0 = claim_element(symbol0_nodes, "path", { stroke: true, d: true }, 1);
			children(path0).forEach(detach_dev);
			symbol0_nodes.forEach(detach_dev);
			symbol1 = claim_element(svg_nodes, "symbol", { id: true, viewBox: true }, 1);
			var symbol1_nodes = children(symbol1);
			g = claim_element(symbol1_nodes, "g", { transform: true }, 1);
			var g_nodes = children(g);
			path1 = claim_element(g_nodes, "path", { d: true }, 1);
			children(path1).forEach(detach_dev);
			path2 = claim_element(g_nodes, "path", { d: true }, 1);
			children(path2).forEach(detach_dev);
			path3 = claim_element(g_nodes, "path", { d: true }, 1);
			children(path3).forEach(detach_dev);
			path4 = claim_element(g_nodes, "path", { d: true }, 1);
			children(path4).forEach(detach_dev);
			g_nodes.forEach(detach_dev);
			symbol1_nodes.forEach(detach_dev);
			svg_nodes.forEach(detach_dev);
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(path0, "stroke", "none");
			attr_dev(path0, "d", "M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2\n\tc6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z");
			add_location(path0, file$m, 5, 12, 176);
			attr_dev(symbol0, "id", "ico-heart-filled");
			attr_dev(symbol0, "class", "ico-heart-filled");
			attr_dev(symbol0, "viewBox", "0 0 32 29.6");
			add_location(symbol0, file$m, 4, 8, 86);
			attr_dev(path1, "d", "M7280 10683 c122 -106 456 -448 564 -578 826 -994 1265 -2198 1266 -3465 0 -1147 -384 -2295 -1075 -3215 -295 -393 -683 -779 -1075 -1073 -800 -599 -1791 -976 -2760 -1052 -80 -6 -167 -14 -193 -18 l-49 -7 114 -91 c1044 -834 2358 -1254 3671 -1173 1734 106 3304 1033 4227 2494 347 549 599 1177 724 1805 76 381 99 618 100 1040 1 363 -7 488 -49 780 -186 1284 -817 2442 -1795 3295 -973 850 -2226 1315 -3535 1315 l-200 -1 65 -56z");
			add_location(path1, file$m, 12, 16, 535);
			attr_dev(path2, "d", "M4371 8892 c-62 -116 -98 -172 -109 -172 -39 -1 -354 -38 -358 -43 -3 -3 53 -66 125 -141 72 -75 131 -139 131 -143 -1 -5 -18 -90 -39 -190 -21 -101 -37 -183 -35 -183 3 0 79 36 171 80 91 44 171 80 177 80 6 0 84 -43 174 -94 89 -52 162 -88 162 -82 0 7 -11 93 -25 192 -14 98 -25 180 -25 181 0 1 64 59 141 129 119 108 139 129 123 136 -11 4 -95 21 -188 38 -93 16 -170 31 -171 32 -1 2 -33 71 -70 153 -37 83 -73 161 -80 174 -12 23 -17 15 -104 -147z");
			add_location(path2, file$m, 13, 16, 982);
			attr_dev(path3, "d", "M610 8054 c-74 -102 -137 -190 -140 -194 -3 -5 -107 24 -230 64 -124 40 -227 72 -229 70 -2 -2 56 -85 128 -184 73 -100 135 -188 138 -195 3 -8 -52 -92 -124 -192 -71 -98 -133 -184 -138 -192 -9 -16 -23 -20 237 65 109 35 202 64 206 64 5 0 71 -86 148 -192 l139 -192 3 241 2 240 225 73 c123 41 222 76 219 79 -3 3 -103 38 -222 76 l-217 71 -5 242 -5 242 -135 -186z");
			add_location(path3, file$m, 14, 16, 1447);
			attr_dev(path4, "d", "M4415 6023 c-126 -157 -233 -290 -237 -296 -6 -10 -94 21 -568 202 -85 32 -156 57 -158 56 -1 -1 25 -45 59 -96 77 -116 342 -520 352 -536 4 -7 -90 -132 -233 -309 -131 -164 -238 -299 -237 -301 2 -1 168 43 371 99 222 60 371 97 375 91 160 -247 415 -632 417 -631 1 2 10 174 20 383 9 209 18 381 18 382 1 1 161 45 356 98 195 54 361 100 368 104 8 5 -47 30 -140 65 -84 32 -243 92 -353 134 -110 41 -202 77 -204 78 -2 2 4 167 14 366 9 200 16 371 14 380 -3 11 -86 -86 -234 -269z");
			add_location(path4, file$m, 15, 16, 1829);
			attr_dev(g, "transform", "translate(0.000000,1074.000000) scale(0.100000,-0.100000)");
			add_location(g, file$m, 11, 12, 445);
			attr_dev(symbol1, "id", "ico-moon");
			attr_dev(symbol1, "viewBox", "0 0 1280.000000 1074.000000");
			add_location(symbol1, file$m, 10, 8, 372);
			set_style(svg, "display", "none");
			add_location(svg, file$m, 1, 4, 14);
			add_location(section, file$m, 0, 0, 0);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			append_dev(section, svg);
			append_dev(svg, symbol0);
			append_dev(symbol0, path0);
			append_dev(svg, symbol1);
			append_dev(symbol1, g);
			append_dev(g, path1);
			append_dev(g, path2);
			append_dev(g, path3);
			append_dev(g, path4);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$n.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

class Icons extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$n, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Icons",
			options,
			id: create_fragment$n.name
		});
	}
}

/* src/routes/_layout.svelte generated by Svelte v3.18.1 */
const file$n = "src/routes/_layout.svelte";

function create_fragment$o(ctx) {
	let t0;
	let t1;
	let main;
	let current;

	const header = new Header({
			props: { segment: /*segment*/ ctx[0] },
			$$inline: true
		});

	const icons = new Icons({ $$inline: true });
	const default_slot_template = /*$$slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	const block = {
		c: function create() {
			create_component(header.$$.fragment);
			t0 = space();
			create_component(icons.$$.fragment);
			t1 = space();
			main = element("main");
			if (default_slot) default_slot.c();
			this.h();
		},
		l: function claim(nodes) {
			claim_component(header.$$.fragment, nodes);
			t0 = claim_space(nodes);
			claim_component(icons.$$.fragment, nodes);
			t1 = claim_space(nodes);
			main = claim_element(nodes, "MAIN", { id: true });
			var main_nodes = children(main);
			if (default_slot) default_slot.l(main_nodes);
			main_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(main, "id", "main");
			add_location(main, file$n, 15, 0, 168);
		},
		m: function mount(target, anchor) {
			mount_component(header, target, anchor);
			insert_dev(target, t0, anchor);
			mount_component(icons, target, anchor);
			insert_dev(target, t1, anchor);
			insert_dev(target, main, anchor);

			if (default_slot) {
				default_slot.m(main, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*segment*/ 1) header_changes.segment = /*segment*/ ctx[0];
			header.$set(header_changes);

			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(header.$$.fragment, local);
			transition_in(icons.$$.fragment, local);
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(header.$$.fragment, local);
			transition_out(icons.$$.fragment, local);
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(header, detaching);
			if (detaching) detach_dev(t0);
			destroy_component(icons, detaching);
			if (detaching) detach_dev(t1);
			if (detaching) detach_dev(main);
			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$o.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$k($$self, $$props, $$invalidate) {
	let { segment } = $$props;
	const writable_props = ["segment"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("segment" in $$props) $$invalidate(0, segment = $$props.segment);
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => {
		return { segment };
	};

	$$self.$inject_state = $$props => {
		if ("segment" in $$props) $$invalidate(0, segment = $$props.segment);
	};

	return [segment, $$scope, $$slots];
}

class Layout extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$k, create_fragment$o, safe_not_equal, { segment: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Layout",
			options,
			id: create_fragment$o.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*segment*/ ctx[0] === undefined && !("segment" in props)) {
			console.warn("<Layout> was created without expected prop 'segment'");
		}
	}

	get segment() {
		throw new Error("<Layout>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set segment(value) {
		throw new Error("<Layout>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/routes/_error.svelte generated by Svelte v3.18.1 */

const { Error: Error_1 } = globals;
const file$o = "src/routes/_error.svelte";

// (24:0) {#if dev && error.stack}
function create_if_block$5(ctx) {
	let pre;
	let t_value = /*error*/ ctx[1].stack + "";
	let t;

	const block = {
		c: function create() {
			pre = element("pre");
			t = text(t_value);
			this.h();
		},
		l: function claim(nodes) {
			pre = claim_element(nodes, "PRE", {});
			var pre_nodes = children(pre);
			t = claim_text(pre_nodes, t_value);
			pre_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			add_location(pre, file$o, 24, 1, 343);
		},
		m: function mount(target, anchor) {
			insert_dev(target, pre, anchor);
			append_dev(pre, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*error*/ 2 && t_value !== (t_value = /*error*/ ctx[1].stack + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(pre);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$5.name,
		type: "if",
		source: "(24:0) {#if dev && error.stack}",
		ctx
	});

	return block;
}

function create_fragment$p(ctx) {
	let title_value;
	let t0;
	let br0;
	let t1;
	let br1;
	let t2;
	let br2;
	let t3;
	let br3;
	let t4;
	let h1;
	let t5;
	let t6;
	let t7;
	let br4;
	let t8;
	let p;
	let t9;
	let t10_value = /*error*/ ctx[1].message + "";
	let t10;
	let t11;
	let br5;
	let t12;
	let br6;
	let t13;
	let if_block_anchor;
	document.title = title_value = "Error: " + /*status*/ ctx[0];
	let if_block = /*dev*/ ctx[2] && /*error*/ ctx[1].stack && create_if_block$5(ctx);

	const block = {
		c: function create() {
			t0 = space();
			br0 = element("br");
			t1 = space();
			br1 = element("br");
			t2 = space();
			br2 = element("br");
			t3 = space();
			br3 = element("br");
			t4 = space();
			h1 = element("h1");
			t5 = text("Error: ");
			t6 = text(/*status*/ ctx[0]);
			t7 = space();
			br4 = element("br");
			t8 = space();
			p = element("p");
			t9 = text("Reason: ");
			t10 = text(t10_value);
			t11 = space();
			br5 = element("br");
			t12 = space();
			br6 = element("br");
			t13 = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
			this.h();
		},
		l: function claim(nodes) {
			const head_nodes = query_selector_all("[data-svelte=\"svelte-oxohxa\"]", document.head);
			head_nodes.forEach(detach_dev);
			t0 = claim_space(nodes);
			br0 = claim_element(nodes, "BR", {});
			t1 = claim_space(nodes);
			br1 = claim_element(nodes, "BR", {});
			t2 = claim_space(nodes);
			br2 = claim_element(nodes, "BR", {});
			t3 = claim_space(nodes);
			br3 = claim_element(nodes, "BR", {});
			t4 = claim_space(nodes);
			h1 = claim_element(nodes, "H1", { class: true });
			var h1_nodes = children(h1);
			t5 = claim_text(h1_nodes, "Error: ");
			t6 = claim_text(h1_nodes, /*status*/ ctx[0]);
			h1_nodes.forEach(detach_dev);
			t7 = claim_space(nodes);
			br4 = claim_element(nodes, "BR", {});
			t8 = claim_space(nodes);
			p = claim_element(nodes, "P", { class: true });
			var p_nodes = children(p);
			t9 = claim_text(p_nodes, "Reason: ");
			t10 = claim_text(p_nodes, t10_value);
			p_nodes.forEach(detach_dev);
			t11 = claim_space(nodes);
			br5 = claim_element(nodes, "BR", {});
			t12 = claim_space(nodes);
			br6 = claim_element(nodes, "BR", {});
			t13 = claim_space(nodes);
			if (if_block) if_block.l(nodes);
			if_block_anchor = empty();
			this.h();
		},
		h: function hydrate() {
			add_location(br0, file$o, 14, 0, 186);
			add_location(br1, file$o, 15, 0, 191);
			add_location(br2, file$o, 16, 0, 196);
			add_location(br3, file$o, 17, 0, 201);
			attr_dev(h1, "class", "text-center");
			add_location(h1, file$o, 18, 0, 206);
			add_location(br4, file$o, 19, 0, 251);
			attr_dev(p, "class", "text-center");
			add_location(p, file$o, 20, 0, 256);
			add_location(br5, file$o, 21, 0, 307);
			add_location(br6, file$o, 22, 0, 312);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, br0, anchor);
			insert_dev(target, t1, anchor);
			insert_dev(target, br1, anchor);
			insert_dev(target, t2, anchor);
			insert_dev(target, br2, anchor);
			insert_dev(target, t3, anchor);
			insert_dev(target, br3, anchor);
			insert_dev(target, t4, anchor);
			insert_dev(target, h1, anchor);
			append_dev(h1, t5);
			append_dev(h1, t6);
			insert_dev(target, t7, anchor);
			insert_dev(target, br4, anchor);
			insert_dev(target, t8, anchor);
			insert_dev(target, p, anchor);
			append_dev(p, t9);
			append_dev(p, t10);
			insert_dev(target, t11, anchor);
			insert_dev(target, br5, anchor);
			insert_dev(target, t12, anchor);
			insert_dev(target, br6, anchor);
			insert_dev(target, t13, anchor);
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*status*/ 1 && title_value !== (title_value = "Error: " + /*status*/ ctx[0])) {
				document.title = title_value;
			}

			if (dirty & /*status*/ 1) set_data_dev(t6, /*status*/ ctx[0]);
			if (dirty & /*error*/ 2 && t10_value !== (t10_value = /*error*/ ctx[1].message + "")) set_data_dev(t10, t10_value);

			if (/*dev*/ ctx[2] && /*error*/ ctx[1].stack) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$5(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(br0);
			if (detaching) detach_dev(t1);
			if (detaching) detach_dev(br1);
			if (detaching) detach_dev(t2);
			if (detaching) detach_dev(br2);
			if (detaching) detach_dev(t3);
			if (detaching) detach_dev(br3);
			if (detaching) detach_dev(t4);
			if (detaching) detach_dev(h1);
			if (detaching) detach_dev(t7);
			if (detaching) detach_dev(br4);
			if (detaching) detach_dev(t8);
			if (detaching) detach_dev(p);
			if (detaching) detach_dev(t11);
			if (detaching) detach_dev(br5);
			if (detaching) detach_dev(t12);
			if (detaching) detach_dev(br6);
			if (detaching) detach_dev(t13);
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$p.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$l($$self, $$props, $$invalidate) {
	let { status } = $$props;
	let { error } = $$props;
	const dev = "development" === "development";
	const writable_props = ["status", "error"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("status" in $$props) $$invalidate(0, status = $$props.status);
		if ("error" in $$props) $$invalidate(1, error = $$props.error);
	};

	$$self.$capture_state = () => {
		return { status, error };
	};

	$$self.$inject_state = $$props => {
		if ("status" in $$props) $$invalidate(0, status = $$props.status);
		if ("error" in $$props) $$invalidate(1, error = $$props.error);
	};

	return [status, error, dev];
}

class Error$1 extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$l, create_fragment$p, safe_not_equal, { status: 0, error: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Error",
			options,
			id: create_fragment$p.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*status*/ ctx[0] === undefined && !("status" in props)) {
			console.warn("<Error> was created without expected prop 'status'");
		}

		if (/*error*/ ctx[1] === undefined && !("error" in props)) {
			console.warn("<Error> was created without expected prop 'error'");
		}
	}

	get status() {
		throw new Error_1("<Error>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set status(value) {
		throw new Error_1("<Error>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get error() {
		throw new Error_1("<Error>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set error(value) {
		throw new Error_1("<Error>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/node_modules/@sapper/internal/App.svelte generated by Svelte v3.18.1 */

const { Error: Error_1$1 } = globals;

// (22:1) {:else}
function create_else_block$3(ctx) {
	let switch_instance_anchor;
	let current;
	const switch_instance_spread_levels = [{ segment: /*segments*/ ctx[2][1] }, /*level1*/ ctx[4].props];
	var switch_value = /*level1*/ ctx[4].component;

	function switch_props(ctx) {
		let switch_instance_props = {
			$$slots: { default: [create_default_slot_1$2] },
			$$scope: { ctx }
		};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return {
			props: switch_instance_props,
			$$inline: true
		};
	}

	if (switch_value) {
		var switch_instance = new switch_value(switch_props(ctx));
	}

	const block = {
		c: function create() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		l: function claim(nodes) {
			if (switch_instance) claim_component(switch_instance.$$.fragment, nodes);
			switch_instance_anchor = empty();
		},
		m: function mount(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert_dev(target, switch_instance_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const switch_instance_changes = (dirty & /*segments, level1*/ 20)
			? get_spread_update(switch_instance_spread_levels, [
					dirty & /*segments*/ 4 && { segment: /*segments*/ ctx[2][1] },
					dirty & /*level1*/ 16 && get_spread_object(/*level1*/ ctx[4].props)
				])
			: {};

			if (dirty & /*$$scope, level2*/ 160) {
				switch_instance_changes.$$scope = { dirty, ctx };
			}

			if (switch_value !== (switch_value = /*level1*/ ctx[4].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i: function intro(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$3.name,
		type: "else",
		source: "(22:1) {:else}",
		ctx
	});

	return block;
}

// (20:1) {#if error}
function create_if_block$6(ctx) {
	let current;

	const error_1 = new Error$1({
			props: {
				error: /*error*/ ctx[0],
				status: /*status*/ ctx[1]
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(error_1.$$.fragment);
		},
		l: function claim(nodes) {
			claim_component(error_1.$$.fragment, nodes);
		},
		m: function mount(target, anchor) {
			mount_component(error_1, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const error_1_changes = {};
			if (dirty & /*error*/ 1) error_1_changes.error = /*error*/ ctx[0];
			if (dirty & /*status*/ 2) error_1_changes.status = /*status*/ ctx[1];
			error_1.$set(error_1_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(error_1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(error_1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(error_1, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$6.name,
		type: "if",
		source: "(20:1) {#if error}",
		ctx
	});

	return block;
}

// (24:3) {#if level2}
function create_if_block_1$1(ctx) {
	let switch_instance_anchor;
	let current;
	const switch_instance_spread_levels = [/*level2*/ ctx[5].props];
	var switch_value = /*level2*/ ctx[5].component;

	function switch_props(ctx) {
		let switch_instance_props = {};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return {
			props: switch_instance_props,
			$$inline: true
		};
	}

	if (switch_value) {
		var switch_instance = new switch_value(switch_props());
	}

	const block = {
		c: function create() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		l: function claim(nodes) {
			if (switch_instance) claim_component(switch_instance.$$.fragment, nodes);
			switch_instance_anchor = empty();
		},
		m: function mount(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert_dev(target, switch_instance_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const switch_instance_changes = (dirty & /*level2*/ 32)
			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*level2*/ ctx[5].props)])
			: {};

			if (switch_value !== (switch_value = /*level2*/ ctx[5].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i: function intro(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$1.name,
		type: "if",
		source: "(24:3) {#if level2}",
		ctx
	});

	return block;
}

// (23:2) <svelte:component this="{level1.component}" segment="{segments[1]}" {...level1.props}>
function create_default_slot_1$2(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*level2*/ ctx[5] && create_if_block_1$1(ctx);

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			if (if_block) if_block.l(nodes);
			if_block_anchor = empty();
		},
		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			if (/*level2*/ ctx[5]) {
				if (if_block) {
					if_block.p(ctx, dirty);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block_1$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_1$2.name,
		type: "slot",
		source: "(23:2) <svelte:component this=\\\"{level1.component}\\\" segment=\\\"{segments[1]}\\\" {...level1.props}>",
		ctx
	});

	return block;
}

// (19:0) <Layout segment="{segments[0]}" {...level0.props}>
function create_default_slot$2(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$6, create_else_block$3];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*error*/ ctx[0]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			if_block.l(nodes);
			if_block_anchor = empty();
		},
		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$2.name,
		type: "slot",
		source: "(19:0) <Layout segment=\\\"{segments[0]}\\\" {...level0.props}>",
		ctx
	});

	return block;
}

function create_fragment$q(ctx) {
	let current;
	const layout_spread_levels = [{ segment: /*segments*/ ctx[2][0] }, /*level0*/ ctx[3].props];

	let layout_props = {
		$$slots: { default: [create_default_slot$2] },
		$$scope: { ctx }
	};

	for (let i = 0; i < layout_spread_levels.length; i += 1) {
		layout_props = assign(layout_props, layout_spread_levels[i]);
	}

	const layout = new Layout({ props: layout_props, $$inline: true });

	const block = {
		c: function create() {
			create_component(layout.$$.fragment);
		},
		l: function claim(nodes) {
			claim_component(layout.$$.fragment, nodes);
		},
		m: function mount(target, anchor) {
			mount_component(layout, target, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const layout_changes = (dirty & /*segments, level0*/ 12)
			? get_spread_update(layout_spread_levels, [
					dirty & /*segments*/ 4 && { segment: /*segments*/ ctx[2][0] },
					dirty & /*level0*/ 8 && get_spread_object(/*level0*/ ctx[3].props)
				])
			: {};

			if (dirty & /*$$scope, error, status, level1, segments, level2*/ 183) {
				layout_changes.$$scope = { dirty, ctx };
			}

			layout.$set(layout_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(layout.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(layout.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(layout, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$q.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$m($$self, $$props, $$invalidate) {
	let { stores } = $$props;
	let { error } = $$props;
	let { status } = $$props;
	let { segments } = $$props;
	let { level0 } = $$props;
	let { level1 = null } = $$props;
	let { level2 = null } = $$props;
	setContext(CONTEXT_KEY, stores);
	const writable_props = ["stores", "error", "status", "segments", "level0", "level1", "level2"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("stores" in $$props) $$invalidate(6, stores = $$props.stores);
		if ("error" in $$props) $$invalidate(0, error = $$props.error);
		if ("status" in $$props) $$invalidate(1, status = $$props.status);
		if ("segments" in $$props) $$invalidate(2, segments = $$props.segments);
		if ("level0" in $$props) $$invalidate(3, level0 = $$props.level0);
		if ("level1" in $$props) $$invalidate(4, level1 = $$props.level1);
		if ("level2" in $$props) $$invalidate(5, level2 = $$props.level2);
	};

	$$self.$capture_state = () => {
		return {
			stores,
			error,
			status,
			segments,
			level0,
			level1,
			level2
		};
	};

	$$self.$inject_state = $$props => {
		if ("stores" in $$props) $$invalidate(6, stores = $$props.stores);
		if ("error" in $$props) $$invalidate(0, error = $$props.error);
		if ("status" in $$props) $$invalidate(1, status = $$props.status);
		if ("segments" in $$props) $$invalidate(2, segments = $$props.segments);
		if ("level0" in $$props) $$invalidate(3, level0 = $$props.level0);
		if ("level1" in $$props) $$invalidate(4, level1 = $$props.level1);
		if ("level2" in $$props) $$invalidate(5, level2 = $$props.level2);
	};

	return [error, status, segments, level0, level1, level2, stores];
}

class App extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$m, create_fragment$q, safe_not_equal, {
			stores: 6,
			error: 0,
			status: 1,
			segments: 2,
			level0: 3,
			level1: 4,
			level2: 5
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "App",
			options,
			id: create_fragment$q.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*stores*/ ctx[6] === undefined && !("stores" in props)) {
			console.warn("<App> was created without expected prop 'stores'");
		}

		if (/*error*/ ctx[0] === undefined && !("error" in props)) {
			console.warn("<App> was created without expected prop 'error'");
		}

		if (/*status*/ ctx[1] === undefined && !("status" in props)) {
			console.warn("<App> was created without expected prop 'status'");
		}

		if (/*segments*/ ctx[2] === undefined && !("segments" in props)) {
			console.warn("<App> was created without expected prop 'segments'");
		}

		if (/*level0*/ ctx[3] === undefined && !("level0" in props)) {
			console.warn("<App> was created without expected prop 'level0'");
		}
	}

	get stores() {
		throw new Error_1$1("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set stores(value) {
		throw new Error_1$1("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get error() {
		throw new Error_1$1("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set error(value) {
		throw new Error_1$1("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get status() {
		throw new Error_1$1("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set status(value) {
		throw new Error_1$1("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get segments() {
		throw new Error_1$1("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set segments(value) {
		throw new Error_1$1("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get level0() {
		throw new Error_1$1("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set level0(value) {
		throw new Error_1$1("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get level1() {
		throw new Error_1$1("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set level1(value) {
		throw new Error_1$1("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get level2() {
		throw new Error_1$1("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set level2(value) {
		throw new Error_1$1("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

// This file is generated by Sapper — do not edit it!

const ignore = [];

const components = [
	{
		js: () => import('./index.664cd83f.js'),
		css: ["index.664cd83f.css","client.b0361f7d.css"]
	},
	{
		js: () => import('./organization.6c08fe74.js'),
		css: ["organization.6c08fe74.css","client.b0361f7d.css"]
	},
	{
		js: () => import('./charity.987145cf.js'),
		css: ["charity.987145cf.css","client.b0361f7d.css"]
	},
	{
		js: () => import('./_layout.7bd80009.js'),
		css: ["_layout.7bd80009.css","client.b0361f7d.css"]
	},
	{
		js: () => import('./index.02aefda4.js'),
		css: ["client.b0361f7d.css"]
	},
	{
		js: () => import('./organizations.d3640e12.js'),
		css: ["client.b0361f7d.css"]
	},
	{
		js: () => import('./charities.4937ed63.js'),
		css: ["client.b0361f7d.css"]
	},
	{
		js: () => import('./map.d6819d50.js'),
		css: ["client.b0361f7d.css"]
	}
];

const routes = [
	{
		// index.svelte
		pattern: /^\/$/,
		parts: [
			{ i: 0 }
		]
	},

	{
		// organization.svelte
		pattern: /^\/organization\/?$/,
		parts: [
			{ i: 1 }
		]
	},

	{
		// charity.svelte
		pattern: /^\/charity\/?$/,
		parts: [
			{ i: 2 }
		]
	},

	{
		// lists/index.svelte
		pattern: /^\/lists\/?$/,
		parts: [
			{ i: 3 },
			{ i: 4 }
		]
	},

	{
		// lists/organizations.svelte
		pattern: /^\/lists\/organizations\/?$/,
		parts: [
			{ i: 3 },
			{ i: 5 }
		]
	},

	{
		// lists/charities.svelte
		pattern: /^\/lists\/charities\/?$/,
		parts: [
			{ i: 3 },
			{ i: 6 }
		]
	},

	{
		// map.svelte
		pattern: /^\/map\/?$/,
		parts: [
			{ i: 7 }
		]
	}
];

function goto(href, opts = { replaceState: false }) {
	const target = select_target(new URL(href, document.baseURI));

	if (target) {
		_history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
		return navigate(target, null).then(() => {});
	}

	location.href = href;
	return new Promise(f => {}); // never resolves
}

const initial_data = typeof __SAPPER__ !== 'undefined' && __SAPPER__;

let ready = false;
let root_component;
let current_token;
let root_preloaded;
let current_branch = [];
let current_query = '{}';

const stores = {
	page: writable({}),
	preloading: writable(null),
	session: writable(initial_data && initial_data.session)
};

let $session;
let session_dirty;

stores.session.subscribe(async value => {
	$session = value;

	if (!ready) return;
	session_dirty = true;

	const target = select_target(new URL(location.href));

	const token = current_token = {};
	const { redirect, props, branch } = await hydrate_target(target);
	if (token !== current_token) return; // a secondary navigation happened while we were loading

	await render(redirect, branch, props, target.page);
});

let prefetching


 = null;
function set_prefetching(href, promise) {
	prefetching = { href, promise };
}

let target;
function set_target(element) {
	target = element;
}

let uid = 1;
function set_uid(n) {
	uid = n;
}

let cid;
function set_cid(n) {
	cid = n;
}

const _history = typeof history !== 'undefined' ? history : {
	pushState: (state, title, href) => {},
	replaceState: (state, title, href) => {},
	scrollRestoration: ''
};

const scroll_history = {};

function extract_query(search) {
	const query = Object.create(null);
	if (search.length > 0) {
		search.slice(1).split('&').forEach(searchParam => {
			let [, key, value = ''] = /([^=]*)(?:=(.*))?/.exec(decodeURIComponent(searchParam.replace(/\+/g, ' ')));
			if (typeof query[key] === 'string') query[key] = [query[key]];
			if (typeof query[key] === 'object') (query[key] ).push(value);
			else query[key] = value;
		});
	}
	return query;
}

function select_target(url) {
	if (url.origin !== location.origin) return null;
	if (!url.pathname.startsWith(initial_data.baseUrl)) return null;

	let path = url.pathname.slice(initial_data.baseUrl.length);

	if (path === '') {
		path = '/';
	}

	// avoid accidental clashes between server routes and page routes
	if (ignore.some(pattern => pattern.test(path))) return;

	for (let i = 0; i < routes.length; i += 1) {
		const route = routes[i];

		const match = route.pattern.exec(path);

		if (match) {
			const query = extract_query(url.search);
			const part = route.parts[route.parts.length - 1];
			const params = part.params ? part.params(match) : {};

			const page = { host: location.host, path, query, params };

			return { href: url.href, route, match, page };
		}
	}
}

function handle_error(url) {
	const { host, pathname, search } = location;
	const { session, preloaded, status, error } = initial_data;

	if (!root_preloaded) {
		root_preloaded = preloaded && preloaded[0];
	}

	const props = {
		error,
		status,
		session,
		level0: {
			props: root_preloaded
		},
		level1: {
			props: {
				status,
				error
			},
			component: Error$1
		},
		segments: preloaded

	};
	const query = extract_query(search);
	render(null, [], props, { host, path: pathname, query, params: {} });
}

function scroll_state() {
	return {
		x: pageXOffset,
		y: pageYOffset
	};
}

async function navigate(target, id, noscroll, hash) {
	if (id) {
		// popstate or initial navigation
		cid = id;
	} else {
		const current_scroll = scroll_state();

		// clicked on a link. preserve scroll state
		scroll_history[cid] = current_scroll;

		id = cid = ++uid;
		scroll_history[cid] = noscroll ? current_scroll : { x: 0, y: 0 };
	}

	cid = id;

	if (root_component) stores.preloading.set(true);

	const loaded = prefetching && prefetching.href === target.href ?
		prefetching.promise :
		hydrate_target(target);

	prefetching = null;

	const token = current_token = {};
	const { redirect, props, branch } = await loaded;
	if (token !== current_token) return; // a secondary navigation happened while we were loading

	await render(redirect, branch, props, target.page);
	if (document.activeElement) document.activeElement.blur();

	if (!noscroll) {
		let scroll = scroll_history[id];

		if (hash) {
			// scroll is an element id (from a hash), we need to compute y.
			const deep_linked = document.getElementById(hash.slice(1));

			if (deep_linked) {
				scroll = {
					x: 0,
					y: deep_linked.getBoundingClientRect().top
				};
			}
		}

		scroll_history[cid] = scroll;
		if (scroll) scrollTo(scroll.x, scroll.y);
	}
}

async function render(redirect, branch, props, page) {
	if (redirect) return goto(redirect.location, { replaceState: true });

	stores.page.set(page);
	stores.preloading.set(false);

	if (root_component) {
		root_component.$set(props);
	} else {
		props.stores = {
			page: { subscribe: stores.page.subscribe },
			preloading: { subscribe: stores.preloading.subscribe },
			session: stores.session
		};
		props.level0 = {
			props: await root_preloaded
		};

		// first load — remove SSR'd <head> contents
		const start = document.querySelector('#sapper-head-start');
		const end = document.querySelector('#sapper-head-end');

		if (start && end) {
			while (start.nextSibling !== end) detach$1(start.nextSibling);
			detach$1(start);
			detach$1(end);
		}

		root_component = new App({
			target,
			props,
			hydrate: true
		});
	}

	current_branch = branch;
	current_query = JSON.stringify(page.query);
	ready = true;
	session_dirty = false;
}

function part_changed(i, segment, match, stringified_query) {
	// TODO only check query string changes for preload functions
	// that do in fact depend on it (using static analysis or
	// runtime instrumentation)
	if (stringified_query !== current_query) return true;

	const previous = current_branch[i];

	if (!previous) return false;
	if (segment !== previous.segment) return true;
	if (previous.match) {
		if (JSON.stringify(previous.match.slice(1, i + 2)) !== JSON.stringify(match.slice(1, i + 2))) {
			return true;
		}
	}
}

async function hydrate_target(target)



 {
	const { route, page } = target;
	const segments = page.path.split('/').filter(Boolean);

	let redirect = null;

	const props = { error: null, status: 200, segments: [segments[0]] };

	const preload_context = {
		fetch: (url, opts) => fetch(url, opts),
		redirect: (statusCode, location) => {
			if (redirect && (redirect.statusCode !== statusCode || redirect.location !== location)) {
				throw new Error(`Conflicting redirects`);
			}
			redirect = { statusCode, location };
		},
		error: (status, error) => {
			props.error = typeof error === 'string' ? new Error(error) : error;
			props.status = status;
		}
	};

	if (!root_preloaded) {
		root_preloaded = initial_data.preloaded[0] || preload.call(preload_context, {
			host: page.host,
			path: page.path,
			query: page.query,
			params: {}
		}, $session);
	}

	let branch;
	let l = 1;

	try {
		const stringified_query = JSON.stringify(page.query);
		const match = route.pattern.exec(page.path);

		let segment_dirty = false;

		branch = await Promise.all(route.parts.map(async (part, i) => {
			const segment = segments[i];

			if (part_changed(i, segment, match, stringified_query)) segment_dirty = true;

			props.segments[l] = segments[i + 1]; // TODO make this less confusing
			if (!part) return { segment };

			const j = l++;

			if (!session_dirty && !segment_dirty && current_branch[i] && current_branch[i].part === part.i) {
				return current_branch[i];
			}

			segment_dirty = false;

			const { default: component, preload } = await load_component(components[part.i]);

			let preloaded;
			if (ready || !initial_data.preloaded[i + 1]) {
				preloaded = preload
					? await preload.call(preload_context, {
						host: page.host,
						path: page.path,
						query: page.query,
						params: part.params ? part.params(target.match) : {}
					}, $session)
					: {};
			} else {
				preloaded = initial_data.preloaded[i + 1];
			}

			return (props[`level${j}`] = { component, props: preloaded, segment, match, part: part.i });
		}));
	} catch (error) {
		props.error = error;
		props.status = 500;
		branch = [];
	}

	return { redirect, props, branch };
}

function load_css(chunk) {
	const href = `client/${chunk}`;
	if (document.querySelector(`link[href="${href}"]`)) return;

	return new Promise((fulfil, reject) => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;

		link.onload = () => fulfil();
		link.onerror = reject;

		document.head.appendChild(link);
	});
}

function load_component(component)


 {
	// TODO this is temporary — once placeholders are
	// always rewritten, scratch the ternary
	const promises = (typeof component.css === 'string' ? [] : component.css.map(load_css));
	promises.unshift(component.js());
	return Promise.all(promises).then(values => values[0]);
}

function detach$1(node) {
	node.parentNode.removeChild(node);
}

function prefetch(href) {
	const target = select_target(new URL(href, document.baseURI));

	if (target) {
		if (!prefetching || href !== prefetching.href) {
			set_prefetching(href, hydrate_target(target));
		}

		return prefetching.promise;
	}
}

function start(opts

) {
	if ('scrollRestoration' in _history) {
		_history.scrollRestoration = 'manual';
	}

	set_target(opts.target);

	addEventListener('click', handle_click);
	addEventListener('popstate', handle_popstate);

	// prefetch
	addEventListener('touchstart', trigger_prefetch);
	addEventListener('mousemove', handle_mousemove);

	return Promise.resolve().then(() => {
		const { hash, href } = location;

		_history.replaceState({ id: uid }, '', href);

		const url = new URL(location.href);

		if (initial_data.error) return handle_error();

		const target = select_target(url);
		if (target) return navigate(target, uid, true, hash);
	});
}

let mousemove_timeout;

function handle_mousemove(event) {
	clearTimeout(mousemove_timeout);
	mousemove_timeout = setTimeout(() => {
		trigger_prefetch(event);
	}, 20);
}

function trigger_prefetch(event) {
	const a = find_anchor(event.target);
	if (!a || a.rel !== 'prefetch') return;

	prefetch(a.href);
}

function handle_click(event) {
	// Adapted from https://github.com/visionmedia/page.js
	// MIT license https://github.com/visionmedia/page.js#license
	if (which(event) !== 1) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey) return;
	if (event.defaultPrevented) return;

	const a = find_anchor(event.target);
	if (!a) return;

	if (!a.href) return;

	// check if link is inside an svg
	// in this case, both href and target are always inside an object
	const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
	const href = String(svg ? (a).href.baseVal : a.href);

	if (href === location.href) {
		if (!location.hash) event.preventDefault();
		return;
	}

	// Ignore if tag has
	// 1. 'download' attribute
	// 2. rel='external' attribute
	if (a.hasAttribute('download') || a.getAttribute('rel') === 'external') return;

	// Ignore if <a> has a target
	if (svg ? (a).target.baseVal : a.target) return;

	const url = new URL(href);

	// Don't handle hash changes
	if (url.pathname === location.pathname && url.search === location.search) return;

	const target = select_target(url);
	if (target) {
		const noscroll = a.hasAttribute('sapper-noscroll');
		navigate(target, null, noscroll, url.hash);
		event.preventDefault();
		_history.pushState({ id: cid }, '', url.href);
	}
}

function which(event) {
	return event.which === null ? event.button : event.which;
}

function find_anchor(node) {
	while (node && node.nodeName.toUpperCase() !== 'A') node = node.parentNode; // SVG <a> elements have a lowercase name
	return node;
}

function handle_popstate(event) {
	scroll_history[cid] = scroll_state();

	if (event.state) {
		const url = new URL(location.href);
		const target = select_target(url);
		if (target) {
			navigate(target, event.state.id);
		} else {
			location.href = location.href;
		}
	} else {
		// hashchange
		set_uid(uid + 1);
		set_cid(uid);
		_history.replaceState({ id: cid }, '', location.href);
	}
}

start({
	target: document.querySelector('#sapper')
});

export { set_style as A, createCommonjsModule as B, Carousel as C, Divider as D, unwrapExports as E, Footer as F, DonatingGroup as G, AvatarAndName as H, onMount as I, SearchLine as J, create_slot as K, ListOfFeatures as L, toggle_class as M, get_slot_context as N, get_slot_changes as O, Progress as P, ListItems as Q, Rate as R, SvelteComponentDev as S, TitleSubTitle as T, Map$1 as U, MapMarker as V, empty as W, group_outros as X, check_outros as Y, destroy_each as Z, ContentHolder as a, CharityCards as b, Comment as c, dispatch_dev as d, space as e, element as f, create_component as g, detach_dev as h, init as i, claim_space as j, claim_element as k, children as l, claim_component as m, claim_text as n, attr_dev as o, add_location as p, query_selector_all as q, insert_dev as r, safe_not_equal as s, text as t, mount_component as u, append_dev as v, transition_in as w, transition_out as x, destroy_component as y, noop as z };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmIwMzYxZjdkLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdmVsdGUvc3RvcmUvaW5kZXgubWpzIiwiLi4vLi4vLi4vc3JjL25vZGVfbW9kdWxlcy9Ac2FwcGVyL2ludGVybmFsL3NoYXJlZC5tanMiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9NYXAvY29udGV4dC5qcyIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL01hcC9NYXAuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvTWFwL01hcE1hcmtlci5zdmVsdGUiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvY2xhc3NuYW1lcy9pbmRleC5qcyIsIi4uLy4uLy4uL3NyYy91dGlscy5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0ljb24uc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvUmF0ZS5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9JbnB1dC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9QaWN0dXJlLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0F2YXRhci5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9CdXR0b24uc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRGl2aWRlci5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9Qcm9ncmVzcy5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9DYXJvdXNlbC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9IZWFkZXIuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvRm9vdGVyLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL0NvbW1lbnQuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvQXZhdGFyQW5kTmFtZS5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9MaXN0SXRlbXMuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvQ2hhcml0eUNhcmQuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvQ2hhcml0eUNhcmRzLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL1RpdGxlU3ViVGl0bGUuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvRG9uYXRpbmdHcm91cC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9MaXN0T2ZGZWF0dXJlcy5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvcm91dGVzL19sYXlvdXQuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL3JvdXRlcy9fZXJyb3Iuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL25vZGVfbW9kdWxlcy9Ac2FwcGVyL2ludGVybmFsL0FwcC5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbm9kZV9tb2R1bGVzL0BzYXBwZXIvaW50ZXJuYWwvbWFuaWZlc3QtY2xpZW50Lm1qcyIsIi4uLy4uLy4uL3NyYy9ub2RlX21vZHVsZXMvQHNhcHBlci9hcHAubWpzIiwiLi4vLi4vLi4vc3JjL2NsaWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBub29wKCkgeyB9XG5jb25zdCBpZGVudGl0eSA9IHggPT4geDtcbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKVxuICAgICAgICB0YXJba10gPSBzcmNba107XG4gICAgcmV0dXJuIHRhcjtcbn1cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoc3RvcmUgIT0gbnVsbCAmJiB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIC4uLmNhbGxiYWNrcykge1xuICAgIGlmIChzdG9yZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub29wO1xuICAgIH1cbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZSguLi5jYWxsYmFja3MpO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAodHlwZW9mICQkc2NvcGUuZGlydHkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiBleGNsdWRlX2ludGVybmFsX3Byb3BzKHByb3BzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoa1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdWx0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIG9uY2UoZm4pIHtcbiAgICBsZXQgcmFuID0gZmFsc2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGlmIChyYW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgIGZuLmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIG51bGxfdG9fZW1wdHkodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfc3RvcmVfdmFsdWUoc3RvcmUsIHJldCwgdmFsdWUgPSByZXQpIHtcbiAgICBzdG9yZS5zZXQodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59XG5jb25zdCBoYXNfcHJvcCA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xuZnVuY3Rpb24gYWN0aW9uX2Rlc3Ryb3llcihhY3Rpb25fcmVzdWx0KSB7XG4gICAgcmV0dXJuIGFjdGlvbl9yZXN1bHQgJiYgaXNfZnVuY3Rpb24oYWN0aW9uX3Jlc3VsdC5kZXN0cm95KSA/IGFjdGlvbl9yZXN1bHQuZGVzdHJveSA6IG5vb3A7XG59XG5cbmNvbnN0IGlzX2NsaWVudCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xubGV0IG5vdyA9IGlzX2NsaWVudFxuICAgID8gKCkgPT4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpXG4gICAgOiAoKSA9PiBEYXRlLm5vdygpO1xubGV0IHJhZiA9IGlzX2NsaWVudCA/IGNiID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShjYikgOiBub29wO1xuLy8gdXNlZCBpbnRlcm5hbGx5IGZvciB0ZXN0aW5nXG5mdW5jdGlvbiBzZXRfbm93KGZuKSB7XG4gICAgbm93ID0gZm47XG59XG5mdW5jdGlvbiBzZXRfcmFmKGZuKSB7XG4gICAgcmFmID0gZm47XG59XG5cbmNvbnN0IHRhc2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gcnVuX3Rhc2tzKG5vdykge1xuICAgIHRhc2tzLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGlmICghdGFzay5jKG5vdykpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgICAgIHRhc2suZigpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRhc2tzLnNpemUgIT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xufVxuLyoqXG4gKiBGb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5IVxuICovXG5mdW5jdGlvbiBjbGVhcl9sb29wcygpIHtcbiAgICB0YXNrcy5jbGVhcigpO1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHRhc2sgdGhhdCBydW5zIG9uIGVhY2ggcmFmIGZyYW1lXG4gKiB1bnRpbCBpdCByZXR1cm5zIGEgZmFsc3kgdmFsdWUgb3IgaXMgYWJvcnRlZFxuICovXG5mdW5jdGlvbiBsb29wKGNhbGxiYWNrKSB7XG4gICAgbGV0IHRhc2s7XG4gICAgaWYgKHRhc2tzLnNpemUgPT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHByb21pc2U6IG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgICAgICAgdGFza3MuYWRkKHRhc2sgPSB7IGM6IGNhbGxiYWNrLCBmOiBmdWxmaWxsIH0pO1xuICAgICAgICB9KSxcbiAgICAgICAgYWJvcnQoKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfZWFjaChpdGVyYXRpb25zLCBkZXRhY2hpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnNbaV0pXG4gICAgICAgICAgICBpdGVyYXRpb25zW2ldLmQoZGV0YWNoaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBlbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cbmZ1bmN0aW9uIGVsZW1lbnRfaXMobmFtZSwgaXMpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lLCB7IGlzIH0pO1xufVxuZnVuY3Rpb24gb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcyhvYmosIGV4Y2x1ZGUpIHtcbiAgICBjb25zdCB0YXJnZXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gb2JqKSB7XG4gICAgICAgIGlmIChoYXNfcHJvcChvYmosIGspXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAmJiBleGNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0YXJnZXRba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHN2Z19lbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5hbWUpO1xufVxuZnVuY3Rpb24gdGV4dChkYXRhKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xufVxuZnVuY3Rpb24gc3BhY2UoKSB7XG4gICAgcmV0dXJuIHRleHQoJyAnKTtcbn1cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICAgIHJldHVybiB0ZXh0KCcnKTtcbn1cbmZ1bmN0aW9uIGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBwcmV2ZW50X2RlZmF1bHQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzdG9wX3Byb3BhZ2F0aW9uKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNlbGYoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcylcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMobm9kZS5fX3Byb3RvX18pO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2NyaXB0b3JzW2tleV0gJiYgZGVzY3JpcHRvcnNba2V5XS5zZXQpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB4bGlua19hdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRfYmluZGluZ19ncm91cF92YWx1ZShncm91cCkge1xuICAgIGNvbnN0IHZhbHVlID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoZ3JvdXBbaV0uY2hlY2tlZClcbiAgICAgICAgICAgIHZhbHVlLnB1c2goZ3JvdXBbaV0uX192YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyB1bmRlZmluZWQgOiArdmFsdWU7XG59XG5mdW5jdGlvbiB0aW1lX3Jhbmdlc190b19hcnJheShyYW5nZXMpIHtcbiAgICBjb25zdCBhcnJheSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGFycmF5LnB1c2goeyBzdGFydDogcmFuZ2VzLnN0YXJ0KGkpLCBlbmQ6IHJhbmdlcy5lbmQoaSkgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbn1cbmZ1bmN0aW9uIGNoaWxkcmVuKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xufVxuZnVuY3Rpb24gY2xhaW1fZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcywgc3ZnKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVOYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICBsZXQgaiA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBub2RlLmF0dHJpYnV0ZXNbal07XG4gICAgICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZXNbYXR0cmlidXRlLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdmcgPyBzdmdfZWxlbWVudChuYW1lKSA6IGVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSAnJyArIGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0KGRhdGEpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0LmRhdGEgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlICE9IG51bGwgfHwgaW5wdXQudmFsdWUpIHtcbiAgICAgICAgaW5wdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdHlwZShpbnB1dCwgdHlwZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBpZiAob3B0aW9uLl9fdmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbnMoc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IH52YWx1ZS5pbmRleE9mKG9wdGlvbi5fX3ZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3RfdmFsdWUoc2VsZWN0KSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRfb3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJykgfHwgc2VsZWN0Lm9wdGlvbnNbMF07XG4gICAgcmV0dXJuIHNlbGVjdGVkX29wdGlvbiAmJiBzZWxlY3RlZF9vcHRpb24uX192YWx1ZTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9tdWx0aXBsZV92YWx1ZShzZWxlY3QpIHtcbiAgICByZXR1cm4gW10ubWFwLmNhbGwoc2VsZWN0LnF1ZXJ5U2VsZWN0b3JBbGwoJzpjaGVja2VkJyksIG9wdGlvbiA9PiBvcHRpb24uX192YWx1ZSk7XG59XG5mdW5jdGlvbiBhZGRfcmVzaXplX2xpc3RlbmVyKGVsZW1lbnQsIGZuKSB7XG4gICAgaWYgKGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBvYmplY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvYmplY3QnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IGhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvaW50ZXItZXZlbnRzOiBub25lOyB6LWluZGV4OiAtMTsnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgb2JqZWN0LnR5cGUgPSAndGV4dC9odG1sJztcbiAgICBvYmplY3QudGFiSW5kZXggPSAtMTtcbiAgICBsZXQgd2luO1xuICAgIG9iamVjdC5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIHdpbiA9IG9iamVjdC5jb250ZW50RG9jdW1lbnQuZGVmYXVsdFZpZXc7XG4gICAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmbik7XG4gICAgfTtcbiAgICBpZiAoL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChvYmplY3QpO1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob2JqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2FuY2VsOiAoKSA9PiB7XG4gICAgICAgICAgICB3aW4gJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIgJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2hpbGQob2JqZWN0KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmZ1bmN0aW9uIHF1ZXJ5X3NlbGVjdG9yX2FsbChzZWxlY3RvciwgcGFyZW50ID0gZG9jdW1lbnQuYm9keSkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59XG5jbGFzcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihodG1sLCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIHRoaXMuZSA9IGVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmEgPSBhbmNob3I7XG4gICAgICAgIHRoaXMudShodG1sKTtcbiAgICB9XG4gICAgbSh0YXJnZXQsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydCh0YXJnZXQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnQgPSB0YXJnZXQ7XG4gICAgfVxuICAgIHUoaHRtbCkge1xuICAgICAgICB0aGlzLmUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgdGhpcy5uID0gQXJyYXkuZnJvbSh0aGlzLmUuY2hpbGROb2Rlcyk7XG4gICAgfVxuICAgIHAoaHRtbCkge1xuICAgICAgICB0aGlzLmQoKTtcbiAgICAgICAgdGhpcy51KGh0bWwpO1xuICAgICAgICB0aGlzLm0odGhpcy50LCB0aGlzLmEpO1xuICAgIH1cbiAgICBkKCkge1xuICAgICAgICB0aGlzLm4uZm9yRWFjaChkZXRhY2gpO1xuICAgIH1cbn1cblxubGV0IHN0eWxlc2hlZXQ7XG5sZXQgYWN0aXZlID0gMDtcbmxldCBjdXJyZW50X3J1bGVzID0ge307XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcbiAgICBsZXQgaGFzaCA9IDUzODE7XG4gICAgbGV0IGkgPSBzdHIubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSBeIHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBoYXNoID4+PiAwO1xufVxuZnVuY3Rpb24gY3JlYXRlX3J1bGUobm9kZSwgYSwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNlLCBmbiwgdWlkID0gMCkge1xuICAgIGNvbnN0IHN0ZXAgPSAxNi42NjYgLyBkdXJhdGlvbjtcbiAgICBsZXQga2V5ZnJhbWVzID0gJ3tcXG4nO1xuICAgIGZvciAobGV0IHAgPSAwOyBwIDw9IDE7IHAgKz0gc3RlcCkge1xuICAgICAgICBjb25zdCB0ID0gYSArIChiIC0gYSkgKiBlYXNlKHApO1xuICAgICAgICBrZXlmcmFtZXMgKz0gcCAqIDEwMCArIGAleyR7Zm4odCwgMSAtIHQpfX1cXG5gO1xuICAgIH1cbiAgICBjb25zdCBydWxlID0ga2V5ZnJhbWVzICsgYDEwMCUgeyR7Zm4oYiwgMSAtIGIpfX1cXG59YDtcbiAgICBjb25zdCBuYW1lID0gYF9fc3ZlbHRlXyR7aGFzaChydWxlKX1fJHt1aWR9YDtcbiAgICBpZiAoIWN1cnJlbnRfcnVsZXNbbmFtZV0pIHtcbiAgICAgICAgaWYgKCFzdHlsZXNoZWV0KSB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZSA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgICAgICAgIHN0eWxlc2hlZXQgPSBzdHlsZS5zaGVldDtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50X3J1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogYGB9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpXG4gICAgICAgIC5zcGxpdCgnLCAnKVxuICAgICAgICAuZmlsdGVyKG5hbWVcbiAgICAgICAgPyBhbmltID0+IGFuaW0uaW5kZXhPZihuYW1lKSA8IDAgLy8gcmVtb3ZlIHNwZWNpZmljIGFuaW1hdGlvblxuICAgICAgICA6IGFuaW0gPT4gYW5pbS5pbmRleE9mKCdfX3N2ZWx0ZScpID09PSAtMSAvLyByZW1vdmUgYWxsIFN2ZWx0ZSBhbmltYXRpb25zXG4gICAgKVxuICAgICAgICAuam9pbignLCAnKTtcbiAgICBpZiAobmFtZSAmJiAhLS1hY3RpdmUpXG4gICAgICAgIGNsZWFyX3J1bGVzKCk7XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgaSA9IHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgc3R5bGVzaGVldC5kZWxldGVSdWxlKGkpO1xuICAgICAgICBjdXJyZW50X3J1bGVzID0ge307XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9hbmltYXRpb24obm9kZSwgZnJvbSwgZm4sIHBhcmFtcykge1xuICAgIGlmICghZnJvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChmcm9tLmxlZnQgPT09IHRvLmxlZnQgJiYgZnJvbS5yaWdodCA9PT0gdG8ucmlnaHQgJiYgZnJvbS50b3AgPT09IHRvLnRvcCAmJiBmcm9tLmJvdHRvbSA9PT0gdG8uYm90dG9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86IHNob3VsZCB0aGlzIGJlIHNlcGFyYXRlZCBmcm9tIGRlc3RydWN0dXJpbmc/IE9yIHN0YXJ0L2VuZCBhZGRlZCB0byBwdWJsaWMgYXBpIGFuZCBkb2N1bWVudGF0aW9uP1xuICAgIHN0YXJ0OiBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOlxuICAgIGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbiwgdGljayA9IG5vb3AsIGNzcyB9ID0gZm4obm9kZSwgeyBmcm9tLCB0byB9LCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIGxldCBuYW1lO1xuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICBuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWxheSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpO1xuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgaWYgKCFzdGFydGVkICYmIG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcbiAgICAgICAgICAgIGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgc3RhcnQoKTtcbiAgICB0aWNrKDAsIDEpO1xuICAgIHJldHVybiBzdG9wO1xufVxuZnVuY3Rpb24gZml4X3Bvc2l0aW9uKG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKHN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHN0eWxlLnBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gc3R5bGU7XG4gICAgICAgIGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgYWRkX3RyYW5zZm9ybShub2RlLCBhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpIHtcbiAgICBjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoYS5sZWZ0ICE9PSBiLmxlZnQgfHwgYS50b3AgIT09IGIudG9wKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtID09PSAnbm9uZScgPyAnJyA6IHN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgbm9kZS5zdHlsZS50cmFuc2Zvcm0gPSBgJHt0cmFuc2Zvcm19IHRyYW5zbGF0ZSgke2EubGVmdCAtIGIubGVmdH1weCwgJHthLnRvcCAtIGIudG9wfXB4KWA7XG4gICAgfVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb25gKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5iZWZvcmVfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5hZnRlcl91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuKGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG5jb25zdCBzZWVuX2NhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzLnNoaWZ0KCk7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpXG4gICAgICAgICAgICBiaW5kaW5nX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgICAgICAvLyB0aGVuLCBvbmNlIGNvbXBvbmVudHMgYXJlIHVwZGF0ZWQsIGNhbGxcbiAgICAgICAgLy8gYWZ0ZXJVcGRhdGUgZnVuY3Rpb25zLiBUaGlzIG1heSBjYXVzZVxuICAgICAgICAvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlbmRlcl9jYWxsYmFja3NbaV07XG4gICAgICAgICAgICBpZiAoIXNlZW5fY2FsbGJhY2tzLmhhcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICAvLyAuLi5zbyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGxvb3BzXG4gICAgICAgICAgICAgICAgc2Vlbl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9IHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgd2hpbGUgKGZsdXNoX2NhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgZmx1c2hfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgfVxuICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbiAgICBzZWVuX2NhbGxiYWNrcy5jbGVhcigpO1xufVxuZnVuY3Rpb24gdXBkYXRlKCQkKSB7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICQkLnVwZGF0ZSgpO1xuICAgICAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgICAgICBjb25zdCBkaXJ0eSA9ICQkLmRpcnR5O1xuICAgICAgICAkJC5kaXJ0eSA9IFstMV07XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LnAoJCQuY3R4LCBkaXJ0eSk7XG4gICAgICAgICQkLmFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xuICAgIH1cbn1cblxubGV0IHByb21pc2U7XG5mdW5jdGlvbiB3YWl0KCkge1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xufVxuZnVuY3Rpb24gZGlzcGF0Y2gobm9kZSwgZGlyZWN0aW9uLCBraW5kKSB7XG4gICAgbm9kZS5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudChgJHtkaXJlY3Rpb24gPyAnaW50cm8nIDogJ291dHJvJ30ke2tpbmR9YCkpO1xufVxuY29uc3Qgb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5sZXQgb3V0cm9zO1xuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuICAgIG91dHJvcyA9IHtcbiAgICAgICAgcjogMCxcbiAgICAgICAgYzogW10sXG4gICAgICAgIHA6IG91dHJvcyAvLyBwYXJlbnQgZ3JvdXBcbiAgICB9O1xufVxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuICAgIGlmICghb3V0cm9zLnIpIHtcbiAgICAgICAgcnVuX2FsbChvdXRyb3MuYyk7XG4gICAgfVxuICAgIG91dHJvcyA9IG91dHJvcy5wO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9pbihibG9jaywgbG9jYWwpIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2suaSkge1xuICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICBibG9jay5pKGxvY2FsKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX291dChibG9jaywgbG9jYWwsIGRldGFjaCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2subykge1xuICAgICAgICBpZiAob3V0cm9pbmcuaGFzKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgb3V0cm9pbmcuYWRkKGJsb2NrKTtcbiAgICAgICAgb3V0cm9zLmMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFjaClcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZCgxKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYmxvY2subyhsb2NhbCk7XG4gICAgfVxufVxuY29uc3QgbnVsbF90cmFuc2l0aW9uID0geyBkdXJhdGlvbjogMCB9O1xuZnVuY3Rpb24gY3JlYXRlX2luX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gZmFsc2U7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB1aWQgPSAwO1xuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MsIHVpZCsrKTtcbiAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBpZiAodGFzaylcbiAgICAgICAgICAgIHRhc2suYWJvcnQoKTtcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ3N0YXJ0JykpO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHRydWUsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFydCgpIHtcbiAgICAgICAgICAgIGlmIChzdGFydGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbihnbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbnZhbGlkYXRlKCkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX291dF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGNvbnN0IGdyb3VwID0gb3V0cm9zO1xuICAgIGdyb3VwLnIgKz0gMTtcbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMSwgMCwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ3N0YXJ0JykpO1xuICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEtLWdyb3VwLnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCByZXN1bHQgaW4gYGVuZCgpYCBiZWluZyBjYWxsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGNsZWFuIHVwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwoZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSAtIHQsIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICBnbygpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdvKCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGVuZChyZXNldCkge1xuICAgICAgICAgICAgaWYgKHJlc2V0ICYmIGNvbmZpZy50aWNrKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnRpY2soMSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMsIGludHJvKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHQgPSBpbnRybyA/IDAgOiAxO1xuICAgIGxldCBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBhbmltYXRpb25fbmFtZSA9IG51bGw7XG4gICAgZnVuY3Rpb24gY2xlYXJfYW5pbWF0aW9uKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluaXQocHJvZ3JhbSwgZHVyYXRpb24pIHtcbiAgICAgICAgY29uc3QgZCA9IHByb2dyYW0uYiAtIHQ7XG4gICAgICAgIGR1cmF0aW9uICo9IE1hdGguYWJzKGQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTogdCxcbiAgICAgICAgICAgIGI6IHByb2dyYW0uYixcbiAgICAgICAgICAgIGQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0YXJ0OiBwcm9ncmFtLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBwcm9ncmFtLnN0YXJ0ICsgZHVyYXRpb24sXG4gICAgICAgICAgICBncm91cDogcHJvZ3JhbS5ncm91cFxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbyhiKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSB7XG4gICAgICAgICAgICBzdGFydDogbm93KCkgKyBkZWxheSxcbiAgICAgICAgICAgIGJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgcHJvZ3JhbS5ncm91cCA9IG91dHJvcztcbiAgICAgICAgICAgIG91dHJvcy5yICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgYW4gaW50cm8sIGFuZCB0aGVyZSdzIGEgZGVsYXksIHdlIG5lZWQgdG8gZG9cbiAgICAgICAgICAgIC8vIGFuIGluaXRpYWwgdGljayBhbmQvb3IgYXBwbHkgQ1NTIGFuaW1hdGlvbiBpbW1lZGlhdGVseVxuICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYilcbiAgICAgICAgICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIGIsICdzdGFydCcpKTtcbiAgICAgICAgICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocGVuZGluZ19wcm9ncmFtICYmIG5vdyA+IHBlbmRpbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHBlbmRpbmdfcHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ3N0YXJ0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBydW5uaW5nX3Byb2dyYW0uYiwgcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uLCAwLCBlYXNpbmcsIGNvbmZpZy5jc3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQgPSBydW5uaW5nX3Byb2dyYW0uYiwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgZG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0uYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnRybyDigJQgd2UgY2FuIHRpZHkgdXAgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvdXRybyDigJQgbmVlZHMgdG8gYmUgY29vcmRpbmF0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEtLXJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuX2FsbChydW5uaW5nX3Byb2dyYW0uZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwID0gbm93IC0gcnVubmluZ19wcm9ncmFtLnN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdCA9IHJ1bm5pbmdfcHJvZ3JhbS5hICsgcnVubmluZ19wcm9ncmFtLmQgKiBlYXNpbmcocCAvIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gISEocnVubmluZ19wcm9ncmFtIHx8IHBlbmRpbmdfcHJvZ3JhbSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBydW4oYikge1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVuZCgpIHtcbiAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGhhbmRsZV9wcm9taXNlKHByb21pc2UsIGluZm8pIHtcbiAgICBjb25zdCB0b2tlbiA9IGluZm8udG9rZW4gPSB7fTtcbiAgICBmdW5jdGlvbiB1cGRhdGUodHlwZSwgaW5kZXgsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGluZm8udG9rZW4gIT09IHRva2VuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpbmZvLnJlc29sdmVkID0gdmFsdWU7XG4gICAgICAgIGxldCBjaGlsZF9jdHggPSBpbmZvLmN0eDtcbiAgICAgICAgaWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjaGlsZF9jdHggPSBjaGlsZF9jdHguc2xpY2UoKTtcbiAgICAgICAgICAgIGNoaWxkX2N0eFtrZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmxvY2sgPSB0eXBlICYmIChpbmZvLmN1cnJlbnQgPSB0eXBlKShjaGlsZF9jdHgpO1xuICAgICAgICBsZXQgbmVlZHNfZmx1c2ggPSBmYWxzZTtcbiAgICAgICAgaWYgKGluZm8uYmxvY2spIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmJsb2Nrcykge1xuICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzLmZvckVhY2goKGJsb2NrLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9PSBpbmRleCAmJiBibG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBfb3V0cm9zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tfb3V0cm9zKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGluZm8uYmxvY2suZCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICAgICAgYmxvY2subShpbmZvLm1vdW50KCksIGluZm8uYW5jaG9yKTtcbiAgICAgICAgICAgIG5lZWRzX2ZsdXNoID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLmJsb2NrID0gYmxvY2s7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrcylcbiAgICAgICAgICAgIGluZm8uYmxvY2tzW2luZGV4XSA9IGJsb2NrO1xuICAgICAgICBpZiAobmVlZHNfZmx1c2gpIHtcbiAgICAgICAgICAgIGZsdXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzX3Byb21pc2UocHJvbWlzZSkpIHtcbiAgICAgICAgY29uc3QgY3VycmVudF9jb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKHZhbHVlID0+IHtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjdXJyZW50X2NvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjdXJyZW50X2NvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby5jYXRjaCwgMiwgaW5mby5lcnJvciwgZXJyb3IpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8ucGVuZGluZykge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8ucGVuZGluZywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby50aGVuKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSBwcm9taXNlO1xuICAgIH1cbn1cblxuY29uc3QgZ2xvYmFscyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2tleXMoY3R4LCBsaXN0LCBnZXRfY29udGV4dCwgZ2V0X2tleSkge1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKSk7XG4gICAgICAgIGlmIChrZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBoYXZlIGR1cGxpY2F0ZSBrZXlzIGluIGEga2V5ZWQgZWFjaGApO1xuICAgICAgICB9XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciA9IC9bXFxzJ1wiPi89XFx1e0ZERDB9LVxcdXtGREVGfVxcdXtGRkZFfVxcdXtGRkZGfVxcdXsxRkZGRX1cXHV7MUZGRkZ9XFx1ezJGRkZFfVxcdXsyRkZGRn1cXHV7M0ZGRkV9XFx1ezNGRkZGfVxcdXs0RkZGRX1cXHV7NEZGRkZ9XFx1ezVGRkZFfVxcdXs1RkZGRn1cXHV7NkZGRkV9XFx1ezZGRkZGfVxcdXs3RkZGRX1cXHV7N0ZGRkZ9XFx1ezhGRkZFfVxcdXs4RkZGRn1cXHV7OUZGRkV9XFx1ezlGRkZGfVxcdXtBRkZGRX1cXHV7QUZGRkZ9XFx1e0JGRkZFfVxcdXtCRkZGRn1cXHV7Q0ZGRkV9XFx1e0NGRkZGfVxcdXtERkZGRX1cXHV7REZGRkZ9XFx1e0VGRkZFfVxcdXtFRkZGRn1cXHV7RkZGRkV9XFx1e0ZGRkZGfVxcdXsxMEZGRkV9XFx1ezEwRkZGRn1dL3U7XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNhdHRyaWJ1dGVzLTJcbi8vIGh0dHBzOi8vaW5mcmEuc3BlYy53aGF0d2cub3JnLyNub25jaGFyYWN0ZXJcbmZ1bmN0aW9uIHNwcmVhZChhcmdzLCBjbGFzc2VzX3RvX2FkZCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCAuLi5hcmdzKTtcbiAgICBpZiAoY2xhc3Nlc190b19hZGQpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyA9IGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyArPSAnICcgKyBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RyID0gJyc7XG4gICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgaWYgKGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLnRlc3QobmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKVxuICAgICAgICAgICAgc3RyICs9IFwiIFwiICsgbmFtZTtcbiAgICAgICAgZWxzZSBpZiAoYm9vbGVhbl9hdHRyaWJ1dGVzLmhhcyhuYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpXG4gICAgICAgICAgICAgICAgc3RyICs9IFwiIFwiICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgKz0gYCAke25hbWV9PVwiJHtTdHJpbmcodmFsdWUpLnJlcGxhY2UoL1wiL2csICcmIzM0OycpLnJlcGxhY2UoLycvZywgJyYjMzk7Jyl9XCJgO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IGVzY2FwZWQgPSB7XG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmIzM5OycsXG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnXG59O1xuZnVuY3Rpb24gZXNjYXBlKGh0bWwpIHtcbiAgICByZXR1cm4gU3RyaW5nKGh0bWwpLnJlcGxhY2UoL1tcIicmPD5dL2csIG1hdGNoID0+IGVzY2FwZWRbbWF0Y2hdKTtcbn1cbmZ1bmN0aW9uIGVhY2goaXRlbXMsIGZuKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3RyICs9IGZuKGl0ZW1zW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IG1pc3NpbmdfY29tcG9uZW50ID0ge1xuICAgICQkcmVuZGVyOiAoKSA9PiAnJ1xufTtcbmZ1bmN0aW9uIHZhbGlkYXRlX2NvbXBvbmVudChjb21wb25lbnQsIG5hbWUpIHtcbiAgICBpZiAoIWNvbXBvbmVudCB8fCAhY29tcG9uZW50LiQkcmVuZGVyKSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnc3ZlbHRlOmNvbXBvbmVudCcpXG4gICAgICAgICAgICBuYW1lICs9ICcgdGhpcz17Li4ufSc7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgPCR7bmFtZX0+IGlzIG5vdCBhIHZhbGlkIFNTUiBjb21wb25lbnQuIFlvdSBtYXkgbmVlZCB0byByZXZpZXcgeW91ciBidWlsZCBjb25maWcgdG8gZW5zdXJlIHRoYXQgZGVwZW5kZW5jaWVzIGFyZSBjb21waWxlZCwgcmF0aGVyIHRoYW4gaW1wb3J0ZWQgYXMgcHJlLWNvbXBpbGVkIG1vZHVsZXNgKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGRlYnVnKGZpbGUsIGxpbmUsIGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgY29uc29sZS5sb2coYHtAZGVidWd9ICR7ZmlsZSA/IGZpbGUgKyAnICcgOiAnJ30oJHtsaW5lfToke2NvbHVtbn0pYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKHZhbHVlcyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIHJldHVybiAnJztcbn1cbmxldCBvbl9kZXN0cm95O1xuZnVuY3Rpb24gY3JlYXRlX3Nzcl9jb21wb25lbnQoZm4pIHtcbiAgICBmdW5jdGlvbiAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpIHtcbiAgICAgICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgICAgICBjb25zdCAkJCA9IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3ksXG4gICAgICAgICAgICBjb250ZXh0OiBuZXcgTWFwKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSksXG4gICAgICAgICAgICAvLyB0aGVzZSB3aWxsIGJlIGltbWVkaWF0ZWx5IGRpc2NhcmRlZFxuICAgICAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKVxuICAgICAgICB9O1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoeyAkJCB9KTtcbiAgICAgICAgY29uc3QgaHRtbCA9IGZuKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cyk7XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcjogKHByb3BzID0ge30sIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICAgICAgb25fZGVzdHJveSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyB0aXRsZTogJycsIGhlYWQ6ICcnLCBjc3M6IG5ldyBTZXQoKSB9O1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9ICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIHt9LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJ1bl9hbGwob25fZGVzdHJveSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IEFycmF5LmZyb20ocmVzdWx0LmNzcykubWFwKGNzcyA9PiBjc3MuY29kZSkuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbnVsbCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoZWFkOiByZXN1bHQudGl0bGUgKyByZXN1bHQuaGVhZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgJCRyZW5kZXJcbiAgICB9O1xufVxuZnVuY3Rpb24gYWRkX2F0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IChib29sZWFuICYmICF2YWx1ZSkpXG4gICAgICAgIHJldHVybiAnJztcbiAgICByZXR1cm4gYCAke25hbWV9JHt2YWx1ZSA9PT0gdHJ1ZSA/ICcnIDogYD0ke3R5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeShlc2NhcGUodmFsdWUpKSA6IGBcIiR7dmFsdWV9XCJgfWB9YDtcbn1cbmZ1bmN0aW9uIGFkZF9jbGFzc2VzKGNsYXNzZXMpIHtcbiAgICByZXR1cm4gY2xhc3NlcyA/IGAgY2xhc3M9XCIke2NsYXNzZXN9XCJgIDogYGA7XG59XG5cbmZ1bmN0aW9uIGJpbmQoY29tcG9uZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGluZGV4ID0gY29tcG9uZW50LiQkLnByb3BzW25hbWVdO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudC4kJC5ib3VuZFtpbmRleF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtpbmRleF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZV9jb21wb25lbnQoYmxvY2spIHtcbiAgICBibG9jayAmJiBibG9jay5jKCk7XG59XG5mdW5jdGlvbiBjbGFpbV9jb21wb25lbnQoYmxvY2ssIHBhcmVudF9ub2Rlcykge1xuICAgIGJsb2NrICYmIGJsb2NrLmwocGFyZW50X25vZGVzKTtcbn1cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yKSB7XG4gICAgY29uc3QgeyBmcmFnbWVudCwgb25fbW91bnQsIG9uX2Rlc3Ryb3ksIGFmdGVyX3VwZGF0ZSB9ID0gY29tcG9uZW50LiQkO1xuICAgIGZyYWdtZW50ICYmIGZyYWdtZW50Lm0odGFyZ2V0LCBhbmNob3IpO1xuICAgIC8vIG9uTW91bnQgaGFwcGVucyBiZWZvcmUgdGhlIGluaXRpYWwgYWZ0ZXJVcGRhdGVcbiAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgY29uc3QgbmV3X29uX2Rlc3Ryb3kgPSBvbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICBpZiAob25fZGVzdHJveSkge1xuICAgICAgICAgICAgb25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgLy8gbW9zdCBsaWtlbHkgYXMgYSByZXN1bHQgb2YgYSBiaW5kaW5nIGluaXRpYWxpc2luZ1xuICAgICAgICAgICAgcnVuX2FsbChuZXdfb25fZGVzdHJveSk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50LiQkLm9uX21vdW50ID0gW107XG4gICAgfSk7XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgcHJvcF92YWx1ZXMgPSBvcHRpb25zLnByb3BzIHx8IHt9O1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkID0ge1xuICAgICAgICBmcmFnbWVudDogbnVsbCxcbiAgICAgICAgY3R4OiBudWxsLFxuICAgICAgICAvLyBzdGF0ZVxuICAgICAgICBwcm9wcyxcbiAgICAgICAgdXBkYXRlOiBub29wLFxuICAgICAgICBub3RfZXF1YWwsXG4gICAgICAgIGJvdW5kOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgLy8gbGlmZWN5Y2xlXG4gICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgb25fZGVzdHJveTogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSksXG4gICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICBkaXJ0eVxuICAgIH07XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIHByb3BfdmFsdWVzLCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmwoY2hpbGRyZW4ob3B0aW9ucy50YXJnZXQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50cm8pXG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGNvbXBvbmVudC4kJC5mcmFnbWVudCk7XG4gICAgICAgIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zLmFuY2hvcik7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgfVxuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbn1cbmxldCBTdmVsdGVFbGVtZW50O1xuaWYgKHR5cGVvZiBIVE1MRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIFN2ZWx0ZUVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy4kJC5zbG90dGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpc1thdHRyXSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgICAgICRkZXN0cm95KCkge1xuICAgICAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIFRPRE8gc2hvdWxkIHRoaXMgZGVsZWdhdGUgdG8gYWRkRXZlbnRMaXN0ZW5lcj9cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgJHNldCgpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRkZW4gYnkgaW5zdGFuY2UsIGlmIGl0IGhhcyBwcm9wc1xuICAgICAgICB9XG4gICAgfTtcbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICB9XG4gICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgICRzZXQoKSB7XG4gICAgICAgIC8vIG92ZXJyaWRkZW4gYnkgaW5zdGFuY2UsIGlmIGl0IGhhcyBwcm9wc1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hfZGV2KHR5cGUsIGRldGFpbCkge1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oeyB2ZXJzaW9uOiAnMy4xOC4xJyB9LCBkZXRhaWwpKSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTUluc2VydFwiLCB7IHRhcmdldCwgbm9kZSB9KTtcbiAgICBhcHBlbmQodGFyZ2V0LCBub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9kZXYodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01JbnNlcnRcIiwgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlXCIsIHsgbm9kZSB9KTtcbiAgICBkZXRhY2gobm9kZSk7XG59XG5mdW5jdGlvbiBkZXRhY2hfYmV0d2Vlbl9kZXYoYmVmb3JlLCBhZnRlcikge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2JlZm9yZV9kZXYoYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYWZ0ZXJfZGV2KGJlZm9yZSkge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxpc3Rlbl9kZXYobm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMsIGhhc19wcmV2ZW50X2RlZmF1bHQsIGhhc19zdG9wX3Byb3BhZ2F0aW9uKSB7XG4gICAgY29uc3QgbW9kaWZpZXJzID0gb3B0aW9ucyA9PT0gdHJ1ZSA/IFtcImNhcHR1cmVcIl0gOiBvcHRpb25zID8gQXJyYXkuZnJvbShPYmplY3Qua2V5cyhvcHRpb25zKSkgOiBbXTtcbiAgICBpZiAoaGFzX3ByZXZlbnRfZGVmYXVsdClcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3ByZXZlbnREZWZhdWx0Jyk7XG4gICAgaWYgKGhhc19zdG9wX3Byb3BhZ2F0aW9uKVxuICAgICAgICBtb2RpZmllcnMucHVzaCgnc3RvcFByb3BhZ2F0aW9uJyk7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NQWRkRXZlbnRMaXN0ZW5lclwiLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlRXZlbnRMaXN0ZW5lclwiLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgICAgIGRpc3Bvc2UoKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cl9kZXYobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZVwiLCB7IG5vZGUsIGF0dHJpYnV0ZSB9KTtcbiAgICBlbHNlXG4gICAgICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldEF0dHJpYnV0ZVwiLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldFByb3BlcnR5XCIsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gZGF0YXNldF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZS5kYXRhc2V0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldERhdGFzZXRcIiwgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YV9kZXYodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQuZGF0YSA9PT0gZGF0YSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldERhdGFcIiwgeyBub2RlOiB0ZXh0LCBkYXRhIH0pO1xuICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5jbGFzcyBTdmVsdGVDb21wb25lbnREZXYgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICghb3B0aW9ucy50YXJnZXQgJiYgIW9wdGlvbnMuJCRpbmxpbmUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCd0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uYCk7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIHN1cGVyLiRkZXN0cm95KCk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYENvbXBvbmVudCB3YXMgYWxyZWFkeSBkZXN0cm95ZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH07XG4gICAgfVxufVxuZnVuY3Rpb24gbG9vcF9ndWFyZCh0aW1lb3V0KSB7XG4gICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnQgPiB0aW1lb3V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEluZmluaXRlIGxvb3AgZGV0ZWN0ZWRgKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEh0bWxUYWcsIFN2ZWx0ZUNvbXBvbmVudCwgU3ZlbHRlQ29tcG9uZW50RGV2LCBTdmVsdGVFbGVtZW50LCBhY3Rpb25fZGVzdHJveWVyLCBhZGRfYXR0cmlidXRlLCBhZGRfY2xhc3NlcywgYWRkX2ZsdXNoX2NhbGxiYWNrLCBhZGRfbG9jYXRpb24sIGFkZF9yZW5kZXJfY2FsbGJhY2ssIGFkZF9yZXNpemVfbGlzdGVuZXIsIGFkZF90cmFuc2Zvcm0sIGFmdGVyVXBkYXRlLCBhcHBlbmQsIGFwcGVuZF9kZXYsIGFzc2lnbiwgYXR0ciwgYXR0cl9kZXYsIGJlZm9yZVVwZGF0ZSwgYmluZCwgYmluZGluZ19jYWxsYmFja3MsIGJsYW5rX29iamVjdCwgYnViYmxlLCBjaGVja19vdXRyb3MsIGNoaWxkcmVuLCBjbGFpbV9jb21wb25lbnQsIGNsYWltX2VsZW1lbnQsIGNsYWltX3NwYWNlLCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tcG9uZW50X3N1YnNjcmliZSwgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlc2NhcGUsIGVzY2FwZWQsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZ2V0Q29udGV4dCwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X3Nsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dCwgZ2V0X3NwcmVhZF9vYmplY3QsIGdldF9zcHJlYWRfdXBkYXRlLCBnZXRfc3RvcmVfdmFsdWUsIGdsb2JhbHMsIGdyb3VwX291dHJvcywgaGFuZGxlX3Byb21pc2UsIGhhc19wcm9wLCBpZGVudGl0eSwgaW5pdCwgaW5zZXJ0LCBpbnNlcnRfZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Z1bmN0aW9uLCBpc19wcm9taXNlLCBsaXN0ZW4sIGxpc3Rlbl9kZXYsIGxvb3AsIGxvb3BfZ3VhcmQsIG1pc3NpbmdfY29tcG9uZW50LCBtb3VudF9jb21wb25lbnQsIG5vb3AsIG5vdF9lcXVhbCwgbm93LCBudWxsX3RvX2VtcHR5LCBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzLCBvbkRlc3Ryb3ksIG9uTW91bnQsIG9uY2UsIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBwcmV2ZW50X2RlZmF1bHQsIHByb3BfZGV2LCBxdWVyeV9zZWxlY3Rvcl9hbGwsIHJhZiwgcnVuLCBydW5fYWxsLCBzYWZlX25vdF9lcXVhbCwgc2NoZWR1bGVfdXBkYXRlLCBzZWxlY3RfbXVsdGlwbGVfdmFsdWUsIHNlbGVjdF9vcHRpb24sIHNlbGVjdF9vcHRpb25zLCBzZWxlY3RfdmFsdWUsIHNlbGYsIHNldENvbnRleHQsIHNldF9hdHRyaWJ1dGVzLCBzZXRfY3VycmVudF9jb21wb25lbnQsIHNldF9jdXN0b21fZWxlbWVudF9kYXRhLCBzZXRfZGF0YSwgc2V0X2RhdGFfZGV2LCBzZXRfaW5wdXRfdHlwZSwgc2V0X2lucHV0X3ZhbHVlLCBzZXRfbm93LCBzZXRfcmFmLCBzZXRfc3RvcmVfdmFsdWUsIHNldF9zdHlsZSwgc2V0X3N2Z19hdHRyaWJ1dGVzLCBzcGFjZSwgc3ByZWFkLCBzdG9wX3Byb3BhZ2F0aW9uLCBzdWJzY3JpYmUsIHN2Z19lbGVtZW50LCB0ZXh0LCB0aWNrLCB0aW1lX3Jhbmdlc190b19hcnJheSwgdG9fbnVtYmVyLCB0b2dnbGVfY2xhc3MsIHRyYW5zaXRpb25faW4sIHRyYW5zaXRpb25fb3V0LCB1cGRhdGVfa2V5ZWRfZWFjaCwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9lYWNoX2tleXMsIHZhbGlkYXRlX3N0b3JlLCB4bGlua19hdHRyIH07XG4iLCJpbXBvcnQgeyBub29wLCBzYWZlX25vdF9lcXVhbCwgc3Vic2NyaWJlLCBydW5fYWxsLCBpc19mdW5jdGlvbiB9IGZyb20gJy4uL2ludGVybmFsJztcbmV4cG9ydCB7IGdldF9zdG9yZV92YWx1ZSBhcyBnZXQgfSBmcm9tICcuLi9pbnRlcm5hbCc7XG5cbmNvbnN0IHN1YnNjcmliZXJfcXVldWUgPSBbXTtcbi8qKlxuICogQ3JlYXRlcyBhIGBSZWFkYWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKiBAcGFyYW0gdmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcn1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHJlYWRhYmxlKHZhbHVlLCBzdGFydCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHN1YnNjcmliZTogd3JpdGFibGUodmFsdWUsIHN0YXJ0KS5zdWJzY3JpYmUsXG4gICAgfTtcbn1cbi8qKlxuICogQ3JlYXRlIGEgYFdyaXRhYmxlYCBzdG9yZSB0aGF0IGFsbG93cyBib3RoIHVwZGF0aW5nIGFuZCByZWFkaW5nIGJ5IHN1YnNjcmlwdGlvbi5cbiAqIEBwYXJhbSB7Kj19dmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcj19c3RhcnQgc3RhcnQgYW5kIHN0b3Agbm90aWZpY2F0aW9ucyBmb3Igc3Vic2NyaXB0aW9uc1xuICovXG5mdW5jdGlvbiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQgPSBub29wKSB7XG4gICAgbGV0IHN0b3A7XG4gICAgY29uc3Qgc3Vic2NyaWJlcnMgPSBbXTtcbiAgICBmdW5jdGlvbiBzZXQobmV3X3ZhbHVlKSB7XG4gICAgICAgIGlmIChzYWZlX25vdF9lcXVhbCh2YWx1ZSwgbmV3X3ZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgICAgICBpZiAoc3RvcCkgeyAvLyBzdG9yZSBpcyByZWFkeVxuICAgICAgICAgICAgICAgIGNvbnN0IHJ1bl9xdWV1ZSA9ICFzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgc1sxXSgpO1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLnB1c2gocywgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVuX3F1ZXVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZVtpXVswXShzdWJzY3JpYmVyX3F1ZXVlW2kgKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiB1cGRhdGUoZm4pIHtcbiAgICAgICAgc2V0KGZuKHZhbHVlKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShydW4sIGludmFsaWRhdGUgPSBub29wKSB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmliZXIgPSBbcnVuLCBpbnZhbGlkYXRlXTtcbiAgICAgICAgc3Vic2NyaWJlcnMucHVzaChzdWJzY3JpYmVyKTtcbiAgICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgc3RvcCA9IHN0YXJ0KHNldCkgfHwgbm9vcDtcbiAgICAgICAgfVxuICAgICAgICBydW4odmFsdWUpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBzdWJzY3JpYmVycy5pbmRleE9mKHN1YnNjcmliZXIpO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHN1YnNjcmliZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICAgICAgICAgIHN0b3AgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyBzZXQsIHVwZGF0ZSwgc3Vic2NyaWJlIH07XG59XG5mdW5jdGlvbiBkZXJpdmVkKHN0b3JlcywgZm4sIGluaXRpYWxfdmFsdWUpIHtcbiAgICBjb25zdCBzaW5nbGUgPSAhQXJyYXkuaXNBcnJheShzdG9yZXMpO1xuICAgIGNvbnN0IHN0b3Jlc19hcnJheSA9IHNpbmdsZVxuICAgICAgICA/IFtzdG9yZXNdXG4gICAgICAgIDogc3RvcmVzO1xuICAgIGNvbnN0IGF1dG8gPSBmbi5sZW5ndGggPCAyO1xuICAgIHJldHVybiByZWFkYWJsZShpbml0aWFsX3ZhbHVlLCAoc2V0KSA9PiB7XG4gICAgICAgIGxldCBpbml0ZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gW107XG4gICAgICAgIGxldCBwZW5kaW5nID0gMDtcbiAgICAgICAgbGV0IGNsZWFudXAgPSBub29wO1xuICAgICAgICBjb25zdCBzeW5jID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHBlbmRpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmbihzaW5nbGUgPyB2YWx1ZXNbMF0gOiB2YWx1ZXMsIHNldCk7XG4gICAgICAgICAgICBpZiAoYXV0bykge1xuICAgICAgICAgICAgICAgIHNldChyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xlYW51cCA9IGlzX2Z1bmN0aW9uKHJlc3VsdCkgPyByZXN1bHQgOiBub29wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB1bnN1YnNjcmliZXJzID0gc3RvcmVzX2FycmF5Lm1hcCgoc3RvcmUsIGkpID0+IHN1YnNjcmliZShzdG9yZSwgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB2YWx1ZXNbaV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHBlbmRpbmcgJj0gfigxIDw8IGkpO1xuICAgICAgICAgICAgaWYgKGluaXRlZCkge1xuICAgICAgICAgICAgICAgIHN5bmMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgcGVuZGluZyB8PSAoMSA8PCBpKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBpbml0ZWQgPSB0cnVlO1xuICAgICAgICBzeW5jKCk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICAgICAgcnVuX2FsbCh1bnN1YnNjcmliZXJzKTtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHsgZGVyaXZlZCwgcmVhZGFibGUsIHdyaXRhYmxlIH07XG4iLCJpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSc7XG5cbmV4cG9ydCBjb25zdCBDT05URVhUX0tFWSA9IHt9O1xuXG5leHBvcnQgY29uc3QgcHJlbG9hZCA9ICgpID0+ICh7fSk7IiwiY29uc3QgY29udGV4dE1hcGJveCA9IHt9XG5cbmV4cG9ydCB7IGNvbnRleHRNYXBib3ggfVxuIiwiPHN0eWxlPlxuICAgIHNlY3Rpb24ge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgfVxuPC9zdHlsZT5cblxuPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBvbk1vdW50LCBvbkRlc3Ryb3ksIHNldENvbnRleHQsIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbiAgICBpbXBvcnQgeyBjb250ZXh0TWFwYm94IH0gZnJvbSAnLi9jb250ZXh0J1xuXG4gICAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gICAgZXhwb3J0IGxldCBjZW50ZXIgPSBbMzEuMTY1NiwgNDguMzc5NF1cbiAgICBleHBvcnQgbGV0IHpvb20gPSAzLjc1XG5cbiAgICBsZXQgbWFwXG4gICAgbGV0IGNvbnRhaW5lclxuXG4gICAgc2V0Q29udGV4dChjb250ZXh0TWFwYm94LCB7XG4gICAgICAgIGdldE1hcDogKCkgPT4gbWFwLFxuICAgICAgICBnZXRNYXBib3g6ICgpID0+IHdpbmRvdy5tYXBib3hnbFxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBvbkNyZWF0ZU1hcCgpIHtcbiAgICAgICAgbWFwID0gbmV3IG1hcGJveGdsLk1hcCh7XG4gICAgICAgICAgICB6b29tLFxuICAgICAgICAgICAgY2VudGVyLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgc3R5bGU6ICdtYXBib3g6Ly9zdHlsZXMvbWFwYm94L3N0cmVldHMtdjExJyxcbiAgICAgICAgfSlcblxuICAgICAgICBtYXAub24oJ2RyYWdlbmQnLCAoKSA9PiBkaXNwYXRjaCgncmVjZW50cmUnLCB7IG1hcCwgY2VudGVyOiBtYXAuZ2V0Q2VudGVyKCkgfSkpXG4gICAgICAgIG1hcC5vbignbG9hZCcsICgpID0+IGRpc3BhdGNoKCdyZWFkeScsIG1hcCkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlTWFwKCkge1xuICAgICAgICBjb25zdCBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgICAgICBzY3JpcHRUYWcudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnXG4gICAgICAgIHNjcmlwdFRhZy5zcmMgPSAnaHR0cHM6Ly9hcGkubWFwYm94LmNvbS9tYXBib3gtZ2wtanMvdjEuNy4wL21hcGJveC1nbC5qcydcblxuICAgICAgICBjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpXG4gICAgICAgIGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnXG4gICAgICAgIGxpbmsuaHJlZiA9ICdodHRwczovL2FwaS5tYXBib3guY29tL21hcGJveC1nbC1qcy92MS43LjAvbWFwYm94LWdsLmNzcydcblxuICAgICAgICBzY3JpcHRUYWcub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdG9rZW4gPSAncGsuZXlKMUlqb2lZblZpYkdscklpd2lZU0k2SW1Ock5YcHhkemd4YlRBd05uY3piR3h3ZUcwd2NUVjNjakFpZlEucnQxcGVMakNRSFpVa3JNNEFXejVNdydcbiAgICAgICAgICAgIG1hcGJveGdsLmFjY2Vzc1Rva2VuID0gdG9rZW5cblxuICAgICAgICAgICAgbGluay5vbmxvYWQgPSBvbkNyZWF0ZU1hcFxuXG4gICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspXG4gICAgICAgIH1cblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdFRhZylcbiAgICB9XG5cbiAgICBvbk1vdW50KCgpID0+IHtcbiAgICAgICAgaWYgKCdtYXBib3hnbCcgaW4gd2luZG93KSB7XG4gICAgICAgICAgICBvbkNyZWF0ZU1hcCgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjcmVhdGVNYXAoKVxuICAgICAgICB9XG4gICAgfSlcblxuICAgIG9uRGVzdHJveSgoKSA9PiB7XG4gICAgICAgIG1hcCAmJiBtYXAucmVtb3ZlKClcbiAgICB9KVxuPC9zY3JpcHQ+XG5cbjxzZWN0aW9uIGJpbmQ6dGhpcz17Y29udGFpbmVyfT5cbiAgICB7I2lmIG1hcH1cbiAgICAgICAgPHNsb3Q+PC9zbG90PlxuICAgIHsvaWZ9XG48L3NlY3Rpb24+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGdldENvbnRleHQgfSBmcm9tICdzdmVsdGUnXG4gICAgaW1wb3J0IHsgY29udGV4dE1hcGJveCB9IGZyb20gJy4vY29udGV4dCdcblxuICAgIGNvbnN0IHsgZ2V0TWFwLCBnZXRNYXBib3ggfSA9IGdldENvbnRleHQoY29udGV4dE1hcGJveClcblxuICAgIGNvbnN0IG1hcCA9IGdldE1hcCgpXG4gICAgY29uc3QgbWFwYm94ID0gZ2V0TWFwYm94KClcblxuICAgIGV4cG9ydCBsZXQgbG5nXG4gICAgZXhwb3J0IGxldCBsYXRcbiAgICBleHBvcnQgbGV0IGxhYmVsID0gJ2xhYmVsJ1xuXG4gICAgY29uc3QgcG9wdXAgPSBuZXcgbWFwYm94LlBvcHVwKHsgb2Zmc2V0OiAyNSB9KS5zZXRUZXh0KGxhYmVsKVxuXG4gICAgY29uc3QgbWFya2VyID0gbmV3IG1hcGJveC5NYXJrZXIoKVxuICAgICAgICAgICAgLnNldExuZ0xhdChbbG5nLCBsYXRdKVxuICAgICAgICAgICAgLnNldFBvcHVwKHBvcHVwKVxuICAgICAgICAgICAgLmFkZFRvKG1hcClcbjwvc2NyaXB0PlxuXG4iLCIvKiFcbiAgQ29weXJpZ2h0IChjKSAyMDE3IEplZCBXYXRzb24uXG4gIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZSAoTUlUKSwgc2VlXG4gIGh0dHA6Ly9qZWR3YXRzb24uZ2l0aHViLmlvL2NsYXNzbmFtZXNcbiovXG4vKiBnbG9iYWwgZGVmaW5lICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgaGFzT3duID0ge30uaGFzT3duUHJvcGVydHk7XG5cblx0ZnVuY3Rpb24gY2xhc3NOYW1lcyAoKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSBbXTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0aWYgKCFhcmcpIGNvbnRpbnVlO1xuXG5cdFx0XHR2YXIgYXJnVHlwZSA9IHR5cGVvZiBhcmc7XG5cblx0XHRcdGlmIChhcmdUeXBlID09PSAnc3RyaW5nJyB8fCBhcmdUeXBlID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHRjbGFzc2VzLnB1c2goYXJnKTtcblx0XHRcdH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpICYmIGFyZy5sZW5ndGgpIHtcblx0XHRcdFx0dmFyIGlubmVyID0gY2xhc3NOYW1lcy5hcHBseShudWxsLCBhcmcpO1xuXHRcdFx0XHRpZiAoaW5uZXIpIHtcblx0XHRcdFx0XHRjbGFzc2VzLnB1c2goaW5uZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ1R5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzLnB1c2goa2V5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcy5qb2luKCcgJyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRjbGFzc05hbWVzLmRlZmF1bHQgPSBjbGFzc05hbWVzO1xuXHRcdG1vZHVsZS5leHBvcnRzID0gY2xhc3NOYW1lcztcblx0fSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gcmVnaXN0ZXIgYXMgJ2NsYXNzbmFtZXMnLCBjb25zaXN0ZW50IHdpdGggbnBtIHBhY2thZ2UgbmFtZVxuXHRcdGRlZmluZSgnY2xhc3NuYW1lcycsIFtdLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gY2xhc3NOYW1lcztcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cuY2xhc3NOYW1lcyA9IGNsYXNzTmFtZXM7XG5cdH1cbn0oKSk7XG4iLCJleHBvcnQgeyBkZWZhdWx0IGFzIGNsYXNzbmFtZXMgfSBmcm9tICdjbGFzc25hbWVzJ1xuXG5leHBvcnQgY29uc3QgdG9DU1NTdHJpbmcgPSAoc3R5bGVzID0ge30pID0+IE9iamVjdC5lbnRyaWVzKHN0eWxlcylcbiAgLmZpbHRlcigoW19wcm9wTmFtZSwgcHJvcFZhbHVlXSkgPT4gcHJvcFZhbHVlICE9PSB1bmRlZmluZWQgJiYgcHJvcFZhbHVlICE9PSBudWxsKVxuICAucmVkdWNlKChzdHlsZVN0cmluZywgW3Byb3BOYW1lLCBwcm9wVmFsdWVdKSA9PiB7XG4gICAgcHJvcE5hbWUgPSBwcm9wTmFtZS5yZXBsYWNlKC9bQS1aXS9nLCBtYXRjaCA9PiBgLSR7bWF0Y2gudG9Mb3dlckNhc2UoKX1gKVxuICAgIHJldHVybiBgJHtzdHlsZVN0cmluZ30ke3Byb3BOYW1lfToke3Byb3BWYWx1ZX07YFxuICB9LCAnJylcblxuLyoqXG4gKlxuICogQGZ1bmN0aW9uIHNhZmVHZXRcbiAqXG4gKiBAZGVzY3JpcHRpb24gU2FmZSBnZXR0aW5nIG9mIGFuIGFueSB2YWx1ZSBvZiBhIG5lc3RlZCBvYmplY3RzLlxuICpcbiAqIEBwYXJhbSBleHByZXNzaW9uRm4ge2Z1bmN0aW9ufSAtIFRoZSBmdW5jdGlvbiB3aXRoIGFuIGV4cHJlc3Npb24gd2hpY2ggcmV0dXJucyByZXN1bHQgb2YgdGhlIHNhZmUgZ2V0dGluZy5cbiAqIEBwYXJhbSBkZWZhdWx0VmFsdWUge2FueX0gLSBUaGUgZGVmYXVsdCB2YWx1ZSB3aGVuIHJlc3VsdCBpcyB1bmRlZmluZWQuXG4gKiBAcGFyYW0gaXNEZWZhdWx0VHlwZWQge2Jvb2xlYW59IC0gV2hldGVyIGlzIHRoZSByZXN1bHQgZnJvbSBhbiBleHByZXNzaW9uIG11c3QgYmUgdGhlIHNhbWUgdHlwZSBhcyB0aGUgZGVmYXVsdCB2YWx1ZS5cbiAqXG4gKiBAZXhhbXBsZXNcbiAqIC8vIFNvbWUgZGF0YS5cbiAqIGNvbnN0IHZlcnkgPSB7XG4gKiAgbmVzdGVkOiB7XG4gKiAgIG9iamVjdDogW3tcbiAqICAgICB3aXRoOiB7XG4gKiAgICAgICBhcnJheXM6ICdzdHVmZidcbiAqICAgICB9XG4gKiAgIH1dXG4gKiAgfVxuICogfVxuICpcbiAqIC8vIEdldHRpbmcuXG4gKiAxLiBzYWZlR2V0KCgpID0+IHZlcnkubmVzdGVkLm9iamVjdFswXS53aXRoLmFycmF5cyk7XG4gKiAyLiBzYWZlR2V0KCgpID0+IHZlcnkubmVzdGVkLm9iamVjdFswXS53aXRoLmFycmF5cywgeyBkZWZhdWx0OiAndmFsdWUnIH0pO1xuICogMy4gc2FmZUdldCgoKSA9PiB2ZXJ5Lm5lc3RlZC5vYmplY3RbMF0ud2l0aC5hcnJheXMsIHsgZGVmYXVsdDogJ3ZhbHVlJyB9LCB0cnVlKTtcbiAqXG4gKiAvLyBSZXR1cm4uXG4gKiAxLiAnc3R1ZmYnXG4gKiAyLiAnc3R1ZmYnXG4gKiAzLiB7IGRlZmF1bHQ6ICd2YWx1ZScgfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FmZUdldChleHByZXNzaW9uRm4sIGRlZmF1bHRWYWx1ZSwgaXNEZWZhdWx0VHlwZWQgPSBmYWxzZSkge1xuICAvLyBDaGVjayB3aGV0aGVyIGEgYW5kIGIgaGF2ZSB0aGUgc2FtZSB0eXBlLiAodXRpbClcbiAgZnVuY3Rpb24gaXNTYW1lVHlwZShhLCBiKSB7XG4gICAgY29uc3QgcnVsZXMgPSBbXG4gICAgICAoYSwgYikgPT4gdHlwZW9mIGEgPT09IHR5cGVvZiBiLFxuICAgICAgKGEsIGIpID0+ICgrYSA9PT0gYSkgPT09ICgrYiA9PT0gYiksICAgICAgICAgICAgICAvLyB3aGV0aGVyIG9uZSBpcyBOYU5cbiAgICAgIChhLCBiKSA9PiAoYSA9PT0gbnVsbCkgPT09IChiID09PSBudWxsKSwgICAgICAgICAgLy8gbnVsbCBpcyBvYmplY3QgdHlwZSB0b29cbiAgICAgIChhLCBiKSA9PiBBcnJheS5pc0FycmF5KGEpID09PSBBcnJheS5pc0FycmF5KGIpLCAgLy8gYXJyYXkgaXMgb2JqZWN0IHR5cGUgdG9vXG4gICAgXVxuICAgIHJldHVybiAhcnVsZXMuc29tZShydWxlRm4gPT4gIXJ1bGVGbihhLCBiKSlcbiAgfVxuICAvLyBDb3JlIG9mIHNhZmUgZ2V0dGluZy4gRXhlY3V0aW5nIGEgZnVuY3Rpb24uIERlZmF1bHQgdmFsdWVzLlxuICBmdW5jdGlvbiBnZXQoZXhwcmVzc2lvbkZuLCBkZWZhdWx0VmFsdWUsIGlzRGVmYXVsdFR5cGVkKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGV4cHJlc3Npb25Gbi5jYWxsKHRoaXMpXG4gICAgICBpZiAoaXNEZWZhdWx0VHlwZWQpIHtcbiAgICAgICAgcmV0dXJuIGlzU2FtZVR5cGUocmVzdWx0LCBkZWZhdWx0VmFsdWUpID8gcmVzdWx0IDogZGVmYXVsdFZhbHVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcmVzdWx0ID09PSB1bmRlZmluZWQgPyBkZWZhdWx0VmFsdWUgOiByZXN1bHRcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZGVmYXVsdFZhbHVlXG4gICAgfVxuICB9XG4gIC8vIFNhZmUgZ2V0dGluZyBvZiB0aGUgZXhwcmVzc2lvbkZuLlxuICBpZiAodHlwZW9mIGV4cHJlc3Npb25GbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBnZXQoZXhwcmVzc2lvbkZuLCBkZWZhdWx0VmFsdWUsIGlzRGVmYXVsdFR5cGVkKVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUud2FybignWW91IG5lZWQgdG8gdXNlIGEgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50LicpXG4gIH1cbiAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxufVxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBjbGFzc25hbWVzLCB0b0NTU1N0cmluZyB9IGZyb20gJy4uL3V0aWxzJ1xuXG4gICAgZXhwb3J0IGxldCB0eXBlXG4gICAgZXhwb3J0IGxldCBpcyAvLyBwcmltYXJ5fHdhcm5pbmd8ZGFuZ2VyfGxpZ2h0fGRhcmtcbiAgICBleHBvcnQgbGV0IHNpemUgPSAnbWVkaXVtJyAvLyBzbWFsbHxtZWRpdW18YmlnXG4gICAgZXhwb3J0IGxldCByb3RhdGUgPSAwXG4gICAgZXhwb3J0IGxldCBzdHlsZSA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaWQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBhcmlhTGFiZWwgPSB1bmRlZmluZWRcblxuICAgIGxldCB0aXRsZVByb3AgPSB0aXRsZSB8fCBhcmlhTGFiZWxcbiAgICBsZXQgYXJpYUxhYmVsUHJvcCA9IGFyaWFMYWJlbCB8fCB0aXRsZVxuICAgIGxldCBzdHlsZVByb3AgPSB0b0NTU1N0cmluZyh7IHRyYW5zZm9ybTogISFyb3RhdGUgPyBgcm90YXRlWigke3JvdGF0ZX1kZWcpYCA6IG51bGwsIC4uLnN0eWxlIH0pXG5cbiAgICAkOiAgY2xhc3NQcm9wID0gY2xhc3NuYW1lcygnaWNvJywgaXMsIHNpemUsICQkcHJvcHMuY2xhc3MpXG48L3NjcmlwdD5cblxuPHN2Z1xuICAgICAgICB7aWR9XG4gICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgIHN0eWxlPXtzdHlsZVByb3B9XG4gICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4+XG4gICAgPHVzZSB4bGluazpocmVmPXtgI2ljby0ke3R5cGV9YH0gY2xhc3M9XCJpY28tdXNlXCIvPlxuPC9zdmc+XG5cbjxzdHlsZT5cbiAgICBzdmcge1xuICAgICAgICBkaXNwbGF5OiBpbmhlcml0O1xuICAgIH1cblxuICAgIHN2Zywgc3ZnICoge1xuICAgICAgICBmaWxsOiByZ2JhKHZhcigtLXRoZW1lLXN2Zy1maWxsKSk7XG4gICAgICAgIHN0cm9rZTogcmdiYSh2YXIoLS10aGVtZS1zdmctZmlsbCkpO1xuICAgIH1cblxuICAgIC8qIC0tLS0tLS0tLS0tLT09PT09PT09PSggU2l6ZSApPT09PT09PT09LS0tLS0tLS0tLS0tICovXG4gICAgLnNtYWxsIHtcbiAgICAgICAgd2lkdGg6IDE1cHg7XG4gICAgICAgIGhlaWdodDogMTVweDtcbiAgICB9XG5cbiAgICAubWVkaXVtIHtcbiAgICAgICAgd2lkdGg6IDIycHg7XG4gICAgICAgIGhlaWdodDogMjJweDtcbiAgICB9XG5cbiAgICAuYmlnIHtcbiAgICAgICAgd2lkdGg6IDM1cHg7XG4gICAgICAgIGhlaWdodDogMzVweDtcbiAgICB9XG5cbiAgICAvKiAtLS0tLS0tLS0tLS09PT09PT09PT0oIENvbG9yICk9PT09PT09PT0tLS0tLS0tLS0tLS0gKi9cbiAgICAucHJpbWFyeSwgLnByaW1hcnkgKiB7XG4gICAgICAgIGZpbGw6IHJnYih2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgICAgIHN0cm9rZTogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG5cbiAgICAud2FybmluZywgLndhcm5pbmcgKiB7XG4gICAgICAgIGZpbGw6IHJnYih2YXIoLS1jb2xvci13YXJuaW5nKSk7XG4gICAgICAgIHN0cm9rZTogcmdiKHZhcigtLWNvbG9yLXdhcm5pbmcpKTtcbiAgICB9XG5cbiAgICAuZGFuZ2VyLCAuZGFuZ2VyICoge1xuICAgICAgICBmaWxsOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIHN0cm9rZTogcmdiKHZhcigtLWNvbG9yLWRhbmdlcikpO1xuICAgIH1cblxuICAgIC5pbmZvLCAuaW5mbyAqIHtcbiAgICAgICAgZmlsbDogcmdiKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgIH1cblxuICAgIC5saWdodCwgLmxpZ2h0ICoge1xuICAgICAgICBmaWxsOiB2YXIoLS1jb2xvci1saWdodC0xKTtcbiAgICAgICAgc3Ryb2tlOiB2YXIoLS1jb2xvci1saWdodC0xKTtcbiAgICB9XG5cbiAgICAuZGFyaywgLmRhcmsgKiB7XG4gICAgICAgIGZpbGw6IHZhcigtLWNvbG9yLWRhcmstMSk7XG4gICAgICAgIHN0cm9rZTogdmFyKC0tY29sb3ItZGFyay0xKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgSWNvbiBmcm9tICcuLi9jb21wb25lbnRzL0ljb24uc3ZlbHRlJ1xuXG4gICAgZXhwb3J0IGxldCBpcyA9ICdkYW5nZXInXG4gICAgZXhwb3J0IGxldCBzaXplID0gJ21lZGl1bScgLy8gc21hbGx8bWVkaXVtfG1pZ1xuPC9zY3JpcHQ+XG5cbjx1bCBjbGFzcz1cInJhdGVcIj5cbiAgICA8bGk+XG4gICAgICAgIDxJY29uIHtpc30ge3NpemV9IHR5cGU9XCJoZWFydC1maWxsZWRcIi8+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICAgIDxJY29uIHtpc30ge3NpemV9IHR5cGU9XCJoZWFydC1maWxsZWRcIi8+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICAgIDxJY29uIHtpc30ge3NpemV9IHR5cGU9XCJoZWFydC1maWxsZWRcIi8+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICAgIDxJY29uIHtpc30ge3NpemV9IHR5cGU9XCJoZWFydC1maWxsZWRcIi8+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICAgIDxJY29uIHtpc30ge3NpemV9IHR5cGU9XCJoZWFydC1maWxsZWRcIi8+XG4gICAgPC9saT5cbjwvdWw+XG5cbjxzdHlsZT5cbiAgICAucmF0ZSB7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICBtYXJnaW46IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogLTEgLyAzKTtcbiAgICB9XG5cbiAgICBsaSB7XG4gICAgICAgIHBhZGRpbmc6IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpIC8gMyk7XG4gICAgfVxuXG4gICAgLnJhdGUgbGkge1xuICAgICAgICAtd2Via2l0LWZpbHRlcjogZHJvcC1zaGFkb3coLTFweCAycHggMXB4IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuMjUpKTtcbiAgICAgICAgZmlsdGVyOiBkcm9wLXNoYWRvdygtMXB4IDJweCAxcHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4yNSkpO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbiAgICBpbXBvcnQgeyBjbGFzc25hbWVzLCB0b0NTU1N0cmluZyB9IGZyb20gJy4uL3V0aWxzJ1xuXG4gICAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gICAgZXhwb3J0IGxldCBuYW1lXG4gICAgZXhwb3J0IGxldCB2YWx1ZSA9ICcnXG4gICAgZXhwb3J0IGxldCBzdHlsZSA9IHt9XG4gICAgZXhwb3J0IGxldCB0eXBlID0gJ3RleHQnXG4gICAgZXhwb3J0IGxldCBpZCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgYWxpZ24gPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IG1heGxlbmd0aCA9IDEwMDBcbiAgICBleHBvcnQgbGV0IHJvd3MgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGRpc2FibGVkID0gZmFsc2VcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBpbnZhbGlkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBtaW4gPSB1bmRlZmluZWQgLy8gU3BlY2lmaWVzIGEgbWluaW11bSB2YWx1ZSBmb3IgYW4gPGlucHV0PiBlbGVtZW50XG4gICAgZXhwb3J0IGxldCBtYXggPSB1bmRlZmluZWQgLy8gU3BlY2lmaWVzIHRoZSBtYXhpbXVtIHZhbHVlIGZvciBhbiA8aW5wdXQ+IGVsZW1lbnRcbiAgICBleHBvcnQgbGV0IGxpc3QgPSB1bmRlZmluZWQgLy8gUmVmZXJzIHRvIGEgPGRhdGFsaXN0PiBlbGVtZW50IHRoYXQgY29udGFpbnMgcHJlLWRlZmluZWQgb3B0aW9ucyBmb3IgYW4gPGlucHV0PiBlbGVtZW50XG4gICAgZXhwb3J0IGxldCBmb3JtID0gdW5kZWZpbmVkIC8vIFNwZWNpZmllcyB0aGUgZm9ybSB0aGUgPGlucHV0PiBlbGVtZW50IGJlbG9uZ3MgdG9cbiAgICBleHBvcnQgbGV0IHJlYWRvbmx5ID0gdW5kZWZpbmVkIC8vIHVuZGVmaW5lZHxyZWFkb25seVxuICAgIGV4cG9ydCBsZXQgcmVxdWlyZWQgPSB1bmRlZmluZWQgLy8gdW5kZWZpbmVkfHJlcXVpcmVkXG4gICAgZXhwb3J0IGxldCBwYXR0ZXJuID0gdW5kZWZpbmVkIC8vIFNwZWNpZmllcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IGFuIDxpbnB1dD4gZWxlbWVudCdzIHZhbHVlIGlzIGNoZWNrZWQgYWdhaW5zdCAocmVnZXhwKVxuICAgIGV4cG9ydCBsZXQgYXV0b2NvbXBsZXRlID0gdHJ1ZSAvLyBvbnxvZmZcbiAgICBleHBvcnQgbGV0IGF1dG9zZWxlY3QgPSBmYWxzZVxuICAgIGV4cG9ydCBsZXQgYXJpYUxhYmVsID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBwbGFjZWhvbGRlciA9IHVuZGVmaW5lZFxuXG4gICAgbGV0IGlkUHJvcCA9IGlkIHx8IG5hbWVcbiAgICBsZXQgdHlwZVByb3AgPSB0eXBlID09PSAnbnVtYmVyJyA/ICd0ZXh0JyA6IHR5cGVcbiAgICBsZXQgdGl0bGVQcm9wID0gdGl0bGUgfHwgYXJpYUxhYmVsIHx8IHBsYWNlaG9sZGVyXG4gICAgbGV0IGFyaWFMYWJlbFByb3AgPSBhcmlhTGFiZWwgfHwgdGl0bGUgfHwgcGxhY2Vob2xkZXJcbiAgICBsZXQgYXV0b2NvbXBsZXRlUHJvcCA9IGF1dG9jb21wbGV0ZSA/ICdvbicgOiAnb2ZmJ1xuICAgIGxldCBzdHlsZVByb3AgPSB0b0NTU1N0cmluZyh7IC4uLnN0eWxlLCB0ZXh0QWxpZ246IGFsaWduIH0pXG4gICAgbGV0IHBhdHRlcm5Qcm9wID0gdHlwZSA9PT0gJ251bWJlcicgJiYgIXBhdHRlcm4gPyAnWzAtOV0qJyA6IHBhdHRlcm5cblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2lucCcsICQkcHJvcHMuY2xhc3MsIHsgZGlzYWJsZWQsIHJlYWRvbmx5LCByZXF1aXJlZCwgaW52YWxpZCB9KVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb24gRW1pdCBjbGljayBhbmQgc2VsZWN0IGNvbnRlbnQgd2hlbiBcImF1dG9zZWxlY3RcIiBpcyBlbmFibGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gTmF0aXZlIG1vdXNlIGV2ZW50LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG9uQ2xpY2soZSkge1xuICAgICAgICAhZGlzYWJsZWQgJiYgZGlzcGF0Y2goXCJjbGlja1wiLCBlKVxuICAgICAgICAhZGlzYWJsZWQgJiYgYXV0b3NlbGVjdCAmJiBlLnRhcmdldC5zZWxlY3QoKVxuICAgIH1cbjwvc2NyaXB0PlxuXG57I2lmIHJvd3N9XG4gICAgPHRleHRhcmVhXG4gICAgICAgICAgICB7bWlufVxuICAgICAgICAgICAge21heH1cbiAgICAgICAgICAgIHtyb3dzfVxuICAgICAgICAgICAge25hbWV9XG4gICAgICAgICAgICB7Zm9ybX1cbiAgICAgICAgICAgIHthbGlnbn1cbiAgICAgICAgICAgIHtyZWFkb25seX1cbiAgICAgICAgICAgIHtkaXNhYmxlZH1cbiAgICAgICAgICAgIHtyZXF1aXJlZH1cbiAgICAgICAgICAgIHttYXhsZW5ndGh9XG4gICAgICAgICAgICB7cGxhY2Vob2xkZXJ9XG4gICAgICAgICAgICBpZD17aWRQcm9wfVxuICAgICAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgICAgICBzdHlsZT17c3R5bGVQcm9wfVxuICAgICAgICAgICAgcGF0dGVybj17cGF0dGVyblByb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgYXV0b2NvbXBsZXRlPXthdXRvY29tcGxldGVQcm9wfVxuICAgICAgICAgICAgey4uLnsgdHlwZTogdHlwZVByb3AgfX1cbiAgICAgICAgICAgIGJpbmQ6dmFsdWVcbiAgICAgICAgICAgIG9uOmJsdXI9J3tlID0+ICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImJsdXJcIiwgZSl9J1xuICAgICAgICAgICAgb246Zm9jdXM9J3tlID0+ICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImZvY3VzXCIsIGUpfSdcbiAgICAgICAgICAgIG9uOmNsaWNrPSd7b25DbGlja30nXG4gICAgPjwvdGV4dGFyZWE+XG57OmVsc2V9XG4gICAgPGlucHV0XG4gICAgICAgICAgICB7bWlufVxuICAgICAgICAgICAge21heH1cbiAgICAgICAgICAgIHtuYW1lfVxuICAgICAgICAgICAge2xpc3R9XG4gICAgICAgICAgICB7Zm9ybX1cbiAgICAgICAgICAgIHthbGlnbn1cbiAgICAgICAgICAgIHtyZWFkb25seX1cbiAgICAgICAgICAgIHtkaXNhYmxlZH1cbiAgICAgICAgICAgIHtyZXF1aXJlZH1cbiAgICAgICAgICAgIHttYXhsZW5ndGh9XG4gICAgICAgICAgICB7cGxhY2Vob2xkZXJ9XG4gICAgICAgICAgICBpZD17aWRQcm9wfVxuICAgICAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgICAgICBzdHlsZT17c3R5bGVQcm9wfVxuICAgICAgICAgICAgcGF0dGVybj17cGF0dGVyblByb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgYXV0b2NvbXBsZXRlPXthdXRvY29tcGxldGVQcm9wfVxuICAgICAgICAgICAgey4uLnsgdHlwZTogdHlwZVByb3AgfX1cbiAgICAgICAgICAgIGJpbmQ6dmFsdWVcbiAgICAgICAgICAgIG9uOmJsdXI9J3tlID0+ICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImJsdXJcIiwgZSl9J1xuICAgICAgICAgICAgb246Zm9jdXM9J3tlID0+ICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImZvY3VzXCIsIGUpfSdcbiAgICAgICAgICAgIG9uOmNsaWNrPSd7b25DbGlja30nXG4gICAgLz5cbnsvaWZ9XG5cbjxzdHlsZT5cbiAgICAuaW5wIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGZsZXg6IDEgMSAwO1xuICAgICAgICBjb2xvcjogaW5oZXJpdDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG4gICAgICAgIG1pbi13aWR0aDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgICAgICBtaW4taGVpZ2h0OiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuMjUpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yKSk7XG4gICAgICAgIGJveC1zaGFkb3c6IGluc2V0IHZhcigtLXNoYWRvdy1wcmltYXJ5KSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeS1pbnNldCk7XG4gICAgfVxuXG4gICAgLmlucDpmb2N1cyB7XG4gICAgICAgIGJvcmRlci1jb2xvcjogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG5cbiAgICAuaW5wOmludmFsaWQsIC5pbnAuaW52YWxpZCB7XG4gICAgICAgIGJvcmRlci1jb2xvcjogcmdiKHZhcigtLWNvbG9yLWRhbmdlcikpO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbiAgICBpbXBvcnQgeyBjbGFzc25hbWVzIH0gZnJvbSAnLi4vdXRpbHMnXG5cbiAgICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgICBleHBvcnQgbGV0IHNyY1xuICAgIGV4cG9ydCBsZXQgYWx0XG4gICAgZXhwb3J0IGxldCBzcmNCaWcgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGlkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCB3aWR0aCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaGVpZ2h0ID0gdW5kZWZpbmVkXG5cbiAgICBsZXQgbG9hZGluZ1NyYyA9IHRydWVcbiAgICBsZXQgbG9hZGluZ1NyY0JpZyA9IHRydWVcbiAgICBsZXQgaXNFcnJvciA9IGZhbHNlXG5cbiAgICAkOiB3cmFwQ2xhc3NQcm9wID0gY2xhc3NuYW1lcygncGljdHVyZScsICQkcHJvcHMuY2xhc3MsIHsgbG9hZGluZ1NyYywgbG9hZGluZ1NyY0JpZywgaXNFcnJvciB9KVxuXG4gICAgZnVuY3Rpb24gb25Mb2FkU3JjKGUpIHtcbiAgICAgICAgbG9hZGluZ1NyYyA9IGZhbHNlXG4gICAgICAgIGRpc3BhdGNoKCdsb2FkJywgZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbkVycm9yU3JjKGUpIHtcbiAgICAgICAgbG9hZGluZ1NyYyA9IGZhbHNlXG4gICAgICAgIGlzRXJyb3IgPSB0cnVlXG4gICAgICAgIGRpc3BhdGNoKCdlcnJvcicsIGUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25Mb2FkU3JjQmlnKGUpIHtcbiAgICAgICAgbG9hZGluZ1NyY0JpZyA9IGZhbHNlXG4gICAgICAgIGRpc3BhdGNoKCdsb2FkQmlnJywgZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbkVycm9yU3JjQmlnKGUpIHtcbiAgICAgICAgbG9hZGluZ1NyY0JpZyA9IGZhbHNlXG4gICAgICAgIGlzRXJyb3IgPSB0cnVlXG4gICAgICAgIGRpc3BhdGNoKCdlcnJvckJpZycsIGUpXG4gICAgfVxuPC9zY3JpcHQ+XG5cbjxmaWd1cmUgY2xhc3M9e3dyYXBDbGFzc1Byb3B9PlxuICAgIDxpbWdcbiAgICAgICAgICAgIHtpZH1cbiAgICAgICAgICAgIHthbHR9XG4gICAgICAgICAgICB7c3JjfVxuICAgICAgICAgICAge3dpZHRofVxuICAgICAgICAgICAge2hlaWdodH1cbiAgICAgICAgICAgIGNsYXNzPVwicGljIHBpYy0xeFwiXG4gICAgICAgICAgICBvbjpsb2FkPXtvbkxvYWRTcmN9XG4gICAgICAgICAgICBvbjplcnJvcj17b25FcnJvclNyY31cbiAgICAvPlxuICAgIHsjaWYgc3JjQmlnICYmICFsb2FkaW5nU3JjfVxuICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAge2FsdH1cbiAgICAgICAgICAgICAgICB7d2lkdGh9XG4gICAgICAgICAgICAgICAge2hlaWdodH1cbiAgICAgICAgICAgICAgICBzcmM9e3NyY0JpZ31cbiAgICAgICAgICAgICAgICBjbGFzcz1cInBpYyBwaWMtMnhcIlxuICAgICAgICAgICAgICAgIG9uOmxvYWQ9e29uTG9hZFNyY0JpZ31cbiAgICAgICAgICAgICAgICBvbjplcnJvcj17b25FcnJvclNyY0JpZ31cbiAgICAgICAgLz5cbiAgICB7L2lmfVxuICAgIDxmaWdjYXB0aW9uPlxuICAgICAgICA8c2xvdD48L3Nsb3Q+XG4gICAgPC9maWdjYXB0aW9uPlxuPC9maWd1cmU+XG5cbjxzdHlsZT5cbiAgICAucGljdHVyZSB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICB9XG5cbiAgICAucGljdHVyZSAucGljIHtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBvYmplY3QtZml0OiBjb3ZlcjtcbiAgICAgICAgb2JqZWN0LXBvc2l0aW9uOiBjZW50ZXI7XG4gICAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgLjNzIGVhc2UtaW47XG4gICAgfVxuXG4gICAgLnBpY3R1cmUgLnBpYy0yeCB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgIH1cblxuICAgIC5waWN0dXJlLmxvYWRpbmdTcmMgLnBpYy0xeCxcbiAgICAucGljdHVyZS5sb2FkaW5nU3JjQmlnIC5waWMtMngge1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcbiAgICBpbXBvcnQgUGljdHVyZSBmcm9tICcuL1BpY3R1cmUuc3ZlbHRlJ1xuXG4gICAgZXhwb3J0IGxldCBzcmNcbiAgICBleHBvcnQgbGV0IGFsdFxuICAgIGV4cG9ydCBsZXQgc2l6ZSA9ICdtZWRpdW0nIC8vIHNtYWxsfG1lZGl1bXxiaWdcblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2F2YScsIHNpemUsICQkcHJvcHMuY2xhc3MpXG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz17Y2xhc3NQcm9wfT5cbiAgICA8UGljdHVyZSB7c3JjfSBhbHQ9e2BQaWN0dXJlOiAke2FsdH1gfS8+XG48L2Rpdj5cblxuPHN0eWxlPlxuICAgIC5hdmEge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAuc21hbGwge1xuICAgICAgICB3aWR0aDogMjVweDtcbiAgICAgICAgaGVpZ2h0OiAyNXB4O1xuICAgIH1cbiAgICAubWVkaXVtIHtcbiAgICAgICAgd2lkdGg6IDM1cHg7XG4gICAgICAgIGhlaWdodDogMzVweDtcbiAgICB9XG4gICAgLmJpZyB7XG4gICAgICAgIHdpZHRoOiA0NXB4O1xuICAgICAgICBoZWlnaHQ6IDQ1cHg7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcblxuICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAgIGV4cG9ydCBsZXQgaXMgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGlkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBocmVmID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBhdXRvID0gZmFsc2VcbiAgICBleHBvcnQgbGV0IHR5cGUgPSAnYnV0dG9uJ1xuICAgIGV4cG9ydCBsZXQgc2l6ZSA9ICdtZWRpdW0nXG4gICAgZXhwb3J0IGxldCB0aXRsZSA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaHRtbEZvciA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgZGlzYWJsZWQgPSBmYWxzZVxuICAgIGV4cG9ydCBsZXQgYXJpYUxhYmVsID0gdW5kZWZpbmVkXG5cbiAgICBsZXQgdGl0bGVQcm9wID0gdGl0bGUgfHwgYXJpYUxhYmVsXG4gICAgbGV0IGFyaWFMYWJlbFByb3AgPSBhcmlhTGFiZWwgfHwgdGl0bGVcblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2J0bicsIGlzLCBzaXplLCAkJHByb3BzLmNsYXNzLCB7IGF1dG8sIGRpc2FibGVkIH0pXG5cbiAgICBmdW5jdGlvbiBvbkxhYmVsQ2xpY2soZSkge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sRm9yKS5jbGljaygpXG4gICAgICAgICFkaXNhYmxlZCAmJiBkaXNwYXRjaCgnY2xpY2snLCBlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uQ2xpY2soZSkge1xuICAgICAgICAhZGlzYWJsZWQgJiYgZGlzcGF0Y2goJ2NsaWNrJywgZSlcbiAgICB9XG48L3NjcmlwdD5cblxueyNpZiBocmVmfVxuICAgIDxhXG4gICAgICAgICAgICB7aWR9XG4gICAgICAgICAgICB7aHJlZn1cbiAgICAgICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgICAgICBjbGFzcz17Y2xhc3NQcm9wfVxuICAgICAgICAgICAgYXJpYS1sYWJlbD17YXJpYUxhYmVsUHJvcH1cbiAgICAgICAgICAgIG9uOmNsaWNrPXtvbkNsaWNrfVxuICAgID5cbiAgICAgICAgPHNsb3Q+PC9zbG90PlxuICAgIDwvYT5cbns6ZWxzZSBpZiBodG1sRm9yfVxuICAgIDxsYWJlbFxuICAgICAgICAgICAge2lkfVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAgZm9yPXtodG1sRm9yfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgb246Y2xpY2s9e29uTGFiZWxDbGlja31cbiAgICA+XG4gICAgICAgIDxzbG90Pjwvc2xvdD5cbiAgICA8L2xhYmVsPlxuezplbHNlfVxuICAgIDxidXR0b25cbiAgICAgICAgICAgIHtpZH1cbiAgICAgICAgICAgIHt0eXBlfVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgb246Y2xpY2s9e29uQ2xpY2t9XG4gICAgPlxuICAgICAgICA8c2xvdD48L3Nsb3Q+XG4gICAgPC9idXR0b24+XG57L2lmfVxuXG48c3R5bGU+XG4gICAgLmJ0bjpub3QoLmF1dG8pIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgICAgcGFkZGluZzogNXB4IDE1cHg7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDNweDtcbiAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtZm9udC1jb2xvcikpO1xuICAgICAgICB0ZXh0LXNoYWRvdzogMXB4IDFweCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgLjMpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bi5zbWFsbCkge1xuICAgICAgICBwYWRkaW5nOiA1cHg7XG4gICAgICAgIG1pbi13aWR0aDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgLyAxLjUpO1xuICAgICAgICBtaW4taGVpZ2h0OiBjYWxjKHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKSAvIDEuNSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuLm1lZGl1bSkge1xuICAgICAgICBwYWRkaW5nOiA1cHggMTBweDtcbiAgICAgICAgbWluLXdpZHRoOiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4uYmlnKSB7XG4gICAgICAgIHBhZGRpbmc6IDVweCAxNXB4O1xuICAgICAgICBtaW4td2lkdGg6IGNhbGModmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpICogMS41KTtcbiAgICAgICAgbWluLWhlaWdodDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgKiAxLjUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bjpmb2N1cykge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4xKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG46aG92ZXIpIHtcbiAgICAgICAgYm94LXNoYWRvdzogMCAycHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMik7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjEpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bjphY3RpdmUpIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDFweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMXB4IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjIpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4xKTtcbiAgICB9XG5cbiAgICAvKiBTdWNjZXNzICovXG5cbiAgICAuYnRuLnN1Y2Nlc3Mge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MtZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC5idG4uc3VjY2Vzczpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itc3VjY2VzcyksIC44NSk7XG4gICAgfVxuXG4gICAgLmJ0bi5zdWNjZXNzOmhvdmVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDFweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3Itc3VjY2Vzcy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi5zdWNjZXNzOmFjdGl2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgycHgpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDFweCByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MtZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBXYXJuaW5nICovXG5cbiAgICAuYnRuLndhcm5pbmcge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLXdhcm5pbmctZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC5idG4ud2FybmluZzpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZyksIC44NSk7XG4gICAgfVxuXG4gICAgLmJ0bi53YXJuaW5nOmhvdmVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDFweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3Itd2FybmluZy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi53YXJuaW5nOmFjdGl2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgycHgpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDFweCByZ2JhKHZhcigtLWNvbG9yLXdhcm5pbmctZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBEYW5nZXIgKi9cblxuICAgIC5idG4uZGFuZ2VyIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZm9udC1saWdodCkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhbmdlcikpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLWRhbmdlci1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi5kYW5nZXI6Zm9jdXMge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhbmdlciksIC44NSk7XG4gICAgfVxuXG4gICAgLmJ0bi5kYW5nZXI6aG92ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMXB4KTtcbiAgICAgICAgYm94LXNoYWRvdzogMCAycHggcmdiYSh2YXIoLS1jb2xvci1kYW5nZXItZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC5idG4uZGFuZ2VyOmFjdGl2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgycHgpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDFweCByZ2JhKHZhcigtLWNvbG9yLWRhbmdlci1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgIH1cblxuXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIHtcbiAgICAgICAgOmdsb2JhbCguYnRuKSB7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLnN1Y2Nlc3Mge1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAzcHggcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSksIHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4ud2FybmluZyB7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDNweCByZ2JhKHZhcigtLWNvbG9yLXdhcm5pbmctZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLmJ0bi5kYW5nZXIge1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAzcHggcmdiYSh2YXIoLS1jb2xvci1kYW5nZXItZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICB9XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgdG9DU1NTdHJpbmcsIGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcblxuICAgIGV4cG9ydCBsZXQgaXMgPSAnaW5mbydcbiAgICBleHBvcnQgbGV0IHNpemUgPSAwXG4gICAgZXhwb3J0IGxldCB3aWR0aCA9IDJcblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2RpdmlkZXInLCBpcywgJCRwcm9wcy5jbGFzcylcbiAgICAkOiBzdHlsZVByb3AgPSB0b0NTU1N0cmluZyh7IHBhZGRpbmc6IGAke3NpemUgLyAyfXB4IDBgLCBoZWlnaHQ6IGAke3dpZHRofXB4YCB9KVxuPC9zY3JpcHQ+XG5cbjxociBjbGFzcz17Y2xhc3NQcm9wfSBzdHlsZT17c3R5bGVQcm9wfT5cblxuPHN0eWxlPlxuICAgIC5kaXZpZGVyIHtcbiAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgIGJveC1zaXppbmc6IGNvbnRlbnQtYm94O1xuICAgICAgICBiYWNrZ3JvdW5kLWNsaXA6IGNvbnRlbnQtYm94O1xuICAgIH1cblxuICAgIC5pbmZvIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICB9XG5cbiAgICAuc3VjY2VzcyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgfVxuXG4gICAgLndhcm5pbmcge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgIH1cblxuICAgIC5kYW5nZXIge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMsIHNhZmVHZXQgfSBmcm9tICcuLi91dGlscydcblxuICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAgIGV4cG9ydCBsZXQgaWQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHZhbHVlID0gMCAvLyAwIC0gMTAwXG4gICAgZXhwb3J0IGxldCBzaXplID0gJ21lZGl1bSdcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBhcmlhTGFiZWwgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGJvcmRlclJhZGl1cyA9IHVuZGVmaW5lZFxuXG4gICAgJDogdmFsID0gMFxuICAgICQ6IHRpdGxlUHJvcCA9IHRpdGxlIHx8IGBQcm9ncmVzcyAtICR7dmFsfSVgXG4gICAgJDogYXJpYUxhYmVsUHJvcCA9IGFyaWFMYWJlbCB8fCBgUHJvZ3Jlc3MgLSAke3ZhbH0lYFxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ3Byb2dyZXNzJywgc2l6ZSwgJCRwcm9wcy5jbGFzcylcblxuICAgIG9uTW91bnQoKCkgPT4ge1xuICAgICAgICAvLyBNYWtlIGxvYWRpbmcgcHJvZ3Jlc3MgZWZmZWN0IG9uIG1vdW50IGNvbXBvbmVudC5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB2YWwgPSBOdW1iZXIuaXNGaW5pdGUoK3ZhbHVlKSA/IE1hdGgubWF4KDAsIE1hdGgubWluKCt2YWx1ZSwgMTAwKSkgOiAwLCAwKVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBnZXRCb3JkZXJSYWRpdXMoYm9yZGVycywgZGVmYXVsdHMgPSAnOTk5OTlweCcpIHtcbiAgICAgICAgY29uc3QgYnJEZWZhdWx0ID0gbmV3IEFycmF5KDQpLmZpbGwoZGVmYXVsdHMpXG4gICAgICAgIGNvbnN0IGJkcyA9IHNhZmVHZXQoKCkgPT4gYm9yZGVycy5zcGxpdCgnICcpLCBbXSwgdHJ1ZSlcbiAgICAgICAgY29uc3QgcnVsZSA9ICdib3JkZXItcmFkaXVzJ1xuICAgICAgICByZXR1cm4gYCR7cnVsZX06JHtickRlZmF1bHQubWFwKChkZWYsIGkpID0+IGAke2Jkc1tpXSB8fCBkZWZ9YCkuam9pbignICcpfWBcbiAgICB9XG48L3NjcmlwdD5cblxuXG48ZGl2XG4gICAgICAgIHtpZH1cbiAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgYXJpYS1sYWJlbD17YXJpYUxhYmVsUHJvcH1cbiAgICAgICAgcm9sZT1cInByb2dyZXNzYmFyXCJcbiAgICAgICAgYXJpYS12YWx1ZW1pbj1cIjBcIlxuICAgICAgICBhcmlhLXZhbHVlbWF4PVwiMTAwXCJcbiAgICAgICAgYXJpYS12YWx1ZW5vdz17dmFsfVxuICAgICAgICBzdHlsZT17YCR7Z2V0Qm9yZGVyUmFkaXVzKGJvcmRlclJhZGl1cyl9YH1cbj5cbiAgICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtaW5uZXItZnJhbWVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInByb2dyZXNzLWNvcmVcIiBzdHlsZT17YHdpZHRoOiR7dmFsfSVgfT48L2Rpdj5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuXG48c3R5bGU+XG4gICAgLnByb2dyZXNzIHtcbiAgICAgICAgLS1wcm9ncmVzcy1oZWlnaHQ6IDIwcHg7XG4gICAgICAgIC0tcHJvZ3Jlc3MtcGFkZGluZy1wb2ludDogMztcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3Muc21hbGwge1xuICAgICAgICAtLXByb2dyZXNzLWhlaWdodDogMTVweDtcbiAgICAgICAgLS1wcm9ncmVzcy1wYWRkaW5nLXBvaW50OiAzO1xuICAgIH1cblxuICAgIC5wcm9ncmVzcy5tZWRpdW0ge1xuICAgICAgICAtLXByb2dyZXNzLWhlaWdodDogMjBweDtcbiAgICAgICAgLS1wcm9ncmVzcy1wYWRkaW5nLXBvaW50OiAzLjU7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzLmJpZyB7XG4gICAgICAgIC0tcHJvZ3Jlc3MtaGVpZ2h0OiAzMHB4O1xuICAgICAgICAtLXByb2dyZXNzLXBhZGRpbmctcG9pbnQ6IDQ7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzIHtcbiAgICAgICAgZmxleDogMDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDk5OTlweDtcbiAgICAgICAgaGVpZ2h0OiB2YXIoLS1wcm9ncmVzcy1oZWlnaHQpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yKSk7XG4gICAgICAgIHBhZGRpbmc6IGNhbGModmFyKC0tcHJvZ3Jlc3MtaGVpZ2h0KSAvIHZhcigtLXByb2dyZXNzLXBhZGRpbmctcG9pbnQpKTtcbiAgICAgICAgYm94LXNoYWRvdzogaW5zZXQgdmFyKC0tc2hhZG93LXByaW1hcnkpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5LWluc2V0KTtcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3MtaW5uZXItZnJhbWUge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA5OTk5cHg7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzLWNvcmUge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICB0cmFuc2l0aW9uOiAxcyBlYXNlLWluLW91dDtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogMnB4O1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgUGljdHVyZSBmcm9tICcuL1BpY3R1cmUuc3ZlbHRlJ1xuXG4gICAgY29uc3QgY2FyZHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwLzMwL3RlY2gnLFxuICAgICAgICAgICAgdGl0bGU6ICdUaGUgbWFpbiB0aXRsZSBhbmQgc2hvcnQgZGVzY3JpcHRpb24uJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDQ1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMC8zMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIGNoYXJpdHkgb2YgQ2hhcml0aWZ5LicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwLzMwL2FyY2gnLFxuICAgICAgICAgICAgdGl0bGU6ICdTZWNvbmQgYmlnZ2VyIG1ham9yIGNhcmQgdGl0bGUgbGluZSB3aXRoIGEgYml0IGxvbmdlciBkZXNjcmlwdGlvbi4nLFxuICAgICAgICAgICAgcGVyY2VudDogNjUsXG4gICAgICAgICAgICBvcmdIZWFkOiAnVGluYSBLYW5kZWxha2knLFxuICAgICAgICAgICAgb3JnSGVhZFNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwLzMwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdPUkcgY2hhcml0eSBvZiBDaGFyaXRpZnkuJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAvMzAvYW55JyxcbiAgICAgICAgICAgIHRpdGxlOiAnVGhlIG1haW4gdGl0bGUgYW5kIHNob3J0IGRlc2NyaXB0aW9uLicsXG4gICAgICAgICAgICBwZXJjZW50OiA1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmFyYW1pc2ltdXNzIEthbmRlbGFraW51c2thcycsXG4gICAgICAgICAgICBvcmdIZWFkU3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAvMzAvcGVvcGxlJyxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbjogJ09SRyBjaGFyaXR5IG9mIENoYXJpdGlmeS4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMC8zMC9uYXR1cmUnLFxuICAgICAgICAgICAgdGl0bGU6ICdUaGUgbWFpbiB0aXRsZSBhbmQgc2hvcnQgZGVzY3JpcHRpb24uJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDk1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMC8zMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIGdpYW50IGNoYXJpdHkgb3JnYW5pemF0aW9uIG9mIGJpZyBDaGFyaXRpZnkgY29tcGFueS4nLFxuICAgICAgICB9LFxuICAgIF1cblxuICAgIGNvbnN0IGltYWdlc0RlZmF1bHQgPSBjYXJkcy5tYXAoY2FyZCA9PiAoe1xuICAgICAgICBzcmM6IFtjYXJkLnNyYywgY2FyZC5zcmMsIGNhcmQuc3JjXSxcbiAgICAgICAgYWx0OiBjYXJkLnRpdGxlLFxuICAgIH0pKVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAdHlwZSB7bnVtYmVyIHwge1xuICAgICAqICAgICBzcmM6IHN0cmluZyxcbiAgICAgKiAgICAgc3JjQmlnOiBzdHJpbmcsXG4gICAgICogICAgIGFsdDogc3RyaW5nLFxuICAgICAqICAgICBvbkNsaWNrPzogZnVuY3Rpb24sXG4gICAgICogfVtdfVxuICAgICAqL1xuICAgIGV4cG9ydCBsZXQgaXRlbXMgPSBpbWFnZXNEZWZhdWx0XG48L3NjcmlwdD5cblxuPHVsIGFyaWEtbGFiZWw9XCJjYXJvdXNlbFwiPlxuICAgIHsjZWFjaCBpdGVtcyBhcyBpdGVtfVxuICAgICAgICA8bGk+XG4gICAgICAgICAgICA8c2xvdCB7aXRlbX0+XG4gICAgICAgICAgICAgICAgPFBpY3R1cmUgey4uLml0ZW19Lz5cbiAgICAgICAgICAgIDwvc2xvdD5cbiAgICAgICAgPC9saT5cbiAgICB7L2VhY2h9XG48L3VsPlxuXG48c3R5bGU+XG4gICAgdWwge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICAgICAgb3ZlcmZsb3cteTogaGlkZGVuO1xuICAgICAgICBvdmVyZmxvdy14OiBhdXRvO1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAycHg7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG4gICAgICAgIC13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOiB0b3VjaDtcbiAgICAgICAgc2Nyb2xsLXNuYXAtdHlwZTogeCBtYW5kYXRvcnk7XG4gICAgfVxuXG4gICAgbGkge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICAgICAgc2Nyb2xsLXNuYXAtYWxpZ246IGNlbnRlcjtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBJY29uLCBCdXR0b24sIEF2YXRhciB9IGZyb20gJy4uL2NvbXBvbmVudHMnXG5cbiAgICBleHBvcnQgbGV0IHNlZ21lbnRcblxuICAgIGxldCBpc0RhcmtUaGVtZSA9IGZhbHNlXG5cbiAgICBsZXQgdmFsdWUgPSAndWEnXG5cbiAgICBmdW5jdGlvbiBjaGFuZ2VUaGVtZSgpIHtcbiAgICAgICAgaXNEYXJrVGhlbWUgPSAhaXNEYXJrVGhlbWVcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCd0aGVtZS1kYXJrJylcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCd0aGVtZS1saWdodCcpXG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChpc0RhcmtUaGVtZSA/ICd0aGVtZS1kYXJrJyA6ICd0aGVtZS1saWdodCcpXG4gICAgfVxuPC9zY3JpcHQ+XG5cbjxuYXYgY2xhc3M9XCJ0aGVtZS1iZyBjb250YWluZXJcIj5cbiAgICA8dWw+XG4gICAgICAgIDxsaT48YSByZWw9cHJlZmV0Y2ggaHJlZj0nLicgY2xhc3M6c2VsZWN0ZWQ9J3tzZWdtZW50ID09PSB1bmRlZmluZWR9Jz5ob21lPC9hPjwvbGk+XG4gICAgICAgIDxsaT48YSBocmVmPSdtYXAnIGNsYXNzOnNlbGVjdGVkPSd7c2VnbWVudCA9PT0gXCJtYXBcIn0nPm1hcDwvYT48L2xpPlxuICAgICAgICA8bGk+PGEgcmVsPXByZWZldGNoIGhyZWY9J2xpc3RzL2NoYXJpdGllcycgY2xhc3M6c2VsZWN0ZWQ9J3tzZWdtZW50ID09PSBcImxpc3RzXCJ9Jz5saXN0czwvYT48L2xpPlxuICAgICAgICA8bGk+PGEgcmVsPXByZWZldGNoIGhyZWY9J2NoYXJpdHknIGNsYXNzOnNlbGVjdGVkPSd7c2VnbWVudCA9PT0gXCJjaGFyaXR5XCJ9Jz5jaGFyaXR5PC9hPjwvbGk+XG4gICAgICAgIDxsaT48YSByZWw9cHJlZmV0Y2ggaHJlZj0nb3JnYW5pemF0aW9uJyBjbGFzczpzZWxlY3RlZD0ne3NlZ21lbnQgPT09IFwib3JnYW5pemF0aW9uXCJ9Jz5vcmc8L2E+PC9saT5cbiAgICA8L3VsPlxuXG4gICAgPHVsIGNsYXNzPVwibmF2LWFjdGlvbnNcIj5cbiAgICAgICAgPGxpPlxuICAgICAgICAgICAgPHNlbGVjdCB7dmFsdWV9IG5hbWU9XCJsYW5nXCIgaWQ9XCJsYW5nXCIgY2xhc3M9XCJidG4gc21hbGwgbGFuZy1zZWxlY3RcIj5cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwidWFcIj5VYTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJydVwiPlJ1PC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImVuXCI+RW48L29wdGlvbj5cbiAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2xpPlxuXG4gICAgICAgIDxsaT5cbiAgICAgICAgICAgIDxCdXR0b24gb246Y2xpY2s9e2NoYW5nZVRoZW1lfSBhdXRvIHNpemU9XCJzbWFsbFwiPlxuICAgICAgICAgICAgICAgIDxJY29uIHR5cGU9XCJtb29uXCIgY2xhc3M9XCJ0aGVtZS1zdmctZmlsbFwiLz5cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8L2xpPlxuXG4gICAgICAgIDxsaT5cbiAgICAgICAgICAgIDxCdXR0b24gb246Y2xpY2s9e2NoYW5nZVRoZW1lfSBhdXRvIHNpemU9XCJzbWFsbFwiPlxuICAgICAgICAgICAgICAgIDxBdmF0YXIgc2l6ZT1cInNtYWxsXCIgc3JjPVwiaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGVcIi8+XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgPC9saT5cbiAgICA8L3VsPlxuPC9uYXY+XG5cbjxzdHlsZT5cbiAgICBuYXYge1xuICAgICAgICBwb3NpdGlvbjogc3RpY2t5O1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIHotaW5kZXg6IDEwO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpLCAuMSk7XG4gICAgfVxuXG4gICAgLnNlbGVjdGVkIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfVxuXG4gICAgLnNlbGVjdGVkOjphZnRlciB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgY29udGVudDogXCJcIjtcbiAgICAgICAgd2lkdGg6IGNhbGMoMTAwJSAtIDFlbSk7XG4gICAgICAgIGhlaWdodDogMnB4O1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICBib3R0b206IC0xcHg7XG4gICAgfVxuXG4gICAgYSB7XG4gICAgICAgIHBhZGRpbmc6IC44ZW0gMC41ZW07XG4gICAgfVxuXG4gICAgLm5hdi1hY3Rpb25zIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgbWFyZ2luOiAtM3B4O1xuICAgIH1cblxuICAgIC5uYXYtYWN0aW9ucyBsaSB7XG4gICAgICAgIHBhZGRpbmc6IDNweDtcbiAgICB9XG5cbiAgICAubGFuZy1zZWxlY3Qge1xuICAgICAgICBwYWRkaW5nOiA1cHg7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICAgIH1cblxuICAgIC5sYW5nLXNlbGVjdDpob3ZlcixcbiAgICAubGFuZy1zZWxlY3Q6Zm9jdXMge1xuICAgICAgICBib3gtc2hhZG93OiBub25lO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4xKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cblxuPC9zY3JpcHQ+XG5cbjxmb290ZXI+XG4gICAgPHA+wqkgMjAxOSAtIHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9PC9wPlxuPC9mb290ZXI+XG5cbjxzdHlsZT5cbiAgICBmb290ZXIge1xuICAgICAgICBwYWRkaW5nOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDIpIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICAgICAgYm94LXNoYWRvdzogaW5zZXQgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yKSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgQXZhdGFyIH0gZnJvbSAnLi4vY29tcG9uZW50cydcblxuICAgIGV4cG9ydCBsZXQgc3JjID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCB0aXRsZSA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgc3VidGl0bGUgPSB1bmRlZmluZWRcbjwvc2NyaXB0PlxuXG48c2VjdGlvbj5cbiAgICA8QXZhdGFyIHNyYz17c3JjfSBhbHQ9e3RpdGxlfSBjbGFzcz1cImNvbW1lbnQtYXZhXCIvPlxuXG4gICAgPGRpdj5cbiAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICA8aDQ+e3RpdGxlfTwvaDQ+XG4gICAgICAgICAgICA8c3ViPntzdWJ0aXRsZX08L3N1Yj5cbiAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgIDxiciBjbGFzcz1cInNtYWxsXCI+XG5cbiAgICAgICAgPHNsb3Q+XG4gICAgICAgICAgICA8cHJlPlxuICAgICAgICAgICAgICAgIEEgbG9vb29vb29vb29uZyBjb21tZW50IHRoYXQgaGFzIGJlZW5cbiAgICAgICAgICAgICAgICBsZWZ0IGJ5IGEgdmVyeSBhbmdyeSBndXkgd2hvIGNvbXBsYWlucyB1cG9uXG4gICAgICAgICAgICAgICAgbG9vb29vbmcgY29tbWVudHMuXG4gICAgICAgICAgICA8L3ByZT5cbiAgICAgICAgPC9zbG90PlxuICAgIDwvZGl2PlxuPC9zZWN0aW9uPlxuXG48c3R5bGU+XG4gICAgc2VjdGlvbiB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIH1cblxuICAgIGRpdiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgIH1cblxuICAgIHNwYW4gaDQsXG4gICAgc3BhbiBzdWIge1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICAgIGxpbmUtaGVpZ2h0OiAxO1xuICAgICAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIH1cblxuICAgIHByZSB7XG4gICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgICAgICBmb250LXNpemU6IC44MjVlbTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuMjtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBBdmF0YXIgfSBmcm9tICcuLi9jb21wb25lbnRzJ1xuXG4gICAgZXhwb3J0IGxldCBzcmMgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBzdWJ0aXRsZSA9IHVuZGVmaW5lZFxuPC9zY3JpcHQ+XG5cbjxzZWN0aW9uPlxuICAgIDxBdmF0YXIgc3JjPXtzcmN9IGFsdD17dGl0bGV9Lz5cblxuICAgIDxzcGFuPlxuICAgICAgICA8aDQ+e3RpdGxlfTwvaDQ+XG4gICAgICAgIDxzdWI+e3N1YnRpdGxlfTwvc3ViPlxuICAgIDwvc3Bhbj5cbjwvc2VjdGlvbj5cblxuPHN0eWxlPlxuICAgIHNlY3Rpb24ge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIH1cblxuICAgIHNwYW4ge1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBwYWRkaW5nOiAwIDhweDtcbiAgICB9XG5cbiAgICBzcGFuIGg0LFxuICAgIHNwYW4gc3ViIHtcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuNDtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgQXZhdGFyQW5kTmFtZSBmcm9tICcuL0F2YXRhckFuZE5hbWUuc3ZlbHRlJ1xuXG4gICAgZXhwb3J0IGxldCBpdGVtcyA9IFtdXG48L3NjcmlwdD5cblxueyNlYWNoIGl0ZW1zIGFzIGl0ZW19XG4gICAgPHNlY3Rpb24gY2xhc3M9XCJpdGVtIGNvbnRhaW5lclwiPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxBdmF0YXJBbmROYW1lXG4gICAgICAgICAgICAgICAgc3JjPXtpdGVtLm9yZ0hlYWRTcmN9XG4gICAgICAgICAgICAgICAgdGl0bGU9e2l0ZW0ub3JnSGVhZH1cbiAgICAgICAgICAgICAgICBzdWJ0aXRsZT17aXRlbS5vcmdhbml6YXRpb259XG4gICAgICAgIC8+XG4gICAgICAgIDxicj5cbiAgICA8L3NlY3Rpb24+XG4gICAgPGJyPlxuezplbHNlfVxuICAgIDxzZWN0aW9uIGNsYXNzPVwiaXRlbSBjb250YWluZXJcIj5cbiAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiPk5vIG9yZ2FuaXphdGlvbnM8L3A+XG4gICAgPC9zZWN0aW9uPlxuey9lYWNofVxuXG48c3R5bGU+XG4gICAgLml0ZW0ge1xuICAgICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvcikpO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IFJhdGUsIFByb2dyZXNzLCBBdmF0YXIsIENhcm91c2VsIH0gZnJvbSAnLi4vY29tcG9uZW50cydcbiAgICBpbXBvcnQgQXZhdGFyQW5kTmFtZSBmcm9tICcuL0F2YXRhckFuZE5hbWUuc3ZlbHRlJ1xuXG4gICAgZXhwb3J0IGxldCBzcmMgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBwZXJjZW50ID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBvcmdIZWFkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBvcmdIZWFkU3JjID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBvcmdhbml6YXRpb24gPSB1bmRlZmluZWRcblxuICAgICQ6IGltYWdlcyA9IG5ldyBBcnJheSg0KS5maWxsKHtcbiAgICAgICAgc3JjLFxuICAgICAgICBhbHQ6IHRpdGxlLFxuICAgIH0pXG48L3NjcmlwdD5cblxuPHNlY3Rpb24gY2xhc3M9XCJjYXJkXCI+XG4gICAgPGRpdiBjbGFzcz1cImltYWdlcy13cmFwXCI+XG4gICAgICAgIDxDYXJvdXNlbCBpdGVtcz17aW1hZ2VzfS8+XG4gICAgPC9kaXY+XG5cbiAgICA8UHJvZ3Jlc3MgdmFsdWU9e3BlcmNlbnR9IGJvcmRlclJhZGl1cz1cIjAgMFwiLz5cblxuICAgIDxoND57dGl0bGV9PC9oND5cblxuICAgIDxkaXYgY2xhc3M9XCJyYXRlLXdyYXBcIj5cbiAgICAgICAgPFJhdGUgc2l6ZT1cInNtYWxsXCIvPlxuICAgIDwvZGl2PlxuXG4gICAgPGZvb3Rlcj5cbiAgICAgICAgPEF2YXRhckFuZE5hbWUgc3JjPXtvcmdIZWFkU3JjfSB0aXRsZT17b3JnSGVhZH0gc3VidGl0bGU9e29yZ2FuaXphdGlvbn0vPlxuICAgIDwvZm9vdGVyPlxuPC9zZWN0aW9uPlxuXG48c3R5bGU+XG4gICAgLmNhcmQge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgIH1cblxuICAgIC5yYXRlLXdyYXAge1xuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmctdG9wOiA2cHg7XG4gICAgfVxuXG4gICAgLmltYWdlcy13cmFwIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgaGVpZ2h0OiAxMDBweDtcbiAgICB9XG5cbiAgICBoNCB7XG4gICAgICAgIC0tY2FyZC1saW5lLWhlaWdodDogMS40O1xuXG4gICAgICAgIGZvbnQtc2l6ZTogLjhlbTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IHZhcigtLWNhcmQtbGluZS1oZWlnaHQpO1xuICAgICAgICBoZWlnaHQ6IGNhbGModmFyKC0tZm9udC1zaXplKSAqICh2YXIoLS1jYXJkLWxpbmUtaGVpZ2h0KSAvIDEuMikgKiAyKTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBEaXZpZGVyIH0gZnJvbSAnLi4vY29tcG9uZW50cydcbiAgICBpbXBvcnQgQ2hhcml0eUNhcmQgZnJvbSAnLi4vbGF5b3V0cy9DaGFyaXR5Q2FyZC5zdmVsdGUnXG5cbiAgICBleHBvcnQgbGV0IGxpc3ROYW1lXG4gICAgZXhwb3J0IGxldCBhbW91bnQgPSAyXG5cbiAgICAkOiBjYXJkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC90ZWNoJyxcbiAgICAgICAgICAgIHRpdGxlOiAnVGhpcyBwZXJzb24gbmVlZHMgeW91ciBoZWxwJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDQ1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdIZWFkIG9mIHRoZSBvcmdhbml6YXRpb24gd2l0aCBsb29vb29vb29uZy1uYWFhYWFhbWVkIGNoYXJpdHknLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL2FyY2gnLFxuICAgICAgICAgICAgdGl0bGU6ICdBbm90aGVyIHBlcnNvbiB3aG8gbmVlZHMgeW91ciBxdWljayBoZWxwJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDY1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdIZWFkIG9mIGFub3RoZXIgb3JnYW5pemF0aW9uJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9hbnknLFxuICAgICAgICAgICAgdGl0bGU6ICdUaGUgcGVyc29uIHdpdGggdGhlIGxvbmdlc3QgbmFtZSBpcyBhbHNvIHdhaXQgZm9yIHlvdScsXG4gICAgICAgICAgICBwZXJjZW50OiA1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmFyYW1pc2ltdXNzIGVsLWRlLWxhIEthbmRlbGFraW51c2thcycsXG4gICAgICAgICAgICBvcmdIZWFkU3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIG9mIGNoYXJpdHknLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL25hdHVyZScsXG4gICAgICAgICAgICB0aXRsZTogJ05lZWRzJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDk1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdPUkcgZ2lhbnQgY2hhcml0eSBvcmdhbml6YXRpb24gb2YgYmlnIENoYXJpdGlmeSBjb21wYW55JyxcbiAgICAgICAgfSxcbiAgICBdLnNsaWNlKE51bWJlci5pc0Zpbml0ZSgrYW1vdW50KSA/ICthbW91bnQgOiAwKVxuXG4gICAgJDogaW1hZ2VzID0gY2FyZHMubWFwKGNhcmQgPT4gKHtcbiAgICAgICAgc3JjOiBbY2FyZC5zcmMsIGNhcmQuc3JjLCBjYXJkLnNyY10sXG4gICAgICAgIGFsdDogY2FyZC50aXRsZSxcbiAgICB9KSlcbjwvc2NyaXB0PlxuXG48c2VjdGlvbj5cbiAgICB7I2lmIGxpc3ROYW1lfVxuICAgICAgICA8RGl2aWRlciBzaXplPVwiMTZcIi8+XG4gICAgICAgIDxoMyBjbGFzcz1cImgyIHRleHQtcmlnaHRcIj57bGlzdE5hbWV9PC9oMz5cbiAgICAgICAgPERpdmlkZXIgc2l6ZT1cIjIwXCIvPlxuICAgICAgICA8YnI+XG4gICAgey9pZn1cbiAgICA8dWwgY2xhc3M9XCJjYXJkc1wiPlxuICAgICAgICB7I2VhY2ggY2FyZHMgYXMgY2FyZH1cbiAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICA8Q2hhcml0eUNhcmQgey4uLmNhcmR9Lz5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgIHsvZWFjaH1cbiAgICA8L3VsPlxuPC9zZWN0aW9uPlxuXG48c3R5bGU+XG4gICAgc2VjdGlvbiB7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBwYWRkaW5nOiAwIDEwcHg7XG4gICAgfVxuXG4gICAgLmNhcmRzIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgICAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmc6IHZhcigtLXNjcmVlbi1wYWRkaW5nKSAwO1xuICAgICAgICBtYXJnaW46IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogLTMpIGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogLTEpO1xuICAgIH1cblxuICAgIC5jYXJkcyBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICAgICAgd2lkdGg6IDUwJTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgcGFkZGluZzogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAzKSB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgfVxuXG4gICAgLmNhcmRzIGxpOmhvdmVyIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAuMSlcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBleHBvcnQgbGV0IHRpdGxlID0gJ1RoZSBtYWluIHRpdGxlIHRoYXQgZXhwbGFpbnMgdGhlIGNoYXJpdHknXG4gICAgZXhwb3J0IGxldCBzdWJ0aXRsZSA9ICdBbmQgYmlnZ2VyIGRlc2NyaXB0aW9uIHRoYXQgZGVzY3JpYmVzIGluIHNob3J0IGtleXdvcmRzIGEgY2hhcml0eSwgdGl0bGUgYWJvdmUgYW5kIGp1c3QgbWFrZXMgdGV4dCBsb25nZXInXG48L3NjcmlwdD5cblxuPHNlY3Rpb24+XG4gICAgPGgxPnt0aXRsZX08L2gxPlxuICAgIDxicj5cbiAgICA8aDI+e3N1YnRpdGxlfTwvaDI+XG48L3NlY3Rpb24+XG5cbjxzdHlsZT5cbiAgICBzZWN0aW9uIHtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBwYWRkaW5nOiAwIDN2dztcbiAgICB9XG5cbiAgICBoMiB7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA0MDA7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgSW5wdXQsIEJ1dHRvbiB9IGZyb20gJy4uL2NvbXBvbmVudHMnXG48L3NjcmlwdD5cblxuPHVsPlxuICAgIDxsaT5cbiAgICAgICAgPEJ1dHRvbiBpcz1cInN1Y2Nlc3NcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiPnRlc3QxPC9CdXR0b24+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICAgIDxCdXR0b24gaXM9XCJzdWNjZXNzXCIgb246Y2xpY2s9XCJ7ZSA9PiBjb25zb2xlLmxvZyhlKX1cIj50ZXN0MTI8L0J1dHRvbj5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEJ1dHRvbiBpcz1cInN1Y2Nlc3NcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiPnRlc3QxMjM8L0J1dHRvbj5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPGJyPlxuICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICBuYW1lPVwibnVtXCJcbiAgICAgICAgICAgICAgICBsaXN0PVwic3VtLXN1Z2dlc3Rpb25zXCJcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk51bVwiXG4gICAgICAgICAgICAgICAgYXV0b3NlbGVjdFxuICAgICAgICAgICAgICAgIGFsaWduPVwicmlnaHRcIlxuICAgICAgICAvPlxuXG4gICAgICAgIDxkYXRhbGlzdCBpZD1cInN1bS1zdWdnZXN0aW9uc1wiPlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjIwXCI+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiNTAwXCI+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMTAwMFwiPlxuICAgICAgICA8L2RhdGFsaXN0PlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgICA8QnV0dG9uIGlzPVwid2FybmluZ1wiIG9uOmNsaWNrPVwie2UgPT4gY29uc29sZS5sb2coZSl9XCI+U3VibWl0PC9CdXR0b24+XG4gICAgPC9saT5cbjwvdWw+XG5cbjxzdHlsZT5cbiAgICB1bCB7XG4gICAgICAgIGZsZXg6IDA7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIG1hcmdpbjogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAtMSAvIDIpIDA7XG4gICAgICAgIHBhZGRpbmc6IDAgMCAwIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICB1bCBsaSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIG1hcmdpbjogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgLyAyKSAwO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGNvbnN0IGl0ZW1zID0gW1xuICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0NvbWZvcnQgaXMgdGhlIG1haW4gZmVhdHVyZScsXG4gICAgICAgICAgICB0ZXh0OiAnSnVzdCBpbWFnaW5nLCB5b3UgZG8gc29tZXRoaW5nIHNpbXBsZSBhbmQgeW91IGNhbiBzZWUgdGhlIHJlc3VsdCBvZiB5b3VyIHNob3J0IHdheS4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0NvbWZvcnQgaXMgdGhlIG1haW4gZmVhdHVyZScsXG4gICAgICAgICAgICB0ZXh0OiAnSnVzdCBpbWFnaW5nLCB5b3UgZG8gc29tZXRoaW5nIHNpbXBsZSBhbmQgeW91IGNhbiBzZWUgdGhlIHJlc3VsdCBvZiB5b3VyIHNob3J0IHdheS4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0NvbWZvcnQgaXMgdGhlIG1haW4gZmVhdHVyZScsXG4gICAgICAgICAgICB0ZXh0OiAnSnVzdCBpbWFnaW5nLCB5b3UgZG8gc29tZXRoaW5nIHNpbXBsZSBhbmQgeW91IGNhbiBzZWUgdGhlIHJlc3VsdCBvZiB5b3VyIHNob3J0IHdheS4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0NvbWZvcnQgaXMgdGhlIG1haW4gZmVhdHVyZScsXG4gICAgICAgICAgICB0ZXh0OiAnSnVzdCBpbWFnaW5nLCB5b3UgZG8gc29tZXRoaW5nIHNpbXBsZSBhbmQgeW91IGNhbiBzZWUgdGhlIHJlc3VsdCBvZiB5b3VyIHNob3J0IHdheS4nLFxuICAgICAgICB9LFxuICAgIF1cbjwvc2NyaXB0PlxuXG48dWw+XG4gICAgeyNlYWNoIGl0ZW1zIGFzIGl0ZW19XG4gICAgICAgIDxsaT5cbiAgICAgICAgICAgIDxoMz57aXRlbS50aXRsZX08L2gzPlxuICAgICAgICAgICAgPHA+e2l0ZW0udGV4dH08L3A+XG4gICAgICAgICAgICA8YnI+XG4gICAgICAgIDwvbGk+XG4gICAgey9lYWNofVxuPC91bD5cblxuPHN0eWxlPlxuICAgIHVsIHtcbiAgICAgICAgbGlzdC1zdHlsZTogZGlzYyBvdXRzaWRlIG5vbmU7XG4gICAgICAgIHBhZGRpbmc6IDAgY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiA1KTtcbiAgICAgICAgLypsaXN0LXN0eWxlLWltYWdlOiB1cmwoXCJkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCw8c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyB2aWV3Qm94PSctMSAtMSAyIDInPjxjaXJjbGUgcj0nMScgLz48L3N2Zz5cIik7Ki9cbiAgICB9XG5cbiAgICBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGxpc3QtaXRlbTtcbiAgICB9XG5cbiAgICB1bCwgbGksIGgzLCBwIHtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xuICAgIH1cblxuICAgIGgzLCBwIHtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xuICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cblx0aW1wb3J0IHsgSGVhZGVyIH0gZnJvbSAnLi4vbGF5b3V0cyc7XG5cdGltcG9ydCBJY29ucyBmcm9tICcuL19pY29ucy5zdmVsdGUnO1xuXG5cdGV4cG9ydCBsZXQgc2VnbWVudDtcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG5cbjwvc3R5bGU+XG5cbjxIZWFkZXIge3NlZ21lbnR9Lz5cblxuPEljb25zLz5cblxuPG1haW4gaWQ9XCJtYWluXCI+XG5cdDxzbG90Pjwvc2xvdD5cbjwvbWFpbj5cblxuIiwiPHNjcmlwdD5cblx0ZXhwb3J0IGxldCBzdGF0dXM7XG5cdGV4cG9ydCBsZXQgZXJyb3I7XG5cblx0Y29uc3QgZGV2ID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCc7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuPC9zdHlsZT5cblxuPHN2ZWx0ZTpoZWFkPlxuXHQ8dGl0bGU+RXJyb3I6IHtzdGF0dXN9PC90aXRsZT5cbjwvc3ZlbHRlOmhlYWQ+XG5cbjxicj5cbjxicj5cbjxicj5cbjxicj5cbjxoMSBjbGFzcz1cInRleHQtY2VudGVyXCI+RXJyb3I6IHtzdGF0dXN9PC9oMT5cbjxicj5cbjxwIGNsYXNzPVwidGV4dC1jZW50ZXJcIj5SZWFzb246IHtlcnJvci5tZXNzYWdlfTwvcD5cbjxicj5cbjxicj5cbnsjaWYgZGV2ICYmIGVycm9yLnN0YWNrfVxuXHQ8cHJlPntlcnJvci5zdGFja308L3ByZT5cbnsvaWZ9XG4iLCI8IS0tIFRoaXMgZmlsZSBpcyBnZW5lcmF0ZWQgYnkgU2FwcGVyIOKAlCBkbyBub3QgZWRpdCBpdCEgLS0+XG48c2NyaXB0PlxuXHRpbXBvcnQgeyBzZXRDb250ZXh0IH0gZnJvbSAnc3ZlbHRlJztcblx0aW1wb3J0IHsgQ09OVEVYVF9LRVkgfSBmcm9tICcuL3NoYXJlZCc7XG5cdGltcG9ydCBMYXlvdXQgZnJvbSAnLi4vLi4vLi4vcm91dGVzL19sYXlvdXQuc3ZlbHRlJztcblx0aW1wb3J0IEVycm9yIGZyb20gJy4uLy4uLy4uL3JvdXRlcy9fZXJyb3Iuc3ZlbHRlJztcblxuXHRleHBvcnQgbGV0IHN0b3Jlcztcblx0ZXhwb3J0IGxldCBlcnJvcjtcblx0ZXhwb3J0IGxldCBzdGF0dXM7XG5cdGV4cG9ydCBsZXQgc2VnbWVudHM7XG5cdGV4cG9ydCBsZXQgbGV2ZWwwO1xuXHRleHBvcnQgbGV0IGxldmVsMSA9IG51bGw7XG5cdGV4cG9ydCBsZXQgbGV2ZWwyID0gbnVsbDtcblxuXHRzZXRDb250ZXh0KENPTlRFWFRfS0VZLCBzdG9yZXMpO1xuPC9zY3JpcHQ+XG5cbjxMYXlvdXQgc2VnbWVudD1cIntzZWdtZW50c1swXX1cIiB7Li4ubGV2ZWwwLnByb3BzfT5cblx0eyNpZiBlcnJvcn1cblx0XHQ8RXJyb3Ige2Vycm9yfSB7c3RhdHVzfS8+XG5cdHs6ZWxzZX1cblx0XHQ8c3ZlbHRlOmNvbXBvbmVudCB0aGlzPVwie2xldmVsMS5jb21wb25lbnR9XCIgc2VnbWVudD1cIntzZWdtZW50c1sxXX1cIiB7Li4ubGV2ZWwxLnByb3BzfT5cblx0XHRcdHsjaWYgbGV2ZWwyfVxuXHRcdFx0XHQ8c3ZlbHRlOmNvbXBvbmVudCB0aGlzPVwie2xldmVsMi5jb21wb25lbnR9XCIgey4uLmxldmVsMi5wcm9wc30vPlxuXHRcdFx0ey9pZn1cblx0XHQ8L3N2ZWx0ZTpjb21wb25lbnQ+XG5cdHsvaWZ9XG48L0xheW91dD4iLCIvLyBUaGlzIGZpbGUgaXMgZ2VuZXJhdGVkIGJ5IFNhcHBlciDigJQgZG8gbm90IGVkaXQgaXQhXG5leHBvcnQgeyBkZWZhdWx0IGFzIFJvb3QgfSBmcm9tICcuLi8uLi8uLi9yb3V0ZXMvX2xheW91dC5zdmVsdGUnO1xuZXhwb3J0IHsgcHJlbG9hZCBhcyByb290X3ByZWxvYWQgfSBmcm9tICcuL3NoYXJlZCc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIEVycm9yQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vLi4vcm91dGVzL19lcnJvci5zdmVsdGUnO1xuXG5leHBvcnQgY29uc3QgaWdub3JlID0gW107XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0gW1xuXHR7XG5cdFx0anM6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uL3JvdXRlcy9pbmRleC5zdmVsdGVcIiksXG5cdFx0Y3NzOiBcIl9fU0FQUEVSX0NTU19QTEFDRUhPTERFUjppbmRleC5zdmVsdGVfX1wiXG5cdH0sXG5cdHtcblx0XHRqczogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vcm91dGVzL29yZ2FuaXphdGlvbi5zdmVsdGVcIiksXG5cdFx0Y3NzOiBcIl9fU0FQUEVSX0NTU19QTEFDRUhPTERFUjpvcmdhbml6YXRpb24uc3ZlbHRlX19cIlxuXHR9LFxuXHR7XG5cdFx0anM6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uL3JvdXRlcy9jaGFyaXR5LnN2ZWx0ZVwiKSxcblx0XHRjc3M6IFwiX19TQVBQRVJfQ1NTX1BMQUNFSE9MREVSOmNoYXJpdHkuc3ZlbHRlX19cIlxuXHR9LFxuXHR7XG5cdFx0anM6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uL3JvdXRlcy9saXN0cy9fbGF5b3V0LnN2ZWx0ZVwiKSxcblx0XHRjc3M6IFwiX19TQVBQRVJfQ1NTX1BMQUNFSE9MREVSOmxpc3RzL19sYXlvdXQuc3ZlbHRlX19cIlxuXHR9LFxuXHR7XG5cdFx0anM6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uL3JvdXRlcy9saXN0cy9pbmRleC5zdmVsdGVcIiksXG5cdFx0Y3NzOiBcIl9fU0FQUEVSX0NTU19QTEFDRUhPTERFUjpsaXN0cy9pbmRleC5zdmVsdGVfX1wiXG5cdH0sXG5cdHtcblx0XHRqczogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vcm91dGVzL2xpc3RzL29yZ2FuaXphdGlvbnMuc3ZlbHRlXCIpLFxuXHRcdGNzczogXCJfX1NBUFBFUl9DU1NfUExBQ0VIT0xERVI6bGlzdHMvb3JnYW5pemF0aW9ucy5zdmVsdGVfX1wiXG5cdH0sXG5cdHtcblx0XHRqczogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vcm91dGVzL2xpc3RzL2NoYXJpdGllcy5zdmVsdGVcIiksXG5cdFx0Y3NzOiBcIl9fU0FQUEVSX0NTU19QTEFDRUhPTERFUjpsaXN0cy9jaGFyaXRpZXMuc3ZlbHRlX19cIlxuXHR9LFxuXHR7XG5cdFx0anM6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uL3JvdXRlcy9tYXAuc3ZlbHRlXCIpLFxuXHRcdGNzczogXCJfX1NBUFBFUl9DU1NfUExBQ0VIT0xERVI6bWFwLnN2ZWx0ZV9fXCJcblx0fVxuXTtcblxuZXhwb3J0IGNvbnN0IHJvdXRlcyA9IFtcblx0e1xuXHRcdC8vIGluZGV4LnN2ZWx0ZVxuXHRcdHBhdHRlcm46IC9eXFwvJC8sXG5cdFx0cGFydHM6IFtcblx0XHRcdHsgaTogMCB9XG5cdFx0XVxuXHR9LFxuXG5cdHtcblx0XHQvLyBvcmdhbml6YXRpb24uc3ZlbHRlXG5cdFx0cGF0dGVybjogL15cXC9vcmdhbml6YXRpb25cXC8/JC8sXG5cdFx0cGFydHM6IFtcblx0XHRcdHsgaTogMSB9XG5cdFx0XVxuXHR9LFxuXG5cdHtcblx0XHQvLyBjaGFyaXR5LnN2ZWx0ZVxuXHRcdHBhdHRlcm46IC9eXFwvY2hhcml0eVxcLz8kLyxcblx0XHRwYXJ0czogW1xuXHRcdFx0eyBpOiAyIH1cblx0XHRdXG5cdH0sXG5cblx0e1xuXHRcdC8vIGxpc3RzL2luZGV4LnN2ZWx0ZVxuXHRcdHBhdHRlcm46IC9eXFwvbGlzdHNcXC8/JC8sXG5cdFx0cGFydHM6IFtcblx0XHRcdHsgaTogMyB9LFxuXHRcdFx0eyBpOiA0IH1cblx0XHRdXG5cdH0sXG5cblx0e1xuXHRcdC8vIGxpc3RzL29yZ2FuaXphdGlvbnMuc3ZlbHRlXG5cdFx0cGF0dGVybjogL15cXC9saXN0c1xcL29yZ2FuaXphdGlvbnNcXC8/JC8sXG5cdFx0cGFydHM6IFtcblx0XHRcdHsgaTogMyB9LFxuXHRcdFx0eyBpOiA1IH1cblx0XHRdXG5cdH0sXG5cblx0e1xuXHRcdC8vIGxpc3RzL2NoYXJpdGllcy5zdmVsdGVcblx0XHRwYXR0ZXJuOiAvXlxcL2xpc3RzXFwvY2hhcml0aWVzXFwvPyQvLFxuXHRcdHBhcnRzOiBbXG5cdFx0XHR7IGk6IDMgfSxcblx0XHRcdHsgaTogNiB9XG5cdFx0XVxuXHR9LFxuXG5cdHtcblx0XHQvLyBtYXAuc3ZlbHRlXG5cdFx0cGF0dGVybjogL15cXC9tYXBcXC8/JC8sXG5cdFx0cGFydHM6IFtcblx0XHRcdHsgaTogNyB9XG5cdFx0XVxuXHR9XG5dOyIsImltcG9ydCB7IGdldENvbnRleHQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgQ09OVEVYVF9LRVkgfSBmcm9tICcuL2ludGVybmFsL3NoYXJlZCc7XG5pbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSc7XG5pbXBvcnQgQXBwIGZyb20gJy4vaW50ZXJuYWwvQXBwLnN2ZWx0ZSc7XG5pbXBvcnQgeyBpZ25vcmUsIHJvdXRlcywgcm9vdF9wcmVsb2FkLCBjb21wb25lbnRzLCBFcnJvckNvbXBvbmVudCB9IGZyb20gJy4vaW50ZXJuYWwvbWFuaWZlc3QtY2xpZW50JztcblxuZnVuY3Rpb24gZ290byhocmVmLCBvcHRzID0geyByZXBsYWNlU3RhdGU6IGZhbHNlIH0pIHtcblx0Y29uc3QgdGFyZ2V0ID0gc2VsZWN0X3RhcmdldChuZXcgVVJMKGhyZWYsIGRvY3VtZW50LmJhc2VVUkkpKTtcblxuXHRpZiAodGFyZ2V0KSB7XG5cdFx0X2hpc3Rvcnlbb3B0cy5yZXBsYWNlU3RhdGUgPyAncmVwbGFjZVN0YXRlJyA6ICdwdXNoU3RhdGUnXSh7IGlkOiBjaWQgfSwgJycsIGhyZWYpO1xuXHRcdHJldHVybiBuYXZpZ2F0ZSh0YXJnZXQsIG51bGwpLnRoZW4oKCkgPT4ge30pO1xuXHR9XG5cblx0bG9jYXRpb24uaHJlZiA9IGhyZWY7XG5cdHJldHVybiBuZXcgUHJvbWlzZShmID0+IHt9KTsgLy8gbmV2ZXIgcmVzb2x2ZXNcbn1cblxuY29uc3QgaW5pdGlhbF9kYXRhID0gdHlwZW9mIF9fU0FQUEVSX18gIT09ICd1bmRlZmluZWQnICYmIF9fU0FQUEVSX187XG5cbmxldCByZWFkeSA9IGZhbHNlO1xubGV0IHJvb3RfY29tcG9uZW50O1xubGV0IGN1cnJlbnRfdG9rZW47XG5sZXQgcm9vdF9wcmVsb2FkZWQ7XG5sZXQgY3VycmVudF9icmFuY2ggPSBbXTtcbmxldCBjdXJyZW50X3F1ZXJ5ID0gJ3t9JztcblxuY29uc3Qgc3RvcmVzID0ge1xuXHRwYWdlOiB3cml0YWJsZSh7fSksXG5cdHByZWxvYWRpbmc6IHdyaXRhYmxlKG51bGwpLFxuXHRzZXNzaW9uOiB3cml0YWJsZShpbml0aWFsX2RhdGEgJiYgaW5pdGlhbF9kYXRhLnNlc3Npb24pXG59O1xuXG5sZXQgJHNlc3Npb247XG5sZXQgc2Vzc2lvbl9kaXJ0eTtcblxuc3RvcmVzLnNlc3Npb24uc3Vic2NyaWJlKGFzeW5jIHZhbHVlID0+IHtcblx0JHNlc3Npb24gPSB2YWx1ZTtcblxuXHRpZiAoIXJlYWR5KSByZXR1cm47XG5cdHNlc3Npb25fZGlydHkgPSB0cnVlO1xuXG5cdGNvbnN0IHRhcmdldCA9IHNlbGVjdF90YXJnZXQobmV3IFVSTChsb2NhdGlvbi5ocmVmKSk7XG5cblx0Y29uc3QgdG9rZW4gPSBjdXJyZW50X3Rva2VuID0ge307XG5cdGNvbnN0IHsgcmVkaXJlY3QsIHByb3BzLCBicmFuY2ggfSA9IGF3YWl0IGh5ZHJhdGVfdGFyZ2V0KHRhcmdldCk7XG5cdGlmICh0b2tlbiAhPT0gY3VycmVudF90b2tlbikgcmV0dXJuOyAvLyBhIHNlY29uZGFyeSBuYXZpZ2F0aW9uIGhhcHBlbmVkIHdoaWxlIHdlIHdlcmUgbG9hZGluZ1xuXG5cdGF3YWl0IHJlbmRlcihyZWRpcmVjdCwgYnJhbmNoLCBwcm9wcywgdGFyZ2V0LnBhZ2UpO1xufSk7XG5cbmxldCBwcmVmZXRjaGluZ1xuXG5cbiA9IG51bGw7XG5mdW5jdGlvbiBzZXRfcHJlZmV0Y2hpbmcoaHJlZiwgcHJvbWlzZSkge1xuXHRwcmVmZXRjaGluZyA9IHsgaHJlZiwgcHJvbWlzZSB9O1xufVxuXG5sZXQgdGFyZ2V0O1xuZnVuY3Rpb24gc2V0X3RhcmdldChlbGVtZW50KSB7XG5cdHRhcmdldCA9IGVsZW1lbnQ7XG59XG5cbmxldCB1aWQgPSAxO1xuZnVuY3Rpb24gc2V0X3VpZChuKSB7XG5cdHVpZCA9IG47XG59XG5cbmxldCBjaWQ7XG5mdW5jdGlvbiBzZXRfY2lkKG4pIHtcblx0Y2lkID0gbjtcbn1cblxuY29uc3QgX2hpc3RvcnkgPSB0eXBlb2YgaGlzdG9yeSAhPT0gJ3VuZGVmaW5lZCcgPyBoaXN0b3J5IDoge1xuXHRwdXNoU3RhdGU6IChzdGF0ZSwgdGl0bGUsIGhyZWYpID0+IHt9LFxuXHRyZXBsYWNlU3RhdGU6IChzdGF0ZSwgdGl0bGUsIGhyZWYpID0+IHt9LFxuXHRzY3JvbGxSZXN0b3JhdGlvbjogJydcbn07XG5cbmNvbnN0IHNjcm9sbF9oaXN0b3J5ID0ge307XG5cbmZ1bmN0aW9uIGV4dHJhY3RfcXVlcnkoc2VhcmNoKSB7XG5cdGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblx0aWYgKHNlYXJjaC5sZW5ndGggPiAwKSB7XG5cdFx0c2VhcmNoLnNsaWNlKDEpLnNwbGl0KCcmJykuZm9yRWFjaChzZWFyY2hQYXJhbSA9PiB7XG5cdFx0XHRsZXQgWywga2V5LCB2YWx1ZSA9ICcnXSA9IC8oW149XSopKD86PSguKikpPy8uZXhlYyhkZWNvZGVVUklDb21wb25lbnQoc2VhcmNoUGFyYW0ucmVwbGFjZSgvXFwrL2csICcgJykpKTtcblx0XHRcdGlmICh0eXBlb2YgcXVlcnlba2V5XSA9PT0gJ3N0cmluZycpIHF1ZXJ5W2tleV0gPSBbcXVlcnlba2V5XV07XG5cdFx0XHRpZiAodHlwZW9mIHF1ZXJ5W2tleV0gPT09ICdvYmplY3QnKSAocXVlcnlba2V5XSApLnB1c2godmFsdWUpO1xuXHRcdFx0ZWxzZSBxdWVyeVtrZXldID0gdmFsdWU7XG5cdFx0fSk7XG5cdH1cblx0cmV0dXJuIHF1ZXJ5O1xufVxuXG5mdW5jdGlvbiBzZWxlY3RfdGFyZ2V0KHVybCkge1xuXHRpZiAodXJsLm9yaWdpbiAhPT0gbG9jYXRpb24ub3JpZ2luKSByZXR1cm4gbnVsbDtcblx0aWYgKCF1cmwucGF0aG5hbWUuc3RhcnRzV2l0aChpbml0aWFsX2RhdGEuYmFzZVVybCkpIHJldHVybiBudWxsO1xuXG5cdGxldCBwYXRoID0gdXJsLnBhdGhuYW1lLnNsaWNlKGluaXRpYWxfZGF0YS5iYXNlVXJsLmxlbmd0aCk7XG5cblx0aWYgKHBhdGggPT09ICcnKSB7XG5cdFx0cGF0aCA9ICcvJztcblx0fVxuXG5cdC8vIGF2b2lkIGFjY2lkZW50YWwgY2xhc2hlcyBiZXR3ZWVuIHNlcnZlciByb3V0ZXMgYW5kIHBhZ2Ugcm91dGVzXG5cdGlmIChpZ25vcmUuc29tZShwYXR0ZXJuID0+IHBhdHRlcm4udGVzdChwYXRoKSkpIHJldHVybjtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IHJvdXRlcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGNvbnN0IHJvdXRlID0gcm91dGVzW2ldO1xuXG5cdFx0Y29uc3QgbWF0Y2ggPSByb3V0ZS5wYXR0ZXJuLmV4ZWMocGF0aCk7XG5cblx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdGNvbnN0IHF1ZXJ5ID0gZXh0cmFjdF9xdWVyeSh1cmwuc2VhcmNoKTtcblx0XHRcdGNvbnN0IHBhcnQgPSByb3V0ZS5wYXJ0c1tyb3V0ZS5wYXJ0cy5sZW5ndGggLSAxXTtcblx0XHRcdGNvbnN0IHBhcmFtcyA9IHBhcnQucGFyYW1zID8gcGFydC5wYXJhbXMobWF0Y2gpIDoge307XG5cblx0XHRcdGNvbnN0IHBhZ2UgPSB7IGhvc3Q6IGxvY2F0aW9uLmhvc3QsIHBhdGgsIHF1ZXJ5LCBwYXJhbXMgfTtcblxuXHRcdFx0cmV0dXJuIHsgaHJlZjogdXJsLmhyZWYsIHJvdXRlLCBtYXRjaCwgcGFnZSB9O1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBoYW5kbGVfZXJyb3IodXJsKSB7XG5cdGNvbnN0IHsgaG9zdCwgcGF0aG5hbWUsIHNlYXJjaCB9ID0gbG9jYXRpb247XG5cdGNvbnN0IHsgc2Vzc2lvbiwgcHJlbG9hZGVkLCBzdGF0dXMsIGVycm9yIH0gPSBpbml0aWFsX2RhdGE7XG5cblx0aWYgKCFyb290X3ByZWxvYWRlZCkge1xuXHRcdHJvb3RfcHJlbG9hZGVkID0gcHJlbG9hZGVkICYmIHByZWxvYWRlZFswXTtcblx0fVxuXG5cdGNvbnN0IHByb3BzID0ge1xuXHRcdGVycm9yLFxuXHRcdHN0YXR1cyxcblx0XHRzZXNzaW9uLFxuXHRcdGxldmVsMDoge1xuXHRcdFx0cHJvcHM6IHJvb3RfcHJlbG9hZGVkXG5cdFx0fSxcblx0XHRsZXZlbDE6IHtcblx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdHN0YXR1cyxcblx0XHRcdFx0ZXJyb3Jcblx0XHRcdH0sXG5cdFx0XHRjb21wb25lbnQ6IEVycm9yQ29tcG9uZW50XG5cdFx0fSxcblx0XHRzZWdtZW50czogcHJlbG9hZGVkXG5cblx0fTtcblx0Y29uc3QgcXVlcnkgPSBleHRyYWN0X3F1ZXJ5KHNlYXJjaCk7XG5cdHJlbmRlcihudWxsLCBbXSwgcHJvcHMsIHsgaG9zdCwgcGF0aDogcGF0aG5hbWUsIHF1ZXJ5LCBwYXJhbXM6IHt9IH0pO1xufVxuXG5mdW5jdGlvbiBzY3JvbGxfc3RhdGUoKSB7XG5cdHJldHVybiB7XG5cdFx0eDogcGFnZVhPZmZzZXQsXG5cdFx0eTogcGFnZVlPZmZzZXRcblx0fTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbmF2aWdhdGUodGFyZ2V0LCBpZCwgbm9zY3JvbGwsIGhhc2gpIHtcblx0aWYgKGlkKSB7XG5cdFx0Ly8gcG9wc3RhdGUgb3IgaW5pdGlhbCBuYXZpZ2F0aW9uXG5cdFx0Y2lkID0gaWQ7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc3QgY3VycmVudF9zY3JvbGwgPSBzY3JvbGxfc3RhdGUoKTtcblxuXHRcdC8vIGNsaWNrZWQgb24gYSBsaW5rLiBwcmVzZXJ2ZSBzY3JvbGwgc3RhdGVcblx0XHRzY3JvbGxfaGlzdG9yeVtjaWRdID0gY3VycmVudF9zY3JvbGw7XG5cblx0XHRpZCA9IGNpZCA9ICsrdWlkO1xuXHRcdHNjcm9sbF9oaXN0b3J5W2NpZF0gPSBub3Njcm9sbCA/IGN1cnJlbnRfc2Nyb2xsIDogeyB4OiAwLCB5OiAwIH07XG5cdH1cblxuXHRjaWQgPSBpZDtcblxuXHRpZiAocm9vdF9jb21wb25lbnQpIHN0b3Jlcy5wcmVsb2FkaW5nLnNldCh0cnVlKTtcblxuXHRjb25zdCBsb2FkZWQgPSBwcmVmZXRjaGluZyAmJiBwcmVmZXRjaGluZy5ocmVmID09PSB0YXJnZXQuaHJlZiA/XG5cdFx0cHJlZmV0Y2hpbmcucHJvbWlzZSA6XG5cdFx0aHlkcmF0ZV90YXJnZXQodGFyZ2V0KTtcblxuXHRwcmVmZXRjaGluZyA9IG51bGw7XG5cblx0Y29uc3QgdG9rZW4gPSBjdXJyZW50X3Rva2VuID0ge307XG5cdGNvbnN0IHsgcmVkaXJlY3QsIHByb3BzLCBicmFuY2ggfSA9IGF3YWl0IGxvYWRlZDtcblx0aWYgKHRva2VuICE9PSBjdXJyZW50X3Rva2VuKSByZXR1cm47IC8vIGEgc2Vjb25kYXJ5IG5hdmlnYXRpb24gaGFwcGVuZWQgd2hpbGUgd2Ugd2VyZSBsb2FkaW5nXG5cblx0YXdhaXQgcmVuZGVyKHJlZGlyZWN0LCBicmFuY2gsIHByb3BzLCB0YXJnZXQucGFnZSk7XG5cdGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50KSBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcblxuXHRpZiAoIW5vc2Nyb2xsKSB7XG5cdFx0bGV0IHNjcm9sbCA9IHNjcm9sbF9oaXN0b3J5W2lkXTtcblxuXHRcdGlmIChoYXNoKSB7XG5cdFx0XHQvLyBzY3JvbGwgaXMgYW4gZWxlbWVudCBpZCAoZnJvbSBhIGhhc2gpLCB3ZSBuZWVkIHRvIGNvbXB1dGUgeS5cblx0XHRcdGNvbnN0IGRlZXBfbGlua2VkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaGFzaC5zbGljZSgxKSk7XG5cblx0XHRcdGlmIChkZWVwX2xpbmtlZCkge1xuXHRcdFx0XHRzY3JvbGwgPSB7XG5cdFx0XHRcdFx0eDogMCxcblx0XHRcdFx0XHR5OiBkZWVwX2xpbmtlZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3Bcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRzY3JvbGxfaGlzdG9yeVtjaWRdID0gc2Nyb2xsO1xuXHRcdGlmIChzY3JvbGwpIHNjcm9sbFRvKHNjcm9sbC54LCBzY3JvbGwueSk7XG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVuZGVyKHJlZGlyZWN0LCBicmFuY2gsIHByb3BzLCBwYWdlKSB7XG5cdGlmIChyZWRpcmVjdCkgcmV0dXJuIGdvdG8ocmVkaXJlY3QubG9jYXRpb24sIHsgcmVwbGFjZVN0YXRlOiB0cnVlIH0pO1xuXG5cdHN0b3Jlcy5wYWdlLnNldChwYWdlKTtcblx0c3RvcmVzLnByZWxvYWRpbmcuc2V0KGZhbHNlKTtcblxuXHRpZiAocm9vdF9jb21wb25lbnQpIHtcblx0XHRyb290X2NvbXBvbmVudC4kc2V0KHByb3BzKTtcblx0fSBlbHNlIHtcblx0XHRwcm9wcy5zdG9yZXMgPSB7XG5cdFx0XHRwYWdlOiB7IHN1YnNjcmliZTogc3RvcmVzLnBhZ2Uuc3Vic2NyaWJlIH0sXG5cdFx0XHRwcmVsb2FkaW5nOiB7IHN1YnNjcmliZTogc3RvcmVzLnByZWxvYWRpbmcuc3Vic2NyaWJlIH0sXG5cdFx0XHRzZXNzaW9uOiBzdG9yZXMuc2Vzc2lvblxuXHRcdH07XG5cdFx0cHJvcHMubGV2ZWwwID0ge1xuXHRcdFx0cHJvcHM6IGF3YWl0IHJvb3RfcHJlbG9hZGVkXG5cdFx0fTtcblxuXHRcdC8vIGZpcnN0IGxvYWQg4oCUIHJlbW92ZSBTU1InZCA8aGVhZD4gY29udGVudHNcblx0XHRjb25zdCBzdGFydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzYXBwZXItaGVhZC1zdGFydCcpO1xuXHRcdGNvbnN0IGVuZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzYXBwZXItaGVhZC1lbmQnKTtcblxuXHRcdGlmIChzdGFydCAmJiBlbmQpIHtcblx0XHRcdHdoaWxlIChzdGFydC5uZXh0U2libGluZyAhPT0gZW5kKSBkZXRhY2goc3RhcnQubmV4dFNpYmxpbmcpO1xuXHRcdFx0ZGV0YWNoKHN0YXJ0KTtcblx0XHRcdGRldGFjaChlbmQpO1xuXHRcdH1cblxuXHRcdHJvb3RfY29tcG9uZW50ID0gbmV3IEFwcCh7XG5cdFx0XHR0YXJnZXQsXG5cdFx0XHRwcm9wcyxcblx0XHRcdGh5ZHJhdGU6IHRydWVcblx0XHR9KTtcblx0fVxuXG5cdGN1cnJlbnRfYnJhbmNoID0gYnJhbmNoO1xuXHRjdXJyZW50X3F1ZXJ5ID0gSlNPTi5zdHJpbmdpZnkocGFnZS5xdWVyeSk7XG5cdHJlYWR5ID0gdHJ1ZTtcblx0c2Vzc2lvbl9kaXJ0eSA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBwYXJ0X2NoYW5nZWQoaSwgc2VnbWVudCwgbWF0Y2gsIHN0cmluZ2lmaWVkX3F1ZXJ5KSB7XG5cdC8vIFRPRE8gb25seSBjaGVjayBxdWVyeSBzdHJpbmcgY2hhbmdlcyBmb3IgcHJlbG9hZCBmdW5jdGlvbnNcblx0Ly8gdGhhdCBkbyBpbiBmYWN0IGRlcGVuZCBvbiBpdCAodXNpbmcgc3RhdGljIGFuYWx5c2lzIG9yXG5cdC8vIHJ1bnRpbWUgaW5zdHJ1bWVudGF0aW9uKVxuXHRpZiAoc3RyaW5naWZpZWRfcXVlcnkgIT09IGN1cnJlbnRfcXVlcnkpIHJldHVybiB0cnVlO1xuXG5cdGNvbnN0IHByZXZpb3VzID0gY3VycmVudF9icmFuY2hbaV07XG5cblx0aWYgKCFwcmV2aW91cykgcmV0dXJuIGZhbHNlO1xuXHRpZiAoc2VnbWVudCAhPT0gcHJldmlvdXMuc2VnbWVudCkgcmV0dXJuIHRydWU7XG5cdGlmIChwcmV2aW91cy5tYXRjaCkge1xuXHRcdGlmIChKU09OLnN0cmluZ2lmeShwcmV2aW91cy5tYXRjaC5zbGljZSgxLCBpICsgMikpICE9PSBKU09OLnN0cmluZ2lmeShtYXRjaC5zbGljZSgxLCBpICsgMikpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gaHlkcmF0ZV90YXJnZXQodGFyZ2V0KVxuXG5cblxuIHtcblx0Y29uc3QgeyByb3V0ZSwgcGFnZSB9ID0gdGFyZ2V0O1xuXHRjb25zdCBzZWdtZW50cyA9IHBhZ2UucGF0aC5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcblxuXHRsZXQgcmVkaXJlY3QgPSBudWxsO1xuXG5cdGNvbnN0IHByb3BzID0geyBlcnJvcjogbnVsbCwgc3RhdHVzOiAyMDAsIHNlZ21lbnRzOiBbc2VnbWVudHNbMF1dIH07XG5cblx0Y29uc3QgcHJlbG9hZF9jb250ZXh0ID0ge1xuXHRcdGZldGNoOiAodXJsLCBvcHRzKSA9PiBmZXRjaCh1cmwsIG9wdHMpLFxuXHRcdHJlZGlyZWN0OiAoc3RhdHVzQ29kZSwgbG9jYXRpb24pID0+IHtcblx0XHRcdGlmIChyZWRpcmVjdCAmJiAocmVkaXJlY3Quc3RhdHVzQ29kZSAhPT0gc3RhdHVzQ29kZSB8fCByZWRpcmVjdC5sb2NhdGlvbiAhPT0gbG9jYXRpb24pKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgQ29uZmxpY3RpbmcgcmVkaXJlY3RzYCk7XG5cdFx0XHR9XG5cdFx0XHRyZWRpcmVjdCA9IHsgc3RhdHVzQ29kZSwgbG9jYXRpb24gfTtcblx0XHR9LFxuXHRcdGVycm9yOiAoc3RhdHVzLCBlcnJvcikgPT4ge1xuXHRcdFx0cHJvcHMuZXJyb3IgPSB0eXBlb2YgZXJyb3IgPT09ICdzdHJpbmcnID8gbmV3IEVycm9yKGVycm9yKSA6IGVycm9yO1xuXHRcdFx0cHJvcHMuc3RhdHVzID0gc3RhdHVzO1xuXHRcdH1cblx0fTtcblxuXHRpZiAoIXJvb3RfcHJlbG9hZGVkKSB7XG5cdFx0cm9vdF9wcmVsb2FkZWQgPSBpbml0aWFsX2RhdGEucHJlbG9hZGVkWzBdIHx8IHJvb3RfcHJlbG9hZC5jYWxsKHByZWxvYWRfY29udGV4dCwge1xuXHRcdFx0aG9zdDogcGFnZS5ob3N0LFxuXHRcdFx0cGF0aDogcGFnZS5wYXRoLFxuXHRcdFx0cXVlcnk6IHBhZ2UucXVlcnksXG5cdFx0XHRwYXJhbXM6IHt9XG5cdFx0fSwgJHNlc3Npb24pO1xuXHR9XG5cblx0bGV0IGJyYW5jaDtcblx0bGV0IGwgPSAxO1xuXG5cdHRyeSB7XG5cdFx0Y29uc3Qgc3RyaW5naWZpZWRfcXVlcnkgPSBKU09OLnN0cmluZ2lmeShwYWdlLnF1ZXJ5KTtcblx0XHRjb25zdCBtYXRjaCA9IHJvdXRlLnBhdHRlcm4uZXhlYyhwYWdlLnBhdGgpO1xuXG5cdFx0bGV0IHNlZ21lbnRfZGlydHkgPSBmYWxzZTtcblxuXHRcdGJyYW5jaCA9IGF3YWl0IFByb21pc2UuYWxsKHJvdXRlLnBhcnRzLm1hcChhc3luYyAocGFydCwgaSkgPT4ge1xuXHRcdFx0Y29uc3Qgc2VnbWVudCA9IHNlZ21lbnRzW2ldO1xuXG5cdFx0XHRpZiAocGFydF9jaGFuZ2VkKGksIHNlZ21lbnQsIG1hdGNoLCBzdHJpbmdpZmllZF9xdWVyeSkpIHNlZ21lbnRfZGlydHkgPSB0cnVlO1xuXG5cdFx0XHRwcm9wcy5zZWdtZW50c1tsXSA9IHNlZ21lbnRzW2kgKyAxXTsgLy8gVE9ETyBtYWtlIHRoaXMgbGVzcyBjb25mdXNpbmdcblx0XHRcdGlmICghcGFydCkgcmV0dXJuIHsgc2VnbWVudCB9O1xuXG5cdFx0XHRjb25zdCBqID0gbCsrO1xuXG5cdFx0XHRpZiAoIXNlc3Npb25fZGlydHkgJiYgIXNlZ21lbnRfZGlydHkgJiYgY3VycmVudF9icmFuY2hbaV0gJiYgY3VycmVudF9icmFuY2hbaV0ucGFydCA9PT0gcGFydC5pKSB7XG5cdFx0XHRcdHJldHVybiBjdXJyZW50X2JyYW5jaFtpXTtcblx0XHRcdH1cblxuXHRcdFx0c2VnbWVudF9kaXJ0eSA9IGZhbHNlO1xuXG5cdFx0XHRjb25zdCB7IGRlZmF1bHQ6IGNvbXBvbmVudCwgcHJlbG9hZCB9ID0gYXdhaXQgbG9hZF9jb21wb25lbnQoY29tcG9uZW50c1twYXJ0LmldKTtcblxuXHRcdFx0bGV0IHByZWxvYWRlZDtcblx0XHRcdGlmIChyZWFkeSB8fCAhaW5pdGlhbF9kYXRhLnByZWxvYWRlZFtpICsgMV0pIHtcblx0XHRcdFx0cHJlbG9hZGVkID0gcHJlbG9hZFxuXHRcdFx0XHRcdD8gYXdhaXQgcHJlbG9hZC5jYWxsKHByZWxvYWRfY29udGV4dCwge1xuXHRcdFx0XHRcdFx0aG9zdDogcGFnZS5ob3N0LFxuXHRcdFx0XHRcdFx0cGF0aDogcGFnZS5wYXRoLFxuXHRcdFx0XHRcdFx0cXVlcnk6IHBhZ2UucXVlcnksXG5cdFx0XHRcdFx0XHRwYXJhbXM6IHBhcnQucGFyYW1zID8gcGFydC5wYXJhbXModGFyZ2V0Lm1hdGNoKSA6IHt9XG5cdFx0XHRcdFx0fSwgJHNlc3Npb24pXG5cdFx0XHRcdFx0OiB7fTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHByZWxvYWRlZCA9IGluaXRpYWxfZGF0YS5wcmVsb2FkZWRbaSArIDFdO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gKHByb3BzW2BsZXZlbCR7an1gXSA9IHsgY29tcG9uZW50LCBwcm9wczogcHJlbG9hZGVkLCBzZWdtZW50LCBtYXRjaCwgcGFydDogcGFydC5pIH0pO1xuXHRcdH0pKTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRwcm9wcy5lcnJvciA9IGVycm9yO1xuXHRcdHByb3BzLnN0YXR1cyA9IDUwMDtcblx0XHRicmFuY2ggPSBbXTtcblx0fVxuXG5cdHJldHVybiB7IHJlZGlyZWN0LCBwcm9wcywgYnJhbmNoIH07XG59XG5cbmZ1bmN0aW9uIGxvYWRfY3NzKGNodW5rKSB7XG5cdGNvbnN0IGhyZWYgPSBgY2xpZW50LyR7Y2h1bmt9YDtcblx0aWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGxpbmtbaHJlZj1cIiR7aHJlZn1cIl1gKSkgcmV0dXJuO1xuXG5cdHJldHVybiBuZXcgUHJvbWlzZSgoZnVsZmlsLCByZWplY3QpID0+IHtcblx0XHRjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuXHRcdGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnO1xuXHRcdGxpbmsuaHJlZiA9IGhyZWY7XG5cblx0XHRsaW5rLm9ubG9hZCA9ICgpID0+IGZ1bGZpbCgpO1xuXHRcdGxpbmsub25lcnJvciA9IHJlamVjdDtcblxuXHRcdGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluayk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBsb2FkX2NvbXBvbmVudChjb21wb25lbnQpXG5cblxuIHtcblx0Ly8gVE9ETyB0aGlzIGlzIHRlbXBvcmFyeSDigJQgb25jZSBwbGFjZWhvbGRlcnMgYXJlXG5cdC8vIGFsd2F5cyByZXdyaXR0ZW4sIHNjcmF0Y2ggdGhlIHRlcm5hcnlcblx0Y29uc3QgcHJvbWlzZXMgPSAodHlwZW9mIGNvbXBvbmVudC5jc3MgPT09ICdzdHJpbmcnID8gW10gOiBjb21wb25lbnQuY3NzLm1hcChsb2FkX2NzcykpO1xuXHRwcm9taXNlcy51bnNoaWZ0KGNvbXBvbmVudC5qcygpKTtcblx0cmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHZhbHVlcyA9PiB2YWx1ZXNbMF0pO1xufVxuXG5mdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuXHRub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5cbmZ1bmN0aW9uIHByZWZldGNoKGhyZWYpIHtcblx0Y29uc3QgdGFyZ2V0ID0gc2VsZWN0X3RhcmdldChuZXcgVVJMKGhyZWYsIGRvY3VtZW50LmJhc2VVUkkpKTtcblxuXHRpZiAodGFyZ2V0KSB7XG5cdFx0aWYgKCFwcmVmZXRjaGluZyB8fCBocmVmICE9PSBwcmVmZXRjaGluZy5ocmVmKSB7XG5cdFx0XHRzZXRfcHJlZmV0Y2hpbmcoaHJlZiwgaHlkcmF0ZV90YXJnZXQodGFyZ2V0KSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHByZWZldGNoaW5nLnByb21pc2U7XG5cdH1cbn1cblxuZnVuY3Rpb24gc3RhcnQob3B0c1xuXG4pIHtcblx0aWYgKCdzY3JvbGxSZXN0b3JhdGlvbicgaW4gX2hpc3RvcnkpIHtcblx0XHRfaGlzdG9yeS5zY3JvbGxSZXN0b3JhdGlvbiA9ICdtYW51YWwnO1xuXHR9XG5cblx0c2V0X3RhcmdldChvcHRzLnRhcmdldCk7XG5cblx0YWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVfY2xpY2spO1xuXHRhZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIGhhbmRsZV9wb3BzdGF0ZSk7XG5cblx0Ly8gcHJlZmV0Y2hcblx0YWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRyaWdnZXJfcHJlZmV0Y2gpO1xuXHRhZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVfbW91c2Vtb3ZlKTtcblxuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cdFx0Y29uc3QgeyBoYXNoLCBocmVmIH0gPSBsb2NhdGlvbjtcblxuXHRcdF9oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7IGlkOiB1aWQgfSwgJycsIGhyZWYpO1xuXG5cdFx0Y29uc3QgdXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblxuXHRcdGlmIChpbml0aWFsX2RhdGEuZXJyb3IpIHJldHVybiBoYW5kbGVfZXJyb3IoKTtcblxuXHRcdGNvbnN0IHRhcmdldCA9IHNlbGVjdF90YXJnZXQodXJsKTtcblx0XHRpZiAodGFyZ2V0KSByZXR1cm4gbmF2aWdhdGUodGFyZ2V0LCB1aWQsIHRydWUsIGhhc2gpO1xuXHR9KTtcbn1cblxubGV0IG1vdXNlbW92ZV90aW1lb3V0O1xuXG5mdW5jdGlvbiBoYW5kbGVfbW91c2Vtb3ZlKGV2ZW50KSB7XG5cdGNsZWFyVGltZW91dChtb3VzZW1vdmVfdGltZW91dCk7XG5cdG1vdXNlbW92ZV90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0dHJpZ2dlcl9wcmVmZXRjaChldmVudCk7XG5cdH0sIDIwKTtcbn1cblxuZnVuY3Rpb24gdHJpZ2dlcl9wcmVmZXRjaChldmVudCkge1xuXHRjb25zdCBhID0gZmluZF9hbmNob3IoZXZlbnQudGFyZ2V0KTtcblx0aWYgKCFhIHx8IGEucmVsICE9PSAncHJlZmV0Y2gnKSByZXR1cm47XG5cblx0cHJlZmV0Y2goYS5ocmVmKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX2NsaWNrKGV2ZW50KSB7XG5cdC8vIEFkYXB0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vdmlzaW9ubWVkaWEvcGFnZS5qc1xuXHQvLyBNSVQgbGljZW5zZSBodHRwczovL2dpdGh1Yi5jb20vdmlzaW9ubWVkaWEvcGFnZS5qcyNsaWNlbnNlXG5cdGlmICh3aGljaChldmVudCkgIT09IDEpIHJldHVybjtcblx0aWYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5zaGlmdEtleSkgcmV0dXJuO1xuXHRpZiAoZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkgcmV0dXJuO1xuXG5cdGNvbnN0IGEgPSBmaW5kX2FuY2hvcihldmVudC50YXJnZXQpO1xuXHRpZiAoIWEpIHJldHVybjtcblxuXHRpZiAoIWEuaHJlZikgcmV0dXJuO1xuXG5cdC8vIGNoZWNrIGlmIGxpbmsgaXMgaW5zaWRlIGFuIHN2Z1xuXHQvLyBpbiB0aGlzIGNhc2UsIGJvdGggaHJlZiBhbmQgdGFyZ2V0IGFyZSBhbHdheXMgaW5zaWRlIGFuIG9iamVjdFxuXHRjb25zdCBzdmcgPSB0eXBlb2YgYS5ocmVmID09PSAnb2JqZWN0JyAmJiBhLmhyZWYuY29uc3RydWN0b3IubmFtZSA9PT0gJ1NWR0FuaW1hdGVkU3RyaW5nJztcblx0Y29uc3QgaHJlZiA9IFN0cmluZyhzdmcgPyAoYSkuaHJlZi5iYXNlVmFsIDogYS5ocmVmKTtcblxuXHRpZiAoaHJlZiA9PT0gbG9jYXRpb24uaHJlZikge1xuXHRcdGlmICghbG9jYXRpb24uaGFzaCkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBJZ25vcmUgaWYgdGFnIGhhc1xuXHQvLyAxLiAnZG93bmxvYWQnIGF0dHJpYnV0ZVxuXHQvLyAyLiByZWw9J2V4dGVybmFsJyBhdHRyaWJ1dGVcblx0aWYgKGEuaGFzQXR0cmlidXRlKCdkb3dubG9hZCcpIHx8IGEuZ2V0QXR0cmlidXRlKCdyZWwnKSA9PT0gJ2V4dGVybmFsJykgcmV0dXJuO1xuXG5cdC8vIElnbm9yZSBpZiA8YT4gaGFzIGEgdGFyZ2V0XG5cdGlmIChzdmcgPyAoYSkudGFyZ2V0LmJhc2VWYWwgOiBhLnRhcmdldCkgcmV0dXJuO1xuXG5cdGNvbnN0IHVybCA9IG5ldyBVUkwoaHJlZik7XG5cblx0Ly8gRG9uJ3QgaGFuZGxlIGhhc2ggY2hhbmdlc1xuXHRpZiAodXJsLnBhdGhuYW1lID09PSBsb2NhdGlvbi5wYXRobmFtZSAmJiB1cmwuc2VhcmNoID09PSBsb2NhdGlvbi5zZWFyY2gpIHJldHVybjtcblxuXHRjb25zdCB0YXJnZXQgPSBzZWxlY3RfdGFyZ2V0KHVybCk7XG5cdGlmICh0YXJnZXQpIHtcblx0XHRjb25zdCBub3Njcm9sbCA9IGEuaGFzQXR0cmlidXRlKCdzYXBwZXItbm9zY3JvbGwnKTtcblx0XHRuYXZpZ2F0ZSh0YXJnZXQsIG51bGwsIG5vc2Nyb2xsLCB1cmwuaGFzaCk7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRfaGlzdG9yeS5wdXNoU3RhdGUoeyBpZDogY2lkIH0sICcnLCB1cmwuaHJlZik7XG5cdH1cbn1cblxuZnVuY3Rpb24gd2hpY2goZXZlbnQpIHtcblx0cmV0dXJuIGV2ZW50LndoaWNoID09PSBudWxsID8gZXZlbnQuYnV0dG9uIDogZXZlbnQud2hpY2g7XG59XG5cbmZ1bmN0aW9uIGZpbmRfYW5jaG9yKG5vZGUpIHtcblx0d2hpbGUgKG5vZGUgJiYgbm9kZS5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpICE9PSAnQScpIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7IC8vIFNWRyA8YT4gZWxlbWVudHMgaGF2ZSBhIGxvd2VyY2FzZSBuYW1lXG5cdHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcG9wc3RhdGUoZXZlbnQpIHtcblx0c2Nyb2xsX2hpc3RvcnlbY2lkXSA9IHNjcm9sbF9zdGF0ZSgpO1xuXG5cdGlmIChldmVudC5zdGF0ZSkge1xuXHRcdGNvbnN0IHVybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0Y29uc3QgdGFyZ2V0ID0gc2VsZWN0X3RhcmdldCh1cmwpO1xuXHRcdGlmICh0YXJnZXQpIHtcblx0XHRcdG5hdmlnYXRlKHRhcmdldCwgZXZlbnQuc3RhdGUuaWQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsb2NhdGlvbi5ocmVmID0gbG9jYXRpb24uaHJlZjtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gaGFzaGNoYW5nZVxuXHRcdHNldF91aWQodWlkICsgMSk7XG5cdFx0c2V0X2NpZCh1aWQpO1xuXHRcdF9oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7IGlkOiBjaWQgfSwgJycsIGxvY2F0aW9uLmhyZWYpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHByZWZldGNoUm91dGVzKHBhdGhuYW1lcykge1xuXHRyZXR1cm4gcm91dGVzXG5cdFx0LmZpbHRlcihwYXRobmFtZXNcblx0XHRcdD8gcm91dGUgPT4gcGF0aG5hbWVzLnNvbWUocGF0aG5hbWUgPT4gcm91dGUucGF0dGVybi50ZXN0KHBhdGhuYW1lKSlcblx0XHRcdDogKCkgPT4gdHJ1ZVxuXHRcdClcblx0XHQucmVkdWNlKChwcm9taXNlLCByb3V0ZSkgPT4gcHJvbWlzZS50aGVuKCgpID0+IHtcblx0XHRcdHJldHVybiBQcm9taXNlLmFsbChyb3V0ZS5wYXJ0cy5tYXAocGFydCA9PiBwYXJ0ICYmIGxvYWRfY29tcG9uZW50KGNvbXBvbmVudHNbcGFydC5pXSkpKTtcblx0XHR9KSwgUHJvbWlzZS5yZXNvbHZlKCkpO1xufVxuXG5jb25zdCBzdG9yZXMkMSA9ICgpID0+IGdldENvbnRleHQoQ09OVEVYVF9LRVkpO1xuXG5leHBvcnQgeyBnb3RvLCBwcmVmZXRjaCwgcHJlZmV0Y2hSb3V0ZXMsIHN0YXJ0LCBzdG9yZXMkMSBhcyBzdG9yZXMgfTtcbiIsImltcG9ydCAqIGFzIHNhcHBlciBmcm9tICdAc2FwcGVyL2FwcCc7XG5cbnNhcHBlci5zdGFydCh7XG5cdHRhcmdldDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NhcHBlcicpXG59KTsiXSwibmFtZXMiOlsiRXJyb3JDb21wb25lbnQiLCJkZXRhY2giLCJyb290X3ByZWxvYWQiLCJzYXBwZXIuc3RhcnQiXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsSUFBSSxHQUFHLEdBQUc7QUFFbkIsU0FBUyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUMxQjtBQUNBLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxHQUFHO0FBQ3ZCLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFD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R0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0IsRUFBRTtBQUNGO0FBQ0EsQ0FBQyxJQUFJLENBQWlDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7QUFDdEQsRUFBRSxVQUFVLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztBQUNsQyxFQUFFLGNBQWMsR0FBRyxVQUFVLENBQUM7QUFDOUIsRUFBRSxNQUFNLEFBS0E7QUFDUixFQUFFLE1BQU0sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBQ2pDLEVBQUU7QUFDRixDQUFDLEVBQUU7OztBQ2pESSxNQUFNLFdBQVcsR0FBRyxDQUFDLE1BQU0sR0FBRyxFQUFFLEtBQUssTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDbEUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsS0FBSyxTQUFTLEtBQUssU0FBUyxJQUFJLFNBQVMsS0FBSyxJQUFJLENBQUM7QUFDcEYsR0FBRyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEtBQUs7QUFDbEQsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUM7QUFDN0UsSUFBSSxPQUFPLENBQUMsRUFBRSxXQUFXLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsR0FBRyxFQUFFLEVBQUUsRUFBQztBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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
