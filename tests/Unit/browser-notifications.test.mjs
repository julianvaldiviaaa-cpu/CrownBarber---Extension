import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function worker(windows = []) {
    const events = {};
    const shown = [];
    const opened = [];
    const self = {
        location: { origin: 'https://crown.example' },
        addEventListener: (name, callback) => { events[name] = callback; },
        clients: { matchAll: async () => windows, openWindow: async (url) => opened.push(url) },
        registration: { showNotification: async (title, options) => shown.push({ title, options }) },
    };
    vm.runInNewContext(readFileSync(new URL('../../public/service-worker.js', import.meta.url), 'utf8'), { self, URL });
    return { events, shown, opened };
}

test('un aviso con la web cerrada muestra la interacción y todos sus datos', async () => {
    const runtime = worker();
    let pending;
    runtime.events.push({ data: { json: () => ({ id: 'new-1', title: 'Cita confirmada', message: '23/09/2026 12:00', client_name: 'Cliente', worker_name: 'Barbero', services: ['Corte'], total_duration: 30, total_price: '150.00', url: 'https://crown.example/dashboard/appointments/1' }) }, waitUntil: (promise) => { pending = promise; } });
    await pending;
    assert.equal(runtime.shown.length, 1);
    assert.equal(runtime.shown[0].title, 'Cita confirmada');
    assert.match(runtime.shown[0].options.body, /Cliente.*Barbero/);
    assert.match(runtime.shown[0].options.body, /Corte/);
    assert.match(runtime.shown[0].options.body, /150.00 MXN/);
    assert.equal(runtime.shown[0].options.silent, false);
});

test('al pulsar un aviso se abre la cita y se rechazan destinos externos', async () => {
    const runtime = worker();
    for (const url of ['https://crown.example/dashboard/appointments/1', 'https://evil.example']) {
        let pending;
        runtime.events.notificationclick({ notification: { close() {}, data: { url } }, waitUntil: (promise) => { pending = promise; } });
        await pending;
    }
    assert.deepEqual(runtime.opened, ['https://crown.example/dashboard/appointments/1']);
});

test('la campanita respeta el bloqueo de audio hasta una interacción', () => {
    const tones = [];
    class AudioContext {
        state = 'suspended';
        currentTime = 0;
        destination = {};
        async resume() { this.state = 'running'; }
        createOscillator() { const tone = { frequency: {}, connect() {}, start() { tones.push(this); }, stop() {} }; return tone; }
        createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    }
    const source = ts.transpileModule(readFileSync(new URL('../../resources/js/lib/notification-sound.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {};
    vm.runInNewContext(source, { exports, AudioContext });
    exports.playNotificationSound();
    assert.equal(tones.length, 0);
    exports.unlockNotificationSound();
    exports.playNotificationSound();
    assert.equal(tones.length, 2);
    assert.deepEqual(tones.map((tone) => tone.frequency.value), [1046, 1568]);
});
