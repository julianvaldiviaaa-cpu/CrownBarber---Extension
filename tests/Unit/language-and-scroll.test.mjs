import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import test, { afterEach } from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../../resources/js/', import.meta.url));
const modules = new Map();
const dataUrl = (source) =>
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const mocks = {
    gsap: dataUrl(
        'export const gsap = { registerPlugin() {}, ticker: { add(fn) { globalThis.__scrollTest.tick = fn; }, remove(fn) { if (globalThis.__scrollTest.tick === fn) globalThis.__scrollTest.tick = null; } } };',
    ),
    'gsap/ScrollTrigger': dataUrl(
        'export const ScrollTrigger = { update() {} };',
    ),
    lenis: dataUrl(
        'export default class { constructor(options) { this.options = options; this.destroyed = false; globalThis.__scrollTest.instances.push(this); } on() {} raf(time) { this.time = time; } resize() {} scrollTo(value, options) { this.position = value; this.scrollOptions = options; } stop() { this.stopped = true; } start() { this.stopped = false; } destroy() { this.destroyed = true; } }',
    ),
};

function moduleUrl(filename) {
    if (modules.has(filename)) {
        return modules.get(filename);
    }

    const source = ts
        .transpileModule(readFileSync(filename, 'utf8'), {
            compilerOptions: {
                module: ts.ModuleKind.ESNext,
                jsx: ts.JsxEmit.ReactJSX,
                target: ts.ScriptTarget.ES2022,
            },
            fileName: filename,
        })
        .outputText.replace(/import ['"][^'"]+\.css['"];?/g, '')
        .replace(/from ['"]([^'"]+)['"]/g, (_, specifier) => {
            if (mocks[specifier]) {
                return `from ${JSON.stringify(mocks[specifier])}`;
            }
            if (!specifier.startsWith('@/') && !specifier.startsWith('.')) {
                return `from ${JSON.stringify(import.meta.resolve(specifier))}`;
            }

            const base = specifier.startsWith('@/')
                ? path.join(root, specifier.slice(2))
                : path.resolve(path.dirname(filename), specifier);
            const resolved = [
                base,
                `${base}.ts`,
                `${base}.tsx`,
                path.join(base, 'index.ts'),
            ].find(
                (candidate) =>
                    existsSync(candidate) && /\.tsx?$/.test(candidate),
            );
            assert.ok(resolved, specifier);

            return `from ${JSON.stringify(moduleUrl(resolved))}`;
        });
    const url = dataUrl(source);
    modules.set(filename, url);

    return url;
}

const i18n = await import(moduleUrl(path.join(root, 'lib/i18n.ts')));
const { english } = await import(
    moduleUrl(path.join(root, 'lib/translations.ts'))
);
const { default: LanguageSwitcher } = await import(
    moduleUrl(path.join(root, 'Components/LanguageSwitcher.tsx'))
);
const { formatMoney, formatDate } = await import(
    moduleUrl(path.join(root, 'lib/utils.ts'))
);
const { createSmoothScroll } = await import(
    moduleUrl(path.join(root, 'lib/smooth-scroll.ts'))
);

afterEach(() => {
    for (const key of [
        'window',
        'document',
        'MutationObserver',
        'getComputedStyle',
        '__scrollTest',
    ]) {
        delete globalThis[key];
    }
    i18n.setLanguage('es');
});

test('translates the public site, staff controls and validation without modifying user content', () => {
    assert.equal(i18n.translate('Reservar cita', 'en'), 'Book appointment');
    assert.equal(
        i18n.translate('Guardar perfil profesional', 'en'),
        'Save professional profile',
    );
    assert.equal(
        i18n.translate('Credenciales incorrectas.', 'en'),
        'Incorrect credentials.',
    );
    assert.equal(
        i18n.translate('The email field is required.', 'es'),
        'El campo email es obligatorio.',
    );
    assert.equal(
        i18n.translate('La cita para el 27/09/2026 12:00 fue cancelada.', 'en'),
        'The appointment for 27/09/2026 12:00 was cancelled.',
    );
    assert.equal(
        i18n.translate('Notifications enabled in this browser.', 'es'),
        'Notificaciones activadas en este navegador.',
    );
    assert.equal(
        i18n.translate('Fidelidad de {name}', 'en', { name: 'Ana <&> $1' }),
        'Ana <&> $1’s rewards',
    );
    assert.equal(
        i18n.translate('Texto de usuario fuera del catálogo', 'en'),
        'Texto de usuario fuera del catálogo',
    );
    assert.equal(i18n.translate('toString', 'en'), 'toString');
    assert.equal(i18n.translate(undefined, 'en'), '');
});

