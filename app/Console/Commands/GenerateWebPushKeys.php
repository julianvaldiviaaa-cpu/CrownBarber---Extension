<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

#[Signature('webpush:keys')]
#[Description('Genera claves VAPID en .env sin mostrar ni reemplazar claves existentes')]
class GenerateWebPushKeys extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $path = app()->environmentFilePath();
        if (! is_file($path)) {
            $this->error('Primero crea el archivo .env.');

            return self::FAILURE;
        }
        $contents = file_get_contents($path);
        if (preg_match('/^VAPID_(PUBLIC|PRIVATE)_KEY=.+$/m', $contents)) {
            $this->error('Ya existen claves VAPID. Se conservaron sin cambios.');

            return self::FAILURE;
        }
        $keys = VAPID::createVapidKeys();
        foreach (['VAPID_PUBLIC_KEY' => $keys['publicKey'], 'VAPID_PRIVATE_KEY' => $keys['privateKey']] as $name => $value) {
            $contents = preg_replace('/^'.$name.'=.*\R?/m', '', $contents);
            $contents = rtrim($contents).PHP_EOL.$name.'='.$value.PHP_EOL;
        }
        file_put_contents($path, $contents, LOCK_EX);
        $this->info('Claves VAPID guardadas en .env.');

        return self::SUCCESS;
    }
}
