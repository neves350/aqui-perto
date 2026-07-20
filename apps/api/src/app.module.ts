import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CarrisModule } from './integrations/carris/carris.module'
import { StopsModule } from './modules/stops/stops.module';

@Module({
	imports: [CarrisModule, StopsModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
