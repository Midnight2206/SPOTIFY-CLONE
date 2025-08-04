export default function validateInput(input) {
  const value = input.value.trim();
  const formGroup = input.closest(".form-group");
  if (!formGroup) return;
  const errorEl = formGroup.querySelector(".error-message span");
  if (!errorEl) return;

  let errorMessage = "";

  if (input.dataset.required && !value) {
    errorMessage = "This field is required";
  }

  if (!errorMessage && input.dataset.type === "email") {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!isValid) {
      errorMessage = "Please enter a valid email address";
    }
  }

  if (!errorMessage && input.dataset.type === "password") {
    const hasRequiredPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(value);
    const minLength = Number(input.dataset.minLength) || 8;

    if (!hasRequiredPattern || value.length < minLength) {
      errorMessage = `Password must be at least ${minLength} characters long and contain at least one uppercase letter, one lowercase letter, and one number.`;
    }
  }

  if (errorMessage) {
    formGroup.classList.add("invalid");
    errorEl.textContent = errorMessage;
  } else {
    formGroup.classList.remove("invalid");
    errorEl.textContent = "";
  }
}
