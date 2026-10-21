import { z } from "zod";
import { updateMemberProfileSchema } from "./src/modules/members/members.dto";

const payload = {
  firstName: "John",
  middleName: undefined,
  surname: "Doe",
  dob: null,
  gender: undefined,
  nationality: "Indian",
  preferredLanguage: "English",
  maritalStatus: undefined,
  currentAddress: { line1: "", area: "", city: "", district: "", state: "", country: "India", pincode: "" },
  permanentAddress: { line1: "", area: "", city: "", district: "", state: "", country: "India", pincode: "" },
  sameAsPermanent: false,
  isVolunteer: false,
  volunteerAreas: [],
};

const res = updateMemberProfileSchema.safeParse({ body: payload });
if (!res.success) {
  console.log(JSON.stringify(res.error.format(), null, 2));
} else {
  console.log("Success");
}
