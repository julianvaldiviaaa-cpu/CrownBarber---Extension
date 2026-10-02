<?php

use Illuminate\Foundation\Console\ServeCommand;
use Symfony\Component\Process\Process;

it('conserva la carpeta temporal de Windows en el proceso PHP del servidor', function () {
    $command = new class extends ServeCommand
    {
        public function serverEnvironment(): array
        {
            return collect($_ENV)->mapWithKeys(fn ($value, $key) => [
                $key => $this->shouldPassThroughEnvironmentVariable($key) ? $value : false,
            ])->all();
        }
    };

    $process = new Process([
        PHP_BINARY,
        '-r',
        'echo sys_get_temp_dir();',
    ], base_path(), $command->serverEnvironment());
    $process->mustRun();

    expect($process->getOutput())->toBe(sys_get_temp_dir());
})->skip(PHP_OS_FAMILY !== 'Windows', 'La regresión afecta al servidor de desarrollo en Windows.');
