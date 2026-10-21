import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const member = await prisma.member.findFirst();
  if (!member) return;
  const token = jwt.sign({ sub: member.userId, type: 'ACCESS', publicId: member.publicId }, process.env.JWT_ACCESS_SECRET as string);

  const payload = {
    firstName: "Test",
    middleName: "Middle",
    surname: "Sur",
    gender: "Male",
    nationality: "India",
    preferredLanguage: "English",
    maritalStatus: "Single",
    motherTongue: "Hindi",
    tithiCalendarTypeId: "SomeCalendar",
    subCommunityId: "SomeCommunity",
    gacchaId: "SomeGaccha",
    whatsapp: "",
    email: "",
    preferredCommunicationMethod: "",
    alternateContact: "",
    currentAddress: { line1: "", area: "", city: "", district: "", state: "", country: "India", pincode: "" },
    permanentAddress: { line1: "", area: "", city: "", district: "", state: "", country: "India", pincode: "" },
    sameAsPermanent: false,
    bloodGroup: "",
    disability: "",
    medicalNotes: "",
    emergencyContact: { name: "", mobile: "", relation: "" },
    profession: "",
    isVolunteer: false,
    volunteerAreas: [],
    volunteerAvailability: ""
  };

  const res = await fetch('http://localhost:4000/api/v1/members/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  console.log("Status:", res.status);
  console.log(await res.text());
}
main();
