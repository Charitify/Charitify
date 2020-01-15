import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, B as assign, e as element, G as create_component, r as space, c as claim_element, a as children, H as claim_component, u as claim_space, f as detach_dev, h as attr_dev, g as add_location, j as insert_dev, I as mount_component, k as append_dev, P as get_spread_update, Y as get_spread_object, x as transition_in, y as transition_out, J as destroy_component, t as text, b as claim_text, V as set_style, R as check_outros, p as destroy_each, Q as group_outros } from './index.1e1e7223.js';
import { C as Carousel, D as DonatingGroup, b as Progress, A as AvatarAndName, R as Rate, T as TitleSubTitle, c as Divider, d as CharityCard } from './index.63efa8aa.js';

/* src/routes/list.svelte generated by Svelte v3.16.7 */

const file = "src/routes/list.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[2] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[2] = list[i];
	return child_ctx;
}

// (152:8) {#each cards as card}
function create_each_block_1(ctx) {
	let li;
	let t;
	let current;
	const charitycard_spread_levels = [/*card*/ ctx[2]];
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
			attr_dev(li, "class", "svelte-8mvppp");
			add_location(li, file, 152, 12, 3823);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			mount_component(charitycard, li, null);
			append_dev(li, t);
			current = true;
		},
		p: function update(ctx, dirty) {
			const charitycard_changes = (dirty & /*cards*/ 1)
			? get_spread_update(charitycard_spread_levels, [get_spread_object(/*card*/ ctx[2])])
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
		id: create_each_block_1.name,
		type: "each",
		source: "(152:8) {#each cards as card}",
		ctx
	});

	return block;
}

