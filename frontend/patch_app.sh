sed -i '' -e 's|const MemberProfilePage = lazy(() => import("@/pages/member/MemberProfilePage"));|const MemberProfilePage = lazy(() => import("@/pages/member/MemberProfilePage"));\
const MemberEditProfilePage = lazy(() => import("@/pages/member/MemberEditProfilePage"));|' src/App.js

sed -i '' -e 's|<Route path="profile" element={<MemberProfilePage />} />|<Route path="profile" element={<MemberProfilePage />} />\
                <Route path="profile/edit" element={<MemberEditProfilePage />} />|' src/App.js
