export function formatGtfsTimeAsClock(time: string): string {
	const [hours, minutes] = time.split(':')
	const clockHours = Number(hours) % 24
	return `${String(clockHours).padStart(2, '0')}:${minutes}`
}