// (174:8) {#each cards as card}
function create_each_block(ctx) {
	let li;
	let t;
	let current;
	const charitycard_spread_levels = [/*card*/ ctx[2]];
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
			attr_dev(li, "class", "svelte-8mvppp");
			add_location(li, file, 174, 12, 4153);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			mount_component(charitycard, li, null);
			append_dev(li, t);
			current = true;
		},
		p: function update(ctx, dirty) {
			const charitycard_changes = (dirty & /*cards*/ 1)
			? get_spread_update(charitycard_spread_levels, [get_spread_object(/*card*/ ctx[2])])
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
		id: create_each_block.name,
		type: "each",
		source: "(174:8) {#each cards as card}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let t0;
	let section2;
	let section0;
	let div0;
	let t1;
	let t2;
	let t3;
	let section1;
	let t4;
	let t5;
	let br0;
	let t6;
	let br1;
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
	let h20;
	let t13;
	let t14;
	let t15;
	let br5;
	let t16;
	let ul0;
	let t17;
	let br6;
	let t18;
	let br7;
	let t19;
	let br8;
	let t20;
	let br9;
	let t21;
	let br10;
	let t22;
	let div2;
	let t23;
	let h21;
	let t24;
	let t25;
	let t26;
	let br11;
	let t27;
	let ul1;
	let t28;
	let br12;
	let t29;
	let br13;
	let t30;
	let br14;
	let t31;
	let br15;
	let current;

	const carousel = new Carousel({
			props: { images: /*images*/ ctx[1] },
			$$inline: true
		});

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
	const titlesubtitle = new TitleSubTitle({ $$inline: true });
	const divider0 = new Divider({ props: { size: "16" }, $$inline: true });
	const divider1 = new Divider({ props: { size: "20" }, $$inline: true });
	let each_value_1 = /*cards*/ ctx[0];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
		each_blocks_1[i] = null;
	});

	const divider2 = new Divider({ props: { size: "16" }, $$inline: true });
	const divider3 = new Divider({ props: { size: "20" }, $$inline: true });
	let each_value = /*cards*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const block = {
		c: function create() {
			t0 = space();
			section2 = element("section");
			section0 = element("section");
			div0 = element("div");
			create_component(carousel.$$.fragment);
			t1 = space();
			create_component(donatinggroup.$$.fragment);
			t2 = space();
			create_component(progress.$$.fragment);
			t3 = space();
			section1 = element("section");
			create_component(avatarandname.$$.fragment);
			t4 = space();
			create_component(rate.$$.fragment);
			t5 = space();
			br0 = element("br");
			t6 = space();
			br1 = element("br");
			t7 = space();
			create_component(titlesubtitle.$$.fragment);
			t8 = space();
			br2 = element("br");
			t9 = space();
			br3 = element("br");
			t10 = space();
			br4 = element("br");
			t11 = space();
			div1 = element("div");
			create_component(divider0.$$.fragment);
			t12 = space();
			h20 = element("h2");
			t13 = text("The nearest list:");
			t14 = space();
			create_component(divider1.$$.fragment);
			t15 = space();
			br5 = element("br");
			t16 = space();
			ul0 = element("ul");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t17 = space();
			br6 = element("br");
			t18 = space();
			br7 = element("br");
			t19 = space();
			br8 = element("br");
			t20 = space();
			br9 = element("br");
			t21 = space();
			br10 = element("br");
			t22 = space();
			div2 = element("div");
			create_component(divider2.$$.fragment);
			t23 = space();
			h21 = element("h2");
			t24 = text("The second list:");
			t25 = space();
			create_component(divider3.$$.fragment);
			t26 = space();
			br11 = element("br");
			t27 = space();
			ul1 = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t28 = space();
			br12 = element("br");
			t29 = space();
			br13 = element("br");
			t30 = space();
			br14 = element("br");
			t31 = space();
			br15 = element("br");
			this.h();
		},
		l: function claim(nodes) {
			t0 = claim_space(nodes);
			section2 = claim_element(nodes, "SECTION", { class: true });
			var section2_nodes = children(section2);
			section0 = claim_element(section2_nodes, "SECTION", { class: true });
			var section0_nodes = children(section0);
			div0 = claim_element(section0_nodes, "DIV", { class: true });
			var div0_nodes = children(div0);
			claim_component(carousel.$$.fragment, div0_nodes);
			div0_nodes.forEach(detach_dev);
			t1 = claim_space(section0_nodes);
			claim_component(donatinggroup.$$.fragment, section0_nodes);
			section0_nodes.forEach(detach_dev);
			t2 = claim_space(section2_nodes);
			claim_component(progress.$$.fragment, section2_nodes);
			t3 = claim_space(section2_nodes);
			section1 = claim_element(section2_nodes, "SECTION", { class: true });
			var section1_nodes = children(section1);
			claim_component(avatarandname.$$.fragment, section1_nodes);
			t4 = claim_space(section1_nodes);
			claim_component(rate.$$.fragment, section1_nodes);
			section1_nodes.forEach(detach_dev);
			t5 = claim_space(section2_nodes);
			br0 = claim_element(section2_nodes, "BR", {});
			t6 = claim_space(section2_nodes);
			br1 = claim_element(section2_nodes, "BR", {});
			t7 = claim_space(section2_nodes);
			claim_component(titlesubtitle.$$.fragment, section2_nodes);
			section2_nodes.forEach(detach_dev);
			t8 = claim_space(nodes);
			br2 = claim_element(nodes, "BR", {});
			t9 = claim_space(nodes);
			br3 = claim_element(nodes, "BR", {});
			t10 = claim_space(nodes);
			br4 = claim_element(nodes, "BR", {});
			t11 = claim_space(nodes);
			div1 = claim_element(nodes, "DIV", { class: true });
			var div1_nodes = children(div1);
			claim_component(divider0.$$.fragment, div1_nodes);
			t12 = claim_space(div1_nodes);
			h20 = claim_element(div1_nodes, "H2", { style: true });
			var h20_nodes = children(h20);
			t13 = claim_text(h20_nodes, "The nearest list:");
			h20_nodes.forEach(detach_dev);
			t14 = claim_space(div1_nodes);
			claim_component(divider1.$$.fragment, div1_nodes);
			t15 = claim_space(div1_nodes);
			br5 = claim_element(div1_nodes, "BR", {});
			t16 = claim_space(div1_nodes);
			ul0 = claim_element(div1_nodes, "UL", { class: true });
			var ul0_nodes = children(ul0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].l(ul0_nodes);
			}

			ul0_nodes.forEach(detach_dev);
			div1_nodes.forEach(detach_dev);
			t17 = claim_space(nodes);
			br6 = claim_element(nodes, "BR", {});
			t18 = claim_space(nodes);
			br7 = claim_element(nodes, "BR", {});
			t19 = claim_space(nodes);
			br8 = claim_element(nodes, "BR", {});
			t20 = claim_space(nodes);
			br9 = claim_element(nodes, "BR", {});
			t21 = claim_space(nodes);
			br10 = claim_element(nodes, "BR", {});
			t22 = claim_space(nodes);
			div2 = claim_element(nodes, "DIV", { class: true });
			var div2_nodes = children(div2);
			claim_component(divider2.$$.fragment, div2_nodes);
			t23 = claim_space(div2_nodes);
			h21 = claim_element(div2_nodes, "H2", { style: true });
			var h21_nodes = children(h21);
			t24 = claim_text(h21_nodes, "The second list:");
			h21_nodes.forEach(detach_dev);
			t25 = claim_space(div2_nodes);
			claim_component(divider3.$$.fragment, div2_nodes);
			t26 = claim_space(div2_nodes);
			br11 = claim_element(div2_nodes, "BR", {});
			t27 = claim_space(div2_nodes);
			ul1 = claim_element(div2_nodes, "UL", { class: true });
			var ul1_nodes = children(ul1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].l(ul1_nodes);
			}

			ul1_nodes.forEach(detach_dev);
			div2_nodes.forEach(detach_dev);
			t28 = claim_space(nodes);
			br12 = claim_element(nodes, "BR", {});
			t29 = claim_space(nodes);
			br13 = claim_element(nodes, "BR", {});
			t30 = claim_space(nodes);
			br14 = claim_element(nodes, "BR", {});
			t31 = claim_space(nodes);
			br15 = claim_element(nodes, "BR", {});
			this.h();
		},
		h: function hydrate() {
			document.title = "Charitify - is the application for helping those in need.";
			attr_dev(div0, "class", "pics-wrap svelte-8mvppp");
			add_location(div0, file, 114, 8, 3137);
			attr_dev(section0, "class", "top svelte-8mvppp");
			add_location(section0, file, 112, 4, 3106);
			attr_dev(section1, "class", "rate-section svelte-8mvppp");
			add_location(section1, file, 123, 4, 3304);
			add_location(br0, file, 133, 4, 3552);
			add_location(br1, file, 134, 4, 3561);
			attr_dev(section2, "class", "container");
			add_location(section2, file, 111, 0, 3074);
			add_location(br2, file, 139, 0, 3600);
			add_location(br3, file, 140, 0, 3605);
			add_location(br4, file, 141, 0, 3610);
			set_style(h20, "text-align", "right");
			add_location(h20, file, 145, 4, 3669);
			add_location(br5, file, 148, 4, 3752);
			attr_dev(ul0, "class", "cards svelte-8mvppp");
			add_location(ul0, file, 150, 4, 3762);
			attr_dev(div1, "class", "container");
			add_location(div1, file, 143, 0, 3616);
			add_location(br6, file, 159, 0, 3921);
			add_location(br7, file, 160, 0, 3926);
			add_location(br8, file, 161, 0, 3931);
			add_location(br9, file, 162, 0, 3936);
			add_location(br10, file, 163, 0, 3941);
			set_style(h21, "text-align", "right");
			add_location(h21, file, 167, 4, 4000);
			add_location(br11, file, 170, 4, 4082);
			attr_dev(ul1, "class", "cards svelte-8mvppp");
			add_location(ul1, file, 172, 4, 4092);
			attr_dev(div2, "class", "container");
			add_location(div2, file, 165, 0, 3947);
			add_location(br12, file, 181, 0, 4251);
			add_location(br13, file, 182, 0, 4256);
			add_location(br14, file, 183, 0, 4261);
			add_location(br15, file, 184, 0, 4266);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, section2, anchor);
			append_dev(section2, section0);
			append_dev(section0, div0);
			mount_component(carousel, div0, null);
			append_dev(section0, t1);
			mount_component(donatinggroup, section0, null);
			append_dev(section2, t2);
			mount_component(progress, section2, null);
			append_dev(section2, t3);
			append_dev(section2, section1);
			mount_component(avatarandname, section1, null);
			append_dev(section1, t4);
			mount_component(rate, section1, null);
			append_dev(section2, t5);
			append_dev(section2, br0);
			append_dev(section2, t6);
			append_dev(section2, br1);
			append_dev(section2, t7);
			mount_component(titlesubtitle, section2, null);
			insert_dev(target, t8, anchor);
			insert_dev(target, br2, anchor);
			insert_dev(target, t9, anchor);
			insert_dev(target, br3, anchor);
			insert_dev(target, t10, anchor);
			insert_dev(target, br4, anchor);
			insert_dev(target, t11, anchor);
			insert_dev(target, div1, anchor);
			mount_component(divider0, div1, null);
			append_dev(div1, t12);
			append_dev(div1, h20);
			append_dev(h20, t13);
			append_dev(div1, t14);
			mount_component(divider1, div1, null);
			append_dev(div1, t15);
			append_dev(div1, br5);
			append_dev(div1, t16);
			append_dev(div1, ul0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(ul0, null);
			}

			insert_dev(target, t17, anchor);
			insert_dev(target, br6, anchor);
			insert_dev(target, t18, anchor);
			insert_dev(target, br7, anchor);
			insert_dev(target, t19, anchor);
			insert_dev(target, br8, anchor);
			insert_dev(target, t20, anchor);
			insert_dev(target, br9, anchor);
			insert_dev(target, t21, anchor);
			insert_dev(target, br10, anchor);
			insert_dev(target, t22, anchor);
			insert_dev(target, div2, anchor);
			mount_component(divider2, div2, null);
			append_dev(div2, t23);
			append_dev(div2, h21);
			append_dev(h21, t24);
			append_dev(div2, t25);
			mount_component(divider3, div2, null);
			append_dev(div2, t26);
			append_dev(div2, br11);
			append_dev(div2, t27);
			append_dev(div2, ul1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul1, null);
			}

			insert_dev(target, t28, anchor);
			insert_dev(target, br12, anchor);
			insert_dev(target, t29, anchor);
			insert_dev(target, br13, anchor);
			insert_dev(target, t30, anchor);
			insert_dev(target, br14, anchor);
			insert_dev(target, t31, anchor);
			insert_dev(target, br15, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*cards*/ 1) {
				each_value_1 = /*cards*/ ctx[0];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
						transition_in(each_blocks_1[i], 1);
					} else {
						each_blocks_1[i] = create_each_block_1(child_ctx);
						each_blocks_1[i].c();
						transition_in(each_blocks_1[i], 1);
						each_blocks_1[i].m(ul0, null);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (dirty & /*cards*/ 1) {
				each_value = /*cards*/ ctx[0];
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
						each_blocks[i].m(ul1, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out_1(i);
				}

				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(carousel.$$.fragment, local);
			transition_in(donatinggroup.$$.fragment, local);
			transition_in(progress.$$.fragment, local);
			transition_in(avatarandname.$$.fragment, local);
			transition_in(rate.$$.fragment, local);
			transition_in(titlesubtitle.$$.fragment, local);
			transition_in(divider0.$$.fragment, local);
			transition_in(divider1.$$.fragment, local);

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks_1[i]);
			}

			transition_in(divider2.$$.fragment, local);
			transition_in(divider3.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			transition_out(carousel.$$.fragment, local);
			transition_out(donatinggroup.$$.fragment, local);
			transition_out(progress.$$.fragment, local);
			transition_out(avatarandname.$$.fragment, local);
			transition_out(rate.$$.fragment, local);
			transition_out(titlesubtitle.$$.fragment, local);
			transition_out(divider0.$$.fragment, local);
			transition_out(divider1.$$.fragment, local);
			each_blocks_1 = each_blocks_1.filter(Boolean);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				transition_out(each_blocks_1[i]);
			}

			transition_out(divider2.$$.fragment, local);
			transition_out(divider3.$$.fragment, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(section2);
			destroy_component(carousel);
			destroy_component(donatinggroup);
			destroy_component(progress);
			destroy_component(avatarandname);
			destroy_component(rate);
			destroy_component(titlesubtitle);
			if (detaching) detach_dev(t8);
			if (detaching) detach_dev(br2);
			if (detaching) detach_dev(t9);
			if (detaching) detach_dev(br3);
			if (detaching) detach_dev(t10);
			if (detaching) detach_dev(br4);
			if (detaching) detach_dev(t11);
			if (detaching) detach_dev(div1);
			destroy_component(divider0);
			destroy_component(divider1);
			destroy_each(each_blocks_1, detaching);
			if (detaching) detach_dev(t17);
			if (detaching) detach_dev(br6);
			if (detaching) detach_dev(t18);
			if (detaching) detach_dev(br7);
			if (detaching) detach_dev(t19);
			if (detaching) detach_dev(br8);
			if (detaching) detach_dev(t20);
			if (detaching) detach_dev(br9);
			if (detaching) detach_dev(t21);
			if (detaching) detach_dev(br10);
			if (detaching) detach_dev(t22);
			if (detaching) detach_dev(div2);
			destroy_component(divider2);
			destroy_component(divider3);
			destroy_each(each_blocks, detaching);
			if (detaching) detach_dev(t28);
			if (detaching) detach_dev(br12);
			if (detaching) detach_dev(t29);
			if (detaching) detach_dev(br13);
			if (detaching) detach_dev(t30);
			if (detaching) detach_dev(br14);
			if (detaching) detach_dev(t31);
			if (detaching) detach_dev(br15);
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
	const cards = [
		{
			src: "https://placeimg.com/300/300/tech",
			title: "The main title and short description.",
			percent: 45,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG charity of Charitify."
		},
		{
			src: "https://placeimg.com/300/300/arch",
			title: "Second bigger major card title line with a bit longer description.",
			percent: 65,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG charity of Charitify."
		},
		{
			src: "https://placeimg.com/300/300/any",
			title: "The main title and short description.",
			percent: 5,
			orgHead: "Tinaramisimuss Kandelakinuskas",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG charity of Charitify."
		},
		{
			src: "https://placeimg.com/300/300/nature",
			title: "The main title and short description.",
			percent: 95,
			orgHead: "Tina Kandelaki",
			orgHeadSrc: "https://placeimg.com/300/300/people",
			organization: "ORG giant charity organization of big Charitify company."
		}
	];

	const images = cards.map(card => ({
		src: [card.src, card.src, card.src],
		alt: card.title
	}));

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		
	};

	return [cards, images];
}