test('persists the language, updates document semantics and synchronizes other tabs', () => {
    const events = new Map();
    const storage = new Map([[i18n.LANGUAGE_STORAGE_KEY, 'en']]);
    globalThis.document = { documentElement: { lang: 'es' } };
    globalThis.window = {
        localStorage: {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
        },
        dispatchEvent: (event) => events.get(event.type)?.(event),
        addEventListener: (name, callback) => events.set(name, callback),
        removeEventListener: (name) => events.delete(name),
    };
    const cleanup = i18n.initializeLanguage();
    assert.equal(i18n.getLanguage(), 'en');
    assert.equal(document.documentElement.lang, 'en');

    let beforeLanguage;
    events.set('crown:before-language-change', () => {
        beforeLanguage = i18n.getLanguage();
    });
    i18n.setLanguage('es');
    assert.equal(
        beforeLanguage,
        'en',
        'SplitText cleanup runs before React receives the new language',
    );
    assert.equal(storage.get(i18n.LANGUAGE_STORAGE_KEY), 'es');
    events.get('storage')({ key: i18n.LANGUAGE_STORAGE_KEY, newValue: 'en' });
    assert.equal(i18n.getLanguage(), 'en');
    i18n.setLanguage('fr');
    assert.equal(i18n.getLanguage(), 'en');
    cleanup();
    assert.ok(!events.has('storage'));
});

test('language selection still works with blocked browser storage', () => {
    globalThis.document = { documentElement: { lang: 'es' } };
    globalThis.window = {
        localStorage: {
            getItem() {
                throw new Error('blocked');
            },
            setItem() {
                throw new Error('blocked');
            },
        },
        dispatchEvent() {},
        addEventListener() {},
        removeEventListener() {},
    };
    const cleanup = i18n.initializeLanguage();
    i18n.setLanguage('en');
    assert.equal(i18n.getLanguage(), 'en');
    assert.equal(document.documentElement.lang, 'en');
    cleanup();
});

test('server rendering has an accessible Spanish default and stable hydration snapshot', () => {
    i18n.setLanguage('en');
    const html = renderToStaticMarkup(React.createElement(LanguageSwitcher));
    assert.match(html, /role="group" aria-label="Idioma"/);
    assert.match(html, /lang="es" aria-label="Español" aria-pressed="true"/);
    assert.match(html, /lang="en" aria-label="Inglés" aria-pressed="false"/);
});

test('dates and Mexican peso amounts follow the selected language', () => {
    const date = new Date(2026, 8, 26, 12);
    assert.equal(formatDate(date, 'es-MX'), '26/09/2026');
    assert.equal(formatDate(date, 'en-US'), '09/26/2026');
    assert.equal(
        formatMoney(150, 'en-US'),
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(150),
    );
    assert.equal(
        new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
            new Date(2026, 2, 1),
        ),
        'Mar',
    );
});

