const r = {
  id: 'cmsvjxm640008u8xk4q5xgzf5',
  publicId: 'JFEV109',
  status: 'PUBLISHED',
  startAt: '2026-08-17T08:37:00.000Z',
  endAt: '2026-08-18T08:37:00.000Z',
};
const isEvent = r.type === "EVENT" || r.status === "PUBLISHED" || r.status === "RSVP_SALES_OPEN" || r.status === "LIVE" || r.status === "COMPLETED" || r.status === "CANCELLED";
let open = true;
if (isEvent) {
  const end = new Date(r.endAt || r.end_at || r.startAt || r.start_at);
  const validStatus = ["PUBLISHED", "RSVP_SALES_OPEN", "LIVE"].includes(r.status);
  open = validStatus && (!isNaN(end.getTime()) ? end >= new Date() : true);
} else {
  open = r.isOpen ?? r.status === "ACTIVE" ?? true;
}
console.log({isEvent, open});
