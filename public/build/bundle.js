
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
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
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

    const { console: console_1 } = globals;
    const file$4 = "src/components/Blog/BlogPost.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (46:0) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = `${/*error*/ ctx[7]}` + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("An error occurred! ");
    			t1 = text(t1_value);
    			add_location(p, file$4, 46, 4, 1392);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(46:0) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (28:0) {:then data}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*data*/ ctx[3].places;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*fetchBlogs, formatDate, parseDate*/ 7) {
    				each_value = /*data*/ ctx[3].places;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(28:0) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (29:4) {#each data.places as place}
    function create_each_block(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let h2;
    	let t1_value = /*place*/ ctx[4].Title + "";
    	let t1;
    	let t2;
    	let img;
    	let img_src_value;
    	let t3;
    	let h5;
    	let t4_value = /*formatDate*/ ctx[1](/*parseDate*/ ctx[0](/*place*/ ctx[4])) + "";
    	let t4;
    	let t5;
    	let p;
    	let t6_value = /*place*/ ctx[4].Body + "";
    	let t6;
    	let t7;
    	let div2;
    	let t8;
    	let hr;
    	let t9;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			img = element("img");
    			t3 = space();
    			h5 = element("h5");
    			t4 = text(t4_value);
    			t5 = space();
    			p = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			div2 = element("div");
    			t8 = space();
    			hr = element("hr");
    			t9 = space();
    			attr_dev(div0, "class", "col col-lg-2");
    			add_location(div0, file$4, 30, 12, 742);
    			attr_dev(h2, "class", "text-capitalize mb-3");
    			add_location(h2, file$4, 33, 16, 898);
    			attr_dev(img, "class", "blog-image img-thumbnail");
    			if (img.src !== (img_src_value = /*place*/ ctx[4].Image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 34, 16, 966);
    			attr_dev(h5, "class", "mt-4");
    			add_location(h5, file$4, 35, 16, 1048);
    			attr_dev(p, "class", "justify-content-center my-4 text-dark");
    			add_location(p, file$4, 39, 16, 1201);
    			attr_dev(div1, "class", "col col-lg-8 blog-post");
    			add_location(div1, file$4, 31, 12, 783);
    			attr_dev(div2, "class", "col col-lg-2");
    			add_location(div2, file$4, 41, 12, 1298);
    			add_location(hr, file$4, 42, 12, 1339);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$4, 29, 8, 706);
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
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div3, t8);
    			append_dev(div3, hr);
    			append_dev(div3, t9);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(29:4) {#each data.places as place}",
    		ctx
    	});

    	return block;
    }

    // (24:19)      <div class="container d-flex justify-content-center mt-5">         <p>...waiting</p>     </div> {:then data}
    function create_pending_block(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "...waiting";
    			add_location(p, file$4, 25, 8, 623);
    			attr_dev(div, "class", "container d-flex justify-content-center mt-5");
    			add_location(div, file$4, 24, 4, 556);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(24:19)      <div class=\\\"container d-flex justify-content-center mt-5\\\">         <p>...waiting</p>     </div> {:then data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let await_block_anchor;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 3,
    		error: 7
    	};

    	handle_promise(promise = /*fetchBlogs*/ ctx[2], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[3] = child_ctx[7] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
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

    	const parseDate = date => {
    		console.log(date);
    		return date.Date.toString().split(/-|T|:/);
    	};

    	const formatDate = arr => {
    		console.log(arr);
    		return `${arr[3]}:${arr[4]}, ${arr[1]}/${arr[2]}/${arr[0]}`;
    	};

    	const fetchBlogs = fetch(`/api/blogposts`).then(data => {
    		console.log("succ", data);
    		return data.json();
    	}).catch(data => {
    		console.log("error", data);
    		return data;
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<BlogPost> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ parseDate, formatDate, fetchBlogs });
    	return [parseDate, formatDate, fetchBlogs];
    }

    class BlogPost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BlogPost",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Bob.svelte generated by Svelte v3.29.4 */

    function create_fragment$6(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			t2 = text(/*body*/ ctx[1]);
    			t3 = space();
    			t4 = text(/*image*/ ctx[2]);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (dirty & /*body*/ 2) set_data_dev(t2, /*body*/ ctx[1]);
    			if (dirty & /*image*/ 4) set_data_dev(t4, /*image*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
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
    	validate_slots("Bob", slots, []);
    	let { title } = $$props;
    	let { body } = $$props;
    	let { image } = $$props;
    	const writable_props = ["title", "body", "image"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bob> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("body" in $$props) $$invalidate(1, body = $$props.body);
    		if ("image" in $$props) $$invalidate(2, image = $$props.image);
    	};

    	$$self.$capture_state = () => ({ title, body, image });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("body" in $$props) $$invalidate(1, body = $$props.body);
    		if ("image" in $$props) $$invalidate(2, image = $$props.image);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, body, image];
    }

    class Bob extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { title: 0, body: 1, image: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bob",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Bob> was created without expected prop 'title'");
    		}

    		if (/*body*/ ctx[1] === undefined && !("body" in props)) {
    			console.warn("<Bob> was created without expected prop 'body'");
    		}

    		if (/*image*/ ctx[2] === undefined && !("image" in props)) {
    			console.warn("<Bob> was created without expected prop 'image'");
    		}
    	}

    	get title() {
    		throw new Error("<Bob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Bob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get body() {
    		throw new Error("<Bob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set body(value) {
    		throw new Error("<Bob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Bob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Bob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/John.svelte generated by Svelte v3.29.4 */

    const { console: console_1$1 } = globals;
    const file$5 = "src/components/John.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>     import Bob from './Bob.svelte';     const fetchBlogs = fetch(`/api/blogposts`)         .then((data) => {             console.log("succ", data);             return data.json();         }
    function create_catch_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script>     import Bob from './Bob.svelte';     const fetchBlogs = fetch(`/api/blogposts`)         .then((data) => {             console.log(\\\"succ\\\", data);             return data.json();         }",
    		ctx
    	});

    	return block;
    }

    // (18:0) {:then data}
    function create_then_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[1].places;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*fetchBlogs*/ 1) {
    				each_value = /*data*/ ctx[1].places;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(18:0) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#each data.places as place}
    function create_each_block$1(ctx) {
    	let bob;
    	let current;

    	bob = new Bob({
    			props: {
    				title: /*place*/ ctx[2].Title,
    				body: /*place*/ ctx[2].Body,
    				image: /*place*/ ctx[2].Image
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bob.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bob, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bob.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bob.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bob, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(19:4) {#each data.places as place}",
    		ctx
    	});

    	return block;
    }

    // (14:19)      <div class="container d-flex justify-content-center mt-5">         <p>...waiting</p>     </div> {:then data}
    function create_pending_block$1(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "...waiting";
    			add_location(p, file$5, 15, 8, 406);
    			attr_dev(div, "class", "container d-flex justify-content-center mt-5");
    			add_location(div, file$5, 14, 4, 339);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
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
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(14:19)      <div class=\\\"container d-flex justify-content-center mt-5\\\">         <p>...waiting</p>     </div> {:then data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 1,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*fetchBlogs*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[1] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
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
    	validate_slots("John", slots, []);

    	const fetchBlogs = fetch(`/api/blogposts`).then(data => {
    		console.log("succ", data);
    		return data.json();
    	}).catch(data => {
    		console.log("error", data);
    		return data;
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<John> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Bob, fetchBlogs });
    	return [fetchBlogs];
    }

    class John extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "John",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/pages/Blog.svelte generated by Svelte v3.29.4 */
    const file$6 = "src/pages/Blog.svelte";

    function create_fragment$8(ctx) {
    	let div1;
    	let div0;
    	let john;
    	let t;
    	let blogpost;
    	let current;
    	john = new John({ $$inline: true });
    	blogpost = new BlogPost({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(john.$$.fragment);
    			t = space();
    			create_component(blogpost.$$.fragment);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file$6, 12, 4, 223);
    			attr_dev(div1, "class", "content svelte-rel1w3");
    			add_location(div1, file$6, 11, 0, 197);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(john, div0, null);
    			append_dev(div0, t);
    			mount_component(blogpost, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(john.$$.fragment, local);
    			transition_in(blogpost.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(john.$$.fragment, local);
    			transition_out(blogpost.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(john);
    			destroy_component(blogpost);
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
    	validate_slots("Blog", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Blog> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ BlogPost, John });
    	return [];
    }

    class Blog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Blog",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/Contact/Form.svelte generated by Svelte v3.29.4 */

    const file$7 = "src/components/Contact/Form.svelte";

    function create_fragment$9(ctx) {
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
    			add_location(hr, file$7, 1, 4, 69);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "name");
    			add_location(input0, file$7, 6, 16, 236);
    			add_location(label0, file$7, 4, 12, 185);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$7, 3, 8, 148);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "_replyto");
    			add_location(input1, file$7, 12, 16, 401);
    			add_location(label1, file$7, 10, 12, 349);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$7, 9, 8, 312);
    			attr_dev(textarea, "name", "message");
    			add_location(textarea, file$7, 18, 16, 572);
    			add_location(label2, file$7, 16, 12, 518);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$7, 15, 8, 481);
    			attr_dev(input2, "type", "submit");
    			attr_dev(input2, "class", "btn btn-primary");
    			input2.value = "Submit";
    			add_location(input2, file$7, 21, 8, 653);
    			attr_dev(form, "action", "https://formspree.io/f/xpzolpwz");
    			attr_dev(form, "method", "POST");
    			add_location(form, file$7, 2, 4, 78);
    			attr_dev(div3, "class", "contact-form container");
    			set_style(div3, "text-align", "center");
    			add_location(div3, file$7, 0, 0, 0);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/pages/Contact.svelte generated by Svelte v3.29.4 */
    const file$8 = "src/pages/Contact.svelte";

    function create_fragment$a(ctx) {
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
    			add_location(div, file$8, 4, 0, 75);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/Lessons/Lesson.svelte generated by Svelte v3.29.4 */
    const file$9 = "src/components/Lessons/Lesson.svelte";

    function create_fragment$b(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "lesson");
    			if (img.src !== (img_src_value = "images/KR9.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$9, 6, 0, 97);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lesson", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lesson> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Hero });
    	return [];
    }

    class Lesson extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lesson",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/Lessons/LessonOption.svelte generated by Svelte v3.29.4 */

    const file$a = "src/components/Lessons/LessonOption.svelte";

    function create_fragment$c(ctx) {
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
    			add_location(h30, file$a, 4, 16, 140);
    			add_location(h50, file$a, 5, 16, 178);
    			add_location(p0, file$a, 6, 16, 220);
    			attr_dev(div0, "class", "col-12 col-md-4");
    			add_location(div0, file$a, 3, 12, 94);
    			add_location(h31, file$a, 9, 16, 305);
    			add_location(h51, file$a, 10, 16, 344);
    			add_location(p1, file$a, 11, 16, 386);
    			attr_dev(div1, "class", "col-12 col-md-4");
    			add_location(div1, file$a, 8, 12, 259);
    			add_location(h32, file$a, 14, 16, 471);
    			add_location(h52, file$a, 15, 16, 527);
    			add_location(p2, file$a, 16, 16, 563);
    			attr_dev(div2, "class", "col-12 col-md-4");
    			add_location(div2, file$a, 13, 12, 425);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$a, 2, 8, 64);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$a, 1, 4, 32);
    			attr_dev(div5, "class", "lesson-option");
    			add_location(div5, file$a, 0, 0, 0);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props) {
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
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LessonOption",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/pages/Lessons.svelte generated by Svelte v3.29.4 */
    const file$b = "src/pages/Lessons.svelte";

    function create_fragment$d(ctx) {
    	let div5;
    	let img;
    	let img_src_value;
    	let t0;
    	let div4;
    	let div3;
    	let div0;
    	let p0;
    	let t2;
    	let p1;
    	let t4;
    	let p2;
    	let t6;
    	let p3;
    	let t8;
    	let ul;
    	let li0;
    	let t10;
    	let li1;
    	let t12;
    	let li2;
    	let t14;
    	let li3;
    	let t16;
    	let div1;
    	let h30;
    	let t18;
    	let h50;
    	let t20;
    	let p4;
    	let t21;
    	let div2;
    	let h31;
    	let t23;
    	let h51;
    	let t25;
    	let p5;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			img = element("img");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Why study with me?";
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "I know you have lots of options.";
    			t4 = space();
    			p2 = element("p");
    			p2.textContent = "In over twenty years of orchestral playing, and almost 30 years of playing music, I have noticed for musicians to both not play to their potential and to not enjoy what they do.\n  I want to help change that.";
    			t6 = space();
    			p3 = element("p");
    			p3.textContent = "We will work on:";
    			t8 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Deepening your connection with the music you’re playing";
    			t10 = space();
    			li1 = element("li");
    			li1.textContent = "Finding a more sustainable way of playing your instrument";
    			t12 = space();
    			li2 = element("li");
    			li2.textContent = "Creating a more balanced approach to practicing and performing";
    			t14 = space();
    			li3 = element("li");
    			li3.textContent = "Learning to prevent injuries and feel better playing your instrument";
    			t16 = space();
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Viola lesson";
    			t18 = space();
    			h50 = element("h5");
    			h50.textContent = "30 or 60 minutes";
    			t20 = space();
    			p4 = element("p");
    			t21 = space();
    			div2 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Violin lesson";
    			t23 = space();
    			h51 = element("h5");
    			h51.textContent = "30 or 60 minutes";
    			t25 = space();
    			p5 = element("p");
    			if (img.src !== (img_src_value = "images/KR9.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "lesson-img");
    			attr_dev(img, "alt", "");
    			add_location(img, file$b, 12, 2, 245);
    			add_location(p0, file$b, 16, 8, 375);
    			add_location(p1, file$b, 17, 8, 409);
    			add_location(p2, file$b, 19, 0, 458);
    			add_location(p3, file$b, 22, 0, 674);
    			add_location(li0, file$b, 25, 4, 708);
    			add_location(li1, file$b, 26, 4, 777);
    			add_location(li2, file$b, 27, 4, 848);
    			add_location(li3, file$b, 28, 4, 924);
    			add_location(ul, file$b, 24, 0, 699);
    			add_location(div0, file$b, 15, 6, 361);
    			add_location(h30, file$b, 32, 8, 1061);
    			add_location(h50, file$b, 33, 8, 1091);
    			add_location(p4, file$b, 34, 8, 1125);
    			attr_dev(div1, "class", "lesson-type");
    			add_location(div1, file$b, 31, 6, 1027);
    			add_location(h31, file$b, 37, 8, 1184);
    			add_location(h51, file$b, 38, 8, 1215);
    			add_location(p5, file$b, 39, 8, 1249);
    			attr_dev(div2, "class", "lesson-type");
    			add_location(div2, file$b, 36, 6, 1150);
    			attr_dev(div3, "class", "lesson-option");
    			add_location(div3, file$b, 14, 4, 327);
    			attr_dev(div4, "class", "container svelte-46yigu");
    			add_location(div4, file$b, 13, 2, 299);
    			attr_dev(div5, "class", "lessons-container");
    			add_location(div5, file$b, 11, 0, 211);
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
    			append_dev(div0, p0);
    			append_dev(div0, t2);
    			append_dev(div0, p1);
    			append_dev(div0, t4);
    			append_dev(div0, p2);
    			append_dev(div0, t6);
    			append_dev(div0, p3);
    			append_dev(div0, t8);
    			append_dev(div0, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t10);
    			append_dev(ul, li1);
    			append_dev(ul, t12);
    			append_dev(ul, li2);
    			append_dev(ul, t14);
    			append_dev(ul, li3);
    			append_dev(div3, t16);
    			append_dev(div3, div1);
    			append_dev(div1, h30);
    			append_dev(div1, t18);
    			append_dev(div1, h50);
    			append_dev(div1, t20);
    			append_dev(div1, p4);
    			append_dev(div3, t21);
    			append_dev(div3, div2);
    			append_dev(div2, h31);
    			append_dev(div2, t23);
    			append_dev(div2, h51);
    			append_dev(div2, t25);
    			append_dev(div2, p5);
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

    	$$self.$capture_state = () => ({ Lesson, LessonOption });
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

    const file$c = "src/components/Carousel.svelte";

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
    			add_location(li0, file$c, 42, 6, 743);
    			attr_dev(li1, "data-target", "#carouselExampleIndicators");
    			attr_dev(li1, "data-slide-to", "1");
    			add_location(li1, file$c, 43, 6, 833);
    			attr_dev(li2, "data-target", "#carouselExampleIndicators");
    			attr_dev(li2, "data-slide-to", "2");
    			add_location(li2, file$c, 44, 6, 908);
    			attr_dev(ol, "class", "carousel-indicators");
    			add_location(ol, file$c, 41, 4, 704);
    			attr_dev(img0, "class", "d-block w-100");
    			if (img0.src !== (img0_src_value = "images/renato-student.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "First slide");
    			add_location(img0, file$c, 48, 8, 1069);
    			attr_dev(div0, "class", "carousel-item active svelte-lzx4dd");
    			add_location(div0, file$c, 47, 6, 1026);
    			attr_dev(img1, "class", "d-block w-100");
    			if (img1.src !== (img1_src_value = "images/jimross.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Second slide");
    			add_location(img1, file$c, 51, 8, 1202);
    			attr_dev(div1, "class", "carousel-item svelte-lzx4dd");
    			add_location(div1, file$c, 50, 6, 1166);
    			attr_dev(img2, "class", "d-block w-100");
    			if (img2.src !== (img2_src_value = "images/laughing.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Third slide");
    			add_location(img2, file$c, 54, 8, 1329);
    			attr_dev(div2, "class", "carousel-item svelte-lzx4dd");
    			add_location(div2, file$c, 53, 6, 1293);
    			attr_dev(div3, "class", "carousel-inner");
    			add_location(div3, file$c, 46, 4, 991);
    			attr_dev(span0, "class", "carousel-control-prev-icon");
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$c, 58, 6, 1535);
    			attr_dev(span1, "class", "sr-only");
    			add_location(span1, file$c, 59, 6, 1609);
    			attr_dev(a0, "class", "carousel-control-prev");
    			attr_dev(a0, "href", "#carouselExampleIndicators");
    			attr_dev(a0, "role", "button");
    			attr_dev(a0, "data-slide", "prev");
    			add_location(a0, file$c, 57, 4, 1429);
    			attr_dev(span2, "class", "carousel-control-next-icon");
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$c, 62, 6, 1766);
    			attr_dev(span3, "class", "sr-only");
    			add_location(span3, file$c, 63, 6, 1840);
    			attr_dev(a1, "class", "carousel-control-next");
    			attr_dev(a1, "href", "#carouselExampleIndicators");
    			attr_dev(a1, "role", "button");
    			attr_dev(a1, "data-slide", "next");
    			add_location(a1, file$c, 61, 4, 1660);
    			attr_dev(div4, "id", "carouselExampleIndicators");
    			attr_dev(div4, "class", "carousel slide shadow mb-3");
    			attr_dev(div4, "data-ride", "carousel");
    			add_location(div4, file$c, 40, 0, 607);
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
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

    /* src/components/About/Bio.svelte generated by Svelte v3.29.4 */
    const file$d = "src/components/About/Bio.svelte";

    // (59:6) {:else}
    function create_else_block(ctx) {
    	let p0;
    	let t1;
    	let figure;
    	let figcaption;
    	let t3;
    	let div0;
    	let audio;
    	let source;
    	let source_src_value;
    	let t4;
    	let p1;
    	let p1_intro;
    	let t6;
    	let a0;
    	let t8;
    	let p2;
    	let p2_intro;
    	let t10;
    	let a1;
    	let t12;
    	let p3;
    	let p3_intro;
    	let t14;
    	let p4;
    	let p4_intro;
    	let t16;
    	let div7;
    	let div6;
    	let div5;
    	let div1;
    	let t17;
    	let div3;
    	let div2;
    	let iframe;
    	let iframe_src_value;
    	let t18;
    	let div4;
    	let t19;
    	let p5;
    	let t21;
    	let p6;
    	let t23;
    	let carousel;
    	let t24;
    	let p7;
    	let t26;
    	let p8;
    	let t28;
    	let a2;
    	let t30;
    	let button0;
    	let t32;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	carousel = new Carousel({ $$inline: true });

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "From an early age, Kip’s tireless work ethic has had two drives -\n          being accountable and helping others. Through music and academics, he\n          explored this accountability and mentorship, regularly leading in a\n          way that sought to be fair and responsible. When his path crossed with\n          that of Alexander Technique, these ideas seemed to have found a new\n          home. When faced with a practice that seemed to offer a new embodied\n          way of living and make living easier ad more enjoyable, with no\n          equipment required but the person he already was, he began a serious\n          investigation of what it meant to be complete and healthy. How could\n          some things suddenly be easier? Why was that the case, when he had\n          always worked so hard? What had he been doing wrong?";
    			t1 = space();
    			figure = element("figure");
    			figcaption = element("figcaption");
    			figcaption.textContent = "Bach Violin Sonata";
    			t3 = space();
    			div0 = element("div");
    			audio = element("audio");
    			source = element("source");
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "This discovery pushed him to change his degree midway through college,\n          focusing on pre-health, driven by the possibilities he saw in a new\n          approach to education. What was behind these new possibilities, and\n          why hadn’t he been introduced earlier? Through years, often grueling,\n          of self-discovery and exploration, Kip has combined a successful\n          career as a professional musician, performing with the Chicago, St.\n          Louis, and New World symphonies, performing in places from Cuba and El\n          Salvador to Carnegie Hall, and alongside such musicians as Yo-Yo Ma\n          and Tabea Zimmerman. as he has continued to live out these ideas of\n          accountability and helping others.";
    			t6 = space();
    			a0 = element("a");
    			a0.textContent = "Performance\n          with Yo-Yo Ma";
    			t8 = space();
    			p2 = element("p");
    			p2.textContent = "As a fellow at the Civic Orchestra of Chicago and New World Symphony,\n          he designed and led several initiatives aimed at inspiring these\n          ideals of accountability and companionship in himself and amongst his\n          colleagues. In Chicago, he earned support for The Rediscovering\n          Musician, a project bringing Alexander Technique to the Civic\n          Orchestra in the form of a series of lessons for two of his colleagues\n          from teacher Lisa DeAngelis, as well as a group class and blog.";
    			t10 = space();
    			a1 = element("a");
    			a1.textContent = "Rediscovering\n          Musician";
    			t12 = space();
    			p3 = element("p");
    			p3.textContent = "In Miami, Kip designed and led Farm to Stage, a project solidifying\n          the New World Symphony’s relationship with its community in Miami, in\n          Kip’s home state of Florida, in which he partnered with the Farmworker\n          Association of Florida to connect the migrant farmworkers with the\n          symphony through concerts in Miami Beach and Homestead. He also\n          designed and led, with the help of 16 other New World fellows, Damas y\n          Caballeros, a project to further strengthen the ties of New World\n          Symphony with its community. Fellows met weekly for Spanish lessons\n          and performed three concerts, in which all musicians spoke in Spanish\n          about the music they played, across the greater Miami area.";
    			t14 = text("\n\n        Pics from these projects\n\n        ");
    			p4 = element("p");
    			p4.textContent = "Kip has engaged in a lively discussion with the worldwide Alexander\n          Technique community, from attending the 2015 International Congress\n          for the AT in Limerick, Ireland on scholarship, to participating in\n          the Alexander Technique Science Webinar, led by researchers Tim\n          Cacciatore, Patrick Johnson and Rajal Cohen. He started a YouTube\n          channel aimed at creating a new image of the technique and showing how\n          it can be a part of everyone’s lives.";
    			t16 = text("\n\n        YouTube, pics from Ireland Congress, link to page on AT?\n\n        ");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div1 = element("div");
    			t17 = space();
    			div3 = element("div");
    			div2 = element("div");
    			iframe = element("iframe");
    			t18 = space();
    			div4 = element("div");
    			t19 = space();
    			p5 = element("p");
    			p5.textContent = "He lives to be challenged, and believes hardships and discomfort, when\n          approached healthily, only lead him to be a better person. He lives to\n          help others find comfort in themselves and tries to live out this\n          desire in all his personal relationships.";
    			t21 = space();
    			p6 = element("p");
    			p6.textContent = "Speaking of challenges, Kip took his knowledge of Spanish and traveled\n          to Havana, Cuba with Cuban American Youth Orchestra, and El Salvador,\n          San Salvador with MUSAID, putting himself for the first time in a\n          Spanish-speaking environment in which he was tasked with teaching and\n          mentoring students who speak none or little English.";
    			t23 = text("\n\n        Pics from CAYO, MUSAID\n\n        \n          ");
    			create_component(carousel.$$.fragment);
    			t24 = space();
    			p7 = element("p");
    			p7.textContent = "He has also taken the downtime in the pandemic to learn web\n          development, learning several programming languages and building a\n          portfolio found here. He is creating sites for those who would like\n          them and enjoys the process of helping people project their best\n          selves.";
    			t26 = space();
    			p8 = element("p");
    			p8.textContent = "With over 15 years of teaching experience, from beginner to college\n          level, Kip offers violin and viola over Zoom, including his experience\n          with the technique in every lesson to encourage better\n          self-understanding and accountability in his students.";
    			t28 = space();
    			a2 = element("a");
    			a2.textContent = "kip.riecken@gmail.com";
    			t30 = space();
    			button0 = element("button");
    			button0.textContent = "Contact Kip";
    			t32 = text("\n\n        Pics from NYO2, El Salvador\n\n        ");
    			button1 = element("button");
    			button1.textContent = "See Less";
    			add_location(p0, file$d, 59, 8, 1877);
    			add_location(figcaption, file$d, 74, 10, 2779);
    			if (source.src !== (source_src_value = "sounds/STE-027.mp3")) attr_dev(source, "src", source_src_value);
    			attr_dev(source, "type", "audio/mp3");
    			add_location(source, file$d, 78, 14, 2952);
    			audio.controls = true;
    			add_location(audio, file$d, 77, 12, 2921);
    			attr_dev(div0, "class", "color");
    			add_location(div0, file$d, 76, 10, 2889);
    			attr_dev(figure, "class", "mb-3");
    			add_location(figure, file$d, 73, 8, 2747);
    			add_location(p1, file$d, 83, 8, 3070);
    			attr_dev(a0, "class", "mb-3");
    			attr_dev(a0, "href", "https://chicago.suntimes.com/2017/6/11/18378502/yo-yo-ma-performs-concert-for-peace-at-st-sabina-church");
    			add_location(a0, file$d, 96, 8, 3879);
    			add_location(p2, file$d, 101, 8, 4075);
    			attr_dev(a1, "class", "mb-3");
    			attr_dev(a1, "href", "https://rediscoveringmusician.wordpress.com/");
    			add_location(a1, file$d, 111, 8, 4668);
    			add_location(p3, file$d, 116, 8, 4802);
    			add_location(p4, file$d, 131, 8, 5668);
    			attr_dev(div1, "class", "col-3");
    			add_location(div1, file$d, 146, 14, 6407);
    			attr_dev(iframe, "class", "resp-iframe");
    			attr_dev(iframe, "title", "Gribby");
    			if (iframe.src !== (iframe_src_value = "https://www.youtube.com/embed/pN1ZA6hWd3s")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$d, 149, 18, 6535);
    			attr_dev(div2, "class", "videos shadow");
    			add_location(div2, file$d, 148, 16, 6489);
    			attr_dev(div3, "class", "col-12 col-md-6");
    			add_location(div3, file$d, 147, 14, 6443);
    			attr_dev(div4, "class", "col-3");
    			add_location(div4, file$d, 158, 14, 6936);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$d, 145, 12, 6375);
    			attr_dev(div6, "class", "container");
    			add_location(div6, file$d, 144, 10, 6339);
    			attr_dev(div7, "class", "video mb-3");
    			add_location(div7, file$d, 143, 8, 6304);
    			add_location(p5, file$d, 163, 8, 7018);
    			add_location(p6, file$d, 170, 8, 7334);
    			add_location(p7, file$d, 184, 8, 7856);
    			add_location(p8, file$d, 192, 8, 8200);
    			attr_dev(a2, "href", "kip.riecken@gmail.com");
    			add_location(a2, file$d, 199, 8, 8515);
    			attr_dev(button0, "class", "btn");
    			attr_dev(button0, "href", "/contact");
    			add_location(button0, file$d, 200, 8, 8581);
    			attr_dev(button1, "class", "btn");
    			add_location(button1, file$d, 204, 8, 8684);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, figure, anchor);
    			append_dev(figure, figcaption);
    			append_dev(figure, t3);
    			append_dev(figure, div0);
    			append_dev(div0, audio);
    			append_dev(audio, source);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, a1, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div5, t17);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div2, iframe);
    			append_dev(div5, t18);
    			append_dev(div5, div4);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, p5, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, p6, anchor);
    			insert_dev(target, t23, anchor);
    			mount_component(carousel, target, anchor);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, p7, anchor);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, p8, anchor);
    			insert_dev(target, t28, anchor);
    			insert_dev(target, a2, anchor);
    			insert_dev(target, t30, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t32, anchor);
    			insert_dev(target, button1, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			if (!p1_intro) {
    				add_render_callback(() => {
    					p1_intro = create_in_transition(p1, fade, { duration: 2000 });
    					p1_intro.start();
    				});
    			}

    			if (!p2_intro) {
    				add_render_callback(() => {
    					p2_intro = create_in_transition(p2, fade, { duration: 2000 });
    					p2_intro.start();
    				});
    			}

    			if (!p3_intro) {
    				add_render_callback(() => {
    					p3_intro = create_in_transition(p3, fade, { duration: 2000 });
    					p3_intro.start();
    				});
    			}

    			if (!p4_intro) {
    				add_render_callback(() => {
    					p4_intro = create_in_transition(p4, fade, { duration: 2000 });
    					p4_intro.start();
    				});
    			}

    			transition_in(carousel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(carousel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(figure);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(a1);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t23);
    			destroy_component(carousel, detaching);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t28);
    			if (detaching) detach_dev(a2);
    			if (detaching) detach_dev(t30);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t32);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(59:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (33:6) {#if less}
    function create_if_block(ctx) {
    	let p;
    	let t1;
    	let figure;
    	let figcaption;
    	let t3;
    	let div;
    	let audio;
    	let source;
    	let source_src_value;
    	let t4;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "From an early age, Kip’s tireless work ethic has had two drives -\n          being accountable and helping others. Through music and academics, he\n          explored this accountability and mentorship, regularly leading in a\n          way that sought to be fair and responsible. When his path crossed with\n          that of Alexander Technique, these ideas seemed to have found a new\n          home. When faced with a practice that seemed to offer a new embodied\n          way of living and make living easier and more enjoyable, with no\n          equipment required but the person he already was, he began a serious\n          investigation of what it meant to be complete and healthy. How could\n          some things suddenly be easier? Why was that the case, when he had\n          always worked so hard? What had he been doing wrong?";
    			t1 = space();
    			figure = element("figure");
    			figcaption = element("figcaption");
    			figcaption.textContent = "Bach Violin Sonata";
    			t3 = space();
    			div = element("div");
    			audio = element("audio");
    			source = element("source");
    			t4 = space();
    			button = element("button");
    			button.textContent = "See More";
    			add_location(p, file$d, 33, 8, 591);
    			add_location(figcaption, file$d, 48, 10, 1494);
    			if (source.src !== (source_src_value = "sounds/STE-027.mp3")) attr_dev(source, "src", source_src_value);
    			attr_dev(source, "type", "audio/mp3");
    			add_location(source, file$d, 52, 14, 1667);
    			audio.controls = true;
    			add_location(audio, file$d, 51, 12, 1636);
    			attr_dev(div, "class", "color");
    			add_location(div, file$d, 50, 10, 1604);
    			attr_dev(figure, "class", "mb-3");
    			add_location(figure, file$d, 47, 8, 1462);
    			attr_dev(button, "class", "btn");
    			add_location(button, file$d, 57, 8, 1785);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, figure, anchor);
    			append_dev(figure, figcaption);
    			append_dev(figure, t3);
    			append_dev(figure, div);
    			append_dev(div, audio);
    			append_dev(audio, source);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(figure);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(33:6) {#if less}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*less*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t = space();
    			if_block.c();
    			if (img.src !== (img_src_value = "images/KR32.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "my-5 rounded-circle shadow svelte-t0d8qy");
    			attr_dev(img, "id", "top-pic");
    			attr_dev(img, "alt", "Me");
    			add_location(img, file$d, 25, 6, 439);
    			attr_dev(div0, "class", "row bio-text text-justify clearfix p-3 d-flex flex-column justify-content-between");
    			add_location(div0, file$d, 23, 4, 331);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$d, 22, 2, 303);
    			attr_dev(div2, "class", "bio");
    			add_location(div2, file$d, 21, 0, 283);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    				if_block.m(div0, null);
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
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();
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
    	let less = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bio> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, less = !less);
    	const click_handler_1 = () => $$invalidate(0, less = !less);
    	$$self.$capture_state = () => ({ less, Carousel, fade, fly });

    	$$self.$inject_state = $$props => {
    		if ("less" in $$props) $$invalidate(0, less = $$props.less);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [less, click_handler, click_handler_1];
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

    const file$e = "src/components/Audio.svelte";

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
    			add_location(h2, file$e, 2, 4, 50);
    			add_location(figcaption0, file$e, 4, 6, 86);
    			if (source0.src !== (source0_src_value = "sounds/STE-027.mp3")) attr_dev(source0, "src", source0_src_value);
    			attr_dev(source0, "type", "audio/mp3");
    			add_location(source0, file$e, 8, 10, 243);
    			audio0.controls = true;
    			add_location(audio0, file$e, 7, 8, 216);
    			attr_dev(div0, "class", "color");
    			add_location(div0, file$e, 6, 6, 188);
    			add_location(figure0, file$e, 3, 4, 71);
    			add_location(figcaption1, file$e, 13, 6, 359);
    			if (source1.src !== (source1_src_value = "sounds/STE-026.mp3")) attr_dev(source1, "src", source1_src_value);
    			attr_dev(source1, "type", "audio/mp3");
    			add_location(source1, file$e, 17, 10, 514);
    			audio1.controls = true;
    			add_location(audio1, file$e, 16, 8, 487);
    			attr_dev(div1, "class", "color");
    			add_location(div1, file$e, 15, 6, 459);
    			add_location(figure1, file$e, 12, 4, 344);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$e, 1, 2, 22);
    			attr_dev(div3, "class", "audio");
    			add_location(div3, file$e, 0, 0, 0);
    			if (audio2.src !== (audio2_src_value = "sounds/STE-026/mp3")) attr_dev(audio2, "src", audio2_src_value);
    			attr_dev(audio2, "class", "mejs__player");
    			attr_dev(audio2, "data-mejsoptions", "");
    			add_location(audio2, file$e, 24, 0, 673);
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
    const file$f = "src/components/Modal.svelte";
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
    			add_location(img, file$f, 63, 4, 1308);
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
    			add_location(div0, file$f, 59, 2, 1206);
    			attr_dev(div1, "class", "content-wrapper svelte-17z5ruu");
    			add_location(div1, file$f, 61, 2, 1250);
    			attr_dev(div2, "class", "modal svelte-17z5ruu");
    			attr_dev(div2, "tabindex", div2_tabindex_value = 0);
    			attr_dev(div2, "autofocus", "");
    			add_location(div2, file$f, 58, 0, 1098);
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
        {
            id: 4,
            url: "images/KR13.jpg",
            alt: ""
        },
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
    const file$g = "src/components/Gallery.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    const get_image_slot_changes$1 = dirty => ({});
    const get_image_slot_context$1 = ctx => ({});

    // (19:2) {#if showModal}
    function create_if_block$1(ctx) {
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
    		id: create_if_block$1.name,
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
    function create_each_block$2(ctx) {
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
    			add_location(img, file$g, 31, 12, 833);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$g, 33, 14, 947);
    			attr_dev(div0, "class", "card-img-overlay");
    			add_location(div0, file$g, 32, 12, 902);
    			attr_dev(div1, "class", "shadow card bg-dark text-white bg-white svelte-161h2cj");
    			add_location(div1, file$g, 30, 10, 708);
    			attr_dev(div2, "class", "col-md-6");
    			add_location(div2, file$g, 29, 8, 675);
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
    		id: create_each_block$2.name,
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
    	let if_block = /*showModal*/ ctx[0] && create_if_block$1(ctx);
    	let each_value = /*allImages*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			add_location(div0, file$g, 27, 4, 589);
    			attr_dev(div1, "class", "container content");
    			add_location(div1, file$g, 26, 2, 553);
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
    					if_block = create_if_block$1(ctx);
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
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    const file$h = "src/pages/About.svelte";

    // (1:0) <script>   import Bio from "../components/About/Bio.svelte";   import Audio from "../components/Audio.svelte";   import Gallery from "../components/Gallery.svelte";   import { onMount }
    function create_catch_block$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(1:0) <script>   import Bio from \\\"../components/About/Bio.svelte\\\";   import Audio from \\\"../components/Audio.svelte\\\";   import Gallery from \\\"../components/Gallery.svelte\\\";   import { onMount }",
    		ctx
    	});

    	return block;
    }

    // (13:0) {:then}
    function create_then_block$2(ctx) {
    	let div0;
    	let bio;
    	let t0;
    	let audio;
    	let t1;
    	let gallery;
    	let t2;
    	let button;
    	let t4;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	bio = new Bio({ $$inline: true });
    	audio = new Audio({ $$inline: true });
    	gallery = new Gallery({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(bio.$$.fragment);
    			t0 = space();
    			create_component(audio.$$.fragment);
    			t1 = space();
    			create_component(gallery.$$.fragment);
    			t2 = space();
    			button = element("button");
    			button.textContent = "Top";
    			t4 = space();
    			div1 = element("div");
    			attr_dev(button, "class", "btn mt-5");
    			add_location(button, file$h, 18, 2, 513);
    			attr_dev(div0, "class", "container d-flex justify-content-center flex-column align-content-center");
    			add_location(div0, file$h, 13, 0, 387);
    			attr_dev(div1, "class", "container d-flex justify-content-center");
    			add_location(div1, file$h, 23, 0, 607);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(bio, div0, null);
    			append_dev(div0, t0);
    			mount_component(audio, div0, null);
    			append_dev(div0, t1);
    			mount_component(gallery, div0, null);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
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
    			if (detaching) detach_dev(div0);
    			destroy_component(bio);
    			destroy_component(audio);
    			destroy_component(gallery);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(13:0) {:then}",
    		ctx
    	});

    	return block;
    }

    // (9:16)  <div class="container d-flex justify-content-center mt-5">   <p>...waiting</p> </div> {:then}
    function create_pending_block$2(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "...waiting";
    			add_location(p, file$h, 10, 2, 354);
    			attr_dev(div, "class", "container d-flex justify-content-center mt-5");
    			add_location(div, file$h, 9, 0, 293);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
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
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(9:16)  <div class=\\\"container d-flex justify-content-center mt-5\\\">   <p>...waiting</p> </div> {:then}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		blocks: [,,,]
    	};

    	handle_promise(promise = onMount, info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
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

    	const click_handler = () => window.scrollTo(0, 0);
    	$$self.$capture_state = () => ({ Bio, Audio, Gallery, onMount });
    	return [click_handler];
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

    function create_fragment$k(ctx) {
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
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$k.name
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
    function create_if_block$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block$1];
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block$1(ctx) {
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
    		id: create_else_block$1.name,
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

    function create_fragment$l(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block$2(ctx);

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
    					if_block = create_if_block$2(ctx);
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
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$l.name
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
    const file$i = "node_modules/svelte-routing/src/Link.svelte";

    function create_fragment$m(ctx) {
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
    			add_location(a, file$i, 40, 0, 1249);
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
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { to: 6, replace: 7, state: 8, getProps: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$m.name
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
    const file$j = "src/components/Navbar/Navbar.svelte";

    function create_fragment$n(ctx) {
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
    			add_location(span, file$j, 18, 62, 600);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "navbar-link-brand font-weight-light");
    			add_location(a0, file$j, 18, 2, 540);
    			attr_dev(i, "class", "fas fa-bars");
    			add_location(i, file$j, 19, 40, 686);
    			attr_dev(div0, "class", "nav-link nav-link-toggle");
    			add_location(div0, file$j, 19, 2, 648);
    			attr_dev(a1, "href", "/about");
    			attr_dev(a1, "class", "nav-link font-weight-light");
    			add_location(a1, file$j, 21, 4, 751);
    			attr_dev(a2, "href", "/lessons");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$j, 22, 4, 826);
    			attr_dev(a3, "href", "/blog");
    			attr_dev(a3, "class", "nav-link");
    			add_location(a3, file$j, 23, 4, 887);
    			attr_dev(a4, "href", "/contact");
    			attr_dev(a4, "class", "nav-link");
    			add_location(a4, file$j, 24, 4, 942);
    			attr_dev(nav, "class", "navbar-items");
    			add_location(nav, file$j, 20, 2, 720);
    			attr_dev(div1, "id", "mainNavbar");
    			attr_dev(div1, "class", "navbar fixed-top");
    			add_location(div1, file$j, 17, 0, 491);
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
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.29.4 */

    const file$k = "src/components/Footer.svelte";

    function create_fragment$o(ctx) {
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
    			add_location(hr, file$k, 1, 2, 26);
    			attr_dev(i0, "class", "nav-link fab fa-instagram");
    			add_location(i0, file$k, 4, 42, 121);
    			attr_dev(a0, "href", "https://www.instagram.com");
    			add_location(a0, file$k, 4, 6, 85);
    			attr_dev(i1, "class", "nav-link fab fa-facebook-square");
    			add_location(i1, file$k, 6, 41, 216);
    			attr_dev(a1, "href", "https://www.facebook.com");
    			add_location(a1, file$k, 6, 6, 181);
    			attr_dev(i2, "class", "nav-link fab fa-youtube");
    			add_location(i2, file$k, 8, 40, 316);
    			attr_dev(a2, "href", "https://www.twitter.com");
    			add_location(a2, file$k, 8, 6, 282);
    			attr_dev(div0, "class", "social");
    			add_location(div0, file$k, 3, 4, 58);
    			add_location(br, file$k, 11, 4, 411);
    			attr_dev(div1, "class", "footer");
    			add_location(div1, file$k, 2, 2, 33);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$k, 0, 0, 0);
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
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props) {
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
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */

    // (15:0) <Router>
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
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(15:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
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
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$p.name
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
