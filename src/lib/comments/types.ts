export type ApiComment = {
  id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  title: string | null;
  status: string;
  author: {
    id: string;
    nickname: string | null;
  };
};
