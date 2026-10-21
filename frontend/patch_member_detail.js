const fs = require('fs');
let code = fs.readFileSync('src/pages/member/MemberBhojanshalaDetailPage.jsx', 'utf8');

// Add import
code = code.replace(
  'import { BhojanshalaBookingModal } from "@/components/modals/BhojanshalaBookingModal";',
  'import { BhojanshalaBookingModal } from "@/components/modals/BhojanshalaBookingModal";\nimport { MyBhojanshalaBookingsModal } from "@/components/modals/MyBhojanshalaBookingsModal";\nimport { Receipt } from "lucide-react";'
);

// Add state
code = code.replace(
  'const [bookModalOpen, setBookModalOpen] = useState(false);',
  'const [bookModalOpen, setBookModalOpen] = useState(false);\n  const [myBookingsOpen, setMyBookingsOpen] = useState(false);'
);

// Add button next to "Book Passes" or around it
const oldActions = `<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t sm:relative sm:border-0 sm:bg-transparent sm:p-0 z-20">
          <Button 
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl"
            onClick={() => setBookModalOpen(true)}
          >
            <Ticket className="w-4 h-4 mr-2" />
            {t("Book Passes")}
          </Button>
        </div>`;

const newActions = `<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t sm:relative sm:border-0 sm:bg-transparent sm:p-0 z-20 flex gap-2">
          <Button 
            variant="outline"
            className="w-14 h-12 rounded-xl shrink-0"
            onClick={() => setMyBookingsOpen(true)}
          >
            <Receipt className="w-5 h-5 text-slate-600" />
          </Button>
          <Button 
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl flex-1"
            onClick={() => setBookModalOpen(true)}
          >
            <Ticket className="w-4 h-4 mr-2" />
            {t("Book Passes")}
          </Button>
        </div>`;

code = code.replace(oldActions, newActions);

// Add modal
code = code.replace(
  '<BhojanshalaBookingModal ',
  '<MyBhojanshalaBookingsModal open={myBookingsOpen} onClose={() => setMyBookingsOpen(false)} />\n      <BhojanshalaBookingModal '
);

fs.writeFileSync('src/pages/member/MemberBhojanshalaDetailPage.jsx', code);
