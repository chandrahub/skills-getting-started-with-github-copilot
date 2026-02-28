document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to unregister a participant and refresh UI
  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        // reload the activity list to reflect change
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
    } catch (err) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      console.error("Error unregistering participant:", err);
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants section with delete icons
        let participantsSection;
        if (details.participants.length) {
          const headerP = document.createElement("p");
          headerP.innerHTML = "<strong>Participants:</strong>";

          const list = document.createElement("ul");
          list.className = "participants-list";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.textContent = p;

            const removeBtn = document.createElement("span");
            removeBtn.className = "remove-participant";
            removeBtn.textContent = "×";
            removeBtn.title = "Remove participant";
            removeBtn.addEventListener("click", () => {
              unregisterParticipant(name, p);
            });

            li.appendChild(removeBtn);
            list.appendChild(li);
          });

          participantsSection = document.createElement("div");
          participantsSection.appendChild(headerP);
          participantsSection.appendChild(list);
        } else {
          const info = document.createElement("p");
          info.className = "info";
          info.innerHTML = "<em>No participants signed up yet.</em>";
          participantsSection = info;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;
        activityCard.appendChild(participantsSection);

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
        // refresh the list so the new participant appears immediately
        fetchActivities();
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
});
