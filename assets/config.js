/* Veřejné nastavení webu. Nejsou zde žádná tajemství — jen adresy a ID, která jsou
   z principu viditelná v prohlížeči. Prázdná hodnota = funkce je vypnutá.
   Postup nastavení: docs/NASTAVENI.md */
window.CM_CONFIG = {
  /* ID měření GA4, např. "G-XXXXXXXXXX". Prázdné = žádné měření a žádná lišta souhlasu. */
  ga4Id: "",

  /* URL webhooku v Make, který ověřuje přístup (scénář „Ověření přístupu“). */
  accessEndpoint: "",

  /* Adresa produktu „Odvážně 18+“ v SimpleShopu (objednávkový formulář). */
  shopUrl: "",

  /* Identifikátor produktu pro ověření. Musí odpovídat ID produktu v Make. */
  productId: "odvazne-18",

  /* Jak často se přístup při připojení znovu ověří a jak dlouho smí hra běžet bez ověření.
     Delší doba šetří operace v Make (bezplatný tarif), kratší rychleji vypne vrácenou objednávku. */
  recheckDays: 14,
  offlineGraceDays: 30
};
