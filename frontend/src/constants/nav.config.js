import {
  LayoutDashboard, Users, UsersRound, HandHeart, Landmark, Hotel, Building2,
  Briefcase, ScanLine, CalendarCheck, HeartHandshake, PartyPopper, Ticket,
  Armchair, Route, Newspaper, Tag, Megaphone, ScrollText, BarChart3, Calendar,
  Sigma, MapPin, Smartphone, BellRing, MessagesSquare, Image, HandshakeIcon,
  LifeBuoy, Bell, TrendingUp, Settings, ClipboardList, Search, Database,
  UserX, Home as HomeIcon, HelpCircle, LayoutTemplate, MessageSquareWarning,
  CreditCard, CalendarDays, PieChart, Activity, GitBranch, Map as MapIcon,
  Footprints, BookOpen, BadgeIndianRupee, Receipt, Flame, AlertTriangle,
  BarChart2, Globe, ShieldAlert, CheckSquare, PhoneCall, Wallet, FileText
} from "lucide-react";

export const NAV_LAYOUT = "nested"; // "flat" | "nested"

export const ROUTE_TONES = {
  "/": "yellow",
  "/search": "blue",
  "/members": "blue",
  "/family": "purple",
  "/monks": "orange",
  "/community-pages": "pink",
  "/temples": "orange",
  "/dharamshalas": "green",
  "/jain-centers": "purple",
  "/staff": "teal",
  "/visitors": "blue",
  "/bookings": "green",
  "/donations": "orange",
  "/events": "purple",
  "/tickets": "pink",
  "/seating": "teal",
  "/tours": "orange",
  "/feed": "blue",
  "/offers": "green",
  "/ads": "purple",
  "/news": "orange",
  "/polls": "teal",
  "/calendar": "purple",
  "/counters": "orange",
  "/gallery": "pink",
  "/announcements": "red",
  "/tracking": "blue",
  "/devices": "teal",
  "/alerts": "red",
  "/communication": "blue",
  "/volunteers": "green",
  "/support-tickets": "orange",
  "/notifications": "purple",
  "/reports": "green",
  "/settings": "orange",
  "/audit-logs": "purple",
  "/master-data": "teal",
};

export const TONE_HEX = {
  yellow: "#FACC15",
  green: "#10B981",
  orange: "#F59E0B",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  red: "#EF4444",
  teal: "#14B8A6",
  pink: "#EC4899",
};

