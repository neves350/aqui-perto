import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CarrisModule } from './integrations/carris/carris.module'

@Module({
	imports: [CarrisModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
