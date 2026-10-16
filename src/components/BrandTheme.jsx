import { useEffect } from 'react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

function safeColor(value, fallback) {
  const v = String(value || '').trim();
  return v || fallback;
}

function colorToRgbChannels(value, fallback) {
  const input = safeColor(value, fallback).trim();
  const hex = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let raw = hex[1];
    if (raw.length === 3) raw = raw.split('').map(c => c + c).join('');
    return [
      parseInt(raw.slice(0, 2), 16),
      parseInt(raw.slice(2, 4), 16),
      parseInt(raw.slice(4, 6), 16)
    ].join(' ');
  }
  const rgb = input.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return `${rgb[1]} ${rgb[2]} ${rgb[3]}`;
  return colorToRgbChannels(fallback, '#111111');
}

export default function BrandTheme() {
  const { settings } = useBusinessSettings();

  useEffect(() => {
    const root = document.documentElement;
    const accent = safeColor(settings?.accent_color || settings?.primary_brand_color, '#D4A72C');
    const cta = safeColor(settings?.cta_color || settings?.accent_color || settings?.primary_brand_color, '#D4A72C');
    const accentDark = safeColor(settings?.cta_hover_color, '#AE861B');
    const buttonText = safeColor(settings?.button_text_color, '#FFFFFF');
    const secondaryBorder = safeColor(settings?.secondary_button_border_color || settings?.accent_color, accent);
    const secondaryText = safeColor(settings?.secondary_button_text_color || settings?.accent_color, accent);
    const secondaryHoverBg = safeColor(settings?.secondary_button_hover_background_color || settings?.cta_color || settings?.accent_color, cta);
    const secondaryHoverText = safeColor(settings?.secondary_button_hover_text_color, '#111111');
    const dark = safeColor(settings?.dark_text_color || settings?.secondary_brand_color, '#111111');
    const chatLauncherBg = safeColor(settings?.chat_launcher_background_color || settings?.dark_text_color, dark);
    const chatLauncherText = safeColor(settings?.chat_launcher_text_color || settings?.accent_color, accent);
    const chatLauncherBorder = safeColor(settings?.chat_launcher_border_color || settings?.accent_color, accent);
    const chatHeaderBg = safeColor(settings?.chat_header_background_color || settings?.dark_text_color, dark);
    const chatHeaderAccent = safeColor(settings?.chat_header_accent_color || settings?.accent_color, accent);
    const chatUserBg = safeColor(settings?.chat_user_message_background_color || settings?.accent_color, accent);
    const chatUserText = safeColor(settings?.chat_user_message_text_color || settings?.dark_text_color, dark);
    const chatSendBg = safeColor(settings?.chat_send_background_color || settings?.dark_text_color, dark);
    const chatSendIcon = safeColor(settings?.chat_send_icon_color || settings?.accent_color, accent);
    const light = safeColor(settings?.light_background_color, '#F5F5F5');

    root.style.setProperty('--brand-accent', accent);
    root.style.setProperty('--brand-cta', cta);
    root.style.setProperty('--brand-accent-dark', accentDark);
    root.style.setProperty('--brand-button-text', buttonText);
    root.style.setProperty('--brand-secondary-border', secondaryBorder);
    root.style.setProperty('--brand-secondary-text', secondaryText);
    root.style.setProperty('--brand-secondary-hover-bg', secondaryHoverBg);
    root.style.setProperty('--brand-secondary-hover-text', secondaryHoverText);
    root.style.setProperty('--brand-chat-launcher-bg', chatLauncherBg);
    root.style.setProperty('--brand-chat-launcher-text', chatLauncherText);
    root.style.setProperty('--brand-chat-launcher-border', chatLauncherBorder);
    root.style.setProperty('--brand-chat-header-bg', chatHeaderBg);
    root.style.setProperty('--brand-chat-header-accent', chatHeaderAccent);
    root.style.setProperty('--brand-chat-user-bg', chatUserBg);
    root.style.setProperty('--brand-chat-user-text', chatUserText);
    root.style.setProperty('--brand-chat-send-bg', chatSendBg);
    root.style.setProperty('--brand-chat-send-icon', chatSendIcon);
    root.style.setProperty('--brand-dark', dark);
    root.style.setProperty('--brand-charcoal', dark);
    root.style.setProperty('--brand-light', light);
    root.style.setProperty('--brand-accent-rgb', colorToRgbChannels(accent, '#D4A72C'));
    root.style.setProperty('--brand-accent-dark-rgb', colorToRgbChannels(accentDark, '#AE861B'));
    root.style.setProperty('--brand-dark-rgb', colorToRgbChannels(dark, '#111111'));
    root.style.setProperty('--brand-charcoal-rgb', colorToRgbChannels(dark, '#1A1A1A'));
    root.style.setProperty('--brand-light-rgb', colorToRgbChannels(light, '#F5F5F5'));

    if (settings?.favicon_url) {
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = settings.favicon_url;
    }
  }, [settings]);

  return null;
}