// --- FLAT STRUCTURE (Option 1) ---
export const FLAT_NAV = [
  { id: "sep-overview", isSeparator: true, label: "Overview" },
  { id: "sa-dashboard", label: "SA Dashboard", icon: LayoutDashboard, route: "/admin/sa-dashboard", roles: ["SUPER_ADMIN"] },
  { id: "a-dashboard", label: "A Dashboard", icon: LayoutDashboard, route: "/admin/a-dashboard", roles: ["SUPER_ADMIN", "TEMPLE_ADMIN", "DHARAMSHALA_ADMIN", "JAIN_CENTER_ADMIN", "MONK_ADMIN", "BHOJANSHALA_ADMIN", "PATHSHALA_ADMIN", "ORG_ADMIN", "SUB_ADMIN", "STAFF"] },

  { id: "sep-orgs", isSeparator: true, label: "Organizations" },
  { id: "flat-temples", label: "Temple", icon: Landmark, route: "/admin/temples" },
  { id: "flat-jain-centers", label: "Jain Centre", icon: Building2, route: "/admin/jain-centers" },
  { id: "flat-dharamshalas", label: "Dharamshala", icon: Hotel, route: "/admin/dharamshalas" },
  { id: "flat-bhojanshala", label: "Bhojanshala", icon: Sigma, route: "/admin/coming-soon?module=Bhojanshala", featureFlag: false },
  { id: "flat-sthanaks", label: "Sthanaks", icon: HomeIcon, route: "/admin/sthanaks" },
  { id: "flat-community-pages", label: "Community Pages", icon: Globe, route: "/admin/community-pages" },

  { id: "sep-people", isSeparator: true, label: "People" },
  { id: "flat-jain-members", label: "Jain Members", icon: Users, route: "/admin/members" },
  { id: "flat-non-jain-members", label: "Non-Jain Members", icon: UserX, route: "/admin/non-jain-members" },
  { id: "flat-ms", label: "MS Management", icon: HandHeart, route: "/admin/monks" },
  { id: "flat-family", label: "Family", icon: UsersRound, route: "/admin/family" },
  { id: "flat-staff", label: "Staff Management", icon: Briefcase, route: "/admin/staff" },
  { id: "flat-volunteers", label: "Volunteers", icon: HandshakeIcon, route: "/admin/volunteers" },

  { id: "sep-comm", isSeparator: true, label: "Communication" },
  { id: "flat-feed", label: "Feed", icon: Newspaper, route: "/admin/feed" },
  { id: "flat-events", label: "Events", icon: PartyPopper, route: "/admin/events" },
  { id: "flat-gallery", label: "Gallery", icon: Image, route: "/admin/gallery" },
  { id: "flat-announcements", label: "Announcements", icon: Megaphone, route: "/admin/announcements" },
  { id: "flat-news", label: "News", icon: ScrollText, route: "/admin/news" },
  { id: "flat-polls", label: "Polls", icon: BarChart3, route: "/admin/polls" },
  { id: "flat-notifications", label: "Notifications", icon: Bell, route: "/admin/notifications" },
  { id: "flat-tours", label: "Tours", icon: Route, route: "/admin/tours" },
  { id: "flat-99-management", label: "99 Management", icon: GitBranch, route: "/admin/coming-soon?module=99 Management", featureFlag: false },
  { id: "flat-varshitap", label: "Varshitap Management", icon: Flame, route: "/admin/coming-soon?module=Varshitap Management", featureFlag: false },

  { id: "sep-bookings", isSeparator: true, label: "Bookings", featureFlag: true },
  { id: "flat-booking-setup", label: "Booking Setup", icon: CalendarCheck, route: "/admin/coming-soon?module=Booking Setup", featureFlag: true },
  { id: "flat-booking-categories", label: "Categories", icon: ClipboardList, route: "/admin/coming-soon?module=Booking Categories", featureFlag: false },
  { id: "flat-booking-requests", label: "Requests", icon: CalendarCheck, route: "/admin/bookings?tab=admin_bookings" },
  { id: "flat-booking-reservations", label: "Reservations", icon: CalendarCheck, route: "/admin/bookings?tab=reservations" },
  { id: "flat-booking-calendar", label: "Calendar", icon: Calendar, route: "/admin/booking-calendar" },

  { id: "sep-operations", isSeparator: true, label: "Operations", featureFlag: true },
  { id: "flat-visitors", label: "Visitors", icon: ScanLine, route: "/admin/visitors" },
  { id: "flat-gps", label: "GPS", icon: MapPin, route: "/admin/tracking" },
  { id: "flat-routes", label: "Routes", icon: GitBranch, route: "/admin/routes" },
  { id: "flat-journey-logs", label: "Journey Logs", icon: BookOpen, route: "/admin/journey-logs" },
  { id: "flat-live-map", label: "Live Map", icon: MapIcon, route: "/admin/live-map" },
  { id: "flat-attendance", label: "Attendance", icon: CheckSquare, route: "/admin/staff?tab=attendance", featureFlag: false },

  { id: "sep-finance", isSeparator: true, label: "Finance", featureFlag: true },
  { id: "flat-donations", label: "Donations", icon: HeartHandshake, route: "/admin/donations", featureFlag: true },
  { id: "flat-receipts", label: "Receipts", icon: Receipt, route: "/admin/receipts" },
  { id: "flat-sponsors", label: "Sponsors", icon: Wallet, route: "/admin/coming-soon?module=Sponsors", featureFlag: false },
  { id: "flat-offers", label: "Offers", icon: Tag, route: "/admin/offers" },
  { id: "flat-ads", label: "Advertisements", icon: Megaphone, route: "/admin/ads" },

  { id: "sep-admin-mgt", isSeparator: true, label: "Admin Management" },
  { id: "flat-admin-users", label: "Admin Users", icon: UsersRound, route: "/admin/admins", roles: ["SUPER_ADMIN"] },
  { id: "flat-subscription-plans", label: "Subscription Plans", icon: CreditCard, route: "/admin/subscription-plans", roles: ["SUPER_ADMIN"] },
  { id: "flat-roles-permissions", label: "Roles & Permission Assignment", icon: Settings, route: "/admin/roles-permissions", roles: ["SUPER_ADMIN"] },
  { id: "flat-login-history", label: "Login History", icon: ClipboardList, route: "/admin/login-history", roles: ["SUPER_ADMIN"] },
  { id: "flat-account-status", label: "Account Status", icon: ShieldAlert, route: "/admin/account-status", roles: ["SUPER_ADMIN"] },

  { id: "flat-reports", label: "Reports", icon: TrendingUp, route: "/admin/reports" },
  { id: "flat-support", label: "Support", icon: LifeBuoy, route: "/admin/support-tickets" },
  { id: "flat-activity-logs", label: "Activity Logs", icon: ClipboardList, route: "/admin/audit-logs", roles: ["SUPER_ADMIN"] },
  { id: "flat-module-controller", module: "MODULE_CONTROLLER", label: "Module Controller", icon: Settings, route: "/admin/module-controller", roles: ["SUPER_ADMIN", "TEMPLE_ADMIN", "DHARAMSHALA_ADMIN", "JAIN_CENTER_ADMIN", "BHOJANSHALA_ADMIN", "PATHSHALA_ADMIN", "ORG_ADMIN", "SUB_ADMIN", "STAFF"] },
  { id: "flat-settings", label: "Settings", icon: Settings, route: "/admin/settings" }
];

