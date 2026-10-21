import { useState } from "react";
import { Shield, Lock, Search, ChevronDown, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PLATFORM_MODULES, normalizeGrants, delegatedActionsFor } from "@/lib/access";
import { NESTED_NAV } from "@/constants/nav.config";

/**
 * Derive sub-modules for each parent module from the ACTUAL sidebar config
 * (NESTED_NAV). This keeps the permission picker in lock-step with what the
 * sidebar shows: every folder in the sidebar that has a `module` key
 * contributes its `children[].label` as sub-tabs under that module. Multiple
 * folders mapped to the same module (e.g. Staff has folder-staff,
 * folder-committee, folder-opstaff, folder-opdocs, folder-optasks) merge
 * their children into one deduped list.
 *
 * "coming-soon" placeholder rows are kept — they're real product surfaces even
 * if the page itself is still stubbed, and admins need to be able to grant
 * them ahead of time.
 */
function collectSubModulesFromNav(nav) {
  const out = {}; // moduleKey → [{ key, label }]
  const seenKeys = new Set();
  const walk = (nodes) => {
    for (const node of nodes || []) {
      if (node.module && Array.isArray(node.children)) {
        out[node.module] = out[node.module] || [];
        for (const child of node.children) {
          const subKey = child.id || child.label || "";
          const dedupKey = `${node.module}::${subKey}`;
          if (!subKey || seenKeys.has(dedupKey)) continue;
          seenKeys.add(dedupKey);
          out[node.module].push({
            key: String(subKey).toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
            label: child.label || subKey,
          });
        }
      }
      if (Array.isArray(node.children)) walk(node.children);
    }
  };
  walk(nav);
  return out;
}

const SUB_MODULES_BY_MODULE = collectSubModulesFromNav(NESTED_NAV);

/**
 * Merge sidebar-derived sub-modules with the base PLATFORM_MODULES so every
 * parent tab in the picker exposes the same sub-tabs the sidebar exposes.
 * Any subModules declared directly on PLATFORM_MODULES (e.g. the seed set
 * for MEMBERS) are kept and augmented rather than overwritten.
 */
export const PLATFORM_MODULE_LIST = PLATFORM_MODULES.map((m) => {
  const derived = SUB_MODULES_BY_MODULE[m.key] || [];
  const seed = m.subModules || [];
  const seen = new Set(seed.map((s) => s.key));
  const merged = [...seed];
  for (const s of derived) {
    if (!seen.has(s.key)) { merged.push(s); seen.add(s.key); }
  }
  return merged.length > 0 ? { ...m, subModules: merged } : m;
});

/**
 * Access-level presets a delegator can pick per module / sub-module.
 * The picker only shows these two — DELETE is Super-Admin-only (rule 2).
 */
const ACCESS_LEVELS = [
  { key: "READ",       label: "Read only",   actions: ["VIEW"] },
  { key: "READ_WRITE", label: "Read + Write", actions: ["VIEW", "CREATE", "EDIT"] },
];

function actionsToLevelKey(actions) {
  const set = new Set((actions || []).map((a) => String(a).toUpperCase()));
  const hasWrite = set.has("CREATE") || set.has("EDIT");
  return hasWrite ? "READ_WRITE" : "READ";
}

/**
 * TabPermissionSelector — hierarchical + granular tab access picker.
 *
 * Data shape (new):
 *   grants: Record<moduleKey, string[]>   e.g. { MEMBERS: ["VIEW","EDIT"], "MEMBERS.JAIN": ["VIEW"], EVENTS: ["VIEW"] }
 *
 * Backward compatibility: accepts the legacy `selectedModules: string[]` prop
 * and emits the new shape from `onChange`. New callers should pass `grants`
 * and read `onChange(newGrants)` — see AdminsPage.
 *
 * Sub-modules (e.g. Members → Jain / Non-Jain / Family) render as indented
 * rows under their parent, each with its own Read / Read+Write picker. A
 * parent module with sub-modules can be toggled off entirely; when off, its
 * sub-module rows collapse.
 */
