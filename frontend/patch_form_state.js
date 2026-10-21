const fs = require('fs');
let code = fs.readFileSync('src/pages/OrgDetailPage.jsx', 'utf8');

code = code.replace(
  '        hasPathshala: org.hasPathshala ?? false,',
  '        hasPathshala: org.hasPathshala ?? false,\n        pathshalaPublished: org.pathshalaPublished ?? false,'
);

const pathshalaToggle = `{toggle("Pathshala Available", "hasPathshala")}
                        {form.hasPathshala && (
                          <div className="mb-3 px-6">
                            <label className="flex items-center space-x-2 p-3 bg-purple-50 rounded-xl border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors">
                              <Checkbox 
                                checked={form.pathshalaPublished} 
                                onCheckedChange={(c) => setForm({ ...form, pathshalaPublished: !!c })}
                              />
                              <span className="text-sm font-semibold text-purple-900">Publish Pathshala Profile</span>
                            </label>
                          </div>
                        )}`;

code = code.replace(
  '{toggle("Pathshala Available", "hasPathshala")}',
  pathshalaToggle
);

fs.writeFileSync('src/pages/OrgDetailPage.jsx', code);
