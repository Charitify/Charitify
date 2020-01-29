import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, V as onMount, p as space, e as element, r as claim_space, c as claim_element, b as children, f as detach_dev, g as attr_dev, h as add_location, k as insert_dev, n as noop } from './index.b5b1b293.js';

/* src/routes/map.svelte generated by Svelte v3.16.7 */
const file = "src/routes/map.svelte";

function create_fragment(ctx) {
	let t;
	let section;

	const block = {
		c: function create() {
			t = space();
			section = element("section");
			this.h();
		},
		l: function claim(nodes) {
			t = claim_space(nodes);
			section = claim_element(nodes, "SECTION", { id: true, class: true });
			children(section).forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			document.title = "Charitify - Map of organizations.";
			attr_dev(section, "id", "map");
			attr_dev(section, "class", "svelte-1tw6as9");
			add_location(section, file, 38, 0, 881);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
			insert_dev(target, section, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
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

function instance($$self) {
	onMount(async () => {
		const { default: mapboxgl } = await import('./mapbox-gl.5fb802d9.js');
		const token = "pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw";
		mapboxgl.accessToken = token;

		const map = new mapboxgl.Map({
				container: "map",
				style: "mapbox://styles/mapbox/streets-v11"
			});

		for (let i = 0; i < 10; i += 1) {
			const lat = Math.random() * 180 - 90;
			const lng = Math.random() * 360 - 180;
			console.log(lat, lng);
			new mapboxgl.Marker().setLngLat([lat, lng]).addTo(map);
		}
	});

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		
	};

	return [];
}

class Map extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Map",
			options,
			id: create_fragment.name
		});
	}
}

export default Map;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLjc1ZTdkZjY2LmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcm91dGVzL21hcC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHN2ZWx0ZTpoZWFkPlxuICAgIDx0aXRsZT5DaGFyaXRpZnkgLSBNYXAgb2Ygb3JnYW5pemF0aW9ucy48L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPHN0eWxlPlxuICAgIHNlY3Rpb24ge1xuICAgICAgICBmbGV4LWdyb3c6IDE7XG4gICAgfVxuPC9zdHlsZT5cblxuPHNjcmlwdD5cbiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuXG4gICAgb25Nb3VudChhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgZGVmYXVsdDogbWFwYm94Z2wgfSA9IGF3YWl0IGltcG9ydCgnbWFwYm94LWdsJylcblxuICAgICAgICBjb25zdCB0b2tlbiA9ICdway5leUoxSWpvaVluVmliR2xySWl3aVlTSTZJbU5yTlhweGR6Z3hiVEF3Tm5jemJHeHdlRzB3Y1RWM2NqQWlmUS5ydDFwZUxqQ1FIWlVrck00QVd6NU13J1xuXG4gICAgICAgIG1hcGJveGdsLmFjY2Vzc1Rva2VuID0gdG9rZW5cblxuICAgICAgICBjb25zdCBtYXAgPSBuZXcgbWFwYm94Z2wuTWFwKHtcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJ21hcCcsXG4gICAgICAgICAgICBzdHlsZTogJ21hcGJveDovL3N0eWxlcy9tYXBib3gvc3RyZWV0cy12MTEnLFxuICAgICAgICB9KVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkgKz0gMSkge1xuICAgICAgICAgIGNvbnN0IGxhdCA9IE1hdGgucmFuZG9tKCkgKiAxODAgLSA5MFxuICAgICAgICAgIGNvbnN0IGxuZyA9IE1hdGgucmFuZG9tKCkgKiAzNjAgLSAxODBcblxuICAgICAgICAgICAgY29uc29sZS5sb2cobGF0LCBsbmcpXG5cbiAgICAgICAgICAgIG5ldyBtYXBib3hnbC5NYXJrZXIoKVxuICAgICAgICAgICAgICAgICAgICAuc2V0TG5nTGF0KFtsYXQsIGxuZ10pXG4gICAgICAgICAgICAgICAgICAgIC5hZGRUbyhtYXApXG4gICAgICAgIH1cbiAgICB9KVxuPC9zY3JpcHQ+XG5cbjxzZWN0aW9uIGlkPVwibWFwXCI+PC9zZWN0aW9uPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FHSSxPQUFPO1VBQ0ssT0FBTyxFQUFFLFFBQVEsa0JBQWtCLHlCQUFXO1FBRWhELEtBQUssR0FBRywwRkFBMEY7RUFFeEcsUUFBUSxDQUFDLFdBQVcsR0FBRyxLQUFLOztRQUV0QixHQUFHLE9BQU8sUUFBUSxDQUFDLEdBQUc7SUFDeEIsU0FBUyxFQUFFLEtBQUs7SUFDaEIsS0FBSyxFQUFFLG9DQUFvQzs7O1dBR3RDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQztTQUN0QixHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxHQUFHLEdBQUcsRUFBRTtTQUM5QixHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxHQUFHLEdBQUcsR0FBRztHQUVuQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHO09BRWhCLFFBQVEsQ0FBQyxNQUFNLEdBQ1YsU0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQ25CLEtBQUssQ0FBQyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9
