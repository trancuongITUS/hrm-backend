import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

import { ApiProperty } from '@nestjs/swagger';

class TestDto {
    @ApiProperty({
        description: 'Name of the user',
        example: 'John Doe',
    })
    name: string;

    @ApiProperty({
        description: 'Email address of the user',
        example: 'john.doe@example.com',
        format: 'email',
    })
    email: string;
}

@ApiTags('app')
@Public()
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @ApiOperation({
        summary: 'Get hello message',
        description: 'Returns a simple hello world message',
    })
    @ApiResponse({
        status: 200,
        description: 'Hello message returned successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Hello World!' },
            },
        },
    })
    @Get()
    getHello(): { message: string } {
        return { message: this.appService.getHello() };
    }

    @ApiOperation({
        summary: 'Health check',
        description: 'Check the health status of the application',
    })
    @ApiResponse({
        status: 200,
        description: 'Application is healthy',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
                timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2023-01-01T00:00:00.000Z',
                },
            },
        },
    })
    @Get('health')
    getHealth(): { status: string; timestamp: string } {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    @ApiOperation({
        summary: 'Test validation',
        description: 'Test endpoint for validation functionality',
    })
    @ApiResponse({
        status: 201,
        description: 'Validation test completed successfully',
        schema: {
            type: 'object',
            properties: {
                received: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'John Doe' },
                        email: {
                            type: 'string',
                            example: 'john.doe@example.com',
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - validation errors',
    })
    @Post('test')
    testValidation(@Body() body: TestDto): { received: TestDto } {
        return { received: body };
    }

    @ApiOperation({
        summary: 'Test error handling',
        description:
            'Test endpoint that throws an error for testing error handling',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error - test error thrown',
    })
    @Get('error')
    testError(): never {
        throw new Error('This is a test error');
    }
}
