import { create } from "zustand";

const hexToRgb = (hex) => {
  let r = parseInt(hex.substring(1, 3), 16),
    g = parseInt(hex.substring(3, 5), 16),
    b = parseInt(hex.substring(5, 7), 16);
  return `${r} ${g} ${b}`;
};

// Store global de configuración del sistema (theming + branding)
const useSettingsStore = create((set) => ({
  clinicName: "MindPath Neuro",
  logoUrl: null,
  primaryColor: "#6D28D9",
  primaryHover: "#5B21B6",

  applySettings: (settings) => {
    // Inyectar CSS variables en el documento para el theming dinámico
    if (settings.primary_color) {
      document.documentElement.style.setProperty(
        "--color-primary",
        settings.primary_color,
      );
      if (settings.primary_color.length === 7)
        document.documentElement.style.setProperty(
          "--color-primary-rgb",
          hexToRgb(settings.primary_color),
        );
    }
    if (settings.primary_hover) {
      document.documentElement.style.setProperty(
        "--color-primary-hover",
        settings.primary_hover,
      );
      if (settings.primary_hover.length === 7)
        document.documentElement.style.setProperty(
          "--color-primary-hover-rgb",
          hexToRgb(settings.primary_hover),
        );
    }

    set({
      clinicName: settings.clinic_name || "MindPath Neuro",
      logoUrl: settings.logo_url || null,
      primaryColor: settings.primary_color || "#6D28D9",
      primaryHover: settings.primary_hover || "#5B21B6",
    });
  },
}));

export default useSettingsStore;
