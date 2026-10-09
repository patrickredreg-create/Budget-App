// Service Worker: Er läuft im Hintergrund und speichert die App auf dem Gerät,
// damit sie auch ohne Internet startet.

// Wenn du etwas an der App änderst, zähle die Nummer hoch (v1 -> v2).
// Dann löscht der Browser den alten Speicher und lädt alles neu.
const NAME = "budget-v2";

// Diese Dateien werden bei der Installation gespeichert
const DATEIEN = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

// Installation: Dateien speichern
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(NAME).then(function (c) { return c.addAll(DATEIEN); }));
  self.skipWaiting();   // Die neue Version soll sofort starten
});

// Aktivierung: Speicher von alten Versionen löschen
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (namen) {
      return Promise.all(namen.filter(function (n) { return n !== NAME; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Jede Anfrage: Zuerst das Internet versuchen, damit man immer die neueste Version bekommt.
// Geht das nicht (offline), nehmen wir die gespeicherte Datei.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;

  // Nur unsere eigenen Dateien und die Schrift speichern.
  // Anfragen an Supabase (Konto und Daten) dürfen NIE gespeichert werden.
  let url = new URL(e.request.url);
  let eigene = url.origin === self.location.origin;
  let schrift = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!eigene && !schrift) return;
  e.respondWith(
    fetch(e.request).then(function (antwort) {
      let kopie = antwort.clone();
      caches.open(NAME).then(function (c) { c.put(e.request, kopie); });
      return antwort;
    }).catch(function () {
      return caches.match(e.request).then(function (gespeichert) {
        return gespeichert || caches.match("./index.html");
      });
    })
  );
});
