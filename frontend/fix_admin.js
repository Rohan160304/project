const fs = require('fs');
const file = 'src/pages/dharamshala/DharamshalaBookingsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. state
content = content.replace(
  /const \[selectedRoomId, setSelectedRoomId\] = useState\(""\);/g,
  'const [selectedRoomIds, setSelectedRoomIds] = useState([]);'
);

// 2. useEffect
content = content.replace(
  /setSelectedRoomId\(selectedBooking\.allocatedRoomId \|\| ""\);/g,
  "setSelectedRoomIds(selectedBooking.allocatedRoomId ? selectedBooking.allocatedRoomId.split(',').map(id => id.trim()) : []);"
);

// 3. handleAction approve
content = content.replace(
  /allocatedRoomId: selectedRoomId \|\| undefined/g,
  "allocatedRoomId: selectedRoomIds.filter(Boolean).join(',') || undefined"
);

// 4. handleAction check-in
content = content.replace(
  /roomId: selectedRoomId \|\| undefined/g,
  "roomId: selectedRoomIds.filter(Boolean).join(',') || undefined"
);

// 5. Room Assignment UI
content = content.replace(
  /<h4 className="text-sm font-semibold text-muted-foreground mb-1">\{t\("Assign Room"\)\}<\/h4>\n\s+<Select value=\{selectedRoomId\} onValueChange=\{setSelectedRoomId\}>\n\s+<SelectTrigger>\n\s+<SelectValue placeholder=\{t\("Select a room to assign"\)\} \/>\n\s+<\/SelectTrigger>\n\s+<SelectContent>\n\s+\{availableRooms\.length === 0 \? \(\n\s+<SelectItem value="none" disabled>\{t\("No available rooms for this category"\)\}<\/SelectItem>\n\s+\) : \(\n\s+availableRooms\.map\(room => \(\n\s+<SelectItem key=\{room\.id\} value=\{room\.id\}>\n\s+\{room\.name\} \(\{room\.wing\?\.name \|\| t\("Main"\)\}\)\n\s+<\/SelectItem>\n\s+\)\)\n\s+\)\}\n\s+\{\/\* If already assigned a room not in the available list, show it \*\/\}\n\s+\{selectedRoomId && !availableRooms\.find\(r => r\.id === selectedRoomId\) && \(\n\s+<SelectItem value=\{selectedRoomId\}>\{t\("Currently Assigned Room"\)\}<\/SelectItem>\n\s+\)\}\n\s+<\/SelectContent>\n\s+<\/Select>/g,
  `<h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("Assign Room")} ({t("Requested")}: {selectedBooking.quantity || 1})</h4>\n                    <div className="space-y-2">\n                      {Array.from({ length: selectedBooking.quantity || 1 }).map((_, idx) => (\n                        <Select \n                          key={idx}\n                          value={selectedRoomIds[idx] || ""} \n                          onValueChange={(val) => {\n                            const newIds = [...selectedRoomIds];\n                            newIds[idx] = val;\n                            setSelectedRoomIds(newIds);\n                          }}\n                        >\n                          <SelectTrigger>\n                            <SelectValue placeholder={\`\${t("Select room")} \${idx + 1}\`} />\n                          </SelectTrigger>\n                          <SelectContent>\n                            {availableRooms.length === 0 ? (\n                              <SelectItem value="none" disabled>{t("No available rooms for this category")}</SelectItem>\n                            ) : (\n                              availableRooms.map(room => (\n                                <SelectItem key={room.id} value={room.id}>\n                                  {room.name} ({room.wing?.name || t("Main")})\n                                </SelectItem>\n                              ))\n                            )}\n                            {selectedRoomIds[idx] && !availableRooms.find(r => r.id === selectedRoomIds[idx]) && (\n                               <SelectItem value={selectedRoomIds[idx]}>{t("Currently Assigned Room")}</SelectItem>\n                            )}\n                          </SelectContent>\n                        </Select>\n                      ))}\n                    </div>`
);

// 6. Payment Summary
content = content.replace(
  /<h4 className="text-sm font-semibold text-muted-foreground mb-1">\{t\("Payment Summary"\)\}<\/h4>/g,
  `<h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("Payment Summary")}</h4>\n                  <p className="text-sm flex justify-between"><span>{t("Requested Rooms")}:</span> <span className="font-medium">{selectedBooking.quantity || 1}</span></p>`
);

fs.writeFileSync(file, content, 'utf8');
console.log("Admin page updated");
