const SR_CONFIG = {
  API_BASE: "https://saverip.com",
  SMARTLINK_URL_FALLBACK: "https://staturenonsense.com/ssq8r2ndv7?key=e29dad230b61757b08ed6c9881863549",
  UMAMI_URL: "https://analytics.saverip.com/api/send",
  UMAMI_WEBSITE_ID: "9743ec5e-647c-408b-b04e-b4e3cfa38940",
  STORAGE_KEYS: {
    ACCESS_TOKEN: "sr_accessToken",
    REFRESH_TOKEN: "sr_refreshToken",
    SITES_CACHE: "sr_sitesCache",
    SMARTLINK_CACHE: "sr_smartlinkCache",
    PENDING_HLS: "sr_pendingHls",
    PREFERRED_RES: "sr_preferredRes",
    DEVICE_ID: "sr_deviceId",
    WIDGET_COLLAPSED: "sr_widgetCollapsed"
  }
};

const SR_COPY = {
  en: {
    downloadBtn: "Download with SaveRip",
    resolving: "Resolving link…",
    quotaTitle: type => `Free ${type} limit reached`,
    quotaSub: timeStr => `Resets in ${timeStr}. Upgrade to Pro for unlimited downloads.`,
    upgradeBtn: "Upgrade to Pro",
    emailPlaceholder: "you@email.com",
    payCrypto: "Pay with crypto",
    payCard: "Pay with card",
    genericError: "Something went wrong. Try again.",
    needsRefresh: "Extension updated — refresh this page to continue.",
    notFound: "This video is unavailable or was removed.",
    galleryZip: "Downloading gallery as ZIP…",
    zipRequiresPro: "ZIP downloads for this site require Pro.",
    unsupported: "This page doesn't look like a supported video.",
    chooseQuality: "Choose quality",
    proTag: "PRO",
    resolutionLocked: "This quality requires Pro",
    perMonth: "/ month",
    proBenefits: [ "Unlimited downloads, no ads", "Original quality — up to 4K", "Choose your resolution every time", "Up to 50× faster downloads" ],
    phases: {
      starting: "Starting…",
      downloading: "Downloading…",
      processing: "Processing…",
      done: "Done"
    }
  },
  es: {
    downloadBtn: "Descargar con SaveRip",
    resolving: "Resolviendo enlace…",
    quotaTitle: type => `Límite free de ${type} alcanzado`,
    quotaSub: timeStr => `Se reinicia en ${timeStr}. Pasate a Pro para descargas ilimitadas.`,
    upgradeBtn: "Pasar a Pro",
    emailPlaceholder: "tu@email.com",
    payCrypto: "Pagar con cripto",
    payCard: "Pagar con tarjeta",
    genericError: "Algo salió mal. Probá de nuevo.",
    needsRefresh: "Extensión actualizada — recargá esta página para continuar.",
    notFound: "Este video no está disponible o fue eliminado.",
    galleryZip: "Descargando galería como ZIP…",
    zipRequiresPro: "Las descargas ZIP de este sitio requieren Pro.",
    unsupported: "Esta página no parece un video soportado.",
    chooseQuality: "Elegí la calidad",
    proTag: "PRO",
    resolutionLocked: "Esta calidad requiere Pro",
    perMonth: "/ mes",
    proBenefits: [ "Descargas ilimitadas, sin anuncios", "Calidad original — hasta 4K", "Elegí tu resolución siempre", "Hasta 50× más velocidad" ],
    phases: {
      starting: "Iniciando…",
      downloading: "Descargando…",
      processing: "Procesando…",
      done: "Listo"
    }
  },
  de: {
    downloadBtn: "Mit SaveRip herunterladen",
    resolving: "Link wird aufgelöst…",
    quotaTitle: type => `Kostenloses ${type}-Limit erreicht`,
    quotaSub: timeStr => `Setzt sich in ${timeStr} zurück. Upgrade auf Pro für unbegrenzte Downloads.`,
    upgradeBtn: "Auf Pro upgraden",
    emailPlaceholder: "du@email.com",
    payCrypto: "Mit Krypto bezahlen",
    payCard: "Mit Karte bezahlen",
    genericError: "Etwas ist schiefgelaufen. Versuch es erneut.",
    needsRefresh: "Erweiterung aktualisiert — lade diese Seite neu, um fortzufahren.",
    notFound: "Dieses Video ist nicht verfügbar oder wurde entfernt.",
    galleryZip: "Galerie wird als ZIP heruntergeladen…",
    zipRequiresPro: "ZIP-Downloads für diese Seite erfordern Pro.",
    unsupported: "Diese Seite sieht nicht wie ein unterstütztes Video aus.",
    chooseQuality: "Qualität wählen",
    proTag: "PRO",
    resolutionLocked: "Diese Qualität erfordert Pro",
    perMonth: "/ Monat",
    proBenefits: [ "Unbegrenzte Downloads, keine Werbung", "Originalqualität — bis zu 4K", "Wähle jedes Mal deine Auflösung", "Bis zu 50× schnellere Downloads" ],
    phases: {
      starting: "Wird gestartet…",
      downloading: "Wird heruntergeladen…",
      processing: "Wird verarbeitet…",
      done: "Fertig"
    }
  },
  fr: {
    downloadBtn: "Télécharger avec SaveRip",
    resolving: "Résolution du lien…",
    quotaTitle: type => `Limite gratuite de ${type} atteinte`,
    quotaSub: timeStr => `Réinitialisation dans ${timeStr}. Passez à Pro pour des téléchargements illimités.`,
    upgradeBtn: "Passer à Pro",
    emailPlaceholder: "vous@email.com",
    payCrypto: "Payer en crypto",
    payCard: "Payer par carte",
    genericError: "Une erreur s'est produite. Réessayez.",
    needsRefresh: "Extension mise à jour — actualisez cette page pour continuer.",
    notFound: "Cette vidéo n'est pas disponible ou a été supprimée.",
    galleryZip: "Téléchargement de la galerie en ZIP…",
    zipRequiresPro: "Les téléchargements ZIP pour ce site nécessitent Pro.",
    unsupported: "Cette page ne semble pas être une vidéo prise en charge.",
    chooseQuality: "Choisir la qualité",
    proTag: "PRO",
    resolutionLocked: "Cette qualité nécessite Pro",
    perMonth: "/ mois",
    proBenefits: [ "Téléchargements illimités, sans publicité", "Qualité d'origine — jusqu'à 4K", "Choisissez votre résolution à chaque fois", "Jusqu'à 50× plus rapide" ],
    phases: {
      starting: "Démarrage…",
      downloading: "Téléchargement…",
      processing: "Traitement…",
      done: "Terminé"
    }
  },
  pt: {
    downloadBtn: "Baixar com SaveRip",
    resolving: "Resolvendo link…",
    quotaTitle: type => `Limite gratuito de ${type} atingido`,
    quotaSub: timeStr => `Reinicia em ${timeStr}. Assine o Pro para downloads ilimitados.`,
    upgradeBtn: "Assinar Pro",
    emailPlaceholder: "voce@email.com",
    payCrypto: "Pagar com cripto",
    payCard: "Pagar com cartão",
    genericError: "Algo deu errado. Tente novamente.",
    needsRefresh: "Extensão atualizada — recarregue esta página para continuar.",
    notFound: "Este vídeo não está disponível ou foi removido.",
    galleryZip: "Baixando galeria como ZIP…",
    zipRequiresPro: "Downloads em ZIP deste site exigem Pro.",
    unsupported: "Esta página não parece ser um vídeo suportado.",
    chooseQuality: "Escolher qualidade",
    proTag: "PRO",
    resolutionLocked: "Esta qualidade exige Pro",
    perMonth: "/ mês",
    proBenefits: [ "Downloads ilimitados, sem anúncios", "Qualidade original — até 4K", "Escolha sua resolução sempre", "Até 50× mais rápido" ],
    phases: {
      starting: "Iniciando…",
      downloading: "Baixando…",
      processing: "Processando…",
      done: "Concluído"
    }
  }
};

function srLocale() {
  const lang = (navigator.language || "en").slice(0, 2).toLowerCase();
  return SR_COPY[lang] ? lang : "en";
}

function srT() {
  return SR_COPY[srLocale()];
}

async function srSendMessage(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    const invalidated = /context invalidated/i.test(err?.message || "");
    return {
      ok: false,
      error: invalidated ? "context_invalidated" : "message_failed"
    };
  }
}