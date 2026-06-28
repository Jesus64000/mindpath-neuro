import { create } from "zustand";
import { BACKEND_URL } from "../api/constants";

const hexToRgb = (hex) => {
  let r = parseInt(hex.substring(1, 3), 16),
    g = parseInt(hex.substring(3, 5), 16),
    b = parseInt(hex.substring(5, 7), 16);
  return `${r} ${g} ${b}`;
};

// Cargar fuente de Google Fonts dinámicamente
const loadGoogleFont = (fontName) => {
  if (!fontName || fontName === 'system-ui') return;
  
  const linkId = 'dynamic-google-font';
  let existing = document.getElementById(linkId);
  
  // Si ya existe un link, actualizar el href
  if (existing) {
    existing.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800;900&display=swap`;
  } else {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }
};

// Store global de configuración del sistema (theming + branding + fuentes)
const useSettingsStore = create((set) => ({
  clinicName: "MindPath Neuro",
  logoUrl: null,
  logoSize: 40,
  hideSidebarText: false,
  primaryColor: "#6D28D9",
  primaryHover: "#5B21B6",
  fontFamily: "Inter",
  exchangeRate: 36.50,
  exchangeRateMode: "auto",

  applySettings: (settings) => {
    // Aplicar logo como Favicon dinámicamente
    if (settings.logo_url) {
      const fullLogoUrl = settings.logo_url.startsWith('http') 
        ? settings.logo_url 
        : `${BACKEND_URL}${settings.logo_url}`;
      
      const favicons = document.querySelectorAll("link[rel*='icon']");
      if (favicons.length > 0) {
        favicons.forEach(fav => {
          fav.href = fullLogoUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = fullLogoUrl;
        document.head.appendChild(link);
      }
    }

    // Aplicar nombre de la clínica al título de la pestaña
    if (settings.clinic_name) {
      document.title = settings.clinic_name;
    }

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

    // Sprint 29: Inyectar tipografía del sistema con soporte Google Fonts
    const font = settings.font_family || "Inter";
    
    // Cargar la fuente de Google Fonts si no es system-ui
    loadGoogleFont(font);
    
    // Aplicar la fuente al documento
    document.documentElement.style.setProperty("--system-font", `'${font}'`);
    document.body.style.fontFamily = `'${font}', ui-sans-serif, system-ui, -apple-system, sans-serif`;

    set({
      clinicName: settings.clinic_name || "MindPath Neuro",
      logoUrl: settings.logo_url || null,
      logoSize: Number(settings.logo_size) || 40,
      hideSidebarText: !!settings.hide_sidebar_text,
      primaryColor: settings.primary_color || "#6D28D9",
      primaryHover: settings.primary_hover || "#5B21B6",
      fontFamily: font,
      exchangeRate: parseFloat(settings.exchange_rate) || 36.50,
      exchangeRateMode: settings.exchange_rate_mode || "auto",
    });
  },
}));

export default useSettingsStore;