test('all translated literals have English entries and matching interpolation parameters', () => {
    for (const [es, en] of Object.entries(english)) {
        const keys = (value) =>
            [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
        assert.deepEqual(keys(es), keys(en), es);
    }

    function visitDirectory(directory) {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const filename = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visitDirectory(filename);
            } else if (/\.tsx?$/.test(filename)) {
                const source = ts.createSourceFile(
                    filename,
                    readFileSync(filename, 'utf8'),
                    ts.ScriptTarget.Latest,
                    true,
                    ts.ScriptKind.TSX,
                );
                const visit = (node) => {
                    if (
                        ts.isCallExpression(node) &&
                        ['t', 'translateCurrent'].includes(
                            node.expression.getText(source),
                        ) &&
                        ts.isStringLiteral(node.arguments[0])
                    ) {
                        assert.ok(
                            Object.hasOwn(english, node.arguments[0].text),
                            `${filename}: ${node.arguments[0].text}`,
                        );
                    }
                    if (ts.isJsxText(node)) {
                        assert.ok(
                            !/[áéíóúñ¿¡]/.test(node.text),
                            `Untranslated Spanish text in ${filename}: ${node.text.trim()}`,
                        );
                    }
                    ts.forEachChild(node, visit);
                };
                visit(source);
            }
        }
    }
    for (const directory of ['Components', 'Layouts', 'pages']) {
        visitDirectory(path.join(root, directory));
    }
});

function scrollEnvironment(reducedMotion = false) {
    const events = new Map();
    const mediaEvents = new Map();
    const state = { instances: [], tick: null, mutation: null };
    const media = {
        matches: reducedMotion,
        addEventListener: (name, callback) => mediaEvents.set(name, callback),
        removeEventListener: (name) => mediaEvents.delete(name),
    };
    globalThis.__scrollTest = state;
    globalThis.window = {
        scrollY: 420,
        matchMedia: () => media,
        addEventListener: (name, callback) => events.set(name, callback),
        removeEventListener: (name) => events.delete(name),
    };
    globalThis.document = {
        body: { style: { overflow: '' } },
        documentElement: { style: { overflow: '', overflowY: '' } },
        addEventListener: (name, callback) => events.set(name, callback),
        removeEventListener: (name) => events.delete(name),
    };
    globalThis.getComputedStyle = (element) => ({
        overflowY:
            element === document.body
                ? element.style.overflow
                : state.instances.at(-1)?.stopped
                  ? 'clip'
                  : 'visible',
    });
    globalThis.MutationObserver = class {
        constructor(callback) {
            state.mutation = callback;
        }
        observe() {}
        disconnect() {
            state.mutation = null;
        }
    };

    return { state, events, media, mediaEvents };
}

test('smooth scrolling keeps Inertia position, pauses for overlays and resumes after closing them', () => {
    const { state, events } = scrollEnvironment();
    const cleanup = createSmoothScroll();
    assert.equal(state.instances.length, 1);
    const lenis = state.instances[0];
    assert.equal(lenis.options.allowNestedScroll, true);
    assert.equal(lenis.options.syncTouch, false);
    state.tick(2);
    assert.equal(lenis.time, 2000);
    events.get('crown:scroll-sync')();
    assert.equal(
        lenis.position,
        420,
        'Scroll restoration must not force the page to the top',
    );
    assert.deepEqual(lenis.scrollOptions, { immediate: true });
    document.body.style.overflow = 'hidden';
    state.mutation();
    assert.equal(lenis.stopped, true);
    document.body.style.overflow = '';
    state.mutation();
    assert.equal(
        lenis.stopped,
        false,
        'The Lenis stopped class must not prevent restarting',
    );
    assert.equal(
        lenis.options.prevent({
            hasAttribute: () => false,
            getAttribute: () => 'dialog',
        }),
        true,
    );
    cleanup();
    assert.equal(lenis.destroyed, true);
    assert.equal(state.tick, null);
    assert.equal(state.mutation, null);
    assert.equal(events.size, 0);
});

test('reduced motion uses native scrolling and responds to preference changes without leaking instances', () => {
    const { state, media, mediaEvents } = scrollEnvironment(true);
    const cleanup = createSmoothScroll();
    assert.equal(state.instances.length, 0);
    media.matches = false;
    mediaEvents.get('change')();
    assert.equal(state.instances.length, 1);
    media.matches = true;
    mediaEvents.get('change')();
    assert.equal(state.instances[0].destroyed, true);
    cleanup();
    assert.equal(mediaEvents.size, 0);
});
