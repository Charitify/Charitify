import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, q as space, o as element, R as text, t as claim_space, c as claim_element, f as children, T as claim_text, g as detach_dev, j as add_location, h as attr_dev, k as insert_dev, l as append_dev, m as noop } from './index.7118ec3c.js';

/* src/routes/about.svelte generated by Svelte v3.16.7 */

const file = "src/routes/about.svelte";

function create_fragment(ctx) {
	let t0;
	let section;
	let br0;
	let t1;
	let br1;
	let t2;
	let h1;
	let t3;
	let t4;
	let br2;
	let t5;
	let br3;
	let t6;
	let p0;
	let t7;
	let t8;
	let br4;
	let t9;
	let p1;
	let t10;
	let t11;
	let br5;
	let t12;
	let br6;
	let t13;
	let footer;
	let p2;
	let t14;
	let t15;

	const block = {
		c: function create() {
			t0 = space();
			section = element("section");
			br0 = element("br");
			t1 = space();
			br1 = element("br");
			t2 = space();
			h1 = element("h1");
			t3 = text("About this project");
			t4 = space();
			br2 = element("br");
			t5 = space();
			br3 = element("br");
			t6 = space();
			p0 = element("p");
			t7 = text("This is the 'about' page. There's not much here. This is the 'about' page. There's not much here.");
			t8 = space();
			br4 = element("br");
			t9 = space();
			p1 = element("p");
			t10 = text("This is the 'about' page. There's not much here. This is the 'about' page. There's not much here.");
			t11 = space();
			br5 = element("br");
			t12 = space();
			br6 = element("br");
			t13 = space();
			footer = element("footer");
			p2 = element("p");
			t14 = text("© 2019 - ");
			t15 = text(/*currYear*/ ctx[0]);
			this.h();
		},
		l: function claim(nodes) {
			t0 = claim_space(nodes);
			section = claim_element(nodes, "SECTION", { class: true });
			var section_nodes = children(section);
			br0 = claim_element(section_nodes, "BR", {});
			t1 = claim_space(section_nodes);
			br1 = claim_element(section_nodes, "BR", {});
			t2 = claim_space(section_nodes);
			h1 = claim_element(section_nodes, "H1", { class: true });
			var h1_nodes = children(h1);
			t3 = claim_text(h1_nodes, "About this project");
			h1_nodes.forEach(detach_dev);
			t4 = claim_space(section_nodes);
			br2 = claim_element(section_nodes, "BR", {});
			t5 = claim_space(section_nodes);
			br3 = claim_element(section_nodes, "BR", {});
			t6 = claim_space(section_nodes);
			p0 = claim_element(section_nodes, "P", { class: true });
			var p0_nodes = children(p0);
			t7 = claim_text(p0_nodes, "This is the 'about' page. There's not much here. This is the 'about' page. There's not much here.");
			p0_nodes.forEach(detach_dev);
			t8 = claim_space(section_nodes);
			br4 = claim_element(section_nodes, "BR", {});
			t9 = claim_space(section_nodes);
			p1 = claim_element(section_nodes, "P", { class: true });
			var p1_nodes = children(p1);
			t10 = claim_text(p1_nodes, "This is the 'about' page. There's not much here. This is the 'about' page. There's not much here.");
			p1_nodes.forEach(detach_dev);
			t11 = claim_space(section_nodes);
			br5 = claim_element(section_nodes, "BR", {});
			t12 = claim_space(section_nodes);
			br6 = claim_element(section_nodes, "BR", {});
			section_nodes.forEach(detach_dev);
			t13 = claim_space(nodes);
			footer = claim_element(nodes, "FOOTER", { class: true });
			var footer_nodes = children(footer);
			p2 = claim_element(footer_nodes, "P", { class: true });
			var p2_nodes = children(p2);
			t14 = claim_text(p2_nodes, "© 2019 - ");
			t15 = claim_text(p2_nodes, /*currYear*/ ctx[0]);
			p2_nodes.forEach(detach_dev);
			footer_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			document.title = "Charitify - Charity page and donate.";
			add_location(br0, file, 28, 1, 349);
			add_location(br1, file, 29, 1, 355);
			attr_dev(h1, "class", "svelte-9pd9lc");
			add_location(h1, file, 31, 1, 362);
			add_location(br2, file, 33, 1, 392);
			add_location(br3, file, 34, 1, 398);
			attr_dev(p0, "class", "svelte-9pd9lc");
			add_location(p0, file, 36, 1, 405);
			add_location(br4, file, 38, 1, 512);
			attr_dev(p1, "class", "svelte-9pd9lc");
			add_location(p1, file, 40, 1, 519);
			add_location(br5, file, 42, 1, 626);
			add_location(br6, file, 43, 1, 632);
			attr_dev(section, "class", "svelte-9pd9lc");
			add_location(section, file, 27, 0, 338);
			attr_dev(p2, "class", "svelte-9pd9lc");
			add_location(p2, file, 47, 1, 659);
			attr_dev(footer, "class", "svelte-9pd9lc");
			add_location(footer, file, 46, 0, 649);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, section, anchor);
			append_dev(section, br0);
			append_dev(section, t1);
			append_dev(section, br1);
			append_dev(section, t2);
			append_dev(section, h1);
			append_dev(h1, t3);
			append_dev(section, t4);
			append_dev(section, br2);
			append_dev(section, t5);
			append_dev(section, br3);
			append_dev(section, t6);
			append_dev(section, p0);
			append_dev(p0, t7);
			append_dev(section, t8);
			append_dev(section, br4);
			append_dev(section, t9);
			append_dev(section, p1);
			append_dev(p1, t10);
			append_dev(section, t11);
			append_dev(section, br5);
			append_dev(section, t12);
			append_dev(section, br6);
			insert_dev(target, t13, anchor);
			insert_dev(target, footer, anchor);
			append_dev(footer, p2);
			append_dev(p2, t14);
			append_dev(p2, t15);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(section);
			if (detaching) detach_dev(t13);
			if (detaching) detach_dev(footer);
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

function instance($$self) {
	let currYear = new Date().getFullYear();

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ("currYear" in $$props) $$invalidate(0, currYear = $$props.currYear);
	};

	return [currYear];
}

class About extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "About",
			options,
			id: create_fragment.name
		});
	}
}

