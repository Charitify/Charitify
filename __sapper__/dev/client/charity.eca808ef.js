import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, r as space, e as element, q as create_component, v as claim_space, c as claim_element, a as children, u as claim_component, f as detach_dev, g as add_location, h as attr_dev, j as insert_dev, k as append_dev, w as mount_component, n as noop, y as transition_in, z as transition_out, A as destroy_component } from './index.1a51fa42.js';
import { T as TitleSubTitle, C as Carousel, D as DonatingGroup, P as Progress, A as AvatarAndName, R as Rate } from './index.ed23f7a8.js';

/* src/routes/charity.svelte generated by Svelte v3.16.7 */
const file = "src/routes/charity.svelte";

function create_fragment(ctx) {
	let t0;
	let section3;
	let section0;
	let br0;
	let t1;
	let t2;
	let br1;
	let t3;
	let section1;
	let div;
	let t4;
	let t5;
	let t6;
	let section2;
	let t7;
	let t8;
	let br2;
	let t9;
	let br3;
	let t10;
	let br4;
	let current;
	const titlesubtitle = new TitleSubTitle({ $$inline: true });
	const carousel = new Carousel({ $$inline: true });
	const donatinggroup = new DonatingGroup({ $$inline: true });

	const progress = new Progress({
			props: { value: "65", size: "big" },
			$$inline: true
		});

	const avatarandname = new AvatarAndName({
			props: {
				src: "https://placeimg.com/300/300/people",
				title: "Tina Kandelaki",
				subTitle: "ORG charity charitify"
			},
			$$inline: true
		});

	const rate = new Rate({ $$inline: true });

	const block = {
		c: function create() {
			t0 = space();
			section3 = element("section");
			section0 = element("section");
			br0 = element("br");
			t1 = space();
			create_component(titlesubtitle.$$.fragment);
			t2 = space();
			br1 = element("br");
			t3 = space();
			section1 = element("section");
			div = element("div");
			create_component(carousel.$$.fragment);
			t4 = space();
			create_component(donatinggroup.$$.fragment);
			t5 = space();
			create_component(progress.$$.fragment);
			t6 = space();
			section2 = element("section");
			create_component(avatarandname.$$.fragment);
			t7 = space();
			create_component(rate.$$.fragment);
			t8 = space();
			br2 = element("br");
			t9 = space();
			br3 = element("br");
			t10 = space();
			br4 = element("br");
			this.h();
		},
		l: function claim(nodes) {
			t0 = claim_space(nodes);
			section3 = claim_element(nodes, "SECTION", { class: true });
			var section3_nodes = children(section3);
			section0 = claim_element(section3_nodes, "SECTION", { class: true });
			var section0_nodes = children(section0);
			br0 = claim_element(section0_nodes, "BR", {});
			t1 = claim_space(section0_nodes);
			claim_component(titlesubtitle.$$.fragment, section0_nodes);
			t2 = claim_space(section0_nodes);
			br1 = claim_element(section0_nodes, "BR", {});
			section0_nodes.forEach(detach_dev);
			t3 = claim_space(section3_nodes);
			section1 = claim_element(section3_nodes, "SECTION", { class: true });
			var section1_nodes = children(section1);
			div = claim_element(section1_nodes, "DIV", { class: true });
			var div_nodes = children(div);
			claim_component(carousel.$$.fragment, div_nodes);
			div_nodes.forEach(detach_dev);
			t4 = claim_space(section1_nodes);
			claim_component(donatinggroup.$$.fragment, section1_nodes);
			section1_nodes.forEach(detach_dev);
			t5 = claim_space(section3_nodes);
			claim_component(progress.$$.fragment, section3_nodes);
			t6 = claim_space(section3_nodes);
			section2 = claim_element(section3_nodes, "SECTION", { class: true });
			var section2_nodes = children(section2);
			claim_component(avatarandname.$$.fragment, section2_nodes);
			t7 = claim_space(section2_nodes);
			claim_component(rate.$$.fragment, section2_nodes);
			section2_nodes.forEach(detach_dev);
			section3_nodes.forEach(detach_dev);
			t8 = claim_space(nodes);
			br2 = claim_element(nodes, "BR", {});
			t9 = claim_space(nodes);
			br3 = claim_element(nodes, "BR", {});
			t10 = claim_space(nodes);
			br4 = claim_element(nodes, "BR", {});
			this.h();
		},
		h: function hydrate() {
			document.title = "Charitify - Charity page and donate.";
			add_location(br0, file, 55, 2, 989);
			add_location(br1, file, 57, 2, 1015);
			attr_dev(section0, "class", "title-wrap svelte-1nxg3k7");
			add_location(section0, file, 54, 1, 958);
			attr_dev(div, "class", "pics-wrap svelte-1nxg3k7");
			add_location(div, file, 61, 2, 1058);
			attr_dev(section1, "class", "top svelte-1nxg3k7");
			add_location(section1, file, 60, 1, 1034);
			attr_dev(section2, "class", "rate-section svelte-1nxg3k7");
			add_location(section2, file, 70, 1, 1176);
			attr_dev(section3, "class", "container");
			add_location(section3, file, 52, 0, 928);
			add_location(br2, file, 81, 0, 1374);
			add_location(br3, file, 82, 0, 1379);
			add_location(br4, file, 83, 0, 1384);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, section3, anchor);
			append_dev(section3, section0);
			append_dev(section0, br0);
			append_dev(section0, t1);
			mount_component(titlesubtitle, section0, null);
			append_dev(section0, t2);
			append_dev(section0, br1);
			append_dev(section3, t3);
			append_dev(section3, section1);
			append_dev(section1, div);
			mount_component(carousel, div, null);
			append_dev(section1, t4);
			mount_component(donatinggroup, section1, null);
			append_dev(section3, t5);
			mount_component(progress, section3, null);
			append_dev(section3, t6);
			append_dev(section3, section2);
			mount_component(avatarandname, section2, null);
			append_dev(section2, t7);
			mount_component(rate, section2, null);
			insert_dev(target, t8, anchor);
			insert_dev(target, br2, anchor);
			insert_dev(target, t9, anchor);
			insert_dev(target, br3, anchor);
			insert_dev(target, t10, anchor);
			insert_dev(target, br4, anchor);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(titlesubtitle.$$.fragment, local);
			transition_in(carousel.$$.fragment, local);
			transition_in(donatinggroup.$$.fragment, local);
			transition_in(progress.$$.fragment, local);
			transition_in(avatarandname.$$.fragment, local);
			transition_in(rate.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(titlesubtitle.$$.fragment, local);
			transition_out(carousel.$$.fragment, local);
			transition_out(donatinggroup.$$.fragment, local);
			transition_out(progress.$$.fragment, local);
			transition_out(avatarandname.$$.fragment, local);
			transition_out(rate.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(section3);
			destroy_component(titlesubtitle);
			destroy_component(carousel);
			destroy_component(donatinggroup);
			destroy_component(progress);
			destroy_component(avatarandname);
			destroy_component(rate);
			if (detaching) detach_dev(t8);
			if (detaching) detach_dev(br2);
			if (detaching) detach_dev(t9);
			if (detaching) detach_dev(br3);
			if (detaching) detach_dev(t10);
			if (detaching) detach_dev(br4);
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

class Charity extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Charity",
			options,
			id: create_fragment.name
		});
	}
}

export default Charity;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcml0eS5lY2E4MDhlZi5qcyIsInNvdXJjZXMiOltdLCJzb3VyY2VzQ29udGVudCI6W10sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9
