document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants ? details.participants.length : 0);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Create participants container and render participants
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants";
        renderParticipants(participantsContainer, details.participants || []);
        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities to reflect new participant
        activitiesList.innerHTML = "<p>Loading activities...</p>";
        // small delay before refetch to allow server update
        setTimeout(fetchActivities, 300);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Helper: render participants into container
  function renderParticipants(container, participants) {
    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "participants-header";

    const title = document.createElement("h5");
    title.textContent = "Deelnemers";
    header.appendChild(title);

    const count = document.createElement("span");
    count.className = "participants-count";
    count.textContent = String((participants && participants.length) || 0);
    header.appendChild(count);

    container.appendChild(header);

    if (!participants || participants.length === 0) {
      const info = document.createElement("div");
      info.className = "info";
      info.textContent = "Nog geen deelnemers";
      container.appendChild(info);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "participants-list";

    participants.forEach(item => {
      const { name, status } = normalizeParticipant(item);

      const li = document.createElement("li");

      const avatar = document.createElement("span");
      avatar.className = "participant-avatar";
      avatar.textContent = initials(name);
      li.appendChild(avatar);

      const nameSpan = document.createElement("span");
      nameSpan.className = "participant-name";
      nameSpan.textContent = name;
      li.appendChild(nameSpan);

      const meta = document.createElement("span");
      meta.className = "participant-meta";
      meta.textContent = status || "";
      li.appendChild(meta);

      ul.appendChild(li);
    });

    container.appendChild(ul);
  }

  function normalizeParticipant(item) {
    if (!item) return { name: "Onbekend", status: "" };
    if (typeof item === "string") return { name: item, status: "" };
    return { name: item.name || item.email || "Deelnemer", status: item.status || "" };
  }

  function initials(fullName) {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }
});
