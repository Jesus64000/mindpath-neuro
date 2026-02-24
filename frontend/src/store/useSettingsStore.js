import { create } from 'zustand';

// Store global de configuración del sistema (theming + branding)
const useSettingsStore = create((set) => ({
    clinicName:   'MindPath Neuro',
    logoUrl:      null,
    primaryColor: '#6D28D9',
    primaryHover: '#5B21B6',

    applySettings: (settings) => {
        // Inyectar CSS variables en el documento para el theming dinámico
        if (settings.primary_color) {
            document.documentElement.style.setProperty('--color-primary', settings.primary_color);
        }
        if (settings.primary_hover) {
            document.documentElement.style.setProperty('--color-primary-hover', settings.primary_hover);
        }

        set({
            clinicName:   settings.clinic_name   || 'MindPath Neuro',
            logoUrl:      settings.logo_url       || null,
            primaryColor: settings.primary_color  || '#6D28D9',
            primaryHover: settings.primary_hover  || '#5B21B6',
        });
    },
}));

export default useSettingsStore;
