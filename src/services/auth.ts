import { supabase } from "../lib/supabase";

export async function isUsernameAvailable(username: string) {
  const { error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("username", username);
  if (error) throw error;
  return (count ?? 0) === 0;
}

export function isEmailTakenError(err: any) {
  const msg = String(err?.message ?? "");
  const status = Number(err?.status ?? 0);
  const code = String(err?.code ?? "");

  return (
    status === 422 ||
    code === "user_already_exists" ||
    /already.*registered|already.*exists/i.test(msg)
  );
}

export async function signUp(
  email: string,
  password: string,
  username: string
) {
  if (!username?.trim()) throw new Error("닉네임을 입력하세요");

    const ok = await isUsernameAvailable(username);
  if (!ok) {
    const e: any = new Error("이미 사용 중인 닉네임입니다");
    e.code = "USERNAME_TAKEN";         
    throw e;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    if (isEmailTakenError(error)) {
      const e: any = new Error("이미 사용 중인 이메일입니다");
      e.code = "EMAIL_TAKEN";
      throw e;
    }
    throw error;
  }

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
