import {
    BadRequestException,
    Inject,
    Injectable,
} from '@nestjs/common';
import {
    UploadApiErrorResponse,
    UploadApiResponse,
    v2 as CloudinaryType,
} from 'cloudinary';

export interface UploadedImage {
    url: string;
    secureUrl: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
}

@Injectable()
export class CloudinaryService {
    constructor(
        @Inject('CLOUDINARY') private readonly cloudinary: typeof CloudinaryType,
    ) { }

    /**
     * Uploads a buffer to Cloudinary.
     *
     * @param file    Multer file (memory storage)
     * @param folder  Subfolder inside the configured root folder
     * @returns       Normalized image metadata
     */
    async uploadBuffer(
        file: Express.Multer.File,
        folder = 'summaries',
    ): Promise<UploadedImage> {
        if (!file?.buffer?.length) {
            throw new BadRequestException('No file provided');
        }

        const rootFolder = process.env.CLOUDINARY_FOLDER ?? 'uploads';

        return new Promise<UploadedImage>((resolve, reject) => {
            const stream = this.cloudinary.uploader.upload_stream(
                {
                    folder: `${rootFolder}/${folder}`,
                    resource_type: 'image',
                    // Sensible defaults; Cloudinary will auto-optimize.
                    transformation: [
                        { quality: 'auto:good', fetch_format: 'auto' },
                        { width: 1600, crop: 'limit' },
                    ],
                },
                (
                    error: UploadApiErrorResponse | undefined,
                    result: UploadApiResponse | undefined,
                ) => {
                    if (error || !result) {
                        return reject(
                            new BadRequestException(
                                error?.message ?? 'Cloudinary upload failed',
                            ),
                        );
                    }

                    resolve({
                        url: result.url,
                        secureUrl: result.secure_url,
                        publicId: result.public_id,
                        format: result.format,
                        width: result.width,
                        height: result.height,
                        bytes: result.bytes,
                    });
                },
            );

            stream.end(file.buffer);
        });
    }

    /**
     * Deletes an asset by its public id. Silently succeeds if the asset
     * doesn't exist (so deleting an already-deleted image doesn't throw).
     */
    async destroy(publicId: string): Promise<void> {
        if (!publicId) return;

        try {
            await this.cloudinary.uploader.destroy(publicId, {
                resource_type: 'image',
                invalidate: true,
            });
        } catch (e: any) {
            // Cloudinary returns a success response with `result: 'not found'`
            // rather than throwing, but guard anyway.
            console.warn('Cloudinary destroy failed:', e?.message ?? e);
        }
    }
}