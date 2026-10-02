import { translateCurrent } from '@/lib/i18n';
/** Prepara fotos del celular antes de subirlas; evita archivos enormes y conserva el encuadre. */
export async function prepareWorkerPhoto(file: File): Promise<File> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error(translateCurrent('Selecciona fotos JPG, PNG o WebP.'));
    }

    const image = await createImageBitmap(file);

    try {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error(translateCurrent('No se pudo preparar la foto.'));
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
                (result) =>
                    result
                        ? resolve(result)
                        : reject(
                              new Error(
                                  translateCurrent(
                                      'No se pudo preparar la foto.',
                                  ),
                              ),
                          ),
                'image/webp',
                0.84,
            ),
        );

        if (blob.size > 2 * 1024 * 1024) {
            throw new Error(
                translateCurrent(
                    'La foto pesa demasiado. Elige una imagen más pequeña.',
                ),
            );
        }

        return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
            type: blob.type,
        });
    } finally {
        image.close();
    }
}
