import { Module } from '@nestjs/common'
import { CarrisModule } from 'src/integrations/carris/carris.module'
import { PathController } from './path.controller'
import { PathService } from './path.service'

@Module({
	imports: [CarrisModule],
	controllers: [PathController],
	providers: [PathService],
})
export class PathModule {}
