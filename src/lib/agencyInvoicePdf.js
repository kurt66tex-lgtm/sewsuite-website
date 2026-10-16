import { jsPDF } from 'jspdf';

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

function rateMoney(value) {
  const n = Number(value || 0);
  return '$' + n.toFixed(n > 0 && n < 1 ? 4 : 2);
}

function quantityText(value) {
  const n = Number(value ?? 1);
  return Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function safeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function agencyAddress(control) {
  const cityLine = [control.agency_city, control.agency_state, control.agency_zip].filter(Boolean).join(' ');
  return [
    control.agency_address_line_1,
    control.agency_address_line_2,
    cityLine
  ].filter(Boolean);
}

function clientAddress(control) {
  return [control.client_name, control.primary_domain].filter(Boolean);
}

function addFooter(doc, pageNumber, pageCount, control) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.line(40, height - 36, width - 40, height - 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  const footer = safeText(control.invoice_footer, 'Thank you for your business.');
  doc.text(footer, 40, height - 22);
  doc.text(`Page ${pageNumber} of ${pageCount}`, width - 40, height - 22, { align: 'right' });
}

export function buildAgencyInvoicePdf(control = {}, invoice = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  const yellow = [247, 224, 24];
  const black = [17, 17, 17];
  const gray = [92, 104, 116];
  const light = [246, 247, 249];

  const paymentUrl = safeText(invoice.payment_url || control.billing_portal_url);
  const issuer = safeText(control.agency_name, 'Agency Services');
  const invoiceNumber = safeText(invoice.invoice_number, 'Invoice');
  const issueDate = safeText(invoice.issue_date, '-');
  const dueDate = safeText(invoice.due_date, '-');

  // Header
  doc.setFillColor(...black);
  doc.rect(0, 0, pageWidth, 104, 'F');
  doc.setFillColor(...yellow);
  doc.roundedRect(margin, 30, 32, 32, 7, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...black);
  doc.text('A', margin + 16, 51, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(issuer, margin + 44, 47);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const issuerSub = [control.agency_email, control.agency_phone, control.agency_website].filter(Boolean).join('  |  ');
  if (issuerSub) doc.text(issuerSub, margin + 44, 64);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('INVOICE', pageWidth - margin, 49, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceNumber, pageWidth - margin, 68, { align: 'right' });

  let y = 132;

  // From / Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('FROM', margin, y);
  doc.text('BILL TO', pageWidth / 2 + 16, y);
  y += 16;

  doc.setTextColor(...black);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(issuer, margin, y);
  doc.text(safeText(control.client_name, 'Client'), pageWidth / 2 + 16, y);

  const leftLines = agencyAddress(control);
  const rightLines = clientAddress(control).slice(1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);

  let leftY = y + 14;
  for (const line of leftLines) {
    doc.text(String(line), margin, leftY);
    leftY += 12;
  }
  let rightY = y + 14;
  for (const line of rightLines) {
    doc.text(String(line), pageWidth / 2 + 16, rightY);
    rightY += 12;
  }

  y = Math.max(leftY, rightY, y + 28) + 16;

  // Invoice meta
  doc.setFillColor(...light);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 54, 6, 6, 'F');
  const meta = [
    ['Invoice #', invoiceNumber],
    ['Issue Date', issueDate],
    ['Due Date', dueDate],
    ['Status', safeText(invoice.status, 'Draft')]
  ];
  const colW = (pageWidth - margin * 2) / meta.length;
  meta.forEach(([label, value], i) => {
    const x = margin + i * colW + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text(label.toUpperCase(), x, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...black);
    doc.text(value, x, y + 35);
  });
  y += 78;

  // Line items
  const descX = margin;
  const qtyX = 362;
  const unitX = 430;
  const amountX = pageWidth - margin;
  const tableRight = pageWidth - margin;

  const drawTableHeader = () => {
    doc.setFillColor(...black);
    doc.rect(margin, y, pageWidth - margin * 2, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('DESCRIPTION', descX + 8, y + 16);
    doc.text('QTY', qtyX, y + 16, { align: 'right' });
    doc.text('UNIT', unitX, y + 16, { align: 'right' });
    doc.text('AMOUNT', amountX - 8, y + 16, { align: 'right' });
    y += 25;
  };

  const newPageIfNeeded = (needed = 44) => {
    if (y + needed <= 714) return;
    doc.addPage();
    y = 48;
    drawTableHeader();
  };

  drawTableHeader();

  const items = Array.isArray(invoice.line_items) ? invoice.line_items : [];
  if (items.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('No line items', descX + 8, y + 20);
    y += 34;
  } else {
    items.forEach((item, idx) => {
      const description = safeText(item.description, 'Service');
      const wrapped = doc.splitTextToSize(description, 280);
      const rowHeight = Math.max(34, wrapped.length * 11 + 14);
      newPageIfNeeded(rowHeight + 4);

      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, pageWidth - margin * 2, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...black);
      doc.text(wrapped, descX + 8, y + 16);
      doc.text(quantityText(item.quantity), qtyX, y + 16, { align: 'right' });
      doc.text(rateMoney(item.unit_price), unitX, y + 16, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(money(item.amount), amountX - 8, y + 16, { align: 'right' });

      doc.setDrawColor(232, 232, 232);
      doc.line(margin, y + rowHeight, tableRight, y + rowHeight);
      y += rowHeight;
    });
  }

  newPageIfNeeded(120);
  y += 16;

  // Totals
  const totalLabelX = 430;
  const totalValueX = pageWidth - margin;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Subtotal', totalLabelX, y);
  doc.setTextColor(...black);
  doc.text(money(invoice.subtotal), totalValueX, y, { align: 'right' });
  y += 18;

  if (Number(invoice.tax_amount || 0) !== 0) {
    doc.setTextColor(...gray);
    doc.text('Tax', totalLabelX, y);
    doc.setTextColor(...black);
    doc.text(money(invoice.tax_amount), totalValueX, y, { align: 'right' });
    y += 18;
  }

  doc.setDrawColor(...black);
  doc.line(totalLabelX, y - 4, totalValueX, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...black);
  doc.text('TOTAL', totalLabelX, y + 14);
  doc.text(money(invoice.total), totalValueX, y + 14, { align: 'right' });
  y += 48;

  // Payment call-to-action
  newPageIfNeeded(90);
  if (paymentUrl) {
    const buttonWidth = 170;
    const buttonHeight = 34;
    doc.setFillColor(...yellow);
    doc.roundedRect(margin, y, buttonWidth, buttonHeight, 7, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...black);
    doc.text('PAY INVOICE ONLINE', margin + buttonWidth / 2, y + 22, { align: 'center' });
    doc.link(margin, y, buttonWidth, buttonHeight, { url: paymentUrl });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    const displayUrl = paymentUrl.length > 64 ? paymentUrl.slice(0, 61) + '...' : paymentUrl;
    doc.textWithLink(displayUrl, margin, y + 49, { url: paymentUrl });
    y += 66;
  } else {
    doc.setFillColor(255, 249, 214);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 42, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 98, 0);
    doc.text('Online payment link will appear here when a billing provider or portal is connected.', margin + 12, y + 25);
    y += 58;
  }

  if (invoice.notes) {
    newPageIfNeeded(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text('NOTES', margin, y);
    y += 13;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...black);
    const notes = doc.splitTextToSize(String(invoice.notes), pageWidth - margin * 2);
    doc.text(notes, margin, y);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount, control);
  }

  return doc;
}

export function viewAgencyInvoicePdf(control, invoice) {
  const doc = buildAgencyInvoicePdf(control, invoice);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 120000);
}

export function downloadAgencyInvoicePdf(control, invoice) {
  const doc = buildAgencyInvoicePdf(control, invoice);
  const name = safeText(invoice.invoice_number, 'invoice').replace(/[^A-Za-z0-9._-]+/g, '-') + '.pdf';
  doc.save(name);
}
