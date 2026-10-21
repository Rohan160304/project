-- Schema repair: add columns that were added to schema.prisma without a migration file

-- users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP(3);

-- audit_logs table
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "diff" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- bhagwan_master table
ALTER TABLE "bhagwan_master" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Others';

-- buildings table
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "roomNumbers" JSONB;

-- rooms_and_halls table
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "roomNumber" TEXT;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "viewType" TEXT;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "bathroomType" TEXT;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "bedType" TEXT;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "extraMattressCount" INTEGER;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "extraMattressCharge" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "roomCount" INTEGER;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "chargesType" TEXT;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "deposit" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "rooms_and_halls" ADD COLUMN IF NOT EXISTS "attachedBathroom" TEXT;

-- organizations table
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "insideTempleType" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "upashrayLocation" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "eventHallPurpose" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "eventHallBookingLink" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "eventHallBookingItemId" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "sect" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subSect" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "gacchaName" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "preferredCurrency" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "morningStart" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "morningEnd" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "eveningStart" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "eveningEnd" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "pakshalStart" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "pakshalEnd" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "poojaStart" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "poojaEnd" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "aartiMorning" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "aartiEvening" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "dharamshalaRooms" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "dharamshalaOffice" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "dharamshalaPhone" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "dharamshalaContact" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "dharamshalaContactMemberId" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "dharamshalaOnline" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "receiptConfig" JSONB;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "pathshalaTimings" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "pathshalaDays" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "pathshalaTeacher" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "pathshalaTeacherMemberId" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaBreakfastCharge" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaBreakfastTiming" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaLunchCharge" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaLunchTiming" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaDinnerCharge" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaDinnerTiming" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaContact" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaContactMemberId" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaMealType" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bhojanshalaAvailability" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "bankBranch" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "landmark" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "railwayStation" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "hasTempleInside" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "templeMulNayakName" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "templeMulNayakImageUrl" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "templeTithiCalendar" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "templeOpeningHours" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "templePakshalStart" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "templePoojaStart" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "templeAartiEvening" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "checkInTime" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "checkOutTime" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "advanceBookingRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "onlineBookingAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "dharamshalaStatus" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "adminBlockedRooms" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "caretakerDetails" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "rulesText" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "primaryContactMemberId" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "secondaryContactMemberId" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "contactMobileVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "contactWhatsAppVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "contactEmailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "primaryContactPreference" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "donationQrCodeUrl" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "instaLink" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "facebookLink" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "youtubeLink" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "staffWorkingHoursStart" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "staffWorkingHoursEnd" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "staffLateArrivalAfter" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "staffEarlyExitBefore" TEXT;

-- members table
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "siblings" JSONB;

-- monk_profiles table
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "shortName" TEXT;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "nirvanaDate" TIMESTAMP(3);
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "nirvanaPlace" TEXT;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "preDikshaFather" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "preDikshaMother" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "siblings" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "preDikshaLocation" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "timeline" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "tapasya" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "tracking" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "chaturmasHistory" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "routine" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "languages" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "health" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "media" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "sanghContacts" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "recognitions" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "monk_profiles" ADD COLUMN IF NOT EXISTS "assignedAdminId" TEXT;

-- monk_groups table
ALTER TABLE "monk_groups" ADD COLUMN IF NOT EXISTS "groupNumber" TEXT;
ALTER TABLE "monk_groups" ADD COLUMN IF NOT EXISTS "jainMembers" JSONB;
ALTER TABLE "monk_groups" ADD COLUMN IF NOT EXISTS "nonJainMembers" JSONB;
ALTER TABLE "monk_groups" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- chaturmas_plans table
ALTER TABLE "chaturmas_plans" ADD COLUMN IF NOT EXISTS "monkIds" JSONB;
ALTER TABLE "chaturmas_plans" ADD COLUMN IF NOT EXISTS "sponsorIds" JSONB;
ALTER TABLE "chaturmas_plans" ADD COLUMN IF NOT EXISTS "images" JSONB;
ALTER TABLE "chaturmas_plans" ADD COLUMN IF NOT EXISTS "links" JSONB;
ALTER TABLE "chaturmas_plans" ADD COLUMN IF NOT EXISTS "year" INTEGER;

-- staff table
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "categorySpecify" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "departmentSpecify" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "designationSpecify" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "reportingTo" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "dob" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "permanentAddress" JSONB;

-- staff_attendance table
ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PRESENT';
ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "workingHours" DOUBLE PRECISION;

