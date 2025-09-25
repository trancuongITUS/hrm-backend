import { Injectable } from '@nestjs/common';
import { BaseStringPipe, BasePipeOptions } from './base/base.pipe';

/**
 * Sanitization options
 */
interface SanitizeOptions extends BasePipeOptions {
    stripHtml?: boolean;
    stripScripts?: boolean;
    trimWhitespace?: boolean;
    removeSpecialChars?: boolean;
    allowedTags?: string[];
    maxLength?: number;
    onlyStrings?: boolean;
}

/**
 * SanitizePipe for input sanitization and security
 * Removes potentially harmful content from string inputs
 */
@Injectable()
export class SanitizePipe extends BaseStringPipe<SanitizeOptions> {
    constructor(options: Partial<SanitizeOptions> = {}) {
        super(
            {
                skipNullAndUndefined: true,
                onlyStrings: true,
                stripHtml: true,
                stripScripts: true,
                trimWhitespace: true,
                removeSpecialChars: false,
                allowedTags: [],
                maxLength: 0, // 0 means no limit
            },
            options,
        );
    }

    /**
     * Transform value by sanitizing if it's a string
     */
    protected doTransform(value: unknown): unknown {
        const stringValue = this.ensureString(value);

        // If ensureString returned the original value (not a string), return it
        if (stringValue === value && typeof value !== 'string') {
            return value;
        }

        let sanitized = stringValue;

        // Apply sanitization steps using private methods
        if (this.options.stripHtml) {
            sanitized = this.stripHtmlTags(sanitized);
        }

        if (this.options.stripScripts) {
            sanitized = this.stripScriptContent(sanitized);
        }

        if (this.options.removeSpecialChars) {
            sanitized = this.removeSpecialCharacters(sanitized);
        }

        if (this.options.trimWhitespace) {
            sanitized = this.trimAndNormalizeWhitespace(sanitized);
        }

        sanitized = this.truncateToMaxLength(sanitized);
        sanitized = this.decodeHtmlEntities(sanitized);

        return sanitized;
    }

    /**
     * Strip HTML tags from string
     */
    private stripHtmlTags(value: string): string {
        if (this.options.allowedTags.length > 0) {
            // Remove all HTML tags except allowed ones
            const allowedPattern = this.options.allowedTags
                .map((tag) => tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|');
            const regex = new RegExp(
                `<(?!/?(?:${allowedPattern})(?:\\s|>))[^>]*>`,
                'gi',
            );
            return value.replace(regex, '');
        } else {
            // Remove all HTML tags
            return value.replace(/<[^>]*>/g, '');
        }
    }

    /**
     * Strip script tags and JavaScript content
     */
    private stripScriptContent(value: string): string {
        let result = value;
        result = result.replace(
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            '',
        );
        result = result.replace(/javascript:/gi, '');
        result = result.replace(/on\w+\s*=/gi, '');
        return result;
    }

    /**
     * Remove special characters
     */
    private removeSpecialCharacters(value: string): string {
        return value.replace(/[^\w\s.,!?@#$%^&*()[\]{};:'"<>+=\-_/\\|`~]/g, '');
    }

    /**
     * Trim whitespace and normalize spaces
     */
    private trimAndNormalizeWhitespace(value: string): string {
        let result = value.trim();
        // Replace multiple whitespace with single space
        result = result.replace(/\s+/g, ' ');
        return result;
    }

    /**
     * Truncate string to max length
     */
    private truncateToMaxLength(value: string): string {
        if (
            this.options.maxLength > 0 &&
            value.length > this.options.maxLength
        ) {
            return value.substring(0, this.options.maxLength).trim();
        }
        return value;
    }

    /**
     * Decode common HTML entities
     */
    private decodeHtmlEntities(value: string): string {
        return value
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .replace(/&#x60;/g, '`')
            .replace(/&#x3D;/g, '=');
    }
}
