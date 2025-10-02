import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

class TestDto {
    name: string;
    email: string;
}

@Public()
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(): { message: string } {
        return { message: this.appService.getHello() };
    }

    @Get('health')
    getHealth(): { status: string; timestamp: string } {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('test')
    testValidation(@Body() body: TestDto): { received: TestDto } {
        return { received: body };
    }

    @Get('error')
    testError(): never {
        throw new Error('This is a test error');
    }
}
