import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, r as space, e as element, q as create_component, v as claim_space, c as claim_element, a as children, u as claim_component, f as detach_dev, g as add_location, h as attr_dev, j as insert_dev, k as append_dev, w as mount_component, n as noop, y as transition_in, z as transition_out, A as destroy_component } from './index.1a51fa42.js';
import { b as ContentHolder } from './index.0e0bf6df.js';

/* src/routes/about.svelte generated by Svelte v3.16.7 */
const file = "src/routes/about.svelte";

function create_fragment(ctx) {
	let t0;
	let section;
	let br0;
	let t1;
	let br1;
	let t2;
	let t3;
	let br2;
	let t4;
	let br3;
	let current;
	const contentholder = new ContentHolder({ $$inline: true });

	const block = {
		c: function create() {
			t0 = space();
			section = element("section");
			br0 = element("br");
			t1 = space();
			br1 = element("br");
			t2 = space();
			create_component(contentholder.$$.fragment);
			t3 = space();
			br2 = element("br");
			t4 = space();
			br3 = element("br");
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
			claim_component(contentholder.$$.fragment, section_nodes);
			t3 = claim_space(section_nodes);
			br2 = claim_element(section_nodes, "BR", {});
			t4 = claim_space(section_nodes);
			br3 = claim_element(section_nodes, "BR", {});
			section_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			document.title = "Charitify - Charity page and donate.";
			add_location(br0, file, 17, 1, 263);
			add_location(br1, file, 18, 1, 269);
			add_location(br2, file, 20, 1, 293);
			add_location(br3, file, 21, 1, 299);
			attr_dev(section, "class", "svelte-1rbc8m3");
			add_location(section, file, 16, 0, 252);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, section, anchor);
			append_dev(section, br0);
			append_dev(section, t1);
			append_dev(section, br1);
			append_dev(section, t2);
			mount_component(contentholder, section, null);
			append_dev(section, t3);
			append_dev(section, br2);
			append_dev(section, t4);
			append_dev(section, br3);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(contentholder.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(contentholder.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(section);
			destroy_component(contentholder);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJvdXQuYWI0NWZhNTYuanMiLCJzb3VyY2VzIjpbXSwic291cmNlc0NvbnRlbnQiOltdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9
