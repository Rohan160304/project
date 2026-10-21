import React from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const COUNTRY_CODES = [
  // Priority (Jain diaspora hotspots first)
  { value: "+91",  label: "🇮🇳 India (+91)" },
  { value: "+1",   label: "🇺🇸 USA / Canada (+1)" },
  { value: "+44",  label: "🇬🇧 United Kingdom (+44)" },
  { value: "+971", label: "🇦🇪 UAE (+971)" },
  { value: "+61",  label: "🇦🇺 Australia (+61)" },
  { value: "+65",  label: "🇸🇬 Singapore (+65)" },
  { value: "+254", label: "🇰🇪 Kenya (+254)" },
  { value: "+27",  label: "🇿🇦 South Africa (+27)" },
  // Rest, alphabetical by country name
  { value: "+93",  label: "🇦🇫 Afghanistan (+93)" },
  { value: "+355", label: "🇦🇱 Albania (+355)" },
  { value: "+213", label: "🇩🇿 Algeria (+213)" },
  { value: "+376", label: "🇦🇩 Andorra (+376)" },
  { value: "+244", label: "🇦🇴 Angola (+244)" },
  { value: "+54",  label: "🇦🇷 Argentina (+54)" },
  { value: "+374", label: "🇦🇲 Armenia (+374)" },
  { value: "+43",  label: "🇦🇹 Austria (+43)" },
  { value: "+994", label: "🇦🇿 Azerbaijan (+994)" },
  { value: "+973", label: "🇧🇭 Bahrain (+973)" },
  { value: "+880", label: "🇧🇩 Bangladesh (+880)" },
  { value: "+375", label: "🇧🇾 Belarus (+375)" },
  { value: "+32",  label: "🇧🇪 Belgium (+32)" },
  { value: "+975", label: "🇧🇹 Bhutan (+975)" },
  { value: "+591", label: "🇧🇴 Bolivia (+591)" },
  { value: "+55",  label: "🇧🇷 Brazil (+55)" },
  { value: "+673", label: "🇧🇳 Brunei (+673)" },
  { value: "+359", label: "🇧🇬 Bulgaria (+359)" },
  { value: "+855", label: "🇰🇭 Cambodia (+855)" },
  { value: "+237", label: "🇨🇲 Cameroon (+237)" },
  { value: "+56",  label: "🇨🇱 Chile (+56)" },
  { value: "+86",  label: "🇨🇳 China (+86)" },
  { value: "+57",  label: "🇨🇴 Colombia (+57)" },
  { value: "+506", label: "🇨🇷 Costa Rica (+506)" },
  { value: "+385", label: "🇭🇷 Croatia (+385)" },
  { value: "+53",  label: "🇨🇺 Cuba (+53)" },
  { value: "+357", label: "🇨🇾 Cyprus (+357)" },
  { value: "+420", label: "🇨🇿 Czechia (+420)" },
  { value: "+45",  label: "🇩🇰 Denmark (+45)" },
  { value: "+593", label: "🇪🇨 Ecuador (+593)" },
  { value: "+20",  label: "🇪🇬 Egypt (+20)" },
  { value: "+503", label: "🇸🇻 El Salvador (+503)" },
  { value: "+372", label: "🇪🇪 Estonia (+372)" },
  { value: "+251", label: "🇪🇹 Ethiopia (+251)" },
  { value: "+679", label: "🇫🇯 Fiji (+679)" },
  { value: "+358", label: "🇫🇮 Finland (+358)" },
  { value: "+33",  label: "🇫🇷 France (+33)" },
  { value: "+995", label: "🇬🇪 Georgia (+995)" },
  { value: "+49",  label: "🇩🇪 Germany (+49)" },
  { value: "+233", label: "🇬🇭 Ghana (+233)" },
  { value: "+30",  label: "🇬🇷 Greece (+30)" },
  { value: "+502", label: "🇬🇹 Guatemala (+502)" },
  { value: "+852", label: "🇭🇰 Hong Kong (+852)" },
  { value: "+36",  label: "🇭🇺 Hungary (+36)" },
  { value: "+354", label: "🇮🇸 Iceland (+354)" },
  { value: "+62",  label: "🇮🇩 Indonesia (+62)" },
  { value: "+98",  label: "🇮🇷 Iran (+98)" },
  { value: "+964", label: "🇮🇶 Iraq (+964)" },
  { value: "+353", label: "🇮🇪 Ireland (+353)" },
  { value: "+972", label: "🇮🇱 Israel (+972)" },
  { value: "+39",  label: "🇮🇹 Italy (+39)" },
  { value: "+225", label: "🇨🇮 Ivory Coast (+225)" },
  { value: "+81",  label: "🇯🇵 Japan (+81)" },
  { value: "+962", label: "🇯🇴 Jordan (+962)" },
  { value: "+7",   label: "🇰🇿 Kazakhstan (+7)" },
  { value: "+965", label: "🇰🇼 Kuwait (+965)" },
  { value: "+996", label: "🇰🇬 Kyrgyzstan (+996)" },
  { value: "+856", label: "🇱🇦 Laos (+856)" },
  { value: "+371", label: "🇱🇻 Latvia (+371)" },
  { value: "+961", label: "🇱🇧 Lebanon (+961)" },
  { value: "+218", label: "🇱🇾 Libya (+218)" },
  { value: "+370", label: "🇱🇹 Lithuania (+370)" },
  { value: "+352", label: "🇱🇺 Luxembourg (+352)" },
  { value: "+853", label: "🇲🇴 Macau (+853)" },
  { value: "+60",  label: "🇲🇾 Malaysia (+60)" },
  { value: "+960", label: "🇲🇻 Maldives (+960)" },
  { value: "+356", label: "🇲🇹 Malta (+356)" },
  { value: "+230", label: "🇲🇺 Mauritius (+230)" },
  { value: "+52",  label: "🇲🇽 Mexico (+52)" },
  { value: "+373", label: "🇲🇩 Moldova (+373)" },
  { value: "+377", label: "🇲🇨 Monaco (+377)" },
  { value: "+976", label: "🇲🇳 Mongolia (+976)" },
  { value: "+382", label: "🇲🇪 Montenegro (+382)" },
  { value: "+212", label: "🇲🇦 Morocco (+212)" },
  { value: "+95",  label: "🇲🇲 Myanmar (+95)" },
  { value: "+977", label: "🇳🇵 Nepal (+977)" },
  { value: "+31",  label: "🇳🇱 Netherlands (+31)" },
  { value: "+64",  label: "🇳🇿 New Zealand (+64)" },
  { value: "+234", label: "🇳🇬 Nigeria (+234)" },
  { value: "+47",  label: "🇳🇴 Norway (+47)" },
  { value: "+968", label: "🇴🇲 Oman (+968)" },
  { value: "+92",  label: "🇵🇰 Pakistan (+92)" },
  { value: "+970", label: "🇵🇸 Palestine (+970)" },
  { value: "+507", label: "🇵🇦 Panama (+507)" },
  { value: "+51",  label: "🇵🇪 Peru (+51)" },
  { value: "+63",  label: "🇵🇭 Philippines (+63)" },
  { value: "+48",  label: "🇵🇱 Poland (+48)" },
  { value: "+351", label: "🇵🇹 Portugal (+351)" },
  { value: "+974", label: "🇶🇦 Qatar (+974)" },
  { value: "+40",  label: "🇷🇴 Romania (+40)" },
  { value: "+7",   label: "🇷🇺 Russia (+7)" },
  { value: "+250", label: "🇷🇼 Rwanda (+250)" },
  { value: "+966", label: "🇸🇦 Saudi Arabia (+966)" },
  { value: "+221", label: "🇸🇳 Senegal (+221)" },
  { value: "+381", label: "🇷🇸 Serbia (+381)" },
  { value: "+248", label: "🇸🇨 Seychelles (+248)" },
  { value: "+421", label: "🇸🇰 Slovakia (+421)" },
  { value: "+386", label: "🇸🇮 Slovenia (+386)" },
  { value: "+82",  label: "🇰🇷 South Korea (+82)" },
  { value: "+34",  label: "🇪🇸 Spain (+34)" },
  { value: "+94",  label: "🇱🇰 Sri Lanka (+94)" },
  { value: "+249", label: "🇸🇩 Sudan (+249)" },
  { value: "+46",  label: "🇸🇪 Sweden (+46)" },
  { value: "+41",  label: "🇨🇭 Switzerland (+41)" },
  { value: "+963", label: "🇸🇾 Syria (+963)" },
  { value: "+886", label: "🇹🇼 Taiwan (+886)" },
  { value: "+992", label: "🇹🇯 Tajikistan (+992)" },
  { value: "+255", label: "🇹🇿 Tanzania (+255)" },
  { value: "+66",  label: "🇹🇭 Thailand (+66)" },
  { value: "+216", label: "🇹🇳 Tunisia (+216)" },
  { value: "+90",  label: "🇹🇷 Turkey (+90)" },
  { value: "+993", label: "🇹🇲 Turkmenistan (+993)" },
  { value: "+256", label: "🇺🇬 Uganda (+256)" },
  { value: "+380", label: "🇺🇦 Ukraine (+380)" },
  { value: "+598", label: "🇺🇾 Uruguay (+598)" },
  { value: "+998", label: "🇺🇿 Uzbekistan (+998)" },
  { value: "+58",  label: "🇻🇪 Venezuela (+58)" },
  { value: "+84",  label: "🇻🇳 Vietnam (+84)" },
  { value: "+967", label: "🇾🇪 Yemen (+967)" },
  { value: "+260", label: "🇿🇲 Zambia (+260)" },
  { value: "+263", label: "🇿🇼 Zimbabwe (+263)" },
];

