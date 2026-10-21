import React, { useState, useEffect } from "react";
import { Ticket, CalendarDays, Users, QrCode } from "lucide-react";
import { api, extractErrorMessage } from "../../lib/api";

const MemberBhojanshalaPassesPage = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bhojanshala/my-passes");
      setPasses(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch passes", err);
    } finally {
      setLoading(false);
    }
  };

  const activePasses = passes.filter(p => p.status === "BOOKED");
  const pendingPasses = passes.filter(p => p.status === "PENDING");
  const pastPasses = passes.filter(p => p.status !== "BOOKED" && p.status !== "PENDING");

  const handleApprove = async (organizationId, passId) => {
    try {
      await api.patch(`/bhojanshala/${organizationId}/passes/${passId}/approve`);
      fetchPasses(); // refresh passes
    } catch (err) {
      alert(extractErrorMessage(err) || "Failed to approve pass");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bhojanshala Passes</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your active and past dining passes.</p>
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-500">Loading your passes...</div>
      ) : (
        <div className="space-y-8">
          {pendingPasses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-yellow-600 border-b pb-2 border-yellow-100">Pending Approval</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {pendingPasses.map(pass => (
                  <PassCard 
                    key={pass.id} 
                    pass={pass} 
                    isPending 
                    onApprove={() => handleApprove(pass.organizationId, pass.id)} 
                  />
                ))}
              </div>
            </div>
          )}

          {activePasses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Active Passes</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {activePasses.map(pass => (
                  <PassCard key={pass.id} pass={pass} />
                ))}
              </div>
            </div>
          )}

          {pastPasses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Past Passes</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {pastPasses.map(pass => (
                  <PassCard key={pass.id} pass={pass} isPast />
                ))}
              </div>
            </div>
          )}

          {passes.length === 0 && (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-800">No passes found</h3>
              <p className="text-slate-500 text-sm mt-1">You haven't booked any Bhojanshala passes yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PassCard = ({ pass, isPast, isPending, onApprove }) => {
  return (
    <div className={`p-5 rounded-xl border flex flex-col gap-4 ${isPast ? 'bg-slate-50 border-slate-200 opacity-75' : isPending ? 'bg-yellow-50/50 border-yellow-200 shadow-sm' : 'bg-white border-orange-200 shadow-sm'}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wide">
            {pass.mealType}
          </span>
          <h3 className="font-semibold text-slate-900 mt-2">{pass.organization?.name || "Bhojanshala"}</h3>
          <p className="text-xs font-mono text-slate-500 mt-1">ID: {pass.publicId}</p>
        </div>
        {!isPast && !isPending && (
          <div className="bg-slate-100 p-2 rounded-lg">
            <QrCode className="w-10 h-10 text-slate-700" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span>{new Date(pass.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span>{pass.numberOfPersons} {pass.numberOfPersons === 1 ? 'Person' : 'Persons'}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <span className="text-sm font-medium text-slate-700">₹{pass.pricePaid}</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold uppercase ${
            pass.status === 'BOOKED' ? 'text-green-600' :
            pass.status === 'PENDING' ? 'text-yellow-600' :
            pass.status === 'SCANNED' ? 'text-blue-600' : 'text-slate-500'
          }`}>
            {pass.status}
          </span>
          
          {isPending && (
            <button 
              onClick={onApprove}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberBhojanshalaPassesPage;
