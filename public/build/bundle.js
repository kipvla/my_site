
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quadOut(t) {
        return -t * (t - 2.0);
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/components/Home/Hero.svelte generated by Svelte v3.29.4 */
    const file = "src/components/Home/Hero.svelte";

    function create_fragment(ctx) {
    	let div;
    	let div_intro;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "hero svelte-10ijpeq");
    			add_location(div, file, 5, 0, 106);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, {
    						delay: 300,
    						duration: 2500,
    						easing: identity
    					});

    					div_intro.start();
    				});
    			}
    		},
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Hero", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fade, linear: identity });
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

    function create_fragment$1(ctx) {
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$1.name
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

    function create_fragment$2(ctx) {
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$2.name
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
    const file$1 = "node_modules/svelte-routing/src/Link.svelte";

    function create_fragment$3(ctx) {
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
    			add_location(a, file$1, 40, 0, 1249);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { to: 6, replace: 7, state: 8, getProps: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$3.name
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

    /* src/components/Home/ShortBio.svelte generated by Svelte v3.29.4 */
    const file$2 = "src/components/Home/ShortBio.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let a;
    	let link_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Hi, I’m Kip. Welcome! That’s a viola. I am a longtime musician, but have\n      so many interests. Click below to find out more!";
    			t1 = space();
    			p1 = element("p");
    			a = element("a");
    			a.textContent = "About me";
    			attr_dev(p0, "class", "py-5");
    			add_location(p0, file$2, 8, 4, 188);
    			attr_dev(a, "class", "btn");
    			attr_dev(a, "href", "/about");
    			add_location(a, file$2, 12, 25, 373);
    			attr_dev(p1, "class", "text-dark");
    			add_location(p1, file$2, 12, 4, 352);
    			attr_dev(div0, "class", "container w-100 text-justify p-5 d-flex flex-column align-items-center");
    			add_location(div0, file$2, 5, 2, 92);
    			attr_dev(div1, "class", "short-bio py-5");
    			add_location(div1, file$2, 4, 0, 61);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, a);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
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
    	validate_slots("ShortBio", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ShortBio> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link });
    	return [];
    }

    class ShortBio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShortBio",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Home/Videos.svelte generated by Svelte v3.29.4 */

    const file$3 = "src/components/Home/Videos.svelte";

    function create_fragment$5(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let div0;
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
    			div0.textContent = "Kip on YouTube";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			iframe = element("iframe");
    			attr_dev(div0, "class", "col-12 col-md-6");
    			add_location(div0, file$3, 3, 6, 79);
    			attr_dev(iframe, "class", "resp-iframe");
    			attr_dev(iframe, "title", "Gribby");
    			if (iframe.src !== (iframe_src_value = "https://www.youtube.com/embed/pN1ZA6hWd3s")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$3, 8, 10, 220);
    			attr_dev(div1, "class", "videos");
    			add_location(div1, file$3, 7, 8, 189);
    			attr_dev(div2, "class", "col-12 col-md-6");
    			add_location(div2, file$3, 6, 6, 151);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$3, 2, 4, 55);
    			attr_dev(div4, "class", "container py-5");
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Videos",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/pages/Home.svelte generated by Svelte v3.29.4 */

    function create_fragment$6(ctx) {
    	let hero;
    	let t0;
    	let shortbio;
    	let t1;
    	let videos;
    	let current;
    	hero = new Hero({ $$inline: true });
    	shortbio = new ShortBio({ $$inline: true });
    	videos = new Videos({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(hero.$$.fragment);
    			t0 = space();
    			create_component(shortbio.$$.fragment);
    			t1 = space();
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
    			mount_component(videos, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hero.$$.fragment, local);
    			transition_in(shortbio.$$.fragment, local);
    			transition_in(videos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hero.$$.fragment, local);
    			transition_out(shortbio.$$.fragment, local);
    			transition_out(videos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(hero, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(shortbio, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(videos, detaching);
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
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Hero, ShortBio, Videos });
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Blog/Posts/Post1.svelte generated by Svelte v3.29.4 */
    const file$4 = "src/components/Blog/Posts/Post1.svelte";

    // (15:2) {:else}
    function create_else_block$1(ctx) {
    	let h1;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let p2;
    	let t8;
    	let p3;
    	let t9;
    	let strong;
    	let t11;
    	let t12;
    	let p4;
    	let t14;
    	let p5;
    	let t16;
    	let p6;
    	let t18;
    	let p7;
    	let t20;
    	let p8;
    	let t22;
    	let p9;
    	let t24;
    	let p10;
    	let t26;
    	let ul;
    	let li0;
    	let t28;
    	let li1;
    	let t30;
    	let li2;
    	let t32;
    	let li3;
    	let t34;
    	let p11;
    	let t36;
    	let a;
    	let link_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "How to Lie Down";
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "I practice active rest just about every day, and have been doing so for\n    about 10 years. I welcome you to try it.";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "The basics:";
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "Find a quiet area where you won’t be disturbed. If the surface is not soft\n    or carpeted, place a yoga mat or towel on the ground. Place a stack of books\n    on the ground that support your neck.";
    			t8 = space();
    			p3 = element("p");
    			t9 = text("Tips for determining the height of books - if you stand with your back\n    against a wall, chances are, unless you really strain your neck, the back of\n    your head will not touch the wall. ");
    			strong = element("strong");
    			strong.textContent = "This is the straining you’re trying to prevent with the books.";
    			t11 = text(" Books can be substituted with anything with a similar gentle firmness - a pillow\n    or cushion, however, likely won’t provide the correct structure and thus may\n    do more harm than good.");
    			t12 = space();
    			p4 = element("p");
    			p4.textContent = "Essentially, you’re looking for the amount of books that allow the front of\n    your neck to stay free while the back of your neck also stays free.";
    			t14 = space();
    			p5 = element("p");
    			p5.textContent = "The opportunity this position provides, after all, is to that in which one\n    might experience of not “using” the neck as actively as we might be used to\n    in daily life - often a little too much. You may be thinking - no way, I\n    know how to use my neck! Well, great! But just know that the benefits from\n    improvement in this instance might be quite favorable.";
    			t16 = space();
    			p6 = element("p");
    			p6.textContent = "Think about it - that “pain in the neck”, or a neck-ache or whatever.";
    			t18 = space();
    			p7 = element("p");
    			p7.textContent = "Giving yourself a chance to release the neck is to practice a skill you may\n    find coming in handy in many instances.";
    			t20 = space();
    			p8 = element("p");
    			p8.textContent = "Once you have the correct number of books, place them in a pile on one of\n    the ends of the mat. This is where you will rest your head.";
    			t22 = space();
    			p9 = element("p");
    			p9.textContent = "This position aims to help us release out of the habit of pulling our heads\n    back and down. But don’t really worry about exactly what that means. It’s\n    meant to allow us to release our neck, and possibly more.";
    			t24 = space();
    			p10 = element("p");
    			p10.textContent = "So just start there, and if you’d like, try some of these thoughts.";
    			t26 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "I never have to move again";
    			t28 = space();
    			li1 = element("li");
    			li1.textContent = "I am what I am, and that’s fine";
    			t30 = space();
    			li2 = element("li");
    			li2.textContent = "My neck has to do nothing";
    			t32 = space();
    			li3 = element("li");
    			li3.textContent = "I am melting into the floor";
    			t34 = space();
    			p11 = element("p");
    			p11.textContent = "Practicing this lie down, and learning AT, can help in ways that you may not\n    have expected. And it can all just start with this simple practice.";
    			t36 = space();
    			a = element("a");
    			a.textContent = "Back to blogs";
    			add_location(h1, file$4, 15, 2, 447);
    			if (img.src !== (img_src_value = "/images/kangaroo.jpeg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "w-50 m-5 shadow");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 16, 2, 474);
    			add_location(p0, file$4, 17, 2, 543);
    			add_location(p1, file$4, 21, 2, 677);
    			add_location(p2, file$4, 22, 2, 698);
    			add_location(strong, file$4, 30, 39, 1112);
    			add_location(p3, file$4, 27, 2, 913);
    			add_location(p4, file$4, 36, 2, 1403);
    			add_location(p5, file$4, 40, 2, 1568);
    			add_location(p6, file$4, 47, 2, 1955);
    			add_location(p7, file$4, 48, 2, 2034);
    			add_location(p8, file$4, 52, 2, 2171);
    			add_location(p9, file$4, 56, 2, 2326);
    			add_location(p10, file$4, 61, 2, 2559);
    			add_location(li0, file$4, 64, 4, 2646);
    			add_location(li1, file$4, 65, 4, 2686);
    			add_location(li2, file$4, 66, 4, 2731);
    			add_location(li3, file$4, 67, 4, 2770);
    			add_location(ul, file$4, 63, 2, 2637);
    			add_location(p11, file$4, 69, 2, 2817);
    			attr_dev(a, "href", "/blog");
    			attr_dev(a, "class", "btn");
    			add_location(a, file$4, 73, 2, 2983);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, img, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t9);
    			append_dev(p3, strong);
    			append_dev(p3, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, p5, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, p6, anchor);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, p7, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, p8, anchor);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, p9, anchor);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, p10, anchor);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t28);
    			append_dev(ul, li1);
    			append_dev(ul, t30);
    			append_dev(ul, li2);
    			append_dev(ul, t32);
    			append_dev(ul, li3);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, p11, anchor);
    			insert_dev(target, t36, anchor);
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(p9);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(p10);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(p11);
    			if (detaching) detach_dev(t36);
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(15:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (7:2) {#if short}
    function create_if_block$1(ctx) {
    	let h1;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let p;
    	let t4;
    	let a;
    	let link_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "How to Lie Down";
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			p = element("p");
    			p.textContent = "I practice active rest just about every day, and have been doing so for\n    about 10 years. I welcome you to try it.";
    			t4 = space();
    			a = element("a");
    			a.textContent = "More";
    			add_location(h1, file$4, 7, 2, 157);
    			if (img.src !== (img_src_value = "/images/kangaroo.jpeg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "w-50 m-5 shadow");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 8, 2, 184);
    			add_location(p, file$4, 9, 2, 253);
    			attr_dev(a, "href", "/blog/1");
    			attr_dev(a, "class", "btn");
    			add_location(a, file$4, 13, 2, 387);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, img, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(7:2) {#if short}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*short*/ ctx[0]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container d-flex flex-column align-items-center");
    			add_location(div, file$4, 5, 0, 79);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Post1", slots, []);
    	let { short } = $$props;
    	const writable_props = ["short"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Post1> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("short" in $$props) $$invalidate(0, short = $$props.short);
    	};

    	$$self.$capture_state = () => ({ link, short });

    	$$self.$inject_state = $$props => {
    		if ("short" in $$props) $$invalidate(0, short = $$props.short);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [short];
    }

    class Post1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { short: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Post1",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*short*/ ctx[0] === undefined && !("short" in props)) {
    			console.warn("<Post1> was created without expected prop 'short'");
    		}
    	}

    	get short() {
    		throw new Error("<Post1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set short(value) {
    		throw new Error("<Post1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Blog/Blogs.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;

    function create_fragment$8(ctx) {
    	let post1;
    	let current;
    	post1 = new Post1({ props: { short: true }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(post1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(post1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(post1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(post1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(post1, detaching);
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
    	validate_slots("Blogs", slots, []);

    	const fetchBlogs = fetch(`/api/blogposts`).then(data => {
    		console.log("succ", data);
    		return data.json();
    	}).catch(data => {
    		console.log("error", data);
    		return data;
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Blogs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Post1, fetchBlogs });
    	return [];
    }

    class Blogs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Blogs",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/pages/Blog.svelte generated by Svelte v3.29.4 */
    const file$5 = "src/pages/Blog.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let blogs;
    	let current;
    	blogs = new Blogs({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(blogs.$$.fragment);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file$5, 6, 2, 149);
    			attr_dev(div1, "class", "content svelte-uhes0j");
    			add_location(div1, file$5, 5, 0, 125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(blogs, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(blogs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(blogs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(blogs);
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

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Blog", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Blog> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Blogs });
    	return [];
    }

    class Blog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Blog",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/Contact/Form.svelte generated by Svelte v3.29.4 */

    const file$6 = "src/components/Contact/Form.svelte";

    function create_fragment$a(ctx) {
    	let div3;
    	let h1;
    	let t1;
    	let form;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div2;
    	let label2;
    	let t9;
    	let textarea;
    	let t10;
    	let input2;
    	let t11;
    	let input3;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Say hello";
    			t1 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Your name:";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Your email:";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Your message:";
    			t9 = space();
    			textarea = element("textarea");
    			t10 = space();
    			input2 = element("input");
    			t11 = space();
    			input3 = element("input");
    			attr_dev(h1, "class", "display-3 py-4");
    			add_location(h1, file$6, 4, 2, 153);
    			attr_dev(label0, "for", "name");
    			add_location(label0, file$6, 11, 6, 327);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "name");
    			attr_dev(input0, "name", "name");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "Name");
    			add_location(input0, file$6, 12, 6, 372);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$6, 10, 4, 296);
    			attr_dev(label1, "for", "_replyto");
    			add_location(label1, file$6, 15, 6, 501);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "_replyto");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Email");
    			add_location(input1, file$6, 16, 6, 551);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$6, 14, 4, 470);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$6, 19, 6, 675);
    			attr_dev(textarea, "name", "message");
    			attr_dev(textarea, "rows", "8");
    			attr_dev(textarea, "class", "form-control svelte-1l0srdu");
    			attr_dev(textarea, "placeholder", "Message");
    			add_location(textarea, file$6, 21, 6, 717);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$6, 18, 4, 644);
    			attr_dev(input2, "type", "submit");
    			attr_dev(input2, "class", "btn");
    			input2.value = "Submit";
    			add_location(input2, file$6, 23, 4, 811);
    			attr_dev(input3, "type", "hidden");
    			attr_dev(input3, "name", "_next");
    			input3.value = "//site.io/thanks.html";
    			add_location(input3, file$6, 24, 4, 866);
    			attr_dev(form, "action", "https://formspree.io/f/xpzolpwz");
    			attr_dev(form, "class", "text-left");
    			attr_dev(form, "method", "POST");
    			add_location(form, file$6, 5, 2, 197);
    			attr_dev(div3, "class", "contact-form container d-flex py-5 my-5 flex-column justify-content-around align-items-center flex-wrap svelte-1l0srdu");
    			set_style(div3, "text-align", "center");
    			add_location(div3, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h1);
    			append_dev(div3, t1);
    			append_dev(div3, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			append_dev(form, t4);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			append_dev(form, t7);
    			append_dev(form, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t9);
    			append_dev(div2, textarea);
    			append_dev(form, t10);
    			append_dev(form, input2);
    			append_dev(form, t11);
    			append_dev(form, input3);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/pages/Contact.svelte generated by Svelte v3.29.4 */
    const file$7 = "src/pages/Contact.svelte";

    function create_fragment$b(ctx) {
    	let div;
    	let form;
    	let t;
    	let img;
    	let img_src_value;
    	let current;
    	form = new Form({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(form.$$.fragment);
    			t = space();
    			img = element("img");
    			if (img.src !== (img_src_value = "images/KR12-min.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "m-5 order-md-0 shadow svelte-3ctu8s");
    			attr_dev(img, "alt", "");
    			add_location(img, file$7, 7, 2, 192);
    			attr_dev(div, "class", "d-flex mt-5 flex-wrap justify-content-center");
    			add_location(div, file$7, 5, 0, 120);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(form, div, null);
    			append_dev(div, t);
    			append_dev(div, img);
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
    			destroy_component(form);
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
    	validate_slots("Contact", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fade, Form });
    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/Lessons/Lesson.svelte generated by Svelte v3.29.4 */
    const file$8 = "src/components/Lessons/Lesson.svelte";

    function create_fragment$c(ctx) {
    	let div6;
    	let div5;
    	let div0;
    	let a;
    	let t1;
    	let p0;
    	let t3;
    	let ul;
    	let li0;
    	let t5;
    	let li1;
    	let t7;
    	let li2;
    	let t9;
    	let li3;
    	let t11;
    	let div4;
    	let div1;
    	let h30;
    	let t13;
    	let h50;
    	let t15;
    	let p1;
    	let t16;
    	let div2;
    	let h31;
    	let t18;
    	let h51;
    	let t20;
    	let p2;
    	let t21;
    	let div3;
    	let h32;
    	let t23;
    	let h52;
    	let t25;
    	let p3;
    	let div6_intro;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "Contact Kip";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "In over twenty years of orchestral playing, and almost 30 years of\n        playing music, I have often noticed musicians not playing to their\n        potential and not enjoying what they do. I want to help change that. Working with me, we will:";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Deepen your connection with the music";
    			t5 = space();
    			li1 = element("li");
    			li1.textContent = "Find a more sustainable way of playing";
    			t7 = space();
    			li2 = element("li");
    			li2.textContent = "Create a more balanced approach to practicing and performing";
    			t9 = space();
    			li3 = element("li");
    			li3.textContent = "Learn to prevent injuries and feel better";
    			t11 = space();
    			div4 = element("div");
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Viola lesson";
    			t13 = space();
    			h50 = element("h5");
    			h50.textContent = "30 or 60 minutes";
    			t15 = space();
    			p1 = element("p");
    			t16 = space();
    			div2 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Violin lesson";
    			t18 = space();
    			h51 = element("h5");
    			h51.textContent = "30 or 60 minutes";
    			t20 = space();
    			p2 = element("p");
    			t21 = space();
    			div3 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Movement coaching (all instruments)";
    			t23 = space();
    			h52 = element("h5");
    			h52.textContent = "30 or 60 minutes";
    			t25 = space();
    			p3 = element("p");
    			attr_dev(a, "href", "mailto:kipriecken@gmail.com");
    			attr_dev(a, "class", "btn btn-lg my-5 align-self-center");
    			add_location(a, file$8, 7, 6, 196);
    			add_location(p0, file$8, 8, 6, 298);
    			add_location(li0, file$8, 14, 8, 585);
    			add_location(li1, file$8, 15, 8, 640);
    			add_location(li2, file$8, 16, 8, 696);
    			add_location(li3, file$8, 17, 8, 774);
    			add_location(ul, file$8, 13, 6, 572);
    			add_location(div0, file$8, 6, 4, 184);
    			add_location(h30, file$8, 22, 8, 931);
    			add_location(h50, file$8, 23, 8, 961);
    			add_location(p1, file$8, 24, 8, 995);
    			attr_dev(div1, "class", "lesson-type");
    			add_location(div1, file$8, 21, 6, 897);
    			add_location(h31, file$8, 27, 8, 1054);
    			add_location(h51, file$8, 28, 8, 1085);
    			add_location(p2, file$8, 29, 8, 1119);
    			attr_dev(div2, "class", "lesson-type");
    			add_location(div2, file$8, 26, 6, 1020);
    			add_location(h32, file$8, 32, 8, 1178);
    			add_location(h52, file$8, 33, 8, 1231);
    			add_location(p3, file$8, 34, 8, 1265);
    			attr_dev(div3, "class", "lesson-type");
    			add_location(div3, file$8, 31, 6, 1144);
    			attr_dev(div4, "class", "container text-left pt-4");
    			add_location(div4, file$8, 20, 4, 852);
    			attr_dev(div5, "class", "lesson-option");
    			add_location(div5, file$8, 5, 2, 152);
    			attr_dev(div6, "class", "container text-left mt-5");
    			add_location(div6, file$8, 4, 0, 63);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, a);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(ul, t9);
    			append_dev(ul, li3);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, h30);
    			append_dev(div1, t13);
    			append_dev(div1, h50);
    			append_dev(div1, t15);
    			append_dev(div1, p1);
    			append_dev(div4, t16);
    			append_dev(div4, div2);
    			append_dev(div2, h31);
    			append_dev(div2, t18);
    			append_dev(div2, h51);
    			append_dev(div2, t20);
    			append_dev(div2, p2);
    			append_dev(div4, t21);
    			append_dev(div4, div3);
    			append_dev(div3, h32);
    			append_dev(div3, t23);
    			append_dev(div3, h52);
    			append_dev(div3, t25);
    			append_dev(div3, p3);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!div6_intro) {
    				add_render_callback(() => {
    					div6_intro = create_in_transition(div6, fly, { x: 200, delay: 1000, duration: 4000 });
    					div6_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
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

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lesson", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lesson> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly });
    	return [];
    }

    class Lesson extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lesson",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/pages/Lessons.svelte generated by Svelte v3.29.4 */
    const file$9 = "src/pages/Lessons.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_intro;
    	let t;
    	let lesson;
    	let current;
    	lesson = new Lesson({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t = space();
    			create_component(lesson.$$.fragment);
    			if (img.src !== (img_src_value = "images/KR13-min.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "lesson-img");
    			attr_dev(img, "alt", "");
    			add_location(img, file$9, 7, 2, 159);
    			attr_dev(div, "class", "lessons-container");
    			add_location(div, file$9, 6, 0, 125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t);
    			mount_component(lesson, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			if (!img_intro) {
    				add_render_callback(() => {
    					img_intro = create_in_transition(img, fade, { duration: 2000 });
    					img_intro.start();
    				});
    			}

    			transition_in(lesson.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lesson.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(lesson);
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

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lessons", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lessons> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fade, Lesson });
    	return [];
    }

    class Lessons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lessons",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/components/Carousel.svelte generated by Svelte v3.29.4 */

    const file$a = "src/components/Carousel.svelte";

    function create_fragment$e(ctx) {
    	let div4;
    	let ol;
    	let li0;
    	let t0;
    	let li1;
    	let t1;
    	let li2;
    	let t2;
    	let div3;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t3;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t4;
    	let div2;
    	let img2;
    	let img2_src_value;
    	let t5;
    	let a0;
    	let span0;
    	let t6;
    	let span1;
    	let t8;
    	let a1;
    	let span2;
    	let t9;
    	let span3;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			t0 = space();
    			li1 = element("li");
    			t1 = space();
    			li2 = element("li");
    			t2 = space();
    			div3 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t3 = space();
    			div1 = element("div");
    			img1 = element("img");
    			t4 = space();
    			div2 = element("div");
    			img2 = element("img");
    			t5 = space();
    			a0 = element("a");
    			span0 = element("span");
    			t6 = space();
    			span1 = element("span");
    			span1.textContent = "Previous";
    			t8 = space();
    			a1 = element("a");
    			span2 = element("span");
    			t9 = space();
    			span3 = element("span");
    			span3.textContent = "Next";
    			attr_dev(li0, "data-target", "#carouselExampleIndicators");
    			attr_dev(li0, "data-slide-to", "0");
    			attr_dev(li0, "class", "active");
    			add_location(li0, file$a, 48, 6, 825);
    			attr_dev(li1, "data-target", "#carouselExampleIndicators");
    			attr_dev(li1, "data-slide-to", "1");
    			add_location(li1, file$a, 49, 6, 915);
    			attr_dev(li2, "data-target", "#carouselExampleIndicators");
    			attr_dev(li2, "data-slide-to", "2");
    			add_location(li2, file$a, 50, 6, 990);
    			attr_dev(ol, "class", "carousel-indicators");
    			add_location(ol, file$a, 47, 4, 786);
    			attr_dev(img0, "class", "d-block w-100");
    			if (img0.src !== (img0_src_value = "images/renato-student.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "First slide");
    			add_location(img0, file$a, 54, 8, 1151);
    			attr_dev(div0, "class", "carousel-item active svelte-18n2ijv");
    			add_location(div0, file$a, 53, 6, 1108);
    			attr_dev(img1, "class", "d-block w-100");
    			if (img1.src !== (img1_src_value = "images/jimross.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Second slide");
    			add_location(img1, file$a, 57, 8, 1284);
    			attr_dev(div1, "class", "carousel-item svelte-18n2ijv");
    			add_location(div1, file$a, 56, 6, 1248);
    			attr_dev(img2, "class", "d-block w-100");
    			if (img2.src !== (img2_src_value = "images/laughing.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Third slide");
    			add_location(img2, file$a, 60, 8, 1411);
    			attr_dev(div2, "class", "carousel-item svelte-18n2ijv");
    			add_location(div2, file$a, 59, 6, 1375);
    			attr_dev(div3, "class", "carousel-inner");
    			add_location(div3, file$a, 52, 4, 1073);
    			attr_dev(span0, "class", "carousel-control-prev-icon");
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$a, 64, 6, 1617);
    			attr_dev(span1, "class", "sr-only");
    			add_location(span1, file$a, 65, 6, 1691);
    			attr_dev(a0, "class", "carousel-control-prev");
    			attr_dev(a0, "href", "#carouselExampleIndicators");
    			attr_dev(a0, "role", "button");
    			attr_dev(a0, "data-slide", "prev");
    			add_location(a0, file$a, 63, 4, 1511);
    			attr_dev(span2, "class", "carousel-control-next-icon");
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$a, 68, 6, 1848);
    			attr_dev(span3, "class", "sr-only");
    			add_location(span3, file$a, 69, 6, 1922);
    			attr_dev(a1, "class", "carousel-control-next");
    			attr_dev(a1, "href", "#carouselExampleIndicators");
    			attr_dev(a1, "role", "button");
    			attr_dev(a1, "data-slide", "next");
    			add_location(a1, file$a, 67, 4, 1742);
    			attr_dev(div4, "id", "carouselExampleIndicators");
    			attr_dev(div4, "class", "carousel slide shadow mb-3 svelte-18n2ijv");
    			attr_dev(div4, "data-ride", "carousel");
    			add_location(div4, file$a, 46, 0, 689);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, ol);
    			append_dev(ol, li0);
    			append_dev(ol, t0);
    			append_dev(ol, li1);
    			append_dev(ol, t1);
    			append_dev(ol, li2);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, img0);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div1, img1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, img2);
    			append_dev(div4, t5);
    			append_dev(div4, a0);
    			append_dev(a0, span0);
    			append_dev(a0, t6);
    			append_dev(a0, span1);
    			append_dev(div4, t8);
    			append_dev(div4, a1);
    			append_dev(a1, span2);
    			append_dev(a1, t9);
    			append_dev(a1, span3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
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
    	validate_slots("Carousel", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Carousel> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Carousel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Carousel",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/components/About/Bio.svelte generated by Svelte v3.29.4 */
    const file$b = "src/components/About/Bio.svelte";

    // (56:6) {#if showButton}
    function create_if_block_7(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*more*/ ctx[1]) return create_if_block_8;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			attr_dev(button, "class", "btn my-2");
    			attr_dev(button, "id", "more");
    			add_location(button, file$b, 56, 8, 1602);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*showButtons*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(56:6) {#if showButton}",
    		ctx
    	});

    	return block;
    }

    // (60:10) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Find out more...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(60:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (58:11) {#if more}
    function create_if_block_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Less");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(58:11) {#if more}",
    		ctx
    	});

    	return block;
    }

    // (66:6) {#if more}
    function create_if_block$2(ctx) {
    	let button0;
    	let i0;
    	let t0;
    	let button0_intro;
    	let t1;
    	let t2;
    	let button1;
    	let i1;
    	let t3;
    	let button1_intro;
    	let t4;
    	let t5;
    	let button2;
    	let i2;
    	let t6;
    	let button2_intro;
    	let t7;
    	let t8;
    	let button3;
    	let i3;
    	let t9;
    	let button3_intro;
    	let t10;
    	let t11;
    	let button4;
    	let i4;
    	let t12;
    	let button4_intro;
    	let t13;
    	let t14;
    	let button5;
    	let i5;
    	let t15;
    	let button5_intro;
    	let t16;
    	let if_block5_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*music*/ ctx[2] && create_if_block_6(ctx);
    	let if_block1 = /*outreach*/ ctx[5] && create_if_block_5(ctx);
    	let if_block2 = /*at*/ ctx[3] && create_if_block_4(ctx);
    	let if_block3 = /*web*/ ctx[6] && create_if_block_3(ctx);
    	let if_block4 = /*photo*/ ctx[7] && create_if_block_2(ctx);
    	let if_block5 = /*teaching*/ ctx[4] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			i0 = element("i");
    			t0 = text(" Music");
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t3 = text(" Outreach");
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			button2 = element("button");
    			i2 = element("i");
    			t6 = text(" Alexander Technique");
    			t7 = space();
    			if (if_block2) if_block2.c();
    			t8 = space();
    			button3 = element("button");
    			i3 = element("i");
    			t9 = text(" Web design");
    			t10 = space();
    			if (if_block3) if_block3.c();
    			t11 = space();
    			button4 = element("button");
    			i4 = element("i");
    			t12 = text(" Photography");
    			t13 = space();
    			if (if_block4) if_block4.c();
    			t14 = space();
    			button5 = element("button");
    			i5 = element("i");
    			t15 = text(" Teaching");
    			t16 = space();
    			if (if_block5) if_block5.c();
    			if_block5_anchor = empty();
    			attr_dev(i0, "class", "fas fa-music svelte-41qe4r");
    			add_location(i0, file$b, 71, 11, 1982);
    			attr_dev(button0, "class", "btn bios my-2");
    			attr_dev(button0, "tabindex", "-1");
    			add_location(button0, file$b, 66, 8, 1818);
    			attr_dev(i1, "class", "fas fa-hands-helping svelte-41qe4r");
    			add_location(i1, file$b, 103, 11, 3027);
    			attr_dev(button1, "class", "btn bios my-2");
    			add_location(button1, file$b, 99, 8, 2869);
    			attr_dev(i2, "class", "fas fa-walking svelte-41qe4r");
    			add_location(i2, file$b, 145, 11, 5156);
    			attr_dev(button2, "class", "btn bios my-2");
    			add_location(button2, file$b, 141, 8, 5010);
    			attr_dev(i3, "class", "fas fa-laptop-code svelte-41qe4r");
    			add_location(i3, file$b, 192, 11, 7043);
    			attr_dev(button3, "class", "btn bios my-2");
    			add_location(button3, file$b, 188, 8, 6895);
    			attr_dev(i4, "class", "fas fa-camera svelte-41qe4r");
    			add_location(i4, file$b, 210, 11, 7836);
    			attr_dev(button4, "class", "btn bios my-2");
    			add_location(button4, file$b, 206, 8, 7684);
    			attr_dev(i5, "class", "fas fa-chalkboard-teacher svelte-41qe4r");
    			add_location(i5, file$b, 225, 11, 8280);
    			attr_dev(button5, "class", "btn bios my-2");
    			add_location(button5, file$b, 221, 8, 8121);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, i0);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, i1);
    			append_dev(button1, t3);
    			insert_dev(target, t4, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button2, anchor);
    			append_dev(button2, i2);
    			append_dev(button2, t6);
    			insert_dev(target, t7, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, button3, anchor);
    			append_dev(button3, i3);
    			append_dev(button3, t9);
    			insert_dev(target, t10, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, button4, anchor);
    			append_dev(button4, i4);
    			append_dev(button4, t12);
    			insert_dev(target, t13, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, button5, anchor);
    			append_dev(button5, i5);
    			append_dev(button5, t15);
    			insert_dev(target, t16, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert_dev(target, if_block5_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[11], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[12], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[13], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*music*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*music*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*outreach*/ ctx[5]) {
    				if (if_block1) {
    					if (dirty & /*outreach*/ 32) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t5.parentNode, t5);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*at*/ ctx[3]) {
    				if (if_block2) {
    					if (dirty & /*at*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t8.parentNode, t8);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*web*/ ctx[6]) {
    				if (if_block3) {
    					if (dirty & /*web*/ 64) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_3(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t11.parentNode, t11);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*photo*/ ctx[7]) {
    				if (if_block4) {
    					if (dirty & /*photo*/ 128) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_2(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(t14.parentNode, t14);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*teaching*/ ctx[4]) {
    				if (if_block5) {
    					if (dirty & /*teaching*/ 16) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_1$1(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(if_block5_anchor.parentNode, if_block5_anchor);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (!button0_intro) {
    				add_render_callback(() => {
    					button0_intro = create_in_transition(button0, fly, { duration: 500, x: 200 });
    					button0_intro.start();
    				});
    			}

    			transition_in(if_block0);

    			if (!button1_intro) {
    				add_render_callback(() => {
    					button1_intro = create_in_transition(button1, fly, { duration: 500, x: 200, delay: 200 });
    					button1_intro.start();
    				});
    			}

    			transition_in(if_block1);

    			if (!button2_intro) {
    				add_render_callback(() => {
    					button2_intro = create_in_transition(button2, fly, { duration: 500, x: 200, delay: 400 });
    					button2_intro.start();
    				});
    			}

    			transition_in(if_block2);

    			if (!button3_intro) {
    				add_render_callback(() => {
    					button3_intro = create_in_transition(button3, fly, { duration: 500, x: 200, delay: 600 });
    					button3_intro.start();
    				});
    			}

    			transition_in(if_block3);

    			if (!button4_intro) {
    				add_render_callback(() => {
    					button4_intro = create_in_transition(button4, fly, { duration: 500, x: 200, delay: 800 });
    					button4_intro.start();
    				});
    			}

    			transition_in(if_block4);

    			if (!button5_intro) {
    				add_render_callback(() => {
    					button5_intro = create_in_transition(button5, fly, { duration: 500, x: 200, delay: 1000 });
    					button5_intro.start();
    				});
    			}

    			transition_in(if_block5);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t4);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t7);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(button3);
    			if (detaching) detach_dev(t10);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(button4);
    			if (detaching) detach_dev(t13);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(button5);
    			if (detaching) detach_dev(t16);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach_dev(if_block5_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(66:6) {#if more}",
    		ctx
    	});

    	return block;
    }

    // (75:8) {#if music}
    function create_if_block_6(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let t1;
    	let a;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Spanning performances with the Chicago Symphony and Yo Yo Ma, and in\n            locations from Cuba to Carnegie Hall, I have had the fortune to\n            perform incredible works with incredible musicians. These\n            experiences constantly inspire me.";
    			t1 = space();
    			a = element("a");
    			a.textContent = "Performance with Yo-Yo Ma";
    			attr_dev(p, "class", "svelte-41qe4r");
    			add_location(p, file$b, 75, 10, 2064);
    			attr_dev(a, "class", "mb-3");
    			attr_dev(a, "href", "https://chicago.suntimes.com/2017/6/11/18378502/yo-yo-ma-performs-concert-for-peace-at-st-sabina-church");
    			add_location(a, file$b, 91, 10, 2598);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				if (!p_intro) p_intro = create_in_transition(p, fade, { duration: 1000 });
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();

    			p_outro = create_out_transition(p, scale, {
    				duration: 500,
    				delay: 0,
    				opacity: 0.3,
    				start: 0.5,
    				easing: quadOut
    			});

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(75:8) {#if music}",
    		ctx
    	});

    	return block;
    }

    // (107:8) {#if outreach}
    function create_if_block_5(ctx) {
    	let p0;
    	let t0;
    	let a0;
    	let t2;
    	let a1;
    	let t4;
    	let a2;
    	let t6;
    	let p0_transition;
    	let t7;
    	let p1;
    	let p1_transition;
    	let current;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("As a fellow at the Civic Orchestra of Chicago and New World\n            Symphony, the desire to connect to a more well-rounded life through\n            music inspired several initiatives, he designed and led several\n            initiatives, from connecting with the farmworkers community in South\n            Florida to securing Alexander Technique instruction for colleagues\n            in Chicago. In ");
    			a0 = element("a");
    			a0.textContent = "The Rediscovering Musician";
    			t2 = text(", I earned funding for a series of Alexander Technique lessons for\n            two Civic Orchestra colleagues from teacher\n            ");
    			a1 = element("a");
    			a1.textContent = "Lisa DeAngelis";
    			t4 = text(", as well as a\n            group class and\n            ");
    			a2 = element("a");
    			a2.textContent = "blog";
    			t6 = text("\n            .");
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "In Miami, I designed and led Farm to Stage, a project solidifying\n            the New World Symphony’s relationship with its community in Miami\n            through a collaboration with the Farmworker Association of Florida\n            in Homestead, Florida. This involved an interactive performance at\n            the New World Symphony Center in Miami Beach, and FWAF headquarters\n            in Homestead. The next year, I upped the ante to connect to South\n            Florida even more by recruiting 16 other New World fellows to join\n            for Damas y Caballeros, a project involving weekly Spanish lessons,\n            and three community performances in which the fellows spoke in\n            Spanish about the music.";
    			attr_dev(a0, "class", "mb-3");
    			attr_dev(a0, "href", "https://rediscoveringmusician.wordpress.com/");
    			add_location(a0, file$b, 113, 27, 3579);
    			attr_dev(a1, "href", "http://lisadeangelis.com/");
    			add_location(a1, file$b, 119, 12, 3868);
    			attr_dev(a2, "href", "https://rediscoveringmusician.wordpress.com/");
    			add_location(a2, file$b, 121, 12, 3977);
    			attr_dev(p0, "class", "svelte-41qe4r");
    			add_location(p0, file$b, 107, 10, 3123);
    			attr_dev(p1, "class", "svelte-41qe4r");
    			add_location(p1, file$b, 125, 10, 4081);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, a0);
    			append_dev(p0, t2);
    			append_dev(p0, a1);
    			append_dev(p0, t4);
    			append_dev(p0, a2);
    			append_dev(p0, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p1, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!p0_transition) p0_transition = create_bidirectional_transition(p0, fade, { duration: 1000 }, true);
    				p0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!p1_transition) p1_transition = create_bidirectional_transition(p1, fade, { duration: 1000 }, true);
    				p1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!p0_transition) p0_transition = create_bidirectional_transition(p0, fade, { duration: 1000 }, false);
    			p0_transition.run(0);
    			if (!p1_transition) p1_transition = create_bidirectional_transition(p1, fade, { duration: 1000 }, false);
    			p1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching && p0_transition) p0_transition.end();
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p1);
    			if (detaching && p1_transition) p1_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(107:8) {#if outreach}",
    		ctx
    	});

    	return block;
    }

    // (149:8) {#if at}
    function create_if_block_4(ctx) {
    	let div7;
    	let p;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let t3;
    	let div2;
    	let div1;
    	let iframe;
    	let iframe_src_value;
    	let t4;
    	let div3;
    	let div7_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			p = element("p");
    			p.textContent = "I maintain a lively discussion with the worldwide Alexander\n              Technique community, from attending the 2015 International\n              Congress for the AT in Limerick, Ireland on scholarship, to\n              participating in the Alexander Technique Science Webinar, led by\n              researchers Tim Cacciatore, Patrick Johnson and Rajal Cohen. I\n              started a YouTube channel in May 2020 aimed at creating a new\n              image of the technique and showing how it can be a part of\n              everyone’s lives.";
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			iframe = element("iframe");
    			t4 = space();
    			div3 = element("div");
    			attr_dev(p, "class", "svelte-41qe4r");
    			add_location(p, file$b, 150, 12, 5306);
    			attr_dev(img, "class", "img-thumbnail my-4 svelte-41qe4r");
    			if (img.src !== (img_src_value = "images/REarle.JPG")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$b, 163, 12, 5977);
    			attr_dev(div0, "class", "col-3");
    			add_location(div0, file$b, 168, 18, 6171);
    			attr_dev(iframe, "class", "resp-iframe");
    			attr_dev(iframe, "title", "Gribby");
    			if (iframe.src !== (iframe_src_value = "https://www.youtube.com/embed/pN1ZA6hWd3s")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$b, 171, 22, 6311);
    			attr_dev(div1, "class", "videos shadow");
    			add_location(div1, file$b, 170, 20, 6261);
    			attr_dev(div2, "class", "col-12 col-md-6");
    			add_location(div2, file$b, 169, 18, 6211);
    			attr_dev(div3, "class", "col-3");
    			add_location(div3, file$b, 181, 18, 6770);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$b, 167, 16, 6135);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$b, 166, 14, 6095);
    			attr_dev(div6, "class", "video mb-3");
    			add_location(div6, file$b, 165, 12, 6056);
    			add_location(div7, file$b, 149, 10, 5251);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, p);
    			append_dev(div7, t1);
    			append_dev(div7, img);
    			append_dev(div7, t2);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, iframe);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div7_transition) div7_transition = create_bidirectional_transition(div7, fade, { duration: 1000 }, true);
    				div7_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div7_transition) div7_transition = create_bidirectional_transition(div7, fade, { duration: 1000 }, false);
    			div7_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (detaching && div7_transition) div7_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(149:8) {#if at}",
    		ctx
    	});

    	return block;
    }

    // (196:8) {#if web}
    function create_if_block_3(ctx) {
    	let p;
    	let t0;
    	let a;
    	let t2;
    	let p_transition;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("I have begun acting on a longstanding desire to better understand\n            technology's impact on our lives by learning web development. I have\n            studied several programming languages and have a regulary updated\n            showcase ");
    			a = element("a");
    			a.textContent = "found here";
    			t2 = text(". I greatly enjoy helping clients find a comfortable internet voice\n            with which to project their best selves.");
    			attr_dev(a, "href", "https://kiprieckenportfolio.netlify.app/");
    			add_location(a, file$b, 200, 21, 7433);
    			attr_dev(p, "class", "svelte-41qe4r");
    			add_location(p, file$b, 196, 10, 7134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, a);
    			append_dev(p, t2);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { duration: 1000 }, true);
    				p_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { duration: 1000 }, false);
    			p_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_transition) p_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(196:8) {#if web}",
    		ctx
    	});

    	return block;
    }

    // (214:8) {#if photo}
    function create_if_block_2(ctx) {
    	let p;
    	let a;
    	let p_transition;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			a = element("a");
    			a.textContent = "Check out my photography site";
    			attr_dev(a, "href", "https://photosbykip.netlify.app/");
    			add_location(a, file$b, 215, 12, 7978);
    			attr_dev(p, "class", "svelte-41qe4r");
    			add_location(p, file$b, 214, 10, 7925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, a);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { duration: 1000 }, true);
    				p_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { duration: 1000 }, false);
    			p_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_transition) p_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(214:8) {#if photo}",
    		ctx
    	});

    	return block;
    }

    // (229:8) {#if teaching}
    function create_if_block_1$1(ctx) {
    	let t0;
    	let p0;
    	let p0_transition;
    	let t2;
    	let carousel;
    	let t3;
    	let p1;
    	let p1_transition;
    	let t5;
    	let button0;
    	let t7;
    	let p2;
    	let p2_transition;
    	let t9;
    	let button1;
    	let current;
    	carousel = new Carousel({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = text("Pics from CAYO, MUSAID\n\n          ");
    			p0 = element("p");
    			p0.textContent = "With over 15 years of teaching experience, from beginner to college\n            level, I offer violin and viola lessons over Zoom. Every lesson is\n            informed by my unique experience with Alexander Technique to inspire\n            joy and sustainability in my students' playing.";
    			t2 = space();
    			create_component(carousel.$$.fragment);
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Here are some images from when I took my knowledge of Spanish and\n            traveled to Havana, Cuba with Cuban American Youth Orchestra, and El\n            Salvador, San Salvador with MUSAID, putting myself for the first\n            time in a Spanish-speaking environment in which I taught and\n            mentoring students who speak no or little English.";
    			t5 = space();
    			button0 = element("button");
    			button0.textContent = "Lessons";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "Visit the lessons page to schedule a lesson or find out more. I look\n            forward to hearing from you.";
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "Contact Kip";
    			attr_dev(p0, "class", "svelte-41qe4r");
    			add_location(p0, file$b, 231, 10, 8415);
    			attr_dev(p1, "class", "svelte-41qe4r");
    			add_location(p1, file$b, 240, 10, 8806);
    			attr_dev(button0, "class", "btn");
    			attr_dev(button0, "href", "/lessons");
    			add_location(button0, file$b, 248, 10, 9245);
    			attr_dev(p2, "class", "svelte-41qe4r");
    			add_location(p2, file$b, 250, 10, 9309);
    			attr_dev(button1, "class", "btn");
    			attr_dev(button1, "href", "/contact");
    			add_location(button1, file$b, 255, 10, 9498);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(carousel, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button1, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!p0_transition) p0_transition = create_bidirectional_transition(p0, fade, { duration: 1000 }, true);
    				p0_transition.run(1);
    			});

    			transition_in(carousel.$$.fragment, local);

    			add_render_callback(() => {
    				if (!p1_transition) p1_transition = create_bidirectional_transition(p1, fade, { duration: 1000 }, true);
    				p1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!p2_transition) p2_transition = create_bidirectional_transition(p2, fade, { duration: 1000 }, true);
    				p2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!p0_transition) p0_transition = create_bidirectional_transition(p0, fade, { duration: 1000 }, false);
    			p0_transition.run(0);
    			transition_out(carousel.$$.fragment, local);
    			if (!p1_transition) p1_transition = create_bidirectional_transition(p1, fade, { duration: 1000 }, false);
    			p1_transition.run(0);
    			if (!p2_transition) p2_transition = create_bidirectional_transition(p2, fade, { duration: 1000 }, false);
    			p2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p0);
    			if (detaching && p0_transition) p0_transition.end();
    			if (detaching) detach_dev(t2);
    			destroy_component(carousel, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching && p1_transition) p1_transition.end();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching && p2_transition) p2_transition.end();
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(229:8) {#if teaching}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div3;
    	let div2;
    	let input;
    	let t0;
    	let div1;
    	let img;
    	let img_src_value;
    	let t1;
    	let figure;
    	let figcaption;
    	let t3;
    	let div0;
    	let audio;
    	let source;
    	let source_src_value;
    	let t4;
    	let p;
    	let p_transition;
    	let t6;
    	let t7;
    	let current;
    	let if_block0 = /*showButton*/ ctx[0] && create_if_block_7(ctx);
    	let if_block1 = /*more*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			img = element("img");
    			t1 = space();
    			figure = element("figure");
    			figcaption = element("figcaption");
    			figcaption.textContent = "Bach Violin Sonata";
    			t3 = space();
    			div0 = element("div");
    			audio = element("audio");
    			source = element("source");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Since an early age, I've been driven by curiosity, accountability, and\n        service. Through music and academics, I had the opportunity to explore\n        them. When I came across Alexander Technique, the approach seemed to\n        offer a new definition of complete and healthy. It continues to inform\n        everything I do and I welcome you to join my exploration.";
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(input, "type", "text");
    			input.autofocus = "true";
    			set_style(input, "display", "none");
    			add_location(input, file$b, 26, 4, 539);
    			if (img.src !== (img_src_value = "images/KR32-min.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "my-5 shadow svelte-41qe4r");
    			attr_dev(img, "id", "top-pic");
    			attr_dev(img, "alt", "Me");
    			add_location(img, file$b, 30, 6, 712);
    			add_location(figcaption, file$b, 38, 8, 863);
    			if (source.src !== (source_src_value = "sounds/STE-027.mp3")) attr_dev(source, "src", source_src_value);
    			attr_dev(source, "type", "audio/mp3");
    			add_location(source, file$b, 42, 12, 1028);
    			audio.controls = true;
    			add_location(audio, file$b, 41, 10, 999);
    			attr_dev(div0, "class", "color");
    			add_location(div0, file$b, 40, 8, 969);
    			attr_dev(figure, "class", "mb-3");
    			add_location(figure, file$b, 37, 6, 833);
    			attr_dev(p, "class", "svelte-41qe4r");
    			add_location(p, file$b, 47, 6, 1138);
    			attr_dev(div1, "class", "bio-text text-justify clearfix p-3 d-flex flex-column justify-content-between svelte-41qe4r");
    			add_location(div1, file$b, 27, 4, 603);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$b, 24, 2, 469);
    			attr_dev(div3, "class", "bio d-flex");
    			add_location(div3, file$b, 23, 0, 442);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, input);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t1);
    			append_dev(div1, figure);
    			append_dev(figure, figcaption);
    			append_dev(figure, t3);
    			append_dev(figure, div0);
    			append_dev(div0, audio);
    			append_dev(audio, source);
    			append_dev(div1, t4);
    			append_dev(div1, p);
    			append_dev(div1, t6);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t7);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showButton*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(div1, t7);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*more*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*more*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { duration: 1000 }, true);
    				p_transition.run(1);
    			});

    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { duration: 1000 }, false);
    			p_transition.run(0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching && p_transition) p_transition.end();
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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
    	validate_slots("Bio", slots, []);
    	let showButton, more, music, at, teaching, outreach, web, photo = false;

    	const showButtons = () => {
    		$$invalidate(1, more = !more);
    	};

    	onMount(() => {
    		setTimeout(
    			() => {
    				$$invalidate(0, showButton = true);
    			},
    			1500
    		);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bio> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, music = !music);
    	const click_handler_1 = () => $$invalidate(5, outreach = !outreach);
    	const click_handler_2 = () => $$invalidate(3, at = !at);
    	const click_handler_3 = () => $$invalidate(6, web = !web);
    	const click_handler_4 = () => $$invalidate(7, photo = !photo);
    	const click_handler_5 = () => $$invalidate(4, teaching = !teaching);

    	$$self.$capture_state = () => ({
    		showButton,
    		more,
    		music,
    		at,
    		teaching,
    		outreach,
    		web,
    		photo,
    		Carousel,
    		fade,
    		scale,
    		fly,
    		onMount,
    		quadOut,
    		showButtons
    	});

    	$$self.$inject_state = $$props => {
    		if ("showButton" in $$props) $$invalidate(0, showButton = $$props.showButton);
    		if ("more" in $$props) $$invalidate(1, more = $$props.more);
    		if ("music" in $$props) $$invalidate(2, music = $$props.music);
    		if ("at" in $$props) $$invalidate(3, at = $$props.at);
    		if ("teaching" in $$props) $$invalidate(4, teaching = $$props.teaching);
    		if ("outreach" in $$props) $$invalidate(5, outreach = $$props.outreach);
    		if ("web" in $$props) $$invalidate(6, web = $$props.web);
    		if ("photo" in $$props) $$invalidate(7, photo = $$props.photo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showButton,
    		more,
    		music,
    		at,
    		teaching,
    		outreach,
    		web,
    		photo,
    		showButtons,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class Bio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bio",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src/components/Audio.svelte generated by Svelte v3.29.4 */

    const file$c = "src/components/Audio.svelte";

    function create_fragment$g(ctx) {
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
    			if (source0.src !== (source0_src_value = "sounds/STE-027.mp3")) attr_dev(source0, "src", source0_src_value);
    			attr_dev(source0, "type", "audio/mp3");
    			add_location(source0, file$c, 8, 10, 243);
    			audio0.controls = true;
    			add_location(audio0, file$c, 7, 8, 216);
    			attr_dev(div0, "class", "color");
    			add_location(div0, file$c, 6, 6, 188);
    			add_location(figure0, file$c, 3, 4, 71);
    			add_location(figcaption1, file$c, 13, 6, 359);
    			if (source1.src !== (source1_src_value = "sounds/STE-026.mp3")) attr_dev(source1, "src", source1_src_value);
    			attr_dev(source1, "type", "audio/mp3");
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Audio",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src/components/Modal.svelte generated by Svelte v3.29.4 */
    const file$d = "src/components/Modal.svelte";
    const get_image_slot_changes = dirty => ({});
    const get_image_slot_context = ctx => ({});

    // (63:23)      
    function fallback_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "image svelte-17z5ruu");
    			if (img.src !== (img_src_value = /*imgSrc*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$d, 63, 4, 1308);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imgSrc*/ 1 && img.src !== (img_src_value = /*imgSrc*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(63:23)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let div2_tabindex_value;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	const image_slot_template = /*#slots*/ ctx[4].image;
    	const image_slot = create_slot(image_slot_template, ctx, /*$$scope*/ ctx[3], get_image_slot_context);
    	const image_slot_or_fallback = image_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			if (image_slot_or_fallback) image_slot_or_fallback.c();
    			attr_dev(div0, "class", "backdrop svelte-17z5ruu");
    			add_location(div0, file$d, 59, 2, 1206);
    			attr_dev(div1, "class", "content-wrapper svelte-17z5ruu");
    			add_location(div1, file$d, 61, 2, 1250);
    			attr_dev(div2, "class", "modal svelte-17z5ruu");
    			attr_dev(div2, "tabindex", div2_tabindex_value = 0);
    			attr_dev(div2, "autofocus", "");
    			add_location(div2, file$d, 58, 0, 1098);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);

    			if (image_slot_or_fallback) {
    				image_slot_or_fallback.m(div1, null);
    			}

    			current = true;
    			div2.focus();

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*close*/ ctx[1], false, false, false),
    					listen_dev(div2, "keydown", /*handle_keydown*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (image_slot) {
    				if (image_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(image_slot, image_slot_template, ctx, /*$$scope*/ ctx[3], dirty, get_image_slot_changes, get_image_slot_context);
    				}
    			} else {
    				if (image_slot_or_fallback && image_slot_or_fallback.p && dirty & /*imgSrc*/ 1) {
    					image_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image_slot_or_fallback, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, { duration: 300 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image_slot_or_fallback, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, { duration: 300 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (image_slot_or_fallback) image_slot_or_fallback.d(detaching);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, ['image']);
    	const dispatch = createEventDispatcher();
    	const close = () => dispatch("close");

    	const handle_keydown = e => {
    		if (e.key === "Escape") {
    			close();
    			return;
    		}
    	};

    	let { imgSrc } = $$props;
    	const writable_props = ["imgSrc"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("imgSrc" in $$props) $$invalidate(0, imgSrc = $$props.imgSrc);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		createEventDispatcher,
    		onDestroy,
    		dispatch,
    		close,
    		handle_keydown,
    		imgSrc
    	});

    	$$self.$inject_state = $$props => {
    		if ("imgSrc" in $$props) $$invalidate(0, imgSrc = $$props.imgSrc);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [imgSrc, close, handle_keydown, $$scope, slots];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { imgSrc: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*imgSrc*/ ctx[0] === undefined && !("imgSrc" in props)) {
    			console.warn("<Modal> was created without expected prop 'imgSrc'");
    		}
    	}

    	get imgSrc() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imgSrc(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var images = [
        {
            id: 1,
            url: "images/jimross.jpg",
            alt: ""
        },
        {
            id: 2,
            url: "images/laughing.jpg",
            alt: ""
        },
        {
            id: 3,
            url: "images/withmag.jpg",
            alt: ""
        },
        // {
        //     id: 4,
        //     url: "images/KR13.jpg",
        //     alt: ""
        // },
        {
            id: 5,
            url: "images/withyenet.jpg",
            alt: ""
        },
        {
            id: 6,
            url: "images/withpolet.jpg",
            alt: ""
        },
        {
            id: 7,
            url: "images/quintet.jpg",
            alt: ""
        },
        {
            id: 8,
            url: "images/renato-student.jpg",
            alt: ""
        },
    ];

    /* src/components/Gallery.svelte generated by Svelte v3.29.4 */
    const file$e = "src/components/Gallery.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    const get_image_slot_changes$1 = dirty => ({});
    const get_image_slot_context$1 = ctx => ({});

    // (19:2) {#if showModal}
    function create_if_block$3(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				imgSrc: /*imageUrl*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	modal.$on("close", /*close_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modal_changes = {};
    			if (dirty & /*imageUrl*/ 2) modal_changes.imgSrc = /*imageUrl*/ ctx[1];

    			if (dirty & /*$$scope*/ 64) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(19:2) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    // (20:4) <Modal on:close={() => {         showModal = false;     }} imgSrc={imageUrl}>
    function create_default_slot(ctx) {
    	let current;
    	const image_slot_template = /*#slots*/ ctx[3].image;
    	const image_slot = create_slot(image_slot_template, ctx, /*$$scope*/ ctx[6], get_image_slot_context$1);

    	const block = {
    		c: function create() {
    			if (image_slot) image_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (image_slot) {
    				image_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (image_slot) {
    				if (image_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(image_slot, image_slot_template, ctx, /*$$scope*/ ctx[6], dirty, get_image_slot_changes$1, get_image_slot_context$1);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (image_slot) image_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(20:4) <Modal on:close={() => {         showModal = false;     }} imgSrc={imageUrl}>",
    		ctx
    	});

    	return block;
    }

    // (29:6) {#each allImages as image}
    function create_each_block(ctx) {
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let p;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*image*/ ctx[8], ...args);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p = element("p");
    			t1 = space();
    			if (img.src !== (img_src_value = /*image*/ ctx[8].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*image*/ ctx[8].alt);
    			attr_dev(img, "class", "card-img");
    			add_location(img, file$e, 31, 12, 833);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$e, 33, 14, 947);
    			attr_dev(div0, "class", "card-img-overlay");
    			add_location(div0, file$e, 32, 12, 902);
    			attr_dev(div1, "class", "shadow card bg-dark text-white bg-white svelte-161h2cj");
    			add_location(div1, file$e, 30, 10, 708);
    			attr_dev(div2, "class", "col-md-6");
    			add_location(div2, file$e, 29, 8, 675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div2, t1);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(29:6) {#each allImages as image}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let t;
    	let div1;
    	let div0;
    	let current;
    	let if_block = /*showModal*/ ctx[0] && create_if_block$3(ctx);
    	let each_value = /*allImages*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "row align-items-center content");
    			add_location(div0, file$e, 27, 4, 589);
    			attr_dev(div1, "class", "container content");
    			add_location(div1, file$e, 26, 2, 553);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showModal*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showModal*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*showModal, imageUrl, allImages*/ 7) {
    				each_value = /*allImages*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
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
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Gallery", slots, ['image']);
    	let showModal = false;

    	let defineImage = image => {
    	};

    	const allImages = [...images];
    	let imageUrl = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Gallery> was created with unknown prop '${key}'`);
    	});

    	const close_handler = () => {
    		$$invalidate(0, showModal = false);
    	};

    	const click_handler = image => {
    		$$invalidate(0, showModal = true);
    		$$invalidate(1, imageUrl = image.url);
    	};

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		Modal,
    		images,
    		showModal,
    		defineImage,
    		allImages,
    		imageUrl
    	});

    	$$self.$inject_state = $$props => {
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    		if ("defineImage" in $$props) defineImage = $$props.defineImage;
    		if ("imageUrl" in $$props) $$invalidate(1, imageUrl = $$props.imageUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showModal, imageUrl, allImages, slots, close_handler, click_handler, $$scope];
    }

    class Gallery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gallery",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src/pages/About.svelte generated by Svelte v3.29.4 */
    const file$f = "src/pages/About.svelte";

    function create_fragment$j(ctx) {
    	let div;
    	let bio;
    	let current;
    	bio = new Bio({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(bio.$$.fragment);
    			attr_dev(div, "class", "container d-flex justify-content-center flex-column align-content-center svelte-sptly");
    			add_location(div, file$f, 8, 0, 277);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(bio, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bio.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bio.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(bio);
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
    	validate_slots("About", slots, []);
    	onMount(() => window.scrollTo(0, document.body.scrollHeight));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Bio, Audio, Gallery, onMount });
    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src/components/Blog/BlogPost.svelte generated by Svelte v3.29.4 */

    const { console: console_1$1 } = globals;
    const file$g = "src/components/Blog/BlogPost.svelte";

    // (50:4) {:else}
    function create_else_block$3(ctx) {
    	let a;
    	let link_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Back to blogs";
    			attr_dev(a, "href", "/blog");
    			add_location(a, file$g, 50, 4, 1159);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(50:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (48:4) {#if main}
    function create_if_block$4(ctx) {
    	let a;
    	let t;
    	let a_href_value;
    	let link_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Read more");
    			attr_dev(a, "href", a_href_value = "/blog/" + /*ID*/ ctx[1]);
    			add_location(a, file$g, 48, 4, 1099);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ID*/ 2 && a_href_value !== (a_href_value = "/blog/" + /*ID*/ ctx[1])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(48:4) {#if main}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
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
    	let h5;
    	let t4_value = /*formatDate*/ ctx[7](/*parseDate*/ ctx[6](/*Date*/ ctx[4])) + "";
    	let t4;
    	let t5;
    	let p;
    	let t6;
    	let t7;
    	let t8;
    	let div2;
    	let t9;
    	let hr;

    	function select_block_type(ctx, dirty) {
    		if (/*main*/ ctx[5]) return create_if_block$4;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t1 = text(/*Title*/ ctx[0]);
    			t2 = space();
    			img = element("img");
    			t3 = space();
    			h5 = element("h5");
    			t4 = text(t4_value);
    			t5 = space();
    			p = element("p");
    			t6 = text(/*Body*/ ctx[3]);
    			t7 = space();
    			if_block.c();
    			t8 = space();
    			div2 = element("div");
    			t9 = space();
    			hr = element("hr");
    			attr_dev(div0, "class", "col col-lg-2");
    			add_location(div0, file$g, 32, 2, 625);
    			attr_dev(h2, "class", "text-capitalize mb-3");
    			add_location(h2, file$g, 35, 4, 747);
    			attr_dev(img, "class", "blog-image img-thumbnail svelte-1m6u72j");
    			if (img.src !== (img_src_value = "/" + /*Image*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$g, 36, 4, 797);
    			attr_dev(h5, "class", "mt-4");
    			add_location(h5, file$g, 42, 4, 891);
    			attr_dev(p, "class", "justify-content-center my-4 text-dark");
    			toggle_class(p, "text-truncate", /*main*/ ctx[5]);
    			add_location(p, file$g, 46, 4, 993);
    			attr_dev(div1, "class", "col col-lg-8 blog-post svelte-1m6u72j");
    			add_location(div1, file$g, 33, 2, 656);
    			attr_dev(div2, "class", "col col-lg-2");
    			add_location(div2, file$g, 53, 2, 1219);
    			add_location(hr, file$g, 54, 2, 1250);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$g, 31, 0, 599);
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
    			append_dev(div1, h5);
    			append_dev(h5, t4);
    			append_dev(div1, t5);
    			append_dev(div1, p);
    			append_dev(p, t6);
    			append_dev(div1, t7);
    			if_block.m(div1, null);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div3, t9);
    			append_dev(div3, hr);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Title*/ 1) set_data_dev(t1, /*Title*/ ctx[0]);

    			if (dirty & /*Image*/ 4 && img.src !== (img_src_value = "/" + /*Image*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*Date*/ 16 && t4_value !== (t4_value = /*formatDate*/ ctx[7](/*parseDate*/ ctx[6](/*Date*/ ctx[4])) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*Body*/ 8) set_data_dev(t6, /*Body*/ ctx[3]);

    			if (dirty & /*main*/ 32) {
    				toggle_class(p, "text-truncate", /*main*/ ctx[5]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block.d();
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

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BlogPost", slots, []);
    	let { Title } = $$props;
    	let { ID } = $$props;
    	let { Image } = $$props;
    	let { Body } = $$props;
    	let { Date } = $$props;
    	console.log(Date);

    	const parseDate = date => {
    		console.log(Date);
    		return date.toString().split(/-|T|:/);
    	};

    	const formatDate = arr => {
    		console.log(arr);
    		return `${arr[3]}:${arr[4]}, ${arr[1]}/${arr[2]}/${arr[0]}`;
    	};

    	let main;
    	var url = new URL(window.location.href);

    	if (url.pathname === "/blog") {
    		console.log("yey");
    		console.log(main);
    		main = true;
    	} else {
    		main = false;
    	}

    	const writable_props = ["Title", "ID", "Image", "Body", "Date"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<BlogPost> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("Title" in $$props) $$invalidate(0, Title = $$props.Title);
    		if ("ID" in $$props) $$invalidate(1, ID = $$props.ID);
    		if ("Image" in $$props) $$invalidate(2, Image = $$props.Image);
    		if ("Body" in $$props) $$invalidate(3, Body = $$props.Body);
    		if ("Date" in $$props) $$invalidate(4, Date = $$props.Date);
    	};

    	$$self.$capture_state = () => ({
    		link,
    		Title,
    		ID,
    		Image,
    		Body,
    		Date,
    		parseDate,
    		formatDate,
    		main,
    		url
    	});

    	$$self.$inject_state = $$props => {
    		if ("Title" in $$props) $$invalidate(0, Title = $$props.Title);
    		if ("ID" in $$props) $$invalidate(1, ID = $$props.ID);
    		if ("Image" in $$props) $$invalidate(2, Image = $$props.Image);
    		if ("Body" in $$props) $$invalidate(3, Body = $$props.Body);
    		if ("Date" in $$props) $$invalidate(4, Date = $$props.Date);
    		if ("main" in $$props) $$invalidate(5, main = $$props.main);
    		if ("url" in $$props) url = $$props.url;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Title, ID, Image, Body, Date, main, parseDate, formatDate];
    }

    class BlogPost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {
    			Title: 0,
    			ID: 1,
    			Image: 2,
    			Body: 3,
    			Date: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BlogPost",
    			options,
    			id: create_fragment$k.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Title*/ ctx[0] === undefined && !("Title" in props)) {
    			console_1$1.warn("<BlogPost> was created without expected prop 'Title'");
    		}

    		if (/*ID*/ ctx[1] === undefined && !("ID" in props)) {
    			console_1$1.warn("<BlogPost> was created without expected prop 'ID'");
    		}

    		if (/*Image*/ ctx[2] === undefined && !("Image" in props)) {
    			console_1$1.warn("<BlogPost> was created without expected prop 'Image'");
    		}

    		if (/*Body*/ ctx[3] === undefined && !("Body" in props)) {
    			console_1$1.warn("<BlogPost> was created without expected prop 'Body'");
    		}

    		if (/*Date*/ ctx[4] === undefined && !("Date" in props)) {
    			console_1$1.warn("<BlogPost> was created without expected prop 'Date'");
    		}
    	}

    	get Title() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Title(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ID() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ID(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Image() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Image(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Body() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Body(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Date() {
    		throw new Error("<BlogPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Date(value) {
    		throw new Error("<BlogPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Blog/SinglePost.svelte generated by Svelte v3.29.4 */

    const { console: console_1$2 } = globals;
    const file$h = "src/components/Blog/SinglePost.svelte";

    function create_fragment$l(ctx) {
    	let div;
    	let post1;
    	let current;
    	post1 = new Post1({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(post1.$$.fragment);
    			attr_dev(div, "class", "content svelte-uhes0j");
    			add_location(div, file$h, 15, 0, 415);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(post1, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(post1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(post1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(post1);
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
    	validate_slots("SinglePost", slots, []);
    	var url = window.location.href;
    	var id = url.substring(url.lastIndexOf("/") + 1);

    	const fetchBlogs = fetch(`/api/blogposts/${id}`).then(data => {
    		console.log("succ", data);
    		return data.json();
    	}).catch(data => {
    		console.log("error", data);
    		return data;
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<SinglePost> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ BlogPost, Post1, url, id, fetchBlogs });

    	$$self.$inject_state = $$props => {
    		if ("url" in $$props) url = $$props.url;
    		if ("id" in $$props) id = $$props.id;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class SinglePost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SinglePost",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src/components/Navbar/Navbar.svelte generated by Svelte v3.29.4 */
    const file$i = "src/components/Navbar/Navbar.svelte";

    function create_fragment$m(ctx) {
    	let div1;
    	let div0;
    	let a0;
    	let t0;
    	let span1;
    	let t1;
    	let span0;
    	let t3;
    	let button;
    	let span2;
    	let t4;
    	let span3;
    	let t5;
    	let span4;
    	let t6;
    	let span5;
    	let t8;
    	let nav;
    	let a1;
    	let link_action;
    	let t10;
    	let a2;
    	let link_action_1;
    	let t12;
    	let a3;
    	let link_action_2;
    	let t14;
    	let a4;
    	let link_action_3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			t0 = text("𝄡 ");
    			span1 = element("span");
    			t1 = text("kip ");
    			span0 = element("span");
    			span0.textContent = "riecken, viola";
    			t3 = space();
    			button = element("button");
    			span2 = element("span");
    			t4 = space();
    			span3 = element("span");
    			t5 = space();
    			span4 = element("span");
    			t6 = space();
    			span5 = element("span");
    			span5.textContent = "Toggle navigation";
    			t8 = space();
    			nav = element("nav");
    			a1 = element("a");
    			a1.textContent = "About";
    			t10 = space();
    			a2 = element("a");
    			a2.textContent = "Lessons";
    			t12 = space();
    			a3 = element("a");
    			a3.textContent = "Blog";
    			t14 = space();
    			a4 = element("a");
    			a4.textContent = "Contact";
    			attr_dev(span0, "class", "name");
    			add_location(span0, file$i, 12, 12, 413);
    			attr_dev(span1, "class", "svelte-1v330cp");
    			add_location(span1, file$i, 11, 16, 394);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "navbar-link-brand font-weight-light svelte-1v330cp");
    			add_location(a0, file$i, 10, 4, 322);
    			attr_dev(span2, "class", "icon-bar top-bar svelte-1v330cp");
    			add_location(span2, file$i, 20, 6, 601);
    			attr_dev(span3, "class", "icon-bar middle-bar svelte-1v330cp");
    			add_location(span3, file$i, 21, 6, 641);
    			attr_dev(span4, "class", "icon-bar bottom-bar svelte-1v330cp");
    			add_location(span4, file$i, 22, 6, 684);
    			attr_dev(span5, "class", "sr-only");
    			add_location(span5, file$i, 23, 6, 727);
    			attr_dev(button, "class", "navbar-toggler navbar-toggler-right svelte-1v330cp");
    			attr_dev(button, "type", "button");
    			add_location(button, file$i, 15, 4, 482);
    			attr_dev(div0, "class", "d-flex justify-content-between");
    			add_location(div0, file$i, 9, 2, 273);
    			attr_dev(a1, "href", "/about");
    			attr_dev(a1, "class", "nav-link font-weight-light");
    			add_location(a1, file$i, 29, 4, 934);
    			attr_dev(a2, "href", "/lessons");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$i, 35, 4, 1061);
    			attr_dev(a3, "href", "/blog");
    			attr_dev(a3, "class", "nav-link");
    			add_location(a3, file$i, 38, 4, 1157);
    			attr_dev(a4, "href", "/contact");
    			attr_dev(a4, "class", "nav-link");
    			add_location(a4, file$i, 39, 4, 1235);
    			attr_dev(nav, "class", "navbar-items svelte-1v330cp");
    			attr_dev(nav, "id", "navbarResponsive");
    			add_location(nav, file$i, 28, 2, 881);
    			attr_dev(div1, "id", "mainNavbar");
    			attr_dev(div1, "class", "navbar fixed-top svelte-1v330cp");
    			add_location(div1, file$i, 8, 0, 224);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, t0);
    			append_dev(a0, span1);
    			append_dev(span1, t1);
    			append_dev(span1, span0);
    			append_dev(div0, t3);
    			append_dev(div0, button);
    			append_dev(button, span2);
    			append_dev(button, t4);
    			append_dev(button, span3);
    			append_dev(button, t5);
    			append_dev(button, span4);
    			append_dev(button, t6);
    			append_dev(button, span5);
    			append_dev(div1, t8);
    			append_dev(div1, nav);
    			append_dev(nav, a1);
    			append_dev(nav, t10);
    			append_dev(nav, a2);
    			append_dev(nav, t12);
    			append_dev(nav, a3);
    			append_dev(nav, t14);
    			append_dev(nav, a4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", classToggle, false, false, false),
    					action_destroyer(link_action = link.call(null, a1)),
    					listen_dev(a1, "click", classToggle, false, false, false),
    					action_destroyer(link_action_1 = link.call(null, a2)),
    					listen_dev(a2, "click", classToggle, false, false, false),
    					action_destroyer(link_action_2 = link.call(null, a3)),
    					listen_dev(a3, "click", classToggle, false, false, false),
    					action_destroyer(link_action_3 = link.call(null, a4)),
    					listen_dev(a4, "click", classToggle, false, false, false)
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
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function classToggle() {
    	const navs = document.querySelectorAll(".navbar-items");
    	navs.forEach(nav => nav.classList.toggle("navbar-toggle-show"));
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link, classToggle });
    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.29.4 */

    const file$j = "src/components/Footer.svelte";

    function create_fragment$n(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let a0;
    	let i0;
    	let t0;
    	let a1;
    	let i1;
    	let t1;
    	let a2;
    	let i2;
    	let t2;
    	let br;
    	let t3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t0 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t1 = space();
    			a2 = element("a");
    			i2 = element("i");
    			t2 = text("\n    © Copyright 2021 Kip Riecken\n    ");
    			br = element("br");
    			t3 = text("\n    Proudly self-designed.");
    			attr_dev(i0, "class", "mx-3 fab fa-instagram");
    			attr_dev(i0, "alt", "instagram");
    			add_location(i0, file$j, 4, 9, 133);
    			attr_dev(a0, "href", "https://www.instagram.com");
    			add_location(a0, file$j, 3, 6, 88);
    			attr_dev(i1, "class", "mx-3 fab fa-facebook-square");
    			attr_dev(i1, "alt", "facebook");
    			add_location(i1, file$j, 7, 9, 246);
    			attr_dev(a1, "href", "https://www.facebook.com");
    			add_location(a1, file$j, 6, 6, 202);
    			attr_dev(i2, "class", "mx-3 fab fa-youtube");
    			attr_dev(i2, "alt", "youtube");
    			add_location(i2, file$j, 10, 9, 363);
    			attr_dev(a2, "href", "https://www.youtube.com");
    			add_location(a2, file$j, 9, 6, 320);
    			attr_dev(div0, "class", "social my-3");
    			add_location(div0, file$j, 2, 4, 56);
    			add_location(br, file$j, 14, 4, 475);
    			attr_dev(div1, "class", "footer");
    			add_location(div1, file$j, 1, 2, 31);
    			attr_dev(div2, "class", "container pt-3");
    			add_location(div2, file$j, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, i0);
    			append_dev(div0, t0);
    			append_dev(div0, a1);
    			append_dev(a1, i1);
    			append_dev(div0, t1);
    			append_dev(div0, a2);
    			append_dev(a2, i2);
    			append_dev(div1, t2);
    			append_dev(div1, br);
    			append_dev(div1, t3);
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
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props) {
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
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */

    // (16:0) <Router>
    function create_default_slot$1(ctx) {
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
    	let route5;
    	let t6;
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
    			props: { path: "/blog/:id", component: SinglePost },
    			$$inline: true
    		});

    	route5 = new Route({
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
    			create_component(route5.$$.fragment);
    			t6 = space();
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
    			mount_component(route5, target, anchor);
    			insert_dev(target, t6, anchor);
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
    			transition_in(route5.$$.fragment, local);
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
    			transition_out(route5.$$.fragment, local);
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
    			destroy_component(route5, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(16:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
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
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
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
    		SinglePost,
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
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$o.name
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
