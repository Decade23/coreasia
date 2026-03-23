export const useConsoleDateTime = () => {
  const { dateLocale } = useConsoleI18n()

  const formatDateTime = (value: string | Date | null | undefined) => {
    if (!value) return '-'

    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return String(value)
    }

    return new Intl.DateTimeFormat(dateLocale.value, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date)
  }

  return {
    formatDateTime,
  }
}