const MAX_LENGTHS = {
  "+91": 10, // India
  "+1": 10,  // USA/Canada
  "+44": 10, // UK
  "+61": 9,  // Australia
  "+65": 8,  // Singapore
  "+971": 9, // UAE
  "+254": 9, // Kenya
  "+27": 9,  // South Africa
};

/**
 * PhoneInput — Reusable Mobile Input with Country Code Selector (+XX)
 */
export default function PhoneInput({
  countryCode = "+91",
  onCountryCodeChange,
  value = "",
  onChange,
  placeholder = "Mobile Number",
  disabled = false,
  className = "",
  id,
  required = false,
}) {
  const currentMaxLength = MAX_LENGTHS[countryCode] || 15;

  const handleInputChange = (e) => {
    // Only allow digits in the national number part
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (digitsOnly.length <= currentMaxLength) {
      // Create a synthetic event to pass to onChange
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: digitsOnly },
      };
      onChange?.(syntheticEvent);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-36 shrink-0">
        <SearchableSelect
          options={COUNTRY_CODES}
          value={countryCode}
          onValueChange={onCountryCodeChange}
          placeholder="+XX"
          disabled={disabled}
        />
      </div>
      <Input
        id={id}
        type="tel"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={currentMaxLength}
        required={required}
        className="flex-1 font-mono font-medium"
      />
    </div>
  );
}

