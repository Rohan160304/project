# Fix in MemberEventsPage
sed -i '' "s/bannerUrl !== 'attached_banner_placeholder.png' ? bannerUrl/bannerUrl \&\& bannerUrl !== 'attached_banner_placeholder.png' ? bannerUrl/g" /Users/sde/Documents/SDEJOB/JiNANAM\ Community/Jinanam-Community-Frontend-main/src/pages/member/MemberEventsPage.jsx

# Fix in MemberEventDetailPage
sed -i '' "s/event.bannerUrl !== 'attached_banner_placeholder.png' ? event.bannerUrl/event.bannerUrl \&\& event.bannerUrl !== 'attached_banner_placeholder.png' ? event.bannerUrl/g" /Users/sde/Documents/SDEJOB/JiNANAM\ Community/Jinanam-Community-Frontend-main/src/pages/member/MemberEventDetailPage.jsx
