import { Module } from '@nestjs/common'
import { CarrisModule } from 'src/integrations/carris/carris.module'
import { StopsController } from './stops.controller'
import { StopsService } from './stops.service'

@Module({
	imports: [CarrisModule],
	controllers: [StopsController],
	providers: [StopsService],
})
export class StopsModule {}