/* ─── Single-string variant ──────────────────────────────────────────────────
 * Forms across the app store one field (`mobile: "+919876543210"`), so a
 * two-field component can't drop in without reshaping every form's state.
 * PhoneField keeps that single E.164 string as its value while still giving
 * the user a searchable +XX selector — making it a one-line swap for a bare
 * <Input>, and keeping the payload sent to the API identical.
 * ------------------------------------------------------------------------ */

/** Longest dial codes first so "+971" wins over "+97"/"+9". */
const DIAL_CODES = [...COUNTRY_CODES]
  .map((c) => c.value)
  .sort((a, b) => b.length - a.length);

/** Split "+919876543210" into ["+91", "9876543210"]. */
export function splitPhone(raw, fallbackCode = "+91") {
  const s = String(raw || "").replace(/[\s()-]/g, "");
  if (!s) return [fallbackCode, ""];
  if (!s.startsWith("+")) {
    // Bare national number, or a legacy value stored without the "+".
    const hit = DIAL_CODES.find((d) => s.startsWith(d.slice(1)) && s.length > d.length - 1);
    if (hit && s.length > 10) return [hit, s.slice(hit.length - 1)];
    return [fallbackCode, s];
  }
  const code = DIAL_CODES.find((d) => s.startsWith(d));
  return code ? [code, s.slice(code.length)] : [fallbackCode, s.replace(/^\+/, "")];
}

/** Recombine into the E.164 string the API expects.
 *  Preserves the selected country code even when the national number is
 *  empty — otherwise switching the country code in an empty field would
 *  silently reset back to the default (+91) after splitPhone re-parses it.
 */
export function joinPhone(code, national) {
  const n = String(national || "").replace(/\D/g, "");
  return n ? `${code}${n}` : code;
}

/**
 * Drop-in replacement for a bare mobile <Input>.
 *
 *   <PhoneField value={form.mobile} onChange={(v) => setForm({...form, mobile: v})} />
 *
 * `onChange` receives the combined string, not an event.
 */
export function PhoneField({
  value,
  onChange,
  placeholder = "Mobile Number",
  disabled = false,
  className = "",
  id,
  defaultCountryCode = "+91",
  required = false,
}) {
  const [code, national] = splitPhone(value, defaultCountryCode);
  return (
    <PhoneInput
      id={id}
      className={className}
      disabled={disabled}
      countryCode={code}
      onCountryCodeChange={(c) => onChange?.(joinPhone(c, national))}
      value={national}
      onChange={(e) => onChange?.(joinPhone(code, e.target.value))}
      placeholder={placeholder}
      required={required}
    />
  );
}
