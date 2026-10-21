const fs = require('fs');
const file = 'src/pages/OrgListPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add OrgSelect import
if (!content.includes('import { OrgSelect }')) {
  content = content.replace('import MemberLinkSelect', 'import { OrgSelect } from "@/components/common/OrgSelect";\nimport MemberLinkSelect');
}

// 2. Add isBhojanshala
if (!content.includes('const isBhojanshala = entity === "bhojanshala";')) {
  content = content.replace('const isDharamshala = entity === "dharamshala";', 'const isDharamshala = entity === "dharamshala";\n  const isBhojanshala = entity === "bhojanshala";');
}

// 3. Update configTabs
const oldTabs = `  const configTabs = isDharamshala ? [
    { id: "basic", label: t("🏨 Basic Info") },
    { id: "temple", label: t("🛕 Inside Temple") },
    { id: "location", label: t("📍 Location & Contact") },
    { id: "accommodations", label: t("🏢 Accommodations") },
    { id: "facilities", label: t("✨ Facilities") },
    { id: "food", label: t("🥗 Bhojanalay") },
    { id: "contacts", label: t("👥 Contacts & Management") },
    { id: "trustees", label: t("📜 Trustees & Committee") },
    { id: "volunteers", label: t("🤝 Volunteers") },
    { id: "rules", label: t("📋 Rules & Safety") },
    { id: "bank", label: t("💰 Banking Details") },
    { id: "links", label: t("🔗 Social & UX Links") }
  ] : [`;

const newTabs = `  const configTabs = isDharamshala ? [
    { id: "basic", label: t("🏨 Basic Info") },
    { id: "temple", label: t("🛕 Inside Temple") },
    { id: "location", label: t("📍 Location & Contact") },
    { id: "accommodations", label: t("🏢 Accommodations") },
    { id: "facilities", label: t("✨ Facilities") },
    { id: "food", label: t("🥗 Bhojanalay") },
    { id: "contacts", label: t("👥 Contacts & Management") },
    { id: "trustees", label: t("📜 Trustees & Committee") },
    { id: "volunteers", label: t("🤝 Volunteers") },
    { id: "rules", label: t("📋 Rules & Safety") },
    { id: "bank", label: t("💰 Banking Details") },
    { id: "links", label: t("🔗 Social & UX Links") }
  ] : isBhojanshala ? [
    { id: "basic", label: t("🥗 Basic Info") },
    { id: "location", label: t("📍 Location & Maps") },
    { id: "food", label: t("🥗 Bhojanshala Details") },
    { id: "contacts", label: t("👥 Contacts") },
    { id: "bank", label: t("💰 Banking Details") },
  ] : [`;
content = content.replace(oldTabs, newTabs);

// 4. Update basic tab content for parentOrganizationId
const oldBasicTab = `<div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">{field(isDharamshala ? t("Dharamshala Name *") : t("Name *"), "name")}</div>`;
const newBasicTab = `<div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">{field(isDharamshala ? t("Dharamshala Name *") : isBhojanshala ? t("Bhojanshala Name *") : t("Name *"), "name")}</div>
                            {isBhojanshala && (
                              <div className="col-span-2">
                                <OrgSelect
                                  label={t("Parent Temple / Organization (Optional)")}
                                  value={form.parentOrganizationId}
                                  onChange={(val) => setForm({ ...form, parentOrganizationId: val })}
                                />
                              </div>
                            )}`;
content = content.replace(oldBasicTab, newBasicTab);

// 5. Hide "Bhojanshala (Food) Unit" for isBhojanshala
content = content.replace(
  /{!isDharamshala && \(\s*\/\* Bhojanshala \(Food\) Unit \*\//g,
  '{!isDharamshala && !isBhojanshala && (\\n                            /* Bhojanshala (Food) Unit */'
);

// 6. Update Dharamshala food tab to also apply to Bhojanshala
content = content.replace(
  `{isDharamshala && tab === "food" && (`,
  `{(isDharamshala || isBhojanshala) && tab === "food" && (`
);

// 7. Make the toggle inside food tab unconditional for Bhojanshala
content = content.replace(
  `{toggle("Bhojanalay Available Inside?", "hasBhojanshala")}\n                          {form.hasBhojanshala && (`,
  `{!isBhojanshala && toggle("Bhojanalay Available Inside?", "hasBhojanshala")}\n                          {(isBhojanshala || form.hasBhojanshala) && (`
);

fs.writeFileSync(file, content);
console.log('Patched');
