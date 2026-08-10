export interface CommentRow {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  body: string;
  created_at: Date;
}

export interface PublicComment {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

export function serializeComment(row: CommentRow): PublicComment {
  return {
    id: row.id,
    authorName: row.author_name,
    authorRole: row.author_role,
    body: row.body,
    createdAt: row.created_at.toISOString()
  };
}
