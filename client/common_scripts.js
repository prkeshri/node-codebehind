function __js(eventData) {
  return JSON.stringify(eventData);
}

function __updatePanel(hiddenId, target) {
  const eventData = JSON.parse(document.getElementById(hiddenId).value);
  const body = { __eventElement: eventData };
  document
    .getElementById(eventData.updatePanel)
    .querySelectorAll("input")
    .forEach((input) => {
      body[input.name] = input.value;
    });
  document
    .querySelectorAll(`input[for="${eventData.updatePanel}"]`)
    .forEach((elt) => {
      body[elt.name] = elt.value;
    });
  document
    .querySelectorAll(`[for="${eventData.updatePanel}"][show*="progress"]`)
    .forEach((elt) => {
      elt.style.display = "initial";
    });
  document
    .querySelectorAll(
      `[for="${eventData.updatePanel}"][show*="success"], [for="${eventData.updatePanel}"][show*="failure"], [for="${eventData.updatePanel}"][show*="initial"]`
    )
    .forEach((elt) => {
      elt.style.display = "none";
    });
  // AJAX request for UpdatePanel
  fetch(".", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then(async (result) => {
      document
        .querySelectorAll(`[for="${eventData.updatePanel}"][show*="progress"]`)
        .forEach((elt) => {
          elt.style.display = "none";
        });
      target.postclick?.(target, "success", result);
      if (result.success) {
        // Update only the specific panel
        const panel = document.getElementById(eventData.updatePanel);
        if (panel) {
          panel.innerHTML = result.html;
        }
        document
          .querySelectorAll(`[for="${eventData.updatePanel}"][show*="success"]`)
          .forEach((elt) => {
            elt.style.display = "initial";
          });
      } else {
        throw new Error(result.error);
      }
    })
    .catch((error) => {
      target.postclick?.(target, "error", error);
      console.error("UpdatePanel error:", error);
      document
        .querySelectorAll(
          `[for="${eventData.updatePanel}"][show*="progress"], [for="${eventData.updatePanel}"][show*="success"], [for="${eventData.updatePanel}"][show*="initial"]`
        )
        .forEach((elt) => {
          elt.style.display = "none";
        });
      document
        .querySelectorAll(`[for="${eventData.updatePanel}"][show*="failure"]`)
        .forEach((elt) => {
          elt.style.display = "initial";
        });
    });
  return false;
}

async function server_event(name, args) {
  const body = {
    __eventElement: {
      exec: name,
      args: args,
    },
  };
  try {
    const response = await fetch(".", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return await result;
  } catch (error) {
    console.error("Server event error:", error);
    throw error;
  }
}

function raiseServerEvent(self, name, event) {
  return clientEvents[name](self, event);
}
