/**
 * Lead storage. Writes to a local leads.jsonl file so the assistant is
 * useful with zero extra infra. In production, replace saveLead() with
 * a call to your CRM (HubSpot, Attio, a DB, etc) — the lead object shape
 * below is the only contract the rest of the app depends on.
 */

const fs = require('fs');
const path = require('path');

const LEADS_FILE = path.join(__dirname, '..', 'logs', 'leads.jsonl');

function saveLead(lead) {
  const record = {
    ts: new Date().toISOString(),
    name: lead.name || null,
    email: lead.email || null,
    phone: lead.phone || null,
    company: lead.company || null,
    projectSummary: lead.projectSummary || null,
    interestedServices: lead.interestedServices || [],
    estimatedBudgetBirr: lead.estimatedBudgetBirr || null,
    conversationId: lead.conversationId || null,
    source: 'ai-consultant-widget'
  };
  const dir = path.dirname(LEADS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(LEADS_FILE, JSON.stringify(record) + '\n');
  return record;
}

module.exports = { saveLead };