-- bookings table (stay management fields)
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "checkInTime" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "checkOutTime" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "allocatedRoomId" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "vehicleNumber" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "idProofType" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "idProofNumber" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "additionalGuests" INTEGER DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "additionalCharges" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "splitPayments" JSONB;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "stayNotes" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transferredFromRoomId" TEXT;

-- dhaja_records table
ALTER TABLE "dhaja_records" ADD COLUMN IF NOT EXISTS "dhajaOf" TEXT;

-- events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "sponsors" JSONB;

-- event_gallery_images table
ALTER TABLE "event_gallery_images" ADD COLUMN IF NOT EXISTS "albumName" TEXT;

-- event_video_links table
ALTER TABLE "event_video_links" ADD COLUMN IF NOT EXISTS "albumName" TEXT;
ALTER TABLE "event_video_links" ADD COLUMN IF NOT EXISTS "title" TEXT;

-- feed_posts table
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "shareCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "bookmarkCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "clickCount" INTEGER NOT NULL DEFAULT 0;

-- gallery_albums table
ALTER TABLE "gallery_albums" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- community_pages table
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "shortName" TEXT;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP(3);
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "orgType" TEXT;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "establishedYear" INTEGER;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "operatesFrom" TEXT;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "officeAddress" TEXT;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "googleFormName" TEXT;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "googleFormLink" TEXT;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "gallery" JSONB;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "communityVisibility" TEXT DEFAULT 'PUBLIC';
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "geoVisibility" TEXT DEFAULT 'Global';
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "geoCountry" TEXT;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "geoState" TEXT;
ALTER TABLE "community_pages" ADD COLUMN IF NOT EXISTS "geoCity" TEXT;

-- tours table
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "tourType" TEXT;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "dharamshalaId" TEXT;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "monkGroupName" TEXT;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "monkGroupLeader" TEXT;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "supportingMonks" JSONB;

-- tour_attendance table
ALTER TABLE "tour_attendance" ADD COLUMN IF NOT EXISTS "remarks" TEXT;

-- tour_participants table
ALTER TABLE "tour_participants" ADD COLUMN IF NOT EXISTS "medicalFormId" TEXT;

-- tour_room_change_logs table
ALTER TABLE "tour_room_change_logs" ADD COLUMN IF NOT EXISTS "reason" TEXT;

-- visitor_entries table
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "visitorAddress" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "visitorArea" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "visitorCity" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "visitorState" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "visitorPincode" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "numberOfVisitors" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "vehicleType" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "visitType" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "visitorCategory" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "visitDuration" INTEGER;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "deviceId" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "updatedById" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "offlineTempId" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "passengerMemberIds" TEXT;
ALTER TABLE "visitor_entries" ADD COLUMN IF NOT EXISTS "lastModifiedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- volunteer_opportunities table
ALTER TABLE "volunteer_opportunities" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3);
ALTER TABLE "volunteer_opportunities" ADD COLUMN IF NOT EXISTS "startTime" TEXT;
ALTER TABLE "volunteer_opportunities" ADD COLUMN IF NOT EXISTS "endTime" TEXT;
ALTER TABLE "volunteer_opportunities" ADD COLUMN IF NOT EXISTS "locationType" TEXT;
ALTER TABLE "volunteer_opportunities" ADD COLUMN IF NOT EXISTS "locationAddress" TEXT;
ALTER TABLE "volunteer_opportunities" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "volunteer_opportunities" ADD COLUMN IF NOT EXISTS "contactPersonId" TEXT;

-- Create missing tables
CREATE TABLE IF NOT EXISTS "event_feedbacks" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_feedbacks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "event_feedbacks_eventId_memberId_key" UNIQUE ("eventId", "memberId")
);

CREATE TABLE IF NOT EXISTS "event_audit_trails" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "actorName" TEXT,
    "actorRole" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_audit_trails_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "volunteer_role_requirements" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL,
    CONSTRAINT "volunteer_role_requirements_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys for new tables (IF NOT EXISTS equivalent via DO block)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_feedbacks_eventId_fkey') THEN
        ALTER TABLE "event_feedbacks" ADD CONSTRAINT "event_feedbacks_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_feedbacks_memberId_fkey') THEN
        ALTER TABLE "event_feedbacks" ADD CONSTRAINT "event_feedbacks_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_audit_trails_eventId_fkey') THEN
        ALTER TABLE "event_audit_trails" ADD CONSTRAINT "event_audit_trails_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'volunteer_role_requirements_opportunityId_fkey') THEN
        ALTER TABLE "volunteer_role_requirements" ADD CONSTRAINT "volunteer_role_requirements_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "volunteer_opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
