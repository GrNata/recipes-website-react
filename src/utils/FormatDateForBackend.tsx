export const formatDateForBackend = (dateString: string): string | undefined => {
    if (!dateString) return undefined;

    // dateString приходит как "2026-02-01"
    const [year, month, day] = dateString.split('-');

    // Возвращаем "01-02-2026"
    return `${day}-${month}-${year}`;
};