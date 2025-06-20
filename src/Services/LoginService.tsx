import { baseURLLogin } from "../config";
export async function loginService(credentials: { email: string; password: string }) {
  const res = await fetch(`${baseURLLogin}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return await res.json();
}