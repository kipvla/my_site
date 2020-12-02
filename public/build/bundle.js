
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
            throw new Error('Function called outside component initialization');
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
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
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Home/Hero.svelte generated by Svelte v3.29.4 */

    const file = "src/components/Home/Hero.svelte";

    function create_fragment(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "hero");
    			add_location(div, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Hero", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/Home/Testimonials.svelte generated by Svelte v3.29.4 */

    const file$1 = "src/components/Home/Testimonials.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div1;
    	let h1;
    	let t1;
    	let br;
    	let t2;
    	let div0;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Testimonials";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "\"Kip...he's amazing.\" - Tim Heidecker";
    			add_location(h1, file$1, 2, 4, 57);
    			add_location(br, file$1, 3, 4, 83);
    			add_location(p, file$1, 5, 6, 124);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file$1, 4, 4, 94);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$1, 1, 2, 29);
    			attr_dev(div2, "class", "testimonials");
    			add_location(div2, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, br);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Testimonials", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Testimonials> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Testimonials extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Testimonials",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/Home/ShortBio.svelte generated by Svelte v3.29.4 */

    const file$2 = "src/components/Home/ShortBio.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let hr0;
    	let t0;
    	let p;
    	let t1;
    	let a;
    	let t3;
    	let t4;
    	let hr1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			hr0 = element("hr");
    			t0 = space();
    			p = element("p");
    			t1 = text("A violist and an educator, Kip Riecken has performed with the Chicago and\n      St. Louis Symphonies, the Civic Orchestra of Chicago, and alongside Yo-Yo Ma\n      and Tabea Zimmerman. Kip's study of the Alexander Technique, an\n      indispensable method for enhancing efficiency of movement and personal\n      expression, inspires a lively and warm perspective on music-making and\n      teaching. Click ");
    			a = element("a");
    			a.textContent = "here";
    			t3 = text(" to see Kip talk about the Alexander Technique on\n      YouTube.");
    			t4 = space();
    			hr1 = element("hr");
    			attr_dev(hr0, "class", "hr1");
    			add_location(hr0, file$2, 2, 4, 73);
    			attr_dev(a, "href", "https://www.youtube.com/channel/UCOzQuf-qTzKJx6YfYTaJLpQ?view_as=subscriber");
    			add_location(a, file$2, 9, 22, 521);
    			attr_dev(p, "class", "m-5");
    			add_location(p, file$2, 3, 4, 96);
    			attr_dev(hr1, "class", "hr2");
    			add_location(hr1, file$2, 12, 4, 693);
    			attr_dev(div0, "class", "container w-100 text-justify");
    			add_location(div0, file$2, 1, 2, 26);
    			attr_dev(div1, "class", "short-bio");
    			add_location(div1, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, hr0);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(p, t1);
    			append_dev(p, a);
    			append_dev(p, t3);
    			append_dev(div0, t4);
    			append_dev(div0, hr1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ShortBio", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ShortBio> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ShortBio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShortBio",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Home/Videos.svelte generated by Svelte v3.29.4 */

    const file$3 = "src/components/Home/Videos.svelte";

    function create_fragment$3(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let div0;
    	let p;
    	let t1;
    	let div2;
    	let div1;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Cumque, eaque nam temporibus sapiente aut vitae officia incidunt maxime dolorem natus nostrum aperiam quo alias labore, voluptates dolores soluta. Repellat, quo?";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			iframe = element("iframe");
    			add_location(p, file$3, 4, 8, 112);
    			attr_dev(div0, "class", "col-12 col-md-6");
    			add_location(div0, file$3, 3, 6, 74);
    			attr_dev(iframe, "class", "resp-iframe");
    			attr_dev(iframe, "title", "Gribby");
    			if (iframe.src !== (iframe_src_value = "https://www.youtube.com/embed/pN1ZA6hWd3s")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$3, 8, 10, 427);
    			attr_dev(div1, "class", "videos");
    			add_location(div1, file$3, 7, 8, 396);
    			attr_dev(div2, "class", "col-12 col-md-6");
    			add_location(div2, file$3, 6, 6, 358);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$3, 2, 4, 50);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$3, 1, 2, 22);
    			attr_dev(div5, "class", "video");
    			add_location(div5, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, p);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, iframe);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Videos", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Videos> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Videos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Videos",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/Home.svelte generated by Svelte v3.29.4 */

    function create_fragment$4(ctx) {
    	let hero;
    	let t0;
    	let shortbio;
    	let t1;
    	let testimonials;
    	let t2;
    	let videos;
    	let current;
    	hero = new Hero({ $$inline: true });
    	shortbio = new ShortBio({ $$inline: true });
    	testimonials = new Testimonials({ $$inline: true });
    	videos = new Videos({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(hero.$$.fragment);
    			t0 = space();
    			create_component(shortbio.$$.fragment);
    			t1 = space();
    			create_component(testimonials.$$.fragment);
    			t2 = space();
    			create_component(videos.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(hero, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(shortbio, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(testimonials, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(videos, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hero.$$.fragment, local);
    			transition_in(shortbio.$$.fragment, local);
    			transition_in(testimonials.$$.fragment, local);
    			transition_in(videos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hero.$$.fragment, local);
    			transition_out(shortbio.$$.fragment, local);
    			transition_out(testimonials.$$.fragment, local);
    			transition_out(videos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(hero, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(shortbio, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(testimonials, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(videos, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Hero, Testimonials, ShortBio, Videos });
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Blog/BlogPost.svelte generated by Svelte v3.29.4 */

    const file$4 = "src/components/Blog/BlogPost.svelte";

    function create_fragment$5(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let h2;
    	let t1;
    	let t2;
    	let img;
    	let img_src_value;
    	let t3;
    	let h50;
    	let t4;
    	let t5;
    	let h51;
    	let t6;
    	let t7;
    	let p;
    	let t8;
    	let t9;
    	let div2;
    	let t10;
    	let hr;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			img = element("img");
    			t3 = space();
    			h50 = element("h5");
    			t4 = text(/*date*/ ctx[1]);
    			t5 = space();
    			h51 = element("h5");
    			t6 = text(/*time*/ ctx[2]);
    			t7 = space();
    			p = element("p");
    			t8 = text(/*body*/ ctx[4]);
    			t9 = space();
    			div2 = element("div");
    			t10 = space();
    			hr = element("hr");
    			attr_dev(div0, "class", "col col-lg-2");
    			add_location(div0, file$4, 9, 4, 495);
    			add_location(h2, file$4, 11, 8, 577);
    			attr_dev(img, "class", "blog-image");
    			if (img.src !== (img_src_value = /*image*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 12, 8, 602);
    			add_location(h50, file$4, 13, 8, 656);
    			add_location(h51, file$4, 14, 8, 680);
    			attr_dev(p, "class", "text-justify");
    			add_location(p, file$4, 15, 8, 704);
    			attr_dev(div1, "class", "col col-lg-8 blog-post");
    			add_location(div1, file$4, 10, 4, 532);
    			attr_dev(div2, "class", "col col-lg-2");
    			add_location(div2, file$4, 17, 4, 754);
    			add_location(hr, file$4, 18, 4, 791);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$4, 8, 0, 467);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, img);
    			append_dev(div1, t3);
    			append_dev(div1, h50);
    			append_dev(h50, t4);
    			append_dev(div1, t5);
    			append_dev(div1, h51);
    			append_dev(h51, t6);
    			append_dev(div1, t7);
    			append_dev(div1, p);
    			append_dev(p, t8);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div3, t10);
    			append_dev(div3, hr);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);

    			if (dirty & /*image*/ 8 && img.src !== (img_src_value = /*image*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*date*/ 2) set_data_dev(t4, /*date*/ ctx[1]);
    			if (dirty & /*time*/ 4) set_data_dev(t6, /*time*/ ctx[2]);
    			if (dirty & /*body*/ 16) set_data_dev(t8, /*body*/ ctx[4]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BlogPost", slots, []);
    	let { title = "My first post" } = $$props;
    	let { date = "Friday November 13, 2020" } = $$props;
    	let { time = "4:00 PM" } = $$props;
    	let { image = "images/KR11.jpg" } = $$props;
    	let { body = "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Assumenda ducimus distinctio necessitatibus quo repellendus sed explicabo eveniet, omnis blanditiis reiciendis amet perferendis, quod minima consequatur dolores eius, cumque repudiandae praesentium?" } = $$props;
    	const writable_props = ["title", "date", "time", "image", "body"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BlogPost> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("date" in $$props) $$invalidate(1, date = $$props.date);
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    		if ("image" in $$props) $$invalidate(3, image = $$props.image);
    		if ("body" in $$props) $$invalidate(4, body = $$props.body);
    	};

    	$$self.$capture_state = () => ({ title, date, time, image, body });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("date" in $$props) $$invalidate(1, date = $$props.date);
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    		if ("image" in $$props) $$invalidate(3, image = $$props.image);
    		if ("body" in $$props) $$invalidate(4, body = $$props.body);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, date, time, image, body];
    }

    class BlogPost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			title: 0,
    			date: 1,
    			time: 2,
    			image: 3,
    			body: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BlogPost",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get title() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get time() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get body() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set body(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Blog.svelte generated by Svelte v3.29.4 */
    const file$5 = "src/pages/Blog.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let blogpost0;
    	let t;
    	let blogpost1;
    	let current;
    	blogpost0 = new BlogPost({ $$inline: true });
    	blogpost1 = new BlogPost({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(blogpost0.$$.fragment);
    			t = space();
    			create_component(blogpost1.$$.fragment);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file$5, 5, 4, 108);
    			attr_dev(div1, "class", "content");
    			add_location(div1, file$5, 4, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(blogpost0, div0, null);
    			append_dev(div0, t);
    			mount_component(blogpost1, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(blogpost0.$$.fragment, local);
    			transition_in(blogpost1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(blogpost0.$$.fragment, local);
    			transition_out(blogpost1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(blogpost0);
    			destroy_component(blogpost1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Blog", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Blog> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ BlogPost });
    	return [];
    }

    class Blog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Blog",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Contact/Form.svelte generated by Svelte v3.29.4 */

    const file$6 = "src/components/Contact/Form.svelte";

    function create_fragment$7(ctx) {
    	let div3;
    	let hr;
    	let t0;
    	let form;
    	let div0;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let div1;
    	let label1;
    	let t3;
    	let input1;
    	let t4;
    	let div2;
    	let label2;
    	let t5;
    	let textarea;
    	let t6;
    	let input2;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			hr = element("hr");
    			t0 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			t1 = text("Your name:\n                ");
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			t3 = text("Your email:\n                ");
    			input1 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label2 = element("label");
    			t5 = text("Your message:\n                ");
    			textarea = element("textarea");
    			t6 = space();
    			input2 = element("input");
    			add_location(hr, file$6, 1, 4, 69);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "name");
    			add_location(input0, file$6, 6, 16, 236);
    			add_location(label0, file$6, 4, 12, 185);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$6, 3, 8, 148);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "_replyto");
    			add_location(input1, file$6, 12, 16, 401);
    			add_location(label1, file$6, 10, 12, 349);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$6, 9, 8, 312);
    			attr_dev(textarea, "name", "message");
    			add_location(textarea, file$6, 18, 16, 572);
    			add_location(label2, file$6, 16, 12, 518);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$6, 15, 8, 481);
    			attr_dev(input2, "type", "submit");
    			attr_dev(input2, "class", "btn btn-primary");
    			input2.value = "Submit";
    			add_location(input2, file$6, 21, 8, 653);
    			attr_dev(form, "action", "https://formspree.io/f/xpzolpwz");
    			attr_dev(form, "method", "POST");
    			add_location(form, file$6, 2, 4, 78);
    			attr_dev(div3, "class", "contact-form container");
    			set_style(div3, "text-align", "center");
    			add_location(div3, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, hr);
    			append_dev(div3, t0);
    			append_dev(div3, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t1);
    			append_dev(label0, input0);
    			append_dev(form, t2);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(label1, t3);
    			append_dev(label1, input1);
    			append_dev(form, t4);
    			append_dev(form, div2);
    			append_dev(div2, label2);
    			append_dev(label2, t5);
    			append_dev(label2, textarea);
    			append_dev(form, t6);
    			append_dev(form, input2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Form", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Form> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/pages/Contact.svelte generated by Svelte v3.29.4 */
    const file$7 = "src/pages/Contact.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let t;
    	let form;
    	let current;
    	form = new Form({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = space();
    			create_component(form.$$.fragment);
    			attr_dev(div, "class", "contact");
    			add_location(div, file$7, 4, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(form, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(form.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(form.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t);
    			destroy_component(form, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Contact", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Form });
    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/Lessons/Lesson.svelte generated by Svelte v3.29.4 */

    const file$8 = "src/components/Lessons/Lesson.svelte";

    function create_fragment$9(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "lesson");
    			if (img.src !== (img_src_value = "images/KR9.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$8, 1, 0, 36);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lesson", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lesson> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Lesson extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lesson",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/Lessons/LessonOption.svelte generated by Svelte v3.29.4 */

    const file$9 = "src/components/Lessons/LessonOption.svelte";

    function create_fragment$a(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let div0;
    	let h30;
    	let t1;
    	let h50;
    	let t3;
    	let p0;
    	let t4;
    	let div1;
    	let h31;
    	let t6;
    	let h51;
    	let t8;
    	let p1;
    	let t9;
    	let div2;
    	let h32;
    	let t11;
    	let h52;
    	let t13;
    	let p2;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Viola lesson";
    			t1 = space();
    			h50 = element("h5");
    			h50.textContent = "30 or 60 minutes";
    			t3 = space();
    			p0 = element("p");
    			t4 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Violin lesson";
    			t6 = space();
    			h51 = element("h5");
    			h51.textContent = "30 or 60 minutes";
    			t8 = space();
    			p1 = element("p");
    			t9 = space();
    			div2 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Alexander Technique Self-study";
    			t11 = space();
    			h52 = element("h5");
    			h52.textContent = "45 minutes";
    			t13 = space();
    			p2 = element("p");
    			add_location(h30, file$9, 4, 16, 140);
    			add_location(h50, file$9, 5, 16, 178);
    			add_location(p0, file$9, 6, 16, 220);
    			attr_dev(div0, "class", "col-12 col-md-4");
    			add_location(div0, file$9, 3, 12, 94);
    			add_location(h31, file$9, 9, 16, 305);
    			add_location(h51, file$9, 10, 16, 344);
    			add_location(p1, file$9, 11, 16, 386);
    			attr_dev(div1, "class", "col-12 col-md-4");
    			add_location(div1, file$9, 8, 12, 259);
    			add_location(h32, file$9, 14, 16, 471);
    			add_location(h52, file$9, 15, 16, 527);
    			add_location(p2, file$9, 16, 16, 563);
    			attr_dev(div2, "class", "col-12 col-md-4");
    			add_location(div2, file$9, 13, 12, 425);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$9, 2, 8, 64);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$9, 1, 4, 32);
    			attr_dev(div5, "class", "lesson-option");
    			add_location(div5, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h30);
    			append_dev(div0, t1);
    			append_dev(div0, h50);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, h31);
    			append_dev(div1, t6);
    			append_dev(div1, h51);
    			append_dev(div1, t8);
    			append_dev(div1, p1);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, h32);
    			append_dev(div2, t11);
    			append_dev(div2, h52);
    			append_dev(div2, t13);
    			append_dev(div2, p2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LessonOption", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LessonOption> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class LessonOption extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LessonOption",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/pages/Lessons.svelte generated by Svelte v3.29.4 */
    const file$a = "src/pages/Lessons.svelte";

    function create_fragment$b(ctx) {
    	let div5;
    	let img;
    	let img_src_value;
    	let t0;
    	let div4;
    	let div3;
    	let div0;
    	let h30;
    	let t2;
    	let h50;
    	let t4;
    	let p0;
    	let t5;
    	let div1;
    	let h31;
    	let t7;
    	let h51;
    	let t9;
    	let p1;
    	let t10;
    	let div2;
    	let h32;
    	let t12;
    	let h52;
    	let t14;
    	let p2;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			img = element("img");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Viola lesson";
    			t2 = space();
    			h50 = element("h5");
    			h50.textContent = "30 or 60 minutes";
    			t4 = space();
    			p0 = element("p");
    			t5 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Violin lesson";
    			t7 = space();
    			h51 = element("h5");
    			h51.textContent = "30 or 60 minutes";
    			t9 = space();
    			p1 = element("p");
    			t10 = space();
    			div2 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Alexander Technique Self-study";
    			t12 = space();
    			h52 = element("h5");
    			h52.textContent = "45 minutes";
    			t14 = space();
    			p2 = element("p");
    			if (img.src !== (img_src_value = "images/KR9.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "lesson-img");
    			attr_dev(img, "alt", "");
    			add_location(img, file$a, 6, 2, 186);
    			add_location(h30, file$a, 10, 8, 336);
    			add_location(h50, file$a, 11, 8, 366);
    			add_location(p0, file$a, 12, 8, 400);
    			attr_dev(div0, "class", "lesson-type");
    			add_location(div0, file$a, 9, 6, 302);
    			add_location(h31, file$a, 15, 8, 459);
    			add_location(h51, file$a, 16, 8, 490);
    			add_location(p1, file$a, 17, 8, 524);
    			attr_dev(div1, "class", "lesson-type");
    			add_location(div1, file$a, 14, 6, 425);
    			add_location(h32, file$a, 20, 8, 583);
    			add_location(h52, file$a, 21, 8, 631);
    			add_location(p2, file$a, 22, 8, 659);
    			attr_dev(div2, "class", "lesson-type");
    			add_location(div2, file$a, 19, 6, 549);
    			attr_dev(div3, "class", "lesson-option");
    			add_location(div3, file$a, 8, 4, 268);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$a, 7, 2, 240);
    			attr_dev(div5, "class", "lessons-container");
    			add_location(div5, file$a, 5, 0, 152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, img);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h30);
    			append_dev(div0, t2);
    			append_dev(div0, h50);
    			append_dev(div0, t4);
    			append_dev(div0, p0);
    			append_dev(div3, t5);
    			append_dev(div3, div1);
    			append_dev(div1, h31);
    			append_dev(div1, t7);
    			append_dev(div1, h51);
    			append_dev(div1, t9);
    			append_dev(div1, p1);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, h32);
    			append_dev(div2, t12);
    			append_dev(div2, h52);
    			append_dev(div2, t14);
    			append_dev(div2, p2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lessons", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lessons> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Lesson, LessonOption });
    	return [];
    }

    class Lessons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lessons",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/About/Bio.svelte generated by Svelte v3.29.4 */

    const file$b = "src/components/About/Bio.svelte";

    function create_fragment$c(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let p3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "In a varied career as a violist and violinist, Kip has performed with the\n        Chicago, St. Louis and New World Symphonies, the Civic Orchestra of\n        Chicago, and alongside Yo-Yo Ma and Tabea Zimmerman.";
    			t1 = text("\n      ​\n      ");
    			p1 = element("p");
    			p1.textContent = "Kip's passion for engaging audiences drives myriad personal initiatives.\n        As a New World Symphony fellow, he worked with artistic director Michael\n        Tilson Thomas to program, produce, and host a concert exploring the role\n        of the artist in today’s world, and led 16 New World Symphony fellows in\n        studying Spanish and leading public performances in which all musicians\n        provided Spanish commentary.";
    			t3 = text("\n      ​\n      ");
    			p2 = element("p");
    			p2.textContent = "Kip has spent 10 years studying the Alexander Technique (AT), a method for\n        enhancing coordination and embodied thoughtfulness which he credits for\n        bringing new life to his music-making. As a Civic Orchestra of Chicago\n        fellow, Kip designed and implemented The Rediscovering Musician in which\n        two Civic Orchestra of Chicago colleagues received eight Alexander\n        Technique lessons as he followed and documented their individual journeys.\n        Kip maintains a YouTube channel about Alexander Technique.";
    			t5 = text("\n      ​\n      ");
    			p3 = element("p");
    			p3.textContent = "A passion for education has led him to over 15 years of teaching\n        experience, from beginning level to college and professional, in English\n        and in Spanish. He maintains an online Zoom violin and viola studio.";
    			attr_dev(p0, "mb-5", "");
    			add_location(p0, file$b, 9, 6, 156);
    			add_location(p1, file$b, 15, 6, 409);
    			add_location(p2, file$b, 24, 6, 879);
    			add_location(p3, file$b, 34, 6, 1456);
    			attr_dev(div0, "class", "row bio-text text-justify clearfix");
    			add_location(div0, file$b, 8, 4, 101);
    			attr_dev(div1, "class", "container svelte-um51l");
    			add_location(div1, file$b, 7, 2, 73);
    			attr_dev(div2, "class", "bio");
    			add_location(div2, file$b, 6, 0, 53);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(div0, t5);
    			append_dev(div0, p3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Bio", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bio> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Bio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bio",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/components/Audio.svelte generated by Svelte v3.29.4 */

    const file$c = "src/components/Audio.svelte";

    function create_fragment$d(ctx) {
    	let div3;
    	let div2;
    	let h2;
    	let t1;
    	let figure0;
    	let figcaption0;
    	let t3;
    	let div0;
    	let audio0;
    	let source0;
    	let source0_src_value;
    	let t4;
    	let figure1;
    	let figcaption1;
    	let t6;
    	let div1;
    	let audio1;
    	let source1;
    	let source1_src_value;
    	let t7;
    	let audio2;
    	let audio2_src_value;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Listen:";
    			t1 = space();
    			figure0 = element("figure");
    			figcaption0 = element("figcaption");
    			figcaption0.textContent = "Bach Violin Sonata";
    			t3 = space();
    			div0 = element("div");
    			audio0 = element("audio");
    			source0 = element("source");
    			t4 = space();
    			figure1 = element("figure");
    			figcaption1 = element("figcaption");
    			figcaption1.textContent = "Bach Suite No. 2";
    			t6 = space();
    			div1 = element("div");
    			audio1 = element("audio");
    			source1 = element("source");
    			t7 = space();
    			audio2 = element("audio");
    			add_location(h2, file$c, 2, 4, 50);
    			add_location(figcaption0, file$c, 4, 6, 86);
    			if (source0.src !== (source0_src_value = "sounds/STE-022.wav")) attr_dev(source0, "src", source0_src_value);
    			attr_dev(source0, "type", "audio/wav");
    			add_location(source0, file$c, 8, 10, 243);
    			audio0.controls = true;
    			add_location(audio0, file$c, 7, 8, 216);
    			attr_dev(div0, "class", "color");
    			add_location(div0, file$c, 6, 6, 188);
    			add_location(figure0, file$c, 3, 4, 71);
    			add_location(figcaption1, file$c, 13, 6, 359);
    			if (source1.src !== (source1_src_value = "sounds/STE-026.mp3")) attr_dev(source1, "src", source1_src_value);
    			attr_dev(source1, "type", "audio/wav");
    			add_location(source1, file$c, 17, 10, 514);
    			audio1.controls = true;
    			add_location(audio1, file$c, 16, 8, 487);
    			attr_dev(div1, "class", "color");
    			add_location(div1, file$c, 15, 6, 459);
    			add_location(figure1, file$c, 12, 4, 344);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$c, 1, 2, 22);
    			attr_dev(div3, "class", "audio");
    			add_location(div3, file$c, 0, 0, 0);
    			if (audio2.src !== (audio2_src_value = "sounds/STE-026/mp3")) attr_dev(audio2, "src", audio2_src_value);
    			attr_dev(audio2, "class", "mejs__player");
    			attr_dev(audio2, "data-mejsoptions", "");
    			add_location(audio2, file$c, 24, 0, 673);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, h2);
    			append_dev(div2, t1);
    			append_dev(div2, figure0);
    			append_dev(figure0, figcaption0);
    			append_dev(figure0, t3);
    			append_dev(figure0, div0);
    			append_dev(div0, audio0);
    			append_dev(audio0, source0);
    			append_dev(div2, t4);
    			append_dev(div2, figure1);
    			append_dev(figure1, figcaption1);
    			append_dev(figure1, t6);
    			append_dev(figure1, div1);
    			append_dev(div1, audio1);
    			append_dev(audio1, source1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, audio2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(audio2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Audio", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Audio> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Audio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Audio",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/components/Gallery.svelte generated by Svelte v3.29.4 */

    const file$d = "src/components/Gallery.svelte";

    function create_fragment$e(ctx) {
    	let div29;
    	let div28;
    	let div6;
    	let div2;
    	let a0;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1;
    	let div5;
    	let a1;
    	let div4;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let div3;
    	let p1;
    	let t3;
    	let div13;
    	let div9;
    	let a2;
    	let div8;
    	let img2;
    	let img2_src_value;
    	let t4;
    	let div7;
    	let p2;
    	let t5;
    	let div12;
    	let a3;
    	let div11;
    	let img3;
    	let img3_src_value;
    	let t6;
    	let div10;
    	let p3;
    	let t7;
    	let div20;
    	let div16;
    	let a4;
    	let div15;
    	let img4;
    	let img4_src_value;
    	let t8;
    	let div14;
    	let p4;
    	let t9;
    	let div19;
    	let a5;
    	let div18;
    	let img5;
    	let img5_src_value;
    	let t10;
    	let div17;
    	let p5;
    	let t11;
    	let div27;
    	let div23;
    	let a6;
    	let div22;
    	let img6;
    	let img6_src_value;
    	let t12;
    	let div21;
    	let p6;
    	let t13;
    	let div26;
    	let a7;
    	let div25;
    	let img7;
    	let img7_src_value;
    	let t14;
    	let div24;
    	let p7;

    	const block = {
    		c: function create() {
    			div29 = element("div");
    			div28 = element("div");
    			div6 = element("div");
    			div2 = element("div");
    			a0 = element("a");
    			div1 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t1 = space();
    			div5 = element("div");
    			a1 = element("a");
    			div4 = element("div");
    			img1 = element("img");
    			t2 = space();
    			div3 = element("div");
    			p1 = element("p");
    			t3 = space();
    			div13 = element("div");
    			div9 = element("div");
    			a2 = element("a");
    			div8 = element("div");
    			img2 = element("img");
    			t4 = space();
    			div7 = element("div");
    			p2 = element("p");
    			t5 = space();
    			div12 = element("div");
    			a3 = element("a");
    			div11 = element("div");
    			img3 = element("img");
    			t6 = space();
    			div10 = element("div");
    			p3 = element("p");
    			t7 = space();
    			div20 = element("div");
    			div16 = element("div");
    			a4 = element("a");
    			div15 = element("div");
    			img4 = element("img");
    			t8 = space();
    			div14 = element("div");
    			p4 = element("p");
    			t9 = space();
    			div19 = element("div");
    			a5 = element("a");
    			div18 = element("div");
    			img5 = element("img");
    			t10 = space();
    			div17 = element("div");
    			p5 = element("p");
    			t11 = space();
    			div27 = element("div");
    			div23 = element("div");
    			a6 = element("a");
    			div22 = element("div");
    			img6 = element("img");
    			t12 = space();
    			div21 = element("div");
    			p6 = element("p");
    			t13 = space();
    			div26 = element("div");
    			a7 = element("a");
    			div25 = element("div");
    			img7 = element("img");
    			t14 = space();
    			div24 = element("div");
    			p7 = element("p");
    			if (img0.src !== (img0_src_value = "images/jimross.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "card-img");
    			add_location(img0, file$d, 6, 24, 310);
    			attr_dev(p0, "class", "card-text");
    			add_location(p0, file$d, 9, 28, 514);
    			attr_dev(div0, "class", "card-img-overlay");
    			add_location(div0, file$d, 7, 24, 389);
    			attr_dev(div1, "class", "card bg-dark text-white bg-white");
    			add_location(div1, file$d, 5, 20, 239);
    			attr_dev(a0, "href", "images/jimross.jpg");
    			attr_dev(a0, "data-toggle", "lightbox");
    			add_location(a0, file$d, 4, 16, 166);
    			attr_dev(div2, "class", "col-md-6");
    			add_location(div2, file$d, 3, 12, 127);
    			if (img1.src !== (img1_src_value = "images/laughing.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "card-img");
    			add_location(img1, file$d, 17, 20, 825);
    			attr_dev(p1, "class", "card-text");
    			add_location(p1, file$d, 20, 24, 1018);
    			attr_dev(div3, "class", "card-img-overlay");
    			add_location(div3, file$d, 18, 20, 901);
    			attr_dev(div4, "class", "card bg-dark text-white bg-white");
    			add_location(div4, file$d, 16, 16, 758);
    			attr_dev(a1, "href", "images/jimross.jpg");
    			attr_dev(a1, "data-toggle", "lightbox");
    			add_location(a1, file$d, 15, 16, 689);
    			attr_dev(div5, "class", "col-md-6");
    			add_location(div5, file$d, 14, 12, 650);
    			attr_dev(div6, "class", "row align-items-center content");
    			add_location(div6, file$d, 2, 8, 66);
    			if (img2.src !== (img2_src_value = "images/withmag.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			attr_dev(img2, "class", "card-img");
    			add_location(img2, file$d, 30, 20, 1393);
    			attr_dev(p2, "class", "card-text");
    			add_location(p2, file$d, 33, 24, 1585);
    			attr_dev(div7, "class", "card-img-overlay");
    			add_location(div7, file$d, 31, 20, 1468);
    			attr_dev(div8, "class", "card bg-dark text-white bg-white");
    			add_location(div8, file$d, 29, 16, 1326);
    			attr_dev(a2, "href", "images/jimross.jpg");
    			attr_dev(a2, "data-toggle", "lightbox");
    			add_location(a2, file$d, 28, 16, 1257);
    			attr_dev(div9, "class", "col-md-6");
    			add_location(div9, file$d, 27, 12, 1218);
    			if (img3.src !== (img3_src_value = "images/KR13.jpg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "");
    			attr_dev(img3, "class", "card-img");
    			add_location(img3, file$d, 41, 20, 1888);
    			attr_dev(p3, "class", "card-text");
    			add_location(p3, file$d, 44, 24, 2077);
    			attr_dev(div10, "class", "card-img-overlay");
    			add_location(div10, file$d, 42, 20, 1960);
    			attr_dev(div11, "class", "card bg-dark text-white bg-white");
    			add_location(div11, file$d, 40, 16, 1821);
    			attr_dev(a3, "href", "images/jimross.jpg");
    			attr_dev(a3, "data-toggle", "lightbox");
    			add_location(a3, file$d, 39, 16, 1752);
    			attr_dev(div12, "class", "col-md-6");
    			add_location(div12, file$d, 38, 12, 1713);
    			attr_dev(div13, "class", "row align-items-center content");
    			add_location(div13, file$d, 26, 8, 1157);
    			if (img4.src !== (img4_src_value = "images/withyenet.jpg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "");
    			attr_dev(img4, "class", "card-img");
    			add_location(img4, file$d, 54, 20, 2444);
    			attr_dev(p4, "class", "card-text");
    			add_location(p4, file$d, 57, 24, 2638);
    			attr_dev(div14, "class", "card-img-overlay");
    			add_location(div14, file$d, 55, 20, 2521);
    			attr_dev(div15, "class", "card bg-dark text-white bg-lightblue");
    			add_location(div15, file$d, 53, 16, 2373);
    			attr_dev(a4, "href", "images/jimross.jpg");
    			attr_dev(a4, "data-toggle", "lightbox");
    			add_location(a4, file$d, 52, 16, 2304);
    			attr_dev(div16, "class", "col-md-6");
    			add_location(div16, file$d, 51, 12, 2265);
    			if (img5.src !== (img5_src_value = "images/withpolet.jpg")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "");
    			attr_dev(img5, "class", "card-img");
    			add_location(img5, file$d, 65, 20, 2940);
    			attr_dev(p5, "class", "card-text");
    			add_location(p5, file$d, 68, 24, 3134);
    			attr_dev(div17, "class", "card-img-overlay");
    			add_location(div17, file$d, 66, 20, 3017);
    			attr_dev(div18, "class", "card bg-dark text-white bg-grey");
    			add_location(div18, file$d, 64, 16, 2874);
    			attr_dev(a5, "href", "images/jimross.jpg");
    			attr_dev(a5, "data-toggle", "lightbox");
    			add_location(a5, file$d, 63, 16, 2805);
    			attr_dev(div19, "class", "col-md-6");
    			add_location(div19, file$d, 62, 12, 2766);
    			attr_dev(div20, "class", "row align-items-center");
    			add_location(div20, file$d, 50, 8, 2216);
    			if (img6.src !== (img6_src_value = "images/quintet.jpg")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "");
    			attr_dev(img6, "class", "card-img");
    			add_location(img6, file$d, 78, 20, 3509);
    			attr_dev(p6, "class", "card-text");
    			add_location(p6, file$d, 81, 24, 3701);
    			attr_dev(div21, "class", "card-img-overlay");
    			add_location(div21, file$d, 79, 20, 3584);
    			attr_dev(div22, "class", "card bg-dark text-white bg-white");
    			add_location(div22, file$d, 77, 16, 3442);
    			attr_dev(a6, "href", "images/jimross.jpg");
    			attr_dev(a6, "data-toggle", "lightbox");
    			add_location(a6, file$d, 76, 16, 3373);
    			attr_dev(div23, "class", "col-md-6");
    			add_location(div23, file$d, 75, 12, 3334);
    			if (img7.src !== (img7_src_value = "images/fernando-student.jpg")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "");
    			attr_dev(img7, "class", "card-img");
    			add_location(img7, file$d, 89, 20, 4013);
    			attr_dev(p7, "class", "card-text");
    			add_location(p7, file$d, 92, 24, 4214);
    			attr_dev(div24, "class", "card-img-overlay");
    			add_location(div24, file$d, 90, 20, 4097);
    			attr_dev(div25, "class", "card bg-dark text-white bg-white");
    			add_location(div25, file$d, 88, 16, 3946);
    			attr_dev(a7, "href", "images/fernando-student.jpg");
    			attr_dev(a7, "data-toggle", "lightbox");
    			add_location(a7, file$d, 87, 16, 3868);
    			attr_dev(div26, "class", "col-md-6");
    			add_location(div26, file$d, 86, 12, 3829);
    			attr_dev(div27, "class", "row align-items-center content");
    			add_location(div27, file$d, 74, 8, 3273);
    			attr_dev(div28, "class", "container content");
    			add_location(div28, file$d, 1, 4, 26);
    			attr_dev(div29, "class", "gallery");
    			add_location(div29, file$d, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div29, anchor);
    			append_dev(div29, div28);
    			append_dev(div28, div6);
    			append_dev(div6, div2);
    			append_dev(div2, a0);
    			append_dev(a0, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, a1);
    			append_dev(a1, div4);
    			append_dev(div4, img1);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, p1);
    			append_dev(div28, t3);
    			append_dev(div28, div13);
    			append_dev(div13, div9);
    			append_dev(div9, a2);
    			append_dev(a2, div8);
    			append_dev(div8, img2);
    			append_dev(div8, t4);
    			append_dev(div8, div7);
    			append_dev(div7, p2);
    			append_dev(div13, t5);
    			append_dev(div13, div12);
    			append_dev(div12, a3);
    			append_dev(a3, div11);
    			append_dev(div11, img3);
    			append_dev(div11, t6);
    			append_dev(div11, div10);
    			append_dev(div10, p3);
    			append_dev(div28, t7);
    			append_dev(div28, div20);
    			append_dev(div20, div16);
    			append_dev(div16, a4);
    			append_dev(a4, div15);
    			append_dev(div15, img4);
    			append_dev(div15, t8);
    			append_dev(div15, div14);
    			append_dev(div14, p4);
    			append_dev(div20, t9);
    			append_dev(div20, div19);
    			append_dev(div19, a5);
    			append_dev(a5, div18);
    			append_dev(div18, img5);
    			append_dev(div18, t10);
    			append_dev(div18, div17);
    			append_dev(div17, p5);
    			append_dev(div28, t11);
    			append_dev(div28, div27);
    			append_dev(div27, div23);
    			append_dev(div23, a6);
    			append_dev(a6, div22);
    			append_dev(div22, img6);
    			append_dev(div22, t12);
    			append_dev(div22, div21);
    			append_dev(div21, p6);
    			append_dev(div27, t13);
    			append_dev(div27, div26);
    			append_dev(div26, a7);
    			append_dev(a7, div25);
    			append_dev(div25, img7);
    			append_dev(div25, t14);
    			append_dev(div25, div24);
    			append_dev(div24, p7);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div29);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Gallery", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Gallery> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Gallery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gallery",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/pages/About.svelte generated by Svelte v3.29.4 */

    function create_fragment$f(ctx) {
    	let bio;
    	let t0;
    	let audio;
    	let t1;
    	let gallery;
    	let current;
    	bio = new Bio({ $$inline: true });
    	audio = new Audio({ $$inline: true });
    	gallery = new Gallery({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(bio.$$.fragment);
    			t0 = space();
    			create_component(audio.$$.fragment);
    			t1 = space();
    			create_component(gallery.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(bio, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(audio, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(gallery, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bio.$$.fragment, local);
    			transition_in(audio.$$.fragment, local);
    			transition_in(gallery.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bio.$$.fragment, local);
    			transition_out(audio.$$.fragment, local);
    			transition_out(gallery.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bio, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(audio, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(gallery, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("About", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Bio, Audio, Gallery });
    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
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
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
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
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
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

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `string` starts with `search`
     * @param {string} string
     * @param {string} search
     * @return {boolean}
     */
    function startsWith(string, search) {
      return string.substr(0, search.length) === search;
    }

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Add the query to the pathname if a query is given
     * @param {string} pathname
     * @param {string} [query]
     * @return {string}
     */
    function addQuery(pathname, query) {
      return pathname + (query ? `?${query}` : "");
    }

    /**
     * Resolve URIs as though every path is a directory, no files. Relative URIs
     * in the browser can feel awkward because not only can you be "in a directory",
     * you can be "at a file", too. For example:
     *
     *  browserSpecResolve('foo', '/bar/') => /bar/foo
     *  browserSpecResolve('foo', '/bar') => /foo
     *
     * But on the command line of a file system, it's not as complicated. You can't
     * `cd` from a file, only directories. This way, links have to know less about
     * their current path. To go deeper you can do this:
     *
     *  <Link to="deeper"/>
     *  // instead of
     *  <Link to=`{${props.uri}/deeper}`/>
     *
     * Just like `cd`, if you want to go deeper from the command line, you do this:
     *
     *  cd deeper
     *  # not
     *  cd $(pwd)/deeper
     *
     * By treating every path as a directory, linking to relative paths should
     * require less contextual information and (fingers crossed) be more intuitive.
     * @param {string} to
     * @param {string} base
     * @return {string}
     */
    function resolve(to, base) {
      // /foo/bar, /baz/qux => /foo/bar
      if (startsWith(to, "/")) {
        return to;
      }

      const [toPathname, toQuery] = to.split("?");
      const [basePathname] = base.split("?");
      const toSegments = segmentize(toPathname);
      const baseSegments = segmentize(basePathname);

      // ?a=b, /users?b=c => /users?a=b
      if (toSegments[0] === "") {
        return addQuery(basePathname, toQuery);
      }

      // profile, /users/789 => /users/789/profile
      if (!startsWith(toSegments[0], ".")) {
        const pathname = baseSegments.concat(toSegments).join("/");

        return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
      }

      // ./       , /users/123 => /users/123
      // ../      , /users/123 => /users
      // ../..    , /users/123 => /
      // ../../one, /a/b/c/d   => /a/b/one
      // .././one , /a/b/c/d   => /a/b/c/one
      const allSegments = baseSegments.concat(toSegments);
      const segments = [];

      allSegments.forEach(segment => {
        if (segment === "..") {
          segments.pop();
        } else if (segment !== ".") {
          segments.push(segment);
        }
      });

      return addQuery("/" + segments.join("/"), toQuery);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    function hostMatches(anchor) {
      const host = location.host;
      return (
        anchor.host == host ||
        // svelte seems to kill anchor.host value in ie11, so fall back to checking href
        anchor.href.indexOf(`https://${host}`) === 0 ||
        anchor.href.indexOf(`http://${host}`) === 0
      )
    }

    /* node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.29.4 */

    function create_fragment$g(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let $routes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, ['default']);
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, "routes");
    	component_subscribe($$self, routes, value => $$invalidate(10, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(9, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(8, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ["basepath", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$base,
    		$location,
    		$routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 256) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			 {
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 1536) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			 {
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [routes, location, base, basepath, url, $$scope, slots];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.29.4 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 2,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[1],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, routeParams, $location*/ 530) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[1],
    		/*routeProps*/ ctx[2]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 22)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 2 && get_spread_object(/*routeParams*/ ctx[1]),
    					dirty & /*routeProps*/ 4 && get_spread_object(/*routeProps*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, ['default']);
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, value => $$invalidate(3, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("routeParams" in $$props) $$invalidate(1, routeParams = $$new_props.routeParams);
    		if ("routeProps" in $$props) $$invalidate(2, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 8) {
    			 if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(1, routeParams = $activeRoute.params);
    			}
    		}

    		 {
    			const { path, component, ...rest } = $$props;
    			$$invalidate(2, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-routing/src/Link.svelte generated by Svelte v3.29.4 */
    const file$e = "node_modules/svelte-routing/src/Link.svelte";

    function create_fragment$i(ctx) {
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{ "aria-current": /*ariaCurrent*/ ctx[2] },
    		/*props*/ ctx[1]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$e, 40, 0, 1249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*onClick*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1024) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty & /*href*/ 1) && { href: /*href*/ ctx[0] },
    				(!current || dirty & /*ariaCurrent*/ 4) && { "aria-current": /*ariaCurrent*/ ctx[2] },
    				dirty & /*props*/ 2 && /*props*/ ctx[1]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Link", slots, ['default']);
    	let { to = "#" } = $$props;
    	let { replace = false } = $$props;
    	let { state = {} } = $$props;
    	let { getProps = () => ({}) } = $$props;
    	const { base } = getContext(ROUTER);
    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(14, $base = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(15, $location = value));
    	const dispatch = createEventDispatcher();
    	let href, isPartiallyCurrent, isCurrent, props;

    	function onClick(event) {
    		dispatch("click", event);

    		if (shouldNavigate(event)) {
    			event.preventDefault();

    			// Don't push another entry to the history stack when the user
    			// clicks on a Link to the page they are currently on.
    			const shouldReplace = $location.pathname === href || replace;

    			navigate(href, { state, replace: shouldReplace });
    		}
    	}

    	const writable_props = ["to", "replace", "state", "getProps"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		ROUTER,
    		LOCATION,
    		navigate,
    		startsWith,
    		resolve,
    		shouldNavigate,
    		to,
    		replace,
    		state,
    		getProps,
    		base,
    		location,
    		dispatch,
    		href,
    		isPartiallyCurrent,
    		isCurrent,
    		props,
    		onClick,
    		$base,
    		$location,
    		ariaCurrent
    	});

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("isPartiallyCurrent" in $$props) $$invalidate(12, isPartiallyCurrent = $$props.isPartiallyCurrent);
    		if ("isCurrent" in $$props) $$invalidate(13, isCurrent = $$props.isCurrent);
    		if ("props" in $$props) $$invalidate(1, props = $$props.props);
    		if ("ariaCurrent" in $$props) $$invalidate(2, ariaCurrent = $$props.ariaCurrent);
    	};

    	let ariaCurrent;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*to, $base*/ 16448) {
    			 $$invalidate(0, href = to === "/" ? $base.uri : resolve(to, $base.uri));
    		}

    		if ($$self.$$.dirty & /*$location, href*/ 32769) {
    			 $$invalidate(12, isPartiallyCurrent = startsWith($location.pathname, href));
    		}

    		if ($$self.$$.dirty & /*href, $location*/ 32769) {
    			 $$invalidate(13, isCurrent = href === $location.pathname);
    		}

    		if ($$self.$$.dirty & /*isCurrent*/ 8192) {
    			 $$invalidate(2, ariaCurrent = isCurrent ? "page" : undefined);
    		}

    		if ($$self.$$.dirty & /*getProps, $location, href, isPartiallyCurrent, isCurrent*/ 45569) {
    			 $$invalidate(1, props = getProps({
    				location: $location,
    				href,
    				isPartiallyCurrent,
    				isCurrent
    			}));
    		}
    	};

    	return [
    		href,
    		props,
    		ariaCurrent,
    		base,
    		location,
    		onClick,
    		to,
    		replace,
    		state,
    		getProps,
    		$$scope,
    		slots
    	];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { to: 6, replace: 7, state: 8, getProps: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get to() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getProps() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getProps(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * A link action that can be added to <a href=""> tags rather
     * than using the <Link> component.
     *
     * Example:
     * ```html
     * <a href="/post/{postId}" use:link>{post.title}</a>
     * ```
     */
    function link(node) {
      function onClick(event) {
        const anchor = event.currentTarget;

        if (
          anchor.target === "" &&
          hostMatches(anchor) &&
          shouldNavigate(event)
        ) {
          event.preventDefault();
          navigate(anchor.pathname + anchor.search, { replace: anchor.hasAttribute("replace") });
        }
      }

      node.addEventListener("click", onClick);

      return {
        destroy() {
          node.removeEventListener("click", onClick);
        }
      };
    }

    /* src/components/Navbar/Navbar.svelte generated by Svelte v3.29.4 */
    const file$f = "src/components/Navbar/Navbar.svelte";

    function create_fragment$j(ctx) {
    	let div1;
    	let a0;
    	let t0;
    	let span;
    	let t2;
    	let div0;
    	let i;
    	let t3;
    	let nav;
    	let a1;
    	let link_action;
    	let t5;
    	let a2;
    	let link_action_1;
    	let t7;
    	let a3;
    	let link_action_2;
    	let t9;
    	let a4;
    	let link_action_3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a0 = element("a");
    			t0 = text("kip ");
    			span = element("span");
    			span.textContent = "riecken, viola";
    			t2 = space();
    			div0 = element("div");
    			i = element("i");
    			t3 = space();
    			nav = element("nav");
    			a1 = element("a");
    			a1.textContent = "About";
    			t5 = space();
    			a2 = element("a");
    			a2.textContent = "Lessons";
    			t7 = space();
    			a3 = element("a");
    			a3.textContent = "Blog";
    			t9 = space();
    			a4 = element("a");
    			a4.textContent = "Contact";
    			attr_dev(span, "class", "name");
    			add_location(span, file$f, 18, 71, 609);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "nav-link navbar-link-brand font-weight-light");
    			add_location(a0, file$f, 18, 2, 540);
    			attr_dev(i, "class", "fas fa-bars");
    			add_location(i, file$f, 19, 40, 695);
    			attr_dev(div0, "class", "nav-link nav-link-toggle");
    			add_location(div0, file$f, 19, 2, 657);
    			attr_dev(a1, "href", "/about");
    			attr_dev(a1, "class", "nav-link font-weight-light");
    			add_location(a1, file$f, 21, 4, 760);
    			attr_dev(a2, "href", "/lessons");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$f, 22, 4, 835);
    			attr_dev(a3, "href", "/blog");
    			attr_dev(a3, "class", "nav-link");
    			add_location(a3, file$f, 23, 4, 896);
    			attr_dev(a4, "href", "/contact");
    			attr_dev(a4, "class", "nav-link");
    			add_location(a4, file$f, 24, 4, 951);
    			attr_dev(nav, "class", "navbar-items");
    			add_location(nav, file$f, 20, 2, 729);
    			attr_dev(div1, "id", "mainNavbar");
    			attr_dev(div1, "class", "navbar fixed-top");
    			add_location(div1, file$f, 17, 0, 491);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a0);
    			append_dev(a0, t0);
    			append_dev(a0, span);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div1, t3);
    			append_dev(div1, nav);
    			append_dev(nav, a1);
    			append_dev(nav, t5);
    			append_dev(nav, a2);
    			append_dev(nav, t7);
    			append_dev(nav, a3);
    			append_dev(nav, t9);
    			append_dev(nav, a4);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a1)),
    					action_destroyer(link_action_1 = link.call(null, a2)),
    					action_destroyer(link_action_2 = link.call(null, a3)),
    					action_destroyer(link_action_3 = link.call(null, a4))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);

    	onMount(() => {
    		function classToggle() {
    			const navs = document.querySelectorAll(".navbar-items");
    			navs.forEach(nav => nav.classList.toggle("navbar-toggle-show"));
    		}

    		document.querySelector(".nav-link-toggle").addEventListener("click", classToggle);
    		document.querySelector(".navbar-items").addEventListener("click", classToggle);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link, onMount });
    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.29.4 */

    const file$g = "src/components/Footer.svelte";

    function create_fragment$k(ctx) {
    	let div2;
    	let hr;
    	let t0;
    	let div1;
    	let div0;
    	let a0;
    	let i0;
    	let t1;
    	let a1;
    	let i1;
    	let t2;
    	let a2;
    	let i2;
    	let t3;
    	let br;
    	let t4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			hr = element("hr");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t1 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t2 = space();
    			a2 = element("a");
    			i2 = element("i");
    			t3 = text("\n    © Copyright 2020 Kip Riecken\n    ");
    			br = element("br");
    			t4 = text("\n    Proudly self-designed.");
    			add_location(hr, file$g, 1, 2, 26);
    			attr_dev(i0, "class", "nav-link fab fa-instagram");
    			add_location(i0, file$g, 4, 42, 121);
    			attr_dev(a0, "href", "https://www.instagram.com");
    			add_location(a0, file$g, 4, 6, 85);
    			attr_dev(i1, "class", "nav-link fab fa-facebook-square");
    			add_location(i1, file$g, 6, 41, 216);
    			attr_dev(a1, "href", "https://www.facebook.com");
    			add_location(a1, file$g, 6, 6, 181);
    			attr_dev(i2, "class", "nav-link fab fa-twitter");
    			add_location(i2, file$g, 8, 40, 316);
    			attr_dev(a2, "href", "https://www.twitter.com");
    			add_location(a2, file$g, 8, 6, 282);
    			attr_dev(div0, "class", "social");
    			add_location(div0, file$g, 3, 4, 58);
    			add_location(br, file$g, 11, 4, 406);
    			attr_dev(div1, "class", "footer");
    			add_location(div1, file$g, 2, 2, 33);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$g, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, hr);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, i0);
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			append_dev(a1, i1);
    			append_dev(div0, t2);
    			append_dev(div0, a2);
    			append_dev(a2, i2);
    			append_dev(div1, t3);
    			append_dev(div1, br);
    			append_dev(div1, t4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */

    // (15:0) <Router>
    function create_default_slot(ctx) {
    	let navbar;
    	let t0;
    	let route0;
    	let t1;
    	let route1;
    	let t2;
    	let route2;
    	let t3;
    	let route3;
    	let t4;
    	let route4;
    	let t5;
    	let footer;
    	let current;
    	navbar = new Navbar({ $$inline: true });

    	route0 = new Route({
    			props: { path: "/", component: Home },
    			$$inline: true
    		});

    	route1 = new Route({
    			props: { path: "/about", component: About },
    			$$inline: true
    		});

    	route2 = new Route({
    			props: { path: "/lessons", component: Lessons },
    			$$inline: true
    		});

    	route3 = new Route({
    			props: { path: "/blog", component: Blog },
    			$$inline: true
    		});

    	route4 = new Route({
    			props: { path: "/contact", component: Contact },
    			$$inline: true
    		});

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(route0.$$.fragment);
    			t1 = space();
    			create_component(route1.$$.fragment);
    			t2 = space();
    			create_component(route2.$$.fragment);
    			t3 = space();
    			create_component(route3.$$.fragment);
    			t4 = space();
    			create_component(route4.$$.fragment);
    			t5 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(route0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(route1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(route2, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(route3, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(route4, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			transition_in(route4.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			transition_out(route4.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(route0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(route1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(route2, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(route3, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(route4, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(15:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Home,
    		Blog,
    		Contact,
    		Lessons,
    		About,
    		Router,
    		Route,
    		Link,
    		Navbar,
    		Footer
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
