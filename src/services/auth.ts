import { supabase } from "../lib/supabase";

export async function isUsernameAvailable(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("username", username);
  if (error) throw error;
  return (data?.length ?? 0) === 0;
}

export async function signUp(
  email: string,
  password: string,
  username: string
) {
  if (!username?.trim()) throw new Error("닉네임을 입력하세요");

  const ok = await isUsernameAvailable(username);
  if (!ok) throw new Error("이미 사용 중인 닉네임입니다");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) throw error;

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}
