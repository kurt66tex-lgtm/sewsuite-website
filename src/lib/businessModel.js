export const PROJECT_WORKFLOW_STAGES = [
  'Quote Needed',
  'Quote Sent',
  'Awaiting Customer Approval',
  'Quote Approved',
  'Artwork / Logo Needed',
  'Proof Preparation',
  'Proof Sent',
  'Awaiting Proof Approval',
  'Proof Approved',
  'Production Scheduled',
  'In Production',
  'Quality Check',
  'Ready for Pickup / Shipping',
  'Completed',
  'Review Request'
];

export function isProjectQuoteModel(settings) {
  return settings?.business_model === 'project_quote';
}

export function crmVocabulary(settings) {
  const project = isProjectQuoteModel(settings);
  return project
    ? {
        workSingular: 'Project',
        workPlural: 'Projects',
        workNumber: 'Project #',
        createWork: 'Create Project',
        openWork: 'Open Project',
        requestSingular: 'Quote Request',
        requestPlural: 'Quote Requests',
        conversionAction: 'Create Project',
        serviceType: 'Project Type'
      }
    : {
        workSingular: 'Job',
        workPlural: 'Jobs',
        workNumber: 'Job #',
        createWork: 'New Service Call',
        openWork: 'Open Job',
        requestSingular: 'Service Request',
        requestPlural: 'Service Requests',
        conversionAction: 'Book Service',
        serviceType: 'Service'
      };
}

export function leadStatusesFor(settings) {
  return isProjectQuoteModel(settings)
    ? ['New', 'Working', 'Waiting on Customer', 'Converted', 'Closed']
    : ['New', 'Working', 'Waiting on Customer', 'Ready to Schedule', 'Converted', 'Closed'];
}

export function projectStageCoreStatus(stage) {
  if (stage === 'Completed' || stage === 'Review Request') return 'Completed';
  if (stage === 'Production Scheduled') return 'Scheduled';
  if (['In Production', 'Quality Check', 'Ready for Pickup / Shipping'].includes(stage)) return 'In Progress';
  return 'Open';
}
