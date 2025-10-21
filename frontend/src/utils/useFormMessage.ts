import { useState } from "react";

export function useFormMessage() {
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const resetMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  return {
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    resetMessages,
  };
}
