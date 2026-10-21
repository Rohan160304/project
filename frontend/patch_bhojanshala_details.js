const fs = require('fs');
let code = fs.readFileSync('src/pages/member/MemberBhojanshalaDetailPage.jsx', 'utf8');

// Replace the timing variables definition
code = code.replace(
  'const bhojanshalaTimings = orgData.bhojanshalaTimings || {};',
  `const bhojanshalaTimings = {
    BREAKFAST: {
      timing: orgData.bhojanshalaBreakfastTiming || "—",
      price: orgData.bhojanshalaBreakfastCharge || "—"
    },
    LUNCH: {
      timing: orgData.bhojanshalaLunchTiming || "—",
      price: orgData.bhojanshalaLunchCharge || "—"
    },
    DINNER: {
      timing: orgData.bhojanshalaDinnerTiming || "—",
      price: orgData.bhojanshalaDinnerCharge || "—"
    }
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const menuByDay = {};
  daysOfWeek.forEach(d => menuByDay[d] = []);
  (menuItems || []).forEach(item => {
    if (menuByDay[item.dayOfWeek]) {
      menuByDay[item.dayOfWeek].push(item);
    }
  });`
);

// Update Timings rendering
code = code.replace(
  '<span className="text-slate-800 font-semibold">{bhojanshalaTimings.breakfast || "—"}</span>',
  '<span className="text-slate-800 font-semibold">{bhojanshalaTimings.BREAKFAST.timing} {bhojanshalaTimings.BREAKFAST.price !== "—" ? `• ₹${bhojanshalaTimings.BREAKFAST.price}` : ""}</span>'
);
code = code.replace(
  '<span className="text-slate-800 font-semibold">{bhojanshalaTimings.lunch || "—"}</span>',
  '<span className="text-slate-800 font-semibold">{bhojanshalaTimings.LUNCH.timing} {bhojanshalaTimings.LUNCH.price !== "—" ? `• ₹${bhojanshalaTimings.LUNCH.price}` : ""}</span>'
);
code = code.replace(
  '<span className="text-slate-800 font-semibold">{bhojanshalaTimings.dinner || "—"}</span>',
  '<span className="text-slate-800 font-semibold">{bhojanshalaTimings.DINNER.timing} {bhojanshalaTimings.DINNER.price !== "—" ? `• ₹${bhojanshalaTimings.DINNER.price}` : ""}</span>'
);

// Update Menu rendering
const menuBlockOld = `{menuItems.length > 0 ? (
                <div className="space-y-4">
                  {menuItems.map(item => (
                    <div key={item.id} className="border-b last:border-0 pb-3 last:pb-0">
                      <div className="font-bold text-sm text-slate-800">{item.dayOfWeek}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        <span className="font-medium text-slate-700">{t("Breakfast")}:</span> {item.breakfastMenu || "—"}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        <span className="font-medium text-slate-700">{t("Lunch")}:</span> {item.lunchMenu || "—"}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        <span className="font-medium text-slate-700">{t("Dinner")}:</span> {item.dinnerMenu || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 text-center py-4">{t("No menu configured.")}</div>
              )}`;

const menuBlockNew = `{menuItems.length > 0 ? (
                <div className="space-y-6">
                  {daysOfWeek.map(day => {
                    const dayItems = menuByDay[day];
                    if (!dayItems || dayItems.length === 0) return null;
                    return (
                      <div key={day} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                        <div className="font-bold text-sm text-slate-800 mb-3">{day}</div>
                        <div className="space-y-3">
                          {dayItems.map(item => {
                             const timingObj = bhojanshalaTimings[item.mealType] || {};
                             const timeStr = item.startTime ? \`\${item.startTime} - \${item.endTime}\` : timingObj.timing;
                             const priceStr = item.price !== null && item.price !== undefined ? item.price : timingObj.price;

                             return (
                               <div key={item.id} className="text-xs text-slate-600">
                                 <div className="flex justify-between items-start mb-0.5">
                                   <span className="font-semibold text-orange-600 capitalize">{item.mealType.toLowerCase()}</span>
                                   {(timeStr !== "—" || priceStr !== "—") && (
                                     <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                       {timeStr !== "—" ? timeStr : ""} {priceStr !== "—" && \`• ₹\${priceStr}\`}
                                     </span>
                                   )}
                                 </div>
                                 <div className="text-slate-800 font-medium text-[13px]">{item.itemName}</div>
                                 {item.description && <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>}
                               </div>
                             );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-500 text-center py-4">{t("No menu configured.")}</div>
              )}`;

code = code.replace(menuBlockOld, menuBlockNew);

fs.writeFileSync('src/pages/member/MemberBhojanshalaDetailPage.jsx', code);
