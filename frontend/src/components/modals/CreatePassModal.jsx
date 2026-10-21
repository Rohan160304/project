import React, { useState } from 'react';
import { X, Search, Calendar, Users, IndianRupee, Info, Calendar as CalendarIcon } from 'lucide-react';
import { api, extractErrorMessage } from '../../lib/api';

const CreatePassModal = ({ isOpen, onClose, organizationId, onSuccess }) => {
  const [formData, setFormData] = useState({
    memberIdentifier: '',
    mealType: 'LUNCH',
    date: new Date().toISOString().split('T')[0],
    numberOfPersons: 1,
    pricePaid: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orgData, setOrgData] = useState(null);

  React.useEffect(() => {
    if (isOpen && organizationId) {
      api.get(`/bhojanshala/${organizationId}/menu`)
        .then(res => setMenuItems(res.data?.data || []))
        .catch(err => console.error("Failed to fetch menu", err));
      
      api.get(`/temples/${organizationId}`)
        .then(res => setOrgData(res.data?.data))
        .catch(err => console.error("Failed to fetch orgData", err));
    }
  }, [isOpen, organizationId]);

  const currentDayOfWeek = React.useMemo(() => {
    if (!formData.date) return "";
    return new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' });
  }, [formData.date]);

  const availableMealsForDay = React.useMemo(() => {
    return menuItems.filter(m => m.dayOfWeek === currentDayOfWeek && m.isAvailable);
  }, [menuItems, currentDayOfWeek]);

  const selectedMenu = React.useMemo(() => {
    return availableMealsForDay.find(m => m.mealType === formData.mealType);
  }, [availableMealsForDay, formData.mealType]);

  const pricePerPerson = React.useMemo(() => {
    if (selectedMenu && selectedMenu.price !== null && selectedMenu.price !== undefined && selectedMenu.price !== "") {
      return Number(selectedMenu.price);
    }
    if (orgData) {
      if (formData.mealType === 'BREAKFAST') return Number(orgData.bhojanshalaBreakfastCharge) || 0;
      if (formData.mealType === 'LUNCH') return Number(orgData.bhojanshalaLunchCharge) || 0;
      if (formData.mealType === 'DINNER') return Number(orgData.bhojanshalaDinnerCharge) || 0;
    }
    return 0;
  }, [selectedMenu, formData.mealType, orgData]);

  const calculatedTotalAmount = pricePerPerson * formData.numberOfPersons;

  React.useEffect(() => {
    setFormData(prev => ({ ...prev, pricePaid: calculatedTotalAmount }));
  }, [calculatedTotalAmount]);



  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post(`/bhojanshala/${organizationId}/passes`, {
        ...formData,
        date: new Date(formData.date).toISOString(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err) || 'Failed to create pass');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Create Pass</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Member ID or Mobile Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="memberIdentifier"
                value={formData.memberIdentifier}
                onChange={handleChange}
                placeholder="Enter member ID or mobile"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meal Type
              </label>
              <select
                name="mealType"
                value={formData.mealType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>


          {selectedMenu && (
            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-orange-900 text-sm">{selectedMenu.itemName}</h4>
                  <p className="text-xs text-orange-700">{selectedMenu.description}</p>
                  {(selectedMenu.startTime && selectedMenu.endTime) && (
                     <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                       <CalendarIcon className="w-3 h-3"/> {selectedMenu.startTime} - {selectedMenu.endTime}
                     </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600">₹{pricePerPerson}</div>
                  <div className="text-[10px] text-orange-500 uppercase">per person</div>
                </div>
              </div>
            </div>
          )}

          {!selectedMenu && (
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 mt-0.5" />
              <p className="text-xs text-slate-600">
                Menu details are not available for this meal on {currentDayOfWeek}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                No. of Persons
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="numberOfPersons"
                  min="1"
                  max="10"
                  value={formData.numberOfPersons}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount Paid
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="pricePaid"
                  min="0"
                  value={formData.pricePaid}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Pass'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePassModal;