export default About;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJvdXQuZDI2NjAxMzMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb3V0ZXMvYWJvdXQuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG5cdGxldCBjdXJyWWVhciA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKVxuPC9zY3JpcHQ+XG5cbjxzdmVsdGU6aGVhZD5cblx0PHRpdGxlPkNoYXJpdGlmeSAtIENoYXJpdHkgcGFnZSBhbmQgZG9uYXRlLjwvdGl0bGU+XG48L3N2ZWx0ZTpoZWFkPlxuXG48c3R5bGU+XG5cdHNlY3Rpb24ge1xuXHRcdGZsZXgtZ3JvdzogMTtcblx0XHRwYWRkaW5nOiB2YXIoLS1zY3JlZW4tcGFkZGluZyk7XG5cdH1cblxuXHRoMSB7XG5cdFx0dGV4dC1hbGlnbjogY2VudGVyO1xuXHR9XG5cblx0cCB7XG5cdFx0dGV4dC1hbGlnbjoganVzdGlmeTtcblx0fVxuXG5cdGZvb3RlciB7XG5cdFx0cGFkZGluZzogdmFyKC0tc2NyZWVuLXBhZGRpbmcpO1xuXHR9XG48L3N0eWxlPlxuXG48c2VjdGlvbj5cblx0PGJyPlxuXHQ8YnI+XG5cblx0PGgxPkFib3V0IHRoaXMgcHJvamVjdDwvaDE+XG5cblx0PGJyPlxuXHQ8YnI+XG5cblx0PHA+VGhpcyBpcyB0aGUgJ2Fib3V0JyBwYWdlLiBUaGVyZSdzIG5vdCBtdWNoIGhlcmUuIFRoaXMgaXMgdGhlICdhYm91dCcgcGFnZS4gVGhlcmUncyBub3QgbXVjaCBoZXJlLjwvcD5cblxuXHQ8YnI+XG5cblx0PHA+VGhpcyBpcyB0aGUgJ2Fib3V0JyBwYWdlLiBUaGVyZSdzIG5vdCBtdWNoIGhlcmUuIFRoaXMgaXMgdGhlICdhYm91dCcgcGFnZS4gVGhlcmUncyBub3QgbXVjaCBoZXJlLjwvcD5cblxuXHQ8YnI+XG5cdDxicj5cbjwvc2VjdGlvbj5cblxuPGZvb3Rlcj5cblx0PHA+wqkgMjAxOSAtIHtjdXJyWWVhcn08L3A+XG48L2Zvb3Rlcj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzJCQStDYyxHQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7MkNBQVIsR0FBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBOUNqQixRQUFRLE9BQU8sSUFBSSxHQUFHLFdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9
