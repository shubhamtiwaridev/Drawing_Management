import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

if (API_BASE) {
  axios.defaults.baseURL = API_BASE;
}

axios.defaults.withCredentials = true;

export default axios;
