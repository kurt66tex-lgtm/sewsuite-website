// Inbox data helpers: unified item building, conversation labels, tab filtering.

export function getConversationLabel(conv, leads = [], customers = []) {
  // Priority 1: Customer name
  if (conv.customer_id) {
    const c = customers.find(c => c.id === conv.customer_id);
    if (c) return `${c.first_name} ${c.last_name}`;
  }
  // Priority 2: Lead name or appliance + city
  if (conv.lead_id) {
    const l = leads.find(l => l.id === conv.lead_id);
    if (l) {
      if (l.first_name || l.last_name) return `${l.first_name || ''} ${l.last_name || ''}`.trim();
      if (l.service_type || l.asset_type || l.appliance_type || l.city) return [l.service_type || l.asset_type || l.appliance_type, l.city].filter(Boolean).join(' · ');
    }
  }
  // Priority 3: collected_data customer name
  const cd = conv.collected_data || {};
  const collectedName =
    cd.name ||
    cd.customer_name ||
    [cd.first_name, cd.last_name].filter(Boolean).join(' ').trim();
  if (collectedName) return collectedName;

  // Priority 4: collected_data appliance/city
  if (cd.service_type || cd.asset_type || cd.appliance_type || cd.appliance || cd.city || cd.service_city) {
    return [
      cd.service_type || cd.asset_type || cd.appliance_type || cd.appliance,
      cd.city || cd.service_city
    ].filter(Boolean).join(' · ');
  }
  // Priority 5: visitor identifier
  return conv.visitor_id ? `Visitor ${String(conv.visitor_id).slice(-6)}` : 'Website Visitor';
}

export function getConversationAppliance(conv, leads = []) {
  if (conv.lead_id) {
    const l = leads.find(l => l.id === conv.lead_id);
    if (l?.service_type || l?.asset_type || l?.appliance_type) return l.service_type || l.asset_type || l.appliance_type;
  }
  const cd = conv.collected_data || {};
  return cd.service_type || cd.asset_type || cd.appliance_type || cd.appliance || null;
}

export function getConversationCity(conv, leads = []) {
  if (conv.lead_id) {
    const l = leads.find(l => l.id === conv.lead_id);
    if (l?.city) return l.city;
  }
  const cd = conv.collected_data || {};
  return cd.city || cd.service_city || null;
}

export function buildInboxItems(leads = [], conversations = [], customers = []) {
  const items = [];

  leads.forEach(lead => {
    items.push({
      id: lead.id,
      type: 'lead',
      name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
      appliance: lead.service_type || lead.asset_type || lead.appliance_type,
      city: lead.city,
      source: lead.source,
      status: lead.status,
      close_reason: lead.close_reason,
      safety_flag: lead.safety_flag,
      phone: lead.phone,
      email: lead.email,
      last_activity: lead.updated_date || lead.created_date,
      requested_date: lead.requested_date,
      requested_window: lead.requested_window,
      conversation_id: lead.conversation_id,
      customer_id: lead.customer_id,
      job_id: lead.job_id,
      record: lead
    });
  });

  conversations.forEach(conv => {
    // Skip conversations that are linked to a lead — the lead is the primary item
    if (conv.lead_id && leads.find(l => l.id === conv.lead_id)) return;

    const cd = conv.collected_data || {};
    items.push({
      id: conv.id,
      type: 'conversation',
      name: getConversationLabel(conv, leads, customers),
      appliance: getConversationAppliance(conv, leads),
      city: getConversationCity(conv, leads),
      source: 'AI Chat',
      status: conv.status,
      disposition: conv.disposition,
      safety_flag: conv.safety_flag,
      phone: cd.phone || cd.phone_number || null,
      email: cd.email || null,
      last_activity: conv.updated_date || conv.started_at || conv.created_date,
      requested_date: cd.requested_date || null,
      requested_window: cd.requested_window || null,
      conversation_id: conv.id,
      customer_id: conv.customer_id,
      lead_id: conv.lead_id,
      job_id: conv.job_id,
      record: conv
    });
  });

  return items;
}

function localTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function filterInboxByTab(items, tab) {
  switch (tab) {
    case 'new':
      return items.filter(item =>
        (item.type === 'lead' && ['New', 'Working', 'Ready to Schedule'].includes(item.status)) ||
        (item.type === 'conversation' && item.status === 'active' && !item.lead_id && item.disposition !== 'Out of Area')
      );
    case 'conversations':
      return items.filter(item =>
        item.type === 'conversation' && item.status === 'active'
      );
    case 'waiting':
      return items.filter(item =>
        item.type === 'lead' && item.status === 'Waiting on Customer'
      );
    case 'follow_up': {
      const today = localTodayKey();
      return items.filter(item =>
        item.type === 'lead' &&
        item.status !== 'Converted' &&
        item.status !== 'Closed' &&
        !!item.record?.follow_up_date &&
        item.record.follow_up_date <= today
      );
    }
    case 'out_of_area':
      return items.filter(item =>
        item.disposition === 'Out of Area' || item.close_reason === 'Out of Area'
      );
    case 'closed':
      return items.filter(item =>
        (
          item.type === 'lead' &&
          item.status === 'Closed' &&
          item.close_reason !== 'Out of Area'
        ) ||
        (
          item.type === 'conversation' &&
          (item.status === 'completed' || item.status === 'abandoned') &&
          item.disposition !== 'Out of Area'
        )
      );
    default:
      return items;
  }
}

export function searchInboxItems(items, query) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item =>
    [item.name, item.phone, item.email, item.appliance, item.city, item.source, item.status]
      .filter(Boolean).join(' ').toLowerCase().includes(q)
  );
}