import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, T as TitleSubTitle, C as Carousel, G as DonatingGroup, P as Progress, H as AvatarAndName, R as Rate, b as CharityCards, F as Footer, I as onMount, e as space, f as element, g as create_component, q as query_selector_all, h as detach_dev, j as claim_space, k as claim_element, l as children, m as claim_component, p as add_location, o as attr_dev, r as insert_dev, v as append_dev, u as mount_component, w as transition_in, x as transition_out, y as destroy_component } from './client.035fe636.js';
import { a as api } from './index.6d21535d.js';

/* src/routes/organization.svelte generated by Svelte v3.18.1 */
const file = "src/routes/organization.svelte";

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
	let div0;
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
	let t11;
	let div1;
	let t12;
	let br5;
	let t13;
	let br6;
	let t14;
	let br7;
	let t15;
	let br8;
	let t16;
	let br9;
	let t17;
	let div2;
	let t18;
	let br10;
	let t19;
	let br11;
	let t20;
	let br12;
	let t21;
	let br13;
	let t22;
	let br14;
	let t23;
	let current;

	const titlesubtitle = new TitleSubTitle({
			props: {
				title: /*organization*/ ctx[0].title,
				subtitle: /*organization*/ ctx[0].description
			},
			$$inline: true
		});

	const carousel_1 = new Carousel({
			props: { items: /*carousel*/ ctx[1] },
			$$inline: true
		});

	const donatinggroup = new DonatingGroup({ $$inline: true });

	const progress = new Progress({
			props: { value: "65", size: "big" },
			$$inline: true
		});

	const avatarandname = new AvatarAndName({
			props: {
				src: /*organization*/ ctx[0].orgHeadSrc,
				title: /*organization*/ ctx[0].orgHead,
				subtitle: /*organization*/ ctx[0].title
			},
			$$inline: true
		});

	const rate = new Rate({ $$inline: true });
	const charitycards0 = new CharityCards({ $$inline: true });
	const charitycards1 = new CharityCards({ $$inline: true });
	const footer = new Footer({ $$inline: true });

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
			div0 = element("div");
			create_component(carousel_1.$$.fragment);
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
			t11 = space();
			div1 = element("div");
			create_component(charitycards0.$$.fragment);
			t12 = space();
			br5 = element("br");
			t13 = space();
			br6 = element("br");
			t14 = space();
			br7 = element("br");
			t15 = space();
			br8 = element("br");
			t16 = space();
			br9 = element("br");
			t17 = space();
			div2 = element("div");
			create_component(charitycards1.$$.fragment);
			t18 = space();
			br10 = element("br");
			t19 = space();
			br11 = element("br");
			t20 = space();
			br12 = element("br");
			t21 = space();
			br13 = element("br");
			t22 = space();
			br14 = element("br");
			t23 = space();
			create_component(footer.$$.fragment);
			this.h();
		},
		l: function claim(nodes) {
			const head_nodes = query_selector_all("[data-svelte=\"svelte-1oiy4zf\"]", document.head);
			head_nodes.forEach(detach_dev);
			t0 = claim_space(nodes);
			section3 = claim_element(nodes, "SECTION", { class: true });
			var section3_nodes = children(section3);
			section0 = claim_element(section3_nodes, "SECTION", {});
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
			div0 = claim_element(section1_nodes, "DIV", { class: true });
			var div0_nodes = children(div0);
			claim_component(carousel_1.$$.fragment, div0_nodes);
			div0_nodes.forEach(detach_dev);
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
			t11 = claim_space(nodes);
			div1 = claim_element(nodes, "DIV", { class: true });
			var div1_nodes = children(div1);
			claim_component(charitycards0.$$.fragment, div1_nodes);
			div1_nodes.forEach(detach_dev);
			t12 = claim_space(nodes);
			br5 = claim_element(nodes, "BR", {});
			t13 = claim_space(nodes);
			br6 = claim_element(nodes, "BR", {});
			t14 = claim_space(nodes);
			br7 = claim_element(nodes, "BR", {});
			t15 = claim_space(nodes);
			br8 = claim_element(nodes, "BR", {});
			t16 = claim_space(nodes);
			br9 = claim_element(nodes, "BR", {});
			t17 = claim_space(nodes);
			div2 = claim_element(nodes, "DIV", { class: true });
			var div2_nodes = children(div2);
			claim_component(charitycards1.$$.fragment, div2_nodes);
			div2_nodes.forEach(detach_dev);
			t18 = claim_space(nodes);
			br10 = claim_element(nodes, "BR", {});
			t19 = claim_space(nodes);
			br11 = claim_element(nodes, "BR", {});
			t20 = claim_space(nodes);
			br12 = claim_element(nodes, "BR", {});
			t21 = claim_space(nodes);
			br13 = claim_element(nodes, "BR", {});
			t22 = claim_space(nodes);
			br14 = claim_element(nodes, "BR", {});
			t23 = claim_space(nodes);
			claim_component(footer.$$.fragment, nodes);
			this.h();
		},
		h: function hydrate() {
			document.title = "Charitify - Organization page.";
			add_location(br0, file, 48, 8, 1197);
			add_location(br1, file, 53, 8, 1331);
			add_location(section0, file, 47, 4, 1179);
			attr_dev(div0, "class", "pics-wrap svelte-uz5elz");
			add_location(div0, file, 57, 8, 1386);
			attr_dev(section1, "class", "top svelte-uz5elz");
			add_location(section1, file, 56, 4, 1356);
			attr_dev(section2, "class", "rate-section svelte-uz5elz");
			add_location(section2, file, 66, 4, 1551);
			attr_dev(section3, "class", "container");
			add_location(section3, file, 45, 0, 1146);
			add_location(br2, file, 77, 0, 1797);
			add_location(br3, file, 78, 0, 1802);
			add_location(br4, file, 79, 0, 1807);
			attr_dev(div1, "class", "container");
			add_location(div1, file, 81, 0, 1813);
			add_location(br5, file, 85, 0, 1865);
			add_location(br6, file, 86, 0, 1870);
			add_location(br7, file, 87, 0, 1875);
			add_location(br8, file, 88, 0, 1880);
			add_location(br9, file, 89, 0, 1885);
			attr_dev(div2, "class", "container");
			add_location(div2, file, 91, 0, 1891);
			add_location(br10, file, 95, 0, 1943);
			add_location(br11, file, 96, 0, 1948);
			add_location(br12, file, 97, 0, 1953);
			add_location(br13, file, 98, 0, 1958);
			add_location(br14, file, 99, 0, 1963);
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
			append_dev(section1, div0);
			mount_component(carousel_1, div0, null);
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
			insert_dev(target, t11, anchor);
			insert_dev(target, div1, anchor);
			mount_component(charitycards0, div1, null);
			insert_dev(target, t12, anchor);
			insert_dev(target, br5, anchor);
			insert_dev(target, t13, anchor);
			insert_dev(target, br6, anchor);
			insert_dev(target, t14, anchor);
			insert_dev(target, br7, anchor);
			insert_dev(target, t15, anchor);
			insert_dev(target, br8, anchor);
			insert_dev(target, t16, anchor);
			insert_dev(target, br9, anchor);
			insert_dev(target, t17, anchor);
			insert_dev(target, div2, anchor);
			mount_component(charitycards1, div2, null);
			insert_dev(target, t18, anchor);
			insert_dev(target, br10, anchor);
			insert_dev(target, t19, anchor);
			insert_dev(target, br11, anchor);
			insert_dev(target, t20, anchor);
			insert_dev(target, br12, anchor);
			insert_dev(target, t21, anchor);
			insert_dev(target, br13, anchor);
			insert_dev(target, t22, anchor);
			insert_dev(target, br14, anchor);
			insert_dev(target, t23, anchor);
			mount_component(footer, target, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const titlesubtitle_changes = {};
			if (dirty & /*organization*/ 1) titlesubtitle_changes.title = /*organization*/ ctx[0].title;
			if (dirty & /*organization*/ 1) titlesubtitle_changes.subtitle = /*organization*/ ctx[0].description;
			titlesubtitle.$set(titlesubtitle_changes);
			const carousel_1_changes = {};
			if (dirty & /*carousel*/ 2) carousel_1_changes.items = /*carousel*/ ctx[1];
			carousel_1.$set(carousel_1_changes);
			const avatarandname_changes = {};
			if (dirty & /*organization*/ 1) avatarandname_changes.src = /*organization*/ ctx[0].orgHeadSrc;
			if (dirty & /*organization*/ 1) avatarandname_changes.title = /*organization*/ ctx[0].orgHead;
			if (dirty & /*organization*/ 1) avatarandname_changes.subtitle = /*organization*/ ctx[0].title;
			avatarandname.$set(avatarandname_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(titlesubtitle.$$.fragment, local);
			transition_in(carousel_1.$$.fragment, local);
			transition_in(donatinggroup.$$.fragment, local);
			transition_in(progress.$$.fragment, local);
			transition_in(avatarandname.$$.fragment, local);
			transition_in(rate.$$.fragment, local);
			transition_in(charitycards0.$$.fragment, local);
			transition_in(charitycards1.$$.fragment, local);
			transition_in(footer.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(titlesubtitle.$$.fragment, local);
			transition_out(carousel_1.$$.fragment, local);
			transition_out(donatinggroup.$$.fragment, local);
			transition_out(progress.$$.fragment, local);
			transition_out(avatarandname.$$.fragment, local);
			transition_out(rate.$$.fragment, local);
			transition_out(charitycards0.$$.fragment, local);
			transition_out(charitycards1.$$.fragment, local);
			transition_out(footer.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(section3);
			destroy_component(titlesubtitle);
			destroy_component(carousel_1);
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
			if (detaching) detach_dev(t11);
			if (detaching) detach_dev(div1);
			destroy_component(charitycards0);
			if (detaching) detach_dev(t12);
			if (detaching) detach_dev(br5);
			if (detaching) detach_dev(t13);
			if (detaching) detach_dev(br6);
			if (detaching) detach_dev(t14);
			if (detaching) detach_dev(br7);
			if (detaching) detach_dev(t15);
			if (detaching) detach_dev(br8);
			if (detaching) detach_dev(t16);
			if (detaching) detach_dev(br9);
			if (detaching) detach_dev(t17);
			if (detaching) detach_dev(div2);
			destroy_component(charitycards1);
			if (detaching) detach_dev(t18);
			if (detaching) detach_dev(br10);
			if (detaching) detach_dev(t19);
			if (detaching) detach_dev(br11);
			if (detaching) detach_dev(t20);
			if (detaching) detach_dev(br12);
			if (detaching) detach_dev(t21);
			if (detaching) detach_dev(br13);
			if (detaching) detach_dev(t22);
			if (detaching) detach_dev(br14);
			if (detaching) detach_dev(t23);
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
	let organization = {};

	onMount(async () => {
		await new Promise(r => setTimeout(r, 2000));
		$$invalidate(0, organization = await api.getOrganization(1));
	});

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ("organization" in $$props) $$invalidate(0, organization = $$props.organization);
		if ("carousel" in $$props) $$invalidate(1, carousel = $$props.carousel);
	};

	let carousel;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*organization*/ 1) {
			 $$invalidate(1, carousel = (organization.src || []).map((src, i) => ({
				src,
				srcBig: (organization.src2x || [])[i]
			})));
		}
	};

	return [organization, carousel];
}

class Organization extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Organization",
			options,
			id: create_fragment.name
		});
	}
}

