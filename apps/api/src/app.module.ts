import { Module } from '@nestjs/common'
import { CarrisModule } from './integrations/carris/carris.module'
import { LinesModule } from './modules/lines/lines.module'
import { StopsModule } from './modules/stops/stops.module'
import { ArrivalsModule } from './modules/arrivals/arrivals.module'

@Module({
	imports: [CarrisModule, StopsModule, LinesModule, ArrivalsModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