// --- NESTED STRUCTURE (Option 2) ---
export const NESTED_NAV = [
  { id: "sa-dashboard", label: "SA Dashboard", icon: LayoutDashboard, route: "/admin/sa-dashboard", roles: ["SUPER_ADMIN"] },
  { id: "a-dashboard", label: "A Dashboard", icon: LayoutDashboard, route: "/admin/a-dashboard", roles: ["SUPER_ADMIN", "TEMPLE_ADMIN", "DHARAMSHALA_ADMIN", "JAIN_CENTER_ADMIN", "MONK_ADMIN", "BHOJANSHALA_ADMIN", "PATHSHALA_ADMIN", "ORG_ADMIN", "SUB_ADMIN", "STAFF"] },

  {
    id: "folder-members",
    module: "MEMBERS",
    label: "Members",
    icon: Users,
    children: [
      { id: "m-jain", label: "Jain Members", route: "/admin/members" },
      { id: "m-non-jain", label: "Non-Jain Members", route: "/admin/non-jain-members" },
      { id: "m-family", label: "Family Management", route: "/admin/family" },
      { id: "m-import", label: "Import Members", route: "/admin/members?import=true" },
      { id: "m-export", label: "Export Members", route: "/admin/members?export=true" }
    ]
  },
  {
    id: "folder-ms",
    module: "MONKS",
    label: "MS Management",
    icon: HandHeart,
    children: [
      { id: "ms-profiles", label: "MS Profiles", route: "/admin/ms-profiles" },
      { id: "ms-hierarchy", label: "Guru Hierarchy", route: "/admin/coming-soon?module=Guru Hierarchy", featureFlag: false },
      { id: "ms-groups", label: "MS Groups", route: "/admin/ms-groups" },
      { id: "ms-assoc", label: "MS Associations", route: "/admin/coming-soon?module=MS Associations", featureFlag: false },
      { id: "ms-route", label: "Vihar Routes Master", route: "/admin/routes" },
      { id: "ms-planning", label: "Route Planning", route: "/admin/coming-soon?module=Route Planning", featureFlag: false },
      { id: "ms-journey", label: "Live Vihar Tracking", route: "/admin/journey-logs" },
      { id: "ms-journey-history", label: "Journey History", route: "/admin/journey-history" },
      { id: "ms-chaturmas", label: "Chaturmas", route: "/admin/chaturmas" },
      { id: "ms-tapasya", label: "Tapasya", route: "/admin/coming-soon?module=Tapasya", featureFlag: false },
      { id: "ms-timeline", label: "Timeline", route: "/admin/coming-soon?module=Timeline", featureFlag: false },
      { id: "ms-followers", label: "Followers", route: "/admin/coming-soon?module=Followers", featureFlag: false }
    ]
  },
  {
    id: "folder-staff",
    module: "STAFF",
    label: "Staff",
    icon: Briefcase,
    children: [
      { id: "st-mgt", label: "Staff Management", route: "/admin/staff" },
      { id: "st-docs", label: "Documents", route: "/admin/staff?tab=documents" }
    ]
  },
  {
    id: "folder-committee",
    module: "STAFF",
    label: "Committee",
    icon: UsersRound,
    featureFlag: false,
    children: [
      { id: "com-members", label: "Committee Members", route: "/admin/coming-soon?module=Committee Members" },
      { id: "com-desig", label: "Designations", route: "/admin/coming-soon?module=Committee Designations" },
      { id: "com-dir", label: "Contact Directory", route: "/admin/coming-soon?module=Committee Directory" }
    ]
  },

  {
    id: "folder-temple",
    module: "TEMPLES",
    label: "Temple",
    icon: Landmark,
    children: [
      { id: "t-mgt", label: "Temple Management", route: "/admin/temples" },
      { id: "t-info", label: "Temple Information", route: "/admin/coming-soon?module=Temple Information", featureFlag: false },
      { id: "t-fac", label: "Facilities", route: "/admin/coming-soon?module=Temple Facilities", featureFlag: false },
      { id: "t-com", label: "Committee", route: "/admin/coming-soon?module=Temple Committee", featureFlag: false },
      { id: "t-not", label: "Notices", route: "/admin/coming-soon?module=Temple Notices", featureFlag: false },
      { id: "t-rev", label: "Reviews", route: "/admin/coming-soon?module=Temple Reviews", featureFlag: false },
      { id: "t-dhaja", label: "Dhaja", route: "/admin/coming-soon?module=Temple Dhaja", featureFlag: false },
      { id: "t-social", label: "Social Links", route: "/admin/coming-soon?module=Temple Social Links", featureFlag: false }
    ]
  },
  {
    id: "folder-jc",
    module: "JAIN_CENTERS",
    label: "Jain Centre",
    icon: Building2,
    children: [
      { id: "jc-mgt", label: "Jain Centre Management", route: "/admin/jain-centers" },
      { id: "jc-info", label: "Centre Information", route: "/admin/coming-soon?module=Centre Information", featureFlag: false },
      { id: "jc-fac", label: "Facilities", route: "/admin/coming-soon?module=Jain Centre Facilities", featureFlag: false },
      { id: "jc-com", label: "Committee", route: "/admin/coming-soon?module=Jain Centre Committee", featureFlag: false },
      { id: "jc-not", label: "Notices", route: "/admin/coming-soon?module=Jain Centre Notices", featureFlag: false },
      { id: "jc-rev", label: "Reviews", route: "/admin/coming-soon?module=Jain Centre Reviews", featureFlag: false },
      { id: "jc-social", label: "Social Links", route: "/admin/coming-soon?module=Jain Centre Social Links", featureFlag: false }
    ]
  },
  {
    id: "folder-dharamshala-sa",
    module: "DHARAMSHALAS",
    label: "Dharamshala",
    icon: Hotel,
    roles: ["SUPER_ADMIN"],
    children: [
      { id: "d-list", label: "Dharamshalas (Orgs)", route: "/admin/dharamshalas" },
      { id: "d-book", label: "Bookings", route: "/admin/dharamshala/bookings" }
    ]
  },
  {
    id: "folder-dharamshala-admin",
    module: "DHARAMSHALAS",
    label: "Dharamshala",
    icon: Hotel,
    roles: ["DHARAMSHALA_ADMIN", "TEMPLE_ADMIN", "JAIN_CENTER_ADMIN", "JC_ADMIN", "MONK_ADMIN", "SUB_ADMIN", "STAFF", "ORG_ADMIN"],
    children: [
      { id: "d-list-admin", module: "DHARAMSHALAS", label: "Dharamshalas (Orgs)", route: "/admin/dharamshalas" },
      { id: "d-book-admin", module: "DHARAMSHALAS", label: "Bookings", route: "/admin/dharamshala/bookings" }
    ]
  },
  {
    id: "folder-bhojanshala",
    module: "BHOJANSHALAS",
    label: "Bhojanshala",
    icon: Sigma,
    roles: ["SUPER_ADMIN", "TEMPLE_ADMIN", "DHARAMSHALA_ADMIN", "JAIN_CENTER_ADMIN", "BHOJANSHALA_ADMIN", "ORG_ADMIN", "SUB_ADMIN", "STAFF"],
    children: [
      { id: "bh-list", label: "Bhojanshalas (Orgs)", route: "/admin/bhojanshalas" },
      { id: "bh-mgt", label: "Bhojanshala Management", route: "/admin/bhojanshala-management" }
    ]
  },
  /*
  {
    id: "folder-pathshala",
    module: "PATHSHALAS",
    label: "Pathshala",
    icon: Sigma,
    featureFlag: false,
    roles: ["SUPER_ADMIN", "TEMPLE_ADMIN", "DHARAMSHALA_ADMIN", "JAIN_CENTER_ADMIN", "BHOJANSHALA_ADMIN", "PATHSHALA_ADMIN", "ORG_ADMIN", "SUB_ADMIN", "STAFF"],
    children: [
      { id: "pt-list", label: "Pathshalas (Orgs)", route: "/admin/pathshalas" },
      { id: "pt-mgt", label: "Pathshala Management", route: "/admin/pathshala-management" }
    ]
  },
  */

  {
    id: "folder-st",
    module: "STHANAKS",
    label: "Sthanaks",
    icon: HomeIcon,
    children: [
      { id: "st-stanak-mgt", label: "Sthanak Management", route: "/admin/sthanaks" }
    ]
  },
  {
    id: "folder-pages",
    module: "COMMUNITY_PAGES",
    label: "Community Pages",
    icon: Globe,
    children: [
      { id: "cp-my", label: "My Page", route: "/admin/community-pages" },
      { id: "cp-info", label: "Page Information", route: "/admin/coming-soon?module=Community Page Information", featureFlag: false },
      { id: "cp-fol", label: "Followers", route: "/admin/coming-soon?module=Community Page Followers", featureFlag: false },
      { id: "cp-rev", label: "Reviews", route: "/admin/coming-soon?module=Community Page Reviews", featureFlag: false },
      { id: "cp-social", label: "Social Links", route: "/admin/coming-soon?module=Community Page Social Links", featureFlag: false },
      { id: "cp-seo", label: "SEO & Sharing", route: "/admin/coming-soon?module=Community Page SEO", featureFlag: false }
    ]
  },
  {
    id: "folder-feed",
    module: "FEED",
    label: "Feed",
    icon: Newspaper,
    children: [
      { id: "fe-mgt", label: "Feed Management", route: "/admin/feed" },
      { id: "fe-an", label: "Feed Analytics", route: "/admin/feed-analytics" }
    ]
  },
  {
    id: "group-events",
    module: "EVENTS",
    label: "Event Management",
    icon: PartyPopper,
    route: "/admin/events"
  },
  {
    id: "folder-volunteers",
    label: "Volunteers",
    icon: HandshakeIcon,
    children: [
      { id: "vol-mgt", label: "Volunteer Management", route: "/admin/volunteers" }
    ]
  },
  {
    id: "group-gallery",
    module: "GALLERY",
    label: "Gallery",
    icon: Image,
    route: "/admin/gallery"
  },
  {
    id: "folder-news",
    module: "NEWS",
    label: "News",
    icon: ScrollText,
    children: [
      { id: "ne-mgt", label: "News Management", route: "/admin/news" },
      { id: "ne-cat", label: "Categories", route: "/admin/coming-soon?module=News Categories", featureFlag: false },
      { id: "ne-feat", label: "Featured News", route: "/admin/coming-soon?module=Featured News", featureFlag: false },
      { id: "ne-sched", label: "Scheduled News", route: "/admin/coming-soon?module=Scheduled News", featureFlag: false },
      { id: "ne-arch", label: "Archived News", route: "/admin/coming-soon?module=Archived News", featureFlag: false }
    ]
  },
  {
    id: "folder-ann",
    module: "ANNOUNCEMENTS",
    label: "Announcements",
    icon: Megaphone,
    children: [
      { id: "an-mgt", label: "Announcement Management", route: "/admin/announcements" },
      { id: "an-pri", label: "Priority Announcements", route: "/admin/coming-soon?module=Priority Announcements", featureFlag: false },
      { id: "an-sched", label: "Scheduled Announcements", route: "/admin/coming-soon?module=Scheduled Announcements", featureFlag: false }
    ]
  },
  {
    id: "folder-polls",
    module: "POLLS",
    label: "Polls",
    icon: BarChart3,
    children: [
      { id: "po-mgt", label: "Poll Management", route: "/admin/polls" },
      { id: "po-resp", label: "Responses", route: "/admin/coming-soon?module=Poll Responses", featureFlag: false },
      { id: "po-res", label: "Poll Results", route: "/admin/coming-soon?module=Poll Results", featureFlag: false }
    ]
  },
  {
    id: "folder-tours",
    module: "TOURS",
    label: "Tours",
    icon: Route,
    children: [
      { id: "to-mgt", label: "Tour Management", route: "/admin/tours" },
      { id: "to-sched", label: "Tour Schedule", route: "/admin/coming-soon?module=Tour Schedule", featureFlag: false },
      { id: "to-reg", label: "Registrations", route: "/admin/coming-soon?module=Tour Registrations", featureFlag: false },
      { id: "to-part", label: "Participants", route: "/admin/coming-soon?module=Tour Participants", featureFlag: false }
    ]
  },
  {
    id: "folder-99",
    module: "TOURS",
    label: "99 Management",
    icon: GitBranch,
    featureFlag: false,
    children: [
      { id: "99-cat", label: "99 Categories", route: "/admin/coming-soon?module=99 Categories" },
      { id: "99-mgt", label: "99 Management", route: "/admin/coming-soon?module=99 Management" },
      { id: "99-part", label: "Participants", route: "/admin/coming-soon?module=99 Participants" },
      { id: "99-rep", label: "Completion Reports", route: "/admin/coming-soon?module=99 Completion Reports" }
    ]
  },
  {
    id: "folder-counter",
    module: "COUNTERS",
    label: "Spiritual Counter",
    icon: Sigma,
    children: [
      { id: "sc-cat", label: "Counter Categories", route: "/admin/counters" },
      { id: "sc-stats", label: "Member Statistics", route: "/admin/coming-soon?module=Member Counter Stats", featureFlag: false },
      { id: "sc-global", label: "Global Statistics", route: "/admin/coming-soon?module=Global Counter Stats", featureFlag: false }
    ]
  },
  {
    id: "folder-tcalendar",
    module: "CALENDAR",
    label: "Tithi Calendar",
    icon: Calendar,
    children: [
      { id: "tc-mgt", label: "Calendar Management", route: "/admin/calendar" },
      { id: "tc-types", label: "Calendar Types", route: "/admin/coming-soon?module=Calendar Types", featureFlag: false },
      { id: "tc-tithi", label: "Tithi Management", route: "/admin/coming-soon?module=Tithi Management", featureFlag: false }
    ]
  },
  {
    id: "folder-notif",
    module: "NOTIFICATIONS",
    label: "Notifications",
    icon: Bell,
    children: [
      { id: "nt-push", label: "Push Notifications", route: "/admin/coming-soon?module=Push Notifications", featureFlag: false },
      { id: "nt-wa", label: "WhatsApp", route: "/admin/coming-soon?module=WhatsApp Notifications", featureFlag: false },
      { id: "nt-sms", label: "SMS", route: "/admin/coming-soon?module=SMS Notifications", featureFlag: false },
      { id: "nt-email", label: "Email", route: "/admin/coming-soon?module=Email Notifications", featureFlag: false },
      { id: "nt-hist", label: "Notification History", route: "/admin/notifications" }
    ]
  },
  {
    id: "folder-varshitap",
    module: "TOURS", label: "Varshitap Management", icon: Flame, route: "/admin/coming-soon?module=Varshitap Management", featureFlag: false
  },
  {
    id: "group-bookings",
    featureFlag: true,
    label: "Bookings",
    icon: CalendarCheck,
    children: [
      {
        id: "folder-bcat",
        module: "BOOKINGS",
        label: "Booking Categories",
        icon: ClipboardList,
        children: [
          { id: "bc-mgt", label: "Category Management", route: "/admin/coming-soon?module=Category Management", featureFlag: false },
          { id: "bc-rules", label: "Booking Rules", route: "/admin/coming-soon?module=Booking Rules", featureFlag: false },
          { id: "bc-app", label: "Required Approvals", route: "/admin/coming-soon?module=Required Approvals", featureFlag: false }
        ]
      },
      {
        id: "folder-bres",
        module: "BOOKINGS",
        label: "Booking Resources",
        icon: Landmark,
        children: [
          { id: "br-rooms", label: "Rooms", route: "/admin/coming-soon?module=Booking Rooms", featureFlag: false },
          { id: "br-halls", label: "Halls", route: "/admin/coming-soon?module=Halls", featureFlag: false },
          { id: "br-bhoj", label: "Bhojanshala", route: "/admin/coming-soon?module=Bhojanshala Resources", featureFlag: false },
          { id: "br-pooja", label: "Pooja Booking", route: "/admin/coming-soon?module=Pooja Booking Resources", featureFlag: false },
          { id: "br-path", label: "Pathshala", route: "/admin/coming-soon?module=Pathshala Resources", featureFlag: false },
          { id: "br-other", label: "Other Resources", route: "/admin/coming-soon?module=Other Booking Resources", featureFlag: false }
        ]
      },
      {
        id: "folder-bmgt",
        module: "BOOKINGS",
        label: "Booking Management",
        icon: CalendarCheck,
        children: [
          { id: "bm-req", label: "Booking Requests", route: "/admin/bookings?tab=admin_bookings" },
          { id: "bm-res", label: "Reservations", route: "/admin/bookings?tab=reservations" },
          { id: "bm-walkin", label: "Walk-in Bookings", route: "/admin/coming-soon?module=Walk-in Bookings", featureFlag: false },
          { id: "bm-group", label: "Group Bookings", route: "/admin/coming-soon?module=Group Bookings", featureFlag: false },
          { id: "bm-wait", label: "Waiting List", route: "/admin/coming-soon?module=Booking Waiting List", featureFlag: false },
          { id: "bm-ext", label: "Booking Extensions", route: "/admin/coming-soon?module=Booking Extensions", featureFlag: false },
          { id: "bm-cancel", label: "Cancellations", route: "/admin/coming-soon?module=Cancellations", featureFlag: false }
        ]
      },
      {
        id: "folder-bprice",
        module: "BOOKINGS",
        label: "Pricing & Availability",
        icon: Wallet,
        children: [
          { id: "bp-price", label: "Pricing", route: "/admin/coming-soon?module=Pricing Setup", featureFlag: false },
          { id: "bp-seas", label: "Seasonal Pricing", route: "/admin/coming-soon?module=Seasonal Pricing", featureFlag: false },
          { id: "bp-avail", label: "Availability", route: "/admin/coming-soon?module=Availability Setup", featureFlag: false },
          { id: "bp-black", label: "Blackout Dates", route: "/admin/coming-soon?module=Blackout Dates", featureFlag: false },
          { id: "bp-limits", label: "Booking Limits", route: "/admin/coming-soon?module=Booking Limits", featureFlag: false }
        ]
      },
      {
        id: "folder-bcal",
        module: "BOOKINGS",
        label: "Calendar",
        icon: Calendar,
        children: [
          { id: "bl-grid", label: "Daily, Weekly, Monthly", route: "/admin/booking-calendar" },
          { id: "bl-res", label: "Resource Availability", route: "/admin/bookings?tab=availability_calendar" }
        ]
      },
      {
        id: "folder-bcheck",
        module: "BOOKINGS",
        label: "Check-In / Check-Out",
        icon: ScanLine,
        children: [
          { id: "bck-in", label: "Check-In", route: "/admin/coming-soon?module=Check-In", featureFlag: false },
          { id: "bck-out", label: "Check-Out", route: "/admin/coming-soon?module=Check-Out", featureFlag: false },
          { id: "bck-occ", label: "Current Occupancy", route: "/admin/coming-soon?module=Current Occupancy", featureFlag: false },
          { id: "bck-over", label: "Overstay Management", route: "/admin/coming-soon?module=Overstay Management", featureFlag: false }
        ]
      },
      {
        id: "folder-brep",
        module: "BOOKINGS",
        label: "Reports",
        icon: TrendingUp,
        children: [
          { id: "brp-book", label: "Booking", route: "/admin/reports?tab=bookings", featureFlag: false },
          { id: "brp-occ", label: "Occupancy", route: "/admin/coming-soon?module=Occupancy Reports", featureFlag: false },
          { id: "brp-cancel", label: "Cancellation", route: "/admin/coming-soon?module=Cancellation Reports", featureFlag: false },
          { id: "brp-rev", label: "Revenue", route: "/admin/coming-soon?module=Revenue Reports", featureFlag: false }
        ]
      }
    ]
  },

  {
    id: "group-finance",
    featureFlag: true,
    label: "Finance",
    icon: HeartHandshake,
    children: [
      {
        id: "folder-fnd",
        module: "DONATIONS",
        label: "Donations",
        icon: HeartHandshake,
        children: [
          { id: "dn-cat", label: "Donation Categories", route: "/admin/coming-soon?module=Donation Categories", featureFlag: false },
          { id: "dn-camp", label: "Donation Campaigns", route: "/admin/coming-soon?module=Donation Campaigns", featureFlag: false },
          { id: "dn-mgt", label: "Donation Management", route: "/admin/donations" },
          { id: "dn-verify", label: "Pending Verification", route: "/admin/coming-soon?module=Pending Verification", featureFlag: false },
          { id: "dn-online", label: "Online Donations", route: "/admin/donations?type=online", featureFlag: false },
          { id: "dn-offline", label: "Offline Donations", route: "/admin/donations?type=offline", featureFlag: false },
          { id: "dn-receipt", label: "Donation Receipts", route: "/admin/receipts" },
          { id: "dn-80g", label: "80G Receipts", route: "/admin/coming-soon?module=80G Receipts", featureFlag: false },
          { id: "dn-rep", label: "Donation Reports", route: "/admin/reports/donations" }
        ]
      },
      {
        id: "folder-fbank",
        module: "DONATIONS",
        label: "Bank & Payment",
        icon: Wallet,
        children: [
          { id: "bp-bank", label: "Bank Accounts", route: "/admin/coming-soon?module=Bank Accounts", featureFlag: false },
          { id: "bp-upi", label: "UPI QR Codes", route: "/admin/coming-soon?module=UPI QR Codes", featureFlag: false },
          { id: "bp-gw", label: "Payment Gateway", route: "/admin/coming-soon?module=Payment Gateway", featureFlag: false },
          { id: "bp-tx", label: "Payment Transactions", route: "/admin/coming-soon?module=Payment Transactions", featureFlag: false },
          { id: "bp-recon", label: "Payment Reconciliation", route: "/admin/coming-soon?module=Payment Reconciliation", featureFlag: false }
        ]
      },
      {
        id: "folder-fsponsor",
        module: "SPONSORS",
        label: "Sponsors",
        icon: Wallet,
        featureFlag: false,
        children: [
          { id: "sp-mgt", label: "Sponsor Management", route: "/admin/coming-soon?module=Sponsor Management" },
          { id: "sp-cat", label: "Sponsor Categories", route: "/admin/coming-soon?module=Sponsor Categories" },
          { id: "sp-pack", label: "Sponsorship Packages", route: "/admin/coming-soon?module=Sponsorship Packages" },
          { id: "sp-act", label: "Active Sponsors", route: "/admin/coming-soon?module=Active Sponsors" },
          { id: "sp-rep", label: "Sponsor Reports", route: "/admin/coming-soon?module=Sponsor Reports" }
        ]
      },
      {
        id: "folder-fads",
        module: "SPONSORS",
        label: "Advertisements",
        icon: Megaphone,
        children: [
          { id: "ad-mgt", label: "Advertisement Management", route: "/admin/ads" },
          { id: "ad-cat", label: "Advertisement Categories", route: "/admin/coming-soon?module=Ad Categories", featureFlag: false },
          { id: "ad-banner", label: "Banner Management", route: "/admin/banners" },
          { id: "ad-sched", label: "Campaign Schedule", route: "/admin/coming-soon?module=Campaign Schedule", featureFlag: false },
          { id: "ad-rep", label: "Advertisement Reports", route: "/admin/coming-soon?module=Ad Reports", featureFlag: false }
        ]
      },
      {
        id: "folder-foffers",
        module: "OFFERS",
        label: "Offers & Benefits",
        icon: Tag,
        children: [
          { id: "of-cat", label: "Offer Categories", route: "/admin/coming-soon?module=Offer Categories", featureFlag: false },
          { id: "of-mgt", label: "Offer Management", route: "/admin/offers" },
          { id: "of-coup", label: "Coupons", route: "/admin/coming-soon?module=Offer Coupons", featureFlag: false },
          { id: "of-partner", label: "Partner Businesses", route: "/admin/coming-soon?module=Partner Businesses", featureFlag: false },
          { id: "of-rep", label: "Offer Reports", route: "/admin/coming-soon?module=Offer Reports", featureFlag: false },
          { id: "of-an", label: "Offer Analytics", route: "/admin/coming-soon?module=Offer Analytics", featureFlag: false }
        ]
      },
      {
        id: "folder-freports",
        module: "REPORTS",
        label: "Reports",
        icon: TrendingUp,
        children: [
          { id: "fr-don", label: "Donation", route: "/admin/reports/donations" },
          { id: "fr-pay", label: "Payment", route: "/admin/coming-soon?module=Payment Reports", featureFlag: false },
          { id: "fr-spon", label: "Sponsor", route: "/admin/coming-soon?module=Sponsor Reports", featureFlag: false },
          { id: "fr-ad", label: "Advertisement", route: "/admin/coming-soon?module=Ad Reports", featureFlag: false },
          { id: "fr-sum", label: "Financial Summary", route: "/admin/coming-soon?module=Financial Summary", featureFlag: false }
        ]
      }
    ]
  },

  {
    id: "folder-opvis",
    module: "VISITORS",
    label: "Visitor Management",
    icon: ScanLine,
    children: [
      { id: "vi-in", label: "Visitor Entry", route: "/admin/visitors" },
      { id: "vi-out", label: "Visitor Exit", route: "/admin/coming-soon?module=Visitor Exit", featureFlag: false },
      { id: "vi-hist", label: "Visitor History", route: "/admin/coming-soon?module=Visitor History", featureFlag: false },
      { id: "vi-exp", label: "Expected Visitors", route: "/admin/coming-soon?module=Expected Visitors", featureFlag: false },
      { id: "vi-veh", label: "Vehicle Entry", route: "/admin/coming-soon?module=Vehicle Entry", featureFlag: false },
      { id: "vi-qr", label: "QR Check-In", route: "/admin/coming-soon?module=Visitor QR Check-In", featureFlag: false },
      { id: "vi-vip", label: "VIP Visitors", route: "/admin/coming-soon?module=VIP Visitors", featureFlag: false },
      { id: "vi-black", label: "Blacklisted Visitors", route: "/admin/coming-soon?module=Blacklisted Visitors", featureFlag: false },
      { id: "vi-rep", label: "Visitor Reports", route: "/admin/coming-soon?module=Visitor Reports", featureFlag: false }
    ]
  },

  {
    id: "group-reports",
    module: "REPORTS",
    label: "Reports & Analytics",
    icon: TrendingUp,
    route: "/admin/reports"
  },

  {
    id: "group-support",
    module: "SUPPORT_TICKETS",
    label: "Support",
    icon: LifeBuoy,
    children: [
      { id: "su-ticket", label: "Support Tickets", route: "/admin/support-tickets", icon: Ticket },
      { id: "su-feedback", label: "Feedback", route: "/admin/feedback", icon: MessageSquareWarning, featureFlag: true },
      { id: "su-incorrect", label: "Incorrect Information", route: "/admin/incorrect-reports", icon: AlertTriangle, featureFlag: true },
      { id: "su-contacts", label: "Contact Requests", route: "/admin/coming-soon?module=Contact Requests", featureFlag: false, icon: PhoneCall },
      { id: "su-kb", label: "Knowledge Base", route: "/admin/faq", icon: HelpCircle }
    ]
  },

  {
    id: "group-settings",
    module: "SETTINGS",
    label: "Settings",
    icon: Settings,
    children: [
      { id: "se-admin", label: "Admin Management", route: "/admin/admins", roles: ["SUPER_ADMIN"] },
      { id: "se-module-controller", module: "MODULE_CONTROLLER", label: "Module Controller", route: "/admin/module-controller", roles: ["SUPER_ADMIN", "TEMPLE_ADMIN", "DHARAMSHALA_ADMIN", "JAIN_CENTER_ADMIN", "BHOJANSHALA_ADMIN", "PATHSHALA_ADMIN", "ORG_ADMIN", "SUB_ADMIN", "STAFF"] },
      { id: "se-roles", label: "Roles & Permissions", route: "/admin/coming-soon?module=Roles & Permissions", roles: ["SUPER_ADMIN"], featureFlag: false },
      { id: "se-master", label: "Master Data", route: "/admin/master-data", roles: ["SUPER_ADMIN"] },
      { id: "se-notif", label: "Notification Center", route: "/admin/notifications/preferences", featureFlag: false },
      { id: "se-platform", label: "Settings", route: "/admin/settings", roles: ["SUPER_ADMIN", "TEMPLE_ADMIN", "DHARAMSHALA_ADMIN", "JAIN_CENTER_ADMIN", "BHOJANSHALA_ADMIN", "PATHSHALA_ADMIN", "ORG_ADMIN", "SUB_ADMIN", "STAFF", "MONK_ADMIN"] },
      { id: "se-payment", label: "Payment Settings", route: "/admin/coming-soon?module=Payment Settings", roles: ["SUPER_ADMIN"], featureFlag: false },
      { id: "se-security", label: "Security", route: "/admin/settings?tab=security", roles: ["SUPER_ADMIN"], featureFlag: false },
      { id: "se-sub", label: "Subscription", route: "/admin/subscription-plans", roles: ["SUPER_ADMIN"] }
    ]
  }
];
