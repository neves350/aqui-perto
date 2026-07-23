export function formatGtfsTimeAsClock(time: string): string {
	const [hours, minutes] = time.split(':')
	const clockHours = Number(hours) % 24
	return `${String(clockHours).padStart(2, '0')}:${minutes}`
}

export function toDateWithGtfsTime(referenceDate: Date, time: string): Date {
	const [hours, minutes, seconds] = time.split(':').map(Number)
	const date = new Date(referenceDate)
	date.setHours(hours, minutes, seconds, 0)
	return date
}

export function formatAsYyyymmdd(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}${month}${day}`
}
