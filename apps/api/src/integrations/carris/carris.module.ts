import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { CarrisClientService } from './carris-client.service'

@Module({
	imports: [
		HttpModule.register({
			baseURL: 'https://api.carrismetropolitana.pt/v2',
			timeout: 5000,
		}),
	],
	providers: [CarrisClientService],
	exports: [CarrisClientService],
})
export class CarrisModule {}
