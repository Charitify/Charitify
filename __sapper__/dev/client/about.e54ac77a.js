import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, A as space, q as element, P as text, C as claim_space, c as claim_element, f as children, Q as claim_text, g as detach_dev, j as add_location, h as attr_dev, k as insert_dev, l as append_dev, m as noop } from './index.b9336edf.js';

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
			this.h();
		},
		h: function hydrate() {
			document.title = "Charitify - Charity page and donate.";
			add_location(br0, file, 20, 1, 239);
			add_location(br1, file, 21, 1, 245);
			attr_dev(h1, "class", "svelte-mjtjke");
			add_location(h1, file, 23, 1, 252);
			add_location(br2, file, 25, 1, 282);
			add_location(br3, file, 26, 1, 288);
			attr_dev(p0, "class", "svelte-mjtjke");
			add_location(p0, file, 28, 1, 295);
			add_location(br4, file, 30, 1, 402);
			attr_dev(p1, "class", "svelte-mjtjke");
			add_location(p1, file, 32, 1, 409);
			add_location(br5, file, 34, 1, 516);
			add_location(br6, file, 35, 1, 522);
			attr_dev(section, "class", "svelte-mjtjke");
			add_location(section, file, 19, 0, 228);
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
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(section);
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

class About extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "About",
			options,
			id: create_fragment.name
		});
	}
}

export default About;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJvdXQuZTU0YWM3N2EuanMiLCJzb3VyY2VzIjpbXSwic291cmNlc0NvbnRlbnQiOltdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9
