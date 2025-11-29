
export const exportToCSV = <T extends Record<string, any>>(data: T[], filename: string) => {
    if (!data.length) return;

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];

            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }

            // Handle strings with commas, quotes, newlines
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }

            // Handle dates
            if (value instanceof Date) {
                return `"${value.toLocaleString()}"`;
            }

            // Handle objects/arrays
            if (typeof value === 'object') {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }

            return value;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

export const exportToJSON = <T>(data: T[], filename: string) => {
    if (!data.length) return;

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
