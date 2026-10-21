import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const member = await prisma.member.findFirst({
    include: {
      privacySetting: true,
      familyAsPrimary: true
    }
  });
  if (!member) return;
  const token = jwt.sign({ sub: member.userId, type: 'ACCESS', publicId: member.publicId }, process.env.JWT_ACCESS_SECRET as string);
  
  // mock the frontend EXACTLY
  let form: any = {
    firstName: member.firstName || "",
    middleName: member.middleName || "",
    surname: member.surname || "",
    dob: member.dob ? member.dob.toISOString().split("T")[0] : "",
    gender: member.gender || "",
    nationality: member.nationality || "India",
    preferredLanguage: member.preferredLanguage || "English",
    pan: member.panEncrypted || "", // frontend gets null usually
    aadhaar: member.aadhaarHash || "", 
    maritalStatus: member.maritalStatus || "",
    sect: (member as any).sect || "",
    subCommunity: member.subCommunityId || "", // actually form.subCommunity
    otherSubCommunity: "",
    gaccha: member.gacchaId || "",
    tithiCalendar: member.tithiCalendarTypeId || "",
    motherTongue: member.motherTongue || "",
    mobile: member.mobile || "",
    whatsapp: member.whatsapp || "",
    email: member.email || "",
    preferredCommunicationMethod: member.preferredCommunicationMethod || "",
    alternateContact: member.alternateContact || "",
    currentAddress: member.addresses ? (member.addresses as any) : { line1: "", area: "", city: "", district: "", state: "", country: "India", pincode: "" },
    permanentAddress: { line1: "", area: "", city: "", district: "", state: "", country: "India", pincode: "" },
    sameAsPermanent: false,
    nativeVillage: member.nativeVillage || "",
    currentLat: member.currentLat || "",
    currentLng: member.currentLng || "",
    bloodGroup: member.bloodGroup || "",
    disability: member.disability || "",
    medicalNotes: member.medicalNotes || "",
    emergencyContact: member.emergencyContact || { name: "", mobile: "", relation: "" },
    profession: member.profession || "",
    isVolunteer: member.isVolunteer || false,
    volunteerAreas: member.volunteerAreas || [],
    volunteerAvailability: member.volunteerAvailability || "",
    preferredTempleIds: [],
    consents: [],
    siblings: member.siblings || [],
  };

  // Now the useEffect overwrites form with `...member`!
  form = {
    ...form,
    ...member,
    dob: member.dob ? member.dob.toISOString().split("T")[0] : "",
    tithiCalendar: member.tithiCalendarTypeId || "",
    currentAddress: (member as any).currentAddress || { line1: "" },
    permanentAddress: (member as any).permanentAddress || { line1: "" },
    emergencyContact: member.emergencyContact || { name: "", mobile: "", relation: "" },
  };

  const payload = {
    ...form,
    dob: form.dob ? new Date(form.dob).toISOString() : null,
    communityId: form.community === "Other" ? form.otherCommunity : form.community,
    subCommunityId: form.subCommunity === "Other" ? form.otherSubCommunity : form.subCommunity,
    gacchaId: form.gaccha === "Other" ? form.otherGaccha : form.gaccha,
    tithiCalendarTypeId: form.tithiCalendar || null,
    sameAsPermanent: form.sameAsPermanent,
    currentAddress: { ...form.currentAddress },
    permanentAddress: { ...form.permanentAddress },
    emergencyContact: { ...form.emergencyContact },
    isVolunteer: form.isVolunteer,
    volunteerAreas: Array.isArray(form.volunteerAreas) ? form.volunteerAreas : [],
  };

  if (payload.dob === null) delete payload.dob;
  if (!payload.pan) delete payload.pan;
  if (!payload.aadhaar) delete payload.aadhaar;

  const res = await fetch('http://localhost:4000/api/v1/members/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  console.log(res.status);
  console.log(await res.text());
}
main();
