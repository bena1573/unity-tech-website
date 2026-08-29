/**
 * Lightweight RAG (Retrieval-Augmented Generation) engine.
 *
 * WHY NOT A VECTOR DATABASE?
 * A production RAG system typically embeds documents into vectors and
 * stores them in a vector DB (Pinecone, pgvector, Weaviate...). That
 * requires an extra paid API call per query plus infrastructure to run.
 *
 * For a knowledge base this size (a few dozen services/projects/FAQs),
 * a well-tuned keyword/BM25 search is fast, free, deterministic, and
 * "good enough" to ground the LLM's answers in real Unity Tech content.
 *
 * UPGRADE PATH: if the knowledge base grows into the hundreds/thousands
 * of documents, swap `retrieve()` below for an embeddings + vector store
 * lookup — the rest of the pipeline (chunk -> retrieve -> inject into
 * system prompt) does not need to change.
 */

const fs = require('fs');
const path = require('path');

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'knowledge', file), 'utf-8'));
}

const company = loadJSON('company.json');
const services = loadJSON('services.json');
const pricing = loadJSON('pricing.json');
const portfolio = loadJSON('portfolio.json');
const faq = loadJSON('faq.json');
const technologies = loadJSON('technologies.json');

const documents = [];

documents.push({
  id: 'company-overview',
  type: 'company',
  title: 'Company overview',
  text: `Unity Tech ${company.tagline}. ${company.description} Mission: ${company.mission} Vision: ${company.vision} Founded ${company.founded}. ${company.stats.projects_completed} projects completed, ${company.stats.clients} clients, ${company.stats.years_experience} years experience, ${company.stats.client_satisfaction} satisfaction.`,
  data: company
});

documents.push({
  id: 'company-contact',
  type: 'contact',
  title: 'Contact details',
  text: `Contact Unity Tech at ${company.contact.email} or ${company.contact.phone}. WhatsApp available. ${company.contact.location}. Hours: Mon-Fri ${company.contact.hours.mon_fri}, Saturday ${company.contact.hours.saturday}, Sunday ${company.contact.hours.sunday}. ${company.response_time}`,
  data: company.contact
});

services.forEach(s => {
  documents.push({
    id: `service-${s.id}`,
    type: 'service',
    title: s.name,
    text: `${s.name} service. ${s.description} Benefits: ${s.benefits.join('. ')}. Features: ${s.features.join(', ')}. Technology stack: ${s.stack.join(', ')}. Starting at Birr ${s.starting_price_birr} ${s.billing}.`,
    data: s
  });
});

portfolio.forEach(p => {
  documents.push({
    id: `project-${p.name}`,
    type: 'project',
    title: p.name,
    text: `Case study: ${p.name}, category ${p.category}. ${p.description} Problem: ${p.problem} Solution: ${p.solution} Results: ${p.results.join(', ')}. Built with ${p.stack.join(', ')}.`,
    data: p
  });
});

faq.forEach((f, i) => {
  documents.push({ id: `faq-${i}`, type: 'faq', title: f.question, text: `${f.question} ${f.answer}`, data: f });
});

documents.push({
  id: 'pricing-web',
  type: 'pricing',
  title: 'Web development pricing plans',
  text: `Web development pricing: ${pricing.web_development_plans.map(p => `${p.name} Birr ${p.price_birr}/month (${p.features.join(', ')})`).join('. ')}. There is no separate Video Editing & Graphics Design plan table anymore — those services are only available through the custom price builder below.`,
  data: pricing.web_development_plans
});

function fmtItemPrice(i) {
  if (i.price_birr_range) return `Birr ${i.price_birr_range[0]}-${i.price_birr_range[1]}${i.per_item ? ' each' : ''}`;
  return `Birr ${i.price_birr}${i.per_item ? ' each' : ''}`;
}

documents.push({
  id: 'pricing-builder',
  type: 'pricing',
  title: 'Custom price builder catalog (website, graphic design, video editing)',
  text: `Custom price builder line items: Website development options: ${pricing.custom_builder_catalog.website_development.map(i => `${i.name} (${fmtItemPrice(i)})`).join(', ')}. Graphic design: ${pricing.custom_builder_catalog.graphic_design.map(i => `${i.name} (${fmtItemPrice(i)})`).join(', ')}. Video editing: ${pricing.custom_builder_catalog.video_editing.map(i => `${i.name} (${fmtItemPrice(i)})`).join(', ')}. Delivery speed multipliers: normal 1x, fast 1.25x, express 1.6x. Delivery timelines: normal 2-3 weeks, fast 1 week, express 48-72 hours.`,
  data: pricing.custom_builder_catalog
});

documents.push({
  id: 'technologies',
  type: 'technologies',
  title: 'Technologies we use',
  text: `Technologies Unity Tech works with: ${technologies.technologies.map(t => `${t.name} (${t.category}) - ${t.use_case}`).join('. ')}`,
  data: technologies.technologies
});

function tokenize(str) {
  return (str.toLowerCase().match(/[a-z0-9+#.]+/g) || []).filter(t => t.length > 1);
}

const STOPWORDS = new Set(['the','a','an','is','are','was','were','and','or','of','to','in','on','for','with','how','what','do','you','does','can','i','we','your','our']);

function scoreDocument(queryTokens, doc) {
  const docTokens = tokenize(doc.text + ' ' + doc.title);
  let score = 0;
  queryTokens.forEach(qt => {
    if (STOPWORDS.has(qt)) return;
    const occurrences = docTokens.filter(dt => dt === qt || dt.includes(qt) || qt.includes(dt)).length;
    if (occurrences > 0) score += occurrences * (qt.length > 4 ? 2 : 1);
    if (doc.title.toLowerCase().includes(qt)) score += 3;
  });
  return score;
}

function retrieve(query, k = 5) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const scored = documents
    .map(doc => ({ doc, score: scoreDocument(queryTokens, doc) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(x => x.doc);
}

function buildContext(query, k = 5) {
  const docs = retrieve(query, k);
  if (docs.length === 0) return { context: '', docs: [] };
  const context = docs.map((d, i) => `[Source ${i + 1}: ${d.title}]\n${d.text}`).join('\n\n');
  return { context, docs };
}

module.exports = { retrieve, buildContext, documents, company, services, pricing, portfolio, faq, technologies };
