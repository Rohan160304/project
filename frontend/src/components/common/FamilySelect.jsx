import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Search, X, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FamilySelect({
  value,
  onChange,
  multi = false,
  placeholder = "Search family by head member name or ID…",
  disabled = false,
  className = "",
}) {
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const searchTimeout = useRef(null);

  const parseValue = (val) => {
    if (!val) return [];
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return val.split(",").map(s => s.trim()).filter(Boolean);
      }
    }
    if (Array.isArray(val)) return val;
    return [];
  };

  const selectedFamilies = parseValue(value);

  const search = async (q) => {
    setLoading(true);
    try {
      const term = (q || "").trim();
      const base = { page: 1, pageSize: 20 };
      if (term) base.q = term;

      const res = await api.get("/family", { params: base });
      const groups = res?.data?.data?.groups || [];
      
      const mapped = groups.map(g => {
        const pm = g.primaryMember;
        const name = pm.fullName || [pm.firstName, pm.surname].filter(Boolean).join(" ") || pm.publicId;
        return {
          id: pm.publicId,
          label: `Family of ${name}`,
          original: pm
        };
      });

      setResults(mapped);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (val.length >= 2) search(val);
      else if (val.length === 0) setResults([]);
    }, 400);
  };

  const handleFocus = () => {
    setOpen(true);
    if (query.length >= 2 && results.length === 0) {
      search(query);
    } else if (results.length === 0) {
      search("");
    }
  };

  const selectFamily = (fam) => {
    if (multi) {
      if (!selectedFamilies.includes(fam.label)) {
        onChange([...selectedFamilies, fam.label]);
      }
    } else {
      onChange([fam.label]);
    }
    setQuery("");
    setOpen(false);
  };

  const removeFamily = (labelToRemove) => {
    if (multi) {
      onChange(selectedFamilies.filter((lbl) => lbl !== labelToRemove));
    } else {
      onChange([]);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {multi && selectedFamilies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {selectedFamilies.map((lbl, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700"
            >
              <span>{lbl}</span>
              <button
                type="button"
                onClick={() => removeFamily(lbl)}
                className="ml-0.5 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {!multi && selectedFamilies.length > 0 ? (
        <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm">
          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="flex-1 text-left truncate">
            {selectedFamilies[0]}
          </span>
          {!disabled && (
            <button type="button" onClick={() => removeFamily(selectedFamilies[0])}>
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm cursor-text",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
            disabled && "opacity-50 pointer-events-none"
          )}
          onClick={() => !disabled && setOpen(true)}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
          />
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {!multi && selectedFamilies.length > 0 && (
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted text-sm">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder={t("Search to change…")}
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("Searching…")}
            </div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="py-6 text-center text-muted-foreground text-sm">
              {t("No families found.")}
            </div>
          )}
          {!loading && results.map((fam) => {
            const isSelected = selectedFamilies.includes(fam.label);
            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => selectFamily(fam)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left",
                  isSelected && "bg-indigo-50 border-l-2 border-indigo-500"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {fam.original?.photoUrl ? (
                    <img src={fam.original.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-4 w-4 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate text-slate-800">
                    {fam.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {fam.id}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-indigo-600 text-xs font-bold shrink-0">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
