// utils/handleApiError.ts
import axios from "axios";

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  } else if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Try again.";
}

export default handleApiError;
