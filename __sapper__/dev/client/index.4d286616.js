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
            for (let j = 0; j < node.attributes.length; j += 1) {
                const attribute = node.attributes[j];
                if (!attributes[attribute.name])
                    node.removeAttribute(attribute.name);
            }
            return nodes.splice(i, 1)[0]; // TODO strip unwanted attributes
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
function flush() {
    const seen_callbacks = new Set();
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
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
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
        ? instance(component, prop_values, (i, ret, value = ret) => {
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
    document.dispatchEvent(custom_event(type, detail));
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

const contextMapbox = {};

/* src/layouts/Map/Map.svelte generated by Svelte v3.16.7 */
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

/* src/layouts/Map/MapMarker.svelte generated by Svelte v3.16.7 */

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
		const props = options.props || ({});

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

/* src/components/Icon.svelte generated by Svelte v3.16.7 */
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
		const props = options.props || ({});

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

/* src/components/Rate.svelte generated by Svelte v3.16.7 */
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
	let { size = "medium" } = $$props;
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

/* src/components/Input.svelte generated by Svelte v3.16.7 */
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

			dispose = [
				listen_dev(input, "input", /*input_input_handler*/ ctx[36]),
				listen_dev(input, "blur", /*blur_handler_1*/ ctx[37], false, false, false),
				listen_dev(input, "focus", /*focus_handler_1*/ ctx[38], false, false, false),
				listen_dev(input, "click", /*onClick*/ ctx[22], false, false, false)
			];
		},
		m: function mount(target, anchor) {
			insert_dev(target, input, anchor);
			set_input_value(input, /*value*/ ctx[0]);
		},
		p: function update(ctx, dirty) {
			set_attributes(input, get_spread_update(input_levels, [
				dirty[0] & /*min*/ 64 && ({ min: /*min*/ ctx[6] }),
				dirty[0] & /*max*/ 128 && ({ max: /*max*/ ctx[7] }),
				dirty[0] & /*name*/ 2 && ({ name: /*name*/ ctx[1] }),
				dirty[0] & /*list*/ 256 && ({ list: /*list*/ ctx[8] }),
				dirty[0] & /*form*/ 512 && ({ form: /*form*/ ctx[9] }),
				dirty[0] & /*align*/ 4 && ({ align: /*align*/ ctx[2] }),
				dirty[0] & /*readonly*/ 1024 && ({ readOnly: /*readonly*/ ctx[10] }),
				dirty[0] & /*disabled*/ 32 && ({ disabled: /*disabled*/ ctx[5] }),
				dirty[0] & /*required*/ 2048 && ({ required: /*required*/ ctx[11] }),
				dirty[0] & /*maxlength*/ 8 && ({ maxlength: /*maxlength*/ ctx[3] }),
				dirty[0] & /*placeholder*/ 4096 && ({ placeholder: /*placeholder*/ ctx[12] }),
				dirty[0] & /*idProp*/ 32768 && ({ id: /*idProp*/ ctx[15] }),
				dirty[0] & /*classProp*/ 8192 && ({ class: /*classProp*/ ctx[13] }),
				dirty[0] & /*titleProp*/ 131072 && ({ title: /*titleProp*/ ctx[17] }),
				dirty[0] & /*styleProp*/ 1048576 && ({ style: /*styleProp*/ ctx[20] }),
				dirty[0] & /*patternProp*/ 2097152 && ({ pattern: /*patternProp*/ ctx[21] }),
				dirty[0] & /*ariaLabelProp*/ 262144 && ({ "aria-label": /*ariaLabelProp*/ ctx[18] }),
				dirty[0] & /*autocompleteProp*/ 524288 && ({
					autocomplete: /*autocompleteProp*/ ctx[19]
				}),
				dirty[0] & /*typeProp*/ 65536 && ({ type: /*typeProp*/ ctx[16] })
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

			dispose = [
				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[33]),
				listen_dev(textarea, "blur", /*blur_handler*/ ctx[34], false, false, false),
				listen_dev(textarea, "focus", /*focus_handler*/ ctx[35], false, false, false),
				listen_dev(textarea, "click", /*onClick*/ ctx[22], false, false, false)
			];
		},
		m: function mount(target, anchor) {
			insert_dev(target, textarea, anchor);
			set_input_value(textarea, /*value*/ ctx[0]);
		},
		p: function update(ctx, dirty) {
			set_attributes(textarea, get_spread_update(textarea_levels, [
				dirty[0] & /*min*/ 64 && ({ min: /*min*/ ctx[6] }),
				dirty[0] & /*max*/ 128 && ({ max: /*max*/ ctx[7] }),
				dirty[0] & /*rows*/ 16 && ({ rows: /*rows*/ ctx[4] }),
				dirty[0] & /*name*/ 2 && ({ name: /*name*/ ctx[1] }),
				dirty[0] & /*form*/ 512 && ({ form: /*form*/ ctx[9] }),
				dirty[0] & /*align*/ 4 && ({ align: /*align*/ ctx[2] }),
				dirty[0] & /*readonly*/ 1024 && ({ readOnly: /*readonly*/ ctx[10] }),
				dirty[0] & /*disabled*/ 32 && ({ disabled: /*disabled*/ ctx[5] }),
				dirty[0] & /*required*/ 2048 && ({ required: /*required*/ ctx[11] }),
				dirty[0] & /*maxlength*/ 8 && ({ maxlength: /*maxlength*/ ctx[3] }),
				dirty[0] & /*placeholder*/ 4096 && ({ placeholder: /*placeholder*/ ctx[12] }),
				dirty[0] & /*idProp*/ 32768 && ({ id: /*idProp*/ ctx[15] }),
				dirty[0] & /*classProp*/ 8192 && ({ class: /*classProp*/ ctx[13] }),
				dirty[0] & /*titleProp*/ 131072 && ({ title: /*titleProp*/ ctx[17] }),
				dirty[0] & /*styleProp*/ 1048576 && ({ style: /*styleProp*/ ctx[20] }),
				dirty[0] & /*patternProp*/ 2097152 && ({ pattern: /*patternProp*/ ctx[21] }),
				dirty[0] & /*ariaLabelProp*/ 262144 && ({ "aria-label": /*ariaLabelProp*/ ctx[18] }),
				dirty[0] & /*autocompleteProp*/ 524288 && ({
					autocomplete: /*autocompleteProp*/ ctx[19]
				}),
				dirty[0] & /*typeProp*/ 65536 && ({ type: /*typeProp*/ ctx[16] })
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
		const props = options.props || ({});

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

/* src/components/Picture.svelte generated by Svelte v3.16.7 */
const file$4 = "src/components/Picture.svelte";

function create_fragment$5(ctx) {
	let figure;
	let img;
	let img_src_value;
	let t;
	let figcaption;
	let figure_class_value;
	let current;
	let dispose;
	const default_slot_template = /*$$slots*/ ctx[13].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);

	const block = {
		c: function create() {
			figure = element("figure");
			img = element("img");
			t = space();
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

			t = claim_space(figure_nodes);
			figcaption = claim_element(figure_nodes, "FIGCAPTION", {});
			var figcaption_nodes = children(figcaption);
			if (default_slot) default_slot.l(figcaption_nodes);
			figcaption_nodes.forEach(detach_dev);
			figure_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			attr_dev(img, "id", /*id*/ ctx[2]);
			attr_dev(img, "alt", /*alt*/ ctx[1]);
			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
			attr_dev(img, "width", /*width*/ ctx[3]);
			attr_dev(img, "height", /*height*/ ctx[4]);
			attr_dev(img, "class", "pic svelte-1rkw8xk");
			add_location(img, file$4, 30, 4, 654);
			add_location(figcaption, file$4, 41, 4, 849);
			attr_dev(figure, "class", figure_class_value = "" + (null_to_empty(/*wrapClassProp*/ ctx[5]) + " svelte-1rkw8xk"));
			add_location(figure, file$4, 29, 0, 619);

			dispose = [
				listen_dev(img, "load", /*onLoad*/ ctx[6], false, false, false),
				listen_dev(img, "error", /*onError*/ ctx[7], false, false, false)
			];
		},
		m: function mount(target, anchor) {
			insert_dev(target, figure, anchor);
			append_dev(figure, img);
			append_dev(figure, t);
			append_dev(figure, figcaption);

			if (default_slot) {
				default_slot.m(figcaption, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (!current || dirty & /*id*/ 4) {
				attr_dev(img, "id", /*id*/ ctx[2]);
			}

			if (!current || dirty & /*alt*/ 2) {
				attr_dev(img, "alt", /*alt*/ ctx[1]);
			}

			if (!current || dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0])) {
				attr_dev(img, "src", img_src_value);
			}

			if (!current || dirty & /*width*/ 8) {
				attr_dev(img, "width", /*width*/ ctx[3]);
			}

			if (!current || dirty & /*height*/ 16) {
				attr_dev(img, "height", /*height*/ ctx[4]);
			}

			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4096) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
			}

			if (!current || dirty & /*wrapClassProp*/ 32 && figure_class_value !== (figure_class_value = "" + (null_to_empty(/*wrapClassProp*/ ctx[5]) + " svelte-1rkw8xk"))) {
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
	let { id = undefined } = $$props;
	let { width = undefined } = $$props;
	let { height = undefined } = $$props;
	let loading = true;
	let isError = false;

	function onLoad(e) {
		$$invalidate(8, loading = false);
		dispatch("load", e);
	}

	function onError(e) {
		$$invalidate(8, loading = false);
		$$invalidate(9, isError = true);
		dispatch("error", e);
	}

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$new_props => {
		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("src" in $$new_props) $$invalidate(0, src = $$new_props.src);
		if ("alt" in $$new_props) $$invalidate(1, alt = $$new_props.alt);
		if ("id" in $$new_props) $$invalidate(2, id = $$new_props.id);
		if ("width" in $$new_props) $$invalidate(3, width = $$new_props.width);
		if ("height" in $$new_props) $$invalidate(4, height = $$new_props.height);
		if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			src,
			alt,
			id,
			width,
			height,
			loading,
			isError,
			wrapClassProp
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
		if ("src" in $$props) $$invalidate(0, src = $$new_props.src);
		if ("alt" in $$props) $$invalidate(1, alt = $$new_props.alt);
		if ("id" in $$props) $$invalidate(2, id = $$new_props.id);
		if ("width" in $$props) $$invalidate(3, width = $$new_props.width);
		if ("height" in $$props) $$invalidate(4, height = $$new_props.height);
		if ("loading" in $$props) $$invalidate(8, loading = $$new_props.loading);
		if ("isError" in $$props) $$invalidate(9, isError = $$new_props.isError);
		if ("wrapClassProp" in $$props) $$invalidate(5, wrapClassProp = $$new_props.wrapClassProp);
	};

	let wrapClassProp;

	$$self.$$.update = () => {
		 $$invalidate(5, wrapClassProp = classnames("picture", $$props.class, { loading, isError }));
	};

	$$props = exclude_internal_props($$props);

	return [
		src,
		alt,
		id,
		width,
		height,
		wrapClassProp,
		onLoad,
		onError,
		loading,
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
			id: 2,
			width: 3,
			height: 4
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Picture",
			options,
			id: create_fragment$5.name
		});

		const { ctx } = this.$$;
		const props = options.props || ({});

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

/* src/components/Avatar.svelte generated by Svelte v3.16.7 */
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
	let { size = "medium" } = $$props;

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
		const props = options.props || ({});

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

/* src/components/Button.svelte generated by Svelte v3.16.7 */
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
			dispose = listen_dev(button, "click", /*onClick*/ ctx[9], false, false, false);
		},
		m: function mount(target, anchor) {
			insert_dev(target, button, anchor);

			if (default_slot) {
				default_slot.m(button, null);
			}

			current = true;
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
			dispose = listen_dev(label, "click", /*onLabelClick*/ ctx[8], false, false, false);
		},
		m: function mount(target, anchor) {
			insert_dev(target, label, anchor);

			if (default_slot) {
				default_slot.m(label, null);
			}

			current = true;
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
function create_if_block$2(ctx) {
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
			dispose = listen_dev(a, "click", /*onClick*/ ctx[9], false, false, false);
		},
		m: function mount(target, anchor) {
			insert_dev(target, a, anchor);

			if (default_slot) {
				default_slot.m(a, null);
			}

			current = true;
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
		id: create_if_block$2.name,
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
	const if_block_creators = [create_if_block$2, create_if_block_1, create_else_block$1];
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

/* src/components/Divider.svelte generated by Svelte v3.16.7 */
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

/* src/components/Progress.svelte generated by Svelte v3.16.7 */
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
	let { value = 0 } = $$props;
	let { size = "medium" } = $$props;
	let { title = undefined } = $$props;
	let { ariaLabel = undefined } = $$props;
	let { borderRadius = undefined } = $$props;

	onMount(() => {
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

/* src/components/Carousel.svelte generated by Svelte v3.16.7 */
const file$9 = "src/components/Carousel.svelte";
const get_default_slot_changes = dirty => ({ item: dirty & /*items*/ 1 });
const get_default_slot_context = ctx => ({ item: /*item*/ ctx[5] });

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i];
	return child_ctx;
}

// (56:4) {#each items as item}
function create_each_block(ctx) {
	let li;
	let t;
	let current;
	const default_slot_template = /*$$slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], get_default_slot_context);

	const picture = new Picture({
			props: {
				src: /*item*/ ctx[5].src,
				alt: /*item*/ ctx[5].alt
			},
			$$inline: true
		});

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
			add_location(li, file$9, 56, 8, 1782);
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
				const picture_changes = {};
				if (dirty & /*items*/ 1) picture_changes.src = /*item*/ ctx[5].src;
				if (dirty & /*items*/ 1) picture_changes.alt = /*item*/ ctx[5].alt;
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
		source: "(56:4) {#each items as item}",
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
			add_location(ul, file$9, 54, 0, 1721);
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

/* src/layouts/Header.svelte generated by Svelte v3.16.7 */
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
			attr_dev(a2, "href", "lists");
			attr_dev(a2, "class", "svelte-iotsi1");
			toggle_class(a2, "selected", /*segment*/ ctx[0] === "lists");
			add_location(a2, file$a, 21, 12, 632);
			add_location(li2, file$a, 21, 8, 628);
			attr_dev(a3, "rel", "prefetch");
			attr_dev(a3, "href", "charity");
			attr_dev(a3, "class", "svelte-iotsi1");
			toggle_class(a3, "selected", /*segment*/ ctx[0] === "charity");
			add_location(a3, file$a, 22, 12, 727);
			add_location(li3, file$a, 22, 8, 723);
			attr_dev(a4, "rel", "prefetch");
			attr_dev(a4, "href", "organization");
			attr_dev(a4, "class", "svelte-iotsi1");
			toggle_class(a4, "selected", /*segment*/ ctx[0] === "organization");
			add_location(a4, file$a, 23, 12, 828);
			add_location(li4, file$a, 23, 8, 824);
			add_location(ul0, file$a, 18, 4, 447);
			option0.__value = "ua";
			option0.value = option0.__value;
			add_location(option0, file$a, 29, 16, 1073);
			option1.__value = "ru";
			option1.value = option1.__value;
			add_location(option1, file$a, 30, 16, 1120);
			option2.__value = "en";
			option2.value = option2.__value;
			add_location(option2, file$a, 31, 16, 1167);
			attr_dev(select, "name", "lang");
			attr_dev(select, "id", "lang");
			attr_dev(select, "class", "btn small lang-select svelte-iotsi1");
			add_location(select, file$a, 28, 12, 988);
			attr_dev(li5, "class", "svelte-iotsi1");
			add_location(li5, file$a, 27, 8, 971);
			attr_dev(li6, "class", "svelte-iotsi1");
			add_location(li6, file$a, 35, 8, 1243);
			attr_dev(li7, "class", "svelte-iotsi1");
			add_location(li7, file$a, 41, 8, 1414);
			attr_dev(ul1, "class", "nav-actions svelte-iotsi1");
			add_location(ul1, file$a, 26, 4, 938);
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
		const props = options.props || ({});

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

/* src/layouts/Footer.svelte generated by Svelte v3.16.7 */

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

/* src/layouts/Comment.svelte generated by Svelte v3.16.7 */
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

/* src/layouts/AvatarAndName.svelte generated by Svelte v3.16.7 */
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

/* src/layouts/ListItems.svelte generated by Svelte v3.16.7 */
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
		each_1_else.c();
	}

	const block = {
		c: function create() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		l: function claim(nodes) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].l(nodes);
			}

			each_1_anchor = empty();
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

/* src/layouts/SearchLine.svelte generated by Svelte v3.16.7 */
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

/* src/layouts/CharityCard.svelte generated by Svelte v3.16.7 */
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

/* src/layouts/CharityCards.svelte generated by Svelte v3.16.7 */
const file$h = "src/layouts/CharityCards.svelte";

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[4] = list[i];
	return child_ctx;
}

// (50:4) {#if listName}
function create_if_block$3(ctx) {
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
		id: create_if_block$3.name,
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
	let if_block = /*listName*/ ctx[0] && create_if_block$3(ctx);
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
					if_block = create_if_block$3(ctx);
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
		const props = options.props || ({});

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

/* src/layouts/TitleSubTitle.svelte generated by Svelte v3.16.7 */

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

/* src/layouts/DonatingGroup.svelte generated by Svelte v3.16.7 */
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

/* src/layouts/ContentHolder.svelte generated by Svelte v3.16.7 */

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

/* src/layouts/ListOfFeatures.svelte generated by Svelte v3.16.7 */

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

export { ListItems as $, text as A, claim_text as B, set_data_dev as C, empty as D, assign as E, setContext as F, get_spread_update as G, Header as H, get_spread_object as I, group_outros as J, check_outros as K, Carousel as L, ContentHolder as M, Divider as N, ListOfFeatures as O, Progress as P, Footer as Q, CharityCards as R, SvelteComponentDev as S, TitleSubTitle as T, Comment as U, createCommonjsModule as V, unwrapExports as W, DonatingGroup as X, AvatarAndName as Y, Rate as Z, onMount as _, svg_element as a, SearchLine as a0, toggle_class as a1, Map$1 as a2, MapMarker as a3, destroy_each as a4, children as b, claim_element as c, dispatch_dev as d, element as e, detach_dev as f, attr_dev as g, add_location as h, init as i, set_style as j, insert_dev as k, append_dev as l, create_slot as m, noop as n, create_component as o, space as p, claim_component as q, claim_space as r, safe_not_equal as s, mount_component as t, get_slot_context as u, get_slot_changes as v, transition_in as w, transition_out as x, destroy_component as y, globals as z };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguNGQyODY2MTYuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdmVsdGUvaW50ZXJuYWwvaW5kZXgubWpzIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvTWFwL2NvbnRleHQuanMiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9NYXAvTWFwLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL01hcC9NYXBNYXJrZXIuc3ZlbHRlIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2NsYXNzbmFtZXMvaW5kZXguanMiLCIuLi8uLi8uLi9zcmMvdXRpbHMuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9JY29uLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL1JhdGUuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvSW5wdXQuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvUGljdHVyZS5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9BdmF0YXIuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvQnV0dG9uLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0RpdmlkZXIuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvUHJvZ3Jlc3Muc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvQ2Fyb3VzZWwuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvSGVhZGVyLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL0Zvb3Rlci5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9Db21tZW50LnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL0F2YXRhckFuZE5hbWUuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvTGlzdEl0ZW1zLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL0NoYXJpdHlDYXJkLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL0NoYXJpdHlDYXJkcy5zdmVsdGUiLCIuLi8uLi8uLi9zcmMvbGF5b3V0cy9UaXRsZVN1YlRpdGxlLnN2ZWx0ZSIsIi4uLy4uLy4uL3NyYy9sYXlvdXRzL0RvbmF0aW5nR3JvdXAuc3ZlbHRlIiwiLi4vLi4vLi4vc3JjL2xheW91dHMvTGlzdE9mRmVhdHVyZXMuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIG5vb3AoKSB7IH1cbmNvbnN0IGlkZW50aXR5ID0geCA9PiB4O1xuZnVuY3Rpb24gYXNzaWduKHRhciwgc3JjKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGZvciAoY29uc3QgayBpbiBzcmMpXG4gICAgICAgIHRhcltrXSA9IHNyY1trXTtcbiAgICByZXR1cm4gdGFyO1xufVxuZnVuY3Rpb24gaXNfcHJvbWlzZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gYWRkX2xvY2F0aW9uKGVsZW1lbnQsIGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhcikge1xuICAgIGVsZW1lbnQuX19zdmVsdGVfbWV0YSA9IHtcbiAgICAgICAgbG9jOiB7IGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhciB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHJ1bihmbikge1xuICAgIHJldHVybiBmbigpO1xufVxuZnVuY3Rpb24gYmxhbmtfb2JqZWN0KCkge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuZnVuY3Rpb24gcnVuX2FsbChmbnMpIHtcbiAgICBmbnMuZm9yRWFjaChydW4pO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gc2FmZV9ub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cbmZ1bmN0aW9uIG5vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGI7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zdG9yZShzdG9yZSwgbmFtZSkge1xuICAgIGlmICghc3RvcmUgfHwgdHlwZW9mIHN0b3JlLnN1YnNjcmliZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCcke25hbWV9JyBpcyBub3QgYSBzdG9yZSB3aXRoIGEgJ3N1YnNjcmliZScgbWV0aG9kYCk7XG4gICAgfVxufVxuZnVuY3Rpb24gc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHVuc3ViID0gc3RvcmUuc3Vic2NyaWJlKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdW5zdWIudW5zdWJzY3JpYmUgPyAoKSA9PiB1bnN1Yi51bnN1YnNjcmliZSgpIDogdW5zdWI7XG59XG5mdW5jdGlvbiBnZXRfc3RvcmVfdmFsdWUoc3RvcmUpIHtcbiAgICBsZXQgdmFsdWU7XG4gICAgc3Vic2NyaWJlKHN0b3JlLCBfID0+IHZhbHVlID0gXykoKTtcbiAgICByZXR1cm4gdmFsdWU7XG59XG5mdW5jdGlvbiBjb21wb25lbnRfc3Vic2NyaWJlKGNvbXBvbmVudCwgc3RvcmUsIGNhbGxiYWNrKSB7XG4gICAgY29tcG9uZW50LiQkLm9uX2Rlc3Ryb3kucHVzaChzdWJzY3JpYmUoc3RvcmUsIGNhbGxiYWNrKSk7XG59XG5mdW5jdGlvbiBjcmVhdGVfc2xvdChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKSB7XG4gICAgaWYgKGRlZmluaXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2xvdF9jdHggPSBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pO1xuICAgICAgICByZXR1cm4gZGVmaW5pdGlvblswXShzbG90X2N0eCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKSB7XG4gICAgcmV0dXJuIGRlZmluaXRpb25bMV0gJiYgZm5cbiAgICAgICAgPyBhc3NpZ24oJCRzY29wZS5jdHguc2xpY2UoKSwgZGVmaW5pdGlvblsxXShmbihjdHgpKSlcbiAgICAgICAgOiAkJHNjb3BlLmN0eDtcbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NoYW5nZXMoZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGZuKSB7XG4gICAgaWYgKGRlZmluaXRpb25bMl0gJiYgZm4pIHtcbiAgICAgICAgY29uc3QgbGV0cyA9IGRlZmluaXRpb25bMl0oZm4oZGlydHkpKTtcbiAgICAgICAgaWYgKHR5cGVvZiAkJHNjb3BlLmRpcnR5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gW107XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBNYXRoLm1heCgkJHNjb3BlLmRpcnR5Lmxlbmd0aCwgbGV0cy5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIG1lcmdlZFtpXSA9ICQkc2NvcGUuZGlydHlbaV0gfCBsZXRzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJCRzY29wZS5kaXJ0eSB8IGxldHM7XG4gICAgfVxuICAgIHJldHVybiAkJHNjb3BlLmRpcnR5O1xufVxuZnVuY3Rpb24gZXhjbHVkZV9pbnRlcm5hbF9wcm9wcyhwcm9wcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3VsdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgbGV0IHJhbiA9IGZhbHNlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBpZiAocmFuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICAgIH07XG59XG5mdW5jdGlvbiBudWxsX3RvX2VtcHR5KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X3N0b3JlX3ZhbHVlKHN0b3JlLCByZXQsIHZhbHVlID0gcmV0KSB7XG4gICAgc3RvcmUuc2V0KHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufVxuY29uc3QgaGFzX3Byb3AgPSAob2JqLCBwcm9wKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbmZ1bmN0aW9uIGFjdGlvbl9kZXN0cm95ZXIoYWN0aW9uX3Jlc3VsdCkge1xuICAgIHJldHVybiBhY3Rpb25fcmVzdWx0ICYmIGlzX2Z1bmN0aW9uKGFjdGlvbl9yZXN1bHQuZGVzdHJveSkgPyBhY3Rpb25fcmVzdWx0LmRlc3Ryb3kgOiBub29wO1xufVxuXG5jb25zdCBpc19jbGllbnQgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbmxldCBub3cgPSBpc19jbGllbnRcbiAgICA/ICgpID0+IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKVxuICAgIDogKCkgPT4gRGF0ZS5ub3coKTtcbmxldCByYWYgPSBpc19jbGllbnQgPyBjYiA9PiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2IpIDogbm9vcDtcbi8vIHVzZWQgaW50ZXJuYWxseSBmb3IgdGVzdGluZ1xuZnVuY3Rpb24gc2V0X25vdyhmbikge1xuICAgIG5vdyA9IGZuO1xufVxuZnVuY3Rpb24gc2V0X3JhZihmbikge1xuICAgIHJhZiA9IGZuO1xufVxuXG5jb25zdCB0YXNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIHJ1bl90YXNrcyhub3cpIHtcbiAgICB0YXNrcy5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICBpZiAoIXRhc2suYyhub3cpKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgICAgICB0YXNrLmYoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0YXNrcy5zaXplICE9PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbn1cbi8qKlxuICogRm9yIHRlc3RpbmcgcHVycG9zZXMgb25seSFcbiAqL1xuZnVuY3Rpb24gY2xlYXJfbG9vcHMoKSB7XG4gICAgdGFza3MuY2xlYXIoKTtcbn1cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB0YXNrIHRoYXQgcnVucyBvbiBlYWNoIHJhZiBmcmFtZVxuICogdW50aWwgaXQgcmV0dXJucyBhIGZhbHN5IHZhbHVlIG9yIGlzIGFib3J0ZWRcbiAqL1xuZnVuY3Rpb24gbG9vcChjYWxsYmFjaykge1xuICAgIGxldCB0YXNrO1xuICAgIGlmICh0YXNrcy5zaXplID09PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm9taXNlOiBuZXcgUHJvbWlzZShmdWxmaWxsID0+IHtcbiAgICAgICAgICAgIHRhc2tzLmFkZCh0YXNrID0geyBjOiBjYWxsYmFjaywgZjogZnVsZmlsbCB9KTtcbiAgICAgICAgfSksXG4gICAgICAgIGFib3J0KCkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kKHRhcmdldCwgbm9kZSkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2VhY2goaXRlcmF0aW9ucywgZGV0YWNoaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zW2ldKVxuICAgICAgICAgICAgaXRlcmF0aW9uc1tpXS5kKGRldGFjaGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBlbGVtZW50X2lzKG5hbWUsIGlzKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSwgeyBpcyB9KTtcbn1cbmZ1bmN0aW9uIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMob2JqLCBleGNsdWRlKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIG9iaikge1xuICAgICAgICBpZiAoaGFzX3Byb3Aob2JqLCBrKVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgJiYgZXhjbHVkZS5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGFyZ2V0W2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cbmZ1bmN0aW9uIHNwYWNlKCkge1xuICAgIHJldHVybiB0ZXh0KCcgJyk7XG59XG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgICByZXR1cm4gdGV4dCgnJyk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcHJldmVudF9kZWZhdWx0KGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc3RvcF9wcm9wYWdhdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzZWxmKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMpXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZSk7XG4gICAgZWxzZSBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSAhPT0gdmFsdWUpXG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG5vZGUuX19wcm90b19fKTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzW2tleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgIG5vZGUuc3R5bGUuY3NzVGV4dCA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZXNjcmlwdG9yc1trZXldICYmIGRlc2NyaXB0b3JzW2tleV0uc2V0KSB7XG4gICAgICAgICAgICBub2RlW2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdmdfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YShub2RlLCBwcm9wLCB2YWx1ZSkge1xuICAgIGlmIChwcm9wIGluIG5vZGUpIHtcbiAgICAgICAgbm9kZVtwcm9wXSA9IHZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYXR0cihub2RlLCBwcm9wLCB2YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24geGxpbmtfYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsIGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUoZ3JvdXApIHtcbiAgICBjb25zdCB2YWx1ZSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXAubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGdyb3VwW2ldLmNoZWNrZWQpXG4gICAgICAgICAgICB2YWx1ZS5wdXNoKGdyb3VwW2ldLl9fdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5mdW5jdGlvbiB0b19udW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09ICcnID8gdW5kZWZpbmVkIDogK3ZhbHVlO1xufVxuZnVuY3Rpb24gdGltZV9yYW5nZXNfdG9fYXJyYXkocmFuZ2VzKSB7XG4gICAgY29uc3QgYXJyYXkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBhcnJheS5wdXNoKHsgc3RhcnQ6IHJhbmdlcy5zdGFydChpKSwgZW5kOiByYW5nZXMuZW5kKGkpIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2VsZW1lbnQobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIHN2Zykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlTmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBub2RlLmF0dHJpYnV0ZXNbal07XG4gICAgICAgICAgICAgICAgaWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZS5uYW1lXSlcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTsgLy8gVE9ETyBzdHJpcCB1bndhbnRlZCBhdHRyaWJ1dGVzXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN2ZyA/IHN2Z19lbGVtZW50KG5hbWUpIDogZWxlbWVudChuYW1lKTtcbn1cbmZ1bmN0aW9uIGNsYWltX3RleHQobm9kZXMsIGRhdGEpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgIG5vZGUuZGF0YSA9ICcnICsgZGF0YTtcbiAgICAgICAgICAgIHJldHVybiBub2Rlcy5zcGxpY2UoaSwgMSlbMF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRleHQoZGF0YSk7XG59XG5mdW5jdGlvbiBjbGFpbV9zcGFjZShub2Rlcykge1xuICAgIHJldHVybiBjbGFpbV90ZXh0KG5vZGVzLCAnICcpO1xufVxuZnVuY3Rpb24gc2V0X2RhdGEodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQuZGF0YSAhPT0gZGF0YSlcbiAgICAgICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF92YWx1ZShpbnB1dCwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCB8fCBpbnB1dC52YWx1ZSkge1xuICAgICAgICBpbnB1dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF90eXBlKGlucHV0LCB0eXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3R5bGUobm9kZSwga2V5LCB2YWx1ZSwgaW1wb3J0YW50KSB7XG4gICAgbm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlLCBpbXBvcnRhbnQgPyAnaW1wb3J0YW50JyA6ICcnKTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb24oc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIGlmIChvcHRpb24uX192YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9ucyhzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gfnZhbHVlLmluZGV4T2Yob3B0aW9uLl9fdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF92YWx1ZShzZWxlY3QpIHtcbiAgICBjb25zdCBzZWxlY3RlZF9vcHRpb24gPSBzZWxlY3QucXVlcnlTZWxlY3RvcignOmNoZWNrZWQnKSB8fCBzZWxlY3Qub3B0aW9uc1swXTtcbiAgICByZXR1cm4gc2VsZWN0ZWRfb3B0aW9uICYmIHNlbGVjdGVkX29wdGlvbi5fX3ZhbHVlO1xufVxuZnVuY3Rpb24gc2VsZWN0X211bHRpcGxlX3ZhbHVlKHNlbGVjdCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChzZWxlY3QucXVlcnlTZWxlY3RvckFsbCgnOmNoZWNrZWQnKSwgb3B0aW9uID0+IG9wdGlvbi5fX3ZhbHVlKTtcbn1cbmZ1bmN0aW9uIGFkZF9yZXNpemVfbGlzdGVuZXIoZWxlbWVudCwgZm4pIHtcbiAgICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KS5wb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgfVxuICAgIGNvbnN0IG9iamVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29iamVjdCcpO1xuICAgIG9iamVjdC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6IGJsb2NrOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgbGVmdDogMDsgaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9pbnRlci1ldmVudHM6IG5vbmU7IHotaW5kZXg6IC0xOycpO1xuICAgIG9iamVjdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBvYmplY3QudHlwZSA9ICd0ZXh0L2h0bWwnO1xuICAgIG9iamVjdC50YWJJbmRleCA9IC0xO1xuICAgIGxldCB3aW47XG4gICAgb2JqZWN0Lm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgd2luID0gb2JqZWN0LmNvbnRlbnREb2N1bWVudC5kZWZhdWx0VmlldztcbiAgICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZuKTtcbiAgICB9O1xuICAgIGlmICgvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKG9iamVjdCk7XG4gICAgICAgIG9iamVjdC5kYXRhID0gJ2Fib3V0OmJsYW5rJztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG9iamVjdC5kYXRhID0gJ2Fib3V0OmJsYW5rJztcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChvYmplY3QpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBjYW5jZWw6ICgpID0+IHtcbiAgICAgICAgICAgIHdpbiAmJiB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lciAmJiB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZm4pO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVDaGlsZChvYmplY3QpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRvZ2dsZV9jbGFzcyhlbGVtZW50LCBuYW1lLCB0b2dnbGUpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdFt0b2dnbGUgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcbn1cbmZ1bmN0aW9uIGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpIHtcbiAgICBjb25zdCBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgZmFsc2UsIGZhbHNlLCBkZXRhaWwpO1xuICAgIHJldHVybiBlO1xufVxuY2xhc3MgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoaHRtbCwgYW5jaG9yID0gbnVsbCkge1xuICAgICAgICB0aGlzLmUgPSBlbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5hID0gYW5jaG9yO1xuICAgICAgICB0aGlzLnUoaHRtbCk7XG4gICAgfVxuICAgIG0odGFyZ2V0LCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpbnNlcnQodGFyZ2V0LCB0aGlzLm5baV0sIGFuY2hvcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50ID0gdGFyZ2V0O1xuICAgIH1cbiAgICB1KGh0bWwpIHtcbiAgICAgICAgdGhpcy5lLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHRoaXMubiA9IEFycmF5LmZyb20odGhpcy5lLmNoaWxkTm9kZXMpO1xuICAgIH1cbiAgICBwKGh0bWwpIHtcbiAgICAgICAgdGhpcy5kKCk7XG4gICAgICAgIHRoaXMudShodG1sKTtcbiAgICAgICAgdGhpcy5tKHRoaXMudCwgdGhpcy5hKTtcbiAgICB9XG4gICAgZCgpIHtcbiAgICAgICAgdGhpcy5uLmZvckVhY2goZGV0YWNoKTtcbiAgICB9XG59XG5cbmxldCBzdHlsZXNoZWV0O1xubGV0IGFjdGl2ZSA9IDA7XG5sZXQgY3VycmVudF9ydWxlcyA9IHt9O1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhcmtza3lhcHAvc3RyaW5nLWhhc2gvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmZ1bmN0aW9uIGhhc2goc3RyKSB7XG4gICAgbGV0IGhhc2ggPSA1MzgxO1xuICAgIGxldCBpID0gc3RyLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgXiBzdHIuY2hhckNvZGVBdChpKTtcbiAgICByZXR1cm4gaGFzaCA+Pj4gMDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9ydWxlKG5vZGUsIGEsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzZSwgZm4sIHVpZCA9IDApIHtcbiAgICBjb25zdCBzdGVwID0gMTYuNjY2IC8gZHVyYXRpb247XG4gICAgbGV0IGtleWZyYW1lcyA9ICd7XFxuJztcbiAgICBmb3IgKGxldCBwID0gMDsgcCA8PSAxOyBwICs9IHN0ZXApIHtcbiAgICAgICAgY29uc3QgdCA9IGEgKyAoYiAtIGEpICogZWFzZShwKTtcbiAgICAgICAga2V5ZnJhbWVzICs9IHAgKiAxMDAgKyBgJXske2ZuKHQsIDEgLSB0KX19XFxuYDtcbiAgICB9XG4gICAgY29uc3QgcnVsZSA9IGtleWZyYW1lcyArIGAxMDAlIHske2ZuKGIsIDEgLSBiKX19XFxufWA7XG4gICAgY29uc3QgbmFtZSA9IGBfX3N2ZWx0ZV8ke2hhc2gocnVsZSl9XyR7dWlkfWA7XG4gICAgaWYgKCFjdXJyZW50X3J1bGVzW25hbWVdKSB7XG4gICAgICAgIGlmICghc3R5bGVzaGVldCkge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGUgPSBlbGVtZW50KCdzdHlsZScpO1xuICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgICAgICAgICBzdHlsZXNoZWV0ID0gc3R5bGUuc2hlZXQ7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudF9ydWxlc1tuYW1lXSA9IHRydWU7XG4gICAgICAgIHN0eWxlc2hlZXQuaW5zZXJ0UnVsZShgQGtleWZyYW1lcyAke25hbWV9ICR7cnVsZX1gLCBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aCk7XG4gICAgfVxuICAgIGNvbnN0IGFuaW1hdGlvbiA9IG5vZGUuc3R5bGUuYW5pbWF0aW9uIHx8ICcnO1xuICAgIG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gYCR7YW5pbWF0aW9uID8gYCR7YW5pbWF0aW9ufSwgYCA6IGBgfSR7bmFtZX0gJHtkdXJhdGlvbn1tcyBsaW5lYXIgJHtkZWxheX1tcyAxIGJvdGhgO1xuICAgIGFjdGl2ZSArPSAxO1xuICAgIHJldHVybiBuYW1lO1xufVxuZnVuY3Rpb24gZGVsZXRlX3J1bGUobm9kZSwgbmFtZSkge1xuICAgIG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gKG5vZGUuc3R5bGUuYW5pbWF0aW9uIHx8ICcnKVxuICAgICAgICAuc3BsaXQoJywgJylcbiAgICAgICAgLmZpbHRlcihuYW1lXG4gICAgICAgID8gYW5pbSA9PiBhbmltLmluZGV4T2YobmFtZSkgPCAwIC8vIHJlbW92ZSBzcGVjaWZpYyBhbmltYXRpb25cbiAgICAgICAgOiBhbmltID0+IGFuaW0uaW5kZXhPZignX19zdmVsdGUnKSA9PT0gLTEgLy8gcmVtb3ZlIGFsbCBTdmVsdGUgYW5pbWF0aW9uc1xuICAgIClcbiAgICAgICAgLmpvaW4oJywgJyk7XG4gICAgaWYgKG5hbWUgJiYgIS0tYWN0aXZlKVxuICAgICAgICBjbGVhcl9ydWxlcygpO1xufVxuZnVuY3Rpb24gY2xlYXJfcnVsZXMoKSB7XG4gICAgcmFmKCgpID0+IHtcbiAgICAgICAgaWYgKGFjdGl2ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGkgPSBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgIHN0eWxlc2hlZXQuZGVsZXRlUnVsZShpKTtcbiAgICAgICAgY3VycmVudF9ydWxlcyA9IHt9O1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfYW5pbWF0aW9uKG5vZGUsIGZyb20sIGZuLCBwYXJhbXMpIHtcbiAgICBpZiAoIWZyb20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHRvID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoZnJvbS5sZWZ0ID09PSB0by5sZWZ0ICYmIGZyb20ucmlnaHQgPT09IHRvLnJpZ2h0ICYmIGZyb20udG9wID09PSB0by50b3AgJiYgZnJvbS5ib3R0b20gPT09IHRvLmJvdHRvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBzaG91bGQgdGhpcyBiZSBzZXBhcmF0ZWQgZnJvbSBkZXN0cnVjdHVyaW5nPyBPciBzdGFydC9lbmQgYWRkZWQgdG8gcHVibGljIGFwaSBhbmQgZG9jdW1lbnRhdGlvbj9cbiAgICBzdGFydDogc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzpcbiAgICBlbmQgPSBzdGFydF90aW1lICsgZHVyYXRpb24sIHRpY2sgPSBub29wLCBjc3MgfSA9IGZuKG5vZGUsIHsgZnJvbSwgdG8gfSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICBsZXQgbmFtZTtcbiAgICBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGVsYXkpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBuYW1lKTtcbiAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgIH1cbiAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgIGlmICghc3RhcnRlZCAmJiBub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQgJiYgbm93ID49IGVuZCkge1xuICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCkge1xuICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHN0YXJ0X3RpbWU7XG4gICAgICAgICAgICBjb25zdCB0ID0gMCArIDEgKiBlYXNpbmcocCAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHN0YXJ0KCk7XG4gICAgdGljaygwLCAxKTtcbiAgICByZXR1cm4gc3RvcDtcbn1cbmZ1bmN0aW9uIGZpeF9wb3NpdGlvbihub2RlKSB7XG4gICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGlmIChzdHlsZS5wb3NpdGlvbiAhPT0gJ2Fic29sdXRlJyAmJiBzdHlsZS5wb3NpdGlvbiAhPT0gJ2ZpeGVkJykge1xuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHN0eWxlO1xuICAgICAgICBjb25zdCBhID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIG5vZGUuc3R5bGUud2lkdGggPSB3aWR0aDtcbiAgICAgICAgbm9kZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGFkZF90cmFuc2Zvcm0obm9kZSwgYSk7XG4gICAgfVxufVxuZnVuY3Rpb24gYWRkX3RyYW5zZm9ybShub2RlLCBhKSB7XG4gICAgY29uc3QgYiA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGEubGVmdCAhPT0gYi5sZWZ0IHx8IGEudG9wICE9PSBiLnRvcCkge1xuICAgICAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHN0eWxlLnRyYW5zZm9ybSA9PT0gJ25vbmUnID8gJycgOiBzdHlsZS50cmFuc2Zvcm07XG4gICAgICAgIG5vZGUuc3R5bGUudHJhbnNmb3JtID0gYCR7dHJhbnNmb3JtfSB0cmFuc2xhdGUoJHthLmxlZnQgLSBiLmxlZnR9cHgsICR7YS50b3AgLSBiLnRvcH1weClgO1xuICAgIH1cbn1cblxubGV0IGN1cnJlbnRfY29tcG9uZW50O1xuZnVuY3Rpb24gc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgIGN1cnJlbnRfY29tcG9uZW50ID0gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkge1xuICAgIGlmICghY3VycmVudF9jb21wb25lbnQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRnVuY3Rpb24gY2FsbGVkIG91dHNpZGUgY29tcG9uZW50IGluaXRpYWxpemF0aW9uYCk7XG4gICAgcmV0dXJuIGN1cnJlbnRfY29tcG9uZW50O1xufVxuZnVuY3Rpb24gYmVmb3JlVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYmVmb3JlX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uTW91bnQoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9tb3VudC5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFmdGVyVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYWZ0ZXJfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25EZXN0cm95KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fZGVzdHJveS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICByZXR1cm4gKHR5cGUsIGRldGFpbCkgPT4ge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW3R5cGVdO1xuICAgICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGFyZSB0aGVyZSBzaXR1YXRpb25zIHdoZXJlIGV2ZW50cyBjb3VsZCBiZSBkaXNwYXRjaGVkXG4gICAgICAgICAgICAvLyBpbiBhIHNlcnZlciAobm9uLURPTSkgZW52aXJvbm1lbnQ/XG4gICAgICAgICAgICBjb25zdCBldmVudCA9IGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjb21wb25lbnQsIGV2ZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNldENvbnRleHQoa2V5LCBjb250ZXh0KSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5zZXQoa2V5LCBjb250ZXh0KTtcbn1cbmZ1bmN0aW9uIGdldENvbnRleHQoa2V5KSB7XG4gICAgcmV0dXJuIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuZ2V0KGtleSk7XG59XG4vLyBUT0RPIGZpZ3VyZSBvdXQgaWYgd2Ugc3RpbGwgd2FudCB0byBzdXBwb3J0XG4vLyBzaG9ydGhhbmQgZXZlbnRzLCBvciBpZiB3ZSB3YW50IHRvIGltcGxlbWVudFxuLy8gYSByZWFsIGJ1YmJsaW5nIG1lY2hhbmlzbVxuZnVuY3Rpb24gYnViYmxlKGNvbXBvbmVudCwgZXZlbnQpIHtcbiAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW2V2ZW50LnR5cGVdO1xuICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiBmbihldmVudCkpO1xuICAgIH1cbn1cblxuY29uc3QgZGlydHlfY29tcG9uZW50cyA9IFtdO1xuY29uc3QgaW50cm9zID0geyBlbmFibGVkOiBmYWxzZSB9O1xuY29uc3QgYmluZGluZ19jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlbmRlcl9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IGZsdXNoX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVzb2x2ZWRfcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xubGV0IHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIHNjaGVkdWxlX3VwZGF0ZSgpIHtcbiAgICBpZiAoIXVwZGF0ZV9zY2hlZHVsZWQpIHtcbiAgICAgICAgdXBkYXRlX3NjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgIHJlc29sdmVkX3Byb21pc2UudGhlbihmbHVzaCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdGljaygpIHtcbiAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICByZXR1cm4gcmVzb2x2ZWRfcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGFkZF9yZW5kZXJfY2FsbGJhY2soZm4pIHtcbiAgICByZW5kZXJfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWRkX2ZsdXNoX2NhbGxiYWNrKGZuKSB7XG4gICAgZmx1c2hfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgY29uc3Qgc2Vlbl9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG4gICAgZG8ge1xuICAgICAgICAvLyBmaXJzdCwgY2FsbCBiZWZvcmVVcGRhdGUgZnVuY3Rpb25zXG4gICAgICAgIC8vIGFuZCB1cGRhdGUgY29tcG9uZW50c1xuICAgICAgICB3aGlsZSAoZGlydHlfY29tcG9uZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRpcnR5X2NvbXBvbmVudHMuc2hpZnQoKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGNvbXBvbmVudC4kJCk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGJpbmRpbmdfY2FsbGJhY2tzLmxlbmd0aClcbiAgICAgICAgICAgIGJpbmRpbmdfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgICAgIC8vIHRoZW4sIG9uY2UgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgY2FsbFxuICAgICAgICAvLyBhZnRlclVwZGF0ZSBmdW5jdGlvbnMuIFRoaXMgbWF5IGNhdXNlXG4gICAgICAgIC8vIHN1YnNlcXVlbnQgdXBkYXRlcy4uLlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVuZGVyX2NhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgIGlmICghc2Vlbl9jYWxsYmFja3MuaGFzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgLy8gLi4uc28gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBsb29wc1xuICAgICAgICAgICAgICAgIHNlZW5fY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIH0gd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKTtcbiAgICB3aGlsZSAoZmx1c2hfY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICBmbHVzaF9jYWxsYmFja3MucG9wKCkoKTtcbiAgICB9XG4gICAgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xufVxuZnVuY3Rpb24gdXBkYXRlKCQkKSB7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICQkLnVwZGF0ZSgpO1xuICAgICAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgICAgICBjb25zdCBkaXJ0eSA9ICQkLmRpcnR5O1xuICAgICAgICAkJC5kaXJ0eSA9IFstMV07XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LnAoJCQuY3R4LCBkaXJ0eSk7XG4gICAgICAgICQkLmFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xuICAgIH1cbn1cblxubGV0IHByb21pc2U7XG5mdW5jdGlvbiB3YWl0KCkge1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xufVxuZnVuY3Rpb24gZGlzcGF0Y2gobm9kZSwgZGlyZWN0aW9uLCBraW5kKSB7XG4gICAgbm9kZS5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudChgJHtkaXJlY3Rpb24gPyAnaW50cm8nIDogJ291dHJvJ30ke2tpbmR9YCkpO1xufVxuY29uc3Qgb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5sZXQgb3V0cm9zO1xuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuICAgIG91dHJvcyA9IHtcbiAgICAgICAgcjogMCxcbiAgICAgICAgYzogW10sXG4gICAgICAgIHA6IG91dHJvcyAvLyBwYXJlbnQgZ3JvdXBcbiAgICB9O1xufVxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuICAgIGlmICghb3V0cm9zLnIpIHtcbiAgICAgICAgcnVuX2FsbChvdXRyb3MuYyk7XG4gICAgfVxuICAgIG91dHJvcyA9IG91dHJvcy5wO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9pbihibG9jaywgbG9jYWwpIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2suaSkge1xuICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICBibG9jay5pKGxvY2FsKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX291dChibG9jaywgbG9jYWwsIGRldGFjaCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2subykge1xuICAgICAgICBpZiAob3V0cm9pbmcuaGFzKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgb3V0cm9pbmcuYWRkKGJsb2NrKTtcbiAgICAgICAgb3V0cm9zLmMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFjaClcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZCgxKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYmxvY2subyhsb2NhbCk7XG4gICAgfVxufVxuY29uc3QgbnVsbF90cmFuc2l0aW9uID0geyBkdXJhdGlvbjogMCB9O1xuZnVuY3Rpb24gY3JlYXRlX2luX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gZmFsc2U7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB1aWQgPSAwO1xuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MsIHVpZCsrKTtcbiAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBpZiAodGFzaylcbiAgICAgICAgICAgIHRhc2suYWJvcnQoKTtcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ3N0YXJ0JykpO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHRydWUsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFydCgpIHtcbiAgICAgICAgICAgIGlmIChzdGFydGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbihnbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbnZhbGlkYXRlKCkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX291dF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGNvbnN0IGdyb3VwID0gb3V0cm9zO1xuICAgIGdyb3VwLnIgKz0gMTtcbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMSwgMCwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ3N0YXJ0JykpO1xuICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEtLWdyb3VwLnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCByZXN1bHQgaW4gYGVuZCgpYCBiZWluZyBjYWxsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGNsZWFuIHVwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwoZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSAtIHQsIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICBnbygpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdvKCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGVuZChyZXNldCkge1xuICAgICAgICAgICAgaWYgKHJlc2V0ICYmIGNvbmZpZy50aWNrKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnRpY2soMSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMsIGludHJvKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHQgPSBpbnRybyA/IDAgOiAxO1xuICAgIGxldCBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBhbmltYXRpb25fbmFtZSA9IG51bGw7XG4gICAgZnVuY3Rpb24gY2xlYXJfYW5pbWF0aW9uKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluaXQocHJvZ3JhbSwgZHVyYXRpb24pIHtcbiAgICAgICAgY29uc3QgZCA9IHByb2dyYW0uYiAtIHQ7XG4gICAgICAgIGR1cmF0aW9uICo9IE1hdGguYWJzKGQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTogdCxcbiAgICAgICAgICAgIGI6IHByb2dyYW0uYixcbiAgICAgICAgICAgIGQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0YXJ0OiBwcm9ncmFtLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBwcm9ncmFtLnN0YXJ0ICsgZHVyYXRpb24sXG4gICAgICAgICAgICBncm91cDogcHJvZ3JhbS5ncm91cFxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbyhiKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSB7XG4gICAgICAgICAgICBzdGFydDogbm93KCkgKyBkZWxheSxcbiAgICAgICAgICAgIGJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgcHJvZ3JhbS5ncm91cCA9IG91dHJvcztcbiAgICAgICAgICAgIG91dHJvcy5yICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgYW4gaW50cm8sIGFuZCB0aGVyZSdzIGEgZGVsYXksIHdlIG5lZWQgdG8gZG9cbiAgICAgICAgICAgIC8vIGFuIGluaXRpYWwgdGljayBhbmQvb3IgYXBwbHkgQ1NTIGFuaW1hdGlvbiBpbW1lZGlhdGVseVxuICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYilcbiAgICAgICAgICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIGIsICdzdGFydCcpKTtcbiAgICAgICAgICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocGVuZGluZ19wcm9ncmFtICYmIG5vdyA+IHBlbmRpbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHBlbmRpbmdfcHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ3N0YXJ0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBydW5uaW5nX3Byb2dyYW0uYiwgcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uLCAwLCBlYXNpbmcsIGNvbmZpZy5jc3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQgPSBydW5uaW5nX3Byb2dyYW0uYiwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgZG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0uYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnRybyDigJQgd2UgY2FuIHRpZHkgdXAgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvdXRybyDigJQgbmVlZHMgdG8gYmUgY29vcmRpbmF0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEtLXJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuX2FsbChydW5uaW5nX3Byb2dyYW0uZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwID0gbm93IC0gcnVubmluZ19wcm9ncmFtLnN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdCA9IHJ1bm5pbmdfcHJvZ3JhbS5hICsgcnVubmluZ19wcm9ncmFtLmQgKiBlYXNpbmcocCAvIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gISEocnVubmluZ19wcm9ncmFtIHx8IHBlbmRpbmdfcHJvZ3JhbSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBydW4oYikge1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVuZCgpIHtcbiAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGhhbmRsZV9wcm9taXNlKHByb21pc2UsIGluZm8pIHtcbiAgICBjb25zdCB0b2tlbiA9IGluZm8udG9rZW4gPSB7fTtcbiAgICBmdW5jdGlvbiB1cGRhdGUodHlwZSwgaW5kZXgsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGluZm8udG9rZW4gIT09IHRva2VuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpbmZvLnJlc29sdmVkID0gdmFsdWU7XG4gICAgICAgIGxldCBjaGlsZF9jdHggPSBpbmZvLmN0eDtcbiAgICAgICAgaWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjaGlsZF9jdHggPSBjaGlsZF9jdHguc2xpY2UoKTtcbiAgICAgICAgICAgIGNoaWxkX2N0eFtrZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmxvY2sgPSB0eXBlICYmIChpbmZvLmN1cnJlbnQgPSB0eXBlKShjaGlsZF9jdHgpO1xuICAgICAgICBsZXQgbmVlZHNfZmx1c2ggPSBmYWxzZTtcbiAgICAgICAgaWYgKGluZm8uYmxvY2spIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmJsb2Nrcykge1xuICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzLmZvckVhY2goKGJsb2NrLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9PSBpbmRleCAmJiBibG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBfb3V0cm9zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tfb3V0cm9zKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGluZm8uYmxvY2suZCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICAgICAgYmxvY2subShpbmZvLm1vdW50KCksIGluZm8uYW5jaG9yKTtcbiAgICAgICAgICAgIG5lZWRzX2ZsdXNoID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLmJsb2NrID0gYmxvY2s7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrcylcbiAgICAgICAgICAgIGluZm8uYmxvY2tzW2luZGV4XSA9IGJsb2NrO1xuICAgICAgICBpZiAobmVlZHNfZmx1c2gpIHtcbiAgICAgICAgICAgIGZsdXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzX3Byb21pc2UocHJvbWlzZSkpIHtcbiAgICAgICAgY29uc3QgY3VycmVudF9jb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKHZhbHVlID0+IHtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjdXJyZW50X2NvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjdXJyZW50X2NvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby5jYXRjaCwgMiwgaW5mby5lcnJvciwgZXJyb3IpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8ucGVuZGluZykge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8ucGVuZGluZywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby50aGVuKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSBwcm9taXNlO1xuICAgIH1cbn1cblxuY29uc3QgZ2xvYmFscyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiBtZWFzdXJlKGJsb2Nrcykge1xuICAgIGNvbnN0IHJlY3RzID0ge307XG4gICAgbGV0IGkgPSBibG9ja3MubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIHJlY3RzW2Jsb2Nrc1tpXS5rZXldID0gYmxvY2tzW2ldLm5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIHJlY3RzO1xufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciA9IC9bXFxzJ1wiPi89XFx1e0ZERDB9LVxcdXtGREVGfVxcdXtGRkZFfVxcdXtGRkZGfVxcdXsxRkZGRX1cXHV7MUZGRkZ9XFx1ezJGRkZFfVxcdXsyRkZGRn1cXHV7M0ZGRkV9XFx1ezNGRkZGfVxcdXs0RkZGRX1cXHV7NEZGRkZ9XFx1ezVGRkZFfVxcdXs1RkZGRn1cXHV7NkZGRkV9XFx1ezZGRkZGfVxcdXs3RkZGRX1cXHV7N0ZGRkZ9XFx1ezhGRkZFfVxcdXs4RkZGRn1cXHV7OUZGRkV9XFx1ezlGRkZGfVxcdXtBRkZGRX1cXHV7QUZGRkZ9XFx1e0JGRkZFfVxcdXtCRkZGRn1cXHV7Q0ZGRkV9XFx1e0NGRkZGfVxcdXtERkZGRX1cXHV7REZGRkZ9XFx1e0VGRkZFfVxcdXtFRkZGRn1cXHV7RkZGRkV9XFx1e0ZGRkZGfVxcdXsxMEZGRkV9XFx1ezEwRkZGRn1dL3U7XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNhdHRyaWJ1dGVzLTJcbi8vIGh0dHBzOi8vaW5mcmEuc3BlYy53aGF0d2cub3JnLyNub25jaGFyYWN0ZXJcbmZ1bmN0aW9uIHNwcmVhZChhcmdzLCBjbGFzc2VzX3RvX2FkZCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCAuLi5hcmdzKTtcbiAgICBpZiAoY2xhc3Nlc190b19hZGQpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyA9IGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyArPSAnICcgKyBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RyID0gJyc7XG4gICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgaWYgKGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLnRlc3QobmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKVxuICAgICAgICAgICAgc3RyICs9IFwiIFwiICsgbmFtZTtcbiAgICAgICAgZWxzZSBpZiAoYm9vbGVhbl9hdHRyaWJ1dGVzLmhhcyhuYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpXG4gICAgICAgICAgICAgICAgc3RyICs9IFwiIFwiICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgKz0gXCIgXCIgKyBuYW1lICsgXCI9XCIgKyBKU09OLnN0cmluZ2lmeShTdHJpbmcodmFsdWUpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiL2csICcmIzM0OycpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgJyYjMzk7JykpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IGVzY2FwZWQgPSB7XG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmIzM5OycsXG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnXG59O1xuZnVuY3Rpb24gZXNjYXBlKGh0bWwpIHtcbiAgICByZXR1cm4gU3RyaW5nKGh0bWwpLnJlcGxhY2UoL1tcIicmPD5dL2csIG1hdGNoID0+IGVzY2FwZWRbbWF0Y2hdKTtcbn1cbmZ1bmN0aW9uIGVhY2goaXRlbXMsIGZuKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3RyICs9IGZuKGl0ZW1zW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IG1pc3NpbmdfY29tcG9uZW50ID0ge1xuICAgICQkcmVuZGVyOiAoKSA9PiAnJ1xufTtcbmZ1bmN0aW9uIHZhbGlkYXRlX2NvbXBvbmVudChjb21wb25lbnQsIG5hbWUpIHtcbiAgICBpZiAoIWNvbXBvbmVudCB8fCAhY29tcG9uZW50LiQkcmVuZGVyKSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnc3ZlbHRlOmNvbXBvbmVudCcpXG4gICAgICAgICAgICBuYW1lICs9ICcgdGhpcz17Li4ufSc7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgPCR7bmFtZX0+IGlzIG5vdCBhIHZhbGlkIFNTUiBjb21wb25lbnQuIFlvdSBtYXkgbmVlZCB0byByZXZpZXcgeW91ciBidWlsZCBjb25maWcgdG8gZW5zdXJlIHRoYXQgZGVwZW5kZW5jaWVzIGFyZSBjb21waWxlZCwgcmF0aGVyIHRoYW4gaW1wb3J0ZWQgYXMgcHJlLWNvbXBpbGVkIG1vZHVsZXNgKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGRlYnVnKGZpbGUsIGxpbmUsIGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgY29uc29sZS5sb2coYHtAZGVidWd9ICR7ZmlsZSA/IGZpbGUgKyAnICcgOiAnJ30oJHtsaW5lfToke2NvbHVtbn0pYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKHZhbHVlcyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIHJldHVybiAnJztcbn1cbmxldCBvbl9kZXN0cm95O1xuZnVuY3Rpb24gY3JlYXRlX3Nzcl9jb21wb25lbnQoZm4pIHtcbiAgICBmdW5jdGlvbiAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpIHtcbiAgICAgICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgICAgICBjb25zdCAkJCA9IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3ksXG4gICAgICAgICAgICBjb250ZXh0OiBuZXcgTWFwKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSksXG4gICAgICAgICAgICAvLyB0aGVzZSB3aWxsIGJlIGltbWVkaWF0ZWx5IGRpc2NhcmRlZFxuICAgICAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKVxuICAgICAgICB9O1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoeyAkJCB9KTtcbiAgICAgICAgY29uc3QgaHRtbCA9IGZuKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cyk7XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcjogKHByb3BzID0ge30sIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICAgICAgb25fZGVzdHJveSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBoZWFkOiAnJywgY3NzOiBuZXcgU2V0KCkgfTtcbiAgICAgICAgICAgIGNvbnN0IGh0bWwgPSAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCB7fSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBydW5fYWxsKG9uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBBcnJheS5mcm9tKHJlc3VsdC5jc3MpLm1hcChjc3MgPT4gY3NzLmNvZGUpLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IG51bGwgLy8gVE9ET1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGVhZDogcmVzdWx0LmhlYWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgICQkcmVuZGVyXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGFkZF9hdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGJvb2xlYW4pIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCAoYm9vbGVhbiAmJiAhdmFsdWUpKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgcmV0dXJuIGAgJHtuYW1lfSR7dmFsdWUgPT09IHRydWUgPyAnJyA6IGA9JHt0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkoZXNjYXBlKHZhbHVlKSkgOiBgXCIke3ZhbHVlfVwiYH1gfWA7XG59XG5mdW5jdGlvbiBhZGRfY2xhc3NlcyhjbGFzc2VzKSB7XG4gICAgcmV0dXJuIGNsYXNzZXMgPyBgIGNsYXNzPVwiJHtjbGFzc2VzfVwiYCA6IGBgO1xufVxuXG5mdW5jdGlvbiBiaW5kKGNvbXBvbmVudCwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBpbmRleCA9IGNvbXBvbmVudC4kJC5wcm9wc1tuYW1lXTtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnQuJCQuYm91bmRbaW5kZXhdID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudC4kJC5jdHhbaW5kZXhdKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjcmVhdGVfY29tcG9uZW50KGJsb2NrKSB7XG4gICAgYmxvY2sgJiYgYmxvY2suYygpO1xufVxuZnVuY3Rpb24gY2xhaW1fY29tcG9uZW50KGJsb2NrLCBwYXJlbnRfbm9kZXMpIHtcbiAgICBibG9jayAmJiBibG9jay5sKHBhcmVudF9ub2Rlcyk7XG59XG5mdW5jdGlvbiBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCB0YXJnZXQsIGFuY2hvcikge1xuICAgIGNvbnN0IHsgZnJhZ21lbnQsIG9uX21vdW50LCBvbl9kZXN0cm95LCBhZnRlcl91cGRhdGUgfSA9IGNvbXBvbmVudC4kJDtcbiAgICBmcmFnbWVudCAmJiBmcmFnbWVudC5tKHRhcmdldCwgYW5jaG9yKTtcbiAgICAvLyBvbk1vdW50IGhhcHBlbnMgYmVmb3JlIHRoZSBpbml0aWFsIGFmdGVyVXBkYXRlXG4gICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld19vbl9kZXN0cm95ID0gb25fbW91bnQubWFwKHJ1bikuZmlsdGVyKGlzX2Z1bmN0aW9uKTtcbiAgICAgICAgaWYgKG9uX2Rlc3Ryb3kpIHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kucHVzaCguLi5uZXdfb25fZGVzdHJveSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBFZGdlIGNhc2UgLSBjb21wb25lbnQgd2FzIGRlc3Ryb3llZCBpbW1lZGlhdGVseSxcbiAgICAgICAgICAgIC8vIG1vc3QgbGlrZWx5IGFzIGEgcmVzdWx0IG9mIGEgYmluZGluZyBpbml0aWFsaXNpbmdcbiAgICAgICAgICAgIHJ1bl9hbGwobmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICB9XG4gICAgICAgIGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuICAgIH0pO1xuICAgIGFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xufVxuZnVuY3Rpb24gZGVzdHJveV9jb21wb25lbnQoY29tcG9uZW50LCBkZXRhY2hpbmcpIHtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJDtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgcnVuX2FsbCgkJC5vbl9kZXN0cm95KTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuZChkZXRhY2hpbmcpO1xuICAgICAgICAvLyBUT0RPIG51bGwgb3V0IG90aGVyIHJlZnMsIGluY2x1ZGluZyBjb21wb25lbnQuJCQgKGJ1dCBuZWVkIHRvXG4gICAgICAgIC8vIHByZXNlcnZlIGZpbmFsIHN0YXRlPylcbiAgICAgICAgJCQub25fZGVzdHJveSA9ICQkLmZyYWdtZW50ID0gbnVsbDtcbiAgICAgICAgJCQuY3R4ID0gW107XG4gICAgfVxufVxuZnVuY3Rpb24gbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpIHtcbiAgICBpZiAoY29tcG9uZW50LiQkLmRpcnR5WzBdID09PSAtMSkge1xuICAgICAgICBkaXJ0eV9jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgICAgIGNvbXBvbmVudC4kJC5kaXJ0eS5maWxsKDApO1xuICAgIH1cbiAgICBjb21wb25lbnQuJCQuZGlydHlbKGkgLyAzMSkgfCAwXSB8PSAoMSA8PCAoaSAlIDMxKSk7XG59XG5mdW5jdGlvbiBpbml0KGNvbXBvbmVudCwgb3B0aW9ucywgaW5zdGFuY2UsIGNyZWF0ZV9mcmFnbWVudCwgbm90X2VxdWFsLCBwcm9wcywgZGlydHkgPSBbLTFdKSB7XG4gICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgIGNvbnN0IHByb3BfdmFsdWVzID0gb3B0aW9ucy5wcm9wcyB8fCB7fTtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJCA9IHtcbiAgICAgICAgZnJhZ21lbnQ6IG51bGwsXG4gICAgICAgIGN0eDogbnVsbCxcbiAgICAgICAgLy8gc3RhdGVcbiAgICAgICAgcHJvcHMsXG4gICAgICAgIHVwZGF0ZTogbm9vcCxcbiAgICAgICAgbm90X2VxdWFsLFxuICAgICAgICBib3VuZDogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIC8vIGxpZmVjeWNsZVxuICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgIG9uX2Rlc3Ryb3k6IFtdLFxuICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgY29udGV4dDogbmV3IE1hcChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pLFxuICAgICAgICAvLyBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgZGlydHlcbiAgICB9O1xuICAgIGxldCByZWFkeSA9IGZhbHNlO1xuICAgICQkLmN0eCA9IGluc3RhbmNlXG4gICAgICAgID8gaW5zdGFuY2UoY29tcG9uZW50LCBwcm9wX3ZhbHVlcywgKGksIHJldCwgdmFsdWUgPSByZXQpID0+IHtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmwoY2hpbGRyZW4ob3B0aW9ucy50YXJnZXQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50cm8pXG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGNvbXBvbmVudC4kJC5mcmFnbWVudCk7XG4gICAgICAgIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zLmFuY2hvcik7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgfVxuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbn1cbmxldCBTdmVsdGVFbGVtZW50O1xuaWYgKHR5cGVvZiBIVE1MRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIFN2ZWx0ZUVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy4kJC5zbG90dGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpc1thdHRyXSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgICAgICRkZXN0cm95KCkge1xuICAgICAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIFRPRE8gc2hvdWxkIHRoaXMgZGVsZWdhdGUgdG8gYWRkRXZlbnRMaXN0ZW5lcj9cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgJHNldCgpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRkZW4gYnkgaW5zdGFuY2UsIGlmIGl0IGhhcyBwcm9wc1xuICAgICAgICB9XG4gICAgfTtcbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICB9XG4gICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgICRzZXQoKSB7XG4gICAgICAgIC8vIG92ZXJyaWRkZW4gYnkgaW5zdGFuY2UsIGlmIGl0IGhhcyBwcm9wc1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hfZGV2KHR5cGUsIGRldGFpbCkge1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCkpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01JbnNlcnRcIiwgeyB0YXJnZXQsIG5vZGUgfSk7XG4gICAgYXBwZW5kKHRhcmdldCwgbm9kZSk7XG59XG5mdW5jdGlvbiBpbnNlcnRfZGV2KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NSW5zZXJ0XCIsIHsgdGFyZ2V0LCBub2RlLCBhbmNob3IgfSk7XG4gICAgaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9kZXYobm9kZSkge1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVJlbW92ZVwiLCB7IG5vZGUgfSk7XG4gICAgZGV0YWNoKG5vZGUpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2JldHdlZW5fZGV2KGJlZm9yZSwgYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9iZWZvcmVfZGV2KGFmdGVyKSB7XG4gICAgd2hpbGUgKGFmdGVyLnByZXZpb3VzU2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGFmdGVyLnByZXZpb3VzU2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2FmdGVyX2RldihiZWZvcmUpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsaXN0ZW5fZGV2KG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zLCBoYXNfcHJldmVudF9kZWZhdWx0LCBoYXNfc3RvcF9wcm9wYWdhdGlvbikge1xuICAgIGNvbnN0IG1vZGlmaWVycyA9IG9wdGlvbnMgPT09IHRydWUgPyBbXCJjYXB0dXJlXCJdIDogb3B0aW9ucyA/IEFycmF5LmZyb20oT2JqZWN0LmtleXMob3B0aW9ucykpIDogW107XG4gICAgaWYgKGhhc19wcmV2ZW50X2RlZmF1bHQpXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdwcmV2ZW50RGVmYXVsdCcpO1xuICAgIGlmIChoYXNfc3RvcF9wcm9wYWdhdGlvbilcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3N0b3BQcm9wYWdhdGlvbicpO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTUFkZEV2ZW50TGlzdGVuZXJcIiwgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgIGNvbnN0IGRpc3Bvc2UgPSBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVJlbW92ZUV2ZW50TGlzdGVuZXJcIiwgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgICAgICBkaXNwb3NlKCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHJfZGV2KG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01SZW1vdmVBdHRyaWJ1dGVcIiwgeyBub2RlLCBhdHRyaWJ1dGUgfSk7XG4gICAgZWxzZVxuICAgICAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01TZXRBdHRyaWJ1dGVcIiwgeyBub2RlLCBhdHRyaWJ1dGUsIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gcHJvcF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01TZXRQcm9wZXJ0eVwiLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIGRhdGFzZXRfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGUuZGF0YXNldFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01TZXREYXRhc2V0XCIsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gc2V0X2RhdGFfZGV2KHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0LmRhdGEgPT09IGRhdGEpXG4gICAgICAgIHJldHVybjtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01TZXREYXRhXCIsIHsgbm9kZTogdGV4dCwgZGF0YSB9KTtcbiAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuY2xhc3MgU3ZlbHRlQ29tcG9uZW50RGV2IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAoIW9wdGlvbnMudGFyZ2V0ICYmICFvcHRpb25zLiQkaW5saW5lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAndGFyZ2V0JyBpcyBhIHJlcXVpcmVkIG9wdGlvbmApO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuICAgICRkZXN0cm95KCkge1xuICAgICAgICBzdXBlci4kZGVzdHJveSgpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBDb21wb25lbnQgd2FzIGFscmVhZHkgZGVzdHJveWVkYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9O1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxvb3BfZ3VhcmQodGltZW91dCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ID4gdGltZW91dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbmZpbml0ZSBsb29wIGRldGVjdGVkYCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgeyBIdG1sVGFnLCBTdmVsdGVDb21wb25lbnQsIFN2ZWx0ZUNvbXBvbmVudERldiwgU3ZlbHRlRWxlbWVudCwgYWN0aW9uX2Rlc3Ryb3llciwgYWRkX2F0dHJpYnV0ZSwgYWRkX2NsYXNzZXMsIGFkZF9mbHVzaF9jYWxsYmFjaywgYWRkX2xvY2F0aW9uLCBhZGRfcmVuZGVyX2NhbGxiYWNrLCBhZGRfcmVzaXplX2xpc3RlbmVyLCBhZGRfdHJhbnNmb3JtLCBhZnRlclVwZGF0ZSwgYXBwZW5kLCBhcHBlbmRfZGV2LCBhc3NpZ24sIGF0dHIsIGF0dHJfZGV2LCBiZWZvcmVVcGRhdGUsIGJpbmQsIGJpbmRpbmdfY2FsbGJhY2tzLCBibGFua19vYmplY3QsIGJ1YmJsZSwgY2hlY2tfb3V0cm9zLCBjaGlsZHJlbiwgY2xhaW1fY29tcG9uZW50LCBjbGFpbV9lbGVtZW50LCBjbGFpbV9zcGFjZSwgY2xhaW1fdGV4dCwgY2xlYXJfbG9vcHMsIGNvbXBvbmVudF9zdWJzY3JpYmUsIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciwgY3JlYXRlX2FuaW1hdGlvbiwgY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbiwgY3JlYXRlX2NvbXBvbmVudCwgY3JlYXRlX2luX3RyYW5zaXRpb24sIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbiwgY3JlYXRlX3Nsb3QsIGNyZWF0ZV9zc3JfY29tcG9uZW50LCBjdXJyZW50X2NvbXBvbmVudCwgY3VzdG9tX2V2ZW50LCBkYXRhc2V0X2RldiwgZGVidWcsIGRlc3Ryb3lfYmxvY2ssIGRlc3Ryb3lfY29tcG9uZW50LCBkZXN0cm95X2VhY2gsIGRldGFjaCwgZGV0YWNoX2FmdGVyX2RldiwgZGV0YWNoX2JlZm9yZV9kZXYsIGRldGFjaF9iZXR3ZWVuX2RldiwgZGV0YWNoX2RldiwgZGlydHlfY29tcG9uZW50cywgZGlzcGF0Y2hfZGV2LCBlYWNoLCBlbGVtZW50LCBlbGVtZW50X2lzLCBlbXB0eSwgZXNjYXBlLCBlc2NhcGVkLCBleGNsdWRlX2ludGVybmFsX3Byb3BzLCBmaXhfYW5kX2Rlc3Ryb3lfYmxvY2ssIGZpeF9hbmRfb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIGZpeF9wb3NpdGlvbiwgZmx1c2gsIGdldENvbnRleHQsIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlLCBnZXRfY3VycmVudF9jb21wb25lbnQsIGdldF9zbG90X2NoYW5nZXMsIGdldF9zbG90X2NvbnRleHQsIGdldF9zcHJlYWRfb2JqZWN0LCBnZXRfc3ByZWFkX3VwZGF0ZSwgZ2V0X3N0b3JlX3ZhbHVlLCBnbG9iYWxzLCBncm91cF9vdXRyb3MsIGhhbmRsZV9wcm9taXNlLCBoYXNfcHJvcCwgaWRlbnRpdHksIGluaXQsIGluc2VydCwgaW5zZXJ0X2RldiwgaW50cm9zLCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciwgaXNfY2xpZW50LCBpc19mdW5jdGlvbiwgaXNfcHJvbWlzZSwgbGlzdGVuLCBsaXN0ZW5fZGV2LCBsb29wLCBsb29wX2d1YXJkLCBtZWFzdXJlLCBtaXNzaW5nX2NvbXBvbmVudCwgbW91bnRfY29tcG9uZW50LCBub29wLCBub3RfZXF1YWwsIG5vdywgbnVsbF90b19lbXB0eSwgb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcywgb25EZXN0cm95LCBvbk1vdW50LCBvbmNlLCBvdXRyb19hbmRfZGVzdHJveV9ibG9jaywgcHJldmVudF9kZWZhdWx0LCBwcm9wX2RldiwgcmFmLCBydW4sIHJ1bl9hbGwsIHNhZmVfbm90X2VxdWFsLCBzY2hlZHVsZV91cGRhdGUsIHNlbGVjdF9tdWx0aXBsZV92YWx1ZSwgc2VsZWN0X29wdGlvbiwgc2VsZWN0X29wdGlvbnMsIHNlbGVjdF92YWx1ZSwgc2VsZiwgc2V0Q29udGV4dCwgc2V0X2F0dHJpYnV0ZXMsIHNldF9jdXJyZW50X2NvbXBvbmVudCwgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEsIHNldF9kYXRhLCBzZXRfZGF0YV9kZXYsIHNldF9pbnB1dF90eXBlLCBzZXRfaW5wdXRfdmFsdWUsIHNldF9ub3csIHNldF9yYWYsIHNldF9zdG9yZV92YWx1ZSwgc2V0X3N0eWxlLCBzZXRfc3ZnX2F0dHJpYnV0ZXMsIHNwYWNlLCBzcHJlYWQsIHN0b3BfcHJvcGFnYXRpb24sIHN1YnNjcmliZSwgc3ZnX2VsZW1lbnQsIHRleHQsIHRpY2ssIHRpbWVfcmFuZ2VzX3RvX2FycmF5LCB0b19udW1iZXIsIHRvZ2dsZV9jbGFzcywgdHJhbnNpdGlvbl9pbiwgdHJhbnNpdGlvbl9vdXQsIHVwZGF0ZV9rZXllZF9lYWNoLCB2YWxpZGF0ZV9jb21wb25lbnQsIHZhbGlkYXRlX3N0b3JlLCB4bGlua19hdHRyIH07XG4iLCJjb25zdCBjb250ZXh0TWFwYm94ID0ge31cblxuZXhwb3J0IHsgY29udGV4dE1hcGJveCB9XG4iLCI8c3R5bGU+XG4gICAgc2VjdGlvbiB7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICB9XG48L3N0eWxlPlxuXG48c2NyaXB0PlxuICAgIGltcG9ydCB7IG9uTW91bnQsIG9uRGVzdHJveSwgc2V0Q29udGV4dCwgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNvbnRleHRNYXBib3ggfSBmcm9tICcuL2NvbnRleHQnXG5cbiAgICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgICBleHBvcnQgbGV0IGNlbnRlciA9IFszMS4xNjU2LCA0OC4zNzk0XVxuICAgIGV4cG9ydCBsZXQgem9vbSA9IDMuNzVcblxuICAgIGxldCBtYXBcbiAgICBsZXQgY29udGFpbmVyXG5cbiAgICBzZXRDb250ZXh0KGNvbnRleHRNYXBib3gsIHtcbiAgICAgICAgZ2V0TWFwOiAoKSA9PiBtYXAsXG4gICAgICAgIGdldE1hcGJveDogKCkgPT4gd2luZG93Lm1hcGJveGdsXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIG9uQ3JlYXRlTWFwKCkge1xuICAgICAgICBtYXAgPSBuZXcgbWFwYm94Z2wuTWFwKHtcbiAgICAgICAgICAgIHpvb20sXG4gICAgICAgICAgICBjZW50ZXIsXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBzdHlsZTogJ21hcGJveDovL3N0eWxlcy9tYXBib3gvc3RyZWV0cy12MTEnLFxuICAgICAgICB9KVxuXG4gICAgICAgIG1hcC5vbignZHJhZ2VuZCcsICgpID0+IGRpc3BhdGNoKCdyZWNlbnRyZScsIHsgbWFwLCBjZW50ZXI6IG1hcC5nZXRDZW50ZXIoKSB9KSlcbiAgICAgICAgbWFwLm9uKCdsb2FkJywgKCkgPT4gZGlzcGF0Y2goJ3JlYWR5JywgbWFwKSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVNYXAoKSB7XG4gICAgICAgIGNvbnN0IHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgICAgIHNjcmlwdFRhZy50eXBlID0gJ3RleHQvamF2YXNjcmlwdCdcbiAgICAgICAgc2NyaXB0VGFnLnNyYyA9ICdodHRwczovL2FwaS5tYXBib3guY29tL21hcGJveC1nbC1qcy92MS43LjAvbWFwYm94LWdsLmpzJ1xuXG4gICAgICAgIGNvbnN0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJylcbiAgICAgICAgbGluay5yZWwgPSAnc3R5bGVzaGVldCdcbiAgICAgICAgbGluay5ocmVmID0gJ2h0dHBzOi8vYXBpLm1hcGJveC5jb20vbWFwYm94LWdsLWpzL3YxLjcuMC9tYXBib3gtZ2wuY3NzJ1xuXG4gICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0b2tlbiA9ICdway5leUoxSWpvaVluVmliR2xySWl3aVlTSTZJbU5yTlhweGR6Z3hiVEF3Tm5jemJHeHdlRzB3Y1RWM2NqQWlmUS5ydDFwZUxqQ1FIWlVrck00QVd6NU13J1xuICAgICAgICAgICAgbWFwYm94Z2wuYWNjZXNzVG9rZW4gPSB0b2tlblxuXG4gICAgICAgICAgICBsaW5rLm9ubG9hZCA9IG9uQ3JlYXRlTWFwXG5cbiAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluaylcbiAgICAgICAgfVxuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKVxuICAgIH1cblxuICAgIG9uTW91bnQoKCkgPT4ge1xuICAgICAgICBpZiAoJ21hcGJveGdsJyBpbiB3aW5kb3cpIHtcbiAgICAgICAgICAgIG9uQ3JlYXRlTWFwKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNyZWF0ZU1hcCgpXG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgb25EZXN0cm95KCgpID0+IHtcbiAgICAgICAgbWFwICYmIG1hcC5yZW1vdmUoKVxuICAgIH0pXG48L3NjcmlwdD5cblxuPHNlY3Rpb24gYmluZDp0aGlzPXtjb250YWluZXJ9PlxuICAgIHsjaWYgbWFwfVxuICAgICAgICA8c2xvdD48L3Nsb3Q+XG4gICAgey9pZn1cbjwvc2VjdGlvbj5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgZ2V0Q29udGV4dCB9IGZyb20gJ3N2ZWx0ZSdcbiAgICBpbXBvcnQgeyBjb250ZXh0TWFwYm94IH0gZnJvbSAnLi9jb250ZXh0J1xuXG4gICAgY29uc3QgeyBnZXRNYXAsIGdldE1hcGJveCB9ID0gZ2V0Q29udGV4dChjb250ZXh0TWFwYm94KVxuXG4gICAgY29uc3QgbWFwID0gZ2V0TWFwKClcbiAgICBjb25zdCBtYXBib3ggPSBnZXRNYXBib3goKVxuXG4gICAgZXhwb3J0IGxldCBsbmdcbiAgICBleHBvcnQgbGV0IGxhdFxuICAgIGV4cG9ydCBsZXQgbGFiZWwgPSAnbGFiZWwnXG5cbiAgICBjb25zdCBwb3B1cCA9IG5ldyBtYXBib3guUG9wdXAoeyBvZmZzZXQ6IDI1IH0pLnNldFRleHQobGFiZWwpXG5cbiAgICBjb25zdCBtYXJrZXIgPSBuZXcgbWFwYm94Lk1hcmtlcigpXG4gICAgICAgICAgICAuc2V0TG5nTGF0KFtsbmcsIGxhdF0pXG4gICAgICAgICAgICAuc2V0UG9wdXAocG9wdXApXG4gICAgICAgICAgICAuYWRkVG8obWFwKVxuPC9zY3JpcHQ+XG5cbiIsIi8qIVxuICBDb3B5cmlnaHQgKGMpIDIwMTcgSmVkIFdhdHNvbi5cbiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcbiAgaHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbi8qIGdsb2JhbCBkZWZpbmUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuXHRmdW5jdGlvbiBjbGFzc05hbWVzICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IFtdO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKGFyZ1R5cGUgPT09ICdzdHJpbmcnIHx8IGFyZ1R5cGUgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGNsYXNzZXMucHVzaChhcmcpO1xuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykgJiYgYXJnLmxlbmd0aCkge1xuXHRcdFx0XHR2YXIgaW5uZXIgPSBjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZyk7XG5cdFx0XHRcdGlmIChpbm5lcikge1xuXHRcdFx0XHRcdGNsYXNzZXMucHVzaChpbm5lcik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoYXJnVHlwZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGFyZykge1xuXHRcdFx0XHRcdGlmIChoYXNPd24uY2FsbChhcmcsIGtleSkgJiYgYXJnW2tleV0pIHtcblx0XHRcdFx0XHRcdGNsYXNzZXMucHVzaChrZXkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBjbGFzc2VzLmpvaW4oJyAnKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdGNsYXNzTmFtZXMuZGVmYXVsdCA9IGNsYXNzTmFtZXM7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBjbGFzc05hbWVzO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyByZWdpc3RlciBhcyAnY2xhc3NuYW1lcycsIGNvbnNpc3RlbnQgd2l0aCBucG0gcGFja2FnZSBuYW1lXG5cdFx0ZGVmaW5lKCdjbGFzc25hbWVzJywgW10sIGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBjbGFzc05hbWVzO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5jbGFzc05hbWVzID0gY2xhc3NOYW1lcztcblx0fVxufSgpKTtcbiIsImV4cG9ydCB7IGRlZmF1bHQgYXMgY2xhc3NuYW1lcyB9IGZyb20gJ2NsYXNzbmFtZXMnXG5cbmV4cG9ydCBjb25zdCB0b0NTU1N0cmluZyA9IChzdHlsZXMgPSB7fSkgPT4gT2JqZWN0LmVudHJpZXMoc3R5bGVzKVxuICAuZmlsdGVyKChbX3Byb3BOYW1lLCBwcm9wVmFsdWVdKSA9PiBwcm9wVmFsdWUgIT09IHVuZGVmaW5lZCAmJiBwcm9wVmFsdWUgIT09IG51bGwpXG4gIC5yZWR1Y2UoKHN0eWxlU3RyaW5nLCBbcHJvcE5hbWUsIHByb3BWYWx1ZV0pID0+IHtcbiAgICBwcm9wTmFtZSA9IHByb3BOYW1lLnJlcGxhY2UoL1tBLVpdL2csIG1hdGNoID0+IGAtJHttYXRjaC50b0xvd2VyQ2FzZSgpfWApXG4gICAgcmV0dXJuIGAke3N0eWxlU3RyaW5nfSR7cHJvcE5hbWV9OiR7cHJvcFZhbHVlfTtgXG4gIH0sICcnKVxuXG4vKipcbiAqXG4gKiBAZnVuY3Rpb24gc2FmZUdldFxuICpcbiAqIEBkZXNjcmlwdGlvbiBTYWZlIGdldHRpbmcgb2YgYW4gYW55IHZhbHVlIG9mIGEgbmVzdGVkIG9iamVjdHMuXG4gKlxuICogQHBhcmFtIGV4cHJlc3Npb25GbiB7ZnVuY3Rpb259IC0gVGhlIGZ1bmN0aW9uIHdpdGggYW4gZXhwcmVzc2lvbiB3aGljaCByZXR1cm5zIHJlc3VsdCBvZiB0aGUgc2FmZSBnZXR0aW5nLlxuICogQHBhcmFtIGRlZmF1bHRWYWx1ZSB7YW55fSAtIFRoZSBkZWZhdWx0IHZhbHVlIHdoZW4gcmVzdWx0IGlzIHVuZGVmaW5lZC5cbiAqIEBwYXJhbSBpc0RlZmF1bHRUeXBlZCB7Ym9vbGVhbn0gLSBXaGV0ZXIgaXMgdGhlIHJlc3VsdCBmcm9tIGFuIGV4cHJlc3Npb24gbXVzdCBiZSB0aGUgc2FtZSB0eXBlIGFzIHRoZSBkZWZhdWx0IHZhbHVlLlxuICpcbiAqIEBleGFtcGxlc1xuICogLy8gU29tZSBkYXRhLlxuICogY29uc3QgdmVyeSA9IHtcbiAqICBuZXN0ZWQ6IHtcbiAqICAgb2JqZWN0OiBbe1xuICogICAgIHdpdGg6IHtcbiAqICAgICAgIGFycmF5czogJ3N0dWZmJ1xuICogICAgIH1cbiAqICAgfV1cbiAqICB9XG4gKiB9XG4gKlxuICogLy8gR2V0dGluZy5cbiAqIDEuIHNhZmVHZXQoKCkgPT4gdmVyeS5uZXN0ZWQub2JqZWN0WzBdLndpdGguYXJyYXlzKTtcbiAqIDIuIHNhZmVHZXQoKCkgPT4gdmVyeS5uZXN0ZWQub2JqZWN0WzBdLndpdGguYXJyYXlzLCB7IGRlZmF1bHQ6ICd2YWx1ZScgfSk7XG4gKiAzLiBzYWZlR2V0KCgpID0+IHZlcnkubmVzdGVkLm9iamVjdFswXS53aXRoLmFycmF5cywgeyBkZWZhdWx0OiAndmFsdWUnIH0sIHRydWUpO1xuICpcbiAqIC8vIFJldHVybi5cbiAqIDEuICdzdHVmZidcbiAqIDIuICdzdHVmZidcbiAqIDMuIHsgZGVmYXVsdDogJ3ZhbHVlJyB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYWZlR2V0KGV4cHJlc3Npb25GbiwgZGVmYXVsdFZhbHVlLCBpc0RlZmF1bHRUeXBlZCA9IGZhbHNlKSB7XG4gIC8vIENoZWNrIHdoZXRoZXIgYSBhbmQgYiBoYXZlIHRoZSBzYW1lIHR5cGUuICh1dGlsKVxuICBmdW5jdGlvbiBpc1NhbWVUeXBlKGEsIGIpIHtcbiAgICBjb25zdCBydWxlcyA9IFtcbiAgICAgIChhLCBiKSA9PiB0eXBlb2YgYSA9PT0gdHlwZW9mIGIsXG4gICAgICAoYSwgYikgPT4gKCthID09PSBhKSA9PT0gKCtiID09PSBiKSwgICAgICAgICAgICAgIC8vIHdoZXRoZXIgb25lIGlzIE5hTlxuICAgICAgKGEsIGIpID0+IChhID09PSBudWxsKSA9PT0gKGIgPT09IG51bGwpLCAgICAgICAgICAvLyBudWxsIGlzIG9iamVjdCB0eXBlIHRvb1xuICAgICAgKGEsIGIpID0+IEFycmF5LmlzQXJyYXkoYSkgPT09IEFycmF5LmlzQXJyYXkoYiksICAvLyBhcnJheSBpcyBvYmplY3QgdHlwZSB0b29cbiAgICBdXG4gICAgcmV0dXJuICFydWxlcy5zb21lKHJ1bGVGbiA9PiAhcnVsZUZuKGEsIGIpKVxuICB9XG4gIC8vIENvcmUgb2Ygc2FmZSBnZXR0aW5nLiBFeGVjdXRpbmcgYSBmdW5jdGlvbi4gRGVmYXVsdCB2YWx1ZXMuXG4gIGZ1bmN0aW9uIGdldChleHByZXNzaW9uRm4sIGRlZmF1bHRWYWx1ZSwgaXNEZWZhdWx0VHlwZWQpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZXhwcmVzc2lvbkZuLmNhbGwodGhpcylcbiAgICAgIGlmIChpc0RlZmF1bHRUeXBlZCkge1xuICAgICAgICByZXR1cm4gaXNTYW1lVHlwZShyZXN1bHQsIGRlZmF1bHRWYWx1ZSkgPyByZXN1bHQgOiBkZWZhdWx0VmFsdWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXN1bHQgPT09IHVuZGVmaW5lZCA/IGRlZmF1bHRWYWx1ZSA6IHJlc3VsdFxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBkZWZhdWx0VmFsdWVcbiAgICB9XG4gIH1cbiAgLy8gU2FmZSBnZXR0aW5nIG9mIHRoZSBleHByZXNzaW9uRm4uXG4gIGlmICh0eXBlb2YgZXhwcmVzc2lvbkZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGdldChleHByZXNzaW9uRm4sIGRlZmF1bHRWYWx1ZSwgaXNEZWZhdWx0VHlwZWQpXG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS53YXJuKCdZb3UgbmVlZCB0byB1c2UgYSBmdW5jdGlvbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQuJylcbiAgfVxuICByZXR1cm4gZGVmYXVsdFZhbHVlXG59XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMsIHRvQ1NTU3RyaW5nIH0gZnJvbSAnLi4vdXRpbHMnXG5cbiAgICBleHBvcnQgbGV0IHR5cGVcbiAgICBleHBvcnQgbGV0IGlzIC8vIHByaW1hcnl8d2FybmluZ3xkYW5nZXJ8bGlnaHR8ZGFya1xuICAgIGV4cG9ydCBsZXQgc2l6ZSA9ICdtZWRpdW0nIC8vIHNtYWxsfG1lZGl1bXxiaWdcbiAgICBleHBvcnQgbGV0IHJvdGF0ZSA9IDBcbiAgICBleHBvcnQgbGV0IHN0eWxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBpZCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGFyaWFMYWJlbCA9IHVuZGVmaW5lZFxuXG4gICAgbGV0IHRpdGxlUHJvcCA9IHRpdGxlIHx8IGFyaWFMYWJlbFxuICAgIGxldCBhcmlhTGFiZWxQcm9wID0gYXJpYUxhYmVsIHx8IHRpdGxlXG4gICAgbGV0IHN0eWxlUHJvcCA9IHRvQ1NTU3RyaW5nKHsgdHJhbnNmb3JtOiAhIXJvdGF0ZSA/IGByb3RhdGVaKCR7cm90YXRlfWRlZylgIDogbnVsbCwgLi4uc3R5bGUgfSlcblxuICAgICQ6ICBjbGFzc1Byb3AgPSBjbGFzc25hbWVzKCdpY28nLCBpcywgc2l6ZSwgJCRwcm9wcy5jbGFzcylcbjwvc2NyaXB0PlxuXG48c3ZnXG4gICAgICAgIHtpZH1cbiAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgc3R5bGU9e3N0eWxlUHJvcH1cbiAgICAgICAgYXJpYS1sYWJlbD17YXJpYUxhYmVsUHJvcH1cbj5cbiAgICA8dXNlIHhsaW5rOmhyZWY9e2AjaWNvLSR7dHlwZX1gfSBjbGFzcz1cImljby11c2VcIi8+XG48L3N2Zz5cblxuPHN0eWxlPlxuICAgIHN2ZyB7XG4gICAgICAgIGRpc3BsYXk6IGluaGVyaXQ7XG4gICAgfVxuXG4gICAgc3ZnLCBzdmcgKiB7XG4gICAgICAgIGZpbGw6IHJnYmEodmFyKC0tdGhlbWUtc3ZnLWZpbGwpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2JhKHZhcigtLXRoZW1lLXN2Zy1maWxsKSk7XG4gICAgfVxuXG4gICAgLyogLS0tLS0tLS0tLS0tPT09PT09PT09KCBTaXplICk9PT09PT09PT0tLS0tLS0tLS0tLS0gKi9cbiAgICAuc21hbGwge1xuICAgICAgICB3aWR0aDogMTVweDtcbiAgICAgICAgaGVpZ2h0OiAxNXB4O1xuICAgIH1cblxuICAgIC5tZWRpdW0ge1xuICAgICAgICB3aWR0aDogMjJweDtcbiAgICAgICAgaGVpZ2h0OiAyMnB4O1xuICAgIH1cblxuICAgIC5iaWcge1xuICAgICAgICB3aWR0aDogMzVweDtcbiAgICAgICAgaGVpZ2h0OiAzNXB4O1xuICAgIH1cblxuICAgIC8qIC0tLS0tLS0tLS0tLT09PT09PT09PSggQ29sb3IgKT09PT09PT09PS0tLS0tLS0tLS0tLSAqL1xuICAgIC5wcmltYXJ5LCAucHJpbWFyeSAqIHtcbiAgICAgICAgZmlsbDogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgIH1cblxuICAgIC53YXJuaW5nLCAud2FybmluZyAqIHtcbiAgICAgICAgZmlsbDogcmdiKHZhcigtLWNvbG9yLXdhcm5pbmcpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgIH1cblxuICAgIC5kYW5nZXIsIC5kYW5nZXIgKiB7XG4gICAgICAgIGZpbGw6IHJnYih2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICAgICAgc3Ryb2tlOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuXG4gICAgLmluZm8sIC5pbmZvICoge1xuICAgICAgICBmaWxsOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgICAgICBzdHJva2U6IHJnYih2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuXG4gICAgLmxpZ2h0LCAubGlnaHQgKiB7XG4gICAgICAgIGZpbGw6IHZhcigtLWNvbG9yLWxpZ2h0LTEpO1xuICAgICAgICBzdHJva2U6IHZhcigtLWNvbG9yLWxpZ2h0LTEpO1xuICAgIH1cblxuICAgIC5kYXJrLCAuZGFyayAqIHtcbiAgICAgICAgZmlsbDogdmFyKC0tY29sb3ItZGFyay0xKTtcbiAgICAgICAgc3Ryb2tlOiB2YXIoLS1jb2xvci1kYXJrLTEpO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCBJY29uIGZyb20gJy4uL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUnXG5cbiAgICBleHBvcnQgbGV0IGlzID0gJ2RhbmdlcidcbiAgICBleHBvcnQgbGV0IHNpemUgPSAnbWVkaXVtJyAvLyBzbWFsbHxtZWRpdW18bWlnXG48L3NjcmlwdD5cblxuPHVsIGNsYXNzPVwicmF0ZVwiPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEljb24ge2lzfSB7c2l6ZX0gdHlwZT1cImhlYXJ0LWZpbGxlZFwiLz5cbiAgICA8L2xpPlxuPC91bD5cblxuPHN0eWxlPlxuICAgIC5yYXRlIHtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgIG1hcmdpbjogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAtMSAvIDMpO1xuICAgIH1cblxuICAgIGxpIHtcbiAgICAgICAgcGFkZGluZzogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgLyAzKTtcbiAgICB9XG5cbiAgICAucmF0ZSBsaSB7XG4gICAgICAgIC13ZWJraXQtZmlsdGVyOiBkcm9wLXNoYWRvdygtMXB4IDJweCAxcHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4yNSkpO1xuICAgICAgICBmaWx0ZXI6IGRyb3Atc2hhZG93KC0xcHggMnB4IDFweCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgLjI1KSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMsIHRvQ1NTU3RyaW5nIH0gZnJvbSAnLi4vdXRpbHMnXG5cbiAgICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgICBleHBvcnQgbGV0IG5hbWVcbiAgICBleHBvcnQgbGV0IHZhbHVlID0gJydcbiAgICBleHBvcnQgbGV0IHN0eWxlID0ge31cbiAgICBleHBvcnQgbGV0IHR5cGUgPSAndGV4dCdcbiAgICBleHBvcnQgbGV0IGlkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBhbGlnbiA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgbWF4bGVuZ3RoID0gMTAwMFxuICAgIGV4cG9ydCBsZXQgcm93cyA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgZGlzYWJsZWQgPSBmYWxzZVxuICAgIGV4cG9ydCBsZXQgdGl0bGUgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGludmFsaWQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IG1pbiA9IHVuZGVmaW5lZCAvLyBTcGVjaWZpZXMgYSBtaW5pbXVtIHZhbHVlIGZvciBhbiA8aW5wdXQ+IGVsZW1lbnRcbiAgICBleHBvcnQgbGV0IG1heCA9IHVuZGVmaW5lZCAvLyBTcGVjaWZpZXMgdGhlIG1heGltdW0gdmFsdWUgZm9yIGFuIDxpbnB1dD4gZWxlbWVudFxuICAgIGV4cG9ydCBsZXQgbGlzdCA9IHVuZGVmaW5lZCAvLyBSZWZlcnMgdG8gYSA8ZGF0YWxpc3Q+IGVsZW1lbnQgdGhhdCBjb250YWlucyBwcmUtZGVmaW5lZCBvcHRpb25zIGZvciBhbiA8aW5wdXQ+IGVsZW1lbnRcbiAgICBleHBvcnQgbGV0IGZvcm0gPSB1bmRlZmluZWQgLy8gU3BlY2lmaWVzIHRoZSBmb3JtIHRoZSA8aW5wdXQ+IGVsZW1lbnQgYmVsb25ncyB0b1xuICAgIGV4cG9ydCBsZXQgcmVhZG9ubHkgPSB1bmRlZmluZWQgLy8gdW5kZWZpbmVkfHJlYWRvbmx5XG4gICAgZXhwb3J0IGxldCByZXF1aXJlZCA9IHVuZGVmaW5lZCAvLyB1bmRlZmluZWR8cmVxdWlyZWRcbiAgICBleHBvcnQgbGV0IHBhdHRlcm4gPSB1bmRlZmluZWQgLy8gU3BlY2lmaWVzIGEgcmVndWxhciBleHByZXNzaW9uIHRoYXQgYW4gPGlucHV0PiBlbGVtZW50J3MgdmFsdWUgaXMgY2hlY2tlZCBhZ2FpbnN0IChyZWdleHApXG4gICAgZXhwb3J0IGxldCBhdXRvY29tcGxldGUgPSB0cnVlIC8vIG9ufG9mZlxuICAgIGV4cG9ydCBsZXQgYXV0b3NlbGVjdCA9IGZhbHNlXG4gICAgZXhwb3J0IGxldCBhcmlhTGFiZWwgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHBsYWNlaG9sZGVyID0gdW5kZWZpbmVkXG5cbiAgICBsZXQgaWRQcm9wID0gaWQgfHwgbmFtZVxuICAgIGxldCB0eXBlUHJvcCA9IHR5cGUgPT09ICdudW1iZXInID8gJ3RleHQnIDogdHlwZVxuICAgIGxldCB0aXRsZVByb3AgPSB0aXRsZSB8fCBhcmlhTGFiZWwgfHwgcGxhY2Vob2xkZXJcbiAgICBsZXQgYXJpYUxhYmVsUHJvcCA9IGFyaWFMYWJlbCB8fCB0aXRsZSB8fCBwbGFjZWhvbGRlclxuICAgIGxldCBhdXRvY29tcGxldGVQcm9wID0gYXV0b2NvbXBsZXRlID8gJ29uJyA6ICdvZmYnXG4gICAgbGV0IHN0eWxlUHJvcCA9IHRvQ1NTU3RyaW5nKHsgLi4uc3R5bGUsIHRleHRBbGlnbjogYWxpZ24gfSlcbiAgICBsZXQgcGF0dGVyblByb3AgPSB0eXBlID09PSAnbnVtYmVyJyAmJiAhcGF0dGVybiA/ICdbMC05XSonIDogcGF0dGVyblxuXG4gICAgJDogY2xhc3NQcm9wID0gY2xhc3NuYW1lcygnaW5wJywgJCRwcm9wcy5jbGFzcywgeyBkaXNhYmxlZCwgcmVhZG9ubHksIHJlcXVpcmVkLCBpbnZhbGlkIH0pXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvbiBFbWl0IGNsaWNrIGFuZCBzZWxlY3QgY29udGVudCB3aGVuIFwiYXV0b3NlbGVjdFwiIGlzIGVuYWJsZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBOYXRpdmUgbW91c2UgZXZlbnQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gb25DbGljayhlKSB7XG4gICAgICAgICFkaXNhYmxlZCAmJiBkaXNwYXRjaChcImNsaWNrXCIsIGUpXG4gICAgICAgICFkaXNhYmxlZCAmJiBhdXRvc2VsZWN0ICYmIGUudGFyZ2V0LnNlbGVjdCgpXG4gICAgfVxuPC9zY3JpcHQ+XG5cbnsjaWYgcm93c31cbiAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgIHttaW59XG4gICAgICAgICAgICB7bWF4fVxuICAgICAgICAgICAge3Jvd3N9XG4gICAgICAgICAgICB7bmFtZX1cbiAgICAgICAgICAgIHtmb3JtfVxuICAgICAgICAgICAge2FsaWdufVxuICAgICAgICAgICAge3JlYWRvbmx5fVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAge3JlcXVpcmVkfVxuICAgICAgICAgICAge21heGxlbmd0aH1cbiAgICAgICAgICAgIHtwbGFjZWhvbGRlcn1cbiAgICAgICAgICAgIGlkPXtpZFByb3B9XG4gICAgICAgICAgICBjbGFzcz17Y2xhc3NQcm9wfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIHN0eWxlPXtzdHlsZVByb3B9XG4gICAgICAgICAgICBwYXR0ZXJuPXtwYXR0ZXJuUHJvcH1cbiAgICAgICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4gICAgICAgICAgICBhdXRvY29tcGxldGU9e2F1dG9jb21wbGV0ZVByb3B9XG4gICAgICAgICAgICB7Li4ueyB0eXBlOiB0eXBlUHJvcCB9fVxuICAgICAgICAgICAgYmluZDp2YWx1ZVxuICAgICAgICAgICAgb246Ymx1cj0ne2UgPT4gIWRpc2FibGVkICYmIGRpc3BhdGNoKFwiYmx1clwiLCBlKX0nXG4gICAgICAgICAgICBvbjpmb2N1cz0ne2UgPT4gIWRpc2FibGVkICYmIGRpc3BhdGNoKFwiZm9jdXNcIiwgZSl9J1xuICAgICAgICAgICAgb246Y2xpY2s9J3tvbkNsaWNrfSdcbiAgICA+PC90ZXh0YXJlYT5cbns6ZWxzZX1cbiAgICA8aW5wdXRcbiAgICAgICAgICAgIHttaW59XG4gICAgICAgICAgICB7bWF4fVxuICAgICAgICAgICAge25hbWV9XG4gICAgICAgICAgICB7bGlzdH1cbiAgICAgICAgICAgIHtmb3JtfVxuICAgICAgICAgICAge2FsaWdufVxuICAgICAgICAgICAge3JlYWRvbmx5fVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAge3JlcXVpcmVkfVxuICAgICAgICAgICAge21heGxlbmd0aH1cbiAgICAgICAgICAgIHtwbGFjZWhvbGRlcn1cbiAgICAgICAgICAgIGlkPXtpZFByb3B9XG4gICAgICAgICAgICBjbGFzcz17Y2xhc3NQcm9wfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIHN0eWxlPXtzdHlsZVByb3B9XG4gICAgICAgICAgICBwYXR0ZXJuPXtwYXR0ZXJuUHJvcH1cbiAgICAgICAgICAgIGFyaWEtbGFiZWw9e2FyaWFMYWJlbFByb3B9XG4gICAgICAgICAgICBhdXRvY29tcGxldGU9e2F1dG9jb21wbGV0ZVByb3B9XG4gICAgICAgICAgICB7Li4ueyB0eXBlOiB0eXBlUHJvcCB9fVxuICAgICAgICAgICAgYmluZDp2YWx1ZVxuICAgICAgICAgICAgb246Ymx1cj0ne2UgPT4gIWRpc2FibGVkICYmIGRpc3BhdGNoKFwiYmx1clwiLCBlKX0nXG4gICAgICAgICAgICBvbjpmb2N1cz0ne2UgPT4gIWRpc2FibGVkICYmIGRpc3BhdGNoKFwiZm9jdXNcIiwgZSl9J1xuICAgICAgICAgICAgb246Y2xpY2s9J3tvbkNsaWNrfSdcbiAgICAvPlxuey9pZn1cblxuPHN0eWxlPlxuICAgIC5pbnAge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleDogMSAxIDA7XG4gICAgICAgIGNvbG9yOiBpbmhlcml0O1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgICAgICAgbWluLXdpZHRoOiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4yNSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICAgICAgYm94LXNoYWRvdzogaW5zZXQgdmFyKC0tc2hhZG93LXByaW1hcnkpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5LWluc2V0KTtcbiAgICB9XG5cbiAgICAuaW5wOmZvY3VzIHtcbiAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2IodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgIH1cblxuICAgIC5pbnA6aW52YWxpZCwgLmlucC5pbnZhbGlkIHtcbiAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcblxuICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAgIGV4cG9ydCBsZXQgc3JjXG4gICAgZXhwb3J0IGxldCBhbHRcbiAgICBleHBvcnQgbGV0IGlkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCB3aWR0aCA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaGVpZ2h0ID0gdW5kZWZpbmVkXG5cbiAgICBsZXQgbG9hZGluZyA9IHRydWVcbiAgICBsZXQgaXNFcnJvciA9IGZhbHNlXG5cbiAgICAkOiB3cmFwQ2xhc3NQcm9wID0gY2xhc3NuYW1lcygncGljdHVyZScsICQkcHJvcHMuY2xhc3MsIHsgbG9hZGluZywgaXNFcnJvciB9KVxuXG4gICAgZnVuY3Rpb24gb25Mb2FkKGUpIHtcbiAgICAgICAgbG9hZGluZyA9IGZhbHNlXG4gICAgICAgIGRpc3BhdGNoKCdsb2FkJywgZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbkVycm9yKGUpIHtcbiAgICAgICAgbG9hZGluZyA9IGZhbHNlXG4gICAgICAgIGlzRXJyb3IgPSB0cnVlXG4gICAgICAgIGRpc3BhdGNoKCdlcnJvcicsIGUpXG4gICAgfVxuPC9zY3JpcHQ+XG5cbjxmaWd1cmUgY2xhc3M9e3dyYXBDbGFzc1Byb3B9PlxuICAgIDxpbWdcbiAgICAgICAgICAgIHtpZH1cbiAgICAgICAgICAgIHthbHR9XG4gICAgICAgICAgICB7c3JjfVxuICAgICAgICAgICAge3dpZHRofVxuICAgICAgICAgICAge2hlaWdodH1cbiAgICAgICAgICAgIGNsYXNzPVwicGljXCJcbiAgICAgICAgICAgIG9uOmxvYWQ9e29uTG9hZH1cbiAgICAgICAgICAgIG9uOmVycm9yPXtvbkVycm9yfVxuICAgIC8+XG5cbiAgICA8ZmlnY2FwdGlvbj5cbiAgICAgICAgPHNsb3Q+PC9zbG90PlxuICAgIDwvZmlnY2FwdGlvbj5cbjwvZmlndXJlPlxuXG48c3R5bGU+XG4gICAgLnBpY3R1cmUge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgIH1cblxuICAgIC5waWN0dXJlIC5waWMge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIG9iamVjdC1maXQ6IGNvdmVyO1xuICAgICAgICBvYmplY3QtcG9zaXRpb246IGNlbnRlcjtcbiAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAuM3MgZWFzZS1pbjtcbiAgICB9XG5cbiAgICAucGljdHVyZS5sb2FkaW5nIC5waWMge1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcbiAgICBpbXBvcnQgUGljdHVyZSBmcm9tICcuL1BpY3R1cmUuc3ZlbHRlJ1xuXG4gICAgZXhwb3J0IGxldCBzcmNcbiAgICBleHBvcnQgbGV0IGFsdFxuICAgIGV4cG9ydCBsZXQgc2l6ZSA9ICdtZWRpdW0nIC8vIHNtYWxsfG1lZGl1bXxiaWdcblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2F2YScsIHNpemUsICQkcHJvcHMuY2xhc3MpXG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz17Y2xhc3NQcm9wfT5cbiAgICA8UGljdHVyZSB7c3JjfSBhbHQ9e2BQaWN0dXJlOiAke2FsdH1gfS8+XG48L2Rpdj5cblxuPHN0eWxlPlxuICAgIC5hdmEge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAuc21hbGwge1xuICAgICAgICB3aWR0aDogMjVweDtcbiAgICAgICAgaGVpZ2h0OiAyNXB4O1xuICAgIH1cbiAgICAubWVkaXVtIHtcbiAgICAgICAgd2lkdGg6IDM1cHg7XG4gICAgICAgIGhlaWdodDogMzVweDtcbiAgICB9XG4gICAgLmJpZyB7XG4gICAgICAgIHdpZHRoOiA0NXB4O1xuICAgICAgICBoZWlnaHQ6IDQ1cHg7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcblxuICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAgIGV4cG9ydCBsZXQgaXMgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGlkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBocmVmID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBhdXRvID0gZmFsc2VcbiAgICBleHBvcnQgbGV0IHR5cGUgPSAnYnV0dG9uJ1xuICAgIGV4cG9ydCBsZXQgc2l6ZSA9ICdtZWRpdW0nXG4gICAgZXhwb3J0IGxldCB0aXRsZSA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgaHRtbEZvciA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgZGlzYWJsZWQgPSBmYWxzZVxuICAgIGV4cG9ydCBsZXQgYXJpYUxhYmVsID0gdW5kZWZpbmVkXG5cbiAgICBsZXQgdGl0bGVQcm9wID0gdGl0bGUgfHwgYXJpYUxhYmVsXG4gICAgbGV0IGFyaWFMYWJlbFByb3AgPSBhcmlhTGFiZWwgfHwgdGl0bGVcblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2J0bicsIGlzLCBzaXplLCAkJHByb3BzLmNsYXNzLCB7IGF1dG8sIGRpc2FibGVkIH0pXG5cbiAgICBmdW5jdGlvbiBvbkxhYmVsQ2xpY2soZSkge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sRm9yKS5jbGljaygpXG4gICAgICAgICFkaXNhYmxlZCAmJiBkaXNwYXRjaCgnY2xpY2snLCBlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uQ2xpY2soZSkge1xuICAgICAgICAhZGlzYWJsZWQgJiYgZGlzcGF0Y2goJ2NsaWNrJywgZSlcbiAgICB9XG48L3NjcmlwdD5cblxueyNpZiBocmVmfVxuICAgIDxhXG4gICAgICAgICAgICB7aWR9XG4gICAgICAgICAgICB7aHJlZn1cbiAgICAgICAgICAgIHRpdGxlPXt0aXRsZVByb3B9XG4gICAgICAgICAgICBjbGFzcz17Y2xhc3NQcm9wfVxuICAgICAgICAgICAgYXJpYS1sYWJlbD17YXJpYUxhYmVsUHJvcH1cbiAgICAgICAgICAgIG9uOmNsaWNrPXtvbkNsaWNrfVxuICAgID5cbiAgICAgICAgPHNsb3Q+PC9zbG90PlxuICAgIDwvYT5cbns6ZWxzZSBpZiBodG1sRm9yfVxuICAgIDxsYWJlbFxuICAgICAgICAgICAge2lkfVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAgZm9yPXtodG1sRm9yfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgb246Y2xpY2s9e29uTGFiZWxDbGlja31cbiAgICA+XG4gICAgICAgIDxzbG90Pjwvc2xvdD5cbiAgICA8L2xhYmVsPlxuezplbHNlfVxuICAgIDxidXR0b25cbiAgICAgICAgICAgIHtpZH1cbiAgICAgICAgICAgIHt0eXBlfVxuICAgICAgICAgICAge2Rpc2FibGVkfVxuICAgICAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgICAgIGNsYXNzPXtjbGFzc1Byb3B9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXthcmlhTGFiZWxQcm9wfVxuICAgICAgICAgICAgb246Y2xpY2s9e29uQ2xpY2t9XG4gICAgPlxuICAgICAgICA8c2xvdD48L3Nsb3Q+XG4gICAgPC9idXR0b24+XG57L2lmfVxuXG48c3R5bGU+XG4gICAgLmJ0bjpub3QoLmF1dG8pIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgICAgcGFkZGluZzogNXB4IDE1cHg7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDNweDtcbiAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtZm9udC1jb2xvcikpO1xuICAgICAgICB0ZXh0LXNoYWRvdzogMXB4IDFweCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgLjMpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bi5zbWFsbCkge1xuICAgICAgICBwYWRkaW5nOiA1cHg7XG4gICAgICAgIG1pbi13aWR0aDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgLyAxLjUpO1xuICAgICAgICBtaW4taGVpZ2h0OiBjYWxjKHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKSAvIDEuNSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuLm1lZGl1bSkge1xuICAgICAgICBwYWRkaW5nOiA1cHggMTBweDtcbiAgICAgICAgbWluLXdpZHRoOiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4uYmlnKSB7XG4gICAgICAgIHBhZGRpbmc6IDVweCAxNXB4O1xuICAgICAgICBtaW4td2lkdGg6IGNhbGModmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpICogMS41KTtcbiAgICAgICAgbWluLWhlaWdodDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgKiAxLjUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bjpmb2N1cykge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4xKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG46aG92ZXIpIHtcbiAgICAgICAgYm94LXNoYWRvdzogMCAycHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMik7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjEpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bjphY3RpdmUpIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDFweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMXB4IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwLjIpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4xKTtcbiAgICB9XG5cbiAgICAvKiBTdWNjZXNzICovXG5cbiAgICAuYnRuLnN1Y2Nlc3Mge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itc3VjY2VzcykpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MtZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC5idG4uc3VjY2Vzczpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itc3VjY2VzcyksIC44NSk7XG4gICAgfVxuXG4gICAgLmJ0bi5zdWNjZXNzOmhvdmVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDFweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3Itc3VjY2Vzcy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi5zdWNjZXNzOmFjdGl2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgycHgpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDFweCByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MtZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBXYXJuaW5nICovXG5cbiAgICAuYnRuLndhcm5pbmcge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLXdhcm5pbmctZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC5idG4ud2FybmluZzpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZyksIC44NSk7XG4gICAgfVxuXG4gICAgLmJ0bi53YXJuaW5nOmhvdmVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDFweCk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMnB4IHJnYmEodmFyKC0tY29sb3Itd2FybmluZy1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi53YXJuaW5nOmFjdGl2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgycHgpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDFweCByZ2JhKHZhcigtLWNvbG9yLXdhcm5pbmctZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBEYW5nZXIgKi9cblxuICAgIC5idG4uZGFuZ2VyIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZm9udC1saWdodCkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhbmdlcikpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDJweCByZ2JhKHZhcigtLWNvbG9yLWRhbmdlci1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpLCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmJ0bi5kYW5nZXI6Zm9jdXMge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhbmdlciksIC44NSk7XG4gICAgfVxuXG4gICAgLmJ0bi5kYW5nZXI6aG92ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMXB4KTtcbiAgICAgICAgYm94LXNoYWRvdzogMCAycHggcmdiYSh2YXIoLS1jb2xvci1kYW5nZXItZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC5idG4uZGFuZ2VyOmFjdGl2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgycHgpO1xuICAgICAgICBib3gtc2hhZG93OiAwIDFweCByZ2JhKHZhcigtLWNvbG9yLWRhbmdlci1kYXJrKSksIHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgIH1cblxuXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIHtcbiAgICAgICAgOmdsb2JhbCguYnRuKSB7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLnN1Y2Nlc3Mge1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAzcHggcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzLWRhcmspKSwgdmFyKC0tc2hhZG93LXNlY29uZGFyeSksIHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4ud2FybmluZyB7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDNweCByZ2JhKHZhcigtLWNvbG9yLXdhcm5pbmctZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLmJ0bi5kYW5nZXIge1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAzcHggcmdiYSh2YXIoLS1jb2xvci1kYW5nZXItZGFyaykpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5KSwgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICB9XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgdG9DU1NTdHJpbmcsIGNsYXNzbmFtZXMgfSBmcm9tICcuLi91dGlscydcblxuICAgIGV4cG9ydCBsZXQgaXMgPSAnaW5mbydcbiAgICBleHBvcnQgbGV0IHNpemUgPSAwXG4gICAgZXhwb3J0IGxldCB3aWR0aCA9IDJcblxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ2RpdmlkZXInLCBpcywgJCRwcm9wcy5jbGFzcylcbiAgICAkOiBzdHlsZVByb3AgPSB0b0NTU1N0cmluZyh7IHBhZGRpbmc6IGAke3NpemUgLyAyfXB4IDBgLCBoZWlnaHQ6IGAke3dpZHRofXB4YCB9KVxuPC9zY3JpcHQ+XG5cbjxociBjbGFzcz17Y2xhc3NQcm9wfSBzdHlsZT17c3R5bGVQcm9wfT5cblxuPHN0eWxlPlxuICAgIC5kaXZpZGVyIHtcbiAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgIGJveC1zaXppbmc6IGNvbnRlbnQtYm94O1xuICAgICAgICBiYWNrZ3JvdW5kLWNsaXA6IGNvbnRlbnQtYm94O1xuICAgIH1cblxuICAgIC5pbmZvIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICB9XG5cbiAgICAuc3VjY2VzcyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYih2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgfVxuXG4gICAgLndhcm5pbmcge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgIH1cblxuICAgIC5kYW5nZXIge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGNsYXNzbmFtZXMsIHNhZmVHZXQgfSBmcm9tICcuLi91dGlscydcblxuICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAgIGV4cG9ydCBsZXQgaWQgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHZhbHVlID0gMCAvLyAwIC0gMTAwXG4gICAgZXhwb3J0IGxldCBzaXplID0gJ21lZGl1bSdcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBhcmlhTGFiZWwgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IGJvcmRlclJhZGl1cyA9IHVuZGVmaW5lZFxuXG4gICAgJDogdmFsID0gMFxuICAgICQ6IHRpdGxlUHJvcCA9IHRpdGxlIHx8IGBQcm9ncmVzcyAtICR7dmFsfSVgXG4gICAgJDogYXJpYUxhYmVsUHJvcCA9IGFyaWFMYWJlbCB8fCBgUHJvZ3Jlc3MgLSAke3ZhbH0lYFxuICAgICQ6IGNsYXNzUHJvcCA9IGNsYXNzbmFtZXMoJ3Byb2dyZXNzJywgc2l6ZSwgJCRwcm9wcy5jbGFzcylcblxuICAgIG9uTW91bnQoKCkgPT4ge1xuICAgICAgICAvLyBNYWtlIGxvYWRpbmcgcHJvZ3Jlc3MgZWZmZWN0IG9uIG1vdW50IGNvbXBvbmVudC5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB2YWwgPSBOdW1iZXIuaXNGaW5pdGUoK3ZhbHVlKSA/IE1hdGgubWF4KDAsIE1hdGgubWluKCt2YWx1ZSwgMTAwKSkgOiAwLCAwKVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBnZXRCb3JkZXJSYWRpdXMoYm9yZGVycywgZGVmYXVsdHMgPSAnOTk5OTlweCcpIHtcbiAgICAgICAgY29uc3QgYnJEZWZhdWx0ID0gbmV3IEFycmF5KDQpLmZpbGwoZGVmYXVsdHMpXG4gICAgICAgIGNvbnN0IGJkcyA9IHNhZmVHZXQoKCkgPT4gYm9yZGVycy5zcGxpdCgnICcpLCBbXSwgdHJ1ZSlcbiAgICAgICAgY29uc3QgcnVsZSA9ICdib3JkZXItcmFkaXVzJ1xuICAgICAgICByZXR1cm4gYCR7cnVsZX06JHtickRlZmF1bHQubWFwKChkZWYsIGkpID0+IGAke2Jkc1tpXSB8fCBkZWZ9YCkuam9pbignICcpfWBcbiAgICB9XG48L3NjcmlwdD5cblxuXG48ZGl2XG4gICAgICAgIHtpZH1cbiAgICAgICAgY2xhc3M9e2NsYXNzUHJvcH1cbiAgICAgICAgdGl0bGU9e3RpdGxlUHJvcH1cbiAgICAgICAgYXJpYS1sYWJlbD17YXJpYUxhYmVsUHJvcH1cbiAgICAgICAgcm9sZT1cInByb2dyZXNzYmFyXCJcbiAgICAgICAgYXJpYS12YWx1ZW1pbj1cIjBcIlxuICAgICAgICBhcmlhLXZhbHVlbWF4PVwiMTAwXCJcbiAgICAgICAgYXJpYS12YWx1ZW5vdz17dmFsfVxuICAgICAgICBzdHlsZT17YCR7Z2V0Qm9yZGVyUmFkaXVzKGJvcmRlclJhZGl1cyl9YH1cbj5cbiAgICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtaW5uZXItZnJhbWVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInByb2dyZXNzLWNvcmVcIiBzdHlsZT17YHdpZHRoOiR7dmFsfSVgfT48L2Rpdj5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuXG48c3R5bGU+XG4gICAgLnByb2dyZXNzIHtcbiAgICAgICAgLS1wcm9ncmVzcy1oZWlnaHQ6IDIwcHg7XG4gICAgICAgIC0tcHJvZ3Jlc3MtcGFkZGluZy1wb2ludDogMztcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3Muc21hbGwge1xuICAgICAgICAtLXByb2dyZXNzLWhlaWdodDogMTVweDtcbiAgICAgICAgLS1wcm9ncmVzcy1wYWRkaW5nLXBvaW50OiAzO1xuICAgIH1cblxuICAgIC5wcm9ncmVzcy5tZWRpdW0ge1xuICAgICAgICAtLXByb2dyZXNzLWhlaWdodDogMjBweDtcbiAgICAgICAgLS1wcm9ncmVzcy1wYWRkaW5nLXBvaW50OiAzLjU7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzLmJpZyB7XG4gICAgICAgIC0tcHJvZ3Jlc3MtaGVpZ2h0OiAzMHB4O1xuICAgICAgICAtLXByb2dyZXNzLXBhZGRpbmctcG9pbnQ6IDQ7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzIHtcbiAgICAgICAgZmxleDogMDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDk5OTlweDtcbiAgICAgICAgaGVpZ2h0OiB2YXIoLS1wcm9ncmVzcy1oZWlnaHQpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yKSk7XG4gICAgICAgIHBhZGRpbmc6IGNhbGModmFyKC0tcHJvZ3Jlc3MtaGVpZ2h0KSAvIHZhcigtLXByb2dyZXNzLXBhZGRpbmctcG9pbnQpKTtcbiAgICAgICAgYm94LXNoYWRvdzogaW5zZXQgdmFyKC0tc2hhZG93LXByaW1hcnkpLCB2YXIoLS1zaGFkb3ctc2Vjb25kYXJ5LWluc2V0KTtcbiAgICB9XG5cbiAgICAucHJvZ3Jlc3MtaW5uZXItZnJhbWUge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA5OTk5cHg7XG4gICAgfVxuXG4gICAgLnByb2dyZXNzLWNvcmUge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICB0cmFuc2l0aW9uOiAxcyBlYXNlLWluLW91dDtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogMnB4O1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgUGljdHVyZSBmcm9tICcuL1BpY3R1cmUuc3ZlbHRlJ1xuXG4gICAgY29uc3QgY2FyZHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwLzMwL3RlY2gnLFxuICAgICAgICAgICAgdGl0bGU6ICdUaGUgbWFpbiB0aXRsZSBhbmQgc2hvcnQgZGVzY3JpcHRpb24uJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDQ1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMC8zMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIGNoYXJpdHkgb2YgQ2hhcml0aWZ5LicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwLzMwL2FyY2gnLFxuICAgICAgICAgICAgdGl0bGU6ICdTZWNvbmQgYmlnZ2VyIG1ham9yIGNhcmQgdGl0bGUgbGluZSB3aXRoIGEgYml0IGxvbmdlciBkZXNjcmlwdGlvbi4nLFxuICAgICAgICAgICAgcGVyY2VudDogNjUsXG4gICAgICAgICAgICBvcmdIZWFkOiAnVGluYSBLYW5kZWxha2knLFxuICAgICAgICAgICAgb3JnSGVhZFNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwLzMwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdPUkcgY2hhcml0eSBvZiBDaGFyaXRpZnkuJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAvMzAvYW55JyxcbiAgICAgICAgICAgIHRpdGxlOiAnVGhlIG1haW4gdGl0bGUgYW5kIHNob3J0IGRlc2NyaXB0aW9uLicsXG4gICAgICAgICAgICBwZXJjZW50OiA1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmFyYW1pc2ltdXNzIEthbmRlbGFraW51c2thcycsXG4gICAgICAgICAgICBvcmdIZWFkU3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAvMzAvcGVvcGxlJyxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbjogJ09SRyBjaGFyaXR5IG9mIENoYXJpdGlmeS4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMC8zMC9uYXR1cmUnLFxuICAgICAgICAgICAgdGl0bGU6ICdUaGUgbWFpbiB0aXRsZSBhbmQgc2hvcnQgZGVzY3JpcHRpb24uJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDk1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMC8zMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIGdpYW50IGNoYXJpdHkgb3JnYW5pemF0aW9uIG9mIGJpZyBDaGFyaXRpZnkgY29tcGFueS4nLFxuICAgICAgICB9LFxuICAgIF1cblxuICAgIGNvbnN0IGltYWdlc0RlZmF1bHQgPSBjYXJkcy5tYXAoY2FyZCA9PiAoe1xuICAgICAgICBzcmM6IFtjYXJkLnNyYywgY2FyZC5zcmMsIGNhcmQuc3JjXSxcbiAgICAgICAgYWx0OiBjYXJkLnRpdGxlLFxuICAgIH0pKVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAdHlwZSB7bnVtYmVyIHwge1xuICAgICAqICAgICBzcmM6IHN0cmluZyxcbiAgICAgKiAgICAgYWx0OiBzdHJpbmcsXG4gICAgICogICAgIG9uQ2xpY2s/OiBmdW5jdGlvbixcbiAgICAgKiB9W119XG4gICAgICovXG4gICAgZXhwb3J0IGxldCBpdGVtcyA9IGltYWdlc0RlZmF1bHRcbjwvc2NyaXB0PlxuXG48dWwgYXJpYS1sYWJlbD1cImNhcm91c2VsXCI+XG4gICAgeyNlYWNoIGl0ZW1zIGFzIGl0ZW19XG4gICAgICAgIDxsaT5cbiAgICAgICAgICAgIDxzbG90IHtpdGVtfT5cbiAgICAgICAgICAgICAgICA8UGljdHVyZSBzcmM9e2l0ZW0uc3JjfSBhbHQ9e2l0ZW0uYWx0fS8+XG4gICAgICAgICAgICA8L3Nsb3Q+XG4gICAgICAgIDwvbGk+XG4gICAgey9lYWNofVxuPC91bD5cblxuPHN0eWxlPlxuICAgIHVsIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgICAgIG92ZXJmbG93LXk6IGhpZGRlbjtcbiAgICAgICAgb3ZlcmZsb3cteDogYXV0bztcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogMnB4O1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2g7XG4gICAgICAgIHNjcm9sbC1zbmFwLXR5cGU6IHggbWFuZGF0b3J5O1xuICAgIH1cblxuICAgIGxpIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgICAgIHNjcm9sbC1zbmFwLWFsaWduOiBjZW50ZXI7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgSWNvbiwgQnV0dG9uLCBBdmF0YXIgfSBmcm9tICcuLi9jb21wb25lbnRzJ1xuXG4gICAgZXhwb3J0IGxldCBzZWdtZW50XG5cbiAgICBsZXQgaXNEYXJrVGhlbWUgPSBmYWxzZVxuXG4gICAgbGV0IHZhbHVlID0gJ3VhJ1xuXG4gICAgZnVuY3Rpb24gY2hhbmdlVGhlbWUoKSB7XG4gICAgICAgIGlzRGFya1RoZW1lID0gIWlzRGFya1RoZW1lXG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgndGhlbWUtZGFyaycpXG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgndGhlbWUtbGlnaHQnKVxuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoaXNEYXJrVGhlbWUgPyAndGhlbWUtZGFyaycgOiAndGhlbWUtbGlnaHQnKVxuICAgIH1cbjwvc2NyaXB0PlxuXG48bmF2IGNsYXNzPVwidGhlbWUtYmcgY29udGFpbmVyXCI+XG4gICAgPHVsPlxuICAgICAgICA8bGk+PGEgcmVsPXByZWZldGNoIGhyZWY9Jy4nIGNsYXNzOnNlbGVjdGVkPSd7c2VnbWVudCA9PT0gdW5kZWZpbmVkfSc+aG9tZTwvYT48L2xpPlxuICAgICAgICA8bGk+PGEgaHJlZj0nbWFwJyBjbGFzczpzZWxlY3RlZD0ne3NlZ21lbnQgPT09IFwibWFwXCJ9Jz5tYXA8L2E+PC9saT5cbiAgICAgICAgPGxpPjxhIHJlbD1wcmVmZXRjaCBocmVmPSdsaXN0cycgY2xhc3M6c2VsZWN0ZWQ9J3tzZWdtZW50ID09PSBcImxpc3RzXCJ9Jz5saXN0czwvYT48L2xpPlxuICAgICAgICA8bGk+PGEgcmVsPXByZWZldGNoIGhyZWY9J2NoYXJpdHknIGNsYXNzOnNlbGVjdGVkPSd7c2VnbWVudCA9PT0gXCJjaGFyaXR5XCJ9Jz5jaGFyaXR5PC9hPjwvbGk+XG4gICAgICAgIDxsaT48YSByZWw9cHJlZmV0Y2ggaHJlZj0nb3JnYW5pemF0aW9uJyBjbGFzczpzZWxlY3RlZD0ne3NlZ21lbnQgPT09IFwib3JnYW5pemF0aW9uXCJ9Jz5vcmc8L2E+PC9saT5cbiAgICA8L3VsPlxuXG4gICAgPHVsIGNsYXNzPVwibmF2LWFjdGlvbnNcIj5cbiAgICAgICAgPGxpPlxuICAgICAgICAgICAgPHNlbGVjdCB7dmFsdWV9IG5hbWU9XCJsYW5nXCIgaWQ9XCJsYW5nXCIgY2xhc3M9XCJidG4gc21hbGwgbGFuZy1zZWxlY3RcIj5cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwidWFcIj5VYTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJydVwiPlJ1PC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImVuXCI+RW48L29wdGlvbj5cbiAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2xpPlxuXG4gICAgICAgIDxsaT5cbiAgICAgICAgICAgIDxCdXR0b24gb246Y2xpY2s9e2NoYW5nZVRoZW1lfSBhdXRvIHNpemU9XCJzbWFsbFwiPlxuICAgICAgICAgICAgICAgIDxJY29uIHR5cGU9XCJtb29uXCIgY2xhc3M9XCJ0aGVtZS1zdmctZmlsbFwiLz5cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8L2xpPlxuXG4gICAgICAgIDxsaT5cbiAgICAgICAgICAgIDxCdXR0b24gb246Y2xpY2s9e2NoYW5nZVRoZW1lfSBhdXRvIHNpemU9XCJzbWFsbFwiPlxuICAgICAgICAgICAgICAgIDxBdmF0YXIgc2l6ZT1cInNtYWxsXCIgc3JjPVwiaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGVcIi8+XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgPC9saT5cbiAgICA8L3VsPlxuPC9uYXY+XG5cbjxzdHlsZT5cbiAgICBuYXYge1xuICAgICAgICBwb3NpdGlvbjogc3RpY2t5O1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIHotaW5kZXg6IDEwO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1zZWNvbmRhcnkpO1xuICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpLCAuMSk7XG4gICAgfVxuXG4gICAgLnNlbGVjdGVkIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfVxuXG4gICAgLnNlbGVjdGVkOjphZnRlciB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgY29udGVudDogXCJcIjtcbiAgICAgICAgd2lkdGg6IGNhbGMoMTAwJSAtIDFlbSk7XG4gICAgICAgIGhlaWdodDogMnB4O1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICBib3R0b206IC0xcHg7XG4gICAgfVxuXG4gICAgYSB7XG4gICAgICAgIHBhZGRpbmc6IC44ZW0gMC41ZW07XG4gICAgfVxuXG4gICAgLm5hdi1hY3Rpb25zIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgbWFyZ2luOiAtM3B4O1xuICAgIH1cblxuICAgIC5uYXYtYWN0aW9ucyBsaSB7XG4gICAgICAgIHBhZGRpbmc6IDNweDtcbiAgICB9XG5cbiAgICAubGFuZy1zZWxlY3Qge1xuICAgICAgICBwYWRkaW5nOiA1cHg7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICAgIH1cblxuICAgIC5sYW5nLXNlbGVjdDpob3ZlcixcbiAgICAubGFuZy1zZWxlY3Q6Zm9jdXMge1xuICAgICAgICBib3gtc2hhZG93OiBub25lO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4xKTtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cblxuPC9zY3JpcHQ+XG5cbjxmb290ZXI+XG4gICAgPHA+wqkgMjAxOSAtIHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9PC9wPlxuPC9mb290ZXI+XG5cbjxzdHlsZT5cbiAgICBmb290ZXIge1xuICAgICAgICBwYWRkaW5nOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDIpIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICAgICAgYm94LXNoYWRvdzogaW5zZXQgdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yKSk7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgQXZhdGFyIH0gZnJvbSAnLi4vY29tcG9uZW50cydcblxuICAgIGV4cG9ydCBsZXQgc3JjID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCB0aXRsZSA9IHVuZGVmaW5lZFxuICAgIGV4cG9ydCBsZXQgc3VidGl0bGUgPSB1bmRlZmluZWRcbjwvc2NyaXB0PlxuXG48c2VjdGlvbj5cbiAgICA8QXZhdGFyIHNyYz17c3JjfSBhbHQ9e3RpdGxlfSBjbGFzcz1cImNvbW1lbnQtYXZhXCIvPlxuXG4gICAgPGRpdj5cbiAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICA8aDQ+e3RpdGxlfTwvaDQ+XG4gICAgICAgICAgICA8c3ViPntzdWJ0aXRsZX08L3N1Yj5cbiAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgIDxiciBjbGFzcz1cInNtYWxsXCI+XG5cbiAgICAgICAgPHNsb3Q+XG4gICAgICAgICAgICA8cHJlPlxuICAgICAgICAgICAgICAgIEEgbG9vb29vb29vb29uZyBjb21tZW50IHRoYXQgaGFzIGJlZW5cbiAgICAgICAgICAgICAgICBsZWZ0IGJ5IGEgdmVyeSBhbmdyeSBndXkgd2hvIGNvbXBsYWlucyB1cG9uXG4gICAgICAgICAgICAgICAgbG9vb29vbmcgY29tbWVudHMuXG4gICAgICAgICAgICA8L3ByZT5cbiAgICAgICAgPC9zbG90PlxuICAgIDwvZGl2PlxuPC9zZWN0aW9uPlxuXG48c3R5bGU+XG4gICAgc2VjdGlvbiB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIH1cblxuICAgIGRpdiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgIH1cblxuICAgIHNwYW4gaDQsXG4gICAgc3BhbiBzdWIge1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICAgIGxpbmUtaGVpZ2h0OiAxO1xuICAgICAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIH1cblxuICAgIHByZSB7XG4gICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgICAgICBmb250LXNpemU6IC44MjVlbTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuMjtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBBdmF0YXIgfSBmcm9tICcuLi9jb21wb25lbnRzJ1xuXG4gICAgZXhwb3J0IGxldCBzcmMgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBzdWJ0aXRsZSA9IHVuZGVmaW5lZFxuPC9zY3JpcHQ+XG5cbjxzZWN0aW9uPlxuICAgIDxBdmF0YXIgc3JjPXtzcmN9IGFsdD17dGl0bGV9Lz5cblxuICAgIDxzcGFuPlxuICAgICAgICA8aDQ+e3RpdGxlfTwvaDQ+XG4gICAgICAgIDxzdWI+e3N1YnRpdGxlfTwvc3ViPlxuICAgIDwvc3Bhbj5cbjwvc2VjdGlvbj5cblxuPHN0eWxlPlxuICAgIHNlY3Rpb24ge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIH1cblxuICAgIHNwYW4ge1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBwYWRkaW5nOiAwIDhweDtcbiAgICB9XG5cbiAgICBzcGFuIGg0LFxuICAgIHNwYW4gc3ViIHtcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuNDtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgQXZhdGFyQW5kTmFtZSBmcm9tICcuL0F2YXRhckFuZE5hbWUuc3ZlbHRlJ1xuXG4gICAgZXhwb3J0IGxldCBpdGVtcyA9IFtdXG48L3NjcmlwdD5cblxueyNlYWNoIGl0ZW1zIGFzIGl0ZW19XG4gICAgPHNlY3Rpb24gY2xhc3M9XCJpdGVtIGNvbnRhaW5lclwiPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxBdmF0YXJBbmROYW1lXG4gICAgICAgICAgICAgICAgc3JjPXtpdGVtLm9yZ0hlYWRTcmN9XG4gICAgICAgICAgICAgICAgdGl0bGU9e2l0ZW0ub3JnSGVhZH1cbiAgICAgICAgICAgICAgICBzdWJ0aXRsZT17aXRlbS5vcmdhbml6YXRpb259XG4gICAgICAgIC8+XG4gICAgICAgIDxicj5cbiAgICA8L3NlY3Rpb24+XG4gICAgPGJyPlxuezplbHNlfVxuICAgIDxzZWN0aW9uIGNsYXNzPVwiaXRlbSBjb250YWluZXJcIj5cbiAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiPk5vIG9yZ2FuaXphdGlvbnM8L3A+XG4gICAgPC9zZWN0aW9uPlxuey9lYWNofVxuXG48c3R5bGU+XG4gICAgLml0ZW0ge1xuICAgICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvcikpO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGltcG9ydCB7IFJhdGUsIFByb2dyZXNzLCBBdmF0YXIsIENhcm91c2VsIH0gZnJvbSAnLi4vY29tcG9uZW50cydcbiAgICBpbXBvcnQgQXZhdGFyQW5kTmFtZSBmcm9tICcuL0F2YXRhckFuZE5hbWUuc3ZlbHRlJ1xuXG4gICAgZXhwb3J0IGxldCBzcmMgPSB1bmRlZmluZWRcbiAgICBleHBvcnQgbGV0IHRpdGxlID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBwZXJjZW50ID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBvcmdIZWFkID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBvcmdIZWFkU3JjID0gdW5kZWZpbmVkXG4gICAgZXhwb3J0IGxldCBvcmdhbml6YXRpb24gPSB1bmRlZmluZWRcblxuICAgICQ6IGltYWdlcyA9IG5ldyBBcnJheSg0KS5maWxsKHtcbiAgICAgICAgc3JjLFxuICAgICAgICBhbHQ6IHRpdGxlLFxuICAgIH0pXG48L3NjcmlwdD5cblxuPHNlY3Rpb24gY2xhc3M9XCJjYXJkXCI+XG4gICAgPGRpdiBjbGFzcz1cImltYWdlcy13cmFwXCI+XG4gICAgICAgIDxDYXJvdXNlbCBpdGVtcz17aW1hZ2VzfS8+XG4gICAgPC9kaXY+XG5cbiAgICA8UHJvZ3Jlc3MgdmFsdWU9e3BlcmNlbnR9IGJvcmRlclJhZGl1cz1cIjAgMFwiLz5cblxuICAgIDxoND57dGl0bGV9PC9oND5cblxuICAgIDxkaXYgY2xhc3M9XCJyYXRlLXdyYXBcIj5cbiAgICAgICAgPFJhdGUgc2l6ZT1cInNtYWxsXCIvPlxuICAgIDwvZGl2PlxuXG4gICAgPGZvb3Rlcj5cbiAgICAgICAgPEF2YXRhckFuZE5hbWUgc3JjPXtvcmdIZWFkU3JjfSB0aXRsZT17b3JnSGVhZH0gc3VidGl0bGU9e29yZ2FuaXphdGlvbn0vPlxuICAgIDwvZm9vdGVyPlxuPC9zZWN0aW9uPlxuXG48c3R5bGU+XG4gICAgLmNhcmQge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgIH1cblxuICAgIC5yYXRlLXdyYXAge1xuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmctdG9wOiA2cHg7XG4gICAgfVxuXG4gICAgLmltYWdlcy13cmFwIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgaGVpZ2h0OiAxMDBweDtcbiAgICB9XG5cbiAgICBoNCB7XG4gICAgICAgIC0tY2FyZC1saW5lLWhlaWdodDogMS40O1xuXG4gICAgICAgIGZvbnQtc2l6ZTogLjhlbTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IHZhcigtLWNhcmQtbGluZS1oZWlnaHQpO1xuICAgICAgICBoZWlnaHQ6IGNhbGModmFyKC0tZm9udC1zaXplKSAqICh2YXIoLS1jYXJkLWxpbmUtaGVpZ2h0KSAvIDEuMikgKiAyKTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBEaXZpZGVyIH0gZnJvbSAnLi4vY29tcG9uZW50cydcbiAgICBpbXBvcnQgQ2hhcml0eUNhcmQgZnJvbSAnLi4vbGF5b3V0cy9DaGFyaXR5Q2FyZC5zdmVsdGUnXG5cbiAgICBleHBvcnQgbGV0IGxpc3ROYW1lXG4gICAgZXhwb3J0IGxldCBhbW91bnQgPSAyXG5cbiAgICAkOiBjYXJkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC90ZWNoJyxcbiAgICAgICAgICAgIHRpdGxlOiAnVGhpcyBwZXJzb24gbmVlZHMgeW91ciBoZWxwJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDQ1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdIZWFkIG9mIHRoZSBvcmdhbml6YXRpb24gd2l0aCBsb29vb29vb29uZy1uYWFhYWFhbWVkIGNoYXJpdHknLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL2FyY2gnLFxuICAgICAgICAgICAgdGl0bGU6ICdBbm90aGVyIHBlcnNvbiB3aG8gbmVlZHMgeW91ciBxdWljayBoZWxwJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDY1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdIZWFkIG9mIGFub3RoZXIgb3JnYW5pemF0aW9uJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9hbnknLFxuICAgICAgICAgICAgdGl0bGU6ICdUaGUgcGVyc29uIHdpdGggdGhlIGxvbmdlc3QgbmFtZSBpcyBhbHNvIHdhaXQgZm9yIHlvdScsXG4gICAgICAgICAgICBwZXJjZW50OiA1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmFyYW1pc2ltdXNzIGVsLWRlLWxhIEthbmRlbGFraW51c2thcycsXG4gICAgICAgICAgICBvcmdIZWFkU3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIG9mIGNoYXJpdHknLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL25hdHVyZScsXG4gICAgICAgICAgICB0aXRsZTogJ05lZWRzJyxcbiAgICAgICAgICAgIHBlcmNlbnQ6IDk1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmEgS2FuZGVsYWtpJyxcbiAgICAgICAgICAgIG9yZ0hlYWRTcmM6ICdodHRwczovL3BsYWNlaW1nLmNvbS8zMDAvMzAwL3Blb3BsZScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246ICdPUkcgZ2lhbnQgY2hhcml0eSBvcmdhbml6YXRpb24gb2YgYmlnIENoYXJpdGlmeSBjb21wYW55JyxcbiAgICAgICAgfSxcbiAgICBdLnNsaWNlKE51bWJlci5pc0Zpbml0ZSgrYW1vdW50KSA/ICthbW91bnQgOiAwKVxuXG4gICAgJDogaW1hZ2VzID0gY2FyZHMubWFwKGNhcmQgPT4gKHtcbiAgICAgICAgc3JjOiBbY2FyZC5zcmMsIGNhcmQuc3JjLCBjYXJkLnNyY10sXG4gICAgICAgIGFsdDogY2FyZC50aXRsZSxcbiAgICB9KSlcbjwvc2NyaXB0PlxuXG48c2VjdGlvbj5cbiAgICB7I2lmIGxpc3ROYW1lfVxuICAgICAgICA8RGl2aWRlciBzaXplPVwiMTZcIi8+XG4gICAgICAgIDxoMyBjbGFzcz1cImgyIHRleHQtcmlnaHRcIj57bGlzdE5hbWV9PC9oMz5cbiAgICAgICAgPERpdmlkZXIgc2l6ZT1cIjIwXCIvPlxuICAgICAgICA8YnI+XG4gICAgey9pZn1cbiAgICA8dWwgY2xhc3M9XCJjYXJkc1wiPlxuICAgICAgICB7I2VhY2ggY2FyZHMgYXMgY2FyZH1cbiAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICA8Q2hhcml0eUNhcmQgey4uLmNhcmR9Lz5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgIHsvZWFjaH1cbiAgICA8L3VsPlxuPC9zZWN0aW9uPlxuXG48c3R5bGU+XG4gICAgc2VjdGlvbiB7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBwYWRkaW5nOiAwIDEwcHg7XG4gICAgfVxuXG4gICAgLmNhcmRzIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgICAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmc6IHZhcigtLXNjcmVlbi1wYWRkaW5nKSAwO1xuICAgICAgICBtYXJnaW46IGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogLTMpIGNhbGModmFyKC0tc2NyZWVuLXBhZGRpbmcpICogLTEpO1xuICAgIH1cblxuICAgIC5jYXJkcyBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICAgICAgd2lkdGg6IDUwJTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgcGFkZGluZzogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAzKSB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgfVxuXG4gICAgLmNhcmRzIGxpOmhvdmVyIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAuMSlcbiAgICB9XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgICBleHBvcnQgbGV0IHRpdGxlID0gJ1RoZSBtYWluIHRpdGxlIHRoYXQgZXhwbGFpbnMgdGhlIGNoYXJpdHknXG4gICAgZXhwb3J0IGxldCBzdWJ0aXRsZSA9ICdBbmQgYmlnZ2VyIGRlc2NyaXB0aW9uIHRoYXQgZGVzY3JpYmVzIGluIHNob3J0IGtleXdvcmRzIGEgY2hhcml0eSwgdGl0bGUgYWJvdmUgYW5kIGp1c3QgbWFrZXMgdGV4dCBsb25nZXInXG48L3NjcmlwdD5cblxuPHNlY3Rpb24+XG4gICAgPGgxPnt0aXRsZX08L2gxPlxuICAgIDxicj5cbiAgICA8aDI+e3N1YnRpdGxlfTwvaDI+XG48L3NlY3Rpb24+XG5cbjxzdHlsZT5cbiAgICBzZWN0aW9uIHtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBwYWRkaW5nOiAwIDN2dztcbiAgICB9XG5cbiAgICBoMiB7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA0MDA7XG4gICAgfVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgSW5wdXQsIEJ1dHRvbiB9IGZyb20gJy4uL2NvbXBvbmVudHMnXG48L3NjcmlwdD5cblxuPHVsPlxuICAgIDxsaT5cbiAgICAgICAgPEJ1dHRvbiBpcz1cInN1Y2Nlc3NcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiPnRlc3QxPC9CdXR0b24+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICAgIDxCdXR0b24gaXM9XCJzdWNjZXNzXCIgb246Y2xpY2s9XCJ7ZSA9PiBjb25zb2xlLmxvZyhlKX1cIj50ZXN0MTI8L0J1dHRvbj5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPEJ1dHRvbiBpcz1cInN1Y2Nlc3NcIiBvbjpjbGljaz1cIntlID0+IGNvbnNvbGUubG9nKGUpfVwiPnRlc3QxMjM8L0J1dHRvbj5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgICAgPGJyPlxuICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICBuYW1lPVwibnVtXCJcbiAgICAgICAgICAgICAgICBsaXN0PVwic3VtLXN1Z2dlc3Rpb25zXCJcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk51bVwiXG4gICAgICAgICAgICAgICAgYXV0b3NlbGVjdFxuICAgICAgICAgICAgICAgIGFsaWduPVwicmlnaHRcIlxuICAgICAgICAvPlxuXG4gICAgICAgIDxkYXRhbGlzdCBpZD1cInN1bS1zdWdnZXN0aW9uc1wiPlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjIwXCI+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiNTAwXCI+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMTAwMFwiPlxuICAgICAgICA8L2RhdGFsaXN0PlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgICA8QnV0dG9uIGlzPVwid2FybmluZ1wiIG9uOmNsaWNrPVwie2UgPT4gY29uc29sZS5sb2coZSl9XCI+U3VibWl0PC9CdXR0b24+XG4gICAgPC9saT5cbjwvdWw+XG5cbjxzdHlsZT5cbiAgICB1bCB7XG4gICAgICAgIGZsZXg6IDA7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIG1hcmdpbjogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAtMSAvIDIpIDA7XG4gICAgICAgIHBhZGRpbmc6IDAgMCAwIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICB1bCBsaSB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIG1hcmdpbjogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgLyAyKSAwO1xuICAgIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICAgIGNvbnN0IGl0ZW1zID0gW1xuICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0NvbWZvcnQgaXMgdGhlIG1haW4gZmVhdHVyZScsXG4gICAgICAgICAgICB0ZXh0OiAnSnVzdCBpbWFnaW5nLCB5b3UgZG8gc29tZXRoaW5nIHNpbXBsZSBhbmQgeW91IGNhbiBzZWUgdGhlIHJlc3VsdCBvZiB5b3VyIHNob3J0IHdheS4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0NvbWZvcnQgaXMgdGhlIG1haW4gZmVhdHVyZScsXG4gICAgICAgICAgICB0ZXh0OiAnSnVzdCBpbWFnaW5nLCB5b3UgZG8gc29tZXRoaW5nIHNpbXBsZSBhbmQgeW91IGNhbiBzZWUgdGhlIHJlc3VsdCBvZiB5b3VyIHNob3J0IHdheS4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0NvbWZvcnQgaXMgdGhlIG1haW4gZmVhdHVyZScsXG4gICAgICAgICAgICB0ZXh0OiAnSnVzdCBpbWFnaW5nLCB5b3UgZG8gc29tZXRoaW5nIHNpbXBsZSBhbmQgeW91IGNhbiBzZWUgdGhlIHJlc3VsdCBvZiB5b3VyIHNob3J0IHdheS4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0NvbWZvcnQgaXMgdGhlIG1haW4gZmVhdHVyZScsXG4gICAgICAgICAgICB0ZXh0OiAnSnVzdCBpbWFnaW5nLCB5b3UgZG8gc29tZXRoaW5nIHNpbXBsZSBhbmQgeW91IGNhbiBzZWUgdGhlIHJlc3VsdCBvZiB5b3VyIHNob3J0IHdheS4nLFxuICAgICAgICB9LFxuICAgIF1cbjwvc2NyaXB0PlxuXG48dWw+XG4gICAgeyNlYWNoIGl0ZW1zIGFzIGl0ZW19XG4gICAgICAgIDxsaT5cbiAgICAgICAgICAgIDxoMz57aXRlbS50aXRsZX08L2gzPlxuICAgICAgICAgICAgPHA+e2l0ZW0udGV4dH08L3A+XG4gICAgICAgICAgICA8YnI+XG4gICAgICAgIDwvbGk+XG4gICAgey9lYWNofVxuPC91bD5cblxuPHN0eWxlPlxuICAgIHVsIHtcbiAgICAgICAgbGlzdC1zdHlsZTogZGlzYyBvdXRzaWRlIG5vbmU7XG4gICAgICAgIHBhZGRpbmc6IDAgY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiA1KTtcbiAgICAgICAgLypsaXN0LXN0eWxlLWltYWdlOiB1cmwoXCJkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCw8c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyB2aWV3Qm94PSctMSAtMSAyIDInPjxjaXJjbGUgcj0nMScgLz48L3N2Zz5cIik7Ki9cbiAgICB9XG5cbiAgICBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGxpc3QtaXRlbTtcbiAgICB9XG5cbiAgICB1bCwgbGksIGgzLCBwIHtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xuICAgIH1cblxuICAgIGgzLCBwIHtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xuICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsSUFBSSxHQUFHLEdBQUc7QUFDbkIsQUFDQSxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFF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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VCQ0k3RixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3lCQUdsQixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3lCQUdsQixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3lCQW9CbEIsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7eUJDUnpDLEdBQUksSUFBQyxLQUFLOzs7O3lCQUNYLEdBQUksSUFBQyxJQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzRCQUhkLEdBQUs7OztnQ0FBVixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsyQkFBQyxHQUFLOzs7K0JBQVYsTUFBSTs7Ozs7Ozs7Ozs7Ozs7OztvQ0FBSixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXJCQSxLQUFLOztHQUVILEtBQUssRUFBRSw2QkFBNkI7R0FDcEMsSUFBSSxFQUFFLHFGQUFxRjs7O0dBRzNGLEtBQUssRUFBRSw2QkFBNkI7R0FDcEMsSUFBSSxFQUFFLHFGQUFxRjs7O0dBRzNGLEtBQUssRUFBRSw2QkFBNkI7R0FDcEMsSUFBSSxFQUFFLHFGQUFxRjs7O0dBRzNGLEtBQUssRUFBRSw2QkFBNkI7R0FDcEMsSUFBSSxFQUFFLHFGQUFxRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsifQ==
