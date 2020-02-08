import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, J as SearchLine, K as create_slot, F as Footer, e as space, f as element, g as create_component, t as text, q as query_selector_all, h as detach_dev, j as claim_space, k as claim_element, l as children, m as claim_component, n as claim_text, p as add_location, o as attr_dev, M as toggle_class, r as insert_dev, v as append_dev, u as mount_component, N as get_slot_context, O as get_slot_changes, w as transition_in, x as transition_out, y as destroy_component } from './client.035fe636.js';

/* src/routes/lists/_layout.svelte generated by Svelte v3.18.1 */
const file = "src/routes/lists/_layout.svelte";

function create_fragment(ctx) {
	let t0;
	let div0;
	let br0;
	let t1;
	let t2;
	let nav;
	let ul;
	let li0;
	let a0;
	let t3;
	let t4;
	let li1;
	let a1;
	let t5;
	let t6;
	let div1;
	let br1;
	let t7;
	let t8;
	let br2;
	let t9;
	let br3;
	let t10;
	let current;
	const searchline = new SearchLine({ $$inline: true });
	const default_slot_template = /*$$slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
	const footer = new Footer({ $$inline: true });

	const block = {
		c: function create() {
			t0 = space();
			div0 = element("div");
			br0 = element("br");
			t1 = space();
			create_component(searchline.$$.fragment);
			t2 = space();
			nav = element("nav");
			ul = element("ul");
			li0 = element("li");
			a0 = element("a");
			t3 = text("charities");
			t4 = space();
			li1 = element("li");
			a1 = element("a");
			t5 = text("organizations");
			t6 = space();
			div1 = element("div");
			br1 = element("br");
			t7 = space();
			if (default_slot) default_slot.c();
			t8 = space();
			br2 = element("br");
			t9 = space();
			br3 = element("br");
			t10 = space();
			create_component(footer.$$.fragment);
			this.h();
		},
		l: function claim(nodes) {
			const head_nodes = query_selector_all("[data-svelte=\"svelte-1sjtmin\"]", document.head);
			head_nodes.forEach(detach_dev);
			t0 = claim_space(nodes);
			div0 = claim_element(nodes, "DIV", { class: true });
			var div0_nodes = children(div0);
			br0 = claim_element(div0_nodes, "BR", {});
			t1 = claim_space(div0_nodes);
			claim_component(searchline.$$.fragment, div0_nodes);
			t2 = claim_space(div0_nodes);
			nav = claim_element(div0_nodes, "NAV", { class: true });
			var nav_nodes = children(nav);
			ul = claim_element(nav_nodes, "UL", { class: true });
			var ul_nodes = children(ul);
			li0 = claim_element(ul_nodes, "LI", { class: true });
			var li0_nodes = children(li0);
			a0 = claim_element(li0_nodes, "A", { rel: true, href: true, class: true });
			var a0_nodes = children(a0);
			t3 = claim_text(a0_nodes, "charities");
			a0_nodes.forEach(detach_dev);
			li0_nodes.forEach(detach_dev);
			t4 = claim_space(ul_nodes);
			li1 = claim_element(ul_nodes, "LI", { class: true });
			var li1_nodes = children(li1);
			a1 = claim_element(li1_nodes, "A", { rel: true, href: true, class: true });
			var a1_nodes = children(a1);
			t5 = claim_text(a1_nodes, "organizations");
			a1_nodes.forEach(detach_dev);
			li1_nodes.forEach(detach_dev);
			ul_nodes.forEach(detach_dev);
			nav_nodes.forEach(detach_dev);
			div0_nodes.forEach(detach_dev);
			t6 = claim_space(nodes);
			div1 = claim_element(nodes, "DIV", { class: true });
			var div1_nodes = children(div1);
			br1 = claim_element(div1_nodes, "BR", {});
			t7 = claim_space(div1_nodes);
			if (default_slot) default_slot.l(div1_nodes);
			t8 = claim_space(div1_nodes);
			br2 = claim_element(div1_nodes, "BR", {});
			t9 = claim_space(div1_nodes);
			br3 = claim_element(div1_nodes, "BR", {});
			div1_nodes.forEach(detach_dev);
			t10 = claim_space(nodes);
			claim_component(footer.$$.fragment, nodes);
			this.h();
		},
		h: function hydrate() {
			document.title = "Charitify - is the application for helping those in need.";
			add_location(br0, file, 11, 1, 238);
			attr_dev(a0, "rel", "prefetch");
			attr_dev(a0, "href", "lists/charities");
			attr_dev(a0, "class", "svelte-1vo7cwi");
			toggle_class(a0, "selected", /*segment*/ ctx[0] === "charities");
			add_location(a0, file, 17, 7, 281);
			attr_dev(li0, "class", "svelte-1vo7cwi");
			add_location(li0, file, 17, 3, 277);
			attr_dev(a1, "rel", "prefetch");
			attr_dev(a1, "href", "lists/organizations");
			attr_dev(a1, "class", "svelte-1vo7cwi");
			toggle_class(a1, "selected", /*segment*/ ctx[0] === "organizations");
			add_location(a1, file, 18, 7, 389);
			attr_dev(li1, "class", "svelte-1vo7cwi");
			add_location(li1, file, 18, 3, 385);
			attr_dev(ul, "class", "svelte-1vo7cwi");
			add_location(ul, file, 16, 2, 269);
			attr_dev(nav, "class", "svelte-1vo7cwi");
			add_location(nav, file, 15, 1, 261);
			attr_dev(div0, "class", "search theme-bg container svelte-1vo7cwi");
			add_location(div0, file, 10, 0, 197);
			add_location(br1, file, 24, 1, 551);
			add_location(br2, file, 28, 1, 574);
			add_location(br3, file, 29, 1, 580);
			attr_dev(div1, "class", "list-wrap svelte-1vo7cwi");
			add_location(div1, file, 23, 0, 526);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, div0, anchor);
			append_dev(div0, br0);
			append_dev(div0, t1);
			mount_component(searchline, div0, null);
			append_dev(div0, t2);
			append_dev(div0, nav);
			append_dev(nav, ul);
			append_dev(ul, li0);
			append_dev(li0, a0);
			append_dev(a0, t3);
			append_dev(ul, t4);
			append_dev(ul, li1);
			append_dev(li1, a1);
			append_dev(a1, t5);
			insert_dev(target, t6, anchor);
			insert_dev(target, div1, anchor);
			append_dev(div1, br1);
			append_dev(div1, t7);

			if (default_slot) {
				default_slot.m(div1, null);
			}

			append_dev(div1, t8);
			append_dev(div1, br2);
			append_dev(div1, t9);
			append_dev(div1, br3);
			insert_dev(target, t10, anchor);
			mount_component(footer, target, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*segment*/ 1) {
				toggle_class(a0, "selected", /*segment*/ ctx[0] === "charities");
			}

			if (dirty & /*segment*/ 1) {
				toggle_class(a1, "selected", /*segment*/ ctx[0] === "organizations");
			}

			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(searchline.$$.fragment, local);
			transition_in(default_slot, local);
			transition_in(footer.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(searchline.$$.fragment, local);
			transition_out(default_slot, local);
			transition_out(footer.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(div0);
			destroy_component(searchline);
			if (detaching) detach_dev(t6);
			if (detaching) detach_dev(div1);
			if (default_slot) default_slot.d(detaching);
			if (detaching) detach_dev(t10);
			destroy_component(footer, detaching);
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
		init(this, options, instance, create_fragment, safe_not_equal, { segment: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Layout",
			options,
			id: create_fragment.name
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

export default Layout;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2xheW91dC5kZTBiMTczZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3JvdXRlcy9saXN0cy9fbGF5b3V0LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c3ZlbHRlOmhlYWQ+XG5cdDx0aXRsZT5DaGFyaXRpZnkgLSBpcyB0aGUgYXBwbGljYXRpb24gZm9yIGhlbHBpbmcgdGhvc2UgaW4gbmVlZC48L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPHNjcmlwdD5cblx0aW1wb3J0IHsgU2VhcmNoTGluZSwgRm9vdGVyIH0gZnJvbSAnLi4vLi4vbGF5b3V0cydcblxuXHRleHBvcnQgbGV0IHNlZ21lbnRcbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwic2VhcmNoIHRoZW1lLWJnIGNvbnRhaW5lclwiPlxuXHQ8YnI+XG5cblx0PFNlYXJjaExpbmUvPlxuXG5cdDxuYXY+XG5cdFx0PHVsPlxuXHRcdFx0PGxpPjxhIHJlbD1wcmVmZXRjaCBocmVmPSdsaXN0cy9jaGFyaXRpZXMnIGNsYXNzOnNlbGVjdGVkPSd7c2VnbWVudCA9PT0gXCJjaGFyaXRpZXNcIn0nPmNoYXJpdGllczwvYT48L2xpPlxuXHRcdFx0PGxpPjxhIHJlbD1wcmVmZXRjaCBocmVmPSdsaXN0cy9vcmdhbml6YXRpb25zJyBjbGFzczpzZWxlY3RlZD0ne3NlZ21lbnQgPT09IFwib3JnYW5pemF0aW9uc1wifSc+b3JnYW5pemF0aW9uczwvYT48L2xpPlxuXHRcdDwvdWw+XG5cdDwvbmF2PlxuPC9kaXY+XG5cbjxkaXYgY2xhc3M9XCJsaXN0LXdyYXBcIj5cblx0PGJyPlxuXG5cdDxzbG90Pjwvc2xvdD5cblxuXHQ8YnI+XG5cdDxicj5cbjwvZGl2PlxuXG48Rm9vdGVyLz5cblxuPHN0eWxlPlxuXHQuc2VhcmNoIHtcblx0XHRwb3NpdGlvbjogc3RpY2t5O1xuXHRcdHRvcDogNDdweDtcblx0XHRib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG5cdH1cblxuXHQubGlzdC13cmFwIHtcblx0XHRmbGV4OiAxIDEgYXV0bztcblx0XHRwYWRkaW5nOiAwIHZhcigtLXNjcmVlbi1wYWRkaW5nKVxuXHR9XG5cblx0bmF2IHVsLCBuYXYgbGkge1xuXHRcdGRpc3BsYXk6IGZsZXg7XG5cdFx0YWxpZ24tc2VsZjogc3RyZXRjaDtcblx0XHRhbGlnbi1pdGVtczogc3RyZXRjaDtcblx0XHRqdXN0aWZ5LWNvbnRlbnQ6IHN0cmV0Y2g7XG5cdH1cblxuXHRsaSB7XG5cdFx0ZmxleDogMSAxIDA7XG5cdH1cblxuXHRsaSBhIHtcblx0XHRmbGV4OiAxIDEgMDtcblx0XHRhbGlnbi1zZWxmOiBzdHJldGNoO1xuXHRcdGRpc3BsYXk6IGZsZXg7XG5cdFx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0XHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0XHR0ZXh0LWFsaWduOiBjZW50ZXI7XG5cdFx0cGFkZGluZzogMjBweCAxMHB4O1xuXHR9XG5cblx0bGkgYTpob3ZlciwgbGkgYS5zZWxlY3RlZCB7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1jb2xvci1ibGFjayksIC4xKTtcblx0fVxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzRDQWlCK0QsR0FBTyxRQUFLLFdBQVc7Ozs7Ozs7NENBQ25CLEdBQU8sUUFBSyxlQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkNBRC9CLEdBQU8sUUFBSyxXQUFXOzs7OzZDQUNuQixHQUFPLFFBQUssZUFBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FmbEYsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
