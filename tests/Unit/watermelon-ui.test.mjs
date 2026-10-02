import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../../resources/js/', import.meta.url));
const modules = new Map();

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
        .outputText.replace(/from ["']([^"']+)["']/g, (_, specifier) => {
            if (!specifier.startsWith('@/') && !specifier.startsWith('.')) {
                return `from ${JSON.stringify(import.meta.resolve(specifier))}`;
            }

            const base = specifier.startsWith('@/')
                ? path.join(root, specifier.slice(2))
                : path.resolve(path.dirname(filename), specifier);
            const resolved = [
                base,
                `${base}.tsx`,
                `${base}.ts`,
                path.join(base, 'index.ts'),
            ].find(
                (candidate) =>
                    /\.[cm]?[jt]sx?$/.test(candidate) && existsSync(candidate),
            );
            assert.ok(resolved, `Module exists: ${specifier}`);

            return `from ${JSON.stringify(moduleUrl(resolved))}`;
        });
    const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
    modules.set(filename, url);

    return url;
}

const ui = await import(
    moduleUrl(path.join(root, 'Components/Watermelon.tsx'))
);
const { default: LoyaltyCard } = await import(
    moduleUrl(path.join(root, 'Components/LoyaltyCard.tsx'))
);
const render = (component, props) =>
    renderToStaticMarkup(React.createElement(component, props));

test('native form actions preserve submit behavior and disabled state', () => {
    const html = render(ui.NativeButton, {
        disabled: true,
        form: 'service-form',
        children: 'Guardar',
    });
    assert.match(html, /type="submit"/);
    assert.match(html, /disabled=""/);
    assert.match(html, /form="service-form"/);
    assert.match(
        render(ui.AnimatedButton, { children: 'Abrir' }),
        /type="button"/,
    );
});

test('floating inputs keep the label associated and render filled values', () => {
    const html = render(ui.FloatingInput, {
        id: 'customer-name',
        label: 'Nombre',
        defaultValue: 'Ana',
    });
    assert.match(html, /id="customer-name"/);
    assert.match(html, /for="customer-name"/);
    assert.match(html, /value="Ana"/);
});

test('progress exposes its bounded value to assistive technology', () => {
    const html = render(ui.Progress, { value: 19, max: 10, label: 'Visitas' });
    assert.match(html, /role="progressbar"/);
    assert.match(html, /aria-valuenow="10"/);
    assert.match(html, /aria-valuemax="10"/);
});

test('loyalty card has ten stamps and a reward slot at desktop and mobile widths', () => {
    for (const stamps of [0, 5, 9]) {
        const html = render(LoyaltyCard, {
            showLink: false,
            loyalty: {
                stamps,
                target: 10,
                rewards_available: stamps === 9 ? 1 : 0,
                rewards_redeemed: 0,
                visits: stamps,
            },
        });
        assert.equal((html.match(/<li /g) ?? []).length, 10);
        assert.equal((html.match(/data-filled="true"/g) ?? []).length, stamps);
        assert.match(html, /Día 10: corte o facial gratis/);
        assert.match(html, /grid-cols-5/);
        assert.match(html, /sm:grid-cols-10/);
        assert.equal(html.includes('Premio disponible'), stamps === 9);
    }
});

test('table preserves semantic markup inside a horizontal overflow container', () => {
    const html = render(ui.Table, {
        children: React.createElement(
            'tbody',
            null,
            React.createElement(
                'tr',
                null,
                React.createElement('td', null, 'Visita'),
            ),
        ),
    });
    assert.match(html, /overflow-x-auto/);
    assert.match(html, /<table[^>]*>.*<tbody><tr><td>Visita/);
});
