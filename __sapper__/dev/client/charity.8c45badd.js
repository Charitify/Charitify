import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, r as space, e as element, q as create_component, v as claim_space, c as claim_element, a as children, u as claim_component, f as detach_dev, g as add_location, h as attr_dev, j as insert_dev, k as append_dev, w as mount_component, n as noop, y as transition_in, _ as add_render_callback, $ as create_in_transition, z as transition_out, a0 as create_out_transition, A as destroy_component } from './index.49625391.js';
import { T as TitleSubTitle, C as Carousel, D as DonatingGroup, P as Progress, A as AvatarAndName, R as Rate } from './index.c47b4ad7.js';
import { r as receive, s as send } from './index.56733e10.js';

/* src/routes/charity.svelte generated by Svelte v3.16.7 */
const file = "src/routes/charity.svelte";

function create_fragment(ctx) {
	let t0;
	let main;
	let section2;
	let br0;
	let t1;
	let t2;
	let br1;
	let t3;
	let section0;
	let div;
	let div_intro;
	let div_outro;
	let t4;
	let t5;
	let t6;
	let section1;
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
			main = element("main");
			section2 = element("section");
			br0 = element("br");
			t1 = space();
			create_component(titlesubtitle.$$.fragment);
			t2 = space();
			br1 = element("br");
			t3 = space();
			section0 = element("section");
			div = element("div");
			create_component(carousel.$$.fragment);
			t4 = space();
			create_component(donatinggroup.$$.fragment);
			t5 = space();
			create_component(progress.$$.fragment);
			t6 = space();
			section1 = element("section");
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
			main = claim_element(nodes, "MAIN", { class: true });
			var main_nodes = children(main);
			section2 = claim_element(main_nodes, "SECTION", { class: true });
			var section2_nodes = children(section2);
			br0 = claim_element(section2_nodes, "BR", {});
			t1 = claim_space(section2_nodes);
			claim_component(titlesubtitle.$$.fragment, section2_nodes);
			t2 = claim_space(section2_nodes);
			br1 = claim_element(section2_nodes, "BR", {});
			t3 = claim_space(section2_nodes);
			section0 = claim_element(section2_nodes, "SECTION", { class: true });
			var section0_nodes = children(section0);
			div = claim_element(section0_nodes, "DIV", { class: true });
			var div_nodes = children(div);
			claim_component(carousel.$$.fragment, div_nodes);
			div_nodes.forEach(detach_dev);
			t4 = claim_space(section0_nodes);
			claim_component(donatinggroup.$$.fragment, section0_nodes);
			section0_nodes.forEach(detach_dev);
			t5 = claim_space(section2_nodes);
			claim_component(progress.$$.fragment, section2_nodes);
			t6 = claim_space(section2_nodes);
			section1 = claim_element(section2_nodes, "SECTION", { class: true });
			var section1_nodes = children(section1);
			claim_component(avatarandname.$$.fragment, section1_nodes);
			t7 = claim_space(section1_nodes);
			claim_component(rate.$$.fragment, section1_nodes);
			section1_nodes.forEach(detach_dev);
			section2_nodes.forEach(detach_dev);
			t8 = claim_space(main_nodes);
			br2 = claim_element(main_nodes, "BR", {});
			t9 = claim_space(main_nodes);
			br3 = claim_element(main_nodes, "BR", {});
			t10 = claim_space(main_nodes);
			br4 = claim_element(main_nodes, "BR", {});
			main_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			document.title = "Charitify - Charity page and donate.";
			add_location(br0, file, 39, 8, 938);
			add_location(br1, file, 41, 8, 976);
			attr_dev(div, "class", "pics-wrap svelte-uz5elz");
			add_location(div, file, 44, 12, 1024);
			attr_dev(section0, "class", "top svelte-uz5elz");
			add_location(section0, file, 43, 8, 990);
			attr_dev(section1, "class", "rate-section svelte-uz5elz");
			add_location(section1, file, 53, 8, 1260);
			attr_dev(section2, "class", "container");
			add_location(section2, file, 37, 4, 901);
			add_location(br2, file, 64, 4, 1551);
			add_location(br3, file, 65, 4, 1560);
			add_location(br4, file, 66, 4, 1569);
			attr_dev(main, "class", "page");
			add_location(main, file, 36, 0, 877);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, main, anchor);
			append_dev(main, section2);
			append_dev(section2, br0);
			append_dev(section2, t1);
			mount_component(titlesubtitle, section2, null);
			append_dev(section2, t2);
			append_dev(section2, br1);
			append_dev(section2, t3);
			append_dev(section2, section0);
			append_dev(section0, div);
			mount_component(carousel, div, null);
			append_dev(section0, t4);
			mount_component(donatinggroup, section0, null);
			append_dev(section2, t5);
			mount_component(progress, section2, null);
			append_dev(section2, t6);
			append_dev(section2, section1);
			mount_component(avatarandname, section1, null);
			append_dev(section1, t7);
			mount_component(rate, section1, null);
			append_dev(main, t8);
			append_dev(main, br2);
			append_dev(main, t9);
			append_dev(main, br3);
			append_dev(main, t10);
			append_dev(main, br4);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(titlesubtitle.$$.fragment, local);
			transition_in(carousel.$$.fragment, local);

			add_render_callback(() => {
				if (div_outro) div_outro.end(1);
				if (!div_intro) div_intro = create_in_transition(div, receive, { key: "pictures" });
				div_intro.start();
			});

			transition_in(donatinggroup.$$.fragment, local);
			transition_in(progress.$$.fragment, local);
			transition_in(avatarandname.$$.fragment, local);
			transition_in(rate.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(titlesubtitle.$$.fragment, local);
			transition_out(carousel.$$.fragment, local);
			if (div_intro) div_intro.invalidate();
			div_outro = create_out_transition(div, send, { key: "pictures" });
			transition_out(donatinggroup.$$.fragment, local);
			transition_out(progress.$$.fragment, local);
			transition_out(avatarandname.$$.fragment, local);
			transition_out(rate.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(main);
			destroy_component(titlesubtitle);
			destroy_component(carousel);
			if (detaching && div_outro) div_outro.end();
			destroy_component(donatinggroup);
			destroy_component(progress);
			destroy_component(avatarandname);
			destroy_component(rate);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcml0eS44YzQ1YmFkZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3JvdXRlcy9jaGFyaXR5LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICAgIGltcG9ydCB7IFN3aXBlLCBTd2lwZUl0ZW0gfSBmcm9tICcuLi9wbHVnaW5zJ1xuICAgIGltcG9ydCB7IFRpdGxlU3ViVGl0bGUsIEF2YXRhckFuZE5hbWUsIENhcm91c2VsLCBEb25hdGluZ0dyb3VwIH0gZnJvbSAnLi4vbGF5b3V0cydcbiAgICBpbXBvcnQgeyBSYXRlLCBQcm9ncmVzcyB9IGZyb20gJy4uL2NvbXBvbmVudHMnXG4gICAgaW1wb3J0IHsgc2VuZCwgcmVjZWl2ZSB9IGZyb20gJy4uL3NoYXJlZCc7XG48L3NjcmlwdD5cblxuPHN2ZWx0ZTpoZWFkPlxuICAgIDx0aXRsZT5DaGFyaXRpZnkgLSBDaGFyaXR5IHBhZ2UgYW5kIGRvbmF0ZS48L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPHN0eWxlPlxuICAgIC50b3Age1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBtYXJnaW4tYm90dG9tOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDEuNSk7XG4gICAgICAgIG1hcmdpbi10b3A6IHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICAucGljcy13cmFwIHtcbiAgICAgICAgei1pbmRleDogMDtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAycHg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLnJhdGUtc2VjdGlvbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LWVuZDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBwYWRkaW5nOiAxMnB4IDA7XG4gICAgfVxuPC9zdHlsZT5cblxuPG1haW4gY2xhc3M9XCJwYWdlXCI+XG4gICAgPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXJcIj5cblxuICAgICAgICA8YnI+XG4gICAgICAgIDxUaXRsZVN1YlRpdGxlLz5cbiAgICAgICAgPGJyPlxuXG4gICAgICAgIDxzZWN0aW9uIGNsYXNzPVwidG9wXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGljcy13cmFwXCIgb3V0OnNlbmQ9XCJ7e2tleTogJ3BpY3R1cmVzJ319XCIgaW46cmVjZWl2ZT1cInt7a2V5OiAncGljdHVyZXMnfX1cIj5cbiAgICAgICAgICAgICAgICA8Q2Fyb3VzZWwvPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxEb25hdGluZ0dyb3VwLz5cbiAgICAgICAgPC9zZWN0aW9uPlxuXG4gICAgICAgIDxQcm9ncmVzcyB2YWx1ZT1cIjY1XCIgc2l6ZT1cImJpZ1wiLz5cblxuICAgICAgICA8c2VjdGlvbiBjbGFzcz1cInJhdGUtc2VjdGlvblwiPlxuICAgICAgICAgICAgPEF2YXRhckFuZE5hbWVcbiAgICAgICAgICAgICAgICAgICAgc3JjPVwiaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGVcIlxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlRpbmEgS2FuZGVsYWtpXCJcbiAgICAgICAgICAgICAgICAgICAgc3ViVGl0bGU9XCJPUkcgY2hhcml0eSBjaGFyaXRpZnlcIlxuICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgPFJhdGUvPlxuICAgICAgICA8L3NlY3Rpb24+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPGJyPlxuICAgIDxicj5cbiAgICA8YnI+XG5cbjwvbWFpbj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxRUE0Q2dGLEdBQUcsRUFBRSxVQUFVOzs7Ozs7Ozs7Ozs7OztrREFBaEQsR0FBRyxFQUFFLFVBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9
