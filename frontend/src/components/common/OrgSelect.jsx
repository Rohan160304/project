import { useState, useEffect } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { useOrgs } from "@/hooks/useOrgs";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

/**
 * Organization picker shown to Super Admins on org-scoped pages.
 * Calls onChange(orgId | orgId[]) when a selection is made.
 * 
 * Props:
 *   filterType  — "BHOJANSHALA" | "DHARAMSHALA" | "PATHSHALA" | undefined (all)
 *   multiple    — if true, allows multi-select (returns array)
 *   excludeIds  — array of org IDs already linked elsewhere (excluded from options)
 *   required    — if true shows a required note
 */
export function OrgSelect({
  value,
  onChange,
  label = "Organization",
  className = "",
  testId = "org-select",
  options,
  filterType,
  multiple = false,
  excludeIds = [],
  required = false,
  showTypeFilter = false,
}) {
  const { t } = useLanguage();
  const { orgs: allOrgs, loading: allLoading } = useOrgs();

  const [selectedTypeUI, setSelectedTypeUI] = useState("ALL");
  const [filteredOrgs, setFilteredOrgs] = useState(null);
  const [filteredLoading, setFilteredLoading] = useState(false);

  useEffect(() => {
    if (!filterType) {
      setFilteredOrgs(null);
      return;
    }
    const endpointMap = {
      BHOJANSHALA: "/bhojanshalas",
      DHARAMSHALA: "/dharamshalas",
      PATHSHALA: "/pathshalas",
    };
    const endpoint = endpointMap[filterType];
    if (!endpoint) { setFilteredOrgs(null); return; }

    setFilteredLoading(true);
    api.get(endpoint)
      .then((res) => {
        const list = res.data?.data?.items || res.data?.data || [];
        setFilteredOrgs(list);
      })
      .catch(() => setFilteredOrgs([]))
      .finally(() => setFilteredLoading(false));
  }, [filterType]);

  const sourceOrgs = options ?? (filterType ? (filteredOrgs || []) : allOrgs);
  const loading = filterType ? filteredLoading : allLoading;

  const typeFilteredOrgs = (showTypeFilter && selectedTypeUI !== "ALL")
    ? sourceOrgs.filter(o => o.type === selectedTypeUI || o.id === "ALL")
    : (filterType ? sourceOrgs.filter(o => o.type === filterType || o.id === "ALL") : sourceOrgs);

  // Exclude already-linked orgs (one-to-one exclusivity)
  const availableOrgs = excludeIds.length > 0
    ? typeFilteredOrgs.filter((o) => {
        // If this org is already selected (in value array), keep it visible
        if (multiple && Array.isArray(value) && value.includes(o.id)) return true;
        if (!multiple && value === o.id) return true;
        return !excludeIds.includes(o.id);
      })
    : typeFilteredOrgs;

  const selectOptions = availableOrgs.map((o) => ({
    value: o.id,
    label: o.id === "ALL" ? o.name : `${o.name}${o.city ? ` · ${o.city}` : ""} (${o.publicId || o.id.slice(-6)})`,
  }));

  const orgSelectContent = (
    <div className={className}>
      {label && !showTypeFilter && (
        <Label className="text-xs">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      <SearchableSelect
        value={multiple ? (Array.isArray(value) ? value : []) : (value || "")}
        onValueChange={onChange}
        options={selectOptions}
        placeholder={loading ? t("Loading…") : t("Select organization")}
        searchPlaceholder={t("Search organization…")}
        className={showTypeFilter ? "w-full min-w-[220px]" : "mt-1 max-w-md"}
        data-testid={testId}
        multiple={multiple}
      />
      {required && multiple && (!Array.isArray(value) || value.length === 0) && (
        <p className="text-[10px] text-amber-600 mt-1 font-medium">
          {t("Please select at least one organization.")}
        </p>
      )}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <p className="text-[10px] text-slate-500 mt-1">
          {value.length} {t("selected")}
        </p>
      )}
    </div>
  );

  if (showTypeFilter) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <Label className="text-xs">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
        )}
        <div className="flex items-center space-x-2">
          <select 
            value={selectedTypeUI} 
            onChange={(e) => { setSelectedTypeUI(e.target.value); onChange(multiple ? [] : "ALL"); }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-[160px]"
          >
            <option value="ALL">{t("All Types")}</option>
            <option value="TEMPLE">{t("Temples")}</option>
            <option value="DHARAMSHALA">{t("Dharamshalas")}</option>
            <option value="BHOJANSHALA">{t("Bhojanshalas")}</option>
            <option value="JAIN_CENTER">{t("Jain Centers")}</option>
            <option value="STHANAK">{t("Sthanaks")}</option>
          </select>
          {orgSelectContent}
        </div>
      </div>
    );
  }

  return orgSelectContent;
}
