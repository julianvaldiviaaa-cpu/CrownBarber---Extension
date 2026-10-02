let context: AudioContext | undefined;

export function unlockNotificationSound() {
    if (typeof AudioContext === 'undefined') {
        return;
    }

    context ??= new AudioContext();
    void context.resume().catch(() => {});
}

export function playNotificationSound(): boolean {
    if (!context || context.state !== 'running') {
        return false;
    }

    for (const [frequency, delay] of [
        [1046, 0],
        [1568, 0.12],
    ]) {
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        const start = context.currentTime + delay;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        volume.gain.setValueAtTime(0, start);
        volume.gain.linearRampToValueAtTime(0.15, start + 0.01);
        volume.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
        oscillator.connect(volume);
        volume.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.85);
    }

    return true;
}