class List extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "List",
			options,
			id: create_fragment.name
		});
	}
}

export default List;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC44NDY4NGE5Yy5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3JvdXRlcy9saXN0LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICAgIGltcG9ydCB7IFN3aXBlLCBTd2lwZUl0ZW0gfSBmcm9tICcuLi9wbHVnaW5zJ1xuICAgIGltcG9ydCB7XG4gICAgICAgIENhcm91c2VsLFxuICAgICAgICBDaGFyaXR5Q2FyZCxcbiAgICAgICAgVGl0bGVTdWJUaXRsZSxcbiAgICAgICAgQXZhdGFyQW5kTmFtZSxcbiAgICAgICAgRG9uYXRpbmdHcm91cCxcbiAgICB9IGZyb20gJy4uL2xheW91dHMnXG4gICAgaW1wb3J0IHtcbiAgICAgICAgUmF0ZSxcbiAgICAgICAgRm9ybSxcbiAgICAgICAgSW5wdXQsXG4gICAgICAgIEF2YXRhcixcbiAgICAgICAgQnV0dG9uLFxuICAgICAgICBEaXZpZGVyLFxuICAgICAgICBQaWN0dXJlLFxuICAgICAgICBQcm9ncmVzcyxcbiAgICB9IGZyb20gJy4uL2NvbXBvbmVudHMnXG5cbiAgICBjb25zdCBjYXJkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC90ZWNoJyxcbiAgICAgICAgICAgIHRpdGxlOiAnVGhlIG1haW4gdGl0bGUgYW5kIHNob3J0IGRlc2NyaXB0aW9uLicsXG4gICAgICAgICAgICBwZXJjZW50OiA0NSxcbiAgICAgICAgICAgIG9yZ0hlYWQ6ICdUaW5hIEthbmRlbGFraScsXG4gICAgICAgICAgICBvcmdIZWFkU3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIGNoYXJpdHkgb2YgQ2hhcml0aWZ5LicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvYXJjaCcsXG4gICAgICAgICAgICB0aXRsZTogJ1NlY29uZCBiaWdnZXIgbWFqb3IgY2FyZCB0aXRsZSBsaW5lIHdpdGggYSBiaXQgbG9uZ2VyIGRlc2NyaXB0aW9uLicsXG4gICAgICAgICAgICBwZXJjZW50OiA2NSxcbiAgICAgICAgICAgIG9yZ0hlYWQ6ICdUaW5hIEthbmRlbGFraScsXG4gICAgICAgICAgICBvcmdIZWFkU3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIGNoYXJpdHkgb2YgQ2hhcml0aWZ5LicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvYW55JyxcbiAgICAgICAgICAgIHRpdGxlOiAnVGhlIG1haW4gdGl0bGUgYW5kIHNob3J0IGRlc2NyaXB0aW9uLicsXG4gICAgICAgICAgICBwZXJjZW50OiA1LFxuICAgICAgICAgICAgb3JnSGVhZDogJ1RpbmFyYW1pc2ltdXNzIEthbmRlbGFraW51c2thcycsXG4gICAgICAgICAgICBvcmdIZWFkU3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIGNoYXJpdHkgb2YgQ2hhcml0aWZ5LicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2VpbWcuY29tLzMwMC8zMDAvbmF0dXJlJyxcbiAgICAgICAgICAgIHRpdGxlOiAnVGhlIG1haW4gdGl0bGUgYW5kIHNob3J0IGRlc2NyaXB0aW9uLicsXG4gICAgICAgICAgICBwZXJjZW50OiA5NSxcbiAgICAgICAgICAgIG9yZ0hlYWQ6ICdUaW5hIEthbmRlbGFraScsXG4gICAgICAgICAgICBvcmdIZWFkU3JjOiAnaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGUnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uOiAnT1JHIGdpYW50IGNoYXJpdHkgb3JnYW5pemF0aW9uIG9mIGJpZyBDaGFyaXRpZnkgY29tcGFueS4nLFxuICAgICAgICB9LFxuICAgIF1cblxuICAgIGNvbnN0IGltYWdlcyA9IGNhcmRzLm1hcChjYXJkID0+ICh7XG4gICAgICAgIHNyYzogW2NhcmQuc3JjLCBjYXJkLnNyYywgY2FyZC5zcmNdLFxuICAgICAgICBhbHQ6IGNhcmQudGl0bGUsXG4gICAgfSkpXG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICAgIC50b3Age1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBtYXJnaW4tYm90dG9tOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDEuNSk7XG4gICAgICAgIG1hcmdpbi10b3A6IHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICAucGljcy13cmFwIHtcbiAgICAgICAgei1pbmRleDogMDtcbiAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAycHg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICAgICAgICBib3gtc2hhZG93OiB2YXIoLS1zaGFkb3ctcHJpbWFyeSk7XG4gICAgfVxuXG4gICAgLnJhdGUtc2VjdGlvbiB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LWVuZDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBwYWRkaW5nOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDEuNSkgMDtcbiAgICB9XG5cbiAgICAuY2FyZHMge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogdmFyKC0tc2NyZWVuLXBhZGRpbmcpIDA7XG4gICAgICAgIG1hcmdpbjogY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAtMykgY2FsYyh2YXIoLS1zY3JlZW4tcGFkZGluZykgKiAtMSk7XG4gICAgfVxuXG4gICAgLmNhcmRzIGxpIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgICAgICB3aWR0aDogNTAlO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBwYWRkaW5nOiBjYWxjKHZhcigtLXNjcmVlbi1wYWRkaW5nKSAqIDMpIHZhcigtLXNjcmVlbi1wYWRkaW5nKTtcbiAgICB9XG5cbiAgICAuY2FyZHMgbGk6aG92ZXIge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIC4xKVxuICAgIH1cbjwvc3R5bGU+XG5cbjxzdmVsdGU6aGVhZD5cbiAgICA8dGl0bGU+Q2hhcml0aWZ5IC0gaXMgdGhlIGFwcGxpY2F0aW9uIGZvciBoZWxwaW5nIHRob3NlIGluIG5lZWQuPC90aXRsZT5cbjwvc3ZlbHRlOmhlYWQ+XG5cbjxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgPHNlY3Rpb24gY2xhc3M9XCJ0b3BcIj5cblxuICAgICAgICA8ZGl2IGNsYXNzPVwicGljcy13cmFwXCI+XG4gICAgICAgICAgICA8Q2Fyb3VzZWwge2ltYWdlc30vPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8RG9uYXRpbmdHcm91cC8+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPFByb2dyZXNzIHZhbHVlPVwiNjVcIiBzaXplPVwiYmlnXCI+PC9Qcm9ncmVzcz5cblxuICAgIDxzZWN0aW9uIGNsYXNzPVwicmF0ZS1zZWN0aW9uXCI+XG4gICAgICAgIDxBdmF0YXJBbmROYW1lXG4gICAgICAgICAgICAgICAgc3JjPVwiaHR0cHM6Ly9wbGFjZWltZy5jb20vMzAwLzMwMC9wZW9wbGVcIlxuICAgICAgICAgICAgICAgIHRpdGxlPVwiVGluYSBLYW5kZWxha2lcIlxuICAgICAgICAgICAgICAgIHN1YlRpdGxlPVwiT1JHIGNoYXJpdHkgY2hhcml0aWZ5XCJcbiAgICAgICAgLz5cblxuICAgICAgICA8UmF0ZS8+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPGJyPlxuICAgIDxicj5cblxuICAgIDxUaXRsZVN1YlRpdGxlLz5cbjwvc2VjdGlvbj5cblxuPGJyPlxuPGJyPlxuPGJyPlxuXG48ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgPERpdmlkZXIgc2l6ZT1cIjE2XCIvPlxuICAgIDxoMiBzdHlsZT1cInRleHQtYWxpZ246IHJpZ2h0XCI+VGhlIG5lYXJlc3QgbGlzdDo8L2gyPlxuICAgIDxEaXZpZGVyIHNpemU9XCIyMFwiLz5cblxuICAgIDxicj5cblxuICAgIDx1bCBjbGFzcz1cImNhcmRzXCI+XG4gICAgICAgIHsjZWFjaCBjYXJkcyBhcyBjYXJkfVxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgIDxDaGFyaXR5Q2FyZCB7Li4uY2FyZH0vPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgey9lYWNofVxuICAgIDwvdWw+XG48L2Rpdj5cblxuPGJyPlxuPGJyPlxuPGJyPlxuPGJyPlxuPGJyPlxuXG48ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgPERpdmlkZXIgc2l6ZT1cIjE2XCIvPlxuICAgIDxoMiBzdHlsZT1cInRleHQtYWxpZ246IHJpZ2h0XCI+VGhlIHNlY29uZCBsaXN0OjwvaDI+XG4gICAgPERpdmlkZXIgc2l6ZT1cIjIwXCIvPlxuXG4gICAgPGJyPlxuXG4gICAgPHVsIGNsYXNzPVwiY2FyZHNcIj5cbiAgICAgICAgeyNlYWNoIGNhcmRzIGFzIGNhcmR9XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgPENoYXJpdHlDYXJkIHsuLi5jYXJkfS8+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICB7L2VhY2h9XG4gICAgPC91bD5cbjwvZGl2PlxuXG48YnI+XG48YnI+XG48YnI+XG48YnI+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzhCQXVKZSxHQUFLOzs7a0NBQVYsTUFBSTs7Ozs7Ozs7Ozs0QkFzQkMsR0FBSzs7O2dDQUFWLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkJBdEJDLEdBQUs7OztpQ0FBVixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7OzBCQUFKLE1BQUk7Ozs7Ozs7OzJCQXNCQyxHQUFLOzs7K0JBQVYsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozt3QkFBSixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7b0NBdEJKLE1BQUk7Ozs7Ozs7a0NBc0JKLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BekpKLEtBQUs7O0dBRUgsR0FBRyxFQUFFLG1DQUFtQztHQUN4QyxLQUFLLEVBQUUsdUNBQXVDO0dBQzlDLE9BQU8sRUFBRSxFQUFFO0dBQ1gsT0FBTyxFQUFFLGdCQUFnQjtHQUN6QixVQUFVLEVBQUUscUNBQXFDO0dBQ2pELFlBQVksRUFBRSwyQkFBMkI7OztHQUd6QyxHQUFHLEVBQUUsbUNBQW1DO0dBQ3hDLEtBQUssRUFBRSxvRUFBb0U7R0FDM0UsT0FBTyxFQUFFLEVBQUU7R0FDWCxPQUFPLEVBQUUsZ0JBQWdCO0dBQ3pCLFVBQVUsRUFBRSxxQ0FBcUM7R0FDakQsWUFBWSxFQUFFLDJCQUEyQjs7O0dBR3pDLEdBQUcsRUFBRSxrQ0FBa0M7R0FDdkMsS0FBSyxFQUFFLHVDQUF1QztHQUM5QyxPQUFPLEVBQUUsQ0FBQztHQUNWLE9BQU8sRUFBRSxnQ0FBZ0M7R0FDekMsVUFBVSxFQUFFLHFDQUFxQztHQUNqRCxZQUFZLEVBQUUsMkJBQTJCOzs7R0FHekMsR0FBRyxFQUFFLHFDQUFxQztHQUMxQyxLQUFLLEVBQUUsdUNBQXVDO0dBQzlDLE9BQU8sRUFBRSxFQUFFO0dBQ1gsT0FBTyxFQUFFLGdCQUFnQjtHQUN6QixVQUFVLEVBQUUscUNBQXFDO0dBQ2pELFlBQVksRUFBRSwwREFBMEQ7Ozs7T0FJMUUsTUFBTSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSTtFQUN6QixHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO0VBQ2xDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9
