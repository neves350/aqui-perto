import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const config = new DocumentBuilder()
		.setTitle('Aqui Perto API')
		.setDescription(
			`API for real-time public transit app for Lisbon's metro area`,
		)
		.setVersion('1.0.0')
		.addBearerAuth()
		.build()
	const documentFactory = () => SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('api', app, documentFactory, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	})

	app.use(
		'/docs',
		apiReference({
			content: documentFactory,
		}),
	)

	await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}
bootstrap()
