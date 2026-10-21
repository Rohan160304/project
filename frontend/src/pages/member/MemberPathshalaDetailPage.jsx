import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { memberClient } from "@/lib/memberClient";
import { extractErrorMessage } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import OrgDetailPage from "@/pages/OrgDetailPage";

const ORG_ENDPOINTS = {
  temple: { prefix: "/temples", label: "Temple" },
  jaincentre: { prefix: "/jain-centers", label: "Jain Center" },
  dharamshala: { prefix: "/dharamshalas", label: "Dharamshala" },
  bhojanshala: { prefix: "/temples", label: "Bhojanshala" },
  pathshala: { prefix: "/temples", label: "Pathshala" },
};

export default function MemberPathshalaDetailPage() {
  const { id } = useParams();
  const [orgType, setOrgType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    for (const key of ["pathshala", "bhojanshala", "temple", "dharamshala", "jaincentre"]) {
      try {
        const res = await memberClient.get(`${ORG_ENDPOINTS[key].prefix}/${id}`);
        if (res?.data?.data) {
          const type = res.data.data.type;
          if (type === 'BHOJANSHALA') {
            setOrgType('bhojanshala');
          } else if (type === 'DHARAMSHALA') {
            setOrgType('dharamshala');
          } else if (type === 'PATHSHALA') {
            setOrgType('pathshala');
          } else {
            setOrgType(key);
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        /* try next */
      }
    }
    setError(extractErrorMessage({ message: "Not found" }));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  if (error || !orgType) return <EmptyState title="Not found" description={error || "This profile may have been removed, or the link is out of date."} />;

  const conf = ORG_ENDPOINTS[orgType];
  return (
    <OrgDetailPage 
      isMemberView={true} 
      apiPrefix={conf.prefix} 
      entityLabel={conf.label} 
      basePath="/member/explore"
    />
  );
}
