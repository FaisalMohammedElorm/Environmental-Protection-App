import type { IComment } from "../../models/Comment";
import type { IUser } from "../../models/User";

export interface PublicComment {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

type PopulatedComment = IComment & { author: IUser };

export function serializeComment(comment: PopulatedComment): PublicComment {
  return {
    id: comment.id,
    authorName: comment.author.name,
    authorRole: comment.authorRole,
    body: comment.body,
    createdAt: comment.createdAt.toISOString()
  };
}
