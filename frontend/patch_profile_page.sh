sed -i '' -e 's|<Link|<Link\
              to="/member/profile/edit"\
              className="px-5 py-3 rounded-2xl bg-white/20 text-white font-bold text-xs shadow-md hover:bg-white/30 backdrop-blur transition-colors flex items-center gap-2"\
            >\
              <Edit3 className="w-4 h-4" />\
              {t("Edit Profile")}\
            </Link>\
            <Link|' src/pages/member/MemberProfilePage.jsx
