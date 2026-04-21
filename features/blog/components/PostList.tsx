import { PostCard } from "./PostCard";
import type { Post } from "../types";

export function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">No posts yet.</p>
    );
  }
  return (
    <div className="divide-y">
      {posts.map((p) => (
        <PostCard key={p.permalink} post={p} />
      ))}
    </div>
  );
}
