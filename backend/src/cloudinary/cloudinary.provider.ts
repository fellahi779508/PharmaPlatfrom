import { v2 as cloudinary, ConfigOptions } from 'cloudinary';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider = {
    provide: CLOUDINARY,
    useFactory: (): typeof cloudinary => {
        const config: ConfigOptions = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        };

        if (!config.cloud_name || !config.api_key || !config.api_secret) {
            throw new Error(
                'Cloudinary env vars missing: CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET',
            );
        }

        cloudinary.config(config);
        return cloudinary;
    },
};