import { useMemo } from 'react';

// Placeholder for pictures (model icons)
export const useInitialPlaceholder = (name: string, options?: { size?: number; backgroundColor?: string; textColor?: string; shape?: string; fontSize?: number; fontFamily?: string }): string => {
    // ---------------- Hooks ---------------- 
    return useMemo(() => {
        // Default settings
        const {
            size = 100,
            backgroundColor = null,
            textColor = '#ffffff',
            shape = 'rounded',
            fontSize = null,
            fontFamily = 'Arial'
        } = options || {};

        // Use initial letter for placeholder
        const initial = name.charAt(0).toUpperCase();

        // Auto-generate background color if not specified
        let bgColor = backgroundColor;
        if (!bgColor) {
            const hash = name.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);
            const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'];
            bgColor = colors[Math.abs(hash) % colors.length];
        }

        // Calculate font size if not specified
        const calculatedFontSize = fontSize || size * 0.4;

        // Return SVG as data URL
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <clipPath id="clip">
                        <rect width="${size}" height="${size}" rx="${shape === 'circle' ? size / 2 : (shape === 'rounded' ? size * 0.1 : 0)}" ry="${shape === 'circle' ? size / 2 : (shape === 'rounded' ? size * 0.1 : 0)}"/>
                    </clipPath>
                </defs>
                <rect width="100%" height="100%" fill="${bgColor}" clip-path="url(#clip)"/>
                <text x="50%" y="50%" font-family="${fontFamily}" font-size="${calculatedFontSize}" 
                      fill="${textColor}" text-anchor="middle" dy=".3em" clip-path="url(#clip)">${initial}</text>
            </svg>
        `)}`;
    }, [name, options]);
};