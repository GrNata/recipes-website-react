export const formatDateForBackend = (dateString: string): string | undefined => {
    if (!dateString) return undefined;

    // dateString приходит как "2026-02-01"
    const [year, month, day] = dateString.split('-');

    // Возвращаем "01-02-2026"
    return `${day}-${month}-${year}`;
};

export const formatCookingTime = (totalMinutes?: number | null): string => {
    if (!totalMinutes || totalMinutes <= 0) return 'Время не указано';

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h > 0 && m > 0) return `${h} ч ${m} мин`;
    if (h > 0 ) return `${h} ч`;

    return `${m} мин`
};