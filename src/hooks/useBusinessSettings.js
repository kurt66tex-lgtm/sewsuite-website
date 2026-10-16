import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

let cachedSettings = null;

export function useBusinessSettings() {
  const [settings, setSettings] = useState(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) return;
    let active = true;
    base44.functions.invoke('getPublicBusinessSettings', {})
      .then((res) => {
        if (!active) return;
        cachedSettings = res.data || res;
        setSettings(cachedSettings);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          // Brand-neutral fallback if the public settings function is unavailable.
          cachedSettings = {
            business_name: 'Service Business',
            industry_module: 'generic_service',
            business_model: 'field_service',
            work_number_prefix: 'WK',
            primary_cta_label: 'Book Service',
            inquiry_noun: 'service request',
            fulfillment_model: ['onsite'],
            asset_tracking_enabled: false,
            asset_label_singular: 'Equipment',
            asset_label_plural: 'Equipment',
            manufacturer_label: 'Manufacturer / Brand',
            phone: null,
            email: null,
            website_url: null,
            hours_mon_fri: null,
            hours_saturday: null,
            hours_sunday: null,
            primary_message: null,
            first_trip_completion_text: null,
            warranty_text: null,
            family_owned: false,
            chat_enabled: true,
            chat_assistant_name: 'Service Assistant',
            chat_welcome_message: 'Hi! I can help you request service. What can we help you with?',
            photo_limit_per_conversation: 5,
            show_business_address_publicly: false,
            primary_brand_color: '#D4A72C',
            secondary_brand_color: '#111111',
            accent_color: '#D4A72C',
            cta_color: '#D4A72C',
            cta_hover_color: '#AE861B',
            button_text_color: '#FFFFFF',
            secondary_button_border_color: '#D4A72C',
            secondary_button_text_color: '#D4A72C',
            secondary_button_hover_background_color: '#D4A72C',
            secondary_button_hover_text_color: '#111111',
            chat_launcher_background_color: '#111111',
            chat_launcher_text_color: '#D4A72C',
            chat_launcher_border_color: '#D4A72C',
            chat_header_background_color: '#111111',
            chat_header_accent_color: '#D4A72C',
            chat_user_message_background_color: '#D4A72C',
            chat_user_message_text_color: '#111111',
            chat_send_background_color: '#111111',
            chat_send_icon_color: '#D4A72C',
            dark_text_color: '#111111',
            light_background_color: '#F5F5F5',
          };
          setSettings(cachedSettings);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  return { settings, loading };
}

export function clearSettingsCache() {
  cachedSettings = null;
}