export function TabPermissionSelector({
  selectedModules,        // legacy: array of module keys
  grants,                 // new: grant map
  onChange,               // fires with new grant map
  isSuperAdmin = false,
  allowedModules = [],
  title = "Granted Tab & Module Permissions",
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({}); // moduleKey → boolean (sub-module drawer)

  // Merge whichever prop the caller passed. Legacy array wins if grants is empty.
  const currentGrants = normalizeGrants(
    grants && Object.keys(grants).length > 0 ? grants : selectedModules
  );

  const emitChange = (nextGrants) => {
    // Drop empty entries so a fully-cleared module doesn't linger with `[]`.
    const cleaned = {};
    for (const [k, v] of Object.entries(nextGrants)) {
      if (Array.isArray(v) && v.length > 0) cleaned[k] = v;
    }
    onChange?.(cleaned);
  };

  const setModule = (key, actions) => {
    emitChange({ ...currentGrants, [key]: actions });
  };

  const unsetModule = (key) => {
    const next = { ...currentGrants };
    delete next[key];
    // If unsetting a parent, drop all its sub-module grants too.
    for (const k of Object.keys(next)) {
      if (k.startsWith(`${key}.`)) delete next[k];
    }
    emitChange(next);
  };

  const toggleExpanded = (key) => setExpanded((s) => ({ ...s, [key]: !s[key] }));

  // Filter modules by search across label, key, category, and sub-module label
  const q = search.trim().toLowerCase();
  const matchesSearch = (m) => {
    if (!q) return true;
    if (m.label.toLowerCase().includes(q)) return true;
    if (m.key.toLowerCase().includes(q)) return true;
    if ((m.category || "").toLowerCase().includes(q)) return true;
    return (m.subModules || []).some(
      (s) => s.label.toLowerCase().includes(q) || s.key.toLowerCase().includes(q)
    );
  };

  const visibleModules = PLATFORM_MODULE_LIST.filter(matchesSearch);
  const categories = Array.from(new Set(visibleModules.map((m) => m.category)));

  const selectAll = () => {
    // Only ticks top-level modules at Read+Write. Sub-modules stay opt-in —
    // the admin picks each sub-tab explicitly, or uses each parent's expander
    // to enable individual ones. Auto-ticking every sub-tab was surprising
    // (only the seeded 3 got ticked, the rest didn't) and defeats the point
    // of granular control.
    const next = {};
    for (const m of PLATFORM_MODULE_LIST) {
      if (!isSuperAdmin && !allowedModules.includes(m.key)) continue;
      next[m.key] = delegatedActionsFor(m.key, null);
    }
    emitChange(next);
  };

  const clearAll = () => emitChange({});

  return (
    <div className="space-y-3 border rounded-xl p-4 bg-slate-50/50">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-600" />
          <h4 className="text-xs font-bold text-slate-800">{title}</h4>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className="text-[10px] text-orange-600 hover:text-orange-800 font-bold underline">
            {t("Select All Available")}
          </button>
          <button type="button" onClick={clearAll} className="text-[10px] text-slate-500 hover:text-slate-700 font-medium underline">
            {t("Clear All")}
          </button>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 font-medium leading-relaxed">
          🔒 <strong>{t("Delegation Hierarchy Guard Active")}</strong>{t(": You can only assign tab access that has been granted to your own account by Super Admin.")}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search tabs by name (e.g. members, feed, jain)…")}
          className="w-full pl-9 pr-14 h-9 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-slate-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 font-semibold"
          >
            {t("Clear")}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {categories.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-6 italic">
            {t("No tabs match")} “{search}”
          </div>
        )}
        {categories.map((cat) => {
          const items = visibleModules.filter((m) => m.category === cat);
          return (
            <div key={cat} className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{cat}</span>
              <div className="space-y-1.5">
                {items.map((item) => {
                  const isChecked = !!currentGrants[item.key];
                  const isAllowed = isSuperAdmin || allowedModules.includes(item.key);
                  const hasSubs = (item.subModules || []).length > 0;
                  const isOpen = !!expanded[item.key];
                  const currentLevel = actionsToLevelKey(currentGrants[item.key]);

                  return (
                    <div
                      key={item.key}
                      className={`rounded-lg border ${
                        !isAllowed
                          ? "bg-slate-100 opacity-60 border-slate-200"
                          : isChecked
                          ? "bg-orange-50/60 border-orange-200"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 p-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!isAllowed}
                          onChange={(e) => {
                            if (!isAllowed) return;
                            if (e.target.checked) {
                              setModule(item.key, ["VIEW", "CREATE", "EDIT"]);
                              if (hasSubs) setExpanded((s) => ({ ...s, [item.key]: true }));
                            } else {
                              unsetModule(item.key);
                            }
                          }}
                          className="h-3.5 w-3.5 accent-orange-500"
                        />
                        <span className={`text-xs flex-1 truncate ${isChecked ? "font-bold text-orange-950" : "text-slate-700"}`}>
                          {t(item.label)}
                        </span>
                        {!isAllowed && <Lock className="h-3 w-3 text-slate-400 shrink-0" title={t("Not granted by Super Admin")} />}
                        {isAllowed && isChecked && (
                          <select
                            value={currentLevel}
                            onChange={(e) => {
                              const lvl = ACCESS_LEVELS.find((l) => l.key === e.target.value);
                              if (lvl) setModule(item.key, lvl.actions);
                            }}
                            className="h-7 text-[10px] font-semibold rounded border border-orange-200 bg-white px-1.5 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          >
                            {ACCESS_LEVELS.map((l) => (
                              <option key={l.key} value={l.key}>{t(l.label)}</option>
                            ))}
                          </select>
                        )}
                        {hasSubs && isChecked && (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.key)}
                            className="text-slate-400 hover:text-slate-700"
                            title={isOpen ? t("Collapse sub-tabs") : t("Expand sub-tabs")}
                          >
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Sub-modules — only when parent is on AND drawer is open. */}
                      {hasSubs && isChecked && isOpen && (
                        <div className="border-t border-orange-100 bg-white/60 p-2 space-y-1">
                          {item.subModules.map((sub) => {
                            const subKey = `${item.key}.${sub.key}`;
                            const subChecked = !!currentGrants[subKey];
                            const subLevel = actionsToLevelKey(currentGrants[subKey]);
                            return (
                              <div key={subKey} className="flex items-center gap-2 pl-4">
                                <input
                                  type="checkbox"
                                  checked={subChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) setModule(subKey, ["VIEW", "CREATE", "EDIT"]);
                                    else unsetModule(subKey);
                                  }}
                                  className="h-3 w-3 accent-orange-500"
                                />
                                <span className={`text-[11px] flex-1 truncate ${subChecked ? "font-semibold text-orange-950" : "text-slate-600"}`}>
                                  {t(sub.label)}
                                </span>
                                {subChecked && (
                                  <select
                                    value={subLevel}
                                    onChange={(e) => {
                                      const lvl = ACCESS_LEVELS.find((l) => l.key === e.target.value);
                                      if (lvl) setModule(subKey, lvl.actions);
                                    }}
                                    className="h-6 text-[9px] font-semibold rounded border border-orange-200 bg-white px-1.5 focus:outline-none"
                                  >
                                    {ACCESS_LEVELS.map((l) => (
                                      <option key={l.key} value={l.key}>{t(l.label)}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