export default Organization;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnYW5pemF0aW9uLjA0YzRlYTY3LmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcm91dGVzL29yZ2FuaXphdGlvbi5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICAgIGltcG9ydCB7IGFwaSB9IGZyb20gJy4uL3NlcnZpY2VzJ1xuICAgIGltcG9ydCB7IFRpdGxlU3ViVGl0bGUsIEF2YXRhckFuZE5hbWUsIERvbmF0aW5nR3JvdXAsIENoYXJpdHlDYXJkcywgRm9vdGVyIH0gZnJvbSAnLi4vbGF5b3V0cydcbiAgICBpbXBvcnQgeyBSYXRlLCBQcm9ncmVzcywgQ2Fyb3VzZWwgfSBmcm9tICcuLi9jb21wb25lbnRzJ1xuXG4gICAgbGV0IG9yZ2FuaXphdGlvbiA9IHt9XG5cbiAgICAkOiBjYXJvdXNlbCA9IChvcmdhbml6YXRpb24uc3JjIHx8IFtdKS5tYXAoKHNyYywgaSkgPT4gKHsgc3JjLCBzcmNCaWc6IChvcmdhbml6YXRpb24uc3JjMnggfHwgW10pW2ldIH0pKVxuXG4gICAgb25Nb3VudChhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAyMDAwKSlcbiAgICAgICAgb3JnYW5pemF0aW9uID0gYXdhaXQgYXBpLmdldE9yZ2FuaXphdGlvbigxKVxuICAgIH0pXG48L3NjcmlwdD5cblxuPHN2ZWx0ZTpoZWFkPlxuICAgIDx0aXRsZT5DaGFyaXRpZnkgLSBPcmdhbml6YXRpb24gcGFnZS48L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPHN0eWxlPlxuICAgIC50b3Age1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBtYXJnaW4tYm90dG9tOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDEuNSk7XG4gICAgICAgIG1hcmdpbi10b3A6IHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICAucGljcy13cmFwIHtcbiAgICAgICAgei1pbmRleDogMDtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAycHg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLnJhdGUtc2VjdGlvbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LWVuZDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBwYWRkaW5nOiAxMnB4IDA7XG4gICAgfVxuPC9zdHlsZT5cblxuPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXJcIj5cblxuICAgIDxzZWN0aW9uPlxuICAgICAgICA8YnI+XG4gICAgICAgIDxUaXRsZVN1YlRpdGxlXG4gICAgICAgICAgICB0aXRsZT17b3JnYW5pemF0aW9uLnRpdGxlfVxuICAgICAgICAgICAgc3VidGl0bGU9e29yZ2FuaXphdGlvbi5kZXNjcmlwdGlvbn1cbiAgICAgICAgLz5cbiAgICAgICAgPGJyPlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxzZWN0aW9uIGNsYXNzPVwidG9wXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwaWNzLXdyYXBcIj5cbiAgICAgICAgICAgIDxDYXJvdXNlbCBpdGVtcz17Y2Fyb3VzZWx9Lz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPERvbmF0aW5nR3JvdXAvPlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxQcm9ncmVzcyB2YWx1ZT1cIjY1XCIgc2l6ZT1cImJpZ1wiLz5cblxuICAgIDxzZWN0aW9uIGNsYXNzPVwicmF0ZS1zZWN0aW9uXCI+XG4gICAgICAgIDxBdmF0YXJBbmROYW1lXG4gICAgICAgICAgICAgICAgc3JjPXtvcmdhbml6YXRpb24ub3JnSGVhZFNyY31cbiAgICAgICAgICAgICAgICB0aXRsZT17b3JnYW5pemF0aW9uLm9yZ0hlYWR9XG4gICAgICAgICAgICAgICAgc3VidGl0bGU9e29yZ2FuaXphdGlvbi50aXRsZX1cbiAgICAgICAgLz5cblxuICAgICAgICA8UmF0ZS8+XG4gICAgPC9zZWN0aW9uPlxuPC9zZWN0aW9uPlxuXG48YnI+XG48YnI+XG48YnI+XG5cbjxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICA8Q2hhcml0eUNhcmRzLz5cbjwvZGl2PlxuXG48YnI+XG48YnI+XG48YnI+XG48YnI+XG48YnI+XG5cbjxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICA8Q2hhcml0eUNhcmRzLz5cbjwvZGl2PlxuXG48YnI+XG48YnI+XG48YnI+XG48YnI+XG48YnI+XG5cbjxGb290ZXIvPlxuXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzRCQWtEbUIsR0FBWSxJQUFDLEtBQUs7K0JBQ2YsR0FBWSxJQUFDLFdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7MEJBaUJ6QixHQUFZLElBQUMsVUFBVTs0QkFDckIsR0FBWSxJQUFDLE9BQU87K0JBQ2pCLEdBQVksSUFBQyxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0ZBcEJ6QixHQUFZLElBQUMsS0FBSztxRkFDZixHQUFZLElBQUMsV0FBVzs7Ozs7O2dGQWlCekIsR0FBWSxJQUFDLFVBQVU7a0ZBQ3JCLEdBQVksSUFBQyxPQUFPO3FGQUNqQixHQUFZLElBQUMsS0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7S0FoRXBDLFlBQVk7O0NBSWhCLE9BQU87WUFDTyxPQUFPLENBQUMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSTtrQkFDekMsWUFBWSxTQUFTLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztvQkFKM0MsUUFBUSxJQUFJLFlBQVksQ0FBQyxHQUFHLFFBQVEsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQVEsR0FBRztJQUFFLE1BQU0sR0FBRyxZQUFZLENBQUMsS0FBSyxRQUFRLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsifQ==
