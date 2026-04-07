const { parseDocument } = require("./aiParser");

const text = `
EUROPOS BENDRIJA
LIETUVOS RESPUBLIKA
LIETUVOS TRANSPORTO SAUGOS ADMINISTRACIJA
LICENCIJA Nr. wucoomsssxx
išduota tarptautiniam krovinių vežimui keliais už atlygį
305653321 MB Tralveža
Marijampolės sav., Marijampolės sen., Vidgirių k., Vinco Žilionio g. 3
Ši licencija galioja nuo 2021-03-05 Iki 2031-03-05
Išdavimo vieta Kaunas Data 2021-03-05
`;

(async () => {
  try {
    const result = await parseDocument(text);
    console.log("AI TEST RESULT:");
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("AI TEST ERROR:");
    console.error(e);
  }
})();
