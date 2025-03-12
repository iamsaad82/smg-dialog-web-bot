(function() {
  // Konfiguration aus Script-Attributen auslesen
  const script = document.currentScript;
  const apiKey = script.getAttribute("data-api-key");
  const tenantId = script.getAttribute("data-tenant-id");
  const mode = script.getAttribute("data-mode") || "classic";
  const containerId = script.getAttribute("data-container-id");
  const botName = script.getAttribute("data-bot-name") || "Support Bot";
  const primaryColor = script.getAttribute("data-primary-color") || "#4f46e5";
  const secondaryColor = script.getAttribute("data-secondary-color") || "#ffffff";
  
  // Basis-URL für die Einbettung
  const baseUrl = script.src.split('/embed.js')[0];
  
  // Fehlerprüfung
  if (!apiKey && !tenantId) {
    console.error("KI-Bot: API-Key oder Tenant-ID fehlt. Bitte 'data-api-key' oder 'data-tenant-id' Attribut setzen.");
    return;
  }
  
  if (mode === "inline" && !containerId) {
    console.error("KI-Bot: Container-ID fehlt im Inline-Modus. Bitte 'data-container-id' Attribut setzen.");
    return;
  }
  
  // Bot in die Seite einbetten
  function loadBot() {
    // iFrame erstellen
    const iframe = document.createElement("iframe");
    iframe.style.border = "none";
    
    // Stil je nach Modus anpassen
    if (mode === "classic") {
      iframe.style.width = "350px";
      iframe.style.height = "500px";
      iframe.style.borderRadius = "12px";
      iframe.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    } else if (mode === "inline") {
      iframe.style.width = "100%";
      iframe.style.height = "600px";
      iframe.style.borderRadius = "12px";
      iframe.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    } else if (mode === "fullscreen") {
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.position = "fixed";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.zIndex = "9999";
      iframe.style.backgroundColor = "#ffffff";
    }
    
    // iFrame-URL mit API-Key oder Tenant-ID
    let embedUrl = `${baseUrl}/embed/${mode}?`;
    if (apiKey) {
      embedUrl += `api_key=${encodeURIComponent(apiKey)}`;
    } else if (tenantId) {
      embedUrl += `tenant_id=${encodeURIComponent(tenantId)}`;
    }
    
    // Weitere Parameter hinzufügen
    if (botName) embedUrl += `&bot_name=${encodeURIComponent(botName)}`;
    if (primaryColor) embedUrl += `&primary_color=${encodeURIComponent(primaryColor)}`;
    if (secondaryColor) embedUrl += `&secondary_color=${encodeURIComponent(secondaryColor)}`;
    
    iframe.src = embedUrl;
    
    if (mode === "inline") {
      // Im inline-Modus: In angegebenen Container einfügen
      const container = document.getElementById(containerId);
      if (container) {
        container.appendChild(iframe);
      } else {
        console.error(`KI-Bot: Container mit ID "${containerId}" nicht gefunden.`);
      }
    } else if (mode === "fullscreen") {
      // Im fullscreen-Modus: Direkt in den Body einfügen
      document.body.appendChild(iframe);
      
      // Event-Listener, um auf Botschaft aus dem iFrame zu hören (für Schließen)
      window.addEventListener("message", function(event) {
        if (event.data === "ki-bot-close") {
          iframe.style.display = "none";
        }
      });
    } else {
      // Im classic-Modus: Schwebendes Widget erstellen
      const wrapper = document.createElement("div");
      wrapper.setAttribute("id", "ki-bot-wrapper");
      wrapper.style.position = "fixed";
      wrapper.style.bottom = "20px";
      wrapper.style.right = "20px";
      wrapper.style.zIndex = "9999";
      wrapper.style.display = "none"; // Standardmäßig ausgeblendet
      
      // Chat-Button erstellen
      const button = document.createElement("button");
      button.setAttribute("id", "ki-bot-button");
      button.style.width = "60px";
      button.style.height = "60px";
      button.style.borderRadius = "50%";
      button.style.backgroundColor = primaryColor;
      button.style.color = "white";
      button.style.border = "none";
      button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      button.style.cursor = "pointer";
      button.style.position = "fixed";
      button.style.bottom = "20px";
      button.style.right = "20px";
      button.style.zIndex = "9999";
      button.style.display = "flex";
      button.style.justifyContent = "center";
      button.style.alignItems = "center";
      button.style.fontSize = "24px";
      button.innerHTML = "💬";
      
      // Klick-Handler für Button
      button.addEventListener("click", function() {
        if (wrapper.style.display === "none") {
          wrapper.style.display = "block";
          button.style.display = "none";
        }
      });
      
      // Schließen-Button im iFrame wird von der Embed-Seite selbst verwaltet
      
      wrapper.appendChild(iframe);
      document.body.appendChild(wrapper);
      document.body.appendChild(button);
      
      // Event-Listener, um auf Botschaft aus dem iFrame zu hören (für Schließen)
      window.addEventListener("message", function(event) {
        if (event.data === "ki-bot-close") {
          wrapper.style.display = "none";
          button.style.display = "flex";
        }
      });
    }
  }
  
  // Bot laden, wenn DOM bereit ist
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadBot);
  } else {
    loadBot();
  }
})(); 