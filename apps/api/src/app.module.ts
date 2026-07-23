import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CarrisModule } from './integrations/carris/carris.module'
import { ArrivalsModule } from './modules/arrivals/arrivals.module'
import { LinesModule } from './modules/lines/lines.module'
import { PathModule } from './modules/path/path.module'
import { StopsModule } from './modules/stops/stops.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
		CarrisModule,
		StopsModule,
		LinesModule,
		ArrivalsModule,
		PathModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
