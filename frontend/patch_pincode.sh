sed -i '' -e '151i\
  const handlePincodeChange = async (e) => {\
    const code = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);\
    setPincode(code);\
    if (code.length === 6 && country === "India") {\
      try {\
        const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);\
        const data = await res.json();\
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {\
          const po = data[0].PostOffice[0];\
          setCity(po.District || po.Region || city);\
          setState(po.State || state);\
        }\
      } catch (err) {}\
    }\
  };\
' src/pages/member/MemberRegisterPage.jsx

sed -i '' 's/onChange={(e) => setPincode(e.target.value.replace(\/[^0-9]\/g, '"'"''"'"').slice(0, 6))}/onChange={handlePincodeChange}/' src/pages/member/MemberRegisterPage.jsx
