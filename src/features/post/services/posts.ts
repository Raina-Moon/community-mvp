import { toComment, toPostBase, toUser } from "../../../lib/mappers";
import { supabase } from "../../../lib/supabase";
import type { Comment as CommentType } from "../../../types/comment";
import { Post } from "../../../types/post";

type UploadPart = { name: string; type: string; buffer: ArrayBuffer };

export async function listPostsSimple(page = 1, size = 10): Promise<Post[]> {
  const from = (page - 1) * size;
  const to = from + size - 1;

  const { data: rows, error } = await supabase
    .from("posts")
    .select("id,title,content,author_id,created_at,updated_at")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  if (!rows?.length) return [];

  const bases = rows.map((r) => toPostBase(r));

  const postIds = bases.map((b) => b.id);
  const { data: imgs } = await supabase
    .from("post_images")
    .select("post_id,path,created_at,sort")
    .in("post_id", postIds);

  const latestPathByPost = new Map<string, string>();
  (imgs ?? [])
    .sort(
      (a, b) =>
        (a.sort ?? 1e9) - (b.sort ?? 1e9) ||
        (a.created_at ?? "").localeCompare(b.created_at ?? "")
    )
    .forEach((row) => {
      if (!latestPathByPost.has(row.post_id))
        latestPathByPost.set(row.post_id, row.path);
    });

  const authorIds = Array.from(new Set(bases.map((b) => b.authorId)));
  const { data: authors } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,created_at")
    .in("id", authorIds);
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  return bases.map((base) => {
    const path = latestPathByPost.get(base.id);
    const firstUrl = path
      ? supabase.storage.from("post_images").getPublicUrl(path).data.publicUrl
      : undefined;
    const author = authorMap.get(base.authorId);

    const post: Post = {
      ...base,
      author: author ? toUser(author) : undefined,
      imageUrls: firstUrl ? [firstUrl] : [],
      comments: [],
    };
    return post;
  });
}

export async function getPostSimple(id: string): Promise<Post> {
  // ✅ snake_case로
  const { data: row, error } = await supabase
    .from("posts")
    .select("id,title,content,author_id,created_at,updated_at")
    .eq("id", id)
    .single();
  if (error || !row) throw error ?? new Error("Not found");

  const base = toPostBase(row);

  const { data: images } = await supabase
    .from("post_images")
    .select("path,created_at")
    .eq("post_id", id)
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });

  const imageUrls =
    images?.map(
      (i) =>
        supabase.storage.from("post_images").getPublicUrl(i.path).data.publicUrl
    ) ?? [];

  const { data: author } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,created_at")
    .eq("id", base.authorId)
    .single();

  const { data: commentsRows } = await supabase
    .from("comments")
    .select("id,body,author_id,post_id,created_at")
    .eq("post_id", id)
    .order("created_at", { ascending: false });

  let comments: CommentType[] = [];
  if (commentsRows?.length) {
    const cAuthorIds = Array.from(
      new Set(commentsRows.map((c) => c.author_id))
    );
    const { data: cauthors } = await supabase
      .from("profiles")
      .select("id,username,avatar_url,created_at")
      .in("id", cAuthorIds);
    const cmap = new Map((cauthors ?? []).map((a) => [a.id, a]));
    comments = commentsRows.map((c) => toComment(c, cmap.get(c.author_id)));
  }

  const post: Post = {
    ...base,
    author: author ? toUser(author) : undefined,
    imageUrls,
    comments,
  };
  return post;
}

export async function createPost(params: {
  title: string;
  content: string;
  files?: UploadPart[];
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    throw new Error("로그인이 만료되었어요. 다시 로그인 해 주세요.");

  const user = session.user;

  const { data: row, error: ierr } = await supabase
    .from("posts")
    .insert({
      title: params.title,
      content: params.content,
      author_id: user.id,
    })
    .select("id,title,content,author_id,created_at,updated_at")
    .single();
  if (ierr) throw ierr;

  const base = toPostBase(row);

  if (params.files?.length) {
    const paths: string[] = [];
    for (const f of params.files) {
      const path = `${user.id}/${f.name}`;
      const up = await supabase.storage
        .from("post_images")
        .upload(path, f.buffer, {
          upsert: false,
          contentType: f.type || "image/jpeg",
          cacheControl: "3600",
        });
      if (up.error) throw up.error;
      paths.push(path);
    }

    const { error: merr } = await supabase.from("post_images").insert(
      paths.map((path, idx) => ({
        post_id: base.id,
        author_id: user.id,
        path,
        sort: idx,
      }))
    );
    if (merr) throw merr;
  }

  return { ...base, imageUrls: [], comments: [] } as Post;
}

export async function updatePost(params: {
  id: string;
  title?: string;
  content?: string;
  addFiles?: UploadPart[];
  removePaths?: string[];
  reorderPaths?: string[];
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    throw new Error("로그인이 만료되었어요. 다시 로그인 해 주세요.");
  const user = session.user;

  if (params.title || params.content) {
    const { error: uerr } = await supabase
      .from("posts")
      .update({
        ...(params.title !== undefined ? { title: params.title } : {}),
        ...(params.content !== undefined ? { content: params.content } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("author_id", user.id);
    if (uerr) throw uerr;
  }

  if (params.removePaths?.length) {
    const rem = await supabase.storage
      .from("post_images")
      .remove(params.removePaths);
    if (rem.error) throw rem.error;

    const { error: derr } = await supabase
      .from("post_images")
      .delete()
      .in("path", params.removePaths)
      .eq("post_id", params.id)
      .eq("author_id", user.id);
    if (derr) throw derr;
  }

  if (params.reorderPaths?.length) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session!.user;

    const updates = params.reorderPaths.map((p, idx) => ({
      post_id: params.id,
      path: p,
      sort: idx,
      author_id: user.id,
    }));

    const { error: rerr } = await supabase
      .from("post_images")
      .upsert(updates, { onConflict: "post_id,path" });
    if (rerr) throw rerr;
  }

  if (params.addFiles?.length) {
    const { data: remained } = await supabase
      .from("post_images")
      .select("path")
      .eq("post_id", params.id)
      .order("sort", { ascending: true });
    const start = remained?.length ?? 0;

    const rows: {
      post_id: string;
      author_id: string;
      path: string;
      sort: number;
    }[] = [];
    for (const [i, f] of params.addFiles.entries()) {
      const path = `${user.id}/${f.name}`;
      const up = await supabase.storage
        .from("post_images")
        .upload(path, f.buffer, {
          contentType: f.type || "image/jpeg",
          upsert: false,
          cacheControl: "3600",
        });
      if (up.error) throw up.error;
      rows.push({
        post_id: params.id,
        author_id: user.id,
        path,
        sort: start + i,
      });
    }

    const { error: ierr } = await supabase.from("post_images").insert(rows);
    if (ierr) throw ierr;
  }

  return true;
}

export async function deletePost(id: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    throw new Error("로그인이 만료되었어요. 다시 로그인 해 주세요.");
  const user = session.user;

  const { data: imgs, error: ierr } = await supabase
    .from("post_images")
    .select("path")
    .eq("post_id", id);
  if (ierr) throw ierr;

  const paths = (imgs ?? []).map((r) => r.path);
  if (paths.length) {
    const rem = await supabase.storage.from("post_images").remove(paths);
    if (rem.error) throw rem.error;
  }

  const { error: perr } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);
  if (perr) throw perr;

  return true;
}
