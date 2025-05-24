// script.js - Logica principale della dashboard

// Variabile globale per il caching delle coordinate della città
window.globalCoordinates = null;

/**
 * Normalizza il nome della città per ottenere un identificatore univoco.
 * Esempio: "Roma" -> "roma", "Milano Centrale" -> "milano-centrale"
 */
function normalizeCityId(city) {
  return city.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Sostituisce i placeholder {{city}} e {{cityId}} nel markup con il nome reale e l'ID normalizzato.
 */
function substitutePlaceholders(html, city) {
  var cityId = normalizeCityId(city);
  return html.replace(/{{city}}/g, city).replace(/{{cityId}}/g, cityId);
}

/**
 * Esegue tutti gli script contenuti nel markup iniettato dinamicamente.
 */
function executeScripts(container) {
  var scripts = container.querySelectorAll("script");
  scripts.forEach(function(oldScript) {
    var newScript = document.createElement("script");
    if (oldScript.src) {
      newScript.src = oldScript.src;
    } else {
      newScript.text = oldScript.textContent;
    }
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

/**
 * Recupera le coordinate della città usando l'API di Nominatim.
 * Utilizza caching globale per evitare richieste ripetute.
 */
async function getCoordinates(city) {
  const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(city);
  const response = await fetch(url);
  if (!response.ok) throw new Error("HTTP error: " + response.status);
  const data = await response.json();
  if (data.length > 0) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }
  throw new Error("Coordinate non trovate.");
}

/**
 * Carica un modulo addon dalla cartella /addons/ e lo inietta nel container dei risultati.
 */
async function loadAndInjectAddon(addonKey, city) {
  const url = "addons/" + addonKey + ".html";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error: " + response.status);
    let html = await response.text();
    html = substitutePlaceholders(html, city);
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const container = document.getElementById("resultsContainer");
    while (tempDiv.firstChild) {
      container.appendChild(tempDiv.firstChild);
    }
    executeScripts(container);
  } catch (error) {
    console.error("Errore nel caricamento dell'addon " + addonKey + ": ", error);
  }
}

/**
 * Aggiorna il contenitore dei risultati in base al nome della città e agli addon selezionati.
 * Tenta di recuperare le coordinate una sola volta e di salvarle in window.globalCoordinates.
 */
async function updateResults(city) {
  const container = document.getElementById("resultsContainer");
  container.innerHTML = "";
  try {
    window.globalCoordinates = await getCoordinates(city);
    console.log("Coordinate globali ottenute:", window.globalCoordinates);
  } catch (e) {
    console.error("Errore nel recupero delle coordinate:", e.message);
    window.globalCoordinates = null;
  }
  const checkboxes = document.querySelectorAll(".addonCheckbox:checked");
  checkboxes.forEach(function(cb) {
    const addonKey = cb.value;
    loadAndInjectAddon(addonKey, city);
  });
}

/* Imposta gli event listener per i pulsanti */
document.getElementById("searchBtn").addEventListener("click", function() {
  const city = document.getElementById("cityInput").value.trim();
  if(city) updateResults(city);
});
document.getElementById("updateAddons").addEventListener("click", function() {
  const city = document.getElementById("cityInput").value.trim();
  if(city) updateResults(city);
});
window.addEventListener("load", function(){
  const city = document.getElementById("cityInput").value.trim();
  if(city) updateResults(city);
});
