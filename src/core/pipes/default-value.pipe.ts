import { Injectable } from '@nestjs/common';
import { BasePipe, BasePipeOptions } from './base/base.pipe';
import { isNullOrUndefined, isEmptyString } from '../../common/utils/type.util';

/**
 * Configuration options for DefaultValuePipe
 */
interface DefaultValueOptions extends BasePipeOptions {
    replaceEmptyString?: boolean;
}

/**
 * DefaultValuePipe for handling optional parameters with default values
 * Provides default values when input is undefined, null, or empty string
 */
@Injectable()
export class DefaultValuePipe<
    T = unknown,
> extends BasePipe<DefaultValueOptions> {
    private readonly defaultValue: T;

    constructor(defaultValue: T, replaceEmptyString: boolean = false) {
        super(
            {
                skipNullAndUndefined: false,
                replaceEmptyString: false,
            },
            { replaceEmptyString },
        );
        this.defaultValue = defaultValue;
    }

    /**
     * Transform value by providing default when value is null/undefined/empty
     */
    protected doTransform(value: unknown): T {
        if (isNullOrUndefined(value)) {
            return this.defaultValue;
        }

        // Optionally replace empty strings with default value
        if (this.options.replaceEmptyString && isEmptyString(value)) {
            return this.defaultValue;
        }

        return value as T;
    }
}
