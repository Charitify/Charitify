'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sirv = _interopDefault(require('sirv'));
var express = _interopDefault(require('express'));
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

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Built-in value references. */
var Symbol$1 = root.Symbol;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag$1 && symToStringTag$1 in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype,
    objectProto$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
}

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
  return this;
}

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/* Built-in method references that are verified to be native. */
var Map$1 = getNative(root, 'Map');

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map$1 || ListCache),
    'string': new Hash
  };
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = MapCache;

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = memoize(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoizeCapped(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol$1 ? Symbol$1.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap(value, baseToString) + '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (isArray(value)) {
    return value;
  }
  return isKey(value, object) ? [value] : stringToPath(toString(value));
}

/** Used as references for various `Number` constants. */
var INFINITY$1 = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
}

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = castPath(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$4.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

/**
 * The base implementation of `_.set`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */
function baseSet(object, path, value, customizer) {
  if (!isObject(object)) {
    return object;
  }
  path = castPath(path, object);

  var index = -1,
      length = path.length,
      lastIndex = length - 1,
      nested = object;

  while (nested != null && ++index < length) {
    var key = toKey(path[index]),
        newValue = value;

    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : undefined;
      if (newValue === undefined) {
        newValue = isObject(objValue)
          ? objValue
          : (isIndex(path[index + 1]) ? [] : {});
      }
    }
    assignValue(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}

/**
 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
 * it's created. Arrays are created for missing index properties while objects
 * are created for all other missing properties. Use `_.setWith` to customize
 * `path` creation.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.set(object, 'a[0].b.c', 4);
 * console.log(object.a[0].b.c);
 * // => 4
 *
 * _.set(object, ['x', '0', 'y', 'z'], 5);
 * console.log(object.x[0].y.z);
 * // => 5
 */
function set(object, path, value) {
  return object == null ? object : baseSet(object, path, value);
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map$1 || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED$2);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$1 = 1,
    COMPARE_UNORDERED_FLAG$1 = 2;

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag$1 = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto$1 = Symbol$1 ? Symbol$1.prototype : undefined,
    symbolValueOf = symbolProto$1 ? symbolProto$1.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$1;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG$1;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag$1:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$7.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable$1 = objectProto$7.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty$5.call(value, 'callee') &&
    !propertyIsEnumerable$1.call(value, 'callee');
};

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer$1 = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
}

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag$1 = '[object Boolean]',
    dateTag$1 = '[object Date]',
    errorTag$1 = '[object Error]',
    funcTag$1 = '[object Function]',
    mapTag$1 = '[object Map]',
    numberTag$1 = '[object Number]',
    objectTag = '[object Object]',
    regexpTag$1 = '[object RegExp]',
    setTag$1 = '[object Set]',
    stringTag$1 = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag$1 = '[object ArrayBuffer]',
    dataViewTag$1 = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] =
typedArrayTags[dataViewTag$1] = typedArrayTags[dateTag$1] =
typedArrayTags[errorTag$1] = typedArrayTags[funcTag$1] =
typedArrayTags[mapTag$1] = typedArrayTags[numberTag$1] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag$1] =
typedArrayTags[setTag$1] = typedArrayTags[stringTag$1] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/** Detect free variable `exports`. */
var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports$1 && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule$1 && freeModule$1.require && freeModule$1.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/** Used for built-in method references. */
var objectProto$8 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$8.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$6.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$9 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$9;

  return value === proto;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

/** Used for built-in method references. */
var objectProto$a = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7 = objectProto$a.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$7.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$2 = 1;

/** Used for built-in method references. */
var objectProto$b = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$8 = objectProto$b.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty$8.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');

/* Built-in method references that are verified to be native. */
var Promise$1 = getNative(root, 'Promise');

/* Built-in method references that are verified to be native. */
var Set$1 = getNative(root, 'Set');

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

/** `Object#toString` result references. */
var mapTag$2 = '[object Map]',
    objectTag$1 = '[object Object]',
    promiseTag = '[object Promise]',
    setTag$2 = '[object Set]',
    weakMapTag$1 = '[object WeakMap]';

var dataViewTag$2 = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map$1),
    promiseCtorString = toSource(Promise$1),
    setCtorString = toSource(Set$1),
    weakMapCtorString = toSource(WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag$2) ||
    (Map$1 && getTag(new Map$1) != mapTag$2) ||
    (Promise$1 && getTag(Promise$1.resolve()) != promiseTag) ||
    (Set$1 && getTag(new Set$1) != setTag$2) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag$1)) {
  getTag = function(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag$1 ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag$2;
        case mapCtorString: return mapTag$2;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag$2;
        case weakMapCtorString: return weakMapTag$1;
      }
    }
    return result;
  };
}

var getTag$1 = getTag;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$3 = 1;

/** `Object#toString` result references. */
var argsTag$2 = '[object Arguments]',
    arrayTag$1 = '[object Array]',
    objectTag$2 = '[object Object]';

/** Used for built-in method references. */
var objectProto$c = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$9 = objectProto$c.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag$1 : getTag$1(object),
      othTag = othIsArr ? arrayTag$1 : getTag$1(other);

  objTag = objTag == argsTag$2 ? objectTag$2 : objTag;
  othTag = othTag == argsTag$2 ? objectTag$2 : othTag;

  var objIsObj = objTag == objectTag$2,
      othIsObj = othTag == objectTag$2,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer(object)) {
    if (!isBuffer(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG$3)) {
    var objIsWrapped = objIsObj && hasOwnProperty$9.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty$9.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$4 = 1,
    COMPARE_UNORDERED_FLAG$2 = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack;
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined
            ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$4 | COMPARE_UNORDERED_FLAG$2, customizer, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = keys(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, isStrictComparable(value)];
  }
  return result;
}

/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue &&
      (srcValue !== undefined || (key in Object(object)));
  };
}

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch(object, source, matchData);
  };
}

/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath(object, path, hasFunc) {
  path = castPath(path, object);

  var index = -1,
      length = path.length,
      result = false;

  while (++index < length) {
    var key = toKey(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength(length) && isIndex(key, length) &&
    (isArray(object) || isArguments(object));
}

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn(object, path) {
  return object != null && hasPath(object, path, baseHasIn);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$5 = 1,
    COMPARE_UNORDERED_FLAG$3 = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty(path, srcValue) {
  if (isKey(path) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(toKey(path), srcValue);
  }
  return function(object) {
    var objValue = get(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? hasIn(object, path)
      : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$5 | COMPARE_UNORDERED_FLAG$3);
  };
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return identity;
  }
  if (typeof value == 'object') {
    return isArray(value)
      ? baseMatchesProperty(value[0], value[1])
      : baseMatches(value);
  }
  return property(value);
}

/**
 * Creates a `_.find` or `_.findLast` function.
 *
 * @private
 * @param {Function} findIndexFunc The function to find the collection index.
 * @returns {Function} Returns the new find function.
 */
function createFind(findIndexFunc) {
  return function(collection, predicate, fromIndex) {
    var iterable = Object(collection);
    if (!isArrayLike(collection)) {
      var iteratee = baseIteratee(predicate);
      collection = keys(collection);
      predicate = function(key) { return iteratee(iterable[key], key, iterable); };
    }
    var index = findIndexFunc(collection, predicate, fromIndex);
    return index > -1 ? iterable[iteratee ? collection[index] : index] : undefined;
  };
}

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

/** Used as references for various `Number` constants. */
var INFINITY$2 = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY$2 || value === -INFINITY$2) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
  var result = toFinite(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * This method is like `_.find` except that it returns the index of the first
 * element `predicate` returns truthy for instead of the element itself.
 *
 * @static
 * @memberOf _
 * @since 1.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {number} Returns the index of the found element, else `-1`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'active': false },
 *   { 'user': 'fred',    'active': false },
 *   { 'user': 'pebbles', 'active': true }
 * ];
 *
 * _.findIndex(users, function(o) { return o.user == 'barney'; });
 * // => 0
 *
 * // The `_.matches` iteratee shorthand.
 * _.findIndex(users, { 'user': 'fred', 'active': false });
 * // => 1
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.findIndex(users, ['active', false]);
 * // => 0
 *
 * // The `_.property` iteratee shorthand.
 * _.findIndex(users, 'active');
 * // => 2
 */
function findIndex(array, predicate, fromIndex) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }
  var index = fromIndex == null ? 0 : toInteger(fromIndex);
  if (index < 0) {
    index = nativeMax(length + index, 0);
  }
  return baseFindIndex(array, baseIteratee(predicate), index);
}

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': true },
 *   { 'user': 'fred',    'age': 40, 'active': false },
 *   { 'user': 'pebbles', 'age': 1,  'active': true }
 * ];
 *
 * _.find(users, function(o) { return o.age < 40; });
 * // => object for 'barney'
 *
 * // The `_.matches` iteratee shorthand.
 * _.find(users, { 'age': 1, 'active': true });
 * // => object for 'pebbles'
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.find(users, ['active', false]);
 * // => object for 'fred'
 *
 * // The `_.property` iteratee shorthand.
 * _.find(users, 'active');
 * // => object for 'barney'
 */
var find = createFind(findIndex);

/** `Object#toString` result references. */
var mapTag$3 = '[object Map]',
    setTag$3 = '[object Set]';

/** Used for built-in method references. */
var objectProto$d = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$a = objectProto$d.hasOwnProperty;

/**
 * Checks if `value` is an empty object, collection, map, or set.
 *
 * Objects are considered empty if they have no own enumerable string keyed
 * properties.
 *
 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
 * jQuery-like collections are considered empty if they have a `length` of `0`.
 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike(value) &&
      (isArray(value) || typeof value == 'string' || typeof value.splice == 'function' ||
        isBuffer(value) || isTypedArray(value) || isArguments(value))) {
    return !value.length;
  }
  var tag = getTag$1(value);
  if (tag == mapTag$3 || tag == setTag$3) {
    return !value.size;
  }
  if (isPrototype(value)) {
    return !baseKeys(value).length;
  }
  for (var key in value) {
    if (hasOwnProperty$a.call(value, key)) {
      return false;
    }
  }
  return true;
}

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$e = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$b = objectProto$e.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty$b.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn$1(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn(object, source) {
  return object && copyObject(source, keysIn$1(source), object);
}

/** Detect free variable `exports`. */
var freeExports$2 = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$2 = freeExports$2 && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;

/** Built-in value references. */
var Buffer$2 = moduleExports$2 ? root.Buffer : undefined,
    allocUnsafe = Buffer$2 ? Buffer$2.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object);
}

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols$1 ? stubArray : function(object) {
  var result = [];
  while (object) {
    arrayPush(result, getSymbols(object));
    object = getPrototype(object);
  }
  return result;
};

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn(source, object) {
  return copyObject(source, getSymbolsIn(source), object);
}

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
  return baseGetAllKeys(object, keysIn$1, getSymbolsIn);
}

/** Used for built-in method references. */
var objectProto$f = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$c = objectProto$f.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty$c.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

/** Used to convert symbols to primitives and strings. */
var symbolProto$2 = Symbol$1 ? Symbol$1.prototype : undefined,
    symbolValueOf$1 = symbolProto$2 ? symbolProto$2.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf$1 ? Object(symbolValueOf$1.call(symbol)) : {};
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/** `Object#toString` result references. */
var boolTag$2 = '[object Boolean]',
    dateTag$2 = '[object Date]',
    mapTag$4 = '[object Map]',
    numberTag$2 = '[object Number]',
    regexpTag$2 = '[object RegExp]',
    setTag$4 = '[object Set]',
    stringTag$2 = '[object String]',
    symbolTag$2 = '[object Symbol]';

var arrayBufferTag$2 = '[object ArrayBuffer]',
    dataViewTag$3 = '[object DataView]',
    float32Tag$1 = '[object Float32Array]',
    float64Tag$1 = '[object Float64Array]',
    int8Tag$1 = '[object Int8Array]',
    int16Tag$1 = '[object Int16Array]',
    int32Tag$1 = '[object Int32Array]',
    uint8Tag$1 = '[object Uint8Array]',
    uint8ClampedTag$1 = '[object Uint8ClampedArray]',
    uint16Tag$1 = '[object Uint16Array]',
    uint32Tag$1 = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag$2:
      return cloneArrayBuffer(object);

    case boolTag$2:
    case dateTag$2:
      return new Ctor(+object);

    case dataViewTag$3:
      return cloneDataView(object, isDeep);

    case float32Tag$1: case float64Tag$1:
    case int8Tag$1: case int16Tag$1: case int32Tag$1:
    case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
      return cloneTypedArray(object, isDeep);

    case mapTag$4:
      return new Ctor;

    case numberTag$2:
    case stringTag$2:
      return new Ctor(object);

    case regexpTag$2:
      return cloneRegExp(object);

    case setTag$4:
      return new Ctor;

    case symbolTag$2:
      return cloneSymbol(object);
  }
}

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

/** `Object#toString` result references. */
var mapTag$5 = '[object Map]';

/**
 * The base implementation of `_.isMap` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 */
function baseIsMap(value) {
  return isObjectLike(value) && getTag$1(value) == mapTag$5;
}

/* Node.js helper references. */
var nodeIsMap = nodeUtil && nodeUtil.isMap;

/**
 * Checks if `value` is classified as a `Map` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 * @example
 *
 * _.isMap(new Map);
 * // => true
 *
 * _.isMap(new WeakMap);
 * // => false
 */
var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;

/** `Object#toString` result references. */
var setTag$5 = '[object Set]';

/**
 * The base implementation of `_.isSet` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 */
function baseIsSet(value) {
  return isObjectLike(value) && getTag$1(value) == setTag$5;
}

/* Node.js helper references. */
var nodeIsSet = nodeUtil && nodeUtil.isSet;

/**
 * Checks if `value` is classified as a `Set` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 * @example
 *
 * _.isSet(new Set);
 * // => true
 *
 * _.isSet(new WeakSet);
 * // => false
 */
var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/** `Object#toString` result references. */
var argsTag$3 = '[object Arguments]',
    arrayTag$2 = '[object Array]',
    boolTag$3 = '[object Boolean]',
    dateTag$3 = '[object Date]',
    errorTag$2 = '[object Error]',
    funcTag$2 = '[object Function]',
    genTag$1 = '[object GeneratorFunction]',
    mapTag$6 = '[object Map]',
    numberTag$3 = '[object Number]',
    objectTag$3 = '[object Object]',
    regexpTag$3 = '[object RegExp]',
    setTag$6 = '[object Set]',
    stringTag$3 = '[object String]',
    symbolTag$3 = '[object Symbol]',
    weakMapTag$2 = '[object WeakMap]';

var arrayBufferTag$3 = '[object ArrayBuffer]',
    dataViewTag$4 = '[object DataView]',
    float32Tag$2 = '[object Float32Array]',
    float64Tag$2 = '[object Float64Array]',
    int8Tag$2 = '[object Int8Array]',
    int16Tag$2 = '[object Int16Array]',
    int32Tag$2 = '[object Int32Array]',
    uint8Tag$2 = '[object Uint8Array]',
    uint8ClampedTag$2 = '[object Uint8ClampedArray]',
    uint16Tag$2 = '[object Uint16Array]',
    uint32Tag$2 = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag$3] = cloneableTags[arrayTag$2] =
cloneableTags[arrayBufferTag$3] = cloneableTags[dataViewTag$4] =
cloneableTags[boolTag$3] = cloneableTags[dateTag$3] =
cloneableTags[float32Tag$2] = cloneableTags[float64Tag$2] =
cloneableTags[int8Tag$2] = cloneableTags[int16Tag$2] =
cloneableTags[int32Tag$2] = cloneableTags[mapTag$6] =
cloneableTags[numberTag$3] = cloneableTags[objectTag$3] =
cloneableTags[regexpTag$3] = cloneableTags[setTag$6] =
cloneableTags[stringTag$3] = cloneableTags[symbolTag$3] =
cloneableTags[uint8Tag$2] = cloneableTags[uint8ClampedTag$2] =
cloneableTags[uint16Tag$2] = cloneableTags[uint32Tag$2] = true;
cloneableTags[errorTag$2] = cloneableTags[funcTag$2] =
cloneableTags[weakMapTag$2] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result,
      isDeep = bitmask & CLONE_DEEP_FLAG,
      isFlat = bitmask & CLONE_FLAT_FLAG,
      isFull = bitmask & CLONE_SYMBOLS_FLAG;

  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag$1(value),
        isFunc = tag == funcTag$2 || tag == genTag$1;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag$3 || tag == argsTag$3 || (isFunc && !object)) {
      result = (isFlat || isFunc) ? {} : initCloneObject(value);
      if (!isDeep) {
        return isFlat
          ? copySymbolsIn(value, baseAssignIn(result, value))
          : copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (isSet(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });
  } else if (isMap(value)) {
    value.forEach(function(subValue, key) {
      result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });
  }

  var keysFunc = isFull
    ? (isFlat ? getAllKeysIn : getAllKeys)
    : (isFlat ? keysIn : keys);

  var props = isArr ? undefined : keysFunc(value);
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
  });
  return result;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$1 = 1,
    CLONE_SYMBOLS_FLAG$1 = 4;

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
  return baseClone(value, CLONE_DEEP_FLAG$1 | CLONE_SYMBOLS_FLAG$1);
}

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
  BACKEND_URL: 'mock', // '/Charitify/', // charitify-application.page.link/?link=https://charitify-application.firebaseio.com&apn=package_name

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

/* node_modules/svelte-icons/fa/FaAt.svelte generated by Svelte v3.18.1 */

const FaAt = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M256 8C118.941 8 8 118.919 8 256c0 137.059 110.919 248 248 248 48.154 0 95.342-14.14 135.408-40.223 12.005-7.815 14.625-24.288 5.552-35.372l-10.177-12.433c-7.671-9.371-21.179-11.667-31.373-5.129C325.92 429.757 291.314 440 256 440c-101.458 0-184-82.542-184-184S154.542 72 256 72c100.139 0 184 57.619 184 160 0 38.786-21.093 79.742-58.17 83.693-17.349-.454-16.91-12.857-13.476-30.024l23.433-121.11C394.653 149.75 383.308 136 368.225 136h-44.981a13.518 13.518 0 0 0-13.432 11.993l-.01.092c-14.697-17.901-40.448-21.775-59.971-21.775-74.58 0-137.831 62.234-137.831 151.46 0 65.303 36.785 105.87 96 105.87 26.984 0 57.369-15.637 74.991-38.333 9.522 34.104 40.613 34.103 70.71 34.103C462.609 379.41 504 307.798 504 232 504 95.653 394.023 8 256 8zm-21.68 304.43c-22.249 0-36.07-15.623-36.07-40.771 0-44.993 30.779-72.729 58.63-72.729 22.292 0 35.601 15.241 35.601 40.77 0 45.061-33.875 72.73-58.161 72.73z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaMoon.svelte generated by Svelte v3.18.1 */

const FaMoon = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/md/MdLink.svelte generated by Svelte v3.18.1 */

const MdLink = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/gi/GiMale.svelte generated by Svelte v3.18.1 */

const GiMale = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M292.563 65.656v40h85.156l-81.658 82.656-12.937 13.125c-9.054-6.765-18.936-12.412-29.406-16.75-16.478-6.825-34.23-10.343-52.064-10.343-17.835 0-35.553 3.52-52.03 10.344-16.48 6.824-31.514 16.858-44.126 29.468-12.613 12.612-22.643 27.647-29.47 44.125-6.825 16.48-10.373 34.228-10.374 52.064 0 17.836 3.52 35.553 10.344 52.03 6.825 16.48 16.888 31.514 29.5 44.126 12.612 12.612 27.647 22.643 44.125 29.47 16.478 6.824 34.195 10.374 52.03 10.374 17.837 0 35.586-3.55 52.064-10.375 16.477-6.827 31.512-16.857 44.124-29.47 12.61-12.612 22.644-27.647 29.47-44.125 6.823-16.478 10.343-34.196 10.342-52.03 0-17.836-3.518-35.587-10.344-52.064-4.183-10.098-9.583-19.646-16.03-28.436l13.218-13.406 81.844-82.875v85.875h40V65.656H292.562zm-90.907 148.688c12.533 0 25.17 2.516 36.75 7.312 11.58 4.797 22.263 11.95 31.125 20.813 8.863 8.86 16.017 19.545 20.814 31.124 4.796 11.58 7.312 24.217 7.312 36.75 0 12.533-2.517 25.14-7.312 36.72-4.796 11.577-11.92 22.292-20.78 31.155-8.864 8.862-19.578 16.014-31.158 20.81-11.58 4.798-24.216 7.313-36.75 7.314-12.533 0-25.14-2.516-36.72-7.313-11.578-4.795-22.292-11.95-31.155-20.81-8.86-8.864-16.015-19.578-20.81-31.158-4.798-11.58-7.314-24.185-7.314-36.718 0-12.534 2.516-25.17 7.313-36.75l.093-.22c4.796-11.494 11.91-22.13 20.718-30.937 8.808-8.805 19.444-15.892 30.94-20.687l.218-.094c11.58-4.795 24.185-7.313 36.718-7.312z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/md/MdEdit.svelte generated by Svelte v3.18.1 */

const MdEdit = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaHeart.svelte generated by Svelte v3.18.1 */

const FaHeart = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"}"></path>
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

/* node_modules/svelte-icons/fa/FaShare.svelte generated by Svelte v3.18.1 */

const FaShare = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M503.691 189.836L327.687 37.851C312.281 24.546 288 35.347 288 56.015v80.053C127.371 137.907 0 170.1 0 322.326c0 61.441 39.581 122.309 83.333 154.132 13.653 9.931 33.111-2.533 28.077-18.631C66.066 312.814 132.917 274.316 288 272.085V360c0 20.7 24.3 31.453 39.687 18.164l176.004-152c11.071-9.562 11.086-26.753 0-36.328z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/md/MdCheck.svelte generated by Svelte v3.18.1 */

const MdCheck = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/gi/GiFemale.svelte generated by Svelte v3.18.1 */

const GiFemale = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M256 25.438c-17.84 0-35.582 3.547-52.063 10.375-16.48 6.827-31.512 16.853-44.125 29.468-12.612 12.617-22.645 27.675-29.468 44.157C123.52 125.92 119.994 143.66 120 161.5c.005 17.832 3.547 35.558 10.375 52.03 6.828 16.474 16.858 31.488 29.47 44.095 12.61 12.607 27.65 22.646 44.124 29.47l.218.092c10.032 4.135 20.52 7.02 31.218 8.657l.125 18.906.314 49.188H165.97v40h70.124l.375 62.875.124 20 40-.25-.125-20-.376-62.625h69.937v-40h-70.186l-.313-49.438-.124-18.47c11.188-1.61 22.154-4.6 32.625-8.936 16.476-6.823 31.515-16.862 44.126-29.47 12.61-12.606 22.64-27.62 29.47-44.093 6.827-16.472 10.37-34.198 10.374-52.03.005-17.84-3.52-35.58-10.344-52.063-6.823-16.482-16.856-31.54-29.47-44.156-12.61-12.614-27.643-22.64-44.123-29.468-16.48-6.827-34.224-10.374-52.063-10.374zm0 40c12.536 0 25.17 2.514 36.75 7.312 11.58 4.798 22.294 11.947 31.156 20.813 8.863 8.865 15.987 19.573 20.78 31.156 4.796 11.58 7.318 24.213 7.314 36.75-.004 12.53-2.515 25.173-7.313 36.75-4.797 11.575-11.95 22.264-20.812 31.124-8.862 8.86-19.58 16.018-31.156 20.812-11.58 4.795-24.19 7.28-36.72 7.28-12.53.002-25.14-2.485-36.72-7.28-11.576-4.794-22.293-11.953-31.155-20.812-8.862-8.86-16.015-19.55-20.813-31.125-4.797-11.577-7.308-24.22-7.312-36.75-.004-12.537 2.518-25.17 7.313-36.75 4.794-11.584 11.918-22.292 20.78-31.157 8.863-8.866 19.576-16.015 31.157-20.813 11.58-4.798 24.214-7.313 36.75-7.313z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/io/IoMdSend.svelte generated by Svelte v3.18.1 */

const IoMdSend = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M48 448l416-192L48 64v149.333L346 256 48 298.667z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/go/GoSearch.svelte generated by Svelte v3.18.1 */

const GoSearch = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 16 16" }, $$props), {}, {
		default: () => `
          <path d="${"M15.7 13.3l-3.81-3.83A5.93 5.93 0 0 0 13 6c0-3.31-2.69-6-6-6S1 2.69 1 6s2.69 6 6 6c1.3 0 2.48-.41 3.47-1.11l3.83 3.81c.19.2.45.3.7.3.25 0 .52-.09.7-.3a.996.996 0 0 0 0-1.41v.01zM7 10.7c-2.59 0-4.7-2.11-4.7-4.7 0-2.59 2.11-4.7 4.7-4.7 2.59 0 4.7 2.11 4.7 4.7 0 2.59-2.11 4.7-4.7 4.7z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/io/IoMdClose.svelte generated by Svelte v3.18.1 */

const IoMdClose = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaPhoneAlt.svelte generated by Svelte v3.18.1 */

const FaPhoneAlt = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"}"></path>
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

/* node_modules/svelte-icons/fa/FaRegSquare.svelte generated by Svelte v3.18.1 */

const FaRegSquare = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 448 512" }, $$props), {}, {
		default: () => `
          <path d="${"M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-6 400H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h340c3.3 0 6 2.7 6 6v340c0 3.3-2.7 6-6 6z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/ti/TiStarburst.svelte generated by Svelte v3.18.1 */

const TiStarburst = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M19.064 10.109l1.179-2.387c.074-.149.068-.327-.015-.471-.083-.145-.234-.238-.401-.249l-2.656-.172-.172-2.656c-.011-.167-.104-.317-.249-.401-.145-.084-.322-.09-.472-.015l-2.385 1.18-1.477-2.215c-.186-.278-.646-.278-.832 0l-1.477 2.215-2.385-1.18c-.151-.075-.327-.069-.472.015-.145.083-.238.234-.249.401l-.171 2.656-2.657.171c-.167.011-.318.104-.401.249-.084.145-.089.322-.015.472l1.179 2.386-2.214 1.477c-.139.093-.223.249-.223.416s.083.323.223.416l2.215 1.477-1.18 2.386c-.074.15-.068.327.015.472.083.144.234.238.401.248l2.656.171.171 2.657c.011.167.104.317.249.401.144.083.32.088.472.015l2.386-1.179 1.477 2.214c.093.139.249.223.416.223s.323-.083.416-.223l1.477-2.214 2.386 1.179c.15.073.327.068.472-.015s.238-.234.249-.401l.171-2.656 2.656-.172c.167-.011.317-.104.401-.249.083-.145.089-.322.015-.472l-1.179-2.385 2.214-1.478c.139-.093.223-.249.223-.416s-.083-.323-.223-.416l-2.214-1.475z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaDollarSign.svelte generated by Svelte v3.18.1 */

const FaDollarSign = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 288 512" }, $$props), {}, {
		default: () => `
          <path d="${"M209.2 233.4l-108-31.6C88.7 198.2 80 186.5 80 173.5c0-16.3 13.2-29.5 29.5-29.5h66.3c12.2 0 24.2 3.7 34.2 10.5 6.1 4.1 14.3 3.1 19.5-2l34.8-34c7.1-6.9 6.1-18.4-1.8-24.5C238 74.8 207.4 64.1 176 64V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48h-2.5C45.8 64-5.4 118.7.5 183.6c4.2 46.1 39.4 83.6 83.8 96.6l102.5 30c12.5 3.7 21.2 15.3 21.2 28.3 0 16.3-13.2 29.5-29.5 29.5h-66.3C100 368 88 364.3 78 357.5c-6.1-4.1-14.3-3.1-19.5 2l-34.8 34c-7.1 6.9-6.1 18.4 1.8 24.5 24.5 19.2 55.1 29.9 86.5 30v48c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-48.2c46.6-.9 90.3-28.6 105.7-72.7 21.5-61.6-14.6-124.8-72.5-141.7z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaCalendarAlt.svelte generated by Svelte v3.18.1 */

const FaCalendarAlt = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 448 512" }, $$props), {}, {
		default: () => `
          <path d="${"M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaCheckSquare.svelte generated by Svelte v3.18.1 */

const FaCheckSquare = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 448 512" }, $$props), {}, {
		default: () => `
          <path d="${"M400 480H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48v352c0 26.51-21.49 48-48 48zm-204.686-98.059l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.248-16.379-6.249-22.628 0L184 302.745l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.25 16.379 6.25 22.628.001z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/md/MdCloudUpload.svelte generated by Svelte v3.18.1 */

const MdCloudUpload = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/md/MdRemoveRedEye.svelte generated by Svelte v3.18.1 */

const MdRemoveRedEye = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"}"></path>
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

/* node_modules/svelte-icons/fa/FaLongArrowAltUp.svelte generated by Svelte v3.18.1 */

const FaLongArrowAltUp = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 256 512" }, $$props), {}, {
		default: () => `
          <path d="${"M88 166.059V468c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12V166.059h46.059c21.382 0 32.09-25.851 16.971-40.971l-86.059-86.059c-9.373-9.373-24.569-9.373-33.941 0l-86.059 86.059c-15.119 15.119-4.411 40.971 16.971 40.971H88z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaLongArrowAltDown.svelte generated by Svelte v3.18.1 */

const FaLongArrowAltDown = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 256 512" }, $$props), {}, {
		default: () => `
          <path d="${"M168 345.941V44c0-6.627-5.373-12-12-12h-56c-6.627 0-12 5.373-12 12v301.941H41.941c-21.382 0-32.09 25.851-16.971 40.971l86.059 86.059c9.373 9.373 24.569 9.373 33.941 0l86.059-86.059c15.119-15.119 4.411-40.971-16.971-40.971H168z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaLongArrowAltLeft.svelte generated by Svelte v3.18.1 */

const FaLongArrowAltLeft = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 448 512" }, $$props), {}, {
		default: () => `
          <path d="${"M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/fa/FaLongArrowAltRight.svelte generated by Svelte v3.18.1 */

const FaLongArrowAltRight = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 448 512" }, $$props), {}, {
		default: () => `
          <path d="${"M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/md/MdKeyboardArrowUp.svelte generated by Svelte v3.18.1 */

const MdKeyboardArrowUp = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/md/MdKeyboardArrowLeft.svelte generated by Svelte v3.18.1 */

const MdKeyboardArrowLeft = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/md/MdKeyboardArrowDown.svelte generated by Svelte v3.18.1 */

const MdKeyboardArrowDown = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/md/MdKeyboardArrowRight.svelte generated by Svelte v3.18.1 */

const MdKeyboardArrowRight = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 24 24" }, $$props), {}, {
		default: () => `
          <path d="${"M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/io/IoIosCheckmarkCircle.svelte generated by Svelte v3.18.1 */

const IoIosCheckmarkCircle = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm106.5 150.5L228.8 332.8h-.1c-1.7 1.7-6.3 5.5-11.6 5.5-3.8 0-8.1-2.1-11.7-5.7l-56-56c-1.6-1.6-1.6-4.1 0-5.7l17.8-17.8c.8-.8 1.8-1.2 2.8-1.2 1 0 2 .4 2.8 1.2l44.4 44.4 122-122.9c.8-.8 1.8-1.2 2.8-1.2 1.1 0 2.1.4 2.8 1.2l17.5 18.1c1.8 1.7 1.8 4.2.2 5.8z"}"></path>
        `
	})}`;
});

/* node_modules/svelte-icons/io/IoIosCloseCircleOutline.svelte generated by Svelte v3.18.1 */

const IoIosCloseCircleOutline = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(IconBase, "IconBase").$$render($$result, Object.assign({ viewBox: "0 0 512 512" }, $$props), {}, {
		default: () => `
          <path d="${"M331.3 308.7L278.6 256l52.7-52.7c6.2-6.2 6.2-16.4 0-22.6-6.2-6.2-16.4-6.2-22.6 0L256 233.4l-52.7-52.7c-6.2-6.2-15.6-7.1-22.6 0-7.1 7.1-6 16.6 0 22.6l52.7 52.7-52.7 52.7c-6.7 6.7-6.4 16.3 0 22.6 6.4 6.4 16.4 6.2 22.6 0l52.7-52.7 52.7 52.7c6.2 6.2 16.4 6.2 22.6 0 6.3-6.2 6.3-16.4 0-22.6z"}"></path>
<path d="${"M256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256s-18.7 93.3-52.7 127.3S304.1 436 256 436c-48.1 0-93.3-18.7-127.3-52.7S76 304.1 76 256s18.7-93.3 52.7-127.3S207.9 76 256 76m0-28C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z"}"></path>
        `
	})}`;
});

var icons = {
    email: FaAt,
    edit: MdEdit,
    link: MdLink,
    moon: FaMoon,
    male: GiMale,
    send: IoMdSend,
    share: FaShare,
    heart: FaHeart,
    viber: FaViber,
    close: IoMdClose,
    box: FaRegSquare,
    search: GoSearch,
    female: GiFemale,
    phone: FaPhoneAlt,
    coin: FaDollarSign,
    eye: MdRemoveRedEye,
    polygon: TiStarburst,
    facebook: FaFacebookF,
    upload: MdCloudUpload,
    'check-flag': MdCheck,
    calendar: FaCalendarAlt,
    location: FaMapMarkerAlt,
    telegram: FaTelegramPlane,
    'box-checked': FaCheckSquare,
    'arrow-up': FaLongArrowAltUp,
    'arrow-left': FaLongArrowAltLeft,
    'arrow-down': FaLongArrowAltDown,
    'arrow-right': FaLongArrowAltRight,
    'caret-up': MdKeyboardArrowUp,
    'caret-left': MdKeyboardArrowLeft,
    'caret-down': MdKeyboardArrowDown,
    'caret-right': MdKeyboardArrowRight,
    'checked-circle': IoIosCheckmarkCircle,
    'cancel-circle': IoIosCloseCircleOutline,
};

/**
 *
 * @description API URLs builders.
 */
var endpoints = {
    USER: (id) => `user.json`,
    USERS: () => `users.json`,

    RECENT: (id) => `recent.json`,
    RECENTS: () => `recents.json`,

    COMMENT: (id) => `comment.json`,
    COMMENTS: () => `comments.json`,

    FUND: (id) => `fund.json`,
    FUNDS: () => `funds.json`,

    ORGANIZATION: (id) => `organization.json`,
    ORGANIZATIONS: () => `organizations.json`,
};
// export default {
//     USER: (id) => `apiusers/${id || ':id'}`,
//     USERS: () => `apiusers`,
//
//     RECENT: (id) => `apirecents/${id || ':id'}`,
//     RECENTS: () => `apirecents`,
//
//     COMMENT: (id) => `apicomments/${id || ':id'}`,
//     COMMENTS: () => `apicomments`,
//
//     FUND: (id) => `apifunds/${id || ':id'}`,
//     FUNDS: () => `apifunds`,
//
//     ORGANIZATION: (id) => `apiorganizations/${id || ':id'}`,
//     ORGANIZATIONS: () => `apiorganizations`,
// }

const vaccinations = [
    {
        text: 'Від кліщів',
        value: 'from-fungi'
    },
    {
        text: 'Від сказу',
        value: 'from-rabies'
    },
    {
        text: 'Від парагрипу',
        value: 'from-parainfluenza'
    },
    {
        text: 'Від чуми м\'ясоїдних',
        value: 'from-carnivorous-plague'
    },
    {
        text: 'Від парвовіроз',
        value: 'from-parvovirus'
    },
    {
        text: 'Від аденовіроз',
        value: 'from-adenovirus'
    },
    {
        text: 'Від лептоспіроз',
        value: 'from-leptospirosis'
    },
];

/* src/components/Icon.svelte generated by Svelte v3.18.1 */

const css$2 = {
	code: ".ico.svelte-j3awhg{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;-ms-flex-item-align:stretch;align-self:stretch;display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;vertical-align:middle}.ico.svelte-j3awhg:not(.custom){color:rgba(var(--theme-svg-fill))}.tiny.svelte-j3awhg{width:13px;height:13px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}.small.svelte-j3awhg{width:18px;height:18px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}.medium.svelte-j3awhg{width:24px;height:24px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}.big.svelte-j3awhg{width:30px;height:30px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}.large.svelte-j3awhg{width:40px;height:40px;-webkit-box-flex:0;-ms-flex:none;flex:none;-ms-flex-item-align:auto;align-self:auto}.ico.primary.svelte-j3awhg{color:rgb(var(--color-success))}.ico.danger.svelte-j3awhg{color:rgb(var(--color-danger))}.ico.info.svelte-j3awhg{color:rgb(var(--color-info))}.ico.light.svelte-j3awhg{color:rgb(var(--color-white))}.ico.dark.svelte-j3awhg{color:rgb(var(--color-black))}",
	map: "{\"version\":3,\"file\":\"Icon.svelte\",\"sources\":[\"Icon.svelte\"],\"sourcesContent\":[\"<script>\\n    /**\\n     * @info see more icons: https://www.svelte-icons.gibdig.com/\\n     */\\n    import { classnames, toCSSString } from '@utils'\\n    import { icons } from '@config'\\n\\n\\n    export let type\\n    export let is = null // primary|info|danger|light|dark\\n    export let size = null // small|medium|big\\n    export let rotate = 0\\n    export let style = undefined\\n    export let id = undefined\\n    export let title = undefined\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n    let styleProp = toCSSString({ transform: !!rotate ? `rotateZ(${rotate}deg)` : null, ...style })\\n\\n    $: classProp = classnames('ico', is, size, $$props.class)\\n</script>\\n\\n<i {id} title={titleProp} style={styleProp} class={classProp}>\\n    <svelte:component this={icons[type]}/>\\n</i>\\n\\n<style>\\n    .ico {\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        display: -webkit-inline-box;\\n        display: -ms-inline-flexbox;\\n        display: inline-flex;\\n        vertical-align: middle;\\n    }\\n\\n    .ico:not(.custom) {\\n        color: rgba(var(--theme-svg-fill));\\n    }\\n\\n    /* ------------=========( Size )=========------------ */\\n    .tiny {\\n        width: 13px;\\n        height: 13px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    .small {\\n        width: 18px;\\n        height: 18px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    .medium {\\n        width: 24px;\\n        height: 24px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    .big {\\n        width: 30px;\\n        height: 30px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    .large {\\n        width: 40px;\\n        height: 40px;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        -ms-flex-item-align: auto;\\n            align-self: auto;\\n    }\\n\\n    /* ------------=========( Color )=========------------ */\\n    .ico.primary {\\n        color: rgb(var(--color-success));\\n    }\\n\\n    .ico.danger {\\n        color: rgb(var(--color-danger));\\n    }\\n\\n    .ico.info {\\n        color: rgb(var(--color-info));\\n    }\\n\\n    .ico.light {\\n        color: rgb(var(--color-white));\\n    }\\n\\n    .ico.dark {\\n        color: rgb(var(--color-black));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0ljb24uc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG1CQUFZO1lBQVosb0JBQVk7Z0JBQVosWUFBWTtRQUNaLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsMkJBQW9CO1FBQXBCLDJCQUFvQjtRQUFwQixvQkFBb0I7UUFDcEIsc0JBQXNCO0lBQzFCOztJQUVBO1FBQ0ksa0NBQWtDO0lBQ3RDOztJQUVBLHVEQUF1RDtJQUN2RDtRQUNJLFdBQVc7UUFDWCxZQUFZO1FBQ1osbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVix5QkFBZ0I7WUFBaEIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksV0FBVztRQUNYLFlBQVk7UUFDWixtQkFBVTtZQUFWLGNBQVU7Z0JBQVYsVUFBVTtRQUNWLHlCQUFnQjtZQUFoQixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsWUFBWTtRQUNaLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YseUJBQWdCO1lBQWhCLGdCQUFnQjtJQUNwQjs7SUFFQTtRQUNJLFdBQVc7UUFDWCxZQUFZO1FBQ1osbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVix5QkFBZ0I7WUFBaEIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksV0FBVztRQUNYLFlBQVk7UUFDWixtQkFBVTtZQUFWLGNBQVU7Z0JBQVYsVUFBVTtRQUNWLHlCQUFnQjtZQUFoQixnQkFBZ0I7SUFDcEI7O0lBRUEsd0RBQXdEO0lBQ3hEO1FBQ0ksZ0NBQWdDO0lBQ3BDOztJQUVBO1FBQ0ksK0JBQStCO0lBQ25DOztJQUVBO1FBQ0ksNkJBQTZCO0lBQ2pDOztJQUVBO1FBQ0ksOEJBQThCO0lBQ2xDOztJQUVBO1FBQ0ksOEJBQThCO0lBQ2xDIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL0ljb24uc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLmljbyB7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XG4gICAgfVxuXG4gICAgLmljbzpub3QoLmN1c3RvbSkge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS10aGVtZS1zdmctZmlsbCkpO1xuICAgIH1cblxuICAgIC8qIC0tLS0tLS0tLS0tLT09PT09PT09PSggU2l6ZSApPT09PT09PT09LS0tLS0tLS0tLS0tICovXG4gICAgLnRpbnkge1xuICAgICAgICB3aWR0aDogMTNweDtcbiAgICAgICAgaGVpZ2h0OiAxM3B4O1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBhbGlnbi1zZWxmOiBhdXRvO1xuICAgIH1cblxuICAgIC5zbWFsbCB7XG4gICAgICAgIHdpZHRoOiAxOHB4O1xuICAgICAgICBoZWlnaHQ6IDE4cHg7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGFsaWduLXNlbGY6IGF1dG87XG4gICAgfVxuXG4gICAgLm1lZGl1bSB7XG4gICAgICAgIHdpZHRoOiAyNHB4O1xuICAgICAgICBoZWlnaHQ6IDI0cHg7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGFsaWduLXNlbGY6IGF1dG87XG4gICAgfVxuXG4gICAgLmJpZyB7XG4gICAgICAgIHdpZHRoOiAzMHB4O1xuICAgICAgICBoZWlnaHQ6IDMwcHg7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGFsaWduLXNlbGY6IGF1dG87XG4gICAgfVxuXG4gICAgLmxhcmdlIHtcbiAgICAgICAgd2lkdGg6IDQwcHg7XG4gICAgICAgIGhlaWdodDogNDBweDtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgYWxpZ24tc2VsZjogYXV0bztcbiAgICB9XG5cbiAgICAvKiAtLS0tLS0tLS0tLS09PT09PT09PT0oIENvbG9yICk9PT09PT09PT0tLS0tLS0tLS0tLS0gKi9cbiAgICAuaWNvLnByaW1hcnkge1xuICAgICAgICBjb2xvcjogcmdiKHZhcigtLWNvbG9yLXN1Y2Nlc3MpKTtcbiAgICB9XG5cbiAgICAuaWNvLmRhbmdlciB7XG4gICAgICAgIGNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuXG4gICAgLmljby5pbmZvIHtcbiAgICAgICAgY29sb3I6IHJnYih2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuXG4gICAgLmljby5saWdodCB7XG4gICAgICAgIGNvbG9yOiByZ2IodmFyKC0tY29sb3Itd2hpdGUpKTtcbiAgICB9XG5cbiAgICAuaWNvLmRhcmsge1xuICAgICAgICBjb2xvcjogcmdiKHZhcigtLWNvbG9yLWJsYWNrKSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AA6BI,IAAI,cAAC,CAAC,AACF,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,WAAW,CACpB,cAAc,CAAE,MAAM,AAC1B,CAAC,AAED,kBAAI,KAAK,OAAO,CAAC,AAAC,CAAC,AACf,KAAK,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACtC,CAAC,AAGD,KAAK,cAAC,CAAC,AACH,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC,AAED,MAAM,cAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC,AAED,OAAO,cAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC,AAED,IAAI,cAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC,AAED,MAAM,cAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,mBAAmB,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,AACxB,CAAC,AAGD,IAAI,QAAQ,cAAC,CAAC,AACV,KAAK,CAAE,IAAI,IAAI,eAAe,CAAC,CAAC,AACpC,CAAC,AAED,IAAI,OAAO,cAAC,CAAC,AACT,KAAK,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AACnC,CAAC,AAED,IAAI,KAAK,cAAC,CAAC,AACP,KAAK,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AACjC,CAAC,AAED,IAAI,MAAM,cAAC,CAAC,AACR,KAAK,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,AAClC,CAAC,AAED,IAAI,KAAK,cAAC,CAAC,AACP,KAAK,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,AAClC,CAAC\"}"
};

const Icon = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { type } = $$props;
	let { is = null } = $$props; // primary|info|danger|light|dark
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

	return `<i${add_attribute("id", id, 0)}${add_attribute("title", titleProp, 0)}${add_attribute("style", styleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-j3awhg"}">
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
const { readable, writable: writable$1, derived, get: get$1 } = generator(storage);

const organization = writable$1('organization', null);
const organizations = writable$1('organizations', null);

/* src/components/Portal.svelte generated by Svelte v3.18.1 */

const css$4 = {
	code: ".portal-clone.svelte-qh8j7n{display:none}",
	map: "{\"version\":3,\"file\":\"Portal.svelte\",\"sources\":[\"Portal.svelte\"],\"sourcesContent\":[\"<script>\\n  import { onMount } from \\\"svelte\\\";\\n\\n  export let off\\n\\n  let ref;\\n  let portal;\\n\\n  onMount(off ? (() => {}) : (() => {\\n    portal = document.createElement(\\\"div\\\");\\n    portal.className = \\\"portal\\\";\\n    portal.appendChild(ref);\\n    document.body.appendChild(portal);\\n    return () => document.body.removeChild(portal)\\n  }));\\n\\n</script>\\n\\n{#if off}\\n  <slot />\\n{:else}\\n  <div class=\\\"portal-clone\\\">\\n      <div bind:this={ref}>\\n          <slot />\\n      </div>\\n  </div>\\n{/if}\\n\\n<style>\\n  .portal-clone {\\n    display: none;\\n  }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL1BvcnRhbC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtFQUNFO0lBQ0UsYUFBYTtFQUNmIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL1BvcnRhbC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgLnBvcnRhbC1jbG9uZSB7XG4gICAgZGlzcGxheTogbm9uZTtcbiAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AA6BE,aAAa,cAAC,CAAC,AACb,OAAO,CAAE,IAAI,AACf,CAAC\"}"
};

const Portal = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { off } = $$props;
	let ref;
	let portal;

	onMount(off
	? () => {
			
		}
	: () => {
			portal = document.createElement("div");
			portal.className = "portal";
			portal.appendChild(ref);
			document.body.appendChild(portal);
			return () => document.body.removeChild(portal);
		});

	if ($$props.off === void 0 && $$bindings.off && off !== void 0) $$bindings.off(off);
	$$result.css.add(css$4);

	return `${off
	? `${$$slots.default ? $$slots.default({}) : ``}`
	: `<div class="${"portal-clone svelte-qh8j7n"}">
      <div${add_attribute("this", ref, 1)}>
          ${$$slots.default ? $$slots.default({}) : ``}
      </div>
  </div>`}`;
});

/* src/components/Modal.svelte generated by Svelte v3.18.1 */

const css$5 = {
	code: ".modal.svelte-1pzxwn8.svelte-1pzxwn8{z-index:8;position:fixed;top:0;left:0;width:100%;height:100%;display:-webkit-box;display:-ms-flexbox;display:flex;overflow-x:hidden;overflow-y:auto;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-ms-touch-action:manipulation;touch-action:manipulation;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:rgba(var(--color-black), .75);outline:150px solid rgba(var(--color-black), .75);-webkit-transition-timing-function:ease-out;transition-timing-function:ease-out;opacity:0;pointer-events:none}.modal.active.svelte-1pzxwn8.svelte-1pzxwn8,.modal-header.active.svelte-1pzxwn8.svelte-1pzxwn8{opacity:1;pointer-events:auto}.modal-inner.svelte-1pzxwn8.svelte-1pzxwn8{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch;overflow:hidden;-webkit-transform:translateZ(0);transform:translateZ(0);background-color:rgba(var(--theme-color-primary))}.small.svelte-1pzxwn8 .modal-inner.svelte-1pzxwn8{width:200px;border-radius:var(--border-radius-big)}.medium.svelte-1pzxwn8 .modal-inner.svelte-1pzxwn8{width:calc(100vw - var(--screen-padding) * 2);border-radius:var(--border-radius-big)}.big.svelte-1pzxwn8 .modal-inner.svelte-1pzxwn8{width:calc(100% - var(--screen-padding) * 2);height:calc(100% - var(--screen-padding) * 2);border-radius:var(--border-radius-big)}.full.svelte-1pzxwn8.svelte-1pzxwn8{-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch}.full.svelte-1pzxwn8 .modal-inner.svelte-1pzxwn8{-webkit-box-flex:0;-ms-flex:none;flex:none;width:100%;min-height:100%;border-radius:0}.modal-header.svelte-1pzxwn8.svelte-1pzxwn8{-webkit-transform:translateZ(0);transform:translateZ(0);z-index:9;position:fixed;top:0;left:0;width:100%;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;color:rgb(var(--color-white));background-color:rgb(var(--color-info));opacity:0;pointer-events:none;-webkit-transform-origin:50% 50vh;transform-origin:50% 50vh}.modal-header-relative.svelte-1pzxwn8.svelte-1pzxwn8{-webkit-transform:translateZ(0);transform:translateZ(0);z-index:9;position:relative;width:100%;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;color:rgb(var(--color-white));background-color:rgb(var(--color-info))}.modal-header.svelte-1pzxwn8 .close.svelte-1pzxwn8,.modal-header-relative.svelte-1pzxwn8 .close.svelte-1pzxwn8{font-size:24px;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:50px;height:60px}",
	map: "{\"version\":3,\"file\":\"Modal.svelte\",\"sources\":[\"Modal.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, tick } from 'svelte'\\n    import { fly } from \\\"svelte/transition\\\";\\n    import { Swipe } from '@services'\\n    import { safeGet, classnames, delay, bodyScroll, stopPropagationInRanges } from \\\"@utils\\\";\\n    import { modals } from \\\"@store\\\";\\n    import Portal from \\\"./Portal.svelte\\\";\\n    import Br from \\\"./Br.svelte\\\";\\n    import Icon from \\\"./Icon.svelte\\\";\\n\\n    const dispatch = createEventDispatcher()\\n    \\n    const DURATION = 250\\n    const THRESHOLD = 50\\n    const SWIPE_SPEED = .5\\n    const THRESHOLD_RANGES = { x: [0, 100], y: [1, 99] }\\n    const START_POSITION = {\\n        x: 50,\\n        y: 0\\n    }\\n\\n    export let id\\n    export let ref = null\\n    export let size = 'full'    // small/medium/big/full\\n    export let swipe = []       // up down left right all\\n    export let title = 'Закрити'\\n    export let open = null\\n    export let startPosition = START_POSITION\\n    export let blockBody = true\\n    export let withHeader = true\\n\\n    let active\\n    let refHeader\\n    let isBodyBlocked = false\\n    let isAllowed = {\\n        up: true,\\n        down: false,\\n        left: true,\\n        right: true,\\n    }\\n\\n    $: isSwipe = {\\n        up: safeGet(() => swipe.includes('up') || swipe.includes('all')),\\n        down: safeGet(() => swipe.includes('down') || swipe.includes('all')),\\n        left: safeGet(() => swipe.includes('left') || swipe.includes('all')),\\n        right: safeGet(() => swipe.includes('right') || swipe.includes('all')),\\n    }\\n    $: scrollY = ref && ref.scrollTop\\n    $: active = safeGet(() => open !== null ? open : $modals[`modal-${id}`].open, null)\\n    $: classProp = classnames('modal', size, { active })\\n    $: onActiveChange(active)\\n    $: blockScroll(ref)\\n\\n    function blockScroll(modal) {\\n        if (blockBody && active && !isBodyBlocked) {\\n            bodyScroll.disableScroll(modal, { extraLock: size === 'full' });\\n            isBodyBlocked = true\\n            modal && (modal.scrollTop = 0)\\n            isAllowed = {\\n                up: true,\\n                down: false,\\n                left: true,\\n                right: true,\\n            }\\n        } else if (blockBody && !active && isBodyBlocked) {\\n            bodyScroll.enableScroll(modal, { extraLock: size === 'full' });\\n            isBodyBlocked = false\\n        }\\n    }\\n\\n    async function onActiveChange(active) {\\n        if (active) {\\n            setDuration(ref, DURATION)\\n            setDuration(refHeader, DURATION)\\n            setTimeout(() => setDuration(ref, 0), DURATION)\\n            setTimeout(() => setDuration(refHeader, 0), DURATION)\\n            drawTransform(ref, 0, 0)\\n            drawTransform(refHeader, 0, 0)\\n            drawOpacity(ref, 0, 0)\\n            drawOpacity(refHeader, 0, 0)\\n            blockScroll(ref)\\n            await tick()\\n            dispatch('open')\\n        } else {\\n            blockScroll(ref)\\n            await tick()\\n            dispatch('close')\\n        }\\n    }\\n\\n    function setActive(isActive) {\\n        if (open !== null) open = isActive\\n        modals.update(s => ({ ...s, [`modal-${id}`]: { open: isActive } }))\\n    }\\n\\n    let xSwipe = 0\\n    let ySwipe = 0\\n\\n    function addSwipe(el) {\\n        stopPropagationInRanges(el, THRESHOLD_RANGES, ({ x, y }) => {\\n            isAllowed = {\\n                up: y <= THRESHOLD_RANGES.y[0],\\n                down: y >= THRESHOLD_RANGES.y[1],\\n                left: x <= THRESHOLD_RANGES.x[0] || x >= THRESHOLD_RANGES.x[1],\\n                right: x <= THRESHOLD_RANGES.x[0] || x >= THRESHOLD_RANGES.x[1],\\n            } \\n        })\\n\\n        new Swipe(el)\\n                .run()\\n                .onUp(isSwipe.up ? handleVerticalSwipe : null)\\n                .onDown(isSwipe.down ? handleVerticalSwipe : null)\\n                .onLeft(isSwipe.left ? handleHorizontalSwipe : null)\\n                .onRight(isSwipe.right ? handleHorizontalSwipe : null)\\n                .onTouchEnd(async () => {\\n                    const shift = 50\\n\\n                    if (xSwipe > THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        setActive(false)\\n                        drawOpacity(el, xSwipe + shift, ySwipe)\\n                        drawOpacity(refHeader, xSwipe + shift, ySwipe)\\n                        drawTransform(el, xSwipe + shift, ySwipe)\\n                        drawTransform(refHeader, xSwipe + shift, ySwipe)\\n                        await delay(DURATION)\\n                    } else if (xSwipe < -THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        setActive(false)\\n                        drawOpacity(el, xSwipe - shift, ySwipe)\\n                        drawOpacity(refHeader, xSwipe - shift, ySwipe)\\n                        drawTransform(el, xSwipe - shift, ySwipe)\\n                        drawTransform(refHeader, xSwipe - shift, ySwipe)\\n                        await delay(DURATION)\\n                    }\\n                    \\n                    if (ySwipe > THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        setActive(false)\\n                        drawOpacity(el, xSwipe, ySwipe + shift)\\n                        drawOpacity(refHeader, xSwipe, ySwipe + shift)\\n                        drawTransform(el, xSwipe, ySwipe + shift)\\n                        drawTransform(refHeader, xSwipe, ySwipe + shift)\\n                        await delay(DURATION)\\n                    } else if (ySwipe < -THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        setActive(false)\\n                        drawOpacity(el, xSwipe, ySwipe - shift)\\n                        drawOpacity(refHeader, xSwipe, ySwipe - shift)\\n                        drawTransform(el, xSwipe, ySwipe - shift)\\n                        drawTransform(refHeader, xSwipe, ySwipe - shift)\\n                        await delay(DURATION)\\n                    }\\n\\n                    if (xSwipe <= THRESHOLD && xSwipe >= -THRESHOLD && ySwipe <= THRESHOLD && ySwipe >= -THRESHOLD) {\\n                        setDuration(el, DURATION)\\n                        setDuration(refHeader, DURATION)\\n                        setTimeout(() => setDuration(el, 0), DURATION)\\n                        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n                        drawTransform(el, 0, 0)\\n                        drawTransform(refHeader, 0, 0)\\n                    } else {\\n                        setStartPosition()\\n                    }\\n\\n                    xSwipe = 0\\n                    ySwipe = 0\\n                    el && (el.style.opacity = null)\\n                    refHeader && (refHeader.style.opacity = null)\\n                })\\n    }\\n\\n    function handleVerticalSwipe(yDown, yUp, evt, el) {\\n        const dir = yUp - yDown\\n        if (!isAllowed.up && dir > 0 || !isAllowed.down && dir < 0) return\\n        ySwipe = dir * SWIPE_SPEED\\n        drawTransform(el, xSwipe, ySwipe)\\n        drawTransform(refHeader, xSwipe, ySwipe)\\n        drawOpacity(el, xSwipe, ySwipe)\\n        drawOpacity(refHeader, xSwipe, ySwipe)\\n    }\\n    function handleHorizontalSwipe(xDown, xUp, evt, el) {\\n        const dir = xUp - xDown\\n        if (!isAllowed.left && dir > 0 || !isAllowed.right && dir < 0) return\\n        xSwipe = dir * SWIPE_SPEED\\n        drawTransform(el, xSwipe, ySwipe)\\n        drawTransform(refHeader, xSwipe, ySwipe)\\n        drawOpacity(el, xSwipe, ySwipe)\\n        drawOpacity(refHeader, xSwipe, ySwipe)\\n    }\\n\\n    function setStartPosition() {\\n        drawTransform(ref, startPosition.x, startPosition.y)\\n        drawTransform(refHeader, startPosition.x, startPosition.y)\\n    }\\n\\n    function drawTransform(el, x, y) {\\n        const delta = Math.abs(x) > Math.abs(y) ? x : y\\n        let scale = 1 - Math.abs(delta / window.innerHeight)\\n        el && (el.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${x}, ${y})`)\\n    }\\n     function setDuration(el, ms) {\\n        el && (el.style.transitionDuration = `${ms}ms`)\\n    }\\n    function drawOpacity(el, x, y) {\\n        const delta = Math.abs(x) > Math.abs(y) ? x : y\\n        el && (el.style.opacity = 1 - Math.min(Math.abs(delta / (THRESHOLD * 1.5)), 1))\\n    }\\n\\n    function appear(node, params) {\\n        if (!active) return\\n\\t\\tconst existingTransform = getComputedStyle(node).transform.replace('none', '');\\n        const getScale = t => .9 + .1 * t\\n        const getX = t => startPosition.x - startPosition.x * t\\n\\t\\treturn {\\n\\t\\t\\tduration: DURATION,\\n\\t\\t\\tcss: (t) => `opacity: ${t}; transform: matrix(${getScale(t)}, 0, 0, ${getScale(t)}, ${getX(t)}, 0)`\\n\\t\\t};\\n    }\\n\\n    function onCloseModal() {\\n        setDuration(ref, DURATION)\\n        setDuration(refHeader, DURATION)\\n        setTimeout(() => setDuration(ref, 0), DURATION)\\n        setTimeout(() => setDuration(refHeader, 0), DURATION)\\n        setStartPosition()\\n        drawOpacity(ref, startPosition.x * 2, startPosition.y)\\n        drawOpacity(refHeader, startPosition.x * 2, startPosition.y)\\n        setTimeout(() => setActive(false), DURATION)\\n    }\\n</script>\\n\\n{#if active !== null}\\n    <Portal>\\n        <div\\n            id={`modal-${id}`}\\n            bind:this={ref}\\n            aria-hidden=\\\"true\\\" \\n            class={classProp}\\n            use:addSwipe\\n            in:appear\\n            on:click={setActive.bind(null, false)}\\n        >\\n            {#if withHeader && size === 'full'}\\n                <Portal>\\n                    <slot name=\\\"header\\\">\\n                        <button \\n                            type=\\\"button\\\"\\n                            class={classnames('modal-header', { active })}\\n                            in:appear\\n                            bind:this={refHeader}\\n                            on:click={onCloseModal}\\n                        >\\n                            <h2 style=\\\"padding: 15px\\\">{ title }</h2>\\n                            <span class=\\\"close\\\">\\n                                 <Icon type=\\\"close\\\" size=\\\"big\\\" is=\\\"light\\\"/>\\n                            </span>\\n                        </button>\\n                    </slot>\\n                </Portal>   \\n                <Br size=\\\"60\\\"/>\\n            {/if}\\n            <div\\n                class=\\\"modal-inner\\\"\\n                tabindex=\\\"-1\\\"\\n                role=\\\"dialog\\\"\\n                aria-modal=\\\"true\\\"\\n                aria-labelledby=\\\"модальне вікно\\\"\\n                on:click={e => e.stopPropagation()}\\n            >\\n                {#if withHeader && size !== 'full'}\\n                    <slot name=\\\"header\\\">\\n                        <button\\n                                type=\\\"button\\\"\\n                                class={classnames('modal-header-relative active')}\\n                                in:appear\\n                                on:click={onCloseModal}\\n                        >\\n                            <h2 style=\\\"padding: 15px\\\">{ title }</h2>\\n                            <span class=\\\"close\\\">\\n                                 <Icon type=\\\"close\\\" size=\\\"big\\\" is=\\\"light\\\"/>\\n                            </span>\\n                        </button>\\n                    </slot>\\n                {/if}\\n                <slot props={safeGet(() => $modals[`modal-${id}`], {}, true)}/>\\n            </div>\\n        </div>\\n    </Portal>\\n{/if}\\n\\n<style>\\n    .modal {\\n        z-index: 8;\\n        position: fixed;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow-x: hidden;\\n        overflow-y: auto;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        -ms-touch-action: manipulation;\\n            touch-action: manipulation;\\n        -webkit-user-select: none;\\n           -moz-user-select: none;\\n            -ms-user-select: none;\\n                user-select: none;\\n        background-color: rgba(var(--color-black), .75);\\n        outline: 150px solid rgba(var(--color-black), .75);\\n        -webkit-transition-timing-function: ease-out;\\n                transition-timing-function: ease-out;\\n        opacity: 0;\\n        pointer-events: none;\\n    }\\n\\n    .modal.active, .modal-header.active {\\n        opacity: 1;\\n        pointer-events: auto;\\n    }\\n\\n    .modal-inner {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n        overflow: hidden;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n        background-color: rgba(var(--theme-color-primary));\\n    }\\n    .small .modal-inner {\\n        width: 200px;\\n        border-radius: var(--border-radius-big);\\n    }\\n\\n    .medium .modal-inner {\\n        width: calc(100vw - var(--screen-padding) * 2);\\n        border-radius: var(--border-radius-big);\\n    }\\n    .big .modal-inner {\\n        width: calc(100% - var(--screen-padding) * 2);\\n        height: calc(100% - var(--screen-padding) * 2);\\n        border-radius: var(--border-radius-big);\\n    }\\n\\n    .full {\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n    }\\n\\n    .full .modal-inner {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        width: 100%;\\n        min-height: 100%;\\n        border-radius: 0;\\n    }\\n\\n    .modal-header {\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n        z-index: 9;\\n        position: fixed;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: justify;\\n            -ms-flex-pack: justify;\\n                justify-content: space-between;\\n        color: rgb(var(--color-white));\\n        background-color: rgb(var(--color-info));\\n        opacity: 0;\\n        pointer-events: none;\\n        -webkit-transform-origin: 50% 50vh;\\n                transform-origin: 50% 50vh;\\n    }\\n\\n    .modal-header-relative {\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n        z-index: 9;\\n        position: relative;\\n        width: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: justify;\\n            -ms-flex-pack: justify;\\n                justify-content: space-between;\\n        color: rgb(var(--color-white));\\n        background-color: rgb(var(--color-info));\\n    }\\n\\n    .modal-header .close,\\n    .modal-header-relative .close {\\n        font-size: 24px;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 50px;\\n        height: 60px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL01vZGFsLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxVQUFVO1FBQ1YsZUFBZTtRQUNmLE1BQU07UUFDTixPQUFPO1FBQ1AsV0FBVztRQUNYLFlBQVk7UUFDWixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLGtCQUFrQjtRQUNsQixnQkFBZ0I7UUFDaEIseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2Qiw0QkFBc0I7UUFBdEIsNkJBQXNCO1lBQXRCLDBCQUFzQjtnQkFBdEIsc0JBQXNCO1FBQ3RCLDhCQUEwQjtZQUExQiwwQkFBMEI7UUFDMUIseUJBQWlCO1dBQWpCLHNCQUFpQjtZQUFqQixxQkFBaUI7Z0JBQWpCLGlCQUFpQjtRQUNqQiwrQ0FBK0M7UUFDL0Msa0RBQWtEO1FBQ2xELDRDQUFvQztnQkFBcEMsb0NBQW9DO1FBQ3BDLFVBQVU7UUFDVixvQkFBb0I7SUFDeEI7O0lBRUE7UUFDSSxVQUFVO1FBQ1Ysb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYiw0QkFBc0I7UUFBdEIsNkJBQXNCO1lBQXRCLDBCQUFzQjtnQkFBdEIsc0JBQXNCO1FBQ3RCLDBCQUFvQjtZQUFwQix1QkFBb0I7Z0JBQXBCLG9CQUFvQjtRQUNwQix5QkFBd0I7WUFBeEIsc0JBQXdCO2dCQUF4Qix3QkFBd0I7UUFDeEIsZ0JBQWdCO1FBQ2hCLGdDQUF3QjtnQkFBeEIsd0JBQXdCO1FBQ3hCLGtEQUFrRDtJQUN0RDtJQUNBO1FBQ0ksWUFBWTtRQUNaLHVDQUF1QztJQUMzQzs7SUFFQTtRQUNJLDhDQUE4QztRQUM5Qyx1Q0FBdUM7SUFDM0M7SUFDQTtRQUNJLDZDQUE2QztRQUM3Qyw4Q0FBOEM7UUFDOUMsdUNBQXVDO0lBQzNDOztJQUVBO1FBQ0ksMEJBQW9CO1lBQXBCLHVCQUFvQjtnQkFBcEIsb0JBQW9CO1FBQ3BCLHlCQUF3QjtZQUF4QixzQkFBd0I7Z0JBQXhCLHdCQUF3QjtJQUM1Qjs7SUFFQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsV0FBVztRQUNYLGdCQUFnQjtRQUNoQixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxnQ0FBd0I7Z0JBQXhCLHdCQUF3QjtRQUN4QixVQUFVO1FBQ1YsZUFBZTtRQUNmLE1BQU07UUFDTixPQUFPO1FBQ1AsV0FBVztRQUNYLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHlCQUE4QjtZQUE5QixzQkFBOEI7Z0JBQTlCLDhCQUE4QjtRQUM5Qiw4QkFBOEI7UUFDOUIsd0NBQXdDO1FBQ3hDLFVBQVU7UUFDVixvQkFBb0I7UUFDcEIsa0NBQTBCO2dCQUExQiwwQkFBMEI7SUFDOUI7O0lBRUE7UUFDSSxnQ0FBd0I7Z0JBQXhCLHdCQUF3QjtRQUN4QixVQUFVO1FBQ1Ysa0JBQWtCO1FBQ2xCLFdBQVc7UUFDWCxvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLHlCQUFtQjtZQUFuQixzQkFBbUI7Z0JBQW5CLG1CQUFtQjtRQUNuQix5QkFBOEI7WUFBOUIsc0JBQThCO2dCQUE5Qiw4QkFBOEI7UUFDOUIsOEJBQThCO1FBQzlCLHdDQUF3QztJQUM1Qzs7SUFFQTs7UUFFSSxlQUFlO1FBQ2Ysb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLFdBQVc7UUFDWCxZQUFZO0lBQ2hCIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL01vZGFsLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5tb2RhbCB7XG4gICAgICAgIHotaW5kZXg6IDg7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICB0b3VjaC1hY3Rpb246IG1hbmlwdWxhdGlvbjtcbiAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuNzUpO1xuICAgICAgICBvdXRsaW5lOiAxNTBweCBzb2xpZCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgLjc1KTtcbiAgICAgICAgdHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb246IGVhc2Utb3V0O1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICB9XG5cbiAgICAubW9kYWwuYWN0aXZlLCAubW9kYWwtaGVhZGVyLmFjdGl2ZSB7XG4gICAgICAgIG9wYWNpdHk6IDE7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xuICAgIH1cblxuICAgIC5tb2RhbC1pbm5lciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1jb2xvci1wcmltYXJ5KSk7XG4gICAgfVxuICAgIC5zbWFsbCAubW9kYWwtaW5uZXIge1xuICAgICAgICB3aWR0aDogMjAwcHg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtYmlnKTtcbiAgICB9XG5cbiAgICAubWVkaXVtIC5tb2RhbC1pbm5lciB7XG4gICAgICAgIHdpZHRoOiBjYWxjKDEwMHZ3IC0gdmFyKC0tc2NyZWVuLXBhZGRpbmcpICogMik7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtYmlnKTtcbiAgICB9XG4gICAgLmJpZyAubW9kYWwtaW5uZXIge1xuICAgICAgICB3aWR0aDogY2FsYygxMDAlIC0gdmFyKC0tc2NyZWVuLXBhZGRpbmcpICogMik7XG4gICAgICAgIGhlaWdodDogY2FsYygxMDAlIC0gdmFyKC0tc2NyZWVuLXBhZGRpbmcpICogMik7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtYmlnKTtcbiAgICB9XG5cbiAgICAuZnVsbCB7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgfVxuXG4gICAgLmZ1bGwgLm1vZGFsLWlubmVyIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIG1pbi1oZWlnaHQ6IDEwMCU7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDA7XG4gICAgfVxuXG4gICAgLm1vZGFsLWhlYWRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTtcbiAgICAgICAgei1pbmRleDogOTtcbiAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIGNvbG9yOiByZ2IodmFyKC0tY29sb3Itd2hpdGUpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICAgICAgb3BhY2l0eTogMDtcbiAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgICAgIHRyYW5zZm9ybS1vcmlnaW46IDUwJSA1MHZoO1xuICAgIH1cblxuICAgIC5tb2RhbC1oZWFkZXItcmVsYXRpdmUge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooMCk7XG4gICAgICAgIHotaW5kZXg6IDk7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgY29sb3I6IHJnYih2YXIoLS1jb2xvci13aGl0ZSkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgIH1cblxuICAgIC5tb2RhbC1oZWFkZXIgLmNsb3NlLFxuICAgIC5tb2RhbC1oZWFkZXItcmVsYXRpdmUgLmNsb3NlIHtcbiAgICAgICAgZm9udC1zaXplOiAyNHB4O1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgd2lkdGg6IDUwcHg7XG4gICAgICAgIGhlaWdodDogNjBweDtcbiAgICB9XG4iXX0= */</style>   \\n\"],\"names\":[],\"mappings\":\"AA+SI,MAAM,8BAAC,CAAC,AACJ,OAAO,CAAE,CAAC,CACV,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,gBAAgB,CAAE,YAAY,CAC1B,YAAY,CAAE,YAAY,CAC9B,mBAAmB,CAAE,IAAI,CACtB,gBAAgB,CAAE,IAAI,CACrB,eAAe,CAAE,IAAI,CACjB,WAAW,CAAE,IAAI,CACzB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAC/C,OAAO,CAAE,KAAK,CAAC,KAAK,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,kCAAkC,CAAE,QAAQ,CACpC,0BAA0B,CAAE,QAAQ,CAC5C,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,MAAM,qCAAO,CAAE,aAAa,OAAO,8BAAC,CAAC,AACjC,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,YAAY,8BAAC,CAAC,AACV,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,CAChC,QAAQ,CAAE,MAAM,CAChB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,CAChC,gBAAgB,CAAE,KAAK,IAAI,qBAAqB,CAAC,CAAC,AACtD,CAAC,AACD,qBAAM,CAAC,YAAY,eAAC,CAAC,AACjB,KAAK,CAAE,KAAK,CACZ,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC3C,CAAC,AAED,sBAAO,CAAC,YAAY,eAAC,CAAC,AAClB,KAAK,CAAE,KAAK,KAAK,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9C,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC3C,CAAC,AACD,mBAAI,CAAC,YAAY,eAAC,CAAC,AACf,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC7C,MAAM,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9C,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC3C,CAAC,AAED,KAAK,8BAAC,CAAC,AACH,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,AACpC,CAAC,AAED,oBAAK,CAAC,YAAY,eAAC,CAAC,AAChB,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,IAAI,CAChB,aAAa,CAAE,CAAC,AACpB,CAAC,AAED,aAAa,8BAAC,CAAC,AACX,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,CAChC,OAAO,CAAE,CAAC,CACV,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,aAAa,CACtC,KAAK,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAC9B,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CACxC,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,CACpB,wBAAwB,CAAE,GAAG,CAAC,IAAI,CAC1B,gBAAgB,CAAE,GAAG,CAAC,IAAI,AACtC,CAAC,AAED,sBAAsB,8BAAC,CAAC,AACpB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,CAChC,OAAO,CAAE,CAAC,CACV,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,aAAa,CACtC,KAAK,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAC9B,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AAC5C,CAAC,AAED,4BAAa,CAAC,qBAAM,CACpB,qCAAsB,CAAC,MAAM,eAAC,CAAC,AAC3B,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC\"}"
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
	let { title = "Закрити" } = $$props;
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
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
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
        <div${add_attribute("id", `modal-${id}`, 0)} aria-hidden="${"true"}" class="${escape(null_to_empty(classProp)) + " svelte-1pzxwn8"}"${add_attribute("this", ref, 1)}>
            ${withHeader && size === "full"
			? `${validate_component(Portal, "Portal").$$render($$result, {}, {}, {
					default: () => `
                    ${$$slots.header
					? $$slots.header({})
					: `
                        <button type="${"button"}" class="${escape(null_to_empty(classnames("modal-header", { active }))) + " svelte-1pzxwn8"}"${add_attribute("this", refHeader, 1)}>
                            <h2 style="${"padding: 15px"}">${escape(title)}</h2>
                            <span class="${"close svelte-1pzxwn8"}">
                                 ${validate_component(Icon, "Icon").$$render($$result, { type: "close", size: "big", is: "light" }, {}, {})}
                            </span>
                        </button>
                    `}
                `
				})}   
                ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}`
			: ``}
            <div class="${"modal-inner svelte-1pzxwn8"}" tabindex="${"-1"}" role="${"dialog"}" aria-modal="${"true"}" aria-labelledby="${"модальне вікно"}">
                ${withHeader && size !== "full"
			? `${$$slots.header
				? $$slots.header({
						props: safeGet(() => $modals[`modal-${id}`], {}, true)
					})
				: `
                        <button type="${"button"}" class="${escape(null_to_empty(classnames("modal-header-relative active"))) + " svelte-1pzxwn8"}">
                            <h2 style="${"padding: 15px"}">${escape(title)}</h2>
                            <span class="${"close svelte-1pzxwn8"}">
                                 ${validate_component(Icon, "Icon").$$render($$result, { type: "close", size: "big", is: "light" }, {}, {})}
                            </span>
                        </button>
                    `}`
			: ``}
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

/* src/components/Square.svelte generated by Svelte v3.18.1 */

const css$6 = {
	code: "section.svelte-ipmqji{position:relative;width:100%;overflow:hidden}section.svelte-ipmqji:after{content:\"\";display:block;padding-top:100%}div.svelte-ipmqji{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}",
	map: "{\"version\":3,\"file\":\"Square.svelte\",\"sources\":[\"Square.svelte\"],\"sourcesContent\":[\"<script>\\n    export let style = undefined\\n</script>  \\n\\n<section {style} class={`square ${$$props.class || ''}`}>\\n    <div>\\n        <slot></slot>\\n    </div>\\n</section>\\n\\n<style>\\n    section {\\n        position: relative;\\n        width: 100%;\\n        overflow: hidden;\\n    }\\n\\n    section:after {\\n        content: \\\"\\\";\\n        display: block;\\n        padding-top: 100%;\\n    }\\n\\n    div {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        right: 0;\\n        bottom: 0;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL1NxdWFyZS5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksa0JBQWtCO1FBQ2xCLFdBQVc7UUFDWCxnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsY0FBYztRQUNkLGlCQUFpQjtJQUNyQjs7SUFFQTtRQUNJLGtCQUFrQjtRQUNsQixNQUFNO1FBQ04sT0FBTztRQUNQLFFBQVE7UUFDUixTQUFTO1FBQ1Qsb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYiw0QkFBc0I7UUFBdEIsNkJBQXNCO1lBQXRCLDBCQUFzQjtnQkFBdEIsc0JBQXNCO0lBQzFCIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL1NxdWFyZS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBzZWN0aW9uIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB9XG5cbiAgICBzZWN0aW9uOmFmdGVyIHtcbiAgICAgICAgY29udGVudDogXCJcIjtcbiAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgIHBhZGRpbmctdG9wOiAxMDAlO1xuICAgIH1cblxuICAgIGRpdiB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICByaWdodDogMDtcbiAgICAgICAgYm90dG9tOiAwO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIH1cbiJdfQ== */</style>\"],\"names\":[],\"mappings\":\"AAWI,OAAO,cAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,qBAAO,MAAM,AAAC,CAAC,AACX,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,KAAK,CACd,WAAW,CAAE,IAAI,AACrB,CAAC,AAED,GAAG,cAAC,CAAC,AACD,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,AAClC,CAAC\"}"
};

const Square = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { style = undefined } = $$props;
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	$$result.css.add(css$6);

	return `<section${add_attribute("style", style, 0)} class="${escape(null_to_empty(`square ${$$props.class || ""}`)) + " svelte-ipmqji"}">
    <div class="${"svelte-ipmqji"}">
        ${$$slots.default ? $$slots.default({}) : ``}
    </div>
</section>`;
});

/* src/components/Picture.svelte generated by Svelte v3.18.1 */

const css$7 = {
	code: ".picture.svelte-15ac5br.svelte-15ac5br{position:relative;-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;-ms-flex-item-align:stretch;align-self:stretch;display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch;background-color:rgba(var(--theme-bg-color-opposite), .04)}.picture.svelte-15ac5br .pic.svelte-15ac5br{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;overflow:hidden;-ms-flex-item-align:stretch;align-self:stretch;-o-object-position:center;object-position:center;-webkit-transition:opacity .5s ease-in;transition:opacity .5s ease-in}.picture.svelte-15ac5br .pic-2x.svelte-15ac5br{position:absolute;top:0;left:0;width:100%;height:100%}.picture.cover.svelte-15ac5br .pic.svelte-15ac5br{-o-object-fit:cover;object-fit:cover}.picture.contain.svelte-15ac5br .pic.svelte-15ac5br{-o-object-fit:contain;object-fit:contain}.picture.isErrorSmall.svelte-15ac5br .pic-1x.svelte-15ac5br,.picture.isErrorBig.svelte-15ac5br .pic-2x.svelte-15ac5br,.picture.loadingSrcSmall.svelte-15ac5br .pic-1x.svelte-15ac5br,.picture.loadingSrcBig.svelte-15ac5br .pic-2x.svelte-15ac5br{opacity:0}",
	map: "{\"version\":3,\"file\":\"Picture.svelte\",\"sources\":[\"Picture.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '@utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let src\\n    export let alt\\n    export let size = 'cover'\\n    export let srcBig = undefined\\n    export let id = undefined\\n    export let width = undefined\\n    export let height = undefined\\n\\n    let loadingSrcSmall = true\\n    let loadingSrcBig = true\\n    let isErrorSmall = false\\n    let isErrorBig = false\\n\\n    $: wrapClassProp = classnames('picture', $$props.class, size, { loadingSrcSmall, loadingSrcBig, isErrorSmall, isErrorBig })\\n\\n    function imgService(node, postFix) {\\n        if (node.complete) {\\n            onLoad(node, postFix)\\n        } else {\\n            node.onload = onLoad.bind(null, node, postFix)\\n            node.onerror = onError.bind(null, node, postFix)\\n        }\\n    }\\n\\n    function onLoad(node, postFix) {\\n        changeLoading(postFix, false)\\n        changeError(postFix, false)\\n        dispatch(`load${postFix}`, node)\\n\\n        if (!srcBig || !loadingSrcBig) {\\n            dispatch('load', node)\\n        }\\n    }\\n\\n    function onError(node, postFix) {\\n        changeLoading(postFix, false)\\n        changeError(postFix, true)\\n        dispatch(`error${postFix}`, node)\\n    }\\n\\n    function changeLoading(type, isLoading) {\\n        switch (type) {\\n            case 'Small':\\n                loadingSrcSmall = isLoading\\n                break\\n            case 'Big':\\n                loadingSrcBig = isLoading\\n                break\\n        }\\n    }\\n\\n    function changeError(type, isError) {\\n        switch (type) {\\n            case 'Small':\\n                isErrorSmall = isError\\n                break\\n            case 'Big':\\n                isErrorBig = isError\\n                break\\n        }\\n    }\\n\\n</script>\\n\\n<figure class={wrapClassProp}>\\n    {#if src}\\n        <img\\n            use:imgService={'Small'}\\n            {id}\\n            {alt}\\n            {src}\\n            {width}\\n            {height}\\n            class=\\\"pic pic-1x\\\"\\n        />\\n    {/if}\\n\\n    {#if srcBig && !loadingSrcSmall}\\n        <img\\n            use:imgService={'Big'}\\n            {alt}\\n            {width}\\n            {height}\\n            src={srcBig}\\n            class=\\\"pic pic-2x\\\"\\n        />\\n    {/if}\\n\\n    <figcaption>\\n        <slot></slot>\\n    </figcaption>\\n</figure>\\n\\n<style>\\n    .picture {\\n        position: relative;\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        display: -webkit-inline-box;\\n        display: -ms-inline-flexbox;\\n        display: inline-flex;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n        background-color: rgba(var(--theme-bg-color-opposite), .04);\\n    }\\n\\n    .picture .pic {\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        overflow: hidden;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -o-object-position: center;\\n           object-position: center;\\n        -webkit-transition: opacity .5s ease-in;\\n        transition: opacity .5s ease-in;\\n    }\\n\\n    .picture .pic-2x {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n    }\\n\\n    .picture.cover .pic {\\n        -o-object-fit: cover;\\n           object-fit: cover;\\n    }\\n\\n    .picture.contain .pic {\\n        -o-object-fit: contain;\\n           object-fit: contain;\\n    }\\n\\n    .picture.isErrorSmall .pic-1x,\\n    .picture.isErrorBig .pic-2x,\\n    .picture.loadingSrcSmall .pic-1x,\\n    .picture.loadingSrcBig .pic-2x {\\n        opacity: 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL1BpY3R1cmUuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGtCQUFrQjtRQUNsQixtQkFBWTtZQUFaLG9CQUFZO2dCQUFaLFlBQVk7UUFDWiw0QkFBbUI7WUFBbkIsbUJBQW1CO1FBQ25CLDJCQUFvQjtRQUFwQiwyQkFBb0I7UUFBcEIsb0JBQW9CO1FBQ3BCLDRCQUFzQjtRQUF0Qiw2QkFBc0I7WUFBdEIsMEJBQXNCO2dCQUF0QixzQkFBc0I7UUFDdEIsMEJBQW9CO1lBQXBCLHVCQUFvQjtnQkFBcEIsb0JBQW9CO1FBQ3BCLHlCQUF3QjtZQUF4QixzQkFBd0I7Z0JBQXhCLHdCQUF3QjtRQUN4QiwyREFBMkQ7SUFDL0Q7O0lBRUE7UUFDSSxtQkFBWTtZQUFaLG9CQUFZO2dCQUFaLFlBQVk7UUFDWixnQkFBZ0I7UUFDaEIsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiwwQkFBdUI7V0FBdkIsdUJBQXVCO1FBQ3ZCLHVDQUErQjtRQUEvQiwrQkFBK0I7SUFDbkM7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsTUFBTTtRQUNOLE9BQU87UUFDUCxXQUFXO1FBQ1gsWUFBWTtJQUNoQjs7SUFFQTtRQUNJLG9CQUFpQjtXQUFqQixpQkFBaUI7SUFDckI7O0lBRUE7UUFDSSxzQkFBbUI7V0FBbkIsbUJBQW1CO0lBQ3ZCOztJQUVBOzs7O1FBSUksVUFBVTtJQUNkIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL1BpY3R1cmUuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnBpY3R1cmUge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3Itb3Bwb3NpdGUpLCAuMDQpO1xuICAgIH1cblxuICAgIC5waWN0dXJlIC5waWMge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIG9iamVjdC1wb3NpdGlvbjogY2VudGVyO1xuICAgICAgICB0cmFuc2l0aW9uOiBvcGFjaXR5IC41cyBlYXNlLWluO1xuICAgIH1cblxuICAgIC5waWN0dXJlIC5waWMtMngge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIHRvcDogMDtcbiAgICAgICAgbGVmdDogMDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICB9XG5cbiAgICAucGljdHVyZS5jb3ZlciAucGljIHtcbiAgICAgICAgb2JqZWN0LWZpdDogY292ZXI7XG4gICAgfVxuXG4gICAgLnBpY3R1cmUuY29udGFpbiAucGljIHtcbiAgICAgICAgb2JqZWN0LWZpdDogY29udGFpbjtcbiAgICB9XG5cbiAgICAucGljdHVyZS5pc0Vycm9yU21hbGwgLnBpYy0xeCxcbiAgICAucGljdHVyZS5pc0Vycm9yQmlnIC5waWMtMngsXG4gICAgLnBpY3R1cmUubG9hZGluZ1NyY1NtYWxsIC5waWMtMXgsXG4gICAgLnBpY3R1cmUubG9hZGluZ1NyY0JpZyAucGljLTJ4IHtcbiAgICAgICAgb3BhY2l0eTogMDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAoGI,QAAQ,8BAAC,CAAC,AACN,QAAQ,CAAE,QAAQ,CAClB,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,WAAW,CACpB,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,CAChC,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC/D,CAAC,AAED,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACX,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,QAAQ,CAAE,MAAM,CAChB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,kBAAkB,CAAE,MAAM,CACvB,eAAe,CAAE,MAAM,CAC1B,kBAAkB,CAAE,OAAO,CAAC,GAAG,CAAC,OAAO,CACvC,UAAU,CAAE,OAAO,CAAC,GAAG,CAAC,OAAO,AACnC,CAAC,AAED,uBAAQ,CAAC,OAAO,eAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,QAAQ,qBAAM,CAAC,IAAI,eAAC,CAAC,AACjB,aAAa,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,AACxB,CAAC,AAED,QAAQ,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACnB,aAAa,CAAE,OAAO,CACnB,UAAU,CAAE,OAAO,AAC1B,CAAC,AAED,QAAQ,4BAAa,CAAC,sBAAO,CAC7B,QAAQ,0BAAW,CAAC,sBAAO,CAC3B,QAAQ,+BAAgB,CAAC,sBAAO,CAChC,QAAQ,6BAAc,CAAC,OAAO,eAAC,CAAC,AAC5B,OAAO,CAAE,CAAC,AACd,CAAC\"}"
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
	$$result.css.add(css$7);

	let wrapClassProp = classnames("picture", $$props.class, size, {
		loadingSrcSmall,
		loadingSrcBig,
		isErrorSmall,
		isErrorBig
	});

	return `<figure class="${escape(null_to_empty(wrapClassProp)) + " svelte-15ac5br"}">
    ${src
	? `<img${add_attribute("id", id, 0)}${add_attribute("alt", alt, 0)}${add_attribute("src", src, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} class="${"pic pic-1x svelte-15ac5br"}">`
	: ``}

    ${srcBig && !loadingSrcSmall
	? `<img${add_attribute("alt", alt, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("src", srcBig, 0)} class="${"pic pic-2x svelte-15ac5br"}">`
	: ``}

    <figcaption>
        ${$$slots.default ? $$slots.default({}) : ``}
    </figcaption>
</figure>`;
});

/* src/components/Avatar.svelte generated by Svelte v3.18.1 */

const css$8 = {
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
	$$result.css.add(css$8);
	let classProp = classnames("ava", size, $$props.class);

	return `<div class="${escape(null_to_empty(classProp)) + " svelte-1vccfih"}">
    ${validate_component(Picture, "Picture").$$render($$result, { src, srcBig, alt }, {}, {})}
</div>`;
});

/* src/components/Button.svelte generated by Svelte v3.18.1 */

const css$9 = {
	code: ".btn.svelte-g4p3yo:not(.auto){width:100%;padding:5px 15px}.btn{-webkit-box-flex:0;-ms-flex:none;flex:none;cursor:pointer;max-width:100%;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;font-weight:bold;text-align:center;-webkit-box-align:center;-ms-flex-align:center;align-items:center;display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;color:rgba(var(--theme-font-color));border-radius:var(--border-radius-medium)}.btn.small{padding:5px;min-width:calc(var(--min-interactive-size) / 1.3);min-height:calc(var(--min-interactive-size) / 1.3)}.btn.medium{padding:5px 10px;min-width:var(--min-interactive-size);min-height:var(--min-interactive-size)}.btn.big{padding:5px 15px;min-width:calc(var(--min-interactive-size) * 1.3);min-height:calc(var(--min-interactive-size) * 1.3)}.btn:focus{background-color:rgba(var(--color-black), 0.1)}.btn:hover{background-color:rgba(var(--color-black), 0.1)}.btn:active{background-color:rgba(var(--color-black), 0.1)}.btn.theme{color:rgba(var(--theme-font-color));background-color:rgba(var(--theme-color-secondary))}.btn.theme:focus{background-color:rgba(var(--theme-color-secondary), .85)}.btn.theme:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.theme:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.theme-border{color:rgba(var(--theme-font-color));border:2px solid rgba(var(--theme-color-primary-opposite))}.btn.theme-border:focus{background-color:rgba(var(--theme-color-secondary), .85)}.btn.them-border:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.theme-border:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.white{color:rgba(var(--color-font-dark));background-color:rgba(var(--color-white))}.btn.white:focus{background-color:rgba(var(--color-white), .85)}.btn.white:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.white:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.dark{color:rgba(var(--color-font-light));background-color:rgba(var(--color-dark))}.btn.dark:focus{background-color:rgba(var(--color-dark), .85)}.btn.dark:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.dark:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.dark-border{color:rgba(var(--theme-font-color));border:2px solid rgba(var(--theme-font-color))}.btn.dark-border:focus{background-color:rgba(var(--color-dark), .85)}.btn.dark-border:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.dark-border:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.success{color:rgba(var(--color-font-light));background-color:rgba(var(--color-success))}.btn.success:focus{background-color:rgba(var(--color-success), .85)}.btn.success:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.success:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.warning{color:rgba(var(--color-font-light));background-color:rgba(var(--color-warning))}.btn.warning:focus{background-color:rgba(var(--color-warning), .85)}.btn.warning:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.warning:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.info{color:rgba(var(--color-font-light));border:2px solid rgba(var(--color-info));background-color:rgba(var(--color-info))}.btn.info:focus{background-color:rgba(var(--color-info), .85)}.btn.info:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.info:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.info-border{color:rgba(var(--color-info));border:2px solid rgba(var(--color-info))}.btn.info-border:focus{background-color:rgba(var(--color-dark), .85)}.btn.info-border:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.info-border:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.danger{color:rgba(var(--color-font-light));background-color:rgba(var(--color-danger))}.btn.danger:focus{background-color:rgba(var(--color-danger), .85)}.btn.danger:hover{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.btn.danger:active{-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}",
	map: "{\"version\":3,\"file\":\"Button.svelte\",\"sources\":[\"Button.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '@utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let is = undefined // theme, theme-border, white, success, warning, danger, dark, dark-border\\n    export let id = undefined\\n    export let rel = undefined\\n    export let href = undefined\\n    export let auto = false\\n    export let type = 'button'\\n    export let form = undefined\\n    export let size = undefined\\n    export let title = undefined\\n    export let style = undefined\\n    export let htmlFor = undefined\\n    export let disabled = false\\n    export let ariaLabel = undefined\\n\\n    let titleProp = title || ariaLabel\\n    let ariaLabelProp = ariaLabel || title\\n\\n    $: classProp = classnames('btn', is, size, $$props.class, { auto, disabled })\\n\\n    function onLabelClick(e) {\\n        document.getElementById(htmlFor).click()\\n        !disabled && dispatch('click', e)\\n    }\\n\\n    function onClick(e) {\\n        e.stopPropagation();\\n        !disabled && dispatch('click', e)\\n    }\\n</script>\\n\\n{#if href}\\n    <a\\n            {id}\\n            {rel}\\n            {href}\\n            {style}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </a>\\n{:else if htmlFor}\\n    <label\\n            {id}\\n            {style}\\n            {disabled}\\n            for={htmlFor}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onLabelClick}\\n    >\\n        <slot></slot>\\n    </label>\\n{:else}\\n    <button\\n            {id}\\n            {form}\\n            {type}\\n            {style}\\n            {disabled}\\n            title={titleProp}\\n            class={classProp}\\n            aria-label={ariaLabelProp}\\n            on:click={onClick}\\n    >\\n        <slot></slot>\\n    </button>\\n{/if}\\n\\n<style>\\n    .btn:not(.auto) {\\n        width: 100%;\\n        padding: 5px 15px;\\n    }\\n\\n    :global(.btn) {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        cursor: pointer;\\n        max-width: 100%;\\n        -webkit-user-select: none;\\n           -moz-user-select: none;\\n            -ms-user-select: none;\\n                user-select: none;\\n        font-weight: bold;\\n        text-align: center;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        display: -webkit-inline-box;\\n        display: -ms-inline-flexbox;\\n        display: inline-flex;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        color: rgba(var(--theme-font-color));\\n        border-radius: var(--border-radius-medium);\\n    }\\n\\n    :global(.btn.small) {\\n        padding: 5px;\\n        min-width: calc(var(--min-interactive-size) / 1.3);\\n        min-height: calc(var(--min-interactive-size) / 1.3);\\n    }\\n\\n    :global(.btn.medium) {\\n        padding: 5px 10px;\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n    }\\n\\n    :global(.btn.big) {\\n        padding: 5px 15px;\\n        min-width: calc(var(--min-interactive-size) * 1.3);\\n        min-height: calc(var(--min-interactive-size) * 1.3);\\n    }\\n\\n    :global(.btn:focus) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:hover) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    :global(.btn:active) {\\n        background-color: rgba(var(--color-black), 0.1);\\n    }\\n\\n    /* theme */\\n\\n    :global(.btn).theme {\\n        color: rgba(var(--theme-font-color));\\n        background-color: rgba(var(--theme-color-secondary));\\n    }\\n\\n    :global(.btn).theme:focus {\\n        background-color: rgba(var(--theme-color-secondary), .85);\\n    }\\n\\n    :global(.btn).theme:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).theme:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* theme */\\n\\n    :global(.btn).theme-border {\\n        color: rgba(var(--theme-font-color));\\n        border: 2px solid rgba(var(--theme-color-primary-opposite));\\n    }\\n\\n    :global(.btn).theme-border:focus {\\n        background-color: rgba(var(--theme-color-secondary), .85);\\n    }\\n\\n    :global(.btn).them-border:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).theme-border:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* White */\\n\\n    :global(.btn).white {\\n        color: rgba(var(--color-font-dark));\\n        background-color: rgba(var(--color-white));\\n    }\\n\\n    :global(.btn).white:focus {\\n        background-color: rgba(var(--color-white), .85);\\n    }\\n\\n    :global(.btn).white:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).white:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Dark */\\n\\n    :global(.btn).dark {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-dark));\\n    }\\n\\n    :global(.btn).dark:focus {\\n        background-color: rgba(var(--color-dark), .85);\\n    }\\n\\n    :global(.btn).dark:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).dark:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Dark-border */\\n\\n    :global(.btn).dark-border {\\n        color: rgba(var(--theme-font-color));\\n        border: 2px solid rgba(var(--theme-font-color));\\n    }\\n\\n    :global(.btn).dark-border:focus {\\n        background-color: rgba(var(--color-dark), .85);\\n    }\\n\\n    :global(.btn).dark-border:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).dark-border:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Success */\\n\\n    :global(.btn).success {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-success));\\n    }\\n\\n    :global(.btn).success:focus {\\n        background-color: rgba(var(--color-success), .85);\\n    }\\n\\n    :global(.btn).success:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).success:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Warning */\\n\\n    :global(.btn).warning {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-warning));\\n    }\\n\\n    :global(.btn).warning:focus {\\n        background-color: rgba(var(--color-warning), .85);\\n    }\\n\\n    :global(.btn).warning:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).warning:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Info */\\n\\n    :global(.btn).info {\\n        color: rgba(var(--color-font-light));\\n        border: 2px solid rgba(var(--color-info));\\n        background-color: rgba(var(--color-info));\\n    }\\n\\n    :global(.btn).info:focus {\\n        background-color: rgba(var(--color-info), .85);\\n    }\\n\\n    :global(.btn).info:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).info:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Info-border  */\\n\\n    :global(.btn).info-border {\\n        color: rgba(var(--color-info));\\n        border: 2px solid rgba(var(--color-info));\\n    }\\n\\n    :global(.btn).info-border:focus {\\n        background-color: rgba(var(--color-dark), .85);\\n    }\\n\\n    :global(.btn).info-border:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).info-border:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    /* Danger */\\n\\n    :global(.btn).danger {\\n        color: rgba(var(--color-font-light));\\n        background-color: rgba(var(--color-danger));\\n    }\\n\\n    :global(.btn).danger:focus {\\n        background-color: rgba(var(--color-danger), .85);\\n    }\\n\\n    :global(.btn).danger:hover {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    :global(.btn).danger:active {\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0J1dHRvbi5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksV0FBVztRQUNYLGlCQUFpQjtJQUNyQjs7SUFFQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsZUFBZTtRQUNmLGVBQWU7UUFDZix5QkFBaUI7V0FBakIsc0JBQWlCO1lBQWpCLHFCQUFpQjtnQkFBakIsaUJBQWlCO1FBQ2pCLGlCQUFpQjtRQUNqQixrQkFBa0I7UUFDbEIseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLDJCQUFvQjtRQUFwQiwyQkFBb0I7UUFBcEIsb0JBQW9CO1FBQ3BCLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2QixvQ0FBb0M7UUFDcEMsMENBQTBDO0lBQzlDOztJQUVBO1FBQ0ksWUFBWTtRQUNaLGtEQUFrRDtRQUNsRCxtREFBbUQ7SUFDdkQ7O0lBRUE7UUFDSSxpQkFBaUI7UUFDakIsc0NBQXNDO1FBQ3RDLHVDQUF1QztJQUMzQzs7SUFFQTtRQUNJLGlCQUFpQjtRQUNqQixrREFBa0Q7UUFDbEQsbURBQW1EO0lBQ3ZEOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBO1FBQ0ksK0NBQStDO0lBQ25EOztJQUVBLFVBQVU7O0lBRVY7UUFDSSxvQ0FBb0M7UUFDcEMsb0RBQW9EO0lBQ3hEOztJQUVBO1FBQ0kseURBQXlEO0lBQzdEOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQSxVQUFVOztJQUVWO1FBQ0ksb0NBQW9DO1FBQ3BDLDJEQUEyRDtJQUMvRDs7SUFFQTtRQUNJLHlEQUF5RDtJQUM3RDs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUEsVUFBVTs7SUFFVjtRQUNJLG1DQUFtQztRQUNuQywwQ0FBMEM7SUFDOUM7O0lBRUE7UUFDSSwrQ0FBK0M7SUFDbkQ7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBLFNBQVM7O0lBRVQ7UUFDSSxvQ0FBb0M7UUFDcEMseUNBQXlDO0lBQzdDOztJQUVBO1FBQ0ksOENBQThDO0lBQ2xEOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQSxnQkFBZ0I7O0lBRWhCO1FBQ0ksb0NBQW9DO1FBQ3BDLCtDQUErQztJQUNuRDs7SUFFQTtRQUNJLDhDQUE4QztJQUNsRDs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUEsWUFBWTs7SUFFWjtRQUNJLG9DQUFvQztRQUNwQyw0Q0FBNEM7SUFDaEQ7O0lBRUE7UUFDSSxpREFBaUQ7SUFDckQ7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBLFlBQVk7O0lBRVo7UUFDSSxvQ0FBb0M7UUFDcEMsNENBQTRDO0lBQ2hEOztJQUVBO1FBQ0ksaURBQWlEO0lBQ3JEOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQSxTQUFTOztJQUVUO1FBQ0ksb0NBQW9DO1FBQ3BDLHlDQUF5QztRQUN6Qyx5Q0FBeUM7SUFDN0M7O0lBRUE7UUFDSSw4Q0FBOEM7SUFDbEQ7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBLGlCQUFpQjs7SUFFakI7UUFDSSw4QkFBOEI7UUFDOUIseUNBQXlDO0lBQzdDOztJQUVBO1FBQ0ksOENBQThDO0lBQ2xEOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztJQUNyQzs7SUFFQSxXQUFXOztJQUVYO1FBQ0ksb0NBQW9DO1FBQ3BDLDJDQUEyQztJQUMvQzs7SUFFQTtRQUNJLGdEQUFnRDtJQUNwRDs7SUFFQTtRQUNJLHlDQUFpQztnQkFBakMsaUNBQWlDO0lBQ3JDOztJQUVBO1FBQ0kseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckMiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvQnV0dG9uLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5idG46bm90KC5hdXRvKSB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBwYWRkaW5nOiA1cHggMTVweDtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgICAgIHVzZXItc2VsZWN0OiBub25lO1xuICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWZvbnQtY29sb3IpKTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cy1tZWRpdW0pO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bi5zbWFsbCkge1xuICAgICAgICBwYWRkaW5nOiA1cHg7XG4gICAgICAgIG1pbi13aWR0aDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgLyAxLjMpO1xuICAgICAgICBtaW4taGVpZ2h0OiBjYWxjKHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKSAvIDEuMyk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuLm1lZGl1bSkge1xuICAgICAgICBwYWRkaW5nOiA1cHggMTBweDtcbiAgICAgICAgbWluLXdpZHRoOiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIG1pbi1oZWlnaHQ6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4uYmlnKSB7XG4gICAgICAgIHBhZGRpbmc6IDVweCAxNXB4O1xuICAgICAgICBtaW4td2lkdGg6IGNhbGModmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpICogMS4zKTtcbiAgICAgICAgbWluLWhlaWdodDogY2FsYyh2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSkgKiAxLjMpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bjpmb2N1cykge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4xKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG46aG92ZXIpIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIDAuMSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuOmFjdGl2ZSkge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMC4xKTtcbiAgICB9XG5cbiAgICAvKiB0aGVtZSAqL1xuXG4gICAgOmdsb2JhbCguYnRuKS50aGVtZSB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWZvbnQtY29sb3IpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1jb2xvci1zZWNvbmRhcnkpKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLnRoZW1lOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1jb2xvci1zZWNvbmRhcnkpLCAuODUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikudGhlbWU6aG92ZXIge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS50aGVtZTphY3RpdmUge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLyogdGhlbWUgKi9cblxuICAgIDpnbG9iYWwoLmJ0bikudGhlbWUtYm9yZGVyIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtZm9udC1jb2xvcikpO1xuICAgICAgICBib3JkZXI6IDJweCBzb2xpZCByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnktb3Bwb3NpdGUpKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLnRoZW1lLWJvcmRlcjpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtY29sb3Itc2Vjb25kYXJ5KSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLnRoZW0tYm9yZGVyOmhvdmVyIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikudGhlbWUtYm9yZGVyOmFjdGl2ZSB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBXaGl0ZSAqL1xuXG4gICAgOmdsb2JhbCguYnRuKS53aGl0ZSB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtZGFyaykpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXdoaXRlKSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS53aGl0ZTpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2hpdGUpLCAuODUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2hpdGU6aG92ZXIge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS53aGl0ZTphY3RpdmUge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLyogRGFyayAqL1xuXG4gICAgOmdsb2JhbCguYnRuKS5kYXJrIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZm9udC1saWdodCkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhcmspKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhcms6Zm9jdXMge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhcmspLCAuODUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikuZGFyazpob3ZlciB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhcms6YWN0aXZlIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC8qIERhcmstYm9yZGVyICovXG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhcmstYm9yZGVyIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtZm9udC1jb2xvcikpO1xuICAgICAgICBib3JkZXI6IDJweCBzb2xpZCByZ2JhKHZhcigtLXRoZW1lLWZvbnQtY29sb3IpKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhcmstYm9yZGVyOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYXJrKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhcmstYm9yZGVyOmhvdmVyIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikuZGFyay1ib3JkZXI6YWN0aXZlIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIC8qIFN1Y2Nlc3MgKi9cblxuICAgIDpnbG9iYWwoLmJ0bikuc3VjY2VzcyB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5zdWNjZXNzOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLnN1Y2Nlc3M6aG92ZXIge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5zdWNjZXNzOmFjdGl2ZSB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBXYXJuaW5nICovXG5cbiAgICA6Z2xvYmFsKC5idG4pLndhcm5pbmcge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1mb250LWxpZ2h0KSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZykpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2FybmluZzpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2FybmluZyksIC44NSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS53YXJuaW5nOmhvdmVyIHtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikud2FybmluZzphY3RpdmUge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLyogSW5mbyAqL1xuXG4gICAgOmdsb2JhbCguYnRuKS5pbmZvIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZm9udC1saWdodCkpO1xuICAgICAgICBib3JkZXI6IDJweCBzb2xpZCByZ2JhKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5pbmZvOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1pbmZvKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmluZm86aG92ZXIge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5pbmZvOmFjdGl2ZSB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICAvKiBJbmZvLWJvcmRlciAgKi9cblxuICAgIDpnbG9iYWwoLmJ0bikuaW5mby1ib3JkZXIge1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgICAgIGJvcmRlcjogMnB4IHNvbGlkIHJnYmEodmFyKC0tY29sb3ItaW5mbykpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikuaW5mby1ib3JkZXI6Zm9jdXMge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhcmspLCAuODUpO1xuICAgIH1cblxuICAgIDpnbG9iYWwoLmJ0bikuaW5mby1ib3JkZXI6aG92ZXIge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgOmdsb2JhbCguYnRuKS5pbmZvLWJvcmRlcjphY3RpdmUge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLyogRGFuZ2VyICovXG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhbmdlciB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWZvbnQtbGlnaHQpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhbmdlcjpmb2N1cyB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSwgLjg1KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhbmdlcjpob3ZlciB7XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICB9XG5cbiAgICA6Z2xvYmFsKC5idG4pLmRhbmdlcjphY3RpdmUge1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AA+EI,kBAAI,KAAK,KAAK,CAAC,AAAC,CAAC,AACb,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,IAAI,AACrB,CAAC,AAEO,IAAI,AAAE,CAAC,AACX,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,MAAM,CAAE,OAAO,CACf,SAAS,CAAE,IAAI,CACf,mBAAmB,CAAE,IAAI,CACtB,gBAAgB,CAAE,IAAI,CACrB,eAAe,CAAE,IAAI,CACjB,WAAW,CAAE,IAAI,CACzB,WAAW,CAAE,IAAI,CACjB,UAAU,CAAE,MAAM,CAClB,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,WAAW,CACpB,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,aAAa,CAAE,IAAI,sBAAsB,CAAC,AAC9C,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,UAAU,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AACvD,CAAC,AAEO,WAAW,AAAE,CAAC,AAClB,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,AAC3C,CAAC,AAEO,QAAQ,AAAE,CAAC,AACf,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,SAAS,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,UAAU,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AACvD,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,UAAU,AAAE,CAAC,AACjB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,WAAW,AAAE,CAAC,AAClB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAIO,IAAI,AAAC,MAAM,AAAC,CAAC,AACjB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,uBAAuB,CAAC,CAAC,AACxD,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,uBAAuB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC7D,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,MAAM,OAAO,AAAC,CAAC,AACxB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,aAAa,AAAC,CAAC,AACxB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,AAC/D,CAAC,AAEO,IAAI,AAAC,aAAa,MAAM,AAAC,CAAC,AAC9B,gBAAgB,CAAE,KAAK,IAAI,uBAAuB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC7D,CAAC,AAEO,IAAI,AAAC,YAAY,MAAM,AAAC,CAAC,AAC7B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,aAAa,OAAO,AAAC,CAAC,AAC/B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,MAAM,AAAC,CAAC,AACjB,KAAK,CAAE,KAAK,IAAI,iBAAiB,CAAC,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,AAC9C,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAEO,IAAI,AAAC,MAAM,MAAM,AAAC,CAAC,AACvB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,MAAM,OAAO,AAAC,CAAC,AACxB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,KAAK,AAAC,CAAC,AAChB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,KAAK,MAAM,AAAC,CAAC,AACtB,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAAC,GAAG,CAAC,AAClD,CAAC,AAEO,IAAI,AAAC,KAAK,MAAM,AAAC,CAAC,AACtB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,KAAK,OAAO,AAAC,CAAC,AACvB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,YAAY,AAAC,CAAC,AACvB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,kBAAkB,CAAC,CAAC,AACnD,CAAC,AAEO,IAAI,AAAC,YAAY,MAAM,AAAC,CAAC,AAC7B,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAAC,GAAG,CAAC,AAClD,CAAC,AAEO,IAAI,AAAC,YAAY,MAAM,AAAC,CAAC,AAC7B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,YAAY,OAAO,AAAC,CAAC,AAC9B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,QAAQ,AAAC,CAAC,AACnB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,CAAC,GAAG,CAAC,AACrD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,QAAQ,OAAO,AAAC,CAAC,AAC1B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,QAAQ,AAAC,CAAC,AACnB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,CAAC,GAAG,CAAC,AACrD,CAAC,AAEO,IAAI,AAAC,QAAQ,MAAM,AAAC,CAAC,AACzB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,QAAQ,OAAO,AAAC,CAAC,AAC1B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,KAAK,AAAC,CAAC,AAChB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,YAAY,CAAC,CAAC,CACzC,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,KAAK,MAAM,AAAC,CAAC,AACtB,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAAC,GAAG,CAAC,AAClD,CAAC,AAEO,IAAI,AAAC,KAAK,MAAM,AAAC,CAAC,AACtB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,KAAK,OAAO,AAAC,CAAC,AACvB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,YAAY,AAAC,CAAC,AACvB,KAAK,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAC9B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,YAAY,MAAM,AAAC,CAAC,AAC7B,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAAC,GAAG,CAAC,AAClD,CAAC,AAEO,IAAI,AAAC,YAAY,MAAM,AAAC,CAAC,AAC7B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,YAAY,OAAO,AAAC,CAAC,AAC9B,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAIO,IAAI,AAAC,OAAO,AAAC,CAAC,AAClB,KAAK,CAAE,KAAK,IAAI,kBAAkB,CAAC,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,AAC/C,CAAC,AAEO,IAAI,AAAC,OAAO,MAAM,AAAC,CAAC,AACxB,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,GAAG,CAAC,AACpD,CAAC,AAEO,IAAI,AAAC,OAAO,MAAM,AAAC,CAAC,AACxB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAEO,IAAI,AAAC,OAAO,OAAO,AAAC,CAAC,AACzB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC\"}"
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
	$$result.css.add(css$9);
	let classProp = classnames("btn", is, size, $$props.class, { auto, disabled });

	return `${href
	? `<a${add_attribute("id", id, 0)}${add_attribute("rel", rel, 0)}${add_attribute("href", href, 0)}${add_attribute("style", style, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-g4p3yo"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </a>`
	: `${htmlFor
		? `<label${add_attribute("id", id, 0)}${add_attribute("style", style, 0)} ${disabled ? "disabled" : ""}${add_attribute("for", htmlFor, 0)}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-g4p3yo"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </label>`
		: `<button${add_attribute("id", id, 0)}${add_attribute("form", form, 0)}${add_attribute("type", type, 0)}${add_attribute("style", style, 0)} ${disabled ? "disabled" : ""}${add_attribute("title", titleProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-g4p3yo"}"${add_attribute("aria-label", ariaLabelProp, 0)}>
        ${$$slots.default ? $$slots.default({}) : ``}
    </button>`}`}`;
});

/* src/components/Divider.svelte generated by Svelte v3.18.1 */

const css$a = {
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
	$$result.css.add(css$a);
	let classProp = classnames("divider", is, $$props.class);

	let styleProp = toCSSString({
		padding: `${size / 2}px 0`,
		height: `${width}px`
	});

	return `<hr class="${escape(null_to_empty(classProp)) + " svelte-16jxdsi"}"${add_attribute("style", styleProp, 0)}>`;
});

/* src/components/Progress.svelte generated by Svelte v3.18.1 */

const css$b = {
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
	$$result.css.add(css$b);

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

const css$c = {
	code: ".fancy-box.svelte-a2sdhd.svelte-a2sdhd{position:relative;width:100%;-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;overflow:hidden;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch}.fancy-box-ghost.svelte-a2sdhd.svelte-a2sdhd{z-index:10;position:fixed;top:0;left:0;width:100%;height:100%;display:-webkit-box;display:-ms-flexbox;display:flex;overflow:hidden;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-ms-touch-action:manipulation;touch-action:manipulation;background-color:rgba(var(--color-black), .75);outline:150px solid rgba(var(--color-black), .75);-webkit-transition-timing-function:linear;transition-timing-function:linear;opacity:0;padding:0 var(--screen-padding);-webkit-transform:translate3d(0,30px,0);transform:translate3d(0,30px,0);pointer-events:none;will-change:transform, opacity}.fancy-box-ghost.svelte-a2sdhd>.svelte-a2sdhd{max-width:100%;max-height:100%}.fancy-box-ghost.active.svelte-a2sdhd.svelte-a2sdhd{opacity:1;-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0);pointer-events:auto}button.svelte-a2sdhd.svelte-a2sdhd{position:absolute;top:0;right:0;font-size:24px;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:60px;height:60px;color:rgb(var(--color-white))}",
	map: "{\"version\":3,\"file\":\"FancyBox.svelte\",\"sources\":[\"FancyBox.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher, tick } from 'svelte'\\n    import { fly } from 'svelte/transition'\\n    import { Swipe } from '@services'\\n    import { classnames, delay, bodyScroll, safeGet } from '@utils'\\n    import Icon from '@components/Icon.svelte';\\n    import Portal from './Portal.svelte';\\n\\n    const dispatch = createEventDispatcher()\\n    \\n    const DURATION = 250\\n    const THRESHOLD = 50\\n    const SWIPE_SPEED = .5\\n    const START_POSITION = {\\n        x: 0,\\n        y: 20\\n    }\\n\\n    export let ref = null\\n    export let blockBody = true\\n    export let swipe = ['all']       // up down left right all\\n    export let disabled = false\\n    export let extraLock = false\\n    export let startPosition = START_POSITION\\n\\n    let active = null\\n    let slots = $$props.$$slots || {}\\n\\n    async function onClick(e) {\\n        if (disabled) return\\n\\n        const newActive = !active\\n\\n        setActive(newActive)\\n\\n        if (newActive) {\\n            drawTransform(ref, 0, 0)\\n        } else {\\n            drawTransform(ref, startPosition.x, startPosition.y)\\n        }\\n    }\\n\\n    async function setActive(isActive) {\\n        active = isActive\\n\\n        await tick()\\n\\n        if (active) {\\n            setDuration(ref, DURATION)\\n            setTimeout(() => setDuration(ref, 0), DURATION)\\n            blockBody && bodyScroll.disableScroll(ref, { extraLock });\\n            dispatch('open')\\n        } else {\\n            setDuration(ref, DURATION)\\n            blockBody && bodyScroll.enableScroll(ref, { extraLock });\\n            dispatch('close')\\n        }\\n    }\\n\\n    $: isSwipe = {\\n        up: safeGet(() => swipe.includes('up') || swipe.includes('all')),\\n        down: safeGet(() => swipe.includes('down') || swipe.includes('all')),\\n        left: safeGet(() => swipe.includes('left') || swipe.includes('all')),\\n        right: safeGet(() => swipe.includes('right') || swipe.includes('all')),\\n    }\\n    $: classProp = classnames('fancy-box-ghost', { active })\\n    $: classPropWrap = classnames('fancy-box', $$props.class)\\n\\n    let xSwipe = 0\\n    let ySwipe = 0\\n\\n    function addSwipe(el) {\\n        new Swipe(el)\\n                .run()\\n                .onUp(isSwipe.up ? handleVerticalSwipe : null)\\n                .onDown(isSwipe.down ? handleVerticalSwipe : null)\\n                .onLeft(isSwipe.left ? handleHorizontalSwipe : null)\\n                .onRight(isSwipe.right ? handleHorizontalSwipe : null)\\n                .onTouchEnd(async () => {\\n                    if (xSwipe > THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        setActive(false)\\n                        drawTransform(el, xSwipe + 50, ySwipe)\\n                        drawOpacity(el, xSwipe + 50, ySwipe)\\n                        await delay(DURATION)\\n                    } else if (xSwipe < -THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        setActive(false)\\n                        drawTransform(el, xSwipe - 50, ySwipe)\\n                        drawOpacity(el, xSwipe - 50, ySwipe)\\n                        await delay(DURATION)\\n                    }\\n                    \\n                    if (ySwipe > THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        setActive(false)\\n                        drawTransform(el, xSwipe, ySwipe + 50)\\n                        drawOpacity(el, xSwipe, ySwipe + 50)\\n                        await delay(DURATION)\\n                    } else if (ySwipe < -THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        setActive(false)\\n                        drawTransform(el, xSwipe, ySwipe - 50)\\n                        drawOpacity(el, xSwipe, ySwipe - 50)\\n                        await delay(DURATION)\\n                    }\\n\\n                    if (xSwipe <= THRESHOLD && xSwipe >= -THRESHOLD && ySwipe <= THRESHOLD && ySwipe >= -THRESHOLD) {\\n                        setDuration(ref, DURATION)\\n                        setTimeout(() => setDuration(ref, 0), DURATION)\\n                        drawTransform(el, 0, 0)\\n                    } else {\\n                        drawTransform(el, startPosition.x, startPosition.y)\\n                    }\\n\\n                    xSwipe = 0\\n                    ySwipe = 0\\n                    el.style.opacity = null\\n                })\\n    }\\n\\n    function handleVerticalSwipe(yDown, yUp, evt, el) {\\n        ySwipe = (yUp - yDown) * SWIPE_SPEED\\n        drawTransform(el, xSwipe, ySwipe)\\n        drawOpacity(el, xSwipe, ySwipe)\\n    }\\n    function handleHorizontalSwipe(xDown, xUp, evt, el) {\\n        xSwipe = (xUp - xDown) * SWIPE_SPEED\\n        drawTransform(el, xSwipe, ySwipe)\\n        drawOpacity(el, xSwipe, ySwipe)\\n    }\\n\\n    function drawTransform(el, x, y) {\\n        const delta = Math.abs(x) > Math.abs(y) ? x : y\\n        let scale = 1 - Math.abs(delta / window.innerHeight)\\n        el && (el.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${x}, ${y})`)\\n    }\\n    function setDuration(el, ms) {\\n        el && (el.style.transitionDuration = `${ms}ms`)\\n    }\\n    function drawOpacity(el, x, y) {\\n        const delta = Math.abs(x) > Math.abs(y) ? x : y\\n        el && (el.style.opacity = 1 - Math.min(Math.abs(delta / (THRESHOLD * 1.5)), 1))\\n    }\\n</script>\\n\\n<section role=\\\"button\\\" class={classPropWrap} on:click={onClick}>\\n    <slot {active}></slot>\\n</section>\\n\\n{#if active !== null}\\n    <Portal>\\n        <section\\n            bind:this={ref}\\n            use:addSwipe\\n            class={classProp}\\n        >\\n            <button type=\\\"button\\\" on:click={onClick}>\\n                <Icon type=\\\"close\\\" size=\\\"big\\\" is=\\\"light\\\"/>\\n            </button>\\n            {#if slots.box}\\n                <slot name=\\\"box\\\"></slot>\\n            {:else}\\n                <slot></slot>\\n            {/if}\\n        </section>\\n    </Portal>\\n{/if}\\n\\n<style>\\n    .fancy-box {\\n        position: relative;\\n        width: 100%;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow: hidden;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n    }\\n\\n    .fancy-box-ghost {\\n        z-index: 10;\\n        position: fixed;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow: hidden;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        -webkit-user-select: none;\\n           -moz-user-select: none;\\n            -ms-user-select: none;\\n                user-select: none;\\n        -ms-touch-action: manipulation;\\n            touch-action: manipulation;\\n        background-color: rgba(var(--color-black), .75);\\n        outline: 150px solid rgba(var(--color-black), .75);\\n        -webkit-transition-timing-function: linear;\\n                transition-timing-function: linear;\\n        opacity: 0;\\n        padding: 0 var(--screen-padding);\\n        -webkit-transform: translate3d(0,30px,0);\\n                transform: translate3d(0,30px,0);\\n        pointer-events: none;\\n        will-change: transform, opacity;\\n    }\\n\\n    .fancy-box-ghost > * {\\n        max-width: 100%;\\n        max-height: 100%;\\n    }\\n\\n    .fancy-box-ghost.active {\\n        opacity: 1;\\n        -webkit-transform: translate3d(0,0,0);\\n                transform: translate3d(0,0,0);\\n        pointer-events: auto;\\n    }\\n\\n    button {\\n        position: absolute;\\n        top: 0;\\n        right: 0;\\n        font-size: 24px;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 60px;\\n        height: 60px;\\n        color: rgb(var(--color-white));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0ZhbmN5Qm94LnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxrQkFBa0I7UUFDbEIsV0FBVztRQUNYLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1Ysb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiwwQkFBb0I7WUFBcEIsdUJBQW9CO2dCQUFwQixvQkFBb0I7UUFDcEIseUJBQXdCO1lBQXhCLHNCQUF3QjtnQkFBeEIsd0JBQXdCO0lBQzVCOztJQUVBO1FBQ0ksV0FBVztRQUNYLGVBQWU7UUFDZixNQUFNO1FBQ04sT0FBTztRQUNQLFdBQVc7UUFDWCxZQUFZO1FBQ1osb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsMEJBQW9CO1lBQXBCLHVCQUFvQjtnQkFBcEIsb0JBQW9CO1FBQ3BCLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2Qiw0QkFBc0I7UUFBdEIsNkJBQXNCO1lBQXRCLDBCQUFzQjtnQkFBdEIsc0JBQXNCO1FBQ3RCLHlCQUFpQjtXQUFqQixzQkFBaUI7WUFBakIscUJBQWlCO2dCQUFqQixpQkFBaUI7UUFDakIsOEJBQTBCO1lBQTFCLDBCQUEwQjtRQUMxQiwrQ0FBK0M7UUFDL0Msa0RBQWtEO1FBQ2xELDBDQUFrQztnQkFBbEMsa0NBQWtDO1FBQ2xDLFVBQVU7UUFDVixnQ0FBZ0M7UUFDaEMsd0NBQWdDO2dCQUFoQyxnQ0FBZ0M7UUFDaEMsb0JBQW9CO1FBQ3BCLCtCQUErQjtJQUNuQzs7SUFFQTtRQUNJLGVBQWU7UUFDZixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxVQUFVO1FBQ1YscUNBQTZCO2dCQUE3Qiw2QkFBNkI7UUFDN0Isb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLE1BQU07UUFDTixRQUFRO1FBQ1IsZUFBZTtRQUNmLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2QixXQUFXO1FBQ1gsWUFBWTtRQUNaLDhCQUE4QjtJQUNsQyIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9GYW5jeUJveC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuZmFuY3ktYm94IHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3RyZXRjaDtcbiAgICB9XG5cbiAgICAuZmFuY3ktYm94LWdob3N0IHtcbiAgICAgICAgei1pbmRleDogMTA7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIHVzZXItc2VsZWN0OiBub25lO1xuICAgICAgICB0b3VjaC1hY3Rpb246IG1hbmlwdWxhdGlvbjtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC43NSk7XG4gICAgICAgIG91dGxpbmU6IDE1MHB4IHNvbGlkIHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAuNzUpO1xuICAgICAgICB0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbjogbGluZWFyO1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICBwYWRkaW5nOiAwIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLDMwcHgsMCk7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgICB3aWxsLWNoYW5nZTogdHJhbnNmb3JtLCBvcGFjaXR5O1xuICAgIH1cblxuICAgIC5mYW5jeS1ib3gtZ2hvc3QgPiAqIHtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICBtYXgtaGVpZ2h0OiAxMDAlO1xuICAgIH1cblxuICAgIC5mYW5jeS1ib3gtZ2hvc3QuYWN0aXZlIHtcbiAgICAgICAgb3BhY2l0eTogMTtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLDAsMCk7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xuICAgIH1cblxuICAgIGJ1dHRvbiB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICByaWdodDogMDtcbiAgICAgICAgZm9udC1zaXplOiAyNHB4O1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgd2lkdGg6IDYwcHg7XG4gICAgICAgIGhlaWdodDogNjBweDtcbiAgICAgICAgY29sb3I6IHJnYih2YXIoLS1jb2xvci13aGl0ZSkpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AA8KI,UAAU,4BAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,AACpC,CAAC,AAED,gBAAgB,4BAAC,CAAC,AACd,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,mBAAmB,CAAE,IAAI,CACtB,gBAAgB,CAAE,IAAI,CACrB,eAAe,CAAE,IAAI,CACjB,WAAW,CAAE,IAAI,CACzB,gBAAgB,CAAE,YAAY,CAC1B,YAAY,CAAE,YAAY,CAC9B,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAC/C,OAAO,CAAE,KAAK,CAAC,KAAK,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,GAAG,CAAC,CAClD,kCAAkC,CAAE,MAAM,CAClC,0BAA0B,CAAE,MAAM,CAC1C,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAChC,iBAAiB,CAAE,YAAY,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAChC,SAAS,CAAE,YAAY,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CACxC,cAAc,CAAE,IAAI,CACpB,WAAW,CAAE,SAAS,CAAC,CAAC,OAAO,AACnC,CAAC,AAED,8BAAgB,CAAG,cAAE,CAAC,AAClB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,IAAI,AACpB,CAAC,AAED,gBAAgB,OAAO,4BAAC,CAAC,AACrB,OAAO,CAAE,CAAC,CACV,iBAAiB,CAAE,YAAY,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC7B,SAAS,CAAE,YAAY,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACrC,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,MAAM,4BAAC,CAAC,AACJ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,CAAC,CACR,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,AAClC,CAAC\"}"
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
	$$result.css.add(css$c);

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

const css$d = {
	code: ".carousel.rounded.svelte-1mqt63g.svelte-1mqt63g>.carousel-inner.svelte-1mqt63g.svelte-1mqt63g{border-radius:var(--border-radius-big)}.carousel.svelte-1mqt63g.svelte-1mqt63g.svelte-1mqt63g,.carousel-inner.svelte-1mqt63g.svelte-1mqt63g.svelte-1mqt63g,.carousel-inner.svelte-1mqt63g.svelte-1mqt63g>li.svelte-1mqt63g.svelte-1mqt63g{position:relative;-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;overflow:hidden;text-align:left;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch}.carousel.dots.dotsBelow.filled.svelte-1mqt63g.svelte-1mqt63g.svelte-1mqt63g{padding-bottom:40px}.carousel.filled.svelte-1mqt63g.svelte-1mqt63g>.carousel-inner.svelte-1mqt63g.svelte-1mqt63g{background-color:transparent}.carousel.dotsBelow.svelte-1mqt63g.svelte-1mqt63g .carousel-dots.svelte-1mqt63g.svelte-1mqt63g{bottom:0}.carousel.dotsBelow.svelte-1mqt63g.svelte-1mqt63g .carousel-dots li.svelte-1mqt63g.svelte-1mqt63g{background-color:rgba(var(--theme-bg-color-opposite))}.carousel.stretch.svelte-1mqt63g>.carousel-inner.svelte-1mqt63g>.fluid.svelte-1mqt63g{-webkit-box-flex:0;-ms-flex:none;flex:none;width:100%}.carousel.auto.svelte-1mqt63g>.carousel-inner.svelte-1mqt63g>.fluid.svelte-1mqt63g{width:auto}.carousel.svelte-1mqt63g.svelte-1mqt63g.svelte-1mqt63g{width:100%}.carousel-inner.svelte-1mqt63g.svelte-1mqt63g.svelte-1mqt63g::-webkit-scrollbar{display:none}.carousel.svelte-1mqt63g.svelte-1mqt63g>.carousel-inner.svelte-1mqt63g.svelte-1mqt63g{width:100%;overflow-y:hidden;overflow-x:scroll;background-color:rgba(var(--theme-bg-color-opposite), .04)}.carousel-dots.svelte-1mqt63g.svelte-1mqt63g.svelte-1mqt63g{position:absolute;left:0;bottom:10px;width:100%;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;justify-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;pointer-events:none}.carousel-dots.svelte-1mqt63g.svelte-1mqt63g li.svelte-1mqt63g.svelte-1mqt63g{position:relative;width:8px;height:8px;margin:5px;border-radius:50%;overflow:hidden;-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary);background-color:rgba(var(--color-light))}.carousel-dots.svelte-1mqt63g.svelte-1mqt63g li.svelte-1mqt63g.svelte-1mqt63g:not(.active){opacity:.5}.carousel-dots.svelte-1mqt63g.svelte-1mqt63g li.active.svelte-1mqt63g.svelte-1mqt63g{-webkit-transform:scale(1.5);transform:scale(1.5)}",
	map: "{\"version\":3,\"file\":\"Carousel.svelte\",\"sources\":[\"Carousel.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { waitUntil, classnames } from '@utils'\\n    import Picture from '@components/Picture.svelte'\\n    import FancyBox from '@components/FancyBox.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    /**\\n     *\\n     * @type {number | {\\n     *     src: string,\\n     *     srcBig: string,\\n     *     alt: string,\\n     *     onClick?: function,\\n     * }[]}\\n     */\\n    export let items = []\\n    export let dots = true\\n    export let dotsBelow = true\\n    export let rounded = true\\n    export let size = 'stretch'\\n    export let initIndex = 0\\n    export let disableFancy = false\\n    export let stopPropagation = undefined\\n\\n    let parent = null\\n\\n    $: activeDot = initIndex\\n    $: classProp = classnames('carousel', size, $$props.class, { dots, dotsBelow, rounded, filled: items && items.length })\\n    $: setScrollPosition(parent, initIndex)\\n\\n    function carousel(node) {\\n        node.ontouchstart = e => stopPropagation && (e.stopPropagation())\\n        node.ontouchmove = e => stopPropagation && (e.stopPropagation())\\n        node.ontouchend = e => stopPropagation && (e.stopPropagation())\\n\\n        parent = node\\n        setScrollPosition(node, activeDot)\\n        node.addEventListener('scroll', onScroll)\\n        return { \\n            destroy: () => {\\n                node.removeEventListener('scroll', onScroll)\\n                node.ontouchstart= null\\n                node.ontouchmove= null\\n                node.ontouchend= null\\n            }\\n        }\\n    }\\n\\n    function onScroll(e) {\\n        try {\\n            getActiveDot(e.target)\\n        } catch (err) { console.warn('Carousel does not work.', err) }\\n    }\\n\\n    function getActiveDot(parent) {\\n        const { scrollLeft, scrollWidth, offsetWidth } = parent\\n        const dotAmount = Array.from(parent.children).length\\n        const scrollX = scrollLeft / (scrollWidth - offsetWidth)\\n        const newActiveDot = Math.round(scrollX * (dotAmount - 1))\\n        if (activeDot !== newActiveDot && !isNaN(newActiveDot)) activeDot = newActiveDot\\n    }\\n\\n    function setScrollPosition(parent, activeDot) {\\n        if (!parent) return\\n        const { width } = parent.getBoundingClientRect()\\n        waitUntil(() => {\\n            parent.scrollLeft = Math.round(width * activeDot)\\n            if (parent.scrollLeft !== Math.round(width * activeDot)) {\\n              throw new Error('Not set.')\\n            }\\n        }, { interval: 50 })\\n    }\\n\\n    function onClick(item, index, e) {\\n        dispatch('click', { item, index, e })\\n        if (typeof item.onClick === 'function') item.onClick(item, index, e)\\n    }\\n\\n</script>\\n\\n<section aria-label=\\\"carousel\\\" class={classProp}>\\n    <ul \\n        use:carousel\\n        class=\\\"carousel-inner scroll-x-center\\\"\\n    >\\n        {#if items !== null}\\n            {#each items as item, index}\\n                <li class=\\\"fluid\\\" role=\\\"button\\\" on:click={onClick.bind(null, item, index)}>\\n                    <slot {item} {index}>\\n                        <FancyBox disabled={disableFancy}>\\n                            <Picture key=\\\"picture\\\" {...item} alt={item.alt || 'Фото слайду'}/>\\n                            <section slot=\\\"box\\\" class=\\\"flex full-width\\\">\\n                                <Picture key=\\\"picture\\\" {...item} alt={item.alt || 'Фото слайду'}/>\\n                            </section>\\n                        </FancyBox>\\n                    </slot>\\n                </li>\\n            {/each}\\n        {/if}\\n    </ul>\\n\\n\\n    {#if dots && Array.isArray(items)}\\n        <ul class=\\\"carousel-dots\\\">\\n            {#each items as _item, i}\\n                <li class={i === activeDot ? 'active' : ''}></li>\\n            {/each}\\n        </ul>\\n    {/if}\\n</section>\\n\\n<style>\\n    .carousel.rounded > .carousel-inner {\\n       border-radius: var(--border-radius-big);\\n    }\\n\\n    .carousel, .carousel-inner, .carousel-inner > li {\\n        position: relative;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow: hidden;\\n        text-align: left;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n    }\\n\\n    .carousel.dots.dotsBelow.filled {\\n        padding-bottom: 40px;\\n    }\\n\\n    .carousel.filled > .carousel-inner {\\n        background-color: transparent;\\n    }\\n\\n    .carousel.dotsBelow .carousel-dots {\\n        bottom: 0;\\n    }\\n\\n    .carousel.dotsBelow .carousel-dots li {\\n        background-color: rgba(var(--theme-bg-color-opposite));\\n    }\\n\\n    .carousel.stretch > .carousel-inner > .fluid {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        width: 100%;\\n    }\\n\\n    .carousel.auto > .carousel-inner > .fluid {\\n        width: auto;\\n    }\\n\\n    .carousel {\\n        width: 100%;\\n    }\\n\\n    .carousel-inner::-webkit-scrollbar {\\n        display: none;\\n    }\\n\\n    .carousel > .carousel-inner {\\n        width: 100%;\\n        overflow-y: hidden;\\n        overflow-x: scroll;\\n        background-color: rgba(var(--theme-bg-color-opposite), .04);\\n    }\\n\\n    .carousel-dots {\\n        position: absolute;\\n        left: 0;\\n        bottom: 10px;\\n        width: 100%;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        justify-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        pointer-events: none;\\n    }\\n\\n    .carousel-dots li {\\n        position: relative;\\n        width: 8px;\\n        height: 8px;\\n        margin: 5px;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n        background-color: rgba(var(--color-light));\\n    }\\n\\n    .carousel-dots li:not(.active) {\\n        opacity: .5;\\n    }\\n\\n    .carousel-dots li.active {\\n        -webkit-transform: scale(1.5);\\n                transform: scale(1.5);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0Nhcm91c2VsLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7T0FDRyx1Q0FBdUM7SUFDMUM7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLGdCQUFnQjtRQUNoQixnQkFBZ0I7UUFDaEIsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiwwQkFBb0I7WUFBcEIsdUJBQW9CO2dCQUFwQixvQkFBb0I7UUFDcEIseUJBQXdCO1lBQXhCLHNCQUF3QjtnQkFBeEIsd0JBQXdCO0lBQzVCOztJQUVBO1FBQ0ksb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksNkJBQTZCO0lBQ2pDOztJQUVBO1FBQ0ksU0FBUztJQUNiOztJQUVBO1FBQ0ksc0RBQXNEO0lBQzFEOztJQUVBO1FBQ0ksbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxhQUFhO0lBQ2pCOztJQUVBO1FBQ0ksV0FBVztRQUNYLGtCQUFrQjtRQUNsQixrQkFBa0I7UUFDbEIsMkRBQTJEO0lBQy9EOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLE9BQU87UUFDUCxZQUFZO1FBQ1osV0FBVztRQUNYLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHFCQUFxQjtRQUNyQix3QkFBdUI7WUFBdkIscUJBQXVCO2dCQUF2Qix1QkFBdUI7UUFDdkIsb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLFVBQVU7UUFDVixXQUFXO1FBQ1gsV0FBVztRQUNYLGtCQUFrQjtRQUNsQixnQkFBZ0I7UUFDaEIseUNBQWlDO2dCQUFqQyxpQ0FBaUM7UUFDakMsMENBQTBDO0lBQzlDOztJQUVBO1FBQ0ksV0FBVztJQUNmOztJQUVBO1FBQ0ksNkJBQXFCO2dCQUFyQixxQkFBcUI7SUFDekIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvQ2Fyb3VzZWwuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLmNhcm91c2VsLnJvdW5kZWQgPiAuY2Fyb3VzZWwtaW5uZXIge1xuICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtYmlnKTtcbiAgICB9XG5cbiAgICAuY2Fyb3VzZWwsIC5jYXJvdXNlbC1pbm5lciwgLmNhcm91c2VsLWlubmVyID4gbGkge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLmRvdHMuZG90c0JlbG93LmZpbGxlZCB7XG4gICAgICAgIHBhZGRpbmctYm90dG9tOiA0MHB4O1xuICAgIH1cblxuICAgIC5jYXJvdXNlbC5maWxsZWQgPiAuY2Fyb3VzZWwtaW5uZXIge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcbiAgICB9XG5cbiAgICAuY2Fyb3VzZWwuZG90c0JlbG93IC5jYXJvdXNlbC1kb3RzIHtcbiAgICAgICAgYm90dG9tOiAwO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbC5kb3RzQmVsb3cgLmNhcm91c2VsLWRvdHMgbGkge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yLW9wcG9zaXRlKSk7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLnN0cmV0Y2ggPiAuY2Fyb3VzZWwtaW5uZXIgPiAuZmx1aWQge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICB9XG5cbiAgICAuY2Fyb3VzZWwuYXV0byA+IC5jYXJvdXNlbC1pbm5lciA+IC5mbHVpZCB7XG4gICAgICAgIHdpZHRoOiBhdXRvO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbC1pbm5lcjo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbCA+IC5jYXJvdXNlbC1pbm5lciB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBvdmVyZmxvdy15OiBoaWRkZW47XG4gICAgICAgIG92ZXJmbG93LXg6IHNjcm9sbDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvci1vcHBvc2l0ZSksIC4wNCk7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLWRvdHMge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIGJvdHRvbTogMTBweDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktaXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgIH1cblxuICAgIC5jYXJvdXNlbC1kb3RzIGxpIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICB3aWR0aDogOHB4O1xuICAgICAgICBoZWlnaHQ6IDhweDtcbiAgICAgICAgbWFyZ2luOiA1cHg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LXByaW1hcnkpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWxpZ2h0KSk7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLWRvdHMgbGk6bm90KC5hY3RpdmUpIHtcbiAgICAgICAgb3BhY2l0eTogLjU7XG4gICAgfVxuXG4gICAgLmNhcm91c2VsLWRvdHMgbGkuYWN0aXZlIHtcbiAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxLjUpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAkHI,SAAS,sCAAQ,CAAG,eAAe,8BAAC,CAAC,AAClC,aAAa,CAAE,IAAI,mBAAmB,CAAC,AAC1C,CAAC,AAED,sDAAS,CAAE,4DAAe,CAAE,6CAAe,CAAG,EAAE,8BAAC,CAAC,AAC9C,QAAQ,CAAE,QAAQ,CAClB,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,IAAI,CAChB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,AACpC,CAAC,AAED,SAAS,KAAK,UAAU,OAAO,6CAAC,CAAC,AAC7B,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,SAAS,qCAAO,CAAG,eAAe,8BAAC,CAAC,AAChC,gBAAgB,CAAE,WAAW,AACjC,CAAC,AAED,SAAS,wCAAU,CAAC,cAAc,8BAAC,CAAC,AAChC,MAAM,CAAE,CAAC,AACb,CAAC,AAED,SAAS,wCAAU,CAAC,cAAc,CAAC,EAAE,8BAAC,CAAC,AACnC,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,AAC1D,CAAC,AAED,SAAS,uBAAQ,CAAG,8BAAe,CAAG,MAAM,eAAC,CAAC,AAC1C,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,KAAK,CAAE,IAAI,AACf,CAAC,AAED,SAAS,oBAAK,CAAG,8BAAe,CAAG,MAAM,eAAC,CAAC,AACvC,KAAK,CAAE,IAAI,AACf,CAAC,AAED,SAAS,6CAAC,CAAC,AACP,KAAK,CAAE,IAAI,AACf,CAAC,AAED,4DAAe,mBAAmB,AAAC,CAAC,AAChC,OAAO,CAAE,IAAI,AACjB,CAAC,AAED,uCAAS,CAAG,eAAe,8BAAC,CAAC,AACzB,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,MAAM,CAClB,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC/D,CAAC,AAED,cAAc,6CAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,aAAa,CAAE,MAAM,CACrB,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,4CAAc,CAAC,EAAE,8BAAC,CAAC,AACf,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,MAAM,CAAE,GAAG,CACX,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACzC,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,AAC9C,CAAC,AAED,4CAAc,CAAC,gCAAE,KAAK,OAAO,CAAC,AAAC,CAAC,AAC5B,OAAO,CAAE,EAAE,AACf,CAAC,AAED,4CAAc,CAAC,EAAE,OAAO,8BAAC,CAAC,AACtB,iBAAiB,CAAE,MAAM,GAAG,CAAC,CACrB,SAAS,CAAE,MAAM,GAAG,CAAC,AACjC,CAAC\"}"
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
	$$result.css.add(css$d);
	let activeDot = initIndex;

	let classProp = classnames("carousel", size, $$props.class, {
		dots,
		dotsBelow,
		rounded,
		filled: items && items.length
	});

	 {
		setScrollPosition(parent, initIndex);
	}

	return `<section aria-label="${"carousel"}" class="${escape(null_to_empty(classProp)) + " svelte-1mqt63g"}">
    <ul class="${"carousel-inner scroll-x-center svelte-1mqt63g"}">
        ${items !== null
	? `${each(items, (item, index) => `<li class="${"fluid svelte-1mqt63g"}" role="${"button"}">
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
	? `<ul class="${"carousel-dots svelte-1mqt63g"}">
            ${each(items, (_item, i) => `<li class="${escape(null_to_empty(i === activeDot ? "active" : "")) + " svelte-1mqt63g"}"></li>`)}
        </ul>`
	: ``}
</section>`;
});

/* src/components/EditArea.svelte generated by Svelte v3.18.1 */

const css$e = {
	code: ".edit-area.svelte-12fpoxx{--color-bg:rgba(var(--theme-color-primary-opposite), .1);--color-lines:rgba(var(--theme-color-primary-opposite));padding:0 var(--screen-padding);background-image:-webkit-gradient(linear, left top, right top, color-stop(50%, var(--color-lines)), color-stop(0%, rgba(var(--color-black), 0))),\n                          -webkit-gradient(linear, left top, right top, color-stop(50%, var(--color-lines)), color-stop(0%, rgba(var(--color-black), 0)));background-image:linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%),\n                          linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%);background-color:var(--color-bg);background-position:top, bottom;background-size:20px 1px;background-repeat:repeat-x}.edit-area.svelte-12fpoxx:not(.off)>*{pointer-events:none}.edit-area.off.svelte-12fpoxx{background:none}.edit-area.svelte-12fpoxx:not(.off) *:not(.no-filter){-webkit-filter:grayscale(100%);filter:grayscale(100%)}",
	map: "{\"version\":3,\"file\":\"EditArea.svelte\",\"sources\":[\"EditArea.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '@utils'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    import Br from './Br.svelte'\\n    import Icon from './Icon.svelte'\\n    import Button from './Button.svelte'\\n\\n    export let off = false\\n\\n    $: classProp = classnames('edit-area', $$props.class, { off })\\n\\n    function onClick(e) {\\n        if (!off) {\\n            dispatch('click', e)\\n        }\\n    }\\n</script>\\n\\n<section role=\\\"button\\\" class={classProp} on:click={onClick}>\\n    <slot></slot>\\n\\n    {#if !off}\\n        <Br size=\\\"30\\\"/>\\n        <Button size=\\\"small\\\" is=\\\"info\\\" class=\\\"no-filter\\\">\\n            <span class=\\\"h3 font-secondary font-w-500 flex flex-align-center\\\">\\n                Редагувати\\n                <s></s>\\n                <s></s>\\n                <Icon type=\\\"edit\\\" size=\\\"small\\\" is=\\\"light\\\"/>\\n            </span>\\n        </Button>\\n        <Br size=\\\"40\\\"/>\\n    {/if}\\n</section>\\n\\n<style>\\n    .edit-area {\\n        --color-bg: rgba(var(--theme-color-primary-opposite), .1);\\n        --color-lines: rgba(var(--theme-color-primary-opposite));\\n\\n        padding: 0 var(--screen-padding);\\n        background-image: -webkit-gradient(linear, left top, right top, color-stop(50%, var(--color-lines)), color-stop(0%, rgba(var(--color-black), 0))),\\n                          -webkit-gradient(linear, left top, right top, color-stop(50%, var(--color-lines)), color-stop(0%, rgba(var(--color-black), 0)));\\n        background-image: linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%),\\n                          linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%);\\n        background-color: var(--color-bg);\\n        background-position: top, bottom;\\n        background-size: 20px 1px;\\n        background-repeat: repeat-x;\\n    }\\n\\n    .edit-area:not(.off) > :global(*) {\\n        pointer-events: none;\\n    }\\n\\n    .edit-area.off {\\n        background: none;\\n    }\\n\\n    .edit-area:not(.off) :global(*:not(.no-filter)) {\\n        -webkit-filter: grayscale(100%);\\n                filter: grayscale(100%);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0VkaXRBcmVhLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSx5REFBeUQ7UUFDekQsd0RBQXdEOztRQUV4RCxnQ0FBZ0M7UUFDaEM7eUpBQ21HO1FBRG5HOzJHQUNtRztRQUNuRyxpQ0FBaUM7UUFDakMsZ0NBQWdDO1FBQ2hDLHlCQUF5QjtRQUN6QiwyQkFBMkI7SUFDL0I7O0lBRUE7UUFDSSxvQkFBb0I7SUFDeEI7O0lBRUE7UUFDSSxnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSwrQkFBdUI7Z0JBQXZCLHVCQUF1QjtJQUMzQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9FZGl0QXJlYS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuZWRpdC1hcmVhIHtcbiAgICAgICAgLS1jb2xvci1iZzogcmdiYSh2YXIoLS10aGVtZS1jb2xvci1wcmltYXJ5LW9wcG9zaXRlKSwgLjEpO1xuICAgICAgICAtLWNvbG9yLWxpbmVzOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnktb3Bwb3NpdGUpKTtcblxuICAgICAgICBwYWRkaW5nOiAwIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCB2YXIoLS1jb2xvci1saW5lcykgNTAlLCByZ2JhKHZhcigtLWNvbG9yLWJsYWNrKSwgMCkgMCUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIHZhcigtLWNvbG9yLWxpbmVzKSA1MCUsIHJnYmEodmFyKC0tY29sb3ItYmxhY2spLCAwKSAwJSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbG9yLWJnKTtcbiAgICAgICAgYmFja2dyb3VuZC1wb3NpdGlvbjogdG9wLCBib3R0b207XG4gICAgICAgIGJhY2tncm91bmQtc2l6ZTogMjBweCAxcHg7XG4gICAgICAgIGJhY2tncm91bmQtcmVwZWF0OiByZXBlYXQteDtcbiAgICB9XG5cbiAgICAuZWRpdC1hcmVhOm5vdCgub2ZmKSA+IDpnbG9iYWwoKikge1xuICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICB9XG5cbiAgICAuZWRpdC1hcmVhLm9mZiB7XG4gICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgfVxuXG4gICAgLmVkaXQtYXJlYTpub3QoLm9mZikgOmdsb2JhbCgqOm5vdCgubm8tZmlsdGVyKSkge1xuICAgICAgICBmaWx0ZXI6IGdyYXlzY2FsZSgxMDAlKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAuCI,UAAU,eAAC,CAAC,AACR,UAAU,CAAE,6CAA6C,CACzD,aAAa,CAAE,yCAAyC,CAExD,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAChC,gBAAgB,CAAE,iBAAiB,MAAM,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,WAAW,GAAG,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,WAAW,EAAE,CAAC,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;0BAChI,iBAAiB,MAAM,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,WAAW,GAAG,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,WAAW,EAAE,CAAC,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACjJ,gBAAgB,CAAE,gBAAgB,EAAE,CAAC,KAAK,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,GAAG,CAAC,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC;0BAClF,gBAAgB,EAAE,CAAC,KAAK,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,GAAG,CAAC,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CACnG,gBAAgB,CAAE,IAAI,UAAU,CAAC,CACjC,mBAAmB,CAAE,GAAG,CAAC,CAAC,MAAM,CAChC,eAAe,CAAE,IAAI,CAAC,GAAG,CACzB,iBAAiB,CAAE,QAAQ,AAC/B,CAAC,AAED,yBAAU,KAAK,IAAI,CAAC,CAAW,CAAC,AAAE,CAAC,AAC/B,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,UAAU,IAAI,eAAC,CAAC,AACZ,UAAU,CAAE,IAAI,AACpB,CAAC,AAED,yBAAU,KAAK,IAAI,CAAC,CAAC,AAAQ,iBAAiB,AAAE,CAAC,AAC7C,cAAc,CAAE,UAAU,IAAI,CAAC,CACvB,MAAM,CAAE,UAAU,IAAI,CAAC,AACnC,CAAC\"}"
};

const EditArea = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { off = false } = $$props;

	if ($$props.off === void 0 && $$bindings.off && off !== void 0) $$bindings.off(off);
	$$result.css.add(css$e);
	let classProp = classnames("edit-area", $$props.class, { off });

	return `<section role="${"button"}" class="${escape(null_to_empty(classProp)) + " svelte-12fpoxx"}">
    ${$$slots.default ? $$slots.default({}) : ``}

    ${!off
	? `${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
        ${validate_component(Button, "Button").$$render(
			$$result,
			{
				size: "small",
				is: "info",
				class: "no-filter"
			},
			{},
			{
				default: () => `
            <span class="${"h3 font-secondary font-w-500 flex flex-align-center"}">
                Редагувати
                <s></s>
                <s></s>
                ${validate_component(Icon, "Icon").$$render($$result, { type: "edit", size: "small", is: "light" }, {}, {})}
            </span>
        `
			}
		)}
        ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}`
	: ``}
</section>`;
});

/* src/components/EditCard.svelte generated by Svelte v3.18.1 */

const EditCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { form } = $$props;

	if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
	let classProp = classnames("edit-area-container container", $$props.class);

	return `${validate_component(Card, "Card").$$render($$result, { class: classProp }, {}, {
		default: () => `
    ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}

    ${$$slots.default ? $$slots.default({}) : ``}

    ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}

    <section class="${"flex flex-align-center"}">
        <div style="${"flex: 1 1 50%"}">
            ${validate_component(Button, "Button").$$render($$result, { size: "small", is: "dark-border" }, {}, {
			default: () => `
                <span class="${"h3 font-secondary font-w-500 flex flex-align-center"}">
                    Скасувати
                </span>
            `
		})}
        </div>
        <s></s>
        <s></s>
        <s></s>
        <div style="${"flex: 1 1 50%"}">
            ${validate_component(Button, "Button").$$render(
			$$result,
			{
				form,
				size: "small",
				type: "submit",
				is: "info"
			},
			{},
			{
				default: () => `
                <span class="${"h3 font-secondary font-w-500 flex flex-align-center"}">
                    Зберегти
                </span>
            `
			}
		)}
        </div>
    </section>

    ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}
`
	})}`;
});

/* src/components/LazyToggle.svelte generated by Svelte v3.18.1 */

const css$f = {
	code: ".lazy-toggle.hidden.svelte-1rawncz{display:none}.lazy-toggle.invisible.svelte-1rawncz{visibility:hidden}",
	map: "{\"version\":3,\"file\":\"LazyToggle.svelte\",\"sources\":[\"LazyToggle.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '@utils'\\n\\n    export let active = false\\n    export let visible = true\\n    export let mounted = false\\n\\n    let isMounted = mounted\\n\\n    $: classProp = classnames('lazy-toggle flex-1', $$props.class, { hidden: !active, invisible: !visible })\\n    $: if (active && !isMounted) isMounted = true\\n</script>\\n\\n<section class={classProp}>\\n    {#if isMounted}\\n        <slot></slot>\\n    {/if}\\n</section>\\n\\n<style>\\n    .lazy-toggle.hidden {\\n        display: none;\\n    }\\n\\n    .lazy-toggle.invisible {\\n        visibility: hidden;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0xhenlUb2dnbGUuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGFBQWE7SUFDakI7O0lBRUE7UUFDSSxrQkFBa0I7SUFDdEIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvTGF6eVRvZ2dsZS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAubGF6eS10b2dnbGUuaGlkZGVuIHtcbiAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICB9XG5cbiAgICAubGF6eS10b2dnbGUuaW52aXNpYmxlIHtcbiAgICAgICAgdmlzaWJpbGl0eTogaGlkZGVuO1xuICAgIH1cbiJdfQ== */</style>\"],\"names\":[],\"mappings\":\"AAoBI,YAAY,OAAO,eAAC,CAAC,AACjB,OAAO,CAAE,IAAI,AACjB,CAAC,AAED,YAAY,UAAU,eAAC,CAAC,AACpB,UAAU,CAAE,MAAM,AACtB,CAAC\"}"
};

const LazyToggle = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { active = false } = $$props;
	let { visible = true } = $$props;
	let { mounted = false } = $$props;
	let isMounted = mounted;
	if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);
	if ($$props.visible === void 0 && $$bindings.visible && visible !== void 0) $$bindings.visible(visible);
	if ($$props.mounted === void 0 && $$bindings.mounted && mounted !== void 0) $$bindings.mounted(mounted);
	$$result.css.add(css$f);
	let classProp = classnames("lazy-toggle flex-1", $$props.class, { hidden: !active, invisible: !visible });

	 {
		if (active && !isMounted) isMounted = true;
	}

	return `<section class="${escape(null_to_empty(classProp)) + " svelte-1rawncz"}">
    ${isMounted
	? `${$$slots.default ? $$slots.default({}) : ``}`
	: ``}
</section>`;
});

/* src/components/loader/Text.svelte generated by Svelte v3.18.1 */

const Text = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<rect x="${"0"}" y="${"10%"}" rx="${"3"}" ry="${"3"}" width="${"100%"}" height="${"80%"}"></rect>`;
});

/* src/components/loader/Circle.svelte generated by Svelte v3.18.1 */

const Circle = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<circle cx="${"50%"}" cy="${"50%"}" r="${"50%"}"></circle>`;
});

/* src/components/loader/Loader.svelte generated by Svelte v3.18.1 */

const css$g = {
	code: ".loader.svelte-175toc4.svelte-175toc4{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;-ms-flex-item-align:stretch;align-self:stretch;-webkit-transform:translateZ(0);transform:translateZ(0)}.loader.svelte-175toc4 svg.svelte-175toc4{-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;-ms-flex-item-align:stretch;align-self:stretch;-webkit-transform:translateZ(0);transform:translateZ(0)}.loader.absolute.svelte-175toc4.svelte-175toc4{position:absolute;top:0;left:0;right:0;bottom:0}.loader.border.svelte-175toc4.svelte-175toc4{outline-width:1px;outline-style:solid}",
	map: "{\"version\":3,\"file\":\"Loader.svelte\",\"sources\":[\"Loader.svelte\"],\"sourcesContent\":[\"<script>\\n    // How to make a custom loader?\\n    // See here for generating: https://danilowoz.com/create-content-loader/\\n    \\n    import { onMount } from 'svelte'\\n    import { classnames, uuid } from '@utils'\\n    import Text from './Text.svelte'\\n    import Circle from './Circle.svelte'\\n\\n    export let width = '100%' \\n    export let height = '100%'\\n    export let light = '#999999';\\n    export let dark = '#555555';\\n    export let opacity = .2;\\n    export let border = false;\\n    export let absolute = false;\\n    export let type = undefined; // h1, h2, h3, h4, h5, h6, p, pre, avatar\\n\\n    const uid = uuid()\\n\\n    let hTypes = {\\n        p: 21,\\n        h1: 35,\\n        h2: 29,\\n        h3: 26,\\n        h4: 21,\\n        h5: 21,\\n        h6: 21,\\n        pre: 21,\\n    }\\n\\n    onMount(() => {\\n        const style = getComputedStyle(document.body);\\n        const lh = Number.parseInt(style.getPropertyValue('line-height'))\\n        const balance = 0\\n\\n        hTypes = {\\n            p: lh * 1.15 + balance,\\n            h1: lh * 1.85 + balance,\\n            h2: lh * 1.4 + balance,\\n            h3: lh * 1.3 + balance,\\n            h4: lh * 1.15 + balance,\\n            h5: lh * 1.15 + balance,\\n            h6: lh * 1.15 + balance,\\n            pre: lh * 1.15 + balance,\\n        }\\n    })\\n\\n    $: areaWidth = width.replace('%', '')\\n    $: areaHeight = hTypes[type] || height\\n    $: classProp = classnames('loader', { border, absolute })\\n</script>\\n\\n<section \\n    class={classProp}\\n    style={`opacity: ${opacity}; outline-color: ${light};`}\\n>\\n    <svg\\n        role=\\\"img\\\"\\n        width=\\\"100%\\\"\\n        height={areaHeight}\\n        aria-labelledby=\\\"loading-aria\\\"\\n        viewBox={`0 0 ${areaWidth} 100`}\\n        preserveAspectRatio=\\\"none\\\"\\n    >\\n        <title id=\\\"loading-aria\\\">Loading...</title>\\n        <rect\\n            x=\\\"0\\\"\\n            y=\\\"0\\\"\\n            width=\\\"100%\\\"\\n            height=\\\"100%\\\"\\n            clip-path={`url(#clip-path-${uid})`}\\n            style='fill: url(\\\"#loader-fill\\\");'\\n        ></rect>\\n        <defs>\\n            <clipPath id={`clip-path-${uid}`}>\\n                <slot>\\n                    {#if 'avatar'.includes(type)}\\n                        <Circle/>\\n                    {:else if 'h1,h2,h3,h4,h5,h6,p,pre'.includes(type)}\\n                        <Text/>\\n                    {:else}\\n                        <rect x=\\\"0\\\" y=\\\"0\\\" rx=\\\"3\\\" ry=\\\"3\\\" width=\\\"100%\\\" height=\\\"100%\\\" />\\n                    {/if}\\n                </slot>\\n            </clipPath>\\n            <linearGradient id=\\\"loader-fill\\\">\\n                <stop\\n                    offset=\\\"0.599964\\\"\\n                    stop-color={light}\\n                    stop-opacity=\\\"1\\\"\\n                >\\n                    <animate\\n                    attributeName=\\\"offset\\\"\\n                    values=\\\"-2; -2; 1\\\"\\n                    keyTimes=\\\"0; 0.25; 1\\\"\\n                    dur=\\\"2s\\\"\\n                    repeatCount=\\\"indefinite\\\"\\n                    ></animate>\\n                </stop>\\n                <stop\\n                    offset=\\\"1.59996\\\"\\n                    stop-color={dark}\\n                    stop-opacity=\\\"1\\\"\\n                >\\n                    <animate\\n                    attributeName=\\\"offset\\\"\\n                    values=\\\"-1; -1; 2\\\"\\n                    keyTimes=\\\"0; 0.25; 1\\\"\\n                    dur=\\\"2s\\\"\\n                    repeatCount=\\\"indefinite\\\"\\n                    ></animate>\\n                </stop>\\n                <stop\\n                    offset=\\\"2.59996\\\"\\n                    stop-color={light}\\n                    stop-opacity=\\\"1\\\"\\n                >\\n                    <animate\\n                    attributeName=\\\"offset\\\"\\n                    values=\\\"0; 0; 3\\\"\\n                    keyTimes=\\\"0; 0.25; 1\\\"\\n                    dur=\\\"2s\\\"\\n                    repeatCount=\\\"indefinite\\\"\\n                    ></animate>\\n                </stop>\\n            </linearGradient>\\n        </defs>\\n    </svg>\\n</section>\\n\\n<style>\\n    .loader {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n    }\\n\\n    .loader svg {\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n    }\\n\\n    .loader.absolute {\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        right: 0;\\n        bottom: 0;\\n    }\\n\\n    .loader.border {\\n        outline-width: 1px;\\n        outline-style: solid;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2xvYWRlci9Mb2FkZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IsbUJBQWM7WUFBZCxrQkFBYztnQkFBZCxjQUFjO1FBQ2QsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQixnQ0FBd0I7Z0JBQXhCLHdCQUF3QjtJQUM1Qjs7SUFFQTtRQUNJLG1CQUFjO1lBQWQsa0JBQWM7Z0JBQWQsY0FBYztRQUNkLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsZ0NBQXdCO2dCQUF4Qix3QkFBd0I7SUFDNUI7O0lBRUE7UUFDSSxrQkFBa0I7UUFDbEIsTUFBTTtRQUNOLE9BQU87UUFDUCxRQUFRO1FBQ1IsU0FBUztJQUNiOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLG9CQUFvQjtJQUN4QiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9sb2FkZXIvTG9hZGVyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5sb2FkZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVaKDApO1xuICAgIH1cblxuICAgIC5sb2FkZXIgc3ZnIHtcbiAgICAgICAgZmxleDogMSAxIGF1dG87XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTtcbiAgICB9XG5cbiAgICAubG9hZGVyLmFic29sdXRlIHtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIHJpZ2h0OiAwO1xuICAgICAgICBib3R0b206IDA7XG4gICAgfVxuXG4gICAgLmxvYWRlci5ib3JkZXIge1xuICAgICAgICBvdXRsaW5lLXdpZHRoOiAxcHg7XG4gICAgICAgIG91dGxpbmUtc3R5bGU6IHNvbGlkO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AAoII,OAAO,8BAAC,CAAC,AACL,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,AACpC,CAAC,AAED,sBAAO,CAAC,GAAG,eAAC,CAAC,AACT,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,AACpC,CAAC,AAED,OAAO,SAAS,8BAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,AACb,CAAC,AAED,OAAO,OAAO,8BAAC,CAAC,AACZ,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,KAAK,AACxB,CAAC\"}"
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
	$$result.css.add(css$g);
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

/* src/components/FieldErrors.svelte generated by Svelte v3.18.1 */

const FieldErrors = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	let list = [].concat(items || []).slice(0, 1).filter(Boolean);

	return `${list && list.length
	? `${$$slots.before ? $$slots.before({}) : ``}
    <ul${add_attribute("class", `font-primary font-w-500 h4 text-danger text-left ${$$props.class || ""}`, 0)}>
        ${each(list, item => `<li>* ${escape(item)}</li>`)}
    </ul>
    ${$$slots.after ? $$slots.after({}) : ``}`
	: ``}`;
});

/* src/components/fields/Input.svelte generated by Svelte v3.18.1 */

const css$h = {
	code: ".inp.svelte-txe5nr.svelte-txe5nr{width:100%;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.inp.svelte-txe5nr .inp-inner-wrap.svelte-txe5nr{position:relative;display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-shadow:var(--shadow-field-inset);box-shadow:var(--shadow-field-inset);border-radius:var(--border-radius-small);background-color:rgba(var(--theme-bg-color))}.inp.svelte-txe5nr .inp-inner.svelte-txe5nr{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;color:inherit;overflow-y:auto;overflow-x:hidden;background-color:transparent;-webkit-overflow-scrolling:touch;min-width:var(--min-interactive-size);min-height:var(--min-interactive-size);border-radius:var(--border-radius-small)}.inp.disabled.svelte-txe5nr.svelte-txe5nr{opacity:.5;pointer-events:none}.inp.postIcon.svelte-txe5nr .inp-inner.svelte-txe5nr{padding-right:var(--min-interactive-size)}.inp.svelte-txe5nr .inp-inner.svelte-txe5nr:invalid,.inp.error.svelte-txe5nr .inp-inner.svelte-txe5nr{-webkit-box-shadow:0 0 0 1px rgb(var(--color-danger));box-shadow:0 0 0 1px rgb(var(--color-danger));color:rgb(var(--color-danger))}.inp.svelte-txe5nr .inp-inner.svelte-txe5nr:focus{-webkit-box-shadow:0 0 0 1px rgb(var(--color-info));box-shadow:0 0 0 1px rgb(var(--color-info));color:rgb(var(--color-info))}.inp .inp-inner:invalid+.inp-post-icon.svelte-txe5nr.svelte-txe5nr .ico,.inp.error.svelte-txe5nr .inp-post-icon.svelte-txe5nr .ico{color:rgb(var(--color-danger)) !important}.inp .inp-inner:focus+.inp-post-icon.svelte-txe5nr.svelte-txe5nr .ico{color:rgb(var(--color-info)) !important}.inp.svelte-txe5nr .inp-post-icon-inner.svelte-txe5nr{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:var(--min-interactive-size)}.inp.svelte-txe5nr .inp-post-icon.svelte-txe5nr{position:absolute;top:0;right:0;height:100%;width:var(--min-interactive-size);-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;overflow:hidden}.inp.svelte-txe5nr .inp-inner.svelte-txe5nr::-webkit-input-placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}.inp.svelte-txe5nr .inp-inner.svelte-txe5nr::-moz-placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}.inp.svelte-txe5nr .inp-inner.svelte-txe5nr:-ms-input-placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}.inp.svelte-txe5nr .inp-inner.svelte-txe5nr::-ms-input-placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}.inp.svelte-txe5nr .inp-inner.svelte-txe5nr::placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}",
	map: "{\"version\":3,\"file\":\"Input.svelte\",\"sources\":[\"Input.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '@utils'\\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import FieldErrors from '@components/FieldErrors.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let name\\n    export let value = ''\\n    export let style = {}\\n    export let type = 'text'\\n    export let id = undefined\\n    export let min = undefined // Specifies a minimum value for an <input> element\\n    export let max = undefined // Specifies the maximum value for an <input> element\\n    export let list = undefined // Refers to a <datalist> element that contains pre-defined options for an <input> element\\n    export let form = undefined // Specifies the form the <input> element belongs to\\n    export let maxlength = 1000\\n    export let disabled = false\\n    export let rows = undefined\\n    export let align = undefined\\n    export let label = undefined\\n    export let errors = undefined\\n    export let invalid = undefined\\n    export let pattern = undefined // Specifies a regular expression that an <input> element's value is checked against (regexp)\\n    export let readonly = undefined // undefined|readonly\\n    export let required = undefined // undefined|required\\n    export let postIcon = undefined\\n    export let ariaLabel = undefined\\n    export let minlength = undefined\\n    export let placeholder = undefined\\n    export let autocomplete = undefined// on|off\\n\\n    /**\\n     * autocomplete - https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete\\n     * names - https://developers.google.com/web/updates/2015/06/checkout-faster-with-autofill\\n     */\\n    const nameTypes = {\\n        'sex': { autocomplete: 'sex' },\\n        'bday': { autocomplete: 'bday' },\\n        'name': { autocomplete: 'name' },\\n        'phone': { autocomplete: 'tel' },\\n        'fname': { autocomplete: 'name' },\\n        'lname': { autocomplete: 'name' },\\n        'email': { autocomplete: 'email' },\\n        'password': { autocomplete: 'new-password' },\\n        \\n        'cvc': { autocomplete: 'cc-csc' },\\n        'cc-exp': { autocomplete: 'cc-exp' },\\n        'ccname': { autocomplete: 'cc-name' },\\n        'cardnumber': { autocomplete: 'cc-number' },\\n\\n        'ship-state': { autocomplete: 'shipping region' },\\n        'ship-city': { autocomplete: 'shipping locality' },\\n        'ship-zip': { autocomplete: 'shipping postal-code' },\\n        'ship-country': { autocomplete: 'shipping country' },\\n        'ship-address': { autocomplete: 'shipping street-address' },\\n    }\\n\\n    const typePostIcons = {\\n      date: 'calendar',\\n      search: 'search',\\n    }\\n\\n    $: inputPredict = nameTypes[name] || {}\\n    $: iconType = postIcon || typePostIcons[type]\\n\\n    $: error = invalid !== undefined ? invalid : !!(errors || []).length\\n    $: idProp = id || inputPredict.id || name\\n    $: typeProp = type\\n    $: titleProp = label || ariaLabel\\n    $: ariaLabelProp = ariaLabel || label || placeholder\\n    $: styleProp = toCSSString({ ...style, textAlign: align })\\n    $: patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern\\n    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, error, postIcon: iconType })\\n    $: autocompleteProp = autocomplete || inputPredict.autocomplete\\n\\n    function onInput(e) {\\n        const value = getValue(e)\\n        dispatch('input', { e, value, name })\\n    }\\n\\n    function onChange(e) {\\n        const value = getValue(e)\\n        dispatch('change', { e, value, name })\\n    }\\n\\n    function getValue(e) {\\n        return e.target.value\\n    }\\n</script>\\n\\n<div class={classProp}>\\n    {#if titleProp}\\n        <label for={idProp} class=\\\"inp-label h2 font-secondary font-w-600 text-left\\\">\\n            { titleProp }\\n            <Br size=\\\"10\\\"/>\\n        </label>\\n    {/if}\\n\\n    <div class=\\\"inp-inner-wrap\\\">\\n        {#if rows || type === 'textarea'}\\n            <textarea\\n                    {min}\\n                    {max}\\n                    {rows}\\n                    {name}\\n                    {form}\\n                    {align}\\n                    {readonly}\\n                    {disabled}\\n                    {required}\\n                    {minlength}\\n                    {maxlength}\\n                    {placeholder}\\n                    id={idProp}\\n                    class=\\\"inp-inner\\\"\\n                    title={titleProp}\\n                    style={styleProp}\\n                    pattern={patternProp}\\n                    aria-label={ariaLabelProp}\\n                    autocomplete={autocompleteProp}\\n                    {...{ type: typeProp }}\\n                    bind:value={value}\\n                    on:input={onInput}\\n                    on:change={onChange}\\n                    on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n                    on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            ></textarea>\\n        {:else}\\n            <input\\n                    {min}\\n                    {max}\\n                    {name}\\n                    {list}\\n                    {form}\\n                    {align}\\n                    {readonly}\\n                    {disabled}\\n                    {required}\\n                    {minlength}\\n                    {maxlength}\\n                    {placeholder}\\n                    id={idProp}\\n                    class=\\\"inp-inner\\\"\\n                    title={titleProp}\\n                    style={styleProp}\\n                    pattern={patternProp}\\n                    aria-label={ariaLabelProp}\\n                    autocomplete={autocompleteProp}\\n                    {...{ type: typeProp }}\\n                    bind:value={value}\\n                    on:input={onInput}\\n                    on:change={onChange}\\n                    on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n                    on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n            >\\n        {/if}\\n\\n        <label for={idProp} class=\\\"inp-post-icon\\\">\\n            <slot name=\\\"post-icon\\\">\\n                {#if iconType}\\n                    <span class=\\\"inp-post-icon-inner\\\">\\n                        <Icon type={iconType} is=\\\"info\\\" size=\\\"medium\\\"/>\\n                    </span>\\n                {/if}\\n            </slot>\\n        </label>\\n    </div>\\n\\n    <FieldErrors items={errors}>\\n        <div slot=\\\"before\\\">\\n            <Br size=\\\"5\\\"/>\\n        </div>\\n    </FieldErrors>\\n</div>\\n\\n<style>\\n    .inp {\\n        width: 100%;\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n    }\\n\\n    .inp .inp-inner-wrap {\\n        position: relative;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-shadow: var(--shadow-field-inset);\\n                box-shadow: var(--shadow-field-inset);\\n        border-radius: var(--border-radius-small);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n    .inp .inp-inner {\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        color: inherit;\\n        overflow-y: auto;\\n        overflow-x: hidden;\\n        background-color: transparent;\\n        -webkit-overflow-scrolling: touch;\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n        border-radius: var(--border-radius-small);\\n    }\\n\\n    .inp.disabled {\\n        opacity: .5;\\n        pointer-events: none;\\n    }\\n\\n    .inp.postIcon .inp-inner {\\n        padding-right: var(--min-interactive-size);\\n    }\\n\\n    .inp .inp-inner:invalid, .inp.error .inp-inner {\\n        -webkit-box-shadow: 0 0 0 1px rgb(var(--color-danger));\\n                box-shadow: 0 0 0 1px rgb(var(--color-danger));\\n        color: rgb(var(--color-danger));\\n    }\\n\\n    .inp .inp-inner:focus {\\n        -webkit-box-shadow: 0 0 0 1px rgb(var(--color-info));\\n                box-shadow: 0 0 0 1px rgb(var(--color-info));\\n        color: rgb(var(--color-info));\\n    }\\n\\n\\n    .inp .inp-inner:invalid + .inp-post-icon :global(.ico),\\n    .inp.error .inp-post-icon :global(.ico) {\\n        color: rgb(var(--color-danger)) !important;\\n    }\\n\\n    .inp .inp-inner:focus + .inp-post-icon :global(.ico) {\\n        color: rgb(var(--color-info)) !important;\\n    }\\n\\n    .inp .inp-post-icon-inner {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: var(--min-interactive-size);\\n    }\\n\\n    .inp .inp-post-icon {\\n        position: absolute;\\n        top: 0;\\n        right: 0;\\n        height: 100%;\\n        width: var(--min-interactive-size);\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        overflow: hidden;\\n    }\\n\\n    .inp .inp-inner::-webkit-input-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .inp .inp-inner::-moz-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .inp .inp-inner:-ms-input-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .inp .inp-inner::-ms-input-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .inp .inp-inner::placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2ZpZWxkcy9JbnB1dC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksV0FBVztRQUNYLG1CQUFjO1lBQWQsa0JBQWM7Z0JBQWQsY0FBYztRQUNkLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IsNEJBQXNCO1FBQXRCLDZCQUFzQjtZQUF0QiwwQkFBc0I7Z0JBQXRCLHNCQUFzQjtJQUMxQjs7SUFFQTtRQUNJLGtCQUFrQjtRQUNsQixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsNkNBQXFDO2dCQUFyQyxxQ0FBcUM7UUFDckMseUNBQXlDO1FBQ3pDLDZDQUE2QztJQUNqRDs7SUFFQTtRQUNJLG1CQUFZO1lBQVosb0JBQVk7Z0JBQVosWUFBWTtRQUNaLGNBQWM7UUFDZCxnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBQ2xCLDZCQUE2QjtRQUM3QixpQ0FBaUM7UUFDakMsc0NBQXNDO1FBQ3RDLHVDQUF1QztRQUN2Qyx5Q0FBeUM7SUFDN0M7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksMENBQTBDO0lBQzlDOztJQUVBO1FBQ0ksc0RBQThDO2dCQUE5Qyw4Q0FBOEM7UUFDOUMsK0JBQStCO0lBQ25DOztJQUVBO1FBQ0ksb0RBQTRDO2dCQUE1Qyw0Q0FBNEM7UUFDNUMsNkJBQTZCO0lBQ2pDOzs7SUFHQTs7UUFFSSwwQ0FBMEM7SUFDOUM7O0lBRUE7UUFDSSx3Q0FBd0M7SUFDNUM7O0lBRUE7UUFDSSxvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLHlCQUFtQjtZQUFuQixzQkFBbUI7Z0JBQW5CLG1CQUFtQjtRQUNuQix3QkFBdUI7WUFBdkIscUJBQXVCO2dCQUF2Qix1QkFBdUI7UUFDdkIsa0NBQWtDO0lBQ3RDOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLE1BQU07UUFDTixRQUFRO1FBQ1IsWUFBWTtRQUNaLGtDQUFrQztRQUNsQyxtQkFBVTtZQUFWLGNBQVU7Z0JBQVYsVUFBVTtRQUNWLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2QixnQkFBZ0I7SUFDcEI7O0lBRUE7UUFDSSxnREFBZ0Q7UUFDaEQsV0FBVztJQUNmOztJQUhBO1FBQ0ksZ0RBQWdEO1FBQ2hELFdBQVc7SUFDZjs7SUFIQTtRQUNJLGdEQUFnRDtRQUNoRCxXQUFXO0lBQ2Y7O0lBSEE7UUFDSSxnREFBZ0Q7UUFDaEQsV0FBVztJQUNmOztJQUhBO1FBQ0ksZ0RBQWdEO1FBQ2hELFdBQVc7SUFDZiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9maWVsZHMvSW5wdXQuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLmlucCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICB9XG5cbiAgICAuaW5wIC5pbnAtaW5uZXItd3JhcCB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LWZpZWxkLWluc2V0KTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cy1zbWFsbCk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICB9XG5cbiAgICAuaW5wIC5pbnAtaW5uZXIge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGNvbG9yOiBpbmhlcml0O1xuICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICAgICAgICAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2g7XG4gICAgICAgIG1pbi13aWR0aDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgICAgICBtaW4taGVpZ2h0OiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtc21hbGwpO1xuICAgIH1cblxuICAgIC5pbnAuZGlzYWJsZWQge1xuICAgICAgICBvcGFjaXR5OiAuNTtcbiAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgfVxuXG4gICAgLmlucC5wb3N0SWNvbiAuaW5wLWlubmVyIHtcbiAgICAgICAgcGFkZGluZy1yaWdodDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgIH1cblxuICAgIC5pbnAgLmlucC1pbm5lcjppbnZhbGlkLCAuaW5wLmVycm9yIC5pbnAtaW5uZXIge1xuICAgICAgICBib3gtc2hhZG93OiAwIDAgMCAxcHggcmdiKHZhcigtLWNvbG9yLWRhbmdlcikpO1xuICAgICAgICBjb2xvcjogcmdiKHZhcigtLWNvbG9yLWRhbmdlcikpO1xuICAgIH1cblxuICAgIC5pbnAgLmlucC1pbm5lcjpmb2N1cyB7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDFweCByZ2IodmFyKC0tY29sb3ItaW5mbykpO1xuICAgICAgICBjb2xvcjogcmdiKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICB9XG5cblxuICAgIC5pbnAgLmlucC1pbm5lcjppbnZhbGlkICsgLmlucC1wb3N0LWljb24gOmdsb2JhbCguaWNvKSxcbiAgICAuaW5wLmVycm9yIC5pbnAtcG9zdC1pY29uIDpnbG9iYWwoLmljbykge1xuICAgICAgICBjb2xvcjogcmdiKHZhcigtLWNvbG9yLWRhbmdlcikpICFpbXBvcnRhbnQ7XG4gICAgfVxuXG4gICAgLmlucCAuaW5wLWlubmVyOmZvY3VzICsgLmlucC1wb3N0LWljb24gOmdsb2JhbCguaWNvKSB7XG4gICAgICAgIGNvbG9yOiByZ2IodmFyKC0tY29sb3ItaW5mbykpICFpbXBvcnRhbnQ7XG4gICAgfVxuXG4gICAgLmlucCAuaW5wLXBvc3QtaWNvbi1pbm5lciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB3aWR0aDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgIH1cblxuICAgIC5pbnAgLmlucC1wb3N0LWljb24ge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIHRvcDogMDtcbiAgICAgICAgcmlnaHQ6IDA7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgd2lkdGg6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgfVxuXG4gICAgLmlucCAuaW5wLWlubmVyOjpwbGFjZWhvbGRlciB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnktb3Bwb3NpdGUpKTtcbiAgICAgICAgb3BhY2l0eTogLjI7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAmLI,IAAI,4BAAC,CAAC,AACF,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,AAClC,CAAC,AAED,kBAAI,CAAC,eAAe,cAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,kBAAkB,CAAE,IAAI,oBAAoB,CAAC,CACrC,UAAU,CAAE,IAAI,oBAAoB,CAAC,CAC7C,aAAa,CAAE,IAAI,qBAAqB,CAAC,CACzC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC,AAED,kBAAI,CAAC,UAAU,cAAC,CAAC,AACb,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,KAAK,CAAE,OAAO,CACd,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,MAAM,CAClB,gBAAgB,CAAE,WAAW,CAC7B,0BAA0B,CAAE,KAAK,CACjC,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,CACvC,aAAa,CAAE,IAAI,qBAAqB,CAAC,AAC7C,CAAC,AAED,IAAI,SAAS,4BAAC,CAAC,AACX,OAAO,CAAE,EAAE,CACX,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,IAAI,uBAAS,CAAC,UAAU,cAAC,CAAC,AACtB,aAAa,CAAE,IAAI,sBAAsB,CAAC,AAC9C,CAAC,AAED,kBAAI,CAAC,wBAAU,QAAQ,CAAE,IAAI,oBAAM,CAAC,UAAU,cAAC,CAAC,AAC5C,kBAAkB,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,IAAI,IAAI,cAAc,CAAC,CAAC,CAC9C,UAAU,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,IAAI,IAAI,cAAc,CAAC,CAAC,CACtD,KAAK,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AACnC,CAAC,AAED,kBAAI,CAAC,wBAAU,MAAM,AAAC,CAAC,AACnB,kBAAkB,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,IAAI,IAAI,YAAY,CAAC,CAAC,CAC5C,UAAU,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,IAAI,IAAI,YAAY,CAAC,CAAC,CACpD,KAAK,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AACjC,CAAC,AAGD,IAAI,CAAC,UAAU,QAAQ,CAAG,0CAAc,CAAC,AAAQ,IAAI,AAAC,CACtD,IAAI,oBAAM,CAAC,4BAAc,CAAC,AAAQ,IAAI,AAAE,CAAC,AACrC,KAAK,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAAC,UAAU,AAC9C,CAAC,AAED,IAAI,CAAC,UAAU,MAAM,CAAG,0CAAc,CAAC,AAAQ,IAAI,AAAE,CAAC,AAClD,KAAK,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CAAC,UAAU,AAC5C,CAAC,AAED,kBAAI,CAAC,oBAAoB,cAAC,CAAC,AACvB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,sBAAsB,CAAC,AACtC,CAAC,AAED,kBAAI,CAAC,cAAc,cAAC,CAAC,AACjB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,sBAAsB,CAAC,CAClC,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,kBAAI,CAAC,wBAAU,2BAA2B,AAAC,CAAC,AACxC,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC,AAED,kBAAI,CAAC,wBAAU,kBAAkB,AAAC,CAAC,AAC/B,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC,AAED,kBAAI,CAAC,wBAAU,sBAAsB,AAAC,CAAC,AACnC,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC,AAED,kBAAI,CAAC,wBAAU,uBAAuB,AAAC,CAAC,AACpC,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC,AAED,kBAAI,CAAC,wBAAU,aAAa,AAAC,CAAC,AAC1B,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC\"}"
};

const Input = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { value = "" } = $$props;
	let { style = {} } = $$props;
	let { type = "text" } = $$props;
	let { id = undefined } = $$props;
	let { min = undefined } = $$props; // Specifies a minimum value for an <input> element
	let { max = undefined } = $$props; // Specifies the maximum value for an <input> element
	let { list = undefined } = $$props; // Refers to a <datalist> element that contains pre-defined options for an <input> element
	let { form = undefined } = $$props; // Specifies the form the <input> element belongs to
	let { maxlength = 1000 } = $$props;
	let { disabled = false } = $$props;
	let { rows = undefined } = $$props;
	let { align = undefined } = $$props;
	let { label = undefined } = $$props;
	let { errors = undefined } = $$props;
	let { invalid = undefined } = $$props;
	let { pattern = undefined } = $$props; // Specifies a regular expression that an <input> element's value is checked against (regexp)
	let { readonly = undefined } = $$props; // undefined|readonly
	let { required = undefined } = $$props; // undefined|required
	let { postIcon = undefined } = $$props;
	let { ariaLabel = undefined } = $$props;
	let { minlength = undefined } = $$props;
	let { placeholder = undefined } = $$props;
	let { autocomplete = undefined } = $$props; // on|off

	/**
 * autocomplete - https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
 * names - https://developers.google.com/web/updates/2015/06/checkout-faster-with-autofill
 */
	const nameTypes = {
		"sex": { autocomplete: "sex" },
		"bday": { autocomplete: "bday" },
		"name": { autocomplete: "name" },
		"phone": { autocomplete: "tel" },
		"fname": { autocomplete: "name" },
		"lname": { autocomplete: "name" },
		"email": { autocomplete: "email" },
		"password": { autocomplete: "new-password" },
		"cvc": { autocomplete: "cc-csc" },
		"cc-exp": { autocomplete: "cc-exp" },
		"ccname": { autocomplete: "cc-name" },
		"cardnumber": { autocomplete: "cc-number" },
		"ship-state": { autocomplete: "shipping region" },
		"ship-city": { autocomplete: "shipping locality" },
		"ship-zip": { autocomplete: "shipping postal-code" },
		"ship-country": { autocomplete: "shipping country" },
		"ship-address": { autocomplete: "shipping street-address" }
	};

	const typePostIcons = { date: "calendar", search: "search" };

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.min === void 0 && $$bindings.min && min !== void 0) $$bindings.min(min);
	if ($$props.max === void 0 && $$bindings.max && max !== void 0) $$bindings.max(max);
	if ($$props.list === void 0 && $$bindings.list && list !== void 0) $$bindings.list(list);
	if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
	if ($$props.maxlength === void 0 && $$bindings.maxlength && maxlength !== void 0) $$bindings.maxlength(maxlength);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.rows === void 0 && $$bindings.rows && rows !== void 0) $$bindings.rows(rows);
	if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
	if ($$props.invalid === void 0 && $$bindings.invalid && invalid !== void 0) $$bindings.invalid(invalid);
	if ($$props.pattern === void 0 && $$bindings.pattern && pattern !== void 0) $$bindings.pattern(pattern);
	if ($$props.readonly === void 0 && $$bindings.readonly && readonly !== void 0) $$bindings.readonly(readonly);
	if ($$props.required === void 0 && $$bindings.required && required !== void 0) $$bindings.required(required);
	if ($$props.postIcon === void 0 && $$bindings.postIcon && postIcon !== void 0) $$bindings.postIcon(postIcon);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	if ($$props.minlength === void 0 && $$bindings.minlength && minlength !== void 0) $$bindings.minlength(minlength);
	if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0) $$bindings.placeholder(placeholder);
	if ($$props.autocomplete === void 0 && $$bindings.autocomplete && autocomplete !== void 0) $$bindings.autocomplete(autocomplete);
	$$result.css.add(css$h);
	let inputPredict = nameTypes[name] || {};
	let iconType = postIcon || typePostIcons[type];

	let error = invalid !== undefined
	? invalid
	: !!(errors || []).length;

	let idProp = id || inputPredict.id || name;
	let typeProp = type;
	let titleProp = label || ariaLabel;
	let ariaLabelProp = ariaLabel || label || placeholder;
	let styleProp = toCSSString({ ...style, textAlign: align });
	let patternProp = type === "number" && !pattern ? "[0-9]*" : pattern;

	let classProp = classnames("inp", $$props.class, {
		disabled,
		readonly,
		required,
		error,
		postIcon: iconType
	});

	let autocompleteProp = autocomplete || inputPredict.autocomplete;

	return `<div class="${escape(null_to_empty(classProp)) + " svelte-txe5nr"}">
    ${titleProp
	? `<label${add_attribute("for", idProp, 0)} class="${"inp-label h2 font-secondary font-w-600 text-left"}">
            ${escape(titleProp)}
            ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
        </label>`
	: ``}

    <div class="${"inp-inner-wrap svelte-txe5nr"}">
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
			"svelte-txe5nr"
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
			"svelte-txe5nr"
		)}${add_attribute("value", value, 1)}>`}

        <label${add_attribute("for", idProp, 0)} class="${"inp-post-icon svelte-txe5nr"}">
            ${$$slots["post-icon"]
	? $$slots["post-icon"]({})
	: `
                ${iconType
		? `<span class="${"inp-post-icon-inner svelte-txe5nr"}">
                        ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					type: iconType,
					is: "info",
					size: "medium"
				},
				{},
				{}
			)}
                    </span>`
		: ``}
            `}
        </label>
    </div>

    ${validate_component(FieldErrors, "FieldErrors").$$render($$result, { items: errors }, {}, {
		before: () => `<div slot="${"before"}">
            ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
        </div>`,
		default: () => `
        
    `
	})}
</div>`;
});

/* src/components/fields/Select.svelte generated by Svelte v3.18.1 */

const css$i = {
	code: ".select.svelte-cmvvlj.svelte-cmvvlj{width:100%;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.select.disabled.svelte-cmvvlj.svelte-cmvvlj{opacity:.5;pointer-events:none}.select.null.svelte-cmvvlj .inp-inner.svelte-cmvvlj{color:rgba(var(--theme-color-primary-opposite), .2) !important}.select.svelte-cmvvlj .inp-inner-wrap.svelte-cmvvlj{position:relative;display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-shadow:var(--shadow-field-inset);box-shadow:var(--shadow-field-inset);border-radius:var(--border-radius-small);background-color:rgba(var(--theme-bg-color))}.select.svelte-cmvvlj .inp-inner.svelte-cmvvlj{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;color:inherit;overflow-y:auto;overflow-x:hidden;background-color:transparent;-webkit-overflow-scrolling:touch;min-width:var(--min-interactive-size);min-height:var(--min-interactive-size);border-radius:var(--border-radius-small)}.select.svelte-cmvvlj .inp-post-icon.svelte-cmvvlj{position:absolute;top:0;right:0;height:100%;width:var(--min-interactive-size);-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;overflow:hidden}.select.svelte-cmvvlj .inp-post-icon-inner.svelte-cmvvlj{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:var(--min-interactive-size)}.select.svelte-cmvvlj .inp-inner.svelte-cmvvlj::-webkit-input-placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}.select.svelte-cmvvlj .inp-inner.svelte-cmvvlj::-moz-placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}.select.svelte-cmvvlj .inp-inner.svelte-cmvvlj:-ms-input-placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}.select.svelte-cmvvlj .inp-inner.svelte-cmvvlj::-ms-input-placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}.select.svelte-cmvvlj .inp-inner.svelte-cmvvlj::placeholder{color:rgba(var(--theme-color-primary-opposite));opacity:.2}.select.postIcon.svelte-cmvvlj .inp-inner.svelte-cmvvlj{padding-right:var(--min-interactive-size)}.select.svelte-cmvvlj .inp-inner.svelte-cmvvlj:invalid,.select.error.svelte-cmvvlj .inp-inner.svelte-cmvvlj{-webkit-box-shadow:0 0 0 1px rgb(var(--color-danger));box-shadow:0 0 0 1px rgb(var(--color-danger));color:rgb(var(--color-danger))}.select .inp-inner:invalid+.inp-post-icon.svelte-cmvvlj.svelte-cmvvlj .ico,.select.error.svelte-cmvvlj .inp-post-icon.svelte-cmvvlj .ico{color:rgb(var(--color-danger)) !important}.select.svelte-cmvvlj .inp-inner.svelte-cmvvlj:focus{-webkit-box-shadow:0 0 0 1px rgb(var(--color-info));box-shadow:0 0 0 1px rgb(var(--color-info));color:rgb(var(--color-info))}.select .inp-inner:focus+.inp-post-icon.svelte-cmvvlj.svelte-cmvvlj .ico{color:rgb(var(--color-info)) !important}",
	map: "{\"version\":3,\"file\":\"Select.svelte\",\"sources\":[\"Select.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '@utils'\\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import FieldErrors from '@components/FieldErrors.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let name\\n    export let style = {}\\n    export let type = 'select'\\n    export let value = undefined\\n    export let id = undefined\\n    export let align = undefined\\n    export let disabled = false\\n    export let label = undefined\\n    export let invalid = undefined\\n    export let form = undefined // Specifies the form the <input> element belongs to\\n    export let readonly = undefined // undefined|readonly\\n    export let required = undefined // undefined|required\\n    export let ariaLabel = undefined\\n    export let placeholder = undefined\\n    export let autocomplete = 'on'\\n    export let postIcon = undefined\\n    export let errors = undefined\\n    /**\\n     *\\n     * @type {{\\n     *     value: string,\\n     *     label: string,\\n     * }[]}\\n     */\\n    export let options = []\\n\\n    $: iconType = postIcon || 'caret-down'\\n    $: error = invalid || !!(errors || []).length\\n    $: idProp = id || name\\n    $: titleProp = label || ariaLabel\\n    $: ariaLabelProp = ariaLabel || label || placeholder\\n    $: styleProp = toCSSString({ ...style, textAlign: align })\\n    $: classProp = classnames('select', $$props.class, { disabled, readonly, required, error, null: value === undefined })\\n\\n    function onChange(e) {\\n        const value = getValue(e)\\n        dispatch('change', { e, value, name })\\n    }\\n    \\n    function getValue(e) {\\n        return e.target.value\\n    }\\n</script>\\n\\n<div class={classProp}>\\n    {#if titleProp}\\n        <label for={idProp} class=\\\"block h2 font-w-500 full-width text-left\\\">\\n            { titleProp }\\n        </label>\\n        <Br size=\\\"10\\\"/>\\n    {/if}\\n\\n    <div class=\\\"inp-inner-wrap\\\">\\n        <select\\n                {name}\\n                {type}\\n                {form}\\n                {align}\\n                {readonly}\\n                {disabled}\\n                {required}\\n                {placeholder}\\n                {autocomplete}\\n                id={idProp}\\n                class=\\\"inp-inner\\\"\\n                title={titleProp}\\n                style={styleProp}\\n                aria-label={ariaLabelProp}\\n                bind:value\\n                on:change={onChange}\\n                on:blur='{e => !disabled && dispatch(\\\"blur\\\", e)}'\\n                on:focus='{e => !disabled && dispatch(\\\"focus\\\", e)}'\\n        >\\n            {#if !required}\\n                <option value={undefined}>{placeholder || ''}</option>\\n            {/if}\\n            {#each options as { label: text, ...option }}\\n                {#if option.value !== undefined && text !== undefined}\\n                    <option value={option.value}>\\n                        {text}\\n                    </option>\\n                {/if}\\n            {/each}\\n        </select>\\n\\n        <label for={idProp} class=\\\"inp-post-icon\\\">\\n            <slot name=\\\"post-icon\\\">\\n                {#if iconType}\\n                    <span class=\\\"inp-post-icon-inner\\\">\\n                        <Icon type={iconType} is=\\\"info\\\" size=\\\"medium\\\"/>\\n                    </span>\\n                {/if}\\n            </slot>\\n        </label>\\n    </div>\\n\\n    <FieldErrors items={errors}/>\\n</div>\\n\\n<style>\\n    .select {\\n        width: 100%;\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n    }\\n\\n    .select.disabled {\\n        opacity: .5;\\n        pointer-events: none;\\n    }\\n    \\n    .select.null .inp-inner {\\n        color: rgba(var(--theme-color-primary-opposite), .2) !important;\\n    }\\n\\n    .select .inp-inner-wrap {\\n        position: relative;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-shadow: var(--shadow-field-inset);\\n                box-shadow: var(--shadow-field-inset);\\n        border-radius: var(--border-radius-small);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n    .select .inp-inner {\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        color: inherit;\\n        overflow-y: auto;\\n        overflow-x: hidden;\\n        background-color: transparent;\\n        -webkit-overflow-scrolling: touch;\\n        min-width: var(--min-interactive-size);\\n        min-height: var(--min-interactive-size);\\n        border-radius: var(--border-radius-small);\\n    }\\n\\n    .select .inp-post-icon {\\n        position: absolute;\\n        top: 0;\\n        right: 0;\\n        height: 100%;\\n        width: var(--min-interactive-size);\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        overflow: hidden;\\n    }\\n\\n    .select .inp-post-icon-inner {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: var(--min-interactive-size);\\n    }\\n\\n    .select .inp-inner::-webkit-input-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .select .inp-inner::-moz-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .select .inp-inner:-ms-input-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .select .inp-inner::-ms-input-placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .select .inp-inner option[default],\\n    .select .inp-inner::placeholder {\\n        color: rgba(var(--theme-color-primary-opposite));\\n        opacity: .2;\\n    }\\n\\n    .select.postIcon .inp-inner {\\n        padding-right: var(--min-interactive-size);\\n    }\\n\\n    .select .inp-inner:invalid,\\n    .select.error .inp-inner {\\n        -webkit-box-shadow: 0 0 0 1px rgb(var(--color-danger));\\n                box-shadow: 0 0 0 1px rgb(var(--color-danger));\\n        color: rgb(var(--color-danger));\\n    }\\n\\n    .select .inp-inner:invalid + .inp-post-icon :global(.ico),\\n    .select.error .inp-post-icon :global(.ico) {\\n        color: rgb(var(--color-danger)) !important;\\n    }\\n\\n    .select .inp-inner:focus {\\n        -webkit-box-shadow: 0 0 0 1px rgb(var(--color-info));\\n                box-shadow: 0 0 0 1px rgb(var(--color-info));\\n        color: rgb(var(--color-info));\\n    }\\n\\n    .select .inp-inner:focus + .inp-post-icon :global(.ico) {\\n        color: rgb(var(--color-info)) !important;\\n    }\\n\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2ZpZWxkcy9TZWxlY3Quc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFdBQVc7UUFDWCxtQkFBYztZQUFkLGtCQUFjO2dCQUFkLGNBQWM7UUFDZCxvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLDRCQUFzQjtRQUF0Qiw2QkFBc0I7WUFBdEIsMEJBQXNCO2dCQUF0QixzQkFBc0I7SUFDMUI7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksK0RBQStEO0lBQ25FOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiw2Q0FBcUM7Z0JBQXJDLHFDQUFxQztRQUNyQyx5Q0FBeUM7UUFDekMsNkNBQTZDO0lBQ2pEOztJQUVBO1FBQ0ksbUJBQVk7WUFBWixvQkFBWTtnQkFBWixZQUFZO1FBQ1osY0FBYztRQUNkLGdCQUFnQjtRQUNoQixrQkFBa0I7UUFDbEIsNkJBQTZCO1FBQzdCLGlDQUFpQztRQUNqQyxzQ0FBc0M7UUFDdEMsdUNBQXVDO1FBQ3ZDLHlDQUF5QztJQUM3Qzs7SUFFQTtRQUNJLGtCQUFrQjtRQUNsQixNQUFNO1FBQ04sUUFBUTtRQUNSLFlBQVk7UUFDWixrQ0FBa0M7UUFDbEMsbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLHlCQUFtQjtZQUFuQixzQkFBbUI7Z0JBQW5CLG1CQUFtQjtRQUNuQix3QkFBdUI7WUFBdkIscUJBQXVCO2dCQUF2Qix1QkFBdUI7UUFDdkIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLGtDQUFrQztJQUN0Qzs7SUFFQTtRQUVJLGdEQUFnRDtRQUNoRCxXQUFXO0lBQ2Y7O0lBSkE7UUFFSSxnREFBZ0Q7UUFDaEQsV0FBVztJQUNmOztJQUpBO1FBRUksZ0RBQWdEO1FBQ2hELFdBQVc7SUFDZjs7SUFKQTtRQUVJLGdEQUFnRDtRQUNoRCxXQUFXO0lBQ2Y7O0lBSkE7O1FBRUksZ0RBQWdEO1FBQ2hELFdBQVc7SUFDZjs7SUFFQTtRQUNJLDBDQUEwQztJQUM5Qzs7SUFFQTs7UUFFSSxzREFBOEM7Z0JBQTlDLDhDQUE4QztRQUM5QywrQkFBK0I7SUFDbkM7O0lBRUE7O1FBRUksMENBQTBDO0lBQzlDOztJQUVBO1FBQ0ksb0RBQTRDO2dCQUE1Qyw0Q0FBNEM7UUFDNUMsNkJBQTZCO0lBQ2pDOztJQUVBO1FBQ0ksd0NBQXdDO0lBQzVDIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2ZpZWxkcy9TZWxlY3Quc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnNlbGVjdCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICB9XG5cbiAgICAuc2VsZWN0LmRpc2FibGVkIHtcbiAgICAgICAgb3BhY2l0eTogLjU7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgIH1cbiAgICBcbiAgICAuc2VsZWN0Lm51bGwgLmlucC1pbm5lciB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnktb3Bwb3NpdGUpLCAuMikgIWltcG9ydGFudDtcbiAgICB9XG5cbiAgICAuc2VsZWN0IC5pbnAtaW5uZXItd3JhcCB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgYm94LXNoYWRvdzogdmFyKC0tc2hhZG93LWZpZWxkLWluc2V0KTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cy1zbWFsbCk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICB9XG5cbiAgICAuc2VsZWN0IC5pbnAtaW5uZXIge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGNvbG9yOiBpbmhlcml0O1xuICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICAgICAgICAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2g7XG4gICAgICAgIG1pbi13aWR0aDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgICAgICBtaW4taGVpZ2h0OiB2YXIoLS1taW4taW50ZXJhY3RpdmUtc2l6ZSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMtc21hbGwpO1xuICAgIH1cblxuICAgIC5zZWxlY3QgLmlucC1wb3N0LWljb24ge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIHRvcDogMDtcbiAgICAgICAgcmlnaHQ6IDA7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgd2lkdGg6IHZhcigtLW1pbi1pbnRlcmFjdGl2ZS1zaXplKTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgfVxuXG4gICAgLnNlbGVjdCAuaW5wLXBvc3QtaWNvbi1pbm5lciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB3aWR0aDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgIH1cblxuICAgIC5zZWxlY3QgLmlucC1pbm5lciBvcHRpb25bZGVmYXVsdF0sXG4gICAgLnNlbGVjdCAuaW5wLWlubmVyOjpwbGFjZWhvbGRlciB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnktb3Bwb3NpdGUpKTtcbiAgICAgICAgb3BhY2l0eTogLjI7XG4gICAgfVxuXG4gICAgLnNlbGVjdC5wb3N0SWNvbiAuaW5wLWlubmVyIHtcbiAgICAgICAgcGFkZGluZy1yaWdodDogdmFyKC0tbWluLWludGVyYWN0aXZlLXNpemUpO1xuICAgIH1cblxuICAgIC5zZWxlY3QgLmlucC1pbm5lcjppbnZhbGlkLFxuICAgIC5zZWxlY3QuZXJyb3IgLmlucC1pbm5lciB7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDFweCByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgICAgIGNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSk7XG4gICAgfVxuXG4gICAgLnNlbGVjdCAuaW5wLWlubmVyOmludmFsaWQgKyAuaW5wLXBvc3QtaWNvbiA6Z2xvYmFsKC5pY28pLFxuICAgIC5zZWxlY3QuZXJyb3IgLmlucC1wb3N0LWljb24gOmdsb2JhbCguaWNvKSB7XG4gICAgICAgIGNvbG9yOiByZ2IodmFyKC0tY29sb3ItZGFuZ2VyKSkgIWltcG9ydGFudDtcbiAgICB9XG5cbiAgICAuc2VsZWN0IC5pbnAtaW5uZXI6Zm9jdXMge1xuICAgICAgICBib3gtc2hhZG93OiAwIDAgMCAxcHggcmdiKHZhcigtLWNvbG9yLWluZm8pKTtcbiAgICAgICAgY29sb3I6IHJnYih2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuXG4gICAgLnNlbGVjdCAuaW5wLWlubmVyOmZvY3VzICsgLmlucC1wb3N0LWljb24gOmdsb2JhbCguaWNvKSB7XG4gICAgICAgIGNvbG9yOiByZ2IodmFyKC0tY29sb3ItaW5mbykpICFpbXBvcnRhbnQ7XG4gICAgfVxuXG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AA6GI,OAAO,4BAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,AAClC,CAAC,AAED,OAAO,SAAS,4BAAC,CAAC,AACd,OAAO,CAAE,EAAE,CACX,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,OAAO,mBAAK,CAAC,UAAU,cAAC,CAAC,AACrB,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,UAAU,AACnE,CAAC,AAED,qBAAO,CAAC,eAAe,cAAC,CAAC,AACrB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,kBAAkB,CAAE,IAAI,oBAAoB,CAAC,CACrC,UAAU,CAAE,IAAI,oBAAoB,CAAC,CAC7C,aAAa,CAAE,IAAI,qBAAqB,CAAC,CACzC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC,AAED,qBAAO,CAAC,UAAU,cAAC,CAAC,AAChB,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,KAAK,CAAE,OAAO,CACd,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,MAAM,CAClB,gBAAgB,CAAE,WAAW,CAC7B,0BAA0B,CAAE,KAAK,CACjC,SAAS,CAAE,IAAI,sBAAsB,CAAC,CACtC,UAAU,CAAE,IAAI,sBAAsB,CAAC,CACvC,aAAa,CAAE,IAAI,qBAAqB,CAAC,AAC7C,CAAC,AAED,qBAAO,CAAC,cAAc,cAAC,CAAC,AACpB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,sBAAsB,CAAC,CAClC,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,qBAAO,CAAC,oBAAoB,cAAC,CAAC,AAC1B,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,sBAAsB,CAAC,AACtC,CAAC,AAED,qBAAO,CAAC,wBAAU,2BAA2B,AAAC,CAAC,AAC3C,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC,AAED,qBAAO,CAAC,wBAAU,kBAAkB,AAAC,CAAC,AAClC,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC,AAED,qBAAO,CAAC,wBAAU,sBAAsB,AAAC,CAAC,AACtC,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC,AAED,qBAAO,CAAC,wBAAU,uBAAuB,AAAC,CAAC,AACvC,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC,AAGD,qBAAO,CAAC,wBAAU,aAAa,AAAC,CAAC,AAC7B,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAChD,OAAO,CAAE,EAAE,AACf,CAAC,AAED,OAAO,uBAAS,CAAC,UAAU,cAAC,CAAC,AACzB,aAAa,CAAE,IAAI,sBAAsB,CAAC,AAC9C,CAAC,AAED,qBAAO,CAAC,wBAAU,QAAQ,CAC1B,OAAO,oBAAM,CAAC,UAAU,cAAC,CAAC,AACtB,kBAAkB,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,IAAI,IAAI,cAAc,CAAC,CAAC,CAC9C,UAAU,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,IAAI,IAAI,cAAc,CAAC,CAAC,CACtD,KAAK,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,AACnC,CAAC,AAED,OAAO,CAAC,UAAU,QAAQ,CAAG,0CAAc,CAAC,AAAQ,IAAI,AAAC,CACzD,OAAO,oBAAM,CAAC,4BAAc,CAAC,AAAQ,IAAI,AAAE,CAAC,AACxC,KAAK,CAAE,IAAI,IAAI,cAAc,CAAC,CAAC,CAAC,UAAU,AAC9C,CAAC,AAED,qBAAO,CAAC,wBAAU,MAAM,AAAC,CAAC,AACtB,kBAAkB,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,IAAI,IAAI,YAAY,CAAC,CAAC,CAC5C,UAAU,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,IAAI,IAAI,YAAY,CAAC,CAAC,CACpD,KAAK,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,AACjC,CAAC,AAED,OAAO,CAAC,UAAU,MAAM,CAAG,0CAAc,CAAC,AAAQ,IAAI,AAAE,CAAC,AACrD,KAAK,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CAAC,UAAU,AAC5C,CAAC\"}"
};

const Select = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { style = {} } = $$props;
	let { type = "select" } = $$props;
	let { value = undefined } = $$props;
	let { id = undefined } = $$props;
	let { align = undefined } = $$props;
	let { disabled = false } = $$props;
	let { label = undefined } = $$props;
	let { invalid = undefined } = $$props;
	let { form = undefined } = $$props; // Specifies the form the <input> element belongs to
	let { readonly = undefined } = $$props; // undefined|readonly
	let { required = undefined } = $$props; // undefined|required
	let { ariaLabel = undefined } = $$props;
	let { placeholder = undefined } = $$props;
	let { autocomplete = "on" } = $$props;
	let { postIcon = undefined } = $$props;
	let { errors = undefined } = $$props;
	let { options = [] } = $$props;

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.invalid === void 0 && $$bindings.invalid && invalid !== void 0) $$bindings.invalid(invalid);
	if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
	if ($$props.readonly === void 0 && $$bindings.readonly && readonly !== void 0) $$bindings.readonly(readonly);
	if ($$props.required === void 0 && $$bindings.required && required !== void 0) $$bindings.required(required);
	if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
	if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0) $$bindings.placeholder(placeholder);
	if ($$props.autocomplete === void 0 && $$bindings.autocomplete && autocomplete !== void 0) $$bindings.autocomplete(autocomplete);
	if ($$props.postIcon === void 0 && $$bindings.postIcon && postIcon !== void 0) $$bindings.postIcon(postIcon);
	if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
	if ($$props.options === void 0 && $$bindings.options && options !== void 0) $$bindings.options(options);
	$$result.css.add(css$i);
	let iconType = postIcon || "caret-down";
	let error = invalid || !!(errors || []).length;
	let idProp = id || name;
	let titleProp = label || ariaLabel;
	let ariaLabelProp = ariaLabel || label || placeholder;
	let styleProp = toCSSString({ ...style, textAlign: align });

	let classProp = classnames("select", $$props.class, {
		disabled,
		readonly,
		required,
		error,
		null: value === undefined
	});

	return `<div class="${escape(null_to_empty(classProp)) + " svelte-cmvvlj"}">
    ${titleProp
	? `<label${add_attribute("for", idProp, 0)} class="${"block h2 font-w-500 full-width text-left"}">
            ${escape(titleProp)}
        </label>
        ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}`
	: ``}

    <div class="${"inp-inner-wrap svelte-cmvvlj"}">
        <select${add_attribute("name", name, 0)}${add_attribute("type", type, 0)}${add_attribute("form", form, 0)}${add_attribute("align", align, 0)} ${readonly ? "readonly" : ""} ${disabled ? "disabled" : ""} ${required ? "required" : ""}${add_attribute("placeholder", placeholder, 0)}${add_attribute("autocomplete", autocomplete, 0)}${add_attribute("id", idProp, 0)} class="${"inp-inner svelte-cmvvlj"}"${add_attribute("title", titleProp, 0)}${add_attribute("style", styleProp, 0)}${add_attribute("aria-label", ariaLabelProp, 0)}${add_attribute("value", value, 1)}>
            ${!required
	? `<option${add_attribute("value", undefined, 0)}>${escape(placeholder || "")}</option>`
	: ``}
            ${each(options, ({ label: text, ...option }) => `${option.value !== undefined && text !== undefined
	? `<option${add_attribute("value", option.value, 0)}>
                        ${escape(text)}
                    </option>`
	: ``}`)}
        </select>

        <label${add_attribute("for", idProp, 0)} class="${"inp-post-icon svelte-cmvvlj"}">
            ${$$slots["post-icon"]
	? $$slots["post-icon"]({})
	: `
                ${iconType
		? `<span class="${"inp-post-icon-inner svelte-cmvvlj"}">
                        ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					type: iconType,
					is: "info",
					size: "medium"
				},
				{},
				{}
			)}
                    </span>`
		: ``}
            `}
        </label>
    </div>

    ${validate_component(FieldErrors, "FieldErrors").$$render($$result, { items: errors }, {}, {})}
</div>`;
});

/* src/components/fields/ReadField.svelte generated by Svelte v3.18.1 */

const ReadField = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { value = "" } = $$props;
	let { style = {} } = $$props;
	let { id = undefined } = $$props;
	let { label = undefined } = $$props;
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	let styleProp = toCSSString({ ...style });
	let classProp = classnames("block full-width text-left", $$props.class);

	return `<div${add_attribute("id", id, 0)}${add_attribute("class", classProp, 0)}${add_attribute("style", styleProp, 0)}>
    ${label
	? `<h2 class="${"block full-width"}">${escape(label)}</h2>
        ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}`
	: ``}
    <p class="${"block full-width"}">${escape(value || "—")}</p>
</div>`;
});

/* src/components/fields/RadioRect.svelte generated by Svelte v3.18.1 */

const RadioRect = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { style = {} } = $$props;
	let { id = undefined } = $$props;
	let { form = undefined } = $$props; // Specifies the form the <input> element belongs to
	let { value = undefined } = $$props;
	let { label = undefined } = $$props;
	let { align = undefined } = $$props;
	let { options = undefined } = $$props;
	let { invalid = undefined } = $$props;
	let { disabled = undefined } = $$props;
	let { required = undefined } = $$props; // undefined|required
	let { errors = undefined } = $$props;

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
	if ($$props.options === void 0 && $$bindings.options && options !== void 0) $$bindings.options(options);
	if ($$props.invalid === void 0 && $$bindings.invalid && invalid !== void 0) $$bindings.invalid(invalid);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.required === void 0 && $$bindings.required && required !== void 0) $$bindings.required(required);
	if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
	let idProp = id || name;
	let error = invalid || !!(errors || []).length;
	let styleProp = toCSSString({ ...style, textAlign: align });
	let classProp = classnames("radio-rect", $$props.class, { disabled, required, error });

	return `<div${add_attribute("id", idProp, 0)}${add_attribute("class", classProp, 0)}${add_attribute("style", styleProp, 0)}>
    ${label
	? `<h2 class="${"text-left"}">
            ${escape(label)}
            ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
        </h2>`
	: ``}

    <ul style="${"margin: -5px"}" class="${"flex flex-wrap"}">
        ${each(options, (radio, i) => `<li style="${"padding: 5px"}">
                ${validate_component(Button, "Button").$$render(
		$$result,
		{
			auto: true,
			htmlFor: `${idProp}_${i}`,
			is: value === radio.value ? "info" : "info-border"
		},
		{},
		{
			default: () => `
                    <input${add_attribute("form", form, 0)} hidden type="${"checkbox"}"${add_attribute("id", `${idProp}_${i}`, 0)}${add_attribute("value", radio.value, 0)}>
                    ${$$slots.default
			? $$slots.default({
					item: radio,
					checked: value === radio.value
				})
			: `
                        <p class="${"flex flex-align-center"}" style="${"padding: 10px 20px"}">
                            ${radio.preIcon
				? `${validate_component(Icon, "Icon").$$render(
						$$result,
						{
							type: radio.preIcon,
							size: "medium",
							is: value === radio.value ? "light" : "info"
						},
						{},
						{}
					)}
                                <s></s>`
				: ``}
                            <span class="${"font-w-500 h3 flex flex-align-center flex-justify-center"}">
                                ${escape(radio.label)}
                            </span>
                            ${radio.postIcon
				? `<s></s>
                                ${validate_component(Icon, "Icon").$$render(
						$$result,
						{
							type: radio.postIcon,
							size: "medium",
							is: value === radio.value ? "light" : "info"
						},
						{},
						{}
					)}`
				: ``}
                        </p>
                    `}
                `
		}
	)}
            </li>`)}
    </ul>

</div>`;
});

/* src/components/fields/uploadFiles/UploadBox.svelte generated by Svelte v3.18.1 */

const css$j = {
	code: ".inp-upload.svelte-1oa853p.svelte-1oa853p{width:100%;-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;-ms-flex-item-align:stretch;align-self:stretch;justify-self:stretch;overflow:hidden;border-radius:var(--border-radius-medium);color:rgba(var(--theme-color-primary-opposite), .5);background-color:rgba(var(--theme-color-primary-opposite), .07);-webkit-transform:translateZ(0);transform:translateZ(0)}.inp-upload.preview.svelte-1oa853p .icon.svelte-1oa853p{opacity:.5}.inp-upload.svelte-1oa853p .icon.svelte-1oa853p{opacity:.7}.inp-upload.disabled.svelte-1oa853p.svelte-1oa853p{opacity:.5;pointer-events:none}.inp-upload.error.svelte-1oa853p.svelte-1oa853p,input:invalid+.inp-upload.svelte-1oa853p.svelte-1oa853p{color:rgba(var(--color-danger), .5);background-color:rgba(var(--color-danger), .07)}input:focus+.inp-upload.svelte-1oa853p.svelte-1oa853p{color:rgba(var(--color-info), .5);background-color:rgba(var(--color-info), .07)}",
	map: "{\"version\":3,\"file\":\"UploadBox.svelte\",\"sources\":[\"UploadBox.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '@utils'\\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import Square from '@components/Square.svelte'\\n    import Picture from '@components/Picture.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let id = undefined\\n    export let src = undefined\\n    export let name = undefined\\n    export let icon = undefined\\n    export let label = undefined\\n    export let value = undefined\\n    export let round = undefined\\n    export let style = undefined\\n    export let iconIs = undefined\\n    export let errors = undefined\\n    export let invalid = undefined\\n    export let multiple = undefined\\n    export let disabled = undefined\\n    export let accept = \\\"image/png, image/jpeg\\\"\\n\\n    let validSrc\\n\\n    $: error = invalid !== undefined ? invalid : !!(errors || []).length\\n    $: iconType = icon || 'upload'\\n    $: idProp = id || name\\n    $: setValidSrc(src)\\n    $: classProp = classnames('inp-upload', { error, disabled, preview: src })\\n    $: styleProp = toCSSString({ ...style, borderRadius: round ? '50%' : null })\\n\\n    function setValidSrc(file) {\\n        try {\\n            if (typeof file === 'string') {\\n                validSrc = file\\n            } else if (file) {\\n                const f = Array.isArray(file) ? file[0] : file\\n                const reader = new FileReader();\\n                reader.onload = e => validSrc = e.target.result\\n                reader.readAsDataURL(f); // convert to base64 string\\n            } else if (!file) {\\n                validSrc = undefined\\n            }\\n        } catch(err) {\\n            console.log('UploadBox/getValidSrc error: ', err)\\n        }\\n    }\\n    \\n    function onChange(e) {\\n        const value = Array.from(e.target.files)\\n        if (!value || !value.length) return\\n        dispatch('change', { value, name, e })\\n    }\\n</script>\\n\\n{#if label}\\n    <h2 class=\\\"text-left\\\">{label}</h2>\\n    <Br size=\\\"10\\\"/>\\n{/if}\\n<Square class={$$props.class} style={styleProp}>\\n    <input\\n        {name}\\n        {accept}\\n        {multiple}\\n        hidden \\n        type=\\\"file\\\" \\n        id={idProp}\\n        bind:value\\n        on:change={onChange}\\n    >\\n    <label for={idProp} class={classProp}>\\n        <div class=\\\"flex full-absolute\\\">\\n            <Picture src={validSrc} alt=\\\"Завантажене фото\\\"/> \\n        </div>\\n        <div class=\\\"icon flex relative\\\" style=\\\"flex: 0 0 75px\\\">\\n            <Icon type={iconType} is={iconIs}/>\\n        </div>\\n    </label>\\n</Square>\\n\\n<style>\\n    .inp-upload {\\n        width: 100%;\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        justify-self: stretch;\\n        overflow: hidden;\\n        border-radius: var(--border-radius-medium);\\n        color: rgba(var(--theme-color-primary-opposite), .5);\\n        background-color: rgba(var(--theme-color-primary-opposite), .07);\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n    }\\n\\n    .inp-upload.preview .icon {\\n        opacity: .5;\\n    }\\n\\n    .inp-upload .icon {\\n        opacity: .7;\\n    }\\n\\n    .inp-upload.disabled {\\n        opacity: .5;\\n        pointer-events: none;\\n    }\\n\\n    .inp-upload.error,\\n    input:invalid + .inp-upload {\\n        color: rgba(var(--color-danger), .5);\\n        background-color: rgba(var(--color-danger), .07);\\n    }\\n\\n    input:focus + .inp-upload {\\n        color: rgba(var(--color-info), .5);\\n        background-color: rgba(var(--color-info), .07);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2ZpZWxkcy91cGxvYWRGaWxlcy9VcGxvYWRCb3guc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLFdBQVc7UUFDWCxtQkFBWTtZQUFaLG9CQUFZO2dCQUFaLFlBQVk7UUFDWixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLHlCQUFtQjtZQUFuQixzQkFBbUI7Z0JBQW5CLG1CQUFtQjtRQUNuQix3QkFBdUI7WUFBdkIscUJBQXVCO2dCQUF2Qix1QkFBdUI7UUFDdkIsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQixxQkFBcUI7UUFDckIsZ0JBQWdCO1FBQ2hCLDBDQUEwQztRQUMxQyxvREFBb0Q7UUFDcEQsZ0VBQWdFO1FBQ2hFLGdDQUF3QjtnQkFBeEIsd0JBQXdCO0lBQzVCOztJQUVBO1FBQ0ksV0FBVztJQUNmOztJQUVBO1FBQ0ksV0FBVztJQUNmOztJQUVBO1FBQ0ksV0FBVztRQUNYLG9CQUFvQjtJQUN4Qjs7SUFFQTs7UUFFSSxvQ0FBb0M7UUFDcEMsZ0RBQWdEO0lBQ3BEOztJQUVBO1FBQ0ksa0NBQWtDO1FBQ2xDLDhDQUE4QztJQUNsRCIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9maWVsZHMvdXBsb2FkRmlsZXMvVXBsb2FkQm94LnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5pbnAtdXBsb2FkIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGp1c3RpZnktc2VsZjogc3RyZXRjaDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cy1tZWRpdW0pO1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS10aGVtZS1jb2xvci1wcmltYXJ5LW9wcG9zaXRlKSwgLjUpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWNvbG9yLXByaW1hcnktb3Bwb3NpdGUpLCAuMDcpO1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooMCk7XG4gICAgfVxuXG4gICAgLmlucC11cGxvYWQucHJldmlldyAuaWNvbiB7XG4gICAgICAgIG9wYWNpdHk6IC41O1xuICAgIH1cblxuICAgIC5pbnAtdXBsb2FkIC5pY29uIHtcbiAgICAgICAgb3BhY2l0eTogLjc7XG4gICAgfVxuXG4gICAgLmlucC11cGxvYWQuZGlzYWJsZWQge1xuICAgICAgICBvcGFjaXR5OiAuNTtcbiAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgfVxuXG4gICAgLmlucC11cGxvYWQuZXJyb3IsXG4gICAgaW5wdXQ6aW52YWxpZCArIC5pbnAtdXBsb2FkIHtcbiAgICAgICAgY29sb3I6IHJnYmEodmFyKC0tY29sb3ItZGFuZ2VyKSwgLjUpO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhbmdlciksIC4wNyk7XG4gICAgfVxuXG4gICAgaW5wdXQ6Zm9jdXMgKyAuaW5wLXVwbG9hZCB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWluZm8pLCAuNSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3ItaW5mbyksIC4wNyk7XG4gICAgfVxuIl19 */</style>\"],\"names\":[],\"mappings\":\"AAoFI,WAAW,8BAAC,CAAC,AACT,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,YAAY,CAAE,OAAO,CACrB,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,IAAI,sBAAsB,CAAC,CAC1C,KAAK,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,EAAE,CAAC,CACpD,gBAAgB,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,GAAG,CAAC,CAChE,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,AACpC,CAAC,AAED,WAAW,uBAAQ,CAAC,KAAK,eAAC,CAAC,AACvB,OAAO,CAAE,EAAE,AACf,CAAC,AAED,0BAAW,CAAC,KAAK,eAAC,CAAC,AACf,OAAO,CAAE,EAAE,AACf,CAAC,AAED,WAAW,SAAS,8BAAC,CAAC,AAClB,OAAO,CAAE,EAAE,CACX,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,WAAW,oCAAM,CACjB,KAAK,QAAQ,CAAG,WAAW,8BAAC,CAAC,AACzB,KAAK,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,EAAE,CAAC,CACpC,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,GAAG,CAAC,AACpD,CAAC,AAED,KAAK,MAAM,CAAG,WAAW,8BAAC,CAAC,AACvB,KAAK,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAAC,EAAE,CAAC,CAClC,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,CAAC,GAAG,CAAC,AAClD,CAAC\"}"
};

const UploadBox = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { src = undefined } = $$props;
	let { name = undefined } = $$props;
	let { icon = undefined } = $$props;
	let { label = undefined } = $$props;
	let { value = undefined } = $$props;
	let { round = undefined } = $$props;
	let { style = undefined } = $$props;
	let { iconIs = undefined } = $$props;
	let { errors = undefined } = $$props;
	let { invalid = undefined } = $$props;
	let { multiple = undefined } = $$props;
	let { disabled = undefined } = $$props;
	let { accept = "image/png, image/jpeg" } = $$props;
	let validSrc;

	function setValidSrc(file) {
		try {
			if (typeof file === "string") {
				validSrc = file;
			} else if (file) {
				const f = Array.isArray(file) ? file[0] : file;
				const reader = new FileReader();
				reader.onload = e => validSrc = e.target.result;
				reader.readAsDataURL(f); // convert to base64 string
			} else if (!file) {
				validSrc = undefined;
			}
		} catch(err) {
			console.log("UploadBox/getValidSrc error: ", err);
		}
	}

	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.icon === void 0 && $$bindings.icon && icon !== void 0) $$bindings.icon(icon);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.round === void 0 && $$bindings.round && round !== void 0) $$bindings.round(round);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.iconIs === void 0 && $$bindings.iconIs && iconIs !== void 0) $$bindings.iconIs(iconIs);
	if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
	if ($$props.invalid === void 0 && $$bindings.invalid && invalid !== void 0) $$bindings.invalid(invalid);
	if ($$props.multiple === void 0 && $$bindings.multiple && multiple !== void 0) $$bindings.multiple(multiple);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.accept === void 0 && $$bindings.accept && accept !== void 0) $$bindings.accept(accept);
	$$result.css.add(css$j);

	let error = invalid !== undefined
	? invalid
	: !!(errors || []).length;

	let iconType = icon || "upload";
	let idProp = id || name;

	 {
		setValidSrc(src);
	}

	let classProp = classnames("inp-upload", { error, disabled, preview: src });

	let styleProp = toCSSString({
		...style,
		borderRadius: round ? "50%" : null
	});

	return `${label
	? `<h2 class="${"text-left"}">${escape(label)}</h2>
    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}`
	: ``}
${validate_component(Square, "Square").$$render($$result, { class: $$props.class, style: styleProp }, {}, {
		default: () => `
    <input${add_attribute("name", name, 0)}${add_attribute("accept", accept, 0)} ${multiple ? "multiple" : ""} hidden type="${"file"}"${add_attribute("id", idProp, 0)}>
    <label${add_attribute("for", idProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-1oa853p"}">
        <div class="${"flex full-absolute"}">
            ${validate_component(Picture, "Picture").$$render($$result, { src: validSrc, alt: "Завантажене фото" }, {}, {})} 
        </div>
        <div class="${"icon flex relative svelte-1oa853p"}" style="${"flex: 0 0 75px"}">
            ${validate_component(Icon, "Icon").$$render($$result, { type: iconType, is: iconIs }, {}, {})}
        </div>
    </label>
`
	})}`;
});

/* src/components/fields/uploadFiles/UploadBoxGroup.svelte generated by Svelte v3.18.1 */

const css$k = {
	code: "ul.svelte-azoem7{width:100%;display:grid;grid-template:auto / .5fr .5fr;grid-gap:var(--screen-padding)}ul.disabled.svelte-azoem7{opacity:.5;pointer-events:none}button.svelte-azoem7{position:absolute;top:0;right:0;font-size:24px;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:40px;height:40px}",
	map: "{\"version\":3,\"file\":\"UploadBoxGroup.svelte\",\"sources\":[\"UploadBoxGroup.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { _, classnames } from '@utils'\\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import UploadBox from './UploadBox.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let name\\n    export let id = undefined\\n    export let label = undefined\\n    export let value = undefined\\n    export let accept = undefined\\n    export let errors = undefined\\n    export let invalid = undefined\\n    export let multiple = undefined\\n    export let disabled = undefined\\n    export let infoIndex = [0]\\n\\n    const BOX_AMOUNT = 4\\n\\n    $: values = value || []\\n    $: error = invalid !== undefined ? invalid : !!(errors || []).length\\n    $: idProp = id || name\\n    $: itemsList = getCells(values)\\n    $: classProp = classnames('inp-upload-group', $$props.class, { error, disabled })\\n\\n    function getCells(list) {\\n        const defaultList = new Array(BOX_AMOUNT - 1).fill(undefined)\\n        const listArr = [].concat(list || [])\\n        const biggerList = listArr.length > defaultList.length ? listArr : defaultList\\n        biggerList.push(undefined)\\n        return biggerList.map(((_, i) => listArr[i] || defaultList[i]))\\n    }\\n\\n    function onChange(i, { detail: { e, value } }) {\\n        const val = [...values]\\n        val.splice(i, 0, ...value)\\n        values = val\\n        dispatch('change', { e, name, value: values })\\n    }\\n\\n    function onRemove(i, e) {\\n        values = [...values.filter((_, ind) => ind !== i)]\\n        dispatch('change', { e, name, value: values })\\n    }\\n</script>\\n\\n{#if label}\\n    <h2 class=\\\"text-left\\\">{label}</h2>\\n    <Br size=\\\"10\\\"/>\\n{/if}\\n<ul id={idProp} class={classProp}>\\n    {#each itemsList as item, i}\\n        <li class=\\\"relative\\\">\\n            <UploadBox\\n                key={i}\\n                {accept}\\n                {invalid}\\n                {disabled}\\n                {multiple}\\n                bind:value\\n                name={`${name || ''}[${i}]`}\\n                src={(values[i] || {}).src || values[i]}\\n                errors={_.get(errors, i)}\\n                style={{ maxHeight: '160px' }}\\n                iconIs={infoIndex.includes(i) ? 'info' : undefined}\\n                on:change={onChange.bind(null, i)}\\n            />\\n\\n            {#if values[i]}\\n                <button type=\\\"button\\\" on:click={onRemove.bind(null, i)}>\\n                    <Icon size=\\\"big\\\" type=\\\"close\\\"/>    \\n                </button>\\n            {/if}\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    ul {\\n        width: 100%;\\n        display: grid;\\n        grid-template: auto / .5fr .5fr;\\n        grid-gap: var(--screen-padding);\\n    }\\n\\n    ul.disabled {\\n        opacity: .5;\\n        pointer-events: none;\\n    }\\n\\n    button {\\n        position: absolute;\\n        top: 0;\\n        right: 0;\\n        font-size: 24px;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 40px;\\n        height: 40px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2ZpZWxkcy91cGxvYWRGaWxlcy9VcGxvYWRCb3hHcm91cC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksV0FBVztRQUNYLGFBQWE7UUFDYiwrQkFBK0I7UUFDL0IsK0JBQStCO0lBQ25DOztJQUVBO1FBQ0ksV0FBVztRQUNYLG9CQUFvQjtJQUN4Qjs7SUFFQTtRQUNJLGtCQUFrQjtRQUNsQixNQUFNO1FBQ04sUUFBUTtRQUNSLGVBQWU7UUFDZixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLHlCQUFtQjtZQUFuQixzQkFBbUI7Z0JBQW5CLG1CQUFtQjtRQUNuQix3QkFBdUI7WUFBdkIscUJBQXVCO2dCQUF2Qix1QkFBdUI7UUFDdkIsV0FBVztRQUNYLFlBQVk7SUFDaEIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvZmllbGRzL3VwbG9hZEZpbGVzL1VwbG9hZEJveEdyb3VwLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIHVsIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICAgIGdyaWQtdGVtcGxhdGU6IGF1dG8gLyAuNWZyIC41ZnI7XG4gICAgICAgIGdyaWQtZ2FwOiB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgfVxuXG4gICAgdWwuZGlzYWJsZWQge1xuICAgICAgICBvcGFjaXR5OiAuNTtcbiAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgfVxuXG4gICAgYnV0dG9uIHtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIHJpZ2h0OiAwO1xuICAgICAgICBmb250LXNpemU6IDI0cHg7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB3aWR0aDogNDBweDtcbiAgICAgICAgaGVpZ2h0OiA0MHB4O1xuICAgIH1cbiJdfQ== */</style>\"],\"names\":[],\"mappings\":\"AAiFI,EAAE,cAAC,CAAC,AACA,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,IAAI,CAC/B,QAAQ,CAAE,IAAI,gBAAgB,CAAC,AACnC,CAAC,AAED,EAAE,SAAS,cAAC,CAAC,AACT,OAAO,CAAE,EAAE,CACX,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,MAAM,cAAC,CAAC,AACJ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,CAAC,CACR,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC\"}"
};

const BOX_AMOUNT = 4;

function getCells(list) {
	const defaultList = new Array(BOX_AMOUNT - 1).fill(undefined);
	const listArr = [].concat(list || []);

	const biggerList = listArr.length > defaultList.length
	? listArr
	: defaultList;

	biggerList.push(undefined);
	return biggerList.map((_, i) => listArr[i] || defaultList[i]);
}

const UploadBoxGroup = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { id = undefined } = $$props;
	let { label = undefined } = $$props;
	let { value = undefined } = $$props;
	let { accept = undefined } = $$props;
	let { errors = undefined } = $$props;
	let { invalid = undefined } = $$props;
	let { multiple = undefined } = $$props;
	let { disabled = undefined } = $$props;
	let { infoIndex = [0] } = $$props;

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.accept === void 0 && $$bindings.accept && accept !== void 0) $$bindings.accept(accept);
	if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
	if ($$props.invalid === void 0 && $$bindings.invalid && invalid !== void 0) $$bindings.invalid(invalid);
	if ($$props.multiple === void 0 && $$bindings.multiple && multiple !== void 0) $$bindings.multiple(multiple);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.infoIndex === void 0 && $$bindings.infoIndex && infoIndex !== void 0) $$bindings.infoIndex(infoIndex);
	$$result.css.add(css$k);
	let $$settled;
	let $$rendered;

	do {
		$$settled = true;
		let values = value || [];

		let error = invalid !== undefined
		? invalid
		: !!(errors || []).length;

		let idProp = id || name;
		let itemsList = getCells(values);
		let classProp = classnames("inp-upload-group", $$props.class, { error, disabled });

		$$rendered = `${label
		? `<h2 class="${"text-left"}">${escape(label)}</h2>
    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}`
		: ``}
<ul${add_attribute("id", idProp, 0)} class="${escape(null_to_empty(classProp)) + " svelte-azoem7"}">
    ${each(itemsList, (item, i) => `<li class="${"relative"}">
            ${validate_component(UploadBox, "UploadBox").$$render(
			$$result,
			{
				key: i,
				accept,
				invalid,
				disabled,
				multiple,
				name: `${name || ""}[${i}]`,
				src: (values[i] || {}).src || values[i],
				errors: get(errors, i),
				style: { maxHeight: "160px" },
				iconIs: infoIndex.includes(i) ? "info" : undefined,
				value
			},
			{
				value: $$value => {
					value = $$value;
					$$settled = false;
				}
			},
			{}
		)}

            ${values[i]
		? `<button type="${"button"}" class="${"svelte-azoem7"}">
                    ${validate_component(Icon, "Icon").$$render($$result, { size: "big", type: "close" }, {}, {})}    
                </button>`
		: ``}
        </li>`)}
</ul>`;
	} while (!$$settled);

	return $$rendered;
});

/* src/components/fields/AvatarUpload.svelte generated by Svelte v3.18.1 */

const AvatarUpload = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { style = {} } = $$props;
	let { round = true } = $$props;
	let { id = undefined } = $$props;
	let { value = undefined } = $$props;
	let { label = undefined } = $$props;
	let { align = "center" } = $$props;
	let { invalid = undefined } = $$props;
	let { disabled = undefined } = $$props;
	let { required = undefined } = $$props; // undefined|required
	let { errors = undefined } = $$props;

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.round === void 0 && $$bindings.round && round !== void 0) $$bindings.round(round);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
	if ($$props.invalid === void 0 && $$bindings.invalid && invalid !== void 0) $$bindings.invalid(invalid);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.required === void 0 && $$bindings.required && required !== void 0) $$bindings.required(required);
	if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
	let idProp = id || name;
	let error = invalid || !!(errors || []).length;
	let styleProp = { width: "145px", ...style };
	let classProp = classnames("avatar-upload", $$props.class, `text-${align}`, { disabled, required, error });

	return `<div${add_attribute("id", idProp, 0)}${add_attribute("class", classProp, 0)}>
    ${label
	? `<h2 class="${"text-left"}">
            ${escape(label)}
            ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
        </h2>`
	: ``}

    <section class="${"inline-flex flex-justify-center"}" style="${"padding: 10px 0"}">
        ${validate_component(UploadBox, "UploadBox").$$render(
		$$result,
		{
			name,
			round,
			src: value,
			style: styleProp
		},
		{},
		{}
	)}  
    </section>

    <div class="${"text-center"}">
        ${validate_component(FieldErrors, "FieldErrors").$$render($$result, { items: errors }, {}, {})}
    </div>
</div>`;
});

/* src/components/fields/checkboxes/Checkbox.svelte generated by Svelte v3.18.1 */

const css$l = {
	code: ".checkbox.svelte-e12p58.svelte-e12p58{display:block}.checkbox.svelte-e12p58 input.svelte-e12p58{-webkit-appearance:checkbox;-moz-appearance:checkbox;appearance:checkbox}.checkbox.svelte-e12p58 .inp-box-wrap.svelte-e12p58{position:relative;display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex}.checkbox .inp-inner:checked+.inp-label.svelte-e12p58.svelte-e12p58 .checked{display:block}.checkbox.svelte-e12p58 .inp-label.svelte-e12p58{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:start;-ms-flex-align:start;align-items:flex-start}.checkbox.svelte-e12p58 .inp-label.svelte-e12p58 .checked{display:none;position:absolute;top:0;left:0;width:100%;height:100%}",
	map: "{\"version\":3,\"file\":\"Checkbox.svelte\",\"sources\":[\"Checkbox.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '@utils'\\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import FieldErrors from '@components/FieldErrors.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let name\\n    export let style = {}\\n    export let checked = undefined\\n    export let value = undefined\\n    export let id = undefined\\n    export let align = undefined\\n    export let disabled = false\\n    export let label = undefined\\n    export let text = undefined\\n    export let invalid = undefined\\n    export let form = undefined // Specifies the form the <input> element belongs to\\n    export let required = undefined // undefined|required\\n    export let errors = undefined\\n\\n    $: idProp = id || name || value\\n    $: error = invalid || !!(errors || []).length\\n    $: styleProp = toCSSString({ ...style, textAlign: align })\\n    $: classProp = classnames('checkbox', $$props.class, { disabled, required, error })\\n\\n    function onChange(e) {\\n        const value = getValue(e)\\n        dispatch('change', { e, name, value, checked: e.target.checked })\\n    }\\n\\n    function getValue(e) {\\n        return e.target.value\\n    }\\n</script>\\n\\n<div class={classProp}>\\n    {#if label}\\n        <h2 class=\\\"text-left\\\">\\n            { label }\\n            <Br size=\\\"10\\\"/>\\n        </h2>\\n    {/if}\\n\\n    <input\\n            hidden\\n            type=\\\"checkbox\\\"\\n            id={idProp}\\n            {name}\\n            {form}\\n            {align}\\n            {value}\\n            {checked}\\n            {disabled}\\n            {required}\\n            class=\\\"inp-inner\\\"\\n            on:change={onChange}\\n    >\\n\\n    <label for={idProp} class=\\\"inp-label\\\">\\n        <span class=\\\"inp-box-wrap\\\">\\n            <Icon type=\\\"box\\\" size=\\\"big\\\" is=\\\"info\\\" class=\\\"unchecked\\\"/>\\n            <Icon type=\\\"box-checked\\\" size=\\\"big\\\" is=\\\"info\\\" class=\\\"checked\\\"/>\\n        </span>\\n        {#if text}\\n            <s></s>\\n            <s></s>\\n            <h3 class=\\\"font-w-500 text-left\\\" style=\\\"padding-top: 4px\\\">{ text }</h3>\\n        {/if}\\n    </label>\\n\\n    <FieldErrors items={errors}>\\n        <div slot=\\\"before\\\">\\n            <Br size=\\\"5\\\"/>\\n        </div>\\n    </FieldErrors>\\n</div>\\n\\n<style>\\n    .checkbox {\\n        display: block;\\n    }\\n\\n    .checkbox input {\\n        -webkit-appearance: checkbox;\\n           -moz-appearance: checkbox;\\n                appearance: checkbox;\\n    }\\n\\n    .checkbox .inp-box-wrap {\\n        position: relative;\\n        display: -webkit-inline-box;\\n        display: -ms-inline-flexbox;\\n        display: inline-flex;\\n    }\\n    .checkbox .inp-inner:checked + .inp-label :global(.checked) {\\n        display: block;\\n    }\\n\\n    .checkbox .inp-label {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: start;\\n            -ms-flex-align: start;\\n                align-items: flex-start;\\n    }\\n\\n    .checkbox .inp-label :global(.checked) {\\n        display: none;\\n        position: absolute;\\n        top: 0;\\n        left: 0;\\n        width: 100%;\\n        height: 100%;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2ZpZWxkcy9jaGVja2JveGVzL0NoZWNrYm94LnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxjQUFjO0lBQ2xCOztJQUVBO1FBQ0ksNEJBQW9CO1dBQXBCLHlCQUFvQjtnQkFBcEIsb0JBQW9CO0lBQ3hCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLDJCQUFvQjtRQUFwQiwyQkFBb0I7UUFBcEIsb0JBQW9CO0lBQ3hCO0lBQ0E7UUFDSSxjQUFjO0lBQ2xCOztJQUVBO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix3QkFBdUI7WUFBdkIscUJBQXVCO2dCQUF2Qix1QkFBdUI7SUFDM0I7O0lBRUE7UUFDSSxhQUFhO1FBQ2Isa0JBQWtCO1FBQ2xCLE1BQU07UUFDTixPQUFPO1FBQ1AsV0FBVztRQUNYLFlBQVk7SUFDaEIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvZmllbGRzL2NoZWNrYm94ZXMvQ2hlY2tib3guc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLmNoZWNrYm94IHtcbiAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgfVxuXG4gICAgLmNoZWNrYm94IGlucHV0IHtcbiAgICAgICAgYXBwZWFyYW5jZTogY2hlY2tib3g7XG4gICAgfVxuXG4gICAgLmNoZWNrYm94IC5pbnAtYm94LXdyYXAge1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIH1cbiAgICAuY2hlY2tib3ggLmlucC1pbm5lcjpjaGVja2VkICsgLmlucC1sYWJlbCA6Z2xvYmFsKC5jaGVja2VkKSB7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIH1cblxuICAgIC5jaGVja2JveCAuaW5wLWxhYmVsIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgfVxuXG4gICAgLmNoZWNrYm94IC5pbnAtbGFiZWwgOmdsb2JhbCguY2hlY2tlZCkge1xuICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIHRvcDogMDtcbiAgICAgICAgbGVmdDogMDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAiFI,SAAS,4BAAC,CAAC,AACP,OAAO,CAAE,KAAK,AAClB,CAAC,AAED,uBAAS,CAAC,KAAK,cAAC,CAAC,AACb,kBAAkB,CAAE,QAAQ,CACzB,eAAe,CAAE,QAAQ,CACpB,UAAU,CAAE,QAAQ,AAChC,CAAC,AAED,uBAAS,CAAC,aAAa,cAAC,CAAC,AACrB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,kBAAkB,CAC3B,OAAO,CAAE,WAAW,AACxB,CAAC,AACD,SAAS,CAAC,UAAU,QAAQ,CAAG,sCAAU,CAAC,AAAQ,QAAQ,AAAE,CAAC,AACzD,OAAO,CAAE,KAAK,AAClB,CAAC,AAED,uBAAS,CAAC,UAAU,cAAC,CAAC,AAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,KAAK,CACpB,cAAc,CAAE,KAAK,CACjB,WAAW,CAAE,UAAU,AACnC,CAAC,AAED,uBAAS,CAAC,wBAAU,CAAC,AAAQ,QAAQ,AAAE,CAAC,AACpC,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC\"}"
};

const Checkbox = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { style = {} } = $$props;
	let { checked = undefined } = $$props;
	let { value = undefined } = $$props;
	let { id = undefined } = $$props;
	let { align = undefined } = $$props;
	let { disabled = false } = $$props;
	let { label = undefined } = $$props;
	let { text = undefined } = $$props;
	let { invalid = undefined } = $$props;
	let { form = undefined } = $$props; // Specifies the form the <input> element belongs to
	let { required = undefined } = $$props; // undefined|required
	let { errors = undefined } = $$props;

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0) $$bindings.checked(checked);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);
	if ($$props.invalid === void 0 && $$bindings.invalid && invalid !== void 0) $$bindings.invalid(invalid);
	if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
	if ($$props.required === void 0 && $$bindings.required && required !== void 0) $$bindings.required(required);
	if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
	$$result.css.add(css$l);
	let idProp = id || name || value;
	let error = invalid || !!(errors || []).length;
	let styleProp = toCSSString({ ...style, textAlign: align });
	let classProp = classnames("checkbox", $$props.class, { disabled, required, error });

	return `<div class="${escape(null_to_empty(classProp)) + " svelte-e12p58"}">
    ${label
	? `<h2 class="${"text-left"}">
            ${escape(label)}
            ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
        </h2>`
	: ``}

    <input hidden type="${"checkbox"}"${add_attribute("id", idProp, 0)}${add_attribute("name", name, 0)}${add_attribute("form", form, 0)}${add_attribute("align", align, 0)}${add_attribute("value", value, 0)} ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} ${required ? "required" : ""} class="${"inp-inner svelte-e12p58"}">

    <label${add_attribute("for", idProp, 0)} class="${"inp-label svelte-e12p58"}">
        <span class="${"inp-box-wrap svelte-e12p58"}">
            ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			type: "box",
			size: "big",
			is: "info",
			class: "unchecked"
		},
		{},
		{}
	)}
            ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			type: "box-checked",
			size: "big",
			is: "info",
			class: "checked"
		},
		{},
		{}
	)}
        </span>
        ${text
	? `<s></s>
            <s></s>
            <h3 class="${"font-w-500 text-left"}" style="${"padding-top: 4px"}">${escape(text)}</h3>`
	: ``}
    </label>

    ${validate_component(FieldErrors, "FieldErrors").$$render($$result, { items: errors }, {}, {
		before: () => `<div slot="${"before"}">
            ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
        </div>`,
		default: () => `
        
    `
	})}
</div>`;
});

/* src/components/fields/checkboxes/CheckboxGroup.svelte generated by Svelte v3.18.1 */

const CheckboxGroup = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { name } = $$props;
	let { value = undefined } = $$props;
	let { style = undefined } = $$props;
	let { id = undefined } = $$props;
	let { align = undefined } = $$props;
	let { disabled = false } = $$props;
	let { label = undefined } = $$props;
	let { options = undefined } = $$props;
	let { errors = {} } = $$props;

	function getChecked(currName, currValue) {
		if (Array.isArray(value)) {
			return value.includes(currValue);
		} else {
			return !!value && value[currName];
		}
	}

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
	if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.options === void 0 && $$bindings.options && options !== void 0) $$bindings.options(options);
	if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
	let styleProp = toCSSString({ ...style, textAlign: align });
	let classProp = classnames("checkbox-group", $$props.class, { disabled, error: !isEmpty(errors) });

	return `<div${add_attribute("id", id, 0)}${add_attribute("class", classProp, 0)}${add_attribute("styleProp", styleProp, 0)}>
    ${label
	? `<h2 class="${"text-left"}">
            ${escape(label)}
            ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
        </h2>`
	: ``}

    ${each(options, (checkbox, i) => `${i
	? `${validate_component(Br, "Br").$$render($$result, { size: "15" }, {}, {})}`
	: ``}
        ${validate_component(Checkbox, "Checkbox").$$render(
		$$result,
		Object.assign(checkbox, { errors: errors[checkbox.name] }, {
			checked: value && getChecked(checkbox.name, checkbox.value)
		}),
		{},
		{}
	)}`)}
</div>`;
});

/* src/components/FormBuilder.svelte generated by Svelte v3.18.1 */

const FormBuilder = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { items = [] } = $$props;
	let { data = {} } = $$props;
	let { errors = {} } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let submitting = false;

	function onChange({ detail: { name, value } }) {
		values = set(values, name, value);
		dispatch("change", values);
	}

	function getValue(values, name) {
		return get(values, name) || "";
	}

	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let values = cloneDeep(data);
	let classProp = classnames("form-builder", { submitting });

	return `${validate_component(Form, "Form").$$render($$result, { id, class: classProp }, {}, {
		default: () => `
    ${each(items, (item, i) => `${i
		? `${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}`
		: ``}
        ${[
			"text",
			"number",
			"textarea",
			"email",
			"password",
			"search",
			"tel",
			"url",
			"date",
			"datetime-local",
			"time"
		].includes(item.type)
		? `${values[item.name] !== null
			? `${validate_component(Input, "Input").$$render($$result, Object.assign(item.meta, { name: item.name }, { type: item.type }, { label: item.label }, { value: getValue(values, item.name) }, { errors: errors[item.name] }), {}, {})}`
			: `<div>
                    ${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}
                    ${validate_component(Loader, "Loader").$$render($$result, { height: "50" }, {}, {})}
                </div>`}`
		: `${["checkbox"].includes(item.type)
			? `${validate_component(CheckboxGroup, "CheckboxGroup").$$render($$result, Object.assign(item.meta, { name: item.name }, { label: item.label }, { value: getValue(values, item.name) }, { errors: errors[item.name] }), {}, {})}`
			: `${["select"].includes(item.type)
				? `${values[item.name] !== null
					? `${validate_component(Select, "Select").$$render($$result, Object.assign(item.meta, { name: item.name }, { type: item.type }, { label: item.label }, { value: getValue(values, item.name) }, { errors: errors[item.name] }), {}, {})}`
					: `<div>
                    ${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}
                    ${validate_component(Loader, "Loader").$$render($$result, { height: "50" }, {}, {})}
                </div>`}`
				: `${["file"].includes(item.type)
					? `${validate_component(UploadBox, "UploadBox").$$render($$result, Object.assign(item.meta, { name: item.name }, { label: item.label }, { value: getValue(values, item.name) }, { errors: errors[item.name] }), {}, {})}`
					: `${["files"].includes(item.type)
						? `${validate_component(UploadBoxGroup, "UploadBoxGroup").$$render($$result, Object.assign(item.meta, { name: item.name }, { label: item.label }, { value: getValue(values, item.name) }, { errors: errors[item.name] }), {}, {})}`
						: `${["avatar"].includes(item.type)
							? `${validate_component(AvatarUpload, "AvatarUpload").$$render($$result, Object.assign(item.meta, { name: item.name }, { label: item.label }, { value: getValue(values, item.name) }, { errors: errors[item.name] }), {}, {})}`
							: `${["radio-rect"].includes(item.type)
								? `${validate_component(RadioRect, "RadioRect").$$render($$result, Object.assign(item.meta, { name: item.name }, { label: item.label }, { value: getValue(values, item.name) }, { errors: errors[item.name] }), {}, {})}`
								: `${$$slots.default
									? $$slots.default({
											item,
											values,
											errors,
											onChange,
											value: values[item.name]
										})
									: `
                ${values[item.name] !== null
										? `${validate_component(ReadField, "ReadField").$$render($$result, Object.assign(item.meta, { label: item.label }, { value: getValue(values, item.name) }), {}, {})}`
										: `<div>
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                    </div>`}
            `}`}`}`}`}`}`}`}`)}
`
	})}`;
});

/* src/components/app/Header.svelte generated by Svelte v3.18.1 */

const css$m = {
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
	$$result.css.add(css$m);
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

const css$n = {
	code: "footer.svelte-76fy0z{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;padding:var(--screen-padding);-webkit-box-shadow:inset var(--shadow-primary);box-shadow:inset var(--shadow-primary);background-color:rgba(var(--theme-bg-color))}ul.svelte-76fy0z{display:-webkit-box;display:-ms-flexbox;display:flex;margin:-3px}li.svelte-76fy0z{padding:3px}",
	map: "{\"version\":3,\"file\":\"Footer.svelte\",\"sources\":[\"Footer.svelte\"],\"sourcesContent\":[\"<script>\\n    import Button from '@components/Button.svelte'\\n</script>\\n\\n<footer>\\n    <p>© {new Date().getFullYear()}</p>\\n    <ul>\\n        <li>\\n            <Button size=\\\"small\\\" is=\\\"success\\\">Action</Button>\\n        </li>\\n    </ul>\\n</footer>\\n\\n<style>\\n    footer {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: justify;\\n            -ms-flex-pack: justify;\\n                justify-content: space-between;\\n        padding: var(--screen-padding);\\n        -webkit-box-shadow: inset var(--shadow-primary);\\n                box-shadow: inset var(--shadow-primary);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n    ul {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        margin: -3px;\\n    }\\n\\n    li {\\n        padding: 3px;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Gb290ZXIuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHlCQUE4QjtZQUE5QixzQkFBOEI7Z0JBQTlCLDhCQUE4QjtRQUM5Qiw4QkFBOEI7UUFDOUIsK0NBQXVDO2dCQUF2Qyx1Q0FBdUM7UUFDdkMsNkNBQTZDO0lBQ2pEOztJQUVBO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixZQUFZO0lBQ2hCOztJQUVBO1FBQ0ksWUFBWTtJQUNoQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvRm9vdGVyLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIGZvb3RlciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgcGFkZGluZzogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgICAgICBib3gtc2hhZG93OiBpbnNldCB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICB9XG5cbiAgICB1bCB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG1hcmdpbjogLTNweDtcbiAgICB9XG5cbiAgICBsaSB7XG4gICAgICAgIHBhZGRpbmc6IDNweDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAcI,MAAM,cAAC,CAAC,AACJ,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,aAAa,CACtC,OAAO,CAAE,IAAI,gBAAgB,CAAC,CAC9B,kBAAkB,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CACvC,UAAU,CAAE,KAAK,CAAC,IAAI,gBAAgB,CAAC,CAC/C,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC,AAED,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,IAAI,AAChB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,OAAO,CAAE,GAAG,AAChB,CAAC\"}"
};

const Footer = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$n);

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

const css$o = {
	code: ".social-icons.svelte-290smm li.svelte-290smm{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:40px;height:40px;border-radius:50%;overflow:hidden;margin:0 10px}.social-icons.svelte-290smm .telegram.svelte-290smm{background-color:#2197D2}.social-icons.svelte-290smm .facebook.svelte-290smm{background-color:#4267B2}.social-icons.svelte-290smm .viber.svelte-290smm{background-color:#665CAC}",
	map: "{\"version\":3,\"file\":\"SocialsX.svelte\",\"sources\":[\"SocialsX.svelte\"],\"sourcesContent\":[\"<script>\\n    import Icon from '../Icon.svelte'\\n    import Loader from '../loader/Loader.svelte'\\n\\n    /**\\n     * @type {{\\n     *  href: string,\\n     *  title: string,\\n     *  type: Config.Icons,\\n     * }[]}\\n     */\\n    export let items\\n\\n    $: list = items === null ? [null, null, null] : items || []\\n</script>\\n\\n<ul class=\\\"flex flex-justify-center social-icons\\\">\\n    {#each list as item}\\n        {#if item !== null}\\n            <li class={item.type}>\\n                <slot {item}>\\n                    {#if item.href}\\n                        <a href={item.href} target=\\\"_blank\\\" title={item.title}>\\n                            <Icon type={item.type} is=\\\"light\\\" size=\\\"medium\\\"/>\\n                        </a>\\n                    {:else}\\n                        <span on:click>\\n                            <Icon type={item.type} is=\\\"light\\\" size=\\\"medium\\\"/>\\n                        </span>\\n                    {/if}\\n                </slot>\\n            </li>\\n        {:else}\\n            <li style=\\\"padding: 0 10px; width: 60px; height: 45px; overflow: hidden\\\">\\n                <Loader type=\\\"avatar\\\"/>\\n            </li>\\n        {/if}\\n    {/each}\\n</ul>\\n\\n<style>\\n    .social-icons li {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 40px;\\n        height: 40px;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        margin: 0 10px;\\n    }\\n\\n    .social-icons .telegram {\\n        background-color: #2197D2;\\n    }\\n    .social-icons .facebook {\\n        background-color: #4267B2;\\n    }\\n    .social-icons .viber {\\n        background-color: #665CAC;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Tb2NpYWxzWC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLFdBQVc7UUFDWCxZQUFZO1FBQ1osa0JBQWtCO1FBQ2xCLGdCQUFnQjtRQUNoQixjQUFjO0lBQ2xCOztJQUVBO1FBQ0kseUJBQXlCO0lBQzdCO0lBQ0E7UUFDSSx5QkFBeUI7SUFDN0I7SUFDQTtRQUNJLHlCQUF5QjtJQUM3QiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvU29jaWFsc1guc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnNvY2lhbC1pY29ucyBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB3aWR0aDogNDBweDtcbiAgICAgICAgaGVpZ2h0OiA0MHB4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIG1hcmdpbjogMCAxMHB4O1xuICAgIH1cblxuICAgIC5zb2NpYWwtaWNvbnMgLnRlbGVncmFtIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzIxOTdEMjtcbiAgICB9XG4gICAgLnNvY2lhbC1pY29ucyAuZmFjZWJvb2sge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNDI2N0IyO1xuICAgIH1cbiAgICAuc29jaWFsLWljb25zIC52aWJlciB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICM2NjVDQUM7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAyCI,2BAAa,CAAC,EAAE,cAAC,CAAC,AACd,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,MAAM,CAAE,CAAC,CAAC,IAAI,AAClB,CAAC,AAED,2BAAa,CAAC,SAAS,cAAC,CAAC,AACrB,gBAAgB,CAAE,OAAO,AAC7B,CAAC,AACD,2BAAa,CAAC,SAAS,cAAC,CAAC,AACrB,gBAAgB,CAAE,OAAO,AAC7B,CAAC,AACD,2BAAa,CAAC,MAAM,cAAC,CAAC,AAClB,gBAAgB,CAAE,OAAO,AAC7B,CAAC\"}"
};

const SocialsX = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$o);
	let list = items === null ? [null, null, null] : items || [];

	return `<ul class="${"flex flex-justify-center social-icons svelte-290smm"}">
    ${each(list, item => `${item !== null
	? `<li class="${escape(null_to_empty(item.type)) + " svelte-290smm"}">
                ${$$slots.default
		? $$slots.default({ item })
		: `
                    ${item.href
			? `<a${add_attribute("href", item.href, 0)} target="${"_blank"}"${add_attribute("title", item.title, 0)}>
                            ${validate_component(Icon, "Icon").$$render(
					$$result,
					{
						type: item.type,
						is: "light",
						size: "medium"
					},
					{},
					{}
				)}
                        </a>`
			: `<span>
                            ${validate_component(Icon, "Icon").$$render(
					$$result,
					{
						type: item.type,
						is: "light",
						size: "medium"
					},
					{},
					{}
				)}
                        </span>`}
                `}
            </li>`
	: `<li style="${"padding: 0 10px; width: 60px; height: 45px; overflow: hidden"}" class="${"svelte-290smm"}">
                ${validate_component(Loader, "Loader").$$render($$result, { type: "avatar" }, {}, {})}
            </li>`}`)}
</ul>`;
});

/* src/components/app/SocialsY.svelte generated by Svelte v3.18.1 */

const css$p = {
	code: ".social-icons.svelte-liclkg li.svelte-liclkg{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;overflow:hidden;margin:7px 0}.social-icons.svelte-liclkg .inner.svelte-liclkg{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center}.social-icons.svelte-liclkg .icon-wrap.svelte-liclkg{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:26px;height:26px;border-radius:50%;background-color:rgba(var(--color-dark))}",
	map: "{\"version\":3,\"file\":\"SocialsY.svelte\",\"sources\":[\"SocialsY.svelte\"],\"sourcesContent\":[\"\\n<script>\\n    import Icon from '../Icon.svelte'\\n    import Loader from '../loader/Loader.svelte'\\n\\n    /**\\n     * @type {{\\n     *  href: string,\\n     *  title: string,\\n     *  type: Config.Icons,\\n     * }[]}\\n     */\\n    export let items\\n\\n    $: list = items === null ? [null, null, null] : items || []\\n</script>\\n\\n<ul class=\\\"social-icons\\\">\\n    {#each list as item}\\n        <li>\\n            {#if item !== null}\\n                <slot {item}>\\n                    {#if item.href}\\n                        <a href={item.href} target=\\\"_blank\\\" class=\\\"inner\\\" title={item.title}>\\n                            <span class=\\\"icon-wrap\\\">\\n                                <Icon type={item.type} is=\\\"light\\\" size=\\\"tiny\\\"/>\\n                            </span>\\n                            <s></s>\\n                            <s></s>\\n                            <s></s>\\n                            <p class=\\\"h3\\\">{item.title}</p>\\n                        </a>\\n                    {:else}\\n                        <div on:click class=\\\"inner\\\" title={item.title}>\\n                            <span class=\\\"icon-wrap\\\">\\n                                <Icon type={item.type} is=\\\"light\\\" size=\\\"tiny\\\"/>\\n                            </span>\\n                            <s></s>\\n                            <s></s>\\n                            <s></s>\\n                            <p class=\\\"h3\\\">{item.title}</p>\\n                        </div>\\n                    {/if}\\n                </slot>\\n            {:else}\\n                <span class=\\\"flex flex-align-center\\\" style=\\\"padding: 7px 0\\\">\\n                    <Loader type=\\\"h3\\\"/>\\n                </span>\\n            {/if}\\n        </li>\\n    {/each}\\n</ul>\\n\\n<style>\\n    .social-icons li {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        overflow: hidden;\\n        margin: 7px 0;\\n    }\\n\\n    .social-icons .inner {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n    }\\n\\n    .social-icons .icon-wrap {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 26px;\\n        height: 26px;\\n        border-radius: 50%;\\n        background-color: rgba(var(--color-dark));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Tb2NpYWxzWS5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsZ0JBQWdCO1FBQ2hCLGFBQWE7SUFDakI7O0lBRUE7UUFDSSxvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLHlCQUFtQjtZQUFuQixzQkFBbUI7Z0JBQW5CLG1CQUFtQjtJQUN2Qjs7SUFFQTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2QixXQUFXO1FBQ1gsWUFBWTtRQUNaLGtCQUFrQjtRQUNsQix5Q0FBeUM7SUFDN0MiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL1NvY2lhbHNZLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5zb2NpYWwtaWNvbnMgbGkge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBtYXJnaW46IDdweCAwO1xuICAgIH1cblxuICAgIC5zb2NpYWwtaWNvbnMgLmlubmVyIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAuc29jaWFsLWljb25zIC5pY29uLXdyYXAge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgd2lkdGg6IDI2cHg7XG4gICAgICAgIGhlaWdodDogMjZweDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhcmspKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAsDI,2BAAa,CAAC,EAAE,cAAC,CAAC,AACd,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,QAAQ,CAAE,MAAM,CAChB,MAAM,CAAE,GAAG,CAAC,CAAC,AACjB,CAAC,AAED,2BAAa,CAAC,MAAM,cAAC,CAAC,AAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,AAC/B,CAAC,AAED,2BAAa,CAAC,UAAU,cAAC,CAAC,AACtB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,gBAAgB,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAC7C,CAAC\"}"
};

const SocialsY = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$p);
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
                                ${validate_component(Icon, "Icon").$$render(
					$$result,
					{
						type: item.type,
						is: "light",
						size: "tiny"
					},
					{},
					{}
				)}
                            </span>
                            <s></s>
                            <s></s>
                            <s></s>
                            <p class="${"h3"}">${escape(item.title)}</p>
                        </a>`
			: `<div class="${"inner svelte-liclkg"}"${add_attribute("title", item.title, 0)}>
                            <span class="${"icon-wrap svelte-liclkg"}">
                                ${validate_component(Icon, "Icon").$$render(
					$$result,
					{
						type: item.type,
						is: "light",
						size: "tiny"
					},
					{},
					{}
				)}
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

const css$q = {
	code: ".documents.active .scroll-x-center > *{-webkit-transform:none;transform:none\n    }section.svelte-fiqk5v{height:calc((100vw - var(--screen-padding) * 2) * 1.428);padding:0 var(--screen-padding)}div.svelte-fiqk5v{-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;height:180px;width:126px;padding:15px 5px;-webkit-box-sizing:content-box;box-sizing:content-box}div.start.svelte-fiqk5v{padding-left:var(--screen-padding)}div.end.svelte-fiqk5v{padding-right:var(--screen-padding)}",
	map: "{\"version\":3,\"file\":\"Documents.svelte\",\"sources\":[\"Documents.svelte\"],\"sourcesContent\":[\"<script>\\n    import { classnames } from '@utils'\\n    import Card from '@components/Card.svelte'\\n    import Picture from '@components/Picture.svelte'\\n    import FancyBox from '@components/FancyBox.svelte'\\n    import Carousel from '@components/Carousel.svelte'\\n\\n    export let items = new Array(5).fill({})\\n\\n    let active = false\\n</script>\\n\\n<Carousel items={items} size=\\\"auto\\\" dots={false} let:item={item} let:index={index} class={classnames('documents', { active })}>\\n    <div class={!index ? 'start' : index === items.length - 1 ? 'end' : ''}>\\n        <FancyBox on:open={() => active = true} on:close={() => active = false}>\\n            <Card class=\\\"flex\\\">\\n                <Picture src={item.src} alt={item.title} size=\\\"contain\\\"/>\\n            </Card>\\n            <section slot=\\\"box\\\" class=\\\"flex full-container\\\">\\n                <Card class=\\\"flex\\\">\\n                    <Picture src={item.src} srcBig={item.src2x} alt={item.title} size=\\\"contain\\\"/>\\n                </Card>\\n            </section>\\n        </FancyBox>\\n    </div>\\n</Carousel>\\n\\n<style>\\n    :global(.documents.active .scroll-x-center > *) {\\n        -webkit-transform: none;\\n                transform: none\\n    }\\n\\n    section {\\n        height: calc((100vw - var(--screen-padding) * 2) * 1.428);\\n        padding: 0 var(--screen-padding);\\n    }\\n    \\n    div {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        height: 180px;\\n        width: 126px;\\n        padding: 15px 5px;\\n        -webkit-box-sizing: content-box;\\n                box-sizing: content-box;\\n    }\\n\\n    div.start {\\n        padding-left: var(--screen-padding);\\n    }\\n\\n    div.end {\\n        padding-right: var(--screen-padding);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Eb2N1bWVudHMuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLHVCQUFjO2dCQUFkO0lBQ0o7O0lBRUE7UUFDSSx5REFBeUQ7UUFDekQsZ0NBQWdDO0lBQ3BDOztJQUVBO1FBQ0ksbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsYUFBYTtRQUNiLFlBQVk7UUFDWixpQkFBaUI7UUFDakIsK0JBQXVCO2dCQUF2Qix1QkFBdUI7SUFDM0I7O0lBRUE7UUFDSSxtQ0FBbUM7SUFDdkM7O0lBRUE7UUFDSSxvQ0FBb0M7SUFDeEMiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL0RvY3VtZW50cy5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICA6Z2xvYmFsKC5kb2N1bWVudHMuYWN0aXZlIC5zY3JvbGwteC1jZW50ZXIgPiAqKSB7XG4gICAgICAgIHRyYW5zZm9ybTogbm9uZVxuICAgIH1cblxuICAgIHNlY3Rpb24ge1xuICAgICAgICBoZWlnaHQ6IGNhbGMoKDEwMHZ3IC0gdmFyKC0tc2NyZWVuLXBhZGRpbmcpICogMikgKiAxLjQyOCk7XG4gICAgICAgIHBhZGRpbmc6IDAgdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgIH1cbiAgICBcbiAgICBkaXYge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgICAgICBoZWlnaHQ6IDE4MHB4O1xuICAgICAgICB3aWR0aDogMTI2cHg7XG4gICAgICAgIHBhZGRpbmc6IDE1cHggNXB4O1xuICAgICAgICBib3gtc2l6aW5nOiBjb250ZW50LWJveDtcbiAgICB9XG5cbiAgICBkaXYuc3RhcnQge1xuICAgICAgICBwYWRkaW5nLWxlZnQ6IHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICBkaXYuZW5kIHtcbiAgICAgICAgcGFkZGluZy1yaWdodDogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AA4BY,sCAAsC,AAAE,CAAC,AAC7C,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI;IAC3B,CAAC,AAED,OAAO,cAAC,CAAC,AACL,MAAM,CAAE,KAAK,CAAC,KAAK,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CACzD,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,AACpC,CAAC,AAED,GAAG,cAAC,CAAC,AACD,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,IAAI,CAAC,GAAG,CACjB,kBAAkB,CAAE,WAAW,CACvB,UAAU,CAAE,WAAW,AACnC,CAAC,AAED,GAAG,MAAM,cAAC,CAAC,AACP,YAAY,CAAE,IAAI,gBAAgB,CAAC,AACvC,CAAC,AAED,GAAG,IAAI,cAAC,CAAC,AACL,aAAa,CAAE,IAAI,gBAAgB,CAAC,AACxC,CAAC\"}"
};

const Documents = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = new Array(5).fill({}) } = $$props;
	let active = false;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$q);

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

const css$r = {
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
	$$result.css.add(css$r);

	return `<section class="${"svelte-1s1l67a"}">
    ${validate_component(Avatar, "Avatar").$$render($$result, { src, size: "medium", alt: title }, {}, {})}

    <span class="${"svelte-1s1l67a"}">
        <h4 class="${"svelte-1s1l67a"}">${escape(title)}</h4>
        <sub class="${"svelte-1s1l67a"}">${escape(subtitle)}</sub>
    </span>
</section>`;
});

/* src/components/app/ListItems.svelte generated by Svelte v3.18.1 */

const css$s = {
	code: ".item.svelte-eahofk{display:block;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary);border-radius:var(--border-radius-small);background-color:rgba(var(--theme-bg-color))}",
	map: "{\"version\":3,\"file\":\"ListItems.svelte\",\"sources\":[\"ListItems.svelte\"],\"sourcesContent\":[\"<script>\\n    import AvatarAndName from './AvatarAndName.svelte'\\n\\n    export let items = []\\n    export let basePath = ''\\n</script>\\n\\n{#each items as item}\\n    <a class=\\\"item container\\\" href={`${basePath}/${item.id}`}>\\n        <br>\\n        <AvatarAndName\\n                src={item.org_head_avatar}\\n                title={item.org_head}\\n                subtitle={item.organization}\\n        />\\n        <br>\\n    </a>\\n    <br>\\n{:else}\\n    <section class=\\\"item container\\\">\\n        <p class=\\\"text-center\\\">No organizations</p>\\n    </section>\\n{/each}\\n\\n<style>\\n    .item {\\n        display: block;\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 auto;\\n                flex: 1 1 auto;\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n        border-radius: var(--border-radius-small);\\n        background-color: rgba(var(--theme-bg-color));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9MaXN0SXRlbXMuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGNBQWM7UUFDZCxtQkFBYztZQUFkLGtCQUFjO2dCQUFkLGNBQWM7UUFDZCx5Q0FBaUM7Z0JBQWpDLGlDQUFpQztRQUNqQyx5Q0FBeUM7UUFDekMsNkNBQTZDO0lBQ2pEIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2FwcC9MaXN0SXRlbXMuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLml0ZW0ge1xuICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgZmxleDogMSAxIGF1dG87XG4gICAgICAgIGJveC1zaGFkb3c6IHZhcigtLXNoYWRvdy1wcmltYXJ5KTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cy1zbWFsbCk7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tdGhlbWUtYmctY29sb3IpKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAyBI,KAAK,cAAC,CAAC,AACH,OAAO,CAAE,KAAK,CACd,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACd,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CACtB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACzC,aAAa,CAAE,IAAI,qBAAqB,CAAC,CACzC,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,AACjD,CAAC\"}"
};

const ListItems = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	let { basePath = "" } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	if ($$props.basePath === void 0 && $$bindings.basePath && basePath !== void 0) $$bindings.basePath(basePath);
	$$result.css.add(css$s);

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

/* src/components/app/StoryList.svelte generated by Svelte v3.18.1 */

const css$t = {
	code: "table.svelte-1pgy3nj tr:not(:last-child) td.svelte-1pgy3nj{padding-bottom:16px}table.svelte-1pgy3nj td.svelte-1pgy3nj:last-child{font-weight:300}",
	map: "{\"version\":3,\"file\":\"StoryList.svelte\",\"sources\":[\"StoryList.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames, toCSSString } from '@utils'\\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import Modal from '@components/Modal.svelte'\\n    import Loader from '@components/loader'\\n    import Button from '@components/Button.svelte'\\n    import FormBuilder from '@components/FormBuilder.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let id = undefined\\n    export let name = undefined\\n    export let label = undefined\\n    export let value = undefined\\n    export let style = undefined\\n    export let readonly = undefined\\n\\n    let open = false\\n    let formErrors = []\\n    let formFields = [\\n        {\\n            label: 'Дата:',\\n            type: 'date',\\n            name: 'date',\\n            meta: {\\n                placeholder: '18.03.2019...',\\n            },\\n        },\\n        {\\n            label: 'Добавте назву події:',\\n            type: 'textarea',\\n            name: 'title',\\n            meta: {\\n                placeholder: 'Забрали в притулок...',\\n                rows: 3,\\n                maxlength: 75\\n            },\\n        },\\n    ]\\n\\n    $: idProp = id || name\\n    $: classProp = classnames('story-list', $$props.class)\\n    $: styleProp = toCSSString({ ...style })\\n\\n    function onRemove({ index }, e) {\\n        const val = [...value.filter((_, ind) => ind !== index)]\\n        dispatch('change', { e, name, value: val })\\n    }\\n\\n    async function onSubmit(values) {\\n        console.log(values)\\n    }\\n</script>\\n\\n<style>\\n    table tr:not(:last-child) td {\\n        padding-bottom: 16px;\\n    }\\n\\n    table td:last-child {\\n        font-weight: 300;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9TdG9yeUxpc3Quc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG9CQUFvQjtJQUN4Qjs7SUFFQTtRQUNJLGdCQUFnQjtJQUNwQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvU3RvcnlMaXN0LnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIHRhYmxlIHRyOm5vdCg6bGFzdC1jaGlsZCkgdGQge1xuICAgICAgICBwYWRkaW5nLWJvdHRvbTogMTZweDtcbiAgICB9XG5cbiAgICB0YWJsZSB0ZDpsYXN0LWNoaWxkIHtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDMwMDtcbiAgICB9XG4iXX0= */</style>\\n\\n<section id={idProp} class={classProp} style={styleProp}>\\n    {#if label}\\n        <h2 class=\\\"text-left\\\">{label}</h2>\\n        <Br size=\\\"10\\\"/>\\n    {/if}\\n\\n    <table>\\n        <tbody>\\n            {#if value !== null && Array.isArray(value) && value.length}\\n                {#each value.filter(Boolean) as val, i}\\n                    <tr>\\n                        <td>{val.date}</td>\\n                        <td>—</td>\\n                        <td>{val.title}</td>\\n                        {#if !readonly}\\n                            <td>\\n                                <Button \\n                                    auto \\n                                    style=\\\"vertical-align: middle\\\"\\n                                    on:click={onRemove.bind(null, { id: val.id, index: i })}\\n                                >\\n                                    <Icon type=\\\"close\\\" size=\\\"medium\\\"/>\\n                                </Button>\\n                            </td>\\n                        {/if}\\n                    </tr>\\n                {/each}\\n            {:else if value === null}\\n                <tr>\\n                    <td><Loader type=\\\"p\\\"/></td>\\n                    <td>—</td>\\n                    <td>\\n                        <Loader type=\\\"p\\\"/>\\n                        <Loader type=\\\"p\\\"/>\\n                    </td>\\n                </tr>\\n                <tr>\\n                    <td><Loader type=\\\"p\\\"/></td>\\n                    <td>—</td>\\n                    <td>\\n                        <Loader type=\\\"p\\\"/>\\n                        <Loader type=\\\"p\\\"/>\\n                    </td>\\n                </tr>\\n                <tr>\\n                    <td><Loader type=\\\"p\\\"/></td>\\n                    <td>—</td>\\n                    <td>\\n                        <Loader type=\\\"p\\\"/>\\n                        <Loader type=\\\"p\\\"/>\\n                    </td>\\n                </tr>\\n            {/if}\\n        </tbody>\\n    </table>\\n\\n    {#if !readonly}\\n        <Br size=\\\"25\\\"/>\\n        <Button auto is=\\\"info\\\" on:click={() => open = true}>\\n            <h3 style=\\\"padding: 10px 25px\\\" class=\\\"font-w-500\\\">\\n                Додати подію\\n            </h3>\\n        </Button>\\n    {/if}\\n</section>\\n\\n<Modal \\n    {open}\\n    swipe=\\\"all\\\"\\n    id=\\\"story-life-modal\\\"\\n    size=\\\"medium\\\"\\n    title=\\\"Створення події\\\"\\n    on:close={() => open = false}\\n>\\n    <div class=\\\"container\\\">\\n        <Br size=\\\"20\\\"/>\\n        <FormBuilder\\n                id=\\\"story-form\\\"\\n                items={formFields}\\n                errors={formErrors}\\n                submit={onSubmit}\\n        />\\n        <Br size=\\\"40\\\"/>\\n        <Button\\n                is=\\\"info\\\"\\n                size=\\\"medium\\\"\\n                type=\\\"submit\\\"\\n                form=\\\"story-form\\\"\\n                class=\\\"full-width\\\"\\n        >\\n            <h3>Зберегти</h3>\\n        </Button>\\n        <Br size=\\\"20\\\"/>\\n    </div>\\n</Modal>\\n\"],\"names\":[],\"mappings\":\"AAyDI,oBAAK,CAAC,EAAE,KAAK,WAAW,CAAC,CAAC,EAAE,eAAC,CAAC,AAC1B,cAAc,CAAE,IAAI,AACxB,CAAC,AAED,oBAAK,CAAC,iBAAE,WAAW,AAAC,CAAC,AACjB,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

async function onSubmit(values) {
	console.log(values);
}

const StoryList = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { name = undefined } = $$props;
	let { label = undefined } = $$props;
	let { value = undefined } = $$props;
	let { style = undefined } = $$props;
	let { readonly = undefined } = $$props;
	let open = false;
	let formErrors = [];

	let formFields = [
		{
			label: "Дата:",
			type: "date",
			name: "date",
			meta: { placeholder: "18.03.2019..." }
		},
		{
			label: "Добавте назву події:",
			type: "textarea",
			name: "title",
			meta: {
				placeholder: "Забрали в притулок...",
				rows: 3,
				maxlength: 75
			}
		}
	];

	if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
	if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
	if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
	if ($$props.style === void 0 && $$bindings.style && style !== void 0) $$bindings.style(style);
	if ($$props.readonly === void 0 && $$bindings.readonly && readonly !== void 0) $$bindings.readonly(readonly);
	$$result.css.add(css$t);
	let idProp = id || name;
	let classProp = classnames("story-list", $$props.class);
	let styleProp = toCSSString({ ...style });

	return `<section${add_attribute("id", idProp, 0)}${add_attribute("class", classProp, 0)}${add_attribute("style", styleProp, 0)}>
    ${label
	? `<h2 class="${"text-left"}">${escape(label)}</h2>
        ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}`
	: ``}

    <table class="${"svelte-1pgy3nj"}">
        <tbody>
            ${value !== null && Array.isArray(value) && value.length
	? `${each(value.filter(Boolean), (val, i) => `<tr>
                        <td class="${"svelte-1pgy3nj"}">${escape(val.date)}</td>
                        <td class="${"svelte-1pgy3nj"}">—</td>
                        <td class="${"svelte-1pgy3nj"}">${escape(val.title)}</td>
                        ${!readonly
		? `<td class="${"svelte-1pgy3nj"}">
                                ${validate_component(Button, "Button").$$render(
				$$result,
				{
					auto: true,
					style: "vertical-align: middle"
				},
				{},
				{
					default: () => `
                                    ${validate_component(Icon, "Icon").$$render($$result, { type: "close", size: "medium" }, {}, {})}
                                `
				}
			)}
                            </td>`
		: ``}
                    </tr>`)}`
	: `${value === null
		? `<tr>
                    <td class="${"svelte-1pgy3nj"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</td>
                    <td class="${"svelte-1pgy3nj"}">—</td>
                    <td class="${"svelte-1pgy3nj"}">
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                    </td>
                </tr>
                <tr>
                    <td class="${"svelte-1pgy3nj"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</td>
                    <td class="${"svelte-1pgy3nj"}">—</td>
                    <td class="${"svelte-1pgy3nj"}">
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                    </td>
                </tr>
                <tr>
                    <td class="${"svelte-1pgy3nj"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</td>
                    <td class="${"svelte-1pgy3nj"}">—</td>
                    <td class="${"svelte-1pgy3nj"}">
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}
                    </td>
                </tr>`
		: ``}`}
        </tbody>
    </table>

    ${!readonly
	? `${validate_component(Br, "Br").$$render($$result, { size: "25" }, {}, {})}
        ${validate_component(Button, "Button").$$render($$result, { auto: true, is: "info" }, {}, {
			default: () => `
            <h3 style="${"padding: 10px 25px"}" class="${"font-w-500"}">
                Додати подію
            </h3>
        `
		})}`
	: ``}
</section>

${validate_component(Modal, "Modal").$$render(
		$$result,
		{
			open,
			swipe: "all",
			id: "story-life-modal",
			size: "medium",
			title: "Створення події"
		},
		{},
		{
			default: () => `
    <div class="${"container"}">
        ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
        ${validate_component(FormBuilder, "FormBuilder").$$render(
				$$result,
				{
					id: "story-form",
					items: formFields,
					errors: formErrors,
					submit: onSubmit
				},
				{},
				{}
			)}
        ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}
        ${validate_component(Button, "Button").$$render(
				$$result,
				{
					is: "info",
					size: "medium",
					type: "submit",
					form: "story-form",
					class: "full-width"
				},
				{},
				{
					default: () => `
            <h3>Зберегти</h3>
        `
				}
			)}
        ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
    </div>
`
		}
	)}`;
});

/* src/components/app/SearchLine.svelte generated by Svelte v3.18.1 */

const SearchLine = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<section class="${"search svelte-ibwz4z"}">
    ${validate_component(Input, "Input").$$render($$result, {}, {}, {})}
</section>`;
});

/* src/components/app/TrustButton.svelte generated by Svelte v3.18.1 */

const css$u = {
	code: ".trust-btn.svelte-1dzr9dp.svelte-1dzr9dp{position:relative;display:block;width:100%;height:0;padding-bottom:100%;border-radius:50%;overflow:hidden}div.svelte-1dzr9dp.svelte-1dzr9dp{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;border-radius:50%;border:4px solid rgba(var(--color-danger));background-color:rgba(var(--color-danger), .2)}.trust-btn.isActive.svelte-1dzr9dp div.svelte-1dzr9dp{background-color:rgba(var(--color-danger), 1)}.trust-btn.isActive.svelte-1dzr9dp span.svelte-1dzr9dp{color:rgba(var(--color-white));-webkit-animation:none;animation:none;-webkit-transform:scale(1.1);transform:scale(1.1)\n    }span.svelte-1dzr9dp.svelte-1dzr9dp{display:-webkit-box;display:-ms-flexbox;display:flex;width:50%;height:50%;margin-top:3px;max-width:calc(100% - 10px);max-height:calc(100% - 10px);color:rgba(var(--color-danger));-webkit-animation:svelte-1dzr9dp-pulse 2s infinite;animation:svelte-1dzr9dp-pulse 2s infinite}@-webkit-keyframes svelte-1dzr9dp-pulse{10%{-webkit-transform:scale(1.1);transform:scale(1.1)\n        }20%{-webkit-transform:scale(1.05);transform:scale(1.05)\n        }30%{-webkit-transform:scale(1.15);transform:scale(1.15)\n        }}@keyframes svelte-1dzr9dp-pulse{10%{-webkit-transform:scale(1.1);transform:scale(1.1)\n        }20%{-webkit-transform:scale(1.05);transform:scale(1.05)\n        }30%{-webkit-transform:scale(1.15);transform:scale(1.15)\n        }}",
	map: "{\"version\":3,\"file\":\"TrustButton.svelte\",\"sources\":[\"TrustButton.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { classnames } from '@utils'\\n    import Icon from '@components/Icon.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let isActive = null\\n    export let onAsyncClick = null\\n\\n    let isActiveLocal = !!isActive\\n\\n    $: isActiveState = isActive === null ? isActiveLocal : isActive\\n    $: classProp = classnames('trust-btn', $$props.class, { isActive: isActiveState })\\n\\n    function onClickHandler(e) {\\n        onClickEvent(e)\\n        onClickPromise(e)\\n    }\\n\\n    function onClickEvent(e) {\\n        dispatch('click', e)\\n    }\\n\\n    const onClickPromise = async (e) => {\\n        if (typeof onAsyncClick === 'function') {\\n            try {\\n                isActiveLocal = !isActiveLocal\\n                await onAsyncClick(e)\\n            } catch (err) {\\n                isActiveLocal = !isActiveLocal\\n            }\\n        }\\n    }\\n</script>\\n\\n<button type=\\\"button\\\" title=\\\"I trust\\\" class={classProp} on:click={onClickHandler}>\\n    <div class=\\\"full-absolute\\\">\\n        <span>\\n            <Icon type=\\\"heart\\\" is={isActive ? 'light' : 'danger'}/>\\n        </span>\\n    </div>\\n</button>\\n\\n<style>\\n    .trust-btn {\\n        position: relative;\\n        display: block;\\n        width: 100%;\\n        height: 0;\\n        padding-bottom: 100%;\\n        border-radius: 50%;\\n        overflow: hidden;\\n    }\\n\\n    div {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        border-radius: 50%;\\n        border: 4px solid rgba(var(--color-danger));\\n        background-color: rgba(var(--color-danger), .2);\\n    }\\n\\n    .trust-btn.isActive div {\\n        background-color: rgba(var(--color-danger), 1);\\n    }\\n\\n    .trust-btn.isActive span {\\n        color: rgba(var(--color-white));\\n        -webkit-animation: none;\\n                animation: none;\\n        -webkit-transform: scale(1.1);\\n                transform: scale(1.1)\\n    }\\n\\n    span {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        width: 50%;\\n        height: 50%;\\n        margin-top: 3px;\\n        max-width: calc(100% - 10px);\\n        max-height: calc(100% - 10px);\\n        color: rgba(var(--color-danger));\\n        -webkit-animation: pulse 2s infinite;\\n                animation: pulse 2s infinite;\\n    }\\n\\n    @-webkit-keyframes pulse {\\n        10% {\\n            -webkit-transform: scale(1.1);\\n                    transform: scale(1.1)\\n        }\\n        20% {\\n            -webkit-transform: scale(1.05);\\n                    transform: scale(1.05)\\n        }\\n        30% {\\n            -webkit-transform: scale(1.15);\\n                    transform: scale(1.15)\\n        }\\n    }\\n\\n    @keyframes pulse {\\n        10% {\\n            -webkit-transform: scale(1.1);\\n                    transform: scale(1.1)\\n        }\\n        20% {\\n            -webkit-transform: scale(1.05);\\n                    transform: scale(1.05)\\n        }\\n        30% {\\n            -webkit-transform: scale(1.15);\\n                    transform: scale(1.15)\\n        }\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9UcnVzdEJ1dHRvbi5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksa0JBQWtCO1FBQ2xCLGNBQWM7UUFDZCxXQUFXO1FBQ1gsU0FBUztRQUNULG9CQUFvQjtRQUNwQixrQkFBa0I7UUFDbEIsZ0JBQWdCO0lBQ3BCOztJQUVBO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLGtCQUFrQjtRQUNsQiwyQ0FBMkM7UUFDM0MsK0NBQStDO0lBQ25EOztJQUVBO1FBQ0ksOENBQThDO0lBQ2xEOztJQUVBO1FBQ0ksK0JBQStCO1FBQy9CLHVCQUFlO2dCQUFmLGVBQWU7UUFDZiw2QkFBb0I7Z0JBQXBCO0lBQ0o7O0lBRUE7UUFDSSxvQkFBYTtRQUFiLG9CQUFhO1FBQWIsYUFBYTtRQUNiLFVBQVU7UUFDVixXQUFXO1FBQ1gsZUFBZTtRQUNmLDRCQUE0QjtRQUM1Qiw2QkFBNkI7UUFDN0IsZ0NBQWdDO1FBQ2hDLG9DQUE0QjtnQkFBNUIsNEJBQTRCO0lBQ2hDOztJQUVBO1FBQ0k7WUFDSSw2QkFBb0I7b0JBQXBCO1FBQ0o7UUFDQTtZQUNJLDhCQUFxQjtvQkFBckI7UUFDSjtRQUNBO1lBQ0ksOEJBQXFCO29CQUFyQjtRQUNKO0lBQ0o7O0lBVkE7UUFDSTtZQUNJLDZCQUFvQjtvQkFBcEI7UUFDSjtRQUNBO1lBQ0ksOEJBQXFCO29CQUFyQjtRQUNKO1FBQ0E7WUFDSSw4QkFBcUI7b0JBQXJCO1FBQ0o7SUFDSiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvVHJ1c3RCdXR0b24uc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnRydXN0LWJ0biB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBoZWlnaHQ6IDA7XG4gICAgICAgIHBhZGRpbmctYm90dG9tOiAxMDAlO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgfVxuXG4gICAgZGl2IHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgICAgYm9yZGVyOiA0cHggc29saWQgcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpLCAuMik7XG4gICAgfVxuXG4gICAgLnRydXN0LWJ0bi5pc0FjdGl2ZSBkaXYge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLWRhbmdlciksIDEpO1xuICAgIH1cblxuICAgIC50cnVzdC1idG4uaXNBY3RpdmUgc3BhbiB7XG4gICAgICAgIGNvbG9yOiByZ2JhKHZhcigtLWNvbG9yLXdoaXRlKSk7XG4gICAgICAgIGFuaW1hdGlvbjogbm9uZTtcbiAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxLjEpXG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIHdpZHRoOiA1MCU7XG4gICAgICAgIGhlaWdodDogNTAlO1xuICAgICAgICBtYXJnaW4tdG9wOiAzcHg7XG4gICAgICAgIG1heC13aWR0aDogY2FsYygxMDAlIC0gMTBweCk7XG4gICAgICAgIG1heC1oZWlnaHQ6IGNhbGMoMTAwJSAtIDEwcHgpO1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1kYW5nZXIpKTtcbiAgICAgICAgYW5pbWF0aW9uOiBwdWxzZSAycyBpbmZpbml0ZTtcbiAgICB9XG5cbiAgICBAa2V5ZnJhbWVzIHB1bHNlIHtcbiAgICAgICAgMTAlIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4xKVxuICAgICAgICB9XG4gICAgICAgIDIwJSB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMDUpXG4gICAgICAgIH1cbiAgICAgICAgMzAlIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4xNSlcbiAgICAgICAgfVxuICAgIH1cbiJdfQ== */</style>\\n\"],\"names\":[],\"mappings\":\"AA6CI,UAAU,8BAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,CAAC,CACT,cAAc,CAAE,IAAI,CACpB,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,AACpB,CAAC,AAED,GAAG,8BAAC,CAAC,AACD,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,aAAa,CAAE,GAAG,CAClB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,IAAI,cAAc,CAAC,CAAC,CAC3C,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,EAAE,CAAC,AACnD,CAAC,AAED,UAAU,wBAAS,CAAC,GAAG,eAAC,CAAC,AACrB,gBAAgB,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAAC,CAAC,CAAC,AAClD,CAAC,AAED,UAAU,wBAAS,CAAC,IAAI,eAAC,CAAC,AACtB,KAAK,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAC/B,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI,CACvB,iBAAiB,CAAE,MAAM,GAAG,CAAC,CACrB,SAAS,CAAE,MAAM,GAAG,CAAC;IACjC,CAAC,AAED,IAAI,8BAAC,CAAC,AACF,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,UAAU,CAAE,GAAG,CACf,SAAS,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAC5B,UAAU,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAC7B,KAAK,CAAE,KAAK,IAAI,cAAc,CAAC,CAAC,CAChC,iBAAiB,CAAE,oBAAK,CAAC,EAAE,CAAC,QAAQ,CAC5B,SAAS,CAAE,oBAAK,CAAC,EAAE,CAAC,QAAQ,AACxC,CAAC,AAED,mBAAmB,oBAAM,CAAC,AACtB,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,GAAG,CAAC,CACrB,SAAS,CAAE,MAAM,GAAG,CAAC;QACjC,CAAC,AACD,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,IAAI,CAAC,CACtB,SAAS,CAAE,MAAM,IAAI,CAAC;QAClC,CAAC,AACD,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,IAAI,CAAC,CACtB,SAAS,CAAE,MAAM,IAAI,CAAC;QAClC,CAAC,AACL,CAAC,AAED,WAAW,oBAAM,CAAC,AACd,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,GAAG,CAAC,CACrB,SAAS,CAAE,MAAM,GAAG,CAAC;QACjC,CAAC,AACD,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,IAAI,CAAC,CACtB,SAAS,CAAE,MAAM,IAAI,CAAC;QAClC,CAAC,AACD,GAAG,AAAC,CAAC,AACD,iBAAiB,CAAE,MAAM,IAAI,CAAC,CACtB,SAAS,CAAE,MAAM,IAAI,CAAC;QAClC,CAAC,AACL,CAAC\"}"
};

const TrustButton = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { isActive = null } = $$props;
	let { onAsyncClick = null } = $$props;
	let isActiveLocal = !!isActive;

	if ($$props.isActive === void 0 && $$bindings.isActive && isActive !== void 0) $$bindings.isActive(isActive);
	if ($$props.onAsyncClick === void 0 && $$bindings.onAsyncClick && onAsyncClick !== void 0) $$bindings.onAsyncClick(onAsyncClick);
	$$result.css.add(css$u);
	let isActiveState = isActive === null ? isActiveLocal : isActive;
	let classProp = classnames("trust-btn", $$props.class, { isActive: isActiveState });

	return `<button type="${"button"}" title="${"I trust"}" class="${escape(null_to_empty(classProp)) + " svelte-1dzr9dp"}">
    <div class="${"full-absolute svelte-1dzr9dp"}">
        <span class="${"svelte-1dzr9dp"}">
            ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			type: "heart",
			is: isActive ? "light" : "danger"
		},
		{},
		{}
	)}
        </span>
    </div>
</button>`;
});

/* src/components/app/ListsLayout.svelte generated by Svelte v3.18.1 */

const css$v = {
	code: ".search.svelte-1vpuklg.svelte-1vpuklg{-webkit-box-flex:0;-ms-flex:none;flex:none;position:relative;-webkit-box-shadow:var(--shadow-primary);box-shadow:var(--shadow-primary)}.list-wrap.svelte-1vpuklg.svelte-1vpuklg{-webkit-box-flex:1;-ms-flex:1 1 0px;flex:1 1 0;overflow-x:hidden;overflow-y:auto;padding:0 var(--screen-padding);-webkit-box-shadow:inset 0 -100px 2000px rgba(var(--color-black), .5);box-shadow:inset 0 -100px 2000px rgba(var(--color-black), .5)}nav.svelte-1vpuklg ul.svelte-1vpuklg,nav.svelte-1vpuklg li.svelte-1vpuklg{display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch}li.svelte-1vpuklg.svelte-1vpuklg{-webkit-box-flex:1;-ms-flex:1 1 0px;flex:1 1 0}li.svelte-1vpuklg a.svelte-1vpuklg{-webkit-box-flex:1;-ms-flex:1 1 0px;flex:1 1 0;-ms-flex-item-align:stretch;align-self:stretch;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;text-align:center;padding:20px 10px}li.svelte-1vpuklg a.svelte-1vpuklg:hover,li.svelte-1vpuklg a.selected.svelte-1vpuklg{background-color:rgba(var(--color-black), .1)}",
	map: "{\"version\":3,\"file\":\"ListsLayout.svelte\",\"sources\":[\"ListsLayout.svelte\"],\"sourcesContent\":[\"<svelte:head>\\n    <title>Charitify - is the application for helping those in need.</title>\\n</svelte:head>\\n\\n<script>\\n    import Footer from './Footer.svelte'\\n    import SearchLine from './SearchLine.svelte'\\n\\n    export let segment\\n</script>\\n\\n<div class=\\\"search theme-bg container\\\">\\n    <br>\\n\\n    <SearchLine/>\\n\\n    <nav>\\n        <ul>\\n            <li><a rel=prefetch href='lists/funds' class:selected='{segment === \\\"charities\\\"}'>funds</a></li>\\n            <li><a rel=prefetch href='lists/organizations' class:selected='{segment === \\\"organizations\\\"}'>organizations</a></li>\\n        </ul>\\n    </nav>\\n</div>\\n\\n<div class=\\\"list-wrap\\\">\\n    <br>\\n\\n    <slot></slot>\\n\\n    <br>\\n    <br>\\n</div>\\n\\n<Footer/>\\n\\n<style>\\n    .search {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        position: relative;\\n        -webkit-box-shadow: var(--shadow-primary);\\n                box-shadow: var(--shadow-primary);\\n    }\\n\\n    .list-wrap {\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 0px;\\n                flex: 1 1 0;\\n        overflow-x: hidden;\\n        overflow-y: auto;\\n        padding: 0 var(--screen-padding);\\n        -webkit-box-shadow: inset 0 -100px 2000px rgba(var(--color-black), .5);\\n                box-shadow: inset 0 -100px 2000px rgba(var(--color-black), .5);\\n    }\\n\\n    nav ul, nav li {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-align: stretch;\\n            -ms-flex-align: stretch;\\n                align-items: stretch;\\n        -webkit-box-pack: stretch;\\n            -ms-flex-pack: stretch;\\n                justify-content: stretch;\\n    }\\n\\n    li {\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 0px;\\n                flex: 1 1 0;\\n    }\\n\\n    li a {\\n        -webkit-box-flex: 1;\\n            -ms-flex: 1 1 0px;\\n                flex: 1 1 0;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        text-align: center;\\n        padding: 20px 10px;\\n    }\\n\\n    li a:hover, li a.selected {\\n        background-color: rgba(var(--color-black), .1);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9MaXN0c0xheW91dC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksbUJBQVU7WUFBVixjQUFVO2dCQUFWLFVBQVU7UUFDVixrQkFBa0I7UUFDbEIseUNBQWlDO2dCQUFqQyxpQ0FBaUM7SUFDckM7O0lBRUE7UUFDSSxtQkFBVztZQUFYLGlCQUFXO2dCQUFYLFdBQVc7UUFDWCxrQkFBa0I7UUFDbEIsZ0JBQWdCO1FBQ2hCLGdDQUFnQztRQUNoQyxzRUFBOEQ7Z0JBQTlELDhEQUE4RDtJQUNsRTs7SUFFQTtRQUNJLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IsNEJBQW1CO1lBQW5CLG1CQUFtQjtRQUNuQiwwQkFBb0I7WUFBcEIsdUJBQW9CO2dCQUFwQixvQkFBb0I7UUFDcEIseUJBQXdCO1lBQXhCLHNCQUF3QjtnQkFBeEIsd0JBQXdCO0lBQzVCOztJQUVBO1FBQ0ksbUJBQVc7WUFBWCxpQkFBVztnQkFBWCxXQUFXO0lBQ2Y7O0lBRUE7UUFDSSxtQkFBVztZQUFYLGlCQUFXO2dCQUFYLFdBQVc7UUFDWCw0QkFBbUI7WUFBbkIsbUJBQW1CO1FBQ25CLG9CQUFhO1FBQWIsb0JBQWE7UUFBYixhQUFhO1FBQ2IseUJBQW1CO1lBQW5CLHNCQUFtQjtnQkFBbkIsbUJBQW1CO1FBQ25CLHdCQUF1QjtZQUF2QixxQkFBdUI7Z0JBQXZCLHVCQUF1QjtRQUN2QixrQkFBa0I7UUFDbEIsa0JBQWtCO0lBQ3RCOztJQUVBO1FBQ0ksOENBQThDO0lBQ2xEIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2FwcC9MaXN0c0xheW91dC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuc2VhcmNoIHtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLmxpc3Qtd3JhcCB7XG4gICAgICAgIGZsZXg6IDEgMSAwO1xuICAgICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIHBhZGRpbmc6IDAgdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuICAgICAgICBib3gtc2hhZG93OiBpbnNldCAwIC0xMDBweCAyMDAwcHggcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC41KTtcbiAgICB9XG5cbiAgICBuYXYgdWwsIG5hdiBsaSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG4gICAgfVxuXG4gICAgbGkge1xuICAgICAgICBmbGV4OiAxIDEgMDtcbiAgICB9XG5cbiAgICBsaSBhIHtcbiAgICAgICAgZmxleDogMSAxIDA7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIHBhZGRpbmc6IDIwcHggMTBweDtcbiAgICB9XG5cbiAgICBsaSBhOmhvdmVyLCBsaSBhLnNlbGVjdGVkIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4xKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAoCI,OAAO,8BAAC,CAAC,AACL,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,QAAQ,CAAE,QAAQ,CAClB,kBAAkB,CAAE,IAAI,gBAAgB,CAAC,CACjC,UAAU,CAAE,IAAI,gBAAgB,CAAC,AAC7C,CAAC,AAED,UAAU,8BAAC,CAAC,AACR,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CACb,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAChC,kBAAkB,CAAE,KAAK,CAAC,CAAC,CAAC,MAAM,CAAC,MAAM,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,CAC9D,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,MAAM,CAAC,MAAM,CAAC,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AAC1E,CAAC,AAED,kBAAG,CAAC,iBAAE,CAAE,kBAAG,CAAC,EAAE,eAAC,CAAC,AACZ,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,iBAAiB,CAAE,OAAO,CACtB,cAAc,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CAC5B,gBAAgB,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CAClB,eAAe,CAAE,OAAO,AACpC,CAAC,AAED,EAAE,8BAAC,CAAC,AACA,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CACb,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,AACvB,CAAC,AAED,iBAAE,CAAC,CAAC,eAAC,CAAC,AACF,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CACb,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,IAAI,CAAC,IAAI,AACtB,CAAC,AAED,iBAAE,CAAC,gBAAC,MAAM,CAAE,iBAAE,CAAC,CAAC,SAAS,eAAC,CAAC,AACvB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAAC,EAAE,CAAC,AAClD,CAAC\"}"
};

const ListsLayout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	$$result.css.add(css$v);

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

const css$w = {
	code: "section.svelte-gnegnw{text-align:center;padding:0 3vw}h2.svelte-gnegnw{font-weight:400}",
	map: "{\"version\":3,\"file\":\"TitleSubTitle.svelte\",\"sources\":[\"TitleSubTitle.svelte\"],\"sourcesContent\":[\"<script>\\n    export let title = 'The main title that explains the charity'\\n    export let subtitle = 'And bigger description that describes in short keywords a charity, title above and just makes text longer'\\n</script>\\n\\n<section>\\n    <h1>{title}</h1>\\n    <br>\\n    <h2>{subtitle}</h2>\\n</section>\\n\\n<style>\\n    section {\\n        text-align: center;\\n        padding: 0 3vw;\\n    }\\n\\n    h2 {\\n        font-weight: 400;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9UaXRsZVN1YlRpdGxlLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxrQkFBa0I7UUFDbEIsY0FBYztJQUNsQjs7SUFFQTtRQUNJLGdCQUFnQjtJQUNwQiIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9hcHAvVGl0bGVTdWJUaXRsZS5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBzZWN0aW9uIHtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBwYWRkaW5nOiAwIDN2dztcbiAgICB9XG5cbiAgICBoMiB7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA0MDA7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAYI,OAAO,cAAC,CAAC,AACL,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,CAAC,CAAC,GAAG,AAClB,CAAC,AAED,EAAE,cAAC,CAAC,AACA,WAAW,CAAE,GAAG,AACpB,CAAC\"}"
};

const TitleSubTitle = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = "The main title that explains the charity" } = $$props;
	let { subtitle = "And bigger description that describes in short keywords a charity, title above and just makes text longer" } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
	$$result.css.add(css$w);

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

const css$x = {
	code: ".donate-btn.svelte-1f6vjy3{position:fixed;left:0;bottom:env(safe-area-inset-bottom);display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;width:100%;font-weight:600;font-size:1.85em;line-height:1.26;color:rgba(var(--color-white));padding:20px;z-index:9;-ms-touch-action:manipulation;touch-action:manipulation;text-align:center;-webkit-transition:.3s ease-in-out;transition:.3s ease-in-out;-webkit-transform:translateY(100%);transform:translateY(100%);background-color:rgba(var(--color-success))}span.svelte-1f6vjy3{-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;height:32px;width:32px;border-radius:50%;overflow:hidden;background-color:rgba(var(--color-white))}.donate-btn.active.svelte-1f6vjy3{-webkit-transform:none;transform:none\n    }",
	map: "{\"version\":3,\"file\":\"DonationButton.svelte\",\"sources\":[\"DonationButton.svelte\"],\"sourcesContent\":[\"<script>\\n    import { onMount } from 'svelte'\\n    import { classnames } from '@utils'\\n    import Icon from '@components/Icon.svelte'\\n\\n    let activeDonateBtn = false\\n\\n    onMount(() => setTimeout(() => activeDonateBtn = true, 500))\\n\\n    $: classPropDonateBtn = classnames('donate-btn', { active: activeDonateBtn })\\n\\n    function onDonate() {\\n        alert('Дякую! 🥰')\\n    }\\n</script>\\n\\n<button type=\\\"button\\\" class={classPropDonateBtn} on:click={onDonate}>\\n    <span>\\n        <Icon type=\\\"coin\\\" size=\\\"medium\\\" is=\\\"primary\\\"/>\\n    </span>\\n    <s></s>\\n    <s></s>\\n    Допомогти\\n</button>\\n\\n<style>\\n    .donate-btn {\\n        position: fixed;\\n        left: 0;\\n        bottom: env(safe-area-inset-bottom);\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        width: 100%;\\n        font-weight: 600;\\n        font-size: 1.85em;\\n        line-height: 1.26;\\n        color: rgba(var(--color-white));\\n        padding: 20px;\\n        z-index: 9;\\n        -ms-touch-action: manipulation;\\n            touch-action: manipulation;\\n        text-align: center;\\n        -webkit-transition: .3s ease-in-out;\\n        transition: .3s ease-in-out;\\n        -webkit-transform: translateY(100%);\\n                transform: translateY(100%);\\n        background-color: rgba(var(--color-success));\\n    }\\n\\n    span {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        -webkit-box-pack: center;\\n            -ms-flex-pack: center;\\n                justify-content: center;\\n        height: 32px;\\n        width: 32px;\\n        border-radius: 50%;\\n        overflow: hidden;\\n        background-color: rgba(var(--color-white));\\n    }\\n\\n    .donate-btn.active {\\n        -webkit-transform: none;\\n                transform: none\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9Eb25hdGlvbkJ1dHRvbi5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksZUFBZTtRQUNmLE9BQU87UUFDUCxtQ0FBbUM7UUFDbkMsb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLFdBQVc7UUFDWCxnQkFBZ0I7UUFDaEIsaUJBQWlCO1FBQ2pCLGlCQUFpQjtRQUNqQiwrQkFBK0I7UUFDL0IsYUFBYTtRQUNiLFVBQVU7UUFDViw4QkFBMEI7WUFBMUIsMEJBQTBCO1FBQzFCLGtCQUFrQjtRQUNsQixtQ0FBMkI7UUFBM0IsMkJBQTJCO1FBQzNCLG1DQUEyQjtnQkFBM0IsMkJBQTJCO1FBQzNCLDRDQUE0QztJQUNoRDs7SUFFQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1Ysb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsd0JBQXVCO1lBQXZCLHFCQUF1QjtnQkFBdkIsdUJBQXVCO1FBQ3ZCLFlBQVk7UUFDWixXQUFXO1FBQ1gsa0JBQWtCO1FBQ2xCLGdCQUFnQjtRQUNoQiwwQ0FBMEM7SUFDOUM7O0lBRUE7UUFDSSx1QkFBYztnQkFBZDtJQUNKIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2FwcC9Eb25hdGlvbkJ1dHRvbi5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAuZG9uYXRlLWJ0biB7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgbGVmdDogMDtcbiAgICAgICAgYm90dG9tOiBlbnYoc2FmZS1hcmVhLWluc2V0LWJvdHRvbSk7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgZm9udC1zaXplOiAxLjg1ZW07XG4gICAgICAgIGxpbmUtaGVpZ2h0OiAxLjI2O1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci13aGl0ZSkpO1xuICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICB6LWluZGV4OiA5O1xuICAgICAgICB0b3VjaC1hY3Rpb246IG1hbmlwdWxhdGlvbjtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICB0cmFuc2l0aW9uOiAuM3MgZWFzZS1pbi1vdXQ7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgxMDAlKTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1zdWNjZXNzKSk7XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBoZWlnaHQ6IDMycHg7XG4gICAgICAgIHdpZHRoOiAzMnB4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tY29sb3Itd2hpdGUpKTtcbiAgICB9XG5cbiAgICAuZG9uYXRlLWJ0bi5hY3RpdmUge1xuICAgICAgICB0cmFuc2Zvcm06IG5vbmVcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AA0BI,WAAW,eAAC,CAAC,AACT,QAAQ,CAAE,KAAK,CACf,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,sBAAsB,CAAC,CACnC,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,KAAK,CAAE,IAAI,CACX,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,CAC/B,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,CAAC,CACV,gBAAgB,CAAE,YAAY,CAC1B,YAAY,CAAE,YAAY,CAC9B,UAAU,CAAE,MAAM,CAClB,kBAAkB,CAAE,GAAG,CAAC,WAAW,CACnC,UAAU,CAAE,GAAG,CAAC,WAAW,CAC3B,iBAAiB,CAAE,WAAW,IAAI,CAAC,CAC3B,SAAS,CAAE,WAAW,IAAI,CAAC,CACnC,gBAAgB,CAAE,KAAK,IAAI,eAAe,CAAC,CAAC,AAChD,CAAC,AAED,IAAI,eAAC,CAAC,AACF,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,gBAAgB,CAAE,MAAM,CACpB,aAAa,CAAE,MAAM,CACjB,eAAe,CAAE,MAAM,CAC/B,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,gBAAgB,CAAE,KAAK,IAAI,aAAa,CAAC,CAAC,AAC9C,CAAC,AAED,WAAW,OAAO,eAAC,CAAC,AAChB,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI;IAC3B,CAAC\"}"
};

const DonationButton = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let activeDonateBtn = false;
	onMount(() => setTimeout(() => activeDonateBtn = true, 500));
	$$result.css.add(css$x);
	let classPropDonateBtn = classnames("donate-btn", { active: activeDonateBtn });

	return `<button type="${"button"}" class="${escape(null_to_empty(classPropDonateBtn)) + " svelte-1f6vjy3"}">
    <span class="${"svelte-1f6vjy3"}">
        ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			type: "coin",
			size: "medium",
			is: "primary"
		},
		{},
		{}
	)}
    </span>
    <s></s>
    <s></s>
    Допомогти
</button>`;
});

/* src/components/app/ListOfFeatures.svelte generated by Svelte v3.18.1 */

const css$y = {
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

	$$result.css.add(css$y);

	return `<ul class="${"svelte-17ny656"}">
    ${each(items, item => `<li class="${"svelte-17ny656"}">
            <h3 class="${"svelte-17ny656"}">${escape(item.title)}</h3>
            <p class="${"svelte-17ny656"}">${escape(item.text)}</p>
            <br>
        </li>`)}
</ul>`;
});

/* src/components/app/OfflineMessage.svelte generated by Svelte v3.18.1 */

const css$z = {
	code: "#offline-message{position:fixed;z-index:11;bottom:calc(env(safe-area-inset-bottom) + 100px);left:50%;padding:10px 20px;background-color:rgba(var(--theme-bg-color));border-radius:var(--border-radius-small);overflow:hidden;-webkit-transition:.2s ease-out;transition:.2s ease-out;opacity:0;pointer-events:none;-webkit-transform:translate3d(-50%, 20px, 0);transform:translate3d(-50%, 20px, 0)}#offline-message.active{opacity:1;pointer-events:auto;-webkit-transform:translate3d(-50%, 0, 0);transform:translate3d(-50%, 0, 0)}",
	map: "{\"version\":3,\"file\":\"OfflineMessage.svelte\",\"sources\":[\"OfflineMessage.svelte\"],\"sourcesContent\":[\"<script>\\n</script>\\n\\n<section id=\\\"offline-message\\\">\\n    Сторінка оффлайн\\n</section>\\n\\n<style>\\n    :global(#offline-message) {\\n        position: fixed;\\n        z-index: 11;\\n        bottom: calc(env(safe-area-inset-bottom) + 100px);\\n        left: 50%;\\n        padding: 10px 20px;\\n        background-color: rgba(var(--theme-bg-color));\\n        border-radius: var(--border-radius-small);\\n        overflow: hidden;\\n        -webkit-transition: .2s ease-out;\\n        transition: .2s ease-out;\\n        opacity: 0;\\n        pointer-events: none;\\n        -webkit-transform: translate3d(-50%, 20px, 0);\\n                transform: translate3d(-50%, 20px, 0);\\n    }\\n    :global(#offline-message.active) {\\n        opacity: 1;\\n        pointer-events: auto;\\n        -webkit-transform: translate3d(-50%, 0, 0);\\n                transform: translate3d(-50%, 0, 0);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2FwcC9PZmZsaW5lTWVzc2FnZS5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksZUFBZTtRQUNmLFdBQVc7UUFDWCxpREFBaUQ7UUFDakQsU0FBUztRQUNULGtCQUFrQjtRQUNsQiw2Q0FBNkM7UUFDN0MseUNBQXlDO1FBQ3pDLGdCQUFnQjtRQUNoQixnQ0FBd0I7UUFBeEIsd0JBQXdCO1FBQ3hCLFVBQVU7UUFDVixvQkFBb0I7UUFDcEIsNkNBQXFDO2dCQUFyQyxxQ0FBcUM7SUFDekM7SUFDQTtRQUNJLFVBQVU7UUFDVixvQkFBb0I7UUFDcEIsMENBQWtDO2dCQUFsQyxrQ0FBa0M7SUFDdEMiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvYXBwL09mZmxpbmVNZXNzYWdlLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIDpnbG9iYWwoI29mZmxpbmUtbWVzc2FnZSkge1xuICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgIHotaW5kZXg6IDExO1xuICAgICAgICBib3R0b206IGNhbGMoZW52KHNhZmUtYXJlYS1pbnNldC1ib3R0b20pICsgMTAwcHgpO1xuICAgICAgICBsZWZ0OiA1MCU7XG4gICAgICAgIHBhZGRpbmc6IDEwcHggMjBweDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvcikpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzLXNtYWxsKTtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgdHJhbnNpdGlvbjogLjJzIGVhc2Utb3V0O1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtNTAlLCAyMHB4LCAwKTtcbiAgICB9XG4gICAgOmdsb2JhbCgjb2ZmbGluZS1tZXNzYWdlLmFjdGl2ZSkge1xuICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgICBwb2ludGVyLWV2ZW50czogYXV0bztcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtNTAlLCAwLCAwKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAQY,gBAAgB,AAAE,CAAC,AACvB,QAAQ,CAAE,KAAK,CACf,OAAO,CAAE,EAAE,CACX,MAAM,CAAE,KAAK,IAAI,sBAAsB,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CACjD,IAAI,CAAE,GAAG,CACT,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,gBAAgB,CAAE,KAAK,IAAI,gBAAgB,CAAC,CAAC,CAC7C,aAAa,CAAE,IAAI,qBAAqB,CAAC,CACzC,QAAQ,CAAE,MAAM,CAChB,kBAAkB,CAAE,GAAG,CAAC,QAAQ,CAChC,UAAU,CAAE,GAAG,CAAC,QAAQ,CACxB,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,CACpB,iBAAiB,CAAE,YAAY,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,CACrC,SAAS,CAAE,YAAY,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,AACjD,CAAC,AACO,uBAAuB,AAAE,CAAC,AAC9B,OAAO,CAAE,CAAC,CACV,cAAc,CAAE,IAAI,CACpB,iBAAiB,CAAE,YAAY,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAClC,SAAS,CAAE,YAAY,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC9C,CAAC\"}"
};

const OfflineMessage = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$z);

	return `<section id="${"offline-message"}">
    Сторінка оффлайн
</section>`;
});

const contextMapbox = {};

/* src/components/map/Map.svelte generated by Svelte v3.18.1 */

const css$A = {
	code: "section.svelte-yig78c{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;-ms-flex-item-align:stretch;align-self:stretch}",
	map: "{\"version\":3,\"file\":\"Map.svelte\",\"sources\":[\"Map.svelte\"],\"sourcesContent\":[\"<style>\\n    section {\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL21hcC9NYXAuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG1CQUFZO1lBQVosb0JBQVk7Z0JBQVosWUFBWTtRQUNaLDRCQUFtQjtZQUFuQixtQkFBbUI7SUFDdkIiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvbWFwL01hcC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBzZWN0aW9uIHtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICAgIH1cbiJdfQ== */</style>\\n\\n<script>\\n    import { onMount, onDestroy, setContext, createEventDispatcher } from 'svelte'\\n    import { contextMapbox } from './context'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    export let center = [31.1656, 48.3794]\\n    export let zoom = 3.75\\n\\n    let map\\n    let container\\n\\n    setContext(contextMapbox, {\\n        getMap: () => map,\\n        getMapbox: () => window.mapboxgl\\n    })\\n\\n    function onCreateMap() {\\n        map = new mapboxgl.Map({\\n            zoom,\\n            center,\\n            container,\\n            style: 'mapbox://styles/mapbox/streets-v11',\\n        })\\n\\n        map.on('dragend', () => dispatch('recentre', { map, center: map.getCenter() }))\\n        map.on('load', () => dispatch('ready', map))\\n    }\\n\\n    function createMap() {\\n        const scriptTag = document.createElement('script')\\n        scriptTag.type = 'text/javascript'\\n        scriptTag.src = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.js'\\n\\n        const link = document.createElement('link')\\n        link.rel = 'stylesheet'\\n        link.href = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.css'\\n\\n        scriptTag.onload = () => {\\n            const token = 'pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw'\\n            mapboxgl.accessToken = token\\n\\n            link.onload = onCreateMap\\n\\n            document.head.appendChild(link)\\n        }\\n\\n        document.body.appendChild(scriptTag)\\n    }\\n\\n    onMount(() => {\\n        if ('mapboxgl' in window) {\\n            onCreateMap()\\n        } else {\\n            createMap()\\n        }\\n    })\\n\\n    onDestroy(() => {\\n        map && map.remove()\\n    })\\n</script>\\n\\n<section bind:this={container}>\\n    {#if map}\\n        <slot></slot>\\n    {/if}\\n</section>\\n\"],\"names\":[],\"mappings\":\"AACI,OAAO,cAAC,CAAC,AACL,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,AAC3B,CAAC\"}"
};

const Map$2 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
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
	$$result.css.add(css$A);

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
		: `<div style="${"width: 60%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>`}

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
		: `<div style="${"width: 80%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h4" }, {}, {})}</div>`}
                </p>
                <span class="${"h5 flex flex-align-center font-secondary"}" style="${"min-width: 4em"}">
                    <span${add_attribute("style", `opacity: ${amount > 2 ? 1 : 0.5}`, 0)}>
                        ${validate_component(Icon, "Icon").$$render(
			$$result,
			{
				type: "heart",
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
                            ${validate_component(Loader, "Loader").$$render($$result, { type: "h4", absolute: true }, {}, {})}
                        </span>`}
                </span>
            </div>
        </div>

    </section>
`
	})}`;
});

/* src/components/comments/Comments.svelte generated by Svelte v3.18.1 */

const css$B = {
	code: ".comments.svelte-88w9s0.svelte-88w9s0{width:100%;-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;display:-webkit-box;display:-ms-flexbox;display:flex;overflow-y:auto;overflow-x:hidden;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;padding:15px}.comments-form.svelte-88w9s0.svelte-88w9s0{position:relative;-webkit-box-flex:0;-ms-flex:none;flex:none}.comments-wrap.svelte-88w9s0.svelte-88w9s0{width:100%;margin:-5px 0}.comments-wrap.svelte-88w9s0 li.svelte-88w9s0{width:100%;padding:5px 0}",
	map: "{\"version\":3,\"file\":\"Comments.svelte\",\"sources\":[\"Comments.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n\\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import Form from '@components/Form.svelte'\\n    import Input from '@components/fields/Input.svelte'\\n    import Button from '@components/Button.svelte'\\n    import Loader from '@components/loader'\\n    import Comment from './Comment.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n\\n    /**\\n     * \\n     * @event: submit - submit values of a new comment \\n     * \\n     */\\n    \\n    /**\\n     * @type {boolean}\\n     */\\n    export let withForm = true\\n\\n    /**\\n     * @type {{\\n     *      likes: number,\\n     *      avatar: string,\\n     *      author: string,\\n     *      comment: string,\\n     *      checked: boolean,\\n     *      created_at: string,\\n     * }}\\n     */\\n    export let items = new Array(4).fill({ comment: null })\\n</script>\\n\\n<section class=\\\"comments\\\">\\n    <ul class=\\\"comments-wrap\\\">\\n        {#each items as comment}\\n            <li>\\n                <Comment\\n                        src={comment.avatar}\\n                        title={comment.author}\\n                        date={comment.created_at && new Date(comment.created_at).toLocaleDateString()}\\n                        amount={comment.likes}\\n                        checked={comment.checked}\\n                >\\n                    {#if comment.comment !== null}\\n                        {comment.comment}\\n                    {:else}\\n                        <Loader type=\\\"h4\\\"/>\\n                        <Loader type=\\\"h4\\\"/>\\n                    {/if}\\n                </Comment>\\n            </li>\\n        {/each}\\n    </ul>\\n\\n    <Br size=\\\"20\\\"/>  \\n\\n    <p class=\\\"h3 font-w-500 font-secondary underline text-center\\\">\\n        <span>Всі коментарі</span>\\n        <Icon type=\\\"caret-down\\\" size=\\\"small\\\"/>\\n    </p>\\n\\n    {#if withForm}\\n        <Br size=\\\"40\\\"/>  \\n        <div class=\\\"comments-form font-secondary h3\\\">\\n            <Form class=\\\"flex\\\" name=\\\"comment-form\\\" on:submit={values => dispatch('sumbit', values)}>\\n                <Input\\n                        type=\\\"textarea\\\"\\n                        name=\\\"comment\\\"\\n                        rows=\\\"1\\\"\\n                        class=\\\"comment-field flex-self-stretch\\\"\\n                        placeholder=\\\"Залиште свій коментар\\\"\\n                />\\n            </Form>\\n            <div class=\\\"flex absolute\\\" style=\\\"top: 0; right: 0; height: 100%; width: 50px\\\">\\n                <Button type=\\\"submit\\\" class=\\\"flex full-width flex-self-stretch flex-justify-start\\\">\\n                    <Icon type=\\\"send\\\" is=\\\"info\\\" size=\\\"medium\\\"/>\\n                </Button>\\n            </div>\\n        </div>\\n    {/if}\\n</section>\\n\\n<style>\\n    .comments {\\n        width: 100%;\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow-y: auto;\\n        overflow-x: hidden;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n        padding: 15px;\\n    }\\n\\n    .comments-form {\\n        position: relative;\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n    }\\n\\n    .comments-wrap {\\n        width: 100%;\\n        margin: -5px 0;\\n    }\\n\\n    .comments-wrap li {\\n        width: 100%;\\n        padding: 5px 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2NvbW1lbnRzL0NvbW1lbnRzLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxXQUFXO1FBQ1gsbUJBQVk7WUFBWixvQkFBWTtnQkFBWixZQUFZO1FBQ1osb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBQ2xCLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsNEJBQXNCO1FBQXRCLDZCQUFzQjtZQUF0QiwwQkFBc0I7Z0JBQXRCLHNCQUFzQjtRQUN0QixhQUFhO0lBQ2pCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO0lBQ2Q7O0lBRUE7UUFDSSxXQUFXO1FBQ1gsY0FBYztJQUNsQjs7SUFFQTtRQUNJLFdBQVc7UUFDWCxjQUFjO0lBQ2xCIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL2NvbW1lbnRzL0NvbW1lbnRzLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5jb21tZW50cyB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgICAgICAgYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgcGFkZGluZzogMTVweDtcbiAgICB9XG5cbiAgICAuY29tbWVudHMtZm9ybSB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgZmxleDogbm9uZTtcbiAgICB9XG5cbiAgICAuY29tbWVudHMtd3JhcCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBtYXJnaW46IC01cHggMDtcbiAgICB9XG5cbiAgICAuY29tbWVudHMtd3JhcCBsaSB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBwYWRkaW5nOiA1cHggMDtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAwFI,SAAS,4BAAC,CAAC,AACP,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,MAAM,CAClB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,CAC9B,OAAO,CAAE,IAAI,AACjB,CAAC,AAED,cAAc,4BAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,AACtB,CAAC,AAED,cAAc,4BAAC,CAAC,AACZ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CAAC,CAAC,AAClB,CAAC,AAED,4BAAc,CAAC,EAAE,cAAC,CAAC,AACf,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,CAAC,AAClB,CAAC\"}"
};

const Comments = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const dispatch = createEventDispatcher();
	let { withForm = true } = $$props;
	let { items = new Array(4).fill({ comment: null }) } = $$props;
	if ($$props.withForm === void 0 && $$bindings.withForm && withForm !== void 0) $$bindings.withForm(withForm);
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$B);

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
			: `${validate_component(Loader, "Loader").$$render($$result, { type: "h4" }, {}, {})}
                        ${validate_component(Loader, "Loader").$$render($$result, { type: "h4" }, {}, {})}`}
                `
		}
	)}
            </li>`)}
    </ul>

    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}  

    <p class="${"h3 font-w-500 font-secondary underline text-center"}">
        <span>Всі коментарі</span>
        ${validate_component(Icon, "Icon").$$render($$result, { type: "caret-down", size: "small" }, {}, {})}
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

const css$C = {
	code: "li.svelte-13srupt{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;padding:20px;width:100%}li.svelte-13srupt:not(:last-child){background-image:-webkit-gradient(linear, left top, right top, color-stop(50%, rgba(var(--theme-color-primary-opposite), 0.1)), color-stop(0%, rgba(var(--theme-color-primary-opposite), 0)));background-image:linear-gradient(to right, rgba(var(--theme-color-primary-opposite), 0.1) 50%, rgba(var(--theme-color-primary-opposite), 0) 0%);background-position:bottom;background-size:20px 1px;background-repeat:repeat-x}",
	map: "{\"version\":3,\"file\":\"DonatorsCard.svelte\",\"sources\":[\"DonatorsCard.svelte\"],\"sourcesContent\":[\"<script>\\n    import Icon from '@components/Icon.svelte'\\n    import Card from '@components/Card.svelte'\\n    import Avatar from '@components/Avatar.svelte'\\n    import Loader from '@components/loader'\\n\\n    /**\\n     * @type {{\\n     *  id: string,\\n     *  src: string,\\n     *  title: string,\\n     *  subtitle: string,\\n     *  checked: boolean,\\n     * }}\\n     */\\n    export let items\\n</script>\\n\\n{#if Array.isArray(items) && items.length}\\n    <Card>\\n        <ul class=\\\"full-width\\\">\\n            {#each items as item}\\n                <li key={item.id}>\\n                    <div class=\\\"relative\\\">\\n                        <Avatar src={item.src} size=\\\"medium\\\" alt={item.subtitle}/>\\n                        {#if item.checked}\\n                            <div class=\\\"absolute flex\\\" style=\\\"top: -1px; right: -1px; width: 20px; height: 20px; overflow: hidden\\\">\\n                                <Icon type=\\\"polygon\\\" is=\\\"info\\\"/>\\n                                <div class=\\\"absolute-center flex\\\" style=\\\"width: 10px; height: 10px;\\\">\\n                                    <Icon type=\\\"check-flag\\\" is=\\\"light\\\"/>\\n                                </div>\\n                            </div>\\n                        {/if}\\n                    </div>\\n                    <s></s>\\n                    <s></s>\\n                    <s></s>\\n                    <s></s>\\n                    <div style=\\\"overflow: hidden;\\\" class=\\\"flex flex-column flex-justify-center\\\">\\n                        {#if item.title !== null}\\n                            <h2 class=\\\"text-ellipsis\\\">{ item.title }</h2>\\n                        {:else}\\n                            <span class=\\\"h2 relative flex-self-start\\\">\\n                                <span style=\\\"visibility: hidden\\\">₴ 1000</span>\\n                                <Loader type=\\\"h2\\\" absolute/>\\n                            </span>  \\n                        {/if}\\n\\n                        {#if item.subtitle !== null}\\n                            <span class=\\\"h4 font-w-300 text-ellipsis\\\">{ item.subtitle }</span>\\n                        {:else}\\n                            <Loader type=\\\"h4\\\"/>\\n                        {/if}\\n                    </div>\\n                </li>\\n            {/each}\\n        </ul>\\n    </Card>\\n{/if}\\n\\n<style>\\n    li {\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -webkit-box-align: center;\\n            -ms-flex-align: center;\\n                align-items: center;\\n        padding: 20px;\\n        width: 100%;\\n    }\\n\\n    li:not(:last-child) {\\n        background-image: -webkit-gradient(linear, left top, right top, color-stop(50%, rgba(var(--theme-color-primary-opposite), 0.1)), color-stop(0%, rgba(var(--theme-color-primary-opposite), 0)));\\n        background-image: linear-gradient(to right, rgba(var(--theme-color-primary-opposite), 0.1) 50%, rgba(var(--theme-color-primary-opposite), 0) 0%);\\n        background-position: bottom;\\n        background-size: 20px 1px;\\n        background-repeat: repeat-x;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2RvbmF0b3JzL0RvbmF0b3JzQ2FyZC5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYix5QkFBbUI7WUFBbkIsc0JBQW1CO2dCQUFuQixtQkFBbUI7UUFDbkIsYUFBYTtRQUNiLFdBQVc7SUFDZjs7SUFFQTtRQUNJLDhMQUFnSjtRQUFoSixnSkFBZ0o7UUFDaEosMkJBQTJCO1FBQzNCLHlCQUF5QjtRQUN6QiwyQkFBMkI7SUFDL0IiLCJmaWxlIjoic3JjL2NvbXBvbmVudHMvZG9uYXRvcnMvRG9uYXRvcnNDYXJkLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIGxpIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuXG4gICAgbGk6bm90KDpsYXN0LWNoaWxkKSB7XG4gICAgICAgIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCh0byByaWdodCwgcmdiYSh2YXIoLS10aGVtZS1jb2xvci1wcmltYXJ5LW9wcG9zaXRlKSwgMC4xKSA1MCUsIHJnYmEodmFyKC0tdGhlbWUtY29sb3ItcHJpbWFyeS1vcHBvc2l0ZSksIDApIDAlKTtcbiAgICAgICAgYmFja2dyb3VuZC1wb3NpdGlvbjogYm90dG9tO1xuICAgICAgICBiYWNrZ3JvdW5kLXNpemU6IDIwcHggMXB4O1xuICAgICAgICBiYWNrZ3JvdW5kLXJlcGVhdDogcmVwZWF0LXg7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AA6DI,EAAE,eAAC,CAAC,AACA,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,iBAAiB,CAAE,MAAM,CACrB,cAAc,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CAC3B,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,AACf,CAAC,AAED,iBAAE,KAAK,WAAW,CAAC,AAAC,CAAC,AACjB,gBAAgB,CAAE,iBAAiB,MAAM,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,KAAK,CAAC,GAAG,CAAC,CAAC,WAAW,GAAG,CAAC,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,WAAW,EAAE,CAAC,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9L,gBAAgB,CAAE,gBAAgB,EAAE,CAAC,KAAK,CAAC,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAChJ,mBAAmB,CAAE,MAAM,CAC3B,eAAe,CAAE,IAAI,CAAC,GAAG,CACzB,iBAAiB,CAAE,QAAQ,AAC/B,CAAC\"}"
};

const DonatorsCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$C);

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
                                ${validate_component(Loader, "Loader").$$render($$result, { type: "h2", absolute: true }, {}, {})}
                            </span>`}

                        ${item.subtitle !== null
			? `<span class="${"h4 font-w-300 text-ellipsis"}">${escape(item.subtitle)}</span>`
			: `${validate_component(Loader, "Loader").$$render($$result, { type: "h4" }, {}, {})}`}
                    </div>
                </li>`)}
        </ul>
    `
		})}`
	: ``}`;
});

/* src/components/donators/DonatorsList.svelte generated by Svelte v3.18.1 */

const css$D = {
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
	$$result.css.add(css$D);

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
		: `<div style="${"width: 80%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>
                <div style="${"width: 80%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>`}

            ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}

            ${subtitle !== null
		? `<p class="${"font-w-300 text-ellipsis-multiline"}" style="${"--max-lines: 3"}">${escape(subtitle)}</p>`
		: `<div style="${"width: 100%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</div>
                <div style="${"width: 100%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</div>`}

            <div class="${"flex flex-align-center flex-justify-between"}">
                <p>
                    ${date !== null
		? `<span class="${"h4"}" style="${"opacity: .3"}">${escape(date)}</span>`
		: `<div style="${"width: 60%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h4" }, {}, {})}</div>`}
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
					type: "heart",
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
                                ${validate_component(Loader, "Loader").$$render($$result, { type: "h4", absolute: true }, {}, {})}
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

const css$E = {
	code: ".news-list.svelte-6apgo.svelte-6apgo{width:100%;-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;display:-webkit-box;display:-ms-flexbox;display:flex;overflow-y:auto;overflow-x:hidden;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.news-list-wrap.svelte-6apgo.svelte-6apgo{width:100%;margin:-5px 0}.news-list-wrap.svelte-6apgo li.svelte-6apgo{position:relative;width:100%;padding:5px 0}.arrow.svelte-6apgo.svelte-6apgo{position:absolute;top:8px;right:15px;color:rgba(var(--color-info))}",
	map: "{\"version\":3,\"file\":\"NewsList.svelte\",\"sources\":[\"NewsList.svelte\"],\"sourcesContent\":[\"<script>\\n    import { createEventDispatcher } from 'svelte'\\n    import { onMount } from 'svelte'\\n    import { API, Dates } from '@services'\\n    \\n    import Br from '@components/Br.svelte'\\n    import Icon from '@components/Icon.svelte'\\n    import Button from '@components/Button.svelte'\\n    import NewsItem from './NewsItem.svelte'\\n\\n    const dispatch = createEventDispatcher()\\n   \\n   /**\\n    * @type {{\\n    *   id: string,\\n    *   src: string,\\n    *   likes: number,\\n    *   title: string,\\n    *   subtitle: string,\\n    *   created_at: string,\\n    * }}\\n    */\\n    export let items = new Array(3).fill({ title: null, subtitle: null, created_at: null, likes: null })\\n</script>\\n\\n<section class=\\\"news-list\\\">\\n    <ul class=\\\"news-list-wrap\\\">\\n        {#each items as item, index}\\n            <li role=\\\"button\\\" on:click={() => dispatch('click', { item, index })} key={item.id}>\\n                <NewsItem\\n                        src={item.src}\\n                        title={item.title}\\n                        likes={item.likes}\\n                        isLiked={item.isLiked}\\n                        subtitle={item.subtitle}\\n                        date={item.created_at === null ? null : Dates(item.created_at).fromNow()}\\n                />\\n\\n                <span class=\\\"arrow\\\">\\n                    <Icon type=\\\"arrow-right\\\" size=\\\"small\\\" is=\\\"info\\\"/>\\n                </span>\\n            </li>\\n        {/each}\\n    </ul>\\n\\n    <Br size=\\\"20\\\"/>  \\n\\n    <p class=\\\"h3 font-w-500 font-secondary underline text-center\\\">\\n        <span>Всі новини</span>\\n        <Icon type=\\\"caret-down\\\" size=\\\"small\\\"/>\\n    </p>\\n</section>\\n\\n<style>\\n    .news-list {\\n        width: 100%;\\n        -webkit-box-flex: 1;\\n            -ms-flex-positive: 1;\\n                flex-grow: 1;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow-y: auto;\\n        overflow-x: hidden;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        -webkit-box-orient: vertical;\\n        -webkit-box-direction: normal;\\n            -ms-flex-direction: column;\\n                flex-direction: column;\\n    }\\n\\n    .news-list-wrap {\\n        width: 100%;\\n        margin: -5px 0;\\n    }\\n\\n    .news-list-wrap li {\\n        position: relative;\\n        width: 100%;\\n        padding: 5px 0;\\n    }\\n\\n    .arrow {\\n        position: absolute;\\n        top: 8px;\\n        right: 15px;\\n        color: rgba(var(--color-info));\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL25ld3NMaXN0L05ld3NMaXN0LnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSxXQUFXO1FBQ1gsbUJBQVk7WUFBWixvQkFBWTtnQkFBWixZQUFZO1FBQ1osb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBQ2xCLDRCQUFtQjtZQUFuQixtQkFBbUI7UUFDbkIsNEJBQXNCO1FBQXRCLDZCQUFzQjtZQUF0QiwwQkFBc0I7Z0JBQXRCLHNCQUFzQjtJQUMxQjs7SUFFQTtRQUNJLFdBQVc7UUFDWCxjQUFjO0lBQ2xCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLFdBQVc7UUFDWCxjQUFjO0lBQ2xCOztJQUVBO1FBQ0ksa0JBQWtCO1FBQ2xCLFFBQVE7UUFDUixXQUFXO1FBQ1gsOEJBQThCO0lBQ2xDIiwiZmlsZSI6InNyYy9jb21wb25lbnRzL25ld3NMaXN0L05ld3NMaXN0LnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIC5uZXdzLWxpc3Qge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgfVxuXG4gICAgLm5ld3MtbGlzdC13cmFwIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIG1hcmdpbjogLTVweCAwO1xuICAgIH1cblxuICAgIC5uZXdzLWxpc3Qtd3JhcCBsaSB7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIHBhZGRpbmc6IDVweCAwO1xuICAgIH1cblxuICAgIC5hcnJvdyB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiA4cHg7XG4gICAgICAgIHJpZ2h0OiAxNXB4O1xuICAgICAgICBjb2xvcjogcmdiYSh2YXIoLS1jb2xvci1pbmZvKSk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAsDI,UAAU,0BAAC,CAAC,AACR,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,CAAC,CACf,iBAAiB,CAAE,CAAC,CAChB,SAAS,CAAE,CAAC,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,MAAM,CAClB,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,kBAAkB,CAAE,QAAQ,CAC5B,qBAAqB,CAAE,MAAM,CACzB,kBAAkB,CAAE,MAAM,CACtB,cAAc,CAAE,MAAM,AAClC,CAAC,AAED,eAAe,0BAAC,CAAC,AACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CAAC,CAAC,AAClB,CAAC,AAED,4BAAe,CAAC,EAAE,aAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,CAAC,AAClB,CAAC,AAED,MAAM,0BAAC,CAAC,AACJ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,KAAK,CAAE,IAAI,CACX,KAAK,CAAE,KAAK,IAAI,YAAY,CAAC,CAAC,AAClC,CAAC\"}"
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
	$$result.css.add(css$E);

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

                <span class="${"arrow svelte-6apgo"}">
                    ${validate_component(Icon, "Icon").$$render(
		$$result,
		{
			type: "arrow-right",
			size: "small",
			is: "info"
		},
		{},
		{}
	)}
                </span>
            </li>`)}
    </ul>

    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}  

    <p class="${"h3 font-w-500 font-secondary underline text-center"}">
        <span>Всі новини</span>
        ${validate_component(Icon, "Icon").$$render($$result, { type: "caret-down", size: "small" }, {}, {})}
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
		: `${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}
                ${validate_component(Loader, "Loader").$$render($$result, { type: "h2" }, {}, {})}`}

            ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}     

            ${city !== null
		? `<p class="${"flex flex-align-center font-secondary font-w-500"}" style="${"opacity: .7; margin-left: -2px"}">
                    ${validate_component(Icon, "Icon").$$render($$result, { type: "location", size: "small" }, {}, {})}
                    <s></s>
                    <span>${escape(city)}</span>
                </p>
                ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}`
		: `<div style="${"width: 40%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "p" }, {}, {})}</div>`}
        </div>

        <div>
            <p class="${"font-secondary flex flex-wrap flex-align-end"}" style="${"letter-spacing: -0.5px"}">
                ${current !== null && total !== null
		? `<span class="${"h1 font-w-500"}">${escape(currency)} ${escape(current)}</span>
                    <s></s>
                    <span class="${"h4"}">/ ${escape(currency)} ${escape(total)}</span>`
		: `<div style="${"width: 80%; flex: none"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h1" }, {}, {})}</div>`}
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

const css$F = {
	code: ".charities.active .scroll-x-center > *{-webkit-transform:none;transform:none\n    }div.svelte-14qvbw3{-webkit-box-flex:0;-ms-flex:none;flex:none;display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;height:470px;width:77vw;max-width:350px;padding:15px 5px;-webkit-box-sizing:content-box;box-sizing:content-box}div.start.svelte-14qvbw3{padding-left:var(--screen-padding)}div.end.svelte-14qvbw3{padding-right:var(--screen-padding)}",
	map: "{\"version\":3,\"file\":\"FundCards.svelte\",\"sources\":[\"FundCards.svelte\"],\"sourcesContent\":[\"<script>\\n    import Carousel from '@components/Carousel.svelte'\\n    import Button from '@components/Button.svelte'\\n    import FundCard from './FundCard.svelte'\\n\\n    /**\\n     * @type {{\\n     *  id: string,\\n     *  src: string,\\n     *  total: number,\\n     *  current: number,\\n     *  currency: string,\\n     *  city: string,\\n     *  title: string,\\n     * }}\\n     */\\n    export let items = [{}, {}, {}]\\n</script>\\n\\n<Carousel {items} size=\\\"auto\\\" let:index={index} let:item={item} class=\\\"charities\\\">\\n    <div class={!index ? 'start' : index === items.length - 1 ? 'end' : ''} key={item.id}>\\n        <FundCard\\n            src={item.src}\\n            total={item.total}\\n            current={item.current}\\n            currency={item.currency}\\n            city={item.city}\\n            title={item.title}\\n        >\\n            <span slot=\\\"button\\\" let:id={id}>\\n                <slot name=\\\"button\\\">\\n                    <Button size=\\\"big\\\" is=\\\"success\\\" href={id}>\\n                        <span class=\\\"h2 font-secondary font-w-600\\\">\\n                            Допомогти\\n                        </span>\\n                    </Button>\\n                </slot>\\n            </span>\\n        </FundCard>\\n    </div>\\n</Carousel>\\n\\n<style>\\n    :global(.charities.active .scroll-x-center > *) {\\n        -webkit-transform: none;\\n                transform: none\\n    }\\n    div {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        -ms-flex-item-align: stretch;\\n            align-self: stretch;\\n        height: 470px;\\n        width: 77vw;\\n        max-width: 350px;\\n        padding: 15px 5px;\\n        -webkit-box-sizing: content-box;\\n                box-sizing: content-box;\\n    }\\n\\n    div.start {\\n        padding-left: var(--screen-padding);\\n    }\\n\\n    div.end {\\n        padding-right: var(--screen-padding);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2Z1bmRDYXJkcy9GdW5kQ2FyZHMuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLHVCQUFjO2dCQUFkO0lBQ0o7SUFDQTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1Ysb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYiw0QkFBbUI7WUFBbkIsbUJBQW1CO1FBQ25CLGFBQWE7UUFDYixXQUFXO1FBQ1gsZ0JBQWdCO1FBQ2hCLGlCQUFpQjtRQUNqQiwrQkFBdUI7Z0JBQXZCLHVCQUF1QjtJQUMzQjs7SUFFQTtRQUNJLG1DQUFtQztJQUN2Qzs7SUFFQTtRQUNJLG9DQUFvQztJQUN4QyIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9mdW5kQ2FyZHMvRnVuZENhcmRzLnN2ZWx0ZSIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgIDpnbG9iYWwoLmNoYXJpdGllcy5hY3RpdmUgLnNjcm9sbC14LWNlbnRlciA+ICopIHtcbiAgICAgICAgdHJhbnNmb3JtOiBub25lXG4gICAgfVxuICAgIGRpdiB7XG4gICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgICAgIGhlaWdodDogNDcwcHg7XG4gICAgICAgIHdpZHRoOiA3N3Z3O1xuICAgICAgICBtYXgtd2lkdGg6IDM1MHB4O1xuICAgICAgICBwYWRkaW5nOiAxNXB4IDVweDtcbiAgICAgICAgYm94LXNpemluZzogY29udGVudC1ib3g7XG4gICAgfVxuXG4gICAgZGl2LnN0YXJ0IHtcbiAgICAgICAgcGFkZGluZy1sZWZ0OiB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG4gICAgfVxuXG4gICAgZGl2LmVuZCB7XG4gICAgICAgIHBhZGRpbmctcmlnaHQ6IHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AA2CY,sCAAsC,AAAE,CAAC,AAC7C,iBAAiB,CAAE,IAAI,CACf,SAAS,CAAE,IAAI;IAC3B,CAAC,AACD,GAAG,eAAC,CAAC,AACD,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,mBAAmB,CAAE,OAAO,CACxB,UAAU,CAAE,OAAO,CACvB,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,KAAK,CAChB,OAAO,CAAE,IAAI,CAAC,GAAG,CACjB,kBAAkB,CAAE,WAAW,CACvB,UAAU,CAAE,WAAW,AACnC,CAAC,AAED,GAAG,MAAM,eAAC,CAAC,AACP,YAAY,CAAE,IAAI,gBAAgB,CAAC,AACvC,CAAC,AAED,GAAG,IAAI,eAAC,CAAC,AACL,aAAa,CAAE,IAAI,gBAAgB,CAAC,AACxC,CAAC\"}"
};

const FundCards = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [{}, {}, {}] } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	$$result.css.add(css$F);

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

/* src/routes/organizations/components/_Trust.svelte generated by Svelte v3.18.1 */

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

/* src/routes/organizations/components/_Share.svelte generated by Svelte v3.18.1 */

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
    <h3 class="${"font-w-500"}">Поділитись</h3>
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
    <h3 class="${"font-w-500"}">Скопіювати</h3>
  `
		}
	)}
</p>`;
});

/* src/routes/organizations/components/_Videos.svelte generated by Svelte v3.18.1 */

const Videos = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Відео про нас</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<section class="${"flex"}" style="${"height: 240px"}">
    ${validate_component(Carousel, "Carousel").$$render($$result, { items }, {}, {})}
</section>`;
});

/* src/routes/organizations/components/_WeOnMap.svelte generated by Svelte v3.18.1 */

const css$G = {
	code: "div.svelte-1y40nlf{background-color:rgba(var(--theme-bg-color-opposite), .04)}",
	map: "{\"version\":3,\"file\":\"_WeOnMap.svelte\",\"sources\":[\"_WeOnMap.svelte\"],\"sourcesContent\":[\"<script>\\n  import { Br } from \\\"@components\\\";\\n  \\n  export let src\\n</script>\\n\\n<h1>Ми на карті</h1>\\n<Br size=\\\"20\\\" />\\n<div class=\\\"full-container\\\">\\n  <iframe\\n    {src}\\n    title=\\\"Карта\\\"\\n    width=\\\"100%\\\"\\n    height=\\\"450\\\"\\n    frameborder=\\\"0\\\"\\n    style=\\\"border:0;\\\"\\n    allowfullscreen=\\\"\\\"\\n    aria-hidden=\\\"false\\\"\\n    tabindex=\\\"0\\\" ></iframe>\\n</div>\\n\\n<style>\\n    div {\\n        background-color: rgba(var(--theme-bg-color-opposite), .04);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvb3JnYW5pemF0aW9ucy9jb21wb25lbnRzL19XZU9uTWFwLnN2ZWx0ZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQ0k7UUFDSSwyREFBMkQ7SUFDL0QiLCJmaWxlIjoic3JjL3JvdXRlcy9vcmdhbml6YXRpb25zL2NvbXBvbmVudHMvX1dlT25NYXAuc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgZGl2IHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS10aGVtZS1iZy1jb2xvci1vcHBvc2l0ZSksIC4wNCk7XG4gICAgfVxuIl19 */</style>\\n\"],\"names\":[],\"mappings\":\"AAsBI,GAAG,eAAC,CAAC,AACD,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC/D,CAAC\"}"
};

const WeOnMap = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	$$result.css.add(css$G);

	return `<h1>Ми на карті</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<div class="${"full-container svelte-1y40nlf"}">
  <iframe${add_attribute("src", src, 0)} title="${"Карта"}" width="${"100%"}" height="${"450"}" frameborder="${"0"}" style="${"border:0;"}" allowfullscreen="${""}" aria-hidden="${"false"}" tabindex="${"0"}"></iframe>
</div>`;
});

/* src/routes/organizations/components/_Comments.svelte generated by Svelte v3.18.1 */

const Comments_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Коментарі</h1>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<div class="${"full-container"}">
  ${validate_component(Comments, "Comments").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/organizations/components/_Donators.svelte generated by Svelte v3.18.1 */

const Donators = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Наші піклувальники</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(DonatorsList, "DonatorsList").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/organizations/components/_FundList.svelte generated by Svelte v3.18.1 */

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

/* src/routes/organizations/components/_TopCarousel.svelte generated by Svelte v3.18.1 */

const TopCarousel = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<section class="${"flex"}" style="${"height: 240px"}">
    ${validate_component(Carousel, "Carousel").$$render($$result, { items, dotsBelow: false }, {}, {})}
</section>`;
});

/* src/routes/organizations/components/_DescriptionShort.svelte generated by Svelte v3.18.1 */

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

/* src/routes/organizations/components/_InteractionIndicators.svelte generated by Svelte v3.18.1 */

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
					type: "heart",
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

/* src/routes/organizations/components/_LastNews.svelte generated by Svelte v3.18.1 */

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

        ${descriptionShort.name !== null
			? `<h1>${escape(descriptionShort.name)}</h1>`
			: `${validate_component(Loader, "Loader").$$render($$result, { type: "h1" }, {}, {})}`}
        ${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
        ${descriptionShort.name !== null
			? `<p>${escape(descriptionShort.name)}</p>`
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
					title: descriptionShort.name
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

/* src/routes/organizations/components/_Description.svelte generated by Svelte v3.18.1 */

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

/* src/routes/organizations/components/_VirtualTour.svelte generated by Svelte v3.18.1 */

const css$H = {
	code: "div.svelte-135aou9{background-color:rgba(var(--theme-bg-color-opposite), .04)}",
	map: "{\"version\":3,\"file\":\"_VirtualTour.svelte\",\"sources\":[\"_VirtualTour.svelte\"],\"sourcesContent\":[\"<script>\\n  import { Br } from \\\"@components\\\";\\n\\n  export let src\\n</script>\\n\\n<h1>3D - Тур 360°</h1>\\n<Br size=\\\"20\\\" />\\n<div class=\\\"full-container\\\">\\n  <iframe\\n    {src}\\n    title=\\\"360 тур\\\"\\n    width=\\\"100%\\\"\\n    height=\\\"450\\\"\\n    frameborder=\\\"0\\\"\\n    style=\\\"border:0;\\\"\\n    allowfullscreen=\\\"\\\"\\n    aria-hidden=\\\"false\\\"\\n    tabindex=\\\"0\\\" ></iframe>\\n</div>\\n\\n<style>\\n    div {\\n        background-color: rgba(var(--theme-bg-color-opposite), .04);\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvb3JnYW5pemF0aW9ucy9jb21wb25lbnRzL19WaXJ0dWFsVG91ci5zdmVsdGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtJQUNJO1FBQ0ksMkRBQTJEO0lBQy9EIiwiZmlsZSI6InNyYy9yb3V0ZXMvb3JnYW5pemF0aW9ucy9jb21wb25lbnRzL19WaXJ0dWFsVG91ci5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICBkaXYge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLXRoZW1lLWJnLWNvbG9yLW9wcG9zaXRlKSwgLjA0KTtcbiAgICB9XG4iXX0= */</style>\\n\"],\"names\":[],\"mappings\":\"AAsBI,GAAG,eAAC,CAAC,AACD,gBAAgB,CAAE,KAAK,IAAI,yBAAyB,CAAC,CAAC,CAAC,GAAG,CAAC,AAC/D,CAAC\"}"
};

const VirtualTour = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { src } = $$props;
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);
	$$result.css.add(css$H);

	return `<h1>3D - Тур 360°</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<div class="${"full-container svelte-135aou9"}">
  <iframe${add_attribute("src", src, 0)} title="${"360 тур"}" width="${"100%"}" height="${"450"}" frameborder="${"0"}" style="${"border:0;"}" allowfullscreen="${""}" aria-hidden="${"false"}" tabindex="${"0"}"></iframe>
</div>`;
});

/* src/routes/organizations/components/_Certificates.svelte generated by Svelte v3.18.1 */

const Certificates = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Сертифікати</h1>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(Documents, "Documents").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/organizations/components/_ContactsCard.svelte generated by Svelte v3.18.1 */

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

/* src/routes/organizations/components/_OrganizationButton.svelte generated by Svelte v3.18.1 */

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



var route_0 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Trust: Trust,
    Share: Share,
    Videos: Videos,
    WeOnMap: WeOnMap,
    Comments: Comments_1,
    Donators: Donators,
    FundList: FundList,
    LastNews: LastNews,
    TopCarousel: TopCarousel,
    Description: Description,
    VirtualTour: VirtualTour,
    Certificates: Certificates,
    ContactsCard: ContactsCard,
    DescriptionShort: DescriptionShort,
    OrganizationButton: OrganizationButton,
    InteractionIndicators: InteractionIndicators
});

/* src/routes/organizations/edit/_Map.svelte generated by Svelte v3.18.1 */

const Map$3 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			label: "Адрес:",
			type: "url",
			name: "location.map",
			meta: {
				placeholder: "https://www.google.com.ua/maps/place/..."
			}
		},
		{
			label: "3D - Тур:",
			type: "url",
			name: "location.virtual_tour",
			meta: {
				placeholder: "https://www.google.com.ua/maps/@48.8994332,24.7567114..."
			}
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "map-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "map-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/organizations/edit/_About.svelte generated by Svelte v3.18.1 */

const About = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			label: "Про нас:",
			type: "textarea",
			name: "description",
			meta: {
				rows: 6,
				placeholder: "Ми піклуємось про...",
				maxlength: 250
			}
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "about-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "about-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/organizations/edit/_Videos.svelte generated by Svelte v3.18.1 */

const Videos$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	const dispatch = createEventDispatcher();

	const defaultField = {
		label: "Відео 1:",
		type: "url",
		name: "videos[0].src",
		meta: {
			placeholder: "https://www.youtube.com/watch?v=oUcAUwptos4&t"
		}
	};

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let currentValues = data || {};
	let formValues = data || {};
	let formErrors = {};
	let fieldsAmount = safeGet(() => currentValues.videos.filter(v => v.src).length, 0, true);

	let formFields = Array.from(new Array(Math.max(2, fieldsAmount + 1))).map((f, i) => ({
		...defaultField,
		label: `Відео ${i + 1}:`,
		name: `videos[${i}].src`
	}));

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "videos-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "videos-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/organizations/edit/_Contacts.svelte generated by Svelte v3.18.1 */

const Contacts = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			type: "avatar",
			name: "avatar",
			meta: { accept: "image/jpeg,image/png" }
		},
		{
			label: "Телефон:",
			type: "tel",
			name: "phone",
			meta: { placeholder: "+380974354532" }
		},
		{
			label: "Email:",
			type: "email",
			name: "email",
			meta: { placeholder: "mylovedmail@gmail.com" }
		},
		{
			label: "Адреса:",
			type: "search",
			name: "address",
			meta: {
				placeholder: "Почніть вводити...",
				maxlength: 50
			}
		},
		{
			label: "Соцмережі:",
			type: "custom-socials",
			name: "socials"
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "about-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "contacts-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{
				default: ({ item, value, onChange }) => `
        ${item.type === "custom-socials" ? `Socials` : ``}
    `
			}
		)}
`
	})}`;
});

/* src/routes/organizations/edit/_Documents.svelte generated by Svelte v3.18.1 */

const Documents$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			label: "Сертифікати:",
			type: "files",
			name: "documents",
			meta: {
				multiple: true,
				accept: "image/jpeg,image/png,application/pdf"
			}
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "documents-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "documents-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/organizations/edit/_Description.svelte generated by Svelte v3.18.1 */

const Description$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			label: "Фотогалерея:",
			type: "files",
			name: "avatars",
			meta: { multiple: true }
		},
		{
			label: "Назва організації:",
			type: "text",
			name: "name",
			meta: { placeholder: "Назва...", maxlength: 20 }
		},
		{
			label: "Мета організації:",
			type: "textarea",
			name: "subtitle",
			meta: {
				rows: 6,
				placeholder: "Ми піклуємось про...",
				maxlength: 250
			}
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "description-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "description-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/organizations/edit/_OrganizationButton.svelte generated by Svelte v3.18.1 */

const OrganizationButton$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	const dispatch = createEventDispatcher();

	let formFields = [
		{
			type: "avatar",
			name: "avatar",
			meta: { accept: "image/jpeg,image/png" }
		},
		{
			label: "Назва організації:",
			type: "text",
			name: "name",
			meta: { placeholder: "Локі...", maxlength: 20 }
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "organization-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "organization-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});



var route_1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    MapEdit: Map$3,
    AboutEdit: About,
    VideosEdit: Videos$1,
    ContactsEdit: Contacts,
    DocumentsEdit: Documents$1,
    DescriptionEdit: Description$1,
    OrganizationButtonEdit: OrganizationButton$1
});

/* src/routes/organizations/view/_Map.svelte generated by Svelte v3.18.1 */

const css$I = {
	code: ".preview.svelte-1oj9q0u .full-container{height:200px;width:100%;margin:0;border-radius:var(--border-radius-big);overflow:hidden;-webkit-transform:translateZ(0);transform:translateZ(0)}.preview.svelte-1oj9q0u iframe{height:100% !important}",
	map: "{\"version\":3,\"file\":\"_Map.svelte\",\"sources\":[\"_Map.svelte\"],\"sourcesContent\":[\"<script>\\n    import { Br } from '@components'\\n    import { classnames } from '@utils'\\n    import { VirtualTour, WeOnMap } from '../components'\\n\\n    export let location\\n    export let preview\\n</script>\\n\\n<style>\\n    .preview :global(.full-container) {\\n        height: 200px;\\n        width: 100%;\\n        margin: 0;\\n        border-radius: var(--border-radius-big);\\n        overflow: hidden;\\n        -webkit-transform: translateZ(0);\\n                transform: translateZ(0);\\n    }\\n\\n    .preview :global(iframe) {\\n        height: 100% !important;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvb3JnYW5pemF0aW9ucy92aWV3L19NYXAuc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLGFBQWE7UUFDYixXQUFXO1FBQ1gsU0FBUztRQUNULHVDQUF1QztRQUN2QyxnQkFBZ0I7UUFDaEIsZ0NBQXdCO2dCQUF4Qix3QkFBd0I7SUFDNUI7O0lBRUE7UUFDSSx1QkFBdUI7SUFDM0IiLCJmaWxlIjoic3JjL3JvdXRlcy9vcmdhbml6YXRpb25zL3ZpZXcvX01hcC5zdmVsdGUiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAucHJldmlldyA6Z2xvYmFsKC5mdWxsLWNvbnRhaW5lcikge1xuICAgICAgICBoZWlnaHQ6IDIwMHB4O1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzLWJpZyk7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTtcbiAgICB9XG5cbiAgICAucHJldmlldyA6Z2xvYmFsKGlmcmFtZSkge1xuICAgICAgICBoZWlnaHQ6IDEwMCUgIWltcG9ydGFudDtcbiAgICB9XG4iXX0= */</style>\\n\\n<section class={classnames({ preview })}>\\n    <VirtualTour src={location.virtual_tour}/>\\n    <Br size={preview ? 20 : 60} />\\n    <WeOnMap src={location.map}/>\\n</section>\\n\"],\"names\":[],\"mappings\":\"AAUI,uBAAQ,CAAC,AAAQ,eAAe,AAAE,CAAC,AAC/B,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,CAAC,CACT,aAAa,CAAE,IAAI,mBAAmB,CAAC,CACvC,QAAQ,CAAE,MAAM,CAChB,iBAAiB,CAAE,WAAW,CAAC,CAAC,CACxB,SAAS,CAAE,WAAW,CAAC,CAAC,AACpC,CAAC,AAED,uBAAQ,CAAC,AAAQ,MAAM,AAAE,CAAC,AACtB,MAAM,CAAE,IAAI,CAAC,UAAU,AAC3B,CAAC\"}"
};

const Map$4 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { location } = $$props;
	let { preview } = $$props;
	if ($$props.location === void 0 && $$bindings.location && location !== void 0) $$bindings.location(location);
	if ($$props.preview === void 0 && $$bindings.preview && preview !== void 0) $$bindings.preview(preview);
	$$result.css.add(css$I);

	return `<section class="${escape(null_to_empty(classnames({ preview }))) + " svelte-1oj9q0u"}">
    ${validate_component(VirtualTour, "VirtualTour").$$render($$result, { src: location.virtual_tour }, {}, {})}
    ${validate_component(Br, "Br").$$render($$result, { size: preview ? 20 : 60 }, {}, {})}
    ${validate_component(WeOnMap, "WeOnMap").$$render($$result, { src: location.map }, {}, {})}
</section>`;
});

/* src/routes/organizations/view/_About.svelte generated by Svelte v3.18.1 */

const About$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = undefined } = $$props;
	let { text = undefined } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);
	return `${validate_component(Description, "Description").$$render($$result, { title, text }, {}, {})}`;
});

/* src/routes/organizations/view/_Videos.svelte generated by Svelte v3.18.1 */

const Videos_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	return `${validate_component(Videos, "Videos").$$render($$result, { items }, {}, {})}`;
});

/* src/routes/organizations/view/_Contacts.svelte generated by Svelte v3.18.1 */

const Contacts$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { contacts } = $$props;
	let { organization } = $$props;
	if ($$props.contacts === void 0 && $$bindings.contacts && contacts !== void 0) $$bindings.contacts(contacts);
	if ($$props.organization === void 0 && $$bindings.organization && organization !== void 0) $$bindings.organization(organization);

	return `${validate_component(ContactsCard, "ContactsCard").$$render(
		$$result,
		{
			items: contacts,
			orgName: organization.title,
			avatar: organization.avatar,
			avatarBig: organization.avatarBig
		},
		{},
		{}
	)}`;
});

/* src/routes/organizations/view/_Documents.svelte generated by Svelte v3.18.1 */

const Documents$2 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	return `${validate_component(Certificates, "Certificates").$$render($$result, { items }, {}, {})}`;
});

/* src/routes/organizations/view/_Description.svelte generated by Svelte v3.18.1 */

const Description$2 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = undefined } = $$props;
	let { text = undefined } = $$props;
	let { carouselTop = undefined } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);
	if ($$props.carouselTop === void 0 && $$bindings.carouselTop && carouselTop !== void 0) $$bindings.carouselTop(carouselTop);

	return `${validate_component(TopCarousel, "TopCarousel").$$render($$result, { items: carouselTop }, {}, {})}
${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}
${validate_component(DescriptionShort, "DescriptionShort").$$render($$result, { title, text }, {}, {})}`;
});

/* src/routes/organizations/view/_OrganizationButton.svelte generated by Svelte v3.18.1 */

const OrganizationButton_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { organization } = $$props;
	if ($$props.organization === void 0 && $$bindings.organization && organization !== void 0) $$bindings.organization(organization);

	return `${validate_component(OrganizationButton, "OrganizationButton").$$render(
		$$result,
		{
			id: organization.id,
			src: organization.avatar,
			title: organization.name
		},
		{},
		{}
	)}`;
});



var route_2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    MapView: Map$4,
    AboutView: About$1,
    VideosView: Videos_1,
    ContactsView: Contacts$1,
    DocumentsView: Documents$2,
    DescriptionView: Description$2,
    OrganizationButtonView: OrganizationButton_1
});

/* src/routes/funds/components/_Media.svelte generated by Svelte v3.18.1 */

const Media = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Відео про Волтера</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<section class="${"flex"}" style="${"height: 280px"}">
    ${validate_component(Carousel, "Carousel").$$render($$result, { items }, {}, {})}
</section>`;
});

/* src/routes/funds/components/_Share.svelte generated by Svelte v3.18.1 */

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

/* src/routes/funds/components/_Trust.svelte generated by Svelte v3.18.1 */

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

/* src/routes/funds/components/_Comments.svelte generated by Svelte v3.18.1 */

const Comments_1$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Коментарі</h1>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(Comments, "Comments").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/funds/components/_Donators.svelte generated by Svelte v3.18.1 */

const Donators$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Наші піклувальники</h1>
${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(DonatorsList, "DonatorsList").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/funds/components/_HowToHelp.svelte generated by Svelte v3.18.1 */

const HowToHelp = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = { phone: null, how_to_help: null } } = $$props;
	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);

	return `<h1>Як допомогти</h1>
${validate_component(Br, "Br").$$render($$result, { size: "15" }, {}, {})}
<ul style="${"list-style: disc outside none; padding-left: var(--screen-padding)"}" class="${"h3 font-w-500 font-secondary"}">
    ${data.how_to_help !== null
	? `${typeof data.how_to_help === "string"
		? `${each(data.how_to_help.split(/\n?• /).filter(Boolean), line => `<li style="${"padding-bottom: 5px"}">${escape(line)}</li>`)}`
		: ``}`
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

/* src/routes/funds/components/_Documents.svelte generated by Svelte v3.18.1 */

const Documents_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<h1>Документи</h1>
${validate_component(Br, "Br").$$render($$result, { size: "5" }, {}, {})}
<div class="${"full-container"}">
    ${validate_component(Documents, "Documents").$$render($$result, { items }, {}, {})}
</div>`;
});

/* src/routes/funds/components/_AnimalCard.svelte generated by Svelte v3.18.1 */

function getVactinations(values) {
	return [].concat(values || []).map(value => ({
		done: true,
		title: (find(vaccinations, ["value", value]) || {}).text
	})).filter(v => v.title);
}

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
        <div class="${"flex flex-center relative"}" style="${"width: 120px; height: 120px"}">
            ${validate_component(Icon, "Icon").$$render($$result, { type: "polygon", is: "primary" }, {}, {})}

            ${animal.age !== null
		? `<div class="${"text-white text-center absolute"}">
                    <h4 class="${"h1"}">${escape(animal.age)}</h4>
                    <h4 style="${"margin-top: -8px"}">Роки</h4>
                </div>`
		: ``}
        </div>

        <div class="${"flex flex-center relative"}" style="${"width: 120px; height: 120px"}">
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

        <div class="${"flex flex-center relative"}" style="${"width: 120px; height: 120px"}">
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

    ${validate_component(StoryList, "StoryList").$$render(
			$$result,
			{
				label: "Історія життя:",
				value: animal.lifestory,
				readonly: true
			},
			{},
			{}
		)}
    ${validate_component(Br, "Br").$$render($$result, { size: "45" }, {}, {})}

    <h2>Вакцинації</h2>
    ${validate_component(Br, "Br").$$render($$result, { size: "15" }, {}, {})}
    <ul class="${"flex flex-column text-left"}">
        ${animal.vaccination !== null
		? `${each(getVactinations(animal.vaccination), (item, i) => `<li>
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

/* src/routes/funds/components/_Description.svelte generated by Svelte v3.18.1 */

const Description$3 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
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

/* src/routes/funds/components/_TopCarousel.svelte generated by Svelte v3.18.1 */

const TopCarousel$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items = [] } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);

	return `<section class="${"flex"}" style="${"height: 240px"}">
    ${validate_component(Carousel, "Carousel").$$render($$result, { items, dotsBelow: false }, {}, {})}
</section>`;
});

/* src/routes/funds/components/_QuickInfoCard.svelte generated by Svelte v3.18.1 */

const QuickInfoCard = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { cardTop = {
		title: null,
		subtitle: null,
		current_sum: null,
		need_sum: null
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
        ${cardTop.current_sum !== null
		? `<span class="${"h1 font-w-500"}">${escape(cardTop.currency)} ${escape(cardTop.current_sum)}</span>`
		: `<div style="${"width: 50%"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h1" }, {}, {})}</div>`}

        <s></s>

        ${cardTop.need_sum !== null
		? `<span class="${"h3"}">/ ${escape(cardTop.currency)} ${escape(cardTop.need_sum)}</span>`
		: `<div style="${"width: 30%; padding-bottom: 2px"}">${validate_component(Loader, "Loader").$$render($$result, { type: "h3" }, {}, {})}</div>`}
    </p>
    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}

    ${validate_component(Progress, "Progress").$$render(
			$$result,
			{
				value: Math.floor(cardTop.current_sum / cardTop.need_sum * 100)
			},
			{},
			{}
		)}

    ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}
`
	})}`;
});

/* src/routes/funds/components/_OrganizationButton.svelte generated by Svelte v3.18.1 */

const OrganizationButton$2 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
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
    
    ${validate_component(Icon, "Icon").$$render(
				$$result,
				{
					type: "arrow-right",
					size: "medium",
					is: "dark"
				},
				{},
				{}
			)}
  </div>
`
		}
	)}`;
});

/* src/routes/funds/components/_InteractionIndicators.svelte generated by Svelte v3.18.1 */

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
			type: "heart",
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



var route_3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Media: Media,
    Share: Share$1,
    Trust: Trust$1,
    Comments: Comments_1$1,
    Donators: Donators$1,
    HowToHelp: HowToHelp,
    Documents: Documents_1,
    AnimalCard: AnimalCard,
    Description: Description$3,
    TopCarousel: TopCarousel$1,
    QuickInfoCard: QuickInfoCard,
    OrganizationButton: OrganizationButton$2,
    InteractionIndicators: InteractionIndicators$1
});

/* src/routes/funds/edit/_Videos.svelte generated by Svelte v3.18.1 */

const Videos$2 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	const dispatch = createEventDispatcher();

	const defaultField = {
		label: "Відео 1:",
		type: "url",
		name: "videos[0].src",
		meta: {
			placeholder: "https://www.youtube.com/watch?v=oUcAUwptos4&t"
		}
	};

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let currentValues = data || {};
	let formValues = data || {};
	let formErrors = {};
	let fieldsAmount = safeGet(() => currentValues.videos.filter(v => v.src).length, 0, true);

	let formFields = Array.from(new Array(Math.max(2, fieldsAmount + 1))).map((f, i) => ({
		...defaultField,
		label: `Відео ${i + 1}:`,
		name: `videos[${i}].src`
	}));

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "videos-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "videos-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/funds/edit/_TopInfo.svelte generated by Svelte v3.18.1 */

const TopInfo = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			label: "Фотогалерея:",
			type: "files",
			name: "photos",
			meta: { multiple: true }
		},
		{
			label: "Організація:",
			type: "select",
			name: "organization",
			meta: {
				placeholder: "Вибрати...",
				options: [
					{ value: "org1", label: "Організація 1" },
					{ value: "org2", label: "Організація 2" },
					{ value: "org3", label: "Організація 3" }
				]
			}
		},
		{
			label: "Назва фонду:",
			type: "text",
			name: "title",
			meta: {
				placeholder: "Врятуємо її...",
				maxlength: 20
			}
		},
		{
			label: "Ціль фонду:",
			type: "text",
			name: "subtitle",
			meta: {
				placeholder: "Тільки спільними силами...",
				maxlength: 25
			}
		},
		{
			label: "Потрібно зібрати:",
			type: "number",
			name: "need_sum",
			meta: { placeholder: 10, min: 10, max: 100000000 }
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "top-info-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "top-info-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/funds/edit/_Documents.svelte generated by Svelte v3.18.1 */

const Documents$3 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			label: "Документи:",
			type: "files",
			name: "documents",
			meta: {
				multiple: true,
				accept: "image/jpeg,image/png,application/pdf"
			}
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "documents-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "documents-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/funds/edit/_HowToHelp.svelte generated by Svelte v3.18.1 */

const HowToHelp$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			label: "Як можна допомогти:",
			type: "textarea",
			name: "how_to_help",
			meta: { placeholder: "· Привести корм", rows: 6 }
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "howtohelp-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "howtohelp-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});

/* src/routes/funds/edit/_AnimalCard.svelte generated by Svelte v3.18.1 */

const AnimalCard$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			type: "avatar",
			name: "avatar",
			meta: { accept: "image/jpeg,image/png" }
		},
		{
			label: "Кличка:",
			type: "text",
			name: "name",
			meta: { placeholder: "Локі...", maxlength: 20 }
		},
		{
			label: "Порода:",
			type: "text",
			name: "breed",
			meta: {
				placeholder: "Лабрадор...",
				maxlength: 20
			}
		},
		{
			label: "День народження:",
			type: "date",
			name: "birth",
			meta: { placeholder: "18.03.2019..." }
		},
		{
			label: "Стать:",
			type: "radio-rect",
			name: "sex",
			meta: {
				options: [
					{
						label: "Він",
						value: "male",
						preIcon: "check-flag"
					},
					{
						label: "Вона",
						value: "female",
						preIcon: "check-flag"
					}
				]
			}
		},
		{
			label: "Стерилізація?",
			type: "radio-rect",
			name: "sterilization",
			meta: {
				options: [
					{
						label: "Так",
						value: true,
						preIcon: "check-flag"
					},
					{
						label: "Ні",
						value: false,
						preIcon: "close"
					}
				]
			}
		},
		{
			label: "Характер:",
			type: "custom-character",
			name: "character_short",
			meta: {
				options: [
					{ label: "😃", value: "😃" },
					{ label: "😇", value: "😇" },
					{ label: "😜", value: "😜" },
					{ label: "😎", value: "😎" },
					{ label: "😝", value: "😝" }
				]
			}
		},
		{
			label: "Опис характеру:",
			type: "textarea",
			name: "character",
			meta: {
				rows: 6,
				maxlength: 75,
				placeholder: "Грайливий та веселий песик..."
			}
		},
		{
			label: "Історія життя:",
			type: "custom-lifestory",
			name: "lifestory",
			meta: { max: 100, maxlength: 75 }
		},
		{
			label: "Вакцинація:",
			type: "checkbox",
			name: "vaccination",
			meta: { options: vaccinations }
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "animal-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "animal-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{
				default: ({ item, value, onChange }) => `
        ${item.type === "custom-character"
				? `<section>
                <h2 class="${"text-left"}">
                    ${escape(item.label)}
                    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
                </h2>
                <div class="${"flex flex-justify-center"}">
                    ${validate_component(RadioRect, "RadioRect").$$render($$result, Object.assign(item.meta, { value }, { name: item.name }), {}, {
						default: ({ item: radio }) => `
                        ${validate_component(Square, "Square").$$render(
							$$result,
							{
								style: "width: calc(40px + (50 - 40) * ((100vw - 320px) / (375 - 320))); max-width: 50px",
								class: "flex flex-align-center flex-justify-center"
							},
							{},
							{
								default: () => `
                            <span class="${"h1 flex-1 flex flex-align-center flex-justify-center"}">
                                ${escape(radio.label)}
                            </span>
                        `
							}
						)}
                    `
					})}
                </div>
            </section>`
				: `${item.type === "custom-lifestory"
					? `<section>
                ${validate_component(StoryList, "StoryList").$$render($$result, Object.assign(item.meta, { value }, { name: item.name }, { label: item.label }), {}, {})}
            </section>`
					: ``}`}
    `
			}
		)}
`
	})}`;
});

/* src/routes/funds/edit/_Description.svelte generated by Svelte v3.18.1 */

const Description$4 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data = undefined } = $$props;

	let { submit = async () => {
		
	} } = $$props;

	let formFields = [
		{
			label: "Ціль фонду:",
			type: "text",
			name: "title",
			meta: {
				disabled: true,
				placeholder: "Тільки спільними силами...",
				maxlength: 25
			}
		},
		{
			label: "Опис фонду:",
			type: "textarea",
			name: "description",
			meta: {
				rows: 6,
				placeholder: "У нас добра мета...",
				max: 250
			}
		}
	];

	async function onSubmit(e) {
		await submit(e);
	}

	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	if ($$props.submit === void 0 && $$bindings.submit && submit !== void 0) $$bindings.submit(submit);
	let formValues = data || {};
	let formErrors = {};

	return `${validate_component(EditCard, "EditCard").$$render($$result, { form: "description-form" }, {}, {
		default: () => `
    ${validate_component(FormBuilder, "FormBuilder").$$render(
			$$result,
			{
				id: "description-form",
				items: formFields,
				data: formValues,
				errors: formErrors,
				submit: onSubmit
			},
			{},
			{}
		)}
`
	})}`;
});



var route_4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    VideosEdit: Videos$2,
    TopInfoEdit: TopInfo,
    DocumentsEdit: Documents$3,
    HowToHelpEdit: HowToHelp$1,
    AnimalCardEdit: AnimalCard$1,
    DescriptionEdit: Description$4
});

/* src/routes/funds/view/_Videos.svelte generated by Svelte v3.18.1 */

const Videos$3 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	return `${validate_component(Media, "Media").$$render($$result, { items }, {}, {})}`;
});

/* src/routes/funds/view/_TopInfo.svelte generated by Svelte v3.18.1 */

const TopInfo$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { cardTop } = $$props;
	let { carouselTop } = $$props;
	let { organization } = $$props;
	if ($$props.cardTop === void 0 && $$bindings.cardTop && cardTop !== void 0) $$bindings.cardTop(cardTop);
	if ($$props.carouselTop === void 0 && $$bindings.carouselTop && carouselTop !== void 0) $$bindings.carouselTop(carouselTop);
	if ($$props.organization === void 0 && $$bindings.organization && organization !== void 0) $$bindings.organization(organization);

	return `${validate_component(TopCarousel$1, "TopCarousel").$$render($$result, { items: carouselTop }, {}, {})}
${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}

${validate_component(OrganizationButton$2, "OrganizationButton").$$render(
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

${validate_component(QuickInfoCard, "QuickInfoCard").$$render($$result, { cardTop }, {}, {})}`;
});

/* src/routes/funds/view/_Documents.svelte generated by Svelte v3.18.1 */

const Documents_1$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { items } = $$props;
	if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
	return `${validate_component(Documents_1, "Documents").$$render($$result, { items }, {}, {})}`;
});

/* src/routes/funds/view/_HowToHelp.svelte generated by Svelte v3.18.1 */

const HowToHelp_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { data } = $$props;
	if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
	return `${validate_component(HowToHelp, "HowToHelp").$$render($$result, { data }, {}, {})}`;
});

/* src/routes/funds/view/_AnimalCard.svelte generated by Svelte v3.18.1 */

const AnimalCard_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { animal = undefined } = $$props;
	if ($$props.animal === void 0 && $$bindings.animal && animal !== void 0) $$bindings.animal(animal);
	return `${validate_component(AnimalCard, "AnimalCard").$$render($$result, { animal }, {}, {})}`;
});

/* src/routes/funds/view/_Description.svelte generated by Svelte v3.18.1 */

const Description_1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { title = undefined } = $$props;
	let { text = undefined } = $$props;
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);
	return `${validate_component(Description$3, "Description").$$render($$result, { title, text }, {}, {})}`;
});



var route_5 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    VideosView: Videos$3,
    TopInfoView: TopInfo$1,
    DocumentsView: Documents_1$1,
    HowToHelpView: HowToHelp_1,
    AnimalCardView: AnimalCard_1,
    DescriptionView: Description_1
});

/* src/routes/index.svelte generated by Svelte v3.18.1 */

const css$J = {
	code: ".top-pic.svelte-zj2ii1{-webkit-box-flex:0;-ms-flex:none;flex:none;z-index:0;width:100%;height:200px;display:-webkit-box;display:-ms-flexbox;display:flex;overflow:hidden;border-radius:0}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<script>\\n    import {\\n        Br,\\n        Footer,\\n        Divider,\\n        Comments,\\n        Progress,\\n        Carousel,\\n        ContentHolder,\\n        TitleSubTitle,\\n        ListOfFeatures,\\n    } from '@components'\\n</script>\\n\\n<style>\\n    .top-pic {\\n        -webkit-box-flex: 0;\\n            -ms-flex: none;\\n                flex: none;\\n        z-index: 0;\\n        width: 100%;\\n        height: 200px;\\n        display: -webkit-box;\\n        display: -ms-flexbox;\\n        display: flex;\\n        overflow: hidden;\\n        border-radius: 0;\\n    }\\n\\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9yb3V0ZXMvaW5kZXguc3ZlbHRlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7SUFDSTtRQUNJLG1CQUFVO1lBQVYsY0FBVTtnQkFBVixVQUFVO1FBQ1YsVUFBVTtRQUNWLFdBQVc7UUFDWCxhQUFhO1FBQ2Isb0JBQWE7UUFBYixvQkFBYTtRQUFiLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsZ0JBQWdCO0lBQ3BCIiwiZmlsZSI6InNyYy9yb3V0ZXMvaW5kZXguc3ZlbHRlIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgLnRvcC1waWMge1xuICAgICAgICBmbGV4OiBub25lO1xuICAgICAgICB6LWluZGV4OiAwO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAyMDBweDtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICB9XG4iXX0= */</style>\\n\\n<svelte:head>\\n    <title>Charitify - list of charities you can donate.</title>\\n</svelte:head>\\n\\n<section>\\n    <Br size=\\\"var(--header-height)\\\"/>\\n\\n    <div class=\\\"top-pic\\\">\\n        <Carousel/>\\n    </div>\\n\\n    <Progress borderRadius=\\\"0 0 8px 8px\\\" value=\\\"30\\\"/>\\n\\n    <p>These guys rise a pound of vegetables. They like vegetables and long text under photos.</p>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <section class=\\\"container\\\">\\n\\n        <TitleSubTitle\\n                title=\\\"Charitify\\\"\\n                subtitle=\\\"Charity application for helping those in need\\\"\\n        />\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <ContentHolder/>\\n\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n        <br>\\n\\n        <Divider size=\\\"16\\\"/>\\n        <h3 class=\\\"h2 text-right\\\">Comments:</h3>\\n        <Divider size=\\\"20\\\"/>\\n\\n        <Comments withForm={false}/>\\n\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n\\n            <ContentHolder/>\\n\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n            <br>\\n\\n            <ListOfFeatures/>\\n    </section>\\n\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n    <br>\\n\\n    <Footer/>\\n\\n</section>\\n\"],\"names\":[],\"mappings\":\"AAeI,QAAQ,cAAC,CAAC,AACN,gBAAgB,CAAE,CAAC,CACf,QAAQ,CAAE,IAAI,CACV,IAAI,CAAE,IAAI,CAClB,OAAO,CAAE,CAAC,CACV,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,WAAW,CACpB,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,CAAC,AACpB,CAAC\"}"
};

const Routes = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css$J);

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

/* src/routes/_layout.svelte generated by Svelte v3.18.1 */

const Layout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment } = $$props;
	let theme = safeGet(() => cookieStorage.get("theme") || localStorage.get("theme"));

	onMount(() => {
		disableDoubleTapZoom([document]);
	});

	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	let classProp = classnames("theme-bg-color-secondary", theme);

	return `<main id="${"main"}"${add_attribute("class", classProp, 0)}>
	${validate_component(Header, "Header").$$render($$result, { segment }, {}, {})}

	<section class="${"pages"}">
		${$$slots.default ? $$slots.default({}) : ``}
	</section>

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

/* src/routes/organizations/[id].svelte generated by Svelte v3.18.1 */

const U5Bidu5D = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $page;
	const { page } = stores$1();
	$page = get_store_value(page);

	// Organization
	let organizationId = $page.params.id;

	let isEditMode = false;

	let isEdit = {
		topInfo: false,
		description: false,
		about: false,
		documents: false,
		videos: false,
		contacts: false,
		map: false
	};

	// Entities
	let organization = {};

	let comments;
	let funds;

	onMount(async () => {
		await delay(7000);
		organization = await API.getOrganization(organizationId);
		comments = await API.getComments();
		funds = await API.getFunds();
	});

	async function onSubmit(section, values) {
		isEdit[section] = false;
		console.log(values);
	}

	$page = get_store_value(page);

	let organizationBlock = {
		id: organization.id,
		name: organization.name,
		avatar: organization.avatar,
		avatarBig: organization.avatarBig
	};

	let carouselTop = (organization.avatars || []).map((a, i) => ({
		src: a.src,
		srcBig: a.src2x,
		alt: a.title
	}));

	let descriptionShort = {
		name: organization.name || null,
		subtitle: organization.subtitle || null,
		description: organization.description || null
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

    <div>
        ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
        ${validate_component(Button, "Button").$$render($$result, { size: "small", is: "info" }, {}, {
		default: () => `
            <span class="${"h3 font-secondary font-w-500 flex flex-align-center"}">
                ${escape( "Редагувати")}
                <s></s>
                <s></s>
                ${ `${validate_component(Icon, "Icon").$$render($$result, { type: "edit", size: "small", is: "light" }, {}, {})}`
		}
            </span>
        `
	})}
        ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
    </div>

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.topInfo }, {}, {
		default: () => `
        ${validate_component(OrganizationButton$1, "OrganizationButtonEdit").$$render(
			$$result,
			{
				data: organizationBlock,
				submit: onSubmit.bind(null, "topInfo")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.topInfo,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(OrganizationButton_1, "OrganizationButtonView").$$render($$result, { organization: organizationBlock }, {}, {})}
        `
			})}
    `
		}
	)}
    ${ ``}
    

    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
    
    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.description }, {}, {
		default: () => `
        ${validate_component(Description$1, "DescriptionEdit").$$render(
			$$result,
			{
				data: {
					...descriptionShort,
					avatars: carouselTop
				},
				submit: onSubmit.bind(null, "description")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.description,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `
            ${ ``}  
            ${validate_component(Description$2, "DescriptionView").$$render(
					$$result,
					{
						carouselTop,
						title: descriptionShort.name,
						text: descriptionShort.subtitle
					},
					{},
					{}
				)}
        `
			})}
    `
		}
	)}
    ${ ``}
    

    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: !isEditMode, mounted: true }, {}, {
		default: () => `
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
    `
	})}
    ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
    
    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.about }, {}, {
		default: () => `
        ${validate_component(About, "AboutEdit").$$render(
			$$result,
			{
				data: descriptionShort,
				submit: onSubmit.bind(null, "about")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.about,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(About$1, "AboutView").$$render(
					$$result,
					{
						title: "Про нас",
						text: descriptionShort.description
					},
					{},
					{}
				)}
        `
			})}
    `
		}
	)}
    

    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: !isEditMode, mounted: true }, {}, {
		default: () => `
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
    `
	})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.documents }, {}, {
		default: () => `
        ${validate_component(Documents$1, "DocumentsEdit").$$render(
			$$result,
			{
				data: { documents },
				submit: onSubmit.bind(null, "documents")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.documents,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(Documents$2, "DocumentsView").$$render($$result, { items: documents }, {}, {})}
        `
			})}
    `
		}
	)}
    ${ ``}
    
    
    ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.videos }, {}, {
		default: () => `
        ${validate_component(Videos$1, "VideosEdit").$$render(
			$$result,
			{
				data: { videos: media },
				submit: onSubmit.bind(null, "videos")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.videos,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "15" }, {}, {})}
            ${validate_component(Videos_1, "VideosView").$$render($$result, { items: media }, {}, {})}
        `
			})}
    `
		}
	)}
    ${ ``}
    
    
    ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.contacts }, {}, {
		default: () => `
        ${validate_component(Contacts, "ContactsEdit").$$render(
			$$result,
			{
				data: { ...organizationBlock, contacts },
				submit: onSubmit.bind(null, "contacts")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.contacts,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(Contacts$1, "ContactsView").$$render($$result, { contacts, organization }, {}, {})}
        `
			})}
    `
		}
	)}
    ${ ``}
    

    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.map }, {}, {
		default: () => `
        ${validate_component(Map$3, "MapEdit").$$render(
			$$result,
			{
				data: { location },
				submit: onSubmit.bind(null, "map")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.map,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "15" }, {}, {})}
            ${validate_component(Map$4, "MapView").$$render($$result, { location, preview: isEditMode }, {}, {})}
        `
			})}
    `
		}
	)}
    ${ ``}
    
    
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: !isEditMode, mounted: true }, {}, {
		default: () => `
        ${validate_component(Comments_1, "Comments").$$render($$result, { items: commentsData.comments }, {}, {})}
        ${validate_component(Br, "Br").$$render($$result, { size: "40" }, {}, {})}
    `
	})}

    <div class="${"full-container"}">
        ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
    </div>
</section>`;
});

/* src/routes/funds/[id].svelte generated by Svelte v3.18.1 */

const U5Bidu5D$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $page;
	const { page } = stores$1();
	$page = get_store_value(page);
	let charityId = $page.params.id;
	let isEditMode = false;

	let isEdit = {
		topInfo: false,
		description: false,
		videos: false,
		documents: false,
		howToHelp: false,
		animalCard: false
	};

	// Entities
	let charity;

	let comments;

	onMount(async () => {
		await delay(5000);
		charity = await API.getFund(charityId);
		comments = await API.getComments();
	});

	async function onSubmit(section, values) {
		isEdit[section] = false;
		console.log(values);
	}

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
		current_sum: charity.curremt_sum,
		need_sum: charity.need_sum,
		currency: charity.currency
	}));

	let iconsLine = {
		likes: safeGet(() => charity.likes),
		views: safeGet(() => charity.views)
	};

	let trust = { isLiked: safeGet(() => charity.is_liked) };

	let descriptionBlock = {
		title: safeGet(() => charity.title),
		description: safeGet(() => charity.description)
	};

	let animal = safeGet(() => ({
		avatar: charity.animal.avatars[0].src,
		name: charity.animal.name,
		breed: charity.animal.breed,
		birth: charity.animal.birth,
		age: new Date().getFullYear() - new Date(charity.animal.birth).getFullYear(),
		sex: charity.animal.sex,
		sterilization: charity.animal.sterilization,
		character: charity.animal.character,
		character_short: charity.animal.character_short,
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

	let howToHelp = safeGet(() => ({
		phone: charity.organization.phone,
		how_to_help: charity.how_to_help
	}));

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

    <div>
        ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
        ${validate_component(Button, "Button").$$render($$result, { size: "small", is: "info" }, {}, {
		default: () => `
            <span class="${"h3 font-secondary font-w-500 flex flex-align-center"}">
                ${escape( "Редагувати")}
                <s></s>
                <s></s>
                ${ `${validate_component(Icon, "Icon").$$render($$result, { type: "edit", size: "small", is: "light" }, {}, {})}`
		}
            </span>
        `
	})}
        ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
    </div>

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.topInfo }, {}, {
		default: () => `
        ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
        ${validate_component(TopInfo, "TopInfoEdit").$$render(
			$$result,
			{
				data: {
					...cardTop,
					organization,
					photos: carouselTop
				},
				submit: onSubmit.bind(null, "topInfo")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.topInfo,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(TopInfo$1, "TopInfoView").$$render($$result, { cardTop, carouselTop, organization }, {}, {})}
        `
			})}
    `
		}
	)}
    

    ${validate_component(Br, "Br").$$render($$result, { size: "20" }, {}, {})}
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: !isEditMode, mounted: true }, {}, {
		default: () => `
        ${validate_component(InteractionIndicators$1, "InteractionIndicators").$$render(
			$$result,
			{
				likes: iconsLine.likes,
				views: iconsLine.views
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(Br, "Br").$$render($$result, { size: "50" }, {}, {})}

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.description }, {}, {
		default: () => `
        ${validate_component(Description$4, "DescriptionEdit").$$render(
			$$result,
			{
				data: descriptionBlock,
				submit: onSubmit.bind(null, "description")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.description,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(Description_1, "DescriptionView").$$render(
					$$result,
					{
						title: descriptionBlock.title,
						text: descriptionBlock.description
					},
					{},
					{}
				)}
        `
			})}
    `
		}
	)}
    

    ${validate_component(Br, "Br").$$render($$result, { size: "10" }, {}, {})}
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: !isEditMode, mounted: true }, {}, {
		default: () => `
        ${validate_component(Share$1, "Share").$$render($$result, {}, {}, {})}
        ${validate_component(Br, "Br").$$render($$result, { size: "45" }, {}, {})}
        ${validate_component(Trust$1, "Trust").$$render($$result, { active: trust.isLiked }, {}, {})}
    `
	})}
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.animalCard }, {}, {
		default: () => `
        ${validate_component(AnimalCard$1, "AnimalCardEdit").$$render(
			$$result,
			{
				data: animal,
				submit: onSubmit.bind(null, "animalCard")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.animalCard,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(AnimalCard_1, "AnimalCardView").$$render($$result, { animal }, {}, {})}
        `
			})}
    `
		}
	)}
    

    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: !isEditMode, mounted: true }, {}, {
		default: () => `
        ${validate_component(Donators$1, "Donators").$$render($$result, { items: donators }, {}, {})}
        ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}
    `
	})}

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.documents }, {}, {
		default: () => `
        ${validate_component(Documents$3, "DocumentsEdit").$$render(
			$$result,
			{
				data: { documents },
				submit: onSubmit.bind(null, "documents")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.documents,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(Documents_1$1, "DocumentsView").$$render($$result, { items: documents }, {}, {})}
        `
			})}
    `
		}
	)}
    
    
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})} 
    
    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.videos }, {}, {
		default: () => `
        ${validate_component(Videos$2, "VideosEdit").$$render(
			$$result,
			{
				data: { videos: media },
				submit: onSubmit.bind(null, "videos")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.videos,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(Videos$3, "VideosView").$$render($$result, { items: media }, {}, {})}
        `
			})}
    `
		}
	)}
    
    
    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}

    
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: isEdit.howToHelp }, {}, {
		default: () => `
        ${validate_component(HowToHelp$1, "HowToHelpEdit").$$render(
			$$result,
			{
				data: howToHelp,
				submit: onSubmit.bind(null, "howToHelp")
			},
			{},
			{}
		)}
    `
	})}
    ${validate_component(LazyToggle, "LazyToggle").$$render(
		$$result,
		{
			active: !isEdit.howToHelp,
			mounted: true,
			class: "full-container"
		},
		{},
		{
			default: () => `
        ${validate_component(EditArea, "EditArea").$$render($$result, { off: !isEditMode }, {}, {
				default: () => `    
            ${validate_component(Br, "Br").$$render($$result, { size: "30" }, {}, {})}
            ${validate_component(HowToHelp_1, "HowToHelpView").$$render($$result, { data: howToHelp }, {}, {})}
        `
			})}
    `
		}
	)}
    

    ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}
    ${validate_component(LazyToggle, "LazyToggle").$$render($$result, { active: !isEditMode, mounted: true }, {}, {
		default: () => `
        ${validate_component(Comments_1$1, "Comments").$$render($$result, { items: commentsData.comments }, {}, {})}
        ${validate_component(Br, "Br").$$render($$result, { size: "60" }, {}, {})}
    `
	})}

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
		// await new Promise(r => setTimeout(r, 1000))
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
		// await new Promise(r => setTimeout(r, 1000))
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
            ${validate_component(Button, "Button").$$render($$result, { size: "big", is: "success", href }, {}, {
			default: () => `
                <span class="${"h2 font-secondary font-w-600"}">
                    Додати
                </span>
            `
		})}
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
${validate_component(Map$2, "Map").$$render($$result, {}, {}, {
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
${validate_component(Map$2, "Map").$$render($$result, { center }, {}, {
		default: () => `
    ${each(organizations, o => `${validate_component(MapMarker, "MapMarker").$$render($$result, { lat: o.location.lat, lng: o.location.lng }, {}, {})}`)}
`
	})}`;
});

// This file is generated by Sapper — do not edit it!

const d = decodeURIComponent;

const manifest = {
	server_routes: [
		{
			// organizations/components/index.js
			pattern: /^\/organizations\/components\/?$/,
			handlers: route_0,
			params: () => ({})
		},

		{
			// organizations/edit/index.js
			pattern: /^\/organizations\/edit\/?$/,
			handlers: route_1,
			params: () => ({})
		},

		{
			// organizations/view/index.js
			pattern: /^\/organizations\/view\/?$/,
			handlers: route_2,
			params: () => ({})
		},

		{
			// funds/components/index.js
			pattern: /^\/funds\/components\/?$/,
			handlers: route_3,
			params: () => ({})
		},

		{
			// funds/edit/index.js
			pattern: /^\/funds\/edit\/?$/,
			handlers: route_4,
			params: () => ({})
		},

		{
			// funds/view/index.js
			pattern: /^\/funds\/view\/?$/,
			handlers: route_5,
			params: () => ({})
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
function find$1(map, name) {
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
		const key = find$1(this[MAP], name);
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
		const key = find$1(this[MAP], name);
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
		const key = find$1(this[MAP], name);
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
		return find$1(this[MAP], name) !== undefined;
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
		const key = find$1(this[MAP], name);
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
	const hostHeaderKey = find$1(headers[MAP], 'Host');
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

// import * as controllers from '@controllers'

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

express() // You can also use Polka
	// .get(getUrl(endpoints.FUND()), controllers.FundsController.getFund)
	// .get(getUrl(endpoints.FUNDS()), controllers.FundsController.getFunds)
	// .get(getUrl(endpoints.USER()), controllers.UsersController.getUser)
	// .get(getUrl(endpoints.USERS()), controllers.UsersController.getUsers)
	// .get(getUrl(endpoints.RECENT()), controllers.NewsController.getNews)
	// .get(getUrl(endpoints.RECENTS()), controllers.NewsController.getNewss)
	// .get(getUrl(endpoints.COMMENT()), controllers.CommentsController.getComment)
	// .get(getUrl(endpoints.COMMENTS()), controllers.CommentsController.getComments)
	// .get(getUrl(endpoints.ORGANIZATION()), controllers.OrganizationsController.getOrganization)
	// .get(getUrl(endpoints.ORGANIZATIONS()), controllers.OrganizationsController.getOrganizations)
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
