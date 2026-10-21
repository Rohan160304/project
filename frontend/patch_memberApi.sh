sed -i '' -e '/export const memberAuthApi = {/i\
export const memberProfileApi = {\
  async updateMyProfile(payload) {\
    return unwrap(await api.patch("/me", payload));\
  }\
};\
' src/lib/memberApi.js
