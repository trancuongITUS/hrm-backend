import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ERROR_CODE } from '../../common/constants';

/**
 * File validation configuration
 */
interface FileValidationOptions {
    maxSize?: number; // in bytes
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
    requireExtension?: boolean;
    maxFiles?: number;
}

/**
 * File object interface
 */
interface FileObject {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer?: Buffer;
    filename?: string;
}

/**
 * FileValidationPipe for file upload validation
 * Validates uploaded files based on size, type, and extension
 */
@Injectable()
export class FileValidationPipe implements PipeTransform<unknown, unknown> {
    private readonly options: Required<FileValidationOptions>;

    constructor(options: FileValidationOptions = {}) {
        this.options = {
            maxSize: 5 * 1024 * 1024, // 5MB default
            allowedMimeTypes: [],
            allowedExtensions: [],
            requireExtension: false,
            maxFiles: 1,
            ...options,
        };
    }

    /**
     * Transform and validate file uploads
     */
    transform(value: unknown): unknown {
        if (!value) {
            return value;
        }

        // Handle single file
        if (this.isFileObject(value)) {
            return this.validateSingleFile(value);
        }

        // Handle array of files
        if (Array.isArray(value)) {
            if (value.length > this.options.maxFiles) {
                throw new BadRequestException({
                    message: `Too many files. Maximum allowed: ${this.options.maxFiles}`,
                    error: ERROR_CODE.TOO_MANY_FILES,
                    details: `Received ${value.length} files, but maximum is ${this.options.maxFiles}.`,
                });
            }

            return value.map((file, index) => {
                if (!this.isFileObject(file)) {
                    throw new BadRequestException({
                        message: `Invalid file at index ${index}`,
                        error: ERROR_CODE.INVALID_FILE_OBJECT,
                        details: 'File object is missing required properties.',
                    });
                }
                return this.validateSingleFile(file);
            });
        }

        return value;
    }

    /**
     * Validate a single file object
     */
    private validateSingleFile(file: FileObject): FileObject {
        // Validate file size
        if (file.size > this.options.maxSize) {
            const maxSizeMB = (this.options.maxSize / (1024 * 1024)).toFixed(2);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

            throw new BadRequestException({
                message: `File '${file.originalname}' is too large. Maximum size: ${maxSizeMB}MB`,
                error: ERROR_CODE.FILE_TOO_LARGE,
                details: `File size is ${fileSizeMB}MB, but maximum allowed is ${maxSizeMB}MB.`,
            });
        }

        // Validate MIME type
        if (this.options.allowedMimeTypes.length > 0) {
            if (!this.options.allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException({
                    message: `File '${file.originalname}' has invalid type. Allowed types: ${this.options.allowedMimeTypes.join(', ')}`,
                    error: ERROR_CODE.INVALID_FILE_TYPE,
                    details: `File MIME type '${file.mimetype}' is not allowed.`,
                });
            }
        }

        // Validate file extension
        const extension = this.getFileExtension(file.originalname);

        if (this.options.requireExtension && !extension) {
            throw new BadRequestException({
                message: `File '${file.originalname}' must have a file extension`,
                error: ERROR_CODE.MISSING_FILE_EXTENSION,
                details: 'File extension is required but not found.',
            });
        }

        if (this.options.allowedExtensions.length > 0 && extension) {
            const normalizedExtension = extension.toLowerCase();
            const allowedExtensions = this.options.allowedExtensions.map(
                (ext) => ext.toLowerCase(),
            );

            if (!allowedExtensions.includes(normalizedExtension)) {
                throw new BadRequestException({
                    message: `File '${file.originalname}' has invalid extension. Allowed extensions: ${this.options.allowedExtensions.join(', ')}`,
                    error: ERROR_CODE.INVALID_FILE_EXTENSION,
                    details: `File extension '${extension}' is not allowed.`,
                });
            }
        }

        return file;
    }

    /**
     * Check if value is a valid file object
     */
    private isFileObject(value: unknown): value is FileObject {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const file = value as Partial<FileObject>;
        return !!(
            file.fieldname &&
            file.originalname &&
            file.mimetype &&
            typeof file.size === 'number'
        );
    }

    /**
     * Extract file extension from filename
     */
    private getFileExtension(filename: string): string | null {
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
            return null;
        }
        return filename.substring(lastDotIndex + 1);
    }
}
